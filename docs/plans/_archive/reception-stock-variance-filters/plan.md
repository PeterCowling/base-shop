---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-stock-variance-filters
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Stock Variance Filters Plan

## Summary

`ManagerAuditContent` currently shows a hardcoded 7-day stock variance table with no ability to filter or export. This plan adds four capabilities in two IMPLEMENT tasks: (1) date-range and staff filters replacing the hardcoded window, and (2) an item filter dropdown plus CSV export button covering the current filtered view. A third task writes tests for all new behaviour. Changes touch two files: the component (`ManagerAuditContent.tsx`) and its test file. No schema or Firebase changes are required, and all UI patterns are directly reusable from existing components.

## Active tasks

- [x] TASK-01: Add date-range and staff filters to stock variance table
- [x] TASK-02: Add item filter dropdown and CSV export
- [x] TASK-03: Tests for all new filter and export behaviour

## Goals

- Replace hardcoded 7-day window with From/To date inputs defaulting to last 30 days.
- Add staff filter (text input, `entry.user` match) and item filter (`<select>` dropdown from `items` array).
- Add CSV export button exporting the current filtered view with a concrete filename.
- Keep all 7 existing tests passing.

## Non-goals

- Firebase schema or data model changes (not needed; `user` field already exists).
- Pagination.
- Dependency on IDEA-DISPATCH-20260301-0081 (`submittedBy` attribution) — moot; `user` already carries staff identity.
- Extracting CSV helpers to a shared util file (inline convention matches existing codebase).

## Constraints & Assumptions

- Constraints:
  - All filtering is client-side; `useInventoryLedger` subscribes full `inventory/ledger` path.
  - CSV export is browser-triggered via Blob/URL pattern — no server endpoint.
  - No new external package dependencies.
  - `data-cy` attributes required on all new interactive elements (jest testIdAttribute is `data-cy`).
