---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: reception-stock-batch-count
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec
Related-Plan: docs/plans/reception-stock-batch-count/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Dispatch-ID: IDEA-DISPATCH-20260228-0064
Trigger-Source: worldclass-scan
Trigger-Why: World-class gap scan (BRIK/reception, 2026-02-28) identified stock counting as a major gap — the reception app has an inventory ledger but no guided batch count workflow matching the minimum world-class threshold.
Trigger-Intended-Outcome: type: operational | statement: Replace item-by-item stock counting with a guided batch count flow grouped by storage area, with progress indicator and immediate variance surfacing at count completion | source: auto
---

# Reception Stock Batch Count Fact-Find Brief

## Scope

### Summary

The reception app currently manages stock through `StockManagement.tsx`, a full-inventory ledger table where "count" is one of six action types selectable per row. Staff must process each item individually — scrolling through the full list, selecting "count", entering a counted quantity, providing a reason, and pressing Record — with no grouping by storage area, no progress tracking, and no variance displayed at completion. `IngredientStock.tsx` is an older direct-edit UI that writes `type: "count"` ledger entries via `useIngredients.updateIngredient` (audit trail present) but displays no count history in the UI itself; it still co-exists alongside `StockManagement`. The world-class minimum threshold for a boutique hostel of this scale is a storage-area/category-based count sheet with fast quantity entry, offline-safe save-as-you-go, and automatic expected-vs-counted variance surfacing at count completion. This fact-find establishes the evidence base for building that guided batch count flow.

### Goals

- Design and build a guided batch stock count workflow that groups items by storage area/category, shows progress, and surfaces variance immediately on count completion.
- Leverage the existing `category` field on `InventoryItem` as the grouping key (no schema change needed).
- Call `addLedgerEntry` directly with `type: "count"` and a `reason` field for all batch count writes — no new entry types or Firebase paths. (`addCount` helper lacks a `reason` arg and is not used.)
- Build offline-safe (Firebase offline sync works; progress can be held in localStorage like shift close).
- Surface expected-vs-counted variance per item after submitting each category batch.

### Non-goals

- Replacing or modifying the inventory ledger table view (`StockManagement.tsx`) — it stays for non-count actions (receive, adjust, waste, transfer).
- Expected-vs-unexplained variance decomposition (separate dispatch IDEA-DISPATCH-20260228-0065).
- Unified EOD wizard integration (separate dispatch IDEA-DISPATCH-20260228-0066).
- Changing Firebase schema or `InventoryLedgerEntry` types.
- Any changes to IngredientStock's own data model — migration to ledger remains a separate decision.

### Constraints & Assumptions

- Constraints:
  - Offline-resilient — count flow must work under poor/absent connectivity. Firebase RTDB offline persistence queues `push()` ledger writes optimistically (no explicit ack until sync); localStorage handles in-progress session state. The batch count flow should not block on connectivity but must communicate to staff that writes are pending sync when offline.
  - Touch-friendly — items must be countable in ≤5 minutes per category on shared tablet hardware.
  - Italian-speaking staff — UI text for the batch count flow should be in Italian (same gap exists in the rest of the app, but new components should not add further English-only text).
  - `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` applies — large-variance counts (≥10 units delta) still need reauth, same as existing `handleRecordAction` logic.
  - `Permissions.STOCK_ACCESS` guard required — same check as `StockManagement`.
- Assumptions:
  - The `category` field on `InventoryItem` is already populated for most items (unverified — flagged as open question Q1).
  - Category names correspond meaningfully to physical storage locations (unverified — Q1).
  - Items without a category can be grouped under "Uncategorised" as a fallback.
  - Progress persistence via localStorage (keyed on user + session date) is sufficient for offline resilience, following the `useAutoSaveShiftProgress` pattern in `CloseShiftForm`.

## Outcome Contract

