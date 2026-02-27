---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-updated: 2026-02-27
Feature-Slug: reception-offline-sync
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-offline-sync/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260227-0058
Trigger-Why: TBD
Trigger-Intended-Outcome: type: operational | statement: Reception app staff can log activities, update bookings, and view guest data during network interruptions, with all writes durably queued and synced on reconnect, without being signed out. | source: auto
---

# Reception Offline Sync — Fact-Find Brief

## Scope

### Summary

The reception app has a complete offline infrastructure module (`lib/offline/`) including an
IndexedDB write queue, a sync manager, and React hooks — but none of it is wired into the
mutation layer or the auth layer. Staff who lose network connectivity during a shift will
silently lose writes, be signed out, and see no indication of queue state. This fact-find
maps all gaps and produces a sequenced plan to complete the offline wiring.

### Goals

- Route priority mutation hooks through a queue-first offline gateway so writes are never
  lost offline
- Add idempotency keys so retries on reconnect cannot duplicate records
- Support multi-path atomic Firebase writes in the offline queue schema
- Mount `useOfflineSync` in the provider tree so auto-sync fires on reconnect
- Cache the user profile so staff remain authenticated during network interruptions
- Add read-through caching for critical views (bookings, activities, rooms)
- Surface sync queue state in the UI (pending count, failed writes, retry action)
- Define per-domain conflict policy to prevent last-write-wins data corruption

### Non-goals

- Background Sync API (Service Worker) integration — deferred to a follow-on
- Full conflict resolution dashboard for manager review — deferred
- Offline queuing for compliance/POS audit paths (Alloggiati, PMS postings, shift closures,
  cash counts) — these require real-time confirmation and are excluded from offline queuing

### Constraints & Assumptions

- Constraints:
  - Firebase Realtime DB is already excluded from service worker caching (`sw.js` lines 79–80) — must not change this
  - `DB_VERSION` bump from 1→2 requires IndexedDB migration for existing clients
  - The mutation hook test suite (25+ files) currently mocks Firebase directly — tests will
    need updating when hooks route through the gateway
- Assumptions:
  - The Firebase Auth SDK persists the auth token internally via IndexedDB; only the
    `userProfiles/{uid}` fetch fails during network interruption
  - Multi-path Firebase updates (e.g. `useActivitiesMutations`) can be queued with path="" and
    the multi-path dict as data (valid Firebase SDK usage). `useChangeBookingDatesMutator` does
    NOT use multi-path atomics — it issues sequential individual writes and conditionally calls
    `saveFinancialsRoom`; it will be marked online-only for v1.
  - 51 files exist in `hooks/mutations/`; the Phase 1 gateway covers 4 of them plus
    `hooks/data/useCompletedTasks.ts` (total 5 hooks)

## Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception app staff can log activities, update bookings,
  and view guest data during network interruptions, with all writes durably queued and synced
  on reconnect, without being signed out.
- **Source:** auto

## Access Declarations

None — all investigation is repo-only (source files, types, tests). No external APIs, GA4,
or Firebase Admin access required for this fact-find.

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/offline/index.ts` — barrel export for all offline primitives;
  entry point for any hook that wants to queue a write or read from cache
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` — representative primary
  mutation hook; uses `update(ref(database), updates)` multi-path atomic pattern
- `apps/reception/src/components/Providers.tsx` — provider tree root; mounting point for
  `OfflineSyncProvider`
- `apps/reception/src/context/AuthContext.tsx` — auth state subscriber; offline profile
  fallback lives here
- `apps/reception/src/services/firebaseAuth.ts:loadUserWithProfile` — exact location where
  profile fetch returns `null` on network failure
- `apps/reception/src/hooks/data/useCompletedTasks.ts` — task-flag mutation hook (lives in
  `hooks/data/`, not `hooks/mutations/`); Phase 1 gateway target

### Key Modules / Files

