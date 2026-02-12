---
Type: Plan
Status: Active
Domain: Infra
Workstream: Mixed
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: brik-ga4-world-class
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-004
---

# World-Class GA4 Setup Plan

## Summary

Upgrade Brikette's GA4 implementation from basic client-side gtag tracking to a world-class measurement system. The current setup has excellent Web Vitals tracking and recently-added apartment event tracking, but critical gaps in GDPR consent compliance (P0), event instrumentation breadth (P1), and purchase conversion measurement (P2). This plan executes in three phases: compliance first (Consent Mode v2 + cookie banner), then GA4 Admin API configuration and event instrumentation, then purchase tracking via Measurement Protocol.

## Goals

- **GDPR compliance**: Implement Consent Mode v2 with cookie banner — mandatory for EU/Italian visitors
- **Measurement depth**: Track site search, 404 errors, e-commerce enrichment, internal traffic filtering
- **GA4 configuration**: Register missing custom dimensions, custom metrics, remarketing audiences, Measurement Protocol secret
- **Conversion measurement**: Close the purchase tracking gap via Measurement Protocol (Octorate callback)
- **Code quality**: Upgrade gtag loading from raw `<script>` to `next/script`, consolidate analytics patterns

## Non-goals

- Server-side GTM (cost/complexity not justified at current scale)
- BigQuery export (can add later, not blocking)
- Google Ads campaign setup (separate workstream — we just need the link)
- Google Ads linking / Search Console linking (manual steps, deferred to P3)
- Mobile app tracking / Firebase integration
- A/B testing infrastructure

## Constraints & Assumptions

- Constraints:
  - Must comply with EU GDPR and Italian privacy regulations (Garante)
  - Consent Mode v2 must be active before GA4 data can be trusted for EEA visitors
  - Cookie banner must not degrade Core Web Vitals (LCP, CLS)
  - Purchase events depend on Octorate webhook/callback (needs investigation)
  - GA4 property: `properties/474488225`, measurement ID `G-2ZSYXG8R7T`
- Assumptions:
  - Lightweight OSS CMP (vanilla-cookieconsent) is sufficient for current scale
  - Service account at `.secrets/ga4/brikette-web-2b73459e229a.json` has sufficient permissions

## Fact-Find Reference

