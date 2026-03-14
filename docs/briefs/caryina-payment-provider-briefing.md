---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: API
Created: 2026-03-11
Last-updated: 2026-03-11
Topic-Slug: caryina-payment-provider
---

# Caryina Payment Provider Briefing

## Executive Summary

Caryina currently runs an Axerve-only checkout flow. The shared payments env schema already supports both `stripe` and `axerve`, but Caryina does not read that selector anywhere. The prior Stripe implementation is recoverable from git history in-repo, principally from commit `168e8b65d1` and the follow-on removal commit `e9eee16459`.

## Questions Answered

- Q1: Is Stripe code still recoverable from git?
  - Yes. The Caryina Stripe checkout route, checkout client behavior, success-page verification flow, and tests are all recoverable from git history.
- Q2: Does the repo already support choosing a payment provider behind the scenes?
  - Partially. The config/env layer supports `PAYMENTS_PROVIDER=stripe|axerve`, but Caryina’s runtime code is hard-wired to Axerve.
- Q3: Where is the best refactor seam for dual plumbing?
  - `apps/caryina/src/lib/checkoutSession.server.ts` is the main backend seam. It already centralizes cart validation, idempotency, holds, payment invocation, and success/failure handling.

## High-Level Architecture

- Components:
  - `apps/caryina/src/app/api/checkout-session/route.ts` - thin route wrapper that delegates to server logic.
  - `apps/caryina/src/lib/checkoutSession.server.ts` - checkout orchestration for Caryina.
  - `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` - current Axerve-oriented checkout UI with direct card capture.
  - `apps/caryina/src/app/[lang]/success/page.tsx` - current generic success page.
  - `apps/caryina/src/app/admin/api/refunds/route.ts` - current Axerve-only refund endpoint.
  - `packages/config/src/env/payments.ts` - shared env schema with provider enum.
  - `packages/stripe/src/index.ts` - low-level Stripe client.
  - `packages/axerve/src/index.ts` - low-level Axerve client.

- Data stores / external services:
  - Cart cookie + cart store via `@acme/platform-core`.
  - Inventory hold lifecycle via `@acme/platform-core/inventoryHolds`.
  - Axerve SOAP S2S via `@acme/axerve`.
  - Stripe Checkout via `@acme/stripe` in historical Caryina code.

## End-to-End Flow

### Current primary flow
1. `/api/checkout-session` delegates directly to `handleCheckoutSessionRequest()`.
   - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts`
2. `handleCheckoutSessionRequest()` parses request JSON, loads the cart, applies idempotency, creates an inventory hold, then calls Axerve directly.
   - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
3. The payment call is hard-coded to `callPayment()` from `@acme/axerve`, with required card fields coming from the request body.
   - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
4. On success, inventory hold is committed, cart is cleared, emails are sent, and JSON `{ success: true, transactionId, amount, currency }` is returned.
   - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
5. The checkout client always renders a card form, posts PAN/CVV data to `/api/checkout-session`, and redirects to `/{lang}/success` only after a synchronous Axerve success response.
   - Evidence: `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`

### Historical Stripe flow
1. The checkout client posted only `{ lang }` to `/api/checkout-session`.
   - Evidence: git `168e8b65d1:apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
2. The route created a Stripe Checkout Session and returned `{ sessionId, url }`.
   - Evidence: git `168e8b65d1:apps/caryina/src/app/api/checkout-session/route.ts`
