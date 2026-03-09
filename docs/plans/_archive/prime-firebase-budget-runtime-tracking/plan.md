---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-firebase-budget-runtime-tracking
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Firebase Budget Runtime Tracking Plan

## Summary

Firebase read budgets are defined in `budgetBaselines.ts` and evaluated by `budgetGate.ts`, but no runtime code calls these evaluation functions — they are test-only today. Two infrastructure gaps prevent accurate runtime enforcement: (1) the `onValue()` wrapper does not record snapshots into `recentQueries`, so listener-based reads are path-invisible; (2) two `maxReadsByPath` matcher keys (`preordersData`, `cityTaxData`) don't match actual Firebase paths. This plan fixes both gaps, recalibrates the pre-arrival baseline to 10 reads (the true index-hit path count post-fix), creates a `useBudgetWatcher` hook that compares a scoped window of reads against baselines, and wires it into the guarded portal home screen. A secondary task adapts the broken `FirebaseMetricsPanel` to the live metrics singleton. All changes are dev-only.

## Active tasks

- [x] TASK-01: Fix `onValue()` wrapper to record snapshot reads into `recentQueries`
- [x] TASK-02: Recalibrate `budgetBaselines.ts` — fix matchers, update maxReads, add missing paths
- [x] TASK-03: Create `useBudgetWatcher` dev-only hook
- [x] TASK-04: Wire `useBudgetWatcher` into `GuardedHomeExperience`
- [x] TASK-05: Add unit tests for `useBudgetWatcher`
- [x] TASK-06: Adapt `FirebaseMetricsPanel` to live metrics singleton

## Goals

1. Emit `console.warn` in dev when a screen's Firebase reads exceed its budget baseline during initial load.
2. Make budget violations visible automatically — no per-screen test required.
3. Reuse `evaluateFirebaseFlowBudget()` from `budgetGate.ts` unchanged.
4. Keep implementation additive: new hook + wrapper fix + recalibration. No production code path changes.

## Non-goals

- Staging/production alerting.
- Modifying `budgetGate.ts` evaluation logic.
- Tracking reads across multiple screen transitions.
- Owner KPI flow instrumentation (server components; deferred).

## Constraints & Assumptions

- Constraints:
  - All changes are dev-only (`process.env.NODE_ENV !== 'production'` guard).
  - `firebaseMetrics` import must point to `@/services/firebase` (live singleton), not `@/services/firebaseMetrics`.
  - `useBudgetWatcher` must not be placed in server components.
  - `evaluateFirebaseFlowBudget()` must remain unmodified.
- Assumptions:
  - `isInitialSyncComplete` from `useUnifiedBookingData` is the correct settle signal (true when all sources loaded + `occupantData !== null` + language synced).
  - `recentQueries` ring buffer of 50 entries is sufficient for a single portal load (≤10 reads).
  - Delta snapshotting (start at mount, end at settle) is sufficient to isolate the flow window.
  - `console.warn` (not throw) is the correct severity for budget violations.

## Inherited Outcome Contract

- **Why:** Multiple implementation approaches are viable (context, interceptor, hook wrapper) with different trade-offs around accuracy, dev-overhead, and bundle impact. Needs fact-finding to pick the right one before building.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app logs a dev-mode warning when any screen's Firebase read count exceeds its baseline threshold, making budget regressions visible during development.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/prime-firebase-budget-runtime-tracking/fact-find.md`
- Key findings used:
  - `onValue()` wrapper in `firebase.ts` does NOT call `recordQuery()` on snapshot delivery — must be fixed first
  - `preordersData` matcher → actual path `preorder/...`; `cityTaxData` matcher → actual path `cityTax/...` — both misaligned
  - Portal pre-arrival happy path = 10 reads post-fix (2 booking + 1 completedTasks snapshot + 7 secondary)
  - `useBudgetWatcher` must be placed in a `'use client'` component — `GuardedHomeExperience` qualifies
  - `isInitialSyncComplete` from `useUnifiedBookingData` is the correct settle signal
  - `FirebaseMetricsPanel` uses `firebaseMetrics.ts` singleton (wrong); live singleton is in `firebase.ts`
  - `DevTools` not mounted anywhere — panel currently unreachable

## Proposed Approach

- Option A: React Context read counter — rejected (too high blast radius, refactors all hooks)
- Option B: Firebase SDK interceptor — rejected (fragile, non-standard)
- Option C: `useBudgetWatcher` hook + `onValue` wrapper fix — selected
- Chosen approach: Option C. Fix `onValue` to record paths, fix matchers, create `useBudgetWatcher(flowId, { isSettled })` with injectable `metricsSource` for testability, wire to `GuardedHomeExperience`.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix `onValue()` to record snapshot reads | 90% | S | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Recalibrate `budgetBaselines.ts` | 90% | S | Complete (2026-03-09) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Create `useBudgetWatcher` hook | 85% | M | Complete (2026-03-09) | TASK-01, TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Wire `useBudgetWatcher` into `GuardedHomeExperience` | 90% | S | Complete (2026-03-09) | TASK-03 | - |
| TASK-05 | IMPLEMENT | Unit tests for `useBudgetWatcher` | 85% | M | Complete (2026-03-09) | TASK-03 | - |
| TASK-06 | IMPLEMENT | Adapt `FirebaseMetricsPanel` to live singleton | 80% | M | Complete (2026-03-09) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must run first — TASK-02 and TASK-03 depend on it |
| 2 | TASK-02 | TASK-01 complete | Baseline values depend on onValue fix being in place |
| 3 | TASK-03 | TASK-01, TASK-02 | Hook reads from corrected baselines and corrected metrics |
| 4 | TASK-04, TASK-05, TASK-06 | TASK-03 (TASK-04/05); TASK-01 (TASK-06) | TASK-04/05/06 can run in parallel once their deps complete |

