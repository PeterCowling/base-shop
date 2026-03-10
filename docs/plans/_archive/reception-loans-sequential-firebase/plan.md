---
Type: Plan
Status: Active
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Build-completed: 2026-03-09
Status: Archived
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-loans-sequential-firebase
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Loans — Sequential Firebase Optimisation Plan

## Summary

`useLoansMutations.ts` issues 3-4 sequential Firebase operations per loan removal — a `get()` to read the deposit, a `remove()` to delete the transaction, a second `get()` to check occupant emptiness, and a conditional `remove()` for cleanup. For 10 keycard loans at checkout this serialises ~40 hook-level Firebase operations. This plan replaces the sequential pattern with Firebase multi-path atomic `update()` calls using null-writes for deletes, eliminating all avoidable pre-reads by sourcing data from the already-subscribed `LoanDataContext` state. The blast radius is tightly contained: two files change (`useLoansMutations.ts` and `LoanDataContext.tsx`) plus test extension. No UI changes required.

## Active tasks

- [x] TASK-01: Refactor useLoansMutations — null-write pattern + optional params
- [x] TASK-02: Update LoanDataContext wrappers to pass context data into hook
- [x] TASK-03: Extend and rewrite useLoansMutations tests

## Goals

1. Eliminate the `get()` pre-read in `removeLoanItem` by sourcing deposit from `LoanDataContext` state.
2. Collapse `removeOccupantIfEmpty`'s `get()` + conditional `remove()` into a single null-write when occupancy is known from context.
3. Eliminate `removeLoanTransactionsForItem`'s `get()` by accepting pre-computed matching txn IDs from context.
4. Reduce hook-level Firebase operations for 10-keycard bulk checkout from ~40 to ~10 (75% reduction in hook-controlled ops).

## Non-goals

- Changes to `useActivitiesMutations` (already multi-path).
- Changes to `useAllTransactions` (idempotency guard requires its read).
- Changes to `updateLoanDepositType` (its `get()` is load-bearing — needs `count` for deposit calculation).
- Changes to `convertKeycardDocToCash` (its ops are all semantically required, no avoidable pre-reads).
- Offline queue support for removal operations (by design — removals are online-only).
- UI component changes.

## Constraints & Assumptions

- Constraints:
  - New optional params on hook functions must fall back safely to the existing `get()` path when not supplied (backward-compatible — protects any future direct callers).
  - Firebase null-write pattern: `update(ref(database), { 'path/to/node': null })` atomically deletes the node.
  - `LoanDataContext` realtime subscription is the source of truth; staleness window is ms-level (acceptable).
  - Tests run in CI only — never locally. Push to `origin/dev`, monitor with `gh run watch`.
- Assumptions:
  - All callers of `removeLoanItem`, `removeLoanTransactionsForItem`, and `removeOccupantIfEmpty` go through `LoanDataContext` wrappers (confirmed: 11 files reference the hook; all via context or tests).
  - `loansState` in context is always consistent at time of removal (realtime subscription guarantee).

## Inherited Outcome Contract

