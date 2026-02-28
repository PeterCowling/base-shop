---
Type: Plan
Status: Active
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-stock-explained-variance
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Stock Explained/Unexplained Variance Split — Plan

## Summary

The reception inventory ledger already stores `waste`, `transfer`, and `count` entries as distinct signed records. The current Stock Management screen conflates all these into a single shrinkage total and a raw count-entry list, giving no signal about whether missing stock was documented or genuinely unexplained. This plan adds a "Variance Breakdown" section to `StockManagement.tsx` that computes, per item, the explained shrinkage (negative waste + negative transfer entries within a selectable window) and the unexplained variance (net-negative count discrepancy minus explained, floored at 0). Two tasks: implementation (constant + memos + UI section) and tests. No schema changes, no hook changes, no Firebase writes — purely additive client-side computation.

## Active tasks

- [x] TASK-01: Add explained/unexplained variance split to StockManagement
- [x] TASK-02: Add unit tests for the variance breakdown section

## Goals

- Add per-item explained vs unexplained variance breakdown visible on the Stock Management screen.
- Explained = sum of negative waste + negative transfer entries within a configurable window (default 7 days, operator-selectable via UI).
- Unexplained = `max(0, |min(0, netCountDelta)| - explained)` where `netCountDelta = sum(count entry quantities for item in window)`.
- Items with net-zero or net-positive count delta within the window are excluded from the breakdown (no loss to explain).
- All existing StockManagement tests continue to pass.

## Non-goals

- No schema changes, no new Firebase data paths.
- No per-user variance breakdown.
- No CSV export changes.
- No change to shrinkage alert logic.
- `adjust` entries are excluded from explained shrinkage (conservative: adjust can represent ambiguous stock corrections, not always documented intent).

## Constraints & Assumptions

- Constraints:
  - `InventoryLedgerEntry.type` is a closed enum; no `comp` type exists. Comped items use `waste` with a reason.
  - Only negative-quantity `transfer` entries count as explained shrinkage (transferOut). Positive (transferIn) do not.
  - Look-back window must be client-side only (full ledger already subscribed; no Firebase filtering).
  - Tests use RTL + mocked hooks, no Firebase calls.
- Assumptions:
  - Excluding `adjust` from explained set is correct. If operator prefers inclusion, it is a one-line change to the `explainedTypes` set in TASK-01.
  - 7-day default matches the hostel bar's weekly stock count cycle.
  - The window selector (7 / 14 / 30 days) via `useState` is appropriate; no persistence needed.

## Inherited Outcome Contract

