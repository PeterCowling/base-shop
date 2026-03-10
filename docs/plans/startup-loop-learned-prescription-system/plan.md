---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-reviewed: 2026-03-10
Last-updated: 2026-03-10
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-learned-prescription-system
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-ideas, startup-loop
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# Startup Loop Learned Prescription System Plan

## Summary
The fact-find proved the startup loop already has prescriptions, but not a prescription system. The missing work is not generic intelligence; it is one coherent chain: normalize all upstream gap signals into a canonical `gap_case`, unify fragmented prescriptions into one typed contract, add requirement posture and prescription maturity, then make the self-evolving policy journal and evaluation layer learn which remedies work in which contexts. Only after that should milestone-triggered lateral bundles, richer sensing, unknown-prescription discovery outputs, and guarded promotion be wired into the live runtime.

This plan keeps the existing queue and self-evolving spine. It does not introduce a second planning vocabulary or a parallel loop. It also stays inside shadow/advisory boundaries until milestone producers, prescription learning, and guarded promotion can be proven against the current runtime rather than just described in docs.

Four issues are load-bearing throughout this plan and must be treated as design proofs, not advisory notes:
- `gap_case` must compile into the current candidate-centric runtime without creating a second live identity layer.
- milestone logic must be event-backed by real producers, not left as contract-only activation prose.
- `requirement_posture` must fit into one explicit precedence model with hard rules, utility, and governance.
- promotion must prove both efficacy and safety; those are separate checks and must stay separate.

## Active tasks
- [x] TASK-01: Define canonical `gap-case.v1` and `prescription.v1` contracts — Complete (2026-03-10)
- [x] TASK-02: Normalize existing suggestion seams onto canonical gap-case and prescription shapes — Complete (2026-03-10)
- [x] TASK-03: Add requirement posture and prescription maturity to queue and policy routing — Complete (2026-03-10)
- [x] TASK-04: Extend policy journaling and evaluation for prescription-choice learning — Complete (2026-03-10)
- [x] TASK-05: Map milestone roots to runtime producers and unify activation thresholds — Complete (2026-03-10)
- [x] TASK-06: Implement milestone-event triggers, producers, and lateral bundle generation — Complete (2026-03-10)
- [x] TASK-07: Widen live sensing for richer prescription evidence — Complete (2026-03-10)
- [x] TASK-08: Define and enforce the discovery-output contract for unknown prescriptions — Complete (2026-03-10)
- [ ] TASK-09: Add a guarded promotion path for proven prescriptions
- [ ] TASK-10: Checkpoint resulting-system coherence and rollout readiness

## Goals
- Create one canonical identity layer for improvement work: `gap_case` plus `prescription`.
- Replace fragmented suggestion fields with one learnable prescription contract.
- Distinguish absolute requirements, relative requirements, and optional improvements in the runtime rather than leaving that judgment implicit.
- Make unknown prescriptions a first-class state that routes to fact-find without fabricated certainty.
- Add milestone-triggered lateral thinking using contract-backed roots instead of prose-only expectations.
- Extend self-evolving evaluation so the loop can learn remedy quality, not just candidate-route quality.
- Keep promotion guarded and trial-scoped.
- Prove the resulting system is coherent enough to take forward without dual identity drift, contract-only milestone semantics, or promotion-safety shortcuts.

## Non-goals
- Replacing the queue or the self-evolving runtime with a new orchestration system.
- Turning milestone events into unconditional automatic execution.
- Treating stockist-related process wording as a canonical milestone root before the repo emits that state explicitly.
- Making the loop self-authoring or fully autonomous.
- Promoting proven prescriptions directly to production behavior without an explicit guardrail path.

## Constraints & Assumptions
- Constraints:
  - Code and current repo docs are the sole source of truth for current behavior.
  - The canonical execution spine remains `dispatch.v2`, queue state, and the current self-evolving runtime.
  - Hard gates, authority limits, and safety controls remain declarative and cannot be learned away.
  - Local Jest remains out of scope; validation must rely on typecheck, lint, and CI-routed tests.
  - Milestone runtime vocabulary must be grounded in current contract roots before any higher-level aliases are introduced.
- Assumptions:
  - `gap_case` can compile deterministically into the existing candidate-centric runtime rather than requiring a full replacement of `ImprovementCandidate`.
  - Unknown prescriptions should continue to route to fact-find, but with a stronger discovery-output contract than exists today.
  - Milestone producers can be added without inventing a separate event bus outside startup-loop scripts.
  - Guarded promotion can build on the existing manual write-back and low-risk autofix seams instead of bypassing them.

## Design Proofs Required
- **Identity proof:** `gap_case` must either deterministically compile into `candidate_id`/`ImprovementCandidate` or deliberately replace a bounded part of that model. A parallel live identity layer is not acceptable.
- **Milestone producer proof:** every milestone root admitted into runtime must have a concrete producer seam; contract prose alone is not enough.
- **Precedence proof:** `requirement_posture` must participate in one explicit ordering with hard rules, utility, and governance. It cannot be a fourth conflicting opinion layer.
- **Discovery proof:** unknown-prescription outputs must be structured enough to mature into a usable prescription without degenerating into narrative-only bureaucracy.
- **Promotion proof:** “worked before” and “safe to promote” must remain separate thresholds all the way through rollout.

## Inherited Outcome Contract
- **Why:** The startup loop already detects many weaknesses and already emits some suggested next moves, but those prescriptions are fragmented, not learned as a system, and not yet able to distinguish absolute requirements, relative requirements, unknown remedies, and milestone-triggered lateral follow-up.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed account of the true missing parts needed for a single learned prescription system in the startup loop, framed as planning-ready improvement opportunities with explicit boundaries, trigger classes, and outcome-learning seams.
- **Source:** operator

## Fact-Find Reference
- Related brief: [fact-find.md](/Users/petercowling/base-shop/docs/plans/startup-loop-learned-prescription-system/fact-find.md)
- Key findings used:
  - the runtime is still candidate-centric and lacks a canonical `gap_case` layer
  - prescriptions already exist in three seams, but as fragmented string fields rather than one typed system
  - hard rules, utility ranking, and fact-find fallback already exist and should be extended rather than replaced
  - milestone activation exists in contracts, but not as a first-class runtime trigger or producer layer
  - the self-evolving build-output bridge still reads a thinner evidence surface than its interface suggests
  - promotion remains manual and unlearned even where low-risk helpers already exist

## Proposed Approach
- Option A: start by adding `prescription_choice` and milestone triggers directly into the current runtime, then backfill missing identity and posture contracts later.
  - Pros: quicker visible progress.
  - Cons: creates ambiguity about what a prescription is attached to, risks a second queue vocabulary, and leaves milestone semantics and unknown-prescription behavior underspecified.
- Option B: contract-first. Define `gap_case`, `prescription`, requirement posture, and prescription maturity first; normalize current upstream seams onto them; then extend journaling/evaluation; then add milestone triggers, sensing, discovery outputs, and guarded promotion.
  - Pros: matches the fact-find, keeps identity and learning coherent, and avoids bolting new behavior onto ambiguous foundations.
  - Cons: slower at the front because the first wave is mostly contract and normalization work.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define canonical `gap-case.v1` and `prescription.v1` contracts | 82% | M | Complete (2026-03-10) | - | TASK-02, TASK-03, TASK-04, TASK-06, TASK-07, TASK-08 |
