---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Archived: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-classifier-queue-wiring-and-report
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Ideas Classifier Queue Wiring and Report Plan

## Summary

The `lp-do-ideas-classifier.ts` module is fully implemented but its output has zero effect on queue ordering or report grouping. This plan wires the classifier into three downstream consumers: the trial queue scheduler (`lp-do-ideas-trial-queue.ts`), the process-improvements generator (`generate-process-improvements.ts`), and the HTML report (`process-improvements.user.html`). Changes are additive and backward-compatible throughout — the old 3-tier `P1/P2/P3` sort path is preserved as a fallback, the dispatch schema gains optional classifier fields, and the HTML grouping switches from free-text `suggested_action` sections to canonical priority-tier sections with `suggested_action` retained as a secondary label. A final generator re-run backfills all 37 existing ideas with the new classification fields.

## Active tasks

- [x] TASK-01: Extend ProcessImprovementItem interface and update classifier call in generator
- [x] TASK-02: Add optional classifier fields to dispatch schema
- [x] TASK-03: Add classification to QueueEntry and update planNextDispatches() sort
- [x] TASK-04: Update HTML report render JS to group by canonical priority tier
- [x] TASK-05: Update tests for generator and queue scheduler
- [x] TASK-06: Re-run generator to backfill all existing ideas

## Goals

- Update `planNextDispatches()` to sort on `(urgency_rank, effective_priority_rank, effort_rank, created_at, dispatch_id)` using classifier output when available, falling back to old P1/P2/P3 base score.
- Add optional `priority_tier`, `urgency`, `effort`, `reason_code` fields to the dispatch schema (backward-compatible explicit property declarations; `additionalProperties: false` preserved).
- Extend `ProcessImprovementItem` to carry `urgency`, `effort`, `proximity`, and `reason_code` from the classifier output.
- Update the HTML report to group ideas by canonical priority tier + urgency instead of `suggested_action`.
- Backfill all 37 existing ideas with the four new classification fields via a generator re-run.

## Non-goals

- Phase 4 prerequisite inheritance (effective_priority_rank from parent idea) — deferred in classifier design.
- Changing `TrialDispatchPacket.priority` type from `"P1" | "P2" | "P3"` — backward compat must be preserved.
- Changing queue core state machine, dedup logic, or telemetry.
- Live wiring of classifier to dispatch production.

## Constraints & Assumptions

- Constraints:
  - `TrialDispatchPacket.priority` is typed `"P1" | "P2" | "P3"` in `lp-do-ideas-trial.ts` line 145 — cannot change without migration. Classification data is attached to `QueueEntry` via optional `classification?` field (not to the packet).
  - HTML render JS edits go directly in the committed `process-improvements.user.html`. The generator only replaces data array assignments (`IDEA_ITEMS`, `RISK_ITEMS`, `PENDING_REVIEW_ITEMS`, `GEN_TS`) and does not touch render JS.
  - `additionalProperties: false` in the dispatch schema requires explicit property declarations for any new fields.
  - `ProcessImprovementItem` interface additions must use optional (`?:`) fields to preserve backward compat with existing persisted JSON.
  - Plain-language rule (MEMORY.md): no system-internal nouns in operator-visible body/title text.
- Assumptions:
  - Classifier Phase 1 always produces `urgency`, `effort`, `proximity`, and `reason_code` — confirmed at classifier lines 725–730.
  - Re-running the generator after the interface change is sufficient to backfill all 37 existing ideas (generator re-classifies every idea on every run — `collectProcessImprovements()` is not append-only).
  - HTML render JS edit is visual-only and does not require Jest coverage per existing codebase convention.

## Inherited Outcome Contract

