---
Type: Forecast
Status: Active
Business: HEAD
Region: Italy
Created: 2026-02-20
Updated: 2026-02-20
Last-reviewed: 2026-02-20
Owner: Pete
business: HEAD
artifact: forecast
status: Active
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/startup-baselines/HEAD-offer.md
  - docs/business-os/startup-baselines/HEAD-channels.md
  - docs/business-os/contracts/HEAD/outcome-contract.user.md
  - docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md
decisions:
  - DEC-HEAD-CH-01
Review-trigger: After each completed build cycle touching this document.
---

# HEAD 90-Day Forecast (S3 Canonical Backfill)

## Executive Summary

This forecast backfills canonical S3 output using the updated HEAD offer/channel stack:
- core headband lane,
- 90-day MVP extension lane (multi-pack headbands, organiser pouch, patch packs),
- own-site primary channel authority with constrained Etsy probes.

The canonical contract remains `HEAD-OUT-2026Q1-01`; this forecast supports execution planning and weekly recalibration.

## Input Packet

- Region: Italy first (EU/US expansion after initial validation)
- Launch mode: own-site DTC primary + constrained marketplace probes
- MVP additions: organiser pouch, school-ready multi-pack headbands, patch packs
- Copy boundary: non-medical claims only (comfort, secure wear, organisation, style)
- Contract window: through 2026-05-13

## P10 / P50 / P90 Scenario Table (90-day totals)

| Metric | P10 | P50 | P90 |
|---|---:|---:|---:|
| Paid spend (EUR) | 700 | 1,500 | 2,600 |
| Total sessions | 2,400 | 6,200 | 11,600 |
| Gross orders | 28 | 117 | 253 |
| Return rate | 8.0% | 6.0% | 4.5% |
| Net orders | 26 | 110 | 242 |
| AOV (EUR) | 24 | 27 | 32 |
| Net revenue after returns (EUR) | 620 | 3,000 | 7,744 |
| Gross margin % | 55% | 60% | 65% |
| Gross profit (EUR) | 341 | 1,800 | 5,034 |
| Paid CAC (EUR/paid order) | 50 | 27 | 18 |
| Blended CAC (EUR/all orders) | 27 | 14 | 11 |

Interpretation:
- P50 remains aligned to outcome contract targets (110 net orders, EUR3,000 net revenue).
- P90 requires strong bundle attach and returns control.
- P10 remains downside case if conversion quality and fit clarity underperform.

## Target Alignment (Contract Reference)

Canonical source of truth:
- `docs/business-os/contracts/HEAD/outcome-contract.user.md`

This forecast is aligned to the active contract guardrails:
- Net orders target: 110 by 2026-05-13
- Net revenue target: EUR3,000 by 2026-05-13
- Blended CAC: <= EUR13-15 band by steady state
- Return rate: <= 7%

## Weekly Leading Indicators

- Sessions by channel
- Sitewide CVR and channel CVR
- Bundle attach rate (pouch, patch, pod add-ons)
- Paid CAC and blended CAC
- Payment success rate
- Return rate + return reason distribution
- Support contact volume for fit/compatibility

## Assumption Register

| Assumption | Type | Confidence | Impact if wrong |
|---|---|---|---|
| Top-3 MVP lane increases AOV vs single-SKU baseline | inferred | Medium | High |
| Returns can be held near 6-7% with fit clarity and support | inferred | Medium | High |
| Own-site remains primary learning surface through 90-day window | observed (decision-linked) | High | High |
| Etsy probe lane remains constrained and non-displacing | observed (decision-linked) | High | Medium |
| Non-medical copy discipline is maintained across channel assets | operational | Medium | High |
| Naming remains provisional and does not block launch execution | observed | Medium | Low |

## Risk Register

| Risk | Why it matters | Mitigation |
|---|---|---|
| CAC above gross profit/order | Breaks unit economics | Strict spend caps + weekly guardrail checks |
| Fit/expectation mismatch returns | Erodes contribution | Improve guidance, support scripts, and bundle clarity |
| Copy drift into medical framing | Legal and trust risk | Enforce approved copy guardrails |
| Marketplace overhead outgrows contribution | Operational drag | Keep probe constrained; compare support load/order |

## First 14-Day Validation Plan

1. Validate product-page clarity for top-3 MVP lane.
2. Launch capped own-site acquisition and track CAC/CVR daily.
3. Run constrained Etsy probe and compare contribution economics.
4. Track bundle attach rate and return reasons from day 1.
5. Hold week-2 recalibration and update scenario bands from observed data.

## Source Set

- `docs/business-os/startup-baselines/HEAD-offer.md`
- `docs/business-os/startup-baselines/HEAD-channels.md`
- `docs/business-os/contracts/HEAD/outcome-contract.user.md`
- `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md`
- `docs/business-os/strategy/HEAD/lp-other-products-results.user.md`

