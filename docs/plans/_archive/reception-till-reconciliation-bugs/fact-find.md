---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Platform
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: reception-till-reconciliation-bugs
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/reception-till-reconciliation-bugs/analysis.md
Dispatch-IDs: IDEA-DISPATCH-20260313130000-0001,IDEA-DISPATCH-20260313130000-0002,IDEA-DISPATCH-20260313130000-0003,IDEA-DISPATCH-20260313130000-0004,IDEA-DISPATCH-20260313130000-0005
Work-Package-Reason: Five confirmed code-level defects in the till reconciliation subsystem of apps/reception. All share the same component tree (TillReconciliation → useTillReconciliationUI / useTillReconciliationLogic / useTillShifts) and are independently actionable but share test infrastructure. Single plan minimises duplicate mocking setup.
---

# Reception Till Reconciliation Bugs — Fact-Find Brief

## Scope
### Summary
Five confirmed code-level defects in the till reconciliation feature of the reception app (`apps/reception`). All defects were observed during a live audit on 2026-03-13. They span three source files and cover UI-flow gaps, missing error handling, incorrect data writes, and stale state leakage.

### Goals
- Fix all five defects so till reconciliation is fully operational: edit/delete modes reachable, float form closes after success, keycard Firebase writes surface errors, keycard reconcile record is accurate, and shift-close override state is always clean.
- Add targeted regression tests for each fix.

### Non-goals
- Redesigning the till reconciliation UX beyond the minimum needed for each fix.
- Addressing other till subsystem areas (TillShiftHistory, DrawerLimitWarning, safe management).
- Performance optimisation.

### Constraints & Assumptions
- Constraints:
  - Reception app uses Firebase Realtime DB (not Prisma/Postgres). All write mutations go through custom Firebase hooks.
  - Tests run in CI only (`docs/testing-policy.md`). NEVER run jest locally.
  - Writer lock required for commits: `scripts/agents/with-writer-lock.sh`.
  - Pre-commit hooks run full package lint (`turbo lint`) — pre-existing lint errors in scope files must be clean before commit.
- Assumptions:
  - `useTillReconciliationUI.ts` and its test already exist and are passing. New tests should follow the established mocking pattern in `TillReconciliation.test.tsx` and `useTillShifts.test.ts`.
  - The `addCashCount` signature is stable (verified from `useCashCountsMutations.ts` line 36–43): `(type: CashCountType, count: number, difference: number, amount?: number, denomBreakdown?: Record<string, number>, keycardCount?: number)`. For the keycard reconcile call at line 622, `count` (position 2) is 0 (no cash counted), `difference` (position 3) should be `diff` (keycard difference), and `keycardCount` (position 6) is `counted`.

## Outcome Contract

Why: Five confirmed bugs blocking operational till workflows (edit/delete transaction modes unreachable, float confirmation leaves modal open, keycard Firebase errors silent, keycard audit record corrupt, shift-close retry retains stale override).

Intended Outcome:
- type: operational
- statement: All five defects fixed, regression tests passing in CI. Till reconciliation workflows operate correctly: staff can enter and exit edit/delete modes, the float form closes on success, keycard errors surface as toasts, keycard reconcile records carry correct values, and shift-close does not carry stale override state across attempts.
- source: operator

## Access Declarations

None — all evidence is local source files. No external data sources required.

## Current Process Map

None: local code path only — these are pure logic/state bugs in the React hook layer. No CI/deploy/release lane, approval path, or multi-step operator runbook is affected by these fixes. The till component tree operates as a self-contained feature within the reception app.

Current component topology (for context):
- `TillReconciliation.tsx` — composite root; reads state from `useTillReconciliationUI` + `useTillReconciliationLogic`
- `ActionButtons.tsx` — renders per-action dropdown buttons (Shift, Cash, Keycards); never activates edit/delete modes
- `TransactionModals.tsx` — renders `EditTransactionModal` / `VoidTransactionModal` when `txnToEdit`/`txnToDelete` are non-null
- `useTillReconciliationUI.ts` — owns all UI state including `isEditMode`, `isDeleteMode`, `txnToEdit`, `txnToDelete`, `cashForm`
- `useTillReconciliationLogic.ts` — wraps `useTillShifts` and exposes `confirmFloat`, `confirmExchange`, `confirmAddKeycard`, `confirmReturnKeycard`
- `useTillShifts.ts` — owns shift lifecycle: `confirmShiftClose`, `confirmKeycardReconcile`, `pendingOverride`

