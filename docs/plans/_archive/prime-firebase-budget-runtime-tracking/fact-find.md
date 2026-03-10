---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: prime-firebase-budget-runtime-tracking
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/prime-firebase-budget-runtime-tracking/plan.md
Dispatch-ID: IDEA-DISPATCH-20260309120000-0004
Trigger-Why:
Trigger-Intended-Outcome:
---

# Prime Firebase Budget Runtime Tracking — Fact-Find Brief

## Scope

### Summary

`budgetBaselines.ts` defines per-screen Firebase read budgets (e.g. `portal_pre_arrival_initial: maxReads: 8`). `budgetGate.ts` provides evaluation logic (`evaluateFirebaseFlowBudget`, `assertFirebaseFlowBudget`) but is only called from Jest tests — no runtime code passes live read counts into it. All 6 flow budgets are enforcement-free at runtime.

The `firebase.ts` service wrapper records every `get()` call into a `firebaseMetrics` singleton (queryCount, recentQueries with paths). However, for `onValue()` calls, the wrapper only increments `activeListeners` — it does NOT call `recordQuery()` on snapshot delivery. The `completedTasks` listener path never enters `recentQueries`. This is a gap in the existing metrics layer: `get()`-based reads are fully tracked per-path, but `onValue()`-based reads are only tracked as a listener count.

There are two infrastructure gaps that must be fixed before `evaluateFirebaseFlowBudget()` can accurately enforce path-level budgets at runtime:

**Gap 1 — onValue not tracked by path:** The `onValue` wrapper must call `recordQuery()` on each snapshot delivery to make `completedTasks` paths enforceable.

**Gap 2 — baseline matcher/path misalignment:** `evaluateFirebaseFlowBudget()` uses `path.includes(matcher)` for path counting. Several baseline matchers do not match actual Firebase paths:
- Baseline `preordersData` → actual path `preorder/{uuid}` (no 's', no 'Data' suffix) — will never match
- Baseline `cityTaxData` → actual path `cityTax/{bookingRef}` (no 'Data' suffix) — will never match
- Baseline `bagStorage` → actual path `bagStorage/{uuid}` ✓ matches
- Baseline `bookings`, `completedTasks`, `guestByRoom`, `financialsRoom` → appear to match (contain the matcher string)

Until matchers are corrected, `maxReadsByPath.preordersData` and `maxReadsByPath.cityTaxData` are effectively unenforced at runtime regardless of path tracking. These are additional prerequisite fixes alongside the `onValue` wrapper fix. The `maxReads` total count check is unaffected by matcher alignment.

Beyond these prerequisite fixes, the remaining work is: (a) scoping metrics to a specific screen flow window, and (b) calling `evaluateFirebaseFlowBudget()` with the windowed snapshot and warning when it fires.

### Goals

1. Emit a `console.warn` in dev when any screen's Firebase reads exceed its budget baseline during initial load.
2. Make budget violations visible automatically — no per-screen test required.
3. Reuse `evaluateFirebaseFlowBudget()` from `budgetGate.ts` unchanged.
4. Keep implementation to a single, well-placed hook or utility — not a refactor of every `pureData` hook.

### Non-goals

- Adding staging/production alerting (dev-only for this change).
- Modifying the `budgetGate.ts` evaluation logic.
- Tracking individual path counts across multiple screen transitions (one window per screen mount is sufficient).

Note: `budgetBaselines.ts` recalibration is in scope as a prerequisite fix. After the `onValue()` wrapper fix (which adds completedTasks snapshot to read counts), the portal happy path generates 10 reads; `portal_pre_arrival_initial.maxReads` must be recalibrated to 10 (not 8 or 9). Matcher keys must also be corrected (`preordersData` → `preorder`, `cityTaxData` → `cityTax`) and `occupantIndex`/`bookings/{code}/{uuid}` paths added to `maxReadsByPath`.

### Constraints & Assumptions

- Constraints:
  - Must stay dev-only in bundle terms (dead code eliminated from production builds, or gated behind `process.env.NODE_ENV !== 'production'`).
  - All pureData hooks import `get()` and `onValue()` from `@/services/firebase` — the instrumented wrappers. This is already a transparent intercept point.
  - The existing `firebaseMetrics` in `firebase.ts` is a global cumulative counter. It does not reset per screen mount. A per-flow window is needed to avoid reading stale cross-screen counts.
  - **Critical gap:** The `onValue()` wrapper in `firebase.ts` only calls `listenerAdded()`/`listenerRemoved()` — it does NOT call `recordQuery()` on snapshot delivery. The `completedTasks` listener path never enters `recentQueries`. This means `maxReadsByPath.completedTasks` enforcement requires a prerequisite fix to `onValue()` to also call `recordQuery()` on each snapshot event.
  - There are **two separate `firebaseMetrics` singletons**: one in `firebase.ts` (used by the instrumented wrappers, `recordQuery()`/`listenerAdded()`) and a second in `firebaseMetrics.ts` (used by `FirebaseMetricsPanel`, `startQuery()`/`getSummary()`). They are not connected. The panel currently shows data from the wrong singleton.
