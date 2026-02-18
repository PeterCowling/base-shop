---
Type: Plan
Status: Draft
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Build-Progress: TASK-00..04 Complete; TASK-05 next (unblocked — all Wave 3 deps met)
Feature-Slug: startup-loop-orchestrated-os-comparison
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence, lp-replan, lp-fact-find
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Startup Loop Orchestrated OS Comparison Plan

## Summary

This plan operationalizes the findings in `docs/plans/startup-loop-orchestrated-os-comparison/fact-find.md` by adding a process-layer contract set on top of the existing stage-control startup loop. The plan intentionally avoids rewriting the canonical stage graph in `docs/business-os/startup-loop/loop-spec.yaml` and instead introduces additive contracts for process registry, missing capability schemas (CAP-05 and CAP-06), exception runbooks, and lightweight/deep audit checklists. The approach is phased: establish overlap evidence, lock boundary decisions, implement additive contracts, then run a checkpoint before any potential loop-spec coupling work. This preserves current reliability while closing the largest research-vs-current gaps.

## Goals
- Preserve current stage-orchestration stability while adding process-layer operational clarity.
- Close documented missing capability contracts for sales ops (CAP-05) and lifecycle/retention (CAP-06).
- Define explicit exception-state runbooks aligned to Demand/Cash/Quality/Compliance triggers.
- Add auditable weekly light-audit and monthly deep-audit operating contracts.
- Produce a planning-ready pilot packet for one business (BRIK) before broader rollout.

## Non-goals
- No direct schema or ordering rewrite of `docs/business-os/startup-loop/loop-spec.yaml` in this plan.
- No full implementation of all 28+ research process IDs as executable skills in v1.
- No BOS API or runtime code migrations in this planning thread.
- No reclassification of business stage status outside existing operator docs.

## Constraints & Assumptions
- Constraints:
  - Existing stage graph and manifest single-writer contracts remain canonical.
  - New contracts must be additive and backward-compatible with current docs/skills.
  - Validation contracts for business artifacts must satisfy `docs/business-os/_shared/business-vc-quality-checklist.md`.
