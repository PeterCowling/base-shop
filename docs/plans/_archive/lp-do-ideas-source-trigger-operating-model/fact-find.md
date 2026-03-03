---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Mixed
Created: 2026-02-25
Last-updated: 2026-02-25
Last-reviewed: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-plan, lp-do-build
Related-Plan: docs/plans/lp-do-ideas-source-trigger-operating-model/plan.md
Business-OS-Integration: on
Business-Unit: BOS
Card-ID: none
artifact: fact-find
Trigger-Source: direct-operator-decision: redefine lp-do-ideas intake to source-triggered standing artifacts and harden loop controls
direct-inject: true
direct-inject-rationale: Operator requested a full current-state + gap-bridge specification for the revised system.
---

# lp-do-ideas Source-Triggered Operating Model Fact-Find

## Scope
### Summary
Define the operating model for a standing-information system where process-level source artifacts trigger idea intake, dependent updates are deterministic, summary projections are regenerated as read models, and the `lp-do-ideas -> lp-do-build -> reflection` loop remains high-signal without infinite loops or runaway fan-out.

### Goals
- State current system behavior precisely (contracts, runtime behavior, mismatches).
- Define the target operating model as explicit contracts and invariants.
- Specify bridge requirements needed to move current -> target with controlled risk.
- Encode anti-loop and anti-fan-out controls as testable acceptance criteria.
- Produce planning-ready tasks with migration and observability requirements.

### Non-goals
- Implementing the bridge in this fact-find cycle.
- Finalizing exact prioritization weights.
- Activating `lp-do-ideas` live mode.
- Refactoring unrelated startup-loop domains.

### Constraints & Assumptions
- Constraints:
  - Preserve `lp-do-ideas` trial/live safety boundaries and queue idempotency semantics.
  - Preserve traceability from trigger artifact -> dispatch -> fact-find -> plan -> build -> reflection.
  - Prevent projection artifacts (`.html`, summary read models) from triggering intake by default.
  - Keep execution throughput bounded by explicit queue governance.
- Assumptions:
  - Existing dispatch + queue contracts can be extended without breaking current trial operations.
  - Reflection can be standardized as a lightweight required minimum.
  - Registry contract can be versioned and migrated with fail-closed defaults.