| TASK-02 | IMPLEMENT | Normalize existing suggestion seams onto canonical gap-case and prescription shapes | 80% | M | Complete (2026-03-10) | TASK-01 | TASK-03, TASK-04, TASK-07 |
| TASK-03 | IMPLEMENT | Add requirement posture and prescription maturity to queue and policy routing | 81% | M | Complete (2026-03-10) | TASK-01, TASK-02 | TASK-04, TASK-06, TASK-07, TASK-08, TASK-09 |
| TASK-04 | IMPLEMENT | Extend policy journaling and evaluation for prescription-choice learning | 81% | M | Complete (2026-03-10) | TASK-01, TASK-03 | TASK-08, TASK-09 |
| TASK-05 | INVESTIGATE | Map milestone roots to runtime producers and unify activation thresholds | 78% | M | Complete (2026-03-10) | - | TASK-06, TASK-09 |
| TASK-06 | IMPLEMENT | Add milestone-event triggers, producers, and lateral bundle generation | 80% | M | Complete (2026-03-10) | TASK-01, TASK-02, TASK-03, TASK-05 | TASK-09, TASK-10 |
| TASK-07 | IMPLEMENT | Widen live sensing for richer prescription evidence | 80% | M | Complete (2026-03-10) | TASK-01, TASK-02 | TASK-08, TASK-10 |
| TASK-08 | IMPLEMENT | Define and enforce the discovery-output contract for unknown prescriptions | 80% | M | Complete (2026-03-10) | TASK-01, TASK-03, TASK-07 | TASK-09, TASK-10 |
| TASK-09 | IMPLEMENT | Add a guarded promotion path for proven prescriptions | 80% | M | Pending | TASK-03, TASK-04, TASK-06, TASK-08 | TASK-10 |
| TASK-10 | CHECKPOINT | Check resulting-system coherence and rollout readiness | 95% | S | Pending | TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-05 | - | Lock the two foundations first: identity/contracts and milestone-root truth |
| 2 | TASK-02, TASK-03 | TASK-01 | Normalize current seams, then make requirement posture and maturity first-class |
| 3 | TASK-04 | TASK-01, TASK-03 | Add learning only after the runtime can name what it is learning about |
| 4 | TASK-06, TASK-07 | Relevant prerequisites complete | Milestone runtime work and richer sensing can be analysed in parallel, but integration should land serially because both touch core intake/self-evolving seams |
| 5 | TASK-08 | TASK-03, TASK-07 | Discovery outputs should land after unknown-prescription routing semantics and richer evidence are in place |
| 6 | TASK-09 | TASK-04, TASK-06, TASK-08 | Promotion only makes sense after learning, milestone routing, and discovery outputs are in place |
| 7 | TASK-10 | TASK-04 through TASK-09 | Rehearse the resulting system before any build continuation beyond the plan |

## What would make this >=90%
- A field-level draft for `gap-case.v1`, `prescription.v1`, and `prescription_choice` pinned to exact files and symbols.
- Sample milestone payloads for the non-deferred roots identified in TASK-05, especially the metric-backed `transaction_data_available` path and the planned artifact-backed roots.
- A draft discovery-output schema for unknown-prescription fact-finds.
- A stricter proof that `gap_case` can compile into the current candidate-centric model without dual identity drift.
- A draft promotion proof-threshold table that separates “effective enough to nominate” from “safe enough to promote”.

## Tasks

### TASK-01: Define canonical `gap-case.v1` and `prescription.v1` contracts
- **Type:** IMPLEMENT
- **Deliverable:** typed `gap-case.v1` and `prescription.v1` contracts wired into startup-loop type surfaces, plus an explicit mapping contract between `gap_case` and the current candidate-centric runtime
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`, `[readonly] docs/plans/startup-loop-learned-prescription-system/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-06, TASK-07, TASK-08
- **Confidence:** 82%
  - Implementation: 82% - the missing contract fields are now concrete in the fact-find and map onto known type seams.
  - Approach: 84% - defining identity and prescription contracts first is the only coherent sequencing.
  - Impact: 82% - without these contracts every later task risks building on ambiguous free-text fields.
- **Acceptance:**
  - `gap_case` is a first-class typed runtime concept with stable identity and source metadata.
  - `prescription` is a first-class typed runtime concept that can replace existing suggestion strings over time.
  - The plan leaves an explicit mapping rule for `gap_case` against `candidate_id` / `ImprovementCandidate`; “both exist somehow” is not acceptable.
  - The plan leaves no ambiguity about which current seams must consume the new contracts first.
- **Validation contract (TC-01):**
  - TC-01: startup-loop types compile with explicit `gap_case` and `prescription` interfaces.
  - TC-02: no downstream task in this plan still relies on fragmented suggestion strings as its primary identity model.
  - TC-03: queue/self-evolving call sites can reference the new contracts without introducing a second queue envelope or a second live identity model.
- **Execution plan:** Red -> add or update contract tests/types that prove the new shapes are missing; Green -> add the contracts and thread references into core runtime types; Refactor -> remove duplicate temporary field aliases that would preserve ambiguity.
- **Planning validation (required for M/L):**
  - Checks run: verified current runtime remains candidate-centric and lacks both `gap_case` and `prescription` contracts.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
  - Unexpected findings: `gap_case_id` was already assumed in the fact-find’s later sections before a canonical type existed, which confirms this task is foundational rather than optional.
- **Scouts:** None: the contract gap is directly evidenced.
- **Edge Cases & Hardening:** avoid introducing dual identity drift between `gap_case_id` and `candidate_id`; preserve backward compatibility for existing queue packets where needed.
- **What would make this >=90%:**
  - A concrete draft field map from current `ImprovementCandidate` and dispatch linkage fields onto `gap_case`, with one worked example traced end to end.
- **Rollout / rollback:**
  - Rollout: add types first, then thread them through runtime seams in dependent tasks.
  - Rollback: remove contract additions only if the identity model proves unworkable; do not fall back to free-text suggestion fields.
- **Documentation impact:**
  - Update the fact-find and any later plan artifacts that reference the new contracts.
  - Scope expansion note: queue self-evolving link types and focused contract tests are included because the new identity contracts must be referenced by real queue surfaces and validated in place.
- **Notes / references:**
  - [self-evolving-contracts.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts)
  - [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts)
