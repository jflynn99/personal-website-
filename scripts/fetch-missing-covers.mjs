#!/usr/bin/env node

/**
 * Fetch missing book covers from Google Books API.
 *
 * Usage:
 *   node scripts/fetch-missing-covers.mjs [--dry-run]
 *
 * This script:
 * 1. Scans all MDX files in content/books/
 * 2. Finds books without a coverImage in frontmatter
 * 3. Searches Google Books API by title + author
 * 4. Downloads the cover image to public/images/books/
 * 5. Updates the MDX frontmatter with the new coverImage path
 *
 * The Google Books API doesn't require an API key for basic searches
 * (limit ~1000 requests/day).
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BOOKS_DIR = path.join(ROOT, "content", "books");
const IMAGES_DIR = path.join(ROOT, "public", "images", "books");

const DRY_RUN = process.argv.includes("--dry-run");

// Rate limit: wait between API requests to be polite
const DELAY_MS = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length).trim();
  const frontmatter = {};

  for (const line of frontmatterStr.split("\n")) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;
    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    // Parse numbers
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function buildFrontmatter(fields) {
  const lines = ["---"];
  // Maintain a sensible order
  const order = ["title", "author", "rating", "dateRead", "coverImage", "isbn", "goodreadsUrl"];
  const keys = [...new Set([...order.filter((k) => k in fields), ...Object.keys(fields)])];

  for (const key of keys) {
    const value = fields[key];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString()));
          } catch (e) {
            reject(e);
          }
        });
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const request = (url) => {
      const protocol = url.startsWith("https") ? https : require("http");
      const getter = url.startsWith("https") ? https : require("http");
      getter
        .get(url, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            request(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", reject);
        })
        .on("error", reject);
    };
    request(url);
  });
}

async function searchGoogleBooks(title, author) {
  // Build search query: intitle + inauthor for better accuracy
  const query = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;

  try {
    const data = await fetchJson(url);
    if (!data.items || data.items.length === 0) return null;

    const book = data.items[0];
    const imageLinks = book.volumeInfo?.imageLinks;
    if (!imageLinks) return null;

    // Prefer larger images: extraLarge > large > medium > small > thumbnail
    const imageUrl =
      imageLinks.extraLarge ||
      imageLinks.large ||
      imageLinks.medium ||
      imageLinks.small ||
      imageLinks.thumbnail;

    if (!imageUrl) return null;

    // Google Books returns http URLs, upgrade to https and remove zoom/edge params for larger image
    return imageUrl
      .replace("http://", "https://")
      .replace("&edge=curl", "")
      .replace("zoom=1", "zoom=0");
  } catch {
    return null;
  }
}

async function downloadCover(imageUrl, slug) {
  try {
    const data = await fetchImage(imageUrl);
    // Skip tiny placeholder images
    if (data.length < 1000) return null;

    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);
    fs.writeFileSync(imagePath, data);
    return `/images/books/${slug}.jpg`;
  } catch {
    return null;
  }
}

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN - no files will be modified\n" : "");

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const files = fs.readdirSync(BOOKS_DIR).filter((f) => f.endsWith(".mdx"));
  const missing = [];

  // Find books without covers
  for (const file of files) {
    const filePath = path.join(BOOKS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(content);

    if (!frontmatter.coverImage) {
      const slug = file.replace(".mdx", "");
      missing.push({ file, filePath, slug, frontmatter, body });
    }
  }

  console.log(`Found ${missing.length} books without covers.\n`);

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < missing.length; i++) {
    const { file, filePath, slug, frontmatter, body } = missing[i];
    const { title, author } = frontmatter;

    process.stdout.write(
      `[${i + 1}/${missing.length}] "${title}" by ${author}... `
    );

    const imageUrl = await searchGoogleBooks(title, author);

    if (!imageUrl) {
      console.log("❌ not found on Google Books");
      notFound++;
      await sleep(DELAY_MS);
      continue;
    }

    if (DRY_RUN) {
      console.log(`✅ found: ${imageUrl}`);
      found++;
      await sleep(DELAY_MS);
      continue;
    }

    const coverPath = await downloadCover(imageUrl, slug);

    if (!coverPath) {
      console.log("❌ download failed");
      notFound++;
      await sleep(DELAY_MS);
      continue;
    }

    // Update MDX file with new coverImage
    frontmatter.coverImage = coverPath;
    const newContent = body
      ? `${buildFrontmatter(frontmatter)}\n\n${body}\n`
      : `${buildFrontmatter(frontmatter)}\n`;

    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(`✅ saved`);
    found++;

    await sleep(DELAY_MS);
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done! Found covers for ${found}/${missing.length} books.`);
  if (notFound > 0) {
    console.log(`${notFound} books still need covers (try Open Library or manual search).`);
  }
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
