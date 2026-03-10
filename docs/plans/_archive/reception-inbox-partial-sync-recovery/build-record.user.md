---
Type: Build-Record
Status: Complete
Feature-Slug: reception-inbox-partial-sync-recovery
Completed-date: 2026-03-07
artifact: build-record
---

# Build Record: Reception Inbox Partial Sync Recovery

## Outcome Contract

- **Why:** A single sync failure can permanently skip threads, causing emails to be missed. This is the most dangerous reliability gap in the pipeline.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Sync checkpoint is held back (not advanced) when any thread fails during processing, ensuring no threads are permanently skipped. On partial failure, the next sync re-discovers all threads from the same history point, giving failed threads another chance.
- **Source:** operator

## What Was Built

**TASK-01: Per-thread error isolation and all-or-nothing checkpoint hold-back.** Extracted the entire per-thread processing body from `syncInbox()` into a new `processThread()` async helper function with a `ProcessThreadContext` parameter object. This resolved the ESLint cyclomatic complexity violation (was ~67, max 60) and enabled clean per-thread try/catch isolation. Added `let hasErrors = false` tracking, `counts.threadErrors` counter, and conditional checkpoint advancement: `upsertInboxSyncCheckpoint` is only called when `hasErrors` is false. The catch block logs the error, increments the counter, and records a best-effort `thread_sync_error` telemetry event (nested try/catch so telemetry failures do not mask the original error). Added `checkpointAdvanced: boolean` to `SyncInboxResult` and `threadErrors: number` to `SyncInboxResult.counts`. Added `thread_sync_error` to the `inboxEventTypes` union in `telemetry.server.ts`.

**TASK-02: Unit tests for partial sync failure and checkpoint hold-back.** Added 4 tests in a new `describe("partial sync failure and checkpoint hold-back")` block: (1) holds back checkpoint when one thread fails (partial failure), (2) advances checkpoint when all threads succeed, (3) holds back checkpoint when all threads fail, (4) still counts errors when telemetry recording fails in the catch block. Tests use helper functions `setupIncrementalSync()`, `makeThread()`, and `setupDraftMock()` for clean setup. Added `buildGuestEmailMap` mock returning `{ map: new Map(), status: "ok", durationMs: 0, guestCount: 0 }`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=sync.server --no-coverage` | Pass (CI) | 5 tests pass (1 existing + 4 new) |

## Validation Evidence

### TASK-01
- TC-01-A (checkpoint hold-back): `hasErrors` flag blocks `upsertInboxSyncCheckpoint` call; verified by test assertions `expect(upsertInboxSyncCheckpointMock).not.toHaveBeenCalled()` in partial and full failure scenarios
- TC-01-B (error counting): `counts.threadErrors` incremented in catch block; verified by `expect(result.counts.threadErrors).toBe(1)` and `.toBe(2)` assertions
- TC-01-C (result contract): `checkpointAdvanced: boolean` present on `SyncInboxResult`; verified by `expect(result.checkpointAdvanced).toBe(false)` and `.toBe(true)` assertions
- TC-01-D (telemetry): `thread_sync_error` event type added to `inboxEventTypes` array; telemetry failure in catch block is swallowed (nested try/catch); verified by test "still counts error when telemetry recording fails"

### TASK-02
- TC-02-A (test coverage): 4 test cases covering partial failure, full success, full failure, and telemetry failure scenarios
- TC-02-B (mock infrastructure): `buildGuestEmailMap` mock added; existing mock infrastructure extended cleanly
- TC-02-C (lint/typecheck): `npx eslint` and `npx tsc --noEmit` pass on all modified files (pre-existing `getPendingDraft` import error is unrelated)

## Scope Deviations

None. All changes within planned scope. The `processThread()` extraction was anticipated as a code-organization approach to manage ESLint complexity limits.
