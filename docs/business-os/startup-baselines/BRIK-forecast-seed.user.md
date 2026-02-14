---
Type: Startup-Baseline-Seed
Status: Active
Business: BRIK
Created: 2026-02-13
Updated: 2026-02-13
Last-reviewed: 2026-02-13
Owner: Pete
Seed-Source: docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md
Market-Source: docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md
Site-Source: docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md
Promotion-Status: Integrated-into-canonical-plan
---

# BRIK Forecast Seed for SFS-00

## 0a) Business-Now (Outcome Contract Proposal)

- Outcome-ID: `BRIK-OUT-2026Q2-01`
- Outcome statement: Stabilize and grow BRIK net booking value over the next 90 days by improving conversion quality, direct-share economics, and cancellation control under measured weekly decisioning.
- Baseline (2026-02-13):
  - trailing 90-day net booking value (2025-11..2026-01): EUR 28,927.79
  - trailing 90-day bookings (2025-11..2026-01): 100
  - direct booking share (same window): 18%
  - paid CAC: not measured at decision-grade quality
- Target (90 days):
  - net booking value: EUR 205,200 (forecast P50)
  - bookings: 760 (forecast P50)
  - direct booking share: 27% (forecast P50)
  - paid CAC: <=EUR 95 by day 14 and <=EUR 90 by day 60-90
- By (deadline): 2026-05-13
- Owner: Pete
- Leading indicators (weekly):
  - tracked sessions
  - session-to-booking CVR
  - paid CAC and spend efficiency
  - direct share vs OTA share
  - booking-step p75 performance
  - cancellation reason coding coverage
- Decision link: `DEC-BRIK-02` (whether BRIK has recovered into a reliable positive trend and can scale controlled growth investments)
- Stop/Pivot guardrails:
  - if CVR <1.2% after >=5,000 sessions, hold spend expansion and prioritize funnel fixes
  - if paid CAC >EUR 130 for 7 consecutive days, reduce to retargeting-only mode
  - if direct share <20% by day 14, accelerate member-rate/perk experiment and re-check margin impact
  - if booking-step p75 load >3.0s for 3 consecutive days, freeze offer experiments until performance is restored

## 0b) Existing-Work-Now (From Current Evidence)

Confirmed available now:
- Historical baseline pack is active (`docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`).
- Market intelligence pack is decision-grade active (`docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`).
- Site-upgrade synthesis brief is decision-grade active (`docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`).
- S3 startup-loop forecast is active (`docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md`).
- Core GA4 + Search Console production setup is live (`docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`).

Still missing / needs confirmation:
- event-level GA4 UI verification for `web_vitals` and `begin_checkout`
- first 7-day measured KPI baseline persisted in business plan
- cancellation reason taxonomy adoption and >=90% coding coverage
- S6B channel strategy artifact for explicit channel mix ownership
- S5 prioritization scorecard and first S10 weekly decision artifact

## 0c) Merge + Classification for First Execution Pack

Reuse-existing:
- demand, competitor, and regulatory priors from `2026-02-12-market-intelligence.user.md`
- conversion and UX priority set from `2026-02-12-upgrade-brief.user.md`
- historical seasonality and booking-value anchors from `2026-02-12-historical-performance-baseline.user.md`
- P10/P50/P90 scenario bands and day-14 gates from `2026-02-13-startup-loop-90-day-forecast-v1.user.md`

Adapt-existing:
- convert S3 threshold set into a live weekly KPI scorecard with owner and cadence
- adapt direct-offer hypotheses into channel-specific tests with margin guardrails

New required artifacts:
- BRIK weekly KPI scorecard artifact (S10 input contract)
- BRIK S5 prioritization scorecard
- BRIK first weekly K/P/C/S decision log
- BRIK first forecast recalibration artifact after 14-day measured window

## Ready-to-Execute Go Items (Seed)

1. Complete GA4 UI event verification and lock first 7-day KPI baseline in `plan.user.md`.
2. Execute S6 P1 conversion fixes (policy/fee clarity, mobile performance hardening, direct-offer module).
3. Implement cancellation reason coding and enforce >=90% coverage by day 14.
4. Run day-14 gate review and either keep P50 posture or trigger immediate recalibration artifact.

## Priors (Machine)

Last updated: 2026-02-13 23:59 UTC

```json
[
  {
    "id": "forecast.target.net_booking_value_90d",
    "type": "target",
    "statement": "Net booking value target for the next 90 days is EUR 205200 (P50 forecast)",
    "confidence": 0.55,
    "value": 205200,
    "unit": "EUR",
    "last_updated": "2026-02-13T00:00:00Z",
    "evidence": [
      "docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md"
    ]
  },
  {
    "id": "forecast.target.bookings_90d",
    "type": "target",
    "statement": "Bookings target for the next 90 days is 760 (P50 forecast)",
    "confidence": 0.55,
    "value": 760,
    "unit": "bookings",
    "last_updated": "2026-02-13T00:00:00Z",
    "evidence": [
      "docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md"
    ]
  },
  {
    "id": "forecast.target.direct_share",
    "type": "target",
    "statement": "Direct booking share target is 27% in the P50 scenario",
    "confidence": 0.5,
    "value": 27,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-13T00:00:00Z",
    "evidence": [
      "docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md",
      "docs/business-os/strategy/BRIK/data/bookings_by_month.csv"
    ]
  },
  {
    "id": "forecast.constraint.paid_cac",
    "type": "constraint",
    "statement": "Paid CAC must be <=EUR 95 by day 14 and trend to <=EUR 90 by day 60-90",
    "confidence": 0.45,
    "value": 95,
    "unit": "EUR",
    "operator": "lte",
    "range": {
      "min": 90,
      "max": 95
    },
    "last_updated": "2026-02-13T00:00:00Z",
    "evidence": [
      "docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md"
    ]
  },
  {
    "id": "forecast.constraint.min_cvr",
    "type": "constraint",
    "statement": "Session-to-booking CVR should remain >=1.2% after >=5000 sessions",
    "confidence": 0.6,
    "value": 1.2,
    "unit": "percent",
    "operator": "gte",
    "last_updated": "2026-02-13T00:00:00Z",
    "evidence": [
      "docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md"
    ]
  }
]
```
