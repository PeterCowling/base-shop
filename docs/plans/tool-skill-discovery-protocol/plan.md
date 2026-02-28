---
Type: Plan
Status: Complete
Domain: BOS
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Last-build: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: tool-skill-discovery-protocol
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-factcheck
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Tool Skill Discovery Protocol Plan

## Summary

Five `tools-*` / `tool-*` prefixed skills exist in `.claude/skills/` but three are absent from AGENTS.md, no discovery index exists, and there is no naming convention or required SKILL.md metadata standard. This plan delivers: (1) a naming and metadata convention spec at `.claude/skills/tools-standard.md`; (2) a lightweight discovery index at `.claude/skills/tools-index.md` covering all five skills; (3) backfill of missing frontmatter fields in all five SKILL.md files; and (4) AGENTS.md updates that add the three missing skills and a pointer to the index. After the build, `lp-do-factcheck` verifies compliance. All changes are additive; rollback is a single `git revert`.

## Active tasks

- [x] TASK-01: Write tools-standard.md — naming convention and metadata spec
- [x] TASK-02: Create tools-index.md — lightweight discovery index
- [x] TASK-03: Backfill SKILL.md frontmatter for all five tool skills
- [x] TASK-04: Update AGENTS.md — add missing skills and index pointer
- [x] TASK-05: Checkpoint — factcheck compliance verification

## Goals

- A single-read index lets future agents locate tool skills without directory scanning
- All five tool skills have consistent, token-efficient frontmatter
- AGENTS.md is the complete canonical listing for all skills including all five tool skills
- Decision criteria distinguishing `tools-*` from `lp-*` skills are written down and discoverable
- The naming convention (prefix, directory/invocation-name rule) is documented

## Non-goals

- Redesigning the `lp-*` skill system or startup loop workflow
- Moving skill directories or repository structure changes
- Writing new tool skills
- Changing Claude Code platform auto-discovery behaviour

## Constraints & Assumptions

- Constraints:
  - AGENTS.md must remain readable; entries stay as one-liners
  - `.claude/skills/` root is fixed; no directory relocations
  - New frontmatter fields must not interfere with Claude Code's `name`/`description` auto-discovery
  - Index must be consumable with a single file read, no tooling
- Assumptions:
  - Five skills confirmed as full current inventory: `tool-process-audit`, `tools-bos-design-page`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` (dir: `tools-web-breakpoint/`), `tools-ui-frontend-design` (dir: `frontend-design/`)
  - Rename of `tool-process-audit` directory is deferred; the plan proceeds on the default assumption (no rename, document as legacy exception). This assumption remains open to operator override — if the operator confirms a rename, TASK-01 acceptance criteria must be updated and a new TASK-06 added before TASK-05 runs.

## Inherited Outcome Contract

- **Why:** Three of five tool skills are absent from AGENTS.md; agents discovering tools must do expensive directory scans; no naming convention or metadata standard exists; one skill has a directory/invocation-name mismatch creating ambiguity.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A tool-skill discovery protocol exists: naming convention documented, metadata standard defined, index at a known path, AGENTS.md pointer added, all five skills backfilled. Future agents locate the right tool skill with one index read.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/tool-skill-discovery-protocol/fact-find.md`
- Key findings used:
  - Five tool skills confirmed; inventory in fact-find Entry Points section
  - AGENTS.md currently lists two tool skills (`tools-bos-design-page`, `tools-ui-frontend-design`); three are absent
  - `tools-web-breakpoint/` directory contains `name: tools-ui-breakpoint-sweep` — directory ≠ invocation name
  - `frontend-design/` directory contains `name: tools-ui-frontend-design` — same pattern
  - Required five frontmatter fields identified: `name`, `description`, `operating_mode`, `trigger_conditions`, `related_skills`
  - Decision criteria for `tools-*` vs `lp-*` resolved in fact-find Q&A
  - Rename of `tool-process-audit` deferred by default; document as legacy exception

## Proposed Approach

