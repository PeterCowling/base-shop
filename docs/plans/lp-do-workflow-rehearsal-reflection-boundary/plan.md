---
Type: Plan
Status: Active
Domain: BOS
Workstream: Mixed
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-workflow-rehearsal-reflection-boundary
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-factcheck
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Workflow Rehearsal / Reflection Boundary Plan

## Summary

The workflow's pre-build dry runs are currently described using "simulation" language, while post-build artifacts use "reflection" language, creating terminology ambiguity that blurs the rehearsal/reflection phase boundary. This plan renames the pre-build dry run concept to "rehearsal" (content-first, no file rename in this cycle), adds a bounded four-lens delivery rehearsal stage in lp-do-plan between critique and build handoff, and makes post-build artifact contracts explicitly reflection-only. A checkpoint pilot on 2–3 archived plans validates that delivery rehearsal adds same-outcome signal without duplicating build validation.

## Active tasks
- [ ] TASK-01: Rehearsal terminology bridge — compatibility policy spike
- [ ] TASK-02: Update shared protocol and upstream skill docs with rehearsal language
- [ ] TASK-03: Add post-critique delivery rehearsal stage to lp-do-plan
- [ ] TASK-04: Make post-build artifacts explicitly reflection-only in lp-do-build and loop-output-contracts
- [ ] TASK-05: Pilot checkpoint — archived plan rehearsal validation

## Goals
- Replace "simulation" terminology with "rehearsal" for pre-build dry runs across shared protocol and three workflow skills, without weakening existing hard/advisory gate behavior.
- Add a bounded post-critique delivery rehearsal stage in lp-do-plan covering data, process/UX, security, and UI lenses, with a same-outcome-only rule and explicit rerun triggers.
- Add explicit reflection-only language to lp-do-build post-build artifact contracts and loop-output-contracts.md.
- Validate via archived-plan pilot that delivery rehearsal produces net-new same-outcome findings without duplicating build-time validation.

## Non-goals
- Moving post-build artifacts (build-record, results-review, pattern-reflection, reflection-debt) earlier in the workflow.
- Replacing build-time validation with a pre-build dry run.
- Renaming the file path `simulation-protocol.md` in this cycle (deferred to post-stability cycle).
- Auditing every historical plan to measure rehearsal yield.

## Constraints & Assumptions
- Constraints:
  - Execution remains in lp-do-fact-find, lp-do-plan, and lp-do-build; post-build artifacts must not become delayed execution.
  - Existing hard/advisory gate behavior must be preserved exactly even if terminology changes.
  - Build-time validation ownership stays inside build (build-validate.md responsibilities unchanged).
  - Changes prefer content and contract clarity over broad mechanical churn.
  - TASK-02 and TASK-03 both modify lp-do-plan/SKILL.md; they must run sequentially (TASK-02 first).
- Assumptions:
  - "Rehearsal" is the intended canonical human-facing term for pre-build dry runs.
  - Content-first terminology bridge (wording, not file path) is the safe first step.
  - A bounded four-lens delivery rehearsal belongs after critique and before auto-build handoff.

## Inherited Outcome Contract

