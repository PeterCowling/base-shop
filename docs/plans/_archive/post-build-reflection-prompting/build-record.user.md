---
Status: Complete
Feature-Slug: post-build-reflection-prompting
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — Post-Build Reflection Prompting

## What Was Built

Three targeted markdown edits were applied to add structured five-category scan prompting to the post-build reflection process. All tasks were in Wave 1 and executed in parallel (no file conflicts).

**TASK-01 — lp-do-build SKILL.md:** Step 2 of Plan Completion and Archiving was expanded with an explicit five-category scan checklist inserted between the pre-fill parenthetical and the reflection debt emitter instruction. When pre-filling `## New Idea Candidates`, agents now receive a named scan list: new standing data source, new open-source package, new skill, new loop process, AI-to-mechanistic conversion. The `None` output is documented as valid. File remains at 191 lines (≤200 limit).

**TASK-02 — results-review.user.md template:** An HTML comment block was inserted into the `## New Idea Candidates` section, immediately above the existing stub line, enumerating all five categories with a prompt to cite a "Trigger observation" for each. The minimum payload structure (Observed Outcomes, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check) is unchanged. No new required sections added.

**TASK-03 — meta-reflect SKILL.md:** A fourth trigger group, "Platform evolution signals", was added between "Documentation/skill adequacy signals" and "Do not trigger". It lists five specific trigger conditions — one per category — that prompt the operator to run meta-reflect. Triggers remain advisory (semi-automatic), consistent with the existing meta-reflect trigger model.

## Tests Run

No automated tests applicable — all changes are markdown edits to internal SKILL.md files and a template. Build-validate Mode 3 (document review) run manually for each deliverable:
- lp-do-build SKILL.md: step 2 flows logically; all references intact; no broken cross-references. Pass.
- results-review.user.md: all five required sections present; HTML comment syntactically valid; stub line intact. Pass.
- meta-reflect SKILL.md: new trigger group correctly positioned; no overlap with "Do not trigger"; Progressive Disclosure Layers section undisturbed. Pass.

## Validation Evidence

- VC-01 (TASK-01): file line count 191 ≤ 200 ✓; step 2 contains all five category names ✓; `None` instruction documented ✓; prior step 2 text preserved ✓.
- VC-02 (TASK-02): HTML comment in `## New Idea Candidates` ✓; all five categories in comment ✓; stub line intact ✓; no new `##` section heading ✓.
- VC-03 (TASK-03): "Platform evolution signals" heading under "When to Trigger" ✓; five category bullets ✓; format matches existing trigger groups ✓; "Do not trigger" section unchanged ✓.

## Scope Deviations

None. All edits were within the three files listed in plan task `Affects` fields.

## Outcome Contract

- **Why:** Build cycles consistently surface signals in five improvement categories, but agents had no structured checklist to capture them. Opportunities evaporate rather than feeding the loop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Post-build pre-fill and results-review template systematically prompt across five improvement-signal categories so that build learnings convert into actionable platform improvement candidates.
- **Source:** operator