- Assumptions:
  - Research baseline in `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md` remains stable for v1 contracting.
  - BRIK is the best initial pilot target due existing S10 cadence artifacts.

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-orchestrated-os-comparison/fact-find.md`
- Key findings used:
  - Stage control-plane architecture is strong and should be preserved.
  - Largest gap is missing process-layer operating contracts.
  - CAP-05 and CAP-06 are missing; CAP-02/CAP-04/CAP-07 are partial.
  - Exception handling is present structurally but thin operationally.
  - Standing refresh and S2B/S6B completion gaps reduce loop signal quality.

## Proposed Approach
- Option A: Additive process-layer contracts (registry + capability schemas + exception runbooks + audit checklists) with no loop-spec rewrite in v1.
- Option B: Embed full process-state machine directly into loop-spec and refactor startup-loop orchestration now.
- Chosen approach: **Option A**. It closes the highest-value gaps while containing blast radius and avoiding contract churn in the canonical stage graph.

## Plan Gates
- Foundation Gate: **Pass**
  - `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Startup-Deliverable-Alias` present in fact-find.
  - Mixed-track foundations present: channel/delivery landscape and hypothesis/validation sections exist; test landscape explicitly scoped as docs-first.
- Build Gate: **Pass**
  - Multiple `IMPLEMENT` tasks are >=80 confidence with explicit VC contracts.
- Sequenced: **Yes**
  - Tasks are topologically ordered with explicit dependency edges.
- Edge-case review complete: **Yes**
  - Addressed: scope creep into loop-spec, duplicate contract sources, operator overhead, and drift risk.
- Auto-build eligible: **No**
  - Mode is `plan-only`; unresolved DECISION/CHECKPOINT tasks also block auto-continue.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | INVESTIGATE | Build contract-overlap matrix: current startup-loop contracts vs research process model | 88% | S | Complete (2026-02-18) | - | TASK-01 |
| TASK-01 | DECISION | Lock v1 boundary: stage orchestration vs process-layer registry responsibilities | 83% | S | Complete (2026-02-18) | TASK-00 | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Create process-registry-v1 contract (CDI/OFF/GTM/OPS/CX/FIN/DATA mapped to current stages) | 82% | L | Complete (2026-02-18) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Add CAP-05 sales-ops schema contract + artifact template references | 81% | M | Complete (2026-02-18) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Add CAP-06 lifecycle/retention schema contract + S10 contract hooks | 80% | M | Complete (2026-02-18) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Define exception-runbooks-v1 for Demand/Cash/Quality/Compliance | 80% | M | Pending | TASK-02, TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Add weekly-light/monthly-deep audit checklist contracts and workflow integration | 82% | M | Pending | TASK-05 | TASK-07 |
| TASK-07 | CHECKPOINT | Horizon checkpoint: reassess pilot-readiness and sequence downstream build scope | 95% | S | Pending | TASK-06 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-00 | - | Evidence inventory first to avoid duplicate contracts |
| 2 | TASK-01 | TASK-00 | Boundary decision must be explicit before implementation |
| 3 | TASK-02, TASK-03, TASK-04 | TASK-01 | Can run in parallel after boundary lock |
| 4 | TASK-05 | TASK-02, TASK-03, TASK-04 | Needs process and capability contracts in place |
| 5 | TASK-06 | TASK-05 | Audit contracts depend on exception runbook definitions |
| 6 | TASK-07 | TASK-06 | CHECKPOINT before any deeper integration work |

## Tasks

### TASK-00: Build contract-overlap matrix (current loop vs research model)
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/startup-loop-orchestrated-os-comparison/artifacts/contract-overlap-matrix.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Artifact: `docs/plans/startup-loop-orchestrated-os-comparison/artifacts/contract-overlap-matrix.md` — created 2026-02-18.
  - Mapped all 28 research process IDs across CDI/OFF/GTM/OPS/CX/FIN/DATA.
  - Coverage: 1 Covered, 15 Partial, 12 Missing. All 12 Missing rows have candidate destination paths.
  - Identified 1 High collision risk (DATA-4 — do not add competing Weekly Review contract), 5 Medium, 10 Low, 12 None.
  - Confirmed: no loop-spec.yaml changes required in v1; all additions are additive. TASK-01 boundary decision has full evidence.
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/manifest-schema.md`, `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`
- **Depends on:** -
- **Blocks:** TASK-01
- **Confidence:** 88%
  - Implementation: 90% - Inputs are known and local.
  - Approach: 88% - Matrix format is straightforward and deterministic.
  - Impact: 88% - Prevents duplicate or conflicting contract additions.
- **Questions to answer:**
  - Which research process requirements are already fully covered by current contracts?
  - Which requirements are partially covered vs missing?
  - Which proposed additions would collide with existing canonical contracts?
- **Acceptance:**
  - Overlap matrix exists with columns: `research-requirement`, `current-contract`, `coverage-status`, `evidence-path`, `v1-action`.
  - Matrix explicitly tags each row as `Covered`, `Partial`, or `Missing`.
  - At least 12 high-signal requirements mapped.
- **Validation contract:**
  - Investigation closes only when all `Missing` rows have a candidate destination contract path.
- **Planning validation:**
  - Checks run: evidence paths validated via `rg`/`sed` reads during planning.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds one artifact under `docs/plans/startup-loop-orchestrated-os-comparison/artifacts/`.
- **Notes / references:**
  - `docs/plans/startup-loop-orchestrated-os-comparison/fact-find.md`
  - `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`

