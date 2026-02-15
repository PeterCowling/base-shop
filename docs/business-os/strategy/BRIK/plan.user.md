---
Type: Business-Plan
Status: Active
Business: BRIK
Created: 2026-02-09
Updated: 2026-02-14
Last-reviewed: 2026-02-14
Owner: Pete
---

# Brikette — Business Plan

## Strategy

### Current Focus (2026-02-13)

1. **L3 Transition: Reception Infrastructure** (Priority: High)
   - Status: Building reception app with live till, loan items, shift management; addressing Firebase prerender errors and client boundary issues
   - Next: Complete BRIK-ENG-0018 (Dashboard Upgrade Aggregator) to unify reception metrics

2. **Analytics & Visibility Gap** (Priority: High)
   - Status: GA4 config is live in production (`G-2ZSYXG8R7T`), Data API access is now working, and first 7-day baseline is locked (sessions/users/page_view measured)
   - Next: Verify report-layer non-zero `begin_checkout` after deployment propagation and close `web_vitals` verification path

3. **Content Commerce Maturity** (Priority: Medium)
   - Status: 168+ guides across 18 locales operational; Cloudflare staging deployed (staging.brikette-website.pages.dev)
   - Next: Validate guide translation quality, establish content update workflow

## Startup-Loop Outcome Contract (Canonical)

Promoted from:
- `docs/business-os/startup-baselines/BRIK-forecast-seed.user.md`
- `docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md`
- `docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md`

- Outcome-ID: `BRIK-OUT-2026Q2-01`
- Outcome statement: Stabilize and grow BRIK net booking value over the next 90 days by improving conversion quality, direct-share economics, and cancellation control under measured weekly decisioning.
- Baseline (2026-02-13):
  - trailing 90-day net booking value (2025-11..2026-01): EUR 28,927.79
  - trailing 90-day bookings (2025-11..2026-01): 100
  - direct booking share (same window): 18%
  - paid CAC: not measured at decision-grade quality
- Operational data baseline (2026-02-14):
  - Octorate calendar export: Mar 2025 - Oct 2026 (18 months, 612 date rows)
  - Room inventory: 11 total rooms (9 numbered: 3-6, 8-12; 2 year-named: 2022-7, 2025-14)
  - Data sheets: Price, Availability, Length of stay, Real availability
  - Source: `data/octorate/octorate-calendar-2026-02-14.xlsx` + metadata JSONs
  - Automation: ✅ Fully automated via `packages/mcp-server/octorate-export-final-working.mjs`
  - Protocol: `docs/business-os/startup-loop/octorate-data-collection-protocol.md`
- Target (90 days, by 2026-05-13):
  - net booking value: EUR 205,200 (forecast P50)
  - bookings: 760 (forecast P50)
  - direct booking share: 27% (forecast P50)
  - paid CAC: <=EUR 95 by day 14 and <=EUR 90 by day 60-90
- Leading indicators (weekly):
  - tracked sessions
  - session-to-booking CVR
  - paid CAC and spend efficiency
  - direct share vs OTA share
  - booking-step p75 performance
  - cancellation reason coding coverage
- Decision link: `DEC-BRIK-02` (whether BRIK has recovered into a reliable positive trend and can scale controlled growth investments)

### Guardrails

- If CVR <1.2% after >=5,000 sessions, hold spend expansion and prioritize funnel fixes.
- If paid CAC >EUR 130 for 7 consecutive days, reduce to retargeting-only mode.
- If direct share <20% by day 14, accelerate member-rate/perk experiment and re-check margin impact.
- If booking-step p75 load >3.0s for 3 consecutive days, freeze offer experiments until performance is restored.

## Risks

### Active Risks

- **Measurement Signal Quality Incomplete** (Severity: Medium, Added: 2026-02-09, Updated: 2026-02-13)
  - Source: First 7-day GA4 baseline is measured and production deploy alignment is complete, but current 7-day report still shows `begin_checkout=0` and `web_vitals=0`
  - Impact: Traffic baseline exists, but conversion and performance decisioning remain partially blind until report-layer confirmation stabilizes
  - Mitigation: Re-run bounded GA4 extracts after propagation window, verify non-zero `begin_checkout`, and close `web_vitals` verification with weekly refresh discipline

- **Translation Quality Unknown** (Severity: Medium, Added: 2026-02-09)
  - Source: 168+ guides x 18 locales = 3,024 guide pages; structure-first translation workflow established but quality gates unvalidated at scale
  - Impact: Potential SEO penalties, user trust issues, booking conversion impact
  - Mitigation: Run strict-mode i18n audit, spot-check high-traffic guides, establish ongoing quality monitoring

- **Reception App Stability** (Severity: Medium, Added: 2026-02-09)
  - Source: Recent Firebase prerender errors, client boundary issues (SafeDataContext, TillShiftProvider, Live.tsx, Till.tsx)
  - Impact: Reception staff workflow disruption, manual fallback required
  - Mitigation: Comprehensive error boundary strategy, server/client separation enforcement, monitoring

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Metrics

### First 7-Day Measured Baseline (Locked: 2026-02-13)

Window source:
- GA4 Data API `runReport`
- Window queried: `7daysAgo..today` on 2026-02-13 (property timezone)
- Evidence note: `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`

| KPI | Value | Interpretation |
|---|---:|---|
| Sessions | 73 | Initial traffic baseline established |
| Total users | 53 | Initial unique-user baseline established |
| Total event count | 563 | Event collection active overall |
| `page_view` events | 258 | Page-level tracking active |
| `user_engagement` events | 145 | Engagement signal present |
| `begin_checkout` events | 0 | Booking-funnel signal currently absent in GA4 window |
| `web_vitals` events | 0 | Performance telemetry signal currently absent in GA4 window |
| Conversions | 0 | No conversion events recorded in current 7-day window |
| Session-to-booking proxy CVR (`begin_checkout/sessions`) | 0.00% | Fails decision-grade funnel threshold |

### Traffic & Engagement (Established: 2026-02-09, Updated: 2026-02-13)

- **7-day sessions baseline:** 73
  - Target: Weekly growth with stable quality signals
  - Measurement: GA4 Data API (`7daysAgo..today` query, locked 2026-02-13)

- **7-day users baseline:** 53
  - Target: Establish stable week-over-week user growth trend
  - Measurement: GA4 Data API (`7daysAgo..today` query, locked 2026-02-13)

- **Guide Pageviews:** Partially measured (`page_view` aggregate only)
  - Target: Track guide-specific engagement with route-level breakdown
  - Measurement: GA4 page-level reports + Search Console

### Conversion (Established: 2026-02-09, Updated: 2026-02-13)

- **Booking conversion rate (sessions -> conversions):** 0.00% in first measured 7-day window
  - Target: Establish reliable non-zero baseline, then move toward 2-3% range
  - Measurement: GA4 conversions/sessions

- **`begin_checkout` booking intent signal:** 0 events in first measured 7-day window
  - Target: Non-zero weekly event volume with payload integrity
  - Measurement: GA4 event counts + DebugView/Realtime verification

### Content Quality (Established: 2026-02-09)

- **i18n Parity Score:** Passing (strict-mode audit; last verified manually — re-run command below to confirm)
  - Target: 100% structural parity across 18 locales
  - Measurement: `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`
