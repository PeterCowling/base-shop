---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-centralized-math-foundations
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Dispatch-ID: IDEA-DISPATCH-20260309211000-9320
Trigger-Why: The startup loop is asking for mathematically stronger decision-making, but the repo needs more than an inventory. It needs a code-true account of what changed, what still does not affect live decisions, and what work is required before this thread can count toward self-improving status.
Trigger-Intended-Outcome: "type: operational | statement: The repo has a code-backed inventory of centralized math capability, a hard assessment of the post-admission system, and a planning-ready set of requirements to turn centralized math foundations into live self-improving startup-loop behavior. | source: operator"
---

# Startup Loop Centralized Math Foundations Fact-Find Brief

## Scope
### Summary
The repo does have a centralized math layer in `@acme/lib/math`, and this thread did close three genuine foundation gaps by admitting centralized graph, constrained-optimization, and survival modules. But the resulting system is still not mathematically self-improving in any honest sense. The live startup-loop runtime still uses only `betaBinomialPosterior`, the newly admitted modules are mostly thin package passthroughs, the startup-loop still bypasses the package boundary by importing directly from `packages/lib/src`, and the new modules have no dedicated tests. More importantly, even a fully integrated graph/optimization/survival layer would still fall short of genuine mathematical self-improvement if the loop continues to rely on hand-tuned heuristics, lacks closed outcome feedback, has no exploration policy, treats dependency graphs as if they were causal models, and has no control-style damping or anti-gaming safeguards. This fact-find therefore needs to do more than inventory capability: it must describe the current post-admission system as it actually exists in code, identify the defects that still block self-improving status, and define the full target architecture and follow-on work needed to convert new math surface area into a genuine mathematical self-improving loop.

### Goals
- Inventory the centralized math capability that exists in code today.
- Distinguish between available central math, actually-used startup-loop math, and merely admitted-but-unused math.
- Record which missing math fundamentals now have repo-admitted open-source solutions, and where those admissions are still too thin to count as repo-owned capability.
- Record which remaining math fundamentals still need dedicated follow-on fact-finds because package quality is not yet good enough for direct admission.
- Define the code-level requirements for this thread to contribute to actual self-improving startup-loop behavior rather than just expanding library surface area.
- Define the full mathematical architecture required for genuine self-improvement: belief updating, constrained portfolio choice, dependency structure, time-to-event risk, exploration, causal evaluation, stability control, and reward guardrails.
- Keep the output planning-ready for startup-loop self-improvement work rather than as a generic library audit.

### Non-goals
- Pretending this fact-find itself makes the startup loop self-improving.
- Wiring the newly admitted math modules into live startup-loop routing or policy decisions inside this document.
- Claiming mathematical capability just because a package exists somewhere in the ecosystem.
- Adding service-coupled or weakly-typed external math dependencies to make the gap matrix look complete.
- Replacing the existing local experimentation or forecasting primitives that are already adequate as foundations.

### Constraints & Assumptions
- Constraints:
  - Code is the sole source of truth for current in-repo capability and current startup-loop usage.
  - Open-source package admissions must be permissively licensed and fit the repo's Node/TypeScript stack.
  - Central math capability should enter through `@acme/lib/math`, not through scattered app-local imports.
  - External package adoption must not quietly invalidate repo documentation contracts.
- Assumptions:
  - A central wrapper is better than direct third-party imports across startup-loop code.
  - “Exists in the repo” and “is influencing startup-loop decisions” must be treated as different facts.
  - For thin ecosystem areas, a held evaluation is better than a bad dependency.