## Glossary
- **Source artifact**: process-produced, semantically authoritative standing artifact.
- **Projection artifact**: derived read model for human/agent consumption (`summary`, `index`, `.html`).
- **Root event**: canonical causal change-set identifier derived from a source delta.
- **Candidate**: raw implication detected from a root event before clustering/admission.
- **Cluster**: deduplicated actionable implication group admitted to queue.
- **Lineage depth**: number of cascade hops from original root event.
- **Material delta**: semantic truth change; excludes formatting/metadata-only edits.
- **Standing expansion**: decision to register new standing source(s) after build/reflection.
- **Same-origin chain**: dispatch chain sharing the same `root_event_id`.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/two-layer-model.md`
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/business-os/startup-loop/artifact-registry.md`
- `docs/business-os/startup-loop/aggregate-pack-contracts.md`
- `docs/business-os/startup-loop/loop-output-contracts.md`
- `.claude/skills/lp-do-ideas/SKILL.md`
- `.claude/skills/idea-scan/SKILL.md`
- `.claude/skills/lp-do-build/SKILL.md`
- `scripts/src/startup-loop/lp-do-ideas-trial.ts`
- `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-dispatch.schema.json`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-standing-registry.schema.json`

### Key Modules / Files
- `two-layer-model.md`
  - Layer A monitoring scope is inclusive: aggregate packs plus underlying and additional qualifying standing artifacts.
  - Defines anti-loop rule R8 and standing-expansion rule R9.
- `loop-spec.yaml`
  - IDEAS trigger remains `layer_a_pack_diff` + operator inject.
  - DO comment block currently says `results-review.user.md` is required, conflicting with other contracts.
- `idea-scan/SKILL.md`
  - Current scan behavior is aggregate-pack oriented (`MARKET-11`, `SELL-07`, `PRODUCTS-07`, optional `LOGISTICS-07`).
- `lp-do-ideas-trial.ts`
  - Deterministic delta processing and route selection; exact dedupe key by artifact sha tuple.
  - No semantic cluster model; one root change can produce many related dispatches.
- `lp-do-ideas-trial-queue.ts`
  - Monotonic queue transitions and duplicate suppression.
  - Suppresses exact duplicates; not yet cluster-aware.
- `lp-do-ideas-dispatch.schema.json`
  - Already includes `triggered_by` and `clarification_needed`, useful for cascade controls.
- `lp-do-build/SKILL.md` + `loop-output-contracts.md`
  - Reflection currently treated as advisory.

### Patterns & Conventions Observed
- Strong contract-first approach with append-only telemetry.
- Existing idempotency controls are robust for exact replay.
- Practical intake remains summary/pack-biased despite architecture intent for broader source monitoring.
- Anti-loop principles are documented but only partially runtime-enforced.

### Data & Contracts
- Dispatch/queue/telemetry contracts are mature and test-backed.
- Standing registry exists but lacks artifact class, propagation mode, and dependency metadata needed for safe source-trigger operation.
- Queue health metrics exist but do not yet include explicit fan-out and loop-incidence formulas.

### Dependency & Impact Map
- Upstream:
  - Source standing artifacts across assessment, market, sell, products, logistics, legal, and strategy domains.
  - Reflection outputs and standing-update actions.
- Downstream:
  - `lp-do-ideas` admission and routing.
  - `lp-do-fact-find`, `lp-do-plan`, `lp-do-build` workload and throughput.
  - Summary/projection regeneration.
- Blast radius:
  - Contracts: loop spec, registry, dispatch schema, reflection contract alignment.
  - Runtime: intake classifier, admission clustering, anti-loop guards, prioritization.
  - Governance: S10 metrics and stop/go operations.

## Findings
### Current Situation
| ID | Finding | Evidence | Impact |
|---|---|---|---|
| CS-01 | Architecture intent already supports source-trigger monitoring beyond aggregate packs. | `two-layer-model.md` Monitoring Scope | Target direction is compatible with existing model intent. |
| CS-02 | Runtime trigger semantics remain pack-diff-centric and summary-layer biased. | `loop-spec.yaml`, `idea-scan/SKILL.md` | Source-level implications can be delayed or hidden behind summaries. |
| CS-03 | Queue semantics are strong for exact duplicates but not for correlated implication fan-out. | `lp-do-ideas-trial.ts`, `lp-do-ideas-trial-queue.ts` | Root deltas can spawn noisy near-duplicates. |
| CS-04 | Registry lacks artifact class and dependency metadata required for deterministic trigger policy. | `lp-do-ideas-standing-registry.schema.json` | Cannot enforce projection immunity and propagation behavior cleanly. |
| CS-05 | Reflection policy is inconsistent across skill/spec/contracts. | `lp-do-build/SKILL.md`, `loop-output-contracts.md`, `loop-spec.yaml` | Loop closure can drift between advisory and mandatory behavior. |

### Gap to Ideal
| ID | Gap | Why it matters | Required bridge outcome |
|---|---|---|---|
| GAP-01 | No canonical artifact taxonomy | Trigger behavior cannot be safely policy-driven | Add typed artifact classes + defaults |
| GAP-02 | Propagation contract ambiguity | Risk of unsafe source-to-source auto rewrites and loops | Separate projection auto-regen from source tasking |
| GAP-03 | No stable cluster identity model | Fan-out control is non-deterministic | Add root/cluster key contract + cluster-aware dedupe |
| GAP-04 | Anti-loop concepts not encoded as invariants | Runtime behavior can degrade under load | Add invariant set with enforcement and tests |
| GAP-05 | Throughput governance underspecified | Capture quality can overwhelm execution | Add dual-lane queue policy and WIP governance |
| GAP-06 | Reflection enforcement mechanism not selected | Policy mismatch will reappear | Pick and enforce one closure mode |
| GAP-07 | Observability formulas/thresholds not formalized | No clear stop/go controls | Add metric definitions + alert thresholds |
| GAP-08 | Migration/default behavior unspecified | Rollout can fail-open unexpectedly | Add schema versioning + fail-closed migration rules |

## Target Operating Model (Contract View)
### Artifact Classes
Minimum class set:
- `source_process` (trigger-eligible by policy)
- `source_reference` (trigger-eligible or batch-scanned)
- `projection_summary` (non-trigger by default)
- `system_telemetry` (never trigger)
- `execution_output` (non-trigger by default)
- `reflection` (non-trigger by default; may seed standing tasks)

### Propagation Modes
- `projection_auto`: automatic regeneration of projection/read-model artifacts from source truth.
- `source_task`: implied source updates become standing-update tasks, not auto-writes.
- `source_mechanical_auto`: rare allowlisted source updates that are strictly mechanical and non-semantic.

Rule: semantic source-to-source rewrites are prohibited in automatic propagation.

### Queue Lanes
- `DO`: customer/business outcome work.
- `IMPROVE`: system/process hardening work.

Both lanes share intake/admission contracts, with separate WIP budgets and prioritization.

### Lane Scheduling Mechanics
- Queue topology: single physical queue with required `lane` field (`DO` or `IMPROVE`).
- Lane assignment: set at admission time, not at scheduling time.
- Lane movement: no automatic lane promotion/demotion; lane change requires explicit operator override with rationale.
- Scheduler rule: enforce WIP caps per lane from one shared queue.

### Root Event Semantics
- `root_event_id` is required for all candidates and dispatches.
- Source delta default: `{artifact_id}:{after_sha}`.
- Operator inject default: `operator:{YYYYMMDDHHmmss}:{reason_hash8}`.
- Multi-artifact change sets: each changed source artifact produces its own root event by default; no implicit commit-level aggregation in v1.
- Lineage indexing: root dispatches start at `lineage_depth=0`; first cascade hop is depth 1.
- `root_event_count` metric denominator means unique `root_event_id` values observed in a cycle pre-admission.

### Cutover Rule (Pack-Diff to Source-Trigger)
Phase-ordered migration contract:
- Phase 1 (dual observation): pack diffs may emit candidates for diagnostics, but cannot admit clusters unless a corresponding source truth delta exists.
- Phase 2 (source-primary): aggregate pack artifacts are classified `projection_summary` with `trigger_policy: manual_override_only`.
- Phase 3 (steady state): admission is source-trigger only; pack-only diffs never admit by default.

This avoids both double-triggering and silent under-trigger during migration.

## Sequence of Events
### S1: Happy Path (Desired)
1. Source artifact `A` changes -> root event created.
2. Candidates extracted from `A` delta.
3. Candidates clustered into cluster `C1` with stable cluster key.
4. `C1` admitted to queue (DO or IMPROVE lane).
5. `fact-find -> plan -> build` executes.
6. Reflection emits standing updates/tasks.
7. Projection artifacts regenerate from updated source truth.
8. Projection diffs do not trigger new intake.

### S2: Pathological Path (Must Be Prevented)
1. Build completion regenerates summary `.md` + `.html`.
2. Projection diffs are detected.
3. Old behavior would emit new dispatches from these derived changes.
4. New behavior suppresses because:
   - projection class non-trigger,
   - anti-self-trigger invariant,
   - no material source truth fingerprint change.

## Bridge Requirements (Current -> Ideal)

### BR-01: Artifact Taxonomy + Registry v2
**Closes:** GAP-01, GAP-08

Contract changes:
- Add `artifact_class`, `trigger_policy`, `propagation_mode`, `depends_on`, `produces` to registry.
- Add explicit schema version bump (`registry.v2`).

Default behavior:
- Unknown artifact (not in registry): fail-closed, `trigger_policy: never`.
- Registry v1 legacy entry (known, not yet fully classified): compatibility mode with conservative inferred defaults in v2 migration output.
- Aggregate pack legacy entries: inferred default is `projection_summary + manual_override_only` during cutover.
- No entry is allowed to run fail-open under migration.

Acceptance:
- ACC-01: Projection and telemetry classes never produce eligible dispatches.
- ACC-02: Source classes only trigger when `trigger_policy=eligible`.
- ACC-03: Unknown artifacts emit warning + no dispatch.
- ACC-04: Pack diffs alone do not admit clusters without corresponding source truth deltas.

### BR-02: Deterministic Propagation Boundary
**Closes:** GAP-02

Contract changes:
- Separate propagation behavior by `propagation_mode`:
  - `projection_auto` -> regenerate derived artifacts only.
  - `source_task` -> emit dependent source update task.
  - `source_mechanical_auto` -> allowlisted non-semantic updates only.

Non-negotiable rule:
- Automatic semantic source content rewrite is disallowed.

Acceptance:
- ACC-05: Source update with `projection_auto` produces projection updates only.
- ACC-06: Source update requiring dependent source change emits standing-update task, not auto-rewrite.
- ACC-07: Mechanical auto-update cannot modify semantic section fingerprints.

### BR-03: Cluster Identity Model + Cluster-Aware Dedupe
**Closes:** GAP-03

Contract fields:
- `root_event_id`: stable causal ID (default: `{artifact_id}:{after_sha}`).
- `anchor_key`: normalized area/section anchor.
- `cluster_key`: `{business}:{domain}:{anchor_key}:{root_event_id}`.
- `normalized_semantic_diff_hash`: deterministic hash from normalized source diff fragments only.
- `cluster_fingerprint`: `sha256(root_event_id + anchor_key + sorted(evidence_ref_ids) + normalized_semantic_diff_hash)`.

Queue keying:
- Admission dedupe uses `cluster_key + cluster_fingerprint`, not only artifact tuple.
- Non-deterministic free-text summaries must not be used in fingerprint construction.

Acceptance:
- ACC-08: Same root event + same anchor emits one admitted cluster dispatch.
- ACC-09: Changed deterministic evidence inputs that alter fingerprint create a new cluster revision.
- ACC-10: Re-runs with unchanged cluster fingerprint are suppressed.

### BR-04: Anti-Loop Invariants and Materiality
**Closes:** GAP-04, GAP-07

Invariants:
- INV-01 Projection Immunity: `projection_*` and `system_telemetry` are non-trigger classes.
- INV-02 Anti-Self-Trigger: updates from `projection_auto` or reflection emission do not trigger unless source truth fingerprint changed.
- INV-03 Same-Origin Chain: events sharing `root_event_id` attach evidence to existing chain; create a new cluster revision only if deterministic fingerprint changes.
- INV-04 Lineage Depth Cap: reject admission at depth >2 unless explicit override.
- INV-05 Cooldown: block re-admission for same `{cluster_key}` within initial 72-hour cooldown window unless material delta.
- INV-06 Materiality: use canonical source truth fingerprint; metadata-only diffs are non-material.
- INV-07 Fingerprint Determinism: truth and cluster fingerprints must be computed from deterministic normalized inputs only.

Acceptance:
- ACC-11: Projection regeneration alone produces zero admitted dispatches.
- ACC-12: Third-hop chain without override is rejected.
- ACC-13: Cooldown suppression occurs for non-material retriggers.
- ACC-14: Metadata-only edits do not pass materiality gate.
- ACC-15: Frontmatter-only changes (`Last-updated`, `Last-reviewed`, formatting) do not pass materiality.

### BR-05: Dual-Lane Queue Governance
**Closes:** GAP-05

Policy:
- Separate lane budgets for `DO` and `IMPROVE` on one physical queue.
- Prioritization score applied within lane; scheduler pulls per-lane up to WIP caps.
- Aging boosts score over time to prevent starvation.

Acceptance:
- ACC-16: Lane WIP caps are enforced each cycle.
- ACC-17: Queue age p95 does not grow unbounded for either lane under stable intake.

### BR-06: Reflection Contract Alignment + Enforcement Mode
**Closes:** GAP-06

Recommended enforcement mode:
- **Soft gate with debt ticket (selected recommendation).**
  - Build can complete.
  - Missing reflection minimum creates mandatory ops debt with SLA.

Operational semantics:
- Debt artifact path: `docs/plans/<feature-slug>/reflection-debt.user.md`.
- Debt idempotency key: `reflection-debt:{build_id}` (one open debt per build).
- Default lane: `IMPROVE`.
- SLA: 7 days.
- SLA breach behavior: block new admissions for the same owner/business scope until debt is resolved or explicitly overridden.

Minimum reflection payload schema:
- `Observed Outcomes`
- `Standing Updates` or explicit `No standing updates: <reason>`
- `New Idea Candidates`
- `Standing Expansion` decision

Acceptance:
- ACC-18: Missing reflection minimum auto-creates debt artifact/task with deterministic debt key.
- ACC-19: Reflection payload validates against minimum schema.

### BR-07: Observability Formulas + Thresholds
**Closes:** GAP-07

Metrics:
- `fan_out_raw = candidate_count / root_event_count`
- `fan_out_admitted = admitted_cluster_count / root_event_count`
- `loop_incidence = suppressed_by_loop_guards / candidate_count`
- `queue_age_p95_days` per lane
- `throughput = completed_dispatches / cycle`
- `lane_mix = DO_completed : IMPROVE_completed`

Initial alert thresholds:
- `fan_out_admitted > 1.5` for 2 consecutive cycles -> investigate clustering.
- `loop_incidence > 0.25` for 2 consecutive cycles -> review invariants/materiality.
- `queue_age_p95_days > 21` in either lane -> rebalance WIP or reduce admission.

Metric definitions:
- `root_event_count`: unique root events observed pre-admission in cycle window.
- `suppressed_by_loop_guards`: suppressions caused by lineage cap, same-origin attach rule, cooldown, anti-self-trigger, or non-materiality filter.

Acceptance:
- ACC-20: Weekly rollup computes all formulas deterministically.
- ACC-21: Threshold breach emits explicit operational action item.

### BR-08: Migration + Compatibility Harness
**Closes:** GAP-08, GAP-04

Migration requirements:
- Registry v1 -> v2 migration script with report.
- Compatibility mode for legacy entries with conservative inferred defaults (never fail-open).
- End-to-end simulation harness for loop/fan-out regression checks.

Acceptance:
- ACC-22: Migration reports classified/unclassified counts and applied defaults.
- ACC-23: E2E simulation verifies happy path and pathological suppression path.

## Appendix A: Deterministic Fingerprint Rules
Truth fingerprint (`truth_fingerprint`) normalization rules:
- Include semantic body sections only.
- Exclude frontmatter metadata fields (`Last-updated`, `Last-reviewed`, timestamps).
- Exclude whitespace-only and formatting-only diffs.
- Exclude regenerated projection/index sections when marked generated.

Cluster fingerprint inputs must be deterministic:
- `root_event_id`
- `anchor_key`
- Sorted stable `evidence_ref_ids`
- `normalized_semantic_diff_hash` from normalized source diff fragments

Forbidden inputs for fingerprinting:
- LLM-generated prose summaries
- Non-deterministic ordering of evidence refs
- Timestamps and regenerated metadata

## Appendix B: Schema Delta Snippets (Partial)
Registry v2 entry (illustrative):
```json
{
  "artifact_id": "HBAG-MARKET-PROBLEM-FRAMING",
  "artifact_class": "source_process",
  "trigger_policy": "eligible",
  "propagation_mode": "source_task",
  "depends_on": ["HBAG-ASSESSMENT-INTAKE"],
  "produces": ["HBAG-MARKET-SUMMARY-MD", "HBAG-MARKET-SUMMARY-HTML"]
}
```

Dispatch v2 additive fields (illustrative):
```json
{
  "root_event_id": "HBAG-MARKET-PROBLEM-FRAMING:abc123",
  "anchor_key": "icp-summary",
  "cluster_key": "HBAG:MARKET:icp-summary:HBAG-MARKET-PROBLEM-FRAMING:abc123",
  "cluster_fingerprint": "sha256(...)",
  "lineage_depth": 0,
  "truth_fingerprint": "sha256(...)",
  "cooldown_until": "2026-02-28T12:00:00Z"
}
```

## Appendix C: E2E Simulation Scenarios
Scenario E2E-01 (happy path):
- Source delta event -> 1 admitted cluster -> build complete -> reflection written -> projection regen.
- Assertions:
  - admitted clusters = 1
  - post-projection admitted clusters = 0
  - ACC-08, ACC-11, ACC-18, ACC-23 pass.

Scenario E2E-02 (pathological suppression):
- Build triggers projection diffs and metadata-only source edits.
- Assertions:
  - admitted clusters from projection/metadata changes = 0
  - suppressions counted in `suppressed_by_loop_guards`
  - INV-01, INV-02, INV-05, INV-06, INV-07 and ACC-14, ACC-15, ACC-21, ACC-23 pass.

## Questions
### Resolved
- Q: Should intake watch process-level source docs or summary docs?
  - A: Process-level source docs should be primary; summary docs are read models and non-triggering by default.
  - Evidence: `two-layer-model.md` Monitoring Scope.
- Q: Is queueing + prioritization alone enough?
  - A: No. Admission clustering, invariants, and materiality/cooldown guards are required.
  - Evidence: queue dedupe currently exact-replay oriented (`lp-do-ideas-trial-queue.ts`).
- Q: Should propagation auto-write dependent source docs?
  - A: No for semantic content. Use `source_task` unless explicitly mechanical and allowlisted.
  - Evidence: loop-risk analysis and anti-loop requirements.
- Q: What enforcement mode is recommended for reflection alignment?
  - A: Soft gate with debt ticket and minimum schema payload.
  - Evidence: balances closure discipline with build throughput.

### Open (Operator Input Required)
- Q: What initial lane budget split should apply for rollout?
  - Why operator input is required: strategic capacity preference.
  - Decision impacted: queue scheduler policy.
  - Decision owner: Operator.
  - Default assumption + risk: phased default `1:1` for first 2 cycles, then `2:1` (DO:IMPROVE) if fan-out/loop metrics remain below thresholds; risk is slower DO throughput during stabilization.

## Confidence Inputs
| Dimension | Score | Evidence basis | What raises to >=80 | What raises to >=90 |
|---|---:|---|---|---|
| Implementation | 86% | Existing dispatch/queue contracts are robust and already tested. | Finalize registry v2 + migration plan details. | Run E2E simulation harness and 2-cycle pilot with stable metrics. |
| Approach | 92% | Source-trigger + projection immunity aligns with architecture intent and failure-mode analysis. | Lock invariant set in contract docs. | Demonstrate stable operation without projection retriggers in pilot. |
| Impact | 88% | Should reduce duplicate dispatches and control fan-out while keeping implication capture. | Baseline current fan-out/loop metrics pre-change. | Show sustained improvement over 4 weekly cycles. |
| Delivery-Readiness | 83% | Bridge requirements and acceptance criteria are now explicit and testable. | Resolve lane budget decision and migration sequencing details. | Complete staged rollout with threshold-based go/no-go checks. |
| Testability | 91% | Deterministic IDs, invariants, and formulas define concrete tests. | Add contract tests for cluster keys/materiality. | Add full simulation suite covering pathological loops. |

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Misclassification of artifacts causes silent under-trigger | Medium | High | Fail-closed defaults + migration report + override workflow. |
| Materiality fingerprint too coarse/fine | Medium | High | Calibrate with sampled deltas and operator review in pilot. |
| Lane split starves DO or IMPROVE outcomes | Medium | Medium | Phased split and threshold-driven rebalancing. |
| Reflection debt backlog accumulates | Medium | Medium | SLA + weekly debt burn-down in S10 operations. |
| Contract drift across skills/specs | Medium | High | Single change-set touching loop-spec, registry, and skill docs with lint checks. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve append-only telemetry and monotonic queue transitions.
  - Preserve fail-closed mode guards until explicit live-mode activation.
  - Keep canonical `docs/plans/<feature-slug>/fact-find.md` lifecycle.
- Rollout/rollback expectations:
  - Contract + migration first, then runtime controls, then governance thresholds.
  - Any automation step must include explicit rollback seam.
- Observability expectations:
  - Weekly operations must review fan-out, loop incidence, queue age, and lane mix.

## Suggested Task Seeds (Non-binding)
- TASK-01 (IMPLEMENT): Registry v2 schema (artifact class, trigger policy, propagation mode, dependencies, outputs).
- TASK-02 (IMPLEMENT): Registry migration script v1 -> v2 with fail-closed defaults and report.
- TASK-03 (IMPLEMENT): Propagation contract implementation (`projection_auto`, `source_task`, `source_mechanical_auto`).
- TASK-04 (IMPLEMENT): Cluster identity model (`root_event_id`, `cluster_key`, `cluster_fingerprint`) and cluster-aware dedupe.
- TASK-05 (IMPLEMENT): Anti-loop invariants (lineage cap, cooldown, anti-self-trigger, materiality gate).
- TASK-06 (IMPLEMENT): Reflection minimum schema + soft-gate debt enforcement.
- TASK-07 (IMPLEMENT): Dual-lane queue scheduler with configurable WIP budgets and aging.
- TASK-08 (IMPLEMENT): Weekly metrics rollup formulas + threshold alerts.
- TASK-09 (CHECKPOINT): End-to-end simulation harness for happy/pathological paths.
- TASK-10 (CHECKPOINT): Pilot rollout on one business and compare pre/post fan-out + throughput.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `lp-do-replan`, `lp-do-factcheck`
- Deliverable acceptance package:
  - Registry v2 + migration, updated trigger/admission runtime, invariant tests, reflection enforcement, and operations telemetry.
- Post-delivery measurement plan:
  - Four-week delta review on `fan_out_admitted`, `loop_incidence`, queue age p95, lane mix, and dispatch completion throughput.

## Evidence Gap Review
### Gaps Addressed
- Converted ambiguous bridge language into contract boundaries (propagation modes, invariants, identities).
- Added deterministic clustering identity model and acceptance assertions.
- Added metric formulas and threshold-based operational controls.
- Added migration and fail-closed default behavior requirements.

### Confidence Adjustments
- Increased delivery-readiness and testability after converting bridge requirements into acceptance-level contracts.
- Retained execution risk where operator strategy choice is required (lane split and pilot calibration).

### Remaining Assumptions
- Existing runtime surfaces can store cluster and lineage metadata without major refactor.
- Operator accepts phased lane-budget default during stabilization period.
- Reflection soft-gate debt mechanism is operationally acceptable.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - Confirm initial lane budget split (or accept phased default in this brief).
- Recommended next step:
  - `/lp-do-plan lp-do-ideas-source-trigger-operating-model --auto`
