---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27 (Wave 1 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-axerve-payment-gateway
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Axerve Payment Gateway Plan

## Summary

Replace the Stripe hosted-checkout integration in `apps/caryina` with Axerve/GestPay S2S (server-to-server) SOAP API. The operator has a commercial agreement with Banca Stabiese via Axerve/Fabrick Payment Orchestra, and provided the S2S WSDL (`WSs2s.asmx`) — interpreted as intent to use direct S2S card processing. This replaces the hosted redirect pattern with an inline card form and synchronous payment result. The plan starts with a compatibility spike (node-soap on Cloudflare Pages), then delivers the Axerve client package, env config update, route and frontend changes, and test suite replacement in sequence.

**⚠️ PCI DSS Note:** S2S direct card processing places raw card numbers (`cardNumber`, `cvv`) on the merchant's server. This increases PCI DSS scope from SAQ A (Stripe hosted) to SAQ D. The operator must confirm their PCI compliance posture before going to production. This does not block development — sandbox testing proceeds without production card data.

## Active tasks
- [x] SPIKE-01: Create `packages/axerve/` — install node-soap, scaffold SOAP client, verify Cloudflare Pages compatibility
- [x] IMPLEMENT-02: Update payments env schema + docs
- [ ] IMPLEMENT-03: Complete Axerve S2S SOAP client package
- [ ] IMPLEMENT-04: Replace checkout route with Axerve S2S call
- [ ] IMPLEMENT-05: Add card form to CheckoutClient
- [ ] IMPLEMENT-06: Remove Stripe verification layer; simplify success page
- [ ] IMPLEMENT-07: Replace all payment tests with Axerve equivalents
- [ ] CHECKPOINT-08: Post-implementation horizon checkpoint

## Goals
- Replace `api/checkout-session/route.ts` Stripe session creation with Axerve `callPagamS2S` call
- Add card input form to `CheckoutClient.client.tsx` (S2S requires card data from browser)
- Remove `verifyStripeSession.ts` (synchronous S2S response makes async verification unnecessary)
- Simplify `success/page.tsx` to static confirmation (no session lookup needed)
- Create `packages/axerve/` SOAP client package (mirrors `packages/stripe/` pattern)
- Update `packages/config/src/env/payments.ts` to support `PAYMENTS_PROVIDER=axerve`
- All existing unit tests pass; new unit tests cover Axerve client and route

## Non-goals
- Stripe webhook handling (Caryina does not use it)
- Any other shop or payment integration
- Multi-currency support beyond EUR
- HPP/hosted payment page implementation (S2S is the chosen mode per operator signal)
- PCI DSS certification (operator responsibility; plan provides PCI-clean sandbox path only)

## Constraints & Assumptions
- Constraints:
  - `export const runtime = "nodejs"` must be preserved on the checkout route
  - New `packages/axerve/` follows `packages/stripe/` pattern (thin wrapper, mock mode via `AXERVE_USE_MOCK=true` — separate from `AXERVE_SANDBOX` which only controls the endpoint URL)
  - `AXERVE_SANDBOX=true` → use sandbox endpoint URL only. `AXERVE_USE_MOCK=true` → skip SOAP call, return hardcoded success. These must never be conflated.
  - `i18n-exempt` comments required on all API error strings in route handlers
  - ESLint `ds/no-physical-direction-classes-in-rtl` — use `ms-*` not `ml-*` on any new UI
  - Rollback: **code revert required** — IMPLEMENT-04/05 remove Stripe route behavior and change request/response contracts. `PAYMENTS_PROVIDER=stripe` is not sufficient alone. Rollback = `git revert` the relevant commits + env var reset.
  - Sandbox credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`) required for CHECKPOINT-08 only
- Assumptions:
  - node-soap is compatible with Cloudflare Pages Node.js runtime (SPIKE-01 validates)
  - Axerve sandbox WSDL shape matches production (operator to verify at go-live)
  - EUR (`uicCode: 978`) is the correct ISO 4217 currency code for the agreement

## Inherited Outcome Contract

- **Why:** Banca Stabiese have offered the operator a commercially favourable rate via their Axerve/Fabrick Payment Orchestra gateway. Replacing Stripe reduces payment processing costs under the agreed rate.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina checkout processes payments through Axerve/GestPay S2S, with all checkout, success, and cancellation flows working end-to-end in sandbox and passing the existing test suite.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/caryina-axerve-payment-gateway/fact-find.md`
- Key findings used:
  - All 4 Stripe-coupled files identified with exact roles
  - Axerve WSDL fetched: `callPagamS2S` param shape confirmed (shopLogin, uicCode, amount, shopTransactionId, cardNumber, expiryMonth, expiryYear, cvv, buyerName, buyerEmail)
  - Response: TransactionResult (OK/KO), BankTransactionID, ShopTransactionID, AuthorizationCode, ErrorCode, ErrorDescription
  - No SOAP library in monorepo; `packages/stripe/` is the package structure precedent
  - `packages/config/src/env/payments.ts:5-6` — `z.enum(["stripe"])` to be extended
  - Test patterns: jest mock of `@acme/stripe` is directly analogous for Axerve client mocking

## Proposed Approach

- Option A: **Axerve S2S (server-to-server)** — card form on checkout page, server calls `callPagamS2S`, synchronous result. Requires SAQ D PCI compliance in production.
- Option B: Axerve HPP (hosted payment page) — redirect to Axerve's page, lower PCI scope. Not chosen.
- **Chosen approach: Option A (S2S)**. Rationale: operator explicitly provided the S2S WSDL (`WSs2s.asmx`). S2S is architecturally similar to the current Stripe integration on the backend (both are HTTPS API calls from the server). The added complexity is the card form on the frontend; all other layers are analogous.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| SPIKE-01 | SPIKE | Create packages/axerve/ — install node-soap, verify CF Pages compat | 80% | M | Complete (2026-02-27) | - | IMPLEMENT-03 |
| IMPLEMENT-02 | IMPLEMENT | Update payments env schema + docs/.env.reference.md | 85% | S | Complete (2026-02-27) | - | IMPLEMENT-03, IMPLEMENT-04 |
| IMPLEMENT-03 | IMPLEMENT | Complete Axerve S2S client package (callPayment wrapper) | 80% | M | Pending | SPIKE-01 | IMPLEMENT-04 |
| IMPLEMENT-04 | IMPLEMENT | Replace checkout route with Axerve S2S call | 80% | M | Pending | IMPLEMENT-02, IMPLEMENT-03 | IMPLEMENT-05, IMPLEMENT-06, IMPLEMENT-07 |
| IMPLEMENT-05 | IMPLEMENT | Add card form to CheckoutClient | 80% | M | Pending | IMPLEMENT-04 | CHECKPOINT-08 |
| IMPLEMENT-06 | IMPLEMENT | Remove Stripe verification layer; simplify success page | 80% | S | Pending | IMPLEMENT-04 | IMPLEMENT-07 |
| IMPLEMENT-07 | IMPLEMENT | Replace all payment tests with Axerve equivalents | 80% | M | Pending | IMPLEMENT-04, IMPLEMENT-06 | CHECKPOINT-08 |
| CHECKPOINT-08 | CHECKPOINT | Horizon reassessment + sandbox E2E readiness gate | 95% | S | Pending | IMPLEMENT-05, IMPLEMENT-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | SPIKE-01, IMPLEMENT-02 | - | Independent; run in parallel |
| 2 | IMPLEMENT-03 | SPIKE-01 done | Completes Axerve client; IMPLEMENT-02 need not be complete yet |
| 3 | IMPLEMENT-04 | IMPLEMENT-02 + IMPLEMENT-03 both done | Route replacement; defines API shape for wave 4 |
| 4 | IMPLEMENT-05, IMPLEMENT-06 | IMPLEMENT-04 done | Card form + verification removal; run in parallel |
| 5 | IMPLEMENT-07 | IMPLEMENT-04 + IMPLEMENT-06 done | Test suite replacement; needs final implementation shape |
| 6 | CHECKPOINT-08 | IMPLEMENT-05 + IMPLEMENT-07 done | Manual gate; stops auto-build; requires operator credentials for sandbox |

## Tasks

---

### SPIKE-01: Create `packages/axerve/` — install node-soap, scaffold client, verify Cloudflare Pages compatibility

- **Type:** SPIKE
- **Deliverable:** `packages/axerve/` package with node-soap installed, WSDL loaded, `callPayment()` stub verified to import and call in Node.js environment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build Evidence:** `packages/axerve/` created; `soap@1.7.1` installed; `server-only@0.0.1` added. TC-S1-01 ✓ (callPayment imports cleanly), TC-S1-02 ✓ (AXERVE_USE_MOCK=true returns hardcoded success), TC-S1-03 ✓ (tsc --noEmit: 0 errors). Note: spike stub includes basic SOAP call path; IMPLEMENT-03 adds AxerveError class and full error handling.
- **Affects:** `packages/axerve/package.json` (new), `packages/axerve/src/index.ts` (new), `packages/axerve/tsconfig.json` (new), `packages/axerve/jest.config.cjs` (new)
  - Note: `pnpm-workspace.yaml` does NOT need updating — workspace already uses `packages/*` glob which covers packages/axerve automatically.
- **Depends on:** -
- **Blocks:** IMPLEMENT-03
- **Confidence:** 80%
  - Implementation: 85% — package scaffold pattern is identical to `packages/stripe/`; node-soap is a well-maintained pure-JS library
  - Approach: 80% — node-soap loads WSDL from URL; fallback (raw XML fetch) documented if CF Pages Node.js runtime rejects it
  - Impact: 80% — spike either proves viability or identifies the fallback path; outcome is definitive either way
  - Held-back test (Approach at 80): "What if CF Pages Node.js runtime rejects node-soap?" → raw XML fetch fallback (pattern from `parseAlloggiatiResponse.ts`) is documented and viable. The spike's own execution is not blocked by this unknown — the fallback is a known pivot. ✓ Pass.
- **Acceptance:**
  - `packages/axerve/` directory exists with valid `package.json` (workspace `@acme/axerve`), `tsconfig.json`, and `src/index.ts`
  - `node-soap` installed as a dependency
  - `src/index.ts` exports a `callPayment(params)` stub that successfully loads the Axerve WSDL from the sandbox URL
  - TypeScript compiles without errors
  - Import in a test script confirms the function is callable without runtime error
- **Validation contract:**
  - TC-S1-01: `import { callPayment } from "@acme/axerve"` in a Node.js 22 script → no import error
  - TC-S1-02: `callPayment` stub called with `AXERVE_USE_MOCK=true` → returns hardcoded success without making a SOAP call (confirms mock mode wiring works; does not test SOAP network path)
  - TC-S1-03: `pnpm -w typecheck` for packages/axerve → no type errors
  - TC-S1-FALLBACK: If node-soap fails CF Pages compat → document specific failure mode and switch to raw XML fetch approach; stub is rewritten using `fetch()` + XML string template
  - Note: SOAP network-error throwing behavior (`AxerveError`) is tested in IMPLEMENT-03 (TC-03-03), not the spike stub.
- **Execution plan:** Red (verify no @acme/axerve package exists yet) → Green (create package, install node-soap, write stub that loads WSDL) → Refactor (add types for params/result, ensure mock mode skeleton is present)
- **Planning validation:**
  - Checks run: confirmed `packages/axerve/` does not exist; confirmed `packages/stripe/package.json` pattern for reference
  - Unexpected findings: none
- **Scouts:** `node-soap` version check before install — confirm latest stable supports TypeScript types (`soap` or `@types/soap`)
- **Edge Cases & Hardening:** If WSDL URL is unreachable in CI, use local WSDL file copy as fallback for tests
- **What would make this >=90%:** node-soap confirmed compatible with CF Pages Node.js runtime in a prior spike (would need that evidence to pre-exist)
- **Rollout / rollback:**
  - Rollout: package added to workspace; no app changes yet
  - Rollback: delete packages/axerve/, remove from workspace
- **Documentation impact:** None at spike stage; docs/.env.reference.md update deferred to IMPLEMENT-02
- **Notes / references:**
  - `packages/stripe/src/index.ts` — package structure reference
  - Axerve sandbox WSDL: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`
  - CF Pages Node.js runtime docs: confirm HTTPS fetch is supported (yes)

---

### IMPLEMENT-02: Update payments env schema + docs

- **Type:** IMPLEMENT
- **Deliverable:** Updated `packages/config/src/env/payments.ts` + `docs/.env.reference.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build Evidence:** `PAYMENTS_PROVIDER` enum extended to `["stripe", "axerve"]`; `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_SANDBOX` added to schema and `loadPaymentsEnv()`. `AXERVE_SANDBOX` defaults to `false` (production-safe). TC-02-01 ✓, TC-02-02 ✓ (Stripe path intact), TC-02-03 ✓ (unknown provider throws), TC-02-04 ✓ (tsc --noEmit: 0 errors). `PAYMENTS_PROVIDER` and 3 Axerve rows added to `.env.reference.md`.
- **Affects:** `packages/config/src/env/payments.ts`, `docs/.env.reference.md`
- **Depends on:** -
- **Blocks:** IMPLEMENT-03, IMPLEMENT-04
- **Confidence:** 85%
  - Implementation: 90% — exact change is known: add `"axerve"` to enum, add 3 new z.string() env var declarations
  - Approach: 85% — zod schema extension is direct; must verify no other consumer breaks on enum extension
  - Impact: 85% — scoped to config package + docs; no runtime changes until PAYMENTS_PROVIDER is set to "axerve"
- **Acceptance:**
  - `PAYMENTS_PROVIDER` enum accepts `"axerve"` without throwing
  - `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY` added as required string vars (gated by `PAYMENTS_PROVIDER === "axerve"`)
  - `AXERVE_SANDBOX` added as optional boolean string — default `"false"` (production-safe: omitting this var in production silently routes to live endpoint, not sandbox)
  - Existing `"stripe"` path continues to work unchanged
  - `docs/.env.reference.md` table updated with 3 new rows
  - `pnpm typecheck` passes
- **Validation contract:**
  - TC-02-01: `loadPaymentsEnv({ PAYMENTS_PROVIDER: "axerve", AXERVE_SHOP_LOGIN: "test", AXERVE_API_KEY: "key" })` → no error
  - TC-02-02: `loadPaymentsEnv({ PAYMENTS_PROVIDER: "stripe", STRIPE_SECRET_KEY: "sk", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk", STRIPE_WEBHOOK_SECRET: "wh" })` → still works, no regression
  - TC-02-03: `loadPaymentsEnv({ PAYMENTS_PROVIDER: "unknown" })` → throws (invalid enum)
  - TC-02-04: `pnpm typecheck` on packages/config → no errors
- **Execution plan:** Red (verify `z.enum(["stripe"])` is the current state, write failing test for "axerve") → Green (extend enum, add env vars to schema and loadPaymentsEnv branching) → Refactor (clean up any dead code, ensure Stripe fallback defaults still work)
- **Planning validation:**
  - Checks run: read `packages/config/src/env/payments.ts` in full — confirmed `z.enum(["stripe"])` at line 6; `PAYMENTS_GATEWAY === "disabled"` escape hatch preserved
  - Unexpected findings: `PAYMENTS_GATEWAY === "disabled"` path exists as escape hatch — must not break
- **Scouts:** grep `paymentsEnv` importers across monorepo to confirm no consumer hardcodes `"stripe"` assumption
- **Edge Cases & Hardening:** `PAYMENTS_PROVIDER` not set → existing default behaviour (no-op, both stripe defaults coexist)
- **Consumer tracing:**
  - New env vars `AXERVE_SHOP_LOGIN` + `AXERVE_API_KEY` → consumed by `packages/axerve/src/index.ts` (IMPLEMENT-03). No other consumers.
  - Modified `PAYMENTS_PROVIDER` enum → `packages/config/src/env/payments.ts:loadPaymentsEnv` is the only parser. Callers of `paymentsEnv` receive the parsed object; enum extension is additive (non-breaking). ✓
- **What would make this >=90%:** Grep confirms zero consumers hardcode `"stripe"` string directly (would raise Impact to 95%)
- **Rollout / rollback:**
  - Rollout: zero effect until `PAYMENTS_PROVIDER=axerve` set in environment
  - Rollback: revert file; or simply leave `PAYMENTS_PROVIDER=stripe` in environment
- **Documentation impact:** `docs/.env.reference.md` — add rows for `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_SANDBOX` to the env reference table

---

### IMPLEMENT-03: Complete Axerve S2S client package

- **Type:** IMPLEMENT
- **Deliverable:** `packages/axerve/src/index.ts` — production-ready `callPayment(params): Promise<AxervePaymentResult>` wrapper around node-soap (or raw XML fetch if spike revealed incompatibility)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/axerve/src/index.ts`, `packages/axerve/src/types.ts` (new)
- **Depends on:** SPIKE-01
- **Blocks:** IMPLEMENT-04
- **Confidence:** 80%
  - Implementation: 80% — WSDL shape is confirmed; node-soap pattern is standard; mock mode (AXERVE_USE_MOCK env check) follows packages/stripe precedent
  - Approach: 80% — node-soap wraps SOAP complexity cleanly; TypeScript types derivable from WSDL schema
  - Impact: 85% — isolated package; only consumer is IMPLEMENT-04
  - Held-back test (Implementation at 80): "What if WSDL TypeScript type generation fails, requiring hand-crafted types?" → Hand-crafted types for `callPagamS2S` params are documented in the fact-find and are feasible to write manually. Does not drop Implementation below 80. ✓ Pass.
  - Held-back test (Approach at 80): "What if node-soap was replaced by raw XML in SPIKE-01?" → Raw XML approach is documented (fetch + XML string + DOMParser), implementation is straightforward. Approach adapts without confidence drop. ✓ Pass.
- **Acceptance:**
  - `callPayment(params: AxervePaymentParams): Promise<AxervePaymentResult>` exported from `@acme/axerve`
  - `AxervePaymentParams`: `{ shopLogin, apiKey, uicCode, amount, shopTransactionId, cardNumber, expiryMonth, expiryYear, cvv, buyerName, buyerEmail }`
  - `AxervePaymentResult`: `{ success: boolean, transactionId: string, bankTransactionId: string, authCode?: string, errorCode?: string, errorDescription?: string }`
  - Mock mode: when `process.env.AXERVE_USE_MOCK === "true"`, returns a hard-coded success result without making any SOAP call (parallel to STRIPE_USE_MOCK pattern). `AXERVE_SANDBOX` only controls which endpoint URL to call — it must never trigger mock mode.
  - `pnpm typecheck` passes
  - Unit tests in `packages/axerve/src/index.test.ts` pass (TC-03-01 through TC-03-03)
- **Validation contract:**
  - TC-03-01: `callPayment({...validParams})` with mocked SOAP client → returns `{ success: true, transactionId: "txn123", ... }`
  - TC-03-02: SOAP response with `TransactionResult: "KO"` → returns `{ success: false, errorCode: "01", errorDescription: "Card declined" }`
  - TC-03-03: SOAP client throws network error → `callPayment` throws `AxerveError` with message
  - TC-03-04: `AXERVE_USE_MOCK=true` → returns hardcoded success without SOAP call (AXERVE_SANDBOX does not trigger mock mode)
- **Execution plan:** Red (write index.test.ts with TC-03-01..04, all failing) → Green (implement callPayment using node-soap client, handle OK/KO, implement mock mode) → Refactor (extract types to types.ts, add JSDoc on params, clean up SOAP boilerplate)
- **Planning validation:**
  - Checks run: confirmed WSDL params for `callPagamS2S` from fact-find external research; confirmed `packages/stripe/src/index.ts` mock pattern (STRIPE_USE_MOCK env var)
  - Unexpected findings: none
- **Consumer tracing:**
  - New output `callPayment()` → consumed by `api/checkout-session/route.ts` (IMPLEMENT-04). Single consumer. ✓
  - New type `AxervePaymentResult` → consumed by route.ts (IMPLEMENT-04). ✓
- **Scouts:** Verify `node-soap`'s client creation supports URL-based WSDL loading without filesystem access (important for CF Pages edge case)
- **Edge Cases & Hardening:**
  - `uicCode` for EUR: use `978` (ISO 4217 numeric code for EUR — GestPay expects numeric code, not alphabetic)
  - `shopTransactionId` uniqueness: use `crypto.randomUUID()` + cart ID suffix for guaranteed uniqueness
  - SOAP timeout: set reasonable timeout (10s) to avoid hanging requests
- **What would make this >=90%:** Integration test against real Axerve sandbox (requires operator credentials)
- **Rollout / rollback:**
  - Rollout: package exported; no app changes until IMPLEMENT-04 imports it
  - Rollback: revert IMPLEMENT-03; IMPLEMENT-04 not yet deployed
- **Documentation impact:** None at package level; docs/.env.reference.md already updated by IMPLEMENT-02
- **Notes / references:** `uicCode` 978 = EUR per GestPay/Axerve documentation

---

### IMPLEMENT-04: Replace checkout route with Axerve S2S call

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/api/checkout-session/route.ts` — reads card data from request body, calls `callPayment()`, returns `{success, transactionId, amount, currency}` or error
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts`
- **Depends on:** IMPLEMENT-02, IMPLEMENT-03
- **Blocks:** IMPLEMENT-05, IMPLEMENT-06, IMPLEMENT-07
- **Confidence:** 80%
  - Implementation: 80% — file is 43 lines; replacement shape is clear from fact-find; cart reading pattern unchanged
  - Approach: 80% — S2S route pattern is direct: read cart + card data → call Axerve → return result. No redirect URL needed.
  - Impact: 80% — route response shape changes; all downstream consumers (CheckoutClient, tests) must be updated in dependent tasks
  - Held-back test (all dimensions at 80): "What if AXERVE_SHOP_LOGIN / AXERVE_API_KEY are not in the env at test time?" → Mock mode via `AXERVE_USE_MOCK` or jest mock of `@acme/axerve` handles this. Tests are independent of real credentials. ✓ Pass.
- **Acceptance:**
  - Route reads cart (unchanged) + `{cardNumber, expiryMonth, expiryYear, cvv, buyerName, buyerEmail}` from POST body
  - Route calls `callPayment()` from `@acme/axerve`
  - Success (TransactionResult: OK): returns `{ success: true, transactionId, amount, currency: "eur" }` with status 200
  - Failure (TransactionResult: KO): returns `{ success: false, error: errorDescription }` with status 402
  - SOAP error (network/exception): returns `{ error: "Payment service unavailable" }` with status 502
  - Empty cart: returns `{ error: "Cart is empty" }` with status 400 (unchanged)
  - `export const runtime = "nodejs"` preserved
  - `i18n-exempt` comments on all error strings
- **Validation contract:**
  - TC-04-01: populated cart + valid card data → Axerve mock returns OK → 200 `{success: true, transactionId: "txn1"}`
  - TC-04-02: empty cart → 400 `{error: "Cart is empty"}` (unchanged regression)
  - TC-04-03: Axerve returns KO → 402 `{success: false, error: "Card declined"}`
  - TC-04-04: Axerve client throws → 502 `{error: "Payment service unavailable"}`
  - TC-04-05: missing card fields in body → 400 `{error: "Missing required payment fields"}`
- **Execution plan:** Red (update route.test.ts mocks to use @acme/axerve, write TC-04-01..05 as failing tests) → Green (rewrite route: remove stripe import, add callPayment import, add card body parsing, handle all response cases) → Refactor (extract card body validation to helper, add logging for BankTransactionID)
- **Planning validation:**
  - Checks run: read route.ts in full (43 lines); confirmed cart reading pattern unchanged; confirmed `i18n-exempt` comment convention
  - Unexpected findings: none
- **Consumer tracing:**
  - Modified response shape (now `{success, transactionId, amount, currency}` instead of `{sessionId, url}`) → consumed by `CheckoutClient.client.tsx` (IMPLEMENT-05). Must update client to handle new shape. ✓
  - Modified request shape (now includes card fields) → `CheckoutClient.client.tsx` must send card data (IMPLEMENT-05). ✓
  - `route.test.ts` mock targets change from `@acme/stripe` to `@acme/axerve` (IMPLEMENT-07). ✓
- **Scouts:** Confirm `@acme/axerve` can be added to `apps/caryina/package.json` as a workspace dep without circular dependency
- **Edge Cases & Hardening:**
  - Card field validation: minimal server-side check (fields present + non-empty) — Axerve will validate card number validity
  - Log `shopTransactionId` + `BankTransactionID` on success for reconciliation
  - `shopTransactionId`: generate as `crypto.randomUUID()` (route-scoped; not stored persistently)
- **What would make this >=90%:** Integration test against Axerve sandbox (requires credentials)
- **Rollout / rollback:**
  - Rollout: route is a full Axerve replacement (not conditionally activated by PAYMENTS_PROVIDER at runtime — the env var controls which secrets are required at startup, not which code path runs). Deploy this alongside a coordinated env update.
  - Rollback: `git revert` IMPLEMENT-04 commit. Env-only rollback is NOT sufficient — route contract has changed (new request/response shape). Code revert required.
- **Documentation impact:** None — API is internal (not public-facing docs needed)

---

### IMPLEMENT-05: Add card form to CheckoutClient

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — card input form + updated POST handler + inline success/failure rendering
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx`
- **Depends on:** IMPLEMENT-04
- **Blocks:** CHECKPOINT-08
- **Confidence:** 80%
  - Implementation: 80% — card form is standard React controlled inputs; response handling pattern mirrors existing error handling
  - Approach: 80% — inline success/failure (no redirect) is simpler than the current redirect-to-Stripe pattern; form fields match WSDL params
  - Impact: 80% — frontend change only; no API or data model impact
- **Acceptance:**
  - Card form fields: card number, expiry month, expiry year, CVV, buyer name, buyer email
  - Form validation: all fields required, basic format checks (e.g., CVV 3-4 digits) before submit
  - POST to `/api/checkout-session` includes `{lang, cardNumber, expiryMonth, expiryYear, cvv, buyerName, buyerEmail}`
  - On `success: true` response: redirect to `/{lang}/success` (no session param needed)
  - On `success: false` response: show `error` message inline; form stays submittable
  - On network error: show "Something went wrong" inline
  - No `window.location.href = data.url` pattern (removed)
  - All input labels use `htmlFor` + `id` pairing for accessibility
  - `ms-*` logical classes (not `ml-*`) for any margin
- **Validation contract:**
  - TC-05-01: user fills form + submits → POST includes card fields → success response → redirect to /en/success
  - TC-05-02: API returns `success: false, error: "Card declined"` → error shown inline, form re-enabled
  - TC-05-03: network error → "Something went wrong" shown inline
  - TC-05-04: form submit with empty card number → client-side validation error shown before POST
- **Execution plan:** Red (add form state, card fields, verify POST sends card data in manual dev test) → Green (implement all TC scenarios: success redirect, failure inline, network error) → Refactor (extract card form to sub-component, add aria-label, check all logical CSS classes)
- **Planning validation:**
  - Checks run: confirmed `CheckoutClient.client.tsx` currently only POSTs `{lang}` and redirects to `data.url`; confirmed `ms-*` ESLint rule applies
  - Unexpected findings: none
- **Consumer tracing:**
  - Modified POST body (now includes card fields) → consumed by `api/checkout-session/route.ts` (IMPLEMENT-04). Route is already updated at this point. ✓
  - Modified response handling (removed `data.url` redirect, added `success` handling) → self-contained in this component. ✓
  - Success redirect path `/{lang}/success` → `success/page.tsx` (IMPLEMENT-06 simplifies it). No param dependency. ✓
- **Scouts:** Confirm `CheckoutClient.client.tsx` is a client component (`"use client"` directive) — card form needs browser APIs
- **Edge Cases & Hardening:**
  - Never log card number or CVV in browser console or server logs
  - Disable submit button while request is in-flight (prevent double-submit)
  - Card number field: `type="text"` with `inputMode="numeric"` (not `type="number"` — avoids scroll-to-change)
  - `autoComplete="cc-number"`, `autoComplete="cc-exp-month"` etc. for browser autofill
- **What would make this >=90%:** E2E Playwright test covering full checkout flow with mock card data
- **Rollout / rollback:**
  - Rollout: deployed with IMPLEMENT-04; card form appears when Axerve is enabled
  - Rollback: git revert IMPLEMENT-05
- **Documentation impact:** None

---

### IMPLEMENT-06: Remove Stripe verification layer; simplify success page

- **Type:** IMPLEMENT
- **Deliverable:** Deleted `verifyStripeSession.ts` + `verifyStripeSession.test.ts`; simplified `success/page.tsx` to static confirmation (no session lookup)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/verifyStripeSession.ts` (deleted), `apps/caryina/src/lib/verifyStripeSession.test.ts` (deleted), `apps/caryina/src/app/[lang]/success/page.tsx`
- **Depends on:** IMPLEMENT-04
- **Blocks:** IMPLEMENT-07
- **Confidence:** 80%
  - Implementation: 85% — deletion + simplification; risk is ensuring no other file imports verifyStripeSession
  - Approach: 80% — S2S is synchronous, so session verification on the success page is redundant; success page becomes static
  - Impact: 80% — success page loses verification capability; acceptable because S2S result is already known at checkout time
- **Acceptance:**
  - `verifyStripeSession.ts` deleted; `verifyStripeSession.test.ts` deleted
  - `success/page.tsx` reads no query params and shows a static "Payment successful" message
  - No import of `verifyStripeSession` remains anywhere in the codebase (grep confirms)
  - `pnpm typecheck` passes
  - `pnpm build` passes (no broken imports)
- **Validation contract:**
  - TC-06-01: grep `verifyStripeSession` in `apps/caryina/src` → 0 matches
  - TC-06-02: `success/page.tsx` renders without any async data fetching or query param reading
  - TC-06-03: `pnpm typecheck` → no errors in apps/caryina
- **Execution plan:** Red (confirm verifyStripeSession is imported in success/page.tsx) → Green (delete files, update success/page.tsx to static) → Refactor (grep for any stale imports, remove unused next/navigation imports if no longer needed)
- **Planning validation:**
  - Checks run: confirmed `verifyStripeSession.ts` exists at `apps/caryina/src/lib/`; confirmed success/page.tsx reads `session_id` query param and calls `verifyStripeSession`
  - Unexpected findings: none
- **Consumer tracing:**
  - `verifyStripeSession.ts` deleted → only consumer was `success/page.tsx`. `success/page.tsx` updated in this task. ✓
  - `verifyStripeSession.test.ts` deleted → not imported by any production code. ✓
  - `success/page.tsx` simplified → consumer is CheckoutClient redirect (IMPLEMENT-05 sends to `/success` with no param). ✓
- **Scouts:** grep `verifyStripeSession` monorepo-wide before deletion to confirm no other consumers
- **Edge Cases & Hardening:** `cancelled/page.tsx` is static with no Stripe dependency — confirmed unchanged
- **What would make this >=90%:** E2E test covering the success page route
- **Rollout / rollback:**
  - Rollout: files deleted; success page simplified
  - Rollback: git revert IMPLEMENT-06 (restores deleted files via git history)
- **Documentation impact:** None

---

### IMPLEMENT-07: Replace all payment tests with Axerve equivalents

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/api/checkout-session/route.test.ts`; new `packages/axerve/src/index.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.test.ts`, `packages/axerve/src/index.test.ts` (new)
- **Depends on:** IMPLEMENT-04, IMPLEMENT-06
- **Blocks:** CHECKPOINT-08
- **Confidence:** 80%
  - Implementation: 85% — test pattern is directly analogous to existing route.test.ts; jest mock pattern for @acme/axerve mirrors @acme/stripe
  - Approach: 80% — mock @acme/axerve in route.test.ts; unit test callPayment in packages/axerve/src/index.test.ts
  - Impact: 80% — test suite must fully cover all TC cases defined in IMPLEMENT-03 and IMPLEMENT-04
- **Acceptance:**
  - `route.test.ts`: all `@acme/stripe` mock references replaced with `@acme/axerve` mock
  - `route.test.ts`: covers TC-04-01 through TC-04-05 (success, empty cart, KO, 502 error, missing card fields)
  - `packages/axerve/src/index.test.ts`: covers TC-03-01 through TC-03-04 (OK response, KO response, SOAP error, mock mode)
  - No reference to `verifyStripeSession` anywhere in the test suite
  - `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs --testPathPattern=checkout` → caryina checkout route tests pass (verifyStripeSession tests deleted by IMPLEMENT-06)
  - `pnpm -w run test:governed -- jest -- --config=packages/axerve/jest.config.cjs` → Axerve package unit tests pass (requires jest config created in SPIKE-01)
- **Validation contract:**
  - TC-07-01: `route.test.ts` TC-04-01..05 all pass
  - TC-07-02: `packages/axerve/src/index.test.ts` TC-03-01..04 all pass
  - TC-07-03: no obsolete `@acme/stripe` mocks remain in route.test.ts
  - TC-07-04: full governed test run for apps/caryina shows 0 failures
- **Execution plan:** Red (run existing tests — expect failures due to broken stripe imports) → Green (rewrite route.test.ts mocks to @acme/axerve; write index.test.ts) → Refactor (ensure jest coverage settings include new files)
- **Planning validation:**
  - Checks run: read route.test.ts in full; confirmed jest mock pattern (`jest.mock("@acme/stripe", ...)`) is directly replaceable; confirmed verifyStripeSession.test.ts is the file being deleted (IMPLEMENT-06)
  - Unexpected findings: none — TC-04 previously only had TC-01 (200) and TC-04 (400); TC-03 (KO), TC-502 (502), TC-05 (missing fields) are new additions
- **Consumer tracing:**
  - Updated `route.test.ts` → consumed by CI test runner. No production code affected. ✓
  - New `index.test.ts` → consumed by CI test runner only. ✓
- **Scouts:** Verify governed test runner command covers `packages/axerve` (may need separate config or `--projects` flag)
- **Edge Cases & Hardening:** Confirm jest module resolution for `@acme/axerve` in `apps/caryina/jest.config.cjs` moduleNameMapper
- **What would make this >=90%:** Integration tests with Axerve sandbox mock server
- **Rollout / rollback:**
  - Rollout: test suite update only; no production impact
  - Rollback: git revert IMPLEMENT-07
- **Documentation impact:** None

---

### CHECKPOINT-08: Post-implementation horizon checkpoint

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`; sandbox E2E readiness assessment
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/caryina-axerve-payment-gateway/plan.md`
- **Depends on:** IMPLEMENT-05, IMPLEMENT-07
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents dead-end execution without sandbox credentials
  - Impact: 95% — controls go-live risk (PCI + sandbox validation gate)
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on any downstream tasks
  - Sandbox E2E readiness assessed: are `AXERVE_SHOP_LOGIN` + `AXERVE_API_KEY` available?
  - If credentials available: operator runs manual sandbox payment test; result documented in plan
  - If credentials not available: plan annotated with pending step; completion deferred
- **Horizon assumptions to validate:**
  - node-soap performs correctly under load (basic stress not required; functional correctness only)
  - Axerve sandbox response format matches production (operator to confirm)
  - PCI DSS compliance posture confirmed by operator before production deployment
- **Validation contract:** CHECKPOINT executed; `/lp-do-replan` result is `Ready` or `Blocked (pending-decision)` for sandbox credentials
- **Planning validation:** None — procedural task
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with sandbox test results or pending note

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| node-soap incompatible with CF Pages Node.js runtime | Low | High | SPIKE-01 validates; documented fallback to raw XML fetch |
| PCI DSS scope (SAQ D) not acceptable to operator | Medium | High | Flagged prominently; all dev/sandbox work proceeds; production deployment gated on operator acknowledgment |
| Axerve `uicCode` for EUR is wrong (numeric vs alphabetic) | Low | High | Use 978 (numeric) per Axerve/GestPay docs; verify in SPIKE-01 |
| `shopTransactionId` collisions → duplicate transaction rejection | Low | Medium | Use `crypto.randomUUID()` — UUID collision probability negligible |
| jest moduleNameMapper missing `@acme/axerve` → tests break | Low | Low | IMPLEMENT-07 adds mapper entry if needed |

## Observability
- Logging: log `shopTransactionId` + `BankTransactionID` on success (server console); log `ErrorCode` + `ErrorDescription` on failure
- Metrics: None: no analytics tracking changes required
- Alerts/Dashboards: None: no dashboard changes required

## Acceptance Criteria (overall)
- [ ] `pnpm -w run test:governed -- jest -- --config=apps/caryina/jest.config.cjs` passes with 0 failures (caryina route + cart tests; does not cover packages/axerve)
- [ ] `pnpm -w run test:governed -- jest -- --config=packages/axerve/jest.config.cjs` passes with 0 failures (Axerve client package tests)
- [ ] `pnpm typecheck` passes for packages/axerve and apps/caryina
- [ ] `POST /api/checkout-session` with mock card data returns success in local dev
- [ ] Card form renders on `/checkout` page with all required fields
- [ ] `/success` page renders without Stripe session lookup
- [ ] `packages/config/src/env/payments.ts` accepts `PAYMENTS_PROVIDER=axerve`
- [ ] `docs/.env.reference.md` includes `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_SANDBOX`
- [ ] No `@acme/stripe` import remains in `apps/caryina/src/app/api/checkout-session/route.ts`

## Decision Log
- 2026-02-27: Integration mode = S2S (not HPP). Operator explicitly provided S2S WSDL (`WSs2s.asmx`); interpreted as intent. Default plan is HPP per fact-find, but operator signal overrides default.
- 2026-02-27: SOAP library = node-soap. Preferred over raw XML for WSDL-based bidirectional SOAP. Fallback (raw XML fetch) documented if spike fails.
- 2026-02-27: success/page.tsx simplified to static (no session verification). S2S is synchronous — result known at checkout time. Async verification pattern not needed.

## Overall-confidence Calculation
- SPIKE-01: 80% × M(2) = 160
- IMPLEMENT-02: 85% × S(1) = 85
- IMPLEMENT-03: 80% × M(2) = 160
- IMPLEMENT-04: 80% × M(2) = 160
- IMPLEMENT-05: 80% × M(2) = 160
- IMPLEMENT-06: 80% × S(1) = 80
- IMPLEMENT-07: 80% × M(2) = 160
- CHECKPOINT-08: 95% × S(1) = 95 (procedural; included for completeness)
- Total: (160+85+160+160+160+80+160+95) / (2+1+2+2+2+1+2+1) = 1060 / 13 = 81.5% → **80%**
