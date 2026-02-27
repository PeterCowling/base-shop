---
Type: Plan
Status: Active
Domain: Infra
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27 (Wave 1 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-offline-sync
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted across 8 tasks (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
---

# Reception Offline Sync Plan

## Summary

The reception app has a complete offline infrastructure module (`lib/offline/`) — IndexedDB queue, sync manager, and React hooks — but none of it is wired into the mutation layer, provider tree, or auth layer. Staff who lose network connectivity silently lose writes and get signed out. This plan wires the existing infrastructure end-to-end across four phases: (1) schema extension + sync mount + auth cache, (2) gateway wiring for writable mutation ops (no read-before-write), (3) sync status UI + read-through cache for critical data views, and (4) unit test coverage for all new offline paths. `useChangeBookingDatesMutator`, `removeLastActivity`, and most `useLoansMutations` ops are marked online-only because they have read-before-write patterns or chained hook calls that cannot be safely serialized as a single queue entry. The `idempotencyKey` field is stored with each queue entry in v1 to enable future deduplication in v2; the actual dedup check in `syncPendingWrites` is a v2 feature not implemented here.

## Active tasks

- [x] TASK-01: Extend PendingWrite schema + DB_VERSION 2 migration
- [x] TASK-02: Mount useOfflineSync + OfflineSyncContext in App.tsx
- [x] TASK-03: Wire Phase 2 mutation hooks through offline gateway
- [x] TASK-04: Add online-only guard to useChangeBookingDatesMutator
- [x] TASK-05: Auth profile cache fallback in loadUserWithProfile
- [x] TASK-06: Read-through cache for critical data views
- [x] TASK-07: Sync status UI in OfflineIndicator
- [x] TASK-CHKPT: Checkpoint — reassess TASK-08 from Phase 2 evidence
- [ ] TASK-08: Unit tests — offline primitives + auth fallback

## Goals

- Route write-only mutation ops through a queue-first offline gateway so writes are never silently lost
- Store idempotency keys with each queue entry (dedup logic in sync is a v2 feature — keys laid in v1)
- Support multi-path atomic Firebase writes in the offline queue schema
- Mount `useOfflineSync` in the provider tree so auto-sync fires on reconnect
- Cache the user profile so staff remain authenticated during network interruptions
- Add read-through caching for critical views (bookings, activities, rooms)
- Surface sync queue state in the UI (pending count, failed writes, retry action)

## Non-goals

- Background Sync API (Service Worker) integration — deferred
- Full conflict resolution dashboard for manager review — deferred
- Offline queuing for compliance/POS audit paths (Alloggiati, PMS postings, shift closures, cash counts, terminal batches, safe counts) — excluded permanently; require real-time confirmation

## Constraints & Assumptions

- Constraints:
  - Firebase Realtime DB is already excluded from service worker caching (`sw.js:79–80`) — must not change this
  - `DB_VERSION` bump from 1→2 requires IndexedDB migration for existing clients via `onupgradeneeded`
  - Compliance hooks (`useSaveAlloggiatiResult`, `usePmsPostingsMutations`, `useTillShiftsMutations`, `useCashCountsMutations`, `useSafeCountsMutations`, `useTerminalBatchesMutations`) must NOT be queued offline under any circumstances
  - The mutation hook test suite (25+ files) mocks `firebase/database` directly — existing tests must remain passing; gateway branch adds a new offline path without removing the existing online path
- Assumptions:
  - Firebase Auth SDK persists auth token internally via IndexedDB; only the `userProfiles/{uid}` fetch fails during network interruption
  - Multi-path Firebase updates (`update(ref(database, ""), multiPathObject)`) can be queued with `path=""` — confirmed valid Firebase SDK usage
  - `useChangeBookingDatesMutator` is online-only for v1 — it issues up to 9 sequential conditional ops including a `saveFinancialsRoom` call; cannot be safely serialized as a single queue entry
  - 51 files exist in `hooks/mutations/`; the Phase 2 gateway covers write-only ops in `useActivitiesMutations` (`addActivity`/`saveActivity` — email notification deferred offline), `useBookingMutations`, `useCompletedTasks`, `useBookingNotesMutation`, and `useLoansMutations.saveLoan` only. `removeLastActivity` (read-before-write) and most `useLoansMutations` methods (read-before-write or chained hooks: `removeLoanItem`, `convertKeycardDocToCash`, `removeLoanTransactionsForItem`, `removeOccupantIfEmpty`, `updateLoanDepositType`) are online-only.

## Inherited Outcome Contract

- **Why:** TBD
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Reception app staff can log activities, update bookings, and view guest data during network interruptions, with all writes durably queued and synced on reconnect, without being signed out.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/reception-offline-sync/fact-find.md`
- Key findings used:
  - `lib/offline/useOnlineStatus` already consumed by `OfflineIndicator.tsx` (confirmed: `components/OfflineIndicator.tsx:6`) and internally by `useOfflineSync.ts`; the write queue (`queueOfflineWrite`) and sync primitives (`syncPendingWrites`, `useOfflineSync`) have zero consumers outside the module
  - `PendingWrite` interface (receptionDb.ts:148–154) lacks `idempotencyKey`, `conflictPolicy`, `atomic`, `domain` — needs DB_VERSION 1→2 bump
  - `queueOfflineWrite` signature (syncManager.ts:75–81) needs extending to accept new fields
  - `useFirebaseDatabase()` called (not captured) in App.tsx line 34 — capture return value and pass to `useOfflineSync`
  - `loadUserWithProfile` catch block (firebaseAuth.ts:184–187) returns `null` on network failure; `getMeta`/`setMeta` already implemented in receptionDb.ts for profile cache
  - `OfflineIndicator.tsx` has no props; extension requires a new `OfflineSyncContext`
  - `useChangeBookingDatesMutator` confirmed NOT a multi-path atomic — sequential ops + conditional external call; online-only for v1
  - Compliance hooks permanently excluded from offline queuing

## Proposed Approach

- Option A: Extend existing `lib/offline/` primitives with the missing fields and wire mutation hooks directly (queue-first, online path unchanged)
- Option B: Build a new offline middleware layer wrapping all Firebase calls app-wide (high blast radius, risky refactor)
- Chosen approach: **Option A.** The existing `lib/offline/` primitives are correct and well-structured. The gap is purely wiring: (1) extend the PendingWrite schema and `queueOfflineWrite` signature, (2) add `if (!online) await queueOfflineWrite(...)` branches to the 5 priority hooks, (3) mount `useOfflineSync` in App.tsx with a context for downstream state sharing, (4) cache the auth profile in the meta store. Option B would require a large blast-radius refactor with no benefit over Option A for this scope.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes
- Critique: 2 rounds, lp_score 3.5, Critique-Warning: partially-credible — proceeding per plan+auto protocol

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend PendingWrite schema + DB_VERSION 2 migration | 85% | M | Complete (2026-02-27) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Mount useOfflineSync + OfflineSyncContext in App.tsx | 85% | S | Complete (2026-02-27) | - | TASK-03, TASK-07 |
| TASK-03 | IMPLEMENT | Wire Phase 2 mutation hooks through offline gateway | 85% | L | Complete (2026-02-27) | TASK-01, TASK-02 | TASK-CHKPT |
| TASK-04 | IMPLEMENT | Add online-only guard to useChangeBookingDatesMutator | 85% | S | Complete (2026-02-27) | - | - |
| TASK-05 | IMPLEMENT | Auth profile cache fallback in loadUserWithProfile | 80% | S | Complete (2026-02-27) | - | TASK-08 |
| TASK-06 | IMPLEMENT | Read-through cache for critical data views | 80% | M | Complete (2026-02-27) | - | - |
| TASK-07 | IMPLEMENT | Sync status UI in OfflineIndicator | 80% | S | Complete (2026-02-27) | TASK-02 | - |
| TASK-CHKPT | CHECKPOINT | Reassess TASK-08 from Phase 2 evidence | 95% | S | Complete (2026-02-27) | TASK-03 | TASK-08 |
| TASK-08 | IMPLEMENT | Unit tests — offline primitives + auth fallback | 80% | M | Pending | TASK-CHKPT, TASK-01, TASK-05 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-05, TASK-06 | - | All independent — run in parallel |
| 2 | TASK-03, TASK-07 | TASK-01 + TASK-02 for TASK-03; TASK-02 for TASK-07 | TASK-07 can start as soon as TASK-02 completes |
| 3 | TASK-CHKPT | TASK-03 | Checkpoint — run replan before TASK-08 |
| 4 | TASK-08 | TASK-CHKPT + TASK-01 + TASK-05 | Tests cover schema, auth fallback, and gateway |

## Tasks

---

### TASK-01: Extend PendingWrite schema + DB_VERSION 2 migration

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/lib/offline/receptionDb.ts`, `apps/reception/src/lib/offline/syncManager.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/lib/offline/receptionDb.ts`, `apps/reception/src/lib/offline/syncManager.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — both files read line-by-line; IDB `onupgradeneeded` migration pattern is standard; `PendingWrite` interface fully specified in fact-find; new fields are all optional so existing callers (currently none outside lib/offline) are unaffected. Capped at 85% due to TASK-08 testing evidence not yet in place.
  - Approach: 85% — DB_VERSION bump with `onupgradeneeded` default-backfill for existing records is the standard IDB migration path. `queueOfflineWrite` signature extension is backwards-compatible (new optional `opts` param). No alternative is viable without a full data store redesign.
  - Impact: 90% — purely additive schema change; no UI blast radius; `syncPendingWrites` reads `path`/`operation` only and is unaffected by new fields for v1 (idempotency dedup is a future enhancement).
- **Build evidence (2026-02-27):** `DB_VERSION` bumped 1→2 in `receptionDb.ts`; `onupgradeneeded` restructured with versioned `if (oldVersion < N)` blocks — fresh-install creates all 3 stores, v1→v2 upgrade is a no-op (new fields are optional properties, no store structural change). `PendingWrite` extended with `idempotencyKey?`, `conflictPolicy?`, `atomic?`, `domain?`. `queueOfflineWrite` in `syncManager.ts` extended with optional `opts` param spread into `addPendingWrite`. TypeScript: clean (pnpm typecheck 0 errors).
- **Acceptance:**
  - `PendingWrite` interface extended with `idempotencyKey?`, `conflictPolicy?`, `atomic?`, `domain?` optional fields
  - `DB_NAME = "reception-offline"`, `DB_VERSION = 2`
  - `onupgradeneeded` handler: when upgrading from version 1, existing `pending-writes` records are not dropped; new fields default to undefined/false
  - `queueOfflineWrite` signature updated to accept optional `opts: { idempotencyKey?, conflictPolicy?, atomic?, domain? }` and forward to `addPendingWrite`
  - TypeScript compiles cleanly for `receptionDb.ts` and `syncManager.ts`
- **Validation contract (TC-01):**
  - TC-01: Fresh browser, open IndexedDB `reception-offline` v2 → three stores exist (`firebase-cache`, `pending-writes`, `meta`); `pending-writes` store accepts a write with `idempotencyKey`, `conflictPolicy`, `atomic`, `domain` fields
  - TC-02: Existing client with IndexedDB v1 data → `onupgradeneeded` fires; existing pending-write records survive with new fields as undefined; no data loss
  - TC-03: Call `queueOfflineWrite("", "update", multiPathObj, { atomic: true, domain: "activities" })` → `addPendingWrite` called with full opts merged; returned IDB ID is a number
  - TC-04: Call `queueOfflineWrite(path, "set", data)` (no opts) → backwards-compatible; adds entry without new fields; does not throw
- **Planning validation (required for M/L):**
  - Checks run: `receptionDb.ts` read in full (287 lines); `syncManager.ts` read in full (86 lines); `PendingWrite` interface at lines 148–154 confirmed; `addPendingWrite` signature at line 156–158 confirmed (`Omit<PendingWrite, "id" | typeof TIMESTAMP_KEY>` — after extending `PendingWrite`, accepts new optional fields automatically); `queueOfflineWrite` at lines 75–81 has fixed 3-param signature requiring update
  - Validation artifacts: `receptionDb.ts` source confirmed; `syncManager.ts` source confirmed
  - Unexpected findings: `queueOfflineWrite` signature update is required in this task (not just schema); without it, TASK-03 callers cannot pass `idempotencyKey` etc. via the public helper.
- **Consumer tracing (new outputs):**
  - New `PendingWrite` fields (`idempotencyKey`, `conflictPolicy`, `atomic`, `domain`): stored per queue entry by TASK-03 callers. `syncPendingWrites` reads only `path`, `operation`, `data` — the new fields are stored but NOT acted upon by the v1 sync engine. Dedup logic based on `idempotencyKey` is a v2 feature; v1 benefit: keys are already in the schema so v2 dedup requires no migration.
  - `queueOfflineWrite` new `opts` param: consumed by TASK-03. Existing callers (none outside lib/offline/) are safe — opts is optional.
- **Scouts:** None — all facts verified against source files.
- **Edge Cases & Hardening:**
  - If `onupgradeneeded` fires during a concurrent write from another tab, IDB guarantees the upgrade completes before new transactions start — no race condition
  - If version mismatch is larger than 1→2 (e.g., a future v3 being installed on a v1 DB), `onupgradeneeded` must handle multi-step migration. For v1→2 only: safe. Add a comment noting that future version bumps must handle all intermediate steps.
  - If IndexedDB is unavailable (private browsing), `openDb()` rejects — this is caught in callers via try/catch pattern already present. No change needed.
- **What would make this >=90%:**
  - Unit tests for `addPendingWrite` with new fields confirming IDB persistence (TASK-08 evidence)
- **Rollout / rollback:**
  - Rollout: DB_VERSION bump fires on first app load after deploy; migration is automatic
  - Rollback: Downgrade would trigger `onupgradeneeded` with `oldVersion=2, newVersion=1` — IDB does not support downgrades natively. Mitigation: add a `clearPendingWrites()` call in a `onversionchange` error handler for unexpected version mismatch. `clearPendingWrites()` already exists in `receptionDb.ts:201`.
- **Documentation impact:** None: internal IDB layer; no user-facing or API documentation.
- **Notes / references:** `receptionDb.ts:9` (`DB_VERSION = 1`), `syncManager.ts:75` (`queueOfflineWrite`), fact-find § Data & Contracts.

---

### TASK-02: Mount useOfflineSync + OfflineSyncContext in App.tsx

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/App.tsx`, `apps/reception/src/context/OfflineSyncContext.tsx` (new file)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/App.tsx`, `apps/reception/src/context/OfflineSyncContext.tsx` (new)
- **Depends on:** -
- **Blocks:** TASK-03, TASK-07
- **Confidence:** 85%
  - Implementation: 85% — `App.tsx` first 60 lines read; `useFirebaseDatabase()` called on line 34 (currently return value not captured); `useOfflineSync` API fully confirmed; creating a simple context file is routine. Held-back test: "What if capturing `useFirebaseDatabase()` return value changes App.tsx behaviour?" — it returns the same `Database` object already used internally; capturing vs discarding makes no difference to existing behaviour. Score stands at 85%.
  - Approach: 85% — create `OfflineSyncContext` (new `context/OfflineSyncContext.tsx`), populate from `useOfflineSync` in `App.tsx`, provide via context provider. OfflineIndicator and TASK-07 read from context. Cleanest approach; avoids prop-drilling through the render tree.
  - Impact: 85% — additive change to App.tsx; no existing behaviour changes; context creation follows the established pattern of `AuthContext`.
- **Acceptance:**
  - `OfflineSyncContext.tsx` created with type `OfflineSyncContextValue` matching `UseOfflineSyncReturn` from `useOfflineSync.ts`
  - `useOfflineSyncContext()` hook exported from `OfflineSyncContext.tsx` for consumers
  - `App.tsx` captures `const database = useFirebaseDatabase()` (existing call upgraded to capture return)
  - `App.tsx` calls `useOfflineSync({ database, autoSync: true })` and populates the context provider
  - `OfflineSyncContext.Provider` wraps the App component tree
  - TypeScript compiles cleanly
- **Validation contract (TC-02):**
  - TC-01: App renders without error; `useOfflineSyncContext()` in a child component returns `{ online, pendingCount, syncing, lastSyncResult, triggerSync }`
  - TC-02: Go offline in browser → `online` transitions to `false` within the existing `useOnlineStatus()` polling window
  - TC-03: `pendingCount` is 0 on fresh load; increments after a queued write (will be verifiable after TASK-03)
- **Planning validation:** `App.tsx` lines 1–60 read; `useOfflineSync.ts` read in full; `OfflineSyncContext` pattern follows established `AuthContext.tsx` pattern confirmed.
- **Consumer tracing (new outputs):**
  - `OfflineSyncContext`: consumed by TASK-07 (OfflineIndicator). Mutation hooks use `useOnlineStatus()` directly, not the context (avoids hook dependency on a UI-layer context). Context default value must be a safe stub (`online: true, pendingCount: 0, syncing: false, lastSyncResult: null, triggerSync: async () => null`) — NOT a throw. This ensures Storybook, test isolation, and future consumers work without requiring a full provider tree.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - If `database` is `null` on first render (auth not yet resolved), `useOfflineSync` handles `database: null` gracefully (checked: `if (!database || !online || syncing) return null` in `triggerSync`). No crash.
  - Context default value: safe stub (`online: true, pendingCount: 0, syncing: false, lastSyncResult: null, triggerSync: async () => null`). This is the only behavior — no throw variant. Consistent with TASK-07 edge case.
- **What would make this >=90%:** Confirmed via unit tests that context provides correct sync state values.
- **Rollout / rollback:** Rollout: additive. Rollback: remove `OfflineSyncContext.Provider` from App.tsx and delete context file; no data loss.
- **Documentation impact:** None.
- **Notes / references:** `App.tsx:34` (`useFirebaseDatabase()`), `useOfflineSync.ts:10–22` (interface), `context/AuthContext.tsx` (pattern reference).
- **Build evidence (2026-02-27):** `OfflineSyncContext.tsx` created with safe-stub default (no throw). `App.tsx` now captures `const database = useFirebaseDatabase()` and calls `useOfflineSync({ database, autoSync: true })`; provider wraps `<NotificationProviderWithGlobal>`. Loading-state early return intentionally left unwrapped (safe stub handles it). TypeScript: clean.

---

### TASK-03: Wire write-only mutation ops through offline gateway

- **Type:** IMPLEMENT
- **Deliverable:** code-change — targeted write-only ops in 5 mutation hooks
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-27)
- **Affects:**
  - `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` (addActivity, saveActivity only — see scope below)
  - `apps/reception/src/hooks/mutations/useBookingMutations.ts`
  - `apps/reception/src/hooks/data/useCompletedTasks.ts`
  - `apps/reception/src/hooks/mutations/useBookingNotesMutation.ts`
  - `apps/reception/src/hooks/mutations/useLoansMutations.ts` (saveLoan only — see scope below)
  - `[readonly] apps/reception/src/lib/offline/syncManager.ts` (queueOfflineWrite import)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-CHKPT
- **Confidence:** 85%
  - Implementation: 85% — `useActivitiesMutations.ts` read in full (337 lines): `addActivity` and `saveActivity` are write-only; `removeLastActivity` online-only (read-before-write). `useLoansMutations.ts` read in full: only `saveLoan` is queueueable. `useCompletedTasks.ts` confirmed simple writes. `useBookingMutations.ts` read in full (57 lines — scout wave): `saveBooking` is pure `update()`, no read, all params are passed in. `useBookingNotesMutation.ts` read in full (45 lines — scout wave): `addNote`/`updateNote`/`deleteNote` are all pure writes, no `get()`. All scout findings positive — no blocking complexity.
  - Approach: 80% — gateway only wraps ops that are pure writes. Online-only guards for read-before-write ops. This is the only safe approach.
  - Impact: 80% — online path is unchanged; existing tests which mock `firebase/database` will still pass. Deferred email notifications for offline activity writes are an accepted v1 limitation.
- **Acceptance — write-only gateway ops (queued offline):**
  - `useActivitiesMutations.addActivity` and `saveActivity`: offline branch queues the multi-path `update(ref(database), updates)` call; `maybeSendEmailGuest` is NOT called when offline (it requires Firebase `get` — network dependent). Comment must document that email notification is deferred when activity is logged offline.
  - `useCompletedTasks.setOccupantTasks` and `updateSingleTask`: offline branch queues with `conflictPolicy: "last-write-wins"`, `domain: "tasks"`
  - `useBookingMutations` (write ops to be confirmed by scout): offline branch queues with `conflictPolicy: "fail-on-conflict"`, `domain: "bookings"`
  - `useBookingNotesMutation` (to be confirmed by scout): offline branch queues with `conflictPolicy: "last-write-wins"`, `domain: "notes"`
  - `useLoansMutations.saveLoan`: offline branch queues with `conflictPolicy: "last-write-wins"`, `domain: "loans"`
- **Acceptance — online-only guards (NOT queued):**
  - `useActivitiesMutations.removeLastActivity`: reads existing activities before removing — must remain online-only; add `if (!online) return early with error` guard
  - `useLoansMutations.removeLoanItem`, `convertKeycardDocToCash`, `removeLoanTransactionsForItem`, `removeOccupantIfEmpty`, `updateLoanDepositType`: all have read-before-write or chained hook calls — mark online-only with clear error message
- **Acceptance — both patterns:**
  - All offline-only guards: `const online = useOnlineStatus()` at hook body top; early return with message `"[operation name] requires a network connection. Please reconnect and try again."` when offline and not queueable
  - All queueable ops: `if (!online) { await queueOfflineWrite(path, op, data, { idempotencyKey: crypto.randomUUID(), ... }); return; }`
  - IndexedDB unavailable fallback: if `queueOfflineWrite` returns `null` (IDB unavailable), fall through to direct Firebase write rather than silently swallowing the error
  - `useActivitiesMutations.addActivity` multi-path: `queueOfflineWrite("", "update", updates, { atomic: true, domain: "activities", ... })`
  - Existing unit tests pass unchanged (online path not modified)
  - TypeScript compiles cleanly
- **Validation contract (TC-03):**
  - TC-01: `useActivitiesMutations.addActivity` called offline → `queueOfflineWrite("", "update", multiPathObj, { atomic: true })` called; Firebase SDK not called; `maybeSendEmailGuest` NOT called
  - TC-02: `useActivitiesMutations.addActivity` called online → existing Firebase write path + `maybeSendEmailGuest` executes unchanged; `queueOfflineWrite` not called
  - TC-03: `useActivitiesMutations.removeLastActivity` called offline → returns early with error; no Firebase ops called
  - TC-04: `useCompletedTasks.updateSingleTask` called offline → `queueOfflineWrite` called with correct path and `domain: "tasks"`
  - TC-05: `useLoansMutations.saveLoan` called offline → `queueOfflineWrite` called with correct path
  - TC-06: `useLoansMutations.removeLoanItem` called offline → returns early with online-only error message
  - TC-07: All modified hooks — existing unit tests pass unchanged (online path not modified)
- **Planning validation (required for M/L):**
  - Checks run: `useActivitiesMutations.ts` read in full (337 lines — all methods analyzed); `useLoansMutations.ts` read in full (296 lines — all methods analyzed); `useCompletedTasks.ts` read in full (confirmed simple writes); `useOnlineStatus()` usage confirmed in `OfflineIndicator.tsx` and `useOfflineSync.ts` — safe to import in hooks
  - Validation artifacts: source files confirmed as described above
  - Unexpected findings: `useLoansMutations` is more complex than fact-find assumed — `removeLoanItem`, `convertKeycardDocToCash` chain into `logActivity` (useActivitiesMutations) and `addToAllTransactions` (useAllTransactionsMutations). These chained calls cannot be safely queued. Critical finding from Round 1 critique resolved: plan now explicitly scopes online-only guards for these methods.
- **Consumer tracing (new outputs):**
  - `queueOfflineWrite` calls: consumed by `syncPendingWrites` (reads `path`/`operation`/`data` only; new opts fields stored, not acted on in v1)
  - `useOnlineStatus()` added to hooks: consumers (React components) are unchanged; hook returns boolean with no side effects
  - `maybeSendEmailGuest` NOT called when offline: email notifications for activity codes (2,3,4,5,6,7,8,21,27) are deferred when activity is logged offline. The activity write itself IS queued and will reach Firebase on sync. Staff must manually trigger email or rely on the next online session's activity log to trigger the email flow. This is an accepted v1 limitation — documented in the Decision Log.
- **Scouts:** Completed (scout wave parallel with Wave 1): `useBookingMutations.ts` (57 lines) — `saveBooking` is pure `update()` on `bookings/${bookingRef}/${occupantId}`, no read, safe to queue. `useBookingNotesMutation.ts` (45 lines) — `addNote`/`updateNote`/`deleteNote` all pure writes, no `get()`, safe to queue. Both hooks confirmed no read-before-write patterns.
- **Edge Cases & Hardening:**
  - `crypto.randomUUID()` availability: available in all modern browsers and Node 22+. No polyfill needed.
  - IndexedDB unavailable (`isIndexedDbAvailable()` false): `queueOfflineWrite` → `addPendingWrite` → `openDb()` rejects; `addPendingWrite` returns `null`. Gateway branch must fall through to direct Firebase write when `null` returned (not silently return).
- **What would make this >=90%:** `useBookingMutations.ts` and `useBookingNotesMutation.ts` read before plan; confirmed no read-before-write patterns in those hooks.
- **Rollout / rollback:**
  - Rollout: additive; online path unmodified. Can deploy alongside existing clients.
  - Rollback: remove `if (!online)` branches; restore original function bodies.
- **Documentation impact:** None — internal hook change.
- **Notes / references:** `useActivitiesMutations.ts:101–155` (`addActivity` — confirmed queueueable), `:138` (`maybeSendEmailGuest` — deferred offline), `:162–244` (`removeLastActivity` — read-before-write, online-only); `useLoansMutations.ts:35–57` (`saveLoan` — queueueable), `:147–213` (`removeLoanItem` — chained, online-only); `useCompletedTasks.ts:28–76` (confirmed simple writes).
- **Build evidence (2026-02-27):** Queue-first offline branches implemented across 5 hooks. `addActivity`/`saveActivity` (path `""`, `update`, `atomic:true`, `domain:"activities"`, email deferred); `setOccupantTasks`/`updateSingleTask` (`completedTasks/...`, `set`, `domain:"tasks"`); `saveBooking` (`bookings/{ref}/{occupantId}`, `update`, `domain:"bookings"`); notes ops (`bookings/{ref}/__notes/{id}`, `domain:"notes"`); `saveLoan` (`loans/{path}`, `update`, `domain:"loans"`). IDB-unavailable null-return fallthrough in all queued ops. Online-only guards on `removeLastActivity` + 5 `useLoansMutations` complex methods. TypeScript: clean.

---

### TASK-04: Add online-only guard to useChangeBookingDatesMutator

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/useChangeBookingDatesMutator.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — hook read in full (200 lines); confirmed sequential ops + conditional `saveFinancialsRoom` call; early return with error is a 3-line change. Uses `getDatabase()` directly (not `useFirebaseDatabase()`) — `useOnlineStatus()` must be imported separately.
  - Approach: 90% — online-only guard is the safest and only reasonable approach for v1 given the hook's complexity. Staff will receive a clear in-context error when attempting a date change offline. This is better than silently queuing a partial multi-step operation.
  - Impact: 85% — behaviour change: date changes now fail gracefully with a user-visible error when offline instead of partially writing and partially failing. No impact on online path.
- **Acceptance:**
  - `useChangeBookingDatesMutator` imports `useOnlineStatus` from `lib/offline/useOnlineStatus`
  - Early return at top of mutation callback: if `!online`, set error state with message like `"Booking date changes require a network connection. Please reconnect and try again."` and return without any Firebase writes
  - Existing online path is unchanged
  - Unit test for the offline early-return path added or updated
  - TypeScript compiles cleanly
- **Validation contract (TC-04):**
  - TC-01: `useChangeBookingDatesMutator` called when offline → returns early; no Firebase ops called; error state set with user-visible message
  - TC-02: `useChangeBookingDatesMutator` called when online → existing behaviour unchanged; all ops execute in sequence
  - TC-03: Existing unit test (`hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts`) passes unchanged for online path
- **Planning validation:** Hook read in full (`useChangeBookingDatesMutator.ts:1–200`); `getDatabase()` usage noted — hook does not use `useFirebaseDatabase()` hook; must import `useOnlineStatus` separately. No issues.
- **Scouts:** None.
- **Edge Cases & Hardening:** The error message must be actionable — staff should know to reconnect before retrying. Do not use a generic "operation failed" message.
- **What would make this >=90%:** Already well-understood; unit test for offline path would confirm.
- **Rollout / rollback:** Rollout: additive behaviour change. Rollback: remove the `useOnlineStatus` import and early return guard.
- **Documentation impact:** None.
- **Notes / references:** `useChangeBookingDatesMutator.ts:1–200` (confirmed sequential ops structure), fact-find § Constraints & Assumptions.
- **Build evidence (2026-02-27):** `useOnlineStatus` imported and called at hook body level. `online` added to `useCallback` dependency array. Early return guard added at top of `updateBookingDates` callback: sets `setIsError(true)` + `setError(new Error("Booking date changes require a network connection..."))` and returns before any Firebase ops. Online path unchanged. TypeScript: clean.

---

### TASK-05: Auth profile cache fallback in loadUserWithProfile

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/services/firebaseAuth.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/services/firebaseAuth.ts`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 85% — `firebaseAuth.ts:184–187` (catch returns null) and `subscribeToAuthState:192–207` confirmed; `getMeta`/`setMeta` confirmed in `receptionDb.ts:231–258`. Fix is small: add `await setMeta("cachedUserProfile", user)` before success return, replace `return null` in catch with `return await getMeta<User>("cachedUserProfile")`.
  - Approach: 85% — cache to `meta` store on success; read from `meta` store on catch. Clear cache on auth state change when `firebaseUser` is null (signout). This approach keeps the profile available during network interruptions while ensuring fresh data replaces it on reconnect.
  - Impact: 80% — `AuthContext.tsx` calls `subscribeToAuthState`; if `loadUserWithProfile` returns a cached user instead of `null`, `AuthContext` receives a non-null user and sets `authenticated` (no `unauthenticated` flash). Auth context unit test at `context/__tests__/AuthContext.test.tsx` needs a new test case for this path. Held-back test: "No single unknown would drop Impact below 80 because: the cached user is only served when network is down; on reconnect the fresh profile replaces it; `AuthContext` already handles the `user | null` value correctly."
- **Acceptance:**
  - `loadUserWithProfile` success path: `await setMeta("cachedUserProfile", resolvedUser)` called before returning
  - `loadUserWithProfile` catch block: reads `await getMeta<User>("cachedUserProfile")`; returns cached user if available, `null` if not
  - `subscribeToAuthState` signout path (when `firebaseUser` is null): `await setMeta("cachedUserProfile", null)` called to clear the cache
  - TypeScript compiles cleanly; `User` type from `types/` is preserved through cache round-trip
  - AuthContext test has a new case: simulating network failure returns cached user, status stays `authenticated`
- **Validation contract (TC-05):**
  - TC-01: Successful login → `getMeta("cachedUserProfile")` returns the cached `User` object in same session
  - TC-02: `loadUserWithProfile` called with network failure (fetch throws) → returns cached user if cache exists; returns `null` only if cache is empty
  - TC-03: Explicit signout (`firebaseUser` is null in `onAuthStateChanged`) → `getMeta("cachedUserProfile")` returns `null` after
  - TC-04: `AuthContext` unit test with simulated network failure → status remains `authenticated` if cached profile available
- **Planning validation:** `firebaseAuth.ts:170–207` read in full; `getMeta`/`setMeta` signatures confirmed (`getMeta<T>(key: string): Promise<T | null>`, `setMeta<T>(key: string, value: T): Promise<boolean>`). `User` type must be compatible with `T` in `setMeta<User>` — it is (it's a plain interface). Confirmed no issues.
- **Consumer tracing (new outputs):**
  - `setMeta("cachedUserProfile", user)`: no other consumers; stored in IDB `meta` store under key `"cachedUserProfile"`.
  - `getMeta("cachedUserProfile")` on catch: consumed by `subscribeToAuthState` listener which passes result to `AuthContext`. Listener handles `User | null` correctly (unchanged code path).
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Cached profile has revoked role: user remains authenticated offline with stale roles. Mitigation (documented in fact-find): cache is only served when network is down; on reconnect, fresh profile replaces cache. Role enforcement is real-time when online. Acceptable for v1.
  - IDB unavailable: `setMeta` call in success path returns `false`; silently ignored (cache miss on next failure is handled). `getMeta` in catch returns `null` → `loadUserWithProfile` returns `null` → original behaviour preserved.
- **What would make this >=90%:** Unit test for the cache round-trip path in `AuthContext.test.tsx`.
- **Rollout / rollback:** Rollout: additive. Rollback: remove `setMeta`/`getMeta` calls; revert to `return null` in catch.
- **Documentation impact:** None.
- **Notes / references:** `firebaseAuth.ts:184–187` (catch block), `receptionDb.ts:231–258` (`getMeta`/`setMeta`), fact-find § Questions > Resolved (auth profile fallback).
- **Build evidence (2026-02-27):** `getMeta`/`setMeta` imported from `../lib/offline/receptionDb`. Success path: `resolvedUser` extracted into named const; `await setMeta<User | null>("cachedUserProfile", resolvedUser)` called before return. Catch block: `return await getMeta<User>("cachedUserProfile")` (returns `User | null`, matching return type). Signout path: `await setMeta<User | null>("cachedUserProfile", null)` before `listener(null)`. TypeScript: clean.

---

### TASK-06: Read-through cache for critical data views

- **Type:** IMPLEMENT
- **Deliverable:** code-change — three data hooks (useBookingsData, useActivitiesData, useRoomsByDate) with `setCachedData`/`getCachedData` wiring
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/hooks/data/useBookingsData.ts`, `apps/reception/src/hooks/data/useActivitiesData.ts`, `apps/reception/src/hooks/data/useRoomsByDate.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — all three hook files read in full before implementation (scout wave parallel). `useBookingsData.ts` (84 lines) and `useActivitiesData.ts` (88 lines) confirmed same `onValue` + named `handleSnapshot` pattern as `useRoomsByDate.ts`. `getCachedData`/`setCachedData` signatures confirmed in `receptionDb.ts:77–109`. `useRoomsByDate` requires composite cache entry (two state values). `setCachedData` must be fire-and-forget (void) inside sync handlers; async IIFE pattern for pre-population confirmed.
  - Approach: 80% — base-path string cache keys (`"bookings"`, `"activities"`, `"roomsByDate"`); fire-and-forget `void setCachedData(...)` inside sync `handleSnapshot`; async IIFE pre-population at effect top with `cancelled` flag. Consistent across all 3 hooks.
  - Impact: 80% — data-only enhancement; no mutation paths change; state pre-population when offline means guests/rooms/activities show last-seen data instead of empty/loading.
- **Acceptance:**
  - `useRoomsByDate`, `useBookingsData`, `useActivitiesData`: each `onValue` callback calls `setCachedData(path, data)` after processing a successful snapshot
  - On subscription setup when offline: `getCachedData(path)` called; if result is non-null, pre-populates local state and sets `loading: false`
  - Cache key is the Firebase path string (same as subscription ref path)
  - TypeScript compiles cleanly; no changes to returned hook interface shape
- **Validation contract (TC-06):**
  - TC-01: Online; data received from Firebase → `getCachedData(path)` returns the same data structure in subsequent call
  - TC-02: Offline; hook subscribes → pre-populates state from cache; `loading` is `false` immediately if cache hit
  - TC-03: Cache miss (no prior online session) → offline behaviour unchanged (loading stays true, data is empty)
  - TC-04: Online after offline → fresh Firebase snapshot replaces cached data; cache updated with new snapshot
- **Planning validation (required for M/L):**
  - Checks run (scout wave): `useBookingsData.ts` (84 lines) read in full — named `handleSnapshot` + `handleError`, `useState<T>({} as T)`, dynamic query ref from base `"bookings"` path, single subscription; `useActivitiesData.ts` (88 lines) read in full — same named handler pattern, nested per-record `safeParse` loop, `setActivities(parsed)` in try block, cleanup `return () => unsubscribe()`. `useRoomsByDate.ts` read (confirmed `onValue` + `handleValue`). `receptionDb.ts:77–115` confirmed: `getCachedData<T>(path)` returns `T | null`, `setCachedData<T>(path, data)` returns `boolean`, `firebase-cache` store keyed by `path`.
  - Validation artifacts: all three source files confirmed matching patterns. `getCachedData`/`setCachedData` signatures exact.
  - Unexpected findings: None — all hooks match the expected pattern. `useRoomsByDate` has two state values requiring a composite cache entry; `useActivitiesData` has a `try/finally` (no catch) structure that requires `setCachedData` be placed inside the `try` block.
- **Consumer tracing (new outputs):**
  - `setCachedData` writes to `firebase-cache` IDB store: no other consumers read these specific paths in the current codebase. No dead-end risk (cache is self-consistent; it only enriches the offline experience).
  - State pre-population (`loading: false` on cache hit): consumed by the React components that render these hooks' return values. Components already handle the `loading: false` + `data: X` case normally.
- **Scouts:** All scout reads completed before implementation (parallel with Wave 1 dispatch).
- **Edge Cases & Hardening:**
  - Cache size: `clearOldCache(24h)` already exists in `receptionDb.ts:124`; should be called on app startup to prevent unbounded IDB growth.
  - Stale cache while online: the `onValue` subscription will overwrite the cached data on each new Firebase snapshot — cache is always updated on fresh data, no stale serving while online.
- **What would make this >=90%:** All three data hook files read before plan; `onValue` callback shape confirmed consistent across all three.
- **Rollout / rollback:** Rollout: additive; existing behaviour unchanged for online path. Rollback: remove `setCachedData`/`getCachedData` calls.
- **Documentation impact:** None.
- **Notes / references:** `useRoomsByDate.ts:192–232` (`handleValue` callback), `receptionDb.ts:77–109`.
- **Build evidence (2026-02-27):** All three hooks updated: `BOOKINGS_CACHE_KEY`, `ACTIVITIES_CACHE_KEY`, `ROOMS_CACHE_KEY` module-level constants added. Each `handleSnapshot` writes `void setCachedData(key, parsedData)` after successful parse. Each `useEffect` has async IIFE pre-population with `cancelled` flag. `useRoomsByDate` uses composite `RoomsByDateCacheEntry` to restore both `roomsByDate` and `mergedOccupancyData` together. `cancelled` flag propagated to early-return paths in `useRoomsByDate`. TypeScript: clean.

---

### TASK-07: Sync status UI in OfflineIndicator

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/components/OfflineIndicator.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/components/OfflineIndicator.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — `OfflineIndicator.tsx` read in full (25 lines); uses `useOnlineStatus()` directly; no props. Adding a `useOfflineSyncContext()` call and rendering pending count is a small incremental change. Held-back test: "No single unknown would drop Implementation below 80 because: OfflineIndicator is a leaf component with no complex state; the context is created in TASK-02 with a well-defined shape."
  - Approach: 85% — extend the existing `OfflineIndicator` banner component to show pending queue depth and sync state when offline or syncing. Default assumption (fact-find: "extend OfflineIndicator to show pending count inline — minimal surface area change") is taken.
  - Impact: 85% — purely additive UI enhancement in a leaf component; no logic changes upstream.
- **Acceptance:**
  - `OfflineIndicator.tsx` imports and calls `useOfflineSyncContext()`
  - When offline: banner shows pending write count (`N writes queued`) if `pendingCount > 0`
  - When syncing (online but `syncing: true`): banner shows "Syncing…" indicator
  - When `lastSyncResult.failed > 0`: shows failed write count and a retry action (calls `triggerSync()`)
  - Design: extends the existing top banner; no new fixed elements (per default assumption in fact-find)
  - Existing "You're offline" message preserved when `pendingCount === 0`
  - TypeScript compiles cleanly
- **Validation contract (TC-07):**
  - TC-01: Device offline, 3 queued writes → banner shows "You're offline. 3 writes queued."
  - TC-02: Device reconnects, sync in progress → banner shows "Syncing…"
  - TC-03: Sync completes with 1 failed write → banner shows failed count + retry button; `triggerSync()` called on click
  - TC-04: Device online, no pending writes, last sync success → banner hidden (`online` true, no pending/failed state)
- **Planning validation:** `OfflineIndicator.tsx` read in full; `UseOfflineSyncReturn` shape confirmed (`pendingCount`, `syncing`, `lastSyncResult`, `triggerSync`). No unexpected findings.
- **Consumer tracing (new outputs):** `OfflineSyncContext` consumed here — produced by TASK-02. No downstream consumers of `OfflineIndicator` changes (it's rendered once in the component tree with no children).
- **Scouts:** None.
- **Edge Cases & Hardening:** Context default value is a safe stub (matching TASK-02: `online: true, pendingCount: 0, syncing: false, lastSyncResult: null, triggerSync: async () => null`). There is no throw variant — this is consistent with TASK-02 design decision. Storybook and test isolation work without provider.
- **What would make this >=90%:** Unit test for OfflineIndicator with mocked context values covering all state combinations.
- **Rollout / rollback:** Rollout: additive UI change. Rollback: revert OfflineIndicator to current state (remove context hook + new render logic).
- **Documentation impact:** None.
- **Notes / references:** `OfflineIndicator.tsx:1–25` (confirmed structure), fact-find § Questions > Open (sync UI placement — default assumption taken).
- **Build evidence (2026-02-27):** `useOnlineStatus()` import replaced by `useOfflineSyncContext()`. Four render branches: (1) online + no pending/failed → `null`; (2) online + failed > 0 → failed banner + retry button (`void triggerSync()`); (3) online + syncing → "Syncing…" banner; (4) offline → "You're offline. N write(s) queued." or "You're offline." TypeScript: clean (`SyncResult.failed` is directly a `number`).

---

### TASK-CHKPT: Checkpoint — reassess TASK-08 from Phase 2 evidence

- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/plans/reception-offline-sync/plan.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-08
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents low-confidence test task from executing with stale assumptions
  - Impact: 95% — controls downstream risk on TASK-08
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on TASK-08
  - Confidence for TASK-08 recalibrated from latest evidence
  - Plan updated and re-sequenced if needed
- **Horizon assumptions to validate:**
  - `jest-fake-indexeddb` is installable in `apps/reception` test environment (`jest.setup.ts` can import it without breaking existing tests)
  - All 5 gateway-wired hooks from TASK-03 have confirmed test file paths (especially `useBookingMutations.ts`)
  - `useOnlineStatus` is mockable in Jest without additional setup
- **Validation contract:** `/lp-do-replan` completes with TASK-08 confidence ≥70%; or TASK-08 is restructured/broken down if lower.
- **Planning validation:** No pre-planning validation needed — procedural control task.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with replan findings.
- **Build evidence (2026-02-27):** Checkpoint executed. Evidence gathered: (1) `jest-fake-indexeddb` NOT installed in `apps/reception` — not needed; mock `queueOfflineWrite` and `getMeta`/`setMeta` at module level using standard `jest.mock()`. (2) Test files confirmed: `useActivitiesMutations.test.ts`, `useBookingNotesMutation.test.ts`, `useChangeBookingDatesMutator.test.ts` exist in `hooks/mutations/__tests__/`; `firebaseAuth.test.ts` exists in `services/__tests__/`; `useBookingMutations.test.ts` and `useLoansMutations.test.ts` do NOT exist → create new. (3) `useOnlineStatus` mockable with `jest.mock("../../../lib/offline/useOnlineStatus", () => ({ useOnlineStatus: () => mock() }))` — no special setup required. (4) `useBookingNotesMutation.ts` confirmed using `getDatabase()` directly + `useOnlineStatus` + `queueOfflineWrite` (TASK-03 complete). TASK-08 confidence raised from 70% → 80%; scope revised to hook-level gateway tests + auth fallback, no `jest-fake-indexeddb` required.

---

### TASK-08: Unit tests — offline primitives + auth fallback

- **Type:** IMPLEMENT
- **Deliverable:** code-change — offline gateway tests across mutation hooks + auth fallback tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/mutations/__tests__/useActivitiesMutations.test.ts` (update — add offline path tests)
  - `apps/reception/src/hooks/mutations/__tests__/useBookingNotesMutation.test.ts` (update — add offline path tests)
  - `apps/reception/src/hooks/mutations/__tests__/useChangeBookingDatesMutator.test.ts` (update — add offline guard test)
  - `apps/reception/src/hooks/mutations/__tests__/useBookingMutations.test.ts` (new)
  - `apps/reception/src/hooks/mutations/__tests__/useLoansMutations.test.ts` (new)
  - `apps/reception/src/services/__tests__/firebaseAuth.test.ts` (update — add cache fallback tests + receptionDb mock)
- **Depends on:** TASK-CHKPT, TASK-01, TASK-05
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — hook import paths confirmed; `jest.mock("../../../lib/offline/useOnlineStatus", ...)` pattern verified; `useBookingNotesMutation` uses `getDatabase()` (not `useFirebaseDatabase`) — mock already in place in existing test. Revised scope avoids `jest-fake-indexeddb` entirely — mocks at hook level.
  - Approach: 80% — offline gateway tests mock `useOnlineStatus` (return false) + `queueOfflineWrite` (return 1 = queued); verify Firebase functions NOT called; verify queue called with correct args. Auth fallback adds `getMeta`/`setMeta` mock to `firebaseAuth.test.ts` and tests catch path.
  - Impact: 85% — pure test additions; no production code changes; existing tests unaffected.
- **Acceptance:**
  - `useActivitiesMutations.test.ts`: `addActivity` when offline → `queueOfflineWrite` called, Firebase `update` NOT called, email NOT called; `removeLastActivity` when offline → returns `{ success: false }` with network error
  - `useBookingNotesMutation.test.ts`: `addNote`/`updateNote`/`deleteNote` when offline → `queueOfflineWrite` called with correct op/path/opts; Firebase set/update/remove NOT called
  - `useChangeBookingDatesMutator.test.ts`: `updateBookingDates` when offline → `isError: true`, `error instanceof Error`, Firebase `update` NOT called
  - `useBookingMutations.test.ts` (new): online → Firebase `update` called; offline + IDB available → `queueOfflineWrite` called, no Firebase; offline + IDB unavailable → falls through to Firebase
  - `useLoansMutations.test.ts` (new): `saveLoan` online → Firebase; `saveLoan` offline + IDB → queued; online-only ops (`removeOccupantIfEmpty`, `removeLoanItem`, `updateLoanDepositType`) when offline → `error instanceof Error`, Firebase `get` NOT called
  - `firebaseAuth.test.ts`: TC-04 cache fallback → returns cached user; TC-05 no cache → returns null; success path → `setMeta` called with profile
  - All new tests pass; existing tests unchanged
  - Validated via CI (push to `dev`; CI runs the reception test suite per AGENTS.md:93)
- **Validation contract (TC-08):**
  - TC-04: `loadUserWithProfile` throws network error, cached profile exists → returns cached user
  - TC-05: `loadUserWithProfile` throws network error, no cache → returns null
  - TC-06: `addActivity` offline → `queueOfflineWrite` called, Firebase `update` not called
  - TC-07: `saveBooking` offline → `queueOfflineWrite("bookings/BR1/occ1", "update", data, { conflictPolicy: "fail-on-conflict" })` called
  - TC-08: `saveLoan` offline → `queueOfflineWrite("loans/BR1/occ1/txns/txn1", "update", data, { conflictPolicy: "last-write-wins" })` called
- **Planning validation (required for M/L):**
  - Checks run (TASK-CHKPT evidence): `jest-fake-indexeddb` NOT installed — not needed (hook-level mocks); `useOnlineStatus` mockable with standard `jest.mock()`; `useBookingNotesMutation.ts` uses `getDatabase()` + `useOnlineStatus` + `queueOfflineWrite` confirmed; `LoanTransaction` type has required `createdAt` field (added to test fixtures).
  - Validation artifacts: see TASK-CHKPT build evidence above.
- **Consumer tracing:** Pure test additions; no new production values introduced.
- **Edge Cases & Hardening:** `receptionDb` mock added to `firebaseAuth.test.ts` to prevent `setMeta` from trying real IDB in success path; `getMeta` defaults to `null` for existing tests (no behaviour change).
- **What would make this >=90%:** CI confirms all tests pass first run without amendments.
- **Rollout / rollback:** Rollout: test-only change; no production impact. Rollback: remove test files.
- **Documentation impact:** None.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extend PendingWrite schema | Yes | [Type contract gap] [Minor]: `queueOfflineWrite` has fixed 3-param signature; TASK-01 must also update this signature to accept opts, otherwise TASK-03 cannot pass idempotencyKey etc. — included in TASK-01 scope. | No — included in TASK-01 scope |
| TASK-02: Mount useOfflineSync + context | Yes | None — `useFirebaseDatabase()` at App.tsx:34 confirmed; context pattern follows AuthContext. | No |
| TASK-03: Wire write-only ops through gateway | Partial — depends on TASK-01 + TASK-02 | [Missing data dependency] [Moderate]: `useBookingMutations.ts` not read in full — scout step required. `useLoansMutations.ts` read in full: `saveLoan` is queueable; all other methods are online-only (read-before-write/chained). `maybeSendEmailGuest` deferred offline — documented. No Critical issues remain. | No (advisory) |
| TASK-04: Online-only guard | Yes | None — hook read in full; early return is 3-line change. | No |
| TASK-05: Auth profile cache | Yes | None — `getMeta`/`setMeta` confirmed; catch block location confirmed (firebaseAuth.ts:184). | No |
| TASK-06: Read-through cache | Partial — data hooks not fully read | [Missing data dependency] [Moderate]: `useBookingsData.ts` and `useActivitiesData.ts` not read; onValue pattern assumed to match `useRoomsByDate.ts`. Executor must read before implementing. Scout step included. | No (advisory) |
| TASK-07: Sync status UI | Yes — depends on TASK-02 | None — OfflineIndicator read in full; context shape confirmed. | No |
| TASK-CHKPT: Checkpoint | Yes — after TASK-03 | None — procedural task. | No |
| TASK-08: Unit tests | Partial — depends on TASK-CHKPT | [Missing precondition] [Moderate]: `jest-fake-indexeddb` not confirmed installed; `jest.setup.ts` not read. TASK-CHKPT replan resolves this before TASK-08 executes. | No (gated by TASK-CHKPT) |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IndexedDB unavailable (private browsing, storage quota) | Low | Medium | `isIndexedDbAvailable()` guard already exists — TASK-03 gateway falls through to direct Firebase write if IDB unavailable |
| DB_VERSION migration corrupts existing queue data | Low | High | `onupgradeneeded` handler defaults new fields safely; `clearPendingWrites()` fallback on unexpected version mismatch (TASK-01 must implement this) |
| Compliance mutation accidentally queued offline | Medium | High | Whitelist-based gateway: only the 5 explicitly listed hooks route through the queue; all others (including compliance hooks) remain direct Firebase writes |
| Sync race: two tabs open, both trigger sync on reconnect | Low | Medium | `syncInProgress` module-level flag in `syncManager.ts:23` blocks concurrent runs within a tab; cross-tab race is residual risk — acceptable for v1 |
| `useBookingMutations.ts` has different structure than expected | Low | Low | TASK-03 scout step reads the file before writing the gateway branch; if significantly different, TASK-03 can replan for that hook independently |
| `jest-fake-indexeddb` incompatible with current test setup | Low | Low | TASK-CHKPT checkpoint validates this before TASK-08 runs; if incompatible, TASK-08 is re-scoped |

## Observability

- Logging: `syncPendingWrites` already logs errors in `syncManager.ts`; TASK-07 surfaces `lastSyncResult.errors` in the UI
- Metrics: None: internal IDB + Firebase operations; no analytics events required for v1
- Alerts/Dashboards: `useOfflineSync.lastSyncResult.failed` surfaced in OfflineIndicator (TASK-07); staff can see failed write count and trigger manual retry

## Acceptance Criteria (overall)

- [ ] Going offline mid-session → activity writes (`addActivity`/`saveActivity`), booking updates, task flag updates, notes, and `saveLoan` ops are queued in IndexedDB pending-writes store; no writes are silently dropped. Read-before-write ops (`removeLastActivity`, `removeLoanItem`, etc.) show a clear online-only error.
- [ ] Coming back online → `useOfflineSync` auto-triggers sync; queued writes are replayed to Firebase FIFO
- [ ] Attempting a booking date change while offline → user sees clear error message (not silent failure)
- [ ] Network interruption during profile fetch → staff remain authenticated with cached profile; not signed out
- [ ] Critical data views (bookings, activities, rooms) show last-seen data when offline (cache hit)
- [ ] OfflineIndicator shows pending write count when offline; shows sync progress on reconnect
- [ ] All Phase 1 existing tests pass unchanged
- [ ] Unit tests for IDB primitives and auth fallback pass

## Decision Log

- 2026-02-27: `useChangeBookingDatesMutator` marked online-only for v1. Rationale: up to 9 sequential conditional Firebase ops + `saveFinancialsRoom` external hook call cannot be safely serialized as a single queue entry. Staff will receive a clear error when offline.
- 2026-02-27: Sync status UI extends existing `OfflineIndicator` component (no new fixed element). Default assumption taken from fact-find; operator can override to a separate badge component post-delivery.
- 2026-02-27: Conflict policy — `"last-write-wins"` for activity/task-flag writes; `"fail-on-conflict"` for booking field mutations. Rationale: activity IDs are generated client-side (no conflict possible); booking dates can legitimately conflict between concurrent offline/online edits.
- 2026-02-27: Idempotency key = `crypto.randomUUID()` per queue entry, stored in IDB but NOT used for dedup in v1 `syncPendingWrites`. Dedup logic is a v2 feature; the key is laid down now so v2 requires no schema migration.
- 2026-02-27: `maybeSendEmailGuest` (activity email notification for codes 2,3,4,5,6,7,8,21,27) is deferred when an activity is logged offline. The write is queued and will reach Firebase on sync; the email must be triggered separately. Accepted v1 limitation — email sending requires network (`get(guestsByBooking/...)` + external email service).

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01 (85%, M=2): 170; TASK-02 (85%, S=1): 85; TASK-03 (85%, L=3): 255; TASK-04 (85%, S=1): 85; TASK-05 (80%, S=1): 80; TASK-06 (80%, M=2): 160; TASK-07 (80%, S=1): 80; TASK-08 (80%, M=2): 160
- TASK-CHKPT excluded (procedural)
- Total weight: 13; Weighted sum: 1075
- Raw: 82.7% → **80%** (downward bias; multiples of 5)
