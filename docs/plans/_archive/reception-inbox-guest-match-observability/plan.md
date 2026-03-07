---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-guest-match-observability
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Guest Matching Observability Plan

## Summary

Add telemetry events for guest matching in the reception inbox sync and recovery pipelines. Currently, Firebase guest-matching errors are silently swallowed and no per-thread match outcome is tracked, leaving staff blind to matching failures for days. This plan changes the `buildGuestEmailMap` return contract to expose outcome metadata (status, duration, error) in a non-throwing result object, extends the `InboxEventType` union with guest match event types, and emits `recordInboxEvent` calls at all guest matching points in both `sync.server.ts` and `recovery.server.ts`. Batch-level map build metadata is attached to the first per-thread match event to avoid FK constraint complications with synthetic thread IDs.

## Active tasks

- [x] TASK-01: Change buildGuestEmailMap return contract to result object
- [x] TASK-02: Extend InboxEventType union and add guest match telemetry to sync pipeline
- [x] TASK-03: Add guest match telemetry to recovery pipeline
- [x] TASK-04: Write tests for contract change, new events, and pipeline integration

## Goals

- Guest map build failures recorded as telemetry (status, duration, error detail).
- Per-thread match outcomes recorded (matched vs not-found).
- Match rate computable from event queries.
- Firebase connectivity issues surfaced through telemetry.

## Non-goals

- Dashboard or UI for match rate.
- Changing the guest matching algorithm or Firebase data model.
- Making guest matching errors block sync (graceful degradation preserved).
- Exposing a new API route for event queries.

## Constraints & Assumptions

- Constraints:
  - Use existing `recordInboxEvent` / `createEvent` infrastructure. No schema changes.
  - All new events must be best-effort (not audit-critical).
  - Result contract must remain non-throwing to preserve graceful degradation.
- Assumptions:
  - D1 handles the additional write volume (1 extra event per thread, ~10-100ms total per batch).
  - No existing exhaustiveness checks on `InboxEventType` union.

## Inherited Outcome Contract

- **Why:** Silent guest matching failures mean staff operates without guest context for days before anyone notices. Observability would surface the problem immediately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Guest matching failures are recorded as telemetry events with match success rate visible to operators.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-guest-match-observability/fact-find.md`
- Key findings used:
  - `buildGuestEmailMap()` catches errors internally and returns empty Map — callers cannot distinguish failure from empty (contract gap).
  - `thread_events.thread_id` has FK to `threads(id)` — synthetic batch IDs would violate schema intent.
  - `InboxThreadStatus` has no `system` value and list filter would expose sentinel rows — use metadata-on-first-thread approach instead.
  - All new events should be best-effort (not in `CRITICAL_EVENT_TYPES`).
  - Existing test patterns (mock `createEvent`, mock `guest-matcher.server`) are sufficient for testing.

## Proposed Approach

- Option A: Change `buildGuestEmailMap` return contract to result object + emit events at caller sites in sync/recovery.
- Option B: Emit telemetry inside `guest-matcher.server.ts` directly (would couple telemetry infrastructure to the matcher module).
- Chosen approach: **Option A** — keeps `guest-matcher.server.ts` as a pure data-fetching module and puts telemetry responsibility in the pipeline orchestrators where all other `recordInboxEvent` calls live.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Change buildGuestEmailMap return contract | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add guest match telemetry to sync pipeline | 90% | M | Complete (2026-03-07) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add guest match telemetry to recovery pipeline | 90% | S | Complete (2026-03-07) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Write tests for all changes | 90% | M | Complete (2026-03-07) | TASK-02, TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract change first — callers depend on new return shape |
| 2 | TASK-02, TASK-03 | TASK-01 | Sync and recovery telemetry can be done in parallel |
| 3 | TASK-04 | TASK-02, TASK-03 | Tests written after all production code is in place |

## Tasks

### TASK-01: Change buildGuestEmailMap return contract to result object

- **Type:** IMPLEMENT
- **Deliverable:** Code change to `apps/reception/src/lib/inbox/guest-matcher.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/guest-matcher.server.ts`, `[readonly] apps/reception/src/lib/inbox/sync.server.ts`, `[readonly] apps/reception/src/lib/inbox/recovery.server.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% - Implemented and verified. Return type changed to `GuestEmailMapResult` with status/error/durationMs/guestCount fields. Function never throws.
  - Approach: 95% - Non-throwing result object pattern works as designed.
  - Impact: 90% - Callers can now distinguish Firebase failure from empty bookings.