- Assumptions:
  - `user` field is reliably populated on all new entries (confirmed via `useInventoryLedgerMutations` which always sets `user: user.user_name`).
  - Older pre-schema entries may have `user = ""` — staff filter must not match empty string against non-empty input.
  - At BRIK scale, full-ledger client-side subscription is performant without pagination.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Managers can filter the stock variance audit table by date range, item, and staff, and can export the filtered results as CSV for offline audit.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-stock-variance-filters/fact-find.md`
- Key findings used:
  - `user` field already exists on `InventoryLedgerEntry` and is set at write time — staff filter requires no schema change.
  - Date-range filter pattern: `TillShiftHistory.tsx` lines 79–175 (`useState("")`, native `<input type="date">`, `startOfDayIso`/`endOfDayIso` from dateUtils, default to 30-day lookback).
  - CSV export pattern: `StockManagement.tsx` lines 577–601 (`escapeCsvCell`, `buildCsv`, `triggerCsvDownload` inline functions + `Button` from `@acme/design-system/atoms` + `showToast` feedback).
  - Item filter pattern: `StockManagement.tsx` line 155 native `<select>` with `data-cy`; `useInventoryItems` returns sorted `items` array.
  - Blast radius: component (`ManagerAuditContent.tsx`) and its test file — no changes to hooks, schemas, or Firebase paths.

## Proposed Approach

- Option A: All three filter types and export in a single IMPLEMENT task.
- Option B: Split into two IMPLEMENT tasks — (1) date/staff filters (pure memo filter change, no new UI types), (2) item filter + CSV export — followed by a test task.
- Chosen approach: Option B. The date/staff filters operate on a `toTimestampMs` numeric comparison and text match that is straightforward and testable in isolation. The item filter requires populating a `<select>` from `items` (a new pattern in this component) and the CSV helpers are a coherent addition. Splitting keeps each task reviewable and rollbackable independently without coordination risk.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Date-range and staff filters + replace SEVEN_DAYS_MS | 90% | M | Complete (2026-03-01) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Item filter dropdown and CSV export | 90% | M | Complete (2026-03-01) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Tests for all filter and export behaviour | 85% | M | Complete (2026-03-01) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Pure filter state + memo logic; no UI dependency blocker |
| 2 | TASK-02 | TASK-01 complete | Item dropdown uses sorted `items`; CSV export relies on `stockVarianceRows` memo established in TASK-01 |
| 3 | TASK-03 | TASK-01, TASK-02 complete | Tests cover all three filter dimensions and export; depends on final component shape |

## Tasks

---

### TASK-01: Date-range and staff filters + remove SEVEN_DAYS_MS hardcode

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — adds `startDate`, `endDate`, `staffFilter` state; deletes `SEVEN_DAYS_MS` module-level constant (no replacement import); updates `stockVarianceRows` memo with 30-day inline default and filter logic; adds filter UI inputs; updates empty-state text.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — exact file path confirmed, current implementation fully read, `startOfDayIso`/`endOfDayIso` import signatures confirmed. `SEVEN_DAYS_MS` is deleted (no replacement import needed). Pattern directly replicable from `TillShiftHistory.tsx` lines 79–178.
  - Approach: 90% — client-side memo filtering with `toTimestampMs` (already in component) is the correct approach; `startOfDayIso`/`endOfDayIso` produce ISO boundary strings; staff filter uses case-insensitive `.includes()` on `entry.user`. No ambiguity.
  - Impact: 90% — date range is the primary audit capability gap; staff filter adds accountability tracing using pre-existing `user` field. Both are immediately visible to any manager on load.

**Build evidence (2026-03-01):**
- Commit: `c092ec9231` — `feat(reception): add date-range and staff filters to stock variance table (TASK-01)`
- Files changed: `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` (2 files, 115 insertions, 50 deletions including `packages/ui/src/organisms/RoomsSection.tsx` AppLanguage cast fix)
- Typecheck: passed (`pnpm --filter @apps/reception typecheck` — clean exit)
- Lint: 7 warnings, 0 errors — none from `ManagerAuditContent.tsx` (pre-existing warnings in other files)
- All acceptance criteria confirmed:
  - `SEVEN_DAYS_MS` deleted; 30-day inline default replaces it
  - `startDate`, `endDate`, `staffFilter` state added
  - `stockVarianceRows` memo updated: date range + staff filter logic + updated deps
  - Filter UI: From (data-cy="variance-start-date"), To (data-cy="variance-end-date"), Staff (data-cy="variance-staff-filter")
  - Empty-state: "No variance in the selected period"
  - "Counted by" column added to table (renders `entry.user || "—"`)

**Consumer tracing — new outputs:**

- `startDate: string` state → consumed by `stockVarianceRows` memo (new: date lower bound filter).
- `endDate: string` state → consumed by `stockVarianceRows` memo (new: date upper bound filter).
- `staffFilter: string` state → consumed by `stockVarianceRows` memo (new: staff substring match on `entry.user`).
- `SEVEN_DAYS_MS` module-level constant → deleted. Replaced by inline `Date.now() - 30 * 24 * 60 * 60 * 1000` for the default empty-filter lookback. The default window deliberately changes from 7 days to 30 days to match `TillShiftHistory` convention and provide more useful audit history. `STOCK_VARIANCE_WINDOW_DAYS` is NOT imported — it is no longer used in this component.

No external consumers of `stockVarianceRows` exist — it is a local `useMemo` result used only within `ManagerAuditContent`.

**Modified behavior check:**

- `stockVarianceRows` memo: currently filters `entries` to `type === "count"` AND `timestamp >= todayMinus7`. New version adds: timestamp >= effective start (default: 30-day lookback), timestamp <= effective end (default: today), AND staff filter substring match. The `type === "count"` filter is preserved. `toTimestampMs` helper already handles both string and number timestamps — no change needed.
- `SEVEN_DAYS_MS` module-level constant: deleted. No import replacement. Default 30-day lookback computed inline.
- Empty state text "No variance in the last 7 days" must be updated to "No variance in the selected period" (or similar dynamic phrasing) since the window is no longer fixed.

- **Acceptance:**
  - `From`/`To` date inputs render in the Stock Variance section header area.
  - `Staff` text input renders adjacent to date inputs.
  - Empty `From` defaults to 30 days ago (computed via `startOfDayIso(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))`).
  - Empty `To` defaults to today (computed via `endOfDayIso(new Date())`).
  - Entries outside the effective date range are excluded from `stockVarianceRows`.
  - Staff filter with non-empty value excludes entries where `entry.user` does not contain the input string (case-insensitive).
  - Empty staff filter shows all entries (passes all users including `""`).
  - `SEVEN_DAYS_MS` module-level constant is removed. No replacement import needed — the 30-day default is computed inline.
  - Empty-state text updated from "No variance in the last 7 days" to "No variance in the selected period".
  - All 7 existing tests continue to pass.

- **Validation contract (TC-XX):**
  - TC-01: `startDate=""`, `endDate=""` → `stockVarianceRows` includes entries from last 30 days, excludes entries older than 30 days.
  - TC-02: `startDate="2026-02-01"`, `endDate="2026-02-28"` → only entries with timestamps in February 2026 appear.
  - TC-03: `staffFilter="pete"` → only entries where `entry.user` contains "pete" (case-insensitive) appear.
  - TC-04: `staffFilter=""` → all entries within date range appear (including those with `user = ""`).
  - TC-05: Entry with `user = ""` and `staffFilter = "pete"` → entry excluded (empty string does not match "pete").
  - TC-06: `startDate` later than `endDate` → `stockVarianceRows` is empty (no entries match impossible range).
  - TC-07: All 7 existing tests (`ManagerAuditContent.test.tsx`) pass without modification — existing mock timestamps (`Date.now() - 1000`) fall within the default 30-day window.

- **Execution plan:** Red → Green → Refactor
  - Red: write failing tests for TC-01 through TC-06 (in TASK-03, but validate the acceptance criteria mentally here).
  - Green: Add `useState("", "")` for `startDate`/`endDate`/`staffFilter`; compute `effectiveStartMs` and `effectiveEndMs` from date inputs or defaults (30-day inline default, no `STOCK_VARIANCE_WINDOW_DAYS` import); update `stockVarianceRows` memo to apply all three filters; add filter UI above the table; delete `SEVEN_DAYS_MS` constant; update empty-state text to "No variance in the selected period".
  - Refactor: ensure `useMemo` dependencies array includes all filter state; verify label `htmlFor` matches input `id`; ensure `data-cy` attrs are present on all inputs.

- **Planning validation (required for M/L):**
  - Checks run: read `ManagerAuditContent.tsx` in full (255 lines); read `TillShiftHistory.tsx` filter pattern lines 79–178; read `dateUtils.ts` `startOfDayIso`/`endOfDayIso` signatures (lines 534–545); read `constants/stock.ts` for reference only (not imported); read `useInventoryLedger.ts` to confirm no hook change needed.
  - Validation artifacts: `toTimestampMs` function already handles string/number timestamps — safe to use for ISO string comparison.
  - Unexpected findings: `startOfDayIso` uses Italy timezone (`getItalyIsoString`) for the date prefix, not UTC. This means date boundary comparisons are Italy-local, which is appropriate for BRIK (hostel in Italy). No issue.

- **Scouts:** `startOfDayIso` uses Italy local time (`getItalyIsoString(date).slice(0, 10)`) — confirmed appropriate for BRIK. Entry timestamps are also written via `getItalyIsoString()` in `useInventoryLedgerMutations` — consistent timezone. No scout action needed.

- **Edge Cases & Hardening:**
  - `staffFilter = ""` must not inadvertently exclude entries with `user = ""`. Filter: `!staffFilter || entry.user.toLowerCase().includes(staffFilter.toLowerCase())`.
  - `startDate` after `endDate` produces zero results — acceptable UX (no guard needed, mirrors TillShiftHistory pattern).
  - Entries with `timestamp = 0` (invalid): `toTimestampMs` returns `0`, which is before any reasonable start date, so they are excluded by the date filter — correct behavior.

- **What would make this >=90%:** Already at 90%. Raises to 95% when tests confirm TC-01–TC-07 pass.

- **Rollout / rollback:**
  - Rollout: single component file change. No deploy flag needed.
  - Rollback: revert `ManagerAuditContent.tsx` to prior commit. No downstream impact.

- **Documentation impact:** None: no user docs, API docs, or changelog entries required for an internal manager tool filter addition.

- **Notes / references:**
  - `TillShiftHistory.tsx` lines 84–89: reference implementation for empty-input ISO boundary calculation.
  - `constants/stock.ts`: `STOCK_VARIANCE_WINDOW_DAYS = 7` — use this for the default lookback base (but override to 30 days for the manager audit default to match TillShiftHistory).
  - Note: the 30-day default window is computed inline (`Date.now() - 30 * 24 * 60 * 60 * 1000`), not from `STOCK_VARIANCE_WINDOW_DAYS`. The `STOCK_VARIANCE_WINDOW_DAYS` constant (value: 7) is no longer needed in this component after removing `SEVEN_DAYS_MS` — do not import it. The module-level `SEVEN_DAYS_MS` constant is simply deleted; the default window shifts to 30 days via the inline computation matching `TillShiftHistory`.

---

### TASK-02: Item filter dropdown and CSV export

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` — adds `itemFilter` state, item `<select>` dropdown, three inline CSV helpers (`escapeCsvCell`, `buildCsv`, `triggerCsvDownload`), `handleExportVariance` function, and export `Button`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — CSV helpers are a direct copy-adapt from `StockManagement.tsx` lines 577–601; `Button` import from `@acme/design-system/atoms` confirmed; `showToast` from `../../utils/toastUtils` confirmed; `items` sorted array already returned by `useInventoryItems` (already imported).
  - Approach: 90% — native `<select>` with `data-cy` for item filter; inline CSV pattern is the established codebase convention; export operates on post-filter `stockVarianceRows` (established in TASK-01).
  - Impact: 85% — item filter narrows large audit tables; CSV export is the key manager offline-audit capability. Impact is high but depends on adoption.

