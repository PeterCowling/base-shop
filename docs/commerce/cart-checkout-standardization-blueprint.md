<!-- docs/commerce/cart-checkout-standardization-blueprint.md -->

Type: Blueprint
Status: Draft
Domain: Commerce
Last-reviewed: 2025-12-21

# Cart & Checkout Standardization Blueprint

Revision: v6 (decision-locked, ready for sign-off)
Audience: Product, Design, Engineering, Ops, Finance
Purpose: Standardize shopping carts + checkout across many websites (and web-based apps) around one Stripe account, with shared customer accounts across sites, and best‑in‑class purchase UX—in a way leadership can decide on without reading code.

Note on length: This blueprint is intentionally long to be decision-grade and repo-accurate; after sign-off, split it into a short Charter + enforceable Contract addendum + tracked Plan tasks.

1. Executive summary
   1.1 “Contract + Manifest” in plain English

Contract: a standardized set of rules every commerce site must follow (required routes + required behaviors).

Manifest: a checklist per site/runtime of what it can actually do today (capabilities on/off).

This repo already uses this pattern (contract doc + runtimeContractManifest.ts). The path forward is to mature and enforce it, not replace it.

Definitions (for non-technical readers)

- Runtime: where a server route executes (Node.js vs Edge/Workers), which determines what libraries it can use and how reliable payment processing can be.
- Webhook: Stripe calling your server to tell you a payment/checkout event happened (server-to-server).
- Idempotency: “safe to retry” behavior—duplicates do not create duplicate charges, sessions, or orders.

  1.2 What’s true in the repo right now

There are two materially different commerce architectures in the repo:

Platform path (intended standard)

Contracted routes: /api/cart and /api/checkout-session (per template-contract.md).

Cart is keyed by a host-only cookie \_\_Host-CART_ID (cartCookie.ts).

Checkout follows the selected platform standard (`checkout_session_custom`):

Server creates a Checkout Session with `ui_mode: custom` and returns the Checkout Session `client_secret` (createSession.ts).

UI completes payment via Stripe Custom Checkout (CheckoutProvider/useCheckout) using the Checkout Session `client_secret` (CheckoutForm.tsx).

Webhooks exist and are used: /api/stripe-webhook (route.ts line ~9 / ~8), and this is reflected as an explicit manifest capability (`capabilities.webhooks=true`).

Worker track (divergent)

Different cart model + different route names (see Section 11).

Checkout is a redirect to a worker-created Checkout Session URL (CheckoutPanel.tsx line ~39 + worker index.ts).

This is not “almost compatible”—it’s a separate stack.

1.3 Selected decisions (ready for sign-off)

This blueprint takes the long-term, professional-grade options and treats them as the platform standards:

- Payments mode (platform standard): `checkout_session_custom` (Checkout Sessions `ui_mode='custom'` + custom UI).
- Runtime (platform standard): Node.js for `/api/checkout-session` and `/api/stripe-webhook`.
- Identity (target): multi‑TLD SSO via OIDC auth code + PKCE (`capabilities.identityMode=sso_oidc`), with per-storefront first‑party sessions and the web session/redirect contract (Section 9.5).
- Identity provider (selected): Keycloak (self-hosted OIDC IdP).
- Customer identifiers (required): `internalCustomerId` canonical + `stripeCustomerId` mapping; eliminate ambiguous `customerId`.
- Logout + order linking (platform standard): `capabilities.logoutMode=local_plus_idp`; `capabilities.orderLinking=explicit_claim`.
- Pricing truth (platform standard): platform catalog is authoritative; Stripe Price IDs are an optional implementation detail.
- Tax (target): `stripe_tax` long-term; `static_rates` is a transitional mode; declare via `capabilities.taxMode`.
- Inventory (target): `reserve_ttl` long-term; `validate_only` is the baseline until a centralized hold authority exists.
- Worker convergence (policy): timeboxed shim with contract-compatible alias routes + standard analytics + standard metadata, then replace/migrate.
- Enforcement (policy): extend manifest (`webhooks`, `paymentsMode`, `taxMode`, `inventoryMode`, `identityMode`, `profileApi`, `orderLinking`, `logoutMode`) and gate with CI conformance tests.

Confirmed domain topology: multi‑TLD storefronts. Shared cookies across storefronts are impossible, so “one account across websites” requires SSO/OIDC redirect flows (Phases 0–2 should still proceed without waiting for SSO rollout).

2. Reality check (the strongest signal in the document)
   2.1 You already have a “contract + manifest” pattern (build on it, don’t fork it)

template-contract.md defines the platform commerce contract (routes + behaviors).

runtimeContractManifest.ts files declare which capabilities an app actually implements.
Implication: the “standardization” path is to evolve this pattern, not invent a parallel one.

2.2 Stripe hybrid is resolved (and must not return)

Platform standard (implemented): Checkout Sessions `ui_mode: custom` end-to-end.

- Backend creates Checkout Sessions with `ui_mode: custom` and returns the Checkout Session `client_secret` (not a PaymentIntent client secret).
- Frontend completes payment via Stripe Custom Checkout (CheckoutProvider/useCheckout) using that Checkout Session `client_secret` (not `stripe.confirmPayment`).

Enforcement rule: mixing “Session creation” with “PaymentIntent confirmation semantics” is explicitly disallowed. `capabilities.paymentsMode` must reflect the actual integration and is enforced via conformance tests.

