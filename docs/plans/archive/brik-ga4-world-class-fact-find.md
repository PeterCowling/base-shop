---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Mixed
Created: 2026-02-12
Last-updated: 2026-02-12
Feature-Slug: brik-ga4-world-class
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-ga4-world-class-plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-004
---

# World-Class GA4 Setup — Fact-Find Brief

## Scope

### Summary

Upgrade Brikette's GA4 implementation from basic client-side gtag tracking to a world-class measurement system. The current setup has excellent Web Vitals tracking and SEO infrastructure but critical gaps in GDPR consent compliance, e-commerce conversion measurement, user engagement tracking, and remarketing capabilities. This is a multi-deliverable project: code changes (consent mode, custom events, gtag upgrade) + GA4 Admin API configuration (audiences, dimensions, metrics, Measurement Protocol secret) + business decisions (CMP selection, Google Ads linking).

### Goals

- **GDPR compliance**: Implement Consent Mode v2 with cookie banner — mandatory for EU/Italian visitors
- **Conversion measurement**: Close the purchase tracking gap (users redirect to Octorate)
- **Engagement depth**: Track site search, outbound clicks, 404 errors, scroll milestones
- **Remarketing foundation**: Create audiences for Google Ads retargeting
- **Data quality**: Filter internal traffic, upgrade gtag loading, register all custom dimensions/metrics
- **Revenue attribution**: Enable full e-commerce funnel from view_item through purchase

### Non-goals

- Server-side GTM (cost/complexity not justified at current traffic levels)
- BigQuery export (can add later; not blocking)
- Google Ads campaign setup (separate workstream; we just need the GA4↔Ads link)
- Mobile app tracking / Firebase integration
- A/B testing infrastructure

### Constraints & Assumptions

- Constraints:
  - Must comply with EU GDPR and Italian privacy regulations (Garante per la protezione dei dati personali)
  - Consent Mode v2 must be implemented before any GA4 data can be trusted for EEA visitors
  - Purchase events depend on Octorate webhook or redirect-back capability (needs investigation)
  - Google Ads linking requires manual access to Google Ads account (cannot be done via GA4 Admin API alone)
  - Search Console linking requires manual verification in GSC UI
  - Cookie banner must not degrade Core Web Vitals (LCP, CLS)
- Assumptions:
  - Octorate provides some mechanism (webhook, redirect URL parameter, or booking confirmation page) to capture completed bookings
  - The existing `ga4-automation-bot` service account has sufficient permissions for all Admin API operations

## Evidence Audit (Current State)

### GA4 Property Configuration

**Property:** `properties/474488225` ("Hostel")
- **Measurement ID:** `G-2ZSYXG8R7T`
- **Industry:** Travel | **TZ:** Europe/Rome | **Currency:** EUR
- **Service Level:** Standard (free)
- **Data Retention:** 14 months, reset on new activity
- **Attribution:** Data-driven (Paid & Organic), 30-day acquisition / 90-day conversion lookback
- **Enhanced Measurement:** ALL 7 features enabled (scroll, outbound clicks, site search, video, file downloads, form interactions, page changes)

**Custom Dimensions (6):**
| Name | Parameter | Scope | Purpose |
|------|-----------|-------|---------|
| Metric Rating | `metric_rating` | EVENT | Web Vitals |
| Navigation Type | `navigation_type` | EVENT | Web Vitals |
| Metric ID | `metric_id` | EVENT | Web Vitals |
| Metric Delta | `metric_delta` | EVENT | Web Vitals |
| Metric Value | `metric_value` | EVENT | Web Vitals |
| Apartment Event Source | `source` | EVENT | Apartment funnel (just added) |

**Custom Metrics:** None

**Conversion Events (4):**
| Event | Type | Created |
|-------|------|---------|
| `purchase` | Default | 2025-01-23 |
| `begin_checkout` | Custom | 2026-02-12 |
| `click_check_availability` | Custom | 2026-02-12 |
| `click_whatsapp` | Custom | 2026-02-12 |

