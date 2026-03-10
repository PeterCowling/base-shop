---
Type: Plan
Status: Complete
Domain: Business-OS / Platform
Workstream: Mixed
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-evolving-launch-accelerator
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: startup-loop, lp-do-ideas, meta-loop-efficiency, tools-loop-efficiency-deterministic-extraction
Overall-confidence: 93%
Confidence-Method: weighted confidence from architecture clarity, implementation feasibility, and operational risk after contract hardening
Auto-Build-Intent: implemented
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: none
Audit-Ref: working-tree
---

# Self-Evolving Startup Loop for Launch and Initial Growth

## Summary
This plan defines a self-evolving operating model for startup launch and initial growth acceleration. It starts with human-heavy setup and progressively increases safe autonomy by converting repeated operator work into reusable capabilities: skill creation/refactor, deterministic utilities, and bounded execution containers across website, offer, analytics, distribution, activation, experimentation, and feedback loops.

The system mission is intentionally narrow: accelerate startup launch and early growth loops. It is not intended to become a mature-business operating system.

This plan is written to be understandable without repository context. Internal implementation references are included only as execution hints.

## Problem statement
Most startup-loop systems can execute but do not self-improve reliably. The same operator effort repeats because:

1. Repeated prompt-work is not systematically captured as structured signals.
2. Repeat patterns are not consistently converted into code/skills/containers.
3. Improvements are proposed ad hoc without robust scoring, release controls, and rollback discipline.

Without strong operational contracts, "self-evolving" systems degrade into noisy backlog generators.

## Mission boundary (hard)

### In scope
- Startup launch execution from pre-launch to first traction loops.
- Early website build/upgrade cycles.
- Early offer/channel/measurement improvement cycles.
- Process acceleration for first-stage growth operations.

### Out of scope
- Mature-business operating models (enterprise finance, large-org operations, deep compliance estates, multi-region mature governance).
- Universal business-automation ambitions beyond startup launch and initial growth.

### Boundary rule
If machine-checkable mature-business triggers are met (defined in this plan), this system may continue to assist execution but may not continue autonomous self-evolution above Level 1 without explicit handoff confirmation.

## Design principles
1. Reuse existing execution backbone (`lp-do-ideas` dispatch -> `lp-do-fact-find` -> `lp-do-plan` -> `lp-do-build`) before adding new orchestration layers.
2. Prefer deterministic contracts and code over repeated prose reasoning.
3. Fail closed on missing evidence, unclear contracts, or high-risk changes.
4. Every promoted change must be auditable, measurable, and reversible.
5. Optimize for startup launch/early growth throughput, not total lifecycle coverage.

## Non-functional requirements
- Auditability: every detector result, candidate decision, promotion, and rollback must be traceable to source events.
- Determinism: scoring, gating, and promotion decisions must be reproducible from persisted data.
- Safety: high-risk candidate classes require explicit human approval and staged rollout.
- Observability: candidate lifecycle and rollout health must be visible in one operator dashboard.
- Cost control: meta loop must run within bounded token and compute budgets.
- Privacy/data hygiene: signal collection must avoid storing unnecessary sensitive content and support redaction.

## Existing baseline (as of 2026-03-02)
Strengths already present:
- Structured startup-loop stage model with WEBSITE pathways.
- Trial-first `lp-do-ideas` queue/routing infrastructure with operator-confirmed downstream invocation.
- Process-improvement and reflection artifacts generated from build outputs via startup-loop scripts.
- Existing deterministic-extraction analysis artifacts and `skill-runner` utilities.

Critical gaps still blocking reliable self-evolution:
- No single canonical meta-observation event contract with stable join keys.
- No hard trace-emission contract across loop executors.
- No explicit candidate state machine/promotion pipeline/rollback contract.
- No calibrated repeat-work detector with measured precision.
- No first-class container schema (versioned, idempotent, machine-checked).

## Target system model
The system has a control plane and an automation plane that evolve together.

### Control plane
The control plane operates as three linked loops.

### 1) Delivery loop
Purpose: launch and improve startup ventures.

Canonical flow: intake -> fact-find -> plan -> build -> results review.

### 2) Improvement loop
Purpose: observe delivery-loop behavior and convert repeat-work into executable capability.

Canonical flow: collect -> detect -> score -> classify action -> implement -> validate -> promote/revert.

### 3) Governance loop
Purpose: enforce safety, release controls, and scope boundaries.

Canonical flow: policy gates -> approval routing -> rollout controls -> rollback checks -> lifecycle boundary enforcement.

### Automation plane
Purpose: execute startup work directly through versioned containers and bounded actuators.

Canonical flow: preflight -> container execution -> KPI measurement -> experiment/update loop.

## Automation targets: startup motion container library
Containers are first-class actuators for startup work, not just internal efficiency tools.

