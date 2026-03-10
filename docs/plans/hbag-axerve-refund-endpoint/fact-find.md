---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-axerve-refund-endpoint
Dispatch-ID: IDEA-DISPATCH-20260228-0075
Trigger-Source: dispatch-routed
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-axerve-refund-endpoint/plan.md
Trigger-Why: Launch-readiness gap identified in world-class benchmark scan. HBAG logistics policy promises a 30-day free exchange, but no mechanism exists to execute a financial reversal through Axerve. A checkout with no path to refund is operationally incomplete before launch.
Trigger-Intended-Outcome: type: operational | statement: Operator can initiate a full or partial Axerve refund for any completed order by calling a secured admin endpoint (or running an approved script), producing an auditable confirmation log entry. | source: auto
---

# HBAG Axerve Refund Endpoint Fact-Find Brief

## Scope

### Summary
HBAG's checkout flow (caryina app) takes card payments through Axerve's `callPagamS2S` SOAP operation. On success, both a `shopTransactionId` and `bankTransactionId` are generated and logged. However, there is no mechanism to reverse a completed payment. Axerve's S2S SOAP API provides a `callRefundS2S` operation that accepts `shopLogin`, `bankTransactionID`, `amount`, and `uicCode` (and `apikey`) and can issue full or partial refunds. This fact-find validates the feasibility of adding a secured admin-only refund endpoint (under `/admin/api/refunds/`) using the existing admin auth infrastructure and the `@acme/axerve` package.

### Goals
- Add `callRefundS2S` function to `packages/axerve` following the same pattern as `callPayment`.
- Add `POST /admin/api/refunds/route.ts` authenticated via the existing `CARYINA_ADMIN_KEY`/session-cookie auth middleware.
- Accept `bankTransactionId`, `amount` (in cents), and optionally `shopTransactionId`; issue the refund via Axerve.
- Return structured success/failure response with Axerve's transaction result.
- Add unit tests for the new axerve function and the new route, matching existing test conventions.

### Non-goals
- Customer-facing refund initiation (no self-serve portal).
- Order record storage (no database, consistent with current checkout-session pattern which also has no persistent store).
- Webhook or automated refund triggers.
- Full admin UI page for refunds (operator calls the endpoint directly or via a script; a future UI addition is deferred).
- SCA/3DS changes (separate scan item that was explicitly skipped by operator).

### Constraints & Assumptions
- Constraints:
  - `packages/axerve` uses `soap` npm library (v1.7.1) — SOAP client pattern must be reused.
  - Admin routes are protected by `CARYINA_ADMIN_KEY` + HMAC session cookie; refund endpoint must sit under `/admin/api/` and be protected by the same middleware (`src/middleware.ts` matcher: `/admin/:path*`).
  - The `callRefundS2S` SOAP operation requires: `shopLogin`, `amount`, `uicCode`, and at least one of `shopTransactionID` (preferred — in merchant email) or `bankTransactionID` (from server logs). `shopTransactionID` is sufficient as primary identifier when unique (UUID-based, confirmed).
  - The `AXERVE_SANDBOX=true` env var controls endpoint URL; `AXERVE_USE_MOCK=true` produces mock results without any SOAP call (suitable for unit tests only — SOAP field mapping must be verified separately with `AXERVE_SANDBOX=true`).
  - No persistent order store exists — the caller must supply transaction IDs obtained from the merchant notification email or console logs.
- Assumptions:
  - `callRefundS2S` is exposed on the same WSDL as `callPagamS2S` (confirmed: same endpoint `WSs2s.asmx`).
  - Axerve's `apikey` parameter for the refund call uses the same `AXERVE_API_KEY` env var as the payment call.
  - Full and partial refund are both supported by `callRefundS2S` (confirmed by official docs: "amount which is less than the amount for which the transaction was settled").
  - `shopTransactionId` is the canonical refund identifier for this implementation. It is UUID-unique, present in the merchant notification email (subject + body), and accepted by `callRefundS2S` as a standalone identifier. `bankTransactionId` is a secondary alternative (server logs only).
  - `apikey` is documented as a required parameter in `callRefundS2S`. The current `callPayment` implementation accepts `apiKey` in its params struct but does NOT pass it to the `callPagamS2SAsync` SOAP payload — this is an existing gap in the payment call. The new `callRefund` function must explicitly include `apikey` in the SOAP payload, using the same `AXERVE_API_KEY` env var.

