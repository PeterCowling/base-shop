---
Type: Plan
Status: Active
Domain: Prime
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05 (TASK-09..TASK-16 completed)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-process-reliability-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 92%
Confidence-Method: Direct code-path audit + targeted regression tests
Auto-Build-Intent: plan+auto
---

# Prime Process Reliability Hardening Plan

## Summary
This plan hardens Prime outbound messaging and MCP draft processing where the audit found silent failures, weak validation, and missing verification coverage. Work is sequenced to remove silent label failures, add deterministic idempotency guards, enforce endpoint fail-closed controls, and eliminate stuck processing states. The implementation scope is restricted to Prime functions and `@acme/mcp-server` outbound draft tooling plus focused tests and contract docs.

## Active tasks
- [x] TASK-01: Harden MCP outbound draft processor (strict labels, telemetry, idempotent transitions)
- [x] TASK-02: Harden `/api/process-messaging-queue` fail-closed controls and checkout-date validation
- [x] TASK-03: Add stale `processing` lease recovery for messaging queue dispatcher
- [x] TASK-04: Make extension-request writes atomic/idempotent and remove partial-commit risk
- [x] TASK-05: Refresh tests and contract docs, then run scoped validation gates
- [x] TASK-06: Add atomic queue-claim path to remove concurrent double-dispatch risk
- [x] TASK-07: Add queue replay guard and split signature secret from bearer token
- [x] TASK-08: Ensure extension dedupe does not consume rate-limit quota and extend coverage
- [x] TASK-09: Fix check-in-code expiry validation to fail closed on invalid checkout dates
- [x] TASK-10: Add Prime Functions to package typecheck gate
- [x] TASK-11: Prevent zero-test pass outcomes in Prime CI related-test path
- [x] TASK-12: Make Prime critical E2E gate blocking on release branches
- [x] TASK-13: Extend deploy env gate to validate Prime runtime secrets
- [x] TASK-14: Return non-2xx on assistant LLM fallback while preserving safe user response
- [x] TASK-15: Replace skipped data-orchestrator placeholder tests with runnable coverage
- [x] TASK-16: Make Prime full-lint mode fail on ESLint errors

