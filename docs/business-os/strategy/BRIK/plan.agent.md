---
Type: Business-Plan
Status: Active
Business: BRIK
Created: 2026-02-09
Updated: 2026-02-13
Last-reviewed: 2026-02-13
Owner: Pete
---

# Brikette — Business Plan

## Strategy

### Current Focus (2026-02-13)

1. **L3 Transition: Reception Infrastructure** (Priority: High)
   - Status: Building reception app with live till, loan items, shift management; addressing Firebase prerender errors and client boundary issues
   - Next: Complete BRIK-ENG-0018 (Dashboard Upgrade Aggregator) to unify reception metrics

2. **Analytics & Visibility Gap** (Priority: High)
   - Status: GA4 config is live in production (`G-2ZSYXG8R7T`), GA collect hits are observed, and Search Console verification/sitemap checks pass (`docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md`)
   - Next: Confirm `web_vitals` + `begin_checkout` in GA4 Realtime/DebugView and capture first 7-day baseline metrics in this plan

3. **Content Commerce Maturity** (Priority: Medium)
   - Status: 168+ guides across 18 locales operational; Cloudflare staging deployed (staging.brikette-website.pages.dev)
   - Next: Validate guide translation quality, establish content update workflow

## Risks

### Active Risks

- **Measurement Signal Quality Incomplete** (Severity: Medium, Added: 2026-02-09, Updated: 2026-02-13)
  - Source: Core GA4/Search Console setup is live, but event-level verification (`web_vitals`, `begin_checkout`) is not yet confirmed in GA4 UI
  - Impact: Traffic signal exists, but conversion and performance decisioning is still partially blind
  - Mitigation: Complete GA4 DebugView/Realtime verification and record first weekly KPI baseline

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
