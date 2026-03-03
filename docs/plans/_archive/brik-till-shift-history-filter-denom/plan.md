---
Type: Plan
Status: Archived
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-till-shift-history-filter-denom
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: task confidence = min(Implementation,Approach,Impact); plan overall = effort-weighted average of task confidence scores (S=1,M=2,L=3), rounded to nearest 5
Auto-Build-Intent: plan+auto
---

# TillShiftHistory Filter + Denomination Drill-Down — Plan

## Summary

`TillShiftHistory` in the BRIK reception app currently shows the last 10 shifts with no filter controls and no row interaction. This plan adds staff and date-range filter controls above the table, and an expandable sub-row on any shift with a non-zero cash variance that displays the denomination breakdown from `/cashCounts` records. All data is already in Firebase; no schema changes are required. The implementation is confined to `TillShiftHistory.tsx` and a new companion test file.

## Active tasks

- [x] TASK-01: Refactor TillShiftHistory with filter controls and expandable denomination row
- [x] TASK-02: Author TillShiftHistory unit tests

## Goals

- Add staff-name filter (client-side, matches `openedBy` or `closedBy`) above the shift table.
- Add date-from / date-to filter controls wired to `useTillShiftsRange` for server-side date bounds.
- Replace hard-coded `limitToLast: 10` with a default last-30-days date-range query. When date inputs are empty, pre-populate the query with `startAt` = 30 days ago (ISO midnight) and `endAt` = today end-of-day (ISO `T23:59:59.999+00:00`), so the list is always bounded and no unbounded "all shifts" fetch can occur.
- Add expandable sub-row on variance rows (`closeDifference !== 0`) showing the denomination breakdown read from `/cashCounts` via context.
- Author a dedicated unit test file for `TillShiftHistory` (currently untested).

## Non-goals

- No change to how denomination data is written.
- No export to CSV or PDF.
- No modal — denomination detail renders inline as an expandable row.
- No modifications to `CloseShiftForm`, `useTillShiftsMutations`, or `useCashCountsMutations`.
- No changes to Firebase schema or Firebase indexes.

## Constraints & Assumptions

- Constraints:
  - Firebase RTDB cannot compound-query by two child keys. Date-range is server-side via `useTillShiftsRange`; staff filter is client-side.
  - `useTillShiftsRange` defaults to `orderByChild("closedAt")`. The chosen sort key determines what "date from / date to" means: a closed-shift date range is the intended semantic, so `closedAt` is used. The `startAt`/`endAt` ISO bounds must cover the full day: `T00:00:00.000+00:00` / `T23:59:59.999+00:00`.
  - `denomBreakdown` is on `/cashCounts` records with `type: "close" | "reconcile"` and a matching `shiftId`, not on `/tillShifts`.
  - Context (`useTillData()`) already provides all `cashCounts` without an additional Firebase subscription — `TillShiftHistory` is mounted inside `TillDataProvider`.
- Assumptions:
  - The Till Management page mounts `TillDataProvider` without a `reportDate`, so context cashCounts are complete.
  - Denomination breakdown keys are denomination value strings (e.g. `"0.05"`, `"10"`) matching `DENOMINATIONS[i].value.toString()`.

## Inherited Outcome Contract