- Related brief: `docs/plans/brik-ga4-world-class-fact-find.md`
- Key findings:
  - Enhanced measurement already enables scroll, outbound clicks, video, file downloads, form interactions, page changes, site search
  - 6 custom dimensions (5 Web Vitals + 1 source), 0 custom metrics
  - 4 conversion events registered (purchase, begin_checkout, click_check_availability, click_whatsapp)
  - 2 default audiences only (All Users, Purchasers)
  - No Consent Mode v2, no cookie banner, no Measurement Protocol secret
  - gtag loaded via raw `<script dangerouslySetInnerHTML>` in layout.tsx:102-119
  - `trackApartmentEvent.ts` provides type-safe gtag wrapper pattern
  - `PlanChoiceAnalytics.tsx` uses inconsistent `dataLayer.push()` pattern
  - BM25 search exists in `useGuideSearch.ts` but fires no GA4 search event
  - `not-found.tsx` silently redirects with no error tracking
  - `begin_checkout` events missing `price`, `quantity`, `value` params

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/app/layout.tsx:90-124` — Root layout with GA4 script injection
  - `apps/brikette/src/utils/trackApartmentEvent.ts` — Type-safe gtag event wrapper pattern
  - `apps/brikette/src/performance/reportWebVitals.ts` — Web Vitals → GA4 pipeline
  - `apps/brikette/src/hooks/useGuideSearch.ts` — Search hook (no GA4 event)
  - `apps/brikette/src/app/not-found.tsx` — 404 handler (no GA4 event)
  - `apps/brikette/src/config/env.ts:80-83` — `GA_MEASUREMENT_ID` config
  - `.secrets/ga4/brikette-web-2b73459e229a.json` — GA4 service account
- Patterns to follow:
  - `trackApartmentEvent.ts` pattern: type-safe event name union, `window.gtag` null-safety
  - `reportWebVitals.ts` pattern: `IS_PROD` gate, `try/catch` swallow for non-critical events
  - `ApartmentIntegration.test.tsx:70-114` pattern: `window.gtag = jest.fn()` mock, `toHaveBeenCalledWith` assertions

## Proposed Approach

**Phased execution: compliance → configuration → instrumentation → purchase tracking**

- **Phase 1 (P0)**: Consent Mode v2 defaults + gtag upgrade + cookie banner — must ship as a unit to be GDPR-compliant
- **Phase 2 (P1)**: GA4 Admin API configuration (dimensions, metrics, audiences, MP secret) — zero code blast radius, scriptable
- **Phase 3 (P2)**: Event instrumentation (search, 404, e-commerce enrichment, internal traffic filtering) — scoped per-component changes
- **Phase 4 (P2)**: Purchase tracking via Measurement Protocol — depends on Octorate investigation

**CMP Decision (resolved):** Use `vanilla-cookieconsent` (MIT, ~3KB gzipped, no external dependencies). Lightweight enough to avoid CWV regression. Can upgrade to paid CMP later if regulatory requirements tighten.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| GA4-01 | INVESTIGATE | Octorate booking callback investigation | 85% | S | Pending | - | GA4-09 |
| GA4-02 | IMPLEMENT | GA4 Admin API configuration script | 90% | S | Pending | - | GA4-09 |
| GA4-03 | IMPLEMENT | Consent Mode v2 defaults + gtag upgrade | 85% | M | Pending | - | GA4-04 |
| GA4-04 | IMPLEMENT | Cookie consent banner component | 82% | M | Pending | GA4-03 | GA4-05 |
| GA4-05 | CHECKPOINT | Phase 1 checkpoint — consent + admin verified | 95% | S | Pending | GA4-02, GA4-04 | GA4-06, GA4-07, GA4-08 |
| GA4-06 | IMPLEMENT | Site search GA4 event tracking | 88% | S | Pending | GA4-05 | - |
| GA4-07 | IMPLEMENT | 404 error tracking + e-commerce enrichment | 87% | S | Pending | GA4-05 | - |
| GA4-08 | IMPLEMENT | Internal traffic filtering | 86% | S | Pending | GA4-05 | - |
| GA4-09 | IMPLEMENT | Purchase event via Measurement Protocol | 70% ⚠️ | M | Pending | GA4-01, GA4-02 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

_Generated by `/lp-sequence`. Shows which tasks can run concurrently via subagents._

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | GA4-01, GA4-02, GA4-03 | - | Independent foundation: investigate Octorate, configure Admin API, implement consent defaults |
| 2 | GA4-04 | GA4-03 | Cookie banner depends on consent mode infrastructure |
| 3 | GA4-05 (CHECKPOINT) | GA4-02, GA4-04 | Verify consent + admin before instrumenting events |
| 4 | GA4-06, GA4-07, GA4-08 | GA4-05 | Independent event instrumentation tasks |
| 5 | GA4-09 | GA4-01, GA4-02 | Purchase tracking depends on Octorate investigation + MP secret |

**Max parallelism:** 3 (Wave 1) | **Critical path:** GA4-03 → GA4-04 → GA4-05 → GA4-06/07/08 (4 waves) | **Total tasks:** 9

## Tasks

### GA4-01: Investigate Octorate booking callback mechanism

- **Type:** INVESTIGATE
- **Deliverable:** Decision memo documenting Octorate callback/webhook availability → appended to this plan's Decision Log
- **Execution-Skill:** /lp-build
- **Affects:** `[readonly] functions/api/octorate/` (existing Octorate integration for reference)
- **Depends on:** -
- **Blocks:** GA4-09
- **Confidence:** 85%
  - Implementation: 90% — Octorate integration already exists in repo; investigation is scoped
  - Approach: 85% — clear investigation path (check admin panel, docs, existing webhook code)
  - Impact: 80% — finding determines entire purchase tracking architecture
- **Blockers / questions to answer:**
  - Does Octorate support booking confirmation webhooks?
  - Does Octorate redirect back to our site after booking with a reference parameter?
  - What data is available in the callback (booking ID, room, price, dates)?
  - Can we get `client_id` from the booking flow for Measurement Protocol correlation?
- **Acceptance:**
  - Document which callback mechanism(s) Octorate supports
  - If webhook: document the payload shape and how to subscribe
  - If redirect-back: document the URL parameters available
  - If neither: document alternatives (periodic API sync, manual import)
  - Update GA4-09 confidence based on findings
- **Notes / references:**
  - Existing Octorate integration: `functions/api/octorate/`
  - Octorate API docs likely in their admin panel
  - Pete has Octorate admin access

### GA4-02: GA4 Admin API configuration script

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Reusable configuration script + verified GA4 entities
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `scripts/src/brikette/ga4-configure.ts` (new), `[readonly] .secrets/ga4/brikette-web-2b73459e229a.json`
- **Depends on:** -
- **Blocks:** GA4-05, GA4-09
- **Confidence:** 90%
  - Implementation: 95% — Admin API access verified, dimension/audience creation tested in prior session
  - Approach: 90% — scriptable configuration is the right pattern for reproducibility
  - Impact: 85% — zero code blast radius; GA4 Admin API only
- **Acceptance:**
  - Script creates missing custom dimensions: `room_type`, `booking_source`, `language_preference`
  - Script creates custom metrics: `nights_booked`, `booking_value`
  - Script creates remarketing audiences: "Checked availability no booking" (7d), "Engaged visitors" (30d), "Apartment interest" (30d), "Repeat visitors" (30d)
  - Script creates Measurement Protocol API secret (stored securely)
  - All entities verified via Admin API GET after creation
  - Script is idempotent (safe to re-run)
- **Validation contract:**
  - TC-01: Script creates 3 custom dimensions → verified via Admin API list (names + parameters match)
  - TC-02: Script creates 2 custom metrics → verified via Admin API list
  - TC-03: Script creates 4 audiences → verified via Admin API list (filter expressions correct)
  - TC-04: Script creates MP secret → secret value returned and stored
  - TC-05: Re-running script does not create duplicates → entity counts unchanged after second run
  - **Acceptance coverage:** TC-01 covers dimensions, TC-02 covers metrics, TC-03 covers audiences, TC-04 covers MP secret, TC-05 covers idempotency
  - **Validation type:** integration (real Admin API calls)
  - **Validation location/evidence:** Script execution logs + Admin API verification GETs
  - **Run/verify:** `tsx scripts/src/brikette/ga4-configure.ts`
- **Execution plan:** Red → Green → Refactor
  - **Red evidence:** _(to be captured during build)_
  - **Green evidence:** _(to be captured during build)_
  - **Refactor evidence:** _(to be captured during build)_
- **Scouts:**
  - Admin API audience creation works → verified via prior session (created dimensions + conversions successfully) → confirmed
  - Service account has `analyticsadmin` scope → verified in prior session → confirmed
- **Planning validation:**
  - Checks run: GA4 Admin API queries for current dimensions (6), metrics (0), audiences (2), and conversion events (4) — all PASS
  - Existing apartment GA4 tests: 3/3 PASS (`ApartmentIntegration.test.tsx`)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Run script once; entities are instantly live in GA4
  - Rollback: Archive/delete entities via Admin API (reversible)
- **Documentation impact:** None
- **Notes / references:**
  - Prior session: Successfully created `source` dimension and 2 conversion events via Admin API
  - Service account email: `ga4-automation-bot@brikette-web.iam.gserviceaccount.com`
  - googleapis package available in `packages/mcp-server/`

### GA4-03: Consent Mode v2 defaults + gtag upgrade

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Consent Mode v2 initialization + next/script upgrade in layout.tsx
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/layout.tsx`, `[readonly] apps/brikette/src/config/env.ts`
- **Depends on:** -
- **Blocks:** GA4-04
- **Confidence:** 85%
  - Implementation: 88% — Google Consent Mode v2 docs are clear; pattern is well-documented
  - Approach: 85% — consent defaults before config is the official Google-recommended pattern
  - Impact: 82% — modifies layout.tsx (all pages affected); must not break existing tracking for non-EEA
