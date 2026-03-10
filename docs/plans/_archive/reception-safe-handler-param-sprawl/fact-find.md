---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-safe-handler-param-sprawl
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-safe-handler-param-sprawl/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309113000-0002
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Safe Handler Param Sprawl — Fact-Find Brief

## Scope

### Summary

`SafeManagement.tsx` contains nine async handlers (handleDeposit, handleWithdrawal, handleExchange, handleOpen, handleReset, handleReconcile, handleBankDeposit, handlePettyCash, handleReturn). Seven of these follow an identical structural pattern: build a `steps` array, call `runTransaction(steps)`, close the modal on success (`setActiveModal(null)`), and catch with a `showToast(…, "error")`. They are each implemented as independent closures with 2–5 positional scalar parameters.

`BankDepositForm` uses an inline `parseFloat`/`parseInt` + toast validation pattern rather than the shared `safeTransactionFormSchema`. The other forms (`SafeDepositForm`, `SafeResetForm`, `SafeReconcileForm`, `SafeWithdrawalForm`, `SafeOpenForm`) all use `safeTransactionFormSchema`.

### Goals

- Replace the six structurally-identical handlers with a single `runSafeTransaction` helper that owns the `runTransaction` + `setActiveModal(null)` + `showToast` pattern.
- Convert each handler to a named-param object call site, eliminating positional parameter risk.
- Migrate `BankDepositForm` validation to `safeTransactionFormSchema` to match the other forms.

### Non-goals

- Changing the mutation hooks (`useSafeData`, `useSafeLogic`, `useSafeKeycardCount`, `useCashCounts`).
- Changing `CashCountingForm` or `PasswordReauthInline` shared components.
- Adding new safe transaction types or UI flows.
- Changing `handleReturn` (keycard-only handler with unique error-handling logic — swallows specific error messages, not a good candidate for the shared helper without extra complexity).
- Changing `handleExchange` (has conditional step construction by direction — adding it to the shared helper adds branching complexity that exceeds the simplification gain; excluded from scope).
- Changing `handlePettyCash` (single direct `recordPettyWithdrawal` call, no `runTransaction` — already minimal).

### Constraints & Assumptions

- Constraints:
  - Do not change the `onConfirm` prop signatures of any form component (they are called from test mocks with hardcoded positional args).
  - `runTransaction` utility must not be modified.
  - Test suite must pass in CI after changes (no local test execution).
- Assumptions:
  - The shared helper lives in `SafeManagement.tsx` itself (co-location), not extracted to a utility file — keeps blast radius contained and avoids a new shared module.
  - Named-param objects for handlers are an internal detail; external form `onConfirm` signatures are unchanged.

## Outcome Contract

