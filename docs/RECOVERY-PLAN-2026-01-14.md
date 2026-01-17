# File Recovery Plan - January 14, 2026

> **NOTE (Updated):** The "affected apps" status below describes the state AT THE TIME OF THE INCIDENT (2026-01-14 ~12:52 CET). Partial recovery work has since been performed, so some apps now contain files that were previously empty. The recovery algorithm and pseudocode remain valid for completing the recovery.

## CRITICAL: This Must Be Done Right

There is no margin for error. All substantive code changes since Dec 29, 2025 were made via Claude Code or Codex - no manual edits. This means transcript-based recovery should capture everything, but the sequencing must be correct.

## What Happened

At approximately **12:52 CET (11:52 UTC)** today, during a Claude Code session troubleshooting a commit/stash issue, destructive git commands were executed that deleted source files across multiple apps in the monorepo.

**VERIFIED INCIDENT TIMELINE (from transcript analysis):**
```
2026-01-14T11:51:27.183Z - git stash pop stash@{0} (attempted stash restore)
2026-01-14T11:51:45.017Z - git reset --hard HEAD (first reset)
2026-01-14T11:52:12.547Z - git reset --hard 59f17b748  <-- THE DESTRUCTIVE EVENT
2026-01-14T11:52:18.617Z - git stash pop stash@{0} (failed recovery attempt)
2026-01-14T11:52:29.778Z - git checkout --theirs . 2>/dev/null; git add -A
```

**Last legitimate write before incident:** `2026-01-14T11:48:00.553Z` (12:48:00 CET)
- File: `docs/security-audit-2026-01.md` (Codex apply_patch)
- Gap before incident: ~4 minutes 12 seconds

### Root Cause Analysis

**VERIFIED TIMELINE (from transcript `c03534c8-3a16-47a0-91d3-3403d1a96553.jsonl`):**

| Time (UTC) | Event |
|------------|-------|
| 11:45:26Z | User pastes lint-staged ESLint errors from manual commit attempt |
| 11:46:03Z | Claude says "add `apps/prime/**` to the global ignores" |
| 11:46:18Z | Claude runs `git add . && git commit -m "huge update"` |
| 11:46:32Z | **Commit 77bd833c5 succeeds** (218 files, 12357 insertions) |
| 11:46:36Z | Claude confirms "The commit succeeded" |
| ~11:49:47Z | **Second commit 75b41835a appears** (only 2 files) - NOT created by Claude in this session |
| 11:50:56Z | User asks "i don't understand why so few insertions and deletions?" |
| 11:51:01Z | Claude starts investigating stash (`git stash list`) |
| 11:51:27Z | `git stash pop stash@{0}` → merge conflicts |
| 11:51:45Z | `git reset --hard HEAD` to clean state |
| 11:52:07Z | Claude analyzes stash sizes, finds 179 files in stash@{0} |
| 11:52:11Z | Claude: "reset to before the broken commits and apply the stash cleanly" |
| **11:52:12Z** | **THE DESTRUCTIVE EVENT:** `git reset --hard 59f17b748` |
| 11:52:18Z | `git stash pop stash@{0}` fails - conflicts |

**What Triggered the Investigation:**
The first commit (77bd833c5) succeeded with 218 files. Then a second "huge update" commit (75b41835a) appeared ~3 minutes later with only 2 files changed. The user noticed something was wrong and asked why "so few insertions and deletions" - expecting more work to be included. Claude investigated the stash and found 179 files stuck in `stash@{0}`.

**Claude's Fatal Recovery Attempt (session `jiggly-wiggling-mist`):**
1. Found 179 files with ~3500 lines stuck in `stash@{0}` (autostash from lint-staged)
2. Tried `git stash pop stash@{0}` → Merge conflicts
3. Ran `git reset --hard HEAD` to clean state
4. **THE FATAL DECISION:** "reset to before the broken commits and apply the stash cleanly"
5. Ran `git reset --hard 59f17b748` (Dec 29, 2025) - **BEFORE most code existed**
6. Tried `git stash pop stash@{0}` → Failed because stash was based on newer code
7. Tried `git checkout --theirs .` → More failures

**Why This Failed:**
The stash was created from a working directory with files that didn't exist at commit `59f17b748`. When Claude reset to Dec 29, there was no base for those files. The stash pop couldn't apply, leaving empty directories where source files should be.

### Apps Affected (confirmed via filesystem analysis - directories modified at ~12:52 with 0 files inside):

| App | Status |
|-----|--------|
| `apps/prime` | All source files deleted (was Next.js conversion project) |
| `apps/reception` | All source files deleted (was Next.js conversion project) |
| `apps/xa` | All source files deleted |
| `apps/xa-b` | All source files deleted |
| `apps/xa-j` | All source files deleted |
| `apps/handbag-configurator` | All source files deleted |
| `apps/handbag-configurator-api` | Partial deletion |
| `apps/front-door-worker` | All source files deleted |

The directory structures remain (empty folders), but the actual `.ts` and `.tsx` files are gone.

### Key Facts Established

1. **The two "huge update" commits are NOT useful for full recovery** - they contain 14,399 files including a partial apps/prime/src (29 files), but the most affected apps (reception, xa, handbag-configurator) don't exist in them at all - they were created via Claude/Codex AFTER Dec 29
2. **No manual code edits** - all substantive changes since Dec 29 were made via Claude Code or Codex
3. **Claude Code is new** - only been in use for a few days, so ALL Claude transcripts are relevant
4. **Both tools were used interleaved** - Claude and Codex sessions overlapped in time, editing the same files

---

## The Recovery Idea

### Core Principle

Neither Claude nor Codex actually delete their session logs. File operations made through their respective tools are recorded in JSONL transcript files:
- **Claude Code**: Stores **full file content** in Write tool calls
- **Codex**: Stores **diffs/patches** in `apply_patch` tool calls (NOT full content)

**Note:** Shell-driven writes (e.g., `echo > file`, `npm run build` output) and tool-generated edits (e.g., lint-staged auto-fixes, prettier formatting) are NOT captured in transcripts. For Codex, ghost commits provide a fallback that captures complete file state at certain points.

Additionally, Codex creates "ghost commits" - actual git commits not on any branch - that contain complete file snapshots. These ghost commits are created when Codex performs certain operations (not guaranteed at the end of every session).

**The idea is to:**
1. Roll back to a known-good git state (Dec 29, 2025 - before any Claude/Codex work)
2. Replay ALL file writes from BOTH Claude AND Codex transcripts in **strict chronological order by timestamp**
3. Only replay writes with timestamps before 12:52 CET on Jan 14, 2026

This would reconstruct the exact state of the repo as it was at 12:52, right before the destructive commands ran.

---

## CRITICAL: Sequencing Problem & Solution

### The Problem

Claude and Codex sessions were **interleaved**. For example:
- 10:00 - Claude writes `apps/prime/src/foo.tsx` (version 1)
- 10:30 - Codex session ends, ghost commit contains `foo.tsx` (version 2)
- 11:00 - Claude writes `apps/prime/src/foo.tsx` (version 3)

If we apply the Codex ghost commit after Claude writes, we'd end up with version 2 instead of version 3.

### The Solution (REVISED based on verification)

**Claude and Codex require different extraction approaches:**

1. **Claude:** Extract individual Write operations with timestamps and full file content
2. **Codex:** Extract ghost commit IDs with their timestamps (commits contain complete file snapshots)

**Then replay chronologically:**
1. Collect ALL operations from both sources: writes, patches, deletes, renames (with timestamps)
2. Sort all operations by timestamp into a single unified stream
3. Replay each operation in order - writes set content, patches modify content, deletes remove files, renames move content
4. The final state is the result of replaying ALL operations, not just the "last write"

### Verified Timestamp Format

- Both use **UTC** (ISO 8601 with `Z` suffix)
- Cutoff: `2026-01-14T11:52:00Z` (= 12:52 CET)

### Implementation Approach

**CRITICAL: True Chronological Merge**

The algorithm must process ALL operations in strict timestamp order, not in type buckets.
Each operation is applied to `finalState` in the order it occurred.