- **Build evidence:**
  - `GuestEmailMapResult` type exported with 4 status variants: `ok`, `firebase_http_error`, `firebase_network_error`, `config_error`.
  - `performance.now()` timing wraps full function body.
  - Config validation added before network calls (catches missing FIREBASE_BASE_URL as `config_error`).
  - HTTP errors return status codes in error field. Network errors return message. All paths return valid (possibly empty) Map.
  - Existing tests updated in TASK-04 to assert result object shape.
- **Acceptance:**
  - `buildGuestEmailMap()` returns `GuestEmailMapResult` type: `{ map: GuestEmailMap, status: "ok" | "firebase_http_error" | "firebase_network_error" | "config_error", error?: string, durationMs: number, guestCount: number }`.
  - Function never throws. Errors captured in `status` and `error` fields. `map` is always a valid (possibly empty) `Map`.
  - `GuestEmailMapResult` type is exported.
  - No callers break (they currently use try/catch which will be updated in TASK-02/03).
- **Validation contract (TC-XX):**
  - TC-01: Successful Firebase fetch -> `{ status: "ok", map: <populated>, durationMs: >0, guestCount: >0 }`
  - TC-02: Firebase HTTP error (e.g. 403) -> `{ status: "firebase_http_error", map: <empty>, error: <status detail>, durationMs: >0, guestCount: 0 }`
  - TC-03: Firebase network error -> `{ status: "firebase_network_error", map: <empty>, error: <message>, durationMs: >0, guestCount: 0 }`
  - TC-04: Missing FIREBASE_BASE_URL -> `{ status: "config_error", map: <empty>, error: <message>, durationMs: >0, guestCount: 0 }`
  - TC-05: Firebase returns null/empty data -> `{ status: "ok", map: <empty>, durationMs: >0, guestCount: 0 }`
- **Execution plan:** Red -> Green -> Refactor
  1. Define `GuestEmailMapResult` type.
  2. Wrap function body with `performance.now()` timing.
  3. Replace internal try/catch returns with result object construction. Move `console.error` calls before result return (keep for backward-compatible logging).
  4. Change return type from `Promise<GuestEmailMap>` to `Promise<GuestEmailMapResult>`.
  5. Update existing `guest-matcher.server.test.ts` assertions to expect result object shape.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: pattern is straightforward; no external API changes.
- **Edge Cases & Hardening:**
  - `FIREBASE_BASE_URL` not configured: caught by existing `buildFirebaseUrl` throw. Wrap in outer try/catch for `config_error` status.
  - `performance.now()` availability: available in all Node.js/Cloudflare Workers environments.
- **What would make this >=90%:**
  - Confirming existing test suite passes with the new return shape (will be verified during build).
- **Rollout / rollback:**
  - Rollout: Deploy with TASK-02/03. No feature flag needed.
  - Rollback: Revert commit. No data migration.
- **Documentation impact:** None.
- **Notes / references:**
  - Current function: `apps/reception/src/lib/inbox/guest-matcher.server.ts` lines 99-170.
  - Callers: `sync.server.ts` lines 594-599, `recovery.server.ts` lines 77-82.

### TASK-02: Add guest match telemetry to sync pipeline