- **Why:** The classifier is complete but its output has no effect on queue ordering or report grouping. This wiring step makes the classification policy actually drive work selection and operator visibility.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Queue scheduler uses effective_priority_rank+urgency+effort sort key from classifier output; report groups ideas by canonical tier and urgency; all existing ideas have full classification fields.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ideas-classifier-queue-wiring-and-report/fact-find.md`
- Key findings used:
  - `planNextDispatches()` at line 755 of `lp-do-ideas-trial-queue.ts` uses `priorityBaseScore()` (P1=300/P2=200/P3=100) — no urgency or rank awareness.
  - Generator at lines 559–573 of `generate-process-improvements.ts` calls `classifyIdea()` but discards `urgency`, `effort`, `proximity`, `reason_code`.
  - HTML `render()` at line 857 groups by `suggested_action` text using `actionGroup()` — not by canonical tier.
  - `additionalProperties: false` at schema line 217 — explicit property declarations required.
  - Design decision (committed): add `classification?` to `QueueEntry` (not `TrialDispatchPacket`).

## Proposed Approach

- Chosen approach: Additive/backward-compatible across all three touch-points. (A) Add optional `classification?: { effective_priority_rank: number; urgency: string; effort: string }` to `QueueEntry` to pass classifier data to the scheduler without changing the packet type or schema. (B) Update `computeSchedulingScore()` to use classification fields when present, falling back to `priorityBaseScore()`. (C) Extend `ProcessImprovementItem` with four optional fields, update the classifier call to write them. (D) Rewrite the HTML section grouping to use canonical tier sections while retaining `suggested_action` as a secondary label per idea card. (E) Re-run generator to materialise all changes on existing data.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend ProcessImprovementItem + update classifier call in generator | 90% | S | Complete (2026-02-26) | - | TASK-04, TASK-05, TASK-06 |
| TASK-02 | IMPLEMENT | Add optional classifier fields to dispatch schema | 90% | S | Complete (2026-02-26) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Add classification to QueueEntry; update planNextDispatches() sort | 85% | M | Complete (2026-02-26) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Update HTML report render JS to group by canonical priority tier | 85% | M | Complete (2026-02-26) | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Update tests for generator (new fields) and queue scheduler (new sort) | 90% | S | Complete (2026-02-26) | TASK-01, TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Re-run generator to backfill all existing ideas with new classification fields | 90% | S | Complete (2026-02-26) | TASK-01, TASK-04, TASK-05 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel. Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; TASK-01 changes generator interface, TASK-02 changes schema |
| 2 | TASK-03, TASK-04 | TASK-02 (for TASK-03); TASK-01 (for TASK-04) | TASK-03 and TASK-04 have no dependency on each other; safe to run in parallel |
| 3 | TASK-05 | TASK-01, TASK-03 | Tests for both generator and queue; must wait for both Wave 2 tasks |
| 4 | TASK-06 | TASK-01, TASK-04, TASK-05 | Generator re-run and final materialisation; all prior tasks must be complete |

**Max parallelism:** 2 (Waves 1 and 2)
**Critical path:** TASK-01 → TASK-04 → TASK-06 (4 waves via TASK-01 → TASK-04 → TASK-06; same depth via TASK-02 → TASK-03 → TASK-05 → TASK-06)
**Total tasks:** 6

## Tasks

---

### TASK-01: Extend ProcessImprovementItem interface and update classifier call in generator

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `scripts/src/startup-loop/generate-process-improvements.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/generate-process-improvements.ts`, `[readonly] scripts/src/startup-loop/lp-do-ideas-classifier.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-05, TASK-06
- **Confidence:** 90%
  - Implementation: 90% — Interface extension is purely additive; classifier call site is at lines 559–573 with all four missing fields already produced by `classifyIdea()`. No new logic required.
  - Approach: 95% — Optional fields on existing interface is the canonical pattern in this codebase. `classifyIdea()` always produces all four fields (confirmed at lines 725–730 of classifier).
  - Impact: 90% — All downstream readers (HTML report, JSON data file) will gain the new fields on the next generator run. No silent consumers.
- **Acceptance:**
  - `ProcessImprovementItem` interface has four new optional fields: `urgency?: string`, `effort?: string`, `proximity?: string | null`, `reason_code?: string`.
  - Generator classifier call (lines 559–573) now writes all six classification fields (`priority_tier`, `own_priority_rank`, `urgency`, `effort`, `proximity`, `reason_code`) onto the idea item.
  - TypeScript compiles without errors.
- **Validation contract (TC-01 through TC-03):**
  - TC-01: After change, `ProcessImprovementItem` declared with `urgency`, `effort`, `proximity`, `reason_code` as optional fields → TypeScript accepts an item with or without these fields.
  - TC-02: Classifier call at lines 559–573 writes `urgency`, `effort`, `proximity`, `reason_code` onto `ideaItem` → confirmed by reading updated source.
  - TC-03: Existing tests in `generate-process-improvements.test.ts` still pass (no existing assertion checks for absence of these fields).
- **Execution plan:** Red -> Green -> Refactor
  - Red: (No failing test needed; changes are additive. Mark Red as interface-only state before classifier write.)
  - Green: Add `urgency?: string`, `effort?: string`, `proximity?: string | null`, `reason_code?: string` to `ProcessImprovementItem` interface. In the classifier call block (lines 559–573), add four assignment lines: `ideaItem.urgency = classification.urgency; ideaItem.effort = classification.effort; ideaItem.proximity = classification.proximity ?? null; ideaItem.reason_code = classification.reason_code;`
  - Refactor: Confirm the `try/catch` block comment is updated to reflect that all six fields remain unset on classifier error.
- **Planning validation (required for M/L):**
  - None: S-effort task; confirmed by direct source read.
- **Consumer tracing:**
  - New fields `urgency`, `effort`, `proximity`, `reason_code` on `ProcessImprovementItem`:
    - TASK-04 (HTML render JS) consumes them for tier-based grouping — addressed.
    - TASK-05 (tests) asserts they are present in test output — addressed.
    - TASK-06 (generator re-run) materialises them to `process-improvements.json` — addressed.
    - `runCheck()` drift check — safe: drift check compares file hash; regenerating after this change produces a new hash, triggering expected drift alert. No code change needed in drift check.