- **Build Evidence (2026-03-10):**
  - Red evidence: the runtime remained candidate-centric with no canonical `gap_case` or `prescription` contracts, and queue/self-evolving linkage surfaces could not carry those identities.
  - Green: added canonical `GapCase`, `Prescription`, and reference/runtime-binding validators in `self-evolving-contracts.ts`, then threaded optional canonical references into `ImprovementCandidate`, `ImprovementOutcome`, `PolicyDecisionRecord`, queue self-evolving links, and `dispatch.v2` validation.
  - Scope control: kept the change bounded to contract surfaces plus the minimum queue/test seams required to prove the new identities are usable in real runtime envelopes.
  - TC-01: pass. `pnpm exec tsc -p scripts/tsconfig.json --noEmit` completed successfully with explicit `gap_case` and `prescription` contract shapes in the startup-loop type surfaces.
  - TC-02: pass. The canonical identity model is now expressed in code and the plan no longer relies on fragmented suggestion strings as the primary identity spine for downstream tasks; those strings remain only as normalization inputs for TASK-02.
  - TC-03: pass. `pnpm exec eslint --no-warn-ignored scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts` completed successfully, and focused tests now cover queue/self-evolving references without adding a second queue envelope or a second live identity model.
  - Precursor completion propagation: TASK-01 no longer blocks TASK-02, TASK-03, TASK-04, TASK-06, TASK-07, or TASK-08. The next runnable wave is still gated by confidence and sequencing, with TASK-05 remaining independently runnable as the milestone-root investigation and TASK-02/TASK-03 waiting on their own implementation windows.

### TASK-02: Normalize existing suggestion seams onto canonical gap-case and prescription shapes
- **Type:** IMPLEMENT
- **Deliverable:** current fragmented suggestion seams emit canonical `gap_case` and `prescription` shapes instead of standalone strings
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-prescription-normalization.ts`, `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/diagnostics/signal-review-review-required.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/__tests__/replan-trigger.test.ts`, `scripts/src/startup-loop/__tests__/signal-review-review-required.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-build-origin-bridge.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-07
- **Confidence:** 80%
  - Implementation: 80% - the three fragmented seams are concrete and already located.
  - Approach: 82% - this normalization is the shortest path to one prescription system instead of three local dialects.
  - Impact: 80% - without it the runtime would keep mixing typed and untyped suggestion logic.
- **Acceptance:**
  - `recommended_focus`, `suggested_action`, and `next_scope_now` no longer act as independent prescriptive authorities.
  - Each upstream seam emits or references canonical `gap_case` and `prescription` identity.
  - Existing queue admission behavior remains intact while becoming more typed.
- **Validation contract (TC-02):**
  - TC-01: replan-trigger output can be traced to a canonical prescription rather than only a focus string.
  - TC-02: build-origin bridge outputs carry canonical gap/prescription identity while preserving current route behavior.
  - TC-03: signal-review sidecars preserve actionable meaning without inventing a separate contract shape.
- **Execution plan:** Red -> add tests or assertions around current fragmented outputs; Green -> normalize all three seams onto the new contracts; Refactor -> delete or demote redundant free-text-only carrier fields where safe.
- **Planning validation (required for M/L):**
  - Checks run: confirmed three separate prescription carriers in code.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/diagnostics/signal-review-review-required.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`
  - Unexpected findings: the build-origin bridge is already close to queue-native behavior, so it should be normalized rather than replaced.
- **Scouts:** None: seam inventory already complete.
- **Edge Cases & Hardening:** preserve current dispatch quality fields and avoid losing operator-readable rationale when normalizing strings into typed objects.
- **What would make this >=90%:**
  - A direct fixture showing one example from each seam expressed in the target contract.
- **Rollout / rollback:**
  - Rollout: normalize one seam at a time behind shared types.
  - Rollback: keep canonical contracts and revert only individual seam mappings if one source proves noisier than expected.
- **Documentation impact:**
  - Update any operator docs that still describe the three seams as separate prescription authorities.
- **Notes / references:**
  - [replan-trigger.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/replan-trigger.ts)
  - [signal-review-review-required.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/signal-review-review-required.ts)
  - [lp-do-ideas-build-origin-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts)
- **Build Evidence (2026-03-10):**
  - Red evidence: `replan-trigger`, `signal-review-review-required`, and `lp-do-ideas-build-origin-bridge` each carried their own prescriptive text (`recommended_focus`, `suggested_action`, `next_scope_now`) without a shared canonical `gap_case` / `prescription` object.
  - Green: added `self-evolving-prescription-normalization.ts` as the shared deterministic builder for compiled candidate IDs, `gap_case`, and `prescription`; replan triggers and signal-review review-required sidecars now emit canonical objects; build-origin dispatch provenance now carries canonical objects and `dispatch.v2` validates them when present.
  - Compatibility scope: preserved the existing human-readable fields and current queue routing behavior, but demoted them to derived narrative alongside canonical identities rather than separate prescriptive authorities.
  - TC-01: pass. Replan trigger output now emits canonical bottleneck `gap_case` / `prescription` identity, and focused trigger tests assert the normalized source and required route.
  - TC-02: pass. Build-origin bridge queue admissions now carry canonical build-origin `gap_case` / `prescription` provenance while preserving current route/status behavior, and the dispatch contract/schema accept and validate those fields.
  - TC-03: pass. Signal-review sidecars now preserve their actionable operator narrative while emitting canonical signal-review `gap_case` / `prescription` identity; focused tests assert both narrative continuity and canonical fields.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted `pnpm exec eslint --no-warn-ignored ...`, `pnpm plans:lint`, and `bash scripts/validate-changes.sh` all passed.
  - Precursor completion propagation: TASK-02 no longer blocks TASK-03, TASK-04, or TASK-07. The next runnable task is TASK-03.

### TASK-03: Add requirement posture and prescription maturity to queue and policy routing
- **Type:** IMPLEMENT
- **Deliverable:** runtime and queue contracts carry explicit `requirement_posture`, `blocking_scope`, and `prescription_maturity`, with `unknown` forcing fact-find routing and one ordered precedence model for hard rules, posture, utility, and governance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-prescription-normalization.ts`, `scripts/src/startup-loop/replan-trigger.ts`, `scripts/src/startup-loop/diagnostics/signal-review-review-required.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/replan-trigger.test.ts`, `scripts/src/startup-loop/__tests__/signal-review-review-required.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-build-origin-bridge.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-portfolio.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04, TASK-06, TASK-07, TASK-08, TASK-09
- **Confidence:** 81%
  - Implementation: 80% - the new fields map cleanly onto existing hard-rule and utility seams.
  - Approach: 84% - explicit posture and maturity are the missing concept layer between “can improve” and “should do now.”
  - Impact: 81% - this is what stops the learned loop from over-prescribing or fabricating certainty.
- **Acceptance:**
  - The runtime can say whether a gap is absolute, relative, or optional.
  - Unknown prescriptions deterministically route to fact-find rather than plan/build.
  - Hard rules, utility, governance, and `requirement_posture` have one explicit precedence story instead of parallel contradictory judgments.
- **Validation contract (TC-03):**
  - TC-01: an `unknown` prescription cannot bypass fact-find.
  - TC-02: absolute requirements can still block stages/routes regardless of utility.
  - TC-03: relative and optional items remain portfolio-constrained rather than becoming implicit blockers.
  - TC-04: precedence is documented as an ordered model, not inferred from scattered checks.
- **Execution plan:** Red -> add routing tests that prove posture/maturity are absent today; Green -> add fields and precedence logic; Refactor -> remove duplicate inferred posture logic left in downstream consumers.
- **Planning validation (required for M/L):**
  - Checks run: verified hard rules and utility selection already coexist, but requirement posture is not explicit.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
  - Unexpected findings: posture cannot be bolted on as a passive label; it must participate in precedence with hard rules and governance.
- **Scouts:** None: the precedence issue is already visible in the current runtime layering.
- **Edge Cases & Hardening:** ensure optional improvements do not become hidden blockers; ensure absolute requirements cannot be softened by stochastic exploration later.
- **What would make this >=90%:**
  - A truth table showing precedence across posture, portfolio hard rules, governance overrides, exploration, and route selection.
- **Rollout / rollback:**
  - Rollout: add fields and precedence in one slice so downstream behavior stays internally consistent.
  - Rollback: revert routing precedence changes together; do not leave posture fields present but ignored.
- **Documentation impact:**
  - Update any startup-loop workflow guide that describes improvement urgency only narratively.
- **Notes / references:**
  - [self-evolving-scoring.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts)
  - [self-evolving-portfolio.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts)
- **Build Evidence (2026-03-10):**
  - Red evidence: the runtime could carry canonical `gap_case` and `prescription` identities, but it still treated urgency and remedy maturity as implicit heuristics. Unknown remedies were not a tracked state, absolute requirements were not expressible in routing/selection, and queue handoff could not preserve those semantics.
  - Green: added first-class `requirement_posture`, `blocking_scope`, and `prescription_maturity` enums to startup-loop contracts; normalized seam emitters now populate those fields; queue/self-evolving linkage preserves them across handoff; route decisions derive one shared semantics object; and the orchestrator now forces `unknown` / `hypothesized` prescriptions back to `lp-do-fact-find` while absolute-required rejects reopen as fact-find rather than disappearing.
  - Precedence model implemented: hard rules still filter first, learned-prescription routing semantics then constrain the candidate route, portfolio selection applies an explicit absolute-required selection bonus only after hard-rule admissibility, and later governance/exploration layers continue to operate on that bounded candidate set. This keeps posture inside one ordered model instead of creating a fourth conflicting opinion surface.
  - TC-01: pass. A new orchestrator integration case proves measured `new_skill` observations still route to `lp-do-fact-find` with `prescription_unknown_requires_fact_find`, and the resulting policy decision records preserve `requirement_posture` and `prescription_maturity`.
  - TC-02: pass. A new portfolio-selection case proves an `absolute_required` candidate is selected ahead of higher-utility relative work when both satisfy the same hard rules, so stage-blocking posture survives utility ranking without bypassing admissibility constraints.
  - TC-03: pass. Relative and optional work remain portfolio-constrained: no hard-rule filters were loosened, non-fact-find evidence floors still apply, and dispatch/self-evolving link validation now carries posture/maturity semantics without turning them into unconditional blockers.
  - TC-04: pass. The precedence model is now explicit in runtime code and this plan task: seam normalization emits posture/maturity, `deriveCandidateRoutingSemantics()` centralizes the defaults, the orchestrator applies learned-prescription routing after evidence-aware routing, and portfolio selection applies posture only after hard-rule admissibility is known.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` and targeted `pnpm exec eslint --no-warn-ignored ...` passed on the full touched TASK-03 surface.
  - Precursor completion propagation: TASK-03 no longer blocks TASK-04, TASK-06, TASK-07, TASK-08, or TASK-09. The next runnable wave is TASK-04 and TASK-07, with TASK-04 the next core learning step.