```javascript
// Pseudocode for the unified recovery script

// ========================================
// EXTERNAL DEPENDENCIES (contracts)
// ========================================

/**
 * exec(command: string): string
 * - Executes a shell command synchronously
 * - Returns stdout as a STRING (not an array)
 * - Throws on non-zero exit code
 * - IMPORTANT: When output is line-separated (e.g., git ls-tree),
 *   caller must split('\n').filter(Boolean) to get an array
 */

/**
 * writeFile(path: string, content: string): void
 * - Writes content to file, creating directories as needed
 * - Throws on I/O error
 */

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Parse file arguments from a shell command string
 * Handles: quoted paths ("path with spaces"), single quotes, multiple files
 *
 * Examples:
 *   'file1.ts file2.ts' -> ['file1.ts', 'file2.ts']
 *   '"path with spaces.ts"' -> ['path with spaces.ts']
 *   'file1.ts "path with spaces.ts" file2.ts' -> ['file1.ts', 'path with spaces.ts', 'file2.ts']
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
      continue; // Don't include the quote in the result
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

    // Handle escaped characters (e.g., \", \')
    if (char === '\\' && i + 1 < argsString.length) {
      const nextChar = argsString[i + 1];
      if (nextChar === '"' || nextChar === "'" || nextChar === ' ' || nextChar === '\\') {
        current += nextChar;
        i++; // Skip the next character
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
 *
 * Codex Add File format variants:
 *   1. With @@ markers:
 *      *** Add File: path/to/new.ts
 *      @@
 *      +line 1 of file
 *      +line 2 of file
 *      @@
 *
 *   2. Without @@ markers (just + lines after header):
 *      *** Add File: path/to/new.ts
 *      +line 1 of file
 *      +line 2 of file
 *
 * All content lines are prefixed with '+' (since the whole file is an addition).
 * This function extracts the actual file content by stripping the '+' prefixes.
 */
function parseAddFileContent(block) {
  const lines = block.split('\n');
  const contentLines = [];

  // Check if block contains @@ markers
  const hasMarkers = lines.some(line => line.startsWith('@@'));

  let inContent = !hasMarkers; // If no markers, start capturing immediately after header
  let passedHeader = false;

  for (const line of lines) {
    // Skip header line (*** Add File: ...)
    if (line.startsWith('*** ')) {
      passedHeader = true;
      continue;
    }

    // If we have @@ markers, use them to control content capture
    if (hasMarkers && line.startsWith('@@')) {
      inContent = true;
      continue;
    }

    // Only capture content after the header
    if (!passedHeader) continue;

    // If no markers, capture + lines immediately after header
    // If has markers, only capture when inContent is true
    if (!hasMarkers || inContent) {
      if (line.startsWith('+')) {
        contentLines.push(line.slice(1)); // Remove '+' prefix
      } else if (line.startsWith(' ')) {
        // Context line (rare in Add File, but handle it)
        contentLines.push(line.slice(1));
      } else if (line === '') {
        // Empty lines might appear without prefix
        // Only add if we've already captured some content (avoid leading empty lines)
        if (contentLines.length > 0) {
          contentLines.push('');
        }
      }
      // Lines starting with '-' shouldn't exist in Add File (nothing to remove)
    }
  }

  // Warn if we got empty content (might indicate parsing issue)
  if (contentLines.length === 0) {
    console.warn(`WARNING: parseAddFileContent returned empty content for block starting with: ${block.substring(0, 100)}`);
  }

  return contentLines.join('\n');
}

/**
 * Parse a Codex apply_patch block into clean diff hunks
 *
 * Codex patch format variants:
 *   1. Simple: @@ alone on a line starts/ends a hunk
 *   2. With line numbers: @@ -1,5 +1,6 @@ (unified diff style)
 *   3. Single @@ marker: hunk starts at @@ and ends at next @@ or EOF
 *
 * Example formats seen in Codex patches:
 *   *** Update File: path/to/file.ts
 *   @@ -10,3 +10,4 @@
 *   -old line
 *   +new line
 *   @@ -25,2 +26,2 @@
 *   -another old
 *   +another new
 *
 * Returns array of hunks: [{ oldLines: string[], newLines: string[], oldStart?: number }]
 * oldStart is the 1-based line number where the hunk should be applied (if available)
 */
function parseCodexPatchBlock(block) {
  const hunks = [];
  const lines = block.split('\n');

  let currentHunk = null;

  for (const line of lines) {
    // Skip header lines (*** Begin Patch, *** Update File:, *** End Patch, etc.)
    if (line.startsWith('*** ')) continue;

    // Hunk header - matches both "@@" alone AND "@@ -1,5 +1,6 @@" format
    // Pattern: starts with @@ (optionally followed by line numbers and another @@)
    if (line.startsWith('@@')) {
      // Save previous hunk if it has content
      if (currentHunk && (currentHunk.oldLines.length > 0 || currentHunk.newLines.length > 0)) {
        hunks.push(currentHunk);
      }

      // Try to extract line number from unified diff format: @@ -START,COUNT +START,COUNT @@
      // The -START tells us where in the original file this hunk applies
      const lineNumMatch = line.match(/@@ -(\d+)(?:,\d+)? \+\d+/);
      const oldStart = lineNumMatch ? parseInt(lineNumMatch[1], 10) : null;

      // Start new hunk with line number hint if available
      currentHunk = { oldLines: [], newLines: [], oldStart };
      continue;
    }

    // If not in a hunk yet, skip
    if (!currentHunk) continue;

    // Parse diff lines
    if (line.startsWith('-')) {
      currentHunk.oldLines.push(line.slice(1)); // Remove the '-' prefix
    } else if (line.startsWith('+')) {
      currentHunk.newLines.push(line.slice(1)); // Remove the '+' prefix
    } else if (line.startsWith(' ')) {
      // Context line (unchanged) - appears in both old and new
      currentHunk.oldLines.push(line.slice(1));
      currentHunk.newLines.push(line.slice(1));
    }
    // Lines without prefix (shouldn't happen in valid diffs) are ignored
  }

  // Save final hunk if it has content
  if (currentHunk && (currentHunk.oldLines.length > 0 || currentHunk.newLines.length > 0)) {
    hunks.push(currentHunk);
  }

  return hunks;
}

/**
 * Apply Codex diff hunks to base content
 *
 * Uses line-number-aware search-and-replace:
 * - For each hunk, find the oldLines sequence in the content
 * - If hunk has oldStart (line number hint), prefer the occurrence nearest that line
 * - If pattern appears multiple times and no line hint, warn but apply first match
 * - Replace with newLines
 *
 * Returns { success: boolean, content?: string, error?: string, rejectedHunks?: array }
 */
function applyCodexDiff(baseContent, hunks, options = {}) {
  const { strict = false } = options;
  let content = baseContent;
  const rejectedHunks = [];

  // Track cumulative line offset from previous hunks
  // When we add lines, future line numbers shift up; when we remove, they shift down
  let lineOffset = 0;

  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i];

    // Build the search pattern (old lines joined with newlines)
    const searchPattern = hunk.oldLines.join('\n');
    const replacement = hunk.newLines.join('\n');

    // Handle empty oldLines (pure addition / insert-only hunk)
    // In unified diff, @@ -LINE,0 +LINE,COUNT @@ means insert at LINE with nothing to remove
    // Special case: @@ -0,0 +1,N @@ means insert at the very beginning (line 0 = before line 1)
    if (hunk.oldLines.length === 0) {
      if (hunk.oldStart !== null && hunk.newLines.length > 0) {
        // We have a line number hint - adjust for drift from previous hunks
        const adjustedLine = hunk.oldStart + lineOffset;
        const contentLines = content.split('\n');
        // Convert 1-based line to 0-based index, clamped to valid range [0, length]
        // oldStart=0 means "insert before line 1" = index 0
        // oldStart=1 means "insert before line 1" = index 0
        // oldStart=5 means "insert before line 5" = index 4
        const insertLineIdx = Math.max(0, Math.min(adjustedLine - 1, contentLines.length));
        // Handle edge case: oldStart=0 should insert at beginning (index 0)
        const finalIdx = adjustedLine === 0 ? 0 : insertLineIdx;

        // Insert the new lines at the specified position
        contentLines.splice(finalIdx, 0, ...hunk.newLines);
        content = contentLines.join('\n');

        // Update offset: we added lines, so future line numbers shift up
        lineOffset += hunk.newLines.length;

        console.log(`  Hunk ${i}: Inserted ${hunk.newLines.length} lines at line ${adjustedLine} (original hint: ${hunk.oldStart}, offset: ${lineOffset - hunk.newLines.length})`);
        continue;
      } else if (hunk.newLines.length > 0) {
        // No line hint but have content - append to end with warning
        console.warn(`  Hunk ${i}: Insert-only hunk without line hint, appending to end`);
        content = content + '\n' + hunk.newLines.join('\n');
        lineOffset += hunk.newLines.length; // Still track offset
        continue;
      } else {
        // Empty hunk (no old lines, no new lines) - skip silently
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
      // Pattern not found - hunk doesn't apply
      rejectedHunks.push({
        index: i,
        reason: 'PATTERN_NOT_FOUND',
        searchPattern: searchPattern.substring(0, 100) // First 100 chars for debugging
      });

      if (strict) {
        return {
          success: false,
          error: `Hunk ${i} failed: pattern not found`,
          rejectedHunks
        };
      }
      continue;
    }

    // Select which occurrence to patch
    let targetIdx;

    if (occurrences.length === 1) {
      // Only one match - use it
      targetIdx = occurrences[0];
    } else if (hunk.oldStart !== null) {
      // Multiple matches but we have a line number hint
      // IMPORTANT: Adjust the hint for drift from previous hunks
      const adjustedHint = hunk.oldStart + lineOffset;

      // Convert each occurrence's character index to line number and find closest to adjusted hint
      let bestMatch = occurrences[0];
      let bestDistance = Infinity;

      for (const occ of occurrences) {
        // Count newlines before this position to get line number (1-based)
        const lineNum = content.substring(0, occ).split('\n').length;
        const distance = Math.abs(lineNum - adjustedHint);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = occ;
        }
      }
      targetIdx = bestMatch;

      const actualLine = content.substring(0, targetIdx).split('\n').length;

      // Log disambiguation with drift info
      console.warn(`HUNK ${i}: Pattern found ${occurrences.length} times, selected occurrence at line ${actualLine} (original hint: ${hunk.oldStart}, adjusted: ${adjustedHint}, drift: ${lineOffset})`);

      // Warn if the best match is still far from expected (possible mis-patch)
      if (bestDistance > 10) {
        console.warn(`  WARNING: Large distance (${bestDistance} lines) from expected position - verify correctness`);
        rejectedHunks.push({
          index: i,
          reason: 'DISTANT_MATCH',
          expectedLine: adjustedHint,
          actualLine: actualLine,
          distance: bestDistance,
          note: 'Applied but may be wrong location - verify'
        });
      }
    } else {
      // Multiple matches, no line hint - use first match but warn
      targetIdx = occurrences[0];
      rejectedHunks.push({
        index: i,
        reason: 'AMBIGUOUS_MATCH',
        occurrenceCount: occurrences.length,
        searchPattern: searchPattern.substring(0, 100),
        note: 'Applied to first occurrence - verify correctness'
      });
      console.warn(`HUNK ${i}: Pattern found ${occurrences.length} times with no line hint - applying to first occurrence`);

      if (strict) {
        return {
          success: false,
          error: `Hunk ${i} failed: ambiguous match (${occurrences.length} occurrences, no line number hint)`,
          rejectedHunks
        };
      }
    }

    // Apply the hunk at the selected position
    content = content.substring(0, targetIdx) + replacement + content.substring(targetIdx + searchPattern.length);

    // Update line offset for future hunks
    // Offset = (lines added) - (lines removed)
    const linesAdded = hunk.newLines.length;
    const linesRemoved = hunk.oldLines.length;
    lineOffset += (linesAdded - linesRemoved);
  }

  // In strict mode, any rejected hunks (including ambiguous) are a failure
  if (strict && rejectedHunks.length > 0) {
    return {
      success: false,
      error: `${rejectedHunks.length} hunk(s) failed to apply`,
      rejectedHunks
    };
  }

  return {
    success: true,
    content,
    rejectedHunks: rejectedHunks.length > 0 ? rejectedHunks : undefined
  };
}

// ========================================
// STEP 1: COLLECT ALL OPERATIONS
// ========================================

const allOperations = []; // Unified list of ALL operations with timestamps

// 1a. Parse Claude transcripts - extract writes, deletes, renames
for (const file of claudeTranscripts) {
  for (const line of file) {
    // Claude writes (full file content)
    if (line.toolUseResult?.type === 'create' || line.toolUseResult?.type === 'update') {
      allOperations.push({
        type: 'write',
        source: 'claude',
        timestamp: new Date(line.timestamp),
        filePath: line.toolUseResult.filePath,
        content: line.toolUseResult.content
      });
    }

    // Claude deletions and renames via Bash
    // COMPREHENSIVE: Handle rm, git rm, mv, git mv with various argument styles
    // IMPORTANT: Bash commands may be executed from subdirectories, so we need to
    // resolve relative paths against the command's working directory (cwd)
    if (line.message?.content?.[0]?.name === 'Bash') {
      const cmd = line.message.content[0].input?.command;
      // Claude Bash tool includes cwd in the input - extract it for path resolution
      // If not present, default to repo root (most commands run from root)
      const cwd = line.message.content[0].input?.cwd || REPO_ROOT;
      if (cmd) {
        const timestamp = new Date(line.timestamp);

        // Helper to resolve a path from Bash command against its cwd
        // - Absolute paths within repo are converted to repo-relative
        // - Relative paths are resolved against cwd, then converted to repo-relative
        // - Paths outside repo are returned as-is (will be filtered later)
        const resolveBashPath = (filePath) => {
          let absolutePath;
          if (filePath.startsWith('/')) {
            absolutePath = filePath; // Already absolute
          } else {
            // Resolve relative path against command's cwd
            absolutePath = path.resolve(cwd, filePath);
          }
          // Convert to repo-relative for consistent handling
          if (absolutePath.startsWith(REPO_ROOT + '/')) {
            return absolutePath.slice(REPO_ROOT.length + 1);
          }
          return absolutePath; // Outside repo - will be filtered later
        };

        // ========================================
        // DELETIONS: rm, git rm (files and directories)
        // ========================================
        // Matches: rm file, rm -f file, rm -rf dir/, git rm file, git rm -f file
        // Handles: quoted paths, multiple files, any extension
        // Track whether -r/-R flag is present for recursive directory deletion
        const rmPatterns = [
          { pattern: /^rm\s+(-[rfiRv]+\s+)*(.+)$/, flagGroup: 1, argsGroup: 2 },
          { pattern: /^git\s+rm\s+(-[rfn]+\s+)*(.+)$/, flagGroup: 1, argsGroup: 2 }
        ];

        for (const { pattern, flagGroup, argsGroup } of rmPatterns) {
          const rmMatch = cmd.match(pattern);
          if (rmMatch) {
            // Check if recursive flag is present
            const flags = rmMatch[flagGroup] || '';
            const isRecursive = /[rR]/.test(flags);

            // Parse the file arguments (handles quoted paths and multiple files)
            const fileArgs = parseFileArguments(rmMatch[argsGroup]);
            for (const rawPath of fileArgs) {
              // IMPORTANT: Resolve path against cwd before recording
              const resolvedPath = resolveBashPath(rawPath);
              // Check for ALL glob metacharacters: * ? [
              // - * matches any sequence of characters
              // - ? matches any single character
              // - [...] matches any character in the set (e.g., [abc], [0-9], [!a-z])
              const isGlobPattern = /[*?\[]/.test(rawPath);
              if (isGlobPattern) {
                // Glob pattern - record as glob delete for expansion during replay
                // We can't expand now because we don't know what files exist at this timestamp
                // The replay phase will expand against finalState at that point in time
                // NOTE: For globs, we resolve the directory part but keep the glob pattern
                allOperations.push({
                  type: 'glob-delete',
                  source: 'claude',
                  timestamp,
                  pattern: resolvedPath,
                  isRecursive: isRecursive
                });
              } else {
                allOperations.push({
                  type: 'delete',
                  source: 'claude',
                  timestamp,
                  filePath: resolvedPath,
                  isRecursive: isRecursive // Track if this was a recursive delete
                });
              }
            }
            break; // Don't match multiple patterns for same command
          }
        }

        // ========================================
        // RENAMES/MOVES: mv, git mv
        // ========================================
        // Matches: mv old new, mv -f old new, git mv old new
        // Handles: quoted paths, any extension, flags like -f, -i, -n, -v
        // IMPORTANT: Strip flags before parsing file arguments to avoid treating -f as a path
        const mvPatterns = [
          /^mv\s+(?:-[finvT]+\s+)*(.+)$/,           // mv with optional flags (-f, -i, -n, -v, -T)
          /^git\s+mv\s+(?:-[fnkv]+\s+)*(.+)$/       // git mv with optional flags
        ];

        for (const pattern of mvPatterns) {
          const mvMatch = cmd.match(pattern);
          if (mvMatch) {
            // Parse arguments - expect exactly 2 for a rename
            const fileArgs = parseFileArguments(mvMatch[1]);
            if (fileArgs.length === 2) {
              // IMPORTANT: Resolve both paths against cwd
              allOperations.push({
                type: 'rename',
                source: 'claude',
                timestamp,
                oldPath: resolveBashPath(fileArgs[0]),
                newPath: resolveBashPath(fileArgs[1])
              });
            } else if (fileArgs.length > 2) {
              // mv file1 file2 ... dir/ - moving multiple files to directory
              // Track as individual moves (last arg is destination dir)
              const destDir = resolveBashPath(fileArgs[fileArgs.length - 1]);
              for (let i = 0; i < fileArgs.length - 1; i++) {
                const srcFile = resolveBashPath(fileArgs[i]);
                const fileName = fileArgs[i].split('/').pop(); // Use original for filename extraction
                allOperations.push({
                  type: 'rename',
                  source: 'claude',
                  timestamp,
                  oldPath: srcFile,
                  newPath: destDir.endsWith('/') ? destDir + fileName : destDir + '/' + fileName
                });
              }
            }
            break;
          }
        }
      }
    }
  }
}

// 1b. Parse Codex transcripts - extract patches (diffs)
// NOTE: A single apply_patch call can contain MULTIPLE file operations
for (const file of codexTranscripts) {
  for (const line of file) {
    // Codex patches (apply_patch with diff content)
    // NOTE: Codex uses "custom_tool_call" type, NOT "function_call"
    if (line.type === 'custom_tool_call' && line.name === 'apply_patch') {
      const patchContent = line.input;
      const timestamp = new Date(line.timestamp);

      // Split patch into individual file blocks
      // Format: *** Update File: path\n...diff...\n*** (next command or End Patch)
      // NOTE: Do NOT split on "Move to" - it's part of the Update File block
      const fileBlocks = patchContent.split(/(?=\*\*\* (?:Update|Add|Delete) File:)/);

      for (const block of fileBlocks) {
        // *** Update File: path - apply diff to existing file
        // May also contain *** Move to: newPath for renames
        const updateMatch = block.match(/^\*\*\* Update File: ([^\n]+)/);
        if (updateMatch) {
          const oldPath = updateMatch[1].trim();

          // Check if this block contains a *** Move to: directive (rename)
          const moveMatch = block.match(/\*\*\* Move to: ([^\n]+)/);
          if (moveMatch) {
            const newPath = moveMatch[1].trim();

            // This is a rename with optional diff
            // First, apply any diff to get the final content
            // The diff (if present) should be applied to oldPath content
            // Then the result goes to newPath

            // Extract just the diff portion (before *** Move to:)
            const diffPortion = block.split(/\*\*\* Move to:/)[0];

            // Add patch operation for oldPath (to get content updated)
            allOperations.push({
              type: 'patch',
              source: 'codex',
              timestamp,
              filePath: oldPath,
              diff: diffPortion
            });

            // Add rename operation (oldPath -> newPath)
            allOperations.push({
              type: 'rename',
              source: 'codex',
              timestamp: new Date(timestamp.getTime() + 1), // +1ms to ensure rename happens after patch
              oldPath: oldPath,
              newPath: newPath
            });

            console.log(`CODEX RENAME: ${oldPath} -> ${newPath} at ${timestamp.toISOString()}`);
          } else {
            // Regular patch without rename
            allOperations.push({
              type: 'patch',
              source: 'codex',
              timestamp,
              filePath: oldPath,
              diff: block
            });
          }
          continue;
        }

        // *** Add File: path - create new file with content
        // NOTE: Codex Add File blocks contain content in diff format:
        //   *** Add File: path/to/new.ts
        //   @@
        //   +line 1
        //   +line 2
        //   @@
        // We need to extract just the content lines (strip + prefix)
        const addMatch = block.match(/^\*\*\* Add File: ([^\n]+)/);
        if (addMatch) {
          // Parse the content from the diff block
          const content = parseAddFileContent(block);
          allOperations.push({
            type: 'write', // Treat as write since it's full content
            source: 'codex-add',
            timestamp,
            filePath: addMatch[1].trim(),
            content: content
          });
          continue;
        }

        // *** Delete File: path - delete file
        const deleteMatch = block.match(/^\*\*\* Delete File: ([^\n]+)/);
        if (deleteMatch) {
          allOperations.push({
            type: 'delete',
            source: 'codex',
            timestamp,
            filePath: deleteMatch[1].trim()
          });
          continue;
        }
      }
    }
  }
}

// 1c. Parse Codex ghost commits - store as ATOMIC snapshots (not per-file)
// IMPORTANT: Do NOT expand into per-file operations here - that causes O(commits × files)
// memory explosion. Instead, store the commit reference and expand lazily during replay.
const ghostSnapshots = []; // Separate list for snapshots
for (const file of codexTranscripts) {
  for (const line of file) {
    if (line.payload?.type === 'ghost_snapshot') {
      ghostSnapshots.push({
        type: 'snapshot',
        source: 'codex-snapshot',
        timestamp: new Date(line.timestamp),
        commitId: line.payload.ghost_commit.id
        // Note: NO file list here - we'll expand lazily during replay
      });
    }
  }
}

// ========================================
// STEP 2: FILTER AND SORT CHRONOLOGICALLY
// ========================================

const cutoff = new Date('2026-01-14T11:52:00Z');
const REPO_ROOT = '/Users/petercowling/base-shop';

// Normalize path to repo-relative format for consistent storage
// - Absolute: /Users/petercowling/base-shop/apps/foo.ts -> apps/foo.ts
// - Already relative: apps/foo.ts -> apps/foo.ts
const toRepoRelative = (filePath) => {
  if (filePath.startsWith(REPO_ROOT + '/')) {
    return filePath.slice(REPO_ROOT.length + 1);
  }
  return filePath;
};

// Check if path is inside the repo (accepts both absolute and relative)
// ACCEPTS:
//   - /Users/petercowling/base-shop/apps/foo.ts (absolute, in repo)
//   - apps/foo.ts (repo-relative)
//   - src/components/Bar.tsx (repo-relative)
// REJECTS:
//   - /Users/petercowling/other-project/foo.ts (absolute, outside repo)
//   - /tmp/scratch.ts (absolute, outside repo)
//   - ~/Documents/notes.txt (home-relative, outside repo)
//   - ../escape/foo.ts (path traversal attempt)
//   - apps/../../../etc/passwd (path traversal attempt)
const isInRepo = (filePath) => {
  // Absolute paths must start with REPO_ROOT
  if (filePath.startsWith('/')) {
    return filePath.startsWith(REPO_ROOT + '/');
  }
  // Home-relative paths are outside repo
  if (filePath.startsWith('~')) {
    return false;
  }
  // SECURITY: Reject paths with .. components that could escape repo
  // This catches: ../foo, apps/../../../etc/passwd, etc.
  if (filePath.includes('..')) {
    console.warn(`SECURITY: Rejecting path with traversal: ${filePath}`);
    return false;
  }
  // All other paths are repo-relative (apps/, src/, docs/, etc.)
  return true;
};

// SECURITY: Resolve and validate that final path is within repo
// This is a defense-in-depth check before writing
const resolveAndValidatePath = (repoRelPath) => {
  const absolutePath = path.resolve(REPO_ROOT, repoRelPath);
  // Ensure resolved path is still within REPO_ROOT
  if (!absolutePath.startsWith(REPO_ROOT + '/')) {
    throw new Error(`SECURITY: Path escapes repo root: ${repoRelPath} -> ${absolutePath}`);
  }
  return absolutePath;
};

// Filter: before cutoff AND within repo root
// IMPORTANT: For Codex renames that have +1ms offset from their patch,
// we use the original timestamp (before +1ms) for cutoff comparison.
// This ensures patch+rename pairs are treated atomically.
const validOperations = allOperations.filter(op => {
  // For Codex renames, check the ORIGINAL timestamp (subtract the 1ms we added)
  // This ensures if the patch is included, the rename is also included
  let timestampForCutoff = op.timestamp;
  if (op.type === 'rename' && op.source === 'codex') {
    // Codex renames have +1ms offset - use original timestamp for cutoff check
    timestampForCutoff = new Date(op.timestamp.getTime() - 1);
  }

  if (timestampForCutoff >= cutoff) return false;

  if (op.type === 'rename') {
    return isInRepo(op.oldPath) && isInRepo(op.newPath);
  }
  if (op.type === 'glob-delete') {
    return isInRepo(op.pattern);
  }
  return isInRepo(op.filePath);
});

// Filter ghost snapshots by timestamp only (no path filter - they're atomic)
const validSnapshots = ghostSnapshots.filter(s => s.timestamp < cutoff);

// Merge operations and snapshots, then sort by timestamp
// IMPORTANT: Add tie-breakers for stability since JS sort isn't guaranteed stable
// When timestamps are equal:
// 1. Use operation type priority: write < snapshot < patch < delete < rename
//    (writes/snapshots establish base content, patches modify it, deletes/renames come last)
// 2. Use original array index to preserve insertion order within same type (stable sort)
const allValidOps = [...validOperations, ...validSnapshots];

// Add original index for stable sorting
allValidOps.forEach((op, idx) => { op._sortIndex = idx; });

// Priority: lower number = earlier in sort when timestamps are equal
const typePriority = {
  'write': 1,        // Full content - establish base first
  'snapshot': 2,     // Commit snapshots - also establish base content
  'patch': 3,        // Patches modify existing content
  'glob-delete': 4,  // Deletes come after content operations
  'delete': 4,       // Deletes come after content operations
  'rename': 5        // Renames should come last (after patches to same file)
};

allValidOps.sort((a, b) => {
  // Primary: sort by timestamp
  const timeDiff = a.timestamp - b.timestamp;
  if (timeDiff !== 0) return timeDiff;

  // Secondary: sort by operation type priority
  const priorityDiff = (typePriority[a.type] || 99) - (typePriority[b.type] || 99);
  if (priorityDiff !== 0) return priorityDiff;

  // Tertiary: preserve original array order (stable sort)
  return a._sortIndex - b._sortIndex;
});

// ========================================
// STEP 3: REPLAY OPERATIONS IN ORDER
// ========================================

// All paths normalized to repo-relative for consistent key lookup
const finalState = new Map(); // repoRelativePath -> { content, timestamp, source }
const patchFailures = []; // Track failed patches for manual review

for (const op of allValidOps) {
  switch (op.type) {
    case 'write': {
      // Normalize path to repo-relative before using as key
      const normPath = toRepoRelative(op.filePath);
      // Full file content from Claude - always overwrites
      finalState.set(normPath, {
        source: op.source,
        timestamp: op.timestamp,
        content: op.content
      });
      break;
    }

    case 'snapshot': {
      // LAZY EXPANSION: Expand ghost snapshot into per-file entries NOW
      // This avoids O(commits × files) memory at collection time
      // Only expand files that don't already have a more recent state
      // NOTE: exec() returns a string (stdout), so split by newlines to get file list
      const filesOutput = exec(`git ls-tree -r --name-only ${op.commitId}`);
      const files = filesOutput.split('\n').filter(line => line.length > 0);
      for (const filePath of files) {
        const normPath = toRepoRelative(filePath);
        // Skip if path is outside repo (security check)
        if (!isInRepo(filePath)) continue;

        const existing = finalState.get(normPath);
        // Only set if no existing state OR existing is older
        // (Snapshots provide a baseline; explicit writes/patches take precedence if newer)
        if (!existing || existing.timestamp < op.timestamp) {
          finalState.set(normPath, {
            source: op.source,
            timestamp: op.timestamp,
            commitId: op.commitId
          });
        }
      }
      console.log(`SNAPSHOT: Applied ghost commit ${op.commitId.substring(0, 8)} at ${op.timestamp.toISOString()}`);
      break;
    }

    case 'patch': {
      const normPath = toRepoRelative(op.filePath);
      // Codex diff patch - apply to existing content
      const existing = finalState.get(normPath);
      if (existing && existing.source !== 'deleted') {
        // Get current content (from previous write or snapshot)
        let baseContent;
        if (existing.content) {
          baseContent = existing.content;
        } else if (existing.commitId) {
          baseContent = exec(`git show ${existing.commitId}:${normPath}`);
        }

        // CRITICAL: Codex apply_patch format is NOT standard unified diff
        // Format: *** Update File: path\n@@\n-old\n+new\n@@\n...
        // We need to extract just the diff hunks and convert to applicable format
        const cleanDiff = parseCodexPatchBlock(op.diff);

        // Apply the diff WITH STRICT MODE and failure handling
        const patchResult = applyCodexDiff(baseContent, cleanDiff, { strict: true });

        if (patchResult.success) {
          finalState.set(normPath, {
            source: 'codex-patch',
            timestamp: op.timestamp,
            content: patchResult.content
          });
        } else {
          // CRITICAL: Patch failed - log error and track for manual review
          patchFailures.push({
            file: normPath,
            timestamp: op.timestamp,
            reason: patchResult.error,
            rejectedHunks: patchResult.rejectedHunks,
            diff: op.diff.substring(0, 500) // First 500 chars for debugging
          });
          console.error(`PATCH FAILED: ${normPath} at ${op.timestamp.toISOString()}`);
          console.error(`  Reason: ${patchResult.error}`);
          console.error(`  Rejected hunks: ${patchResult.rejectedHunks?.length || 0}`);
          // File retains its previous state (not corrupted)
        }
      } else if (!existing) {
        // Patch to file that doesn't exist in finalState yet
        // This could happen if Codex patched a file that wasn't written by Claude
        patchFailures.push({
          file: normPath,
          timestamp: op.timestamp,
          reason: 'NO_BASE_CONTENT',
          diff: op.diff.substring(0, 500)
        });
        console.error(`PATCH FAILED: ${normPath} - no base content exists`);
      }
      break;
    }

    case 'delete': {
      const normPath = toRepoRelative(op.filePath);

      // Check if this is a directory deletion (path ends with / or was rm -rf)
      // For directory deletions, we need to mark ALL child files as deleted
      const isDirectory = normPath.endsWith('/') || op.isRecursive;

      if (isDirectory) {
        // Remove trailing slash for prefix matching
        const dirPrefix = normPath.endsWith('/') ? normPath : normPath + '/';

        // Mark all existing files under this directory as deleted
        for (const [existingPath, state] of finalState) {
          if (existingPath.startsWith(dirPrefix) && state.source !== 'deleted') {
            finalState.set(existingPath, {
              source: 'deleted',
              timestamp: op.timestamp,
              deletedBy: `rm -rf ${normPath}`
            });
          }
        }

        // Also mark the directory itself as deleted (for tracking)
        finalState.set(normPath, {
          source: 'deleted',
          timestamp: op.timestamp,
          isDirectory: true
        });

        console.log(`DIRECTORY DELETE: ${normPath} - marked ${[...finalState].filter(([p, s]) => p.startsWith(dirPrefix) && s.source === 'deleted').length} files as deleted`);
      } else {
        // Single file deletion
        finalState.set(normPath, {
          source: 'deleted',
          timestamp: op.timestamp
        });
      }
      break;
    }

    case 'glob-delete': {
      // Glob pattern delete - expand against current finalState and delete matches
      // Pattern examples: "*.tmp", "apps/old-*", "src/**/*.bak"
      // IMPORTANT: Normalize the pattern to repo-relative to match finalState keys
      // This handles patterns that are absolute or ./prefixed
      let pattern = op.pattern;

      // Strip absolute repo root prefix if present
      if (pattern.startsWith(REPO_ROOT + '/')) {
        pattern = pattern.slice(REPO_ROOT.length + 1);
      }
      // Strip ./ prefix if present (current directory reference)
      if (pattern.startsWith('./')) {
        pattern = pattern.slice(2);
      }
      // Strip leading / if it's just / (shouldn't happen, but safety check)
      if (pattern.startsWith('/') && !pattern.startsWith('//')) {
        console.warn(`GLOB DELETE: Absolute path outside repo? ${op.pattern}`);
      }

      // Convert glob pattern to regex
      // Handle: * (any chars except /), ** (any chars including /), ? (single char), [...] (char class)
      const globToRegex = (glob) => {
        let regex = '';
        let i = 0;
        while (i < glob.length) {
          const char = glob[i];

          // Handle ** (globstar - matches any path including /)
          if (char === '*' && glob[i + 1] === '*') {
            regex += '.*';
            i += 2;
            continue;
          }

          // Handle * (matches any chars except /)
          if (char === '*') {
            regex += '[^/]*';
            i++;
            continue;
          }

          // Handle ? (matches any single char except /)
          if (char === '?') {
            regex += '[^/]';
            i++;
            continue;
          }

          // Handle [...] character class - pass through to regex (mostly compatible)
          // Shell globs: [abc], [a-z], [!abc] (negation with !)
          // Regex: [abc], [a-z], [^abc] (negation with ^)
          if (char === '[') {
            const closeIdx = glob.indexOf(']', i + 1);
            if (closeIdx !== -1) {
              let charClass = glob.slice(i, closeIdx + 1);
              // Convert shell negation [!...] to regex negation [^...]
              if (charClass.length > 2 && charClass[1] === '!') {
                charClass = '[^' + charClass.slice(2);
              }
              regex += charClass;
              i = closeIdx + 1;
              continue;
            }
          }

          // Escape regex metacharacters: . + ^ $ { } | ( ) \
          if ('.+^${}|()\\'.includes(char)) {
            regex += '\\' + char;
            i++;
            continue;
          }

          // Regular character
          regex += char;
          i++;
        }
        return new RegExp('^' + regex + '$');
      };

      const regex = globToRegex(pattern);
      let matchCount = 0;

      // When isRecursive is true (rm -rf), we need to:
      // 1. Find all files/dirs matching the pattern
      // 2. For each match, ALSO delete all files nested under it (treating match as a directory prefix)
      // Example: rm -rf dir/* with pattern "dir/*" matching "dir/subdir"
      //          should delete "dir/subdir/file.ts", "dir/subdir/nested/deep.ts", etc.

      // First pass: find direct matches and collect directory prefixes for recursive deletion
      const directMatches = new Set();
      const directoryPrefixes = new Set(); // For recursive deletion under matched dirs

      for (const [existingPath, state] of finalState) {
        if (state.source === 'deleted') continue;
        if (regex.test(existingPath)) {
          directMatches.add(existingPath);
          // If recursive, treat every match as a potential directory prefix
          if (op.isRecursive) {
            directoryPrefixes.add(existingPath + '/');
          }
        }
      }

      // Second pass: mark direct matches and (if recursive) nested files as deleted
      for (const [existingPath, state] of finalState) {
        if (state.source === 'deleted') continue;

        let shouldDelete = false;

        // Direct match
        if (directMatches.has(existingPath)) {
          shouldDelete = true;
        }
        // Recursive: nested under a matched directory
        else if (op.isRecursive) {
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
          matchCount++;
        }
      }

      console.log(`GLOB DELETE: ${pattern} (recursive=${!!op.isRecursive}) - marked ${matchCount} files as deleted`);
      break;
    }

    case 'rename': {
      // Rename operations have oldPath and newPath, NOT filePath
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

// ========================================
// STEP 4: CHECK FOR PATCH FAILURES BEFORE WRITING
// ========================================

if (patchFailures.length > 0) {
  console.error('\n' + '='.repeat(60));
  console.error('RECOVERY ABORTED: PATCH FAILURES DETECTED');
  console.error('='.repeat(60));
  console.error(`\n${patchFailures.length} patch(es) failed to apply:\n`);

  for (const failure of patchFailures) {
    console.error(`  FILE: ${failure.file}`);
    console.error(`  TIME: ${failure.timestamp.toISOString()}`);
    console.error(`  REASON: ${failure.reason}`);
    if (failure.rejectedHunks?.length) {
      console.error(`  REJECTED HUNKS: ${failure.rejectedHunks.length}`);
    }
    console.error('');
  }

  console.error('ACTION REQUIRED:');
  console.error('  1. Review the failed patches above');
  console.error('  2. Check if base content exists for these files');
  console.error('  3. Manually apply patches or accept pre-patch state');
  console.error('  4. Re-run with --force to proceed despite failures');
  console.error('');

  // Write failure report to file for review
  writeFile('recovery-patch-failures.json', JSON.stringify(patchFailures, null, 2));
  console.error('Failure details written to: recovery-patch-failures.json');

  if (!args.includes('--force')) {
    process.exit(1); // Abort unless --force is specified
  }
  console.warn('\n--force specified: Proceeding despite patch failures...\n');
}

// ========================================
// STEP 5: WRITE FINAL STATE TO DISK
// ========================================

for (const [repoRelPath, state] of finalState) {
  if (state.source === 'deleted') {
    continue; // Don't write deleted files
  }

  // Get content (either stored or from git)
  let content;
  if (state.content) {
    content = state.content;
  } else if (state.commitId) {
    // Git show uses repo-relative paths
    content = exec(`git show ${state.commitId}:${repoRelPath}`);
  }

  // SECURITY: Resolve and validate path before writing
  // This uses path.resolve (not path.join) and verifies the result is within REPO_ROOT
  // Catches any path traversal that might have slipped through earlier checks
  const absolutePath = resolveAndValidatePath(repoRelPath);
  writeFile(absolutePath, content);
}
```