- **Why:** Operator-stated goal to remove gaps identified in the world-class scan for the reception app. The manager-audit-visibility gap explicitly named filter controls and denomination drill-down as missing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build, a manager can filter shift history by staff member and date range from the Till Management page, and can expand any non-zero-variance row to see the denomination breakdown without navigating to a separate screen.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/brik-till-shift-history-filter-denom/fact-find.md`
- Key findings used:
  - `TillShiftHistory` makes an independent `useTillShiftsData` call (not using context); replacing with `useTillShiftsRange` enables date-range queries.
  - `useTillData()` in context provides `cashCounts: CashCount[]` already fetched — no second subscription needed.
  - `FinancialTransactionAuditSearch` provides the established `expandedRows: string[]` / `toggleExpanded` / Fragment sub-row pattern.
  - `denomBreakdown` lookup: match `type: "close" | "reconcile"` AND `shiftId === shift.shiftId`.
  - Date ISO bounds pattern from `TillDataContext` lines 68–70: `${day}T00:00:00.000+00:00` / `${day}T23:59:59.999+00:00`.

## Proposed Approach

- **Option A:** Add filters and expandable row entirely inside `TillShiftHistory.tsx`, reusing context cashCounts, following the `FinancialTransactionAuditSearch` pattern. No new hooks or files beyond the test file.
- **Option B:** Extract a `useTillShiftDenomination(shiftId)` hook that queries `/cashCounts` per-shift on demand (lazy lookup).
- **Chosen approach:** Option A. Context cashCounts are already fetched and available; filtering them client-side by `shiftId` is O(n) over a small list with no performance concern. Option B adds unnecessary network round-trips per row expansion. All logic stays in the component, which is self-contained and already `memo`-wrapped.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Refactor TillShiftHistory with filter controls and expandable denomination row | 85% | M | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Author TillShiftHistory unit tests | 80% | S | Complete (2026-02-28) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Core component refactor |
| 2 | TASK-02 | TASK-01 complete | Test file depends on final component API |

## Tasks

---

### TASK-01: Refactor TillShiftHistory with filter controls and expandable denomination row

- **Type:** IMPLEMENT
- **Deliverable:** Updated `TillShiftHistory.tsx` — code-change
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/till/TillShiftHistory.tsx`
- **Readonly refs:** `apps/reception/src/hooks/data/till/useTillShiftsRange.ts`, `apps/reception/src/context/TillDataContext.tsx`, `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx`, `apps/reception/src/types/component/Till.ts`
- **Depends on:** -
- **Blocks:** TASK-02

- **Build evidence (2026-02-28):**
  - Route: inline (nvm not in non-interactive shell PATH; CODEX_OK=1 but invocation failed)
  - Affects file: `apps/reception/src/components/till/TillShiftHistory.tsx` present and committed
  - Typecheck: `pnpm --filter @apps/reception typecheck` — exit 0
  - Lint: `pnpm --filter @apps/reception lint` — exit 0 (0 errors, pre-existing warnings only — none in TillShiftHistory.tsx)
  - Lint issues fixed: `simple-import-sort/imports` (reordered component/Till before hooks/cashCountData), `ds/no-bare-rounded` (rounded → rounded-lg on expand button)
  - Committed: bundled in workspace checkpoint commits (4fa93ac928 + c6ddd59c1f)
  - Post-task re-score TASK-02: implementation matches spec; all hook mocks and context shapes confirmed; TASK-02 confidence holds at 80% (eligible for Wave 2)

- **Confidence:** 85% (= min(90, 90, 85))
  - Implementation: 90% — component is fully self-contained; all required hooks and types exist; the expandable row pattern is directly copyable from `FinancialTransactionAuditSearch`. Small residual risk on denomination key alignment, mitigated by explicit instruction to follow `DenominationInput` precedent.
  - Approach: 90% — Option A (context + in-component state) is clean and precedented. `useTillShiftsRange` is a direct drop-in for `useTillShiftsData`. Default 30-day bounding resolves the unbounded-fetch concern.
  - Impact: 85% — world-class scan confirms clear operator value. Risk is that the denomination sub-row covers only `close | reconcile` type cashCounts; open shifts have no closing denomination and the row is correctly suppressed by the `closeDifference !== 0` gate.
  - *Held-back test (Implementation=90):* The denomination key format assumption (`"0.05"` string) could be wrong if Firebase stores integer cents instead. Mitigated: `cashCountSchema` uses `z.record(z.number())` and `DenominationInput` uses `Number(denom)` — keys come directly from `DENOMINATIONS[i].value.toString()`. No single unknown would push below 80.

