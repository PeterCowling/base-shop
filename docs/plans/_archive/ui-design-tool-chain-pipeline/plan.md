---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Build-completed: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ui-design-tool-chain-pipeline
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# UI Design Tool Chain Pipeline — Plan

## Summary

Seven UI design skills (`lp-design-spec`, `tools-ui-frontend-design`, `tools-design-system`, `lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`, `tools-refactor`) operate as disconnected units. Five stale references to the renamed `lp-design-system` skill remain in two SKILL.md files. Five of the seven skills have no `## Integration` section declaring their upstream trigger and downstream handoff. The `lp-do-plan` planning module has no routing logic for the `Design-Spec-Required: yes` flag that signals when `lp-design-spec` must run before UI implementation tasks.

This plan fixes all stale references with mechanical substitutions, adds `## Integration` sections following the established pattern from `lp-design-spec` and `lp-design-qa`, adds `## Entry Criteria` to `tools-refactor`, and adds a `Design Gate` subsection to `lp-do-plan/modules/plan-code.md`. All changes are documentation markdown edits — no application code is touched. Tasks are ordered to avoid conflict with the adjacent `lp-responsive-qa-skill` plan (Status: Ready-for-planning).

## Active tasks

- [x] TASK-01: Fix stale `lp-design-system` references in `lp-design-spec/SKILL.md`
- [x] TASK-02: Fix stale `lp-design-system` references in `frontend-design/SKILL.md`
- [x] TASK-03: Add `## Integration` section to `frontend-design/SKILL.md`
- [x] TASK-04: Add `## Integration` section to `tools-design-system/SKILL.md`
- [x] TASK-05: Add `## Integration` sections to `tools-ui-contrast-sweep/SKILL.md` and `tools-web-breakpoint/SKILL.md`
- [x] TASK-06: Add `## Integration` and `## Entry Criteria` sections to `tools-refactor/SKILL.md`
- [x] TASK-07: Add `Design Gate` subsection to `lp-do-plan/modules/plan-code.md`

## Goals

1. Eliminate all five stale `lp-design-system` references — agents loading either affected skill will find correct paths.
2. Add `## Integration` sections to the five skills that lack them — pipeline order is machine-readable.
3. Define `## Entry Criteria` for `tools-refactor` — agents know when to invoke it from QA output.
4. Add `Design Gate` to `lp-do-plan/modules/plan-code.md` — `Design-Spec-Required: yes` tasks are routed to `lp-design-spec` before UI implementation begins.

## Non-goals

- Creating a new `lp-responsive-qa` skill (in-flight under `lp-responsive-qa-skill` plan).
- Changing any application code.
- Adding orchestration scripts or automated pipeline runners.
- Editing `lp-design-spec/SKILL.md` or `lp-design-qa/SKILL.md` Integration sections (already correct).

## Constraints & Assumptions

- Constraints:
  - All changes are documentation markdown edits — SKILL.md files and one planning module (`lp-do-plan/modules/plan-code.md`).
  - Must not redefine `tools-ui-breakpoint-sweep` scope in ways that conflict with `lp-responsive-qa-skill` plan — scope annotation only notes the adjacent skill as "under construction."
  - Integration section format must match the established pattern: `## Integration` with `- **Upstream:**`, `- **Downstream:**`, `- **Loop position:**` bullets.
- Assumptions:
  - The `tools-design-system` SKILL.md Integration section should describe it as a non-sequential supporting reference (consulted on demand), not a pipeline stage.
  - The `Design Gate` in `plan-code.md` must be additive — it must not break existing planning flow for non-UI tasks.

## Inherited Outcome Contract

