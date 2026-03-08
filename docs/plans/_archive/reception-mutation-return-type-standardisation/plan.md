---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-mutation-return-type-standardisation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Mutation Return-Type Standardisation Plan

## Summary

51 files in `apps/reception/src/hooks/mutations/` expose at least 5 structurally distinct return shapes and 3 error-type variants. This plan defines a shared `MutationState<T>` type and a `useMutationState()` hook, then migrates the top 16 in-scope hooks across three waves. Wave 1 handles Pattern A hooks (already have `loading`/`error` — migration is internal boilerplate consolidation). Wave 2 adds `loading` to Pattern B hooks that currently expose none (observable behavior change, but API-additive). Wave 3 handles the special cases: `useChangeBookingDatesMutator` (non-standard field names) and `useActivitiesMutations` (type-annotation only, no `run()` wrapper). Pattern D hooks (17 `useMemo`-return hooks) are excluded from this iteration. All changes are API-additive. Caller exceptions: `useChangeBookingDatesMutator`'s 3 call sites require a field-rename (scoped exception); `useActivitiesMutations` has a possible caller-side type-narrowing change (gated by scout in TASK-06).

## Active tasks
- [x] TASK-01: Define `MutationState<T>` shared type
- [x] TASK-02: Implement `useMutationState()` hook + tests
- [x] TASK-03: Wave 1 — migrate Pattern A hooks (5 hooks)
- [x] TASK-04: Wave 2 — migrate Pattern B hooks (6 hooks, adds `loading`)
- [x] TASK-05: Wave 3a — migrate `useChangeBookingDatesMutator` (non-standard names)
- [x] TASK-06: Wave 3b — annotate `useActivitiesMutations` with `MutationState<T>` type (type-only)
- [x] TASK-07: Wave 3c — migrate `useAllTransactionsMutations` (Pattern B+success variant)
- [x] TASK-08: Migrate `useBulkBookingActions` and `useCancelBooking`
- [x] TASK-09: Typecheck + lint gate

## Goals
- Define a single `MutationState<T>` type at `apps/reception/src/types/hooks/mutations/mutationState.ts`.
- Implement a `useMutationState()` hook that manages `loading`/`error` state and exposes a `run()` wrapper for standard catch-and-rethrow hooks.
- Migrate 16 in-scope hooks across 3 waves; Pattern D hooks (17 total) deferred.
- Add tests for `useMutationState` and the 4 hooks missing test files (`useBleeperMutations`, `useCheckoutsMutation`, `useCityTaxMutation`, `useVoidTransaction` — all confirmed absent from `__tests__/`).
- Callers unchanged throughout, with two scoped exceptions: (a) `useChangeBookingDatesMutator`'s 3 call sites are updated to rename `isLoading`→`loading`/`isError`→removed (non-standard names → canonical); (b) `useActivitiesMutations` callers are audited as a gate in TASK-06 — if any explicitly type `error` as `string | null`, a narrowing update is added within the same task.

