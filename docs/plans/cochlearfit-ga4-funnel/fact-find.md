---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI / API / Infra
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Critique-Applied: 2026-02-18
Feature-Slug: cochlearfit-ga4-funnel
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/cochlearfit-ga4-funnel/plan.md
Business-OS-Integration: off
Business-Unit: HEAD
Card-ID: none
---

# CochlearFit GA4 + Funnel Streamlining Fact-Find Brief

## Scope

### Summary

CochlearFit has a complete 6-step purchase funnel (Home → Shop → PDP → Cart → Checkout → Stripe → Thank You) but zero analytics instrumentation and several UX friction points. This brief covers two tightly coupled workstreams: (1) instrumenting GA4 Enhanced Ecommerce events across the entire funnel so attribution and conversion data are captured from day one, and (2) fixing structural funnel issues that will distort or lose analytics signal and reduce conversion rate.

`cochlearfit-deployment-readiness` is a hard dependency: placeholder Stripe Price IDs and missing inventory authority config must be resolved before GA4 purchase events can fire on real transactions. That plan is already ready-for-build; this brief assumes it completes first.

### Goals

- Full GA4 recommended ecommerce event coverage across all funnel steps (`view_item_list`, `select_item`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase`)
- **Canonical `purchase` source is server-side Measurement Protocol** on Stripe `checkout.session.completed` webhook — reliable, ad-blocker-proof, fires only on authoritative payment confirmation. Client-side Thank You page fires `purchase_confirmed_ui` (non-ecommerce) for UX-side effects (cart clear, messaging) only. This prevents double-counting revenue.
- GA4 identity stitching: `gtag('get', ...)` retrieves `client_id`, `session_id`, `session_number` at checkout initiation; these are passed through checkout payload → Stripe session metadata → webhook → MP call, so server-side purchase events join the originating session in GA4 reports.
- SPA pageview tracking: explicit `page_view` events on App Router navigation (Next.js does not auto-fire these on soft navigation).
- Consent scaffolding: Consent Mode v2 wiring before gtag loads, defaulting analytics consent to `denied` until user choice is captured. Required for EEA/Italy.
- Cart cleared after confirmed purchase (prevents phantom `add_to_cart` signals on re-entry)
- Cancel URL corrected to send users back to `/cart` not `/checkout`
- ES/DE locale build error resolved (currently breaks `generateStaticParams` for PDP)
- Thank You page upgraded: confirmed-payment copy, human-readable order reference, what-happens-next content
- Optional: collapse Cart + Checkout into a single page to reduce funnel steps

### Non-goals

- Stripe Price ID setup or inventory authority wiring (covered by `cochlearfit-deployment-readiness`)
- Post-purchase email / transactional notifications (separate scope)
- Social proof, sizing chart, FAQ expansion, contact form (UX improvements — separate iteration)
- GTM container setup (GA4 instrumented directly via gtag.js for simplicity at this scale)

### Constraints & Assumptions

- Constraints:
  - Next.js App Router — analytics must be client-side via `"use client"` components or server-side via Measurement Protocol
  - Worker is a Cloudflare Worker (no Node.js runtime); server-side GA4 must use `fetch` to GA4 MP endpoint
  - Cart state lives in React context + localStorage; no server-side cart session
  - Stripe Checkout is external (hosted page) — no client-side events fire during Stripe's own steps
- Assumptions:
  - GA4 property and Measurement ID will be supplied before build begins (not yet in repo)
  - `cochlearfit-deployment-readiness` plan ships before or in parallel with Phase 1 of this plan
  - GA4 client secret for Measurement Protocol will be stored as a Worker secret (`GA4_API_SECRET`)

---

## Evidence Audit (Current State)

### Entry Points

- `apps/cochlearfit/src/app/[lang]/page.tsx` — Home: hero CTAs (→ Shop, → Sizing), promise section, featured products via `ProductGrid`
- `apps/cochlearfit/src/app/[lang]/shop/page.tsx` — Shop: `ProductGrid` with full catalogue
- `apps/cochlearfit/src/app/[lang]/product/[slug]/page.tsx` — PDP: `ProductDetailBoundary` → `ProductDetail`
- `apps/cochlearfit/src/app/[lang]/cart/page.tsx` — Cart: `CartContents` → `CartItemRow` + `CartSummary`
- `apps/cochlearfit/src/app/[lang]/checkout/page.tsx` — Checkout: `CheckoutPanel` → `createCheckoutSession` → Stripe redirect
- `apps/cochlearfit/src/app/[lang]/thank-you/page.tsx` — Thank You: `ThankYouPanel` reads `?session_id=`, fetches session status

### Key Modules / Files

- `apps/cochlearfit/src/contexts/cart/CartContext.tsx` — Cart state (useReducer + localStorage). Exposes `addItem`, `removeItem`, `setQuantity`, `clear`. GA4 `add_to_cart` / `remove_from_cart` belong in the UI button handlers (ProductDetail add button, CartItemRow remove button), **not** in CartContext dispatch — context dispatch is also called during localStorage `hydrate` and post-purchase `clear`, which must not emit tracking events.
- `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx` — `handleCheckout` calls `createCheckoutSession(payload)` then `window.location.href = session.url`. GA4 `begin_checkout` belongs on **Checkout page mount** (when cart has items), not on button click. Button click fires the Stripe redirect CTA; a separate custom event (`checkout_redirect_initiated`) is acceptable for that signal.
- `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx` — On `paymentStatus === "paid"`, renders order summary. This component fires `purchase_confirmed_ui` (non-ecommerce event) for cart clear and UX effects. **Canonical `purchase` ecommerce event comes from server-side MP on webhook** — not from this page — to avoid double-counting.
- `apps/cochlearfit/src/components/cart/CartContents.tsx` — Renders items or empty state. GA4 `view_cart` belongs on mount when items > 0.
- `apps/cochlearfit-worker/src/index.ts` — `handleWebhook` processes `checkout.session.completed`; already has a `RECONCILIATION_URL` hook (fire-and-forget fetch). GA4 Measurement Protocol POST slots into this hook or as a parallel call.
- `data/shops/cochlearfit/variants.json` — Contains 12 variants with `stripePriceId` placeholders; `catalogByPriceId` Map in worker (line 78) used to resolve items on session status fetch. Item metadata (name, size, color, price) is the source for GA4 `items[]` arrays.
- `apps/cochlearfit/src/lib/locales.ts` — Exports `LOCALES = ["en", "it", "es", "de"]`. No `es.json` or `de.json` exist in `i18n/`. Build failure surface for `generateStaticParams` on PDP.

### Patterns & Conventions Observed

- `"use client"` components consume React context — event firing must happen inside client components
- All locale-aware navigation uses `withLocale(path, locale)` helper — cancel/success URLs must follow this pattern
- `createTranslator` / `loadMessages` used for all i18n — no raw string literals in components
- Worker uses `console.info(JSON.stringify({event, source, ...}))` for structured internal telemetry — GA4 MP call follows the same pattern but goes to an external endpoint

### Data & Contracts

- **CartItem**: `{ variantId: string, quantity: number }` — persisted to localStorage key `"cochlearfit:cart"`
- **Checkout payload to worker — current**: `{ items: { variantId, quantity }[], locale: "en" | "it" }`. Once ES/DE stub files ship, runtime may send `"es"` or `"de"` — worker already normalises unknown locales to `"en"` (line 345: `const locale = rawLocale === "it" ? "it" : "en"`). No worker change needed for locale stub task.
- **Checkout payload to worker — extended (this plan)**: adds `{ gaClientId?: string, gaSessionId?: string, gaSessionNumber?: number }` for MP identity stitching. Retrieved client-side via `gtag('get', measurementId, 'client_id', cb)` and `gtag('get', measurementId, 'session_id', cb)` before initiating checkout.
- **Worker checkout response**: `{ id: string, url: string }` — `url` is the Stripe-hosted checkout URL
- **Stripe session metadata written (extended)**: adds `metadata[ga_client_id]`, `metadata[ga_session_id]`, `metadata[ga_session_number]` so webhook handler can read them back for MP call.
- **Session status response** (`GET /api/checkout/session/:id`): `{ id, status, paymentStatus, total, currency, items: [{ variantId, name, size, color, quantity, unitPrice, currency }] }`
- **Stripe webhook event**: `checkout.session.completed` → `buildOrderRecord` → `ORDERS_KV.put`
- **GA4 Measurement Protocol endpoint**: `POST https://region1.google-analytics.com/mp/collect?measurement_id=G-XXXXX&api_secret=XXXXX` (EU collection endpoint, used for staging + prod). Dev/CI schema validation uses `https://region1.google-analytics.com/debug/mp/collect` — events sent there do **not** appear in GA4 reports or DebugView; it only returns `validationMessages`. Staging acceptance tests send to the real endpoint with `debug_mode: true` in event params (this is what makes events appear in DebugView).
- **GA4 MP payload shape** (correct structure — `session_id` and `engagement_time_msec` are event params, not top-level):
  ```json
  {
    "client_id": "12345.67890",
    "events": [{
      "name": "purchase",
      "params": {
        "transaction_id": "cs_live_...",
        "value": 38.00,
        "currency": "EUR",
        "session_id": 1700000000,
        "engagement_time_msec": 100,
        "items": [{ "item_id": "...", "item_name": "...", "price": 38.00, "quantity": 1 }]
      }
    }]
  }
  ```
  `engagement_time_msec` is required for events to appear in Realtime and DebugView (use a nominal value, e.g. `100`, from the server since elapsed time is unknown). `session_id` should be a numeric type (coerce from string if needed — `gtag('get', ...)` may return string).
- **GA4 MP idempotency**: before firing, worker checks `ORDERS_KV.get("ga4:purchase_sent:${sessionId}")`. Skips call if truthy. Idempotency key is set **only after a successful prod MP fetch** — never after a debug/validation call, and never on fetch error. Prevents duplicate purchase events on Stripe webhook retries.
- **Type coercion note**: `gaSessionId` and `gaSessionNumber` retrieved from client via `gtag('get', ...)` may arrive as string. Worker must coerce to `Number()` before inserting into MP `params` — GA4 MP expects numeric `session_id`.
- **GA4 items array shape**: `{ item_id: variantId, item_name, item_variant: "{size}/{color}", item_category: productStyle, price, quantity, currency }`. `currency` required when `value` is set. `item_list_name` set for list events (`view_item_list`, `select_item`).
- **Worker `waitUntil`**: GA4 MP fetch and KV idempotency write must use `ctx.waitUntil(promise)` so they complete after the webhook response is returned (Cloudflare Worker lifetime constraint).

### Dependency & Impact Map

- Upstream dependencies:
  - `cochlearfit-deployment-readiness`: real Stripe Price IDs must exist before `purchase` events can fire on real transactions
  - GA4 property + Measurement ID (not in repo — must be provisioned by owner)
  - Worker `GA4_API_SECRET` secret (Measurement Protocol)
- Downstream dependents:
  - GA4 reports (conversion funnels, revenue, attribution) — all depend on correct event naming and `items[]` shape
  - Any future remarketing / Google Ads conversion tracking relies on the same `gtag` installation
- Likely blast radius:
  - Adding `gtag` script to root layout affects all pages — performance audit recommended post-ship
  - `cart.clear()` in ThankYouPanel: low blast radius, isolated to post-purchase state
  - Locale stub files (ES/DE): low risk, adds empty or EN-copy i18n files

### Test Landscape

#### Test Infrastructure

- Framework: Jest (cochlearfit app: `apps/cochlearfit/__tests__/`)
- Worker tests: Jest via `apps/cochlearfit-worker/src/__tests__/`
- No Playwright/Cypress tests for cochlearfit
- CI: runs Jest as part of monorepo test suite

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Cart reducer | Unit | `__tests__/cartReducer.test.ts` | add/remove/setQuantity/hydrate/clear actions |
| Cart storage | Unit | `__tests__/cartStorage.test.ts` | localStorage save/load |
| Catalog server | Unit | `__tests__/cochlearfitCatalog.server.test.ts` | product/variant resolution |
| Site lib | Unit | `__tests__/site.test.ts` | constants |
| Worker catalog bundling | Unit | `src/__tests__/bundle-worker-catalog.test.ts` | bundler correctness |
| Worker catalog wireup | Unit | `src/__tests__/catalog-wireup.test.ts` | variant ID resolution |
| Worker inventory shop-id | Unit | `src/__tests__/inventory-authority-shop-id.test.ts` | x-shop-id header |

#### Coverage Gaps

- Untested paths:
  - `CheckoutPanel.handleCheckout` — no test for session creation call or redirect
  - `ThankYouPanel` — no test for session fetch, paid/unpaid state rendering, or cart clear
  - `CartContents` — no component render test
  - `ProductDetail` — no component render test
  - Worker `handleWebhook` — no test for KV write or reconciliation forward
  - Worker `handleSessionStatus` — no test for line_items → catalog resolution
  - GA4 events (when added) — none yet; test seams needed

#### Testability Assessment

- Easy to test:
  - UI button handlers (ProductDetail "Add to cart", CartItemRow remove) — spy on `window.gtag` mock, assert `add_to_cart` / `remove_from_cart` call with correct params
  - `ThankYouPanel` `purchase_confirmed_ui` event — render with mock `fetchCheckoutSession` response, assert `gtag('event', 'purchase_confirmed_ui', ...)` called once; assert `cart.clear()` called; assert not called on re-render (fired-once guard)
  - Locale stub files — build-time assertion
- Hard to test:
  - Worker GA4 Measurement Protocol — requires `fetch` mock; `waitUntil` in CF Worker runtime is not testable in Jest; validation-mode toggle must be seam for unit testing
  - End-to-end Stripe → webhook → KV → Thank You flow — no test infra currently
- Test seams needed:
  - `gtag` mock added to Jest global setup (`window.gtag = jest.fn()`) — shared for all cochlearfit component tests
  - Worker MP mode injectable via env var (`GA4_VALIDATION_MODE=true` → hits debug endpoint; do not set idempotency KV in this mode)

### Recent Git History (Targeted)

- `d59b87afc5` — `feat(cochlearfit-worker): send x-shop-id to inventory authority` — confirms inventory authority integration is actively evolving
- `0e81f99616` — `test(cochlearfit-deployment-readiness): add worker bundler tests` — worker test harness is established
- `4953c820ce` — `feat(seo-machine-readable): integrate @acme/seo into Cochlearfit` — SEO metadata already wired; root layout has been touched recently
- `c9f10329a9` — `fix(ds-compliance-audit): migrate cochlearfit to semantic tokens` — design system tokens in place; new UI additions should use semantic tokens only

---

## Questions

### Resolved

- Q: Is there any existing analytics script or dataLayer in the root layout?
  - A: No. Confirmed by reading all route files and i18n strings. No `gtag`, `dataLayer`, or analytics `<Script>` exists anywhere.
  - Evidence: `apps/cochlearfit/src/app/[lang]/page.tsx`, `checkout/page.tsx`, `thank-you/page.tsx` — all inspected

- Q: Where does the cancel URL send users currently?
  - A: Back to `/[locale]/checkout` (the read-only checkout page), not `/[locale]/cart`.
  - Evidence: `apps/cochlearfit-worker/src/index.ts:224` — `const cancel = \`${baseUrl}/${locale}/checkout\``

- Q: Is the cart cleared after purchase?
  - A: No. `ThankYouPanel` has no reference to `useCart` or `cart.clear()`.
  - Evidence: `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx` — full file read

- Q: Do ES and DE locales have translation files?
  - A: No. Only `i18n/en.json` and `i18n/it.json` exist. `LOCALES` array includes `"es"` and `"de"`.
  - Evidence: `apps/cochlearfit/src/lib/locales.ts`, `apps/cochlearfit/i18n/en.json`

- Q: Is there a server-side hook for forwarding order data?
  - A: Yes. Worker has `RECONCILIATION_URL` / `RECONCILIATION_AUTH_HEADER` env pair with a fire-and-forget `fetch` in `handleWebhook`. GA4 Measurement Protocol can be wired here.
  - Evidence: `apps/cochlearfit-worker/src/index.ts:427–450`

### Open (User Input Needed)

- Q: Should canonical `purchase` event be server-side MP (webhook) or client-side (ThankYouPanel)?
  - Why it matters: determines whether client fires `purchase` or `purchase_confirmed_ui`; dual-source without this decision = double-counted revenue
  - Decision impacted: TASK-10, TASK-11 architecture; acceptance criteria for deduplication
  - Default assumption: **server-side MP is canonical** (ad-blocker-proof, fires on authoritative webhook); client fires `purchase_confirmed_ui` only
  - Risk if wrong: if owner wants client-side canonical (simpler to debug in DebugView), MP must be disabled or renamed

- Q: Has a GA4 property been created, and what is the Measurement ID?
  - Why it matters: determines whether we can begin instrumentation or must stub the ID for now
  - Decision impacted: TASK-02; without it, all events are silently dropped
  - Default assumption: stub with `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-PLACEHOLDER`; swap at deploy time

- Q: What is the consent posture for analytics vs server-side purchase events?
  - Why it matters: "canonical purchase = server-side MP always fires" and "analytics defaults to denied" are in tension — if analytics consent governs all GA4 data collection, MP purchase cannot fire for non-consenting users. These are architecturally incompatible unless a posture is chosen.
  - Decision impacted: TASK-02 (when/whether gtag loads), TASK-03b (consent banner scope), TASK-10b (whether `gtag('get', ...)` is available to get identity), TASK-11 (whether MP fires unconditionally or is consent-gated)
  - Three options:
    - **Option A — Strict**: if `analytics_storage='denied'`, no GA4 events fire at all, including MP purchase. Simplest legally; no revenue data from non-consenting users. `gtag('get', ...)` not called if denied; stitching not attempted.
    - **Option B — Consent Mode cookieless pings**: load gtag with Consent Mode defaults; Google sends cookieless/cookieless-stitched pings for denied users (modelled data). MP purchase fires for all completed purchases regardless of consent. This is Google's documented model-based approach.
    - **Option C — Hybrid**: MP purchase fires unconditionally (server-side, no browser consent required); client-side GA4 events respect consent. Legally ambiguous — MP purchase is still analytics collection.
  - Default assumption: **Option A (strict)** for launch simplicity and legal clarity. Revenue data only available for consenting users. Revisit Option B after legal review.
  - Implication: if Option A is chosen, `gtag('get', ...)` for identity stitching is only called after consent is granted (pre-consent checkouts have no GA session stitching, and MP does not fire).

- Q: Is a Consent Management Platform (CMP) required, or is a lightweight consent banner acceptable for launch?
  - Why it matters: Italian/EEA users require a consent mechanism before analytics data is collected; Google Consent Mode v2 requires a consent signal before gtag fires
  - Decision impacted: scope of TASK-03b; whether to integrate a third-party CMP
  - Default assumption: minimal first-party consent toggle (no third-party CMP) for launch; upgrade to CMP in follow-up

- Q: Should Cart + Checkout be collapsed into a single page?
  - Why it matters: reduces funnel steps, also simplifies `begin_checkout` event placement
  - Decision impacted: scope and sequencing of funnel tasks; if yes, CartSummary + CheckoutPanel merge required
  - Default assumption: keep separate pages; fix cancel URL and add "Edit cart" link; collapse deferred

- Q: Should ES and DE locales be kept (stub files) or removed from `LOCALES`?
  - Why it matters: removing avoids build errors but loses future-proofing; stub files are minimal effort
  - Default assumption: add stub files copying EN strings (marked `// TODO: translate`)

---

## Confidence Inputs

- **Implementation**: 88%
  - All funnel code is fully readable and well-structured. Entry points, contracts, and event positions are clear. Drops to 88% because `ProductDetail` was not directly read (only via boundary wrapper) and the root layout was not inspected for existing Script conflicts.
  - Raises to ≥90: read `ProductDetail.tsx` and the root layout to confirm no conflicting Script tags.

- **Approach**: 80%
  - Critique applied: dual purchase source resolved (server-side canonical), session stitching approach defined (pass GA identifiers through checkout payload), CartContext instrumentation moved to UI handlers, `begin_checkout` moved to page mount, EU MP endpoint + validation endpoint identified, consent scaffolding added to scope. Drops from 82%→80% because consent CMP decision and purchase canonical source are open questions not yet owner-confirmed; if defaults accepted, no architecture change required.
  - Raises to ≥85: owner confirms canonical purchase source and consent approach.
  - Raises to ≥90: GA4 property created; test events pass `/debug/mp/collect` with zero `validationMessages`.

- **Impact**: 90%
  - Without GA4, zero conversion data exists. Adding it is table-stakes before any spend or channel work. Impact is near-certain.

- **Delivery-Readiness**: 72%
  - Blocked on: (a) GA4 Measurement ID not yet provisioned, (b) `cochlearfit-deployment-readiness` must ship for `purchase` events to fire on real transactions. Cart/checkout UX tasks are unblocked.
  - Raises to ≥80: GA4 property created, Measurement ID confirmed.
  - Raises to ≥90: `cochlearfit-deployment-readiness` shipped, test purchase verified end-to-end.

- **Testability**: 75%
  - Cart context event hooks are unit-testable with `gtag` mock. ThankYouPanel needs a test seam to prevent double-fire. Worker MP call is fire-and-forget — hard to assert in unit tests; integration test preferred.
  - Raises to ≥80: `gtag` mock added to Jest setup; ThankYouPanel receives testable `onPurchaseTracked` prop.
  - Raises to ≥90: E2E smoke test validates purchase event fires in GA4 DebugView (manual acceptance criterion).

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| **Dual purchase sources inflate GA4 revenue** — both client ThankYouPanel and server-side MP fire `purchase` | High (if not addressed) | Critical — doubles reported revenue, corrupts conversion rate | **Canonical source = server-side MP. ThankYouPanel fires `purchase_confirmed_ui` only.** No ecommerce `purchase` from client. |
| CartContext `hydrate` / `clear` dispatches inadvertently emit `add_to_cart` / `remove_from_cart` | High (if hooks added at context level) | High — phantom cart activity, inflated add-to-cart rate | Instrument in UI button handlers only (ProductDetail, CartItemRow); never in context dispatch |
| `begin_checkout` fires on button click not page mount — undercounts checkout starts for users who land on /checkout directly | Medium | Medium — funnel exploration step counts are off | Fire on Checkout page mount when items > 0 |
| EU consent non-compliance (Italy/EEA) — gtag fires before consent captured | High | High — legal exposure, GA4 data quality risk if Google later blocks unconsented events | Implement Consent Mode v2 scaffolding in Phase 1; default `analytics_storage: denied`; update on consent |
| MP payload malformed — GA4 returns 2xx even on bad payloads; silent data loss | Medium | High — purchases appear to succeed but don't appear in GA4 | Use `/debug/mp/collect` in non-prod; log `validationMessages`; gate prod switch on zero validation errors |
| Stripe webhook retries cause duplicate server-side `purchase` events | Medium | High — inflates purchase count and revenue | Idempotency KV key `ga4:purchase_sent:${sessionId}` checked before MP call; set after successful send |
| Worker MP fetch terminated before completion (CF Worker lifetime) | Medium | Medium — GA4 purchase event silently dropped | Wrap MP fetch in `ctx.waitUntil()`; do not rely on fire-and-forget outside waitUntil |
| GA4 identity stitching: server-side MP appears as separate session if `client_id` not passed | High (default) | Medium — purchase attribution broken, inflates session count | Pass `gaClientId`/`gaSessionId` from client through checkout payload → Stripe metadata → webhook → MP call |
| GA4 Measurement ID not provisioned before build | High | Medium — can stub; events lost in staging | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` env var; real value required before prod |
| SPA navigation missing `page_view` events — funnel exploration paths by page incomplete | Medium | Medium — harder to attribute drop-off to specific pages | Add route listener (`usePathname` + `useSearchParams`) to emit `page_view` on soft navigation |
| ES/DE locale build error causes PDP build failure | High | Medium — breaks CI and all 4-locale PDP builds | Stub i18n files as first task |
| Cart still shows items after purchase (until cart.clear() added) | High | Medium — confusing UX, re-entry triggers hydration but not `add_to_cart` if instrumented correctly | Cart clear in ThankYouPanel gated on paid status; low effort |
| `gtag` script degrades Core Web Vitals | Low | Medium | Use `strategy="afterInteractive"`; Lighthouse before/after |
| EU MP endpoint (`region1`) not used — data routes through US collection | Medium | Low-medium — data residency concern for EU customers | Default to `region1.google-analytics.com` for MP and DebugView calls |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `next/script` with `strategy="afterInteractive"` for gtag.js — not raw `<script>` tags
  - Consent Mode v2 `gtag('consent', 'default', {...})` must be called **before** the gtag config call; `analytics_storage` defaults to `"denied"` for EEA users
  - All new UI strings must go through `useTranslations()` / `createTranslator()` — no raw literals
  - Worker changes must not break existing tests in `src/__tests__/`
  - New locale stub files must satisfy `generateStaticParams` without throwing on missing keys
  - `gtag` calls must be guarded with `typeof window !== "undefined"` where there is any SSR risk
  - `add_to_cart` / `remove_from_cart` must only fire from UI interaction handlers — never from CartContext `hydrate` or `clear` dispatch paths
  - Worker outgoing fetches for GA4 MP must be wrapped in `ctx.waitUntil()` — do not fire-and-forget outside worker lifetime management
  - GA4 MP endpoint: `https://region1.google-analytics.com/mp/collect` (EU). Non-prod validation: `https://region1.google-analytics.com/debug/mp/collect` with `validationMessages` logged
- Rollout/rollback expectations:
  - GA4 script addition is non-breaking; can be reverted by removing the Script tag
  - `cart.clear()` in ThankYouPanel is low-risk; isolated to post-purchase state
  - Cancel URL fix is a single-line worker change; can be reverted independently
- Observability expectations:
  - GA4 DebugView is the primary acceptance test for event correctness during development
  - Worker structured logs (`console.info` JSON) already in place; add GA4 MP call status to logs

---

## Suggested Task Seeds (Non-binding)

**Phase 0 — Unblock build**
- TASK-01: Add ES and DE i18n stub files (copy EN, mark TODO) to fix PDP `generateStaticParams` build error

**Phase 1 — GA4 foundation + consent**
- TASK-02: Provision `NEXT_PUBLIC_GA4_MEASUREMENT_ID` env var; add `next/script` gtag.js tag to root layout; set Consent Mode v2 defaults before config call (`gtag('consent', 'default', { analytics_storage: 'denied' })`); set `send_page_view: false` in `gtag('config', ...)` to prevent double-counting auto pageview; add SPA route listener (`usePathname` + `useSearchParams` in a `"use client"` component) that emits `page_view` as the single source of truth for all pageviews (including initial load)
- TASK-03: Add `gtag` type declarations and shared `analytics.ts` helper (thin wrapper around `window.gtag`); add `gtag` mock to Jest setup file for component testing
- TASK-03b: Add minimal first-party consent toggle (banner + localStorage flag); on accept, call `gtag('consent', 'update', { analytics_storage: 'granted' })`

**Phase 2 — Client-side funnel events**
- TASK-04: `view_item_list` on ProductGrid mount (Shop + Home featured); include `item_list_name` per item
- TASK-05: `select_item` on ProductCard click; include `item_list_name` and `index`
- TASK-06: `view_item` on ProductDetail mount
- TASK-07: `add_to_cart` on ProductDetail "Add to cart" button handler; `remove_from_cart` on CartItemRow remove button — **not** in CartContext dispatch (hydration guard)
- TASK-08: `view_cart` on CartContents mount (when items > 0)
- TASK-09: `begin_checkout` on Checkout page mount when cart has items; separate custom event `checkout_redirect_initiated` on the "Pay" button click for Stripe CTA signal
- TASK-10: ThankYouPanel fires `purchase_confirmed_ui` (non-ecommerce) on first paid session load; also calls `cart.clear()` in same effect with fired-once `useRef` guard. **Does not fire `purchase` — canonical purchase comes from server-side MP (TASK-11)**

**Phase 2b — GA4 identity capture for session stitching**
- TASK-10b: Before calling `createCheckoutSession`, use `gtag('get', measurementId, 'client_id', cb)` and `gtag('get', measurementId, 'session_id', cb)` to retrieve GA identity; extend checkout payload with `{ gaClientId, gaSessionId, gaSessionNumber }`; extend worker to write these into Stripe session metadata (`metadata[ga_client_id]`, `metadata[ga_session_id]`, `metadata[ga_session_number]`)

**Phase 3 — Server-side canonical purchase event**
- TASK-11: Add `GA4_API_SECRET`, `GA4_MEASUREMENT_ID`, and `GA4_VALIDATION_MODE` to worker env. In `handleWebhook` on `checkout.session.completed`: (1) check `ORDERS_KV.get("ga4:purchase_sent:${sessionId}")` — skip if set; (2) build MP `purchase` payload with correct structure (`session_id` and `engagement_time_msec: 100` inside `events[].params`, `client_id` at top level; coerce `session_id` to `Number()`); (3) POST to `region1.google-analytics.com/mp/collect` (prod) or `region1.google-analytics.com/debug/mp/collect` (when `GA4_VALIDATION_MODE=true`); (4) in prod mode only: set `ORDERS_KV.put("ga4:purchase_sent:${sessionId}", "1")` after successful fetch — do not set on validation calls or fetch errors; (5) log `validationMessages` in validation mode; (6) wrap entire sequence in `ctx.waitUntil()`; (7) if consent posture is Option A: gate entire MP call on presence of `ga_client_id` in session metadata (if missing, skip MP and log reason)

**Phase 4 — Funnel UX fixes**
- TASK-12: Fix worker cancel URL: `${baseUrl}/${locale}/cart` (currently `${locale}/checkout`); `index.ts:224`
- TASK-13: Add "Edit cart" link from CheckoutPanel back to cart
- TASK-14: Upgrade ThankYouPanel copy: "payment confirmed" heading, human-readable short reference (first 8 chars of session ID), "we'll email you tracking details" note

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - GA4 DebugView shows all recommended ecommerce events firing in correct sequence for a test purchase flow
  - **No duplicate purchases**: for a single Stripe `session_id` / `transaction_id`, GA4 shows exactly 1 `purchase` event; worker logs show idempotency skip on simulated webhook retry
  - **MP payload validated**: zero `validationMessages` from `/debug/mp/collect` before prod endpoint is enabled
  - **Session stitching verified**: MP `purchase` event is attributed to the same `client_id` as the pre-checkout browser events (verified in GA4 DebugView / Realtime)
  - `cart.clear()` verified: cart is empty after Thank You page load for a paid session
  - PDP builds without error for all 4 locales (EN, IT, ES, DE)
  - `begin_checkout` fires on Checkout page mount, not on button click; confirmed via DebugView
  - `add_to_cart` does not fire on localStorage hydration (verify by hard-refreshing a page with items in cart — no `add_to_cart` in DebugView)
  - Consent Mode v2: with consent denied (default), no GA4 events visible in network tab
  - Worker `ctx.waitUntil` wraps MP fetch: verified via Cloudflare Worker logs (not cut off on response)
- Post-delivery measurement plan:
  - Monitor GA4 Funnel Exploration report after first 50 sessions to identify drop-off by step
  - Check GA4 Conversions for `purchase` event attribution by channel
  - Compare GA4 `purchase` event count vs Stripe Dashboard completed sessions weekly; alert if gap >10% (double-fire or dropped events)
  - Check `purchase_confirmed_ui` event count matches `purchase` — if they diverge significantly, client/server fire mismatch to investigate

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed no existing analytics instrumentation by reading all route files and components (not assumed)
- Confirmed cancel URL bug from direct code read of `index.ts:224`
- Confirmed cart not cleared post-purchase from full `ThankYouPanel` read
- Confirmed ES/DE locale gap from `locales.ts` + i18n directory
- Confirmed `RECONCILIATION_URL` server-side hook exists and is fire-and-forget

### Confidence Adjustments

- `ProductDetail.tsx` not read directly — Implementation score capped at 88% (vs 90%+)
- Root layout not inspected for existing Script ordering — same cap; inspect before TASK-02 to confirm no conflicts
- GA4 client_id / session_id passthrough strategy is now designed (not an open question); Approach score at 80% pending owner confirmation of consent posture and canonical purchase source
- Delivery-Readiness capped at 72% due to external dependencies: GA4 property not provisioned; `cochlearfit-deployment-readiness` not shipped; consent posture not confirmed

### Remaining Assumptions

- GA4 `gtag` approach (vs GTM) accepted as sufficient at this scale; no GTM container required
- `strategy="afterInteractive"` is safe for all event-firing components (none require `beforeInteractive`)
- Session stitching via GA identity passthrough is achievable (critique confirmed `gtag('get',...)` is the documented approach); this brief's design addresses it — no longer an "accepted limitation"
- `cochlearfit-deployment-readiness` completes before end-to-end `purchase` event validation on real transactions
- Owner confirms: server-side MP is canonical `purchase` source; ThankYouPanel fires `purchase_confirmed_ui`
- Minimal first-party consent banner is sufficient for EEA compliance at launch (no third-party CMP required yet)

---

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items:
  - GA4 Measurement ID must be confirmed before TASK-02 (can stub with env var placeholder)
  - `cochlearfit-deployment-readiness` should ship before Phase 3 server-side event validation (does not block Phases 0–2)
- Recommended next step: `/lp-do-plan cochlearfit-ga4-funnel`
