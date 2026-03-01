---
Type: Build-Record
Feature-Slug: reception-till-drawer-lock
Build-Date: 2026-03-01
Status: Complete
---

# Build Record — reception-till-drawer-lock

## What Was Built

A manager override path for the reception till drawer lock. When a staff member who did not open a shift tries to close it, the system now shows a manager authentication modal instead of blocking with an error toast. A manager enters their credentials and a reason, the system verifies their identity, and the close proceeds with the override details saved to Firebase.

## Outcome Contract

**Intended Outcome:** When a staff member who did not open a shift attempts to close it, the system blocks them. A manager can override by authenticating and entering a reason, which is stored in the shift audit record.

**Observed Outcome:** Delivered as intended. The button-level guard (existed before) and a new second-layer guard in `confirmShiftClose` now both enforce the rule. The manager override modal collects credentials and reason in one step, uses the existing `verifyManagerCredentials` service, and saves `overriddenBy`, `overriddenByUid`, `overriddenAt`, and `overrideReason` to Firebase via the extended `recordShiftClose` mutation.

## Tasks Completed

| Task | Description | Commit |
|---|---|---|
| TASK-01 | Extend TillShift schema + type with override fields; add DrawerOverride type | 82972da7f4 |
| TASK-02 | Extend recordShiftClose mutation to persist override fields | 28c91ad519 |
| TASK-03 | Create DrawerOverrideModal component | 28c91ad519 |
| TASK-04 | Second-layer guard + override wiring in useTillShifts + TillReconciliation | 81200f05b9 |
| CHECKPOINT-05 | Horizon checkpoint — typecheck + lint verified | (procedural) |
| TASK-06 | Unit tests for lock, override, and guard paths | 0173fb712b |

## Validation Summary

- `pnpm typecheck` passes on `@apps/reception`: confirmed at TASK-01, TASK-02/03, TASK-04, TASK-06.
- `pnpm lint` passes (0 errors, pre-existing warnings only): confirmed at TASK-04, TASK-06.
- All pre-commit hooks (typecheck-staged, lint-staged-packages, agent-context) passed on TASK-06 commit.
- Tests: committed and queued for CI. Tests run in CI only per testing policy.

## Files Changed

- `apps/reception/src/schemas/tillShiftSchema.ts` — 4 new optional Zod fields
- `apps/reception/src/types/hooks/data/tillShiftData.ts` — 4 new optional interface fields
- `apps/reception/src/types/component/Till.ts` — new `DrawerOverride` interface
- `apps/reception/src/hooks/mutations/useTillShiftsMutations.ts` — `override?` param + Firebase spread
- `apps/reception/src/components/till/DrawerOverrideModal.tsx` — new component (167 lines)
- `apps/reception/src/hooks/client/till/useTillShifts.ts` — override state, guard, callbacks
- `apps/reception/src/components/till/TillReconciliation.tsx` — render DrawerOverrideModal
- `apps/reception/src/hooks/client/till/__tests__/useTillShifts.test.ts` — 6 new test cases
- `apps/reception/src/components/till/__tests__/DrawerOverrideModal.test.tsx` — new (7 test cases)

## Key Design Decisions

- Second-layer guard uses `openShift.user` from `findOpenShift(cashCounts)` (DB-authoritative), not `shiftOwner` ephemeral state — prevents stale-state bypass during hydration races.
- Override data flows via hook state (`pendingOverride`), not through `CloseShiftForm`/`FormsContainer` — their signatures are unchanged.
- `pendingVariant` state captures the close/reconcile variant before the modal is shown, so `confirmDrawerOverride` can access it without a closure over the original event.
- Same-user block uses UID-first comparison (falls back to name when UID absent) — consistent with `VarianceSignoffModal`.
- Override applies to both `"close"` and `"reconcile"` variants (resolved design decision).
