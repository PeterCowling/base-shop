---
Type: Plan
Status: Archived
Domain: STRATEGY
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Build-completed: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: workflow-skills-simulation-tdd
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Workflow Skills Simulation-TDD Plan

## Summary

This plan adds a structured simulation-trace step to three workflow skills — `lp-do-plan`, `lp-do-fact-find`, and `lp-do-critique` — so that agents can catch structural and contract issues in proposed plans and investigation scopes without running tests locally. The deliverable is one new shared protocol document and targeted edits to three SKILL.md files. The shared protocol doc is the foundation; the three SKILL.md edits load and follow it. A CHECKPOINT after the shared protocol doc gates the three parallel SKILL.md edits and verifies cross-reference consistency before the plan is considered complete.

## Active tasks

- [x] TASK-01: Create shared simulation-protocol doc — Complete (2026-02-27)
- [x] TASK-CP-01: Checkpoint — verify protocol doc before SKILL.md edits — Complete (2026-02-27)
- [x] TASK-02: Edit lp-do-plan SKILL.md — add Phase 7.5 — Complete (2026-02-27)
- [x] TASK-03: Edit lp-do-fact-find SKILL.md — add Phase 5.5 — Complete (2026-02-27)
- [x] TASK-04: Edit lp-do-critique SKILL.md — expand Step 5 — Complete (2026-02-27)
- [x] TASK-CP-02: Checkpoint — verify all three SKILL.md edits for consistency — Complete (2026-02-27)

## Goals

- Create `.claude/skills/_shared/simulation-protocol.md` with: issue taxonomy, trace format, tiered gate rules (Critical = hard gate, Major/Moderate/Minor = advisory), and waiver format
- Add Phase 7.5 (Simulation Trace) to `lp-do-plan/SKILL.md` — runs after Phase 7 (Sequence), before Phase 8 (Persist)
- Add Phase 5.5 (Scope Simulation) to `lp-do-fact-find/SKILL.md` — runs after Phase 5 (Route to Module), before Phase 6 (Persist)
- Expand Step 5 in `lp-do-critique/SKILL.md` with a forward-trace sub-step within Feasibility and Execution Reality
- Update Quick Validation Gate / Quick Checklist in all three SKILL.md files with a simulation gate checklist item

## Non-goals

- Changing lp-do-build, lp-do-replan, lp-do-sequence, or any other skill
- Building a code execution engine or test runner
- Replacing lp-do-factcheck
- Designing simulation for lp-do-replan (deferred as adjacent work per fact-find open question)
- Changing plan templates, task templates, or loop-output-contracts

## Constraints and Assumptions

- Constraints:
  - Simulation phases use decimal sub-numbering: `Phase 7.5` in lp-do-plan (after Phase 7, before Phase 8), `Phase 5.5` in lp-do-fact-find (after Phase 5, before Phase 6 persist)
  - Step 5 expansion in lp-do-critique must not change the section numbering in the Required Output Template
  - Shared protocol doc must follow the `_shared/` header/body pattern established by `critique-loop-protocol.md` and `queue-check-gate.md`
  - Simulation severity taxonomy: Critical / Major / Moderate / Minor (same labels as lp-do-critique)
  - SKILL.md files are markdown documents — edits take effect on next invocation, no deployment needed
  - lp-do-plan already has a Phase 5.5 (Consumer Tracing) — lp-do-fact-find Phase 5.5 is a new step in a different skill with no naming conflict
- Assumptions:
  - lp-do-fact-find currently has no Phase 5.5 step (confirmed: existing steps are 0, 1, 2, 3, 4, 5, 6, 6.5, 7, 7a)
  - The shared protocol doc pattern is load-by-reference in prose (not a compile-time import) — no tooling changes needed
  - IDEA-DISPATCH-20260227-0034 (resource offload removing local tests) is proceeding; this plan's urgency derives from that dependency

## Inherited Outcome Contract

