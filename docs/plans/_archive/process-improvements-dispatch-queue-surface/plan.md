---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: process-improvements-dispatch-queue-surface
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Process Improvements Dispatch Queue Surface Plan

## Summary

The process-improvements dashboard shows ideas from results-review files and bug-scan findings but ignores all dispatch queue items from the self-improving loop. This plan adds a collection loop in `generate-process-improvements.ts` that reads enqueued dispatches from `queue-state.json`, maps them to `ProcessImprovementItem` objects, and merges them into the existing `IDEA_ITEMS` array. The git hook is updated to trigger regeneration when queue-state.json changes. No HTML template changes are needed — dispatch items render as regular ideas grouped by priority tier.

## Active tasks

- [x] TASK-01: Add dispatch queue collection to the process-improvements generator — Complete (2026-03-04)
- [x] TASK-02: Add unit tests for dispatch queue collection — Complete (2026-03-04)
- [x] TASK-03: Update git hook to trigger on queue-state.json changes — Complete (2026-03-04)

## Goals

- Surface all enqueued dispatch queue items on the process-improvements dashboard as idea candidates.
- Auto-regenerate the HTML when queue-state.json changes.
- Use dispatch packet priority fields for consistent sorting with existing ideas.

## Non-goals

- Changing the dispatch queue schema or lifecycle.
- Adding a new HTML section/tab for dispatches.
- Modifying the 30-second meta-refresh behavior.

## Constraints & Assumptions

- Constraints:
  - Must preserve the existing `replaceArrayAssignment` injection pattern for `IDEA_ITEMS`.
  - Must not break `runCheck()` drift detection.
  - Must remain deterministic (no network calls, no runtime dependencies).
- Assumptions:
  - Dispatch items exit the dashboard via `queue_state` lifecycle transitions only. The completed-ideas registry is not involved — `queue_state` filtering is the sole exclusion mechanism for dispatch items.
  - Only `queue_state === "enqueued"` items should appear.

## Inherited Outcome Contract

- **Why:** The self-improving loop produces ideas via signal bridges into queue-state.json, but the operator dashboard ignores them entirely — loop-generated improvement signals are invisible without reading raw JSON.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All enqueued dispatch ideas from the self-improving loop appear on process-improvements.user.html alongside existing results-review and bug-scan ideas, with automatic regeneration when items are added or removed.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/process-improvements-dispatch-queue-surface/fact-find.md`
- Key findings used:
  - Generator reads 4 sources (results-review, bug-scan, reflection-debt, build-record) but not queue-state.json.
  - Dispatch packets contain `area_anchor` (title), `why` (body), `priority` (P0-P5), `business`, `created_at` — all fields needed for ProcessImprovementItem.
  - Dispatch items use queue_state filter as sole exclusion mechanism (no completed-ideas registry interaction).
  - HTML renders IDEA_ITEMS generically by priority tier — no source-based grouping.
  - Git hook triggers on results-review/build-record/bug-scan/completed-ideas file changes only.

## Proposed Approach

- Option A: Add dispatch items as a new ProcessImprovementType ("dispatch") with a separate HTML array and section.
- Option B: Merge dispatch items into existing `ideaItems` array as `type: "idea"` with `source: "queue-state.json"`.
- Chosen approach: **Option B** — simplest path, no HTML changes, items sort naturally by priority tier alongside existing ideas.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add dispatch queue collection to generator | 85% | S | Complete (2026-03-04) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add unit tests for dispatch collection | 85% | S | Complete (2026-03-04) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Update git hook trigger pattern | 85% | S | Complete (2026-03-04) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Generator change + hook update are independent |
| 2 | TASK-02 | TASK-01 | Tests require the collection code to exist |

## Tasks

### TASK-01: Add dispatch queue collection to the process-improvements generator

- **Type:** IMPLEMENT
- **Deliverable:** Updated `collectProcessImprovements()` in `scripts/src/startup-loop/build/generate-process-improvements.ts` that reads enqueued dispatch items from queue-state.json and merges them into `ideaItems`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/build/generate-process-improvements.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — follows existing bug-scan collection pattern exactly (read JSON, filter, map to ProcessImprovementItem, classify, push to ideaItems).
  - Approach: 85% — merging as type "idea" with source "queue-state.json" is the simplest integration. Held-back test: no single unknown would drop below 80 — the dispatch schema is stable and all required fields are present.
  - Impact: 85% — 55+ enqueued items become visible immediately on the dashboard.
- **Acceptance:**
  - Enqueued dispatch items appear in `collectProcessImprovements().ideaItems` output.
  - Each dispatch item has: type "idea", business from dispatch, title from `area_anchor`, body from `why`, source "queue-state.json", date from `created_at`, path as queue-state.json relative path, idea_key from `deriveIdeaKey(queueStatePath, dispatch_id)` (dispatch_id is unique, preventing collisions when area_anchor repeats).
  - Dispatches with `queue_state !== "enqueued"` are excluded.
  - All dispatch items run through `classifyIdeaItem()` to populate `own_priority_rank`, `urgency`, `effort`, and `reason_code` (required for `sortIdeaItems()` which sorts by `own_priority_rank`). The classifier is fail-open — if it errors, fields remain unset and the item sorts to rank 999 (lowest). This matches the existing bug-scan item contract.
  - Missing or unparseable queue-state.json is handled gracefully (no items, no error).
- **Validation contract (TC-XX):**
  - TC-01: Queue-state.json with 3 enqueued + 2 completed dispatches → only 3 items in output ideaItems from dispatch source.
  - TC-02: Missing queue-state.json → 0 dispatch items, no error thrown.
  - TC-03: Dispatch items run through classifyIdeaItem() → items have classifier fields populated when classifier succeeds (fail-open: unset on error, sorting to rank 999).
  - TC-04: Dispatch items with identical `area_anchor` but different `dispatch_id` → distinct `idea_key` values (no collision).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: dispatch schema verified in fact-find, collection pattern is identical to bug-scan.
- **Edge Cases & Hardening:**
  - Malformed queue-state.json (missing dispatches array) → return empty, log warning.
  - Dispatch with empty `area_anchor` → skip item (no title).
  - Dispatch with empty `why` → use MISSING_VALUE ("—") as body.
- **What would make this >=90%:**
  - Validation via the existing test suite confirming no regressions.
- **Rollout / rollback:**
  - Rollout: run generator; dispatch items appear on next regeneration.
  - Rollback: revert the collection loop; dispatch items disappear.
- **Documentation impact:** None.
- **Notes / references:**
  - Queue-state path: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
  - Follow the bug-scan collection pattern at lines 627-681 as the structural template.

### TASK-02: Add unit tests for dispatch queue collection

- **Type:** IMPLEMENT
- **Deliverable:** New test cases in `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` covering dispatch collection.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — follows existing test patterns (temp dir fixtures, collectProcessImprovements calls). Existing tests seed results-review and bug-scan fixtures; dispatch fixtures follow the same pattern with queue-state.json.
  - Approach: 85% — test the collection, filtering, and edge cases from TC-01 through TC-04.
  - Impact: 85% — prevents regressions in dispatch collection.
- **Acceptance:**
  - Tests assert TC-01 through TC-04 from TASK-01.
  - Tests verify dispatch items sort correctly alongside results-review items.
  - Tests verify `runCheck()` passes when HTML includes dispatch items.
- **Validation contract (TC-XX):**
  - TC-05: Fixture with queue-state.json containing mixed enqueued/completed → only enqueued items in output.
  - TC-06: Fixture with no queue-state.json → 0 dispatch items, no error.
  - TC-07: Dispatch items carry classifier fields when priority is missing from dispatch.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: test patterns verified in fact-find.
- **Edge Cases & Hardening:** None: edge cases are covered by the test scenarios themselves.
- **What would make this >=90%:**
  - Full test suite green in CI.
- **Rollout / rollback:**
  - Rollout: tests added to existing test file.
  - Rollback: remove test cases.
- **Documentation impact:** None.

### TASK-03: Update git hook to trigger on queue-state.json changes

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/git-hooks/generate-process-improvements.sh` to include queue-state.json in the trigger pattern.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/git-hooks/generate-process-improvements.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — single regex addition to the grep pattern.
  - Approach: 85% — git hook is the existing auto-regeneration mechanism; extending the pattern is the correct integration point.
  - Impact: 85% — ensures dashboard updates when dispatches change.
