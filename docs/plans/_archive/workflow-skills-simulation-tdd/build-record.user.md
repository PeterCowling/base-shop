---
Type: Build-Record
Plan-Slug: workflow-skills-simulation-tdd
Build-Date: 2026-02-27
Status: Complete
---

# Build Record: Workflow Skills Simulation TDD

## What Was Delivered

Three workflow skills (`lp-do-plan`, `lp-do-fact-find`, `lp-do-critique`) now include a structured simulation-trace step that agents run before emitting planning artifacts. A new shared protocol document defines the rules, categories, and output format that all three skills load by reference.

**Files created or modified:**

- **Created:** `/Users/petercowling/base-shop/.claude/skills/_shared/simulation-protocol.md`
  - Defines simulation as a structured forward trace of proposed artifact steps
  - 10-category issue taxonomy (missing precondition, circular dependency, undefined config key, API signature mismatch, type contract gap, missing data dependency, integration boundary not handled, scope gap in investigation, execution path not traced, ordering inversion)
  - 6 simulation limits (what simulation cannot catch)
  - Tiered gate rules: Critical findings = hard gate (block emission or require Simulation-Critical-Waiver); Major/Moderate/Minor = advisory
  - Simulation-Critical-Waiver format (3 required fields)
  - Trace output tables: plan trace (Step/Preconditions Met/Issues Found/Resolution Required) and fact-find trace (Scope Area/Coverage Confirmed/Issues Found/Resolution Required)
  - Scope simulation checklist (5 categories) for lp-do-fact-find Phase 5.5
  - Forward simulation trace instructions for lp-do-critique Step 5a

- **Modified:** `/Users/petercowling/base-shop/.claude/skills/lp-do-plan/SKILL.md`
  - Added `## Phase 7.5: Simulation Trace` between Phase 7 (Sequence) and Phase 8 (Persist Plan)
  - Phase 8 Status policy updated: `Status: Active` requires no unresolved Critical simulation findings
  - Quick Checklist item added for Phase 7.5

- **Modified:** `/Users/petercowling/base-shop/.claude/skills/lp-do-fact-find/SKILL.md`
  - Added `## Phase 5.5: Scope Simulation` between Phase 5 (Route to Module) and Phase 6 (Persist Artifact)
  - Scope described as a scope-gap check (not a code execution trace), using 5-category checklist from shared protocol
  - Hard gate: Critical blocks `Status: Ready-for-planning`
  - Quick Validation Gate item added for Phase 5.5

- **Modified:** `/Users/petercowling/base-shop/.claude/skills/lp-do-critique/SKILL.md`
  - Added `### Step 5a: Forward Simulation Trace` sub-section within Step 5 (Feasibility and Execution Reality)
  - Findings fold into Step 5 output with `[Simulation]` label (not a separate trace table)
  - Required Output Template `### 5)` renamed to "Feasibility, Execution Reality, and Simulation Trace" with explanation of simulation findings
  - Section numbers 6–11 updated to 6–12 (Hidden Assumptions, Logic, Contrarian, Risks, Missing, Concrete Fixes, Scorecard)
  - Autofix Phase reference updated from "Sections 1–11" to "Sections 1–12"
  - Core Method Step 6 (Contrarian Attacks) and Step 7 (Fix List) headings unchanged

## What Was Not Delivered (Non-goals)

- lp-do-build, lp-do-replan, lp-do-sequence: not changed
- lp-do-factcheck: not changed
- Plan templates, task templates, loop-output-contracts: not changed
- Simulation for lp-do-replan: deferred

## Validation Evidence

All plan acceptance criteria met and all task TCs passed:

| Task | TCs | Result |
|---|---|---|
| TASK-01 (shared protocol doc) | 5 TCs | All pass |
| TASK-CP-01 (protocol checkpoint) | Protocol verified | Pass |
| TASK-02 (lp-do-plan Phase 7.5) | 3 TCs | All pass |
| TASK-03 (lp-do-fact-find Phase 5.5) | 3 TCs | All pass |
| TASK-04 (lp-do-critique Step 5a) | 4 TCs | All pass |
| TASK-CP-02 (cross-reference verification) | All checks | Pass |

## Intended Outcome Check

**Stated outcome:** Three SKILL.md files updated with defined simulation steps at their correct insertion points, plus one shared simulation-protocol doc. Each simulation step specifies what the agent traces, what issue categories it looks for, and whether findings block or advise.

**Achieved:** Yes. All four files are in place. Each simulation step specifies its scope, the issue taxonomy (via shared protocol), and the gate rule (Critical = block, advisory otherwise). The shared protocol is the authoritative definition loaded by all three SKILL.md files.