- **Why:** Copy-paste handler structure means adding a new safe transaction type requires duplicating ~30 lines. Positional params make refactoring fragile.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Safe transaction handlers share a common structure. Adding a new transaction type does not require duplicating handler boilerplate.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/app/safe-management/page.tsx` — Next.js App Router route page; wraps `SafeManagement` in `Providers`, `TillShiftProvider`, and `SafeDataProvider`. Declares `export const dynamic = "force-dynamic"` to prevent static prerendering.
- `apps/reception/src/components/safe/SafeManagement.tsx` — the single component containing all nine handlers. Exported as `memo(SafeManagement)` (default export).

### Key Modules / Files

- `apps/reception/src/components/safe/SafeManagement.tsx` — all nine handlers, `SafeModal` union type, modal routing JSX.
- `apps/reception/src/components/safe/BankDepositForm.tsx` — inline validation (non-schema), differs from all other forms.
- `apps/reception/src/components/safe/SafeDepositForm.tsx` — uses `safeTransactionFormSchema`, delegates body to `CashCountingForm`.
- `apps/reception/src/components/safe/SafeResetForm.tsx` — uses `safeTransactionFormSchema`, extra `DifferenceBadge` in body.
- `apps/reception/src/components/safe/SafeReconcileForm.tsx` — uses `safeTransactionFormSchema`, blind-close toggle logic.
- `apps/reception/src/components/safe/SafeWithdrawalForm.tsx` — uses `safeTransactionFormSchema`, has inline `error` state for display.
- `apps/reception/src/components/safe/SafeOpenForm.tsx` — uses `safeTransactionFormSchema`, `FormContainer` wrapper (not `CashCountingForm`).
- `apps/reception/src/components/safe/schemas.ts` — `safeTransactionFormSchema` (z.object: amount positive, keycards nonNegInt optional, keycardDifference int optional).
- `apps/reception/src/components/safe/SafeReconciliation.tsx` — second consumer of `BankDepositForm`; also has its own `handleConfirm`/`handleBankConfirm` handlers following the same try/runTransaction/catch pattern. Not in scope for handler refactoring (dispatch anchor = SafeManagement.tsx only).
- `apps/reception/src/utils/transaction.ts` — `runTransaction(steps: TransactionStep[])`: executes steps sequentially, rolls back completed steps on failure, re-throws error.
- `apps/reception/src/components/safe/__tests__/SafeManagement.test.tsx` — full integration test suite for SafeManagement (9+ test cases covering all handlers, rollback paths, error states).

### Patterns & Conventions Observed

- **Handler pattern (applies to 6 in-scope handlers):**
  ```
  const handleXxx = async (...positional args...) => {
    [optionally build steps array]
    try {
      await runTransaction(steps);
      setActiveModal(null);
    } catch {
      showToast("Failed to record xxx.", "error");
    }
  };
  ```
  Confirmed in: `handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit`. `handleExchange` also follows this shape but is excluded from the shared helper migration (conditional step construction by direction adds complexity that outweighs the gain). `handlePettyCash` and `handleReturn` are excluded for separate structural reasons (see Non-goals).

- **BankDepositForm validation divergence:** `BankDepositForm` uses `parseFloat(amount)` with `isNaN` check and manual `showToast` — does not use `safeTransactionFormSchema`. All other forms call `safeTransactionFormSchema.safeParse(...)`.

- **Positional params in handler signatures:**
  - `handleDeposit(amount, keycardCount, keycardDifference, breakdown)` — 4 params
  - `handleBankDeposit(amount, keycards, keycardDifference)` — 3 params
  - `handleReset(count, keycards, keycardDifference, breakdown)` — 4 params
  - `handleReconcile(count, difference, keycards, keycardDifference, breakdown)` — 5 params (highest)
  - `handleExchange(outgoing, incoming, direction, total)` — 4 params (excluded from shared helper — conditional step construction by direction)
  - `handleWithdrawal(amount, breakdown)` — 2 params
  - `handleOpen(count, keycards)` — 2 params

- **`handlePettyCash` and `handleReturn` are structurally distinct:** `handlePettyCash` calls `recordPettyWithdrawal` directly (no `runTransaction`). `handleReturn` uses `runTransaction` but has special error-swallowing logic for `"return failed"` message.

### Data & Contracts

- Types/schemas/events:
  - `safeTransactionFormSchema`: z.object — `amount: positiveNumber`, `keycards: nonNegativeInt (optional)`, `keycardDifference: z.number().int() (optional)`.
  - `TransactionStep`: `{ run: () => Promise<void>; rollback?: () => Promise<void> }`.
  - `SafeModal` union type in `SafeManagement.tsx`: `"deposit" | "withdrawal" | "exchange" | "bankDeposit" | "pettyCash" | "reconcile" | "open" | "reset" | "return" | null`.
  - `BankDepositFormProps.onConfirm`: `(amount: number, keycardCount: number, keycardDifference: number) => void` — 3 positional params, unchanged.

- Persistence:
  - No direct persistence in handler layer; all writes go through `useSafeData` hooks (Firebase via `useSafeLogic`).

- API/contracts:
  - `useSafeData()` returns: `recordDeposit`, `recordWithdrawal`, `recordExchange`, `recordOpening`, `recordReset`, `recordReconcile`, `recordBankDeposit`, `recordBankWithdrawal`, `recordPettyWithdrawal`.
  - `useSafeKeycardCount()` returns: `count: safeKeycards`, `updateCount: updateSafeKeycards`.
  - `useCashCounts()` returns: `addCashCount`, `recordFloatEntry`.

### Dependency & Impact Map

- Upstream dependencies:
  - `useSafeData` (SafeDataContext → useSafeLogic → Firebase) — not changing.
  - `useSafeKeycardCount` — not changing.
  - `useCashCounts` — not changing.
  - `runTransaction` utility — not changing.
  - All form components (SafeDepositForm, BankDepositForm, SafeResetForm, SafeReconcileForm, etc.) — `onConfirm` prop signatures unchanged.

- Downstream dependents:
  - No other files import `SafeManagement.tsx` handlers directly (closures, not exported).
  - `BankDepositForm.tsx` schema migration changes internal validation behavior on both screens that render this form: `SafeManagement.tsx` and `SafeReconciliation.tsx` (confirmed — both use identical `onConfirm` signature). No prop signature changes; both consumers delegate validation to the form. The behavioral change (schema replaces inline parseFloat+isNaN) is consistent and safe for both screens.
  - `SafeReconciliation.tsx` is NOT in scope for handler refactoring (out of dispatch scope). Its own handlers (`handleConfirm`, `handleBankConfirm`) are structurally similar but the dispatch anchor is `SafeManagement.tsx handlers only`.
  - `apps/reception/src/parity/__tests__/safe-route.parity.test.tsx` — imports `SafeManagement` directly, has DOM snapshot. Handler refactor is internal (no JSX changes), so snapshot is expected to remain stable.
  - `apps/reception/src/components/safe/__tests__/SafeReconciliation.test.tsx` — tests `SafeReconciliation`, including `BankDepositForm` mock. Schema migration does not change `BankDepositForm` prop signatures; test should be unaffected.

- Likely blast radius:
  - `SafeManagement.tsx` internal refactor only.
  - `BankDepositForm.tsx` validation change only.
  - Tests in `__tests__/SafeManagement.test.tsx` mock all form `onConfirm` calls — no test changes needed for handler internals, but any behavioral change to `handleBankDeposit` (e.g., how toast fires on invalid input from form) must be verified.
  - `__tests__/BankDepositForm.test.tsx` tests `BankDepositForm` validation directly — schema migration must keep same external behavior.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + React Testing Library (`@testing-library/react`, `@testing-library/user-event`)
- Commands: CI only (`pnpm -w run test:governed`). Never run locally per project policy.
- CI integration: `gh run watch` for monitoring after push.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| SafeManagement handlers | Unit/integration | `__tests__/SafeManagement.test.tsx` | All 9 handlers covered; rollback paths tested for deposit, withdrawal, exchange, open, reset, reconcile, bank deposit, petty cash, return |
| SafeManagement parity | Parity/snapshot | `src/parity/__tests__/safe-route.parity.test.tsx` | Imports SafeManagement directly; snapshots DOM and checks button presence; uses `data-cy` testId attributes via modalFactory mocks. A DOM snapshot stored here will need updating if modal rendering changes. |
| BankDepositForm validation | Unit | `__tests__/BankDepositForm.test.tsx` | Tests validation: asserts `onConfirm` not called and toast fired for invalid input (amount=0). Does NOT assert the exact error string — schema migration is not constrained by toast-copy compatibility. |
| SafeDepositForm | Unit | `__tests__/SafeDepositForm.test.tsx` | Existing schema usage tested |
| SafeReconcileForm | Unit | `__tests__/SafeReconcileForm.test.tsx` | Existing schema usage tested |
| SafeResetForm | Unit | `__tests__/SafeResetForm.test.tsx` | Existing schema usage tested |
| SafeWithdrawalForm | Unit | `__tests__/SafeWithdrawalForm.test.tsx` | Existing schema usage tested |
| SafeOpenForm | Unit | `__tests__/SafeOpenForm.test.tsx` | Existing schema usage tested |
| SafeReconciliation (secondary BankDepositForm consumer) | Unit | `__tests__/SafeReconciliation.test.tsx` | Tests SafeReconciliation with BankDepositForm mocked; not affected by schema migration (prop signatures unchanged) |

#### Coverage Gaps

- Untested paths:
  - No test for `BankDepositForm` with schema-based rejection (only inline validation tested) — after migration, schema path must be exercised.
- Extinct tests:
  - None identified. Test mock signatures in `SafeManagement.test.tsx` call `onConfirm` with positional args (e.g., `onConfirm(40, 2, 1)` for bank deposit) — these are stable because form prop signatures are not changing.

#### Testability Assessment

- Easy to test:
  - Handler refactor: all handlers are already integration-tested via `SafeManagement.test.tsx`; test mocks use form `onConfirm` calls, which are unchanged. The `runSafeTransaction` helper will be an internal (non-exported) closure in `SafeManagement.tsx` — it is covered via the existing handler integration tests, not directly as a unit.
  - `BankDepositForm` schema migration: `BankDepositForm.test.tsx` does not assert specific error strings — the existing test that verifies "invalid input → toast fires" will pass unchanged.
- Hard to test:
  - None identified for this scope.
- Test seams needed:
  - None new required; existing mock structure in `SafeManagement.test.tsx` is already well-isolated.

#### Recommended Test Approach

- Unit tests for: none new — `runSafeTransaction` is non-exported; coverage is via integration path.
- Integration tests for: `SafeManagement.test.tsx` — all existing tests should pass unchanged after the handler refactor. `BankDepositForm.test.tsx` — existing test passes unchanged after schema migration (no error-string assertions).
- E2E tests for: none required for this refactor.

### Recent Git History (Targeted)

- `apps/reception/src/components/safe/` at `ffb88b659b` — "Wave 2 — SafeManagement modal union + useDropdownMenu hook": introduced the `SafeModal` union type, consolidated modal state. This is the commit that stabilized the current handler structure being refactored.
- `apps/reception/src/components/safe/` at `810f729625` — "Wave 1 — extract shared types, remove thin hooks, add error boundaries": earlier extract of shared patterns.
- No changes to `BankDepositForm.tsx` or `SafeManagement.tsx` in the last 5 commits beyond the Wave 2 refactor — the handler structure is stable.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| SafeManagement handler signatures (all 9) | Yes | None | No |
| `runTransaction` contract and step shape | Yes | None | No |
| BankDepositForm validation divergence | Yes | None | No |
| `safeTransactionFormSchema` field coverage | Yes | None | No |
| Test coverage for all handlers (rollback paths) | Yes | None | No |
| `onConfirm` prop contract stability (form components) | Yes | None — form signatures unchanged, test mocks stable | No |
| Blast radius outside `safe/` directory | Yes | None — no external imports of handlers | No |
| `handleReturn` and `handlePettyCash` exclusion rationale | Yes | None — structurally distinct, excluded with explicit justification | No |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** The scope covers the files named in the dispatch and limits changes to handler internals and BankDepositForm validation. It explicitly excludes mutation hooks, shared utility changes, and structurally-distinct handlers (handleReturn, handlePettyCash, handleExchange). The directly-modified files are `SafeManagement.tsx` and `BankDepositForm.tsx`; `SafeReconciliation.tsx` is a second consumer of `BankDepositForm` but is not in scope for handler changes and is not affected by the validation schema migration (no prop changes). The test surface spans seven files (SafeManagement.test.tsx, BankDepositForm.test.tsx, SafeReconciliation.test.tsx, safe-route.parity.test.tsx, SafeDepositForm.test.tsx, SafeReconcileForm.test.tsx, SafeResetForm.test.tsx) — all existing, no new tests required.

## Confidence Inputs

- **Implementation: 90%**
  - Evidence: All handler bodies are fully read and analyzed. The `runSafeTransaction` helper pattern is straightforwardly derived from the repeated try/catch/setActiveModal/showToast idiom. No unknown unknowns.
  - To reach >=80: already met.
  - To reach >=90: already met — codebase fully inspected, test mocks verified stable.

- **Approach: 90%**
  - Evidence: Named-param objects are a standard TS refactor. Shared helper co-located in SafeManagement avoids blast radius. Schema migration for BankDepositForm is trivial (swap parseFloat+isNaN for `safeTransactionFormSchema.safeParse`). `BankDepositForm.test.tsx` fully read — does not assert specific error string, only that a toast fired, so schema migration carries no toast-copy compatibility risk.
  - To reach >=80: already met.
  - To reach >=90: already met — `BankDepositForm.test.tsx` and `SafeReconciliation.tsx` both read; all consumer/test surfaces understood.

- **Impact: 80%**
  - Evidence: The structural improvement is concrete. Dispatch-stated outcome (adding a new transaction type without duplicating boilerplate) is verifiable.
  - To reach >=80: already met.
  - To reach >=90: Would require a new transaction type to be added as part of this change — out of scope per dispatch.

- **Delivery-Readiness: 92%**
  - Evidence: All source files read. All test files identified. Schema already exists. No new dependencies required.
  - To reach >=80: already met.
  - To reach >=90: already met.

- **Testability: 88%**
  - Evidence: All handlers are already unit/integration tested via SafeManagement.test.tsx with mocked forms. BankDepositForm has its own test file. No new test infrastructure needed.
  - To reach >=80: already met.
  - To reach >=90: Verify BankDepositForm.test.tsx covers both valid and invalid cases before and after migration.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| BankDepositForm.test.tsx tests inline validation behavior that changes after schema migration | Medium | Medium | Read BankDepositForm.test.tsx before writing the change; ensure schema path produces same toast messages. |
| `handleReturn`'s special error-swallowing (`"return failed"`) is accidentally captured in a shared wrapper | Low | Medium | Exclude `handleReturn` from the shared helper — already in Non-goals. |
| Naming collision: `runSafeTransaction` helper shadows or conflicts with any imported symbol | Low | Low | Verify no import named `runSafeTransaction` in SafeManagement.tsx before naming. |
| Named-param object shapes for handlers diverge from what tests expect (tests mock `onConfirm` calls) | Low | Low | Internal handler params are not observable from tests — only the `onConfirm` signatures matter, which are unchanged. |

## Questions

### Resolved

- Q: Should `handleReturn` be included in the shared handler pattern?
  - A: No. `handleReturn` swallows a specific error message (`"return failed"`) without calling `showToast` — this conditional error path cannot be cleanly represented in a generic wrapper without adding a discriminated option that adds more complexity than it removes.
  - Evidence: `SafeManagement.tsx` lines 286–318 — special `if ((error as Error).message !== "return failed")` check.

- Q: Should `handlePettyCash` be included?
  - A: No. `handlePettyCash` calls `recordPettyWithdrawal` directly without `runTransaction` — it's already minimal (5 lines including try/catch).
  - Evidence: `SafeManagement.tsx` lines 277–284.

- Q: Should `handleExchange` be included?
  - A: No. While `handleExchange` structurally uses `runTransaction`, its step list is built with a conditional branch (`if (direction === "drawerToSafe") ... else ...`), making it the most complex of the handlers. Wrapping it in the shared helper would require either exposing the step-builder to the caller or adding a direction-discriminated option to the helper — both add indirection that exceeds the simplification gain. Excluded from scope.
  - Evidence: `SafeManagement.tsx` lines 128–165 — inline direction-conditional step construction confirmed.

- Q: Does BankDepositForm need a form chrome change (beyond validation)?
  - A: No. The form chrome (layout, labels, PasswordReauthInline placement) is acceptable and not duplicating SafeDepositForm's chrome in a way that warrants extraction. The dispatch specifically calls out inline validation as the issue — schema migration only.
  - Evidence: BankDepositForm.tsx inspected; it uses `Input`+`PasswordReauthInline` directly, different from SafeDepositForm's `CashCountingForm` delegation. Chrome structure is distinct (not duplicated).

### Open (Operator Input Required)

None. All questions resolved from code evidence.

## Evidence Gap Review

### Gaps Addressed

- **Handler signatures**: All nine handlers in `SafeManagement.tsx` read and classified. Six are in scope for the shared helper; three excluded with justification (handleReturn: special error-swallowing; handlePettyCash: no runTransaction; handleExchange: conditional step construction complexity).
- **BankDepositForm validation**: Confirmed inline validation divergence. Schema already covers the needed fields (`amount` positive, `keycardDifference` int optional). `BankDepositForm.test.tsx` fully read — does not assert specific error string, only that a toast fires.
- **Test landscape**: All test files identified including `safe-route.parity.test.tsx` (parity/snapshot test). `SafeManagement.test.tsx` fully read — mock structure confirms `onConfirm` signatures are stable. Rollback paths tested for all relevant handlers.
- **Entry point**: `apps/reception/src/app/safe-management/page.tsx` confirmed — wraps `SafeManagement` in runtime providers with `force-dynamic`.
- **Blast radius**: `SafeReconciliation.tsx` confirmed as second consumer of `BankDepositForm`. Prop signatures unchanged; `SafeReconciliation` is unaffected by validation schema migration. `SafeReconciliation.test.tsx` mocks `BankDepositForm` — no test changes expected. Handler closures in `SafeManagement.tsx` are not exported; no external dependents. Parity test snapshot expected stable (no JSX changes).
- **Transaction utility**: `runTransaction` contract fully read — no changes needed.

### Confidence Adjustments

- No reductions from initial estimates. Implementation confidence is high because all source is read and the refactor is purely structural.
- Approach score raised to 90% after `BankDepositForm.test.tsx` was fully read and confirmed not to assert specific error strings; schema migration is not constrained by toast-copy compatibility. `SafeReconciliation.tsx` also read — confirmed as second BankDepositForm consumer with stable prop signature.

### Remaining Assumptions

- `BankDepositForm.test.tsx` does not assert the specific error string — it only asserts that a toast was fired (line 50: `expect(toastMock).toHaveBeenCalled()`). The schema migration therefore carries no toast-copy compatibility risk. The test will pass as long as `showToast` is still called on invalid input.

## Planning Constraints & Notes

- Must-follow patterns:
  - Handler closures in `SafeManagement.tsx` remain as `const handleXxx = async (...) => { ... }`.
  - `onConfirm` prop signatures on form components must not change (test mocks are positional).
  - Schema: `safeTransactionFormSchema.safeParse({ amount, ... })` — same field names as used in other forms.
  - `showToast("Failed to record xxx.", "error")` messages must be preserved verbatim (tested in `SafeManagement.test.tsx`).
- Rollout/rollback expectations:
  - Purely internal refactor — no feature flag needed. Rollback = revert commit.
- Observability expectations:
  - None — no metrics or logging paths affected.

## Suggested Task Seeds (Non-binding)

1. Read `BankDepositForm.test.tsx` and `safe-route.parity.test.tsx` fully before writing any changes (plan pre-flight: understand snapshot and validation test expectations).
2. Extract `runSafeTransaction` helper in `SafeManagement.tsx` (internal named function, not exported).
3. Migrate `handleDeposit`, `handleWithdrawal`, `handleOpen`, `handleReset`, `handleReconcile`, `handleBankDeposit` to use the helper.
4. Migrate `BankDepositForm.tsx` validation to `safeTransactionFormSchema`.
5. Run `pnpm --filter @apps/reception typecheck && pnpm --filter @apps/reception lint` locally; push to CI for tests (`gh run watch`).

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: CI tests green (all `safe/__tests__/*.test.tsx` files pass AND `parity/__tests__/safe-route.parity.test.tsx` passes), `@apps/reception` lint clean, `@apps/reception` typecheck clean.
- Post-delivery measurement plan: No metrics measurement required — operational outcome (reduced boilerplate).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-safe-handler-param-sprawl --auto`