- **Why:** Sequential Firebase round-trips add latency to checkout operations and increase the window for partial-failure states in bulk checkout flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Loan removal uses Firebase multi-path atomic updates where possible. Hook-level Firebase ops for bulk checkout (10 keycard loans) drop from ~40 to ~10 (75% reduction in ops this hook controls). Total end-to-end ops per item drop from ~8-9 to ~5-6 (35-40% overall reduction; remaining ops are in `addToAllTransactions` and `logActivity` which are out of scope).
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-loans-sequential-firebase/fact-find.md`
- Key findings used:
  - `LoanDataContext.removeLoanItemAndUpdate` (lines 137-176) already has the txn data in `loansState` — deposit is `loansState[bookingRef][occupantId].txns[txnId].deposit`.
  - `LoanDataContext.removeLoanTransactionsForItemAndUpdate` (lines 189-197) already iterates `loansState` to find matching txn IDs for the optimistic update — those same IDs can be passed to the hook.
  - `useActivitiesMutations` already uses `update(ref(database), updates)` with null-writes — reference implementation confirmed.
  - `useLoansMutations.test.ts` has a parallel-removal ordering test that asserts `removeMock` calls — must be rewritten after refactor.

## Proposed Approach

- Option A: Keep `remove()` calls for individual txn deletes, only batch the occupant cleanup.
- Option B: Replace all `remove()` calls with `update()` null-writes. Pass optional context data to skip all pre-reads. Fall back to `get()` when params not supplied.
- **Chosen approach: Option B.** The null-write pattern is already in the codebase (`useActivitiesMutations.removeLastActivity`), is atomic, and eliminates both the pre-reads and the `remove()` import. The fallback `get()` path preserves backward compatibility without complexity. No DECISION task needed — the approach is unambiguous given the evidence.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Refactor useLoansMutations — null-write + optional params | 85% | M | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Update LoanDataContext wrappers to pass context data | 85% | S | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Extend and rewrite useLoansMutations tests | 85% | M | Complete (2026-03-09) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Hook refactor; no dependencies |
| 2 | TASK-02 | TASK-01 | Context wrapper update; requires new optional params to exist |
| 3 | TASK-03 | TASK-01, TASK-02 | Tests cover both hook and context wrapper behaviour |

## Tasks

---

### TASK-01: Refactor useLoansMutations — null-write pattern + optional params

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/hooks/mutations/useLoansMutations.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/useLoansMutations.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — All three function bodies are fully read. The null-write pattern has a precedent in `useActivitiesMutations.removeLastActivity`. Changes are mechanical: replace `get()` + `remove()` sequences with `update(ref(database), pathMap)`.
  - Approach: 85% — Optional param pattern is backward-compatible. Fallback `get()` path preserves callers that don't supply params. Firebase null-write is atomic and supported. Gap: not yet confirmed whether TypeScript allows `Record<string, unknown | null>` as the update payload type — likely yes (standard Firebase SDK type).
  - Impact: 85% — Hook-level round-trips drop from ~4 to ~1 per item call. Confirmed: all three target functions are refactorable. Held-back test for 85%: "What single unknown would drop Impact below 80?" — Firebase SDK rejecting `null` values in multi-path update. Verified: Firebase Realtime Database SDK uses `null` to delete nodes in multi-path updates; this is documented behaviour.
- **Acceptance:**
  - `removeLoanItem`: no `get()` call when `deposit` param is supplied; no `remove()` call; single `update()` called with a path map containing the txn path set to `null`; when occupant has no remaining txns, occupant path also set to `null` in the same call.
  - `removeLoanItem` fallback: when `deposit` param is NOT supplied, the function falls back to the existing `get()` first (backward-compatible path).
  - `removeOccupantIfEmpty`: no `get()` call when `isEmpty` param is supplied; when `isEmpty === true`, single `update()` with occupant path set to `null`; when `isEmpty === false`, returns `null` immediately without any Firebase call.
  - `removeOccupantIfEmpty` fallback: when `isEmpty` param is NOT supplied, falls back to existing `get()` + conditional `remove()` logic.
  - `removeLoanTransactionsForItem`: when both `matchingTxnIds` AND `isOccupantEmpty` params are supplied, no `get()` call; single `update()` with all matched txn paths set to `null`, plus occupant path set to `null` when `isOccupantEmpty === true`.
  - `removeLoanTransactionsForItem` fallback: when `matchingTxnIds` is NOT supplied, falls back to existing `get()` + `Promise.all(remove())` sequence.
  - `remove` import can be removed from the file if all `remove()` calls are eliminated (check: fallback paths still use `remove()` — keep the import).
  - TypeScript: no new type errors; optional params are typed correctly.
  - No behavior change to `saveLoan`, `updateLoanDepositType`, or `convertKeycardDocToCash`.
- **Validation contract:**
  - TC-01: `removeLoanItem` called with `deposit` supplied → `getMock` not called; `updateMock` called once with `{ 'loans/BR/occ/txns/txn1': null }` (+ optional occupant null-write).
  - TC-02: `removeLoanItem` called without `deposit` → `getMock` called once (fallback); `removeMock` called for txn; `removeOccupantIfEmpty` invoked as before.
  - TC-03: `removeOccupantIfEmpty` called with `isEmpty: true` → `getMock` not called; `updateMock` called with `{ 'loans/BR/occ': null }`.
  - TC-04: `removeOccupantIfEmpty` called with `isEmpty: false` → no Firebase calls at all; returns `null`.
  - TC-05: `removeOccupantIfEmpty` called without `isEmpty` → existing `get()` fallback path runs.
  - TC-06: `removeLoanTransactionsForItem` called with `matchingTxnIds: ['t-1', 't-2']` and `isOccupantEmpty: true` → `getMock` not called; `updateMock` called once with both txn paths and occupant path all set to `null`.
  - TC-06b: `removeLoanTransactionsForItem` called with `matchingTxnIds: ['t-1']` and `isOccupantEmpty: false` (remaining non-matched txns exist) → `updateMock` called with txn path null-write only; occupant path NOT included.
  - TC-07: `removeLoanTransactionsForItem` called without `matchingTxnIds` → `getMock` called (fallback get).
  - TC-08: Online gate: all three functions return error immediately and skip Firebase when `!online`.
- **Execution plan:**
  - Red: write failing tests first (in TASK-03) — actually tests come after; for TASK-01 the execution is: update function signatures (add optional params) → update function bodies (conditional get-skip + null-write path) → verify TypeScript compiles.
  - Green: implement the three function changes one at a time. Start with `removeOccupantIfEmpty` (simplest — used by both other functions). Then `removeLoanItem`. Then `removeLoanTransactionsForItem`.
  - Refactor: remove any dead code if all non-fallback callers are confirmed to pass params (after TASK-02 lands). Keep fallback paths — they're safety nets.
- **Planning validation (M effort):**
  - Checks run: Read `useLoansMutations.ts` (full), `useActivitiesMutations.ts` (null-write pattern reference), `loansSchema.ts` (type shapes).
  - Validation artifacts: `useLoansMutations.ts` lines 71-156, 163-234; `useActivitiesMutations.ts` lines 289-295 (null-write pattern: `updates[path] = null; await update(ref(database), updates)`).
  - Unexpected findings: None. The fallback paths are required because `removeOccupantIfEmpty` is exported and theoretically callable directly — keeping fallbacks is correct even if not currently needed.
- **Consumer tracing (Phase 5.5):**
  - New optional params `deposit?: number`, `isEmpty?: boolean`, `matchingTxnIds?: string[]`, `isOccupantEmpty?: boolean` — consumed only by `LoanDataContext` wrappers (TASK-02). No other callers exist (confirmed: 11 file references, all via context or tests). Consumers updated in TASK-02. Summary of which function gets which params: `removeLoanItem(deposit?, isEmpty?)`; `removeOccupantIfEmpty(isEmpty?)`; `removeLoanTransactionsForItem(matchingTxnIds?, isOccupantEmpty?)`.
  - `removeLoanItem` body change: `logActivity` and `addToAllTransactions` calls inside `removeLoanItem` are unchanged — they still depend on the existing `itemName === "Keycard"` branch and `originalDeposit`. The `originalDeposit` variable will now be sourced from the `deposit` param when supplied, rather than from the `get()` result. Consumer path: `addToAllTransactions` in the Keycard branch uses `originalDeposit` — the param-supplied value replaces the Firebase-read value. This is safe: `LoanDataContext` reads deposit from the same realtime subscription that populates the UI.
- **Scouts:** Optional param type `deposit?: number` — Firebase `update()` payload type is `Record<string, unknown>` in the SDK; setting a path to `null` is supported. Verified from `useActivitiesMutations.ts` usage.
- **Edge Cases & Hardening:**
  - Occupant has exactly 1 txn being removed: `isEmpty` should be `true` → occupant path null-written in same call. Context wrapper must compute this correctly (TASK-02's responsibility).
  - `matchingTxnIds` is empty array (`[]`): no txns match → no `update()` call; function returns `null` immediately.
  - `deposit` param supplied as `0`: valid (non-keycard items have zero deposit). The `if (originalDeposit > 0)` guard in the Keycard branch handles this correctly — no refund entry created.
  - Concurrent removal of same txn: Firebase multi-path update is atomic; last-write-wins if two ops race. Acceptable — same as current behavior.
- **What would make this >=90%:**
  - Confirm TypeScript accepts `Record<string, LoanTransaction | null>` or `Record<string, unknown>` as the `update()` payload (minor typing question; expected to work based on SDK types).
  - Run typecheck via CI — `pnpm --filter @apps/reception typecheck` in CI pipeline. Blocked from running locally per repo policy.
- **Rollout / rollback:**
  - Rollout: No feature flag. Pure internal refactor. Deploy with normal PR process.
  - Rollback: Revert PR. No data migration or state changes.
- **Documentation impact:** None: internal hook implementation; no public API surface changes.
- **Notes / references:**
  - Reference pattern: `useActivitiesMutations.ts` lines 289-295 — `updates[path] = null; await update(ref(database), updates)`.
  - Firebase null-write: setting a node to `null` in a multi-path update atomically deletes it. Documented Firebase behavior.

---

### TASK-02: Update LoanDataContext wrappers to pass context data

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/context/LoanDataContext.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/context/LoanDataContext.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — The context wrapper already iterates `loansState` for optimistic updates. Extracting `deposit`, computing `isEmpty`, and collecting `matchingTxnIds` are all one-liners using existing data.
  - Approach: 85% — Wrapper functions already have txn ID and booking/occupant IDs. Gap: `removeLoanItemAndUpdate` receives `txnId` but currently does not look up the txn from `loansState` before calling the hook — need to add that lookup. If the txn no longer exists in `loansState` at call time (edge case: concurrent removal), deposit would be `undefined` — the fallback `get()` in the hook handles this correctly.
  - Impact: 85% — This task activates the full benefit of TASK-01: once context passes the params, zero pre-reads occur in the hot path. Held-back test: "What would drop Impact below 80?" — If `loansState` lookup returns `undefined` for a txn (stale state edge case), the hook falls back to `get()`. This is silent — no error, just the pre-refactor behavior. Acceptable; does not break anything.
- **Acceptance:**
  - `removeLoanItemAndUpdate`: reads `deposit` from `loansState[bookingRef][occupantId].txns[txnId]?.deposit` and passes it to `removeLoanItem(bookingRef, occupantId, txnId, itemName, deposit)`. Computes `isEmpty` = `Object.keys(newTxns).length === 0` (same computation already in the optimistic state update) and passes it as part of the hook call (or combines into the occupant cleanup logic within the hook via the `isEmpty` param).
  - `removeLoanTransactionsForItemAndUpdate`: collects `matchingTxnIds` = the set of txn IDs where `txn.item === itemName && txn.type === "Loan"` from `loansState[bookingRef][occupantId].txns` (same filter already applied at lines 190-196 for the optimistic update). Computes `isOccupantEmpty = (Object.keys(txnsAfterRemoval).length === 0)` (same emptiness check already in the optimistic state update). Passes both to `removeLoanTransactionsForItem(bookingRef, occupantId, itemName, matchingTxnIds, isOccupantEmpty)`.
  - `removeOccupantIfEmptyAndUpdate`: reads `loansState[bookingRef][occupantId].txns` to check whether the occupant has any remaining txns; passes `isEmpty = Object.keys(occupant.txns || {}).length === 0` to `removeOccupantIfEmpty(bookingRef, occupantId, isEmpty)`. This resolves the previously unoptimised wrapper path.
  - No changes to `LoanDataContextValue` interface (the exported context type) — optional params are internal to the context wrapper's call to the hook.
- **Validation contract:**
  - TC-01: After TASK-01+02, `handleRemoveLoanItem` in `Checkout.tsx` triggers `removeLoanItem` with `deposit` supplied → no `get()` call.
  - TC-02: `handleReturnLoanTransaction` in `LoansContainer.tsx` triggers `removeLoanTransactionsForItem` with `matchingTxnIds` and `isOccupantEmpty` supplied → no `get()` call in hook.
  - TC-03: When `loansState` does not have the txn (stale/concurrent removal edge case) → `deposit` is `undefined` → hook falls back to `get()` → no error thrown; behavior identical to pre-refactor.
- **Execution plan:**
  - Green: Update `removeLoanItemAndUpdate` to extract `deposit` from `loansState` before calling hook. Update `removeLoanTransactionsForItemAndUpdate` to collect matching txn IDs and compute `isOccupantEmpty` from `loansState`. Update `removeOccupantIfEmptyAndUpdate` to read occupant txn count from `loansState` and pass `isEmpty`.
  - Refactor: verify no TypeScript errors on the lookup chains (`loansState[bookingRef]?.[occupantId]?.txns?.[txnId]?.deposit`, `Object.keys(occupant?.txns || {}).length === 0`).
- **Planning validation (S effort):** Not required at S effort per template rules.
- **Consumer tracing:** `LoanDataContextValue` interface is unchanged — all exported function signatures remain the same. UI components (`Checkout.tsx`, `LoansContainer.tsx`) are unaffected. All three wrappers consuming removal functions now pass optional params: `removeLoanItemAndUpdate` passes `deposit` + implicitly handles `isEmpty` via the `removeLoanItem` hook (which includes occupant cleanup); `removeLoanTransactionsForItemAndUpdate` passes `matchingTxnIds` + `isOccupantEmpty`; `removeOccupantIfEmptyAndUpdate` passes `isEmpty`.
- **Scouts:** None — mechanical wrapper change with clear data paths.
- **Edge Cases & Hardening:**
  - `loansState[bookingRef]` is `undefined` (booking not yet loaded): `deposit` → `undefined` → hook fallback runs. Safe.
  - `loansState[bookingRef][occupantId].txns[txnId]` is `undefined` (txn already removed): deposit `undefined` → hook fallback. Safe.
  - `matchingTxnIds` computed as empty `[]`: no matching txns in context state → hook receives `[]` → returns `null` immediately (per TASK-01 edge case handling). Safe.
- **What would make this >=90%:** Confirm TypeScript optional chaining `?.deposit` on `loansState` lookup doesn't require explicit null guard. Expected: standard TypeScript — no issue.
- **Rollout / rollback:** Same as TASK-01 — no feature flag; revert PR to rollback.
- **Documentation impact:** None.
- **Notes / references:** `LoanDataContext.tsx` lines 137-176 (`removeLoanItemAndUpdate`), 179-219 (`removeLoanTransactionsForItemAndUpdate`).

---

### TASK-03: Extend and rewrite useLoansMutations tests

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/reception/src/hooks/mutations/__tests__/useLoansMutations.test.ts` and `apps/reception/src/context/__tests__/LoanDataContext.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/hooks/mutations/__tests__/useLoansMutations.test.ts`, `apps/reception/src/context/__tests__/LoanDataContext.test.tsx`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Test file is fully read. Mock infrastructure (`getMock`, `updateMock`, `removeMock`) is already in place. Adding new `describe` blocks with new scenarios is straightforward.
  - Approach: 85% — Asserting `updateMock` called with a specific path map is direct. The existing parallel-removal test must be rewritten to assert `updateMock` shape instead of `removeMock` count. Gap: the exact path map shape in the multi-path `update()` call depends on the implementation in TASK-01 — tests must be written to match that implementation, so TASK-03 must come after TASK-01.
  - Impact: 85% — Tests provide regression coverage for the refactored paths. The current gap (no happy-path test for `removeLoanItem`) is closed. After this task, all 5 hook functions have at least one positive test.
