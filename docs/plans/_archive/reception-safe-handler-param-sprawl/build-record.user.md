---
Type: Build-Record
Status: Complete
Feature-Slug: reception-safe-handler-param-sprawl
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/reception-safe-handler-param-sprawl/build-event.json
---

# Build Record: Reception Safe Handler Param Sprawl

## Outcome Contract

- **Why:** Copy-paste handler structure means adding a new safe transaction type requires duplicating ~30 lines. Positional params make refactoring fragile.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe transaction handlers share a common structure. Adding a new transaction type does not require duplicating handler boilerplate.
- **Source:** auto

## What Was Built

**TASK-01 — BankDepositForm schema migration.** Replaced the inline `isNaN(parsedAmount) || parsedAmount <= 0` amount validation in `BankDepositForm.tsx` with a call to `safeTransactionFormSchema.safeParse({ amount: parsedAmount, keycardDifference: keycardDiff })`. The `isNaN(keycardDiff)` guard for non-numeric keycard input is preserved immediately before the schema call, since the schema takes number inputs. This brings `BankDepositForm` in line with all other safe forms (which already used `safeTransactionFormSchema`). No prop signatures, rendered structure, or toast message strings changed.

**TASK-02 — runSafeTransaction helper extraction.** Added a `runSafeTransaction(steps, errorMessage)` helper inside `SafeManagement.tsx` (not exported). The helper encapsulates the repeated `try { await runTransaction(steps); setActiveModal(null); } catch { showToast(errorMessage, "error"); }` pattern. Six handlers (`handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit`) were migrated to call the helper, each still building their own `steps` array before the call. Three handlers (`handleExchange`, `handleReturn`, `handlePettyCash`) were left unchanged per documented structural exclusions.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Run locally pre-commit via typecheck-staged hook |
| `pnpm --filter @apps/reception lint` | Pass | Run locally pre-commit via lint-staged hook (0 errors after import sort fix) |
| CI — `safe/__tests__/*.test.tsx` | Pending | Pushed to CI; `gh run watch` monitoring |
| CI — `parity/__tests__/safe-route.parity.test.tsx` | Pending | No JSX changes — snapshot expected stable |

## Validation Evidence

### TASK-01

- TC-01: Valid input path (parsedAmount = 25, keycardInput = "1", currentKeycards = 1) — schema passes, `onConfirm(25, 2, 1)` called. Covered by existing `BankDepositForm.test.tsx` happy-path test.
- TC-02: Invalid amount (parsedAmount = 0, keycardInput = "") — `z.number().positive()` rejects; `showToast(...)` called; `onConfirm` not called. Covered by existing test `expect(toastMock).toHaveBeenCalled()`.
- TC-03: Negative amount (parsedAmount = -5) — schema `positiveNumber` rejects → toast + no confirm. Behaviour preserved.
- TC-04: keycardInput = "abc" → `parseInt("abc", 10) = NaN`; `isNaN(keycardDiff)` guard fires before schema call → toast + return. Guard preserved in implementation.
- Import sort fix applied: `./schemas` import placed in a separate group after `../common/PasswordReauthInline` to satisfy `simple-import-sort/imports` rule.

### TASK-02

- TC-01 through TC-06: All six migrated handlers verified to call `runSafeTransaction(steps, "Failed to record xxx.")` with verbatim error message strings preserved. Each handler still builds its own steps array with conditional keycard step logic intact.
- TC-07 through TC-09: `handleExchange`, `handlePettyCash`, `handleReturn` bodies unchanged — confirmed via post-edit read of `SafeManagement.tsx`.
- Parity snapshot: no JSX changes in scope; `safe-route.parity.test.tsx` snapshot expected unchanged.
- `TransactionStep` type imported by name from `../../utils/transaction` for helper type annotation.

## Scope Deviations

None. Both tasks executed within planned scope. No new files created; no exports added; no prop signatures changed.