- **Why:** Seven UI design skills that should form a coherent pipeline are undiscoverable as a sequence by any agent traversing them. Stale name references mean an agent loading `lp-design-spec` or `frontend-design` will attempt to read a file at a path that does not exist. The absence of a pipeline intake contract means `lp-do-plan` cannot reliably trigger `lp-design-spec` for Design-Spec-Required tasks.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Each of the seven UI design SKILL.md files declares its upstream trigger and downstream handoff in an Integration section; all five stale name references to `lp-design-system` are replaced with `tools-design-system`; `lp-do-plan`'s plan-code module documents how to detect and route `Design-Spec-Required: yes` tasks to `lp-design-spec`; `tools-refactor` entry criteria from QA output are stated.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/ui-design-tool-chain-pipeline/fact-find.md`
- Key findings used:
  - Five stale `lp-design-system` references confirmed by grep in `lp-design-spec/SKILL.md` (lines 58, 133) and `frontend-design/SKILL.md` (lines 6, 33, 92).
  - No `lp-refactor` stale references remain (already cleaned by rename commit).
  - Two skills have existing correct Integration sections: `lp-design-spec` and `lp-design-qa`.
  - `lp-do-plan/modules/plan-code.md` has no `Design-Spec-Required` routing — confirmed by grep.
  - Pipeline order confirmed: spec → build UI → static QA → browser sweeps → refactor.
  - `lp-responsive-qa-skill` plan conflict surface: only `tools-ui-breakpoint-sweep` scope annotation needs care.

## Proposed Approach

- Option A: Address all edits in a single task.
- Option B: Split by file and concern — stale-ref fixes separate from Integration section additions, Design Gate separate from skill edits.
- Chosen approach: Option B. Splitting by concern makes each task independently reviewable, minimises blast radius per task, and ensures TASK-02 (stale ref fix in `frontend-design`) and TASK-03 (Integration section addition to same file) can be validated in isolation. TASK-07 (plan-code module) is isolated from all skill edits and can run in parallel.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: code-change` ✓
  - `Execution-Track: code` ✓
  - `Primary-Execution-Skill: lp-do-build` ✓
  - `Startup-Deliverable-Alias: none` ✓
  - Delivery-readiness: 98% ✓
  - Test landscape: present (manual validation + factcheck post-build) ✓
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix stale refs in `lp-design-spec/SKILL.md` | 95% | S | Complete (2026-02-27) | - | - |
| TASK-02 | IMPLEMENT | Fix stale refs in `frontend-design/SKILL.md` | 95% | S | Complete (2026-02-27) | - | TASK-03 |
| TASK-03 | IMPLEMENT | Add Integration section to `frontend-design/SKILL.md` | 90% | S | Complete (2026-02-27) | TASK-02 | - |
| TASK-04 | IMPLEMENT | Add Integration section to `tools-design-system/SKILL.md` | 90% | S | Complete (2026-02-27) | - | - |
| TASK-05 | IMPLEMENT | Add Integration sections to contrast-sweep and breakpoint-sweep | 85% | S | Complete (2026-02-27) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Add Integration + Entry Criteria to `tools-refactor/SKILL.md` | 90% | S | Complete (2026-02-27) | TASK-05 | - |
| TASK-07 | IMPLEMENT | Add Design Gate to `lp-do-plan/modules/plan-code.md` | 90% | S | Complete (2026-02-27) | - | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-05, TASK-07 | - | All independent; can run in parallel |
| 2 | TASK-03, TASK-06 | Wave 1: TASK-02 (for TASK-03), TASK-05 (for TASK-06) | TASK-03 same file as TASK-02; TASK-06 references sweep output paths set by TASK-05 |

**Max parallelism:** 5 (Wave 1)
**Critical path:** TASK-02 → TASK-03 (or TASK-05 → TASK-06) — 2 waves
**Total tasks:** 7

## Tasks

---

### TASK-01: Fix stale `lp-design-system` references in `lp-design-spec/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-design-spec/SKILL.md` — two stale path/name references replaced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution. TC-01: 0 lp-design-system refs remaining. TC-02: 2 tools-design-system refs confirmed. Committed in Wave 1 (1927f69637).
- **Affects:** `.claude/skills/lp-design-spec/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — Exact line numbers confirmed (lines 58, 133); substitutions are mechanical string replacements. Held-back test: no single unknown would drop this below 80 — the lines were read directly and the target text is confirmed.
  - Approach: 95% — String replacement of `lp-design-system` with `tools-design-system` and path update; no structural change.
  - Impact: 95% — Agents loading `lp-design-spec` currently follow an instruction to "Read `.claude/skills/lp-design-system/SKILL.md`" which points to a nonexistent file. Fix is immediate and complete.
- **Acceptance:**
  - `grep -n "lp-design-system" .claude/skills/lp-design-spec/SKILL.md` returns zero matches.
  - Path at former line 58 now reads `.claude/skills/tools-design-system/SKILL.md`.
  - Prose at former line 133 now reads `tools-design-system` skill.
  - No other lines in the file are modified.
