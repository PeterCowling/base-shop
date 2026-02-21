# Plan Archiving Utility

Use only when all executable tasks are complete.

## Status Rule

Canonical plan completion status is `Complete`.

## Optional Storage Archival

If repository policy requests moving completed plans to archive storage:

1. Keep frontmatter status as `Complete`.
2. Move plan and companion artifacts via `git mv` to archive location.
3. Ensure no stale duplicates remain in active plan locations.
4. Commit archival move as a docs-only commit.

If no explicit archival request/policy exists, leave completed plan in place with `Status: Complete`.
