---
Type: Plan
Status: Active
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Audit-Ref: b48884a6757b79c41102c47e047241b9dca805be (working-tree; plan.md is new/untracked)
Build-Progress: Wave 1 complete (TASK-01, TASK-02, TASK-04); Wave 2 in progress (TASK-03); Wave 3 pending (TASK-05)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-pdp-return-visit-capture
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG PDP Return-Visit Capture — Plan

## Summary

Adds a "Notify me" email capture form to the Caryina product detail page (PDP). Visitors who are not ready to buy immediately can submit their email with a GDPR consent checkbox and receive a confirmation email. The merchant also receives a notification. This closes the conversion gap for the 3–7 day consideration window that characterises the TikTok/Instagram acquisition audience buying €80–€150 bag charms. Implementation uses the existing `sendSystemEmail` pattern from the checkout route (Gmail SMTP via `GMAIL_USER`/`GMAIL_PASS`) and adds a new API route and client component only — no DB migration, no new external accounts.

## Active tasks

- [x] TASK-01: Create `NotifyMeForm.client.tsx` — Complete (2026-02-28)
- [x] TASK-02: Create `/api/notify-me/route.ts` and extend analytics allowlist — Complete (2026-02-28)
- [ ] TASK-03: Wire `NotifyMeForm` into PDP `page.tsx`
- [x] TASK-04: Update privacy policy content and env var documentation — Complete (2026-02-28)
- [ ] TASK-05: Unit tests for `NotifyMeForm` and `notify-me` route

## Goals

- A visible "Notify me" form on the PDP that captures email with explicit GDPR consent.
- A server-enforced consent gate (API route rejects submissions without `consent: true`).
- Fire-and-forget email sending: subscriber confirmation + merchant notification.
- Analytics event `notify_me_submit` routed correctly (analytics route allowlist extended) and emitted client-side from `NotifyMeForm` after successful API response.
- Privacy policy updated to reference email marketing collection.

## Non-goals

- Persistent DB storage of captured emails (v1 uses fire-and-forget to email only).
- Back-in-stock automated alerts (capture payload preserves `productSlug` for future use).
- Full marketing automation / drip sequences.
- Cookie consent banner (separate concern; this feature only adds a form-level checkbox).
- Resend/SendGrid integration (deferred; v1 uses Gmail SMTP via `sendSystemEmail`).

## Constraints & Assumptions

- Constraints:
  - `EMAIL_PROVIDER` env var must be set or `sendSystemEmail` throws immediately (no silent fallback). `GMAIL_USER` and `GMAIL_PASS` must also be set for real delivery — if absent while `EMAIL_PROVIDER` is set, `sendEmail` silently simulates (logs only). Both must be provisioned before launch for functional email delivery.
  - GDPR consent must be enforced server-side. API route returns 400 if `consent !== true`.
  - New API route must use `export const runtime = "nodejs"` (dynamic require in `sendSystemEmail` does not work in edge runtime).
  - Cloudflare Worker runtime does not support persistent filesystem writes. No flat-file persistence.
  - Privacy policy content lives in `data/shops/caryina/site-content.generated.json` (read by `getPolicyContent()` in `apps/caryina/src/lib/contentPacket.ts`).

- Assumptions:
  - `GMAIL_USER` and `GMAIL_PASS` are either already set (matching the checkout notification pattern) or can be set by the operator before launch.
  - The `notify_me_submit` analytics event requires extending `ALLOWED_EVENT_TYPES` in `apps/caryina/src/app/api/analytics/event/route.ts` — included in TASK-02.
  - Capture payload `{ email, productSlug, consentAt }` is persisted only in email to operator; no DB write.

## Inherited Outcome Contract

