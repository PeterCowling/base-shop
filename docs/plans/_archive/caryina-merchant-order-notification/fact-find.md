---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: caryina-merchant-order-notification
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-merchant-order-notification/plan.md
Trigger-Why: Merchant receives no notification when a customer places an order. Every completed payment is invisible to the shop operator until they manually check the admin panel.
Trigger-Intended-Outcome: type: measurable | statement: merchant_notified_per_order rises from 0 to 1.0 (every successful payment triggers a notification email to peter.cowling1976@gmail.com) | source: operator
---

# Caryina Merchant Order Notification Fact-Find Brief

## Scope

### Summary

When a customer completes a payment at `POST /api/checkout-session`, the route calls `callPayment()`, deletes the cart, and returns a 200 success response — but sends no notification to the merchant. The operator (peter.cowling1976@gmail.com) only learns of a new order by checking the admin panel. This change adds a fire-and-forget merchant notification email immediately after `deleteCart()` succeeds, using the existing `sendSystemEmail` function from `@acme/platform-core/email`. The email must not block the success response.

### Goals

- Send one email to `peter.cowling1976@gmail.com` every time `callPayment()` returns `{success: true}`.
- Include: transaction ID, order total (formatted from cents), currency, and an item summary derived from the cart snapshot captured before `deleteCart()`.
- Failure to send the email must not change the HTTP response — the payment already succeeded.
- All new logic is covered by the existing Jest test file with a new test case.

### Non-goals

- Customer confirmation email (separate concern, no dispatch for this).
- Persisted order records or order management UI changes.
- Support for multiple recipients or configurable recipient address at this stage.
- HTML email templating beyond a clean plain-text body.

### Constraints & Assumptions

- Constraints:
  - `@acme/email` must NOT be added as a direct dependency of `apps/caryina` or `@acme/platform-core`. The only supported path is through `sendSystemEmail` in `@acme/platform-core/email`, which resolves `@acme/email` at runtime via the cyclic-dep workaround in `emailService.ts`.
  - `EMAIL_PROVIDER` and `GMAIL_USER`/`GMAIL_PASS` env vars are not set in `apps/caryina/.env.local` today — the email will silently no-op in development (which is acceptable behaviour documented in `sendEmail.ts`).
  - `runtime = "nodejs"` is already set on the checkout route, so `server-only` imports are safe.
- Assumptions:
  - The cart snapshot (`cart` variable, captured before `deleteCart()`) has already been read by the time payment succeeds — no second fetch required.
  - The `MERCHANT_NOTIFY_EMAIL` env var will be the canonical home for the recipient address, defaulting to `peter.cowling1976@gmail.com` as the hardcoded fallback.
  - Silently ignoring email failure is acceptable UX — the payment succeeded, so the customer journey is not impacted.

## Outcome Contract