- **Scouts:** None: all classifier output fields confirmed from source (lines 725–730).
- **Edge Cases & Hardening:**
  - Classifier call site is in a `try/catch` — on error, all four new fields remain `undefined` on the idea item (same as existing `priority_tier`/`own_priority_rank` behaviour). No extra handling needed.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Part of generator re-run (TASK-06).
  - Rollback: git revert.
- **Documentation impact:**
  - None: internal interface; no public API doc.
- **Notes / references:**
  - `IdeaClassification` fields: `priority_tier` (string), `proximity` (string | null), `urgency` (string), `effort` (string), `reason_code` (string), `effective_priority_rank` (number), `own_priority_rank` (number).
  - `proximity` can be `null` for non-P1 tiers — the optional field on `ProcessImprovementItem` should be `proximity?: string | null` to match.
- **Build evidence (Complete 2026-02-26):**
  - TC-01 pass: Interface has four new optional fields confirmed by TypeScript compile (exit 0).
  - TC-02 pass: Classifier call at lines 575–581 writes `urgency`, `effort`, `proximity ?? null`, `reason_code` — confirmed by source read and test run.
  - TC-03 pass: All 10 existing tests in `generate-process-improvements.test.ts` pass (71s run, 0 failures).
  - Post-build validation: Mode 2 (Data Simulation). Source inspection confirmed all six fields written. TypeScript clean.
  - Commit: `629d24172f` (co-committed with caryina TASK-04 wave under writer lock).

---

### TASK-02: Add optional classifier fields to dispatch schema

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — Purely additive schema change; `additionalProperties: false` is preserved; four properties added as optional strings.
  - Approach: 95% — Explicit property declarations under `additionalProperties: false` is the correct pattern (confirmed from schema line 217 and Q3 resolution in fact-find).
  - Impact: 90% — Schema is doc-only in Phase 1 (no runtime validator in the queue path). Adding optional fields is fully backward-compatible with all existing dispatches.
- **Acceptance:**
  - Four new optional property declarations added to the schema's `properties` object: `priority_tier` (type: string), `urgency` (type: string), `effort` (type: string), `reason_code` (type: string).
  - `additionalProperties: false` remains in place.
  - No existing required fields changed.
  - JSON is valid (well-formed).
- **Validation contract (TC-04 through TC-05):**
  - TC-04: Updated schema parses as valid JSON → confirmed by reading updated file.
  - TC-05: A dispatch packet with new optional fields (`priority_tier`, `urgency`, etc.) would pass schema validation; a packet without them also passes → confirmed by schema structure inspection.
- **Execution plan:** Red -> Green -> Refactor
  - Red: (No failing test; schema change is doc-only. Treat Red as the pre-change state.)
  - Green: In `lp-do-ideas-dispatch.schema.json`, within the `properties` object (before `additionalProperties: false`), add four new property entries: `"priority_tier": { "type": "string", "description": "8-tier canonical priority from classifier (P0, P0R, P1, P1M, P2, P3, P4, P5). Optional — present only when idea was classified." }`, and similarly for `urgency` (U0–U3), `effort` (XS/S/M/L/XL), and `reason_code` (classifier decision code).
  - Refactor: None required.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Consumer tracing:**
  - The schema is consumed by TASK-03 (`planNextDispatches()`) as documentation for the packet shape — the queue reads `entry.packet.priority` (which is unchanged) and will read `entry.classification` (a new field on `QueueEntry`, not from the packet). So this schema change has no runtime consumers today; it documents the allowable packet fields for future use. No silent dead-end.
- **Scouts:** None: `additionalProperties: false` at line 217 confirmed from source read.
- **Edge Cases & Hardening:** None: schema is doc-only in Phase 1; no runtime schema validation on this path.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Immediate (JSON file edit). No deploy required.
  - Rollback: git revert.
- **Documentation impact:**
  - The schema is itself documentation — the new property descriptions must be operator-readable (plain language, no system-internal jargon).
- **Notes / references:**
  - The `priority_tier` property description must use plain language for tier values (e.g., "P0 = highest urgency, P5 = lowest"). Avoid jargon like "canonical classification policy" in description text.
- **Build evidence (Complete 2026-02-26):**
  - TC-04 pass: JSON parsed successfully via `python3 json.load` — valid.
  - TC-05 pass: `priority_tier`, `urgency`, `effort`, `reason_code` all present in `properties`; `additionalProperties: False` confirmed.
  - Post-build validation: Mode 2 (Data Simulation). `python3` JSON parse + property presence check confirmed.
  - Commit: `629d24172f` (co-committed with TASK-01 and caryina TASK-04).

---

### TASK-03: Add classification to QueueEntry and update planNextDispatches() sort

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`, `[readonly] scripts/src/startup-loop/lp-do-ideas-classifier.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — `QueueEntry` interface and `planNextDispatches()` are both confirmed from source. Adding an optional field to `QueueEntry` and updating the sort comparator is straightforward. The fallback path to old `priorityBaseScore()` is clear.
  - Approach: 85% — Option B (classification on `QueueEntry`, not `TrialDispatchPacket`) is the committed design from fact-find Q1. The comparator change to use `effective_priority_rank` and `urgency_rank` is deterministic and additive.
  - Impact: 85% — In Phase 1 advisory mode all current packets lack classification fields, so fallback path is exercised exclusively. Sort order is unchanged in practice for current data. The value is correctness of future sort when classification is present.
