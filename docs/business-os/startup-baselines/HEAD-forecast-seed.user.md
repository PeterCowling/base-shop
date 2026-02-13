---
Type: Startup-Baseline-Seed
Status: Draft
Business: HEAD
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Seed-Source: docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md
---

# HEAD Forecast Seed for SFS-00

## 0a) Business-Now (Outcome Contract Proposal)

- Outcome-ID: `HEAD-OUT-2026Q1-01`
- Outcome statement: Achieve first reliable direct sales for HEAD in Italy through own-site launch with sustainable unit economics.
- Baseline (2026-02-12):
  - net orders: 0
  - net revenue: EUR 0
  - blended CAC: not measured
  - return rate: not measured
- Target (90 days):
  - net orders: 110 (forecast P50)
  - net revenue: EUR 3,000 (forecast P50)
  - blended CAC: <=EUR 13 by day 60 and <=EUR 13-15 steady-state band by day 90 (pending observed contribution)
  - return rate: <=7%
- By (deadline): 2026-05-13
- Owner: Pete
- Leading indicators (weekly):
  - total sessions
  - CVR by channel
  - paid CAC and blended CAC
  - payment success rate
  - return reason distribution
- Decision link: `DEC-HEAD-01` (whether to scale paid acquisition beyond precision/retargeting and commit to second-SKU expansion)
- Stop/Pivot guardrails:
  - if paid CAC > gross profit per order for 7 consecutive days, reduce paid to retargeting only
  - if sitewide CVR <0.9% after >=500 sessions, pause spend expansion and run conversion fixes first

## 0b) Existing-Work-Now (From Current Evidence)

Confirmed available now:
- Product concept and category: cochlear-implant retention headband
- Stock position: first product inventory already purchased (near-term launch-ready)
- Market forecast and benchmark pack: completed in v2 forecast
- Channel intent: own-site primary channel

Still missing / needs confirmation:
- exact in-stock date and sellable units count
- final price architecture (single vs bundle pricing)
- compatibility matrix for processor variants
- payment stack readiness checklist and end-to-end test status
- returns flow copy and operational SLA confirmation

## 0c) Merge + Classification for First Execution Pack

Reuse-existing:
- forecast benchmarks and ICP hypotheses from `headband-90-day-launch-forecast-v2.user.md`
- first 14-day validation checklist from same source

Adapt-existing:
- convert forecast KPI set into live weekly scorecard with real thresholds
- refine ICP from broad "people with cochlear implants" to prioritized buyer segment sequence

New required artifacts:
- HEAD launch scorecard (weekly live metrics)
- compatibility and fit decision aid (customer-facing)
- paid spend control sheet linked to CAC guardrails
- returns reason taxonomy and escalation triggers

## Ready-to-Execute Go Items (Seed)

1. Launch analytics + payment reliability baseline on own-site funnel.
2. Publish compatibility/fit guidance and assisted support path.
3. Run capped week-1 acquisition experiment (high-intent + retargeting) with daily CAC/CVR reviews.
4. Hold week-2 recalibration decision and re-forecast remaining 10 weeks using observed data.

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

```json
[
  {
    "id": "forecast.target.net_orders",
    "type": "target",
    "statement": "Net orders target for 90 days is 110 (P50 forecast)",
    "confidence": 0.5,
    "value": 110,
    "unit": "orders",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.target.net_revenue",
    "type": "target",
    "statement": "Net revenue target for 90 days is EUR 3000 (P50 forecast)",
    "confidence": 0.5,
    "value": 3000,
    "unit": "EUR",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.blended_cac",
    "type": "constraint",
    "statement": "Blended CAC must be <=EUR 13-15 by day 90",
    "confidence": 0.6,
    "value": 13,
    "unit": "EUR",
    "operator": "lte",
    "range": {"min": 13, "max": 15},
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.return_rate",
    "type": "constraint",
    "statement": "Return rate must be <=7%",
    "confidence": 0.6,
    "value": 7,
    "unit": "percent",
    "operator": "lte",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md"]
  },
  {
    "id": "forecast.constraint.min_cvr",
    "type": "constraint",
    "statement": "Sitewide CVR must be >=0.9% after 500 sessions",
    "confidence": 0.7,
    "value": 0.9,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Stop/pivot guardrail from forecast outcome contract"]
  }
]
```
