---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-axerve-refund-endpoint
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG Axerve Refund Endpoint Plan

## Summary

Adds a secured admin-only refund endpoint to the caryina app that issues full or partial payment reversals via Axerve's `callRefundS2S` SOAP operation. The work is purely additive: a new `callRefund` function in `packages/axerve`, a new Zod schema in `adminSchemas.ts`, and a new `POST /admin/api/refunds/route.ts` guarded by the existing admin session middleware. The operator initiates refunds by calling the endpoint with the `shopTransactionId` (available in every merchant notification email) and the amount in cents. This closes the launch-readiness gap identified in the HBAG world-class benchmark: the 30-day free exchange promise in the logistics policy had no mechanism for financial reversal.

## Active tasks

- [ ] TASK-01: Add `AxerveRefundParams` and `AxerveRefundResult` types to `packages/axerve/src/types.ts`
- [ ] TASK-02: Implement `callRefund` in `packages/axerve/src/index.ts` and extend `packages/axerve/src/index.test.ts`
- [ ] TASK-03: Add `refundRequestSchema` to `apps/caryina/src/lib/adminSchemas.ts`
- [ ] TASK-04: Create `POST /admin/api/refunds/route.ts` and `route.test.ts`
- [ ] TASK-05: Typecheck, lint, governed tests, and sandbox smoke-test

## Goals

- Operator can initiate a full or partial Axerve refund for any completed order via `POST /admin/api/refunds`.
- The endpoint accepts `shopTransactionId` (preferred, from merchant email) or `bankTransactionId` (from server logs) plus `amountCents`.
- Unit tests cover all paths using the existing `AXERVE_USE_MOCK=true` mock pattern.
- No existing checkout flow or admin routes are affected.

## Non-goals

- Customer-facing self-serve refund portal.
- Persistent order store (no database).
- Automated refund triggers or webhooks.
- Admin UI page for refunds (deferred).
- SCA/3DS changes (separate, explicitly deferred by operator).

## Constraints & Assumptions

- Constraints:
  - The `callRefundS2S` SOAP operation requires `shopLogin`, `amount`, `uicCode`, `apikey`, and at least one of `shopTransactionID` or `bankTransactionID`. `shopTransactionId` is preferred (UUID-unique, present in merchant email).
  - `apikey` must be explicitly included in the `callRefundS2SAsync` SOAP payload — unlike `callPayment`, which accepts `apiKey` in its params struct but does NOT forward it to the SOAP call. This is a deliberate deviation, not a copy error.
  - `AXERVE_USE_MOCK=true` bypasses SOAP entirely (suitable for unit tests only). SOAP field-name mapping must be verified with `AXERVE_SANDBOX=true` + sandbox credentials in TASK-05.
  - Admin route must use `export const runtime = "nodejs"` (SOAP requires Node.js runtime).
  - Admin route must be under `/admin/api/refunds/` — the middleware matcher `/admin/:path*` covers it automatically.
  - Amounts arrive as `amountCents` (integer) and must be converted to `(amountCents / 100).toFixed(2)` decimal string for Axerve.
- Assumptions:
  - `callRefundS2SResult` response field names (`TransactionResult`, `BankTransactionID`, `ErrorCode`, `ErrorDescription`) mirror the pattern from `callPagamS2SResult`. To be confirmed in TASK-05 via sandbox.
  - `AXERVE_API_KEY` is accepted by `callRefundS2S` (same S2S credential set covers all operations).
  - `shopTransactionId` generated as `${randomUUID()}-${cartId}` is globally unique.

## Inherited Outcome Contract

