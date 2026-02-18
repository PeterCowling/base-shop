---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: startup-loop-orchestrated-os-comparison
Execution-Track: mixed
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-plan, lp-sequence
Related-Plan: docs/plans/startup-loop-orchestrated-os-comparison/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Orchestrated OS Comparison — Fact-Find Brief

## Scope

### Summary

Compare the research model in `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` to the current startup loop contracts and operating docs, then identify initial gap findings and planning-ready next actions.

### Goals
- Identify where current startup loop contracts already match the research model.
- Identify highest-risk capability and orchestration gaps.
- Propose planning seeds that can be executed without destabilizing current stage control.

### Non-goals
- Rewriting `docs/business-os/startup-loop/loop-spec.yaml` in this run.
- Implementing new skills or process modules in this run.
- Reclassifying business statuses for HEAD/PET/BRIK beyond current documented state.

### Constraints & Assumptions
- Constraints:
  - Use canonical loop contracts as source of truth (`loop-spec.yaml`, manifest/schema contracts).
  - Treat this as an initial comparison output, not a full implementation plan.
- Assumptions:
  - Current docs reflect active behavior as of 2026-02-18.
  - Research model is a valid target-state reference for weekly operating reliability.

## Evidence Audit (Current State)

### Entry Points
- `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` - saved research baseline.
- `docs/business-os/startup-loop/loop-spec.yaml` - stage graph and orchestration gates.
- `docs/business-os/startup-loop/manifest-schema.md` - single-writer baseline state model.
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md` - capability completeness contract.
- `docs/business-os/startup-loop-workflow.user.md` - current operator-facing stage status.
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` - weekly decision contract.
- `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md` - profile-aware constraint diagnosis.
- `docs/business-os/startup-loop-current-vs-proposed.user.md` - prior drift diagnosis and architecture direction.

### Key Modules / Files
- `docs/business-os/startup-loop/loop-spec.yaml` - versioned stage machine, fan-out/fan-in, stage gates.
- `docs/business-os/startup-loop/manifest-schema.md` - candidate/current lifecycle + deterministic merge rules.
- `docs/business-os/startup-loop/artifact-registry.md` - canonical producer/consumer artifact paths.
- `docs/business-os/startup-loop/demand-evidence-pack-schema.md` - pre-spend demand evidence pass floor.
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md` - CAP-01..CAP-07 status.
- `docs/plans/startup-loop-signal-strengthening-review/fact-find.md` - current S10 signal-strengthening audit posture.

### Patterns & Conventions Observed
- Strong stage-level orchestration exists with explicit ordering and join barrier - evidence: `docs/business-os/startup-loop/loop-spec.yaml`.
- Single-writer control-plane semantics are explicit and deterministic - evidence: `docs/business-os/startup-loop/manifest-schema.md`.
- Artifact path standardization is formalized for core strategy artifacts - evidence: `docs/business-os/startup-loop/artifact-registry.md`.
- Weekly decision governance includes denominator validity and no-decision guardrails - evidence: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`.
- Current operations still show major incomplete capability execution (S2B/S6B/standing refresh) - evidence: `docs/business-os/startup-loop-workflow.user.md`.

### Data & Contracts
- Types/schemas/events:
  - Loop stage graph and run packet contract: `docs/business-os/startup-loop/loop-spec.yaml`.
  - Baseline manifest lifecycle/state: `docs/business-os/startup-loop/manifest-schema.md`.
  - Bottleneck diagnosis + profile adapter schemas: `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`.
- Persistence:
  - Strategy and baseline artifacts under `docs/business-os/strategy/<BIZ>/` and `docs/business-os/startup-baselines/`.
  - Planning/fact-find artifacts under `docs/plans/<slug>/`.
- API/contracts:
  - BOS sync separation at S5B and stage-doc upsert contracts in loop spec.

### Dependency & Impact Map
- Upstream dependencies:
  - Research baseline and current canonical startup-loop contracts.
