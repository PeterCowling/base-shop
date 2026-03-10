---
Type: Build-Record
Status: Complete
Feature-Slug: prime-refetch-boilerplate
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Prime pureData Refetch Boilerplate

## Outcome Contract

- **Why:** Reduce mechanical repetition across 12 hooks so that the standard hook shape is enforced in one place rather than copy-pasted — lowering maintenance surface and preventing divergence as new hooks are added.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All React Query–backed pureData hooks expose `refetch: () => Promise<void>` via a single shared mechanism, with zero per-hook wrapper boilerplate. New hooks added thereafter require no manual refetch wrapping.
- **Source:** auto

## What Was Built

**TASK-01:** Created `apps/prime/src/hooks/pureData/types.ts` exporting `PureDataRefetch = () => Promise<void>`. Updated all 12 React Query-backed pureData hooks to import this type and replace their async wrapper closures with a direct `as unknown as PureDataRefetch` cast. Seven Pattern A hooks (useQuery with inline return) use `refetch: rqRefetch as unknown as PureDataRefetch` in the return object. Five Pattern B hooks (useQuery with extracted const) use `const refetch = refetchQuery as unknown as PureDataRefetch`. Staleness logic in `useFetchGuestProfile` and `useFetchQuestProgress` is entirely preserved — only the single `const refetch =` line changed.

**TASK-02:** Added `refetch: () => Promise<void>` to the `MockReturn` interface, `refetch: jest.fn(async () => {})` to the `__mockReturn` object, and a corresponding reset in `__resetMock` across all three manual mock files: `useFetchBookingsData`, `useFetchGuestDetails`, and `useFetchPreordersData`. This closes a pre-existing interface mismatch.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/prime typecheck` | Pass | Run after both TASK-01 and TASK-02 — zero errors both times |
| `pnpm --filter @apps/prime lint` | Pass | 0 errors; 11 pre-existing warnings (hardcoded logger strings, unrelated `ServiceCard` directive) |

## Validation Evidence

### TASK-01

- TC-01 PASS: `grep "refetch: async"` in all 7 Pattern A hook files returns empty.
- TC-02 PASS: `const refetch = refetchQuery as unknown as PureDataRefetch` confirmed present in `useFetchCheckInCode.ts`.
- TC-03 PASS: `isStale` and `effectiveProfile`/`effectiveProgress` lines present and unchanged in both staleness hooks.
- TC-04 PASS: `pnpm --filter @apps/prime typecheck` exit 0.
- TC-05 PASS: `pnpm --filter @apps/prime lint` exit 0 (no new errors).
- TC-06 PASS: `useFetchBagStorageData.ts` and `useFetchCompletedTasksData.ts` unchanged (no git diff).

### TASK-02

- TC-01 PASS: `refetch` field present in `__mocks__/useFetchBookingsData.ts`.
- TC-02 PASS: `refetch` field present in `__mocks__/useFetchGuestDetails.ts`.
- TC-03 PASS: `refetch` field present in `__mocks__/useFetchPreordersData.ts`.
- TC-04 PASS: `pnpm --filter @apps/prime typecheck` exit 0 after mock updates.

## Scope Deviations

None. Build stayed within planned scope. The `useFetchBagStorageData` and `useFetchCompletedTasksData` files were verified untouched. The `useOccupantDataSources` consumer was not modified.
