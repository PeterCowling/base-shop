---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-keycard-icon-dedup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309100000-0006
Related-Plan: none
---

# Reception Keycard Icon Dedup Micro-Build

## Scope
- Change:
  - Extract `getKeycardIcon` into a shared utility and use it from both checkout and check-in consumers.
  - Preserve the broader checkout mapping as the canonical implementation.
- Non-goals:
  - Redesigning deposit-type visuals.
  - Changing checkout/check-in table behavior beyond shared icon lookup.

## Execution Contract
- Affects:
  - `apps/reception/src/components/checkout/CheckoutTable.tsx`
  - `apps/reception/src/components/checkins/view/BookingRow.tsx`
  - One new shared utility module under `apps/reception/src/`
- Acceptance checks:
  - `getKeycardIcon` exists once.
  - CheckoutTable and BookingRow import the shared implementation.
  - Existing icon/color mappings remain unchanged.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note:
  - Revert the shared utility extraction and restore the local helpers.

## Outcome Contract
- **Why:** Duplicated icon mapping means new deposit types or icon tweaks must be applied in multiple places and can drift.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `getKeycardIcon` exists once in a shared utility and is imported by both CheckoutTable and BookingRow.
- **Source:** operator
