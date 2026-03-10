---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: assessment-skill-modularization-wave
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-sequence, lp-do-critique
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Assessment Skill Family Modularization Wave — Plan

## Summary

Modularize 9 assessment skills that exceed the 200-line SKILL.md threshold. Create a shared assessment base-contract module in `_shared/assessment/`, then extract step/part logic from each monolith SKILL.md into local `modules/` directories using the Phase Split pattern (proven by lp-seo). Three parallel waves after backbone creation. All changes are markdown-only — zero production code blast radius.

## Active tasks
- [x] TASK-01: Create shared assessment base-contract module — Complete (2026-03-04)
- [x] TASK-02: Wave 1 — Modularize assessment-14, assessment-01, assessment-15 — Complete (2026-03-04)
- [x] TASK-03: Wave 2 — Modularize assessment-13, assessment-11, assessment-05 — Complete (2026-03-04)
- [x] TASK-04: Wave 3 — Modularize assessment-04, assessment-10, assessment-08 — Complete (2026-03-04)
- [x] TASK-05: CHECKPOINT — Post-modularization audit verification — Complete (2026-03-04)

## Goals

- Bring all 9 monolith assessment SKILL.md files under 200 lines.
- Extract step/part logic into local `modules/` directories per skill.
- Establish a shared assessment base-contract for structural consistency.
- Preserve identical behavior for all refactored skills.

## Non-goals

- Changing assessment skill behavior or output contracts.
- Modularizing non-assessment skills.
- Dispatch adoption or wave-dispatch conversion.
- Adding deterministic extraction into TS/JSON/YAML (separate dispatch).

## Constraints & Assumptions

- Constraints:
  - Behavior parity: modularized skills produce identical outputs for identical inputs.
  - Anti-gaming: reject changes where SKILL.md shrinks but total markdown grows without genuine simplification.
  - No module may exceed 400 lines (module-monolith advisory threshold).
  - SKILL.md target: <200 lines per orchestrator.
- Assumptions:
  - Pattern C (Phase Split) from lp-seo is directly applicable.
  - The `_shared/assessment/` subdirectory follows existing `_shared/cabinet/` precedent.

## Inherited Outcome Contract

- **Why:** Assessment skills are now the largest concentration of new monolith growth, so optimization here gives the highest immediate benefit.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Create and execute a phased modularization plan that brings priority assessment skill orchestrators under 200 lines while preserving behavior.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/assessment-skill-modularization-wave/fact-find.md`
- Key findings used:
  - 9/14 assessment skills exceed 200L threshold; all 14 lack modules/ directories.
  - Canonical section pattern: Integration (14/14), Invocation (12/14), Operating Mode (11/14), Quality Gate (11/14), Completion Message (12/14).
  - Pattern C (Phase Split) proven by lp-seo (68L orchestrator + 6 modules).
  - `_shared/cabinet/` precedent for subdirectory namespace.
  - lp-do-assessment-12-promote (133L) as compliant target reference.

## Proposed Approach

- Option A: Extract each skill independently (no shared backbone) — simpler per-skill but loses structural consistency.
- Option B: Create shared base-contract first, then modularize each skill to reference it — more upfront work but ensures consistent orchestrator structure across all 14 skills.
- Chosen approach: Option B — shared base-contract first. Reasoning: 14 assessment skills share canonical sections (Integration, Quality Gate, Completion Message, Operating Mode). A shared base-contract avoids drift and reduces per-skill orchestrator size further. This follows the lp-seo pattern where `phase-base-contract.md` (39L) defines shared conventions.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create shared assessment base-contract module | 85% | S | Pending | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Wave 1: Modularize assessment-14, -01, -15 | 85% | M | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Wave 2: Modularize assessment-13, -11, -05 | 85% | M | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Wave 3: Modularize assessment-04, -10, -08 | 85% | S | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Post-modularization audit verification | - | S | Complete (2026-03-04) | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Backbone — must complete before waves 2-4 |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 | Three independent skill waves; can run in parallel |
| 3 | TASK-05 | TASK-02, TASK-03, TASK-04 | Verification checkpoint |

## Tasks

### TASK-01: Create shared assessment base-contract module
- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/_shared/assessment/assessment-base-contract.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `.claude/skills/_shared/assessment/assessment-base-contract.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
- **Build evidence:** File created at 89 lines. TC-01: 8 sections present (exceeds 7 required). TC-02: 89L < 100. TC-03: References business-resolution.md. TC-04: No skill-specific step logic. Committed as d94e6f26f5.
  - Implementation: 85% — clear reference pattern (lp-seo `phase-base-contract.md` at 39L). Held-back test: no single unknown would drop below 80 because the canonical section pattern is documented across all 14 skills with frequency data.
  - Approach: 90% — follows proven lp-seo precedent for base-contract modules.
  - Impact: 85% — enables all downstream waves and enforces structural consistency.