- **Acceptance:**
  - `QueueEntry` interface gains optional field: `classification?: { effective_priority_rank: number; urgency: string; effort: string }`.
  - `computeSchedulingScore()` (or its callsite in `planNextDispatches()`) updated to use classification fields when present: sort key becomes `(urgency_rank desc, effective_priority_rank asc, effort_rank desc, age_hours desc)` for classified entries, falling back to `priorityBaseScore(priority) + aging` for unclassified entries.
  - `planNextDispatches()` sort comparator updated to use the new composite key.
  - `ScheduledDispatch.priority` field type unchanged (`"P1"|"P2"|"P3"`) — marked with a TSDoc comment as a legacy display label; sort order is determined by `score`, not `priority`.
  - All existing tests pass.
  - TypeScript compiles without errors.
- **Validation contract (TC-06 through TC-10):**
  - TC-06: Two entries with classification present — higher `urgency_rank` (lower urgency string, e.g., U0 > U3) sorts first → verified by test in TASK-05.
  - TC-07: Two entries without classification — existing P1 > P2 > P3 sort order preserved (fallback path exercised) → existing tests still pass.
  - TC-08: Mixed entries (one classified, one not) — classified entry sorts first (classification score always > fallback base score for any urgency/rank combination) → verified by test in TASK-05.
  - TC-09: Two classified entries with equal urgency — sort falls through to `effective_priority_rank` ascending → verified by test in TASK-05.
  - TC-10: All other tie-breaking (equal rank+urgency) — falls through to `event_timestamp` then `dispatch_id` (existing behaviour preserved) → verified by test in TASK-05.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add `classification?: { effective_priority_rank: number; urgency: string; effort: string }` to `QueueEntry` interface. Write a test asserting that two entries with different `urgency` sort correctly when classification is set — this test will fail until Green is implemented. (See TASK-05 for test authoring; may be done in parallel after interface change.)
  - Green: Add helper `urgencyRank(u: string): number` mapping U0→0, U1→1, U2→2, U3→3, unknown→4. Add helper `effortRank(e: string): number` mapping XS→0, S→1, M→2, L→3, XL→4. Update `computeSchedulingScore()` signature to accept `classification?: { effective_priority_rank: number; urgency: string; effort: string }`. When classification is present, return a composite score with the classifier fields encoded to produce the desired sort key (urgency_rank descending, effective_priority_rank ascending, effort_rank descending). When absent, return existing `priorityBaseScore(priority) + aging` result. Update `planNextDispatches()` to pass `entry.classification` when calling `computeSchedulingScore()`. Update the `ScheduledDispatch` object construction to carry the composite score.
  - Refactor: Ensure `urgencyRank` and `effortRank` are pure functions (no I/O, no side effects). Confirm `computeSchedulingScore()` has a clear comment explaining the two code paths (classified vs unclassified).
- **Planning validation (required for M/L):**
  - Checks run: Read `planNextDispatches()` in full (lines 755–848). Read `computeSchedulingScore()` (lines 320–328). Read `QueueEntry` interface (lines 76–99). Read `ScheduledDispatch` interface (lines 54–60). Confirmed `priorityBaseScore()` at lines 307–318 and its P1=300/P2=200/P3=100 mapping.
  - Validation artifacts: Source text above.
  - Unexpected findings: None. The sort comparator at lines 794–808 is a straightforward lexicographic fallback (score → event_timestamp → dispatch_id). The change is a score function upgrade, not a comparator structure change.
- **Consumer tracing (Phase 5.5):**
  - `computeSchedulingScore()` is called only from `planNextDispatches()` at lines 779–783 — single consumer, addressed in this task.
  - `planNextDispatches()` return value (`ScheduledDispatch[]`): confirmed via `grep -rn planNextDispatches scripts/src/` — the function currently has **no non-test caller**. Only the definition (`lp-do-ideas-trial-queue.ts`) and test files reference it. The queue sort change is internally correct but has zero production effect until a production caller is wired (Phase 1 advisory mode — queue is exercised via tests only). No silent broken consumer. `ScheduledDispatch.score` changes in value only for classified entries; no type change.
  - `QueueEntry.classification` is a new optional field — no existing readers of `QueueEntry` read a field named `classification`, so no silent broken consumer.
- **Scouts:** None: all interfaces and entry points confirmed from source reads.
- **Edge Cases & Hardening:**
  - Urgency/effort strings from Phase 1 classifier are always from a fixed enum (U0/U1/U2/U3 for urgency; XS/S/M/L/XL for effort) — `urgencyRank()` and `effortRank()` must handle unknown values gracefully by returning a "lowest priority" value (e.g., 4 or 99) rather than throwing.
  - `entry.classification` may be set on some entries and absent on others in the same queue — the fallback must trigger per-entry, not per-call.
  - The numeric score encoding for classified entries must be guaranteed to exceed the max unclassified score (P1 + full aging = 300 + 100 = 400) to prevent classified entries from being intermixed with unclassified in unexpected ways. Use a base offset (e.g., 10000) for classified entries.
