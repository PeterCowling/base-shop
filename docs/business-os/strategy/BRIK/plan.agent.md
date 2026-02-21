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
  - Source: 168+ guides × 18 locales = 3,024 guide pages; structure-first translation workflow established but quality gates unvalidated at scale
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

### Traffic & Engagement (Established: 2026-02-09)

- **Monthly Active Users:** Not measured
  - Target: Establish baseline, then 10% MoM growth
  - Measurement: Google Analytics (`G-2ZSYXG8R7T` live; baseline extraction pending 7-day window)

- **Guide Pageviews:** Not measured
  - Target: Track engagement with 168+ guides
  - Measurement: Google Analytics + Search Console

### Conversion (Established: 2026-02-09)

- **Booking Conversion Rate:** Not measured
  - Target: Establish baseline, industry standard is 2-3%
  - Measurement: GA ecommerce tracking (`begin_checkout` verification pending in Realtime/DebugView)

### Content Quality (Established: 2026-02-09)

- **i18n Parity Score:** Passing (strict-mode audit; last verified manually — re-run command below to confirm)
  - Target: 100% structural parity across 18 locales
  - Measurement: `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`