- Downstream dependents:
  - `/lp-plan` for implementation sequencing.
  - `/lp-build` for contract and process-layer implementation tasks.
  - Operator weekly cadence documentation.
- Likely blast radius:
  - Medium-to-high if process-layer orchestration is added directly into core stage graph.
  - Low-to-medium if implemented as additive process registry + S10/S1 checkpoints first.

### Delivery & Channel Landscape
- Audience/recipient:
  - Startup-loop maintainers and venture-studio operator.
- Channel constraints:
  - Documentation-first and contract-first rollout required to avoid stage drift.
- Existing templates/assets:
  - Fact-find and plan templates in `docs/plans/_templates/`.
  - Weekly decision prompt contract for S10.
- Approvals/owners:
  - BOS/startup-loop maintainers for contract changes.
  - Operator for weekly process adoption.
- Measurement hooks:
  - S10 denominator checks.
  - Constraint diagnosis ranking and stage-blocked keys.

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Current startup loop is stronger in stage control than in weekly process orchestration depth | Loop spec + workflow status evidence | Low | 1 review cycle |
| H2 | Adding a process-library layer (CDI/OFF/GTM/OPS/CX/FIN/DATA) would improve weekly reliability without replacing stage graph | Additive contract design | Medium | 1-2 weeks |
| H3 | CAP-05/CAP-06 gaps are currently the largest structural capability deficit vs research model | Capability registry evidence | Low | Immediate |
| H4 | Exception handling is partially covered (blocked constraints) but lacks full process runbooks | Bottleneck schema + workflow docs | Medium | 1 week |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Stage machine + join barriers are explicit; workstream process maps are not first-class contracts | `loop-spec.yaml`, `workflow.user.md` | High |
| H2 | Existing architecture already supports additive contracts (artifact registry, DEP schema, signal review) | `artifact-registry.md`, `demand-evidence-pack-schema.md`, signal-review fact-find | Medium |
| H3 | CAP-05/CAP-06 marked Missing; CAP-02/CAP-04/07 still partial | `marketing-sales-capability-contract.md` | High |
| H4 | Stage-blocked taxonomy exists; no full demand/cash/quality/compliance process playbooks | `bottleneck-diagnosis-schema.md`, workflow docs | Medium |

#### Recommended Validation Approach
- Quick probes:
  - Trial one weekly process checklist overlay for BRIK S10 with explicit exception ticketing and owner SLAs.
- Structured tests:
  - Measure decision execution rate and unresolved exception carryover for 4 weeks.
- Deferred validation:
  - Introduce stage-linked process IDs and exception sub-states only after checklist trial confirms signal gain.

### Test Landscape
Not investigated: no code-level test implementation in this run; this brief is documentation/contract comparison only.

## External Research (If Needed)
- Primary research baseline saved at: `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`.

## Initial Findings

1. **Core alignment is strong at control-plane level.**
   - The current startup loop already has versioned stage orchestration, hard gates, and explicit fan-out/fan-in semantics.
2. **Largest gap is process-layer operating specificity.**
   - Research model defines granular weekly workstreams and process IDs; current loop defines stage outcomes, but not full weekly cross-functional process contracts.
3. **Capability completeness is not yet at research-model coverage.**
   - Sales ops and lifecycle/retention remain missing; message testing and channel constraints remain partial.
4. **Exception handling is structurally present but operationally thin.**
   - We have blocked-stage keys and diagnosis ranking; we do not yet have fully codified exception runbooks matching the research model.
5. **Current operational bottleneck is execution completion, not architecture invention.**
   - HEAD/PET/BRIK still show non-trivial unfinished S2B/S6B/standing-refresh work, which limits closed-loop learning quality.

## Questions

### Resolved
- Q: Is the loop missing stage orchestration primitives?
  - A: No; stage orchestration is mature and explicit.
  - Evidence: `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/manifest-schema.md`.