- **Acceptance:**
  - `gtag('consent', 'default', {...})` with all 4 parameters denied for EEA runs BEFORE `gtag('config', ...)`
  - gtag.js loaded via `next/script strategy="afterInteractive"` instead of raw `<script>` tags
  - `window.dataLayer` initialization preserved
  - Non-EEA visitors continue to have full tracking (region-specific defaults)
  - Existing Web Vitals tracking continues to work
  - Existing apartment event tracking continues to work
  - Feature flag: `NEXT_PUBLIC_CONSENT_BANNER` env var gates banner rendering (consent defaults always active)
- **Validation contract:**
  - TC-01: Consent defaults script runs before gtag config → inspect rendered HTML for script order
  - TC-02: gtag loaded via next/script → no raw `<script dangerouslySetInnerHTML>` for gtag in rendered output
  - TC-03: Non-EEA visitors — consent defaults allow analytics_storage → Web Vitals events fire normally
  - TC-04: EEA visitors — consent defaults deny analytics_storage → gtag respects denied state
  - TC-05: Existing trackApartmentEvent calls still work → `ApartmentIntegration.test.tsx` tests still pass
  - **Acceptance coverage:** TC-01/02 cover gtag upgrade, TC-03/04 cover consent mode, TC-05 covers regression
  - **Validation type:** unit + manual (DebugView for consent mode behavior)
  - **Validation location/evidence:** `apps/brikette/src/test/components/apartment/ApartmentIntegration.test.tsx`
  - **Run/verify:** `pnpm --filter brikette test -- "ApartmentIntegration"` + GA4 DebugView manual check
