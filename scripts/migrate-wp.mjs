import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import TurndownService from "turndown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ROOT, "content", "blog");
const PROJECTS_DIR = path.join(ROOT, "content", "projects");
const IMAGES_DIR = path.join(ROOT, "public", "images", "blog");

const API_URL =
  "https://public-api.wordpress.com/rest/v1.1/sites/aibabysteps.wordpress.com/posts/?number=100";

// Posts to skip (by WordPress ID)
const SKIP_IDS = new Set([
  92, // Taking Your First Baby Steps with LLMs
  63, // Top Blogs, Newsletters & Voices
  49, // Beyond Google: How AI is Redefining Search
]);

// Posts to create as projects (by WordPress ID)
const PROJECT_IDS = new Set([
  205, // Vibe coding with my 5-year-old
  193, // Four AIs Walk Into a Portfolio Project
  130, // Building with Amazon Bedrock
]);

// Tag mapping — normalize messy WordPress tags to clean ones
const TAG_MAP = {
  "artificial-intelligence": "AI",
  "chatgpt": "ChatGPT",
  "product-management": "Product",
  "product": "Product",
  "claude-code": "Claude Code",
  "claude": "Claude",
  "llm": "AI",
  "mental-health": "Health",
  "nutrition": "Health",
  "exercise": "Fitness",
  "books": "Books",
  "book-review": "Books",
  "philosophy": "Philosophy",
  "psychology": "Philosophy",
  "psycology": "Philosophy",
  "spirituality": "Philosophy",
  "consciousness": "Philosophy",
  "stoic": "Philosophy",
  "science": "Science",
  "biology": "Science",
  "technology": null, // too generic, skip
  "writing": null,
  "internet": null,
  "links": null,
  "blog": null,
  "introduction": null,
  "life": null,
  "emotion": null,
  "meaning": null,
  "development": null,
  "inequality": null,
  "gdp": null,
  "newsletters": null,
  "work-trip": null,
  "summer": null,
  "great-ideas-travel": null,
  "pacesetters": null,
  "kondo": null,
  "sticky": null,
  "andrej-karpathy": null,
  "calude code": "Claude Code",
};

// Tech tags for project posts
const PROJECT_TECH = {
  205: ["Bolt", "Lovable", "AI", "Vibe Coding"],
  193: ["Claude", "Gemini", "ChatGPT", "Lovable"],
  130: ["AWS Bedrock", "AI", "Python"],
};

