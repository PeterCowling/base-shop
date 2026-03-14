---
Type: Micro-Build
Status: Active
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-dropdown-disabled-context
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0007
Related-Plan: none
---

# Disabled Dropdown Context Micro-Build

## Scope
- Change: Add optional `disabledReason` to `DropdownOption`; pass it as `title` on disabled items; supply "Open a shift first" reason in `ActionButtons` for Cash/Keycards options disabled by `!shiftOpenTime`
- Non-goals: Tooltip library, hover popover, or visual redesign

## Execution Contract
- Affects:
  - `apps/reception/src/components/till/ActionDropdown.tsx`
  - `apps/reception/src/components/till/ActionButtons.tsx`
- Acceptance checks:
  - Hovering a disabled Cash/Keycards item shows "Open a shift first" in a native tooltip
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`

## Outcome Contract
- **Why:** Reception staff opening the Cash or Keycards menu during a closed shift see all options greyed out with no explanation, causing confusion.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Disabled dropdown items show a native tooltip explaining the requirement (e.g. "Open a shift first").
- **Source:** operator