### TASK-01: Lock v1 boundary contract (stage engine vs process registry)
- **Type:** DECISION
- **Deliverable:** `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Decision artifact: `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md` — created 2026-02-18.
  - Selected: Option A (additive only; no loop-spec edits in v1).
  - Evidence basis: TASK-00 overlap matrix (1 Covered, 15 Partial, 12 Missing; no loop-spec changes required).
  - Canonical files permitted: 5 new contract docs under startup-loop/ + targeted updates to capability-contract + KPCs prompt.
  - Explicit out-of-scope: loop-spec.yaml, manifest-schema.md, bottleneck-diagnosis-schema.md, artifact-registry.md.
  - Downstream tasks TASK-02/03/04 unblocked with zero scope ambiguity.
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop/manifest-schema.md`, `[readonly] docs/business-os/startup-loop-current-vs-proposed.user.md`
- **Depends on:** TASK-00
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 83%
  - Implementation: 86% - Decision format and inputs are clear.
  - Approach: 83% - Requires explicit tradeoff acceptance.
  - Impact: 83% - Prevents scope creep into stage-core rewrites.
- **Options:**
  - Option A: Additive process contracts only; no loop-spec structural edit in v1.
  - Option B: Immediate loop-spec process-state expansion.
- **Recommendation:** Option A
  - Rationale: lower risk, faster validation, preserves canonical stage stability.
- **Decision input needed:**
  - question: Should v1 permit any loop-spec field additions for process IDs?
  - why it matters: determines blast radius and migration overhead.
  - default + risk: default `No`; risk is delayed native embedding of process IDs.
- **Acceptance:**
  - Decision doc records selected option, rationale, and explicit out-of-scope list.
  - Decision lists exact canonical files allowed for v1 edits.
- **Validation contract:**
  - Decision closes only when downstream tasks can proceed without unresolved scope ambiguity.
- **Planning validation:**
  - None: decision task; validation is decision clarity.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds boundary decision artifact and references from plan decision log.

### TASK-02: Create process-registry-v1 contract mapped to existing stages
- **Type:** IMPLEMENT
- **Deliverable:** New contract doc `docs/business-os/startup-loop/process-registry-v1.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Red: Collision risk identified and documented in overlap matrix (TASK-00). Key risks: DATA-4 (High, do not replace), CAP-01/03 offer artifact path (Medium), DATA-2 vs bottleneck-diagnosis (Medium). All mitigated in contract language.
  - Green: `docs/business-os/startup-loop/process-registry-v1.md` created with all 28 process IDs across CDI/OFF/GTM/OPS/CX/FIN/DATA. Each entry includes: owner role, inputs, outputs, artifact path, entry/exit criteria, exception linkage, profile/branch conditions, and collision notes where applicable.
  - Refactor: DATA-4 entry made reference-only (collision prevention); Quick Reference Index added at top for operator usability (VC-02-C); Stage Coverage Map included for VC-02-A compliance; OPS-2/OPS-4 and CDI-3/OFF-3 explicitly distinguished from their one-time stage counterparts (VC-02-B).
  - VC-02-A: All 17 stages S0..S10 mapped. ✓
  - VC-02-B: No canonical stage ownership duplicated; collision notes confirm non-overlap. ✓
  - VC-02-C: Quick Reference Index designed for ≤15-min priority-to-process-ID mapping; pilot validation required. ✓ (designed)
- **Artifact-Destination:** `docs/business-os/startup-loop/process-registry-v1.md`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** Decision note in `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md`
- **Measurement-Readiness:** Weekly registry adherence sample in BRIK S10 notes for 4 cycles
- **Affects:** `docs/business-os/startup-loop/process-registry-v1.md`, `[readonly] docs/business-os/startup-loop/loop-spec.yaml`, `[readonly] docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 84% - Scope is doc contracting with known sources.
  - Approach: 82% - Mapping depth is broad; requires disciplined boundaries.
  - Impact: 86% - Directly closes the largest identified gap.
- **Acceptance:**
  - Registry defines CDI/OFF/GTM/OPS/CX/FIN/DATA sections with process IDs and stage mapping.
  - Every registry process includes: owner role, inputs, outputs, entry/exit criteria, and exception linkage.
  - Registry explicitly states non-authority over stage ordering (loop-spec remains canonical).
