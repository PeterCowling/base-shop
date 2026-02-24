# Plan Archiving

Runs automatically when all executable tasks in a plan are complete.

## Status Rule

Plan lifecycle: `Draft` → `Active` → `Archived`.

## Archival Steps

1. Set frontmatter `Status: Archived`.
2. Move plan directory to `docs/plans/_archive/` via `git mv` (or plain `mv` if uncommitted).
3. Ensure no stale duplicates remain in active plan locations.