function decodeHtmlEntities(str) {
  return str
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function slugify(title) {
  return decodeHtmlEntities(title)
    .toLowerCase()
    .replace(/[''""]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function cleanTags(wpTags) {
  const tagNames = Object.keys(wpTags || {});
  const cleaned = new Set();

  for (const tag of tagNames) {
    const lower = tag.toLowerCase();
    if (lower in TAG_MAP) {
      const mapped = TAG_MAP[lower];
      if (mapped) cleaned.add(mapped);
    } else {
      // Capitalize first letter of each word
      const capitalized = tag
        .split(/[-\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      if (capitalized.length > 1) cleaned.add(capitalized);
    }
  }

  return [...cleaned].sort();
}

function makeDescription(content, maxLen = 160) {
  // Strip HTML, grab first meaningful sentence
  const text = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstSentence = text.match(/^(.+?[.!?])\s/);
  const desc = firstSentence ? firstSentence[1] : text.slice(0, maxLen);
  return desc.length > maxLen ? desc.slice(0, maxLen - 3) + "..." : desc;
}

async function downloadImage(url, slug) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    const filename = `${slug}${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return `/images/blog/${filename}`;
  } catch {
    return null;
  }
}

function findFeaturedImage(post) {
  // Try featured_image field first
  if (post.featured_image) return post.featured_image;
  // Try post_thumbnail
  if (post.post_thumbnail?.URL) return post.post_thumbnail.URL;
  // Try first image in attachments
  const attachments = post.attachments || {};
  for (const att of Object.values(attachments)) {
    if (att.mime_type?.startsWith("image/")) return att.URL;
  }
  return null;
}

async function main() {
  // Ensure directories exist
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  console.log("Fetching posts from WordPress API...");
  const response = await fetch(API_URL);
  const data = await response.json();
  console.log(`Found ${data.found} posts`);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Remove WordPress-specific elements
  turndown.remove(["script", "style", "iframe"]);

  // Handle WordPress image captions
  turndown.addRule("wpCaption", {
    filter: (node) =>
      node.classList && node.classList.contains("wp-caption"),
    replacement: (content) => content,
  });

  // Handle figures
  turndown.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const img = node.querySelector("img");
      const caption = node.querySelector("figcaption");
      if (img) {
        const alt = caption?.textContent || img.alt || "";
        return `\n\n![${alt}](${img.src})\n\n`;
      }
      return content;
    },
  });

  let blogCount = 0;
  let projectCount = 0;
  let skipCount = 0;

  for (const post of data.posts) {
    if (SKIP_IDS.has(post.ID)) {
      console.log(`  SKIP: ${post.title}`);
      skipCount++;
      continue;
    }

    const cleanTitle = decodeHtmlEntities(post.title).trim();
    const slug = slugify(cleanTitle);
    const date = post.date.split("T")[0];
    const isProject = PROJECT_IDS.has(post.ID);

    // Convert HTML to Markdown
    let markdown = turndown.turndown(post.content || "");

    // Clean up excessive newlines
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    // Fix common HTML entity leftovers
    markdown = markdown
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'")
      .replace(/&#8220;/g, '"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8211;/g, "–")
      .replace(/&#8212;/g, "—")
      .replace(/&#8230;/g, "…");

    // Escape curly braces for MDX (they're JSX expressions otherwise)
    markdown = markdown.replace(/(?<!\\)\{/g, "\\{").replace(/(?<!\\)\}/g, "\\}");

    // Download featured image
    const featuredImageUrl = findFeaturedImage(post);
    let imagePath = null;
    if (featuredImageUrl) {
      console.log(`  Downloading image for: ${post.title}`);
      imagePath = await downloadImage(featuredImageUrl, slug);
    }

    const description = makeDescription(post.content);

    if (isProject) {
      const tech = PROJECT_TECH[post.ID] || ["AI"];
      const frontmatter = [
        "---",
        `title: "${cleanTitle.replace(/"/g, '\\"')}"`,
        `description: "${description.replace(/"/g, '\\"')}"`,
        imagePath ? `image: "${imagePath}"` : null,
        "tech:",
        ...tech.map((t) => `  - ${t}`),
        "featured: false",
        `order: ${10 + projectCount}`,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      const outPath = path.join(PROJECTS_DIR, `${slug}.mdx`);
      fs.writeFileSync(outPath, `${frontmatter}\n\n${markdown}\n`);
      console.log(`  PROJECT: ${slug}.mdx`);
      projectCount++;
    } else {
      const tags = cleanTags(post.tags);
      const frontmatter = [
        "---",
        `title: "${cleanTitle.replace(/"/g, '\\"')}"`,
        `date: "${date}"`,
        `description: "${description.replace(/"/g, '\\"')}"`,
        imagePath ? `image: "${imagePath}"` : null,
        tags.length > 0 ? "tags:" : null,
        ...tags.map((t) => `  - ${t}`),
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      const outPath = path.join(BLOG_DIR, `${slug}.mdx`);
      fs.writeFileSync(outPath, `${frontmatter}\n\n${markdown}\n`);
      console.log(`  BLOG: ${slug}.mdx`);
      blogCount++;
    }
  }

  console.log(`\nDone! Created ${blogCount} blog posts, ${projectCount} projects, skipped ${skipCount}`);
}

main().catch(console.error);
