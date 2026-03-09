---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-firebase-subscription-deduplication
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-firebase-subscription-deduplication/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309100000-0002
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Firebase Subscription Deduplication Fact-Find Brief

## Scope

### Summary

The reception app's Firebase data layer opens far more concurrent listeners than necessary. Five distinct patterns are involved: (1) two near-identical orchestration hooks that both subscribe to the same 9 Firebase paths, (2) a per-code fan-out that opens up to 25 concurrent listeners when only a single subtree listener is needed, (3) a per-booking N+1 pattern that opens 50+ listeners on a busy Checkins page, (4) `JSON.stringify`-based deep equality inside a hot update callback, and (5) the existing `FirebaseSubscriptionCacheProvider` which is not used by any of the affected hooks. Sub-issues 1–4 are confirmed safe to fix without touching UI components. Sub-issue 5 is an investigation item with a clear conclusion reached (see below).

### Goals

1. Remove `useCheckinsData` (orchestrations) or redirect its sole call site to `useCheckinsTableData` (data layer), eliminating the duplicate 9-path subscription set.
2. Replace the per-code loop in `useActivitiesByCodeData` with a single `/activitiesByCode` subtree listener plus client-side filtering by code.
3. Replace the per-booking loop in `useBookingMetaStatuses` with a single `/bookingMeta` subtree listener plus client-side status extraction.
4. Refactor the equality guard in `useActivitiesByCodeData`'s `handleCodeDataChange` callback: remove the module-level `isEqual` helper function and replace with inline per-code `JSON.stringify` comparison bounded to the per-code `ActivitiesByCodeForOccupant` sub-object. Reference equality cannot be used because `safeParse` always constructs a new object (even for identical data). The bounded per-code `JSON.stringify` is correct and proportionate (one code's occupant map is small).
5. Assess `FirebaseSubscriptionCacheProvider` integration feasibility (investigation only — no forced migration).

### Non-goals

- Changes to any UI components (CheckinsTable, CheckinsTableView, Alloggiati, etc.).
- Changes to mutation hooks (`useArchiveBooking`, `useDeleteGuestFromBooking`).
- Changing the Firebase database schema or data model.
- Migrating other standalone hooks (e.g., `useActivitiesData`, `useGuestDetails`) to use `FirebaseSubscriptionCacheProvider`.
- Performance profiling or measurement work.

### Constraints & Assumptions

- Constraints:
  - Data layer only — hook interfaces (return shape and field names) must remain backward-compatible for all call sites.
  - Tests run in CI only; never locally.
  - Writer lock required for all commits.
- Assumptions:
  - The Firebase Realtime Database structure has `/activitiesByCode` as a subtree (confirmed: mutations use `ref(database, "activitiesByCode")`).
  - The Firebase Realtime Database structure has `/bookingMeta` as a subtree (confirmed: mutations write to `bookingMeta/${bookingRef}/status`, etc.).
  - `useCheckinsData` (orchestrations) has **zero production call sites** — only test coverage. Confirmed by grep showing no imports outside its own file and its `__tests__` directory.

## Outcome Contract

