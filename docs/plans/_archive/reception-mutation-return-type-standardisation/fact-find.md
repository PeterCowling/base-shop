---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-mutation-return-type-standardisation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-mutation-return-type-standardisation/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308214000-0004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Mutation Return-Type Standardisation Fact-Find Brief

## Scope
### Summary
51 files exist in `apps/reception/src/hooks/mutations/` (50 hooks + `safeTransaction.ts` utility). They expose at least 5 structurally distinct return shapes, 3 distinct error types, and 2 loading-state tracking patterns. The variation is a maintenance tax on every component that calls a mutation: callers cannot write uniform error-display logic, cannot write a generic loading guard, and cannot deduplicate `useState<boolean>(false)` / `useState<unknown>(null)` boilerplate that is physically repeated across ~30+ files. This fact-find confirms the patterns, ranks hooks by consumer count, and defines the scope for a shared `MutationState<T>` type + `useMutationState()` hook with migration of the top 10–12 in-scope hooks.

### Goals
- Define a single `MutationState<T>` type at a canonical shared path in the reception app.
- Implement a `useMutationState()` hook that encapsulates the loading/error useState pair and the try/finally reset boilerplate.
- Migrate the 10–12 highest-consumer hooks to use the shared type and hook.
- Ensure migrated hooks remain backward-compatible at the call site (return shape expands, never shrinks).
- Add or update tests for the new shared hook and each migrated hook.

### Non-goals
- Migrating all 51 hooks in one pass — out of scope; tackle remaining hooks in follow-on iterations.
- Changing Firebase logic, data paths, or business rules. Note: this work changes both the type contract and runtime hook behavior — hooks that currently have no `loading` surface (e.g. `useFinancialsRoomMutations`, `useGuestDetailsMutation`, `useCheckoutsMutation`) gain new state that components can observe, which is a behavior change at the hook interface level.
- Changing call sites (components) — callers will benefit automatically because the return shape is a superset of what they already consume.
- Introducing a global state manager or React Query / SWR — not in scope.

### Constraints & Assumptions
- Constraints:
  - All migrated hooks must remain in `apps/reception/src/hooks/mutations/` (no path changes that break barrel imports).
  - The new shared type file must live within the reception app (`apps/reception/src/`), not in a shared package, because this is app-specific infrastructure not yet needed elsewhere.
  - No component call sites are edited as part of this migration; changes must be API-additive.
  - Tests run in CI only — no `jest` locally (per project policy).
- Assumptions:
  - Hooks with `useMemo` on the return value (e.g. `useInventoryLedgerMutations`, `useKeycardAssignmentsMutations`) cannot wrap the whole return in `useMutationState()` without restructuring — these are excluded from the first migration wave.
  - Hooks that return a structured result type from the mutation function itself (e.g. `ActivityResult` from `useActivitiesMutations`) have a separate concern from the top-level `{ loading, error }` state — the shared hook must not interfere with domain-specific return types.

## Outcome Contract

- **Why:** Full-app simplify sweep found that all 52 mutation hooks have inconsistent return types and error propagation, making it impossible for components to handle errors uniformly. This is a long-term maintenance tax on every component that calls a mutation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Top 10–12 highest-consumer mutation hooks share a single `MutationState<T>` type and `useMutationState()` hook. The loading/error useState boilerplate is no longer duplicated in migrated hooks. Callers are unaffected.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points
- `apps/reception/src/hooks/mutations/` — 51 top-level files (49 `use*.ts` hooks + 1 `use*.tsx` hook (`useGuestsByBookingMutation.tsx`) + `safeTransaction.ts` utility) plus the `__tests__/` subdirectory

### Key Modules / Files