## Outcome Contract

- **Why:** Launch-readiness gap: HBAG promises 30-day free exchange but cannot execute a financial reversal. Closing this before the first real sale removes a potentially embarrassing and legally awkward gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operator can issue a full or partial Axerve refund for any completed order by calling `POST /admin/api/refunds` with the `shopTransactionId` (from merchant email) and amount in cents; the endpoint returns a structured result and logs the outcome. Unit tests verified via the governed test runner; SOAP field mapping verified with `AXERVE_SANDBOX=true` + sandbox credentials before any live refund is processed.
- **Source:** auto

## Access Declarations

- **Axerve/GestPay SOAP API:** read-only investigation of WSDL endpoint URL structure and `callRefundS2S` operation parameters. Verified via official docs (docs.axerve.com → docs.paymentorchestra.fabrick.com) and sandbox WSDL introspection. `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` are in `apps/caryina/.env.local` (not checked into repo). No live calls in this fact-find.
- **Repo codebase:** read-only. All evidence gathered from repository files only.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/checkout-session/route.ts` — sole payment initiation path; emits `shopTransactionId` + logs `bankTransactionId` on success; no refund path exists here or anywhere.
- `apps/caryina/src/app/admin/api/` — existing admin API surface; products (CRUD) and inventory (PATCH) endpoints demonstrate the pattern for new admin routes.
- `apps/caryina/src/middleware.ts` — enforces `CARYINA_ADMIN_KEY` session cookie on all `/admin/:path*` routes except `/admin/login` and `/admin/api/auth`. A route at `/admin/api/refunds/` will be automatically protected.

### Key Modules / Files

- `packages/axerve/src/index.ts` — contains `callPayment` (→ `callPagamS2SAsync`). New `callRefund` function follows same pattern: dynamic `soap` import, sandbox/production WSDL switch via `AXERVE_SANDBOX`, mock mode via `AXERVE_USE_MOCK`. **This is the only file in the axerve package that needs a new export.**
- `packages/axerve/src/types.ts` — defines `AxervePaymentParams` and `AxervePaymentResult`. New types `AxerveRefundParams` and `AxerveRefundResult` go here.
- `apps/caryina/src/app/admin/api/refunds/route.ts` — **new file** (does not exist). POST handler accepting `{ bankTransactionId, shopTransactionId?, amount, currency? }`, calling `callRefund`, returning structured result.
- `apps/caryina/src/lib/adminAuth.ts` — `verifyAdminSession` is called by middleware; no changes needed in this file; the refund route benefits from middleware protection automatically.
- `apps/caryina/src/lib/adminSchemas.ts` — Zod schemas for admin request validation; new `refundRequestSchema` goes here.

### Patterns & Conventions Observed

- All SOAP interaction goes through the `@acme/axerve` package (not called directly in the app) — evidence: `checkout-session/route.ts` imports `{ callPayment } from "@acme/axerve"`.
- Admin routes parse body with `request.json()`, validate with `adminSchemas` Zod schema, return `{ ok: boolean, error?: string, data?: unknown }` shape — evidence: `admin/api/products/route.ts`, `admin/api/inventory/[sku]/route.ts`.
- Mock/sandbox control via env vars (`AXERVE_USE_MOCK=true`, `AXERVE_SANDBOX=true`) — established pattern in `packages/axerve/src/index.ts`.
- `AxerveError` class thrown on SOAP network failures — should also be thrown by `callRefund` for consistency.
- `export const runtime = "nodejs"` is required on routes that use SOAP (dynamic `soap` import requires Node.js runtime, not Edge).

### Data & Contracts

- Types/schemas:
  - **New:** `AxerveRefundParams { shopLogin: string; apiKey: string; shopTransactionId?: string; bankTransactionId?: string; amount: string; uicCode: string; }` — at least one of `shopTransactionId` or `bankTransactionId` must be supplied; `shopTransactionId` is the preferred operator-accessible identifier (in merchant email).
  - **New:** `AxerveRefundResult { success: boolean; transactionId: string; bankTransactionId: string; errorCode?: string; errorDescription?: string; }` (parallel to `AxervePaymentResult` minus `authCode`)
  - **New:** `refundRequestSchema` (Zod): `{ shopTransactionId: string().min(1).optional(); bankTransactionId: string().min(1).optional(); amountCents: number().int().positive(); }` with a `.refine()` requiring at least one transaction ID — route converts `amountCents` to decimal string for Axerve.
- Persistence: none. No order store. Transaction IDs come from the caller (obtained from merchant email or server logs).
- API/contracts: Axerve `callRefundS2S` SOAP operation on the same WSDL as `callPagamS2S`:
  - Required: `shopLogin`, `bankTransactionID`, `amount` (decimal string), `uicCode` ("978" for EUR), `apikey`
  - Optional: `shopTransactionID` (secondary identifier), `RefundReason`
  - Response: `callRefundS2SResult` element with `TransactionResult` ("OK"/"KO"), `BankTransactionID`, `ErrorCode`, `ErrorDescription`
  - Source: sandbox WSDL introspection at `https://sandbox.gestpay.net/gestpay/gestpayws/WSS2S.asmx?op=callRefundS2S`

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/axerve` package (extended, not replaced)
  - `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY` env vars (already set in caryina deployment)
  - `CARYINA_ADMIN_KEY` env var (already set; admin auth middleware uses it)
  - `shopTransactionId` from a prior successful payment (primary identifier; present in merchant notification email subject and body). `bankTransactionId` is a secondary alternative available from server logs.
- Downstream dependents:
  - Nothing currently depends on a refund path. No blast radius on checkout flow.
- Likely blast radius:
  - **Zero** impact on the happy-path checkout flow (`/api/checkout-session` is untouched).
  - New route `/admin/api/refunds/` is additive; middleware already guards it.
  - `packages/axerve` gets a new export — no change to existing `callPayment` export or its tests.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (governed test runner: `pnpm -w run test:governed`)
- Commands: governed test runner via `pnpm -w run test:governed` (repo policy — do not invoke Jest directly or via `pnpm --filter`); each package's `package.json` `test` script already routes through `run-governed-test.sh`
- CI integration: governed test runner script (`scripts/tests/run-governed-test.sh`) used by both packages; this is the authoritative test execution path

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `callPayment` (axerve pkg) | Unit (Jest, node env) | `packages/axerve/src/index.test.ts` | TC-03-01–04: SOAP OK, SOAP KO, network error, mock mode. Full coverage of existing function. |
| `POST /api/checkout-session` | Unit (Jest, node env) | `apps/caryina/src/app/api/checkout-session/route.test.ts` | TC-04-01–07: happy path, empty cart, KO, SOAP error, missing fields, email failure, email not called on KO. |
| Admin auth route | Unit (Jest) | `apps/caryina/src/app/admin/api/auth/route.test.ts` | TC-02–04 + edge cases. |
| Admin products | Unit (Jest) | `apps/caryina/src/app/admin/api/products/route.test.ts`, `[id]/route.test.ts` | CRUD covered. |
| Admin inventory | Unit (Jest) | `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts` | PATCH covered. |

#### Coverage Gaps

- Untested paths (to be created):
  - `callRefund` (axerve package): SOAP OK, SOAP KO, network error, mock mode — 4 test cases following TC-03-* pattern.
  - `POST /admin/api/refunds`: happy path (200), missing/invalid fields (400), Axerve KO (402), SOAP error (502), unauthenticated (middleware blocks at 401/redirect — tested at middleware level if needed).
- Extinct tests: none.

#### Testability Assessment

- Easy to test: `callRefund` — same SOAP mock pattern as `callPayment` (`jest.doMock("soap", ...)`). `POST /admin/api/refunds` — same mock pattern as checkout-session route tests.
- Hard to test: Admin cookie authentication in route-level tests (middleware does not run in Jest route tests — this is existing pattern; middleware is tested separately).
- Test seams needed: `AXERVE_USE_MOCK=true` env var (already present in axerve package pattern) satisfies mock need without real SOAP calls.

### Recent Git History (Targeted)

- `packages/axerve/src/index.ts` — two commits: scaffold (Wave 1) + production SOAP client (IMPLEMENT-03). No refund-related history.
- `apps/caryina/src/app/api/checkout-session/route.ts` — three commits: initial cart checkout, Axerve S2S replacement, merchant email addition. No refund work ever attempted.
- `apps/caryina/src/app/admin/` — four commits: auth middleware → product CRUD APIs → admin UI → CI color-token fix. Pattern is stable.

## External Research

- Finding: Axerve `callRefundS2S` is exposed on the same WSs2s WSDL endpoint as `callPagamS2S`. Required parameters: `shopLogin`, `bankTransactionID`, `amount` (decimal string), `uicCode`, `apikey`. Optional: `shopTransactionID`, `RefundReason`. Response element: `callRefundS2SResult` with `TransactionResult` ("OK"/"KO"), `BankTransactionID`, `ErrorCode`, `ErrorDescription`. Partial refund supported (amount can be less than the settled amount). Source: [Axerve WSs2s sandbox WSDL](https://sandbox.gestpay.net/gestpay/gestpayws/WSS2S.asmx?op=callRefundS2S)

## Questions

### Resolved

- Q: Does Axerve support server-side refund initiation?
  - A: Yes. `callRefundS2S` is a first-class SOAP operation on the same WSs2s endpoint already in use. No new credentials or service agreements required.
  - Evidence: `https://sandbox.gestpay.net/gestpay/gestpayws/WSS2S.asmx?op=callRefundS2S` (WSDL introspected)

