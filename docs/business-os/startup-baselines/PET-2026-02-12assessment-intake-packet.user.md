---
Type: Startup-Intake-Packet
Status: Active
Business: PET
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Source-Market-Intel: docs/business-os/market-research/PET/2026-02-12-market-intelligence.user.md
Source-Forecast: docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md
Review-trigger: After each completed build cycle touching this document.
---

# PET Intake Packet

## A) Intake Summary

- Business idea: launch premium-aesthetic pet walking accessories, starting with a poop bag holder (`observed`).
- Product 1 is defined: small handbag-style poop bag holder with landed cost EUR 2 (`observed`).
- Product 2 direction exists: biodegradable/compostable bags (`observed`).
- Primary initial buyer hypothesis is female pet owners (`observed`).
- Stock for product 1 is purchased and expected within <=20 days (`observed`).
- Launch-surface mode is currently `pre-website` (`observed`).
- Own-site remains core channel intent, but speed-to-first-sales remains the top priority (`observed`).
- Core near-term execution risk is conversion + reliability proof, not lack of market category demand (`inferred`).

## B) Business and Product Packet

| Field | Value | Tag |
|---|---|---|
| Business code | PET | observed |
| Business name | Pet accessories business | observed |
| Region | Italy (primary) | observed |
| Product 1 | Handbag-style poop bag holder | observed |
| Product 1 landed cost | EUR 2 | observed |
| Product 1 status | Inventory purchased; expected <=20 days | observed |
| Product 2 | Biodegradable/compostable poop bags | observed |
| Product constraints | Must combine style with daily reliability and clean-carry utility | inferred |

## C) ICP and Channel Packet

| Field | Value | Tag |
|---|---|---|
| First-buyer ICP | Female dog owners (urban daily walkers) | observed/inferred |
| Secondary ICP | New puppy owners and repeat daily-use buyers | inferred |
| Planned channels (initial) | Own-site intent with pre-website speed-first execution surface | observed |
| Support expectation | Fast response for fit/roll compatibility and delivery questions | inferred |

## D) Constraints and Assumptions Register

| Item | Type | Evidence / note | Confidence |
|---|---|---|---|
| Speed-to-first-sales is non-negotiable | observed | Current operating direction for startup businesses | High |
| Pre-website launch surface is current mode | observed | Current strategy and market-intel docs | High |
| Product 1 landed cost is EUR 2 | observed | Intake provided by operator | High |
| First product stock window is <=20 days | observed | Intake provided by operator | Medium |
| Price and conversion assumptions still require live validation | inferred | Forecast is not yet decision-grade | High |

## E) Draft Outcome Contract

- Outcome statement: Achieve first reliable PET sales in Italy via pre-website execution, then stabilize contribution-positive growth with bundle/attach economics.
- Baseline:
  - paid orders: 0
  - net revenue: EUR 0
  - blended CAC: not measured
  - return rate: not measured
- Target (90 days):
  - orders: 178 (P50 planning target)
  - gross revenue incl VAT: EUR 5,874 (P50 planning target)
  - blended CAC: <=EUR 10-12 by day 60-90
  - return rate: <=8%
- By: 2026-05-13
- Owner: Pete
- Leading indicators:
  - sessions by channel
  - CVR by channel
  - paid CAC and blended CAC
  - payment success rate
  - on-time ship rate
  - return reason distribution
- Decision link: `DEC-PET-01` (scale vs hold expansion)

## F) Missing-Data Checklist (to progress S1/S3)

| Missing field | Why needed | Owner | Priority |
|---|---|---|---|
| Exact sellable units and confirmed first in-stock date | Required for inventory-capped forecast realism | Pete | critical |
| Launch pricing architecture (single/bundle/shipping threshold) | Required for contribution and CAC guardrails | Pete | critical |
| Closure/hardware durability pass criteria | Required before scale to reduce returns and negative feedback loops | Pete | high |
| Payment stack day-1 confirmation | Required for checkout confidence and reduced drop-off | Pete | high |
| Returns copy/SLA and packaging-label compliance checklist | Required for trust/compliance and ops readiness | Pete | high |

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

```json
[
  {
    "id": "icp.primary.female_dog_owners",
    "type": "assumption",
    "statement": "First ICP is female dog owners (urban daily walkers)",
    "confidence": 0.75,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/market-research/PET/2026-02-12-market-intelligence.user.md"]
  },
  {
    "id": "product.landed_cost",
    "type": "constraint",
    "statement": "Product 1 landed cost is EUR 2",
    "confidence": 0.95,
    "value": 2,
    "unit": "EUR",
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Intake provided by operator"]
  },
  {
    "id": "positioning.fashion_reliability_balance",
    "type": "assumption",
    "statement": "Product must combine style with daily reliability and clean-carry utility",
    "confidence": 0.8,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Product constraints and market positioning analysis"]
  },
  {
    "id": "risk.durability_validation_needed",
    "type": "risk",
    "statement": "Closure/hardware durability must be validated before scale to reduce returns",
    "confidence": 0.85,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["F) Missing-Data Checklist priority ranking"]
  },
  {
    "id": "channel.pre_website_speed_first",
    "type": "preference",
    "statement": "Pre-website speed-first execution surface with own-site intent",
    "confidence": 0.9,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Observed channel plan across intake packet"]
  }
]
```