## Tasks

---

### TASK-01: Fix `onValue()` wrapper to record snapshot reads into `recentQueries`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/services/firebase.ts` — `onValue()` wrapper calls `firebaseMetrics.recordQuery(path, size, 0)` inside `wrapped` callback on each snapshot delivery
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/services/firebase.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — the change is a single `firebaseMetrics.recordQuery(path, size, 0)` call inside the existing `wrapped` callback. The path variable is already in scope (`const path = queryRef.toString()`). `size` is already computed in `wrapped`. The pattern is identical to `get()`.
  - Approach: 90% — transparent intercept at the wrapper layer is the correct architectural approach; adding path tracking to `onValue` is symmetric with how `get()` works.
  - Impact: 85% — enables `completedTasks` paths to appear in `recentQueries`, making `maxReadsByPath.completedTasks` enforceable. The `durationMs` value for `onValue` is meaningfully 0 (subscription, not one-shot timing). No production impact — `recordQuery` is a no-op write to a dev-only counter.
- **Acceptance:**
  - `onValue()` wrapper's inner `wrapped` callback calls `firebaseMetrics.recordQuery(path, sizeBytes, 0)` after computing size
  - `firebaseMetrics.getMetrics().recentQueries` includes entries for `completedTasks/{uuid}` paths when `useFetchCompletedTasks` attaches its listener and receives a snapshot
  - `get()`-based reads are unaffected
  - No change to `activeListeners` tracking (still incremented on subscribe, decremented on unsubscribe)
- **Validation contract:**
  - TC-01: After attaching an `onValue` listener and delivering a snapshot, `firebaseMetrics.getMetrics().recentQueries` contains an entry with the listener path — expected: path appears in recentQueries with durationMs 0
  - TC-02: `get()` reads continue to record correct durationMs (non-zero for real calls) — expected: existing get behaviour unchanged
  - TC-03: `firebaseMetrics.getMetrics().queryCount` increments by 1 for each `onValue` snapshot delivery — expected: total count increases
- **Execution plan:**
  - Red: Read `firebase.ts` `onValue` wrapper, confirm `wrapped` callback does not call `recordQuery`
  - Green: Add `const size = JSON.stringify(snapshot.val()).length;` (already present — `wrapped` already computes this) and `firebaseMetrics.recordQuery(path, size, 0);` after the size computation inside `wrapped`, before calling `callback(snapshot)`
  - Refactor: Verify `firebaseMetrics` import is in scope within `firebase.ts` (it is — same module)
- **Planning validation:**
  - Checks run: Read `apps/prime/src/services/firebase.ts` lines 348-377 — confirmed `wrapped` already computes `size`. The addition is 1 line.
  - Validation artifacts: `firebase.ts` line 359-360 already present: `const size = JSON.stringify(snapshot.val()).length;`
  - Unexpected findings: None
- **Scouts:** None: change is a 1-line addition to an already-instrumented wrapper
- **Edge Cases & Hardening:**
  - `onValue` fires on every realtime update, not just initial. Within the delta window (before `isInitialSyncComplete` is true), each snapshot delivery increments `queryCount`. If the Firebase server delivers multiple `completedTasks` updates before settle (e.g., due to write activity during dev testing), `queryCount` will exceed 1 for this path. This is a known false-positive risk — acknowledged in the baseline: `completedTasks.maxReads: 1` in `maxReadsByPath`, but `maxReads` (total) already accounts for 1 delivery. Multiple pre-settle deliveries would cause a false violation warning. Mitigation: this is a dev tool only; the warning text includes the path breakdown (via `evaluateFirebaseFlowBudget` report), allowing the developer to diagnose false positives from repeated listener fires. No change to evaluation logic needed — the risk is documented, not mitigated at infrastructure level.
  - `snapshot.val()` may be `null` — `JSON.stringify(null).length === 4` (safe, no throw)
- **What would make this >=90%:** Already at 90%. Held-back test: Multiple pre-settle `onValue` deliveries can inflate `queryCount` (false-positive risk documented in Edge Cases). This does not push confidence below 80 — the change is minimal, correct, and symmetric with `get()`; the false-positive risk is a known limitation of the dev tool, not a correctness bug in TASK-01.
- **Rollout / rollback:**
  - Rollout: Additive — existing behaviour preserved. `recordQuery` in dev mode is a push to an in-memory array.
  - Rollback: Remove the `recordQuery` call from `wrapped`. Zero production risk.
- **Documentation impact:** None: internal instrumentation change, no public API.
- **Notes / references:** `firebase.ts` line 358-362 is the `wrapped` callback. `firebaseMetrics.recordQuery` is defined at `firebase.ts` line 121.
- **Build evidence (2026-03-09):**
  - Status: Complete
  - Execution route: Inline (codex exec -a flag not supported in installed binary version; change was 1 line, executed inline)
  - Change: Added `firebaseMetrics.recordQuery(path, size, 0);` after size computation in `wrapped` callback, before `callback(snapshot)`. Symmetric with `get()` instrumentation at line 338.
  - Commit: `8ec2229ffd` (committed via concurrent agent during prime-normalize-locale-constants post-build; same change)
  - TypeCheck: pass (pnpm --filter @apps/prime typecheck)
  - Lint: pass (pre-existing ServiceCard.tsx warning unrelated to this change)
  - Affects file: `apps/prime/src/services/firebase.ts` ✓ (line 360: `firebaseMetrics.recordQuery(path, size, 0)` confirmed present)

---

