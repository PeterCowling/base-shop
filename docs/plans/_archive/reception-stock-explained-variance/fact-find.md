---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: reception-stock-explained-variance
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-stock-explained-variance/plan.md
Dispatch-ID: IDEA-DISPATCH-20260228-0074
Trigger-Source: docs/business-os/strategy/BRIK/apps/reception/worldclass-scan-2026-02-28.md
Trigger-Why: Remove the gaps identified in the 2026-02-28 worldclass scan for BRIK/reception. The stock-accountability gap (explained vs unexplained variance) was the highest-signal deferred item from that scan.
Trigger-Intended-Outcome: type: operational | statement: A variance breakdown section is visible on the Stock Management screen, separating explained shrinkage (logged waste/transfer entries within a selectable period) from unexplained variance (count discrepancy not covered by logged entries), so the operator can instantly identify whether missing stock was documented or truly unexplained. | source: operator
artifact: fact-find
---

# Reception Stock Explained/Unexplained Variance Split — Fact-Find Brief

## Scope

### Summary

The reception inventory ledger already records distinct entry types: `waste`, `transfer`, `adjust`, `count`, `receive`, `sale`, `return`, `opening`. The Count Variance Report shows `count`-type entries only and the shrinkage alert aggregates `waste + adjust + count` into one total. Neither view separates **explained shrinkage** (staff-logged waste/comp/transfer entries) from **unexplained variance** (count discrepancy that exceeds any logged explanation). This change adds that split to the existing `StockManagement` screen.

### Goals

- Add a per-item explained/unexplained variance breakdown to the Stock Management screen.
- Explained = sum of negative `waste` + negative `transfer` entry quantities within a configurable look-back window.
- Unexplained = net-negative count discrepancy (i.e. `min(0, sum of count entry quantities for the item)` within the window, expressed as an absolute value) minus the explained total, floored at 0. Only negative net count discrepancy constitutes a loss; positive or zero net count entries mean no unexplained loss for that item.
- The split must be derivable entirely from existing `InventoryLedgerEntry` data — no schema migration required.
- The window defaults to the last 7 days. The window selector is a component-level `useState` (a UI control visible to the operator on the screen — a dropdown or segmented control — but not persisted to Firebase, localStorage, or URL params). This is a user-facing UI control, not a hidden constant.

### Non-goals

- No new Firebase data paths, no schema changes.
- No per-user breakdown of the variance (out of scope for this cycle).
- No change to how entries are recorded — data model is read-only for this feature.
- No `comp` entry type exists in the current schema; "comp" in the dispatch description maps to the existing `waste` type with a reason field — no new type needed.
- No CSV export changes in this cycle.
- No change to the existing shrinkage alert threshold logic.

### Constraints & Assumptions

- Constraints:
  - `InventoryLedgerEntry.type` is a closed enum: `opening | receive | adjust | waste | transfer | sale | count | return`. No `comp` type exists — dispatch language was informal. Waste entries with a `reason` field serve this role.
  - The `transfer` type covers both `transferIn` (positive quantity) and `transferOut` (negative quantity). Only negative transfers count as explained shrinkage.
  - The look-back window must be kept purely client-side (no Firebase query changes); the full ledger is already subscribed via `useInventoryLedger`.
  - Tests follow the pattern in `StockManagement.test.tsx`: mocked hooks, RTL render, no Firebase calls.
- Assumptions:
  - The default look-back window of 7 days is appropriate for a hostel bar operation. This is an inference from the current 24h shrinkage alert — 7 days gives weekly cycle coverage. The window is a **user-facing UI control** (a segmented control or dropdown on the screen) backed by a component-level `useState` — visible and adjustable by the operator without reloading, but not persisted to Firebase, localStorage, or URL params. The "not a user-facing setting initially" language in the scope is retracted; the UI control is in scope.
  - Unexplained variance = `max(0, |min(0, sum of count entry quantities)| - sum of explained quantities)` within the window. Only net-negative count discrepancy constitutes a loss; if count entries net to zero or positive, unexplained = 0. If explained entries cover or exceed the net-negative count discrepancy, unexplained = 0.
  - Items with zero count entries in the window are omitted from the variance breakdown (no data = no row).

## Outcome Contract

