---
Status: Complete
Feature-Slug: reception-inbox-guest-match-observability
Completed-date: 2026-03-07
artifact: build-record
Build-Event-Ref: docs/plans/reception-inbox-guest-match-observability/build-event.json
---

# Build Record — Guest Matching Observability

## What Was Built

Changed the `buildGuestEmailMap()` return contract from a bare `Map` to a structured `GuestEmailMapResult` object that exposes build status, error detail, duration, and guest count. The function remains non-throwing — errors are captured in the result fields and `map` is always a valid (possibly empty) Map. This closes the observability gap where callers could not distinguish Firebase failures from empty booking data.

Extended the `InboxEventType` union with `guest_matched` and `guest_match_not_found` event types, routed through the best-effort (non-critical) telemetry path so failures do not block sync or recovery.

Added per-thread guest match telemetry emission in both the sync pipeline (`sync.server.ts`) and recovery pipeline (`recovery.server.ts`). Each batch attaches map build metadata (status, duration, guest count, error) to the first per-thread match event, giving operators a single query path to see both batch-level Firebase health and per-thread match outcomes. A structured `console.log` fallback covers empty batches where no per-thread events are emitted.

Updated all test mocks across four test files to use the new `GuestEmailMapResult` shape and added tests verifying the new event types route through the best-effort telemetry path.

## Tests Run

- TypeScript compilation: `pnpm typecheck` — passed (only pre-existing cover-me-pretty editorial dist errors, unrelated).
- Tests are CI-only per `docs/testing-policy.md`. All test file changes follow established mock patterns and are expected to pass in CI.

## Validation Evidence

- **TASK-01 (contract change):** `GuestEmailMapResult` type exported with 4 status variants. `performance.now()` timing wraps full function body. Config validation catches missing `FIREBASE_BASE_URL`. All error paths return result objects instead of throwing.
- **TASK-02 (sync telemetry):** `inboxEventTypes` extended. `sync.server.ts` try/catch replaced with result assignment. `isFirstGuestMatchEvent` tracks batch metadata attachment. `recordInboxEvent` called per-thread with appropriate event type.
- **TASK-03 (recovery telemetry):** Mirror of TASK-02 applied to `recovery.server.ts`. `recoverSingleThread` returns boolean indicating match event emission.
- **TASK-04 (tests):** `guest-matcher.server.test.ts` TC-01 through TC-06 updated for result object. `telemetry.server.test.ts` has 2 new best-effort routing tests. `sync.server.test.ts` and `recovery.server.test.ts` mocks updated for new return shape.

## Scope Deviations

- `thread_sync_error` event type added to `inboxEventTypes` alongside the guest match types (originated from linter applying cached patterns from a concurrent agent session). This is harmless and additive.
- `deriveDraftFailureReason` import added to `sync.server.ts` and `recovery.server.ts` by linter (from a concurrent agent's work on draft failure reasons). These are pre-existing working tree changes that were included in the staged diff.

## Outcome Contract

- **Why:** Silent guest matching failures mean staff operates without guest context for days before anyone notices. Observability would surface the problem immediately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Guest matching failures are recorded as telemetry events with match success rate visible to operators.
- **Source:** operator
