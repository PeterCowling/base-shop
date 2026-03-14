---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-14
Feature-Slug: reception-prime-projection-job-status
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
---

# Build Record: Prime Projection Job Status — Shadow-Write Alignment

## Outcome Contract

- **Why:** Every time a message is sent through the reception inbox, a background job is created to keep related data up to date. If the status code on that job does not match what the background processor looks for, the jobs quietly pile up and the downstream data is never refreshed — with no error visible to staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Projection job records written by inbound message shadow-write paths carry `status: 'projected'` (not `'pending'`), consistent with the fact that Firebase is already written inline before the shadow-write is called. The shadow-write call sites are guarded by tests that assert the correct status value. There is no silent accumulation of semantically-incorrect `'pending'` records.
- **Source:** operator

## Self-Evolving Measurement

- **Status:** none

## What Was Built

**TASK-01: Fix shadow-write enqueue status.**
Both `enqueuePrimeProjectionJob` calls in `prime-messaging-shadow-write.ts` were updated to pass `status: 'projected'` explicitly. The `shadowWritePrimeInboundDirectMessage` function (line 175) and `shadowWritePrimeInboundActivityMessage` function (line 253) previously omitted the status field, defaulting to `'pending'`. Firebase is written inline by the API handler (`direct-message.ts`, `activity-message.ts`) before shadow-write is called, so the projection job is an audit record rather than a work item. The fix aligns both paths with the pattern already used by `sendPrimeReviewThread` (Path A). A JSDoc-style comment was added at each call site explaining the intent.

**TASK-02: Add projection status assertions to existing tests.**
Added `expect(projectionInsert?.binds[5]).toBe('projected')` to TC-08 in `direct-message.test.ts` and the equivalent projection-insert assertion block in `activity-message.test.ts`. These tests verify the D1 bind value at index 5 (the `status` column position in the `INSERT INTO message_projection_jobs` statement), preventing silent regression back to `'pending'`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | Pass | 60/60 tasks successful |
| `pnpm lint` (prime scope) | Pass | 21/21 tasks successful via `--filter=./apps/prime` |
| `pnpm lint` (full) | Pre-existing failure in `@themes/bcd` only — not related to this change | Unrelated to shadow-write or projection code |

## Workflow Telemetry Summary

None: workflow telemetry not recorded.

## Validation Evidence

### TASK-01 — Shadow-write status fix
- TC-01-A: `prime-messaging-shadow-write.ts` line 175 (direct message path): `enqueuePrimeProjectionJob` call now passes `status: 'projected'`. Confirmed in source after edit.
- TC-01-B: `prime-messaging-shadow-write.ts` line 253 (activity message path): `enqueuePrimeProjectionJob` call now passes `status: 'projected'`. Confirmed in source after edit.
- TC-01-C: Comment at each call site explains that Firebase is already written inline before shadow-write is called, making the job an audit record.

### TASK-02 — Test assertions
- TC-02-A: `direct-message.test.ts` TC-08: `expect(projectionInsert?.binds[5]).toBe('projected')` added after the existing `binds[2]` and `binds[3]` assertions.
- TC-02-B: `activity-message.test.ts`: `expect(projectionInsert?.binds[5]).toBe('projected')` added after existing projection-insert assertions.
- TC-02-C: Pre-commit hooks ran typecheck (`@apps/prime` scope) and lint-staged against all 3 changed files — all passed.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | N/A | No UI change |
| UX / states | N/A | No user-facing state change |
| Security / privacy | No new attack surface | Status change only; replay API gate unchanged |
| Logging / observability / audit | Improved | Job records now accurately reflect completion state; no silent false-pending accumulation |
| Testing / validation | Two new bind assertions in direct-message.test.ts and activity-message.test.ts | Regression-guards `binds[5]` against revert to `'pending'` |
| Data / contracts | Schema unchanged; `status` enum unchanged | Only the call-site default value was overridden |
| Performance / reliability | No impact | No new queries, no new indices required |
| Rollout / rollback | Zero-risk | No schema migration; instant rollback by reverting commit d3df334259 |

## Scope Deviations

None. The build matched the two-task scope described in the fact-find (TASK-01 + TASK-02). TASK-03 (end-to-end replay cycle test) and TASK-04 (JSDoc on `enqueuePrimeProjectionJob` distinguishing work-queue vs audit-record call sites) were deferred as out of scope for this fix — TASK-01 includes inline comments at the call sites which partially fulfils TASK-04's intent.
