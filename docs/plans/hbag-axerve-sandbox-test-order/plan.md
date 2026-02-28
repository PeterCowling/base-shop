---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: hbag-axerve-sandbox-test-order
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# HBAG Axerve Sandbox & Test Order Workflow Plan

## Summary

The `@acme/axerve` package already implements both `AXERVE_USE_MOCK=true` (local mock) and `AXERVE_SANDBOX=true` (sandbox WSDL routing). The gap is that neither env var is documented in `apps/caryina/.env.example`, and no pre-launch test order runbook exists. This plan delivers two S/M tasks: (1) add all four Axerve env vars to `.env.example` with clear operational guidance, and (2) write a step-by-step test order runbook at `apps/caryina/docs/plans/test-order-runbook.md` covering success and decline flows against the Axerve sandbox. No production code changes are required.

## Active tasks

- [ ] TASK-01: Document Axerve env vars in `.env.example`
- [ ] TASK-02: Write pre-launch test order runbook

## Goals

- Close the env documentation gap: `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, and `AXERVE_SANDBOX` documented in `.env.example` with comments.
- Produce a pre-launch test order runbook that lets the operator run a success test and a decline test against Axerve sandbox before sending real traffic.
- Clarify the precedence rule (`AXERVE_USE_MOCK=true` takes priority over `AXERVE_SANDBOX=true`).

## Non-goals

- Modifying `packages/axerve/src/index.ts` or `apps/caryina/src/app/api/checkout-session/route.ts`.
- Adding new env var names (no `AXERVE_SANDBOX_SHOP_LOGIN` etc.).
- Automated CI test against Axerve sandbox (requires live credentials; manual gate is correct).
- SCA/3DS changes (separate deferred gap).

## Constraints & Assumptions

- Constraints:
  - `.env.example` comment style must match existing inline-comment format in the file.
  - Runbook must go to `apps/caryina/docs/plans/test-order-runbook.md` (directory confirmed to exist).
  - No production code changes.
- Assumptions:
  - Axerve sandbox WSDL is live at `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL` (confirmed in source).
  - Sandbox credentials are operator-obtained from the Axerve merchant portal (not yet obtained, per open question).
  - Visa PAN `4111111111111111` is a valid Axerve sandbox success card; operator must cross-check with Axerve docs before running.

## Inherited Outcome Contract

- **Why:** Pre-launch readiness — no real-traffic order should be processed without confirming the full payment flow end-to-end against Axerve sandbox. One failed test plus one successful test must be on record before launch.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Pre-launch checkout test runbook exists in repo; operator has run one success test and one decline test against Axerve sandbox before any live traffic is sent.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/hbag-axerve-sandbox-test-order/fact-find.md`
- Key findings used:
  - `packages/axerve/src/index.ts` lines 51–66: `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` already implemented; no code changes needed.
  - `apps/caryina/.env.example`: entirely missing all four Axerve env vars.
  - `apps/caryina/docs/plans/`: directory confirmed to exist (empty — runbook is additive).
  - `apps/caryina/.env.local`: `AXERVE_USE_MOCK=true` set, `AXERVE_SANDBOX=true` commented out.
  - Sandbox WSDL: `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL`
  - All existing unit tests already cover the code paths we are not changing.

## Proposed Approach

- Option A: Add Axerve vars to `.env.example` + write runbook (two independent tasks, can run in parallel).
- Option B: Add a route-level guard that checks `AXERVE_SANDBOX=true` and logs a warning — rejected as unnecessary; the axerve package already handles this internally.
- Chosen approach: Option A. Minimal, evidence-backed, zero production code risk. The existing package design is correct; the only gap is operator-facing documentation and runbook.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Document Axerve env vars in `.env.example` | 85% | S | Complete (2026-02-28) | - | - |
| TASK-02 | IMPLEMENT | Write pre-launch test order runbook | 85% | M | Complete (2026-02-28) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Both tasks are fully independent; run in parallel |

## Tasks

### TASK-01: Document Axerve env vars in `.env.example`

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/.env.example` — Axerve section added with all four env vars and operational comments
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/.env.example`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 95% — The exact content to add is unambiguous: four env var keys with inline comments, matching the existing section format. No logic or code involved.
  - Approach: 95% — Additive edit to a documentation file. Only one valid approach.
  - Impact: 85% — Closes the env documentation gap directly. Held-back test: the only downside risk is a comment being unclear, which is low-severity and easily corrected. No single unknown would push this below 80.