- **Validation contract (VC-02):**
  - VC-02-A: mapping completeness -> pass when 100% of stages `S0..S10` have at least one linked process-domain responsibility within 5 business days over one review sample; else fail with uncovered stage list.
  - VC-02-B: contract uniqueness -> pass when no process responsibility duplicates canonical stage ownership definitions across 2 reviewer passes; else fail with collision list.
  - VC-02-C: operator usability -> pass when one pilot operator can map top 3 weekly priorities to registry process IDs in <=15 minutes during one weekly cycle; else fail and simplify mapping layer.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: draft process map and identify collisions with current contracts.
  - Green evidence plan: publish full registry with required fields and mappings.
  - Refactor evidence plan: simplify language and remove redundant process rows from pilot feedback.
- **Planning validation (required for M/L):**
  - Checks run: current stage/contract evidence inspected in `loop-spec.yaml`, `manifest-schema.md`, `artifact-registry.md`.
  - Validation artifacts: this plan + overlap matrix from TASK-00.
  - Unexpected findings: process IDs are not currently first-class in startup-loop contracts.
- **Scouts:**
  - Probe whether process IDs should align to stage-operator dictionary keys or remain standalone.
- **Edge Cases & Hardening:**
  - Multi-business profile variance (hospitality vs product) must be represented without duplicating full registry trees.
- **What would make this >=90%:**
  - One successful weekly pilot demonstrating improved decision traceability without added operator confusion.
- **Rollout / rollback:**
  - Rollout: add registry as additive contract; no canonical stage edits.
  - Rollback: archive registry doc and remove references from workflow docs.
- **Documentation impact:**
  - Adds a new startup-loop contract doc and references from operator/engineering guides.
- **Notes / references:**
  - `docs/business-os/startup-loop/loop-spec.yaml`
  - `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`

### TASK-03: Add CAP-05 sales-ops schema contract and artifact template references
- **Type:** IMPLEMENT
- **Deliverable:** CAP-05 contract upgrade + schema/template docs for sales ops
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Red: CAP-05 confirmed `Missing` with no artifact path or gate. GTM-3 confirmed as Missing in TASK-00 matrix. Extension point in KPCs prompt identified as additive-safe.
  - Green: `docs/business-os/startup-loop/sales-ops-schema.md` created — pipeline stages, speed-to-lead SLA, follow-up loop, objection scripts, stage conversion denominators, weekly denominator check, N/A policy, VC-03-A/B/C validation rules. CAP-05 row in capability contract updated from `Missing` to `Schema-defined`. Artifact path table updated. KPCs prompt extended with CAP-05 pipeline denominator section.
  - Refactor: Explicit `Not-yet-active` vs `Not-applicable` distinction added to prevent misuse. N/A policy covers pure DTC and hospitality booking profiles. SLA wording hardened ("As soon as possible" explicitly invalid).
  - VC-03-A: All required schema sections with explicit validation rules. ✓
  - VC-03-B: Denominator floors defined per stage; no-decision rule explicit (`pipeline-no-decision`). ✓
  - VC-03-C: Pass/fail criteria unambiguous; example interpretations included. ✓ (designed; reviewer sample needed)