- Option A: Embed the naming convention spec inside `tools-index.md` as a preamble (one file for everything)
- Option B: Create a separate `tools-standard.md` spec file and a separate `tools-index.md` index (two files, clear separation of concerns)
- Chosen approach: Option B. Separation keeps the index compact and scannable (agents read it for quick lookup), while the standard doc can be longer and more detailed without cluttering discovery. The standard doc is loaded only when creating or evaluating a tool skill; the index is loaded for every tool-skill lookup. This follows the progressive loading principle already established in AGENTS.md.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write tools-standard.md — naming convention and metadata spec | 85% | S | Complete (2026-02-27) | - | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Create tools-index.md — discovery index for all five skills | 85% | S | Complete (2026-02-27) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Backfill SKILL.md frontmatter for all five tool skills | 80% | S | Complete (2026-02-27) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Update AGENTS.md — add missing skills and index pointer | 85% | S | Complete (2026-02-27) | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Factcheck compliance verification | 95% | S | Complete (2026-02-27) | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must complete first; defines the standard that downstream tasks implement |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-01 complete | All three can run in parallel after TASK-01 |
| 3 | TASK-05 | TASK-02, TASK-03, TASK-04 complete | Checkpoint — verifies all Wave 2 outputs |

## Tasks

---

### TASK-01: Write tools-standard.md — naming convention and metadata spec

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/tools-standard.md` — new file containing the complete tool-skill creation and discovery standard
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/tools-standard.md` — co-located with the skills it governs
- **Reviewer:** None — operator reads on next session; no blocking approval required
- **Approval-Evidence:** None required — convention doc, not a gated artifact
- **Measurement-Readiness:** None: correctness verified by factcheck in TASK-05
- **Affects:** `.claude/skills/tools-standard.md` (new file)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 90% — content is fully determined by fact-find resolved Q&A; no unknowns remain
  - Approach: 90% — Option B (separate files) is clearly better for progressive loading; decision criteria are well-evidenced
  - Impact: 85% — the standard only has value if agents consult it; AGENTS.md pointer and TASK-04 ensure discoverability
- **Acceptance:**
  - File exists at `.claude/skills/tools-standard.md`
  - Contains: prefix convention (`tools-` plural as canonical, `tool-` documented as legacy exception with no rename required)
  - Contains: required frontmatter fields spec — `name`, `description`, `operating_mode`, `trigger_conditions`, `related_skills` — with definition and example for each
  - Contains: `operating_mode` vocabulary — `AUDIT | ANALYSIS + RECOMMENDATIONS | GENERATE | INTERACTIVE`
  - Contains: decision criteria for `tools-*` vs `lp-*` (the four-condition test from fact-find)
  - Contains: directory/invocation-name rule — canonical invocation name is the SKILL.md `name` frontmatter field, not the directory name; directory names must match for new skills; legacy exceptions documented by name
  - Contains: "How to create a new tool skill" section covering the above rules plus index-update requirement
  - Contains: note that `tools-index.md` must be updated when a new tool skill is added
- **Validation contract (VC-01):**
  - VC-01: File readable by a single Read call with no pagination required -> pass if file is under 200 lines
  - VC-02: All five required frontmatter fields defined and explained -> pass if each field has a one-line definition and an example value
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: File does not exist yet — trivially red
  - Green evidence plan: Write the file with all required sections; each section derived directly from fact-find resolved Q&A
  - Refactor evidence plan: Ensure the file is under 200 lines and the "How to create a new tool skill" section reads as a standalone instruction without needing the rest of the fact-find
- **Planning validation:**
  - Checks run: Read all five existing SKILL.md files to confirm the field definitions match observed reality (done in fact-find)
  - Validation artifacts: fact-find.md Patterns & Conventions Observed section
  - Unexpected findings: None
- **Scouts:** None: all content determined from fact-find evidence
- **Edge Cases & Hardening:**
  - Edge case: an agent adds a new tool skill with a directory name that differs from the invocation name. The directory/invocation-name rule section must make this unambiguous: new skills must have matching directory and SKILL.md `name` field; legacy exceptions are named explicitly.
  - Edge case: the `operating_mode` vocabulary list is incomplete for a future skill. The spec should note that the vocabulary is extensible; new values must be added to both the spec and the index entry.
- **What would make this >=90%:**
  - Operator confirmation that the four-condition `tools-*` vs `lp-*` decision criteria are correct and sufficient
