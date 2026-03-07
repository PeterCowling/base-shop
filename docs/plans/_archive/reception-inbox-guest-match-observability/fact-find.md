---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-guest-match-observability
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-guest-match-observability/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9202
Trigger-Why:
Trigger-Intended-Outcome:
---

# Guest Matching Observability Fact-Find Brief

## Scope

### Summary

Firebase guest-matching errors in the reception inbox sync pipeline are silently swallowed. When `buildGuestEmailMap()` fails (Firebase outage, auth error, network timeout), the sync pipeline falls back to an empty map and every thread in that batch loses guest context. No telemetry event is recorded for the failure, and no per-thread match outcome is tracked. Staff discover the problem days later when they notice missing guest names in draft replies.

This fact-find investigates adding telemetry events for guest map build outcomes (success/failure) and per-thread match outcomes (matched/not-found), using the existing `recordInboxEvent` infrastructure.

### Goals

- Record guest map build success/failure as telemetry events (including map size, duration, error details) by changing the `buildGuestEmailMap` return contract to expose outcome metadata.
- Record per-thread guest match outcome (matched vs not-found) as telemetry events.
- Enable operators to compute match rate (matched / total attempted) from event queries.
- Surface Firebase connectivity issues through telemetry rather than relying on console.error.

### Non-goals

- Building a dashboard or UI for match rate (events are queryable via the existing `listInboxEvents` server helper in `telemetry.server.ts` — note: this is an internal function, not an exposed API route).
- Changing the guest matching algorithm or Firebase data model.
- Making guest matching errors block the sync pipeline (graceful degradation is correct behaviour).
- Adding retry logic to Firebase calls.

### Constraints & Assumptions

- Constraints:
  - New events must use the existing `recordInboxEvent` / `createEvent` infrastructure (D1 events table). No schema changes.
  - Guest match telemetry must be best-effort (non-audit-critical) so a telemetry failure does not break sync.
  - Per-thread match events add one D1 write per thread. Since `recordInboxEvent` is async/awaited (not fire-and-forget), this adds ~1-2ms per thread. For typical batch sizes (10-50 threads), total added latency is 10-100ms — acceptable for a background sync job. No batching needed at this scale.
- Assumptions:
  - The existing events table can accommodate increased write volume (2-4 extra events per sync batch + 1 per thread).
  - `eventType` is a free-form string in the database; adding new types requires only updating the TypeScript union in `telemetry.server.ts`.

## Outcome Contract

