---
Type: Reference
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-09
Relates-to: docs/plans/startup-loop-centralized-math-foundations/plan.md
Replan-round: 3
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

## Round 2 Trigger
After `TASK-02` completed, Wave 2 was structurally unblocked but still not executable because `TASK-05` and `TASK-06` were left at stale pre-contract confidence levels (`75%` each).

## Round 2 Evidence Reviewed
- `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`
  - now freezes the belief-state, utility, and policy-decision journal shapes that `TASK-05` must implement
- `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`
  - now freezes the join keys, maturity semantics, and lifecycle write rules that `TASK-06` must implement
- `packages/lib/src/math/graph/index.ts`
- `packages/lib/src/math/optimization/index.ts`
- `packages/lib/src/math/survival/index.ts`
  - `TASK-02` now provides repo-owned helper semantics rather than raw package passthroughs, removing the math-surface ambiguity those implementation tasks depended on

## Round 2 Assessment
The work that kept `TASK-05` and `TASK-06` below threshold was primarily contract and helper-surface uncertainty. That uncertainty is now substantially lower:
- `TASK-05` no longer needs to invent belief-state shapes, utility terms, decision-trace fields, or optimizer-facing semantics
- `TASK-06` no longer needs to invent completion joins, maturity handling, verified measurement gates, or lifecycle payload shapes

What remains is execution complexity, not missing design authority.

## Round 2 Task Deltas Applied
- `TASK-05` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `85%`
  - Impact: `90%`
- `TASK-06` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `90%`
  - Impact: `95%`

## Round 2 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 2 Readiness Decision
Ready.

`TASK-05` and `TASK-06` now both meet the `IMPLEMENT` confidence floor and form the next runnable wave.

## Round 3 Trigger
After `TASK-05` and `TASK-06` completed, Wave 3 remained blocked because `TASK-16` was still carrying a stale pre-implementation confidence level (`70%`) even though much of the originally missing runtime substrate now exists.

## Round 3 Evidence Reviewed
- `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
  - `policy-decisions.jsonl` is now a real persisted journal, not a planned artifact
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - `PolicyDecisionRecord`, `decision_context_id`, `action_probability`, and maturity-aware outcome fields are now versioned contracts in code
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
  - deterministic candidate-route decisions now emit `policy_context` and persist policy decisions during orchestration
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
  - completion now stamps explicit self-evolving maturity and measurement state and emits lifecycle closure records
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
  - reporting still summarizes state, but it does not yet join policy decisions, outcomes, and maturity slices into replay-ready evaluation datasets
- `scripts/src/startup-loop/self-evolving/self-evolving-replay.ts`
  - replay already exists as a repo concept, which narrows `TASK-16` to policy-decision/outcome replay rather than inventing replay semantics from scratch
- `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`
  - focused tests already prove the upstream journal and maturity seams now exist

## Round 3 Assessment
The original reason `TASK-16` sat below the `IMPLEMENT` floor was that journaling, maturity tagging, and replay semantics were still mostly conceptual. That is no longer true:
- policy decisions are already persisted with stable `decision_id`, `decision_context_id`, action sets, chosen action, and utility provenance
- completion already records `candidate_id`, `decision_id`, `maturity_status`, and `measurement_status`
- lifecycle outcome events already distinguish recorded vs missing outcomes
- a replay harness already exists elsewhere in the self-evolving package

What remains uncertain is narrower and implementation-shaped:
- assembling a reusable joined evaluation slice from existing decision, event, and completion data
- exposing matured vs pending vs missing outcomes in report/dashboard code
- keeping the joined dataset stable enough for later calibration, regret, and checkpoint tasks

That is a bounded implementation task, not a hidden design task.

## Round 3 Task Delta Applied
- `TASK-16` confidence raised from `70%` to `80%`
  - Implementation: `80%`
  - Approach: `90%`
  - Impact: `90%`
- `TASK-16` planning validation now cites the live journal, closure, replay, and focused test seams rather than only the pre-wave reporting gap.

## Round 3 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 3 Readiness Decision
Ready.

`TASK-16` now meets the `IMPLEMENT` confidence floor and is the next runnable build task.