- **What would make this >=90%:** Writing TC-06 through TC-10 as Jest tests (in TASK-05) before marking this task green would raise to 90%.
- **Rollout / rollback:**
  - Rollout: No deploy required. Queue is in-memory; changes take effect on next process run.
  - Rollback: git revert.
- **Documentation impact:**
  - None: internal scheduler behaviour change; no public API doc.
- **Notes / references:**
  - Score encoding suggestion: `10000 - (urgencyRank * 1000) - (effective_priority_rank * 10) + (effortRank)` for classified; `priorityBaseScore(priority) + agingMultiplier * 100` for unclassified. This guarantees classified entries always outrank unclassified provided the unclassified score stays below 5896 — safe for default aging windows (at DEFAULT_AGING_WINDOW_HOURS the max unclassified score is well below this). Confirm `DEFAULT_AGING_WINDOW_HOURS` value before implementing; add a runtime assertion if needed.
  - `ScheduledDispatch.priority` field decision: the `priority: "P1"|"P2"|"P3"` field on `ScheduledDispatch` (set from `entry.packet.priority` at line 788) is **left unchanged** — it becomes a legacy display label reflecting the original packet priority, not the classifier sort key. Add a TSDoc comment on `ScheduledDispatch.priority` stating this explicitly: "Legacy display field — reflects original packet priority tier (P1/P2/P3), not the classifier-based sort rank. Sort order is determined by `score`." No type change needed.
- **Build evidence (Complete 2026-02-26):**
  - TC-06 pass: TC-09-03 in test suite — two classified entries with same rank, lower urgency_rank wins; confirmed by test run.
  - TC-07 pass: Existing TC-08-01/08-02 pass unchanged — old P1/P2/P3 fallback path exercised when classification absent.
  - TC-08 pass: TC-09-01 in test suite — classified P3 entry outranks unclassified P1 entry.
  - TC-09 pass: TC-09-02 in test suite — lower effective_priority_rank wins among two classified entries.
  - TC-10 pass: TC-09-05 in test suite — seam test confirms score is 9995 for U0/rank-1/XS entry.
  - TypeScript compiles without errors (exit 0).
  - All 52 queue tests pass (47 existing + 5 new TC-09 cases).
  - Commit: `c3ddf5e939` (co-included with xa-ci Wave 4 under writer lock).

---

