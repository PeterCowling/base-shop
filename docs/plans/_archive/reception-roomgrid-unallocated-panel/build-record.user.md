---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-14
Feature-Slug: reception-roomgrid-unallocated-panel
Execution-Track: code
Completed-date: 2026-03-14
artifact: build-record
Build-Event-Ref: docs/plans/reception-roomgrid-unallocated-panel/build-event.json
---

# Build Record: Rooms-Grid Unallocated Panel

## Outcome Contract

- **Why:** Guests with confirmed bookings arrive at the hostel with no bed assigned because staff cannot see unallocated occupants anywhere on the rooms grid. The data exists but is hidden from the staff view.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can identify all unallocated occupants directly from the rooms-grid page before guests arrive, eliminating the failure mode where guests arrive with no room assignment.
- **Source:** operator

## What Was Built

**TASK-01 — Type fixes** (`1f0fa08abe`): Fixed `IGuestByRoomData` interface in `useGuestByRoomData.ts` to mark `allocated` and `booked` as optional (`allocated?: string; booked?: string`), reflecting the actual raw Firebase shape. Exported the new `UnallocatedOccupant` interface from `useGridData.ts` with fields: `bookingRef`, `occupantId`, `firstName`, `lastName`, `checkInDate`, `checkOutDate`, `bookedRoom?`, `status`.

**TASK-02 — Hook computation** (`fd9826a6a5`): Added a second `useMemo` in `useGridData.ts` after the `allRoomData` memo. It iterates over all `bookingsData` entries, filters occupants whose `guestByRoomData[occId].allocated` is absent/empty/not in `knownRooms`, applies the date-window filter, and collects them into `UnallocatedOccupant[]` sorted ascending by `checkInDate`. Also fixed a pre-existing omission: status `"23"` (bag-drop) was missing from `getActivityStatus`'s precedence list; added to `["1","8","12","14","16","23"]`. Added `unallocatedOccupants` to the hook's return type.

**TASK-03 — UnallocatedPanel component** (`5005a893b2`): Created `UnallocatedPanel.tsx` — a read-only panel showing each unallocated occupant's status badge, name, booking ref, check-in/check-out dates, and booked room (or "—"). Uses DS `Stack`/`Cluster`/`Inline` primitives. Includes a count badge in the header. Styled with semantic tokens only (`text-danger-fg` on `bg-error-main`). Tagged with `data-cy` attributes for test targeting.

**TASK-04 — RoomsGrid wiring** (`e5ddbd5634`): Destructured `unallocatedOccupants` from `useGridData` in `RoomsGrid.tsx`. Wrapped the existing `error == null` conditional expression in a React fragment to accommodate the new sibling element. Added `{unallocatedOccupants.length > 0 && <UnallocatedPanel occupants={unallocatedOccupants} />}` above the room map, hidden entirely when empty.

**TASK-05 — Tests** (`a8b74fe2b7`): Added TC-01 through TC-11 plus an ordering test to `useGridData.test.ts`; created `UnallocatedPanel.test.tsx` (TC-05, TC-06, multiple occupants, count badge, Unknown fallback); updated `RoomsGrid.test.tsx` with TC-07, TC-08, `UnallocatedPanel` mock, and `beforeEach` mock reset. Fixed `text-white` → `text-danger-fg` lint violation in `UnallocatedPanel.tsx` (caught during lint gate).

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Run locally before each commit; hooks confirm via turbo typecheck |
| `pnpm --filter @apps/reception exec eslint --max-warnings=0 <files>` | Pass | All modified source and test files linted clean |
| Pre-commit hooks (lint-staged, typecheck-staged) | Pass | All 4 TASK-05 files passed hooks in writer-lock commit |
| CI (push to dev) | Pending | Tests run in CI only per testing policy |

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 109069 | 45111 | 0.0% |
| lp-do-build | 1 | 2.00 | 110158 | 8340 | 0.0% |

**Totals:** context input bytes 219227; artifact bytes 53451; modules 3; deterministic checks 3. Token measurement not available (session recovered from context compaction).

## Validation Evidence

### TASK-01
- IGuestByRoomData.allocated now typed as `?: string` (confirmed via typecheck pass)
- IGuestByRoomData.booked now typed as `?: string`
- `UnallocatedOccupant` interface exported from `useGridData.ts`; consumed by `UnallocatedPanel.tsx` and `RoomsGrid.tsx` without TypeScript error

