---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-rooms-grid-dnd-crash
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313140000-0001
Related-Plan: none
---

# Rooms Grid DnD Crash Fix Micro-Build

## Scope
- Change: Hoist `<DndProvider backend={HTML5Backend}>` from `ReservationGrid.tsx` (rendered once per room) up to `RoomsGrid.tsx` (rendered once per page). Remove the provider from `ReservationGrid.tsx` and render `<Grid>` directly.
- Non-goals: Any drag-and-drop behaviour changes; UI layout changes; RoomGrid single-click fix (separate dispatch).

## Execution Contract
- Affects:
  - `apps/reception/src/components/roomgrid/ReservationGrid.tsx` (primary)
  - `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (primary)
  - `apps/reception/src/components/roomgrid/__tests__/ReservationGrid.capabilities.test.tsx` (readonly — mock already handles DndProvider; verify no change needed)
- Acceptance checks:
  1. `ReservationGrid.tsx` no longer imports or renders `DndProvider`/`HTML5Backend`.
  2. `RoomsGrid.tsx` wraps all `RoomGrid` instances with a single `<DndProvider backend={HTML5Backend}>`.
  3. TypeScript passes with no new errors in the `apps/reception` package.
- Validation commands:
  - `pnpm --filter reception typecheck`
- Rollback note: Revert both files. One-line change in each.

## Outcome Contract
- **Why:** Every click on a room cell crashes the page because `react-dnd-html5-backend` registers a global singleton and 10 instances of `DndProvider` are mounted simultaneously (one per room). Hoisting to the parent ensures exactly one backend is registered.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Clicking any cell in the rooms grid opens the booking modal without crashing. The drag-and-drop provider is mounted once at the page level.
- **Source:** operator
