---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Feature-Slug: prime-find-booking-api-fix
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-find-booking-api-fix-plan.md
Business-OS-Integration: off
---

# Fix find-booking & guest-session APIs — Fact-Find Brief

## Scope

### Summary

The `/api/find-booking` and `/api/guest-session` (POST) Cloudflare Pages Function endpoints are completely broken. They reference a data model that does not exist in Firebase (`booking.guestName`, `booking.bookingRef`, `booking.occupants` array, `booking.guestPortalToken`, `booking.checkInCode`). The real Firebase structure uses the booking reference as the key, stores occupant data as sub-objects keyed by `occ_*` IDs, and stores guest names at a separate `guestsDetails/{bookingRef}/{occupantId}` path. Both endpoints must be rewritten to match the real data model. The working `/api/guest-booking` endpoint already demonstrates the correct patterns.

### Goals

- `/api/find-booking` correctly looks up a booking by reference (Firebase key) and verifies the guest surname against `guestsDetails`
- `/api/guest-session` POST correctly verifies last name and returns guest first name from `guestsDetails`
- Token issuance works with the real data model (occupant IDs from booking keys, checkout dates from occupant records)
- Tests mock the real Firebase data shape and pass
- The full flow works end-to-end: `/find-my-stay` form → `/api/find-booking` → redirect to `/g/{token}` → `/api/guest-session` GET (validate) → POST (verify surname) → session stored → portal access

### Non-goals