- **Acceptance:**
  - `_shared/assessment/assessment-base-contract.md` exists.
  - Contains standard section ordering: Invocation pattern, Operating Mode convention, Required Inputs format, Step/Part routing convention, Quality Gate structure, Completion Message format, Integration block format.
  - References `_shared/business-resolution.md` for business context resolution.
  - Under 100 lines.
- **Validation contract (TC-XX):**
  - TC-01: File `_shared/assessment/assessment-base-contract.md` exists and contains all 7 standard sections → passes.
  - TC-02: Line count < 100 → passes.
  - TC-03: References `business-resolution.md` → passes.
  - TC-04: File does not contain skill-specific step/part logic (only structural conventions) → passes.
- **Execution plan:**
  - Red: Check that `_shared/assessment/` does not exist yet; verify no existing base-contract module.
  - Green: Analyze canonical section structure across all 14 assessment skills. Extract the shared structural template. Write `assessment-base-contract.md` defining: standard invocation syntax, operating mode declaration format, required inputs table format, step/part routing convention (`Load modules/steps.md` or `Load modules/part-N.md`), quality gate checklist structure, completion message template, and integration block format.
  - Refactor: Verify consistency with lp-seo's `phase-base-contract.md` pattern. Ensure the contract is prescriptive enough to guide modularization but flexible enough to accommodate both step-based and part-based skills.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: well-defined target with clear reference pattern.
- **Edge Cases & Hardening:**
  - Skills 04, 05 lack Invocation section — base contract should mark Invocation as "recommended, not required."
  - Skills 01, 03 lack Completion Message — base contract should mark it as "recommended, not required."
  - Part-based skills use different step naming — base contract must accommodate both `## Step N` and `## Part N` conventions.
- **What would make this >=90%:**
  - One assessment skill successfully modularized using the base contract as reference.
- **Rollout / rollback:**
  - Rollout: Create `_shared/assessment/` directory and write the file.
  - Rollback: `git revert` the commit; delete the directory.
- **Documentation impact:** None: the base-contract is self-documenting.
- **Notes / references:**
  - Reference: `.claude/skills/lp-seo/modules/phase-base-contract.md` (39L)
  - Reference: Canonical section frequency data from fact-find.

### TASK-02: Wave 1 — Modularize assessment-14, assessment-01, assessment-15
- **Type:** IMPLEMENT
- **Deliverable:** Restructured SKILL.md + new `modules/` directories for 3 skills
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md`, `.claude/skills/lp-do-assessment-14-logo-brief/modules/`, `.claude/skills/lp-do-assessment-01-problem-statement/SKILL.md`, `.claude/skills/lp-do-assessment-01-problem-statement/modules/`, `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md`, `.claude/skills/lp-do-assessment-15-packaging-brief/modules/`, `[readonly] .claude/skills/_shared/assessment/assessment-base-contract.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — extraction boundaries are clear (Steps/Parts sections, Output Contract, Quality Gate). assessment-14 at 643L is the largest and most complex (15 steps + 9 output subsections), but step boundaries are well-defined. Held-back test: no single unknown would drop below 80 because all three skills have unambiguous numbered sections.
  - Approach: 85% — Phase Split pattern applies directly. Risk: assessment-14's output template (sections 1-9) may need its own module beyond the step extraction.
  - Impact: 85% — 1,331 lines across top 3 monoliths. Largest impact per task.
