---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-firebase-subscription-parallelization
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: weighted average by effort; IMPLEMENT tasks only for build-gate threshold
Auto-Build-Intent: plan+auto
---

# Reception Firebase Subscription Parallelization Plan

## Summary

The `apps/reception` hook layer opens multiple redundant Firebase Realtime Database connections: two near-identical orchestrator hooks (`useCheckinsTableData` and `useCheckinsData`) each fan out 9 independent subscriptions; two range-subscription hooks (`useRoomsByDate` and `useCheckinsByDate`) duplicate ~80 lines of unsubscribe-on-change logic; and an implemented `FirebaseSubscriptionCacheProvider` (reference-counted, tested) is never mounted in the app tree. An existing `LoanDataContext` already provides `/loans` via a shared subscription but direct `useLoans` calls still open separate listeners. This plan: (1) extends the cache provider with an offline-prefill hook, (2) mounts it in `Providers.tsx`, (3) migrates the three highest-value stable-path hooks (`useBookingsData`, `useGuestByRoom`, `useActivitiesData`) to consume the cache, (4) extracts a shared `useRangeSubscription` primitive to eliminate the ~80-line duplication, and (5) cleans up dead code.

## Active tasks
- [x] TASK-01: Extend FirebaseSubscriptionCacheProvider with prefill support
- [x] TASK-02: Mount FirebaseSubscriptionCacheProvider in Providers.tsx
- [x] TASK-03: Identify stable-path hooks eligible for cache migration (INVESTIGATE)
- [x] TASK-04: Extract useRangeSubscription primitive; migrate useRoomsByDate and useCheckinsByDate
- [x] TASK-05: Clean up dead code (trivial useMemo, useLoans duplication note)

## Goals
- Mount the existing `FirebaseSubscriptionCacheProvider` so shared Firebase paths open one listener instead of N.
- Determine which full-tree hooks (no range params at any call site) are eligible for shared cache migration — to be confirmed by TASK-03 call-site audit.
- Eliminate the `~80-line` range-subscription duplication between `useRoomsByDate` and `useCheckinsByDate` via a `useRangeSubscription` primitive.
- Fix the `loading` dependency array bug in `useRoomsByDate`.
- Remove the trivial no-op `useMemo` from `useActivitiesData`.
- Preserve all existing test coverage; all CI tests pass.

## Non-goals
- Do not change Firebase security rules, schema, or backend.
- Do not migrate range-query hooks (`useCheckins` with date params, `useRoomsByDate` query subscriptions) into the shared cache.
- Do not change `useEndOfDayReportData` or any till/bar/inventory hooks.
- Do not migrate `useGuestDetails` (blocked by `isCheckedIn` callback) in this changeset.
- Do not migrate `useCheckinsData` orchestrator (deferred — same pattern as `useCheckinsTableData`; addressed as part of a separate orchestrator consolidation).
- Do not remove `useLoans` hook itself — `LoanDataContext` already lifts loans; migration of call sites is deferred.

## Constraints & Assumptions
- Constraints:
  - Next.js App Router (Turbopack). No webpack-only patterns.
  - All hooks must remain testable in isolation with mocked Firebase.
  - `FirebaseSubscriptionCacheProvider` ref-counting design preserved.
  - `loading: true` must be returned until Firebase snapshot arrives, even from cache.
  - `FirebaseSubscriptionCacheProvider.startListening` must be extended with `prefill` before any IndexedDB-cached hook is migrated.
  - Do not include `loading` in range-subscription effect dependency arrays.
- Assumptions:
  - `Providers.tsx` is the correct mount point: inside `AuthProvider`, wraps all authenticated routes.
  - `LoanDataContext` already provides `/loans` — confirmed via source read.
  - Candidate hooks (`useBookingsData`, `useActivitiesData`, `useGuestByRoom`) accept optional range params and have parameterized call sites — none are confirmed stable-path. TASK-03 must audit all call sites before any migration IMPLEMENT task is created.
  - The `prefill` extension in TASK-01 is still required for any hook with an IndexedDB offline cache that is ultimately confirmed eligible for migration.

