---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: caryina-axerve-payment-gateway
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-axerve-payment-gateway/plan.md
Trigger-Why: Banca Stabiese have offered the operator a commercially favourable rate via their Axerve/Fabrick Payment Orchestra gateway. Stripe integration is being replaced to take advantage of the agreement.
Trigger-Intended-Outcome: type: operational | statement: Caryina checkout processes payments through Axerve/GestPay (S2S or HPP — integration mode to be confirmed via DECISION task) instead of Stripe, with all checkout, success, and cancellation flows working end-to-end in sandbox and passing the existing test suite | source: operator
---

# Caryina Axerve Payment Gateway Fact-Find Brief

## Scope

### Summary

Replace the Stripe hosted-checkout integration in `apps/caryina` with Axerve/GestPay (SOAP API). The operator has a commercial agreement with Banca Stabiese using Axerve/Fabrick Payment Orchestra (formerly GestPay). The sandbox WSDL is `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`. Integration mode (S2S direct card processing or hosted payment page) is to be confirmed via a DECISION task; the plan defaults to HPP if unspecified.

**Critical architectural concern (see Open Questions):** The WSDL provided exposes `callPagamS2S`, a direct server-to-server card processing API that accepts raw card numbers (`cardNumber`, `expiryMonth`, `expiryYear`, `cvv`). This is architecturally different from Stripe's hosted checkout page — it places raw card data on the merchant's server and dramatically increases PCI DSS scope (SAQ D vs SAQ A). Axerve also offers a hosted payment page (HPP) that would maintain low PCI scope. Operator must confirm which integration mode to use before implementation can begin.

### Goals
- Replace `api/checkout-session/route.ts` Stripe call with Axerve SOAP `callPagamS2S` (or HPP equivalent)
- Replace `verifyStripeSession.ts` with Axerve payment verification
- Update success and cancellation redirect flows to match Axerve response format
- Add `node-soap` (or equivalent) SOAP client dependency to the monorepo
- Update `packages/config/src/env/payments.ts` to support `PAYMENTS_PROVIDER=axerve`
- All existing unit tests must pass; new unit tests required for Axerve client

### Non-goals
- Changing the cart, product, or order data model
- Any other shop or payment integration (Brikette, reception, etc.)
- Stripe webhook handling (Caryina does not currently implement it)
- Multi-currency support beyond EUR

### Constraints & Assumptions
- Constraints:
  - PCI DSS mode (S2S vs HPP) must be operator-confirmed before implementation (see Open Questions)
  - Axerve sandbox credentials (`shopLogin`, `apikey`) must be provided by operator before E2E testing
  - The SOAP client adds a new monorepo dependency — must be registered in the correct workspace package
  - `apps/caryina` runs on Cloudflare Pages (`runtime: "nodejs"` in the route) — no edge runtime constraint for the checkout route
- Assumptions:
  - The commercial agreement covers the sandbox environment for development and testing
  - EUR is the target currency (already hard-coded in Stripe integration)
  - Axerve uses ISO 4217 currency codes (confirmed — standard for GestPay)

## Outcome Contract