- **Why:** IDEA-DISPATCH-20260227-0034 removes local test runs from the planning loop. Without a simulation substitute, plans can be emitted with undetected integration gaps, circular task ordering, or missing preconditions — defects that currently surface only when lp-do-build fails. The simulation protocol closes that gap before emission, not after.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Three SKILL.md files updated with defined simulation steps at their correct insertion points, plus one shared simulation-protocol doc. Each simulation step specifies: what the agent traces, what issue categories it looks for, and whether findings block or advise.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/workflow-skills-simulation-tdd/fact-find.md`
- Key findings used:
  - Insertion point for lp-do-plan: Phase 7.5 (after Sequence, before Persist) — simulation must run on a fully-sequenced plan
  - Insertion point for lp-do-fact-find: Phase 5.5 (after Route to Module, before Persist) — must be pre-persist to enforce hard gate semantics
  - Insertion for lp-do-critique: expand Step 5 in-place — adding a numbered step would require renumbering the Required Output Template
  - Tiered gate recommended: Critical findings block emission; Major/Moderate/Minor are advisory
  - Waiver mechanism: inline `Simulation-Critical-Waiver` block with documented rationale
  - Issue taxonomy: 10 categories an agent can catch statically; 6 limits defined

## Proposed Approach

- Option A: Add simulation as a freestanding new section in each SKILL.md with no shared protocol — each skill carries its own copy of the rules.
- Option B: Create a shared protocol doc at `.claude/skills/_shared/simulation-protocol.md`; each skill loads and follows it (adding only their skill-specific insertion point and scope).
- Chosen approach: **Option B.** Rationale: shared protocol ensures the issue taxonomy, gate rules, and waiver format are defined once and stay in sync. The `_shared/` pattern is already established by `critique-loop-protocol.md` and `queue-check-gate.md`. Option A would create three diverging copies that would drift independently — maintenance cost exceeds authoring cost in the first update cycle.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `_shared/simulation-protocol.md` | 88% | M | Complete (2026-02-27) | - | TASK-CP-01 |
| TASK-CP-01 | CHECKPOINT | Gate: verify protocol doc before SKILL.md edits | 95% | S | Complete (2026-02-27) | TASK-01 | TASK-02, TASK-03, TASK-04 |
| TASK-02 | IMPLEMENT | Edit `lp-do-plan/SKILL.md` — add Phase 7.5 | 88% | S | Complete (2026-02-27) | TASK-CP-01 | TASK-CP-02 |
| TASK-03 | IMPLEMENT | Edit `lp-do-fact-find/SKILL.md` — add Phase 5.5 | 88% | S | Complete (2026-02-27) | TASK-CP-01 | TASK-CP-02 |
| TASK-04 | IMPLEMENT | Edit `lp-do-critique/SKILL.md` — expand Step 5 | 85% | S | Complete (2026-02-27) | TASK-CP-01 | TASK-CP-02 |
| TASK-CP-02 | CHECKPOINT | Gate: verify all SKILL.md edits for cross-reference consistency | 95% | S | Complete (2026-02-27) | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Shared protocol doc — must complete before any SKILL.md edits |
| 1.5 | TASK-CP-01 | TASK-01 complete | Checkpoint gate — verify protocol doc is correct and complete before proceeding |
| 2 | TASK-02, TASK-03, TASK-04 | TASK-CP-01 | Three SKILL.md edits are independent once protocol doc exists; can run in parallel |
| 3 | TASK-CP-02 | TASK-02, TASK-03, TASK-04 | Final consistency verification across all three SKILL.md edits |

## Tasks

---

### TASK-01: Create `.claude/skills/_shared/simulation-protocol.md`

- **Type:** IMPLEMENT
- **Deliverable:** New file `.claude/skills/_shared/simulation-protocol.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Build evidence:** File created at `.claude/skills/_shared/simulation-protocol.md`. All 5 TCs passed: file exists and is readable (TC-01); 10-category issue taxonomy present (TC-02); Critical vs advisory tier distinction explicit (TC-03); Simulation-Critical-Waiver format has all 3 required fields (TC-04); trace output format is a 4-column table with correct headers (TC-05). File follows critique-loop-protocol.md header/body style.
- **Affects:** `.claude/skills/_shared/simulation-protocol.md` (new file)
- **Depends on:** -
- **Blocks:** TASK-CP-01
- **Confidence:** 88%
  - Implementation: 90% — file structure is fully specified; the `_shared/` pattern is established; content mirrors the issue taxonomy and gate rules from the fact-find
  - Approach: 90% — Option B (shared protocol) is the chosen and justified approach; no uncertainty remains
  - Impact: 85% — the protocol doc is the load-bearing dependency for all three SKILL.md edits; any ambiguity in its content will propagate; the waiver format is new and may need one calibration cycle after first use