- Assumptions:
  - "Screen" corresponds to a flow ID in `budgetBaselines.ts`. The calling component knows which flow ID applies.
  - Opt-in per screen (the hook is called with a flow ID from the screen component) is acceptable — no magic auto-detection needed.
  - `portal_cached_revisit` (`maxReads: 0`) is the only flow where a read count of 0 is expected; the rest expect reads, so a watcher that fires after a brief settle window (e.g. after bookings data resolves) is appropriate.

## Outcome Contract

- **Why:** Multiple implementation approaches are viable (context, interceptor, hook wrapper) with different trade-offs around accuracy, dev-overhead, and bundle impact. Needs fact-finding to pick the right one before building.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app logs a dev-mode warning when any screen's Firebase read count exceeds its baseline threshold, making budget regressions visible during development.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/prime/src/services/firebase.ts` — Instrumented `get()` and `onValue()` wrappers. Every Firebase read in the app goes through these. The `firebaseMetrics` singleton in this file is incremented on every call.
- `apps/prime/src/lib/firebase/budgetGate.ts` — Pure evaluation functions (`evaluateFirebaseFlowBudget`, `assertFirebaseFlowBudget`). Accepts a `FirebaseMetricsSnapshot` (queryCount + recentQueries array with paths). Currently test-only.
- `apps/prime/src/lib/firebase/budgetBaselines.ts` — 6 defined flows with `maxReads`, `maxActiveListeners`, `maxReadsByPath`.
- `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` — Aggregates all 9 pureData hooks for the portal/arrival screens. This is the primary screen-level orchestration entry point.

### Key Modules / Files

- `apps/prime/src/services/firebase.ts` — Contains `FirebaseMetrics` class with `recordQuery(path, sizeBytes, durationMs)` and `listenerAdded()`/`listenerRemoved()`. Exports `firebaseMetrics` singleton. **This is the live read counter.** `get()` calls `firebaseMetrics.recordQuery(...)` after every Firebase get. `onValue()` calls `firebaseMetrics.listenerAdded()` on subscribe, `listenerRemoved()` on unsubscribe. The `getMetrics()` method returns `{ queryCount, totalBytes, activeListeners, recentQueries: QueryRecord[] }` where `QueryRecord` includes `path`.
- `apps/prime/src/services/firebaseMetrics.ts` — A **separate, disconnected** `FirebaseMetricsTracker` class. Only used by `FirebaseMetricsPanel`. It exposes `startQuery()` / `getSummary()`. No reads flow through it — it is effectively inert as a metrics tool (the panel shows stale/empty data because nothing calls `startQuery()`).
- `apps/prime/src/components/dev/FirebaseMetricsPanel.tsx` — Dev panel that imports from `firebaseMetrics.ts` (the wrong singleton). Shows "No queries tracked yet" despite reads happening.
- `apps/prime/src/components/dev/DevTools.tsx` — Dynamically imports `FirebaseMetricsPanel`. **Not currently mounted anywhere in the app** (grep for `<DevTools` returns no mount points in the app tree).
- `apps/prime/src/hooks/pureData/` — 14 pureData hooks. All use `get()` or `onValue()` from `@/services/firebase` (the instrumented wrapper). None import `budgetGate` or `budgetBaselines`. None count reads.
- `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts` — Calls 9 pureData hooks. Covers the `portal_pre_arrival_initial` and `arrival_mode_initial` flows. No budget awareness.

### Patterns & Conventions Observed

- **Transparent intercept pattern already in place:** All reads go through `@/services/firebase`'s instrumented wrappers. A budget watcher does not need to modify individual hooks.
- **Dev-only gating pattern:** `firebase.ts` already gates `firebaseMetrics` exposure to `process.env.NODE_ENV !== 'production'`. `DevTools.tsx` uses `process.env.NODE_ENV === "development"` guard before rendering. Same pattern should apply to any budget watcher.
- **React Query for get() hooks, `onValue()` for realtime:** `useFetchCompletedTasks` uses `onValue()` (contributing 1 activeListener). All other portal hooks use `useQuery` + `get()`. This means `activeListeners` increments by 1 for completedTasks and the rest are `queryCount` increments.
- **Two-phase loading in `useOccupantDataSources`:** Phase 1 (bookings + completedTasks) fires immediately; Phase 2 (loans, guestByRoom, preorders, bagStorage) waits for `bookingsData !== null`; Dependent (guestDetails, financials, cityTax) waits for `bookingRef`. So reads complete in bursts, not atomically.
- **Check-in code goes via HTTP API, not Firebase:** `useFetchCheckInCode` uses `fetch()` to `/api/check-in-code`. It does NOT call `get()` from `firebase.ts`. The `arrival_mode_initial` budget lists `checkInCode: 1` in `maxReadsByPath` but this is an API read, not an RTDB read. The budget gate uses path matching — this path would never appear in `recentQueries`.

