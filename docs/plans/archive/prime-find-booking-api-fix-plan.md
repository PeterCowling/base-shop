---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-12
Feature-Slug: prime-find-booking-api-fix
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
---

# Fix find-booking & guest-session APIs Plan

## Summary

The `/api/find-booking` and `/api/guest-session` POST endpoints are completely broken — they reference a data model that doesn't exist in Firebase. Both must be rewritten to match the real data model. The working `/api/guest-booking` endpoint demonstrates the correct patterns. This is a straightforward rewrite with proven patterns and trivially testable via existing infrastructure.

## Goals

- `/api/find-booking` correctly looks up a booking by reference (Firebase key) and verifies the guest surname against `guestsDetails`
- `/api/guest-session` POST correctly verifies last name and returns guest first name from `guestsDetails`
- Token issuance works with the real data model (occupant IDs from booking keys, checkout dates from occupant records)
- Tests mock the real Firebase data shape and pass
- Full flow works end-to-end: `/find-my-stay` → `/api/find-booking` → redirect to `/g/{token}` → `/api/guest-session` → session stored

## Non-goals

- Changing the UI pages (`find-my-stay/page.tsx`, `g/page.tsx`) — they are correct
- Changing the working `/api/guest-booking` endpoint
- Adding new Firebase paths or migrating data
- Changing the `guestSessionsByToken` schema

## Constraints & Assumptions

- Constraints:
  - Must run as Cloudflare Pages Functions (REST API via `FirebaseRest` only)
  - Rate limiting via KV must be preserved
- Assumptions:
  - Every booking has at least one occupant with a corresponding `guestsDetails` record

## Fact-Find Reference

- Related brief: `docs/plans/prime-find-booking-api-fix-lp-fact-find.md`
- Key findings:
  - Booking reference IS the Firebase key (not a field on the booking record)
  - Guest names live at `guestsDetails/{bookingRef}/{occupantId}` with separate `firstName`/`lastName` fields
  - Booking records contain only occupant sub-objects keyed by `occ_*`
  - `booking.guestName`, `booking.bookingRef`, `booking.occupants`, `booking.guestPortalToken`, `booking.checkInCode` do not exist
  - Working reference: `guest-booking.ts:126-158` demonstrates correct data access patterns
  - All 5 find-booking/guest-session tests that hit Firebase mock the wrong data shape (extinct)
  - `guestPortalToken` should not be stored on booking node (breaks type contract)
  - Check-in code generation is dead code (never used by UI, empty in production)

## Existing System Notes

- Key modules/files:
  - `apps/prime/functions/api/guest-booking.ts` — working reference for correct patterns (lines 126-158)
  - `apps/prime/functions/lib/firebase-rest.ts` — REST client (`get`, `set`, `update`, `delete`)
  - `apps/prime/functions/lib/guest-session.ts` — shared `validateGuestSessionToken` helper
  - `apps/prime/functions/__tests__/helpers.ts` — `createMockEnv`, `createMockKv`, `createPagesContext`
  - `apps/prime/src/types/bookings.ts` — `BookingOccupantData`, `BookingOccupants`
  - `apps/prime/src/types/guestsDetails.ts` — `GuestDetailsRecord`, `GuestsDetailsByOccupantId`
- Patterns to follow:
  - Direct path lookup: `firebase.get('bookings/' + bookingId)` (not full-table scan)
  - Occupant key filtering: `Object.keys(booking).filter(key => key.startsWith('occ_'))`
  - Guest details fetch: `firebase.get('guestsDetails/' + bookingId + '/' + guestUuid)`
  - Name fallback chain: `guestDetails?.firstName ?? occupant.firstName ?? ''`
  - Test mocking: `jest.spyOn(FirebaseRest.prototype, 'get')` with `mockImplementation` routing by path

## Proposed Approach

Rewrite both endpoints to use direct path lookups following the proven `guest-booking.ts` patterns:

1. **find-booking.ts**: Replace full-table scan with direct `bookings/{ref}` lookup → extract `occ_*` occupants → find lead guest → fetch `guestsDetails/{ref}/{occId}` → compare surname → issue token to `guestSessionsByToken` (always new, no booking node pollution). Remove dead check-in code generation.

2. **guest-session.ts POST**: Replace `booking.guestName` lookup with occupant-based approach → extract `occ_*` occupants from booking → resolve target occupant via `session.guestUuid` or lead guest fallback → fetch `guestsDetails/{bookingId}/{occId}` → compare `lastName` → return `firstName`.