- **Why:** The workflow needs a clean phase boundary. Anticipatory dry runs belong before build as rehearsal; once the build is done, post-build artifacts should only reflect what actually happened. Without that split, reflection becomes a dumping ground for work that should have been decided or executed earlier.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `lp-do-fact-find`, `lp-do-plan`, and `lp-do-critique` use rehearsal language and contracts for pre-build dry runs; any new post-critique delivery rehearsal is bounded and same-outcome only; and `lp-do-build` post-build artifacts are explicitly reflective only, never delayed execution.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/fact-find.md`
- Key findings used:
  - Pre-build structural trace already exists in three places: fact-find Phase 5.5, plan Phase 7.5, critique Step 5a — all referencing `.claude/skills/_shared/simulation-protocol.md`.
  - The shared protocol uses "simulation" throughout; no current artifact uses "rehearsal" as a canonical term.
  - The natural insertion seam for delivery rehearsal is lp-do-plan between Phase 9 (critique) and Phase 10 (build handoff).
  - loop-output-contracts.md confirms post-build artifact lifecycle but contains no explicit prohibition against delayed execution absorption.
  - TASK-02 and TASK-03 both affect lp-do-plan/SKILL.md and must be sequenced accordingly.

## Proposed Approach

- Option A: Immediate file rename (`simulation-protocol.md` → `rehearsal-protocol.md`) in the same cycle as wording changes.
- Option B: Content-first terminology bridge in this cycle; defer physical path rename until wording is validated through 2+ build cycles.
- **Chosen approach:** Option B. The shared protocol is loaded by three skill docs via the exact path `../_shared/simulation-protocol.md`. A path rename in the same cycle creates avoidable churn and risk of broken references. Updating content now and deferring the rename after stability is proven is the lower-risk, safer path. This is explicitly supported by the fact-find evidence and the critique-accepted compatibility policy rationale.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes (lp-do-sequence run 2026-03-06; TASK-01 Blocks corrected to TASK-02, TASK-04)
- Edge-case review complete: Yes
- Auto-build eligible: Yes — TASK-04 (80%) satisfies minimum; TASK-02 (75%) and TASK-03 (75%) are below IMPLEMENT threshold and will trigger auto-replan after TASK-01 completes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | SPIKE | Rehearsal terminology bridge: define compatibility policy for shared protocol, headings, and waiver names | 85% | S | Complete (2026-03-06) | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Update shared protocol + lp-do-fact-find, lp-do-plan, lp-do-critique SKILL docs with rehearsal language | 75% | M | Pending | TASK-01 | TASK-03, TASK-05 |
| TASK-03 | IMPLEMENT | Add post-critique delivery rehearsal stage to lp-do-plan (four lenses, same-outcome rule, rerun triggers) | 75% | M | Pending | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Update lp-do-build and loop-output-contracts.md so post-build artifacts are explicitly reflection-only | 80% | S | Pending | TASK-01 | TASK-05 |
| TASK-05 | CHECKPOINT | Pilot revised contract on 2–3 archived plans; record whether delivery rehearsal adds same-outcome signal | 95% | S | Pending | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Spike; must complete first — policy doc required by all Wave 2 tasks |
| 2 | TASK-02, TASK-04 | TASK-01 | No file overlap; safe to run in parallel |
| 3 | TASK-03 | TASK-02 | Sequential constraint: both TASK-02 and TASK-03 modify `lp-do-plan/SKILL.md` |
| 4 | TASK-05 | TASK-02, TASK-03, TASK-04 | Checkpoint after all implementation tasks complete |

**Max parallelism:** 2 (Wave 2: TASK-02 ‖ TASK-04)
**Critical path:** TASK-01 → TASK-02 → TASK-03 → TASK-05 (4 waves)
**Total tasks:** 5

## Tasks

---

### TASK-01: Rehearsal terminology bridge — compatibility policy spike
- **Type:** SPIKE
- **Deliverable:** `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-01-terminology-bridge.md` — a concise compatibility-policy note covering: canonical human-facing term, bridging approach for current section headings (Simulation Trace, Scope Simulation, Forward Simulation Trace), updated waiver name, and path-rename deferral rationale.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Artifact-Destination:** `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-01-terminology-bridge.md`
- **Reviewer:** operator
- **Approval-Evidence:** None: spike output reviewed by TASK-02 executor before implementation begins
- **Measurement-Readiness:** None: spike produces a policy doc; measurement applies at TASK-05 checkpoint
- **Affects:** `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-01-terminology-bridge.md`, `[readonly] .claude/skills/_shared/simulation-protocol.md`, `[readonly] .claude/skills/lp-do-fact-find/SKILL.md`, `[readonly] .claude/skills/lp-do-plan/SKILL.md`, `[readonly] .claude/skills/lp-do-critique/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 85%
  - Implementation: 90% - all four source files are known, readable, and verified. No dependencies outside these files. Task output is a single new markdown document.
  - Approach: 85% - content-first bridge is confirmed as the right approach by fact-find evidence and critique. One design decision remains: exact heading treatment (rename headings to "Rehearsal Trace" vs add "Rehearsal" as the human label in content with old heading preserved). The spike resolves this.
  - Impact: 85% - the spike's impact is to produce a clear policy document that all subsequent tasks use. If the policy document is incomplete or contradictory, TASK-02/03/04 will surface this; the risk is well-contained. Held-back test: no single unresolved unknown would push Impact below 80% because the policy document itself is the deliverable — whether the policy is good will be tested in TASK-02 execution.