- Q: What identifiers are needed to call `callRefundS2S`?
  - A: `bankTransactionID` (primary) + `shopLogin` + `amount` + `uicCode` + `apikey`. The `shopTransactionID` is optional secondary identifier. The `bankTransactionId` is already logged to the server console on every successful payment (line: `console.info("Axerve payment OK", { shopTransactionId, bankTransactionId: result.bankTransactionId })`).
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts` (line 90), sandbox WSDL

- Q: Is an admin UI necessary, or is an endpoint sufficient for a founder-led operation?
  - A: An endpoint is sufficient. The existing admin pattern shows the operator already interacts with admin APIs directly (product creation, inventory editing). A `curl`-callable secured endpoint under `/admin/api/refunds/` with `CARYINA_ADMIN_KEY` authentication matches the operational model. A UI can be added in a follow-on iteration.
  - Evidence: `apps/caryina/src/app/admin/api/products/route.ts` (operator uses API for product management), logistics-pack.user.md (operator-run business — no customer service team).

- Q: Will the admin middleware automatically protect the new refund route?
  - A: Yes. `apps/caryina/src/middleware.ts` matches `/admin/:path*` with a catch-all. Any route at `/admin/api/refunds/` is automatically guarded. No changes to middleware needed.
  - Evidence: `apps/caryina/src/middleware.ts` (matcher config: `["/admin/:path*"]`)

- Q: Which transaction identifier does the operator use to initiate a refund, and where can they retrieve it?
  - A: The primary identifier is `shopTransactionId` (the UUID generated by the checkout route). Axerve's `callRefundS2S` accepts `shopLogin + shopTransactionId` as a unique transaction identifier provided `shopTransactionId` is unique — which it is, being UUID-based (`${randomUUID()}-${cartId}`). The merchant notification email contains `shopTransactionId` in two places: the subject line (`New order — ${shopTransactionId}`) and the body (`Transaction ID: ${shopTransactionId}`). The `bankTransactionId` is also a valid identifier but is only captured in server logs (`console.info("Axerve payment OK", { shopTransactionId, bankTransactionId: result.bankTransactionId })`), not in the email. The build task should expose both identifiers in the refund endpoint's input schema to give the operator flexibility.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts` (lines 67, 90, 111, 116); Axerve `callRefundS2S` WSDL documentation (shopTransactionId valid as primary identifier when unique)