- **Why:** Banca Stabiese have offered the operator a commercially favourable rate via their Axerve/Fabrick Payment Orchestra gateway. Replacing Stripe reduces payment processing costs under the agreed rate.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina checkout processes payments through Axerve/GestPay S2S or HPP, with all checkout, success, and cancellation flows working end-to-end in sandbox and passing the existing test suite.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/checkout-session/route.ts` — POST handler; reads cart cookie → creates Stripe hosted session → returns `{sessionId, url}`. This is the primary backend replacement target.
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — client component; POSTs to `/api/checkout-session` → redirects browser to `data.url` (Stripe hosted page). Frontend involvement depends on integration mode.
- `apps/caryina/src/app/[lang]/success/page.tsx` — reads `?session_id=` query param → calls `verifyStripeSession()` → renders paid/unpaid UI. Param name will change with Axerve.
- `apps/caryina/src/lib/verifyStripeSession.ts` — calls `stripe.checkout.sessions.retrieve(sessionId)` → returns `{paid, amount, currency}`. Needs full replacement with Axerve equivalent.

### Key Modules / Files

- `apps/caryina/src/app/api/checkout-session/route.ts` — **full replacement** needed; currently 43 lines using `@acme/stripe`
- `apps/caryina/src/lib/verifyStripeSession.ts` — **full replacement** needed; currently verifies Stripe session, must be rearchitected for Axerve's response/verification flow
- `apps/caryina/src/app/[lang]/success/page.tsx` — **partial change** needed; `session_id` param name changes; verification function signature changes
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — **partial change** if S2S (needs card form); **minimal change** if HPP (still gets redirect URL, same flow)
- `apps/caryina/src/app/[lang]/cancelled/page.tsx` — static, no payment logic; no change needed
- `packages/config/src/env/payments.ts` — **update needed**; `PAYMENTS_PROVIDER` enum only accepts `"stripe"` (line 6 `z.enum(["stripe"])`); must add `"axerve"` and new Axerve env vars
- `packages/stripe/src/index.ts` — Stripe singleton with mock mode; Caryina uses this transitively via `@acme/platform-core`; will no longer be imported by Caryina after replacement
- `apps/caryina/src/app/api/checkout-session/route.test.ts` — existing test using jest mocks for `@acme/stripe`, `cartCookie`, `cartStore`; test structure is reusable but mock targets change

### Patterns & Conventions Observed

- **Runtime declaration**: `export const runtime = "nodejs"` in the checkout route — required for Cloudflare Pages, must be preserved in the replacement
- **Cart access pattern**: `CART_COOKIE` + `decodeCartCookie()` + `getCart()` from `@acme/platform-core` — unchanged, not Stripe-coupled
- **Error return pattern**: `NextResponse.json({ error: "..." }, { status: NNN })` with `i18n-exempt` comment — must follow same pattern
- **No Stripe webhook handler in Caryina**: Caryina does not implement `/api/webhooks/stripe` — payment verification is done by polling `verifyStripeSession` on the success page
- **SOAP precedent**: `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts` area and `parseAlloggiatiResponse.ts` use raw DOMParser XML (not a SOAP library) for the Alloggiati government API — same precedent could apply for Axerve but `node-soap` is more appropriate for WSDL-based operations

### Data & Contracts

- **Types/schemas/events:**
  - Current: `stripe.checkout.sessions.create()` returns `{id: string, url: string | null}` — caller uses `.url` for redirect
  - Current: `stripe.checkout.sessions.retrieve(sessionId)` returns `{payment_status: string, amount_total: number, currency: string}`
  - Axerve S2S `callPagamS2S` input: `shopLogin`, `uicCode` (currency ISO), `amount`, `shopTransactionId` (merchant ref), `cardNumber`, `expiryMonth`, `expiryYear`, `buyerName`, `buyerEmail`, `cvv`, and more
  - Axerve S2S `callPagamS2S` output: `TransactionResult` (OK/KO), `BankTransactionID`, `ShopTransactionID`, `AuthorizationCode`, `ErrorCode`, `ErrorDescription`
  - Auth: All Axerve S2S calls include `shopLogin` + `apikey` in the SOAP header/body

- **Persistence:**
  - No payment record persistence in Caryina currently — verification is stateless (session ID lookup)
  - Axerve will return a `BankTransactionID` — should be logged/stored for reconciliation if required

- **API/contracts:**
  - Axerve WSDL: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL` (18 operations)
  - Key operation: `callPagamS2S` (direct payment)
  - Auth method: `shopLogin` (merchant account ID) + `apikey` (secret key)
  - Protocol: SOAP 1.1 and SOAP 1.2, XML over HTTPS

### Dependency & Impact Map

- **Upstream dependencies (checkout route):**
  - `@acme/platform-core/cartCookie` — unchanged
  - `@acme/platform-core/cartStore` — unchanged
  - `@acme/stripe` — **removed** (transitive dep via platform-core; Caryina imports directly in this route)