- **Why:** Launch-readiness gap: HBAG promises 30-day free exchange but cannot execute a financial reversal. Closing this before the first real sale removes a potentially embarrassing and legally awkward gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can issue a full or partial Axerve refund for any completed order by calling `POST /admin/api/refunds` with the `shopTransactionId` (from merchant email) and amount in cents; the endpoint returns a structured result and logs the outcome. Unit tests verified via the governed test runner; SOAP field mapping verified with `AXERVE_SANDBOX=true` + sandbox credentials before any live refund is processed.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/hbag-axerve-refund-endpoint/fact-find.md`
- Key findings used:
  - `callRefundS2S` SOAP operation confirmed on same WSDL as `callPagamS2S`; accepts `shopTransactionID` as standalone identifier.
  - `shopTransactionId` is in merchant email (subject + body); `bankTransactionId` only in server logs.
  - `apikey` param required by `callRefundS2S` but NOT currently forwarded in `callPayment` SOAP call.
  - Admin middleware auto-protects any route under `/admin/:path*`.
  - `AXERVE_USE_MOCK=true` bypasses SOAP — cannot verify SOAP field names; requires sandbox run.

## Proposed Approach

- Option A: Admin API endpoint under `/admin/api/refunds/` (secured, curl-callable, operator-accessible).
- Option B: Server-side CLI script (no admin session, run directly on server).
- Chosen approach: **Option A — admin endpoint**. The existing admin infrastructure (auth middleware, Zod validation, `{ ok: boolean }` response shape) is already proven for exactly this type of operator action. A CLI script would bypass the auth layer and require direct server access, which is not how HBAG's Cloudflare Workers deployment operates. Option A is strictly less work and strictly more consistent.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: code-change` ✓
  - `Execution-Track: code` ✓
  - `Primary-Execution-Skill: lp-do-build` ✓
  - `Startup-Deliverable-Alias: none` ✓
  - Delivery-readiness: 88% ✓
  - Test landscape present: yes ✓
  - Testability: 90% ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `AxerveRefundParams` and `AxerveRefundResult` types | 95% | S | Pending | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Implement `callRefund` + extend tests in axerve package | 85% | M | Pending | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add `refundRequestSchema` to `adminSchemas.ts` | 95% | S | Pending | - | TASK-04 |
| TASK-04 | IMPLEMENT | Create `POST /admin/api/refunds/route.ts` + `route.test.ts` | 85% | M | Pending | TASK-01, TASK-02, TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Typecheck, lint, governed tests, sandbox smoke-test | 85% | S | Pending | TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03 | - | Independent type definition and Zod schema; no file overlap |
| 2 | TASK-02 | TASK-01 complete | Needs `AxerveRefundParams`/`AxerveRefundResult` types |
| 3 | TASK-04 | TASK-01, TASK-02, TASK-03 complete | Needs types, callRefund export, and schema |
| 4 | TASK-05 | TASK-04 complete | Validation gate — typecheck, lint, tests, sandbox run |

## Tasks

---

### TASK-01: Add `AxerveRefundParams` and `AxerveRefundResult` types

