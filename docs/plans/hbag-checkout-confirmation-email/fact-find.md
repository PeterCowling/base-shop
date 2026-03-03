---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: hbag-checkout-confirmation-email
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
artifact: fact-find
Dispatch-ID: IDEA-DISPATCH-20260228-0073
Trigger-Why: Close a launch-readiness gap: without a customer confirmation email, a real order can disappear operationally if the buyer forgets the purchase, misplaces their card statement, or needs to contact support. This was flagged in the worldclass-scan as a prerequisite for full-confidence pre-launch readiness.
Trigger-Intended-Outcome: operational | Buyer receives a transactional confirmation email within seconds of payment success, containing order summary, transaction ID, and next-steps — so no real customer order can disappear operationally.
---

# HBAG Checkout Confirmation Email Fact-Find Brief

## Scope

### Summary

Add a customer order confirmation email to the Caryina checkout flow (HBAG shop). Currently, payment success sends only a merchant notification email via fire-and-forget; the buyer receives no email and the success page shows only a generic "Order confirmed" message with no order reference. The change inserts a second `sendSystemEmail` call after the merchant notification, addressed to `cardFields.buyerEmail`, with a templated HTML body containing the order summary, transaction IDs, and next-steps.

### Goals

- Buyer receives a transactional confirmation email immediately after payment success.
- Email body includes: itemised order summary, total amount, `shopTransactionId`, `result.transactionId` (Axerve ref), and a "continue shopping" link.
- Email is fire-and-forget (same pattern as merchant notification) — must never affect the payment response latency or success status.
- `buyerEmail` field remains optional at the form level but email is sent only when the field is non-empty.

### Non-goals

- Making `buyerEmail` mandatory at the form level (would require validation logic changes in `CheckoutClient.client.tsx` and may introduce friction before launch — the operator has not specified this requirement).
- Redesigning the success page layout.
- Localisation of email body (English-only for v1; HBAG is founder-led and pre-scale).
- Unsubscribe / marketing compliance (this is a transactional confirmation, not a marketing email).
- New email provider or infrastructure changes — the existing `sendSystemEmail` / nodemailer / `@acme/email` stack is the correct delivery path.

### Constraints & Assumptions

- Constraints:
  - `sendSystemEmail` is the established email dispatch function for this app; it must be reused.
  - Delivery infrastructure (Gmail SMTP via nodemailer) is configured at the `.env.example` level and tested in CI. No new env vars needed for delivery; `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS` are already declared.
  - The change must be fire-and-forget — cannot block or affect the `NextResponse` returned to the client.
  - Existing route tests (7 test cases, TC-04-01 through TC-04-07) must continue to pass. New tests must cover customer email path.
- Assumptions:
  - `buyerEmail` is available on `cardFields` after `parseCardFields()` — confirmed by code inspection: field is typed `buyerEmail?: string` and populated when the form sends it.
  - The merchant email HTML template pattern (inline `<table>` with item lines, total, and transaction ID) is the correct baseline to adapt for the customer email. All user-supplied strings interpolated into HTML (e.g. `line.sku.title`, `cardFields.buyerName`) must be escaped using `escapeHtml` from `@acme/email` to prevent HTML injection.
  - No "from address" change is needed: `EMAIL_FROM` / `getDefaultSender()` is already configured and used by `sendEmail`.
  - Email delivery is verified in CI at the unit/mock level only (`sendSystemEmail` delegation is mocked; no real SMTP transport is exercised in CI). Real-credential delivery is a manual pre-launch smoke test step.

## Outcome Contract