**Why This Works:**

The key insight is that ALL operations (writes, patches, deletes, renames, snapshots) go into
a single list and are sorted by timestamp. Then we replay them in order, so:

```
10:00 - snapshot apps/foo.tsx (v1)     -> finalState['apps/foo.tsx'] = v1
10:30 - write apps/foo.tsx (v2)        -> finalState['apps/foo.tsx'] = v2 (overwrites)
10:45 - patch apps/foo.tsx (v2→v3)     -> finalState['apps/foo.tsx'] = v3 (applies diff)
11:00 - delete apps/bar.tsx            -> finalState['apps/bar.tsx'] = deleted
```

Each operation sees the state from ALL previous operations, regardless of source.

**Path Normalization:**

All paths are normalized to repo-relative format before being used as keys:
- Claude absolute: `/Users/petercowling/base-shop/apps/foo.tsx` → `apps/foo.tsx`
- Codex relative: `apps/foo.tsx` → `apps/foo.tsx` (unchanged)

This ensures that a Claude write to `/Users/petercowling/base-shop/apps/foo.tsx` and a Codex
patch to `apps/foo.tsx` refer to the same file in `finalState`.

---

## Available Recovery Sources

### Source 1: Git Commit History (Starting Point Only)

```
Commit to reset to: 59f17b748 (Dec 29, 2025) "Translate brikette guides..."
```