- Q: Does the partial-refund use case require a different API call?
  - A: No. `callRefundS2S` supports partial refunds by setting `amount` to less than the settled amount. The endpoint will accept an `amountCents` parameter; the route converts to decimal string before calling Axerve.
  - Evidence: Axerve official docs (WSs2s WSDL introspection)

### Open (Operator Input Required)

- Q: Should the refund endpoint send a customer-facing email confirming the refund was issued?
  - Why operator input is required: The checkout route currently sends no customer email at all (a separate launch gap item). Whether to add customer refund notification here or wait for that separate email work to land first is a product prioritisation decision.
  - Decision impacted: Whether `sendSystemEmail` is called in the refund handler.
  - Decision owner: Operator (Peter)
  - Default assumption: Send merchant-only notification (same pattern as checkout). Customer email deferred to the separate customer confirmation email task. Build proceeds with this default.

## Confidence Inputs

- Implementation: 88%
  - Evidence: SOAP operation identified and documented; existing `callPayment` pattern is a near-perfect template; middleware protection is automatic; test pattern is established. Only gap: `callRefundS2SResult` SOAP response field names have not been runtime-verified. Note: `AXERVE_USE_MOCK=true` bypasses SOAP entirely and cannot verify field names — field mapping must be verified by running with `AXERVE_SANDBOX=true` and real sandbox credentials against the Axerve test environment. What raises to >=90: operator runs one sandbox refund with `AXERVE_SANDBOX=true` after implementation to confirm `callRefundS2SResult` field mapping.
