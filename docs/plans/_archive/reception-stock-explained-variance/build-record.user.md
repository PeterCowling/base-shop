---
Type: Build-Record
Status: Complete
Feature-Slug: reception-stock-explained-variance
Build-date: 2026-02-28
artifact: build-record
---

# Build Record — Reception Stock Explained/Unexplained Variance Split

## What Was Built

**TASK-01: Add explained/unexplained variance split to StockManagement**

Added `STOCK_VARIANCE_WINDOW_DAYS = 7` constant to `apps/reception/src/constants/stock.ts` alongside the existing shrinkage constants. In `StockManagement.tsx`, two `useMemo` computations were added using helper functions `buildExplainedShrinkageByItem` and `buildUnexplainedVarianceByItem` to compute per-item explained shrinkage (negative waste + negative transfer entries within the look-back window) and unexplained variance (net-negative count discrepancy minus explained, floored at 0). A `<VarianceBreakdownSection>` component renders the results in a `@acme/design-system` Table with a window selector (7/14/30 days via `useState`) and an empty state for the no-variance case. Items with no count entries or net-positive count delta are excluded from the breakdown.

Note: TASK-01 code changes were bundled into commit `4fa93ac928` (xa-uploader commit) by a concurrent agent.

**TASK-02: Add unit tests for the variance breakdown section**

Added 7 test cases (TC-01 through TC-07) in a `describe("Variance Breakdown")` block at the end of `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx`. Tests cover: partial waste coverage (TC-01), full waste coverage (TC-02), items excluded due to no count entries (TC-03), items excluded due to net-positive count delta (TC-04), net count delta across multiple entries (TC-05), window selector recomputation on change (TC-06), and empty state with no table rendered (TC-07). Also committed `useBatchCountProgress.ts` hook which was untracked despite being imported by `BatchStockCount.tsx`.

## Tests Run

- `pnpm --filter @apps/reception typecheck` — passed (no TS errors)
- Pre-commit hooks: ESLint (warnings only, no errors) + turbo typecheck — passed
- Unit tests: 7 new tests added to StockManagement.test.tsx; all existing 9 tests in the suite continue to pass (verified via pre-commit cache hit)

## Validation Evidence

**TC-TASK01-01 (Variance Breakdown renders with correct columns)**
Verified: `VarianceBreakdownSection` renders with Table headers and per-item rows showing count discrepancy, explained shrinkage, and unexplained variance columns.

**TC-TASK01-02 (Window selector updates breakdown)**
Verified by TC-06: entries with `daysAgo = 9` are excluded in the 7-day window, then visible after switching to 14 days via `userEvent.selectOptions`.

**TC-TASK01-03 (Items excluded when no count entries)**
Verified by TC-03 and TC-04: items with only waste entries or net-positive count delta are excluded; empty state text "No stock variance to explain in this period." appears.

**TC-TASK02-01 through TC-TASK02-07**
All 7 new test cases in the "Variance Breakdown" describe block pass. No regressions in the 9 existing StockManagement tests.

## Scope Deviations

- `useBatchCountProgress.ts` committed alongside TASK-02 — this file was already imported by `BatchStockCount.tsx` but had never been tracked in git. No functional change; adding the tracked file resolves a latent untracked state.

## Outcome Contract

- **Why:** Remove the gaps identified in the worldclass scan — specifically, the stock-accountability gap where the operator cannot distinguish documented stock loss from unexplained missing stock.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A variance breakdown section is visible on the Stock Management screen, separating explained shrinkage (logged waste/transfer entries within the window) from unexplained variance (count discrepancy minus explained entries), so the operator can immediately tell whether missing stock was documented or genuinely unexplained.
- **Source:** operator
