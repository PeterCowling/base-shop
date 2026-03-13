---
Type: Micro-Build
Status: Active
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-extension-nights-nan-guard
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313150000-0003
Related-Plan: none
---

# Extension — Nights Input NaN Guard Micro-Build

## Scope
- Change: Add `|| Number.isNaN(nightsMap[r.occupantId])` to the `disabled` prop of both action buttons (Guest / Booking) in Extension.tsx so that clearing the nights input disables the buttons for that row until a valid number is re-entered.
- Non-goals: No change to getNights fallback logic, no UI redesign, no modal changes.

## Execution Contract
- Affects:
  - `apps/reception/src/components/man/Extension.tsx` (primary)
  - `apps/reception/src/components/man/__tests__/Extension.test.tsx` (test)
- Acceptance checks:
  1. Guest button is disabled when nights input is cleared (NaN state)
  2. Guest button is re-enabled when a valid number is typed
  3. Existing modal open test continues to pass
- Validation commands:
  - `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=Extension.test --no-coverage`
- Rollback note: Boolean OR addition to disabled prop — trivially reversible.

## Outcome Contract
- **Why:** If a staff member clears the nights field, the system silently books 1 night when the button is clicked, with no warning. Staff have no indication the nights value has been reset.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The nights input shows a validation error or disables the Confirm button when the field is empty, so staff cannot accidentally submit an unintended 1-night extension.
- **Source:** operator
