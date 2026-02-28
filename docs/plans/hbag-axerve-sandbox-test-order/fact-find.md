---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-axerve-sandbox-test-order
Dispatch-ID: IDEA-DISPATCH-20260228-0074
Business: HBAG
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-axerve-sandbox-test-order/plan.md
Trigger-Why: Pre-launch readiness gap — no test order workflow or Axerve sandbox mode exists. Closing this gap is required before any real traffic is sent to the shop.
Trigger-Intended-Outcome: type: operational | statement: Pre-launch checkout test order completed (success flow, decline flow) using Axerve sandbox credentials before real traffic is sent; runbook artifact persisted in repo | source: operator
---

# HBAG Axerve Sandbox & Test Order Workflow — Fact-Find Brief

## Scope

### Summary

The HBAG caryina store has an Axerve S2S payment integration live in the route `apps/caryina/src/app/api/checkout-session/route.ts`. The route currently has no sandbox or test-mode wiring — it reads live `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` credentials directly from env with no distinction between test and production modes. Additionally, no pre-launch test order checklist or runbook exists documenting how to execute a test order (success + decline) before sending real traffic.

**Critical discovery:** The `@acme/axerve` package (`packages/axerve/src/index.ts`) already implements two env-based test modes:
- `AXERVE_USE_MOCK=true` — returns a hardcoded success result without any SOAP call (local dev safety valve).
- `AXERVE_SANDBOX=true` — routes SOAP calls to the Axerve sandbox WSDL (`sandbox.gestpay.net`) instead of production.

The gap is that: (1) `.env.example` in caryina does not document these env vars, (2) there is no runbook for executing a test order against the sandbox, and (3) no route-level documentation or structured pre-launch gate exists. The `.env.local` has `AXERVE_USE_MOCK=true` set with `AXERVE_SANDBOX=true` commented out — this strongly suggests (but does not definitively prove) that sandbox has not been exercised, since mock mode takes precedence over sandbox when both are set.

### Goals

- Add `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, and `AXERVE_SANDBOX` to `.env.example` with clear comments explaining what each does, when to use sandbox versus mock mode, and how to obtain sandbox credentials from Axerve. Note: sandbox testing works by setting the existing `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` values to sandbox equivalents (no new env var names are introduced).
- Create a pre-launch test order runbook at `apps/caryina/docs/plans/test-order-runbook.md` covering: sandbox credential setup, success transaction test, decline transaction test.
- Persist the runbook in `apps/caryina/docs/plans/` (confirmed directory exists).

### Non-goals

- Changing the core payment flow (SCA/3DS is a separate gap, already deferred per worldclass scan).
- Modifying the checkout UI.
- Changing the `@acme/axerve` package logic (it already supports sandbox correctly).
- Any production credential changes or live payment tests.

### Constraints & Assumptions

- Constraints:
  - Route must continue to work with existing `AXERVE_SHOP_LOGIN` / `AXERVE_API_KEY` vars in production. No breaking changes.
  - The `@acme/axerve` `callPayment` function must not be refactored — it already works correctly.
  - Sandbox Axerve credentials (the sandbox-specific values for `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY`) are operator-provided and not present in repo; the plan must document how the operator obtains and uses them. No new env var names are introduced — the operator simply replaces the values in `.env.local` when running in sandbox mode.
- Assumptions:
  - Axerve does provide a sandbox environment at `sandbox.gestpay.net` (confirmed: WSDL URL in `packages/axerve/src/index.ts` line 8).
  - The sandbox uses different shop login and API key from production (standard for payment processors).
  - `AXERVE_USE_MOCK=true` in `.env.local` means the operator has been doing local testing with mock mode only, never against the sandbox endpoint.

## Outcome Contract

- **Why:** Pre-launch readiness — no real-traffic order should be processed without first confirming the full payment flow works end-to-end against Axerve's sandbox. One failed test order plus one successful test order must be on record before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Pre-launch checkout test runbook exists in repo; operator has run one success test and one decline test against Axerve sandbox before any live traffic is sent.
- **Source:** operator

## Access Declarations

- **Axerve sandbox API** — read access to sandbox WSDL endpoint; requires sandbox credentials from operator. UNVERIFIED (operator-held). Not required for code changes; only required when the operator actually runs the test order.
- **Repository** — read access confirmed.
- No other external data sources required.

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/checkout-session/route.ts` — the sole server-side payment handler. Calls `callPayment` with live credentials from `process.env.AXERVE_SHOP_LOGIN` and `process.env.AXERVE_API_KEY`. No sandbox/test-mode branching in the route itself.
- `packages/axerve/src/index.ts` — `callPayment()` function. Already contains full test-mode logic (lines 51–62 for mock, lines 64–66 for sandbox URL switch). No changes needed here.

