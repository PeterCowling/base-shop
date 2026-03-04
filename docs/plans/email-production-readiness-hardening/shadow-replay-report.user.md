# Shadow Replay Report — Email Refinement Parity

- Started: 2026-03-02T15:55:54.517Z
- Finished: 2026-03-02T15:55:55.050Z
- Input: `/Users/petercowling/base-shop/.agents/private/email-sample-stage-1.txt`
- Limit: 30

## Outcome

- Total rows loaded: 30
- Rows processed: 30
- Processing errors: 0
- Baseline quality pass count: 18
- Deterministic quality pass count: 18
- Regressions (deterministic worse than baseline): 0
- Hard-rule protected-category violations: 0

## Acceptance Checks

- No quality regressions: PASS
- No protected-category mutations: PASS
- No processing errors: PASS

## Category Breakdown

| Category | Total | Regressions |
|---|---:|---:|
| general | 13 | 0 |
| cancellation | 6 | 0 |
| transportation | 3 | 0 |
| employment | 3 | 0 |
| payment | 2 | 0 |
| breakfast | 2 | 0 |
| policies | 1 | 0 |

## Regression Samples

- None

## Processing Errors

- None

## Notes

- Baseline path = `draft_refine` with `refinement_mode: external` and identity candidate.
- Deterministic path = `draft_refine` with `refinement_mode: deterministic_only`.
- Regression definition: baseline passes but deterministic fails, or deterministic has more failed checks.
- Protected categories checked: `prepayment`, `cancellation`.