- **Downstream dependents:**
  - `CheckoutClient.client.tsx` — depends on `POST /api/checkout-session` returning `{url}`; response shape is stable if HPP; changes significantly if S2S (needs card data in request)
  - `success/page.tsx` — depends on `?session_id=` param + `verifyStripeSession()` call

- **Likely blast radius:**
  - Contained within `apps/caryina` for all file changes
  - `packages/config/src/env/payments.ts` change affects all packages that import `paymentsEnv` — must verify no other package hardcodes `"stripe"` assumption
  - No other shop/app is affected; Stripe is used elsewhere (Brikette) independently

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (governed runner)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs --testPathPattern="checkout|verifyStripe"` (covers both checkout route and verification helper)
- CI integration: runs in reusable workflow

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Checkout session API | Unit (Jest) | `apps/caryina/src/app/api/checkout-session/route.test.ts` | Mocks `@acme/stripe`, `cartCookie`, `cartStore`; TC-01 (success 200 with `sessionId`+`url`), TC-04 (empty cart 400). **502 error path is NOT covered.** |
| Session verification | Unit (Jest) | `apps/caryina/src/lib/verifyStripeSession.test.ts` | Mocks `@acme/stripe`; TC-02 (paid session → `paid:true`, amount, currency), TC-03 (unpaid session → `paid:false`). Paid/unpaid status paths covered; exception/network-error behavior is not tested. |
| Cart API | Unit (Jest) | `apps/caryina/src/app/api/cart/route.test.ts` | Cart operations; not payment-coupled |
| Success page | None | — | No test found for `success/page.tsx` |
| CheckoutClient | None | — | Client component, no unit test found |

#### Coverage Gaps
- Untested paths:
  - `route.test.ts` TC-502 (Stripe/Axerve backend error → 502) — not covered; replacement test must add it
  - `success/page.tsx` — no test; out of scope for this task unless specifically requested
  - S2S card form on `CheckoutClient.client.tsx` (if S2S mode) — will need new tests
- Extinct tests:
  - `route.test.ts` mocks `@acme/stripe` — this mock becomes extinct; must be replaced with Axerve client mock
  - `verifyStripeSession.test.ts` — entire file becomes extinct; replacement is `verifyAxervePayment.test.ts`

#### Testability Assessment
- Easy to test: checkout route (same jest mock pattern, replace `@acme/stripe` mock with Axerve SOAP client mock)
- Hard to test: actual SOAP XML envelope correctness without a mock SOAP server
- Test seams needed: Axerve SOAP client must be mockable (injectable or mock-module pattern)

#### Recommended Test Approach
- Unit tests for: Axerve SOAP client wrapper (mock SOAP responses), updated checkout route (mock client), `verifyAxervePayment` replacement
- Integration tests for: end-to-end sandbox call (optional, requires sandbox credentials)
- E2E tests for: not required for this change
- Contract tests for: Axerve response shape validation

### Recent Git History (Targeted)

Not investigated.

## External Research

- **Axerve WSDL (fetched)**: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL` — 18 operations confirmed. `callPagamS2S` is the primary payment operation. Accepts raw card data: `cardNumber`, `expiryMonth`, `expiryYear`, `cvv`, `buyerName`, `buyerEmail`, `amount`, `uicCode` (currency), `shopTransactionId`. Returns `TransactionResult` (OK/KO), `BankTransactionID`, `ShopTransactionID`, `AuthorizationCode`, `ErrorCode`, `ErrorDescription`. — Axerve sandbox WSDL
- **No SOAP library in monorepo**: Confirmed via full search — no `node-soap`, `strong-soap`, or WSDL client package present anywhere. Closest precedent is raw DOMParser XML in `parseAlloggiatiResponse.ts`.
- **Axerve HPP**: Axerve offers a hosted payment page (iframe or redirect) in addition to S2S. HPP maintains SAQ A PCI scope (merchant never handles card data). S2S requires SAQ D.

## Questions

### Resolved