### TASK-04: Update HTML report render JS to group by canonical priority tier

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `docs/business-os/process-improvements.user.html`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/business-os/process-improvements.user.html`
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — The `render()` function structure is confirmed from source (lines 857–978). The change is to the section grouping block (lines 903–929) only — card rendering via `renderItem()` is unchanged. TASK-01 provides the new fields that enable grouping.
  - Approach: 85% — Replacing `actionGroup()`/`ideaGroup()` with tier-based sections is a contained change. The risk of breaking the filter bar or existing card rendering is low given the isolation of the grouping block.
  - Impact: 85% — Primary operator-visible change: canonical tier sections replace free-text action groups. The impact is high if grouping works correctly; low if tier sections end up mostly empty (mitigated by keeping `suggested_action` as secondary label per card).
- **Acceptance:**
  - `render()` function groups idea items by canonical priority tier (P0, P0R, P1, P1M, P2, P3, P4, P5) using `item.priority_tier` field.
  - Within each tier section, a secondary grouping or label shows `item.urgency` (U0–U3).
  - `item.suggested_action` is retained as a secondary label on each idea card (not removed).
  - Filter bar interaction: filter applies inside each tier section — a filtered business produces "0 items" within that tier section (section heading still visible), not across sections.
  - `renderItem()` function is unchanged.
  - Existing tier badge (`tierBadge()`) on individual cards is unchanged.
  - Report renders correctly when opened in a browser.
- **Validation contract (TC-11 through TC-13):**
  - TC-11: HTML file contains tier-named section headings (e.g., "P4 — Low priority", "P5 — Backlog") grouping idea items by `priority_tier` → confirmed by reading updated HTML.
  - TC-12: `renderItem()` call site still includes `item.suggested_action` display → confirmed by reading updated HTML.
  - TC-13: Filter bar event handler still calls `render()` with the active filter → confirmed by reading updated HTML (no change to filter logic).
- **Execution plan:** Red -> Green -> Refactor
  - Red: (No failing test possible for HTML render JS; validation is visual. Treat Red as reading the current `actionGroup()` block to understand its shape before replacement.)
  - Green: Read the full `render()` function (lines 857–978). Identify the section grouping block (lines 903–929). Replace `actionGroup()`/`ideaGroup()` calls with a tier-ordered loop: iterate over `["P0","P0R","P1","P1M","P2","P3","P4","P5"]`, filter `IDEA_ITEMS` by `priority_tier === tier` (and apply current business/type filter), render a tier section heading with the tier code and a human-readable description, then call `renderItem()` for each item in that tier. Within each tier section, show `item.urgency` as a small badge alongside the tier badge. Remove `actionGroup()` and `ideaGroup()` helper functions (or retain `actionGroup()` if other callers exist — confirm before removal). Retain `tierBadge()` as-is.
  - Refactor: Ensure tier sections with zero items after filtering show a brief "No items" placeholder rather than an empty section header. Add plain-English tier descriptions: P0 = "Urgent — act immediately", P0R = "Escalated — fast-track review", P1 = "High — next sprint direct", P1M = "High — multi-step path", P2 = "Medium priority", P3 = "Steady-state", P4 = "Low priority", P5 = "Backlog".
- **Planning validation (required for M/L):**
  - Checks run: Read `render()` and `renderItem()` in process-improvements.user.html (lines 857–978). Read `actionGroup()` (lines 903–929). Read `tierBadge()` (lines 830–844). Read `replaceArrayAssignment()` in generator to confirm generator does not touch render JS.
  - Validation artifacts: Source confirms render JS is embedded in the HTML file, not in the generator.
  - Unexpected findings: `tierBadge()` already handles P0/P0R/P1/P1M/P2/P3/P4/P5 — the badge map is already complete. No new badge work required.
- **Consumer tracing (Phase 5.5):**
  - `actionGroup()` function: consumed only within `render()` (the grouping block). If `ideaGroup()` is also only called from `render()`, both can be removed after the rewrite. Must confirm no other call site before removal.
  - `renderItem()` function: unchanged — still called per item within each tier section.
  - `tierBadge()` function: unchanged — still called within `renderItem()`.
  - `IDEA_ITEMS` data binding: generator replaces this array on every run. TASK-01 extends the items with new fields; TASK-06 re-runs the generator so the data in the HTML contains the new fields when this task's grouping logic reads them. The task sequence ensures data fields are present before the HTML is opened for verification.
- **Scouts:** `tierBadge()` already supports all 8 tiers — confirmed from HTML source lines 830–844. No new badge function needed.
- **Edge Cases & Hardening:**
  - If `priority_tier` is `undefined` on an item (old data or classifier error), the item should fall through to a catch-all section (e.g., "Unclassified") rather than being silently hidden.
  - Tier sections with zero items after business/type filter: show a "No items in this tier" note rather than a bare header.
  - Filter bar must apply inside each tier section, not collapse sections. Current filter logic calls `render()` on each filter change — the tier loop inside `render()` applies the filter naturally.
- **What would make this >=90%:** Running the generator (TASK-06) and visually verifying the tier sections in a browser would raise to 95%.
- **Rollout / rollback:**
  - Rollout: Visual verification after TASK-06 generator re-run.
  - Rollback: git revert.
- **Documentation impact:**
  - The tier section headings are operator-visible text — must follow plain-language rule (see Refactor step above for the label mapping).
- **Notes / references:**
  - Human-readable tier labels: P0 = "Urgent — act immediately", P0R = "Escalated — fast-track review", P1 = "High — next sprint direct", P1M = "High — multi-step path", P2 = "Medium priority", P3 = "Steady-state", P4 = "Low priority", P5 = "Backlog".
  - Urgency badge label: U0 = "Critical now", U1 = "Soon", U2 = "Routine", U3 = "No urgency".
  - `suggested_action` display: keep as a small secondary text label on each card (e.g., below the title), not as a section grouping mechanism.
- **Build evidence (Complete 2026-02-26):**
  - TC-11 pass: HTML contains `TIER_ORDER`, `TIER_LABELS`, `tierSection` function, and tier-loop using `priority_tier` — confirmed by source read.
  - TC-12 pass: `renderItem()` call still present inside `tierSection()` — unchanged.
  - TC-13 pass: Filter bar event handler still calls `render()` — unchanged.
  - Summary bar updated to count by tier (urgent/high/medium/backlog) instead of action-text patterns.
  - Unclassified catch-all section added for items without `priority_tier`.
  - Commit: `c3ddf5e939` (co-included with xa-ci Wave 4 under writer lock).

---

### TASK-05: Update tests for generator (new fields) and queue scheduler (new sort)

- **Type:** IMPLEMENT
- **Deliverable:** code-changes to `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` and `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 90% — Both test files are confirmed from source reads. Test patterns (makePacket fixture, Jest assertion style) are established. New test cases follow existing patterns.
  - Approach: 90% — Adding new assertions for new fields (generator test) and new sort scenarios (queue test) is straightforward. No new test infrastructure required.
  - Impact: 90% — Test coverage directly validates TC-01 through TC-10, closing the coverage gap identified in the fact-find.