## Evidence Audit

### Bug 1 — Edit/Delete mode: activation buttons missing

**File**: `apps/reception/src/components/till/ActionButtons.tsx` (194 lines)

`useTillReconciliationUI.ts` exports `setIsEditMode` and `setIsDeleteMode`. The UI has working banners (`TillReconciliation.tsx`) that display when these modes are active, and `handleRowClickForEdit`/`handleRowClickForDelete` correctly implement the "select transaction and exit mode" path.

However, nowhere in `ActionButtons.tsx` (nor anywhere else in the till component tree) is `setIsEditMode(true)` or `setIsDeleteMode(true)` called. The functions are exported from the hook but have no callers.

**Result**: Edit and delete transaction modes are permanently unreachable by staff.

**Fix**: Add "Edit Transaction" and "Delete Transaction" action options to `ActionButtons.tsx` that call `setIsEditMode(true)` and `setIsDeleteMode(true)` respectively, following the same dropdown pattern as existing actions.

### Bug 2 — Float modal does not close after successful confirmation

**File**: `apps/reception/src/hooks/useTillReconciliationLogic.ts`, lines 109–124

```ts
const confirmFloat = useCallback(
  async (amount: number) => {
    try {
      await runTransaction([...]);
      // ← BUG: no ui.setCashForm("none") here
    } catch {
      showToast("Failed to confirm float.", "error");
    }
  }, [...]
);
```

Compare with `confirmExchange` (line 155–168) which calls `ui.setCashForm("none")` on the success path, and `handleTenderRemoval` (line 188–200) which also closes the form on success.

**Fix**: Add `ui.setCashForm("none")` immediately after the `await runTransaction([...])` call in `confirmFloat`.

### Bug 3 — Keycard state updated before Firebase write; silent failure on Firebase error

**File**: `apps/reception/src/hooks/useTillReconciliationLogic.ts`, lines 74–103

`confirmAddKeycard` (lines 74–86):
```ts
updateSafeKeycards(safeKeycards - count);   // ← local state updated first
return recordKeycardTransfer(count, "fromSafe");  // ← async, no .catch()
```

`confirmReturnKeycard` (lines 92–103) is identical pattern:
```ts
updateSafeKeycards(safeKeycards + count);
return recordKeycardTransfer(count, "toSafe");
```

`useKeycardTransfer` (`apps/reception/src/hooks/useKeycardTransfer.ts`) returns a Promise (async function that calls `await set(newRef, data)`). If Firebase throws, the Promise rejects — but the caller has already mutated local state and does not `.catch()` the rejection.

**Fix**: Await `recordKeycardTransfer` before calling `updateSafeKeycards`, and wrap in try/catch to show a toast on error.

### Bug 4 — Keycard reconcile record written with hardcoded zeros

**File**: `apps/reception/src/hooks/client/till/useTillShifts.ts`, line 622

```ts
addCashCount("reconcile", 0, 0, undefined, undefined, counted);
//                         ^  ^
//                         |  +-- difference: always 0 (should be counted - expectedKeycardsAtClose)
//                         +-- count (cash): always 0 (acceptable for keycard record)
```

`diff` is computed at line 618 (`const diff = counted - expectedKeycardsAtClose`) and used to call `addKeycardDiscrepancy` on line 620, but it is not passed to `addCashCount`. The reconcile record therefore always shows difference = 0 regardless of actual variance.

**Fix**: Pass `diff` as the third argument to `addCashCount` on line 622:
```ts
addCashCount("reconcile", 0, diff, undefined, undefined, counted);
```

### Bug 5 — `pendingOverride` not cleared after failed `confirmShiftClose`

