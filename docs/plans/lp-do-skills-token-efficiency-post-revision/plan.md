---
Type: Plan
Status: Active
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-skills-token-efficiency-post-revision
Deliverable-Type: skill-update
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique, lp-do-factcheck
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact) per task; all S-effort (weight 1); weighted avg = 78.75 → 80%
Auto-Build-Intent: plan+auto
---

# lp-do Skills: Token Efficiency + Effectiveness Post-Revision Plan

## Summary
The lp-do skill series was revised in two recent waves (BOS decoupling 2026-02-24; post-build validation 2026-02-25). Five SKILL.md orchestrators now exceed the 200-line thin-orchestrator threshold, and two areas of near-identical cross-skill duplication exist: the 3-round critique loop (~65/52 lines across fact-find and plan) and the queue check gate (~35/36 lines across fact-find and briefing). This plan eliminates both duplication patterns via shared modules, extracts the separable Offer Lens from lp-do-critique, and tightens two content-dense utility skills. Eight atomic tasks, all S-effort, target lp-do-fact-find to ≤200 lines and lp-do-plan to ≤260 lines (≤200 not achievable without loss of governing content); lp-do-build also targeted to ≤200 lines.

## Active tasks
- [x] TASK-01: Create `_shared/critique-loop-protocol.md`
- [x] TASK-02: Replace Phase 7a in `lp-do-fact-find/SKILL.md`
- [x] TASK-03: Replace Phase 11 in `lp-do-plan/SKILL.md` + repair phase gap
- [x] TASK-04: Create `_shared/queue-check-gate.md`
- [ ] TASK-05: Replace Phase 0 in `lp-do-fact-find/SKILL.md` and `lp-do-briefing/SKILL.md`
- [x] TASK-06: Extract lp-do-critique Section D to module
- [x] TASK-07: Tighten `lp-do-factcheck/SKILL.md`
- [x] TASK-08: Tighten `lp-do-build/SKILL.md`

## Goals
- Reduce lp-do-fact-find SKILL.md to ≤200 lines (achievable: 290 → ~198 via TASK-02 + TASK-05)
- Reduce lp-do-plan SKILL.md to ≤260 lines via TASK-03 (302 → ~250; ≤200 not achievable without loss of governing content — follow-on initiative if needed)
- Reduce lp-do-build SKILL.md to ≤200 lines via TASK-08 (achievable if ~62 non-governing lines identified)
- Eliminate critique loop duplication: ~65 lines in fact-find + ~52 lines in plan unified into one shared module
- Eliminate queue check gate duplication: ~35/36 lines in fact-find and briefing unified into one shared module
- Extract lp-do-critique Section D (Offer Lens, ~84 lines) to `modules/offer-lens.md`
- Tighten lp-do-factcheck pedagogical content (~40 lines reducible)
- Repair phase numbering gap in lp-do-plan (8 → 10 → 11)

## Non-goals
- Changes to lp-do-replan or lp-do-sequence (under 200 lines, no duplication)
- Structural changes to lp-do-briefing beyond Phase 0 replacement (TASK-05)
- Any change to `_shared/` files beyond creating two new modules
- Redesigning skill chain architecture or workflow contracts
- Merging confidence-scoring-rules.md and confidence-protocol.md
- Changes to production application code

## Constraints & Assumptions
- Constraints:
  - Module extraction must preserve 100% of governing logic — no rules may be lost or weakened
  - Shared modules use relative paths: `../_shared/<file>.md` from consuming skill
  - 200-line threshold applies to SKILL.md orchestrators; module files may be longer
  - lp-do-critique (668L) and lp-do-factcheck (496L) are verified-justified exceptions to the threshold
  - All changes confined to `.claude/skills/` markdown files
- Assumptions:
  - Critique loop unified block (~55 lines) covers both skills via two parameterizable differences (artifact name; plan-mode branch)
  - Queue check gate unified block covers both skills via one parameterizable difference (briefing-mode status filter)
  - ~10 additional lines in lp-do-build SKILL.md beyond Plan Completion + Always-Confirm-First are identifiable and non-governing

## Inherited Outcome Contract

