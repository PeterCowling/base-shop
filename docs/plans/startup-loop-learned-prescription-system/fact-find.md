---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-10
Last-updated: 2026-03-10
Feature-Slug: startup-loop-learned-prescription-system
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: startup-loop-gap-fill
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-plan, lp-do-ideas, startup-loop
Related-Plan: docs/plans/startup-loop-learned-prescription-system/plan.md
Trigger-Why: The startup loop already detects many weaknesses and already emits some suggested next moves, but those prescriptions are fragmented, not learned as a system, and not yet able to distinguish absolute requirements, relative requirements, unknown remedies, and milestone-triggered lateral follow-up.
Trigger-Intended-Outcome: "type: operational | statement: The repo has a code-backed account of the true missing parts needed for a single learned prescription system in the startup loop, framed as planning-ready improvement opportunities with explicit boundaries, trigger classes, and outcome-learning seams. | source: operator"
---

# Startup Loop Learned Prescription System Fact-Find Brief

## Scope
### Summary
The startup loop does not start from zero. It already has multiple prescriptive seams: persistent bottlenecks emit `recommended_focus`, build-origin findings carry `suggested_action` into queue dispatches, signal review repeats persist `suggested_action`, and the self-evolving runtime already chooses between `lp-do-fact-find`, `lp-do-plan`, `lp-do-build`, and `reject`. The real gap is not "add prescriptions." The real gap is that prescriptions are fragmented across different subsystems, are not tracked as first-class policy choices, do not distinguish absolute vs relative necessity, do not model "prescription unknown" as a normal state, and do not have a milestone-trigger class for events like first sale, first qualified lead, or first stockist placement. This fact-find wraps those missing parts into one planning-ready thread.

### Goals
- Describe the current code-backed prescriptive capability that already exists in the startup loop.
- Identify the true missing parts needed for a single learned prescription system.
- Distinguish hard requirements from relative opportunities and optional improvements.
- Define the missing trigger classes, decision contracts, and learning seams required for prescriptions to improve over time.
- Record the milestone-event gap explicitly, using current CAP-05, CAP-06, GTM-2, GTM-3, and GTM-4 contracts as evidence.
- Produce a planning-ready opportunity set rather than a generic architecture essay.

### Non-goals
- Implement the learned prescription system in this brief.
- Redesign the whole self-evolving runtime or replace the current queue architecture.
- Claim that the startup loop currently has no prescriptions at all.
- Turn all milestone events into automatic execution.
- Resolve every contract inconsistency across the startup loop in this fact-find.

### Constraints & Assumptions
- Constraints:
  - Code and repo docs are the sole source of truth for current behavior and current contract state.
  - The canonical execution spine remains the existing queue and `dispatch.v2` workflow.
  - Hard gates, authority limits, and safety controls must remain declarative rather than learned away.
- Assumptions:
  - The correct future system extends the current candidate/queue/evaluation spine instead of creating a parallel loop.
  - Unknown prescriptions are common and should route to discovery rather than fabricated plans.
  - Milestone events are different from gap events and need their own trigger class.