- **Why:** TikTok/Instagram-sourced visitors have a 3–7 day consideration window before purchasing at €80–€150. Without a return-visit mechanism, visitors who are not ready to buy immediately are permanently lost from the funnel.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** At least one functional return-visit mechanism live on the PDP within one build cycle, with a measurable submission event logged. Secondary: first email follow-up sent to at least one captured address within 7 days of launch.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/hbag-pdp-return-visit-capture/fact-find.md`
- Key findings used:
  - `sendSystemEmail` routes via Gmail SMTP (nodemailer), not Resend/SendGrid. Requires `GMAIL_USER`/`GMAIL_PASS`. Silently simulates if absent.
  - No user account system, no DB table for email captures — fire-and-forget is the correct v1 approach.
  - GDPR consent checkbox on form; no separate cookie banner required for email-only capture.
  - Analytics allowlist (`ALLOWED_EVENT_TYPES`) must be extended to include `notify_me_submit`.
  - Privacy policy content is in `site-content.generated.json`; must add a marketing email bullet.
  - PDP `page.tsx` and `StickyCheckoutBar.client.tsx` have no existing tests — new components need tests.

## Proposed Approach

- Option A (chosen): Gmail SMTP via `sendSystemEmail` — mirrors the existing checkout notification, zero new external accounts. Fire-and-forget to merchant email + subscriber confirmation.
- Option B (deferred): Resend via `sendCampaignEmail` — better deliverability at scale; requires `RESEND_API_KEY` account creation. Upgrade path documented; v2 can migrate.
- Chosen approach: **Option A** — minimal new infrastructure, proven pattern, upgradeable later.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `NotifyMeForm.client.tsx` | 85% | S | Complete (2026-02-28) | - | TASK-03, TASK-05 |
| TASK-02 | IMPLEMENT | Create `/api/notify-me/route.ts` + extend analytics allowlist | 85% | S | Complete (2026-02-28) | - | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Wire `NotifyMeForm` into PDP `page.tsx` | 85% | S | Pending | TASK-01, TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Update privacy policy content + env var docs | 85% | S | Complete (2026-02-28) | - | - |
| TASK-05 | IMPLEMENT | Unit tests for `NotifyMeForm` and `notify-me` route | 80% | M | Pending | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | All additive; no shared file mutations |
| 2 | TASK-03 | TASK-01, TASK-02 | Wires form into PDP |
| 3 | TASK-05 | TASK-01, TASK-02, TASK-03 | Tests require implementations to exist |

## Tasks

---

### TASK-01: Create `NotifyMeForm.client.tsx`

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx` (new)
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05

- **Confidence:** 85%
  - Implementation: 90% — form component pattern is established in `CheckoutClient.client.tsx` (lines 36–145). `useState`, `fetch`, `role="alert"` error display are all proven. The only variable is the exact UI copy.
  - Approach: 85% — email capture + consent checkbox is the correct v1 approach per fact-find. Held-back test: the `fetch` to `/api/notify-me` could fail if the route has a different shape than expected — but since TASK-02 defines the route, the risk is sequencing, not approach.
  - Impact: 80% — form exists and is submittable; impact depends on traffic volume and whether Gmail credentials are provisioned. Held-back test: if `GMAIL_USER`/`GMAIL_PASS` are not set, the form submits successfully but no email is delivered. This degrades impact but the form still captures the intent event.

- **Acceptance:**
  - Email input renders with `type="email"` and `required`.
  - Consent checkbox renders unchecked by default with visible label.
  - Submit button is disabled during loading.
  - On success response from `/api/notify-me`, form shows a "Thank you" confirmation, hides the form inputs, and calls `logAnalyticsEvent({ type: "notify_me_submit", productSlug })`.
  - On error response, form shows the error message with `role="alert"`.
  - Client-side: prevents submission if email is empty or consent checkbox is unchecked (double-layered with server-side enforcement).

- **Validation contract (TC-XX):**
  - TC-01: Render with `productSlug="test-slug"` → email input present, checkbox unchecked, submit button visible.
  - TC-02: User types email and checks consent, submits → fetch called with `{ email, productSlug, consent: true }`.
  - TC-03: API returns `{ success: true }` → success message shown, form inputs hidden, `logAnalyticsEvent` called with `{ type: "notify_me_submit", productSlug }`.
  - TC-04: API returns `{ error: "..." }` → error message shown with `role="alert"`.
  - TC-05: Consent checkbox unchecked → submit blocked client-side.
  - TC-06: Loading state → submit button disabled during fetch.

