#!/usr/bin/env node
/**
 * Unified Recovery Script - January 14, 2026
 *
 * Recovers files from Claude and Codex transcripts by replaying ALL operations
 * (writes, patches, deletes, renames) in strict chronological order.
 *
 * Usage:
 *   node scripts/unified-recovery.mjs --dry-run    # Preview without writing
 *   node scripts/unified-recovery.mjs              # Execute recovery
 *   node scripts/unified-recovery.mjs --verbose    # Verbose output
 *   node scripts/unified-recovery.mjs --strict     # Fail on any patch issue
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { execSync } from 'child_process';

// ========================================
// CONFIGURATION
// ========================================

const REPO_ROOT = '/Users/petercowling/base-shop';
const CLAUDE_TRANSCRIPTS_DIR = '/Users/petercowling/.claude/projects/-Users-petercowling-base-shop';
const CODEX_ARCHIVED_DIR = '/Users/petercowling/.codex/archived_sessions';
const CODEX_SESSIONS_DIR = '/Users/petercowling/.codex/sessions';

// Cutoff: 2026-01-14T11:52:00.000Z (12:52 CET) - 12 seconds before destructive git reset
const CUTOFF = new Date('2026-01-14T11:52:00.000Z');

// ========================================
// HELPER FUNCTIONS
// ========================================

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
  } catch (e) {
    throw new Error(`Command failed: ${command}\n${e.message}`);
  }
}

/**
 * Recursively find all JSONL files in a directory (handles date subfolders)
 */
function findJsonlFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        // Recurse into subdirectories (handles date folders like 2026-01-14/)
        results.push(...findJsonlFiles(fullPath));
      } else if (entry.endsWith('.jsonl')) {
        results.push(fullPath);
      }
    } catch (e) {
      // Skip inaccessible entries
    }
  }
  return results;
}

/**
 * Parse file arguments from a shell command string
 * Handles: quoted paths, single quotes, multiple files
 */
function parseFileArguments(argsString) {
  const args = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === ' ' && !inDoubleQuote && !inSingleQuote) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      continue;
    }

    if (char === '\\' && i + 1 < argsString.length) {
      const nextChar = argsString[i + 1];
      if (nextChar === '"' || nextChar === "'" || nextChar === ' ' || nextChar === '\\') {
        current += nextChar;
        i++;
        continue;
      }
    }

    current += char;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}

/**
 * Parse content from a Codex "Add File" block
 */
function parseAddFileContent(block) {
  const lines = block.split('\n');
  const contentLines = [];
  const hasMarkers = lines.some(line => line.startsWith('@@'));
  let inContent = !hasMarkers;
  let passedHeader = false;

  for (const line of lines) {
    if (line.startsWith('*** ')) {
      passedHeader = true;
      continue;
    }

    if (hasMarkers && line.startsWith('@@')) {
      inContent = true;
      continue;
    }

    if (!passedHeader) continue;

    if (!hasMarkers || inContent) {
      if (line.startsWith('+')) {
        contentLines.push(line.slice(1));
      } else if (line.startsWith(' ')) {
        contentLines.push(line.slice(1));
      } else if (line === '' && contentLines.length > 0) {
        contentLines.push('');
      }
    }
  }

  return contentLines.join('\n');
}

/**
 * Parse a Codex apply_patch block into clean diff hunks
 */