### TASK-04: Extend policy journaling and evaluation for prescription-choice learning
- **Type:** IMPLEMENT
- **Deliverable:** self-evolving policy journal and evaluation dataset record prescription choice and remedy outcome attribution
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-evaluation.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-report.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** TASK-08, TASK-09
- **Confidence:** 81%
  - Implementation: 80% - the journal/evaluation seams are already explicit and replay-oriented.
  - Approach: 82% - learning remedy quality belongs in the existing decision/evaluation spine, not in queue prose.
  - Impact: 81% - without this the loop would still only learn routing quality.
- **Acceptance:**
  - The decision journal can record a chosen prescription, not just a chosen route.
  - The evaluation dataset can attribute outcomes back to gap case and prescription identity.
  - Reporting surfaces expose prescription-level replay coverage and outcome quality.
- **Validation contract (TC-04):**
  - TC-01: policy decision records can encode `prescription_choice`.
  - TC-02: evaluation records can join a completed outcome back to prescription identity.
  - TC-03: dashboards/reports surface prescription-level coverage instead of only candidate-level counts.
- **Execution plan:** Red -> add failing contract/report tests for missing prescription fields; Green -> extend journal/evaluation/reporting; Refactor -> align naming and avoid duplicate candidate-only projections where the new fields supersede them.
- **Planning validation (required for M/L):**
  - Checks run: verified current journal and evaluation dataset are decision-centric but not prescription-centric.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts`
  - Unexpected findings: none beyond the expected candidate-centric limitation.
- **Scouts:** None: the extension point is already explicit.
- **Edge Cases & Hardening:** preserve backward readability for historical decision rows; do not mark replay-ready if prescription identity is absent or synthetic.
- **What would make this >=90%:**
  - A field-level before/after example for one real decision and one completed outcome.
- **Rollout / rollback:**
  - Rollout: extend journal and evaluation together so new decisions are learnable immediately.
  - Rollback: revert both surfaces in the same change if the identity model proves unstable.
- **Documentation impact:**
  - Update the learned-prescription fact-find and any self-evolving reporting notes.
- **Notes / references:**
  - [self-evolving-evaluation.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts)
- **Build Evidence (2026-03-10):**
  - Red evidence: policy decisions could only learn route quality. Even after canonical `gap_case` / `prescription` references existed, route decisions did not record an explicit chosen prescription, evaluation records could not summarize remedy-family replay coverage, and the main repeat-work candidate builder still emitted prescription-free candidates.
  - Green: added `prescription-choice.v1` to the policy-decision contract; `buildPolicyDecisionRecord()` now journals canonical gap/prescription references plus an explicit `prescription_choice`; repeat-work candidates now emit canonical self-evolving `gap_case` and `prescription` objects; queue completion stamps those references into outcome payloads; and evaluation/report/dashboard surfaces now expose prescription-level attribution, replay coverage, and observed-outcome counts.
  - Identity continuity: the same canonical prescription identity now survives candidate creation, route decision, queue handoff, completion outcome emission, evaluation replay, and reporting. This closes the earlier gap where prescription learning would have been mostly dead data for self-evolving repeat candidates.
  - TC-01: pass. Policy decision records can now encode `prescription_choice`, and contract tests cover valid and mismatch cases so the journal cannot silently drift away from the chosen prescription.
  - TC-02: pass. Evaluation records now carry `gap_case_id`, `prescription_id`, `prescription_family`, and `prescription_choice_present`, and summary telemetry counts attributed, replay-ready, and observed prescription decisions.
  - TC-03: pass. Reporting surfaces now expose prescription-level replay coverage and top prescription-family outcomes, while the dashboard shows prescription attribution counts and rates alongside the existing candidate-level audit surfaces.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` and targeted `pnpm exec eslint --no-warn-ignored ...` passed on the full TASK-04 surface.
  - Precursor completion propagation: TASK-04 no longer blocks TASK-08 or TASK-09. The next runnable implementation wave is TASK-06 and TASK-07, with TASK-07 the narrower evidence-surface slice.