**Consumer tracing — new outputs:**

- `itemFilter: string` state (item ID or `""` for all) → consumed by `stockVarianceRows` memo addition (filter chain extension from TASK-01).
- `handleExportVariance()` → triggered by Button `onClick`; reads `stockVarianceRows` (post-all-filters) + `itemsById` for item name lookup. No external consumers.
- New `Button` import from `@acme/design-system/atoms` → no consumer tracing needed (UI only).
- `escapeCsvCell`, `buildCsv`, `triggerCsvDownload` — module-scoped functions; no external consumers.

**Modified behavior check:**

- `stockVarianceRows` memo (from TASK-01): extended to also filter by `itemFilter` — `!itemFilter || entry.itemId === itemFilter`. This is additive; existing TASK-01 filters are unchanged.
- `items` from `useInventoryItems`: already destructured in the component. TASK-02 adds it to the JSX for the dropdown `<option>` list. No hook contract change.

- **Acceptance:**
  - `Item` `<select>` renders with an "All items" default option plus one option per sorted inventory item.
  - Selecting a specific item filters `stockVarianceRows` to only entries matching that `itemId`.
  - Selecting "All items" (`value=""`) shows all entries (date/staff filters still apply).
  - Export button renders when `stockVarianceRows.length > 0`.
  - Export button is absent (or disabled) when `stockVarianceRows.length === 0`.
  - Clicking export triggers a browser file download named `stock-variance-<effectiveStart>-<effectiveEnd>.csv` where `effectiveStart` and `effectiveEnd` are the active filter values or computed 30-day-ago / today defaults in YYYY-MM-DD format.
  - CSV columns: `Recorded at`, `Item`, `Item ID`, `Delta`, `User`, `Reason`, `Note`.
  - CSV rows reflect only the current `stockVarianceRows` (post all filters).
  - `showToast` fires with success message after export (e.g., `Exported N variance record(s)`).

