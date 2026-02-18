# Wave Dispatch Protocol

Reference: `subagent-dispatch-contract.md` (Model A — parallel analysis, serial apply).

## When to Use

When the current plan's Parallelism Guide contains a wave with ≥2 tasks, dispatch them
in parallel via the Task tool in a SINGLE message. Wave size = 1 → continue sequential.

## Wave-Reading

Read the `## Parallelism Guide` section from the plan doc. Format:

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|

Select the earliest wave where all prerequisite tasks are Complete.
Extract the task IDs in that wave as the dispatch set.

## Analysis Phase (Parallel)

Dispatch each task in the wave as a read-only analysis subagent in ONE message:
- Subagent brief: task description, Affects files, acceptance criteria
- Subagent output schema: `{ status, summary, diff_proposal, touched_files, tokens_used }`
  - `diff_proposal`: exact file content changes (new content for new files; old→new for edits)
  - `touched_files`: all files the subagent would write in apply phase
- Subagents MUST NOT write files — analysis only

## Conflict Detection

After all subagents complete:
1. Collect all `touched_files` arrays
2. Check for overlapping paths across subagents
3. If overlap detected: apply the conflicting subagents SERIALLY (not in parallel)
4. If no overlap: apply all in parallel in apply phase (still sequentially within each)

## Apply Phase (Serial)

Orchestrator acquires writer lock:
1. For each subagent result (no-conflict order): apply `diff_proposal` to disk
2. Run validation after all diffs applied (once per wave, not per task)
3. Commit wave together under writer lock

## Failure Handling

If a subagent returns `status: fail`:
- Mark the corresponding task as `Blocked` with reason from subagent summary
- Quarantine the failed result (do not apply its diff_proposal)
- Continue applying remaining non-conflicting subagent results
- Surface blocked task to operator after wave commit

## Code-Track Only (v1)

Initial release: code-track tasks only. Business-artifact wave dispatch deferred to v2
pending one validated code-track wave run.
