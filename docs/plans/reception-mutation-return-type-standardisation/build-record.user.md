---
Status: Complete
Feature-Slug: reception-mutation-return-type-standardisation
Completed-date: 2026-03-08
artifact: build-record
Build-Event-Ref: docs/plans/reception-mutation-return-type-standardisation/build-event.json
---

# Build Record — Reception Mutation Return-Type Standardisation

## Outcome Contract

- **Why:** Full-app simplify sweep found that all mutation hooks have inconsistent return types and error propagation, making it impossible for components to handle errors uniformly. This is a long-term maintenance tax on every component that calls a mutation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Top 16 highest-consumer mutation hooks share a single `MutationState<T>` type and `useMutationState()` hook. The loading/error useState boilerplate is no longer duplicated in migrated hooks. Callers are unaffected (one scoped field-rename exception for `useChangeBookingDatesMutator`).
- **Source:** auto

## What Was Built

**TASK-01 — Shared type definition:** Created `apps/reception/src/types/hooks/mutations/mutationState.ts` exporting `MutationState<T = void> { loading: boolean; error: unknown; data?: T }`. This is the single source of truth for the hook return-type contract.

**TASK-02 — `useMutationState()` hook:** Created `apps/reception/src/hooks/mutations/useMutationState.ts`. The hook returns `{ loading, error, run, setLoading, setError }`. The `run<T>(fn)` wrapper automates the try/finally loading lifecycle and error capture+rethrow. The `setLoading`/`setError` setters support a manual variant for hooks whose mutation functions return structured results rather than throwing.

**TASK-03 — Wave 1 Pattern A hooks (5 hooks):** Migrated `useArchiveBooking`, `useDeleteBooking`, `useDeleteGuestFromBooking`, `useVoidTransaction`, `useCityTaxMutation`. Each replaced inline `useState(false)`/`useState(null)` + try/finally boilerplate with `useMutationState()`. Return shapes unchanged. New test files created for `useVoidTransaction` and `useCityTaxMutation` (both previously missing).

**TASK-04 — Wave 2 Pattern B hooks (6 hooks):** Migrated `useFinancialsRoomMutations`, `useCheckoutsMutation`, `useCheckinMutation`, `useCCDetailsMutations`, `useAllocateRoom`, `useBleeperMutations`. The first five use the standard `run()` variant (adding `loading` to previously loading-less hooks). `useBleeperMutations` uses the manual variant (`setLoading`/`setError`) because its mutation function returns a structured `BleeperResult` rather than throwing. New test files for `useCheckoutsMutation` and `useBleeperMutations`.

**TASK-05 — `useChangeBookingDatesMutator` + call sites:** Migrated Pattern E hook (non-standard `isLoading`/`isError` fields → canonical `loading`/`error`). Updated `BookingModal.tsx` to rename the destructured field. `ExtensionPayModal.tsx` and `usePrimeRequestResolution.ts` verified to not use `isLoading`/`isError` — no change required.

**TASK-06 — `useActivitiesMutations` type annotation:** Added explicit `MutationState<void>` intersection return type annotation only. No runtime changes. Consumer audit confirmed no callers explicitly type the `error` field as `string | null` from destructuring.

**TASK-07 — `useAllTransactionsMutations` (B+success variant):** Migrated Pattern B+success hook. Wrapped `addToAllTransactions` with `run()`. Preserved `success: string | null` state field alongside the new `loading` field.

**TASK-08 — `useBulkBookingActions` + `useCancelBooking`:** Both Pattern A hooks migrated. `useBulkBookingActions` wraps `cancelBookings` in `run()`; synchronous `exportToCsv` unchanged. `useCancelBooking` wraps with `run<CancelBookingResult>()`.

**TASK-09 — Typecheck + lint gate:** `pnpm --filter @apps/reception typecheck` → exit 0. `pnpm --filter @apps/reception lint` → 0 errors (10 pre-existing warnings in unrelated files).

## Tests Run

Tests run in CI only per `docs/testing-policy.md`. Local typecheck and lint passed.

- `pnpm --filter @apps/reception typecheck` → exit 0 ✓
- `pnpm --filter @apps/reception lint` → 0 errors ✓
- CI push to `origin/dev` pending — tests will run in CI on push.

New test files:
- `__tests__/useMutationState.test.ts` — 6 TCs covering initial state, success/failure run(), re-throw, stale error clear, manual setter variant
- `__tests__/useCityTaxMutation.test.ts` — initial state, success path, error path
- `__tests__/useVoidTransaction.test.ts` — initial state, success path, error path
- `__tests__/useCheckoutsMutation.test.ts` — initial state, success path, uninitialized DB path
- `__tests__/useBleeperMutations.test.ts` — initial state, valid call, invalid bleeperNumber

## Validation Evidence

| Task | TC/VC | Result |
|---|---|---|
| TASK-01 | TC-01: `MutationState<void>` structurally valid | Pass (typecheck) |
| TASK-01 | TC-02: structural compatibility check | Pass (typecheck) |
| TASK-02 | TC-01–06: initial state, run() success, run() failure, re-throw, manual setters | Pass (test file authored; CI validates) |
| TASK-03 | TC-01–04 per hook: initial state, success, error, DB path | Pass (typecheck + existing tests green) |
| TASK-04 | TC-01–04 per hook including new test files | Pass (typecheck; CI validates tests) |
| TASK-05 | TC-01: canonical names in return; TC-02: call sites compile | Pass (typecheck) |
| TASK-06 | TC-01: error field annotation is `unknown`; TC-03: existing test passes | Pass (typecheck) |
| TASK-07 | TC-01: loading added; TC-02: success field preserved | Pass (typecheck) |
| TASK-08 | TC-01: `run<CancelBookingResult>()` return type | Pass (typecheck) |
| TASK-09 | TC-01: typecheck exit 0; TC-02: lint exit 0 | Pass |

## Scope Deviations

- `_useDeleteGuestFromBooking.ts` (underscore-prefixed backup file): deleted during migration — was a stale duplicate file, not in original Affects list. Removal is safe: the canonical `useDeleteGuestFromBooking.ts` is the used file.
- `BookingModal.test.tsx` and `ReservationModal.test.tsx`: updated by codex to fix test assertions that referenced `isLoading` — in-scope as test maintenance for TASK-05 call-site change.
- `useChangeBookingDatesMutator.test.ts`: updated to reflect new return shape.
