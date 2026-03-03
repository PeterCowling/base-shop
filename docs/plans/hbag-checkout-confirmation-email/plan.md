---
Type: Plan
Status: Active
Domain: SELL
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-checkout-confirmation-email
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG Checkout Confirmation Email Plan

## Summary

Add a customer order confirmation email to the Caryina checkout flow. Currently payment success sends only a merchant notification (fire-and-forget); the buyer receives nothing. TASK-01 inserts a second `sendSystemEmail` call in `route.ts`, guarded by trim + email-format validation on `cardFields.buyerEmail`, using an inline `escHtml` helper (4-line pure function, no new imports) on all user-supplied values interpolated into the HTML body. TASK-02 updates the existing route test file: adjusts TC-04-01 (merchant call is now first of two) and adds three new test cases covering the customer email paths. Both tasks are small-effort, high-confidence, and unblocked.

## Active tasks

- [x] TASK-01: Insert customer confirmation email in checkout-session route
- [x] TASK-02: Update and extend route tests for customer email

## Goals

- Buyer receives a transactional order confirmation email within seconds of payment success when `buyerEmail` is provided.
- Email body: itemised order summary, total, `shopTransactionId`, Axerve `transactionId`.
- Email delivery never blocks or fails the payment response (fire-and-forget).
- HTML content is safe (all user-supplied values passed through the inline `escHtml` helper before insertion into the email HTML body).
- CI test suite continues to pass; new customer email paths are fully covered.

## Non-goals

- Making `buyerEmail` mandatory at the form level.
- Redesigning the success page.
- Email localisation (English-only for v1).
- Unsubscribe / marketing compliance handling.
- New email provider or infrastructure changes.

## Constraints & Assumptions

- Constraints:
  - Must reuse `sendSystemEmail` (already imported in `route.ts` via `@acme/platform-core/email`).
  - Fire-and-forget only — `void ... .catch(...)` pattern, no `await`.
  - HTML escaping for the email template must be handled by an inline helper function in `route.ts` — `@acme/email` is NOT a direct dependency of `apps/caryina` (package.json confirmed). Inline implementation: `function escHtml(s: string): string { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }` — covers the injection vectors relevant for HTML text-node interpolation in this email template (the template does not use single-quoted attributes, so `'` omission is safe here).
  - Email guard: `const recipientEmail = cardFields.buyerEmail?.trim(); if (recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))` — simple truthy check is insufficient (whitespace-only strings are truthy and cause Zod throw inside `sendEmail`).
  - All developer log strings require `// i18n-exempt` comment.
  - Tests run in CI only (AGENTS.md). Do not run Jest locally.
- Assumptions:
  - Inline `escHtml` helper is self-contained and requires no new imports or dependencies.
  - No new env vars needed — `EMAIL_PROVIDER`, `GMAIL_USER`, `GMAIL_PASS`, `MERCHANT_NOTIFY_EMAIL` are already in `.env.example`.
  - TC-04-01 currently asserts `sendSystemEmail` called with a single merchant-address call; it must be updated to `toHaveBeenNthCalledWith(1, ...)` pattern.

## Inherited Outcome Contract