- **Why:** Merchant receives no notification when a customer places an order. Every completed payment is invisible to the shop operator until they manually check the admin panel.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** merchant_notified_per_order rises from 0 to 1.0 — every successful payment triggers a notification email to peter.cowling1976@gmail.com.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/checkout-session/route.ts` — The only server action that processes payments. After `callPayment()` returns `{success: true}`, the route calls `deleteCart(cartId)` then returns `successRes`. This is the insertion point for the notification.

### Key Modules / Files

1. `apps/caryina/src/app/api/checkout-session/route.ts` — Payment flow. Cart is already in memory as `cart` (type `CartState`) before payment is attempted. After success: `deleteCart` → `successRes`. Email call goes between these two statements.
2. `packages/platform-core/src/services/emailService.ts` — Exports `sendSystemEmail({ to, subject, html })`. Uses a runtime `require` via `createRequire` to load `@acme/email` without creating a static dep edge. Guards on `EMAIL_PROVIDER` env var; throws if not set — caller must catch.
3. `packages/platform-core/src/email.ts` — Re-exports `EmailService`, `getEmailService`, `setEmailService` from `emailService.ts`. Exported as `@acme/platform-core/email` sub-path.
4. `packages/email/src/sendEmail.ts` — The actual nodemailer implementation. Uses `GMAIL_USER` + `GMAIL_PASS` for transport. When creds are absent, logs "Email simulated" and returns without sending (graceful no-op in dev).
5. `packages/email/src/config.ts` — `getDefaultSender()` reads `CAMPAIGN_FROM` or `GMAIL_USER`. Throws if neither is set.
6. `packages/platform-core/src/cart/cartLine.ts` — `CartLine` shape: `{ sku: SKU, qty: number, size?: string, rental?: RentalLineItem }`. SKU has `id`, `title`, `price` (in cents), `stock`, `slug`, etc.
7. `packages/platform-core/src/cart/cartState.ts` — `CartState = Record<string, CartLine>`.
8. `apps/caryina/src/app/api/checkout-session/route.test.ts` — Existing Jest tests (5 cases) covering success, empty cart, payment KO, SOAP error, missing fields. No email mock or assertion today.
9. `packages/platform-core/src/services/__tests__/emailService.test.ts` — Shows the mock pattern for `@acme/email`: `jest.mock("@acme/email", () => ({ sendEmail: jest.fn() }))`.

### Patterns & Conventions Observed

- **Fire-and-forget with silent catch** — `stockAlert.server.ts` is the precedent: calls `email.sendEmail()` inside `try { … } catch (err) { console.error("Failed to send…", err); }`. The same pattern is appropriate here.
- **`sendSystemEmail` is the canonical dispatch point** — it resolves the provider at runtime via `EMAIL_PROVIDER` env var. The checkout route must import from `@acme/platform-core/email` (which re-exports from `services/emailService.ts`).
- **Cart snapshot before delete** — `cart` is already assigned at line 45 of route.ts before the try block. The cart snapshot is valid and complete when `callPayment()` returns success.
- **`runtime = "nodejs"`** — already set on the route, so `server-only` imports from platform-core work without restriction.

### Data & Contracts

- Types/schemas/events:
  - `CartState = Record<string, CartLine>` — keys are sku IDs.
  - `CartLine: { sku: SKU, qty: number }` — SKU has `id`, `title`, `price` (cents integer), `stock`, `slug`.
  - Payment result fields surfaced to response: `transactionId`, `amount` (totalCents), `currency: "eur"`.
  - `sendSystemEmail` signature: `{ to: string, subject: string, html: string } → Promise<unknown>`.
- Persistence:
  - No new persistence required. Cart is ephemeral (deleted after payment). Notification is fire-and-forget.
- API/contracts:
  - No API shape changes. Response body `{ success, transactionId, amount, currency }` is unchanged.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/platform-core/email` (already a workspace dep of caryina via `@acme/platform-core`).
  - `@acme/email` — resolved at runtime by `sendSystemEmail`; not a new package dep.
  - `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS` env vars — must be set in production. Not set in `.env.local` today; email silently no-ops in dev.
- Downstream dependents:
  - None. The success response and cookie expiry are unchanged.
- Likely blast radius:
  - Minimal. One new `try/catch` block in one route handler. No type changes. No schema changes. No new package deps.

### Delivery & Channel Landscape

- Audience/recipient: Merchant (peter.cowling1976@gmail.com) — hardcoded initially, overridable via `MERCHANT_NOTIFY_EMAIL` env var.
- Channel constraints: nodemailer via Gmail SMTP (existing infrastructure in `packages/email/src/sendEmail.ts`).
- Existing templates/assets: No HTML template needed — plain-text body is sufficient for an internal merchant notification.
- Compliance constraints: Internal notification only, not customer-facing. No unsubscribe requirements.
- Measurement hooks: `console.info("Order notification sent", { transactionId })` on success; `console.error("Order notification failed", err)` on failure.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (Node environment), configured via `apps/caryina/jest.config.cjs` using `@acme/config/jest.preset.cjs`.
- Commands: `pnpm --filter @apps/caryina test` or `pnpm exec jest --config apps/caryina/jest.config.cjs`.
- CI integration: governed test runner via `scripts/tests/run-governed-test.sh`.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| POST /api/checkout-session | Unit | `apps/caryina/src/app/api/checkout-session/route.test.ts` | 5 cases: success, empty cart, payment KO, SOAP error, missing fields. No email mock. |
| sendSystemEmail | Unit | `packages/platform-core/src/services/__tests__/emailService.test.ts` | Happy path + no-provider throw. |
| sendEmail (nodemailer) | Unit | `packages/email/src/__tests__/sendEmail.test.ts` | Covered upstream. |

