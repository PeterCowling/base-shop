---
Type: Forecast
Status: Draft
Business: PET
Region: Italy
Created: 2026-02-11
Updated: 2026-02-11
Last-reviewed: 2026-02-11
Owner: Pete
---

# PET Italy 90-Day Launch Forecast (v2)

## Decision Frame

- Decision owner: Pete
- Decision: whether to launch PET SKU1 now on own-site DTC, with paid used as learning + retargeting
- Decision date: 2026-02-11
- Scope: first 90 days only, Italy market only, SKU1-led launch

## What Changed vs v1

- Forecast is now channel-causal (`paid spend -> CPC -> paid sessions`) instead of independent volume assumptions.
- Unit economics now includes variable costs beyond COGS.
- Explicit week-2 go/no-go gates are defined.
- Inventory capacity is treated as a hard constraint, not implied.

## Model Mechanics

### Core formulas

- `Paid sessions = Ad spend / CPC`
- `Total sessions = Paid sessions + Organic/Creator/Referral sessions`
- `Orders = Total sessions * CVR`
- `Net revenue (ex VAT) = Orders * (AOV incl VAT / 1.22)`
- `Contribution/order (pre ads) = Net AOV - (COGS + fulfillment + payment fee + returns reserve + shipping subsidy)`
- `Contribution after ads = Orders * Contribution/order - Ad spend`
- `Blended CAC = Ad spend / Orders`

### Hard constants

- VAT: 22%
- SKU1 COGS: EUR 2.00 (given)

## Scenario Inputs (Assumptions)

| Input | P10 | P50 | P90 | Notes |
|---|---:|---:|---:|---|
| Ad spend (90d) | EUR 600 | EUR 1,800 | EUR 3,500 | learning + retargeting bias |
| CPC | EUR 0.90 | EUR 0.70 | EUR 0.55 | planning assumptions; replace with observed |
| Organic/creator/referral sessions | 3,300 | 9,300 | 15,600 | depends on creator output + distribution |
| CVR | 1.0% | 1.5% | 2.2% | anchored to prior Italy benchmark band |
| AOV (incl VAT) | EUR 31 | EUR 33 | EUR 35 | includes occasional shipping/add-on effects |
| Fulfillment + packaging/order | EUR 4.80 | EUR 4.80 | EUR 4.80 | assumption |
| Payment fee/order | EUR 1.28 | EUR 1.34 | EUR 1.40 | assumption (blended) |
| Returns reserve/order | EUR 1.52 | EUR 1.62 | EUR 1.72 | assumption |
| Shipping subsidy/order | EUR 1.50 | EUR 1.50 | EUR 1.50 | assumption |

## 90-Day Output Forecast

| Metric | P10 | P50 | P90 |
|---|---:|---:|---:|
| Paid sessions (derived) | 667 | 2,571 | 6,364 |
| Total sessions (derived) | 3,967 | 11,871 | 21,964 |
| Orders (derived) | 40 | 178 | 483 |
| Gross revenue incl VAT (derived) | EUR 1,240 | EUR 5,874 | EUR 16,905 |
| Net revenue ex VAT (derived) | EUR 1,016 | EUR 4,815 | EUR 13,857 |
| Contribution/order pre ads (derived) | EUR 14.31 | EUR 15.79 | EUR 17.27 |
| Contribution pre ads (derived) | EUR 572 | EUR 2,811 | EUR 8,341 |
| Contribution after ads (derived) | EUR -28 | EUR 1,011 | EUR 4,841 |
| Blended CAC (derived) | EUR 15.00 | EUR 10.11 | EUR 7.25 |

## Week-2 Recalibration Gates (Mandatory)

Scale only if all pass:

1. CVR (7-day trailing) `>= 1.2%`
2. Blended CAC `<= 70%` of observed contribution/order pre ads
3. Refund rate `<= 8%`
4. On-time ship rate `>= 95%`
5. Payment success rate `>= 97%`

If any gate fails, switch to fix-first mode:

- stop cold acquisition expansion
- keep retargeting only
- run focused PDP/checkout/shipping-trust experiments
- re-forecast remaining 10 weeks using observed data

### Gate validity rules (minimum denominators)

- CVR gate is decision-valid only when `sessions >= 500` and `orders >= 10`.
- Refund gate is decision-valid only when `orders_shipped >= 25`.
- Payment-success gate is decision-valid only when `payment_attempts >= 100`.
- If a denominator is below threshold, mark result as `insufficient-sample` and extend observation window before scale decisions.

### Gate ownership and re-test SLA

- Demand efficiency gates (`CVR`, `CAC`): growth owner.
- Reliability gates (`refund`, `on-time ship`, `payment success`): operations owner.
- Any failed gate requires a named owner, remediation plan within 48 hours, and re-test within 7 days.

## Inventory Constraint (Critical Unknown)

- P90 requires capacity for ~483 shipped orders in 90 days.
- If available sellable units are below scenario demand, cap orders at inventory and recompute CAC/contribution.
- Forecast is not decision-grade until current on-hand + in-transit units are confirmed.

## Priority Risks and Mitigations

| Risk | Why it breaks forecast | Mitigation |
|---|---|---|
| CAC inflation | destroys contribution at low AOV | retargeting-first, fast creative pruning, strict CAC gate |
| Conversion underperformance | low order volume despite traffic | simplify PDP/checkout, improve shipping/returns clarity |
| Returns spike | erodes margin and cash flow | tighter fit/use expectations, explicit product dimensions, usage proof |
| Inventory delay/shortage | constrains realizable revenue | pre-order transparency + inventory-capped weekly lp-do-replan |
| Benchmark staleness | wrong priors for decisioning | refresh market/CVR references during week-2 recalibration |

## Required Data to Upgrade v2 -> Decision-Grade

1. Confirm inventory units and arrival dates.
2. Capture real blended payment + fulfillment cost per order.
3. Replace benchmark CPC/CVR priors with observed week-1 and week-2 data.
4. Recompute CAC ceiling from observed contribution/order.

## Operational Next 14 Days

1. Instrument funnel events end-to-end and validate against real test orders.
2. Run 10-15 creatives/week and cut bottom quartile every 72 hours.
3. Track daily dashboard: sessions, CVR, CAC, refund %, payment success, on-time ship.
4. Execute week-2 go/no-go decision with revised 10-week forecast.