- **Why:** Close a launch-readiness gap so a real customer order cannot disappear operationally — identified in the worldclass-scan for HBAG pre-launch readiness.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Buyer receives a transactional confirmation email within seconds of payment success, containing order summary, transaction ID, and next-steps — so no real customer order can disappear operationally.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/api/checkout-session/route.ts` — The sole POST handler for checkout. Payment success block (line 92–133) is the insertion point. Currently: fires one `void sendSystemEmail(...)` to the merchant, then returns the success response. Customer email insertion goes immediately after the merchant fire-and-forget call.

### Key Modules / Files

- `apps/caryina/src/app/api/checkout-session/route.ts` — Primary change file. Contains `cardFields.buyerEmail` (optional, already parsed), `shopTransactionId`, `result.transactionId`, `totalCents`, `itemLines` HTML, and cart contents — all inputs needed for the customer email template.
- `apps/caryina/src/app/api/checkout-session/route.test.ts` — 7 existing tests (TC-04-01 through TC-04-07). TC-04-01 verifies `sendSystemEmail` is called once; TC-04-06 verifies email failure does not break success response; TC-04-07 verifies email is not called on KO. Tests will need extension for the customer email path.
- `packages/platform-core/src/services/emailService.ts` — `sendSystemEmail({ to, subject, html })` function. Signature: `{ to: string; subject: string; html: string }`. Dynamic `require` to `@acme/email` at runtime to avoid cycle.
- `packages/platform-core/src/email.ts` — Re-export barrel: `{ getEmailService, sendSystemEmail, setEmailService }` from `./services/emailService`. Import path used in route: `@acme/platform-core/email`.
- `packages/email/src/sendEmail.ts` — Underlying `sendEmail(to, subject, body, attachments?)` via nodemailer/Gmail SMTP. Called by `sendSystemEmail` at runtime.
- `packages/email/src/index.ts` — `@acme/email` entry: exports `sendEmail`. Also registers `setEmailService` on import (circular-safe via dynamic require).
- `apps/caryina/.env.example` — Email env config: `EMAIL_PROVIDER=gmail`, `MERCHANT_NOTIFY_EMAIL`, `GMAIL_USER`, `GMAIL_PASS`. No additional env vars required for customer email.
- `apps/caryina/src/app/[lang]/success/page.tsx` — Success page: generic "Order confirmed" message, no order reference. Not in scope for this change (email carries the reference; success page is separate work if needed).
- `apps/caryina/src/app/[lang]/checkout/CheckoutClient.client.tsx` — Client form: `buyerEmail` input rendered as optional (no `required` attribute). Field is sent in `fetch` body as `buyerEmail: card.buyerEmail` (may be empty string).

### Patterns & Conventions Observed

- **Fire-and-forget email**: `void sendSystemEmail(...).catch(err => console.error(...))` — must be replicated for customer email.
- **Inline HTML email template**: merchant email uses inline `<table>` with `border`, `cellpadding`, `cellspacing` and item rows built via `Array.map().join("")`. Same pattern should be used for customer email. All user-supplied fields interpolated into HTML (e.g. `line.sku.title`, `cardFields.buyerName`) must be passed through `escapeHtml` from `@acme/email` — already exported: `export declare function escapeHtml(value: string): string`.
- **Optional buyerEmail guard**: `parseCardFields` returns `buyerEmail?: string | undefined`. Route must guard with a trimmed + format-valid check before sending: `const recipientEmail = cardFields.buyerEmail?.trim(); if (recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))` (or delegate to the email schema in `sendEmail.ts` which validates `to` via `z.string().email()`). A simple truthy guard on the raw value is insufficient — whitespace-only or malformed strings will pass it and cause `sendEmail` to throw a Zod validation error.
- **i18n-exempt comments**: all console.error/info calls and machine-readable API error strings carry `// i18n-exempt` comments per project convention.

### Data & Contracts

- Types/schemas/events:
  - `CardFields.buyerEmail?: string` — optional, populated by `parseCardFields` when present in body.
  - `sendSystemEmail({ to: string; subject: string; html: string }): Promise<unknown>` — confirmed signature from `packages/platform-core/src/services/emailService.ts`.
  - `callPayment` result: `{ success: boolean; transactionId?: string; bankTransactionId?: string; errorCode?: string; errorDescription?: string }` — `result.transactionId` is the Axerve-side ref available in scope at insertion point.
- Persistence: None — no database writes or new state required.
- API/contracts: No new API surface. The POST response shape (`{ success, transactionId, amount, currency }`) is unchanged.

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/platform-core/email` → `sendSystemEmail` (already imported)
  - `@acme/email` → `sendEmail` (resolved at runtime — no new dep)
  - `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS` env vars — already declared in `.env.example`
- Downstream dependents:
  - No consumers of the route response shape change (response is identical).
  - Buyer inbox: receives a new email on successful checkout where `buyerEmail` was provided.
- Likely blast radius: Single file change in `route.ts`. Cart, payment, and success page flows are unaffected. A new side effect is introduced (a second `sendSystemEmail` call on success paths with non-empty `buyerEmail`); failure is swallowed via `.catch()`, so the happy path response is not at risk — but the additional call is a new failure mode logged via `console.error`.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest, `@testing-library/react` (for CheckoutClient), `NextRequest` mock pattern (for route handler tests)
- Commands: Tests run in CI only per repo policy (AGENTS.md). CI feedback via `gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId')`. Do not run Jest locally.
- CI integration: Yes — caryina test suite runs in CI as the source of truth for pass/fail gating.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `POST /api/checkout-session` | Unit (Jest) | `route.test.ts` | 7 tests: success, empty cart, KO, SOAP error, missing fields, email failure, KO-no-email |
| `CheckoutClient` form | Unit (Jest/RTL) | `CheckoutClient.test.tsx` | 5 tests: success redirect, failure error, network error, validation, empty cart |
| `sendSystemEmail` | Unit (Jest) | `packages/platform-core/src/services/__tests__/emailService.test.ts` | Provider delegation and error path |