**Audiences (2):** All Users, Purchasers (both default)

**Missing integrations:** No Google Ads link, no Search Console link, no Measurement Protocol secret, no Firebase link

### Entry Points

- `apps/brikette/src/app/layout.tsx:102-119` — GA4 script injection (raw `<script>` tags, `dangerouslySetInnerHTML`)
- `apps/brikette/src/config/env.ts:80-83` — `GA_MEASUREMENT_ID` from `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `apps/brikette/src/performance/reportWebVitals.ts` — Web Vitals → GA4 event pipeline
- `apps/brikette/src/hooks/useWebVitals.ts` — React hook for lazy Web Vitals init
- `apps/brikette/src/utils/trackApartmentEvent.ts` — Apartment-specific GA4 event utility

### Key Modules / Files

**Analytics infrastructure:**
- `layout.tsx:102-119` — gtag.js loading (conditionally, `IS_PROD && GA_MEASUREMENT_ID`)
- `reportWebVitals.ts` — Sends LCP, CLS, INP via `gtag("event", "web_vitals", {...})`
- `trackApartmentEvent.ts` — Type-safe apartment event tracker with `window.gtag` null-safety
- `PlanChoiceAnalytics.tsx` — Uses `dataLayer.push()` (different pattern from gtag)

**Booking flows (e-commerce):**
- `apps/brikette/src/app/[lang]/apartment/book/ApartmentBookContent.tsx:56-66` — `begin_checkout` with currency + items
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx:118-125` — `begin_checkout` for hostel rooms

**Search (not tracked):**
- `apps/brikette/src/lib/search/guide-search.ts` — BM25 full-text search, no GA4 `search` event

**404 (not tracked):**
- `apps/brikette/src/app/not-found.tsx` — Silently redirects to `/{lang}`, no error event

**Cookie policy (informational only):**
- Cookie policy page exists at `/cookie-policy/` in all 18 languages — informational text, no consent collection

**Scroll tracking (infrastructure only):**
- `apps/brikette/src/hooks/useScrollProgress.ts` — Tracks scroll position for UI (header behavior), not connected to GA4

### Patterns & Conventions Observed

- **gtag wrapper pattern:** `trackApartmentEvent()` wraps `window.gtag` with type safety and null checks — evidence: `trackApartmentEvent.ts:15-23`
- **dataLayer pattern:** `PlanChoiceAnalytics.tsx` uses `window.dataLayer.push()` directly (inconsistent with gtag wrapper)
- **Production gate:** Both `reportWebVitals.ts` and `layout.tsx` gate on `IS_PROD` before emitting events
- **No consent gate:** Neither gtag config nor events check user consent before firing
- **E-commerce item shape:** `{ item_id, item_name, item_category }` — missing `price`, `quantity`, `value`

### Data & Contracts

- Types/schemas:
  - `ApartmentEventName` type: `"click_check_availability" | "click_whatsapp" | "video_play_stepfree_route"` — `trackApartmentEvent.ts:3`
  - `EventParams`: `Record<string, string | number | boolean>` — generic params
  - `Metric` from `web-vitals` library: `id`, `name`, `value`, `delta`, `rating`, `navigationType`
- Persistence:
  - No server-side analytics storage; all events go to GA4 via client-side gtag
- API/event contracts:
  - GA4 Measurement Protocol (not yet used) would enable server-side `purchase` events
  - Octorate booking API — needs investigation for webhook/callback availability

### Dependency & Impact Map

- Upstream dependencies:
  - `web-vitals` npm package (for CWV tracking)
  - Google gtag.js CDN (`googletagmanager.com/gtag/js`)
  - GA4 property `G-2ZSYXG8R7T`
  - Service account: `.secrets/ga4/brikette-web-2b73459e229a.json` (GA4 Admin API)
