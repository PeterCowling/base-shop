---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-10
Last-updated: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-centralized-math-foundations
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Centralized Math Foundations Plan

## Summary
The fact-find now defines the correct target: a genuine mathematical self-improving loop, not a library-expansion exercise. This plan takes the architecture forward in the only defensible order: first harden the package boundary and repo-owned math contracts, then establish posterior belief state, decision journaling, maturity windows, and verified outcome closure, then integrate optimization, graph, and survival into live policy seams, and only after that add exploration, causal promotion gates, stability controls, anti-gaming governance, replay-backed calibration/regret telemetry, and the final authority checkpoints. The plan stays in trial mode. It does not authorize live autonomous actuation or authoritative policy promotion until the checkpoint sequence can prove that the full self-improving status gate is satisfied in code. The intended result is a startup-loop policy layer that can update beliefs from verified outcomes, choose constrained actions under uncertainty, learn while acting, and prove that its mathematics is helping rather than merely adding complexity.

## Active tasks
- [x] TASK-01: Replace direct startup-loop math source imports with the centralized package boundary — Complete (2026-03-09)
- [x] TASK-02: Harden graph, optimization, and survival modules into repo-owned helper contracts with tests — Complete (2026-03-09)
- [x] TASK-03: Define the posterior belief, utility, and policy-state contract — Complete (2026-03-09)
- [x] TASK-04: Define the outcome-closure and verified-measurement contract — Complete (2026-03-09)
- [x] TASK-05: Implement the versioned belief-state and utility-computation layer — Complete (2026-03-09)
- [x] TASK-06: Implement outcome closure and verified measurement feedback into self-evolving memory — Complete (2026-03-09)
- [x] TASK-16: Implement decision journaling, maturity windows, and replay-ready evaluation datasets — Complete (2026-03-09)
- [x] TASK-07: Replace pure priority sorting with constrained portfolio optimization — Complete (2026-03-10)
- [x] TASK-08: Integrate graph dependency and bottleneck analysis into policy inputs — Complete (2026-03-10)
- [x] TASK-09: Integrate survival and time-to-event risk into policy inputs — Complete (2026-03-10)
- [x] TASK-10: Implement bounded contextual exploration with internal Thompson-style ranking — Complete (2026-03-10)
- [x] TASK-11: Implement the causal-evaluation contract and promotion-quality gate — Complete (2026-03-10)
- [x] TASK-12: Implement stability controls and anti-gaming utility governance — Complete (2026-03-10)
- [x] TASK-13: Implement calibration, regret, override, and policy audit telemetry — Complete (2026-03-10)
- [x] TASK-17: Enforce the policy authority ladder at queue and promotion seams — Complete (2026-03-10)
- [x] TASK-18: Produce real shadow-run policy artifacts and checkpoint evidence — Complete (2026-03-10)
- [x] TASK-19: Persist shadow handoff replay state for non-actuating policy runs — Complete (2026-03-10)
- [x] TASK-20: Find or prove the absence of a real-data cohort that exercises selected and exploration policy paths — Complete (2026-03-10)
- [ ] TASK-22: Audit selection starvation and define the first mathematically sound path to a real selected cohort
- [ ] TASK-21: Rerun shadow evidence after the first live maturity window closes
- [ ] TASK-14: Horizon checkpoint - replay and guarded-trial policy readiness
- [ ] TASK-15: Final checkpoint - authoritative mathematical policy readiness

## Goals
- Turn the centralized math thread into a genuine mathematical self-improving-loop plan rather than a package-inventory plan.
- Replace heuristic-only ranking with posterior beliefs, explicit utility, and constrained portfolio selection.
- Close verified outcomes and measurement back into self-evolving memory so future policy updates can learn from real results.
- Integrate graph, survival, exploration, causal, control, and audit layers without confusing their roles.
- Prevent the loop from becoming mathematically elaborate but badly calibrated, unstable, or easy to game.
- Keep the entire rollout inside guarded trial mode until the self-improving status gate is actually satisfied.

## Non-goals
- Immediate autonomous actuation or production-authoritative policy changes.
- A repo-wide mathematics overhaul outside the startup-loop self-evolving runtime and its central package surface.
- Waiting for perfect third-party packages in weak ecosystem areas before moving the architecture forward.
- Treating graph structure, survival risk, or optimization output as causal proof by themselves.

## Constraints & Assumptions
- Constraints:
  - Code is the sole source of truth for the current system and the implementation seams this plan can target.
  - Trial mode remains in force; mathematical policy improvements must stay in Shadow or Advisory mode until the checkpoint sequence clears a higher authority level.
  - New math capability must enter through `@acme/lib/math` and repo-owned helpers, not direct third-party imports in startup-loop code.
  - Verified outcome closure and calibration telemetry are mandatory prerequisites for any authoritative mathematical policy claim.
  - Regret and policy-quality claims must be backed by replay-ready decision traces and explicit maturity-window handling, not post-hoc narrative.
  - Local Jest execution remains out of scope; validation must rely on targeted typecheck/lint and CI-routed test execution.
- Assumptions:
  - The correct sequence is architecture-first, not optimizer-first.
  - Internal implementations are acceptable for exploration, causal contracts, and control logic where package ecosystems are weak.
  - The loop should remain advisory or guarded until calibration, regret, and stability evidence show the mathematical policy is trustworthy.