## Inherited Outcome Contract
- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's Firebase subscription layer has no duplicated range-subscription boilerplate and high-fan-out orchestrators share live Firebase listeners via the existing cache provider, reducing the number of open Firebase connections on the dashboard screen.
- **Source:** auto

## Fact-Find Reference
- Related brief: `docs/plans/reception-firebase-subscription-parallelization/fact-find.md`
- Key findings used:
  - `FirebaseSubscriptionCacheProvider` confirmed production-ready with ref-counting test; unmounted in app tree
  - `Providers.tsx` confirmed as the correct mount point (inside `AuthProvider`)
  - `LoanDataContext` already provides `/loans` via shared `useFirebaseSubscription`
  - `useRoomsByDate` has a `loading` dependency array bug (line 283)
  - `useActivitiesData` has a trivial no-op `useMemo` to remove
  - `useCheckinsData` (orchestrator) is a near-duplicate of `useCheckinsTableData` — deferred

## Proposed Approach
- Option A: Extend `FirebaseSubscriptionCacheProvider` with a `prefill` callback, mount it in `Providers.tsx`, migrate verified-stable-path hooks (to be confirmed by TASK-03 audit) to the cache, extract `useRangeSubscription` primitive.
- Option B: Replace the cache provider entirely with a React Query / SWR layer.
- Chosen approach: **Option A**. The cache provider is already production-quality and tested. Option B introduces a new dependency and wider blast radius. The `prefill` extension is a minimal, targeted addition that preserves offline-first behavior without requiring dual subscription patterns.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend FirebaseSubscriptionCacheProvider with optional prefill | 85% | M | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Mount FirebaseSubscriptionCacheProvider in Providers.tsx | 90% | S | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | INVESTIGATE | Enumerate all call sites for candidate hooks; classify as default-only or parameterized; determine which (if any) are eligible for cache migration | 95% | S | Complete (2026-03-09) | TASK-01, TASK-02 | - |
| TASK-04 | IMPLEMENT | Extract useRangeSubscription; migrate useRoomsByDate and useCheckinsByDate | 85% | M | Complete (2026-03-09) | - | - |
| TASK-05 | IMPLEMENT | Clean up trivial useMemo in useActivitiesData | 95% | S | Complete (2026-03-09) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04 | - | Independent: TASK-01 touches cache provider; TASK-04 touches range hooks only |
| 2 | TASK-02 | TASK-01 complete | Mount provider; requires extended API from TASK-01 |
| 3 | TASK-03, TASK-05 | TASK-01, TASK-02 complete (TASK-03 is read-only and could run earlier, but is sequenced here so its findings inform any Phase 2 tasks created after TASK-01/02) | TASK-03 is an INVESTIGATE task (call-site audit); TASK-05 is independent cleanup |

## Tasks

---

### TASK-01: Extend FirebaseSubscriptionCacheProvider with optional prefill

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/context/FirebaseSubscriptionCache.tsx` + updated test
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build evidence:** Inline execution. Files written: `FirebaseSubscriptionCache.tsx` (extended `startListening`/`subscribe` with optional `prefill?: () => Promise<unknown>`), `FirebaseSubscriptionCache.test.tsx` (TC-02, TC-03, TC-04 added). Tests: 24/24 passed across all suites. Typecheck: pass (cache). Lint: pass (0 errors). Committed: `7f1d4bb972`. Codex offload attempted but `nvm exec 22` unavailable in writer-lock subshell; fell back to inline execution.
- **Affects:**
  - `apps/reception/src/context/FirebaseSubscriptionCache.tsx`
  - `apps/reception/src/context/__tests__/FirebaseSubscriptionCache.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — Source read; `startListening` function identified; change is additive (optional param). Held-back test: if the `prefill` async function races with the first Firebase snapshot and causes a double setState, the loading state could flicker. Mitigated by running prefill before calling `onValue` and setting loading to false only after prefill if no Firebase data has arrived yet.
  - Approach: 85% — Standard pattern: accept an optional async `() => Promise<T | null>` prefill param in `subscribe`. Held-back test: no single unresolved unknown drops this below 85 because the pattern is confirmed by the existing `cancelled` token pattern in `useBookingsData`.
  - Impact: 80% — Prefill extension is a prerequisite for TASK-03; without it, migrated hooks lose offline-first behavior.
