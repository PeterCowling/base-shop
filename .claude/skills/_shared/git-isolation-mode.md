# Git Isolation Mode

Use when working tree is dirty during task execution.

## Steps

1. Capture changed paths:
- `git status --porcelain=v1`
- `git diff --name-only --diff-filter=ACMRTUXB`

2. Compare changes against task `Affects`.

3. If no overlap:
- proceed with task-only staging.

4. If overlap exists:
- proceed only if task-scoped staging is still possible
- stage only intended files
- verify staged set with `git diff --cached --name-only`

5. Record overlap risk note in task completion block when relevant.