The git reflog shows:
```
59f17b748 HEAD@{0}: reset: moving to HEAD          <- Current state (damaged)
75b41835a HEAD@{3}: commit: huge update (12:49 CET) <- BEFORE incident, but INCOMPLETE
77bd833c5 HEAD@{4}: commit: huge update (12:46 CET) <- BEFORE incident, but INCOMPLETE
59f17b748 HEAD@{7}: commit: Translate brikette...  <- CLEAN STATE - USE THIS
```

**CORRECTION:** The two "huge update" commits were made BEFORE 12:52 (at 12:46 and 12:49 CET), NOT after. However, they are still NOT useful for recovery because:

1. **Most affected apps are missing** - apps/reception, apps/xa, apps/handbag-configurator are NOT in the commits at all (these were created via Claude/Codex AFTER Dec 29)
2. **apps/prime/src exists but is partial** - only 29 files in apps/prime/src/ vs the full structure needed (many components, hooks, contexts are missing)
3. **14,399 total files** - the commits contain substantial content, but the affected apps either don't exist or are incomplete snapshots of work-in-progress conversions
4. **lint-staged interference** - the commits were created during lint-staged operations which may have staged only certain files

**Transcript replay is required** because it captures the COMPLETE history of ALL file writes, not just what happened to be staged at a particular moment.

