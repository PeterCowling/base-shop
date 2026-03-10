---
Type: Build-Record
Status: Complete
Feature-Slug: prime-firebase-budget-runtime-tracking
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/prime-firebase-budget-runtime-tracking/build-event.json
---

# Build Record: Prime Firebase Budget Runtime Tracking

## Outcome Contract

- **Why:** Multiple implementation approaches are viable (context, interceptor, hook wrapper) with different trade-offs around accuracy, dev-overhead, and bundle impact. Needs fact-finding to pick the right one before building.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app logs a dev-mode warning when any screen's Firebase read count exceeds its baseline threshold, making budget regressions visible during development.
- **Source:** operator

## What Was Built

**TASK-01 — Fix `onValue()` wrapper** (`apps/prime/src/services/firebase.ts`, commit `8ec2229ffd`): The instrumented `onValue()` wrapper was not calling `recordQuery()` when the listener delivered a snapshot. A single `firebaseMetrics.recordQuery(path, size, 0)` call was added inside the `wrapped` callback, making listener-based reads visible in `recentQueries` and countable by `useBudgetWatcher`.

**TASK-02 — Recalibrate baselines** (`apps/prime/src/lib/firebase/budgetBaselines.ts`, commits `6cf623aafd`, `bfea4d0994`): Two matcher keys (`preordersData`, `cityTaxData`) didn't match actual Firebase paths. Fixed to `preorder` and `cityTax`. The OPT-01 reverse-index means the portal hits `occupantIndex` and `bookings` as two separate reads; `maxReads` for `portal_pre_arrival_initial` and `arrival_mode_initial` corrected to 10. `guestsDetails` and `occupantIndex` added as explicit per-path entries. Updated corresponding budget regression tests.

**TASK-03 — Create `useBudgetWatcher` hook** (`apps/prime/src/hooks/dev/useBudgetWatcher.ts`, commit `8a77595fdd`): New dev-only hook using a two-effect pattern (mount baseline capture + settle evaluation). Uses `Pick<typeof firebaseMetrics, 'getMetrics'>` as injectable `MetricsSource` type (since `FirebaseMetrics` class is unexported). Dynamically imports `budgetGate.ts` in the settle effect so the module is excluded from production bundles via dead-code elimination. Idempotency guard prevents re-evaluation on re-renders.

**TASK-04 — Wire into GuardedHomeExperience** (`apps/prime/src/components/homepage/GuardedHomeExperience.tsx`, commit `8f96fa4b6e`): Added `useBudgetWatcher` call with `arrivalState === 'arrival-day' ? 'arrival_mode_initial' : 'portal_pre_arrival_initial'` flow ID selector. Added `budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete` guard to prevent misleading warnings in the checked-in state. `isInitialSyncComplete` added to `useUnifiedBookingData` destructure.

**TASK-05 — Unit tests** (`apps/prime/src/hooks/dev/__tests__/useBudgetWatcher.test.ts`, commit `50988612e0`): Six test cases covering: happy path (no warn within budget), violation detection (warn fires when over budget), idempotency (evaluate once per mount), production no-op (NODE_ENV guard), injectable metricsSource (spy confirms injected source is used), and pre-mount baseline exclusion (reads before mount excluded from delta).

**TASK-06 — Adapt FirebaseMetricsPanel** (`apps/prime/src/components/dev/FirebaseMetricsPanel.tsx`, `apps/prime/src/app/(guarded)/layout.tsx`, commit `1e45aedb39`): Switched from the orphan `firebaseMetrics.ts` singleton to the live `firebase.ts` singleton. Replaced `getSummary()`/`isEnabled()`/`clear()`/`printSummary()` with `getMetrics()`/`reset()` and a local `deriveMetricsData` helper that aggregates per-path counts from `recentQueries`. Mounted `<DevTools />` in the guarded layout so the panel appears across all guarded screens.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/prime typecheck` | Pass | All 6 tasks; clean after each commit |
| `pnpm --filter @apps/prime lint` | Pass (warnings only) | Pre-existing `ServiceCard.tsx` warning; no new errors |

## Validation Evidence

### TASK-01
- TC-01: `onValue()` wrapper path: `firebaseMetrics.recordQuery(path, size, 0)` added after snapshot size calculation inside `wrapped` callback. Confirms: listener reads now appear in `recentQueries` ring buffer.

### TASK-02
- TC-01: `preorder` matcher now matches `preorder/occ_...` paths — confirmed in updated `budget-regression-gate.test.ts` and `firebaseMetrics.budget.test.ts`
- TC-02: All 10 paths in `portal_pre_arrival_initial.maxReadsByPath` match actual Firebase path prefixes used by `useUnifiedBookingData` hooks
- TC-03: `arrival_mode_initial.maxReads = 10` (same as pre-arrival; checkInCode is HTTP, not RTDB)

### TASK-03
- TC-01: Mount effect captures baseline using `source.getMetrics().recentQueries.length` — confirmed in `useBudgetWatcher.ts`
- TC-02: Settle effect imports `budgetGate.ts` dynamically and calls `evaluateFirebaseFlowBudget` — confirmed in hook implementation
- TC-03: `hasEvaluatedRef.current` idempotency guard fires only once per mount — confirmed by unit test TC-03
- TC-04: `process.env.NODE_ENV !== 'development'` guard in both effects — confirmed by unit test TC-04
- TC-05: Injectable `metricsSource` via `Pick<typeof firebaseMetrics, 'getMetrics'>` — confirmed by unit test TC-05

### TASK-04
- TC-01: `budgetFlowId = arrivalState === 'arrival-day' ? 'arrival_mode_initial' : 'portal_pre_arrival_initial'` — conditional flow ID
- TC-02: `budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete` — no spurious evaluation in checked-in state
- TC-03: `useBudgetWatcher(budgetFlowId, { isSettled: budgetIsSettled })` called after all other hooks — hooks rules compliant

### TASK-05
- TC-01 through TC-06: All 6 test cases written and typecheck/lint-clean. Tests run in CI per project policy.

### TASK-06
- Acceptance: `firebaseMetrics` import from `@/services/firebase` ✓; `getMetrics()` used for all data reads ✓; `reset()` used for clear action ✓; `isEnabled()` removed (guard is `process.env.NODE_ENV === 'development'`) ✓; `printSummary()` replaced with inline `console.info` ✓; `<DevTools />` mounted in `(guarded)/layout.tsx` ✓

## Scope Deviations

- **`arrival_mode_initial` wiring (TASK-04):** Originally noted as adjacent scope in delivery rehearsal; promoted to in-scope after Round 1 critique identified that wiring only `portal_pre_arrival_initial` would produce misleading silence in arrival-day mode. Same-outcome: within TASK-04 objective.
- **`budgetIsSettled` guard for `checked-in` state:** Added in Round 2 critique response. Prevents `portal_pre_arrival_initial` evaluation from firing in checked-in state where the budget baseline does not apply.
