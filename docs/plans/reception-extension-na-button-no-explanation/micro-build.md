---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-extension-na-button-no-explanation
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314171800-BRIK-EXT-013
Related-Plan: none
---

# Reception Extension N/A Button No Explanation Micro-Build

## Scope
- Change: Add a `title` tooltip attribute to the disabled "N/A" button in the Extension page (and the "Booking" variant). When a room is unavailable, hovering the button shows "Room unavailable for these dates" so staff understand why it is disabled.
- Non-goals: Inline text explanation; popover/modal UX; changes to availability logic.

## Execution Contract
- Affects: `apps/reception/src/components/man/Extension.tsx` (lines ~389–425, the Pay column buttons)
- Acceptance checks:
  - When `availabilityMap[r.occupantId]` is false, both "Guest" and "Booking" buttons render as N/A with `title="Room unavailable for these dates"`
  - When `availabilityMap[r.occupantId]` is true, `title` attribute is absent or empty
  - `@apps/reception:typecheck` — 0 errors
  - `@apps/reception:lint` — 0 errors (pre-existing warnings acceptable)
- Validation commands: `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint`
- Rollback note: remove the `title` prop additions.

## Outcome Contract
- **Why:** When a room is unavailable for extension, staff see a disabled N/A button with no explanation. They don't know if the room is full, if the dates are wrong, or if there's a system fault — so they may waste time trying to troubleshoot or ask a manager unnecessarily.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff hovering or focusing an N/A button see a plain-language tooltip explaining the room is unavailable for the selected dates.
- **Source:** operator