### Source 2: Claude Transcripts (ALL of them)

Location: `~/.claude/projects/-Users-petercowling-base-shop/*.jsonl`

**IMPORTANT:** Claude Code has only been in use for a few days. ALL 580 transcript files are relevant and must be processed - not just those for specific apps.

Claude records every `Write` tool operation with:
- Full file path
- Complete file contents
- Timestamp (ISO 8601 format, likely UTC)

**Total coverage:**
- 580 transcript files
- 1,195+ file write operations across ALL apps/packages
- Timestamps range from first Claude Code usage to today

**Note:** The previous analysis only counted writes to specific apps. The actual recovery must process ALL writes to ANY path in the monorepo.

### Source 3: Codex Transcripts (ALL of them)

Location: `~/.codex/archived_sessions/*.jsonl`

**IMPORTANT:** Codex transcripts must be parsed for file write operations just like Claude transcripts. The key difference is the JSONL structure - we need to identify how Codex records file writes.

**Total coverage:**
- 3,495 archived session files
- Unknown number of file write operations (structure needs verification)
- Timestamps in ISO 8601 format

**Additionally:** Codex creates "ghost commits" in git. These ARE part of the unified recovery approach:
1. Ghost snapshots provide baseline file states at their timestamps
2. Codex `apply_patch` operations provide incremental diffs between snapshots
3. Both are merged into the chronological replay stream with Claude writes/deletes/renames
4. The unified replay correctly handles interleaving by processing ALL operations in timestamp order

