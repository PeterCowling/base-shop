---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-guest-booking-occupant-fallback
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-003
Related-Plan: none
---

# Prime Guest Booking Occupant Fallback Micro-Build

## Scope
- Change: In `apps/prime/functions/api/guest-booking.ts`, when `authResult.session.guestUuid` is present but not found in the booking, return a 404 error instead of silently falling back to `occupantKeys[0]`. Log a warning for diagnostic visibility. Only fall back to `occupantKeys[0]` when no `guestUuid` is in the session (legacy/anonymous sessions).
- Non-goals: changing session validation logic; altering booking data structure; any other endpoint.

## Execution Contract
- Affects: `apps/prime/functions/api/guest-booking.ts`
- Acceptance checks:
  - When `session.guestUuid` is set and not present in booking → returns 404, logs console.warn
  - When `session.guestUuid` is absent/null → still falls back to `occupantKeys[0]` (backward compatible)
  - When `session.guestUuid` matches booking key → behaves as before
- Validation commands: `pnpm --filter @apps/prime typecheck`
- Rollback note: revert the guestUuid resolution block at lines 146-148

## Outcome Contract
- **Why:** When the system cannot match a guest's ID to their booking, it was silently loading the first guest on the booking instead. A guest could see another person's name, room assignment, or stay details without either guest or staff knowing it happened.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When guestUuid does not match any occupant, the function returns a 404 error and logs a warning instead of silently returning the wrong occupant's data.
- **Source:** operator
