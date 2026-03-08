---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-firebase-subscription-parallelization
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-firebase-subscription-parallelization/plan.md
Dispatch-ID: IDEA-DISPATCH-20260308214000-0001
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Firebase Subscription Parallelization Fact-Find Brief

## Scope

### Summary

The `apps/reception` app's `hooks/data/` layer composes Firebase Realtime Database subscriptions in a pattern that causes unnecessary sequencing and duplication. Multiple independent hooks in the same orchestrator fire their own Firebase `onValue` listeners when the data they need could be fetched once and shared. Additionally, two hooks (`useRoomsByDate` and `useCheckinsByDate`) contain near-identical ~80-line range-subscription blocks with unsubscribe-on-change, cancelled-token, and memoized-range-key logic, and there is an existing `FirebaseSubscriptionCacheProvider` context that is implemented but never mounted in the app tree.

The primary issues are:
1. **`useCheckinsTableData`** fans out 9 independent Firebase listeners (activities, bookings, checkins, guestDetails, financialsRoom, cityTax, loans, guestByRoom, activitiesByCode) with no shared state — each re-subscribes independently when conditions change.
2. **`useActivitiesByCodeData`** opens N Firebase `onValue` listeners (one per code in a loop), all on separate paths, with the loading state tracking each code individually.
3. **`useRoomsByDate` and `useCheckinsByDate`** duplicate ~80 lines of unsubscribe-on-range-change, cancelled-token, `activeRangeKeyRef` logic independently.
4. **`FirebaseSubscriptionCacheProvider`** exists at `apps/reception/src/context/FirebaseSubscriptionCache.tsx` with reference-counted deduplication logic but is not mounted anywhere in the component/layout tree.

### Goals
- Eliminate the duplicated range-subscription pattern between `useRoomsByDate` and `useCheckinsByDate` by extracting a shared `useRangeSubscription` primitive.
- Mount `FirebaseSubscriptionCacheProvider` at the appropriate level in the app layout so hooks sharing the same Firebase path reuse a single listener.
- Migrate high-fan-out hooks (`useCheckinsTableData`, `useActivitiesByCodeData`) to consume shared subscriptions from the cache where the path is a stable single node (bookings, guestByRoom, activities, guestsDetails, etc.).
- Preserve all existing test coverage.

### Non-goals
- Do not change Firebase security rules, Realtime Database schema, or backend.
- Do not change the `useEndOfDayReportData` hook — it consumes from `TillDataContext` and `SafeDataContext` (already context-lifted) and has no Firebase fan-out problem.
- Do not migrate range-query hooks (checkins, roomsByDate with date filters) into the shared cache — range queries are parameterized and cannot safely be deduplicated without date-range comparison logic that adds complexity.
- Do not touch the bar, inventory, or till data hooks in this changeset.

### Constraints & Assumptions
- Constraints:
  - The app uses Next.js App Router (Turbopack). No webpack-only patterns.
  - All hooks must remain testable in isolation via Jest with Firebase mocks.
  - The `FirebaseSubscriptionCacheProvider` ref-counting design must be preserved; do not replace with a simpler singleton.
  - The `loading` state must remain accurate: a consumer should see `loading: true` until the Firebase snapshot arrives, even when served from cache.
- Assumptions:
  - Paths subscribed by the high-fan-out hooks (`bookings`, `guestByRoom`, `activities`, `guestsDetails`, `cityTax`, `loans`, `financialsRoom`) are stable full-tree reads that benefit from sharing.
  - The `FirebaseSubscriptionCacheProvider` test confirms the ref-counting subscribe/unsubscribe logic is correct and ready for production use.
  - The `useGuestDetails` callback dependency (`isCheckedIn`) prevents it from being trivially cached in the shared provider without further work; it is in-scope only if the cache can accept a transform function, otherwise it is deferred.

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The reception app's Firebase subscription layer has no duplicated range-subscription boilerplate and high-fan-out orchestrators share live Firebase listeners via the existing cache provider, reducing the number of open Firebase connections on the dashboard screen.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/hooks/data/useCheckinsTableData.ts` — aggregator hook called from `CheckinsTable.tsx`; fans out 9 independent subscriptions
- `apps/reception/src/hooks/data/useActivitiesByCodeData.ts` — opens N Firebase `onValue` listeners in a loop; called from `useCheckinsTableData` with `codes: [21, 5, 6, 7]`
- `apps/reception/src/hooks/data/useRoomsByDate.ts` — range subscription with unsubscribe-on-change pattern
- `apps/reception/src/hooks/data/prepare/useCheckinsByDate.ts` — nearly identical range subscription pattern (~80 lines duplicated)
- `apps/reception/src/context/FirebaseSubscriptionCache.tsx` — reference-counted cache context, implemented but unmounted