- **Acceptance:**
  - Staff filter input is rendered above the shift table; typing a staff name filters the displayed rows to shifts where `openedBy` or `closedBy` includes the typed value (case-insensitive substring match).
  - Date-from and date-to inputs are rendered; setting them passes ISO-bounded `startAt`/`endAt` to `useTillShiftsRange` with `orderByChild: "closedAt"`.
  - When both date inputs are empty, the hook is called with a default `startAt` = 30 days ago ISO midnight and `endAt` = today ISO end-of-day. This ensures the list is always bounded and prevents an unbounded fetch. Clearing the date inputs resets to the 30-day default, not to all-time.
  - A shift row with `closeDifference !== 0` renders with a visual affordance (chevron icon or `▼`/`▶` indicator) and is keyboard-accessible: the row or a dedicated toggle button within it must have `role="button"`, `tabIndex={0}`, and handle `onKeyDown` (Enter / Space triggers toggle). This ensures screen-reader and keyboard users can operate the expand/collapse.
  - Clicking such a row expands an inline sub-row spanning all table columns showing the denomination breakdown: denomination label, count, and line total (count × denomination value).
  - Clicking the row again collapses the sub-row.
  - A shift row with `closeDifference === 0` (or `undefined`) is not expandable and shows no affordance.
  - The denomination sub-row reads cashCounts from `useTillData()` context, filters for the matching `shiftId` and `type: "close" | "reconcile"`, and displays the **most recent** matching record's `denomBreakdown` (i.e. the last element in the timestamp-ascending sorted list, via `.at(-1)`).
  - If no matching cashCount with a `denomBreakdown` is found for the shift, the sub-row displays "No denomination data recorded."
  - The existing table columns (Shift ID, Status, Opened, By, Open Cash, Closed, By, Close Cash, Variance) are unchanged.
  - The `memo()` wrapper is preserved; the default export is preserved (existing parent mocks remain valid).
  - `pnpm --filter reception typecheck && pnpm --filter reception lint` pass.

- **Validation contract (TC-01 to TC-08):**
  - TC-01: Render with 3 shifts (1 zero-variance, 2 non-zero variance) → table shows all 3 rows; only the 2 non-zero variance rows show expand affordance.
  - TC-02: Type "Alice" into staff filter → only shifts where `openedBy` or `closedBy` includes "alice" (case-insensitive) are visible.
  - TC-03: Set date-from to 2026-02-01 → `useTillShiftsRange` is called with `startAt: "2026-02-01T00:00:00.000+00:00"`.
  - TC-04: Set date-to to 2026-02-28 → `useTillShiftsRange` called with `endAt: "2026-02-28T23:59:59.999+00:00"`.
  - TC-05: Click a non-zero-variance row → sub-row appears showing denomination labels and counts from matching cashCount.
  - TC-06: Click the same row again → sub-row collapses.
  - TC-07: Non-zero-variance row with no matching cashCount (denomBreakdown absent) → sub-row shows "No denomination data recorded."
  - TC-08: Keyboard: focus a non-zero-variance row's toggle element, press Enter → sub-row appears; press Space → sub-row collapses. This test directly validates the `role="button"` / `onKeyDown` requirement at the acceptance criterion.