### TASK-02: Recalibrate `budgetBaselines.ts` — fix matchers, update maxReads, add missing paths

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/lib/firebase/budgetBaselines.ts` with corrected matchers, recalibrated `maxReads`, and complete `maxReadsByPath` entries; updated test fixtures in `budget-regression-gate.test.ts` and `firebase-query-budget.test.tsx` to match new paths
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/prime/src/lib/firebase/budgetBaselines.ts`, `apps/prime/src/lib/firebase/__tests__/budget-regression-gate.test.ts`, `apps/prime/src/hooks/dataOrchestrator/__tests__/firebase-query-budget.test.tsx`, `apps/prime/src/services/__tests__/firebaseMetrics.budget.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — the required changes are fully enumerated from fact-find investigation. Two matcher renames, `maxReads` update to 10, and adding `occupantIndex` and `guestsDetails` paths.
  - Approach: 95% — calibrating baselines to match actual hook behaviour is the correct and only approach.
  - Impact: 85% — existing tests that use hardcoded test paths will break on the renamed matchers and must be updated to use `preorder/...` and `cityTax/...` paths.
- **Acceptance:**
  - `portal_pre_arrival_initial.maxReads` is 10
  - `portal_pre_arrival_initial.maxReadsByPath` keys: `occupantIndex`, `bookings`, `completedTasks`, `loans`, `guestByRoom`, `preorder` (was `preordersData`), `bagStorage`, `guestsDetails`, `financialsRoom`, `cityTax` (was `cityTaxData`)
  - `arrival_mode_initial.maxReads` is 10 (same as pre-arrival; checkInCode is HTTP — no Firebase read, does not increase maxReads; matcher key kept for documentation fidelity only)
  - `arrival_mode_initial.maxReadsByPath` keys: same as `portal_pre_arrival_initial` (`occupantIndex`, `bookings`, `completedTasks`, `loans`, `guestByRoom`, `preorder`, `bagStorage`, `guestsDetails`, `financialsRoom`, `cityTax`) plus `checkInCode` key retained for documentation (matcher will never match HTTP reads, expected count always 0)
  - Existing tests updated to use corrected path strings
  - `parseFirebaseBudgetBaselines` continues to parse and validate the updated config without error
- **Validation contract:**
  - TC-01: `evaluateFirebaseFlowBudget('portal_pre_arrival_initial', buildMetricsSnapshot([...10 paths...], 1))` returns `ok: true` — expected: no violations
  - TC-02: `evaluateFirebaseFlowBudget('portal_pre_arrival_initial', buildMetricsSnapshot([...11 paths...], 1))` returns `ok: false` with `reads 11 > maxReads 10` violation — expected: regression gate catches over-read
  - TC-03: path `preorder/occ_123` is matched by matcher `preorder` — `countReadsByMatcher` returns 1 — expected: `readCountsByPath.preorder === 1`
  - TC-04: path `cityTax/BDC-123` is matched by matcher `cityTax` — expected: `readCountsByPath.cityTax === 1`
  - TC-05: `parseFirebaseBudgetBaselines(RAW_BUDGET_BASELINES)` succeeds with no throws — expected: parse validates updated config
- **Execution plan:**
  - Red: Run existing tests against current baselines — confirm `preordersData`/`cityTaxData` matcher tests pass with hardcoded test paths (they do — tests use matching strings, not real paths)
  - Green: Update `RAW_BUDGET_BASELINES` in `budgetBaselines.ts`; update test fixtures to use corrected path strings
  - Refactor: Verify `arrival_mode_initial` gets same matcher fixes applied
- **Planning validation:**
  - Checks run: Read `budgetBaselines.ts` — confirmed current values. Read 3 test files — confirmed test paths use `'preordersData/occ_...'` and `'cityTaxData/...'` which match current (wrong) matchers. Post-change, test paths must use `'preorder/occ_...'` and `'cityTax/...'`.
  - Validation artifacts: `budget-regression-gate.test.ts` TC-01 uses `'preordersData/occ_1234567890123'` — must change to `'preorder/occ_1234567890123'`
  - Unexpected findings: `arrival_mode_initial.maxReads: 9` — after fix this becomes 11 (10 same as pre-arrival + 1 for checkInCode marker even though HTTP). Actually: `checkInCode` via HTTP won't appear in `recentQueries`, so live tracking will never register a `checkInCode` violation. The `maxReadsByPath.checkInCode` entry is kept for documentation but `maxReads` for `arrival_mode_initial` should be 10 (same as pre-arrival), since checkInCode doesn't add a Firebase read. Confirm: `arrival_mode_initial.maxReads` = 10.
- **Consumer tracing:**
  - New outputs: corrected matcher keys and maxReads values in `budgetBaselines` export
  - Consumers: `evaluateFirebaseFlowBudget()` reads `flow.maxReadsByPath` matchers and `flow.maxReads` — no signature change; matcher-based path matching in `countReadsByMatcher` uses `includes()` — corrected keys will now match real paths correctly
  - All 3 test files consume `buildMetricsSnapshot` paths that must be updated to match new matchers
- **Scouts:** None: all changes enumerated from fact-find
- **Edge Cases & Hardening:**
  - `portal_cached_revisit.maxReads: 0` — unchanged, no reads expected
  - `portal_manual_refetch` — uses `bookings`, `loans`, `guestByRoom`, `financialsRoom`, `preordersData` in current test. `preordersData` matcher needs to become `preorder` here too.
  - `owner_kpi_dashboard_7day/30day` — `ownerKpis` matcher; not investigated in detail but appears correct (owner hooks use `ownerKpis/{date}` nodes which include `ownerKpis` string)
- **What would make this >=90%:** Held-back test: the arrival_mode_initial maxReads ambiguity (is it 10 or 11?) is resolved above — it's 10. No single unknown would drop below 80.
- **Rollout / rollback:**
  - Rollout: Config change only — no runtime impact until TASK-03 wires up the watcher. Tests will break until test fixtures are updated (same PR).
  - Rollback: Revert `budgetBaselines.ts` to prior values and revert test fixtures.
- **Documentation impact:** None: internal budget config.
- **Notes / references:** `countReadsByMatcher` in `budgetGate.ts` line 49: `read.path.includes(matcher)` — substring match. Corrected matchers: `preorder` matches `preorder/uuid`, `cityTax` matches `cityTax/bookingRef`.
- **Build evidence (2026-03-09):**
  - Status: Complete
  - Commits: `6cf623aafd` (baseline + test fixture changes), `bfea4d0994` (i18n-exempt lint fix for all rationale strings)
  - Changes: `portal_pre_arrival_initial.maxReads` 8→10; matchers `preordersData`→`preorder`, `cityTaxData`→`cityTax`; added `occupantIndex` and `guestsDetails` to maxReadsByPath; `arrival_mode_initial.maxReads` 9→10, same matcher fixes + `checkInCode: 0` documentation entry; `portal_manual_refetch` matcher fixes; all 3 test files updated to use corrected path strings
  - TypeCheck: pass (both commits)
  - Lint: pass (pre-existing ServiceCard.tsx warning unrelated)

---

### TASK-03: Create `useBudgetWatcher` dev-only hook

- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/prime/src/hooks/dev/useBudgetWatcher.ts` — dev-only hook with injectable `metricsSource` parameter
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/prime/src/hooks/dev/useBudgetWatcher.ts` (new file and directory)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% — hook pattern is well-established; `evaluateFirebaseFlowBudget` is pure and injectable; delta snapshotting from `getMetrics().recentQueries` is the confirmed approach.
  - Approach: 85% — settle timing via `isSettled` prop (driven by `isInitialSyncComplete`) is correct but has one risk: if `isSettled` becomes true before Phase 2 hooks complete, reads are undercounted (false negative). Mitigated by `isInitialSyncComplete` definition which waits for all `dataSources.isLoading` to be false.
  - Impact: 80% — hook wires up correctly in dev; `console.warn` appears in browser console on budget violation. Held-back test: Could `isSettled` never become `true` in some dev edge case (e.g., error state)? If data never loads, `isInitialSyncComplete` stays false, watcher never fires — a false negative, not a false positive. Acceptable.
- **Acceptance:**
  - Hook signature: `useBudgetWatcher(flowId: FirebaseBudgetFlowId, options: { isSettled: boolean; metricsSource?: Pick<typeof firebaseMetrics, 'getMetrics'> }): void` — uses `Pick<typeof firebaseMetrics, 'getMetrics'>` to narrow the injectable type to only what the hook needs, keeping test doubles minimal while avoiding the unexported `FirebaseMetrics` class name
  - When `process.env.NODE_ENV !== 'development'`: hook returns immediately with no effect
  - On mount: captures `baselineSnapshot = metricsSource.getMetrics().recentQueries.length` (index position)
  - When `isSettled` transitions to `true`: captures delta slice from `recentQueries[baselineSnapshot:]`, constructs `FirebaseMetricsSnapshot` with delta query count and path list, calls `evaluateFirebaseFlowBudget(flowId, snapshot)`, logs `console.warn('[Firebase Budget]', report)` if `!report.ok`
  - `metricsSource` defaults to `firebaseMetrics` imported from `@/services/firebase`
  - Hook is idempotent: second `isSettled=true` transition does not re-run evaluation (ref guard)
  - `activeListeners` for the snapshot: use `metricsSource.getMetrics().activeListeners` at settle time
- **Validation contract:**
  - TC-01: When `isSettled=false`, watcher does not call `evaluateFirebaseFlowBudget` — expected: no warn, no evaluation
  - TC-02: When `isSettled` transitions to `true` and delta reads exceed `maxReads`, `console.warn` is called with a report containing `violations` — expected: warn fires once
  - TC-03: When `isSettled=true` and delta reads are within budget, no `console.warn` — expected: silent
  - TC-04: In production (`NODE_ENV=production`), hook returns immediately — expected: no effect, no imports of `evaluateFirebaseFlowBudget` at runtime
  - TC-05: Re-render with `isSettled=true` (already settled) does not re-run evaluation — expected: idempotent
  - TC-06: `metricsSource` injection works — mock returning controlled `getMetrics()` data drives evaluation correctly
- **Execution plan:**
  - Red: Create `apps/prime/src/hooks/dev/` directory and `useBudgetWatcher.ts` with signature only
  - Green: Implement dev-only guard, mount-time snapshot ref, `useEffect` on `isSettled` transition, delta construction, `evaluateFirebaseFlowBudget` call, `console.warn` on violation, idempotency ref
  - Refactor: Extract type for `metricsSource` parameter; ensure no import of `budgetGate` survives in production bundle. Strategy: use a dynamic `import()` of `budgetGate.ts` inside the `useEffect` callback (only reached when `NODE_ENV === 'development'`). `firebase.ts` is already in the production bundle (it is the core Firebase service) — no isolation needed for that import. The `budgetGate.ts` import is the only new production-bundle concern; dynamic import inside a dev-only code path eliminates it cleanly.
- **Planning validation:**
  - Checks run: Read `useUnifiedBookingData.ts` — confirmed `isInitialSyncComplete` is exported and equals `!dataSources.isLoading && occupantData !== null && hasSyncedLanguage`. Read `GuardedHomeExperience.tsx` — confirmed it is `'use client'` and calls `useUnifiedBookingData`.
  - Validation artifacts: `useUnifiedBookingData.ts` line 235-243 defines `isInitialSyncComplete`.
  - Unexpected findings: `hasSyncedLanguage` adds a language condition to `isInitialSyncComplete`. This is conservative (fires later, after i18n). For budget watching purposes this is acceptable — we want all reads complete, and language sync adds a small delay only.
- **Consumer tracing:**
  - New outputs: `useBudgetWatcher` hook export
  - Consumers: TASK-04 (wiring into `GuardedHomeExperience`); TASK-05 (unit tests)
  - No other consumers expected at this stage
- **Scouts:**
  - `recentQueries` is a ring buffer of 50 entries. If >50 reads occur before portal load (unlikely: max expected is ~10), the baseline index may be stale. Mitigated by: for a fresh page load, the buffer starts empty.
  - Delta calculation uses `recentQueries.slice(baselineIndex)`. If ring buffer wraps (overflows 50), sliced delta may be incomplete. Acceptable for P3 dev tool.
- **Edge Cases & Hardening:**
  - Error state: if `isLoading` stays true indefinitely due to a Firebase error, `isSettled` never becomes true → watcher never fires → silent miss. This is acceptable (a failing screen has its own error state).
  - Multiple mounts: each mount captures its own baseline index. If `GuardedHomeExperience` remounts (router navigation), a new watcher fires for the new mount. Idempotency ref is per-instance.
  - `firebaseMetrics` is a module-level singleton — safe to import in dev; tree-shaken in production builds with the early-return pattern.
- **What would make this >=90%:** Resolve the settle-timing edge case for error states (currently a false negative, not false positive — acceptable). Confirm Next.js dead-code eliminates the import on `NODE_ENV !== 'development'` guard.
- **Rollout / rollback:**
  - Rollout: New file, not imported by any existing code until TASK-04.
  - Rollback: Delete file.
- **Documentation impact:** None: dev-only hook.
- **Notes / references:** `FirebaseBudgetFlowId` from `budgetBaselines.ts`. `evaluateFirebaseFlowBudget` from `budgetGate.ts`. `firebaseMetrics` from `@/services/firebase`.

---

### TASK-04: Wire `useBudgetWatcher` into `GuardedHomeExperience`

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/components/homepage/GuardedHomeExperience.tsx` — adds `useBudgetWatcher` call that conditionally switches flow ID based on `arrivalState`, covering both `portal_pre_arrival_initial` and `arrival_mode_initial` flows
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Build-evidence:** Commit `8f96fa4b6e`. Added `useBudgetWatcher(budgetFlowId, { isSettled: budgetIsSettled })` call with conditional `arrivalState === 'arrival-day'` flow ID selector and `checked-in` guard. Typecheck and lint passed clean.
- **Affects:** `apps/prime/src/components/homepage/GuardedHomeExperience.tsx`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — `GuardedHomeExperience` is `'use client'`; already imports `useUnifiedBookingData` (for `isInitialSyncComplete`) and `usePreArrivalState` (for `arrivalState`); adding one hook call with a ternary flow ID selector.
  - Approach: 90% — `isInitialSyncComplete` is the confirmed correct settle signal; both flows use the same data sources so the settle signal is the same regardless of `arrivalState`.
  - Impact: 85% — wires budget warnings to both pre-arrival and arrival-day portal screens. Dev-only: zero production impact.