### Key Modules / Files

- `packages/axerve/src/index.ts` — `callPayment` with `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` support already implemented. Sandbox WSDL: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`.
- `packages/axerve/src/types.ts` — `AxervePaymentParams` and `AxervePaymentResult` interfaces. No changes needed.
- `packages/axerve/src/index.test.ts` — TC-03-04 already covers `AXERVE_USE_MOCK=true` mock path. No sandbox endpoint integration test exists.
- `apps/caryina/src/app/api/checkout-session/route.ts` — reads `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` directly without checking any sandbox flag. These are passed through to `callPayment`, which handles the sandbox routing itself.
- `apps/caryina/.env.example` — currently documents only email-related vars (`EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS`, `MERCHANT_NOTIFY_EMAIL`, `RESEND_API_KEY`). No Axerve vars documented at all.
- `apps/caryina/.env.local` — has `AXERVE_USE_MOCK=true`, `AXERVE_SHOP_LOGIN=dev-mock-shop-login`, `AXERVE_API_KEY=dev-mock-api-key`, and a commented-out `AXERVE_SANDBOX=true` line. The current `.env.local` state suggests (but does not definitively prove) that sandbox mode has not been exercised — inferred from `AXERVE_USE_MOCK=true` taking precedence over any sandbox setting.
- `apps/caryina/src/app/api/checkout-session/route.test.ts` — 7 test cases (TC-04-01 through TC-04-07) covering success, empty cart, KO response, SOAP error, missing fields, email fail, KO+no-email. No sandbox-specific test case exists.

### Patterns & Conventions Observed

- Environment variable pattern in `packages/axerve/src/index.ts`: `process.env.AXERVE_USE_MOCK === "true"` guard before any SOAP call. This pattern is the correct test-mode gate.
- Route test pattern (`route.test.ts`): `jest.mock("@acme/axerve", ...)` to mock `callPayment` at the package level — isolates route from network. No env var switching in route tests.
- `.env.example` convention: the file documents required/optional env vars for the app with comments explaining purpose. Axerve vars are entirely absent from this file despite being required for live payment processing.

### Data & Contracts

- Types/schemas/events:
  - `AxervePaymentParams` — `{ shopLogin, apiKey, uicCode, amount, shopTransactionId, cardNumber, expiryMonth, expiryYear, cvv, buyerName?, buyerEmail? }`
  - `AxervePaymentResult` — `{ success, transactionId, bankTransactionId, authCode?, errorCode?, errorDescription? }`
  - Route response (success): `{ success: true, transactionId, amount, currency: "eur" }`
  - Route response (KO): `{ success: false, error: string }` — status 402
  - Route response (SOAP error): `{ error: "Payment service unavailable" }` — status 502
- Persistence:
  - No persistent order record. Cart is deleted from Redis-like store (`deleteCart`) on success. No order table or log.
- API/contracts:
  - Axerve sandbox WSDL: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL` (confirmed in source).
  - Axerve test cards: documented at https://docs.axerve.com/it/test (operator must obtain). Not in repo.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/axerve` package — callPayment + AxerveError (already test-mode capable)
  - `@acme/platform-core/cartCookie` — CART_COOKIE, decodeCartCookie
  - `@acme/platform-core/cartStore` — getCart, deleteCart
  - `@acme/platform-core/email` — sendSystemEmail (fire-and-forget, does not affect payment result)
  - `process.env.AXERVE_SHOP_LOGIN`, `process.env.AXERVE_API_KEY` — live credentials
  - `process.env.AXERVE_USE_MOCK` — mock flag (in axerve package)
  - `process.env.AXERVE_SANDBOX` — sandbox URL flag (in axerve package)
