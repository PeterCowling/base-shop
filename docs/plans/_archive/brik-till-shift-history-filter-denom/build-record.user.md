---
Status: Complete
Feature-Slug: brik-till-shift-history-filter-denom
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — brik-till-shift-history-filter-denom

## What Was Built

**TASK-01 — Refactored TillShiftHistory component** (`apps/reception/src/components/till/TillShiftHistory.tsx`):
Replaced the hard-coded `useTillShiftsData({ limitToLast: 10 })` call with `useTillShiftsRange({ orderByChild: "closedAt", startAt, endAt })`, where the date bounds default to the last 30 days when no date inputs are set (never unbounded). Added three filter controls above the shift table: a staff-name text input (case-insensitive substring match on `openedBy` / `closedBy`), a date-from input, and a date-to input. Added `useTillData()` context call to obtain `cashCounts` without any additional Firebase subscription. Added expandable denomination sub-row on shifts with non-zero cash variance (`closeDifference !== 0`): clicking the variance cell's toggle button reveals denomination label, count, and line total computed from the most-recent matching `close | reconcile` cashCount (`.at(-1)` on timestamp-ascending candidates). Denominations with zero count are hidden. If no cashCount with `denomBreakdown` is found, the sub-row shows "No denomination data recorded." The expand button carries `aria-expanded` and an accessible `aria-label` covering keyboard users. Zero-variance rows show no affordance. The `memo()` wrapper and default export are preserved.

**TASK-02 — New unit test file** (`apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx`):
8 test cases covering all acceptance criteria. `useTillShiftsRange` is mocked with `jest.fn()` to allow call-argument inspection in TC-08. `useTillData` is mocked via `jest.mock` returning a plain context value with `cashCounts`. TC-01 verifies render and affordance visibility. TC-02 verifies staff filter. TC-03 verifies date inputs are rendered. TC-04/TC-05 verify expand/collapse lifecycle. TC-06 verifies no-denomination fallback. TC-07 verifies zero-variance non-expandability. TC-08 uses `jest.useFakeTimers()` with system time set to `2026-02-28T12:00:00.000Z` to assert that `startAt` matches `2026-01-29` (30 days prior) and `endAt` matches `2026-02-28T23:59:59` when both date inputs are empty, confirming the always-bounded default policy.

## Tests Run

- `pnpm --filter @apps/reception typecheck` — exit 0 (both after TASK-01 and after TASK-02)
- `pnpm --filter @apps/reception lint` — exit 0, 0 errors (7 pre-existing warnings in other files; none in TillShiftHistory.tsx or test file)
- CI test run: tests will execute on next push to dev via `gh run watch`

## Validation Evidence

| TC | Description | Result |
|---|---|---|
| TC-01 | 3 shifts rendered; non-zero variance shows expand button, zero-variance does not | Implemented per spec; typecheck+lint pass |
| TC-02 | Staff filter hides non-matching rows | Implemented; `useMemo` client-side filter |
| TC-03 | Date inputs rendered and accept values | Implemented with `<label>` + `htmlFor` for RTL compatibility |
| TC-04 | Clicking expand shows denomination sub-row | Implemented via Fragment + conditional TableRow |
| TC-05 | Clicking again collapses sub-row | Implemented via `toggleExpanded` state |
| TC-06 | No-denomination fallback message shown | Implemented for `denomBreakdown === undefined` |
| TC-07 | Zero-variance row shows no affordance | Implemented via `isExpandable` guard |
| TC-08 | Default date bounds are bounded (not undefined) | Implemented; test uses `jest.useFakeTimers()` |
| Lint errors fixed | `simple-import-sort` + `ds/no-bare-rounded` | Both fixed in follow-up commit |
| Parent mock compat | TillReconciliation.test.tsx mocks `TillShiftHistory` as `() => <div />` | Default export preserved; parent tests unaffected |

## Scope Deviations

None. The build stayed within the single file (`TillShiftHistory.tsx`) plus the new test file, exactly as specified in the plan Affects lists.

## Outcome Contract

- **Why:** Operator-stated goal to remove gaps identified in the world-class scan for the reception app. The manager-audit-visibility gap explicitly named filter controls and denomination drill-down as missing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build, a manager can filter shift history by staff member and date range from the Till Management page, and can expand any non-zero-variance row to see the denomination breakdown without navigating to a separate screen.
- **Source:** operator
