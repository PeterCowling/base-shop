---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-structured-operator-intake
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260309140301-9306
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
artifact: plan
---

# lp-do-ideas Structured Operator Intake Plan

## Summary
This plan implemented the medium fix for `operator_idea` intake in `/lp-do-ideas`. The delivered change keeps the current routing judgment model but replaces free-form Step 3 context gathering with a structured five-question pre-router intake, conditional evidence prompts, and deterministic packet-field assembly rules. The implementation is instruction-first because the conversational intake path is governed by `.claude/skills/lp-do-ideas/SKILL.md`, not by TypeScript runtime entrypoints.

## Completed tasks
- [x] TASK-01: Add structured operator-intake module and wire it into `lp-do-ideas` - Complete (2026-03-09)
- [x] TASK-02: Checkpoint field coverage, examples, and routing continuity - Complete (2026-03-09)

## Goals
- Reduce free-form `operator_idea` intake by replacing inference-heavy Step 3 with fixed structured prompts.
- Improve evidence capture reliability for incidents, deadlines, leakage, risk, and metric impact.
- Preserve the current Step 4 routing judgment and downstream dispatch contract.

## Non-goals
- Deterministically replacing routing judgment.
- Changing `artifact_delta` routing logic or queue persistence.
- Adding live-mode automation or a new TypeScript intake service.

## Constraints & Assumptions
- Constraints:
  - `lp-do-ideas` SKILL.md remains the canonical operator-intake contract.
  - The new intake must still yield the fields expected by the existing dispatch adapter and classifier.
  - The change must be additive and easy to roll back.
- Assumptions:
  - A dedicated helper module is the clearest long-term home for the questionnaire and assembly rules.
  - Examples plus deterministic assembly rules are enough to keep the operator-intake path consistent without runtime code.

## Inherited Outcome Contract
- **Why:** Operator intake currently burns 2-4k tokens per idea because lp-do-ideas relies on free-form inference to decide which follow-up questions to ask and which evidence fields to capture.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** lp-do-ideas uses a structured five-question pre-router intake for operator ideas, captures evidence through fixed prompts, and preserves the existing routing judgment path.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-structured-operator-intake/fact-find.md`
- Key findings used:
  - `operator_idea` conversational intake is defined in `.claude/skills/lp-do-ideas/SKILL.md`.
  - Repo analysis already identifies business selection, area-anchor formation, domain selection, and evidence gathering as templatable.
  - Route decision and admin suppression remain judgment-heavy and should not be replaced in this cycle.
  - Downstream adapter/classifier files already define the fields the questionnaire needs to collect.

## Proposed Approach
- Option A: Edit `SKILL.md` in place and embed the full questionnaire directly in Step 3.
- Option B: Add a dedicated structured-intake module and make `SKILL.md` delegate to it for `operator_idea` intake.
- Chosen approach: Option B. It keeps the main skill thin, makes the questionnaire reusable, and reduces the chance of future drift back toward free-form intake.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add structured operator-intake module and wire it into `lp-do-ideas` | 86% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | CHECKPOINT | Validate field coverage, examples, and routing continuity | 95% | S | Complete (2026-03-09) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Main implementation |
| 2 | TASK-02 | TASK-01 | Checkpoint after instruction changes land |

## Tasks

### TASK-01: Add structured operator-intake module and wire it into `lp-do-ideas`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-ideas` intake contract plus a reusable structured-intake module under `.claude/skills/lp-do-ideas/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Artifact-Destination:** `.claude/skills/lp-do-ideas/SKILL.md` and `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md`
- **Reviewer:** operator
- **Approval-Evidence:** final implementation summary in this build cycle
- **Measurement-Readiness:** compare next operator-idea packets for token footprint and evidence completeness; no automatic telemetry added in this cycle
- **Affects:** `.claude/skills/lp-do-ideas/SKILL.md`, `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md`, `[readonly] docs/analysis/lp-do-ideas-build-llm-deterministic-classification.md`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-classifier.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 86%
  - Implementation: 90% - bounded file set; no runtime code dependencies.
  - Approach: 86% - dedicated module keeps the main skill readable and reusable.
  - Impact: 82% - evidence capture should improve, but token savings are not measured in-build.
- **Acceptance:**
  - A new module defines exactly five core `operator_idea` intake questions, a decomposition rule for multi-gap ideas, and conditional evidence prompts.
  - `lp-do-ideas` Step 3 delegates `operator_idea` intake to that module instead of relying on broad free-form inference for `area_anchor`, domain, and evidence capture.
  - The module includes deterministic assembly rules for `area_anchor`, `evidence_refs`, and evidence-field collection.
  - Step 4 routing intelligence remains explicitly judgment-based.
- **Validation contract (VC-01):**
  - VC-01: `SKILL.md` no longer instructs the agent to infer `area_anchor` and evidence fields from free-form text alone for `operator_idea`; pass when the module reference and fixed-question flow are present.
  - VC-02: The structured questions can express a single-gap doc/research issue, an incident issue, and a metric-impact issue without changing downstream field names.
  - VC-03: The updated skill still preserves Step 4 routing intelligence and admin suppression behavior.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: confirm Step 3 currently relies on free-form inference and listening-for-signals.
  - Green evidence plan: add module, wire main skill to it, and update Step 3/Step 4 language.
  - Refactor evidence plan: tighten wording, add examples, and ensure deterministic assembly rules are concise.
- **Planning validation (required for M/L):**
  - Checks run: reviewed current `lp-do-ideas` intake and downstream adapter/classifier field expectations.
  - Validation artifacts: fact-find brief evidence list.
  - Unexpected findings: intake path is skill-only, not runtime code.
- **Scouts:** None: the implementation surface is already known.
- **Edge Cases & Hardening:** preserve multi-gap decomposition; keep admin-action suppression in Step 4; avoid pure yes/no framing that cannot satisfy `area_anchor`.
- **What would make this >=90%:**
  - A small archived-corpus walkthrough after the change with route/evidence comparison against prior behavior.
- **Rollout / rollback:**
  - Rollout: additive skill/module update used on next `/lp-do-ideas` operator-intake run.
  - Rollback: remove module reference and revert to prior Step 3 wording.
- **Documentation impact:**
  - `.claude/skills/lp-do-ideas/SKILL.md`
  - `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md`
- **Notes / references:**
  - `docs/analysis/lp-do-ideas-build-llm-deterministic-classification.md`
- **Build Evidence (2026-03-09):**
  - Red evidence: Step 3 in `.claude/skills/lp-do-ideas/SKILL.md` previously relied on free-form inference for business, area anchor, domain, and evidence capture. No dedicated operator-intake module existed.
  - Green: added `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md` with exactly five core questions, conditional evidence prompts, deterministic assembly rules, and three worked examples.
  - Green: updated `.claude/skills/lp-do-ideas/SKILL.md` Step 3 to delegate `operator_idea` intake to the module and Step 4 packet guidance to require structured `location_anchors`, `provisional_deliverable_family`, and `why` / `intended_outcome` handling.
  - VC-01: pass. `SKILL.md` now references `modules/operator-idea-structured-intake.md` and explicitly stops relying on broad free-form inference once structured intake begins.
  - VC-02: pass. The module covers missing-document, incident, and metric-impact scenarios through Examples A-C and the conditional evidence prompts.
  - VC-03: pass. Step 4 routing intelligence and admin suppression remain unchanged; only Step 3 context gathering was structured.

### TASK-02: Checkpoint field coverage, examples, and routing continuity
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence confirming the new questionnaire still maps cleanly onto current packet contracts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `docs/plans/lp-do-ideas-structured-operator-intake/plan.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint criteria are straightforward.
  - Approach: 95% - validates the bounded medium-fix claim before declaring the work complete.
  - Impact: 95% - catches the main failure mode: good-looking prompts that do not actually satisfy downstream contracts.