Both changes follow identical patterns already proven in `guest-booking.ts`. No architectural decisions needed.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Rewrite find-booking.ts endpoint and tests | 90% | S | Complete (2026-02-11) | - | - |
| TASK-02 | IMPLEMENT | Fix guest-session.ts POST and tests | 90% | S | Complete (2026-02-11) | - | - |

> Effort scale: S=1, M=2, L=3

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02 | - | Fully independent — no shared files modified |

**Max parallelism:** 2 | **Critical path:** 1 wave | **Total tasks:** 2

## Tasks

### TASK-01: Rewrite find-booking.ts endpoint and tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/find-booking.ts` + `apps/prime/functions/__tests__/find-booking.test.ts`
- **Execution-Skill:** /lp-build
- **Affects:** `apps/prime/functions/api/find-booking.ts`, `apps/prime/functions/__tests__/find-booking.test.ts`
  - `[readonly] apps/prime/functions/api/guest-booking.ts` (reference implementation)
  - `[readonly] apps/prime/src/types/bookings.ts` (data contracts)
  - `[readonly] apps/prime/src/types/guestsDetails.ts` (data contracts)
  - `[readonly] apps/prime/functions/__tests__/helpers.ts` (test utilities)
  - `[readonly] apps/prime/functions/lib/firebase-rest.ts` (REST client)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — Exact pattern exists in `guest-booking.ts:126-158`. Direct path lookup, occupant key filtering, guest details fetch are all proven. `FirebaseRest` API is stable.
  - Approach: 90% — Direct lookup (not full-table scan) is clearly correct. Always issuing new tokens is simpler and avoids booking node pollution. Dead check-in code removal is safe (empty in production, unused by UI).
  - Impact: 90% — Only `find-booking.ts` changes. Upstream (`find-my-stay/page.tsx`) only uses `redirectUrl` from response. Token shape (`guestSessionsByToken`) is unchanged.
- **Acceptance:**
  - `find-booking.ts` uses direct path lookup `bookings/{ref}` instead of full-table scan
  - Surname verification uses `guestsDetails/{ref}/{occId}.lastName` instead of non-existent `booking.guestName`
  - Token issuance uses lead guest `occ_*` key as `guestUuid` and occupant `checkOutDate` for expiry
  - No writes to booking node (no `guestPortalToken`, no `checkInCode` pollution)
  - Check-in code generation removed (dead code)
  - All existing test cases rewritten with correct Firebase data shapes
  - New test cases added for booking-not-found and no-guest-details scenarios
  - All tests pass
- **Validation contract:**
  - TC-01: Valid booking ref + matching surname → 200 with `{ redirectUrl: '/g/{token}' }`; `firebase.set` called on `guestSessionsByToken/{token}` with correct shape
  - TC-02: Valid booking ref + wrong surname → 404; rate limit incremented via KV put
  - TC-03: Rate limit exceeded (5 attempts) → 429; no Firebase calls made
  - TC-04: Non-existent booking ref → 404 (`firebase.get('bookings/{ref}')` returns null)
  - TC-05: Booking exists but `guestsDetails/{ref}` returns null → 404
  - TC-06: Token issuance stores `guestUuid` = lead guest occupant key, `expiresAt` = checkout + 48h
  - **Acceptance coverage:** TC-01 covers happy path + surname verification + token issuance; TC-02 covers surname mismatch + rate limiting; TC-03 covers rate limiting; TC-04 covers booking not found; TC-05 covers missing guest details; TC-06 covers token shape correctness
  - **Validation type:** unit
  - **Validation location:** `apps/prime/functions/__tests__/find-booking.test.ts`
  - **Run/verify:** `cd apps/prime && npx jest --config jest.config.cjs functions/__tests__/find-booking.test.ts`
- **Execution plan:** Red → Green → Refactor
  - **Red evidence:** Existing tests pass but mock wrong data shape (extinct). New tests with correct mocks will fail until implementation is rewritten.
  - **Green evidence:** Rewrite implementation to use direct path lookup + guestsDetails. All TCs pass.
  - **Refactor evidence:** Clean up dead code (check-in generation, booking node writes). Tests stay green.
- **Scouts:**
  - `FirebaseRest.get` supports direct path lookup → confirmed via `guest-booking.ts:127` usage
  - `guestsDetails/{ref}` returns all occupant details as `Record<string, GuestDetailsRecord>` → confirmed via lp-fact-find Firebase query evidence
  - Token shape (`guestSessionsByToken`) is unchanged → confirmed via `guest-session.ts:59` and `guest-booking.ts` usage
