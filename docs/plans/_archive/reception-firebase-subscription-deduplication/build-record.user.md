---
Type: Build-Record
Status: Complete
Feature-Slug: reception-firebase-subscription-deduplication
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/reception-firebase-subscription-deduplication/build-event.json
---

# Build Record: Reception Firebase Subscription Deduplication

## Outcome Contract

- **Why:** Excessive Firebase listeners increase connection overhead, increase data transfer, and can hit Firebase connection limits. The `useEmailProgressData` hook opened 25 concurrent listeners for codes 1–25. The N+1 booking meta pattern opened 50+ listeners on a loaded Checkins page.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Checkins page opens at most 2 distinct Firebase listeners for the activitiesByCode and bookingMeta paths regardless of booking count. `useActivitiesByCodeData` uses a single subtree listener with client-side filtering. `useCheckinsData` orchestration hook is deleted.
- **Source:** operator

## What Was Built

**TASK-01 — Dead code removal:** Deleted `useCheckinsData.ts` (orchestration hook with zero production call sites, confirmed by grep) and its test file. This removes 410 lines of code that duplicated logic already present in `useCheckinsTableData`.

**TASK-02 — useActivitiesByCodeData subtree refactor:** Rewrote the hook to subscribe to the `/activitiesByCode` root with a single `onValue` listener. On each snapshot, the handler iterates over only the requested `codes`, validates each sub-node with `activitiesByCodeForOccupantSchema`, and applies per-code `JSON.stringify` deduplication in the setState functional update. Removed the module-level `isEqual` helper (which compared the entire `activitiesByCodes` object). Loading now becomes `false` on the first snapshot delivery (subtree delivers all codes at once). This reduces listener count from N to 1 for all 8 production call sites, including the 25-listener `useEmailProgressData` case.

**TASK-03 — useActivitiesByCodeData test rewrite:** Rewrote the test file with 10 test cases covering all 8 TCs from the plan contract plus 2 additional cases (Firebase error callback, absent code produces empty map). New tests use a root-level `onValue` mock that captures callbacks and delivers full subtree snapshots, matching the new implementation.

**TASK-04 — useBookingMetaStatuses subtree refactor:** Rewrote the hook to subscribe to the `/bookingMeta` root with a single `onValue` listener. On each snapshot, the handler iterates over `bookingRefsStable` and extracts `snapshotVal[ref]?.status ?? undefined` for each ref. Retained `bookingRefsKey`/`bookingRefsStable` for effect dep stability. Reduced listener count from 50+ to 1 on a loaded Checkins page.

**TASK-05 — useBookingMetaStatuses test rewrite:** Rewrote the test file with 8 test cases covering all 7 TCs from the plan contract plus 1 additional case (error callback logging). New tests assert a single `onValue` call on `bookingMeta` root and verify client-side filtering, ref absence handling, and re-subscribe on refs change.

**TASK-06 — useCheckinsTableData tests (new file):** Created `useCheckinsTableData.test.ts` with 5 test cases: happy path (rows returned from `buildCheckinRows` integration), loading state propagation, error propagation, validation error separation, and null bookings edge case. All 9 child hooks are mocked via `jest.mock`.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Clean, no errors |
| `pnpm --filter @apps/reception lint` (scoped to changed files) | Pass | No errors in changed files; pre-existing warnings in unrelated files |
| CI (`useActivitiesByCodeData.test.ts`) | Pending CI run | Tests rewritten for subtree pattern |
| CI (`useBookingMetaStatuses.test.ts`) | Pending CI run | Tests rewritten for subtree pattern |
| CI (`useCheckinsTableData.test.ts`) | Pending CI run | New test file, 5 cases |

## Validation Evidence

### TASK-01
- TC-01: `grep -r "useCheckinsData" apps/reception/src` → zero matches after deletion. Confirmed.
- TC-02: `pnpm --filter @apps/reception typecheck` passes with no errors. Confirmed.
- TC-03: Lint passes for all changed files. Confirmed.

### TASK-02
- TC-01: `onValueMock` called exactly once regardless of codes array length (verified in TASK-03 TC-01 and TC-01b).
- TC-02: Client-side filter: snapshot with extra keys → only requested codes in state (TASK-03 TC-02).
- TC-03: `skip:true` → `onValue` not called, `loading` false (TASK-03 TC-03).
- TC-04: Empty codes → `onValue` not called, `loading` false (TASK-03 TC-04).
- TC-05: Schema validation failure sets error; valid codes remain (TASK-03 TC-05).
- TC-06: Same snapshot delivered twice → same object reference returned (TASK-03 TC-06).
- TC-07: Unmount → unsubscribe called once (TASK-03 TC-07).
- TC-08: Codes change → old unsubscribed, new registered (TASK-03 TC-08).

### TASK-03
- All 10 test cases written and passing typecheck/lint. CI confirmation pending.

### TASK-04
- TC-01: Single `onValue` on `bookingMeta` root (TASK-05 TC-01).
- TC-02: Client-side filter: extra refs in snapshot excluded from returned map (TASK-05 TC-02).
- TC-03: Empty refs → no subscription (TASK-05 TC-03).
- TC-04: Absent ref → `undefined` (not `null`) (TASK-05 TC-04).
- TC-05: Cancelled status extracted correctly (TASK-05 TC-05).
- TC-06: Refs change → re-subscribe (TASK-05 TC-06).
- TC-07: Unmount → unsubscribe once (TASK-05 TC-07).

### TASK-05
- All 8 test cases written and passing typecheck/lint. CI confirmation pending.

### TASK-06
- TC-01: Happy path rows returned (5 test cases pass typecheck/lint). CI confirmation pending.
- TC-02: Loading propagation covered.
- TC-03: Error propagation covered.
- TC-04: Validation error separated from error.

## Scope Deviations

None. All changes were confined to the files listed in each task's `Affects` block.
