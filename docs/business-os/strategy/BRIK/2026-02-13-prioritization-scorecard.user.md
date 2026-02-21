---
Type: Prioritization-Scorecard
Status: Active
Business: BRIK
Date: 2026-02-13
Owner: Pete
Seed-Source: docs/business-os/startup-baselines/BRIK-forecast-seed.user.md
---

# BRIK Prioritization Scorecard

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
| Complete GA4 UI event verification + lock first 7-day KPI baseline | 5 | 5 | 4 | 4 | 5 | 5 | 28 | P1 |
| Implement booking policy/fee clarity + mobile performance hardening | 5 | 4 | 4 | 3 | 5 | 5 | 26 | P1 |
| Implement cancellation reason coding and reach >=90% coverage | 5 | 4 | 4 | 3 | 5 | 5 | 26 | P1 |
| Run day-14 gate review and publish first forecast recalibration | 4 | 4 | 4 | 4 | 4 | 5 | 25 | P2 |
| Launch member-rate cohort test with margin guardrails | 4 | 3 | 3 | 3 | 4 | 5 | 22 | P2 |

## C) Top Backlog (P1/P2/P3)

| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | GA4 event verification + 7-day baseline lock | All scale/re-prioritization decisions depend on measured conversion truth | `web_vitals`, `begin_checkout`, and booking-confirmation event checks are verified; first 7-day KPI baseline is persisted in `plan.user.md` | GA4 property access + production capture | `2026-02-13-measurement-verification.user.md`, `BRIK-forecast-seed.user.md` |
| P1 | Policy/fee clarity + booking-step performance hardening | Fastest conversion-quality and trust improvement lever | Policy/fee block shipped on booking-critical routes; booking-step p75 <=2.5s sustained for 7 days | UI implementation + performance instrumentation | `2026-02-12-upgrade-brief.user.md`, `2026-02-13-startup-loop-90-day-forecast-v1.user.md` |
| P1 | Cancellation reason coding instrumentation | Required to improve realized value and validate margin assumptions | >=90% cancellation events coded with standardized reasons and reviewed weekly | Event taxonomy + ops workflow | `2026-02-13-startup-loop-90-day-forecast-v1.user.md`, `BRIK-forecast-seed.user.md` |
| P2 | Day-14 gate review + forecast recalibration artifact | Converts first observed data into actionable keep/pivot thresholds | Recalibration doc published with revised P10/P50/P90 and explicit Keep/Pivot/Scale recommendation | 14-day observed KPI pack | `2026-02-13-startup-loop-90-day-forecast-v1.user.md` |
| P2 | Member-rate cohort test with margin guardrails | Supports direct-share target but should follow baseline lock | One controlled member-rate cohort run; conversion and margin delta reported against control | Offer module + tracking integrity | `2026-02-12-market-intelligence.user.md`, `2026-02-12-upgrade-brief.user.md` |

## D) Deferred Items and Rationale

- Full S6B channel strategy artifact (defer until day-14 measured baseline is locked and S5 top P1 tasks are complete).
- Community/social booking-assist lane (defer until core conversion and cancellation-control signals stabilize).

## E) Execution Recommendation

Run `lp-do-fact-find -> lp-do-plan -> lp-do-build` first on:
1. GA4 event verification + first 7-day KPI baseline lock.
2. Policy/fee clarity + booking-step performance hardening.
3. Cancellation reason coding instrumentation and weekly reporting.
