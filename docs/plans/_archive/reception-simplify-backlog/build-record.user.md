---
Type: Build-Record
Status: Complete
Feature-Slug: reception-simplify-backlog
Build-date: 2026-03-08
artifact: build-record
Business: BRIK
---

# Build Record: Reception Simplify Backlog

## Summary

Pure refactoring pass over `apps/reception/src/`. No user-visible changes. All 6 implement tasks completed in 2 waves; TASK-07 CI checkpoint triggered and running.

## What Was Done

**Wave 1 (TASK-01, TASK-02, TASK-03, TASK-06) — commit `810f729625`:**

- **TASK-01**: Created `apps/reception/src/types/bar/BarOrderDomain.ts` exporting `BarOrderItem` and `BarOrder` interfaces (with JSDoc distinguishing them from `BarTypes.ts` shapes). Removed identical local interface definitions from `useAddItemToOrder.ts`, `useRemoveItemFromOrder.ts`, and `useConfirmOrder.ts`. All three now import from the shared file. Three copies of duplicate type definitions eliminated.

- **TASK-02**: Deleted `useTillShiftState.ts`, `useTillTransactions.ts`, `useTillShiftActions.ts` and their three test files — all were zero-logic pass-through wrappers with no production value. Updated `SafeManagement.tsx` to import `useTillShiftContext` directly from `TillShiftProvider` (TillShiftProvider wraps SafeManagement in `safe-management/page.tsx` — confirmed). Updated `SafeManagement.test.tsx` mock to target `useTillShiftContext` instead of the deleted `useTillShiftActions` module.

- **TASK-03**: Created `apps/reception/src/components/common/RadioOption.tsx` — a generic `RadioOption<T extends string>` component (memo-wrapped) that consolidates `DocRadioButton` and `RadioButton` sub-components. Both sub-components removed from `DocumentTypeSelector.tsx` and `PaymentMethodSelector.tsx` respectively; replaced with `<RadioOption<DocumentType>>` and `<RadioOption<KeycardPayType>>`.

- **TASK-06**: Added `error.tsx` boundaries to 4 segments: root (`apps/reception/src/app/error.tsx`), `till-reconciliation`, `safe-management`, and `bar`. Each is a `"use client"` component with correct Next.js App Router props and a "Try again" button. Previously: no error boundaries existed anywhere in the app.

**Wave 2 (TASK-04, TASK-05) — commit `ffb88b659b`:**

- **TASK-04**: Replaced 9 independent `useState<boolean>` flags (`showDeposit`, `showWithdrawal`, `showExchange`, `showBankDeposit`, `showPettyCash`, `showReconcile`, `showOpen`, `showReset`, `showReturn`) in `SafeManagement.tsx` with a single `useState<SafeModal>(null)` discriminated union. All button `onClick` handlers call `setActiveModal('x')`; all close paths call `setActiveModal(null)`; all JSX conditionals use `activeModal === 'x'`. Mutual exclusivity of modal display is now structurally enforced.

- **TASK-05**: Extracted dropdown menu state from `KeycardDepositButton.tsx` into `apps/reception/src/hooks/client/keycardButton/useDropdownMenu.ts`. Hook encapsulates: `menuOpen`, `menuVisible`, `menuPosition`, `buttonRef`, `timeoutsRef`, `setTrackedTimeout`, cleanup effect, fade effect, `handleMenuToggle`, `closeMenu`. Returns all of these including `setTrackedTimeout` so `handleConfirm` can use it for its 800ms submit delay. `handleConfirm` now calls `closeMenu()` in its `finally` block.

## Validation Summary

- TypeScript typecheck: zero errors (all waves)
- ESLint lint: zero errors (warnings only, pre-existing)
- All TC contracts satisfied (grep verification completed)
- Bug scan: 0 findings
- CI pushed to `origin/dev` — run IDs 22828961052 (Validate Reception) and 22828961048 (Core Platform CI)

## Outcome Contract

- **Why:** Accumulated copy-paste and missing patterns from rapid delivery waves. These clusters create friction for future feature work and risk introducing subtle bugs when the same interface is updated in some files but not others.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 7 clusters resolved with no regressions. Shared type file `types/bar/BarOrderDomain.ts` created. Three thin hooks removed. `RadioOption` shared component created. Auth error paths confirmed (pre-existing — no task). `SafeManagement` modal state converted to discriminated union. `useDropdownMenu` hook extracted. Error boundaries added to app segments.
- **Source:** operator