- **Acceptance:**
  - `task-01-terminology-bridge.md` exists and contains: (1) canonical human-facing term for pre-build dry runs, (2) heading/section name treatment for Simulation Trace / Scope Simulation / Forward Simulation Trace, (3) waiver name update (or explicit decision to keep `Simulation-Critical-Waiver`), (4) path-rename deferral rationale with criteria for when a path rename becomes appropriate.
  - Policy is internally consistent and doesn't contradict existing gate behavior.
- **Validation contract (VC-01):**
  - VC-01: `task-01-terminology-bridge.md` contains all four required sections → pass rule: all four are present and non-empty; verified by reading the file after creation.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: VC-01 fails because file does not exist before TASK-01 executes.
  - Green evidence plan: Read all four source files in full; note every occurrence of "simulation" that should carry a rehearsal human label; decide on heading treatment and waiver name; write `task-01-terminology-bridge.md`. VC-01 passes.
  - Refactor evidence plan: Verify the policy does not inadvertently weaken any hard-gate rule by re-reading the gate rules section of simulation-protocol.md against the policy doc.
- **Planning validation (required for M/L):** None: S effort; source files verified in fact-find and critique phases.
- **Scouts:** Check whether `Simulation-Critical-Waiver` appears in any plan outside the shared protocol definition — if it does, the waiver name decision in the policy doc must account for those usages. Search: `grep -r "Simulation-Critical-Waiver" docs/plans/`
- **Edge Cases & Hardening:**
  - If grep reveals `Simulation-Critical-Waiver` in more than 5 existing plan files, flag in policy doc as "high-usage term; rename in later cycle." Do not trigger a scope expansion.
- **What would make this >=90%:**
  - Confirming exact occurrence count of "simulation" in human-facing headings across all skill docs, removing any heading-treatment ambiguity.
- **Rollout / rollback:**
  - Rollout: Additive — new file created, no existing files modified.
  - Rollback: Delete `task-01-terminology-bridge.md`. No side effects.
- **Documentation impact:** Produces `task-01-terminology-bridge.md` as the canonical policy for TASK-02/03/04.
- **Build evidence (2026-03-06):**
  - Execution route: inline (codex exec flag mismatch with current binary version, exit 2; fell back to inline per non-zero exit policy)
  - Waiver count grep: 4 occurrences of `Simulation-Critical-Waiver` in active plans (below 5-instance threshold — not flagged as high-usage)
  - VC-01: all four sections present in `task-01-terminology-bridge.md` ✓
  - Gate behavior check: hard-gate logic (Critical block, advisory for Major/Moderate/Minor) unchanged ✓
  - Downstream impact: TASK-02 and TASK-04 now unblocked; TASK-02 Impact uncertainty partially resolved by policy (heading rename confirmed; waiver rename confirmed)
- **Notes / references:**
  - Fact-find Q: "Should the repo immediately rename simulation-protocol.md?" → A: Not necessarily in the first cycle.
  - Critique issue 1-03: No task for eventual path rename → DEFERRED note in Decision Log below.

---