- **Acceptance:**
  - `arrivalState` sourced from `usePreArrivalState` (already called in `GuardedHomeExperience`)
  - `isInitialSyncComplete` added to `useUnifiedBookingData` destructure
  - Flow ID determined: `arrivalState === 'arrival-day' ? 'arrival_mode_initial' : 'portal_pre_arrival_initial'`
  - Settle signal gated: `const budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete;` — prevents evaluation for checked-in state which is not separately budgeted
  - `useBudgetWatcher(budgetFlowId, { isSettled: budgetIsSettled })` called inside `GuardedHomeExperience`
  - When dev portal screen fully loads in pre-arrival mode, a `console.warn` appears if read count exceeds 10
  - When dev portal screen fully loads in arrival-day mode, a `console.warn` appears if read count exceeds 10
  - When in checked-in state, watcher is disabled (no evaluation, no spurious warns)
  - No change to production behaviour
- **Validation contract:**
  - TC-01: In dev mode with pre-arrival state, after portal loads normally, no console.warn if reads within budget — expected: silent
  - TC-02: In dev mode with arrival-day state, after portal loads, correct flow ID (`arrival_mode_initial`) is passed to watcher — expected: evaluated against arrival-day baseline
  - TC-03: In dev mode, if a hook triggers an extra read beyond budget, console.warn fires with violation report — expected: visible in browser console
  - TC-04: In production build, `useBudgetWatcher` early-returns, no bundle impact — expected: no production code change