- **Build evidence:** Wave 2 parallel execution. assessment-14: 643→141L SKILL.md, 4 modules (steps-01-10:183L, steps-11-15:121L, output-template:165L, quality-gate:38L). assessment-01: 346→70L SKILL.md, 3 modules (steps:94L, output-template:134L, quality-gate:59L). assessment-15: 342→104L SKILL.md, 3 modules (steps:113L, output-template:107L, quality-gate:25L). All TC-01–TC-07 pass. Anti-gaming: all within 115% budget. Committed in wave as 20c49efa69.
- **Acceptance:**
  - All 3 SKILL.md files under 200 lines.
  - Each skill has a `modules/` directory with ≥2 module files.
  - No module exceeds 400 lines.
  - SKILL.md files reference the shared base-contract.
  - Completion message format preserved for each skill.
- **Validation contract (TC-XX):**
  - TC-01: `wc -l .claude/skills/lp-do-assessment-14-logo-brief/SKILL.md` < 200 → passes.
  - TC-02: `wc -l .claude/skills/lp-do-assessment-01-problem-statement/SKILL.md` < 200 → passes.
  - TC-03: `wc -l .claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md` < 200 → passes.
  - TC-04: Each `modules/` directory contains ≥2 `.md` files → passes.
  - TC-05: No module file exceeds 400 lines → passes.
  - TC-06: Each SKILL.md contains a `Load` or reference to the base-contract → passes.
  - TC-07: Each SKILL.md that originally had a Completion Message section preserves it (or references shared). Skills that lacked it (assessment-01) remain unchanged → passes.
- **Execution plan:**
  - Red: Verify current line counts match fact-find claims (643, 346, 342). Verify no existing modules/ directories.
  - Green: For each skill:
    1. Read full SKILL.md and identify extraction boundaries.
    2. Create `modules/` directory.
    3. Extract step/part content into module files (group related steps: e.g., steps 1-5 into `modules/steps-01-05.md`, steps 6-10 into `modules/steps-06-10.md`).
    4. For assessment-14: additionally extract output template sections (1-9) into `modules/output-template.md`.
    5. Extract Quality Gate + Red Flags into `modules/quality-gate.md` if skill-specific items warrant it.
    6. Rewrite SKILL.md as thin router: frontmatter → invocation → operating mode → required inputs → step routing (load modules) → output contract reference → quality gate reference → completion message → integration.
    7. Verify SKILL.md < 200L.
  - Refactor: Verify module naming consistency. Verify all cross-references resolve. Check total markdown footprint has not grown beyond the original (anti-gaming).
- **Planning validation (required for M/L):**
  - Checks run: Verified assessment-14 H2 headings: 24 sections total. Steps section spans lines 84-393 (310L). Output sections 1-9 span lines 421-561 (141L). Quality Gate + Red Flags + Completion + Integration span lines 562-643 (82L). Extraction into 3-4 modules is feasible with all under 400L.
  - Validation artifacts: H2 heading scan output for all 3 skills.
  - Unexpected findings: assessment-14 has an Artifact Discovery Rule section (lines 60-83, 24L) that is unique to skills reading multiple input artifacts. This stays in SKILL.md as skill-specific routing logic.
- **Consumer tracing (M-effort):**
  - New outputs: Module file paths (e.g., `modules/steps-01-05.md`). Consumer: SKILL.md router that loads them via markdown reference. All consumers are within the same skill directory.
  - Modified behavior: None — content is moved, not changed. All instruction text is preserved verbatim in modules.
  - Consumer `meta-loop-efficiency` is unchanged because it scans `SKILL.md` line count (which decreases) and `modules/` existence (which is added). Both changes are beneficial.