- **Execution plan:**
  - Red: no `NotifyMeForm.client.tsx` exists.
  - Green: create component with `"use client"`, `useState` for `{ email, consent, loading, done, error }`, `fetch("POST /api/notify-me")`, conditional renders for success/error/form states. On successful API response (`{ success: true }`), call `logAnalyticsEvent({ type: "notify_me_submit", productSlug })` from `@acme/platform-core/analytics/client` (same import used in `ProductAnalytics.client.tsx` line 6) to emit the measurable analytics event. Analytics call is fire-and-forget (wrapped in `.catch()`).
  - Refactor: extract label string as a constant (ready for i18n annotation).

- **Planning validation (required for M/L):** None: S effort.

- **Scouts:**
  - Confirm `CheckoutClient.client.tsx` fetch pattern uses `Content-Type: application/json` and `await res.json()` — confirmed at lines 190–203.
  - Confirm `"use client"` directive and `.client.tsx` suffix convention — confirmed across `StickyCheckoutBar.client.tsx`, `CheckoutClient.client.tsx`.
  - Confirm `logAnalyticsEvent` import path: `@acme/platform-core/analytics/client` — confirmed in `ProductAnalytics.client.tsx` line 6.

- **Edge Cases & Hardening:**
  - Network error during fetch → catch block sets error state with generic message.
  - Non-JSON response from server → catch JSON parse error, show generic error.
  - Double-submit: disable submit button on loading state to prevent concurrent requests.
  - Email validation: rely on `type="email"` for client-side; server validates properly.

- **What would make this >=90%:**
  - Confirm the exact route shape for `/api/notify-me` response (TASK-02 defines this — once TASK-02 is done, the contract is locked).

- **Rollout / rollback:**
  - Rollout: component is created but not rendered anywhere until TASK-03 wires it in.
  - Rollback: delete `NotifyMeForm.client.tsx`.

- **Documentation impact:**
  - None beyond standard code: the component is self-documenting via TypeScript props.

- **Notes / references:**
  - Props: `{ productSlug: string }` — passed from PDP server component.
  - Consent label copy: `"I agree to receive a one-time reminder email about this product"` — i18n-exempt for v1.
  - `// i18n-exempt -- CARYINA-2xx [ttl=2026-12-31]` annotation pattern used in other i18n-exempt copy.

- **Build evidence (2026-02-28):** `apps/caryina/src/components/catalog/NotifyMeForm.client.tsx` created. Named export `NotifyMeForm`, `"use client"` directive, RFC email validation client-side, consent checkbox, success/error state handling, `logAnalyticsEvent({ type: "notify_me_submit", productSlug })` called on success. All 6 TCs addressed by implementation. Codex offload exit 0.

---

### TASK-02: Create `/api/notify-me/route.ts` and extend analytics allowlist