- **Why:** Silent guest matching failures mean staff operates without guest context for days before anyone notices. Observability would surface the problem immediately.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Guest matching failures are recorded as telemetry events with match success rate visible to operators.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/sync.server.ts` — `syncInbox()` function, the primary inbox sync entry point. Guest map build at lines 594-599, per-thread match at lines 639-641.
- `apps/reception/src/lib/inbox/recovery.server.ts` — Recovery pipeline, guest matching at lines 174-176.

### Key Modules / Files

- `apps/reception/src/lib/inbox/guest-matcher.server.ts` — `buildGuestEmailMap()` (Firebase fetch + map build), `matchSenderToGuest()` (pure lookup). **Contract gap:** errors are caught internally (lines 107-125) and an empty `Map` is returned — callers cannot distinguish "Firebase failed" from "no active bookings." The return contract must be changed to a result object (e.g. `{ map, status, error?, durationMs }`) so callers can emit accurate telemetry.
- `apps/reception/src/lib/inbox/telemetry.server.ts` — `recordInboxEvent()` dispatches to `logInboxEvent` (audit-critical, throws) or `logInboxEventBestEffort` (swallows errors). Event type union: 10 types currently defined.
- `apps/reception/src/lib/inbox/repositories.server.ts` — `createEvent()` persists to D1 events table. `CreateEventInput` type accepts free-form `eventType: string`.
- `apps/reception/src/lib/inbox/sync.server.ts` — Sync pipeline orchestrator. Already calls `recordInboxEvent` for admission and draft events (lines 752-778).

### Patterns & Conventions Observed

- Best-effort telemetry for non-critical events: `logInboxEventBestEffort` wraps in try/catch, logs to console on failure. Evidence: `telemetry.server.ts` lines 98-108.
- Event metadata clamped to 4096 chars before persistence. Evidence: `telemetry.server.ts` lines 48-67.
- Typed event union with runtime-unchecked string storage in D1. Evidence: `CreateEventInput.eventType` is `string`, but `InboxEventType` union constrains TypeScript callers. `telemetry.server.ts` lines 11-22.
- Silent error fallback pattern in sync pipeline: try/catch returning empty/null with no observability. Evidence: `sync.server.ts` line 597 `catch { guestEmailMap = new Map(); }`.
- **Contract change required for observability:** `buildGuestEmailMap()` currently catches all errors internally and always returns a plain `Map`. Callers cannot distinguish "Firebase failed" from "no active bookings with email." To emit accurate telemetry, the function must return a result object (e.g. `{ map: GuestEmailMap, status: "ok" | "firebase_error" | "network_error", error?: string, durationMs: number, guestCount: number }`) so callers can record the correct event type and metadata. **Critically, the result contract must remain non-throwing** — errors are captured in the `status` and `error` fields, and `map` is always a valid (possibly empty) `Map`. This preserves graceful degradation. The sync pipeline's outer try/catch (line 597) can then be replaced with a status check on the result object.

### Data & Contracts

- Types/schemas/events:
  - `InboxEventType` union in `telemetry.server.ts` — needs new members: `guest_map_built`, `guest_map_build_failed`, `guest_matched`, `guest_match_not_found`.
  - `InboxEvent` type — `metadata` field carries arbitrary JSON (clamped to 4096 chars).
  - `CreateEventInput` in `repositories.server.ts` — `eventType: string`, no enum constraint at DB level.
  - `CRITICAL_EVENT_TYPES` set in `telemetry.server.ts` — guest match events should NOT be added here (best-effort only).
- Persistence:
  - D1 `events` table via `createEvent()`. Thread-scoped (`threadId` required).
  - For batch-level events (`guest_map_built`, `guest_map_build_failed`): the `thread_events` table declares `FOREIGN KEY (thread_id) REFERENCES threads(id)`. D1 does not enforce FKs by default, but the schema intent should be respected. Two viable approaches:
    - **(a) Metadata-on-first-thread:** Attach batch-level outcome to the first thread's `guest_matched` / `guest_match_not_found` event metadata (add fields: `mapBuildStatus`, `mapSize`, `mapBuildDurationMs`, `mapBuildError`). This avoids creating any synthetic thread row and keeps events strictly thread-scoped. Batch-level stats are recoverable by querying the first event per sync batch.
    - **(b) Structured logging:** Emit `guest_map_built` / `guest_map_build_failed` via structured `console.log` (JSON format) rather than D1 events. This keeps the events table thread-scoped and avoids sentinel row complications (fake thread leaking into inbox list, `InboxThreadStatus` not having a `system` value).
    - **Recommended: (a)** — keeps all telemetry in D1 and queryable, avoids schema/visibility complications of sentinel rows.
- API/contracts:
  - `listInboxEvents()` server helper supports filtering by `eventType`, `threadId`, `startTime`, `endTime`. New event types are automatically queryable internally (no exposed API route exists yet).

### Dependency & Impact Map

- Upstream dependencies:
  - Firebase RTDB (bookings + guestDetails endpoints) — source of guest data for `buildGuestEmailMap()`.
  - Gmail API — provides thread/message data that triggers guest matching.
- Downstream dependents:
  - `generateAgentDraft()` — receives `guestName` from match result for personalised drafts.
  - Thread metadata — stores guest booking context (ref, occupant ID, check-in/out, room numbers).
  - `listInboxEvents()` server helper — consumers of telemetry data (future dashboards, alerts; no exposed API route yet).
- Likely blast radius:
  - Moderate but well-contained. The `buildGuestEmailMap` return contract change touches the function itself, both callers (`sync.server.ts`, `recovery.server.ts`), and existing test mocks (`guest-matcher.server.test.ts`, `sync.server.test.ts`, `recovery.server.test.ts`). The telemetry additions are purely additive (new event types, new `recordInboxEvent` calls).
  - Files affected: `guest-matcher.server.ts`, `sync.server.ts`, `recovery.server.ts`, `telemetry.server.ts`, plus their test files (5-6 files total).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest
- Commands: `pnpm -w run test:governed` (CI only per testing-policy.md)
- CI integration: Governed test runner in CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| guest-matcher | Unit | `__tests__/guest-matcher.server.test.ts` | TC-01 through TC-06: match success, no-match, historical exclusion, dedup, Firebase errors, case-insensitive. Good coverage. |
| telemetry | Unit | `__tests__/telemetry.server.test.ts` | Audit-critical routing, best-effort swallowing, metadata truncation, list forwarding. Good coverage. |
| sync pipeline | Unit | `__tests__/sync.server.test.ts` | Mocks guest-matcher. Tests sync flow including admission and draft events. |
| recovery | Unit | `__tests__/recovery.server.test.ts` | Mocks guest-matcher. Tests recovery flow. |

#### Coverage Gaps

- No tests verify that guest match outcomes produce telemetry events (the gap this feature fills).
- No tests for the `buildGuestEmailMap` error path producing a telemetry event (currently no event is emitted).

#### Testability Assessment

- Easy to test:
  - New event type union membership (type-level, compile-time).
  - `recordInboxEvent` calls with new event types (mock `createEvent`, assert calls).
  - Sync pipeline emitting guest match events (existing test pattern in `sync.server.test.ts`).
- Hard to test:
  - Nothing significant. All insertion points are already well-tested with mock patterns.
- Test seams needed:
  - None new. Existing mocks for `createEvent` and `guest-matcher.server` are sufficient.

#### Recommended Test Approach

- Unit tests for: new event type membership in `inboxEventTypes` array, `recordInboxEvent` routing for new types (best-effort path), `buildGuestEmailMap` result contract (success/error status, duration, guest count).
- Integration tests for: sync pipeline emitting `guest_map_built`/`guest_map_build_failed` events, per-thread `guest_matched`/`guest_match_not_found` events, recovery pipeline emitting equivalent events.

### Recent Git History (Targeted)

- `612efb38a6` — `feat(reception-inbox-inprogress-recovery)`: Added recovery pipeline with guest matching integration. Recent, establishes the pattern for guest matching in recovery flow.
- `836fa1a446` — `feat(reception): integrate guest booking context into inbox`: Original guest matching integration. Established the `buildGuestEmailMap` + `matchSenderToGuest` pattern.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is additive (new event types + new `recordInboxEvent` calls at known insertion points), uses a well-established pattern, requires no schema changes, and has clear test seams. All evidence has been gathered; no unknowns remain. The blast radius is confined to 3-4 files with well-tested existing patterns.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Guest matcher error handling (`guest-matcher.server.ts`) | Yes | None | No |
| Sync pipeline guest map build (`sync.server.ts` L594-599) | Yes | None | No |
| Sync pipeline per-thread matching (`sync.server.ts` L639-641) | Yes | None | No |
| Recovery pipeline matching (`recovery.server.ts` L174-176) | Yes | None | No |
| Telemetry infrastructure (`telemetry.server.ts`) | Yes | None | No |
| Event persistence (`repositories.server.ts` `createEvent`) | Yes | None | No |
| Test coverage for new events | Yes | None | No |
| Batch-level event threadId constraint | Partial | [Type contract gap] [Minor]: `createEvent` requires `threadId` but batch-level `guest_map_built` events are not thread-scoped. Need a synthetic ID or batch-scoped approach. | No (Minor — design decision for plan phase) |

## Questions

### Resolved

- Q: Can new event types be added without a database migration?
  - A: Yes. `CreateEventInput.eventType` is `string` in the DB layer. Only the TypeScript `InboxEventType` union needs extending.
  - Evidence: `repositories.server.ts` line 185-190, `telemetry.server.ts` lines 11-22.

- Q: Should guest match events be audit-critical or best-effort?
  - A: Best-effort. Guest match telemetry is observability, not an audit trail. Failures should not break sync.
  - Evidence: Pattern established by `drafted` and `review_later` events which use `logInboxEventBestEffort`. `telemetry.server.ts` lines 43-47.

- Q: How should batch-level guest map build outcomes be recorded?
  - A: Attach batch outcome metadata (`mapBuildStatus`, `mapSize`, `mapBuildDurationMs`, `mapBuildError`) to the first thread's per-thread guest match event. This avoids creating synthetic thread rows (which would leak into the inbox list since `InboxThreadStatus` has no `system` value, and the list query's visibility filter would not hide them). Batch-level stats are recoverable by querying events with these metadata fields.
  - Evidence: `apps/reception/migrations/0001_inbox_init.sql` lines 47-55 (FK constraint); `repositories.server.ts` `InboxThreadStatus` type; `api-models.server.ts` list filter hides only `auto_archived` and `resolved`.

- Q: Does recovery.server.ts also need guest match telemetry?
  - A: Yes, for consistency. Recovery uses the same `buildGuestEmailMap` + `matchSenderToGuest` pattern and should emit the same events.
  - Evidence: `recovery.server.ts` lines 174-176, same pattern as `sync.server.ts`.

### Open (Operator Input Required)

None. All design decisions can be resolved from codebase evidence and the stated outcome.

## Confidence Inputs

- Implementation: 95% — Well-established pattern (copy existing `recordInboxEvent` calls), clear insertion points, no architectural novelty. Raises to >=90: already there.
- Approach: 90% — Additive telemetry events using existing infrastructure is the correct minimal approach. Raises to >=90: already there.
- Impact: 85% — Events will surface Firebase failures immediately via queryable telemetry. Match rate computation becomes possible. Raises to >=90: add a summary endpoint or dashboard query (out of scope for this change).
- Delivery-Readiness: 95% — All code paths identified, test patterns established, no external dependencies beyond what exists. Raises to >=90: already there.
- Testability: 95% — Existing mock patterns for `createEvent` and `guest-matcher.server` cover all needed test seams. Raises to >=90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Increased D1 write volume from per-thread events | Low | Low | Events are best-effort; typical sync batches process 10-50 threads. D1 handles this easily. |
| Batch map build outcome not visible as a standalone event | Low | Low | Attach batch metadata to the first thread's match event; recoverable via metadata field queries. If no threads processed (empty batch), emit a structured console.log as fallback. |
| Event type union change breaks exhaustiveness checks | Low | Low | No existing switch/case exhaustiveness checks on `InboxEventType` in the codebase. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `recordInboxEvent` (not direct `createEvent`) for all new events.
  - New event types must be added to the `inboxEventTypes` array in `telemetry.server.ts`.
  - New events must NOT be added to `CRITICAL_EVENT_TYPES` (best-effort only).
- Rollout/rollback expectations:
  - Additive change, no rollback needed. New events simply start appearing in the events table.
- Observability expectations:
  - After deployment, `listInboxEvents({ eventType: "guest_map_built" })` should return events for each sync batch.
  - Match rate = count(`guest_matched`) / (count(`guest_matched`) + count(`guest_match_not_found`)) over a time window.

## Suggested Task Seeds (Non-binding)

1. Change `buildGuestEmailMap()` return contract from `Promise<GuestEmailMap>` to a non-throwing result object (`{ map, status, error?, durationMs, guestCount }`). The function still catches errors internally but captures them in the result instead of swallowing them. `map` is always a valid (possibly empty) `Map`. Update callers in `sync.server.ts` and `recovery.server.ts` to read the result status instead of using a try/catch.
2. Extend `InboxEventType` union with new guest match event types (`guest_map_built`, `guest_map_build_failed`, `guest_matched`, `guest_match_not_found`).
3. Add `recordInboxEvent` calls in `sync.server.ts`: attach batch-level map build metadata (`mapBuildStatus`, `mapSize`, `mapBuildDurationMs`) to the first per-thread guest match event. For empty batches (no threads), emit structured console.log with the same fields.
4. Add per-thread `guest_matched` / `guest_match_not_found` events in `sync.server.ts` after the match lookup.
5. Add equivalent events in `recovery.server.ts` for consistency.
6. Write tests: guest-matcher contract change tests, telemetry unit tests for new event types, sync pipeline event emission tests, recovery pipeline event emission tests.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - TypeScript compiles with no errors.
  - All existing tests pass.
  - New tests cover: event type union, batch-level events, per-thread events, error path events.
  - Manual verification: trigger a sync and query `listInboxEvents` for new event types.
- Post-delivery measurement plan:
  - Query `guest_map_built` events to verify Firebase connectivity visibility.
  - Compute match rate from `guest_matched` / `guest_match_not_found` event counts.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all claims traced to specific file paths and line numbers.
- Boundary coverage: Firebase integration boundary inspected (error paths in `guest-matcher.server.ts`), D1 persistence boundary inspected (`createEvent` in `repositories.server.ts`).
- Error/fallback paths: silent catch in `sync.server.ts` line 597 identified as the primary gap.
- Testing coverage: existing tests verified (4 test files covering guest-matcher, telemetry, sync, recovery). Coverage gaps for new events identified.

### Confidence Adjustments

- No downward adjustments needed. All evidence areas have concrete file references and the pattern is well-established.

### Remaining Assumptions

- D1 write capacity is sufficient for the additional events (low risk given typical batch sizes of 10-50 threads).
- No existing code performs exhaustiveness checks on the `InboxEventType` union that would break with new members.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-inbox-guest-match-observability --auto`
