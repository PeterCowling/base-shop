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
The repo does have a centralized math layer in `@acme/lib/math`, and this thread did close three genuine foundation gaps by admitting centralized graph, constrained-optimization, and survival modules. But the resulting system is still not mathematically self-improving in any honest sense. The live startup-loop runtime still uses only `betaBinomialPosterior`, the newly admitted modules are mostly thin package passthroughs, the startup-loop still bypasses the package boundary by importing directly from `packages/lib/src`, and the new modules have no dedicated tests. This fact-find therefore needs to do more than inventory capability: it must describe the current post-admission system as it actually exists in code, identify the defects that still block self-improving status, and define the concrete follow-on work needed to convert new math surface area into live decision quality.

### Goals
- Inventory the centralized math capability that exists in code today.
- Distinguish between available central math, actually-used startup-loop math, and merely admitted-but-unused math.
- Record which missing math fundamentals now have repo-admitted open-source solutions, and where those admissions are still too thin to count as repo-owned capability.
- Record which remaining math fundamentals still need dedicated follow-on fact-finds because package quality is not yet good enough for direct admission.
- Define the code-level requirements for this thread to contribute to actual self-improving startup-loop behavior rather than just expanding library surface area.
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
- **Why:** The startup loop is asking for mathematically stronger decision-making, but the repo needs more than a capability inventory. It needs an honest account of what changed, what still does not influence live decisions, and what must be built before this math thread can count toward self-improving status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed inventory of centralized math capability, a hard assessment of the post-admission system, and a planning-ready set of requirements to turn centralized math foundations into live self-improving startup-loop behavior.
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

## Self-Improving Status Gate For This Thread
This thread can credibly count toward startup-loop self-improving status only when all of the following are true in code:

1. At least one live startup-loop prioritization or allocation seam uses centralized optimization rather than pure heuristic score sorting.
2. At least one live dependency or bottleneck seam uses centralized graph analysis rather than manual structural reasoning.
3. At least one live time-to-event seam uses centralized survival analysis for slip, churn, close, or escalation forecasting.
4. Startup-loop math consumers use the central package surface rather than direct `packages/lib/src/...` imports.
5. The admitted graph, optimization, and survival modules expose repo-owned helper contracts with dedicated tests.
6. Follow-on mathematical gaps that were intentionally held are explicitly routed into tracked work rather than left as narrative “later”.

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

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 92%
  - Basis: central wrappers and dependency admissions are now in repo and localized.
- Approach: 90%
  - Basis: the revised brief now separates foundation admission from real loop-effectiveness requirements and does not overclaim.
- Impact: 68%
  - Basis: central capability improved, but live decision quality has not yet moved because the new math is not wired into runtime seams.
- Delivery-Readiness: 93%
  - Basis: the fact-find is now stricter and planning-ready for the actual work required to reach self-improving status.
- Testability: 72%
  - Basis: wrapper modules are easy to typecheck and lint, but new dedicated tests are still missing and local Jest execution is not permitted.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Admitting third-party math packages without a central wrapper would scatter package APIs through the repo | Medium | High | Keep all admissions behind `@acme/lib/math/*` entry points |
| The repo starts claiming stronger mathematical capability than startup-loop runtime actually uses | High | Medium | Keep adoption and usage explicitly separate in planning docs |
| Thin wrapper modules get mistaken for stable repo-owned mathematical APIs | High | Medium | Harden thin re-exports into narrower helper contracts before broad adoption |
| Direct source-file imports bypass the central package boundary and create silent contract drift | Medium | High | Move startup-loop math consumers onto exported package surfaces |
| Missing test coverage lets third-party package changes break the admitted math surface silently | Medium | High | Add module-level and export-surface tests for graph, optimization, and survival |
| Contextual-bandit or causal package pressure leads to admitting weak dependencies later | Medium | High | Require a concrete use-site, package-quality review, and validation plan before admission |
| README contract drift creates false expectations for package policy | Medium | Medium | Keep central math documentation explicit about core-vs-adapter dependency policy |

## Planning Constraints & Notes
- Must-follow patterns:
  - New mathematical capability enters through `@acme/lib/math`.
  - Prefer narrow adapters over raw package re-export sprawl in app code.
  - Treat “package found” and “package admitted” as different lifecycle states.
  - Do not claim self-improving status from package admission alone; require live runtime adoption plus tests.
- Required next planning cut should split into:
  - one integration-focused plan to wire optimization, graph, and survival into explicit startup-loop decision seams,
  - one plan or build thread to harden the new math modules from thin wrappers into repo-owned helper contracts with tests,
  - one small cleanup thread to remove direct startup-loop imports from `packages/lib/src/...`,
  - one fact-find on contextual bandits,
  - one fact-find on causal inference and control package strategy.