#### Coverage Gaps

- Untested paths:
  - Customer confirmation email is called when `buyerEmail` is non-empty — **no test exists** (TC-04-01 only asserts merchant `sendSystemEmail` was called once, matching merchant address).
  - Customer email NOT called when `buyerEmail` is empty/absent — **no test exists**.
  - Customer email failure does not break success response (same pattern as TC-04-06 for merchant, but for customer email call) — **no test exists**.
- Extinct tests: None — all 7 existing tests remain valid after the change. TC-04-01's assertion `expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({ to: expect.stringContaining("@") }))` will need adjustment to distinguish merchant vs customer calls (e.g., `toHaveBeenNthCalledWith` or `toHaveBeenCalledTimes(2)`).

#### Testability Assessment
- Easy to test: All inputs are in-scope at the insertion point (`cardFields.buyerEmail`, `totalCents`, `itemLines`, `shopTransactionId`, `result.transactionId`). `sendSystemEmail` is already mocked in the test file.
- Hard to test: Real email delivery (SMTP) — but that is not tested today either. Mock pattern suffices.
- Test seams needed: TC-04-01 mock assertion must be updated from a single `toHaveBeenCalledWith` to use `toHaveBeenNthCalledWith` or `toHaveBeenCalledTimes(2)` to distinguish merchant and customer calls.

#### Recommended Test Approach
- Unit tests for: (a) success + buyerEmail provided → `sendSystemEmail` called twice (merchant + customer); (b) success + buyerEmail empty → `sendSystemEmail` called once (merchant only); (c) customer email failure → success response still returned (extend TC-04-06 pattern or add TC-04-08).
- Integration/E2E tests for: Not required for this scope.

### Recent Git History (Targeted)

- `apps/caryina/src/app/api/checkout-session/route.ts`:
  - `1a92b19` — `feat(caryina): send merchant order notification email on payment success` — Added fire-and-forget merchant notification. This commit established the exact pattern to replicate for the customer email.
  - `65c3bcc` — `feat(caryina): IMPLEMENT-04 — replace checkout route with Axerve S2S` — Current Axerve integration and route shape.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Route entry point and insertion point | Yes | None | No |
| `sendSystemEmail` signature and import path | Yes | None | No |
| `cardFields.buyerEmail` availability at insertion point | Yes | None | No |
| Email infrastructure (provider, env vars) | Yes | None | No |
| Fire-and-forget pattern reuse | Yes | None | No |
| Test coverage gap for new customer email path | Yes | [Missing domain coverage][Minor]: TC-04-01 assertion counts `sendSystemEmail` calls without distinguishing merchant vs customer — must be updated. New tests required for customer email paths. | No (advisory — plan will add tests) |
| Success page and client impact | Yes | None | No |
| `buyerEmail` guard — trim + format validation required | Yes | [Missing precondition][Major]: simple truthy guard passes whitespace-only strings causing Zod throw in `sendEmail.ts`. Must trim and validate format before dispatch. | No (advisory — addressed in constraints and task seeds) |
| HTML injection guard required for email template | Yes | [Integration boundary not handled][Major]: merchant template interpolates raw `line.sku.title` into HTML. `escapeHtml` from `@acme/email` must be called on all interpolated user-supplied values. | No (advisory — addressed in constraints and task seeds) |

No Critical simulation findings. One Minor advisory: existing TC-04-01 assertion will need updating when the second `sendSystemEmail` call is added.

## Questions

### Resolved

- Q: Is `sendSystemEmail` / nodemailer the right delivery path for the customer email?
  - A: Yes. It is the only email delivery mechanism configured and tested in the Caryina app. `sendSystemEmail` is already imported in `route.ts`. The `.env.example` shows Gmail SMTP as the v1 approach with Resend as a future upgrade path. No infrastructure change is needed.
  - Evidence: `apps/caryina/.env.example`, `packages/platform-core/src/services/emailService.ts`, `packages/email/src/sendEmail.ts`