- **Acceptance:**
  - Existing `removeLoanTransactionsForItem` parallel-removal ordering test (`it("waits for all matching removals before cleanup check")`) is rewritten: asserts `updateMock` called once with the correct multi-path null-write payload; asserts `removeMock` is NOT called.
  - Existing `removeLoanTransactionsForItem` failure propagation test updated to match new semantics.
  - New test: `removeLoanItem` — happy path, non-Keycard item, deposit provided → `getMock` not called; `updateMock` called with txn null-write; `logActivity` not called.
  - New test: `removeLoanItem` — Keycard item, deposit > 0 provided → `logActivity` mock called; `addToAllTransactions` mock called with refund payload; `updateMock` called.
  - New test: `removeLoanItem` — fallback path (no deposit param) → `getMock` called once; `removeMock` called.
  - New test: `removeOccupantIfEmpty` — `isEmpty: true` supplied → `getMock` not called; `updateMock` called with occupant path null-write.
  - New test: `removeOccupantIfEmpty` — `isEmpty: false` supplied → no Firebase calls; returns `null`.
  - New test: `removeOccupantIfEmpty` — no param supplied, occupant has txns → `getMock` called; `removeMock` NOT called; returns `null`.
  - New test: `removeOccupantIfEmpty` — no param supplied, occupant empty → `getMock` called; `removeMock` called.
  - `LoanDataContext.test.tsx` — add tests verifying the wrapper passes context data to the hook: (a) `removeLoanItem` wrapper passes `deposit` from `loansState`; (b) `removeLoanTransactionsForItem` wrapper passes `matchingTxnIds` and `isOccupantEmpty`; (c) `removeOccupantIfEmpty` wrapper passes `isEmpty`. These tests mock `useLoansMutations` (already mocked in the context test file) and assert the mock was called with the correct params.
  - All online-gate tests (existing) remain passing — no changes to online/offline logic.
  - CI passes after push.