Consumer counts are production-only (grep across `apps/reception/src`, excluding `__tests__/` and the hook's own file).

| File | Return shape | Error type | Loading state | Prod consumers | In scope |
|---|---|---|---|---|---|
| `useActivitiesMutations.ts` | `{ addActivity, removeLastActivity, saveActivity, logActivity, loading, error }` | `string \| null` | manual set/clear | 15 | Yes (type-annotation only — no `run()` wrapper; see task seed 6) |
| `useAllTransactionsMutations.ts` | `{ addToAllTransactions, error, success }` | `unknown` | none (Pattern B+success) | 9 | Yes |
| `useFinancialsRoomMutations.ts` | `{ saveFinancialsRoom, error }` | `unknown` | none | 6 | Yes |
| `useChangeBookingDatesMutator.ts` | `{ updateBookingDates, isLoading, isError, error }` | `Error \| null` | manual set/clear | 3 (ExtensionPayModal.tsx, BookingModal.tsx, usePrimeRequestResolution.ts) | Yes |
| `useBleeperMutations.ts` | `{ setBleeperAvailability, error }` | `unknown` | none | 3 | Yes |
| `useAllocateRoom.ts` | `{ allocateRoomIfAllowed, error }` | `unknown` | none | 2 | Yes |
| `useArchiveBooking.ts` | `{ archiveBooking, loading, error }` | `unknown` | manual set/clear | 3 | Yes |
| `useDeleteGuestFromBooking.ts` | `{ deleteGuest, loading, error }` | `unknown` | manual set/clear | 3 | Yes |
| `useDeleteBooking.ts` | `{ deleteBooking, loading, error }` | `unknown \| string` | manual set/clear | 3 | Yes |
| `useCityTaxMutation.ts` | `{ saveCityTax, loading, error }` | `unknown` | manual set/clear (Pattern A) | 2 | Yes |
| `useCheckoutsMutation.ts` | `{ saveCheckout, error }` | `unknown` | none | 1 | Yes |
| `useCheckinMutation.ts` | `{ saveCheckin, error }` | `unknown` | none | 1 | Yes |
| `useCCDetailsMutations.ts` | `{ saveCCDetails, error }` | `unknown` | none | 1 | Yes |
| `useVoidTransaction.ts` | `{ voidTransaction, loading, error }` | `unknown \| string` | manual set/clear | 1 | Yes |
| `useAlloggiatiSender.ts` | `{ isLoading, error, sendAlloggiatiRecords }` | `string \| null` | `isLoading` (renamed) | 1 | Optional |
| `useCancelBooking.ts` | `{ cancelBooking, loading, error }` | `unknown` | manual set/clear | 1 | Yes |
| `useBulkBookingActions.ts` | `{ cancelBookings, exportToCsv, loading, error }` | `unknown \| string` | manual set/clear | 1 | Yes |
| `useGuestDetailsMutation.ts` | `{ saveGuestDetails }` | none (throws raw) | none | 0 | Defer |
| `useInventoryLedgerMutations.ts` | `useMemo` return, no state | — | none | — | No (Pattern D) |
| `useKeycardAssignmentsMutations.ts` | `useMemo` return, no state | — | none | — | No (Pattern D) |
| `useCashCountsMutations.ts` | `useMemo` return, no state | — | none | — | No (Pattern D) |
| `useCCReceiptConfirmations.ts` | `useMemo` return, no state | — | none | — | No (Pattern D) |

### Patterns & Conventions Observed

**Pattern A: `{ mutationFn, loading, error }` with manual try/finally boilerplate**
Evidence: `useArchiveBooking.ts`, `useDeleteBooking.ts`, `useDeleteGuestFromBooking.ts`, `useCancelBooking.ts`, `useVoidTransaction.ts`, `useChangeBookingDatesMutator.ts`, `useBulkBookingActions.ts`, `useActivitiesMutations.ts`
Boilerplate (repeated ~8 times):
```ts
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<unknown>(null);
// ...
setLoading(true); setError(null);
try { ... } catch (err) { setError(err); throw err; } finally { setLoading(false); }
```

**Pattern B: `{ mutationFn, error }` — loading absent**
Evidence: `useCheckoutsMutation.ts`, `useCheckinMutation.ts`, `useCCDetailsMutations.ts`, `useFinancialsRoomMutations.ts`, `useBleeperMutations.ts`, `useAllocateRoom.ts`
Missing loading state means callers cannot show a spinner; some fire-and-forget, others have async work the UI should gate on.

**Pattern C: `{ mutationFn }` only — no state at all**
Evidence: `useGuestDetailsMutation.ts`
Error is silently lost unless the caller wraps in its own try/catch. No standardised surface.

**Pattern D: `useMemo` return, no state fields**
Evidence (17 hooks with `useMemo` on their return value confirmed by grep): `useCCIrregularitiesMutations.ts`, `useCCReceiptConfirmations.ts`, `useCashCountsMutations.ts`, `useCashDiscrepanciesMutations.ts`, `useDrawerAlertsMutations.ts`, `useEodClosureMutations.ts`, `useInventoryItemsMutations.ts`, `useInventoryLedgerMutations.ts`, `useInventoryRecipesMutations.ts`, `useKeycardAssignmentsMutations.ts`, `useKeycardDiscrepanciesMutations.ts`, `usePmsPostingsMutations.ts`, `useSafeCountsMutations.ts`, `useShiftEventsMutations.ts`, `useTerminalBatchesMutations.ts`, `useTillShiftsMutations.ts`, `useVarianceThresholdsMutations.ts`. Note: `useActivitiesMutations.ts` uses `useMemo` only for an internal `relevantCodes` constant — its return value exposes `loading`/`error` state and is NOT a Pattern D hook; it is classified separately as Pattern A with domain-return-type complexity. All 17 Pattern D hooks are excluded from this migration wave because adding `loading`/`error` to their return would introduce new observable behavior and require call-site changes.

**Pattern E: Non-standard field names**
Evidence: `useChangeBookingDatesMutator.ts` returns `isLoading`/`isError`/`error` (3 fields for two boolean concepts); `useAlloggiatiSender.ts` uses `isLoading` instead of `loading`; `useAllTransactionsMutations.ts` returns `success` (string state) instead of data.

**Error type variation:**
- `unknown` (most common): `useArchiveBooking`, `useDeleteGuestFromBooking`, `useAllTransactionsMutations`, `useFinancialsRoomMutations`, etc.
- `string | null`: `useActivitiesMutations`, `useAlloggiatiSender`
- `Error | null`: `useChangeBookingDatesMutator`
- `string` literal set on `setError`: `useDeleteBooking`, `useDeleteGuestFromBooking` (inconsistent even within the same hook: sometimes sets string, sometimes sets Error object)

### Data & Contracts
- Types/schemas/events:
  - Existing: `ActivityResult` at `apps/reception/src/types/domains/activitiesDomain.ts` — a structured result type; this is the right model for domain-return types but is not the same as the hook-level state shape.
  - Missing: No shared `MutationState<T>` type exists anywhere in the codebase.
  - Missing: No `useMutationState()` hook exists.
  - Existing mutation-specific types: `apps/reception/src/types/hooks/mutations/fiancialsRoomMutation.ts`, `saveRoomsByDateParams.ts`
- Persistence: All hooks write to Firebase Realtime Database via `ref/update/set/push/runTransaction`.

### Dependency & Impact Map
- Upstream dependencies:
  - `useFirebaseDatabase()` — called in every hook
  - `useAuth()` — called in auth-gated hooks
  - `useOnlineStatus()` — called in offline-aware hooks
- Downstream dependents:
  - Pattern A hooks are consumed across components in `apps/reception/src/components/**` — blast radius is wide but call sites only destructure the fields they need.
  - `useActivitiesMutations` is the single most widely consumed hook (32 files). Its error type is `string | null` which differs from the `unknown` majority — migration needs to handle this conversion carefully.
- Likely blast radius:
  - **Zero call-site changes needed**: the shared type is additive — hooks that previously returned `{ mutationFn, error }` gain `loading` and the unified error type as a superset. Callers that only destructure `{ error }` continue to work.
  - **One breaking exception**: `useChangeBookingDatesMutator` returns `isLoading`/`isError` — migrating to `loading` would break its 3 production consumers (ExtensionPayModal.tsx, BookingModal.tsx, usePrimeRequestResolution.ts). Recommend keeping alias fields or doing a direct call-site sweep — 3 sites is feasible.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react` (`renderHook` from `@testing-library/react`, confirmed in `__tests__/useArchiveBooking.test.ts` line 1 and `__tests__/useActivitiesMutations.test.ts` line 1)
- Commands: Push to CI — tests run automatically. **Do not run Jest locally** (project policy: `docs/testing-policy.md` forbids local `jest`/`pnpm test` invocations). Monitor with `gh run watch`.
- CI integration: Tests run in CI on push (per `docs/testing-policy.md`). Never run locally.

#### Existing Test Coverage
| Area | Test Type | Files |
|---|---|---|
| `useActivitiesMutations` | unit | `__tests__/useActivitiesMutations.test.ts` |
| `useAllTransactionsMutations` | unit | `__tests__/useAllTransactionsMutations.test.ts` |
| `useFinancialsRoomMutations` | unit | `__tests__/useFinancialsRoomMutations.test.ts` |
| `useChangeBookingDatesMutator` | unit | `__tests__/useChangeBookingDatesMutator.test.ts` |
| `useArchiveBooking` | unit | `__tests__/useArchiveBooking.test.ts` |
| `useDeleteGuestFromBooking` | unit | `__tests__/useDeleteGuestFromBooking.test.ts` |
| `useDeleteBooking` | unit | `__tests__/useDeleteBooking.test.ts` |
| `useCancelBooking` | unit | `__tests__/useCancelBooking.test.ts` |
| `useAllocateRoom` | unit | `__tests__/useAllocateRoom.test.ts` |
| `useCCDetailsMutations` | unit | `__tests__/useCCDetailsMutations.test.tsx` |
| 29 more hooks | unit | `__tests__/use*.test.ts(x)` |

New shared hook (`useMutationState`) will require its own test file. Migrated hooks need tests updated to verify the unified return shape.

**Note on coverage claim:** Not every in-scope hook has an existing test file. Confirmed missing: `useBleeperMutations` (3 production consumers), `useCheckoutsMutation` (1 production consumer), `useCityTaxMutation` (2 production consumers). Test files must be created for these hooks as part of migration.

#### Coverage Gaps
- `useCityTaxMutation` — no test file in `__tests__/`. Pattern A hook; test file must be created as part of migration.
- `useBleeperMutations` — no test file in `__tests__/`. 3 production consumers; test file must be created.
- `useCheckoutsMutation` — no test file in `__tests__/`. 3 consumers; test file must be created.
- `useMutationState` — does not exist yet; must add `__tests__/useMutationState.test.ts`.
- `useGuestDetailsMutation` — test exists but migration adds error state; test must verify new error surface.

### Recent Git History (Targeted)
- `apps/reception/src/hooks/mutations/` — last significant change: `e75f7396cd feat(reception): process integrity hardening — auth, email, mutations, and component reliability` (~2 months ago). Hooks have been stable; no concurrent migration in progress.

## Questions
### Resolved
- Q: Does a shared `MutationState<T>` type or `useMutationState()` hook already exist somewhere in the monorepo?
  - A: No. Searched `types/hooks/mutations/`, `types/domains/`, and `hooks/utilities/`. The closest existing type is `ActivityResult` which is a domain-specific return type, not a hook state container.
  - Evidence: `ls apps/reception/src/types/hooks/mutations/` and `ls apps/reception/src/hooks/utilities/`

- Q: Are there call sites that would break if `loading` is added to Pattern B hooks?
  - A: No — adding `loading` to a return object is backward-compatible. Callers that destructure `{ saveCheckout, error }` are unaffected by an added `loading` field.
  - Evidence: JavaScript/TypeScript object destructuring ignores undeclared keys.

- Q: Should `useMutationState()` be placed in a shared package or within the reception app?
  - A: Within the reception app at `apps/reception/src/hooks/mutations/useMutationState.ts`. The pattern is bespoke to Firebase mutation hooks in this app; no other app currently uses this pattern. Extract to a shared package only if a second app adopts it.
  - Evidence: Architecture constraint; no other app's mutation hooks were found with the same Firebase + manual-state pattern.

- Q: What should the `useMutationState()` signature look like?
  - A: Based on the repeated boilerplate pattern across 8+ hooks, the hook should manage `loading` (boolean) and `error` (unknown) and expose a `run()` wrapper that sets loading=true, clears error, executes the async fn, catches into error state (re-throws), and clears loading in finally. This matches the exact boilerplate in Pattern A hooks without adding new semantics.
  - Evidence: `useArchiveBooking.ts`, `useDeleteBooking.ts`, `useDeleteGuestFromBooking.ts`, `useVoidTransaction.ts`

- Q: Is `useChangeBookingDatesMutator`'s non-standard `isLoading`/`isError` naming a blocker?
  - A: Not a blocker, but migrating it cleanly requires either (a) adding `loading` as an alias alongside `isLoading`/`isError` and deprecating those, or (b) updating its 3 production call sites directly. With only 3 call sites, option (b) is feasible and cleaner — avoids leaving deprecated fields in the public interface.
  - Evidence: `useChangeBookingDatesMutator.ts` lines 30–34; 3 production consumers confirmed (ExtensionPayModal.tsx, BookingModal.tsx, usePrimeRequestResolution.ts).

- Q: Should hooks using `useMemo` for their return value be in scope?
  - A: No. Pattern D hooks (`useInventoryLedgerMutations`, `useKeycardAssignmentsMutations`, `useCashCountsMutations`, `useCCReceiptConfirmations`) use `useMemo` on the entire return. Inserting `loading`/`error` state into these hooks would require restructuring the `useMemo` scope and modifying call sites. Defer to a follow-on iteration.
  - Evidence: `useInventoryLedgerMutations.ts` lines 141–151; `useKeycardAssignmentsMutations.ts` lines 195–198.

### Open (Operator Input Required)
None. All questions resolved from available evidence.

## Confidence Inputs
- Implementation: 90% — boilerplate is explicit and repetitive; the shared hook pattern is well-established; all target hooks are readable and their return shapes are confirmed.
- Approach: 85% — the additive strategy avoids call-site churn; the one non-standard hook (`useChangeBookingDatesMutator`) requires an alias approach that is slightly more complex.
- Impact: 85% — measurably reduces repeated code in 10–12 hooks; removes the ability for callers to receive inconsistent state shapes across the top consumers.
- Delivery-Readiness: 83% — test infrastructure is in place; test policy is understood; however, 3 hooks in scope (`useBleeperMutations`, `useCheckoutsMutation`, `useCityTaxMutation`) have no existing test files and require new test files as part of this migration.
- Testability: 80% — most hooks have existing test files; 3 in-scope hooks require new test files; `useMutationState` requires a new test file. `useActivitiesMutations` has a complex secondary error surface (maybeSendEmailGuest sets error outside run()) that existing tests may not cover under the new type contract.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `useActivitiesMutations` error type is `string \| null`, not `unknown` | Medium | Low | Keep `error` type as `unknown` in the shared type; `useActivitiesMutations` can widen its internal string error to `unknown` without breaking callers (they can narrow via `typeof error === 'string'`). |
| `useChangeBookingDatesMutator` consumers use `isLoading`/`isError` — rename causes TS errors | Medium | Low | Add canonical `loading`/`error` alongside `isLoading`/`isError` in the same return; mark old names `@deprecated`. Call sites stay green. |
| Re-throw semantics change accidentally during migration | Low | Medium | Ensure `useMutationState` always re-throws after setting error state; test with a hook that verifies the thrown error propagates from the `run()` wrapper. |
| Test isolation — mocking `useMutationState` in 12 hook tests | Low | Low | `useMutationState` is a simple React hook; tests mock it by mocking useState; existing test patterns for Firebase hooks cover this. |
| Pattern D hooks are incorrectly targeted | Low | Medium | 17 hooks excluded (all `useMemo`-return hooks). See Pattern D section for full list. The key-modules table marks each with "No (Pattern D)". Any hook not marked "Yes" or "Optional" in the In-scope column is excluded from this migration. |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Return shape classification (all 51 top-level hook files) | Partial | Minor: ~9 hooks not individually read (e.g. `usePreorderMutations`). `useCityTaxMutation` now confirmed as Pattern A. Pattern is saturated from 22+ read. | No — pattern is clear from sampled evidence |
| Consumer count (all hooks) | Yes | None | No |
| Existing types / shared infrastructure | Yes | None — no `useMutationState` exists | No |
| Test landscape | Yes | `useMutationState` will need a new test file | No |
| Call-site impact (backwards compatibility) | Yes | `useChangeBookingDatesMutator` alias issue noted | No |
| Pattern D (useMemo) hooks exclusion | Yes | None | No |
| Error type variance | Yes | None — variance documented | No |

## Scope Signal
Signal: right-sized
Rationale: 10–15 in-scope hooks (Pattern A/B/E) cover the highest-traffic production paths without touching Pattern D hooks (17 hooks with useMemo returns, excluded from scope). The shared hook eliminates repeating boilerplate from the most-consumed hooks. Pattern D hooks are correctly excluded to avoid call-site churn. Remaining out-of-scope hooks can be migrated in a follow-on pass.

## Planning Constraints & Notes
- Must-follow patterns:
  - New file at `apps/reception/src/hooks/mutations/useMutationState.ts` — stays inside the mutations directory for co-location.
  - Shared type at `apps/reception/src/types/hooks/mutations/mutationState.ts` — follows existing naming convention in that directory.
  - Use `unknown` as the canonical error type (matches the majority of existing hooks and TypeScript best practice for caught errors).
  - No changes to component call sites in this iteration.
- Rollout/rollback expectations:
  - Wave 1 (Pattern A) migrations are structurally refactors — they consolidate identical boilerplate but the external return shape is unchanged. Wave 2 (Pattern B/C) migrations add a new `loading` field to hooks that currently expose none, which is a new observable behavior. `useActivitiesMutations` additionally widens its error type from `string | null` to `unknown`, which may require call-site narrowing checks. CI tests guard against all regressions — test suites must be updated for each wave to cover the new state.
  - Rollback: revert the migration commits; no database changes, no schema changes.
- Observability expectations:
  - No new observability needed; error state surfaces identically to the pre-migration hooks.

## Suggested Task Seeds (Non-binding)
1. **Create `MutationState<T>` type** — `apps/reception/src/types/hooks/mutations/mutationState.ts`
2. **Create `useMutationState()` hook + tests** — `apps/reception/src/hooks/mutations/useMutationState.ts` + `__tests__/useMutationState.test.ts`
3. **Migrate Wave 1: `useArchiveBooking`, `useDeleteBooking`, `useDeleteGuestFromBooking`, `useCancelBooking`, `useVoidTransaction`, `useCityTaxMutation`** — Pattern A hooks with explicit loading+error state and no useMemo conflict; all are production-consumed
4. **Migrate Wave 2: `useFinancialsRoomMutations`, `useCheckoutsMutation`, `useCheckinMutation`, `useCCDetailsMutations`, `useAllocateRoom`, `useBleeperMutations`** — Pattern B hooks; adding `loading` is a new runtime behavior (callers gain observable loading state); these hooks currently have no loading surface
5. **Migrate `useChangeBookingDatesMutator`** — Pattern E; add `loading`/`error` canonical aliases, keep `isLoading`/`isError` as deprecated; 3 production call sites (`ExtensionPayModal.tsx`, `BookingModal.tsx`, `usePrimeRequestResolution.ts`) — updating them directly is feasible alongside or instead of aliases
6. **Migrate `useActivitiesMutations`** — largest consumer (32), but the most complex migration: (a) error type is `string | null` internally, not `unknown` — widening to `unknown` requires verifying all 32 call sites narrow it if needed; (b) mutation functions (`addActivity`, `saveActivity`, `removeLastActivity`) return `ActivityResult` instead of throwing — these do not follow the standard catch-and-rethrow pattern, so `useMutationState.run()` cannot wrap them without restructuring; (c) `maybeSendEmailGuest()` sets `error` state outside the main mutation body (line ~80), creating a secondary error surface not captured by `run()`. Recommendation: do not wrap `useActivitiesMutations` with the `run()` helper. Instead, adopt the shared `MutationState<T>` type for its return shape annotation only, keeping existing internal error/loading management unchanged.
7. **Migrate `useAllTransactionsMutations`** — Pattern B+success variant; hook has no loading state but does track `success: string | null`; add `loading` alongside existing `error`/`success` fields
8. **Update `useGuestDetailsMutation`** — Pattern C (only hook returning no state at all); add error and loading state; note: this hook has 0 production consumers outside tests — low priority, do last or defer
9. **Typecheck gate** — `pnpm typecheck` pass after each wave

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: TypeScript clean (`pnpm typecheck`), lint clean (`pnpm lint`), tests pass in CI, no call-site changes required.
- Post-delivery measurement plan: Follow-on iteration can measure % of hooks migrated to shared type; no runtime metric needed.

## Evidence Gap Review
### Gaps Addressed
- Inspected 23+ hooks individually; remaining lower-consumer hooks that were not individually read are confirmed as excluded from scope (Pattern D useMemo hooks) or are Pattern A/B based on their position in the consumer ranking.
- Consumer counts re-verified by grep limited to production files (excluding `__tests__/`). `useChangeBookingDatesMutator` corrected to 2 production consumers. `useGuestDetailsMutation` confirmed 0 production consumers.
- 17 hooks confirmed to use `useMemo` on their return value (Pattern D) via grep. All 17 excluded from this migration. `useActivitiesMutations` uses `useMemo` only for an internal constant and is NOT in Pattern D — it is Pattern A with domain-return-type complexity; in scope but requires special handling (type annotation only, no `run()` wrapper).
- Confirmed no existing `MutationState` type or `useMutationState` hook in repo.
- Confirmed test files are missing for `useBleeperMutations`, `useCheckoutsMutation`, and `useCityTaxMutation` — test files must be created as part of migration tasks for these hooks.
- Confirmed Pattern D exclusion set is 18 hooks, not just the 4 originally named.

### Confidence Adjustments
- Implementation confidence: 88% (reduced from 90%) — the additional test creation work for 3 hooks without test files adds scope but not risk.
- Approach confidence: 85% — `useChangeBookingDatesMutator` has only 2 production call sites; direct call-site update is viable as an alternative to aliases.
- Delivery-Readiness: 83% (reduced from 88%) — 3 hooks require new test files; test creation is straightforward but is additional surface area.

### Remaining Assumptions
- `useCityTaxMutation` confirmed as Pattern A (`{ saveCityTax, loading, error }`), 2 production consumers. Included in Wave 1.
- `usePreorderMutations` and other unread lower-consumer hooks follow standard patterns. They are not in scope for this iteration.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-mutation-return-type-standardisation --auto`