- Q: Is `buyerEmail` available in the route at the point of email dispatch, and how should the guard be implemented?
  - A: Yes. `parseCardFields` populates `cardFields.buyerEmail?: string`. It is in scope throughout the payment success block. A trim + format-validation guard is required before dispatching: `const recipientEmail = cardFields.buyerEmail?.trim(); if (recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))`. A simple truthy guard is insufficient because the form submits an empty string `""` as the default value, and whitespace-only strings are truthy but will cause `sendEmail`'s Zod schema to throw.
  - Evidence: `apps/caryina/src/app/api/checkout-session/route.ts` lines 27–39, 92–121; `packages/email/src/sendEmail.ts` (Zod `z.string().email()` validation on `to`); `CheckoutClient.client.tsx` (`buyerEmail` defaults to `""`)

- Q: Must `buyerEmail` be made mandatory at checkout?
  - A: Not a requirement of this dispatch. The dispatch specifies adding the confirmation email; mandatory email field is a separate decision requiring operator input on UX trade-offs. Default assumption: keep optional. Send email only when provided. This preserves the guest checkout path.
  - Evidence: `next_scope_now` in dispatch packet; `CheckoutClient.client.tsx` (field rendered without `required` attr)

- Q: Are there i18n / localisation requirements for the email body?
  - A: Not for v1. HBAG is a founder-led pre-scale operation. English-only email body is consistent with the current merchant notification (also English-only) and the success page.
  - Evidence: `apps/caryina/src/app/[lang]/success/page.tsx` (English-only body copy); `route.ts` merchant email (English-only)

- Q: Does the existing email template (merchant notification) need to be extracted or shared?
  - A: No. Both emails are inline HTML in the same function. Extraction to a shared template helper is desirable long-term but out of scope here — it would increase plan complexity and blast radius with no launch-blocking benefit.

### Open (Operator Input Required)

No genuinely operator-only questions remain. All decisions above are resolvable from evidence and documented constraints.

## Confidence Inputs

- **Implementation: 95%** — Insertion point is fully identified, all variables are in scope, the delivery path is confirmed, and the pattern (fire-and-forget `void sendSystemEmail(...).catch(...)`) is already in use in the same function. No new infrastructure required.
  - Raises to >=80: Already met.
  - Raises to >=90: Already met. Would reach ~98% only with a live end-to-end delivery test (requires real Gmail creds, out of CI scope).

- **Approach: 92%** — Fire-and-forget is the correct pattern (matches merchant notification; email failure must not affect payment response). Guard requires trim + format validation before dispatch (not a simple truthy check — whitespace-only or malformed non-empty strings must be excluded to avoid triggering Zod validation errors in `sendEmail`). Inline HTML template is consistent with existing pattern, with `escapeHtml` required on all user-supplied interpolated values.
  - Raises to >=80: Already met.
  - Raises to >=90: Already met.

- **Impact: 80%** — Customer confirmation email directly addresses the launch-readiness gap. Impact is operational: eliminates the "order can disappear" risk when a customer provides their email. Impact limited by optional email field (customers who skip email still get no confirmation). If field is made mandatory later, impact rises to 100%.
  - Raises to >=80: Already met.
  - Raises to >=90: Make `buyerEmail` required at form level (separate decision, operator-gated).

- **Delivery-Readiness: 95%** — All code dependencies resolved, no new env vars, no new packages, no migration. Single file change. Tests are well-understood. Plan can begin immediately.
  - Raises to >=80: Already met.
  - Raises to >=90: Already met.

- **Testability: 90%** — `sendSystemEmail` is already mocked in `route.test.ts`. New assertions require only distinguishing the two calls (merchant vs customer) using `toHaveBeenNthCalledWith`. TC-04-01 update is straightforward.
  - Raises to >=80: Already met.
  - Raises to >=90: Already met.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| HTML injection via user-supplied strings in email body | Medium (product title / buyer name is merchant-controlled but the risk class exists) | Medium | Use `escapeHtml` from `@acme/email` on all interpolated values: `line.sku.title`, `cardFields.buyerName`. Already exported from the package. |
