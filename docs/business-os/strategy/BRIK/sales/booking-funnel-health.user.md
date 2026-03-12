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

**Overall: Measurement limited — MCP analytics tool blocked by import error, baseline from KPCs only**

First snapshot: 2026-03-12. MCP `analytics_summary` returned `server-only` import error. Baseline from BRIK-SELL-WEEKLY-KPCS (7 days ending 2026-02-13).

## Funnel Metrics (Pre-Handoff)

<!-- Update weekly. Source: GA4 analytics via MCP analytics tools -->

### Layer 1: Discovery

| Metric | Value (7d baseline) | Trend | Notes |
|---|---|---|---|
| Homepage views | ~258 page views | — | From KPCs baseline (2026-02-13) |
| Room card impressions | — | — | view_item_list events — MCP blocked |
| Unique visitors | 53 | — | From KPCs baseline |
| Sessions | 73 | — | From KPCs baseline |

### Layer 2: Intent

| Metric | Value (7d baseline) | Trend | Notes |
|---|---|---|---|
| Search availability clicks | — | — | MCP analytics blocked |
| Room selections | — | — | MCP analytics blocked |
| Booking modal opens | — | — | MCP analytics blocked |
| Deal code usage | — | — | MCP analytics blocked |

### Layer 3: Handoff

| Metric | Value (7d baseline) | Target | Notes |
|---|---|---|---|
| Handoff to Octorate | — | — | MCP analytics blocked |
| Begin checkout | **0** | >0 | Zero in KPCs reporting window |
| CTA location distribution | — | — | MCP analytics blocked |

### Layer 4: External (Opaque)

| Metric | Value | Notes |
|---|---|---|
| Octorate confirmation | Unknown | External system, no webhook |
| Payment success | Unknown | Not integrated with brikette |
| Booking completion | Unknown | No purchase/booking_confirmed event |

**Blocker:** MCP `analytics_summary` tool returns `Cannot find package 'server-only'` import error. Analytics data requires the platform-core package to be rebuilt or the `server-only` dependency installed in the MCP server context.

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