**File**: `apps/reception/src/hooks/client/till/useTillShifts.ts`, lines 446–461

`confirmShiftClose` has two early-return guards:

1. Lines 446–451 (no open shift found) — no `setPendingOverride` call before `return`.
2. Lines 455–461 (wrong user, no override) — no `setPendingOverride` call before `return`.

`pendingOverride` is boolean state (`useState<boolean>`) declared at line 132. If a manager override was set in a previous close attempt and `confirmShiftClose` returns early on a subsequent attempt (different reason), the override remains `true`, allowing the second guard to be bypassed by stale state.

**Fix**: Call `setPendingOverride(false)` (or reset to initial value) in both early-return branches.

## Key Files

1. `apps/reception/src/components/till/ActionButtons.tsx` — Bug 1 fix location (add Edit/Delete menu items)
2. `apps/reception/src/hooks/useTillReconciliationLogic.ts` — Bug 2 (line 117), Bug 3 (lines 74–103)
3. `apps/reception/src/hooks/client/till/useTillShifts.ts` — Bug 4 (line 622), Bug 5 (lines 446–461)
4. `apps/reception/src/hooks/client/till/useTillReconciliationUI.ts` — `setIsEditMode`/`setIsDeleteMode` interface (read-only for Bug 1)
5. `apps/reception/src/hooks/useKeycardTransfer.ts` — confirms async/throws contract (read-only for Bug 3)
6. `apps/reception/src/components/till/TillReconciliation.tsx` — composite root with edit/delete banners (read-only for Bug 1)
7. `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx` — existing tests (new tests added here for Bug 1)
8. `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts` — existing tests (new tests for Bugs 4 and 5)
9. `apps/reception/src/hooks/client/till/__tests__/useTillReconciliationUI.test.ts` — existing tests (new tests for Bug 1 UI state)
10. `apps/reception/src/components/till/__tests__/TillFormatting.test.ts` — existing formatting tests (no changes expected)

## Confidence Inputs

- **Implementation** (can we identify the precise fix location?): High — all five defects have exact file + line evidence. `addCashCount` signature verified from `useCashCountsMutations.ts`. `ActionButtons` prop interface verified. `useTillReconciliationLogic.ts` success/failure paths read directly. No ambiguity in fix locations.

- **Approach** (is the fix approach clear?): High — Bug 2 and Bug 5 are one-line inserts. Bug 4 is a one-argument change. Bug 3 requires reorder + async wrapper + try/catch (3-step but bounded). Bug 1 requires interface extension + menu items + prop threading in two files (confirmed scope). No architectural choices remain.

- **Impact** (will the fixes produce the intended observable change?): High — each fix has a direct causal path to the broken behaviour. Regression TCs can verify each change independently. Slight uncertainty on Bug 4: if `difference` field is not consumed by audit reports, the fix is technically correct but produces no visible downstream change. Risk 3 covers this.

- **Delivery-Readiness** (are the fixes independently shippable?): High — all five fixes live in three source files with existing test infrastructure. No external dependencies. Pre-commit lint gate is known. Writer lock is established. Five fixes can be planned as parallel or sequential tasks in one plan.

- **Testability** (can each fix be regression-tested?): High — existing Jest mocking patterns in `useTillShifts.test.ts` and `TillReconciliation.test.tsx` provide sufficient infrastructure. Five TCs with clear assertions are specified in the Test Landscape section. Exception: Bug 1 regression TCs require a new approach (mocking ActionButtons partially or testing ActionButtons directly) due to the full ActionButtons mock in `TillReconciliation.test.tsx`.

## Test Landscape

Existing tests that are relevant (and passing):
- `apps/reception/src/components/till/__tests__/TillReconciliation.test.tsx` — 7 tests covering auth guard, mode banners, drawer warning, float nudge banner (TC-01 through TC-04). Tests mock `ActionButtons`, `TransactionModals`, `useTillReconciliationUI`, `useTillReconciliationLogic`.
- `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts` — existing shift lifecycle tests (mocks `AuthContext`, `TillDataContext`, `useCashCountsMutations`, etc.)
- `apps/reception/src/hooks/client/till/__tests__/useTillReconciliationUI.test.ts` — existing UI state hook tests.