- **Acceptance:**
  - `apps/caryina/.env.example` contains `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, `AXERVE_SANDBOX` entries.
  - Each entry has an inline comment explaining its purpose.
  - Comment for `AXERVE_SANDBOX` notes that sandbox testing requires setting `AXERVE_SHOP_LOGIN` and `AXERVE_API_KEY` to sandbox credential values obtained from the Axerve merchant portal.
  - Comment explains the precedence rule: `AXERVE_USE_MOCK=true` bypasses all SOAP calls and takes priority over `AXERVE_SANDBOX=true`.
  - Formatting matches existing file sections (blank lines between sections, `# section header` style).
  - No sensitive real credentials added to the file.
- **Validation contract (TC-01):**
  - TC-01-01: File readable and all four vars present → confirmed by `grep` of `.env.example`.
  - TC-01-02: No real credentials in file → confirmed by diff review (placeholder values only).
  - TC-01-03: Formatting consistent with existing sections → confirmed by visual review.
- **Execution plan:**
  - Red: None (no tests to write for a documentation file change).
  - Green: Append a new Axerve payment section to `apps/caryina/.env.example`, after the existing email sections. Include all four vars with comments.
  - Refactor: Review comment clarity and consistency with existing comment style.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: env documentation file, no external unknowns to probe.
- **Edge Cases & Hardening:**
  - Ensure `AXERVE_USE_MOCK` default shown as commented-out `# AXERVE_USE_MOCK=true` to signal it is optional (same pattern as `RESEND_API_KEY` in the existing file).
  - Ensure `AXERVE_SANDBOX` also shown as commented-out `# AXERVE_SANDBOX=true` to prevent accidental sandbox activation in production.
- **What would make this >=90%:**
  - Operator review and confirmation that the comments are clear to a non-technical reader. (Current: 85% — minor comment quality uncertainty.)
- **Rollout / rollback:**
  - Rollout: Merge the `.env.example` change to the dev branch.
  - Rollback: Revert the file if comments cause confusion. Zero production impact.
- **Documentation impact:** This task IS the documentation change — no further doc updates needed.
- **Notes / references:**
  - Existing `.env.example` format reference: `apps/caryina/.env.example` lines 1–26.
  - `AXERVE_USE_MOCK` and `AXERVE_SANDBOX` confirmed in `packages/axerve/src/index.ts` lines 51, 66.
  - Do NOT add `AXERVE_SANDBOX_SHOP_LOGIN` or similar — no new env var names are introduced by this scope.

---

### TASK-02: Write pre-launch test order runbook

- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/docs/plans/test-order-runbook.md` — step-by-step pre-launch test order checklist
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/docs/plans/test-order-runbook.md` (new file)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Runbook content is well-defined from fact-find: credential setup, mock/sandbox precedence, success test, decline test, reset. The only imprecision is specific Axerve sandbox test card PANs (operator must verify against official docs).
  - Approach: 90% — Markdown runbook in confirmed directory. Standard format, no alternatives.
  - Impact: 85% — Runbook is the primary operational deliverable closing the pre-launch gate. Held-back test: if Axerve sandbox is unavailable or credentials are not yet obtained, the operator cannot execute the runbook steps — but the runbook itself is still complete and correctly documents the process.
- **Acceptance:**
  - `apps/caryina/docs/plans/test-order-runbook.md` exists and is readable.
  - Runbook contains: (1) Prerequisites section (sandbox credential acquisition steps), (2) Step-by-step setup for sandbox mode in `.env.local`, (3) Success test procedure with expected API response shape, (4) Decline test procedure with expected error response shape, (5) Reset-to-production steps, (6) `MERCHANT_NOTIFY_EMAIL` note (set to test address during sandbox run), (7) Precedence note (`AXERVE_USE_MOCK=true` must be unset for sandbox test).
  - Runbook explicitly directs operator to Axerve official sandbox documentation for test card PANs (does not hardcode unverified card numbers as authoritative).
  - Runbook includes a fallback: if sandbox is unavailable, use `AXERVE_USE_MOCK=true` to verify route logic, then retry sandbox when available.
  - File is well-formatted markdown with clear section headers.
- **Validation contract (TC-02):**
  - TC-02-01: File exists at `apps/caryina/docs/plans/test-order-runbook.md` → confirmed by file read.
  - TC-02-02: All seven acceptance content areas present → confirmed by section header check.
  - TC-02-03: No hardcoded production credentials or production-like env values in runbook → confirmed by content review.
  - TC-02-04: Axerve sandbox WSDL URL referenced correctly as `https://sandbox.gestpay.net/gestpay/gestpayws/WSs2s.asmx?WSDL` (or noted as the URL controlled by `AXERVE_SANDBOX=true`) → confirmed by content review.
- **Execution plan:**
  - Red: None (runbook is a new markdown file; no tests to write).
  - Green: Create `apps/caryina/docs/plans/test-order-runbook.md` with all required sections.
  - Refactor: Review for operator-readability: plain language, no system-internal jargon in body text.
