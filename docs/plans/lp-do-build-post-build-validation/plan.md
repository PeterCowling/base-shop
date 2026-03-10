---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25 (TASK-01 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-build-post-build-validation
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# lp-do-build: Post-Build Validation Phase — Plan

## Summary

`lp-do-build` currently marks tasks complete when tests/typecheck/lint pass and VC checks pass, but never simulates "does this actually work?" from the user's or data's perspective. This plan adds a mandatory post-build validation phase to every IMPLEMENT task: a type-adaptive walkthrough (visual screenshots for UI, data simulation for code/API, document review for business artifacts) that runs after all existing gates and gates task completion on a passing result. A fix+retry loop (max 3 attempts, operator escalation on cap hit) is required before a task can be marked done. The deliverable is one new module (`modules/build-validate.md`) and targeted updates to `build-code.md`, `build-biz.md`, and `SKILL.md`.

## Active tasks

- [x] TASK-01: Author build-validate.md and update build-code.md, build-biz.md, SKILL.md — Complete (2026-02-25)

## Goals

- Add a mandatory post-build validation phase to IMPLEMENT tasks in `build-code.md` and `build-biz.md`.
- Define three validation modes keyed to deliverable type: Mode 1 (visual/screenshots), Mode 2 (data simulation), Mode 3 (document review).
- Gate task completion on validation passing; if validation fails, require fix+retry (max 3) before marking complete.
- Keep the phase lightweight — it must add signal, not bureaucracy.

## Non-goals

- Replacing existing test/typecheck/lint gates (those remain and run first).
- Automated end-to-end test suite generation.
- Cross-agent critique (explicitly rejected — this is single-agent verification).
- Validating SPIKE, INVESTIGATE, or CHECKPOINT tasks (no shippable deliverable).

## Constraints & Assumptions

- Constraints:
  - MCP browser tools (`mcp__brikette__browser_session_open`, `browser_observe`, `browser_act`) are available for visual walkthroughs; degraded mode (snapshot/HTML review) applies when unavailable.
  - Staging environment may not always be available; validation must degrade gracefully.
  - Skill files are markdown — changes are low-risk, reversible, no CI gate required.
  - Writer lock protocol applies per AGENTS.md.
- Assumptions:
  - The new phase runs after existing validation gates (tests/typecheck/lint/VC checks pass first).
  - Fix+retry is bounded — maximum 3 attempts before surface-to-operator.
  - "Proof of fix" means the validation walkthrough re-passes, not a separate CI run.
  - In-flight plan tasks at the time of skill-file update are not retroactively affected; the new phase applies from the next task cycle after the skill files are updated.

## Inherited Outcome Contract

- **Why:** lp-do-build marks tasks complete when tests pass and VC checks pass, but never simulates "does this actually work?" Post-build validation adds that step, catching integration failures, UX defects, and business artifact gaps that unit tests miss.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new `modules/build-validate.md` module and updates to `build-code.md`, `build-biz.md`, and `SKILL.md` that embed a type-adaptive validation walkthrough gate after every IMPLEMENT task, with a fix+retry loop (max 3 attempts) and proof-of-fix required before task is marked done.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/lp-do-build-post-build-validation/fact-find.md`
- Key findings used:
  - Three-mode design fully specified with step-by-step procedures in fact-find § Validation Mode Design.
  - Integration points precisely identified: `build-code.md` after step 4, `build-biz.md` after Refactor, `SKILL.md` Gate 3.
  - Degraded mode for Mode 1 defined; no runtime blocker for planning.
  - Open questions resolved by agent at plan time: mode selection rule (key on `Deliverable-Type`), fix quality standard (symptom patches flagged but count toward cap).
  - Two minor carried-open issues from fact-find critique (factcheck process gap, partial agent-resolvability of Q1) — neither blocks planning; both noted in risks.

## Proposed Approach

- Option A: Single IMPLEMENT task — author all four file changes in one cycle with Mode 3 document review as validation.
- Option B: Two tasks — first author build-validate.md, then update the three integration files.
- Chosen approach: **Option A** — the four file changes are tightly coupled; build-validate.md cannot be validated for integration correctness until the references in build-code.md, build-biz.md, and SKILL.md are also present. A single task under writer lock avoids partial states where the new module exists but is not yet wired in. Effort is S (four small markdown files, no compiled output). The Mode 3 self-referential validation (document review of the new module using the process it defines) is an explicit, acknowledged, and acceptable design per the fact-find.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: skill-update`, `Execution-Track: business-artifact`, `Primary-Execution-Skill: lp-do-build` — all present.
  - `Startup-Deliverable-Alias: none` — confirmed.
  - Delivery-readiness confidence: 95% (markdown files, no CI gate, writer lock available).
  - Business track: Hypothesis & Validation Landscape present in fact-find; Delivery & Channel Landscape present in fact-find.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Author build-validate.md + update build-code.md, build-biz.md, SKILL.md | 82% | S | Complete (2026-02-25) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no parallelism possible |

## Tasks

---

### TASK-01: Author build-validate.md and update build-code.md, build-biz.md, SKILL.md

- **Type:** IMPLEMENT
- **Deliverable:** Four markdown skill files — new `.claude/skills/lp-do-build/modules/build-validate.md`; updated `.claude/skills/lp-do-build/modules/build-code.md`; updated `.claude/skills/lp-do-build/modules/build-biz.md`; updated `.claude/skills/lp-do-build/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Artifact-Destination:** `.claude/skills/lp-do-build/` (internal skill files, no external publication)
- **Reviewer:** platform-skill-maintainer (operator to confirm named individual before task is marked complete)
- **Approval-Evidence:** Operator acknowledgement recorded in plan build evidence block after delivery.
- **Measurement-Readiness:** Build notes per task are written to this plan file. Defect escape rate and retry count measurable from future build evidence blocks. No additional infrastructure required. Measurement window: 4 weeks post-implementation. Owner: platform-skill-maintainer.
- **Affects:** `.claude/skills/lp-do-build/modules/build-validate.md` (create), `.claude/skills/lp-do-build/modules/build-code.md`, `.claude/skills/lp-do-build/modules/build-biz.md`, `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 90% — Integration points are precisely identified from direct source-file reads. `build-code.md` has 5 steps; new step inserts after step 4. `build-biz.md` has 3 phases + approval; new step inserts after Refactor. `SKILL.md` Gate 3 requires one new line. The new module is additive; no existing logic is deleted. High confidence.
  - Approach: 80% — Three-mode design is sound and maps directly to the three track types. Mode selection rule resolved: key on `Deliverable-Type` field (not `Affects` paths). Degraded mode for Mode 1 defined. Fix quality standard resolved: symptom patches flagged but count toward cap. One residual planning assumption: browser tools available at runtime for Mode 1 (degraded mode handles fallback — not a blocker).
  - Impact: 75% — Intended outcome (catching defects not caught by TC/VC checks) is plausible and grounded in the current behaviour evidence. No empirical data on defect escape rates exists; relies on reasoned inference. H1/H2/H3 hypotheses defined in fact-find with 4-week measurement window. Impact is real but unproven at planning time — appropriate for an operational improvement.
- **Acceptance:**
  - [x] `modules/build-validate.md` exists and is fully authored (three modes, fix+retry loop, mode selection rule, degraded mode for Mode 1).
  - [x] `build-code.md` contains a new post-validation step after existing step 4, referencing `modules/build-validate.md` with mode selection logic (Mode 1 or Mode 2).
  - [x] `build-biz.md` contains a new post-validation step after the Refactor phase, referencing `modules/build-validate.md` with Mode 3.
  - [x] `SKILL.md` Gate 3 (Validation Gate) contains a new post-build validation line referencing `modules/build-validate.md`.
  - [x] Mode selection rule is deterministic: `Deliverable-Type` field (not `Affects` paths) governs mode selection for mixed deliverables.
  - [x] Fix+retry loop is bounded: max 3 attempts, operator escalation on cap hit.
  - [x] Symptom patch policy is explicit: symptom patches flagged but count toward the 3-attempt cap.
  - [x] Mode 1 degraded fallback (snapshot/HTML review) is documented.
  - [x] Mode 3 document review passes on the new build-validate.md artifact itself (self-referential validation — expected and acceptable per fact-find).
  - [x] Operator acknowledgement recorded in Approval-Evidence field.
- **Validation contract (VC-01 through VC-05):**
  - VC-01: `build-validate.md` structural completeness → Pass rule: file contains all three mode procedures (Mode 1 steps 1–7, Mode 2 steps 1–7, Mode 3 steps 1–6) plus fix+retry loop section and mode-selection rule. Deadline: same build cycle. Sample: full file read.
  - VC-02: `build-code.md` integration → Pass rule: file contains a new numbered step after step 4 that (a) references `modules/build-validate.md`, (b) specifies Mode 1 or Mode 2 selection logic based on `Deliverable-Type`, (c) states task completion is gated on walkthrough pass. Deadline: same build cycle. Sample: full file read.
  - VC-03: `build-biz.md` integration → Pass rule: file contains a new step after the Refactor phase that (a) references `modules/build-validate.md`, (b) specifies Mode 3, (c) states task completion is gated on document review pass. Deadline: same build cycle. Sample: full file read.
  - VC-04: `SKILL.md` Gate 3 integration → Pass rule: Gate 3 (Validation Gate) section contains a new post-build validation line that references `modules/build-validate.md` and names the fix+retry loop. New line must explicitly scope itself to IMPLEMENT tasks only (not SPIKE/INVESTIGATE), consistent with the plan's non-goals. Deadline: same build cycle. Sample: Validation Gate section read.
  - VC-05: End-to-end coherence → Pass rule: all four files are internally consistent — mode numbers, attempt caps, and escalation path are identical across all files; no contradictory definitions. Deadline: same build cycle. Sample: cross-file read.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan:
    - Probe VC-01: read `build-validate.md` — file does not exist → confirms Red (expected).
    - Probe VC-02: read `build-code.md` step sequence — no post-validation step present → confirms Red.
    - Probe VC-03: read `build-biz.md` phase sequence — no post-validation step present → confirms Red.
    - Probe VC-04: read `SKILL.md` Gate 3 — no post-build validation line present → confirms Red.
    - Probe VC-05: N/A at Red (no artifact yet).
  - Green evidence plan:
    - Create `modules/build-validate.md` with all three mode procedures, fix+retry loop, mode-selection rule, and degraded Mode 1 fallback.
    - Edit `build-code.md`: insert new step after step 4.
    - Edit `build-biz.md`: insert a new numbered item (item 4) inside the `## Required Sequence` list, immediately after existing item 3 (Refactor) and before the `## Approval and Measurement` section.
    - Edit `SKILL.md`: add one new line to Gate 3.
    - Re-read all four files to confirm VC-01 through VC-04 pass.
  - Refactor evidence plan:
    - Re-read all four files cross-referencing for internal consistency (VC-05).
    - Ensure mode numbers, attempt caps, and escalation path are identical across files.
    - Tighten prose for clarity (no new logic, no scope expansion).
    - Run Mode 3 document review on `build-validate.md` (self-referential validation): read linearly as intended audience (a build agent executing an IMPLEMENT task), check for broken references, missing sections, internal inconsistencies.
- **Planning validation (required for M/L):**
  - None: S-effort task. Direct source-file reads performed during fact-find phase confirm integration points. No additional planning validation required.
- **Scouts:** Assumption: browser tools available at runtime for Mode 1. Test: confirmed in fact-find (tools in list). Fallback: degraded mode defined for Mode 1 when browser/dev server unavailable. Low fragility.
- **Edge Cases & Hardening:**
  - Mixed deliverables (produces both UI and API): mode selection keyed on `Deliverable-Type` field, not `Affects` paths. If `Deliverable-Type` indicates UI → Mode 1. If `Deliverable-Type` indicates API/service → Mode 2. If both: run both modes; this is an acceptable overhead for mixed-deliverable IMPLEMENT tasks.
  - Concrete mode-selection mapping (must be reproduced verbatim in `build-validate.md`): `code-change` Deliverable-Type → default Mode 2 (data simulation) unless the task's Acceptance criteria reference rendered UI elements (e.g. screenshot references, DOM element checks, visible component names), in which case apply Mode 1. `multi-deliverable` Deliverable-Type → apply both Mode 1 and Mode 2. Business-artifact Deliverable-Type values (`email-message`, `product-brief`, `marketing-asset`, `spreadsheet`, `whatsapp-message`, `skill-update`) → always Mode 3. This mapping is authoritative; the build agent authoring `build-validate.md` must implement it as specified and must not substitute an alternative design.
  - Symptom patch resolution: patch counts toward 3-attempt cap and is flagged in build notes regardless of walkthrough result.
  - Browser session unavailable during Mode 1: degrade to snapshot/HTML review; flag any acceptance criteria requiring live execution as "not verifiable in degraded mode."
  - Mode 3 on `build-validate.md` itself is self-referential: this is expected and acknowledged — the module will be read linearly as a build agent would consume it. Potential for blind spots (can't catch its own conceptual gaps by reading itself) — mitigated by the fact-find's thorough mode specification and the operator review gate.
- **What would make this >=90%:**
  - Empirical data on defect escape rates from prior lp-do-build tasks (would confirm Impact dimension).
  - Named decision owner confirmed before build (removes approval-path uncertainty).
  - A non-self-referential validation step (e.g. a second agent reading the module as a consumer) — currently blocked by non-goals (no cross-agent critique).
- **Rollout / rollback:**
  - Rollout: changes take effect from the next task cycle after the skill files are committed. In-flight tasks at commit time are not retroactively affected.
  - Rollback: git revert of the four-file commit. No downstream side-effects (markdown files only, no compiled artifacts, no CI changes). Full rollback in one operation.
- **Documentation impact:**
  - `modules/build-validate.md` — new file created; no existing doc updated for this.
  - `build-code.md`, `build-biz.md`, `SKILL.md` — updated in place. No separate documentation file required; these are the documentation.
- **Notes / references:**
  - Fact-find: `docs/plans/lp-do-build-post-build-validation/fact-find.md`
  - Integration points confirmed from direct reads: `build-code.md` 5-step workflow, `build-biz.md` 3-phase + approval workflow, `SKILL.md` Gate 3 Validation Gate block.
  - Blast radius: all future IMPLEMENT tasks across all businesses on the platform. In-flight tasks exempt.
  - Build notes:
    - Red evidence: `build-validate.md` did not exist; no post-validation step in `build-code.md` steps 1–5, `build-biz.md` phases 1–3, or `SKILL.md` Gate 3. All four VC probes confirmed Red as expected.
    - Green: created `.claude/skills/lp-do-build/modules/build-validate.md` (three modes, fix+retry loop, mode-selection table, degraded Mode 1, build notes template). Inserted step 5 in `build-code.md`; inserted step 4 in `build-biz.md` `## Required Sequence`; added post-build validation line to `SKILL.md` Gate 3.
    - Refactor: re-read all four files; cross-checked mode numbers, attempt caps, and escalation paths — identical across all files. No inconsistencies found. Prose tightened during green (no separate refactor changes required).
    - Post-build validation:
        Mode: 3 (Document Review)
        Attempt: 1
        Result: Pass
        Evidence: Read `build-validate.md` linearly top-to-bottom as build agent would. All three mode procedures present (Mode 1 steps 1–7, Mode 2 steps 1–7, Mode 3 steps 1–6). Fix+retry loop present with bounded cap, symptom-patch policy, and operator escalation path. Mode-selection rule present as deterministic table keyed on `Deliverable-Type`. Mode 1 degraded fallback present with limitation note. Build notes template present. All references resolve (`mcp__brikette__browser_*` tools confirmed in fact-find; `/lp-do-replan` is a valid skill). No placeholder or dead references. Internal consistency: mode numbers and attempt cap of 3 identical across all four files.
        Symptom patches: None
        Degraded mode: No
    - Approval-Evidence: Operator (Peter Cowling) pre-granted approval before task execution. Reviewer confirmed as operator per operator instruction preceding build. Recorded here per TASK-01 Approval-Evidence field.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Browser session overhead (Mode 1) | Low | Low | Mode 1 adds ~30–60s per visual validation. Only applies to IMPLEMENT tasks, not SPIKE/INVESTIGATE. Degraded mode available. |
| Infinite fix loop | Low | Medium | 3-attempt hard cap with operator escalation. Symptom patches counted toward cap. |
| Mode selection ambiguity on mixed deliverables | Low | Low | Resolved at plan time: key on `Deliverable-Type` field. Deterministic rule embedded in build-validate.md. |
| Degraded mode underdetection | Medium | Low | Browser unavailable → snapshot review. Some visual defects missed. Accepted — degraded mode is better than no validation. Flagged in build notes. |
| Self-referential Mode 3 validation | Low | Low | module reads itself; can't catch its own conceptual gaps. Mitigated by thorough fact-find specification and operator review gate. |
| Operator approval unavailable | Low | Medium | Mark task Blocked (`Awaiting approval evidence`). Do not mark complete. Standard approval-handling protocol per SKILL.md. |

## Observability

- Logging: Build notes per task written to plan file. Defect escape rate and retry count measurable from build evidence blocks.
- Metrics: H1 (defect escape rate pre/post), H2 (Mode 1 pass/fail rate), H3 (retry attempt distribution) — tracked passively from build notes. Measurement window: 4 weeks post-implementation.
- Alerts/Dashboards: None: no additional infrastructure required; manual review at Week 4.

## Acceptance Criteria (overall)

- [x] `modules/build-validate.md` exists with all three modes, fix+retry loop, mode-selection rule, and Mode 1 degraded fallback fully specified.
- [x] `build-code.md` post-validation step present and correctly wired.
- [x] `build-biz.md` post-validation step present and correctly wired.
- [x] `SKILL.md` Gate 3 post-build validation line present.
- [x] All four files internally consistent (mode numbers, attempt caps, escalation path identical).
- [x] Mode 3 document review of `build-validate.md` passes (self-referential).
- [x] Operator acknowledgement captured in plan.

## Decision Log

- 2026-02-25: Chosen approach Option A (single IMPLEMENT task) — coupled file changes require atomic commit to avoid partial-state. Rationale: four files tightly coupled; build-validate.md cannot be validated for integration without the integration wired in.
- 2026-02-25: Mode selection rule for mixed deliverables — key on `Deliverable-Type` field (not `Affects` paths). Agent-resolved per DECISION task self-resolve gate; no operator DECISION task needed.
- 2026-02-25: Fix quality standard — symptom patches count toward 3-attempt cap but are flagged in build notes. Agent-resolved; recommendation aligned with fact-find.
- 2026-02-25: Reviewer set to `platform-skill-maintainer` (role). Named individual to be confirmed by operator before task is marked complete.

## Overall-confidence Calculation

- TASK-01: S-effort (weight=1), confidence=82%
- Overall-confidence = (82% × 1) / 1 = **82%**

## Section Omission Rule

- Consumer tracing: `None: S-effort business-artifact task. No new code outputs, no function signatures, no compiled artifacts. Phase 5.5 consumer tracing applies only to code/mixed M/L tasks.`
