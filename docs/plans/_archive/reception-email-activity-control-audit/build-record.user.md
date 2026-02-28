---
Status: Complete
Feature-Slug: reception-email-activity-control-audit
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record — Reception Email ↔ Activity Control Audit

## What Was Built

**Wave 1 (TASK-01, TASK-02, TASK-04, TASK-05)** — four independent fixes delivered in parallel:

- **TASK-01 (WEAK-C1):** Added `/activitiesByCode/22/{occupantId}/{activityId}` fanout write inside the occupant map loop in `processCancellationEmail.ts`. Each Octorate cancellation now writes to both Firebase paths, making code 22 queryable from the byCode index.

- **TASK-02 (WEAK-B1):** Added optional `reservationCode` field to `markProcessedSchema` in `gmail.ts`. When `action=agreement_received` and `reservationCode` is supplied, the handler GETs `/bookings/{reservationCode}`, then writes code 21 to both `/activities/21/` and `/activitiesByCode/21/` for each occupant. Backwards-compatible — existing callers not updated continue unchanged. Follow-on: ops-inbox skill must be updated to pass `reservationCode`.

- **TASK-04 (WEAK-A3):** In `useActivitiesMutations.ts`, the `maybySendEmailGuest` function's error/deferred branches now call `setError()` with user-visible messages. Email draft failures and missing-recipient cases surface in the hook's error state rather than being silently swallowed.

- **TASK-05 (WEAK-C2):** Added startup env validation block to `packages/mcp-server/src/index.ts`. If `FIREBASE_DATABASE_URL` is unset or does not start with `https://`, a warning is logged at startup. Server continues — non-fatal.

**Wave 2 (TASK-03)** — dependent on TASK-01 (same file) and TASK-02 (same file):

- **TASK-03 (WEAK-A2):** Three sub-changes: (a) In `guest-email-activity.ts`, redirected the circular import from `"./gmail.js"` to `"./gmail-shared.js"` (both `appendTelemetryEvent` and `applyDraftOutcomeLabelsStrict` are independently defined in `gmail-shared.ts`); (b) Extended `ProcessCancellationResult` with `occupantIds: string[]` and `guestEmails: Record<string,string>` — step 6 in `processCancellationEmail` GETs `/guestsDetails/{code}` to collect occupant emails (non-fatal, empty map on failure); (c) In `handleCancellationCase` in `gmail-booking.ts` (the live code path — NOT `_handleOrganizeInbox` in `gmail.ts` which is dead code), added a `Promise.allSettled` loop that calls `sendGuestEmailActivity({bookingRef, activityCode: 27, recipients: [email]})` for each occupant with an email address. Draft failures per-occupant are caught and logged; cancellation still returns `{processed: true}`.

**Wave 3 (TASK-06 Checkpoint):** Full validation confirmed all fixes green.

## Tests Run

| Command | Result |
|---|---|
| `jest --testPathPattern="(process-cancellation-email\|gmail-organize-inbox\|gmail-mark-processed)" --no-coverage` | 51/51 pass |
| `jest --testPathPattern="useActivitiesMutations" --no-coverage` (reception) | 10/10 pass |
| `pnpm --filter mcp-server typecheck` (tsc -b) | Clean (exit 0) |
| Pre-commit hook typecheck (turbo mcp-server + reception) | Clean (exit 0) |
| Pre-commit lint-staged (eslint, mcp-server + reception) | Warnings only, 0 errors |

4 pre-existing test failures in unrelated mcp-server tests were present before this build and are not introduced by these changes.

## Validation Evidence

**TASK-01:** TC-01 updated (mock sequences extended for both fanout paths per occupant); TC-05 asserts all 4 occupants → 8 activity writes total. 6/6 pass.

**TASK-02:** TC-06i updated (Firebase GET + dual PATCH mocked); TC-06i-b (no reservationCode → labels only, zero fetch calls); TC-06i-c (Firebase GET fails → labels still applied, success returned). 17/17 gmail-mark-processed tests pass.

**TASK-03:** TC-01 updated (7th mock for guestsDetails GET, assertions for `occupantIds` and `guestEmails`); TC-05 asserts `occupantIds`; TC-07a (guestEmails populated for occupants with email), TC-07b (no guestEmails when guestsDetails null), TC-07c (empty guestEmails when GET throws — non-fatal). TC-03a (drafts.create called per occupant with email), TC-03b (no draft when no email), TC-03c (draft failure caught, cancellation succeeds). 51/51 pass.

**TASK-04:** Existing "logs error" test updated to assert error state; TC-04b (no-recipient-email deferred sets error); TC-04c (other deferred reasons do not set error). 10/10 pass.

**TASK-05:** Manual verification (non-fatal startup guard; S-effort — test infrastructure not required per acceptance criteria). Env validation confirmed present in `index.ts`.

## Scope Deviations

Key architectural discovery during TASK-03: `gmail.ts` contains `_handleOrganizeInbox`, which is **dead code** — the live code path routes through `handleOrganizeInboxModule` (from `gmail-organize.ts`) → `handleCancellationCase` (from `gmail-booking.ts`). The email drafting loop was placed in `gmail-booking.ts` (correct) after investigation revealed the module split. The dead `_handleOrganizeInbox` function in `gmail.ts` retains the unused import and placeholder code from an earlier attempt (prior session) but does not affect runtime behaviour. This was noted but not cleaned up to keep TASK-03 scope bounded.

`Affects` for TASK-03 updated to include `packages/mcp-server/src/tools/gmail-booking.ts` as the primary implementation file (plan originally listed `gmail.ts` — module split discovery changed the correct implementation site).

## Outcome Contract

- **Why:** Email and activity systems must be consistent — a guest must not face booking cancellation after expressing agreement, and staff must not have to manually trigger notifications the system should handle automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All critical email↔activity control paths write to both Firebase paths and trigger appropriate guest communication drafts without requiring manual staff intervention.
- **Source:** operator
