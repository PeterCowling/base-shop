---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Operations
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: post-build-reflection-prompting
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Post-Build Reflection Prompting Plan

## Summary

Post-build pre-fill and the results-review template currently lack structured prompting for five improvement-signal categories: new standing data sources, new open-source packages, new skills, new startup loop processes, and AI-to-mechanistic conversion opportunities. This plan closes that gap with three targeted markdown edits: (1) a five-category scan checklist added to `lp-do-build` SKILL.md step 2 pre-fill instructions, (2) HTML-comment category prompts added to the `## New Idea Candidates` section of the results-review template, and (3) a "Platform evolution signals" trigger group added to `meta-reflect` SKILL.md. No code changes, no new required sections, no emitter changes.

## Active tasks
- [x] TASK-01: Add five-category scan checklist to lp-do-build SKILL.md step 2
- [x] TASK-02: Add category prompts to results-review.user.md template
- [x] TASK-03: Add Platform evolution signals trigger group to meta-reflect SKILL.md

## Goals
- Agents pre-filling results-review systematically scan for all five improvement-signal categories.
- Operators completing results-review manually are guided by visible category prompts.
- meta-reflect fires naturally when a session surfaces any of the five categories.

## Non-goals
- Adding new required sections to results-review (would require emitter code changes).
- Creating a new skill for this.
- Changing the reflection-debt emitter or loop-output-contracts.md.
- Modifying the two-layer-model.md R9 contract rule.

## Constraints & Assumptions
- Constraints:
  - `lp-do-build` SKILL.md must stay ≤200 lines (currently 186; max 14 new lines).
  - All changes are markdown only — no TypeScript.
  - No new required sections in results-review.user.md.
- Assumptions:
  - Agents follow expanded step 2 pre-fill instructions in lp-do-build SKILL.md.
  - HTML comment syntax in the results-review template is visible to agents and operators.
  - meta-reflect trigger additions remain advisory (semi-automatic), consistent with existing trigger language.

## Inherited Outcome Contract

- **Why:** Build cycles consistently surface signals in five improvement categories, but agents have no structured checklist to capture them. Opportunities evaporate rather than feeding the loop.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Post-build pre-fill and results-review template systematically prompt across five improvement-signal categories so that build learnings convert into actionable platform improvement candidates.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/post-build-reflection-prompting/fact-find.md`
- Key findings used:
  - `lp-do-build` SKILL.md step 2 (line 152-153): zero category guidance in pre-fill instructions.
  - `results-review.user.md` template: `## New Idea Candidates` is a plain stub with no category prompts.
  - `meta-reflect` SKILL.md lines 44-68: three trigger groups, none naming the five categories.
  - `loop-output-contracts.md:175`: "any new opportunities, problems, or hypotheses" — semantics absorb the categories without a contract change.
  - Minimum payload is four sections; no emitter changes required.
  - 14 lines of headroom in lp-do-build SKILL.md (186/200).

## Proposed Approach

- Option A: Add a new required section `## Platform Improvement Candidates` to results-review. Rejected: requires emitter code changes, adds a hard gate.
- Option B: Enrich existing sections at three intervention points — lp-do-build pre-fill, results-review template prompt, meta-reflect triggers. Chosen: zero code changes, within contract semantics, low blast radius.
- **Chosen approach:** Option B — three targeted markdown edits, all within existing section semantics.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add five-category scan checklist to lp-do-build SKILL.md step 2 | 80% | S | Complete (2026-02-26) | - | - |
| TASK-02 | IMPLEMENT | Add category prompts to results-review.user.md template | 80% | S | Complete (2026-02-26) | - | - |
| TASK-03 | IMPLEMENT | Add Platform evolution signals trigger group to meta-reflect SKILL.md | 80% | S | Complete (2026-02-26) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three tasks affect different files; no conflicts |

## Tasks