### Data & Contracts

- Types/schemas/events:
  - `FirebaseMetricsSnapshot` (budgetGate.ts): `{ queryCount: number; activeListeners: number; recentQueries: FirebaseReadRecord[] }` where `FirebaseReadRecord = { path: string; sizeBytes?: number; durationMs?: number; timestamp?: number }`
  - `QueryRecord` (firebase.ts): `{ path: string; sizeBytes: number; durationMs: number; timestamp: number }` — shape-compatible with `FirebaseReadRecord`
  - `FirebaseFlowBudgetReport` (budgetGate.ts): `{ flowId, ok, queryCount, activeListeners, maxReads, maxActiveListeners, readCountsByPath, violations }`
- Persistence: dev-only in-memory singleton, no persistence across page loads.
- API/contracts: `evaluateFirebaseFlowBudget(flowId, metrics, baselines?)` — pure function, accepts injected baselines for testability. `buildMetricsSnapshot(readPaths, activeListeners)` is a test helper that constructs the snapshot shape.

### Dependency & Impact Map

- Upstream dependencies:
  - `firebase.ts` `firebaseMetrics.recordQuery()` — already called on every read
  - `budgetGate.ts` `evaluateFirebaseFlowBudget()` — pure, no deps
  - `budgetBaselines.ts` `firebaseBudgetBaselines` — static config
- Downstream dependents:
  - Any screen component that calls the new hook (opt-in)
  - No existing code is modified in the critical path
- Likely blast radius: narrow — additive only. New hook + dev-only warning. No production code path changes.

## Spot-Check: Actual vs Budget Read Counts

### portal_pre_arrival_initial (maxReads: 8, maxActiveListeners: 1)

Actual reads via instrumented `firebase.ts`:

| Hook | Reads | Path(s) |
|---|---|---|
| useFetchBookingsData (index hit) | 2 | `occupantIndex/{uuid}`, `bookings/{code}/{uuid}` |
| useFetchBookingsData (full scan fallback) | 1 | `bookings` (entire table) |
| useFetchCompletedTasks | 1 listener (`onValue`) | `completedTasks/{uuid}` |
| useFetchLoans | 1 | `loans/{uuid}` |
| useFetchGuestByRoom | 1 | `guestByRoom/{uuid}` |
| useFetchPreordersData | 1 | `preorder/{uuid}` or similar |
| useFetchBagStorageData | 1 | `bagStorage/{uuid}` |
| useFetchGuestDetails | 1 | `guestsDetails/{code}/{uuid}` |
| useFetchFinancialsRoom | 1 | `financialsRoom/{code}` |
| useFetchCityTax | 1 | `cityTax/{code}` or similar |

Index-hit path: 2 (occupantIndex + direct booking) + 7 secondary = **9 reads + 1 listener**. This already **exceeds `maxReads: 8`**. Full-scan fallback: 1 read + 7 secondary = **8 reads + 1 listener** (within budget, but no occupantIndex is written yet). This is a genuine budget discrepancy between the baseline definition and actual hook behaviour: the index-hit path produces 9 reads, not 8.

Note: `maxReadsByPath` in the baseline does not include `occupantIndex` or the direct booking path. The baseline appears to have been written assuming the full-scan path (1 bookings read), not the index path (2 reads). This is a pre-existing alignment issue.

### arrival_mode_initial (maxReads: 9, maxActiveListeners: 1)

Same as pre-arrival plus `checkInCode: 1` in `maxReadsByPath`. But `useFetchCheckInCode` uses HTTP (`fetch()`), not `firebase.ts` `get()`. The `checkInCode` path will never appear in `recentQueries`. Budget evaluation using live `recentQueries` would score this flow as: index-hit path = 9 reads (occupantIndex + booking + 7 secondary) + 0 for checkInCode (HTTP) = within `maxReads: 9`, but the `checkInCode` matcher in `maxReadsByPath` would always show 0/1 — never a violation for that path, but also never counting it.

### owner_kpi_dashboard_7day (maxReads: 7, maxActiveListeners: 0)

Not orchestrated via `useOccupantDataSources`. Owner dashboard has its own data hooks. Not investigated in detail — the owner flow likely uses separate fetch hooks for `ownerKpis/{date}` nodes.

## Implementation Approach Analysis

### Option A: Dev-only hook `useBudgetWatcher(flowId)`

A `useBudgetWatcher` hook that:
1. On mount: snapshots `firebaseMetrics.getMetrics().queryCount` and `recentQueries.length` as baseline
2. After a settle window (e.g. when `isLoading` transitions to `false`, or a short timeout): snapshots again and computes delta
3. Calls `evaluateFirebaseFlowBudget(flowId, deltaSnapshot)` and `console.warn(report)` if `!report.ok`