- **Type:** IMPLEMENT
- **Deliverable:**
  - New file `apps/caryina/src/app/api/notify-me/route.ts`
  - Modified file `apps/caryina/src/app/api/analytics/event/route.ts` (add `notify_me_submit` to `ALLOWED_EVENT_TYPES`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `apps/caryina/src/app/api/notify-me/route.ts` (new)
  - `apps/caryina/src/app/api/analytics/event/route.ts` (modify — add one entry to `ALLOWED_EVENT_TYPES`)
  - `[readonly] packages/platform-core/src/services/emailService.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05

- **Confidence:** 85%
  - Implementation: 90% — route shape directly mirrors `checkout-session/route.ts`. `sendSystemEmail` import pattern, `export const runtime = "nodejs"`, `NextRequest`/`NextResponse` — all established. The analytics allowlist extension is a single-line Set addition.
  - Approach: 85% — server-side consent enforcement + fire-and-forget email is the right approach. Held-back test: if `sendSystemEmail` throws (not caught), the 200 response would never be sent. Risk: the fire-and-forget pattern must use `.catch()` like the checkout route does.
  - Impact: 80% — route enables the full flow. Impact is bounded by Gmail credentials being provisioned (same as Implementation score reasoning).

- **Acceptance:**
  - `POST /api/notify-me` with `{ email, productSlug, consent: true }` returns `{ success: true }` and HTTP 200.
  - Missing `consent` or `consent: false` → 400 `{ error: "Consent required" }`.
  - Missing or invalid `email` → 400 `{ error: "Invalid email" }`.
  - Missing `productSlug` → 400 `{ error: "Product slug required" }`.
  - `sendSystemEmail` called with subscriber confirmation email and merchant notification email (fire-and-forget with `.catch()`).
  - Console.info logs submission with redacted email (domain-part only, e.g., `"***@example.com"` — no full address).
  - `ALLOWED_EVENT_TYPES` in analytics route includes `"notify_me_submit"`.

- **Validation contract (TC-XX):**
  - TC-01: Valid body → 200 `{ success: true }`, `sendSystemEmail` called twice (subscriber + merchant).
  - TC-02: `consent: false` → 400 `{ error: "Consent required" }`.
  - TC-03: `consent` absent → 400.
  - TC-04: Email absent or malformed → 400 `{ error: "Invalid email" }`.
  - TC-05: `productSlug` absent → 400 `{ error: "Product slug required" }`.
  - TC-06: `sendSystemEmail` throws → error caught, 200 still returned (fire-and-forget; submission is not retried, but caller is not affected).
  - TC-07: Analytics route accepts `{ type: "notify_me_submit" }` → does not return 400.

- **Execution plan:**
  - Red: no `notify-me/route.ts` exists; `ALLOWED_EVENT_TYPES` lacks `notify_me_submit`.
  - Green:
    1. Create `route.ts` with `export const runtime = "nodejs"`. Parse body. Validate `consent`, `email` (regex or `.includes("@")`), `productSlug`. Return 400 for any invalid. Call `sendSystemEmail` (subscriber + merchant) fire-and-forget with `.catch((err) => console.error(...))`. Log `console.info("notify-me: submission", { email: redact(email) })`. Return `{ success: true }`.
    2. Add `"notify_me_submit"` to `ALLOWED_EVENT_TYPES` Set in `analytics/event/route.ts`.
  - Refactor: extract `redactEmail(email: string): string` helper (returns `***@domain` form) to keep route body clean.

- **Planning validation (required for M/L):** None: S effort.

- **Scouts:**
  - `sendSystemEmail` import path confirmed: `@acme/platform-core/email` — same as checkout route line 7.
  - Analytics `ALLOWED_EVENT_TYPES` is a `Set<string>` defined at module scope in `apps/caryina/src/app/api/analytics/event/route.ts` lines 11–17.
  - `MERCHANT_NOTIFY_EMAIL` fallback in checkout route line 97: `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"` — same pattern in notify-me route.

- **Edge Cases & Hardening:**
  - Email validation: use a minimal RFC-compliant regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) rather than a simple `includes` check. The `includes("@") && includes(".")` guard allows clearly malformed addresses (e.g., `@`, `a.b`) that would pass but fail async in the fire-and-forget send. A basic regex blocks these without requiring a new dependency. `@acme/zod-utils` exists in the monorepo but is not a direct dependency of `apps/caryina` — using zod for this single field is unnecessary overhead.
  - PII in logs: `redactEmail` must never log the full address.
  - GDPR: consent timestamp logged to console as `consentAt: new Date().toISOString()` — no DB write.
  - Body parse failure: `req.json().catch(() => ({}))` pattern from checkout route.
  - Abuse controls (v1): the route is unauthenticated and public. V1 does not implement rate limiting (no rate-limit middleware is installed in the codebase). Mitigations: (a) GDPR consent required — reduces casual spam, (b) email validation blocks obviously malformed inputs, (c) merchant notification acts as passive abuse signal. If abuse is detected post-launch, Cloudflare WAF rate-limiting rules can be added at the edge without code changes. Rate-limiting middleware is a v2 consideration.

- **What would make this >=90%:**
  - Gmail credentials confirmed present in deployment env — turns the email path from "silently simulated" to "live".

- **Rollout / rollback:**
  - Rollout: new route is additive. No existing routes affected except analytics allowlist (single-line addition).
  - Rollback: delete `notify-me/route.ts`. Remove `"notify_me_submit"` from analytics allowlist.

- **Documentation impact:**
  - Env var requirements documented in TASK-04 (`.env.example`).

- **Notes / references:**
  - Subscriber confirmation email subject: `"Your interest in [product name] has been noted"` — product name will not be available in the route without a catalog lookup. For v1, use `productSlug` in the subject: `"You asked to be notified about ${productSlug}"`. Acceptable for v1; upgrade to product name lookup in v2.
  - Merchant notification subject: `"New notify-me capture — ${productSlug}"` with email domain (redacted) in body.