| Customer email sent to whitespace-only or malformed email string | Low (most users either provide a valid email or leave blank; form has `type="email"`) | Low (causes Zod validation error inside `sendEmail`; caught by `.catch()` and logged) | Guard: trim + regex/Zod validation before dispatch. `sendEmail` already validates via `z.string().email()` so the call will throw and be caught — but best to validate before calling to avoid unnecessary error logs. |
| TC-04-01 fails after adding second `sendSystemEmail` call | Medium | Low (caught in CI) | Update TC-04-01 to use `toHaveBeenNthCalledWith(1, ...)` and add TC for second call |
| Email delivery failure surfaces in logs but not to buyer | Low | Low (fire-and-forget is intentional; buyer has no indication either way) | Acceptable for v1; a failed-delivery retry or status page note is post-launch work |
| Axerve `transactionId` is undefined on some success paths | Low | Low | `result.transactionId` is present in all test mocks and expected from Axerve on success; template should handle `?? ""` gracefully |

## Planning Constraints & Notes

- Must-follow patterns:
  - Fire-and-forget: `void sendSystemEmail(...).catch((err: unknown) => { console.error(...) // i18n-exempt })` — no `await`, no return value used.
  - i18n-exempt comment required on all developer log strings.
  - `buyerEmail` guard: trim + email format validation before dispatching. Simple truthy guard is insufficient (whitespace-only strings pass it).
  - HTML escaping: use `escapeHtml` from `@acme/email` on all user-supplied values interpolated into the email HTML body.
- Rollout/rollback expectations:
  - No feature flag required. Single server-side change; rollback is a revert commit.
- Observability expectations:
  - Existing `console.info("Axerve payment OK", ...)` log is sufficient context. A new `console.info("Customer confirmation email dispatched", ...)` log (i18n-exempt) is recommended for operational visibility — phrased as "dispatched" to accurately reflect that the fire-and-forget call was initiated, not that delivery was confirmed.

## Suggested Task Seeds (Non-binding)

- TASK-01: Insert customer email `sendSystemEmail` call into `route.ts` success block. Guard: `const recipientEmail = cardFields.buyerEmail?.trim(); if (recipientEmail && z.string().email().safeParse(recipientEmail).success)` (or inline regex equivalent). Use `escapeHtml` from `@acme/email` on all interpolated HTML values (`line.sku.title`, `cardFields.buyerName`). Fire-and-forget with `.catch()`. Log dispatch with `console.info("Customer confirmation email dispatched", ...) // i18n-exempt`.
- TASK-02: Update `route.test.ts` — adjust TC-04-01 assertion to `toHaveBeenNthCalledWith(1, merchant)` and `toHaveBeenNthCalledWith(2, customer)` (for success case with buyerEmail provided); add TC-04-08 (success + buyerEmail empty string → sendSystemEmail called once — merchant only); add TC-04-09 (customer email throws → success response still returned); add TC-04-10 (whitespace-only buyerEmail → sendSystemEmail called once — merchant only).

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: `POST /api/checkout-session` returns 200; `sendSystemEmail` called with buyer address when `buyerEmail` non-empty; existing 7 tests pass; new tests cover 3 additional customer email paths; manual smoke test with real email address delivers confirmation email.
- Post-delivery measurement plan: Operational — merchant can confirm buyer confirmation emails are received on test order before launch.

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity**: All claims are traced to specific file paths and line ranges. `sendSystemEmail` signature confirmed from source. `buyerEmail` availability confirmed at insertion point.
2. **Boundary coverage**: Email infrastructure (env schema, nodemailer, `sendSystemEmail` dynamic require) fully traced. Error/fallback path confirmed (fire-and-forget pattern). No auth boundary affected.
3. **Testing/validation coverage**: Existing 7 tests verified by reading the full test file. Coverage gaps (customer email paths) explicitly identified and test seeds provided. TC-04-01 mutation noted.
4. **Business validation coverage**: N/A for code-change deliverable. Hypothesis is implicit: sending confirmation email closes the operational gap — low falsification cost.
5. **Confidence calibration**: Implementation at 95% reflecting full route-level clarity. Impact capped at 80% because optional field means some buyers will not receive email.

### Confidence Adjustments

- No downward adjustments from initial inspection. Evidence fully supports planned approach.
- Impact score (80%) reflects real boundary: optional `buyerEmail` means partial population coverage at launch. This is a product/UX decision, not a code risk.

### Remaining Assumptions

- Gmail SMTP credentials (`GMAIL_USER`, `GMAIL_PASS`) are configured in production `.env.local` — not verifiable from the codebase. If absent, `sendSystemEmail` will silently simulate delivery (confirmed by `sendEmail.ts` fallback path).
- Axerve `result.transactionId` is always non-null on a success response — consistent with test mocks and Axerve API documentation expectation.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan hbag-checkout-confirmation-email --auto`