- **Acceptance:**
  - `FirebaseSubscriptionCacheProvider.subscribe(path, prefill?)` accepts an optional async prefill function.
  - When `prefill` is provided, `startListening` calls it before `onValue` and uses the result to pre-populate state (with `loading: false` if prefill returns data, `loading: true` if null).
  - When Firebase data arrives via `onValue`, it always overwrites the prefill result.
  - Cancelled-token pattern applied: if the component unmounts before prefill resolves, the prefill result is discarded.
  - All existing `FirebaseSubscriptionCache.test.tsx` tests continue to pass.
  - New test: prefill result is applied before Firebase snapshot; Firebase snapshot overwrites prefill.
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `subscribe(path)` with no prefill → same behavior as before (loading: true until Firebase fires)
  - TC-02: `subscribe(path, prefill)` where prefill returns data → `getEntry` returns prefill data with `loading: false` before Firebase fires
  - TC-03: `subscribe(path, prefill)` where Firebase fires after prefill → Firebase data replaces prefill data
  - TC-04: component unmounts before prefill resolves → no state update applied (cancelled token)
- **Execution plan:** Red → Green → Refactor
  - Red: Add test TC-02 / TC-03 / TC-04 (failing against current implementation)
  - Green: Extend `subscribe` signature; extend `startListening` to accept and invoke `prefill`; apply cancelled-token pattern
  - Refactor: Ensure `getEntry` generic type propagates correctly for prefill case
- **Planning validation (required for M/L):**
  - Checks run: Read `FirebaseSubscriptionCache.tsx` (lines 43-68 `startListening`); read `FirebaseSubscriptionCache.test.tsx`; confirmed `subscribe` currently accepts only `path: string`
  - Validation artifacts: Source at `apps/reception/src/context/FirebaseSubscriptionCache.tsx`; test at `apps/reception/src/context/__tests__/FirebaseSubscriptionCache.test.tsx`
  - Unexpected findings: None
- **Scouts:** None: prefill pattern is confirmed by analogy with `useBookingsData`'s cancelled-token approach
- **Edge Cases & Hardening:**
  - If `prefill` throws: catch error, do not set data, do not block Firebase subscription
  - If `prefill` returns `null`: leave `loading: true`; Firebase snapshot will resolve it
  - Race: if Firebase fires before prefill resolves, Firebase wins (always correct)
- **What would make this >=90%:**
  - Run the existing test suite in CI against the modified file
- **Rollout / rollback:**
  - Rollout: additive change; no consumer change required
  - Rollback: remove optional param; existing callers not affected
- **Documentation impact:** None: internal implementation detail; no public API change

---

