---
Type: Build-Record
Feature-Slug: prime-guest-booking-occupant-fallback
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-003
Business: BRIK
Completed: 2026-03-13
Execution-Track: code
artifact: build-record
---

# Prime Guest Booking Occupant Fallback — Build Record

## What Was Done

Fixed a silent data-exposure risk in `apps/prime/functions/api/guest-booking.ts`.

Previously, when a session's `guestUuid` was present but not found in the booking, the code silently fell back to the first occupant in the booking (`occupantKeys[0]`). This could serve a different guest's data — name, room, stay details — to the wrong person with no warning.

**Change:** The fallback is now split by intent:
- If `session.guestUuid` is set and the UUID is not in the booking → return HTTP 404 + `console.warn` with booking ID for diagnostics. No data returned.
- If `session.guestUuid` is absent (legacy/anonymous session) → fall back to `occupantKeys[0]` as before (backward compatible).

Typecheck passed clean.

## Outcome Contract

- **Why:** When the system cannot match a guest's ID to their booking, it was silently loading the first guest on the booking instead. A guest could see another person's name, room assignment, or stay details without either guest or staff knowing it happened.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** When guestUuid does not match any occupant, the function returns a 404 error and logs a warning instead of silently returning the wrong occupant's data.
- **Source:** operator

## Engineering Coverage Evidence

Changed one code block (~15 lines) in a single file. Typecheck (`pnpm --filter @apps/prime typecheck`) passed. validate-engineering-coverage.sh: valid: true, skipped: true (micro-build).

## Workflow Telemetry Summary

- Stage: lp-do-build (direct-dispatch micro-build lane)
- Dispatch: IDEA-DISPATCH-20260313200000-PRIME-003
- Deterministic check: validate-engineering-coverage.sh passed