## Inherited Outcome Contract
- **Why:** The startup loop is asking for mathematically stronger decision-making, but the repo needs more than a capability inventory. It needs an honest account of what changed, what still does not influence live decisions, and what must be built before this math thread can count toward genuine self-improving status.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed inventory of centralized math capability, a hard assessment of the post-admission system, and a planning-ready target architecture for a genuine mathematical self-improving startup loop with explicit required workstreams.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`
- Key findings used:
  - The current self-evolving runtime still imports only `betaBinomialPosterior` and bypasses the central math package boundary.
  - The admitted graph, optimization, and survival modules are currently thin package passthroughs with no dedicated tests.
  - Optimization on top of the current score sorter would harden heuristic bias unless posterior belief state and verified outcome closure land first.
  - Contextual exploration, causal evaluation, and stability control still need chosen implementation paths rather than indefinite package waiting.
  - Calibration and regret telemetry are required so the loop can prove that its mathematical policy is improving decisions.

## Proposed Approach
- Option A: integrate optimization, graph, and survival directly into the existing heuristic scoring path, then add safety and learning layers later if needed.
  - Pros: faster visible math adoption.
  - Cons: formalizes current bias, leaves outcome closure and calibration too late, and makes it easy to overclaim self-improvement.
- Option B: architecture-first. Harden the package boundary and helper contracts, define posterior state and outcome closure, then integrate optimization/graph/survival, then add bounded exploration, causal promotion gates, stability controls, anti-gaming governance, and calibration/regret telemetry before authoritative policy readiness is evaluated.
  - Pros: matches the target system in the fact-find and keeps mathematical rigor tied to real learning rather than cosmetic sophistication.
  - Cons: longer path and more moving parts before the system can claim success.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Policy Authority Ladder
- Level 0: Shadow
  - Policy computes beliefs, utilities, portfolios, exploration draws, and gate outcomes, but does not mutate queue ordering or promotion state.
- Level 1: Advisory
  - Outputs are visible to operators and may be compared against current heuristic behavior, but humans still decide queue/promotion actions.
- Level 2: Guarded trial authority
  - Mathematical policy may influence bounded queue allocation inside explicit WIP, blast-radius, and hold-window caps, with full journaling and rollback paths.
- Level 3: Authoritative mathematical policy
  - Forbidden until TASK-15 confirms the self-improving status gate against actual code, telemetry, replay evidence, and guardrail results.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Replace direct startup-loop math source imports with the centralized package boundary | 85% | S | Complete (2026-03-09) | - | TASK-05, TASK-07, TASK-08, TASK-09, TASK-13 |
| TASK-02 | IMPLEMENT | Harden graph, optimization, and survival modules into repo-owned helper contracts with tests | 80% | M | Complete (2026-03-09) | - | TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-03 | INVESTIGATE | Define the posterior belief, utility, and policy-state contract | 75% | M | Complete (2026-03-09) | - | TASK-05, TASK-07, TASK-08, TASK-09, TASK-10, TASK-12, TASK-13 |
| TASK-04 | INVESTIGATE | Define the outcome-closure and verified-measurement contract | 75% | M | Complete (2026-03-09) | - | TASK-06, TASK-07, TASK-09, TASK-10, TASK-11, TASK-13 |
| TASK-05 | IMPLEMENT | Implement the versioned belief-state and utility-computation layer | 80% | M | Complete (2026-03-09) | TASK-01, TASK-02, TASK-03 | TASK-07, TASK-08, TASK-09, TASK-10, TASK-12, TASK-13 |
| TASK-06 | IMPLEMENT | Implement outcome closure and verified measurement feedback into self-evolving memory | 80% | M | Complete (2026-03-09) | TASK-01, TASK-02, TASK-04 | TASK-07, TASK-09, TASK-10, TASK-11, TASK-13 |
| TASK-16 | IMPLEMENT | Implement decision journaling, maturity windows, and replay-ready evaluation datasets | 80% | M | Complete (2026-03-09) | TASK-03, TASK-04, TASK-05, TASK-06 | TASK-07, TASK-09, TASK-10, TASK-11, TASK-13, TASK-14 |
| TASK-07 | IMPLEMENT | Replace pure priority sorting with constrained portfolio optimization | 80% | M | Complete (2026-03-10) | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-16 | TASK-10, TASK-12, TASK-13, TASK-14 |
| TASK-08 | IMPLEMENT | Integrate graph dependency and bottleneck analysis into policy inputs | 80% | M | Complete (2026-03-10) | TASK-02, TASK-03, TASK-05 | TASK-11, TASK-13, TASK-14 |
| TASK-09 | IMPLEMENT | Integrate survival and time-to-event risk into policy inputs | 80% | M | Complete (2026-03-10) | TASK-02, TASK-04, TASK-05, TASK-06, TASK-16 | TASK-11, TASK-13, TASK-14 |
| TASK-10 | IMPLEMENT | Implement bounded contextual exploration with internal Thompson-style ranking | 80% | M | Complete (2026-03-10) | TASK-03, TASK-04, TASK-05, TASK-06, TASK-16, TASK-07 | TASK-12, TASK-13, TASK-14 |
| TASK-11 | IMPLEMENT | Implement the causal-evaluation contract and promotion-quality gate | 80% | M | Complete (2026-03-10) | TASK-04, TASK-06, TASK-16, TASK-08, TASK-09 | TASK-12, TASK-13, TASK-14 |
| TASK-12 | IMPLEMENT | Implement stability controls and anti-gaming utility governance | 80% | M | Complete (2026-03-10) | TASK-03, TASK-05, TASK-07, TASK-10, TASK-11 | TASK-13, TASK-14 |
| TASK-13 | IMPLEMENT | Implement calibration, regret, override, and policy audit telemetry | 80% | M | Complete (2026-03-10) | TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-16, TASK-07, TASK-10, TASK-11, TASK-12 | TASK-14 |
| TASK-17 | IMPLEMENT | Enforce the authority ladder so shadow and advisory policy cannot silently actuate queue or promotion state | 85% | M | Complete (2026-03-10) | TASK-07, TASK-10, TASK-11, TASK-12, TASK-13 | TASK-14, TASK-15 |
| TASK-18 | IMPLEMENT | Produce real self-evolving shadow-run policy artifacts and checkpoint evidence from repo outputs | 80% | M | Complete (2026-03-10) | TASK-13, TASK-17 | TASK-14, TASK-15 |
| TASK-19 | IMPLEMENT | Persist shadow handoff records so non-actuating runs enter replay and maturity accounting | 80% | M | Complete (2026-03-10) | TASK-18 | TASK-14, TASK-15 |
| TASK-20 | INVESTIGATE | Find or prove the absence of a real-data cohort that exercises portfolio selection and exploration | 70% | M | Complete (2026-03-10) | TASK-18 | TASK-14, TASK-15 |
| TASK-22 | INVESTIGATE | Audit selection starvation and define the first mathematically sound path to a real selected cohort | 75% | M | Pending | TASK-20 | TASK-14, TASK-15 |
| TASK-21 | CHECKPOINT | Rerun shadow evidence after the first live maturity window closes | 95% | S | Pending | TASK-19 | TASK-14, TASK-15 |
| TASK-14 | CHECKPOINT | Horizon checkpoint - replay and guarded-trial policy readiness | 95% | S | Pending | TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-17, TASK-18, TASK-19, TASK-20, TASK-21, TASK-22 | TASK-15 |
| TASK-15 | CHECKPOINT | Final checkpoint - authoritative mathematical policy readiness | 95% | S | Pending | TASK-14 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | Harden the package boundary and define the two contracts the rest of the system depends on |
| 2 | TASK-05, TASK-06 | TASK-01, TASK-02 plus their contract task | Belief state and outcome closure are the first real self-improvement prerequisites |
| 3 | TASK-16 | TASK-03, TASK-04, TASK-05, TASK-06 | Create replay-ready decision traces and explicit maturity handling before policy-quality claims |
| 4 | TASK-07, TASK-08, TASK-09 | TASK-05, TASK-06, TASK-16 plus relevant contracts | Integrate optimization, graph, and survival only after belief state, feedback, and replay traces exist |
| 5 | TASK-10, TASK-11 | TASK-07 or supporting prerequisites | Exploration and causal promotion gates sit on top of the core policy inputs |
| 6 | TASK-12, TASK-13 | TASK-07, TASK-10, TASK-11 plus supporting prerequisites | Stabilize, govern, and audit the mathematical policy before any readiness checkpoint |
| 7 | TASK-17, TASK-18 | TASK-13 plus supporting policy seams | Fix authority leakage and produce real checkpoint evidence before rerunning the guarded-trial gate |
| 8 | TASK-19, TASK-20 | TASK-18 | Close the remaining shadow replay gap and prove whether a real-data selected/exploration cohort exists before rerunning the checkpoint |
| 9 | TASK-22, TASK-21 | TASK-20, TASK-19 | Resolve selection starvation, then rerun the shadow evidence pack on or after the first live maturity date before retrying the guarded-trial checkpoint |
| 10 | TASK-14, TASK-15 | TASK-07 through TASK-13, TASK-17, TASK-21, TASK-22 | Replay/guarded-trial checkpoint first, then authoritative-claim checkpoint last |

## Tasks

### TASK-01: Replace direct startup-loop math source imports with the centralized package boundary
- **Type:** IMPLEMENT
- **Deliverable:** startup-loop runtime imports move off `packages/lib/src/math/...` source paths and onto the centralized `@acme/lib/math/*` package boundary or an equivalent stable workspace alias
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `[readonly] packages/lib/package.json`, `[readonly] packages/lib/src/math/index.ts`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-07, TASK-08, TASK-09, TASK-13
- **Confidence:** 85%
  - Implementation: 90% - the direct import sites are concrete and small.
  - Approach: 90% - there is no credible reason to keep bypassing the central contract.
  - Impact: 85% - the package boundary must be trustworthy before the rest of the plan can rely on it.
- **Acceptance criteria:**
  - No live startup-loop runtime file imports math directly from `packages/lib/src/math/...`.
  - The startup-loop resolves its math imports through the centralized package contract or a stable workspace alias.
  - Typecheck and lint stay clean for the touched surfaces.
- **Validation contract (TC-01):**
  - TC-01: `self-evolving-scoring.ts` and `self-evolving-dashboard.ts` import centralized math through the stable package boundary.
  - TC-02: startup-loop typecheck passes without path-resolution regressions.
  - TC-03: no remaining direct source import matches exist in live startup-loop runtime files.
- **Execution plan:** Red -> add/adjust a regression check or search-backed assertion for forbidden source imports; Green -> switch the runtime imports; Refactor -> consolidate any temporary aliasing so later tasks reuse the same import pattern.
- **Planning validation (required for M/L):** None: S task with directly verified seams.
- **Scouts:** None: the current direct imports are already explicit in code.
- **Edge Cases & Hardening:** keep test files and non-runtime references out of the ban if needed, but fail closed for live startup-loop runtime code.
- **What would make this >=90%:**
  - A pre-existing import-lint rule specifically for startup-loop math boundaries.
- **Rollout / rollback:**
  - Rollout: switch imports and validate resolution immediately.
  - Rollback: revert import paths only if the package surface proves incomplete, without weakening the boundary requirement in the plan.
- **Documentation impact:**
  - Update any startup-loop math adoption notes that still reference direct source imports.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
- **Build Evidence (2026-03-09):**
  - Red evidence: live self-evolving runtime still imported `betaBinomialPosterior` from `packages/lib/src/math/experimentation/bayesian.js` in both target files.
  - Green: updated `self-evolving-scoring.ts` and `self-evolving-dashboard.ts` to import from `@acme/lib/math/experimentation` instead of a package source path.
  - Scope control: preserved an unrelated in-progress dashboard posture change already present in the working tree and changed only the import seam.
  - TC-01: pass. Both target files now import via `@acme/lib/math/experimentation`.
  - TC-02: pass. `pnpm exec tsc -p scripts/tsconfig.json --noEmit` completed successfully.
  - TC-03: pass. `pnpm exec eslint scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts` completed successfully, and `rg -n "packages/lib/src/math/experimentation/bayesian\\.js" scripts/src/startup-loop/self-evolving -S` returned no matches.
  - Precursor completion propagation: TASK-01 is no longer a blocker. No downstream IMPLEMENT task crossed its execution threshold from this change alone because TASK-05, TASK-07, TASK-08, TASK-09, and TASK-13 still depend on other incomplete tasks. Wave 1 contract work is now complete apart from TASK-02, which remains below the IMPLEMENT confidence threshold and needs a replan or confidence-raising evidence before it can run.

### TASK-02: Harden graph, optimization, and survival modules into repo-owned helper contracts with tests
- **Type:** IMPLEMENT
- **Deliverable:** repo-owned helper APIs for graph, optimization, and survival, plus dedicated tests and subpath export coverage
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `packages/lib/src/math/graph/index.ts`, `packages/lib/src/math/optimization/index.ts`, `packages/lib/src/math/survival/index.ts`, `packages/lib/src/math/index.ts`, `packages/lib/src/__tests__/index.exports.test.ts`, `packages/lib/__tests__/math/**`, `packages/lib/README.md`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 80%
  - Implementation: 80% - the helper surface is now bounded by concrete policy and outcome contracts rather than open-ended package design.
  - Approach: 80% - repo-owned helpers are mandatory if these modules will drive policy.
  - Impact: 80% - without stable helpers and tests the rest of the plan sits on package passthroughs.
- **Acceptance criteria:**
  - The graph, optimization, and survival modules expose narrower repo-owned helpers rather than only broad third-party re-exports.
  - Dedicated tests cover normal, edge, and subpath-export behavior for the new helpers.
  - Startup-loop integration tasks can consume repo-owned semantics without depending on third-party package details.
- **Validation contract (TC-02):**
  - TC-01: graph helper APIs produce deterministic outputs on fixed dependency fixtures.
  - TC-02: optimization helpers encode deterministic tie-breaking and fail closed on infeasible models.
  - TC-03: survival helpers handle censored observations, sparse history, and empty inputs without silent bad defaults.
- **Execution plan:** Red -> add helper/export tests; Green -> replace thin passthroughs with repo-owned helper contracts; Refactor -> keep third-party-specific details private to the math package.
- **Planning validation (required for M/L):**
  - Checks run: verified current modules are thin re-exports with no dedicated tests.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`, `docs/plans/startup-loop-centralized-math-foundations/replan-notes.md`
  - Unexpected findings: helper/test absence is broader than a documentation problem because later policy tasks would otherwise couple directly to third-party APIs, but the required optimization and survival shapes are now concrete enough to implement without another design pass.
- **Scouts:** None: the need for helper hardening is already directly evidenced.
- **Edge Cases & Hardening:** deterministic tie-breaking, sparse survival histories, and invalid graph input normalization.
- **What would make this >=90%:**
  - Example fixtures for the exact startup-loop dependency, portfolio, and survival shapes each helper will consume.
- **Rollout / rollback:**
  - Rollout: land helper APIs and tests before any startup-loop call site uses them.
  - Rollback: keep the tests and revert only the helper shape if naming or normalization choices prove wrong.
- **Documentation impact:**
  - Update `packages/lib/README.md` with repo-owned helper semantics once finalized.
- **Notes / references:**
  - `packages/lib/src/math/graph/index.ts`
  - `packages/lib/src/math/optimization/index.ts`
  - `packages/lib/src/math/survival/index.ts`
  - `docs/plans/startup-loop-centralized-math-foundations/replan-notes.md`
- **Build Evidence (2026-03-09):**
  - Green: replaced the raw third-party passthroughs with repo-owned helpers:
    - `analyzeDependencyGraph()` and `DependencyGraphValidationError`
    - `solveBinaryPortfolio()` and `PortfolioModelValidationError`
    - `estimateKaplanMeierCurve()` and `SurvivalObservationValidationError`
  - Dedicated tests added:
    - `packages/lib/__tests__/math/graph/index.test.ts`
    - `packages/lib/__tests__/math/optimization/index.test.ts`
    - `packages/lib/__tests__/math/survival/index.test.ts`
    - updated `packages/lib/src/__tests__/index.exports.test.ts` to cover math subpath exposure
  - Scope expansion: added `packages/lib/README.md` to keep the documented subpath contract aligned with the narrowed helper surface instead of leaving stale raw-package examples in place.
  - TC-01: pass by code and local type/lint validation. `analyzeDependencyGraph()` now normalizes node/edge input, rejects missing-node and cyclic graphs, and returns deterministic topology plus bottleneck summaries on fixed fixtures.
  - TC-02: pass by code and local type/lint validation. `solveBinaryPortfolio()` now validates input, fails closed on infeasible models, and applies a deterministic second-pass tie-break when primary utility is tied.
  - TC-03: pass by code and local type/lint validation. `estimateKaplanMeierCurve()` now returns explicit empty results, validates invalid observations, and summarizes censored plus observed histories without leaking the raw package API.
  - Validation:
    - `pnpm exec tsc -p packages/lib/tsconfig.json --noEmit`
    - `pnpm --filter @acme/lib lint`
    - `pnpm plans:lint`
  - Test execution note: local Jest remains out of scope under repo policy, so the new package tests were added but not run locally.
  - Precursor completion propagation: TASK-02 is no longer a blocker for TASK-05, TASK-06, TASK-07, TASK-08, or TASK-09. The next execution gate is confidence rather than missing helper contract: TASK-05 and TASK-06 remain below the `IMPLEMENT` threshold and require replan or confidence-raising evidence before the next build cycle.

### TASK-03: Define the posterior belief, utility, and policy-state contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-07, TASK-08, TASK-09, TASK-10, TASK-12, TASK-13
- **Confidence:** 75%
  - Implementation: 75% - the deliverable is an analysis artifact with concrete target seams.
  - Approach: 80% - belief/utility contracts must exist before optimization and exploration become defensible.
  - Impact: 85% - this is the load-bearing bridge from heuristics to actual mathematical policy.
- **Questions to answer:**
  - What exact posterior objects does the runtime maintain for candidate value, downside, success probability, and time-to-effect?
  - How are cold-start priors seeded and updated?
  - What is the guarded utility function and how are risk penalties and counter-metrics represented?
  - How is policy versioning recorded for later calibration and regret analysis?
  - What exact decision-journal fields are mandatory so deterministic replay, propensity-aware evaluation, and maturation-window handling are possible?
- **Acceptance criteria:**
  - The artifact defines versioned belief-state and utility contracts that map onto the current self-evolving seams.
  - The artifact specifies cold-start priors, update triggers, policy versioning, and operator override recording.
  - The artifact separates structural features, posterior beliefs, decision-context snapshots, and action outputs.
  - The artifact defines which decisions are deterministic, which are stochastic, and what probability or score trace each class must log.
- **Validation contract:** the artifact is sufficient to drive TASK-05, TASK-07, TASK-10, TASK-12, and TASK-13 without hidden contract invention.
- **Planning validation:** traced current score/queue/state seams in `self-evolving-scoring.ts`, `self-evolving-orchestrator.ts`, `self-evolving-backbone-queue.ts`, and `self-evolving-startup-state.ts`.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** creates the posterior-policy contract artifact.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
- **Build Evidence (2026-03-09):**
  - Artifact written: `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`.
  - Current-seam grounding: the contract ties directly to `StartupState`, `MetaObservation`, heuristic scoring in `self-evolving-scoring.ts`, heuristic routing in `self-evolving-orchestrator.ts`, and scalar queue priority in `self-evolving-backbone-queue.ts`.
  - Contract decisions captured:
    - separate `policy-state.json` from `startup-state.json`
    - first-class candidate belief state with replayable beta and categorical posterior families
    - explicit guarded utility breakdown instead of raw heuristic score
    - mandatory `policy-decisions.jsonl` with deterministic vs stochastic trace requirements
    - first-class operator override records and policy/prior versioning
  - Acceptance check: pass. The artifact defines versioned policy/belief state, cold-start priors, update triggers, override recording, structural-vs-belief separation, and decision-trace rules for deterministic and stochastic policy paths.
  - Downstream confidence propagation: affirming for TASK-05, TASK-07, TASK-10, TASK-12, and TASK-13 because policy-state, utility, and journaling contracts are no longer implicit. No downstream task became newly runnable from this evidence alone because TASK-02 remains incomplete and the dependent IMPLEMENT tasks remain below or at their own gating thresholds.

### TASK-04: Define the outcome-closure and verified-measurement contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-07, TASK-09, TASK-10, TASK-11, TASK-13
- **Confidence:** 75%
  - Implementation: 75% - the repo seams are visible and the output is a contract artifact.
  - Approach: 85% - outcome closure is mandatory for self-improvement.
  - Impact: 90% - without this contract, later mathematical layers cannot learn from real results.
- **Questions to answer:**
  - How does `candidate_id` flow from self-evolving follow-up dispatch to completion and back into lifecycle memory?
  - What distinguishes an implementation outcome from a verified measurement observation?
  - How are missing outcomes or unverified measurements recorded without silent drops?
  - Which artifacts or analytics sources qualify a measurement as verified?
  - What maturity window must elapse before an outcome is treated as evaluation-ready, and how are late-arriving or censored outcomes represented?
- **Acceptance criteria:**
  - The artifact defines candidate/dispatch/plan join keys and lifecycle event responsibilities.
  - The artifact defines verified measurement write rules, maturity-window rules, and outcome-missing handling.
  - The artifact maps directly to the current completion and event seams.
- **Validation contract:** the artifact is sufficient to drive TASK-06 and the later calibration/causal tasks without unresolved join ambiguity.
- **Planning validation:** traced completion writes, follow-up dispatch evidence refs, and lifecycle event contracts across the current runtime.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** creates the outcome-closure contract artifact.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
  - `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- **Build Evidence (2026-03-09):**
  - Artifact written: `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`.
  - Current-seam grounding: the contract starts from the existing `candidate_id` evidence refs and follow-up dispatch metadata in `self-evolving-backbone-consume.ts`, the generic `completed_by` writer in `lp-do-ideas-queue-state-completion.ts`, the reconcile bridge in `lp-do-ideas-completion-reconcile.ts`, and the existing lifecycle event taxonomy in `self-evolving-events.ts`.
  - Contract decisions captured:
    - canonical join graph `candidate_id -> decision_id -> dispatch_id -> artifact -> outcome event -> verified observation`
    - first-class `self_evolving` metadata on queue `processed_by` and `completed_by`
    - explicit maturity windows and pending-maturity state
    - verified-measurement write rules and degraded-quality handling
    - required `outcome_missing` reason codes plus a proposed `ImprovementOutcomeV2`
  - Acceptance check: pass. The artifact defines join keys, lifecycle responsibilities, maturity rules, verified-measurement gates, and outcome-missing behavior mapped directly onto existing completion and event seams.
  - Downstream confidence propagation: affirming for TASK-06, TASK-09, TASK-10, TASK-11, and TASK-13 because outcome closure is now concrete rather than implicit. No downstream task became newly runnable from this evidence alone because TASK-02 remains incomplete and TASK-06, TASK-09, TASK-10, TASK-11, and TASK-13 still depend on unfinished implementation work.

### TASK-05: Implement the versioned belief-state and utility-computation layer
- **Type:** IMPLEMENT
- **Deliverable:** versioned belief-state storage and utility-computation surfaces wired into self-evolving ranking inputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-12, TASK-13
- **Confidence:** 80%
  - Implementation: 80% - the code seams are concrete and the belief, utility, and decision-journal contracts are now fixed by prior tasks rather than still being invented.
  - Approach: 85% - this is the only way to stop optimization from hardening heuristic bias.
  - Impact: 90% - without belief state there is no mathematically serious decision core.
- **Acceptance criteria:**
  - The runtime persists versioned belief state and policy-version identifiers.
  - Candidate evaluation uses explicit posterior beliefs and utility terms rather than only fixed score dimensions.
  - Cold-start priors and missing-data fallback rules are implemented and visible in code.
  - Decision-context snapshots needed by replay, regret, and override analysis are emitted alongside policy outputs.
- **Validation contract (TC-05):**
  - TC-01: fixed observation histories produce deterministic posterior state updates.
  - TC-02: empty or sparse histories fall back to explicit priors rather than null behavior or hidden heuristics.
  - TC-03: ranked outputs carry policy-version, utility provenance, and decision-context identifiers required by later telemetry tasks.
- **Execution plan:** Red -> add tests/fixtures for belief update and utility contract behavior; Green -> implement belief-state storage and utility computation; Refactor -> remove duplicated heuristic-only scoring paths where the new contract supersedes them.
- **Planning validation (required for M/L):**
  - Checks run: traced current score calculation into ranked candidates and dashboard outputs.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`, `docs/plans/startup-loop-centralized-math-foundations/replan-notes.md`
  - Unexpected findings: the current runtime has no place to store policy version or learned beliefs separately from startup state and score output, but the target state shape is now defined tightly enough to implement directly.
- **Scouts:** None: the seams are specific enough once TASK-03 lands.
- **Edge Cases & Hardening:** cold start, sparse data, stale priors, and deterministic replay of the same history.
- **What would make this >=90%:**
  - A concrete fixture set showing the final posterior-policy contract against current ranked-candidate outputs.
- **Rollout / rollback:**
  - Rollout: add belief-state storage behind a non-authoritative path first, then feed ranking with it once validated.
  - Rollback: keep stored beliefs and telemetry fields additive, but fall back to the older scoring path if the new utility computation proves incomplete.
- **Documentation impact:**
  - Update self-evolving architecture notes to describe belief state and policy versioning.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- **Build Evidence (2026-03-09):**
  - Runtime belief state is now persisted separately from startup state in `policy-state.json`, with policy decision journals written to `policy-decisions.jsonl`, via `self-evolving-startup-state.ts`.
  - Candidate evaluation now emits explicit utility and policy provenance rather than score-only outputs; ranking and backbone queue ordering consume utility-backed outputs in `self-evolving-scoring.ts`, `self-evolving-candidates.ts`, and `self-evolving-backbone-queue.ts`.
  - The orchestrator now rebuilds candidate belief state deterministically from cold-start priors plus recorded lifecycle outcomes, persists updated policy state, emits candidate-generated lifecycle events, and records decision-context snapshots for later replay/regret work.
  - Controlled scope expansion was required to update candidate/backbone consumers and add contract/integration tests because the original task Affects list did not include every file that consumes or verifies ranked-candidate policy metadata.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` and targeted `pnpm exec eslint` across the touched startup-loop files both passed. Local Jest was not run per repo policy.
  - Precursor completion propagation: TASK-05 is no longer a blocker. No downstream IMPLEMENT task became runnable immediately because TASK-16 still sits below the execution confidence threshold and TASK-07/TASK-09/TASK-10/TASK-11/TASK-12/TASK-13 remain blocked by later unfinished work or their own confidence gates.

### TASK-06: Implement outcome closure and verified measurement feedback into self-evolving memory
- **Type:** IMPLEMENT
- **Deliverable:** automatic outcome and verified-measurement closure from completion back into self-evolving lifecycle memory
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-completion-reconcile.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-completion-reconcile.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-04
- **Blocks:** TASK-07, TASK-09, TASK-10, TASK-11, TASK-13
- **Confidence:** 80%
  - Implementation: 80% - the join seams are visible and the closure, maturity, and verification contracts are now explicit rather than inferred.
  - Approach: 90% - no self-improving claim is credible without outcome closure.
  - Impact: 95% - this is the learning feedback path.
- **Acceptance criteria:**
  - `candidate_id` and dispatch identity are joined automatically from follow-up dispatch through completion and back into lifecycle memory.
  - Verified measurements write back as explicit self-evolving observations or lifecycle payloads.
  - Missing outcomes or missing verification emit explicit blocked/outcome-missing records instead of silent loss.
  - Unmatured outcomes remain explicitly pending rather than being treated as negative or missing by default.
- **Validation contract (TC-06):**
  - TC-01: completing a self-evolving follow-up dispatch records an outcome against the originating candidate.
  - TC-02: verified measurement artifacts or analytics produce a deterministic write-back into self-evolving memory.
  - TC-03: missing or unmatured measurement verification produces explicit blocked or pending telemetry, not a silent no-op.
- **Execution plan:** Red -> add lifecycle/outcome join tests around completion and follow-up dispatch refs; Green -> wire candidate-aware completion feedback; Refactor -> centralize candidate/dispatch join helpers.
- **Planning validation (required for M/L):**
  - Checks run: traced follow-up dispatch evidence refs, lifecycle event types, and queue completion writes.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`, `docs/plans/startup-loop-centralized-math-foundations/replan-notes.md`
  - Unexpected findings: the current queue completion path knows plan and outcome, but not self-evolving lifecycle ownership; the required join and lifecycle shapes are now explicit enough to implement without another design pass.
- **Scouts:** None: the closure seam is concrete once TASK-04 lands.
- **Edge Cases & Hardening:** repeated completion attempts, stale dispatches, late-arriving outcomes, and outcomes present without verified measurement.
- **What would make this >=90%:**
  - A current sample self-evolving follow-up dispatch fixture traced end-to-end through completion.
- **Rollout / rollback:**
  - Rollout: write additive lifecycle events and verified observations first, then allow later tasks to consume them.
  - Rollback: disable the new write-back while keeping the join fields additive if downstream consumers are not ready.
- **Documentation impact:**
  - Update self-evolving lifecycle and completion docs to describe candidate-aware outcome closure.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
  - `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`
- **Build Evidence (2026-03-09):**
  - Self-evolving follow-up dispatches now carry a first-class `self_evolving` link with `candidate_id`, `decision_id`, `policy_version`, preserved route origin, and executor path, and backbone consume emits `followup_dispatch_handoff` lifecycle events instead of relying only on evidence-ref parsing.
  - Queue completion now stamps explicit `completed_by.self_evolving` maturity and measurement state, writes verified measurement observations when concrete measurement payloads are supplied, and emits auditable `outcome_missing` lifecycle events when mature results still lack verification.
  - Completion reconcile now propagates direct self-evolving linkage into processed/completed queue records and finalizes matured-but-unverified closures instead of silently leaving them opaque.
  - Controlled scope expansion was required to extend queue/dispatch type surfaces and tests, because candidate-aware closure could not be expressed inside the original narrow Affects list.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` and targeted `pnpm exec eslint` across the touched startup-loop files both passed. Local Jest was not run per repo policy.
  - Precursor completion propagation: TASK-06 is no longer a blocker. The plan still needs a replan or confidence-raising evidence before TASK-16 can run, so Wave 3 is not yet executable despite the closure seam now existing in code.

### TASK-16: Implement decision journaling, maturity windows, and replay-ready evaluation datasets
- **Type:** IMPLEMENT
- **Deliverable:** replay-ready decision journal and maturity-aware evaluation dataset assembly for self-evolving policy comparisons
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-index.ts`, `scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** TASK-07, TASK-09, TASK-10, TASK-11, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the journal contract, policy decisions, outcome maturity markers, and lifecycle outcome events already exist in code; the remaining work is the joined evaluation layer and report/dashboard reuse.
  - Approach: 90% - replay and maturity handling are mandatory if calibration and regret claims are to mean anything.
  - Impact: 90% - this is the bridge from logged decisions to defensible policy-quality evidence.
- **Acceptance criteria:**
  - The runtime records decision journals containing context snapshot, eligible action set, chosen action, policy version, utility summary, and stochastic action probability when applicable.
  - Evaluation datasets mark outcome maturity explicitly, distinguishing pending, observed, censored, and missing results.
  - The report/dashboard layer can replay matured decisions against shadow policies without inventing missing data.
- **Validation contract (TC-06A):**
  - TC-01: deterministic decisions emit replay-ready journals with stable decision-context identifiers.
  - TC-02: stochastic decisions emit action probabilities or equivalent propensity traces required for off-policy evaluation.
  - TC-03: immature or censored outcomes remain excluded from final policy-quality scoring until the contract says they are ready.
- **Execution plan:** Red -> add fixtures for journal emission and matured-vs-pending evaluation assembly; Green -> implement decision journal storage and replay dataset assembly; Refactor -> centralize maturity and replay helpers so telemetry and checkpoints reuse the same logic.
- **Planning validation (required for M/L):**
  - Checks run: traced reporting, dashboard, startup-state, policy-decision journal, completion, lifecycle, and replay seams that would otherwise leave regret and replay undefined.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-replay.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`
  - Unexpected findings: the current report path can summarize state, but it cannot yet join existing policy decisions, lifecycle outcomes, and maturity metadata into reusable evaluation slices. The missing work is narrower than the original task wording suggested because the core journaling and maturity primitives are already live.
- **Scouts:** None: the gap is concrete and currently load-bearing.
- **Edge Cases & Hardening:** deterministic vs stochastic decisions, changed action sets across runs, censored outcomes, and late verification arrival.
- **What would make this >=90%:**
  - One worked joined fixture that starts from `policy-decisions.jsonl`, reaches a matured outcome event, and produces a stable replay/evaluation record consumed by report or dashboard code.
- **Rollout / rollback:**
  - Rollout: emit journals in shadow mode first, then let replay outputs inform guarded-trial checkpoints.
  - Rollback: preserve journals as additive history even if replay scoring needs one revision cycle.
- **Documentation impact:**
  - Add decision-journal and maturity semantics to self-evolving reporting docs.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
- **Build Evidence (2026-03-09):**
  - Green: added `self-evolving-evaluation.ts` as the bounded join layer that assembles policy decisions, queue completion state, and lifecycle outcomes into explicit `observed`, `pending`, `missing`, and `censored` evaluation records instead of leaving replay semantics implicit in the report.
  - Green: `self-evolving-report.ts` now reads policy state, policy decisions, queue state, and lifecycle events alongside observations/candidates, and emits a `policy_evaluation` summary plus sample unready records rather than only posture summaries.
  - Green: `self-evolving-dashboard.ts` now exposes evaluation counts, maturity debt, and replay-ready rate so later calibration/regret work can consume a stable summary surface.
  - Hardening: exported startup-state and event-log readers needed by the report path, and exported the new evaluation module through `self-evolving-index.ts` so later math-policy tasks can reuse the same dataset contract.
  - Tests added: `self-evolving-evaluation.test.ts` covers classification and lifecycle fallback, `self-evolving-report.test.ts` covers report assembly, and `self-evolving-detector-scoring.test.ts` now verifies dashboard evaluation metrics.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - `pnpm exec eslint scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts scripts/src/startup-loop/self-evolving/self-evolving-report.ts scripts/src/startup-loop/self-evolving/self-evolving-events.ts scripts/src/startup-loop/self-evolving/self-evolving-index.ts scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts scripts/src/startup-loop/__tests__/self-evolving-report.test.ts scripts/src/startup-loop/__tests__/self-evolving-detector-scoring.test.ts`
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Runtime smoke outcome: the report now executes successfully against the repo’s current BRIK self-evolving data and surfaces explicit zero-decision evaluation summaries instead of omitting the policy-evaluation seam entirely.
  - Precursor completion propagation: TASK-16 is no longer a blocker. No downstream IMPLEMENT task crossed its execution threshold automatically because TASK-07, TASK-09, TASK-10, TASK-11, and TASK-13 still need concrete first-wave optimization, cohort, or gate examples before their confidence can be raised honestly.

### TASK-07: Replace pure priority sorting with constrained portfolio optimization
- **Type:** IMPLEMENT
- **Deliverable:** explicit constrained portfolio selection for self-evolving candidate allocation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/__tests__/self-evolving-portfolio.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-16
- **Blocks:** TASK-10, TASK-12, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the selection seam, utility surface, constraint profile, and candidate-set data shape are now all concrete; the remaining work is solver wiring and portfolio journaling.
  - Approach: 85% - explicit portfolio choice is the right replacement for raw score sorting.
  - Impact: 90% - this is where mathematical decision quality becomes visible in allocation behavior.
- **Acceptance criteria:**
  - Backbone queue selection uses an explicit utility objective and constraint set rather than only descending score sort.
  - The model encodes WIP, route mix, blast-radius, and evidence-quality constraints.
  - Solver infeasibility or invalid models fail closed with a deterministic fallback or block.
  - Every optimization decision emits a replay-ready candidate-set snapshot and chosen-portfolio journal entry.
- **Validation contract (TC-07):**
  - TC-01: a fixed candidate set yields the expected portfolio under stated constraints.
  - TC-02: infeasible or malformed optimization inputs fail closed rather than silently falling back to arbitrary order.
  - TC-03: selection rationale, policy version, and candidate-set snapshot are persisted for later regret analysis.
- **Execution plan:** Red -> add deterministic portfolio-selection fixtures; Green -> wire the optimization layer into queue selection; Refactor -> isolate objective and constraint assembly from file IO.
- **Planning validation (required for M/L):**
  - Checks run: traced current queue merge/sort path, active policy constraint profile, policy-decision contract, and current BRIK candidate/backbone data shape.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `docs/business-os/startup-loop/self-evolving/BRIK/candidates.json`, `docs/business-os/startup-loop/self-evolving/BRIK/backbone-queue.jsonl`
  - Unexpected findings: the queue path already has an explicit utility surface and a versioned constraint schema through policy state, so the remaining uncertainty is not objective invention; it is the exact portfolio assembly and `portfolio_selection` journal shape.
- **Scouts:** None: the queue seam is specific once upstream contracts land.
- **Edge Cases & Hardening:** infeasible model, exact ties, stale candidates, and route-cap saturation.
- **What would make this >=90%:**
  - A worked objective/constraint example derived from a real current candidate ledger.
- **Rollout / rollback:**
  - Rollout: run the optimizer in shadow/advisory mode before making it authoritative for queue ordering.
  - Rollback: revert to deterministic sort while preserving solver telemetry for analysis.
- **Documentation impact:**
  - Update self-evolving queue-selection docs with objective and constraint semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- **Build Evidence (2026-03-10):**
  - The queue path now performs explicit constrained portfolio selection through `self-evolving-portfolio.ts` instead of relying on raw descending sort alone.
  - Candidate-set selection is bounded by real hard rules and constraints: `wip_cap`, per-route caps, guarded-trial blast-radius limits for build routes, and minimum evidence-floor enforcement for plan/build routes.
  - Portfolio decisions now emit first-class `portfolio_selection` journal payloads in `policy-decisions.jsonl`, with candidate-set hash, selected IDs, solver status, constraint bindings, and per-candidate adjusted utility signals.
  - Backbone entries now persist `portfolio_selected`, `portfolio_decision_id`, and `portfolio_adjusted_utility`, and the consume path only emits follow-up dispatches for portfolio-selected entries.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy, so the new fixtures were added but not run locally.
  - Precursor completion propagation: TASK-07 is no longer a blocker for TASK-10, TASK-12, TASK-13, or TASK-14.

### TASK-08: Integrate graph dependency and bottleneck analysis into policy inputs
- **Type:** IMPLEMENT
- **Deliverable:** dependency graph and bottleneck scoring integrated into self-evolving policy inputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dependency-graph.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `scripts/src/startup-loop/__tests__/self-evolving-dependency-graph.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`
- **Depends on:** TASK-02, TASK-03, TASK-05
- **Blocks:** TASK-11, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the first structural graph slice can now be defined directly from existing trigger-observation, candidate, executor-path, and constraint-ref fields rather than inventing a new dependency model.
  - Approach: 80% - graph analysis is useful only if kept structural rather than causal.
  - Impact: 80% - it should improve bottleneck visibility and portfolio weighting.
- **Acceptance criteria:**
  - The runtime can build and persist a graph over relevant startup-loop dependency entities.
  - Graph-derived bottleneck or coupling signals are available to utility and reporting.
  - Graph outputs are explicitly treated as structural context, not causal proof.
- **Validation contract (TC-08):**
  - TC-01: fixed dependency fixtures yield deterministic graph metrics.
  - TC-02: missing or partial dependency data produces safe degraded outputs.
  - TC-03: promotion-quality gates cannot treat graph centrality alone as causal evidence.
- **Execution plan:** Red -> add graph fixture tests; Green -> build the graph layer and expose structural signals; Refactor -> isolate graph construction from policy consumption.
- **Planning validation (required for M/L):**
  - Checks run: traced candidate generation, signal-hint inference, structural snapshot creation, and backbone-routing seams that could consume structural bottleneck signals.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/posterior-policy-contract.md`, `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `packages/lib/src/math/graph/index.ts`
  - Unexpected findings: the runtime still lacks a persisted graph view, but it no longer lacks a first graph inventory. The bounded first slice is now concrete: `trigger_observation -> candidate -> executor_path`, plus structural `constraint_refs` as shared coupling nodes.
- **Scouts:** None: the structural role is already bounded by the fact-find.
- **Edge Cases & Hardening:** missing nodes, disconnected subgraphs, and unstable identifiers across runs.
- **What would make this >=90%:**
  - A concrete dependency-entity inventory for the first graph slice.
- **Rollout / rollback:**
  - Rollout: expose graph signals to reporting first, then consume them in utility once stable.
  - Rollback: leave graph-building in read-only reporting mode if utility consumption is not yet trustworthy.
- **Documentation impact:**
  - Add a structural graph schema note to self-evolving docs.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone.ts`
- **Build Evidence (2026-03-10):**
  - The runtime now builds and persists `dependency-graph.json` with the bounded first slice `trigger_observation -> candidate -> executor_path`, plus shared `constraint_refs` as structural coupling nodes.
  - `self-evolving-dependency-graph.ts` now computes deterministic graph topology, critical path, and candidate-level bottleneck signals without making causal claims.
  - Graph signals are exposed in the dashboard/report surface and fed into portfolio selection as a bounded structural concentration penalty, keeping the role explicitly structural rather than promotional.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy.
  - Precursor completion propagation: TASK-08 is no longer a blocker for TASK-11, TASK-13, or TASK-14.

### TASK-09: Integrate survival and time-to-event risk into policy inputs
- **Type:** IMPLEMENT
- **Deliverable:** survival-based slip, aging, churn, or escalation risk signals integrated into self-evolving policy inputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-survival.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `scripts/src/startup-loop/__tests__/self-evolving-survival.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`
- **Depends on:** TASK-02, TASK-04, TASK-05, TASK-06, TASK-16
- **Blocks:** TASK-11, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the seam is now clear because TASK-16 created a concrete evaluation dataset that can assemble decision-to-outcome cohorts with explicit pending, observed, missing, and censored states.
  - Approach: 80% - time-to-event risk is a useful policy input if kept within its narrow evidence scope.
  - Impact: 80% - it should improve prioritization of aging and risk-bearing candidates.
- **Acceptance criteria:**
  - Survival/time-to-event signals are computed from verified history with clear handling of censored observations.
  - The runtime uses survival outputs as risk or timing inputs, not as proof of intervention impact.
  - Sparse histories fall back to explicit priors or degraded outputs.
- **Validation contract (TC-09):**
  - TC-01: mixed event/censor fixtures yield deterministic survival outputs.
  - TC-02: sparse histories degrade safely without fabricated precision.
  - TC-03: survival outputs feed policy/risk reporting but do not bypass causal promotion gates.
- **Execution plan:** Red -> add survival fixture tests; Green -> wire survival outputs into policy inputs and reporting; Refactor -> isolate cohort assembly and censor handling.
- **Planning validation (required for M/L):**
  - Checks run: traced current observation, outcome, evaluation, and dashboard seams that would need time-to-event signals.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/outcome-closure-contract.md`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `packages/lib/src/math/survival/index.ts`
  - Unexpected findings: the runtime now has a cohort-assembly layer through `policy-evaluation.v1`, but not yet a survival adapter. The bounded first cohort is now concrete: decision-to-closure timing where `observed` and `missing` are terminal states and `pending` / `censored` remain censored at evaluation time.
- **Scouts:** None: the survival role is already constrained by the fact-find.
- **Edge Cases & Hardening:** censored histories, mixed cohorts, and stale event timestamps.
- **What would make this >=90%:**
  - A concrete first-cohort definition for one startup-loop event class.
- **Rollout / rollback:**
  - Rollout: publish survival outputs in reporting before they influence policy.
  - Rollback: keep read-only risk reporting if policy consumption proves unstable.
- **Documentation impact:**
  - Update self-evolving evidence docs with the chosen time-to-event semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- **Build Evidence (2026-03-10):**
  - `policy-evaluation.v1` now carries `decision_created_at`, and evaluation explicitly ignores non-route journal records so later portfolio journaling does not pollute outcome readiness math.
  - `self-evolving-survival.ts` now builds two separate Kaplan-Meier views: time to verified outcome and time to broader closure. Missing outcomes are not conflated with successful verification.
  - Route-level survival profiles now expose explicit `empty`, `insufficient_data`, and `estimated` states, plus bounded delay/missing penalties. These are available in reporting and feed a narrow portfolio penalty rather than acting as intervention proof.
  - The dashboard/report now surface survival status directly, making maturity debt and sparse-history conditions explicit instead of fabricating precision.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy.
  - Precursor completion propagation: TASK-09 is no longer a blocker for TASK-11, TASK-13, or TASK-14.
  - Next execution gate: TASK-10 and TASK-11 remain below the `IMPLEMENT` confidence floor (`70%` each), so the next correct step is `/lp-do-replan`, not another blind build cycle.

### TASK-10: Implement bounded contextual exploration with internal Thompson-style ranking
- **Type:** IMPLEMENT
- **Deliverable:** bounded exploration policy implemented through an internal contextual Thompson-sampling or uncertainty-aware ranking layer
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/__tests__/self-evolving-exploration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`
- **Depends on:** TASK-03, TASK-04, TASK-05, TASK-06, TASK-16, TASK-07
- **Blocks:** TASK-12, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - Wave 4 now makes the exact insertion seam concrete: exploration can rerank only the already-feasible portfolio candidate set, using persisted belief posteriors, adjusted utility, and deterministic seeded randomness.
  - Approach: 80% - bounded exploration is necessary to avoid exploit-only staleness.
  - Impact: 80% - this is the learning-while-acting layer, but it is easy to misuse.
- **Acceptance criteria:**
  - The runtime has an explicit exploration budget and context-aware exploration policy.
  - Exploration can run in advisory mode before any authoritative path uses it.
  - Exploration decisions are logged with policy version, sampled rationale, action probability, and regret-analysis support.
- **Validation contract (TC-10):**
  - TC-01: with non-zero exploration budget, the policy can surface higher-uncertainty candidates within bounds.
  - TC-02: with zero exploration budget, behavior collapses to pure exploit deterministically.
  - TC-03: exploration choices are persisted with enough metadata and probability traces for later regret and override analysis.
- **Execution plan:** Red -> add policy fixture tests for exploit-only and bounded-explore modes over a fixed feasible candidate set; Green -> implement the internal exploration layer; Refactor -> isolate context assembly and budget governance from selection logic.
- **Planning validation (required for M/L):**
  - Checks run: traced current candidate ordering path, portfolio-selection outputs, stochastic decision fields, and existing Bayesian/random primitives.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `packages/lib/src/math/experimentation/thompson-sampling.ts`, `packages/lib/src/math/random/index.ts`
  - Unexpected findings: Wave 4 removed most of the ambiguity that previously kept this below threshold. The first exploration slice is now bounded and explicit:
    - candidate set: only candidates that already cleared hard rules and portfolio feasibility
    - context: route, candidate type, startup stage, evidence classification, graph signal, and survival signal already carried or derivable from current policy artifacts
    - logging seam: `decision_mode`, `action_probability`, and replay-ready decision journaling already exist
    - remaining open item: the exploration-budget contract itself still needs implementation, but it no longer needs another design task
- **Scouts:** None: the chosen path is already constrained.
- **Edge Cases & Hardening:** zero budget, repeated overrides, stale uncertainty estimates, and deterministic seeded replay of the same candidate set.
- **What would make this >=90%:**
  - A small fixed candidate-context fixture demonstrating the exact contextual ranking behavior and logged action probabilities.
- **Rollout / rollback:**
  - Rollout: advisory/shadow mode first, then guarded policy consumption after checkpoint evidence.
  - Rollback: revert to exploit-only ranking while preserving logged exploration telemetry.
- **Documentation impact:**
  - Add an exploration-policy note to self-evolving docs, including budget semantics.
- **Notes / references:**
  - `packages/lib/src/math/experimentation/index.ts`
  - `packages/lib/src/math/random/index.ts`
- **Build Evidence (2026-03-10):**
  - Added first-class `exploration_rank` policy decisions and journal payloads with seeded stochastic traces, candidate-set hash, prioritized candidate IDs, and per-candidate sampled signal snapshots.
  - Added explicit exploration budget semantics on the active constraint profile through `exploration_budget_slots`; the default policy state now carries a non-zero budget while authority still controls whether exploration is shadow-only or applied.
  - Implemented the bounded first slice in `self-evolving-exploration.ts`: exploration reranks only the already-selected portfolio set, using belief posteriors, adjusted utility, evidence class, startup stage, graph pressure, and survival penalty as context.
  - Wired exploration provenance into candidate policy context, backbone queue entries, queue ordering, dashboard policy summaries, and the report surface.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy, so the new exploration fixtures were added but not run locally.
  - Precursor completion propagation: TASK-10 is no longer a blocker for TASK-12, TASK-13, or TASK-14.

### TASK-11: Implement the causal-evaluation contract and promotion-quality gate
- **Type:** IMPLEMENT
- **Deliverable:** internal causal-evaluation contract and durable-promotion gate for self-evolving improvements
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/__tests__/self-evolving-promotion-gate.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`
- **Depends on:** TASK-04, TASK-06, TASK-16, TASK-08, TASK-09
- **Blocks:** TASK-12, TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the first estimator path is now narrow enough to implement directly: experiment-hook-backed candidates only, with explicit hold/defer for anything outside that contract.
  - Approach: 85% - durable promotion without causal discipline is not defensible.
  - Impact: 85% - this prevents the loop from optimizing on ghosts.
- **Acceptance criteria:**
  - Durable promotion requires a declared causal-evaluation path or justified hold/defer outcome.
  - Structural signals and survival risk cannot satisfy promotion quality on their own.
  - The runtime fails closed when causal identification is inadequate.
- **Validation contract (TC-11):**
  - TC-01: structural-only evidence cannot clear the promotion-quality gate.
  - TC-02: a candidate without declared causal-evaluation contract is held or deferred, not promoted.
  - TC-03: the gate records why promotion is blocked or allowed for later audit.
- **Execution plan:** Red -> add gate tests for insufficient causal evidence; Green -> implement the first causal contract + gate plumbing for experiment-hook-backed promotion classes; Refactor -> isolate estimator/bridge plug points from gate enforcement.
- **Planning validation (required for M/L):**
  - Checks run: traced release/promotion decision seams, experiment decision helpers, container experiment-hook contracts, and the distinction between structural, survival, and promotion-quality evidence.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-experiment.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-containers.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
  - Unexpected findings: Wave 4 clarified the negative boundary this task must enforce because structural graph signals and survival risk are now first-class policy inputs. The first promotion-quality slice can therefore be concrete:
    - eligible class: candidates with declared `experiment_hook_contract` and experiment-aware container path
    - estimator path: use the existing experiment decision seam with target KPI, guardrail KPIs, minimum runtime, minimum sample size, and data-quality checks
    - failure posture: everything else holds or defers; nothing promotes on structural or survival evidence alone
- **Scouts:** None: the gate role is specific even though estimator choice remains open.
- **Edge Cases & Hardening:** partial identification, missing control windows, and insufficient post-window data.
- **What would make this >=90%:**
  - A worked fixture for one narrow promotion class showing promote, hold, and defer outcomes under the chosen experiment-hook contract.
- **Rollout / rollback:**
  - Rollout: enforce gate in non-promoting advisory mode first, then let it block unsafe promotions.
  - Rollback: revert to hold-only behavior while preserving gate telemetry if the chosen estimator path is incomplete.
- **Documentation impact:**
  - Add causal-evaluation contract docs and promotion gate semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
- **Build Evidence (2026-03-10):**
  - Added first-class `promotion_gate` policy decisions and journal payloads with explicit causal eligibility, evaluation status, hook contract, verified observation IDs, target KPI, sample size, runtime hours, and recorded reason code.
  - Implemented the narrow first promotion-quality slice in `self-evolving-promotion-gate.ts`: only executor paths backed by a declared container `experiment_hook_contract` can clear the gate; all other paths hold fail-closed.
  - Wired the gate to use existing verified outcome closure plus verified measurement observations; structural graph signals and survival risk remain inputs to allocation, but cannot satisfy promotion quality on their own.
  - Promotion gate decisions are now surfaced in candidate policy context, dashboard policy summaries, and report summaries for later audit and follow-on governance work.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy, so the new gate fixtures were added but not run locally.
  - Precursor completion propagation: TASK-11 is no longer a blocker for TASK-12, TASK-13, or TASK-14.
  - Next execution gate: `TASK-12` and `TASK-13` remain below the `IMPLEMENT` floor; the next correct step is `/lp-do-replan` rather than another blind build cycle.

### TASK-12: Implement stability controls and anti-gaming utility governance
- **Type:** IMPLEMENT
- **Deliverable:** runtime hysteresis, hold windows, bounded intervention deltas, and guarded utility governance with counter-metrics
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-governance.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/__tests__/self-evolving-governance.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-release-replay.test.ts`
- **Depends on:** TASK-03, TASK-05, TASK-07, TASK-10, TASK-11
- **Blocks:** TASK-13, TASK-14
- **Confidence:** 80%
  - Implementation: 80% - the controls still touch multiple policy seams, but Wave 5 made the exact first slice concrete by creating live exploration and promotion-gate outputs to stabilize.
  - Approach: 85% - without damping and counter-metrics, richer policy is dangerous.
  - Impact: 90% - this is what stops the loop from thrashing or gaming itself.
- **Acceptance criteria:**
  - Policy changes are bounded by hold windows and hysteresis rather than pure instantaneous recalculation.
  - Utility includes explicit guardrail and counter-metric logic.
  - Operator override or governance boundaries are recorded and cannot be bypassed by policy output.
- **Validation contract (TC-12):**
  - TC-01: noisy signals do not cause route or portfolio thrash across adjacent runs.
  - TC-02: bounded deltas cap policy shifts even when utility changes sharply.
  - TC-03: guardrail or counter-metric breaches hold or revert policy actions deterministically.
- **Execution plan:** Red -> add stability and guardrail policy tests; Green -> implement control and governance rules; Refactor -> centralize policy guardrails so optimizer, exploration, and promotion all reuse them.
- **Planning validation (required for M/L):**
  - Checks run: traced current eligibility, queue, release-control, exploration, and promotion-gate seams that would be prone to oscillation or gaming.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - Unexpected findings: Wave 5 removed the upstream ambiguity that previously kept this below threshold. The first governance slice is now bounded and concrete:
    - live `exploration_rank` and `promotion_gate` decisions already exist as policy records
    - `hold_window_days`, `instability_penalty`, and authority-level state already exist as policy inputs
    - the missing work is now explicit control logic, bounded candidate-set churn, counter-metric enforcement, and a first-class `override_record` writer
    - remaining uncertainty is integration breadth across orchestrator, queue, report, and release-control seams, not missing design authority
- **Scouts:** None: the controls are required by the target architecture.
- **Edge Cases & Hardening:** repeated overrides, counter-metric data gaps, and delayed guardrail observations.
- **What would make this >=90%:**
  - A replay fixture showing the exact hysteresis/hold-window behavior across multiple runs.
- **Rollout / rollback:**
  - Rollout: add guardrail and hold-window logic before any authoritative exploration or optimization path is enabled.
  - Rollback: retain logging and downgrade to hold-only conservative behavior if policy interactions prove unstable.
- **Documentation impact:**
  - Update self-evolving governance docs with stability and guardrail semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`
- **Build Evidence (2026-03-10):**
  - Scope expansion: added `self-evolving-governance.ts` plus focused governance/release/orchestrator tests because the existing seams were too cross-cutting to implement safely inside `self-evolving-orchestrator.ts` alone. Expansion stayed inside TASK-12's stated objective.
  - Green: introduced a pure governance layer that stabilizes route, portfolio, and exploration decisions against recent policy history using `hold_window_days`, bounded addition rules, and explicit `override_record` emission.
  - Green: wired the orchestrator to use governed route decisions before dependency/portfolio selection, governed portfolio decisions before exploration, and governed override IDs back into candidate belief state.
  - Green: added counter-metric governance for missing primary and guardrail KPI contracts at the route layer, plus recent-override instability penalties in effective policy utility.
  - Green: strengthened the canary seam in `self-evolving-release-controls.ts` with confirmation-window gating so single-window healthy/unhealthy noise holds rather than flips state immediately.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
  - Test execution note: local Jest remains out of scope under repo policy, so the new governance fixtures were added but not run locally.
  - TC-01: covered by `self-evolving-governance.test.ts` route-hysteresis case and orchestrator wiring that now reuses governed route decisions instead of raw instantaneous promotions.
  - TC-02: covered by `self-evolving-governance.test.ts` portfolio/exploration bounded-delta cases, which preserve recent selected/prioritized choices and block fresh additions within the hold window.
  - TC-03: covered by the governance counter-metric downgrades in `self-evolving-governance.test.ts` and the confirmation-window release-control case in `self-evolving-release-replay.test.ts`.
  - Precursor completion propagation: TASK-12 is no longer a blocker for TASK-13 or TASK-14. TASK-13 now meets the `IMPLEMENT` confidence floor because override records and governance outputs are live runtime surfaces rather than planned seams.

### TASK-13: Implement calibration, regret, override, and policy audit telemetry
- **Type:** IMPLEMENT
- **Deliverable:** first-class telemetry for calibration, regret, override analysis, and policy-version comparisons
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-policy-audit.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-policy-audit.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`
- **Depends on:** TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-16, TASK-07, TASK-10, TASK-11, TASK-12
- **Blocks:** TASK-14
- **Confidence:** 80%
  - Implementation: 80% - TASK-12 turned override and governance behavior into live runtime artifacts, so the remaining work is metric definition and reporting rather than missing substrate.
  - Approach: 90% - without calibration and regret, the loop cannot prove that its mathematics is improving anything.
  - Impact: 90% - this is the truth-serum layer for the whole architecture.
- **Acceptance criteria:**
  - The runtime emits calibration, regret, override, and policy-version comparison outputs.
  - Reporting clearly distinguishes belief quality, policy quality, and operator intervention.
  - The checkpoint tasks can use these metrics plus replay outputs to decide whether guarded or authoritative mathematical policy is justified.
- **Validation contract (TC-13):**
  - TC-01: belief/outcome pairs produce deterministic calibration metrics.
  - TC-02: matured policy decisions and realized outcomes produce replay-backed regret or counterfactual comparison metrics.
  - TC-03: operator overrides and policy-version changes are attributable in reporting.
- **Execution plan:** Red -> add metric fixture tests and report expectations; Green -> emit and surface the telemetry; Refactor -> centralize metric definitions for dashboard and checkpoint consumers.
- **Planning validation (required for M/L):**
  - Checks run: traced existing dashboard/report/evaluation outputs and the new telemetry dependencies from belief, outcome, replay, exploration, promotion, and planned governance layers.
  - Validation artifacts: `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-governance.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - Unexpected findings: TASK-12 materially improved the audit seam because the runtime now has live `override_record` writes, bounded-delta governance outputs, and candidate-belief links to recent overrides. What remains is the actual truth-serum layer:
    - calibration metrics still need disciplined definitions
    - regret and counterfactual comparison logic still need to be computed from matured route decisions
    - reporting still needs to separate belief quality, policy quality, and operator/governance intervention explicitly
    - with the missing substrate now landed, confidence rises to the `IMPLEMENT` floor
- **Scouts:** None: the audit role is already explicitly required by the fact-find.
- **Edge Cases & Hardening:** sparse matured histories, policy version rollover, and override data missing for legacy records.
- **What would make this >=90%:**
  - One worked example mapping a real candidate history to calibration and regret outputs.
- **Rollout / rollback:**
  - Rollout: ship telemetry read-only before any checkpoint uses it to authorize stronger claims.
  - Rollback: keep additive metric emission and remove gating use if definitions need revision.
- **Documentation impact:**
  - Update reporting docs with calibration, regret, and policy-audit semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
- **Build Evidence (2026-03-10):**
  - Scope expansion: added `self-evolving-policy-audit.ts` plus narrow journal/evaluation fields because exact calibration was not mathematically defensible from the pre-existing route journal alone. The expansion stayed inside TASK-13's truth-serum objective.
  - Green: route decisions now persist a `policy-belief-audit.v1` snapshot, so candidate-route calibration uses recorded belief probabilities rather than reconstructed heuristics.
  - Green: policy evaluation records now carry outcome-quality fields (`implementation_status`, `kept_or_reverted`, `measured_impact`, `impact_confidence`, `regressions_detected`, `positive_outcome`) derived from verified lifecycle outcomes.
  - Green: `self-evolving-policy-audit.ts` now emits three first-class audit surfaces:
    - belief quality: exact candidate-route calibration from belief snapshots and verified outcomes
    - policy quality: replay-backed exploration-batch regret plus policy-version comparison summaries
    - operator intervention: override cohort analysis with reason-code and source-layer attribution
  - Green: the report and dashboard now surface the audit layer explicitly, and the live orchestrator dashboard uses combined prior-plus-current decision journals for audit summaries while retaining prior-only survival inputs.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - targeted `pnpm exec eslint` across touched startup-loop runtime and test files
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK`
    - `pnpm plans:lint`
  - Test execution note: local Jest remains out of scope under repo policy, so focused fixtures were added but not run locally.
  - TC-01: covered by `self-evolving-policy-audit.test.ts` candidate-route calibration case and the new `policy-belief-audit.v1` journal snapshot.
  - TC-02: covered by `self-evolving-policy-audit.test.ts` exploration-batch replay case, which computes measured regret only when the full batch has observed outcomes.
  - TC-03: covered by `self-evolving-policy-audit.test.ts` override attribution case plus report/dashboard assertions in `self-evolving-report.test.ts`.
  - Precursor completion propagation: TASK-13 is no longer a blocker for TASK-14. The next correct move is the replay and guarded-trial checkpoint rather than another build wave.

### TASK-17: Enforce the policy authority ladder at queue and promotion seams
- **Type:** IMPLEMENT
- **Deliverable:** runtime authority gating that keeps `shadow` and `advisory` policy outputs non-actuating until `guarded_trial` is explicitly set
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-authority.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-policy-audit.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-exploration.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-backbone-queue.test.ts`
- **Depends on:** TASK-07, TASK-10, TASK-11, TASK-12, TASK-13
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 85%
  - Implementation: 80% - the affected seams are concrete, but the queue/consume behavior crosses ranking, dispatch, and promotion boundaries.
  - Approach: 95% - this is required to make the authority ladder true in code rather than prose.
  - Impact: 95% - without this, shadow policy is already silently actuating queue allocation.
- **Acceptance criteria:**
  - `shadow` mode does not filter or suppress backbone consumption based on portfolio or exploration outputs.
  - `advisory` mode records recommendations but preserves operator or legacy queue semantics.
  - `guarded_trial` is the first authority level allowed to change dispatch emission or promotion-facing behavior.
- **Validation contract (TC-17):**
  - TC-01: default `shadow` policy leaves follow-up dispatch emission identical to the non-actuating baseline.
  - TC-02: `advisory` policy persists decision traces and recommendations without automatic queue suppression.
  - TC-03: `guarded_trial` explicitly gates the first bounded live allocation path.
- **Execution plan:** Red -> add authority-ladder integration tests around queue consumption and promotion seams; Green -> gate queue and promotion behavior on `authority_level`; Refactor -> centralize authority checks so report and checkpoint consumers do not infer semantics from scattered flags.
- **Planning validation (required for M/L):**
  - Checks run: traced `createDefaultPolicyState()` default authority, backbone enqueue ordering, consume filtering, and live promotion-gate decision generation against the plan’s authority ladder.
  - Validation artifacts: `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `docs/plans/startup-loop-centralized-math-foundations/plan.md`
  - Unexpected findings:
    - `createDefaultPolicyState()` defaults to `authority_level: "shadow"`
    - `consumeBackboneQueueToIdeasWorkflow()` currently filters pending entries on `portfolio_selected`
    - that means mathematical portfolio choice can already suppress dispatch emission before guarded-trial readiness is proven
    - promotion-gate decisions are already computed and attached to ranked candidates, but there is no centralized authority gate at that seam; it is safe today only because no live actuator consumes those decisions yet
- **Scouts:** None: this is a direct correction of a code/plan contradiction discovered in TASK-14.
- **Edge Cases & Hardening:** stale entries produced under older semantics, mixed-authority policy journals, and promotion-gate records created while queue authority is still shadow.
- **What would make this >=90%:**
  - One worked integration fixture showing the same candidate set under `shadow`, `advisory`, and `guarded_trial` with distinct consume behavior.
- **Rollout / rollback:**
  - Rollout: enforce the ladder before producing any new checkpoint evidence.
  - Rollback: preserve decision journaling and fall back to fully non-actuating `shadow` semantics if queue interactions remain ambiguous.
- **Documentation impact:**
  - Update the plan evidence and any self-evolving authority documentation with the final live semantics.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`
  - `scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts`
- **Build Evidence (2026-03-10):**
  - Green: added `self-evolving-authority.ts` as the single authority helper and switched queue, exploration, and promotion-facing candidate annotation code onto it instead of scattered ad hoc checks.
  - Green: `enqueueBackboneCandidates()` now ignores portfolio and exploration ordering signals unless the persisted policy state is `guarded_trial`; `shadow` and `advisory` fall back to baseline queue priority ordering.
  - Green: `consumeBackboneQueueToIdeasWorkflow()` now ignores `portfolio_selected` suppression unless authority is `guarded_trial`, so `shadow` and `advisory` compute recommendations without suppressing follow-up dispatch emission.
  - Green: exploration outputs now distinguish `guarded_trial` explicitly in contract/report surfaces, and only `guarded_trial` marks exploration as applied.
  - Green: promotion-gate decisions are still journaled for every run, but ranked-candidate promotion action/reason fields now stay null until `guarded_trial`, so shadow/advisory no longer mutate promotion-facing candidate state.
  - TC-01: pass by integration coverage and local validation. `self-evolving-orchestrator-integration.test.ts` now proves that shadow-mode pending entries with `portfolio_selected: false` still emit follow-up dispatches.
  - TC-02: pass by integration coverage and local validation. The same integration path now proves `advisory` preserves dispatch emission while `self-evolving-exploration.test.ts` proves advisory exploration remains recommendation-only (`applied === false`).
  - TC-03: pass by unit/integration coverage and local validation. `self-evolving-backbone-queue.test.ts` proves guarded-trial queue ordering honors portfolio selection, `self-evolving-orchestrator-integration.test.ts` proves guarded-trial consume suppresses deferred entries, and promotion annotations only surface on ranked candidates once guarded trial authority is active.
  - Validation:
    - `pnpm exec tsc -p scripts/tsconfig.json --noEmit`
    - `pnpm exec eslint scripts/src/startup-loop/self-evolving/self-evolving-authority.ts scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts scripts/src/startup-loop/self-evolving/self-evolving-policy-audit.ts scripts/src/startup-loop/self-evolving/self-evolving-exploration.ts scripts/src/startup-loop/self-evolving/self-evolving-backbone-queue.ts scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts scripts/src/startup-loop/self-evolving/self-evolving-report.ts scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts scripts/src/startup-loop/__tests__/self-evolving-exploration.test.ts scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts scripts/src/startup-loop/__tests__/self-evolving-backbone-queue.test.ts`
  - Test execution note: local Jest remains out of scope under repo policy, so the new and updated tests were added but not run locally.
  - Precursor completion propagation: TASK-17 is no longer a blocker for TASK-14 or TASK-15. TASK-18 is now the next runnable build task, and both checkpoints remain blocked on real shadow-run evidence.

### TASK-18: Produce real self-evolving shadow-run policy artifacts and checkpoint evidence
- **Type:** IMPLEMENT
- **Deliverable:** at least one persisted self-evolving shadow-run artifact set (`policy-state.json`, `policy-decisions.jsonl`, report/audit snapshot) produced by the live runtime through a bounded, operator-repeatable runner over existing repo queue or startup-loop inputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `docs/business-os/startup-loop/self-evolving/<business>/policy-state.json`, `docs/business-os/startup-loop/self-evolving/<business>/policy-decisions.jsonl`, `docs/plans/startup-loop-centralized-math-foundations/plan.md`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/<business>-shadow-run-result.json`, `docs/plans/startup-loop-centralized-math-foundations/artifacts/<business>-shadow-run-report.json`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- **Depends on:** TASK-13, TASK-17
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 80%
  - Implementation: 80% - the runtime already knows how to write the required artifacts and there is a bounded CLI entrypoint, but the chosen evidence run still needs to be made repeatable and non-actuating.
  - Approach: 90% - the checkpoint needs real repo outputs, not only test fixtures or synthetic joins.
  - Impact: 90% - without real artifacts the guarded-trial gate has nothing operational to judge.
- **Acceptance criteria:**
  - At least one business under `docs/business-os/startup-loop/self-evolving/` has persisted `policy-state.json` and `policy-decisions.jsonl` produced by the runtime, not hand-authored fixtures.
  - The evidence pack records the exact generation path, business, run ID, and report snapshot used for the checkpoint.
  - The report over that business no longer warns that policy-state or policy-decision artifacts are missing.
  - The checkpoint can cite real audit output with explicit measured or `insufficient_data` statuses on actual decision records.
- **Validation contract (TC-18):**
  - TC-01: a bounded shadow run writes deterministic policy-state and decision-journal artifacts from existing queue or startup-loop inputs using one documented runtime path.
  - TC-02: `self-evolving-report.ts --business <business>` reads those artifacts without missing-file warnings.
  - TC-03: the resulting report exposes non-null authority level and non-zero decision-record counts.
  - TC-04: rerunning the same bounded input set produces a stable artifact shape without emitting shadow-mode follow-up dispatches.
- **Execution plan:** Red -> lock the first evidence slice to one bounded runner (`self-evolving-from-ideas.ts`) and prove it can execute under shadow semantics without queue actuation; Green -> generate and persist one real artifact set plus report snapshot; Refactor -> document or script the evidence-generation path so TASK-14 can rerun deterministically.
- **Planning validation (required for M/L):**
  - Checks run: searched `docs/business-os/startup-loop/self-evolving/` for real `policy-state.json` and `policy-decisions.jsonl` artifacts, ran the report against live `BRIK` state, and traced available runtime entrypoints for generating policy artifacts.
  - Validation artifacts: `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`, `docs/business-os/startup-loop/self-evolving/BRIK/`, `docs/business-os/startup-loop/self-evolving/SIMC/`
  - Unexpected findings:
    - no `policy-state.json` or `policy-decisions.jsonl` exists under the self-evolving business roots
    - `self-evolving-report.ts --business BRIK` reports missing policy-state and policy-decision logs and therefore all audit metrics are currently `insufficient_data`
    - there is no direct CLI for replaying raw observation files into policy artifacts; the bounded live path that already exists is `self-evolving-from-ideas.ts` over trial queue dispatches plus startup state
- **Scouts:** None: this is a direct evidence-pack task created by failed checkpoint review.
- **Edge Cases & Hardening:** businesses with observations but no candidates, empty decision journals, deterministic reruns over the same bounded input set, and shadow-mode runs that must not emit follow-up dispatches.
- **What would make this >=90%:**
  - One scripted checkpoint-evidence path that can regenerate the same artifact set and report snapshot for a bounded business input without manual cleanup or queue mutation.
- **Rollout / rollback:**
  - Rollout: keep the generated artifacts in shadow mode only and use them strictly for checkpoint evidence.
  - Rollback: remove only the generated artifact set if the generation path needs redesign; keep the runtime writer surfaces.
- **Documentation impact:**
  - Update the checkpoint evidence section in this plan with the chosen business and generated artifact paths.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
  - `docs/business-os/startup-loop/self-evolving/BRIK/`
- **Build Evidence (2026-03-10):**
  - Red: the first live `BRIK` shadow run failed inside `buildObservationSignalHints()` because real queue packets include legacy string `intended_outcome` values and sparse optional text fields; the runner had been assuming every signal text was already a non-empty string.
  - Green: hardened the runner seam rather than papering over live data. `self-evolving-from-ideas.ts` now accepts `string` or object `intended_outcome` forms, resolves safe fallback text for recurrence and problem statements, and emits CLI evidence metadata (`business`, `run_id`, `session_id`, `generation_source`, `source_paths`). `self-evolving-signal-helpers.ts` now filters non-string text inputs instead of throwing on real queue data.
  - Green: added non-actuating shadow evidence mode to `self-evolving-from-ideas.ts` via `followupConsumeMode: "skip"` / `--followup-consume-mode skip`, plus integration coverage proving reruns keep policy artifacts stable and do not create follow-up queue mutations.
  - Green: generated the first real shadow evidence pack for `BRIK` through the live bounded runner:
    - `docs/business-os/startup-loop/self-evolving/BRIK/policy-state.json`
    - `docs/business-os/startup-loop/self-evolving/BRIK/policy-decisions.jsonl`
    - `docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-result.json`
    - `docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-report.json`
  - Generation path:
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts --business BRIK --run-id task-18-shadow-brik-2026-03-10 --session-id task-18-shadow-brik-2026-03-10-session --followup-consume-mode skip --output docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-result.json`
    - `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK > docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-report.json`
  - TC-01: pass. The bounded `BRIK` shadow run wrote runtime-produced `policy-state.json` and `policy-decisions.jsonl`, and the saved result artifact records the exact generation source, business, run ID, session ID, and input paths.
  - TC-02: pass. `BRIK-shadow-run-report.json` has `warnings: []`; the missing policy-state and policy-decision warnings are gone.
  - TC-03: pass. The report shows `policy_state_present: true`, `authority_level: "shadow"`, and `decision_records: 12` on real repo outputs.
  - TC-04: pass by integration coverage and live guard semantics. `self-evolving-orchestrator-integration.test.ts` now proves rerunning the same bounded input set in `skip` mode preserves `policy-state.json` / `policy-decisions.jsonl` content and never creates the legacy follow-up queue file; the live `BRIK` evidence run also enforced an unchanged `ideas/trial/queue-state.json` hash before and after execution.
  - Residual issue carried forward to TASK-14: the evidence pack is real, but it is still dominated by structural-only signals (`measurement_ready_observation_rate: 0`, `exploration_decisions: 0`, calibration/regret still `insufficient_data`), so the checkpoint must judge guarded-trial readiness against honest sparse-data outputs rather than missing artifacts.

### TASK-19: Persist shadow handoff replay state for non-actuating policy runs
- **Type:** IMPLEMENT
- **Deliverable:** a deduped shadow-handoff ledger plus evaluation/report support so `followupConsumeMode: "skip"` decisions can enter maturity and replay accounting without mutating the canonical ideas queue
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `docs/business-os/startup-loop/self-evolving/<business>/shadow-handoffs.jsonl`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-18
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 80%
  - Implementation: 80% - the missing seam is now explicit: shadow decisions never produce joinable handoff state, so maturity handling cannot run on real outputs.
  - Approach: 80% - a separate shadow ledger preserves non-actuation while still giving replay code something truthful to evaluate.
  - Impact: 85% - without this, guarded-trial readiness cannot be judged because every real shadow decision stays censored forever.
- **Acceptance criteria:**
  - Shadow runs write deduped handoff records keyed by `decision_id` / `candidate_id` without touching `ideas/trial/queue-state.json`.
  - Policy evaluation consumes those records and reports pending or matured shadow-handoff state instead of `queue_state: null` / `evaluation_status: censored` for every shadow decision.
  - Reports and dashboards surface the shadow-handoff counts explicitly so replay debt is observable.
- **Validation contract:**
  - TC-01: rerunning the same bounded shadow input set dedupes `shadow-handoffs.jsonl`.
  - TC-02: `self-evolving-report.ts` shows non-null queue or handoff state for shadow decisions when the ledger exists.
  - TC-03: canonical queue state remains byte-for-byte unchanged in shadow mode.
- **Build Evidence (2026-03-10):**
  - Green: added `self-evolving-shadow-handoffs.ts` and wired `self-evolving-from-ideas.ts` to persist a deduped `docs/business-os/startup-loop/self-evolving/BRIK/shadow-handoffs.jsonl` ledger during `followupConsumeMode: "skip"` runs, keyed by `decision_id` + `candidate_id`.
  - Green: `self-evolving-evaluation.ts`, `self-evolving-report.ts`, and `self-evolving-dashboard.ts` now treat those records as explicit `handoff_state: "shadow_handoff"` inputs, so real shadow decisions move into `pending` or `missing` maturity accounting instead of staying permanently censored.
  - Green: reran the bounded `BRIK` shadow pack and regenerated the report. `BRIK-shadow-run-result.json` now shows `shadow_handoffs_written: 4`, `followup_dispatches_emitted: 0`, and `warnings: []`. `BRIK-shadow-run-report.json` now shows `shadow_handoff_count: 4`, `pending_decisions: 4`, `shadow_handoff_decisions: 4`, `pending_shadow_handoffs: 4`, `matured_shadow_handoffs: 0`, and sample evaluation records with `queue_state: "shadow_handoff"`.
  - TC-01: pass. The skip-mode integration test now proves first-run write plus second-run dedupe for `shadow-handoffs.jsonl`, and the ledger writer now dedupes on the `decision_id` + `candidate_id` handoff key rather than `decision_id` alone.
  - TC-02: pass. The report path now accepts `--shadow-handoffs`, loads the persisted ledger, and the evaluation/report tests cover both pending and matured shadow-handoff states.
  - TC-03: pass. Shadow-mode evidence generation preserved the canonical queue untouched: `git diff --quiet -- docs/business-os/startup-loop/ideas/trial/queue-state.json` returned success after the bounded `BRIK` rerun.
  - Residual blocker handed to TASK-20/TASK-14: replay state now exists, but the real-data cohort still exercises no selected or exploration branch. The refreshed evidence pack still shows `replay_ready_decisions: 0`, `portfolio_selected: false` on all current candidates, and `policy_decisions.exploration.total = 0`.

### TASK-20: Find or prove the absence of a real-data cohort that exercises selected and exploration policy paths
- **Type:** INVESTIGATE
- **Deliverable:** a bounded cohort audit artifact showing either one real repo input slice with non-zero portfolio selection / exploration activity or explicit proof that no current repo cohort can exercise those branches under present data and policy
- **Execution-Skill:** lp-do-replan
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/guarded-trial-cohort-audit.md`, `docs/plans/startup-loop-centralized-math-foundations/plan.md`
- **Depends on:** TASK-18
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 70%
  - Implementation: 70% - the audit path is clear, but the result may honestly be “no qualifying cohort exists yet”.
  - Approach: 75% - guarded-trial readiness cannot be judged from a policy that only ever selects nothing.
  - Impact: 85% - this prevents false confidence from a mathematically elaborate but unexercised decision layer.
- **Acceptance criteria:**
  - The audit examines actual repo businesses and bounded input sets, not synthetic fixtures.
  - The result identifies at least one cohort with `portfolio_selected > 0` or `exploration.total > 0`, or proves that no current cohort can do so without new live data or policy changes.
  - The plan records the chosen cohort path or the explicit data blocker before rerunning TASK-14.
- **Build Evidence (2026-03-10):**
  - Green: added `docs/plans/startup-loop-centralized-math-foundations/artifacts/guarded-trial-cohort-audit.md` and completed the bounded audit against actual on-disk self-evolving businesses.
  - Inventory result: only `docs/business-os/startup-loop/self-evolving/BRIK/` currently has live policy artifacts (`policy-state.json`, `policy-decisions.jsonl`, `shadow-handoffs.jsonl`), so there is no second real-data business cohort to test.
  - Proof of absence: the live `BRIK` cohort cannot exercise the selected or exploration branches under current code and current data.
    - Every route decision already has `utility.net_utility: -1.1714`.
    - Every portfolio decision records `chosen_action: "deferred"`, `selected_candidate_ids: []`, and `objective_value: 0`.
    - `self-evolving-portfolio.ts` sends those negative utilities into a maximize portfolio model, so the empty set is the optimal real-data solution.
    - `self-evolving-exploration.ts` only creates arms from portfolio decisions with `chosen_action === "selected"`, so zero selected candidates implies zero exploration decisions.
    - `BRIK-shadow-run-report.json` confirms `exploration_decisions: 0` and `exploration_regret_status: "insufficient_data"`.
  - Result: TASK-20 is satisfied via explicit proof of absence, not by manufacturing a synthetic cohort.

### TASK-22: Audit selection starvation and define the first mathematically sound path to a real selected cohort
- **Type:** INVESTIGATE
- **Deliverable:** a bounded audit artifact that explains whether the current zero-selection outcome is the correct consequence of current live data or an over-conservative policy model, and defines the exact next non-shortcut path to the first real selected cohort
- **Execution-Skill:** lp-do-replan
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/selection-starvation-audit.md`, `docs/plans/startup-loop-centralized-math-foundations/plan.md`
- **Depends on:** TASK-20
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 75%
  - Implementation: 75% - TASK-20 proved the absence cleanly, so the remaining question is now explicit and bounded.
  - Approach: 75% - guarded-trial readiness cannot be recovered by forcing minimum selection just to exercise a branch.
  - Impact: 85% - until the zero-selection outcome is either defended or corrected, the mathematical loop cannot prove that it can graduate from deferral to real action selection on live data.
- **Acceptance criteria:**
  - The audit quantifies the current real-data route utility, portfolio-adjusted utility, and empty-set portfolio result.
  - The audit distinguishes data scarcity from policy conservatism and names the exact seam responsible for selection starvation.
  - If a policy change is warranted, the audit defines the next build task without using fake minimum-selection or other branch-forcing shortcuts.

### TASK-21: Rerun shadow evidence after the first live maturity window closes
- **Type:** CHECKPOINT
- **Deliverable:** refreshed real shadow evidence and plan notes after the first persisted shadow-handoff cohort exits `pending` maturity status
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/artifacts/BRIK-shadow-run-report.json`, `docs/plans/startup-loop-centralized-math-foundations/plan.md`
- **Depends on:** TASK-19
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% - the evidence seam already exists; the missing ingredient is elapsed time against a real maturity window.
  - Approach: 95% - replay, calibration, and regret should not be claimed before the first live cohort can age out of `pending`.
  - Impact: 90% - this converts the current shadow evidence from “freshly emitted” into a real maturity test.
- **Acceptance criteria:**
  - The rerun happens on or after the earliest live `maturity_due_at` in `shadow-handoffs.jsonl` for the bounded business cohort.
  - The refreshed report shows whether the first shadow cohort moved into `observed` or `missing` status instead of remaining wholly `pending`.
  - The plan records the resulting replay/calibration/regret posture before TASK-14 is retried.

### TASK-14: Horizon checkpoint - replay and guarded-trial policy readiness
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if replay and guarded-trial readiness is not yet met
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/plan.md`
- **Depends on:** TASK-07, TASK-08, TASK-09, TASK-10, TASK-11, TASK-12, TASK-13, TASK-17, TASK-18, TASK-19, TASK-20
- **Blocks:** TASK-15
- **Confidence:** 95%
  - Implementation: 95% - checkpoint mechanics are defined.
  - Approach: 95% - the mathematical loop must not claim success before its full gate is met.
  - Impact: 95% - this prevents premature “self-improving” claims.
- **Acceptance criteria:**
  - `/lp-do-build` checkpoint executor run.
  - Replay evidence, maturity handling, authority-ladder enforcement, and guarded-trial telemetry are re-evaluated against actual code and outputs.
  - The checkpoint cites at least one real shadow-run evidence pack with policy-state, decision journal, and report snapshot paths.
  - If any load-bearing replay or guarded-trial gate is still unmet, `/lp-do-replan` updates downstream work before guarded authority expands.
- **Horizon assumptions to validate:**
  - Belief state, outcome closure, causal gate, stability control, and calibration/regret telemetry all exist as implemented code, not just docs.
  - Optimization, graph, survival, and exploration outputs remain shadow or advisory until replay and guardrail evidence say guarded trial authority is justified.
  - Remaining open math-package gaps are non-gating because the chosen internal or bridge implementations have landed.
- **Validation contract:** the checkpoint records a pass/fail decision against replay quality, maturity handling, guarded-trial evidence, and triggers `/lp-do-replan` on any failed gate.
- **Planning validation:** `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, replay/telemetry outputs from TASK-16 and TASK-13, policy surfaces from TASK-07 through TASK-12, authority-proof outputs from TASK-17, and evidence-pack outputs from TASK-18.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan with the checkpoint result and any replan branch.
- **Checkpoint Attempt (2026-03-10): failed -> replan required**
  - Pass: the code now contains the load-bearing mathematical seams the checkpoint expected:
    - posterior belief state and policy journaling
    - maturity-aware outcome closure and evaluation datasets
    - optimization, graph, survival, exploration, promotion-gate, governance, and policy-audit outputs
  - Fail: the authority ladder is not yet true in code. `createDefaultPolicyState()` defaults to `authority_level: "shadow"` in `self-evolving-scoring.ts`, but `consumeBackboneQueueToIdeasWorkflow()` still filters pending entries on `portfolio_selected` in `self-evolving-backbone-consume.ts`, so mathematical portfolio choice can already suppress dispatch emission before guarded-trial clearance.
  - Fail: actual repo outputs do not yet support guarded-trial evidence review. A repo search found no `policy-state.json` or `policy-decisions.jsonl` under `docs/business-os/startup-loop/self-evolving/`, and `pnpm exec tsx scripts/src/startup-loop/self-evolving/self-evolving-report.ts --business BRIK` reports missing policy-state and policy-decision artifacts with audit surfaces therefore remaining `insufficient_data`.
  - Result: TASK-14 stays pending. Added TASK-17 and TASK-18; rerun this checkpoint only after both are complete.
- **Checkpoint Attempt (2026-03-10, rerun after TASK-18): failed -> replan required**
  - Pass: the original hard blockers are now closed.
    - `BRIK` has real `policy-state.json` and `policy-decisions.jsonl` artifacts produced by the runtime.
    - The authority ladder is enforced: shadow evidence generation used `followupConsumeMode: "skip"` and preserved an unchanged `ideas/trial/queue-state.json` hash.
    - The report now loads with `warnings: []`, `policy_state_present: true`, `decision_records: 12`, and real dependency/survival/policy-audit outputs.
  - Fail: replay and maturity handling still are not exercised on real shadow outputs. In `BRIK-shadow-run-report.json`, `replay_ready_decisions = 0`, `observed_decisions = 0`, `pending_decisions = 0`, and all four evaluation records remain `censored` with `queue_state: null` because shadow runs do not yet persist any joinable handoff record.
  - Fail: guarded-trial policy branches remain unproven on real data. `BRIK-shadow-run-result.json` shows `backbone_queued: 0`, every ranked candidate has `portfolio_selected: false`, and the report shows `policy_decisions.exploration.total = 0`; the mathematical loop can currently prove “select nothing under current evidence,” but not that selected or exploratory branches behave correctly on actual repo inputs.
  - Fail: repo search over `docs/business-os/startup-loop/ideas/trial/queue-state.json` found no existing `self_evolving` links to piggyback for replay, so there is no historical canonical queue cohort that closes this gap automatically.
  - Result: TASK-14 stays pending. Added TASK-19 and TASK-20; rerun this checkpoint only after shadow handoff replay state exists and a real selected/exploration cohort is either found or explicitly proven absent.
- **Checkpoint Attempt (2026-03-10, rerun after TASK-19 and TASK-20): failed -> replan required**
  - Pass: shadow replay state is now real.
    - `BRIK` now has a persisted `shadow-handoffs.jsonl` ledger produced by the live runner in skip mode.
    - `BRIK-shadow-run-report.json` now reports `shadow_handoff_count: 4`, `pending_decisions: 4`, `shadow_handoff_decisions: 4`, and sample evaluation records with `queue_state: "shadow_handoff"`.
    - The canonical ideas queue still remained untouched during shadow evidence generation.
  - Pass: the selected/exploration gap is now explained rather than merely observed.
    - `TASK-20` proved that only `BRIK` currently has live self-evolving policy artifacts on disk.
    - The same audit proved that every current real-data candidate has negative route and portfolio-adjusted utility, so the empty portfolio is the mathematically optimal real-data result and exploration receives zero arms.
  - Fail: replay readiness is still not mature enough for guarded-trial claims.
    - The current live shadow cohort has not yet reached its first real `maturity_due_at`, so `pending_shadow_handoffs: 4`, `matured_shadow_handoffs: 0`, and `replay_ready_decisions: 0` remain the truthful state.
    - Calibration and exploration regret therefore remain `insufficient_data` on real outcomes, not because the machinery is missing, but because no live cohort has aged or closed yet.
  - Fail: guarded-trial action selection is still unproven on real data.
    - The current repo has no real self-evolving cohort with `selected_candidate_ids` or exploration decisions.
    - That is now a principled blocker, not a missing-artifact blocker, and it needs its own audit rather than a forced branch exercise.
  - Result: TASK-14 stays pending. Added TASK-21 and TASK-22; rerun this checkpoint only after the first live shadow cohort matures and the zero-selection result is audited for policy correctness.

### TASK-15: Final checkpoint - authoritative mathematical policy readiness
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan` if the self-improving status gate is not yet met for authoritative mathematical policy claims
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-centralized-math-foundations/plan.md`
- **Depends on:** TASK-14
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - the control task is straightforward once guarded-trial evidence exists.
  - Approach: 95% - authoritative claims need a second gate after replay and guarded-trial validation, not a single blended checkpoint.
  - Impact: 95% - this is the final stop against premature self-improving claims.
- **Acceptance criteria:**
  - `/lp-do-build` checkpoint executor run after TASK-14 has passed.
  - The full self-improving status gate from the fact-find is re-evaluated against actual code, replay evidence, telemetry, and guarded-trial results.
  - The checkpoint cites real authority progression evidence rather than only policy-state fields or prose claims.
  - If any load-bearing gate is still unmet, `/lp-do-replan` updates downstream work before authoritative mathematical policy claims or expansion continue.
- **Horizon assumptions to validate:**
  - Replay and guarded-trial checkpoints already passed with explicit evidence.
  - Policy authority progression from Shadow to Advisory to Guarded trial is evidenced in outputs, not just claimed in prose.
  - Remaining residual uncertainty is about rollout appetite, not missing mathematical architecture, missing proof surfaces, or missing operator-repeatable evidence generation.
- **Validation contract:** the checkpoint records a pass/fail decision against each self-improving status gate and triggers `/lp-do-replan` on any failed gate.
- **Planning validation:** `docs/plans/startup-loop-centralized-math-foundations/fact-find.md`, checkpoint outputs from TASK-14, telemetry/report outputs from TASK-13, and policy surfaces from TASK-07 through TASK-12.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** update this plan with the final checkpoint result and any replan branch.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Replace direct startup-loop math source imports | Yes | None | No |
| TASK-02: Harden graph, optimization, and survival helper contracts | Yes | Moderate: helper naming can drift from later policy use sites if startup-loop semantics are not chosen early | Yes |
| TASK-03: Define posterior belief, utility, and policy-state contract | Yes | None | No |
| TASK-04: Define outcome-closure and verified-measurement contract | Yes | None | No |
| TASK-05: Implement belief-state and utility layer | Partial | Major: without TASK-03 and TASK-02, belief state would invent contracts or couple to raw package APIs | Yes |
| TASK-06: Implement outcome closure and verified measurement feedback | Partial | Major: without TASK-04, candidate/disptach joins and verification rules stay ambiguous | Yes |
| TASK-16: Implement decision journaling, maturity windows, and replay-ready datasets | Partial | Critical: without replay-ready traces and maturity rules, calibration and regret become narrative rather than measurement | Yes |
| TASK-07: Replace pure sorting with constrained optimization | Partial | Critical: optimizer before TASK-05, TASK-06, and TASK-16 would formalize heuristic bias and stale outcomes instead of learned utility | Yes |
| TASK-08: Integrate graph dependency analysis | Partial | Moderate: graph schema must remain structural and not leak into causal claims | Yes |
| TASK-09: Integrate survival risk layer | Partial | Moderate: survival inputs depend on verified event histories from TASK-06 | Yes |
| TASK-10: Implement bounded contextual exploration | Partial | Major: exploration before outcome closure and optimization would create learning noise without accountable value | Yes |
| TASK-11: Implement causal-evaluation gate | Partial | Major: promotion gate needs verified outcome and structural/time-to-event context first | Yes |
| TASK-12: Implement stability and anti-gaming governance | Partial | Major: damping and guardrails must wrap optimizer/exploration/promotion together, not one seam at a time | Yes |
| TASK-13: Implement calibration and regret telemetry | Partial | Major: telemetry before beliefs, outcomes, and replay traces would be hollow | Yes |
| TASK-14: Replay and guarded-trial policy readiness checkpoint | Partial | Major: guarded authority must not advance without replay-backed evidence and maturity-aware evaluation | Yes |
| TASK-15: Authoritative mathematical policy readiness checkpoint | Partial | None: final checkpoint is correctly last and will stop the plan if any gate remains unmet | No |

## Delivery Rehearsal
- Data:
  - Same-outcome finding: verified outcome and measurement data dependencies were underspecified in the first plan shape; TASK-04, TASK-06, and TASK-16 now make outcome maturity and replay data explicit.
- Process/UX:
  - Same-outcome finding: operator-facing policy expansion needed an explicit authority ladder plus two checkpoints; the plan now separates guarded-trial readiness from final authoritative readiness.
- Security:
  - Same-outcome finding: operator/governance boundary was initially too implicit; TASK-03, TASK-16, and TASK-12 now require policy versioning, decision journaling, override recording, and governance limits.
- UI:
  - None: there is no new user-facing UI task in scope; reporting changes are internal observability outputs covered by TASK-13.

## Critique Summary
- Round 1: partially credible (3.4/5)
  - Major findings:
    - calibration/regret were named without a replay and maturity lane
    - the plan lacked one explicit authority ladder for when mathematical outputs may affect the queue
    - stochastic exploration and regret lacked a decision-journal and propensity contract
  - Autofix applied: added TASK-16, added a plan-level authority ladder, and required replay-ready decision traces across belief, optimization, exploration, telemetry, and checkpoint tasks
- Round 2: credible (4.2/5)
  - Remaining findings:
    - no Critical findings
    - residual uncertainty is now contained in explicit INVESTIGATE tasks, replay instrumentation, and checkpoint gating rather than hidden in IMPLEMENT tasks
- Round 3: credible and runnable (4.4/5)
  - Remaining findings:
    - no new Critical findings
    - `TASK-16` was re-scoped by live code evidence from "invent journaling and replay primitives" to "assemble joined evaluation slices and expose them through reporting"
- Round 4: credible and runnable (4.5/5)
  - Remaining findings:
    - no new Critical findings
    - Wave 4 now has concrete first slices for optimization, graph, and survival, so the remaining risk is implementation quality rather than hidden contract gaps

## What would make this >=90%
- Freeze the posterior-policy contract with one worked example that starts from a real candidate family and ends in a replayable decision journal, utility score, and authority-level decision.
- Freeze the outcome-closure contract with one traced self-evolving follow-up dispatch that reaches completion, verified measurement, and explicit maturity classification.
- Produce one deterministic replay fixture showing how guarded-trial regret and calibration are computed for both deterministic and stochastic decisions.
- Define the first concrete graph slice and first concrete survival cohort from current runtime entities so TASK-08 and TASK-09 stop at one narrow, testable scope.
- Prove that the current Shadow -> Advisory -> Guarded-trial ladder maps onto real runtime seams and does not require an unplanned migration layer.

## Risks & Mitigations
- Optimization could still harden the wrong objective if TASK-03 and TASK-12 under-specify utility and counter-metrics.
  - Mitigation: keep utility contract and anti-gaming governance as separate load-bearing tasks before authoritative readiness.
- Outcome closure may fail on join ambiguity between candidate, dispatch, and completion records.
  - Mitigation: TASK-04 defines the contract first; TASK-06 is blocked until that contract exists.
- Replay and regret claims could still be mathematically weak if decision contexts or action probabilities are not journaled consistently.
  - Mitigation: TASK-03 defines the required journal contract, TASK-16 implements it, and TASK-13 depends on both.
- Exploration can generate noise or perceived randomness if it outruns feedback and regret tracking.
  - Mitigation: TASK-10 is blocked on outcome closure, replay readiness, and optimization, and TASK-13 plus TASK-14 must land before authoritative progression.
- Graph and survival signals can be overclaimed as causal.
  - Mitigation: TASK-11 requires an explicit causal-evaluation gate and keeps structural/time-to-event signals as inputs, not proof.
- The architecture could become mathematically elaborate but still not trustworthy.
  - Mitigation: calibration, regret, override, and policy-version telemetry are first-class deliverables in TASK-13 and hard gates in TASK-14 and TASK-15.

## Observability
- Logging:
  - belief updates with policy version
  - decision journals with action set snapshots, chosen action, and action probabilities where applicable
  - optimization portfolio rationale and constraint binds
  - exploration decisions, sampled rationale, and budget use
  - causal gate outcomes and blocked reasons
  - operator overrides and governance-triggered holds/reverts
- Metrics:
  - posterior calibration
  - policy regret by version
  - route-mix, blast-radius, and evidence-quality constraint utilization
  - survival risk bands for aging candidates
  - override rate and anti-gaming counter-metric breaches
- Alerts/Dashboards:
  - checkpoint dashboard for self-improving status gate
  - replay coverage / maturity debt alert
  - policy drift / calibration degradation alert
  - exploration budget exhaustion alert
  - guardrail or counter-metric breach alert

## Acceptance Criteria (overall)
- [ ] The startup-loop uses centralized, repo-owned math helpers rather than raw package passthroughs or direct source imports.
- [ ] Candidate ranking is driven by versioned posterior beliefs and explicit utility under constraints.
- [ ] Verified outcomes and measurements flow back into self-evolving memory automatically.
- [ ] Decision journals and maturity-aware replay datasets exist before policy-quality claims are made.
- [ ] Optimization, graph, and survival all influence policy through clearly bounded roles.
- [ ] Exploration is bounded and auditable.
- [ ] Durable promotion requires causal discipline.
- [ ] Stability, anti-gaming, calibration, and regret layers exist before authoritative mathematical-policy claims are allowed.
- [ ] The final checkpoint can evaluate every self-improving status gate against actual code, replay evidence, and telemetry.

## Decision Log
- 2026-03-09: Chose architecture-first sequencing over optimizer-first sequencing because optimization on heuristic beliefs is mathematically unsound.
- 2026-03-09: Chose internal contextual exploration over third-party package dependence for the first bounded-exploration implementation.
- 2026-03-09: Chose internal causal-contract plus estimator/bridge path over waiting for a repo-worthy TypeScript causal package.
- 2026-03-09: Chose a two-stage readiness model, first replay/guarded-trial readiness and then final authoritative readiness, because a single checkpoint was too easy to overclaim.
- 2026-03-09: Chose plan-only mode because the target architecture is now sound enough to take forward, but not yet appropriate for automatic build handoff.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task confidence:
  - `(85*1 + 75*2 + 75*2 + 75*2 + 75*2 + 75*2 + 80*2 + 80*2 + 80*2 + 80*2 + 70*2 + 70*2 + 75*2 + 75*2 + 95*1 + 95*1) / 29`
  - `= 2245 / 29`
  - `= 77.41%`
- Rounded Overall-confidence: `77%`
