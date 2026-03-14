---
Type: Micro-Build
Status: Archived
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: brik-prepayments-ux-hardening
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260314190000-BRIK-PREP-001,IDEA-DISPATCH-20260314190000-BRIK-PREP-002,IDEA-DISPATCH-20260314190000-BRIK-PREP-003,IDEA-DISPATCH-20260314190000-BRIK-PREP-004,IDEA-DISPATCH-20260314190000-BRIK-PREP-005,IDEA-DISPATCH-20260314190000-BRIK-PREP-006
Related-Plan: none
---

# Prepayments UX Hardening Micro-Build

Batch of 6 targeted UX improvements to the prepayments screen identified during a live audit.

## Scope

- PREP-001: MarkAsPaidButton — two-step confirmation before firing payment transaction
- PREP-003: MarkAsFailedButton — loading/disabled state + two-step confirmation before firing
- PREP-004: MarkAsFailedButton — terminal state guard (return null when code 7 already exists)
- PREP-006: PrepaymentsContainer — replace hardcoded `user_name: "System"` with logged-in user's name
- PREP-002: BookingPaymentsLists — change row from double-click to single-click to open Entry Dialog
- PREP-005: HoursChip — add tooltip explaining what the hours value means
- Non-goals: payment gateway integration, delete mode UI redesign, design system changes

## Execution Contract

- Affects:
  - `apps/reception/src/components/prepayments/MarkAsPaidButton.tsx`
  - `apps/reception/src/components/prepayments/MarkAsFailedButton.tsx`
  - `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx`
  - `apps/reception/src/components/prepayments/BookingPaymentsLists.tsx`
  - `apps/reception/src/components/prepayments/HoursChip.tsx`
- Acceptance checks:
  - MarkAsPaidButton: clicking amount shows confirm/cancel; confirm fires transaction; cancel resets
  - MarkAsFailedButton: clicking shows confirm/cancel with loading state; code 7 = button hidden
  - PrepaymentsContainer: transactions record logged-in user name, not "System"
  - BookingPaymentsLists: single click opens dialog; delete mode still works (onBookingClick path)
  - HoursChip: tooltip visible on hover explaining the hours
- Validation commands: `pnpm typecheck && pnpm lint` (scoped to reception app)
- Rollback note: git revert the commit

## Outcome Contract

- **Why:** Staff were accidentally marking guests as paid/failed by mis-clicking the buttons. The double-click requirement to open booking details was undiscoverable. Transactions were attributed to "System" instead of the staff member who processed them.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Payment action buttons require confirmation before firing; row opens on single click; transactions carry the correct staff member name.
- **Source:** operator
