#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- Script to export translation issues */
import { writeFileSync } from "node:fs";
import path from "node:path";

// Import the test logic
import { collectIssuesForFileFilter } from "../src/test/content-readiness/i18n/helpers/collectIssues.js";

const OUTPUT_PATH = path.resolve(__dirname, "translation-issues.json");

console.log("Collecting all translation issues...\n");

// Collect all issues (both guide and non-guide content)
const allIssues = collectIssuesForFileFilter(() => true);

console.log(`Found ${allIssues.length} total issues\n`);

// Group by issue type
const byKind = allIssues.reduce<Record<string, number>>((acc, issue) => {
  acc[issue.kind] = (acc[issue.kind] ?? 0) + 1;
  return acc;
}, {});

console.log("Issues by type:");
Object.entries(byKind)
  .sort((a, b) => b[1] - a[1])
  .forEach(([kind, count]) => {
    console.log(`  ${kind}: ${count}`);
  });

console.log("\n");

// Group by locale
const byLocale = allIssues.reduce<Record<string, number>>((acc, issue) => {
  acc[issue.locale] = (acc[issue.locale] ?? 0) + 1;
  return acc;
}, {});

console.log("Issues by locale:");
Object.entries(byLocale)
  .sort((a, b) => b[1] - a[1])
  .forEach(([locale, count]) => {
    console.log(`  ${locale}: ${count}`);
  });

// Write to JSON
writeFileSync(OUTPUT_PATH, JSON.stringify(allIssues, null, 2) + "\n", "utf8");

console.log(`\n✓ Exported ${allIssues.length} issues to ${OUTPUT_PATH}`);