- **Why:** Remove the gaps identified in the worldclass scan — specifically, the stock-accountability gap where the operator cannot distinguish documented stock loss from unexplained missing stock.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A variance breakdown section is visible on the Stock Management screen, separating explained shrinkage (logged waste/transfer entries within the window) from unexplained variance (count discrepancy minus explained entries), so the operator can immediately tell whether missing stock was documented or genuinely unexplained.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/inventory/StockManagement.tsx` — primary render component; contains `shrinkageAlerts` and `countVarianceSummary` memos and renders the "Count Variance Report" section. All new logic will live here as additional memos and a new rendered section.

### Key Modules / Files

- `apps/reception/src/components/inventory/StockManagement.tsx` — the primary file that needs to change. Lines 149–171 contain `shrinkageAlerts` (the flawed aggregate memo); lines 134–147 contain `countVarianceSummary` (count-only, per item). New memos and a new section will be added here. Two additional files also need minor changes: `constants/stock.ts` (one new constant) and `StockManagement.test.tsx` (new test cases). Total: three files changed.
- `apps/reception/src/utils/inventoryLedger.ts` — `buildInventorySnapshot` and `calculateOnHandQuantity`. No changes needed; these utilities compute on-hand from all entry types and are not involved in the variance display.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — subscribes to `inventory/ledger` in Firebase and returns `entries: InventoryLedgerEntry[]` sorted by timestamp. This is the data source for all new memos. No changes needed.
- `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntryType` enum and `InventoryLedgerEntry` interface. No changes needed.
- `apps/reception/src/schemas/inventoryLedgerSchema.ts` — Zod schema; validates ledger entries. No changes needed.
- `apps/reception/src/constants/stock.ts` — exports `STOCK_SHRINKAGE_ALERT_THRESHOLD` and `STOCK_ADJUSTMENT_REAUTH_THRESHOLD`. A new constant `STOCK_VARIANCE_WINDOW_DAYS = 7` will be added here.
- `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx` — 9 passing tests (confirmed by test run). New tests for the explained/unexplained breakdown section will be appended here.

### Patterns & Conventions Observed

- All shrinkage/variance logic is **pure memo computation** from `entries` — no side effects, easy to extend. Evidence: lines 134–171 of `StockManagement.tsx`.
- Entry types are used directly as string literals in `useMemo` filters (`entry.type === "count"`, `shrinkageTypes = new Set(["waste", "adjust", "count"])`). New memos will follow the same pattern.
- The 24h cutoff in `shrinkageAlerts` uses `Date.now() - 24 * 60 * 60 * 1000`. A 7-day window will use the same pattern with a named constant.
- No prop drilling — `entries` and `itemsById` are consumed directly from hooks at the top of `StockManagement`. New memos get the same data.
- Design system primitives: `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@acme/design-system`. The existing Count Variance Report uses these — new section will follow exactly.
- Color convention: `text-error-main` for negative variance, `text-success-main` for zero/positive, `text-warning-main` for partial coverage.

### Data & Contracts

- Types/schemas/events:
  - `InventoryLedgerEntryType`: `opening | receive | adjust | waste | transfer | sale | count | return` — closed union, no `comp` type exists. (Source: `apps/reception/src/types/hooks/data/inventoryLedgerData.ts`, `apps/reception/src/schemas/inventoryLedgerSchema.ts`)
  - `InventoryLedgerEntry`: `{ id?, itemId, type, quantity: number, user, timestamp, unit?, reason?, reference?, shiftId?, note? }`. The `quantity` field is signed: negative = stock removed, positive = stock added.
  - Explained types (stock removal entries): `waste` (always negative by `finalizeLedgerEntry`), `transfer` (negative when `transferOut`). Both produce negative `quantity` values.
  - Count variance entries: type `count`, quantity = `countedActual - expectedOnHand` (can be negative or positive). Negative = stock missing relative to expected.
- Persistence:
  - Firebase Realtime Database: `inventory/ledger` — flat record of `InventoryLedgerEntry` keyed by push ID. Full subscription via `useInventoryLedger` with no server-side filtering. All computation is client-side.
- API/contracts:
  - No API changes. No mutation. Read-only computation over `entries[]` from existing hook.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryLedger()` → `entries: InventoryLedgerEntry[]` (already present in `StockManagement`)
  - `useInventoryItems()` → `itemsById` (already present — needed for item name display)
  - New constant `STOCK_VARIANCE_WINDOW_DAYS` from `apps/reception/src/constants/stock.ts`
- Downstream dependents:
  - `StockManagement.tsx` is rendered within the inventory route of the reception app. No other component depends on `StockManagement` or its internal memo results.
  - `BatchStockCount.tsx` imports `buildInventorySnapshot` and `STOCK_ADJUSTMENT_REAUTH_THRESHOLD` but does not touch `StockManagement`'s memos — no blast radius.
