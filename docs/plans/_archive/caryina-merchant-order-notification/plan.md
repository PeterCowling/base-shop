---
Type: Plan
Status: Archived
Domain: SELL
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-merchant-order-notification
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 92%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Merchant Order Notification Plan

## Summary

When a customer completes a payment at `POST /api/checkout-session`, the merchant receives no notification — the only way to discover a new order is to check the admin panel manually. This plan adds a fire-and-forget email notification to the payment success path using the existing `sendSystemEmail` function from `@acme/platform-core/email`. The email is sent after `deleteCart()` succeeds, before the success response is returned. Email failure is silently caught and must not alter the HTTP response. Two new test cases verify that the email is dispatched on success and that a failing email send does not affect the 200 response.

## Active tasks
- [x] TASK-01: Add merchant order notification email to checkout-session route — Complete (2026-02-27)
- [x] TASK-02: Add tests for order notification email — Complete (2026-02-27)

## Goals
- Send one email to `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"` every time `callPayment()` returns `{success: true}`.
- Include transaction ID, order total, currency, and a per-item summary (title, qty, unit price, line total) derived from the in-scope `cart` snapshot.
- Email failure must not change the HTTP response — the payment already succeeded.
- All new logic is covered by the existing Jest test file with two new test cases.
- Document `MERCHANT_NOTIFY_EMAIL` in `docs/.env.reference.md`.

## Non-goals
- Customer confirmation email (separate concern).
- Persisted order records or order management UI changes.
- Support for multiple recipients or configurable recipient at this stage.
- Complex HTML email templating beyond a functional order summary.

## Constraints & Assumptions
- Constraints:
  - `@acme/email` must NOT be added as a direct dependency of `apps/caryina` or `@acme/platform-core`. The only supported import path is `@acme/platform-core/email` → `sendSystemEmail`, which resolves `@acme/email` at runtime via the cyclic-dep workaround in `emailService.ts`.
  - `EMAIL_PROVIDER`, `GMAIL_USER`, and `GMAIL_PASS` are not set in `apps/caryina/.env.local` — the email will silently no-op in development (acceptable; `sendSystemEmail` throws on missing `EMAIL_PROVIDER`, which the outer `try/catch` absorbs).
  - `runtime = "nodejs"` is already set on the checkout route, so `server-only` imports from `@acme/platform-core` work without restriction.
- Assumptions:
  - The `cart` variable (assigned at line 45 of route.ts before the try block) is a complete in-memory snapshot — no second fetch is needed for the email body.
  - `MERCHANT_NOTIFY_EMAIL` with `peter.cowling1976@gmail.com` as the hardcoded fallback is the correct approach (follows the `stockAlert.server.ts` precedent with `STOCK_ALERT_RECIPIENT`).
  - Silently ignoring email failure is acceptable — the customer journey is not impacted.

## Inherited Outcome Contract

