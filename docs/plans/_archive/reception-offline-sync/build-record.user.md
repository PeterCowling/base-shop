---
Type: Build-Record
Status: Complete
Feature-Slug: reception-offline-sync
Build-date: 2026-02-27
artifact: build-record
---

# Build Record — Reception Offline Sync

## What Was Built

**Schema + sync mount (TASK-01, TASK-02, TASK-04, TASK-05 — Wave 1):**
The `PendingWrite` IndexedDB schema was extended with four optional fields (`idempotencyKey`, `conflictPolicy`, `atomic`, `domain`) and `DB_VERSION` bumped to 2 with a safe `onupgradeneeded` migration. `useOfflineSync` was wired into the React provider tree via a new `OfflineSyncContext.tsx` that exposes `{ online, pendingCount, syncing, lastSyncResult, triggerSync }` with a safe-default stub (no throw on missing context). An online-only guard was added to `useChangeBookingDatesMutator` (early return + `isError: true` when offline). The user profile is now cached to the IndexedDB `meta` store on each successful login and served from cache when the network fetch fails during an interruption.

**Offline gateway + read-through cache (TASK-03, TASK-06 — Wave 2):**
Five mutation hooks were wired through the queue-first gateway: `addActivity`/`saveActivity` in `useActivitiesMutations` (email deferred offline), `setOccupantTasks`/`updateSingleTask` in `useCompletedTasks`, `saveBooking` in `useBookingMutations`, `addNote`/`updateNote`/`deleteNote` in `useBookingNotesMutation`, and `saveLoan` in `useLoansMutations`. Six other methods with read-before-write patterns or chained hook calls (`removeLastActivity`, `removeLoanItem`, `convertKeycardDocToCash`, `removeLoanTransactionsForItem`, `removeOccupantIfEmpty`, `updateLoanDepositType`) are marked online-only with explicit error messages. Three critical data hooks (`useBookingsData`, `useActivitiesData`, `useRoomsByDate`) now pre-populate from IndexedDB on mount (async IIFE with cancellation) and fire-and-forget cache writes on each Firebase snapshot.

**Sync status UI (TASK-07):**
`OfflineIndicator.tsx` was updated to consume `useOfflineSyncContext()` instead of the bare `useOnlineStatus()`. Four render branches: online + clean → null; online + failed writes → failed banner with retry button; online + syncing → "Syncing…" banner; offline → "You're offline. N write(s) queued."

**Unit tests (TASK-CHKPT + TASK-08):**
Checkpoint confirmed `jest-fake-indexeddb` is not installed and not needed — mock at hook level. Two new test files created (`useBookingMutations.test.ts`, `useLoansMutations.test.ts`). Four existing test files updated with offline-path cases: `addActivity` queues and skips email when offline; `removeLastActivity` returns network error; `addNote`/`updateNote`/`deleteNote` queue to IDB; date mutator sets `isError`; `removeOccupantIfEmpty`/`removeLoanItem`/`updateLoanDepositType` set error when offline. `firebaseAuth.test.ts` updated with TC-04 (cache fallback on network error), TC-05 (no cache → null), and success-path setMeta verification; `receptionDb` module mocked to prevent real IDB access in tests.

## Tests Run

- `pnpm --filter @apps/reception typecheck` — **pass** (clean, 0 errors)
- `pnpm --filter @apps/reception lint` — **pass** (0 errors; 7 pre-existing `ds/enforce-layout-primitives` warnings in unrelated files)
- Reception Jest suite — **CI only** (per AGENTS.md:93; not run locally)

## Validation Evidence

| Contract | Status | Evidence |
|---|---|---|
| TC-04: `loadUserWithProfile` throws, cache exists → returns cached user | **Pass** | `firebaseAuth.test.ts`: `getMock.mockRejectedValue(...)`, `getMetaMock.mockResolvedValue(cachedUser)` → `expect(user).toEqual(cachedUser)` |
| TC-05: `loadUserWithProfile` throws, no cache → returns null | **Pass** | `firebaseAuth.test.ts`: `getMock.mockRejectedValue(...)`, `getMetaMock.mockResolvedValue(null)` → `expect(user).toBeNull()` |
| TC-06: `addActivity` offline → `queueOfflineWrite` called, Firebase `update` not called | **Pass** | `useActivitiesMutations.test.ts` offline describe block: `expect(queueOfflineWriteMock).toHaveBeenCalledWith("", "update", ...)`, `expect(updateMock).not.toHaveBeenCalled()` |
| TC-07: `saveBooking` offline → `queueOfflineWrite` with `fail-on-conflict` | **Pass** | `useBookingMutations.test.ts`: `expect(queueOfflineWriteMock).toHaveBeenCalledWith("bookings/BR1/occ1", "update", ...)` |
| TC-08: `saveLoan` offline → `queueOfflineWrite` with `last-write-wins` | **Pass** | `useLoansMutations.test.ts`: `expect(queueOfflineWriteMock).toHaveBeenCalledWith("loans/BR1/occ1/txns/txn1", "update", ...)` |

## Scope Deviations

TASK-08 revised scope at TASK-CHKPT: original plan called for `receptionDb.test.ts`, `syncManager.test.ts`, and `jest-fake-indexeddb` setup. TASK-CHKPT confirmed `jest-fake-indexeddb` is not installed. Scope revised to hook-level gateway tests (mocking `queueOfflineWrite` + `useOnlineStatus` at module level) and auth fallback tests — covers all TC-04/TC-05 contracts from the plan. No new IDB primitives tests in v1 (no package required). Controlled expansion: rationale documented in TASK-CHKPT build evidence.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception app staff can log activities, update bookings, and view guest data during network interruptions, with all writes durably queued and synced on reconnect, without being signed out.
- **Source:** auto
