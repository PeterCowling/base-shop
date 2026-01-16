#!/usr/bin/env node
/**
 * Recovery script to extract files from Claude transcripts
 *
 * This script reads all JSONL transcript files and extracts Write tool operations
 * to recover deleted files from apps/prime/
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';

const TRANSCRIPTS_DIR = '/Users/petercowling/.claude/projects/-Users-petercowling-base-shop';
const OUTPUT_BASE = '/Users/petercowling/base-shop';
const TARGET_PREFIX = '/Users/petercowling/base-shop/apps/prime/';

// Transcripts known to have Prime file writes
const TRANSCRIPT_FILES = [
  '817ec670-deaf-4064-a4f3-25694827149c.jsonl',
  '7529dd27-21dc-40be-aaa4-0a911798b776.jsonl',
  'cd3a4043-9fc7-48fe-a285-baf30f3296ee.jsonl',
  'e518ddd3-7047-4cfb-9ee7-6f85ed2a7745.jsonl',
  '179df474-48a2-43cb-8cc8-30dcea599a36.jsonl',
  '37ceef61-1f0a-4bea-aa20-a5b6b7aa367b.jsonl',
  '18dc7819-70c5-4c3f-abbb-7efeee6755ae.jsonl',
  '9281715c-d15d-4db2-b2c8-e1f10a14a7b9.jsonl',
  'b678273d-9868-4e9e-9585-1e0dac9eeae3.jsonl',
];

// Track all file writes with timestamps
const fileWrites = new Map(); // path -> { content, timestamp }

function extractWritesFromLine(line) {
  try {
    const data = JSON.parse(line);

    // Look for Write tool results in toolUseResult
    if (data.toolUseResult?.type === 'create' || data.toolUseResult?.type === 'update') {
      const filePath = data.toolUseResult.filePath;
      const content = data.toolUseResult.content;
      const timestamp = data.timestamp;

      if (filePath && content !== undefined && filePath.startsWith(TARGET_PREFIX)) {
        return { filePath, content, timestamp };
      }
    }

    // Also look in message content for Write tool inputs (backup approach)
    if (data.message?.content) {
      for (const item of data.message.content) {
        if (item.type === 'tool_use' && item.name === 'Write') {
          const input = item.input;
          if (input?.file_path?.startsWith(TARGET_PREFIX) && input?.content) {
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
  console.log(`Processing: ${filePath}`);
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
  console.log(`  Found ${count} Prime file writes`);
}

function writeRecoveredFiles() {
  console.log(`\nWriting ${fileWrites.size} recovered files...`);

  let written = 0;
  let errors = 0;

  for (const [filePath, data] of fileWrites) {
    try {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(filePath, data.content);
      written++;
      console.log(`  ✓ ${filePath.replace(TARGET_PREFIX, 'apps/prime/')}`);
    } catch (e) {
      console.error(`  ✗ ${filePath}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nRecovery complete: ${written} files written, ${errors} errors`);
}

// Main execution
console.log('=== Prime File Recovery Script ===\n');

for (const file of TRANSCRIPT_FILES) {
  const fullPath = join(TRANSCRIPTS_DIR, file);
  if (existsSync(fullPath)) {
    processTranscript(fullPath);
  } else {
    console.log(`Skipping (not found): ${file}`);
  }
}

console.log(`\nTotal unique files to recover: ${fileWrites.size}`);

writeRecoveredFiles();

// Print summary by directory
console.log('\n=== Files by Directory ===');
const byDir = new Map();
for (const filePath of fileWrites.keys()) {
  const relativePath = filePath.replace(TARGET_PREFIX, '');
  const dir = dirname(relativePath);
  byDir.set(dir, (byDir.get(dir) || 0) + 1);
}
const sortedDirs = [...byDir.entries()].sort((a, b) => b[1] - a[1]);
for (const [dir, count] of sortedDirs) {
  console.log(`  ${dir}: ${count} files`);
}