## Outcome Contract
- **Why:** The startup loop already detects many weaknesses and already emits some suggested next moves, but those prescriptions are fragmented, not learned as a system, and not yet able to distinguish absolute requirements, relative requirements, unknown remedies, and milestone-triggered lateral follow-up.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The repo has a code-backed account of the true missing parts needed for a single learned prescription system in the startup loop, framed as planning-ready improvement opportunities with explicit boundaries, trigger classes, and outcome-learning seams.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/replan-trigger.ts` - persistent bottleneck follow-up trigger with coarse `recommended_focus`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts` - build-origin signal bridge that converts review findings into queue dispatches with `next_scope_now`.
- `scripts/src/startup-loop/diagnostics/signal-review-review-required.ts` - repeat signal-review sidecar that carries `suggested_action`.
- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` - self-evolving policy and lifecycle decision contracts.
- `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts` - current outcome and replay evaluation dataset.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - canonical dispatch contract and trigger type model.

### Key Modules / Files
- `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts` - builds route decisions, policy state, and utility; currently chooses route but not remedy.
- `scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts` - applies hard rules and constrained selection with evidence floor, blast radius, and WIP caps.
- `scripts/src/startup-loop/self-evolving/self-evolving-governance.ts` - applies hold-window and delta-cap stabilizers.
- `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md` - milestone-sensitive capability activation registry.
- `docs/business-os/startup-loop/schemas/sales-ops-schema.md` - CAP-05 activation gate at first qualified lead flow.
- `docs/business-os/startup-loop/schemas/retention-schema.md` - CAP-06 activation gate at first repeat/re-booking signal or elapsed weekly cycles.
- `docs/business-os/startup-loop/process-registry-v2.md` - GTM-2 / GTM-3 / GTM-4 recurring processes and activation conditions.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - self-evolving build-output bridge; currently narrower in live observation seeding than its interface suggests.

### Patterns & Conventions Observed
- The repo already has multiple prescriptive outputs, but they are fragmented and typed inconsistently.
  - Evidence: `recommended_focus` in [replan-trigger.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/replan-trigger.ts#L71), `suggested_action` in [signal-review-review-required.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/diagnostics/signal-review-review-required.ts#L239), `next_scope_now` in [lp-do-ideas-build-origin-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts#L372).
- The policy system learns candidate-route quality and outcome quality, but not remedy quality.
  - Evidence: current decision types in [self-evolving-contracts.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts#L64) and evaluation dataset fields in [self-evolving-evaluation.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts#L14).
- Fact-find is already the native low-risk route for not-yet-well-formed work.
  - Evidence: route options in [self-evolving-scoring.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts#L694) and build-origin fallback wording in [lp-do-ideas-build-origin-bridge.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-build-origin-bridge.ts#L259).
- The runtime already distinguishes hard gating from relative prioritization in portfolio selection.
  - Evidence: hard rule screen in [self-evolving-portfolio.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-portfolio.ts#L149) and utility tradeoffs in [self-evolving-scoring.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts#L651).
- Milestone-driven activation exists in contracts and process docs, but not as a native runtime trigger class.
  - Evidence: trigger model limited to `artifact_delta | operator_idea` in [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts#L454), versus CAP-05/CAP-06/GTM-2/GTM-3/GTM-4 activation rules in startup-loop docs.

### Data & Contracts
- Policy decisions:
  - `candidate_route`, `portfolio_selection`, `exploration_rank`, `promotion_gate`, `override_record`
  - Evidence: [self-evolving-contracts.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts#L64)
- Evaluation dataset:
  - records chosen action, queue state, maturity, measurement, and positive outcome
  - Evidence: [self-evolving-evaluation.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts#L14)
- Queue linkage:
  - self-evolving queue linkage already carries `candidate_id`, `decision_id`, `policy_version`, route origin, and executor path
  - Evidence: [lp-do-ideas-queue-state-file.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts#L14)
- Dispatch trigger model:
  - current trigger types are only `artifact_delta` and `operator_idea`
  - Evidence: [lp-do-ideas-trial.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts#L454)

### Dependency & Impact Map
- Upstream dependencies:
  - self-evolving signal ingestion
  - build-origin review bridge
  - signal review repeat extraction
  - capability and process contracts
- Downstream dependents:
  - queue admission and workflow routing
  - self-evolving policy evaluation and audit
  - future prompt / contract / write-back promotion paths
- Likely blast radius:
  - self-evolving contracts
  - queue dispatch contract
  - build-origin bridge
  - evaluation / report paths
  - startup-loop contract docs for capability activation

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Unifying prescriptions under one contract will reduce duplicated reasoning and make remedy learning possible without replacing the queue spine. | Current queue and policy contracts are extensible enough | Medium | Low |
| H2 | The loop must explicitly model requirement posture (`absolute`, `relative`, `optional`) or it will over-prescribe. | Existing hard-rule vs utility split already exists | Low | Low |
| H3 | Unknown prescriptions should route to fact-find rather than plan/build, and the current code already supports that behavior. | `lp-do-fact-find` remains the lowest-risk route | Low | Low |
| H4 | Milestone events are a separate trigger family from gaps and artifacts. | Existing CAP/GTM activation contracts encode milestone-triggered process activation | Medium | Low |
| H5 | Remedy learning should happen at the decision journal and evaluation dataset level, not in free-text queue fields. | Current policy/evaluation contracts are the right learning seam | Medium | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Three separate prescription carriers already exist | `replan-trigger.ts`, `signal-review-review-required.ts`, `lp-do-ideas-build-origin-bridge.ts` | High |
| H2 | Hard rules and utility tradeoffs already coexist | `self-evolving-portfolio.ts`, `self-evolving-scoring.ts` | High |
| H3 | Unknown-next-step fallback already uses fact-find wording and route | `lp-do-ideas-build-origin-bridge.ts` | High |
| H4 | Milestone activation exists in schemas/process registry but not in dispatch trigger model | `sales-ops-schema.md`, `retention-schema.md`, `process-registry-v2.md`, `lp-do-ideas-trial.ts` | High |
| H5 | Current evaluation records outcomes by candidate/decision, not by prescription | `self-evolving-evaluation.ts`, `self-evolving-contracts.ts` | High |

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest in CI for `scripts` package.
- Commands: local typecheck/lint allowed; local Jest disallowed by repo policy.
- CI integration: CI remains the source of truth for runtime test execution.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Replan recommendation mapping | Unit | `scripts/src/startup-loop/__tests__/replan-trigger.test.ts` | Covers current coarse `recommended_focus` mappings |
| Build-origin bridge routing | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-build-origin-bridge.test.ts` | Covers `suggested_action` and route selection behavior |
| Policy and evaluation | Unit/integration | `scripts/src/startup-loop/__tests__/self-evolving-*.test.ts` | Covers candidate-route, portfolio, exploration, governance, evaluation, audit |