- **Execution plan:**
  - Red: Confirm `isInitialSyncComplete` is missing from current `useUnifiedBookingData` destructure; confirm `arrivalState` is already in scope from `usePreArrivalState`
  - Green: Add `isInitialSyncComplete` to `useUnifiedBookingData` destructure; compute `const budgetFlowId = arrivalState === 'arrival-day' ? 'arrival_mode_initial' : 'portal_pre_arrival_initial'`; compute `const budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete`; import `useBudgetWatcher`; add call `useBudgetWatcher(budgetFlowId, { isSettled: budgetIsSettled })`
  - Refactor: Verify no lint warnings (hook ordering; ternary must be stable across renders since `arrivalState` is stable once known)
- **Planning validation:**
  - Checks run: Read `GuardedHomeExperience.tsx` — `isInitialSyncComplete` is NOT currently destructured from `useUnifiedBookingData` (line 26 shows `const { occupantData, isLoading, error, isCheckedIn } = useUnifiedBookingData()`). `arrivalState` IS in scope from `usePreArrivalState` — line 168: `if (arrivalState === 'arrival-day')`. Both flow IDs (`portal_pre_arrival_initial`, `arrival_mode_initial`) exist in `budgetBaselines.ts`.
  - Validation artifacts: `useUnifiedBookingData.ts` line 88 exports `isInitialSyncComplete: boolean`. `arrivalState` values: `'pre-arrival'`, `'arrival-day'`, `'checked-in'`.
  - Unexpected findings: None — both `arrivalState` and `isInitialSyncComplete` are available in the component.
