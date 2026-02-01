---
Type: Plan
Status: Historical
Domain: Recovery
Last-reviewed: 2026-01-31
Relates-to charter: none
Created: 2026-01-31
---

# File Recovery Plan - January 31, 2026 (Claude “Locales Rollback”)

This document is the recovery runbook for the **2026-01-31 brikette locale rollback incident**, where automated `git checkout` commands overwrote large portions of `apps/brikette/src/locales/**`, potentially destroying **uncommitted** translation/content work.

## CRITICAL: This Must Be Done Right

- **Do not run any more `git checkout`, `git restore`, or reset commands** against `apps/brikette/src/locales/**` until you have a clear restore plan and a backup.
- **Do not rely on GitHub (`origin/main`)** as a source of truth for this incident; local `HEAD` is far ahead of `origin/main`.
- The goal is: **recover any overwritten uncommitted work** and build a repeatable record of what happened.

## What Happened (Verified)

On **2026-01-31**, Claude ran multiple `git checkout` commands in `apps/brikette` that rewound locale content.

**VERIFIED INCIDENT TIMELINE (from Claude tool logs, UTC timestamps):**

```
2026-01-31T07:55:20.690Z - git checkout -- src/locales/de/guides/content/capriPositanoFerry.json
2026-01-31T10:08:25.574Z - git checkout src/locales/ar/guides/content/gavitellaBeachGuide.json
2026-01-31T10:09:01.480Z - git checkout src/locales/*/guides/content/*.json
                        -> output: "Updated 2988 paths from the index"
2026-01-31T10:11:31.767Z - git checkout HEAD -- src/locales/{de,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/
2026-01-31T10:31:34.988Z - git checkout ORIG_HEAD -- src/locales/{de,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh}/
```

**Primary evidence files:**
- `.agents/pre_rollback_reports/claude-rollback-2026-01-31-checkout-commands.txt`
- `.agents/pre_rollback_reports/claude-rollback-2026-01-31-scope-summary.json`

### Root Cause (Operational)

Claude attempted to “fix” invalid JSON / build failures by using `git checkout` as a bulk rollback mechanism. This is unsafe for content-heavy areas because:
- It silently overwrites **uncommitted working tree changes**
- It is easy to apply to overly broad globs / directories
- The “173 files” list used at the time was incomplete (derived from an invalid-JSON scan), so the rollback went beyond the intended scope

## Scope / Blast Radius (Verified)

This incident is not limited to the “173 files rolled back” list.

We computed the tracked-file targets from the actual pathspecs used by the checkouts:

- **All tracked locale guide content JSONs (glob rollback):** 2989 files
  - `.agents/pre_rollback_reports/claude-rollback-2026-01-31-targeted-tracked-guide-content-files.txt`
- **All tracked files under 12 locale directories (`de,hu,it,ja,ko,no,pl,pt,ru,sv,vi,zh`):** 3096 files
  - `.agents/pre_rollback_reports/claude-rollback-2026-01-31-targeted-tracked-files.txt`
- **Union across all 5 checkout commands:** 4093 files
  - `.agents/pre_rollback_reports/claude-rollback-2026-01-31-targeted-tracked-union-files.txt`

### Important Correction: “173 files” is NOT the full impact

- The “173” list came from a scan for invalid JSON at the time and is **not** a complete accounting of files overwritten by `git checkout`.
- There are also known files that were edited/written prior to the bulk checkouts that are **not** in the 173 list:
  - `.agents/pre_rollback_reports/claude-rollback-2026-01-31-additional-modified-guide-files-not-in-173.txt`

## Recovery Sources (What We Can Actually Restore)

This incident has a mixed recovery story: some content is fully recoverable; some may be unrecoverable if it was overwritten while uncommitted and no snapshot exists.

### Source A: Git (Committed History)

**`ORIG_HEAD` is still set** to the pre-rollback commit:
- `ORIG_HEAD`: `3f6d380a4172a2df6df61c12f34f084a95abb44c` (timestamp in git: `2026-01-31T09:50:04+01:00`)

Git can restore committed content (e.g. files as of `ORIG_HEAD`) but **cannot restore overwritten uncommitted changes** unless they were captured elsewhere.

### Source B: Claude file-history snapshots (Uncommitted Recovery)

Claude maintains `~/.claude/file-history/<sessionId>/...` snapshots for some files that were touched via its Edit/Write tooling.

- This is the best chance to recover **uncommitted** content overwritten by `git checkout`.
- Coverage is partial (not every file gets a snapshot).

### Source C: Repo artifacts under `.agents/pre_rollback_reports/` (Point-in-time copies)

These were created during this investigation and can be used as restore sources:

- Working tree backup copies (24 files):
  - `.agents/pre_rollback_reports/working_tree_backup_20260131-121247/`
- Extracted recovery from Claude file-history (limited):
  - `.agents/pre_rollback_reports/recovered_from_claude_file_history/`
  - `.agents/pre_rollback_reports/recovered_from_claude_file_history_remaining40/`
- Git-based restore mapping for the “173” file set:
  - `.agents/pre_rollback_reports/pre-rollback-commits-20260131-120539-filled-from-pre-migration.csv`
  - `.agents/pre_rollback_reports/restore-commands-20260131-120539-filled-from-pre-migration.sh`
  - `.agents/pre_rollback_reports/restore-report-20260131-121247.json`

### Source D: VSCode history (Uncommitted Recovery)

We attempted a recovery scan:
- `.agents/pre_rollback_reports/recovered_from_vscode_history/vscode-history-recovery-report.json`

In the analyzed target set, it did not yield meaningful restores (0 hits).

## Recoverability Table (Canonical Inventory)

To avoid speculation, we created a machine-generated table for the full **4093 in-scope files** showing whether each file is recoverable via:
- Git (`ORIG_HEAD` / committed history)
- Claude file-history snapshot
- Working tree backup copy
- Pre-migration restore mapping (for the known 173 set)
- VSCode history (if present)

**Table (CSV):**
- `.agents/pre_rollback_reports/claude-rollback-2026-01-31-recoverability-table.csv`

**Summary (JSON):**
- `.agents/pre_rollback_reports/claude-rollback-2026-01-31-recoverability-summary.json`

## Proposed Recovery Steps (Safe, Non-Destructive)

These steps are written to minimize additional loss and make recovery repeatable.

### Step 0: Freeze and Back Up (Do First)

1. Create a new working folder (outside git) to store snapshots of current state:
   - Copy the entire `apps/brikette/src/locales/` directory to a timestamped folder.
2. Confirm `git stash list` is empty or known, and record `git status --porcelain=v1`.
3. Record:
   - `git rev-parse HEAD`
   - `git rev-parse ORIG_HEAD`

### Step 1: Decide the “Base” to Restore To

Use **`ORIG_HEAD`** as the “pre-rollback baseline” for committed state comparison.

This is NOT a reset; it’s the reference point used to decide what changed.

### Step 2: Restore Files We Have Concrete Copies For

In priority order:

1. Restore any files present under:
   - `.agents/pre_rollback_reports/working_tree_backup_20260131-121247/`
2. Restore any files present under:
   - `.agents/pre_rollback_reports/recovered_from_claude_file_history/**/files/`

These are direct content restores; they represent known snapshots.

### Step 3: Restore the Known “173” Set via the Pre-Migration Map (If Needed)

If you need to reconstruct the pre-migration versions of the 173 files (as recorded at the time), use:
- `.agents/pre_rollback_reports/restore-commands-20260131-120539-filled-from-pre-migration.sh`

This uses `git show <commit>:<old_path>` to rebuild files that existed pre-migration under different paths.

### Step 4: Exhaust Claude file-history for the Remaining In-Scope Files

For each file in the union list that is marked `has_claude_file_history_backup=true` in the CSV:
- Identify the newest snapshot for that file (the table includes `claude_backup_file` and `claude_backup_session`)
- Copy that snapshot content into the repo path

If a file has no file-history snapshot and was overwritten while uncommitted, it may be unrecoverable without another backup source.

### Step 5: Validate

At minimum:
- Run JSON validation over locale guide content.
- Run build / typecheck as appropriate for brikette.

Do not “fix” data loss by rolling back more files; recovery and correctness are separate phases.

### Step 6: Commit and Preserve Evidence

Once recovery is complete:
- Commit recovered files in a dedicated “recovery” commit with a clear message.
- Keep `.agents/pre_rollback_reports/` artifacts (these are the forensic record).

## Open Questions / Risks

- **Uncommitted data loss:** if a file was overwritten by `git checkout` and there is no Claude file-history snapshot, no working-tree backup, and no editor history, recovery may not be possible.
- **Non-local writes:** any shell-driven file writes not captured by Claude/Codex tooling may be missing from snapshots.
- **Scope beyond union list:** this plan covers the verified 4093 targeted tracked files; any additional non-tracked files or other directories changed by later actions must be separately audited.

## Summary

- This incident overwrote parts of `apps/brikette/src/locales/**` via broad `git checkout` commands.
- We have a verified blast-radius inventory (4093 tracked files) and a per-file recoverability table.
- Recovery is possible for files with:
  - Claude file-history snapshots
  - Direct backup copies
  - Or known git-commit mappings (for the 173 set)
- Recovery may be impossible for overwritten uncommitted changes without a snapshot source.

