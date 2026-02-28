---
Status: Complete
Feature-Slug: hbag-axerve-sandbox-test-order
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — HBAG Axerve Sandbox & Test Order Workflow

## What Was Built

**TASK-01 — Axerve env vars documented in `.env.example`**

Added a new `Axerve / GestPay payments` section to `apps/caryina/.env.example`. All four env vars are now present with operational comments:

- `AXERVE_SHOP_LOGIN` — required, plain value (placeholder for merchant agreement shop login)
- `AXERVE_API_KEY` — required, plain value (placeholder for merchant agreement API key)
- `AXERVE_USE_MOCK` — commented-out optional, labelled dev-only, explains it takes priority over `AXERVE_SANDBOX`
- `AXERVE_SANDBOX` — commented-out optional, labelled test-only, routes SOAP calls to `sandbox.gestpay.net`, notes that sandbox credentials must be swapped from the Axerve merchant portal

A prose sandbox-test note was added immediately after the `AXERVE_SANDBOX` line, explicitly calling out that `AXERVE_USE_MOCK` must be unset before sandbox tests can reach the WSDL. No production code was changed. No real credentials were added.

**TASK-02 — Pre-launch test order runbook created at `apps/caryina/docs/plans/test-order-runbook.md`**

A seven-section runbook was created to guide the operator through a full sandbox payment test before any live traffic is sent:

1. Prerequisites — how to obtain sandbox credentials and official Axerve test card scenarios
2. Environment setup — exact `.env.local` edits required (unset mock, set sandbox, swap credentials, set test email)
3. Success test procedure — checkout steps and expected HTTP 200 response shape
4. Decline test procedure — checkout steps and expected HTTP 402 response shape
5. Reset to production — how to restore production-safe config after testing
6. Email noise note — advises setting `MERCHANT_NOTIFY_EMAIL` to a test inbox during sandbox run
7. Fallback — how to use mock mode (`AXERVE_USE_MOCK=true`) to verify route wiring if sandbox is unavailable, with a requirement to retry real sandbox before sending live traffic

The runbook does not hardcode test card PANs as authoritative; it directs the operator to `https://docs.axerve.com` to obtain current valid test cards.

## Tests Run

No automated test changes were required. Both deliverables are documentation-only files:
- `apps/caryina/.env.example` — env documentation file, not executed by any test suite
- `apps/caryina/docs/plans/test-order-runbook.md` — markdown runbook, not executed by any test suite

TypeScript typecheck was run post-commit as part of the writer-lock commit gate:
- `@apps/caryina:typecheck` — passed (19 tasks, 17 cached; `apps/caryina` clean)
- ESLint: passed (warnings only, all pre-existing, no errors introduced)

## Validation Evidence

**TC-01 (TASK-01 — `.env.example`):**
- TC-01-01: All four vars present — confirmed by file read. `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, `AXERVE_SANDBOX` all present.
- TC-01-02: No real credentials — confirmed by diff review. All values are placeholder strings or commented-out.
- TC-01-03: Formatting matches existing sections — confirmed by visual review. Blank-line section separator, `# ===` header style, inline comment style matches email sections above.

**TC-02 (TASK-02 — runbook):**
- TC-02-01: File exists at `apps/caryina/docs/plans/test-order-runbook.md` — confirmed by file read.
- TC-02-02: All seven required content areas present — confirmed by section header check (Steps 1–7 match the seven acceptance areas).
- TC-02-03: No hardcoded production credentials or production-like env values — confirmed by content review. All credential references use placeholder text.
- TC-02-04: Axerve sandbox WSDL URL noted correctly — confirmed by content review. Step 2 explicitly states that `AXERVE_SANDBOX=true` routes SOAP calls to `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`.

## Scope Deviations

None. Both tasks were additive file operations. No files outside the `Affects` lists were modified.

## Outcome Contract

- **Why:** Pre-launch readiness — no real-traffic order should be processed without confirming the full payment flow end-to-end against Axerve sandbox. One failed test plus one successful test must be on record before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Pre-launch checkout test runbook exists in repo; operator has run one success test and one decline test against Axerve sandbox before any live traffic is sent.
- **Source:** operator