- Downstream dependents:
  - GA4 reports/dashboards (not yet configured)
  - Future Google Ads remarketing (depends on audiences + Ads link)
  - Future BigQuery export (not yet enabled)
- Likely blast radius:
  - **Consent Mode v2:** Affects ALL pages — cookie banner renders globally in `layout.tsx`
  - **gtag upgrade:** `layout.tsx` change — affects all page loads
  - **Custom events:** Scoped to specific pages/components (low blast radius per event)
  - **GA4 Admin API changes:** Zero code blast radius (API-only configuration)

### Delivery & Channel Landscape

- Audience/recipient: All hostel-positano.com visitors (12k/month), with special handling for EEA visitors (consent)
- Channel constraints:
  - GA4 Admin API: accessible via service account (verified)
  - Google Ads: requires manual account access (decision needed on who links)
  - Search Console: requires manual domain verification
  - CMP/cookie banner: must integrate with existing Next.js App Router layout
- Existing templates/assets:
  - Cookie policy page exists in 18 languages (content-ready, needs consent UX)
  - `trackApartmentEvent.ts` as template for other event trackers
- Approvals/owners:
  - CMP selection: Pete (business decision on free vs paid CMP)
  - Google Ads linking: Pete (requires Ads account access)
  - Octorate webhook: Pete (requires Octorate admin access to check)
- Compliance constraints:
  - GDPR: analytics_storage and ad_storage must default to "denied" for EEA visitors
  - Italian Garante: cookie banner must meet Italian transparency requirements
  - Consent must be granular (analytics vs advertising vs functional)
- Measurement hooks:
  - GA4 realtime reports can verify events immediately after deployment
  - DebugView in GA4 can verify consent mode behavior

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Consent Mode v2 will preserve conversion modeling for denied-consent EEA visitors | CMP implemented correctly | €0 (test with GA4 DebugView) | 1 day |
| H2 | Octorate provides a mechanism to capture completed bookings | Octorate admin access | €0 (check Octorate docs/admin) | 1 hour |
| H3 | Cookie banner won't degrade CWV scores (LCP/CLS) | Lightweight CMP choice | €0 (Lighthouse before/after) | 1 day |
| H4 | Remarketing audiences will reach sufficient size for Google Ads | Traffic volume (12k/month) | €0 (check after 30 days) | 30 days |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence |
|-----------|-------------------|--------|------------|
| H1 | Google docs confirm Consent Mode v2 models conversions from denied consent | Google official docs | High |
| H2 | None — untested; Octorate integration exists for availability but booking callbacks unknown | - | None |
| H3 | CookieYes/CookieConsent lightweight options documented as CWV-safe | Web research | Medium |
| H4 | 12k monthly visitors; GA4 needs ~1000 users in audience for Ads targeting | Cloudflare analytics | Medium |

#### Falsifiability Assessment

- **Easy to test:** H1 (GA4 DebugView), H3 (Lighthouse comparison)
- **Quick to verify:** H2 (check Octorate admin panel for webhook/redirect settings)
- **Deferred validation:** H4 (requires 30 days of audience accumulation post-deployment)

#### Recommended Validation Approach

- **Quick probes:** H2 (check Octorate admin — do this before planning purchase tracking tasks)
- **Structured tests:** H1, H3 (implement consent mode → verify in DebugView → measure CWV impact)
- **Deferred validation:** H4 (audience size evaluation after 30 days live)

### Test Landscape

#### Test Infrastructure