### TASK-02: Update shared protocol and upstream skill docs with rehearsal language
- **Type:** IMPLEMENT
- **Deliverable:** Updated content in: `.claude/skills/_shared/simulation-protocol.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-critique/SKILL.md` — all human-facing occurrences of "simulation" replaced with "rehearsal" or bridged per TASK-01 policy; gate behavior preserved exactly.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** In-place updates to four SKILL/protocol files.
- **Reviewer:** operator
- **Approval-Evidence:** None: lp-do-factcheck run as part of build validates claims.
- **Measurement-Readiness:** None: content-quality change; measured at TASK-05 checkpoint.
- **Affects:** `.claude/skills/_shared/simulation-protocol.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-critique/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-05
- **Confidence:** 80%
  - Implementation: 85% - all four files are known, verified in fact-find and critique; changes are targeted wording edits with no structural changes to gate logic.
  - Approach: 85% - content-first bridge defined by TASK-01 policy; exact changes are enumerable by reading source files.
  - Impact: 75% - whether wording changes in these files actually shift agent behavior toward using "rehearsal" terminology is the core remaining uncertainty. Without a path rename, agents reading the file name `simulation-protocol.md` may default to "simulation" language in their reasoning. TASK-01 policy addresses this risk explicitly; if TASK-01 concludes the bridge is insufficient, this task's scope would require revision. Held-back test: "What single unknown would push Impact below 75%?" — already at 75%; scored conservatively because file-path naming remains "simulation" and that may dominate agent behavior.
- **Acceptance:**
  - All human-facing occurrences of "simulation" in the four affected files are replaced with "rehearsal" (or bridged per TASK-01 policy) in section headings, introductory descriptions, and in-prose references.
  - Hard-gate behavior (Critical findings block, waiver format) is preserved verbatim or with only the human label updated.
  - Advisory gate behavior (Major/Moderate/Minor findings proceed) is preserved.
  - `../_shared/simulation-protocol.md` load path appears unchanged in all three skill docs (no path rename in this task).
  - `grep -r "simulation" .claude/skills/` returns only: (a) the file path itself and (b) any explicit bridging note retained intentionally per TASK-01 policy.
- **Validation contract:**
  - VC-01: Grep for "simulation" (case-insensitive) in the four affected files returns only occurrences that TASK-01 policy explicitly exempts (e.g., the file path itself) → pass rule: grep output logged to task notes; each remaining match cited against TASK-01 exemption list; pass requires zero unexplained matches.
  - VC-02: Hard-gate rule text ("Critical findings block the artifact from being emitted") is present and semantically unchanged in the updated shared protocol → pass rule: gate rules section produces identical behavior with only human-label substitution.
  - VC-03: All three skill doc load-path references to `../_shared/simulation-protocol.md` are unchanged → pass rule: grep confirms exact path string still present in each of the three skill docs.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Pre-task grep shows "simulation" in human-facing positions across all four files (VC-01 fails before edits).
  - Green evidence plan: Read TASK-01 policy. For each file, enumerate "simulation" occurrences, apply bridge per policy, write changes. Recheck VC-01 (only exempted hits remain), VC-02 (gate language intact), VC-03 (load path intact).
  - Refactor evidence plan: Re-read all four updated files holistically for internal consistency — no new inconsistency introduced between files. Run lp-do-factcheck on file path claims in updated content.
- **Planning validation:**
  - Checks run: Read all four target files in critique and fact-find phases; confirmed content and gate behavior.
  - Validation artifacts: fact-find Evidence Audit (current state); critique Claim-Evidence Audit row 1.
  - Unexpected findings: None.
- **Scouts:** Run `grep -ri "simulation" .claude/skills/` before edits to capture full occurrence list. Record in task notes.
- **Edge Cases & Hardening:**
  - If any occurrence of "simulation" appears inside a quoted example block or code-format block that represents user output (e.g., a trace table header a user would see), preserve the old term in the example with a note: "this example shows legacy output; new outputs use Rehearsal Trace."
  - If `lp-do-critique/SKILL.md` uses "simulation" only as the Step 5a method name (not the section heading), check TASK-01 policy for how method names are treated.
- **What would make this >=90%:**
  - Confirming that agents reading the updated files consistently apply "rehearsal" terminology in their trace output on next run — requires at least one live or simulated build as evidence.
- **Rollout / rollback:**
  - Rollout: Four files updated in-place; no deploy required.
  - Rollback: `git revert` the TASK-02 commit. TASK-03 would also need revert if already merged.
- **Documentation impact:** Primary: four SKILL/protocol files. Secondary: `task-01-terminology-bridge.md` becomes the documented rationale for the changes made.
- **Notes / references:**
  - Critique issue 1-05 (Minor): four files in one task with no parallelism note. Parallelism within this task is safe (files are independent) — agent should update the shared protocol first to ensure downstream skill doc edits reference stable content.
  - Critique issue 1-04 (Moderate): scope-creep risk mitigation. Each edit to lp-do-plan/SKILL.md in this task is limited to terminology-only; no structural insertion (that is TASK-03). If any "simulation" replacement naturally leads to inserting new content, stop and flag for TASK-03.

---

### TASK-03: Add post-critique delivery rehearsal stage to lp-do-plan
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-plan/SKILL.md` — new phase inserted between Phase 9 (critique) and Phase 10 (build handoff) defining: four delivery rehearsal lenses (data, process/UX, security, UI), same-outcome-only rule, explicit rerun triggers, and adjacent-idea routing.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** In-place update to `.claude/skills/lp-do-plan/SKILL.md`.
- **Reviewer:** operator
- **Approval-Evidence:** None: content validated by TASK-05 pilot.
- **Measurement-Readiness:** None: behavioral change; measured at TASK-05 checkpoint.
- **Affects:** `.claude/skills/lp-do-plan/SKILL.md`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% - insertion point (between Phase 9 and Phase 10) is verified in fact-find and critique; lp-do-plan/SKILL.md Phase structure is known; TASK-02 will have made terminology consistent before this task runs.
  - Approach: 85% - four lenses are defined in fact-find (data, process/UX, security, UI); same-outcome-only rule is documented; rerun triggers are defined in fact-find Questions → Resolved.
  - Impact: 75% - whether the delivery rehearsal produces genuinely different findings from the existing structural simulation trace is the core H2 uncertainty. Evidence shows the current trace is structural-only (verified) and build-validate.md covers runtime validation (verified), but whether four-lens pre-build dry walk adds meaningful signal is tested by TASK-05, not TASK-03. Held-back test: "What would push Impact to <75%?" — if delivery rehearsal proves entirely redundant with existing Phase 7.5 structural trace, Impact is near zero. This risk is explicitly named as a competing hypothesis in the critique, rated Medium likelihood. Conservative scoring at 75%.