- Q: Is Axerve's SOAP API accessible from Cloudflare Pages/Workers?
  - A: Yes. The checkout route uses `runtime: "nodejs"` which runs in a Node.js context on Cloudflare Pages. HTTPS SOAP calls to external endpoints work in this runtime. No edge constraint.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts:7`

- Q: Does `@acme/stripe` need to stay in the monorepo?
  - A: Yes — `packages/stripe` is used by other packages (Brikette). Only Caryina's direct import in `checkout-session/route.ts` and `verifyStripeSession.ts` is being removed. `packages/stripe` itself is untouched.
  - Evidence: `packages/stripe/src/index.ts` (workspace package), monorepo `pnpm-workspace.yaml`

- Q: What SOAP library should be used?
  - A: `node-soap` is the standard choice for WSDL-based SOAP clients in Node.js. It reads the WSDL and generates typed bindings. The alternative (raw XML + DOMParser as used in `parseAlloggiatiResponse.ts`) is viable but error-prone for bidirectional SOAP with complex types. Recommendation: `node-soap` in a new wrapper `packages/axerve/` following the `packages/stripe/` pattern. This keeps Caryina's checkout route thin and testable.
  - Evidence: `parseAlloggiatiResponse.ts` precedent; `packages/stripe/src/index.ts` pattern

- Q: What changes are needed in `packages/config/src/env/payments.ts`?
  - A: The `PAYMENTS_PROVIDER` enum must add `"axerve"`. New env vars `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, and `AXERVE_SANDBOX` (boolean) must be added to the schema. Existing Stripe vars must remain for other apps that still use them.
  - Evidence: `packages/config/src/env/payments.ts:5-6`

- Q: Will S2S require a card input form on the checkout page?
  - A: Yes — if the operator confirms S2S mode, `CheckoutClient.client.tsx` must be extended with a card number, expiry, and CVV input form. The form data is then sent to the backend POST handler which calls Axerve's SOAP API. This is a significant UI addition. HPP mode keeps the current flow (redirect to Axerve's hosted page).
  - Evidence: Axerve WSDL `callPagamS2S` parameter list

- Q: Does the success page flow change?
  - A: Yes. Currently `/success?session_id=<stripe-session-id>` is used. With Axerve, the redirect from the payment page (HPP mode) or the response from the S2S call will carry different identifiers (`ShopTransactionID`, `BankTransactionID`). The param name and verification logic must change. For S2S, the verification is done inline in the POST handler (no redirect to Axerve page), so the success page query param may be replaced by a server-side response.

### Open (Operator Input Required)

- Q: **S2S direct card processing vs Axerve HPP (hosted payment page)?**
  - Why operator input is required: The commercial agreement with Banca Stabiese determines which integration mode the operator is licensed to use. The agent cannot determine this from the repository. The choice also reflects the operator's tolerance for PCI DSS scope: S2S (SAQ D) requires handling raw card numbers on the server and extensive PCI controls; HPP (SAQ A/A-EP) keeps card data on Axerve's page and requires minimal PCI controls.
  - Decision impacted: Architecture of `CheckoutClient.client.tsx` (card form required for S2S, redirect-only for HPP), `verifyAxervePayment` logic (inline response for S2S, async redirect verification for HPP), UI scope, PCI compliance obligations
  - Decision owner: Operator (Peter)
  - Default assumption (if any) + risk: **Default: HPP mode** — if no input is received, plan tasks will be written for HPP because it (a) has lower PCI scope, (b) is structurally closer to the current Stripe hosted-checkout flow (less code change), and (c) requires less frontend work. Risk: if the Banca Stabiese agreement only covers S2S, HPP tasks would need to be replanned.

- Q: **Axerve sandbox credentials** — `shopLogin` and `apikey` values for the sandbox environment?
  - Why operator input is required: Real credentials are needed for any E2E sandbox test. Without them, tests run against jest mocks only.
  - Decision impacted: Smoke tests, sandbox E2E validation
  - Decision owner: Operator (Peter)
  - Default assumption: E2E tests deferred until credentials provided; unit tests use mocked SOAP client. Risk: low — unit tests are sufficient for build gate.

