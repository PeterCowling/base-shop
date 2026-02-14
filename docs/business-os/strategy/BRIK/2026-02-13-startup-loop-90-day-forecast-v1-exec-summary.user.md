---
Type: Forecast-Summary
Status: Active
Business: BRIK
Region: Europe (primary: Italy)
Created: 2026-02-13
Updated: 2026-02-13
Last-reviewed: 2026-02-13
Owner: Pete
Source-Forecast: docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md
---

# BRIK S3 Forecast v1 — Executive Summary

## Forecast Band (90 days: 2026-02-14 to 2026-05-13)

| Metric | P10 | P50 | P90 |
|---|---:|---:|---:|
| Sessions | 32,000 | 40,000 | 48,000 |
| Bookings | 512 | 760 | 1,008 |
| Net booking value (EUR) | 128,000 | 205,200 | 287,280 |
| Direct share | 22% | 27% | 32% |
| Paid CAC (EUR) | 128.57 | 85.71 | 72.73 |

## Decision Posture

- Keep base plan in `P50` posture.
- Treat paid as constrained learning spend until event coverage and funnel reliability are verified.
- Prioritize S6 P1 items: policy/fee clarity, mobile booking performance, member-offer experiment, cancellation reason coding.

## First 14-Day Gates

1. CVR >= 1.6% by day 14 (with >= 5,000 sessions).
2. Paid CAC <= EUR 95 by day 14.
3. Direct share >= 23% by day 14.
4. Booking-step p75 <= 2.5s by day 14.
5. Cancellation reason coding coverage >= 90% by day 14.

If any hard gate fails, run immediate recalibration and hold scale decisions.
