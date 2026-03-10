---
Type: Reference
Status: Active
Created: 2026-03-09
Last-updated: 2026-03-10
Relates-to: docs/plans/startup-loop-centralized-math-foundations/plan.md
Replan-round: 7
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

## Round 4 Trigger
After `TASK-16` completed, Wave 4 remained blocked because `TASK-07`, `TASK-08`, and `TASK-09` were still carrying stale pre-evaluation confidence levels (`75%`) even though the core utility, constraint, graph-helper, and cohort-assembly seams now exist in code.

## Round 4 Evidence Reviewed
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - utility computation is now explicit
  - `ConstraintProfile` defaults are now real code, not only artifact text
  - structural snapshots already carry `constraint_refs`
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`
  - queue ordering already consumes `score.utility.net_utility`, proving the optimizer seam is not hypothetical
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - `portfolio_selection` is already a valid `PolicyDecisionType`
- `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`
- `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`
  - current candidate-set shape is concrete enough to derive a first objective/constraint example for the optimizer task
- `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`
- `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`
  - trigger observations, candidate IDs, executor paths, and structural refs are now concrete graph-slice inputs
- `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
  - `TASK-16` created a concrete policy-evaluation seam with explicit `observed`, `pending`, `missing`, and `censored` states
- `packages/lib/src/math/optimization/index.ts`
- `packages/lib/src/math/graph/index.ts`
- `packages/lib/src/math/survival/index.ts`
  - repo-owned helper APIs and tests already exist for the three Wave 4 math layers

## Round 4 Assessment
The earlier reason these Wave 4 tasks sat below threshold was not that the math packages were missing. It was that the startup-loop side lacked concrete first use-shapes. That ambiguity is now materially smaller:
- `TASK-07` no longer needs to invent utility or constraints; it needs to convert the existing candidate set plus active constraint profile into explicit portfolio selection and journaling
- `TASK-08` no longer needs to invent a dependency ontology from whole cloth; the first graph slice is now bounded to `trigger_observation -> candidate -> executor_path` plus shared `constraint_refs`
- `TASK-09` no longer needs to invent cohort assembly; `policy-evaluation.v1` already expresses terminal vs censored states needed for a first Kaplan-Meier closure-risk layer

What remains is implementation detail and first-slice discipline, not missing architectural authority.

## Round 4 Task Deltas Applied
- `TASK-07` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `85%`
  - Impact: `90%`
- `TASK-08` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `80%`
  - Impact: `80%`
- `TASK-09` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `80%`
  - Impact: `80%`

## Round 4 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 4 Readiness Decision
Ready.

`TASK-07`, `TASK-08`, and `TASK-09` now all meet the `IMPLEMENT` confidence floor and form the next runnable wave.

## Round 5 Trigger
After Wave 4 completed, `TASK-10` and `TASK-11` remained below the `IMPLEMENT` confidence floor (`70%`) and therefore blocked the next build wave. `TASK-12` and `TASK-13` also remained below threshold, but they are downstream and only move honestly if the new exploration and promotion seams are now concrete enough.

## Round 5 Evidence Reviewed
- `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`
  - Wave 4 now emits an explicit feasible candidate set, adjusted utility, and replay-ready `portfolio_selection` decision records
- `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`
  - evaluation now carries `decision_mode`, `action_probability`, and `decision_created_at`, so stochastic choices and later regret analysis already have a storage seam
- `packages/lib/src/math/experimentation/thompson-sampling.ts`
  - deterministic Thompson-sampling primitives already exist in-repo; the gap is policy wiring, not math foundation
- `packages/lib/src/math/random/index.ts`
  - seeded reproducible randomness already exists for replay-safe stochastic ranking
- `scripts/src/startup-loop/self-evolving/self-evolving-experiment.ts`
  - a concrete experiment decision seam already exists for target KPI, guardrails, minimum sample size, runtime, and data-quality checks
- `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`
  - canary hold/promote/revert logic already exists as a promotion-side gate seam