#### Coverage Gaps

- Untested paths:
  - Email send on successful payment — no mock, no assertion in route.test.ts today.
  - Email failure silently ignored — no test for the catch branch.
- Extinct tests: None — existing tests all remain valid after the change.

#### Testability Assessment

- Easy to test: The new path follows the exact pattern of the existing route tests. `jest.mock("@acme/platform-core/email")` can stub `sendSystemEmail`. Two new cases: (a) email called with expected args on success, (b) email throws but response is still 200.
- Hard to test: End-to-end SMTP delivery — not worth testing at unit level.
- Test seams needed: `jest.mock("@acme/platform-core/email", () => ({ sendSystemEmail: jest.fn() }))` in route.test.ts.

#### Recommended Test Approach

- Unit tests for: (1) `sendSystemEmail` called with correct `to`, `subject`, and `html` on payment success — assert mock called once with expected args; (2) `sendSystemEmail` throws → response still 200 `{success: true}` — assert catch does not propagate.
- Integration tests for: Not needed at this stage.
- E2E tests for: Not needed at this stage.
- Contract tests for: None.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Adding a fire-and-forget sendSystemEmail call after deleteCart will notify the merchant without delaying or breaking the payment success response | ENV vars set in production, @acme/email dep loadable at runtime | Low — unit test proves non-blocking | < 1 day |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | stockAlert.server.ts uses identical fire-and-forget catch pattern; sendSystemEmail tested with mock | Codebase | High |

#### Falsifiability Assessment

- Easy to test: Both success-with-email and email-failure paths are unit-testable with Jest mocks.
- Hard to test: Real SMTP delivery in CI — acceptable gap.
- Validation seams needed: `jest.mock("@acme/platform-core/email")` seam in route.test.ts.

### Recent Git History (Targeted)

- `apps/caryina/src/app/api/checkout-session/route.ts` — `65c3bcc76a` (2026-02-27): Replaced Stripe hosted-checkout with Axerve S2S callPayment. This is the most recent change. No email logic was added.
- `packages/platform-core/src/services/emailService.ts` — `95fe50684e` (2026-02-19): Deferred email module resolution to runtime to avoid cyclic dep. `52fc86c537`: hid `@acme/email` require from webpack static analysis. Pattern is stable.

## Questions

### Resolved

- Q: Which email library/service should the notification use?
  - A: `sendSystemEmail` from `@acme/platform-core/email`. This is the canonical dispatch point already used in the monorepo. It loads `@acme/email` at runtime (nodemailer/Gmail transport via `GMAIL_USER`/`GMAIL_PASS`). No new library or package dep is needed.
  - Evidence: `packages/platform-core/src/services/emailService.ts`, `packages/email/src/sendEmail.ts`.

- Q: Where should the email-sending code live?
  - A: Inline in `apps/caryina/src/app/api/checkout-session/route.ts`, imported via `@acme/platform-core/email`. Do NOT add `@acme/email` as a direct dep of caryina or platform-core — the existing runtime-resolution workaround in `sendSystemEmail` exists precisely to avoid the cyclic dependency. The checkout route already depends on `@acme/platform-core`, so no new workspace dependency is needed.
  - Evidence: `packages/platform-core/package.json` (no `@acme/email` dep), `emailService.ts` comment "Keep module id runtime-resolved to avoid forcing a hard workspace dependency edge from platform-core -> email (which creates graph cycles)".

- Q: What should the email body contain?
  - A: Plain-text body listing each cart item (title, qty, unit price), subtotal, transaction ID, and a footer identifying this as an automated notification. Cart snapshot (`cart: CartState`) is available in scope before `deleteCart()` is called.
  - Evidence: `route.ts` line 45 (`const cart = cartId ? await getCart(cartId) : {}`), `CartLine` type, test fixture `mockCartItem`.