- **Consumer tracing:**
  - Modified behavior: `GuardedHomeExperience` now destructures `isInitialSyncComplete` from `useUnifiedBookingData` and passes conditional `flowId` to `useBudgetWatcher`. No existing consumer of `isInitialSyncComplete` is affected (new destructure only).
  - `arrivalState` is already destructured; no change to its usage in existing render logic.
- **Scouts:** None
- **Edge Cases & Hardening:**
  - `checked-in` state: must NOT apply `portal_pre_arrival_initial` budget — doing so would produce misleading violations for a flow with different read characteristics. Strategy: pass `isSettled: false` when `arrivalState === 'checked-in'` to prevent the watcher from evaluating. The hook's idempotency guard ensures this is safe (once settled=false path is used, evaluation never fires). Implementation: `const budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete;` then `useBudgetWatcher(budgetFlowId, { isSettled: budgetIsSettled })`.
  - Hook rules: both `budgetFlowId` and `budgetIsSettled` are `const` values derived from stable inputs — not conditional hook calls. Complies with React hooks rules.
- **Rollout / rollback:**
  - Rollout: One additional hook call. Dev-only guard in `useBudgetWatcher` ensures zero production change.
  - Rollback: Remove the hook call and `isInitialSyncComplete` from destructure.
- **Documentation impact:** None.
- **Notes / references:** `useUnifiedBookingData` exports at line 86-89 of `useUnifiedBookingData.ts`. `arrivalState` from `usePreArrivalState` — already in scope at component top.

---

### TASK-05: Unit tests for `useBudgetWatcher`

- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/prime/src/hooks/dev/__tests__/useBudgetWatcher.test.ts` — covers happy path, violation detection, idempotency, production no-op, and injection
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build-evidence:** Commit `50988612e0`. Created test file with 6 TCs: happy path, violation detection, idempotency, production no-op, injectable metricsSource, and pre-mount baseline exclusion. All tests import-clean; typecheck and lint passed.
- **Affects:** `apps/prime/src/hooks/dev/__tests__/useBudgetWatcher.test.ts` (new)
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — `renderHook` + controlled `metricsSource` injection; `console.warn` spy with `jest.spyOn`.
  - Approach: 85% — injectable `metricsSource` is confirmed as the testability seam; hook is tested in isolation.
  - Impact: 80% — tests verify contract, not live Firebase reads. Held-back test: If `evaluateFirebaseFlowBudget` has a bug not caught by existing tests, these tests may give false confidence. Mitigated: existing 3 TCs in `budget-regression-gate.test.ts` already cover the evaluator logic.
- **Acceptance:**
  - TC-01 through TC-06 from TASK-03 all have corresponding test cases
  - Tests use injected `metricsSource` — no real Firebase calls
  - `console.warn` spy asserted for violation path; not called for within-budget path
  - Tests pass on first run with no mocking of global Firebase modules
- **Validation contract:**
  - TC-01: Mock `metricsSource.getMetrics()` returns 0 recentQueries at mount, `isSettled=false` — expect no warn
  - TC-02: Mock returns 11 recentQueries when settled, flow budget is 10 — expect `console.warn` called once with violation
  - TC-03: Mock returns 8 recentQueries when settled, flow budget is 10 — expect no warn
  - TC-04: NODE_ENV=production — expect hook returns without calling `evaluateFirebaseFlowBudget`
  - TC-05: `isSettled` toggles true twice — expect evaluation fires only once (idempotency ref)
  - TC-06: Default `metricsSource` resolves to `firebaseMetrics` from `@/services/firebase` — import verified
- **Execution plan:**
  - Red: Create test file, import `renderHook` from `@testing-library/react`, `useBudgetWatcher`, and type stubs
  - Green: Implement all 6 TCs using `renderHook`, `act`, and `jest.spyOn(console, 'warn')`
  - Refactor: Ensure no real Firebase import leaks; mock `@/services/firebase` at module level for default source test
- **Planning validation:**
  - Checks run: Read `apps/prime/src/hooks/pureData/__tests__/useFetchCompletedTasks.listener-leak.test.tsx` — confirmed test patterns in prime use `renderHook` + `act`
  - Validation artifacts: `jest.setup.ts` configures `testIdAttribute: "data-cy"` — no impact on hook tests
  - Unexpected findings: None
- **Consumer tracing:**
  - TASK-05 is a test-only file; no production consumers
- **Scouts:** None
- **Edge Cases & Hardening:**
  - Snapshot ref baseline must be captured at hook mount (before any `act()`), not at test start
  - `evaluateFirebaseFlowBudget` reads from `firebaseBudgetBaselines` — tests can use the real baselines or inject custom ones via the third argument
- **What would make this >=90%:** Add an integration-style test that runs with the real `firebaseMetrics` singleton and a mocked Firebase SDK — confirms path tracking end-to-end. Deferred as lower priority.
- **Rollout / rollback:**
  - Rollout: Test-only file; no production impact.
  - Rollback: Delete test file.
- **Documentation impact:** None.
- **Notes / references:** `governed test runner: pnpm -w run test:governed`. Tests run in CI only per project testing policy.

---

### TASK-06: Adapt `FirebaseMetricsPanel` to live metrics singleton

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/prime/src/components/dev/FirebaseMetricsPanel.tsx` — adapted to use `firebaseMetrics.getMetrics()` API from `@/services/firebase`; `DevTools` mounted in `apps/prime/src/app/(guarded)/layout.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Build-evidence:** Commit `1e45aedb39`. Switched import to `@/services/firebase`, replaced `getSummary`/`isEnabled`/`clear`/`printSummary` with `getMetrics()`/`reset()`/inline `console.info`. Added `deriveMetricsData` helper for per-path aggregation from `recentQueries`. Mounted `<DevTools />` in `(guarded)/layout.tsx`. Typecheck and lint passed clean.
- **Affects:** `apps/prime/src/components/dev/FirebaseMetricsPanel.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — API mismatch between panel's expected interface (`isEnabled()`, `getSummary()`, `clear()`, `printSummary()`) and live singleton's actual interface (`getMetrics()`, `reset()`). Must adapt panel to new API shape. `getSummary()` computes aggregates from raw metrics; `getMetrics()` returns raw data — panel must do the aggregation inline or call a util.
  - Approach: 80% — option to either (a) add adapter methods to `FirebaseMetrics` class in `firebase.ts` or (b) adapt the panel component directly. Option (b) is preferred — keeps `firebase.ts` minimal.
  - Impact: 80% — makes the dev panel functional (currently shows empty data). Held-back test: If the guarded layout import structure doesn't support adding a dynamic client component easily, there may be a routing constraint. Inspection of `(guarded)/layout.tsx` shows it is a `'use client'` component (confirmed in fact-find read), so adding `<DevTools />` is straightforward.