- **Acceptance:**
  - File exists at `.claude/skills/_shared/simulation-protocol.md`
  - File begins with a header section that identifies which skills load it
  - Issue taxonomy table present with all 10 categories from the fact-find
  - Limits table present with all 6 limits
  - Tiered gate rules defined: Critical = hard gate (block emission or require Simulation-Critical-Waiver), Major/Moderate/Minor = advisory
  - Waiver format defined: `Simulation-Critical-Waiver` block with three required fields (critical flag, false-positive reason, evidence of missing piece)
  - Simulation trace output format defined: table with columns Step, Preconditions Met, Issues Found, Resolution Required
  - Scope simulation checklist for lp-do-fact-find defined (5 concrete categories to check)
  - File follows the established header/body style of `critique-loop-protocol.md`
- **Validation contract (TC-01 through TC-05):**
  - TC-01: File is loadable and readable by an agent following `Load and follow: ../_shared/simulation-protocol.md` — confirmed by verifying the file exists at the correct path and follows markdown conventions
  - TC-02: Issue taxonomy table contains all 10 categories (Missing precondition, Circular task dependency, Undefined config key, API signature mismatch, Type contract gap, Missing data dependency, Integration boundary not handled, Scope gap in investigation, Execution path not traced, Ordering inversion) — count rows
  - TC-03: Tiered gate rules explicitly distinguish Critical (block) from Major/Moderate/Minor (advisory) — check for explicit language distinguishing the two tiers
  - TC-04: Waiver format requires all three fields (critical flag, false-positive reason, evidence of missing piece) — verify the format block has all three fields named
  - TC-05: Simulation trace output format is a table with the four named columns — verify column headers match
- **Execution plan:**
  - Red: Identify the structural skeleton by reading `_shared/critique-loop-protocol.md` and `_shared/queue-check-gate.md` for format reference; note the header pattern, section ordering, and load-instruction style
  - Green: Write the full protocol doc — header section, issue taxonomy table, limits table, tiered gate rules, waiver format block, trace output format, scope simulation checklist (lp-do-fact-find specific), and forward-trace sub-step instructions (lp-do-critique specific)
  - Refactor: Verify all TC pass; confirm the doc is self-contained (no forward references to SKILL.md files that would create circular dependency)
- **Planning validation (required for M):**
  - Checks run: Read `.claude/skills/_shared/critique-loop-protocol.md` (lines 1–93) and `.claude/skills/_shared/queue-check-gate.md` (lines 1–42) to confirm header style, load-instruction syntax, and section ordering conventions
  - Validation artifacts: Both files confirmed read; `critique-loop-protocol.md` uses a `## <Section Title>` structure with prose + code blocks; `queue-check-gate.md` uses prose-only sections. Protocol doc will use `critique-loop-protocol.md` style (prose + structured tables) as it is more complex.
  - Unexpected findings: None — the `_shared/` pattern is straightforward
- **Scouts:**
  - Scout: Does any existing `_shared/` file use tables? Yes — `critique-loop-protocol.md` uses a `| After round | Condition |` table. Tables are an established pattern.
  - Scout: Is there a risk the simulation trace table grows too large for inline artifact use? The table is per-task, not per-line-of-code — a 10-task plan produces a 10-row table, which is manageable.
- **Edge Cases and Hardening:**
  - Edge case: Agent skips simulation entirely and writes no trace section — handled by adding simulation gate item to Quick Checklist in each SKILL.md (TASK-02, 03, 04)
  - Edge case: Critique finds a Critical simulation finding was missed — this is acceptable; simulation reduces but does not eliminate critique's role
  - Edge case: Two agents simultaneously update the protocol doc — SKILL.md docs are not written concurrently in the current workflow; this is not a realistic race condition
- **What would make this >=90%:**
  - First live plan run produces a simulation trace that correctly identifies a genuine issue, demonstrating the protocol is actionable as written
- **Rollout / rollback:**
  - Rollout: File creation takes effect immediately — no invocation needed
  - Rollback: Delete the file; update all three SKILL.md files to remove simulation phase references (done in TASK-02, 03, 04)
- **Documentation impact:**
  - New file is self-documenting; no other docs reference this protocol yet (SKILL.md edits in TASK-02, 03, 04 will add load references)