- **Validation contract:**
  - TC-01: Rewritten parallel-removal test passes — `updateMock` called with multi-path null-write; `removeMock` call count = 0.
  - TC-02: All new `removeLoanItem` tests pass.
  - TC-03: All new `removeOccupantIfEmpty` tests pass.
  - TC-04: All existing tests remain passing (online-gate tests, `saveLoan` tests).
  - TC-05: CI pipeline reports 0 test failures for `useLoansMutations.test.ts` and `LoanDataContext.test.tsx`.
- **Execution plan:**
  - Green: Rewrite the parallel-removal ordering test first (it will fail if left as-is after TASK-01). Then add new describe blocks for each untested function.
  - Refactor: Remove the `removeResolvers` deferred-promise approach from the parallel-removal test (no longer applicable with single `update()` call).
- **Planning validation (M effort):**
  - Checks run: Read test files fully (`useLoansMutations.test.ts`, `LoanDataContext.test.tsx`); verified mock setup in both.
  - Validation artifacts: `useLoansMutations.test.ts` lines 67-75 (beforeEach mocks), 130-208 (test to rewrite), 242-279 (online-gate tests — keep as-is). `LoanDataContext.test.tsx` lines 14-31 (mock setup for `useLoansMutations` functions) — the mock already captures calls to `removeLoanItemMock`, `removeLoanTransactionsForItemMock`, `removeOccupantIfEmptyMock`; new tests assert those mocks are called with the expected optional params.
  - Unexpected findings: `LoanDataContext.test.tsx` uses both `jest.fn()` and `vi.spyOn` in the same file (lines 33-35 use `vi.spyOn` on `toastUtils`). This is a mixed `jest`/`vitest` pattern — tests use `jest.mock()` for module mocking but `vi.spyOn` for method spying. This is pre-existing and not changed by this task.