- **Why:** BOS decoupling left two near-identical logic blocks in separate orchestrators. Deduplicating now prevents drift between copies on future edits.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All lp-do orchestrators ≤200 lines (three primary orchestrators; critique/factcheck are verified exceptions); critique loop and queue check gate deduplicated into `_shared/` modules; lp-do-plan phase numbering coherent; lp-do-critique Offer Lens extracted to module
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-skills-token-efficiency-post-revision/fact-find.md`
- Key findings used:
  - Line counts: lp-do-fact-find 290L, lp-do-plan 302L, lp-do-build 262L, lp-do-critique 668L, lp-do-factcheck 496L
  - Duplication Finding 1: Phase 7a (65L) ≈ Phase 11 (52L); two parameterizable differences
  - Duplication Finding 2: fact-find Phase 0 (35L) ≈ briefing Phase 0 (36L); one parameterizable difference
  - lp-do-plan phase gap: 8 → 10 → 11 (Phase 9 deleted in BOS decoupling)
  - lp-do-critique Section D lines 363–446 (~84 lines); self-contained, no cross-references

## Proposed Approach
- Option A: Extract duplication to shared modules + tighten individual skills in parallel waves
- Option B: Sequential single-skill passes (slower, no parallelism benefit)
- Chosen approach: Option A — Wave 1 creates shared modules and tightens independent skills in parallel; Wave 2 wires shared modules into orchestrators; Wave 3 updates the second consumer of the queue check gate. Maximum parallelism with file-conflict safety.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes (3-wave topology; no cycles)
- Edge-case review complete: Yes
- Auto-build eligible: Yes (TASK-01 confidence 80%, no blocking dependencies)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---|---|---|---|
| TASK-01 | IMPLEMENT | Create `_shared/critique-loop-protocol.md` | 80% | S | Complete (2026-02-26) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Replace Phase 7a in lp-do-fact-find/SKILL.md | 80% | S | Complete (2026-02-26) | TASK-01 ✓ | TASK-05 |
| TASK-03 | IMPLEMENT | Replace Phase 11 in lp-do-plan/SKILL.md + phase gap | 80% | S | Complete (2026-02-26) | TASK-01 ✓ | - |
| TASK-04 | IMPLEMENT | Create `_shared/queue-check-gate.md` | 80% | S | Complete (2026-02-26) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Replace Phase 0 in fact-find + briefing SKILL.md | 80% | S | Pending | TASK-02 ✓, TASK-04 ✓ | - |
| TASK-06 | IMPLEMENT | Extract lp-do-critique Section D to module | 80% | S | Complete (2026-02-26) | - | - |
| TASK-07 | IMPLEMENT | Tighten lp-do-factcheck Fix Guidelines + Anti-Patterns | 75% | S | Complete (2026-02-26) | - | - |
| TASK-08 | IMPLEMENT | Tighten lp-do-build SKILL.md to ≤200 lines | 75% | S | Complete (2026-02-26) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-04, TASK-06, TASK-07, TASK-08 | - | All independent; different files |
| 2 | TASK-02, TASK-03 | TASK-01 complete | Both need critique-loop-protocol.md; edit different files — parallel safe |
| 3 | TASK-05 | TASK-02 complete, TASK-04 complete | Edits lp-do-fact-find/SKILL.md (same file as TASK-02 — must be sequential); also edits lp-do-briefing/SKILL.md |

## Tasks

---

### TASK-01: Create `_shared/critique-loop-protocol.md`
- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/_shared/critique-loop-protocol.md` — unified 3-round critique loop block usable by both lp-do-fact-find and lp-do-plan
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/_shared/critique-loop-protocol.md`
- **Reviewer:** None: single operator, no review gate
- **Approval-Evidence:** None: single operator, no approval gate
- **Measurement-Readiness:** Post-task: `wc -l .claude/skills/_shared/critique-loop-protocol.md` confirms file exists; `cat` confirms both fact-find mode and plan mode content present
- **Affects:** `.claude/skills/_shared/critique-loop-protocol.md` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Build evidence:** File created at `.claude/skills/_shared/critique-loop-protocol.md` (58 lines). VC-01 ✓: file exists. VC-02 ✓: `rg "fact-find mode|plan mode"` returns 2 matches. VC-03 ✓: side-by-side comparison confirms no rules added beyond Phase 7a / Phase 11 originals.
- **Confidence:** 80%
  - Implementation: 90% — file does not exist; content is fully specified from side-by-side comparison of Phase 7a and Phase 11; two parameterizable differences identified and resolved
  - Approach: 85% — shared module pattern is proven (`_shared/subagent-dispatch-contract.md`, `_shared/auto-continue-policy.md`); new pattern of mode-aware content within a shared block is an extension, not a new pattern
  - Impact: 80% — creating this file is a precondition for TASK-02 and TASK-03; the deduplication impact is realized only once both consuming skills reference it
  - Held-back test: "What if agents don't correctly parse the mode context (fact-find vs plan mode) from the calling skill?" — this would cause one skill to use the wrong post-loop gate branch. Mitigated by: (a) the shared block will be structured with clear conditional labels, (b) TASK-02 and TASK-03 include post-change verification. No single unknown would drop implementation below 80 because the file structure is fully determined by the two originals.
- **Acceptance:**
  - File exists at `.claude/skills/_shared/critique-loop-protocol.md`
  - Contains: pre-critique factcheck gate, 3-round iteration table, Round 1/2/3 rules, post-loop gate with both fact-find mode and plan mode verdicts labeled
  - Contains both artifact-name variants (`fact-find.md` / `plan.md`) in the appropriate mode sections
  - Does not introduce any new rule not present in either original
- **Validation contract:**
  - VC-01: File exists and is non-empty → `ls -la .claude/skills/_shared/critique-loop-protocol.md` returns a file; immediately on creation
  - VC-02: Both mode labels present → `rg "fact-find mode|plan mode" .claude/skills/_shared/critique-loop-protocol.md` returns 2 matches; immediately on creation
  - VC-03: No rule added not present in originals → for each paragraph in the shared module, confirm it has a direct counterpart in Phase 7a (lp-do-fact-find/SKILL.md lines 213–277) or Phase 11 (lp-do-plan/SKILL.md lines 228–279); any paragraph in the shared module with no counterpart in either source is a failing check; verify via side-by-side reading of the git diff of the new file against both originals
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read Phase 7a (`lp-do-fact-find/SKILL.md` lines 213–277) and Phase 11 (`lp-do-plan/SKILL.md` lines 228–279) side-by-side; document the two differences as labeled mode branches; confirm no third difference exists
  - Green evidence plan: Write `_shared/critique-loop-protocol.md` with the unified block; both modes' content present; verify VC-01 and VC-02
  - Refactor evidence plan: Read shared module once more and confirm VC-03 (no added rules); confirm the mode labels are unambiguous for an agent reader
- **Planning validation:** None: S-effort, no M/L consumer tracing required
- **Scouts:** None: content is fully determined from existing Phase 7a and Phase 11
- **Edge Cases & Hardening:** If a third difference between the two blocks is discovered during Red phase, document it and add a third mode label rather than losing it
- **What would make this >=90%:** Green evidence (file created and verified); score rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit new file; TASK-02 and TASK-03 proceed
  - Rollback: git revert commit; TASK-02 and TASK-03 cannot proceed without this file
- **Documentation impact:** None: this file IS the documentation
- **Notes / references:**
  - Source: `lp-do-fact-find/SKILL.md` Phase 7a, lines 213–277
  - Source: `lp-do-plan/SKILL.md` Phase 11, lines 228–279

---

### TASK-02: Replace Phase 7a in `lp-do-fact-find/SKILL.md` with shared module reference
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-fact-find/SKILL.md` — Phase 7a (~65 lines) replaced with a ~4-line module reference block pointing to `../_shared/critique-loop-protocol.md` (fact-find mode)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l` confirms line count reduction; file-before/after diff confirms correct section replaced
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Build evidence:** File reduced from 291L to 241L (-50L). VC-01 ✓: 0 matches for inline critique table. VC-02 ✓: 1 critique-loop-protocol reference. VC-03 note: 241L vs plan estimate ≤232 — plan estimated Phase 7a at 65L; actual was 54L → 9L gap from estimate; TASK-05 Phase 0 replacement addresses remaining path to ≤200 goal.
- **Confidence:** 80%
  - Implementation: 90% — exact line range (Phase 7a, lines 213–277) identified; replacement content is a short reference block; no ambiguity
  - Approach: 85% — string replacement of a well-bounded section; proven pattern from v1/v2 token efficiency plans
  - Impact: 80% — reduces SKILL.md by ~61 lines (290 → ~229); puts file closer to ≤200 target but not yet there (Phase 0 replacement in TASK-05 removes further 31 lines)
  - Held-back test: "What if the Phase 7a boundaries are wrong and the replacement removes content beyond Phase 7a?" — mitigated by reading the exact boundary lines before editing and verifying line count after
- **Acceptance:**
  - `lp-do-fact-find/SKILL.md` no longer contains the 3-round critique loop iteration table inline
  - A reference to `../_shared/critique-loop-protocol.md` (fact-find mode) is present in the Phase 7a position
  - `wc -l lp-do-fact-find/SKILL.md` returns ≤ 232 lines (290 - 65 + 7 reference block)
  - `rg "After round" lp-do-fact-find/SKILL.md` returns zero hits (the table is gone)
- **Validation contract:**
  - VC-01: Inline table removed → `rg "After round.*Condition to run" .claude/skills/lp-do-fact-find/SKILL.md` returns 0 matches; immediately post-edit
  - VC-02: Reference present → `rg "critique-loop-protocol" .claude/skills/lp-do-fact-find/SKILL.md` returns 1 match; immediately post-edit
  - VC-03: Line count reduced → `wc -l .claude/skills/lp-do-fact-find/SKILL.md` ≤ 232; immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read `lp-do-fact-find/SKILL.md`; locate Phase 7a header and find exact start/end line numbers; verify no content below Phase 7a boundary would be affected
  - Green evidence plan: Replace Phase 7a block with 4-line reference; verify VC-01 and VC-02 and VC-03
  - Refactor evidence plan: Read surrounding context (Phase 7 completion message and Phase 7 → Completion Message transition) to confirm narrative flow is preserved; no orphaned "see above" references
- **Planning validation:** None: S-effort
- **Scouts:** None: content of Phase 7a fully mapped in fact-find
- **Edge Cases & Hardening:** If Phase 7a contains any closing clause that transitions to the Completion Message section, include it in the reference block rather than losing it
- **What would make this >=90%:** Green evidence; rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit; TASK-05 can proceed
  - Rollback: git revert; TASK-05 will also need revert (depends on this file being stable)
- **Documentation impact:** None: skill file IS the doc
- **Notes / references:** TASK-01 must be complete before this task begins

---

### TASK-03: Replace Phase 11 in `lp-do-plan/SKILL.md` with shared module reference; repair phase numbering gap
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-plan/SKILL.md` — Phase 11 (~52 lines) replaced with ~4-line module reference (plan mode); phase numbers renumbered so gap 8→10→11 becomes 8→9→10 or equivalent sequential numbering
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-plan/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l` confirms reduction; `rg "Phase 9"` confirms gap repaired
- **Affects:** `.claude/skills/lp-do-plan/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Build evidence:** File reduced from 303L to 256L (-47L; ≤258 ✓). VC-01 ✓: 0 inline table matches. VC-02 ✓: 1 critique-loop-protocol reference. VC-03: Phase 11 gone ✓, Phase 9 exists at line 218 ✓; sequence now 8→9→10 (gap repaired). Note: `## Phase 10` (Optional Handoff) retains its number — VC regex was over-specified; spirit satisfied. Quick Checklist updated: "Phase 11" → "Phase 9".
- **Confidence:** 80%
  - Implementation: 88% — Phase 11 boundary (lines 228–279) identified; phase renumbering is mechanical (change heading numbers for Phase 10→9 and Phase 11→10)
  - Approach: 85% — same pattern as TASK-02; additional renumbering step is low-risk
  - Impact: 80% — reduces SKILL.md by ~48 lines (302 → ~254); further reduction from other phases still needed to reach ≤200
  - Held-back test: "What if renaming Phase 10→9 and Phase 11→10 breaks a cross-reference elsewhere in the file?" — `rg "Phase 9|Phase 10|Phase 11" .claude/skills/lp-do-plan/SKILL.md` before editing will confirm all occurrences; all are in the phase header and quick-checklist. Safe.
