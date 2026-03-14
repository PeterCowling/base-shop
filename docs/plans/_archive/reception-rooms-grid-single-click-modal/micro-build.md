---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-rooms-grid-single-click-modal
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313140000-0002
Related-Plan: none
---

# Rooms Grid Single-Click Modal Micro-Build

## Scope
- Change: Remove the 400ms double-click guard (`lastClick` state + early return check) from `RoomGrid.onClickCell`. A single click should open the booking modal directly.
- Non-goals: Any changes to the modal content, DnD setup, or other RoomGrid behaviour. Do not add new state.

## Execution Contract
- Affects:
  - `apps/reception/src/components/roomgrid/RoomGrid.tsx` (primary)
  - `apps/reception/src/components/roomgrid/__tests__/RoomGrid.test.tsx` (test update required — existing tests use `dblClick`, must change to `click`)
- Acceptance checks:
  1. `lastClick` state and the `now - lastClick > 400` check are removed from `onClickCell`.
  2. A single `userEvent.click` on a grid cell opens the booking modal in tests (update existing `dblClick` tests to `click`).
  3. TypeScript and lint pass.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert `RoomGrid.tsx` and `RoomGrid.test.tsx`.

## Outcome Contract
- **Why:** Staff have to click a room cell twice to open the booking detail because the first click is silently discarded by an old guard that was there to prevent accidental clicks during drag-and-drop. Since drag-and-drop is not enabled on this screen, the guard is unnecessary.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A single click on any room cell opens the booking detail modal immediately. The 400ms double-click guard is removed.
- **Source:** operator
