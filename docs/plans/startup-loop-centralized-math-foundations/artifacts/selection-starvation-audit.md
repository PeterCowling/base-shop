# Selection Starvation Audit

## Scope
- Date: 2026-03-10
- Goal: satisfy TASK-22 by determining whether the current zero-selection outcome is a correct consequence of current live data and policy, or an over-conservative model defect, and define the first non-shortcut path to a real selected cohort.
- Evidence sources:
  - `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`
  - `docs/business-os/startup-loop/self-evolving/BRIK/policy-decisions.jsonl`
  - `docs/business-os/startup-loop/self-evolving/BRIK/policy-state.json`
  - `docs/plans/startup-loop-centralized-math-foundations/artifacts/guarded-trial-cohort-audit.md`
  - `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`
  - `packages/lib/src/math/optimization/index.ts`

## Current Live Outcome
- Current live self-evolving business cohort: `BRIK` only.
- Current live candidates: 4.
- Current portfolio result: empty set.
- Current exploration result: zero arms, zero exploration decisions.

This is not a missing-write bug anymore. It is the actual output of the current live policy.

## Where Starvation Happens

### 1. Candidates are already negative before portfolio selection
- `candidates.json` shows every current candidate with:
  - `utility.expected_reward: 1.4453`
  - `utility.downside_penalty: 1.1567`
  - `utility.effort_penalty: 1.46`
  - `utility.net_utility: -1.1714`
- This means the current real-data candidates are deferral candidates before any portfolio graph or survival penalty is applied.

### 2. Portfolio selection makes them more negative, then correctly picks none
- `self-evolving-portfolio.ts` sends candidate adjusted utility into `solveBinaryPortfolio(...)`.
- `packages/lib/src/math/optimization/index.ts` builds a maximize model and permits the empty set.
- `policy-decisions.jsonl` portfolio decisions show:
  - `selected_candidate_ids: []`
  - `objective_value: 0`
  - `chosen_action: "deferred"`
  - `signal_snapshot.adjusted_utility` between `-1.7158` and `-1.7939`

Under those inputs, the empty portfolio is the mathematically correct optimum.

### 3. Exploration starvation is a downstream consequence, not a separate bug
- `self-evolving-exploration.ts` builds exploration arms only from portfolio decisions with `chosen_action === "selected"`.
- Because the portfolio has no selected candidates, exploration correctly has no arms to rank.

## Data Scarcity Vs Policy Conservatism

### Data scarcity is real
- The current live `BRIK` cohort is structural-only:
  - `classification: "structural_only"`
  - no verified positive outcomes
  - no measured KPI baselines or minimum sample sizes
- `policy-state.json` still shows cold-start beliefs with zero successes/failures recorded for the current candidates.
- `guarded-trial-cohort-audit.md` already proved there is no second real-data business cohort on disk to provide a richer test set.

### Conservatism is also real, but it is currently coherent
- The scoring model is deliberately conservative under sparse evidence:
  - `expected_reward` is bounded by posterior impact mean times a scaled reward surface.
  - `downside_penalty` uses the credible upper bound of guardrail breach, not the mean.
  - `effort_penalty` has an immediate fixed base of `1.1` for `estimated_effort: "M"` before any portfolio penalty.
  - portfolio selection adds structural and survival penalties on top.
- That design is consistent with trial-mode policy under uncertainty. It is not obviously a bug just because it selects nothing today.

## What Would Be Unsound
- Adding a minimum-selection constraint just to force one candidate through.
- Adding a blanket positive constant to utility so negative candidates become selectable.
- Disabling structural or survival penalties in live policy simply to make the branch fire.
- Letting exploration rank deferred candidates that the portfolio layer has already rejected.

Each of those would create branch exercise at the cost of mathematical integrity.

## First Sound Path To A Real Selected Cohort

### Path A: real outcome maturation first
- Let the current shadow cohort age past its first real `maturity_due_at`.
- Use real observed or missing outcomes to update:
  - success/impact posteriors
  - survival penalties
  - replay/calibration evidence
- This is necessary because current beliefs are still almost entirely cold-start priors.

### Path B: richer real candidates, not weaker rules
- The first real selected cohort should come from live candidates whose utility can genuinely clear zero after penalties.
- In practice that means at least one of:
  - lower-effort candidates
  - higher-impact candidates
  - candidates with verified positive outcomes already recorded
  - a second live business/cohort with instrumented or measured evidence

### Path C: replay-first model revision only if starvation persists after A and B
- If matured real cohorts still show universal starvation across richer live inputs, then revise the policy model through replay and counterfactual analysis.
- That is the right point to question:
  - effort penalty scale
  - reward surface scale
  - guardrail prior shape
  - structural or survival penalty weight
- That revision should happen only with replay evidence, not to satisfy branch coverage.

## Conclusion
- Current zero-selection is not yet evidence of a broken optimizer.
- It is the coherent result of:
  - sparse structural-only live candidates,
  - cold-start beliefs,
  - conservative downside and effort penalties,
  - and an optimizer that is allowed to choose the empty set.
- The first mathematically sound path to a real selected cohort is therefore:
  1. mature the live shadow cohort and absorb real outcomes,
  2. obtain a richer live candidate set, and only then
  3. revisit the model if starvation still persists.

## Immediate Planning Implication
- No live policy relaxation is justified yet.
- The next blocker is temporal and evidential, not implementation correctness:
  - rerun after the first live maturity window closes
  - keep guarded-trial readiness blocked until a real selected cohort exists or the replay evidence proves a principled model revision is required