- **Scouts:** None: extraction targets are unambiguous numbered sections.
- **Edge Cases & Hardening:**
  - assessment-14 Artifact Discovery Rule (24L) — keep in SKILL.md (skill-specific, pre-flight routing).
  - assessment-15 conditionality gate — keep in SKILL.md (determines whether skill should execute at all).
  - assessment-01 has no Completion Message — SKILL.md notes this; no extraction needed for that section.
- **What would make this >=90%:**
  - All 3 skills successfully invoked on a test business after modularization with identical output.
- **Rollout / rollback:**
  - Rollout: Create modules/ directories, write module files, rewrite SKILL.md files. Single commit per wave.
  - Rollback: `git revert` the wave commit.
- **Documentation impact:** None: skill files are self-documenting.
- **Notes / references:**
  - assessment-14 heading analysis: 24 H2 sections, largest is Steps (310L).
  - assessment-01 heading analysis: 11 Steps, no Completion Message.
  - assessment-15 heading analysis: Steps + conditionality gate.

### TASK-03: Wave 2 — Modularize assessment-13, assessment-11, assessment-05
- **Type:** IMPLEMENT
- **Deliverable:** Restructured SKILL.md + new `modules/` directories for 3 skills
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-04)
- **Affects:** `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`, `.claude/skills/lp-do-assessment-13-product-naming/modules/`, `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`, `.claude/skills/lp-do-assessment-11-brand-identity/modules/`, `.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`, `.claude/skills/lp-do-assessment-05-name-selection/modules/`, `[readonly] .claude/skills/_shared/assessment/assessment-base-contract.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — pattern established by Wave 1 backbone. assessment-13 (336L) is a multi-part orchestrator (4 Parts); assessment-11 (299L) has 6 Steps; assessment-05 (292L) has 4 Parts. All have clear extraction points. Held-back test: no single unknown would drop below 80 — Wave 1 will have validated the pattern.
  - Approach: 85% — same Phase Split approach. Part-based skills (13, 05) have natural module boundaries at each Part.
  - Impact: 85% — 927 lines across 3 monoliths.
- **Build evidence:** Wave 2 parallel execution. assessment-13: 337→117L SKILL.md, 4 modules (part-1-2:70L, part-3-4:118L, resume-logic:33L, quality-gate:10L). assessment-11: 299→112L SKILL.md, 3 modules (steps-01-03:82L, steps-04-06:82L, quality-gate:34L). assessment-05: 292→102L SKILL.md, 3 modules (part-1-2:30L, part-3-4:101L, part-5-6:70L). All TC-01–TC-06 pass. Anti-gaming: all within 115% budget. Committed in wave as 20c49efa69.
- **Acceptance:**
  - All 3 SKILL.md files under 200 lines.
  - Each skill has a `modules/` directory with ≥2 module files.
  - No module exceeds 400 lines.
  - SKILL.md files reference the shared base-contract.
- **Validation contract (TC-XX):**
  - TC-01: `wc -l .claude/skills/lp-do-assessment-13-product-naming/SKILL.md` < 200 → passes.
  - TC-02: `wc -l .claude/skills/lp-do-assessment-11-brand-identity/SKILL.md` < 200 → passes.
  - TC-03: `wc -l .claude/skills/lp-do-assessment-05-name-selection/SKILL.md` < 200 → passes.
  - TC-04: Each `modules/` directory contains ≥2 `.md` files → passes.
  - TC-05: No module file exceeds 400 lines → passes.
  - TC-06: Each SKILL.md references the base-contract → passes.
- **Execution plan:**
  - Red: Verify current line counts (336, 299, 292). Verify no existing modules/.
  - Green: Same extraction pattern as TASK-02. For each skill: read, identify boundaries, create modules/, extract step/part content, rewrite SKILL.md as thin router.
  - Refactor: Verify anti-gaming (total footprint not grown). Verify naming consistency with Wave 1 modules.
- **Planning validation (required for M/L):**
  - Checks run: Verified assessment-13 has 4 Parts (Pipeline overview → Execution → Resume logic → Quality gate) spanning ~270L of extractable content. assessment-11 has 6 Steps spanning ~250L. assessment-05 has 4 Parts spanning ~240L.
  - Validation artifacts: H2 heading scan for all 3 skills.
  - Unexpected findings: assessment-13 has a "Resume logic" section for interrupted pipelines — keep in a dedicated module.
- **Consumer tracing (M-effort):**
  - New outputs: Module file paths. Consumer: SKILL.md router within the same skill directory.
  - Modified behavior: None — content moved verbatim.
- **Scouts:** None: pattern proven by Wave 1.
- **Edge Cases & Hardening:**
  - assessment-13 resume logic — extract to its own module (`modules/resume-logic.md`) to keep it findable.
  - assessment-05 operates on assessment-04 output — keep upstream reference in SKILL.md for clarity.
- **What would make this >=90%:** Wave 1 successfully completed and verified.
- **Rollout / rollback:**
  - Rollout: Single commit per wave.
  - Rollback: `git revert`.
- **Documentation impact:** None.
- **Notes / references:** Same extraction approach as TASK-02.

### TASK-04: Wave 3 — Modularize assessment-04, assessment-10, assessment-08
- **Type:** IMPLEMENT
- **Deliverable:** Restructured SKILL.md + new `modules/` directories for 3 skills
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`, `.claude/skills/lp-do-assessment-04-candidate-names/modules/`, `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`, `.claude/skills/lp-do-assessment-10-brand-profiling/modules/`, `.claude/skills/lp-do-assessment-08-current-situation/SKILL.md`, `.claude/skills/lp-do-assessment-08-current-situation/modules/`, `[readonly] .claude/skills/_shared/assessment/assessment-base-contract.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — smallest skills (280, 205, 203L). Pattern well-established by Waves 1-2. Held-back test: no single unknown would drop below 80 — these are the simplest extractions.
  - Approach: 90% — routine application of proven pattern.
  - Impact: 85% — completes the full 9-skill modularization set.
- **Build evidence:** Wave 2 parallel execution. assessment-04: 280→85L SKILL.md, 3 modules (part-1-3:85L, part-4-5:97L, quality-gate:30L). assessment-10: 205→80L SKILL.md, 2 modules (steps:31L, output-and-quality:106L). assessment-08: 203→77L SKILL.md, 2 modules (steps:53L, output-and-quality:90L). All TC-01–TC-05 pass. Anti-gaming: all within 115% budget. Committed in wave as 20c49efa69.
- **Acceptance:**
  - All 3 SKILL.md files under 200 lines.
  - Each skill has a `modules/` directory with ≥2 module files.
  - No module exceeds 400 lines.
  - SKILL.md files reference the shared base-contract.
- **Validation contract (TC-XX):**
  - TC-01: `wc -l .claude/skills/lp-do-assessment-04-candidate-names/SKILL.md` < 200 → passes.
  - TC-02: `wc -l .claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md` < 200 → passes.
  - TC-03: `wc -l .claude/skills/lp-do-assessment-08-current-situation/SKILL.md` < 200 → passes.
  - TC-04: Each `modules/` directory contains ≥2 `.md` files → passes.
  - TC-05: No module file exceeds 400 lines → passes.
- **Execution plan:**
  - Red: Verify current line counts (280, 205, 203). Verify no existing modules/.
  - Green: Same extraction pattern as Waves 1-2.
  - Refactor: Verify anti-gaming. Verify naming consistency.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** None: pattern proven.
- **Edge Cases & Hardening:** assessment-10 and assessment-08 are just over threshold (205, 203) — extraction may produce only 2 small modules each. This is acceptable; the goal is compliance, not maximum module count.
- **What would make this >=90%:** Waves 1-2 successfully completed.
- **Rollout / rollback:**
  - Rollout: Single commit.
  - Rollback: `git revert`.
- **Documentation impact:** None.
- **Notes / references:** Smallest wave — routine extraction.

### TASK-05: CHECKPOINT — Post-modularization audit verification
- **Type:** CHECKPOINT
- **Deliverable:** Audit re-scan confirming compliance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** None (read-only verification)
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Build evidence:** All 27 verification checks PASS. H1: all 9 SKILL.md files under 200L (range 70–141L). All have modules/ directories (2–4 modules each, max module 183L — well under 400L). Anti-gaming: all 9 within 115% budget (range 101%–108% of original). Base-contract: all 9 reference assessment-base-contract.md.
- **Acceptance:**
  - `/meta-loop-efficiency --dry-run` shows 0 assessment skill monoliths (all 9 previously-flagged skills now compliant).
  - No module-monolith advisories (no module >400L).
  - Total assessment skill markdown footprint has not grown beyond original (anti-gaming check).
- **Verification steps:**
  1. Run `/meta-loop-efficiency --dry-run` and capture output.
  2. Verify assessment-14, -01, -15, -13, -11, -05, -04, -10, -08 are all listed as compliant in H1.
  3. For each skill, compare (SKILL.md + modules/) total against original SKILL.md line count. Allow up to 15% overhead for router boilerplate and module load references. Flag any skill where total exceeds original + 15%.
  4. If any skill remains non-compliant or any skill has disproportionate growth (>15%): route to `/lp-do-replan`.
- **Notes:** If all skills pass, this is the plan completion trigger.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Module explosion (too many small files per skill) | Medium | Low | Cap at 3-5 modules per skill; group related steps |
| Behavior drift after extraction | Low | High | Manual invocation on 1-2 skills per wave; completion message format comparison |
| Anti-gaming (line reduction without simplification) | Medium | Medium | TASK-05 checkpoint: per-skill total (SKILL.md + modules/) vs original SKILL.md + 15% overhead allowance |
| Parallel wave conflicts | Low | Low | Waves touch different skill directories — no file overlap |
| assessment-14 complexity (643L, 15 steps + 9 output sections) | Medium | Medium | Dedicated planning validation; allow up to 5 modules for this skill |

## Observability

- Logging: None: markdown-only changes.
- Metrics: Post-wave line counts captured in TASK-05 checkpoint.
- Alerts/Dashboards: None: no runtime monitoring for skill files.

## Acceptance Criteria (overall)

- [ ] All 9 monolith assessment SKILL.md files under 200 lines
- [ ] Each of the 9 skills has a `modules/` directory
- [ ] No module exceeds 400 lines
- [ ] Shared base-contract exists at `_shared/assessment/assessment-base-contract.md`
- [ ] `/meta-loop-efficiency` re-scan shows 0 assessment monoliths
- [ ] Total markdown footprint (SKILL.md + modules/) per skill does not exceed original SKILL.md + 15% overhead allowance (router boilerplate + module load references)

## Decision Log

- 2026-03-04: Self-resolved open question from fact-find — use `_shared/assessment/` subdirectory for shared modules, consistent with existing `_shared/cabinet/` precedent. No DECISION task needed.
- 2026-03-04: Chose Option B (shared base-contract first) over Option A (independent extraction) for structural consistency across 14 assessment skills.
- 2026-03-04: Made waves 2-4 parallel after backbone (TASK-01) — independent skill directories, no file overlap risk.

## Overall-confidence Calculation

- TASK-01 (S=1): 85% → 85
- TASK-02 (M=2): 85% → 170
- TASK-03 (M=2): 85% → 170
- TASK-04 (S=1): 85% → 85
- TASK-05 (CHECKPOINT): excluded
- Total: 510 / 6 = **85%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create shared assessment base-contract | Yes | None | No |
| TASK-02: Wave 1 (assessment-14, -01, -15) | Yes — depends on TASK-01 only | None | No |
| TASK-03: Wave 2 (assessment-13, -11, -05) | Yes — depends on TASK-01 only | None | No |
| TASK-04: Wave 3 (assessment-04, -10, -08) | Yes — depends on TASK-01 only | None | No |
| TASK-05: CHECKPOINT verification | Yes — depends on TASK-02, -03, -04 | [Moderate]: If any wave fails, checkpoint blocks. Mitigated by independent waves — partial success still verifiable. | No |

No Critical findings. One Moderate advisory (checkpoint dependency on all 3 waves) — mitigated by wave independence.
