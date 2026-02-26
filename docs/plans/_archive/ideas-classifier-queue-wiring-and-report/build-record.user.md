---
Type: Build-Record
Status: Complete
Feature-Slug: ideas-classifier-queue-wiring-and-report
Completed-date: 2026-02-26
artifact: build-record
Business-Unit: BOS
---

# Build Record: Ideas Classifier Queue Wiring and Report

## Outcome Contract

- **Why:** The classifier is complete but its output has no effect on queue ordering or report grouping. This wiring step makes the classification policy actually drive work selection and operator visibility.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Queue scheduler uses effective_priority_rank+urgency+effort sort key from classifier output; report groups ideas by canonical tier and urgency; all existing ideas have full classification fields.
- **Source:** operator

## What Was Built

**Wave 1 (TASK-01 + TASK-02, parallel):** Extended the `ProcessImprovementItem` interface in `generate-process-improvements.ts` with four new optional fields (`urgency`, `effort`, `proximity`, `reason_code`) and updated the classifier call site to write all six classification fields onto each idea item. Separately added four optional property declarations (`priority_tier`, `urgency`, `effort`, `reason_code`) to the dispatch schema JSON, preserving `additionalProperties: false` and backward compatibility with all existing packets.

**Wave 2 (TASK-03 + TASK-04, parallel):** Added optional `classification?` field to `QueueEntry` interface carrying `{ effective_priority_rank: number; urgency: string; effort: string }`. Added pure helper functions `urgencyRank()` and `effortRank()` and a new `computeClassifiedScore()` function. Updated `computeSchedulingScore()` to use the classifier-aware formula `10000 - (urgency_rank * 1000) - (priority_rank * 10) + (5 - effort_rank)` when classification is present, guaranteeing all classified entries outrank any unclassified entry. Updated `planNextDispatches()` to pass `entry.classification`. Added TSDoc comment to `ScheduledDispatch.priority` marking it as a legacy display label. In parallel, replaced the HTML report's `actionGroup()`/`ideaGroup()` free-text grouping with a canonical 8-tier loop (P0–P5 + Unclassified catch-all) using plain-English tier headings and tier-based summary bar counts.

**Wave 3 (TASK-05):** Added 5 new TC-09 test cases to `lp-do-ideas-trial-queue.test.ts` covering classifier-aware sort (classified vs unclassified ordering, urgency rank wins, effort tiebreak, listEntries mutation seam). Added 1 new test to `generate-process-improvements.test.ts` asserting all four new classification fields are present on emitted idea items.

**Wave 4 (TASK-06):** Re-ran `pnpm --filter scripts startup-loop:generate-process-improvements` to backfill all 39 existing ideas in `process-improvements.json` and `process-improvements.user.html` with the new classification fields.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter scripts exec tsc --noEmit` | Pass | 0 errors |
| `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-trial-queue\|generate-process-improvements --no-coverage` | Pass | 63 tests (47 existing queue + 5 new TC-09 + 11 existing/1 new generate) |
| `pnpm --filter scripts startup-loop:generate-process-improvements` | Pass | ideas=39, risks=0, pending=2 |

## Validation Evidence

### TASK-01
- TC-01: `ProcessImprovementItem` interface has `urgency`, `effort`, `proximity`, `reason_code` optional fields — TypeScript compiles, exit 0.
- TC-02: Classifier call at lines 575–581 writes all four new fields onto `ideaItem` — confirmed by source read.
- TC-03: All 10 existing `generate-process-improvements.test.ts` tests pass.

### TASK-02
- TC-04: Schema file parses as valid JSON — confirmed.
- TC-05: `priority_tier`, `urgency`, `effort`, `reason_code` present in `properties`; `additionalProperties: false` confirmed.

### TASK-03
- TC-06 (mapped to TC-09-03): classified entries with same rank, lower urgency_rank (U0) sorts first — test passes.
- TC-07: Existing TC-08-01/08-02 unclassified sort preserved — all 47 original tests pass.
- TC-08 (mapped to TC-09-01): classified P3 entry outranks unclassified P1 entry — test passes.
- TC-09 (mapped to TC-09-02): lower effective_priority_rank wins among two classified entries — test passes.
- TC-10 (mapped to TC-09-05): seam test confirms score=9995 for U0/rank-1/XS entry; mutation visible to scheduler — test passes.

### TASK-04
- TC-11: HTML source contains `TIER_ORDER`, `TIER_LABELS`, `tierSection()`, tier-loop using `priority_tier` — confirmed.
- TC-12: `renderItem()` call retained inside `tierSection()` — confirmed.
- TC-13: Filter bar handler unchanged, still calls `render()` — confirmed.

### TASK-05
- TC-14: `jest` exits 0, 63 tests pass.
- TC-15: No `test.skip()` or `it.skip()` added — confirmed from source read.

### TASK-06
- TC-16: All 39 idea items in `process-improvements.json` have `urgency`, `effort`, `proximity`, `reason_code` populated — confirmed.
- TC-17: Generator exits 0 with "ideas=39" output.
- TC-18: Tier sections confirmed in committed HTML source; visual browser verification deferred to operator.

## Scope Deviations

None. All changes were within the task scope. The emergency TSDoc comment on `ScheduledDispatch.priority` (added during Wave 2 entry) was within TASK-03 scope per plan Notes. Generator produced 39 ideas (plan said 37) — 2 additional ideas were added by other results-review files between planning and execution; no change in approach needed.
