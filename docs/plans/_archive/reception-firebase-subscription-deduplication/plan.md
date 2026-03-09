---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Archived-date: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-firebase-subscription-deduplication
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Firebase Subscription Deduplication Plan

## Summary

The reception app's Firebase data layer opens far more concurrent listeners than necessary. This plan eliminates four patterns: (1) retiring the dead `useCheckinsData` orchestration hook, (2) refactoring `useActivitiesByCodeData` from a per-code listener fan-out to a single subtree listener with client-side filtering, (3) refactoring `useBookingMetaStatuses` from an N+1 per-booking pattern to a single subtree listener, and (4) removing the module-level `isEqual` helper from `useActivitiesByCodeData` and replacing it with a bounded per-code `JSON.stringify` comparison in the state updater. All changes are data-layer only; no UI components change. Hook return interfaces remain backward-compatible throughout.

## Active tasks

- [x] TASK-01: Retire `useCheckinsData` orchestration hook
- [x] TASK-02: Refactor `useActivitiesByCodeData` to single subtree listener
- [x] TASK-03: Rewrite `useActivitiesByCodeData` unit tests for subtree pattern
- [x] TASK-04: Refactor `useBookingMetaStatuses` to single subtree listener
- [x] TASK-05: Rewrite `useBookingMetaStatuses` unit tests for subtree pattern
- [x] TASK-06: Add `useCheckinsTableData` unit tests

## Goals