**Integration point:** Called from the screen component (e.g. `GuardedHomeExperience.tsx`) alongside `useOccupantDataSources()`. Not inside the pureData hooks.

**Pros:** Explicit, per-screen. No wrapper complexity. Easy to test. Reuses `evaluateFirebaseFlowBudget()` directly.

**Cons:** Requires knowing when "initial load is done" — requires either a settle timeout or passing `isLoading` state. Delta computation (start vs end) adds bookkeeping. The global `firebaseMetrics` accumulates across components; without resetting between screen mounts, delta tracking may be noisy if components remount.

**Verdict: Preferred.** Simplest approach, explicit opt-in, no modification to existing hooks, dev-only gating is trivial.

### Option B: React Context read counter (wraps each useQuery/onValue)

A React Context that wraps every `useQuery`/`onValue` call with a counter increment per flow window.

**Pros:** Automatic for all hooks within the context tree.

**Cons:** Requires refactoring every `pureData` hook to be context-aware, or wrapping React Query's query client. High blast radius. Over-engineered for a dev-only tool.

**Verdict: Rejected.** Too much surface area for a dev warning.

### Option C: Firebase SDK onRead interceptor

Monkey-patch `firebase/database`'s `get()` at module load time.

**Pros:** Fully transparent.

**Cons:** Fragile, non-standard, breaks TypeScript contracts. The instrumented wrappers in `firebase.ts` already achieve the same effect cleanly.

**Verdict: Rejected.** The instrumented wrapper approach is already in place.

### Option D: Extend `firebase.ts` `firebaseMetrics` with per-flow window support

Add `startFlowWindow(flowId)` / `endFlowWindow(flowId)` to the `FirebaseMetrics` class, which records a sub-slice of reads for a given flow. The budget check runs at `endFlowWindow`.

**Pros:** Budget evaluation is centrally located in the metrics layer. No per-screen hook needed.

**Cons:** Requires screen components to call start/end explicitly, which is equivalent to a hook but with less composable lifecycle management. The hook approach (Option A) achieves the same with `useEffect` lifecycle for free.

**Verdict: Viable but not better than Option A.** The hook is cleaner.

### Selected approach: Option A — `useBudgetWatcher(flowId, { isLoading })`

The hook:
- Is dev-only: early return when `process.env.NODE_ENV !== 'development'`
- Captures `recentQueries` snapshot at mount (to establish baseline for delta)
- Captures snapshot when `isLoading` transitions to `false` (or after a fixed 3-second settle for listener-based hooks)
- Calls `evaluateFirebaseFlowBudget(flowId, deltaSnapshot)` and logs a structured `console.warn` on violation
- Lives at `apps/prime/src/hooks/dev/useBudgetWatcher.ts`
- Added to: `GuardedHomeExperience.tsx` or a client component within the guarded portal (portal_pre_arrival_initial, arrival_mode_initial)
- **Owner dashboard scope:** `apps/prime/src/app/owner/page.tsx` and `apps/prime/src/app/owner/scorecard/page.tsx` are async server components — a client hook cannot be added to them directly. Instrumenting the owner KPI flows requires either (a) creating a client wrapper component within the owner page subtree, or (b) deferring owner dashboard instrumentation to a separate iteration. Owner flows are lower priority (P3 overall) — defer to a follow-on task.

### dev/tools duplication fix (bonus fix, separate scope)

`FirebaseMetricsPanel` imports from `firebaseMetrics.ts` (the wrong singleton). However, fixing this is NOT a 1-line import change: `FirebaseMetricsPanel.tsx` calls `firebaseMetrics.isEnabled()`, `getSummary()`, `clear()`, and `printSummary()` — methods that exist only on `firebaseMetrics.ts`'s `FirebaseMetricsTracker` class. The live singleton in `firebase.ts` exposes only `getMetrics()` and `reset()`. A full fix requires either adapting `FirebaseMetricsPanel` to the `firebase.ts` API (`getMetrics()` → map to the summary format) or unifying the two singletons. This is a separate task, not a trivial hitchhiker change — estimate 1-2 hours. It should be in scope but tracked as its own task seed with a realistic effort estimate.

`DevTools` is also not mounted anywhere. Adding `<DevTools />` to `apps/prime/src/app/(guarded)/layout.tsx` or similar guarded root layout is required for the panel to be visible. However, `console.warn` from `useBudgetWatcher` is visible in browser dev tools without the panel being mounted — the panel is optional convenience, not a prerequisite for budget warnings.

### Dev-only vs staging/production

**Dev-only is correct for the initial implementation.** The intended outcome is to catch regressions during development. Staging/production enforcement would require:
- Structured logging integration (not present in prime)
- Acceptance that budget violations trigger noise in staging for guest sessions
- Calibration of baselines against real-world read patterns