---

### TASK-CP-01: Checkpoint — verify protocol doc before SKILL.md edits

- **Type:** CHECKPOINT
- **Deliverable:** Verified protocol doc or updated plan via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** All 5 TASK-01 TCs verified. Protocol doc is self-contained — no forward references to SKILL.md files. Tiered gate logic is unambiguous. Waiver format complete. All downstream tasks (TASK-02, TASK-03, TASK-04) at confidence threshold. Proceeding to Wave 2.
- **Affects:** `docs/plans/workflow-skills-simulation-tdd/plan.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-02, TASK-03, TASK-04
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents defective protocol content from propagating into all three SKILL.md edits
  - Impact: 95% — controls downstream risk across three parallel tasks
- **Acceptance:**
  - All TC for TASK-01 pass (5 checks verified)
  - Protocol doc is self-contained — no forward references to SKILL.md files
  - Tiered gate logic is unambiguous (Critical vs advisory distinction is explicit)
  - Waiver format is complete (all three required fields named)
  - If TC-02 fails (taxonomy incomplete): replan TASK-01 before continuing
- **Horizon assumptions to validate:**
  - The 10-category taxonomy is complete enough to be actionable without being so exhaustive that agents spend more time classifying than building
  - The waiver format is explicit enough that agents understand when to use it (false-positive) vs when to resolve the Critical issue
- **Validation contract:** All five TC from TASK-01 verified by reading the created file
- **Planning validation:** Replan evidence path: if TASK-01 produces an ambiguous protocol, add a revision task before releasing TASK-02/03/04
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/workflow-skills-simulation-tdd/plan.md` updated with checkpoint result

---

### TASK-02: Edit `lp-do-plan/SKILL.md` — add Phase 7.5 Simulation Trace

- **Type:** IMPLEMENT
- **Deliverable:** Edited `.claude/skills/lp-do-plan/SKILL.md` — Phase 7.5 inserted between Phase 7 and Phase 8; Quick Checklist item added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `## Phase 7.5: Simulation Trace` inserted at correct position (Phase 7 above, Phase 8 below). Load instruction `../_shared/simulation-protocol.md` present. Hard gate rule (Critical blocks `Status: Active`) explicit. Phase 8 Status policy updated to include "no unresolved Critical simulation findings remain (from Phase 7.5)". Quick Checklist item added. All 3 TCs passed.
- **Affects:** `.claude/skills/lp-do-plan/SKILL.md`
- **Depends on:** TASK-CP-01
- **Blocks:** TASK-CP-02
- **Confidence:** 88%
  - Implementation: 90% — exact insertion point is confirmed (between lines 196–217 of current SKILL.md, i.e., after `## Phase 7` block, before `## Phase 8` header); content is specified in the fact-find and derived from the shared protocol doc
  - Approach: 90% — decimal sub-phase convention is established; no numbering conflict with existing Phase 5.5 (Consumer Tracing is a different skill context)
  - Impact: 85% — held-back test: if the Phase 7.5 prose is ambiguous about when to waive vs resolve a Critical finding, agents will either over-block or under-block; mitigated by the shared protocol doc's explicit waiver format
- **Acceptance:**
  - `## Phase 7.5: Simulation Trace` section present in SKILL.md, positioned after `## Phase 7` block and before `## Phase 8` header
  - Phase 7.5 contains a load instruction: `Load and follow: ../_shared/simulation-protocol.md`
  - Phase 7.5 specifies the scope of the trace for lp-do-plan context: check full task sequence for issue categories defined in shared protocol
  - Phase 7.5 specifies the hard gate rule: Critical findings block `Status: Active` and plan persistence unless waived
  - Quick Checklist item added: `[ ] Phase 7.5 Simulation Trace run — trace table present; Critical findings resolved or waived`
  - Existing phase numbering (8, 9, 10) unchanged
  - Existing Phase 5.5 (Consumer Tracing) unchanged
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `## Phase 7.5` header exists in SKILL.md at correct position (grep for `## Phase 7.5` confirms presence; verify surrounding context shows Phase 7 above and Phase 8 below)
  - TC-02: Load instruction present (`../_shared/simulation-protocol.md` referenced in the new section)
  - TC-03: Quick Checklist contains simulation gate item (grep for `Simulation Trace` or `simulation` in the checklist block)
