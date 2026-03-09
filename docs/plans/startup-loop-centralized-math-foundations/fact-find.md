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
Trigger-Why: The startup loop is asking for mathematically stronger decision-making, but the repo needs a code-true inventory of centralized math capability first. Today there is a real central math layer, but startup-loop adoption is narrow and several core decision domains still lack repo-worthy primitives.
Trigger-Intended-Outcome: "type: operational | statement: The repo has a code-backed inventory of centralized math capability, a clear gap matrix against startup-loop self-improvement needs, and repo-admitted open-source package solutions for the math fundamentals that have clean Node/TypeScript fit. | source: operator"
---

# Startup Loop Centralized Math Foundations Fact-Find Brief

## Scope
### Summary
The repo already has a centralized math layer in `@acme/lib/math`, but current startup-loop usage is much narrower than the available surface. The codebase contains local experimentation, forecasting, similarity, probabilistic-sketch, search, statistics, financial, geometry, and ops primitives. However, the live self-evolving runtime currently imports only `betaBinomialPosterior`, and most of the startup-loop remains heuristic rather than math-driven. Against the self-improving-loop needs, the biggest central gaps were graph analysis, constrained optimization, and survival analysis. Those are now admitted into the repo as centralized wrappers backed by `graphology`, `graphology-dag`, `graphology-shortest-path`, `graphology-metrics`, `yalps`, and `@fullstax/kaplan-meier-estimator`. The remaining gap areas are contextual bandits, causal inference, and control. Package research found candidate solutions there, but the current Node/TypeScript options are either too weak, too immature, too service-coupled, or too thinly typed to admit into `@acme/lib/math` without lowering repo quality.

### Goals
- Inventory the centralized math capability that exists in code today.
- Distinguish between available central math, actually-used startup-loop math, and missing central math.
- Record which missing math fundamentals now have repo-admitted open-source solutions.
- Record which remaining math fundamentals still need a dedicated follow-on fact-find because package quality is not yet good enough for direct admission.
- Keep the output planning-ready for startup-loop self-improvement work rather than as a generic library audit.

### Non-goals
- Wiring the newly admitted math modules into live startup-loop routing or policy decisions.
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
- **Why:** The startup loop is asking for mathematically stronger decision-making, but the repo needs a code-true inventory of centralized math capability first. Today there is a real central math layer, but startup-loop adoption is narrow and several core decision domains still lack repo-worthy primitives.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed inventory of centralized math capability, a clear gap matrix against startup-loop self-improvement needs, and repo-admitted open-source package solutions for the math fundamentals that have clean Node/TypeScript fit.
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
- The repo previously documented math modules as zero-dependency only, which became false once advanced external adapters were admitted.
  - Evidence: `packages/lib/README.md`
- Existing local math capability already covers several fundamentals the startup loop is not using yet.
  - Evidence: `packages/lib/src/math/experimentation/index.ts`, `packages/lib/src/math/forecasting/index.ts`, `packages/lib/src/math/similarity/index.ts`
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
  - Current conclusion: do not admit a weak TS package just to fill the category. The next fact-find should evaluate whether this belongs as a Python-side analysis bridge or as a small internal DAG-plus-estimation module built on top of stronger lower-level primitives.
- Game theory / mechanism design still has no selected central package path.
  - Current conclusion: leave as conceptual gap until there is an actual startup-loop policy problem that needs it.

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

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 92%
  - Basis: central wrappers and dependency admissions are now in repo and localized.
- Approach: 88%
  - Basis: graph, optimization, and survival package admissions are strong; causal and control remain intentionally unresolved rather than papered over.
- Impact: 86%
  - Basis: this closes real central capability gaps, but the startup-loop will still need downstream integration work before decisions materially improve.
- Delivery-Readiness: 90%
  - Basis: the fact-find is planning-ready and the repo now contains the admitted foundational modules.
- Testability: 84%
  - Basis: wrapper modules are easy to typecheck and lint, though no local Jest execution is permitted.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Admitting third-party math packages without a central wrapper would scatter package APIs through the repo | Medium | High | Keep all admissions behind `@acme/lib/math/*` entry points |
| The repo starts claiming stronger mathematical capability than startup-loop runtime actually uses | High | Medium | Keep adoption and usage explicitly separate in planning docs |
| Contextual-bandit or causal package pressure leads to admitting weak dependencies later | Medium | High | Require a concrete use-site, package-quality review, and validation plan before admission |
| README contract drift creates false expectations for package policy | Medium | Medium | Keep central math documentation explicit about core-vs-adapter dependency policy |

## Planning Constraints & Notes
- Must-follow patterns:
  - New mathematical capability enters through `@acme/lib/math`.
  - Prefer narrow adapters over raw package re-export sprawl in app code.
  - Treat “package found” and “package admitted” as different lifecycle states.
- Next planning cut should likely split into:
  - one integration-focused plan to wire optimization/graph/survival into startup-loop decisions,
  - one fact-find on contextual bandits,
  - one fact-find on causal inference package strategy.