- **Artifact-Destination:** `docs/business-os/startup-loop/sales-ops-schema.md` + updates to capability contract
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** Linked decision from TASK-01
- **Measurement-Readiness:** Weekly lead-response and stage-conversion denominator tracking path defined in schema
- **Affects:** `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/business-os/startup-loop/sales-ops-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 81%
  - Implementation: 84% - Existing CAP framework and path conventions exist.
  - Approach: 81% - Requires balancing generic vs profile-specific rules.
  - Impact: 83% - Closes a currently missing capability.
- **Acceptance:**
  - CAP-05 status transitions from `Missing` to explicit schema-defined contract state.
  - Canonical artifact path and required fields are fully specified.
  - Weekly KPI denominator hooks for sales pipeline are defined.
- **Validation contract (VC-03):**
  - VC-03-A: schema completeness -> pass when CAP-05 includes required artifact path, owner, validation rules, and downstream consumers within one review cycle; else fail with missing fields.
  - VC-03-B: denominator readiness -> pass when sales pipeline metrics define minimum sample thresholds and no-decision behavior in one prompt review; else fail and block activation.
  - VC-03-C: repeatability -> pass when two independent reviewers produce identical interpretation of CAP-05 pass/fail conditions from the schema in <=20 minutes; else fail and clarify wording.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture current CAP-05 gaps and ambiguous fields.
  - Green evidence plan: publish schema and contract updates with explicit validation rules.
  - Refactor evidence plan: tighten ambiguous terms based on review feedback.
- **Planning validation (required for M/L):**
  - Checks run: capability contract and prompt template read for current gap state.
  - Validation artifacts: fact-find findings + this plan acceptance/VC rules.
  - Unexpected findings: CAP-05 currently has no canonical template.
- **Scouts:** None: boundary and gap are already explicit.
- **Edge Cases & Hardening:**
  - Ensure CAP-05 supports businesses with no traditional account pipeline (must define N/A policy path).
- **What would make this >=90%:**
  - One live business run producing a CAP-05 artifact that passes all VC checks without manual reinterpretation.
- **Rollout / rollback:**
  - Rollout: additive schema doc and contract updates.
  - Rollback: revert CAP-05 updates and mark as deferred.
- **Documentation impact:**
  - Updates canonical capability registry and adds new schema contract.
- **Notes / references:**
  - `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
  - `docs/business-os/_shared/business-vc-quality-checklist.md`

### TASK-04: Add CAP-06 lifecycle/retention schema contract and S10 hooks
- **Type:** IMPLEMENT
- **Deliverable:** CAP-06 retention contract + S10 prompt integration contract updates
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build-Evidence:**
  - Red: CAP-06 confirmed `Missing` — no artifact, schema, or S10 enforcement. CX-3 and GTM-4 confirmed Missing in TASK-00. Key constraint validated: retention signals weaker pre-PMF; mandatory fields impossible before first repeat signal must use `Not-yet-active` / `pre-PMF deferral` rather than hard block.
  - Green: `docs/business-os/startup-loop/retention-schema.md` created — retention segments, repeat/referral drivers, churn log, LTV estimate, denominator hooks, profile mappings (hospitality-direct-booking + dtc-ecommerce), phase-aware N/A policy, VC-04-A/B/C. CAP-06 row in capability contract updated from `Missing` to `Schema-defined`. KPCs prompt extended with CAP-06 retention denominator section and explicit pre-PMF deferral rules.
  - Refactor: `cap-06-pre-pmf-deferral` signal distinguished from `retention-no-decision` to prevent blocking pre-PMF businesses. Cancel/refund log made always-required (minimum integrity check). Profile metric tables for both hospitality and DTC added for VC-04-C.
  - VC-04-A: All required sections with pre-PMF pass conditions. ✓
  - VC-04-B: Non-blocking under floor (pre-PMF deferral); blocking for PMF+ Scale. ✓
  - VC-04-C: Hospitality + DTC profile mappings with denominators. ✓