- Approach: 92%
  - Evidence: Adding `callRefund` to `@acme/axerve` and a new admin route is the minimum-change path. No architectural decisions remain open. Admin endpoint is the correct form for founder-led operation (confirmed from logistics-pack context and existing admin API usage pattern). What raises to 90: already at 92%.
- Impact: 85%
  - Evidence: Without this, the HBAG 30-day exchange promise is unenforceable via the payment provider. With it, operator can process any refund within minutes. What raises to >=90: operator confirms they have tested a mock refund before launch.
- Delivery-Readiness: 88%
  - Evidence: All dependencies (axerve package, admin auth, Jest test setup) are in place. `shopTransactionId` is in the merchant notification email (subject + body) and is a valid Axerve refund identifier (UUID-unique). No new env vars needed. Delivery-Readiness raised from initial 85% on confirmation that `shopTransactionId` — not `bankTransactionId` — is the primary operator-accessible identifier. What raises to >=90: operator runs one sandbox refund to verify SOAP field mapping before handling a live refund request.
- Testability: 90%
  - Evidence: `AXERVE_USE_MOCK=true` pattern proven in `callPayment` tests (bypasses SOAP entirely — suitable for unit testing route logic and mock responses, not SOAP field-name verification). Route-level mock pattern proven in checkout-session tests. New unit tests are direct clones of existing patterns with different SOAP method and response field names. What raises to >=90: already at 90%; SOAP field-name verification requires `AXERVE_SANDBOX=true` + sandbox credentials (separate from unit test scope).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `callRefundS2SResult` response field names differ from `callPagamS2SResult` | Medium | Low | Unit tests use `AXERVE_USE_MOCK=true` (bypasses SOAP — suitable for testing route logic). SOAP field-name mapping must be verified with `AXERVE_SANDBOX=true` + sandbox credentials before the first live refund. Build task must include this sandbox verification step. |