- Downstream dependents:
  - `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — calls `/api/checkout-session` via `fetch`. No changes needed.
  - `apps/caryina/src/app/[lang]/success/page.tsx` — success redirect target. Not affected.
- Likely blast radius:
  - Minimal. Primary change is `.env.example` documentation + a runbook markdown file. No production code changes required. The sandbox routing is already implemented in `packages/axerve/src/index.ts`.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (`@jest-environment node` for route tests, jsdom for UI tests)
- Commands: Tests run in CI on PR push; no local test execution required per repo policy (see `AGENTS.md`).
- CI integration: tests run in CI on every push

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `callPayment` mock mode | Unit | `packages/axerve/src/index.test.ts` TC-03-04 | Covers `AXERVE_USE_MOCK=true` path completely |
| `callPayment` SOAP OK | Unit | `packages/axerve/src/index.test.ts` TC-03-01 | Covers success result parsing |
| `callPayment` SOAP KO | Unit | `packages/axerve/src/index.test.ts` TC-03-02 | Covers failure result parsing |
| `callPayment` network error | Unit | `packages/axerve/src/index.test.ts` TC-03-03 | Covers AxerveError throw |
| Route POST success | Unit | `route.test.ts` TC-04-01 | Mocks callPayment — no SOAP call |
| Route POST KO | Unit | `route.test.ts` TC-04-03 | Mocks callPayment KO result |
| Route POST SOAP error | Unit | `route.test.ts` TC-04-04 | Mocks AxerveError throw |
| CheckoutClient UI | Unit | `CheckoutClient.test.tsx` TC-05-01 to 05-04 | Mocks fetch — no SOAP call |

#### Coverage Gaps

- Untested paths:
  - `AXERVE_SANDBOX=true` endpoint routing path — no integration test against sandbox WSDL. This is acceptable (sandbox requires external credentials + network); manual runbook covers this.
  - No test for the route when `AXERVE_SANDBOX=true` is set (the route itself is agnostic; the env var is consumed by the axerve package, not the route).
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - `.env.example` documentation change — no tests needed, content review only.
  - Runbook markdown — no tests needed.
- Hard to test:
  - Live sandbox SOAP call — requires real Axerve sandbox credentials and network; cannot be unit-tested without credentials. Manual runbook is the correct mechanism.
- Test seams needed:
  - None. The existing seams (`AXERVE_USE_MOCK`, `AXERVE_SANDBOX`) are already in place and tested.

#### Recommended Test Approach

- Unit tests for: No new unit tests needed for this deliverable (existing coverage is sufficient; sandbox path is covered by manual runbook).
- Integration tests for: N/A — sandbox test is a manual pre-launch gate, not an automated CI test.
- E2E tests for: N/A for this scope.
- Contract tests for: N/A — SOAP contract is already exercised in `index.test.ts` with mocked client.

### Recent Git History (Targeted)

- `packages/axerve/` — `c01ac58bd9 feat(caryina/axerve): IMPLEMENT-03 — production Axerve SOAP client` added `AXERVE_SANDBOX` and `AXERVE_USE_MOCK` support. This is the commit that makes sandbox available but left it undocumented.
- `apps/caryina/src/app/api/checkout-session/route.ts` — `65c3bcc76a feat(caryina): IMPLEMENT-04 — replace checkout route with Axerve S2S` replaced the earlier checkout stub. No sandbox env var documentation added.
- `1a92b19ccf feat(caryina): send merchant order notification email on payment success` — added fire-and-forget merchant notification. No test order gap addressed.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Entry point: `checkout-session/route.ts` | Yes | None | No |
| `@acme/axerve` sandbox/mock env var support | Yes | None — both `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` confirmed in source | No |
| `.env.example` documentation gap | Yes | [Scope gap in investigation] [Minor]: Axerve env vars are absent from `.env.example`; confirmed by reading file | No |
| Sandbox WSDL URL | Yes | None — URL confirmed in `packages/axerve/src/index.ts` line 8 | No |
| Test landscape: existing coverage | Yes | None — TC-03-04 covers mock; no sandbox integration test (acceptable — manual gate) | No |
| `apps/caryina/.env.local` current state | Yes | None — `AXERVE_USE_MOCK=true` set; `AXERVE_SANDBOX=true` commented out | No |
| Route-level sandbox credential wiring | Yes | [Minor]: Route passes `process.env.AXERVE_SHOP_LOGIN` and `process.env.AXERVE_API_KEY` to `callPayment`. For sandbox testing, these must be replaced with sandbox credentials; no separate `AXERVE_SANDBOX_SHOP_LOGIN` var exists | No (convention choice — operator sets whichever credential pair is appropriate) |
| Runbook artifact path | Yes | None — `apps/caryina/docs/plans/` directory confirmed to exist; runbook placed there | No |
| Blast radius on production code | Yes | None — no production code changes required | No |

No Critical simulation findings. All findings are Minor and advisory.

## Questions

### Resolved

- Q: Does the `@acme/axerve` package already support sandbox mode?
  - A: Yes. `AXERVE_SANDBOX=true` routes to `sandbox.gestpay.net` WSDL. `AXERVE_USE_MOCK=true` returns a hardcoded success result without any network call.
  - Evidence: `packages/axerve/src/index.ts` lines 7–11, 51–66.

- Q: Are separate sandbox credentials needed, or does `AXERVE_SANDBOX=true` alone switch to sandbox?
  - A: Separate sandbox credentials are almost certainly required (standard for Axerve/GestPay — the sandbox shop login and API key are different from production). `AXERVE_SANDBOX=true` only changes the endpoint URL; it does not inject test credentials. The operator must obtain sandbox credentials from the Axerve merchant portal.
  - Evidence: Axerve documentation pattern (standard payment processor sandbox design); confirmed by `callPayment` signature which passes `shopLogin` and `apiKey` to the SOAP call regardless of mode.

- Q: Does the route need any code changes to support sandbox?
  - A: No. The route passes `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` through to `callPayment`. To run a sandbox test, the operator sets `AXERVE_SANDBOX=true`, replaces `AXERVE_SHOP_LOGIN` / `AXERVE_API_KEY` with sandbox credentials in `.env.local`, and runs the app. The `callPayment` function handles the rest. No route code changes are needed.
  - Evidence: `packages/axerve/src/index.ts` — sandbox URL selection is internal to `callPayment`.

- Q: Is there an existing `apps/caryina/docs/` directory for the runbook?
  - A: Yes — `apps/caryina/docs/plans/` exists in the repo. The runbook can be placed at `apps/caryina/docs/plans/test-order-runbook.md` to keep operational docs co-located with the app they document. Alternatively, `docs/plans/hbag-axerve-sandbox-test-order/test-order-runbook.md` (this plan's directory) is also valid. Recommendation: use `apps/caryina/docs/plans/test-order-runbook.md` for discoverability by future developers working on the caryina app.
  - Evidence: `ls apps/caryina/docs/` confirms `plans/` subdirectory.

- Q: What Axerve test cards exist?
  - A: Not documented in repo. Axerve publishes test card numbers at their developer docs (typically Visa `4111111111111111` for success, `4111111111111129` for decline — but the operator must verify these against the current Axerve sandbox documentation). This is operator-action territory.
  - Evidence: Axerve sandbox test card numbers are standard knowledge; the axerve package tests use `4111111111111111` (TC-03-01/02 in `index.test.ts`).

- Q: Is a new test needed in the test suite for sandbox mode?
  - A: No. The sandbox path changes only the WSDL URL — the SOAP parsing, result handling, and error paths are all covered by existing tests using mocked SOAP clients. A CI integration test against a real sandbox endpoint is out of scope (requires live credentials). The manual runbook is the correct mechanism.
  - Evidence: `packages/axerve/src/index.test.ts` — TC-03-01 through TC-03-04 cover all SOAP paths.

### Open (Operator Input Required)

- Q: Has the operator obtained sandbox credentials (shop login + API key) from the Axerve merchant portal?
  - Why operator input is required: Sandbox credentials are issued by Axerve per-merchant account. The agent cannot obtain or verify these.
  - Decision impacted: Whether the runbook can be executed immediately after the plan completes, or whether it requires a credential request to Axerve first.
  - Decision owner: Operator (HBAG merchant account holder)
  - Default assumption + risk: Credentials not yet obtained. Risk: cannot run sandbox test order until credentials are requested. The plan will document how to request them, but this is a manual prerequisite step outside the code deliverable.

## Confidence Inputs

- **Implementation: 95%**
  - Evidence: `packages/axerve/src/index.ts` already implements full sandbox support. The code deliverable is limited to `.env.example` documentation and a runbook markdown file. No ambiguity in implementation path.
  - To reach 95%: Already at threshold. Risk is operator credential acquisition (external, not a code risk).
  - To reach >98%: Operator confirms sandbox credentials are already available.

- **Approach: 90%**
  - Evidence: Using existing `AXERVE_SANDBOX=true` + credential swap is the correct and simplest approach. No alternative designs exist that are simpler or safer.
  - To reach 90%: Already at threshold.
  - To reach >95%: Verify Axerve sandbox test card numbers match what is documented in the runbook.

- **Impact: 80%**
  - Evidence: Closing this gap unblocks the pre-launch checklist. Without a test order, the operator has no confidence the payment flow works end-to-end. The mock mode (`AXERVE_USE_MOCK=true`) does not test the SOAP integration at all.
  - To reach 80%: Already at threshold.
  - To reach >90%: Operator successfully executes the sandbox test order (success + decline) using the runbook.

- **Delivery-Readiness: 90%**
  - Evidence: Code changes are minimal (`.env.example` + runbook). No route changes, no schema migrations, no new dependencies. Only blocking factor is operator sandbox credential acquisition.
  - To reach 90%: Already at threshold — runbook can be written fully without sandbox credentials in hand.
  - To reach >95%: Operator confirms credentials available and runs the test.

- **Testability: 85%**
  - Evidence: The runbook provides the manual test gate. Existing unit tests cover all automated paths. No automated test for sandbox is needed.
  - To reach 85%: Already at threshold.
  - To reach >90%: Runbook includes pass/fail criteria and expected response shapes.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Operator does not have sandbox credentials yet | Medium | Medium — delays actual test run, not the code deliverable | Runbook includes step-by-step instructions to request sandbox credentials from Axerve merchant portal |
| Axerve sandbox test card numbers differ from documented guess | Low | Low — test fails with a clear error; operator corrects test card | Runbook directs operator to Axerve sandbox test card documentation; do not hardcode unverified card numbers |
| Sandbox endpoint is unavailable or different at time of test | Low | Low — sandbox.gestpay.net WSDL URL is confirmed in source and is a live Axerve system | Runbook includes fallback: if sandbox is unavailable, use `AXERVE_USE_MOCK=true` to confirm route logic, then retry sandbox when available |
| `.env.local` overrides cause confusion between sandbox and mock modes | Low | Low — operator may accidentally have both `AXERVE_USE_MOCK=true` and `AXERVE_SANDBOX=true` set, with mock taking precedence | Runbook explicitly states: unset `AXERVE_USE_MOCK` when running sandbox test; document precedence rule |
| Merchant notification email fires during sandbox test | Low | Low — fires to `MERCHANT_NOTIFY_EMAIL` on success; harmless but potentially confusing | Runbook notes this and advises setting `MERCHANT_NOTIFY_EMAIL` to a test address during sandbox run |

## Planning Constraints & Notes

- Must-follow patterns:
  - `.env.example` comment style: match existing inline-comment format in `apps/caryina/.env.example`.
  - Runbook markdown: save to `apps/caryina/docs/plans/test-order-runbook.md` (co-located with the caryina app; confirmed directory exists).
  - No production code changes to `route.ts` are needed or permitted in this scope.
  - Do not introduce new env var names (e.g. `AXERVE_SANDBOX_SHOP_LOGIN`). The `@acme/axerve` `callPayment` function consumes `shopLogin` and `apiKey` from its params (not directly from env) — the route passes `process.env.AXERVE_SHOP_LOGIN` and `process.env.AXERVE_API_KEY` through. To test against sandbox, the operator swaps the values of the existing `AXERVE_SHOP_LOGIN` / `AXERVE_API_KEY` vars in `.env.local` to their sandbox equivalents. Document this clearly in `.env.example` with comments.
- Rollout/rollback expectations:
  - Rollback: if the `.env.example` documentation causes confusion, revert the file. No production impact.
  - Runbook is additive; no rollback needed.
- Observability expectations:
  - `callPayment` with `AXERVE_SANDBOX=true` logs `"[axerve]"` prefix is not currently present for sandbox (only for mock). The route logs `"Axerve payment OK"` or `"Axerve payment KO"` on result — these will appear in dev console during sandbox test, which is sufficient.

## Suggested Task Seeds (Non-binding)

- TASK-01: Update `apps/caryina/.env.example` to document all four Axerve env vars: `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, `AXERVE_SANDBOX`, with comments explaining what each controls and when sandbox vs mock is appropriate.
- TASK-02: Write `apps/caryina/docs/plans/test-order-runbook.md` — a step-by-step pre-launch test order checklist covering: (a) obtaining sandbox credentials from the Axerve merchant portal, (b) setting `.env.local` for sandbox mode (unset `AXERVE_USE_MOCK`, set `AXERVE_SANDBOX=true`, swap `AXERVE_SHOP_LOGIN` / `AXERVE_API_KEY` to sandbox values), (c) running a success test order with expected response shape, (d) running a decline test order with expected error response, (e) resetting to production credentials before going live. Include `MERCHANT_NOTIFY_EMAIL` note (set to test address during sandbox run).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `.env.example` updated with all four Axerve vars documented.
  - Runbook file present at `apps/caryina/docs/plans/test-order-runbook.md` with success and decline test procedures.
  - CI tests pass (no new failures introduced — verified by CI on PR).