- **Type:** IMPLEMENT
- **Deliverable:** Type additions to `packages/axerve/src/types.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/axerve/src/types.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — types directly mirror existing `AxervePaymentParams`/`AxervePaymentResult` shape; all field names sourced from WSDL docs.
  - Approach: 95% — additive type additions to an established file; zero risk to existing code.
  - Impact: 95% — a prerequisite for TASK-02; no user-visible impact on its own.
- **Acceptance:**
  - `AxerveRefundParams` interface exported from `packages/axerve/src/types.ts` with: `shopLogin: string`, `apiKey: string`, `shopTransactionId?: string`, `bankTransactionId?: string`, `amount: string`, `uicCode: string`. JSDoc notes that at least one transaction ID must be supplied and that `shopTransactionId` is preferred.
  - `AxerveRefundResult` interface exported with: `success: boolean`, `transactionId: string`, `bankTransactionId: string`, `errorCode?: string`, `errorDescription?: string`.
  - TypeScript compiles without errors for the types file (`tsc --noEmit` on the axerve package).
- **Validation contract (TC-XX):**
  - TC-01-01: `AxerveRefundParams` with only `shopTransactionId` provided satisfies type — TypeScript accepts `{ shopLogin, apiKey, shopTransactionId, amount, uicCode }`.
  - TC-01-02: `AxerveRefundParams` with only `bankTransactionId` provided satisfies type — TypeScript accepts `{ shopLogin, apiKey, bankTransactionId, amount, uicCode }`.
  - TC-01-03: `AxerveRefundResult` with `success: true` has no required `errorCode` or `errorDescription`.
  - TC-01-04: `AxerveRefundResult` with `success: false` can include `errorCode` and `errorDescription`.
- **Execution plan:** Add two new interface blocks after the existing `AxervePaymentResult` interface. Export both. No changes to existing interfaces.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: types are directly modelled on existing patterns and WSDL-documented field names.
- **Edge Cases & Hardening:**
  - Both `shopTransactionId` and `bankTransactionId` are optional in the type to allow callers to supply either. A runtime `refine()` in TASK-03's Zod schema enforces that at least one is present — the type stays permissive to avoid over-constraining.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: additive export; existing consumers unaffected.
  - Rollback: delete the two new interfaces.
- **Documentation impact:** JSDoc comments on the new interfaces are the documentation.
- **Notes / references:** Mirrors `AxervePaymentParams` pattern; `authCode` field from `AxervePaymentResult` is omitted from `AxerveRefundResult` as refunds do not produce an auth code.

---

### TASK-02: Implement `callRefund` in axerve package and extend tests

- **Type:** IMPLEMENT
- **Deliverable:** New `callRefund` export in `packages/axerve/src/index.ts`; new test cases appended to `packages/axerve/src/index.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/axerve/src/index.ts`, `packages/axerve/src/index.test.ts`, `[readonly] packages/axerve/src/types.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — `callPayment` is a near-exact template; key deviation is `callRefundS2SAsync` SOAP method name and including `apikey` in payload (unlike `callPayment`). SOAP response field names assumed from docs, not runtime-verified.
  - Approach: 90% — dynamic `soap` import, mock gate, sandbox switch, `AxerveError` on failure — all established patterns.
  - Impact: 85% — new export; existing `callPayment` export and tests unchanged. Held at 85% because SOAP response field-name mapping is unverified until TASK-05 sandbox run.
- **Acceptance:**
  - `callRefund(params: AxerveRefundParams): Promise<AxerveRefundResult>` is exported from `packages/axerve/src/index.ts`.
  - When `AXERVE_USE_MOCK=true`: returns `{ success: true, transactionId: params.shopTransactionId ?? "mock-refund-txn", bankTransactionId: "mock-bank-refund-001" }` without making any SOAP call.
  - When `AXERVE_SANDBOX=true` (and not mock): uses sandbox WSDL URL `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`.
  - When neither: uses production WSDL URL `https://ecomms2s.sella.it/gestpay/gestpayws/WSs2s.asmx?WSDL`.
  - On SOAP `TransactionResult === "OK"`: returns `{ success: true, transactionId, bankTransactionId }`.
  - On SOAP `TransactionResult !== "OK"`: returns `{ success: false, transactionId, bankTransactionId: "", errorCode, errorDescription }`.
  - On SOAP network/protocol failure: throws `AxerveError`.
  - `apikey: params.apiKey` is explicitly included in the `callRefundS2SAsync` SOAP payload.
  - Existing `callPayment` export and all its tests pass unchanged.
  - 4 new test cases in `packages/axerve/src/index.test.ts` (numbered continuing from TC-03-04):
    - TC-R-01: SOAP OK response → `success: true`, correct `transactionId` and `bankTransactionId`.
    - TC-R-02: SOAP KO response → `success: false`, correct `errorCode` and `errorDescription`.
    - TC-R-03: SOAP network error → throws `AxerveError`.
    - TC-R-04: `AXERVE_USE_MOCK=true` → returns hardcoded success without SOAP call; `callRefundS2SAsync` not called.
- **Validation contract (TC-XX):**
  - TC-02-01: Mock mode returns success without calling SOAP client.
  - TC-02-02: SOAP OK response returns `success: true` with `transactionId` and `bankTransactionId` from response.
  - TC-02-03: SOAP KO response returns `success: false` with `errorCode` and `errorDescription`.
  - TC-02-04: SOAP client constructor throw → `callRefund` throws `AxerveError`.
  - TC-02-05: Existing `callPayment` tests still pass (regression).