## Outcome Contract
- **Why:** The startup loop is asking for mathematically stronger decision-making, but the repo needs more than a capability inventory. It needs an honest account of what changed, what still does not influence live decisions, and what must be built before this math thread can count toward genuine self-improving status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed inventory of centralized math capability, a hard assessment of the post-admission system, and a planning-ready target architecture for a genuine mathematical self-improving startup loop with explicit required workstreams.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `packages/lib/src/math/index.ts` - centralized math export surface.
- `packages/lib/package.json` - central math dependency boundary.
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts` - live self-improving runtime use of centralized math.
- `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts` - live dashboard use of centralized math.
- `packages/lib/README.md` - public contract for central math scope.

### Key Modules / Files
- `packages/lib/src/math/experimentation/index.ts` - local Bayesian, hypothesis-testing, sample-size, sequential, and Thompson-sampling primitives.
- `packages/lib/src/math/forecasting/index.ts` - local EWMA, Holt-Winters, prediction intervals, and model-selection primitives.
- `packages/lib/src/math/similarity/index.ts` - local Jensen-Shannon, distance correlation, Hoeffding, Kendall, and mutual information primitives.
- `packages/lib/src/math/statistics/index.ts` - local descriptive and correlation primitives.
- `packages/lib/src/math/probabilistic/index.ts` - local Bloom filter, count-min sketch, HyperLogLog, and t-digest primitives.
- `packages/lib/src/math/graph/index.ts` - newly admitted graph-analysis wrapper backed by Graphology packages.
- `packages/lib/src/math/optimization/index.ts` - newly admitted constrained-optimization wrapper backed by YALPS.
- `packages/lib/src/math/survival/index.ts` - newly admitted survival-analysis wrapper backed by Kaplan-Meier estimation.

### Patterns & Conventions Observed
- The centralized math layer is broad, but live startup-loop use is extremely narrow.
  - Evidence: repo search for `@acme/lib/math` imports in `scripts/src/startup-loop` found only `betaBinomialPosterior` usage in `self-evolving-scoring.ts` and `self-evolving-dashboard.ts`.
- The startup-loop still bypasses the central package surface and imports math directly from source files.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
- The repo previously documented math modules as zero-dependency only, which became false once advanced external adapters were admitted.
  - Evidence: `packages/lib/README.md`
- Existing local math capability already covers several fundamentals the startup loop is not using yet.
  - Evidence: `packages/lib/src/math/experimentation/index.ts`, `packages/lib/src/math/forecasting/index.ts`, `packages/lib/src/math/similarity/index.ts`
- The newly admitted graph, optimization, and survival modules centralize imports, but do not yet expose repo-owned semantics beyond thin re-export wrappers.
  - Evidence: `packages/lib/src/math/graph/index.ts`, `packages/lib/src/math/optimization/index.ts`, `packages/lib/src/math/survival/index.ts`
- The new math admissions currently lack dedicated test coverage.
  - Evidence: repo test search under `packages/lib` found no graph, optimization, or survival tests.
- The missing central math areas do not all have equally credible Node/TypeScript packages.
  - Evidence: package research results summarized below.

### Data & Contracts
- Central math package surface:
  - `@acme/lib/math` exports all centralized math modules.
  - `@acme/lib/math/*` exports submodule entry points.
- Newly admitted external package wrappers:
  - Graph: `graphology@0.26.0`, `graphology-dag@0.4.1`, `graphology-shortest-path@2.1.0`, `graphology-metrics@2.4.0`
  - Optimization: `yalps@0.6.4`
  - Survival: `@fullstax/kaplan-meier-estimator@3.1.2`
- Evaluated but not admitted:
  - Contextual bandits: `simplebandit@0.1.7`, `@vowpalwabbit/vowpalwabbit@0.0.9`
  - Causal inference: `causal-inference.js@1.0.11`
  - Control: `advanced-pid-controller@1.0.1`

## Current Process Resulting From This Fact-Find
1. `lp-do-ideas` routed the operator request into a processed `dispatch.v2` fact-find entry in `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
2. The resulting fact-find established the centralized math capability inventory and recorded package admissions plus held categories in `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`.
3. The repo widened the centralized math surface by exporting graph, optimization, and survival modules from `packages/lib/src/math/index.ts`.
4. The admitted modules currently act as central package adapters, but they remain thin wrappers over Graphology, YALPS, and Kaplan-Meier package APIs.
5. The live startup-loop runtime still performs scoring and dashboard math almost entirely through the existing experimentation primitive `betaBinomialPosterior`.
6. The practical result is a better central math substrate, not yet a stronger self-improving decision loop.

## Target System Required For Genuine Mathematical Self-Improvement
The target system implied by this fact-find is not “more formulas in the queue sorter.” It is a partially observed, constrained, stochastic, sequential decision loop with explicit feedback.

### Core Objects
1. **State**
   - Current business, startup-loop, and candidate condition.
   - Includes active candidates, queue state, route mix, dependency graph, rollout state, and recent outcomes.
2. **Beliefs**
   - Posterior distributions over candidate value, downside risk, implementation success, time-to-effect, and evidence quality.
   - Must replace pure heuristic confidence theater.
3. **Actions**
   - Fact-find, plan, build, canary, promote, revert, defer, suppress, and measurement-gathering interventions.
4. **Constraints**
   - WIP caps, route caps, blast-radius budgets, evidence-quality floors, and operator/governance boundaries.
5. **Transitions**
   - How interventions change future state, route availability, and candidate maturity.
6. **Rewards / Utility**
   - Risk-adjusted expected value, not raw priority score or queue throughput.
7. **Observations**
   - Structural signals, measured KPI outcomes, verified lifecycle outcomes, dependency changes, and timing-to-event data.
8. **Policy**
   - Constrained decision rule over state and beliefs, with bounded exploration and stability controls.
9. **Calibration and audit**
   - Posterior calibration, policy regret, override analysis, and policy-version comparison so the loop can prove it is learning rather than just becoming more elaborate.

### Mathematical Layers Required
1. **Bayesian belief updater**
   - The current loop already has a primitive foothold through `betaBinomialPosterior`, but the target system requires posterior belief state for candidate value, risk, and success probability.
2. **Constrained optimization**
   - Replace pure score sorting with explicit portfolio selection under capacity, risk, and route constraints.
3. **Graph analysis**
   - Model dependency structure, bottlenecks, coupling, and failure propagation.
4. **Survival / time-to-event**
   - Estimate slip, close, churn, escalation, and aging risks.
5. **Exploration policy**
   - Bounded contextual exploration so the loop does not only reinforce current beliefs.
6. **Causal evaluation**
   - Distinguish intervention effects from correlation before promoting process changes as “improvements.”
7. **Control / stability layer**
   - Add hysteresis, hold windows, and bounded rollout deltas to prevent thrashing.
8. **Reward governance**
   - Anti-gaming and mission alignment so the loop cannot optimize a bad surrogate metric.
9. **Calibration / regret monitoring**
   - Track whether beliefs are calibrated and whether the policy is improving decisions over time.

## Central Capability Matrix
| Domain | Current centralized capability in code | Startup-loop live use observed | Gap assessment | Package solution status |
|---|---|---|---|---|
| Bayesian / experimentation | Present locally via `packages/lib/src/math/experimentation` | Narrow: self-evolving uses only `betaBinomialPosterior` | Integration gap, not foundation gap | No external package needed now |
| Forecasting | Present locally via `packages/lib/src/math/forecasting` | No live self-improving use observed | Integration gap, not foundation gap | No external package needed now |
| Information theory / similarity | Present locally via `packages/lib/src/math/similarity` incl. mutual information | No live self-improving use observed | Integration gap, not foundation gap | No external package needed now |
| Graph theory / dependency analysis | Missing before this fact-find | No centralized graph runtime in startup-loop | Foundation gap closed | Repo-admitted now via Graphology wrappers |
| Constrained optimization / OR | Missing before this fact-find | No centralized optimizer in startup-loop | Foundation gap closed | Repo-admitted now via YALPS wrapper |
| Survival / hazard modelling | Missing before this fact-find | No centralized time-to-event primitive in startup-loop | Foundation gap closed at Kaplan-Meier level | Repo-admitted now via Kaplan-Meier wrapper |
| Contextual bandits | Non-contextual Thompson sampling exists locally; no centralized contextual bandit | No live contextual bandit use observed | Foundation gap remains | Candidate packages found, not admitted |
| Causal inference | No centralized causal module | No live causal inference use observed | Foundation gap remains | Candidate package found, not admitted |
| Control theory | No centralized control module | No live control primitive beyond threshold logic | Foundation gap remains | Candidate package found, not admitted |
| Game theory / mechanism design | No centralized module | No live use observed | Foundation gap remains | No repo-worthy package selected |

## Package Evaluation
### Admitted Now
| Domain | Package | Reason admitted | Repo integration |
|---|---|---|---|
| Graph analysis | `graphology`, `graphology-dag`, `graphology-shortest-path`, `graphology-metrics` | Typed, permissive, actively maintained enough, modular ecosystem, strong fit for dependency-path and bottleneck analysis | `packages/lib/src/math/graph/index.ts` |
| Constrained optimization | `yalps` | Typed, permissive, direct LP/MIP fit for portfolio selection and constrained planning | `packages/lib/src/math/optimization/index.ts` |
| Survival analysis | `@fullstax/kaplan-meier-estimator` | Typed, permissive, narrow and sufficient for first time-to-event survival curves | `packages/lib/src/math/survival/index.ts` |

### Evaluated, Held
| Domain | Package | Why held |
|---|---|---|
| Contextual bandits | `simplebandit` | Pure TS and interpretable, but explicitly alpha and not yet strong enough to standardize as a repo foundation without a concrete use-site and validation plan |
| Contextual bandits | `@vowpalwabbit/vowpalwabbit` | Credible engine and current bindings, but WASM-heavy and much larger operational commitment than the current startup-loop trial needs |
| Causal inference | `causal-inference.js` | Too thin. README still describes core methods as WIP and the package surface is not strong enough to anchor repo-wide causal work |
| Control | `advanced-pid-controller` | More credible than older PID packages, but currently untyped and too narrow to standardize before a concrete control-policy use case exists |

### Open Gap with No Good Admission Yet
- Causal inference still lacks a repo-worthy Node/TypeScript package admission.
  - Current conclusion: do not admit a weak TS package just to fill the category. This does not block the target architecture. The current preferred path is an internal causal-design contract plus either a Python-side estimation bridge or a small internal estimator layer for the specific methods the startup loop actually needs.
- Game theory / mechanism design still has no selected central package path.
  - Current conclusion: leave as a non-gating conceptual gap for now. Initial anti-gaming and incentive discipline should land through reward governance, counter-metrics, and approval boundaries rather than a dedicated game-theory package.

### Chosen Strategy Where Package Ecosystem Is Weak
The target self-improving loop must not be blocked waiting for perfect packages in weak ecosystems.

1. **Contextual exploration**
   - Chosen path: build a narrow internal contextual Thompson-sampling or uncertainty-aware ranking layer on top of the repo's existing Bayesian and random primitives.
   - Why: the repo already has enough experimentation math to support a bounded exploration policy without standardizing on an immature third-party package.
2. **Causal evaluation**
   - Chosen path: define an internal causal-evaluation contract first, then satisfy it with either targeted internal estimators or a Python-side bridge when the estimator complexity genuinely requires it.
   - Why: the loop needs causal discipline more than it needs a TypeScript causal package badge.
3. **Control / stability**
   - Chosen path: implement internal hysteresis, hold-window, and bounded-delta rules instead of waiting for a generic control package.
   - Why: the needed control concepts are simple, domain-specific, and easier to own than a thin external controller dependency.

## Issues Blocking Self-Improving Status
1. The startup-loop does not yet use the newly admitted math modules in live policy or routing decisions.
   - Evidence: observed startup-loop imports remain limited to `betaBinomialPosterior` in `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts` and `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`.
   - Practical consequence: this work improved library capability, not loop effectiveness.
   - Required follow-on: wire graph, optimization, and survival into named decision seams with acceptance criteria tied to runtime behavior.
2. The new centralized modules are mostly raw package passthroughs rather than repo-owned mathematical interfaces.
   - Evidence: `packages/lib/src/math/graph/index.ts`, `packages/lib/src/math/optimization/index.ts`, `packages/lib/src/math/survival/index.ts`
   - Practical consequence: the repo has centralized import paths, but not stable semantics, defaults, or validation contracts.
   - Required follow-on: replace broad re-exports with narrower repo-level helpers and typed contracts for startup-loop use cases.
3. The startup-loop still bypasses the intended package boundary and imports math directly from source files.
   - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
   - Practical consequence: centralized capability can drift between source layout and package contract, undermining maintainability and adoption discipline.
   - Required follow-on: move startup-loop consumers onto package entry points or a stable workspace alias.
4. Verification is weaker than the repo now implies.
   - Evidence: `packages/lib/README.md`; no dedicated graph, optimization, or survival tests were found under `packages/lib/__tests__` or `packages/lib/src/**/__tests__`.
   - Practical consequence: the repo now documents advanced math capability without proving wrapper behavior, exports, or package-version assumptions through tests.
   - Required follow-on: add dedicated tests for the new modules and export-surface coverage for the new subpaths.
5. The process still risks stopping at discovery rather than forcing follow-through.
   - Evidence: this fact-find recommends follow-on integration and additional fact-finds, but no child dispatches or companion plan docs were created by this thread.
   - Practical consequence: the repo can truthfully say “we identified the gap” while leaving the actual route to self-improving behavior unowned.
   - Required follow-on: route explicit child work items for integration, contextual bandits, and causal/control strategy.
6. The survival admission is narrower than the surrounding ambition.
   - Evidence: the capability matrix closes survival only “at Kaplan-Meier level”.
   - Practical consequence: time-to-event capability exists, but hazard modelling and covariate-aware survival are still absent.
   - Required follow-on: keep claims narrow and plan the next survival layer only when a concrete startup-loop use site needs it.
7. Even a fully integrated graph/optimization/survival layer would still sit on top of heuristic beliefs.
   - Evidence: candidate value and route choice still derive from hand-built dimensions and weights in `self-evolving-orchestrator.ts` and `self-evolving-scoring.ts`.
   - Practical consequence: optimization would formalize current bias rather than learn expected utility under uncertainty.
   - Required follow-on: introduce explicit posterior belief state for candidate benefit, downside, and implementation success.
8. Outcome feedback is still not closed into self-evolving memory.
   - Evidence: lifecycle event primitives exist in `self-evolving-events.ts`, while queue completion writes outcomes separately in `lp-do-ideas-queue-state-completion.ts`.
   - Practical consequence: the loop cannot update itself from actual results, so it is not self-improving even if allocation math improves.
   - Required follow-on: make `candidate_id` a first-class completion join key and emit verified lifecycle/outcome events automatically.
9. Exploration remains undefined.
   - Evidence: contextual bandits remain absent from the current repo, even though a preferred internal implementation path now exists.
   - Practical consequence: the loop would mostly exploit current beliefs and can get trapped in local optima or stale priors.
   - Required follow-on: add a bounded exploration policy, initially advisory if necessary, using an internal contextual Thompson-sampling or uncertainty-aware ranking layer with explicit regret and safety budgets.
10. Dependency analysis is not causal inference.
   - Evidence: graph analysis is a newly admitted capability, but causal inference remains unresolved.
   - Practical consequence: the loop could treat structural centrality or temporal association as evidence of intervention effect.
   - Required follow-on: keep graph and causal roles separate, define an internal causal-evaluation contract, and require causal evaluation before durable promotion decisions.
11. Stability control is still absent.
   - Evidence: the current system relies on thresholded eligibility and route rules rather than damping or hysteresis policies.
   - Practical consequence: a mathematically richer allocator could still oscillate or thrash under noisy signals.
   - Required follow-on: add internal hold-window, hysteresis, and bounded intervention delta rules before dynamic reallocation becomes authoritative.
12. Reward-gaming risk grows as soon as optimization becomes real.
   - Evidence: current scoring is proxy-heavy and no anti-gaming layer exists in the self-evolving runtime.
   - Practical consequence: the loop can optimize queue-visible metrics while harming true downstream outcomes.
   - Required follow-on: define a guarded utility function with counter-metrics and promotion/revert checks tied to mission outcomes.
13. Mathematical sophistication can still hide bad calibration.
   - Evidence: the current runtime reports some posterior summaries, but does not track calibration, regret, or policy-version quality over time.
   - Practical consequence: the loop could become more mathematically complex while still learning the wrong thing.
   - Required follow-on: add calibration, regret, and policy audit metrics as first-class outputs of the self-evolving system.

## Self-Improving Status Gate For This Thread
This thread can credibly count toward startup-loop self-improving status only when all of the following are true in code:

1. At least one live startup-loop prioritization or allocation seam uses centralized optimization over explicit utility and constraints rather than pure heuristic score sorting.
2. At least one live dependency or bottleneck seam uses centralized graph analysis rather than manual structural reasoning.
3. At least one live time-to-event seam uses centralized survival analysis for slip, churn, close, or escalation forecasting.
4. Startup-loop math consumers use the central package surface rather than direct `packages/lib/src/...` imports.
5. The admitted graph, optimization, and survival modules expose repo-owned helper contracts with dedicated tests.
6. Candidate selection is driven by explicit posterior beliefs about value, risk, and success probability rather than only fixed score weights.
7. Verified outcomes and lifecycle events flow back into self-evolving memory automatically and update future decisions.
8. The policy includes bounded exploration so the loop can learn while acting.
9. Promotion-quality decisions use causal evaluation discipline rather than structural correlation alone.
10. The runtime includes stability controls to prevent oscillation, overshoot, and noise-driven churn.
11. The utility function includes anti-gaming guardrails and downside-aware counter-metrics.
12. Calibration and regret are monitored so the loop can detect whether its mathematical beliefs and policies are actually improving.
13. The weak-package areas have an explicit chosen implementation path rather than being left as indefinite package-search debt.

Until those conditions hold, the correct claim is: the repo has improved centralized mathematical foundations, but the startup-loop is not yet mathematically self-improving.

## Repo Changes Made
- Added centralized graph-analysis wrappers in `packages/lib/src/math/graph/index.ts`.
- Added centralized constrained-optimization wrappers in `packages/lib/src/math/optimization/index.ts`.
- Added centralized survival-analysis wrappers in `packages/lib/src/math/survival/index.ts`.
- Extended `packages/lib/src/math/index.ts` to export the new modules.
- Updated `packages/lib/package.json` to admit the selected open-source packages.
- Updated `packages/lib/README.md` so the central math contract no longer falsely claims zero runtime dependencies for all math modules.

## Questions
### Resolved
- Q: Do we already have a centralized math layer in code?
  - A: Yes. `packages/lib/src/math` already centralizes experimentation, forecasting, similarity, probabilistic, statistics, search, financial, geometry, and related primitives.
- Q: Is the startup-loop already using that central math surface heavily?
  - A: No. Observed startup-loop runtime use is effectively limited to `betaBinomialPosterior`.
- Q: Were graph, optimization, and survival genuinely missing as centralized math capabilities?
  - A: Yes. They were not present under `packages/lib/src/math` before this work and are now admitted.
- Q: Did package research find clean solutions for every requested mathematical gap?
  - A: No. Contextual bandits, causal inference, and control still have weaker package fit than graph, optimization, and survival.
- Q: Did this fact-find make the startup-loop mathematically self-improving?
  - A: No. It created centralized foundations and a better gap map, but live startup-loop decisions still do not materially run on the newly admitted math modules.
- Q: What would make the target loop genuinely mathematical and self-improving rather than just mathematically ornamented?
  - A: Belief updating, constrained portfolio choice, outcome closure, bounded exploration, causal discipline, stability control, and reward governance must all be present together.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 92%
  - Basis: central wrappers and dependency admissions are now in repo and localized.
- Approach: 90%
  - Basis: the revised brief now separates foundation admission from the full target architecture required for genuine self-improvement and does not overclaim.
- Impact: 74%
  - Basis: the document now points to the full architectural route to genuine self-improving status, but the code remains far from that target.
- Delivery-Readiness: 95%
  - Basis: the fact-find is now stricter and planning-ready for the full sequence of work required to reach self-improving status.
- Testability: 76%
  - Basis: the target seams are identifiable in code, though several required layers still need new tests and local Jest execution is not permitted.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Admitting third-party math packages without a central wrapper would scatter package APIs through the repo | Medium | High | Keep all admissions behind `@acme/lib/math/*` entry points |
| The repo starts claiming stronger mathematical capability than startup-loop runtime actually uses | High | Medium | Keep adoption and usage explicitly separate in planning docs |
| Thin wrapper modules get mistaken for stable repo-owned mathematical APIs | High | Medium | Harden thin re-exports into narrower helper contracts before broad adoption |
| Direct source-file imports bypass the central package boundary and create silent contract drift | Medium | High | Move startup-loop math consumers onto exported package surfaces |
| Missing test coverage lets third-party package changes break the admitted math surface silently | Medium | High | Add module-level and export-surface tests for graph, optimization, and survival |
| Optimization lands before belief-quality, causal, or anti-gaming layers and hardens the wrong policy | High | High | Sequence posterior-belief, outcome-closure, and utility-governance work ahead of authoritative optimization |
| Graph signals get misused as causal proof | Medium | High | Keep dependency analysis and causal evaluation as explicitly separate layers |
| A richer allocator introduces instability and queue thrash | Medium | High | Require control-style damping and hold-window rules before dynamic policy becomes authoritative |
| Package-quality frustration leads to indefinite delay in exploration, causal, or control work | Medium | High | Use the explicit internal or bridge implementation paths defined in this fact-find instead of waiting for perfect packages |
| The loop becomes mathematically elaborate but poorly calibrated | Medium | High | Require calibration and regret telemetry before trusting policy upgrades |
| README contract drift creates false expectations for package policy | Medium | Medium | Keep central math documentation explicit about core-vs-adapter dependency policy |

## Planning Constraints & Notes
- Must-follow patterns:
  - New mathematical capability enters through `@acme/lib/math`.
  - Prefer narrow adapters over raw package re-export sprawl in app code.
  - Treat “package found” and “package admitted” as different lifecycle states.
  - Do not claim self-improving status from package admission alone; require live runtime adoption plus tests.
- Required next planning cut should split into:
  - one fact-find or plan to introduce explicit posterior belief state for candidate value, downside, and success probability,
  - one integration-focused plan to wire optimization, graph, and survival into explicit startup-loop decision seams,
  - one plan or build thread to harden the new math modules from thin wrappers into repo-owned helper contracts with tests,
  - one small cleanup thread to remove direct startup-loop imports from `packages/lib/src/...`,
  - one outcome-closure plan to join queue completion and verified lifecycle memory back into self-evolving state,
  - one plan for bounded contextual exploration using an internal contextual Thompson-sampling or uncertainty-aware ranking implementation,
  - one plan for causal-evaluation contract plus estimator or bridge implementation,
  - one plan for stability control and anti-gaming utility governance,
  - one plan for calibration, regret, and policy-audit telemetry.