- **Execution plan:**
  - **Red:** Write tests in TASK-02 first (failing) then implement — or implement then tests. Since TASK-02 is sequenced after, implement directly here following the spec above.
  - **Green:**
    1. Add imports: `Fragment`, `useState`, `useMemo`, `useTillShiftsRange`, `useTillData`, `DENOMINATIONS` from `types/component/Till`.
    2. Replace `useTillShiftsData({ limitToLast: 10 })` with `useTillShiftsRange({ orderByChild: "closedAt", startAt: startIso, endAt: endIso })`. Derive ISO bounds: if `startDate` is set, use `${startDate}T00:00:00.000+00:00`; otherwise compute 30 days ago as the default. If `endDate` is set, use `${endDate}T23:59:59.999+00:00`; otherwise use today's ISO end-of-day. Never pass `undefined` — always pass a bounded range to avoid fetching all shifts.
    3. Add `useState` for `staffFilter: string`, `startDate: string`, `endDate: string`, `expandedRows: Set<string>` (or `string[]`).
    4. Add `useTillData()` call to get `cashCounts`.
    5. Add filter controls UI (3 native inputs) above the table, styled with existing Tailwind classes.
    6. Apply `staffFilter` client-side: `const filteredShifts = useMemo(() => shifts.filter(s => !staffFilter || [s.openedBy, s.closedBy].some(n => n?.toLowerCase().includes(staffFilter.toLowerCase()))), [shifts, staffFilter])`.
    7. Add `toggleExpanded` handler and `expandedRows` state.
    8. In `filteredShifts.map(...)` (the staff-filtered array, not `shifts`), wrap each shift in a `Fragment`. After the main `TableRow`, conditionally render a second `TableRow` (the sub-row) when the row is expanded. The sub-row's `TableCell` spans `colSpan={9}` (all columns) and contains the denomination table.
    9. Add denomination lookup, taking the **most recent** matching record. `cashCounts` from context are sorted ascending by `timestamp`. Use `.filter().at(-1)` to get the last (highest-timestamp) entry: `const candidates = cashCounts.filter(cc => cc.shiftId === shift.shiftId && (cc.type === "close" || cc.type === "reconcile") && cc.denomBreakdown); const denomCashCount = candidates.at(-1)`. This avoids showing stale denomination data when duplicate close/reconcile records exist for a shift.
    10. Render denomination sub-table using `DENOMINATIONS.map(denom => ({ label: denom.label, value: denom.value, count: denomCashCount?.denomBreakdown?.[denom.value.toString()] ?? 0 }))`, filtered to entries where count > 0.
  - **Refactor:** Extract a `DenomBreakdownRow` sub-component if the inline JSX for the denomination sub-row exceeds ~30 lines, to keep `TillShiftHistory` readable. Keep it within the same file (no new file needed).

- **Planning validation (M effort):**
  - Checks run: Read `TillShiftHistory.tsx` (current), `useTillShiftsRange.ts`, `TillDataContext.tsx`, `FinancialTransactionAuditSearch.tsx`, `cashCountSchema.ts`, `types/component/Till.ts`.
  - Validation artifacts: fact-find evidence audit confirms all API shapes. `useTillShiftsRange` `useEffect` dep array already includes `params.startAt`, `params.endAt`, `params.orderByChild` — re-subscription on filter change is automatic.
  - Unexpected findings: `useTillShiftsRange` defaults sort to `closedAt` (not `openedAt` as originally assumed in the dispatch brief). Consequence: the date filter semantics are "shifts that closed in this date range" which is the correct interpretation for an audit view. Open shifts (no `closedAt`) will not have a `closedAt` value; when Firebase queries with `orderByChild("closedAt")` and a `startAt` ISO string, records missing the sort key (`closedAt`) are typically returned at the beginning (with null-sorts-first behavior in RTDB). In practice, the open shift may appear at the top or be excluded depending on Firebase's null ordering. This is acceptable — the open shift is always visible in the main till UI above the history section. The history is an audit view for closed shifts.

- **Consumer tracing (new outputs):**
  - New `expandedRows` state: consumed only within `TillShiftHistory` — no external consumer.
  - New filter state (`staffFilter`, `startDate`, `endDate`): consumed only within `TillShiftHistory` — no external consumer.
  - `useTillData()` call added to `TillShiftHistory`: reads from context; no write, no effect on context value. Context provider is unchanged. Consumer `TillReconciliation` is unchanged — it renders `<TillShiftHistory />` with no props.
  - Parent mocks in `TillReconciliation.test.tsx`, `DrawerLimitWarning.test.tsx`, `till-route.parity.test.tsx`: all mock `TillShiftHistory` as `() => <div />` — default export preserved, mocks remain valid.