Target-state data flow (source of truth)

```mermaid
flowchart LR
  Browser[Browser] -->|POST /api/cart| Runtime[Shop runtime]
  Runtime -->|Set-Cookie __Host-CART_ID| Browser
  Browser -->|POST /api/checkout-session| Runtime
  Runtime -->|Create Stripe payment object + idempotency key| Stripe[Stripe]
  Stripe -->|client_secret + ids| Runtime
  Runtime -->|Return client_secret + ids| Browser
  Browser -->|Complete payment (Stripe.js)| Stripe
  Stripe -->|Webhook event| Webhook[/api/stripe-webhook/]
  Webhook -->|Idempotent upsert + store Stripe ids + amounts| DB[(Orders DB)]
  Webhook -->|2xx| Stripe
```

2.3 Cookie discipline is already technically correct (do not weaken it)

Cart cookie is \_\_Host-CART_ID (cartCookie.ts ~line 13).

\_\_Host- cookies are intentionally host-only and must not set a cookie Domain attribute (and must be Secure with Path=/).
MDN Web Docs

Implication: keep carts per-site. Do not attempt to “share carts” across sites by loosening cart cookies.

2.4 Worker track is truly divergent

At least one app uses:

local storage cart model

redirects to a worker-created Checkout Session URL

different route naming and contracts
Implication: this is not a thin adapter problem. It’s closer to a rebuild on the platform contract (or a full contract-compliant implementation in the worker).

2.5 Runtime constraints (Edge vs Node) must be surfaced explicitly

Repo reality (as of 2025-12-21):

Checkout + webhook routes run on the Node runtime in platform-compatible apps (runtime = "nodejs"), because payments/webhooks depend on Node-first libraries (Stripe SDK + DB access) and require high reliability.

Edge runtime remains viable for non-payment-critical endpoints, but payments/webhooks are not an Edge target until dependencies are Edge-safe and proven under load.

Selected standard: run `/api/checkout-session` and `/api/stripe-webhook` on the Node runtime for reliability. Treat Edge support for payments/webhooks as a later optimization only after dependencies are Edge-safe and proven under load.

3. Target outcomes and non‑negotiables
   3.1 Target outcomes

One Stripe account for all commerce across all sites/apps.

One customer account works everywhere (cross-site login and consistent customer identity).

One standardized purchase flow across brands with consistent UX patterns and shared components.

One canonical commerce contract implemented per app/runtime and declared via the existing manifest.

Operational excellence: idempotent checkouts + webhooks, clean reconciliation, inventory correctness, tax compliance, fraud-ready.

3.2 Non-negotiables (platform requirements)

Contract + manifest remain the source of truth for “platform-compatible commerce.”

Server-authoritative totals: pricing/totals computed server-side; client never supplies authoritative price.

Webhook-verified completion: order completion is finalized by verified Stripe webhook events, not solely by client success.

Idempotency everywhere:

Stripe “writes” use idempotency keys. Stripe explicitly documents idempotent requests for safe retries and recommends idempotency keys on POSTs.
Stripe Docs
+1

Webhook processing is duplicate-safe and does not return 500 on already-processed events. Stripe explicitly warns webhooks can deliver duplicate events and recommends logging processed event IDs.
Stripe Docs

Inventory validation/locking before payment finalization: you must not confirm/capture payment for items you can’t fulfill. This must work across runtimes/sites that share the Stripe account.

Tax/shipping compliance: tax and shipping totals must be accurate and auditable (policy + implementation + tests).

Finance-grade reconciliation: payouts/deposits must be traceable to Stripe transactions and internal orders (Section 10.3).

Runtime choice is explicit: checkout + webhook must have a defined runtime standard (Node vs Edge) (Section 2.5 / 13).

4. Best‑in‑class purchase UX requirements (standardize across brands)
   4.1 Entry and friction minimization

Guest checkout must be prominent and easy to find.

Do not force account creation before purchase.

Offer account creation after purchase (“save details for next time”).

4.2 Form minimization

Minimize visible fields; avoid unnecessary optional fields.

Address autocomplete/prefill where possible.

Inline validation + clear error messages + reliable retry behavior.

4.3 Speed: wallets and saved details

Offer express payments (Apple Pay/Google Pay/etc.) when eligible.

Make the “fast path” the default for returning users.

Standardize recovery for declines/3DS/network issues.

4.4 Standard analytics events (must be consistent across all runtimes)

Every runtime (including Worker during shim) emits identical events:

add_to_cart, remove_from_cart, view_cart, cart_quantity_changed

start_checkout, payment_attempt, payment_success, payment_failure

order_complete, refund, chargeback (if applicable)

Each event includes consistent dimensions:
shop_id, cart_id, order_id, currency, value, payment_method_type, is_logged_in, etc.

5. Standardization mechanism: build on your existing contract + manifest
   5.1 Commerce Contract (what is “contracted”)

For the repo’s intended platform path, the contracted endpoints include:

/api/cart (GET/POST/PATCH/PUT/DELETE)

/api/checkout-session (POST)

/api/stripe-webhook (POST) — this exists and is used today (route.ts line ~9 / ~8), so it must be treated as contracted, not optional.

5.2 Manifest gating (repo reality + enforcement requirement)

Repo reality:

The repo uses capabilities.checkout (not capabilities.checkoutSession).

The repo now includes explicit capabilities for enforceable standardization, including `capabilities.webhooks` and `capabilities.paymentsMode`.