- **Acceptance:**
  - lp-do-plan/SKILL.md contains a new numbered phase between Phase 9 and Phase 10 titled "Delivery Rehearsal."
  - New phase defines all four lenses: (1) data — does the task data actually exist or need creation? (2) process/UX — will users encounter this flow correctly? (3) security — are auth/permission boundaries clear? (4) UI — is the rendering/component path specified?
  - New phase states the same-outcome-only rule: findings that are same-outcome update the plan before build; adjacent ideas route to post-build reflection or later fact-find.
  - New phase states rerun triggers: if delivery rehearsal changes task order, dependencies, or validation burden, rerun Phase 7 (sequence) and Phase 9 (targeted critique) before Phase 10 handoff.
  - New phase states adjacent-idea routing explicitly (not just "don't add them").
  - Phase 10 heading/numbering is updated to reflect the new phase order.
  - Quick Checklist at the end of lp-do-plan/SKILL.md includes a delivery-rehearsal checkbox.
- **Validation contract:**
  - VC-01: lp-do-plan/SKILL.md contains a "Delivery Rehearsal" phase between Phase 9 and Phase 10, with all four lenses named → pass rule: read file, confirm section present and all four lenses enumerated.
  - VC-02: Same-outcome-only rule sentence is present in the new phase → pass rule: grep for "same-outcome" in the file returns at least one hit in the new phase section.
  - VC-03: Rerun trigger sentence is present: "if delivery rehearsal changes task order, dependencies, or validation burden, rerun Phase 7 (sequence) and Phase 9 (targeted critique)" → pass rule: grep confirms sentence present.
  - VC-04: Quick Checklist updated with delivery-rehearsal item → pass rule: checklist section contains "Delivery Rehearsal run" entry.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Pre-task read shows Phase 9 immediately followed by Phase 10 with no intermediate delivery rehearsal phase (VC-01 fails before edit).
  - Green evidence plan: Draft new "## Phase 9.5: Delivery Rehearsal" section (or renumber to preserve ordering). Insert four lenses, same-outcome rule, rerun triggers, adjacent-idea routing. Update Phase 10 header numbering if needed. Update Quick Checklist. Verify VC-01 through VC-04.
  - Refactor evidence plan: Re-read the full updated SKILL.md to confirm no existing phase descriptions were accidentally modified during insertion. Confirm Phase 10 auto-continue logic is unchanged.