- **Execution plan:** Red → Green → Refactor
  - **Red evidence:** _(to be captured during build)_
  - **Green evidence:** _(to be captured during build)_
  - **Refactor evidence:** _(to be captured during build)_
- **Scouts:**
  - Next.js `next/script` supports `strategy="afterInteractive"` in App Router `<head>` → doc lookup (Next.js docs) → confirmed (supported since Next.js 13)
  - Consent Mode v2 requires all 4 parameters (ad_storage, analytics_storage, ad_user_data, ad_personalization) → doc lookup (Google official docs) → confirmed
- **Planning validation:**
  - Checks run: `pnpm --filter brikette test -- "ApartmentIntegration"` — 8/8 PASS (baseline regression gate)
  - Validation artifacts written: None (S/M effort, validation via existing tests)
  - Unexpected findings: None
- **What would make this >=90%:**
  - Prototype consent defaults in layout.tsx and verify in GA4 DebugView before full implementation
- **Rollout / rollback:**
  - Rollout: Deploy with `NEXT_PUBLIC_CONSENT_BANNER=0` initially; consent defaults are always active (safe — they only restrict, never expand tracking)
  - Rollback: Revert layout.tsx changes; consent defaults removal restores pre-change behavior
- **Documentation impact:** None
- **Notes / references:**
  - Google Consent Mode v2 reference: consent defaults must be in `<head>` before gtag config
  - Current gtag injection: `layout.tsx:102-119`

