#!/usr/bin/env tsx
/**
 * Fix all locale JSON files with unescaped quotes
 *
 * This script finds and fixes JSON files that have unescaped quotes within string values,
 * which breaks JSON parsing. It's a common issue after bulk translation operations.
 */

import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

function escapeQuotesInJsonString(value: string): string {
  // Replace any unescaped quotes with escaped quotes
  // But don't double-escape already escaped quotes
  return value.replace(/(?<!\\)"/g, '\\"');
}

function fixJsonFile(filePath: string): boolean {
  try {
    // First check if it's already valid
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      JSON.parse(content);
      return false; // Already valid
    } catch {
      // Needs fixing
    }

    // Strategy: Parse line by line and fix string values
    const lines = content.split('\n');
    const fixedLines: string[] = [];
    let fixed = false;

    for (const line of lines) {
      // Skip structural lines (braces, brackets)
      if (/^\s*[{}\[\],]\s*$/.test(line)) {
        fixedLines.push(line);
        continue;
      }

      // Match: "key": "value with potential "quotes"",
      const objectPropMatch = line.match(/^(\s*)"([^"]+)"\s*:\s*"(.*)"\s*(,?)\s*$/);
      if (objectPropMatch) {
        const [, indent, key, value, comma] = objectPropMatch;

        // Unescape first (to handle double-escaping), then re-escape properly
        const cleanValue = value.replace(/\\"/g, '"');
        const escapedValue = escapeQuotesInJsonString(cleanValue);

        if (escapedValue !== value) {
          fixed = true;
        }

        fixedLines.push(`${indent}"${key}": "${escapedValue}"${comma}`);
        continue;
      }

      // Match: "array element with potential "quotes"",
      const arrayElemMatch = line.match(/^(\s*)"(.*)"\s*(,?)\s*$/);
      if (arrayElemMatch && !line.includes(':')) {
        const [, indent, value, comma] = arrayElemMatch;

        const cleanValue = value.replace(/\\"/g, '"');
        const escapedValue = escapeQuotesInJsonString(cleanValue);

        if (escapedValue !== value) {
          fixed = true;
        }

        fixedLines.push(`${indent}"${escapedValue}"${comma}`);
        continue;
      }

      // No match, keep original
      fixedLines.push(line);
    }

    if (fixed) {
      const newContent = fixedLines.join('\n');

      // Validate the fix
      try {
        JSON.parse(newContent);
        fs.writeFileSync(filePath, newContent, 'utf8');
        return true;
      } catch (e) {
        console.error(`  ⚠ Fix validation failed for ${filePath}: ${e}`);
        return false;
      }
    }

    return false;
  } catch (e) {
    console.error(`  ✗ Error processing ${filePath}: ${e}`);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing all locale JSON files with unescaped quotes...\n');

  // Find all guide content JSON files
  const pattern = 'src/locales/*/guides/content/*.json';
  const files = glob.sync(pattern, { cwd: process.cwd() });

  console.log(`Found ${files.length} files to check\n`);

  let fixedCount = 0;
  const stillBroken: string[] = [];

  for (const file of files) {
    const fixed = fixJsonFile(file);
    if (fixed) {
      fixedCount++;
      if (fixedCount <= 20) {
        const locale = file.split('/')[2];
        const filename = path.basename(file);
        console.log(`✓ Fixed: ${locale}/${filename}`);
      }
    }

    // Verify it's now valid
    try {
      const content = fs.readFileSync(file, 'utf8');
      JSON.parse(content);
    } catch {
      stillBroken.push(file);
    }
  }

  console.log(`\n✅ Fixed ${fixedCount} files`);

  if (stillBroken.length > 0) {
    console.log(`\n⚠ ${stillBroken.length} files still broken (need manual review):`);
    stillBroken.slice(0, 10).forEach(f => console.log(`  ${f}`));
  } else {
    console.log('\n✅ All files are now valid JSON!');
  }
}

main().catch(console.error);
