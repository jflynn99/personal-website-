#!/usr/bin/env node

/**
 * Converts habit tracking CSV data to yearly JSON files.
 *
 * Usage:
 *   node scripts/convert-habits-csv.mjs <input.csv>
 *
 * Output:
 *   public/data/habits-{year}.json (one file per year found in data)
 *
 * Expected CSV columns (others will be ignored):
 *   - Timestamp: Date in M/D/YYYY format
 *   - Sleep quality: 1-5 rating
 *   - Workout: Categorical (e.g., "Gym", "Run", "No")
 *   - Coffee count: Number
 *   - Meditation?: Yes/No
 *   - Bedtime reading?: Yes/No
 *   - Olive oil?: Yes/No
 *   - Shower: Categorical (e.g., "Cold", "Hot", "Both")
 *   - Alcohol: Yes/No
 *   - Phone time: Minutes
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Columns to keep (everything else is stripped)
const COLUMNS_TO_KEEP = [
  "Timestamp",
  "Sleep quality",
  "Workout",
  "Coffee count",
  "Meditation?",
  "Bedtime reading?",
  "Olive oil?",
  "Shower",
  "Alcohol",
  "Phone time",
];

function parseCSV(content) {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header with quote handling
  const parseRow = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);

  return { headers, rows };
}

function convertToJSON(csvContent) {
  const { headers, rows } = parseCSV(csvContent);

  // Find indices for columns we want to keep
  const columnIndices = {};
  COLUMNS_TO_KEEP.forEach((col) => {
    const idx = headers.indexOf(col);
    if (idx !== -1) {
      columnIndices[col] = idx;
    }
  });

  if (!("Timestamp" in columnIndices)) {
    throw new Error("CSV must have a 'Timestamp' column");
  }

  // Group data by year
  const dataByYear = {};

  rows.forEach((row) => {
    const timestamp = row[columnIndices["Timestamp"]];
    if (!timestamp) return;

    // Parse M/D/YYYY format
    const datePart = timestamp.split(" ")[0];
    const [month, day, year] = datePart.split("/").map(Number);
    if (!month || !day || !year) return;

    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (!dataByYear[year]) {
      dataByYear[year] = {};
    }

    const dayData = {};
    Object.entries(columnIndices).forEach(([colName, idx]) => {
      if (colName !== "Timestamp" && row[idx]) {
        dayData[colName] = row[idx];
      }
    });

    dataByYear[year][dateKey] = dayData;
  });

  return dataByYear;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: node scripts/convert-habits-csv.mjs <input.csv>");
    console.log("");
    console.log("Converts habit tracking CSV to yearly JSON files.");
    console.log("Output: public/data/habits-{year}.json");
    process.exit(1);
  }

  const inputPath = args[0];

  try {
    const csvContent = readFileSync(inputPath, "utf-8");
    const dataByYear = convertToJSON(csvContent);

    // Ensure output directory exists
    const outputDir = join(__dirname, "..", "public", "data");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write each year's data to a separate file
    const years = Object.keys(dataByYear).sort();
    years.forEach((year) => {
      const outputPath = join(outputDir, `habits-${year}.json`);
      const daysCount = Object.keys(dataByYear[year]).length;
      writeFileSync(outputPath, JSON.stringify(dataByYear[year], null, 2));
      console.log(`✓ Written ${outputPath} (${daysCount} days)`);
    });

    console.log("");
    console.log(`Done! Created ${years.length} file(s) for years: ${years.join(", ")}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