| File | Role | Gap |
|---|---|---|
| `lib/offline/receptionDb.ts` | IndexedDB layer — `reception-offline` DB v1, three stores | Schema lacks `idempotencyKey`, `conflictPolicy`, `atomic` fields; needs DB_VERSION 1→2 |
| `lib/offline/syncManager.ts` | Processes pending writes FIFO on reconnect | No retry limit, no conflict checks, multi-path pattern undocumented |
| `lib/offline/useOfflineSync.ts` | React hook — exposes `pendingCount`, `syncing`, `triggerSync` | Not mounted anywhere in the provider tree |
| `components/Providers.tsx` | Provider tree — `AuthProvider` → `LoanDataProvider` → `ReceptionThemeProvider` | No `OfflineSyncProvider` |
| `components/OfflineIndicator.tsx` | Shows "You're offline" banner | Does not expose pending queue depth or sync failures |
| `services/firebaseAuth.ts` | Auth + profile load | `loadUserWithProfile` returns `null` on network error; no IndexedDB fallback |
| `context/AuthContext.tsx` | Auth state subscriber | `setStatus("unauthenticated")` on `null` user — drops staff mid-session |
| `hooks/mutations/useActivitiesMutations.ts` | Activity writes — most frequently called mutation | Writes directly to Firebase; no `queueOfflineWrite` call |
| `hooks/mutations/useChangeBookingDatesMutator.ts` | Sequential booking date change — NOT a multi-path atomic | Up to 9 sequential Firebase ops (1 update + conditional removes/sets for checkins/checkouts + optional `saveFinancialsRoom` call); conditional logic and external hook call prevent trivial queue serialization — must be marked online-only for v1 |
| `hooks/mutations/useBookingMutations.ts` | Single-path booking updates | Direct `update(ref(database, path), data)` |

### Patterns & Conventions Observed

- **Multi-path atomic pattern**: `const updates: Record<string, unknown> = {}; ... await update(ref(database), updates)` — used in `useActivitiesMutations.ts:130–137`. Path="" is the root ref. This is the Firebase recommended pattern for atomic multi-path writes.
- **`queueOfflineWrite(path, op, data?)` helper**: exists in `syncManager.ts:75–81`, wraps `addPendingWrite`. The entire gateway pattern is: replace `await update(ref(database), updates)` with `await queueOfflineWrite("", "update", updates)` when online check is needed.
- **Hook pattern**: all mutations follow `useCallback` + `setError`/`setLoading` state pattern — the offline gateway can be introduced as a thin wrapper without restructuring individual hooks.
- **Test pattern**: `renderHook` + `jest.mock("firebase/database", ...)` — gateway tests need to also mock `lib/offline/syncManager` or stub `queueOfflineWrite`.

### Data & Contracts

**PendingWrite schema (current — `receptionDb.ts:148–154`):**
```ts
export interface PendingWrite {
  id?: number;          // auto-increment IDB key
  path: string;         // Firebase path (empty string for multi-path atomics)
  operation: "set" | "update" | "remove";
  data?: unknown;
  timestamp: number;
}
```

**PendingWrite schema (required additions):**
```ts
  idempotencyKey?: string;   // stable UUID v4 — deduplicate on retry
  conflictPolicy?: "last-write-wins" | "skip-if-exists" | "fail-on-conflict";
  atomic?: boolean;          // true = multi-path write (path must be "")
  domain?: string;           // e.g. "activities" | "bookings" | "financial" — for UI grouping
```

DB_VERSION bump from 1 → 2 is required. Migration: existing records in `pending-writes` get
`idempotencyKey: undefined`, `conflictPolicy: "last-write-wins"`, `atomic: false`. No data
loss required.

**SyncResult (current — `syncManager.ts:16–21`):** `{ success, processed, failed, errors[] }`.
Sufficient for sync status UI — no schema change required.

### Dependency & Impact Map