- Reduce Firebase listener count on the Checkins page from `4 + N` (where N is booking count, 50+ on a busy day) to 2 fixed listeners.
- Reduce Firebase listener count on the EmailProgress page from 25 per-code to 1 subtree listener.
- Eliminate dead code (`useCheckinsData` orchestration hook has zero production call sites).
- Remove the module-level `isEqual`/`JSON.stringify` helper that runs on the entire per-code object and replace it with a bounded per-code `JSON.stringify` comparison in the state updater (comparing only one code's occupant map, not the full `activitiesByCodes` object).

## Non-goals

- Changes to any UI components (CheckinsTable, CheckinsTableView, Alloggiati, etc.).
- Changes to mutation hooks (`useArchiveBooking`, `useDeleteGuestFromBooking`).
- Changing the Firebase database schema or data model.
- Migrating other data hooks to `FirebaseSubscriptionCacheProvider`.
- Performance profiling or measurement infrastructure.

## Constraints & Assumptions

- Constraints:
  - Data layer only — hook interfaces (return shape and field names) must remain backward-compatible for all call sites.
  - Tests run in CI only; never locally.
  - Writer lock required for all commits.
  - No `--no-verify` on commits.
- Assumptions:
  - Firebase rules permit reads at `/activitiesByCode` root (evidenced by `useArchiveCheckedOutGuests.ts` using `get(ref(database, "activitiesByCode"))`).
  - Firebase rules permit reads at `/bookingMeta` root (evidenced by archive mutations writing to the root path).
  - `useCheckinsData` (orchestrations) has zero production call sites — confirmed by grep.

## Inherited Outcome Contract

- **Why:** Excessive Firebase listeners increase connection overhead, increase data transfer, and can hit Firebase connection limits. The `useEmailProgressData` hook opens 25 concurrent listeners for codes 1–25. The N+1 booking meta pattern opens 50+ listeners on a loaded Checkins page.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Checkins page opens at most 2 distinct Firebase listeners for the activitiesByCode and bookingMeta paths regardless of booking count. `useActivitiesByCodeData` uses a single subtree listener with client-side filtering. `useCheckinsData` orchestration hook is deleted.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-firebase-subscription-deduplication/fact-find.md`
- Key findings used:
  - `useCheckinsData` confirmed zero production call sites — only imported in its test file.
  - `/activitiesByCode` subtree is addressable at root (evidenced by mutations using full path).
  - `/bookingMeta` subtree is addressable at root (evidenced by archive mutations).
  - `activitiesByCodeForOccupantSchema` validates a single code node — implementation must iterate per filtered code key.
  - Deduplication after `isEqual` removal: retain per-code `JSON.stringify` comparison bounded to one `ActivitiesByCodeForOccupant` sub-object (not the full `activitiesByCodes` map). `safeParse` always constructs a new object so reference equality cannot be used; per-code `JSON.stringify` is correct and bounded (occupant map for one code, typically small).
  - 9 total call sites for `useActivitiesByCodeData` — 8 production + 1 dead.

## Proposed Approach

- Option A: Retire `useCheckinsData`, refactor the two N+1 hooks to subtree listeners independently, rewrite their tests, and add a new `useCheckinsTableData` test.
- Option B: Also integrate with `FirebaseSubscriptionCacheProvider`.
- Chosen approach: Option A. Option B was assessed in the fact-find as infeasible/disproportionate — the cache's `subscribe/unsubscribe` API is incompatible with the validation and multi-code aggregation patterns in `useActivitiesByCodeData`, and the subtree approach achieves the listener-count goal without that complexity. Hooks in scope are component-level (not shared across multiple component trees), so cache deduplication provides no additional value here.

## Plan Gates

- Foundation Gate: Pass — Deliverable-Type, Execution-Track, Primary-Execution-Skill all present. Test landscape documented. Testability score 85%. All 6 tasks have ≥80% confidence.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Retire `useCheckinsData` orchestration hook | 95% | S | Complete (2026-03-09) | - | - |
| TASK-02 | IMPLEMENT | Refactor `useActivitiesByCodeData` to single subtree listener | 90% | M | Complete (2026-03-09) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Rewrite `useActivitiesByCodeData` unit tests | 90% | S | Complete (2026-03-09) | TASK-02 | - |
| TASK-04 | IMPLEMENT | Refactor `useBookingMetaStatuses` to single subtree listener | 90% | M | Complete (2026-03-09) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Rewrite `useBookingMetaStatuses` unit tests | 90% | S | Complete (2026-03-09) | TASK-04 | - |
| TASK-06 | IMPLEMENT | Add `useCheckinsTableData` unit tests | 85% | M | Complete (2026-03-09) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-06 | - | All independent; can run in parallel. TASK-01 is pure deletion, fastest to complete. |
| 2 | TASK-03, TASK-05 | TASK-02 (for 03), TASK-04 (for 05) | Await their respective implementations before rewriting tests. |

## Tasks

---

### TASK-01: Retire `useCheckinsData` orchestration hook

- **Type:** IMPLEMENT
- **Deliverable:** Delete `useCheckinsData.ts` and `useCheckinsData.test.ts`; verify zero remaining import sites.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` (deleted)
  - `apps/reception/src/hooks/orchestrations/checkin/__tests__/useCheckinsData.test.ts` (deleted)
  - `[readonly] apps/reception/src/hooks/orchestrations/checkin/buildCheckinRows.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — File deletion with confirmed zero production consumers. Only uncertainty: confirm no dynamic imports or string-based require references exist.
  - Approach: 95% — Deletion is the correct action; no refactor or redirect needed.
  - Impact: 95% — Removes dead code and its test. Zero runtime impact.
- **Acceptance:**
  - [ ] `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` does not exist.
  - [ ] `apps/reception/src/hooks/orchestrations/checkin/__tests__/useCheckinsData.test.ts` does not exist.
  - [ ] `grep -r "useCheckinsData"` in `apps/reception/src` returns no hits (except inside `buildCheckinRows.ts` comments if any — verify).
  - [ ] TypeScript compiles cleanly after deletion (`pnpm --filter @apps/reception typecheck`).
  - [ ] Lint passes (`pnpm --filter @apps/reception lint`).
- **Validation contract (TC-XX):**
  - TC-01: Grep for `useCheckinsData` import in all `.ts`/`.tsx` files → zero matches outside the now-deleted files.
  - TC-02: `pnpm --filter @apps/reception typecheck` passes with no errors related to removed files.
  - TC-03: `pnpm --filter @apps/reception lint` passes.
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm zero import sites via grep before deleting.
  - Green: Delete both files. Run typecheck and lint.
  - Refactor: None needed.
- **Planning validation (required for M/L):** N/A — Effort S.
- **Scouts:** Verify no dynamic `require("./useCheckinsData")` or `import(...)` string reference exists in the orchestrations directory.
- **Edge Cases & Hardening:**
  - If any import is found that grep missed (e.g., barrel export): do not delete; add it to imports to update first.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Delete files, commit with writer lock, push to dev, monitor CI.
  - Rollback: `git revert` the deletion commit.
- **Documentation impact:** None.
- **Notes / references:**
  - Confirmed by grep: `apps/reception/src/hooks/orchestrations/checkin/useCheckinsData.ts` and its test are the only files referencing `useCheckinsData`.

---

### TASK-02: Refactor `useActivitiesByCodeData` to single subtree listener

- **Type:** IMPLEMENT
- **Deliverable:** Rewrite `useActivitiesByCodeData.ts` to subscribe to `/activitiesByCode` root via a single `onValue` listener, filter by requested codes client-side, validate each sub-node with `activitiesByCodeForOccupantSchema`, and replace the module-level `isEqual` helper with bounded per-code `JSON.stringify` deduplication in the state updater.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/useActivitiesByCodeData.ts`
  - `[readonly] apps/reception/src/schemas/activitiesByCodeSchema.ts`
  - `[readonly] apps/reception/src/types/hooks/data/activitiesByCodeData.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — Hook rewrite is well-scoped. Schema validation pattern (per-code iteration) is clear. Per-code `JSON.stringify` deduplication is retained inline (module-level `isEqual` removed) — correct because `safeParse` always constructs a new object so reference equality cannot be used. One held-back risk: Firebase rules must allow reads at `/activitiesByCode` root (assumed yes from mutation evidence, not directly verified in `database.rules.json`).
  - Approach: 90% — Single subtree listener + client-side filter is the standard Firebase pattern for this scenario. Confirmed `/activitiesByCode` is addressable at root.
  - Impact: 90% — Reduces listener count from N-per-codes to 1 for all 8 production call sites. Return interface unchanged; callers unaffected.
- **Acceptance:**
  - [ ] Single `onValue` subscription on `activitiesByCode` root (not per-code paths).
  - [ ] `activitiesByCodes` state only contains keys for codes in the requested `codes` array.
  - [ ] Each filtered sub-node is validated with `activitiesByCodeForOccupantSchema` before being set in state; invalid sub-nodes set `error` state.
  - [ ] `isEqual` global function removed. Per-code deduplication retained using `JSON.stringify` bounded to the per-code `ActivitiesByCodeForOccupant` sub-object: in the state updater, `if (JSON.stringify(prev[codeStr]) === JSON.stringify(transformed)) return prev;`.
  - [ ] Loading logic: `loading` becomes `false` when the first snapshot arrives (all codes are either present or absent in one delivery).
  - [ ] `skip` prop still works: no subscription opened, returns `{}` with `loading: false`.
  - [ ] Empty `codes` array: no subscription opened, returns `{}` with `loading: false`.
  - [ ] Cleanup on unmount: single `unsubscribe` call tears down the one listener.
  - [ ] TypeScript compiles cleanly. Lint passes. Return type signature unchanged: `{ activitiesByCodes: Record<string, ActivitiesByCodeForOccupant>, loading: boolean, error: unknown }`.
- **Validation contract (TC-XX):**
  - TC-01: Single `onValue` call registered → `onValue` mock called exactly once regardless of `codes` array length.
  - TC-02: Subtree snapshot with codes `[5, 21]` requested, snapshot contains keys `5`, `12`, `21` → `activitiesByCodes` contains only keys `"5"` and `"21"` (key `"12"` filtered out).
  - TC-03: `skip: true` → `onValue` never called, `loading` is `false`, `activitiesByCodes` is `{}`.
  - TC-04: Empty `codes: []` → `onValue` never called, `loading` is `false`, `activitiesByCodes` is `{}`.
  - TC-05: Sub-node fails schema validation → `error` state set; valid sub-nodes for other codes remain in state.
  - TC-06: Identical snapshot delivered twice (same data) → `activitiesByCodes` result from `renderHook` is unchanged (same object reference) between the two deliveries, confirming per-code `JSON.stringify` comparison suppresses the redundant update.
  - TC-07: Unmount → unsubscribe function called exactly once.
  - TC-08: `codesKey` changes (caller changes `codes` prop) → old listener unsubscribed, new listener registered.
- **Execution plan:** Red → Green → Refactor
  - Red: Write new implementation that opens a single listener on `activitiesByCode`, iterates over `codes`, validates each sub-node. Remove the `isEqual` top-level helper. Replace with inline per-code deduplication in the setState functional update: `if (JSON.stringify(prev[codeStr]) === JSON.stringify(transformed)) return prev; return { ...prev, [codeStr]: transformed };`. Keep existing hook signature.
  - Green: All TC-01–TC-08 assertions pass in updated test file (written in TASK-03).
  - Refactor: Remove `isEqual` helper function entirely (no longer needed). Clean up `codesKey` usage — `codesKey` is still used for effect dependency stability (codes change detection), but the loading logic changes: `loading` becomes `false` on first snapshot rather than when all codes have entries (since the subtree delivers all at once).
- **Planning validation:**
  - Checks run: Read `useActivitiesByCodeData.ts` (confirmed current per-code loop pattern), `activitiesByCodeSchema.ts` (confirmed per-code validation schema shape), `useActivitiesByCodeData.test.ts` (confirmed mock infrastructure supports per-path `onValue`).
  - Validation artifacts: fact-find evidence at paths above.
  - Unexpected findings: Loading completion logic must change — current hook waits for each code to have an entry before `loading = false`; subtree delivers all codes at once so `loading = false` on first snapshot regardless of `codes` count.
- **Scouts:** Confirm Firebase security rules allow `get`/`listen` on `/activitiesByCode` root. Evidence exists (`useArchiveCheckedOutGuests.ts` line 99 uses `get(ref(database, "activitiesByCode"))`).
- **Edge Cases & Hardening:**
  - `codes` prop changes mid-lifecycle: `codesKey` change in effect deps triggers cleanup of old listener and registration of new one — no change from current behavior.
  - Empty subtree snapshot (no data under `activitiesByCode`): all requested codes produce `{}` entries; `loading = false`.
  - Partial subtree (some codes present, others absent): absent codes produce `{}` entries in state (same as current behavior when no data).
- **What would make this >=95%:** Direct verification that Firebase rules allow root reads at `/activitiesByCode` (check `database.rules.json` if it exists in the repo).
- **Rollout / rollback:**
  - Rollout: Commit with writer lock. Push to dev. CI runs `useActivitiesByCodeData.test.ts` (TASK-03 must also be committed). Monitor CI.
  - Rollback: `git revert` the TASK-02 + TASK-03 commits together.
- **Documentation impact:** None — internal data hook, no external API or documented contract.
- **Notes / references:**
  - Consumer tracing: All 8 production call sites use the same return shape `{ activitiesByCodes, loading, error }`. None inspects internal listener count or path structure. Interface is backward-compatible.
  - `usePrepaymentData.ts` imports `useActivitiesByCodeData` aliased as `useActivityByCode` — same hook, different local name, no change needed at call site.

---

### TASK-03: Rewrite `useActivitiesByCodeData` unit tests for subtree pattern

- **Type:** IMPLEMENT
- **Deliverable:** Rewrite `apps/reception/src/hooks/data/__tests__/useActivitiesByCodeData.test.ts` to assert the new single-path subtree subscription pattern (TC-01–TC-08 from TASK-02).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/__tests__/useActivitiesByCodeData.test.ts`
  - `[readonly] apps/reception/src/hooks/data/useActivitiesByCodeData.ts`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Test rewrite follows existing Firebase mock pattern (mock `firebase/database` module). New assertions are well-defined in TC-01–TC-08.
  - Approach: 90% — Rewriting (not patching) is correct; the per-path mock setup is incompatible with the subtree pattern.
  - Impact: 90% — Full TC coverage for the refactored hook. Eliminates outdated per-path assertions.
- **Acceptance:**
  - [ ] All 8 test cases (TC-01–TC-08) from TASK-02 are implemented as Jest test cases.
  - [ ] `onValue` mock accepts a single call with path `activitiesByCode` (root) and delivers a full subtree snapshot.
  - [ ] Test for client-side filtering (TC-02): snapshot has extra codes; only requested codes appear in result.
  - [ ] Tests for `skip`, empty codes, schema error, deduplication, unmount cleanup, and codes-change re-subscription.
  - [ ] CI passes for this test file.
- **Validation contract (TC-XX):**
  - TC-01: Tests match the TASK-02 acceptance criteria.
  - TC-02: CI green for `useActivitiesByCodeData.test.ts`.
- **Execution plan:** Red → Green → Refactor
  - Red: Existing tests assert per-path `onValue` calls — they fail against the new subtree implementation.
  - Green: Rewrite test file with new subtree mock; all assertions pass.
  - Refactor: Remove any leftover per-path test setup that is no longer valid.
- **Planning validation:** N/A — Effort S.
- **Scouts:** None required.
- **Edge Cases & Hardening:** Test TC-06 carefully — the mock must deliver the same snapshot data twice and assert that `setActivitiesByCodes` is not called a second time (per-code `JSON.stringify` equality prevents the update).
- **What would make this >=95%:** Adding a TC that explicitly verifies `onValue` is called only once even for `codes: [1, 2, 3, ..., 25]` (the `useEmailProgressData` case).
- **Rollout / rollback:** Committed together with TASK-02.
- **Documentation impact:** None.
- **Notes / references:** Follow the established `jest.mock("firebase/database", ...)` pattern already in the file. Mock path: `activitiesByCode` (root, not `activitiesByCode/5` etc.).

---

### TASK-04: Refactor `useBookingMetaStatuses` to single subtree listener

- **Type:** IMPLEMENT
- **Deliverable:** Rewrite `useBookingMetaStatuses.ts` to subscribe to `/bookingMeta` root via a single `onValue` listener and extract status per booking ref client-side.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/useBookingMetaStatuses.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 90% — Simpler than TASK-02 (no schema validation loop, no codes filtering). Single subtree delivers `Record<bookingRef, { status?, cancelledAt?, ... }>`. Extract `status` per ref from snapshot. One held-back risk: Firebase rules must allow reads at `/bookingMeta` root.
  - Approach: 90% — Subtree-then-filter is the correct pattern. `bookingRefsStable`/`bookingRefsKey` are retained for effect dep stability (callers may pass inline arrays; without a stable key the subtree listener would re-subscribe on every render).
  - Impact: 90% — On a Checkins page with 50 booking refs, reduces from 50 listeners to 1. `CheckinsTable.tsx` call site unchanged.
- **Acceptance:**
  - [ ] Single `onValue` subscription on `bookingMeta` root.
  - [ ] Returned `Record<bookingRef, string | undefined>` only contains refs present in the `bookingRefs` parameter.
  - [ ] Refs not in `bookingRefs` are excluded from returned state (client-side filter on snapshot keys).
  - [ ] Empty `bookingRefs` array: no subscription opened, returns `{}`.
  - [ ] A `bookingRef` not present in the subtree snapshot: its status is `undefined` in the returned map.
  - [ ] Cleanup on unmount: single unsubscribe call.
  - [ ] TypeScript compiles cleanly. Lint passes. Return type unchanged: `Record<string, string | undefined>`.
  - [ ] `bookingRefsKey`/`bookingRefsStable` retained for effect dep stability (callers may pass inline arrays; a `JSON.stringify` key prevents unnecessary re-subscribes). The per-ref listener loop is removed; the stability memos remain.
- **Validation contract (TC-XX):**
  - TC-01: Single `onValue` call on path `bookingMeta` regardless of `bookingRefs` length.
  - TC-02: Snapshot contains refs A, B, C; `bookingRefs` is `[A, B]` → returned map contains only A and B.
  - TC-03: Empty `bookingRefs` → `onValue` not called, returns `{}`.
  - TC-04: Ref B in `bookingRefs` but absent from snapshot → `statuses["B"]` is `undefined`.
  - TC-05: Ref A has `status: "cancelled"` → `statuses["A"]` is `"cancelled"`.
  - TC-06: `bookingRefs` changes (e.g., new booking added) → old listener unsubscribed, new listener registered.
  - TC-07: Unmount → unsubscribe called exactly once.
- **Execution plan:** Red → Green → Refactor
  - Red: Replace per-ref `for` loop with a single `onValue` on `bookingMeta`. In the snapshot handler: `const snapshotVal = snapshot.val() ?? {}`. Build result map by iterating `bookingRefsStable` and extracting `snapshotVal[ref]?.status ?? undefined`. Set state with the filtered map.
  - Green: All TC-01–TC-07 pass in updated test file (TASK-05).
  - Refactor: Retain `bookingRefsKey`/`bookingRefsStable` as the effect dep stability mechanism (inline array callers would re-subscribe on every render without it). Remove only the per-ref `for` loop and the per-ref `onValue` calls.
- **Planning validation:**
  - Checks run: Read `useBookingMetaStatuses.ts` (confirmed per-ref loop), `CheckinsTable.tsx` (confirmed sole consumer, uses `useMemo` for `allBookingRefs`), `useBookingMetaStatuses.test.ts` (confirmed test infrastructure).
  - Validation artifacts: fact-find evidence.
  - Unexpected findings: The caller (`CheckinsTable`) already memoizes `allBookingRefs` with `useMemo` — but array reference changes when content changes. Retaining a `JSON.stringify` key for effect deps is still correct for the subtree approach (triggers re-subscribe when ref set changes).
- **Scouts:** Confirm `bookingMeta` subtree delivers `{ [bookingRef]: { status?: string, cancelledAt?: string, ... } }` shape. Evidenced by `useArchiveBooking.ts` writing `bookingMeta/${bookingRef}/status`.
- **Edge Cases & Hardening:**
  - `bookingRefs` changes: effect re-runs, old listener torn down, new listener registered. State reset before new subscribe to avoid stale entries from previous ref set.
  - Very large `bookingMeta` subtree: only `bookingRefs` in the current parameter are included in returned state — no unbounded state growth.
- **What would make this >=95%:** Direct verification of Firebase rules at `/bookingMeta` root read access.
- **Rollout / rollback:**
  - Rollout: Commit with writer lock. Push to dev. CI runs both hook test and `CheckinsTable` integration context.
  - Rollback: `git revert` TASK-04 + TASK-05 commits.
- **Documentation impact:** None.
- **Notes / references:**
  - Consumer tracing: `CheckinsTable.tsx` calls `useBookingMetaStatuses(allBookingRefs)` and uses the returned map only for `status !== "cancelled"` check. Interface unchanged.

---

### TASK-05: Rewrite `useBookingMetaStatuses` unit tests for subtree pattern

- **Type:** IMPLEMENT
- **Deliverable:** Rewrite `apps/reception/src/hooks/data/__tests__/useBookingMetaStatuses.test.ts` to assert the new single-path subtree subscription pattern (TC-01–TC-07 from TASK-04).
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/__tests__/useBookingMetaStatuses.test.ts`
  - `[readonly] apps/reception/src/hooks/data/useBookingMetaStatuses.ts`
- **Depends on:** TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Follows same rewrite pattern as TASK-03. TC-01–TC-07 are well-specified.
  - Approach: 90% — Rewrite is correct; existing tests assert `bookingMeta/BOOK1/status` per-path which is incompatible with subtree pattern.
  - Impact: 90% — Full coverage for the refactored hook.
- **Acceptance:**
  - [ ] All 7 test cases (TC-01–TC-07 from TASK-04) implemented.
  - [ ] `onValue` mock asserts single call on path `bookingMeta` (root).
  - [ ] Test TC-02 asserts client-side filtering: extra refs in snapshot don't appear in returned map.
  - [ ] TC-06 tests re-subscription on `bookingRefs` change.
  - [ ] CI passes.
- **Validation contract (TC-XX):**
  - TC-01: CI green for `useBookingMetaStatuses.test.ts`.
- **Execution plan:** Red → Green → Refactor
  - Red: Current tests assert per-ref path `bookingMeta/BOOK1/status` — fail against new implementation.
  - Green: Rewrite all 5 existing tests to assert single root path; add TC-02 (client-side filter) and TC-06 (re-subscribe on change).
  - Refactor: Remove per-path mock setup.
- **Planning validation:** N/A — Effort S.
- **Scouts:** None required.
- **Edge Cases & Hardening:** TC-04 (ref not in snapshot → `undefined`) must not produce `null` — verify hook returns `undefined` not `null`.
- **What would make this >=95%:** Adding a TC for very large snapshot (100+ refs) to confirm client-side filter performance is acceptable.
- **Rollout / rollback:** Committed together with TASK-04.
- **Documentation impact:** None.
- **Notes / references:** Follow `jest.mock("firebase/database", ...)` pattern already in the file.

---

### TASK-06: Add `useCheckinsTableData` unit tests

- **Type:** IMPLEMENT
- **Deliverable:** Create `apps/reception/src/hooks/data/__tests__/useCheckinsTableData.test.ts` with unit tests covering the happy path, loading state, and error propagation.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/hooks/data/__tests__/useCheckinsTableData.test.ts` (new file)
  - `[readonly] apps/reception/src/hooks/data/useCheckinsTableData.ts`
  - `[readonly] apps/reception/src/hooks/orchestrations/checkin/buildCheckinRows.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — New test file following established mock pattern from `useCheckinsData.test.ts`. All 9 child hooks have known mock signatures. Minor uncertainty: `buildCheckinRows` may need to be mocked or tested through; the test should mock child hooks and verify integration with `buildCheckinRows` directly (pure function, no mock needed).
  - Approach: 85% — Mock all 9 child hooks: `useBookingsData`, `useGuestDetails`, `useFinancialsRoom`, `useCityTax`, `useLoans`, `useActivitiesData`, `useCheckins`, `useGuestByRoom`, `useActivitiesByCodeData`. Render with `renderHook`; assert `rows`, `loading`, `error`, `validationError`.
  - Impact: 85% — Fills confirmed coverage gap. Provides regression protection for future changes to `useCheckinsTableData`.
- **Acceptance:**
  - [ ] New test file at `apps/reception/src/hooks/data/__tests__/useCheckinsTableData.test.ts`.
  - [ ] At minimum 4 test cases: happy path (rows returned), loading state, error propagation, validation error.
  - [ ] All 9 child hooks mocked via `jest.mock`: `useBookingsData`, `useGuestDetails`, `useFinancialsRoom`, `useCityTax`, `useLoans`, `useActivitiesData`, `useCheckins`, `useGuestByRoom`, `useActivitiesByCodeData`.
  - [ ] `buildCheckinRows` called through (not mocked) — validates integration.
  - [ ] CI passes.
- **Validation contract (TC-XX):**
  - TC-01: All child hooks return data → `rows` is non-empty, `loading` is `false`, `error` is `null`.
  - TC-02: One child hook returns `loading: true` → hook's `loading` is `true`.
  - TC-03: One child hook returns an error → hook's `error` is that error, `rows` is `[]`.
  - TC-04: `guestDetails` returns a `validationError` → hook's `validationError` is set, `rows` is still returned.
- **Execution plan:** Red → Green → Refactor
  - Red: No test file exists — this is a new file.
  - Green: Create test file using `useCheckinsData.test.ts` as template. Adapt for `useCheckinsTableData` signature (`rows` instead of `data`, `selectedDate`/`daysBefore`/`daysAfter` params). Mock all 9 child hooks with same base data structure.
  - Refactor: Ensure test data drives at least one row through `buildCheckinRows` to confirm integration (TC-01).
- **Planning validation:**
  - Checks run: Read `useCheckinsData.test.ts` (confirmed template exists), `useCheckinsTableData.ts` (confirmed hook signature and child hook list).
  - Validation artifacts: fact-find Key Modules section.
  - Unexpected findings: `useCheckinsTableData` passes a `dateQuery` param to `useCheckins` (unlike `useCheckinsData` which passes no args). Test mock must accommodate this — `useCheckins` mock should accept the `dateQuery` arg and return the same mock checkins data.
- **Scouts:** Verify `useGuestDetails` in `useCheckinsTableData` receives an `isCheckedIn` callback — the mock must handle this optional parameter.
- **Edge Cases & Hardening:**
  - TC-05 (optional): `bookings` is null → `rows` is `[]`, no error thrown.
- **What would make this >=90%:** Adding TC-05 and verifying that `selectedDate` windowing (`daysBefore`/`daysAfter`) correctly filters rows.
- **Rollout / rollback:**
  - Rollout: Commit with writer lock. Push to dev. CI must pass the new test file.
  - Rollback: Delete the new test file if CI issues arise (no production code changed).
- **Documentation impact:** None.
- **Notes / references:**
  - `useCheckinsTableData` calls `useCheckins(dateQuery)` where `dateQuery = { startAt: string, endAt: string }`. The `useCheckinsData.test.ts` mocks `useCheckins` with no args — note the difference.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Firebase rules block root reads at `/activitiesByCode` or `/bookingMeta` | Low | High | Evidence from mutations using full path; if blocked, fall back to per-code/per-ref pattern for affected path only. |
| Subtree listener on `/activitiesByCode` delivers all code keys; client-side filter misses a requested code | Low | Moderate | TASK-02 TC-02 directly tests filtering correctness. |
| `isEqual` helper removed; per-code dedup may be incorrect | Low | Low | Retained per-code `JSON.stringify` comparison on `ActivitiesByCodeForOccupant` sub-object (bounded to one code's occupant map). `safeParse` constructs a new object per call so reference equality is NOT used — `JSON.stringify` is the correct deduplication mechanism here. TASK-03 TC-06 validates this. |
| `useCheckinsTableData` test (TASK-06) finds behavioral bugs in `buildCheckinRows` integration | Low | Low | `buildCheckinRows` is a pure function with its own test suite. Unexpected failures become bug reports. |
| `bookingRefs` stability in `CheckinsTable` after TASK-04 refactor causes re-subscribe loops | Low | Moderate | Retain `JSON.stringify` key for effect deps in `useBookingMetaStatuses`. `CheckinsTable` already uses `useMemo` for `allBookingRefs`. |

## Observability

- Logging: None required — this is a data-layer optimization.
- Metrics: Firebase emulator or console subscription count (informal verification post-deploy).
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] TASK-01: `useCheckinsData.ts` and its test deleted; zero import sites remain.
- [ ] TASK-02: `useActivitiesByCodeData` opens 1 listener regardless of `codes` array length; all 8 production call sites unaffected (interface backward-compatible).
- [ ] TASK-03: CI passes `useActivitiesByCodeData.test.ts` with subtree pattern assertions.
- [ ] TASK-04: `useBookingMetaStatuses` opens 1 listener regardless of `bookingRefs` length.
- [ ] TASK-05: CI passes `useBookingMetaStatuses.test.ts` with subtree pattern assertions.
- [ ] TASK-06: CI passes new `useCheckinsTableData.test.ts` with 4+ test cases.
- [ ] TypeScript compilation passes (`pnpm --filter @apps/reception typecheck`) after all tasks.
- [ ] Lint passes (`pnpm --filter @apps/reception lint`) after all tasks.

## Decision Log

- 2026-03-09: Chose Option A (no `FirebaseSubscriptionCacheProvider` integration). Cache integration is infeasible for `useActivitiesByCodeData` due to multi-code aggregation pattern incompatibility. Subtree approach achieves listener-count goal without cache complexity.
- 2026-03-09: Retained per-code `JSON.stringify` deduplication in `useActivitiesByCodeData` state updater. Reference equality cannot be used because `safeParse` always constructs a new object. Removed the module-level `isEqual` helper; replaced with an inline `JSON.stringify` comparison bounded to the per-code `ActivitiesByCodeForOccupant` sub-object (small and bounded).

## Overall-confidence Calculation

| Task | Confidence | Effort (weight) | Weighted |
|---|---|---|---|
| TASK-01 | 95% | S (1) | 95 |
| TASK-02 | 90% | M (2) | 180 |
| TASK-03 | 90% | S (1) | 90 |
| TASK-04 | 90% | M (2) | 180 |
| TASK-05 | 90% | S (1) | 90 |
| TASK-06 | 85% | M (2) | 170 |
| **Total** | | **9** | **805** |

**Overall-confidence = 805 / 9 = 89.4% → rounded to nearest 5 per scoring rules = 90%**

Frontmatter: `Overall-confidence: 90%`.

> Note: Frontmatter updated to `Overall-confidence: 90%`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Retire `useCheckinsData` | Yes — confirmed zero import sites; files exist | None | No |
| TASK-02: Refactor `useActivitiesByCodeData` | Yes — source file exists, schema exists, return type documented | Minor: loading logic must change (subtree delivers all codes at once, not per-code). Documented in Execution plan. | No |
| TASK-03: Rewrite `useActivitiesByCodeData` tests | Yes — TASK-02 must complete first; existing test file has compatible mock infrastructure | None | No |
| TASK-04: Refactor `useBookingMetaStatuses` | Yes — source file exists; subtree path confirmed via mutation evidence | Minor: `bookingRefsKey`/`bookingRefsStable` may need to be retained or adapted for effect deps. Documented in Execution plan. | No |
| TASK-05: Rewrite `useBookingMetaStatuses` tests | Yes — TASK-04 must complete first | None | No |
| TASK-06: Add `useCheckinsTableData` tests | Yes — hook file exists; template (`useCheckinsData.test.ts`) available; `buildCheckinRows` is a pure function | Minor: `useCheckins` called with `dateQuery` arg in `useCheckinsTableData` vs no arg in `useCheckinsData` — mock must accommodate. Documented in Notes. | No |

No Critical findings. All advisory findings are documented in task Execution plans.
