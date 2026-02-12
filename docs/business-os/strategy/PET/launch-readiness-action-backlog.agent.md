---
Type: Action-Backlog
Status: Active
Business: PET
Region: Italy
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Source: docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.agent.md
---

# PET Launch Readiness Action Backlog

## Objective

Convert forecast controls into concrete execution work that improves odds of profitable 90-day launch outcomes.

## P0 (Do Now, Before Scale)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| PET-P0-01 | Build daily KPI scoreboard | Without daily measurement, gates are non-actionable | Dashboard tracks sessions, orders, CVR, CAC, refund rate, payment success, on-time ship by day | Growth/Ops |
| PET-P0-02 | Run checkout reliability test pack | Payment failures silently kill conversion | >=20 successful end-to-end test orders across top devices/payment methods | Growth |
| PET-P0-03 | Lock per-order contribution model from real costs | Forecast margin can be wrong by double digits | Real fulfillment/payment/returns/shipping costs entered; contribution/order updated weekly | Finance/Ops |
| PET-P0-04 | Define inventory-cap protocol | Prevent overselling and bad CAC decisions | Inventory cap in forecast; traffic throttling rule documented when stock <14 days | Ops |
| PET-P0-05 | Set gate ownership map | Failed gates need fast remediation ownership | Each gate mapped to named owner + 48h response + 7-day re-test SLA | Pete |

## P1 (Week 1-2, Conversion and CAC Levers)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| PET-P1-01 | PDP trust pack v1 | New store conversion depends on trust clarity | PDP includes delivery ETA, return policy, dimensions, use demo, social proof hooks | Growth |
| PET-P1-02 | Offer test matrix (3 cells) | Price/offer elasticity is unknown | Run 3 controlled offer cells for 7 days; identify best contribution-adjusted winner | Growth |
| PET-P1-03 | Creative factory cadence | CAC depends on creative velocity | Ship >=10 creatives/week; prune bottom quartile every 72h | Growth |
| PET-P1-04 | Retargeting-first media setup | Cold-only acquisition is margin-destructive early | Campaign structure includes warm retargeting baseline and spend caps | Growth |
| PET-P1-05 | Shipping SLA recovery plan | Ops gate fail (synthetic) is biggest scale blocker | If on-time ship <95%, implement carrier fallback + dispatch cutoff fix in 7 days | Ops |

## P2 (Week 2-4, De-risk and Expand)

| ID | Action | Why it matters | Acceptance criteria | Owner |
|---|---|---|---|---|
| PET-P2-01 | Add variance-aware gate logic | Low sample weeks can trigger false pass/fail | Weekly gate report includes denominator + confidence band notes | Growth |
| PET-P2-02 | Build refund reason taxonomy | Refund rate without reasons is not fixable | 100% refunds tagged into root-cause categories with weekly action log | Ops |
| PET-P2-03 | Bundle readiness check for bags | Bundle can raise AOV and repeat | Supplier, compliance, margin, and lead-time checks complete | Sourcing |
| PET-P2-04 | Creator/affiliate pilot | Reduce paid CAC dependency | 5 partner test deals live, each with trackable code/link | Growth |

## Decision Triggers

- Trigger scale-up: all week-2 gates pass and denominator validity thresholds are met.
- Trigger hold/fix: any gate fails or denominator thresholds are not met.
- Trigger wf-replan: two consecutive weekly gate failures on the same metric.

## Next Review

- Review date: 2026-02-18
- Required evidence package:
  - Daily KPI export
  - Gate status table
  - Cost model sheet
  - Active experiment register