- **Rollout / rollback:**
  - Rollout: Deploy via Cloudflare Pages Functions (automatic on push)
  - Rollback: Revert commit (endpoint is independent, no migration)
- **Documentation impact:** None
- **Notes / references:**
  - Working reference: `apps/prime/functions/api/guest-booking.ts:126-158`
  - Real data example: booking `IM6JF8` with occupant `occ_1767440561435`, guest `Megan Rochford`

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** 465baa65d5
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04, TC-05, TC-06
  - Cycles: 2 red-green (first run revealed unmocked `firebase.set` causing 401)
  - Initial validation: FAIL expected (old implementation does full-table scan)
  - Final validation: PASS (all 6 tests green)
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed all assumptions; minor fix needed for setSpy mock
- **Validation:**
  - Ran: `cd apps/prime && npx jest --config jest.config.cjs functions/__tests__/find-booking.test.ts` — PASS (6/6)
  - Typecheck: PASS (pre-commit hook)
  - Lint: PASS (pre-commit hook)
- **Documentation updated:** None required
- **Implementation notes:** Replaced full-table scan with direct path lookup. Removed dead code (check-in generation, booking node writes). Added `setSpy.mockResolvedValue(undefined)` to TC-01/TC-06 to prevent real HTTP requests.

### TASK-02: Fix guest-session.ts POST and tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/prime/functions/api/guest-session.ts` + `apps/prime/functions/__tests__/guest-session.test.ts`
- **Execution-Skill:** /lp-build
- **Affects:** `apps/prime/functions/api/guest-session.ts`, `apps/prime/functions/__tests__/guest-session.test.ts`
  - `[readonly] apps/prime/functions/api/guest-booking.ts` (reference implementation)
  - `[readonly] apps/prime/src/types/bookings.ts` (data contracts)
  - `[readonly] apps/prime/src/types/guestsDetails.ts` (data contracts)
  - `[readonly] apps/prime/functions/__tests__/helpers.ts` (test utilities)
  - `[readonly] apps/prime/functions/lib/firebase-rest.ts` (REST client)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% — Same pattern as `guest-booking.ts:134-158`. Occupant resolution and guest details fetch are directly reusable. The `normalizeLastName`/`getFirstName` helpers just need simplification for separate `firstName`/`lastName` fields.
  - Approach: 90% — Occupant-based name lookup is the only viable approach given the data model. Fallback to lead guest when `guestUuid` is null matches `guest-booking.ts` pattern.
  - Impact: 90% — Only POST handler changes. GET handler is already correct. Upstream (`g/page.tsx`) expects `{ bookingId, guestUuid, guestFirstName }` response shape which is preserved.
- **Acceptance:**
  - POST handler fetches booking via direct path, resolves occupant, fetches guest details from `guestsDetails/{bookingId}/{occId}`
  - Surname comparison uses `guestDetails.lastName` instead of non-existent `booking.guestName`
  - Returns `guestFirstName: guestDetails.firstName` instead of parsing non-existent full name
  - `normalizeLastName` simplified to not parse full names (or removed in favor of direct field access)
  - `getFirstName` removed (replaced by direct `guestDetails.firstName` access)
  - GET handler unchanged (already correct)
  - TC-06 and TC-07 rewritten with correct Firebase data shapes
  - New test case for null `guestUuid` fallback added
  - All tests pass
- **Validation contract:**
  - TC-04: GET valid non-expired token → 200 with `{ status: 'ok', expiresAt }` (existing, unchanged)
  - TC-05: GET expired token → 410 (existing, unchanged)
  - TC-06: POST valid token + matching lastName → 200 with `{ bookingId, guestUuid, guestFirstName }` where `guestFirstName` comes from `guestsDetails`
  - TC-07: POST valid token + wrong lastName → 403; rate limit incremented
  - TC-08: POST with `guestUuid: null` in session → resolves lead guest from booking occupants, fetches correct guest details, returns 200
  - **Acceptance coverage:** TC-04/05 cover GET handler (unchanged); TC-06 covers POST happy path + correct name resolution; TC-07 covers surname mismatch + rate limiting; TC-08 covers null guestUuid fallback
  - **Validation type:** unit
  - **Validation location:** `apps/prime/functions/__tests__/guest-session.test.ts`
  - **Run/verify:** `cd apps/prime && npx jest --config jest.config.cjs functions/__tests__/guest-session.test.ts`