3. The browser redirected to the hosted Stripe URL.
   - Evidence: git `168e8b65d1:apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
4. The success page accepted `session_id`, verified payment status via Stripe, and rendered a paid / not-paid outcome.
   - Evidence: git `168e8b65d1:apps/caryina/src/app/[lang]/success/page.tsx`
5. Verification was encapsulated in `verifyStripeSession()`.
   - Evidence: git `168e8b65d1:apps/caryina/src/lib/verifyStripeSession.ts`

## Data & Contracts

- Current Axerve request contract:
  - Required request fields are `idempotencyKey`, `cardNumber`, `expiryMonth`, `expiryYear`, `cvv`.
  - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
- Current Axerve success contract:
  - Response body contains `success`, `transactionId`, `amount`, `currency`.
  - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
- Historical Stripe route contract:
  - Response body contained `sessionId` and `url`.
  - Evidence: git `168e8b65d1:apps/caryina/src/app/api/checkout-session/route.ts`

## Configuration, Flags, and Operational Controls

- Shared selector exists:
  - `PAYMENTS_PROVIDER` accepts `stripe` or `axerve`.
  - Evidence: `packages/config/src/env/payments.ts`
- Provider-specific validation exists:
  - Stripe env vars are enforced when `PAYMENTS_PROVIDER=stripe`.
  - Axerve env vars are enforced when `PAYMENTS_PROVIDER=axerve`.
  - Evidence: `packages/config/src/env/payments.ts`
- Caryina does not currently read `paymentsEnv` or `PAYMENTS_PROVIDER`.
  - Evidence: repo grep across `apps/caryina/src`
- Caryina local env example documents only Axerve variables, not Stripe or the provider selector.
  - Evidence: `apps/caryina/.env.example`

## Error Handling and Failure Modes

- Current Axerve flow has explicit idempotency, inventory hold release, and Axerve/network failure handling.
  - Evidence: `apps/caryina/src/lib/checkoutSession.server.ts`
- Current refund route is Axerve-only and fails closed when Axerve credentials are absent.
  - Evidence: `apps/caryina/src/app/admin/api/refunds/route.ts`
- Historical Stripe flow had no Caryina-specific idempotency/hold orchestration in the route itself; that sophistication was added later around the Axerve rewrite.
  - Evidence: git `168e8b65d1:apps/caryina/src/app/api/checkout-session/route.ts`, current `apps/caryina/src/lib/checkoutSession.server.ts`

## Tests and Coverage

- Current Caryina checkout route tests mock `@acme/axerve` only.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.test.ts`
- Historical Stripe checkout route tests are recoverable from git and were much simpler, focused on session creation and empty-cart behavior.
  - Evidence: git `88d4ae88ca:apps/caryina/src/app/api/checkout-session/route.test.ts`
- Historical checkout client tests for Stripe redirect are recoverable from git.
  - Evidence: git `e9eee16459^:apps/caryina/src/app/[lang]/checkout/CheckoutClient.test.tsx`

## Unknowns / Follow-ups

- Unknown: whether the desired provider selector is global (`PAYMENTS_PROVIDER`) or Caryina-specific.
  - How to verify: confirm whether other apps should remain unaffected by a Caryina-only switch, then inspect deployment env management for Caryina.
- Unknown: whether refunds must also support both providers on day one.
  - How to verify: inspect admin refund operational needs and confirm whether historical Stripe refunds were used for Caryina orders.
- Unknown: whether success-page verification should remain provider-specific or be normalized into a common order-confirmation contract.
  - How to verify: trace what post-payment guarantees are required for Caryina orders beyond analytics/UI copy.

## If You Later Want to Change This (Non-plan)

- Likely change points:
  - `apps/caryina/src/lib/checkoutSession.server.ts` should become provider-dispatch orchestration rather than Axerve-only logic.
  - `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` should render either hosted-checkout initiation or inline card capture based on a server-sourced provider mode.
  - `apps/caryina/src/app/[lang]/success/page.tsx` should support provider-specific verification behavior, likely by reintroducing Stripe verification behind an adapter.
  - `apps/caryina/src/app/admin/api/refunds/route.ts` likely needs the same provider dispatch if mixed historical orders will coexist.
- Key risks:
  - Reintroducing Stripe by reverting whole files would drop the newer idempotency and inventory-hold protections now living in `checkoutSession.server.ts`.
  - The old Stripe Caryina route was much thinner than the current Axerve orchestration, so restoration should copy behavior, not blindly restore files.
  - Mixed-provider operations create back-office ambiguity unless orders/refunds carry an explicit provider identifier.