These are out of scope for the current change. The `console.warn` approach is appropriate for dev.

### Integration with existing `budgetGate.ts`

Extend, not replace. `budgetGate.ts` provides the pure evaluation functions and should remain as the test-time gate. The new `useBudgetWatcher` hook calls `evaluateFirebaseFlowBudget()` from `budgetGate.ts` — no changes to `budgetGate.ts`.

The `buildMetricsSnapshot()` test helper in `budgetGate.ts` is for tests only and is not used by the runtime hook.

## Test Landscape

### Test Infrastructure

- Frameworks: Jest + React Testing Library (renderHook)
- Commands: governed test runner via `pnpm -w run test:governed`
- CI integration: runs in CI only

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| budgetGate evaluation | Unit | `apps/prime/src/lib/firebase/__tests__/budget-regression-gate.test.ts` | 3 TCs covering exceedance, parse errors, in-budget path |
| Budget contracts | Unit | `apps/prime/src/hooks/dataOrchestrator/__tests__/firebase-query-budget.test.tsx` | 4 TCs covering pre-arrival, arrival, manual refetch, cached revisit |
| Metrics baseline | Unit | `apps/prime/src/services/__tests__/firebaseMetrics.budget.test.ts` | 2 TCs covering path tracking and rationale presence |
| pureData hooks | Unit | `apps/prime/src/hooks/pureData/__tests__/` | 1 file: useFetchCompletedTasks.listener-leak.test.tsx |
| useOccupantDataSources | Unit | `apps/prime/src/hooks/dataOrchestrator/__tests__/` | Exists (useOccupantDataSources.test.ts) |

### Coverage Gaps

- No test for `useBudgetWatcher` (new, needs authoring)
- No test that verifies the `firebaseMetrics` in `firebase.ts` is called during hook execution (tests mock Firebase entirely)
- `FirebaseMetricsPanel` has no test — and its metrics source is wrong (dead code path)

### Testability Assessment

- Easy to test: `useBudgetWatcher` logic (mock `firebaseMetrics.getMetrics()` to return controlled snapshots; verify `console.warn` called with violation report)
- Hard to test: end-to-end read counting in integration (Firebase is fully mocked in Jest; live read counts require real Firebase or a more sophisticated spy)
- Test seams: `useBudgetWatcher` should accept an optional injected `metricsSource` parameter (defaulting to `firebaseMetrics` from `firebase.ts`) for testability

## Questions

### Resolved

- Q: Does `budgetGate.ts` do any runtime read counting?
  - A: No. It provides pure evaluation functions that accept pre-constructed `FirebaseMetricsSnapshot` objects. All existing callers are in Jest tests. No runtime code calls these functions.
  - Evidence: `apps/prime/src/lib/firebase/budgetGate.ts` — only imported in 3 test files; grep across all prime src returns no non-test callers.

- Q: Do any hooks count reads today?
  - A: No per-flow counting. The `firebase.ts` `firebaseMetrics` singleton counts reads globally and cumulatively. No hook resets or reads from it. The `firebaseMetrics.ts` singleton (used by the dev panel) has nothing flowing into it.
  - Evidence: grep for `budgetGate`, `budgetBaselines`, `recordQuery` in `pureData/` returns no matches.

- Q: Is the `firebaseMetrics` in `firebase.ts` the right source for a budget watcher?
  - A: Yes, for `get()`-based hooks. The `onValue()` wrapper has a gap: it calls `listenerAdded()` but NOT `recordQuery()` on snapshot delivery. So `recentQueries` contains paths for all `get()` calls but never the `completedTasks` listener path. The `maxActiveListeners` check works (via `activeListeners` counter); `maxReads` and `maxReadsByPath` checks for listener-based paths require a fix to the `onValue` wrapper. This gap must be fixed in the build (task seed 1) before the budget watcher can enforce `completedTasks` path budgets.
  - Evidence: `apps/prime/src/services/firebase.ts` lines 348-377 — `onValue` wrapper: `listenerAdded()` on subscribe, no `recordQuery()` on snapshot; all pureData hooks import from `@/services/firebase`.

- Q: Which approach is best for runtime tracking?
  - A: `useBudgetWatcher(flowId, { isLoading })` hook (Option A). See implementation approach analysis above.
  - Evidence: analysis of 4 approaches above.

- Q: Should this be dev-only or also run in staging/production?
  - A: Dev-only for this change. Staging/production enforcement requires structured logging and baseline calibration work that is out of scope.
  - Evidence: no structured logging integration in prime; baselines already have discrepancies vs actual hook behaviour (index-hit path exceeds `maxReads: 8`).

