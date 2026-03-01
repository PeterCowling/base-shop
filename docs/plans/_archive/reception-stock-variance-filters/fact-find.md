---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Feature-Slug: reception-stock-variance-filters
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-stock-variance-filters/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260301-0082
Trigger-Why: TBD
Trigger-Intended-Outcome: TBD
---

# Reception Stock Variance Filters Fact-Find Brief

## Scope

### Summary

`ManagerAuditContent` displays a stock variance table showing count-type ledger entries from the last 7 days. The window is hardcoded; there is no date-range filter, item filter, staff filter, or CSV export. Managers investigating stock discrepancies have no way to narrow down results or export them for offline review.

The scope adds: date-range filter, item filter, and basic CSV export to the stock variance audit table. A staff filter is also viable — the `user` field already exists on every ledger entry (set at write time in `useInventoryLedgerMutations`) — so the partial dependency on IDEA-DISPATCH-20260301-0081 is moot for this scope.

### Goals

- Add From/To date-range inputs that replace the hardcoded 7-day window.
- Add an item name/ID filter (text or dropdown) to narrow rows.
- Add a staff filter using the existing `user` field on `InventoryLedgerEntry`.
- Add a CSV export button that exports the current filtered view.

### Non-goals

- Restructuring the entire `ManagerAuditContent` component into sub-components (cosmetic only if needed).
- Changing the Firebase data model or ledger schema (not needed; `user` already exists).
- Adding pagination (row counts will not require it at BRIK scale).
- Dependency on IDEA-DISPATCH-20260301-0081 — the `user` field already carries staff identity.

### Constraints & Assumptions

- Constraints:
  - All filtering is client-side (data is subscribed via `useInventoryLedger` which returns the full ledger; no Firebase query parameter change is needed).
  - CSV export must be browser-triggered (no server endpoint).
  - No new external dependencies — existing date/CSV patterns from `TillShiftHistory` and `StockManagement` can be reused.
- Assumptions:
  - The `user` field on ledger entries is reliably populated (confirmed: `useInventoryLedgerMutations` always sets `user: user.user_name` before pushing to Firebase).
  - `useInventoryLedger` subscribes to the full `inventory/ledger` path and returns all entries; client-side filtering is sufficient at BRIK scale.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Managers can filter the stock variance audit table by date range, item, and staff, and can export the filtered results as CSV for offline audit.
- **Source:** auto

## Access Declarations

None. All data is sourced from Firebase Realtime Database via the existing `useInventoryLedger` subscription hook, which is already initialized and authenticated.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — the single component rendering the stock variance section; all filter and export changes land here.

### Key Modules / Files

- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — primary change target. Contains `stockVarianceRows` memo with hardcoded 7-day window (`SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000`) applied inline on line 87. No filter state, no export.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — returns full ledger via `useFirebaseSubscription("inventory/ledger", inventoryLedgerSchema)`. Accepts optional `itemId` param that pre-filters in the hook, but unused here. All entries are delivered as an array sorted by timestamp string ascending.
- `apps/reception/src/types/hooks/data/inventoryLedgerData.ts` — `InventoryLedgerEntry` has fields: `id?`, `itemId`, `type`, `quantity`, `user` (string, required), `timestamp` (string, required), `unit?`, `reason?`, `reference?`, `shiftId?`, `note?`.
- `apps/reception/src/schemas/inventoryLedgerSchema.ts` — Zod schema; `user: z.string()` is required (not optional). All entries written have user set.
- `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` — `addLedgerEntry` always sets `user: user.user_name` at write time. No entry can be written without a user.
- `apps/reception/src/hooks/data/inventory/useInventoryItems.ts` — returns `itemsById` map (already consumed by `ManagerAuditContent`). This is the source for item name lookup and for the item filter dropdown options.
- `apps/reception/src/components/till/TillShiftHistory.tsx` — **reference pattern** for date-range filter: uses `useState("")` for `startDate`/`endDate`, native `<input type="date">`, and `startOfDayIso`/`endOfDayIso` from `dateUtils`. Staff filter uses `useState("")` with text `<input>` and `.toLowerCase().includes()`.
- `apps/reception/src/components/inventory/StockManagement.tsx` — **reference pattern** for CSV export: inline `escapeCsvCell` + `buildCsv` + `triggerCsvDownload` functions (lines 577–601). Export columns for variance: `["Recorded at", "Item", "Item ID", "Variance", "User", "Reason", "Note"]` (lines 641–657). Button uses `@acme/design-system/atoms` `Button` component.
- `apps/reception/src/utils/dateUtils.ts` — exports `startOfDayIso(date: Date): string` (line 534) and `endOfDayIso(date: Date): string` (line 542), both ISO strings. Also `formatDate` for YYYY-MM-DD.
- `apps/reception/src/utils/toastUtils.ts` — `showToast(message, type)` available for post-export feedback.