## Confidence Inputs

- **Implementation: 80%**
  - Evidence: All files identified with exact locations and line counts. Replacement pattern is clear (thin SOAP client wrapper, route update, env update).
  - Raises to >=80: Already at 80. Blocked only by HPP vs S2S decision.
  - Raises to >=90: Operator confirms HPP mode (eliminates frontend card form uncertainty); sandbox credentials available.

- **Approach: 75%**
  - Evidence: HPP mode is architecturally sound and directly maps to existing Stripe redirect flow. `node-soap` in a new `packages/axerve/` package is a clean pattern matching `packages/stripe/`.
  - Raises to >=80: Operator confirms HPP mode.
  - Raises to >=90: WSDL parsed and typed bindings generated successfully in a spike.

- **Impact: 90%**
  - Evidence: Blast radius is well-scoped to `apps/caryina` + one shared config update. No other shop affected. Cart, product, and admin flows are completely isolated from payment logic.
  - Raises to >=90: Already at 90. Confidence is high that the scope is as described.

- **Delivery-Readiness: 80%**
  - Evidence: All files are identified, test patterns are established, and the replacement flow is clear. Blocked by one operator decision (HPP vs S2S).
  - Raises to >=80: Already at 80.
  - Raises to >=90: Operator confirms HPP mode and provides sandbox credentials for smoke test validation.

- **Testability: 75%**
  - Evidence: Existing test in `route.test.ts` demonstrates the jest mock pattern works well. `node-soap` supports mock clients via its test utilities.
  - Raises to >=80: Axerve client wrapper extracted into `packages/axerve/` with clean mock seam.
  - Raises to >=90: Sandbox credentials available for integration test.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| S2S mode confirmed → PCI DSS scope dramatically increases (SAQ D) | Medium | High | Default plan to HPP; flag PCI implications to operator before any S2S implementation begins |
| Axerve HPP redirect/callback URL shape differs from Stripe (success params) | Medium | Medium | WSDL inspection + sandbox test needed; plan tasks include a spike for HPP callback URL format |
| `node-soap` incompatible with Cloudflare Pages Node.js runtime | Low | High | Verify in a spike before committing; fallback is raw XML fetch (DOMParser pattern) |
| Axerve sandbox WSDL differs from production WSDL | Low | Medium | Use `AXERVE_SANDBOX` env var to switch base URL; verify with operator at go-live |
| `packages/config/src/env/payments.ts` change breaks other consumers | Low | Medium | Grep all importers of `paymentsEnv`; confirm Stripe vars remain non-breaking |
| Missing `shopTransactionId` uniqueness → duplicate transaction errors | Low | Low | Use cart ID or UUID as `shopTransactionId`; must be unique per transaction |

## Planning Constraints & Notes

- **Must-follow patterns:**
  - `export const runtime = "nodejs"` must remain on the checkout route
  - New `packages/axerve/` package follows `packages/stripe/` pattern (thin client, mock mode via env var)
  - Env var naming: `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_SANDBOX`
  - All `i18n-exempt` comments on API error strings must be preserved on replacements
  - ESLint physical-direction class rule: use `ms-*` not `ml-*` for any new UI additions

- **Rollout/rollback expectations:**
  - Feature-flag via `PAYMENTS_PROVIDER` env var: `stripe` (current) → `axerve`; rollback is reverting the env var
  - No DB migration required — payment flows are stateless in Caryina
  - Stripe keys stay in env for rollback capability; just unused when `PAYMENTS_PROVIDER=axerve`

- **Observability expectations:**
  - Log `BankTransactionID` and `ShopTransactionID` on successful payments (server log)
  - Log `ErrorCode` + `ErrorDescription` on SOAP errors
  - No analytics tracking changes required

## Suggested Task Seeds (Non-binding)

