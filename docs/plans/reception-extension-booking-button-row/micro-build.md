---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-extension-booking-button-row
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313150000-0001
Related-Plan: none
---

# Extension — Booking Button Row Assignment Micro-Build

## Scope
- Change: Replace `r.occupantId === r.occupantIds[0]` with `filteredRows.find(row => row.bookingRef === r.bookingRef) === r` as the condition for showing the Booking (extend-all) button. This shows it on the first visible row per booking in the current display order, instead of on the row whose occupantId is lexicographically first.
- Non-goals: No change to which occupants are extended when the button is clicked (still all occupantIds). No UI redesign.

## Execution Contract
- Affects:
  - `apps/reception/src/components/man/Extension.tsx` (primary)
  - `apps/reception/src/components/man/__tests__/Extension.test.tsx` (test)
- Acceptance checks:
  1. Booking button appears on the first row in filteredRows for a multi-occupant booking
  2. Booking button does NOT appear on subsequent rows for the same booking
  3. Existing tests continue to pass
- Validation commands:
  - `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=Extension.test --no-coverage`
- Rollback note: Boolean condition change — trivially reversible.

## Outcome Contract
- **Why:** The Booking button relies on lexicographic ordering of occupant IDs to pick which row shows it. This can place the button on the wrong guest row in the sorted view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Extend Booking button reliably appears on the first visible row for each multi-occupant booking in the current display order.
- **Source:** operator