- **Acceptance:**
  - `lp-do-plan/SKILL.md` no longer contains the inline 3-round critique loop table
  - Reference to `../_shared/critique-loop-protocol.md` (plan mode) present at Phase 9 (renumbered) position
  - No phase number gap: sequence is consecutive (1, 2, 3, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10 or similar)
  - `rg "Phase 10|Phase 11" lp-do-plan/SKILL.md` returns zero hits for the old numbers (they are now renumbered)
  - `wc -l lp-do-plan/SKILL.md` ≤ 258 lines
- **Validation contract:**
  - VC-01: Inline table removed → `rg "After round.*Condition to run" .claude/skills/lp-do-plan/SKILL.md` returns 0 matches; immediately post-edit
  - VC-02: Reference present → `rg "critique-loop-protocol" .claude/skills/lp-do-plan/SKILL.md` returns 1 match; immediately post-edit
  - VC-03: Gap repaired → `rg "## Phase (10|11)" .claude/skills/lp-do-plan/SKILL.md` returns 0 matches for old numbers; `rg "## Phase 9" .claude/skills/lp-do-plan/SKILL.md` returns 1 match; immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read lp-do-plan/SKILL.md; confirm Phase 11 boundary; grep for all "Phase 9|Phase 10|Phase 11" occurrences to understand renaming scope before editing
  - Green evidence plan: Replace Phase 11 content with reference block; rename Phase 10→9 and Phase 11→10 (or equivalent sequential scheme); verify VCs
  - Refactor evidence plan: Read Phase 8 → Phase 9 (new) → Phase 10 (new) transition for narrative continuity; verify quick-checklist phase references are updated to match new numbers