- Q: Are capability gaps the primary current weakness?
  - A: Yes; CAP-05/CAP-06 missing and other CAPs partial.
  - Evidence: `docs/business-os/startup-loop/marketing-sales-capability-contract.md`.

- Q: Is weekly decision quality already guarded?
  - A: Partially yes; denominator-gated no-decision policy exists.
  - Evidence: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`.

### Open (User Input Needed)
None for initial planning readiness.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: contracts needed for next step are doc-level and additive.
  - What raises to >=80: already met.
  - What raises to >=90: complete one live BRIK weekly process-layer pilot and capture outcomes.
- Approach: 82%
  - Evidence basis: additive process-library overlay fits existing stage control model.
  - What raises to >=80: already met.
  - What raises to >=90: explicit acceptance criteria agreed for process-library v1.
- Impact: 86%
  - Evidence basis: directly targets documented CAP and weekly execution gaps.
  - What raises to >=80: already met.
  - What raises to >=90: four-week before/after signal on decision execution + exception closure.
- Delivery-Readiness: 81%
  - Evidence basis: architecture contracts exist; no blocker requiring schema rewrite in first pass.
  - What raises to >=80: already met.
  - What raises to >=90: finalize scope boundary between stage graph and process registry.
- Testability: 74%
  - Evidence basis: measurable via weekly operational KPIs, but requires runtime discipline.
  - What raises to >=80: define standard weekly metrics for process adherence and exception closure.
  - What raises to >=90: automate these checks in S10 artifact validation.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Process-layer additions duplicate existing stage responsibilities | Medium | Medium | Define strict boundary: stage orchestration vs process execution checklist |
| Over-expansion of scope into full workflow rewrite | Medium | High | Phase rollout: capability completion first, process contracts second, exception states third |
| Operator overhead increases without measurable gain | Medium | Medium | Pilot on one business for 4 weeks with explicit success metrics |
| Contract drift returns across docs/skills | Medium | High | Add lint checks for process-contract references once v1 is accepted |

## Planning Constraints & Notes
- Must-follow patterns:
  - Preserve `loop-spec.yaml` as canonical stage contract.
  - Keep single-writer manifest semantics intact.
- Rollout/rollback expectations:
  - Rollout additive documents first; no destructive contract migration in v1.
  - Rollback by removing process overlay artifacts and retaining stage graph unchanged.
- Observability expectations:
  - Track weekly decision execution rate, unresolved exceptions, and capability completion progression.

## Suggested Task Seeds (Non-binding)
- TASK-01: Define v1 Process Registry (CDI/OFF/GTM/OPS/CX/FIN/DATA) mapped to existing stages only.
- TASK-02: Add CAP-05 sales-ops artifact schema and prompt template.
- TASK-03: Add CAP-06 lifecycle/retention artifact schema and S10 enforcement hook.
- TASK-04: Define explicit exception runbooks for Demand Shock/Cash Constraint/Quality Incident/Compliance Incident.
- TASK-05: Add weekly light-audit and monthly deep-audit checklist contracts to S10 workflow artifacts.

## Execution Routing Packet
- Primary execution skill:
  - `lp-plan`
- Supporting skills:
  - `lp-build`, `lp-sequence`, `lp-fact-find`
- Deliverable acceptance package:
  - Process registry doc, capability schema updates, workflow contract updates, acceptance checklist.
- Post-delivery measurement plan:
  - 4-week pilot on one business (recommended BRIK), then compare decision-quality and exception-closure metrics against baseline.

## Evidence Gap Review

### Gaps Addressed
- Confirmed current control-plane maturity and capability gaps using canonical docs.
- Anchored all initial findings to repository evidence.

### Confidence Adjustments
- Delivery-Readiness reduced from high-80s to low-80s due to pending boundary decisions around process-layer integration.

### Remaining Assumptions
- Research model remains stable enough for phased adoption without major schema churn.
- Operator cadence can sustain added weekly process checks.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for creating a scoped implementation plan.
- Recommended next step:
  - `/lp-plan startup-loop-orchestrated-os-comparison`