- **Execution plan:**
  1. Add `parseRefundResult(result, fallback): AxerveRefundResult` helper — mirrors `parseS2SResult` but reads `callRefundS2SResult` key.
  2. Add `callRefund(params)` function with mock gate, WSDL switch, dynamic `soap` import, `callRefundS2SAsync` call (include `apikey`), error catch → `AxerveError`.
  3. Export `callRefund`, `AxerveRefundParams`, `AxerveRefundResult` from `index.ts`.
  4. Append 4 test cases to `index.test.ts` following the `jest.doMock("soap", ...)` pattern.
- **Planning validation (required for M/L):**
  - Checks run: Read `packages/axerve/src/index.ts` (lines 1–96) confirming `callPagamS2SAsync` payload shape, mock gate, WSDL constants, `parseS2SResult` pattern.
  - Validation artifacts: Existing test file `packages/axerve/src/index.test.ts` (4 test cases, all passing patterns).
  - Unexpected findings: `callPayment` does not include `apiKey` in SOAP payload (lines 77–88). `callRefund` must deliberately include it — this is a documented constraint, not an oversight.

  **Consumer tracing (new outputs):**
  - `callRefund` export: consumed by TASK-04 (`apps/caryina/src/app/admin/api/refunds/route.ts`). No other consumers exist. Route does not exist yet — TASK-04 creates it.
  - `AxerveRefundParams` and `AxerveRefundResult` type exports: consumed by TASK-04 (route) and by TASK-01 (types file, already created). No other consumers.

  **Modified behavior check:** No existing functions or signatures are modified.
- **Scouts:** None: SOAP mock pattern is proven; `jest.doMock("soap", ...)` with `callRefundS2SAsync` is the only new mock method name.
- **Edge Cases & Hardening:**
  - If both `shopTransactionId` and `bankTransactionId` are undefined (caller error): the SOAP call will likely return KO. The function does not validate the param combination — that validation belongs in the route's Zod schema (TASK-03). The function passes what it gets.
  - If SOAP returns a response where `TransactionResult` is absent: `parseRefundResult` falls back to `success: false` with empty error fields (same defensive pattern as `parseS2SResult`).
- **What would make this >=90%:** Confirmed `callRefundS2SResult` response key name via a live sandbox call. Until TASK-05 runs the sandbox test, this holds at 85%.
- **Rollout / rollback:**
  - Rollout: additive export; zero effect on existing `callPayment` consumers.
  - Rollback: remove `callRefund` export and the 4 new test cases.
- **Documentation impact:** JSDoc on `callRefund` — mirrors `callPayment` JSDoc noting `AXERVE_USE_MOCK`, `AXERVE_SANDBOX`, and the `apikey` payload requirement.
- **Notes / references:**
  - SOAP method name: `callRefundS2SAsync` (GestPay S2S WSDL convention: operation name + `Async`).
  - Response key: `callRefundS2SResult` (assumed — verify in TASK-05).
  - `apikey` field name in SOAP payload is lowercase (per WSDL documentation).

---

### TASK-03: Add `refundRequestSchema` to `adminSchemas.ts`

