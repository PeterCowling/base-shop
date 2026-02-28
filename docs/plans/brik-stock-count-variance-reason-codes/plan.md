---
Type: Plan
Status: Active
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-stock-count-variance-reason-codes
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: per-task composite = min(Implementation,Approach,Impact); Overall-confidence = effort-weighted average of per-task composites (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
---

# BRIK Stock Count Variance Reason Codes — Plan

## Summary

When a batch stock count produces a negative delta (stock shortfall), the reception app currently writes a generic `"conteggio batch"` reason to every ledger entry regardless of what actually caused the loss. This makes it impossible to distinguish spoilage, breakage, staff comp, or theft in the variance report. The change adds an Italian-language reason-code dropdown to the batch count confirmation step (triggered only when at least one item in a category has a negative delta), persists the selected reason on affected ledger entries, and surfaces a reason-coded breakdown in the Variance Breakdown section of StockManagement. No schema migration, no server-side changes, and no new dependencies are required — the `reason` field on `InventoryLedgerEntry` already exists and is already rendered in the Count Variance Report table and variance CSV export.

## Active tasks

- [x] TASK-01: Add `VARIANCE_REASON_CODES` constant and `VarianceReasonCode` type
- [x] TASK-02: Add reason-code prompt UI to `BatchStockCount`
- [x] TASK-03: Wire selected reason into `executeCategorySubmit`
- [x] TASK-04: Add reason-coded breakdown to `VarianceBreakdownSection`
- [ ] TASK-05: Update `BatchStockCount` test suite
- [ ] TASK-06: Update `StockManagement` test suite

## Goals

- Prompt the operator for a reason code when a batch count produces a negative delta for any item in a category.
- Persist the reason on each negative-delta ledger entry.
- Surface reason codes in the Count Variance Report (already wired — auto-populates after TASK-03) and in a new reason-coded table in `VarianceBreakdownSection`.
- Reuse `InventoryLedgerEntry.reason` and `InventoryLedgerEntry.note` — no schema changes.

## Non-goals

- Reason codes for positive deltas.
- Per-item reason prompts (per-category is the chosen granularity).
- Modifying single-item count entries in the `StockManagement` per-item row.
- Changes to `InventoryLedgerEntry` schema, `useInventoryLedgerMutations` hook, or Firebase path structure. New TypeScript types (`VarianceReasonCode`, local prop interfaces) are local to the component files and are not schema changes.

## Constraints & Assumptions

- Constraints:
  - Prompt must not appear when all deltas are zero or positive.
  - Reason-code collection must happen before `executeCategorySubmit` is called (entries are written immediately inside that function).
  - Reauth modal (`PasswordReauthModal`) remains unmodified — reason-code prompt is a new sibling gate.
  - Italian UI strings for all user-facing labels.
  - `data-cy` attributes on all new interactive elements.
- Assumptions:
  - Reason-code prompt is mandatory (no skip option) — highest audit value, one dropdown tap.
  - "Altro" selection shows an optional free-text note input stored in `entry.note`.
  - Per-category granularity: one reason covers the net negative result for the whole category.
  - Predefined reasons (Italian): "Scarto", "Consumo staff", "Rottura", "Furto", "Altro".

## Inherited Outcome Contract

- **Why:** Operators cannot distinguish spoilage, staff comp, breakage, or theft from each other in the variance ledger. This blocks meaningful stock-loss investigation and undermines audit confidence.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Count variance entries always carry a reason code for negative deltas, enabling operators to categorise each variance event and produce a reason-coded breakdown in the variance report.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-stock-count-variance-reason-codes/fact-find.md`
- Key findings used:
  - `InventoryLedgerEntry.reason?: string` already exists in interface, Zod schema, and is already rendered in the Count Variance Report table and CSV export — no schema migration.
  - `executeCategorySubmit` is the single write site; insertion point is `handleCompleteCategory` (lines 253–287).
  - `pendingBatch` state pattern established in commit `24f7422b06` is the direct precedent for the reason-code staging state.
  - `PasswordReauthModal` props confirmed: `title`, `instructions`, `onSuccess`, `onCancel`, `hideCancel` — unmodified.
  - `VarianceBreakdownSection` currently aggregates by item; needs new compute over `countEntries` grouped by reason.

## Proposed Approach

- Option A: Per-category mandatory dropdown with "Altro" + free-text note. Reason stored in `entry.reason`; note stored in `entry.note`. New state variable `pendingReason` (separate from `pendingBatch`) to decouple the reason-collection gate from the reauth gate.
- Option B: Per-item reason prompts (one prompt per negative-delta item per category). Higher audit granularity but far more friction in bulk-count scenarios.
- Chosen approach: **Option A** — per-category dropdown, mandatory selection, "Altro" with optional free-text note. Follows the existing category-level UX pattern (reauth is also per-category, not per-item). Minimal friction; highest audit consistency. Per-item coding is deferred as a future enhancement.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `VARIANCE_REASON_CODES` constant and `VarianceReasonCode` type | 95% | S | Complete (2026-02-28) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Add reason-code prompt UI to `BatchStockCount` | 85% | M | Complete (2026-02-28) | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Wire selected reason into `executeCategorySubmit` | 90% | S | Complete (2026-02-28) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Add reason-coded breakdown to `VarianceBreakdownSection` | 85% | M | Complete (2026-02-28) | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Update `BatchStockCount` test suite | 85% | M | Pending | TASK-02, TASK-03 | - |
| TASK-06 | IMPLEMENT | Update `StockManagement` test suite | 85% | S | Pending | TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Foundation: constants + types |
| 2 | TASK-02, TASK-04 | TASK-01 complete | Parallel: BatchStockCount UI and StockManagement breakdown are independent |
| 3 | TASK-03 | TASK-02 complete | Wire reason into submit path |
| 4 | TASK-05, TASK-06 | TASK-03 complete (TASK-05); TASK-04 complete (TASK-06) | Parallel: test suites are independent |

## Tasks

---

### TASK-01: Add `VARIANCE_REASON_CODES` constant and `VarianceReasonCode` type

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new shared constants file `apps/reception/src/constants/inventoryReasons.ts` exporting `VARIANCE_REASON_CODES` (a readonly array of `{ value: VarianceReasonCode; label: string }`) and the `VarianceReasonCode` union type. A shared file is required (not inline in `BatchStockCount.tsx`) because both `BatchStockCount.tsx` and `StockManagement.tsx` must import it, and cross-component imports between sibling components are not acceptable.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/constants/inventoryReasons.ts` (new file)
- **Depends on:** —
- **Blocks:** TASK-02, TASK-04

- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - File created: `apps/reception/src/constants/inventoryReasons.ts` — 17 lines; `VarianceReasonCode` union + `VARIANCE_REASON_CODES` ReadonlyArray<{value, label}> with 5 entries.
  - Typecheck: `pnpm --filter @apps/reception typecheck` passed (tsc --noEmit, exit 0).
  - Committed in: `1272fde23d` (included with EOD closure commit by concurrent agent; file content correct per acceptance criteria).
  - TC-01/TC-02: Static — verified by export shape and union type constraints in file; TypeScript compile gate passed.
- **Confidence:** 95%
  - Implementation: 95% — pure constant/type addition; no runtime risk; well-understood pattern.
  - Approach: 95% — Italian label convention is established; value set is agreed.
  - Impact: 95% — foundational; downstream tasks cannot proceed without it; zero blast radius on its own.

- **Acceptance:**
  - `VARIANCE_REASON_CODES` is exported and typed as `ReadonlyArray<{ value: VarianceReasonCode; label: string }>`.
  - Values: `"Scarto"`, `"Consumo staff"`, `"Rottura"`, `"Furto"`, `"Altro"` — each with an Italian label string.
  - `VarianceReasonCode` is a union type of the five string literals.
  - TypeScript compiles with no new errors.

- **Validation contract (TC-01):**
  - TC-01: Import `VARIANCE_REASON_CODES` in a test or consuming file → produces an array of 5 entries with `value` and `label` fields, each a non-empty string.
  - TC-02: TypeScript assignment of an unlisted string to `VarianceReasonCode` → compile-time error (type safety confirmed via `tsc --noEmit`).

- **Execution plan:** Red → Green → Refactor
  - Red: none (additive only — no existing test to break).
  - Green: Add the constant and type. Confirm `tsc --noEmit` (or CI typecheck) passes.
  - Refactor: None required — new file is clean from creation.

- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: constant addition, no unknowns.
- **Edge Cases & Hardening:** None: static data; no runtime input.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: additive; no user-visible change until TASK-02 renders the constant.
  - Rollback: remove the constant and type; no data impact.
- **Documentation impact:** None: internal constant; no public API.
- **Notes / references:** `BATCH_REASON = "conteggio batch"` remains in `BatchStockCount.tsx` (line 20) — it is not moved to the new constants file, as it is only used within that component. `VARIANCE_REASON_CODES` goes to `apps/reception/src/constants/inventoryReasons.ts` for shared access.

---

### TASK-02: Add reason-code prompt UI to `BatchStockCount`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `pendingReason` state in `BatchStockCount` holding `{ category: string; categoryItems: InventoryItem[]; reason: VarianceReasonCode | null; note: string } | null`; inline reason-code prompt rendered when `pendingReason` is non-null; updated `handleCompleteCategory` that gates on negative delta before calling reauth or submit. The "Conferma" button is disabled until `reason` is non-null.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/inventory/BatchStockCount.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05

- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - File modified: `apps/reception/src/components/inventory/BatchStockCount.tsx` — added `PendingReasonCapture` interface, `VarianceReasonPrompt` sub-component (extracted at ~80 lines), `pendingReason` state, `getCategoryDeltas`/`submitCategoryWithReauthGate`/`handleConfirmReason`/`handleCancelReason`/`handleReasonChange`/`handleReasonNoteChange` callbacks; `handleCompleteCategory` updated with negative-delta gate.
  - Typecheck: `pnpm --filter @apps/reception typecheck` passed (exit 0).
  - Committed in: `b527bd13b6` (Wave 2 commit with TASK-04).
- **Confidence:** 85%
  - Implementation: 90% — insertion point confirmed (`handleCompleteCategory` lines 253–287); `pendingBatch` pattern is the direct precedent for staging state before `executeCategorySubmit`.
  - Approach: 85% — per-category mandatory dropdown follows existing UX convention; "Altro" + free-text note adds a small branching UI path but is well-understood.
  - Impact: 80% — prompt appears correctly only for negative deltas; operator confirmation of the predefined reason list before ship is recommended but not blocking.
  - Held-back test (Impact at 80): "What single unresolved unknown, if it resolves badly, would drop Impact below 80?" → Operators could find the mandatory prompt disruptive for very small negative variances (e.g. −0.1 unit rounding). Mitigation already in constraints: prompt only on delta < 0, which is the intended threshold. This is a known-bounded risk, not an unresolved unknown. Held-back test passes.

- **Acceptance:**
  - `handleCompleteCategory` computes whether any delta < 0 for the category's entered quantities.
  - If no delta < 0 → proceeds directly to reauth check / `executeCategorySubmit` using the **existing** signature `(category, categoryItems)` — TASK-02 does NOT change this signature. TASK-03 introduces the `reason/note` parameters in a separate step.
  - If any delta < 0 → sets `pendingReason` state with `{ category, categoryItems, reason: null (no pre-selection), note: "" }`. Submission is deferred until the operator selects a reason.
  - Reason-code UI renders when `pendingReason !== null`: a `<select>` with `data-cy="variance-reason-select"` whose first `<option>` is a disabled placeholder ("Seleziona motivo…") with an empty value; subsequent options populated from `VARIANCE_REASON_CODES`; a `<textarea>` (or `<input type="text">`) with `data-cy="variance-reason-note"` shown only when `reason === "Altro"`; a "Conferma" (confirm) button (disabled until a non-empty reason is selected) and a "Annulla" (cancel) button.
  - "Annulla" sets `pendingReason` to null (no submission).
  - "Conferma" updates `pendingReason` with the selected reason + note and then calls the **existing** `executeCategorySubmit(category, categoryItems)` (TASK-03 will later refactor this to pass reason/note as args). At this TASK-02 stage the reason is in local state but not yet passed to `executeCategorySubmit` — the component compiles and runs correctly as an interim state, with TASK-03 closing the persistence gap atomically.
  - `data-cy` attributes present on all new interactive elements.

- **Validation contract (TC):**
  - TC-01: Category with one item, delta = −3 → reason-code select appears after clicking "Complete category".
  - TC-02: Category with one item, delta = +2 → reason-code select does not appear; submission proceeds directly.
  - TC-03: Category with two items, deltas = +1 and −2 → reason-code select appears (mixed deltas; at least one negative).
  - TC-04: Category with all deltas = 0 → reason-code select does not appear.
  - TC-05: "Altro" selected → note input field becomes visible.
  - TC-06: Non-"Altro" reason selected → note input field is absent.
  - TC-07: "Annulla" clicked on reason prompt → `pendingReason` clears; `addLedgerEntry` not called.

- **Execution plan:** Red → Green → Refactor
  - Red: No new failing stubs (M effort; all tests for this task are written in TASK-05 after implementation is complete).
  - Green: Add `pendingReason` state; gate in `handleCompleteCategory`; render reason-code select (with disabled placeholder first option) and conditional note input; wire Confirm/Cancel handlers. The Confirm handler advances to the reauth check / `executeCategorySubmit` path; TASK-03 tightens the reason handoff into that call.
  - Refactor: Extract reason-code prompt into a small inline `VarianceReasonPrompt` sub-component if the JSX block exceeds ~40 lines, to keep `BatchStockCount` readable.

- **Planning validation (required for M/L):**
  - Checks run:
    - Read `BatchStockCount.tsx` in full: `handleCompleteCategory` state machine confirmed at lines 253–287; `pendingBatch` state pattern at line 84.
    - `PendingBatchSubmission` interface at lines 34–37: currently `{ category: string; categoryItems: InventoryItem[] }` — this task introduces a separate `pendingReason` state (new interface, not extending `PendingBatchSubmission`) to avoid coupling with the existing reauth gate.
    - `PasswordReauthModal` renders when `pendingBatch !== null` at lines 432–452 — unaffected by `pendingReason` state.
  - Validation artifacts: `BatchStockCount.tsx` lines 253–287 (insertion point), lines 432–452 (reauth render, confirm unaffected).
  - Unexpected findings: None. The two states (`pendingReason` and `pendingBatch`) are independent; sequencing is: `handleCompleteCategory` → reason check (new) → reauth check (existing). This means reason is always collected before reauth, which is correct.

- **Consumer tracing:**
  - New output: `pendingReason` state — consumed by: the new reason-code UI render block; the reason-prompt Confirm handler (advances to reauth/submit); TASK-03 (reads `pendingReason.reason` and `pendingReason.note` to pass to `executeCategorySubmit`).
  - Modified behavior: `handleCompleteCategory` gains a new early exit (sets `pendingReason`) before the reauth check. The existing reauth path (`setPendingBatch`) is unchanged — it fires after reason is confirmed. No existing consumer of `handleCompleteCategory` is broken; it is called only by button `onClick` in the JSX.

- **Scouts:** `pendingReason` is a new state variable distinct from `pendingBatch` — they can coexist; the reason prompt renders when `pendingReason !== null` and the reauth modal renders when `pendingBatch !== null`. These are mutually exclusive in the flow (reason always clears before reauth is triggered) but the render guards must be correct.
- **Edge Cases & Hardening:**
  - All items entered as 0 (delta = 0 for all) → no reason prompt; category completes without prompt. This is correct — zero delta is not a loss event.
  - Operator enters quantity higher than expected (positive delta) then corrects to lower (negative) without submitting — `enteredQuantities` state drives delta computation at submit time; the reason gate runs on the deltas at the moment "Complete category" is clicked, which is correct.
  - "Annulla" on reason prompt → `pendingReason = null`; quantities remain in state; operator can re-enter quantities or re-click "Complete category".
- **What would make this >=90%:** Operator confirms the predefined reason-code list covers real operational cases at BRIK (would raise Impact to 90% → composite to 90%).
- **Rollout / rollback:**
  - Rollout: client-side only; immediate after deploy.
  - Rollback: revert PR. No data migration needed — existing count entries without reason codes render `"-"` in the report (existing fallback).
- **Documentation impact:** None: internal operational UX; no public API or docs to update.
- **Notes / references:** `pendingBatch` state machine (commit `24f7422b06`) is the direct precedent. Keep the two states named distinctly to avoid confusion during code review.

---

### TASK-03: Wire selected reason into `executeCategorySubmit`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `executeCategorySubmit` gains `reason: VarianceReasonCode | undefined` and `note: string | undefined` parameters; negative-delta entries receive the selected reason when `reason` is defined; non-negative entries (and all entries when `reason === undefined`) retain `BATCH_REASON`; both call sites of `executeCategorySubmit` updated to pass the collected reason (or `undefined` for positive-only categories).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/inventory/BatchStockCount.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-05

- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - File modified: `apps/reception/src/components/inventory/BatchStockCount.tsx` — `executeCategorySubmit` updated with `reason?/note?` params; per-item routing: delta<0 gets selected reason, delta>=0 gets BATCH_REASON; `PendingBatchSubmission` extended; both call sites updated.
  - Typecheck: `pnpm --filter @apps/reception typecheck` passed (exit 0).
  - Committed in: `140ef16f59`.
- **Confidence:** 90%
  - Implementation: 95% — function signature change is localised; both call sites are in the same file; `addLedgerEntry` already accepts `reason` and `note`.
  - Approach: 90% — applying reason to negative-delta items only while retaining `BATCH_REASON` for non-negative items is explicit and testable.
  - Impact: 90% — this is the actual persistence step; once shipped, every negative-delta batch count entry carries the operator-selected reason in Firebase.

- **Acceptance:**
  - `executeCategorySubmit(category, categoryItems, reason, note)` signature (or equivalent closure over `pendingReason` state).
  - Inside the item loop: if `delta < 0` AND `reason !== undefined`, `addLedgerEntry` receives `reason: reason, note: note || undefined`; otherwise (delta >= 0, or reason === undefined), `addLedgerEntry` receives `reason: BATCH_REASON`.
  - Both call sites: the direct call in `handleCompleteCategory` (after reason confirmed, no reauth needed) and the `onSuccess` callback of `PasswordReauthModal` (reauth path) pass the collected reason and note.
  - TypeScript compiles with no new errors.

- **Validation contract (TC):**
  - TC-01: Submit category with delta = −3, reason = "Scarto" → `addLedgerEntry` called with `{ reason: "Scarto", quantity: -3 }`.
  - TC-02: Submit category with delta = +2 (positive) → `addLedgerEntry` called with `{ reason: "conteggio batch", quantity: 2 }`.
  - TC-03: Submit category with delta = −1, reason = "Altro", note = "caduto" → `addLedgerEntry` called with `{ reason: "Altro", note: "caduto", quantity: -1 }`.
  - TC-04: Submit via reauth path (large variance), reason = "Furto" → `addLedgerEntry` still receives `{ reason: "Furto" }` (reason not lost through reauth modal flow).
  - TC-05: Category with mixed deltas (+2 for item A, −1 for item B), reason = "Scarto" → item A gets `reason: "conteggio batch"`, item B gets `reason: "Scarto"`.

- **Execution plan:** Red → Green → Refactor
  - Red: Existing test `"submits positive count delta without reauth"` asserts `reason: "conteggio batch"` for a positive delta — this test must be updated in TASK-05 to match new behavior (positive delta still gets `BATCH_REASON`, so the test assertion is already correct for positive). The negative-delta test currently does not assert on reason — TASK-05 adds that assertion.
  - Green: Update `executeCategorySubmit` signature; add reason routing inside the item loop; update both call sites.
  - Refactor: Confirm `useCallback` deps array updated to include `reason`/`note` if they are closure-captured rather than passed as arguments.

- **Planning validation (required for M/L):** None: S effort.

- **Consumer tracing:**
  - Modified function: `executeCategorySubmit` — callers: (1) direct call in `handleCompleteCategory` at line 284; (2) reauth `onSuccess` at line 443. Both are in `BatchStockCount.tsx`. Both must be updated in this task. No external callers.
  - `addLedgerEntry` signature: `Omit<InventoryLedgerEntry, "user" | typeof TIMESTAMP_KEY>` — `reason?: string` and `note?: string` already present. No change to the hook.

- **Scouts:** `useCallback` dependency arrays — `executeCategorySubmit` is wrapped in `useCallback`; if `reason`/`note` are passed as parameters (not closure), they don't need to be in the dep array. Prefer the parameter approach to avoid stale closures.
- **Edge Cases & Hardening:** note field undefined (when reason ≠ "Altro") → pass `note: undefined` to `addLedgerEntry`; Zod schema has `note: z.string().optional()` — `undefined` is valid.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: client-side only.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:** `executeCategorySubmit` is defined at line 182; `addLedgerEntry` call at line 205. The item loop at lines 189–219 is where the reason routing goes.

---

### TASK-04: Add reason-coded breakdown to `VarianceBreakdownSection`

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `buildReasonBreakdown(entries, windowDays)` function in `StockManagement.tsx`; new `reasonBreakdown` useMemo in the `StockManagement` component; new optional "Reason breakdown" sub-table in `VarianceBreakdownSection` showing count variance grouped by reason code for the active window.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/inventory/StockManagement.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-06

- **Build Evidence:**
  - Offload route: Codex exec (exit 0)
  - File modified: `apps/reception/src/components/inventory/StockManagement.tsx` — added `reason?: string` to `LedgerEntryForVariance`; added `buildReasonBreakdown` pure function; added `reasonBreakdown` useMemo; extended `VarianceBreakdownSectionProps` with `reasonBreakdown`; rendered reason breakdown sub-table with `data-cy="reason-breakdown-table"` and heading "Varianza conteggio batch per motivo"; updated call site.
  - Typecheck: `pnpm --filter @apps/reception typecheck` passed (exit 0).
  - Committed in: `b527bd13b6` (Wave 2 commit with TASK-02).
- **Confidence:** 85%
  - Implementation: 90% — `buildExplainedShrinkageByItem` and `buildUnexplainedVarianceByItem` are pure functions with clear patterns to follow; new function is additive.
  - Approach: 85% — the reason breakdown is additive to `VarianceBreakdownSection`; exact table layout (per-reason total vs per-reason per-item) is a design micro-decision; choosing per-reason total for simplicity.
  - Impact: 85% — surfaces meaningful audit data in the report view; pre-existing entries without reason codes will show `"-"` or `"conteggio batch"` in the reason column, which is the correct historical fallback.

- **Acceptance:**
  - `buildReasonBreakdown(entries: LedgerEntryForVariance[], windowDays: number, validReasons: ReadonlyArray<string>): Record<string, number>` — returns a map of `reason → total absolute quantity` for `count` type entries with negative quantity within the window. Only entries whose `reason` value matches one of the `validReasons` (i.e. `VARIANCE_REASON_CODES` values) are bucketed by reason. All other entries — including those with no reason, `"conteggio batch"`, or any free-text reason from the single-item count flow — are grouped under `"Non specificato"`. This caps the map to at most 6 keys (5 reason codes + "Non specificato"), preventing high-cardinality growth from free-text reasons in other entry types.
  - `StockManagement` computes `reasonBreakdown` via `useMemo` using `entries`, `varianceWindowDays`, and the imported `VARIANCE_REASON_CODES` values array (passed as `validReasons`). This ensures the breakdown only ever produces enum-bounded keys regardless of what reasons exist in the ledger from other entry flows.
  - `VarianceBreakdownSection` receives `reasonBreakdown` as a new prop and renders a "Motivo varianza" (variance reason) sub-table below the existing unexplained-variance table, only when `Object.keys(reasonBreakdown).length > 0`.
  - Sub-table columns: Motivo | Totale varianza (absolute units).
  - `data-cy="reason-breakdown-table"` on the sub-table element.
  - Window selector change recomputes both the existing unexplained-variance table and the new reason breakdown.
  - Existing TC-01 through TC-07 in `StockManagement.test.tsx` pass without modification (additive change).

- **Validation contract (TC):**
  - TC-01: Entries = [count −5 reason "Scarto", count −3 reason "Furto"], window covers both → reason breakdown shows Scarto: 5, Furto: 3.
  - TC-02: Entries = [count −5 no reason], window covers → reason breakdown shows "Non specificato": 5.
  - TC-03: Entries = [count +2 reason "Scarto"] (positive) → not included in breakdown (only negative count entries are counted).
  - TC-04: All count entries outside window → sub-table absent (no keys in reasonBreakdown).
  - TC-05: Window changed from 7 to 14 days → reason breakdown recomputes with wider window.

- **Execution plan:** Red → Green → Refactor
  - Red: No existing test covers the reason breakdown sub-table (TASK-06 adds these).
  - Green: Add `buildReasonBreakdown`; add `useMemo` in `StockManagement`; extend `VarianceBreakdownSectionProps` with `reasonBreakdown: Record<string, number>`; render sub-table.
  - Refactor: Confirm `VarianceBreakdownSectionProps` interface is updated cleanly; check that `data-cy="variance-window-select"` (used in existing TC-06 test) is not affected.

- **Planning validation (required for M/L):**
  - Checks run:
    - Read `StockManagement.tsx` in full: `buildExplainedShrinkageByItem` (lines 55–71) and `buildUnexplainedVarianceByItem` (lines 74–103) are pure functions over `entries` with `type` and `timestamp` filtering — the new `buildReasonBreakdown` follows the same pattern filtering on `type === "count"` and `quantity < 0`.
    - `VarianceBreakdownSectionProps` interface at lines 105–110: currently `{ itemsById, unexplainedVarianceByItem, varianceWindowDays, setVarianceWindowDays }`. Adding `reasonBreakdown: Record<string, number>` is a non-breaking additive change.
    - `VarianceBreakdownSection` render at line 987: `<VarianceBreakdownSection itemsById={itemsById} unexplainedVarianceByItem={unexplainedVarianceByItem} varianceWindowDays={varianceWindowDays} setVarianceWindowDays={setVarianceWindowDays} />` — must add `reasonBreakdown={reasonBreakdown}` to the call site.
    - Existing TC-06 test uses `data-cy="variance-window-select"` — confirmed present at line 129 of `StockManagement.tsx`; will not be affected.
  - Validation artifacts: `StockManagement.tsx` lines 55–103 (existing pure functions), lines 105–110 (props), line 987 (call site).
  - Unexpected findings: `LedgerEntryForVariance` type (lines 42–47) only includes `{ itemId, quantity, timestamp, type }` — it does not include `reason`. The new `buildReasonBreakdown` function needs to access `reason` from entries. Two options: (a) extend `LedgerEntryForVariance` to include `reason?: string`, or (b) use the full `InventoryLedgerEntry` type (already imported via the `useInventoryLedger` hook's `entries`). Option (a) is cleaner — add `reason?: string` to the local `LedgerEntryForVariance` type alias.

- **Consumer tracing:**
  - New function `buildReasonBreakdown` — consumed by: `StockManagement` component useMemo (new), which passes `VARIANCE_REASON_CODES` values (imported from `apps/reception/src/constants/inventoryReasons.ts`, per TASK-01) as the `validReasons` argument. No other consumers. `buildReasonBreakdown` is defined in `StockManagement.tsx` alongside the other pure variance functions.
  - New prop `reasonBreakdown` on `VarianceBreakdownSection` — consumed by: the sub-table render inside `VarianceBreakdownSection`; TASK-06 tests.
  - Modified type `LedgerEntryForVariance` — consumed by: `buildExplainedShrinkageByItem` and `buildUnexplainedVarianceByItem`. Adding `reason?: string` is backward-compatible (optional field); both functions ignore it. Confirmed safe.

- **Scouts:** `LedgerEntryForVariance` extension — adding `reason?: string` is the only type modification; it is additive and backward-compatible.
- **Edge Cases & Hardening:**
  - Entries with `reason === undefined` or `reason === null` → group under `"Non specificato"`.
  - Entries with `reason === "conteggio batch"` (legacy pre-feature entries) → group under `"Non specificato"` (recorded before reason codes existed; no meaningful category).
  - Entries from the single-item count flow in StockManagement that happen to have free-text reasons → group under `"Non specificato"`. Note: these entries are already fully visible in the Count Variance Report table (per-row reason column), which is the correct per-entry view. The reason breakdown table is explicitly scoped to batch-count structured reasons only — its heading should label it as "Varianza conteggio batch per motivo" (batch count variance by reason) to make this scope clear to operators.
  - Empty `reasonBreakdown` (`{}`) → sub-table not rendered (conditional on `Object.keys(reasonBreakdown).length > 0`).
- **What would make this >=90%:** Confirm that grouping legacy `"conteggio batch"` entries under "Non specificato" is the correct operator-facing label (operator review recommended before ship).
- **Rollout / rollback:**
  - Rollout: client-side; additive to existing UI. Existing TC-01 through TC-07 unaffected.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:** `LedgerEntryForVariance` is defined at lines 42–47 of `StockManagement.tsx`. The call site at line 987 must be updated to pass `reasonBreakdown`.

---

### TASK-05: Update `BatchStockCount` test suite

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated and extended `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx` covering reason-code prompt gating, reason value in `addLedgerEntry` calls, combined reauth + reason flow, and "Altro" note path.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 90% — existing mock patterns (`addLedgerEntry` mock, `PasswordReauthModal` mock, `userEvent.selectOptions`) are well-established and directly applicable.
  - Approach: 85% — combined reauth + reason test requires careful ordering of UI interactions but is not untestable; mock pattern is established.
  - Impact: 80% — test coverage closes all identified coverage gaps for the changed code paths.
  - Held-back test (Impact at 80): "What single unknown would drop this below 80?" → If the reason-code select is implemented as a custom component (not a native `<select>`) it would break `userEvent.selectOptions`. The approach for TASK-02 explicitly specifies a native `<select>` with `data-cy`, making this risk negligible. Held-back test: no unresolved unknown would push Impact below 80. Score confirmed at 80.

- **Acceptance:**
  - New tests added (in `describe("BatchStockCount component")`):
    - TC-R01: Delta < 0 → reason-code select (`data-cy="variance-reason-select"`) appears.
    - TC-R02: All deltas ≥ 0 → reason-code select absent; `addLedgerEntry` called with `reason: "conteggio batch"`.
    - TC-R03: Select "Scarto", click confirm → `addLedgerEntry` called with `reason: "Scarto"` for the negative-delta item.
    - TC-R04: Select "Altro", enter note "caduto", click confirm → `addLedgerEntry` called with `reason: "Altro", note: "caduto"`.
    - TC-R05: Note input (`data-cy="variance-reason-note"`) visible only when "Altro" selected.
    - TC-R06: Click "Annulla" on reason prompt → `addLedgerEntry` not called; quantities retained.
    - TC-R07: Large negative variance (reauth required) + reason = "Furto" → after reauth confirm, `addLedgerEntry` called with `reason: "Furto"`.
  - Existing tests that assert `reason: "conteggio batch"` on positive-delta submissions remain passing (positive deltas retain `BATCH_REASON`).
  - Existing test `"submits negative count delta without reauth"` must be updated: it currently does not assert on reason; update to assert `reason: <selected-value>` (or stub with reason-prompt interaction).
  - All 25 pre-existing tests continue to pass after updates.

- **Validation contract:** The test suite itself is the validation artifact; all described TCs must pass in CI.

- **Execution plan:** Red → Green → Refactor
  - Red: None — TASK-05 executes after TASK-02 and TASK-03 are complete; all new tests start green against the implemented component.
  - Green: Write TC-R01 through TC-R07; update `"submits negative count delta without reauth"` to interact with the reason-code prompt before asserting on `addLedgerEntry` call args.
  - Refactor: Extract a `submitCategoryWithReason(reason, note?)` helper for tests that need to click through the reason prompt, to avoid duplication across TCs.

- **Planning validation (required for M/L):**
  - Checks run:
    - Read full `BatchStockCount.test.tsx`: confirmed 25 tests; `addLedgerEntry` mock is `jest.fn().mockResolvedValue(undefined)` — can assert on call args with `expect(addLedgerEntry).toHaveBeenCalledWith(expect.objectContaining({ reason: "Scarto" }))`.
    - `PasswordReauthModal` mock at lines 61–79: renders `data-cy="password-reauth-modal"` with confirm/cancel buttons — combined reauth + reason test can click reason confirm first, then reauth confirm.
    - `userEvent.selectOptions` works on native `<select>` — TASK-02 specifies a native select.
  - Validation artifacts: `BatchStockCount.test.tsx` lines 61–79 (reauth mock), lines 112–120 (`addLedgerEntry` mock setup).
  - Unexpected findings: The existing `"submits negative count delta without reauth"` test asserts `quantity: -3` but does NOT assert on `reason`. Post-TASK-03, this test will still pass (reason field present but not asserted). However, updating it to also assert reason is good hygiene and is included in the acceptance criteria above.

- **Consumer tracing:** Tests are consumers of `BatchStockCount` — no production code depends on the test file.
- **Scouts:** `data-cy="variance-reason-select"` — must exactly match the attribute name used in TASK-02; confirm before writing tests.
- **Edge Cases & Hardening:** Test for "Annulla" (cancel) — ensures partial state is cleaned up correctly.
- **What would make this >=90%:** Confirm native `<select>` in TASK-02 implementation (as specified) — removes the custom-dropdown risk. Already assumed; would raise Implementation to 95%.
- **Rollout / rollback:**
  - Rollout: tests ship with the component changes in the same PR.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:** Test file: `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`. Data-cy convention: `data-cy` attribute (per `jest.setup.ts` configure call using `testIdAttribute: "data-cy"`).

---

### TASK-06: Update `StockManagement` test suite

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated and extended `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx` covering reason codes in Count Variance Report and reason breakdown in `VarianceBreakdownSection`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx`
- **Depends on:** TASK-04
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 90% — existing TC-01 through TC-07 cover `VarianceBreakdownSection` thoroughly; new tests follow the same `makeEntry(type, qty, daysAgo)` helper pattern.
  - Approach: 85% — reason breakdown sub-table is a new UI element targetable by `data-cy="reason-breakdown-table"`.
  - Impact: 85% — closes the last coverage gap; Count Variance Report reason column was already exercised implicitly in existing tests (via `entry.reason ?? "-"`).

- **Acceptance:**
  - New tests added (in `describe("Variance Breakdown")`):
    - TC-VR01: Count entry with `reason: "Scarto"`, quantity −5, within window → reason breakdown sub-table shows "Scarto: 5".
    - TC-VR02: Count entry with no reason, quantity −3 → breakdown shows "Non specificato: 3".
    - TC-VR03: Count entry with `reason: "conteggio batch"` (legacy), quantity −2 → breakdown shows "Non specificato: 2".
    - TC-VR04: Positive count entry with reason → not included in breakdown.
    - TC-VR05: Count entries outside window → sub-table absent.
  - New test in `describe("StockManagement")`:
    - TC-R08: Count entry with `reason: "Furto"` → Count Variance Report table renders "Furto" in the Reason column.
  - All existing TC-01 through TC-07 continue to pass.

- **Validation contract:** CI test run passes with no regressions.

- **Execution plan:** Red → Green → Refactor
  - Green: Write TC-VR01 through TC-VR05 and TC-R08 after TASK-04 is complete.
  - Refactor: Use the existing `makeEntry` helper (with added `reason` field) for clean test setup.

- **Planning validation (required for M/L):** None: S effort.
- **Consumer tracing:** Tests only; no production consumers.
- **Scouts:** `makeEntry` helper in the test file currently produces entries without `reason` — update the helper signature to accept `reason?: string` for new test cases.
- **Edge Cases & Hardening:** Legacy `"conteggio batch"` entries treated as "Non specificato" — covered by TC-VR03.
- **What would make this >=90%:** Operator confirms "Non specificato" is the correct Italian label for ungrouped legacy entries.
- **Rollout / rollback:**
  - Rollout: tests ship with TASK-04 in the same PR.
  - Rollback: revert PR.
- **Documentation impact:** None.
- **Notes / references:** `StockManagement.test.tsx` `makeEntry` helper at lines 424–433. The `getVarianceSection()` helper (line 435) can be reused to scope queries to the Variance Breakdown section.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add `VARIANCE_REASON_CODES` constant and type | Yes | None | No |
| TASK-02: Add reason-code prompt UI | Yes — TASK-01 types available | [Type contract gap, Minor]: `pendingReason` state shape must not reuse `PendingBatchSubmission` interface — a separate type is required to keep the reauth and reason gates decoupled. Resolution: use a new inline type or named interface for `pendingReason`. Addressed in task execution plan. | No |
| TASK-03: Wire reason into `executeCategorySubmit` | Yes — TASK-02 state available | [Ordering inversion, Minor]: Both call sites of `executeCategorySubmit` must be updated atomically with the signature change — partial update would cause a TypeScript error. Both sites are in the same file; addressed explicitly in task. | No |
| TASK-04: Add reason-coded breakdown | Yes — TASK-01 types available; independent of TASK-02/03 | [Type contract gap, Minor]: `LedgerEntryForVariance` lacks `reason` field — must add `reason?: string` before `buildReasonBreakdown` can access it. Addressed in planning validation. | No |
| TASK-05: Update `BatchStockCount` test suite | Yes — TASK-02 and TASK-03 complete | [Missing precondition, Minor]: Tests must use `data-cy` attribute names matching TASK-02 implementation exactly. Coordinate during build to confirm attribute names before test file is written. | No |
| TASK-06: Update `StockManagement` test suite | Yes — TASK-04 complete | [Missing precondition, Minor]: `makeEntry` helper needs `reason?: string` param added before new test cases can compile cleanly. Addressed in Scouts field. | No |

No Critical findings. Two advisory Major findings from the critique loop (TASK-02/03 inter-task contract, "Non specificato" scope) are addressed in task execution plans — the interim TASK-02 compile state is safe, and the reason breakdown scope is now explicitly labeled. Plan may proceed.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `pendingReason` and `pendingBatch` state interaction — reason lost through reauth flow | Low | Medium | Reason collected first and stored in component state before `setPendingBatch`; `executeCategorySubmit` receives reason as argument, not from transient state. |
| Operators select "Altro" routinely, making reason codes uninformative | Medium | Low | Include free-text note for "Altro"; review reason distribution after first week of use. |
| Italian reason-code labels inappropriate for BRIK's operations | Low | Low | Operator review of label list recommended before ship. |
| Existing `BatchStockCount` tests break on new reason-code prompt UI | Medium | Low | TASK-05 updates all affected tests in the same PR. |
| `LedgerEntryForVariance` extension breaks existing pure functions | Low | Low | Adding `reason?: string` is backward-compatible; existing functions ignore the field. |

## Observability

- Logging: None: client-side React component; no server logging.
- Metrics: Reason codes appear in the Count Variance Report immediately after ship. Variance CSV export includes reason column for new entries.
- Alerts/Dashboards: None: no automated alerting for this feature.

## Acceptance Criteria (overall)

- [ ] Batch count with at least one negative-delta item shows reason-code dropdown before confirming the category.
- [ ] Batch count with no negative-delta items proceeds without reason prompt.
- [ ] Selected reason code appears in `entry.reason` for negative-delta count entries in the ledger.
- [ ] Non-negative-delta entries in the same category retain `"conteggio batch"` reason.
- [ ] Count Variance Report in StockManagement shows the reason code for new count entries.
- [ ] Variance Breakdown section shows a reason-coded sub-table for count entries in the active window.
- [ ] "Altro" selection shows a free-text note input; note is stored in `entry.note`.
- [ ] "Annulla" on reason prompt cancels submission without writing any ledger entries.
- [ ] All existing TC-01 through TC-07 (Variance Breakdown) pass without modification.
- [ ] All 25 pre-existing `BatchStockCount` tests pass.
- [ ] No TypeScript or lint errors introduced.

## Decision Log

- 2026-02-28: Per-category (not per-item) reason-code granularity chosen — matches existing per-category UX pattern (reauth modal is also per-category); minimises friction in bulk-count flow.
- 2026-02-28: Mandatory reason-code prompt (no skip option) — highest audit value; one dropdown tap.
- 2026-02-28: Italian labels ("Scarto", "Consumo staff", "Rottura", "Furto", "Altro") — consistent with app-wide Italian string convention.
- 2026-02-28: "Altro" + optional free-text note stored in `entry.note` — reuses existing schema field.
- 2026-02-28: Legacy `"conteggio batch"` entries grouped under "Non specificato" in reason breakdown — correct historical fallback.

## Overall-confidence Calculation

Tasks by effort:
- TASK-01: 95% × S(1) = 95
- TASK-02: 85% × M(2) = 170
- TASK-03: 90% × S(1) = 90
- TASK-04: 85% × M(2) = 170
- TASK-05: 85% × M(2) = 170
- TASK-06: 85% × S(1) = 85

Sum of weighted confidence: 95 + 170 + 90 + 170 + 170 + 85 = 780
Sum of weights: 1 + 2 + 1 + 2 + 2 + 1 = 9
Overall-confidence = 780 / 9 = **87%** → rounded to **85%** (downward bias per scoring rules; nearest multiple of 5).