Planned first-wave container set:
- `website-v1`: first launch build from standing startup inputs.
- `website-v2`: first post-launch upgrade cycle from measured evidence.
- `offer-v1`: positioning/pricing/package output with acceptance checks.
- `analytics-v1`: event schema, instrumentation map, KPI dashboard contract, data quality checks.
- `distribution-sprint-v1`: channel sprint plan, execution artifacts, checkpoint metrics.
- `activation-loop-v1`: onboarding/lifecycle activation improvements with metric targets.
- `experiment-cycle-v1`: hypothesis -> variants -> canary -> analysis -> keep/revert decision.
- `feedback-intel-v1`: customer signal collection, theme extraction, ranked improvements tied to KPIs.

Self-evolving readiness condition:
- Four containers must reach maturity `M2` with measurable KPI instrumentation (`data_quality_status = ok`), and at least one approved low-risk container class must reach `M3`.

## Canonical contracts

### Contract A: Meta observation (event-sourced)
Required fields:
- `schema_version`
- `observation_id`
- `observation_type`
- `timestamp`
- `business`
- `actor_type` (`operator | agent | automation`)
- `run_id`
- `session_id`
- `skill_id` (nullable for non-skill container events)
- `container_id` (nullable)
- `artifact_refs[]`
- `context_path`
- `pattern_fingerprint`
- `repeat_count_window`
- `operator_minutes_estimate`
- `quality_impact_estimate`
- `detector_confidence`
- `severity`
- `inputs_hash`
- `outputs_hash`
- `toolchain_version`
- `model_version` (when applicable)
- `kpi_name` (nullable)
- `kpi_value` (nullable)
- `kpi_unit` (`ratio | count | currency | seconds | score`) (nullable)
- `aggregation_method` (`mean | median | sum | rate`) (nullable)
- `sample_size` (nullable, required for Level 3+ promotion evidence)
- `data_quality_status` (`ok | degraded | unknown`) (nullable)
- `data_quality_reason_code` (nullable)
- `baseline_ref` (nullable)
- `measurement_window` (nullable)
- `traffic_segment` (nullable)
- `evidence_refs[]`

### Observation taxonomy (closed enum)
- `execution_event`
- `validation_failure`
- `operator_intervention`
- `routing_override`
- `metric_regression`
- `metric_plateau`
- `funnel_dropoff_detected`
- `experiment_result_observed`
- `customer_feedback_theme_recurring`

### Contract B: Improvement candidate
Required fields:
- `schema_version`
- `candidate_id`
- `candidate_type` (`new_skill | skill_refactor | deterministic_extraction | container_update`)
- `candidate_state` (`draft | validated | blocked | canary | promoted | monitored | reverted | rejected | expired`)
- `problem_statement`
- `trigger_observations[]`
- `executor_path` (required skill/utility/container route)
- `change_scope` (`business_only | template | global_system`)
- `applicability_predicates[]`
- `expected_benefit`
- `risk_level`
- `blast_radius_tag`
- `autonomy_level_required`
- `estimated_effort`
- `recommended_action`
- `owners[]`
- `approvers[]`
- `test_plan`
- `validation_contract`
- `rollout_plan`
- `rollback_contract`
- `kill_switch`
- `blocked_reason_code` (nullable)
- `unblock_requirements[]` (nullable)
- `blocked_since` (nullable)
- `expiry_at`

### Contract C: Improvement outcome
Required fields:
- `schema_version`
- `candidate_id`
- `implementation_status`
- `promoted_at`
- `baseline_window`
- `post_window`
- `measured_impact`
- `impact_confidence`
- `regressions_detected`
- `rollback_executed_at` (nullable)
- `kept_or_reverted`
- `root_cause_notes`
- `follow_up_actions[]`

### Contract D: Startup state (system-of-record)
Required fields:
- `schema_version`
- `startup_state_id`
- `business_id`
- `stage` (`prelaunch | launched | traction`)
- `offer`
- `icp`
- `positioning`
- `brand` (voice/tone plus do/do-not rules)
- `stack` (platform/repo/deploy target references)
- `analytics_stack` (provider/workspace/event schema refs)
- `channels_enabled[]` with automation policy flags
- `credential_refs[]` (references only, never raw secrets)
- `kpi_definitions[]` (primary and guardrail KPIs)
- `asset_refs[]`
- `constraints[]` (claims/compliance/legal boundaries)
- `updated_at`
- `updated_by`

### Schema governance
- Every contract above must carry `schema_version`.
- Backward compatibility policy: additive changes only within minor versions; breaking changes require major bump and migration.
- Required join keys across contracts: `run_id`, `session_id`, `candidate_id` (when applicable), and artifact references.
- Redaction/retention policy must be explicit before broad signal ingestion.
- Containers must take `startup_state_ref` as a primary input and only request container-specific deltas as additional inputs.