**Ghost commit example found:** `61eda3f6ba7fde468e80ad0212adf5ed882fdd2b`
- Contains snapshots of xa, handbag-configurator, front-door-worker
- Used as baseline content source when file state comes from a snapshot

### Source 4: Standalone Repos (NOT NEEDED)

These exist outside the monorepo:
- `~/prime` - Original Vite app
- `~/reception` - Original app

**These should NOT be needed** since all substantive changes were made via Claude/Codex and will be in the transcripts. Only reference these if transcript recovery fails to produce expected files.

---

## Proposed Recovery Steps

### Step 0: Pre-Recovery Verification (DO FIRST)

Before any destructive operations, verify we can extract file writes from both sources:

```bash
# 1. Sample a Claude transcript - verify we can parse file writes
head -100 ~/.claude/projects/-Users-petercowling-base-shop/*.jsonl | grep -o '"name":"Write"'

# 2. Sample a Codex transcript - identify how file writes are recorded
head -100 ~/.codex/archived_sessions/rollout-2026-01-14*.jsonl

# 3. Verify timestamp format and timezone
# Look for timestamps like "2026-01-14T11:00:00.000Z" (UTC) or similar
```

**DO NOT PROCEED** until we confirm:
- [ ] Claude transcript Write operations can be parsed with file paths and content
- [ ] Codex transcript file operations can be identified and parsed
- [ ] Timestamp timezone is confirmed (expected: UTC)

### Step 1: Build the Unified Recovery Script

Create a script that:
1. Parses ALL Claude transcript JSONL files (580 files)
2. Parses ALL Codex transcript JSONL files (3,495 files)
3. Extracts ALL operations: writes, patches, deletes, renames (with timestamps)
4. **Merges into a single list sorted by timestamp** (THIS IS CRITICAL)
5. Filters: only operations before 2026-01-14T11:52:00Z (12:52 CET)
6. **Replays chronologically** - applies each operation in order (NO deduplication)
   - Writes set file content
   - Patches modify existing content via diff
   - Deletes remove files from final state
   - Renames move content between paths
7. Outputs a manifest showing the final state after replay
8. Has a --dry-run mode that shows the plan without writing

**IMPORTANT:** Do NOT deduplicate to "last write per file" - this would drop intermediate
patches, deletes, and renames. The chronological replay produces the correct final state.

### Step 2: Dry Run the Recovery

```bash
node scripts/unified-recovery.mjs --dry-run
```

This should output:
- Total writes found from Claude: X
- Total writes found from Codex: Y
- Writes after cutoff (excluded): Z
- Final files to be written: N
- List of all file paths with their source (Claude/Codex) and final timestamp