## Inherited Outcome Contract
- **Why:** The outbound path can silently drop workflow labels, duplicate drafts, and leave processing states stuck, which directly affects guest communication reliability and operator visibility.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime outbound messaging and draft orchestration fail closed, are idempotent on retries, and expose deterministic failure states with regression coverage.
- **Source:** operator

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Enforce strict draft outcome labels + telemetry and safe record transition behavior in MCP outbound drafts tool | 92% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Add auth/config fail-closed controls and explicit checkout-date validation in process-messaging-queue | 90% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Recover stale `processing` queue records and prevent permanent stuck states | 90% | M | Complete (2026-03-05) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Collapse extension-request writes to atomic multi-location update with deterministic request id | 91% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Extend regression tests/docs and run targeted typecheck/lint for changed packages | 95% | S | Complete (2026-03-05) | TASK-01, TASK-02, TASK-03, TASK-04 | - |
| TASK-06 | IMPLEMENT | Introduce Firebase conditional-write claim path for queue records to prevent concurrent duplicate sends | 91% | M | Complete (2026-03-05) | TASK-03 | TASK-08 |
| TASK-07 | IMPLEMENT | Add replay guard + dedicated signature secret for process-messaging-queue auth | 90% | M | Complete (2026-03-05) | TASK-02 | TASK-08 |
| TASK-08 | IMPLEMENT | Re-sequence extension dedupe/rate-limit behavior and extend regression validation/docs | 92% | S | Complete (2026-03-05) | TASK-04, TASK-05, TASK-06, TASK-07 | - |
| TASK-09 | IMPLEMENT | Validate check-in checkout date strictly and reject invalid expiry inputs | 92% | S | Complete (2026-03-05) | - | TASK-15 |
| TASK-10 | IMPLEMENT | Add dedicated Prime Functions TypeScript project and include it in package typecheck | 92% | S | Complete (2026-03-05) | - | TASK-15 |
| TASK-11 | IMPLEMENT | Ensure related-test CI path cannot succeed with zero executed tests for Prime | 90% | M | Complete (2026-03-05) | - | TASK-12 |
| TASK-12 | IMPLEMENT | Remove non-blocking override from Prime critical E2E gate | 93% | S | Complete (2026-03-05) | TASK-11 | - |
| TASK-13 | IMPLEMENT | Add Prime runtime secret assertions to deploy env validation and workflow wiring | 90% | M | Complete (2026-03-05) | - | - |
| TASK-14 | IMPLEMENT | Surface assistant LLM degradation as non-2xx while returning deterministic safe fallback body | 89% | M | Complete (2026-03-05) | - | TASK-15 |
| TASK-15 | IMPLEMENT | Replace skipped orchestrator tests with executable hook-level tests and remove obsolete placeholder test | 85% | M | Complete (2026-03-05) | TASK-09, TASK-10, TASK-14 | - |
| TASK-16 | IMPLEMENT | Remove fail-open `|| true` from Prime full-lint mode | 95% | S | Complete (2026-03-05) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | Independent surfaces; can be implemented in any order |
| 2 | TASK-03 | TASK-02 | Dispatcher recovery should be aligned with endpoint behavior |
| 3 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Final coverage + validation gate |
| 4 | TASK-06, TASK-07 | TASK-03, TASK-02 | Follow-up reliability wave from re-audit findings |
| 5 | TASK-08 | TASK-04, TASK-05, TASK-06, TASK-07 | Close remaining validation and quota-behavior gap |
| 6 | TASK-09, TASK-10, TASK-16 | - | Fast fail-closed validation fixes independent of CI workflow changes |
| 7 | TASK-11, TASK-12, TASK-13 | TASK-10 | CI/deploy gate hardening after Prime typecheck surface is explicit |
| 8 | TASK-14, TASK-15 | TASK-09, TASK-10 | Assistant signaling + orchestration test coverage cleanup |

## Tasks

### TASK-01: Harden MCP outbound draft processor (strict labels, telemetry, idempotent transitions)
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `packages/mcp-server/src/tools/outbound-drafts.ts`, `packages/mcp-server/src/__tests__/outbound-drafts.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 92%
- **Acceptance:**
  - Labeling failures no longer pass silently as drafted success.
  - Draft creation path emits outbound telemetry parity events.
  - Invalid-record remediation does not mutate non-pending records.
  - Processing transition prevents duplicate re-processing on patch retry edges.

### TASK-02: Harden `/api/process-messaging-queue` fail-closed controls and checkout-date validation
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/process-messaging-queue.ts`, `apps/prime/functions/__tests__/email-provider-smoke.test.ts`, `apps/prime/functions/__tests__/helpers.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 90%
- **Acceptance:**
  - Missing queue secret config fails closed with explicit error.
  - Invalid/missing authorization token is rejected.
  - Missing/invalid checkout date is permanent failure, not 30-day token fallback.

### TASK-03: Add stale `processing` lease recovery for messaging queue dispatcher
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/lib/messaging-dispatcher.ts`, `apps/prime/functions/__tests__/messaging-dispatcher.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 90%
- **Acceptance:**
  - A stale `processing` record is reclaimed back to runnable state deterministically.
  - Fresh `processing` records remain idempotently ignored.

### TASK-04: Make extension-request writes atomic/idempotent and remove partial-commit risk
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/extension-request.ts`, `apps/prime/functions/__tests__/extension-request.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 91%
- **Acceptance:**
  - Prime request and outbound draft are written in one atomic multi-path update.
  - Request IDs are deterministic for retry idempotency on same booking/guest/date.
  - No partial-commit path remains where request exists without outbox record.

### TASK-05: Refresh tests/docs and run scoped validation gates
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/docs/CONTRIBUTING.md`, test files listed above
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
- **Acceptance:**
  - Contract docs match runtime controls.
  - Added tests cover prior silent-failure paths.
  - `pnpm --filter @acme/mcp-server typecheck` and `pnpm --filter @acme/mcp-server lint` pass.
  - `pnpm --filter @apps/prime typecheck` and `pnpm --filter @apps/prime lint` pass.

