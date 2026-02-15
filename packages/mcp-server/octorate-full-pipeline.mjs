#!/usr/bin/env node

/**
 * Full Octorate data pipeline: export + process.
 *
 * 1. Runs octorate-export-final-working.mjs to download reservations
 * 2. Processes the downloaded file into monthly aggregates
 * 3. Updates bookings_by_month.csv and net_value_by_month.csv
 *
 * Usage:
 *   node octorate-full-pipeline.mjs
 *
 * Prereqs:
 *   - Valid Octorate session in .secrets/octorate/storage-state.json
 *   - ExcelJS installed (pnpm install)
 */

import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DOWNLOAD_DIR = join(__dirname, ".tmp/octorate-downloads");
const OUTPUT_DIR = join(__dirname, "../../docs/business-os/strategy/BRIK/data");

async function findLatestDownload() {
  const files = await fs.readdir(DOWNLOAD_DIR);

  const xlsFiles = files.filter((f) => f.endsWith(".xls") || f.endsWith(".xlsx"));

  if (xlsFiles.length === 0) {
    throw new Error(`No Excel files found in ${DOWNLOAD_DIR}`);
  }

  // Get file stats and sort by modification time
  const fileStats = await Promise.all(
    xlsFiles.map(async (file) => {
      const path = join(DOWNLOAD_DIR, file);
      const stats = await fs.stat(path);
      return { file, path, mtime: stats.mtime };
    })
  );

  fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return fileStats[0].path;
}

async function main() {
  console.info("Octorate Full Pipeline");
  console.info("=====================\n");

  // Step 1: Export reservations
  console.info("Step 1: Downloading reservations from Octorate...\n");

  try {
    const { stdout, stderr } = await execAsync("node octorate-export-final-working.mjs", {
      cwd: __dirname,
    });

    if (stdout) console.info(stdout);
    if (stderr) console.error(stderr);
  } catch (err) {
    console.error("Export failed:", err.message);
    if (err.stdout) console.info(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }

  // Step 2: Find the downloaded file
  console.info("\nStep 2: Locating downloaded file...\n");

  const inputFile = await findLatestDownload();
  console.info(`Found: ${inputFile}\n`);

  // Step 3: Process bookings
  console.info("Step 3: Processing bookings data...\n");

  try {
    const { stdout, stderr } = await execAsync(
      `node octorate-process-bookings.mjs "${inputFile}" "${OUTPUT_DIR}"`,
      { cwd: __dirname }
    );

    if (stdout) console.info(stdout);
    if (stderr) console.error(stderr);
  } catch (err) {
    console.error("Processing failed:", err.message);
    if (err.stdout) console.info(err.stdout);
    if (err.stderr) console.error(err.stderr);
    process.exit(1);
  }

  console.info("\n✓ Pipeline complete!");
  console.info("\nUpdated files:");
  console.info(`  ${join(OUTPUT_DIR, "bookings_by_month.csv")}`);
  console.info(`  ${join(OUTPUT_DIR, "net_value_by_month.csv")}`);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