- **Why:** World-class gap scan identified guided batch counting as a major gap preventing staff from completing accurate stock counts confidently without manager coaching.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A guided batch stock count flow is live in the reception app, grouped by storage area, with per-category progress indicator, and immediate variance display at count completion — replacing item-by-item counting for routine stock takes.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inventory/StockManagement.tsx` — primary inventory component; contains the Inventory Ledger table, Alerts section, Count Variance Report, and Exports. "Count" action handled inline via `handleRecordAction` → `finalizeLedgerEntry`.
- `apps/reception/src/components/inventory/IngredientStock.tsx` — legacy ingredient display table; `updateIngredient` in `useIngredients.ts` writes delta-based `type: "count"` ledger entries via `addLedgerEntry` (audit trail present in Firebase), but the UI shows no audit history — just the current on-hand quantity from the ledger snapshot. Migration prompt to ledger-only model is present.

### Key Modules / Files

- `apps/reception/src/components/inventory/StockManagement.tsx` — hosts all stock management views; action dispatch, variance summary, alerts, CSV export.
- `apps/reception/src/components/inventory/IngredientStock.tsx` — legacy ingredient display table; `useIngredients` hook primarily subscribes to `inventory/items` and `inventory/ledger` (via `useInventoryItems` + `useInventoryLedger`), and does a one-time `get()` on `inventory/ingredients` only for legacy migration. The display shows on-hand from ledger snapshot; no audit history is surfaced in the UI.
- `apps/reception/src/utils/inventoryLedger.ts` — `buildInventorySnapshot(itemsById, entries): Record<string, InventorySnapshot>` and `calculateOnHandQuantity(openingCount, entries): number`. These are the core expected-on-hand calculation utilities; both are reusable as-is for the batch count flow (display "expected: N" per item).
- `apps/reception/src/hooks/data/inventory/useInventoryItems.ts` — subscribes to `inventory/items`; returns `items` (sorted alphabetically by name), `itemsById`. **Key gap for batch count:** sort is alphabetical, not by category. New hook or derived grouping needed.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — subscribes to `inventory/ledger`; returns all entries sorted by timestamp. Accepts optional `itemId` filter param.
- `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` — `addLedgerEntry` (generic), `addCount(itemId, quantity, note?, unit?)` (dedicated count helper). Note: `addCount` has no `reason` argument. For batch count submissions where a reason/note should be captured, call `addLedgerEntry` directly with `type: "count"` to preserve the reason field — matching the existing `handleRecordAction` "count" path in `StockManagement`.
- `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntryType` includes "count"; `InventoryLedgerEntry` has `itemId`, `type`, `quantity`, `user` (auto-set), `timestamp` (auto-set), `unit?`, `reason?`, `note?`, `shiftId?`.
- `apps/reception/src/types/hooks/data/inventoryItemData.ts` — `InventoryItem` has `category?: string`. This is the grouping key. No schema change needed.
- `apps/reception/src/constants/stock.ts` — `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` (10), `STOCK_SHRINKAGE_ALERT_THRESHOLD` (10). Reauth applies when abs(delta) ≥ threshold.
- `apps/reception/src/components/common/PasswordReauthModal.tsx` — reauth modal used by CloseShiftForm and StockManagement; reusable for large-variance batch count items.

### Patterns & Conventions Observed

- Firebase offline sync — `useFirebaseSubscription` + Firebase SDK offline persistence; counts written via `push(ref(database, "inventory/ledger"))` are queued offline automatically.
- Local session save pattern — `useAutoSaveShiftProgress` / `useShiftProgress` in `CloseShiftForm` use `localStorage` keyed on shift context for offline progress. Batch count session progress (which categories complete, entered quantities) should follow the same pattern.
- Password reauth for large adjustments — `PasswordReauthModal` + `setPendingAction` pattern in `StockManagement`; reusable for batch submissions with large variance.
- Count as delta, not absolute — `handleRecordAction` for count: `quantity = rawInput - snapshot[itemId].onHand`. The batch flow must compute the same delta (`counted - expected`) before calling `addLedgerEntry` directly with `type: "count"` and a `reason` field.
- Component encapsulation — each major inventory operation is contained in `StockManagement.tsx`; the batch count flow should be a new sibling component (`BatchStockCount.tsx`) with a toggle/button in `StockManagement` to enter count mode, keeping ledger view and count mode separate.

### Data & Contracts

- Types/schemas/events:
  - `InventoryItem` — `{ id?, name, unit, openingCount, category?, reorderThreshold?, active? }`. The `category` field exists for grouping; its population in live data is unverified (Q1).
  - `InventoryLedgerEntry` — `{ id?, itemId, type, quantity, user, timestamp, unit?, reason?, note?, shiftId? }`. No new fields needed for batch count.
  - `InventorySnapshot` — `{ item, onHand, lastMovementAt, entryCount }`. Used to display expected count per item.
- Persistence:
  - `inventory/items`: `Record<string, InventoryItem>` — read-only from batch count perspective.
  - `inventory/ledger`: `Record<string, InventoryLedgerEntry>` — count entries appended here via `push()`.
  - `localStorage` (new): count session progress keyed by `batchCount-${userId}-${date}` — stores entered quantities, completed categories. Cleared on session commit or abandonment.
- API/contracts:
  - Write method: use `addLedgerEntry({ itemId, type: "count", quantity: delta, reason?, note?, unit })` directly (not `addCount`) to preserve the `reason` field for batch count annotations. `quantity` must be the signed delta (counted − expected), matching existing `handleRecordAction` "count" case logic.
  - `buildInventorySnapshot(itemsById, entries)` — provides expected on-hand per item; reused as-is.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryItems` — provides items list and `itemsById` for grouping.
  - `useInventoryLedger` — provides all entries for snapshot calculation.
  - `buildInventorySnapshot` — computes expected on-hand (read-only utility; no change).
  - `useAuth` — provides current user for permission check and reauth.