New tests required (5 bugs × regression TCs):
- Bug 1: `TillReconciliation.test.tsx` — TC for "Edit Transaction button calls setIsEditMode(true)" and "Delete Transaction button calls setIsDeleteMode(true)" in `ActionButtons`.
- Bug 2: `useTillReconciliationLogic` test or integration — TC for "confirmFloat resolves → setCashForm called with 'none'".
- Bug 3: `useTillReconciliationLogic` test — TC for "confirmAddKeycard awaits Firebase write before updating local state; shows toast on Firebase error".
- Bug 4: `useTillShifts.test.ts` — TC for "confirmKeycardReconcile calls addCashCount with correct difference argument".
- Bug 5: `useTillShifts.test.ts` — TC for "pendingOverride is reset to false when confirmShiftClose returns early on wrong-user guard".

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| `UI / visual` | Required | Bug 1 adds Edit/Delete menu items to `ActionButtons.tsx` using existing DS `ActionDropdown` pattern. Other bugs are hook-only fixes with no UI change. | DS component compliance; visual consistency with existing menu items | Verify DS ActionDropdown usage matches existing menu item pattern |
| `UX / states` | Required | Bug 2: float form stays open on success (confirmed). Bug 3: keycard count may lag after Firebase-write reorder. Bug 5: stale override on close failure path. | Bug 3 fix removes optimistic update — UX may lag; plan must decide optimistic-with-rollback vs. remove-optimistic. | Bug 3 UX trade-off resolution required in analysis/plan |
| `Security / privacy` | N/A | These fixes are state-machine and error-handling corrections. No auth/authz, no user data exposure, no PII change. | None | None |
| `Logging / observability / audit` | Required | Bug 4: keycard reconcile record has `difference=0` — audit trail is misleading. Bug 3: Firebase errors are silently swallowed. | Bug 3 fix must surface Firebase errors as toast. Bug 4 fix must write correct `difference` value to audit record. | Verify `addKeycardDiscrepancy` + `addCashCount` together give complete audit for keycard reconcile |
| `Testing / validation` | Required | 5 regression TCs required (one per bug). Existing infrastructure: `useTillShifts.test.ts`, `TillReconciliation.test.tsx`, `useTillReconciliationUI.test.ts`. Bug 1 TC needs non-mocked ActionButtons approach. | Bug 1 regression TC cannot be in `TillReconciliation.test.tsx` (ActionButtons is fully mocked there). Needs dedicated ActionButtons test or integration approach. | Test strategy for Bug 1 must be resolved in plan |
| `Data / contracts` | Required | Bug 4: `addCashCount("reconcile", 0, 0, ...)` writes incorrect `difference` field. `addCashCount` signature verified: `(type, count, difference, amount, denomBreakdown, keycardCount)`. | Any downstream consumer reading `difference` from keycard reconcile records will currently see 0 — need to check if report consumers exist. | Check if EOD report or other audit consumer reads `difference` from reconcile records |
| `Performance / reliability` | Required | Bug 3: `recordKeycardTransfer` is async Firebase write with no error boundary. Reordering to await-before-state-update impacts perceived latency. | UX lag if Firebase write takes >200ms. Plan must accept the latency or implement loading state. | N/A for planning decision; flag as implementation note |
| `Rollout / rollback` | N/A | All five fixes are pure React hook/component code changes with no schema migration, no Firebase structure change, and no feature flag needed. Rollback = revert commit. | None | None |

## Risks