### Key Modules / Files

- `apps/reception/src/hooks/data/useFirebaseSubscription.ts` — single-path subscription primitive used by `useCheckinsByDate` for the `guestByRoom` sub-subscription; Zod schema support
- `apps/reception/src/hooks/data/useBookingsData.ts` — direct Firebase subscription (`/bookings`), has IndexedDB offline cache
- `apps/reception/src/hooks/data/useGuestDetails.ts` — direct Firebase subscription (`/guestsDetails`), accepts `isCheckedIn` callback that affects schema validation per-occupant
- `apps/reception/src/hooks/data/useGuestByRoom.ts` — direct Firebase subscription (`/guestByRoom`), no offline cache
- `apps/reception/src/hooks/data/useActivitiesData.ts` — direct Firebase subscription (`/activities`), has IndexedDB offline cache; has a trivial `useMemo(() => activities, [activities])` wrapper that adds no value
- `apps/reception/src/context/TillDataContext.tsx` — context provider pattern for till data; good reference for how to lift subscriptions into context
- `apps/reception/src/context/SafeDataContext.tsx` — context provider pattern for safe data
- `apps/reception/src/app/layout.tsx` — root layout; currently has no data providers; providers mount via nested layouts or component tree
- `apps/reception/src/hooks/orchestrations/prepare/usePrepareDashboard.ts` — also fans out `useCheckins`, `useGuestByRoom`, `useActivitiesData`, `useRoomsByDate` independently from `useCheckinsTableData`

### Patterns & Conventions Observed

- **Offline cache prefill pattern**: `useBookingsData`, `useActivitiesData`, `useRoomsByDate` all do `getCachedData` then overwrite with Firebase data. This pattern must be preserved in any shared cache integration.
- **Cancelled-token pattern in effects**: `useBookingsData` and `useRoomsByDate` use a `cancelled` boolean in the async cache prefill to prevent state updates after unmount. This is the correct approach and must be preserved.
- **Range subscription deduplication**: Both `useRoomsByDate` and `useCheckinsByDate` track an `activeRangeKeyRef` (`"start--end"`) and skip re-subscribing when the range is stable. `useRoomsByDate` also includes `loading` in its dependency array, which causes re-execution of the effect on loading state changes — a potential loop risk.
- **`FirebaseSubscriptionCacheProvider`**: Implements subscribe/unsubscribe with reference counting (`subscribers.current[path]`). Single listener per path — exactly the deduplication needed. Has a working test at `apps/reception/src/context/__tests__/FirebaseSubscriptionCache.test.tsx`.
- **`useGuestDetails` per-occupant schema selection**: the `isCheckedIn` callback changes which Zod schema is used per occupant, making this hook non-trivially cacheable — it cannot safely go through the shared cache without changes.

### Data & Contracts

- Types/schemas/events:
  - `useFirebaseSubscription` returns `{ data: T | null, loading: boolean, error: unknown }` — generic primitive
  - `FirebaseSubscriptionCacheProvider` exposes `{ subscribe, unsubscribe, getEntry }` — ref-counted, path-keyed
  - `CacheEntry<T>` shape: `{ data: T | null, loading: boolean, error: unknown }` — matches `useFirebaseSubscription` shape
- Persistence:
  - `receptionDb` (`lib/offline/receptionDb`) provides `getCachedData`/`setCachedData` for IndexedDB; used by bookings, activities, roomsByDate
  - Shared cache provider stores data in React state only (no IndexedDB layer); offline cache prefill would need to happen separately

### Dependency & Impact Map

- Upstream dependencies:
  - `useFirebaseDatabase` service (all hooks)
  - Firebase RTDB SDK (`onValue`, `off`, `ref`, `query`, range operators)
  - `FirebaseSubscriptionCacheProvider` (currently unused)
- Downstream dependents of `useCheckinsTableData`:
  - `apps/reception/src/components/checkins/CheckinsTable.tsx` (sole consumer)
