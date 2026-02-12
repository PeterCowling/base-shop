#!/usr/bin/env -S npx tsx
/**
 * Generates a JSON snapshot of guide manifest entries for cross-app consumption.
 *
 * Output: src/data/guides/guide-manifest-snapshot.json
 *
 * This snapshot is used by business-os to access manifest data without
 * needing to import brikette's TypeScript modules directly.
 *
 * Usage: pnpm --filter brikette generate:manifest-snapshot
 */
import fs from "fs";
import path from "path";

// We import the manifest module which triggers all entries to be parsed
import { listGuideManifestEntries } from "../src/routes/guides/guide-manifest";

const entries = listGuideManifestEntries();

const output = {
  generatedAt: new Date().toISOString(),
  count: entries.length,
  entries,
};

const outputPath = path.resolve(__dirname, "../src/data/guides/guide-manifest-snapshot.json");
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n", "utf8");

console.info(`Generated manifest snapshot: ${entries.length} entries → ${outputPath}`);
