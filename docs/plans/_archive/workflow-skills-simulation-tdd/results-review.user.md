---
Type: Results-Review
Status: Draft
Feature-Slug: workflow-skills-simulation-tdd
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- Shared simulation protocol is in place at `.claude/skills/_shared/simulation-protocol.md`. All three workflow skills now carry an explicit simulation step that loads the shared protocol.
- `lp-do-plan` will produce a `## Simulation Trace` table in every plan draft before setting `Status: Active`. Critical findings in that table block plan emission unless a Simulation-Critical-Waiver block is written.
- `lp-do-fact-find` will produce a scope trace table in every fact-find draft before setting `Status: Ready-for-planning`. The scope-gap check uses the 5-category checklist from the shared protocol.
- `lp-do-critique` will run a forward simulation trace in Step 5a on every critique pass and fold findings into Step 5 output with a `[Simulation]` label. Critical simulation findings surface in Section 2 (Top Issues) and Section 11 (Concrete Fixes).

## Standing Updates

- No standing updates: this was a skill-doc change. SKILL.md files are the standing artifacts for the workflow skills. The shared protocol doc at `.claude/skills/_shared/simulation-protocol.md` is itself a new standing artifact — no registration in a separate standing index is required as it follows the established `_shared/` pattern.

## New Idea Candidates

- Calibrate simulation false-positive rate from first Simulation-Critical-Waiver blocks | Trigger observation: The waiver format is new and has no usage data; the threshold for "Critical" may be miscalibrated on first use | Suggested next action: spike
- Add simulation to lp-do-replan (excluded from this 3-skill scope) | Trigger observation: replan produces new task sequences that are not simulation-checked by the current implementation | Suggested next action: create card
- Mechanistic linter for "Undefined config key" and "Missing precondition" simulation categories | Trigger observation: TC-02 for TASK-01 was verified by counting rows — this same count could be run deterministically | Suggested next action: defer

## Standing Expansion

- No standing expansion: the shared simulation protocol doc follows the existing `_shared/` load-by-reference convention and does not require a new standing artifact registration. The doc is self-documenting.

## Intended Outcome Check

- **Intended:** Three SKILL.md files updated with defined simulation steps at their correct insertion points, plus one shared simulation-protocol doc. Each simulation step specifies what the agent traces, what issue categories it looks for, and whether findings block or advise.
- **Observed:** All four files created/modified and verified. Simulation step in each SKILL.md specifies the trace scope (plan task sequence, fact-find investigation scope, or critique target execution path), the issue taxonomy (10 categories via shared protocol), and the gate rule (Critical = block with optional waiver, advisory otherwise). Cross-reference consistency verified by TASK-CP-02.
- **Verdict:** Met
- **Notes:** The lp-do-critique Required Output Template section renumbering (5→12 becoming 6→12 after inserting new Section 5) was not in the original acceptance criteria but was required for internal consistency — it was treated as part of TASK-04 scope and did not require a replan.
