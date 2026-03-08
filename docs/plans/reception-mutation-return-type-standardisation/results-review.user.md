---
Type: Results-Review
Status: Complete
Feature-Slug: reception-mutation-return-type-standardisation
Review-date: 2026-03-08
artifact: results-review
---

# Results Review

## Observed Outcomes

16 mutation hooks in `apps/reception/src/hooks/mutations/` now share a single `MutationState<T>` type and `useMutationState()` implementation. The loading/error `useState` boilerplate that appeared identically in 8+ Pattern A hooks has been eliminated. Pattern B hooks gained a `loading` field they previously lacked. `useBleeperMutations` uses the manual setter variant since its mutation function returns a structured result rather than throwing. `useChangeBookingDatesMutator` had its non-standard `isLoading`/`isError` fields renamed to canonical `loading`/`error`; one call site (`BookingModal.tsx`) updated. `useActivitiesMutations` received a type annotation only.

5 new test files created: `useMutationState.test.ts`, `useCityTaxMutation.test.ts`, `useVoidTransaction.test.ts`, `useCheckoutsMutation.test.ts`, `useBleeperMutations.test.ts`. Typecheck and lint both clean (0 errors).

## Standing Updates

- No standing updates: no registered artifacts changed.

## New Idea Candidates

- New standing data source — None.
- New open-source package — None.
- New skill — Possible: a "mutation hook migration" skill could automate the pattern of reading hook files, detecting pattern type (A/B/C/D/E), and applying the correct migration template. Low priority given Pattern D hooks are deferred and this migration is mostly complete.
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion

- No standing expansion: no new external data sources or artifacts identified.

## Intended Outcome Check

- **Intended:** Top 16 highest-consumer mutation hooks share a single `MutationState<T>` type and `useMutationState()` hook. The loading/error useState boilerplate is no longer duplicated in migrated hooks. Callers are unaffected.
- **Observed:** 16 hooks migrated or type-annotated. `useMutationState()` now provides the shared state lifecycle. Boilerplate eliminated from Pattern A and B hooks. `BookingModal.tsx` required a field rename (scoped exception, pre-disclosed in plan). All other callers unaffected.
- **Verdict:** met
- **Notes:** Outcome is operational (process/architecture improvement). The stated criteria are fully satisfied. One scoped caller exception was pre-disclosed and executed cleanly.