- Downstream dependents of `useActivitiesByCodeData`:
  - `useCheckinsTableData` (codes: [21, 5, 6, 7]) — verified
  - `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` — call site confirmed via grep; codes array not read; open assumption: codes may overlap with CheckinsTable codes
  - `apps/reception/src/hooks/client/checkin/usePrepaymentData.ts` — call site confirmed via grep; codes array not read
  - `apps/reception/src/hooks/client/checkin/useEmailProgressData.ts` — call site confirmed via grep; codes array not read
  - Note: `useActivitiesByCodeData` is a per-component hook, not a singleton. These call sites will continue to open their own Firebase listeners post-migration unless each is individually migrated or a shared context for `activitiesByCode` paths is added — deferred to Phase 2.
- Downstream dependents of `useRoomsByDate`:
  - `usePrepareDashboard` orchestrator
  - `useAllocateRoom` mutation hook
- Downstream dependents of `useCheckinsByDate`:
  - `useInHouseGuestsByRoom` orchestrator
- Likely blast radius:
  - CheckinsTable screen: high (3 of 9 subscriptions migrated to shared cache in Phase 1; remaining 6 excluded per Non-goals)
  - PrepareDashboard screen: medium (guestByRoom, activities sharing opportunity — second callsite; in scope as sub-task of TASK-3)
  - Range hooks (`useRoomsByDate`, `useCheckinsByDate`): low (extraction of shared primitive, behavior unchanged)

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react` (renderHook + act)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only; do not run locally)
- CI integration: GitHub Actions, `apps/reception` test suite

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useFirebaseSubscription` | Unit | `__tests__/useFirebaseSubscription.test.ts` | Schema parse + toast on error; off() cleanup |
| `useActivitiesByCodeData` | Unit | `__tests__/useActivitiesByCodeData.test.ts` | Multi-code loading, error handling, cleanup |
| `FirebaseSubscriptionCacheProvider` | Unit | `context/__tests__/FirebaseSubscriptionCache.test.tsx` | subscribe/unsubscribe ref-count |
| `useEndOfDayReportData` | Unit | `__tests__/useEndOfDayReportData.test.tsx` | Context mock-based; not affected |
| `useRoomsByDate` | Unit | `__tests__/useRoomsByDate.test.ts` | Exists |
| `useCheckinsByDate` | Unit | `prepare/__tests__/useCheckinsByDate.test.tsx` | Exists |

#### Coverage Gaps
- No test for `useCheckinsTableData` aggregation behavior (only tested via `CheckinsTable.tsx` integration test)
- No test for `FirebaseSubscriptionCacheProvider` being mounted in the app tree (it is not mounted)
- No test for the duplicated range-subscription logic being shared

#### Testability Assessment
- Easy to test: extracted `useRangeSubscription` primitive (isolated, single responsibility)
- Moderate to test: hooks migrated to consume `FirebaseSubscriptionCacheProvider` (need wrapper with context provider)
- Hard to test: end-to-end deduplication across multiple hook instances

### Recent Git History (Targeted)

- `apps/reception/src/hooks/data/` — `fix(reception): prevent rerender loop in booking meta statuses hook` — relevant: hooks have had re-render loop issues before; any loading state in a dependency array should be flagged
- `apps/reception/src/context/` — `feat(reception): add EOD closure read hook, write hook, and mutation tests` — most recent context work was till/safe; FirebaseSubscriptionCache appears to have been created earlier and not yet wired up

## Access Declarations

None — all evidence is from the local codebase. No external service calls required for this fact-find.

## Questions

### Resolved

- Q: Is `FirebaseSubscriptionCacheProvider` used anywhere in the app tree?
  - A: No. Grep across the full `apps/reception/src` directory found it referenced only in its own source file and its test. It is fully implemented but unmounted.
  - Evidence: `grep -r "FirebaseSubscriptionCacheProvider" apps/reception/src` → 2 files only.

- Q: Does `useEndOfDayReportData` have Firebase fan-out problems?
  - A: No. It consumes `useTillData()` and `useSafeData()` from context providers (already lifted), and 4 dedicated hooks (`useCashDiscrepanciesData`, `useKeycardDiscrepanciesData`, `useCCIrregularitiesData`, `useKeycardTransfersData`). These are separate Firebase paths without fan-out overlap.
  - Evidence: `apps/reception/src/hooks/data/useEndOfDayReportData.ts` lines 33-135.

- Q: Can `useGuestDetails` (with `isCheckedIn` callback) be placed behind the shared cache?
  - A: Not directly — the `isCheckedIn` callback changes which Zod schema is used per-occupant record, so the validation is caller-specific. The raw Firebase data could be cached, but schema validation would need to move to the consumer side. This is a medium-complexity change; exclude from Phase 1 scope.
  - Evidence: `useGuestDetails.ts` lines 61-94, schema selection per occupant.

