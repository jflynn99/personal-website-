#!/usr/bin/env node

/**
 * Migrate Goodreads CSV export to MDX book files.
 *
 * Usage:
 *   node scripts/migrate-goodreads.mjs path/to/goodreads_library_export.csv
 *
 * This script:
 * 1. Reads the Goodreads CSV export
 * 2. Generates a slug from each book title
 * 3. Fetches cover images from Open Library by ISBN
 * 4. Writes MDX files to content/books/
 * 5. Saves cover images to public/images/books/
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BOOKS_DIR = path.join(ROOT, "content", "books");
const IMAGES_DIR = path.join(ROOT, "public", "images", "books");

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const request = (url) => {
      https.get(url, (res) => {
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
      }).on("error", reject);
    };
    request(url);
  });
}

async function fetchCover(isbn, slug) {
  if (!isbn) return null;

  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  try {
    const data = await fetchImage(url);
    // Open Library returns a tiny 1x1 placeholder if no cover exists
    if (data.length < 1000) return null;

    const imagePath = path.join(IMAGES_DIR, `${slug}.jpg`);
    fs.writeFileSync(imagePath, data);
    return `/images/books/${slug}.jpg`;
  } catch {
    return null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function buildFrontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "number") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/migrate-goodreads.mjs <path-to-csv>");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  fs.mkdirSync(BOOKS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  // Filter to only "read" books with a rating
  const readBooks = records.filter(
    (r) => r["Exclusive Shelf"] === "read" && parseInt(r["My Rating"]) > 0
  );

  console.log(`Found ${readBooks.length} rated books to migrate.`);

  const slugCounts = new Map();

  for (let i = 0; i < readBooks.length; i++) {
    const row = readBooks[i];
    const title = row["Title"] || "";
    const author = row["Author"] || "";
    const rating = parseInt(row["My Rating"]) || 0;
    const isbn = (row["ISBN13"] || row["ISBN"] || "").replace(/[="]/g, "");
    const dateRead = formatDate(row["Date Read"] || row["Date Added"]);
    const review = (row["My Review"] || "").trim();
    const bookId = row["Book Id"] || "";

    let slug = slugify(title);
    if (!slug) slug = `book-${i}`;

    // Handle duplicate slugs
    const count = slugCounts.get(slug) || 0;
    slugCounts.set(slug, count + 1);
    if (count > 0) slug = `${slug}-${count}`;

    const goodreadsUrl = bookId
      ? `https://www.goodreads.com/book/show/${bookId}`
      : "";

    console.log(`[${i + 1}/${readBooks.length}] ${title} — fetching cover...`);
    const coverImage = await fetchCover(isbn, slug);

    const frontmatter = buildFrontmatter({
      title,
      author,
      rating,
      dateRead,
      coverImage,
      isbn: isbn || undefined,
      goodreadsUrl: goodreadsUrl || undefined,
    });

    const mdxContent = review
      ? `${frontmatter}\n\n${review}\n`
      : `${frontmatter}\n`;

    const filePath = path.join(BOOKS_DIR, `${slug}.mdx`);
    fs.writeFileSync(filePath, mdxContent, "utf8");
  }

  console.log(`\nDone! Migrated ${readBooks.length} books to ${BOOKS_DIR}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