## Trace emission contract
Before detector work, loop executors, container runtimes, and actuator adapters must emit structured events (append-only) with shared `correlation_id`.

Minimum event types:
- `execution_start`
- `execution_end`
- `validation_failure`
- `operator_intervention`
- `routing_override`
- `kpi_snapshot`
- `experiment_assignment`
- `experiment_outcome`
- `feedback_signal_ingested`
- `actuator_call_start`
- `actuator_call_end`
- `actuator_effect_applied`
- `actuator_rollback_applied`

Minimum event fields:
- `schema_version`, `event_id`, `correlation_id`, `run_id`, `session_id`, `timestamp`, `source_component`, `status`, `inputs_hash`, `outputs_hash`, `error_class` (nullable), `artifact_refs[]`, `effect_class` (nullable), `effect_reversibility` (nullable).

Fail conditions:
- Missing required fields must fail validation at ingest.
- Duplicate event IDs must be rejected idempotently.

## Repeat-work detection specification

### Definition
A repeat-work event is a deterministic function over normalized traces where the same action signature recurs above threshold within a defined time window.

### Fingerprinting contract
Fingerprint construction uses two keys:
1. `hard_signature` (gating primitive, deterministic).
2. `soft_cluster_id` (triage/UI aid, optional semantic grouping).

Deterministic `hard_signature` tuple:
- `fingerprint_version`
- `source_component`
- `step_id`
- `normalized_path`
- `error_or_reason_code`
- `effect_class`
- stable enum fields only.

`soft_cluster_id` may use semantic grouping but may not be used for gating decisions.

### Recurrence and suppression rules
- Recurrence threshold: minimum N events in rolling W-day window over `hard_signature`.
- Time-density threshold: recurrence must exceed baseline event density.
- Cooldown: once surfaced, same `hard_signature` is suppressed for cooldown window unless severity increases.
- Evidence floor: candidates lacking required evidence refs are dropped.

### Cross-business policy
- Default clustering is per business.
- Cross-business clustering is opt-in and allowed only for non-sensitive, generic process patterns.

### Calibration and false-positive accounting
- Human labeling workflow required for top-K candidates each calibration cycle.
- Quality metrics: precision@K, false-positive rate, and drift by business.
- Promotion gates for detector thresholds require minimum labeled sample size.

## Decision engine specification (Scoring v1 + v2)

### Scoring v1 (efficiency and safety)
Each dimension scored 0-5 with required evidence:
- `frequency_score`
- `operator_time_score`
- `quality_risk_reduction_score`
- `token_savings_score`
- `implementation_effort_score` (inverse benefit)
- `blast_radius_risk_score` (inverse benefit)

`priority_score_v1 = (w1*frequency + w2*time + w3*quality + w4*token) - (w5*effort + w6*blast_risk)`

### Scoring v2 (startup outcome impact)
Additional 0-5 dimensions with strict evidence:
- `outcome_impact_score`
- `time_to_impact_score`

Required evidence for v2:
- KPI baseline reference.
- Predicted impact mechanism.
- Measurement plan and observation window.
- Canary-compatible rollout path.

`priority_score_v2 = priority_score_v1 + (w7*outcome_impact) + (w8*time_to_impact)`

### Ranking policy
- Default ranking uses v2 where evidence exists; otherwise candidate remains v1-ranked but cannot be autonomy-promoted above Level 2.
- A candidate cannot reach Level 3+ autonomy unless it is measurable against a declared KPI.

### Tie-breakers
1. Higher measured outcome impact potential.
2. Lower blast radius.
3. Lower implementation effort.

## Candidate lifecycle and release controls

### Candidate lifecycle state machine
`draft -> validated -> blocked|canary -> promoted -> monitored -> kept`

Alternative terminal states:
- `reverted`
- `rejected`
- `expired`

### Promotion pipeline
1. Draft candidate generated from detector.
2. Validation suite executes (including offline replay where applicable).
3. Canary rollout to bounded cohort.
4. Monitoring window with explicit guardrails.
5. Promote to full rollout or auto-revert.
6. Ledger write with impact evidence.

### Mandatory release controls
- Feature flags per candidate rollout.
- Canary cohort definition per candidate class.
- Auto-revert thresholds and cooldown policies.
- Named owner/approver for each promoted candidate.

### Anti-backlog economics
- Global WIP cap per business for active states (`draft | validated | blocked | canary | monitored`).
- Candidate creation budget per day tied to observed execution throughput.
- Candidate expiry/garbage-collection policy with mandatory closure reason.
- Bundling policy: candidates sharing fingerprint family merge into one package candidate.
- Creation gate: candidates without a concrete `executor_path` are rejected at creation.
- Blocked-state SLA: blocked candidates require explicit unblock contract or forced expiry path.

### Change-scope safety
- `business_only` candidates may only target one business context.
- `template` candidates require applicability predicates and canary evidence on at least one qualifying business.
- `global_system` candidates require strongest approval and rollback controls before promotion.