function parseCodexPatchBlock(block) {
  const hunks = [];
  const lines = block.split('\n');
  let currentHunk = null;

  for (const line of lines) {
    if (line.startsWith('*** ')) continue;

    if (line.startsWith('@@')) {
      if (currentHunk && (currentHunk.oldLines.length > 0 || currentHunk.newLines.length > 0)) {
        hunks.push(currentHunk);
      }

      const lineNumMatch = line.match(/@@ -(\d+)(?:,\d+)? \+\d+/);
      const oldStart = lineNumMatch ? parseInt(lineNumMatch[1], 10) : null;
      currentHunk = { oldLines: [], newLines: [], oldStart };
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('-')) {
      currentHunk.oldLines.push(line.slice(1));
    } else if (line.startsWith('+')) {
      currentHunk.newLines.push(line.slice(1));
    } else if (line.startsWith(' ')) {
      currentHunk.oldLines.push(line.slice(1));
      currentHunk.newLines.push(line.slice(1));
    }
  }

  if (currentHunk && (currentHunk.oldLines.length > 0 || currentHunk.newLines.length > 0)) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Apply Codex diff hunks to base content
 * In strict mode, any failed hunk is a fatal error
 */
function applyCodexDiff(baseContent, hunks, options = {}) {
  const { strict = false } = options;
  let content = baseContent;
  const rejectedHunks = [];
  let lineOffset = 0;

  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i];
    const searchPattern = hunk.oldLines.join('\n');
    const replacement = hunk.newLines.join('\n');

    // Handle empty oldLines (pure addition / insert-only hunk)
    if (hunk.oldLines.length === 0) {
      if (hunk.oldStart !== null && hunk.newLines.length > 0) {
        const adjustedLine = hunk.oldStart + lineOffset;
        const contentLines = content.split('\n');
        const insertLineIdx = Math.max(0, Math.min(adjustedLine - 1, contentLines.length));
        const finalIdx = adjustedLine === 0 ? 0 : insertLineIdx;
        contentLines.splice(finalIdx, 0, ...hunk.newLines);
        content = contentLines.join('\n');
        lineOffset += hunk.newLines.length;
        continue;
      } else if (hunk.newLines.length > 0) {
        content = content + '\n' + hunk.newLines.join('\n');
        lineOffset += hunk.newLines.length;
        continue;
      } else {
        continue;
      }
    }

    // Find ALL occurrences of the pattern
    const occurrences = [];
    let searchIdx = 0;
    while (true) {
      const idx = content.indexOf(searchPattern, searchIdx);
      if (idx === -1) break;
      occurrences.push(idx);
      searchIdx = idx + 1;
    }

    if (occurrences.length === 0) {
      rejectedHunks.push({
        index: i,
        reason: 'PATTERN_NOT_FOUND',
        searchPattern: searchPattern.substring(0, 100)
      });
      // In strict mode, immediately fail
      if (strict) {
        return { success: false, error: `Hunk ${i} failed: pattern not found`, rejectedHunks };
      }
      continue;
    }

    // Select which occurrence to patch
    let targetIdx;

    if (occurrences.length === 1) {
      targetIdx = occurrences[0];
    } else {
      // FIX: In strict mode, ANY ambiguous match is a failure, even with line hints.
      // Line hints only provide a "best guess" but cannot guarantee correctness.
      if (strict) {
        return {
          success: false,
          error: `Hunk ${i} failed: ambiguous match (${occurrences.length} occurrences)`,
          rejectedHunks: [...rejectedHunks, {
            index: i,
            reason: 'AMBIGUOUS_MATCH',
            occurrenceCount: occurrences.length
          }]
        };
      }

      // Non-strict mode: use line hint if available, otherwise first occurrence
      if (hunk.oldStart !== null) {
        const adjustedHint = hunk.oldStart + lineOffset;
        let bestMatch = occurrences[0];
        let bestDistance = Infinity;

        for (const occ of occurrences) {
          const lineNum = content.substring(0, occ).split('\n').length;
          const distance = Math.abs(lineNum - adjustedHint);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = occ;
          }
        }
        targetIdx = bestMatch;
      } else {
        targetIdx = occurrences[0];
      }

      rejectedHunks.push({
        index: i,
        reason: 'AMBIGUOUS_MATCH',
        occurrenceCount: occurrences.length,
        note: hunk.oldStart !== null ? 'Applied using line hint' : 'Applied to first occurrence'
      });
    }

    content = content.substring(0, targetIdx) + replacement + content.substring(targetIdx + searchPattern.length);

    const linesAdded = hunk.newLines.length;
    const linesRemoved = hunk.oldLines.length;
    lineOffset += (linesAdded - linesRemoved);
  }

  // In strict mode, any rejected hunks = failure (don't mark as patched)
  if (strict && rejectedHunks.length > 0) {
    return { success: false, error: `${rejectedHunks.length} hunk(s) failed`, rejectedHunks };
  }

  return { success: true, content, rejectedHunks: rejectedHunks.length > 0 ? rejectedHunks : undefined };
}