**REVIEW THIS OUTPUT CAREFULLY** before proceeding.

### Step 3: Backup Current State

```bash
git checkout -b backup-damaged-state-2026-01-14
git add -A
git commit -m "Backup of damaged state before recovery attempt"
git checkout main
```

### Step 4: Hard Reset to Clean State

```bash
git reset --hard 59f17b748
```

This rolls back to Dec 29, 2025 - the last committed state before Claude/Codex work.

### Step 5: Execute Recovery

```bash
node scripts/unified-recovery.mjs
```

This writes all files. For each file path, the content is the result of chronologically replaying all operations (writes, patches, deletes, renames) that affected that path before 12:52.

### Step 6: Validate

```bash
# Install dependencies
pnpm install

# ========================================
# 6a. Verify affected apps have source files restored
# ========================================

# Count source files in affected apps (should be > 0)
echo "=== File counts in affected apps ==="
find apps/prime/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/reception/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/xa/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/xa-b/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/xa-j/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/handbag-configurator/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l
find apps/front-door-worker/src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l

# ========================================
# 6b. TypeScript compilation for affected apps
# ========================================

pnpm --filter @apps/prime typecheck
pnpm --filter @apps/reception typecheck
pnpm --filter @apps/xa typecheck
pnpm --filter @apps/xa-b typecheck
pnpm --filter @apps/xa-j typecheck
pnpm --filter @apps/handbag-configurator typecheck
pnpm --filter @apps/front-door-worker typecheck

# ========================================
# 6c. Verify Jan 14 Codex patches were applied (15 files)
# ========================================

# These files were patched by Codex on Jan 14 AFTER Claude writes
# They should exist and contain the Codex patch changes, not just Claude content

echo "=== Verifying Jan 14 Codex-patched files exist ==="
ls -la apps/brikette/src/compat/route-modules.ts
ls -la apps/brikette/src/data/generate-guide-slugs.ts
ls -la apps/brikette/src/data/guides.index.ts
ls -la apps/brikette/src/locales/de/experiencesPage.json
ls -la apps/brikette/src/locales/hi/experiencesPage.json
ls -la apps/brikette/src/locales/ko/experiencesPage.json
ls -la apps/brikette/src/locales/no/howToGetHere.json
ls -la apps/brikette/src/locales/pl/assistanceSection.json
ls -la apps/brikette/src/locales/pl/experiencesPage.json
ls -la apps/brikette/src/locales/pl/howToGetHere.json
ls -la apps/brikette/src/locales/pl/roomsPage.json
ls -la apps/brikette/src/locales/zh/experiencesPage.json
ls -la apps/brikette/src/routes/guides/guide-manifest.ts
ls -la docs/brikette-translation-coverage.md
ls -la docs/plans/brikette-translation-coverage-plan.md

# Spot-check: Verify a Codex-patched locale file has expected content
# (The Polish experiencesPage.json should have translations added by Codex)
head -20 apps/brikette/src/locales/pl/experiencesPage.json

# ========================================
# 6d. Cross-reference with ghost commit for Codex apps
# ========================================

git diff 61eda3f6ba7fde468e80ad0212adf5ed882fdd2b -- apps/xa/src | head -50
# Should show minimal or no differences
```

### Step 7: Commit Recovered State

```bash
git add -A
git commit -m "Recovered state from Claude/Codex transcripts (pre-12:52 deletion)"
```

---

## Critical Questions / Risks

### 1. ~~Timing of "huge update" commits~~ RESOLVED

**CORRECTED:** The two "huge update" commits were made BEFORE 12:52 (at 12:46 and 12:49 CET). However, they are still NOT useful because the most affected apps (reception, xa, handbag-configurator) don't exist in these commits at all - they were created via Claude/Codex AFTER Dec 29. The commits contain 14,399 files including a partial apps/prime/src (29 files), but transcript replay is required for complete recovery of the affected apps.

### 2. ~~Codex Transcript File Write Format~~ VERIFIED

**FINDING:** Codex uses `apply_patch` for file modifications, which contains **diff/patch format**, NOT full file content.

```json
{
  "type": "custom_tool_call",
  "name": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: apps/foo.ts\n@@\n-old line\n+new line\n@@\n*** End Patch"
}
```

**CRITICAL IMPLICATION:** Patches cannot be directly used to reconstruct files - they're incremental changes that need a base.

**HOWEVER:** Codex creates **ghost commits** (actual git commits) during certain operations. These contain complete file snapshots and ARE accessible:
```bash
git cat-file -t e2f197f4d394e5f4dd8178cf0faee59c9e01307f  # Returns: commit
git ls-tree -r --name-only e2f197f4d394e5f4dd8178cf0faee59c9e01307f  # Returns: 16658 files
```

**REVISED APPROACH FOR CODEX:**
- Extract ghost commit IDs from `ghost_snapshot` entries in transcripts
- Extract `apply_patch` operations with diffs from transcripts
- Both snapshots and patches are added to the unified operation stream with their timestamps
- During chronological replay, snapshots provide baseline content; patches modify existing content
- This correctly handles interleaved Claude writes and Codex patches on the same files

### 3. ~~Transcript Timestamp Timezone~~ VERIFIED

**CONFIRMED:** Both Claude and Codex use **UTC** (ISO 8601 with `Z` suffix):
- Claude: `"timestamp":"2026-01-13T11:01:19.370Z"`
- Codex: `"timestamp":"2026-01-08T08:58:22.507Z"`

**Cutoff:** `2026-01-14T11:52:00Z` (which is 12:52 CET)

### 4. ~~Files not created by Claude or Codex~~ RESOLVED

**CONFIRMED:** No substantive manual code edits were made. All changes since Dec 29 were via Claude Code or Codex. This means transcript recovery should capture everything.

### 5. Interleaved Writes - ADDRESSED BY DESIGN

**Risk:** Claude and Codex sessions were interleaved, writing to the same files at different times.

**Solution:** The unified recovery script merges ALL operations from BOTH sources into a single chronologically-sorted stream and replays them in order. Writes set content, patches modify existing content, deletes remove files, renames move content. The final state is the result of this sequential replay, correctly handling interleaving.

**Example:**
```
10:00 Claude writes foo.tsx (v1)           -> finalState['foo.tsx'] = v1
10:30 Codex patches foo.tsx (diff)         -> finalState['foo.tsx'] = v1 + diff = v2
11:00 Claude writes foo.tsx (v3)           -> finalState['foo.tsx'] = v3
11:15 Codex patches foo.tsx (diff)         <- AFTER cutoff, excluded
```

### 6. Codex Jan 14 Patches - CRITICAL GAP IDENTIFIED

**CORRECTION:** There WERE Codex sessions active on January 14, 2026.

**Finding:** 8 Codex sessions on Jan 14 (4 archived + 4 in sessions folder):
- Multiple sessions active before the incident
- **56 apply_patch events** before cutoff (11:52:00Z)
- **38 files affected** (brikette, docs, structured-toc files, security-audit)
- Not all sessions created ghost commits (ghost commits are not guaranteed per-session)

**Files affected by Jan 14 Codex patches (38 files, partial list):**
```
apps/brikette/src/compat/route-modules.ts
apps/brikette/src/data/generate-guide-slugs.ts
apps/brikette/src/data/guides.index.ts
apps/brikette/src/locales/de/experiencesPage.json
apps/brikette/src/locales/hi/experiencesPage.json
apps/brikette/src/locales/ko/experiencesPage.json
apps/brikette/src/locales/no/howToGetHere.json
apps/brikette/src/locales/pl/assistanceSection.json
apps/brikette/src/locales/pl/experiencesPage.json
apps/brikette/src/locales/pl/howToGetHere.json
apps/brikette/src/locales/pl/roomsPage.json
apps/brikette/src/locales/zh/experiencesPage.json
apps/brikette/src/routes/guides/guide-manifest.ts
docs/brikette-translation-coverage.md
docs/plans/brikette-translation-coverage-plan.md
```

**Timeline conflict example (verified timestamps):**
```
2026-01-14T09:27:16.345Z - Claude wrote experiencesPage.json (full content)
2026-01-14T10:33:44.828Z - Codex patched same file (AFTER Claude) - diff only
2026-01-14T11:52:12.547Z - git reset reverted to Dec 29 state
```

**The Problem:**
- Last Codex ghost commit: 2026-01-10T06:37:49.462Z (commit 230147fb..., before Jan 14 patches)
- Codex patches on Jan 14: stored as **diffs only**, no full file content
- Claude writes provide base, but Codex patches are newer and must be applied in chronological order

**Solution - True Chronological Merge:**

The unified algorithm (see Implementation Approach above) handles this correctly by:
1. Collecting ALL operations (Claude writes, Codex snapshots, Codex patches, deletes, renames) into a single list
2. Sorting by timestamp
3. Replaying in order - so a Codex patch at 10:33 is applied AFTER a Claude write at 09:27

