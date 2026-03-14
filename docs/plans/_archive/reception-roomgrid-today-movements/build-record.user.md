---
Type: Build-Record
Status: Complete
Feature-Slug: reception-roomgrid-today-movements
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-003
Execution-Track: code
Deliverable-Type: code-change
Business: BRIK
Completed: 2026-03-14
---

# Today's Movements Summary — Build Record

## What was done

Added a compact "Today's Movements" panel to the rooms-grid page. When the grid window includes today, staff now see which guests are arriving and departing at a glance — no more scanning each room's timeline manually.

## Files changed

- **New:** `apps/reception/src/components/roomgrid/TodayMovements.tsx` — pure display component accepting `arrivals` and `departures` arrays as props; renders two sections with room numbers and guest names; falls back to "Unknown" for absent names.
- **Modified:** `apps/reception/src/components/roomgrid/RoomsGrid.tsx` — added `useMemo` computation of arrivals/departures by iterating known rooms and filtering periods; renders `TodayMovements` below `OccupancyStrip` when `!loading && error == null && todayInWindow`.
- **New:** `apps/reception/src/components/roomgrid/__tests__/TodayMovements.test.tsx` — unit tests TC-01 through TC-04 covering arrivals, departures, empty state, unknown name fallback.
- **Modified:** `apps/reception/src/components/roomgrid/__tests__/RoomsGrid.test.tsx` — added TC-05 and TC-05b wiring assertions confirming `TodayMovements` renders and receives correct props.

## Validation

- `pnpm --filter @apps/reception typecheck` — pass (0 errors)
- `pnpm --filter @apps/reception lint` — pass (0 errors, 4 pre-existing warnings in unrelated files)
- Pre-commit hooks: lint-staged + typecheck-staged — all passed
- Commit: `071f1769e1` on branch `dev`

## Engineering Coverage Evidence

| Coverage Area | Evidence | Status |
|---|---|---|
| UI / visual | DS primitives (Cluster, Inline, Stack) used throughout TodayMovements.tsx; no raw flex divs | Covered |
| UX / states | Empty state ("No movements today", "No arrivals today", "No departures today") + populated state implemented and tested | Covered |
| Security / privacy | N/A — reads in-memory data only | N/A |
| Logging / observability / audit | N/A — pure read-only display | N/A |
| Testing / validation | TodayMovements.test.tsx: TC-01 to TC-04 + TC-03b + TC-03c + TC-04b + TC-04c. RoomsGrid.test.tsx: TC-05 and TC-05b | Covered |
| Data / contracts | `TodayMovementEntry` type exported from TodayMovements.tsx with `{ room, occupantId, firstName, lastName }` | Covered |
| Performance / reliability | Computation in useMemo; O(rooms × rows × periods) bounded; occupantId deduplication via Set | Covered |
| Rollout / rollback | Direct commit to dev branch; rollback = revert commit `071f1769e1` | Covered |
