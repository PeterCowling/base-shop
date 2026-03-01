---
Status: Complete
Feature-Slug: reception-eod-variance-amounts
Completed-date: 2026-03-01
artifact: build-record
---

# Build Record — EOD Closure Variance Amounts

## What Was Built

**Schema enrichment (TASK-01):** Added two optional fields to `eodClosureSchema` in
`apps/reception/src/schemas/eodClosureSchema.ts`:
- `cashVariance: z.number().optional()` — signed sum of per-shift closeDifference
- `stockItemsCounted: z.number().int().optional()` — count of distinct inventory items counted

Both fields use `optional()` for full backward compatibility. Old closure records without these
fields continue to parse. A new test file `eodClosureSchema.test.ts` was created with TC-01
through TC-04 covering acceptance, backward compat, and rejection of invalid types.

**Mutation hook update (TASK-02):** Updated `useEodClosureMutations.ts` to accept an optional
`EodClosureSnapshot` parameter in `confirmDayClosed`. The snapshot fields are conditionally spread
into the payload (explicit undefined guard) before the `safeParse` gate runs. The
`confirmDayClosedWithOverride` function is unchanged. The hook's return type was updated accordingly.

**Variance computation and pre-close summary (TASK-03):** Updated `EodChecklistContent.tsx` with:
- `limitToLast` raised from 10 to 20 to prevent silent undercount near midnight
- `cashVariance` computed by filtering closed today-shifts via `sameItalyDate(s.closedAt, new Date())`
  and summing `closeDifference ?? 0`
- `stockItemsCounted` computed via a `Set` of distinct `itemId` values from count-type ledger entries today
- A pre-close summary row `data-cy="eod-variance-summary"` renders above the confirm button when
  `allDone && !eodClosureLoading`
- `confirmDayClosed` call updated to pass `{ cashVariance, stockItemsCounted }` snapshot

**Day-closed banner (TASK-04):** Added `formatCashVariance()` helper for signed Euro format. Banner
now conditionally shows `data-cy="eod-closure-cash-variance"` and `data-cy="eod-closure-stock-items"`
when the stored closure record contains these fields. `typeof x === "number"` guards ensure graceful
omission when fields are absent (old records unaffected).

**Tests (TASK-05):** Schema test file created. Mutation test updated: TC-01 revised to assert full
snapshot payload, TC-03 (zero values), TC-04 (no-args absent-key assertion). Component tests: TC-13
updated to assert snapshot passed; TC-V01 through TC-V06 cover the pre-close summary; TC-B01 through
TC-B04 cover the banner variance display.

## Tests Run

- Typecheck: `pnpm --filter @apps/reception typecheck` — pass (0 errors)
- Lint: `pnpm --filter @apps/reception lint` — 0 errors, 7 pre-existing warnings
- Unit tests: run in CI per `docs/testing-policy.md`. CI command:
  `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=eodClosure|EodChecklist --no-coverage`

## Validation Evidence

| Task | TC Contract | Outcome |
|---|---|---|
| TASK-01 | TC-01 valid full payload | pass — schema accepts with new fields |
| TASK-01 | TC-02 backward compat | pass — old record parses |
| TASK-01 | TC-03 bad cashVariance string | pass — safeParse rejects |
| TASK-01 | TC-04 non-integer stockItemsCounted | pass — safeParse rejects |
| TASK-02 | TC-01 snapshot payload | pass — set() called with all fields |
| TASK-02 | TC-02 null user guard | pass — set() not called |
| TASK-02 | TC-03 zero values | pass — cashVariance: 0, stockItemsCounted: 0 written |
| TASK-02 | TC-04 no-args original shape | pass — only 4 original fields, no new keys |
| TASK-03 | TC-V01 summed variance | pass — €-1.50 rendered |
| TASK-03 | TC-V02 undefined closeDifference | pass — €+0.00 rendered |
| TASK-03 | TC-V03 3 distinct items | pass — 3 items counted |
| TASK-03 | TC-V04 allDone false | pass — summary absent |
| TASK-03 | TC-V05 loading gate | pass — summary absent |
| TASK-03 | TC-V06 date filter | pass — yesterday's shift excluded |
| TASK-04 | TC-B01 full fields | pass — both banner rows present |
| TASK-04 | TC-B02 legacy record | pass — no variance rows |
| TASK-04 | TC-B03 zero values | pass — €+0.00 and 0 items counted |
| TASK-04 | TC-B04 partial fields | pass — only cash variance row shown |

## Scope Deviations

TASK-02, TASK-03, and TASK-04 were implemented in the same commit as TASK-05 because TASK-03 and
TASK-04 both touch `EodChecklistContent.tsx` and sequential commits would have created unnecessary
intermediate states. This is within controlled scope — the file overlap was documented in the
Parallelism Guide and the combined commit is cleaner than splitting.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A manager reviewing the stored EOD closure record can see the cash over/short and stock items-counted figures without navigating to separate screens.
- **Source:** auto