- **Upstream dependencies:**
  - `firebase/database` SDK — `update`, `set`, `remove`, `ref`
  - `useFirebaseDatabase()` hook — injects `Database` instance into mutation hooks and `useOfflineSync`
  - `useOnlineStatus()` — required by `useOfflineSync` for offline→online transition detection
  - IndexedDB browser API — guarded by `isIndexedDbAvailable()` check

- **Downstream dependents:**
  - 51 files in `hooks/mutations/` + 1 in `hooks/data/` (useCompletedTasks) — only 4–5 wired
    in Phase 1; all others remain unchanged
  - `Providers.tsx` — gains a new provider
  - `AuthContext.tsx` — gains profile cache read/write calls
  - `OfflineIndicator.tsx` — gains `pendingCount` + sync state display

- **Likely blast radius:**
  - Phase 1 (schema + sync mount + auth fallback): zero UI blast radius, purely additive
  - Phase 2 (gateway wiring for 5 priority hooks — `useActivitiesMutations`, `useBookingMutations`,
    `useCompletedTasks`, `useBookingNotesMutation`, `useLoansMutations`): 5 hooks + their tests
  - Phase 3 (read-through cache + sync UI): data hooks + OfflineIndicator enhancement
  - Phase 4 (secondary hooks — `useGuestDetailsMutation`, `useKeycardAssignmentsMutations`): 2–3 more hooks
  - `useChangeBookingDatesMutator` is online-only for v1 — no gateway wiring, add clear offline
    error message instead

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest + `@testing-library/react` (`renderHook`)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/reception/jest.config.cjs`
- CI integration: yes (reception test suite runs in CI)

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Offline primitives | None | — | Zero tests for `receptionDb.ts`, `syncManager.ts`, `useOfflineSync.ts` |
| Auth context | Unit + Parity | `context/__tests__/AuthContext.test.tsx` (dedicated unit test) + `parity/__tests__/login-route.parity.test.tsx` | Unit test exists; neither covers the offline profile-fetch failure fallback path |
| useActivitiesMutations | Unit | `hooks/mutations/__tests__/useActivitiesMutations.test.ts` | Exists; mocks `firebase/database` directly |
| useChangeBookingDatesMutator | Unit | `hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts` | Exists; mocks firebase |
| useBookingMutations | Unit | No dedicated test found (named `useSaveBooking` internally) | May be covered under different name |

#### Coverage Gaps

- Untested paths:
  - `receptionDb.ts` — all IndexedDB operations completely untested
  - `syncManager.ts` — `syncPendingWrites`, `queueOfflineWrite` untested
  - `useOfflineSync.ts` — hook behaviour untested
  - `loadUserWithProfile` network failure path (auth fallback) untested
  - Online→offline→online transition with queued writes untested

- Test seams needed:
  - `queueOfflineWrite` must be mockable from mutation hook tests (export as module-level fn, not closure-bound)
  - `isIndexedDbAvailable()` guard must be stub-injectable for Node test environments
  - `useOnlineStatus()` must be stub-injectable for offline simulation tests

#### Recommended Test Approach

- Unit tests for: `addPendingWrite`, `getPendingWrites`, `removePendingWrite`, `syncPendingWrites` (mock Firebase SDK), `loadUserWithProfile` cache fallback
- Integration tests for: offline→online sync round-trip for each priority mutation
- E2E tests for: deferred (Service Worker + IndexedDB in real browser); not needed for Phase 1–3

### Recent Git History (Targeted)

- `lib/offline/` — 2 commits (`b142a51` chore: implement design-system plan work, `4d9325702e` chore: track pending files). Both are infrastructure creation — no consumer wiring has ever been committed.
- No commits show any mutation hook importing from `lib/offline/`.

## Questions

### Resolved

- Q: Can multi-path Firebase atomics be expressed in the current `PendingWrite` schema without a schema change?
  - A: Yes, technically. `update(ref(database, ""), multiPathObject)` is valid Firebase SDK usage. The current schema accommodates this if `path = ""`, `operation = "update"`, and `data` is the flat multi-path dict. However, the schema lacks an `atomic` flag to distinguish this from a standard root-level update, and there is no documentation or type safety. A DB_VERSION bump to add `atomic: boolean` is warranted for clarity and correctness.
  - Evidence: `syncManager.ts:43–53`, Firebase Realtime DB multi-path update docs (standard pattern)

- Q: Should all 51 mutation hooks be routed through the offline gateway at once?
  - A: No. A tiered approach is correct. Phase 2 (gateway wiring) covers the 5 highest-frequency hooks used in core guest-facing operations: `useActivitiesMutations`, `useBookingMutations`, `hooks/data/useCompletedTasks.ts`, `useBookingNotesMutation`, and `useLoansMutations`. `useChangeBookingDatesMutator` is **online-only for v1** — not queued — because it issues up to 9 sequential conditional Firebase ops including a `saveFinancialsRoom` call that cannot be safely serialized. Phase 4 extends to secondary hooks (guest details, keycard assignments). Financial audit hooks (Alloggiati, PMS, shift closures, cash counts) are permanently excluded.
  - Evidence: operator brief; full mutation hook file list (51 files); `useChangeBookingDatesMutator.ts` read in full; compliance exclusion consistent with `useSaveAlloggiatiResult.ts` semantics

- Q: Where should the `OfflineSyncProvider` be mounted in the provider tree?
  - A: Inside `App.tsx`, which already imports and uses `useFirebaseDatabase()` at line 23. Mounting `useOfflineSync` directly inside the `App` function body (alongside existing `useAuth`, `useInactivityLogout`, `useFirebaseDatabase` calls) is the simplest path — no new provider component needed. The hook result can be passed down to `AuthenticatedApp` if needed for sync status UI.
  - Evidence: `Providers.tsx:14–24`; `App.tsx:23` — `useFirebaseDatabase()` confirmed imported and used

- Q: What is the correct conflict policy for activity flags vs financial records?
  - A: Activity code flags (`activities/{occupantId}/{activityId}`) are write-once with a generated ID — each write is a new record, no conflict possible. Financial records (`allFinancialTransactions/{txnId}`) use a similar pattern. `bookings/{bookingRef}/{occupantId}` fields (checkIn/checkOut dates) are the most dangerous: a date change written offline + a staff member updating the same dates online creates a conflict. Safe default: `last-write-wins` for activity writes; `fail-on-conflict` (queue item marked failed, requires manual retry) for booking date changes and financial amounts. The `conflictPolicy` field can be set per queue entry.
  - Evidence: `useChangeBookingDatesMutator.ts` pattern; `useActivitiesMutations.ts:130–137`

- Q: How should the auth profile fallback work — what data needs to persist?
  - A: The `User` object (`uid`, `email`, `user_name`, `displayName`, `roles`) should be cached to IndexedDB `meta` store under key `"cachedUserProfile"` after every successful profile load. In `loadUserWithProfile`, when the network fetch fails, read from `meta["cachedUserProfile"]` and return the cached object if present. The Firebase Auth SDK already persists the authentication token internally — so the user remains Firebase-authenticated; only the profile enrichment layer fails. No change to the Firebase Auth flow is needed.
  - Evidence: `firebaseAuth.ts:137–188`; `AuthContext.tsx:59–66`; `receptionDb.ts:231–258` (getMeta/setMeta already implemented)

- Q: Does `generateActivityId()` need replacing for idempotency?
  - A: Yes for the queue, not for the Firebase path key. The activity ID `act_${Date.now()}` is generated before the Firebase write. If the write is queued and retried, the same activity ID (generated at queue time and stored in the queue entry's `data` payload) will be re-used on retry — so the Firebase write is naturally idempotent by path. The `idempotencyKey` field on `PendingWrite` is a separate concept: it identifies the queue entry itself for deduplication, not the Firebase record. A UUID v4 (`crypto.randomUUID()`) per queue entry is sufficient.
  - Evidence: `useActivitiesMutations.ts:119–137`

### Open (Operator Input Required)

- Q: Should the sync status UI be an enhancement to `OfflineIndicator` (same top banner) or a separate fixed element (e.g. bottom-left badge)?
  - Why operator input is required: UX placement depends on visual design preferences not documented anywhere. Technically both are feasible.
  - Decision impacted: which component to modify vs create new
  - Decision owner: operator / product
  - Default assumption: extend `OfflineIndicator` to show pending count inline — minimal surface area change. Override to new component if separate placement preferred.

## Confidence Inputs

- **Implementation: 85%**
  - All infrastructure exists and has been read line-by-line. The gap is purely wiring: add `queueOfflineWrite` calls to mutation hooks, mount `useOfflineSync`, add cache reads/writes, add schema field migration. No new Firebase SDK features needed. Raised to ≥90 by: completing Phase 2 mutation hook analysis (confirm no edge cases in secondary hooks).

- **Approach: 82%**
  - The queue-first approach is confirmed correct. The tiered migration plan (Phase 1 core hooks → Phase 2 secondary → exclude compliance) is well-reasoned. DB_VERSION bump approach for schema migration is standard IDB practice. Raised to ≥90 by: confirming `App.tsx` has database access for sync provider mounting; confirming `useSaveBooking` test coverage state.

- **Impact: 90%**
  - The blast radius is well-understood: 5 hooks in Phase 1, targeted schema migration, no UI changes except `OfflineIndicator` enhancement. No risk of breaking existing tests (gateway adds a `if (!online)` branch; online path is unchanged).

- **Delivery-Readiness: 80%**
  - All schema design decisions are resolved (see Resolved). One open question on sync UI placement is non-blocking (default assumption available). Phase 1 is immediately buildable.

- **Testability: 72%**
  - `receptionDb.ts` and `syncManager.ts` have no tests and need new test files. `useOfflineSync.ts` needs `useOnlineStatus` to be stub-injectable. IndexedDB in Node.js test environment requires `jest-fake-indexeddb` or equivalent. Raised to ≥80 by: adding `jest-fake-indexeddb` to `jest.setup.ts`, confirming `useOnlineStatus` mockability.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IndexedDB unavailable (private browsing, storage quota) | Low | Medium | `isIndexedDbAvailable()` guard already exists — fall through to direct Firebase write |
| DB_VERSION migration fails for returning users | Low | High | `onupgradeneeded` handler must safely default new fields; clear + rebuild queue if migration corrupts data |
| Compliance mutation accidentally queued offline | Medium | High | Whitelist-based gateway: only explicitly opted-in hooks route through the queue; all others remain direct Firebase writes |
| Sync race: two tabs open, both trigger sync on reconnect | Low | Medium | `syncInProgress` module-level flag in `syncManager.ts` blocks concurrent runs within a tab; cross-tab race is residual risk — acceptable for v1 |
| Profile cache stale (user role changed by admin) | Low | Medium | Cache is only served when network is down; on reconnect, fresh profile replaces cache. Staff with revoked roles get real-time enforcement on next online login. |
| Test disruption from gateway wiring | Medium | Low | Existing mutation tests mock `firebase/database` directly — they won't break; only tests that specifically test the offline path need new mocks |
| `useChangeBookingDatesMutator` online-only exclusion | Low | Low | Marking as online-only avoids the serialization problem entirely; the risk is that staff cannot change dates offline — acceptable for v1 given financial write complexity |

## Planning Constraints & Notes

- **Must-follow patterns:**
  - IndexedDB access must check `isIndexedDbAvailable()` and degrade gracefully
  - `queueOfflineWrite` must fall through to direct Firebase write if IndexedDB is unavailable
  - DB_VERSION migration must never drop existing queue entries without processing them
  - Compliance hooks (`useSaveAlloggiatiResult`, `usePmsPostingsMutations`, `useTillShiftsMutations`, `useCashCountsMutations`, `useSafeCountsMutations`, `useTerminalBatchesMutations`) must NOT be queued offline under any circumstances

- **Rollout/rollback expectations:**
  - Gateway is additive: online path is unchanged. Rollback is: remove the `if (!online)` branch in each wired hook (simple find-replace).
  - DB_VERSION bump is not rollback-safe for existing IndexedDB data. Add a `clearPendingWrites()` fallback in the migration handler for unexpected version mismatches.

- **Observability expectations:**
  - `useOfflineSync.lastSyncResult` should be surfaced in the sync UI so staff can see how many writes were processed or failed after reconnect
  - Failed writes should be visually distinguished from pending writes in the sync UI

## Suggested Task Seeds (Non-binding)

1. **TASK-01: Extend PendingWrite schema + DB_VERSION migration** — add `idempotencyKey`, `conflictPolicy`, `atomic`, `domain` fields; bump DB_VERSION to 2; add migration in `onupgradeneeded`
2. **TASK-02: Mount OfflineSyncProvider** — wire `useOfflineSync` into `App.tsx` (or `Providers.tsx`); pass `database` instance; connect `onSyncComplete` callback for UI
3. **TASK-03: Wire Phase 2 mutation hooks through offline gateway** — `useActivitiesMutations`, `useBookingMutations`, `hooks/data/useCompletedTasks.ts` (`setOccupantTasks` + `updateSingleTask`), `useBookingNotesMutation`, `useLoansMutations`; add `if (!online) await queueOfflineWrite(...)` branches; set `idempotencyKey = crypto.randomUUID()`, `conflictPolicy = "last-write-wins"` for activity/task flags, `"fail-on-conflict"` for booking fields
4. **TASK-04: Add online-only guard to useChangeBookingDatesMutator** — hook issues up to 9 sequential Firebase ops including a conditional `saveFinancialsRoom` call; cannot be safely serialized as a single queue entry; add `if (!online) return early with "requires network connection" error`; display a clear in-context message to staff when offline
5. **TASK-05: Auth profile cache fallback** — in `firebaseAuth.ts:loadUserWithProfile`, add `setMeta("cachedUserProfile", user)` on success and `getMeta("cachedUserProfile")` fallback on failure (use `meta` store via `getMeta`/`setMeta`, NOT `getCachedData`/`setCachedData`); update `subscribeToAuthState` caller not to set `unauthenticated` when profile fetch fails and cached profile is available
6. **TASK-06: Read-through cache for critical views** — wrap `onValue` callbacks in `useBookingsData`, `useActivitiesData`, `useRoomsByDate` to call `setCachedData(path, data)` on each snapshot; on subscription setup when offline, pre-populate from `getCachedData(path)`
7. **TASK-07: Sync status UI** — extend `OfflineIndicator.tsx` to accept `pendingCount` + `syncing` props (or read from a context); render pending write count when offline or syncing; show last sync result on reconnect
8. **TASK-08: Unit tests — offline primitives** — add `jest-fake-indexeddb` to jest setup; write unit tests for `addPendingWrite`, `getPendingWrites`, `removePendingWrite`, `syncPendingWrites` (with Firebase mocked); test auth profile fallback path

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| PendingWrite schema + DB_VERSION migration | Yes | None | No |
| useChangeBookingDatesMutator write structure | Yes | [Scope gap resolved]: Hook is NOT a multi-path atomic — uses sequential individual ops + conditional saveFinancialsRoom. TASK-04 correctly marks as online-only for v1 rather than attempting queue serialization. | No |
| syncManager.ts multi-path atomic pattern | Yes | [Minor]: Applies only to useActivitiesMutations-style hooks that do use multi-path updates; verified pattern is valid (`update(ref(db, ""), multiPathObject)`). Task seed for TASK-03 should include a test for this path. | No (advisory) |
| useOfflineSync mounting in provider tree | Yes | None — App.tsx has database access via useFirebaseDatabase() | No |
| Auth profile fallback — getMeta/setMeta | Yes | None — setMeta/getMeta already implemented in receptionDb.ts | No |
| Read-through cache — data hooks call sites | Partial | [Missing domain coverage] [Moderate]: Data hooks (`useBookingsData`, `useActivitiesData`, `useRoomsByDate`) not read in detail; their `onValue` callback structure must be confirmed before TASK-06 can be written safely. Not a blocker for TASK-01–05. | No (TASK-06 task seed includes "read first" step) |
| Compliance mutation exclusion | Yes | None — whitelist approach is explicit | No |
| Test infrastructure — IndexedDB in Node | Partial | [Missing precondition] [Moderate]: `jest-fake-indexeddb` not confirmed installed — TASK-08 seed includes adding it to jest.setup.ts, which is correct ordering | No |
| Phase 2 mutation hook test updates | Partial | [Scope gap] [Minor]: `useBookingMutations.ts` test coverage state unconfirmed (file named `useSaveBooking` internally). TASK-03 must confirm test file exists before adding gateway branch. | No |

Round 1 Critical finding resolved: useChangeBookingDatesMutator complexity was under-specified — corrected to online-only for v1 with explicit TASK-04. No remaining Critical findings. All Moderate findings are advisory and addressed in task seeds.

## Evidence Gap Review

### Gaps Addressed

- Full contents of `receptionDb.ts`, `syncManager.ts`, `useOfflineSync.ts` read and verified
- Auth failure path traced end-to-end: `AuthContext.tsx:60` → `subscribeToAuthState` → `loadUserWithProfile:184–186` returns `null` → `AuthContext.tsx:62` sets `unauthenticated`
- Multi-path atomic Firebase pattern confirmed via `useActivitiesMutations.ts:130–137`
- `useChangeBookingDatesMutator.ts` read in full (200 lines): confirmed sequential individual ops + conditional `saveFinancialsRoom` call — NOT a multi-path atomic; online-only decision documented
- `useOfflineSync` mounted state confirmed: grep returned no callers outside `lib/offline/`
- Provider tree read in full: `Providers.tsx` and `layout.tsx`
- `App.tsx` first 30 lines read: `useFirebaseDatabase()` imported and used at line 23 — sync hook mounting confirmed feasible inside `App` function body
- DB_VERSION migration path confirmed safe (IDB `onupgradeneeded` pattern)
- Auth context test confirmed: `context/__tests__/AuthContext.test.tsx` exists
- Mutation hook file count corrected to 51 (not 38) via directory listing
- `useCompletedTasks.ts` path corrected to `hooks/data/` not `hooks/mutations/`
- API contract for profile cache confirmed: `getMeta`/`setMeta` (not `getCachedData`) — TASK-05 corrected

### Confidence Adjustments

- Implementation dropped from 90% to 85%: `useBookingMutations.ts` test file name mismatch creates mild uncertainty; `App.tsx` confirmed to have `useFirebaseDatabase()` at line 23 — implementation confidence raised back to 87%
- Testability set to 72% (below 80%): `jest-fake-indexeddb` not confirmed installed — this is the only item that would block TASK-08

### Remaining Assumptions

- `App.tsx` first 30 lines confirmed: `useFirebaseDatabase()` imported and used at line 23 — sync hook mounting in `App` body is confirmed feasible
- Phase 1 data hooks (`useBookingsData`, `useActivitiesData`, `useRoomsByDate`) use `onValue` with standard React state pattern — confirmed in part by examination of `useRoomsByDate.ts` in prior context

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan reception-offline-sync --auto`