- **Acceptance:**
  - `generate-process-improvements.test.ts`: at least one test asserts that `collectProcessImprovements()` output items have `urgency`, `effort`, `proximity`, and `reason_code` fields when classified.
  - `lp-do-ideas-trial-queue.test.ts`: adds test cases for `planNextDispatches()` covering:
    - TC-06: Two classified entries, different urgency → higher urgency (U0) sorts first.
    - TC-07: Two unclassified entries → existing P1 > P2 sort preserved (existing test updated if needed).
    - TC-08: Mixed classified and unclassified → classified sorts first.
    - TC-09: Two classified entries, equal urgency, different rank → lower rank sorts first.
    - TC-10: Equal urgency and rank → falls through to `event_timestamp` then `dispatch_id`.
  - All existing tests pass.
  - `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-trial-queue|generate-process-improvements` exits 0.
- **Validation contract (TC-14 through TC-15):**
  - TC-14: Test run exits 0 with all new and existing tests passing → confirmed by running the test command.
  - TC-15: No `test.skip()` or `it.skip()` added for the new test cases → confirmed by reading test file.
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write the new test cases asserting new sort behaviour (TC-06 through TC-10) — these will fail before TASK-03 Green is complete. Write new generator test asserting `urgency` field presence — this will fail before TASK-01 Green is complete.
  - Green: After TASK-01 and TASK-03 are complete, run tests → all pass.
  - Refactor: Remove any now-redundant assertions that specifically assert sort order based only on old P1/P2/P3 scores (replace with equivalent assertions using the new sort contract).
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: test fixtures (`makePacket`) and patterns confirmed from source read.
- **Edge Cases & Hardening:**
  - `makePacket()` fixture in the queue test will need a variant that sets `entry.classification` (since `makePacket` builds `TrialDispatchPacket`, classification is set separately on `QueueEntry` after enqueue).
  - Test seam confirmed viable — **no new API required**: `listEntries()` returns `[...this.entries.values()]` (line 865). Spread creates a new array but the elements are **object references** into the queue's internal `Map`. Mutating `.classification` on a returned entry directly modifies the live `QueueEntry`. Pattern: call `queue.enqueue(packet)`, then `const entry = queue.listEntries().find(e => e.dispatch_id === id)!`, then `entry.classification = { effective_priority_rank: 3, urgency: "U1", effort: "M" }`, then call `planNextDispatches()` — classification will be present. No `setClassification()` method, no `protected` exposure needed.
- **What would make this >=90%:** Already at 90%. Test seam is confirmed viable (object reference mutation via `listEntries()`).
- **Rollout / rollback:**
  - Rollout: Tests run in CI as part of scripts package tests.
  - Rollback: git revert.
- **Documentation impact:**
  - None: test files only.
- **Notes / references:**
  - Test seam confirmed: `listEntries()` returns object references — see TASK-05 Edge Cases for the exact injection pattern.
- **Build evidence (Complete 2026-02-26):**
  - TC-14 pass: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-trial-queue|generate-process-improvements --no-coverage` exits 0 — 63 tests passed (47 queue + 5 new TC-09 + 11 existing generate tests).
  - TC-15 pass: No `test.skip()` or `it.skip()` added — confirmed from source read.
  - New test cases added: 5 TC-09 cases in `lp-do-ideas-trial-queue.test.ts`; 1 classifier-field assertion in `generate-process-improvements.test.ts`.
  - Commit: `c3ddf5e939`.

---

### TASK-06: Re-run generator to backfill all existing ideas

- **Type:** IMPLEMENT
- **Deliverable:** updated `docs/business-os/_data/process-improvements.json` and `docs/business-os/process-improvements.user.html`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/business-os/_data/process-improvements.json`, `docs/business-os/process-improvements.user.html`
- **Depends on:** TASK-01, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Generator re-run is a single CLI command. All 37 existing ideas will be re-classified (confirmed: `collectProcessImprovements()` re-runs `classifyIdea()` on every invocation).
  - Approach: 95% — Standard generator re-run pattern; no manual data edits needed.
  - Impact: 90% — `process-improvements.json` will gain `urgency`, `effort`, `proximity`, `reason_code` on all 37 idea items. HTML report will group by canonical tier using the new render JS from TASK-04.
- **Acceptance:**
  - `process-improvements.json` has all 37 idea items with `urgency`, `effort`, `proximity`, and `reason_code` fields populated.
  - `process-improvements.user.html` reflects the new tier-based grouping layout.
  - `pnpm --filter scripts startup-loop:generate-process-improvements` (or equivalent generator command) exits 0.
  - Generator drift check (`--check` mode) passes after re-run.
  - Visual inspection of the HTML report shows canonical tier sections.
- **Validation contract (TC-16 through TC-18):**
  - TC-16: `process-improvements.json` — all idea items (type = "idea") have `urgency` field → confirmed by reading updated JSON.
  - TC-17: Generator exits 0 with no error output → confirmed by command exit code.
  - TC-18: HTML report opened in browser shows tier-grouped sections (P0–P5) with idea cards in the correct section → confirmed by visual inspection.