### TASK-06: Add atomic queue-claim path to remove concurrent double-dispatch risk
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/lib/firebase-rest.ts`, `apps/prime/functions/lib/messaging-dispatcher.ts`, `apps/prime/functions/__tests__/messaging-dispatcher.test.ts`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 91%
- **Acceptance:**
  - Queue claim path supports conditional writes via Firebase ETag primitives.
  - Dispatcher uses atomic claim when available and avoids duplicate processing leases.
  - Claim-conflict retry exhaustion is deterministic and covered by tests.

### TASK-07: Add queue replay guard and split signature secret from bearer token
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/process-messaging-queue.ts`, `apps/prime/functions/__tests__/email-provider-smoke.test.ts`, `apps/prime/functions/__tests__/helpers.ts`, `apps/prime/docs/CONTRIBUTING.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-08
- **Confidence:** 90%
- **Acceptance:**
  - Signature verification can use dedicated secret (`PRIME_EMAIL_WEBHOOK_SIGNATURE_SECRET`).
  - Replayed `<timestamp,signature>` pairs are rejected when replay KV is available.
  - Regression tests cover dedicated signature-secret path and replay rejection.

### TASK-08: Ensure extension dedupe does not consume rate-limit quota and extend coverage
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/extension-request.ts`, `apps/prime/functions/__tests__/extension-request.test.ts`
- **Depends on:** TASK-04, TASK-05, TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 92%
- **Acceptance:**
  - Dedupe check executes before extension rate-limit increment.
  - Dedupe response path does not mutate extension-rate counters.
  - Coverage asserts dedupe short-circuit does not spend quota.

### TASK-09: Fix check-in-code expiry validation to fail closed on invalid checkout dates
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/check-in-code.ts`, `apps/prime/functions/__tests__/check-in-code.test.ts`
- **Depends on:** -
- **Blocks:** TASK-15
- **Confidence:** 92%
- **Acceptance:**
  - Invalid `checkOutDate` input is rejected with 400 and explicit error.
  - Expiry comparison path treats non-finite expiry values as invalid/expired.
  - Regression test covers prior silent invalid-expiry behavior.

### TASK-10: Add Prime Functions to package typecheck gate
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/package.json`, `apps/prime/tsconfig.functions.json`
- **Depends on:** -
- **Blocks:** TASK-15
- **Confidence:** 92%
- **Acceptance:**
  - `pnpm --filter @apps/prime typecheck` covers `apps/prime/functions/**` runtime code.
  - Worker global types (`PagesFunction`, `KVNamespace`) resolve in functions typecheck project.

### TASK-11: Prevent zero-test pass outcomes in Prime CI related-test path
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `.github/workflows/reusable-app.yml`, `apps/prime/package.json`
- **Depends on:** -
- **Blocks:** TASK-12
- **Confidence:** 90%
- **Acceptance:**
  - Prime related-test path no longer accepts `--passWithNoTests` success for zero executed tests.
  - Prime fallback/full test path remains operational and deterministic.

### TASK-12: Make Prime critical E2E gate blocking on release branches
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `.github/workflows/reusable-app.yml`
- **Depends on:** TASK-11
- **Blocks:** -
- **Confidence:** 93%
- **Acceptance:**
  - Prime release-branch critical E2E gate fails the workflow on test failure.
  - No `continue-on-error` bypass remains for that gate.

### TASK-13: Extend deploy env gate to validate Prime runtime secrets
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `scripts/validate-deploy-env.sh`, `.github/workflows/reusable-app.yml`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
- **Acceptance:**
  - Deploy env validation checks Prime-specific runtime secrets when app filter is Prime.
  - Reusable workflow forwards required Prime secret env vars into the gate step.