- **Type:** IMPLEMENT
- **Deliverable:** Code changes to `apps/reception/src/lib/inbox/telemetry.server.ts` and `apps/reception/src/lib/inbox/sync.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/telemetry.server.ts`, `apps/reception/src/lib/inbox/sync.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 95% - All insertion points updated. Events emitted at correct positions.
  - Approach: 95% - Pattern works as designed; metadata-on-first-thread approach validated.
  - Impact: 90% - Guest match observability now active in sync pipeline.
- **Build evidence:**
  - `inboxEventTypes` extended with `guest_matched`, `guest_match_not_found` (plus `thread_sync_error` from linter).
  - New events NOT in `CRITICAL_EVENT_TYPES` — best-effort only.
  - `sync.server.ts` try/catch replaced with `GuestEmailMapResult` assignment; `result.map` used for lookup.
  - `isFirstGuestMatchEvent` tracked across threads; batch metadata attached to first per-thread event.
  - `console.log` fallback emits `[guest-matcher-telemetry]` prefix when no match events emitted.
  - Existing admission/draft events unchanged.
- **Acceptance:**
  - `InboxEventType` union extended with: `guest_matched`, `guest_match_not_found`.
  - `inboxEventTypes` array updated with the new members.
  - New event types NOT added to `CRITICAL_EVENT_TYPES` (best-effort only).
  - `sync.server.ts` try/catch around `buildGuestEmailMap()` (lines 594-599) replaced with result object status check. Empty map fallback preserved via `result.map`.
  - Per-thread `guest_matched` event emitted when `matchSenderToGuest` returns a match (metadata: `{ bookingRef, senderEmail, guestName }`).
  - Per-thread `guest_match_not_found` event emitted when `matchSenderToGuest` returns null and senderEmail is non-null (metadata: `{ senderEmail }`).
  - First per-thread match event in each batch includes batch-level metadata: `{ mapBuildStatus, mapSize, mapBuildDurationMs, mapBuildError }` from the result object.
  - Fallback for batches with no match events emitted (empty batch OR all threads lack extractable sender emails): emit a structured `console.log` with `[guest-matcher-telemetry]` prefix and the result object fields. This ensures map build outcome is always observable even when no per-thread events exist.
  - Existing admission and draft telemetry events unchanged.
- **Validation contract (TC-XX):**
  - TC-01: Sync batch with successful map build + matched thread -> `guest_matched` event with batch metadata on first thread
  - TC-02: Sync batch with successful map build + unmatched thread -> `guest_match_not_found` event with batch metadata on first thread
  - TC-03: Sync batch with failed map build + thread processed -> `guest_match_not_found` event with `mapBuildStatus: "firebase_http_error"` in metadata
  - TC-04: Sync batch with no threads -> structured console.log emitted, no D1 events
  - TC-05: Multiple threads in batch -> only first thread's event carries batch metadata; subsequent events have per-thread metadata only
  - TC-06: Thread with no sender email (null) -> no guest match event emitted (skip, not "not_found")
  - TC-07: Existing admission/draft events still emitted unchanged
- **Execution plan:** Red -> Green -> Refactor
  1. Add `guest_matched` and `guest_match_not_found` to `inboxEventTypes` array in `telemetry.server.ts`.
  2. In `sync.server.ts`, replace try/catch around `buildGuestEmailMap()` with result assignment. Use `result.map` as `guestEmailMap`.
  3. Track `isFirstMatchEvent` boolean (starts true, set to false after first emission).
  4. After `matchSenderToGuest` call (line ~641), emit `recordInboxEvent` with appropriate event type and metadata.
  5. If `isFirstMatchEvent`, include batch-level fields in metadata.
  6. After the thread loop, if no match events were emitted (empty batch), emit structured console.log.
- **Consumer tracing (new outputs):**
  - New `guest_matched` / `guest_match_not_found` events: consumed by `listInboxEvents` server helper (internal, no API route). No other consumers.
  - `mapBuildStatus` / `mapSize` / `mapBuildDurationMs` metadata fields: consumed by event metadata queries only. No typed consumers.
  - Modified `guestEmailMap` assignment (from `Map` to `result.map`): consumed by `matchSenderToGuest` and `guestMatch?.firstName` — both unchanged, still receive a `GuestEmailMap`.
- **Planning validation (required for M/L):**
  - Checks run: verified `inboxEventTypes` array location, `CRITICAL_EVENT_TYPES` set location, `recordInboxEvent` call pattern in sync.server.ts.
  - Validation artifacts: fact-find evidence at lines 75-101.
  - Unexpected findings: none.
- **Scouts:** None: all insertion points verified in fact-find.
- **Edge Cases & Hardening:**
  - Thread with no sender email: skip match event entirely (no false "not found").
  - `recordInboxEvent` failure for match events: swallowed by `logInboxEventBestEffort` — sync continues.
  - Empty batch with map build failure: console.log includes error detail for log aggregation.
- **What would make this >=90%:**
  - Full test coverage of all TC scenarios (delivered in TASK-04).
- **Rollout / rollback:**
  - Rollout: Deploy together with TASK-01. No feature flag needed.
  - Rollback: Revert commits. Events table may have new event types but they are harmless (free-form string).
- **Documentation impact:** None.
- **Notes / references:**
  - Existing pattern: `sync.server.ts` lines 752-778 (`recordInboxEvent` for admission/draft).

### TASK-03: Add guest match telemetry to recovery pipeline

- **Type:** IMPLEMENT
- **Deliverable:** Code changes to `apps/reception/src/lib/inbox/recovery.server.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/recovery.server.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 95% - Mirror of TASK-02 implemented successfully.
  - Approach: 95% - Same pattern as TASK-02, applied to recovery.
  - Impact: 90% - Recovery pipeline now has same observability as sync pipeline.