| Operator cannot retrieve transaction ID for a past order | Low | Medium | `shopTransactionId` is in the merchant email subject (`New order — ${shopTransactionId}`) and body (`Transaction ID: ${shopTransactionId}`). This is the preferred refund identifier (UUID-unique, accepted by Axerve). `bankTransactionId` is a secondary fallback available from Cloudflare Worker logs. |
| Admin session expiry (1 hour TTL) means refund request must be made within an active session | Low | Low | Standard admin auth pattern already in use; operator re-authenticates via `/admin/login`. |
| Partial-refund amount exceeds settled amount (rejected by Axerve) | Low | Low | Axerve will return a KO result with `ErrorCode`; the endpoint surfaces this to the caller clearly. |
| `apikey` not passed in current `callPagamS2SAsync` SOAP payload, but required by `callRefundS2S` | Medium | Low | `AXERVE_API_KEY` env var is set and is in `AxervePaymentParams` type, but the current `callPayment` SOAP payload does NOT include it (lines 77–88 of `packages/axerve/src/index.ts`). The new `callRefund` function must explicitly include `apikey: params.apiKey` in the `callRefundS2SAsync` SOAP payload. This is a build constraint, not a blocker. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New `callRefund` function must mirror `callPayment`: dynamic `soap` import, `AXERVE_USE_MOCK` mock gate, `AXERVE_SANDBOX` WSDL switch, `AxerveError` on network failure.
  - New admin route must use Zod validation from `adminSchemas`, return `{ ok: boolean }` shape, and use `runtime = "nodejs"` (SOAP requirement).
  - Test files placed alongside source: `packages/axerve/src/index.test.ts` (extend, not create new file), `apps/caryina/src/app/admin/api/refunds/route.test.ts` (new file).
  - Amount from caller is in cents (integer); must be converted to `(cents / 100).toFixed(2)` decimal string for Axerve.
- Rollout/rollback expectations:
  - Purely additive endpoint. Rollback = delete the route file. Zero risk to the checkout flow.
- Observability expectations:
  - `console.info("Axerve refund OK", { bankTransactionId, shopTransactionId })` on success.
  - `console.error("Axerve refund KO", { errorCode, errorDescription })` on KO response.
  - Pattern matches existing checkout-session logging.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `AxerveRefundParams` and `AxerveRefundResult` types to `packages/axerve/src/types.ts`
- TASK-02: Add `callRefund` function to `packages/axerve/src/index.ts`; extend `packages/axerve/src/index.test.ts` with 4 test cases (OK, KO, network error, mock mode)
- TASK-03: Add `refundRequestSchema` to `apps/caryina/src/lib/adminSchemas.ts`
- TASK-04: Create `apps/caryina/src/app/admin/api/refunds/route.ts` (POST handler) + `route.test.ts` (happy path, KO, SOAP error, missing fields)
- TASK-05: Build and typecheck (`pnpm typecheck && pnpm lint` scoped to changed packages); run governed test suite to confirm all new and existing tests pass; post-build: run one sandbox refund with `AXERVE_SANDBOX=true` and sandbox credentials to verify `callRefundS2SResult` field mapping

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `packages/axerve/src/index.ts` exports `callRefund`
  - `packages/axerve/src/types.ts` exports `AxerveRefundParams`, `AxerveRefundResult`
  - `apps/caryina/src/app/admin/api/refunds/route.ts` exists and is protected by middleware
  - All new unit tests pass via the governed test runner (`AXERVE_USE_MOCK=true` active for unit test scope — tests route logic and mock SOAP responses, not live SOAP field names)
  - No existing tests broken
  - `apikey` is explicitly included in the `callRefundS2SAsync` SOAP payload (not skipped as in `callPayment`)
- Post-delivery measurement plan:
  - Operator verifies unit tests pass (governed runner) — these cover route logic with mock Axerve responses.
  - Operator runs one sandbox refund with `AXERVE_SANDBOX=true` and real sandbox credentials to verify `callRefundS2SResult` SOAP field name mapping before any live refund is required.
  - Operator confirms merchant notification email contains `Transaction ID: <shopTransactionId>` (already confirmed in source, but verify on a test order).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Axerve refund operation existence and parameters | Yes | None | No |