1. **Bug 1 scope is confirmed wider than a single file**: `ActionButtons` prop interface (lines 14–30) does not include `setIsEditMode` or `setIsDeleteMode`. Fix confirmed to require changes to two files: (a) `ActionButtons.tsx` — extend `ActionButtonsProps` interface, add destructuring, add menu items calling `setIsEditMode(true)` / `setIsDeleteMode(true)`; (b) `TillReconciliation.tsx` — pass the two setters from `useTillReconciliationUI` down to `<ActionButtons>`. Both setters are already returned by the hook; wiring is lightweight. Additionally, `TillReconciliation.test.tsx` mocks `ActionButtons` entirely — regression TCs for Bug 1 must target ActionButtons directly (its own test or a new test file) rather than the TillReconciliation integration test.
2. **Bug 3 UX trade-off**: Moving `updateSafeKeycards` to after `await recordKeycardTransfer(...)` removes the optimistic update. If the Firebase write takes >200ms, the keycard count UI will lag. Plan must decide: (a) remove optimistic update entirely (safest, correct), or (b) keep optimistic update + rollback on error (more complex, better UX). The simplest correct fix is (a).
3. **Bug 4 semantic field reuse**: `difference` is a cash-typed field in `addCashCount`. For a keycard reconcile record, the fix puts `diff` (keycard count difference) in this field. This is semantically repurposing a cash field. Acceptable since the schema has no separate keycard-difference field and `addKeycardDiscrepancy` records the keycard discrepancy separately. If audit reports filter `reconcile` records for cash difference, they must be updated to treat `difference=0` for cash-only reconciles and `difference≠0` for keycard-only reconciles. Investigate if any report consumers depend on `difference` from reconcile-type records.
4. **Test mocking depth (Bug 3)**: `useTillReconciliationLogic` currently has limited test coverage. A new test requires mocking `useKeycardTransfer`, `useSafeKeycards`, and the Firebase layer. Must follow the established pattern in `useTillShifts.test.ts`.

## Open Questions

None — all five defects are confirmed with direct evidence and each fix is clearly scoped.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bug 1: ActionButtons.tsx source read | Yes | None | No |
| Bug 1: grep for setIsEditMode(true)/setIsDeleteMode(true) callers | Yes | None — no callers exist anywhere | No |
| Bug 2: confirmFloat success path | Yes | None | No |
| Bug 2: confirmExchange pattern comparison | Yes | None | No |
| Bug 3: async ordering and .catch gap | Yes | None | No |
| Bug 3: useKeycardTransfer async contract | Yes | None | No |
| Bug 4: addCashCount line 622 | Yes | None | No |
| Bug 4: diff computed at line 618 | Yes | None | No |
| Bug 5: confirmShiftClose early returns | Yes | None | No |
| Bug 5: setPendingOverride in success path | Yes | None | No |
| Test landscape coverage | Yes | None | No |

## Scope Signal

Signal: right-sized
Rationale: Five confirmed point defects, each with a single-file fix and a clear regression TC. No architectural decisions, no cross-system boundaries, no ambiguous scope. All fixes are bounded to three source files and their existing test files.

## Analysis Readiness

**Status: Ready-for-analysis**

All five defects are confirmed from direct primary source evidence. No open questions remain. Engineering coverage matrix is complete. Test landscape is fully mapped. Risks are identified with confirmed scope (Bug 1 requires two-file change; Bug 3 has a UX trade-off requiring a planning decision; Bug 4 has a semantic field reuse to verify in consumers).

The analysis stage should focus on: (a) confirming whether the 5 fixes should be one plan or split into task groups by hook file, (b) resolving the Bug 3 UX trade-off (optimistic-update removal vs. rollback pattern), and (c) checking whether any audit report consumers depend on `difference=0` in keycard reconcile records.

## Evidence Gap Review

### Gaps Addressed
- All five bugs verified directly from source code — no inference required.
- `useKeycardTransfer.ts` read to confirm async contract for Bug 3.
- Test landscape fully mapped from glob results.

### Confidence Adjustments
None needed — all five defects are confirmed High confidence.

### Remaining Assumptions
- `addCashCount` parameter order is stable (third argument is `difference`). This is consistent with the mock pattern in `useTillShifts.test.ts` and the comment at line 618.
- `ActionButtons` will accept `setIsEditMode`/`setIsDeleteMode` as new props without requiring changes to `TillReconciliation.tsx`'s composite wiring (which already has access to both via `useTillReconciliationUI`).