- **Validation contract (TC-XX):**
  - TC-08: `itemFilter = "item-1"` → only entries with `itemId === "item-1"` appear in table and export.
  - TC-09: `itemFilter = ""` → all entries matching date/staff filters appear (item filter inactive).
  - TC-10: Export with `startDate="2026-02-01"`, `endDate="2026-02-28"` → CSV filename = `stock-variance-2026-02-01-2026-02-28.csv`.
  - TC-11: Export with empty dates → filename uses computed 30-day-ago YYYY-MM-DD and today's YYYY-MM-DD strings.
  - TC-12: CSV row for entry with `reason = undefined` → `Reason` column is empty string, not `"undefined"`.
  - TC-13: Export button not rendered when `stockVarianceRows.length === 0` (all filters produce empty result).
  - TC-14: `escapeCsvCell` escapes values beginning with `=`, `+`, `-`, `@` by prepending `'`; values containing `"` are double-quoted with inner `""`.

- **Execution plan:** Red → Green → Refactor
  - Green: Add `itemFilter` state; extend `stockVarianceRows` memo with item filter condition; add `items` to JSX dropdown; add CSV helpers (copied from `StockManagement`); add `handleExportVariance` function using `stockVarianceRows`; add `Button` with `onClick={handleExportVariance}` conditional on `stockVarianceRows.length > 0`; add `Button` import.
  - Refactor: ensure `data-cy="variance-item-filter"` on `<select>` and `data-cy="variance-export-btn"` on Button; ensure `items` used from `useInventoryItems` destructure (already present as `itemsById` — need to also destructure `items`).

