---
Type: Forecast
Status: Active
Business: BRIK
Region: Europe (primary: Italy)
Created: 2026-02-13
Updated: 2026-02-13
Last-reviewed: 2026-02-13
Owner: Pete
Source: S2 market intelligence + S6 site-upgrade synthesis + S2A historical baseline + S1B measurement verification
Review-trigger: After each completed build cycle touching this document.
---

# BRIK Startup-Loop 90-Day Forecast (v1)

## Input Packet

- Business: `BRIK` (Brikette)
- Launch surface: `website-live`
- Horizon: 90 days (`2026-02-14` to `2026-05-13`)
- Core inputs:
  - `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`
  - `docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`
  - `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`
  - `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`

## Launch Surface Mode

- Mode used: `website-live`
- Forecast focus: sessions, bookings, net booking value, channel mix, and guardrails for paid/cancellation risk.
- Constraint: GA4/Search Console core setup is now live, but event-level verification and first 7-day baseline are still in progress.

## 1) Scenario Summary (P10 / P50 / P90)

Calibration anchors:
- (observed) 2025-02..2025-05 net booking value: EUR 212,882.66 total (avg EUR 53,220.67/month).
- (observed) 2025-02..2025-05 bookings: 786 total (avg 196.5/month).
- (observed) Weighted realized value per booking in that window: EUR 270.84.
- (observed) Direct share in that window: 21.8% (`Direct:171 / Total:786`).

| Metric (90-day total) | P10 | P50 | P90 |
|---|---:|---:|---:|
| Tracked sessions (GA4) | 32,000 | 40,000 | 48,000 |
| Session -> booking CVR | 1.6% | 1.9% | 2.1% |
| Total bookings | 512 | 760 | 1,008 |
| Realized value per booking (EUR) | 250 | 270 | 285 |
| Net booking value (EUR) | 128,000 | 205,200 | 287,280 |
| Direct booking share | 22% | 27% | 32% |
| Direct bookings | 113 | 205 | 323 |
| OTA bookings | 399 | 555 | 685 |
| Paid spend (retargeting + high-intent search) EUR | 9,000 | 12,000 | 16,000 |
| Paid-attributed bookings | 70 | 140 | 220 |
| Paid CAC (EUR) | 128.57 | 85.71 | 72.73 |
| Contribution margin after channel costs | 15% | 22% | 30% |
| Contribution margin value (EUR) | 19,200 | 45,144 | 86,184 |

Interpretation:
- P50 is slightly below the same-season historical window and assumes recovery through conversion-quality improvements, not broad demand expansion.
- P90 requires successful execution of the S6 backlog priorities (policy clarity, mobile performance, offer module, cancellation instrumentation).
- P10 reflects weaker execution and/or slower instrumentation reliability.

## 2) Unit Economics (Per Scenario)

| Metric | P10 | P50 | P90 | Evidence type |
|---|---:|---:|---:|---|
| Realized booking value/order (EUR) | 250 | 270 | 285 | observed anchor + assumption band |
| Blended CVR | 1.6% | 1.9% | 2.1% | assumption (to be measured) |
| Paid CAC (EUR) | 128.57 | 85.71 | 72.73 | assumption (bounded by channel guardrails) |
| Direct share of bookings | 22% | 27% | 32% | observed anchor + assumption uplift |
| Realized-value leakage pressure (cancellations/refunds) | high | medium | controlled | assumption (reason coding not complete yet) |
| Contribution margin after channel cost | 15% | 22% | 30% | assumption (requires measured channel + cancellation mix) |

Decision-grade note:
- This v1 forecast is operationally usable for guardrails and sequencing, but not fully decision-grade until event-level GA4 checks and 7-14 day measured funnel baselines are captured.

## 3) Channel Ranges (S3 working set for BRIK)

No S6B channel artifact exists yet, so this section uses the active S2/S6 evidence set as a provisional channel model.

| Channel | Traffic/session share range | Booking conversion expectation | CAC range (EUR) | Why this range |
|---|---|---|---:|---|
| Organic search + content discovery | 40%-50% | 1.7%-2.2% | n/a | Large multilingual footprint + SEO demand capture |
| Direct/referral/repeat (CRM-assisted) | 30%-40% | 2.0%-2.8% | n/a | Existing brand demand + direct-offer mechanics |
| Paid retargeting + high-intent search | 15%-25% | 1.2%-1.9% | 70-130 | Keep spend constrained until attribution quality improves |
| OTA share (booking outcome channel) | 65%-78% of bookings in baseline; target gradual direct-share lift | n/a | n/a | Historical booking export shows OTA-dominant mix |

