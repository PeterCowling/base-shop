---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ui-design-tool-chain-corrections
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# UI Design Tool Chain Corrections Plan

## Summary

Six targeted corrections to the UI design pipeline SKILL.md files, derived from a
fact-checked review of the pipeline established in `ui-design-tool-chain-pipeline`.
Changes address four categories of confirmed inaccuracy: a GATE-BD-07 hard-block that
prevents base-system businesses from running `lp-design-spec`; stale token names in
the `lp-design-spec` template; missing re-run instructions in `lp-design-qa` and both
sweep tools; and label imprecision in the pipeline ordering. All tasks are bounded,
documentation-only markdown edits to SKILL.md files. No application code changes.

## Active tasks

- [x] TASK-01: lp-design-spec — base-system exception, token fixes, QA-Matrix block
- [x] TASK-02: lp-design-qa — re-run instruction + Integration upstream update
- [x] TASK-03: tools-ui-contrast-sweep — re-run instruction
- [x] TASK-04: tools-web-breakpoint — re-run instruction
- [x] TASK-05: frontend-design — label hardcoded business table as non-authoritative
- [x] TASK-06: tools-refactor — make S9D label explicitly conditional

## Goals

- GATE-BD-07 in `lp-design-spec` no longer blocks base-system businesses (PLAT, BOS, PIPE, XA)
- Utility class names in `lp-design-spec` template resolve from CSS variables in this repo's token files (`bg-bg`, `text-fg`, `bg-[hsl(var(--surface-2))]`)
- `lp-design-spec` template includes a QA-Matrix output block for downstream `lp-design-qa` use
- All three QA skills (`lp-design-qa`, `tools-ui-contrast-sweep`, `tools-ui-breakpoint-sweep`) instruct agents to re-run after `lp-do-build` fixes
- `frontend-design` Step 1 hardcoded table is labelled non-authoritative relative to `businesses.json`
- `tools-refactor` S9D label reflects its conditional nature (only runs when entry criteria are met)

## Non-goals

- Changes to application code or Tailwind config
- Changes to `tools-design-system` (correct)
- Changes to `lp-do-plan/modules/plan-code.md` Design Gate (correct as-is)
- Adding new skills or new pipeline stages
- Fixing the `lp-responsive-qa-skill` gap (deferred — under-construction per pipeline docs)

## Constraints & Assumptions

- Constraints:
  - All changes are to SKILL.md files only — no application code
  - Utility class names used in the template must resolve from CSS variables that exist in `packages/themes/base/src/tokens.ts` (e.g. `bg-bg` resolves `--color-bg`); do not use shadcn/ui names absent from this repo's token files
  - Base-system exception must mirror the existing exception already in `frontend-design` Step 1
- Assumptions:
  - `bg-bg`, `text-fg`, `bg-[hsl(var(--surface-2))]` are confirmed correct from fact-check of `packages/themes/base/src/tokens.ts` conducted in the prior session
  - The hardcoded business table in `frontend-design` Step 1 is consistent with `businesses.json` as of today — the problem is staleness risk, not current inaccuracy

## Inherited Outcome Contract

- **Why:** Agents running `lp-design-spec` for PLAT/BOS/PIPE/XA hard-block on a gate intended only for brand-identity businesses; template token names do not match the actual repo design system; QA tools lack a re-run loop instruction, meaning fixes are not validated before routing to the next stage.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `lp-design-spec` passes for base-system businesses; template tokens are correct; three QA SKILL.md files instruct re-run after fixes; pipeline stage labels are accurate.
- **Source:** operator

## Fact-Find Reference

- Related brief: No formal fact-find.md — investigation conducted inline via fact-check
  analysis in session `2026-02-27` against actual SKILL.md files and `packages/themes/base/src/tokens.ts`.
- Key findings used:
  - GATE-BD-07 hard-blocks for PLAT/BOS/PIPE/XA; `frontend-design` already has the exception
  - Template uses `bg-background`, `bg-card`, `text-foreground` — none exist in this repo's token system
  - No re-run instruction exists in any of the three QA SKILL.md files after `lp-do-build` fixes
  - S9D in `tools-refactor` says "Refactor" with no conditional qualifier despite having Entry Criteria
  - `frontend-design` Step 1 table is a fixed list that bypasses the instruction to read `businesses.json`

## Proposed Approach

- Option A: One task per SKILL.md file — group all changes to a given file together
- Chosen approach: Option A — grouping by file keeps each task's `Affects` list clean and
  avoids partial file edits being independently validated. `lp-design-spec` has 6 changes (3 original + 2 base-system template fields added via Round 1 autofix + 1 QA-Matrix block)
  but they are all in the same file and can be committed atomically.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | lp-design-spec — base-system exception, token fixes, QA-Matrix | 92% | S | Complete (2026-02-27) | - | - |
