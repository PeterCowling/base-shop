#!/usr/bin/env node
/**
 * Recovery script to extract files from Claude transcripts
 *
 * This script reads ALL JSONL transcript files and extracts Write tool operations
 * to recover deleted files from the entire base-shop monorepo.
 *
 * Affected apps identified:
 * - apps/prime (0 TypeScript files)
 * - apps/reception (0 TypeScript files)
 * - And potentially others
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

const TRANSCRIPTS_DIR = '/Users/petercowling/.claude/projects/-Users-petercowling-base-shop';
const OUTPUT_BASE = '/Users/petercowling/base-shop';

// Recovery targets - files under these paths will be recovered
const TARGET_PREFIXES = [
  '/Users/petercowling/base-shop/apps/',
  '/Users/petercowling/base-shop/packages/',
  '/Users/petercowling/base-shop/scripts/',
  '/Users/petercowling/base-shop/tests/',
  '/Users/petercowling/base-shop/docs/',
];

// Files/patterns to skip (already exist or shouldn't be overwritten)
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /\.turbo\//,
  /dist\//,
  /build\//,
  /coverage\//,
  /\.git\//,
];

// Track all file writes with timestamps
const fileWrites = new Map(); // path -> { content, timestamp }

function shouldRecover(filePath) {
  // Check if path matches any target prefix
  const matchesTarget = TARGET_PREFIXES.some(prefix => filePath.startsWith(prefix));
  if (!matchesTarget) return false;

  // Check if should be skipped
  const shouldSkip = SKIP_PATTERNS.some(pattern => pattern.test(filePath));
  if (shouldSkip) return false;

  return true;
}

function extractWritesFromLine(line) {
  try {
    const data = JSON.parse(line);

    // Look for Write tool results in toolUseResult
    if (data.toolUseResult?.type === 'create' || data.toolUseResult?.type === 'update') {
      const filePath = data.toolUseResult.filePath;
      const content = data.toolUseResult.content;
      const timestamp = data.timestamp;

      if (filePath && content !== undefined && shouldRecover(filePath)) {
        return { filePath, content, timestamp };
      }
    }

    // Also look in message content for Write tool inputs (backup approach)
    if (data.message?.content) {
      for (const item of data.message.content) {
        if (item.type === 'tool_use' && item.name === 'Write') {
          const input = item.input;
          if (input?.file_path && input?.content && shouldRecover(input.file_path)) {
            return {
              filePath: input.file_path,
              content: input.content,
              timestamp: data.timestamp
            };
          }
        }
      }
    }
  } catch (e) {
    // Skip malformed lines
  }
  return null;
}

function processTranscript(filePath) {
  const fileName = filePath.split('/').pop();
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  let count = 0;
  for (const line of lines) {
    const write = extractWritesFromLine(line);
    if (write) {
      const existing = fileWrites.get(write.filePath);
      // Keep the latest version based on timestamp
      if (!existing || write.timestamp > existing.timestamp) {
        fileWrites.set(write.filePath, {
          content: write.content,
          timestamp: write.timestamp
        });
        count++;
      }
    }
  }

  if (count > 0) {
    console.log(`  ${fileName}: ${count} file writes found`);
  }
  return count;
}

function writeRecoveredFiles(dryRun = false) {
  console.log(`\n${dryRun ? '[DRY RUN] Would write' : 'Writing'} ${fileWrites.size} recovered files...`);

  let written = 0;
  let skipped = 0;
  let errors = 0;

  for (const [filePath, data] of fileWrites) {
    try {
      // Check if file already exists with content
      if (existsSync(filePath)) {
        const existingContent = readFileSync(filePath, 'utf-8');
        if (existingContent.trim().length > 0) {
          // File exists and has content - skip unless it's just a stub
          if (existingContent.length > 100) {
            skipped++;
            continue;
          }
        }
      }

      if (!dryRun) {
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        writeFileSync(filePath, data.content);
      }
      written++;

      const relativePath = filePath.replace(OUTPUT_BASE + '/', '');
      console.log(`  ✓ ${relativePath}`);
    } catch (e) {
      console.error(`  ✗ ${filePath}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Recovery summary:`);
  console.log(`  Files written: ${written}`);
  console.log(`  Files skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

// Main execution
console.log('=== Full Monorepo File Recovery Script ===\n');
console.log('Scanning all transcripts for file writes...\n');

// Get all transcript files
const allTranscripts = readdirSync(TRANSCRIPTS_DIR)
  .filter(f => f.endsWith('.jsonl'))
  .map(f => join(TRANSCRIPTS_DIR, f));

console.log(`Found ${allTranscripts.length} transcript files\n`);

let totalWrites = 0;
for (const transcript of allTranscripts) {
  totalWrites += processTranscript(transcript);
}

console.log(`\nTotal file write operations found: ${totalWrites}`);
console.log(`Unique files to recover: ${fileWrites.size}`);

// Print summary by app/package
console.log('\n=== Files by App/Package ===');
const byApp = new Map();
for (const filePath of fileWrites.keys()) {
  const relativePath = filePath.replace(OUTPUT_BASE + '/', '');
  const parts = relativePath.split('/');
  const category = parts.slice(0, 2).join('/');
  byApp.set(category, (byApp.get(category) || 0) + 1);
}
const sortedApps = [...byApp.entries()].sort((a, b) => b[1] - a[1]);
for (const [app, count] of sortedApps) {
  console.log(`  ${app}: ${count} files`);
}

// Check for --dry-run flag
const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  console.log('\n[DRY RUN MODE - No files will be written]');
}

// Write files
writeRecoveredFiles(dryRun);

if (dryRun) {
  console.log('\nTo actually write files, run without --dry-run flag');
}
