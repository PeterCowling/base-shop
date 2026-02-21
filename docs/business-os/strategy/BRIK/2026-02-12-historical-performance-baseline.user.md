---
Type: Historical-Performance-Baseline
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
Source-Prompt: docs/business-os/strategy/BRIK/2026-02-12-historical-baseline-prompt.user.md
---

# BRIK Historical Performance Baseline

## A) Data Coverage Summary

| Source family | Coverage status | What is observed in repo | Confidence |
|---|---|---|---|
| Net booking value (monthly) | observed | `docs/business-os/strategy/BRIK/data/net_value_by_month.csv` contains monthly values from 2024-02 to 2026-02, derived from `export_19519177.xls` and treated as net-of-cancellations per operator confirmation. | High |
| Cloudflare analytics (monthly proxies) | partial | `docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv` is present with trailing-24 month rows (2024-02..2026-01); request totals are available for 11/24 months (2025-03..2026-01). Top page/geo/device breakdowns are unavailable with current API/plan access. | Medium |
| Ops logs tied to booking issues | partial (code-level only) | Booking monitor architecture and parser logic are present, but no historical operational incident dataset is committed. | Medium |

Notes:
- Scope for this run is intentionally narrowed to net monthly value + Cloudflare proxies.
- Bookings/cancellations/gross-value datasets are out-of-scope for this run.
- Baseline is `Active` with partial Cloudflare coverage; this is sufficient for directional trend work but not full channel attribution.

## B) Historical Monthly Baseline Table

Scope: trailing 24 complete months relative to run date (2024-02 to 2026-01).

| Month | Net Booking Value | Cloudflare Proxy | Metric Status |
|---|---:|---|---|
| 2024-02 | 17934.65 | unavailable | observed net value only |
| 2024-03 | 46615.13 | unavailable | observed net value only |
| 2024-04 | 86892.32 | unavailable | observed net value only |
| 2024-05 | 91610.90 | unavailable | observed net value only |
| 2024-06 | 104807.43 | unavailable | observed net value only |
| 2024-07 | 90304.64 | unavailable | observed net value only |
| 2024-08 | 75758.66 | unavailable | observed net value only |
| 2024-09 | 43348.01 | unavailable | observed net value only |
| 2024-10 | 15946.00 | unavailable | observed net value only |
| 2024-11 | 4120.47 | unavailable | observed net value only |
| 2024-12 | 7794.72 | unavailable | observed net value only |
| 2025-01 | 21964.53 | unavailable | observed net value only |
| 2025-02 | 28646.47 | unavailable | observed net value only |
| 2025-03 | 46193.54 | 0 requests | observed net value + low-confidence CF proxy |
| 2025-04 | 64471.32 | 59517 requests | observed net value + CF proxy |
| 2025-05 | 73571.33 | 186375 requests | observed net value + CF proxy |
| 2025-06 | 81317.03 | 178931 requests | observed net value + CF proxy |
| 2025-07 | 69696.17 | 193045 requests | observed net value + CF proxy |
| 2025-08 | 69100.15 | 166471 requests | observed net value + CF proxy |
| 2025-09 | 37049.13 | 127495 requests | observed net value + CF proxy |
| 2025-10 | 15827.30 | 139752 requests | observed net value + CF proxy |
| 2025-11 | 3118.65 | 107349 requests | observed net value + CF proxy |
| 2025-12 | 7618.52 | 155296 requests | observed net value + CF proxy |
| 2026-01 | 18190.62 | 137729 requests | observed net value + CF proxy |

Additional latest partial month (not included in trailing-24 baseline):
- 2026-02 net booking value (partial): 13,316.63

## C) KPI Trend Highlights

- Trailing 24 complete months total net value: 1,121,897.69 (avg 46,745.74/month).
- Seasonality pattern is visible in net value only: peak month 2024-06 at 104,807.43 and trough month 2025-11 at 3,118.65.
- Comparable season window decline: Jun-Aug 2025 net value (220,113.35) vs Jun-Aug 2024 (270,870.73), down 18.74%.
- Comparable Feb-Dec window decline: 2025 net value (496,609.61) vs 2024 (585,132.93), down 15.13%.
- Cloudflare request proxies are now available for 11/24 months (2025-03..2026-01), totaling 1,451,960 requests in that window; highest observed month is 2025-07 (193,045 requests).
- Net value vs request totals is only weak-to-moderate correlated in available months (`r ~= 0.37` across 2025-04..2026-01), so decisions should treat request totals as directional proxies, not conversion truth.

## D) Data Quality + Blind Spots Register

| Metric family | Current quality | Evidence type | Blind spot | Confidence |
|---|---|---|---|---|
| Net booking value | observed | `net_value_by_month.csv` + provenance note | Derived from booking export with dedupe assumptions; no independent reconciliation file yet | High |
| Cloudflare traffic proxies | partial | `cloudflare_monthly_proxies.csv` + extraction notes | 13/24 months are unavailable due retention/access limits; host filter was not applied to request totals; page/geo/device breakdowns unavailable | Medium |
| Channel/source split | unavailable (out-of-scope this run) | not requested in narrowed run | Cannot attribute demand/mix shifts, paid/organic split, or landing-page drivers | Medium |
| Ops reliability signals | partial | architecture docs/code only | No historical incident/event dataset committed | Medium |

## E) Decision Implications (Next 90 Days)

1. Revenue-shape decisions can start immediately using observed net monthly value trend and seasonality.
2. Growth-channel and site-performance decisions can now use monthly Cloudflare request proxies for the recent window (2025-03..2026-01), but must not treat them as precise host-level traffic due extraction constraints.
3. Near-term planning should assume demand softness vs prior-year comparable months (notably summer and Feb-Dec windows) and prioritize conversion-focused initiatives.
4. GA4 and Search Console setup is now the highest-value data gap to close; Cloudflare alone cannot provide funnel, source attribution, or conversion quality.

## F) Missing-Data Acquisition Checklist

1. Done: export trailing 24 months of Cloudflare proxies for BRIK domain(s) to:
   - `docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv`
   - `docs/business-os/strategy/BRIK/data/data_quality_notes.md`
2. Next: configure GA4 + Search Console and confirm tracking in production pages.
3. Next: re-run Cloudflare proxy export monthly (rolling 24 months) and refresh this baseline.
4. Optional quality upgrade: add higher-fidelity host-level/page/geo/device metrics if API plan/access allows.

## Evidence References

- `docs/business-os/strategy/BRIK/data/net_value_by_month.csv`
- `docs/business-os/strategy/BRIK/data/net_value_by_month.meta.md`
- `docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv`
- `docs/business-os/strategy/BRIK/data/data_quality_notes.md`
- `docs/business-os/strategy/BRIK/2026-02-12-historical-baseline-prompt.user.md`
- `docs/business-os/strategy/BRIK/2026-02-12-historical-data-request-prompt.user.md`
- `apps/brikette-scripts/README.md`
- `apps/brikette-scripts/src/booking-monitor/_RunBookingMonitor.gs`
