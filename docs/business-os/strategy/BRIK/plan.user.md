---
Type: Business-Plan
Status: Active
Business: BRIK
Created: 2026-02-09
Updated: 2026-02-17
Last-reviewed: 2026-02-17
Owner: Pete
---

# Brikette — Business Plan

## Business overview

Brikette is a physical hostel in Positano on the Amalfi Coast. The ambition is to be the most expensive hostel in the world while remaining very busy — premium pricing justified by exceptional quality across every dimension: comfortable rooms, great common areas, great staff and service, organised activities, and deep local knowledge delivered to guests. This is not a budget product with an inflated price; it is a genuinely excellent hospitality product that earns its premium.

Revenue lines, all part of the same physical hospitality business:

- **Hostel bookings** — room nights across 11 rooms in a multi-locale market, currently sold via OTA and direct
- **Experiences and activities** — organised activities and local knowledge as a product, not a free add-on
- **StepFree Chiesa Nuova apartment** — a 100sqm apartment adjacent to the hostel (new for 2026), targeting couples, listed on Booking.com only so far

The digital platform (brikette website, content guides, reception app) is infrastructure that supports the physical business — it is not the business itself.

## Strategy

### Current Focus (2026-02-17)

1. **L3 Transition: Reception Infrastructure** (Priority: High)
   - Status: Building reception app with live till, loan items, shift management; addressing Firebase prerender errors and client boundary issues
   - Next: Complete BRIK-ENG-0018 (Dashboard Upgrade Aggregator) to unify reception metrics

2. **Analytics & Visibility Gap** (Priority: High)
   - Status: GA4 admin settings are verified (referral exclusion and cross-domain suggestions reviewed), and debug validation confirms `begin_checkout` can fire under consent-granted test conditions
   - Next: Verify non-zero handoff event counts in standard Data API windows and complete governance runbook (`handoff_to_engine`, conversion mapping, weekly review cadence)

3. **Content Commerce Maturity** (Priority: Medium)
   - Status: 168+ guides across 18 locales operational; Cloudflare staging deployed (staging.brikette-website.pages.dev)
   - Next: Validate guide translation quality, establish content update workflow

4. **Booking Funnel Recovery (Octorate Last-Mile Model)** (Priority: High)
   - Status: Fact-find and sequenced plan completed with no-API scope confirmed (`BRIK-ENG-0021`)
   - Next: Execute foundation tasks in validated order: native `handoff_to_engine` emission (`TASK-05A`) -> same-tab normalization (`TASK-03`) -> GA4 governance parity (`TASK-06`) -> overlap-window reconciliation calibration (`TASK-08`)

## Startup-Loop Outcome Contract (Canonical)

Promoted from:
- `docs/business-os/startup-baselines/BRIK-forecast-seed.user.md`
- `docs/business-os/strategy/BRIK/2026-02-13-startup-loop-90-day-forecast-v1.user.md`
- `docs/business-os/strategy/BRIK/2026-02-13-prioritization-scorecard.user.md`

- Outcome-ID: `BRIK-OUT-2026Q2-01`
- Outcome statement: Grow Brikette's net booking value and revenue per available bed over the next 90 days — establishing the measurement and operational foundation needed to price, fill, and operate at the premium level the product ambition demands.
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

- **Measurement Signal Quality Incomplete** (Severity: Medium, Added: 2026-02-09, Updated: 2026-02-17)
  - Source: Event firing is observable in debug sessions, but standard report windows still show inconsistent/zero handoff coverage for decision use
  - Impact: Traffic baseline exists, but conversion decisioning remains partially blind until report-layer handoff visibility stabilizes
  - Mitigation: ship native `handoff_to_engine` instrumentation, validate in bounded windows, and enforce a weekly GA4 governance checklist

- **Booking Completion Attribution Gap (No API/Webhook Access)** (Severity: Medium, Added: 2026-02-17)
  - Source: Octorate API/webhook onboarding is unavailable in this phase; deterministic join key closure is not yet feasible
  - Impact: End-to-end revenue attribution is probabilistic and can lag operational decisions
  - Mitigation: run no-API reconciliation (aggregate + probabilistic) weekly with explicit confidence thresholds and caveat labeling

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
