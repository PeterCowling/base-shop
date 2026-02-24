---
Type: Forecast-Summary
Status: Draft
Business: HEAD
Region: TBD
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Source: docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v1.user.md
Review-trigger: After each completed build cycle touching this document.
---

# HEAD Launch (90 Days) - Executive Cut

## 1) Decision

Launch HEAD SKU1 on own-site with paid used for learning + retargeting first. Scale only when week-2 gates pass.

## 2) 90-Day Targets (Proposal)

- Primary target: `>= 90 orders` in 90 days.
- Guardrail target: blended CAC must stay within contribution capacity.
- Operational target: on-time shipping `>= 95%`, payment success `>= 97%`.

## 3) Scenario Snapshot (v1 Model)

| Scenario | Orders | Net Revenue (ex VAT) | Contribution After Ads |
|---|---:|---:|---:|
| P10 | 25 | EUR 492 | EUR -278 |
| P50 | 130 | EUR 2,877 | EUR -62 |
| P90 | 388 | EUR 9,223 | EUR 1,658 |

Interpretation:
- P10 and P50 are weak after ads under current assumptions.
- P90 is positive but depends on stronger conversion/efficiency.
- Value proposition and unit economics are the key levers, not ad scale alone.

## 4) Mandatory Week-2 Go/No-Go Gates

Scale only if all are true:

1. CVR (7-day trailing) `>= 1.1%`
2. Blended CAC `<= 75%` of observed contribution per order (pre ads)
3. Refund rate `<= 9%`
4. On-time ship rate `>= 95%`
5. Payment success rate `>= 97%`

Gate validity thresholds:

- CVR decision-valid only with `sessions >= 500` and `orders >= 10`
- Refund decision-valid only with `orders_shipped >= 25`
- Payment decision-valid only with `payment_attempts >= 100`

If any fail, move to fix-first mode:

- hold cold scale
- keep retargeting
- fix PDP/offer/checkout friction
- assign owner in 48h and re-test failed gate in 7 days

## 5) Top Risks

- Unclear product differentiation suppresses conversion.
- Returns from fit/comfort mismatch can erase margin.
- CAC can exceed sustainable contribution quickly at low AOV.
- Weak fulfillment reliability can block scale despite demand.

## 6) What Must Be Confirmed This Week

1. Region and channel assumptions for launch.
2. Real per-order variable costs and landed COGS.
3. Observed CPC/CVR replacing priors.
4. Final CAC ceiling from actual contribution/order.

## 7) Decision Rule

- If week-2 gates pass: continue and scale cautiously.
- If week-2 gates fail: do not scale; run a 2-week fix sprint and recalculate.