/**
 * Check if path is within repo root
 */
function isInRepo(filePath) {
  if (filePath.startsWith('/')) {
    return filePath.startsWith(REPO_ROOT + '/');
  }
  if (filePath.startsWith('~')) {
    return false;
  }
  if (filePath.includes('..')) {
    return false;
  }
  return true;
}

/**
 * Normalize path to repo-relative
 * Strips: absolute REPO_ROOT prefix, leading ./
 */
function toRepoRelative(filePath) {
  let result = filePath;
  // Strip absolute repo root prefix
  if (result.startsWith(REPO_ROOT + '/')) {
    result = result.slice(REPO_ROOT.length + 1);
  }
  // Strip leading ./
  while (result.startsWith('./')) {
    result = result.slice(2);
  }
  return result;
}

/**
 * Convert glob pattern to regex
 * Handles: **, *, ?, [abc], and escapes regex special chars
 */
function globToRegex(glob) {
  let regex = '';
  let i = 0;
  while (i < glob.length) {
    const char = glob[i];

    if (char === '*' && glob[i + 1] === '*') {
      regex += '.*';
      i += 2;
      continue;
    }

    if (char === '*') {
      regex += '[^/]*';
      i++;
      continue;
    }

    if (char === '?') {
      regex += '[^/]';
      i++;
      continue;
    }

    // For glob character classes like [abc], only treat as character class
    // if there's a valid close bracket. Otherwise escape the [.
    if (char === '[') {
      const closeIdx = glob.indexOf(']', i + 1);
      if (closeIdx !== -1) {
        // Check if this looks like a valid character class (has content between brackets)
        const content = glob.slice(i + 1, closeIdx);
        // Valid character class: has content and doesn't contain special unescaped chars
        if (content.length > 0 && !content.includes('/')) {
          let charClass = glob.slice(i, closeIdx + 1);
          if (charClass.length > 2 && charClass[1] === '!') {
            charClass = '[^' + charClass.slice(2);
          }
          regex += charClass;
          i = closeIdx + 1;
          continue;
        }
      }
      // Not a valid character class, escape the bracket
      regex += '\\[';
      i++;
      continue;
    }

    // Escape regex special characters (including ] which may appear without matching [)
    if ('.+^${}|()\\]'.includes(char)) {
      regex += '\\' + char;
      i++;
      continue;
    }

    regex += char;
    i++;
  }
  return new RegExp('^' + regex + '$');
}

// ========================================
// OPERATION COLLECTION
// ========================================

const allOperations = [];
const ghostSnapshots = [];
const stats = {
  claudeTranscripts: 0,
  codexTranscripts: 0,
  claudeWrites: 0,
  claudeDeletes: 0,
  claudeRenames: 0,
  codexPatches: 0,
  codexAdds: 0,
  codexDeletes: 0,
  codexRenames: 0,
  ghostSnapshots: 0
};

/**
 * Parse Claude transcripts
 */