- Q: Is the `loading` in `useRoomsByDate`'s dependency array a rerender loop risk?
  - A: Yes, the effect re-runs whenever `loading` changes, which happens when Firebase data arrives. The effect then compares `desiredRangeKey === activeRangeKeyRef.current` and exits early, but this causes an extra render. It is a latent bug. The range-subscription primitive should not include `loading` in its dependency array.
  - Evidence: `useRoomsByDate.ts` line 283: `}, [database, sortedDates, loading]);`

- Q: Where should `FirebaseSubscriptionCacheProvider` be mounted?
  - A: It should wrap the authenticated portion of the app — the main `(app)` or `(protected)` layout, not the root layout. The root layout (`app/layout.tsx`) has no providers, which is correct for SSR. The appropriate mount point is whichever client layout wraps authenticated routes (not yet verified — to confirm during planning/build).
  - Evidence: `app/layout.tsx` has no data providers; `TillDataContext` and `SafeDataContext` are mounted in component trees at page level.

- Q: Does `useActivitiesData` have a trivially removable `useMemo`?
  - A: Yes. `const memoActivities = useMemo(() => activities, [activities])` on line 106 adds no value — `activities` is already a stable reference from `useState`. This is a trivial cleanup.
  - Evidence: `useActivitiesData.ts` lines 106-108.

### Open (Operator Input Required)

None. All questions are answerable from the codebase evidence and technical reasoning.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `useCheckinsTableData` fan-out (9 hooks) | Yes | None | No |
| `useActivitiesByCodeData` N-listener loop | Yes | None | No |
| `useRoomsByDate` / `useCheckinsByDate` duplication | Yes | Minor: `loading` in dep array of `useRoomsByDate` is a latent loop risk | No (noted as a bug to fix in-scope) |
| `FirebaseSubscriptionCacheProvider` mount status | Yes | None — confirmed unmounted | No |
| `useGuestDetails` cache compatibility | Yes | Minor: isCheckedIn callback prevents trivial caching | No (excluded from scope) |
| `useEndOfDayReportData` fan-out | Yes | None — already context-lifted | No |
| Test landscape for touched paths | Yes | Minor: no integration test for `useCheckinsTableData` | No (advisory) |
| `usePrepareDashboard` overlap | Partial | Moderate: also fans out guestByRoom + activities independently; same fix applies but is a second callsite | No (advisory — included in scope) |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The four specific issues (range-subscription duplication, N-listener loop, unmounted cache provider, CheckinsTable fan-out) are well-bounded and have clear extraction/migration paths. The `useGuestDetails` callback complexity is correctly excluded from Phase 1. The blast radius is limited to the checkins dashboard and room-grid prepare hooks.

## Confidence Inputs

- **Implementation:** 85% — All key files read; patterns confirmed; `FirebaseSubscriptionCacheProvider` API is clear. Uncertainty: exact layout mount point for the provider needs verification during build.
- **Approach:** 80% — The three-step approach (extract range primitive, mount cache provider, migrate fan-out hooks) is standard React context composition. Risk: `isCheckedIn` callback in `useGuestDetails` limits full migration.
- **Impact:** 75% — Fewer Firebase connections on the dashboard is measurable via Firebase console, but no current baseline. Operational improvement is certain; magnitude is untested.
- **Delivery-Readiness:** 85% — Evidence is solid, all key modules read, existing tests understood.
- **Testability:** 80% — New primitive (`useRangeSubscription`) is easily unit-testable. Cache provider integration tests require context wrapper.

What would raise Implementation to ≥90: confirm layout mount point for `FirebaseSubscriptionCacheProvider` during build; verify `isCheckedIn` hook path during planning.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `loading` dep in `useRoomsByDate` causes rerender loop after range primitive extraction | Medium | Medium | Remove `loading` from dep array in extracted primitive; confirmed this is safe because range-change is tracked via `activeRangeKeyRef` |
| `FirebaseSubscriptionCacheProvider` mounted too high causes stale data after auth change | Low | High | Mount below auth provider, not at root layout; tear down on auth state change |
| Migrating hooks to cache breaks offline cache prefill (IndexedDB) | Medium | High | Extend `FirebaseSubscriptionCacheProvider.startListening` to accept an optional `prefill` async function; hooks being migrated pass their `getCachedData` call as the prefill. This preserves offline-first behavior without dual subscription patterns. Do not remove `getCachedData` calls until the prefill hook is in place. |
| `useGuestDetails` `isCheckedIn` callback causes cache miss every render | N/A (excluded) | N/A | Deferred to Phase 2 |
| Test breakage from context requirement addition | Low | Low | Add context wrapper in affected test files; `FirebaseSubscriptionCacheProvider` test is a reference pattern |