| `packages/axerve` extension pattern (callRefund function) | Partial | [Integration boundary] [Moderate]: `callPayment` does not send `apiKey` in the SOAP payload (lines 77–88 of `packages/axerve/src/index.ts`) despite accepting it in params. `callRefundS2S` requires `apikey`. Build task must explicitly include `apikey: params.apiKey` in the SOAP call — this is a deliberate deviation from `callPayment` pattern, not a copy-paste error. | No (documented as build constraint) |
| Admin middleware auto-protection of new route | Yes | None | No |
| Zod request validation schema pattern | Yes | None | No |
| Transaction ID availability at refund call time | Yes | None — `shopTransactionId` is in merchant email subject and body; UUID-unique so it is a valid primary identifier for `callRefundS2S`. `bankTransactionId` is secondary (server logs). | No |
| SOAP response field name mapping for `callRefundS2SResult` | Partial | [Integration boundary] [Moderate]: `callRefundS2SResult` field names assumed to mirror `callPagamS2SResult` based on WSDL documentation pattern. Not runtime-verified. `AXERVE_USE_MOCK=true` bypasses SOAP and cannot verify field names. Verification requires `AXERVE_SANDBOX=true` + sandbox credentials at build/post-build stage. | No (build task must include sandbox verification step before first live refund) |
| Environment variable coverage | Yes | None | No |
| Test infrastructure coverage | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity:** All file paths verified by direct read. SOAP operation existence confirmed via WSDL introspection. Admin middleware protection traced to actual middleware file.
2. **Boundary coverage:** Admin auth boundary confirmed (middleware matcher covers new route path automatically). External API boundary (Axerve SOAP) inspected for parameter requirements. Error/fallback paths (KO response, network failure) carried forward from existing pattern.
3. **Testing/validation coverage:** Existing tests verified by reading actual test files. Coverage gaps identified (4 new test cases for `callRefund`, 4+ for new route). No extinct tests.
4. **Business validation:** Operational justification confirmed via logistics-pack (30-day exchange promise). Founder-led operational model confirmed (no customer service team; admin API model appropriate).
5. **Confidence calibration:** Implementation held at 88% (not 90%+) because `callRefundS2SResult` field names are documented but not runtime-verified (requires sandbox test). Also noted: `callPayment` does not forward `apiKey` in its SOAP payload despite having it in params — `callRefund` must explicitly include it. Delivery-Readiness at 88%: `shopTransactionId` is in the merchant email and is a valid Axerve refund identifier.

### Confidence Adjustments

- Implementation at 88% (not 90%+): `callRefundS2SResult` SOAP field names are documented but not runtime-verified. `AXERVE_USE_MOCK=true` cannot verify field mapping (bypasses SOAP entirely); verification requires `AXERVE_SANDBOX=true` + sandbox credentials.
- Delivery-Readiness raised to 88% (from initial 85%): `shopTransactionId` is confirmed to be in merchant email subject and body, and is a valid primary Axerve refund identifier (UUID-unique). Original concern about `bankTransactionId` availability was misdirected — `shopTransactionId` is the preferred identifier.

### Remaining Assumptions

- `callRefundS2SResult` response field names (`TransactionResult`, `BankTransactionID`, `ErrorCode`, `ErrorDescription`) match the naming convention established by `callPagamS2SResult`. Verification: `AXERVE_SANDBOX=true` + sandbox credentials against the sandbox endpoint (not `AXERVE_USE_MOCK=true` which bypasses SOAP entirely).
- `AXERVE_API_KEY` value is accepted by `callRefundS2S` — consistent with Axerve S2S credential model (one credential set per shop covers all S2S operations).
- `shopTransactionId` generated as `${randomUUID()}-${cartId}` is globally unique across all HBAG transactions (UUID v4 collision probability negligible).
- `callPayment` not forwarding `apiKey` in its SOAP payload is intentional (Axerve `callPagamS2S` does not require it) — the refund operation `callRefundS2S` explicitly requires `apikey` per documentation.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan hbag-axerve-refund-endpoint --auto`
