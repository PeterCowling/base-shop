# Sequence Algorithm

Implements Steps 2–6 of the `/lp-sequence` workflow: dependency graph construction, topological sorting, ID handling, dependency updates, and parallel execution group identification.

## Step 2: Build Dependency Graph

Construct a directed acyclic graph (DAG) of task dependencies from three sources, in priority order:

### a) Explicit dependencies (highest priority)

If task B says `Depends on: TASK-A`, add edge A -> B.

### b) File-overlap dependencies (implicit)

If task A and task B both list the same file as **primary** in `Affects`, they cannot safely run in parallel. Determine ordering by:

1. **Infrastructure before consumers** — tasks that create/define types, schemas, tokens, or shared modules come before tasks that consume them
2. **Smaller scope first** — S-effort before M-effort before L-effort when both touch the same file, unless logic dictates otherwise
3. **Foundation before features** — if both tasks modify `index.ts` (barrel file), the task adding foundational exports goes first

When file overlap creates an implicit dependency, add it to the `Depends on` field with a comment: `(file overlap: <path>)`.

### c) Phase ordering (soft preference)

Tasks in earlier phases are preferred before later phases, but this is a **soft** constraint — it can be overridden when a later-phase task has no dependencies and can run in parallel with earlier-phase work.

## Step 3: Topological Sort

Sort tasks using topological ordering (Kahn's algorithm or DFS-based):

1. Tasks with no dependencies come first
2. Among tasks with equal dependency depth, prefer:
   - INVESTIGATE/DECISION/SPIKE before IMPLEMENT (they unblock or de-risk others)
   - CHECKPOINT after the dependency boundary it gates
   - Lower phase number
   - Smaller effort (S before M before L)
   - Alphabetical by description (stable tiebreak)
3. Detect cycles — if found, report them and STOP (cycles indicate a planning error that needs `/lp-replan`)

## Step 4: ID Handling

By default, **do not renumber**.

Keep current task IDs stable and reorder sections/tables only.

If explicit renumbering is requested:
- Build a rename map (`old ID -> new ID`)
- Update all references consistently
- Report the rename map in completion output

## Step 5: Update Dependencies and Add Blockers

For each task:

- **Update `Depends on`**: Keep references valid for the current ID set (stable by default)
- **Add `Blocks` field**: The inverse of `Depends on`. If TASK-03 depends on TASK-01, then TASK-01 blocks TASK-03. Format: `Blocks: TASK-03, TASK-07`
- If a task has no dependencies: `Depends on: -`
- If a task blocks nothing: `Blocks: -`

## Step 6: Identify Parallel Execution Groups

Analyze the DAG to identify which tasks can run concurrently. A **parallel group** is a set of tasks that:

- Share no dependencies between each other
- Have all their prerequisites completed (or share the same prerequisites)
- Do not modify overlapping files

Produce a **Parallelism Guide** showing execution waves:

```markdown
## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-03 | - | Independent foundation tasks |
| 2 | TASK-04, TASK-05 | Wave 1: TASK-01 | TASK-04 needs TASK-01; TASK-05 needs TASK-01 |
| 3 | TASK-06 | Wave 2: TASK-04 | Sequential bottleneck |
| 4 | TASK-07, TASK-08 | Wave 3: TASK-06 | Both need TASK-06 |

**Max parallelism:** 3 (Wave 1)
**Critical path:** TASK-01 -> TASK-04 -> TASK-06 -> TASK-07 (4 waves)
**Total tasks:** 8
```