- **Rollout / rollback:**
  - Rollout: Create file; downstream tasks proceed
  - Rollback: `git revert` removes the file; no other files are affected by TASK-01 alone
- **Documentation impact:**
  - Creates `.claude/skills/tools-standard.md`
- **Notes / references:**
  - Decision criteria source: fact-find Resolved Q5 (operator-stated requirement)
  - Rename decision: `tool-process-audit` directory rename is deferred; document as legacy exception explicitly. No TASK-06 needed.
- **Build evidence (2026-02-27):**
  - Red: File did not exist prior to this task — trivially confirmed.
  - Green: File created at `.claude/skills/tools-standard.md` (84 lines) via Codex offload under writer lock.
  - Refactor: File is 84 lines (VC-01 pass: under 200). All five frontmatter fields defined with one-line definition and example value (VC-02 pass). All required sections present: naming convention, frontmatter spec table, operating_mode vocabulary, classification decision criteria, invocation-name/directory rule, "How to create a new tool skill" (6 steps including index update requirement), maintenance note.
  - VC-01: PASS (84 lines < 200)
  - VC-02: PASS (all five fields have definition + example in the table at section 2)

---

### TASK-02: Create tools-index.md — discovery index for all five skills

- **Type:** IMPLEMENT
- **Deliverable:** `.claude/skills/tools-index.md` — new file; lightweight index listing all five tool skills with token-efficient frontmatter summary
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/tools-index.md`
- **Reviewer:** None required
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None: verified by factcheck in TASK-05
- **Affects:** `.claude/skills/tools-index.md` (new file)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — all five skills confirmed; their invocation names and directory paths are known from fact-find
  - Approach: 90% — Markdown single-read format is well-established; the format is determined by the standard written in TASK-01
  - Impact: 85% — direct benefit to future agents; benefit is proportional to how consistently AGENTS.md pointer is followed
- **Acceptance:**
  - File exists at `.claude/skills/tools-index.md`
  - Contains one entry per tool skill (five total)
  - Each entry includes: invocation name, directory path (explicit when different from invocation name), one-line description, operating_mode, trigger_conditions summary, related_skills list
  - Entries for `tools-web-breakpoint/` show both directory path and invocation name `tools-ui-breakpoint-sweep`
  - Entries for `frontend-design/` show both directory path and invocation name `tools-ui-frontend-design`
  - File is under 100 lines and readable in a single Read call
  - Contains a one-line header note that this index must be updated when a new tool skill is added
- **Validation contract (VC-02):**
  - VC-01: Five entries present -> pass if each skill has its own section
  - VC-02: Each entry has invocation name, directory path, description, operating_mode, trigger_conditions, related_skills -> pass if all six fields present per entry
  - VC-03: File under 100 lines -> pass if `wc -l .claude/skills/tools-index.md` < 100
- **Execution plan:**
  - Red evidence plan: File does not exist yet
  - Green evidence plan: Write one entry per skill; derive content from TASK-01 standard format and from each skill's existing SKILL.md (content confirmed in fact-find)
  - Refactor evidence plan: Verify no entry exceeds 10 lines; trim verbose descriptions to one line
- **Planning validation:**
  - Checks run: Confirmed all five SKILL.md files are readable and their content is known (fact-find direct reads)
  - Validation artifacts: fact-find Entry Points section
  - Unexpected findings: None
- **Scouts:** None: content is determined
- **Edge Cases & Hardening:**
  - Edge case: a future skill has trigger_conditions that overlap with an existing skill. The index format should make `related_skills` prominent so agents can navigate across overlapping skills.
- **What would make this >=90%:**
  - `operating_mode` and `trigger_conditions` confirmed by TASK-03 backfill (which may discover currently-missing values)
- **Rollout / rollback:**
  - Rollout: Create file
  - Rollback: `git revert`; no other files changed by TASK-02 alone
- **Documentation impact:**
  - Creates `.claude/skills/tools-index.md`
- **Notes / references:**
  - Index format determined by TASK-01 standard — do not invent format independently
- **Build evidence (2026-02-27):**
  - Red: File did not exist prior to this task — trivially confirmed.
  - Green: File created at `.claude/skills/tools-index.md` (62 lines). Five entries present, each with all six required fields: invocation name, directory, description, operating_mode, trigger_conditions, related_skills. Entries for `tools-web-breakpoint/` and `frontend-design/` both show directory path AND invocation name. Index header contains update-when-adding instruction.
  - VC-01: PASS (5 entries present, each with its own `## ` section)
  - VC-02: PASS (all six fields present per entry — confirmed by grep)
  - VC-03: PASS (62 lines < 100)