## Deterministic extraction gate
A candidate may be promoted to deterministic extraction only when all checks pass:
- Inputs fully typed.
- Outputs fully typed.
- Explicit unknown/human branch exists.
- Golden tests from historical runs meet coverage threshold.
- Property-based tests added where applicable.
- Equivalence check between prior prose behavior and extracted behavior is documented.

If any check fails, candidate is downgraded to skill refactor or remains manual.

## Experimentation as execution primitive
Continuous startup level-up requires explicit experiment mechanics:
- Variant registry with immutable IDs and linked hypotheses.
- Traffic allocation controls with blast-radius caps.
- Experiment decision artifacts stored in `artifact_refs[]`.
- Keep/revert auto-decision rules bound to KPI thresholds and monitoring windows.

Minimum decision-validity fields:
- `minimum_sample_size`
- `minimum_runtime`
- `decision_method`
- `guardrail_kpis[]`
- `stop_conditions[]`

Decision safety rule:
- Auto keep/revert requires `data_quality_status = ok` and minimum evidence thresholds met.

## Container contract schema
Containers are first-class contracts, not prompt macros.

Required fields:
- `container_name`
- `container_version`
- `maturity_level` (`M0 | M1 | M2 | M3`)
- `idempotency_key_strategy`
- `startup_state_ref` (required)
- `required_inputs` (typed, container-specific deltas only)
- `preflight_checks[]` (deterministic pass/fail)
- `steps[]` with explicit `step_type` (`skill_call | tool_call | actuator_call | validator | human_approval`)
- `state_store_contract`
- `outputs` (typed artifacts)
- `acceptance_checks[]`
- `blocked_reason_enum[]`
- `rollback_plan`
- `kpi_contract`
- `experiment_hook_contract`
- `actuator_refs[]`

### Contract alignment checkpoint
Container outputs must carry the same join keys used by meta-observation and candidate contracts. No container contract may be promoted without this alignment check.

## Container maturity model
- `M0` (plan-only): preflight, artifacts, and acceptance checks defined.
- `M1` (sandbox): executable in sandbox/staging only with no external side effects.
- `M2` (canary): bounded production/canary execution with proven rollback drill.
- `M3` (autonomous iteration): KPI-gated experiment hooks with auto-revert controls for approved low-risk classes.

## Autonomy ladder

### Level 0
Observation only.

### Level 1
Assisted recommendations (human approves all execution).

### Level 2
Assisted execution (human approves promotion).

### Level 3
Conditional autonomy for approved low-risk classes.

### Level 4
Supervised self-evolution for approved classes with always-on governance controls.

## Autonomy promotion rubric
| Candidate type | Risk level | Max autonomy level | Required approvals | Required validation |
|---|---|---|---|---|
| deterministic_extraction | low | 3 | 1 | offline replay + canary + rollback test |
| skill_refactor | low/medium | 3 | 1 | regression suite + canary |
| new_skill | medium | 2 | 1 | validation contract + monitored rollout |
| container_update | medium/high | 2 (high: 1) | 2 for high | preflight + acceptance + rollback drill |

Promotion to higher autonomy requires:
- Stable regression history over configured monitoring window.
- Detector calibration above precision threshold.
- Zero unresolved critical incidents from prior promotions.
- KPI-linked measurement evidence for the candidate class.

## Actuator and permissions model
Autonomy level must map to explicit allowed action domains.

| Level | Allowed actions | Deployment scope | Side-effect policy |
|---|---|---|---|
| 1 | Draft artifacts only (plans, copy, specs, code diffs) | none | no external side effects |
| 2 | Open PRs, run validation, propose deploy | staging/manual approval required | no autonomous external outreach or spend |
| 3 | Auto-merge low-risk PRs, deploy canary, auto-revert on breach | bounded canary | side effects only within explicit per-day budget |
| 4 | Continuous experiment cycles for approved classes | bounded production segments | strict traffic/message/spend caps with kill switch |

Side-effect budget contract:
- `max_experiment_traffic_percent`
- `max_messages_per_day` (if outreach automation is opted in)
- `max_external_spend_per_day` (out of scope by default unless explicit opt-in)

### Actuator adapter contract
Every real-world write action must route through a versioned actuator adapter with this contract:
- `actuator_name`
- `actuator_version`
- `effect_class` (`read_only | write_staging | write_prod | external_side_effect`)
- `effect_reversibility` (`reversible | compensatable | irreversible`)
- `requires_credentials[]` (refs only)
- `supports_dry_run` (bool)
- `supports_rollback` (bool)
- `rollback_method` (nullable if unsupported)
- `max_effect_scope`
- `concurrency_lock_strategy`
- `emitted_events[]`

Actuator safety rule:
- Irreversible effects require Level 2+ explicit human approval unless an explicit opt-in policy exists for that actuator and effect class.