- **Build evidence (2026-02-28):** `apps/caryina/src/app/api/notify-me/route.ts` created. `export const runtime = "nodejs"`, RFC regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, fire-and-forget `sendSystemEmail` with `.catch()`, `redactEmail()` helper, `MERCHANT_NOTIFY_EMAIL` env var with fallback. `"notify_me_submit"` added to `ALLOWED_EVENT_TYPES` in analytics route. Typecheck passed; pre-existing lint failures in `Header.tsx`/`HeaderThemeToggle.client.tsx` noted as unrelated. Codex offload exit 0.

---

### TASK-03: Wire `NotifyMeForm` into PDP `page.tsx`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` (modify — import + render `NotifyMeForm`)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05

- **Confidence:** 85%
  - Implementation: 90% — PDP is a server component that already imports multiple client components (`ProductGallery`, `StickyCheckoutBar`, `ProductAnalytics`). Adding one more import is trivial. The insertion point is below the `AddToCartButton` section, within the sticky `div` (line 92).
  - Approach: 85% — placing the form below the primary CTA is the right UX pattern. The form is always visible (not gated behind a toggle) to maximise capture opportunity.
  - Impact: 80% — the form is now visible and submittable. Impact realisation depends on TASK-02 (route) and email credentials.

- **Acceptance:**
  - `NotifyMeForm` renders on the PDP below the `AddToCartButton`.
  - `productSlug` is passed correctly from page params to the form.
  - No TypeScript errors from the addition.
  - The `StickyCheckoutBar` and existing PDP sections are unchanged.

- **Validation contract (TC-XX):**
  - TC-01: Page renders with `NotifyMeForm` in the DOM below `AddToCartButton` — confirmed by inspecting rendered HTML.
  - TC-02: `productSlug` prop matches the route param `slug` — confirmed by prop inspection.
  - TC-03: Existing PDP sections (gallery, price, StockBadge, proof points, related products) unchanged — regression check.

- **Execution plan:**
  - Red: `NotifyMeForm` not imported or rendered in `page.tsx`.
  - Green: Add `import NotifyMeForm from "@/components/catalog/NotifyMeForm.client"`. Insert `<NotifyMeForm productSlug={product.slug} />` after the `<div data-cy="pdp-checkout">` block and before the proof-points `<section>`.
  - Refactor: None required.

- **Planning validation (required for M/L):** None: S effort.

- **Scouts:**
  - Insertion point confirmed: `page.tsx` lines 104–111 contain the checkout div, StockBadge, and StickyCheckoutBar (`data-cy="pdp-checkout"` at line 104, `<StickyCheckoutBar` at lines 107–110, closing `</div>` at line 111). `NotifyMeForm` goes after line 110 (after `</StickyCheckoutBar>`), within the `space-y-4` div and before the proof-points `<section>` at line 113.
  - Consumer tracing: `product.slug` is of type `string` (from `SKU`). `NotifyMeForm` props: `{ productSlug: string }` — no type gap.

- **Edge Cases & Hardening:**
  - If `product.slug` is somehow undefined (impossible given `notFound()` guard above), TypeScript will catch it.

- **What would make this >=90%:**
  - Confirmed the form renders correctly in a browser preview — requires runtime, not planning.

- **Rollout / rollback:**
  - Rollout: single import + JSX line addition in a server component.
  - Rollback: remove import and JSX element.

- **Documentation impact:** None.

- **Notes / references:**
  - The form appears on desktop (within the sticky `md:sticky md:top-6` column) and on mobile. `StickyCheckoutBar` remains unchanged — it only shows on mobile scroll-past.

---

### TASK-04: Update privacy policy content and env var documentation

- **Type:** IMPLEMENT
- **Deliverable:**
  - Modified `data/shops/caryina/site-content.generated.json` (privacy policy `bullets` array)
  - New file `apps/caryina/.env.example` (tracked env var documentation — follows repo convention; gitignored `.env.local` is not reviewable)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Affects:**
  - `data/shops/caryina/site-content.generated.json` (modify — add bullet to `policies.privacy.bullets`)
  - `apps/caryina/.env.example` (new — document `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS`, and Option B Resend vars for future reference; `.env.local` is gitignored and not reviewable)
