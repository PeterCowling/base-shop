---
Type: Build-Record
Status: Complete
Feature-Slug: reception-extension-booking-button-row
Build-date: 2026-03-13
artifact: build-record
---

# Build Record — Extension Booking Button Row

## Summary

Fixed the condition controlling which row displays the "Booking" (extend-all) button on the `/extension` route. The previous condition anchored the button to whichever occupant had the lexicographically first occupant ID — this could place it on the wrong guest row after sorting or filtering. The fix uses `filteredRows.find()` reference equality so the button always appears on the first visible row for each multi-occupant booking in the current display order.

## Outcome Contract

- **Why:** The Booking button relied on `occupantId === occupantIds[0]` (lexicographic ordering) to select its host row. After sort/filter, this placed the button on a row that may not be first in the displayed list, confusing reception staff.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Extend Booking button reliably appears on the first visible row for each multi-occupant booking in the current display order.
- **Source:** operator

## Changes Delivered

- `apps/reception/src/components/man/Extension.tsx` — replaced `r.occupantId === r.occupantIds[0]` with `filteredRows.find((row) => row.bookingRef === r.bookingRef) === r` as the condition for showing the Booking button.
- `apps/reception/src/components/man/__tests__/Extension.test.tsx` — added regression test: "shows Booking (extend-all) button only on first visible row for multi-occupant booking". Verifies exactly 2 Guest buttons and exactly 1 Booking button for a 2-occupant booking.

## Engineering Coverage Evidence

Validation command: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=Extension.test --no-coverage`

Result: 7/7 tests pass.

- Test added: `"shows Booking (extend-all) button only on first visible row for multi-occupant booking"` — confirms the Booking button appears exactly once when two occupants share a booking, and on the first visible row.
- All 6 existing Extension tests continue to pass.

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-build | 1 | 2.00 | 45081 | 0 | 0.0% |

Context input bytes: 45081 | Modules: 2 | Deterministic checks: 1
