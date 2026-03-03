---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-pdp-return-visit-capture
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-pdp-return-visit-capture/plan.md
Trigger-Source: direct-operator-decision: IDEA-DISPATCH-20260228-0006 — P2 conversion gap identified; no return-visit mechanism on PDP for a 3–7 day consideration window audience
Trigger-Why: The primary acquisition source (TikTok/Instagram) produces visitors with a 3–7 day consideration window before purchasing at €80–€150. Without any way to save interest or re-engage, a visitor who is not ready to buy immediately has no path back to the product. This is a direct conversion gap on the highest-intent page in the funnel.
Trigger-Intended-Outcome: measurable | statement: At least one return-visit mechanism live on the PDP within one build cycle, confirmed by a visible UI element and a functional email submission or save action. Baseline: zero such mechanisms currently exist. | source: operator
---

# HBAG PDP Return-Visit Capture — Fact-Find Brief

## Scope

### Summary

The Caryina PDP (`/[lang]/product/[slug]`) has a cart-to-checkout flow but no mechanism for a visitor who is not ready to buy immediately to save their interest or receive a reminder. The primary acquisition audience (TikTok/Instagram) has a 3–7 day decision window for €80–€150 bag charm purchases. This fact-find assesses which return-visit mechanism is most feasible for v1, what infrastructure already exists to support it, and what GDPR considerations apply.

### Goals

- Determine whether email capture (notify me / waitlist), localStorage-based wishlist, or a persistent email CTA is the right v1 mechanism.
- Confirm what email sending infrastructure is already available or easily activatable.
- Confirm whether GDPR consent is handled or needs to be added alongside the feature.
- Identify the exact files and extension points needed for a clean implementation.
- Size the effort to validate it fits P2 scope.

### Non-goals

- Full marketing automation / abandoned-cart flow (out of scope for v1).
- Back-in-stock alerts requiring server-side stock monitoring polling (assessed but de-prioritised below).
- Wishlist synced to user accounts (no user accounts exist in Caryina).
- Cookie consent banner implementation (tracked separately; see GDPR section).

### Constraints & Assumptions

- Constraints:
  - No user account system exists — any persistence must use localStorage or email-only (no database user records).
  - The active payment provider is Axerve (S2S card form via `@acme/axerve`), as implemented in `apps/caryina/src/app/api/checkout-session/route.ts`. Note: `data/shops/caryina/shop.json` declares `billingProvider: "stripe"` — this is a stale/incorrect config field; the actual runtime uses Axerve. Checkout already collects `buyerEmail` but only for the payment session; it is not persisted for marketing.
  - GDPR requires explicit opt-in consent before storing an email for marketing purposes. The measurement plan (`docs/business-os/strategy/HBAG/2026-02-21-measurement-profile.user.md`) flags this as an action item: "Website needs cookie consent and privacy policy before launch."
  - Caryina is deployed as an OpenNext Cloudflare Worker, not a static export. `apps/caryina/wrangler.toml` sets `main = ".open-next/worker.js"` and uses `nodejs_compat` compatibility flags. API routes using `export const runtime = "nodejs"` are supported. Cloudflare Worker environments do not support persistent filesystem writes at request time — `data/shops/caryina/` files are read-only build-time assets once deployed.
  - Email provider: `@acme/email` package exists with two distinct sending paths. (A) `sendEmail()` (nodemailer/Gmail SMTP) — the path used by `sendSystemEmail`, requires `GMAIL_USER` + `GMAIL_PASS`; silently simulates if credentials absent. (B) `sendCampaignEmail()` (Resend/SendGrid) — requires `EMAIL_PROVIDER`, `EMAIL_FROM`, and a provider API key. Neither path is configured for caryina currently.
  - Inventory: 3 SKUs, all in stock (5, 7, 4 units). Back-in-stock is low relevance now but will become relevant as stock depletes.

