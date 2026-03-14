---
Type: Analysis
Status: Ready-for-planning
Domain: Repo
Workstream: Engineering
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: do-workflow-analysis-stage
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-analysis, lp-do-critique
Related-Fact-Find: docs/plans/do-workflow-analysis-stage/fact-find.md
Related-Plan: docs/plans/do-workflow-analysis-stage/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Analysis

## Decision Frame
### Summary
Choose how to move alternative exploration out of `lp-do-plan` while preserving a coherent DO workflow and artifact chain.

### Goals
- Keep fact-find focused on evidence gathering.
- Move option comparison and recommendation into a dedicated stage.
- Keep plan focused on executable task design.

### Non-goals
- Introduce runtime automation that bypasses existing workflow stages.
- Collapse fact-find and analysis into one heavier artifact.

### Constraints & Assumptions
- Constraints:
  - Must preserve `lp-do-ideas -> lp-do-fact-find` routing.
  - Must keep workflow artifacts in `docs/plans/<slug>/`.
- Assumptions:
  - The repo should have one canonical place for approach comparison, not duplicate logic in both fact-find and plan.

## Inherited Outcome Contract
- **Why:** Separate alternative exploration from task planning so planning can converge on execution instead of re-litigating approach choice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce an analysis stage and refactor the canonical DO workflow to `fact-find -> analysis -> plan -> build` with coherent artifacts, templates, and handoffs.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/do-workflow-analysis-stage/fact-find.md`
- Key findings used:
  - The old chain is encoded in AGENTS, feature workflow guide, loop-output contracts, skill docs, and templates.
  - `lp-do-plan` and `plan.md` currently still carry approach-selection responsibilities.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Boundary clarity | Prevents future stage drift | High |
| Workflow coherence | Keeps artifacts and docs in sync | High |
| Migration burden | Limits churn outside the core DO chain | Medium |
| Operator usability | Stages should be explainable and predictable | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Keep the old chain and just tell `lp-do-plan` to compare less | Small diff | Boundary remains implicit and easy to regress | Plan keeps leaking strategy work | No |
| B | Push alternative exploration fully into `lp-do-fact-find` | No new stage | Fact-find becomes discovery + recommendation + readiness in one artifact | Recombines evidence gathering and decision-making | Partial |
| C | Add a dedicated `lp-do-analysis` stage and `analysis.md` artifact between fact-find and plan | Clear separation of responsibilities; durable artifact chain | More files and docs to maintain | Requires broad workflow refactor | Yes |

## Chosen Approach
- **Recommendation:** Add a dedicated `lp-do-analysis` stage and `analysis.md` artifact between fact-find and plan.
- **Why this wins:** It gives fact-find, analysis, and planning distinct responsibilities with distinct artifact contracts. That matches the user’s requested separation and removes the hidden contradiction where planning both chooses and decomposes the approach.
- **What it depends on:** New skill/template, plan/fact-find contract updates, critique support, and canonical workflow reference updates.

### Rejected Approaches
- Option A — rejected because it relies on discipline instead of an artifact boundary; drift would recur.
- Option B — rejected because it overloads fact-find and makes evidence gathering less crisp.

### Open Questions (Operator Input Required)
None.

## Planning Handoff
- Planning focus:
  - Create the new `lp-do-analysis` skill and `analysis.md` template.
  - Refactor `lp-do-fact-find`, `lp-do-plan`, critique support, and templates around the new boundary.
  - Update canonical workflow docs and registry metadata.
- Validation implications:
  - Validate JSON for the skill registry.
  - Run diff hygiene checks on the touched markdown/doc files.
- Sequencing constraints:
  - Add `analysis` contract/template before refactoring downstream plan references.
  - Update fact-find auto-handoff before changing startup-loop website-first-build gating.
- Risks to carry into planning:
  - Specialist skills may still reference the old chain.
  - Documentation drift if the core contract and short guides diverge.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Specialist docs still mention the old chain | Medium | Medium | Not all specialist surfaces are equal priority | Patch the main current references and note residual drift |
| New analysis artifact not recognized by critique | High | Medium | Requires concrete skill/module/template edits | Add analysis lens and routing in critique |

## Planning Readiness
- Status: Go
- Rationale: The chosen approach is decisive, the affected surfaces are identified, and the implementation work is bounded to skill/docs/templates plus workflow metadata.