- Changing the UI pages (`find-my-stay/page.tsx`, `g/page.tsx`) — they are correct
- Changing the working `/api/guest-booking` endpoint
- Adding new Firebase paths or migrating data
- Changing the `guestSessionsByToken` schema (it's fine as-is)

### Constraints & Assumptions

- Constraints:
  - Must run as Cloudflare Pages Functions (no Node.js SDK, only REST API via `FirebaseRest`)
  - Rate limiting via KV must be preserved
  - No authentication on the Firebase REST API (public read/write via rules)
- Assumptions:
  - Every booking has at least one occupant with a corresponding `guestsDetails` record containing `firstName` and `lastName`
  - The lead guest (`leadGuest: true`) is the primary occupant for surname matching

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/functions/api/find-booking.ts` — Cloudflare Pages Function, `onRequestGet`
- `apps/prime/functions/api/guest-session.ts` — Cloudflare Pages Function, `onRequestGet` + `onRequestPost`

### Key Modules / Files

- `apps/prime/functions/lib/firebase-rest.ts` — REST client with `get`, `set`, `update`, `delete` methods
- `apps/prime/functions/lib/guest-session.ts` — Shared `validateGuestSessionToken` helper (used by guest-booking, not by guest-session.ts itself)
- `apps/prime/functions/api/guest-booking.ts` — **Working reference** for correct data access patterns (lines 126-158)
- `apps/prime/src/types/bookings.ts` — Type definitions: `BookingOccupantData`, `BookingOccupants`, `Bookings`
- `apps/prime/src/types/guestsDetails.ts` — Type definitions: `GuestDetailsRecord`, `GuestsDetailsByOccupantId`
- `apps/prime/src/app/find-my-stay/page.tsx` — UI form (correct, no changes needed)
- `apps/prime/src/app/g/page.tsx` — Token verification UI (correct, no changes needed)

### Patterns & Conventions Observed

- **Direct path lookup**: `guest-booking.ts` does `firebase.get('bookings/' + bookingId)` — not a full-table scan. `find-booking.ts` currently downloads ALL bookings which is both wrong and wasteful.
- **Occupant key filtering**: `Object.keys(booking).filter(key => key.startsWith('occ_'))` (guest-booking.ts:134)
- **Guest details fetch**: `firebase.get('guestsDetails/' + bookingId + '/' + guestUuid)` (guest-booking.ts:149)
- **Name fallback chain**: `guestDetails?.firstName ?? occupant.firstName ?? ''` (guest-booking.ts:157)
- **Lead guest selection**: `guest-booking.ts` falls back to first occupant if stored guestUuid is invalid (lines 135-137)

### Data & Contracts

**Firebase paths:**

| Path | Shape | Example |
|------|-------|---------|
| `bookings/{ref}` | `Record<string, BookingOccupantData>` | `{ occ_123: { checkInDate, checkOutDate, leadGuest, roomNumbers } }` |
| `guestsDetails/{ref}/{occId}` | `GuestDetailsRecord` | `{ firstName: "Megan", lastName: "Rochford", email: "...", ... }` |
| `guestSessionsByToken/{token}` | `GuestSessionToken` | `{ bookingId, guestUuid, createdAt, expiresAt }` |
| `checkInCodesByCode/{code}` | `{ bookingId, expiresAt }` | Currently empty in production |

**Real booking example (`IM6JF8`):**
```json
{
  "occ_1767440561435": {
    "checkInDate": "2026-08-15",
    "checkOutDate": "2026-08-17",
    "leadGuest": true,
    "roomNumbers": ["6"]
  }
}
```

**Real guest details (`guestsDetails/IM6JF8/occ_1767440561435`):**
```json
{
  "firstName": "Megan",
  "lastName": "Rochford",
  "email": "meganrochford01@gmail.com",
  "gender": "F",
  "citizenship": "",
  "dateOfBirth": { "dd": "", "mm": "", "yyyy": "" },
  "document": { "number": "", "type": "Passport" },
  "language": "",
  "municipality": "NONE",
  "placeOfBirth": ""
}
```

**What the broken code expects vs reality:**

| Field | Broken code expects | Reality |
|-------|-------------------|---------|
| Booking ref | `booking.bookingRef` | Firebase key IS the ref |
| Guest name | `booking.guestName` | `guestsDetails/{ref}/{occId}.firstName/lastName` |
| Occupants | `booking.occupants` (string array) | Sub-objects keyed by `occ_*` |
| Portal token | `booking.guestPortalToken` | Does not exist on booking |
| Check-in code | `booking.checkInCode` | Does not exist on booking |
| Checkout date | `booking.checkOutDate` | Per-occupant: `booking[occId].checkOutDate` |

### Dependency & Impact Map

- Upstream: Find My Stay UI (`find-my-stay/page.tsx`) calls `/api/find-booking`; Guest Entry UI (`g/page.tsx`) calls `/api/guest-session`
- Downstream: Session stored in localStorage feeds all guarded routes via `guestSessionGuard.ts`
- Blast radius: Only the two broken endpoints and their tests. No other code references the broken fields.

### Test Landscape

#### Test Infrastructure
- **Framework:** Jest with `@jest-environment node`
- **Command:** `cd apps/prime && npx jest --config jest.config.cjs`
- **Helpers:** `functions/__tests__/helpers.ts` — `createMockEnv`, `createMockKv`, `createPagesContext`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| find-booking API | unit | `functions/__tests__/find-booking.test.ts` | 3 tests: TC-01 (happy path), TC-02 (surname mismatch), TC-03 (rate limit). All mock wrong data shape. |
| guest-session API | unit | `functions/__tests__/guest-session.test.ts` | 4 tests: TC-04 (GET valid), TC-05 (GET expired), TC-06 (POST verify success), TC-07 (POST verify fail). TC-06/07 mock wrong data shape. |

#### Test Patterns & Conventions
- `jest.spyOn(FirebaseRest.prototype, 'get')` with `mockImplementation` routing by path string
- `createPagesContext` builds mock Cloudflare Pages Function context with Request, env, headers
- `createMockKv` simulates KV namespace for rate limiting

#### Coverage Gaps
- No test for: booking ref not found (404 from direct lookup)
- No test for: booking exists but no guest details found
- No test for: multiple occupants — surname matches non-lead guest
- No test for: token issuance (new token generation path)

#### Extinct Tests
- **All 3 find-booking tests** mock a `{ BOOK123: { guestName: 'Jane Doe', bookingRef: 'BDC-123456' } }` shape that doesn't exist
- **TC-06 and TC-07** in guest-session mock `bookings/BOOK123` returning `{ guestName: 'Jane Doe' }` which doesn't exist
- These must be completely rewritten with correct data shapes

#### Testability Assessment
- **Easy to test:** All Firebase calls go through `FirebaseRest.prototype.get/set/update/delete` which are trivially spied on
- **Easy to test:** Rate limiting via mock KV
- **Easy to test:** Response status codes and JSON payloads

#### Recommended Test Approach
- Unit tests covering: happy path, booking not found, surname mismatch, rate limiting, token issuance (new + reuse), multiple occupants
- All mocks must use the real Firebase data shape

## Questions

### Resolved

- Q: Where are guest names stored?
  - A: `guestsDetails/{bookingRef}/{occupantId}` with `firstName` and `lastName` fields
  - Evidence: `apps/prime/src/types/guestsDetails.ts`, Firebase query on `guestsDetails/IM6JF8`

- Q: How does the working endpoint access booking data?
  - A: Direct path lookup `bookings/{bookingId}`, filter keys by `occ_*`, fetch guest details from separate path
  - Evidence: `apps/prime/functions/api/guest-booking.ts:126-158`

- Q: Does `booking.guestPortalToken` exist?
  - A: No. The `find-booking` endpoint writes it via `firebase.update('bookings/{id}', { guestPortalToken })` but this pollutes the booking node with a non-occupant key. Token lookup should use `guestSessionsByToken` path instead.
  - Evidence: Firebase query shows booking nodes only contain `occ_*` sub-objects

- Q: What about the check-in code generation?
  - A: The check-in code logic in find-booking is a side-effect that writes to `bookings/{id}` and `checkInCodesByCode/`. Both paths are currently empty in production. This feature can be preserved but must use a metadata path rather than polluting the booking node.
  - Evidence: Firebase queries on `checkInCodesByCode` returns `null`

- Q: Should we still store `guestPortalToken` on the booking node?
  - A: No. Storing non-occupant metadata on the booking node breaks the `Record<string, BookingOccupantData>` type contract. Instead, we can look up existing tokens by scanning `guestSessionsByToken` for matching `bookingId`, or just always issue a new token (old ones expire naturally).
  - Evidence: `apps/prime/src/types/bookings.ts` defines `BookingOccupants = IndexedById<BookingOccupantData>`

### Open (User Input Needed)

None — all questions resolved from evidence.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 92%
  - Working reference implementation exists in `guest-booking.ts`. The exact data access patterns are proven and can be directly reused. Firebase REST helper is battle-tested.
- **Approach:** 90%
  - Direct path lookup (not full-table scan) is clearly correct. Surname matching against `guestsDetails` is the only viable approach given the data model. Token issuance via `guestSessionsByToken` is already the pattern.
- **Impact:** 95%
  - Blast radius is tiny: 2 endpoint files + 2 test files. No other code references the broken fields. The UI pages are correct and unchanged.
- **Delivery-Readiness:** 90%
  - All patterns proven, test infrastructure exists, no external dependencies.
- **Testability:** 95%
  - Trivially testable via FirebaseRest spies. Test helpers already exist. Just need correct mock data shapes.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Some bookings lack `guestsDetails` records | Low | Medium | Fallback: if no guest details found, return 404 with helpful message. The working `guest-booking.ts` already handles this gracefully. |
| `guestPortalToken` written to booking node by old code runs | Low | Low | New code won't read it. Old tokens in `guestSessionsByToken` will expire naturally. No cleanup needed. |
| Check-in code side-effect writes non-occupant data to booking node | Medium | Low | Store check-in codes only in `checkInCodesByCode/{code}` path, not on the booking node. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `FirebaseRest` helper (not raw fetch)
  - Direct path lookups (not full-table scans)
  - Follow `guest-booking.ts` patterns for occupant/guest-details access
  - Preserve rate limiting via KV
- Rollout/rollback:
  - Deploy via Cloudflare Pages Functions (automatic on push)
  - Rollback: revert commit (endpoints are independent, no migration)
- Observability:
  - `console.error` for failures (existing pattern in all endpoints)

## Suggested Task Seeds (Non-binding)

1. **Rewrite `find-booking.ts`** — Replace broken lookup with direct path access, fix token issuance, fix occupant resolution. Update `Booking` interface. Remove check-in code side-effect or fix its storage path.
2. **Fix `guest-session.ts` POST** — Replace `booking.guestName` lookup with `guestsDetails` fetch. Fix `getFirstName`/`normalizeLastName` to work with separate firstName/lastName fields.
3. **Rewrite test mocks** — Update `find-booking.test.ts` and `guest-session.test.ts` with correct Firebase data shapes. Add missing test cases (booking not found, no guest details, token issuance).

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: none
- Deliverable acceptance:
  - Both endpoints return correct responses for real Firebase data
  - All tests pass with mocks matching the real data model
  - Typecheck passes
  - Manual verification: `/find-my-stay` with a real booking ref (e.g., `IM6JF8` + surname `Rochford`) redirects correctly
- Post-delivery measurement:
  - Successful guest portal sessions created via `/find-my-stay` flow

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: none
- Recommended next step: proceed to `/lp-plan prime-find-booking-api-fix`