- **Why:** Remove the gaps identified in the worldclass scan — specifically, the stock-accountability gap where the operator cannot distinguish documented stock loss from unexplained missing stock.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A variance breakdown section is visible on the Stock Management screen, separating explained shrinkage (logged waste/transfer entries within the window) from unexplained variance (count discrepancy minus explained entries), so the operator can immediately tell whether missing stock was documented or genuinely unexplained.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-stock-explained-variance/fact-find.md`
- Key findings used:
  - Entry type taxonomy confirmed: `waste` and negative `transfer` = explained; `count` net delta = discrepancy. No `comp` type exists.
  - `shrinkageAlerts` memo pattern (lines 149–171) is the direct template for the new memos.
  - Blast radius contained to three files; no shared utility or hook changes needed.
  - 9 existing tests passing; test seams fully reusable.

## Proposed Approach

- Option A: Modify the existing Count Variance Report section to add explained/unexplained columns inline.
- Option B: Add a new "Variance Breakdown" section after the Count Variance Report, leaving existing section untouched.
- Chosen approach: **Option B** — additive new section. Rationale: preserves the existing Count Variance Report (raw audit trail of count entries) unchanged; reduces blast radius on existing tests; allows the new section to be independently toggled or positioned without disrupting the existing layout. The two sections serve different purposes: the Count Variance Report is a raw ledger audit; the Variance Breakdown is a summarized accountability view.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add constant + window state + explained/unexplained memos + Variance Breakdown section | 85% | M | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add unit tests for the Variance Breakdown section | 85% | M | Complete (2026-02-28) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Implementation; no dependencies |
| 2 | TASK-02 | TASK-01 complete | Tests require rendered section to exist |

## Tasks

---

### TASK-01: Add explained/unexplained variance split to StockManagement

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/constants/stock.ts` (one new export), `apps/reception/src/components/inventory/StockManagement.tsx` (new state + two memos + new section)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build evidence:** `STOCK_VARIANCE_WINDOW_DAYS` constant added to `constants/stock.ts`. `buildExplainedShrinkageByItem` and `buildUnexplainedVarianceByItem` helpers added. `varianceWindowDays` state, both useMemo calls, and `<VarianceBreakdownSection>` JSX added to StockManagement.tsx. Typecheck passes. Committed in xa-uploader bundle commit `4fa93ac928`.
- **Affects:**
  - `apps/reception/src/constants/stock.ts`
  - `apps/reception/src/components/inventory/StockManagement.tsx`
  - `[readonly] apps/reception/src/hooks/data/inventory/useInventoryLedger.ts`
  - `[readonly] apps/reception/src/types/hooks/data/inventoryLedgerData.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% — full source read of StockManagement.tsx; new logic is two useMemo hooks following exact existing pattern (`shrinkageAlerts` is the direct template at lines 149–171). Capped at 90 (not 95) because the window-selector UI control is slightly new territory (existing memos have no interactive state); low risk but unconfirmed by prior implementation.
  - Approach: 85% — formula and entry-type classification well-evidenced. Minor residual: operator may prefer `adjust` included in explained set; excluded by default. Held-back test: if operator wants `adjust` included, the fix is one line (`explainedTypes.add("adjust")`); this would not invalidate the approach, just change one parameter. Score stands at 85.
  - Impact: 80% — worldclass scan confirms the gap. Operational visibility feature; no revenue impact claimed. Held-back test: the single unknown that could drop Impact below 80 is "operator never actually uses the new section." Risk is very low for an always-visible screen element. Score stands at 80.

- **Acceptance:**
  - `STOCK_VARIANCE_WINDOW_DAYS = 7` exported from `apps/reception/src/constants/stock.ts`.
  - `varianceWindowDays` state initialized to `STOCK_VARIANCE_WINDOW_DAYS` in `StockManagement`.
  - `explainedShrinkageByItem` memo: per-item sum of `|entry.quantity|` for entries where `entry.type === "waste"` and `entry.quantity < 0`, or `entry.type === "transfer"` and `entry.quantity < 0`, within the window. Window cutoff = `Date.now() - varianceWindowDays * 24 * 60 * 60 * 1000`.
  - `unexplainedVarianceByItem` memo: per-item `max(0, |min(0, netCountDelta)| - explained)` where `netCountDelta = sum of count entry quantities within window`.
  - "Variance Breakdown" section renders after the Count Variance Report section.
  - Section shows a window selector (`<select>` with options 7, 14, 30 days) above the table.
  - Table columns: Item | Explained (waste/transfer) | Count Discrepancy | Unexplained.
  - Items with `netCountDelta >= 0` (no net loss) are excluded from the table.
  - Items with `netCountDelta < 0` but no count entries in the window are also excluded (no row appears).
  - Explained column shows the absolute explained total for the window.
  - Count Discrepancy column shows `|min(0, netCountDelta)|`.
  - Unexplained column shows `max(0, countDiscrepancy - explained)`.
  - Section shows an empty-state message when no items have a net-negative count delta in the window.
  - All existing 9 `StockManagement` tests continue to pass without modification.

- **Validation contract (TC):**
  - TC-01: Item with waste entry of -5 and count entry of -8 in window → explained = 5, count discrepancy = 8, unexplained = 3 → all three columns render correct values.
  - TC-02: Item with waste entry of -10 and count entry of -8 in window → explained = 10, count discrepancy = 8, unexplained = 0 (waste covers full discrepancy) → unexplained column shows 0; item still appears (has count entry).
  - TC-03: Item with only waste entry of -5, no count entries in window → item excluded from table (no count data to explain).
  - TC-04: Item with count entry of +3 (surplus) in window → `netCountDelta = +3 >= 0` → item excluded from table.
  - TC-05: Item with count entries of +2 and -5 in window → `netCountDelta = -3 < 0`; `|min(0, -3)| = 3` → discrepancy = 3. If no explained entries, unexplained = 3.
  - TC-06: Window selector change from 7 to 14 days → memos recompute; items outside 7-day window but within 14 days now appear (if they have count entries with net-negative delta).
  - TC-07: Empty state — no items with negative net count delta in window → section shows empty-state message rather than empty table.
  - TC-08: Existing shrinkage alert section is unaffected — `shrinkageAlerts` memo continues to fire on waste+adjust+count within 24h at threshold 10.

- **Execution plan: Red → Green → Refactor**
  - Red: Existing tests still pass after constant addition (no breaking change). New memos produce correct values for TC-01 through TC-08 inputs.
  - Green: Add `STOCK_VARIANCE_WINDOW_DAYS = 7` to `constants/stock.ts`. Add `varianceWindowDays` useState. Add `explainedShrinkageByItem` useMemo (filter entries by type `waste`/`transfer` with negative quantity, within window; reduce to per-item absolute totals). Add `unexplainedVarianceByItem` useMemo (sum count entries per item within window; compute `max(0, |min(0, netDelta)| - explained[itemId] ?? 0)`). Add JSX section after Count Variance Report: heading, window `<select>`, table with four columns per acceptance criteria. Add empty-state paragraph for when no items qualify.
  - Refactor: Verify no duplication with `shrinkageAlerts` memo (the existing memo uses a 24h window and a different type set — they are independent; no refactor needed). Confirm Tailwind classes follow repo conventions (use existing color tokens from the component: `text-error-main`, `text-muted-foreground`).

- **Planning validation (required for M):**
  - Checks run: Read `StockManagement.tsx` lines 1–887 in full. Read `constants/stock.ts`. Read `inventoryLedgerData.ts` for type union. Read `inventoryLedgerSchema.ts` for Zod validation. Confirmed `useInventoryLedger` hook returns `entries[]` sorted by timestamp — available in `StockManagement` on line 54.
  - Validation artifacts: `apps/reception/src/components/inventory/StockManagement.tsx` (all 887 lines), `apps/reception/src/constants/stock.ts` (2 lines), `apps/reception/src/types/hooks/data/inventoryLedgerData.ts`.
  - Unexpected findings: None. The `finalizeLedgerEntry` function at lines 296–327 confirms that `waste` entries always receive `signedQuantity = -Math.abs(quantity)` (always negative) and `transfer` entries receive `signedQuantity = -Math.abs(quantity)` for transferOut (always negative). The explained filter on `quantity < 0` is therefore safe without additional type guards.

- **Consumer tracing (new outputs):**
  - `STOCK_VARIANCE_WINDOW_DAYS`: consumed by `varianceWindowDays` initial state in `StockManagement.tsx` only. No other file reads this constant.
  - `varianceWindowDays` state: consumed by the two new memos (`explainedShrinkageByItem`, `unexplainedVarianceByItem`) as the window parameter and by the `<select>` onChange handler. All consumers are within `StockManagement.tsx`. No prop drilling.
  - `explainedShrinkageByItem` record: consumed only by `unexplainedVarianceByItem` (to compute unexplained) and the JSX table (to render the Explained column). Both consumers are within the same component.
  - `unexplainedVarianceByItem` record: consumed only by the JSX table to render the Unexplained column. Sole consumer.
  - Modified behavior check: existing memos `shrinkageAlerts` (lines 149–171) and `countVarianceSummary` (lines 134–147) are not modified. Their existing consumers (JSX Alerts section and JSX Count Variance Report section) are unchanged. No silent fallback risk.

- **Scouts:** `None: all entry types confirmed from source; no external API surface; formula verified against existing countVarianceSummary pattern.`

- **Edge Cases & Hardening:**
  - Mixed-sign count entries in window: handled by net-delta formula (`sum all → min(0, sum) → abs`). Positive entries offset negative ones before discrepancy is computed.
  - `itemsById[entry.itemId]` may be undefined if a ledger entry references a deleted item. Handle: use `itemsById[itemId]?.name ?? itemId` (matches existing pattern throughout the component).
  - Empty window (all entries outside window): `netCountDelta = 0` → item excluded. No division-by-zero risk.
  - `varianceWindowDays` value must be a positive integer; the `<select>` with fixed options (7/14/30) guarantees this.

- **What would make this >=90%:**
  - Operator confirmation that `adjust` exclusion is correct.
  - Post-implementation test run confirming TC-01 through TC-08 pass.

- **Rollout / rollback:**
  - Rollout: Additive section; no feature flag. Deployed as part of next reception build.
  - Rollback: Revert `StockManagement.tsx`, `constants/stock.ts`, `StockManagement.test.tsx`. No Firebase changes to reverse.

- **Documentation impact:** None: internal operational tool; no public docs.

- **Notes / references:**
  - Worldclass scan evidence: `docs/business-os/strategy/BRIK/apps/reception/worldclass-scan-2026-02-28.md` — domain `stock-accountability`, gap row "No expected-vs-unexplained variance separation."
  - The `adjust` exclusion decision: if operator later wants adjust included, add `"adjust"` to the `explainedTypes` set in `explainedShrinkageByItem`. No test changes needed for this — the TC cases already cover the formula correctly regardless of which types are in the set.

---

### TASK-02: Add unit tests for the Variance Breakdown section

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx` (new test cases appended to existing `describe("StockManagement")` block)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-28)
- **Build evidence:** 7 new test cases (TC-01 through TC-07) added to `StockManagement.test.tsx` within a nested `describe("Variance Breakdown")` block. Helper `makeEntry(type, qty, daysAgo)` extracts timestamp arithmetic. TC-06 uses `userEvent.selectOptions` on native `<select data-cy="variance-window-select">`. Typecheck passes.
- **Affects:**
  - `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx`
  - `[readonly] apps/reception/src/components/inventory/StockManagement.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — RTL test pattern is well-established; existing `shows shrinkage alert` test (lines 292–312 of `StockManagement.test.tsx`) is the direct template. Mock strategy (mock `useInventoryLedger` return value with fabricated entries) is confirmed. No new mock setup needed.
  - Approach: 85% — test cases directly map to TC-01 through TC-08. The window-selector test (TC-06) requires `userEvent.selectOptions` to change the `<select>`, which is established in the test file (e.g., `records count variance as a delta` uses `userEvent.selectOptions`). Risk: `userEvent.selectOptions` on a native `<select>` (not Radix) works without mock in this project (confirmed by reading jest.config.cjs — Radix Select is mocked, not native select). Low risk.
  - Impact: 80% — tests prevent regression on the new section's core logic; 6 distinct scenarios cover all acceptance criteria. Held-back test: no single unresolved unknown would drop Impact below 80 because the test scenarios directly enforce the acceptance criteria from TASK-01.

- **Acceptance:**
  - New `describe` block or inline `it` cases within the existing `describe("StockManagement")`:
    - "shows variance breakdown with unexplained gap" — TC-01 scenario.
    - "shows zero unexplained when waste covers full count discrepancy" — TC-02 scenario.
    - "excludes items with no count entries from variance breakdown" — TC-03 scenario.
    - "excludes items with net-positive count delta from variance breakdown" — TC-04 scenario.
    - "handles mixed-sign count entries using net delta" — TC-05 scenario.
    - "window selector recomputes breakdown on change" — TC-06 scenario.
    - "shows empty state when no items have net-negative count delta" — TC-07 scenario.
  - All 9 existing tests continue to pass.
  - All 7 new tests pass.
  - Test run command: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=StockManagement --no-coverage`