- **Consumer tracing:** Tests are consumers of the hook API — after TASK-01+02 the hook's optional params are in place, so tests can pass `deposit`, `isEmpty`, `matchingTxnIds`, `isOccupantEmpty` directly to exercise the fast path. Context tests verify the wrappers call the hook mocks with the correct params.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Test for `matchingTxnIds: []` (empty array supplied) → hook should return `null` immediately with no Firebase calls.
  - Test for `deposit: 0` on a non-Keycard item → no refund entry; Keycard branch skipped.
- **What would make this >=90%:** Add snapshot/integration tests that verify the full end-to-end path from `Checkout.tsx` handleRemoveLoanItem down to Firebase calls. Currently scoped as unit tests only — not required for this plan's acceptance criteria.
- **Rollout / rollback:** N/A — test-only change.
- **Documentation impact:** None.
- **Notes / references:** Test must import and mock the same way as existing tests. `useActivitiesMutations` and `useAllTransactionsMutations` are already mocked via `jest.mock()` at the top of the file.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `loansState` is stale at removal time (deposit/count wrong) | Low | Medium | Fallback `get()` path in hook activates when `deposit` param is `undefined`. Acceptable risk — same subscription drives UI display. |
| TypeScript reject for `null` in update payload | Very Low | Low | Firebase SDK `update()` accepts `Record<string, unknown>` — `null` is a valid `unknown`. Confirmed from `useActivitiesMutations` reference. |
| Existing broken test causes CI failure before TASK-03 | Certain (after TASK-01) | Low | TASK-03 must land in same PR as TASK-01+02, or TASK-01 must not break the existing test (fallback path keeps `removeMock` usable). Design: TASK-01 fallback paths preserve `remove()` calls when params not supplied — existing test scenarios that don't supply params still pass. |
| `removeOccupantIfEmptyAndUpdate` passes stale `isEmpty` from `loansState` | Very Low | Low | `loansState` is driven by a realtime subscription; staleness window is ms-level. If `loansState` is stale (e.g., concurrent removal), `isEmpty` may be incorrect — hook falls back to `get()` when `isEmpty` is `undefined` (if `loansState` lookup fails). Acceptable risk. |