### Patterns & Conventions Observed

- **Date filter pattern** — evidence: `apps/reception/src/components/till/TillShiftHistory.tsx` lines 79–175. Native `<input type="date">` with `useState("")` defaults. When empty, defaults to last 30 days via `startOfDayIso`. For variance table, empty start = 30 days ago (or configurable) and empty end = today is the correct default.
- **Staff filter pattern** — evidence: `apps/reception/src/components/till/TillShiftHistory.tsx` lines 78, 99–109. `useState("")`, text input, case-insensitive substring match on `closedBy`/`openedBy`. Same approach applies to `entry.user`.
- **CSV escape + download** — evidence: `apps/reception/src/components/inventory/StockManagement.tsx` lines 577–601. Three inline functions: `escapeCsvCell`, `buildCsv`, `triggerCsvDownload`. These can be duplicated into `ManagerAuditContent` (or a shared util if desired, but inline is the existing convention).
- **Item filter via select** — evidence: `apps/reception/src/components/inventory/StockManagement.tsx` line 155. Native `<select>` with `data-cy` attribute for test selection. `itemsById` map available for populating options from `useInventoryItems`.
- **Filter UI layout** — evidence: `apps/reception/src/components/till/TillShiftHistory.tsx` lines 141–178. `flex flex-wrap gap-4 items-end mb-4` container wrapping `flex flex-col` label+input pairs.
- **Label + input styling** — evidence: `TillShiftHistory.tsx` lines 143–177. `text-xs font-semibold text-muted-foreground mb-1` labels, `border border-border-strong rounded-md px-2 py-1 text-sm` inputs.
- **SEVEN_DAYS_MS hardcode** — `ManagerAuditContent.tsx` line 14. This is a module-level constant not imported from `constants/stock.ts` (which has `STOCK_VARIANCE_WINDOW_DAYS = 7`). This inconsistency can be cleaned up — replace with `STOCK_VARIANCE_WINDOW_DAYS` from the constant file and use it as the default lookback.

### Data & Contracts

- Types/schemas/events:
  - `InventoryLedgerEntry` (`apps/reception/src/types/hooks/data/inventoryLedgerData.ts`): `user` (string, required), `timestamp` (string, ISO), `itemId` (string), `quantity` (number), `type` (enum).
  - `InventoryItem` (`apps/reception/src/types/hooks/data/inventoryItemData.ts`): `id?`, `name` (string), `category?` (string). Available via `itemsById` map.
- Persistence:
  - Firebase Realtime Database, path `inventory/ledger`. All entries are subscribed client-side in full. No server-side query filtering is available via `useInventoryLedger`; all filtering is performed on the returned `entries` array.
- API/contracts:
  - No API endpoints involved. Pure client-side Firebase subscription.

### Dependency & Impact Map

- Upstream dependencies:
  - `useInventoryLedger` — provides `entries: InventoryLedgerEntry[]`. No change to this hook required.
  - `useInventoryItems` — provides `itemsById`, `items`. Already imported. Items array provides dropdown options for item filter.
- Downstream dependents:
  - `ManagerAuditContent` is rendered by the manager audit page/route. No other component imports or depends on it.