#### Coverage Gaps
- No runtime contract for a first-class prescription object.
- No tests for requirement posture classification.
- No tests for prescription maturity states.
- No tests for milestone-event trigger generation.
- No tests for prescription-level replay or remedy success attribution.

## Current Process Resulting From The Existing System
1. Artifact deltas and operator ideas can enter the ideas system through `dispatch.v2`.
2. Some build-origin findings are converted into queue items with an auto-generated or carried-through next step and route.
3. Persistent bottlenecks can emit coarse follow-up focus through replan triggers.
4. Signal review repeats can create review-required sidecars with a suggested action.
5. The self-evolving runtime learns which candidates to route, defer, prioritize, or gate.
6. Outcomes are recorded back against candidate and decision identity.

What does **not** happen is just as important:
- the runtime does not choose among typed prescriptions
- the runtime does not record prescription choice in the decision journal
- the runtime does not learn which remedy worked best for a gap type
- the runtime does not emit milestone-trigger bundles
- the runtime does not explicitly say whether something is absolutely required, relatively required, or merely improvable

## True Missing Parts
### 1. Canonical Prescription Contract
The repo needs one typed `prescription` contract that subsumes:
- `recommended_focus`
- `suggested_action`
- `next_scope_now`

It should define:
- `prescription_id`
- `prescription_family`
- `source`
- `gap_types_supported`
- `required_route`
- `required_inputs`
- `expected_artifacts`
- `expected_signal_change`
- `risk_class`

Without this, the repo has prescriptions, but not a prescription system.

### 2. Requirement Posture
The repo needs an explicit requirement classifier:
- `absolute_required`
- `relative_required`
- `optional_improvement`

And separately:
- `blocks_stage`
- `blocks_route`
- `degrades_quality`
- `improves_if_time_allows`

The current code already separates hard rules from utility selection, but it does not persist this posture explicitly.

### 3. Prescription Maturity
The repo needs to treat unknown remedy as a normal state:
- `unknown`
- `hypothesized`
- `structured`
- `proven`
- `retired`

This is the missing bridge between "gap recognized" and "well-formed idea exists."

### 4. Prescription Choice as a Policy Decision
The policy journal needs a new decision type:
- `prescription_choice`

That decision should record:
- `gap_case_id`
- `eligible_prescriptions`
- `chosen_prescription`
- `action_probability`
- `expected_utility`
- `expected_time_to_effect`
- `expected_risk`

Without this, the loop can learn routing quality but not remedy quality.

### 5. Prescription-Level Outcome Learning
The evaluation dataset needs to join outcomes back to:
- `gap_case_id`
- `prescription_id`
- `prescription_success`
- `gap_resolved`
- `time_to_resolution`
- `downstream_metric_change`

The current dataset is already the right spine; it is simply missing prescription identity.

### 6. Milestone-Event Trigger Family
The loop needs a native trigger class for state transitions and milestones, not just deltas and operator ideas.

Examples:
- `first_sale`
- `first_qualified_lead`
- `first_stockist_live`
- `first_transaction`
- `first_repeat_signal`
- `wholesale_accounts_crossed_zero`