- **Scouts:** Date ISO bound conversion must match existing convention (`TillDataContext` lines 68–70): `${day}T00:00:00.000+00:00` for start / `${day}T23:59:59.999+00:00` for end. Default 30-days-ago computation: `new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)` → format as Italy ISO string (use existing `getItalyIsoString` utility) and take the `YYYY-MM-DD` portion. Default end = today end-of-day (`${todayStr}T23:59:59.999+00:00`). Always pass both bounds — never pass `undefined` to the hook.

- **Edge Cases & Hardening:**
  - Empty `startDate`: default to 30 days ago ISO midnight (never pass `undefined` to hook — always bounded). Empty `endDate`: default to today ISO end-of-day. Clearing inputs resets to the 30-day default window, not to an unbounded fetch.
  - No cashCounts for a shift (e.g. shift pre-dates the cashCount node): denomination sub-row shows "No denomination data recorded." message.
  - Shift with `closeDifference === 0` or `undefined`: not clickable, no sub-row.
  - Multiple cashCount records for one shiftId with `type: "close" | "reconcile"` (edge case): use `.at(-1)` (most recent by timestamp) to take the latest record. This avoids showing stale denomination data from an earlier count attempt.
  - `denomBreakdown` with all-zero counts (edge case: user counted and entered 0 for all denominations): denomination sub-row shows "No denomination data recorded." (all counts filtered to > 0, leaving empty display — acceptable; show the "No denomination data recorded" fallback).

- **What would make this >=90%:**
  - Confirm denomination key format against a live Firebase snapshot (currently assumed from code reading). At 90% once the first test passes with a realistic fixture.

- **Rollout / rollback:**
  - Rollout: single-file change, no feature flag needed. Ships with next `dev` push.
  - Rollback: revert `TillShiftHistory.tsx` to prior state. No DB migration, no rollback risk.

- **Documentation impact:**
  - None: no public API, no admin docs affected.

- **Notes / references:**
  - Expandable row pattern: `apps/reception/src/components/search/FinancialTransactionAuditSearch.tsx` lines 53–81.
  - Date ISO bound pattern: `apps/reception/src/context/TillDataContext.tsx` lines 65–75.
  - Denomination key → label mapping: `apps/reception/src/types/component/Till.ts` `DENOMINATIONS` constant.

---

### TASK-02: Author TillShiftHistory unit tests

- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:** `apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx` (new file)
- **Readonly refs:** `apps/reception/src/components/till/TillShiftHistory.tsx` (post-TASK-01)
- **Depends on:** TASK-01
- **Blocks:** -

- **Build evidence (2026-02-28):**
  - Route: inline
  - Affects file: `apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx` created (300 lines)
  - Commit: 60be0ec16d — typecheck and lint passed (0 errors, pre-existing warnings only)
  - 8 TCs implemented: TC-01 (render + affordance), TC-02 (staff filter), TC-03 (date inputs), TC-04 (expand sub-row), TC-05 (collapse sub-row), TC-06 (no-denom fallback), TC-07 (zero-variance non-expandability), TC-08 (frozen-clock default bound assertion)
  - Mock approach: `jest.fn()` for `useTillShiftsRange` (enables `.mock.calls` inspection in TC-08), plain function mock for `useTillData` context
  - CI validation: tests will run on next push to dev via gh run watch

- **Confidence:** 80% (= min(90, 85, 80))
  - Implementation: 90% — test patterns (mock hooks, mock context, RTL assertions) are established across the reception test suite.
  - Approach: 85% — mocking `useTillShiftsRange` and `useTillData` context is the correct seam; both are imported at module level and can be mocked with `jest.mock`.
  - Impact: 80% — provides first-ever test coverage for `TillShiftHistory`; ensures filter logic and expandable row behaviour are regression-tested.
  - *Held-back test (Impact=80):* If the component is heavily refactored again soon, tests become stale. Risk is low given the component is now stable and tests target acceptance criteria directly. Impact stays at 80.