- **Execution plan:** Red → Green → Refactor
  - **Red evidence:** TC-06/07 currently pass with wrong mocks (extinct). New mocks with correct data shape will fail until POST handler is rewritten.
  - **Green evidence:** Rewrite POST to use occupant + guestsDetails lookup. All TCs pass.
  - **Refactor evidence:** Clean up dead helper functions. Tests stay green.
- **Scouts:**
  - `guestsDetails/{bookingId}/{occId}` returns `GuestDetailsRecord` with `firstName` and `lastName` → confirmed via lp-fact-find evidence and `guest-booking.ts:149`
  - POST response shape `{ bookingId, guestUuid, guestFirstName }` is what `g/page.tsx` expects → confirmed via `apps/prime/src/app/g/page.tsx` source
  - GET handler reads only from `guestSessionsByToken` (no booking data) → confirmed correct, no changes needed
- **Rollout / rollback:**
  - Rollout: Deploy via Cloudflare Pages Functions (automatic on push)
  - Rollback: Revert commit (endpoint is independent, no migration)
- **Documentation impact:** None
- **Notes / references:**
  - Working reference: `apps/prime/functions/api/guest-booking.ts:134-158`
  - POST response contract: `apps/prime/src/app/g/page.tsx` consumes `{ bookingId, guestUuid, guestFirstName }`

#### Build Completion (2026-02-11)
- **Status:** Complete
- **Commits:** e90436d80b
- **Execution cycle:**
  - Validation cases executed: TC-04, TC-05, TC-06, TC-07, TC-08
  - Cycles: 1 red-green
  - Initial validation: FAIL expected (TC-06 and TC-08 return 403 because old code reads non-existent `booking.guestName`)
  - Final validation: PASS (all 5 tests green)
- **Confidence reassessment:**
  - Original: 90%
  - Post-validation: 92%
  - Delta reason: validation confirmed all assumptions; clean single-cycle implementation
- **Validation:**
  - Ran: `cd apps/prime && npx jest --config jest.config.cjs functions/__tests__/guest-session.test.ts` — PASS (5/5)
  - Also ran both suites together: 11/11 PASS (no regression)
  - Typecheck: PASS (pre-commit hook)
  - Lint: PASS (pre-commit hook)
- **Documentation updated:** None required
- **Implementation notes:** Replaced `booking.guestName` lookup with occupant-based `guestsDetails/{bookingId}/{occId}` fetch. Removed dead helpers (`normalizeLastName`, `getFirstName`). Added lead guest fallback when `session.guestUuid` is null. Returns `guestUuid: targetOccupantId` (resolved, not session value).

## Risks & Mitigations

- **Some bookings lack `guestsDetails` records**: Low likelihood. Mitigation: return 404 with helpful message when guest details not found. `guest-booking.ts` already handles this gracefully.
- **Old `guestPortalToken` values on booking nodes**: Low impact. New code won't read them. Old tokens in `guestSessionsByToken` expire naturally. No cleanup needed.

## Observability

- Logging: `console.error` for failures (existing pattern in all endpoints)
- Metrics: N/A (no metrics infrastructure for Pages Functions)
- Alerts/Dashboards: N/A

## Acceptance Criteria (overall)

- [x] `/api/find-booking` returns correct `redirectUrl` for real booking ref + matching surname
- [x] `/api/guest-session` POST returns correct `guestFirstName` from `guestsDetails`
- [x] All tests pass with mocks matching the real Firebase data model (11/11)
- [x] Typecheck passes (`pnpm --filter @apps/prime typecheck`)
- [x] No regression in `/api/guest-session` GET (unchanged)
- [x] No regression in `/api/guest-booking` (not touched)

## Decision Log

- 2026-02-11: Always issue new tokens instead of reusing `booking.guestPortalToken` — reuse requires full-table scan of `guestSessionsByToken` or polluting the booking node. Old tokens expire naturally. Simpler and type-safe.
- 2026-02-11: Remove check-in code generation — dead code. `checkInCodesByCode` is empty in production. UI only uses `redirectUrl` from the response. Can be re-added later if needed via a separate task.
- 2026-02-11: Fetch all occupant guest details via `guestsDetails/{ref}` (all occupants at once) rather than fetching only lead guest — allows surname matching against any occupant, not just the lead.