- Downstream dependents:
  - Count entries written to `inventory/ledger` are immediately visible in `StockManagement`'s Count Variance Report and the snapshot calculation — no coupling change needed.
  - `shrinkageAlerts` in `StockManagement` may fire after a batch count session if variance is large; this is correct behaviour.
  - No impact on `EndOfDayPacket`, `TillShiftHistory`, or any till components.
- Likely blast radius:
  - New file: `apps/reception/src/components/inventory/BatchStockCount.tsx`
  - Modified file: `apps/reception/src/components/inventory/StockManagement.tsx` — add entry point/toggle to launch batch count mode.
  - New test file: `apps/reception/src/components/inventory/__tests__/BatchStockCount.test.tsx`.
  - Existing tests: no changes expected to `StockManagement.test.tsx` (existing tests cover the ledger table; the new component is additive).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library + `@testing-library/user-event`.
- Commands: `pnpm --filter @apps/reception test` (or `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`).
- CI integration: standard reusable-app CI; tests run on PR.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `buildInventorySnapshot` / `calculateOnHandQuantity` | Unit | `utils/__tests__/inventoryLedger.test.ts` | 2 tests; covers opening + ledger entries, multi-item snapshot, lastMovementAt |
| `StockManagement` | Component | `components/inventory/__tests__/StockManagement.test.tsx` | 9 tests: on-hand display, item creation, receive entry, count delta, reauth gate, low-stock alert, shrinkage alert, ledger CSV export, variance CSV export |
| `IngredientStock` | Component | `components/inventory/__tests__/IngredientStock.test.tsx` | 4 tests: loading state, error state, update ingredient, token-based theme classes |
| `useInventoryLedger` / `useInventoryItems` | None | — | Hook tests absent; mocked at component test level |

#### Coverage Gaps

- Untested paths:
  - `BatchStockCount` component (new — needs full test suite).
  - Category grouping logic (new — must be unit-tested with items with/without category).
  - Progress persistence (localStorage) — needs test for save, restore, and clear on commit.
  - Batch commit flow — multiple items in one category submitted together; variance display per item.
  - Large-variance reauth in batch context (≥10 delta triggers `PasswordReauthModal`).
  - `useIngredients.updateIngredient` ledger write path — not directly tested via a write-path test (only tested via `IngredientStock.test.tsx` which mocks the hook).
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - Category grouping derivation (pure function: `items → Record<category, InventoryItem[]>`).
  - Variance calculation per item (delta = counted - expected; uses existing `buildInventorySnapshot` utility).
  - Count entry submission (mock `addLedgerEntry`, assert called with correct delta, `type: "count"`, and `reason` field per item).
- Hard to test:
  - localStorage progress persistence (needs `localStorage` mock; standard Jest pattern, not hard).
  - Offline behaviour — cannot test Firebase offline queue in Jest; acceptance test only.
