---
Type: Build-Record
Status: Complete
Feature-Slug: reception-firebase-subscription-parallelization
Build-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Firebase Subscription Parallelization

## Build Summary

All 5 tasks completed in two waves.

**Wave 1 (parallel): TASK-01 + TASK-04**
- TASK-01: Extended `FirebaseSubscriptionCacheProvider.subscribe()` with an optional `prefill?: () => Promise<unknown>` parameter. Implemented cancelled-token pattern so in-flight prefill results are discarded after unsubscribe or Firebase data arrival. Added TC-02, TC-03, TC-04 to the existing test suite. Committed `7f1d4bb972`.
- TASK-04: Created `useRangeSubscription.ts` — a stateless primitive that manages one Firebase range subscription keyed by a sorted date string. Uses `useMemo`-derived string range key as the dep so reference-equal rerenders do not trigger resubscription. Migrated `useRoomsByDate` and `useCheckinsByDate` to use the primitive. Removed `loading` from `useRoomsByDate`'s effect dep array (bug fixed). Added TC-12/TC-13/TC-14 for the primitive, TC-15/TC-16 for the migrated hooks. Committed `555c66b496`.

**Wave 2: TASK-02**
- TASK-02: Mounted `FirebaseSubscriptionCacheProvider` in `apps/reception/src/components/Providers.tsx`, inside `AuthProvider` and wrapping `LoanDataProvider`. Committed `555c66b496`.

**Wave 3: TASK-03 + TASK-05**
- TASK-03: Full call-site audit of `useBookingsData`, `useGuestByRoom`, `useActivitiesData`. All three hooks have parameterized call sites in `useBookingSearchClient.tsx`. No hook is eligible for path-keyed cache migration. Phase 2 scope closed. Decision Log updated.
- TASK-05: Removed `useMemo(() => activities, [activities])` wrapper and unused `useMemo` import from `useActivitiesData.ts`. Committed `555c66b496`.

## Validation Evidence

- Tests: All targeted test suites pass (TC-01 through TC-17 contracts satisfied).
  - `FirebaseSubscriptionCache.test.tsx`: 24 tests (PASS)
  - `useRangeSubscription.test.ts`: 5 tests (PASS) including TC-12/13/14
  - `useRoomsByDate.test.ts`: 4 tests (PASS) including TC-15
  - `useCheckinsByDate.test.tsx`: 4 tests (PASS) including TC-16
- Typecheck: `pnpm typecheck` passes (0 errors).
- Lint: `pnpm lint` passes (0 errors; pre-existing warnings unrelated to these changes).

## Outcome Contract

- **Why:** The reception app's Firebase subscription layer had redundant open connections: duplicated range-subscription boilerplate across two hooks and an implemented but unmounted cache provider.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's Firebase subscription layer has no duplicated range-subscription boilerplate and the shared cache provider is mounted in the app tree, ready to reduce open Firebase connections on the dashboard screen.
- **Source:** auto
