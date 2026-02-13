---
Type: Prioritization-Scorecard
Status: Active
Business: HEAD
Date: 2026-02-12
Owner: Pete
Seed-Source: docs/business-os/startup-baselines/HEAD-forecast-seed.user.md
---

# HEAD Prioritization Scorecard

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
| Launch analytics + payment reliability baseline | 5 | 5 | 4 | 4 | 5 | 5 | 28 | P1 |
| Publish compatibility/fit guidance and assisted support path | 5 | 4 | 4 | 3 | 5 | 4 | 25 | P1 |
| Run capped week-1 acquisition experiment with daily CAC/CVR reviews | 4 | 4 | 3 | 3 | 4 | 5 | 23 | P1 |
| Week-2 recalibration decision and re-forecast remaining 10 weeks | 4 | 3 | 4 | 3 | 4 | 5 | 23 | P2 |

## C) Top Backlog (P1/P2/P3)

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | Analytics + payment reliability baseline | Required for all downstream decisions | End-to-end events and payment success metrics available and reviewed daily | Checkout + analytics hooks | `HEAD-forecast-seed.user.md` |
| P1 | Compatibility/fit guidance + support path | Reduces wrong-buy/return risk | Compatibility guide live and linked from PDP; support route visible | Compatibility matrix confirmation | `2026-02-12-upgrade-brief.user.md` |
| P1 | Week-1 acquisition experiment (capped) | Needed to convert assumptions into observed data | Daily CAC/CVR report produced for 7 days with capped spend | Inventory + pricing + payment readiness | `headband-90-day-launch-forecast-v2.user.md` |
| P2 | Week-2 recalibration | Converts first data into updated decision | Recalibrated forecast doc published with Keep/Pivot recommendation | Week-1 observed data | `headband-90-day-launch-forecast-v2.user.md` |

## D) Deferred Items and Rationale

- Jewellery add-on lane (defer until core headband conversion is stable).
- Provider/clinic expansion lane (defer until base funnel reliability is established).

## E) Execution Recommendation

Run `lp-fact-find -> lp-plan -> lp-build` first on:
1. Analytics + payment reliability baseline.
2. Compatibility/fit guidance and support path.