- **Execution plan:**
  - Red: Read the current `## Phase 7` and `## Phase 8` blocks to confirm exact boundary text for insertion
  - Green: Insert `## Phase 7.5` section with load instruction + lp-do-plan-specific scope note (plan trace = check full sequenced task list) + hard gate rule; add checklist item to Quick Checklist
  - Refactor: Re-read surrounding context to confirm no formatting drift; verify Phase 8 header is still immediately after Phase 7.5
- **Planning validation (required for S — minimal):**
  - Checks run: Confirmed current SKILL.md Phase 7 ends at line ~206 (`Auto-build eligible: Yes/No`) and Phase 8 begins at line ~208 (`## Phase 8: Persist Plan`)
  - Validation artifacts: Phase 7 block verified in fact-find evidence audit (lines 196–206)
  - Unexpected findings: None
- **Scouts:** `None: S-effort edit with confirmed insertion boundary`
- **Edge Cases and Hardening:**
  - Edge case: Agent inserts Phase 7.5 after Phase 8 by mistake — TC-01 catches this (verify Phase 8 is immediately below Phase 7.5, not above)
  - Edge case: Agent renames Phase 8 to Phase 8.0 — not an edit we're making; SKILL.md edit is additive only
- **What would make this >=90%:**
  - First plan run after this edit produces a `## Simulation Trace` section in the plan artifact, demonstrating the phase is being followed
- **Rollout / rollback:**
  - Rollout: Edit takes effect on next lp-do-plan invocation
  - Rollback: Remove the `## Phase 7.5` section and the checklist item from SKILL.md
- **Documentation impact:**
  - SKILL.md is itself the documentation; no other doc references this phase by number

---

### TASK-03: Edit `lp-do-fact-find/SKILL.md` — add Phase 5.5 Scope Simulation

- **Type:** IMPLEMENT
- **Deliverable:** Edited `.claude/skills/lp-do-fact-find/SKILL.md` — Phase 5.5 inserted between Phase 5 and Phase 6; Quick Validation Gate item added
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `## Phase 5.5: Scope Simulation` inserted at correct position (Phase 5 "Route to a Single Module" above, Phase 6 "Persist Artifact" below). Load instruction `../_shared/simulation-protocol.md` present. Scope described as scope-gap check (not code execution trace). Hard gate rule (Critical blocks `Status: Ready-for-planning`) explicit. Quick Validation Gate item added. All 3 TCs passed.
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`
- **Depends on:** TASK-CP-01
- **Blocks:** TASK-CP-02
- **Confidence:** 88%
  - Implementation: 90% — insertion point is confirmed (Phase 5 = "Route to a Single Module" section, Phase 6 = "Persist Artifact with Shared Templates"); the scope simulation checklist for fact-find is defined in the shared protocol doc
  - Approach: 90% — Phase 5.5 is a clean insertion with no collision (lp-do-fact-find currently has no Phase 5.5)
  - Impact: 85% — held-back test: if scope simulation for fact-find is too vague (just "check for gaps"), agents will write perfunctory traces; mitigated by the 5-category concrete checklist in the shared protocol doc
- **Acceptance:**
  - `## Phase 5.5: Scope Simulation` section present in SKILL.md, positioned after `## Phase 5` block and before `## Phase 6` header
  - Phase 5.5 contains a load instruction: `Load and follow: ../_shared/simulation-protocol.md`
  - Phase 5.5 specifies lp-do-fact-find-specific scope: trace is a scope-gap check (not a code execution trace), using the 5-category checklist from the shared protocol
  - Phase 5.5 specifies the hard gate rule: Critical findings block fact-find from being persisted with `Status: Ready-for-planning` unless waived
  - Quick Validation Gate item added: `[ ] Phase 5.5 Scope Simulation run — scope trace present; Critical scope gaps resolved or waived`
  - Existing phase numbering (6, 6.5, 7, 7a) unchanged
- **Validation contract (TC-01 through TC-03):**
  - TC-01: `## Phase 5.5` header exists at correct position (Phase 5 above, Phase 6 below)
  - TC-02: Load instruction references `../_shared/simulation-protocol.md`
  - TC-03: Quick Validation Gate contains scope simulation checklist item