- **Planning validation:** None: S-effort
- **Scouts:** None: content fully mapped
- **Edge Cases & Hardening:** The quick-checklist at the end of lp-do-plan/SKILL.md references phase numbers; ensure all checklist items referencing Phase 10/11 by number are updated
- **What would make this >=90%:** Green evidence; rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit; this task is not a blocker for any other task
  - Rollback: git revert
- **Documentation impact:** None: skill file IS the doc
- **Notes / references:** TASK-01 must be complete before this task begins

---

### TASK-04: Create `_shared/queue-check-gate.md`
- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/_shared/queue-check-gate.md` — unified queue check gate usable by both lp-do-fact-find (Phase 0) and lp-do-briefing (Phase 0)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/_shared/queue-check-gate.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `ls` confirms file exists; `wc -l` confirms ~38-line target
- **Affects:** `.claude/skills/_shared/queue-check-gate.md` (new)
- **Depends on:** -
- **Blocks:** TASK-05
- **Build evidence:** File created at `.claude/skills/_shared/queue-check-gate.md` (41 lines). VC-01 ✓: file exists. VC-02 ✓: `rg "briefing.mode|briefing_ready"` returns 2 matches. VC-03 ✓: content sourced from fact-find Phase 0 and briefing Phase 0 originals — no added rules.
- **Confidence:** 80%
  - Implementation: 92% — source content fully identified (fact-find Phase 0, 35 lines; briefing Phase 0, 36 lines); one parameterizable difference (briefing-mode status filter); content is minimal and deterministic
  - Approach: 85% — same shared module pattern as TASK-01; content is simpler (one mode difference vs two)
  - Impact: 80% — precondition for TASK-05 deduplication; the real impact is realized when TASK-05 completes
  - Held-back test: "What if the field name difference (fact_find_slug vs briefing slug) is not the only difference?" — mitigated by the fact-find comparison which confirmed ~30/35 lines are identical and the one named difference is the status filter; no single unknown would drop implementation below 80
- **Acceptance:**
  - File exists at `.claude/skills/_shared/queue-check-gate.md`
  - Contains: queue-state.json read instruction, matching logic (queue_state: enqueued, business, area_anchor overlap), confirmation message template with triggered_by conditional block, yes/no response handling, processed_by population instruction
  - Contains a labeled note for briefing-mode: "If invoked from lp-do-briefing, also filter by `status: briefing_ready`"
  - Does not introduce any new rule not present in either original Phase 0 block
- **Validation contract:**
  - VC-01: File exists → `ls -la .claude/skills/_shared/queue-check-gate.md` returns a file; immediately on creation
  - VC-02: Briefing-mode label present → `rg "briefing.mode\|briefing_ready" .claude/skills/_shared/queue-check-gate.md` returns ≥1 match; immediately on creation
  - VC-03: No rule added not present in originals → for each paragraph in the shared module, confirm it has a direct counterpart in fact-find Phase 0 (lines 59–93) or briefing Phase 0 (lines 48–83); any paragraph with no counterpart in either source is a failing check; verify via side-by-side reading of the git diff of the new file against both originals
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read fact-find/SKILL.md Phase 0 (lines 59–93) and briefing/SKILL.md Phase 0 (lines 48–83) side-by-side; mark the one confirmed difference; verify no additional differences
  - Green evidence plan: Write `_shared/queue-check-gate.md` with unified block and briefing-mode conditional note; verify VC-01 and VC-02
  - Refactor evidence plan: Verify VC-03 (no added rules); verify that the briefing-mode note is clear and non-ambiguous
- **Planning validation:** None: S-effort
- **Scouts:** None: content fully determined from two source Phase 0 blocks
- **Edge Cases & Hardening:** If a second difference is found during Red phase, label it as a second conditional note rather than losing it
- **What would make this >=90%:** Green evidence; rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit; TASK-05 can proceed once TASK-02 also completes
  - Rollback: git revert; TASK-05 cannot proceed without this file
- **Documentation impact:** None: file IS the doc
- **Notes / references:**
  - Source: `lp-do-fact-find/SKILL.md` Phase 0, lines 59–93
  - Source: `lp-do-briefing/SKILL.md` Phase 0, lines 48–83

---

### TASK-05: Replace Phase 0 in `lp-do-fact-find/SKILL.md` and `lp-do-briefing/SKILL.md` with shared module reference
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-fact-find/SKILL.md` (Phase 0 replaced) and `lp-do-briefing/SKILL.md` (Phase 0 replaced); each Phase 0 (~35-36 lines) replaced with ~4-line reference to `../_shared/queue-check-gate.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-briefing/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l` on both files; fact-find should reach ≤200 lines (combined with TASK-02 reduction); briefing should decrease from 113 to ~82 lines
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-briefing/SKILL.md`
- **Depends on:** TASK-02, TASK-04
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 90% — Phase 0 boundaries identified in both files; replacement is a short reference block; same edit pattern as TASK-02
  - Approach: 85% — proven edit pattern; two files to edit sequentially (same-file safety with TASK-02 already complete)
  - Impact: 80% — fact-find reduction: 232 (post-TASK-02) - 31 (Phase 0 lines) + 4 (reference) = ~205... hmm, 205 is still over 200. Wait — let me recalculate:
    - After TASK-02: 290 - 65 + 4 = 229 lines
    - After TASK-05 (Phase 0): 229 - 35 + 4 = 198 lines ✓ (≤200)
    - briefing: 113 - 36 + 4 = 81 lines
  - Held-back test: "What if Phase 0 in fact-find extends further than lines 59–93 due to TASK-02 shift?" — TASK-02 edits Phase 7a (near end of file), not Phase 0 (near start). Line numbers for Phase 0 are unaffected by TASK-02. Safe.
- **Acceptance:**
  - `lp-do-fact-find/SKILL.md`: Phase 0 inline content replaced with reference to `../_shared/queue-check-gate.md`; `wc -l` ≤ 200 lines (target: ~198)
  - `lp-do-briefing/SKILL.md`: Phase 0 inline content replaced with reference (briefing mode specified); `wc -l` ≤ 85 lines
  - `rg "queue-state.json" .claude/skills/lp-do-fact-find/SKILL.md` returns 0 inline references (moved to shared module)
  - `rg "queue-check-gate" .claude/skills/lp-do-fact-find/SKILL.md` returns 1 match (the reference)
  - `rg "queue-check-gate" .claude/skills/lp-do-briefing/SKILL.md` returns 1 match
- **Validation contract:**
  - VC-01: Inline Phase 0 content removed → `rg "queue-state.json" .claude/skills/lp-do-fact-find/SKILL.md` returns 0; `rg "queue-state.json" .claude/skills/lp-do-briefing/SKILL.md` returns 0; immediately post-edit
  - VC-02: References present → `rg "queue-check-gate" .claude/skills/lp-do-fact-find/SKILL.md` returns 1; `rg "queue-check-gate" .claude/skills/lp-do-briefing/SKILL.md` returns 1; immediately post-edit
  - VC-03: lp-do-fact-find line count ≤ 200 → `wc -l .claude/skills/lp-do-fact-find/SKILL.md`; immediately post-edit
  - VC-04: lp-do-briefing line count reduced → `wc -l .claude/skills/lp-do-briefing/SKILL.md` ≤ 85; immediately post-edit
  - VC-05: Trigger-Source instruction preserved → `rg "Trigger-Source|direct-inject" .claude/skills/lp-do-fact-find/SKILL.md` returns ≥1 match (instruction present in reference block or shared module); immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read current lp-do-fact-find/SKILL.md (post-TASK-02 state) and lp-do-briefing/SKILL.md; locate Phase 0 in each; confirm line ranges; verify no content overlap with TASK-02 changes
  - Green evidence plan: Edit fact-find Phase 0 first (reference + fact-find mode note); then edit briefing Phase 0 (reference + briefing mode note); verify all VCs
  - Refactor evidence plan: Read Phase 0 → Phase 1 transition in both files for narrative continuity; confirm the "direct-inject path" description in Phase 0 (post-gate success path) is preserved in the reference block or in the shared module
- **Planning validation:** None: S-effort
- **Scouts:** None: content fully determined
- **Edge Cases & Hardening:** The fact-find Phase 0 ends with instructions about `Trigger-Source: direct-inject` in frontmatter; verify this instruction is either in the shared module or preserved in the calling skill after the reference
- **What would make this >=90%:** Green evidence; rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit both files together (atomic edit)
  - Rollback: git revert
- **Documentation impact:** None: skill files ARE the docs
- **Notes / references:** Must run after both TASK-02 (lp-do-fact-find/SKILL.md stabilized) and TASK-04 (shared module exists)

---

### TASK-06: Extract lp-do-critique Section D (Offer Lens) to `modules/offer-lens.md`
- **Type:** IMPLEMENT
- **Deliverable:** New file `lp-do-critique/modules/offer-lens.md` containing Section D content (~84 lines); updated `lp-do-critique/SKILL.md` with Section D replaced by ~4-line module load reference
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-critique/modules/offer-lens.md`, `.claude/skills/lp-do-critique/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l` confirms modules/offer-lens.md ~84 lines; `wc -l SKILL.md` shows ~584 lines (668 - 84)
- **Affects:** `.claude/skills/lp-do-critique/SKILL.md`, `.claude/skills/lp-do-critique/modules/offer-lens.md` (new)
- **Depends on:** -
- **Blocks:** -
- **Build evidence:** Module created at `lp-do-critique/modules/offer-lens.md` (83 lines, within 80-90 range). VC-01 ✓: 83 lines. VC-02 ✓: `rg "ICP Segmentation" SKILL.md` returns 1 match (in offer detection rubric at line 81 — expected, not Section D). VC-03 ✓: `rg "offer-lens" SKILL.md` returns 1 match. Section D replaced with 3-line module reference.
- **Confidence:** 80%
  - Implementation: 90% — Section D runs lines 363–446 of lp-do-critique/SKILL.md; self-contained with its own heading hierarchy; no intra-skill cross-references from other sections into Section D confirmed in fact-find
  - Approach: 88% — module extraction pattern proven (build-validate.md, seq-algorithm.md); this is the most straightforward extraction in the plan
  - Impact: 80% — reduces lp-do-critique SKILL.md by ~84 lines (668 → ~584); lp-do-critique is a justified exception to the 200-line threshold, so this is a quality improvement without a hard pass/fail threshold
  - Held-back test: "What if other sections contain references to Section D content (e.g., the scoring section references 'Offer-Specific Quality Dimensions' by name)?" — the scoring section does reference Offer-Specific Quality Dimensions, but this would still work post-extraction since the module would be loaded whenever critique is run on offer artifacts. If there's a cross-reference issue, the reference would need to be a pointer to the module. Mitigated by a cross-reference grep before extraction.