- **Why:** Merchant receives no notification when a customer places an order. Every completed payment is invisible to the shop operator until they manually check the admin panel.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** merchant_notified_per_order rises from 0 to 1.0 — every successful payment triggers a notification email to peter.cowling1976@gmail.com.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/caryina-merchant-order-notification/fact-find.md`
- Key findings used:
  - Insertion point: after `deleteCart(cartId)` (line 92), before `return successRes` (line 106) in `route.ts`.
  - `cart` is already in scope (line 45) before the try block — no re-fetch needed.
  - `sendSystemEmail` signature confirmed: `{ to: string, subject: string, html: string } → Promise<unknown>`. Throws if `EMAIL_PROVIDER` is unset.
  - `@acme/platform-core` already in `apps/caryina/package.json` deps — no new package dep needed.
  - Fire-and-forget catch pattern confirmed via `stockAlert.server.ts` precedent.
  - Jest mock pattern for `@acme/platform-core/email` is straightforward — matches existing mocks in route.test.ts.

## Proposed Approach
- Option A: Inline try/catch block in `route.ts` importing `sendSystemEmail` from `@acme/platform-core/email`, fire-and-forget after `deleteCart`.
- Option B: Extract to a helper function in a separate module.
- Chosen approach: Option A — the logic is ~10 LOC and is co-located with the only call site. Extraction to a helper would add indirection for no benefit at this scope. The precedent in `stockAlert.server.ts` is also inline.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add merchant notification email to checkout-session route | 93% | S | Complete (2026-02-27) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add tests for order notification email | 92% | S | Complete (2026-02-27) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single file edit; foundation for TASK-02 mock |
| 2 | TASK-02 | TASK-01 complete | Mock is only meaningful once the import exists in route.ts |

## Tasks

### TASK-01: Add merchant order notification email to checkout-session route
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/caryina/src/app/api/checkout-session/route.ts`, `docs/.env.reference.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** 4 files changed (route.ts, route.test.ts, docs/.env.reference.md, packages/platform-core/src/email.ts). sendSystemEmail exported from barrel. TypeScript passes.
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts`, `docs/.env.reference.md`, `[readonly] packages/platform-core/src/services/emailService.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 93%
  - Implementation: 97% — insertion point is exact (after `deleteCart`, before `return successRes`). Import path confirmed. Cart snapshot already in scope. No type changes.
  - Approach: 95% — fire-and-forget with try/catch is the correct pattern (identical to `stockAlert.server.ts`). `sendSystemEmail` is the canonical dispatch point.
  - Impact: 90% — every successful payment hits this path. Impact is deterministic once Gmail creds are provisioned in production.
- **Acceptance:**
  - `sendSystemEmail` is imported from `@acme/platform-core/email` — no direct `@acme/email` import anywhere in caryina.
  - Email is called with `to: process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"`.
  - Email subject contains the `shopTransactionId`.
  - Email HTML body contains each cart line (title, qty, unit price, line total) and a grand total.
  - `await sendSystemEmail(...)` is wrapped in `try { … } catch (err) { console.error("Order notification failed", ...) }`.
  - The call is placed after `deleteCart(cartId)` and before `return successRes`.
  - `docs/.env.reference.md` has a new row for `MERCHANT_NOTIFY_EMAIL`.
  - `pnpm typecheck` passes for `@apps/caryina`.
- **Validation contract (TC-01):**
  - TC-01-A: `sendSystemEmail` is called once with `to` matching env var fallback, `subject` containing the shopTransactionId, and `html` containing the cart item title — verified by TASK-02 tests.
  - TC-01-B: `sendSystemEmail` throws → route still returns `{ success: true }` 200 response — verified by TASK-02 TC-04-06.
  - TC-01-C: Payment KO path (result.success false) → `sendSystemEmail` is NOT called — verified by TASK-02 TC-04-07.
- **Execution plan:** Red → Green → Refactor
  1. Add import: `import { sendSystemEmail } from "@acme/platform-core/email";`
  2. Build the notification `try/catch` block with HTML body constructed from `Object.entries(cart)`, placed after the `deleteCart` call and before the `successRes` construction (or immediately before `return successRes` — either position is valid since `cart` is in scope and `successRes` is not yet consumed).
  3. Add `MERCHANT_NOTIFY_EMAIL` row to `docs/.env.reference.md`.
  4. Run `pnpm typecheck --filter @apps/caryina` — must pass.
- **Planning validation (required for M/L):**
  - None: S effort — simulation trace substitutes.
- **Scouts:**
  - Confirmed: `@acme/platform-core` in `apps/caryina/package.json` — verified directly.
  - Confirmed: `sendSystemEmail` exported from `@acme/platform-core/email` sub-path (`packages/platform-core/package.json` exports `"./email"`).
  - Confirmed: `cart` is in scope at line 45 before the outer try block; it is a complete `CartState` snapshot when success path is reached.
  - Confirmed: `runtime = "nodejs"` set at route.ts line 8.
- **Edge Cases & Hardening:**
  - `sendSystemEmail` throws synchronously (e.g., missing `EMAIL_PROVIDER`): caught by the try/catch. No uncaught exception.
  - `sendSystemEmail` rejects asynchronously: the `await` inside the try/catch ensures the rejection is caught. No unhandled promise rejection.
  - `cart` is empty: guarded at line 47 — we never reach the payment path with an empty cart. Not a concern at the notification site.
  - `MERCHANT_NOTIFY_EMAIL` unset: fallback `"peter.cowling1976@gmail.com"` ensures `to` is always a valid string.
- **What would make this >=90%:** Running `pnpm typecheck` after the edit and observing a real email sent from a production test order.
- **Rollout / rollback:**
  - Rollout: Deploy with `EMAIL_PROVIDER=smtp`, `GMAIL_USER`, `GMAIL_PASS`, and optionally `MERCHANT_NOTIFY_EMAIL` set in the production Cloudflare Worker secrets.
  - Rollback: Remove the notification try/catch block. Zero risk to the payment flow — the success response is constructed after the notification block.
- **Documentation impact:**
  - `docs/.env.reference.md` — add row for `MERCHANT_NOTIFY_EMAIL` (optional, defaults to `peter.cowling1976@gmail.com`).