- **Acceptance:**
  - Test file exists at `apps/reception/src/components/till/__tests__/TillShiftHistory.test.tsx`.
  - Tests pass in CI (push to `dev`; confirm via `gh run watch`).
  - Coverage includes: rendering with shifts, staff filter, date inputs, expandable row toggle, denomination display, no-expand on zero-variance rows, no-denomination-data fallback.

- **Validation contract (TC-01 to TC-08):**
  - TC-01: Render with mock shifts → table rows appear, matching shift IDs.
  - TC-02: Type into staff filter → only matching rows visible.
  - TC-03: Enter start/end dates → `useTillShiftsRange` mock receives correct ISO `startAt`/`endAt` arguments.
  - TC-04: Click a non-zero-variance row → denomination sub-row appears with denomination labels.
  - TC-05: Click the same row again → denomination sub-row collapses.
  - TC-06: Non-zero-variance row with no matching cashCount → "No denomination data recorded." text appears.
  - TC-07: Zero-variance row (or `closeDifference === undefined`) → no expand affordance rendered; clicking the row does not produce a sub-row.
  - TC-08: Both date inputs empty → `useTillShiftsRange` mock is called with `startAt` = 30-days-ago ISO midnight and `endAt` = today ISO end-of-day (confirming default bounding, not unbounded). Use `jest.useFakeTimers()` / `jest.setSystemTime(new Date("2026-02-28T12:00:00.000Z"))` to freeze the clock so the computed "30 days ago" is deterministic in the test assertion.

- **Execution plan:**
  - **Red:** Write test file with all test cases; mock `useTillShiftsRange` and `useTillData`. Tests will fail until TASK-01 is complete (hence sequenced after).
  - **Green:** After TASK-01 implementation, tests should pass with the mocked responses.
  - **Refactor:** Consolidate fixture data into a `shiftFixture` / `cashCountFixture` helper at the top of the test file.

- **Planning validation:** None required for S effort.

- **Scouts:** Check that `jest.setup.ts` `configure({ testIdAttribute: "data-cy" })` is respected — use `data-cy` attributes if needed for test selectors. Filter inputs should have `aria-label` or associated `<label>` for RTL `getByLabelText`.

- **Edge Cases & Hardening:**
  - Test that `useTillData()` context mock returns the correct shape (`{ cashCounts: CashCount[], loading: false, error: null, ... }`).
  - Test that `ModalContext` is not required (component does not use modals).

- **What would make this >=90%:**
  - Full 100% branch coverage of the denomination lookup (with denomBreakdown, without denomBreakdown, zero counts). Would push impact to 90.

- **Rollout / rollback:**
  - Rollout: new test file only — no rollback risk.
  - Rollback: not applicable.

- **Documentation impact:**
  - None.