- **Type:** IMPLEMENT
- **Deliverable:** New Zod schema export in `apps/caryina/src/lib/adminSchemas.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/lib/adminSchemas.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 95%
  - Implementation: 95% — Zod schema follows established pattern in `adminSchemas.ts`; `refine()` for at least-one-ID constraint is straightforward.
  - Approach: 95% — additive export to existing schema file.
  - Impact: 95% — a required input for TASK-04; no user-visible effect on its own.
- **Acceptance:**
  - `refundRequestSchema` exported from `apps/caryina/src/lib/adminSchemas.ts`.
  - Schema shape: `{ shopTransactionId: z.string().min(1).optional(), bankTransactionId: z.string().min(1).optional(), amountCents: z.number().int().positive() }`.
  - `.refine()` rejects input where both `shopTransactionId` and `bankTransactionId` are absent; error message: `"At least one of shopTransactionId or bankTransactionId is required"`.
  - TypeScript compiles without errors for the schemas file.
- **Validation contract (TC-XX):**
  - TC-03-01: `{ shopTransactionId: "txn-abc", amountCents: 4500 }` → parses successfully.
  - TC-03-02: `{ bankTransactionId: "bank-001", amountCents: 4500 }` → parses successfully.
  - TC-03-03: `{ shopTransactionId: "txn-abc", bankTransactionId: "bank-001", amountCents: 4500 }` → parses successfully (both IDs allowed).
  - TC-03-04: `{ amountCents: 4500 }` (no transaction ID) → `.safeParse` fails with refine error.
  - TC-03-05: `{ shopTransactionId: "txn-abc", amountCents: 0 }` → fails (`amountCents` must be positive).
  - TC-03-06: `{ shopTransactionId: "", amountCents: 1 }` → fails (empty string fails `min(1)`).
- **Execution plan:** Append `refundRequestSchema` after `updateInventorySchema`. Use `z.object(...).refine(data => data.shopTransactionId || data.bankTransactionId, { message: "..." })`.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: straightforward Zod pattern.
- **Edge Cases & Hardening:** `refine()` covers the at-least-one-ID guard. `amountCents` validated as positive integer (prevents zero-amount and negative refunds).
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: additive export.
  - Rollback: remove the new schema export.
- **Documentation impact:** None beyond inline Zod schema.
- **Notes / references:** Amount field named `amountCents` (not `amount`) to distinguish from Axerve's decimal-string `amount`; conversion happens in the route handler.

---

### TASK-04: Create `POST /admin/api/refunds/route.ts` and `route.test.ts`

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/admin/api/refunds/route.ts` (new file) + `apps/caryina/src/app/admin/api/refunds/route.test.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/admin/api/refunds/route.ts`, `apps/caryina/src/app/admin/api/refunds/route.test.ts`, `[readonly] apps/caryina/src/lib/adminSchemas.ts`, `[readonly] packages/axerve/src/index.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — route pattern fully established by `admin/api/inventory/[sku]/route.ts` and `api/checkout-session/route.ts`; test pattern by `checkout-session/route.test.ts`. Held at 85% because SOAP response field names are unverified until TASK-05.
  - Approach: 90% — minimum-addition pattern; no architectural unknowns.
  - Impact: 85% — additive route with zero blast radius. Held at 85% to match TASK-02's unverified SOAP field mapping (if `callRefund` returns wrong fields, the route propagates them).
- **Acceptance:**
  - `apps/caryina/src/app/admin/api/refunds/route.ts` exists with `export const runtime = "nodejs"` and `export async function POST(request: Request)`.
  - Parses request body with `request.json()`, validates with `refundRequestSchema.safeParse()`.
  - On validation failure → `{ ok: false, error: "validation_error", details: ... }` with status 400.
  - Converts `amountCents` to `(amountCents / 100).toFixed(2)` for the Axerve call.
  - Calls `callRefund({ shopLogin: env.AXERVE_SHOP_LOGIN, apiKey: env.AXERVE_API_KEY, shopTransactionId, bankTransactionId, amount, uicCode: "978" })`.
  - On `result.success === true` → `console.info("Axerve refund OK", ...)`, return `{ ok: true, data: { transactionId, bankTransactionId } }` with status 200.
  - On `result.success === false` → `console.error("Axerve refund KO", ...)`, return `{ ok: false, error: result.errorDescription ?? "Refund declined", errorCode: result.errorCode }` with status 402.
  - On missing `AXERVE_SHOP_LOGIN` or `AXERVE_API_KEY` env var → return `{ ok: false, error: "Payment service not configured" }` with status 503, without calling Axerve (fail-fast misconfiguration guard).
  - On `AxerveError` throw → `console.error("Axerve SOAP error", ...)`, return `{ ok: false, error: "Payment service unavailable" }` with status 502.
  - Route is automatically protected by `src/middleware.ts` (matcher: `/admin/:path*`); no middleware changes required.
  - `route.test.ts` covers 7 test cases: happy path shopTransactionId (200), happy path bankTransactionId (200), validation failure no ID (400), validation failure amountCents=0 (400), Axerve KO (402), SOAP error (502), missing env vars (503).
- **Validation contract (TC-XX):**
  - TC-04-01: Valid body with `shopTransactionId` + `amountCents` + mocked `callRefund` success → status 200, `{ ok: true, data: { transactionId, bankTransactionId } }`.
  - TC-04-02: Valid body with `bankTransactionId` + `amountCents` + mocked `callRefund` success → status 200.
  - TC-04-03: Body missing both transaction IDs → status 400, `{ ok: false, error: "validation_error" }`.
  - TC-04-04: Body with `amountCents: 0` → status 400, `{ ok: false, error: "validation_error" }`.
  - TC-04-05: `callRefund` returns `success: false` → status 402, `{ ok: false, error: <errorDescription> }`.
  - TC-04-06: `callRefund` throws `AxerveError` → status 502, `{ ok: false, error: "Payment service unavailable" }`.
  - TC-04-07: Missing `AXERVE_SHOP_LOGIN` or `AXERVE_API_KEY` env var → route returns 503 `{ ok: false, error: "Payment service not configured" }` immediately, without calling Axerve. Build constraint: add a guard at the top of the POST handler that checks both env vars are non-empty before proceeding; this is a fail-fast server misconfiguration guard, not a runtime Axerve error.
- **Execution plan:**
  1. Create directory `apps/caryina/src/app/admin/api/refunds/`.
  2. Write `route.ts` with `runtime = "nodejs"`, `POST` handler, Zod validation, `amountCents`→decimal conversion, `callRefund` call, structured responses.
  3. Write `route.test.ts` following `checkout-session/route.test.ts` pattern: `jest.mock("@acme/axerve", ...)`, `jest.mock("@acme/platform-core/...")` not needed (no cart/email), use `new Request(...)` with JSON body, 7 test cases (TC-04-01 through TC-04-07).
- **Planning validation (required for M/L):**
  - Checks run: Read `apps/caryina/src/app/admin/api/products/route.ts` (POST pattern), `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts` (PATCH pattern), `apps/caryina/src/app/api/checkout-session/route.test.ts` (mock pattern), `apps/caryina/src/middleware.ts` (matcher confirmation).
  - Validation artifacts: Middleware matcher confirmed as `/admin/:path*`; route at `/admin/api/refunds/` is covered.
  - Unexpected findings: Admin routes (products, inventory) do NOT have `export const runtime = "nodejs"` — they use the default Edge runtime and do not call SOAP. The refund route must explicitly include `runtime = "nodejs"` since `callRefund` uses dynamic `soap` import.

  **Consumer tracing (new outputs):**
  - `POST /admin/api/refunds/`: consumed only by the operator via HTTP call. No code consumers.
  - Response shape `{ ok: boolean, data?: { transactionId, bankTransactionId }, error?: string, errorCode?: string }`: consumed only by the HTTP caller (operator's curl/script). No code consumers.

  **Modified behavior check:** No existing routes, middleware, or shared modules are modified.
- **Scouts:** None: route shape, mock pattern, and validation pattern all proven in existing code.
- **Edge Cases & Hardening:**
  - `amountCents` conversion: `(amountCents / 100).toFixed(2)` for amounts like 4500 → "45.00". Edge: `amountCents: 1` → "0.01" (valid minimal refund).
  - If both `shopTransactionId` and `bankTransactionId` are provided: pass both to `callRefund`; Axerve uses `bankTransactionId` when both are present (per WSDL docs). Document in JSDoc.
  - `AXERVE_SHOP_LOGIN` or `AXERVE_API_KEY` missing or empty: route returns 503 immediately (fail-fast misconfiguration guard). This departs from the checkout-session pattern deliberately: the refund route is admin-only and should never silently forward a misconfigured credential to Axerve.
- **What would make this >=90%:** Confirmed `callRefundS2SResult` key name via TASK-05 sandbox run. Once verified, both TASK-02 and TASK-04 can be updated to 90%+.
- **Rollout / rollback:**
  - Rollout: new files only; zero impact on existing routes.
  - Rollback: delete `apps/caryina/src/app/admin/api/refunds/` directory.
- **Documentation impact:** None beyond JSDoc in the route file.
- **Notes / references:** Middleware auth not testable at route-level in Jest (middleware not invoked); auth is tested at middleware level in existing tests. This is the established pattern — no special handling required.

---

### TASK-05: Typecheck, lint, governed tests, and sandbox smoke-test

- **Type:** IMPLEMENT
- **Deliverable:** Clean typecheck + lint + test run confirmation; sandbox refund result documented
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] packages/axerve/src/index.ts`, `[readonly] apps/caryina/src/app/admin/api/refunds/route.ts`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — typecheck and lint commands are known; governed test runner is established. Sandbox run requires operator-available sandbox credentials. Held at 85% because `callRefundS2SResult` response field names are the key unknown this task resolves.
  - Approach: 90% — standard validation gate: `pnpm typecheck && pnpm lint` scoped to `@acme/axerve` and `caryina`; governed test runner.
  - Impact: 85% — this task produces no user-facing change; its output is confidence evidence. If the sandbox run reveals wrong field names, TASK-02 needs a patch (low-effort fix, well-contained).