- **Acceptance:**
  - The updated module and skill cover `area_anchor`, domain, evidence prompts, and multi-gap decomposition.
  - Example scenarios in the module are sufficient to express at least three representative operator ideas.
  - No downstream packet field required by the adapter is dropped by the new intake path.
- **Horizon assumptions to validate:**
  - Structured prompts are enough for evidence completeness without replacing route judgment.
  - The module wording is terse enough to reduce free-form drift.
- **Validation contract:** manual walkthrough against the current skill, adapter, and classifier expectations recorded in build evidence
- **Planning validation:** use the updated files and readonly contract references from TASK-01
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/lp-do-ideas-structured-operator-intake/plan.md`
- **Build Evidence (2026-03-09):**
  - Verified the main skill now references `modules/operator-idea-structured-intake.md` and explicitly lists `location_anchors`, `provisional_deliverable_family`, `why`, and `intended_outcome` as structured-intake outputs.
  - Verified the module contains exactly five core questions (`Question 1` through `Question 5`).
  - Verified the module covers adapter-required packet fields and classifier evidence fields: `area_anchor`, `location_anchors`, `evidence_refs`, `current_truth`, `next_scope_now`, `why`, `intended_outcome`, `incident_id`, `deadline_date`, `risk_vector`, `risk_ref`, `baseline_value`, `funnel_step`, `metric_name`, and `provisional_deliverable_family`.

## Risks & Mitigations
- The questionnaire may become verbose enough to erase the token win.
  - Mitigation: keep five core questions fixed and push richer detail into conditional prompts only.
- Examples may bias agents toward a narrow set of idea shapes.
  - Mitigation: include examples for operational, research, and measurement cases.

## Observability
- Logging: none in this cycle
- Metrics: future manual comparison of intake token usage and evidence completeness
- Alerts/Dashboards: none

## Acceptance Criteria (overall)
- [x] `lp-do-ideas` uses a structured five-question pre-router intake for `operator_idea`.
- [x] Evidence prompts are explicit and conditional rather than inferred from narrative alone.
- [x] Step 4 routing intelligence remains intact.

## Decision Log
- 2026-03-09: Chose instruction-first implementation because the conversational intake path is skill-defined, while runtime TypeScript starts after packet emission.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