5.3 Selected manifest extensions (required for enforcement)

Extend the manifest schema (without breaking existing apps) with explicit keys needed for governance:

capabilities.cart (existing)

capabilities.checkout (existing)

capabilities.webhooks (new, required)

capabilities.paymentsMode (new, required):

"payment_intent" | "checkout_session_custom" | "hosted_checkout"

capabilities.taxMode (new): "static_rates" | "taxjar_api" | "stripe_tax" | "custom"

capabilities.inventoryMode (new): "none" | "validate_only" | "reserve_ttl"

capabilities.identityMode (new): "none" | "per_site" | "sso_oidc"

capabilities.profileApi (new): boolean

capabilities.orderLinking (new): "none" | "email_verified" | "explicit_claim"

capabilities.logoutMode (new): "local" | "local_plus_idp" | "global"

These are what allow CI conformance tests to be deterministic and enforceable.

6. Cart standard (how carts must work everywhere)
   6.1 Cart persistence and scope

Carts are per-site/per-host (not global cross-site carts).

Cart identity is stored server-side and keyed by \_\_Host-CART_ID.

Keep \_\_Host-CART_ID host-only; never set a cookie Domain for it.
MDN Web Docs

6.2 Cart lifecycle requirements

/api/cart supports add/update/remove/clear and returns server-authoritative totals.

6.3 Current inventory enforcement reality (important constraint)

Today, cart-side enforcement appears to be limited to simple sku.stock checks (engineering reference: cartApi.ts line ~116).
Implication: true cross-site locking/reservation is greenfield work.

6.4 Inventory locking/validation (target-state requirement)

To prevent oversells across multiple runtimes sharing one Stripe account:

On checkout creation (POST /api/checkout-session): validate stock and either:

reserve stock for a short TTL (“hold”), or

reject checkout creation with a clear “out of stock / reduced quantity” response.

On webhook finalization: re-validate stock (or ensure reservation still valid) before fulfillment.

Inventory must be centralized or have a single authority so Worker and platform paths enforce the same rules.

Implementation path (decision-grade)
- Baseline (current): `inventoryMode=validate_only` everywhere.
- Target: `inventoryMode=reserve_ttl` backed by a shared reservation store (e.g., Redis/Do/DB row locks) with hold IDs passed through checkout metadata and persisted on orders.
- Enforce a per-item reservation TTL and release policy; reconcile holds on webhook finalization or expiry to avoid stranded inventory.

Deep-dive (repo audit + decision options): `docs/commerce/inventory-standardization-blueprint.md`.

Phasing recommendation (to avoid stalling the program):

- Phase 1 baseline: `inventoryMode=validate_only` (reject invalid checkouts consistently everywhere).
- Later phase: `inventoryMode=reserve_ttl` once you have a centralized lock/hold mechanism that works across runtimes.

7. Checkout standard (enforcement-ready)
   7.1 Current platform standard (repo-accurate)

Platform standard (implemented): Checkout Sessions `ui_mode='custom'` + Stripe Custom Checkout UI (`checkout_session_custom`).

- Server creates a Checkout Session with `ui_mode: custom` and returns the Checkout Session `client_secret`.
- UI completes payment via Stripe Custom Checkout (CheckoutProvider/useCheckout) using that Checkout Session `client_secret`.

7.2 Selected payments mode (platform standard)

Selected (platform standard): Option B — Checkout Sessions `ui_mode='custom'`. This resolves the prior hybrid by making the Checkout Session (not an indirectly-created PaymentIntent) the primary Stripe object for the client flow and finance reconciliation, while still allowing a fully custom UI.

Option A — PaymentIntents + Payment Element (pure PaymentIntent orchestration)

What must change from today

Server stops creating Checkout Sessions for the core flow and instead creates PaymentIntents directly.

Client keeps confirming the PaymentIntent (closest to current UI).

Pros

Aligns with current UI behavior (lower UI migration risk).

Clear “source of truth” (PaymentIntent + webhook) with no Session→Intent ambiguity.

Cons

You own orchestration: lifecycle, shipping/tax policy implementation, and reporting consistency (see Section 10.4).

Option B — Checkout Sessions ui_mode='custom' (Checkout-first custom UI)

Platform requirement (enforced)

Server must create a Checkout Session configured for custom UI mode and return the Checkout Session client_secret. Stripe documents that client_secret is available for ui_mode: custom and should be used with custom checkout initialization.
Stripe Docs

Client must use the Checkout custom flow driven by the Checkout Session client_secret (CheckoutProvider/useCheckout), not PaymentIntent confirmation.
Stripe Docs

Runtime note (selected standard): checkout + webhooks run in Node runtime for reliability.

Pros

Checkout Session becomes the durable Stripe object used for reconciliation (client_reference_id, session id, etc.).
Stripe Docs
+1

Often easier operationally (especially if you want consistent policies across many sites).

Cons

Requires explicit UI rewrite away from PaymentIntent confirmation semantics.

Option C — Stripe-hosted Checkout (redirect/embedded hosted)

Pros

Fastest convergence and usually strong conversion.
Cons

Less control over fully standardized UX/UI across brands.

7.3 “Order Draft before payment” (target-state vs current reality)

Target-state requirement (platform maturity goal): create a durable Order Draft record before payment finalization so:

reconciliation is easier

retries are safe

fulfillment and customer service have a stable reference id even if payment fails mid-flow