function parseClaudeTranscripts() {
  if (!existsSync(CLAUDE_TRANSCRIPTS_DIR)) {
    console.log('Claude transcripts directory not found');
    return;
  }

  const files = readdirSync(CLAUDE_TRANSCRIPTS_DIR).filter(f => f.endsWith('.jsonl'));
  console.log(`Found ${files.length} Claude transcript files`);

  for (const file of files) {
    const filePath = join(CLAUDE_TRANSCRIPTS_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        // Write tool results
        if (data.toolUseResult?.type === 'create' || data.toolUseResult?.type === 'update') {
          const path = data.toolUseResult.filePath;
          if (path && data.toolUseResult.content !== undefined && isInRepo(path)) {
            allOperations.push({
              type: 'write',
              source: 'claude',
              timestamp: new Date(data.timestamp),
              filePath: path,
              content: data.toolUseResult.content
            });
            stats.claudeWrites++;
          }
        }

        // Bash commands (rm, mv) - check ALL content items, not just [0]
        if (data.message?.content) {
          for (const item of data.message.content) {
            if (item.type === 'tool_use' && item.name === 'Bash') {
              const cmd = item.input?.command;
              const cwd = item.input?.cwd || REPO_ROOT;
              if (cmd) {
                const timestamp = new Date(data.timestamp);

                const resolveBashPath = (filePath) => {
                  let absolutePath;
                  if (filePath.startsWith('/')) {
                    absolutePath = filePath;
                  } else {
                    absolutePath = resolve(cwd, filePath);
                  }
                  if (absolutePath.startsWith(REPO_ROOT + '/')) {
                    return absolutePath.slice(REPO_ROOT.length + 1);
                  }
                  return absolutePath;
                };

                // Delete commands
                const rmPatterns = [
                  { pattern: /^rm\s+(-[rfiRv]+\s+)*(.+)$/, flagGroup: 1, argsGroup: 2 },
                  { pattern: /^git\s+rm\s+(-[rfn]+\s+)*(.+)$/, flagGroup: 1, argsGroup: 2 }
                ];

                for (const { pattern, flagGroup, argsGroup } of rmPatterns) {
                  const rmMatch = cmd.match(pattern);
                  if (rmMatch) {
                    const flags = rmMatch[flagGroup] || '';
                    const isRecursive = /[rR]/.test(flags);
                    const fileArgs = parseFileArguments(rmMatch[argsGroup]);

                    for (const rawPath of fileArgs) {
                      const resolvedPath = resolveBashPath(rawPath);
                      const isGlobPattern = /[*?\[]/.test(rawPath);

                      if (isGlobPattern) {
                        allOperations.push({
                          type: 'glob-delete',
                          source: 'claude',
                          timestamp,
                          pattern: resolvedPath,
                          isRecursive
                        });
                      } else {
                        allOperations.push({
                          type: 'delete',
                          source: 'claude',
                          timestamp,
                          filePath: resolvedPath,
                          isRecursive
                        });
                        stats.claudeDeletes++;
                      }
                    }
                    break;
                  }
                }

                // Rename/move commands
                const mvPatterns = [
                  /^mv\s+(?:-[finvT]+\s+)*(.+)$/,
                  /^git\s+mv\s+(?:-[fnkv]+\s+)*(.+)$/
                ];

                for (const pattern of mvPatterns) {
                  const mvMatch = cmd.match(pattern);
                  if (mvMatch) {
                    const fileArgs = parseFileArguments(mvMatch[1]);
                    if (fileArgs.length === 2) {
                      allOperations.push({
                        type: 'rename',
                        source: 'claude',
                        timestamp,
                        oldPath: resolveBashPath(fileArgs[0]),
                        newPath: resolveBashPath(fileArgs[1])
                      });
                      stats.claudeRenames++;
                    } else if (fileArgs.length > 2) {
                      const destDir = resolveBashPath(fileArgs[fileArgs.length - 1]);
                      for (let i = 0; i < fileArgs.length - 1; i++) {
                        const srcFile = resolveBashPath(fileArgs[i]);
                        const fileName = fileArgs[i].split('/').pop();
                        allOperations.push({
                          type: 'rename',
                          source: 'claude',
                          timestamp,
                          oldPath: srcFile,
                          newPath: destDir.endsWith('/') ? destDir + fileName : destDir + '/' + fileName
                        });
                        stats.claudeRenames++;
                      }
                    }
                    break;
                  }
                }
              }
            }
          }
        }

        // FIX: Removed duplicate legacy Bash parsing block.
        // The loop above (for item of data.message.content) already handles ALL content items,
        // including content[0]. The legacy block was double-counting Bash operations.
      } catch (e) {
        // Skip malformed lines
      }
    }
    stats.claudeTranscripts++;
  }
}

/**
 * Parse Codex transcripts from a directory (recursively finds JSONL files in date subfolders)
 */