---

### TASK-03: Backfill SKILL.md frontmatter for all five tool skills

- **Type:** IMPLEMENT
- **Deliverable:** Updated frontmatter in five SKILL.md files: `.claude/skills/tool-process-audit/SKILL.md`, `.claude/skills/tools-bos-design-page/SKILL.md`, `.claude/skills/tools-ui-contrast-sweep/SKILL.md`, `.claude/skills/tools-web-breakpoint/SKILL.md`, `.claude/skills/frontend-design/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** In-place edits to five existing SKILL.md files
- **Reviewer:** None required
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None: verified by factcheck in TASK-05
- **Affects:** `.claude/skills/tool-process-audit/SKILL.md`, `.claude/skills/tools-bos-design-page/SKILL.md`, `.claude/skills/tools-ui-contrast-sweep/SKILL.md`, `.claude/skills/tools-web-breakpoint/SKILL.md`, `.claude/skills/frontend-design/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 90% — files are identified; current frontmatter is known; changes are strictly additive (new fields only, no removals)
  - Approach: 90% — frontmatter field additions are inert to Claude Code auto-discovery (only `name` and `description` are consumed by the platform)
  - Impact: 80% — adds required metadata; impact is realized when TASK-02 index is also complete
  - Held-back test (Impact at 80): "What if Claude Code mis-parses the new frontmatter fields?" — Claude Code reads SKILL.md as YAML frontmatter; additional fields are inert; they do not affect skill loading or invocation. No single unknown drops Impact below 80. Held-back test passes.
- **Acceptance:**
  - All five SKILL.md files have `operating_mode` in frontmatter (add where missing: `tools-bos-design-page`, `frontend-design/tools-ui-frontend-design`)
  - All five SKILL.md files have `trigger_conditions` in frontmatter (add to all five — currently none have it)
  - All five SKILL.md files have `related_skills` in frontmatter (add to all five — currently none have it)
  - No existing frontmatter fields removed or modified
  - No existing body content removed or modified
- **Validation contract (VC-03):**
  - VC-01: Each SKILL.md has `operating_mode`, `trigger_conditions`, `related_skills` in frontmatter -> verified by lp-do-factcheck reading each file
  - VC-02: Existing `name`, `description`, and body content unchanged -> verified by comparing to pre-task git diff
- **Execution plan:**
  - Red evidence plan: Current frontmatter is documented in fact-find; missing fields confirmed by direct read
  - Green evidence plan: For each file: read current frontmatter, add missing fields after existing fields, derive values from the skill's own body content and the standard from TASK-01
  - Refactor evidence plan: Verify no body content was accidentally modified by checking git diff for each file
- **Planning validation:**
  - Checks run: All five SKILL.md files read in fact-find phase; their current frontmatter states are documented in fact-find Entry Points
  - Validation artifacts: fact-find.md Entry Points section confirms current state
  - Unexpected findings: None