- **Why:** Close a launch-readiness gap so a real customer order cannot disappear operationally — identified in the worldclass-scan for HBAG pre-launch readiness.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Buyer receives a transactional confirmation email within seconds of payment success, containing order summary, transaction ID, and next-steps — so no real customer order can disappear operationally.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/hbag-checkout-confirmation-email/fact-find.md`
- Key findings used:
  - Insertion point: `route.ts` payment success block, after the merchant `void sendSystemEmail(...)` call (lines 96–120).
  - `cardFields.buyerEmail?: string` is in scope at insertion point; form sends `""` by default.
  - Existing `sendSystemEmail` mock in `route.test.ts` is the test seam for both calls.
  - `@acme/email` is NOT a dependency of `apps/caryina`; use an inline `escHtml` helper in `route.ts` instead.
  - TC-04-01 currently asserts one `sendSystemEmail` call — must be updated.

## Proposed Approach

- Option A: Add customer email call in `route.ts` + extend tests in `route.test.ts`. Single IMPLEMENT task each.
- Option B: Extract a shared `buildOrderEmailHtml` helper before adding both calls (deferred template extraction). Increases blast radius unnecessarily for a pre-launch v1 change.
- **Chosen approach:** Option A. Two focused IMPLEMENT tasks — one for the production code, one for the tests. No template extraction; inline HTML is the established pattern. Lower blast radius, faster to ship, no loss in functionality.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Insert customer confirmation email in route.ts | 90% | S | Complete (2026-02-28) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update and extend route.test.ts | 90% | S | Complete (2026-02-28) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Production code change; no dependencies |
| 2 | TASK-02 | TASK-01 complete | Tests reference the new code path; run after TASK-01 |

## Tasks

### TASK-01: Insert customer confirmation email in checkout-session route

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/caryina/src/app/api/checkout-session/route.ts` — adds one inline `escHtml` helper function and one fire-and-forget `sendSystemEmail` block in the payment success path. No new imports or package.json changes required.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts`; `[readonly] packages/platform-core/src/services/emailService.ts` (sendSystemEmail signature reference)
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — insertion point fully identified; all required variables (`cardFields.buyerEmail`, `shopTransactionId`, `result.transactionId`, `totalCents`, `itemLines`) are in scope; pattern (fire-and-forget) is already used in the same function; no new infra. Fact-find implementation confidence is 95% — within range.
  - Approach: 90% — trim + format-validation guard and inline `escHtml` usage are both fully specified. Small residual uncertainty on whether regex or `z.string().email().safeParse()` is preferred; either is correct — using inline regex keeps the dependency footprint minimal.
  - Impact: 90% — direct operational fix; customer who provides an email will receive a confirmation. Minor uncertainty: buyers who omit email still get nothing (acceptable, as opt-in is by design).
- **Acceptance:**
  - `POST /api/checkout-session` with valid card + non-empty valid `buyerEmail` in body → `sendSystemEmail` called twice (merchant first, customer second).
  - `POST /api/checkout-session` with valid card + empty `buyerEmail` → `sendSystemEmail` called once (merchant only).
  - `POST /api/checkout-session` with valid card + whitespace-only `buyerEmail` → `sendSystemEmail` called once (merchant only).
  - Customer email HTML body contains item name (escaped), total, `shopTransactionId`, and Axerve transaction ID.
  - Customer email failure does not affect 200 response.
  - TypeScript compiles without errors.
- **Validation contract (TC-XX):**
  - TC-01-A: success + `buyerEmail: "jane@example.com"` → `sendSystemEmail` called twice; second call `to` matches `buyerEmail`.
  - TC-01-B: success + `buyerEmail: ""` → `sendSystemEmail` called once.
  - TC-01-C: success + `buyerEmail: "   "` (whitespace) → `sendSystemEmail` called once.
  - TC-01-D: customer email dispatch throws → success response still 200.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** (no failing test needed for this task; TASK-02 writes the tests)
  - **Green:**
    1. Add an inline escape helper near the top of `route.ts` (after imports, before `REQUIRED_CARD_FIELDS`):
       ```
       function escHtml(s: string): string {
         return s
           .replace(/&/g, "&amp;")
           .replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")
           .replace(/"/g, "&quot;");
       }
       ```
    2. Immediately after the existing merchant `void sendSystemEmail(...)` block (~line 120), insert:
       ```
       const recipientEmail = cardFields.buyerEmail?.trim();
       if (recipientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
         const customerItemLines = Object.values(cart)
           .map(
             (line) =>
               `<tr><td>${escHtml(line.sku.title)}</td><td>${line.qty}</td><td>€${(line.sku.price / 100).toFixed(2)}</td><td>€${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
           )
           .join("");
         const customerEmailHtml = `
           <h2>Order confirmed — thank you!</h2>
           <p>Hi${cardFields.buyerName ? ` ${escHtml(cardFields.buyerName)}` : ""},</p>
           <p>Your order has been received and payment processed successfully.</p>
           <table border="1" cellpadding="4" cellspacing="0">
             <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
             <tbody>${customerItemLines}</tbody>
           </table>
           <p><strong>Total: €${(totalCents / 100).toFixed(2)}</strong></p>
           <p>Order reference: ${shopTransactionId}</p>
           <p>Payment reference: ${result.transactionId ?? ""}</p>
           <p>If you have any questions, reply to this email or contact our support.</p>
         `;
         void sendSystemEmail({
           to: recipientEmail,
           subject: `Order confirmed — ${shopTransactionId}`,
           html: customerEmailHtml,
         }).catch((err: unknown) => {
           console.error("Customer confirmation email failed", err); // i18n-exempt -- developer log
         });
         console.info("Customer confirmation email dispatched", { shopTransactionId }); // i18n-exempt -- developer log
       }
       ```
  - **Refactor:** None required — inline HTML is the established pattern; no extraction needed for v1.
- **Planning validation (required for M/L):**
  - None: S-effort task; planning validation is not required.
- **Scouts:** No new package imports required. `@acme/email` is not a dep of `apps/caryina` — inline `escHtml` helper is the correct approach. Helper is self-contained (pure string replace, no external deps).
- **Edge Cases & Hardening:**
  - Empty `buyerEmail` (form default `""`) — handled by trim + regex guard (empty string fails regex).
  - Whitespace-only `buyerEmail` (e.g. `"   "`) — handled by `.trim()` → empty string → regex fails.
  - Malformed email (e.g. `"not-an-email"`) — handled by regex check; call is skipped.
  - `result.transactionId` undefined — handled by `?? ""` fallback in template.
  - HTML injection via `line.sku.title` or `cardFields.buyerName` — handled by `escHtml(...)` on both (inline helper, no new dep).
  - Customer email SMTP failure — swallowed by `.catch()`; success response is unaffected.
- **What would make this >=90%:** Already at 90%. Reaches 95% after CI confirms the TypeScript build is clean and the new `escHtml` function and email block do not cause lint errors.
- **Rollout / rollback:**
  - Rollout: Deploy as part of normal dev → staging → production pipeline. No feature flag.
  - Rollback: Revert commit. No data migration to reverse.
- **Documentation impact:**
  - `.env.example` already documents required email env vars. No update needed.
- **Notes / references:**
  - Merchant notification pattern: `route.ts` lines 96–120 (fire-and-forget block).
  - Inline `escHtml` helper: 4-line pure function, no external deps.
  - `sendSystemEmail` signature: `packages/platform-core/src/services/emailService.ts` lines 26–42.

---

### TASK-02: Update and extend route.test.ts for customer email

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/caryina/src/app/api/checkout-session/route.test.ts` — updates TC-04-01 and adds TC-04-08, TC-04-09, TC-04-10.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — test file structure is fully read; mock is already in place; `toHaveBeenNthCalledWith` is the exact pattern needed; three new cases are straightforward extensions of existing patterns.
  - Approach: 90% — splitting TC-04-01 into ordered calls and adding three new cases follows established Jest patterns. Minor residual: need to verify mock reset between tests does not affect call order tracking (it does — `jest.clearAllMocks()` in `beforeEach` resets call counts, so `toHaveBeenNthCalledWith` is safe).
  - Impact: 90% — closes the coverage gap for all customer email paths identified in the fact-find.
- **Acceptance:**
  - Existing 7 tests (TC-04-01 through TC-04-07) continue to pass.
  - TC-04-01 updated: `sendSystemEmail` called with merchant address as first call, customer address as second call.
  - TC-04-08 added: success + empty `buyerEmail` → `sendSystemEmail` called exactly once (merchant).
  - TC-04-09 added: customer email throws → success 200 response still returned.
  - TC-04-10 added: whitespace-only `buyerEmail` → `sendSystemEmail` called exactly once (merchant).
  - CI green.
- **Validation contract (TC-XX):**
  - TC-02-A (updates TC-04-01): success + `buyerEmail: "jane@example.com"`, with `process.env.MERCHANT_NOTIFY_EMAIL = "merchant@test.com"` set in beforeEach → `sendSystemEmail` called twice; first call `to` = `"merchant@test.com"`; second call `to` = `"jane@example.com"`. Env var must be set/restored in test to avoid coupling to the hardcoded source fallback.
  - TC-02-B (new TC-04-08): success + `buyerEmail: ""` → `sendSystemEmail` called exactly once; call is merchant notification.
  - TC-02-C (new TC-04-09): success + valid `buyerEmail`; second `sendSystemEmail` mock rejects → response status is still 200.
  - TC-02-D (new TC-04-10): success + `buyerEmail: "   "` → `sendSystemEmail` called exactly once.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** After TASK-01 lands, TC-04-01's `toHaveBeenCalledWith(expect.objectContaining({ to: expect.stringContaining("@") }))` assertion ambiguously matches both calls. Update it to use a deterministic merchant email address: set `process.env.MERCHANT_NOTIFY_EMAIL = "merchant@test.com"` in the test's `beforeEach` (and restore in `afterEach`) so the assertion is not coupled to the hardcoded fallback address in the source file:
    ```
    // in beforeEach:
    process.env.MERCHANT_NOTIFY_EMAIL = "merchant@test.com";
    // in afterEach:
    delete process.env.MERCHANT_NOTIFY_EMAIL;

    // assertion (after tick):
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendSystemEmail).toHaveBeenCalledTimes(2);
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: "merchant@test.com" }),
    );
    expect(sendSystemEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ to: "jane@example.com" }),
    );
    ```
  - **Green:** Add new test cases:
    - **TC-04-08:** `buyerEmail: ""` in body → assert `sendSystemEmail.mock.calls.length === 1` after tick.
    - **TC-04-09:** valid `buyerEmail`; `sendSystemEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("SMTP error"))` → assert `res.status` is 200.
    - **TC-04-10:** `buyerEmail: "   "` in body → assert `sendSystemEmail.mock.calls.length === 1` after tick.
  - **Refactor:** None — test file follows existing patterns.
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:**
  - `jest.clearAllMocks()` in `beforeEach` resets `sendSystemEmail.mock.calls` between tests — confirmed; `toHaveBeenNthCalledWith` call ordering is safe.
  - TC-04-01 uses `await new Promise((resolve) => setTimeout(resolve, 0))` to flush the fire-and-forget microtask — this pattern must be replicated in TC-04-08, TC-04-09, TC-04-10.
- **Edge Cases & Hardening:**
  - Call-order assertion in TC-04-01 depends on TASK-01 placing merchant call first and customer call second. If order changes, TC-04-01 will fail — this is the intended safety property.
  - TC-04-09 mock setup: use `mockResolvedValueOnce` for merchant (first call succeeds) and `mockRejectedValueOnce` for customer (second call throws).
- **What would make this >=90%:** Already at 90%. Would reach 95% when CI run confirms all 10 tests pass (7 existing, with TC-04-01 updated + 3 new: TC-04-08/09/10 = 10 total).
- **Rollout / rollback:**
  - Rollout: Test file changes are committed with TASK-01 changes in the same PR.
  - Rollback: Revert commit.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - TC-04-06 fire-and-forget failure pattern (lines 185–201 of `route.test.ts`) is the reference for TC-04-09.
  - Existing `VALID_CARD_BODY` fixture includes `buyerEmail: "jane@example.com"` — reuse in TC-04-01 update and TC-04-09.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Insert customer email in route.ts | Yes | None | No |
| TASK-02: Update route.test.ts | Partial — TASK-01 must be complete first (tests assert the new behavior) | [Ordering inversion][Minor]: if TASK-02 runs before TASK-01, TC-04-01 update references behavior that does not yet exist. Mitigated by dependency declaration (TASK-02 depends on TASK-01). | No |

No Critical findings. One Minor advisory on ordering (resolved by declared dependency).

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| HTML injection via user-supplied strings | Medium | Medium | Inline `escHtml` helper applied to `line.sku.title` and `cardFields.buyerName` in TASK-01; no new package dep required |
| Customer email dispatched to whitespace-only / malformed address | Low | Low | Trim + regex guard in TASK-01 before dispatch; `sendEmail` Zod validation is a backstop |
| TC-04-01 assertion ambiguity after second `sendSystemEmail` call is added | Medium | Low | TASK-02 updates TC-04-01 to use `toHaveBeenNthCalledWith`; detected immediately in CI |
| Gmail SMTP credentials absent in production | Low | Low | `sendEmail` silently simulates delivery when creds absent; merchant email already relies on same path |

## Observability

- Logging: `console.info("Customer confirmation email dispatched", { shopTransactionId })` added in TASK-01 (no email address logged — avoids PII in server logs). `console.error("Customer confirmation email failed", err)` on failure. Both carry `// i18n-exempt` comments.
- Metrics: None: transactional email delivery is not metered at v1 scale.
- Alerts/Dashboards: None: delivery failures are logged; manual smoke test before launch serves as validation.