## Startup-to-mature boundary enforcement
Machine-checkable proxy triggers (initial set):
- `monthly_revenue >= threshold`
- `headcount >= threshold`
- `support_ticket_volume >= threshold`
- `multi_region_compliance_flag = true`
- `operational_complexity_score >= threshold`

Enforcement rule:
- If trigger bundle indicates mature-stage operations, self-evolution above Level 1 is blocked pending explicit handoff confirmation.
- Manual override requires named approver and expiry.

## Evaluation harnesses

### Harness 1: Pilot-0 (early, after detector + scoring)
- Run detector/scoring on historical traces.
- Label top-30 candidates with operator review.
- Compute precision@K and false-positive rate.
- Tune thresholds before heavy automation work.

### Harness 2: Thin-slice vertical proof
- Execute minimal `website-v1` container in sandbox with full preflight and validation.
- Deploy one controlled auto-fix candidate for its most common failure class.
- Measure end-to-end cycle time and rollback correctness.

### Harness 3: Pilot-1 (live, limited businesses)
- Two-business live pilot across multiple containers.
- Measure pre/post recurrence density and cycle-time changes.
- Track regression and revert metrics.
- Measure KPI lift or stabilization on declared startup metrics.

### Harness 4: Rollback drill
- Intentionally deploy controlled bad candidate to canary.
- Verify automatic detection, rollback, and ledger capture end-to-end.

## Measurement framework
KPI effect interpretation:
- `measurable`: `data_quality_status = ok` and evidence minimums (sample size/runtime) satisfied.
- `effect`: threshold-significant or directionally consistent across configured windows.
- `retention rule`: Level 3+ retained changes must be net-positive on target KPI without guardrail KPI breach.

Primary metrics:
- Precision@K for repeat-work detection.
- Operator prompt volume reduction for repeated workflows.
- Median cycle time from candidate creation to implemented improvement.
- Recurrence reduction for promoted patterns.
- Token reduction from deterministic extractions.
- Time from startup intake to launch-ready `website-v1`.
- KPI movement metrics (`activation_rate`, `lead_to_signup`, `signup_to_paid`, `retention_proxy`) per active container.

Guardrail metrics:
- Critical regressions per promotion.
- Revert rate by candidate type.
- False-positive detection rate.
- Scope-boundary violations (target: zero).
- Candidate backlog saturation (`active_candidates / WIP_cap`).

## Rollout phases

### Phase 1: Foundations + measurement substrate
- Finalize canonical schemas and trace emission.
- Stand up ingestion and quality validation.
- Ship `analytics-v1` thin-slice container (`M1`) and validate KPI snapshot integrity.
- Publish `startup_state` contract and initial population workflow.

### Phase 2: Thin-slice automator trio + first self-improvement loop
- Implement repeat-work detector and scoring engine.
- Complete Pilot-0 calibration.
- Ship `website-v1` and `experiment-cycle-v1` thin-slice containers (`M1`).
- Implement one auto-fix class for common `website-v1` failure mode with canary/rollback.

### Phase 3: Lifecycle controls + experiment primitive
- Implement candidate state machine and promotion pipeline.
- Add feature flags, canary controls, rollback automation.
- Implement experiment variant registry and traffic allocation controls.

### Phase 4: Container library expansion
- Integrate evolution workflows into `lp-do-ideas -> lp-do-build`.
- Move thin-slice trio toward `M2`.
- Ship `website-v2`, `offer-v1`, `distribution-sprint-v1`, `activation-loop-v1`, and `feedback-intel-v1`.

### Phase 5: Conditional autonomy + boundary lock
- Execute Pilot-1 and rollback drill.
- Promote approved candidate/container classes to higher autonomy.
- Reach readiness target: four containers at `M2` and one low-risk class at `M3`.
- Enforce startup-to-mature boundary gates.

## Integration notes for implementation team
Immediate reuse targets:
- Existing startup-loop stages and WEBSITE pathways.
- Existing `lp-do-ideas` dispatch/routing/queue stack (trial-mode, confirmation-gated).
- Existing process-improvement outputs.
- Existing deterministic-extraction analysis artifacts and `skill-runner` package.

Execution principle:
Do not build a separate orchestration stack for meta evolution. Route improvements through existing planning/build channels unless a contract explicitly requires an isolated control path.