Current reality:

Template flow creates orders on webhook and relies on DB uniqueness (see Section 8).

One tenant runtime (engineering reference: cover-me-pretty route.ts line ~145) does best-effort pre-create, but this is not consistent across runtimes.

This must be treated as a deliberate migration step, not assumed “already done.”

8. Webhooks, orders, and idempotency (current failure mode + required fix)
   8.1 Webhooks are contracted and must be enforceable

/api/stripe-webhook exists and is used today (engineering reference: route.ts line ~9 / ~8).
Therefore: webhook behavior must be part of the Commerce Contract and must be represented in the manifest (capabilities.webhooks) to enforce compliance.

8.2 Previous failure mode (now fixed)

Previously, duplicate checkout.session.completed deliveries could:

call into order creation (checkoutSessionCompleted.ts → creation.ts)

hit DB uniqueness: @@unique([shop, sessionId]) and throw, causing repeated failures until retries stop

Fix (implemented):

- Processed-event de-dupe store keyed by Stripe `event.id`, returning 2xx/no-op on duplicates (30-day retention).
- Idempotent order creation: uniqueness collisions return the existing order instead of throwing.

Stripe will retry webhooks when your endpoint doesn’t return 2xx (up to ~3 days in live mode), so this behavior is required for reliability.

8.3 Required idempotency behavior (platform standard)

Stripe explicitly recommends guarding against duplicate events by logging processed event IDs and not reprocessing already-logged events.
Stripe Docs

Implement both layers:

Processed event de-dupe (primary)

Store stripe_event_id in a processed_events store.

First step: insert the event id.

If it already exists → return 2xx success immediately.

Retention: 30 days.

Idempotent order upsert (secondary)

Order creation must be idempotent on (shop, sessionId) (and/or PaymentIntent id).

If the order already exists, treat as success (return existing order), not as an error.

8.4 Stripe write calls must be idempotent too

Stripe documents idempotent requests for safe retries and recommends using idempotency keys for create/update operations.
Stripe Docs
+1

Platform standard:

Every Stripe create/update call (Checkout Session, PaymentIntent, refunds) includes an idempotency key.

Keys must be persisted with the checkout attempt/order draft so retries are safe and deterministic.

9. “One account across websites” (identity + cookies + redirect flows)
   9.1 This is major new work (not configuration)

Engineering notes:

Session cookies support a cookie domain (session.ts line ~35).

Customer login is mock in at least one tenant runtime (route.ts line ~20).

Checkout attaches Stripe customers using `stripeCustomerId`, while `internalCustomerId` is stored separately (createSession.ts line ~350).

Shared accounts require:

real login/signup/reset flows

a shared customer profile model

consistent mapping to Stripe Customer under the one Stripe account

9.2 Domain topology is a constraint (binary)

Subdomains on same registrable domain: shared identity cookies possible.

Different TLDs: shared cookies impossible → shared accounts require SSO/OIDC.

Decision: multi‑TLD storefronts. Therefore, SSO/OIDC is mandatory for shared accounts.

Scope constraint (to keep commerce standardization deliverable):

- Phase 1: treat different TLDs as separate identity islands (guest checkout + per-site accounts).
- Phase 2+: deliver cross-TLD shared accounts via a dedicated Identity/SSO blueprint (Keycloak OIDC IdP), then migrate storefronts to it.

  9.3 Cart cookie vs identity cookie (keep the discipline)

Cart stays host-only: \_\_Host-CART_ID.
MDN Web Docs

Identity for multi‑TLD storefronts must use SSO/OIDC redirect flows, with a first‑party session established separately on each storefront domain after authentication.

9.4 Identity + commerce binding contract: identifiers (enforceable)

Treat this as a contract (like routes): multi‑TLD SSO mostly succeeds or fails based on identifier invariants + deterministic Stripe/customer mapping.

Identifier invariants (platform standard)

- `internalCustomerId` (canonical)
  - Stable across all storefronts; immutable.
  - Source of truth: a platform-owned UUID (not derived from external identifiers).
  - External identity mapping: `{iss, sub}` stored separately and mapped 1:1 to `internalCustomerId` (do not bake issuer into the primary key; issuer URLs can change).
  - Never derived from email (email is an attribute, not an identifier).
- `stripeCustomerId` (mapping)
  - Stripe Customer ID in the single Stripe account/environment.
  - At most one canonical `stripeCustomerId` per `internalCustomerId` per environment.

Stripe customer mapping rules (platform standard)

- Mapping storage: a unique mapping keyed by `internalCustomerId` (enforced with a unique constraint).
- Creation is idempotent and concurrency-safe:
  - Stripe Customer creation uses an idempotency key derived from `internalCustomerId` (+ environment).
  - Concurrent attempts must resolve to one canonical mapping.
- If duplicates ever occur (migration bugs, legacy data): treat extra Stripe customers as orphans and never attach them to new orders without an explicit merge workflow.

Order + Stripe object persistence rules (platform standard)

- Orders must always store `customer_email` when known (guest or logged-in).
- When authenticated, orders must store both `internalCustomerId` and `stripeCustomerId`.
- Stripe objects created for checkout/payment must include `internalCustomerId` and `stripeCustomerId` (if available) in metadata so support and finance can reconcile across storefronts.
- Guest checkout policy: do not attach a Stripe Customer unless the user is authenticated (or explicitly opts in post‑purchase).