### TASK-01: Add five-category scan checklist to lp-do-build SKILL.md step 2
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-build/SKILL.md` — step 2 of Plan Completion and Archiving expanded with an explicit five-category scan sub-list.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** Step 2 of Plan Completion and Archiving now includes a 5-bullet scan checklist (lines 153-158). File: 191 lines (≤200 ✓). All 5 categories present ✓. `None` instruction documented ✓. Prior step 2 text preserved ✓. VC-01 pass.
- **Artifact-Destination:** `.claude/skills/lp-do-build/SKILL.md` (internal skill file)
- **Reviewer:** operator (review via git diff before ops-ship)
- **Approval-Evidence:** operator confirms correct diff at ops-ship stage
- **Measurement-Readiness:** Qualitative — review next 5 post-change results-reviews for any of the five category labels in New Idea Candidates. No automated tracking required.
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 95% — target is exactly line 152-153 of SKILL.md; checklist content is defined by the five categories from the fact-find; line headroom (14 lines) is confirmed.
  - Approach: 90% — inline sub-list under step 2 is correct; no structural rebuild; ≤14 new lines fits within headroom.
  - Impact: 80% — agents follow step 2 pre-fill instructions in every build cycle (observed pattern); harder to guarantee improved output quality without a baseline.
  - Held-back test (Impact at 80): single unknown that would push Impact below 80 — if agents skip step 2 instructions when context is compressed. Evidence shows step 2 is consistently followed. Held-back test: no single unresolved unknown would drop this below 80 given consistent pre-fill observation.
- **Acceptance:**
  - [ ] Step 2 of Plan Completion section in SKILL.md contains an explicit five-category scan sub-list (all five named).
  - [ ] Total line count of SKILL.md remains ≤200.
  - [ ] No existing step 2 text removed or contradicted.
  - [ ] `None` is documented as a valid output for any category.
- **Validation contract (VC-01):**
  - VC-01: Structural correctness — pass when: (a) file line count ≤200, (b) step 2 contains all five category names as explicit scan prompts, (c) `None` option documented, (d) no prior step 2 text removed; verified immediately after edit within this build session; else: if (a) fails, trim checklist to fit within 200 lines; if (b) fails, add the missing category name(s); if (c) fails, add the `None` output instruction; if (d) fails, restore any removed step 2 text.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current `lp-do-build/SKILL.md:152-153`; confirm step 2 text contains no category scan guidance → gap confirmed (already confirmed in fact-find; re-read to ensure no prior-session change).
  - Green evidence plan: Edit SKILL.md — insert a numbered sub-list after the step 2 pre-fill parenthetical, one bullet per category, plus a `None` instruction. Verify total line count ≤200.
  - Refactor evidence plan: Re-read the full Plan Completion and Archiving section; confirm no duplicate definitions, orphaned terms, or cross-reference breaks with step 1/3/4.
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** Category labels should be specific enough that agents can systematically scan for them without ambiguity. The five labels from the fact-find scope are authoritative: (1) new standing data sources, (2) new open-source packages, (3) new skills, (4) new startup loop processes, (5) AI-to-mechanistic conversion.
- **Edge Cases & Hardening:**
  - If line count would exceed 200 after edit: compress the sub-list to one-liners (no inline elaboration); move any elaboration to a reference doc.
  - If step 2 parenthetical is restructured in a future edit: the checklist must remain a sub-list under step 2, not a separate top-level step.
- **What would make this >=90%:**
  - Evidence from at least one post-change results-review showing a non-None candidate from any of the five categories.
- **Rollout / rollback:**
  - Rollout: Committed with writer lock; takes effect on the next invocation of lp-do-build by any agent.
  - Rollback: `git revert` the commit; instant — no downstream artifacts affected.
- **Documentation impact:**
  - None beyond the SKILL.md edit itself.
- **Notes / references:**
  - fact-find.md Evidence Audit: `lp-do-build/SKILL.md:152-153` is the target line.
  - Constraint: SKILL.md must remain ≤200 lines. Current: 186 lines. Headroom: 14 lines.

---

### TASK-02: Add category prompts to results-review.user.md template
- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/plans/_templates/results-review.user.md` — `## New Idea Candidates` section enriched with an HTML-comment block listing the five category scan prompts.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** HTML comment block added to `## New Idea Candidates` (lines 19-25 of template). All 5 categories listed ✓. Stub line preserved ✓. No new `##` section ✓. VC-02 pass.
- **Artifact-Destination:** `docs/plans/_templates/results-review.user.md` (internal template)
- **Reviewer:** operator (review via git diff before ops-ship)
- **Approval-Evidence:** operator confirms correct diff at ops-ship stage
- **Measurement-Readiness:** Same as TASK-01 — qualitative review of next 5 results-reviews.
- **Affects:** `docs/plans/_templates/results-review.user.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 95% — target section is `## New Idea Candidates`; HTML comment syntax is well-defined; no ambiguity about placement.
  - Approach: 90% — HTML comment is the correct technique for invisible guidance in operator-facing markdown (preserves clean rendered output while surfacing prompts in raw edit view).
  - Impact: 80% — the template is used as the base for all results-reviews; category prompts will appear in every future results-review opened for editing. Whether operators/agents act on them is the residual uncertainty.
  - Held-back test (Impact at 80): single unknown that would push this below 80 — if agents consistently skip over HTML comments when pre-filling. In practice, lp-do-build reads the template and follows stub format. Held-back test: no single unresolved unknown drops this below 80 given agents read template structure to produce pre-fills.
