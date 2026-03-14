---
Type: Micro-Build
Status: Archived
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-rooms-grid-empty-state
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313140000-0003
Related-Plan: none
---

# Rooms Grid Empty State Micro-Build

## Scope
- Change: In `Grid.tsx`, when `data.length === 0`, render a `TableRow` with a full-width `TableCell` containing "No bookings" instead of an empty `TableBody`.
- Non-goals: Styling changes beyond the empty-state cell; changes to Row or Header components.

## Execution Contract
- Affects:
  - `apps/reception/src/components/roomgrid/components/Grid/Grid.tsx` (primary)
  - `apps/reception/src/components/roomgrid/__tests__/GridComponents.test.tsx` (new test for empty state)
- Acceptance checks:
  1. When `data=[]`, the grid renders "No bookings" text in a table row.
  2. Header still renders when data is empty.
  3. TypeScript and lint pass.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
- Rollback note: Revert `Grid.tsx` and `GridComponents.test.tsx`.

## Outcome Contract
- **Why:** When a room has no bookings in the system, its row in the grid was completely blank — no text, no placeholder. Staff could not tell whether the room was genuinely empty or whether something had failed to load.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Rooms with no bookings show a clear "No bookings" message in their grid row instead of a blank space.
- **Source:** operator