### TASK-05: Map milestone roots to runtime producers and unify activation thresholds
- **Type:** INVESTIGATE
- **Deliverable:** [milestone-root-producer-map.md](/Users/petercowling/base-shop/docs/plans/startup-loop-learned-prescription-system/artifacts/milestone-root-producer-map.md) with contract-backed milestone roots, concrete runtime producer seams, alias policy, and unified activation precedence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `docs/business-os/startup-loop/schemas/sales-ops-schema.md`, `docs/business-os/startup-loop/schemas/retention-schema.md`, `docs/business-os/startup-loop/process-registry-v2.md`, `docs/business-os/startup-loop/specifications/process-assignment-v2.yaml`, `scripts/src/startup-loop/**`
- **Depends on:** -
- **Blocks:** TASK-06, TASK-09
- **Confidence:** 78%
  - Implementation: 75% - the repo clearly defines activation conditions but not yet the producer seams.
  - Approach: 80% - this must be solved before runtime milestone events are added.
  - Impact: 78% - if milestone roots are wrong, the lateral bundle layer will optimize on ghosts.
- **Questions to answer:**
  - Which contract phrases are canonical milestone roots, and which proposed runtime aliases are permissible?
  - Where in startup-loop code can those roots actually be emitted today?
  - How should CAP-06 and GTM-4 precedence be unified when their thresholds diverge?
- **Acceptance:**
  - One authoritative milestone-root map exists for this feature.
  - Producer seams are named concretely enough for TASK-06 to implement without a second discovery pass.
  - Each proposed runtime root is either backed by a producer seam or explicitly deferred; contract-only roots cannot silently pass through.
  - Threshold conflicts are either resolved or reduced to one bounded implementation choice.
- **Validation contract:** planning-ready artifact with explicit milestone roots, producers, and precedence rules; no open ambiguity remains about current contract truth.
- **Planning validation:** existing contract references already audited in the fact-find; this task exists because producer seams are not yet explicit in code.
- **Rollout / rollback:** None: non-implementation task.
- **Documentation impact:** update the fact-find or a sibling artifact with the canonical root map.
- **Notes / references:**
  - [sales-ops-schema.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/schemas/sales-ops-schema.md)
  - [retention-schema.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/schemas/retention-schema.md)
  - [process-registry-v2.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/process-registry-v2.md)
  - [process-assignment-v2.yaml](/Users/petercowling/base-shop/docs/business-os/startup-loop/specifications/process-assignment-v2.yaml)
  - [milestone-root-producer-map.md](/Users/petercowling/base-shop/docs/plans/startup-loop-learned-prescription-system/artifacts/milestone-root-producer-map.md)
- **Build Evidence (2026-03-10):**
  - Reviewed the milestone contract layer in `sales-ops-schema.md`, `retention-schema.md`, `process-registry-v2.md`, `process-assignment-v2.yaml`, the capability contract, and the weekly KPCS prompt/template layer.
  - Reviewed runtime producer-adjacent code in `growth-metrics-adapter.ts`, `s10-growth-accounting.ts`, `funnel-metrics-extractor.ts`, plus repo-wide startup-loop searches for `sales-ops.user.md`, `retention.user.md`, `qualified lead`, `repeat signal`, `wholesale_accounts`, and weekly-packet writers.
  - Result: only `transaction_data_available` has a real code-backed metric seam today; `qualified_lead_or_enquiry_flow_present` and `repeat_signal_present` are contract-backed but producer-missing; `wholesale_accounts_positive` is a branch selector with no structured source field; `weekly_cycles_post_launch_gte_4` remains contract-only because no launch anchor or script-side weekly-packet writer exists.
  - Precedence resolved: CAP roots, branch selectors, and process prerequisites are now separated. `transaction_data_available` is not treated as an alias for `repeat_signal_present`, and the CAP-06 four-week backstop is explicitly capability-only.
  - Precursor completion propagation: TASK-05 no longer blocks TASK-06 or TASK-09. The next runnable wave is TASK-02 and TASK-03; TASK-06 now has a bounded implementation surface from this artifact instead of open milestone ambiguity.

### TASK-06: Add milestone-event triggers, producers, and lateral bundle generation
- **Type:** IMPLEMENT
- **Deliverable:** `milestone_event` support in the runtime, plus contract-root-backed producer adapters and bundle generation in shadow/advisory mode
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-classifier.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-milestone-bridge.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-milestone-bridge.test.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-05
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 80%
  - Implementation: 78% - the trigger family is straightforward, but producer seams depend on TASK-05.
  - Approach: 82% - starting from contract roots and shadow/advisory mode is the right safety boundary.
  - Impact: 80% - this is the bridge from static milestone contracts to actual lateral thinking in the runtime.
- **Acceptance:**
  - `dispatch.v2` and upstream intake paths can represent milestone events.
  - Runtime producers emit milestone roots grounded in current contracts, not invented aliases.
  - Lateral bundle generation is bounded, ranked, and non-actuating by default.
  - No milestone root is emitted from runtime without a producer mapping proven in TASK-05.
- **Validation contract (TC-06):**
  - TC-01: milestone events can be admitted without abusing `artifact_delta` or `operator_idea`.
  - TC-02: bundle generation uses requirement posture and does not explode into unconditional work.
  - TC-03: higher-level aliases remain optional mappings, not the source of truth.
- **Execution plan:** Red -> add trigger/model tests; Green -> add event family, producer adapters, and bundle generation; Refactor -> centralize root-to-alias mapping and avoid scattered milestone logic.
- **Planning validation (required for M/L):**
  - Checks run: verified no native milestone trigger class exists today.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `docs/plans/startup-loop-learned-prescription-system/artifacts/milestone-root-producer-map.md`
  - Unexpected findings: milestone runtime work would reintroduce fragmentation if it bypassed the canonical normalization layer, so TASK-02 is a hard dependency rather than an optional cleanup. TASK-05 also proved the first runtime slice is asymmetric: `transaction_data_available` is metric-backed, `qualified_lead_or_enquiry_flow_present` and `repeat_signal_present` require artifact adapters, `wholesale_accounts_positive` needs a bounded structured source before runtime emission, and `weekly_cycles_post_launch_gte_4` stays explicitly deferred until a launch anchor exists.
- **Scouts:** TASK-05
- **Edge Cases & Hardening:** prevent duplicate milestone emissions across multiple upstream sources; keep bundle generation advisory until rollout checkpoint.
  - Keep “first sale” or “first stockist live” as optional higher-level aliases only after lower-level contract roots are observable in code.
- **What would make this >=90%:**
  - A concrete producer inventory from TASK-05 with one sample event payload per root.