- **Acceptance:**
  - Staging `queue-state.json` triggers the generator during pre-commit.
  - Existing trigger patterns (results-review, build-record, reflection-debt, bug-scan, completed-ideas) still work.
- **Validation contract (TC-XX):**
  - TC-08: `echo "docs/business-os/startup-loop/ideas/trial/queue-state.json" | grep -E '<pattern>'` matches.
  - TC-09: Existing patterns still match (no regression).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: hook pattern is a single grep regex.
- **Edge Cases & Hardening:** None: pattern is additive.
- **What would make this >=90%:**
  - Manual verification that staging queue-state.json triggers regeneration.
- **Rollout / rollback:**
  - Rollout: hook picks up pattern on next commit.
  - Rollback: revert regex change.
- **Documentation impact:** None.

## Risks & Mitigations

- Risk: 55+ dispatch items clutter the dashboard.
  - Mitigation: Items sort by priority tier; operator can filter by tier group. Low-priority items collapse to backlog section.
- Risk: Dispatch `area_anchor` values are verbose (>100 chars).
  - Mitigation: Existing title length warning at line 605-608 flags items >100 chars for source-level shortening.

## Observability

None: this is a build-time generator with no runtime component.

## Acceptance Criteria (overall)

- [ ] Enqueued dispatch items appear on the process-improvements dashboard as ideas, sorted by priority tier.
- [ ] Completed/processed dispatch items do not appear.
- [ ] `runCheck()` passes after regeneration.
- [ ] Git hook triggers regeneration when queue-state.json is staged.
- [ ] Unit tests cover dispatch collection, filtering, and edge cases.
- [ ] Typecheck and lint pass for `scripts` package.

## Decision Log

- 2026-03-04: Merge dispatch items into existing IDEA_ITEMS array (not a separate section) for simplicity.
- 2026-03-04: Use `queue_state` filter as sole exclusion mechanism for dispatch items; completed-ideas registry not involved.
- 2026-03-04: Use `deriveIdeaKey(queueStatePath, dispatch_id)` for unique idea_key (area_anchor repeats across dispatches).
- 2026-03-04: Always run `classifyIdeaItem()` on dispatch items to populate `own_priority_rank` (required by `sortIdeaItems()`).

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add dispatch collection | Yes | None | No |
| TASK-03: Update git hook pattern | Yes | None | No |
| TASK-02: Add unit tests | Yes (depends on TASK-01) | None | No |

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- Overall: (85 + 85 + 85) / 3 = **85%**
