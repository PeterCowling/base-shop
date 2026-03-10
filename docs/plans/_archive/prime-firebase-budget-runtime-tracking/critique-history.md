# Critique History — prime-firebase-budget-runtime-tracking

## Plan Critique: 3 rounds complete. Final score 8/10 → lp_score 4.0. Credible. Auto-build eligible.
## Fact-find critique rounds below (Rounds 1–3). Plan critique rounds above.

---

## Plan Critique Round 1

- Route: codemoot
- Score: 6/10 → lp_score 3.0
- Verdict: needs_revision
- Findings:
  - Critical (1): TASK-02 acceptance stated `arrival_mode_initial.maxReads` = 11 but planning validation notes concluded 10 (checkInCode is HTTP, not Firebase)
  - Warning (1): TASK-03 bundle strategy incorrect — runtime `NODE_ENV` guard does not prevent static `budgetGate.ts` import from bundling; needs dynamic import inside the hook's effect
  - Warning (1): TASK-04 only wired `portal_pre_arrival_initial`; `GuardedHomeExperience` also serves arrival-day flow via `arrivalState === 'arrival-day'`; both flows must be wired
  - Info (1): TASK-06 planning validation referenced "lines 1-366" stale line count
- Actions taken: Fixed `arrival_mode_initial.maxReads` to 10; updated TASK-03 execution plan to use dynamic import for `budgetGate.ts`; expanded TASK-04 to conditionally wire both flow IDs based on `arrivalState`; removed stale line reference from TASK-06 planning validation

## Plan Critique Round 2

- Route: codemoot
- Score: 7/10 → lp_score 3.5
- Verdict: needs_revision
- Findings:
  - Critical (1): TASK-03 hook signature used `Pick<FirebaseMetrics, 'getMetrics'>` but `FirebaseMetrics` class is not exported from `firebase.ts` — only `firebaseMetrics` instance is exported; must use `typeof firebaseMetrics`
  - Warning (1): TASK-04 checked-in state fallback to `portal_pre_arrival_initial` would produce misleading warnings for an unbudgeted flow; must suppress evaluation when `arrivalState === 'checked-in'`
  - Warning (1): TASK-01 edge case understated — multiple `onValue` deliveries before settle can inflate `queryCount`; documented as known false-positive risk but not acknowledged in plan
  - Warning (1): Decision Log stale — still said `arrival_mode_initial` wiring deferred, contradicting updated TASK-04
- Actions taken: Fixed hook signature to `typeof firebaseMetrics`; added `budgetIsSettled = arrivalState !== 'checked-in' && isInitialSyncComplete` guard in TASK-04; documented multi-delivery false-positive risk in TASK-01 edge cases; updated Decision Log to reflect arrival_mode_initial promoted to in-scope

## Plan Critique Round 3 (Final)

- Route: codemoot
- Score: 8/10 → lp_score 4.0
- Verdict: needs_revision (advisory only — final round, no Critical findings; score meets credible threshold)
- Findings:
  - Warning (3): (a) `typeof firebaseMetrics` too broad — should be `Pick<typeof firebaseMetrics, 'getMetrics'>` for testability; (b) TASK-02 didn't enumerate `arrival_mode_initial` path keys; (c) Delivery Rehearsal still listed `arrival_mode_initial` wiring as adjacent/deferred
  - Info (1): TASK-01 confidence note said "no risk of double-counting" contradicting updated edge case section
- Actions taken: Narrowed metricsSource type to `Pick<typeof firebaseMetrics, 'getMetrics'>`; added `arrival_mode_initial.maxReadsByPath` enumeration to TASK-02 acceptance; updated Delivery Rehearsal to reflect promoted in-scope status; updated TASK-01 confidence note to align with documented false-positive risk
- Recoverability: All findings recoverable. No structural blocker.
- Post-round-3 status: Credible. lp_score 4.0 meets threshold (≥4.0). Plan gates pass. Auto-build eligible.

---

## Fact-find critique (Rounds 1–3, completed before planning)

### Final Verdict: Round 3 complete. Score 5/10 → lp_score 2.5. All findings are recoverable (arithmetic, scope completeness, server component constraint). Corrections applied to artifact. Status: Ready-for-planning.


## Round 1

- Route: codemoot
- Score: 6/10 → lp_score 3.0
- Verdict: needs_revision
- Findings:
  - Critical (1): Brief overstated runtime-enforcement readiness — `onValue()` wrapper does not call `recordQuery()` on snapshot delivery; `completedTasks` path never enters `recentQueries`
  - Major (2): Scope contradicts itself on baseline changes (Non-goals vs expansion suggestions); `FirebaseMetricsPanel` adapter fix understated as "1-line"
  - Minor (1): DevTools mount stated as prerequisite for warnings but console.warn works without it
- Actions taken: Corrected summary to distinguish `get()` vs `onValue()` tracking; fixed Non-goals section; corrected panel fix scope to "1-2 hour task"; updated Risks table; updated task seeds

## Round 2


- Route: codemoot
- Score: 6/10 → lp_score 3.0
- Verdict: needs_revision
- Findings:
  - Critical (1): Baseline matcher/path misalignment — `preordersData` does not match `preorder/...`, `cityTaxData` does not match `cityTax/...`; two path budgets unenforced even after onValue fix
  - Major (3): Baseline recalibration framed as open question in Questions section but stated as required in Non-goals (inconsistency); acceptance package required panel/DevTools which body said were optional; Scope Signal stale (still said "1-3 line changes")
- Actions taken: Added Gap 2 (matcher misalignment) to Summary; moved maxReads recalibration from Open Questions to Resolved; corrected acceptance package; updated Scope Signal to right-sized; added matcher fixes to task seeds; updated Rehearsal Trace

## Round 3 (Final)

- Route: codemoot
- Score: 5/10 → lp_score 2.5
- Verdict: needs_revision
- Findings:
  - Critical (1): Recalibration target wrong — after onValue fix, completedTasks adds 1 snapshot read; portal total = 10 reads (2+1+7), not 9; maxReads must be recalibrated to 10
  - Major (2): Owner dashboard pages are async server components — useBudgetWatcher cannot be added there directly; `occupantIndex`/`guestsDetails` paths missing from task seeds/acceptance package
  - Minor (1): Confidence section referenced "two open questions" but only one remained
- Actions taken: Corrected recalibration target to 10; documented owner server component constraint and deferred owner KPI instrumentation; added occupantIndex/guestsDetails to task seed 2; fixed confidence section; updated Rehearsal Trace; updated Risks table
- Recoverability: All findings are recoverable (arithmetic error, scope completeness, server component architectural constraint with clear workaround). No structural blocker to the feature.
- Post-round-3 status: Ready-for-planning (all critical findings addressed in artifact; remaining open question is warn-vs-throw, answered by default assumption of console.warn)