- Test seams needed:
  - `BatchStockCount` must accept `onComplete` callback prop to allow testing completion flow.
  - Progress save should be extracted to a `useBatchCountProgress` hook for isolated unit testing.

#### Recommended Test Approach

- Unit tests for: category grouping function, per-item variance calculation (counted - expected delta), `useBatchCountProgress` hook (save/restore/clear).
- Component tests (RTL) for: category navigation, quantity entry per item, "complete category" action, post-submit variance display, reauth trigger on large delta.
- E2E tests for: not required for this feature; component tests sufficient.
- Contract tests for: none.

### Recent Git History (Targeted)

- `apps/reception/src/components/inventory/` and `apps/reception/src/utils/inventoryLedger.ts` — most recent commits: `58f6c21426 feat(mcp-server): TASK-03 — draft cancellation confirmation` (touches `IngredientStock.tsx`, likely UI-only), `4b777cacab feat(reception): Wave 2 screen polish — till, reports, analytics, inventory, stats`, and `dd981d25cc fix(reception): auto-fix remaining bare rounded violations`. No functional changes to stock management or ledger logic since at least late 2025; the ledger model is stable.

## Questions

### Resolved

- Q: Does the `InventoryLedgerEntry.type` support "count" entries?
  - A: Yes. `InventoryLedgerEntryType` explicitly includes `"count"`. `addCount` exists in `useInventoryLedgerMutations` as a convenience wrapper but lacks a `reason` arg — the batch count flow must call `addLedgerEntry` directly with `type: "count"` and an explicit `reason` field. `addCount` is intentionally not used for this feature.
  - Evidence: `apps/reception/src/types/hooks/data/inventoryLedgerData.ts:4`, `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts:104`
- Q: Is a schema change needed to Firebase for batch counts?
  - A: No. Count entries use the existing `inventory/ledger` path with `type: "count"`. No new Firebase nodes or entry type additions needed.
  - Evidence: `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts:104-119`
- Q: Can expected on-hand be displayed per item in the batch flow?
  - A: Yes. `buildInventorySnapshot(itemsById, entries)` computes `onHand` per item. This utility is already used in `StockManagement` and can be called with the same hook data in `BatchStockCount`.
  - Evidence: `apps/reception/src/utils/inventoryLedger.ts:19-53`
- Q: Does a grouping mechanism already exist in the data model?
  - A: Yes. `InventoryItem.category?: string` is present. However, it is alphabetical-only sorted in `useInventoryItems` — the batch count component must group by category and present categories in an operator-defined or alphabetical order. Population of this field in live data is not confirmed (Q1).
  - Evidence: `apps/reception/src/types/hooks/data/inventoryItemData.ts:7`
- Q: Is the reauth pattern reusable?
  - A: Yes. `PasswordReauthModal` is already used in both `CloseShiftForm` and `StockManagement`. The same `setPendingAction` + modal pattern applies to batch submissions where any item delta ≥ `STOCK_ADJUSTMENT_REAUTH_THRESHOLD`.
  - Evidence: `apps/reception/src/components/inventory/StockManagement.tsx:854-868`
- Q: Should count entries in the batch flow include a `shiftId`?
  - A: Yes, for auditability. `addLedgerEntry` already auto-attaches `getStoredShiftId()` when available (same as all other ledger entries). No special handling needed.
  - Evidence: `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts:34`

### Open (Operator Input Required)

- Q: Is the `category` field on `InventoryItem` currently populated for most items in production, and do category names correspond to physical storage locations?
  - Why operator input is required: The code confirms the field exists, but its actual usage in live Firebase data cannot be confirmed from the codebase alone.
  - Decision impacted: Whether the batch count flow can use `category` for storage-area grouping immediately, or whether the plan needs a data-setup task (operator runs a one-time category assignment pass before the count flow is useful).
  - Decision owner: BRIK operator (Peter).
  - Default assumption + risk: Assume categories are partially populated; plan includes a task to confirm and assign categories to all active items before deploying batch count. Low risk — the batch flow degrades gracefully (all uncategorised items appear under "Uncategorised").