### TASK-02
- `unallocatedOccupants` useMemo added; filters occupants by allocation status and date window; sorts by `checkInDate` ascending using `sortByDateAsc`
- `getActivityStatus` precedence list updated to include `"23"` (bag-drop status)
- `useGridData` return type updated; hook passes typecheck
- TC-09 (bookedRoom from guestByRoomData.booked) and TC-10 (roomNumbers[0] fallback) covered by TASK-05 tests

### TASK-03
- `UnallocatedPanel.tsx` renders name, booking ref, dates, booked room, status badge
- `bookedRoom ?? "—"` renders dash when undefined (TC-06 passes)
- DS primitives only (no arbitrary Tailwind); semantic tokens only (no raw colors after `text-danger-fg` fix)
- `data-cy="unallocated-panel"` and `data-cy="unallocated-row"` present for test targeting

### TASK-04
- `unallocatedOccupants` destructured from `useGridData` in `RoomsGrid.tsx`
- React fragment wraps existing map + new panel sibling
- Panel renders when `unallocatedOccupants.length > 0`, hidden otherwise
- TypeScript, lint, pre-commit hooks all pass

### TASK-05
- `useGridData.test.ts`: TC-01 (absent allocated → included), TC-02 (empty string → included), TC-03 (allocated not in knownRooms → included), TC-04 (outside date window → excluded), TC-09 (bookedRoom from guestByRoomData.booked), TC-10 (roomNumbers[0] fallback), TC-11 (status "23" passing after precedence fix), ordering test
- `UnallocatedPanel.test.tsx`: TC-05 (name/ref/dates/room rendered), TC-06 (dash for undefined bookedRoom), multiple occupants all present, count badge shows occupants.length, "Unknown" for empty name
- `RoomsGrid.test.tsx`: TC-07 (panel rendered when non-empty), TC-08 (panel absent when empty), mockUnallocatedOccupants reset in beforeEach
- All files: typecheck pass, lint pass, pre-commit hooks pass

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | TC-05 (UnallocatedPanel renders correct fields), TC-07/TC-08 (panel conditional in RoomsGrid); DS primitives enforce token-only styling | `text-danger-fg` on `bg-error-main` confirmed correct pattern from existing codebase |
| UX / states | Panel absent when no unallocated occupants (TC-08); panel present with count badge and sorted rows when occupants exist (TC-07); "—" for absent bookedRoom (TC-06); "Unknown" for empty name | Loading/error states unchanged — guard is in existing RoomsGrid conditional |
| Security / privacy | N/A — internal tool, read-only, no new auth surface, data already subscribed via existing Firebase hooks | |
| Logging / observability / audit | Panel itself provides staff-facing visibility; no console.warn added for unallocated count (normal operational state) | |
| Testing / validation | 11 TC contracts + ordering test + 6 UnallocatedPanel cases + 2 RoomsGrid integration cases; all files lint and typecheck clean | CI validates on push |
| Data / contracts | `IGuestByRoomData.allocated?: string` and `booked?: string` match raw Firebase shape; `UnallocatedOccupant` type exported and consumed correctly; `bookedRoom` fallback chain documented and tested | |
| Performance / reliability | O(N) second pass over bookingsData; no extra Firebase reads; memo recomputes at same frequency as allRoomData; sortByDateAsc is O(N log N); acceptable at hostel volumes | |
| Rollout / rollback | Purely additive — existing room panels unaffected; panel hidden when empty (zero-state is invisible, not broken); rollback = revert 4 commits | |

## Scope Deviations

**Controlled expansion — `text-danger-fg` fix in UnallocatedPanel.tsx (TASK-05 cycle):** The `text-white` → `text-danger-fg` lint fix was caught during the TASK-05 lint gate on `UnallocatedPanel.tsx`. The fix is same-outcome (TASK-03's objective was a lint-clean component) and bounded to a single token replacement. Included in the TASK-05 commit.

**Controlled expansion — status "23" precedence fix (TASK-02 same file):** `getActivityStatus` was missing `"23"` (bag-drop) from its precedence list. Fixed in TASK-02 as same-outcome work (same file, same task objective of correct `status` computation). TC-11 validates the fix.