- **Scouts:**
  - For each SKILL.md, derive `trigger_conditions` from the first paragraph of the body (each skill describes its trigger in natural language) and `related_skills` from the "Relationship to Other Skills" section where present (else from the body's self-description of adjacent skills).
- **Edge Cases & Hardening:**
  - Edge case: the `trigger_conditions` value for a skill is ambiguous or long. Keep to 5-8 keywords max; do not copy prose.
  - Edge case: `tools-bos-design-page` has no "Relationship to Other Skills" section. Derive `related_skills` from the body description; mark as `lp-design-system, tools-ui-frontend-design` based on the skill's own cross-references.
- **What would make this >=90%:**
  - Operator review of `trigger_conditions` values for each skill to confirm they match real invocation patterns
- **Rollout / rollback:**
  - Rollout: Edit five files; all changes are additive
  - Rollback: `git revert`; platform auto-discovery unaffected
- **Documentation impact:**
  - Modifies five existing SKILL.md files (frontmatter additions only)
- **Notes / references:**
  - Current frontmatter states confirmed from fact-find:
    - `tool-process-audit`: has `name`, `description`, `operating_mode` — add `trigger_conditions`, `related_skills`
    - `tools-bos-design-page`: has `name`, `description` — add `operating_mode`, `trigger_conditions`, `related_skills`
    - `tools-ui-contrast-sweep`: has `name`, `description`, `operating_mode` — add `trigger_conditions`, `related_skills`
    - `tools-web-breakpoint`: has `name`, `description`, `operating_mode` — add `trigger_conditions`, `related_skills`
    - `frontend-design`: has `name`, `description` — add `operating_mode`, `trigger_conditions`, `related_skills`
- **Build evidence (2026-02-27):**
  - Red: Confirmed from fact-find that no SKILL.md had `trigger_conditions` or `related_skills`; two files lacked `operating_mode`.
  - Green: All five files edited with additive frontmatter fields only. `tool-process-audit`: added `trigger_conditions`, `related_skills`. `tools-bos-design-page`: added `operating_mode`, `trigger_conditions`, `related_skills`. `tools-ui-contrast-sweep`: added `trigger_conditions`, `related_skills`. `tools-web-breakpoint`: added `trigger_conditions`, `related_skills`. `frontend-design`: added `operating_mode`, `trigger_conditions`, `related_skills`.
  - Refactor: git diff for commit 43b5960383 shows only `+` lines (no `-` lines) in SKILL.md files — no existing content modified.
  - VC-01: PASS (all five files have operating_mode, trigger_conditions, related_skills — confirmed by grep)
  - VC-02: PASS (git diff shows 0 deletions in SKILL.md files; only additions)

---

### TASK-04: Update AGENTS.md — add missing skills and index pointer

- **Type:** IMPLEMENT
- **Deliverable:** Updated `AGENTS.md` — three new skill entries in the Available Skills section; one new pointer line to `tools-index.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `/Users/petercowling/base-shop/AGENTS.md`
- **Reviewer:** None required
- **Approval-Evidence:** None required
- **Measurement-Readiness:** None: verified by factcheck in TASK-05
- **Affects:** `AGENTS.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — AGENTS.md format is well-established; three specific entries to add are known; insertion location is clear
  - Approach: 90% — one-liner format is the established pattern; no new section headers needed
  - Impact: 85% — directly makes three previously-invisible skills discoverable; the index pointer multiplies this by pointing agents to full detail
- **Acceptance:**
  - `tool-process-audit` entry present in AGENTS.md Available Skills list: `` - `tool-process-audit`: Diagnose a business or engineering process for bottlenecks... (file: `.claude/skills/tool-process-audit/SKILL.md`) ``
  - `tools-ui-contrast-sweep` entry present
  - `tools-ui-breakpoint-sweep` entry present with correct directory path `tools-web-breakpoint/SKILL.md`
  - One-line pointer added near the top of the Available Skills section: `For diagnostic and utility tool skills, see the index at `.claude/skills/tools-index.md`.`
  - No existing AGENTS.md entries removed or modified
  - Existing `tools-bos-design-page` and `tools-ui-frontend-design` entries unchanged
- **Validation contract (VC-04):**
  - VC-01: Three new entries present -> verified by grep for `tool-process-audit`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` in AGENTS.md
  - VC-02: Index pointer present -> verified by grep for `tools-index.md` in AGENTS.md
  - VC-03: No existing entries removed -> verified by checking existing two tool-skill entries still present
- **Execution plan:**
  - Red evidence plan: Current AGENTS.md does not list `tool-process-audit`, `tools-ui-contrast-sweep`, or `tools-ui-breakpoint-sweep` — confirmed in fact-find
  - Green evidence plan: Read current AGENTS.md, identify insertion point (alphabetical within the `t` section or grouped with other `tools-*` entries), insert three new one-liner entries plus index pointer
  - Refactor evidence plan: Verify existing entries are intact; confirm no accidental whitespace corruption in the skills list
- **Planning validation:**
  - Checks run: Read AGENTS.md lines 122–189 in fact-find phase; confirmed exact current state
  - Validation artifacts: fact-find Key Modules section
  - Unexpected findings: None
- **Scouts:** None: insertion location and content are determined
- **Edge Cases & Hardening:**
  - Edge case: the AGENTS.md skills list is alphabetically ordered. Confirm the correct insertion position for `tool-process-audit` (between `startup-loop` and `tools-bos-design-page`) and for `tools-ui-contrast-sweep` and `tools-ui-breakpoint-sweep` (near other `tools-*` entries).
  - Edge case: the index pointer line position. Place it immediately after the introductory paragraph "Skills live in `.claude/skills/<name>/SKILL.md`..." so it is seen before the list, not buried at the bottom.
- **What would make this >=90%:**
  - Operator confirmation that the pointer line placement and wording are appropriate
- **Rollout / rollback:**
  - Rollout: Edit AGENTS.md; additive changes only
  - Rollback: `git revert`
- **Documentation impact:**
  - Modifies `AGENTS.md` — adds three skill entries and one pointer line
- **Notes / references:**
  - The `tools-ui-breakpoint-sweep` entry must use the invocation name (from SKILL.md `name` field), not the directory name (`tools-web-breakpoint`). File path in the entry points to the actual directory: `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Build evidence (2026-02-27):**
  - Red: Confirmed from fact-find that `tool-process-audit`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` were absent from AGENTS.md.
  - Green: Three new entries added near existing `tools-*` entries (lines 181-184 in AGENTS.md). Index pointer added at line 118 (immediately after the "Skills live in..." paragraph). Canonical invocation names used for both mismatched skills.
  - Refactor: grep confirms all five tool skills present; `tools-ui-frontend-design` (line 137) and `tools-bos-design-page` (line 182) entries unchanged.
  - VC-01: PASS (`tool-process-audit`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep` all present in AGENTS.md)
  - VC-02: PASS (`tools-index.md` pointer present at line 118)
  - VC-03: PASS (`tools-bos-design-page` line 182 and `tools-ui-frontend-design` line 137 both confirmed unchanged)