```
09:27:16Z - Claude writes experiencesPage.json (full content) -> finalState has v1
10:33:44Z - Codex patches experiencesPage.json (diff)         -> finalState has v2 (patched)
```

**Impact if not handled:** 38 files (affected by 56 patches) would be restored to their pre-Codex state, losing Jan 14 translation fixes and improvements.

### 7. Claude Deletions and Renames - ADDRESSED IN ALGORITHM

**Critique:** The original algorithm only handled `create` and `update` Write operations. Claude also performed file deletions (`rm`) and renames (`mv`) via Bash commands that weren't tracked.

**Investigation Result:** Found **17 source file deletions** and **4 file renames** in Claude transcripts.

**Examples of intentional deletions found:**
```bash
rm /Users/petercowling/base-shop/apps/reception/src/components/PinLogin.tsx          # Delete legacy component
rm /Users/petercowling/base-shop/apps/reception/src/utils/getUserByPin.ts            # Delete legacy utility
rm /Users/petercowling/base-shop/packages/ui/src/components/atoms/ThemeToggle.tsx    # Remove duplicate
```

**Examples of renames found:**
```bash
mv .../useFetchGuestDetails.test.ts .../useFetchGuestDetails.test.tsx     # Rename .ts to .tsx
mv .../useFetchBookingsData.server.ts .../useFetchBookingsDataServer.ts   # Rename to avoid conflict
```

**Solution:** The recovery script now also parses Bash tool calls to extract:
1. `rm` commands → Track as deletions with timestamps
2. `mv` commands → Track as renames with timestamps

When building the final file state:
- All operations (writes, patches, deletions, renames) are sorted by timestamp into a unified stream
- Operations are replayed in chronological order - each operation modifies the current state
- A deletion after a write removes that file; a write after a deletion recreates it
- Renames move content from old path to new path in timestamp order
- Files marked as deleted in the final state are NOT written during recovery

**Impact if not handled:** Without this fix, we would resurrect 17 files that were intentionally deleted (e.g., legacy components, duplicates, deprecated utilities).

### 8. Cutoff Timestamp Precision - VERIFIED

**Critique:** The original "12:12 CET" cutoff was derived from an approximate incident time and a 1-minute buffer; any timestamp drift could drop valid writes or keep destructive ones.

**Investigation Result:** The incident time was **NOT** 12:12 CET - it was **12:52 CET (11:52 UTC)**. The exact destructive command was identified in the transcript:

```bash
# Session: c03534c8-3a16-47a0-91d3-3403d1a96553 (jiggly-wiggling-mist)
# Timestamp: 2026-01-14T11:52:12.547Z
git reset --hard 59f17b748
```

**Full incident timeline verified from transcript:**
```
11:51:27.183Z - git stash pop stash@{0} (attempted restore from stash)
11:51:45.017Z - git reset --hard HEAD (first reset - still had local changes)
11:52:12.547Z - git reset --hard 59f17b748  <-- THE DESTRUCTIVE COMMAND
11:52:18.617Z - git stash pop stash@{0} (failed recovery - conflicts)
11:52:29.778Z - git checkout --theirs . (more failed recovery)
11:56:00.562Z - git reset --hard HEAD (additional reset)
```

**Last legitimate write before incident:**
- Timestamp: `2026-01-14T11:48:00.553Z` (12:48:00 CET)
- File: `docs/security-audit-2026-01.md` (Codex apply_patch)
- Gap before incident: **~4 minutes, 12 seconds**

**Corrected cutoff:** `2026-01-14T11:52:00.000Z` (12:52:00 CET)
- This is 12 seconds BEFORE the destructive `git reset --hard 59f17b748`
- There is a ~4-minute gap between the last write and the cutoff, providing margin
- Codex apply_patch events to security-audit-2026-01.md ran from 11:44:52Z through 11:48:00Z

**Post-incident recovery attempts (to be EXCLUDED):**
- Starting at `12:16:55Z` - locale files written as recovery attempts
- These writes are AFTER the cutoff and will be correctly excluded

### 9. Repo Root Guard - ADDRESSED IN ALGORITHM

**Critique:** Transcript paths could overwrite files outside the repo - a security risk.

**Investigation Result:** Found **2 writes outside `/Users/petercowling/base-shop/`** in the transcripts:

| Location | Count | Description |
|----------|-------|-------------|
| `~/.claude/plans/` | 2 | Claude plan files (not source code) |

**Solution:** Added `isInRepo()` guard in the filter step:
```javascript
const REPO_ROOT = '/Users/petercowling/base-shop';
const isInRepo = (filePath) => filePath.startsWith(REPO_ROOT + '/');

// All operations filtered to only include paths within repo
const validClaudeWrites = claudeWrites.filter(w => w.timestamp < cutoff && isInRepo(w.filePath));
const validClaudeDeletes = claudeDeletes.filter(d => d.timestamp < cutoff && isInRepo(d.filePath));
const validClaudeRenames = claudeRenames.filter(r => r.timestamp < cutoff && isInRepo(r.oldPath) && isInRepo(r.newPath));
```

**Impact if not handled:** Without this fix, we could accidentally overwrite Claude's internal plan files. The guard ensures only repo files are recovered.

### 9. Recovery Script Correctness

**Risk:** The recovery script must be correct. Bugs could result in wrong file versions or missing files.

**Mitigations:**
1. Dry-run mode to preview all operations
2. Output manifest showing every file with its source and timestamp
3. Cross-reference recovered Codex apps against ghost commits
4. TypeScript compilation as validation
5. Backup branch created before any destructive operations

---

## Rollback Plan

If the recovery fails or produces a broken state:

1. The current (damaged) state is preserved in `backup-damaged-state-2026-01-14` branch
2. Ghost commits remain in git object store indefinitely
3. Transcript files are not modified by this process
4. We can re-run with adjusted parameters (different cutoff time, etc.)

---

## Summary

### The Approach

1. **Reset** to clean git state from Dec 29, 2025 (`59f17b748`)
2. **Parse** ALL Claude transcripts (580 files) and ALL Codex transcripts (3,495 files)
3. **Extract** all operations: writes, patches, deletions (`rm`), renames (`mv`) with timestamps
4. **Filter** to repo root AND cutoff time (exclude 2 out-of-repo writes under ~/.claude/plans)
5. **Merge** all operations into a single chronologically-sorted list (with stable tie-breakers)
6. **Replay** each operation in timestamp order - writes set content, patches modify content, deletes remove files, renames move content
7. **Output** final state (files not marked deleted)
8. **Validate** with TypeScript compilation

### Why This Works

- All substantive code changes since Dec 29 were made via Claude Code or Codex
- Claude records full file content; Codex records patches (diffs) that modify existing content
- Claude deletions and renames via Bash are also tracked
- By replaying ALL operations chronologically, we correctly reconstruct the state at any point in time
- Patches are applied to the content that existed at that moment, not to a "last write"
- The cutoff at 12:52 excludes the destructive git reset
- Repo root guard prevents writing to files outside the monorepo

### Confidence Level

| Aspect | Confidence | Notes |
|--------|------------|-------|
| Claude transcript parsing | HIGH | Format well understood, full file content available |
| Claude deletions/renames | HIGH | **VERIFIED:** 17 deletions, 4 renames found and handled |
| Repo root security | HIGH | **VERIFIED:** 2 out-of-repo writes excluded (both under ~/.claude/plans) |
| Codex ghost commits (pre-Jan 14) | HIGH | Git commits verified accessible, contain complete files |
| Codex patches (Jan 14) | MEDIUM | **CORRECTED:** 56 patches on 38 files (brikette, docs, structured-toc) - must apply as diffs |
| Timestamp handling | HIGH | **VERIFIED:** Both use UTC with Z suffix |
| Chronological ordering | HIGH | ISO 8601 timestamps sort correctly |
| Cutoff timestamp | HIGH | **VERIFIED:** Exact incident at 11:52:12Z, cutoff at 11:52:00Z, ~4-min gap from last write |
| No manual edits missed | HIGH | Confirmed no manual code changes |

### Prerequisites Before Execution

- [x] ~~Verify Codex transcript file write format~~ **DONE** - uses ghost commits (pre-Jan 14) + patches (Jan 14)
- [x] ~~Verify timestamp timezone~~ **DONE** - both use UTC
- [x] ~~Verify Codex Jan 14 activity~~ **CORRECTED** - 8 sessions found (4 archived + 4 active), 56 patches on 38 files
- [x] ~~Verify deletion/rename handling~~ **DONE** - 17 deletions, 4 renames tracked
- [x] ~~Verify repo root security~~ **DONE** - 2 out-of-repo writes excluded (both under ~/.claude/plans)
- [x] ~~Verify cutoff timestamp precision~~ **DONE** - exact incident at 11:52:12Z, cutoff at 11:52:00Z
- [ ] Build unified recovery script (with patch application support)
- [ ] Review dry-run output
- [ ] Create backup branch

### This MUST succeed - there is no other recovery path for this data.