- **Planning validation (required for M/L):**
  - Checks run: read `StockManagement.tsx` lines 560–668 for CSV helpers; read `useInventoryItems.ts` to confirm `items` (sorted array) is in return value alongside `itemsById`; confirmed `Button` import path `@acme/design-system/atoms` in `StockManagement.tsx` line 4.
  - Validation artifacts: `useInventoryItems` returns `{ items: sortedItems, itemsById, loading, error }` — `items` is the sorted array needed for the dropdown. The component currently only destructures `itemsById`; TASK-02 adds `items` to the destructure.
  - Unexpected findings: `useInventoryItems` hook returns `items` as a sorted array (by `name`), which is exactly what the dropdown needs — no transformation required.

- **Scouts:** Verify `items` destructure is available without changing the hook call. Confirmed: `useInventoryItems()` already returns `items`; only `itemsById` is currently destructured in `ManagerAuditContent`. Adding `items` to the destructure is a non-breaking read-only addition.

- **Edge Cases & Hardening:**
  - Dropdown populated before data loads: show only "All items" during loading; `items` will be `[]`. The dropdown populates on data arrival.
  - Items with no entries in the current date range: they still appear in the dropdown (populated from full `items` list). Selecting such an item produces an empty table — acceptable (shows "No variance in the last N days" or equivalent).
  - Filename with empty filters: compute effective dates as `formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))` and `formatDate(new Date())` using `formatDate` from `../../utils/dateUtils` (returns YYYY-MM-DD). Import `formatDate` in the component for this purpose.

- **What would make this >=90%:** Already at 90%. Raises to 95% when TC-08–TC-14 pass in tests.

- **Rollout / rollback:**
  - Rollout: single component file change. No deploy flag.
  - Rollback: revert `ManagerAuditContent.tsx`. `Button` import adds no new bundle concern.

- **Documentation impact:** None: internal manager tool.

- **Notes / references:**
  - `StockManagement.tsx` lines 577–668: direct reference for CSV helpers and export handler pattern.
  - `useInventoryItems.ts` line 35: `items: sortedItems` in return object — already sorted alphabetically by name.
  - `formatDate` is exported from `../../utils/dateUtils` (line 37) — use for effective date string in filename.

**Build evidence (2026-03-01):**
- Commit: `5a817c50cb` — `feat(reception): add item filter and CSV export to stock variance table (TASK-02)`
- Files changed: `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` (1 file, 93 insertions, 1 deletion)
- Typecheck: passed clean
- Lint: 7 warnings, 0 errors — none from `ManagerAuditContent.tsx`
- All acceptance criteria confirmed:
  - `itemFilter` state added, `items` destructured from `useInventoryItems`
  - `stockVarianceRows` memo extended with `!itemFilter || entry.itemId === itemFilter`
  - Item `<select>` dropdown (data-cy="variance-item-filter") with All items default
  - `escapeCsvCell`, `buildCsv`, `triggerCsvDownload` module-scoped helpers
  - `handleExportVariance` builds headers, rows, filename (effective date range), calls showToast
  - Export button (data-cy="variance-export-btn") renders only when `stockVarianceRows.length > 0`

---