function parseCodexDirectory(dir, label) {
  if (!existsSync(dir)) {
    console.log(`${label} directory not found: ${dir}`);
    return;
  }

  // Recursively find all JSONL files (handles date subfolders)
  const files = findJsonlFiles(dir);
  console.log(`Found ${files.length} Codex transcript files in ${label}`);

  for (const filePath of files) {
    // Check file size before reading - skip files > 500MB to avoid memory issues
    let fileSize;
    try {
      fileSize = statSync(filePath).size;
    } catch (e) {
      continue;
    }

    if (fileSize > 500 * 1024 * 1024) {
      console.warn(`  Skipping oversized file (${Math.round(fileSize / 1024 / 1024)}MB): ${filePath}`);
      continue;
    }

    let content;
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch (e) {
      if (e.code === 'ERR_STRING_TOO_LONG') {
        console.warn(`  Skipping file (string too long): ${filePath}`);
        continue;
      }
      throw e;
    }
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        // Ghost snapshots
        if (data.payload?.type === 'ghost_snapshot') {
          ghostSnapshots.push({
            type: 'snapshot',
            source: 'codex-snapshot',
            timestamp: new Date(data.timestamp),
            commitId: data.payload.ghost_commit.id
          });
          stats.ghostSnapshots++;
        }

        // Apply patch operations - check BOTH data.type and data.payload.type
        // Codex records this under payload.type === 'custom_tool_call'
        const isApplyPatch =
          (data.type === 'custom_tool_call' && data.name === 'apply_patch') ||
          (data.payload?.type === 'custom_tool_call' && data.payload?.name === 'apply_patch');

        if (isApplyPatch) {
          // Get patch content from correct location
          const patchContent = data.input || data.payload?.input;
          if (!patchContent) continue;

          const timestamp = new Date(data.timestamp);

          const fileBlocks = patchContent.split(/(?=\*\*\* (?:Update|Add|Delete) File:)/);

          for (const block of fileBlocks) {
            // Update File
            const updateMatch = block.match(/^\*\*\* Update File: ([^\n]+)/);
            if (updateMatch) {
              const oldPath = updateMatch[1].trim();
              const moveMatch = block.match(/\*\*\* Move to: ([^\n]+)/);

              if (moveMatch) {
                const newPath = moveMatch[1].trim();
                // FIX: Use the ENTIRE block for patching, not just the pre-move portion.
                // The hunks that follow "*** Move to:" still apply to the file content.
                // We just need to strip the "*** Move to:" line itself when parsing hunks.
                const diffWithoutMoveLine = block.replace(/\*\*\* Move to:[^\n]*\n?/, '');

                allOperations.push({
                  type: 'patch',
                  source: 'codex',
                  timestamp,
                  filePath: oldPath,
                  diff: diffWithoutMoveLine
                });
                stats.codexPatches++;

                allOperations.push({
                  type: 'rename',
                  source: 'codex',
                  timestamp: new Date(timestamp.getTime() + 1),
                  oldPath: oldPath,
                  newPath: newPath
                });
                stats.codexRenames++;
              } else {
                allOperations.push({
                  type: 'patch',
                  source: 'codex',
                  timestamp,
                  filePath: oldPath,
                  diff: block
                });
                stats.codexPatches++;
              }
              continue;
            }

            // Add File
            const addMatch = block.match(/^\*\*\* Add File: ([^\n]+)/);
            if (addMatch) {
              const fileContent = parseAddFileContent(block);
              allOperations.push({
                type: 'write',
                source: 'codex-add',
                timestamp,
                filePath: addMatch[1].trim(),
                content: fileContent
              });
              stats.codexAdds++;
              continue;
            }

            // Delete File
            const deleteMatch = block.match(/^\*\*\* Delete File: ([^\n]+)/);
            if (deleteMatch) {
              allOperations.push({
                type: 'delete',
                source: 'codex',
                timestamp,
                filePath: deleteMatch[1].trim()
              });
              stats.codexDeletes++;
              continue;
            }
          }
        }
      } catch (e) {
        // Skip malformed lines
      }
    }
    stats.codexTranscripts++;
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

console.log('=== Unified Recovery Script ===\n');
console.log(`Cutoff timestamp: ${CUTOFF.toISOString()} (12:52 CET)\n`);

// Check for flags
const dryRun = process.argv.includes('--dry-run');
const verbose = process.argv.includes('--verbose');
const strict = process.argv.includes('--strict');

if (dryRun) {
  console.log('[DRY RUN MODE - No files will be written]\n');
}
if (strict) {
  console.log('[STRICT MODE - Patch failures are fatal]\n');
}