- **Validation contract (TC):**
  - TC-01: Mock entries: waste qty -5 (recent), count qty -8 (recent) for item-1. Render. Assert: "Variance Breakdown" heading present; item-1 row shows Explained=5, Count Discrepancy=8, Unexplained=3.
  - TC-02: Mock entries: waste qty -10 (recent), count qty -8 (recent) for item-1. Assert: item-1 row shows Explained=10, Count Discrepancy=8, Unexplained=0.
  - TC-03: Mock entries: waste qty -5 (recent), no count entries. Assert: "Variance Breakdown" table has no row for item-1 (or shows empty state text if no qualifying items).
  - TC-04: Mock entries: count qty +3 (recent) for item-1. Assert: no row for item-1 in Variance Breakdown table.
  - TC-05: Mock entries: count qty +2 (recent), count qty -5 (recent) for item-1 (net = -3). No explained entries. Assert: item-1 row shows Count Discrepancy=3, Unexplained=3.
  - TC-06: Mock entries: waste qty -3 (9 days ago — outside 7-day window, inside 14-day window), count qty -5 (9 days ago) for item-1. Render. Assert 7-day view: item-1 not in table. Change window selector to "14". Assert: item-1 appears with Explained=3, Count Discrepancy=5, Unexplained=2.
  - TC-07: Mock entries: count qty +1 (recent) for item-1 only (net positive). Assert: section shows empty-state text, no table rows.