- **Planning validation:**
  - Checks run: Verified Phase 9 (critique) and Phase 10 (handoff) structure in fact-find and critique investigation.
  - Validation artifacts: fact-find Questions → Resolved (Q: Where should a new delivery rehearsal sit? Q: What should delivery rehearsal cover? Q: How should rehearsal findings be folded back?).
  - Unexpected findings: None.
- **Scouts:** Before editing, re-read Phase 9 and Phase 10 in full to confirm no intermediate phase was added since fact-find (check if Phase 9.5 or similar already exists).
- **Edge Cases & Hardening:**
  - If the four-lens check reveals a finding that is borderline between same-outcome and adjacent scope: the phase must specify a tiebreaker rule. Proposed default: "If a rehearsal finding requires adding a new task to the plan, it is adjacent scope unless it directly unblocks an existing IMPLEMENT task in the current plan."
  - If delivery rehearsal finds a Critical issue: the phase must specify whether it blocks handoff or triggers a replan. Proposed: Critical delivery-rehearsal finding triggers a targeted replan (not a waiver) before Phase 10 handoff.
- **What would make this >=90%:**
  - TASK-05 pilot evidence showing at least one net-new same-outcome finding across the three archived plans.
- **Rollout / rollback:**
  - Rollout: One file updated in-place.
  - Rollback: `git revert` the TASK-03 commit. TASK-05 results would be invalidated if rolled back.
- **Documentation impact:** `.claude/skills/lp-do-plan/SKILL.md` primary; Plan Quick Checklist updated.
- **Notes / references:**
  - Critique issue 1-04 (Moderate): scope-creep risk for delivery rehearsal. The task execution plan must record one sentence per rehearsal finding justifying it as same-outcome before including it.
  - Fact-find constraint: "If added, delivery rehearsal belongs after critique and before auto-build handoff."

---

### TASK-04: Make post-build artifacts explicitly reflection-only in lp-do-build and loop-output-contracts
- **Type:** IMPLEMENT
- **Deliverable:** Updated content in `.claude/skills/lp-do-build/SKILL.md` and `docs/business-os/startup-loop/contracts/loop-output-contracts.md` — both contain explicit plain-language prohibition against post-build artifacts absorbing unexecuted work.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** In-place updates to two files.
- **Reviewer:** operator
- **Approval-Evidence:** None: content verified by factcheck.
- **Measurement-Readiness:** Baseline count of unexecuted-work items found in 3 existing results-review.user.md files recorded in `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-04-baseline-check.md`.
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% - both files are known; loop-output-contracts.md verified to have no existing prohibition text (claim confirmed in critique); lp-do-build/SKILL.md post-build artifact section identified.
  - Approach: 90% - adding explicit "reflective only / never delayed execution" language is a direct and unambiguous fix. No design alternatives needed.
  - Impact: 80% - wording alone may not change operator behavior (critique Moderate risk 1-04); the observable check (baseline count of unexecuted work in existing results-review files) provides a concrete starting point for future measurement. Held-back test: the prohibition is additive wording — it can only help, not introduce a regression. Operator non-compliance is an adoption risk that existed before this edit; the wording change does not create a new failure mode. No single unknown makes the post-edit state worse than the pre-edit state. Held-back test passes at 80%.
- **Acceptance:**
  - lp-do-build/SKILL.md post-build artifact section (build-record, build-event, results-review, pattern-reflection, reflection debt, etc.) contains an explicit sentence: "Post-build artifacts are reflective only — they must not contain unexecuted work items that the plan or build already knew were required."
  - loop-output-contracts.md `results-review.user.md` artifact section contains a plain-language prohibition: "results-review.user.md captures observations after build; it must not carry unexecuted work items from the plan."
  - `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-04-baseline-check.md` exists and records findings from reading 3 existing results-review.user.md files (what, if any, unexecuted-work items were found, as a pre-fix baseline).
