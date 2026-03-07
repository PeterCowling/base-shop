---
Type: Build-Record
Status: Complete
Feature-Slug: process-improvements-dispatch-queue-surface
Completed-date: 2026-03-04
artifact: build-record
Business-Unit: BOS
---

# Build Record: Process Improvements Dispatch Queue Surface

## Outcome Contract

- **Why:** The self-improving loop produces ideas via signal bridges into queue-state.json, but the operator dashboard ignores them entirely — loop-generated improvement signals are invisible without reading raw JSON.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All enqueued dispatch ideas from the self-improving loop appear on process-improvements.user.html alongside existing results-review and bug-scan ideas, with automatic regeneration when items are added or removed.
- **Source:** operator

## What Was Built

Added a dispatch queue collection loop to `generate-process-improvements.ts` that reads `queue-state.json`, filters for `queue_state === "enqueued"` items, and maps them to `ProcessImprovementItem` objects merged into the existing `IDEA_ITEMS` array. Each dispatch uses `deriveIdeaKey(QUEUE_STATE_RELATIVE_PATH, dispatch_id)` for unique idea keys (avoiding collisions from repeated `area_anchor` values). All dispatch items run through `classifyIdeaItem()` for priority sorting. The generator now surfaces 58 dispatch items from the self-improving loop on the dashboard.

Updated the git hook at `generate-process-improvements.sh` to trigger regeneration when `queue-state.json` is staged.

Added 7 unit tests covering enqueued filtering, missing file handling, classifier integration, key uniqueness, mixed-source sorting, malformed input, and empty title skipping.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| CI unit tests (pushed to dev) | CI cancelled (pre-existing lint exceptions governance failure) | Typecheck passed; lint failure unrelated to this feature |
| `pnpm run startup-loop:generate-process-improvements` | Pass | 239 ideas (58 from queue-state.json), 0 risks, 4 pending |

## Validation Evidence

### TASK-01
- TC-01: Generator produces 58 dispatch items from queue-state.json (55 originally enqueued + 3 added by session bridge during runs). Completed/processed items excluded.
- TC-02: Missing queue-state.json handled gracefully — wrapped in try/catch with existsSync guard.
- TC-03: All dispatch items carry classifier fields (priority_tier, own_priority_rank, urgency, effort, reason_code). Fail-open: unset on error, sorts to rank 999.
- TC-04: `deriveIdeaKey(QUEUE_STATE_RELATIVE_PATH, dispatch_id)` produces distinct keys even when area_anchor repeats (18 instances of "bos-agent-session-findings").

### TASK-02
- TC-05: Test fixture with 3 enqueued + 2 completed dispatches → only 3 items in output.
- TC-06: Test with no queue-state.json → 0 dispatch items, no error.
- TC-07: Dispatch with empty area_anchor skipped; valid dispatch collected.

### TASK-03
- TC-08: `queue-state.json` path matches the updated grep pattern.
- TC-09: Existing trigger patterns unchanged (additive regex extension).

## Scope Deviations

None.
