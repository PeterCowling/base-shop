# Prepayments UX Hardening — Build Record

**Date:** 2026-03-14
**Business:** BRIK
**Feature Slug:** brik-prepayments-ux-hardening

## What Was Built

Six targeted improvements to the prepayments screen, delivered in a single commit:

1. **Payment confirmation (MarkAsPaidButton)** — clicking the euro amount now shows ✓/✗ confirm buttons before the transaction is written to Firebase. Stops accidental one-click payment records.

2. **Failure confirmation + loading state (MarkAsFailedButton)** — clicking "Mark as Failed" now shows a ✓/✗ confirm step. The button is visibly disabled while the async call is in progress.

3. **Terminal state guard (MarkAsFailedButton)** — the button returns null when activity code 7 is already in the booking's codes. Prevents extra emails and duplicate code-7 records after the final failure attempt.

4. **User attribution in transactions (PrepaymentsContainer)** — `user_name` in `addToAllTransactions` now reads from the Firebase Auth user (`displayName ?? email ?? "System"`). Transactions now carry the staff member's name.

5. **Single-click row interaction (BookingPaymentsLists)** — row `onClick` opens the Entry Dialog directly. Double-click removed. Delete mode still works (the `onBookingClick` branch in the handler, which is only passed when `isDeleteMode` is true in `PrepaymentsView`). The payment-action `Inline` container stops propagation so clicking Pay/Fail buttons doesn't also open the dialog.

6. **Hours tooltip (HoursChip)** — the chip now has a `title` attribute: "X hours since terms were agreed or last payment attempt (alert threshold: Yh)".

## Files Changed

- `apps/reception/src/components/prepayments/MarkAsPaidButton.tsx`
- `apps/reception/src/components/prepayments/MarkAsFailedButton.tsx`
- `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx`
- `apps/reception/src/components/prepayments/BookingPaymentsLists.tsx`
- `apps/reception/src/components/prepayments/HoursChip.tsx`

## Validation

- `tsc --noEmit` (reception app): passed, no errors
- `eslint` on all 5 changed files: passed, no warnings

## Outcome Contract

- **Why:** Staff were accidentally recording payments and failure states by mis-clicking buttons with no confirmation. The double-click to open a booking was invisible to new staff. Transactions were attributed to "System" rather than the person who processed them.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Payment action buttons require confirmation before firing; row opens on single click; transactions carry the correct staff member's name; the Mark as Failed button disappears after the third failure is recorded.
- **Source:** operator