### TASK-03: Tests for all filter and export behaviour

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` — adds test cases covering date-range filter, item filter, staff filter, filter combinations, export button presence, and CSV download trigger.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — 7 existing tests are read; mocking pattern for hooks is established (`jest.mock` with `useInventoryLedgerMock.mockReturnValue`); `fireEvent.change` for controlled inputs is standard RTL; `data-cy` attribute selector via `getByRole`/`getByLabelText`/`getByTestId` confirmed.
  - Approach: 85% — browser download mocking (`URL.createObjectURL`, `document.createElement`) requires `jest.spyOn` setup in `beforeEach`. Pattern is not yet present in this test file — it's standard but adds a small unknown.
  - Impact: 85% — tests enforce all TC cases and prevent regression on existing behaviour.

**Download mock seam** (required before >=90% can be set):

The test file will add to `beforeEach`:
```typescript
Object.defineProperty(global, 'URL', {
  value: { createObjectURL: jest.fn(() => 'blob:mock'), revokeObjectURL: jest.fn() },
  writable: true,
});
```
And spy on `document.createElement` to intercept the anchor tag click. Alternatively, mock `triggerCsvDownload` at the module level. Since the CSV helpers are inline (not exported), the test for export can assert: export button click triggers `showToast` (which IS mockable) with the success message. This is a sufficient proxy without needing to mock DOM APIs.

- **Acceptance:**
  - All 7 existing tests continue to pass without modification.
  - TC-01: date-range filtering removes entries outside the default 30-day window when a past timestamp is provided.
  - TC-03: staffFilter input change to "pete" filters entries to only those with `entry.user` containing "pete".
  - TC-04: empty staffFilter shows all entries.
  - TC-08: item filter select change to a specific itemId hides entries for other items.
  - TC-09: item filter "All items" shows all items.
  - TC-13: export button absent when `stockVarianceRows.length === 0`.
  - TC-14 proxy: export button click triggers `showToast` with success message (mocked via `jest.mock("../../utils/toastUtils")`).

- **Validation contract (TC-XX):**
  - TC-15: render with 2 entries for different items; select item A → 1 row visible; select "All items" → 2 rows visible.
  - TC-16: render with entry `user = "alice"` and `staffFilter = "bob"` → 0 rows visible.
  - TC-17: render with entry `user = ""` and `staffFilter = ""` → entry visible (empty filter matches all).
  - TC-18: render with 0 matching entries → export button not in document.
  - TC-19: render with 1+ matching entries → export button in document with `data-cy="variance-export-btn"`.
  - TC-20: click export button → `showToast` called with success type.

- **Execution plan:** Red → Green → Refactor
  - Red: each new test added before implementation would fail.
  - Green: tests pass once TASK-01 and TASK-02 are implemented.
  - Refactor: group new tests under a `describe("filters")` and `describe("export")` block for clarity; ensure `data-cy` selectors match implementation.

- **Planning validation (required for M/L):**
  - Checks run: read existing test file in full (181 lines); confirmed mock pattern for `useInventoryLedger`, `useInventoryItems`, `useAuth`, `useTillShiftsData`, `useCheckins`; confirmed `configure({ testIdAttribute: "data-cy" })` from `jest.setup.ts`.
  - Validation artifacts: `fireEvent.change(input, { target: { value: "..." } })` works for controlled inputs; `screen.queryByTestId` uses `data-cy` attribute.
  - Unexpected findings: `showToast` mock not currently present in the test file — will need `jest.mock("../../utils/toastUtils", () => ({ showToast: jest.fn() }))` added.

- **Scouts:** None.

- **Edge Cases & Hardening:**
  - `useInventoryItems` mock must return both `items: [...]` and `itemsById: {...}` (TASK-02 adds `items` to destructure). Update `useInventoryItemsMock.mockReturnValue` calls to include `items: []` (already safe — the mock currently returns `{ items: [], itemsById: {} }` which is correct).

- **What would make this >=90%:** Downward bias applied for the download mock seam unknown. Raises to 90% if `showToast` proxy approach is confirmed sufficient (it is — see seam note above). Score could be raised to 90 post-implementation when all TCs are verified green.

- **Rollout / rollback:**
  - Rollout: test file only; no production impact.
  - Rollback: revert test file.

- **Documentation impact:** None.

- **Notes / references:**
  - `jest.setup.ts` configures `testIdAttribute: "data-cy"` — use `data-cy` attrs in all new test queries.
  - `showToast` mock pattern: `jest.mock("../../utils/toastUtils", () => ({ showToast: jest.fn() }))`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `user = ""` on older ledger entries matches empty staff filter unintentionally | Low | Low | Filter condition: `!staffFilter \|\| entry.user.toLowerCase().includes(staffFilter.toLowerCase())` — empty staffFilter passes all entries including those with `user = ""`. Correct. |
| `startDate` after `endDate` produces confusing empty table | Low | Low | No guard needed; mirrors TillShiftHistory behaviour. Empty state message ("No variance in the last N days") renders. |
| `items` array not destructured from `useInventoryItems` in TASK-02 | Very Low | Low | Planning validation confirms `items` is in the hook return value. TASK-02 execution plan explicitly notes adding `items` to the destructure. |
| `formatDate` import not currently in `ManagerAuditContent` | Very Low | Low | TASK-02 adds the import from `../../utils/dateUtils` for effective date string in filename. |

## Observability

- Logging: None required.
- Metrics: None required.
- Alerts/Dashboards: None required. Export button click is followed by `showToast` success — sufficient user feedback.

## Acceptance Criteria (overall)

- [ ] `ManagerAuditContent` renders `From`, `To` date inputs and `Staff` text input in the Stock Variance section.
- [ ] `ManagerAuditContent` renders item filter `<select>` with "All items" + per-item options.
- [ ] Filtering by date range excludes out-of-window entries.
- [ ] Filtering by staff excludes entries whose `user` does not match the input (case-insensitive substring).
- [ ] Filtering by item excludes entries for other items.
- [ ] Combined filters apply AND logic.
- [ ] Export button present when filtered rows > 0; absent when 0.
- [ ] Export button click triggers `showToast` with success message.
- [ ] CSV filename contains effective start and end dates in YYYY-MM-DD format.
- [ ] CSV columns: `Recorded at`, `Item`, `Item ID`, `Delta`, `User`, `Reason`, `Note`.
- [ ] Empty state message updated from "No variance in the last 7 days" to "No variance in the selected period".
- [ ] All 7 pre-existing tests pass unchanged.
- [ ] New tests cover TC-01, TC-03, TC-04, TC-08, TC-09, TC-15 through TC-20.

## Decision Log

- 2026-03-01: Chose client-side filtering over Firebase query param filtering. Rationale: `useInventoryLedger` subscribes the full path; hook refactor would add re-subscription complexity for no performance benefit at BRIK scale.
- 2026-03-01: Default date window set to 30 days (not 7). Rationale: consistent with `TillShiftHistory` pattern; provides more useful audit history by default.
- 2026-03-01: Item filter implemented as native `<select>` (not text input). Rationale: avoids typos, consistent with StockManagement variance window select, shows only valid items.
- 2026-03-01: CSV helpers kept inline (not extracted to shared util). Rationale: inline is the established convention in `StockManagement`; no other callers exist.
- 2026-03-01: Staff filter dependency on IDEA-DISPATCH-20260301-0081 declared moot. Rationale: `user` field already exists on all entries (required in Zod schema, always written by `useInventoryLedgerMutations`).
- 2026-03-01: `STOCK_VARIANCE_WINDOW_DAYS` NOT imported as replacement for `SEVEN_DAYS_MS`. The deleted constant is not replaced — the default window of 30 days is computed inline. The constants file has `STOCK_VARIANCE_WINDOW_DAYS = 7` which would contradict the 30-day default if imported. Keeping them separate avoids a misleading import.

## Overall-confidence Calculation

- TASK-01: 90%, Effort M (weight 2)
- TASK-02: 90%, Effort M (weight 2)
- TASK-03: 85%, Effort M (weight 2)
- Overall-confidence = (90*2 + 90*2 + 85*2) / (2+2+2) = (180+180+170)/6 = 530/6 ≈ **88%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Date-range and staff filters | Yes | None — `startOfDayIso`/`endOfDayIso` confirmed exported from `dateUtils`; `SEVEN_DAYS_MS` deleted (no replacement import); 30-day default computed inline; `toTimestampMs` already in component for timestamp comparison | No |
| TASK-02: Item filter + CSV export | Yes | [Minor] `items` not currently destructured from `useInventoryItems` in the component — must be added in TASK-02 execution plan (documented). `formatDate` import needed for filename. Both addressed in task execution plan. | No |
| TASK-03: Tests | Yes | [Minor] `showToast` mock not yet present in test file — must be added. `useInventoryItemsMock` must return `items: []` alongside `itemsById`. Both addressed in task notes. | No |