---

### TASK-05: Checkpoint — factcheck compliance verification

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `lp-do-factcheck` run; any corrections applied before plan is marked complete
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/plans/tool-skill-discovery-protocol/plan.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined; lp-do-factcheck is an established skill
  - Approach: 95% — factcheck against plan acceptance criteria is the correct verification method for documentation changes
  - Impact: 95% — closes the verification loop; prevents silent compliance failures
- **Acceptance:**
  - `lp-do-factcheck` run against this plan's acceptance criteria
  - All five SKILL.md files verified to have `name`, `description`, `operating_mode`, `trigger_conditions`, `related_skills` in frontmatter
  - `.claude/skills/tools-index.md` verified to contain five entries with all required fields
  - `AGENTS.md` verified to list all five tool skills and contain index pointer
  - `.claude/skills/tools-standard.md` verified to contain all required sections
  - Any factcheck failures addressed before marking plan Complete
- **Horizon assumptions to validate:**
  - All five SKILL.md files were successfully edited without body content corruption
  - AGENTS.md skill entries use canonical invocation names (not directory names) for the two mismatched skills
- **Validation contract:** lp-do-factcheck output shows all checks passing
- **Planning validation:** None: this task is itself the validation step
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Updates plan.md task statuses based on factcheck results
- **Build evidence (2026-02-27):**
  - Audit anchor: commit `43b5960383` (Wave 2 commit); HEAD at time of factcheck was `75cab2add3` (unrelated commit by another agent).
  - AC-01 (tools-standard.md): PASS — file exists at 84 lines, all required sections present (naming, frontmatter spec, operating_mode vocabulary, classification criteria, invocation/directory rule, How to create).
  - AC-02 (tools-index.md): PASS — file exists at 62 lines (<100), five entries each with six required fields; mismatch entries show both directory and invocation name; update note present in header.
  - AC-03 (SKILL.md frontmatter): PASS — all five files confirmed to have name, description, operating_mode, trigger_conditions, related_skills; no existing fields or body content modified (git diff shows additions only).
  - AC-04 (AGENTS.md five entries): PASS — all five tool skills listed: tool-process-audit (line 181), tools-bos-design-page (line 182), tools-ui-breakpoint-sweep (line 183), tools-ui-contrast-sweep (line 184), tools-ui-frontend-design (line 137).
  - AC-05 (AGENTS.md index pointer): PASS — pointer at line 118 immediately after "Skills live in..." paragraph.
  - Horizon assumption (invocation names): PASS — tools-ui-breakpoint-sweep uses canonical invocation name, not directory name tools-web-breakpoint.
  - Horizon assumption (body content): PASS — git diff confirms 0 deletions in SKILL.md files.
  - No corrections required; plan marked Complete.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Write tools-standard.md | Yes — no dependencies; all content determined from fact-find | None | No |