- **Acceptance:**
  - `pnpm typecheck` passes for `packages/axerve` and `apps/caryina` with no new errors.
  - `pnpm lint` passes for `packages/axerve` and `apps/caryina` with no new errors.
  - All existing tests pass (no regression).
  - All new tests (TC-02-01 to TC-02-04 for axerve pkg, TC-04-01 to TC-04-07 for route) pass.
  - Sandbox smoke-test: operator runs `POST /admin/api/refunds` against the running app with `AXERVE_SANDBOX=true` and a real `shopTransactionId` from a sandbox payment, confirming `callRefundS2SResult` field names and that the endpoint returns `{ ok: true }`.
  - Git commit with writer lock: all changed files committed with the feature slug in the commit message.
- **Validation contract (TC-XX):**
  - TC-05-01: `pnpm typecheck` exits 0 for both packages.
  - TC-05-02: `pnpm lint` exits 0 for both packages.
  - TC-05-03: Governed test runner exits 0 for `@acme/axerve` and `caryina` test suites.
  - TC-05-04: Sandbox smoke-test returns `{ ok: true, data: { transactionId: "...", bankTransactionId: "..." } }` with HTTP 200.
- **Execution plan:**
  1. Run `pnpm typecheck` scoped to changed packages; fix any errors.
  2. Run `pnpm lint` scoped to changed packages; fix any errors.
  3. Verify tests pass by pushing changes and confirming CI green — do not invoke Jest directly (governed runner runs in CI, not locally).
  4. Operator: set `AXERVE_SANDBOX=true`, run a test payment on sandbox to get a `shopTransactionId`, then call `POST /admin/api/refunds` with that ID and `amountCents`. Document the raw response.
  5. If SOAP field names differ from expected: patch `parseRefundResult` in `packages/axerve/src/index.ts` accordingly; re-run tests and typecheck.
  6. Commit all changes with writer lock.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** Sandbox credentials (`AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY` for sandbox environment) must be available to the operator. These are stored in `.env.local` (per memory context). Sandbox mode activated by `AXERVE_SANDBOX=true`.