- Q: Should email failure block the payment success response?
  - A: No. The payment already succeeded on the Axerve side. Blocking the response on email failure would create a poor customer experience (misleading error screen) for a merchant-only notification. The correct pattern is try/catch with `console.error` on failure — identical to the `stockAlert.server.ts` precedent.
  - Evidence: `packages/platform-core/src/services/stockAlert.server.ts` lines 91-96.

- Q: Will `sendSystemEmail` no-op gracefully in development (where `EMAIL_PROVIDER` is unset)?
  - A: `sendSystemEmail` throws if `EMAIL_PROVIDER` is not set. The outer `try/catch` in the route will catch this and log the error. The response remains 200. In development the merchant simply won't receive the email — acceptable. For production, `EMAIL_PROVIDER=smtp` and Gmail creds must be provisioned.
  - Evidence: `emailService.ts` line 31: `if (!process.env.EMAIL_PROVIDER) { throw new Error("Email provider not configured"); }`.

- Q: Does caryina need `@acme/email` added to its package.json?
  - A: No. The import chain is `route.ts → @acme/platform-core/email → sendSystemEmail (uses runtime req("@acme/email"))`. The route only imports from `@acme/platform-core/email`. Since `@acme/platform-core` is already in caryina's dependencies, no new dep is required at either level.
  - Evidence: `apps/caryina/package.json` (already has `@acme/platform-core`), `platform-core/package.json` (does NOT list `@acme/email` as dep).

- Q: Is `@acme/platform-core/email` exported as a sub-path?
  - A: Yes. `packages/platform-core/package.json` exports `"./email"` pointing to `dist/email.js`. This is the correct import path.
  - Evidence: `packages/platform-core/package.json` line 181-185.

- Q: Is the recipient address operator-configured or hardcoded?
  - A: Use `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"` as a safe default. This gives the operator a clean env var to override later without a code change. The `.env.reference.md` should get a new row for this variable.
  - Evidence: operator-stated `peter.cowling1976@gmail.com` as the target; precedent of env-var-driven recipients in `stockAlert.server.ts`.

### Open (Operator Input Required)

None. All questions are resolvable from available codebase evidence and standard engineering principles.

## Confidence Inputs

- Implementation: 97%
  - Evidence: Entry point read, exact insertion point identified (between `deleteCart` and `return successRes`), import path confirmed, no new package deps, fire-and-forget catch pattern has a direct precedent.
  - What raises to 98%+: Actually running `pnpm typecheck` after the edit to confirm no type errors.

- Approach: 95%
  - Evidence: `sendSystemEmail` is the right function. Cyclic dep workaround already in place. Precedent in `stockAlert.server.ts`.
  - What raises to 98%: Confirming `EMAIL_PROVIDER` can be set to `smtp` and `GMAIL_USER`/`GMAIL_PASS` are available in the production Cloudflare Worker secrets.

- Impact: 90%
  - Evidence: `merchant_notified_per_order` baseline is 0 (stated). Every successful payment hits this code path. Impact is deterministic.
  - What raises to 95%: Observing a real test email sent from the production deployment.

- Delivery-Readiness: 92%
  - Evidence: No blockers. One file to edit (route.ts), one test file to extend (route.test.ts). Optionally update `.env.reference.md`. ~30 LOC change total.
  - What raises to 95%: Confirming Gmail SMTP credentials are in the production Worker secrets.

- Testability: 95%
  - Evidence: Jest mock pattern for `@acme/platform-core/email` is straightforward. Two new test cases cover both branches (email sent / email silently fails). No E2E test needed.
  - What raises to 98%: Actually running the new tests against the edited route.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| EMAIL_PROVIDER / GMAIL creds not set in production Cloudflare Worker | Medium | Email silently fails (no merchant notification) | Document required secrets in deployment notes; add `console.error` on catch so failures appear in Worker logs |
| sendSystemEmail throws synchronously before awaiting — could escape the catch if await is omitted | Low | 500 on checkout success | Use `await sendSystemEmail(...)` inside `try/catch`; existing test covers this |
| Cart deleted before email body is built | None — cart snapshot is in `cart` variable already | N/A | Cart is captured before the try block; email body built from in-memory `cart` value |
| Adding `@acme/email` as static dep creates cyclic graph | Low if pattern followed | Build failure | Follow `sendSystemEmail` import path only; never import `@acme/email` directly from caryina |