- `scripts/src/startup-loop/self-evolving/self-evolving-containers.ts`
  - container contracts already distinguish `experiment_hook_contract` and explicitly mark experiment-aware paths such as `experiment-cycle-v1` and `website-v3`
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
- `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - graph and survival are now explicit reporting/policy inputs, which narrows the negative boundary for causal gating: they are structural/risk context, not promotion proof
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - `decision_mode`, `action_probability`, `promotion_gate`, and `override_record` are already contract-level concepts, but `override_record` still has no live writer

## Round 5 Assessment
The main ambiguity that kept `TASK-10` and `TASK-11` below threshold is materially smaller now:
- `TASK-10` no longer needs to invent an action set, logging seam, or randomness substrate
  - the first slice is now bounded to reranking the already-feasible portfolio candidate set
  - the required stochastic trace fields already exist in policy decisions and evaluation datasets
  - the repo already has in-house Thompson sampling and seeded randomness
- `TASK-11` no longer needs to invent a first promotion-quality seam from scratch
  - the first slice can be restricted to candidates with declared `experiment_hook_contract`
  - the repo already has experiment decision logic and canary release controls
  - Wave 4 made it explicit that graph and survival signals are policy inputs but not causal proof, which is exactly the negative boundary this task needs

What did **not** move enough:
- `TASK-12` still lacks real upstream exploration behavior and real promotion-gate output in code, so a shared governance layer would still be partly speculative
- `TASK-13` still lacks live exploration decisions, override records, and promotion-gate outcomes, so calibration/regret/override telemetry remains under-specified despite the stronger Wave 4 journal surface

## Round 5 Task Deltas Applied
- `TASK-10` confidence raised from `70%` to `80%`
  - Implementation: `80%`
  - Approach: `80%`
  - Impact: `80%`
- `TASK-11` confidence raised from `70%` to `80%`
  - Implementation: `80%`
  - Approach: `85%`
  - Impact: `85%`
- `TASK-12` confidence remains `75%`
  - no new evidence yet for the missing shared governance seam
- `TASK-13` confidence remains `75%`
  - no new evidence yet for live override/regret/calibration inputs

## Round 5 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 5 Readiness Decision
Ready.

`TASK-10` and `TASK-11` now both meet the `IMPLEMENT` confidence floor and form the next runnable wave. `TASK-12` and `TASK-13` remain below threshold, but they are not the next execution gate because they are still blocked on unfinished upstream work.

## Round 6 Trigger
After Wave 5 completed, the next correct step was `/lp-do-replan` for `TASK-12` and `TASK-13`. The plan was also carrying stale top-level status for `TASK-10` and `TASK-11`, so the Wave 6 replan needed to both reassess readiness and repair the planning surface.

## Round 6 Evidence Reviewed
- `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`
  - live `exploration_rank` decisions now exist with seeded stochastic traces, `decision_mode`, `action_probability`, and applied/advisory policy modes
- `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`
  - live `promotion_gate` decisions now exist with explicit reason codes, causal eligibility, and fail-closed hold behavior
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
- `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - reporting now exposes exploration decision counts, promotion-gate counts, policy-version counts, hold-window state, replay readiness, and maturity debt
- `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`
  - evaluation records now carry the stochastic and policy-version fields later telemetry will consume
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - `hold_window_days`, `last_override_id`, `instability_penalty`, and `override_record` are contract-level concepts, but `override_record` still has no live writer
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
- `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`
  - utility and selected-set adjustment seams already expose the candidate-set churn and guardrail surfaces `TASK-12` must govern

## Round 6 Assessment
The main reason `TASK-12` sat below the `IMPLEMENT` floor was that the shared governance layer was still partly hypothetical. That is no longer true:
- exploration is now a live policy layer, so hysteresis and hold-window logic have a real stochastic seam to stabilize
- promotion gating is now a live policy layer, so anti-gaming and guardrail logic have a real promotion seam to constrain
- the first governance slice is bounded to concrete work:
  - hold-window and hysteresis behavior over repeated portfolio and exploration decisions
  - bounded candidate-set churn and route delta limits
  - counter-metric enforcement on utility-driven actions
  - first-class `override_record` writes so later telemetry can attribute human stabilization versus policy behavior

What did **not** move enough:
- `TASK-13` still cannot be promoted honestly because the runtime does not yet emit override records or governance outputs, and it still lacks implemented calibration/regret metrics
- the telemetry inputs are stronger than before, but the truth-serum layer still depends on `TASK-12` making stabilization and override events real