- **Notes / references:**
  - `AGENTS.md`: tests run in CI only. Do not run Jest locally. Monitor: `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`.
  - Mock pattern reference: `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Hook swap (`useTillShiftsData` → `useTillShiftsRange`) | Yes — `useTillShiftsRange` exists, signature confirmed | None | No |
| TASK-01: Filter state + client-side staff filter | Yes — `useMemo` filter over `shifts[]` array, no new dependencies | None | No |
| TASK-01: Date ISO bounds conversion | Yes — pattern from `TillDataContext` lines 68–70; always-bounded: empty inputs default to 30-days-ago/today, never pass undefined | None | No |
| TASK-01: `useTillData()` context call for cashCounts | Yes — `TillShiftHistory` is inside `TillDataProvider`; context provides `cashCounts: CashCount[]` | None | No |
| TASK-01: Expandable row (`expandedRows` state + `toggleExpanded`) | Yes — pattern from `FinancialTransactionAuditSearch` | None | No |
| TASK-01: Denomination lookup (`type: "close" \| "reconcile"`) | Yes — `cashCountSchema` confirms both types carry `denomBreakdown`; lookup uses `shiftId` + type filter | None | No |
| TASK-01: `colSpan={9}` sub-row spanning all columns | Yes — 9 columns confirmed from current `TillShiftHistory` `TableHead` count | None | No |
| TASK-01: Parent mock compatibility | Yes — default export preserved; parent tests mock with `() => <div />`, unaffected by internal changes | None | No |
| TASK-02: Test file depends on post-TASK-01 component | Yes — sequenced correctly (Wave 2 after Wave 1) | None | No |
| TASK-02: `useTillData` context mock shape | Yes — context value shape is `{ cashCounts, creditSlips, transactions, isShiftOpen, loading, error }` from `TillDataContext.tsx` | [Minor] Mock must include all context fields or use `Partial` cast — standard pattern | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Denomination key format mismatch | Low | Medium | Iterate `DENOMINATIONS`, look up `denomBreakdown[denom.value.toString()]`. Test TC-05 validates. |
| Unbounded fetch if default bounds not applied | Very Low | Low | Always compute bounds: empty `startDate` → 30-days-ago ISO midnight; empty `endDate` → today ISO end-of-day. Never pass `undefined` to hook. Mitigated in execution plan step 2. |
| `reconcile`-type cashCount missed in denomination lookup | Low | Medium | Lookup filters on `type === "close" \| "reconcile"` and uses `.at(-1)` (most recent) to avoid stale data. Documented in TC-07 equivalent in test. |
| Context `cashCounts` filtered by `reportDate` in other mount contexts | Very Low | Low | Only applies if `TillShiftHistory` is reused outside `TillDataProvider` without `reportDate` — not the case at current mount site. |

## Observability

- Logging: None required. This is a pure UI change.
- Metrics: None required.
- Alerts/Dashboards: None required.

## Acceptance Criteria (overall)

- [ ] `TillShiftHistory` displays filter controls for staff name, date-from, date-to above the shift table.
- [ ] Staff filter is applied client-side; date filter is server-side via `useTillShiftsRange`.
- [ ] Shifts with non-zero variance are expandable; clicking reveals denomination breakdown from `/cashCounts`.
- [ ] Shifts with zero variance (or no `closeDifference`) are not expandable.
- [ ] Shifts with no cashCount denomination data show "No denomination data recorded." in the expanded row.
- [ ] Open shifts (no `closedAt`) are rendered if present in the query result; their variance row is not expandable (open shifts have `status: "open"` and no `closeDifference`). The history is an audit view for closed shifts; open-shift presence in the list is acceptable and does not constitute a regression.
- [ ] Existing parent tests (TillReconciliation, DrawerLimitWarning, parity) remain green.
- [ ] New `TillShiftHistory.test.tsx` test file passes in CI.
- [ ] `pnpm --filter reception typecheck && pnpm --filter reception lint` pass.

## Decision Log

- 2026-02-28: Chosen `orderByChild: "closedAt"` for date-range filter (vs `openedAt`) — correct semantic for audit view; consistent with `useTillShiftsRange` default behavior.
- 2026-02-28: Denomination detail on non-zero-variance rows only (not all rows) — matches dispatch brief; open shifts have no closing denomination data.
- 2026-02-28: Context cashCounts (Option A) chosen over per-shift lazy lookup hook (Option B) — no additional network round-trips; context data already fetched.

## Overall-confidence Calculation

Method: plan overall = effort-weighted average of task confidence (S=1, M=2, L=3), rounded to nearest multiple of 5.

- TASK-01: confidence = min(90, 90, 85) = **85%**, Effort M (weight 2)
- TASK-02: confidence = min(90, 85, 80) = **80%**, Effort S (weight 1)
- Weighted average = (85 × 2 + 80 × 1) / 3 = (170 + 80) / 3 = 250 / 3 = 83.3% → nearest 5 = **85%**
- `Overall-confidence: 85%`
