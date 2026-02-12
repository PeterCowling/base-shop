---
Type: Forecast-Summary
Status: Draft
Business: PET
Region: Italy
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Source: docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md
---

# PET Italy Launch (90 Days) - Executive Cut

## 1) Decision

Launch SKU1 on own-site in Italy now, with paid used for learning and retargeting first. Scale only when week-2 gates pass.

## 2) 90-Day Targets (Proposal)

- Primary target: `>= 120 orders` in 90 days.
- Guardrail target: blended CAC must remain below contribution capacity.
- Operational target: on-time shipping `>= 95%` and payment success `>= 97%`.

## 3) Scenario Snapshot (v2 Model)

| Scenario | Orders | Net Revenue (ex VAT) | Contribution After Ads |
|---|---:|---:|---:|
| P10 | 40 | EUR 1,016 | EUR -28 |
| P50 | 178 | EUR 4,815 | EUR 1,011 |
| P90 | 483 | EUR 13,857 | EUR 4,841 |

Interpretation:
- P10 is near break-even/loss after ads.
- P50 is viable but sensitive to CAC and refunds.
- P90 is attractive but inventory-limited unless stock is confirmed.

## 4) Mandatory Week-2 Go/No-Go Gates

Scale only if all are true:

1. CVR (7-day trailing) `>= 1.2%`
2. Blended CAC `<= 70%` of observed contribution per order (pre ads)
3. Refund rate `<= 8%`
4. On-time ship rate `>= 95%`
5. Payment success rate `>= 97%`

Gate validity thresholds:
- CVR decision-valid only with `sessions >= 500` and `orders >= 10`
- Refund decision-valid only with `orders_shipped >= 25`
- Payment decision-valid only with `payment_attempts >= 100`

If any fail, move to fix-first mode:

- hold cold scale
- keep retargeting
- fix PDP/checkout/trust frictions
- re-forecast remaining 10 weeks from observed data
- assign named owner within 48 hours and re-test failed gate within 7 days

## 5) Top Risks

- CAC inflation can erase margin at low AOV.
- Conversion underperformance can make spend non-recoverable.
- Returns and shipping execution can quickly break contribution.
- Inventory uncertainty can cap realized upside.

## 6) What Must Be Confirmed This Week

1. Inventory units on-hand + in-transit by ETA.
2. Real per-order variable costs (fulfillment, payment, returns reserve, shipping subsidy).
3. Live observed CPC/CVR to replace planning priors.
4. Updated CAC ceiling from real contribution/order.

## 7) Decision Rule

- If week-2 gates pass: continue launch and scale cautiously.
- If week-2 gates fail: do not scale; run a 2-week fix sprint and recalculate.