- **Rollout / rollback:**
  - Rollout: shadow first, then advisory only after bundle quality is observable.
  - Rollback: disable producer emission while preserving the trigger contract if bundle logic proves noisy.
- **Documentation impact:**
  - Update startup-loop docs that currently describe milestone activation as doc-only.
- **Notes / references:**
  - [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts)
  - [lp-do-ideas-milestone-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-milestone-bridge.ts)
  - [lp-do-ideas-trial-contract.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md)
- **Build Evidence (2026-03-10):**
  - Red evidence: the runtime still had no native milestone trigger class, no bounded producer bridge for contract-backed roots, and no way to emit lateral follow-up bundles without abusing `artifact_delta` or `operator_idea`.
  - Green: `dispatch.v2` now supports `trigger: "milestone_event"` with a required `milestone_origin` provenance block; the new milestone bridge emits bounded shadow/advisory packets for `transaction_data_available`, `qualified_lead_or_enquiry_flow_present`, and `repeat_signal_present`; and `self-evolving-from-ideas` now turns those packets into milestone-scoped observations with canonical recurrence and evidence references.
  - Scope control: the first slice stays inside the TASK-05 producer truth. `wholesale_accounts_positive` and `weekly_cycles_post_launch_gte_4` remain deliberately non-emitting because they still lack bounded structured producers in code.
  - Bundle discipline: milestone roots now expand into a small fixed bundle with explicit `requirement_posture`, `prescription_maturity`, and route choices instead of an unbounded task spray. `transaction_data_available` emits one fact-find bundle, `qualified_lead_or_enquiry_flow_present` emits one plan bundle, and `repeat_signal_present` emits one plan plus one optional fact-find bundle.
  - TC-01: pass. `milestone_event` packets are admitted through `dispatch.v2` without pretending to be `artifact_delta` or `operator_idea`, and validation rejects missing or mismatched milestone provenance.
  - TC-02: pass. Bundle generation is bounded, route-aligned, and posture-aware; “not-yet-active” artifact contracts emit nothing, and route mismatches fail closed.
  - TC-03: pass. Higher-level phrases like “first sale” remain downstream aliases only; runtime source-of-truth roots stay pinned to the concrete contract-backed IDs from TASK-05.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted `pnpm exec eslint --no-warn-ignored ...`, `pnpm plans:lint`, `git diff --check`, and `bash scripts/validate-changes.sh` passed on the TASK-06 surface.
  - Precursor completion propagation: TASK-06 no longer blocks TASK-09 or TASK-10. The next runnable task is TASK-09.

### TASK-07: Widen live sensing for richer prescription evidence
- **Type:** IMPLEMENT
- **Deliverable:** richer build/output sensing into self-evolving observations so prescription decisions can consume more than `build-record`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`, `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-08, TASK-10
- **Confidence:** 80%
  - Implementation: 79% - the evidence-surface gap is concrete and the bridge already exposes richer artifact paths.
  - Approach: 82% - widening sensing before discovery enforcement keeps evidence quality and contract maturity separate.
  - Impact: 80% - without this task the prescription system stays starved even if later contracts are correct.
- **Acceptance:**
  - The self-evolving build bridge consumes richer review artifacts than `build-record` alone.
  - Richer evidence is normalized into canonical gap/prescription inputs rather than side-channel heuristics.
  - Missing richer artifacts fail closed or degrade explicitly instead of silently pretending no evidence exists.
  - The richer sensing surface is good enough that TASK-08 can shape discovery outputs from evidence rather than narrative guesswork.
- **Validation contract (TC-07):**
  - TC-01: build-output observation seeding can include richer review evidence without regressing existing behavior.
  - TC-02: richer review artifacts are consumed through canonical normalization rather than ad hoc parsing.
  - TC-03: missing or malformed richer artifacts degrade explicitly rather than disappearing silently.
- **Execution plan:** Red -> add coverage around current narrow sensing; Green -> widen sensing and normalize richer evidence; Refactor -> centralize fallback/degradation paths so later tasks can rely on them.
- **Planning validation (required for M/L):**
  - Checks run: verified build bridge interface is richer than live seeding.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
  - Unexpected findings: the bridge accepts richer paths today, so explicit degradation behavior matters as much as new evidence ingestion.
- **Scouts:** None: the need is already directly evidenced.
- **Edge Cases & Hardening:** preserve current fallback if richer review artifacts are missing; surface explicit warnings when richer evidence is absent or malformed.
- **What would make this >=90%:**
  - A concrete example of one plan with both build-review sidecars present and one with only `build-record`, showing the intended explicit degradation behavior.
- **Rollout / rollback:**
  - Rollout: widen sensing behind existing observation types.
  - Rollback: revert richer evidence ingestion while preserving explicit degradation warnings if one source proves too noisy.
- **Documentation impact:**
  - Update self-evolving bridge notes to explain richer evidence usage and degradation behavior.
- **Notes / references:**
  - [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts)
- **Build Evidence (2026-03-10):**
  - Red evidence: the bridge already accepted `results-review` and `pattern-reflection` paths, but the live seed path still ingested only `build-record`, which starved the learned-prescription system of the richer build-review evidence surface it already described.
  - Green: `runSelfEvolvingFromBuildOutput()` now extracts richer observation seeds from `results-review.user.md` and `pattern-reflection.user.md`, merges duplicate seeds by normalized recurrence key before observation emission, and records explicit degradation warnings when richer artifacts are missing or contain no usable seeds.
  - Normalization boundary: richer review artifacts still enter the loop as `meta-observation.v2` records, but they now do so through one merged observation-seed path instead of side-channel-only artifact awareness. This preserves the existing self-evolving normalization spine rather than inventing a second parser-to-policy route.
  - TC-01: pass. Integrity tests now prove that real `results-review` markdown and `pattern-reflection` markdown increase build-output observation count beyond the `build-record` baseline without regressing existing build-record behavior.
  - TC-02: pass. Duplicate richer review signals now merge by normalized recurrence key, so the bridge does not double-count equivalent results-review and pattern-reflection findings.
  - TC-03: pass. Missing or empty richer artifacts no longer disappear silently: the bridge emits explicit warnings for missing artifacts and for present artifacts that yield no usable richer seeds.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit` and targeted `pnpm exec eslint --no-warn-ignored ...` passed on the TASK-07 surface.
  - Precursor completion propagation: TASK-07 no longer blocks TASK-08 or TASK-10. The next runnable task is TASK-08, with TASK-06 still available as the milestone-trigger lane.

### TASK-08: Define and enforce the discovery-output contract for unknown prescriptions
- **Type:** IMPLEMENT
- **Deliverable:** an explicit startup-loop fact-find discovery-output contract for unknown prescriptions, with minimum machine fields (`gap_case_id`, `prescription_candidates[]`, `recommended_first_prescription`, `required_inputs`, `expected_artifacts`, `expected_signals`), plus routing/runtime enforcement that uses it
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-10)
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`, `docs/plans/_templates/fact-find-planning.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-backbone-consume.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/__tests__/self-evolving-contracts.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-dispatch-v2.test.ts`
- **Depends on:** TASK-01, TASK-03, TASK-07
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 80%
  - Implementation: 79% - the fallback route already exists, but the missing piece is a concrete output contract and runtime enforcement.
  - Approach: 82% - unknown prescriptions need a stronger contract, not more ad hoc prose.
  - Impact: 80% - without this, the system can detect uncertainty but still cannot graduate unknowns into structured prescriptions cleanly.