- **Notes / references:**
  - Precedent: `packages/platform-core/src/services/stockAlert.server.ts` lines 91–96 — identical fire-and-forget catch pattern.
  - Cyclic dep note: `emailService.ts` uses `createRequire` runtime resolution to avoid a static `@acme/email` dep edge from `platform-core`. Never import `@acme/email` directly from caryina.

---

### TASK-02: Add tests for order notification email
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/caryina/src/app/api/checkout-session/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** 7/7 tests pass (TC-04-01 through TC-04-07). New tests: TC-04-06 (SMTP failure absorbed), TC-04-07 (KO path — no email).
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 95% — mock pattern is directly comparable to the existing `jest.mock("@acme/axerve")` and `jest.mock("@acme/platform-core/cartStore")` mocks already in the file.
  - Approach: 95% — three test cases cover the key branches (email dispatched on success, email failure absorbed, email not sent on payment KO).
  - Impact: 88% — test coverage proves fire-and-forget semantics. Actual SMTP delivery in CI is out of scope.
- **Acceptance:**
  - `jest.mock("@acme/platform-core/email", () => ({ sendSystemEmail: jest.fn() }))` added near top of test file, consistent with existing mock declarations.
  - `sendSystemEmail` extracted via `jest.requireMock` alongside existing mock extractions.
  - TC-04-01 (existing success test) extended with assertion: `expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({ to: expect.any(String), subject: expect.stringContaining("txn-001"), html: expect.stringContaining("Silver Ring") }))`.
  - New TC-04-06: `sendSystemEmail` mock throws → `POST` still returns 200 `{ success: true }`.
  - New TC-04-07: Axerve KO response (TC-04-03 scenario) → `sendSystemEmail` mock was NOT called.
  - All 7 checkout-session tests pass: `pnpm --filter @apps/caryina test`.
- **Validation contract (TC-02):**
  - TC-02-A: All 7 tests green (5 existing + 2 new).
  - TC-02-B: No TypeScript errors in the test file.
- **Execution plan:** Red → Green → Refactor
  1. Add `jest.mock("@acme/platform-core/email", ...)` block at the top of the mock declarations section.
  2. Extract `sendSystemEmail` from `jest.requireMock`.
  3. Extend TC-04-01 assertions to include `sendSystemEmail` call verification.
  4. Add TC-04-06: configure `sendSystemEmail` to throw, assert response is still 200.
  5. Add TC-04-07: configure `callPayment` to return KO, assert `sendSystemEmail` was not called.
  6. Run `pnpm --filter @apps/caryina test` — all 7 must pass.
- **Planning validation (required for M/L):**
  - None: S effort — simulation trace substitutes.
- **Scouts:**
  - Confirmed: existing mock pattern (`jest.mock` + `jest.requireMock`) is established in the file — three identical precedents already present.
  - Confirmed: `mockCartItem.sku.title` is `"Silver Ring"` — valid assertion anchor for html body content.
  - Confirmed: `callPayment` mock returns `transactionId: "txn-001"` in the success case — valid subject assertion anchor.
- **Edge Cases & Hardening:**
  - `jest.clearAllMocks()` is already called in `beforeEach` — `sendSystemEmail` mock state resets between tests automatically.
  - TC-04-06 must configure `sendSystemEmail` to throw *before* calling `POST` to confirm the catch branch — use `sendSystemEmail.mockRejectedValue(new Error("SMTP failure"))`.
- **What would make this >=90%:** Running the full test suite against the edited route file.
- **Rollout / rollback:**
  - Rollout: Tests are additive — no impact on non-test code.
  - Rollback: Revert test file changes alongside TASK-01 rollback.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Mock sub-path: `jest.mock("@acme/platform-core/email")` mocks the `./email` sub-path export, not the bare `@acme/platform-core` specifier. This matches how Jest resolves the import in route.ts.

## Risks & Mitigations
- `EMAIL_PROVIDER` / Gmail creds not provisioned in the production Cloudflare Worker: email silently fails. Mitigation: document required secrets; `console.error` on catch surfaces failures in Worker logs.
- `await sendSystemEmail(...)` omitted → rejection escapes catch block: mitigated by using `await` inside the try and by TC-04-06 which will fail if the rejection propagates.
- Cart deleted before email body is built: not possible — `cart` is captured at line 45 before the outer try block; the email body is built from the in-memory value, not by re-calling `getCart`.
- Static `@acme/email` import from caryina creates cyclic graph: mitigated by importing only `sendSystemEmail` from `@acme/platform-core/email`; `@acme/email` is never imported directly.