## Acceptance Criteria (overall)

- [ ] `POST /api/checkout-session` with valid card and `buyerEmail: "jane@example.com"` → `sendSystemEmail` called twice; second call addressed to buyer.
- [ ] `POST /api/checkout-session` with valid card and `buyerEmail: ""` or whitespace → `sendSystemEmail` called once (merchant only).
- [ ] Customer email body contains itemised line items, total, order reference, and Axerve payment reference.
- [ ] All user-supplied values in customer email HTML are HTML-escaped.
- [ ] Customer email failure does not affect the 200 response or cart clearing.
- [ ] All 10 tests in `route.test.ts` pass in CI (7 existing, with TC-04-01 updated in place + 3 new: TC-04-08, TC-04-09, TC-04-10).
- [ ] TypeScript builds without errors and `pnpm lint` passes for the changed package scope.
- [ ] Manual smoke test: place a test order with a real email address; receive confirmation email.

## Decision Log

- 2026-02-28: Chose Option A (no template extraction) — inline HTML follows the established pattern, lower blast radius, appropriate for v1 pre-launch scope.
- 2026-02-28: Chose trim + inline regex guard over `z.string().email().safeParse()` — keeps route.ts dependency-footprint minimal; Zod is already a backstop inside `sendEmail`.
- 2026-02-28: HTML escaping via inline `escHtml` helper rather than importing `escapeHtml` from `@acme/email` — `@acme/email` is not a direct dep of `apps/caryina` (confirmed from `package.json`); adding it would require a `package.json` change and pnpm install. Inline 4-line pure function is lower-risk and sufficient for the email HTML use case.

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 90% × S(1) = 90
- Overall-confidence = (90 + 90) / (1 + 1) = **90%**