## Observability

- Logging: No new logging needed. Existing `console.error` paths in the hook are unchanged.
- Metrics: Firebase console — monitor `/loans` path request volume post-deploy.
- Alerts/Dashboards: None required for this change.

## Acceptance Criteria (overall)

- [ ] `useLoansMutations.ts` — `removeLoanItem`, `removeOccupantIfEmpty`, `removeLoanTransactionsForItem` accept optional params and use null-write multi-path `update()` when params are supplied.
- [ ] `LoanDataContext.tsx` — `removeLoanItemAndUpdate`, `removeLoanTransactionsForItemAndUpdate`, and `removeOccupantIfEmptyAndUpdate` all extract context data from `loansState` and pass the appropriate optional params to the hook.
- [ ] `useLoansMutations.test.ts` — all existing tests pass; broken parallel-removal test rewritten; new happy-path tests for all 5 functions.
- [ ] TypeScript: no new errors (`pnpm --filter @apps/reception typecheck` passes in CI).
- [ ] Lint: no new lint errors (`pnpm --filter @apps/reception lint` passes in CI).
- [ ] CI pipeline passes.

## Decision Log

- 2026-03-09: Chosen approach is Option B (null-write multi-path update + optional params with fallback). Reasoning: Firebase null-write pattern is already in the codebase, is atomic, and eliminates both pre-reads and remove() calls. Fallback paths preserve backward compatibility without adding complexity. No operator decision required. [Agent-decided]
- 2026-03-09: `removeOccupantIfEmptyAndUpdate` in `LoanDataContext` is updated in TASK-02 to pass `isEmpty` from `loansState`. This aligns with Goal 2 (eliminate redundant `get()` calls) and is consistent with the other wrapper changes. [Agent-decided per critique R1 finding]

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × M(2) = 170
- Total: (170 + 85 + 170) / (2 + 1 + 2) = 425 / 5 = **85%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Refactor useLoansMutations | Yes — `useLoansMutations.ts` read in full; null-write pattern confirmed in `useActivitiesMutations`; optional param design is backward-compatible | Minor: fallback `get()` path in `removeLoanItem` when `deposit` is undefined sources `originalDeposit` from Firebase read — need to ensure the Keycard branch downstream still receives the correct deposit value (sourced from Firebase, not from param). This is the fallback path only and is correct — existing behavior preserved. | No |
| TASK-02: Update LoanDataContext wrappers | Yes — TASK-01 must complete first (new optional params must exist). `LoanDataContext.tsx` read in full; `loansState` data structure confirmed. All three wrappers now pass context params (`removeLoanItemAndUpdate`, `removeLoanTransactionsForItemAndUpdate`, `removeOccupantIfEmptyAndUpdate`). | None | No |
| TASK-03: Extend and rewrite tests | Yes — depends on TASK-01 + TASK-02 both complete. Test mock infrastructure in place for both `useLoansMutations.test.ts` and `LoanDataContext.test.tsx`. Key constraint: existing parallel-removal test will fail after TASK-01 since it asserts `removeMock` calls. Must land TASK-03 in same branch/PR as TASK-01+02, or ensure fallback paths preserve the existing test semantics (they do — fallback path still calls `remove()`). | Moderate: if TASK-01 and TASK-03 are committed separately in CI, the interim state may have a failing test. Mitigation: commit all three tasks in a single PR. | No (mitigated by single-PR strategy) |