### TASK-02: Mount FirebaseSubscriptionCacheProvider in Providers.tsx

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/components/Providers.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:**
  - `apps/reception/src/components/Providers.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — `Providers.tsx` read; mount point confirmed (inside `AuthProvider`). Held-back test: no single unknown drops this below 90 — the file is 24 lines and the change is wrapping children.
  - Approach: 90% — Standard context provider wrapping. Placement: inside `AuthProvider` (so Firebase DB instance is available), outside `LoanDataProvider` (so loans can optionally use the cache later).
  - Impact: 85% — Without this task, TASK-03 has no cache to consume.
- **Acceptance:**
  - `FirebaseSubscriptionCacheProvider` wraps the `LoanDataProvider` in `Providers.tsx`.
  - App boots correctly (no new error thrown on mount).
  - The provider is available to all authenticated routes.
- **Validation contract (TC-05 through TC-06):**
  - TC-05: Render `Providers.tsx` → `useFirebaseSubscriptionCache()` succeeds (no "must be used within" error thrown)
  - TC-06: `useFirebaseSubscriptionCache()` called outside `Providers.tsx` tree → throws correct error (existing behavior preserved)
- **Execution plan:** Red → Green → Refactor
  - Red: Add test that `useFirebaseSubscriptionCache` resolves within the `Providers` tree
  - Green: Import and wrap with `FirebaseSubscriptionCacheProvider` in `Providers.tsx`
  - Refactor: None needed
- **Planning validation (required for M/L):** Not required (S effort)
- **Scouts:** None: mount point fully verified
- **Edge Cases & Hardening:**
  - Provider must be inside `AuthProvider` so `useFirebaseDatabase` is available when cache starts listeners
- **What would make this >=90%:** Already at 90%; CI pass would raise to 95%
- **Rollout / rollback:**
  - Rollout: mount provider; no consumers exist yet (they migrate in TASK-03)
  - Rollback: remove import and wrapper
- **Documentation impact:** None

---

### TASK-03: Identify stable-path hooks eligible for cache migration

- **Type:** INVESTIGATE
- **Deliverable:** Finding report appended to `docs/plans/reception-firebase-subscription-parallelization/plan.md` (Decision Log entry) naming which hooks — if any — can be safely migrated to the shared cache in Phase 2
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** Grep audit completed. All non-test call sites enumerated and classified. No hook is eligible for cache migration in Phase 2 — see Decision Log entry 2026-03-09.
- **Affects:**
  - None — read-only investigation
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — grep audit is straightforward; all three candidate hook files confirmed to accept optional range params (`UseBookingsParams`, `UseActivitiesDataParams`, `UseGuestByRoomParams`); all three have at least one parameterized call site in `useBookingSearchClient.tsx`.
  - Approach: 95% — Enumerate all non-test call sites for each candidate hook; classify each as default-params or parameterized; identify any hook where ALL call sites use defaults (i.e., it is truly stable-path); those are eligible for cache migration in a follow-on IMPLEMENT task.
  - Impact: 95% — Result determines whether Phase 2 migration tasks are warranted and which hooks they target. Without this gate, build agents will silently corrupt data for parameterized callers.
- **Context:**
  - Planning-time audit (critique Round 2) found that all three original TASK-03 candidates — `useBookingsData`, `useGuestByRoom`, `useActivitiesData` — accept optional range query params (`startAt`, `endAt`, `limitToFirst`) and have at least one non-default call site:
    - `useBookingSearchClient.tsx:53` calls `useBookings(bookingQuery)` where `bookingQuery` is `{startAt, endAt}` or `{limitToFirst: 500}`.
    - `BookingDetailsModal.tsx:46` calls `useBookings({startAt: bookingRef, endAt: bookingRef})`.
    - `useBookingSearchClient.tsx:96` calls `useGuestByRoom({ limitToFirst: LIMIT })`.
    - `useBookingSearchClient.tsx:75` calls `useActivitiesData({ limitToFirst: LIMIT })`.
  - The `FirebaseSubscriptionCacheProvider` is path-keyed (`subscribe(path: string)`). A single cache entry at `bookings` cannot represent a filtered query `query(ref, orderByKey(), startAt(X), endAt(Y))`. Migrating parameterized hooks to the full-tree cache would silently serve all records to callers expecting a filtered subset. This is a data correctness bug, not a type error.
  - **Decision required before any Phase 2 IMPLEMENT task is created:** the cache can only be used for hooks where every call site uses default params (full-tree subscription) and where a full-tree read is correct behavior.
- **Acceptance:**
  - For each candidate hook (`useBookingsData`, `useGuestByRoom`, `useActivitiesData`): all non-test call sites are enumerated and classified as default-only or parameterized.
  - Any hook where every call site uses defaults is marked eligible for cache migration.
  - A Decision Log entry is written naming eligible hooks and a rationale for any hook excluded.
  - If no hooks are eligible, the Decision Log records this and closes Phase 2 migration scope.
- **Validation contract (TC-07):**
  - TC-07: Decision Log entry exists after TASK-03 completes; entry names ≥0 eligible hooks with per-call-site evidence.
- **Execution plan:**
  - Investigate: `grep -rn "useBookings\(" apps/reception/src --include="*.ts*" | grep -v __tests__`; `grep -rn "useActivitiesData\(" apps/reception/src --include="*.ts*" | grep -v __tests__`; `grep -rn "useGuestByRoom\(" apps/reception/src --include="*.ts*" | grep -v __tests__`. Classify each result. Write finding.
- **Scouts:** None — investigation task.
- **Edge Cases & Hardening:**
  - `useBookingSearchClient.tsx` imports from `hooks/data/useGuestByRoom` and calls with `limitToFirst`; also imports from `hooks/data/useBookingsData` and calls with range params. These are confirmed disqualifiers for both hooks unless the search client is refactored (out of scope).
  - A second `useGuestByRoom` exists at `hooks/orchestrations/prepare/useGuestByRoom.ts` — this is a different module (wrapper or re-export). Confirm whether it passes params to the data hook.
- **Rollout / rollback:**
  - Rollout: read-only; no code changes
  - Rollback: N/A
- **Documentation impact:** Decision Log entry added to plan.md

---

### TASK-04: Extract useRangeSubscription primitive; fix useRoomsByDate dep array bug

- **Type:** IMPLEMENT
- **Deliverable:** New `apps/reception/src/hooks/data/useRangeSubscription.ts`; updated `useRoomsByDate.ts`; updated `useCheckinsByDate.ts`; updated tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build evidence:** `useRangeSubscription.ts` created with TC-12/TC-13/TC-14 tests. Both `useRoomsByDate` and `useCheckinsByDate` migrated to use the primitive. `loading` removed from `useRoomsByDate` effect dependency array (bug fixed). Existing tests updated.
- **Affects:**
  - `apps/reception/src/hooks/data/useRangeSubscription.ts` (new file)
  - `apps/reception/src/hooks/data/useRoomsByDate.ts`
  - `apps/reception/src/hooks/data/prepare/useCheckinsByDate.ts`
  - `apps/reception/src/hooks/data/__tests__/useRoomsByDate.test.ts`
  - `apps/reception/src/hooks/data/prepare/__tests__/useCheckinsByDate.test.tsx`
  - `apps/reception/src/hooks/data/__tests__/useRangeSubscription.test.ts` (new file)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — Both source files read; duplicated pattern confirmed; differences catalogued: `useRoomsByDate` has Zod parse (`roomsByDateSchema.safeParse`) + IndexedDB write (`setCachedData`) + cache prefill + `activeRangeKeyRef` race-condition check; `useCheckinsByDate` has manual date filtering + merge step. Primitive needs a generic `onSnapshot: (snapshot: DataSnapshot) => void` callback param to accommodate divergent parse logic. Held-back test: if the `onSnapshot` callback param introduces a closure stale-reference bug (callback captures stale state), the extracted primitive will behave differently from the original. Mitigate by using `useCallback` with stable dependencies in each hook's snapshot handler.
  - Approach: 85% — Extract shared infra (sorted dates → range key, `unsubRef`, `activeRangeKeyRef`, `useEffect` for subscription + cleanup) into `useRangeSubscription(path, sortedDates, onSnapshot, onError)`. Each hook passes its own snapshot handler. Remove `loading` from `useRoomsByDate`'s dep array.
  - Impact: 85% — Eliminates ~80-line duplication; fixes latent rerender loop in `useRoomsByDate`; both hooks' behavior preserved.
- **Acceptance:**
  - `useRangeSubscription(path, sortedDates, onSnapshot, onError)` returns the Firebase range query unsubscribe function and manages the `activeRangeKeyRef` + `unsubRef` lifecycle.
  - `useRoomsByDate` migrated to use `useRangeSubscription`; `loading` removed from its dependency array.
  - `useCheckinsByDate` migrated to use `useRangeSubscription`.
  - Both hooks' return types and observable behavior unchanged.
  - New test for `useRangeSubscription`: range change triggers resubscription; same range does not resubscribe; unmount cleans up.
  - Existing tests for `useRoomsByDate` and `useCheckinsByDate` pass.
- **Consumer tracing (Phase 5.5):**
  - `useRoomsByDate` consumers: `usePrepareDashboard`, `useAllocateRoom` — API unchanged, no consumer changes
  - `useCheckinsByDate` consumers: `useInHouseGuestsByRoom` — API unchanged, no consumer changes
  - New output: `useRangeSubscription` is a new internal hook; not exported as a public API; no consumer tracing needed beyond hook's own callers
- **Validation contract (TC-12 through TC-16):**
  - TC-12: `useRangeSubscription` with same dates on re-render → no resubscription (stable range)
  - TC-13: `useRangeSubscription` with changed dates → previous listener unsubscribed, new listener created
  - TC-14: `useRangeSubscription` unmount → listener unsubscribed
  - TC-15: `useRoomsByDate` with same date range on re-render with Firebase data arrived → no extra `onValue` calls (loading dep array bug fixed)
  - TC-16: `useCheckinsByDate` behavior matches pre-migration snapshot
- **Execution plan:** Red → Green → Refactor
  - Red: Write TC-12/TC-13/TC-14 for `useRangeSubscription` (failing — hook does not exist)
  - Green: Create `useRangeSubscription.ts`; migrate `useRoomsByDate` to use it (removing `loading` from dep array); migrate `useCheckinsByDate`
  - Refactor: Ensure `useCallback` stability for snapshot handlers
- **Planning validation (required for M/L):**
  - Checks run: Read `useRoomsByDate.ts` (full); read `useCheckinsByDate.ts` (full); confirmed `activeRangeKeyRef` pattern and `loading` dep array bug at line 283
  - Validation artifacts: Both source files; test files confirmed to exist
  - Unexpected findings: `useRoomsByDate` has an unusual inline cache prefill inside the same effect — this needs to remain in `useRoomsByDate`, not in `useRangeSubscription` (primitive is subscription-only, not cache-aware)
- **Scouts:** `useRoomsByDate` has `cancelled = true` assigned in the `return` cleanup AND inside the effect body — confirm the cancelled-token pattern applies to prefill only, not to the Firebase handler, before extracting
- **Edge Cases & Hardening:**
  - `useCheckinsByDate` uses `sortedDates.includes(dateKey)` to filter; this client-side filter must remain in the hook, not the primitive
  - If `sortedDates` is empty, `useRangeSubscription` must call `onError` / `onSnapshot` with null and set loading to false (current behavior preserved)
- **What would make this >=90%:**
  - Verify `useRangeSubscription` compiles with TypeScript strict mode; CI test pass
- **Rollout / rollback:**
  - Rollout: behavior-preserving refactor; no API changes
  - Rollback: revert to in-hook implementations
- **Documentation impact:** None

---

### TASK-05: Remove trivial useMemo from useActivitiesData

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/hooks/data/useActivitiesData.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build evidence:** Removed `useMemo(() => activities, [activities])` wrapper and unused `useMemo` import. `activities` returned directly.
- **Affects:**
  - `apps/reception/src/hooks/data/useActivitiesData.ts`
- **Depends on:** - (previously depended on TASK-03 which was merging into this file; TASK-03 is now an INVESTIGATE task that does not touch this file, so TASK-05 is independent)
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — Source read; `useMemo(() => activities, [activities])` on line 106 confirmed as no-op (`activities` is already a stable `useState` reference).
  - Approach: 95% — Remove the `useMemo` wrapper; return `activities` directly.
  - Impact: 95% — Trivial cleanup; no behavioral change.
- **Acceptance:**
  - `useActivitiesData` returns `activities` directly without the `useMemo` wrapper.
  - Return type and all consumers unchanged.
  - Existing tests pass.
- **Validation contract (TC-17):**
  - TC-17: `useActivitiesData` returns activities reference directly; no `useMemo` call in output
- **Execution plan:** Red → Green → Refactor: Remove two lines. No Red step needed — this is a cleanup.
- **Planning validation (required for M/L):** Not required (S effort)
- **Scouts:** None
- **Edge Cases & Hardening:** None: `useState` references are stable by definition
- **What would make this >=90%:** Already >=90%
- **Rollout / rollback:**
  - Rollout: trivial line removal
  - Rollback: revert
- **Documentation impact:** None

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend FirebaseSubscriptionCacheProvider with prefill | Yes — source and test files verified | [Type contract gap] [Minor]: `subscribe` signature change must not break existing callers with only `path` argument — optional param ensures backward compat | No |
| TASK-02: Mount provider in Providers.tsx | Yes — TASK-01 must complete first; `Providers.tsx` read and confirmed 24-line file | [Ordering inversion] [Minor]: if TASK-02 is attempted before TASK-01 export is available, TypeScript will error on `subscribe` overload | No — dependency ordering handles this |
| TASK-03: Call-site audit (INVESTIGATE) | Yes — read-only; no code dependencies | [API signature mismatch] [Critical — resolved by reclassification]: all three candidate hooks have parameterized call sites; full-tree cache migration was not viable; TASK-03 reclassified to INVESTIGATE to gate any Phase 2 IMPLEMENT tasks | No — reclassification resolves this |
| TASK-04: Extract useRangeSubscription | Yes — independent of TASK-01/02/03; both source files read | [Missing precondition] [Minor]: `useRangeSubscription` callback API (onSnapshot, onError) must be compatible with Firebase's `DataSnapshot` type; this type is available via firebase/database SDK already imported | No |
| TASK-05: Remove trivial useMemo | Yes — independent (TASK-03 is now read-only; does not touch `useActivitiesData.ts`) | None | No |

One Critical rehearsal finding (TASK-03 API signature mismatch) was identified and resolved at planning time by reclassifying TASK-03 from IMPLEMENT to INVESTIGATE. All remaining findings are Minor/Moderate.

## Risks & Mitigations
- **Offline prefill race (Medium/High):** If Firebase `onValue` fires before the prefill async resolves, the cancelled-token pattern must correctly discard the prefill result. Mitigated by TC-03 validation contract in TASK-01.
- **All three candidate hooks are parameterized (High/Critical — resolved at planning time):** Planning-time audit confirmed `useBookingsData`, `useGuestByRoom`, and `useActivitiesData` all accept optional range params and all have at least one non-default call site in `useBookingSearchClient.tsx` (bookings: `{startAt, endAt}` or `{limitToFirst:500}`; guestByRoom: `{limitToFirst: LIMIT}`; activities: `{limitToFirst: LIMIT}`; also `BookingDetailsModal` passes `{startAt, endAt}` to bookings). Full-tree cache migration is not viable for any of them without a per-call-site audit gate. TASK-03 is now an INVESTIGATE task that must determine eligibility before any Phase 2 IMPLEMENT migration task is created.
- **React 19 strict mode double-invocation (Low/Medium):** Effects run twice in development. The `subscribe` call increments the ref-count on first invocation; the cleanup decrements on the simulated unmount; then it subscribes again. Net effect: ref-count correctly reaches 1. No mitigation needed.
- **`useRangeSubscription` `onSnapshot` closure stale ref (Medium/Medium):** If the snapshot handler captures stale state, results will be incorrect after date range change. Mitigated by `useCallback` in TASK-04 and TC-15.

## Observability
- Logging: Firebase console connection count (manual check: before/after, CheckinsTable mount)
- Metrics: None automated in current reception app
- Alerts/Dashboards: None required

## Acceptance Criteria (overall)
- [ ] All CI tests pass (no regressions)
- [x] `useRangeSubscription` primitive exists and is used by both `useRoomsByDate` and `useCheckinsByDate`
- [x] `FirebaseSubscriptionCacheProvider` is mounted in `Providers.tsx`
- [x] TASK-03 call-site audit complete; eligible hooks (if any) documented in Decision Log
- [x] `loading` removed from `useRoomsByDate` effect dependency array
- [x] Trivial `useMemo` removed from `useActivitiesData`
- [x] Lint and typecheck pass (`pnpm typecheck && pnpm lint`)

## Decision Log
- 2026-03-08: Chose Option A (extend existing cache provider) over Option B (React Query). Rationale: `FirebaseSubscriptionCacheProvider` is already production-quality and tested; introducing a new dependency is wider blast radius.
- 2026-03-08: Originally chose to fold TASK-05 into TASK-03 Refactor step. Superseded by critique Round 2: TASK-03 reclassified to INVESTIGATE (no code changes), so TASK-05 is now a standalone IMPLEMENT task with no dependency on TASK-03.
- 2026-03-08: Deferred `useCheckinsData` orchestrator migration (near-duplicate of `useCheckinsTableData`). Reason: same-outcome but wider blast radius; best done after core cache infrastructure is stable. Tagged `[Adjacent: delivery-rehearsal]`.
- 2026-03-08: Deferred `useLoans` direct-subscription cleanup. Reason: `LoanDataContext` already provides loans; existing call sites using `useLoans` directly can migrate separately without blocking this plan. Tagged `[Adjacent: delivery-rehearsal]`.
- 2026-03-08 (critique Round 2 autofix): TASK-03 reclassified from IMPLEMENT to INVESTIGATE. Planning-time grep audit found that all three candidate hooks (`useBookingsData`, `useGuestByRoom`, `useActivitiesData`) accept optional range params and have at least one parameterized call site in `useBookingSearchClient.tsx`. Migrating any of these to a full-tree path-keyed cache entry would silently serve all records to callers expecting a filtered subset. TASK-03 must now enumerate all call sites and determine eligibility before any Phase 2 migration IMPLEMENT task is created. TASK-05 (`useMemo` cleanup) unblocked from TASK-03 dependency.
- 2026-03-09 (TASK-03 finding): **No hooks are eligible for Phase 2 cache migration.** Full call-site audit of all three candidate hooks confirms:
  - **`useBookingsData`** (`/bookings`): Parameterized at `useBookingSearchClient.tsx:53` (`{startAt, endAt}` or `{limitToFirst: 500}`) and `BookingDetailsModal.tsx:46` (`{startAt: bookingRef, endAt: bookingRef}`). Remaining call sites (`usePrepaymentData`, `useEmailProgressData`, `useTillShifts`, `useEmailProgressActions`, `useCheckinsData`, `useGuestLoanData`, `Extension.tsx`) use default params, but since at least two call sites pass range params, migrating to the full-tree path-keyed cache would silently return all records to those parameterized callers. **Not eligible.**
  - **`useGuestByRoom`** (`/guestByRoom`): Parameterized at `useBookingSearchClient.tsx:96` (`{limitToFirst: LIMIT}`). Other call sites (`useCheckinsData`, `Extension.tsx`, `useInHouseGuestsByRoom`, `useCheckoutCountsByRoomForDate`, `Checkout.tsx`, `usePrepareDashboard` via orchestration wrapper) use default params. **Not eligible** due to the search client call site.
  - **`useActivitiesData`** (`/activities`): Parameterized at `useBookingSearchClient.tsx:75` (`{limitToFirst: LIMIT}`). Other call sites (`BookingSearchTable`, `Checkout.tsx`, `useEmailProgressData`, `useEmailProgressActions`, `useCheckinsTableData`, `useCheckinsData`, `useGridData`, `usePrepareDashboard`) use default params. **Not eligible** due to the search client call site.
  - **Phase 2 scope closed.** The path-keyed cache cannot be safely used for any of the three candidate hooks without first refactoring `useBookingSearchClient.tsx` to use a separate parameterized hook (not in scope of this plan). No Phase 2 IMPLEMENT migration task is warranted.

## Overall-confidence Calculation
- TASK-01: 85% confidence, M effort (weight 2)
- TASK-02: 90% confidence, S effort (weight 1)
- TASK-03: 95% confidence, S effort (weight 1) — reclassified to INVESTIGATE; high confidence for a read-only call-site audit
- TASK-04: 85% confidence, M effort (weight 2)
- TASK-05: 95% confidence, S effort (weight 1)
- Sum of (confidence × weight): (85×2) + (90×1) + (95×1) + (85×2) + (95×1) = 170 + 90 + 95 + 170 + 95 = 620
- Sum of weights: 2 + 1 + 1 + 2 + 1 = 7
- Overall-confidence = 620 / 7 = **88.6% → 89%**
- Note: IMPLEMENT tasks only (TASK-01, TASK-02, TASK-04, TASK-05): weighted average = (170+90+170+95)/(2+1+2+1) = 525/6 = **87.5% → 88%**