- **Edge Cases & Hardening:** If sandbox reveals `callRefundS2SResult` key differs from expected, the fix is a single-line change in `parseRefundResult`. This is a bounded, well-scoped correction.
- **What would make this >=90%:** Completed sandbox run confirming field names. After TASK-05 is done, both TASK-02 and TASK-04 can be updated to 90%+ in the plan.
- **Rollout / rollback:**
  - Rollout: commit the implementation. No deploy step required beyond a normal Cloudflare Workers deploy.
  - Rollback: revert the commit (5 files affected across the plan: `packages/axerve/src/types.ts` modified, `packages/axerve/src/index.ts` modified, `packages/axerve/src/index.test.ts` modified, `apps/caryina/src/lib/adminSchemas.ts` modified, `apps/caryina/src/app/admin/api/refunds/route.ts` and `route.test.ts` new).
- **Documentation impact:** None: this is a validation task. The commit message and console logs are the documentation.
- **Notes / references:** Sandbox credentials location: `apps/caryina/.env.local`. Governed test runner policy: tests are CI-only — do not invoke Jest directly. Push changes and observe CI; `lp-do-build` handles typecheck and lint locally but defers test pass/fail gate to CI green.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add refund types | Yes | None | No |
| TASK-03: Add refund schema | Yes | None | No |
| TASK-02: Implement `callRefund` + tests | Yes (TASK-01 types available) | [Integration boundary] [Moderate]: SOAP response key `callRefundS2SResult` assumed from docs; not runtime-verified. `AXERVE_USE_MOCK=true` in tests cannot verify. Verification deferred to TASK-05 sandbox run. | No (TASK-05 is the resolution step) |
| TASK-04: Create refund route + tests | Yes (TASK-01, TASK-02, TASK-03 all available) | [Type contract] [Minor]: `AxerveRefundResult.transactionId` maps from SOAP response's `ShopTransactionID` (per `parseS2SResult` pattern). If `parseRefundResult` maps the same key, `transactionId` returned to the caller will be the echoed `shopTransactionId` — not the Axerve-internal ID. This is correct behavior and should be documented in JSDoc. | No |
| TASK-05: Typecheck + lint + tests + sandbox | Yes (all prior tasks complete) | [Integration boundary] [Moderate]: sandbox run requires operator-available credentials (`AXERVE_SANDBOX=true` + real sandbox `shopTransactionId`). If operator cannot complete sandbox run, SOAP field mapping remains unverified. | No (documented as operator action; unit tests still pass independently) |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `callRefundS2SResult` SOAP response key differs from expected | Medium | Low | TASK-05 sandbox run catches this; fix is a single-line change in `parseRefundResult`. Tests use mock so they pass regardless; sandbox run is the verification gate. |
| Operator cannot retrieve `shopTransactionId` for a past order | Low | Medium | `shopTransactionId` is in both the merchant email subject and body. Documented in route JSDoc and inline comments. |
| Admin session expiry (1-hour TTL) during refund operation | Low | Low | Standard pattern; operator re-authenticates at `/admin/login`. |
| `AXERVE_API_KEY` rejected by `callRefundS2S` (credential mismatch) | Low | Low | Same env var used for payment; S2S credential model covers all operations. TASK-05 sandbox run validates this. |
| Partial-refund `amountCents` exceeds original charge | Low | Low | Axerve returns KO with `ErrorCode`; route surfaces it to caller as 402. |