These should generate lateral prescription bundles rather than a single blunt task.

### 7. Lateral Bundle Expansion for Milestones
A milestone should fan out into candidate follow-ups, each with requirement posture.

Examples:
- `first_sale`
  - evaluate GTM-4 activation
  - evaluate CAP-06 activation posture
  - check whether lifecycle instrumentation or retention artifact work is now relatively required
- `first_stockist_live`
  - evaluate GTM-2 channel ops work
  - evaluate stockist-tracking artifact requirements
  - if wholesale account flow now exists, evaluate GTM-3 / CAP-05 activation

The output should be a small ranked bundle, not an unconditional work explosion.

### 8. Activation Threshold Unification
Milestone-sensitive contracts are not fully aligned.

Current example:
- CAP-06 activates at first repeat/re-booking signal or 4 post-launch weekly cycles in [retention-schema.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/schemas/retention-schema.md#L48)
- GTM-4 says first transaction data available in [process-registry-v2.md](/Users/petercowling/base-shop/docs/business-os/startup-loop/process-registry-v2.md#L351)

These thresholds need one canonical activation source before milestone triggers become live runtime logic.

### 9. Richer Live Sensing For Prescriptions
The self-evolving build-output bridge still seeds live observations only from `build-record`, despite exposing `resultsReviewPath` and `patternReflectionPath`.
- Evidence: [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts#L31), [self-evolving-from-build-output.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts#L412)

Prescription quality will remain limited if the sensing layer stays narrower than the available review data.

### 10. Promotion Path For Proven Prescriptions
The repo already has a manual write-back surface and a low-risk autofix helper, but no live runtime promotion path for proven prescriptions.
- Evidence: [self-evolving-write-back.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-write-back.ts#L10), [self-evolving-autofix.ts](/Users/petercowling/base-shop/scripts/src/startup-loop/self-evolving/self-evolving-autofix.ts#L9)

The missing piece is not full autonomy. It is a guarded path from `proven prescription` to:
- prompt update
- contract update
- standing write-back
- bounded autofix class

## Opportunities To Improve
1. Create one canonical `prescription` schema and migrate existing suggestion seams onto it.
2. Add `requirement_posture` and `blocking_scope` to queue and policy decisions.
3. Add `prescription_maturity` and make `unknown` route explicitly to `lp-do-fact-find`.
4. Extend the policy journal with `prescription_choice`.
5. Extend the replay/evaluation dataset with prescription-level success attribution.
6. Add a new `milestone_event` trigger family to `dispatch.v2` and upstream intake paths.
7. Build milestone bundle generators for first sale, first qualified lead, first stockist, and first repeat signal.
8. Reconcile CAP/GTM activation thresholds into canonical milestone rules.
9. Widen the live self-evolving build-output sensing path to consume richer build-review evidence.
10. Add a guarded promotion path so proven prescriptions can update the system that uses them.

## Questions
### Resolved
- Q: Does the repo already contain prescriptions?
  - A: Yes, in multiple seams, but they are fragmented and not learned as a unified system.
  - Evidence: `replan-trigger.ts`, `signal-review-review-required.ts`, `lp-do-ideas-build-origin-bridge.ts`
- Q: Does the current runtime already distinguish hard constraints from tradeoff-driven prioritization?
  - A: Yes. Hard rules are enforced before portfolio selection, while utility governs relative ranking among admissible work.
  - Evidence: `self-evolving-portfolio.ts`, `self-evolving-scoring.ts`
- Q: Is there already a low-risk route for unknown next steps?
  - A: Yes. Fact-find is already the fallback route where the next action is not sufficiently formed.
  - Evidence: `self-evolving-scoring.ts`, `lp-do-ideas-build-origin-bridge.ts`
- Q: Do milestone-triggered process activations already exist in repo contracts?
  - A: Yes, but only in contracts/process docs, not as a native runtime trigger class.
  - Evidence: `sales-ops-schema.md`, `retention-schema.md`, `process-registry-v2.md`

### Open (Operator Input Required)
None. The remaining decisions are architectural and contract decisions that can be planned from repo evidence.

## Confidence Inputs
- Implementation: 86%
  - Basis: the missing parts fit naturally into existing policy, queue, and evaluation seams.
  - What raises it to >=90: a concrete field-level extension sketch for `prescription_choice` and milestone events.
- Approach: 90%
  - Basis: this extends the current architecture instead of replacing it.
  - What raises it to >=90: none beyond detailed planning.
- Impact: 92%
  - Basis: these are the real missing pieces between isolated suggestions and a learnable prescription system.
  - What raises it to >=90: milestone-trigger examples traced through one live business profile.
- Delivery-Readiness: 84%
  - Basis: work is bounded to repo-local contracts and scripts, but touches multiple seams.
  - What raises it to >=90: a sequenced plan that splits contract work from runtime work.
- Testability: 83%
  - Basis: current scripts tests provide a good base, but milestone triggers and prescription-level replay need new coverage.
  - What raises it to >=90: add a draft test matrix in planning.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Prescription system becomes a second parallel queue vocabulary | Medium | High | Reuse `dispatch.v2`, queue linkage, and policy/evaluation spine rather than adding a new store |
| Milestone triggers create too many lateral tasks | High | Medium | Require requirement posture and bundle ranking before admission |
| Hard requirements get softened into probabilistic suggestions | Medium | High | Keep hard gates declarative and outside learned prescription choice |
| Relative improvements are over-prioritized | Medium | Medium | Make `absolute_required` vs `relative_required` explicit and portfolio-constrained |
| Activation-threshold conflicts create contradictory milestone behavior | High | Medium | Unify canonical activation rules before runtime trigger rollout |
| Prescription learning remains impossible if outcome closure is not extended | Medium | High | Add prescription identity to evaluation before trying to learn remedy quality |

## Planning Constraints & Notes
- Must-follow patterns:
  - Extend existing queue and policy contracts; do not build a parallel system.
  - Keep fact-find as the default route for `prescription_maturity = unknown`.
  - Keep milestone bundles advisory until posture and activation-rule logic are validated.
- Rollout/rollback expectations:
  - Start with contract and shadow-mode additions before authoritative runtime changes.
  - Milestone events should enter in shadow/advisory mode first.
- Observability expectations:
  - Report requirement posture, prescription maturity, and milestone trigger source explicitly.
  - Evaluation/reporting must expose prescription-level replay coverage once added.

## Suggested Task Seeds (Non-binding)
- Define `prescription.v1` contract and add queue/policy references.
- Define `requirement-posture.v1` contract and inject into dispatch and policy records.
- Add `milestone_event` to dispatch trigger model and design bundle generator rules.
- Add `prescription_choice` to policy journal and replay dataset.
- Reconcile CAP-06 / GTM-4 activation thresholds.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `lp-do-replan`, `lp-do-ideas`
- Deliverable acceptance package:
  - contract changes
  - runtime wiring
  - targeted script tests
  - updated reporting
- Post-delivery measurement plan:
  - verify prescription-level decisions are journaled
  - verify milestone events produce shadow/advisory bundles
  - verify unknown prescriptions route to fact-find without fabricated plan/build work

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Existing prescription seams | Yes | None | No |
| Policy/evaluation learning seam | Yes | None | No |
| Requirement posture and prioritization boundary | Yes | None | No |
| Unknown-prescription routing | Yes | None | No |
| Milestone-trigger contracts | Partial | Major: activation exists in contracts but not runtime trigger model | Yes |
| Live sensing depth for prescriptions | Partial | Major: build-output bridge surface is richer than live observation seed path | Yes |

## Scope Signal
Signal: right-sized

Rationale: the topic is broad conceptually, but the repo evidence collapses it into a bounded set of missing seams: contract unification, decision journaling, milestone triggers, posture classification, and outcome attribution.

## Evidence Gap Review
### Gaps Addressed
- Distinguished between missing prescriptions and missing prescription learning.
- Verified milestone activation exists in contracts, not runtime triggers.
- Verified unknown-remedy fallback already exists via fact-find routing.
- Verified the live build-output bridge is narrower than its interface suggests.

### Confidence Adjustments
- Raised implementation confidence because the repo already has the right queue, policy, and evaluation spines.
- Kept delivery-readiness below 90 because milestone-trigger rollout still depends on contract unification.

### Remaining Assumptions
- `dispatch.v2` is the correct place to extend trigger types rather than introducing a second event envelope.
- Milestone bundle generation should happen in startup-loop scripts rather than external orchestration.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-learned-prescription-system`
