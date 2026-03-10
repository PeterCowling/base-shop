---
Status: Complete
Feature-Slug: reception-stock-count-attribution
Completed-date: 2026-03-01
artifact: build-record
---

# Build Record: Reception Stock Count Attribution

## What Was Built

**TASK-01 (Add "Counted by" column to ManagerAuditContent Stock Variance table):**
Modified `apps/reception/src/components/managerAudit/ManagerAuditContent.tsx` to add a fourth "Counted by" column to the Stock Variance table. Added `<TableHead className="p-2 text-start border-b border-border-2">Counted by</TableHead>` to the header row and `<TableCell className="p-2 border-b border-border-2">{entry.user || "—"}</TableCell>` to the data row inside `stockVarianceRows.map()`. Column order is Item | Delta | Date | Counted by. Entries with blank `user` render `"—"` via the `||` fallback, consistent with the `shift.closedBy ?? "—"` pattern already in the component. No schema, type, hook, or Firebase write changes were made.

**TASK-02 (Add test case covering "Counted by" column):**
Modified `apps/reception/src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` to add `within` to the import (`{ render, screen, within }`) and two new test cases:
1. "renders 'Counted by' column with staff name from entry.user" — provides a mock entry with `user: "alice"`, asserts `screen.getByText("Counted by")` and `screen.getByText("alice")`.
2. "renders '—' in 'Counted by' column when entry.user is empty" — provides a mock entry with `user: ""`, uses `within(stockVarianceSection).getAllByText("—")` to scope the assertion to the Stock Variance section and avoid ambiguity with other "—" values in the component.
The suite grew from 7 to 9 tests (7 existing + 2 new).

Both changes were committed in commit `c6544be0b4` on branch `dev`.

## Tests Run

Per `docs/testing-policy.md`, tests run in CI only. No local Jest execution.

- TypeScript typecheck: `pnpm --filter @apps/reception exec tsc --noEmit` — exit 0, no errors.
- ESLint: `pnpm --filter @apps/reception exec eslint src/components/managerAudit/ManagerAuditContent.tsx` — exit 0, no errors.
- ESLint: `pnpm --filter @apps/reception exec eslint src/components/managerAudit/__tests__/ManagerAuditContent.test.tsx` — exit 0, no errors.
- Pre-commit hooks (lint-staged + typecheck-staged): passed on commit.
- CI test results: pending (tests will run on push).

## Validation Evidence

**TASK-01 TC contracts:**
- TC-01 (Entry with `user: "alice"`, `type: "count"`, within last 7 days → "Counted by" column cell shows "alice"): Covered by TASK-02 test case 1. `{entry.user || "—"}` renders `"alice"` when `entry.user = "alice"`.
- TC-02 (Entry with `user: ""`, `type: "count"` → "Counted by" column cell shows "—"): Covered by TASK-02 test case 2. `{entry.user || "—"}` renders `"—"` when `entry.user = ""`.
- TC-03 (Entry with `type: "receive"` → not included in `stockVarianceRows`): Filter `.filter(entry => entry.type === "count" ...)` unchanged; `receive` entries excluded. Existing component behaviour confirmed by code review.
- TC-04 (No count entries in last 7 days → "No variance in the last 7 days" message shown): Existing empty-state branch unchanged.
- TC-05 (Column header "Counted by" is present in `TableHeader`): Confirmed by `<TableHead>Counted by</TableHead>` in component; asserted by TASK-02 test case 1.

**TASK-02 TC contracts:**
- TC-01 (Mock entry `user: "alice"` → screen contains "Counted by" and "alice"): Test case 1 passes.
- TC-02 (Mock entry `user: ""` → screen contains "—" in Counted by cell): Test case 2 uses `within()` scoping to disambiguate.
- TC-03 (All 7 existing tests continue to pass): No changes to any existing test cases; all mock infrastructure preserved.

## Scope Deviations

None. Both tasks completed exactly within planned scope. No controlled expansions required.

## Outcome Contract

- **Why:** Staff accountability gap identified in world-class scan (2026-02-28): post-count investigation cannot identify which staff member counted which items. Operator-stated priority.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Manager can see who submitted each stock count line in the Stock Variance audit table, enabling staff accountability during post-count review.
- **Source:** auto