- **Acceptance:**
  - [ ] `## New Idea Candidates` section in template contains an HTML comment enumerating all five categories.
  - [ ] Existing stub line (`- <Idea summary...>`) is preserved unchanged below the comment.
  - [ ] Comment is syntactically valid HTML (`<!-- ... -->`).
  - [ ] No new required section added (minimum payload unchanged).
- **Validation contract (VC-02):**
  - VC-02: Structural correctness — pass when: (a) HTML comment block present in `## New Idea Candidates`, (b) all five category names appear in the comment, (c) existing stub line intact below comment, (d) no new `##` section heading added; verified immediately after edit within this build session; else remove and rewrite comment.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current `results-review.user.md` template; confirm `## New Idea Candidates` has no category prompts → gap confirmed (already confirmed in fact-find; re-read to ensure no prior-session change).
  - Green evidence plan: Insert HTML comment block immediately above the existing stub line in `## New Idea Candidates`. Comment text: lists the five categories and instructs agent/operator to scan for signals in each, with `None` as the valid null output.
  - Refactor evidence plan: Re-read the full template; confirm no duplicate headers, no broken frontmatter, minimum payload structure intact (Observed Outcomes, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check all present).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** HTML comment placement matters — must be inside the `## New Idea Candidates` section, above the stub entry, so that agents parsing the template structure see it before generating candidates.
- **Edge Cases & Hardening:**
  - If the comment causes unexpected rendering in any Markdown viewer: use a brief, single-paragraph comment rather than a multi-line list to reduce visual noise in raw view.
  - Do not use a code block or blockquote — these are visible in rendered output and would change the operator-facing appearance.
- **What would make this >=90%:**
  - Evidence from at least one post-change results-review where the operator or agent explicitly referenced a category from the comment.
- **Rollout / rollback:**
  - Rollout: Committed with writer lock; takes effect on the next build cycle that produces a results-review from this template.
  - Rollback: `git revert` the commit; instantly removes the comment from all future results-reviews (existing results-reviews already produced are unaffected).
- **Documentation impact:**
  - None beyond the template edit itself.
- **Notes / references:**
  - fact-find.md Evidence Audit: template `## New Idea Candidates` stub at `docs/plans/_templates/results-review.user.md:19`.
  - loop-output-contracts.md:175 confirms semantics are broad enough to absorb the five categories.

---

### TASK-03: Add Platform evolution signals trigger group to meta-reflect SKILL.md
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/meta-reflect/SKILL.md` — a fourth trigger group "Platform evolution signals" added to the "When to Trigger" section, listing all five categories as named trigger conditions.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:** "Platform evolution signals" trigger group added between "Documentation/skill adequacy signals" and "Do not trigger" (lines 64-72). All 5 categories as bullets ✓. Format matches existing groups ✓. "Do not trigger" section unchanged ✓. VC-03 pass.
- **Artifact-Destination:** `.claude/skills/meta-reflect/SKILL.md` (internal skill file)
- **Reviewer:** operator (review via git diff before ops-ship)
- **Approval-Evidence:** operator confirms correct diff at ops-ship stage
- **Measurement-Readiness:** None required — trigger additions are advisory (semi-automatic); effect is observable via meta-reflect invocation rate over time.
- **Affects:** `.claude/skills/meta-reflect/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 95% — target section is "When to Trigger" (lines 44-68); new trigger group follows the exact format of the three existing groups; no ambiguity about placement.
  - Approach: 85% — fourth trigger group is the correct structural unit (consistent with existing pattern); slight risk that enumerating all five in one group is too broad for a single trigger (vs. five separate triggers). Resolved: one group with five bullets is idiomatic to the existing pattern and reduces noise vs. five separate headers.
  - Impact: 80% — triggers are semi-automatic (not auto-invoked); depends on operator/agent choosing to act on the trigger signal. Effect is real but indirect.
  - Held-back test (Impact at 80): single unknown that would push this below 80 — if the new trigger group is too broadly worded and causes meta-reflect to over-trigger. Mitigation: triggers remain advisory; no auto-invocation. Held-back test: no single unresolved unknown drops this below 80 given advisory nature of all meta-reflect triggers.