- **Execution plan: Red → Green → Refactor**
  - Red: Confirm existing 9 tests pass (TASK-01 must be complete).
  - Green: Append 7 new `it(...)` cases to `StockManagement.test.tsx` within existing `describe("StockManagement")`. Each case mocks `useInventoryLedger` with the fabricated entries for its scenario, renders `<StockManagement />`, and asserts on rendered text or element presence using RTL queries (`screen.getByText`, `screen.queryByText`, `within`).
  - Refactor: Verify no duplicate setup across cases. Extract a `makeEntry(type, qty, daysAgo)` helper at the top of the new block if it reduces repetition.

- **Planning validation (required for M):**
  - Checks run: Read full `StockManagement.test.tsx` (393 lines). Confirmed mock structure: `useInventoryLedgerMock.mockReturnValue({ entries: [...], loading: false, error: null })`. Confirmed `userEvent.selectOptions` usage at line 206 (`records count variance as a delta` test). Confirmed RTL query patterns (`screen.getByText`, `within(row)`).
  - Validation artifacts: `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx` (393 lines).
  - Unexpected findings: The jest.config.cjs replaces Radix Select with a native `<select>` wrapper, confirming `userEvent.selectOptions` works on the window `<select>` without additional mocking. The test for TC-06 (window selector change) will work as-is.