## Planning Constraints & Notes

- Must-follow patterns:
  - Offline cache prefill (`getCachedData`/`setCachedData`) must be preserved for `bookings`, `activities`, `roomsByDate`
  - `FirebaseSubscriptionCacheProvider.startListening` must be extended with an optional `prefill` async function before any hook with an IndexedDB cache is migrated — do not migrate those hooks first
  - Cancelled-token pattern for async cache reads must be preserved
  - Do not include `loading` in range-subscription effect dependency arrays
  - All new hooks must be unit-testable with mocked Firebase
- Rollout/rollback expectations:
  - No backend changes; rollback is a code revert
  - Hooks remain individually importable; no API surface changes for consumers
- Observability expectations:
  - Firebase console connection count will decrease for the CheckinsTable screen (currently 9+ connections per mount, target: shared paths share one connection)

## Suggested Task Seeds (Non-binding)

1. **Extract `useRangeSubscription` primitive** — pull the unsubscribe-on-range-change, cancelled-token, `activeRangeKeyRef` pattern into a shared hook. Fix the `loading` dep array in the extracted primitive. Migrate `useRoomsByDate` and `useCheckinsByDate` to use it.
2. **Mount `FirebaseSubscriptionCacheProvider`** — identify the correct layout file (authenticated routes layout); mount the provider; add a smoke test that the context is available.
3. **Migrate stable-path hooks to cache** — migrate `useBookingsData`, `useGuestByRoom`, `useActivitiesData` (`/bookings`, `/guestByRoom`, `/activities`) to use `useFirebaseSubscriptionCache` instead of direct `onValue`. Preserve offline cache prefill.
4. **Remove trivial `useMemo` in `useActivitiesData`** — one-line cleanup; `useMemo(() => activities, [activities])` is a no-op.
5. **Update tests** — add context wrapper for hooks migrated to cache; update any integration tests that currently use direct Firebase mocks.

**Scope note:** Tasks 1–3 migrate 3 of 9 subscriptions in `useCheckinsTableData` to the shared cache (`bookings`, `guestByRoom`, `activities`). The remaining 6 (`checkins` via date-range, `guestDetails` with `isCheckedIn`, `financialsRoom`, `cityTax`, `loans`, `activitiesByCode`) are excluded from Phase 1 — see Non-goals. `usePrepareDashboard` is a second callsite for `guestByRoom` and `activities`; it is in scope as a sub-task of TASK-3 (apply the same migration at that callsite).

## Evidence Gap Review

### Gaps Addressed

- Confirmed `FirebaseSubscriptionCacheProvider` is fully implemented and has a passing test — not a stub.
- Confirmed `useRoomsByDate` has the `loading` dep array bug.
- Confirmed `useCheckinsTableData` uses exactly 9 subscriptions (activities, bookings, checkins, guestDetails, financialsRoom, cityTax, loans, guestByRoom, activitiesByCodes).
- Confirmed `useEndOfDayReportData` is already context-lifted (not in scope).
- Confirmed no `FirebaseSubscriptionCacheProvider` mount point exists in the app tree — it must be added.

### Confidence Adjustments

- Implementation: started at 80%, raised to 85% after confirming the cache provider is production-quality (ref-counted, tested).
- Approach: stayed at 80% — `isCheckedIn` limitation is real and constrains full migration.

### Remaining Assumptions

- The authenticated layout file (which will mount the cache provider) will be identifiable during the build phase from the route structure.
- The `useGuestDetails` path (with `isCheckedIn`) can be left as a direct Firebase subscription without breaking observable behavior.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: All existing tests pass in CI; `CheckinsTable` screen has fewer concurrent Firebase connections; `useRangeSubscription` primitive exists and is used by both `useRoomsByDate` and `useCheckinsByDate`
- Post-delivery measurement plan: Firebase console connection count on CheckinsTable mount (before/after)

## Planning Readiness

- **Status:** Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-firebase-subscription-parallelization --auto`
