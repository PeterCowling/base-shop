---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Completed-date: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-safe-handler-param-sprawl
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Safe Handler Param Sprawl — Plan

## Summary

`SafeManagement.tsx` contains nine async handlers, six of which follow an identical try/runTransaction/setActiveModal/catch/showToast pattern with 2–5 positional scalar parameters each. This plan extracts a shared `runSafeTransaction` helper (internal to `SafeManagement.tsx`) and converts the six handlers to use it. Separately, `BankDepositForm.tsx` uses inline `parseFloat`+`isNaN` validation instead of the shared `safeTransactionFormSchema` used by all other forms — this is migrated in a standalone task. Both changes are internal; no prop signatures, mutation hooks, or test mock structures change.

## Active tasks

- [x] TASK-01: Migrate BankDepositForm validation to safeTransactionFormSchema
- [x] TASK-02: Extract runSafeTransaction helper and migrate SafeManagement handlers

## Goals

- Eliminate the six-times-repeated try/runTransaction/setActiveModal/catch/showToast boilerplate in `SafeManagement.tsx`.
- Align `BankDepositForm` validation with the `safeTransactionFormSchema` used by all other safe forms.

## Non-goals

- Changing `handleExchange`, `handleReturn`, or `handlePettyCash` (structural exclusions documented in fact-find).
- Changing `SafeReconciliation.tsx` handlers (out of dispatch scope).
- Changing mutation hooks, `CashCountingForm`, `PasswordReauthInline`, or `runTransaction`.
- Adding new safe transaction types.
- Changing any `onConfirm` prop signature on any form component.

## Constraints & Assumptions

- Constraints:
  - `onConfirm` prop signatures on all form components must not change (test mocks are positional).
  - `showToast("Failed to record xxx.", "error")` message strings must be preserved verbatim.
  - `runSafeTransaction` helper is internal to `SafeManagement.tsx` (not exported).
  - Tests run in CI only; never locally. Push to origin/dev and monitor with `gh run watch`.
  - Writer lock required for commits: `scripts/agents/with-writer-lock.sh`.
- Assumptions:
  - `BankDepositForm.test.tsx` does not assert specific error strings — confirmed (test only checks `toastMock.toHaveBeenCalled()`).
  - Parity snapshot in `safe-route.parity.test.tsx` will not change (no JSX output changes in either task).

## Inherited Outcome Contract