- Q: Should `IngredientStock.tsx` be deprecated as part of this work?
  - Why operator input is required: `IngredientStock` is currently accessible as a separate page. It has a migration prompt to move data to the ledger. Its continued existence after a batch count flow is live is a product decision.
  - Decision impacted: Whether the plan includes a task to remove or hide `IngredientStock` once ledger migration is confirmed complete.
  - Decision owner: BRIK operator.
  - Default assumption + risk: Do not deprecate in this plan; leave it accessible and only add a more prominent migration CTA. No risk to ledger data.

## Confidence Inputs

- Implementation: 82%
  - Evidence: Entry points, Firebase paths, write mutations, snapshot utility, and reauth pattern are all confirmed and reusable. No schema changes needed. The component architecture is clear (new `BatchStockCount.tsx`, toggle in `StockManagement`).
  - To reach ≥80: Already there. Blocked only by Q1 (category population in live data).
  - To reach ≥90: Confirm Q1 (categories populated and correspond to storage layout).
- Approach: 85%
  - Evidence: The `category` grouping approach, delta-based count write, and localStorage progress save pattern are all directly supported by existing code. No novel patterns needed.
  - To reach ≥80: Already there.
  - To reach ≥90: Resolve Q1 and confirm that `IngredientStock` migration is complete or explicitly deferred.
- Impact: 78%
  - Evidence: This is a direct fix for the major-gap identified in the worldclass scan: 3 of 7 Key Indicators currently absent (count sequencing, progress visibility, immediate variance surfacing). The fix addresses all three.
  - To reach ≥80: Confirm with operator that the physical storage layout is reflected by existing category names (Q1).
  - To reach ≥90: Pilot with one staff count session and verify completion time ≤5 min per category.
- Delivery-Readiness: 82%
  - Evidence: All dependencies exist (hooks, mutations, utilities, reauth modal, Firebase data model). No blockers that prevent starting a plan. Q1 only affects one task's sequencing (category audit), not the overall deliverable.
  - To reach ≥80: Already there.
  - To reach ≥90: Resolve Q1 before category-grouping task begins.
- Testability: 85%
  - Evidence: Clear test seams (pure grouping function, `useBatchCountProgress` hook extraction, `onComplete` callback). Existing RTL test infrastructure is proven for this component type.
  - To reach ≥80: Already there.
  - To reach ≥90: Ensure `useBatchCountProgress` is extracted as a standalone hook (not inline state).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `category` field not populated in live data | Medium | High — batch count grouping is useless if all items are "Uncategorised" | Plan includes a pre-deploy task: operator assigns categories to all active items. Batch count gracefully degrades to a flat "Uncategorised" list if not done. |
| Reauth interrupts batch flow mid-category | Low | Medium — staff have to re-auth mid-count, disrupting flow | Surface reauth inline per item (matching current StockManagement pattern). Accept this friction; it is a security requirement. |
| Large number of items makes count sessions long | Low | Medium — if category has 30+ items, session exceeds 5-min target | Recommend operator splits large categories into subcategories when assigning `category` field. This is a data-setup concern, not a code concern. |
| IngredientStock data not yet migrated | Medium | Low for this feature — `BatchStockCount` targets `inventory/items` (ledger model), not `inventory/ingredients` (legacy model) | Confirm migration status; `IngredientStock` migration is a separate decision. |
| Progress localStorage conflicts between concurrent users | Very Low | Low — reception app is single-user-at-a-time at the desk | Key localStorage by `userId + date`; last writer wins. Acceptable for this context. |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `InventoryItem.category` as grouping key | Yes | None | No |
| `buildInventorySnapshot` expected-on-hand display | Yes | None | No |
| `addLedgerEntry` write path for batch submissions | Yes | None | No |
| Delta calculation (counted - expected = ledger entry quantity) | Yes | None | No |
| `PasswordReauthModal` for large-variance items in batch | Yes | None | No |
| localStorage progress save (offline resilience) | Partial | [Minor] No existing `useBatchCountProgress` hook — must be created; extraction is straightforward given `useAutoSaveShiftProgress` as reference | No |
| Category population in live Firebase data | Partial | [Moderate] Cannot confirm from codebase alone (Q1). If categories are unpopulated, the grouping benefit is absent at launch. Mitigation: pre-deploy data-setup task | No |
| `StockManagement` toggle integration | Yes | None | No |
| Test coverage for new `BatchStockCount` component | Partial | [Minor] No tests exist yet — plan must include a test task | No |