- Assumptions:
  - The operator must choose between Option A (Gmail SMTP — mirrors the existing checkout route; requires `GMAIL_USER`/`GMAIL_PASS`) and Option B (Resend cloud provider — better for deliverability at scale; free tier allows 3,000 emails/month; requires `RESEND_API_KEY` + `EMAIL_FROM`). Either is viable for v1.
  - GDPR consent for email capture requires an explicit checkbox on the capture form (not the existing analytics consent cookie). This is a separate, simpler consent mechanism than a full cookie banner.
  - The simplest viable v1 is a "Notify me / Save for later" email-capture form on the PDP, with a fire-and-forget email send (merchant notification + subscriber confirmation via `sendSystemEmail`). Optionally, a Prisma DB table can be added for durable persistence. Flat-file writes are not viable on the Cloudflare Worker runtime.
  - For an even simpler v1 that avoids email infrastructure: a localStorage-based wishlist (save the product slug) with a visible "Saved" indicator. This requires zero email config. Storing only a product slug in localStorage does not directly constitute personal data in isolation (it does not identify a person), so explicit GDPR consent for the save action itself is not required. However, if this data is later combined with email capture or linked to an identifiable person, GDPR consent applies at that point. Limitation: provides no re-engagement path by email.

## Outcome Contract