- **Why:** Excessive Firebase listeners increase connection overhead, increase data transfer, and can hit Firebase connection limits. The `useEmailProgressData` hook opens 25 concurrent listeners for codes 1–25. The N+1 booking meta pattern opens 50+ listeners on a loaded Checkins page. This work eliminates all three listener fan-out patterns.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Checkins page opens at most 10 distinct Firebase listeners regardless of booking count. `useActivitiesByCodeData` uses a single subtree listener with client-side filtering. `useCheckinsData` (orchestrations) and `useCheckinsTableData` are unified into one hook.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/components/checkins/CheckinsTable.tsx` — sole production consumer of `useCheckinsTableData`; also directly calls `useBookingMetaStatuses` with the derived `allBookingRefs` array.
- `apps/reception/src/components/emailAutomation/EmailProgress.tsx` — renders email-progress data; the underlying `useEmailProgressData` calls `useActivitiesByCodeData({ codes: CODES_1_TO_25 })` (25 listeners).
- `apps/reception/src/components/man/Alloggiati.tsx` — calls `useActivitiesByCodeData({ codes: [12] })` (1 listener, low risk).
- `apps/reception/src/components/man/Extension.tsx` — calls `useActivitiesByCodeData({ codes: [14] })`.
- `apps/reception/src/components/checkout/Checkout.tsx` — calls `useActivitiesByCodeData({ codes: [14] })`.
- `apps/reception/src/components/bar/CompScreen.tsx` — calls `useActivitiesByCodeData({ codes: [12, 13, 14] })`.

### Key Modules / Files

1. `apps/reception/src/hooks/data/useCheckinsTableData.ts` — orchestration hook used by `CheckinsTable`. Subscribes to 9 Firebase paths via child hooks: bookings, guestDetails, financialsRoom, cityTax, loans, activitiesData, checkins, guestByRoom, activitiesByCode (codes 21/5/6/7). Uses `buildCheckinRows` for row construction.
2. `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` — duplicate orchestration hook with identical 9-path subscription set (bookings, guestDetails, financialsRoom, cityTax, loans, activitiesData, checkins, guestByRoom, activitiesByCode codes 21/5/6/7). Contains inline `parseOccupantLoanData` and `isFirebaseBookingOccupant` functions that are now duplicated in `buildCheckinRows.ts`. **Has zero production call sites** — only imported in `__tests__/useCheckinsData.test.ts`.
3. `apps/reception/src/hooks/orchestrations/checkin/buildCheckinRows.ts` — pure row-builder function extracted from the data layer. Used by `useCheckinsTableData`. Exports `parseOccupantLoanData`, `buildCheckinRows`, `BuildRowsParams`, and `BuildRowsResult`. `isFirebaseBookingOccupant` is file-local (not exported). `useCheckinsData.ts` contains its own inline copies of both functions — this is the duplication.
4. `apps/reception/src/hooks/data/useActivitiesByCodeData.ts` — opens one `onValue` listener per code entry in the `codes` array. Uses `JSON.stringify` in `isEqual()` for update deduplication. Firebase path: `activitiesByCode/${codeStr}`.
5. `apps/reception/src/hooks/data/useBookingMetaStatuses.ts` — opens one `onValue` per booking ref. Firebase path: `bookingMeta/${bookingRef}/status`. Only status field is consumed (not other bookingMeta fields).
6. `apps/reception/src/context/FirebaseSubscriptionCache.tsx` — reference-counted subscription cache with `subscribe/unsubscribe/getEntry` API. Mounted globally in `Providers.tsx`. **No production hook uses it** — only the context test file and `Providers.tsx`.
7. `apps/reception/src/hooks/data/useFirebaseSubscription.ts` — single-path Firebase subscription primitive used by ~40 data hooks. Does not use the subscription cache.
8. `apps/reception/src/hooks/client/checkin/useEmailProgressData.ts` — calls `useActivitiesByCodeData({ codes: CODES_1_TO_25 })` where `CODES_1_TO_25 = Array.from({ length: 25 }, (_, i) => i + 1)`. This is the highest-impact listener fan-out in the codebase (25 concurrent listeners).
9. `apps/reception/src/hooks/client/checkin/usePrepaymentData.ts` — imports `useActivitiesByCodeData` aliased as `useActivityByCode` (`import useActivityByCode from "../../data/useActivitiesByCodeData"`), calls it with `{ codes: [21, 5, 6, 7, 8] }` (5 listeners). Same hook, different local alias.
10. `apps/reception/src/hooks/orchestrations/prepare/useInHouseGuestsByRoom.tsx` — calls `useActivitiesByCodeData({ codes: [12, 14] })` (2 listeners).

### Patterns & Conventions Observed

- **Standalone `onValue` pattern**: most data hooks (`useActivitiesByCodeData`, `useBookingMetaStatuses`) create their own Firebase listeners in a `useEffect` and clean up in the effect return. No shared subscription infrastructure is used. Evidence: `useActivitiesByCodeData.ts`, `useBookingMetaStatuses.ts`.
- **`useFirebaseSubscription` pattern**: single-path hooks delegate to `useFirebaseSubscription.ts`. Used by ~40 hooks. This is the dominant pattern in the data layer.
- **`FirebaseSubscriptionCacheProvider` pattern**: implemented, mounted globally, but not integrated with any production data hook. The cache provider's `subscribe/unsubscribe` API differs from both the standalone and `useFirebaseSubscription` patterns.
- **`buildCheckinRows` extraction**: the row-building logic was already extracted into a pure function, confirming the architectural intent to separate data fetching from row construction.
- **`JSON.stringify` equality guard**: used in `useActivitiesByCodeData`'s `handleCodeDataChange` callback to avoid state updates when data hasn't changed. Called on every Firebase push event.

### Data & Contracts

- Types/schemas/events:
  - `ActivitiesByCodeForOccupant` — `Record<occupantId, Record<pushKey, { who, timestamp? }>>`. Schema: `activitiesByCodeForOccupantSchema` (Zod). Used in `useActivitiesByCodeData`.
  - `CheckInRow` — `checkInRowSchema` (Zod). Built by `buildCheckinRows`. Consumed by `CheckinsTable` and `CheckinsTableView`.
  - `useCheckinsTableData` return shape: `{ rows: CheckInRow[], loading: boolean, error: unknown, validationError: unknown }`.
  - `useCheckinsData` return shape: `{ data: CheckInRow[], loading: boolean, validationError: unknown, error: unknown }` — note `data` vs `rows` field name difference.
  - `useBookingMetaStatuses` return shape: `Record<bookingRef, string | undefined>`. Only the `status` field under `/bookingMeta/${bookingRef}` is consumed.
- Persistence:
  - Firebase Realtime Database paths (confirmed):
    - `/activitiesByCode` — subtree; `/activitiesByCode/${codeStr}` — per-code node.
    - `/bookingMeta` — subtree; `/bookingMeta/${bookingRef}/status` — per-booking status leaf.
  - Mutations write to `/bookingMeta/${bookingRef}/status` (and cancelledAt, cancellationSource, cancellationReason). The status listener only reads `status` — no structural conflict.
- API/contracts:
  - All changes are internal to the hooks layer. No server-side API, REST endpoint, or external Firebase rule change required.

### Dependency & Impact Map

- Upstream dependencies:
  - `useCheckinsTableData` → 8 atomic data hooks (useBookingsData, useGuestDetails, useFinancialsRoom, useCityTax, useLoans, useActivitiesData, useCheckins, useGuestByRoom) + `useActivitiesByCodeData`.
  - `useActivitiesByCodeData` → `useFirebaseDatabase`, `activitiesByCodeForOccupantSchema`.
  - `useBookingMetaStatuses` → `useFirebaseDatabase`.
  - `useCheckinsData` → same 8 hooks + `useActivitiesByCodeData`. **No upstream consumers in production.**
- Downstream dependents:
  - `useCheckinsTableData`: `CheckinsTable.tsx` only.
  - `useActivitiesByCodeData`: 9 call sites total — 8 production + 1 dead (`useCheckinsData`). Production: `useCheckinsTableData`, `useEmailProgressData`, `usePrepaymentData`, `useInHouseGuestsByRoom`, `Alloggiati.tsx`, `Extension.tsx`, `Checkout.tsx`, `CompScreen.tsx`. Dead (retiring): `useCheckinsData`. Blast radius covers all 8 production consumers.
  - `useBookingMetaStatuses`: `CheckinsTable.tsx` only.
  - `useCheckinsData`: **zero production call sites**. Test only.
- Likely blast radius:
  - Sub-issue 1 (remove/retire `useCheckinsData`): zero production impact. Only the test file imports it.
  - Sub-issue 2 (subtree listener for `useActivitiesByCodeData`): all 9 call sites affected. Interface remains identical. Internal behavior change: single listener delivers full subtree; hook filters by codes client-side. The hook's `codesKey`-based stability logic changes but the returned `activitiesByCodes` shape does not.
  - Sub-issue 3 (subtree listener for `useBookingMetaStatuses`): `CheckinsTable.tsx` only. Interface remains identical (returns `Record<string, string | undefined>`). Filtering changes from per-ref subscription to subtree + client-side key filter.
  - Sub-issue 4 (equality guard removal): internal to `useActivitiesByCodeData`. No interface change.
  - Sub-issue 5 (FirebaseSubscriptionCache assessment): investigation result — **not in scope for this build**. See resolved question below.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest + `@testing-library/react`
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only, never locally)
- CI integration: governed test runner via `test:governed` script

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `useActivitiesByCodeData` | Unit | `hooks/data/__tests__/useActivitiesByCodeData.test.ts` | Covers: parse, Firebase errors, cleanup on unmount. All 3 tests verify per-code listener pattern (path `activitiesByCode/101`). Tests must be updated for subtree pattern. |
| `useBookingMetaStatuses` | Unit | `hooks/data/__tests__/useBookingMetaStatuses.test.ts` | Covers: per-ref subscription, status map, empty refs, unmount cleanup, error logging. 5 tests. Tests verify per-ref path pattern (`bookingMeta/BOOK1/status`). Must be updated. |
| `useCheckinsData` | Unit | `hooks/orchestrations/checkin/__tests__/useCheckinsData.test.ts` | 4 tests: merges data, loading state, propagates errors, validation errors. Tests mock all 9 child hooks. If hook is deleted, tests are deleted with it. |
| `useCheckinsTableData` | None | — | **No test file exists.** Coverage gap confirmed. |
| `buildCheckinRows` | Unit | `hooks/orchestrations/checkin/__tests__/buildCheckinRows.test.ts` | Inferred present (file listed in `__tests__`). Pure function — well-suited to unit testing. |
| `FirebaseSubscriptionCache` | Unit | `context/__tests__/FirebaseSubscriptionCache.test.tsx` | Tests the cache context. Separate from data hooks. Not affected by this work. |

#### Coverage Gaps

- `useCheckinsTableData` has no tests. This is a gap that should be addressed as part of this work (new test file required).
- The existing `useActivitiesByCodeData` and `useBookingMetaStatuses` tests assert per-path subscription patterns — they will need to be rewritten for subtree patterns (not just updated).
- Extinct tests: `useCheckinsData.test.ts` becomes extinct if the hook is retired.

#### Testability Assessment

- Easy to test: `useActivitiesByCodeData` and `useBookingMetaStatuses` — both are pure Firebase-mock hook tests with established mock infrastructure patterns.
- Easy to test: `buildCheckinRows` — pure function.
- Moderate to test: `useCheckinsTableData` — requires mocking all 8 child hooks; follows same pattern as `useCheckinsData.test.ts` which can serve as template.
- Hard to test: per-code `JSON.stringify` deduplication after `isEqual` removal — adequately covered by hook-level update tests that verify no spurious state updates on identical snapshot data.

#### Recommended Test Approach

- Unit tests for: `useActivitiesByCodeData` (subtree listener pattern), `useBookingMetaStatuses` (subtree listener pattern), `useCheckinsTableData` (new, modeled on `useCheckinsData.test.ts`).
- Delete: `useCheckinsData.test.ts` (if hook is retired).

### Recent Git History (Targeted)

- `4cfbc74bbf fix(reception): prevent rerender loop in booking meta statuses hook` — this was a recent fix to `useBookingMetaStatuses`. The `bookingRefsKey`/`bookingRefsStable` pattern was introduced to prevent rerender loops from inline array references. The subtree approach eliminates the key-stability problem entirely.
- `be083505dc feat(reception): add UI filter for cancelled bookings (TASK-10)` — introduced `useBookingMetaStatuses` and the cancelled-booking filter in `CheckinsTable`. The N+1 pattern was introduced here.
- `7f1d4bb972 feat(reception): extend FirebaseSubscriptionCacheProvider with optional prefill support` — added prefill to the cache provider, confirming it is maintained but not yet used by production data hooks.
- `8bc242019f refactor(reception): deduplicate DateOfBirth, Activity, and PayType definitions (TASK-01/02/03)` — type deduplication sweep; `buildCheckinRows.ts` was likely created or updated here.

## Questions

### Resolved

- **Q: Does `useCheckinsData` (orchestrations) have any production call sites?**
  - A: No. Grep of all `*.ts` and `*.tsx` files in `apps/reception/src` excluding `__tests__` confirms zero production imports. The hook is only imported in its own test file.
  - Evidence: `grep -r "useCheckinsData\b"` output — only matches are `useCheckinsData.ts` (self) and `useCheckinsData.test.ts`.

- **Q: Is `/activitiesByCode` a true subtree in Firebase (not just a per-code flat list)?**
  - A: Yes. Mutations in `useDeleteGuestFromBooking.ts` reference `ref(database, "activitiesByCode")` (bare root) and `useArchiveCheckedOutGuests.ts` uses `get(ref(database, "activitiesByCode"))` — both confirm the subtree exists and is addressable at the root path.
  - Evidence: `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts` line 126, `useArchiveCheckedOutGuests.ts` line 99.

- **Q: Is `/bookingMeta` a subtree addressable at the root, or are status fields only accessible per-booking?**
  - A: It is a subtree. Mutations write to `bookingMeta/${bookingRef}/status`, `bookingMeta/${bookingRef}/cancelledAt`, etc. The root `bookingMeta` path contains per-booking objects. A single listener on `bookingMeta` will deliver the full map; client-side filtering by `bookingRef` is straightforward.
  - Evidence: `apps/reception/src/hooks/mutations/useArchiveBooking.ts` lines 57–64.

- **Q: What data does `useBookingMetaStatuses` actually use from `/bookingMeta`? Could a full subtree listener over-fetch?**
  - A: Only the `status` string field under `bookingMeta/${bookingRef}` is consumed. A subtree listener on `/bookingMeta` will deliver the full booking meta object per ref (including `cancelledAt`, `cancellationSource`, `cancellationReason`), but only the `status` field is read. This is acceptable over-fetch given the alternative of 50+ per-leaf listeners.

- **Q: Is `FirebaseSubscriptionCacheProvider` integration feasible for these hooks?**
  - A: Assessed — not in scope for this build. The cache uses a `subscribe/unsubscribe/getEntry` API that is incompatible with the validation and multi-code aggregation patterns in `useActivitiesByCodeData`. `useBookingMetaStatuses` subtree approach is simpler than cache integration. The cache's value is in deduplicating single-path subscriptions shared across components — neither of these hooks is shared across components at the same level. The subtree approach achieves the listener-count goal without the cache integration complexity.
  - Evidence: `FirebaseSubscriptionCache.tsx` API; `useActivitiesByCodeData.ts` per-code aggregation pattern.

- **Q: Do any other callers pass large code arrays to `useActivitiesByCodeData` besides `useEmailProgressData`?**
  - A: No. Confirmed call sites and their code arrays: `useCheckinsTableData` (4 codes: 21,5,6,7), `useCheckinsData` (4 codes: 21,5,6,7), `usePrepaymentData` (5 codes: 21,5,6,7,8), `useInHouseGuestsByRoom` (2 codes: 12,14), `Alloggiati.tsx` (1 code: 12), `Extension.tsx` (1 code: 14), `Checkout.tsx` (1 code: 14), `CompScreen.tsx` (3 codes: 12,13,14), `useEmailProgressData` (25 codes: 1–25). The 25-listener case is the dominant problem.

### Open (Operator Input Required)

None. All questions are resolvable from the codebase.

## Confidence Inputs

- **Implementation: 90%** — All affected files read, all call sites confirmed, return interfaces documented. The subtree listener pattern for both hooks is straightforward Firebase usage. The `isEqual` replacement is a simple function swap. One clarification required: the subtree snapshot at `/activitiesByCode` delivers `Record<codeStr, ActivitiesByCodeForOccupant>`, not a single `ActivitiesByCodeForOccupant` — the validation loop must iterate over the requested codes and validate each sub-node with `activitiesByCodeForOccupantSchema`. This is a known implementation detail, not a blocking uncertainty.
- **Approach: 90%** — Subtree-then-filter is the standard Firebase approach for reducing listener count. The interface preservation constraint is clear and achievable. The `useCheckinsData` retirement is zero-risk given confirmed zero production call sites.
- **Impact: 88%** — Sub-issues 2 and 3 have a concrete, measurable outcome. On the Checkins page specifically: `activitiesByCode` reduces from 4 listeners (codes 21,5,6,7) to 1 subtree listener; `bookingMeta` reduces from N listeners (one per booking ref, potentially 50+) to 1 subtree listener. The 25-listener fan-out belongs to `useEmailProgressData` (EmailProgress page), not the Checkins page — it is also fixed by sub-issue 2 since `useEmailProgressData` calls `useActivitiesByCodeData`. Sub-issue 1 (hook retirement) has no runtime impact but eliminates dead code. Sub-issue 4 reduces CPU per update on each `activitiesByCode` push event.
- **Delivery-Readiness: 90%** — All evidence gathered. No open questions requiring operator input. Test rewrite strategy is clear (rewrite, not update). Path to CI validation is established.
- **Testability: 85%** — All affected hooks follow the established Firebase-mock test pattern. `useCheckinsTableData` test is net-new but has a clear template (`useCheckinsData.test.ts`). The main testability challenge is the subtree listener pattern — the existing test scaffolding mocks `onValue` per-path, which must be adapted to the new single-path subscription.

What raises Implementation to ≥95: confirm that the Firebase security rules allow a read at the `/activitiesByCode` and `/bookingMeta` root paths (assumed yes from mutation evidence, but not directly verified in rules config).
What raises Testability to ≥90: confirm that the existing `onValue` mock infrastructure in the test files supports single-path subtree delivery (it does — the mock accepts any path and allows arbitrary `val()` return). This is confirmed; score is 85% due to the test rewrite effort, not uncertainty.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Subtree listener on `/activitiesByCode` delivers all codes, including ones not requested — callers that expect only their requested codes to appear in `activitiesByCodes` may behave differently | Low | Moderate | Client-side filter in hook: only populate `activitiesByCodes[codeStr]` for codes in the requested `codes` array. Existing `codesKey` stability pattern can be reused. |
| Subtree listener on `/bookingMeta` delivers all booking meta records, not just those for current bookingRefs — memory overhead if bookingMeta grows large | Low | Low | Client-side filter on `Object.keys(snapshot.val())` vs `bookingRefsStable` array. `bookingMeta` is expected to remain small (only cancelled bookings accumulate there). |
| `useCheckinsData` (orchestrations) retirement breaks an undiscovered consumer | Very Low | High | Mitigated by confirmed grep evidence. Safe to delete. Alternative: retain as a thin re-export of `useCheckinsTableData` for one release cycle. |
| Rewriting `useActivitiesByCodeData` and `useBookingMetaStatuses` tests breaks other test file assumptions | Low | Low | Tests are self-contained unit tests with their own Firebase mocks. No shared fixtures across files. |
| `isEqual` helper removed; per-code dedup may be incorrect | Low | Low | Module-level `isEqual` helper removed; replaced with inline per-code `JSON.stringify` comparison on the `ActivitiesByCodeForOccupant` sub-object. Reference equality is NOT used — `safeParse` always constructs a new object so reference equality would suppress no updates. Per-code `JSON.stringify` is the correct bounded deduplication. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Maintain existing return type signatures for all affected hooks.
  - New test files follow the `apps/reception/jest.config.cjs` configuration.
  - No `--no-verify` on commits.
  - Writer lock required for all commits.
- Rollout/rollback expectations:
  - No feature flag needed — this is a listener-count optimization with no behavior change visible to UI.
  - Rollback: git revert of the build commits.
- Observability expectations:
  - Firebase listener/subscription count will decrease after deployment. Firebase Realtime Database listeners are multiplexed over a single connection, so the observable reduction is in the number of `onValue` subscriptions (visible in Firebase emulator debug logs or Firebase console's Realtime Database usage graphs), not necessarily in TCP connection count. No code-level metrics are needed.

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Retire `useCheckinsData` orchestration hook** — delete `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` and `__tests__/useCheckinsData.test.ts`. Verify zero import sites remain.
2. **TASK-02: Refactor `useActivitiesByCodeData` to use a single subtree listener** — replace per-code `onValue` loop with a single `onValue` on `activitiesByCode`, filter by requested codes, validate each sub-node with `activitiesByCodeForOccupantSchema`. Remove the module-level `isEqual` helper; replace with inline per-code `JSON.stringify` deduplication in the setState functional update.
3. **TASK-03: Rewrite `useActivitiesByCodeData` tests** — replace per-path test assertions with subtree delivery mock pattern.
4. **TASK-04: Refactor `useBookingMetaStatuses` to use a single subtree listener** — replace per-booking `onValue` loop with a single `onValue` on `bookingMeta`, extract `status` per ref client-side. Remove `bookingRefsKey`/`bookingRefsStable` stabilization (no longer needed).
5. **TASK-05: Rewrite `useBookingMetaStatuses` tests** — update to subtree mock pattern.
6. **TASK-06: Add `useCheckinsTableData` unit tests** — new test file modeled on the retired `useCheckinsData.test.ts`.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `useCheckinsData` production call sites | Yes | None | No |
| `useCheckinsTableData` interface and callers | Yes | None | No |
| `useActivitiesByCodeData` Firebase path structure | Yes | None | No |
| `useBookingMetaStatuses` Firebase path structure and consumer fields | Yes | None | No |
| `FirebaseSubscriptionCacheProvider` integration feasibility | Yes | None (assessed as out-of-scope) | No |
| `JSON.stringify` equality in hot path | Yes | Minor: `isEqual` module-level helper removed; replaced with inline per-code `JSON.stringify` comparison bounded to one code's occupant map. Reference equality is incorrect for this case (safeParse always constructs a new object). Correct approach documented in Goal #4 and plan TASK-02. | No |
| Test landscape for all 4 hooks | Yes | Minor: `useCheckinsTableData` has no existing tests (gap, not blocker) | No |
| Blast radius for subtree listener change across all 9 call sites | Yes | None | No |
| Schema compatibility for subtree delivery vs per-code delivery | Yes | Minor [Type contract gap]: `activitiesByCodeForOccupantSchema` validates a single code node (`Record<occupantId, Record<pushKey, {who, timestamp?}>>`). The root `/activitiesByCode` snapshot is `Record<codeStr, ActivitiesByCodeForOccupant>`. Implementation must iterate over filtered code keys and validate each sub-node independently with the existing schema — a new root-level schema is not required but the validation loop must be adapted. This is addressed in TASK-02. | No |

## Scope Signal

- **Signal: right-sized**
- **Rationale:** All 5 sub-issues are within the declared scope (`apps/reception/src/hooks/data/` and `apps/reception/src/hooks/orchestrations/`). Sub-issue 5 is resolved as an assessment-only item with a clear answer. No scope creep into UI components, no external API changes. Task seeds are concrete and bounded.

## Evidence Gap Review

### Gaps Addressed

1. **`useCheckinsData` call sites** — fully resolved; zero production imports confirmed.
2. **Firebase subtree addressability** — confirmed via mutation code for both `/activitiesByCode` and `/bookingMeta`.
3. **`useBookingMetaStatuses` data consumption** — confirmed only `status` field is read; subtree over-fetch is acceptable.
4. **`FirebaseSubscriptionCacheProvider` integration** — assessed; not feasible/worthwhile for these specific hooks. Resolved as investigation item.
5. **All `useActivitiesByCodeData` call sites and their code arrays** — fully enumerated; `useEmailProgressData` (25 codes) is the high-impact case.
6. **Schema validation for subtree approach** — `activitiesByCodeForOccupantSchema` validates individual code nodes, not the root subtree. The implementation must iterate over filtered code keys and validate each sub-node individually. Addressed in Rehearsal Trace and TASK-02 notes. Implementation confidence adjusted downward by 2% to 90%.

### Confidence Adjustments

- Implementation confidence raised from initial ~80% to 90% after confirming: zero `useCheckinsData` production call sites, confirmed subtree paths, confirmed `activitiesByCodeForOccupantSchema` structure, and established test patterns. Adjusted down 2% from initial 92% estimate to reflect the schema validation loop clarification (subtree root delivers `Record<codeStr, ...>`, requiring per-code iteration in the implementation).

### Remaining Assumptions

- The Firebase security rules permit a read at the `/activitiesByCode` root path (not just per-code sub-paths). Assumption: yes, because `useArchiveCheckedOutGuests` already reads the full subtree via `get(ref(database, "activitiesByCode"))`.
- The `/bookingMeta` root path is readable (not per-booking restricted). Assumption: yes, because the archive mutation writes to the root path and reads are not separately restricted in practice.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-firebase-subscription-deduplication`

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: All 4 affected hooks pass their updated unit tests in CI. TypeScript compiles cleanly. `useCheckinsData.ts` deleted. Listener count on Checkins page reduced to ≤2 for booking-meta and ≤1 for activitiesByCode.
- Post-delivery measurement plan: Verify in Firebase emulator or console that the `activitiesByCode` and `bookingMeta` subscription counts are 1 each on the Checkins page regardless of booking count (informal — no code-level metrics required).