### TASK-14: Return non-2xx on assistant LLM fallback while preserving safe user response
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/functions/api/assistant-query.ts`, `apps/prime/src/app/(guarded)/digital-assistant/page.tsx`, `apps/prime/functions/api/__tests__/assistant-query.test.ts`
- **Depends on:** -
- **Blocks:** TASK-15
- **Confidence:** 89%
- **Acceptance:**
  - OpenAI upstream failure path returns non-2xx (degraded) HTTP status.
  - Response body still contains deterministic safe fallback payload.
  - Client path consumes degraded fallback payload without blank/error UX.

### TASK-15: Replace skipped data-orchestrator placeholder tests with runnable coverage
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx`, `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.test.ts`, `apps/prime/src/hooks/dataOrchestrator/useGuestProgressData.test.ts`, `apps/prime/src/hooks/dataOrchestrator/useUnifiedBreakfastData.test.tsx`
- **Depends on:** TASK-09, TASK-10, TASK-14
- **Blocks:** -
- **Confidence:** 85%
- **Acceptance:**
  - `describe.skip` placeholders are removed from the targeted orchestrator test files.
  - Tests assert real hook behavior with deterministic mocks (not `expect(true)` placeholders).
  - Obsolete placeholder coverage file for missing hook is removed or replaced with valid coverage.