- **Acceptance:**
  - Unknown prescriptions route to fact-find with an explicit discovery-output contract.
  - Discovery outputs are specific enough to create a `structured` prescription candidate without free-text interpretation.
  - The runtime can distinguish “unknown”, “hypothesized”, and “structured” prescriptions operationally.
  - The discovery contract is minimal enough to be routinely usable and strict enough to block narrative-only pseudo-structure.
- **Validation contract (TC-08):**
  - TC-01: unknown prescriptions cannot bypass the discovery contract.
  - TC-02: discovery outputs contain the minimum fields needed for later policy and queue consumers.
  - TC-03: the route from `unknown` to `structured` is explicit in code/docs, not only by convention.
  - TC-04: narrative rationale may enrich discovery outputs, but cannot substitute for the required machine fields.
- **Execution plan:** Red -> add tests/assertions around missing discovery outputs; Green -> define the contract and enforce routing/use of it; Refactor -> centralize state transitions so discovery maturation is not reimplemented per seam.
- **Planning validation (required for M/L):**
  - Checks run: verified fact-find fallback exists today, but not as an explicit discovery-output contract.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `.claude/skills/lp-do-fact-find/SKILL.md`
  - Unexpected findings: none beyond the expected behavior-vs-contract gap.
- **Scouts:** None: the contract gap is already directly evidenced.
- **Edge Cases & Hardening:** prevent empty or narrative-only discovery outputs from being treated as structured prescriptions.
  - Avoid making first-encounter fact-finds so heavy that the runtime starts bypassing the contract in practice.
- **What would make this >=90%:**
  - One real example of an unknown prescription maturing into a structured prescription through the new output contract.
- **Rollout / rollback:**
  - Rollout: contract first, enforcement second.
  - Rollback: remove enforcement while preserving the output contract if consumers need one more alignment pass.
- **Documentation impact:**
  - Update fact-find/future workflow docs to explain unknown-prescription discovery outputs.
- **Notes / references:**
  - [.claude/skills/lp-do-fact-find/SKILL.md](/Users/petercowling/base-shop/.claude/skills/lp-do-fact-find/SKILL.md)
- **Build Evidence (2026-03-10):**
  - Red evidence: `unknown` and `hypothesized` prescriptions could be routed back to fact-find, but neither queue handoff nor fact-find output had an explicit machine contract for what discovery had to return. That left the runtime relying on convention and narrative prose to mature a prescription.
  - Green: added canonical `UnknownPrescriptionDiscoveryContract` and `DiscoveryPrescriptionCandidate` types plus validators/builders in `self-evolving-contracts.ts`; queue self-evolving links can now carry a typed discovery contract; `dispatch.v2` validation now requires that contract for `unknown` and `hypothesized` prescription maturity and verifies its gap-case and recommended-prescription linkage; self-evolving backbone consume now emits the discovery contract plus a concrete fact-find scope string; and the fact-find skill/template/output contract docs now require a `## Discovery Contract Output` section with the minimum machine fields.
  - TC-01: pass. Unknown-maturity and hypothesized-maturity dispatches cannot bypass discovery contract validation; focused `dispatch.v2` tests now fail when the contract is missing and pass when the typed contract is present.
  - TC-02: pass. The discovery contract now enforces the minimum machine fields needed by later queue and policy consumers: `gap_case_id`, `prescription_candidates[]`, `recommended_first_prescription_id`, `required_inputs`, `expected_artifacts`, and `expected_signals`.
  - TC-03: pass. The runtime route from `unknown` / `hypothesized` to structured discovery is explicit in both code and workflow docs: queue handoff emits the discovery contract, `lp-do-fact-find` is instructed to return the structured output, and the shared fact-find template/output contract now names the required section and fields.
  - TC-04: pass. Narrative rationale remains allowed, but it cannot substitute for structure: the skill, template, and loop output contract all now require the machine-readable discovery fields when a self-evolving discovery contract is present.
  - Validation: `pnpm exec tsc -p scripts/tsconfig.json --noEmit`, targeted `pnpm exec eslint --no-warn-ignored ...`, `pnpm plans:lint`, `git diff --check`, and `bash scripts/validate-changes.sh` all passed on the TASK-08 surface.
  - Precursor completion propagation: TASK-08 no longer blocks TASK-09 or TASK-10. The next runnable implementation task is TASK-06, which must land before guarded promotion work can proceed.

