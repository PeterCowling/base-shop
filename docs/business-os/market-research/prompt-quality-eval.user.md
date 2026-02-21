---
Type: Prompt-Quality-Eval
Status: Active
Domain: Business-OS
Created: 2026-02-15
Last-reviewed: 2026-02-15
Owner: Operator
---

# S2 Market Intelligence Prompt Quality Evaluation (Manual Rubric)

Purpose: prevent regressions in S2 (Market Intelligence) Deep Research prompt generation by scoring prompts against a small, repeatable rubric.

Run cadence: once per release that touches S2 prompt generation (or templates).

## Golden Businesses

Run the rubric on the generated prompt for each business:
- BRIK
- HEAD
- PET

## How To Run

1. Generate (or re-generate) each business prompt for the same as-of date:
   - Command: `pnpm exec tsx scripts/src/startup-loop/s2-market-intelligence-handoff.ts -- --business <BIZ> --as-of YYYY-MM-DD --owner <NAME>`
2. Open the generated prompt file:
   - Path: `docs/business-os/market-research/<BIZ>/YYYY-MM-DD-deep-research-market-intelligence-prompt.user.md`
3. Score using the rubric below and record results in a short note (append to this doc under "Runs").

## Rubric (0/1/2)

Scoring:
- 0 = missing or ambiguous (model can produce generic/shallow output)
- 1 = present but incomplete (good direction, some gaps)
- 2 = present and enforceable (prompt forces decision-grade output)

Criteria:
- Business model coherence:
  - Does the prompt force explicit business model classification and handle ambiguity with a 14-day test?
- Delta spine:
  - Are Delta Q1-Q3 the organizing spine (asked early; repeated; sections clearly map back)?
- Comparable competitor benchmarking:
  - Are competitor minimum counts present, and is pricing benchmark standardized with explicit scenarios + date rules + comparability rules?
- Website-live operationalization:
  - For website-live, does the prompt include an explicit funnel audit path and a measurement repair plan (and block when URL/baselines are missing)?

Pass/Fail rule:
- FAIL if any criterion scores 0 for BRIK.
- FAIL if 2+ criteria score 0 for any golden business.

## Runs

Append entries like:

```text
YYYY-MM-DD:
- BRIK: {model=2, delta=2, benchmark=2, website=2} -> PASS
- HEAD: {model=1, delta=1, benchmark=0, website=0} -> FAIL (explain)
- PET:  {model=2, delta=1, benchmark=1, website=1} -> PASS
Notes:
- <one line on what regressed and where to fix>
```

2026-02-15:
- BRIK: {model=2, delta=2, benchmark=2, website=2} -> PASS (updated template adds fixed scenario dates + parity sub-test; generator injects dates deterministically)
- HEAD: BLOCKED (missing monthly exports: `net_value_by_month.csv` and `bookings_by_month.csv`)
- PET: BLOCKED (missing monthly exports: `net_value_by_month.csv` and `bookings_by_month.csv`)
Notes:
- HEAD/PET are still pre-baseline for website-live market intelligence prompts; re-add to golden set when monthly exports exist or when S2 supports pre-website without export requirements.