- Likely blast radius:
  - **Isolated to `ManagerAuditContent.tsx`**. No shared hook changes, no type changes, no schema changes, no Firebase path changes. The `user` field already exists on every entry.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (jest.setup.ts configures `testIdAttribute: "data-cy"`)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs` (do not run locally; push and use CI)
- CI integration: test matrix runs on push.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `ManagerAuditContent` rendering | Unit (RTL) | `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` | 7 tests covering: section render, access gate, shift requests, checkin count, loading indicators, stock variance delta formatting, zero-checkins display |
| Stock variance rows | Unit (RTL) | Same file — test "renders stock variance delta rows with positive sign formatting" | Confirms item name lookup and delta sign prefix |
| Auth/access gate | Unit (RTL) | Same file | Confirms null render when `canAccess` returns false |

#### Coverage Gaps

- Untested paths:
  - Date-range filter state — no test for From/To inputs affecting displayed rows.
  - Item filter state — no test for item dropdown narrowing results.
  - Staff filter state — no test for user text input narrowing results.
  - CSV export — no test for button trigger or download function call. This is expected (browser download APIs are not unit-testable in jest without mocking; can test button render and mock the download function).
  - Empty filter state (all rows shown) vs. filtered (subset shown).
- Extinct tests:
  - None identified. The 7-day hardcoded window test behavior will change; existing test fixtures use `Date.now() - 1000` which remains within any reasonable default window.

#### Testability Assessment

- Easy to test:
  - Filter state changes (controlled inputs, `useState` update via `fireEvent.change`).
  - Row count assertions after filter application.
  - Export button rendered when rows exist.
- Hard to test:
  - Actual browser file download (requires mocking `URL.createObjectURL`, `document.createElement`, etc. — acceptable to mock).
- Test seams needed:
  - Mock `URL.createObjectURL` and `document.createElement("a")` for CSV download assertions. Pattern already exists in the codebase (see `StockManagement` tests if any; otherwise a standard jest DOM mock).

#### Recommended Test Approach

- Unit tests for: date-range filter rendering, item filter rendering, staff filter rendering, row filtering correctness for each filter dimension, export button presence, CSV download function call (mocked).
- Integration tests for: not required — component is fully self-contained with mocked hooks.
- E2E tests for: out of scope for this task.

### Recent Git History (Targeted)

- `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — **2 commits**:
  - `da88603fc7` (`feat(hbag-pdp-shipping-returns)` — commit batch): created the component (254 lines added). Initial build introduced `SEVEN_DAYS_MS` hardcode, no filter state, no export.
  - `f08457eddb` (`fix(prime)` — commit batch): 42 lines changed — translated all UI strings from Italian to English (labels: "Articolo" → "Item", "Data" → "Date", "Variazione Stock" → "Stock Variance", "Caricamento..." → "Loading...", etc.). No functional changes to filtering logic. Implication: the component is stable; only cosmetic changes have been made since creation. No structural regressions to be aware of.