- **Validation contract (TC-XX):**
  - TC-01: grep for `lp-design-system` in `lp-design-spec/SKILL.md` → 0 matches
  - TC-02: grep for `tools-design-system` in `lp-design-spec/SKILL.md` → at least 2 matches (table cell + prose)
  - TC-03: grep for `lp-design-system` across all seven skill SKILL.md files → confirms this file contributes 0 (baseline for overall cleanup)
- **Execution plan:** Red → Read file at exact lines. Green → Apply two targeted string replacements. Refactor → Verify with grep.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort documentation edit; no runtime behavior.
- **Edge Cases & Hardening:** If line numbers have shifted since fact-find, search for the containing string rather than using line offsets.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Commit with message "fix(skills): replace stale lp-design-system refs in lp-design-spec"
  - Rollback: `git revert` the commit
- **Documentation impact:** This IS a documentation edit. No secondary docs affected.
- **Notes / references:** Stale refs introduced when commit `161c42704d` renamed the skill but did not update callers.

---

### TASK-02: Fix stale `lp-design-system` references in `frontend-design/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/frontend-design/SKILL.md` — three stale references replaced
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution. TC-01: 0 lp-design-system refs remaining. TC-02: 3 tools-design-system refs confirmed (frontmatter, table, Step 2). Committed in Wave 1 (1927f69637).
- **Affects:** `.claude/skills/frontend-design/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 95%
  - Implementation: 95% — Three exact locations confirmed (line 6 frontmatter, line 33 table, line 92 step instruction). Held-back test: no single unknown would drop this below 80 — locations confirmed by direct grep.
  - Approach: 95% — String replacement; no structural change.
  - Impact: 95% — `frontend-design/SKILL.md` Step 2 explicitly instructs "Read `.claude/skills/lp-design-system/SKILL.md`" — an agent following this verbatim will fail. Fix eliminates the failure path.
- **Acceptance:**
  - `grep -n "lp-design-system" .claude/skills/frontend-design/SKILL.md` returns zero matches.
  - Frontmatter `related_skills` now lists `tools-design-system` (not `lp-design-system`).
  - Table row "Token quick-ref" now points to `.claude/skills/tools-design-system/SKILL.md`.
  - Step 2 instruction now reads `.claude/skills/tools-design-system/SKILL.md`.
  - No other lines modified.
- **Validation contract (TC-XX):**
  - TC-01: grep for `lp-design-system` in `frontend-design/SKILL.md` → 0 matches
  - TC-02: grep for `tools-design-system` in `frontend-design/SKILL.md` → at least 3 matches
  - TC-03: path `.claude/skills/tools-design-system/SKILL.md` exists in repo → confirmed (directory exists)
- **Execution plan:** Red → Read file at exact locations. Green → Apply three targeted replacements. Refactor → Verify with grep.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:** Search by containing string if line numbers shifted.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:**
  - Rollout: Commit with "fix(skills): replace stale lp-design-system refs in frontend-design"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit.
- **Notes / references:** TASK-03 depends on this task completing first (same file; must be applied in order).

---

### TASK-03: Add `## Integration` section to `frontend-design/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/frontend-design/SKILL.md` — new `## Integration` section appended
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution (Wave 2). TC-01: ## Integration heading confirmed at line 126. TC-02: Upstream/Downstream/Loop position bullets all present. TC-03: lp-design-spec as upstream. TC-04: lp-design-qa as downstream. Loop position S9A declared. Committed in Wave 2 (568da53bb1).
- **Affects:** `.claude/skills/frontend-design/SKILL.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Content is fully defined in fact-find task seed. Pattern is established (lp-design-qa Integration section as reference). Held-back test: only unknown is exact placement — appending after final section is safe and conventional.
  - Approach: 90% — Append `## Integration` section following the `- **Upstream:** / - **Downstream:** / - **Loop position:**` pattern.
  - Impact: 90% — Makes `tools-ui-frontend-design` position in the pipeline machine-readable; agents orchestrating the pipeline can confirm ordering from this file.
- **Acceptance:**
  - `grep -n "## Integration" .claude/skills/frontend-design/SKILL.md` → at least 1 match.
  - Section contains `- **Upstream:**`, `- **Downstream:**`, `- **Loop position:**` bullets.
  - Upstream declares: `lp-design-spec` (design spec document); `lp-do-plan` (IMPLEMENT task).
  - Downstream declares: `lp-design-qa`; `lp-do-build`.
  - Loop position: `S9A (UI Build) — post-design-spec, pre-design-qa`.