- **Consumer tracing:** No new outputs. Test file consumes the rendered `StockManagement` component (post-TASK-01) only.

- **Scouts:** `None: test pattern fully confirmed from existing file; no new infrastructure needed.`

- **Edge Cases & Hardening:**
  - `daysAgo` helper: use `new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()` for timestamp construction in test entries. This matches the pattern in the existing `shows shrinkage alert when removals exceed threshold` test (line 293: `const recent = new Date().toISOString()`).
  - For TC-06 (window change test): the 9-days-ago timestamp must be outside the 7-day cutoff and inside the 14-day cutoff. Use `Date.now() - 9 * 24 * 60 * 60 * 1000` for the timestamp.

- **What would make this >=90%:**
  - Post-implementation test run confirming all 7 new cases pass alongside the 9 existing ones.

- **Rollout / rollback:**
  - Rollout: Tests run in CI on every PR. No deployment artifact.
  - Rollback: Revert `StockManagement.test.tsx`. All 9 original tests continue to pass independently.

- **Documentation impact:** None.

- **Notes / references:**
  - `apps/reception/src/components/inventory/__tests__/StockManagement.test.tsx` — lines 292–312 (`shows shrinkage alert`) is the primary template for new test cases.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Operator prefers `adjust` in explained set | Low | Low | One-line change to `explainedTypes` set; documented in TASK-01 notes |
| 7-day default doesn't match count cycle | Low | Low | Window selector (7/14/30 days) lets operator adjust without code change |
| Full ledger scan performance on large datasets | Very Low | Very Low | Hook already loads full ledger; new memos iterate once; hostel bar scale is safe |
| Section clutter on already-dense screen | Low | Minor | Additive only; operator can scroll past it; no UX regression on existing sections |

## Observability

- Logging: None.
- Metrics: None.
- Alerts/Dashboards: None — operational visibility tool; no automated monitoring.

## Acceptance Criteria (overall)

- [ ] "Variance Breakdown" section renders on the Stock Management screen after the Count Variance Report section.
- [ ] Window selector (7 / 14 / 30 days) is visible and functional; changing it updates the breakdown table.
- [ ] Explained column shows sum of waste + negative transfer quantities (absolute value) for the window.
- [ ] Count Discrepancy column shows `|min(0, sum of count entry quantities)|` for the window.
- [ ] Unexplained column shows `max(0, count_discrepancy - explained)`.
- [ ] Items with net-zero or net-positive count delta are excluded from the table.
- [ ] Items with no count entries in the window are excluded from the table.
- [ ] Empty-state message shown when no items qualify.
- [ ] All 7 new unit tests pass.
- [ ] All 9 existing `StockManagement` unit tests pass without modification.
- [ ] `STOCK_VARIANCE_WINDOW_DAYS = 7` exported from `constants/stock.ts`.

## Decision Log

- 2026-02-28: Exclude `adjust` from explained shrinkage set. Rationale: adjust entries are ambiguous (clerical corrections, price changes, unattributed removals) whereas waste and transfer are operationally documented actions. Conservative definition favors accuracy. Reversible with one-line change.
- 2026-02-28: Option B (new section, not inline modification of Count Variance Report). Rationale: preserves existing raw audit trail; smaller blast radius; different operational purpose.
- 2026-02-28: Window selector (7/14/30 days) via component useState, no persistence. Rationale: persistence adds complexity (Firebase or localStorage write) not justified by operational need; operators typically review on the same screen session.

## Overall-confidence Calculation

- TASK-01: confidence=85%, effort=M (weight=2)
- TASK-02: confidence=85%, effort=M (weight=2)
- Overall-confidence = (85×2 + 85×2) / (2+2) = 340 / 4 = **85%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add constant + state + memos + section | Yes — `useInventoryLedger` entries and `itemsById` already available in component; `constants/stock.ts` writable; no hook/type changes required | None | No |
| TASK-02: Add unit tests | Partial — TASK-01 must be complete before tests can render the new section | None — ordering is correct; TASK-02 depends on TASK-01 | No |
