---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-roomgrid-legend
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-005
Related-Plan: none
---

# Rooms-Grid Colour Legend Micro-Build

## Scope
- Change: Add a `StatusLegend` component to `apps/reception/src/components/roomgrid/` that renders a compact row of colour swatches with plain-English labels. Insert it into `RoomsGrid.tsx` below the date-range controls. Source of truth for colours is `statusColors.ts`.
- Non-goals: No changes to status logic, colour tokens, or existing grid rendering. No drag-and-drop. No interactive legend filtering.

## Execution Contract
- Affects:
  - `apps/reception/src/components/roomgrid/StatusLegend.tsx` (new)
  - `apps/reception/src/components/roomgrid/RoomsGrid.tsx` (add import + usage)
- Acceptance checks:
  - Legend renders below the date pickers with 6 labelled swatches
  - Each swatch colour matches the corresponding cell colour on the grid
  - No TypeScript errors (`pnpm --filter @apps/reception typecheck`)
  - No lint errors (`pnpm --filter @apps/reception lint`)
  - Snapshot test updated if one covers `RoomsGrid`
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: Delete `StatusLegend.tsx` and revert `RoomsGrid.tsx` import line.

## Outcome Contract
- **Why:** The room grid uses 8+ colours to show different booking states but has no key explaining what each colour means. Staff unfamiliar with the scheme have to guess or ask a colleague.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A colour legend is added to the room grid page mapping each status colour to its plain-English label, sourced directly from the existing statusColors constant.
- **Source:** auto
