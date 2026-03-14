---
Type: Build-Record
Feature-Slug: reception-rooms-grid-dnd-crash
Business: BRIK
Dispatch-ID: IDEA-DISPATCH-20260313140000-0001
Build-Date: 2026-03-13
Execution-Track: code
---

# Rooms Grid DnD Crash Fix — Build Record

## Outcome Contract
- **Why:** Every click on a room cell crashed the page because `react-dnd-html5-backend` registers a single global backend and 10 instances of `DndProvider` were mounted simultaneously (one per room). Hoisting to the parent ensures exactly one backend is registered.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Clicking any cell in the rooms grid opens the booking modal without crashing. The drag-and-drop provider is mounted once at the page level.
- **Source:** operator

## What Was Done

Moved `<DndProvider backend={HTML5Backend}>` from `ReservationGrid.tsx` (instantiated once per room = 10 instances on the page) up to `RoomsGrid.tsx` (the parent, rendered once per page).

- `apps/reception/src/components/roomgrid/ReservationGrid.tsx`: removed `DndProvider`/`HTML5Backend` import and wrapper; `ReservationGridInner` now renders `<Grid>` directly.
- `apps/reception/src/components/roomgrid/RoomsGrid.tsx`: added `DndProvider`/`HTML5Backend` imports; wrapped the `<Stack>` + room list with `<DndProvider backend={HTML5Backend}>`.

## Engineering Coverage Evidence

| Area | Status |
|---|---|
| TypeScript (`pnpm --filter @apps/reception typecheck`) | ✅ pass |
| Lint (`eslint` on changed files) | ✅ pass |
| Scope | 2 files changed, no new files |
| DnD functionality | Unchanged — `useDrag`/`useDrop` in RowCell still function; provider is just hoisted |

## Workflow Telemetry Summary

- Stage: lp-do-build
- Module: modules/build-code.md
- Context input bytes: 34876
- Deterministic checks: 1 (validate-engineering-coverage.sh — skipped/valid for micro-build type)