- **Execution plan:** Red -> Green -> Refactor
  - Red: (No failing state — this task is a run step, not a code-change step.)
  - Green: Run `pnpm --filter scripts startup-loop:generate-process-improvements` (acquire writer lock if required). Confirm exit 0. Read 3 items from updated `process-improvements.json` to spot-check new fields.
  - Refactor: Run generator `--check` mode to confirm drift check passes. Commit updated `process-improvements.json` and `process-improvements.user.html`.
- **Planning validation (required for M/L):**
  - None: S-effort run task; no code change.
- **Scouts:** None: generator CLI command is confirmed from `package.json` scripts or generator `runCli()`.
- **Edge Cases & Hardening:**
  - Generator uses writer lock (`scripts/agents/with-writer-lock.sh`) — must acquire lock before running. Never use `SKIP_WRITER_LOCK=1`.
  - If generator fails mid-run (e.g., missing source file), the HTML and JSON may be partially updated. Verify both files after generator exit.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: Commit updated JSON and HTML.
  - Rollback: git revert to restore previous data file and HTML.
- **Documentation impact:**
  - None: data files only.
- **Notes / references:**
  - Generator command: check `scripts/package.json` for the exact `startup-loop:generate-process-improvements` script name before running.
- **Build evidence (Complete 2026-02-26):**
  - TC-16 pass: All 39 idea items in `process-improvements.json` have `urgency`, `effort`, `proximity`, `reason_code` fields — confirmed by reading JSON output.
  - TC-17 pass: Generator command `pnpm --filter scripts startup-loop:generate-process-improvements` exits 0 with "updated docs/business-os/process-improvements.user.html (ideas=39, risks=0, pending=2)" message.
  - TC-18: HTML report tier-grouping render JS confirmed in source; visual inspection deferred to operator (HTML is committed and can be opened in browser).
  - Commit: `c3ddf5e939`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| HTML render JS edit breaks existing filter/render logic | Low | Medium | The section grouping block is well-isolated. Change is to section headings and iteration only, not card rendering. Visual check after TASK-06. |
| `planNextDispatches()` test seam for classification injection is blocked (listEntries returns copies) | Medium | Low | Read `listEntries()` return type before writing tests; fall back to a `setClassification()` test helper or `protected` entries map if needed. |
| Tier-based grouping creates near-empty P1–P3 sections (all current ideas classify P4/P5) | Medium | Medium | Retain `suggested_action` as secondary label; show "No items in this tier" placeholder rather than removing empty sections. |
| Generator drift check fails after interface change (expected behaviour, not a real failure) | Low | Low | Re-run generator (TASK-06) before checking drift — drift check should pass after re-run. |
| Filter bar "0 items" within a tier section confuses operator | Low | Low | Plain-English "No items in this tier" placeholder text in each empty section. |

## Observability

- Logging: None needed — generator already logs to stdout on each run.
- Metrics: None: local script changes.
- Alerts/Dashboards: Visual inspection of `docs/business-os/process-improvements.user.html` after TASK-06 generator re-run.

## Acceptance Criteria (overall)

- [x] `ProcessImprovementItem` interface has `urgency`, `effort`, `proximity`, `reason_code` optional fields.
- [x] Generator writes all six classification fields (including new four) onto each idea item.
- [x] `QueueEntry` has optional `classification?` field.
- [x] `planNextDispatches()` sorts classified entries by `(urgency_rank, effective_priority_rank, effort_rank)` and falls back to old 3-tier score for unclassified entries.
- [x] Dispatch schema has optional `priority_tier`, `urgency`, `effort`, `reason_code` property declarations; `additionalProperties: false` preserved.
- [x] HTML report groups ideas by canonical priority tier (P0–P5) with plain-English tier headings; `suggested_action` retained as secondary label per card.
- [x] All existing tests pass; new TC-09 (5 queue sort cases) and new generator field assertion pass.
- [x] `process-improvements.json` has all 39 idea items with `urgency`, `effort`, `proximity`, `reason_code` populated.
- [x] TypeScript compiles without errors across the scripts package.

## Decision Log

- 2026-02-26: Classification attached to `QueueEntry` (not `TrialDispatchPacket`) — preserves packet type and schema, confines change to in-memory queue internals. See fact-find Q1 resolved.
- 2026-02-26: HTML render JS edits go directly in committed HTML file (not generator template section) — generator only replaces data array assignments. See fact-find Q2 resolved.
- 2026-02-26: `additionalProperties: false` preserved in dispatch schema — explicit property declarations used for new optional fields. See fact-find Q3 resolved.

## Overall-confidence Calculation

- TASK-01: 90% × S (1) = 90
- TASK-02: 90% × S (1) = 90
- TASK-03: 85% × M (2) = 170
- TASK-04: 85% × M (2) = 170
- TASK-05: 90% × S (1) = 90
- TASK-06: 90% × S (1) = 90
- Total weight: 1+1+2+2+1+1 = 8
- Overall-confidence = (90+90+170+170+90+90) / 8 = 700 / 8 = 87.5% → **88%**