### TASK-09: Add a guarded promotion path for proven prescriptions
- **Type:** IMPLEMENT
- **Deliverable:** a bounded promotion path from proven prescriptions into maintained prompts/contracts/write-back or low-risk autofix classes
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-autofix.ts`, related self-evolving promotion/reporting code, relevant prompt/contract docs
- **Depends on:** TASK-03, TASK-04, TASK-06, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 79% - the target seams are concrete, and the scope is now explicitly bounded to guarded nomination plus the lowest-risk writer surfaces.
  - Approach: 81% - promotion must remain guarded and evidence-backed, not automatic.
  - Impact: 80% - without this the system can learn prescriptions but not feed them back into operating knowledge.
- **Acceptance:**
  - Proven prescriptions can be nominated for guarded promotion without bypassing existing safety boundaries.
  - Promotion remains bounded to prompts/contracts/write-back or low-risk autofix classes rather than general autonomy.
  - Reports can distinguish proven-but-unpromoted from promoted prescriptions.
  - Promotion proof and promotion safety remain separate recorded checks all the way to the writer surface.
- **Validation contract (TC-09):**
  - TC-01: promotion candidates require proof from prescription-level outcomes, not narrative selection.
  - TC-02: guarded promotion cannot silently actuate high-risk changes.
  - TC-03: write-back/autofix surfaces remain opt-in and auditable.
  - TC-04: “proven effective” does not imply “safe to promote” unless a second safety threshold is also met.
- **Execution plan:** Red -> add tests/assertions around absent promotion path; Green -> implement guarded nomination and promotion flow; Refactor -> centralize proof thresholds and promotion reason codes.
- **Planning validation (required for M/L):**
  - Checks run: verified write-back is manual and autofix has no live runtime caller.
  - Validation artifacts: `docs/plans/startup-loop-learned-prescription-system/fact-find.md`, `scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-autofix.ts`
  - Unexpected findings: none beyond the expected absence of a live path.
- **Scouts:** None: the seam inventory is already explicit.
- **Edge Cases & Hardening:** keep “proven” separate from “safe to promote”; ensure promotion can be shadow/advisory before any guarded write path exists.
- **What would make this >=90%:**
  - A concrete bounded list of promotable surfaces and a proof threshold table.
- **Rollout / rollback:**
  - Rollout: start with nomination/reporting, then guarded write-back for the lowest-risk surface only.
  - Rollback: disable promotion writers while preserving proof telemetry if the boundary proves too porous.
- **Documentation impact:**
  - Update self-evolving write-back and promotion docs once the guarded path exists.
- **Notes / references:**
  - [self-evolving-write-back.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts)
  - [self-evolving-autofix.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-autofix.ts)

### TASK-10: Check resulting-system coherence and rollout readiness
- **Type:** CHECKPOINT
- **Deliverable:** a replay-backed checkpoint section or sibling artifact proving whether the resulting learned-prescription system is coherent enough to take forward inside current trial boundaries
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** plan evidence, replay/report artifacts, any guarded rollout notes
- **Depends on:** TASK-04, TASK-05, TASK-06, TASK-07, TASK-08, TASK-09
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint logic is straightforward once precursor tasks are complete.
  - Approach: 95% - the resulting system must be rehearsed before any further rollout.
  - Impact: 95% - this is the stop/go gate for the first coherent learned-prescription system.
- **Acceptance:**
  - The checkpoint can explain how `gap_case`, prescription choice, milestone triggers, discovery outputs, and guarded promotion fit together end to end.
  - Any unresolved contradictions are explicit and severity-ranked.
  - The checkpoint states whether the plan can move to build continuation without another replan.
  - The checkpoint explicitly decides whether identity mapping, milestone producer coverage, posture precedence, and promotion safety are each good enough to proceed.
- **Validation contract (TC-10):**
  - TC-01: resulting-system walk-through is grounded in code and artifacts, not plan intent alone.
  - TC-02: no critical contradiction remains between candidate identity, gap-case identity, and queue/runtime behavior.
  - TC-03: rollout boundary is explicit: shadow/advisory vs guarded.
  - TC-04: no milestone-trigger behavior depends on contract prose without a runtime producer.
  - TC-05: promotion efficacy and promotion safety are each evaluated explicitly.
- **Execution plan:** Rehearse -> verify -> decide.
- **Planning validation:** None: checkpoint task.
- **Rollout / rollback:** None: checkpoint task.
- **Documentation impact:**
  - Update this plan with checkpoint evidence and any resulting replan.
- **Notes / references:**
  - [fact-find.md](/Users/petercowling/base-shop/docs/plans/startup-loop-learned-prescription-system/fact-find.md)

## Risks & Mitigations
- Dual identity drift between `gap_case` and `candidate_id`.
  - Mitigation: TASK-01 must define deterministic compilation or explicit replacement boundaries.
- Milestone triggers become doc-driven instead of event-driven.
  - Mitigation: TASK-05 and TASK-06 require real producer seams and root maps before rollout.
- Requirement posture conflicts with existing hard rules and governance.
  - Mitigation: TASK-03 must define precedence explicitly and test it.
- Unknown prescriptions stay vague even after routing to fact-find.
  - Mitigation: TASK-08 adds a discovery-output contract rather than relying on convention, and TASK-07 ensures the evidence surface can feed it.
- Promotion proof is confused with promotion safety.
  - Mitigation: TASK-09 keeps those as separate checks and TASK-10 verifies the separation holds at rollout time.

## Observability
- Logging:
  - emit `gap_case_id`, `prescription_id`, `requirement_posture`, `prescription_maturity`, and milestone root source where decisions are journaled
- Metrics:
  - gap-case normalization coverage
  - unknown-prescription to structured-prescription conversion rate
  - prescription-choice replay coverage
  - milestone bundle admission volume by root
  - promoted vs proven-but-unpromoted prescription counts
- Alerts/Dashboards:
  - flag any queue emission that still depends on fragmented suggestion strings without canonical prescription identity
  - flag milestone events emitted without a mapped contract root
  - flag promotion attempts without proof-quality thresholds met

## Acceptance Criteria (overall)
- [ ] The startup loop has one canonical `gap_case` and `prescription` vocabulary instead of fragmented suggestion seams.
- [ ] The runtime can distinguish absolute, relative, and optional work, plus unknown vs structured vs proven prescriptions.
- [ ] The self-evolving journal/evaluation layer can learn remedy quality, not just route quality.
- [ ] Milestone-triggered lateral bundles are grounded in current contract roots and emitted by real runtime producers.
- [ ] Unknown prescriptions have an explicit fact-find discovery contract.
- [ ] Proven prescriptions have a guarded promotion path that stays within trial boundaries.

## Decision Log
- 2026-03-10: Chose a contract-first plan rather than adding milestone and prescription behavior directly into the current candidate-centric runtime.
- 2026-03-10: Kept the plan in `plan-only` mode because the operator explicitly asked for planning and critique, not immediate build execution.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted task confidence:
  - TASK-01: 82 x 2 = 164
  - TASK-02: 80 x 2 = 160
  - TASK-03: 81 x 2 = 162
  - TASK-04: 81 x 2 = 162
  - TASK-05: 78 x 2 = 156
  - TASK-06: 80 x 2 = 160
  - TASK-07: 80 x 2 = 160
  - TASK-08: 80 x 2 = 160
  - TASK-09: 80 x 2 = 160
  - TASK-10: 95 x 1 = 95
- Total weight = 19
- Overall-confidence = 1539 / 19 = 81.0% -> 81%

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Define canonical `gap-case.v1` and `prescription.v1` contracts | Yes | Major: identity mapping must become explicit at the contract layer or every later task risks dual live identity drift | Yes |
| TASK-05: Map milestone roots to runtime producers and unify activation thresholds | Yes | Moderate: only `transaction_data_available` has a real code-backed seam; the other milestone roots require artifact adapters, a bounded source-field addition, or explicit defer | Yes |
| TASK-02: Normalize existing suggestion seams onto canonical shapes | Yes | Moderate: three fragmented seams preserve different operator-readable wording that must not be lost during normalization | Yes |
| TASK-03: Add requirement posture and prescription maturity | Yes | Moderate: posture must not become a parallel opinion layer beside hard rules and governance; precedence must be explicit and testable | Yes |
| TASK-04: Extend policy journaling and evaluation | Yes | Moderate: candidate-centric history must remain readable while prescription identity is introduced | Yes |
| TASK-06: Add milestone-event triggers, producers, and bundle generation | Partial | Major: the first runtime slice is asymmetric and must respect TASK-05 boundaries instead of pretending all milestone roots are equally observable | Yes |
| TASK-07: Widen live sensing for richer prescription evidence | Yes | Moderate: build-output widening must fail closed when richer review artifacts are absent or malformed, or the maturity wave stays underfed | Yes |
| TASK-08: Define and enforce the discovery-output contract for unknown prescriptions | Yes | Moderate: discovery outputs must be specific enough to mature unknown prescriptions without turning narrative prose into fake structure, but light enough to remain usable | Yes |
| TASK-09: Add a guarded promotion path for proven prescriptions | Partial | Major: promotion proof and promotion safety are easy to conflate unless guarded thresholds remain separate and reported separately | Yes |
| TASK-10: Check resulting-system coherence and rollout readiness | Yes | None, provided TASK-01 through TASK-09 close their identity, producer, precedence, discovery, and promotion issues | No |