### GA4-04: Cookie consent banner component

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Cookie consent UI component using vanilla-cookieconsent
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/components/consent/CookieConsent.tsx` (new), `apps/brikette/src/app/layout.tsx`, `apps/brikette/package.json`
- **Depends on:** GA4-03
- **Blocks:** GA4-05
- **Confidence:** 82%
  - Implementation: 85% — vanilla-cookieconsent has clear React integration docs; pattern is standard
  - Approach: 82% — lightweight OSS CMP is the right choice for current scale
  - Impact: 80% — renders on all pages; CWV regression risk mitigated by library choice (<3KB gzipped)
- **Acceptance:**
  - Cookie consent banner renders on first visit (no prior consent stored)
  - Banner offers: Accept All, Reject All, Customize (analytics vs advertising)
  - Accepting analytics → `gtag('consent', 'update', { analytics_storage: 'granted' })`
  - Rejecting → consent remains denied; GA4 uses modeling for conversions
  - Consent preference persisted in cookie (revisit doesn't re-show banner)
  - Banner does not cause CLS (positioned fixed/overlay, not content-shifting)
  - Lighthouse CWV comparison: LCP delta < 100ms, CLS delta < 0.01
  - Feature-flagged via `NEXT_PUBLIC_CONSENT_BANNER` env var
- **Validation contract:**
  - TC-01: Banner renders on first visit → component mounts when no consent cookie exists
  - TC-02: Accept All → `gtag('consent', 'update')` called with all granted → verify mock
  - TC-03: Reject All → consent update NOT called (or called with denied) → verify mock
  - TC-04: Consent persisted → banner does not render on second page load
  - TC-05: CLS impact → banner uses fixed positioning → visual regression check
  - TC-06: Feature flag off → banner does not render
  - **Acceptance coverage:** TC-01 covers first visit, TC-02/03 cover consent actions, TC-04 covers persistence, TC-05 covers CWV, TC-06 covers feature flag
  - **Validation type:** unit + manual (Lighthouse before/after)
  - **Validation location/evidence:** `apps/brikette/src/test/components/consent/CookieConsent.test.tsx` (new)
  - **Run/verify:** `pnpm --filter brikette test -- "CookieConsent"` + Lighthouse comparison
- **Execution plan:** Red → Green → Refactor
  - **Red evidence:** _(to be captured during build)_
  - **Green evidence:** _(to be captured during build)_
  - **Refactor evidence:** _(to be captured during build)_
- **Scouts:**
  - vanilla-cookieconsent supports React/Next.js → doc lookup (GitHub README) → confirmed (provides React wrapper, SSR-safe)
  - vanilla-cookieconsent fires callbacks on consent change → doc lookup → confirmed (onChange/onAccept callbacks)
- **Planning validation:**
  - Checks run: Reviewed vanilla-cookieconsent docs for React compatibility and bundle size
  - Unexpected findings: None
- **What would make this >=90%:**
  - Prototype banner in dev, measure Lighthouse before/after, confirm CLS is zero
- **Rollout / rollback:**
  - Rollout: Feature-flagged; enable via `NEXT_PUBLIC_CONSENT_BANNER=1`; gradual rollout possible
  - Rollback: Set feature flag to `0`; consent defaults in GA4-03 remain active (safe degradation)
- **Documentation impact:** None
- **Notes / references:**
  - vanilla-cookieconsent: https://cookieconsent.orestbida.com/
  - Cookie policy page exists in 18 languages at `/cookie-policy/`

### GA4-05: Phase 1 checkpoint — consent + admin verified

- **Type:** CHECKPOINT
- **Depends on:** GA4-02, GA4-04
- **Blocks:** GA4-06, GA4-07, GA4-08
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on all tasks after this checkpoint
  - Reassess GA4-06, GA4-07, GA4-08, GA4-09 confidence using evidence from completed tasks
  - Confirm or revise the approach for event instrumentation phase
  - Update plan with any new findings, splits, or abandoned tasks
- **Horizon assumptions to validate:**
  - Consent Mode v2 is working correctly in GA4 DebugView (verified by GA4-03/GA4-04 evidence)
  - GA4 Admin API entities (dimensions, metrics, audiences, MP secret) are all created (verified by GA4-02 evidence)
  - Cookie banner does not degrade CWV (verified by GA4-04 Lighthouse comparison)
  - GA4-01 investigation results inform whether GA4-09 should proceed or be deferred

### GA4-06: Site search GA4 event tracking

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Fire GA4 `search` event from guide search hook
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/hooks/useGuideSearch.ts`
- **Depends on:** GA4-05
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 92% — `useGuideSearch.ts` has a clear `performSearch` callback; adding gtag call is straightforward
  - Approach: 88% — GA4 `search` event is the standard name; Enhanced Measurement may auto-detect but explicit is better
  - Impact: 85% — scoped to one hook; no blast radius beyond search functionality
- **Acceptance:**
  - GA4 `search` event fires when user performs a search with results
  - Event includes `search_term` parameter (the query)
  - Event includes `results_count` parameter (number of results)
  - Event does not fire for empty queries
  - Event fires at most once per debounced search (not on every keystroke)
  - Existing search functionality unchanged
- **Validation contract:**
  - TC-01: Search with results → `gtag("event", "search", { search_term, results_count })` fired
  - TC-02: Search with no results → event fires with `results_count: 0`
  - TC-03: Empty query → no event fired
  - TC-04: Debounced → only one event per debounce cycle (not per keystroke)
  - **Acceptance coverage:** TC-01/02 cover search events, TC-03 covers empty guard, TC-04 covers debounce
  - **Validation type:** unit
  - **Validation location/evidence:** `apps/brikette/src/test/hooks/useGuideSearch-ga4.test.ts` (new)
  - **Run/verify:** `pnpm --filter brikette test -- "useGuideSearch-ga4"`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: Deploy; search events are additive (no regression risk)
  - Rollback: Remove gtag call from hook
- **Documentation impact:** None
- **Notes / references:**
  - `useGuideSearch.ts:160-196` — `performSearch` callback is the insertion point
  - `trackApartmentEvent.ts` pattern for null-safe gtag calls