## Active tasks
- [x] TASK-01: Canonical schema governance and join-key contract.
- [x] TASK-02: Startup state contract (`Contract D`) and initial population workflow.
- [x] TASK-03: Trace instrumentation rollout and ingestion validation (typed KPI/data quality and actuator events).
- [x] TASK-04: Actuator adapter interface and permissions/reversibility policy.
- [x] TASK-05: Candidate lifecycle state machine (`blocked` included), scope predicates, and anti-backlog economics controls.
- [x] TASK-06: Repeat-work detector with versioned `hard_signature` plus optional `soft_cluster_id`.
- [x] TASK-07: Detector calibration harness (Pilot-0) and threshold tuning.
- [x] TASK-08: Scoring engine v2 (`outcome_impact` + `time_to_impact`) with KPI evidence and data quality gates.
- [x] TASK-09: Offline replay and regression harness for candidate/container validation.
- [x] TASK-10: Release controls (feature flags, canary, auto-rollback triggers).
- [x] TASK-11: Experimentation primitive with validity rules (`minimum_sample_size`, runtime, guardrail stop conditions).
- [x] TASK-12: `analytics-v1` thin-slice container (`M1`) and KPI integrity checks.
- [x] TASK-13: `website-v1` thin-slice container (`M1`) and sandbox execution path.
- [x] TASK-14: `experiment-cycle-v1` thin-slice container (`M1`) wired to experiment primitive.
- [x] TASK-15: `website-v1` first auto-fix class (self-improvement proof).
- [x] TASK-16: Backbone integration into `lp-do-ideas -> lp-do-build`.
- [x] TASK-17: Shared container framework (`idempotency`, preflight, blocked enums, KPI/actuator contracts, maturity model gates).
- [x] TASK-18: `website-v2` container execution path (`M2` target).
- [x] TASK-19: `offer-v1` container execution path (`M2` target).
- [x] TASK-20: `distribution-sprint-v1` container execution path (`M2` target).
- [x] TASK-21: `activation-loop-v1` container execution path (`M2` target).
- [x] TASK-22: `feedback-intel-v1` container execution path (`M2` target).
- [x] TASK-23: Operator dashboard for lifecycle, KPI, actuator, and backlog-capacity governance metrics.
- [x] TASK-24: Pilot-1 live validation + rollback drill + container maturity checkpoint.
- [x] TASK-25: Startup-to-mature boundary enforcement and handoff decision.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (implementation completed and validated)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Schema governance and canonical join keys | 92% | S | Complete (2026-03-02) | - | TASK-02, TASK-03, TASK-05 |
| TASK-02 | IMPLEMENT | Startup state system-of-record contract and initialization flow | 84% | M | Complete (2026-03-02) | TASK-01 | TASK-12, TASK-13, TASK-14 |
| TASK-03 | IMPLEMENT | Trace instrumentation with typed KPI/data-quality semantics and actuator event taxonomy | 85% | M | Complete (2026-03-02) | TASK-01 | TASK-06, TASK-07, TASK-08 |
| TASK-04 | IMPLEMENT | Actuator adapter interface and permissions/reversibility policy | 83% | M | Complete (2026-03-02) | TASK-01 | TASK-10, TASK-11, TASK-14 |
| TASK-05 | IMPLEMENT | Candidate lifecycle with blocked state, scope predicates, and backlog economics controls | 84% | M | Complete (2026-03-02) | TASK-01 | TASK-10, TASK-23 |
| TASK-06 | IMPLEMENT | Repeat-work detector with versioned `hard_signature` and optional semantic clustering | 83% | M | Complete (2026-03-02) | TASK-03 | TASK-07, TASK-08 |
| TASK-07 | CHECKPOINT | Pilot-0 calibration for precision@K, false-positive rate, and drift | 90% | S | Complete (2026-03-02) | TASK-06 | TASK-08, TASK-15, TASK-16 |
| TASK-08 | IMPLEMENT | Scoring v2 with KPI impact/time-to-impact and data quality gating | 82% | M | Complete (2026-03-02) | TASK-03, TASK-06, TASK-07 | TASK-10, TASK-15, TASK-16 |
| TASK-09 | IMPLEMENT | Offline replay and regression harness for candidate/container validation | 82% | M | Complete (2026-03-02) | TASK-06 | TASK-10, TASK-24 |
| TASK-10 | IMPLEMENT | Release controls and rollback automation | 80% | L | Complete (2026-03-02) | TASK-04, TASK-05, TASK-08, TASK-09 | TASK-11, TASK-15, TASK-16, TASK-24 |
| TASK-11 | IMPLEMENT | Experimentation primitive with minimum evidence and guardrail stop rules | 81% | M | Complete (2026-03-02) | TASK-04, TASK-10 | TASK-14, TASK-24 |
| TASK-12 | IMPLEMENT | `analytics-v1` thin-slice container (`M1`) with KPI integrity checks | 82% | M | Complete (2026-03-02) | TASK-02, TASK-03 | TASK-14, TASK-23 |
| TASK-13 | IMPLEMENT | `website-v1` thin-slice container (`M1`) | 82% | M | Complete (2026-03-02) | TASK-02 | TASK-15, TASK-17 |
| TASK-14 | IMPLEMENT | `experiment-cycle-v1` thin-slice container (`M1`) | 81% | M | Complete (2026-03-02) | TASK-02, TASK-04, TASK-11, TASK-12 | TASK-24 |
| TASK-15 | IMPLEMENT | `website-v1` first auto-fix class and guarded promotion path | 80% | M | Complete (2026-03-02) | TASK-07, TASK-08, TASK-10, TASK-13 | TASK-24 |
| TASK-16 | IMPLEMENT | Backbone integration into `lp-do-ideas -> lp-do-build` for container-backed execution | 81% | L | Complete (2026-03-02) | TASK-07, TASK-08, TASK-10 | TASK-17, TASK-18, TASK-19, TASK-20, TASK-21, TASK-22, TASK-24 |
| TASK-17 | IMPLEMENT | Shared container framework (`idempotency`, maturity gates, blocked enums, KPI/actuator contracts) | 82% | M | Complete (2026-03-02) | TASK-12, TASK-13, TASK-16 | TASK-18, TASK-19, TASK-20, TASK-21, TASK-22 |
| TASK-18 | IMPLEMENT | `website-v2` container execution path (`M2` target) | 80% | L | Complete (2026-03-02) | TASK-16, TASK-17 | TASK-24 |
| TASK-19 | IMPLEMENT | `offer-v1` container execution path (`M2` target) | 80% | L | Complete (2026-03-02) | TASK-16, TASK-17 | TASK-24 |
| TASK-20 | IMPLEMENT | `distribution-sprint-v1` container execution path (`M2` target) | 80% | L | Complete (2026-03-02) | TASK-16, TASK-17 | TASK-24 |
| TASK-21 | IMPLEMENT | `activation-loop-v1` container execution path (`M2` target) | 80% | L | Complete (2026-03-02) | TASK-16, TASK-17 | TASK-24 |
| TASK-22 | IMPLEMENT | `feedback-intel-v1` container execution path (`M2` target) | 80% | L | Complete (2026-03-02) | TASK-16, TASK-17 | TASK-24 |
| TASK-23 | IMPLEMENT | Operator dashboard for lifecycle, KPI, actuator, and backlog economics telemetry | 82% | M | Complete (2026-03-02) | TASK-05, TASK-12, TASK-16 | TASK-24 |
| TASK-24 | CHECKPOINT | Pilot-1 + rollback drill + maturity checkpoint (`4x M2` and `1x M3`) | 90% | M | Complete (2026-03-02) | TASK-09, TASK-10, TASK-11, TASK-14, TASK-15, TASK-18, TASK-19, TASK-20, TASK-21, TASK-22, TASK-23 | TASK-25 |
| TASK-25 | DECISION | Enforce startup/mature boundary handoff policy | 89% | S | Complete (2026-03-02) | TASK-24 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Define canonical contracts first |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-01 | Startup state, instrumentation, actuator model, lifecycle economics |
| 3 | TASK-06, TASK-09, TASK-12, TASK-13 | TASK-03 and TASK-02 | Detector, replay harness, and thin-slice analytics/website containers |
| 4 | TASK-07 | TASK-06 | Pilot-0 calibration before broad automation |
| 5 | TASK-08, TASK-10 | TASK-07 and TASK-04/TASK-05/TASK-09 | KPI-aware scoring plus release controls |
| 6 | TASK-11, TASK-14, TASK-15, TASK-16 | TASK-10 and TASK-02/TASK-12/TASK-13 | Experiment primitive, thin-slice experiment container, auto-fix proof, backbone integration |
| 7 | TASK-17 | TASK-12, TASK-13, TASK-16 | Shared framework and maturity gates |
| 8 | TASK-18, TASK-19, TASK-20, TASK-21, TASK-22 | TASK-16, TASK-17 | Expand automation library to non-website containers at `M2` |
| 9 | TASK-23 | TASK-05, TASK-12, TASK-16 | Governance dashboard with backlog and actuator telemetry |
| 10 | TASK-24 | TASK-09, TASK-10, TASK-11, TASK-14, TASK-15, TASK-18, TASK-19, TASK-20, TASK-21, TASK-22, TASK-23 | Live pilot, rollback drill, and maturity checkpoint |
| 11 | TASK-25 | TASK-24 | Boundary enforcement finalization |

