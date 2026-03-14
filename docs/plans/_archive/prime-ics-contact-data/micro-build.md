---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: prime-ics-contact-data
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313200000-PRIME-001
Related-Plan: none
---

# Prime ICS Contact Data Micro-Build

## Scope
- Change: Fix hardcoded HOSTEL_INFO in `apps/prime/src/lib/calendar/generateIcs.ts` — wrong phone number and wrong street address.
- Non-goals: refactoring HOSTEL_INFO to import from a shared config; changing check-in time window; any other ICS field.

## Execution Contract
- Affects: `apps/prime/src/lib/calendar/generateIcs.ts`
- Acceptance checks:
  - `phone` field reads `+39 328 707 3695` (matches WHATSAPP_URL in apps/brikette/src/config/hotel.ts: `https://wa.me/393287073695`)
  - `address` field reads `Via Guglielmo Marconi 358, 84017 Positano SA, Italy` (matches `streetAddress` + `postalCode` + `addressLocality` in hotel.ts)
  - TODO comment removed
  - No other fields changed
- Validation commands: `pnpm --filter prime typecheck`
- Rollback note: revert single line changes to phone and address constants

## Outcome Contract
- **Why:** When a guest adds their check-in to their phone calendar, the invite shows the wrong phone number and the wrong street address for the hostel. A guest relying on the calendar invite to navigate or call could end up at the wrong place or call a non-existent number.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** generateIcs.ts uses the real hostel phone (+39 328 707 3695) and real address (Via Guglielmo Marconi 358) consistent with the brikette hotel config.
- **Source:** operator