- Q: Extend `budgetGate.ts` or replace it?
  - A: Extend. `evaluateFirebaseFlowBudget()` is called unchanged from the new hook. `budgetGate.ts` keeps its test-time role.
  - Evidence: `budgetGate.ts` is a pure function library with no runtime dependencies; trivially callable from a hook.

- Q: Does `checkInCode` reading show up in Firebase metrics?
  - A: No. `useFetchCheckInCode` uses `fetch()` to `/api/check-in-code`, not `firebase.ts` `get()`. The `checkInCode` budget path will always show 0 in live metrics. The `arrival_mode_initial` baseline's `maxReadsByPath.checkInCode: 1` is effectively un-enforced by live tracking.
  - Evidence: `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts` — no import from `@/services/firebase`; uses `fetch()` directly.

- Q: Is the index-hit path for bookings within budget? And what should the recalibrated maxReads be?
  - A: After the `onValue()` fix (task seed 1), the `completedTasks` listener snapshot will also contribute 1 read to `recentQueries`. The portal happy path reads become: 2 booking reads (occupantIndex + direct booking) + 1 completedTasks snapshot (via `onValue`, post-fix) + 7 secondary `get()` reads (loans, guestByRoom, preorders, bagStorage, guestDetails, financials, cityTax) = **10 total reads**. The current baseline is 8; recalibrating to 9 would still produce a false positive. The correct recalibration target is **10**. This is required (not optional) and is in scope for this change.
  - Evidence: `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts` lines 48, 57; `useFetchCompletedTasksData.ts` uses `onValue` → adds 1 snapshot read after fix; 7 secondary `get()` hooks confirmed in `useOccupantDataSources.ts`; `budgetBaselines.ts` `portal_pre_arrival_initial.maxReads: 8`.

- Q: Are baseline `maxReadsByPath` matchers correctly aligned to actual Firebase paths?
  - A: No — two matchers are wrong. `preordersData` does not match `preorder/{uuid}` (path uses `preorder`, not `preordersData`). `cityTaxData` does not match `cityTax/{bookingRef}` (path uses `cityTax`, not `cityTaxData`). Both must be corrected in `budgetBaselines.ts` as part of the build (alongside the `occupantIndex` and direct-booking paths that are also missing from `maxReadsByPath`). This is a prerequisite fix.
  - Evidence: `apps/prime/src/hooks/pureData/useFetchPreordersData.ts` line 26: `` `preorder/${uuid}` ``; `apps/prime/src/hooks/pureData/useFetchCityTax.ts` line 22: `` `cityTax/${bookingRef}` ``; `budgetBaselines.ts` `portal_pre_arrival_initial.maxReadsByPath.preordersData` and `.cityTaxData`.

### Open (Operator Input Required)

- Q: Should the budget watcher warn and continue, or should it throw a `FirebaseBudgetViolationError` in development?
  - Why operator input is required: this is a severity/UX preference. Warning keeps dev experience smooth; throwing breaks the page in dev mode, which is more visible but disruptive.
  - Decision impacted: whether `useBudgetWatcher` calls `evaluateFirebaseFlowBudget` or `assertFirebaseFlowBudget`.
  - Decision owner: operator
  - Default assumption: `console.warn` only (not throw). Throwing is aggressive for a budget tool and would break the app on the existing `portal_pre_arrival_initial` baseline discrepancy.


## Confidence Inputs

- Implementation: 88%
  - Evidence: instrumented wrapper already exists; `evaluateFirebaseFlowBudget` is pure and testable; hook pattern is well-established.
  - What raises to >=90: confirm settle-window timing approach (isLoading-based vs fixed timeout) and whether `recentQueries` ring buffer (50 entries) is sufficient for the portal flow.
- Approach: 85%
  - Evidence: 4 approaches analysed; Option A is clearly least-invasive with full reuse of existing infrastructure.
  - What raises to >=90: resolve the one remaining open question (warn vs throw).
- Impact: 82%
  - Evidence: dispatch intent is clear; the watcher fills the stated gap. Bonus: panel singleton fix makes the existing dev tool functional.
  - What raises to >=90: confirm DevTools mount point is acceptable in the guarded layout.
- Delivery-Readiness: 85%
  - Evidence: no new dependencies; dev-only; additive only; existing test infrastructure supports hook testing.
  - What raises to >=90: resolve open questions before build starts.
- Testability: 87%
  - Evidence: `useBudgetWatcher` is injectable (metricsSource parameter); `evaluateFirebaseFlowBudget` is already tested; panel fix is a 1-line change.
  - What raises to >=90: confirm mock strategy for `firebaseMetrics.getMetrics()` in Jest tests.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Watcher fires false positive on every dev portal load due to index-hit path exceeding maxReads: 8 | High | Low (dev-only warn, not a crash) | Recalibrate baseline to 10 in same PR (post-onValue fix, completedTasks adds 1 more; 2+1+7=10) |