Naming + governance (enforceable)

- Do not use ambiguous `customerId` in commerce flows.
- Standard names are `internalCustomerId` and `stripeCustomerId`, enforced via schema/types (and linting where possible).

9.5 Web session + redirect contract (multi‑TLD SSO; enforceable)

Selected standard (platform requirement)

- OIDC callback: top-level GET with `response_mode=query` (avoid POST callbacks like `form_post` unless strictly required).
- If a POST callback is required, use `SameSite=None; Secure` for transient auth cookies and enforce stricter CSRF defenses.
- OIDC transaction state: store `state`, `nonce`, and `code_verifier` server-side keyed by `state` with a short TTL (for example 10 minutes). Do not rely on a cookie being sent on the callback to recover PKCE state.
- Login CSRF defense (required): bind the OIDC transaction to the initiating browser by storing an `initiatingSessionId` (or pre‑auth session nonce) and require it to match on callback. This prevents session swapping.
- Silent SSO / iframe session checks are optional and must not be required; they rely on third‑party cookies that are increasingly restricted.
- Redirect URIs must be derived from a per‑storefront canonical origin (configured per app). Do not construct redirect URIs from request host headers unless you enforce a strict allowlist.
- Storefront session cookie (per storefront domain):
  - Host-only (do not set `Domain`; `__Host-` prefix recommended), `HttpOnly; Secure; Path=/; SameSite=Lax`.
  - Rationale: `Lax` preserves sessions on top-level navigations from other sites (IdP redirects, email deep links), which is required in a multi‑TLD world.
- CSRF (required because SameSite is not Strict):
  - All state-changing routes under cookie auth require CSRF protection (token + Origin/Referer checks as the baseline).
  - Auth endpoints rely on OIDC `state`/`nonce` validation (separate from application CSRF).

Repo reality note: customer session cookies are `SameSite=Strict` today (session.ts line ~36). This must change (or you must guarantee you never rely on cookies during redirects, including for deep links) to make multi‑TLD SSO reliable.

9.6 Identity/SSO blueprint scope (multi‑TLD storefronts)

Because storefronts are multi‑TLD, shared accounts must be delivered via an Identity/SSO program. This section defines the scope and target shape so leadership can approve the work without reading code.

Goal (business + product)

- A customer who logs into any storefront can log into other storefronts via SSO, while each storefront maintains its own first‑party session.
- “Recognized across storefronts” means user‑initiated SSO: on Storefront B, the user clicks “Log in” and completes without a credential prompt if the IdP session is active.
- Silent/automatic cross-site “recognition” without a redirect is not required and should be treated as an optional optimization (browser-dependent).
- “Guest-first” checkout remains available; authentication is optional until after purchase.

Selected standard (technical)

- OIDC/OAuth2 authorization code flow with PKCE for browser-based storefronts.
- A single Identity Provider (IdP) is the source of truth for authentication and MFA policy; storefronts are OIDC clients.
- Selected IdP: Keycloak (self-hosted).
- Each storefront establishes its own first‑party session after a successful OIDC callback (no cross-domain cookies).

Keycloak OIDC issuer placeholder (to be filled in during the Identity/SSO blueprint)