- **Depends on:** -
- **Blocks:** -

- **Confidence:** 85%
  - Implementation: 90% — editing a JSON file and creating a tracked `.example` file. Zero code risk.
  - Approach: 85% — GDPR requires the privacy policy to document email marketing collection. Simple bullet addition is sufficient for v1.
  - Impact: 85% — GDPR documentation compliance is a binary gate; either it's there or it isn't. Adding the bullet satisfies the requirement.

- **Acceptance:**
  - `policies.privacy.bullets` in `site-content.generated.json` includes at least one bullet about email marketing and the right to withdraw.
  - The privacy policy page (`/en/privacy`) renders the new bullet (confirmed by `getPolicyContent()` returning the updated bullets array).
  - `apps/caryina/.env.example` exists and documents `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS`, and Option B Resend vars with explanatory comments.

- **Validation contract (TC-XX):**
  - TC-01: `site-content.generated.json` is valid JSON after edit — `python3 -m json.tool file.json` passes.
  - TC-02: Privacy policy bullets array has at least 3 items (2 existing + 1 new email marketing bullet).
  - TC-03: New bullet mentions email marketing and right to withdraw/unsubscribe.

- **Execution plan:**
  - Red: privacy policy has 2 bullets; no email marketing mention; no `.env.example` exists.
  - Green: Add `{ "en": "Your email address may be used to send a one-time notification about products you expressed interest in. You can withdraw consent at any time by contacting us." }` to `policies.privacy.bullets` array. Create `apps/caryina/.env.example` documenting all required notify-me env vars.
  - Refactor: None.

- **Planning validation (required for M/L):** None: S effort.

- **Scouts:**
  - `getPolicyContent()` reads `policies.privacy.bullets` as `LocalizedText[]` and returns `localizedList(policy.bullets, locale)` → `string[]`. Adding a new entry with `{ "en": "..." }` is safe — `localizedText` falls back to `.en` for locales without a translation.
  - `site-content.generated.json` is a build-time file, not generated at runtime. Edits are persistent and will not be overwritten by a materializer unless the materializer is re-run with the privacy policy as input. The email marketing bullet should also be added to whatever template source the materializer reads (tracked in this plan as a known risk).
  - JSON does not support comments — do not add comment text to `site-content.generated.json`. All human-readable notes about the materializer risk belong in the plan or a separate markdown doc.

- **Edge Cases & Hardening:**
  - If the materializer is re-run, the new bullet will be overwritten. Mitigation: the materializer source template (once identified) must include the email marketing bullet. Track this in the plan; the JSON file itself cannot hold a note.

- **What would make this >=90%:**
  - Knowing whether a materializer script regenerates this file (and if so, updating the source template). This is a documentation-only risk, not a build blocker.

- **Rollout / rollback:**
  - Rollout: JSON edit + new `.env.example` file (tracked, reviewed in PR).
  - Rollback: remove the new bullet from the JSON array; delete `.env.example`.

- **Documentation impact:**
  - `apps/caryina/.env.example` is a new tracked file documenting required env vars for the notify-me flow.

- **Notes / references:**
  - Do not edit `.env.local` directly — it is gitignored and changes are not reviewable. Use `.env.example` as the canonical documented reference for required env vars.

- **Build evidence (2026-02-28):** `data/shops/caryina/site-content.generated.json` updated — email marketing bullet added to `policies.privacy.bullets`; JSON validated via `python3 -m json.tool`. `apps/caryina/.env.example` created documenting `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS`, `MERCHANT_NOTIFY_EMAIL`, and Option B Resend vars. Codex offload exit 0.

---

### TASK-05: Unit tests for `NotifyMeForm` and `notify-me` route