- **Frameworks:** Jest + React Testing Library (unit/component), Cypress (e2e — not heavily used for analytics)
- **Commands:** `pnpm --filter brikette test`, `pnpm --filter brikette test -- --testPathPattern=apartment`
- **CI integration:** Pre-commit hooks run lint + typecheck; CI runs full test suite
- **Coverage tools:** None configured for analytics code specifically

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `trackApartmentEvent` | unit | `ApartmentIntegration.test.tsx:71-113` | 3 tests: fires event, fires with source, no-throw when gtag missing |
| `FitCheck` | component | `FitCheck.test.tsx` | 7 tests: rendering, semantic HTML. No analytics tests |
| `reportWebVitals` | - | None | No dedicated tests for Web Vitals pipeline |
| `PlanChoiceAnalytics` | - | None | No tests for dataLayer.push pattern |
| `layout.tsx` GA4 injection | - | None | No tests for script injection or consent mode |

#### Test Patterns & Conventions

- Unit tests: Mock `window.gtag` as `jest.fn()`, verify `toHaveBeenCalledWith()` — pattern in `ApartmentIntegration.test.tsx:72-77`
- Component tests: RTL `render()` + `screen.getByText()` — standard pattern
- Test data: Inline `const` translations objects for i18n mocking

#### Coverage Gaps

- **Untested:** Consent mode initialization, cookie banner interaction, Measurement Protocol calls
- **Untested:** Web Vitals → GA4 pipeline (no mock verification that events fire)
- **Untested:** Search event tracking, 404 tracking, scroll milestone events
- **No extinct tests identified** — analytics test coverage is new (apartment tests just created)

#### Testability Assessment

- **Easy to test:** Event firing (mock `window.gtag`, assert calls) — pattern established
- **Easy to test:** GA4 Admin API operations (integration tests with real API)
- **Hard to test:** Consent Mode behavior end-to-end (requires real browser consent interaction)
- **Hard to test:** Measurement Protocol server-side events (requires Octorate webhook simulation)
- **Test seams needed:** Consent state abstraction (to mock consent granted/denied in unit tests)

#### Recommended Test Approach

- **Unit tests for:** Each new custom event tracker function, consent mode initialization logic
- **Integration tests for:** GA4 Admin API configuration script (verify dimensions/audiences created)
- **E2E tests for:** Cookie banner interaction (Cypress — consent grant/deny → verify gtag consent state)
- **Manual verification:** GA4 DebugView for consent mode, realtime reports for event flow

## External Research

- **Consent Mode v2** is mandatory for EU since Q1 2025. Without it, Google suspends conversion modeling for EEA users. Must implement `gtag('consent', 'default', {...})` BEFORE the gtag config call. — Source: Google official docs, stape.io/blog/google-consent-mode-v2
- **CMP options for Next.js:** CookieYes (free tier, auto-detected consent categories), CookieConsent (MIT OSS, lightweight ~3KB), Usercentrics (paid, enterprise). Free-tier CookieYes or OSS CookieConsent recommended for current scale. — Source: web research 2026
- **GA4 e-commerce for hotels:** Full event sequence recommended: `view_item` → `select_item` → `begin_checkout` → `purchase`. Item parameters should include `price`, `quantity` (nights), `checkin_date`, `checkout_date`. — Source: optimizesmart.com, Google Analytics dev docs
- **Measurement Protocol:** Requires API secret (created via GA4 Admin API). Events sent server-side with `measurement_id` + `api_secret` + `client_id`. Ideal for Octorate webhook → purchase event bridge. — Source: Google Analytics dev docs
- **Remarketing audiences minimum:** ~1000 users in an audience segment for Google Ads targeting. At 12k monthly visitors, achievable within 30 days for broad audiences. — Source: Google Ads docs

## Questions

### Resolved

- Q: Can the GA4 Admin API create Measurement Protocol secrets?
  - A: Yes — via `v1beta` `createMeasurementProtocolSecret` endpoint
  - Evidence: GA4 Admin API reference docs

- Q: Does enhanced measurement already track outbound clicks?
  - A: Yes — enhanced measurement has outbound click tracking enabled
  - Evidence: GA4 audit showing `streamEnabled: true` for all enhanced measurement features