- `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — no commits outside initial creation in the tracked log. No changes to the data contract since introduction.

## Questions

### Resolved

- Q: Does the staff filter depend on IDEA-DISPATCH-20260301-0081 (`submittedBy` field)?
  - A: No. The `user` field is already a required field on `InventoryLedgerEntry` (`user: z.string()` in `inventoryLedgerSchema.ts`). It is set to `user.user_name` by `useInventoryLedgerMutations.addLedgerEntry` on every write. A staff filter using `entry.user` can be implemented without any schema or Firebase changes.
  - Evidence: `apps/reception/src/schemas/inventoryLedgerSchema.ts` line 16, `apps/reception/src/hooks/mutations/useInventoryLedgerMutations.ts` line 32, `apps/reception/src/components/inventory/StockManagement.tsx` line 624 (already rendering `entry.user` in CSV exports).

- Q: Should client-side filtering be used or should Firebase queries be used for the date filter?
  - A: Client-side. `useInventoryLedger` subscribes to the full `inventory/ledger` path via `useFirebaseSubscription`. Changing to Firebase-query-based filtering would require refactoring the hook to accept date bounds, changing the Firebase path or query parameters, and handling re-subscription on filter change. At BRIK scale (small inventory, modest entry count), client-side filtering on the full subscription is consistent with existing patterns (e.g., `TillShiftHistory` applies filters client-side after receiving data from `useTillShiftsRange`). No hook change is needed.
  - Evidence: `apps/reception/src/hooks/data/inventory/useInventoryLedger.ts` — no query params for date range.

- Q: What default date range should apply when filters are empty?
  - A: Default to the last 30 days (consistent with `TillShiftHistory` pattern). This is more useful than the current hardcoded 7 days and avoids showing an empty table by default.
  - Evidence: `apps/reception/src/components/till/TillShiftHistory.tsx` lines 84–89 — empty `startDate` defaults to `Date.now() - 30 * 24 * 60 * 60 * 1000`.

- Q: Should the item filter be a text input or a dropdown?
  - A: A `<select>` dropdown populated from `itemsById` / `items` is preferable — it shows only items that exist, prevents typos, and is consistent with the variance window select in `StockManagement`. A "All items" default option covers the unfiltered state.
  - Evidence: `apps/reception/src/components/inventory/StockManagement.tsx` line 155 — `<select>` with `data-cy` attribute used for variance window; `apps/reception/src/hooks/data/inventory/useInventoryItems.ts` — returns sorted `items` array suitable for populating a dropdown.

- Q: Should CSV export respect the current filter state?
  - A: Yes. The export should operate on `stockVarianceRows` (post-filter), not on raw `entries`. This is the expected behaviour from the operator perspective — "export what I'm seeing." The filename should include the date range.
  - Evidence: Operator intent from dispatch; consistent with `StockManagement.handleExportVariance` which exports `countEntries` (the filtered set at that point).

### Open (Operator Input Required)

None. All questions resolved from available evidence and business constraints.

## Confidence Inputs

- **Implementation: 95%**
  - Evidence: entry point confirmed, all data types confirmed, `user` field confirmed as populated, date filter and CSV export patterns directly reusable from `TillShiftHistory` and `StockManagement`. No new hooks, no schema changes, no Firebase path changes.
  - Raises to 95%: already at 95%; the 5% gap is standard risk for UI state interaction edge cases. Raises to 99% only with implemented tests confirming filter combinations.

- **Approach: 92%**
  - Evidence: client-side filtering consistent with existing patterns. No architectural change required. CSV export via Blob/URL pattern already in production.
  - Raises to ≥80%: confirmed by reading `TillShiftHistory` date filter — already done.
  - Raises to ≥90%: confirmed; `user` field already exists so staff filter requires no dependency.

- **Impact: 85%**
  - Evidence: operator-stated gap (worldclass-scan, manager-audit-visibility). Filtering and export are the primary missing capabilities. The table is rendered by default in the manager audit view; usage will occur whenever the screen is accessed.
  - Raises to ≥80%: already at 85%.
  - Raises to ≥90%: operator-confirmed workflow frequency (not documented).

- **Delivery-Readiness: 93%**
  - Evidence: all evidence slices complete, patterns confirmed, no external dependencies, no Firebase schema changes, no cross-team coordination required. Tests are straightforward to write.
  - What raises to ≥80%: already met.
  - What raises to ≥90%: already met.

- **Testability: 88%**
  - Evidence: component is fully mockable (7 tests already in place — confirmed by direct count). New tests follow established patterns. The only constraint is browser download API mocking (standard jest workaround).
  - What raises to ≥80%: already met.
  - What raises to ≥90%: confirmed mock pattern for download.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Large ledger dataset causes UI lag on date/item filter | Low | Low | At BRIK scale, `inventory/ledger` will have hundreds of entries at most. `useMemo` on filter state is sufficient. |
| `user` field empty on older ledger entries | Low | Low | Schema requires `user: z.string()` but older manual Firebase writes may not have set it. Staff filter should handle empty/missing user gracefully — show as "Unknown" and ensure `""` does not accidentally match all entries. |
| `ManagerAuditContent` already tests rely on specific row rendering | Low | Low | Existing tests mock `useInventoryLedger` with timestamps near `Date.now()`. Default 30-day window includes these. No test breakage expected. |
| Timestamp format inconsistency across entries | Very Low | Low | `toTimestampMs` helper in the component already handles both number and string timestamps. Date filter comparison via `toTimestampMs` is safe. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Native `<input type="date">` inputs (no date picker library) — consistent with `TillShiftHistory`.
  - Native `<select>` for item dropdown — consistent with `StockManagement` variance window select.
  - `data-cy` attributes on new interactive elements (jest testIdAttribute is `data-cy`).
  - Import `Button` from `@acme/design-system/atoms` for the export button (consistent with `StockManagement` and `BatchStockCount`).
  - Import `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` from `@acme/design-system` (already in `ManagerAuditContent`).
  - Use `startOfDayIso`/`endOfDayIso` from `../../utils/dateUtils` for date boundary construction.
  - Use `showToast` from `../../utils/toastUtils` for post-export feedback.
  - Inline CSV helpers (`escapeCsvCell`, `buildCsv`, `triggerCsvDownload`) — consistent with `StockManagement` convention. No new util file needed unless plan decides to extract.
  - Replace module-level `SEVEN_DAYS_MS` constant with import from `../../constants/stock` (`STOCK_VARIANCE_WINDOW_DAYS`), which equals 7. This cleans up the inconsistency.
- Rollout/rollback expectations:
  - Change is additive UI state. No Firebase schema changes. Safe to roll back by reverting the component file.
- Observability expectations:
  - None required. Export button usage is not tracked. If desired, a `showToast` on successful export is sufficient (already in `StockManagement` pattern).

## Suggested Task Seeds (Non-binding)

- TASK-01: Add date-range filter state and apply to `stockVarianceRows` memo. Replace `SEVEN_DAYS_MS` hardcode with `STOCK_VARIANCE_WINDOW_DAYS` constant import. Add `From`/`To` date inputs to the Stock Variance section UI.
- TASK-02: Add item filter (dropdown populated from `items` sorted list from `useInventoryItems`) and staff filter (text input matching `entry.user`) to filter state and `stockVarianceRows` memo.
- TASK-03: Add CSV export button and inline export helpers (`escapeCsvCell`, `buildCsv`, `triggerCsvDownload`). Export columns: Recorded at, Item, Item ID, Delta, User, Reason, Note. Filename: `stock-variance-<effectiveStart>-<effectiveEnd>.csv` where effectiveStart is the active `startDate` filter value or the computed 30-day-ago fallback in YYYY-MM-DD format, and effectiveEnd is the active `endDate` filter value or today's date. This ensures the filename is always concrete and never contains empty placeholders.
- TASK-04: Add/update unit tests for filter state (date range, item, staff), filtered row rendering, and export button presence. Mock `URL.createObjectURL` and anchor element click for download assertion.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `ManagerAuditContent.tsx` updated with date-range, item, and staff filter inputs wired to `stockVarianceRows` memo.
  - CSV export button renders when filtered rows > 0.
  - Export produces correct columns for filtered entries.
  - Existing 7 tests continue to pass.
  - New tests cover filter interactions and export button.
- Post-delivery measurement plan:
  - No quantitative metric tracking required. Operator-verified by manual use of the Manager Audit screen.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `ManagerAuditContent.tsx` entry point | Yes | None | No |
| `useInventoryLedger` data contract (entries shape, user field) | Yes | None | No |
| `useInventoryItems` items/itemsById for dropdown | Yes | None | No |
| Date filter pattern from `TillShiftHistory` | Yes | None | No |
| Staff filter dependency on dispatch 0081 | Yes | [Minor] `user` field already exists; dispatch 0081 dependency is false. Fully resolvable now. | No |
| CSV export pattern from `StockManagement` | Yes | None | No |
| `startOfDayIso`/`endOfDayIso` availability | Yes | None | No |
| `showToast` availability | Yes | None | No |
| `Button` import availability | Yes | None | No |
| Test landscape (existing 7 tests, gap coverage) | Yes | [Minor] No test for download API mocking seam documented yet; standard jest mock approach required | No |
| `SEVEN_DAYS_MS` vs `STOCK_VARIANCE_WINDOW_DAYS` inconsistency | Yes | [Minor] Module-level constant not using shared constant from `constants/stock.ts`. Plan should clean up. | No |

## Evidence Gap Review

### Gaps Addressed

1. **`user` field presence confirmed** — direct read of `inventoryLedgerSchema.ts` and `useInventoryLedgerMutations.ts` confirms `user` is required and always set at write time. Dispatch 0081 dependency is unnecessary for the staff filter.
2. **CSV export pattern confirmed** — `StockManagement.tsx` lines 577–668 provide a working inline implementation that can be replicated exactly.
3. **Date filter pattern confirmed** — `TillShiftHistory.tsx` lines 79–178 provide the exact date filter UI and ISO conversion pattern.
4. **Item dropdown source confirmed** — `useInventoryItems` already returns sorted `items` array; dropdown can be populated directly.
5. **All imports confirmed** — `Button` from `@acme/design-system/atoms`, `showToast` from utils, `startOfDayIso`/`endOfDayIso` from dateUtils — all already used in nearby components.

### Confidence Adjustments

- Implementation confidence raised from initial estimate to **95%** because the `user` field pre-exists (no Firebase schema change) and all UI patterns are directly replicable.
- Delivery-Readiness at **93%** because no external dependencies exist.

### Remaining Assumptions

- `useInventoryLedger` delivers the full ledger without pagination — assumed true at BRIK scale and consistent with hook implementation (subscribes full `inventory/ledger` path).
- Older (pre-schema) ledger entries may have `user = ""` — plan must handle gracefully in staff filter (no match on empty string unless user input is also empty, i.e. "show all").

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-stock-variance-filters --auto`