- Likely blast radius:
  - **Contained to three files: `StockManagement.tsx` (new memos + section + window state), `constants/stock.ts` (one new constant), and `StockManagement.test.tsx` (new test cases)**. No shared utility changes, no hook changes, no type changes, no Firebase writes. The existing `shrinkageAlerts` memo is preserved unchanged.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (RTL) + `@testing-library/user-event`.
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=StockManagement --no-coverage`
- CI integration: tests run in `reusable-app.yml`; currently all 9 `StockManagement` tests passing (verified 2026-02-28).

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| On-hand calculation from ledger | Unit (RTL) | `StockManagement.test.tsx` | Covered — `renders on-hand quantities from ledger` |
| Add inventory item | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Record receive entry | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Count variance as delta | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Reauth gate for large adjustments | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Low stock alert | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Shrinkage alert (24h window) | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| CSV export (ledger + variance) | Unit (RTL) | `StockManagement.test.tsx` | Covered |
| Explained/unexplained split | — | — | **Not covered — new tests required** |

#### Coverage Gaps

- Untested paths (new, to be added):
  - Explained variance memo: waste + negative transfer entries within 7-day window, per item.
  - Unexplained variance memo: count discrepancy minus explained, floored at 0, per item.
  - Section rendering: breakdown table shows explained/unexplained columns.
  - Edge cases: item with only explained entries (unexplained = 0); item with count variance fully covered by waste (unexplained = 0); item with count variance exceeding waste (unexplained > 0); item with no count entries in window (omitted from table).
- Extinct tests: none — no existing tests touch the new section.

#### Testability Assessment

- Easy to test:
  - All new logic is pure `useMemo` over `entries[]`. Test by mocking `useInventoryLedger` with fabricated entries of type `waste`, `transfer`, `count` and asserting rendered table content. Same pattern as existing `shows shrinkage alert` test.
- Hard to test:
  - The 7-day window cutoff uses `Date.now()`. The existing `shrinkageAlerts` test uses `new Date().toISOString()` for a "recent" entry — same approach applies. No `jest.useFakeTimers` needed for basic coverage.
- Test seams needed:
  - None beyond what already exists. Mocked `useInventoryLedger` provides full control over `entries`.

#### Recommended Test Approach

- Unit tests for: explained variance memo (waste + transfer accumulation), unexplained memo (count minus explained), section rendering with mixed entry types.
- Integration tests for: not needed — logic is self-contained in one component.
- E2E tests for: not needed for this cycle.

### Recent Git History (Targeted)

- `apps/reception/src/components/inventory/StockManagement.tsx` — most recent change: commit `24f7422b` (2026-02-28): added `batchCountMode` toggle and `BatchStockCount` wiring (TASK-05 of `reception-stock-batch-count` plan). This was the last substantive change; the inventory section structure is stable.
- `apps/reception/src/components/inventory/BatchStockCount.tsx` — same commit; added reauth gate for batch submission (TASK-04). No interaction with the new feature.
- `apps/reception/src/utils/inventoryLedger.ts` — last changed in an early commit (`4d9325702e`). Stable utility; no recent changes.

## Questions

### Resolved

- Q: Does a `comp` entry type exist in the schema?
  - A: No. The closed enum is `opening | receive | adjust | waste | transfer | sale | count | return`. The dispatch description's use of "comp" is informal. Complimentary/comped items are recorded as `waste` with an appropriate `reason`. No new entry type is needed.
  - Evidence: `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` + `apps/reception/src/schemas/inventoryLedgerSchema.ts`

- Q: What entry types constitute "explained shrinkage"?
  - A: `waste` (always negative by construction in `finalizeLedgerEntry`) and `transfer` with negative quantity (i.e., `transferOut`). `adjust` with negative quantity is a borderline case: it could be explained (documented) or ambiguous. Recommendation: **exclude `adjust` from explained**. An adjust entry can represent anything from a price-change correction to unattributed stock removal. Including it would conflate documented intent with clerical entries. The new section will present explained = `waste` (negative) + `transfer` (negative) only, with a clear label. This is a conservative definition that favors accuracy over coverage.
  - Evidence: `StockManagement.tsx` lines 296–327 (`finalizeLedgerEntry` action-to-type mapping); `inventoryLedgerData.ts` type union.

- Q: Should the look-back window for the variance split match the 24h shrinkage alert or use a different default?
  - A: 7 days. The shrinkage alert is an operational real-time alarm (24h). The explained/unexplained split is an accountability view intended for weekly review cycles. A hostel bar runs a weekly stock count cycle; 7 days captures one full review period. Default to 7 days; make the window a constant `STOCK_VARIANCE_WINDOW_DAYS` in `constants/stock.ts` so it can be adjusted without a component change.
  - Evidence: Inference from `STOCK_SHRINKAGE_ALERT_THRESHOLD` pattern in `constants/stock.ts`; operational context from worldclass scan.

- Q: Is this a new section or a modification to the existing Count Variance Report?
  - A: New section. The Count Variance Report remains unchanged — it shows raw `count` entries for auditability. The explained/unexplained split is additive, placed after the Count Variance Report section. This avoids disrupting the existing display and reduces test surface.
  - Evidence: `StockManagement.tsx` lines 806–862 (Count Variance Report section).

- Q: What does "unexplained = count discrepancy minus explained entries" mean when count variance is positive or when positive and negative count entries coexist in-window?
  - A: Only the **net-negative** count discrepancy constitutes a loss. Formula: `netCountDelta = sum(count entry quantities for item in window)`. If `netCountDelta >= 0`, there is no loss — unexplained = 0 and the item is excluded from the breakdown. If `netCountDelta < 0`, the absolute value `|netCountDelta|` is the total count discrepancy. Unexplained = `max(0, |netCountDelta| - explained)`. Using the net delta handles the case where positive and negative count entries coexist in-window — they cancel correctly before the formula is applied. Items with no count entries in the window are excluded entirely.
  - Evidence: Logical inference from domain context; consistent with how `countVarianceSummary` aggregates per item using `reduce` with `acc[entry.itemId] = (acc[entry.itemId] ?? 0) + entry.quantity` (line 143–147 of StockManagement.tsx).

### Open (Operator Input Required)

None. All questions answered from code evidence and domain reasoning.

## Confidence Inputs

- **Implementation: 92%**
  - Evidence: Full source read of `StockManagement.tsx` (all memos, all rendering). New logic is two new `useMemo` hooks following exact existing patterns. Entry point is confirmed. No schema changes, no hook changes, no Firebase changes.
  - What raises to >=80: Already at 92%.
  - What raises to >=90: Already at 92%. Would reach 95% with a confirmed test run of the new tests (post-implementation gate).

- **Approach: 88%**
  - Evidence: The "explained = waste + negative transfer" definition is conservative and defensible. The "unexplained = count discrepancy minus explained, floored at 0" formula is arithmetically simple and correct. The 7-day window follows the `Date.now()` pattern already in the file.
  - Minor uncertainty: operator preference on whether `adjust` entries should count as explained. Current recommendation excludes `adjust` for accuracy; operator may prefer to include it. Default assumption: exclude. Risk: low — easily changed in one line.
  - What raises to >=90: Operator confirmation that `adjust` exclusion is correct, or decision to include it.

- **Impact: 80%**
  - Evidence: Worldclass scan confirms the gap exists and the data is already available. The feature closes a named accountability gap. No revenue impact claimed — this is operational visibility.
  - What raises to >=80: Already at 80%.
  - What raises to >=90: Operator confirmation that the 7-day window matches their weekly count cycle.

- **Delivery-Readiness: 95%**
  - Evidence: Single-file change (plus test file and one constant addition). No external dependencies. No migrations. No deployment config changes. Tests confirmed passing in current state. Blast radius is contained.
  - What raises to >=90: Already at 95%.

- **Testability: 90%**
  - Evidence: All new logic is pure memo computation over mocked hook data. RTL render tests follow established patterns in the existing test file. No Firebase, no auth, no timers needed for primary coverage.
  - What raises to >=90: Already at 90%.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Operator prefers `adjust` entries counted as explained | Low | Low | Add `adjust` to explained set in one line change. Plan task should note this as a configurable decision. |
| 7-day window does not match operator's count cycle | Low | Low | Window is a named constant `STOCK_VARIANCE_WINDOW_DAYS` in `constants/stock.ts` — one-line change to adjust. |
| Performance: full ledger scan in multiple memos | Very Low | Very Low | Ledger subscription already loaded; existing `shrinkageAlerts` memo already scans all entries. New memos add identical iteration cost. Firebase ledger for a hostel bar is unlikely to exceed a few thousand entries. |
| Section clutter on already-busy screen | Low | Minor | New section is additive, positioned after Count Variance Report. Operator can ignore it if not relevant. No UX regression on existing sections. |
| Count entry with quantity = 0 (no variance) | Very Low | None | The net-delta formula (`netCountDelta = sum(count quantities)`) produces 0 for entries that cancel; `min(0, 0) = 0` so unexplained = 0 and no row is shown. No `entry.quantity < 0` filter is applied to individual count entries — the net is taken first. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `useMemo` for all derived state. Do not compute in render body.
  - Use `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@acme/design-system` for the new section (matches all existing inventory tables).
  - Constants go in `apps/reception/src/constants/stock.ts`.
  - Tests mock `useInventoryLedger` return value; do not test against Firebase.
- Rollout/rollback expectations:
  - No feature flag needed — purely additive UI section. Rollback = revert the three changed files (`StockManagement.tsx`, `constants/stock.ts`, `StockManagement.test.tsx`).
- Observability expectations:
  - None beyond the existing UI display. No logging, no analytics events for this cycle.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `STOCK_VARIANCE_WINDOW_DAYS = 7` constant to `constants/stock.ts`. Add `varianceWindowDays` state (`useState(STOCK_VARIANCE_WINDOW_DAYS)`) to `StockManagement`. Add `explainedShrinkage` memo (waste + negative transfer entries within the window, per item). Add `unexplainedVariance` memo (formula: `max(0, |min(0, netCountDelta)| - explained)`, per item). Add "Variance Breakdown" section to the JSX after the Count Variance Report section, with a window selector (dropdown: 7 / 14 / 30 days) and a table with columns: Item | Explained (waste/transfer) | Count Discrepancy | Unexplained.
- TASK-02: Add unit tests to `StockManagement.test.tsx` covering: explained-only scenario (no unexplained), unexplained-only scenario, mixed scenario (count discrepancy partially covered by waste), zero-unexplained when waste exceeds count discrepancy, items outside window excluded, positive net count delta excluded from breakdown.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - New "Variance Breakdown" section renders on Stock Management screen.
  - Explained column shows sum of waste + negative transfer entries for the item within 7 days.
  - Count Discrepancy column shows the net-negative count discrepancy: `|min(0, sum(count entry quantities for item in window))|`. Items with net-zero or net-positive count are excluded.
  - Unexplained column shows max(0, count_discrepancy - explained).
  - Items with no count entries in the window are not shown.
  - All new unit tests pass.
  - Existing 9 StockManagement tests continue to pass.
- Post-delivery measurement plan:
  - Operator reviews the section on next stock management session and confirms the split is accurate relative to their manual ledger tracking.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point — StockManagement.tsx memo patterns | Yes | None | No |
| Data source — useInventoryLedger hook and InventoryLedgerEntry type | Yes | None | No |
| Entry type taxonomy — `comp` type existence | Yes | [Scope gap] Minor: dispatch description mentions `comp` as a type; actual schema has no `comp` type. Resolved: `waste` with reason covers this. | No |
| Look-back window design (7-day constant) | Yes | None | No |
| `adjust` type classification (explained vs not) | Yes | None — resolved by excluding `adjust` from explained set with documented rationale | No |
| Blast radius — BatchStockCount, useInventoryLedger, inventoryLedger util | Yes | None — no upstream changes required | No |
| Test landscape — existing coverage and new test seams | Yes | None — established pattern fully reusable | No |
| Constants file — stock.ts | Yes | None | No |
| System boundaries — Firebase, auth, external APIs | Yes | None — purely client-side; no Firebase writes; no auth changes | No |

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: All claims traced to specific line ranges in source files. Entry type enum confirmed by reading both type file and Zod schema. Memo patterns confirmed by reading the actual `shrinkageAlerts` and `countVarianceSummary` implementations.
- Boundary coverage: Firebase path confirmed (`inventory/ledger`). Auth boundary confirmed (no changes to auth gate). No external API integration. Error paths: the new memos are pure computations — no error paths beyond the existing hook loading/error states which are unchanged.
- Testing: Existing 9 tests confirmed passing by live test run. New test seams identified with concrete examples.
- Business validation: Worldclass scan provides explicit evidence of the gap and confirms the data is already available.

### Confidence Adjustments

- Implementation score set to 92% (not 100%) to reflect the `adjust` classification decision that depends on operator preference. This is the only remaining ambiguity.
- Approach score set to 88% for the same reason.
- No adjustments required for other dimensions.

### Remaining Assumptions

- `adjust` entries are excluded from the explained set. If the operator wants them included, this is a one-line change.
- 7-day window is the correct default. Adjustable via constant.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-stock-explained-variance --auto`
