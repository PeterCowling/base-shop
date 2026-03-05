---
Type: Plan
Status: Active
Domain: Prime
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05 (TASK-01..TASK-05 complete; replay/reconcile hardening)
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

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | Independent surfaces; can be implemented in any order |
| 2 | TASK-03 | TASK-02 | Dispatcher recovery should be aligned with endpoint behavior |
| 3 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Final coverage + validation gate |

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
- [x] Focused tests + scoped lint/typecheck pass for changed packages.

## Build evidence (2026-03-05)
- Implemented fail-closed draft outcome labeling in `packages/mcp-server/src/tools/outbound-drafts.ts` via `applyDraftOutcomeLabelsStrict`, added `outbound` telemetry, and introduced processing-state recovery semantics.
- Implemented endpoint fail-closed controls in `apps/prime/functions/api/process-messaging-queue.ts`: required `PRIME_EMAIL_WEBHOOK_TOKEN`, bearer auth validation, signed request verification (`X-Prime-Queue-Timestamp` + `X-Prime-Queue-Signature`), optional KV request budget, and permanent failure on missing/invalid checkout date.
- Implemented stale lease recovery in `apps/prime/functions/lib/messaging-dispatcher.ts` for `processing` queue records (stale reclaim to `pending`, fresh lease remains idempotent).
- Implemented atomic multi-location write + deterministic request IDs in `apps/prime/functions/api/extension-request.ts` to remove partial-commit risk.
- Implemented stale existing-draft reconciliation in `packages/mcp-server/src/tools/outbound-drafts.ts` and ensured missing-`draftId` reconciliation paths persist failed status instead of silently returning failed in-memory only.
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
  - `pnpm --filter @apps/prime lint` (pass; changed-file lint warnings only for intentionally ignored files)

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = weighted average across task confidence and effort = 92%