- **Why:** Copy-paste handler structure means adding a new safe transaction type requires duplicating ~30 lines. Positional params make refactoring fragile.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe transaction handlers share a common structure. Adding a new transaction type does not require duplicating handler boilerplate.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-safe-handler-param-sprawl/fact-find.md`
- Key findings used:
  - Six handlers (`handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit`) share identical structural pattern — confirmed by reading all handler bodies.
  - `BankDepositForm` uses inline validation; all other forms use `safeTransactionFormSchema` — confirmed.
  - `BankDepositForm` rendered by both `SafeManagement` and `SafeReconciliation` — prop signatures identical and unchanged by this task.
  - `safe-route.parity.test.tsx` exists and has a DOM snapshot — confirmed; no JSX changes in scope.
  - `BankDepositForm.test.tsx` toast assertion is `toHaveBeenCalled()` only, not string-specific — confirmed.

## Proposed Approach

- Option A: Extract `runSafeTransaction(steps, errorMessage)` as a named `const` inside `SafeManagement.tsx`. Each handler builds its steps array and calls `runSafeTransaction(steps, "Failed to record xxx.")`. No exports, no new files.
- Option B: Extract to a utility file (`utils/safeHandlerUtils.ts`) for reuse across `SafeManagement` and `SafeReconciliation`.
- Chosen approach: **Option A.** The dispatch explicitly scopes to `SafeManagement.tsx` handlers only. `SafeReconciliation.tsx` is out of scope. Option B would expand blast radius to a new shared module and require updating `SafeReconciliation` in the same pass — over-engineering for a single-file refactor. Option A is tightly scoped, self-contained, and testable through existing handler integration tests.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Migrate BankDepositForm validation to safeTransactionFormSchema | 90% | S | Complete (2026-03-09) | - | - |
| TASK-02 | IMPLEMENT | Extract runSafeTransaction helper and migrate SafeManagement handlers | 90% | S | Complete (2026-03-09) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Independent; can run in parallel |

## Tasks

---

### TASK-01: Migrate BankDepositForm validation to safeTransactionFormSchema

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/safe/BankDepositForm.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/safe/BankDepositForm.tsx`, `[readonly] apps/reception/src/components/safe/schemas.ts`, `[readonly] apps/reception/src/components/safe/__tests__/BankDepositForm.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — `safeTransactionFormSchema` already covers `amount: positive`. The `keycardDifference` field is `z.number().int().optional()` — matches the diff value. The current inline validation checks `parsedAmount <= 0` (matching `positiveNumber`) and `isNaN(keycardDiff)` (matching `nonNegativeInt` or `int`). Schema covers both paths.
  - Approach: 90% — Direct swap; schema fields already exist. BankDepositForm test does not assert specific error strings, so no test changes expected.
  - Impact: 90% — Aligns BankDepositForm with all other safe forms. Both consumers (`SafeManagement`, `SafeReconciliation`) use the same `onConfirm` signature and are unaffected by internal validation changes.
  - Held-back test: No single unknown would drop below 80. Schema fields confirmed present; test assertions confirmed not string-specific.
- **Acceptance:**
  - BankDepositForm uses `safeTransactionFormSchema.safeParse({ amount: parsedAmount, keycardDifference: keycardDiff })` to replace the manual `isNaN(parsedAmount) || parsedAmount <= 0` amount check. The `isNaN(keycardDiff)` guard for non-numeric keycard input (e.g., "abc") is **preserved** before the schema call — schema expects a number input, not a raw string, so the NaN guard must remain.
  - On invalid amount (0 or negative), `showToast(...)` is still called and `onConfirm` is not called.
  - On valid input, `onConfirm(parsedAmount, newKeycardCount, keycardDiff)` is called with correct values.
  - `BankDepositForm.test.tsx` passes in CI with no changes.
  - `bash scripts/validate-changes.sh` passes locally.
  - No changes to `BankDepositForm` prop types or rendered structure.
- **Validation contract:**
  - TC-01: parsedAmount = 25, keycardInput = "1", currentKeycards = 1 → `onConfirm(25, 2, 1)` called (regression: existing test).
  - TC-02: parsedAmount = 0, keycardInput = "" → `showToast(...)` called, `onConfirm` not called (regression: existing test, `expect(toastMock).toHaveBeenCalled()`).
  - TC-03: parsedAmount = -5 → schema `positiveNumber` rejects → `showToast(...)` called, `onConfirm` not called.
  - TC-04: keycardInput = "abc" → `parseInt("abc", 10) = NaN`; the existing `keycardInput && isNaN(keycardDiff)` guard fires → `showToast(...)` called, `onConfirm` not called. This guard runs _before_ `safeTransactionFormSchema.safeParse` and must be preserved. (`keycardDiff = 0` is only the empty-string path: `keycardInput ? parseInt(keycardInput, 10) : 0`.)
- **Execution plan:** Red → Green → Refactor
  - Red: Understand current validation flow. Current form: `parseFloat(amount)` → isNaN/<=0 check → showToast; `parseInt(keycardInput)` → isNaN check → showToast; then `onConfirm`. Schema does not parse strings — must still run `parseFloat`/`parseInt` first, then feed numbers into `safeTransactionFormSchema.safeParse`.
  - Green: Replace the two manual numeric checks with a single `safeTransactionFormSchema.safeParse({ amount: parsedAmount, keycardDifference: keycardDiff })`. Keep the `parseInt(keycardInput)` pre-parse and `isNaN(keycardDiff)` guard in place before the schema call (schema expects number inputs, not strings). If schema fails, call `showToast(...)` and return.
  - Refactor: Remove the now-redundant `isNaN(parsedAmount) || parsedAmount <= 0` manual check (superseded by schema). Verify `BankDepositForm.test.tsx` still passes.
- **Planning validation:**
  - Checks run: `BankDepositForm.tsx` fully read (lines 1–114). `schemas.ts` fully read. `BankDepositForm.test.tsx` fully read (lines 1–80).
  - Validation artifacts: Schema fields: `amount: positiveNumber` (z.number().positive()), `keycardDifference: z.number().int().optional()`. Test assertions: `expect(onConfirm).toHaveBeenCalledWith(25, 2, 1)` (happy path); `expect(toastMock).toHaveBeenCalled()` (invalid path — no string assertion).
  - Unexpected findings: None. Note: `keycardInput` of "abc" — must still pre-parse with `parseInt` and guard `isNaN` before schema call since schema takes numbers not strings.
- **Scouts:** None: S-effort task; all unknowns resolved in planning.
- **Edge Cases & Hardening:**
  - `keycardInput = "abc"`: `parseInt("abc", 10)` → `NaN`; existing `isNaN(keycardDiff)` guard fires before schema call → `showToast` + return. Behavior preserved.
  - `keycardInput = ""` (empty): current code: `keycardInput ? parseInt(...) : 0` → `keycardDiff = 0`. Schema: `keycardDifference: 0` → passes `z.number().int().optional()`. No issue.
  - Negative keycardDiff (e.g., `-2`): schema `z.number().int()` accepts negative integers — this is valid for the schema. Current code does not guard against negative keycards. Behavior preserved (no regression).
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: No feature flag. Internal validation change; no user-visible behavior change for valid inputs.
  - Rollback: Revert commit.
- **Documentation impact:** None: internal validation change.
- **Notes / references:**
  - `apps/reception/src/components/safe/schemas.ts`: `safeTransactionFormSchema` fields confirmed.
  - `apps/reception/src/components/safe/__tests__/BankDepositForm.test.tsx` line 50: `expect(toastMock).toHaveBeenCalled()` — no string assertion.
  - `SafeReconciliation.tsx` uses `BankDepositForm` with same prop signature — unaffected.

---

### TASK-02: Extract runSafeTransaction helper and migrate SafeManagement handlers

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/safe/SafeManagement.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/components/safe/SafeManagement.tsx`, `[readonly] apps/reception/src/utils/transaction.ts`, `[readonly] apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx`, `[readonly] apps/reception/src/parity/__tests__/safe-route.parity.test.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — All six handler bodies fully read and analyzed. The shared pattern is: build steps array, call `runTransaction(steps)`, `setActiveModal(null)` on success, `showToast("Failed to record xxx.", "error")` on catch. The helper signature `runSafeTransaction(steps: TransactionStep[], errorMessage: string): Promise<void>` covers all six handlers.
  - Approach: 90% — Co-location in `SafeManagement.tsx` as a `const` before the component function or as a named function inside. Internal to component module; no new exports. Tested transitively through existing handler integration tests.
  - Impact: 90% — No behavioral change. All `showToast` strings, `setActiveModal(null)` calls, and `runTransaction` invocations are preserved. Existing tests exercise all rollback paths.
  - Held-back test: No single unknown would drop below 80. Handler bodies confirmed; test mock structures confirmed; closure over `setActiveModal` understood.
- **Acceptance:**
  - A `runSafeTransaction` helper exists in `SafeManagement.tsx` (not exported).
  - `handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit` all call `runSafeTransaction(steps, errorMessage)` instead of inlining try/catch/setActiveModal.
  - `handleExchange`, `handlePettyCash`, `handleReturn` are unchanged.
  - All existing tests in `SafeManagement.test.tsx` pass (handlers, rollback paths, error toasts).
  - `safe-route.parity.test.tsx` snapshot passes (no JSX changes).
  - `bash scripts/validate-changes.sh` passes locally.
  - `pnpm --filter @apps/reception typecheck` and `pnpm --filter @apps/reception lint` pass locally.
- **Validation contract:**
  - TC-01: `handleDeposit` → calls `runTransaction`, on success `setActiveModal(null)`, on failure `showToast("Failed to record deposit.", "error")` — regression: existing test "rolls back deposit when cash count fails".
  - TC-02: `handleWithdrawal` → same pattern — regression: "rolls back withdrawal when float entry fails".
  - TC-03: `handleOpen` → calls `updateSafeKeycards` + `recordOpening` steps, on failure `showToast("Failed to record opening.", "error")` — regression: "shows error when opening safe fails".
  - TC-04: `handleReset` → same pattern — regression: "shows error when resetting safe fails".
  - TC-05: `handleReconcile` → same pattern — regression: "shows error when reconciliation fails".
  - TC-06: `handleBankDeposit` → same pattern — regression: "shows error when bank deposit fails".
  - TC-07: `handleExchange` unchanged — regression: existing exchange rollback tests pass.
  - TC-08: `handlePettyCash` unchanged — regression: petty cash test passes.
  - TC-09: `handleReturn` unchanged — regression: return keycard test passes.
- **Execution plan:** Red → Green → Refactor
  - Red: Six handlers each inline: build steps array → `try { await runTransaction(steps); setActiveModal(null); } catch { showToast("...", "error"); }`.
  - Green: Add inside `SafeManagement` (above `toggleDetails`, or as a `useCallback`-wrapped helper — do not use `useCallback` since it's not a prop-passed callback; plain `const` is fine):
    ```ts
    const runSafeTransaction = async (
      steps: import("../../utils/transaction").TransactionStep[],
      errorMessage: string
    ): Promise<void> => {
      try {
        await runTransaction(steps);
        setActiveModal(null);
      } catch {
        showToast(errorMessage, "error");
      }
    };
    ```
    Then replace each of the six handler bodies with the appropriate `runSafeTransaction(steps, "Failed to record xxx.")` call. Each handler still builds its own `steps` array before calling the helper.
  - Refactor: Verify `handleDeposit` still conditionally pushes the keycard step only when `keycardDifference !== 0`. Verify `handleBankDeposit` still conditionally pushes the keycard step. These conditional step-building branches are in the handler, not in the helper — no change needed.
- **Planning validation:**
  - Checks run: All nine handlers in `SafeManagement.tsx` fully read (lines 77–318). `runTransaction` contract confirmed: `runTransaction(steps: TransactionStep[]): Promise<void>`.
  - Validation artifacts: Handler line numbers confirmed; step array shapes confirmed; `setActiveModal` is called from within `SafeManagement` function scope — accessible to the helper if defined inside the component.
  - Unexpected findings: None. Note: the helper must be defined inside the component function body (or as a stable `const` above it, but `setActiveModal` is a state setter available only inside the component). Define it as a `const` inside the component, before the handlers.
- **Consumer tracing:**
  - `runSafeTransaction` is internal — no consumers outside `SafeManagement.tsx`.
  - `setActiveModal` (captured in closure): still called from `runSafeTransaction` on success. All callers that previously called `setActiveModal(null)` directly within the handler now do so via the helper — behavior identical.
  - `showToast` (module import): still called from `runSafeTransaction` on catch. Error message strings are passed by the handler — verbatim preservation guaranteed.
  - No modified signatures for any existing function or hook.
- **Scouts:** None: S-effort task; all unknowns resolved.
- **Edge Cases & Hardening:**
  - `handleDeposit` conditional keycard step: `if (keycardDifference !== 0) { steps.push(...) }` — this happens before calling `runSafeTransaction(steps, ...)`. No change to this conditional logic.
  - `handleBankDeposit` conditional keycard step: same — `if (keycardDifference !== 0)` builds steps array conditionally, then passes to `runSafeTransaction`. No change.
  - `handleReturn` special error swallowing: excluded from migration — unchanged. Its `catch (error)` block checks `(error as Error).message !== "return failed"` before toasting. This logic cannot be represented in the generic helper.
  - Snapshot test: `safe-route.parity.test.tsx` mocks all form components via `modalFactory`. No JSX output from SafeManagement changes in this task — snapshot will not change.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: No feature flag. Pure structural refactor; no behavioral change.
  - Rollback: Revert commit.
- **Documentation impact:** None: internal refactor.
- **Notes / references:**
  - `SafeManagement.tsx` is 597 lines. The helper should be defined after the `useCashCounts` / `useKeycardTransfer` hook calls and before `handleDeposit` (around line 76).
  - `TransactionStep` type is exported from `apps/reception/src/utils/transaction.ts` — import it for the helper type annotation, or use inline `Array<{ run: () => Promise<void>; rollback?: () => Promise<void> }>`.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: BankDepositForm schema migration | Yes | None — schema fields confirmed present; NaN pre-parse guard preserved; test assertions confirmed non-string-specific | No |
| TASK-02: runSafeTransaction helper + handler migration | Yes | None — helper must be defined inside component (setActiveModal closure); confirmed this is addressable; no export required | No |

## Risks & Mitigations

- `safeTransactionFormSchema` does not cover `keycardDifference < 0` — existing behavior allows it; preserved. No change to validation semantics.
- `safe-route.parity.test.tsx` snapshot: no JSX changes in scope, so no snapshot diff is expected. If a diff occurs (e.g., from a class ordering change), update via CI only — push to origin/dev and follow CI output. Local Jest execution is prohibited per repo testing policy.
- `TransactionStep` import for helper type annotation: can use inline type or named import — either is clean. Use named import from `../../utils/transaction` for consistency.

## Observability

- Logging: None — no logging paths affected.
- Metrics: None — no metrics affected.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] `runSafeTransaction` helper present in `SafeManagement.tsx`, not exported.
- [ ] Six handlers (`handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit`) use the helper.
- [ ] `handleExchange`, `handleReturn`, `handlePettyCash` unchanged.
- [ ] `BankDepositForm.tsx` uses `safeTransactionFormSchema`.
- [ ] All `safe/__tests__/*.test.tsx` tests pass in CI.
- [ ] `parity/__tests__/safe-route.parity.test.tsx` passes in CI.
- [ ] `bash scripts/validate-changes.sh` passes locally (runs typecheck + lint for changed packages).
- [ ] `pnpm --filter @apps/reception typecheck` clean.
- [ ] `pnpm --filter @apps/reception lint` clean.

## Decision Log

- 2026-03-09: Chose Option A (co-located helper in `SafeManagement.tsx`) over Option B (shared utility file) — dispatch scope is `SafeManagement.tsx` only; `SafeReconciliation.tsx` handler migration is future work if needed.
- 2026-03-09: Excluded `handleExchange` from helper migration — conditional step construction by direction adds complexity exceeding simplification gain.
- 2026-03-09: Excluded `handleReturn` — special error-swallowing logic (`"return failed"` message) cannot be represented in the generic helper.
- 2026-03-09: Excluded `handlePettyCash` — calls `recordPettyWithdrawal` directly, no `runTransaction`.

## Overall-confidence Calculation

- TASK-01: S (weight 1), confidence 90%
- TASK-02: S (weight 1), confidence 90%
- Overall-confidence = (90 × 1 + 90 × 1) / (1 + 1) = **90%**