## 4) First-14-Day Validation Plan (Primary Output)

### Metrics + Thresholds

| Metric | Day-7 threshold | Day-14 threshold | Data source |
|---|---|---|---|
| Tracked sessions | >= 2,800 | >= 6,000 | GA4 traffic reports |
| Session -> booking CVR | >= 1.4% with >= 2,500 sessions | >= 1.6% with >= 5,000 sessions | GA4 + booking confirmation events |
| Paid CAC | <= EUR 110 | <= EUR 95 | Ad platforms + booking joins |
| Direct booking share | >= 21% | >= 23% | Monthly/weekly booking export channel split |
| Booking-step p75 performance | <= 2.8s | <= 2.5s | Web-vitals + RUM pipeline |
| Cancellation reason coding coverage | >= 80% | >= 90% | Ops + booking cancellation logs |

### Decision Gates

1. If CVR < 1.2% after >= 5,000 sessions, pause spend increases and prioritize S6 P1 funnel fixes.
2. If paid CAC > EUR 130 for 7 consecutive days, reduce paid to retargeting-only mode.
3. If direct share stays < 20% by day 14, accelerate member-rate/perk experiment from S6 backlog.
4. If p75 booking-step load > 3.0s for 3 consecutive days, freeze offer experiments until performance is restored.
5. If measurement event coverage is < 95% for core funnel events, block scale decisions and classify outcome as `insufficient-sample`.

### 14-Day Execution Sequence

1. Confirm event-level measurement (`web_vitals`, `begin_checkout`, booking confirmation) in GA4 UI.
2. Launch policy/fee clarity module on top booking routes/locales.
3. Launch one controlled direct-offer cohort test (`member-rate` vs control).
4. Start cancellation reason coding with standardized taxonomy.
5. Review KPI thresholds on Day 7 and Day 14; trigger re-forecast if any hard gate fails.

## 5) Assumption Register (with confidence tags)

| Assumption | Confidence | Evidence / basis | Impact if wrong |
|---|---|---|---|
| 90-day demand can recover toward historical shoulder-to-peak pattern | Medium | 2025-02..2025-05 baseline + strong macro demand in S2 pack | Revenue bands overstate achievable bookings |
| Direct share can rise from ~22% to ~27% in base case | Medium | Competitor loyalty/perk patterns + S6 priority backlog | Margin and net-value gains are delayed |
| CVR can move into 1.6%-2.1% range with funnel improvements | Medium-Low | S2 priors + S6 implementation plan | P50/P90 booking bands are too optimistic |
| Paid CAC can be contained under EUR 95 in base case | Low-Medium | Retargeting/high-intent constrained spend strategy | Paid channel contribution turns negative |
| Contribution margin can reach 22% in base case | Low-Medium | Unit-econ prior corridor in S2 + assumed cancellation control | Forecasted value creation is overstated |
| Measurement readiness is sufficient for 14-day gating | Medium | 2026-02-13 measurement verification doc | Forecast remains hypothesis-grade beyond Day 14 |

## 6) Source List

Internal (primary):
- `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md`
- `docs/business-os/strategy/BRIK/data/net_value_by_month.csv`
- `docs/business-os/strategy/BRIK/data/bookings_by_month.csv`
- `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`
- `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`
- `docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`

External references reused from active S2/S6 evidence set (accessed 2026-02-13):
- https://www.istat.it/en/archivio/299062
- https://www.bancaditalia.it/pubblicazioni/indagine-turismo-internazionale/2025-indagine-turismo-internazionale/statistiche_ITI_04072025.pdf?language_id=1
- https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20251020-1
- https://www.hostelworldgroup.com/sites/default/files/2025-03/Hostelworld%20FY24%20Annual%20Report.pdf
- https://www.booking.com/genius.html
- https://www.airbnb.com/help/article/1857
- https://www.meininger-hotels.com/en/meininger-club/
- https://www.aohostels.com/en/aoclub/
- https://www.st-christophers.co.uk/rewards

## 7) Next Recalibration Trigger

Run `forecast-recalibration` as soon as either condition is met:
- first complete 14-day measured data window is available, or
- any hard decision gate in section 4 fails.

Target recalibration artifact path:
- `docs/business-os/strategy/BRIK/2026-02-27-forecast-recalibration.user.md`