- **Type:** IMPLEMENT
- **Deliverable:**
  - New file `apps/caryina/src/components/catalog/NotifyMeForm.client.test.tsx`
  - New file `apps/caryina/src/app/api/notify-me/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/caryina/src/components/catalog/NotifyMeForm.client.test.tsx` (new)
  - `apps/caryina/src/app/api/notify-me/route.test.ts` (new)
  - `[readonly] apps/caryina/src/components/catalog/NotifyMeForm.client.tsx`
  - `[readonly] apps/caryina/src/app/api/notify-me/route.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -

- **Confidence:** 80%
  - Implementation: 85% — both test patterns are established. Route test mirrors `checkout-session/route.test.ts` (jest.mock for `@acme/platform-core/email`). Component test mirrors `StockBadge.test.tsx` (render + assertions). No new test infrastructure needed.
  - Approach: 80% — unit tests are the right scope for v1. E2E is out of scope. Integration tests (real email delivery) are out of scope. Held-back test: if the jest configuration does not properly resolve `@/components/catalog/NotifyMeForm.client` in test context, tests will fail. Evidence: `StockBadge.test.tsx` uses `@/` alias successfully, confirming the alias works.
  - Impact: 80% — tests validate the consent enforcement and email-fire contracts. These are the two highest-risk behaviors (GDPR compliance and email delivery). Held-back test: no evidence that mocking `sendSystemEmail` in a new route test works differently from the checkout route — the import path and mock pattern are identical.

- **Acceptance:**
  - `NotifyMeForm.client.test.tsx` covers: render (TC-01), submit with valid data (TC-02), success state (TC-03), error state (TC-04), consent checkbox unchecked (TC-05), loading state (TC-06).
  - `route.test.ts` covers: valid body (TC-01), consent false (TC-02), consent absent (TC-03), invalid email (TC-04), productSlug absent (TC-05), sendSystemEmail throws (TC-06).
  - All tests pass in CI (push and monitor via `gh run watch`).
  - No local test execution (per `docs/testing-policy.md` CI-only policy).

- **Validation contract (TC-XX):** (mirrors task Acceptance above)
  - TC-01 through TC-06 for component as listed in TASK-01.
  - TC-01 through TC-06 for route as listed in TASK-02.

- **Execution plan:**
  - Red: no test files exist.
  - Green:
    - Route test: `jest.mock("@acme/platform-core/email", () => ({ sendSystemEmail: jest.fn() }))`. Test each validation branch by constructing `NextRequest` objects and asserting response status and body. Assert `sendSystemEmail` is called (or not called) as appropriate.
    - Component test: `render(<NotifyMeForm productSlug="test-slug" />)`. Use `@testing-library/user-event` or `fireEvent` to fill email, toggle checkbox, click submit. Mock `global.fetch`. Assert DOM state transitions.
  - Refactor: None.

- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed `jest.mock("@acme/platform-core/email", ...)` pattern works in `checkout-session/route.test.ts` (file read and confirmed at lines 30–32).
    - Confirmed `@/` alias resolves in component tests via `StockBadge.test.tsx` (`import { StockBadge } from "@/components/catalog/StockBadge"`).
  - Validation artifacts: `apps/caryina/src/app/api/checkout-session/route.test.ts` (route mock pattern), `apps/caryina/src/components/catalog/StockBadge.test.tsx` (component render pattern).
  - Unexpected findings: None.

- **Consumer tracing (M effort check):**
  - New outputs: `NotifyMeForm.client.test.tsx` produces no new outputs consumed by other modules. `route.test.ts` produces no outputs consumed by other modules. Both are terminal.
  - Modified behavior: None — tests do not modify production behavior.

- **Scouts:**
  - `testing-library/react` and `@testing-library/user-event` available — confirmed by existing test imports.
  - `NextRequest` available for route testing — confirmed in `checkout-session/route.test.ts` line 3.

- **Edge Cases & Hardening:**
  - `sendSystemEmail` mock must be reset between tests (`beforeEach(() => jest.clearAllMocks())`).
  - `global.fetch` mock for component test must be reset between tests.

- **What would make this >=90%:**
  - CI run confirming all tests pass (not available at plan time).

- **Rollout / rollback:**
  - Rollout: test files are additive.
  - Rollback: delete test files.

- **Documentation impact:** None.

- **Notes / references:**
  - CI-only test policy: do not run `pnpm --filter caryina test` locally. Push and monitor: `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `NotifyMeForm.client.tsx` | Yes | None | No |