| `recentQueries` ring buffer (max 50 entries) fills up before watcher reads delta if prior navigations left stale entries | Medium | Low (over-counts, false positive) | Delta approach (snapshot at mount, snapshot at settle) mitigates this |
| settle timing (isLoading → false) fires before Phase 2/Dependent hooks complete, under-counting reads | Low-Medium | Low (false negative only) | Add small buffer or trigger after all `isLoading` flags are false |
| `firebaseMetrics.ts` singleton duplication causes confusion in future development | Medium | Moderate (dev experience debt) | Panel adapter fix in separate task (1-2 hours); document that `firebase.ts` is the authoritative singleton |
| `onValue` wrapper does not call `recordQuery()` — `completedTasks` path-budget enforcement fails | High (current state) | Moderate | Fix `onValue` wrapper to call `recordQuery()` on snapshot delivery (task seed 1) — prerequisite for full enforcement |
| DevTools not mounted means the FirebaseMetricsPanel is inaccessible | High (currently) | Low (console.warn from useBudgetWatcher still works without panel) | Mount `<DevTools />` in guarded layout (optional task seed 6) |

## Planning Constraints & Notes

- Must-follow patterns:
  - Dev-only guard: `if (process.env.NODE_ENV !== 'development') return;` at hook top
  - Place hook at `apps/prime/src/hooks/dev/useBudgetWatcher.ts`
  - Reuse `evaluateFirebaseFlowBudget()` unchanged — no modifications to `budgetGate.ts`
  - All imports of `firebaseMetrics` should point to `@/services/firebase` (the live singleton), not `@/services/firebaseMetrics`
- Rollout/rollback expectations:
  - Dev-only: no production impact; rollback is trivially removing the hook call from the screen component
- Observability expectations:
  - Violations surface as `console.warn` in browser dev tools
  - Report object includes `violations[]` array with human-readable messages (already generated by `evaluateFirebaseFlowBudget`)

## Suggested Task Seeds (Non-binding)

1. **Prerequisite:** Update `onValue()` wrapper in `apps/prime/src/services/firebase.ts` to call `firebaseMetrics.recordQuery(path, size, 0)` inside the `wrapped` callback on each snapshot delivery — this enables path-level tracking for realtime listeners
2. **Prerequisite:** Recalibrate `budgetBaselines.ts` for `portal_pre_arrival_initial`:
   - Update `maxReads` from 8 to **10** (2 booking reads + 1 completedTasks snapshot post-fix + 7 secondary = 10)
   - Fix matcher keys: `preordersData` → `preorder`, `cityTaxData` → `cityTax`
   - Add missing happy-path paths to `maxReadsByPath`: `occupantIndex: 1`, `guestsDetails: 1` (direct booking path uses `bookings/{code}/{uuid}` which matches the existing `bookings` matcher)
   - Apply equivalent matcher/count fixes to `arrival_mode_initial` (same paths + checkInCode)
3. Create `apps/prime/src/hooks/dev/useBudgetWatcher.ts` — dev-only hook (early return when `process.env.NODE_ENV !== 'development'`) that snapshots `firebaseMetrics.getMetrics()` at mount and after isLoading settles, then calls `evaluateFirebaseFlowBudget()` and `console.warn`s on violation with an injectable `metricsSource` parameter for testability
4. Add `useBudgetWatcher('portal_pre_arrival_initial', { isLoading })` call to the client component that drives the guarded portal home screen (not a server component)
5. Fix `FirebaseMetricsPanel.tsx`: adapt it to use `firebase.ts`'s `firebaseMetrics.getMetrics()` API (replacing calls to `isEnabled()`, `getSummary()`, `clear()`, `printSummary()` which only exist on the disconnected `firebaseMetrics.ts` singleton) — estimated 1-2 hours
6. Mount `<DevTools />` in the guarded layout (optional — `console.warn` in step 3 is visible without the panel)
7. Add unit tests for `useBudgetWatcher` with injectable `metricsSource` parameter (mock `getMetrics()` to return controlled snapshots; assert `console.warn` called on violation)
8. Owner dashboard instrumentation: deferred — owner pages are async server components; requires a separate client wrapper component. Not in scope for this change.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `onValue()` wrapper in `firebase.ts` calls `recordQuery()` on snapshot delivery
  - `budgetBaselines.ts` corrected: matchers (`preordersData` → `preorder`, `cityTaxData` → `cityTax`), `maxReads` recalibrated to 10, `occupantIndex` and `guestsDetails` paths added to `maxReadsByPath`
  - `useBudgetWatcher` hook exists at `apps/prime/src/hooks/dev/`
  - Console.warn fires in dev when read count exceeds baseline for portal screens
  - Unit tests for `useBudgetWatcher` pass in CI