- **Planning validation (required for M/L):**
  - Checks run: Confirmed `apps/caryina/docs/plans/` directory exists and is empty (no existing runbook to conflict with).
  - Validation artifacts: `ls apps/caryina/docs/plans/` → empty.
  - Unexpected findings: None.
- **Consumer tracing (M effort):**
  - New output: `apps/caryina/docs/plans/test-order-runbook.md`.
  - Consumers: Operator (human), referenced by TASK-01 comments in `.env.example`. No code consumers.
  - All consumer paths confirmed: document is human-read only. No code path reads this file at runtime.
- **Scouts:** None: new file creation, no external unknowns to probe in codebase.
- **Edge Cases & Hardening:**
  - Mock precedence edge case: if operator has `AXERVE_USE_MOCK=true` still set when attempting sandbox test, all calls will return mock results silently. Runbook explicitly calls this out as Step 1 of setup.
  - Double-sandbox edge case: if operator sets `AXERVE_SANDBOX=true` but forgets to swap credentials, SOAP call will fail with auth error. Runbook notes this and directs operator to verify credentials match the sandbox environment.
  - Email noise: merchant notification email fires on sandbox success. Runbook advises setting `MERCHANT_NOTIFY_EMAIL` to a personal test address during sandbox run.
- **What would make this >=90%:**
  - Operator review confirms the runbook steps are sufficient to complete a sandbox test order without additional guidance. (Current: 85% — test card PAN verification is operator-dependent.)
- **Rollout / rollback:**
  - Rollout: Merge new file to dev branch. Additive only.
  - Rollback: Delete the file. No production impact.
- **Documentation impact:** This task IS the documentation deliverable. No further doc updates needed.
- **Notes / references:**
  - `packages/axerve/src/index.ts` lines 7–11 (sandbox WSDL URL), 51–62 (mock mode guard).
  - Axerve official test card docs: https://docs.axerve.com/it/test (operator must visit to confirm PANs).
  - Existing axerve tests use `4111111111111111` (Visa success) — likely correct for sandbox, but not guaranteed.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Document Axerve env vars in `.env.example` | Yes — file exists and is readable; format confirmed | None | No |
| TASK-02: Write pre-launch test order runbook | Yes — target directory `apps/caryina/docs/plans/` confirmed to exist and is empty | None | No |

No Critical or Major simulation findings. Both tasks are additive file edits with no code dependencies, no config key lookups, no API signature constraints, and no ordering requirements between them.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Operator lacks sandbox credentials at launch time | Medium | Medium — delays actual test run | Runbook step 1 documents how to request credentials from Axerve merchant portal |
| `AXERVE_USE_MOCK=true` silently overrides sandbox mode during test | Low | Low — test would appear to succeed but not exercise SOAP | Runbook explicitly requires unsetting mock flag as step 1 of setup |
| Axerve sandbox test card PANs undocumented in runbook | Low | Low — test fails with clear card-not-found error | Runbook directs operator to official Axerve sandbox docs; does not hardcode unverified PANs |
| Merchant notification email fires during sandbox test | Low | Low — harmless but confusing | Runbook advises using a test address for `MERCHANT_NOTIFY_EMAIL` |

## Observability

- Logging: `callPayment` with `AXERVE_SANDBOX=true` will log `"Axerve payment OK"` or `"Axerve payment KO"` via the route's existing `console.info`/`console.error` calls. Sufficient for manual runbook verification.
- Metrics: None: documentation-only deliverable.
- Alerts/Dashboards: None: documentation-only deliverable.

## Acceptance Criteria (overall)

- [ ] `apps/caryina/.env.example` contains `AXERVE_SHOP_LOGIN`, `AXERVE_API_KEY`, `AXERVE_USE_MOCK`, `AXERVE_SANDBOX` with accurate operational comments.
- [ ] `apps/caryina/docs/plans/test-order-runbook.md` exists with all seven required content sections.
- [ ] No production code files modified.
- [ ] No sensitive credentials committed.
- [ ] CI passes on the PR (no new test failures).

## Decision Log

- 2026-02-28: Approach — Option A selected (env documentation + runbook only). Option B (route-level sandbox guard) rejected: the `callPayment` function already handles all sandbox routing internally; no route change is warranted.
- 2026-02-28: Runbook location — `apps/caryina/docs/plans/test-order-runbook.md` selected over `docs/plans/hbag-axerve-sandbox-test-order/test-order-runbook.md`. Rationale: co-located with the caryina app for future developer discoverability.
- 2026-02-28: No new env var names — sandbox testing uses the existing `AXERVE_SHOP_LOGIN` / `AXERVE_API_KEY` vars with sandbox values. No `AXERVE_SANDBOX_SHOP_LOGIN` introduced.

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × M(2) = 170
- Total weighted: 255 / 3 = **85%**