### GA4-07: 404 error tracking + e-commerce enrichment

- **Type:** IMPLEMENT
- **Deliverable:** code-change — 404 tracking event + enriched begin_checkout params
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/not-found.tsx`, `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- **Depends on:** GA4-05
- **Blocks:** -
- **Confidence:** 87%
  - Implementation: 90% — both changes are straightforward: add gtag call in not-found, add params to begin_checkout
  - Approach: 87% — `page_not_found` is a custom event (no GA4 standard for 404); `begin_checkout` params follow GA4 e-commerce spec
  - Impact: 85% — not-found.tsx is low traffic; begin_checkout changes are additive (won't break existing tracking)
- **Acceptance:**
  - 404 page fires `page_not_found` event with `page_path` before redirecting
  - `begin_checkout` in ApartmentBookContent includes `price`, `quantity` (nights), `value`, `currency`
  - `begin_checkout` in BookPageContent includes `price`, `quantity` (nights), `value`, `currency`
  - Existing begin_checkout event names and structure preserved (additive only)
- **Validation contract:**
  - TC-01: 404 page → `gtag("event", "page_not_found", { page_path })` fires before redirect
  - TC-02: Apartment begin_checkout includes `value` and `currency` params
  - TC-03: Hostel begin_checkout includes `value` and `currency` params
  - TC-04: Existing begin_checkout events still fire (regression check)
  - **Acceptance coverage:** TC-01 covers 404, TC-02/03 cover e-commerce enrichment, TC-04 covers regression
  - **Validation type:** unit
  - **Validation location/evidence:** Updated/new test files for affected components
  - **Run/verify:** `pnpm --filter brikette test -- "not-found|BookPage|ApartmentBook"`
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: Deploy; both changes are additive
  - Rollback: Revert changes
- **Documentation impact:** None
- **Notes / references:**
  - `not-found.tsx` currently silently redirects — need to fire event before `redirect()` call
  - `ApartmentBookContent.tsx:56-66` — current begin_checkout implementation

### GA4-08: Internal traffic filtering

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Add `traffic_type: "internal"` dimension for dev/staff traffic
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `apps/brikette/src/app/layout.tsx`
- **Depends on:** GA4-05
- **Blocks:** -
- **Confidence:** 86%
  - Implementation: 90% — standard GA4 pattern: set `traffic_type` via `gtag('set', ...)` or config parameter
  - Approach: 85% — environment-based detection (dev mode, `localhost`) is simplest; IP-based filtering adds complexity
  - Impact: 82% — modifies layout.tsx but only adds a parameter to existing config
- **Acceptance:**
  - When running in dev mode OR on localhost: `traffic_type: "internal"` set in gtag config
  - GA4 data filter can use `traffic_type` dimension to exclude internal traffic from reports
  - Production visitors are NOT marked as internal
  - Custom dimension `traffic_type` registered in GA4 (via GA4-02 script or manual)
- **Validation contract:**
  - TC-01: Dev environment → `traffic_type: "internal"` included in gtag config
  - TC-02: Production environment → `traffic_type` not set (or set to "external")
  - TC-03: Custom dimension registered in GA4 → Admin API list includes `traffic_type`
  - **Acceptance coverage:** TC-01/02 cover environment detection, TC-03 covers GA4 config
  - **Validation type:** unit + integration (Admin API)
  - **Validation location/evidence:** Inline test in layout test file
  - **Run/verify:** Manual inspection of rendered HTML in dev vs prod
- **Execution plan:** Red → Green → Refactor
- **Rollout / rollback:**
  - Rollout: Deploy; internal traffic filtering is additive (requires GA4 data filter setup to take effect)
  - Rollback: Remove traffic_type parameter
- **Documentation impact:** None
- **Notes / references:**
  - GA4 internal traffic filtering: create data filter in GA4 Admin → Data Settings → Data Filters
  - `traffic_type` is a standard GA4 dimension for this purpose

### GA4-09: Purchase event via Measurement Protocol

- **Type:** IMPLEMENT
- **Deliverable:** code-change — Server-side purchase event from Octorate callback
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:** `functions/api/octorate/purchase-callback.ts` (new or extension), `[readonly] functions/api/octorate/_utils.ts`
- **Depends on:** GA4-01, GA4-02
- **Blocks:** -
- **Confidence:** 70% ⚠️ BELOW THRESHOLD
  - Implementation: 75% — Measurement Protocol API is well-documented; but Octorate callback mechanism is unknown
  - Approach: 70% — depends entirely on GA4-01 investigation findings
  - Impact: 65% — touching Octorate integration path; must not break existing availability checks
- **Acceptance:**
  - When Octorate confirms a booking: `purchase` event sent to GA4 via Measurement Protocol
  - Event includes: `transaction_id`, `value`, `currency`, `items` (room/apartment details)
  - `client_id` is correlated from the original booking session (if available)
  - MP secret from GA4-02 is used for authentication
  - Event appears in GA4 Realtime → Conversions
- **Validation contract:**
  - TC-01: Octorate callback triggers purchase event → MP API returns 204
  - TC-02: Purchase event includes required e-commerce params → verified in GA4 DebugView
  - TC-03: Invalid/duplicate callback → no duplicate purchase event (idempotency)
  - TC-04: MP secret is not exposed in client-side code → server-side only
  - **Acceptance coverage:** TC-01 covers happy path, TC-02 covers params, TC-03 covers idempotency, TC-04 covers security
  - **Validation type:** integration + manual (GA4 DebugView)
  - **Validation location/evidence:** `functions/api/octorate/purchase-callback.test.ts` (new)
  - **Run/verify:** `pnpm test -- "purchase-callback"` + GA4 Realtime verification
- **Execution plan:** Red → Green → Refactor
- **What would make this >=90%:**
  - GA4-01 confirms Octorate webhook/callback mechanism with documented payload
  - Prototype MP event send with test data and verify in GA4 DebugView
- **Rollout / rollback:**
  - Rollout: Deploy callback handler; MP events are additive
  - Rollback: Disable callback route; GA4 falls back to no purchase tracking
- **Documentation impact:** None
- **Notes / references:**
  - GA4 Measurement Protocol: `POST https://www.google-analytics.com/mp/collect?measurement_id=G-XXX&api_secret=YYY`
  - Existing Octorate integration: `functions/api/octorate/`

## Risks & Mitigations

- **Cookie banner degrades CWV**: Use vanilla-cookieconsent (<3KB gzipped); lazy-load banner; measure Lighthouse before/after (GA4-04 TC-05)
- **Octorate has no callback mechanism**: GA4-01 investigation will reveal this early; fallback is periodic API sync or manual import; GA4-09 can be deferred without blocking other work
- **Consent Mode reduces reported conversions**: Expected and correct behavior — Google models conversions from denied consent; actual user conversions unchanged
- **layout.tsx is critical path**: GA4-03 modifies the root layout; extensive regression testing required; feature flag for banner enables gradual rollout
- **PlanChoiceAnalytics inconsistency**: Not addressed in this plan (low priority); separate future task to refactor to gtag wrapper pattern

## Observability

- Logging: GA4 DebugView for event verification; console.warn in dev for consent state changes
- Metrics: GA4 Realtime reports for conversion event validation; Lighthouse CI for CWV regression detection
- Alerts/Dashboards: Not applicable at current scale (manual monitoring via GA4 reports)

## Acceptance Criteria (overall)

- [ ] Consent Mode v2 active with cookie banner for EEA visitors
- [ ] GA4 Admin API entities created: 3 dimensions, 2 metrics, 4 audiences, 1 MP secret
- [ ] Site search events firing in GA4
- [ ] 404 events firing in GA4
- [ ] begin_checkout events enriched with price/value/currency
- [ ] Internal traffic filtering in place
- [ ] Purchase tracking via MP operational (if Octorate callback confirmed)
- [ ] All new code covered by unit tests
- [ ] No CWV regression from cookie banner
- [ ] Existing tracking (Web Vitals, apartment events) continues to work

## Decision Log

- 2026-02-12: CMP selection — Use `vanilla-cookieconsent` (MIT, ~3KB gzipped). Lightweight enough for current scale, no external dependencies, React wrapper available. Can upgrade to paid CMP later if needed.
- 2026-02-12: Phased execution — Compliance (P0) before instrumentation (P2) because Consent Mode v2 is a legal requirement and affects data quality for all subsequent tracking.
- 2026-02-12: GA4-09 below threshold (70%) — Acceptable; depends on GA4-01 investigation. Will be replanned after checkpoint.