// Parse all transcripts
console.log('=== Phase 1: Collecting Operations ===\n');

parseClaudeTranscripts();
parseCodexDirectory(CODEX_ARCHIVED_DIR, 'archived_sessions');
parseCodexDirectory(CODEX_SESSIONS_DIR, 'sessions');

console.log(`\n=== Collection Stats ===`);
console.log(`Claude transcripts: ${stats.claudeTranscripts}`);
console.log(`Claude writes: ${stats.claudeWrites}`);
console.log(`Claude deletes: ${stats.claudeDeletes}`);
console.log(`Claude renames: ${stats.claudeRenames}`);
console.log(`Codex transcripts: ${stats.codexTranscripts}`);
console.log(`Codex patches: ${stats.codexPatches}`);
console.log(`Codex adds: ${stats.codexAdds}`);
console.log(`Codex deletes: ${stats.codexDeletes}`);
console.log(`Codex renames: ${stats.codexRenames}`);
console.log(`Ghost snapshots: ${stats.ghostSnapshots}`);

// Warn if no Codex operations found
// FIX: Include delete and rename counts in the check
const totalCodexOps = stats.codexPatches + stats.codexAdds + stats.codexDeletes + stats.codexRenames + stats.ghostSnapshots;
if (totalCodexOps === 0 && stats.codexTranscripts > 0) {
  console.warn('\n⚠️  WARNING: No Codex operations found despite finding transcripts! Check transcript format.');
} else if (stats.codexTranscripts === 0) {
  console.warn('\n⚠️  WARNING: No Codex transcripts found! Check if Codex transcripts are in date subfolders.');
}

// Filter and sort operations
console.log('\n=== Phase 2: Filtering & Sorting ===\n');

const validOperations = allOperations.filter(op => {
  let timestampForCutoff = op.timestamp;
  if (op.type === 'rename' && op.source === 'codex') {
    timestampForCutoff = new Date(op.timestamp.getTime() - 1);
  }

  if (timestampForCutoff >= CUTOFF) return false;

  if (op.type === 'rename') {
    return isInRepo(op.oldPath) && isInRepo(op.newPath);
  }
  if (op.type === 'glob-delete') {
    return isInRepo(op.pattern);
  }
  return isInRepo(op.filePath);
});

const validSnapshots = ghostSnapshots.filter(s => s.timestamp < CUTOFF);

console.log(`Operations before cutoff: ${validOperations.length}`);
console.log(`Snapshots before cutoff: ${validSnapshots.length}`);

// Merge and sort - STRICT chronological order only
// FIX: Removed type priority sorting which violated the strict chronological replay requirement.
// Within same timestamp, preserve original collection order (insertion order) via _sortIndex.
const allValidOps = [...validOperations, ...validSnapshots];
allValidOps.forEach((op, idx) => { op._sortIndex = idx; });

allValidOps.sort((a, b) => {
  const timeDiff = a.timestamp - b.timestamp;
  if (timeDiff !== 0) return timeDiff;
  // Same timestamp: preserve insertion order from transcript parsing
  return a._sortIndex - b._sortIndex;
});

console.log(`Total operations to replay: ${allValidOps.length}`);

// Replay operations
console.log('\n=== Phase 3: Replaying Operations ===\n');

const finalState = new Map();
const patchFailures = [];
let snapshotFilesLoaded = 0;

