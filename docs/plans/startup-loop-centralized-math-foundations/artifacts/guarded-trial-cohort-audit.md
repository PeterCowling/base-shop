# Guarded-Trial Cohort Audit

## Scope
- Date: 2026-03-10
- Goal: satisfy TASK-20 by finding one real repo cohort that exercises `portfolio_selected > 0` or exploration activity, or prove that no current real-data cohort can do so under the present code and policy.
- Evidence sources:
  - `docs/business-os/startup-loop/self-evolving/**`
  - `docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-result.json`
  - `docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-report.json`
  - `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`
  - `packages/lib/src/math/optimization/index.ts`

## Inventory
- Self-evolving business roots on disk: `BRIK` only.
- Live policy artifacts found:
  - `docs/business-os/startup-loop/self-evolving/BRIK/policy-state.json`
  - `docs/business-os/startup-loop/self-evolving/BRIK/policy-decisions.jsonl`
  - `docs/business-os/startup-loop/self-evolving/BRIK/shadow-handoffs.jsonl`

No other business currently has a live self-evolving policy cohort on disk, so there is no second real-data business to test.

## Bounded Real-Data Cohort
- Cohort: `BRIK` shadow run from the current live ideas queue and startup state.
- Runtime evidence:
  - `BRIK-shadow-run-result.json` reports `shadow_handoffs_written: 4`, `followup_dispatches_emitted: 0`, `warnings: []`.
  - `BRIK-shadow-run-report.json` reports `decision_records: 24`, `shadow_handoff_count: 4`, `pending_decisions: 4`, `replay_ready_decisions: 0`, `exploration_decisions: 0`.

## Findings

### 1. No real-data cohort currently exercises portfolio selection
- Every current `BRIK` route decision is already negative utility before portfolio optimization:
  - `policy-decisions.jsonl` route decisions show `utility.net_utility: -1.1714`.
- Portfolio selection makes those same candidates more negative after structural and survival penalties:
  - `policy-decisions.jsonl` portfolio decisions show `adjusted_utility` between `-1.7158` and `-1.7939`.
- The optimizer maximizes total utility and does not impose a minimum-selected constraint:
  - `self-evolving-portfolio.ts` passes per-candidate utility into `solveBinaryPortfolio(...)`.
  - `packages/lib/src/math/optimization/index.ts` builds a maximize model over candidate utilities.
- Therefore the empty set is the optimal solution for the current real-data cohort:
  - every portfolio decision has `chosen_action: "deferred"`
  - every portfolio decision records `selected_candidate_ids: []`
  - every portfolio decision records `objective_value: 0`

This is not missing telemetry. It is the mathematically correct result for the current live `BRIK` candidate set under the current utility model and constraints.

### 2. No real-data cohort currently exercises exploration
- Exploration arms are created only from portfolio decisions whose `chosen_action === "selected"` in `self-evolving-exploration.ts`.
- Because the current real-data portfolio selects nothing, exploration receives zero arms and returns zero decisions.
- The live report confirms the branch is unexercised:
  - `BRIK-shadow-run-report.json` reports `exploration_decisions: 0`
  - `BRIK-shadow-run-report.json` reports `exploration_regret_status: "insufficient_data"`

### 3. No bounded subset of the current real-data cohort can change that outcome
- The only current self-evolving business cohort is `BRIK`.
- All four current candidates in that cohort have negative route utility and negative portfolio-adjusted utility.
- Any subset of all-negative options still has non-positive total utility.
- Because the optimizer is allowed to choose the empty set, no subset of the current live `BRIK` candidate set can produce `selected_candidate_ids` without either:
  - different live inputs that create a positive-utility candidate, or
  - a code/policy change that alters the utility model or adds a minimum-selection rule.

## Conclusion
- Result: explicit proof of absence.
- Under present code and present real repo data, there is no real-data cohort that exercises:
  - `portfolio_selected > 0`, or
  - any exploration decision path.
- The current mathematical loop can prove only the shadow/advisory behavior for:
  - route decisions
  - portfolio deferral
  - shadow handoff replay accounting
  - promotion hold behavior

## Implication For TASK-14
- Guarded-trial readiness still cannot pass on branch exercise grounds.
- The blocker is no longer “missing artifacts.”
- The blocker is now: current live inputs never produce a selected portfolio candidate, so guarded-trial and exploration behavior remain unproven on real data.