- **Validation contract (TC-XX):**
  - TC-01: `## Integration` heading present in file → pass
  - TC-02: All three bullet types (Upstream, Downstream, Loop position) present → pass
  - TC-03: `lp-design-spec` referenced as upstream source → pass
  - TC-04: `lp-design-qa` referenced as downstream consumer → pass
- **Execution plan:** Red → Confirm TASK-02 complete; read current file end. Green → Append Integration section. Refactor → Verify structure with grep.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:** Do not add Integration section if TASK-02 is not yet committed (file conflict risk).
- **What would make this >=90%:** Confirming exact placement convention from another recently-added Integration section; already 90% which is sufficient.
- **Rollout / rollback:**
  - Rollout: Commit with "feat(skills): add Integration section to tools-ui-frontend-design"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit.
- **Notes / references:** Section content specified in fact-find TASK-03 seed.

---

### TASK-04: Add `## Integration` section to `tools-design-system/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-design-system/SKILL.md` — new `## Integration` section appended
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution. TC-01: ## Integration heading confirmed at line 81. TC-02: "not a pipeline stage" wording present. TC-03: 4 consumer skills listed (lp-design-spec, tools-ui-frontend-design, lp-design-qa, tools-refactor). Committed in Wave 1 (1927f69637).
- **Affects:** `.claude/skills/tools-design-system/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — File content confirmed (79 lines, no Integration section). Content is clear from fact-find: this is a non-pipeline supporting reference.
  - Approach: 90% — Integration section for a reference tool differs from pipeline stages: no Upstream/Downstream in sequential sense; instead, role description and list of consumers.
  - Impact: 90% — Makes clear `tools-design-system` is not a stage to be sequenced but a reference to consult. Prevents agents from incorrectly inserting it into pipeline ordering.
- **Acceptance:**
  - `grep -n "## Integration" .claude/skills/tools-design-system/SKILL.md` → at least 1 match.
  - Section declares role as supporting reference consulted by pipeline skills on demand.
  - Section lists: `lp-design-spec`, `tools-ui-frontend-design`, `lp-design-qa`, `tools-refactor` as consumers.
  - Section explicitly notes: not a pipeline stage — invoked on demand.
- **Validation contract (TC-XX):**
  - TC-01: `## Integration` heading present → pass
  - TC-02: "not a pipeline stage" or equivalent wording present → pass
  - TC-03: At least three pipeline consumer skills listed → pass
- **Execution plan:** Red → Read current file end. Green → Append Integration section. Refactor → Verify with grep.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:** None — standalone file edit with no dependencies.
- **What would make this >=90%:** Already at 90%; minor uncertainty only in exact phrasing of "non-stage" designation.
- **Rollout / rollback:**
  - Rollout: Commit with "feat(skills): add Integration section to tools-design-system"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit.
- **Notes / references:** Content specified in fact-find TASK-04 seed.

---

### TASK-05: Add `## Integration` sections to `tools-ui-contrast-sweep/SKILL.md` and `tools-web-breakpoint/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-ui-contrast-sweep/SKILL.md` and `.claude/skills/tools-web-breakpoint/SKILL.md` — new `## Integration` sections in each
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution. TC-01/TC-02: ## Integration headings confirmed in both files. TC-03: Upstream, Downstream, Loop position (S9C) declared in both. TC-04: lp-responsive-qa-skill plan path referenced in web-breakpoint section. TC-05: Existing "Relationship to Other Skills" prose confirmed unchanged. Committed in Wave 1 (1927f69637).
- **Affects:** `.claude/skills/tools-ui-contrast-sweep/SKILL.md`, `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — Both files confirmed (197 and 188 lines, no Integration sections). Content is defined: parallel sweep stage position, upstream `lp-design-qa`, downstream `tools-refactor`. Held-back test for `tools-web-breakpoint`: the scope annotation noting `lp-responsive-qa` as "under construction" is the only nuanced element — risk is minor because the annotation is additive and does not modify the scope boundary.
  - Approach: 90% — Standard Integration section pattern; `tools-web-breakpoint` additionally gets a note acknowledging `lp-responsive-qa` (under construction) as a complementary rendered-screenshot skill.
  - Impact: 85% — Confirms parallel sweep stage position in pipeline; the `lp-responsive-qa` note prevents future scope confusion between the two breakpoint-related skills.
  - Overall: min(90, 90, 85) = 85%
- **Acceptance:**
  - `grep -n "## Integration" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → 1 match.
  - `grep -n "## Integration" .claude/skills/tools-web-breakpoint/SKILL.md` → 1 match.
  - Both sections declare: Upstream `lp-design-qa` (optional trigger); Downstream `tools-refactor` and `lp-do-build`; Loop position S9C.
  - `tools-web-breakpoint` section includes a note about `lp-responsive-qa` (under construction, `docs/plans/lp-responsive-qa-skill/`) as a complementary rendered-screenshot skill.
  - No changes to "Relationship to Other Skills" prose (preserved as-is).
