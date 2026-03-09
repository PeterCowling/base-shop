---
Type: Reference
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Relates-to: docs/plans/startup-loop-centralized-math-foundations/plan.md
Replan-round: 1
---

# Replan Notes: TASK-02 Readiness (2026-03-09)

## Trigger
`TASK-02` remained below the `IMPLEMENT` confidence threshold after Wave 1 build work completed. `/lp-do-build` therefore required a replan step before the next execution cycle.

## Evidence Reviewed
- `packages/lib/src/math/graph/index.ts`
  - current module is still a broad Graphology passthrough
- `packages/lib/src/math/optimization/index.ts`
  - current module is still a broad YALPS passthrough
- `packages/lib/src/math/survival/index.ts`
  - current module is still a narrow but package-shaped Kaplan-Meier passthrough
- `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`
  - now defines the exact policy-side contract shapes the optimizer must support:
    - `ConstraintProfile`
    - `UtilityBreakdown`
    - `CandidateBeliefState`
    - replay-safe deterministic and stochastic trace requirements
- `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`
  - now defines the exact survival-side and closure-side semantics the helpers must support:
    - maturity windows
    - pending vs matured outcomes
    - censored or missing measurements
    - verified vs degraded measurement handling

## Assessment
The main reason `TASK-02` was sitting at `75%` was helper-design ambiguity. That ambiguity is materially smaller now:
- optimization helper inputs are no longer vague score-sort replacements; they are explicitly shaped by `ConstraintProfile` and guarded utility semantics
- survival helper behavior is no longer vague time-series math; it is explicitly about censored, maturity-aware outcome windows
- graph helper scope is now bounded to dependency and bottleneck structure, not causal inference

What remains uncertain is implementation detail, not task definition.

## Task Delta Applied
- `TASK-02` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `80%`
  - Impact: `80%`
- `TASK-02` planning validation now explicitly cites the two new contract artifacts as evidence that helper semantics are defined tightly enough to build against.

## Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Readiness Decision
Ready.

`TASK-02` now meets the `IMPLEMENT` confidence floor and is the next runnable build task.
