---
Type: Build-Record
Feature-Slug: reception-roomgrid-occupancy-strip
Status: Complete
Completed: 2026-03-14
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-002
---

# Reception Rooms-Grid Occupancy Strip — Build Record

## What was built

A compact strip was added to the rooms-grid page showing how many rooms are occupied tonight. It appears below the status legend and above the room grids.

The strip reads "Occupied tonight: X / 10 rooms" and updates automatically as the booking data loads. It disappears when the date range being viewed does not include today, preventing a misleading count.

## Files changed

- `apps/reception/src/components/roomgrid/OccupancyStrip.tsx` — new component and `computeOccupancyCount` utility function
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — wired strip in, added `useMemo` for count derivation
- `apps/reception/src/components/roomgrid/__tests__/OccupancyStrip.test.tsx` — new test file

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | OccupancyStrip uses `Inline` DS primitive. No raw flex or inline styles. Token-based text classes (`text-foreground`, `text-muted-foreground`). |
| UX / states | Strip only renders when `!loading && error == null && todayInWindow`. Handles 0 occupied, partial, and full-house counts. Hidden when date window doesn't include today. |
| Security / privacy | N/A — internal staff tool, no new data pathway |
| Logging / observability / audit | N/A — read-only derived UI, no mutations |
| Testing / validation | `OccupancyStrip.test.tsx` covers TC-01 through TC-08: count display, zero, full-house, status-16 excluded, status-14 included, exclusive end boundary. |
| Data / contracts | `computeOccupancyCount` is a pure exported function using `GridReservationRow[]` and `TBookingPeriod`. No schema/type changes. |
| Performance / reliability | Count derived via `useMemo` in RoomsGrid. O(rooms × bookings_per_room) — bounded and cheap. |
| Rollout / rollback | Additive change. Rollback = `git revert d3883fbf4c`. No migration or feature flag required. |

## Validation

- `pnpm --filter @apps/reception typecheck`: passed
- `pnpm --filter @apps/reception lint`: passed (0 errors, 4 pre-existing warnings)
- Pre-commit hooks: passed (lint-staged, typecheck-staged)
- Commit: `d3883fbf4c` (dev branch)
