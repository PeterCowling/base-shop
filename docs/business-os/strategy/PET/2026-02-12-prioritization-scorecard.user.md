---
Type: Prioritization-Scorecard
Status: Active
Business: PET
Date: 2026-02-12
Owner: Pete
Seed-Source: docs/business-os/startup-baselines/PET-forecast-seed.user.md
---

# PET Prioritization Scorecard

## A) Scoring Rubric

Scale: 0-5 per criterion.

- Outcome impact
- Speed to value
- Confidence
- Dependency complexity (inverse: higher score = lower complexity)
- Risk if delayed
- Validation leverage

## B) Scored Item Table

| Item | Impact | Speed | Confidence | Dependency | Delay risk | Validation leverage | Weighted score | Priority |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Launch pre-website conversion surface with instrumentation | 5 | 5 | 4 | 4 | 5 | 5 | 28 | P1 |
| Run week-1 price + messaging tests with pass/fail thresholds | 5 | 4 | 3 | 3 | 5 | 5 | 25 | P1 |
| Validate ops gates (payment success, ship SLA, return reasons) | 5 | 4 | 4 | 3 | 5 | 4 | 25 | P1 |
| Week-2 recalibration and re-forecast remaining 10 weeks | 4 | 3 | 4 | 3 | 4 | 5 | 23 | P2 |

## C) Top Backlog (P1/P2/P3)

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Pre-website conversion surface + instrumentation | Converts intent into measurable signal fast | Conversion surface live, funnel metrics captured daily | Product availability + checkout path | `PET-forecast-seed.user.md` |
| P1 | Week-1 price/messaging test matrix | Determines WTP and best-performing angle | At least 2 price variants and 2 message variants tested with daily readout | Product media + traffic source | `2026-02-12-upgrade-brief.user.md` |
| P1 | Ops gate validation | Prevents scaling broken flows | Payment success, ship SLA, and return reason tracking reviewed daily | Ops process owner + reporting | `italy-90-day-launch-forecast-v2.user.md` |
| P2 | Week-2 recalibration | Replaces assumptions with observed economics | Recalibration doc published with updated scenarios and decision posture | Week-1 observed data | `italy-90-day-launch-forecast-v2.user.md` |

## D) Deferred Items and Rationale

- Loyalty mechanics (defer until repeat baseline exists).
- Expanded multi-channel rollout (defer until conversion and reliability gates pass).

## E) Execution Recommendation

Run `lp-fact-find -> lp-plan -> lp-build` first on:
1. Pre-website conversion surface + instrumentation.
2. Week-1 price/messaging test matrix with explicit pass/fail thresholds.
