---
Type: Startup-Baseline-Seed
Status: Draft
Business: PET
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Seed-Source: docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md
Market-Source: docs/business-os/market-research/PET/2026-02-12-market-intelligence.user.md
---

# PET Forecast Seed for SFS-00

## 0a) Business-Now (Outcome Contract Proposal)

- Outcome-ID: `PET-OUT-2026Q1-01`
- Outcome statement: Achieve first reliable direct sales for PET in Italy via pre-website launch surfaces, then convert validated demand into owned-site growth with sustainable unit economics.
- Baseline (2026-02-12):
  - paid orders: 0
  - net revenue: EUR 0
  - blended CAC: not measured
  - return rate: not measured
- Target (90 days):
  - orders: 178 (forecast P50)
  - gross revenue incl VAT: EUR 5,874 (forecast P50)
  - blended CAC: <=EUR 10-12 by day 60-90 (subject to contribution guardrail)
  - return rate: <=8%
- By (deadline): 2026-05-13
- Owner: Pete
- Leading indicators (weekly):
  - sessions by channel (TikTok Shop / buy-link / organic / paid)
  - CVR by channel
  - paid CAC and blended CAC
  - payment success rate
  - on-time ship rate
  - return reason distribution
- Decision link: `DEC-PET-01` (whether to scale spend/channel breadth beyond validation mode)
- Stop/Pivot guardrails:
  - if CVR <1.2% after sufficient sample, fix conversion before spend increase
  - if blended CAC >70% of observed contribution/order pre-ads, stop expansion and run fix-first loop
  - if return rate >8% or on-time ship <95%, hold growth and remediate operations

## 0b) Existing-Work-Now (From Current Evidence)

Confirmed available now:
- Product lane and first SKU direction: handbag-style poop bag holder
- Follow-on SKU direction: biodegradable/compostable bag lane
- Initial audience hypothesis: female pet owners
- Inventory posture: first SKU stock purchased; expected in <=20 days
- Market intelligence baseline: `docs/business-os/market-research/PET/2026-02-12-market-intelligence.user.md`
- Forecast baseline: `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md`

Still missing / needs confirmation:
- exact sellable units and confirmed first in-stock date
- final price architecture (single, bundle, and any shipping threshold strategy)
- validated closure/hardware durability pass criteria for SKU1
- payment stack readiness checklist and live checkout test status
- returns flow copy and operational SLA confirmation
- packaging/environmental labeling compliance checklist for Italy

## 0c) Merge + Classification for First Execution Pack

Reuse-existing:
- channel and economics model from `italy-90-day-launch-forecast-v2.user.md`
- segment and positioning evidence from `2026-02-12-market-intelligence.user.md`

Adapt-existing:
- convert priors into a live weekly PET launch scorecard with measured thresholds
- split offer testing into explicit matrix (price x message x bundle)

New required artifacts:
- PET launch scorecard (weekly live metrics)
- offer-test matrix (price/messaging/bundle variants)
- durability and returns root-cause tracker
- payment and shipping reliability checklist

## Ready-to-Execute Go Items (Seed)

1. Launch pre-website conversion surface with full event and checkout instrumentation.
2. Run week-1 price and messaging tests (fashion-first vs reliability-first) with strict pass/fail thresholds.
3. Validate operations gates (payment success, ship SLA, return reasons) before scale.
4. Hold week-2 recalibration and re-forecast the remaining 10 weeks using observed data.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

```json
[
  {
    "id": "forecast.target.orders",
    "type": "target",
    "statement": "Orders target for 90 days is 178 (P50 forecast)",
    "confidence": 0.5,
    "value": 178,
    "unit": "orders",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.target.gross_revenue",
    "type": "target",
    "statement": "Gross revenue incl VAT target for 90 days is EUR 5874 (P50 forecast)",
    "confidence": 0.5,
    "value": 5874,
    "unit": "EUR",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.blended_cac",
    "type": "constraint",
    "statement": "Blended CAC must be <=EUR 10-12 by day 60-90",
    "confidence": 0.6,
    "value": 10,
    "unit": "EUR",
    "operator": "lte",
    "range": {"min": 10, "max": 12},
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.return_rate",
    "type": "constraint",
    "statement": "Return rate must be <=8%",
    "confidence": 0.6,
    "value": 8,
    "unit": "percent",
    "operator": "lte",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.min_cvr",
    "type": "constraint",
    "statement": "CVR must be >=1.2% after sufficient sample",
    "confidence": 0.7,
    "value": 1.2,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Stop/pivot guardrail from forecast outcome contract"]
  }
]
```