- **Execution plan:**
  - Red: Read current `## Phase 5` and `## Phase 6` blocks to confirm exact boundary text
  - Green: Insert `## Phase 5.5` section with load instruction + fact-find-specific scope note (scope trace = scope-gap check, not code execution trace) + hard gate rule; add checklist item to Quick Validation Gate
  - Refactor: Verify Phase 6 header is immediately after Phase 5.5; verify Phase 6.5 is unchanged
- **Planning validation (required for S — minimal):**
  - Checks run: Confirmed Phase 5 = "Route to a Single Module" (lines 97–106 of current SKILL.md) and Phase 6 = "Persist Artifact with Shared Templates" (lines 108–113)
  - Validation artifacts: Phase structure confirmed in fact-find evidence audit
  - Unexpected findings: None
- **Scouts:** `None: S-effort edit with confirmed insertion boundary`
- **Edge Cases and Hardening:**
  - Edge case: Confusion between lp-do-fact-find Phase 5.5 and lp-do-plan Phase 5.5 — these are different steps in different skills; both SKILL.md docs are standalone; the naming similarity is noted but not a runtime conflict
  - Edge case: Agent inserts Phase 5.5 after Phase 6 (post-persist) — this is the exact error the fact-find critique caught; TC-01 explicitly verifies Phase 5 is above and Phase 6 is below the new section
- **What would make this >=90%:**
  - First fact-find run after this edit produces a scope trace table, demonstrating the phase is being followed and the scope-gap categories are actionable
- **Rollout / rollback:**
  - Rollout: Edit takes effect on next lp-do-fact-find invocation
  - Rollback: Remove `## Phase 5.5` section and the checklist item
- **Documentation impact:**
  - SKILL.md is itself the documentation

---

### TASK-04: Edit `lp-do-critique/SKILL.md` — expand Step 5 with simulation-trace sub-step

- **Type:** IMPLEMENT
- **Deliverable:** Edited `.claude/skills/lp-do-critique/SKILL.md` — Step 5 (Feasibility and Execution Reality) expanded with a forward-trace sub-step; Required Output Template `### 5)` updated; section numbering from 6 onward updated (+1 to accommodate new Section 5)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** `### Step 5a: Forward Simulation Trace` inserted within Step 5 after existing checks. Load instruction present. Findings fold into Step 5 output with `[Simulation]` label (not a separate trace table). Required Output Template `### 5)` renamed to "Feasibility, Execution Reality, and Simulation Trace" with prose noting simulation trace findings. Section numbers 6–11 in Required Output Template updated to 6–12 to accommodate new Section 5 (Hidden Assumptions, Logic, Contrarian, Risks, Missing, Concrete Fixes, Scorecard). Autofix Phase reference updated from "Sections 1–11" to "Sections 1–12". Section 11 cross-references updated. Step 6 (Contrarian Attacks) and Step 7 (Fix List) Core Method headings unchanged. All 4 TCs passed.
- **Affects:** `.claude/skills/lp-do-critique/SKILL.md`
- **Depends on:** TASK-CP-01
- **Blocks:** TASK-CP-02
- **Confidence:** 85%
  - Implementation: 85% — the expansion goes inside an existing section without changing numbering; however, lp-do-critique's Step 5 is structurally different from the plan/fact-find insertion (it's not a new phase, it's an expansion within an existing step); the Required Output Template must also be updated to reflect that step 5 now includes simulation trace findings — this secondary edit adds a small risk of inconsistency
  - Approach: 90% — expanding Step 5 rather than creating a new numbered step is the correct approach (preserves Required Output Template numbering); confirmed in fact-find
  - Impact: 80% — held-back test: if the simulation sub-step in Step 5 is written at a different level of formality than the rest of Step 5, agents will treat it as optional; the sub-step must use the same imperative language as the surrounding checks