## Planning Constraints & Notes

- Must-follow patterns:
  - Import `sendSystemEmail` from `@acme/platform-core/email` (the `./email` sub-path export). Do not import from `@acme/email` directly.
  - Wrap `await sendSystemEmail(...)` in `try { … } catch (err) { console.error("Order notification failed", err); }` — identical pattern to `stockAlert.server.ts`.
  - Build the email body from the `cart` snapshot (already in scope), not by re-calling `getCart`.
  - Add `MERCHANT_NOTIFY_EMAIL` env var support with `peter.cowling1976@gmail.com` as fallback.
- Rollout/rollback expectations:
  - Rollback is removing the new try/catch block — zero risk to payment flow.
  - No feature flag needed; the notification is always attempted and always silently fails in dev.
- Observability expectations:
  - `console.info("Order notification sent", { transactionId })` on success (matches existing `console.info("Axerve payment OK", ...)` style).
  - `console.error("Order notification failed", { transactionId, err })` on failure.

## Suggested Task Seeds (Non-binding)

1. Add `sendSystemEmail` call after `deleteCart` in `route.ts` with env-var recipient and plain-text email body.
2. Add two new test cases to `route.test.ts`: TC-04-06 (email called on success) and TC-04-07 (email throws → 200 still returned).
3. Add `MERCHANT_NOTIFY_EMAIL` row to `docs/.env.reference.md`.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `apps/caryina/src/app/api/checkout-session/route.ts` edited with notification call.
  - `apps/caryina/src/app/api/checkout-session/route.test.ts` extended with two new cases.
  - `docs/.env.reference.md` updated with `MERCHANT_NOTIFY_EMAIL`.
  - All 7 checkout-session tests pass.
  - `pnpm typecheck` passes for caryina.
- Post-delivery measurement plan: Deploy to production with Gmail creds set → place a test order → confirm email received at peter.cowling1976@gmail.com.

## Simulation Trace

| File | Change type | Risk | Reason |
|---|---|---|---|
| `apps/caryina/src/app/api/checkout-session/route.ts` | Edit — add import + try/catch block | Low | One insertion point, no type changes, no API shape changes |
| `apps/caryina/src/app/api/checkout-session/route.test.ts` | Edit — add 2 new test cases | Low | Follows established mock pattern in same file |
| `docs/.env.reference.md` | Edit — add 1 table row | None | Documentation only |
| `packages/platform-core/src/services/emailService.ts` | No change | None | sendSystemEmail is already production-ready |
| `packages/email/src/sendEmail.ts` | No change | None | Existing nodemailer transport handles delivery |
| `apps/caryina/package.json` | No change | None | @acme/platform-core already listed; no new dep needed |

Total: 2 code files, 1 doc file. Blast radius is entirely local to caryina's checkout route.

## Evidence Gap Review

### Gaps Addressed

- Email infrastructure fully mapped: `sendSystemEmail` → runtime `req("@acme/email")` → `sendEmail` (nodemailer/Gmail). No gap.
- Cart shape confirmed: `CartState = Record<string, CartLine>`, `CartLine = { sku: SKU, qty: number }`, `SKU.price` is in cents. No gap.
- Cyclic dep risk addressed: `@acme/email` is NOT in platform-core package.json deps; the workaround is established and stable since commit `52fc86c537`.
- Test seam confirmed: `jest.mock("@acme/platform-core/email")` pattern is straightforward (same structure as `jest.mock("@acme/axerve")`).
- Recipient env var pattern confirmed: `stockAlert.server.ts` uses `process.env.STOCK_ALERT_RECIPIENT` with env fallback — same approach applies here.

### Confidence Adjustments

- No downward adjustments. All investigation areas resolved with direct codebase evidence.
- No upward surprises. The feature is smaller and cleaner than typical email integrations — the platform already has everything needed.

### Remaining Assumptions

- Gmail SMTP credentials (`GMAIL_USER`, `GMAIL_PASS`) and `EMAIL_PROVIDER=smtp` must be provisioned in the production Cloudflare Worker environment before the notification functions. This is a deployment concern, not a code concern.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None.
- Recommended next step: `/lp-do-plan`