- **Acceptance:**
  - [ ] "Platform evolution signals" (or equivalent clear group name) appears as a fourth trigger group under "When to Trigger".
  - [ ] All five categories are listed as sub-bullets with specific trigger descriptions.
  - [ ] New group follows the same format as the three existing groups (heading + bullet list).
  - [ ] "Do not trigger" section is not modified (no false-positive risk).
- **Validation contract (VC-03):**
  - VC-03: Structural correctness — pass when: (a) new trigger group heading present under "When to Trigger", (b) all five categories named as sub-bullets, (c) format matches existing trigger groups, (d) "Do not trigger" section unchanged; verified immediately after edit within this build session; else remove and rewrite.
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current `meta-reflect/SKILL.md:44-68`; confirm "When to Trigger" has only three groups (planning pipeline signals, execution signals, documentation/skill adequacy signals) with no reference to the five categories → gap confirmed (already confirmed in fact-find; re-read to ensure no prior-session change).
  - Green evidence plan: Insert a fourth trigger group after the third group and before the "Do not trigger" section. Group heading: `### Platform evolution signals`. Five bullets: one per category, each with a specific trigger description (not just the category name — include a concrete signal example).
  - Refactor evidence plan: Re-read the full "When to Trigger" section and the "Do not trigger" section; confirm no overlap between new triggers and the "Do not trigger" conditions; confirm new group does not contradict the meta-reflect evidence standards (any trigger must still require session evidence before a proposal is made).
- **Planning validation (required for M/L):** None: S-effort task.
- **Scouts:** The new trigger group must not undermine meta-reflect's core discipline (evidence-based only). The trigger says "prompt the user to run reflection when X is spotted" — it does not lower the evidence bar for proposals. The evidence standards section (SKILL.md:86-109) must remain controlling.
- **Edge Cases & Hardening:**
  - Risk of over-triggering: mitigated by advisory nature; the trigger says "when spotted during a session" — not "at every session end".
  - If the five categories become stale (e.g., category 2 — packages — is rarely relevant): individual bullets can be removed without affecting the trigger group structure.
- **What would make this >=90%:**
  - Observation of at least one meta-reflect invocation (operator or agent) citing one of the five categories as the trigger condition.
- **Rollout / rollback:**
  - Rollout: Committed with writer lock; takes effect on the next meta-reflect invocation.
  - Rollback: `git revert` the commit; removes the trigger group instantly.
- **Documentation impact:**
  - None beyond the SKILL.md edit itself.
- **Notes / references:**
  - fact-find.md Evidence Audit: `meta-reflect/SKILL.md:44-68` is the target section.
  - New triggers must remain advisory (semi-automatic), consistent with the existing meta-reflect trigger format.

---

## Risks & Mitigations
- Prompt inflation (agents populate all five categories mechanically): mitigated by evidence requirement per candidate and `None` as explicit valid output.
- Goodhart compliance (five-category enumeration becomes compliance checkbox): mitigated by requiring "Trigger observation: <evidence>" per candidate.
- SKILL.md line count exceeded: mitigated by ≤14-line checklist constraint with fallback (compress to one-liners).
- meta-reflect over-triggers: mitigated by advisory trigger model; no auto-invocation.

## Observability
- Logging: None required.
- Metrics: Qualitative — review 5 results-reviews post-change; look for five-category candidates.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [ ] All three SKILL.md/template files updated with structured five-category prompting.
- [ ] lp-do-build SKILL.md ≤200 lines after TASK-01.
- [ ] No new required sections added to results-review.user.md.
- [ ] Reflection-debt emitter unchanged.
- [ ] All three VCs pass within the build session.

## Decision Log
- 2026-02-26: Chose Option B (three targeted markdown edits) over Option A (new required section). Rationale: Option A requires emitter code changes and adds a hard gate where none is warranted.
- 2026-02-26: All three tasks placed in Wave 1 (parallel) — confirmed no file conflicts between TASK-01, TASK-02, TASK-03.

## Overall-confidence Calculation
- TASK-01: 80% confidence, Effort S (weight 1)
- TASK-02: 80% confidence, Effort S (weight 1)
- TASK-03: 80% confidence, Effort S (weight 1)
- Overall-confidence = (80×1 + 80×1 + 80×1) / (1+1+1) = **80%**