- Post-delivery measurement plan:
  - Developer runs the portal in dev mode and observes console — any budget violation is visible without a dedicated test

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| budgetGate.ts — does it do runtime counting? | Yes | None | No |
| firebase.ts — is the instrumented wrapper already in place? | Partial | [Scope gap] [Major]: `onValue()` wrapper calls `listenerAdded()` but NOT `recordQuery()` on snapshot delivery. `completedTasks` path never enters `recentQueries`. `maxReadsByPath.completedTasks` enforcement is currently uncoverable via path matching alone. Fix required in build (task seed 1). | Yes — addressed in task seeds |
| pureData hooks — do any count reads today? | Yes | None | No |
| Actual read counts vs baselines (spot-check 2-3 screens) | Yes | [Scope gap] [Minor]: checkInCode is HTTP, not RTDB — will never appear in firebase.ts metrics. arrival_mode_initial maxReadsByPath.checkInCode is effectively un-enforced. | No — informational only |
| portal_pre_arrival_initial baseline alignment | Yes | [Scope gap] [Moderate]: post-onValue-fix portal happy path = 10 reads (2 booking + 1 completedTasks snapshot + 7 secondary). Baseline maxReads: 8. Recalibration target must be 10. Also: `preordersData`/`cityTaxData` matchers do not match real paths; `occupantIndex`/`guestsDetails` paths absent from maxReadsByPath. | Yes — addressed in task seed 2 |
| Implementation approach selection | Partial | [Missing domain] [Moderate]: Owner dashboard pages are async server components — `useBudgetWatcher` cannot be added directly. Owner KPI flow instrumentation requires a client wrapper component and is deferred. | Yes — addressed in task seed 8 (deferred) |
| Two-singleton duplication | Yes | None — identified and mitigation included in task seeds | No |
| DevTools mount gap | Yes | [Missing domain] [Minor]: DevTools not mounted means the visual panel is inaccessible. Console.warn from useBudgetWatcher works without the panel — this is optional scope. | No — addressed in task seed 6 (optional) |
| Test landscape | Yes | None | No |
| Bundle impact (dev-only gate) | Yes | None — existing pattern confirms dev-only gating is standard | No |

## Evidence Gap Review

### Gaps Addressed

- All 6 budget flow IDs investigated against actual hook code — confirmed which use `useOccupantDataSources` (portal/arrival) and which are separate (owner KPI).
- Confirmed that `firebaseMetrics.ts` and `firebase.ts` are disconnected singletons (not a single shared instance).
- Confirmed `useFetchCheckInCode` does not go through Firebase RTDB — uses HTTP API proxy.
- Confirmed `DevTools` component is not mounted (grep returns no mount sites in app).
- Confirmed all pureData hooks import from `@/services/firebase` (the instrumented wrapper) — transparent intercept is complete.
- Discovered that `preordersData` and `cityTaxData` baseline matchers do not match actual Firebase paths (`preorder/...`, `cityTax/...`). Two budget paths have been silently unenforced in tests that hardcode matching paths (tests pass because test data was constructed to match the matchers, not the real paths).
- Confirmed `onValue()` wrapper does not call `recordQuery()` on snapshot delivery — listener-based paths invisible in `recentQueries`. After fixing this, `completedTasks` contributes 1 additional read, making the `portal_pre_arrival_initial` total 10 reads (not 9).
- Confirmed owner dashboard pages are async server components — `useBudgetWatcher` cannot be placed there directly; owner KPI instrumentation deferred.
- Identified `occupantIndex` and `guestsDetails` (direct booking sub-path) as additional missing entries in `maxReadsByPath`.

### Confidence Adjustments

- Implementation confidence reduced slightly (from initial ~90% to 88%) due to the settle-timing complexity for the two-phase loading in `useOccupantDataSources`.
- Approach confidence is 85% (not 90%) pending confirmation of the `onValue` wrapper change not causing unexpected side effects (e.g. double-counting if a listener fires multiple times).

### Remaining Assumptions

- The guarded portal layout (`apps/prime/src/app/(guarded)/`) is the correct mount point for `<DevTools />`. This was not verified by reading that layout file.
- Owner KPI hooks are separate from `useOccupantDataSources` and use distinct Firebase paths. Not spot-checked in depth; assumed based on the flow ID naming and the owner page file's comment mentioning `owner_kpi_dashboard_7day`.
- The `recentQueries` ring buffer of 50 entries is sufficient for a single portal screen load (9-10 reads maximum per the baseline).

## Scope Signal

- Signal: right-sized
- Rationale: The primary scope — `onValue` wrapper fix, matcher recalibration, baseline recalibration, `useBudgetWatcher` hook — is tightly bounded and additive. The `FirebaseMetricsPanel` adapter fix is a related 1-2 hour task included as optional scope. Budget warnings (`console.warn`) are visible without the visual panel or DevTools being mounted. The core outcome (dev-mode read budget warnings) is achievable with 5-7 discrete tasks of clear scope.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan prime-firebase-budget-runtime-tracking --auto`