- Realm: [TBD] (example: skylar)
- Issuer URL: [TBD] (example: https://idp.example.com/realms/skylar)
- OIDC discovery URL: [TBD] (example: https://idp.example.com/realms/skylar/.well-known/openid-configuration)
- Storefront OIDC clients: [TBD list of client_id per storefront]
- Storefront origin (per app): [TBD] (example: https://shop-a.example)
- Redirect URIs (login + callback): derived per storefront origin (not a single global value)
- Logout endpoint + post-logout redirect URIs: [TBD]

Recommended implementation direction (professional-grade)

- Use Keycloak as the IdP (self-hosted) and avoid “build your own” login/consent stacks.
- Do not store long-lived tokens in the browser. Prefer server-side sessions with httpOnly cookies per storefront domain.
- Design for IdP outages: new logins and refresh flows can fail; existing sessions may continue until expiry if JWTs are validated locally (avoid hard dependencies on per-request introspection).
- OIDC implementation should use a standards-compliant library (e.g., OpenID client) for code exchange + validation rather than hand‑rolled JWT checks.

In scope (Identity/SSO blueprint)

- Keycloak configuration (realms/clients per storefront domain, redirect URIs, logout URIs).
- Core auth flows: login, signup, logout, password reset and/or magic link, MFA.
- Session model per storefront domain (httpOnly cookie, expiry/refresh policy, revocation).
- OIDC callback handling on each storefront (server-side code exchange, session establishment).
- Cross-site SSO behavior: if user is already authenticated at the IdP, a login on another storefront completes without re-authentication.
- Customer profile API surface (minimal): email/name/phone, saved addresses, consent/preferences (as required).
- Customer identifier model: enforce `internalCustomerId` (canonical) + `stripeCustomerId` mapping and usage across checkout + webhooks.
- Security posture: SameSite policy suitable for redirects, explicit CSRF defenses for state-changing requests, audit logging, rate limiting.
- Migration plan for existing per-site accounts (if any) into the unified identity system, including account linking and conflict handling.
- Governance/enforcement: add identity capability flags to the runtime manifest (`capabilities.identityMode`, `capabilities.profileApi`, `capabilities.orderLinking`, `capabilities.logoutMode`) and gate with conformance checks.

Out of scope (explicitly)

- Native mobile authentication flows (requires a separate addendum: mobile OAuth flows + SDK token handling).
- “Global cart across brands” (cart remains per-site by design).
- Replacing all customer data systems; only the identity + essential profile surfaces are in scope.

Interfaces to commerce (must be specified in the Identity/SSO blueprint)

- Storefront endpoints (example naming, not prescriptive):
  - `GET /auth/login` → redirect to IdP with state/PKCE; optional `returnTo` stored server-side and validated as a relative path.
  - `GET /auth/callback` → code exchange + set first-party session cookie; validate `state`/`nonce` and `initiatingSessionId`.
  - `POST /auth/logout` → clear session + optional IdP logout.
  - `GET /api/me` → return logged-in customer profile (or 401).
- Data model:
  - `Customer` record keyed by `internalCustomerId`.
  - Optional `CustomerStripeMapping` keyed by `internalCustomerId` storing `stripeCustomerId`.
- Checkout integration:
  - If authenticated, checkout attaches the correct Stripe Customer (`stripeCustomerId`) and persists both identifiers on the order.

Product semantics (must be explicitly decided in the Identity/SSO blueprint)

- Logout semantics (platform standard): `capabilities.logoutMode=local_plus_idp`.
  - Logging out on Storefront A logs out there and also triggers IdP logout (ends SSO), but does not forcibly clear Storefront B’s first-party session cookie (it expires naturally).
  - “Global logout everywhere” requires additional work (logout propagation or short session TTLs) and should be treated as a follow-up decision if needed.
- Guest → account linking for order history (platform standard): `capabilities.orderLinking=explicit_claim`.
  - Baseline rule: do not automatically attach historical guest orders to an account purely by email match (to avoid accidental linking and cross-customer data leakage).
  - Provide an explicit claim/linking flow (for example: claim link in confirmation email, or order-number-based claim that proves control of the email address).

Definition of done (for sign-off)

- Cross-storefront SSO works (multi‑TLD): user logs in on Storefront A; on Storefront B, clicking “Log in” completes without a credential prompt when the IdP session is active (no shared cookies).
- Redirect reliability is validated in real browsers: chosen callback method + SameSite policy works for OIDC, email deep links, and post-auth redirects.
- CSRF posture is enforced: state-changing routes under cookie auth are CSRF-protected and verified in tests.
- Identifier invariants hold: authenticated checkout always persists `internalCustomerId` + `stripeCustomerId` on the order and on Stripe metadata where applicable.
- Conformance test: authenticated checkout includes both identifiers; unauthenticated checkout includes neither (or explicit nulls consistently).
- Stripe mapping creation is idempotent under concurrent attempts (tested); duplicates are treated as no-op and do not create inconsistent customer linkage.
- Login CSRF is prevented: callback requires the initiating session/nonce and cannot be replayed into a different browser.
- Guest remains first-class: guest checkout works everywhere, with a safe, explicit linking mechanism for guest orders when a customer later creates/logs into an account.

10. One Stripe account standardization (Finance-grade requirements)
    10.1 Pricing source of truth (selected)

Selected (platform standard): Platform catalog is the source of truth. Stripe Price IDs may exist, but are treated as an implementation detail mapped from the catalog (not the canonical “product system”).

Non-negotiables:

the platform must compute authoritative totals server-side

pricing behavior must be consistent across runtimes (including Worker during shim)

10.2 Metadata policy (required, and currently incomplete)

Engineering notes: metadata builder doesn’t include shop_id / order_id today (metadata.ts line ~6).

Requirement: standardize metadata and ensure it is always present on Stripe objects:

shop_id, order_id, order_number, cart_id

internalCustomerId, stripeCustomerId (nullable)

environment, tax_mode, inventory_reservation_id

Stripe explicitly notes client_reference_id can be used to reconcile a Checkout Session with internal systems.
Stripe Docs
+1

10.3 Finance-grade reconciliation requires schema + pipeline changes

Engineering notes: order model stores deposit + sessionId but not totals/currency/charge/balance transaction ids (schema.prisma line ~33).
Implication: finance reconciliation cannot be robust without schema + pipeline updates.

Minimum order fields to add/ensure:

amounts in minor units: subtotal/tax/shipping/discount/total

currency

Stripe ids: session, payment_intent, charge, balance_transaction, customer

payout linkage if you reconcile at payout level

Pipeline requirement:

webhook finalization reads authoritative amounts/ids from Stripe and stores them idempotently.

10.4 Tax & shipping policy (distinguish repo reality)

Repo reality:

Checkout uses static getTaxRate today (createSession.ts line ~130).

A TaxJar integration exists in the codebase (index.ts line ~4) but is not the same as “checkout uses TaxJar API.”

Stripe Tax is not currently the checkout calculation path.

Decision-grade tax modes (manifested via capabilities.taxMode)

static_rates (what checkout uses today)

taxjar_api (if you choose to use TaxJar API in checkout)

stripe_tax (if you adopt Stripe Tax)

custom (other engine)

Selected (platform standard): `capabilities.taxMode=stripe_tax` (keep `static_rates` as a transitional mode until Stripe Tax is implemented end-to-end).

Non-negotiable:

totals must be accurate and auditable in every mode

finance reporting must record tax/shipping amounts and the mode used

11. Worker divergence (strengthened and concrete)
    11.1 Exact divergence points (as referenced by engineering)

Worker route names don’t match the platform contract (cochlearfit-worker/index.ts around line ~340 and ~360 vs template-contract.md around line ~82).

The worker appears to use paths like /api/checkout/session and /api/stripe/webhook (slash-separated), while the platform contract uses /api/checkout-session and /api/stripe-webhook (dash-separated).

UI behavior: CheckoutPanel.tsx line ~39 redirects the user to the Checkout Session URL created by the worker.

Implication: this is contract divergence + UX divergence + lifecycle divergence.

11.2 Shim definition (to avoid “permanent shim” failure mode)

The shim must be defined as a compatibility layer with enforceable acceptance criteria—not an indefinite alternate commerce stack.

Shim non-negotiables:

- Emit the exact same analytics event taxonomy as platform runtimes (Section 4.4). If it cannot emit standard analytics, it fails the “standardization” goal even if routes are renamed.
- Apply the standard Stripe metadata keys (Section 10.2) so finance support and reconciliation work the same way.
- Declare its modes via manifest (`capabilities.paymentsMode`, `capabilities.webhooks`, `capabilities.taxMode`, `capabilities.inventoryMode`, plus identity flags like `capabilities.identityMode`, `capabilities.orderLinking`, and `capabilities.logoutMode` where applicable) so conformance tests can enforce behavior.

Recommended shim (enables shared UI reuse sooner):

- Add contract-compatible alias routes (dash-separated): `/api/cart`, `/api/checkout-session`, `/api/stripe-webhook`, implemented to match platform request/response shapes and error model.

Timebox + exit criteria:

- The shim is not “platform-compatible commerce.” It remains `platformCompatible=false` until it passes the same conformance tests as other runtimes.
- Set an explicit sunset milestone for the shim (date or sprint), after which the worker either becomes contract-compliant or is treated as a legacy exception with limited support.

12. Decisions selected (summary checklist)

Platform payments mode: `checkout_session_custom` (Checkout Sessions `ui_mode='custom'`).

Checkout + webhook runtime: Node (Edge only after a deliberate refactor and load verification).

Domain topology: multi‑TLD (confirmed) → shared accounts require SSO/OIDC.

Identity mode (target): `sso_oidc` (OIDC auth code + PKCE; per-storefront first-party sessions; user-initiated SSO).

Customer identity model: enforce `internalCustomerId` + `stripeCustomerId` everywhere; remove conflation.

Logout semantics: `local_plus_idp` (local logout + IdP logout; other storefront sessions expire).

Guest order linking: `explicit_claim` (do not auto-link guest orders to accounts by email match).

Pricing source of truth: platform catalog (Stripe Price IDs optional implementation detail).

Tax policy: target `stripe_tax` (keep `static_rates` as a transitional mode and manifest it).

Inventory: baseline `validate_only`, target `reserve_ttl` once a centralized hold authority exists.

Worker shim path normalization: add contract-compatible alias routes (dash-separated), timebox, then replace.

Native apps scope: out of scope for this blueprint; add a native addendum if required.

13. Migration plan (sequenced to reduce risk)

Principles

- Fix correctness before optimization.
- Ensure payments mode is consistent (no hybrid) before building finance reconciliation layers.
- Do not block payments standardization on distributed inventory locking.
- Timebox shims so they don’t become permanent.

Phase 0 — Stop failures + enforce the contract (urgent)

- Standardize runtime: Node for `/api/checkout-session` and `/api/stripe-webhook` (payments/webhooks are reliability-critical).
- Extend manifest with enforcement keys (commerce + identity): `capabilities.webhooks`, `capabilities.paymentsMode`, `capabilities.taxMode`, `capabilities.inventoryMode`, `capabilities.identityMode`, `capabilities.profileApi`, `capabilities.orderLinking`, `capabilities.logoutMode`.
- Webhook idempotency: processed-event store + return 2xx on duplicates. Status: implemented in platform core (`StripeWebhookEvent` store with 30-day cleanup).
- Order idempotency: treat unique constraint collisions as success (no-op) and prefer explicit upsert behavior.
- Stripe write idempotency: include idempotency keys on all Stripe writes and persist them with the checkout attempt.

Phase 1 — Resolve the Stripe hybrid (early; prerequisite for finance work)

- Choose `capabilities.paymentsMode` (recommended: `checkout_session_custom`).
- Implement `/api/checkout-session` and shared checkout UI to match that mode end-to-end (no Session→Intent ambiguity).
- Add checkout conformance tests gated by `capabilities.paymentsMode`.

Status (platform path): implemented as `checkout_session_custom` end-to-end in shared platform code and platform-compatible apps.

Phase 2 — Finance-grade reconciliation foundation

- Update metadata generation so required identifiers exist on Stripe objects (Section 10.2).
- Update order schema to store totals/currency and the Stripe IDs finance needs (Section 10.3).
- In webhook finalization, persist authoritative amounts/IDs idempotently.

Phase 3 — Inventory correctness (separate track; do not block Phase 1)

- Phase 3 baseline: `inventoryMode=validate_only` everywhere (platform + worker shim).
- Later: `inventoryMode=reserve_ttl` once you have a centralized hold mechanism that works across runtimes.
- Add inventory conformance tests gated by `capabilities.inventoryMode`.

Phase 4 — Identity platform (shared accounts; scoped)

- Replace mock customer auth with a shared, production identity surface.
- Multi‑TLD shared accounts (mandatory): deliver via Keycloak (OIDC IdP), then migrate storefronts to it; do not block Phases 0–2 on SSO rollout.
- Implement the web session + redirect contract (Section 9.5): session cookies `SameSite=Lax`, OIDC callback `response_mode=query`, and CSRF protections, so login works reliably across domains.

Phase 5 — Worker convergence (Shim then Replace; timeboxed)

- Shim acceptance criteria: standard analytics taxonomy (Section 4.4), standard Stripe metadata (Section 10.2), and webhook idempotency (Section 8).
- Recommended shim: add contract-compatible alias routes (dash-separated) that match platform request/response shapes so shared UI can reuse them.
- Current shim status: alias routes are in place and Stripe Checkout creation now stamps platform-aligned metadata keys (`shop_id`, `cart_id`, etc.) for reconciliation.
- Replace: migrate the worker stack onto the platform contract/runtime (or make the worker fully contract-compliant) and sunset the shim by an explicit milestone.

14. Success metrics (what “best-in-class” means in numbers)
    UX conversion + speed

Cart → checkout start rate

Checkout start → payment success rate

Time-to-buy (median / p90), mobile vs desktop

Error rate and recovery success rate

Ops / reliability

Webhook failure rate (near-zero)

Duplicate event rate (should not create errors or duplicate orders)

Refund/dispute handling time

Finance

% payouts reconciled automatically to orders

Reconciliation latency (payout → reconciled ledger)

Tax audit pass rate (correctness + traceability)

Platform maturity

% of sites passing cart/checkout/webhook conformance tests based on manifest claims

% of sites using shared UI components with no forks

Worker shim completion + replacement progress

15. Decision record (for leadership sign-off)

| Decision                                  | Selected                                                              | Owner | Date | Notes                                                              |
| ----------------------------------------- | --------------------------------------------------------------------- | ----- | ---- | ------------------------------------------------------------------ |
| Platform `capabilities.paymentsMode`      | `checkout_session_custom`                                             |       |      |                                                                    |
| Checkout/webhook runtime                  | `nodejs`                                                              |       |      |                                                                    |
| Domain topology (subdomains vs multi-TLD) | Multi‑TLD (confirmed)                                                 |       |      | Shared cookies impossible → SSO/OIDC required for shared accounts. |
| Cross-TLD shared accounts scope           | Dedicated Identity/SSO blueprint (mandatory); do not block Phases 0–2 |       |      |                                                                    |
| Native apps scope                         | Out of scope for this blueprint; add a native addendum if required    |       |      |                                                                    |
| `capabilities.identityMode`              | `sso_oidc` (target), `per_site` (transition)                          |       |      |                                                                    |
| IdP selection                             | Keycloak (self-hosted)                                                |       |      |                                                                    |
| `capabilities.profileApi`                | `true`                                                                |       |      |                                                                    |
| `capabilities.logoutMode`                | `local_plus_idp`                                                      |       |      |                                                                    |
| `capabilities.orderLinking`              | `explicit_claim`                                                      |       |      |                                                                    |
| Pricing source of truth                   | Platform catalog (Stripe Price IDs optional)                          |       |      |                                                                    |
| `capabilities.taxMode`                    | `stripe_tax` (target), `static_rates` (transition)                    |       |      |                                                                    |
| `capabilities.inventoryMode`              | `reserve_ttl` (target), `validate_only` (baseline)                    |       |      |                                                                    |
| Worker shim approach                      | Alias contract routes (dash-separated) + timebox, then replace        |       |      |                                                                    |

Appendix A — Repo-specific references (from engineering feedback)

Contract + manifest:

template-contract.md (line ~70 / ~82)

runtimeContractManifest.ts (line ~30 / ~64)

Stripe payments standard (`checkout_session_custom`):

Checkout Session creation (`ui_mode: custom` + session `client_secret`): createSession.ts

Custom Checkout confirmation (CheckoutProvider/useCheckout): CheckoutForm.tsx

Webhooks:

/api/stripe-webhook exists and is used: route.ts (line ~9 / ~8)

signature verification uses stripe.webhooks.constructEvent: route.ts (line ~16 / ~15)

Idempotency (now fixed):

checkout.session.completed handler: checkoutSessionCompleted.ts (line ~9)

Order creation idempotency: creation.ts (line ~44)

Unique constraint: schema.prisma @@unique([shop, sessionId]) (line ~68)

Processed event store: stripeWebhookEventStore.ts

Cookie:

\_\_Host-CART_ID: cartCookie.ts (line ~13)

Inventory:

cart uses sku.stock checks: cartApi.ts (line ~116)

Identity:

Cookie domain support: session.ts (line ~35)

SameSite=Strict: session.ts (line ~36)

Mock login: tenant route.ts (line ~20)

Stripe customer attachment uses `stripeCustomerId` (internal id is separate): createSession.ts (line ~350)

Finance schema gaps:

Metadata builder includes shop_id/order_id/internal_customer_id/stripe_customer_id: metadata.ts (line ~6)

Order model includes totals/Stripe ids: schema.prisma (line ~33)

Runtime standard:

Payments/webhooks: Node runtime (`runtime = "nodejs"`) for `/api/checkout-session` and `/api/stripe-webhook`.

Worker divergence:

Redirect behavior: CheckoutPanel.tsx (line ~39)

Worker path definitions: cochlearfit-worker/index.ts (line ~340, ~360)