| TASK-02: Create tools-index.md | Yes — TASK-01 defines format; five skills' identities confirmed | None | No |
| TASK-03: Backfill SKILL.md frontmatter | Yes — TASK-01 defines required fields; five files identified and read | None | No |
| TASK-04: Update AGENTS.md | Yes — TASK-01 confirms convention; three missing entries identified; insertion format established | None | No |
| TASK-05: Checkpoint factcheck | Yes — TASK-02, TASK-03, TASK-04 must complete first; lp-do-factcheck is available | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AGENTS.md entry uses directory name instead of invocation name for mismatched skills | Low | Moderate | TASK-04 acceptance criteria explicitly requires canonical invocation names; factcheck in TASK-05 verifies |
| tools-index.md drifts out of sync as new skills are added | Medium | Low | tools-standard.md "How to create a new tool skill" section requires index update; noted in both files |
| Frontmatter additions corrupt existing SKILL.md body content | Very Low | Low | Execution plan requires reading each file before editing; git diff check in refactor step |
| tools-standard.md grows too long and itself requires a directory scan to read | Low | Low | Acceptance criterion: file must be under 200 lines |

## Observability

- Logging: None: documentation changes have no runtime logging
- Metrics: None
- Alerts/Dashboards: None: lp-do-factcheck is the verification mechanism

## Acceptance Criteria (overall)

- [x] `.claude/skills/tools-standard.md` exists with all required sections
- [x] `.claude/skills/tools-index.md` exists with five entries, all required fields per entry
- [x] All five SKILL.md files have `name`, `description`, `operating_mode`, `trigger_conditions`, `related_skills` in frontmatter
- [x] AGENTS.md lists all five tool skills (five entries total, including the three newly added)
- [x] AGENTS.md contains a pointer to `tools-index.md`
- [x] lp-do-factcheck run confirms all above criteria pass

## Decision Log

- 2026-02-27: Chosen approach is Option B (separate standard + index files) for progressive loading; index stays compact, standard can be detailed
- 2026-02-27: `tool-process-audit` directory rename deferred as default assumption (fact-find open question unresolved). Plan proceeds with no-rename path. Operator may override before TASK-05 runs.
- 2026-02-27: `trigger_conditions` and `related_skills` added as required frontmatter fields based on fact-find analysis; `example_invocation` not added (too verbose for frontmatter; invocation is obvious from skill body)
- 2026-02-27: Index pointer placement in AGENTS.md: immediately after the "Skills live in `.claude/skills/<name>/SKILL.md`..." paragraph, before the skill list begins

## Overall-confidence Calculation

All tasks are S effort (weight=1). Confidence = min(Implementation, Approach, Impact) per task:
- TASK-01: min(90, 90, 85) = 85
- TASK-02: min(90, 90, 85) = 85
- TASK-03: min(90, 90, 80) = 80
- TASK-04: min(90, 90, 85) = 85
- TASK-05: 95 (procedural, excluded from weighted average per confidence-scoring-rules.md which notes CHECKPOINT is procedural with no numeric threshold gate)

Weighted average (excluding CHECKPOINT): (85 + 85 + 80 + 85) / 4 = 83.75 → nearest multiples-of-5 are 80 and 85.

Per the scoring rules at `.claude/skills/_shared/confidence-scoring-rules.md`: express scores in multiples of 5 only; when uncertain between adjacent scores, assign the lower. 83.75 is numerically closer to 85 than to 80 (difference of 1.25 vs 3.75), so the correct rounding is **85%** without invoking the downward bias rule. **Overall-confidence: 85%**.