- **Why:** The primary acquisition source (TikTok/Instagram) produces visitors with a 3–7 day consideration window before purchasing at €80–€150. Without any way to save interest or re-engage, a visitor who is not ready to buy immediately is permanently lost. This is a direct conversion gap.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** At least one functional return-visit mechanism live on the PDP within one build cycle, with a measurable submission or save event logged. Secondary metric: first email follow-up sent to at least one captured address within 7 days of launch.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP server component. Renders product data, gallery, price, StockBadge, AddToCartButton, and StickyCheckoutBar. No save/wishlist/capture element present.
- `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — Mobile sticky bar. Appears when the main CTA scrolls out of view. Contains AddToCartButton only. Extension point for a secondary CTA (e.g., "Save for later").
- `apps/caryina/src/app/api/checkout-session/route.ts` — Existing API route (Node.js runtime). Uses `sendSystemEmail` from `@acme/platform-core/email` for merchant notifications. Confirms email sending is used in the app; same pattern can be reused for subscriber confirmation emails.

### Key Modules / Files

- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — Primary insertion point for any new PDP UI element (save button, capture form, or CTA block).
- `apps/caryina/src/app/[lang]/product/[slug]/StickyCheckoutBar.client.tsx` — Secondary insertion point for mobile context.
- `packages/platform-core/src/services/emailService.ts` — `sendSystemEmail()` abstraction. Dynamically requires `@acme/email` and calls `@acme/email.sendEmail()`. **Critical implementation detail:** `@acme/email.sendEmail()` (in `packages/email/src/sendEmail.ts`) routes via nodemailer/Gmail SMTP — it uses `GMAIL_USER` + `GMAIL_PASS` env vars, not Resend or SendGrid. If those Gmail credentials are not set, the send is silently simulated (no error, no real email). This means `sendSystemEmail` will NOT use Resend/SendGrid — those providers are only used via `sendCampaignEmail`.
- `packages/email/src/sendEmail.ts` — The concrete `sendEmail()` function called by `sendSystemEmail`. Uses nodemailer with Gmail SMTP (`GMAIL_USER`, `GMAIL_PASS`). Falls back to simulated send (logs only, no delivery) if credentials are absent.
- `packages/email/src/send.ts` — `sendCampaignEmail()`. Routes via Resend or SendGrid based on `EMAIL_PROVIDER` env var. This is the path that would use a Resend/SendGrid API key. For v1 notify-me, using `sendCampaignEmail` is also viable — it is not exclusively for bulk; it is the path that activates Resend/SendGrid.
- **Email delivery decision for v1:** Two options: (A) Configure Gmail SMTP (`GMAIL_USER`, `GMAIL_PASS`) and use `sendSystemEmail` — same as checkout route, no new dependencies. (B) Configure Resend (`RESEND_API_KEY`, `EMAIL_PROVIDER=resend`, `EMAIL_FROM`) and call `sendCampaignEmail` directly from the new API route. Option A is lower setup cost (mirrors existing checkout pattern). Option B uses the cloud provider email and avoids Gmail rate limits.
- `packages/config/src/env/email.ts` — `emailEnvSchema`. Applies to the `sendCampaignEmail` path. Not a gate for `sendSystemEmail`. Env vars required differ by chosen option: (A) `GMAIL_USER` + `GMAIL_PASS`; (B) `EMAIL_PROVIDER=resend`, `EMAIL_FROM`, `RESEND_API_KEY`.
- `packages/platform-core/src/analytics/client.ts` — Analytics consent gate: `hasConsent()` reads `consent.analytics=true` cookie. Email consent is separate — does not need analytics consent, but needs its own explicit consent checkbox per GDPR.
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — Reference for `useState`-based form pattern with fetch to an API route. Exact same pattern should be used for an email capture form.
- `apps/caryina/src/app/[lang]/layout.tsx` — `CartProvider` wraps all locale pages. No other context providers; no existing state management beyond CartContext.
- `apps/caryina/src/components/SiteFooter.tsx` — Footer has no email capture section. Candidate for a persistent "Join the waitlist" CTA if desired.
- `data/shops/caryina/inventory.json` — 3 SKUs, quantities: silver=5, rose-splash=7, peach=4. All in stock. Back-in-stock trigger is low priority now; wishlist or notify-me serves both in-stock interest capture and future back-in-stock use.

### Patterns & Conventions Observed

- Client components are suffixed `.client.tsx` and use `"use client"` directive — evidence: `StickyCheckoutBar.client.tsx`, `CheckoutClient.client.tsx`, `ProductGallery.client.tsx`.
- API routes use `export const runtime = "nodejs"` — evidence: `apps/caryina/src/app/api/checkout-session/route.ts:9`.
- Form pattern: `useState` for field state, `fetch` to API route, error display with `role="alert"` — evidence: `CheckoutClient.client.tsx` lines 152–213.
- Email sending: `sendSystemEmail({ to, subject, html })` imported from `@acme/platform-core/email`, called fire-and-forget with `.catch()` — evidence: `checkout-session/route.ts` lines 114–119.
- No cookie consent banner or GDPR opt-in UI exists anywhere in the app currently.
- No localStorage usage on PDP or in any product-related component (only `analytics.clientId` in `analytics/client.ts`).

### Data & Contracts

- Types/schemas/events:
  - `SKU` from `@acme/types` — used throughout. No `wishlistable` field or metadata.
  - `EmailService.sendEmail(to, subject, body)` — base interface from `packages/platform-core/src/services/emailService.ts`.
  - `sendSystemEmail({ to, subject, html })` — convenience wrapper that calls `@acme/email.sendEmail()` (Gmail/SMTP path). Requires `EMAIL_PROVIDER` env var to be set (any value), plus `GMAIL_USER` + `GMAIL_PASS` for real delivery; without Gmail credentials, send is silently simulated.
  - `sendCampaignEmail(options: CampaignOptions)` from `@acme/email` — activates Resend/SendGrid. Requires `EMAIL_PROVIDER` (resend|sendgrid), `EMAIL_FROM`, and provider API key. Not currently configured for caryina.
  - `emailEnvSchema` — validation schema for the `sendCampaignEmail` path only. Not a gate for `sendSystemEmail`.

- Persistence:
  - No database table for email subscriptions/wishlist exists in the Prisma schema (not investigated in full, but no evidence of one in the app — the admin API only manages products and inventory).
  - For v1 email capture: options are (a) persist to a new DB table via Prisma, or (b) fire-and-forget: send a notification to the merchant email and a confirmation to the subscriber, with no additional persistence layer. A flat-file approach (`data/shops/caryina/`) is not viable — Cloudflare Worker runtime does not support persistent filesystem writes; `data/` files are read-only build-time assets.
  - For v1 localStorage wishlist: no persistence layer needed — browser-side only.

- API/contracts:
  - New API route needed for email capture: `POST /api/notify-me` or `POST /api/wishlist-email`. Receives `{ email, productSlug, consent: true }`. Validates, stores/forwards, sends confirmation email.
  - Existing route pattern (`checkout-session/route.ts`) is the direct model.

### Dependency & Impact Map

- Upstream dependencies:
  - **Option A (Gmail/SMTP via `sendSystemEmail`):** `GMAIL_USER` + `GMAIL_PASS` env vars + `EMAIL_PROVIDER` set to any non-empty value. `EMAIL_FROM` is NOT required by the `sendSystemEmail` path (it is a campaign-path schema requirement). This path mirrors the existing checkout route pattern exactly.
  - **Option B (Resend/SendGrid via `sendCampaignEmail`):** `EMAIL_PROVIDER=resend`, `EMAIL_FROM` (validated email), `RESEND_API_KEY`. These are required by `emailEnvSchema` which gates the `sendCampaignEmail` path.
  - None of these env vars are set in caryina `.env.local`. The choice between Option A and B is an operator decision (see Open Questions).

- Downstream dependents:
  - PDP page (`page.tsx`) — will gain a new client component (capture form or save button).
  - StickyCheckoutBar — may gain a secondary CTA.
  - SiteFooter — optional; could host a persistent signup strip.

- Likely blast radius:
  - Small. The PDP server component only gains a new child client component import. No existing components are modified beyond adding a sibling element in the JSX tree. The new API route is additive. No changes to CartContext, checkout, or payment flow.

### GDPR Assessment

**localStorage wishlist (no email):**
- localStorage stores only a product slug (non-personal data). No GDPR consent required for the save action itself. However, if the save is used to later send an email, consent is needed at that point.
- Zero backend changes. Zero email provider setup. Provides a "Saved" indicator on revisit but no re-engagement email.

**Email capture with explicit consent:**
- GDPR Article 6(1)(a): processing of personal data for marketing requires freely given, specific, informed, unambiguous consent.
- Implementation requirement: a checkbox (pre-unchecked) with text such as "I agree to receive a one-time reminder about this product by email" adjacent to the submit button. The consent must be logged.
- The measurement plan already flags that a privacy policy exists (`apps/caryina/src/app/[lang]/privacy/page.tsx`) — the policy content will need to reference email marketing use if email capture is added.
- GDPR does not require a separate cookie consent banner for email capture — that is about cookies, not email. The checkbox on the form is sufficient for this use case.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit + integration), React Testing Library. Evidence: `apps/caryina/src/components/catalog/StockBadge.test.tsx`, `ProductGallery.client.test.tsx`.
- Commands: Tests run in GitHub Actions CI only per repo policy (`docs/testing-policy.md`). Do not invoke Jest locally. Monitor results via `gh run watch`.
- CI integration: Standard Turborepo CI (not investigated in full for caryina).

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| StockBadge | Unit | `StockBadge.test.tsx` | In-stock, low-stock, out-of-stock states |
| ProductGallery | Unit | `ProductGallery.client.test.tsx` | Render and interaction |
| Checkout route | Unit | `checkout-session/route.test.ts` | Payment flow |
| Cart page | Unit | `cart/page.test.tsx` | Cart render |
| Admin auth | Unit | `adminAuth.test.ts` | HMAC verify |

#### Coverage Gaps

- No tests for PDP page (`page.tsx`) — server component render not currently tested.
- No tests for StickyCheckoutBar.
- Any new client component (save button, capture form) will need unit tests.
- New API route (`/api/notify-me`) will need route handler tests following the `checkout-session/route.test.ts` pattern.

#### Testability Assessment

- Easy to test:
  - Email capture form (client component): render + user interaction + fetch mock.
  - API route: Request/Response mocking following checkout-session pattern.
  - localStorage wishlist: mock localStorage in jest.
- Hard to test:
  - Actual email delivery (Resend/SendGrid) — tested via mock provider in `@acme/email` test suite. No new test infrastructure needed.

#### Recommended Test Approach

- Unit tests for: capture form component (field state, validation, success/error state), wishlist save/load from localStorage.
- Integration tests for: API route (email validation, consent enforcement, email service mock).
- E2E: not required for v1.

### Recent Git History (Targeted)

- `apps/caryina/src/app/api/checkout-session/route.ts` — Added `2026-01-*` (commit `1a92b19c`): merchant email notification on payment success. Establishes `sendSystemEmail` usage pattern.
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — Added `2026-01-*` (commit `e9eee164`): card form + Axerve S2S. Establishes client-side form + fetch pattern.
- No recent changes to PDP page — stable since initial build (`feat(caryina): complete HBAG image-first launch build` ~2025-12).

## Questions

### Resolved

- Q: Is there an existing email provider configured for caryina?
  - A: No. `apps/caryina/.env.local` contains only Axerve payment keys and admin key. `EMAIL_PROVIDER`, `EMAIL_FROM`, and any provider API key are absent. The `@acme/email` package (Resend + SendGrid) exists in the monorepo and is used by other apps, but is not yet wired to caryina.
  - Evidence: `apps/caryina/.env.local` (key listing), `packages/config/src/env/email.ts` (schema), `packages/email/package.json` (deps).

- Q: Does a user account / auth system exist that could support a server-side wishlist?
  - A: No. The only auth in caryina is admin auth (HMAC token for the `/admin` panel). There is no customer account system. A server-side wishlist would require either a new anonymous session concept or email-keyed storage.
  - Evidence: `apps/caryina/src/middleware.ts` (only `/admin` path gated), `apps/caryina/src/app/[lang]/layout.tsx` (CartProvider only, no UserProvider).

- Q: Is GDPR consent already handled for email marketing?
  - A: No. There is no cookie consent banner and no marketing email opt-in anywhere in the app. The analytics client already implements a consent gate (`consent.analytics=true` cookie), but this only governs analytics events — not email capture.
  - Evidence: `packages/platform-core/src/analytics/client.ts` (`hasConsent()` function), search results showing no CookieBanner or ConsentBanner component in caryina.

- Q: Which return-visit mechanism is the right v1 choice?
  - A: Email capture with explicit GDPR consent checkbox is the recommended v1. Rationale:
    - It creates an actual re-engagement path (a follow-up email) within the 3–7 day window. localStorage wishlist gives a visual indicator but cannot re-engage a visitor who leaves and forgets.
    - The monorepo already has Resend/SendGrid sending infrastructure in `@acme/email`. Adding env vars and a new route is the only integration work.
    - The form pattern is already established in CheckoutClient.
    - GDPR compliance is straightforward: a single consent checkbox, not a cookie banner.
    - Back-in-stock is lower priority now (all 3 SKUs in stock), but the same capture form doubles as a back-in-stock signup if stock reaches zero — so this investment has dual use.
  - Evidence: All evidence above.

- Q: Is a Mailchimp/Brevo-style external list manager needed, or can the submission be stored internally?
  - A: For v1, the lowest-friction path is to (a) send a confirmation email to the subscriber and (b) notify the merchant email (`MERCHANT_NOTIFY_EMAIL`) of the new capture — fire-and-forget, no external list manager required. A flat-file approach (`data/shops/caryina/`) is not viable on the Cloudflare Worker runtime (filesystem writes are not persistent). The viable secondary persistence option is a Prisma DB table (durable, queried later for follow-ups). The operator should decide on persistence (see Open Questions), but the email-send flow works without a DB.

- Q: Is back-in-stock applicable now?
  - A: Not as a trigger mechanism. All 3 SKUs are currently in stock. However, building the email capture form now means back-in-stock alerts can be added later by filtering captured emails by the SKU they expressed interest in and firing when stock transitions from 0 to >0. V1 should capture `{ email, productSlug, consentAt }` to preserve this upgrade path.
  - Evidence: `data/shops/caryina/inventory.json` (qty: 5, 7, 4 — all positive).

### Open (Operator Input Required)

- Q: Should captured email addresses be persisted to a DB table (Prisma) or handled as fire-and-forget (merchant email notification only, no secondary persistence)?
  - Why operator input is required: Flat-file persistence is not viable on the Cloudflare Worker runtime. The viable options are Prisma/DB (more robust, retains records, adds schema migration) or fire-and-forget to merchant email (simplest, but loses the capture if merchant email delivery fails). This is an operator cost/effort decision.
  - Decision impacted: Whether a new API route needs a DB write or only an email send.
  - Decision owner: Pete
  - Default assumption + risk: Default to fire-and-forget to merchant email + send subscriber confirmation. Risk: if the merchant email delivery fails, the capture is lost. Mitigation: log to console as backup.

- Q: Which email delivery path to use — Option A (Gmail SMTP via `sendSystemEmail`) or Option B (Resend cloud provider via `sendCampaignEmail`)?
  - Why operator input is required: The two paths require different env vars, different code patterns, and have different deliverability characteristics. Option A mirrors the existing checkout notification; requires Google App Password for `GMAIL_USER`/`GMAIL_PASS`. Option B requires a Resend account, `RESEND_API_KEY`, and `EMAIL_FROM`; better for long-term deliverability.
  - Decision impacted: Which env vars to configure, which function to call in the new API route, and which mock to use in tests.
  - Decision owner: Pete
  - Default assumption + risk: Default to Option A (Gmail SMTP) as it exactly mirrors the existing checkout notification pattern and requires no new account creation. Risk: Gmail limits (500 emails/day for personal accounts; 2,000/day for Workspace) are not a constraint at v1 launch volume. If deliverability becomes an issue at scale, migrate to Option B.

## Confidence Inputs

- **Implementation: 82%**
  - The implementation path is clear: new client component (form), new API route, env vars. All code patterns are established in the existing codebase. Key finding: `sendSystemEmail` routes to Gmail SMTP (not Resend/SendGrid); the operator must choose Option A (Gmail, mirrors checkout pattern) or Option B (Resend/SendGrid via `sendCampaignEmail`). This is resolved by an operator decision, not a code gap.
  - The analytics event type `notify_me_submit` must be added to `ALLOWED_EVENT_TYPES` in the analytics route, or analytics observability is dropped to console-only for v1.
  - To reach 90%: Operator chooses email delivery path and provisions credentials.

- **Approach: 88%**
  - Email capture is the right mechanism for the 3–7 day consideration window problem. localStorage wishlist was assessed and ruled out as insufficient (no re-engagement path). Back-in-stock is out of scope for v1.
  - To reach 90%: Validate that the Resend provider can send from the desired `From` address without domain verification issues (Resend requires domain verification for custom From addresses; `@gmail.com` or `@resend.dev` addresses work on free tier without domain setup).

- **Impact: 75%**
  - Captures email addresses from undecided visitors → enables re-engagement. However, the impact depends on acquisition volume (traffic from TikTok/Instagram not yet validated). At low volume, the mechanism exists but has few opportunities to fire.
  - To reach 80%: First week of live traffic data showing PDP views without conversion (validating the consideration-window gap exists in practice).
  - To reach 90%: First follow-up email sent; any downstream conversion from a captured email.

- **Delivery-Readiness: 80%**
  - Code path is clear. One blocking external action: operator must provision email provider API key before the email-send path is live. The form itself can be built and shipped with email-send path behind an env-var guard (graceful no-op if `EMAIL_PROVIDER` is unset).
  - To reach 90%: Email provider API key set in Cloudflare deployment config.

- **Testability: 82%**
  - Form render and field interaction are straightforward with React Testing Library. API route can be tested with mocked `sendSystemEmail`. GDPR consent logic (checkbox enforcement) is unit-testable.
  - To reach 90%: Confirm jest setup allows mocking `sendSystemEmail` in the same pattern used in `checkout-session/route.test.ts`.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Email provider not configured before launch | Medium | High — email capture exists but silently fails to send | Guard API route: if `EMAIL_PROVIDER` not set, return 503 with clear error; use `noop` provider in dev. Operator must set env vars before going live. |
| GDPR non-compliance if consent checkbox skipped | Low (server-enforced) | High — regulatory risk | API route must reject requests with `consent !== true`. Do not trust client-side enforcement alone. |
| Resend domain verification required for custom From address | Medium | Low — workaround available | Use `onboarding@resend.dev` or a verified domain. Resend allows sending from `@resend.dev` address on free tier without domain verification. |
| Email capture conversion rate too low to validate | Medium | Low — no sunk cost | V1 is a lightweight form; if zero captures in 30 days, feature is removed with no architecture debt. |
| `sendSystemEmail` dynamic require pattern breaks in edge runtime | Low | High | Checkout route already uses `runtime = "nodejs"` successfully with this pattern. New route must also specify `runtime = "nodejs"`. |
| Privacy policy not updated to mention marketing emails | Medium | Medium — GDPR documentation requirement | Add a bullet to the privacy policy content (`getPolicyContent`) noting email marketing and the right to withdraw. |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PDP insertion point (page.tsx structure) | Yes | None | No |
| StickyCheckoutBar as secondary mobile CTA point | Yes | None | No |
| Email sending infrastructure (platform-core email service) | Yes | [Integration boundary not handled, Moderate]: Two delivery paths exist with different env var requirements. Option A (sendSystemEmail → Gmail SMTP): requires GMAIL_USER + GMAIL_PASS; silently simulates without them. Option B (sendCampaignEmail → Resend): requires EMAIL_PROVIDER, EMAIL_FROM, RESEND_API_KEY. Operator must choose and provision credentials before real email delivery works. Plan task must specify which path. | No (operator decision required; documented in Open Questions) |
| GDPR consent mechanism | Yes | [Missing domain coverage, Moderate]: No consent UI exists anywhere. Must be added as part of this feature (checkbox on form). Not a separate pre-requisite — can ship together. | No |
| API route pattern (Node.js runtime) | Yes | None — checkout-session/route.ts confirms the pattern works | No |
| localStorage wishlist path (assessed, de-selected) | Yes | None — assessed and de-selected in favour of email capture | No |
| Persistence layer for captured emails | Partial | [Missing data dependency, Moderate]: No DB table exists for captures. Flat-file persistence is not viable on Cloudflare Worker. V1 recommendation is fire-and-forget to merchant email (avoids schema change but fragile if email delivery fails). | No (addressed in Open Questions) |
| Test coverage for new components | Yes | [Missing domain coverage, Minor]: PDP page.tsx and StickyCheckoutBar have no existing tests. New components will need tests. | No |
| Privacy policy update requirement | Yes | [Missing domain coverage, Minor]: Privacy policy content must be updated if email marketing is added. Noted in Risks. | No |
| Analytics event allowlist (notify_me_submit) | Yes | [API signature mismatch, Moderate]: apps/caryina/src/app/api/analytics/event/route.ts ALLOWED_EVENT_TYPES does not include notify_me_submit. Sending this event will return 400 until the allowlist is extended. Observability plan must account for this — either extend the allowlist (TASK-06) or use console-only logging for v1. | No (documented in Observability expectations and Task Seeds) |

## Planning Constraints & Notes

- Must-follow patterns:
  - New client component must be suffixed `.client.tsx` and use `"use client"` directive.
  - API route must use `export const runtime = "nodejs"` (not edge runtime — `sendSystemEmail` uses dynamic require).
  - GDPR consent must be enforced server-side in the API route (do not trust client-only).
  - Email capture field must include a clearly labelled consent checkbox that is unchecked by default.
  - Capture payload must include `productSlug` to preserve the back-in-stock upgrade path.

- Rollout/rollback expectations:
  - The capture form is a purely additive UI element. Rollback = delete the new client component and remove it from the PDP JSX. No database migration is needed if fire-and-forget approach is used.
  - If DB persistence is chosen, rollback requires migration to drop the table.

- Observability expectations:
  - Log each capture attempt server-side using `console.info` with **redacted email** (e.g., log only the domain part or a hash — never the full email address in logs, which would constitute PII storage in log aggregators). Log email send success/failure in the API route.
  - The `logAnalyticsEvent` client call uses `{ type: "notify_me_submit" }`, but `apps/caryina/src/app/api/analytics/event/route.ts` allowlists only `page_view | product_view | add_to_cart | checkout_started | order_completed`. A `notify_me_submit` event type will be rejected with a 400. The plan task must include extending `ALLOWED_EVENT_TYPES` in the analytics route, or use `console.info` only (server-side) as the v1 observability mechanism.

## Suggested Task Seeds (Non-binding)

- TASK-01: Create `NotifyMeForm.client.tsx` — email input + consent checkbox + submit button, form state, fetch to `/api/notify-me`, success/error states.
- TASK-02: Create `apps/caryina/src/app/api/notify-me/route.ts` — validate email + consent, call `sendSystemEmail` (confirmation to subscriber + notification to merchant), return `{ success: true }`.
- TASK-03: Add `NotifyMeForm` to PDP (`page.tsx`) below the AddToCartButton section, conditionally or always-visible.
- TASK-04: Add env var documentation — update `.env.local` example with `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`.
- TASK-05: Update privacy policy content to reference email marketing.
- TASK-06: Extend `ALLOWED_EVENT_TYPES` in `apps/caryina/src/app/api/analytics/event/route.ts` to include `notify_me_submit` (or choose console-only observability for v1).
- TASK-07: Unit tests for `NotifyMeForm` (field state, consent enforcement, success/error states) and `notify-me/route.ts` (validation, email mock, PII-safe logging).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `NotifyMeForm.client.tsx` renders on PDP below checkout CTA.
  - `POST /api/notify-me` returns `{ success: true }` for valid request, `{ error }` for invalid.
  - Consent checkbox enforced server-side (400 if `consent !== true`).
  - Email sends (or graceful no-op if `EMAIL_PROVIDER=noop`) on valid submission.
  - At least one unit test for form component and one for API route.
  - Privacy policy content updated.
- Post-delivery measurement plan:
  - Log `notify_me_submit` analytics event on each form submission.
  - Merchant notification email received confirms the flow is working end-to-end.
  - Check submission count weekly (merchant email log or console log review).

## Evidence Gap Review

### Gaps Addressed

- Email infrastructure: Confirmed `@acme/email` has two distinct paths. `sendEmail()` (nodemailer/Gmail SMTP) is what `sendSystemEmail` calls — it requires `GMAIL_USER`/`GMAIL_PASS` and silently simulates without them. `sendCampaignEmail()` routes via Resend/SendGrid. Operator must choose which path to use (Open Question). Neither is configured for caryina. The checkout route uses `sendSystemEmail` (Gmail path) for merchant notifications — the notify-me route should follow the same pattern or explicitly use `sendCampaignEmail` if cloud provider delivery is preferred.
- GDPR: Confirmed no existing consent UI. Confirmed that email capture consent is a standalone checkbox (not a full cookie banner). Confirmed analytics consent is separate and does not cover email.
- State management: Confirmed no complex state management exists — CartContext only. localStorage is available and used by analytics client. No zustand/jotai/redux.
- Persistence: Confirmed no subscriber DB table exists. Flat-file persistence is not viable on the Cloudflare Worker runtime. V1 options are fire-and-forget to merchant email (Open Question for operator) or Prisma/DB table.
- Stock levels: Confirmed all 3 SKUs in stock — back-in-stock trigger not needed for launch, but payload should capture `productSlug` for future use.

### Confidence Adjustments

- Implementation reduced from initial ~90% estimate to 85% due to email provider env var dependency (external operator action).
- Impact held at 75% — the mechanism is sound but traffic volume is unvalidated.

### Remaining Assumptions

- Operator can provision a Resend account and API key within one build cycle.
- The `sendSystemEmail` dynamic-require pattern works the same for a new API route as it does for the checkout route (high confidence — identical runtime).
- Privacy policy content is managed via `getPolicyContent()` in `apps/caryina/src/lib/contentPacket.ts` — update is straightforward.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None for code build. The API route can be built with a `noop` guard (graceful failure if env vars not set). Email sending goes live when the operator adds env vars.
- Recommended next step:
  - `/lp-do-plan hbag-pdp-return-visit-capture --auto`