## Round 6 Task Deltas Applied
- `TASK-12` confidence raised from `75%` to `80%`
  - Implementation: `80%`
  - Approach: `85%`
  - Impact: `90%`
- `TASK-13` confidence remains `75%`
  - live exploration and promotion traces now exist, but override and governance telemetry still do not
- Plan maintenance:
  - marked `TASK-10` and `TASK-11` complete in the top-level active-task checklist
  - updated the Task Summary table so Wave 5 completion state is no longer stale

## Round 6 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 6 Readiness Decision
Partially ready.

`TASK-12` now meets the `IMPLEMENT` confidence floor and is the next runnable build task. `TASK-13` remains below threshold and blocked on `TASK-12`, so the next correct step is `/lp-do-build` for `TASK-12` only.

## Round 7 Trigger
After the failed `TASK-14` checkpoint added `TASK-17` and `TASK-18`, the remaining four tasks needed a real readiness pass. The plan already knew the two high-level failures. The replan job here was to make the last wave executable against the code that actually exists, not the code we had implicitly assumed existed.

## Round 7 Evidence Reviewed
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - default policy authority still initializes to `shadow`
- `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
  - pending queue consumption still filters on `portfolio_selected`, which lets mathematical policy suppress dispatch emission before guarded-trial clearance
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
  - promotion-gate decisions are already computed and attached to ranked candidates, so the authority ladder must hold at more than one seam even though no live actuator consumes those decisions yet
- `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
  - policy-state and policy-decision artifact paths are real runtime paths, not only plan artifacts
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
  - current report surface still fails closed to missing-file warnings and `insufficient_data` when policy artifacts are absent
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
  - a bounded CLI entrypoint already exists that can run the live orchestrator over existing trial queue dispatches plus startup state and therefore can produce policy artifacts without inventing a new runtime path
- `docs/business-os/startup-loop/self-evolving/BRIK/`
- `docs/business-os/startup-loop/self-evolving/SIMC/`
  - neither business currently has `policy-state.json` or `policy-decisions.jsonl` on disk

## Round 7 Assessment
The remaining work no longer has a conceptual-architecture problem. It has a last-mile proof problem.

- `TASK-17` is genuinely runnable now.
  - The authority leak is concrete.
  - The affected seams are bounded.
  - The next build task does not need more discovery; it needs code changes and integration tests.
- `TASK-18` is also real, but its first slice had been described too vaguely.
  - The repo does not have a dedicated raw-observation replay CLI for checkpoint evidence generation.
  - That does **not** require a new precursor task because there is already a bounded live path: `self-evolving-from-ideas.ts` over current trial queue dispatches plus startup state.
  - The task therefore needs a tighter contract: use one documented runtime path, persist the resulting policy artifacts, and store the report snapshot the checkpoints will cite.
- `TASK-14` and `TASK-15` remain straightforward checkpoint tasks, but their detailed sections were stale.
  - `TASK-14` still referenced the old dependency set in its detailed task block even though the plan summary had already learned that `TASK-17` and `TASK-18` are mandatory precursors.
  - `TASK-15` still needed an explicit evidence requirement around real authority progression, not just successful prior prose.

What did **not** warrant another topology expansion:
- no new precursor task is needed between `TASK-17` and `TASK-18`
- no `/lp-do-sequence` run is needed
- no confidence raise is honest for the two checkpoints because their job is still just to verify evidence after the implementation tasks land

## Round 7 Task Delta Applied
- `TASK-17` confidence remains `85%`
  - evidence is strong enough that the task stays the next runnable build
- `TASK-18` confidence remains `80%`
  - the task is now bounded around a real runner, but still depends on `TASK-17` making shadow mode non-actuating before evidence generation is trustworthy
- `TASK-14` detailed dependency and acceptance text updated to require both authority-proof and real evidence-pack outputs
- `TASK-15` acceptance text updated to require real authority-progression evidence rather than only inherited checkpoint prose

## Round 7 Sequencing Impact
- No topology change.
- Stable task IDs preserved.
- No `/lp-do-sequence` run required.

## Round 7 Readiness Decision
Partially ready.

`TASK-17` remains the next runnable build task. `TASK-18` is now tightly defined and should follow immediately after `TASK-17`. `TASK-14` and `TASK-15` remain blocked checkpoint tasks with corrected evidence requirements.