- Q: Are there existing analytics tests to build on?
  - A: Yes — `ApartmentIntegration.test.tsx` has 3 GA4 tests using `window.gtag` mock pattern
  - Evidence: `apps/brikette/src/test/components/apartment/ApartmentIntegration.test.tsx:71-113`

- Q: What is the data retention setting?
  - A: 14 months with reset on new activity (maximum for free tier)
  - Evidence: GA4 Admin API audit

### Open (User Input Needed)

- Q: Which CMP/cookie banner solution to use?
  - Why it matters: Gates all consent-dependent tracking for EEA visitors
  - Decision impacted: TASK scope for consent mode implementation
  - Decision owner: Pete
  - Default assumption: Use lightweight OSS solution (e.g., `vanilla-cookieconsent` or `cookieconsent`) to minimize CWV impact + cost. Risk: May need to upgrade to paid CMP if regulatory requirements tighten.

- Q: Does Octorate support booking confirmation webhooks or redirect-back URLs?
  - Why it matters: Determines whether purchase tracking uses Measurement Protocol (webhook) or client-side redirect interception
  - Decision impacted: Purchase tracking architecture
  - Decision owner: Pete
  - Default assumption: Assume redirect-back with booking reference in URL params. If not available, purchase tracking is deferred until Octorate webhook access is confirmed. Risk: No purchase conversion data until resolved.

- Q: Do you have a Google Ads account to link?
  - Why it matters: Remarketing audiences are useless without a linked Ads account
  - Decision impacted: Whether to prioritize audience creation now or defer
  - Decision owner: Pete
  - Default assumption: Create audiences in GA4 now (zero cost); link to Ads when account is available. Risk: Audiences accumulate data from day 1 regardless.

## Confidence Inputs (for /lp-do-plan)

- **Implementation:** 82%
  - Strong: gtag patterns established, Admin API access verified, consent mode docs are clear
  - Weak: Octorate webhook/callback mechanism unknown, CMP integration with Next.js App Router untested
  - What would raise to ≥90%: Verify Octorate callback mechanism, prototype CMP in layout.tsx

- **Approach:** 85%
  - Strong: Phased P0→P1→P2 ordering is correct (compliance first, then measurement, then optimization)
  - Weak: CMP selection is a business decision not yet made
  - What would raise to ≥90%: CMP decision made, Octorate callback confirmed

- **Impact:** 78%
  - Strong: GA4 Admin API changes have zero code blast radius; event additions are scoped to specific pages
  - Weak: Consent Mode v2 + cookie banner affects ALL pages — CWV regression risk; layout.tsx is critical path
  - What would raise to ≥90%: Lighthouse CWV comparison before/after cookie banner prototype

- **Delivery-Readiness:** 72%
  - Strong: Service account works, Admin API verified, code patterns established
  - Weak: CMP not selected, Octorate callback unknown, Google Ads account status unknown
  - What would raise to ≥90%: All three open questions answered

- **Testability:** 75%
  - Strong: `window.gtag` mock pattern established, Admin API is testable
  - Weak: Consent mode E2E testing is complex, Measurement Protocol needs webhook simulation
  - What would raise to ≥90%: Consent state abstraction layer for unit testing, mock Octorate webhook fixture

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Cookie banner degrades CWV (LCP/CLS) | Medium | High | Use lightweight CMP (<5KB); defer-load banner; measure with Lighthouse before/after |
| Octorate has no webhook/callback | Medium | High | Investigate Octorate admin; fallback to periodic Measurement Protocol sync via booking feed |
| Consent Mode reduces reported conversions | Low | Medium | Expected behavior — Google models conversions from denied consent; actual conversions unchanged |
| Service account permissions insufficient for some Admin API operations | Low | Low | Already verified accounts/properties/dimensions work; audiences may need additional scope |
| Google Ads not linked — audiences accumulate but can't be used | Medium | Medium | Create audiences regardless (free); link Ads when account is ready |
| PlanChoiceAnalytics uses dataLayer.push (inconsistent pattern) | Low | Low | Refactor to use gtag wrapper in a future task; not blocking |

