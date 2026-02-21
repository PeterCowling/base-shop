# Plan Update, Validation, and Completion

Implements Steps 7–9 of the `/lp-sequence` workflow: applying sequenced results to the plan document, validating consistency, and producing the completion summary. Also handles edge case task categories.

## Step 7: Update the Plan Document

Apply all changes to the plan file:

### a) Task Summary Table

Rewrite the table with correct ordering and updated `Depends on`/`Blocks`:

```markdown
## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-31 | IMPLEMENT | ... | 92% | S | Pending | - | TASK-34, TASK-39 |
| TASK-32 | IMPLEMENT | ... | 90% | M | Pending | TASK-31 | TASK-40 |
```

### b) Task Sections

- Reorder task sections (`### TASK-XX: ...`) to match sequenced order
- Keep task IDs unchanged by default
- Update `Depends on` fields if dependency references changed
- Add `Blocks` field after `Depends on` in each task
- Update any cross-references in Notes/references fields

### c) Phase Headers (preserve or restructure)

- If phases are still meaningful groupings after reordering, preserve phase headers
- If reordering makes phases misleading, replace phase headers with a simpler structure and note the original phase in each task's metadata

### d) Add Parallelism Guide

Insert the Parallelism Guide section after the Task Summary table.

## Step 8: Validate

After editing, verify:

- Every task ID in any `Depends on` or `Blocks` field exists in the plan
- No circular dependencies
- Completed/deferred tasks were not renumbered or moved (they stay in their historical section)
- If renumbering mode was used, the rename map accounts for all references

## Step 9: Completion Summary

Report what changed:

```markdown
## Sequencing Complete

**Plan:** docs/plans/<slug>/plan.md
**Tasks sequenced:** N active tasks reordered
**ID policy:** stable IDs preserved (default)
**Rename map:** <only include when explicit renumbering mode is used>

**Dependency changes:**
- N explicit dependencies preserved
- M implicit dependencies added (file overlap)
- No cycles detected

**Parallel execution:**
- K execution waves identified
- Max parallelism: P tasks in wave N
- Critical path length: W waves

Ready for `/lp-do-build`.
```

## Handling Edge Cases

### Completed Tasks

Tasks with status `Complete (YYYY-MM-DD)` are **not reordered or renumbered**. They stay in their historical section. If an active task depends on a completed task, the dependency is noted as satisfied: `Depends on: DS-61 (complete)`.

### Deferred Tasks

Tasks with status `Deferred` are **not included** in the sequencing. They stay in the Deferred section. Note them in the Parallelism Guide footer.

### In-Progress Tasks

Tasks with status `In-Progress` are included in sequencing but flagged:

```markdown
> **Note:** TASK-03 is currently In-Progress. Its position in the sequence reflects its dependencies, not a suggestion to restart it.
```

### Tasks with Ranges in Dependencies

Some tasks use range syntax (e.g., `DS-73–DS-77`). Expand these to explicit lists: `Depends on: DS-10, DS-11, DS-12, DS-13, DS-14`.