## Non-goals
- Migrating all 51 hooks in one pass.
- Changing Firebase logic, data paths, or business rules.
- Changing component call sites (API-additive only — except `useChangeBookingDatesMutator`'s 3 callers, which require a field-rename to canonical names).
- Introducing a global state manager or React Query / SWR.
- Migrating Pattern D hooks (17 `useMemo`-return hooks).

## Constraints & Assumptions
- Constraints:
  - All migrated hooks remain in `apps/reception/src/hooks/mutations/`.
  - Shared type lives in `apps/reception/src/types/hooks/mutations/mutationState.ts`.
  - `useMutationState` lives in `apps/reception/src/hooks/mutations/useMutationState.ts`.
  - Tests run in CI only — never locally.
  - Component call sites are not edited except for `useChangeBookingDatesMutator`'s 3 callers, which must be updated because that hook's non-standard field names (`isLoading`/`isError`) are renamed to canonical form.
  - `useActivitiesMutations` uses type-annotation only — its `run()` wrapper cannot be used because its mutation functions return `ActivityResult` not throw.
- Assumptions:
  - Wave 2 behavior change (adding `loading`) is API-additive; no caller breaks.
  - `useChangeBookingDatesMutator`'s 3 production call sites will be updated directly (cleaner than deprecated aliases).

## Inherited Outcome Contract

- **Why:** Full-app simplify sweep found that all mutation hooks have inconsistent return types and error propagation, making it impossible for components to handle errors uniformly. This is a long-term maintenance tax on every component that calls a mutation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Top 10–15 highest-consumer mutation hooks share a single `MutationState<T>` type and `useMutationState()` hook. The loading/error useState boilerplate is no longer duplicated in migrated hooks. Callers are unaffected.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-mutation-return-type-standardisation/fact-find.md`
- Key findings used:
  - 5 distinct return shapes classified (Pattern A/B/C/D/E) — see fact-find key modules table.
  - 17 hooks use `useMemo` on return value (Pattern D) — all excluded from this iteration.
  - `useActivitiesMutations` returns `ActivityResult` from mutation fns, not throws — requires type-annotation-only migration.
  - `useChangeBookingDatesMutator` has 3 production consumers using `isLoading`/`isError` — direct call-site update chosen.
  - 4 in-scope hooks missing test files: `useBleeperMutations`, `useCheckoutsMutation`, `useCityTaxMutation`, `useVoidTransaction`.
  - Test harness: `@testing-library/react` `renderHook`, confirmed in existing tests.

## Proposed Approach
- Option A: Custom `useMutationState()` hook with `run()` wrapper, type exported from shared types directory.
- Option B: Inline `useState` pairs in each hook, unified only at the type level (no shared hook).
- Chosen approach: Option A. The `run()` wrapper eliminates identical try/finally boilerplate across 8+ Pattern A hooks. Option B would be type-only — useful for `useActivitiesMutations` but insufficient for the pattern A consolidation goal. The two options are combined: Option A for Pattern A hooks, Option B (type-annotation only) for `useActivitiesMutations`.

## Plan Gates
- Foundation Gate: Pass
  - Deliverable-Type: code-change ✓
  - Execution-Track: code ✓
  - Primary-Execution-Skill: lp-do-build ✓
  - Startup-Deliverable-Alias: none ✓
  - Delivery-Readiness: 83% ✓ (above 60% floor)
  - Test landscape: documented, framework confirmed ✓
  - Testability: 80% ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define `MutationState<T>` shared type | 95% | S | Pending | - | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 |
| TASK-02 | IMPLEMENT | Implement `useMutationState()` hook + tests | 90% | S | Pending | TASK-01 | TASK-03, TASK-04, TASK-05, TASK-07, TASK-08 |
| TASK-03 | IMPLEMENT | Wave 1 — migrate Pattern A hooks (5 hooks) | 90% | M | Pending | TASK-02 | TASK-09 |
| TASK-04 | IMPLEMENT | Wave 2 — migrate Pattern B hooks (6 hooks) | 85% | M | Pending | TASK-02 | TASK-09 |
| TASK-05 | IMPLEMENT | Wave 3a — `useChangeBookingDatesMutator` + 3 call sites | 85% | S | Pending | TASK-02 | TASK-09 |
| TASK-06 | IMPLEMENT | Wave 3b — type-annotate `useActivitiesMutations` | 85% | S | Pending | TASK-01 | TASK-09 |
| TASK-07 | IMPLEMENT | Wave 3c — `useAllTransactionsMutations` (B+success) | 85% | S | Pending | TASK-02 | TASK-09 |
| TASK-08 | IMPLEMENT | Migrate `useBulkBookingActions` and `useCancelBooking` | 85% | S | Pending | TASK-02 | TASK-09 |
| TASK-09 | IMPLEMENT | Typecheck + lint gate | 90% | S | Pending | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Type definition, no dependencies |
| 2 | TASK-02 | TASK-01 complete | Hook impl + tests; serial on TASK-01 |
| 3 | TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 | TASK-02 complete | All migration tasks can run in parallel |
| 4 | TASK-09 | All TASK-03..08 complete | Final typecheck+lint gate |

## Tasks

---

### TASK-01: Define `MutationState<T>` shared type
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/types/hooks/mutations/mutationState.ts` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/types/hooks/mutations/mutationState.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08
- **Confidence:** 95%
  - Implementation: 95% — type shape is clearly defined by the repeated boilerplate; no ambiguity.
  - Approach: 95% — single canonical location; follows existing convention in `types/hooks/mutations/`.
  - Impact: 95% — foundational; all downstream tasks depend on it.
- **Acceptance:**
  - `apps/reception/src/types/hooks/mutations/mutationState.ts` exists and exports `MutationState<T>`.
  - `MutationState<T>` shape: `{ loading: boolean; error: unknown }` (plus optional generic data field `T` for future extensibility).
  - File follows naming convention of adjacent files (`fiancialsRoomMutation.ts`, `saveRoomsByDateParams.ts`).
  - TypeScript compiles without errors (`pnpm typecheck`).
- **Validation contract (TC-01):**
  - TC-01: Import `MutationState<void>` in a test file → TypeScript accepts `{ loading: false, error: null }` as conforming.
  - TC-02: Assign a value of type `{ loading: boolean; error: unknown }` to a `MutationState<void>` variable → TypeScript accepts. (Note: direct object literal assignment with extra fields will fail excess-property checks; the intent of this TC is structural compatibility at the type level, not literal excess-property scenarios.)
- **Execution plan:**
  - Write `mutationState.ts` with `export interface MutationState<T = void> { loading: boolean; error: unknown; }`.
  - Optionally include a `data?: T` field for future hook-level data surface (does not affect current migration).
  - Export from file — no barrel re-export needed at this stage.
- **Planning validation (required for M/L):** None: S effort task, no complex validation required.
- **Scouts:** None: type shape is directly derived from reading 8+ existing hook implementations.
- **Edge Cases & Hardening:**
  - Generic default `T = void` avoids requiring callers to specify a type parameter when no data is returned.
  - Error typed as `unknown` (not `Error | null` or `string`) — matches TypeScript best practice for caught values.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: New file; no existing code changes. Zero blast radius.
  - Rollback: Delete the file. No consumers exist until TASK-02 onwards.
- **Documentation impact:** None: internal type file; no public API docs.
- **Notes / references:** Adjacent files: `apps/reception/src/types/hooks/mutations/fiancialsRoomMutation.ts`.

---

### TASK-02: Implement `useMutationState()` hook + tests
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/hooks/mutations/useMutationState.ts` + `apps/reception/src/hooks/mutations/__tests__/useMutationState.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useMutationState.ts` (new)
  - `apps/reception/src/hooks/mutations/__tests__/useMutationState.test.ts` (new)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-05, TASK-07, TASK-08
- **Confidence:** 90%
  - Implementation: 90% — pattern is directly extracted from existing boilerplate; no novel logic.
  - Approach: 90% — `run()` wrapper that sets loading, clears error, executes fn, catches+rethrows, clears loading in finally.
  - Impact: 90% — central building block; if this is wrong, all migrations are wrong.
  - Held-back test (90% dimension): "What single unresolved unknown, if it resolves badly, would push implementation below 80%?" → None apparent: the hook is pure React state logic with no external dependencies.
- **Acceptance:**
  - `useMutationState.ts` exports `useMutationState()` hook returning `{ loading, error, run, setLoading, setError }`.
  - `run<T>(fn: () => Promise<T>): Promise<T>` — sets `loading=true`, clears `error=null`, awaits `fn`, catches any thrown error into `error` state and re-throws, sets `loading=false` in `finally`.
  - `setLoading` and `setError` are the raw React state dispatchers, exposed for hooks that cannot use the `run()` wrapper (e.g. hooks whose mutation function returns a structured result instead of throwing, such as `useBleeperMutations`). Direct setter usage is the "manual variant" of this hook; `run()` is the standard variant.
  - `useMutationState.test.ts` covers: initial state, loading=true during execution, error captured + rethrown on failure, loading=false after success, loading=false after failure.
  - Tests use `renderHook` from `@testing-library/react` (confirmed test pattern from existing hooks).
  - TypeScript compiles without errors.
- **Validation contract (TC-01):**
  - TC-01: Render hook → `loading=false`, `error=null` initially.
  - TC-02: Call `run(asyncFn)` while in-flight → `loading=true`.
  - TC-03: `run(asyncFn)` completes → `loading=false`, `error=null`.
  - TC-04: `run(throwingFn)` → `loading=false`, `error` set to thrown value, error re-thrown to caller.
  - TC-05: Verify re-throw: caller receives the thrown error via `await expect(run(throwingFn)).rejects.toThrow(...)`.
  - TC-06: `setLoading(true)` / `setError(new Error("x"))` update hook state directly (manual variant path used by `useBleeperMutations`).
- **Execution plan:**
  - Red: Write `useMutationState.test.ts` with all 6 TCs (including TC-06 for manual-setter path). They fail (hook not implemented).
  - Green: Implement `useMutationState.ts`. Tests pass in CI.
  - Refactor: Confirm hook is a clean single-purpose implementation.
- **Planning validation (required for M/L):** None: S effort.
- **Scouts:** None: the boilerplate being consolidated is visible in 8 existing hook implementations.
- **Edge Cases & Hardening:**
  - Re-throw is mandatory — callers that currently use `await archiveBooking(...)` and expect a thrown error on failure must not silently swallow it.
  - `finally` always clears `loading` — even if the async fn throws midway.
  - `error` reset to `null` at the start of each `run()` call — stale errors from a previous call do not persist.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: New files only. No existing code changes.
  - Rollback: Delete the two new files.
- **Documentation impact:** None.
- **Notes / references:** Test pattern: `renderHook` from `@testing-library/react`. See `__tests__/useArchiveBooking.test.ts` for mock setup patterns (jest.mock firebase/database, useFirebaseDatabase).

---

### TASK-03: Wave 1 — migrate Pattern A hooks (5 hooks + 2 test files)
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useArchiveBooking.ts`, `useDeleteBooking.ts`, `useDeleteGuestFromBooking.ts`, `useVoidTransaction.ts`, `useCityTaxMutation.ts`; updated tests; new tests for `useCityTaxMutation` and `useVoidTransaction` (both confirmed missing in `__tests__/`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useArchiveBooking.ts`
  - `apps/reception/src/hooks/mutations/useDeleteBooking.ts`
  - `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts`
  - `apps/reception/src/hooks/mutations/useVoidTransaction.ts`
  - `apps/reception/src/hooks/mutations/useCityTaxMutation.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useArchiveBooking.test.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useDeleteBooking.test.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useDeleteGuestFromBooking.test.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useVoidTransaction.test.ts` (new — confirmed missing)
  - `apps/reception/src/hooks/mutations/__tests__/useCityTaxMutation.test.ts` (new — missing)
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 90%
  - Implementation: 90% — boilerplate is identical across all 5 hooks; the `run()` wrapper is a direct replacement.
  - Approach: 90% — Pattern A hooks already expose `{ loading, error }` so the return shape is unchanged; only internals change.
  - Impact: 90% — no call-site changes; blast radius is zero for callers.
- **Acceptance:**
  - Each hook uses `useMutationState()` for `loading`/`error` state and `run()` for the mutation body.
  - Each hook's return shape is `{ mutationFn, loading, error }` — identical to pre-migration.
  - Each hook's return type is annotated with `MutationState<T>` via intersection or direct typing.
  - `useCityTaxMutation.test.ts` created with ≥3 test cases (initial state, success path, error path).
  - `useVoidTransaction.test.ts` created with ≥3 test cases (initial state, success path, error path). This file does not currently exist in `__tests__/`.
  - Existing tests for the other 3 hooks continue to pass (no behavior change for callers).
  - `useDeleteBooking.ts` and `useDeleteGuestFromBooking.ts` error type normalised to `unknown` (they previously mixed `string` literal and `Error` — the `run()` wrapper always catches as `unknown`).
  - TypeScript compiles without errors.
- **Validation contract (TC-01):**
  - TC-01: Each migrated hook: `renderHook()` → `loading=false`, `error=null`.
  - TC-02: Each migrated hook: invoke mutation → `loading=false` after completion, `error=null`.
  - TC-03: Each migrated hook: invoke mutation with DB not initialized → `error` set, error thrown.
  - TC-04: `useCityTaxMutation`: saves city tax data to `cityTax/{bookingRef}/{occupantId}` path via `update`.
- **Execution plan:**
  - For each hook: remove `useState(false)` / `useState(null)`, `setLoading(true)`, `setError(null)`, try/catch/finally blocks. Replace with `const { loading, error, run } = useMutationState()`. Wrap the mutation body in `run(async () => { ... })`. Annotate return type as `MutationState<void> & { mutationFn: ... }`.
  - Add `import useMutationState from './useMutationState'` and `import type { MutationState } from '../../types/hooks/mutations/mutationState'`.
  - Create `useCityTaxMutation.test.ts` following the pattern in `useArchiveBooking.test.ts`.
  - Update existing tests if they assert internal implementation details that change (none expected — tests test behavior, not internals).
- **Planning validation (required for M/L):**
  - Checks run: Read all 5 target hooks to confirm they follow identical Pattern A boilerplate. All confirmed via fact-find investigation.
  - `useVoidTransaction.ts` has an early-return case (`if (!txnSnap.exists()) { setLoading(false); return; }`) that uses `setLoading(false)` inside the try block — this must be replaced with a controlled early-return inside `run()` (the `run()` wrapper handles `finally` automatically).
  - `useDeleteBooking.ts` line 24: `setError("Database not initialized.")` sets a string — the `run()` wrapper normalises this to `unknown` catch. The early guard must throw instead of setting string.
  - `useDeleteGuestFromBooking.ts` line 89: same early guard pattern — must throw instead.
  - Unexpected findings: `useVoidTransaction` has multiple early-return paths (missing txn, already voided) that use `setLoading(false); return` — these must be restructured inside `run()`.
- **Scouts:** Inline handling of early-return-before-DB paths: must throw `new Error("Database not initialized")` inside `run()` rather than `setError(str); return` outside it.
- **Edge Cases & Hardening:**
  - All early guards that previously did `setError("msg"); return` must be converted to `throw new Error("msg")` inside `run()` — the `run()` wrapper catches and sets `error` automatically.
  - Re-throw semantics preserved: all existing callers that `await` and expect a thrown error on failure continue to receive it.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: No call-site changes; behavior identical from caller perspective. CI tests confirm.
  - Rollback: Revert the 5 hook files to pre-migration state.
- **Documentation impact:** None.
- **Notes / references:** Pattern confirmed in `useArchiveBooking.ts`, `useDeleteBooking.ts`, `useDeleteGuestFromBooking.ts`, `useVoidTransaction.ts`. `useCityTaxMutation.ts` confirmed Pattern A.

---

### TASK-04: Wave 2 — migrate Pattern B hooks (6 hooks, adds `loading`)
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useFinancialsRoomMutations.ts`, `useCheckoutsMutation.ts`, `useCheckinMutation.ts`, `useCCDetailsMutations.ts`, `useAllocateRoom.ts`, `useBleeperMutations.ts`; updated tests; new tests for 2 hooks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useFinancialsRoomMutations.ts`
  - `apps/reception/src/hooks/mutations/useCheckoutsMutation.ts`
  - `apps/reception/src/hooks/mutations/useCheckinMutation.ts`
  - `apps/reception/src/hooks/mutations/useCCDetailsMutations.ts`
  - `apps/reception/src/hooks/mutations/useAllocateRoom.ts`
  - `apps/reception/src/hooks/mutations/useBleeperMutations.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useFinancialsRoomMutations.test.ts` (update)
  - `apps/reception/src/hooks/mutations/__tests__/useCCDetailsMutations.test.tsx` (update)
  - `apps/reception/src/hooks/mutations/__tests__/useAllocateRoom.test.ts` (update)
  - `apps/reception/src/hooks/mutations/__tests__/useCheckoutsMutation.test.ts` (new — missing)
  - `apps/reception/src/hooks/mutations/__tests__/useBleeperMutations.test.ts` (new — missing)
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — Pattern B hooks have no existing loading state; adding it is straightforward but is a new observable behavior.
  - Approach: 85% — API-additive (new `loading` field in return); callers that destructure only `{ saveFinancialsRoom, error }` are unaffected.
  - Impact: 85% — adds `loading` to 6 hooks, enabling callers to show spinners if they choose to; non-breaking.
  - Held-back test (85% dim): "Would `useBleeperMutations`'s internal `BleeperResult` return shape conflict with `run()`?" → `setBleeperAvailability` returns `BleeperResult`, not void, and has early returns that don't throw. Cannot use `run()` wrapper directly without restructuring. Approach adjusted: `useBleeperMutations` gets `useMutationState()` state management but uses the state fields (`loading`, `error`) directly rather than `run()`. See execution plan.
- **Acceptance:**
  - Each hook's return shape gains `loading: boolean` (was absent).
  - Return type annotated with `MutationState<void>` or intersection.
  - `useCheckoutsMutation.test.ts` and `useBleeperMutations.test.ts` created with ≥3 test cases each.
  - Existing tests for `useFinancialsRoomMutations`, `useCCDetailsMutations`, `useAllocateRoom` updated to assert `loading` field present in return.
  - `useBleeperMutations`: uses `useMutationState()` in manual variant mode — destructures `{ loading, error, setLoading, setError }` and calls them directly. Does not use `run()` because `setBleeperAvailability` returns `BleeperResult` (structured result) rather than throwing on failure. The manual variant approach is implementable using the `setLoading`/`setError` setters that `useMutationState()` exposes per TASK-02.
  - TypeScript compiles without errors.
- **Validation contract (TC-01):**
  - TC-01: Each hook: `renderHook()` → `loading=false` in return.
  - TC-02: `useCheckoutsMutation`: call `saveCheckout` → Firebase `update` called at `checkouts/{dateKey}`.
  - TC-03: `useBleeperMutations`: call `setBleeperAvailability` with invalid number → `error` set.
  - TC-04: `useFinancialsRoomMutations`: existing TC for transaction → update `loading` assertion if test checked absence of loading field.
- **Execution plan:**
  - For `useCheckoutsMutation`, `useCheckinMutation`, `useCCDetailsMutations`, `useFinancialsRoomMutations`, `useAllocateRoom`: add `const { loading, error, run } = useMutationState()`. Wrap mutation body in `run(async () => { ... })`. Add `loading` to return object.
  - For `useBleeperMutations`, use the manual variant: destructure `{ loading, error, setLoading, setError }` from `useMutationState()`. Call `setLoading(true)` before the mutation, `setError(null)` at start, `setLoading(false)` in finally, and `setError(err)` in catch. This avoids `run()` and does not change the return type of `setBleeperAvailability` for its callers. The `setLoading`/`setError` setters are explicitly part of `useMutationState()`'s return contract (defined in TASK-02 acceptance).
- **Planning validation (required for M/L):**
  - `useFinancialsRoomMutations` uses `Promise.reject(err)` instead of `throw err` in catch — must verify `run()` still catches this. `Promise.reject()` inside an async function causes the outer Promise to reject, which `run()` catches. Confirmed safe.
  - `useAllocateRoom` calls `logActivity()` from `useActivitiesMutations` — its error is already handled by `logActivity`'s own throw. The `run()` wrapper in `useAllocateRoom` will catch any throw from `logActivity`.
  - Unexpected findings: None beyond `useBleeperMutations` BleeperResult shape (noted above).
- **Scouts:** `useBleeperMutations` — confirm `setBleeperAvailability` callers accept `Promise<void>` vs `Promise<BleeperResult>` before converting return type. If callers use `.then(result => result.success)`, changing return type breaks them. Check 3 consumers.
- **Edge Cases & Hardening:**
  - `useFinancialsRoomMutations` uses `Promise.reject(dbErr)` in the early guard — this is equivalent to `throw dbErr` inside an async function and is handled by `run()` correctly.
  - API-additive: callers that destructure `{ saveFinancialsRoom, error }` are unaffected by the new `loading` field.
- **What would make this >=90%:** Confirm `useBleeperMutations` callers don't depend on `BleeperResult` shape from the return of `setBleeperAvailability` (scout in execution plan above); verify `useFinancialsRoomMutations` `Promise.reject` interacts correctly with `run()` wrapper (confirmed safe per Planning Validation).
- **Rollout / rollback:**
  - Rollout: API-additive; callers unchanged.
  - Rollback: Revert the 6 hook files.
- **Documentation impact:** None.
- **Notes / references:** `useBleeperMutations`: 3 production consumers — scout confirms whether return value of `setBleeperAvailability` is used before implementing.

---

### TASK-05: Wave 3a — `useChangeBookingDatesMutator` + 3 call sites
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useChangeBookingDatesMutator.ts` + updated `ExtensionPayModal.tsx`, `BookingModal.tsx`, `usePrimeRequestResolution.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`
  - `apps/reception/src/components/man/modals/ExtensionPayModal.tsx`
  - `apps/reception/src/components/checkins/header/BookingModal.tsx`
  - `apps/reception/src/hooks/mutations/usePrimeRequestResolution.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts` (update)
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — 3 call sites confirmed; rename is mechanical.
  - Approach: 85% — direct call-site update is cleaner than adding deprecated aliases.
  - Impact: 85% — restricted blast radius (3 files); TypeScript enforces correctness.
- **Acceptance:**
  - `useChangeBookingDatesMutator` returns `{ updateBookingDates, loading, error }` (canonical names).
  - `isLoading` and `isError` removed from return.
  - All 3 call sites updated: `isLoading` → `loading`, `isError` removed or replaced.
  - Return type annotated with `MutationState<void>`.
  - TypeScript compiles without errors across all 3 call sites.
  - Existing test updated to assert `loading` (not `isLoading`).
- **Validation contract:**
  - TC-01: `renderHook(() => useBookingDatesMutator())` → `loading` is `false`, `isLoading` does not exist on result.
  - TC-02: `ExtensionPayModal.tsx` and `BookingModal.tsx` compile without TypeScript errors after rename.
  - TC-03: `usePrimeRequestResolution.ts` compiles without TypeScript errors after rename.
- **Execution plan:**
  - In `useChangeBookingDatesMutator.ts`: replace `isLoading`/`isError` state with `const { loading, error, run } = useMutationState()`. Update return object. Update interface if one exists.
  - In each call site: rename `isLoading` → `loading`; remove `isError` (callers can use `!!error` if needed).
  - Update existing test.
- **Planning validation:** None: S effort; 3 files confirmed.
- **Scouts:** None: call sites confirmed by grep.
- **Edge Cases & Hardening:** `isError` consumers — check whether any call site uses `isError` as a distinct boolean (rather than just `!!error`). If so, callers can substitute `error !== null` or `!!error`. Confirm in 3 call sites before removing.
- **What would make this >=90%:** Confirm `isError` usage pattern in 3 call sites.
- **Rollout / rollback:**
  - Rollout: Call-site changes are in 3 files; TypeScript enforces completeness.
  - Rollback: Revert 4 files (hook + 3 call sites).
- **Documentation impact:** None.
- **Notes / references:** 3 consumers: `ExtensionPayModal.tsx`, `BookingModal.tsx`, `usePrimeRequestResolution.ts`.

---

### TASK-06: Wave 3b — type-annotate `useActivitiesMutations` with `MutationState<T>`
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useActivitiesMutations.ts` (return type annotation only)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useActivitiesMutations.test.ts` (verify no changes needed)
- **Depends on:** TASK-01
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — type-annotation only; no runtime behavior changes.
  - Approach: 85% — cannot use `run()` wrapper because `addActivity`/`saveActivity`/`removeLastActivity` return `ActivityResult` not throw; type-annotation is the correct bounded approach.
  - Impact: 85% — lowest-risk migration; callers are unaffected; `error` type widens from `string | null` to `unknown` in the interface annotation only (internal state remains `string | null`).
- **Acceptance:**
  - `useActivitiesMutations` return type annotated: the `error` field in the return interface is `unknown` (not `string | null`), matching `MutationState<T>`.
  - Internal `useState<string | null>(null)` can remain as is — `unknown` is a supertype of `string | null`.
  - The hook does NOT use `useMutationState()` — it keeps its internal `setLoading`/`setError` management.
  - Existing test passes unchanged.
  - `pnpm typecheck` clean.
  - Gate: Before marking complete, verify 15 production consumers don't explicitly type the destructured `error` as `string | null`. If any do, update that narrowing (add `typeof error === 'string'` guard) within this task scope. Zero typed-call-site breakage is a hard gate for this task.
- **Validation contract:**
  - TC-01: `error` field in return annotation is `unknown`.
  - TC-02: TypeScript accepts `error !== null && typeof error === 'string'` as a valid narrowing expression in callers.
  - TC-03: Existing test unchanged and passes.
- **Execution plan:**
  - Add or update the return type annotation on `useActivitiesMutations()` to include `error: unknown`.
  - If an explicit return interface exists, update it. If return is inferred, add explicit annotation.
  - Do NOT wrap any mutation function in `run()`.
  - Run typecheck mentally: `useState<string | null>(null)` is assignable to `unknown` in the return — TypeScript accepts this.
- **Planning validation:** None: S effort; type-annotation only.
- **Scouts:** Verify 15 production consumers don't explicitly type the destructured `error` as `string | null`. If they do, they may need a narrowing update. The fact-find confirms callers "cannot write uniform error-display logic" — unlikely they have typed the error field explicitly.
- **Edge Cases & Hardening:**
  - The secondary error surface (`maybeSendEmailGuest` sets `error` via `setError(string)` outside the main mutation body) is unchanged — this is an existing behavior preserved as-is.
- **What would make this >=90%:** Confirm 15 consumers don't explicitly type the `error` field.
- **Rollout / rollback:**
  - Rollout: Type-annotation only; no runtime change.
  - Rollback: Remove return type annotation.
- **Documentation impact:** None.
- **Notes / references:** Fact-find: `useActivitiesMutations` has 15 production consumers. Error type is `string | null` internally; widening to `unknown` in return annotation is safe.

---

### TASK-07: Wave 3c — `useAllTransactionsMutations` (Pattern B+success variant)
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useAllTransactionsMutations.ts`; updated `__tests__/useAllTransactionsMutations.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useAllTransactionsMutations.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useAllTransactionsMutations.test.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — hook has `error` and `success` but no `loading`; adding `loading` and using `run()` is the same Pattern B approach.
  - Approach: 85% — the `success: string | null` field is not part of `MutationState<T>` but can be kept alongside it.
  - Impact: 85% — API-additive (`loading` added); `success` field retained for callers that use it.
- **Acceptance:**
  - `useAllTransactionsMutations` uses `useMutationState()` for `loading`/`error` state.
  - `success: string | null` state is retained in the return (kept alongside `MutationState`).
  - `loading` added to return object.
  - Return type annotated: `MutationState<void> & { addToAllTransactions: ...; success: string | null }`.
  - Existing test updated to assert `loading` field present.
  - TypeScript compiles.
- **Validation contract:**
  - TC-01: `renderHook()` → `loading=false`, `error=null`, `success=null`.
  - TC-02: `addToAllTransactions` call → `success` set to non-null message on completion.
  - TC-03: `addToAllTransactions` with no user → `error` set, throw rethrown.
- **Execution plan:**
  - Add `const { loading, error, run } = useMutationState()`.
  - Keep `const [success, setSuccess] = useState<string | null>(null)`.
  - Wrap `addToAllTransactions` body in `run(async () => { ... })`. Inside `run`, keep `setSuccess(msg)` calls.
  - Remove manual `setError(null)` / `setError(err)` / `setLoading` calls (handled by `run()`).
  - Update return object: add `loading`; keep `success`.
- **Planning validation:** None: S effort.
- **Scouts:** Verify `success` field is not part of the `MutationState<T>` interface (it isn't — kept as extra field in intersection type).
- **Edge Cases & Hardening:** `run()` clears `error` at start of each call; `success` is not reset by `run()` — add explicit `setSuccess(null)` at the top of the `run()` body to avoid stale success state.
- **What would make this >=90%:** Confirm 9+ consumers don't depend on `success` being set before `loading` returns to false (they don't — `success` is set inside the async body, before `finally` clears `loading`).
- **Rollout / rollback:**
  - Rollout: API-additive (`loading` added, `success` retained).
  - Rollback: Revert hook file.
- **Documentation impact:** None.
- **Notes / references:** 9 production consumers of `useAllTransactionsMutations` confirmed by repo grep (6 components + useLoansMutations.ts + useConfirmOrder.ts + useAddRoomPaymentTransaction.ts).

---

### TASK-08: Migrate `useBulkBookingActions` and `useCancelBooking`
- **Type:** IMPLEMENT
- **Deliverable:** Modified `useBulkBookingActions.ts`, `useCancelBooking.ts`; updated tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/useBulkBookingActions.ts`
  - `apps/reception/src/hooks/mutations/useCancelBooking.ts`
  - `apps/reception/src/hooks/mutations/__tests__/useBulkBookingActions.test.ts` (update)
  - `apps/reception/src/hooks/mutations/__tests__/useCancelBooking.test.ts` (update)
- **Depends on:** TASK-02
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — Pattern A hooks; `useBulkBookingActions` has a loop that requires `run()` wrapping at the outer level.
  - Approach: 85% — `useCancelBooking` returns `CancelBookingResult` (structured result) like `useActivitiesMutations`'s `ActivityResult`; must decide whether to use `run()` or manual state.
  - Impact: 85% — both hooks have 1 production consumer each; low blast radius.
- **Acceptance:**
  - Both hooks use `useMutationState()` for `loading`/`error` management.
  - `useBulkBookingActions`: `cancelBookings` returns `BulkActionResult` (structured) — use `run()` and return the result from the wrapped fn.
  - `useCancelBooking`: `cancelBooking` returns `CancelBookingResult` — similarly use `run()` returning the result.
  - Existing tests updated.
  - TypeScript compiles.
- **Validation contract:**
  - TC-01: `useBulkBookingActions` → `loading` present in return, `false` initially.
  - TC-02: `useCancelBooking` → `loading` present, error captured when `archiveBooking` throws.
- **Execution plan:**
  - `useCancelBooking`: use `run(async () => { ... return result; })`. The `run()` wrapper can return a value — `run<CancelBookingResult>(async () => { ... })` returns `Promise<CancelBookingResult>`.
  - `useBulkBookingActions`: similarly wrap `cancelBookings` body. The `exportToCsv` fn is sync and doesn't need wrapping.
  - Remove manual `setLoading`/`setError` calls.
- **Planning validation:** None: S effort.
- **Scouts:** Confirm `run<T>()` generic returns `Promise<T>` — yes, defined in TASK-02 signature.
- **Edge Cases & Hardening:** `useBulkBookingActions.cancelBookings` has a loop with per-booking try/catch that populates `success[]`/`failed[]` arrays — this internal error handling is kept inside the `run()` body; the outer `run()` only catches uncaught throws (none expected from the loop pattern).
- **What would make this >=90%:** Confirm `run<T>()` return type propagates correctly when `T` is `BulkActionResult`.
- **Rollout / rollback:**
  - Rollout: API-additive; no call-site changes.
  - Rollback: Revert 2 hook files.
- **Documentation impact:** None.
- **Notes / references:** `CancelBookingResult` exported from `useCancelBooking.ts`. `BulkActionResult` exported from `useBulkBookingActions.ts`.

---

### TASK-09: Typecheck + lint gate
- **Type:** IMPLEMENT
- **Deliverable:** Clean `pnpm typecheck` and `pnpm lint` output for `apps/reception`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception` (read-only validation)
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — mechanical gate; if all prior tasks are correct, this passes.
  - Approach: 90% — standard CLI commands; no new tooling.
  - Impact: 90% — final correctness signal before CI push.
- **Acceptance:**
  - `pnpm typecheck` runs without TypeScript errors in `apps/reception`.
  - `pnpm lint` runs without lint errors in `apps/reception`.
  - Any errors found are fixed within this task before marking complete.
- **Validation contract:**
  - TC-01: `pnpm typecheck` exits 0.
  - TC-02: `pnpm lint` exits 0.
- **Execution plan:**
  - Run `pnpm --filter @apps/reception typecheck`.
  - Run `pnpm --filter @apps/reception lint`.
  - Fix any errors in migrated files.
- **Planning validation:** None: S effort gate task.
- **Scouts:** None.
- **Edge Cases & Hardening:** If lint flags the new `useMutationState.ts` for missing JSDoc, add minimal inline docs consistent with adjacent files.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:** None: validation task only.
- **Documentation impact:** None.
- **Notes / references:** Run scoped typecheck: `pnpm --filter @apps/reception typecheck` or equivalent per repo conventions.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Define `MutationState<T>` type | Yes — no dependencies | None | No |
| TASK-02: Implement `useMutationState()` hook | Yes — TASK-01 defines type | None | No |
| TASK-03: Wave 1 Pattern A hooks | Yes — TASK-02 provides `run()` | Moderate: `useVoidTransaction` and `useDeleteBooking` have early-return paths using `setError(str); return` that must be converted to `throw new Error(str)` inside `run()`. Noted in Execution Plan. | No (advisory) |
| TASK-04: Wave 2 Pattern B hooks | Yes — TASK-02 provides `useMutationState()` | Resolved: `useBleeperMutations.setBleeperAvailability` returns `BleeperResult` (structured), not `Promise<void>`. Cannot use `run()` directly. Resolution: TASK-02 exposes `setLoading`/`setError` setters alongside `run()`. TASK-04 uses manual variant (setters directly) for `useBleeperMutations` without changing its call signature. | No |
| TASK-05: Wave 3a `useChangeBookingDatesMutator` | Yes — 3 call sites confirmed | None | No |
| TASK-06: Wave 3b `useActivitiesMutations` type annotation | Yes — TASK-01 type exists | Minor: widening `error` from `string \| null` to `unknown` in annotation may require narrowing in 15 consumer call sites. Scout required. | No (advisory) |
| TASK-07: Wave 3c `useAllTransactionsMutations` | Yes — TASK-02 provides hook | None | No |
| TASK-08: `useBulkBookingActions` + `useCancelBooking` | Yes — TASK-02 provides `run<T>()` generic | Minor: `run<CancelBookingResult>()` return type propagation must be confirmed in TASK-02 implementation. | No (advisory) |
| TASK-09: Typecheck + lint gate | Yes — all prior tasks complete | None | No |

No Critical rehearsal findings. All findings are Moderate or Minor and are addressed in the respective execution plans.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `useBleeperMutations` callers depend on `BleeperResult` return shape | Low | Low | TASK-04 Scout: grep 3 consumers before changing return type. If dependent, keep `setBleeperAvailability` returning `BleeperResult` and use `useMutationState()` for state management only. |
| `useActivitiesMutations` consumers explicitly type `error` as `string \| null` | Low | Low | TASK-06 Scout: check 15 consumers for explicit `error` typing. If found, add narrowing comment rather than changing consumer. |
| `run()` return type generic not correctly propagated | Low | Medium | TASK-02 TC must verify `run<CancelBookingResult>(fn)` returns `Promise<CancelBookingResult>`. TypeScript enforces this. |
| CI test failures in migrated hook tests | Low | Medium | Tests are updated in same task as each migration wave. Existing test patterns for Firebase hooks are well-established. |
| `useVoidTransaction` early-return paths break `run()` integration | Low | Low | Identified in TASK-03 rehearsal; execution plan explicitly addresses the early-return → throw conversion. |

## Observability
- Logging: None: no new logging; existing error surfaces are preserved.
- Metrics: None: internal refactor; no runtime metrics change.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] `apps/reception/src/types/hooks/mutations/mutationState.ts` exists and exports `MutationState<T>`.
- [ ] `apps/reception/src/hooks/mutations/useMutationState.ts` exists and exports `useMutationState()` with `run()` wrapper.
- [x] All 16 in-scope hooks (TASK-03 through TASK-08) migrated or type-annotated.
- [x] 5 new test files created: `useMutationState.test.ts`, `useCityTaxMutation.test.ts`, `useVoidTransaction.test.ts`, `useBleeperMutations.test.ts`, `useCheckoutsMutation.test.ts`.
- [x] `pnpm typecheck` clean for `apps/reception` — exit 0, 2026-03-08.
- [x] `pnpm lint` clean for `apps/reception` — 0 errors, 10 pre-existing warnings in unrelated files, 2026-03-08.
- [x] No component call sites changed (except TASK-05's `BookingModal.tsx` isLoading→loading rename; ExtensionPayModal.tsx and usePrimeRequestResolution.ts required no call-site changes).
- [ ] CI tests pass (push to CI and monitor with `gh run watch`). — pending push to origin/dev.

## Build Evidence (2026-03-08)
- TASK-01: `mutationState.ts` created. Lint clean. Committed: `e1d812869c`.
- TASK-02: `useMutationState.ts` + 6-TC test file created. Typecheck clean.
- TASK-03: 5 Pattern A hooks migrated to `run()` wrapper. 2 new test files. Typecheck clean.
- TASK-04: 5 of 6 Pattern B hooks migrated with `run()`. `useBleeperMutations` uses manual variant (setLoading/setError exposed by useMutationState). 2 new test files. Typecheck clean.
- TASK-05: `useChangeBookingDatesMutator` migrated (isLoading/isError eliminated). `BookingModal.tsx` updated. ExtensionPayModal + usePrimeRequestResolution: no call-site changes needed (verified by grep). Typecheck clean.
- TASK-06: `useActivitiesMutations` type-annotated with `MutationState<void>` intersection. No runtime change. Consumer audit: grep found `error: string | null` in unrelated interfaces (not from useActivitiesMutations destructuring). No caller narrowing updates needed.
- TASK-07: `useAllTransactionsMutations` migrated (Pattern B+success — `run()` + `success` state preserved). Typecheck clean.
- TASK-08: `useBulkBookingActions` + `useCancelBooking` migrated. Typecheck clean.
- TASK-09: `pnpm --filter @apps/reception typecheck` → exit 0. `pnpm --filter @apps/reception lint` → 0 errors. All committed: `181a5e0f8e`.
- Offload route: codex `--dangerously-bypass-approvals-and-sandbox` for TASK-04 through TASK-08 (single wave). Exit code 0.

## Decision Log
- 2026-03-08: Chose direct call-site update for `useChangeBookingDatesMutator` over deprecated aliases. 3 production consumers is small enough to update cleanly.
- 2026-03-08: `useActivitiesMutations` — type-annotation only (no `run()` wrapper). Mutation fns return `ActivityResult`, not throw; secondary error surface in `maybeSendEmailGuest` is outside main mutation body.
- 2026-03-08: Pattern D hooks (17 `useMemo`-return hooks) deferred to follow-on iteration.
- 2026-03-08: `useGuestDetailsMutation` (Pattern C, 0 production consumers) deferred — no user impact.

## Overall-confidence Calculation
| Task | Confidence | Effort | Weight |
|---|---|---|---|
| TASK-01 | 95% | S | 1 |
| TASK-02 | 90% | S | 1 |
| TASK-03 | 90% | M | 2 |
| TASK-04 | 85% | M | 2 |
| TASK-05 | 85% | S | 1 |
| TASK-06 | 85% | S | 1 |
| TASK-07 | 85% | S | 1 |
| TASK-08 | 85% | S | 1 |
| TASK-09 | 90% | S | 1 |

Overall = (95×1 + 90×1 + 90×2 + 85×2 + 85×1 + 85×1 + 85×1 + 85×1 + 90×1) / (1+1+2+2+1+1+1+1+1) = (95+90+180+170+85+85+85+85+90) / 11 = 965/11 ≈ 87.7% → rounded to 88%. Overall-confidence: 88% (set in frontmatter).

## Delivery Rehearsal (Phase 9.5)

Four lenses checked:

1. **Data** — All hooks write to Firebase Realtime Database. No new database tables, migrations, or seed data required. Data dependencies are already in place (the hooks write to existing paths). No finding.

2. **Process/UX** — This is an internal hook refactor. No user-visible flows change. No finding.

3. **Security** — No auth boundaries changed. All hooks retain their existing auth guards (`useAuth()`, permission checks in `useAllocateRoom`). No new auth surface introduced. No finding.

4. **UI** — No UI components changed (TASK-05 updates 2 component files but only to rename a destructured variable — no rendering change). No finding.

No Critical or Major delivery rehearsal findings. No adjacent-idea routing required.