### TASK-16: Make Prime full-lint mode fail on ESLint errors
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:** `apps/prime/scripts/lint-wrapper.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
- **Acceptance:**
  - `pnpm --filter @apps/prime lint -- --full` exits non-zero on ESLint errors.
  - No unconditional success override remains in full-lint branch.

## Risks & Mitigations
- Behavior changes may fail existing assumptions in downstream operators.
  - Mitigation: explicit error messages + targeted tests for failure contracts.
- Stale data semantics may differ between environments.
  - Mitigation: keep recovery threshold explicit and deterministic.

## Acceptance Criteria (overall)
- [x] Silent label-application success path removed from outbound drafts processor.
- [x] Duplicate draft risk reduced via deterministic processing transitions.
- [x] Queue processing endpoint now fails closed without required secret.
- [x] Messaging dispatcher no longer leaves stale `processing` states permanently stuck.
- [x] Extension request no longer has partial-commit write behavior.
- [x] Queue claim path now supports conditional atomic lease acquisition.
- [x] Queue signature verification supports replay guard and dedicated signature secret.
- [x] Duplicate extension submissions no longer consume rate-limit quota.
- [x] Focused tests + scoped lint/typecheck pass for changed packages.
- [x] Check-in code generation rejects invalid checkout dates and treats invalid stored expiry as expired.
- [x] Prime package typecheck now includes Cloudflare functions runtime code.
- [x] Prime CI related-test paths no longer pass with zero tests.
- [x] Prime critical release-branch E2E gate is blocking.
- [x] Deploy env gate validates Prime runtime secrets when Prime app is targeted.
- [x] Assistant degraded LLM path now returns non-2xx with deterministic fallback payload.
- [x] Orchestrator placeholder tests replaced with runnable coverage; obsolete breakfast placeholder test removed.
- [x] Prime full lint mode no longer has fail-open override.

## Build evidence (2026-03-05)
- Implemented fail-closed draft outcome labeling in `packages/mcp-server/src/tools/outbound-drafts.ts` via `applyDraftOutcomeLabelsStrict`, added `outbound` telemetry, and introduced processing-state recovery semantics.
- Implemented endpoint fail-closed controls in `apps/prime/functions/api/process-messaging-queue.ts`: required `PRIME_EMAIL_WEBHOOK_TOKEN`, bearer auth validation, signed request verification (`X-Prime-Queue-Timestamp` + `X-Prime-Queue-Signature`), optional KV request budget, and permanent failure on missing/invalid checkout date.
- Implemented stale lease recovery in `apps/prime/functions/lib/messaging-dispatcher.ts` for `processing` queue records (stale reclaim to `pending`, fresh lease remains idempotent).
- Implemented atomic multi-location write + deterministic request IDs in `apps/prime/functions/api/extension-request.ts` to remove partial-commit risk.
- Implemented stale existing-draft reconciliation in `packages/mcp-server/src/tools/outbound-drafts.ts` and ensured missing-`draftId` reconciliation paths persist failed status instead of silently returning failed in-memory only.
- Implemented Firebase ETag primitives in `apps/prime/functions/lib/firebase-rest.ts` and atomic claim path in `apps/prime/functions/lib/messaging-dispatcher.ts` with conditional-claim retry handling.
- Implemented dedicated signature-secret support plus replay guard in `apps/prime/functions/api/process-messaging-queue.ts`.
- Re-sequenced dedupe-before-rate-limit behavior in `apps/prime/functions/api/extension-request.ts`.
- Updated and expanded targeted tests:
  - `packages/mcp-server/src/__tests__/outbound-drafts.test.ts`
  - `apps/prime/functions/__tests__/email-provider-smoke.test.ts`
  - `apps/prime/functions/__tests__/messaging-dispatcher.test.ts`
  - `apps/prime/functions/__tests__/extension-request.test.ts`
- Updated runtime contract doc: `apps/prime/docs/CONTRIBUTING.md`.
- Validation executed:
  - `pnpm --filter @acme/mcp-server typecheck` (pass)
  - `pnpm --filter @acme/mcp-server lint` (pass)
  - `pnpm --filter @apps/prime typecheck` (pass)
  - `pnpm --filter @apps/prime lint` (pass; warnings only for non-UI hardcoded-copy debt)
- Follow-up reliability hardening implemented:
  - `apps/prime/functions/api/check-in-code.ts` now fail-closes invalid `checkOutDate` inputs and invalid/non-finite stored expiries.
  - Added regression coverage in `apps/prime/functions/__tests__/check-in-code.test.ts`.
  - `apps/prime/package.json` now typechecks both app and functions (`typecheck:app`, `typecheck:functions`) with `apps/prime/tsconfig.functions.json`.
  - `.github/workflows/reusable-app.yml` removed Prime related-test/fallback `--passWithNoTests`, removed Prime critical E2E `continue-on-error`, and passes Prime deploy env vars into `scripts/validate-deploy-env.sh`.
  - `scripts/validate-deploy-env.sh` now checks Prime runtime secrets when `APP_FILTER=@apps/prime` or `PROJECT_NAME=prime`.
  - `apps/prime/functions/api/assistant-query.ts` now returns `503` with `errorCode: llm_unavailable` for upstream LLM failures; client fallback handling updated in `apps/prime/src/app/(guarded)/digital-assistant/page.tsx`; test updated in `apps/prime/functions/api/__tests__/assistant-query.test.ts`.
  - Replaced skipped placeholder tests with runnable orchestrator tests in:
    - `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.test.tsx`
    - `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.test.ts`
    - `apps/prime/src/hooks/dataOrchestrator/useGuestProgressData.test.ts`
    - Removed obsolete placeholder `apps/prime/src/hooks/dataOrchestrator/useUnifiedBreakfastData.test.tsx`.
  - `apps/prime/scripts/lint-wrapper.sh` full-lint mode now fails on ESLint errors (removed fail-open).
  - Additional Prime-functions typecheck fixes required by new gate:
    - `apps/prime/functions/api/process-messaging-queue.ts` booking read type correction.
    - `apps/prime/functions/lib/firebase-custom-token.ts` PEM decode typing correction.
  - Validation re-run:
    - `pnpm --filter @apps/prime typecheck` (pass)
    - `pnpm --filter @apps/prime lint` (pass, warnings only)

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = weighted average across task confidence and effort = 92%
