---
Type: Forecast
Status: Draft
Business: HEAD
Region: TBD
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
Review-trigger: After each completed build cycle touching this document.
---

# HEAD 90-Day Launch Forecast (v1)

## Decision Frame

- Decision owner: Pete
- Decision: whether to launch HEAD SKU1 (headband) now on own-site DTC with paid used for learning + retargeting
- Decision date: 2026-02-11
- Scope: first 90 days only, initial market assumptions only (replace with observed data by week 2)

## What This Solves

- Converts HEAD from a broad "offer exploration" phase into a measurable launch decision system.
- Defines explicit stop/pivot rules so scale decisions are based on economics and reliability, not top-line traffic.

## Model Mechanics

### Core formulas

- `Paid sessions = Ad spend / CPC`
- `Total sessions = Paid sessions + Organic/Creator/Referral sessions`
- `Orders = Total sessions * CVR`
- `Net revenue (ex VAT) = Orders * (AOV incl VAT / 1.22)` (when Italy VAT modeling is used)
- `Contribution/order (pre ads) = Net AOV - (COGS + fulfillment + payment fee + returns reserve + shipping subsidy)`
- `Contribution after ads = Orders * Contribution/order - Ad spend`
- `Blended CAC = Ad spend / Orders`

### Hard constants (assumption-led)

- VAT model basis: 22% (Italy assumption; replace for actual market)
- SKU1 COGS: EUR 3.20 (assumption; replace with landed cost)

## Scenario Inputs (Assumptions)

| Input | P10 | P50 | P90 | Notes |
|---|---:|---:|---:|---|
| Ad spend (90d) | EUR 500 | EUR 1,500 | EUR 3,200 | learning + retargeting bias |
| CPC | EUR 0.80 | EUR 0.65 | EUR 0.50 | planning assumptions; replace with observed |
| Organic/creator/referral sessions | 2,500 | 7,000 | 13,000 | depends on creator and partner output |
| CVR | 0.8% | 1.4% | 2.0% | provisional range until live data exists |
| AOV (incl VAT) | EUR 24 | EUR 27 | EUR 29 | reflects single SKU + limited add-ons |
| Fulfillment + packaging/order | EUR 4.20 | EUR 4.20 | EUR 4.20 | assumption |
| Payment fee/order | EUR 1.00 | EUR 1.12 | EUR 1.20 | assumption |
| Returns reserve/order | EUR 1.20 | EUR 1.35 | EUR 1.45 | assumption |
| Shipping subsidy/order | EUR 1.20 | EUR 1.20 | EUR 1.20 | assumption |

## 90-Day Output Forecast

| Metric | P10 | P50 | P90 |
|---|---:|---:|---:|
| Paid sessions (derived) | 625 | 2,308 | 6,400 |
| Total sessions (derived) | 3,125 | 9,308 | 19,400 |
| Orders (derived) | 25 | 130 | 388 |
| Gross revenue incl VAT (derived) | EUR 600 | EUR 3,510 | EUR 11,252 |
| Net revenue ex VAT (derived) | EUR 492 | EUR 2,877 | EUR 9,223 |
| Contribution/order pre ads (derived) | EUR 8.87 | EUR 11.06 | EUR 12.52 |
| Contribution pre ads (derived) | EUR 222 | EUR 1,438 | EUR 4,858 |
| Contribution after ads (derived) | EUR -278 | EUR -62 | EUR 1,658 |
| Blended CAC (derived) | EUR 20.00 | EUR 11.54 | EUR 8.25 |

## Week-2 Recalibration Gates (Mandatory)

Scale only if all pass:

1. CVR (7-day trailing) `>= 1.1%`
2. Blended CAC `<= 75%` of observed contribution/order pre ads
3. Refund rate `<= 9%`
4. On-time ship rate `>= 95%`
5. Payment success rate `>= 97%`

If any gate fails, switch to fix-first mode:

- stop cold acquisition expansion
- keep retargeting only
- run focused PDP/checkout/offer fixes
- re-forecast remaining 10 weeks using observed data

### Gate validity rules (minimum denominators)

- CVR gate is decision-valid only when `sessions >= 500` and `orders >= 10`.
- Refund gate is decision-valid only when `orders_shipped >= 25`.
- Payment-success gate is decision-valid only when `payment_attempts >= 100`.
- If denominator is below threshold, mark result as `insufficient-sample` and extend observation window.

### Gate ownership and re-test SLA

- Demand efficiency gates (`CVR`, `CAC`): growth owner.
- Reliability gates (`refund`, `on-time ship`, `payment success`): operations owner.
- Any failed gate requires named owner assignment, remediation plan in 48 hours, and re-test in 7 days.

## Inventory and Offer Constraints

- P90 requires capacity for ~388 fulfilled orders in 90 days.
- If sellable inventory is below scenario demand, cap orders and recompute CAC/contribution.
- Forecast assumes final offer definition is stable (value prop + fit/comfort claims + usage proof).

## Priority Risks and Mitigations

| Risk | Why it breaks forecast | Mitigation |
|---|---|---|
| Weak differentiation | low conversion even with traffic | narrow ICP + explicit value claim tests |
| CAC inflation | contribution collapse at low AOV | retargeting-first, fast creative pruning, spend caps |
| Returns from fit/comfort mismatch | margin erosion + reputation damage | clear sizing guidance, fit proof, use-case demos |
| Ops reliability variance | missed delivery expectations block scale | shipping SLA gate + fallback carrier plan |
| Unknown true unit economics | false-positive scale decisions | weekly cost model refresh from actuals |

## Required Data to Upgrade v1 -> Decision-Grade

1. Confirm region, VAT basis, and target channel mix.
2. Confirm real landed COGS and per-order variable costs.
3. Replace benchmark CPC/CVR priors with week-1 and week-2 observed values.
4. Recompute acceptable CAC ceiling from observed contribution/order.

## Operational Next 14 Days

1. Instrument funnel events and validate with real test orders.
2. Run controlled offer tests to validate value proposition clarity.
3. Track daily: sessions, CVR, CAC, refunds, payment success, on-time ship.
4. Execute formal week-2 go/no-go with revised 10-week forecast.