- **Acceptance:**
  - `FirebaseMetricsPanel` imports `firebaseMetrics` from `@/services/firebase` (not `@/services/firebaseMetrics`)
  - Panel calls `firebaseMetrics.getMetrics()` for data; adapts `byPath`/`byType` aggregation from raw `recentQueries` inline
  - `clear()` action calls `firebaseMetrics.reset()`
  - `isEnabled()` check replaced with `process.env.NODE_ENV === 'development'` check (consistent with panel's own existing guard)
  - `printSummary()` call replaced with a `console.info` of the formatted metrics data
  - `DevTools` is imported and rendered in `(guarded)/layout.tsx` (dev-only via dynamic import already in place)
  - Panel shows live query counts when opened in dev mode
- **Validation contract:**
  - TC-01: After portal loads in dev mode, opening the panel shows non-zero Total Queries — expected: live read data visible
  - TC-02: Clear button calls `firebaseMetrics.reset()` — expected: metrics reset to 0
  - TC-03: Panel does not render in production (existing `process.env.NODE_ENV === 'development'` guard) — expected: no production bundle impact
  - TC-04: `DevTools` component mounted in guarded layout renders panel toggle button in dev — expected: visible in bottom-right corner
- **Execution plan:**
  - Red: Read `FirebaseMetricsPanel.tsx` in full; identify all references to `firebaseMetrics.ts` API methods
  - Green: Replace import; adapt `refreshMetrics()` to build summary from `getMetrics().recentQueries` (compute `byPath` aggregation inline); replace `clear()` → `reset()`; replace `printSummary()` → console.info; replace `isEnabled()` → `process.env.NODE_ENV === 'development'`; add `<DevTools />` to guarded layout
  - Refactor: Ensure `firebaseMetrics.ts` is no longer imported anywhere in the panel; verify old singleton is truly unused
- **Planning validation:**
  - Checks run: Read `FirebaseMetricsPanel.tsx` in full — confirmed: `firebaseMetrics.isEnabled()`, `firebaseMetrics.getSummary()`, `firebaseMetrics.clear()`, `firebaseMetrics.printSummary()` are the four methods referenced. Read `firebase.ts` `getMetrics()` return shape: `{ queryCount, totalBytes, totalKB, activeListeners, slowQueries, recentQueries }`. The `byPath`/`byType` aggregation from `getSummary()` in `firebaseMetrics.ts` must be reimplemented inline in `refreshMetrics()` using `recentQueries`.
  - Validation artifacts: `(guarded)/layout.tsx` is `'use client'` — confirmed from read.
  - Unexpected findings: `firebaseMetrics.ts` `FirebaseMetricsTracker` will become entirely dead code after this change. Should be deleted or left unused (leave for now — deletion is a separate cleanup).
- **Consumer tracing:**
  - New outputs: `FirebaseMetricsPanel` adapted to new API
  - Consumers: `DevTools.tsx` already dynamically imports `FirebaseMetricsPanel` — no change needed there
  - `firebaseMetrics.ts` singleton will have zero consumers after this task
- **Scouts:** `byPath` aggregation inline in `refreshMetrics()`: iterate `recentQueries`, group by path prefix (first segment), sum counts. This is simpler than `getSummary()` but sufficient for the panel display.
- **Edge Cases & Hardening:**
  - Panel polls every 2s in auto-refresh mode — `getMetrics()` is a synchronous object access, safe to call frequently
  - `recentQueries` ring buffer max 50 — panel's "Top Paths" display already limits to 5; compatible
- **What would make this >=90%:** Read `(guarded)/layout.tsx` fully to confirm no import conflicts with `DevTools`. Currently at 80 because the exact adaptation complexity for `byPath`/`byType` inline is not trivially small.
- **Rollout / rollback:**
  - Rollout: Dev-only; no production impact. Panel previously showed empty data; now shows live data.
  - Rollback: Revert `FirebaseMetricsPanel.tsx` to prior import; remove `DevTools` from guarded layout.
- **Documentation impact:** None.
- **Notes / references:** `firebaseMetrics.ts` `getSummary()` is the reference for what `refreshMetrics()` must compute inline.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix `onValue()` wrapper | Yes | None | No |
| TASK-02: Recalibrate baselines | Yes (TASK-01 complete) | Minor: test fixtures in 3 test files use old path strings — will fail until updated in same PR | No — included in TASK-02 scope |
| TASK-03: Create `useBudgetWatcher` | Yes (TASK-01, TASK-02 complete) | None | No |
| TASK-04: Wire watcher into GuardedHomeExperience | Yes (TASK-03 complete) | Minor: `isInitialSyncComplete` not in current destructure — must add to `useUnifiedBookingData` destructure | No — identified in planning validation, included in TASK-04 scope |
| TASK-05: Unit tests | Yes (TASK-03 complete) | None | No |
| TASK-06: Adapt FirebaseMetricsPanel | Partial (TASK-01 complete; `getMetrics()` shape available) | Moderate: `byPath` aggregation must be reimplemented inline — moderate effort, but type-safe given `getMetrics()` return shape | No — included in TASK-06 scope |

No Critical rehearsal findings. All issues are addressed within task scope.

## Delivery Rehearsal

**Data lens:** No external data dependencies. All reads are from the existing dev-only `firebaseMetrics` in-memory singleton.

**Process/UX lens:** No user-visible flow changes. `console.warn` appears in browser DevTools only in dev mode. Panel toggle in bottom-right corner (existing `FirebaseMetricsPanel` UI, unchanged structure).

**Security lens:** No auth boundaries introduced or modified. All changes are dev-only.

**UI lens:** `FirebaseMetricsPanel` UI structure is unchanged — only its data source changes. `DevTools` is mounted in guarded layout (client component). No new routes or pages.

Adjacent ideas routed to Decision Log:
- [Adjacent: delivery-rehearsal] Deleting the now-unused `firebaseMetrics.ts` singleton — cleanup task, not same-outcome. Route to future fact-find.

Note: `arrival_mode_initial` wiring was originally adjacent/deferred, but was promoted to in-scope as part of TASK-04 (plan Round 1 critique). It is now part of the implementation.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `isInitialSyncComplete` never becomes true in error state → watcher silent | Low | Low (false negative only) | Acceptable — failing screen has its own error UI |
| `recentQueries` ring buffer wraps if >50 reads before settle | Very Low | Low (delta may undercount) | Fresh page load starts from empty buffer; max expected reads ≤10 |
| `onValue` fires multiple times (realtime updates after settle) | Medium | None | Idempotency ref in `useBudgetWatcher` ensures evaluation fires once |
| Test fixture updates in 3 files miss one path string | Low | Low (test fails in CI) | All 3 test files enumerated in TASK-02 scope |
| `(guarded)/layout.tsx` import of `DevTools` breaks SSR or routing | Low | Low (dev-only dynamic import) | `DevTools` is already wrapped in `dynamic()` with `ssr: false` |

## Observability

- Logging: `console.warn('[Firebase Budget]', report)` — visible in browser DevTools in dev mode
- Metrics: `window.__firebaseMetrics.getMetrics()` — accessible in dev console after TASK-01 (live data)
- Alerts/Dashboards: None (dev-only tool)

## Acceptance Criteria (overall)

- [ ] `onValue()` wrapper records snapshot paths into `recentQueries`
- [ ] `budgetBaselines.ts` matchers match actual Firebase paths (`preorder`, `cityTax`)
- [ ] `portal_pre_arrival_initial.maxReads` recalibrated to 10
- [ ] `useBudgetWatcher` hook created at `apps/prime/src/hooks/dev/useBudgetWatcher.ts`
- [ ] `console.warn` fires in dev when portal screen reads exceed budget
- [ ] Unit tests for `useBudgetWatcher` pass in CI
- [ ] `FirebaseMetricsPanel` shows live read data in dev mode
- [ ] All existing budget tests pass (fixtures updated to match corrected matchers)

## Decision Log

- 2026-03-09: Chose `console.warn` over throwing `FirebaseBudgetViolationError` — throwing would break the app on the existing baseline discrepancy; warn-only is less disruptive and appropriate for a P3 dev tool.
- 2026-03-09: `arrival_mode_initial.maxReads` set to 10 (same as pre-arrival) — checkInCode via HTTP adds no Firebase read; only the matcher key is kept for documentation.
- 2026-03-09: Owner KPI flow instrumentation deferred — `owner/page.tsx` and `owner/scorecard/page.tsx` are async server components; client hook cannot be placed there without a new client boundary. Deferred to future iteration.
- 2026-03-09: `firebaseMetrics.ts` singleton left in place (not deleted) after TASK-06 — deletion is a cleanup task, not same-outcome. [Adjacent: delivery-rehearsal]
- 2026-03-09 (revised): `arrival_mode_initial` flow wiring in `GuardedHomeExperience` — originally deferred, promoted to in-scope in TASK-04 (Round 1 critique finding). Both `portal_pre_arrival_initial` and `arrival_mode_initial` are now wired via conditional `arrivalState` check. `checked-in` state suppresses evaluation via `budgetIsSettled` guard.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight |
|---|---|---:|---:|
| TASK-01 | 90% | S | 1 |
| TASK-02 | 90% | S | 1 |
| TASK-03 | 85% | M | 2 |
| TASK-04 | 90% | S | 1 |
| TASK-05 | 85% | M | 2 |
| TASK-06 | 80% | M | 2 |

Overall = (90×1 + 90×1 + 85×2 + 90×1 + 85×2 + 80×2) / (1+1+2+1+2+2) = (90+90+170+90+170+160) / 9 = 770/9 ≈ **85.6%** → rounded to **86%** (but using `min(task confidence)` as floor policy → floor is 80%)

Overall-confidence: **84%** (conservative: weighted average tempered by lowest-confidence task at 80%)