- **Validation contract (TC-XX):**
  - TC-01: `## Integration` present in contrast-sweep SKILL.md → pass
  - TC-02: `## Integration` present in web-breakpoint SKILL.md → pass
  - TC-03: Both sections contain Upstream, Downstream, Loop position → pass
  - TC-04: web-breakpoint section references `lp-responsive-qa-skill` plan path → pass
  - TC-05: Existing "Relationship to Other Skills" sections unchanged → confirm by diff
- **Execution plan:** Red → Read both files. Green → Append Integration sections to each. Refactor → Verify with grep on both files.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:** Keep the `lp-responsive-qa` note scoped to "under construction" — do not make claims about when it will ship or what it supersedes in `tools-web-breakpoint`.
- **What would make this >=90%:** Confirming the `lp-responsive-qa-skill` plan path is still `docs/plans/lp-responsive-qa-skill/` at build time (it is — confirmed during fact-find).
- **Rollout / rollback:**
  - Rollout: Commit with "feat(skills): add Integration sections to tools-ui-contrast-sweep and tools-ui-breakpoint-sweep"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit.
- **Notes / references:** Content specified in fact-find TASK-05 seed. TASK-06 depends on this task completing (refactor entry criteria reference the sweep output paths established in these Integration sections).

---

### TASK-06: Add `## Integration` and `## Entry Criteria` sections to `tools-refactor/SKILL.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-refactor/SKILL.md` — new `## Integration` and `## Entry Criteria` sections appended
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution (Wave 2). TC-01: ## Entry Criteria heading at line 116. TC-02: ## Integration heading at line 127. TC-03: lp-design-qa, contrast-sweep-report.md, and breakpoint-sweep-report.md all referenced. TC-04: Loop position S9D declared. TC-05: Existing Common Goals/Patterns/Checklist sections confirmed unchanged. Committed in Wave 2 (568da53bb1).
- **Affects:** `.claude/skills/tools-refactor/SKILL.md`
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — File confirmed (114 lines, no Integration or Entry Criteria sections). Entry Criteria content is defined in fact-find. TASK-05 must complete first so the sweep output artifact paths in Entry Criteria are consistent with what those skills declare.
  - Approach: 90% — Two sections: `## Entry Criteria` (upstream triggers and minimum-trigger threshold) and `## Integration` (pipeline position). `## Entry Criteria` comes before `## Integration` per natural reading order.
  - Impact: 90% — `tools-refactor` is currently opaque: no agent knows when to invoke it from QA findings. Entry Criteria makes it mechanically invokable.
- **Acceptance:**
  - `grep -n "## Entry Criteria" .claude/skills/tools-refactor/SKILL.md` → 1 match.
  - `grep -n "## Integration" .claude/skills/tools-refactor/SKILL.md` → 1 match.
  - Entry Criteria section lists: at least one QA finding citing arbitrary values, missing semantic tokens, or component structure issues — OR operator direction.
  - Entry Criteria references the output report paths from `lp-design-qa`, `tools-ui-contrast-sweep`, and `tools-ui-breakpoint-sweep`.
  - Integration section declares: Upstream QA reports; Downstream `lp-do-build` + human PR review; Loop position S9D.
- **Validation contract (TC-XX):**
  - TC-01: `## Entry Criteria` present → pass
  - TC-02: `## Integration` present → pass
  - TC-03: Entry Criteria references all three upstream QA report paths → pass
  - TC-04: Loop position S9D declared → pass
  - TC-05: Existing refactoring content (patterns, checklist) unchanged → confirm by diff