0. **DECISION**: Confirm integration mode — HPP (hosted payment page, SAQ A/A-EP PCI scope) vs S2S direct card processing (SAQ D PCI scope, raw card data on server, card form required). Default assumption: HPP. Tasks 3–5 are architected for HPP; if S2S confirmed, frontend scope (CheckoutClient card form) increases significantly.
1. **SPIKE**: Install `node-soap`, create `packages/axerve/` with SOAP wrapper, verify it builds and loads in Cloudflare Pages Node.js context
2. **IMPLEMENT**: Update `packages/config/src/env/payments.ts` — add `"axerve"` to `PAYMENTS_PROVIDER` enum + `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_SANDBOX` vars; update `docs/.env.reference.md`
3. **IMPLEMENT**: Replace `api/checkout-session/route.ts` — call Axerve HPP initiation via `packages/axerve/` client; return `{url}` for redirect (blocked by DECISION task if S2S)
4. **IMPLEMENT**: Replace `verifyStripeSession.ts` with `verifyAxervePayment.ts` — verify payment status from Axerve using `ShopTransactionID`; delete extinct `verifyStripeSession.test.ts`; add new test file
5. **IMPLEMENT**: Update `success/page.tsx` — change query param from `session_id` to Axerve `shopTransactionId`; update verification call
6. **IMPLEMENT**: Update `checkout-session/route.test.ts` — replace `@acme/stripe` mocks with Axerve client mocks; add 502 error case; remove extinct Stripe assertions
7. **CHECKPOINT**: Sandbox E2E smoke test — requires operator to provide `AXERVE_SHOP_LOGIN` + `AXERVE_API_KEY` sandbox credentials

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - All unit tests pass (no new failures in `apps/caryina` test suite)
  - `CheckoutClient.client.tsx` → `POST /api/checkout-session` → Axerve call → redirect to payment page works in dev
  - `verifyAxervePayment.ts` returns `{paid, amount, currency}` from Axerve response
  - `packages/config/src/env/payments.ts` accepts `PAYMENTS_PROVIDER=axerve`
  - `docs/.env.reference.md` updated with new Axerve env vars
- Post-delivery measurement plan: Sandbox manual test with operator-provided credentials; production go-live gated on credentials being set in Cloudflare

## Evidence Gap Review

### Gaps Addressed

- **SOAP API shape**: Fetched and parsed WSDL. `callPagamS2S` parameter list, auth mechanism, and response shape all confirmed.
- **Existing file scope**: All 4 Stripe-coupled files identified with exact paths and roles confirmed by reading full file contents.
- **No SOAP library**: Confirmed by monorepo-wide search — `node-soap` not present anywhere.
- **`payments.ts` constraint**: Confirmed line-level — `z.enum(["stripe"])` at line 6 of `packages/config/src/env/payments.ts`.
- **Blast radius**: Confirmed by reading `packages/stripe/src/index.ts` — other apps (Brikette) use Stripe independently; Caryina's changes are self-contained.
- **Test pattern**: Confirmed by reading `route.test.ts` — jest mock approach is applicable and reusable.

### Confidence Adjustments

- Implementation raised from 70% → 80% after confirming exact files and line-level evidence.
- Impact raised from 80% → 90% after confirming no Brikette payment coupling.
- Open question on S2S vs HPP is the primary remaining uncertainty, keeping Approach at 75%.

### Remaining Assumptions

- Axerve HPP is available under the Banca Stabiese agreement (default assumption if operator doesn't specify)
- `node-soap` loads correctly in Cloudflare Pages Node.js runtime (requires SPIKE task to confirm)
- Sandbox credentials will be provided by operator before E2E test task runs

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - **DECISION task (HPP vs S2S) blocks TASK-03 only** — TASK-01 (SPIKE) and TASK-02 (env config) can begin immediately without this decision. The plan will include a DECISION gate before the route replacement task. If the operator provides no input, HPP is the default and the plan proceeds under that assumption with a low-risk scope.
  - **Sandbox credentials** block TASK-07 (E2E smoke test) only — all preceding tasks run on jest mocks.
- Recommended next step:
  - `/lp-do-plan caryina-axerve-payment-gateway --auto`