for (const op of allValidOps) {
  switch (op.type) {
    case 'write': {
      const normPath = toRepoRelative(op.filePath);
      finalState.set(normPath, {
        source: op.source,
        timestamp: op.timestamp,
        content: op.content
      });
      break;
    }

    case 'snapshot': {
      try {
        const filesOutput = exec(`git ls-tree -r --name-only ${op.commitId}`);
        const files = filesOutput.split('\n').filter(line => line.length > 0);

        for (const filePath of files) {
          const normPath = toRepoRelative(filePath);
          if (!isInRepo(filePath)) continue;

          const existing = finalState.get(normPath);
          if (!existing || existing.timestamp < op.timestamp) {
            finalState.set(normPath, {
              source: op.source,
              timestamp: op.timestamp,
              commitId: op.commitId
            });
            snapshotFilesLoaded++;
          }
        }
        if (verbose) {
          console.log(`SNAPSHOT: Applied ${op.commitId.substring(0, 8)} (${files.length} files)`);
        }
      } catch (e) {
        console.error(`SNAPSHOT FAILED: ${op.commitId} - ${e.message}`);
      }
      break;
    }

    case 'patch': {
      const normPath = toRepoRelative(op.filePath);
      const existing = finalState.get(normPath);

      if (existing && existing.source !== 'deleted') {
        let baseContent;
        if (existing.content) {
          baseContent = existing.content;
        } else if (existing.commitId) {
          try {
            baseContent = exec(`git show ${existing.commitId}:${normPath}`);
          } catch (e) {
            patchFailures.push({ path: normPath, reason: 'Could not get base from commit', error: e.message });
            if (strict) {
              console.error(`FATAL: Patch failed for ${normPath}: Could not get base from commit`);
              process.exit(1);
            }
            break;
          }
        } else {
          patchFailures.push({ path: normPath, reason: 'No content or commitId' });
          if (strict) {
            console.error(`FATAL: Patch failed for ${normPath}: No content or commitId`);
            process.exit(1);
          }
          break;
        }

        const hunks = parseCodexPatchBlock(op.diff);
        const result = applyCodexDiff(baseContent, hunks, { strict });

        if (result.success) {
          finalState.set(normPath, {
            source: 'codex-patched',
            timestamp: op.timestamp,
            content: result.content
          });
          if (result.rejectedHunks && verbose) {
            console.warn(`PATCH WARNING: ${normPath} had ${result.rejectedHunks.length} issues`);
          }
        } else {
          patchFailures.push({ path: normPath, reason: result.error, hunks: result.rejectedHunks });
          if (strict) {
            console.error(`FATAL: Patch failed for ${normPath}: ${result.error}`);
            process.exit(1);
          }
        }
      } else {
        patchFailures.push({ path: normPath, reason: 'No base content exists' });
        if (strict) {
          console.error(`FATAL: Patch failed for ${normPath}: No base content exists`);
          process.exit(1);
        }
      }
      break;
    }

    case 'delete': {
      const normPath = toRepoRelative(op.filePath);
      const isDirectory = normPath.endsWith('/') || op.isRecursive;

      if (isDirectory) {
        const dirPrefix = normPath.endsWith('/') ? normPath : normPath + '/';
        for (const [existingPath, state] of finalState) {
          if (existingPath.startsWith(dirPrefix) && state.source !== 'deleted') {
            finalState.set(existingPath, {
              source: 'deleted',
              timestamp: op.timestamp,
              deletedBy: `rm -rf ${normPath}`
            });
          }
        }
      }

      finalState.set(normPath, {
        source: 'deleted',
        timestamp: op.timestamp,
        isDirectory: isDirectory
      });
      break;
    }

    case 'glob-delete': {
      let pattern = op.pattern;
      if (pattern.startsWith(REPO_ROOT + '/')) {
        pattern = pattern.slice(REPO_ROOT.length + 1);
      }
      while (pattern.startsWith('./')) {
        pattern = pattern.slice(2);
      }
      // Strip shell escape characters (e.g., \[code\] -> [code])
      // These come from bash command parsing where brackets were escaped
      pattern = pattern.replace(/\\(.)/g, '$1');

      const regex = globToRegex(pattern);
      const directMatches = new Set();
      const directoryPrefixes = new Set();

      for (const [existingPath, state] of finalState) {
        if (state.source === 'deleted') continue;
        if (regex.test(existingPath)) {
          directMatches.add(existingPath);
          if (op.isRecursive) {
            directoryPrefixes.add(existingPath + '/');
          }
        }
      }

      for (const [existingPath, state] of finalState) {
        if (state.source === 'deleted') continue;

        let shouldDelete = directMatches.has(existingPath);

        if (!shouldDelete && op.isRecursive) {
          for (const prefix of directoryPrefixes) {
            if (existingPath.startsWith(prefix)) {
              shouldDelete = true;
              break;
            }
          }
        }

        if (shouldDelete) {
          finalState.set(existingPath, {
            source: 'deleted',
            timestamp: op.timestamp,
            deletedBy: `rm ${op.isRecursive ? '-rf ' : ''}${pattern}`
          });
        }
      }
      break;
    }

    case 'rename': {
      const oldNorm = toRepoRelative(op.oldPath);
      const newNorm = toRepoRelative(op.newPath);
      const oldFile = finalState.get(oldNorm);

      if (oldFile && oldFile.source !== 'deleted') {
        finalState.set(newNorm, { ...oldFile, timestamp: op.timestamp });
        finalState.set(oldNorm, { source: 'deleted', timestamp: op.timestamp });
      }
      break;
    }
  }
}