## Planning Constraints & Notes

- Must-follow patterns:
  - Firebase writes via `push(ref(database, "inventory/ledger"))` with Zod schema validation (see `useInventoryLedgerMutations`).
  - `Permissions.STOCK_ACCESS` guard at component level.
  - `getStoredShiftId()` included in all ledger entries for audit trail.
  - Count entry: `quantity` must be the **delta** (counted − expected), not the raw count. Matches current `handleRecordAction` "count" case.
  - Reauth gate: any delta ≥ `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` (10) triggers `PasswordReauthModal`.
  - Italian text for all new UI strings (instructional text, labels, progress indicators).
- Rollout/rollback expectations:
  - Additive feature — `BatchStockCount` is a new component toggled from `StockManagement`. No existing functionality removed. Rollback = remove toggle and new component.
- Observability expectations:
  - No additional analytics needed for MVP. `Export Ledger CSV` and `Export Variance CSV` in `StockManagement` already capture count entries for post-session review.

## Suggested Task Seeds (Non-binding)

- TASK-01: Confirm and assign `category` field values for all active `InventoryItem` records in Firebase (data-setup; operator action — can be a script or manual via reception UI).
- TASK-02: Extract `useBatchCountProgress` hook (localStorage session state: categoriesComplete, enteredQuantities, sessionDate, userId).
- TASK-03: Build `BatchStockCount` component — category list view with item count entries, expected-vs-counted display, progress indicator, and variance summary on category completion.
- TASK-04: Add reauth gate to `BatchStockCount` for items with delta ≥ `STOCK_ADJUSTMENT_REAUTH_THRESHOLD`.
- TASK-05: Add batch count toggle/entry point to `StockManagement` (button to enter batch count mode; return to ledger view on completion).
- TASK-06: Write tests for `BatchStockCount` (category grouping, quantity entry, count submission, variance display, reauth trigger, progress save/restore).
- TASK-07: (Optional / deferred) Add more prominent `IngredientStock` migration CTA or hide the legacy page once migration is confirmed complete.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: lp-design-spec (for batch count UX layout on touch hardware)
- Deliverable acceptance package:
  - `BatchStockCount.tsx` passes RTL tests covering all task seeds above.
  - Counts appear in `StockManagement` Count Variance Report immediately after a batch session.
  - Large-variance items trigger `PasswordReauthModal` before commit.
  - Progress survives a page reload mid-session (localStorage restore works).
- Post-delivery measurement plan:
  - Staff-reported count completion time (target ≤5 min per category).
  - Count entry attribution visible in `Export Variance CSV`.

## Evidence Gap Review

### Gaps Addressed

- Firebase data model confirmed — `inventory/items` and `inventory/ledger` paths verified; no schema change needed.
- Write path confirmed — `addLedgerEntry` with `type: "count"` and a `reason` field is the correct method; `addCount` helper lacks a `reason` arg and is not used in the batch count flow. Delta calculation matches existing `handleRecordAction` logic.
- Grouping key confirmed — `InventoryItem.category` field exists and is optional; graceful fallback to "Uncategorised" handles missing data.
- Test infrastructure confirmed — existing RTL pattern in `StockManagement.test.tsx` is directly transferable to `BatchStockCount.test.tsx`.
- Blast radius confirmed — additive new component; no changes to existing StockManagement behaviour.

### Confidence Adjustments

- Implementation raised from 70% (before evidence) to 82% — entry points, mutations, utilities, and patterns all confirmed reusable.
- Testability raised from 65% to 85% — existing test seam patterns (hook mocks, `PasswordReauthModal` mock) are directly applicable.

### Remaining Assumptions

- `category` field is populated in live data and reflects storage layout (Q1 — operator-only knowledge).
- `IngredientStock` migration is either complete or explicitly deferred; no data dependency on it for this plan.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None that prevent plan creation. Q1 (category population) should be resolved before TASK-01 executes, but does not block plan writing.
- Recommended next step: `/lp-do-plan reception-stock-batch-count --auto`
