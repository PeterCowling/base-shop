---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28 (CHECKPOINT-01 passed — feature complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-stock-batch-count
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Batch Stock Count Plan

## Summary

The reception app currently requires staff to count inventory item-by-item through a full ledger table with no storage-area grouping, no progress indicator, and no variance display at completion. This plan builds `BatchStockCount.tsx`, a new sibling component of `StockManagement.tsx` that groups items by `InventoryItem.category`, shows per-category progress, and surfaces expected-vs-counted variance immediately after each category batch is submitted. All count writes use the existing `inventory/ledger` Firebase path via `addLedgerEntry` with `type: "count"` — no schema changes required. The component is offline-resilient (Firebase RTDB offline queuing + localStorage session progress via a new `useBatchCountProgress` hook) and is toggled from `StockManagement` with no change to existing ledger functionality.

## Active tasks

- [x] TASK-01: Confirm and assign category values for active inventory items
- [x] TASK-02: Extract `useBatchCountProgress` hook
- [x] TASK-03: Build `BatchStockCount` core component
- [x] TASK-04: Add reauth gate for large-variance items
- [x] TASK-05: Add batch count toggle to `StockManagement`
- [x] TASK-06: Write `BatchStockCount` test suite
- [x] CHECKPOINT-01: Validate integrated batch count flow

## Goals

- Build a guided batch stock count flow grouped by storage area/category with progress indicator and immediate variance surfacing.
- Leverage existing `InventoryItem.category` field as grouping key — no schema change.
- Use `addLedgerEntry` directly with `type: "count"` and `reason` field for all writes. (`addCount` helper lacks a `reason` arg and is intentionally not used.)
- Offline-resilient: Firebase RTDB offline queuing for ledger writes + localStorage session progress.
- Surface expected-vs-counted variance per item after each category batch submission.

## Non-goals

- Replacing or modifying the inventory ledger table view in `StockManagement.tsx` — it stays for all non-count actions.
- Expected-vs-unexplained variance decomposition (separate dispatch IDEA-DISPATCH-20260228-0065).
- Unified EOD wizard integration (separate dispatch IDEA-DISPATCH-20260228-0066).
- Firebase schema changes or new `InventoryLedgerEntry` types.
- Deprecating `IngredientStock.tsx` (separate operator decision, out of scope).

## Constraints & Assumptions

- Constraints:
  - Offline-resilient: Firebase RTDB `push()` queues writes offline; localStorage holds in-progress session state. Component must not block on connectivity but must visually indicate pending sync when offline.
  - Touch-friendly: items countable in ≤5 minutes per category on shared tablet hardware.
  - Italian-speaking staff: all new UI text must be in Italian.
  - `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` (10): items with abs(delta) ≥ 10 require `PasswordReauthModal` before category batch commit.
  - `Permissions.STOCK_ACCESS` guard required at component level.
- Assumptions:
  - `InventoryItem.category` field is populated for most items, or will be populated via TASK-01. Graceful fallback to "Senza categoria" (Uncategorised) for items with no category.
  - localStorage is available in the reception app environment — confirmed by `useShiftProgress` usage in `CloseShiftForm`.
  - Large-delta reauth fires once per category batch when any item in the batch has abs(delta) ≥ threshold.

## Inherited Outcome Contract

- **Why:** World-class gap scan (BRIK/reception, 2026-02-28) identified guided batch counting as a major gap — the item-by-item count flow prevents staff from completing accurate stock counts confidently without manager coaching.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guided batch stock count flow is live in the reception app, grouped by storage area, with per-category progress indicator, and immediate variance display at count completion — replacing item-by-item counting for routine stock takes.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-stock-batch-count/fact-find.md`
- Key findings used:
  - `InventoryItem.category?: string` exists as grouping key — no schema change needed.
  - `buildInventorySnapshot(itemsById, entries)` is a reusable pure utility for expected on-hand per item.
  - Write path: `addLedgerEntry({ itemId, type: "count", quantity: delta, reason, unit })` — `addCount` helper intentionally not used (lacks `reason` arg).
  - `PasswordReauthModal` + `setPendingAction` pattern in `StockManagement` is directly reusable.
  - `useShiftProgress` at `apps/reception/src/hooks/utilities/useShiftProgress.ts` provides the localStorage progress pattern.
  - Q1 open: category field population in live Firebase data unconfirmed — TASK-01 investigates.

## Proposed Approach

- Option A: Build `BatchStockCount.tsx` as a new sibling component toggled from `StockManagement`, using existing category field and ledger write path.
- Option B: Extend `StockManagement.tsx` inline with a "batch count mode" state (all logic in one large file).
- Chosen approach: **Option A** — new sibling component. `StockManagement.tsx` is already 874 lines; embedding batch count logic further reduces maintainability. New component is independently testable and rollback is clean (remove file + toggle). The toggle integration in `StockManagement` is minimal (import + conditional render + state).

## Plan Gates

- Foundation Gate: Pass — `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill` confirmed; test landscape and testability documented in fact-find; delivery-readiness confidence 82%.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes — TASK-02 (80%), TASK-04 (85%), TASK-05 (85%), TASK-06 (80%) are IMPLEMENT tasks with confidence ≥80; no blocking DECISION or Needs-Input tasks.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Confirm/assign category values for active items | 75% | S | Complete (2026-02-28) | - | TASK-03 (informational) |
| TASK-02 | IMPLEMENT | Extract `useBatchCountProgress` hook | 80% | S | Complete (2026-02-28) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Build `BatchStockCount` core component | 80% | L | Complete (2026-02-28) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Add reauth gate for large-variance items | 85% | S | Pending | TASK-03 | TASK-06 |
| TASK-05 | IMPLEMENT | Add batch count toggle to `StockManagement` | 85% | S | Pending | TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | Write `BatchStockCount` test suite | 80% | M | Pending | TASK-04, TASK-05 | CHECKPOINT-01 |
| CHECKPOINT-01 | CHECKPOINT | Validate integrated batch count flow | — | — | Pending | TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | — | Independent; run in parallel |
| 2 | TASK-03 | TASK-02 complete; TASK-01 results available (informational) | Core component build |
| 3 | TASK-04, TASK-05 | TASK-03 complete | Extend component + wire toggle; run in parallel |
| 4 | TASK-06 | TASK-04, TASK-05 complete | Full test suite |
| 5 | CHECKPOINT-01 | TASK-06 complete | Integration validation gate |

## Tasks

---

### TASK-01: Confirm and assign category values for active inventory items

- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/reception-stock-batch-count/task-01-category-audit.md` — findings on category field population in live Firebase; category assignment instructions or backfill script if needed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `[readonly] apps/reception/src/types/hooks/data/inventoryItemData.ts`
- **Depends on:** -
- **Blocks:** TASK-03 (informational — TASK-03 proceeds with graceful fallback, but category data maximises batch count value)
- **Build evidence:** Deliverable written: `docs/plans/reception-stock-batch-count/task-01-category-audit.md`. Source analysis confirmed: `category?: string` is optional free-text; only known codebase value is `"ingredient"` (StockManagement filter); no fixture data in source; live coverage unverifiable. Conclusion: assume <80% coverage; deploy with "Senza categoria" fallback as planned. Suggested physical-area category names documented. TASK-03 confidence unchanged (75%); impact upgrades to 85% once operator confirms ≥80% coverage.
- **Confidence:** 75%
  - Implementation: 80% — Firebase console or a targeted read of `inventory/items` confirms category field population. Path and schema confirmed.
  - Approach: 85% — Simple data audit; if categories are sparse, operator assigns them via the reception UI or a one-time admin script.
  - Impact: 65% — If categories are populated and reflect physical storage areas, batch count delivers full value at launch. If not, this task unblocks assignment work.
- **Questions to answer:**
  - Are `InventoryItem.category` values populated for most active items in production Firebase?
  - Do category names reflect physical storage areas?
  - How many active items exist and what fraction have empty/null category?
- **Acceptance:**
  - `task-01-category-audit.md` documents: active item count, category coverage %, list of category names found.
  - If coverage <80%: artifact includes a category assignment plan (category names mapped to physical areas; operator completes assignment before TASK-03 deployment).
  - If coverage ≥80%: artifact confirms batch count can deploy with existing categories.
- **Validation contract:** Artifact exists at specified path with findings and recommendation.
- **Planning validation:** None: investigation task; findings depend on live Firebase data not queryable statically.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** `task-01-category-audit.md` serves as the category assignment decision record.
- **Notes / references:** Q1 from fact-find. Firebase path: `inventory/items`. Read pattern available in reception app source.

---

### TASK-02: Extract `useBatchCountProgress` hook

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/hooks/utilities/useBatchCountProgress.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/hooks/utilities/useBatchCountProgress.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-03
- **Build evidence:** Codex exec exit 0. Deliverable created: `apps/reception/src/hooks/utilities/useBatchCountProgress.ts` (122 lines). Exports `BatchCountProgress` interface + default hook. Returns `{ progress, saveProgress, clearProgress }` reactive state. Mount-time restore with sessionDate mismatch detection (stale clear). Runtime type guard (no `any`). Empty userId guard. Typecheck + lint passed. Pattern matches `useShiftProgress` reference; TC-01–TC-04 contract satisfied by implementation.
- **Confidence:** 80%
  - Implementation: 85% — Interface is well-defined: `{ categoriesComplete: string[], enteredQuantities: Record<string, number> }` keyed in localStorage by `batchCount-${userId}-${date}`. Pattern copied from `useShiftProgress` (confirmed at `apps/reception/src/hooks/utilities/useShiftProgress.ts`).
  - Approach: 90% — Standard localStorage hook; `useShiftProgress` is a proven reference in the same codebase.
  - Impact: 80% — Provides offline-resilient progress save/restore required by the constraint. localStorage availability confirmed (reception app uses it in CloseShiftForm). Held-back test: no single unknown drops this below 80 — `useShiftProgress` confirms localStorage is available in the execution environment.
- **Acceptance:**
  - `useBatchCountProgress` exports `{ progress, saveProgress, clearProgress }`.
  - `saveProgress({ categoriesComplete, enteredQuantities })` writes JSON to localStorage keyed by `batchCount-${userId}-${date}`.
  - On mount: restores progress if key exists and sessionDate matches current date.
  - `clearProgress()` removes the localStorage entry.
  - Stale session (date mismatch) is cleared on first access.
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `saveProgress` with valid data → JSON written to localStorage at correct key.
  - TC-02: After save, re-render hook with matching key → `progress` value contains previously saved `{ categoriesComplete, enteredQuantities }` data (restore happens automatically on mount; no separate `restoreProgress` call required).
  - TC-03: `restoreProgress` with stale date key → returns null and clears key.
  - TC-04: `clearProgress` → localStorage key removed.
- **Execution plan:** Red → write test stubs for TC-01 through TC-04. Green → implement hook with localStorage read/write/clear. Refactor → confirm TypeScript types are exported for `BatchStockCount` to import.
- **Planning validation:** None: S-effort; pattern reference confirmed at `apps/reception/src/hooks/utilities/useShiftProgress.ts`.
- **Scouts:** Read `useShiftProgress.ts` to confirm exact localStorage pattern before implementation.
- **Edge Cases & Hardening:** JSON parse failure → catch, clear, return null. Missing/null userId → skip save without error. Date mismatch → clear stale key.
- **What would make this >=90%:** `useShiftProgress` exact pattern verified before implementation (scout task).
- **Rollout / rollback:** New file only; rollback = delete (no consumers until TASK-03).
- **Documentation impact:** None.
- **Notes / references:** `apps/reception/src/hooks/utilities/useShiftProgress.ts` — localStorage pattern reference.

---

### TASK-03: Build `BatchStockCount` core component

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/inventory/BatchStockCount.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** L
- **Status:** Complete (2026-02-28)
- **Build evidence:** Codex exec exit 0. `BatchStockCount.tsx` created (393 lines). `groupItemsByCategory` exported as pure function. All 10 acceptance criteria met: category grouping with "Senza categoria" fallback, expected on-hand via buildInventorySnapshot, delta calculation, addLedgerEntry writes with type "count"/reason "conteggio batch", item skip for empty inputs, per-category variance summary table, "X / N categorie complete" progress indicator, localStorage save/restore via useBatchCountProgress, onComplete callback, STOCK_ACCESS permission guard, Firebase .info/connected offline banner. Italian UI text throughout. PasswordReauthModal NOT included (TASK-04 scope). Typecheck + lint passed.
- **Post-task re-score:** TASK-03 Impact re-scored 75% → 80% based on TASK-01 evidence (fallback is documented deployment path, not edge case). Overall confidence: min(80,80,80) = 80%.
- **Affects:** `apps/reception/src/components/inventory/BatchStockCount.tsx` (new), `[readonly] apps/reception/src/hooks/data/inventory/useInventoryItems.ts`, `[readonly] apps/reception/src/hooks/data/inventory/useInventoryLedger.ts`, `[readonly] apps/reception/src/utils/inventoryLedger.ts`, `[readonly] apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts`, `[readonly] apps/reception/src/hooks/utilities/useBatchCountProgress.ts`
- **Depends on:** TASK-02, TASK-01 (informational — batch count proceeds with "Senza categoria" fallback if TASK-01 incomplete, but category data maximises impact)
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 75%
  - Implementation: 80% — All hooks, utilities, and write paths are confirmed and reusable without modification. Component architecture is clear. Held-back test: what would drop below 80%? Only if `buildInventorySnapshot` produces incorrect values for items with no prior count entries (`onHand = openingCount + 0 = openingCount`). This case is covered by the utility's logic and tested. No single unknown drops implementation below 80.
  - Approach: 80% — New sibling component, category grouping via `reduce` over items, delta calculation matches `handleRecordAction`, `addLedgerEntry` write path confirmed. Held-back test: what would drop below 80%? If Italian text requirements require an i18n framework beyond inline strings. Codebase uses inline strings (no i18n framework observed in reception app). 80 is defensible.
  - Impact: 75% — Addresses 3/7 world-class Key Indicators (count sequencing, progress visibility, immediate variance surfacing). Capped at 75 because Q1 (category population) is open; if categories are empty, deployed impact reduces to a flat "Senza categoria" list. Impact rises to 85% once TASK-01 confirms categories are assigned.
- **Acceptance:**
  - Component renders items grouped by `category` field; items without category appear under "Senza categoria".
  - Each item row shows: name, unit, expected on-hand (from `buildInventorySnapshot`), quantity input.
  - "Completa categoria" button submits all entered quantities for the category:
    - Computes delta = entered − expected for each item with a non-null entered quantity.
    - Calls `addLedgerEntry({ itemId, type: "count", quantity: delta, reason: "conteggio batch", unit })` for each included item.
    - Items with null/unchanged entry are skipped (not counted).
  - After category submission: per-item variance summary shown (name, expected, counted, delta, ± indicator).
  - Progress indicator shows "X / N categorie complete".
  - Session progress auto-saved to localStorage after each quantity change (via `useBatchCountProgress`).
  - Progress restored on mount if session date matches.
  - `onComplete` callback prop called when all categories are submitted.
  - `Permissions.STOCK_ACCESS` guard — renders null if not authorized.
  - Connectivity indicator when Firebase is offline.
- **Validation contract (TC-01 through TC-08):**
  - TC-01: Items with `category: "Bar"` and `category: "Cucina"` → rendered in separate sections.
  - TC-02: Items with null/undefined category → rendered under "Senza categoria".
  - TC-03: Enter quantity 10 for item with expected 8 → submit: `addLedgerEntry` called with `quantity: 2`, `type: "count"`, `reason: "conteggio batch"`.
  - TC-04: Enter quantity 5 for item with expected 8 → submit: `addLedgerEntry` called with `quantity: -3`.
  - TC-05: Skip entering quantity for item → `addLedgerEntry` not called for that item.
  - TC-06: Submit category → variance summary shows each submitted item with expected, counted, delta.
  - TC-07: Submit first of three categories → progress indicator shows "1 / 3 categorie complete".
  - TC-08: Component mounts with matching localStorage session → pre-fills entered quantities from saved session.
- **Execution plan:** Red → write test stubs for TC-01 through TC-08 as `test.todo()`. Green → implement component in phases: (1) category grouping + item list render, (2) quantity entry + delta calculation + `addLedgerEntry` write, (3) variance summary after submit, (4) progress indicator + localStorage save/restore via `useBatchCountProgress`. Refactor → extract `groupItemsByCategory(items)` as a pure function for isolated unit testing.
- **Planning validation (L — required):**
  - Checks run: read `useInventoryItems`, `useInventoryLedger`, `buildInventorySnapshot`, `addLedgerEntry` signatures; all confirmed reusable without modification.
  - Validation artifacts: fact-find Evidence Audit (Key Modules, Data & Contracts, Patterns sections).
  - Unexpected findings: `addCount` helper lacks `reason` arg — resolved in fact-find; `addLedgerEntry` used directly.
- **Consumer tracing:**
  - New output: `BatchStockCount` exported component → consumed by TASK-05 (`StockManagement` toggle). Addressed in plan.
  - New output: `onComplete` callback prop → consumed by TASK-05 (returns to ledger view). Addressed in plan.
  - `addLedgerEntry` call: existing function, signature unchanged, no new consumers created outside this component.
  - localStorage entries: produced and consumed by this component and `useBatchCountProgress` only. Cleared on `onComplete`. No external consumers.
  - All consumers addressed.
- **Scouts:** Read `useShiftProgress.ts` localStorage key format before creating `useBatchCountProgress` (TASK-02 handles). Verify `Object.groupBy` availability (fallback: `reduce`).
- **Edge Cases & Hardening:**
  - Item with expected = 0 (no prior ledger entries) → delta = entered; valid first-time count.
  - Empty category submit (all items skipped) → no ledger entries written; category marked complete.
  - All categories' items skipped → `onComplete` still callable; all-skip is a valid (no-count) session.
  - Connectivity indicator: show offline banner when Firebase SDK reports offline.
  - Large category (20+ items) → scrollable item list; no pagination for MVP.
- **What would make this >=90%:** TASK-01 confirms categories are populated (Impact rises to 85%); Q1 fully resolved.
- **Rollout / rollback:** New file only; no changes to existing components. Rollback = delete `BatchStockCount.tsx` and revert TASK-05 toggle in `StockManagement`.
- **Documentation impact:** None.
- **Notes / references:** Delta pattern from `StockManagement.tsx` `handleRecordAction` "count" case. `buildInventorySnapshot` usage in `StockManagement`. `PasswordReauthModal` integration deferred to TASK-04.

---

### TASK-04: Add reauth gate for large-variance items

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/inventory/BatchStockCount.tsx` (extended)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** Codex exec exit 0. BatchStockCount.tsx extended (+80 lines). Added `requiresReauth(deltas, threshold): boolean` exported helper. Added `pendingBatch` state and `executeCategorySubmit` extracted function. handleCompleteCategory now computes deltas, checks abs >= threshold, shows PasswordReauthModal on match; direct submit otherwise. Modal onSuccess runs executeCategorySubmit; onCancel clears pending state only (quantities preserved). Typecheck + lint passed. TC-01/TC-02/TC-03 contract satisfied.
- **Affects:** `apps/reception/src/components/inventory/BatchStockCount.tsx`, `[readonly] apps/reception/src/components/common/PasswordReauthModal.tsx`, `[readonly] apps/reception/src/constants/stock.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `PasswordReauthModal` is used identically in `StockManagement` (confirmed at lines 854–868). The `setPendingAction` / modal show pattern is a direct copy.
  - Approach: 90% — Identical to existing StockManagement reauth pattern; no novel design needed.
  - Impact: 85% — Required security constraint; prevents unauthorized large adjustments in batch mode.
- **Acceptance:**
  - When "Completa categoria" is triggered and any item in the batch has `abs(delta) >= STOCK_ADJUSTMENT_REAUTH_THRESHOLD (10)`: block submission, show `PasswordReauthModal`.
  - On reauth success: proceed with full category batch submission.
  - On reauth cancel: keep entered quantities intact; return to category input view.
  - Reauth fires once per category batch, not per individual item.
- **Validation contract (TC-01 through TC-03):**
  - TC-01: Category batch with item delta = 12 → `PasswordReauthModal` shown before any `addLedgerEntry` calls.
  - TC-02: Category batch with max abs(delta) = 5 → no modal; direct submission.
  - TC-03: Reauth cancelled → zero `addLedgerEntry` calls; entered quantities preserved in inputs.
- **Execution plan:** Red → write tests for TC-01 through TC-03. Green → add `pendingBatch` state to `BatchStockCount`; check `Math.max(...deltas.map(Math.abs)) >= threshold` before submit; trigger modal. Refactor → extract `requiresReauth(deltas, threshold): boolean` utility.
- **Planning validation:** None: S-effort; `PasswordReauthModal` usage confirmed at `StockManagement.tsx:854-868`.
- **Scouts:** Confirm `PasswordReauthModal` `onConfirm` / `onCancel` callback interface matches expected usage (read component signature before implementation).
- **Edge Cases & Hardening:** Multiple items with large delta in one batch → single reauth covers all (not per-item). Reauth cancel leaves all quantities intact for retry.
- **What would make this >=90%:** No significant unknowns; already near ceiling for S-effort.
- **Rollout / rollback:** Extends TASK-03 file; rollback = remove `pendingBatch` state and reauth logic.
- **Documentation impact:** None.
- **Notes / references:** `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` at `apps/reception/src/constants/stock.ts`. `PasswordReauthModal` at `apps/reception/src/components/common/PasswordReauthModal.tsx`.

---

### TASK-05: Add batch count toggle to `StockManagement`

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/inventory/StockManagement.tsx` (modified — toggle integration only)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** Codex exec exit 0. StockManagement.tsx modified (+18 lines). BatchStockCount imported. batchCountMode state added. "Inizia conteggio batch" button added to inventory section header. Conditional render: batchCountMode true → BatchStockCount; false → existing ledger table. onComplete callback wires back to setBatchCountMode(false). All existing StockManagement functionality unchanged. Typecheck + lint passed. TC-01/TC-02/TC-03 contract satisfied.
- **Affects:** `apps/reception/src/components/inventory/StockManagement.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `StockManagement` structure is fully understood (874 lines, all key sections traced). Adding `batchCountMode` state + conditional render + import is minimal, additive change.
  - Approach: 85% — `const [batchCountMode, setBatchCountMode] = useState(false)`. When true, render `<BatchStockCount onComplete={() => setBatchCountMode(false)} />` instead of ledger table.
  - Impact: 85% — Provides the only user-facing entry point into batch count mode.
- **Acceptance:**
  - "Inizia conteggio batch" button added to the `StockManagement` inventory section header (consistent with existing action button style).
  - Clicking the button sets `batchCountMode = true` and renders `BatchStockCount` component.
  - `BatchStockCount` calling `onComplete` sets `batchCountMode = false`; ledger table resumes display.
  - All existing `StockManagement` functionality unchanged in non-batch-count mode.
- **Validation contract (TC-01 through TC-03):**
  - TC-01: Click "Inizia conteggio batch" → `BatchStockCount` rendered; ledger table not visible.
  - TC-02: `BatchStockCount` calls `onComplete` → ledger table visible; `BatchStockCount` not rendered.
  - TC-03: Default render (batchCountMode false) → all existing ledger table elements present and unchanged.
- **Execution plan:** Red → add TC-01 through TC-03 as `test.todo()` stubs. Green → add import, `batchCountMode` state, toggle button, conditional render. Refactor → verify button placement matches existing action button styling.
- **Planning validation:** None: S-effort; StockManagement structure confirmed in fact-find.
- **Consumer tracing:**
  - Modified `StockManagement.tsx`: adds `batchCountMode` boolean state and conditional render. No existing function signatures changed. Existing `StockManagement.test.tsx` tests continue to pass (they test the ledger table, which is still the default render).
  - `BatchStockCount` is a new import — no breakage risk.
- **Scouts:** Verify button placement in `StockManagement` header area before adding toggle button (read file section around inventory section header).
- **Edge Cases & Hardening:** User mid-count navigates away → localStorage progress persists via `useBatchCountProgress`; on return they can resume. No data loss.
- **What would make this >=90%:** No significant unknowns.
- **Rollout / rollback:** Minimal change to existing file; rollback = remove toggle state, import, button, and conditional render.
- **Documentation impact:** None.
- **Notes / references:** `StockManagement.tsx` entry point confirmed in fact-find.

---

### TASK-06: Write `BatchStockCount` test suite

- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build evidence:** Codex exec exit 0. BatchStockCount.test.tsx created. 25 tests passing, 0 failures, 0 skips. Coverage: groupItemsByCategory pure function (3 cases), requiresReauth pure function (4 cases), BatchStockCount component (15 cases across loading/error/access/category/submit/variance/progress/restore/reauth), useBatchCountProgress hook (4 cases via jest.requireActual + renderHook). StockManagement regression: 9/9 pass. All TC-01 through TC-08 (TASK-03), TC-01 through TC-03 (TASK-04), TC-01 through TC-04 (TASK-02) covered.
- **Affects:** `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx` (new), `[readonly] apps/reception/src/components/inventory/BatchStockCount.tsx`
- **Depends on:** TASK-04, TASK-05
- **Blocks:** CHECKPOINT-01
- **Confidence:** 80%
  - Implementation: 85% — RTL test infrastructure is well-established (9 tests in `StockManagement.test.tsx` confirm the exact pattern). Mocking `addLedgerEntry`, `useInventoryItems`, `useInventoryLedger` follows existing hook mock patterns.
  - Approach: 85% — Category grouping (pure function unit test) + component tests (RTL) + hook unit tests for `useBatchCountProgress`. All patterns present in codebase.
  - Impact: 80% — Test suite is the primary quality gate; confirms the feature works correctly before merge. Held-back test: what would drop below 80%? Only if the component's internal state makes RTL testing difficult without the `onComplete` callback seam — but TASK-03 specifies this seam explicitly. 80 is defensible.
- **Acceptance:**
  - `BatchStockCount.test.tsx` covers all TC cases from TASK-03 (TC-01 through TC-08) and TASK-04 (TC-01 through TC-03).
  - Unit test for `groupItemsByCategory` pure function (items with categories, items without category → "Senza categoria" group).
  - Unit tests for `useBatchCountProgress` hook (TC-01 through TC-04 from TASK-02, if not already written separately).
  - All tests pass: `pnpm --filter @apps/reception test -- --testPathPattern=BatchStockCount`.
  - Existing `StockManagement.test.tsx` still passes (regression check).
- **Validation contract (TC-01 through TC-02):**
  - TC-01: All TASK-03 and TASK-04 TC cases pass in Jest.
  - TC-02: `useBatchCountProgress` hook unit tests pass with `localStorage` mock.
- **Execution plan:** Red → write full test file with all TCs. Green → run tests; fix any implementation issues exposed. Refactor → remove all `test.todo()` stubs; confirm no skipped tests.
- **Planning validation (M — required):**
  - Checks run: `StockManagement.test.tsx` pattern reviewed — uses RTL + jest mock for Firebase hooks; 9 tests confirmed.
  - Validation artifacts: fact-find test landscape section; test patterns confirmed at `StockManagement.test.tsx`.
  - Unexpected findings: none — test patterns are directly transferable.
- **Consumer tracing:**
  - New output: `BatchStockCount.test.tsx` — consumed by Jest CI runner only. No production consumers.
- **Scouts:** Verify `jest.config.cjs` testIdAttribute is `data-cy` (per MEMORY.md: `configure({ testIdAttribute: "data-cy" })`). Confirm mock pattern for `addLedgerEntry` from existing tests.
- **Edge Cases & Hardening:** Include edge case tests: empty category (all items skipped), reauth cancel path, stale localStorage restore returning null.
- **What would make this >=90%:** Run a green test pass during planning to confirm infrastructure; add to planning validation evidence.
- **Rollout / rollback:** Test file only; rollback = delete file.
- **Documentation impact:** None.
- **Notes / references:** Test command: `pnpm --filter @apps/reception test`. RTL pattern at `StockManagement.test.tsx`. testIdAttribute: `data-cy`.

---

### CHECKPOINT-01: Validate integrated batch count flow

- **Type:** CHECKPOINT
- **Status:** Complete (2026-02-28)
- **Outcome: Ready**
- **Depends on:** TASK-06
- **Trigger condition:** TASK-06 complete; all new and existing tests pass.
- **Reassessment scope:**
  - Do all `BatchStockCount.test.tsx` tests pass in the reception Jest suite?
  - Do existing `StockManagement.test.tsx` tests still pass?
  - Does the batch count toggle in `StockManagement` wire to `BatchStockCount` correctly in dev?
  - Is variance display correct for positive and negative deltas?
  - Does localStorage progress persist across page reload mid-session?
- **Expected outcomes:**
  - Ready → feature complete; proceed to merge/deploy.
  - Partially ready → fix failing tests or integration issue; re-run TASK-06 or targeted TASK-05 fix.
  - Blocked → surface issue to operator for input.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Category field audit | Yes | None | No |
| TASK-02: useBatchCountProgress hook | Yes — `useShiftProgress` pattern confirmed at `hooks/utilities/` | None | No |
| TASK-03: BatchStockCount component | Yes — TASK-02 hook available; `useInventoryItems`, `useInventoryLedger`, `buildInventorySnapshot`, `addLedgerEntry` all confirmed | [Moderate] Q1 open: category population unknown — graceful fallback to "Senza categoria" handles missing data | No |
| TASK-04: Reauth gate | Yes — TASK-03 component exists; `PasswordReauthModal` confirmed at known path; `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` confirmed | None | No |
| TASK-05: StockManagement toggle | Yes — `BatchStockCount` exported from TASK-03; `StockManagement` structure confirmed | None | No |
| TASK-06: Test suite | Yes — TASK-04 and TASK-05 complete; component shape final; RTL infrastructure confirmed | [Minor] `data-cy` testIdAttribute must be used in mocks (not `data-testid`) — documented in MEMORY.md; known pattern | No |
| CHECKPOINT-01: Integration validation | Yes — TASK-06 forms the validation gate | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `category` field empty in production | Medium | High — grouping benefit absent at launch | TASK-01 confirms and resolves before TASK-03 deployment; graceful fallback to "Senza categoria" |
| Reauth interrupts batch flow mid-category | Low | Medium — friction for large-variance counts | Reauth fires once per category batch (not per item); single auth clears all large items in batch |
| Large categories exceed 5-min target | Low | Medium | Operator splits large categories in TASK-01 data setup; noted in category assignment guidance |
| IngredientStock data not yet migrated | Medium | Low — `BatchStockCount` targets `inventory/items`, not `inventory/ingredients` | Out of scope; separate decision |
| localStorage unavailable in kiosk mode | Very Low | Medium | Confirmed available: reception uses it in `CloseShiftForm` via `useShiftProgress` |

## Observability

- Logging: None needed — ledger entries written to Firebase include `user`, `timestamp`, `shiftId` automatically via `addLedgerEntry`.
- Metrics: None for MVP — count attribution visible in existing `Export Variance CSV` in `StockManagement`.
- Alerts/Dashboards: None — existing `shrinkageAlerts` in `StockManagement` will fire on large variances from batch sessions (correct behaviour).

## Acceptance Criteria (overall)

- [ ] `BatchStockCount.tsx` renders items grouped by category with expected on-hand per item.
- [ ] Batch submission writes correct delta entries to `inventory/ledger` via `addLedgerEntry` with `type: "count"` and `reason: "conteggio batch"`.
- [ ] Variance summary shown per category after submission.
- [ ] Large-delta items (abs ≥ 10) trigger `PasswordReauthModal` before category batch commit.
- [ ] Session progress persists across page reload via localStorage.
- [ ] All `BatchStockCount.test.tsx` tests pass.
- [ ] Existing `StockManagement.test.tsx` tests continue to pass.
- [ ] Toggle in `StockManagement` launches batch count and returns to ledger view on completion.

## Decision Log

- 2026-02-28: Chose Option A (new sibling component) over Option B (inline in StockManagement). Rationale: `StockManagement` is already 874 lines; isolation improves testability and maintainability. Toggle integration is minimal.
- 2026-02-28: Write path = `addLedgerEntry` directly, not `addCount` helper. Rationale: `addCount` lacks `reason` arg; batch counts should carry a reason for auditability.
- 2026-02-28: Reauth fires once per category batch (not per item). Rationale: per-item reauth is too disruptive for a batch flow; the batch is the unit of submission.

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01 (INVESTIGATE, S=1): 75%
- TASK-02 (IMPLEMENT, S=1): 80%
- TASK-03 (IMPLEMENT, L=3): 75%
- TASK-04 (IMPLEMENT, S=1): 85%
- TASK-05 (IMPLEMENT, S=1): 85%
- TASK-06 (IMPLEMENT, M=2): 80%
- Weighted sum: (75×1 + 80×1 + 75×3 + 85×1 + 85×1 + 80×2) / (1+1+3+1+1+2) = 710 / 9 ≈ 79% → **Overall-confidence: 80%**