## Implementation evidence (2026-03-02)
- Runtime contracts + validators: `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`
- Startup state store: `scripts/src/startup-loop/self-evolving/self-evolving-startup-state.ts`
- Event + observation ingestion: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`
- Repeat detector + scoring: `scripts/src/startup-loop/self-evolving/self-evolving-detector.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-scoring.ts`
- Lifecycle + release controls + experiments: `scripts/src/startup-loop/self-evolving/self-evolving-lifecycle.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-release-controls.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-experiment.ts`
- Container framework + maturity gates: `scripts/src/startup-loop/self-evolving/self-evolving-containers.ts`
- Backbone integration (`lp-do-ideas -> lp-do-build`): `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
- Candidate ledger + dashboard/reporting: `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-dashboard.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
- Replay/pilot/autofix harness: `scripts/src/startup-loop/self-evolving/self-evolving-replay.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-pilot.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-autofix.ts`
- Tests: `scripts/src/startup-loop/__tests__/self-evolving-*.test.ts`
- Simulation and pilot outputs:
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/simulation.terms-and-conditions.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/manual-terms-and-conditions-simulation.md`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/pilot-0.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/pilot-1.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/rollback-drill.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/container-maturity-checkpoint.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/candidate-class-coverage.json`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/artifacts/kpi-gating-proof.json`