- **Validation contract:**
  - VC-01: lp-do-build/SKILL.md contains "reflective only" and "never delayed execution" (or equivalent) in the post-build artifact instructions → pass rule: grep confirms language present.
  - VC-02: loop-output-contracts.md results-review section contains explicit prohibition on unexecuted work → pass rule: grep confirms prohibition text present.
  - VC-03: `task-04-baseline-check.md` exists with baseline data from ≥3 results-review.user.md files → pass rule: file exists and contains at least one data point.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: VC-01 and VC-02 fail before edits (confirmed by critique: neither file contains prohibition language).
  - Green evidence plan: Add explicit sentence to lp-do-build/SKILL.md post-build section. Add explicit sentence to loop-output-contracts.md results-review section. Search `docs/plans/` for `results-review.user.md` files; read 3; record baseline in `task-04-baseline-check.md`. Verify VC-01, VC-02, VC-03.
  - Refactor evidence plan: Re-read both updated sections to confirm added language does not conflict with surrounding instructions (e.g., does not imply reflection is optional, does not contradict existing `results-review` minimum payload requirements).
- **Planning validation:**
  - Checks run: loop-output-contracts.md verified — no prohibition language present (critique Claim-Evidence row 3); lp-do-build/SKILL.md post-build section confirmed in fact-find Evidence Audit.
  - Validation artifacts: loop-output-contracts.md grep for "never", "prohibit", "delayed" — none found (critique).
  - Unexpected findings: None.
- **Scouts:** Search `docs/plans/` for `results-review.user.md` files to confirm ≥3 exist for baseline check.
- **Edge Cases & Hardening:**
  - If fewer than 3 results-review.user.md files exist in docs/plans, note this in the baseline check and use however many exist (minimum 1 required).
  - The added prohibition must not contradict the existing `results-review` minimum payload requirement (that the artifact exists and has observation content). Confirm the prohibition is additive (what NOT to include), not restrictive (what must be included).
- **What would make this >=90%:**
  - A mechanical gate (lint rule or CI check) that detects unexecuted work in results-review.user.md. Deferred — outside this cycle's scope.
- **Rollout / rollback:**
  - Rollout: Two files updated in-place. Additive.
  - Rollback: `git revert` the TASK-04 commit.
- **Documentation impact:** `.claude/skills/lp-do-build/SKILL.md` and `docs/business-os/startup-loop/contracts/loop-output-contracts.md` both updated. `task-04-baseline-check.md` created.
- **Notes / references:**
  - Critique issue 1-04 (Moderate): risk mitigation strengthened — "after TASK-04, review 3 existing results-review.user.md files for unexecuted work and record the baseline count." This is the VC-03 validation contract.
  - Critique issue 1-06 (Minor): measurability threshold undefined. The baseline check establishes a count; future builds can compare against it.

---

### TASK-05: Pilot checkpoint — archived plan rehearsal validation
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if needed; pilot notes in `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-05-pilot-notes.md`.
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/plan.md`, `docs/plans/lp-do-workflow-rehearsal-reflection-boundary/task-05-pilot-notes.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process is defined; archived plans exist in docs/plans/.
  - Approach: 95% - retrospective confirmatory pilot is the correct method for this change type.
  - Impact: 95% - controls downstream risk; pilot findings either confirm or trigger targeted replan.
- **Acceptance:**
  - ≥2 archived plans reviewed using the new delivery rehearsal stage (four lenses; 3 target, minimum 2 if only 2 suitable archived plans exist).
  - Pilot notes record: plan type (process/UI/data-heavy), what existing critique caught, what delivery rehearsal would have added, whether any additional finding is genuinely same-outcome or scope-adjacent.
  - If pilot finds zero net-new same-outcome findings: replan note raised to reconsider delivery rehearsal scope (per critique-fixed validation approach).
  - If pilot finds net-new findings with scope bleed: tighten same-outcome rule recommendation recorded in notes.
  - If pilot finds net-new same-outcome findings with no scope bleed: confirmation recorded. No replan required.
- **Horizon assumptions to validate:**
  - H2: A bounded delivery rehearsal will catch issues that the structural trace does not foreground (across data, process/UX, security, UI lenses).
  - Competing hypothesis: The delivery rehearsal proves redundant with the existing Phase 7.5 structural simulation trace.