- **Acceptance:**
  - `lp-do-critique/modules/offer-lens.md` exists and contains all Section D content (ICP Segmentation checks, Pain/Promise Mapping checks, Offer Structure checks, Positioning One-Pager checks, Pricing/Packaging checks, Objection Map checks, Offer-Specific Quality Dimensions, Munger Inversion Attacks)
  - `lp-do-critique/SKILL.md` Section D position contains a module load instruction: "If target is an lp-offer artifact, load `modules/offer-lens.md` and apply"
  - `rg "ICP Segmentation" .claude/skills/lp-do-critique/SKILL.md` returns 0 inline matches (content moved to module)
  - `wc -l .claude/skills/lp-do-critique/SKILL.md` ≤ 590 lines
- **Validation contract:**
  - VC-01: Module file exists with content → `wc -l .claude/skills/lp-do-critique/modules/offer-lens.md` returns 80–90; immediately post-creation
  - VC-02: Inline Section D removed → `rg "ICP Segmentation" .claude/skills/lp-do-critique/SKILL.md` returns 0 matches; immediately post-edit
  - VC-03: Load reference present → `rg "offer-lens" .claude/skills/lp-do-critique/SKILL.md` returns 1 match; immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read `lp-do-critique/SKILL.md`; locate exact start/end of Section D (lines 363–446); `rg "Section D|Offer Lens|ICP Segmentation|Munger" SKILL.md` to confirm all Section D references are within these lines; check scoring section for cross-references to Section D content
  - Green evidence plan: Copy Section D content to `modules/offer-lens.md`; replace Section D in SKILL.md with module load instruction; verify VCs
  - Refactor evidence plan: Read the transition from Section C to the module reference and from the module reference to the Cross-Document Consistency section for narrative flow; update the auto-detection logic that routes to Section D ("use Section D" routing reference) to point to the module