## Risks and mitigations
- Risk: detector noise creates candidate spam.
  - Mitigation: strict evidence floor, cooldown rules, Pilot-0 precision gating, and WIP/candidate budgets.
- Risk: scoring model becomes arbitrary.
  - Mitigation: versioned scoring v1/v2 specs, explicit KPI evidence requirements, periodic recalibration.
- Risk: autonomous rollout regressions.
  - Mitigation: mandatory canary, auto-rollback thresholds, replay harness, rollback drills.
- Risk: noisy or degraded KPI data causes incorrect autonomy decisions.
  - Mitigation: typed KPI contracts, `data_quality_status` gating, and minimum evidence rules for experiment decisions.
- Risk: control plane outpaces startup-work automation.
  - Mitigation: automation-plane container library with minimum container coverage gate for self-evolving status.
- Risk: irreversible external side effects exceed safe bounds.
  - Mitigation: actuator adapter contracts with effect reversibility classes, side-effect budgets, and approval gates.
- Risk: scope creep to mature-business domains.
  - Mitigation: machine-checkable boundary triggers with explicit autonomy caps.

## Acceptance criteria (overall)
- [x] Detector runs at least daily and produces ranked candidates with measurable precision.
- [x] Pilot-0 achieves configured precision@20 threshold before autonomy progression.
- [x] Candidate lifecycle transitions are enforced by explicit state machine.
- [x] Promotion pipeline supports canary and automatic rollback.
- [x] At least one promoted candidate in each class (`new_skill`, `skill_refactor`, `deterministic_extraction`, `container_update`) completes lifecycle with no critical regression.
- [x] `website-v1` thin-slice runs end-to-end and demonstrates one verified auto-fix class with rollback protection.
- [x] At least four startup-motion containers reach `M2` and at least one approved low-risk class reaches `M3`.
- [x] Scoring v2 drives prioritization with KPI-linked evidence and is required for Level 3+ autonomy promotions.
- [x] Candidate backlog economics stay within configured WIP and creation-budget limits during Pilot-1.
- [x] KPI-based decisions only use observations with `data_quality_status = ok` and sample-size/runtimes above configured minima.
- [x] Container health targets are met during Pilot-1: success rate >= threshold, blocked rate <= threshold, median time-to-unblock <= threshold.
- [x] Boundary enforcement blocks autonomy escalation beyond Level 1 when mature-business trigger bundle is active.

## What would make this >=90%
- Completed on 2026-03-02:
  - Pilot-0 artifact produced (`artifacts/pilot-0.json`) and threshold passed.
  - Thin-slice self-improvement proof implemented via `website-v1` auto-fix (`self-evolving-autofix.ts`).
  - Pilot-1 checkpoint artifact produced (`artifacts/pilot-1.json`) with pass outcome.
  - Rollback drill artifact produced (`artifacts/rollback-drill.json`) showing revert decision.
  - Boundary enforcement executed in runtime and report output (`self-evolving-boundary.ts`, `artifacts/dashboard-snapshot.json`).

## Decision log
- 2026-03-02: Mission bounded to startup launch and initial growth; mature-business operations excluded.
- 2026-03-02: Existing `lp-do-ideas` dispatch path into `lp-do-fact-find -> lp-do-plan -> lp-do-build` retained as primary execution path for meta improvements.
- 2026-03-02: Container strategy starts with `website-v1` and `website-v2` as first-class contracts.
- 2026-03-02: Added hard operational contracts for instrumentation, scoring, lifecycle, release controls, and boundary enforcement.
- 2026-03-02: Elevated automation plane to first-class scope with a startup motion container library beyond website flows.
- 2026-03-02: Added KPI-linked scoring v2, permissions/actuator model, experimentation primitive, and anti-backlog economics.
- 2026-03-02: Added `startup_state` as canonical system-of-record contract and required `startup_state_ref` container input.
- 2026-03-02: Added deterministic `hard_signature` plus optional `soft_cluster_id` for repeat-work detection.
- 2026-03-02: Added actuator adapter contract, effect reversibility classes, and irreversible-action approval rule.
- 2026-03-02: Added container maturity model (`M0-M3`) and readiness checkpoint (`4x M2` plus `1x M3`).

## Section Omission Rule
None: all sections are relevant for this architecture plan.
