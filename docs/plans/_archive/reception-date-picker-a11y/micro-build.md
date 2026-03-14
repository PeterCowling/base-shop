---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: reception-date-picker-a11y
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314161500-0011
Related-Plan: none
---

# Date Picker Accessibility Labels Micro-Build

## Scope
- Change: Add aria-label and aria-expanded to calendar toggle buttons; add aria-label to DayPicker instances in DateSelector
- Non-goals: Full WCAG audit, keyboard trap handling

## Execution Contract
- Affects: `apps/reception/src/components/common/DateSelector.tsx`
- Acceptance checks:
  - Calendar toggle has aria-label="Open calendar" and aria-expanded
  - DayPicker has aria-label="Date picker"
  - TypeScript passes
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`

## Outcome Contract
- **Why:** Screen readers cannot identify the calendar toggle button or the calendar grid without accessible labels.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Calendar toggle and grid are labelled for screen readers.
- **Source:** operator
