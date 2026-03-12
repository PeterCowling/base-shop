---
Type: Standing-Intelligence
Status: Active
Domain: SELL
Business: BRIK
Artifact-ID: BRIK-SELL-BOOKING-FUNNEL-HEALTH
Created: 2026-03-12
Last-updated: 2026-03-12
---

# BRIK Booking Funnel Health

Standing intelligence artifact tracking the health of the Brikette hostel booking funnel from homepage discovery through to Octorate handoff. Changes signal conversion issues, broken flows, or measurement gaps that need investigation.

## Current Health Status

**Overall: Baseline — first snapshot pending**

This artifact was created on 2026-03-12. Populate by querying GA4 analytics and running the rendered funnel audit.

## Funnel Metrics (Pre-Handoff)

<!-- Update weekly. Source: GA4 analytics via MCP analytics tools -->

### Layer 1: Discovery

| Metric | Value (7d) | Trend | Notes |
|---|---|---|---|
| Homepage views | — | — | page_view events |
| Room card impressions | — | — | view_item_list events |
| Unique visitors | — | — | GA4 active users |

### Layer 2: Intent

| Metric | Value (7d) | Trend | Notes |
|---|---|---|---|
| Search availability clicks | — | — | search_availability events |
| Room selections | — | — | select_item events |
| Booking modal opens | — | — | modal_open events (type: booking) |
| Deal code usage | — | — | Deal parameter propagation |

### Layer 3: Handoff

| Metric | Value (7d) | Target | Notes |
|---|---|---|---|
| Handoff to Octorate | — | — | handoff_to_engine events |
| Begin checkout | — | — | begin_checkout events |
| CTA location distribution | — | — | Entry attribution: surface, intent |

### Layer 4: External (Opaque)

| Metric | Value | Notes |
|---|---|---|
| Octorate confirmation | Unknown | External system, no webhook |
| Payment success | Unknown | Not integrated with brikette |
| Booking completion | Unknown | No purchase/booking_confirmed event |

## Octorate Calendar Health

<!-- Update weekly. Source: Octorate export via Playwright script -->

| Metric | Value | Notes |
|---|---|---|
| Rooms available | 11 | Numbered 3–6, 8–12 + 2 year-named dorm beds |
| Forward visibility | 18 months | Pricing and availability sheets |
| Calendar sync freshness | — | Last Playwright export date |
| Rate plans active | 2 | Non-refundable + flexible |

## Funnel Blockers

<!-- Update on audit. Source: BRIK-SELL-FUNNEL-BRIEF rendered audit -->

| Blocker | Severity | Status | Notes |
|---|---|---|---|
| Octorate header shows "Amount 0.00 EUR / Rooms 0" | Critical | Open | Trust break contradicting real data |
| Brand discontinuity at handoff | High | Open | Brikette → Octorate visual mismatch |
| Mobile CTA below fold | High | Open | Octorate Continue button not visible on first load |

## Measurement Gaps

| Gap | Impact | Remediation path |
|---|---|---|
| No booking-complete signal | Cannot close funnel loop | Octorate webhook or return callback |
| GA4 24-48h propagation delay | No real-time reporting | Accept or add BigQuery streaming |
| No cancellation coding | Cannot track drop-off reasons | Octorate API extraction |
| No room-level occupancy | Cannot optimize pricing | Calendar vs. committed comparison |

## Baseline Reference

From BRIK-SELL-WEEKLY-KPCS (7 days ending 2026-02-13):
- Sessions: 73 | Users: 53 | Page views: 258
- Conversions: 0 (zero GA4 e-commerce events in reporting window)
- Net booking value (90d trailing): EUR 28,927.79, 100 bookings, 18% direct share

## Recent Issues

- 2026-03-12: Artifact created. Funnel audit blockers from rendered audit are open.

## Data Sources

| Source | Location | Access |
|---|---|---|
| GA4 analytics | MCP tools `analytics_aggregates`, `analytics_events`, `analytics_summary` | On-demand |
| Octorate export | `packages/mcp-server/octorate-export-final-working.mjs` | Manual Playwright script |
| Octorate calendar | MCP tool `octorate_calendar_check` | On-demand |
| Rendered funnel audit | `docs/business-os/strategy/BRIK/sales/2026-03-12-brikette-sales-funnel-rendered-audit.user.md` | Standing artifact |
| Weekly KPCs | `docs/business-os/strategy/BRIK/sales/2026-02-13-weekly-kpcs-decision.user.md` | Standing artifact |
| Octorate baseline | `docs/business-os/strategy/BRIK/sales/2026-02-14-octorate-operational-data-baseline.user.md` | Standing artifact |