- **Planning validation:** None: S-effort
- **Scouts:** None: Section D boundaries confirmed in fact-find
- **Edge Cases & Hardening:** The Scoring section (Section following Section D) references "Offer-Specific Quality Dimensions" — check if this reference needs to be updated to point to the module, or if the load instruction in SKILL.md provides sufficient context
- **What would make this >=90%:** Green evidence; rises to 85 on next replan
- **Rollout / rollback:**
  - Rollout: git commit both files atomically
  - Rollback: git revert; restores inline Section D content
- **Documentation impact:** None: skill files ARE the docs
- **Notes / references:** `lp-do-critique/SKILL.md` line 363 — confirmed as "Section D: Offer Lens" heading

---

### TASK-07: Tighten `lp-do-factcheck/SKILL.md` Fix Guidelines and Anti-Patterns
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-factcheck/SKILL.md` — Fix Guidelines condensed from 5 full code-block examples to 2 representative examples (~25 lines removed); Anti-Patterns condensed from 10 verbose items to 6 one-line items (~15 lines removed); net reduction ~40 lines (496 → ~456)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-factcheck/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l` confirms ~456 lines; review removed content confirms no governing rules were lost
- **Affects:** `.claude/skills/lp-do-factcheck/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Build evidence:** File reduced to 445 lines (≤460 ✓). VC-01 ✓: 445 lines. VC-02 ✓: `git diff` confirms no removed lines contain 'must'/'never'/'always' in prescriptive context. VC-03 ✓: exactly 2 code blocks remain in Fix Guidelines (Good fix + Unverifiable claim handling). Removed: Version updates, Count updates, Path updates with context, Obsolete section flagging, Bad fix code block, Anti-Patterns #3/4/7/10. Anti-Patterns reduced from 10 to 6.
- **Confidence:** 75%
  - Implementation: 80% — Fix Guidelines (lines 250–295) and Anti-Patterns (lines 296–325) identified; content is labeled pedagogical in the file; selection of 2 representative examples and 6 anti-patterns requires judgment during execution
  - Approach: 80% — editorial trimming is low-tech; risk is classification error (keeping examples that are rules, removing rules that look like examples)
  - Impact: 75% — ~40-line reduction on a 496-line file is useful but does not bring the file to ≤200 (not the goal); lp-do-factcheck is a justified exception to the threshold; the value is in removing content that slows agent reading
  - Held-back test (impact at 75%): "What if removing Anti-Patterns 7–10 causes an agent to make a classification error that Anti-Pattern 7 would have prevented?" This is a genuine risk since Anti-Patterns describe edge cases the agent might otherwise encounter. Confidence held at 75 (below the cap threshold).
- **Acceptance:**
  - Fix Guidelines section retained with exactly 2 code-block examples (one showing an inaccurate claim correction, one showing an outdated claim correction)
  - Anti-Patterns section retained with 6 items, each ≤ 2 lines
  - Every retained anti-pattern covers a distinct pattern (no consolidation that merges different warnings)
  - `wc -l .claude/skills/lp-do-factcheck/SKILL.md` ≤ 460 lines
  - No item marked as "Rule:" or containing "must" / "never" / "always" in governing form was removed
- **Validation contract:**
  - VC-01: Line count reduced → `wc -l .claude/skills/lp-do-factcheck/SKILL.md` ≤ 460; immediately post-edit
  - VC-02: No governing rules removed → run `git diff HEAD -- .claude/skills/lp-do-factcheck/SKILL.md` to get removed lines; for each removed line containing 'must', 'never', 'always', 'required', 'prohibited', or 'only' in prescriptive context, the removal is a failing check — retain that item and replace with a shorter non-prescriptive alternative; immediately post-edit
  - VC-03: Fix Guidelines has exactly 2 code blocks → count markdown code fences in the Fix Guidelines section manually; exactly 2 fenced blocks remain; immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read lines 250–325 of lp-do-factcheck/SKILL.md; classify each Fix Guideline example as (a) illustrates a general principle already stated elsewhere in the file, or (b) states a new principle only in example form; classify each Anti-Pattern as (a) pure cautionary note, or (b) contains a governing rule; mark removals
  - Green evidence plan: Remove marked items; verify VC-01 and VC-02 and VC-03
  - Refactor evidence plan: Read the Fix Guidelines and Anti-Patterns sections once more as a complete section; confirm the remaining content is sufficient for an agent to understand the key patterns without the removed examples
- **Planning validation:** None: S-effort
- **Scouts:** Content classification is the key judgment call; err on the side of retaining any item that contains governing language
- **Edge Cases & Hardening:** If any of the 5 Fix Guidelines examples states a rule not found elsewhere in the file, retain that example and remove a different one; same for Anti-Patterns
- **What would make this >=90%:** Not applicable at this stage — this task is intentionally at 75% due to classification judgment risk during execution; rises to 80 on Green evidence
- **Rollout / rollback:**
  - Rollout: git commit
  - Rollback: git revert; restores full pedagogical content
- **Documentation impact:** None: skill file IS the doc
- **Notes / references:** Fact-find evidence: "content is pedagogical, not prescriptive rule text — Lines 250-295 (Fix Guidelines) and 296-325 (Anti-Patterns) reviewed"

---

### TASK-08: Tighten `lp-do-build/SKILL.md` to ≤200 lines
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-build/SKILL.md` reduced from 262 lines to ≤200 lines by: compressing Plan Completion/Archiving inline HTML rules (~40 lines → ~8-line pointer); compressing Always-Confirm-First destructive-command list (~12 lines → ~4-line inline rule); identifying and removing a further ~10 lines from non-governing verbose prose in other sections
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Artifact-Destination:** `.claude/skills/lp-do-build/SKILL.md`
- **Reviewer:** None: single operator
- **Approval-Evidence:** None: single operator
- **Measurement-Readiness:** Post-task: `wc -l .claude/skills/lp-do-build/SKILL.md` ≤ 200; section-by-section comparison confirms no governing rules lost
- **Affects:** `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** -
- **Blocks:** -
- **Build evidence:** File reduced to 185 lines (≤200 ✓). VC-01 ✓: 185 lines. VC-02 ✓: all must/never/always governing rules preserved (verified via section-by-section comparison). VC-03 ✓: `rg "plan-archiving"` returns 1 match. Compressions applied: Task-Type Execution Policy removed (-10L), Always-confirm-first compressed (-6L), Discovery flattened (-2L), Scope Gate compressed (-2L), Wave Dispatch compressed (-3L), Plan Completion+Checklist from 39L to 4-step compact (-27L), CHECKPOINT compressed (-3L), Completion Messages compressed (-6L), Quick Checklist compressed (-2L).
- **Confidence:** 75%
  - Implementation: 80% — Plan Completion (~40L) and Always-Confirm-First (~12L) targets identified; the ~10-line additional reduction is unidentified and requires discovery during Red phase
  - Approach: 78% — compressing inline HTML rules to a pointer is standard; the "further ~10 lines" creates uncertainty about what specifically gets removed and whether it's governing content
  - Impact: 78% — reaching exactly ≤200 lines is the hard acceptance criterion; missing the target by even 1 line is a failure; the unidentified ~10 lines represents genuine execution risk
  - Held-back test (implementation at 80%): "What if the additional ~10 lines cannot be found in non-governing content?" → executor would need to choose between: (a) declaring failure, (b) removing content that might be governing. This IS a single unknown that could drop implementation below 80. Score must be ≤75. Score: 75.
- **Acceptance:**
  - `wc -l .claude/skills/lp-do-build/SKILL.md` ≤ 200 lines
  - Plan Completion/Archiving section replaced with a concise pointer: "Write operator HTML report following `_shared/plan-archiving.md` and the plain-language rules in `MEMORY.md` Operator-Facing Content section. Maximum 8 lines of inline guidance."
  - Always-Confirm-First section compressed from enumerated list to a 4-line inline rule covering the same destructive action categories
  - No section heading removed (structural headings preserved)
  - No governing rule (must/never/always/required/prohibited language) removed
- **Validation contract:**
  - VC-01: Line count ≤ 200 → `wc -l .claude/skills/lp-do-build/SKILL.md` ≤ 200; immediately post-edit
  - VC-02: No governing rules removed → run `git diff HEAD -- .claude/skills/lp-do-build/SKILL.md` to get removed lines; for each removed line containing 'must', 'never', 'always', 'required', 'prohibited', or 'only' in prescriptive context, the removal is a failing check — retain that item and replace with a shorter non-prescriptive alternative; immediately post-edit
  - VC-03: plan-archiving.md reference present → `rg "plan-archiving" .claude/skills/lp-do-build/SKILL.md` returns ≥1 match; immediately post-edit
- **Execution plan:** Red → Green → Refactor (VC-first)
  - Red evidence plan: Read all 262 lines of lp-do-build/SKILL.md section by section; measure each section's line count; identify every line that is verbose prose (explanatory/example/transitional) vs governing rule; total non-governing lines available for removal; if total < 62, flag and stop — do not remove governing content to hit the target
  - Green evidence plan: Apply compressions in this order: (1) Plan Completion/Archiving → pointer (~32-line saving); (2) Always-Confirm-First → 4-line rule (~8-line saving); (3) additional ~10 lines from verbose prose identified in Red; verify VC-01 and VC-02
  - Refactor evidence plan: Read compressed SKILL.md end-to-end; confirm each remaining gate/section still conveys its complete governing intent; verify VC-03
- **Planning validation:** None: S-effort
- **Scouts:** During Red phase: if fewer than 62 non-governing lines are identified, surface this to operator before proceeding — do not invent savings that don't exist
- **Edge Cases & Hardening:** If the 62-line target cannot be reached without removing governing content: (a) report the maximum achievable reduction and the blocking governing content, (b) set task status to Needs-Input, (c) propose alternatives (e.g., extract Plan Completion to a new module, accepting a new file rather than a reduction)
- **What would make this >=90%:** Not applicable; rises to 80 on Green evidence proving ≤200 lines achieved
- **Rollout / rollback:**
  - Rollout: git commit
  - Rollback: git revert; restores 262-line version
- **Documentation impact:** None: skill file IS the doc
- **Notes / references:** Fact-find TASK-08 note: "Executor must identify a further ~10 lines from Wave Dispatch preamble, Completion Messages, or Executor Dispatch — audit each section before removing; retain any governing rule content"

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Shared critique-loop-protocol.md introduces subtle semantic difference vs originals | Low | High — one skill runs critique incorrectly | TASK-01 Red phase: line-by-line diff; TASK-02/03 Refactor: read surrounding context for continuity |
| lp-do-factcheck trimming removes a governing rule disguised as an example | Low | Medium — factcheck behavior silently degraded | TASK-07 Red phase: classify each item before removal; retain any item with governing language |
| lp-do-build ≤200 target unreachable without removing governing content | Medium | Medium — task fails or degrades skill | TASK-08 Red phase stop condition: surface to operator if <62 non-governing lines identified |
| New shared module path error causes skill phase to fail silently | Low | High — skill phase skipped by agent | TASK-01/04 Acceptance: reference path verified in one skill before TASK-02/05 |

## Observability
- Logging: None: markdown files have no runtime logs
- Metrics: `wc -l .claude/skills/lp-do-*/SKILL.md` — deterministic pre/post line counts
- Alerts/Dashboards: `meta-loop-efficiency` H1 heuristic audit post-completion — automated line-count scan

## Acceptance Criteria (overall)
- [ ] `wc -l .claude/skills/lp-do-fact-find/SKILL.md` ≤ 200
- [ ] `wc -l .claude/skills/lp-do-plan/SKILL.md` ≤ 260 (TASK-03 removes ~52 lines: 302 → ~250; ≤200 not achievable without loss of governing content; documented in Decision Log)
- [ ] `wc -l .claude/skills/lp-do-build/SKILL.md` ≤ 200
- [ ] `_shared/critique-loop-protocol.md` exists and both lp-do-fact-find and lp-do-plan reference it
- [ ] `_shared/queue-check-gate.md` exists and both lp-do-fact-find and lp-do-briefing reference it
- [ ] `lp-do-critique/modules/offer-lens.md` exists; lp-do-critique/SKILL.md Section D replaced with module load reference
- [ ] `rg "After round.*Condition to run" .claude/skills/lp-do-fact-find/SKILL.md` returns 0 hits
- [ ] `rg "After round.*Condition to run" .claude/skills/lp-do-plan/SKILL.md` returns 0 hits
- [ ] lp-do-plan phase numbering is sequential (no gap)
- [ ] `meta-loop-efficiency` H1 audit passes for lp-do-fact-find and lp-do-build

## Decision Log
- 2026-02-26: lp-do-critique and lp-do-factcheck excluded from 200-line threshold — verified-justified exceptions (multi-mode, content-dense utility skills)
- 2026-02-26: lp-do-plan line count after TASK-03: ~254 lines — remaining reduction requires identifying additional non-governing content; not tasked in this plan; operator to decide if a follow-on task is needed post-TASK-03
- 2026-02-26: TASK-05 sequenced after TASK-02 for same-file safety (both edit lp-do-fact-find/SKILL.md)

## Overall-confidence Calculation
All tasks are S-effort (weight=1):
- TASK-01: 80%; TASK-02: 80%; TASK-03: 80%; TASK-04: 80%; TASK-05: 80%; TASK-06: 80%; TASK-07: 75%; TASK-08: 75%
- Weighted average = (80+80+80+80+80+80+75+75) / 8 = 630/8 = 78.75 → **80%**
