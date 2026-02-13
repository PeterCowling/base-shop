---
Type: Startup-Intake-Packet
Status: Active
Business: HEAD
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
Source-Market-Intel: docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md
Source-Forecast: docs/business-os/strategy/HEAD/headband-90-day-launch-forecast-v2.user.md
---

# HEAD Intake Packet

## A) Intake Summary

- Business idea: launch cochlear-implant retention headbands for Italy-first buyers (`observed`).
- First product lane: headbands that keep processors secure during daily use, school/play, and sport (`observed`).
- Launch-surface mode is currently `pre-website` (`observed`).
- Stock for first product is already purchased; near-term availability is expected (`observed`).
- Channel intent is own-site first, with speed-to-first-sales priority (`observed`).
- Execution posture is startup-speed: direct sales execution is prioritized over CMS work (`observed`).
- Core uncertainty is not category demand; it is execution quality (fit/compatibility clarity, conversion, and returns control) (`inferred`).

## B) Business and Product Packet

| Field | Value | Tag |
|---|---|---|
| Business code | HEAD | observed |
| Business name | Headband business (cochlear-implant accessories) | observed |
| Region | Italy (primary) | observed |
| Product 1 | Cochlear-implant retention headband | observed |
| Product 1 status | Inventory purchased; launch-near | observed |
| Product 2 | Not locked in this intake packet | observed |
| Product constraints | Must protect fit/retention use-case without over-claiming medical outcomes | inferred |

## C) ICP and Channel Packet

| Field | Value | Tag |
|---|---|---|
| First-buyer ICP | Parents/caregivers of young children with cochlear implants | inferred (from market-intel and competitor patterns) |
| Secondary ICP | Active/sport users and daily-comfort adult users | inferred |
| Planned channels (initial) | Own-site DTC (primary), with speed-first launch posture | observed |
| Support expectation | Fast pre-purchase support for compatibility/fit uncertainty | inferred |

## D) Constraints and Assumptions Register

| Item | Type | Evidence / note | Confidence |
|---|---|---|---|
| Speed-to-first-sales is non-negotiable | observed | Operating direction across startup-loop work | High |
| Pre-website launch surface is current mode | observed | Current strategy and market-intel docs | High |
| Inventory is near-term available | observed | User-provided stock status; exact date still pending | Medium |
| Outcome should be sales-led, not platform-cleanup-led | observed | Current operating principle (startup execution first) | High |
| First ICP should be caregiver-led before broader expansion | inferred | Category patterns and HEAD research evidence | Medium |

## E) Draft Outcome Contract

- Outcome statement: Achieve first reliable direct sales for HEAD in Italy, then stabilize weekly sales with controlled CAC and returns.
- Baseline:
  - paid orders: 0
  - net revenue: EUR 0
  - blended CAC: not measured
  - return rate: not measured
- Target (90 days):
  - net orders: 110 (P50 planning target)
  - net revenue: EUR 3,000 (P50 planning target)
  - blended CAC: <=EUR 13 by day 60-90
  - return rate: <=7%
- By: 2026-05-13
- Owner: Pete
- Leading indicators:
  - sessions by channel
  - CVR by channel
  - paid CAC and blended CAC
  - payment success rate
  - return reason distribution
- Decision link: `DEC-HEAD-01` (scale vs hold paid expansion)

## F) Missing-Data Checklist (to progress S1/S3)

| Missing field | Why needed | Owner | Priority |
|---|---|---|---|
| Exact in-stock date and sellable units | Required for decision-grade launch and spend planning | Pete | critical |
| Processor compatibility matrix (launch version) | Required to reduce wrong-buy risk and return risk | Pete | critical |
| Final pricing architecture (single vs bundle) | Required for CAC and contribution guardrails | Pete | high |
| Payment stack day-1 confirmation | Required for checkout conversion confidence in Italy | Pete | high |
| Returns flow copy and SLA | Required for trust/compliance and support readiness | Pete | high |

## Priors (Machine)

Last updated: 2026-02-13 12:00 UTC

```json
[
  {
    "id": "icp.primary.caregiver_led",
    "type": "assumption",
    "statement": "First ICP is parents/caregivers of young children with cochlear implants",
    "confidence": 0.7,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md", "Competitor patterns"]
  },
  {
    "id": "positioning.fit_clarity_critical",
    "type": "risk",
    "statement": "Fit/compatibility clarity is critical to reduce wrong-buy and return risk",
    "confidence": 0.8,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["F) Missing-Data Checklist priority ranking", "Category complexity"]
  },
  {
    "id": "channel.own_site_primary",
    "type": "preference",
    "statement": "Own-site DTC is primary channel with speed-first launch posture",
    "confidence": 0.9,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Observed channel intent across intake packet"]
  },
  {
    "id": "execution.speed_to_first_sales",
    "type": "constraint",
    "statement": "Speed-to-first-sales is non-negotiable",
    "confidence": 0.95,
    "last_updated": "2026-02-12T00:00:00Z",
    "evidence": ["Operating direction across startup-loop work"]
  }
]
```