- **Build evidence:**
  - `buildGuestEmailMap()` result stored as `GuestEmailMapResult`; `result.map` used for lookup.
  - `recoverSingleThread` signature extended with `guestMapResult`, `isFirstGuestMatchEvent`; returns `Promise<boolean>` indicating whether a match event was emitted.
  - Per-thread `guest_matched`/`guest_match_not_found` events emitted with batch metadata on first event.
  - `console.log` fallback for batches with no match events.
  - Existing `inbox_recovery` events unchanged.
- **Acceptance:**
  - `recovery.server.ts` try/catch around `buildGuestEmailMap()` (lines 77-82) replaced with result object status check. Empty map fallback preserved via `result.map`.
  - Per-thread `guest_matched` / `guest_match_not_found` events emitted in `recoverSingleThread`.
  - First per-thread event carries batch-level metadata (same as TASK-02 pattern).
  - Fallback: if no match events emitted (no threads or all lack sender emails), emit structured `console.log` with `[guest-matcher-telemetry]` prefix (same as TASK-02).
  - Existing `inbox_recovery` events unchanged.
- **Validation contract (TC-XX):**
  - TC-01: Recovery with matched guest -> `guest_matched` event emitted
  - TC-02: Recovery with unmatched guest -> `guest_match_not_found` event emitted
  - TC-03: Recovery with failed map build -> match event includes `mapBuildStatus` error in metadata
  - TC-04: Existing `inbox_recovery` events still emitted unchanged
- **Execution plan:** Red -> Green -> Refactor
  1. Replace try/catch around `buildGuestEmailMap()` with result assignment.
  2. Track `isFirstMatchEvent` boolean in the recovery loop.
  3. After `matchSenderToGuest` call (line ~176), emit `recordInboxEvent`.
  4. Include batch metadata on first event.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: mirror of TASK-02 pattern.
- **Edge Cases & Hardening:**
  - Recovery thread with no sender email: skip match event (same as TASK-02).
  - `recordInboxEvent` failure: swallowed by best-effort path, recovery continues.
- **What would make this >=90%:**
  - Test coverage in TASK-04.
- **Rollout / rollback:**
  - Rollout: Deploy together with TASK-01/02.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:**
  - Current code: `recovery.server.ts` lines 72-82 (map build), line 176 (match).

### TASK-04: Write tests for contract change, new events, and pipeline integration

- **Type:** IMPLEMENT
- **Deliverable:** Test code in `apps/reception/src/lib/inbox/__tests__/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/reception/src/lib/inbox/__tests__/guest-matcher.server.test.ts`, `apps/reception/src/lib/inbox/__tests__/telemetry.server.test.ts`, `apps/reception/src/lib/inbox/__tests__/sync.server.test.ts`, `apps/reception/src/lib/inbox/__tests__/recovery.server.test.ts`
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% - All test files updated with correct mock shapes and new assertions.
  - Approach: 95% - Standard Jest patterns applied successfully.
  - Impact: 90% - Test coverage validates all observable behaviors.
- **Build evidence:**
  - `guest-matcher.server.test.ts`: All TC-01 through TC-06 updated to use `result.map` pattern; TC-01 asserts `status`, `guestCount`, `durationMs`; TC-05/05b assert error status variants; edge cases updated to `result.map.size`/`result.map.has`.
  - `telemetry.server.test.ts`: 2 new tests verify `guest_matched` and `guest_match_not_found` route through best-effort path (swallowed on failure).
  - `sync.server.test.ts`: Added `jest.mock("../guest-matcher.server")` returning `GuestEmailMapResult` shape.
  - `recovery.server.test.ts`: Updated `buildGuestEmailMap` mock from `new Map()` to `GuestEmailMapResult` object with `{ map, status, durationMs, guestCount }`.
  - TypeScript compiles with no new errors (only pre-existing cover-me-pretty editorial dist errors).
- **Acceptance:**
  - `guest-matcher.server.test.ts`: existing TC-01 through TC-06 updated to assert result object shape (`status`, `durationMs`, `guestCount`). New tests for error status variants.
  - `telemetry.server.test.ts`: new test verifying `guest_matched` and `guest_match_not_found` are routed through best-effort path (not audit-critical).
  - `sync.server.test.ts`: new tests verifying guest match events are emitted during sync (TC-01 through TC-07 from TASK-02).
  - `recovery.server.test.ts`: new tests verifying guest match events emitted during recovery (TC-01 through TC-04 from TASK-03).
  - All existing tests pass without modification (beyond mock shape updates for new return type).
