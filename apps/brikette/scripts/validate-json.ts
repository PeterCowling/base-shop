#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- Script to validate JSON files */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const LOCALES_ROOT = path.resolve(__dirname, "../src/locales");
const TARGET_LOCALES = ["vi", "hi", "ar", "ja", "ko", "it"];

function validateJson(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, "utf8");
    JSON.parse(content);
    return true;
  } catch (error) {
    console.error(`Invalid JSON in ${filePath}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

function walkDirectory(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

let allValid = true;
let totalFiles = 0;

for (const locale of TARGET_LOCALES) {
  const localeDir = path.join(LOCALES_ROOT, locale);
  const jsonFiles = walkDirectory(localeDir);

  console.log(`Validating ${locale} (${jsonFiles.length} files)...`);

  for (const file of jsonFiles) {
    totalFiles++;
    if (!validateJson(file)) {
      allValid = false;
    }
  }
}

if (allValid) {
  console.log(`\n✓ All ${totalFiles} JSON files are valid!`);
} else {
  console.error("\n✗ Some JSON files have errors.");
  process.exit(1);
}
