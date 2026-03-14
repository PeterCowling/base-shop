---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo
Workstream: Engineering
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: do-workflow-analysis-stage
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-analysis, lp-do-critique
Related-Analysis: docs/plans/do-workflow-analysis-stage/analysis.md
Trigger-Why: Separate alternative exploration from task planning so planning can converge on execution instead of re-litigating approach choice.
Trigger-Intended-Outcome: type: operational | statement: Introduce an analysis stage and refactor the canonical DO workflow to fact-find -> analysis -> plan -> build with coherent artifacts, templates, and handoffs. | source: operator
---

# DO Workflow Analysis Stage Fact-Find Brief

## Scope
### Summary
Audit the current DO workflow and identify the minimum coherent repo changes required to insert a new `lp-do-analysis` stage between `lp-do-fact-find` and `lp-do-plan`.

### Goals
- Identify the canonical docs and templates that currently encode `fact-find -> plan -> build`.
- Confirm where approach selection currently leaks into planning.
- Produce evidence sufficient for an analysis decision on whether to add a separate stage.

### Non-goals
- Change `lp-do-ideas` routing to bypass fact-find.
- Introduce BOS API stage mutations for the DO workflow.
- Rewrite specialist downstream skills beyond references they depend on for the canonical chain.

### Constraints & Assumptions
- Constraints:
  - Preserve `lp-do-build` as the execution stage.
  - Keep the workflow filesystem-first.
  - Avoid adding a second competing source of truth for readiness thresholds.
- Assumptions:
  - The user’s stated preference is authoritative: alternative exploration belongs before planning.

## Outcome Contract

- **Why:** Separate alternative exploration from task planning so planning can converge on execution instead of re-litigating approach choice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce an analysis stage and refactor the canonical DO workflow to `fact-find -> analysis -> plan -> build` with coherent artifacts, templates, and handoffs.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `AGENTS.md` - canonical repo workflow rule currently states `lp-do-fact-find -> lp-do-plan -> lp-do-build`.
- `docs/agents/feature-workflow-guide.md` - short entrypoint guide for all agents.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` - canonical artifact chain and consumers.

### Key Modules / Files
- `.claude/skills/lp-do-fact-find/SKILL.md` - fact-find output and auto-continue behavior.
- `.claude/skills/lp-do-plan/SKILL.md` - current planning responsibilities include approach resolution pressure.
- `.claude/skills/lp-do-build/SKILL.md` - references canonical downstream chain from ideas.
- `.claude/skills/lp-do-critique/SKILL.md` and `modules/*.md` - critique schema currently recognizes fact-find and plan, not analysis.
- `docs/plans/_templates/fact-find-planning.md` - fact-find artifact template currently points straight to plan.
- `docs/plans/_templates/plan.md` - plan template currently contains option comparison / chosen approach fields.
- `.agents/registry/skills.json` - skill discovery metadata needs the new skill.

### Patterns & Conventions Observed
- Workflow stages are described both in skill docs and in canonical repo docs; both must be updated together.
- Templates are the durable contract boundary for future sessions.
- The repo already tolerates inserting new workflow artifacts under `docs/plans/<slug>/`.

### Dependency & Impact Map
- Upstream dependencies:
  - User directive that planning should stop doing alternative exploration.
- Downstream dependents:
  - `lp-do-fact-find`, `lp-do-plan`, `lp-do-build`, `lp-do-critique`
  - feature-workflow guide, loop-output contracts, skill registry
- Likely blast radius:
  - startup-loop DO handoff text
  - website-first-build DO path
  - reflection/meta docs that enumerate workflow skills

### Test Landscape
- No runtime code paths need execution for the core change; this is a documentation/skill workflow refactor.
- Validation needed:
  - JSON validity for `.agents/registry/skills.json`
  - diff hygiene / syntax sanity across touched markdown files

## Questions
### Resolved
- Q: Should alternative exploration stay in plan?
  - A: No. The user explicitly directed that it belongs before planning.
  - Evidence: user request in this session plus current plan-skill critique.

- Q: Is a dedicated analysis stage justified versus stuffing more into fact-find?
  - A: Yes. A dedicated artifact keeps evidence-gathering, option comparison, and task decomposition as three different responsibilities.
  - Evidence: current `lp-do-plan` carries approach-selection pressure; templates and contracts encode a two-stage pre-build chain.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 90%
  - Evidence basis: change surface is markdown/skill/docs only, with clear canonical files.
- Approach: 90%
  - Evidence basis: dedicated analysis stage cleanly matches the user’s requested boundary.
- Impact: 85%
  - Evidence basis: canonical docs and templates cover most future entrypoints, but some specialist skills may still mention the old chain.
- Delivery-Readiness: 90%
  - Evidence basis: no blocking external dependency or runtime migration required.
- Testability: 85%
  - Evidence basis: validation is mostly structural/document integrity rather than executable behavior.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Canonical docs updated but specialist docs drift | Medium | Medium | Update the main chain references and record residual drift explicitly |
| Plan template still encourages option comparison | High | High | Refactor `plan.md` template and `lp-do-plan` inheritance rules |
| Critique skill treats analysis as process-doc instead of first-class artifact | High | Medium | Add explicit analysis lens and routing |

## Planning Constraints & Notes
- Must keep `lp-do-build` unchanged as the execution stage.
- Must create a first-class `analysis.md` artifact and template.
- Must update workflow references, not just one skill file.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-analysis`
  - `lp-do-critique`
- Deliverable acceptance package:
  - new skill + template
  - refactored fact-find and plan boundaries
  - updated canonical workflow contracts and registry

## Scope Signal
- Signal: right-sized
- Rationale: the work is broad enough to touch multiple canonical docs, but bounded to the DO workflow surface and related metadata.

## Evidence Gap Review
### Gaps Addressed
- Located all canonical workflow docs that currently encode the old chain.
- Confirmed the plan template currently still carries option comparison responsibilities.

### Confidence Adjustments
- Increased approach confidence after confirming the old chain is encoded in both contracts and templates, not just one skill.

### Remaining Assumptions
- Some specialist skills outside the core DO workflow may continue to use `Ready-for-planning` semantics for standalone audit artifacts.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-analysis do-workflow-analysis-stage`