- **Validation contract:** Pilot notes file exists with findings for ≥2 archived plans (3 target; minimum 2 if only 2 suitable archived plans found). Each entry includes the plan type, existing critique findings, delivery rehearsal findings, and outcome classification (same-outcome / scope-adjacent / none).
- **Planning validation:** Archived plans exist at `docs/plans/`; selection criteria: one process-heavy plan, one UI-heavy plan, one data/integration-heavy plan per fact-find recommendation.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `task-05-pilot-notes.md` created; plan.md updated with checkpoint outcome.

---

## Risks & Mitigations
- Terminology-only rewrite with no real boundary change: plan includes exact insertion points, rerun rules, and reflection-only wording in TASK-03 and TASK-04 acceptance criteria.
- Delivery rehearsal duplicates build validation: new phase explicitly defines delivery-specific lens questions (data existence, UX flow, auth boundary, rendering path) that differ from structural precondition checks.
- Rehearsal findings widen current build scope (High / High): same-outcome-only rule required in TASK-03; plan template must record one sentence justifying each rehearsal finding as same-outcome; TASK-05 pilot explicitly checks for scope bleed.
- Immediate protocol file rename creates path churn: content-first bridge chosen; path rename deferred to post-stability cycle (Decision Log).
- Reflection-only guidance ignored in practice: wording added in TASK-04; observable baseline check (VC-03) gives a pre-fix count to compare against.

## Observability
- Logging: None: process documents; no runtime logging.
- Metrics: TASK-04 baseline check counts unexecuted-work items in 3 existing results-review.user.md files. TASK-05 pilot notes record net-new delivery-rehearsal findings by lens.
- Alerts/Dashboards: None: no automated enforcement in this cycle.

## Acceptance Criteria (overall)
- [ ] Shared protocol and three upstream workflow skills use rehearsal language consistently in all human-facing positions.
- [ ] lp-do-plan/SKILL.md contains a new delivery rehearsal phase with four lenses, same-outcome rule, and rerun triggers.
- [ ] lp-do-build/SKILL.md and loop-output-contracts.md both explicitly prohibit delayed execution in post-build artifacts.
- [ ] TASK-05 pilot notes exist for ≥2 archived plans with outcome classification.
- [ ] No hard-gate behavior was weakened by terminology changes (VC-02 in TASK-02).

## Decision Log
- 2026-03-06: Content-first terminology bridge chosen over immediate file rename (Option B). Rationale: shared protocol path `../_shared/simulation-protocol.md` is referenced in three skill docs; path churn adds risk without improving behavior. Rename deferred until wording is validated through 2+ build cycles.
- 2026-03-06: DEFERRED — once TASK-02 terminology bridge is stable through 2+ real or archived build cycles, create a follow-on plan to rename `.claude/skills/_shared/simulation-protocol.md` to `rehearsal-protocol.md` and update all three skill doc load paths. This was critique issue 1-03.

## Overall-confidence Calculation
- TASK-01: S=1, 85% × 1 = 85
- TASK-02: M=2, 75% × 2 = 150
- TASK-03: M=2, 75% × 2 = 150
- TASK-04: S=1, 80% × 1 = 80
- TASK-05: S=1, 95% × 1 = 95
- Sum weighted scores: 560
- Sum weights: 7
- Overall-confidence = 560 / 7 = 80.0% → **80%**

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Terminology bridge spike | Yes — source files all exist and were verified | None | No |
| TASK-02: Update shared protocol + 3 skill docs | Yes — TASK-01 produces policy doc before TASK-02 runs; all target files exist | [Minor] Ordering within task: shared protocol should be updated before the three skill docs to avoid intra-task inconsistency | No |
| TASK-03: Add delivery rehearsal phase to lp-do-plan | Yes — TASK-02 completes before TASK-03 (sequential, same file constraint); insertion point verified | [Minor] Phase numbers may need updating (Phase 10 → Phase 10 or renumbered) — executor should confirm at task start | No |
| TASK-04: Add reflection-only prohibition to lp-do-build and loop-output-contracts | Yes — TASK-01 complete; files verified; no dependency on TASK-02/03 | None | No |
| TASK-05: Pilot checkpoint | Yes — all three IMPLEMENT tasks and one SPIKE complete before checkpoint | [Minor] Pilot depends on ≥2 suitable archived plans existing; search should confirm availability before starting | No |

No Critical simulation findings. All findings are advisory Minor.