| TASK-02 | IMPLEMENT | lp-design-qa — re-run instruction + Integration upstream update | 95% | S | Complete (2026-02-27) | - | - |
| TASK-03 | IMPLEMENT | tools-ui-contrast-sweep — re-run instruction | 95% | S | Complete (2026-02-27) | - | - |
| TASK-04 | IMPLEMENT | tools-web-breakpoint — re-run instruction | 95% | S | Complete (2026-02-27) | - | - |
| TASK-05 | IMPLEMENT | frontend-design — label hardcoded table non-authoritative | 93% | S | Complete (2026-02-27) | - | - |
| TASK-06 | IMPLEMENT | tools-refactor — S9D conditional label | 95% | S | Complete (2026-02-27) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | - | All independent — different SKILL.md files, no shared content sections |

## Tasks

---

### TASK-01: lp-design-spec — base-system exception, token fixes, QA-Matrix block

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-design-spec/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/lp-design-spec/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning via "ok let's make those changes"
- **Measurement-Readiness:** None: skill documentation — no metric tracking
- **Affects:** `.claude/skills/lp-design-spec/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 92% — three distinct edits to one file; locations are precisely known from file read; token names confirmed against tokens.ts in prior session. QA-Matrix template block is new prose with no external deps — judgment call on structure.
  - Approach: 95% — mirrors existing exception in `frontend-design` Step 1; no design decision required
  - Impact: 90% — directly unblocks base-system businesses from `lp-design-spec`; token fixes prevent agents from emitting non-existent token class names
- **Acceptance:**
  - `grep -n "bg-background" .claude/skills/lp-design-spec/SKILL.md` → 0 matches
  - `grep -n "bg-card" .claude/skills/lp-design-spec/SKILL.md` → 0 matches (should be replaced with `bg-\[hsl`)
  - `grep -n "text-foreground" .claude/skills/lp-design-spec/SKILL.md` → 0 matches
  - `grep -n "Base-System" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match (exception added)
  - `grep -n "QA Matrix" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match (QA-Matrix block added to template)
- **Validation contract (VC-01):**
  - VC-01: All three stale token names (`bg-background`, `bg-card`, `text-foreground`) absent from file → 0 grep matches each → pass
  - VC-02: Base-system exception present in Step 6 → grep `Base-System` ≥1 match → pass
  - VC-03: QA Matrix section present in template → grep `QA Matrix` ≥1 match → pass
- **Execution plan:** Green (all changes are targeted insertions/replacements; no Red phase required for documentation)
  - **Change 1 — GATE-BD-07 base-system exception:** After the FAIL block in Step 6 (after line ending "Reserve `/lp-assessment-bootstrap <BIZ>` for operating businesses that will have a distinct brand identity."), insert:

    ```
    **Exception — Base-System businesses:** For businesses whose theme resolves to `packages/themes/base/` and which have no customer-facing brand identity (e.g. PLAT, BOS, PIPE, XA), the Brand Dossier gate is waived. Use `packages/themes/base/src/tokens.ts` directly as the design reference. Add a note to the design spec frontmatter: `Brand-Language: None — base theme (no brand dossier for this business)`. To confirm a business is base-system, read `docs/business-os/strategy/businesses.json`.
    ```

  - **Change 2 — Token name fixes in Step 4 example table (lines ~127–129):**
    - Replace `text-foreground` → `text-fg`
    - Replace `bg-card` → `bg-[hsl(var(--surface-2))]`
    - Also fix the row label from "Card surface" to "Card/surface-2 bg" for clarity

  - **Change 3 — Token name fixes in template Token Binding table (line ~252):**
    - Replace `bg-background` → `bg-bg`
    - Replace (if present) any other deprecated shadcn/ui token names: `text-foreground` → `text-fg`
    - Interaction States table: replace `hover:bg-primary-hover` → `hover:bg-primary/90` and `active:bg-primary-active` → `active:bg-primary/80`

  - **Change 4 — QA-Matrix block:** Append new section to the Design Spec Template after `## Notes`, before the closing triple-backtick:

    ```markdown
    ## QA Matrix

    Pre-populate from the Token Binding and Layout sections above.
    `lp-design-qa` uses this table as its expected-state baseline.

    | Element | Expected token / class | QA domain | Check ID |
    |---------|------------------------|-----------|----------|
    | Page bg | `bg-bg` | tokens | TC-01 |
    | Primary CTA | `bg-primary` | tokens + visual | TC-01, VR-02 |
    | Body text | `text-fg` | tokens | TC-01 |
    | Focus ring | `focus-visible:ring-2 ring-primary` | a11y | A11Y-03 |
    | Mobile layout | single-column stack at `< 768px` | responsive | RS-01 |
    | ... | ... | ... | ... |

    *One row per token-bound element or responsive rule. Remove placeholder rows before handoff to plan.*
    ```

  - **Change 5 — Template Brand-Language frontmatter (base-system conditional):** In the Design Spec Template frontmatter block, update:
    ```
    Brand-Language: docs/business-os/strategy/{BIZ}/<YYYY-MM-DD>-brand-identity-dossier.user.md
    ```
    to:
    ```
    Brand-Language: docs/business-os/strategy/{BIZ}/<YYYY-MM-DD>-brand-identity-dossier.user.md | None — base theme
    ```
    (agent fills the appropriate value at spec creation time — `None — base theme` for PLAT/BOS/PIPE/XA)

  - **Change 6 — Template Prerequisites checkbox (base-system conditional):** In the Prerequisites section, update:
    ```
    - [ ] Brand language doc exists: `docs/business-os/strategy/{BIZ}/<YYYY-MM-DD>-brand-identity-dossier.user.md`
    ```
    to:
    ```
    - [ ] Brand language: either Active brand dossier at `docs/business-os/strategy/{BIZ}/<YYYY-MM-DD>-brand-identity-dossier.user.md` OR confirmed base-system business (PLAT/BOS/PIPE/XA) — check `businesses.json`
    ```

- **Scouts:** None — all changes are verifiable from file content and prior token investigation
- **Edge Cases & Hardening:**
  - If `hover:bg-primary-hover` does not appear in the file, skip that replacement (check first with grep before editing)
  - QA-Matrix section must be inside the code-fenced template block, not after it
- **What would make this >=90%:** Already at 92%; the 8% gap is uncertainty about exact line positions for the QA-Matrix insertion (template ends with backticks — must insert before the closing fence)
- **Rollout / rollback:**
  - Rollout: Single commit, documentation-only
  - Rollback: `git revert` the commit
- **Documentation impact:** This IS the documentation change
- **Notes / references:**
  - Fact-check from session: `bg-bg`, `text-fg` confirmed in `packages/themes/base/src/tokens.ts`; `bg-[hsl(var(--surface-2))]` is correct form for surface-2 in Tailwind v3 compat
  - Mirror of exception already in `frontend-design/SKILL.md` Step 1 (lines 88–89)

---

### TASK-02: lp-design-qa — re-run instruction + Integration upstream update

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-design-qa/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/lp-design-qa/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning
- **Measurement-Readiness:** None: skill documentation
- **Affects:** `.claude/skills/lp-design-qa/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — two targeted insertions; exact locations confirmed by file read
  - Approach: 95% — re-run loop is standard QA pattern; Integration upstream addition is additive
  - Impact: 95% — closes gap where design-qa completion message has no instruction to re-run after fixes
- **Acceptance:**
  - `grep -n "re-run" .claude/skills/lp-design-qa/SKILL.md` → ≥1 match in Step 8 section
  - `grep -n "tools-ui-frontend-design" .claude/skills/lp-design-qa/SKILL.md` → ≥1 match in Integration section
- **Validation contract (VC-01):**
  - VC-01: Re-run instruction present in Step 8 → grep `re-run` ≥1 in file → pass
  - VC-02: `tools-ui-frontend-design` referenced in Integration → grep match → pass
- **Execution plan:**
  - **Change 1 — Step 8 re-run instruction:** After the last line of the Step 8 message block (after "If passed: `/lp-launch-qa`..."), add:
    ```
    - If issues found and fixed: **re-run `/lp-design-qa`** to confirm fixes before routing to S9C sweeps. Do not proceed to `tools-ui-contrast-sweep` / `tools-ui-breakpoint-sweep` with unverified fixes.
    ```
  - **Change 2 — Integration upstream:** Change current `- **Upstream:** `/lp-design-spec` (expected visual state); `/lp-do-build` (produces the built UI)` to:
    `- **Upstream:** `/lp-design-spec` (expected visual state); `tools-ui-frontend-design` (executes the S9A UI build via `lp-do-build`); `lp-do-build` (fix cycle after issues found)`
- **Scouts:** None
- **Edge Cases & Hardening:** None: additive changes only, no existing text removed
- **Rollout / rollback:** Single commit; `git revert` to rollback
- **Documentation impact:** This IS the documentation change

---

### TASK-03: tools-ui-contrast-sweep — re-run instruction

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-ui-contrast-sweep/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/tools-ui-contrast-sweep/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning
- **Measurement-Readiness:** None: skill documentation
- **Affects:** `.claude/skills/tools-ui-contrast-sweep/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — single additive insertion in Section 8
  - Approach: 95% — identical pattern to TASK-02 and TASK-04
  - Impact: 95% — closes the fix-validate gap at S9C
- **Acceptance:**
  - `grep -n "re-run" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → ≥1 match in Section 8
- **Validation contract (VC-01):**
  - VC-01: Re-run instruction present in Section 8 → grep `re-run` ≥1 → pass
- **Execution plan:**
  - **Change — Section 8 (Completion Message) re-run instruction:** After the `No contrast or visual-uniformity failures detected...` line, add a bullet:
    ```
    - If issues were found and fixed via `/lp-do-build`: **re-run this sweep** to confirm findings are resolved before routing to `tools-refactor`.
    ```
- **Scouts:** None
- **Edge Cases & Hardening:** Insertion should be inside the Section 8 block, not after the Guardrails section
- **Rollout / rollback:** Single commit; `git revert` to rollback

---

### TASK-04: tools-web-breakpoint — re-run instruction

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/tools-web-breakpoint/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning
- **Measurement-Readiness:** None: skill documentation
- **Affects:** `.claude/skills/tools-web-breakpoint/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — single additive insertion in Section 7
  - Approach: 95% — identical pattern to TASK-03
  - Impact: 95% — closes fix-validate gap at S9C for responsive sweep
- **Acceptance:**
  - `grep -n "re-run" .claude/skills/tools-web-breakpoint/SKILL.md` → ≥1 match in Section 7
- **Validation contract (VC-01):**
  - VC-01: Re-run instruction present in Section 7 → grep `re-run` ≥1 → pass
- **Execution plan:**
  - **Change — Section 7 (Completion Message) re-run instruction:** After the `No responsive layout failures detected...` line, add:
    ```
    - If issues were found and fixed via `/lp-do-build`: **re-run this sweep** to confirm findings are resolved before routing to `tools-refactor`.
    ```
- **Scouts:** None
- **Edge Cases & Hardening:** None: additive only
- **Rollout / rollback:** Single commit; `git revert` to rollback

---

### TASK-05: frontend-design — label hardcoded business table non-authoritative

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/frontend-design/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/frontend-design/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning
- **Measurement-Readiness:** None: skill documentation
- **Affects:** `.claude/skills/frontend-design/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 93%
  - Implementation: 93% — targeted addition of a note above the table; table itself is accurate today so no replacement needed
  - Approach: 90% — two options existed (remove table vs label it); plan chose label because the table provides useful quick-reference context while removing the risk of stale propagation
  - Impact: 93% — prevents agents from treating the table as a live data source; note redirects to `businesses.json` for authoritative lookup
- **Acceptance:**
  - `grep -n "non-authoritative\|businesses.json" .claude/skills/frontend-design/SKILL.md` → ≥2 matches in Step 1 section (the existing "Read `businesses.json`" instruction + new note above table)
  - `grep -n "Quick-reference" .claude/skills/frontend-design/SKILL.md` → ≥1 match (label on the table)
- **Validation contract (VC-01):**
  - VC-01: Table has a non-authoritative label → grep `Quick-reference\|illustrative` ≥1 → pass
- **Execution plan:**
  - **Change — Add note above the hardcoded table in Step 1:** Before the `| Business | Key Apps | Theme |` line, add:
    ```
    **Quick-reference only (may become stale):** The table below is illustrative. Always read `docs/business-os/strategy/businesses.json` for the authoritative app → business → theme mapping.
    ```
- **Scouts:** None
- **Edge Cases & Hardening:** The table itself is currently accurate — do not remove it. The note is an additive safeguard only.
- **Rollout / rollback:** Single commit; `git revert` to rollback

---

### TASK-06: tools-refactor — S9D conditional label

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/tools-refactor/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Artifact-Destination:** `.claude/skills/tools-refactor/SKILL.md` (in-place update)
- **Reviewer:** operator
- **Approval-Evidence:** None: operator-approved at planning
- **Measurement-Readiness:** None: skill documentation
- **Affects:** `.claude/skills/tools-refactor/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — single-line replacement in Integration section; current text confirmed by file read
  - Approach: 95% — Entry Criteria section already exists and is the authoritative gate; label just needs to match
  - Impact: 95% — removes ambiguity about whether S9D is mandatory; prevents unnecessary refactor invocations
- **Acceptance:**
  - `grep -n "Conditional Refactor" .claude/skills/tools-refactor/SKILL.md` → ≥1 match
  - `grep -n "S9D (Refactor)" .claude/skills/tools-refactor/SKILL.md` → 0 matches (old label gone)
- **Validation contract (VC-01):**
  - VC-01: Old label absent → grep `S9D (Refactor)` = 0 matches → pass
  - VC-02: New conditional label present → grep `Conditional Refactor` ≥1 → pass
- **Execution plan:**
  - **Change — Integration section Loop position:** Replace:
    `**Loop position:** S9D (Refactor) — post-sweep QA, pre-merge.`
    With:
    `**Loop position:** S9D (Conditional Refactor) — post-sweep QA, pre-merge. Skip if no QA findings meet the Entry Criteria above.`
- **Scouts:** None
- **Edge Cases & Hardening:** Exact match required — confirm current text before replacing
- **Rollout / rollback:** Single commit; `git revert` to rollback

---

## Simulation Trace

All 6 tasks are targeted markdown edits to standalone SKILL.md files. No runtime dependencies,
no config keys, no API signatures, no TypeScript types, no shared state.

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: lp-design-spec changes | Yes — file read confirmed; token names verified in prior session; exception mirrors `frontend-design` Step 1 exactly | None | No |
| TASK-02: lp-design-qa re-run + Integration | Yes — file read; Step 8 and Integration sections confirmed | None | No |
| TASK-03: contrast-sweep re-run | Yes — file read; Section 8 Completion Message confirmed | None | No |
| TASK-04: breakpoint-sweep re-run | Yes — file read; Section 7 Completion Message confirmed | None | No |
| TASK-05: frontend-design table label | Yes — file read; table location confirmed; table content is currently accurate | None | No |
| TASK-06: tools-refactor S9D label | Yes — file read; exact current text `S9D (Refactor)` confirmed by grep | None | No |

No Critical simulation issues. Auto-build eligible.

## Risks & Mitigations

- Risk: QA-Matrix section insertion in TASK-01 placed outside the fenced template block
  - Mitigation: Execution plan requires insertion before the closing ` ``` ` of the template; verify with grep after edit
- Risk: TASK-05 note added after the table instead of before
  - Mitigation: Execution plan explicitly states "Before the `| Business | Key Apps | Theme |` line"

## Observability

- None: documentation-only plan; no runtime metrics

## Acceptance Criteria (overall)

- [ ] `grep "bg-background\|bg-card\|text-foreground" .claude/skills/lp-design-spec/SKILL.md` → 0 matches
- [ ] `grep "Base-System" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match
- [ ] `grep "None — base theme" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match (Change 5 — template Brand-Language)
- [ ] `grep "confirmed base-system" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match (Change 6 — prerequisite conditional)
- [ ] `grep "QA Matrix" .claude/skills/lp-design-spec/SKILL.md` → ≥1 match
- [ ] `grep "re-run" .claude/skills/lp-design-qa/SKILL.md` → ≥1 match
- [ ] `grep "tools-ui-frontend-design" .claude/skills/lp-design-qa/SKILL.md` → ≥1 match
- [ ] `grep "re-run" .claude/skills/tools-ui-contrast-sweep/SKILL.md` → ≥1 match
- [ ] `grep "re-run" .claude/skills/tools-web-breakpoint/SKILL.md` → ≥1 match
- [ ] `grep "Quick-reference" .claude/skills/frontend-design/SKILL.md` → ≥1 match
- [ ] `grep "Conditional Refactor" .claude/skills/tools-refactor/SKILL.md` → ≥1 match

## Decision Log

- 2026-02-27: Chose to label (not remove) the frontend-design business table — table provides useful quick reference while the note prevents stale propagation risk
- 2026-02-27: Grouped lp-design-spec's 6 changes (incl. template frontmatter + prerequisite conditional from Round 1 critique autofix) into TASK-01 — same file, same commit
- 2026-02-27: `tools-web-breakpoint` = directory/file path; `tools-ui-breakpoint-sweep` = canonical skill name from frontmatter `name:` field — both correct in their respective contexts in this plan

## Overall-confidence Calculation

- All 6 tasks S-effort (weight 1 each)
- TASK-01: 92%, TASK-02: 95%, TASK-03: 95%, TASK-04: 95%, TASK-05: 93%, TASK-06: 95%
- Overall = (92+95+95+95+93+95) / 6 = 560/6 = 93%