## Planning Constraints & Notes

- Must-follow patterns:
  - Extend `trackApartmentEvent.ts` pattern for new event utilities (type-safe, null-safe)
  - Gate events on consent state after Consent Mode v2 is implemented
  - Use `next/script` with `strategy="afterInteractive"` for gtag loading (upgrade from raw script tags)
  - All GA4 Admin API operations should be scriptable (not manual) for reproducibility
- Rollout/rollback expectations:
  - Consent Mode v2 is the most critical change — must not break existing tracking for non-EEA visitors
  - Feature flag recommended for cookie banner rollout (`NEXT_PUBLIC_CONSENT_BANNER=1`)
  - GA4 Admin API changes (dimensions, audiences, etc.) are instantly live but can be archived/deleted
- Observability expectations:
  - GA4 DebugView for verifying events post-deployment
  - GA4 Realtime reports for conversion event validation
  - Lighthouse CI for CWV regression detection on cookie banner

## Suggested Task Seeds (Non-binding)

### Phase 0: GDPR Compliance (P0)
1. **Consent Mode v2 initialization** — Add `gtag('consent', 'default', {...})` before gtag config in layout.tsx, with EEA defaults denied
2. **Cookie banner component** — Lightweight consent UI with accept/reject/customize, integrated with Consent Mode v2 `gtag('consent', 'update', {...})`
3. **gtag loading upgrade** — Migrate from raw `<script>` to `next/script strategy="afterInteractive"`

### Phase 1: GA4 Admin API Configuration (P1)
4. **Create Measurement Protocol secret** — via Admin API, store securely
5. **Register missing custom dimensions** — `room_type`, `booking_source`, `language_preference`
6. **Register custom metrics** — `nights_booked`, `booking_value`
7. **Create remarketing audiences** — "Checked availability no booking" (7d), "Engaged visitors" (30d), "Apartment interest" (30d), "Repeat visitors" (30d)

### Phase 2: Event Instrumentation (P2)
8. **Site search tracking** — Fire GA4 `search` event from guide-search.ts
9. **404/error tracking** — Fire `page_not_found` event in not-found.tsx before redirect
10. **Internal traffic filtering** — Add `traffic_type: "internal"` when running locally or from staff IPs
11. **E-commerce enrichment** — Add `price`, `quantity`, `value` to `begin_checkout` events
12. **Purchase event via Measurement Protocol** — Server-side purchase tracking from Octorate callback (depends on H2 resolution)

### Phase 3: External Integrations (P3 — manual/deferred)
13. **Google Ads linking** — Manual step in GA4 UI (requires Ads account)
14. **Search Console linking** — Manual step in GSC UI (requires domain verification)

## Execution Routing Packet

- Primary execution skill: `/lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Consent Mode v2 active with cookie banner (Lighthouse CWV comparison showing no regression)
  - All GA4 Admin API entities created and verified (dimensions, metrics, audiences, MP secret)
  - Custom events firing and visible in GA4 DebugView/Realtime
  - Purchase tracking operational (if Octorate callback confirmed)
  - All new tracking code covered by unit tests
- Post-delivery measurement plan:
  - Week 1: Verify all events in GA4 Realtime; check consent mode modeling in reports
  - Week 4: Evaluate remarketing audience sizes; confirm sufficient for Ads targeting
  - Month 3: Compare conversion rates pre/post consent mode; assess purchase tracking completeness

## Planning Readiness

- Status: **Ready-for-planning**
- Open questions are non-blocking:
  - CMP selection can be defaulted to lightweight OSS (decision during planning)
  - Octorate callback investigation can be an INVESTIGATE task in the plan
  - Google Ads linking is manual and deferred to P3
- Recommended next step: Proceed to `/lp-do-plan brik-ga4-world-class`