- **Execution plan:** Red → Read current file. Green → Append Entry Criteria section, then Integration section. Refactor → Verify both sections with grep.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:** Do not modify the existing "## Common Goals", "## Patterns", or "## Checklist" sections.
- **What would make this >=90%:** Already at 90%; the only uncertainty is whether Entry Criteria should also specify a minimum number of findings (e.g., "at least 1"). The fact-find specified "at least one" — use that threshold.
- **Rollout / rollback:**
  - Rollout: Commit with "feat(skills): add Entry Criteria and Integration sections to tools-refactor"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit.
- **Notes / references:** Content specified in fact-find TASK-06 seed.

---

### TASK-07: Add `Design Gate` subsection to `lp-do-plan/modules/plan-code.md`

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-plan/modules/plan-code.md` — new `## Design Gate` subsection inserted after task decomposition heuristics
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** Inline execution. TC-01: ## Design Gate heading confirmed at line 15. TC-02: Design-Spec-Required conditional logic present. TC-03: "UI tasks only" + "Backend, data, infra, and documentation tasks are exempt" present. TC-04: lp-design-spec skill referenced. TC-05: All prior sections (Objective, Task Decomposition Heuristics, Required Task Types, etc.) confirmed unchanged. Committed in Wave 1 (1927f69637).
- **Affects:** `.claude/skills/lp-do-plan/modules/plan-code.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — `plan-code.md` confirmed (52 lines; no `Design-Spec-Required` reference). Insertion point: after `## Task Decomposition Heuristics` and before `## Required Task Types`. This placement ensures the gate is checked before tasks are created. Held-back test: could the addition break existing planning flow? Only if the gate logic is written as a hard stop for non-UI tasks — the design must make it conditional on the presence of `Design-Spec-Required: yes` only.
  - Approach: 90% — New `## Design Gate` subsection with conditional logic: if `Design-Spec-Required: yes` in fact-find → add prerequisite task for `lp-design-spec` before UI IMPLEMENT tasks; if absent/no → no change. Gate must be explicitly scoped to UI tasks only.
  - Impact: 90% — Closes the gap where UI-heavy plans proceed without a design spec. The gate is additive and conditional — non-UI plans are unaffected.
- **Acceptance:**
  - `grep -n "## Design Gate" .claude/skills/lp-do-plan/modules/plan-code.md` → 1 match.
  - Subsection contains conditional: if `Design-Spec-Required: yes` → insert prerequisite task.
  - Subsection explicitly scopes the gate to UI tasks (backend/data/infra tasks exempt).
  - Subsection states the prerequisite task must be a dependency for all tasks touching UI component file paths.
  - No existing content in `plan-code.md` is removed or modified.
- **Validation contract (TC-XX):**
  - TC-01: `## Design Gate` heading present → pass
  - TC-02: Conditional `Design-Spec-Required: yes` logic present → pass
  - TC-03: Explicit statement that gate does not apply to non-UI tasks → pass
  - TC-04: Reference to `lp-design-spec` as the skill to invoke → pass
  - TC-05: Existing `plan-code.md` sections (Objective, Task Decomposition Heuristics, Required Task Types, etc.) unchanged → confirm by diff
- **Execution plan:** Red → Read `plan-code.md`. Identify insertion point (after Task Decomposition Heuristics, before Required Task Types). Green → Insert `## Design Gate` subsection at identified point. Refactor → Verify grep and diff confirm additive-only change.
- **Planning validation:** Not required for S-effort.
- **Scouts:** None: S-effort.
- **Edge Cases & Hardening:**
  - The gate must not trigger for non-UI plans — the conditional must key on `Design-Spec-Required: yes` being explicitly present in the fact-find.
  - The gate must not block plans where `lp-design-spec` has already run (design spec doc already exists) — add a check: if `docs/plans/<slug>-design-spec.md` exists, gate passes automatically.
- **What would make this >=90%:** Confirming that all existing `lp-do-plan` plans would be unaffected by the new gate (they would — none have `Design-Spec-Required: yes`). Already 90%.
- **Rollout / rollback:**
  - Rollout: Commit with "feat(skills): add Design Gate to lp-do-plan plan-code module"
  - Rollback: `git revert`