console.log(`Replay complete.`);
console.log(`Snapshot files loaded: ${snapshotFilesLoaded}`);
console.log(`Patch failures: ${patchFailures.length}`);

if (patchFailures.length > 0) {
  console.log('\n=== Patch Failures ===');
  for (const failure of patchFailures.slice(0, 20)) {
    console.log(`  ${failure.path}: ${failure.reason}`);
  }
  if (patchFailures.length > 20) {
    console.log(`  ... and ${patchFailures.length - 20} more`);
  }
}

// Count files to write
const filesToWrite = [];
for (const [path, state] of finalState) {
  if (state.source !== 'deleted' && !state.isDirectory) {
    filesToWrite.push(path);
  }
}

console.log(`\n=== Phase 4: Writing Files ===\n`);
console.log(`Files to write: ${filesToWrite.length}`);

// Group by directory
const byDir = new Map();
for (const path of filesToWrite) {
  const parts = path.split('/');
  const dir = parts.slice(0, 2).join('/');
  byDir.set(dir, (byDir.get(dir) || 0) + 1);
}

console.log('\nFiles by directory:');
const sortedDirs = [...byDir.entries()].sort((a, b) => b[1] - a[1]);
for (const [dir, count] of sortedDirs.slice(0, 20)) {
  console.log(`  ${dir}: ${count}`);
}

// Build per-file manifest
const fileManifest = [];
for (const path of filesToWrite) {
  const state = finalState.get(path);
  fileManifest.push({
    path,
    source: state.source,
    timestamp: state.timestamp.toISOString(),
    hasContent: !!state.content,
    commitId: state.commitId || null
  });
}

if (!dryRun) {
  console.log('\nWriting files...');

  let written = 0;
  let errors = 0;

  for (const path of filesToWrite) {
    const state = finalState.get(path);
    let content;

    if (state.content) {
      content = state.content;
    } else if (state.commitId) {
      try {
        content = exec(`git show ${state.commitId}:${path}`);
      } catch (e) {
        console.error(`  ERROR: Could not get content for ${path}: ${e.message}`);
        errors++;
        continue;
      }
    } else {
      console.error(`  ERROR: No content source for ${path}`);
      errors++;
      continue;
    }

    const absolutePath = resolve(REPO_ROOT, path);

    // Security check
    if (!absolutePath.startsWith(REPO_ROOT + '/')) {
      console.error(`  SECURITY: Path escapes repo: ${path}`);
      errors++;
      continue;
    }

    try {
      const dir = dirname(absolutePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(absolutePath, content);
      written++;

      if (verbose) {
        console.log(`  ✓ ${path}`);
      }
    } catch (e) {
      console.error(`  ERROR: ${path}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nRecovery complete.`);
  console.log(`  Files written: ${written}`);
  console.log(`  Errors: ${errors}`);
} else {
  console.log('\n[DRY RUN] No files written. Run without --dry-run to execute.');
}

// Write manifest (always, even in dry-run)
const manifestPath = join(REPO_ROOT, 'recovery-manifest.json');
const manifest = {
  timestamp: new Date().toISOString(),
  cutoff: CUTOFF.toISOString(),
  dryRun,
  strict,
  stats,
  operationsReplayed: allValidOps.length,
  filesToWrite: filesToWrite.length,
  patchFailures: patchFailures.length,
  patchFailureDetails: patchFailures,
  byDirectory: Object.fromEntries(sortedDirs),
  files: fileManifest
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to: ${manifestPath}`);
console.log(`  (includes per-file list with source + timestamp for validation)`);
