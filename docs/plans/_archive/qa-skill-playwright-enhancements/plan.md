---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: qa-skill-playwright-enhancements
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# QA Skill Playwright Enhancements Plan

## Summary

Adopt six QA methodology patterns from OpenAI's playwright-interactive skill into this repo's two primary browser QA skills. Changes are additive markdown edits to three files: `tools-web-breakpoint/SKILL.md`, `tools-web-breakpoint/modules/report-template.md`, and `meta-user-test/SKILL.md`. The script-name typo in `meta-user-test/SKILL.md` (`run-meta-user-test.mjs` → `run-user-testing-audit.mjs`) is fixed as part of TASK-03. All three tasks are independent and can execute in parallel.

## Active tasks

- [x] TASK-01: Update tools-web-breakpoint SKILL.md with all six patterns — Complete (2026-03-06)
- [x] TASK-02: Update tools-web-breakpoint report-template.md with matching sections — Complete (2026-03-06)
- [x] TASK-03: Update meta-user-test SKILL.md with applicable patterns + script name fix — Complete (2026-03-06)

## Goals

- Add pre-test QA inventory (3-source + 2+ exploratory scenarios) to both skills.
- Add per-region `getBoundingClientRect` viewport fit checks to `tools-web-breakpoint`.
- Split `tools-web-breakpoint` workflow into named functional and visual QA passes.
- Add `isMobile: true, hasTouch: true` mobile context instruction for breakpoints ≤480px.
- Add negative confirmation requirement at signoff to both skills.
- Add exploratory pass requirement to both skills.
- Fix pre-existing script-name inconsistency in `meta-user-test/SKILL.md`.

## Non-goals

- Modifying `run-user-testing-audit.mjs` or any other Node.js script.
- Modifying `meta-user-test/references/report-template.md` (not wired to script or skill).
- Changes to Playwright configuration, CI, or test infrastructure.
- Creating new skill files.

## Constraints & Assumptions

- Constraints:
  - All changes are additive — no existing skill sections removed or reordered.
  - Formatting must be consistent with existing file conventions.
  - QA inventory step must be framed as a gate ("do not start until written").
  - `meta-user-test` negative confirmation is agent-generated Step 8 text, not script-generated.
- Assumptions:
  - Skill file edits take effect immediately on next invocation (no build/deploy step).
  - All target files confirmed as read during fact-find; content is known.

## Inherited Outcome Contract

- **Why:** OpenAI's playwright-interactive skill contains structured QA methodology that our skills lack. Adopting it raises signoff quality and makes QA findings more reliable and consistent across runs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All six playwright-interactive patterns are integrated into tools-web-breakpoint and meta-user-test skill files so that future QA runs automatically apply structured pre-test inventory, per-region viewport fit checks, functional/visual pass separation, proper mobile context flags, negative confirmation at signoff, and a mandatory exploratory pass.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/qa-skill-playwright-enhancements/fact-find.md`
- Key findings used:
  - `tools-web-breakpoint` §2 conflates functional interaction and visual screenshot steps into one phase — split required.
  - `tools-web-breakpoint` §4 heuristics are page-level only; per-region `getBoundingClientRect` check absent.
  - `tools-web-breakpoint` mobile breakpoints set viewport only; `isMobile`/`hasTouch` not instructed.
  - `meta-user-test` already uses `devices["iPhone 13"]` for mobile context — no script change needed.
  - `meta-user-test/references/report-template.md` not wired — excluded from scope.
  - `meta-user-test/SKILL.md` Step 3 references non-existent `run-meta-user-test.mjs`; actual script is `run-user-testing-audit.mjs`.

## Proposed Approach

