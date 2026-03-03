---
Type: Outcome-Contract
Status: Active
Business: HEAD
Created: 2026-02-19
Updated: 2026-02-20
Last-reviewed: 2026-02-21
Owner: Pete
business: HEAD
artifact: outcome_contract
status: Active
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/startup-baselines/HEAD-2026-02-12assessment-intake-packet.user.md
  - docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md
  - docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md
  - docs/business-os/startup-baselines/HEAD-offer.md
decisions:
  - DEC-HEAD-01
  - DEC-HEAD-CH-01
---

# HEAD Outcome Contract (Canonical)

This file is the single authoritative outcome contract for HEAD. Other HEAD artifacts may reference this contract but must not redefine target/CAC contract values.

## Contract Identity

- Outcome-ID: `HEAD-OUT-2026Q1-01`
- Decision Link: `DEC-HEAD-01`
- Contract window: 90 days
- Contract by date: 2026-05-13

## Outcome Statement

Achieve first reliable direct sales for HEAD in Italy, then stabilize weekly sales with controlled CAC and returns.

## Baseline (2026-02-12)

- Net orders: 0
- Net revenue: EUR 0
- Blended CAC: unmeasured
- Return rate: unmeasured

## Targets (by 2026-05-13)

- Net orders: 110
- Net revenue: EUR 2,000
- Blended CAC: <= EUR 10 by day 60-90
- Return rate: < 3%

## Weekly Leading Indicators

| Indicator | Definition | Guardrail |
|---|---|---|
| Sessions (all channels) | Total tracked sessions | >=500 sessions by week 4 |
| Sitewide CVR (7-day trailing) | Orders / sessions | >=1.4% target; 0.9% floor |
| Paid CAC (7-day trailing) | Paid spend / paid orders | <=EUR 25 by week 6; <= gross profit/order always |
| Blended CAC (7-day trailing) | Paid spend / all orders | <=EUR 15 by week 4; <=EUR 10 by week 8+ |
| Payment success rate | Successful payments / payment attempts | >=97% (decision-valid at >=100 attempts) |
| Return rate (30-day trailing) | Returned orders / shipped orders | <3% (decision-valid at >=25 shipped orders) |

## Kill / Pivot Thresholds

1. If paid CAC is above observed gross profit/order for 7 consecutive days, pivot to retargeting-only acquisition.
2. If sitewide CVR is below 0.9% after >=500 sessions in a 7-day window, stop spend expansion and run conversion fixes first.
3. If return rate reaches 3% or above after >=25 shipped orders, hold growth and remediate compatibility/fit issues before re-scaling.
4. If payment success drops below 97% after >=100 attempts, pause traffic increases until checkout reliability recovers.