| TASK-02: Create `/api/notify-me/route.ts` + extend analytics allowlist | Yes | [Integration boundary not handled, Minor]: `sendSystemEmail` silently simulates if `GMAIL_USER`/`GMAIL_PASS` absent. Route still returns 200, so caller cannot detect no-delivery. Mitigated: documented in constraints; env setup is operator action. | No |
| TASK-03: Wire `NotifyMeForm` into PDP | Yes — TASK-01 and TASK-02 precede | None | No |
| TASK-04: Update privacy policy + env docs | Yes | [Missing data dependency, Minor]: If materializer is re-run, the new bullet in `site-content.generated.json` would be overwritten. Mitigated: noted in TASK-04 edge cases; needs a permanent fix in the materializer source. Not a build blocker. | No |
| TASK-05: Unit tests | Yes — TASK-01, TASK-02, TASK-03 precede | None | No |

No Critical simulation findings. Proceeding to plan persistence.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `EMAIL_PROVIDER` not set at launch | Medium | High — `sendSystemEmail` throws; throw is caught by fire-and-forget `.catch()`, so route still returns 200, but email is silently dropped and submission is not retried | Operator must set `EMAIL_PROVIDER`, `GMAIL_USER`, and `GMAIL_PASS` in Cloudflare Workers env before launch. Verify with a test submission before go-live. Canonical behavior: route always returns 200 for valid inputs; email delivery is best-effort (fire-and-forget). |
| `GMAIL_USER`/`GMAIL_PASS` set but delivery fails (wrong credentials) | Low | High — silent failure; emails never arrive | No runtime guard possible for credential validity. Operator must verify end-to-end before launch (send a test submission and confirm receipt). |
| GDPR violation if consent not server-enforced | Low | High | API route enforces `consent === true` before processing. Returns 400 otherwise. Client checkbox is redundant (defense-in-depth). |
| `site-content.generated.json` overwritten by materializer | Low | Medium | JSON does not support comments — do not add inline notes to the file. Track in this plan only. If materializer is re-run, manually re-add the email marketing bullet or add it to the materializer source template. |
| `notify_me_submit` analytics event rejected (400) before TASK-02 ships | N/A | None | TASK-02 extends the allowlist atomically with the route creation. |
| PII in server logs | Low | Medium | `redactEmail()` helper in route logs domain-part only. Never logs full email. |

## Observability

- Logging: `console.info("notify-me: submission", { emailDomain, productSlug, consentAt })` — no full email.
- Metrics: `notify_me_submit` analytics event (client-side, via `logAnalyticsEvent` after successful API response). Visible in `/api/analytics/event` route handler and downstream analytics store.
- Alerts/Dashboards: None required for v1. Merchant email inbox is the primary signal.

## Acceptance Criteria (overall)

- [ ] `NotifyMeForm.client.tsx` renders on the PDP below the checkout CTA, with email input and unchecked consent checkbox.
- [ ] `POST /api/notify-me` returns 200 for valid requests and 400 for missing consent, invalid email, or missing productSlug.
- [ ] `sendSystemEmail` called for both subscriber confirmation and merchant notification on valid submission.
- [ ] `notify_me_submit` emitted client-side from `NotifyMeForm` on successful submission, and accepted by analytics route (not rejected with 400).
- [ ] Privacy policy bullets include email marketing mention.
- [ ] Unit tests for component and route pass in CI.
- [ ] No full email addresses appear in server logs.

## Decision Log

- 2026-02-28: Email path — Option A (Gmail SMTP via `sendSystemEmail`) chosen. Mirrors checkout notification pattern, zero new external accounts. Option B (Resend) documented as upgrade path.
- 2026-02-28: Persistence — fire-and-forget to merchant email chosen. No DB migration for v1. Prisma table deferred to v2 if capture volume justifies it.
- 2026-02-28: Analytics allowlist — extended in TASK-02 atomically with route creation. Console-only fallback not taken.

## Overall-confidence Calculation

| Task | Confidence | Effort weight | Weighted |
|---|---:|---:|---:|
| TASK-01 | 85% | 1 (S) | 85 |
| TASK-02 | 85% | 1 (S) | 85 |
| TASK-03 | 85% | 1 (S) | 85 |
| TASK-04 | 85% | 1 (S) | 85 |
| TASK-05 | 80% | 2 (M) | 160 |

Sum weighted: 500. Sum weights: 6. Overall-confidence = 500/6 = **83%** (rounded to 80% per multiples-of-5 rule; downward bias applied per scoring rules).