## Observability

- Logging:
  - `console.info("Axerve refund OK", { shopTransactionId, bankTransactionId })` on success.
  - `console.error("Axerve refund KO", { errorCode, errorDescription })` on KO.
  - `console.error("Axerve SOAP error", message)` on `AxerveError`.
  - Pattern matches existing checkout-session logging conventions.
- Metrics: None: no analytics integration for admin-only operations.
- Alerts/Dashboards: None: founder-led operation; Cloudflare Workers logs serve as the audit trail.

## Acceptance Criteria (overall)

- [ ] `callRefund` exported from `packages/axerve` with mock and sandbox mode support.
- [ ] `POST /admin/api/refunds/` exists, is protected by admin middleware, and returns structured results.
- [ ] All new unit tests pass via the governed test runner.
- [ ] Typecheck and lint pass for `@acme/axerve` and `caryina`.
- [ ] Sandbox smoke-test confirms `callRefundS2SResult` field mapping and returns `{ ok: true }`.
- [ ] No existing tests broken.
- [ ] Git commit with writer lock made.

## Decision Log

- 2026-02-28: Chose admin API endpoint (Option A) over server-side CLI script (Option B). Rationale: existing admin auth infrastructure is exactly the right mechanism; CLI script bypasses auth and requires server access incompatible with Cloudflare Workers deployment model.
- 2026-02-28: `shopTransactionId` designated as primary refund identifier (over `bankTransactionId`) because it appears in every merchant notification email. `bankTransactionId` accepted as fallback via the same endpoint.
- 2026-02-28: Customer-facing refund notification email deferred to the separate customer confirmation email task (IDEA-DISPATCH-20260228-0073). Refund handler sends merchant-only log entry only.

## Overall-confidence Calculation

- TASK-01: 95% × S(1) = 95
- TASK-02: 85% × M(2) = 170
- TASK-03: 95% × S(1) = 95
- TASK-04: 85% × M(2) = 170
- TASK-05: 85% × S(1) = 85
- Sum of weights: 1+2+1+2+1 = 7
- Weighted sum: 95+170+95+170+85 = 615
- Overall-confidence = 615 / 7 = **87.9% → 87%**