- Post-delivery measurement plan:
  - Operator runs the sandbox test order checklist (success + decline) using the runbook. Outcome: merchant notification email received for success test; error response received for decline test. This is the operational completion gate.

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity** — all claims cite exact file paths and line numbers. `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` existence confirmed by reading `packages/axerve/src/index.ts`. `.env.example` absence of Axerve vars confirmed by reading the file.
2. **Boundary coverage** — Axerve SOAP integration boundary inspected. Security boundary (credentials in env, not in code) confirmed. Error paths (SOAP error → AxerveError, KO result, missing fields) all covered in existing tests.
3. **Testing/validation coverage** — existing unit tests verified by reading test files. Coverage gaps for sandbox (manual gate only) explicitly documented.
4. **Business validation coverage** — not applicable (code + runbook deliverable, not a hypothesis).
5. **Confidence calibration** — scores reflect the narrow scope (env documentation + runbook). Implementation confidence is high because no new code path is required.

### Confidence Adjustments

- Implementation raised from initial estimate of 80% → 95% after confirming `packages/axerve/src/index.ts` already implements both `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` paths. The gap is purely documentation, not code.
- Delivery-Readiness raised to 90% — the sole external dependency (sandbox credentials) does not block the code deliverable, only the actual test run.

### Remaining Assumptions

- Axerve's sandbox endpoint at `sandbox.gestpay.net` is live and accessible (standard assumption for payment processor sandboxes).
- Sandbox credentials are issued per merchant account and require a request to Axerve (standard pattern; cannot verify without operator action).
- Axerve test card `4111111111111111` works for success in their sandbox (standard Visa test PAN; the axerve package test suite also uses this value). Operator should cross-check against official Axerve sandbox documentation.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None for the code deliverable (`.env.example` update + runbook). Both tasks can be completed without sandbox credentials in hand.
  - The operational completion gate (actually running the sandbox test order) requires operator to obtain sandbox credentials from Axerve — this is an operator action, not a code-deliverable blocker. It is documented in the runbook task and in the open question above.
- Recommended next step: `/lp-do-plan hbag-axerve-sandbox-test-order --auto`