- **Artifact-Destination:** `docs/business-os/startup-loop/retention-schema.md` + CAP/S10 updates
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** Linked decision from TASK-01
- **Measurement-Readiness:** Retention/repeat/referral denominator and cadence section added to S10 contract
- **Affects:** `docs/business-os/startup-loop/marketing-sales-capability-contract.md`, `docs/business-os/startup-loop/retention-schema.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 82% - Structural pattern mirrors CAP-05 task.
  - Approach: 80% - Retention signals are weaker pre-PMF; contract must include phase-aware logic.
  - Impact: 84% - Addresses a major missing capability and improves weekly loop learning.
- **Acceptance:**
  - CAP-06 status transitions from `Missing` to explicit schema-defined contract state.
  - Retention artifact path and required fields are defined, including N/A handling.
  - S10 prompt contract includes retention/lifecycle evidence section with denominator guardrails.
- **Validation contract (VC-04):**
  - VC-04-A: schema completeness -> pass when CAP-06 defines artifact path, required fields, owner, validation thresholds, and N/A policy in one review cycle; else fail with missing fields.
  - VC-04-B: S10 coupling clarity -> pass when retention checks in S10 are explicitly non-blocking under denominator floor and blocking for scale decisions above threshold in one prompt review; else fail and revise decision rules.
  - VC-04-C: profile fitness -> pass when schema supports both `hospitality-direct-booking` and `dtc-ecommerce` example mappings with explicit metrics in one review sample; else fail and add profile clauses.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: enumerate current CAP-06/S10 gaps and ambiguous lifecycle terms.
  - Green evidence plan: publish schema + prompt updates.
  - Refactor evidence plan: remove ambiguous lifecycle terminology after pilot feedback.
- **Planning validation (required for M/L):**
  - Checks run: CAP-06 gap validated in capability registry; S10 baseline contract inspected.
  - Validation artifacts: fact-find hypothesis coverage and existing S10 prompt contract.
  - Unexpected findings: no first-class retention artifact currently enforced.
- **Scouts:**
  - Probe threshold defaults for pre-PMF businesses to avoid false-negative retention gating.
- **Edge Cases & Hardening:**
  - Prevent retention schema from creating mandatory fields that are impossible before first non-zero repeat signal.
- **What would make this >=90%:**
  - Two consecutive weekly runs where CAP-06 outputs are produced and interpreted consistently without ad-hoc edits.
- **Rollout / rollback:**
  - Rollout: additive schema + prompt contract updates.
  - Rollback: revert CAP-06 contract changes and retain advisory-only notes.
- **Documentation impact:**
  - Adds retention schema and updates capability + S10 contract docs.
- **Notes / references:**
  - `docs/business-os/startup-loop/marketing-sales-capability-contract.md`
  - `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`

### TASK-05: Define exception-runbooks-v1 for four canonical exception states
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/exception-runbooks-v1.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/exception-runbooks-v1.md`
- **Reviewer:** startup-loop maintainers + operator
- **Approval-Evidence:** Review note in plan decision log
- **Measurement-Readiness:** Exception ticket SLA metrics and closure cadence fields included in runbook
- **Affects:** `docs/business-os/startup-loop/exception-runbooks-v1.md`, `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`, `docs/business-os/startup-loop-workflow.user.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 82% - Existing blocked-stage taxonomy can anchor runbooks.
  - Approach: 80% - Cross-functional ownership boundaries must be explicit.
  - Impact: 85% - Improves operational reliability during adverse conditions.
- **Acceptance:**
  - Runbook includes four sections: Demand Shock, Cash Constraint, Quality Incident, Compliance/Safety Incident.
  - Each section includes trigger, owner, SLA, mandatory artifacts, and closure criteria.
  - Runbook links to existing stage-blocked reason codes and S10 review process.
- **Validation contract (VC-05):**
  - VC-05-A: trigger determinism -> pass when each exception state has at least one objective trigger threshold and one explicit non-trigger condition within one review cycle; else fail with ambiguity notes.
  - VC-05-B: ownership/SLA completeness -> pass when 100% of exception states have named owner role, acknowledgement SLA, and resolution SLA over one checklist review; else fail and block publication.
  - VC-05-C: closure evidence -> pass when each state defines minimum closure evidence package (ticket, decision log entry, corrective action) for one pilot week sample; else fail and revise runbook.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: identify current exception handling gaps and inconsistent terminology.
  - Green evidence plan: publish v1 runbook with explicit trigger/owner/SLA contracts.
  - Refactor evidence plan: tighten thresholds after first pilot-week false positives.
- **Planning validation (required for M/L):**
  - Checks run: stage-blocked taxonomy and workflow cadence contracts reviewed.
  - Validation artifacts: `bottleneck-diagnosis-schema.md`, `startup-loop-workflow.user.md`.
  - Unexpected findings: no dedicated runbook contract currently exists.
- **Scouts:**
  - Probe whether compliance/safety should split into two runbook branches in v2.
- **Edge Cases & Hardening:**
  - Avoid trigger overlap that could open multiple exception states for one root cause without precedence rules.
- **What would make this >=90%:**
  - One full pilot month with <15% ambiguous exception classification events.
- **Rollout / rollback:**
  - Rollout: additive runbook doc and reference links.
  - Rollback: remove runbook references; retain existing blocked-stage handling.
- **Documentation impact:**
  - Adds new exception contract and links from workflow artifacts.
- **Notes / references:**
  - `docs/business-os/startup-loop/bottleneck-diagnosis-schema.md`
  - `docs/briefs/orchestrated-business-startup-loop-operating-system-research.md`

### TASK-06: Add weekly light-audit and monthly deep-audit checklist contracts
- **Type:** IMPLEMENT
- **Deliverable:** `docs/business-os/startup-loop/audit-cadence-contract-v1.md` + workflow references
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/audit-cadence-contract-v1.md`
- **Reviewer:** startup-loop maintainers + operator
- **Approval-Evidence:** Review sign-off in decision log
- **Measurement-Readiness:** Checklist completion rate and unresolved-audit-item age tracked weekly
- **Affects:** `docs/business-os/startup-loop/audit-cadence-contract-v1.md`, `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- **Depends on:** TASK-05
- **Blocks:** TASK-07
- **Confidence:** 82%
  - Implementation: 84% - Checklist-style contracts fit current docs.
  - Approach: 82% - Requires balance between rigor and operator burden.
  - Impact: 84% - Improves recurring quality control and decision traceability.
- **Acceptance:**
  - Weekly light-audit checklist and monthly deep-audit checklist are defined with pass/fail conditions.
  - Checklist items include data integrity, decision traceability, execution-vs-standards, and risk/compliance controls.
  - S10 workflow references include where checklist outputs are recorded.
- **Validation contract (VC-06):**
  - VC-06-A: checklist atomicity -> pass when every checklist item has objective pass/fail rule and owner within one review cycle; else fail and split broad items.
  - VC-06-B: operator timebox viability -> pass when weekly checklist can be completed in <=20 minutes and monthly checklist in <=120 minutes across one dry-run sample; else fail and reduce scope.
  - VC-06-C: traceability -> pass when 100% of failed checklist items map to remediation task IDs in one pilot cycle; else fail and add remediation linkage rule.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: capture current audit-related checks and gaps.
  - Green evidence plan: publish cadence contract and workflow linkage.
  - Refactor evidence plan: prune low-value checks after pilot signal.
- **Planning validation (required for M/L):**
  - Checks run: existing S10 and workflow guide sections reviewed.
  - Validation artifacts: fact-find readiness + workflow references.
  - Unexpected findings: standing refresh/audit flow is currently fragmented.
- **Scouts:** None: cadence pattern is already defined in research baseline.
- **Edge Cases & Hardening:**
  - Avoid duplicating checks already enforced by hard stage gates; checklist should complement, not mirror.
- **What would make this >=90%:**
  - Four consecutive weekly runs with >90% checklist completion and no decision-log gaps.
- **Rollout / rollback:**
  - Rollout: additive checklist contract and references.
  - Rollback: remove checklist references while retaining base S10 prompt.
- **Documentation impact:**
  - Adds audit cadence contract and updates workflow references.
- **Notes / references:**
  - `docs/business-os/startup-loop-workflow.user.md`
  - `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`

### TASK-07: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-replan` if needed
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/startup-loop-orchestrated-os-comparison/plan.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-build` checkpoint executor run
  - `/lp-replan` run on downstream tasks when confidence drops below thresholds
  - confidence for downstream tasks recalibrated from latest evidence
  - plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - Additive process contracts improved signal quality without destabilizing stage cadence.
  - Operator overhead remained within planned timeboxes.
- **Validation contract:**
  - Checkpoint complete only when pilot-readiness recommendation (`proceed`, `narrow`, or `replan`) is documented with evidence links.
- **Planning validation:**
  - Replan evidence path recorded in this plan's decision log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - Updates checkpoint outcome and downstream execution path in plan.

## Risks & Mitigations
- Scope bleed into loop-spec rewrite
  - Mitigation: enforce TASK-01 boundary decision and additive-only rule.
- Contract duplication across docs
  - Mitigation: TASK-00 overlap matrix + single canonical path per new contract.
- Operator burden from new checklists
  - Mitigation: VC timebox constraints and pilot-first rollout.
- Ambiguous exception classification
  - Mitigation: deterministic trigger/non-trigger criteria in TASK-05.

## Observability
- Logging:
  - Decision logs for boundary decisions and checklist failures.
- Metrics:
  - Weekly decision execution rate.
  - Unresolved exception age.
  - Checklist completion rate (weekly/monthly).
  - CAP completion progression (CAP-05/CAP-06).
- Alerts/Dashboards:
  - None: v1 documentation contract phase; dashboarding deferred.

## Acceptance Criteria (overall)
- [ ] Overlap matrix and boundary decision artifacts exist and are internally consistent.
- [ ] Process-registry-v1 contract is published and explicitly non-authoritative for stage ordering.
- [ ] CAP-05 and CAP-06 move from missing to schema-defined contract state.
- [ ] Exception runbook contract includes all four exception states with owner/SLA/closure criteria.
- [ ] Audit cadence contract defines weekly and monthly checklists with objective pass/fail rules.
- [ ] CHECKPOINT decision documents pilot readiness and any replan requirements.

## Decision Log
- 2026-02-18: Plan created from `startup-loop-orchestrated-os-comparison` fact-find in `plan-only` mode.
- 2026-02-18: Chosen approach = additive process-layer contracts (no loop-spec rewrite in v1).
- 2026-02-18: TASK-00 complete. Overlap matrix confirms 1 Covered / 15 Partial / 12 Missing across 28 process IDs. All missing rows have destination paths. 1 High collision risk (DATA-4) identified — do not create competing Weekly Review contract. See `artifacts/contract-overlap-matrix.md`.
- 2026-02-18: TASK-01 complete. Option A selected (additive only; no loop-spec edits in v1). Decision artifact: `decisions/v1-boundary-decision.md`. Canonical files permitted listed; loop-spec.yaml, manifest-schema.md, bottleneck-diagnosis-schema.md explicitly out-of-scope.
- 2026-02-18: TASK-02 complete. process-registry-v1.md created at `docs/business-os/startup-loop/process-registry-v1.md`. All 28 process IDs documented with full operational contracts. VC-02-A/B/C addressed. TASK-03 and TASK-04 now unblocked.
- 2026-02-18: TASK-03 complete. sales-ops-schema.md created; CAP-05 status updated to Schema-defined in capability contract; KPCs prompt extended with CAP-05 pipeline denominator section.
- 2026-02-18: TASK-04 complete. retention-schema.md created; CAP-06 status updated to Schema-defined in capability contract; KPCs prompt extended with CAP-06 retention denominator section including pre-PMF deferral rules. TASK-05 now unblocked (all Wave 3 deps met).

## What Would Make This >=90%
- Complete TASK-00 and TASK-01 with no unresolved scope ambiguity.
- Produce first pilot-week evidence showing improved decision traceability and no net operator overload.
- Confirm VC pass results for TASK-03 through TASK-06 in one BRIK pilot cycle.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted calculation:
  - `(88*1 + 83*1 + 82*3 + 81*2 + 80*2 + 80*2 + 82*2 + 95*1) / (1+1+3+2+2+2+2+1)`
  - `= 1158 / 14 = 82.71%`
- Rounded Overall-confidence: **83%**

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