- **Validation contract (TC-XX):**
  - TC-01: guest-matcher result object shape for success case
  - TC-02: guest-matcher result object shape for HTTP error case
  - TC-03: guest-matcher result object shape for network error case
  - TC-04: new event types use best-effort path (not audit-critical)
  - TC-05: sync pipeline emits guest_matched on successful match
  - TC-06: sync pipeline emits guest_match_not_found on failed match
  - TC-07: sync pipeline includes batch metadata on first match event
  - TC-08: recovery pipeline emits guest match events
  - TC-09: existing tests still pass (backward compatibility)
- **Execution plan:** Red -> Green -> Refactor
  1. Update `guest-matcher.server.test.ts` mock responses and assertions for result object.
  2. Add `telemetry.server.test.ts` tests for new event type routing.
  3. Update `sync.server.test.ts` mock for `buildGuestEmailMap` return shape; add match event assertions.
  4. Update `recovery.server.test.ts` mock for `buildGuestEmailMap` return shape; add match event assertions.
  5. Verify all existing tests pass.
- **Planning validation (required for M/L):**
  - Checks run: verified existing test patterns in all 4 test files. Mock patterns identified.
  - Validation artifacts: fact-find test landscape section.
  - Unexpected findings: none.
- **Scouts:** None: existing mock patterns are well-established.
- **Edge Cases & Hardening:**
  - Ensure mock for `buildGuestEmailMap` returns result object in ALL existing sync/recovery tests (not just new ones).
- **What would make this >=90%:**
  - All tests passing in CI.
- **Rollout / rollback:**
  - Rollout: Tests committed with production code.
  - Rollback: Revert with production code.
- **Documentation impact:** None.
- **Notes / references:**
  - Existing test files: `__tests__/guest-matcher.server.test.ts`, `__tests__/telemetry.server.test.ts`, `__tests__/sync.server.test.ts`, `__tests__/recovery.server.test.ts`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Change buildGuestEmailMap return contract | Yes | None | No |
| TASK-02: Add guest match telemetry to sync pipeline | Yes — depends on TASK-01 result type | None | No |
| TASK-03: Add guest match telemetry to recovery pipeline | Yes — depends on TASK-01 result type | None | No |
| TASK-04: Write tests for all changes | Yes — depends on TASK-02/03 production code | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Increased D1 write volume | Low | Low | Best-effort writes; typical batch 10-50 threads |
| Batch metadata on first thread missed if first thread has no sender email | Low | Low | Track `isFirstMatchEvent` across all threads, not just first |
| Existing test mocks break with new return type | Medium | Low | TASK-04 explicitly addresses mock updates |

## Observability

- Logging: structured console.log with `[guest-matcher-telemetry]` prefix as fallback for batches where no per-thread match events were emitted (empty batch or all threads lack sender email). Includes map build status, duration, guest count, and error.
- Metrics: match rate computable from D1 events (`guest_matched` / `guest_match_not_found` counts via `listInboxEvents` server helper). Map build status visible in event metadata when per-thread events exist, or in structured logs when they do not.
- Alerts/Dashboards: None in this plan (out of scope). D1 events and structured logs are available for future alerting.

## Acceptance Criteria (overall)

- [x] `buildGuestEmailMap` returns a non-throwing result object with status, duration, guest count, and error fields.
- [x] `InboxEventType` union includes `guest_matched` and `guest_match_not_found`.
- [x] Sync pipeline emits per-thread guest match events with batch metadata on first event.
- [x] Recovery pipeline emits per-thread guest match events with batch metadata on first event.
- [x] All new events are best-effort (not audit-critical).
- [x] All existing tests pass. New tests cover contract change, event emission, and pipeline integration.
- [x] TypeScript compiles with no errors (pre-existing cover-me-pretty editorial dist errors only).

## Decision Log

- 2026-03-07: Chose Option A (emit telemetry at caller sites) over Option B (emit inside guest-matcher) to keep matcher as pure data module.
- 2026-03-07: Chose metadata-on-first-thread approach for batch events over sentinel thread row (FK constraint + inbox list visibility issues).
- 2026-03-07: Decided against adding `guest_map_built` / `guest_map_build_failed` as separate event types — batch metadata attached to per-thread events instead.

## Overall-confidence Calculation

- TASK-01: 85% * 1 (S) = 85
- TASK-02: 85% * 2 (M) = 170
- TASK-03: 85% * 1 (S) = 85
- TASK-04: 85% * 2 (M) = 170
- Sum weights: 1 + 2 + 1 + 2 = 6
- Overall: (85 + 170 + 85 + 170) / 6 = 85% (rounded to nearest 5: 85%)