- Option A: Edit all three files in a single wave (parallel execution). No ordering dependency between files — each is a self-contained markdown document.
- Option B: Sequential edits (SKILL.md first, then report template).
- **Chosen approach:** Option A — all three tasks in parallel Wave 1. TASK-01 and TASK-02 are contract-coupled (TASK-02 sections mirror TASK-01's new SKILL.md workflow structure) but physically independent — parallel execution is safe and a race condition between them cannot occur. TASK-03 has no coupling to TASK-01 or TASK-02.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update tools-web-breakpoint SKILL.md | 90% | S | Pending | - | - |
| TASK-02 | IMPLEMENT | Update tools-web-breakpoint report-template.md | 90% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | Update meta-user-test SKILL.md + fix script name | 90% | S | Pending | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | Parallel. TASK-01 and TASK-02 are contract-coupled (template mirrors SKILL.md structure) but physically independent — safe to execute concurrently |

## Tasks

---

### TASK-01: Update tools-web-breakpoint SKILL.md with all six patterns

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — file fully read; edit locations are known; changes are additive markdown prose.
  - Approach: 95% — all six patterns from source material are fully understood and mapped to specific workflow sections.
  - Impact: 90% — every future breakpoint sweep invocation adopts the improved methodology; risk of agent skipping steps is mitigated by gate framing.

**Acceptance:**

- QA inventory step is present before §1 (Intake and Sweep Plan) and is gated ("do not start sweep until inventory is written"). Inventory sources are: user requirements, features being tested, claims to sign off.
- Inventory requires ≥2 exploratory/off-happy-path scenarios.
- §2 (Execute Breakpoint Matrix) is split into named **Functional QA Pass** and **Visual QA Pass** sub-sections. Rule that `evaluate()` calls do not count as functional signoff is stated.
- Per-region viewport fit check is added to the detection heuristics: for critical regions (nav, primary CTA, modal close, form submit), `getBoundingClientRect()` is required before signoff. Document-level scroll metrics alone are not sufficient.
- Mobile breakpoints (≤480px) include instruction to set `isMobile: true, hasTouch: true` in the browser context, in addition to the viewport size.
- Exploratory pass step is present after scripted checks: ~30–90s of unscripted interaction; any new state or issue found updates the QA inventory.
- §7 completion message requires naming which defect classes (A–E taxonomy) were checked and not found.
- No existing sections removed or reordered.

**Validation contract:**

- TC-01: QA inventory section appears before §1 with gate language and 3-source list → PASS
- TC-02: Functional and Visual QA are named separate sub-phases within §2 → PASS
- TC-03: `getBoundingClientRect` per critical region is explicit in §4 detection heuristics → PASS
- TC-04: `isMobile: true, hasTouch: true` instruction appears for ≤480px breakpoints → PASS
- TC-05: Exploratory pass step present after scripted checks → PASS
- TC-06: §7 completion message includes defect class checklist → PASS
- TC-07: All existing §1–§7 content preserved, no removals → PASS

**Execution plan:** Read current SKILL.md → add QA Inventory step at top of Workflow → split §2 into Functional/Visual passes → augment §4 with per-region check → add isMobile/hasTouch note to §2 mobile breakpoint handling → add Exploratory Pass step → update §7 completion message → verify no existing content was removed.

**Planning validation:** File fully read during fact-find; line-level structure understood. All 7 workflow sections mapped.

**Scouts:** None: all content and edit locations are confirmed from fact-find evidence.

**Edge Cases & Hardening:**

- If the existing §2 "Execute Breakpoint Matrix" step is long, split point should be introduced as a heading level (### Functional QA Pass / ### Visual QA Pass) without adding new numbered steps that would break the §1-§7 numbering.
- The `isMobile`/`hasTouch` instruction must be mechanism-agnostic: "configure the browser context with `isMobile: true, hasTouch: true`" rather than specifying MCP tool syntax, since executor resolves at runtime.

**What would make this >=90%:** Already at 90%. Would reach 95% only with confirmed round-trip: run skill after edit and verify output. That's post-delivery verification, not a planning gap.

**Rollout / rollback:**
- Rollout: Edit takes effect on next skill invocation — no deploy needed.
- Rollback: `git revert` or manual revert of SKILL.md to prior content.

**Documentation impact:** This IS the documentation — SKILL.md is the skill definition.

---

### TASK-02: Update tools-web-breakpoint report-template.md with matching sections

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-web-breakpoint/modules/report-template.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `.claude/skills/tools-web-breakpoint/modules/report-template.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — file fully read; template structure is clear; additions are known sections.
  - Approach: 95% — sections to add directly mirror the new SKILL.md steps from TASK-01.
  - Impact: 90% — report template shapes what gets written to the audit artifact on every run; missing sections would leave evidence gaps even if SKILL.md steps are followed.

**Acceptance:**

- `## QA Inventory` section added near the top of the report template (after `## Scope`), with fields for: 3-source inventory checklist, exploratory scenarios list.
- `## Functional QA Pass` section added with sub-fields: controls tested, end-to-end flow verified, cycle test for reversible controls.
- `## Visual QA Pass` section added with sub-fields: regions inspected, in-transition states checked, aesthetic judgment note.
- `## Negative Confirmation` section added before or after `## Suggested Fix Order`, with a checklist of defect classes (A: viewport overflow, B: container overflow, C: reflow, D: fixed layers, E: density stress) each with a checkbox for "checked and not found."
- All existing sections (Scope, Summary Matrix, Issues, Assumptions, Suggested Fix Order) preserved.

**Validation contract:**

- TC-01: `## QA Inventory` present with 3-source list and exploratory scenario fields → PASS
- TC-02: `## Functional QA Pass` and `## Visual QA Pass` sections present → PASS
- TC-03: `## Negative Confirmation` section present with defect class A–E checklist → PASS
- TC-04: All existing template sections preserved → PASS

**Execution plan:** Read current report-template.md → insert `## QA Inventory` after `## Scope` block → insert `## Functional QA Pass` and `## Visual QA Pass` after `## Issues` → insert `## Negative Confirmation` before `## Suggested Fix Order` → verify existing sections intact.

**Planning validation:** File fully read during fact-find. Exact structure known (8 sections total).

**Scouts:** None: file confirmed read; content fully known.

**Edge Cases & Hardening:**

- The template is embedded in a markdown code block in the report-template.md. Additions must be inside the `` ```markdown ``` `` fence, not outside it.

**What would make this >=90%:** Already at 90%. Confirmed by running a sweep after changes and reviewing output artifact structure.

**Rollout / rollback:**
- Rollout: Immediate on next skill invocation.
- Rollback: `git revert` or manual revert.

**Documentation impact:** This IS the documentation artifact.

---

### TASK-03: Update meta-user-test SKILL.md with applicable patterns and fix script name

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/meta-user-test/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `.claude/skills/meta-user-test/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — file fully read; three edit locations identified (Step 3 script name, pre-Layer-A inventory step, Step 5 exploratory pass, Step 8 negative confirmation).
  - Approach: 95% — applicable patterns for meta-user-test are a subset of the six: QA inventory (pre-Layer A), exploratory pass (within Step 5 manual validation), negative confirmation (Step 8 agent summary). isMobile/hasTouch already correct; functional/visual separation not applicable to automated script runs.
  - Impact: 90% — fixes broken script reference (Step 3), adds missing pre-test structure, ensures negative confirmation appears in every meta-user-test run summary.

**Acceptance:**

- Step 3 script name corrected: `run-meta-user-test.mjs` → `run-user-testing-audit.mjs`.
- QA inventory step added before Step 2 (Layer A crawl), with: 3-source list (operator requirements, features/flows being tested, claims to make in final response), ≥2 exploratory/off-happy-path scenarios to cover in Layer B.
- Exploratory pass sub-step added inside Step 5 ("Validate critical findings manually"): after targeted repro checks, perform ~30–90s of free-form navigation on the live site covering any user journey not in the scripted checks; update the QA inventory if new issues are discovered.
- Step 8 ("Return concise summary") updated with negative confirmation field: explicitly state which issue categories (broken links/images, JS-on hydration failures, mobile menu state, horizontal overflow, contrast failures, booking CTA failures) were checked and not found.
- No existing steps removed or reordered.

**Validation contract:**

- TC-01: Step 3 references `run-user-testing-audit.mjs` (not the old name) → PASS
- TC-02: QA inventory step present before Step 2 (Layer A) → PASS
- TC-03: Exploratory pass sub-step present inside Step 5 → PASS
- TC-04: Step 8 summary includes negative confirmation field → PASS
- TC-05: All existing 8 steps preserved with content intact → PASS

**Execution plan:** Read current SKILL.md → fix script name in Step 3 → add QA inventory as a **pre-step sub-section** immediately before the numbered steps (label: "### Step 0: Write QA Inventory (Required Gate)" or equivalent heading, keeping existing step numbers intact) → add exploratory sub-step inside existing Step 5 manual validation → update Step 8 return summary to include negative confirmation → verify all existing content preserved. Do NOT renumber existing steps.

**Planning validation:** File fully read during fact-find. 8 steps confirmed. Script name discrepancy confirmed by Glob of scripts/ directory.

**Scouts:** None: file confirmed read; pre-existing inconsistency (script name) confirmed.

**Edge Cases & Hardening:**

- Inserting a QA inventory step may shift step numbers (Step 1 → Step 2, etc.). Prefer inserting as a **pre-step** labeled "Step 0" or adding as a subsection of the existing "## Workflow" header, not renumbering all steps. Renumbering risks breaking any external references.
- The `run-user-testing-audit.mjs` fix applies to Step 3 only — verify that no other occurrence of the old script name exists in the file.

**What would make this >=90%:** Already at 90%. Confirmed by running meta-user-test skill on next deploy and reviewing chat summary for negative confirmation field.

**Rollout / rollback:**
- Rollout: Immediate on next skill invocation.
- Rollback: `git revert` or manual revert.

**Documentation impact:** This IS the documentation artifact.

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update tools-web-breakpoint SKILL.md | Yes — file read, all edit locations known | None | No |
| TASK-02: Update report-template.md | Yes — file read, template structure known; edit locations inside markdown fence | None | No |
| TASK-03: Update meta-user-test SKILL.md | Yes — file read, script name discrepancy confirmed, 4 edit locations known | None | No |
| Wave 1 parallel execution | Yes — all 3 tasks are independent file edits with no shared state | None | No |

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Agent adds new step numbering that breaks existing references | Low | Use sub-sections or "Step 0" framing for QA inventory; avoid renumbering |
| `isMobile`/`hasTouch` instruction in TASK-01 uses MCP-specific syntax that doesn't generalize | Low | Keep instruction mechanism-agnostic (prose, not tool-specific code) |
| Report template additions appear outside the markdown fence in report-template.md | Low | Edge case noted in TASK-02; executor must check fence boundaries |
| Second occurrence of old script name in meta-user-test SKILL.md missed | Low | Executor must search entire file, not just Step 3 |

## Observability

- Logging: None: skill files are markdown prose.
- Metrics: None: skill files are markdown prose.
- Alerts/Dashboards: None: skill files are markdown prose.

## Acceptance Criteria (overall)

- [ ] `tools-web-breakpoint/SKILL.md` contains all six patterns as gated workflow steps.
- [ ] `tools-web-breakpoint/modules/report-template.md` contains QA Inventory, Functional/Visual Pass, and Negative Confirmation sections inside the markdown fence.
- [ ] `meta-user-test/SKILL.md` Step 3 references `run-user-testing-audit.mjs`.
- [ ] `meta-user-test/SKILL.md` has QA inventory before Layer A, exploratory pass in Step 5, and negative confirmation in Step 8.
- [ ] All existing content in all three files preserved (no removals or reorderings).

## Decision Log

- 2026-03-06: Excluded `meta-user-test/references/report-template.md` from scope after codemoot Round 1 confirmed it is not wired to the script or skill workflow. Negative confirmation for meta-user-test routed to SKILL.md Step 8 (agent-generated summary) instead.
- 2026-03-06: Added script-name typo fix (`run-meta-user-test.mjs` → `run-user-testing-audit.mjs`) as in-scope change to TASK-03 — opportunistic fix since SKILL.md is being edited anyway.
- 2026-03-06: Chose parallel Wave 1 for all three tasks — no ordering dependency between independent markdown files.

## Overall-confidence Calculation

- TASK-01: 90% × S(1) = 90
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × S(1) = 90
- Overall-confidence = (90 + 90 + 90) / 3 = **90%**