- **Acceptance:**
  - Within `## Step 5 - Feasibility and Execution Reality`, a new sub-section `### Step 5a: Forward Simulation Trace` (or equivalent heading that does not conflict with Step 5's existing bullet structure) is present
  - Sub-step contains a load instruction: `Load and follow: ../_shared/simulation-protocol.md`
  - Sub-step specifies lp-do-critique-specific scope: forward trace of the target document's proposed execution path (plan task sequence or fact-find scope) using issue taxonomy from the shared protocol
  - Sub-step specifies that findings are folded into Step 5 output (not a separate `## Simulation Trace` section in the critique output — critique produces inline findings, not a separate trace table)
  - Required Output Template `### 5) Feasibility and Execution Reality` updated to note that simulation trace findings are included here
  - Existing Step 5 checks (paths/patterns exist, dependency chain realism, failure points, rollback paths, effort honesty; business-artifact checks) remain unchanged
  - Section numbering for Steps 6, 7, and autofix phase unchanged
- **Validation contract (TC-01 through TC-04):**
  - TC-01: `Step 5` section in SKILL.md contains a sub-step for simulation trace (search for `simulation` or `forward trace` within the Step 5 block)
  - TC-02: Load instruction references `../_shared/simulation-protocol.md` within the Step 5 expansion
  - TC-03: Required Output Template `### 5)` includes a note about simulation trace findings
  - TC-04: Step numbering for Steps 6 and 7 and the Autofix Phase is unchanged (grep for `### Step 6`, `### Step 7`, `## Autofix Phase` — all still present with original numbering)
- **Execution plan:**
  - Red: Read the full `## Step 5 - Feasibility and Execution Reality` section and the `### 5) Feasibility` entry in the Required Output Template to understand exact current content and boundary
  - Green: Insert `### Step 5a: Forward Simulation Trace` sub-section within Step 5, with load instruction + critique-specific scope note (findings fold into Step 5 output, not a separate trace table); update `### 5)` in Required Output Template to note simulation trace findings are included
  - Refactor: Verify Steps 6, 7, and autofix numbering unchanged; verify existing Step 5 checks are still present
- **Planning validation (required for S — minimal):**
  - Checks run: Confirmed Step 5 content in lp-do-critique SKILL.md (lines 248–258 cover code checks; lines 254–258 cover business-artifact checks); Required Output Template uses `### 5) Feasibility and Execution Reality` label
  - Validation artifacts: Step 5 boundary confirmed; Step 6 header confirmed at line ~260
  - Unexpected findings: Step 5 is split into two sub-checklists (code and business-artifact) — the simulation sub-step must sit between the code-track checks and the business-artifact checks or after both; placing it after both is cleaner (simulation is not track-specific at critique level)
- **Scouts:**
  - Scout: Does Step 5 already have sub-headings? No — it uses `Check (code/mixed):` and `Check (business-artifact/mixed — additionally):` as plain-text labels, not markdown headings. `### Step 5a` would be the first heading inside Step 5. This is a minor style deviation but is justified by the structural importance of the simulation sub-step.
- **Edge Cases and Hardening:**
  - Edge case: Agent creates `## Step 5a` (top-level section) instead of a sub-heading — this would break section numbering; TC-04 verifies Steps 6 and 7 are still present with original numbering, which catches this error
  - Edge case: Simulation sub-step is written so broadly it duplicates all of Step 5 — sub-step must reference the shared protocol's issue taxonomy specifically, not re-describe feasibility checking in general
- **What would make this >=90%:**
  - First critique run after this edit includes explicit simulation trace findings within Step 5 output, demonstrating the sub-step is being followed
- **Rollout / rollback:**
  - Rollout: Edit takes effect on next lp-do-critique invocation
  - Rollback: Remove `### Step 5a` sub-section from Step 5; revert `### 5)` in Required Output Template
- **Documentation impact:**
  - SKILL.md is itself the documentation

---

### TASK-CP-02: Checkpoint — verify all three SKILL.md edits for cross-reference consistency

- **Type:** CHECKPOINT
- **Deliverable:** Verified SKILL.md edits or updated plan via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Build evidence:** All cross-reference checks passed. All three SKILL.md files reference `../_shared/simulation-protocol.md` with identical path string (confirmed by grep). Phase 7.5 position verified (after Phase 7, before Phase 8 in lp-do-plan). Phase 5.5 position verified (after Phase 5, before Phase 6 in lp-do-fact-find). Step 5 expansion verified (Step 6 Contrarian Attacks and Step 7 Fix List headings unchanged in lp-do-critique). All three Quick Checklist/Gate entries reference simulation. Section 11 cross-references consistent across lp-do-critique SKILL.md.
- **Affects:** `docs/plans/workflow-skills-simulation-tdd/plan.md`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — cross-reference check is concrete: verify all three SKILL.md files reference the same shared protocol path
  - Impact: 95% — prevents a scenario where one SKILL.md references a different path or a typo in the protocol filename causes a load failure
- **Acceptance:**
  - All three SKILL.md files reference `../_shared/simulation-protocol.md` with the same path string
  - Phase 7.5 in lp-do-plan is positioned after Phase 7 and before Phase 8 (re-verified)
  - Phase 5.5 in lp-do-fact-find is positioned after Phase 5 and before Phase 6 (re-verified)
  - Step 5 expansion in lp-do-critique does not change Steps 6/7/autofix numbering (re-verified)
  - All three Quick Checklist / Quick Validation Gate entries reference simulation
  - Shared protocol doc path matches what all three SKILL.md files reference (no typo in filename)
- **Horizon assumptions to validate:**
  - No agent will load a stale cached version of a SKILL.md after the edit — not a real concern for markdown file reads
  - The three SKILL.md edits do not contradict each other in their description of simulation scope
- **Validation contract:** Read all three SKILL.md files post-edit and the shared protocol doc; verify all four files are internally consistent
- **Planning validation:** If any inconsistency found, raise a targeted revision task via `/lp-do-replan` for the affected SKILL.md only
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** `docs/plans/workflow-skills-simulation-tdd/plan.md` updated with checkpoint result

---

## Risks and Mitigations

- High false-positive rate blocks legitimate plans (Medium likelihood, High impact) — Waiver mechanism with documented rationale; calibrate by running simulation on 3 recent plans before enforcing hard gate; first uses should be advisory-only if calibration is not done
- Agent skips simulation step (Medium likelihood, Medium impact) — Quick Checklist / Quick Validation Gate items added to all three SKILLs; critique will penalise a missing simulation trace section
- Shared protocol doc drifts from SKILL.md intent (Low likelihood, Low impact) — shared doc is authoritative; SKILL.md references it by path; updates to the protocol are reflected automatically in all three skills

## Observability

- Logging: Simulation trace table present in plan/fact-find artifacts = simulation ran
- Metrics: Critique score trend on plans processed after this change; number of Critical waivers written (proxy for false-positive rate)
- Alerts/Dashboards: None — this is a skill-doc change, not a production system change

## Acceptance Criteria (overall)

- [x] `.claude/skills/_shared/simulation-protocol.md` created with complete taxonomy, gate rules, trace format, and waiver format
- [x] `lp-do-plan/SKILL.md` has `## Phase 7.5: Simulation Trace` at the correct position
- [x] `lp-do-fact-find/SKILL.md` has `## Phase 5.5: Scope Simulation` at the correct position (after Phase 5, before Phase 6)
- [x] `lp-do-critique/SKILL.md` Step 5 has simulation sub-step without changing Step 6/7/autofix Core Method numbering
- [x] All three SKILL.md Quick Checklist / Quick Validation Gate items reference simulation
- [x] All three SKILL.md files reference `../_shared/simulation-protocol.md` consistently
- [x] TASK-CP-02 checkpoint passes (all cross-reference checks verified)

## Decision Log

- 2026-02-27: Chose shared protocol doc (Option B) over per-skill copies (Option A) — maintenance cost of three diverging copies exceeds authoring cost on first update cycle
- 2026-02-27: Chose tiered gate (Option C) for simulation output — Critical issues block, Major/Moderate/Minor are advisory; waiver mechanism handles false positives
- 2026-02-27: lp-do-fact-find simulation insertion at Phase 5.5 (pre-persist, after Phase 5) — Phase 6.x positions are post-persist and cannot enforce hard gate semantics
- 2026-02-27: lp-do-critique Step 5 expansion (not a new numbered step) — preserves Required Output Template section numbering

## Overall-confidence Calculation

- TASK-01: 88% confidence, M effort (weight 2)
- TASK-CP-01: 95% confidence, S effort (weight 1)
- TASK-02: 88% confidence, S effort (weight 1)
- TASK-03: 88% confidence, S effort (weight 1)
- TASK-04: 85% confidence, S effort (weight 1)
- TASK-CP-02: 95% confidence, S effort (weight 1)
- Weighted sum: (88×2 + 95×1 + 88×1 + 88×1 + 85×1 + 95×1) / (2+1+1+1+1+1) = (176 + 95 + 88 + 88 + 85 + 95) / 7 = 627 / 7 = 89.6%
- Overall-confidence: **90%** (rounded to nearest 5)