## Observability
- Logging:
  - `console.info("Order notification sent", { transactionId: shopTransactionId })` on successful `sendSystemEmail` call.
  - `console.error("Order notification failed", { transactionId: shopTransactionId, err })` on catch.
- Metrics:
  - None at this stage. Worker logs provide sufficient observability for an internal notification.
- Alerts/Dashboards:
  - None at this stage. Log monitoring in Cloudflare Dashboard is sufficient.

## Acceptance Criteria (overall)
- [ ] `apps/caryina/src/app/api/checkout-session/route.ts` imports `sendSystemEmail` from `@acme/platform-core/email` and calls it after `deleteCart`, wrapped in a fire-and-forget try/catch.
- [ ] Email recipient uses `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"`.
- [ ] Email subject contains the `shopTransactionId`.
- [ ] Email HTML body lists all cart line items (title, qty, unit price, line total) and a grand total.
- [ ] Email failure does not affect the HTTP response (200 `{ success: true }` is returned regardless).
- [ ] Payment KO path does not trigger an email send.
- [ ] All 7 checkout-session Jest tests pass.
- [ ] `pnpm typecheck` passes for `@apps/caryina`.
- [ ] `docs/.env.reference.md` has a row for `MERCHANT_NOTIFY_EMAIL`.

## Decision Log
- 2026-02-27: Chosen fire-and-forget inline try/catch in `route.ts` over extraction to a helper module — scope is ~10 LOC with a single call site; inline matches the `stockAlert.server.ts` precedent.
- 2026-02-27: Recipient via `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"` — hardcoded fallback prevents runtime error if unset; env var allows future operator override without a code change.
- 2026-02-27: HTML body (not plain-text) used — `sendSystemEmail` signature accepts `html` field and the subject instruction specifies HTML with line items and totals. A minimal, inline HTML string is sufficient; no external template needed.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 93% × 1 = 93
- TASK-02: 92% × 1 = 92
- Overall: (93 + 92) / (1 + 1) = **92%**

## Critique History

### Round 1 (2026-02-27)

**Critique angles evaluated:**

1. **Is fire-and-forget the right failure mode?** Yes. The payment has already been committed on the Axerve side by the time `callPayment()` returns `{success: true}`. Blocking the success response on email failure would present the customer with a misleading error screen for a merchant-internal concern. The `stockAlert.server.ts` precedent confirms this pattern is established in the codebase. Verdict: correct approach.

2. **Is the env var default safe?** Yes. `process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com"` evaluates to a valid string in all environments. In development, `sendSystemEmail` throws on missing `EMAIL_PROVIDER` before the `to` field is even used — caught by the outer try/catch. In production, the hardcoded fallback is the correct recipient. No runtime error is possible from an unset `MERCHANT_NOTIFY_EMAIL`. Verdict: safe.

3. **Does test coverage adequately verify fire-and-forget?** TC-04-06 explicitly tests that `sendSystemEmail.mockRejectedValue(...)` does not prevent the 200 success response. TC-04-07 verifies the negative path (KO response → no email). TC-04-01 extension verifies the email is called with correct args on success. Three distinct verification angles. Verdict: adequate.

4. **Risk of cyclic dependency?** No. The import chain is `route.ts → @acme/platform-core/email → sendSystemEmail (runtime req("@acme/email"))`. The static import at route.ts level is `@acme/platform-core/email`, which is already in caryina's workspace deps. The `@acme/email` package is never statically imported. The cyclic dep workaround in `emailService.ts` using `createRequire` is established and stable since commit `52fc86c537`. Verdict: no risk.

5. **Is the HTML body scope creep?** The fact-find non-goals state "HTML email templating beyond a clean plain-text body" as out of scope. The plan uses inline HTML string construction (not an external template), which is within the spirit of the constraint. The subject instruction explicitly specifies "Email body (HTML): order summary with line items". Verdict: acceptable scope, no creep.

6. **Is the insertion point precise?** The plan places the notification after `deleteCart(cartId)` (line 92) and before `return successRes` (line 106). This is the only correct location — cart is already deleted (idempotent concern), and the success response has not yet been returned. Building the email body from the `cart` snapshot already in scope means there is no risk of operating on a deleted cart. Verdict: precise.

**Credible verdict: PASS. Score: 4.5 / 5.**

No changes required. The plan is well-scoped, fully traced, and the critique surfaces no blocking concerns.