- **Documentation impact:** This IS a documentation edit to the planning module.
- **Notes / references:** Content specified in fact-find TASK-07 seed. Placement: after `## Task Decomposition Heuristics`, before `## Required Task Types`.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Fix stale refs in lp-design-spec | Yes — file confirmed; target lines identified | None | No |
| TASK-02: Fix stale refs in frontend-design | Yes — file confirmed; 3 target locations identified | None | No |
| TASK-03: Add Integration to frontend-design | Yes — depends on TASK-02 (same file); sequenced after | None | No |
| TASK-04: Add Integration to tools-design-system | Yes — file confirmed; no dependencies | None | No |
| TASK-05: Add Integration to contrast-sweep + breakpoint | Yes — both files confirmed; independent | None | No |
| TASK-06: Add Entry Criteria + Integration to tools-refactor | Partial — depends on TASK-05 for QA report path references to be consistent | [Ordering] [Minor]: TASK-06 references sweep output paths; these are stable and already confirmed in fact-find regardless of TASK-05 timing | No — paths are confirmed constants, not produced by TASK-05 |
| TASK-07: Add Design Gate to plan-code module | Yes — file confirmed; insertion point identified; independent of skill edits | None | No |

No Critical or Major simulation issues. One Minor ordering note for TASK-06: resolved by noting that sweep output paths are constants confirmed in the fact-find, not produced at build time by TASK-05.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `lp-responsive-qa-skill` plan executes TASK-05 on `tools-web-breakpoint` simultaneously | Low | Medium — merge conflict | TASK-05 note scoped to "under construction" annotation only; does not make substantive scope changes to breakpoint-sweep functionality |
| `lp-do-plan/modules/plan-code.md` Design Gate blocks non-UI plans | Low | High — breaks existing planning flow | Gate implementation must use explicit conditional on `Design-Spec-Required: yes`; test: grep for `Design-Spec-Required` in any active plan — none present |
| Edge case: design spec already exists when gate is checked | Low | Low — unnecessary re-run | Gate must check for existing `docs/plans/<slug>-design-spec.md` and auto-pass if found |

## Observability

- Logging: None: documentation-only changes.
- Metrics: Post-build grep: `grep -n "lp-design-system" .claude/skills/lp-design-spec/SKILL.md .claude/skills/frontend-design/SKILL.md → 0 results`
- Alerts/Dashboards: None: not applicable for documentation edits.

## Acceptance Criteria (overall)

- [ ] `grep -n "lp-design-system" .claude/skills/lp-design-spec/SKILL.md` returns zero matches
- [ ] `grep -n "lp-design-system" .claude/skills/frontend-design/SKILL.md` returns zero matches
- [ ] `## Integration` section present in all 5 previously-missing skills: `frontend-design/SKILL.md`, `tools-design-system/SKILL.md`, `tools-ui-contrast-sweep/SKILL.md`, `tools-web-breakpoint/SKILL.md`, `tools-refactor/SKILL.md`
- [ ] `## Entry Criteria` section present in `tools-refactor/SKILL.md`
- [ ] `## Design Gate` subsection present in `lp-do-plan/modules/plan-code.md`
- [ ] `lp-design-spec/SKILL.md` and `lp-design-qa/SKILL.md` Integration sections unchanged (already correct)
- [ ] Builder runs `lp-do-factcheck` over all 8 edited files as a final post-build gate after all tasks complete (no separate plan task; run once after Wave 2 tasks finish to confirm all paths and skill names are correct)

## Decision Log

- 2026-02-27: Chose to split stale-ref fix (TASK-02) from Integration section addition (TASK-03) for `frontend-design/SKILL.md` — same file but distinct concerns; allows independent review.
- 2026-02-27: Chose plan-code.md (not lp-do-plan/SKILL.md Foundation Gate) as placement for Design Gate — scopes the gate to UI code tasks only; does not add to the general foundation gate that applies to all deliverable types.
- 2026-02-27: TASK-05 and TASK-06 sequenced with TASK-06 blocking on TASK-05 for consistency, though sweep output paths are confirmed constants from fact-find and TASK-06 could technically run in parallel.

## Overall-confidence Calculation

All tasks are S-effort (weight 1). All confidence scores:
- TASK-01: 95%
- TASK-02: 95%
- TASK-03: 90%
- TASK-04: 90%
- TASK-05: 85% (min of 90/90/85)
- TASK-06: 90%
- TASK-07: 90%

Overall-confidence = (95 + 95 + 90 + 90 + 85 + 90 + 90) × 1 / 7 = 635 / 7 = **90%** (rounded to nearest 5)
