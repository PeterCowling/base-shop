---
Type: Plan
Status: Draft
Domain: UI / API / Infra
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Last-reviewed: 2026-02-18
Feature-Slug: cochlearfit-ga4-funnel
Relates-to charter: docs/business-os/business-os-charter.md
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact) per task; effort-weighted average across tasks (S=1,M=2,L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: HEAD
Card-ID: none
---

# CochlearFit GA4 + Funnel Streamlining Plan

## Summary

CochlearFit has a fully built purchase funnel (Home → Shop → PDP → Cart → Checkout → Stripe → Thank You) with zero analytics instrumentation and several structural friction points. This plan delivers full GA4 recommended ecommerce event coverage, a server-side canonical `purchase` event via Measurement Protocol on Stripe webhook, consent Mode v2 scaffolding for EEA/Italy compliance, GA4 identity stitching so server-side events join the originating browser session, and four targeted funnel UX fixes (locale build error, cancel URL, edit-cart link, thank-you copy). Two blocking DECISION tasks must be resolved by the owner before the majority of IMPLEMENT tasks can execute; several tasks (TASK-01, TASK-03, TASK-14, TASK-15, TASK-16) are independently buildable with no blocking decisions.

## Goals

- Full GA4 ecommerce event coverage: `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `purchase` (server-side canonical)
- Canonical `purchase` via GA4 Measurement Protocol on Stripe `checkout.session.completed` webhook; client-side `purchase_confirmed_ui` only
- GA4 identity stitching: `client_id`/`session_id` passed client → Stripe metadata → webhook → MP payload
- Consent Mode v2 scaffolding; `analytics_storage` defaults to `denied` for EEA users
- SPA `page_view` on every soft navigation (Next.js App Router does not auto-fire these)
- ES/DE locale stub files to fix `generateStaticParams` PDP build error
- Cancel URL → `/cart` (currently `/checkout`)
- Cart cleared and `purchase_confirmed_ui` fired on Thank You page after confirmed payment

## Non-goals

- Stripe Price ID setup or inventory authority wiring (`cochlearfit-deployment-readiness` plan)
- Post-purchase email/transactional notifications
- Social proof, sizing chart, FAQ expansion, contact form
- GTM container (direct gtag.js for simplicity at this scale)
- Cart + Checkout page collapse (deferred to follow-up)

## Constraints & Assumptions

- Constraints:
  - Next.js App Router — gtag `<Script>` in root layout; SPA listener as `"use client"` component
  - Cloudflare Worker — no Node.js; MP fetch must use `ctx.waitUntil()`
  - Consent Mode v2 `gtag('consent', 'default', {...})` must precede `gtag('config', ...)`
  - `send_page_view: false` in `gtag('config', ...)` — route listener is sole pageview source
  - `add_to_cart`/`remove_from_cart` in UI handlers only — not in CartContext dispatch (hydration/clear pollution)
  - GA4 MP endpoint: `region1.google-analytics.com` (EU); validation: `/debug/mp/collect` (dev/CI only; does not appear in DebugView)
  - `session_id` and `engagement_time_msec` are event params (inside `events[].params`), not top-level
  - Idempotency KV key set only after successful prod MP fetch; never on validation calls or errors
  - All new UI strings via `useTranslations()` / `createTranslator()`
- Assumptions:
  - GA4 Measurement ID provisioned before TASK-02 executes (can stub `G-PLACEHOLDER`)
  - `cochlearfit-deployment-readiness` ships before end-to-end `purchase` event validation on real transactions
  - `GA4_API_SECRET` and `GA4_MEASUREMENT_ID` added as Worker secrets before TASK-13 executes
  - Consent posture defaults to Option A (strict) pending TASK-D01 confirmation
  - Server-side MP is canonical `purchase` source pending TASK-D02 confirmation

## Fact-Find Reference

- Related brief: `docs/plans/cochlearfit-ga4-funnel/fact-find.md`
- Key findings used:
  - Root layout (`apps/cochlearfit/src/app/layout.tsx`): confirmed clean — fonts, JsonLdScript only; no existing analytics scripts; safe insertion point for gtag `<Script>`
  - `ProductDetail.tsx` confirmed: `handleAdd` callback (line 39) is the single "Add to cart" handler shared by main button and `ProductStickyBar`. GA4 `add_to_cart` belongs here.
  - `ThankYouPanel.tsx` confirmed: no `cart.clear()` call; no analytics event; `paymentStatus === "paid"` is the correct gate
  - `CheckoutPanel.tsx` confirmed: `createCheckoutSession(payload)` call — payload extension point for GA identity
  - Worker `handleWebhook` (line 399): `RECONCILIATION_URL` fire-and-forget hook is the insertion point for MP call; `ORDERS_KV.put` pattern already established for idempotency
  - Worker cancel URL bug: `index.ts:224` — `const cancel = \`${baseUrl}/${locale}/checkout\`` → must be `/cart`
  - ES/DE locale gap: `LOCALES = ["en", "it", "es", "de"]` in `locales.ts`; only `en.json` and `it.json` exist in `i18n/`

## Proposed Approach

- Option A: Client-side only — all events from browser; no server-side purchase. Simple to debug in DebugView; vulnerable to ad-blockers; purchase event lost if Thank You page is closed early.
- Option B (chosen): Server-side canonical purchase via Measurement Protocol on webhook + full client-side funnel event suite. Ad-blocker-proof purchase event; identity stitching via GA payload passthrough; dual-source risk fully eliminated by canonical source design (client fires `purchase_confirmed_ui`, not `purchase`).
- Chosen approach: **Option B**. Canonical `purchase` from server-side MP. Client handles all pre-purchase funnel events plus `purchase_confirmed_ui` post-purchase UX effect.

## Plan Gates

- Foundation Gate: **Pass** — Deliverable-Type, Execution-Track, Primary-Execution-Skill all present; test landscape and testability documented in fact-find; delivery-readiness confidence 72% with clear raise path
- Sequenced: **Yes**
- Edge-case review complete: **Yes** (applied inline per task in Edge Cases & Hardening fields)
- Auto-build eligible: **No** — TASK-D01 and TASK-D02 are unresolved DECISION tasks blocking majority of IMPLEMENT tasks; plan Status is Draft; owner must confirm decisions before Active designation

## Active tasks
See `## Tasks` section for the active task list.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add ES/DE i18n stub files | 90% | S | Pending | — | — |
| TASK-D01 | DECISION | Confirm consent posture (A/B/C) | — | S | Needs-Input | — | TASK-02, TASK-04, TASK-13 |
| TASK-D02 | DECISION | Confirm canonical purchase source | — | S | Needs-Input | — | TASK-12, TASK-13 |
| TASK-03 | IMPLEMENT | analytics.ts helper + Jest gtag mock | 85% | S | Pending | — | TASK-02, TASK-04–12 |
| TASK-14 | IMPLEMENT | Fix worker cancel URL | 90% | S | Pending | — | — |
| TASK-15 | IMPLEMENT | Add "Edit cart" link in CheckoutPanel | 80% | S | Pending | — | — |
| TASK-16 | IMPLEMENT | Upgrade ThankYouPanel copy | 80% | S | Pending | — | — |
| TASK-02 | IMPLEMENT | Root layout: gtag Script + Consent Mode v2 + SPA pageview listener | 75% | M | Pending | TASK-D01, TASK-03 | TASK-04–10 |
| TASK-04 | IMPLEMENT | Consent banner component | 75% | M | Pending | TASK-D01, TASK-03 | CHECKPOINT-A |
| TASK-05 | IMPLEMENT | view_item_list on ProductGrid | 80% | S | Pending | TASK-03 | TASK-06 |
| TASK-06 | IMPLEMENT | select_item on ProductCard | 75% | S | Pending | TASK-03, TASK-05 | CHECKPOINT-A |
| TASK-07 | IMPLEMENT | view_item on ProductDetail mount | 80% | S | Pending | TASK-03 | CHECKPOINT-A |
| TASK-08 | IMPLEMENT | add_to_cart / remove_from_cart in UI handlers | 75% | S | Pending | TASK-03 | CHECKPOINT-A |
| TASK-09 | IMPLEMENT | view_cart on CartContents mount | 75% | S | Pending | TASK-03 | CHECKPOINT-A |
| TASK-10 | IMPLEMENT | begin_checkout on Checkout page mount | 85% | S | Pending | TASK-03 | TASK-11, CHECKPOINT-A |
| TASK-12 | IMPLEMENT | ThankYouPanel: purchase_confirmed_ui + cart.clear | 85% | S | Pending | TASK-D02, TASK-03 | CHECKPOINT-A |
| CHECKPOINT-A | CHECKPOINT | Validate client-side events in DebugView | 95% | S | Pending | TASK-04–10, TASK-12 | TASK-11 |
| TASK-11 | IMPLEMENT | GA identity capture in CheckoutPanel + worker metadata | 75% | M | Pending | TASK-D02, TASK-03, TASK-10, CHECKPOINT-A | TASK-13 |
| TASK-13 | IMPLEMENT | Worker MP canonical purchase event | 75% | L | Pending | TASK-11, TASK-D01, TASK-D02 | CHECKPOINT-B |
| CHECKPOINT-B | CHECKPOINT | Validate server-side purchase, idempotency, no duplicates | 95% | S | Pending | TASK-13 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-D01, TASK-D02, TASK-03, TASK-14, TASK-15, TASK-16 | None | All fully independent; close decisions quickly to unblock Wave 2 |
| 2 | TASK-02, TASK-04, TASK-12 | D01 (TASK-02, TASK-04), D02 (TASK-12), TASK-03 | Parallel once decisions close |
| 3 | TASK-05, TASK-07, TASK-08, TASK-09, TASK-10 | TASK-03 (can start in parallel with Wave 2 if TASK-03 done) | All parallel; TASK-06 waits for TASK-05 |
| 3b | TASK-06 | TASK-05 | Shares item_list_name |
| 4 | CHECKPOINT-A | TASK-04–10, TASK-12 | Manual DebugView validation; /lp-do-replan on downstream |
| 5 | TASK-11 | TASK-D02, TASK-03, TASK-10, CHECKPOINT-A | Identity capture — must follow client event validation |
| 6 | TASK-13 | TASK-11, TASK-D01, TASK-D02 | Server-side purchase; largest task |
| 7 | CHECKPOINT-B | TASK-13 | Idempotency + duplicate validation |

---

## Tasks

### TASK-01: Add ES/DE i18n stub files
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/i18n/es.json`, `apps/cochlearfit/i18n/de.json` — stub files copied from `en.json` with `__locale_stub: true` as the first JSON key (valid JSON; no source comments)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/i18n/es.json` (new), `apps/cochlearfit/i18n/de.json` (new), `[readonly] apps/cochlearfit/i18n/en.json`, `[readonly] apps/cochlearfit/src/lib/locales.ts`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 95% — gap confirmed: `LOCALES = ["en", "it", "es", "de"]`, only `en.json`/`it.json` exist; file creation is trivial
  - Approach: 90% — stub-vs-remove open question but default (stubs) is clearly lower-risk; worker already normalises unknown locales to EN
  - Impact: 90% — build-blocking confirmed: `generateStaticParams` in `[lang]/layout.tsx` iterates `LOCALES`; ES/DE paths fail without matching i18n files
- **Acceptance:**
  - `pnpm --filter cochlearfit build` succeeds for all 4 locales without i18n key errors
  - `/es/product/classic` and `/de/product/classic` routes exist in the built output
  - Stub files contain full key set from `en.json` with `"__locale_stub": true` as the first key; no source comments (JSON does not support comments)
- **Validation contract:**
  - TC-01: Build succeeds with stub files present → no `generateStaticParams` error for ES/DE
  - TC-02: Missing key lookup in stub file → falls back to raw key or EN fallback (no throw)
  - TC-03: Stub file added to git without breaking existing EN/IT locale tests
- **Execution plan:** Red → create `es.json`/`de.json` as copies of `en.json` → Green → build passes → Refactor → add top-level `__locale_stub` marker key for audit tooling to detect
- **Planning validation:** `LOCALES` array confirmed at `apps/cochlearfit/src/lib/locales.ts`; `en.json` key count is 420+ lines; copy approach confirmed viable
- **Scouts:** None — approach is clear
- **Edge Cases & Hardening:** Stub files must not be picked up by the strict-mode i18n parity audit (if it runs for cochlearfit); the `"__locale_stub": true` JSON key is the machine-readable marker — audit tooling should skip files where this key is present and `=== true`
- **What would make this >=90%:** Already at 90%; raises to 95% if build confirmed passing in CI
- **Rollout / rollback:**
  - Rollout: add two files; no existing code changes
  - Rollback: delete the two files
- **Documentation impact:** None required
- **Notes:** Worker normalises `es`/`de` locale to `"en"` at `index.ts:345`; no worker change needed

---

### TASK-D01: Confirm consent posture
- **Type:** DECISION
- **Deliverable:** Decision recorded in `docs/plans/cochlearfit-ga4-funnel/plan.md` Decision Log
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Needs-Input
- **Affects:** `[readonly] apps/cochlearfit/src/app/layout.tsx`, `[readonly] apps/cochlearfit-worker/src/index.ts`
- **Depends on:** —
- **Blocks:** TASK-02, TASK-04, TASK-13
- **Confidence:** 70%
  - Implementation: 70% — decision is clear but owner confirmation required; defaulting without confirmation risks rework
  - Approach: 75% — three options fully specified in fact-find; consequences of each documented
  - Impact: 80% — affects gtag loading order, consent banner scope, MP gate
- **Options:**
  - Option A (Strict): `analytics_storage='denied'` by default; no GA4 events (including MP purchase) without user consent. Consent banner required. Two implementation variants:
    - A1 (No-script-until-consent): Do not load `gtag.js` until user accepts. After accept: load script + config + emit `page_view` for current route. Strictest — no Google network calls at all pre-consent. Side effect: `gtag('get', ...)` unavailable pre-consent (impacts TASK-11 GA identity capture for non-consenting users — acceptable since MP is also skipped).
    - A2 (Consent Mode v2 — recommended): Load `gtag.js` unconditionally with `gtag('consent','default',{analytics_storage:'denied'})`; emit no events until `gtag('consent','update',{analytics_storage:'granted'})`. Compliant with Consent Mode v2 spec; `gtag('get', ...)` is available for consenting users. Some orgs treat pre-consent `gtag.js` fetch as non-compliant — requires legal sign-off.
  - Option B (Cookieless pings): Load gtag with Consent Mode defaults; Google sends modelled/cookieless events for denied users; MP purchase fires unconditionally. No consent banner strictly required for analytics collection.
  - Option C (Hybrid): MP purchase fires unconditionally; client-side events respect consent. Legally ambiguous.
  - **Default plan assumption:** Option A (A2) — Consent Mode v2 style. Upgrade to A1 if legal review requires it; TASK-02 will note the A1 implementation path.
- **Recommendation:** Option A — simplest legally, clearest audit trail, easiest to upgrade to Option B post-launch once legal review confirms.
- **Decision input needed:**
  - question: Which consent posture (A/B/C) should govern GA4 data collection at launch?
  - why it matters: Determines whether gtag loads before or after consent, whether consent banner is required, whether MP fires for non-consenting users
  - default + risk: Option A; risk = no revenue data from non-consenting users at launch (acceptable for initial measurement)
- **Acceptance:**
  - Owner records decision in Decision Log below
  - Downstream tasks (TASK-02, TASK-04, TASK-13) updated to reflect chosen option
- **Validation contract:** Decision recorded with rationale; TASK-02 and TASK-13 acceptance criteria reflect chosen posture
- **Planning validation:** None: decision task
- **Rollout / rollback:** None: non-implementation task

---

### TASK-D02: Confirm canonical purchase source
- **Type:** DECISION
- **Deliverable:** Decision recorded in Decision Log
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Needs-Input
- **Affects:** `[readonly] apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx`, `[readonly] apps/cochlearfit-worker/src/index.ts`
- **Depends on:** —
- **Blocks:** TASK-12, TASK-13
- **Confidence:** 75%
  - Implementation: 75% — options are clear; default recommendation is strong
  - Approach: 80% — well-documented in fact-find
  - Impact: 85% — wrong choice = doubled revenue in GA4
- **Options:**
  - Option A (Server-side canonical): MP fires `purchase` on `checkout.session.completed` webhook. ThankYouPanel fires `purchase_confirmed_ui` only. No double-counting possible. More robust; harder to debug in DebugView.
  - Option B (Client-side canonical): ThankYouPanel fires GA4 `purchase`. MP sends a custom non-ecommerce `payment_received` event or is disabled. Easier DebugView debugging; vulnerable to ad-blockers and page closures.
- **Recommendation:** Option A — ad-blocker-proof; fires on authoritative payment confirmation; deduplication strategy simpler (no client-side idempotency needed). DebugView validation during build uses staging endpoint with `debug_mode: true` in params.
- **Decision input needed:**
  - question: Should the GA4 `purchase` ecommerce event be canonical on the server (webhook) or client (Thank You page)?
  - why it matters: Both firing `purchase` will double-count revenue; a clear choice is required before TASK-12 and TASK-13 are built
  - default + risk: Option A (server canonical); risk = purchase events not visible in DebugView without staging test setup (mitigated by `debug_mode: true` in MP params)
- **Acceptance:**
  - Decision recorded; TASK-12 and TASK-13 confirmed consistent with chosen option
- **Validation contract:** Decision recorded with rationale
- **Planning validation:** None: decision task
- **Rollout / rollback:** None: non-implementation task

---

### TASK-03: analytics.ts helper + Jest gtag mock
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/lib/analytics.ts` (new), update to `apps/cochlearfit/jest.setup.ts` (gtag mock)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/lib/analytics.ts` (new), `apps/cochlearfit/jest.setup.ts`
- **Depends on:** —
- **Blocks:** TASK-02, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12
- **Confidence:** 85%
  - Implementation: 95% — thin wrapper pattern; jest mock is `window.gtag = jest.fn()` — fully known
  - Approach: 90% — shared helper prevents scattered raw `window.gtag` calls; mock in setup ensures all component tests can assert events without setup overhead
  - Impact: 80% — all event tasks depend on this; without it each task re-implements the guard
- **Acceptance:**
  - `analytics.ts` exports at minimum: `trackEvent(name: string, params: Record<string, unknown>): void` guarded by `typeof window !== "undefined" && typeof window.gtag === "function"`
  - `jest.setup.ts` assigns `window.gtag = jest.fn()` so all component tests can `expect(window.gtag).toHaveBeenCalledWith(...)` without extra setup
  - Existing tests still pass after setup change
- **Validation contract:**
  - TC-01: `trackEvent('test', { foo: 'bar' })` → calls `window.gtag('event', 'test', { foo: 'bar' })` in browser context
  - TC-02: `trackEvent` called during SSR (no window) → no throw, no-op
  - TC-03: Jest test imports `trackEvent` → `window.gtag` spy is callable and assertable
  - TC-04: Existing `__tests__/*.test.ts` suite passes with updated `jest.setup.ts`
- **Execution plan:** Red → write `analytics.ts` with `trackEvent`; update `jest.setup.ts`; verify TC-04 → Green → all tests pass → Refactor → add `gtag` type declaration if `@types/gtag.js` not present
- **Planning validation:**
  - Checks run: confirmed `jest.setup.ts` exists via `apps/cochlearfit/__tests__/` glob; file structure known
  - Unexpected findings: None
- **Scouts:** Confirm whether `@types/gtag.js` is in `package.json` — if not, add type stub
- **Edge Cases & Hardening:** Guard must handle `window.gtag` being called before Script loads (queues internally in gtag); wrapper should not attempt to polyfill
- **What would make this >=90%:** Confirmed `@types/gtag.js` package availability; CI passing with mock
- **Rollout / rollback:**
  - Rollout: new file + jest setup change; fully additive
  - Rollback: delete `analytics.ts`; revert `jest.setup.ts`
- **Documentation impact:** None

---

### TASK-14: Fix worker cancel URL
- **Type:** IMPLEMENT
- **Deliverable:** Single-line change in `apps/cochlearfit-worker/src/index.ts:224`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit-worker/src/index.ts`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 95% — single confirmed line: `const cancel = \`${baseUrl}/${locale}/checkout\`` → change `checkout` to `cart`
  - Approach: 95% — clear bug; cancel should return user to cart where they can modify items
  - Impact: 85% — removes UX dead-end (cancel lands on read-only checkout with no edit path)
- **Acceptance:**
  - Stripe cancel URL is `${baseUrl}/${locale}/cart` in all test environments
  - Existing worker tests pass without modification
- **Validation contract:**
  - TC-01: Cancel URL in Stripe session payload contains `/cart` not `/checkout`
  - TC-02: Worker tests in `src/__tests__/` pass unmodified
- **Execution plan:** Red (existing bug) → change one string → Green → run worker tests
- **Planning validation:**
  - Checks run: line 224 confirmed in fact-find via direct file read
  - Unexpected findings: None
- **Scouts:** None
- **Edge Cases & Hardening:** None — locale path already uses `${locale}` variable correctly
- **What would make this >=90%:** Already at 90%; raises to 95% if worker tests explicitly assert cancel URL
- **Rollout / rollback:**
  - Rollout: single-character change
  - Rollback: revert the string
- **Documentation impact:** None

---

### TASK-15: Add "Edit cart" link in CheckoutPanel
- **Type:** IMPLEMENT
- **Deliverable:** Link component added to `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 90% — `CheckoutPanel.tsx` fully read; locale context available via `useLocale()`; `withLocale` helper already imported for other uses; adding `<Link>` is standard
  - Approach: 85% — link to `/cart` below the order review panel
  - Impact: 70% — convenience UX improvement; not critical path; lower impact than analytics tasks
- **Acceptance:**
  - "Edit cart" link (or equivalent i18n key) appears on Checkout page above or below the order summary
  - Link resolves to the correct locale-prefixed `/cart` path
  - New i18n key added to `en.json` and `it.json` (ES/DE stubs will inherit from TASK-01)
- **Validation contract:**
  - TC-01: Checkout page renders with "Edit cart" link; href = `/${locale}/cart`
  - TC-02: Clicking link navigates to cart (not a 404)
  - TC-03: New i18n key present in `en.json` and `it.json`
- **Execution plan:** Add i18n key → add `<Link>` in `CheckoutPanel.tsx` → verify path resolves
- **Planning validation:** None required for S task
- **Scouts:** None
- **Edge Cases & Hardening:** Link must use `withLocale('/cart', locale)` — do not hardcode `/en/cart`
- **What would make this >=90%:** Read CheckoutPanel more carefully to confirm exact placement; add component test
- **Rollout / rollback:**
  - Rollout: additive UI change
  - Rollback: remove the Link component
- **Documentation impact:** None

---

### TASK-16: Upgrade ThankYouPanel copy
- **Type:** IMPLEMENT
- **Deliverable:** Updated copy in `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx` and `apps/cochlearfit/i18n/en.json`, `apps/cochlearfit/i18n/it.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/i18n/en.json`, `apps/cochlearfit/i18n/it.json`, `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 90% — `ThankYouPanel.tsx` fully read; i18n keys already structured; changes are copy-only
  - Approach: 85% — confirmed copy issues: "We are validating your payment with Stripe" shown post-payment; session ID shown raw
  - Impact: 75% — UX improvement; no revenue or measurement impact
- **Acceptance:**
  - `thankyou.body` key updated to "Your payment was confirmed." (or equivalent IT translation)
  - `thankyou.reference` displays first 8 characters of session ID only (e.g. `cs_live_a1`)
  - "We'll email you tracking details" sentence added (new i18n key)
  - EN and IT translations updated; ES/DE stubs carry EN copy (TASK-01 handles stubs)
- **Validation contract:**
  - TC-01: ThankYouPanel renders with confirmed-payment text for `paymentStatus === "paid"`
  - TC-02: Reference displays truncated session ID, not full `cs_live_...` string
  - TC-03: No i18n keys missing in EN or IT
- **Execution plan:** Update i18n keys → update ThankYouPanel render logic for reference truncation → verify in local dev
- **Planning validation:** None required for S task
- **Scouts:** None
- **Edge Cases & Hardening:** Reference truncation must handle session IDs shorter than 8 chars (unlikely but guard with `slice(0, 8)`)
- **What would make this >=90%:** Component render test added for the confirmed-payment state
- **Rollout / rollback:**
  - Rollout: copy-only change; trivially reversible
  - Rollback: revert i18n keys and template
- **Documentation impact:** None

---

### TASK-02: Root layout gtag Script + Consent Mode v2 defaults + SPA pageview listener
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/app/layout.tsx` updated with `next/script` gtag tag; new `apps/cochlearfit/src/components/AnalyticsProvider.tsx` client component for SPA pageview listener; added to `apps/cochlearfit/src/app/[lang]/layout.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/app/layout.tsx`, `apps/cochlearfit/src/app/[lang]/layout.tsx`, `apps/cochlearfit/src/components/AnalyticsProvider.tsx` (new)
- **Depends on:** TASK-D01, TASK-03
- **Blocks:** TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-12
- **Confidence:** 75%
  - Implementation: 90% — root layout confirmed clean; `next/script` with `strategy="afterInteractive"` is documented Next.js pattern; `AnalyticsProvider` is a standard client component with `usePathname` + `useEffect`
  - Approach: 75% — approach depends on TASK-D01 decision. Under Option A (A2, default): gtag.js loads unconditionally; consent defaults to `analytics_storage: 'denied'`; no events fire until consent update — Script loading logic is unconditional. Under Option A (A1): Script not loaded until consent — changes Script placement and requires deferred config init. Held-back test: if D01 resolves to A1, Script loading logic changes materially. Cap at 75.
  - Impact: 90% — all client-side events are dead without this; foundation task
- **Acceptance:**
  - `gtag('consent', 'default', {...})` called before `gtag('config', ...)` (verified by script order in `<head>`)
  - `send_page_view: false` confirmed in `gtag('config', ...)` call
  - `AnalyticsProvider` emits `page_view` event on every pathname/search change, including initial render
  - No double `page_view` on initial load
  - `NEXT_PUBLIC_GA4_MEASUREMENT_ID` env var present (can be `G-PLACEHOLDER` at build time)
  - Core Web Vitals: Lighthouse score does not regress by >5 points on LCP after Script tag addition
- **Validation contract:**
  - TC-01: Soft navigation (click internal link) → single `page_view` in DebugView, correct `page_location`
  - TC-02: Hard refresh → single `page_view`, no duplicate
  - TC-03: With consent denied (default) → no GA4 events in network tab (Option A only)
  - TC-04: Root layout renders without hydration error with new Script tag
  - TC-05: `NEXT_PUBLIC_GA4_MEASUREMENT_ID` missing → graceful no-op (Script not loaded)
- **Execution plan:** Red → add `<Script>` with inline Consent Mode defaults to `layout.tsx`; create `AnalyticsProvider.tsx` with `usePathname`+`useEffect`; add to `[lang]/layout.tsx` → Green → verify TC-01/TC-02 in dev → Refactor → extract inline consent defaults to `analytics.ts` constant
- **Planning validation:**
  - Checks run: confirmed `layout.tsx` has no existing `<Script>` tags; `<head>` contains only `JsonLdScript`; `[lang]/layout.tsx` is a server component — `AnalyticsProvider` must be a separate client component child
  - Unexpected findings: `html lang="en"` is hardcoded in root layout; `HtmlLangUpdater` updates it client-side — no conflict with analytics
- **Scouts:** Confirm whether `useSearchParams` in `AnalyticsProvider` requires a `Suspense` boundary (Next.js App Router requirement for client components using `useSearchParams`)
- **Edge Cases & Hardening:** `AnalyticsProvider` must be wrapped in `Suspense` if using `useSearchParams` (Next.js requirement). Measurement ID missing → do not load Script (env var guard). Under Option A (A2, default): Script loads unconditionally — Consent Mode v2 requires gtag to be loaded before consent updates can be sent. Under Option A (A1, strictest): Script is conditionally loaded only after consent accept; `gtag.js` is injected dynamically post-consent; `send_page_view: false` still applies; `AnalyticsProvider` must emit `page_view` immediately after script loads. A1 requires additional implementation logic in `ConsentBanner` (TASK-04). Plan defaults to A2 pending TASK-D01 confirmation.
- **What would make this >=90%:** TASK-D01 resolved to confirmed option; Lighthouse before/after confirmed; DebugView verified in staging
- **Rollout / rollback:**
  - Rollout: additive — new Script tag and new component
  - Rollback: remove `<Script>` from layout; remove `AnalyticsProvider` from `[lang]/layout.tsx`
- **Documentation impact:** Add `NEXT_PUBLIC_GA4_MEASUREMENT_ID` to `.env.example` / env docs

---

### TASK-04: Consent banner component
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/ConsentBanner.tsx` (new); integrated into `apps/cochlearfit/src/app/[lang]/layout.tsx`; new i18n keys in `en.json`, `it.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/ConsentBanner.tsx` (new), `apps/cochlearfit/src/app/[lang]/layout.tsx`, `apps/cochlearfit/i18n/en.json`, `apps/cochlearfit/i18n/it.json`
- **Depends on:** TASK-D01, TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 75%
  - Implementation: 80% — component pattern is standard; localStorage flag for persistence is well-known; shell layout is a server component so banner must be a client component child
  - Approach: 75% — scope of banner (text, accept-only vs accept/decline, styling) depends on TASK-D01 confirmation. Option A requires a real consent trigger before analytics fire; Option B may simplify to informational only.
  - Impact: 85% — EEA legal requirement; without this, gtag firing on page load for Italian users may violate ePrivacy Directive
- **Acceptance:**
  - Banner appears on first visit for all locales; disappears after user accepts
  - On accept: `gtag('consent', 'update', { analytics_storage: 'granted' })` called
  - Consent state persisted in localStorage (`cochlearfit:consent` key); banner does not re-appear on return visits
  - Banner uses semantic tokens (no hardcoded colours); follows existing component patterns
  - New i18n keys for banner text in `en.json` and `it.json`
- **Validation contract:**
  - TC-01: First visit → banner visible; GA4 events blocked in network tab
  - TC-02: User accepts → banner disappears; `gtag('consent', 'update', ...)` called; subsequent events visible in network tab
  - TC-03: Return visit (consent accepted) → banner absent; GA4 events fire immediately
  - TC-04: Return visit (consent denied / not given) → banner re-appears (or remains hidden if "dismissed without accepting" is tracked as denied)
  - TC-05: Banner uses design system tokens; no arbitrary colour values
- **Execution plan:** Red → `ConsentBanner.tsx` with localStorage check + accept handler; add i18n keys → Green → TC-01 to TC-03 pass in dev → Refactor → extract consent state to a `useConsent()` hook for reuse
- **Planning validation:**
  - Checks run: `[lang]/layout.tsx` is a server component — `ConsentBanner` must be a `"use client"` child component
  - Unexpected findings: None
- **Scouts:** Check whether shell/modal or existing bottom-bar patterns should be reused for banner styling; check design system for `fixed bottom` pattern
- **Edge Cases & Hardening:** Banner must not block checkout flow (z-index management). If consent is revoked (future scope), handle gracefully. Avoid FOUC — banner should appear without layout shift.
- **What would make this >=90%:** TASK-D01 confirmed; unit test for `useConsent` hook; accessibility check (keyboard navigable, aria-label)
- **Rollout / rollback:**
  - Rollout: new component; additive; banner only shows on first visit
  - Rollback: remove `ConsentBanner` from layout; analytics events continue without consent check
- **Documentation impact:** None

---

### TASK-05: view_item_list on ProductGrid
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/ProductGrid.tsx` updated with mount-time `view_item_list` event
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/ProductGrid.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 85% — `ProductGrid.tsx` fully read; `"use client"` memo component; `products` prop is the source; `useEffect` on mount is the insertion point
  - Approach: 85% — GA4 `view_item_list` spec: `items[]` with `item_id`, `item_name`, `item_list_name`, `index`; `item_list_name` depends on render context (Shop vs Home featured) — pass as prop with default
  - Impact: 75% — TOFU measurement; useful but not conversion-critical
- **Acceptance:**
  - `view_item_list` fires once on mount for each ProductGrid instance
  - `items[]` includes `item_id` (variantId of first/default variant — consistent with PDP `view_item` and server-side `purchase`), `item_name`, `item_list_name`, `index`
  - `item_list_name` prop accepted by `ProductGrid`; defaults to `"featured_products"` on Home, `"shop_listing"` on Shop
  - Event does not fire during SSR
- **Validation contract:**
  - TC-01: Shop page loads → single `view_item_list` with `item_list_name: "shop_listing"` in DebugView
  - TC-02: Home page loads → single `view_item_list` with `item_list_name: "featured_products"` in DebugView
  - TC-03: No event on server render (guard confirmed)
- **Execution plan:** Add `item_list_name` prop to `ProductGrid`; add `useEffect` mount handler calling `trackEvent('view_item_list', {...})`; update callers in shop and home pages to pass `item_list_name`; `item_id` for each product = first/default variant ID (not `productId`) for consistency with `view_item` and `purchase`
- **Planning validation:** None required for S task; ProductGrid source confirmed
- **Scouts:** None
- **Edge Cases & Hardening:** `useEffect` with empty dep array to fire once on mount only; `products` array may be empty — guard with `products.length > 0`; ProductGrid products are passed as a prop from a server component — no hydration race (unlike cart-derived events)
- **What would make this >=90%:** Unit test asserting `window.gtag` called with correct params; confirm `item_list_name` on both calling pages
- **Rollout / rollback:**
  - Rollout: additive event; no visual change
  - Rollback: remove `useEffect`
- **Documentation impact:** None

---

### TASK-06: select_item on ProductCard click
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/ProductCard.tsx` updated with `select_item` on navigate/click
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/ProductCard.tsx`
- **Depends on:** TASK-03, TASK-05
- **Blocks:** CHECKPOINT-A
- **Confidence:** 75%
  - Implementation: 80% — ProductCard not directly read; assumed to be a `"use client"` component wrapping a `Link` to PDP; if navigation is via `<Link>`, `onClick` handler is the insertion point
  - Approach: 75% — if `ProductCard` uses `<Link>` (standard Next.js pattern), `onClick` on `<Link>` is the right hook. If it uses `router.push`, also fine. Held-back test: ProductCard not read — if it lacks a click handler entirely, adding one may require structural change. This unknown could drop below 75. Cap at 75.
  - Impact: 75% — product discovery funnel step; useful for TOFU analysis
- **Acceptance:**
  - `select_item` fires on ProductCard click with `item_list_name` (from prop or context), `item_id`, `item_name`, `index`
  - Navigation to PDP still occurs (event does not block navigation)
- **Validation contract:**
  - TC-01: Click on ProductCard → `select_item` in DebugView with correct product data
  - TC-02: Navigation to PDP occurs after event fires
  - TC-03: No event on SSR
- **Scouts:** Read `ProductCard.tsx` before build to confirm click handler pattern; if it uses `<Link>` only, wrap content in `onClick` prop
- **Edge Cases & Hardening:** `onClick` must not block navigation; fire event synchronously (not async)
- **What would make this >=90%:** ProductCard confirmed read; unit test added
- **Rollout / rollback:** Additive; revert `onClick` handler

---

### TASK-07: view_item on ProductDetail mount
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/ProductDetail.tsx` updated with mount-time `view_item` event
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/ProductDetail.tsx`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 80%
  - Implementation: 90% — `ProductDetail.tsx` fully read; `"use client"` component; `product` prop available with all needed fields; `useEffect` on mount is the insertion point
  - Approach: 85% — GA4 `view_item`: `items[]` with single item; `item_id`, `item_name`, `item_category` (from `product.style`), `price` (from `selectedVariant.price`), `currency`
  - Impact: 75% — PDP view measurement; useful for product interest analysis
- **Acceptance:**
  - `view_item` fires once on ProductDetail mount
  - `items[]` includes `item_id: selectedVariant.id`, `item_name: product.name`, `item_category`, `price`, `currency`
  - Event does not re-fire on variant selection changes
- **Validation contract:**
  - TC-01: PDP loads → single `view_item` in DebugView with correct product data
  - TC-02: User changes size/colour → no additional `view_item` fires
  - TC-03: No event on SSR
- **Execution plan:** Add `useEffect(() => { trackEvent('view_item', {...}) }, [])` — empty dep array ensures once-only
- **Planning validation:** None required for S task; ProductDetail fully read
- **Scouts:** None
- **Edge Cases & Hardening:** `product` prop is always defined (PDP 404s if not found; `notFound()` called in page); no null guard needed
- **What would make this >=90%:** Unit test with mock `trackEvent`
- **Rollout / rollback:** Additive; remove `useEffect`

---

### TASK-08: add_to_cart / remove_from_cart in UI handlers
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/ProductDetail.tsx` `handleAdd` updated; `apps/cochlearfit/src/components/cart/CartItemRow.tsx` remove handler updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/ProductDetail.tsx`, `apps/cochlearfit/src/components/cart/CartItemRow.tsx`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 75%
  - Implementation: 85% — `ProductDetail.tsx` fully read: `handleAdd` (line 39) is the correct insertion point for `add_to_cart`; `CartItemRow.tsx` not read — remove handler location unknown
  - Approach: 80% — UI handler placement (not CartContext) is confirmed correct; prevents hydration/clear pollution
  - Impact: 85% — add-to-cart rate is a key funnel metric
  - Held-back test: CartItemRow not read — if remove action is dispatched from inside CartContext rather than a UI button, approach changes. This unknown could drop below 80. Cap at 75.
- **Acceptance:**
  - `add_to_cart` fires in `handleAdd` with `items[]` containing `item_id: selectedVariant.id`, `item_name`, `item_variant: "{size}/{color}"`, `price`, `quantity`, `currency`
  - `remove_from_cart` fires in CartItemRow remove button handler with equivalent item data
  - Neither event fires on cart hydration from localStorage (hard-refresh test)
  - `ProductStickyBar` reuses same `handleAdd` — no additional instrumentation needed
- **Validation contract:**
  - TC-01: Click "Add to cart" → `add_to_cart` in DebugView with correct params
  - TC-02: Click remove in CartItemRow → `remove_from_cart` in DebugView
  - TC-03: Hard-refresh with items in localStorage → no `add_to_cart` fires (hydration guard)
  - TC-04: Sticky bar "Add to cart" → `add_to_cart` fires (reuses `handleAdd`)
- **Scouts:** Read `CartItemRow.tsx` before build to confirm remove handler and available item data (variantId, product name, price)
- **Edge Cases & Hardening:** `add_to_cart` in `handleAdd` fires even when `isOutOfStock` guard is already applied (button disabled); no additional guard needed — button is disabled when OOS
- **What would make this >=90%:** CartItemRow confirmed read; unit test for both handlers
- **Rollout / rollback:**
  - Rollout: additive event calls in existing handlers
  - Rollback: remove `trackEvent` calls

---

### TASK-09: view_cart on CartContents mount
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/cart/CartContents.tsx` updated with mount-time `view_cart` event
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/cart/CartContents.tsx`
- **Depends on:** TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 75%
  - Implementation: 90% — `CartContents.tsx` fully read; `"use client"` memo component; `items` from `useCart()` available; mount guard is clear
  - Approach: 80% — `view_cart` event with `value` (subtotal) and `currency` and `items[]`
  - Impact: 65% — cart abandonment analysis useful but not critical path for initial launch measurement
- **Acceptance:**
  - `view_cart` fires exactly once when cart is both hydrated and non-empty; fires correctly on hard-refresh with pre-filled cart (localStorage hydration case — items may be empty at mount but load a moment later)
  - `value = subtotalCents / 100` (decimal currency units), `currency` = uppercase ISO code (e.g. `"EUR"`) included
  - No event when cart is empty
- **Validation contract:**
  - TC-01: Navigate to `/cart` with items → `view_cart` in DebugView with correct `value` and `currency`
  - TC-02: Navigate to `/cart` with empty cart → no `view_cart`
  - TC-03: No event on SSR
  - TC-04: Hard-refresh with pre-filled cart → `view_cart` fires after localStorage hydration (not suppressed by empty-at-mount)
- **Planning validation:** None required for S task; CartContents fully read
- **Scouts:** Confirm whether CartContext exposes an `isHydrated` boolean; if not, the fired-once ref pattern with `items` dependency is the fallback
- **Edge Cases & Hardening:** Do NOT use empty dep array — cart items hydrate from localStorage after mount, so `items.length` may be 0 at component mount. Use a `useRef fired = false` guard with dependency on `[items]` (or `[items, isHydrated]` if CartContext exposes hydration state): fire event when `!fired.current && items.length > 0`; set `fired.current = true`. The ref guard ensures single-fire despite the dependency.
- **What would make this >=90%:** Impact raised if attribution data shows /cart as a high drop-off point
- **Rollout / rollback:** Additive; remove `useEffect`

---

### TASK-10: begin_checkout on Checkout page mount
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx` updated with mount-time `begin_checkout` event
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx`
- **Depends on:** TASK-03
- **Blocks:** TASK-11, CHECKPOINT-A
- **Confidence:** 85%
  - Implementation: 90% — `CheckoutPanel.tsx` fully read; `"use client"` component; `items`, `subtotal`, `currency` from `useCart()` all available; `useEffect` on mount is the insertion point
  - Approach: 85% — page mount (not button click) placement confirmed correct per fact-find critique
  - Impact: 85% — checkout entry rate is a critical funnel metric for identifying cart-to-checkout drop-off
- **Acceptance:**
  - `begin_checkout` fires exactly once when cart is both hydrated and non-empty; fires correctly on hard-refresh with pre-filled cart (localStorage hydration case)
  - `value = subtotalCents / 100` (decimal currency units), `currency` = uppercase ISO code (e.g. `"EUR"`), and `items[]` included
  - A separate `checkout_redirect_initiated` custom event fires on the "Pay with Stripe" button click (for CTA click measurement; does not replace `begin_checkout`)
  - No event fires when cart is empty (defensive guard)
- **Validation contract:**
  - TC-01: Navigate to `/checkout` with items → `begin_checkout` in DebugView at page load, before any button click
  - TC-02: Click "Pay with Stripe" → `checkout_redirect_initiated` fires separately in DebugView
  - TC-03: Navigate to `/checkout` with empty cart → no `begin_checkout`
  - TC-04: Hard-refresh at `/checkout` with pre-filled cart → `begin_checkout` fires after localStorage hydration (not suppressed by empty-at-mount)
- **Execution plan:** Add `firedRef = useRef(false)` and `useEffect(() => { if (!firedRef.current && items.length > 0) { trackEvent('begin_checkout', {...}); firedRef.current = true; } }, [items])` — dependency on `items` (or `[items, isHydrated]`) with ref guard ensures single-fire regardless of hydration timing. Add `trackEvent('checkout_redirect_initiated', {...})` inside `handleCheckout` before the fetch.
- **Planning validation:** None required for S task; CheckoutPanel fully read
- **Scouts:** Confirm whether CartContext exposes an `isHydrated` boolean; same as TASK-09 scout
- **Edge Cases & Hardening:** Do NOT use empty dep array — cart hydrates from localStorage after mount; `items.length` may be 0 at component mount. The `useRef` fired-once guard with `[items]` dependency fires correctly once items appear, and never fires again even if `items` array reference changes later.
- **What would make this >=90%:** Unit test asserting `begin_checkout` on mount vs `checkout_redirect_initiated` on click
- **Rollout / rollback:** Additive; remove event calls

---

### TASK-12: ThankYouPanel — purchase_confirmed_ui + cart.clear
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx` updated: add `useCart().clear()` + `purchase_confirmed_ui` event on first paid session load
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx`
- **Depends on:** TASK-D02, TASK-03
- **Blocks:** CHECKPOINT-A
- **Confidence:** 85%
  - Implementation: 90% — `ThankYouPanel.tsx` fully read; `paymentStatus === "paid"` gate is correct; `useRef` fired-once guard pattern is standard React
  - Approach: 85% — `purchase_confirmed_ui` (not `purchase`) confirmed by TASK-D02 default; `cart.clear()` in same effect gated on paid status
  - Impact: 85% — cart clear is UX-critical; `purchase_confirmed_ui` is the client-side conversion signal that pairs with server-side `purchase`
- **Acceptance:**
  - On first successful load with `paymentStatus === "paid"`: `purchase_confirmed_ui` fires once with `transaction_id: state.data.id`, `value: state.data.total / 100` (decimal currency units), `currency: state.data.currency` (uppercase)
  - `cart.clear()` called in the same effect
  - Does not re-fire within the same render lifecycle (`useRef` guard prevents re-render duplicates)
  - Does not re-fire on page reload: `sessionStorage` key `"cochlearfit:purchase_confirmed_ui:<sessionId>"` is set after first fire; effect checks this key before firing
  - No `purchase` (ecommerce) event fired from this component (TASK-D02 canonical source = server-side)
- **Validation contract:**
  - TC-01: Thank You page loads with paid session → `purchase_confirmed_ui` in DebugView; cart subsequently empty
  - TC-02: Page reload → `sessionStorage` key `"cochlearfit:purchase_confirmed_ui:<sessionId>"` already set → no second `purchase_confirmed_ui` fires; cart remains empty
  - TC-03: Thank You page loads with non-paid session (`payment_status !== "paid"`) → no event, no cart clear
  - TC-04: No GA4 `purchase` event emitted from client (DebugView confirms absence)
- **Execution plan:** Add `firedRef = useRef(false)`; in `useEffect` when `state.status === 'success' && state.data.paymentStatus === 'paid'`: (1) check `sessionStorage.getItem('cochlearfit:purchase_confirmed_ui:' + sessionId)` — skip entire block if already set; (2) if not set: call `trackEvent('purchase_confirmed_ui', {...})`, call `cart.clear()`, call `sessionStorage.setItem('cochlearfit:purchase_confirmed_ui:' + sessionId, '1')`, set `firedRef.current = true`; `firedRef` prevents re-fire on re-render within the same load; `sessionStorage` prevents re-fire on reload; add `useCart()` import
- **Planning validation:** None required for S task; ThankYouPanel fully read
- **Scouts:** None
- **Edge Cases & Hardening:** `firedRef` prevents re-fire within the same render lifecycle. `sessionStorage` persists the guard across page reloads keyed by `sessionId`. `sessionStorage` is tab-scoped and clears on tab close, so it does not accumulate across unrelated orders. `cart.clear()` is safe even if cart was already empty. This matters for CHECKPOINT-B: without the sessionStorage guard, `purchase_confirmed_ui` count can drift above `purchase` count simply due to user refreshes.
- **What would make this >=90%:** Unit test asserting fired-once behaviour and cart.clear call; TASK-D02 confirmed
- **Rollout / rollback:**
  - Rollout: additive; cart.clear is low-risk (post-purchase state only)
  - Rollback: remove effect additions

---

### CHECKPOINT-A: Validate client-side events in GA4 DebugView
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` on TASK-11 and TASK-13 before proceeding
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/cochlearfit-ga4-funnel/plan.md`
- **Depends on:** TASK-02, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09, TASK-10, TASK-12
- **Blocks:** TASK-11
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents wiring identity capture on top of broken client events
  - Impact: 95% — controls downstream risk in TASK-11 and TASK-13
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-11 and TASK-13
  - All DebugView verification runs **with consent granted** (`analytics_storage: 'granted'` active) — the following events verified in GA4 DebugView for a staging test session: `page_view`, `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `purchase_confirmed_ui`
  - No phantom `add_to_cart` on hard-refresh (hydration guard verified)
  - No `purchase` (ecommerce) event from client in DebugView (confirmed absence — canonical source is server-side)
  - Consent banner blocks all events when `analytics_storage=denied` (consent denied test, Option A only): no GA4 network calls in browser DevTools network tab
- **Horizon assumptions to validate:**
  - All client-side event items arrays have correct `item_id`, `item_name`, `price`, `currency` fields
  - `begin_checkout` fires on page mount, not button click
  - `purchase_confirmed_ui` fires exactly once per paid session
- **Validation contract:** GA4 DebugView session screenshot / export confirming all events; consent denial blocking confirmed
- **Planning validation:** No code validation; manual DebugView acceptance
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Update plan with CHECKPOINT-A pass evidence

---

### TASK-11: GA identity capture in CheckoutPanel + worker metadata
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx` extended to capture `client_id`/`session_id`/`session_number`; `apps/cochlearfit-worker/src/index.ts` extended to write GA fields to Stripe session metadata
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/cochlearfit/src/components/checkout/CheckoutPanel.tsx`, `apps/cochlearfit-worker/src/index.ts`, `apps/cochlearfit/src/lib/checkout.ts` (payload type extension)
- **Depends on:** TASK-D02, TASK-03, TASK-10, CHECKPOINT-A
- **Blocks:** TASK-13
- **Confidence:** 75%
  - Implementation: 80% — `gtag('get', measurementId, 'client_id', cb)` is callback-style; must be Promise-wrapped before `createCheckoutSession` is called; worker `buildStripeForm` (line 198) accepts `params.set(...)` calls for metadata — confirmed insertion point
  - Approach: 75% — overall approach is sound; async nature of `gtag('get', ...)` requires careful sequencing (two parallel Promise-wrapped calls, then await both, then call `createCheckoutSession`). Not complex but not trivial.
  - Impact: 80% — session stitching upgrades server-side purchase from "isolated event" to "attributed conversion"; high value for channel attribution
- **Acceptance:**
  - `CheckoutPanel.handleCheckout` reads current consent state (via consent hook or `localStorage` check) and passes `gaConsentGranted: boolean` in the checkout payload
  - If consent granted: calls `gtag('get', ...)` for `client_id` and `session_id` before `createCheckoutSession`; passes `gaClientId`, `gaSessionId`, `gaSessionNumber` in payload
  - If consent denied: skips `gtag('get', ...)` entirely; passes `gaConsentGranted: false`; checkout proceeds normally
  - Worker `handleCheckoutSession` writes all GA fields to Stripe session metadata: `ga_client_id`, `ga_session_id`, `ga_session_number`, `ga_consent_granted`
  - Worker `handleWebhook` reads all GA fields from `session.metadata`; passes `ga_consent_granted` to MP decision logic in TASK-13
  - `gaSessionId` coerced to `Number()` before MP params insertion
  - Existing checkout flow unchanged when GA fields absent (all fields optional)
- **Validation contract:**
  - TC-01: Initiate checkout after consent → Stripe session metadata contains `ga_client_id` and `ga_consent_granted: "true"` (verifiable in Stripe Dashboard)
  - TC-02: Initiate checkout before consent (Option A) → metadata contains `ga_consent_granted: "false"`; `ga_client_id` absent; checkout still completes
  - TC-03: Webhook handler reads `ga_consent_granted` flag from session metadata and passes to TASK-13 MP decision (verified via worker logs in staging)
  - TC-04: `gaSessionId` in MP params is numeric (not string)
  - TC-05: Worker tests (`src/__tests__/`) pass without regression
- **Execution plan:** Red → extend checkout type `{ items, locale, gaConsentGranted: boolean, gaClientId?, gaSessionId?, gaSessionNumber? }`; read consent state in `handleCheckout` first; if granted, wrap `gtag('get', ...)` as Promises and await both; pass all GA fields to `createCheckoutSession`; extend worker `buildStripeForm` to write `ga_consent_granted`, `ga_client_id`, `ga_session_id`, `ga_session_number` to Stripe metadata → Green → TC-01/TC-02 verified in Stripe test mode → Refactor → extract GA identity fetch to `getGaIdentity(): Promise<{ clientId?, sessionId?, sessionNumber? }>` helper in `analytics.ts`
- **Planning validation:**
  - Checks run: worker `buildStripeForm` at line 198 confirmed; `params.set()` pattern confirmed; `checkout.ts` library file not read — scout required
  - Unexpected findings: None yet
- **Scouts:** Read `apps/cochlearfit/src/lib/checkout.ts` to confirm `createCheckoutSession` payload type definition before extending; confirm `handleCheckoutSession` in worker reads full body including `gaClientId`
- **Edge Cases & Hardening:** `gtag('get', ...)` callback may not fire if gtag is blocked by an ad-blocker even after consent; must use `Promise.race` with a timeout (e.g. 500ms) so checkout does not hang — on timeout, `gaClientId` will be `undefined` but `gaConsentGranted: true` is still passed; TASK-13 will use fallback `client_id` in this case (revenue captured, not stitched). `gaSessionNumber` from `gtag('get', ...)` may return as string — coerce to Number. If consent is denied (Option A), skip `gtag('get', ...)` calls entirely — no timeout delay on checkout for non-consenting users.
- **What would make this >=90%:** CHECKPOINT-A passed; Stripe test mode confirms metadata written; worker test added for GA field passthrough
- **Rollout / rollback:**
  - Rollout: payload extension is additive; GA fields are optional; no breaking change
  - Rollback: remove GA field extraction from `handleCheckout`; remove metadata writes from worker

---

### TASK-13: Worker Measurement Protocol canonical purchase event
- **Type:** IMPLEMENT
- **Deliverable:** `apps/cochlearfit-worker/src/index.ts` updated: GA4 MP `purchase` event sent in `handleWebhook` on `checkout.session.completed` with idempotency, validation mode, `ctx.waitUntil`, and consent gate
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/cochlearfit-worker/src/index.ts`, `apps/cochlearfit-worker/wrangler.toml` (new env vars)
- **Depends on:** TASK-11, TASK-D01, TASK-D02
- **Blocks:** CHECKPOINT-B
- **Confidence:** 75%
  - Implementation: 80% — worker `handleWebhook` fully read; `ORDERS_KV` pattern established; `fetch` + `ctx.waitUntil` are Cloudflare Worker primitives; MP payload structure fully specified in fact-find; all pieces are independently known
  - Approach: 75% — L task; correct approach fully designed. Capped at 75 because TASK-D01 (consent gate behaviour) and TASK-D02 (canonical source) are blocking dependencies whose defaults are assumed. If defaults are confirmed without change, approach is solid.
  - Impact: 90% — this is the canonical `purchase` event; without it, GA4 has no revenue data
- **Acceptance:**
  - On `checkout.session.completed` webhook: check `ORDERS_KV.get("ga4:purchase_sent:${sessionId}")` — skip if set (idempotency)
  - MP payload: `{ client_id, events: [{ name: "purchase", params: { transaction_id, value (in currency units), currency, session_id (Number), engagement_time_msec: 100, items[] } }] }`
  - If `GA4_VALIDATION_MODE=true` (dev/CI schema validation): POST to `region1.google-analytics.com/debug/mp/collect`; log `validationMessages`; do NOT set idempotency KV key; note: debug endpoint is schema validation only — events do NOT appear in GA4 DebugView or reporting
  - If `GA4_VALIDATION_MODE=false` (staging and prod): POST to `region1.google-analytics.com/mp/collect`; set `ORDERS_KV.put("ga4:purchase_sent:${sessionId}", "1")` only after successful fetch; on staging, include `"debug_mode": true` in event params — this is the only way to see MP events in GA4 DebugView
  - If `ga_consent_granted` metadata flag is `false` (consent explicitly denied — set by TASK-11): skip MP call; log `ga4_purchase_skipped_consent_denied`
  - If `ga_consent_granted` metadata flag is `true` but `ga_client_id` absent (tracking blocked, `gtag('get',...)` timeout): send MP with fallback `client_id = 'cf-fallback-' + sessionId`; log `ga4_purchase_sent_no_stitch`; revenue event captured but not stitched to a browser session
  - Entire MP sequence wrapped in `ctx.waitUntil()`
  - Simulated webhook retry: second call to handler with same `sessionId` → idempotency check skips MP call; `ORDERS_KV.put` not called twice
  - Existing worker tests pass; new unit test added for idempotency logic (using `fetch` mock and KV mock)
- **Validation contract:**
  - TC-01: Schema validation gate (dev/CI) — Stripe test webhook → `GA4_VALIDATION_MODE=true` → POST to `/debug/mp/collect` → response contains zero `validationMessages`; note: event does NOT appear in GA4 DebugView (debug endpoint is schema-only)
  - TC-02: Staging DebugView verification — `GA4_VALIDATION_MODE=false` + `debug_mode: true` in event params → POST to real `/mp/collect` → GA4 DebugView shows `purchase` event; worker logs show `ga4_purchase_sent`
  - TC-03: Session stitching — `client_id` in MP payload matches browser `client_id` captured in TASK-11 (verified in GA4 DebugView Realtime / event details)
  - TC-04: Idempotency — webhook handler called twice with same session → worker logs show `ga4_idempotency_skip` on second call; GA4 shows single `purchase` event
  - TC-05: `session_id` in MP params is numeric (coercion tested)
  - TC-06: `value` in MP params = `amountTotal / 100` (decimal currency units, not raw cents); `currency` = uppercase ISO code
  - TC-07: Consent denied — `ga_consent_granted: false` in session metadata → MP not called; log `ga4_purchase_skipped_consent_denied`
  - TC-08: Consent granted, ga_client_id missing — `ga_consent_granted: true` + absent `ga_client_id` → MP fires with fallback `client_id`; log `ga4_purchase_sent_no_stitch`
  - TC-09: All existing `src/__tests__/` pass
- **Execution plan:** Red → add `sendGa4Purchase()` function to worker; add KV idempotency check; build MP payload from session + metadata; add `ctx.waitUntil()`; add env var validation mode switch → Green → TC-01 through TC-05 pass in staging → Refactor → extract MP payload builder to testable pure function; add unit test using `fetch` mock
- **Planning validation:**
  - Checks run: `handleWebhook` at line 399 confirmed in fact-find; `ORDERS_KV.put` pattern established at line 425; `ctx.waitUntil` not currently used — must confirm `ctx` is available in the `fetch` handler signature (check Cloudflare Worker v2 API)
  - Unexpected findings: Worker `fetch` handler signature is `fetch(request: Request, env: Env): Promise<Response>` — `ctx` (ExecutionContext) is the third argument. Must update handler signature to accept `ctx`.
- **Scouts:** Confirm worker handler signature accepts `ctx: ExecutionContext` as third arg; check `wrangler.toml` for existing env var patterns to ensure `GA4_API_SECRET` is added as a secret (not a plain var)
- **Edge Cases & Hardening:** MP fetch timeout — add `AbortController` with 5s timeout inside `waitUntil` to prevent hanging. Session metadata fields may be absent (pre-TASK-11 sessions) — use fallback `client_id` (e.g. `"unknown-${sessionId}"`) or skip MP. Amount total from Stripe is in cents — divide by 100 for `value`. Currency from Stripe is lowercase — uppercase for GA4.
- **What would make this >=90%:** TASK-D01 and TASK-D02 confirmed; TC-02 (zero `validationMessages`) passed; end-to-end real Stripe test purchase verified
- **Rollout / rollback:**
  - Rollout: additive to webhook handler; no change to checkout session creation or status routes
  - Rollback: remove `sendGa4Purchase()` call from `handleWebhook`; remove env vars from `wrangler.toml`
- **Documentation impact:** Add `GA4_API_SECRET`, `GA4_MEASUREMENT_ID`, `GA4_VALIDATION_MODE` to worker env docs / `wrangler.toml` comments

---

### CHECKPOINT-B: Validate server-side purchase — no duplicates, stitching confirmed
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/cochlearfit-ga4-funnel/plan.md`
- **Depends on:** TASK-13
- **Blocks:** —
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — validates the most critical risk in the plan (purchase deduplication)
  - Impact: 95% — without this checkpoint, silent duplicate purchase events are possible in prod
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run; `/lp-do-replan` on any open downstream tasks
  - For a single Stripe test `session_id`: GA4 shows exactly 1 `purchase` event
  - Worker logs show idempotency skip on simulated second webhook call
  - `purchase_confirmed_ui` count and `purchase` count match (1:1 for paid sessions)
  - MP `purchase` event attributed to correct `client_id` (session stitching verified in GA4 Realtime)
  - `validationMessages` from `/debug/mp/collect` confirmed zero before prod endpoint was enabled
- **Horizon assumptions to validate:**
  - KV GET/PUT is not atomic — concurrent webhook deliveries can race the idempotency check; residual duplicate risk is low but non-zero at this traffic scale; `transaction_id` in GA4 provides a last-line dedupe signal
  - Worker `ctx.waitUntil` completes before Cloudflare terminates the Worker instance
- **Validation contract:** GA4 Realtime + worker log evidence; Stripe test mode webhook retry simulation
- **Planning validation:** No code; manual acceptance
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Record CHECKPOINT-B pass evidence in plan Decision Log

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dual purchase sources inflate GA4 revenue | Resolved by design | Critical | Canonical = server-side MP; client fires `purchase_confirmed_ui` only |
| CartContext hydration emits phantom `add_to_cart` | High if not followed | High | Enforce UI handler placement (TASK-08); hydration test in TC-03 |
| `begin_checkout` undercounts if placed on button click | Prevented by design | Medium | Page mount placement in TASK-10 |
| EU consent non-compliance | High if not addressed | High | Consent Mode v2 + banner in TASK-02/TASK-04; TASK-D01 must be confirmed |
| MP payload malformed (GA4 returns 2xx silently) | Medium | High | Validation mode in TASK-13 TC-02; `/debug/mp/collect` gate before prod |
| Stripe webhook retries cause duplicate `purchase` | Medium | High | Idempotency KV key in TASK-13 (best-effort — Cloudflare KV GET/PUT is not atomic; concurrent webhook deliveries can race; residual duplicate risk is low but non-zero); `transaction_id` in GA4 is a last-line dedupe signal (GA4 de-dupes by `transaction_id` in some reports) |
| Worker MP fetch terminated before completion | Medium | Medium | `ctx.waitUntil()` in TASK-13 (and update handler signature to accept `ctx`) |
| GA identity absent (consent denied) → no MP purchase | High (Option A default) | Medium | TASK-11 passes `ga_consent_granted: false` flag; TASK-13 skips MP; correct and intentional under Option A |
| GA identity absent (consent granted, tracking blocked) → unstitched purchase | Low-Medium | Low | TASK-11 passes `ga_consent_granted: true` + absent `ga_client_id`; TASK-13 uses `cf-fallback-<sessionId>` as `client_id`; revenue captured, attribution lost |
| `gtag('get', ...)` hangs checkout if GA blocked | Medium | High | `Promise.race` + 500ms timeout in TASK-11 |
| SPA `page_view` double-counts | Prevented by design | Medium | `send_page_view: false` in `gtag('config', ...)` in TASK-02 |
| `useSearchParams` in `AnalyticsProvider` missing Suspense | Medium | Medium | Scout in TASK-02; add Suspense wrapper if needed |

## Observability

- Logging: Worker structured JSON logs (`console.info`) extended with `ga4_purchase_sent`, `ga4_purchase_skipped_no_client_id`, `ga4_idempotency_skip`, `ga4_mp_validation_messages` events
- Metrics: GA4 Funnel Exploration (post-launch); `purchase` vs Stripe Dashboard sessions gap monitoring (>10% gap = alert)
- Alerts/Dashboards: `purchase_confirmed_ui` : `purchase` ratio tracked weekly; divergence >10% triggers investigation

## Acceptance Criteria (overall)

- [ ] All 8 recommended ecommerce events fire in correct sequence for a test purchase session in GA4 DebugView
- [ ] No duplicate `purchase` events: GA4 shows exactly 1 per Stripe `session_id`; idempotency skip confirmed in worker logs on simulated retry (KV best-effort; residual risk acknowledged)
- [ ] MP payload passes `/debug/mp/collect` with zero `validationMessages` (schema validation, dev/CI — events do not appear in DebugView); staging DebugView verification uses real endpoint with `debug_mode: true` in event params
- [ ] Session stitching: MP `purchase` attributed to correct `client_id` (verified in GA4 Realtime)
- [ ] `add_to_cart` does not fire on cart localStorage hydration (hard-refresh test)
- [ ] `begin_checkout` fires on Checkout page mount, not on button click
- [ ] With consent denied (Option A): no GA4 events in browser network tab; `ga_consent_granted: false` in session metadata; no MP call from worker
- [ ] With consent granted but GA identity blocked (ad-blocker test): MP fires with fallback `client_id = "cf-fallback-<sessionId>"`; log shows `ga4_purchase_sent_no_stitch`
- [ ] Cart empty after Thank You page load for paid session
- [ ] PDP builds without error for all 4 locales (EN, IT, ES, DE)
- [ ] Cancel URL → `/cart` confirmed in Stripe test session
- [ ] "Edit cart" link present on Checkout page; resolves to correct locale cart path
- [ ] `thankyou.body` reflects confirmed payment; reference shows truncated session ID
- [ ] Worker `ctx.waitUntil` wraps MP fetch; confirmed via Cloudflare Worker logs
- [ ] All existing `apps/cochlearfit/__tests__/` and `apps/cochlearfit-worker/src/__tests__/` suites pass

## Decision Log

- 2026-02-18: Plan authored. Two DECISION tasks (TASK-D01 consent posture, TASK-D02 canonical purchase source) created with defaults (Option A and server-side MP respectively). Plan Status: Draft pending owner decision confirmation.
- 2026-02-18: Correctness review applied. Nine fixes: (1) TASK-01 stub marker changed from JSON comment to `__locale_stub: true` key; (2) TASK-12 reload deduplication added via `sessionStorage` alongside `useRef`; (3) TASK-09/10 hydration race fixed with fired-once ref + `[items]` dependency; (4) TASK-D01 Option A clarified as A1 (no-script) vs A2 (Consent Mode v2 — default); TASK-02 contradiction resolved; (5) item_id standardized to variantId across all list/click events; (6) value normalization made explicit (subtotalCents/100, uppercase currency) in cart-derived events; (7) TASK-13 debug endpoint vs DebugView separation made explicit in TCs; (8) consent gate logic updated — consent denied skips MP; consent granted but identity missing uses fallback client_id; `ga_consent_granted` flag added to TASK-11 payload; (9) KV idempotency acknowledged as best-effort; CHECKPOINT-B updated; two new risk rows added.

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3. DECISION and CHECKPOINT tasks scored but not dominating.

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-01 | 90% | S | 1 | 90 |
| TASK-03 | 85% | S | 1 | 85 |
| TASK-14 | 90% | S | 1 | 90 |
| TASK-15 | 80% | S | 1 | 80 |
| TASK-16 | 80% | S | 1 | 80 |
| TASK-02 | 75% | M | 2 | 150 |
| TASK-04 | 75% | M | 2 | 150 |
| TASK-05 | 80% | S | 1 | 80 |
| TASK-06 | 75% | S | 1 | 75 |
| TASK-07 | 80% | S | 1 | 80 |
| TASK-08 | 75% | S | 1 | 75 |
| TASK-09 | 75% | S | 1 | 75 |
| TASK-10 | 85% | S | 1 | 85 |
| TASK-12 | 85% | S | 1 | 85 |
| CHECKPOINT-A | 95% | S | 1 | 95 |
| TASK-11 | 75% | M | 2 | 150 |
| TASK-13 | 75% | L | 3 | 225 |
| CHECKPOINT-B | 95% | S | 1 | 95 |
| **Total** | | | **23** | **1845** |

**Overall-confidence: 1845 / 23 = 80%**

## Section Omission Rule

- Delivery & Channel Landscape: `None: code-change deliverable; no channel constraints`
- Business Validation Coverage: `None: code-change track; no business artifact hypotheses`
