---
Type: Plan
Status: Archived
Domain: Repo
Workstream: Engineering
Created: 2026-03-11
Last-reviewed: 2026-03-11
Last-updated: 2026-03-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: do-workflow-analysis-stage
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-analysis, lp-do-critique
Overall-confidence: 90%
Confidence-Method: weighted judgment from evidence clarity, bounded surface area, and mostly documentation-only execution
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/do-workflow-analysis-stage/analysis.md
artifact: plan
---

# DO Workflow Analysis Stage Plan

## Summary
Add a first-class `lp-do-analysis` stage between `lp-do-fact-find` and `lp-do-plan`, then refactor the canonical DO workflow docs, templates, critique rules, and startup-loop handoffs to use `fact-find -> analysis -> plan -> build`. The implementation keeps build as the execution stage and preserves ideas routing into fact-find. Planning no longer owns broad approach comparison; it inherits a chosen direction from analysis and focuses on executable tasks.

## Active tasks
- [x] TASK-01: Add `lp-do-analysis` skill and `analysis.md` artifact contract
- [x] TASK-02: Refactor fact-find/plan/critique/templates around the new boundary
- [x] TASK-03: Update canonical workflow references, registry, and startup-loop handoffs

## Goals
- Separate evidence gathering, option comparison, and task decomposition into three stages.
- Ensure the canonical docs and templates encode the same chain.
- Leave the repo with one clear place for alternative exploration.

## Non-goals
- Build live BOS automation for the new stage.
- Change `lp-do-ideas` to route directly to analysis.

## Constraints & Assumptions
- Constraints:
  - Filesystem-first workflow remains the source of truth.
  - `lp-do-build` remains the only execution stage.
- Assumptions:
  - Updating the canonical workflow surfaces is sufficient for future sessions to discover the new stage cleanly.

## Inherited Outcome Contract
- **Why:** Separate alternative exploration from task planning so planning can converge on execution instead of re-litigating approach choice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce an analysis stage and refactor the canonical DO workflow to `fact-find -> analysis -> plan -> build` with coherent artifacts, templates, and handoffs.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/do-workflow-analysis-stage/analysis.md`
- Selected approach inherited:
  - Add a dedicated `lp-do-analysis` stage and refactor the canonical chain around it.
- Key reasoning used:
  - Explicit stage boundaries reduce future drift more reliably than lighter wording changes.

## Selected Approach Summary
- What was chosen:
  - Create a new `analysis` artifact and skill, then refactor fact-find and plan to hand off through it.
- Why planning is not reopening option selection:
  - The option comparison was completed in `analysis.md`; this plan only decomposes the chosen direction into implementation work.

## Fact-Find Support
- Supporting brief: `docs/plans/do-workflow-analysis-stage/fact-find.md`
- Evidence carried forward:
  - The old chain was encoded in canonical docs, templates, and startup-loop handoffs.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `lp-do-analysis`, `analysis.md` template, and critique support | 90% | M | Complete (2026-03-11) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Refactor `lp-do-fact-find`, `lp-do-plan`, templates, and contracts to use analysis handoff | 90% | M | Complete (2026-03-11) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Update canonical workflow references, startup-loop handoffs, and registry metadata | 85% | M | Complete (2026-03-11) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | New stage and contract surfaces first |
| 2 | TASK-02 | TASK-01 | Boundary refactor after new artifact exists |
| 3 | TASK-03 | TASK-02 | Canonical reference cleanup after boundary is stable |

## Tasks

### TASK-01
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Deliverable:** workflow refactor
- **Affects:** `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-analysis/modules/*`, `.claude/skills/lp-do-critique/*`, `docs/plans/_templates/analysis.md`
- **Acceptance:** `lp-do-analysis` exists as a first-class skill; `analysis.md` exists as a first-class artifact template; critique can recognize analysis docs.
- **Build evidence:** Completed by adding the new skill, track modules, analysis template, and critique analysis lens.

### TASK-02
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Deliverable:** workflow refactor
- **Affects:** `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `docs/plans/_templates/fact-find-planning.md`, `docs/plans/_templates/plan.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `.claude/skills/_shared/critique-loop-protocol.md`, `.claude/skills/_shared/simulation-protocol.md`
- **Acceptance:** Fact-find ends at analysis readiness; plan consumes analysis rather than choosing among options; contracts/templates encode the same boundary.
- **Build evidence:** Completed by updating statuses, inheritance rules, readiness gates, and artifact chain docs/templates.

### TASK-03
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Deliverable:** workflow refactor
- **Affects:** `AGENTS.md`, `docs/agents/feature-workflow-guide.md`, `.claude/skills/startup-loop/*`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/idea-generate/SKILL.md`, `.claude/skills/idea-forecast/SKILL.md`, `.claude/skills/_shared/workspace-paths.md`, `.agents/registry/skills.json`
- **Acceptance:** Current canonical workflow references and startup-loop website-first-build handoffs describe the new chain consistently.
- **Build evidence:** Completed by updating the canonical short guides, startup-loop handoff docs, and skill discovery metadata.

## Validation Contracts
- TC-01: `.agents/registry/skills.json` parses as valid JSON.
- TC-02: touched markdown/skill files are free of whitespace/diff-check errors.
- TC-03: canonical workflow docs and startup-loop handoffs reference `fact-find -> analysis -> plan -> build` consistently.

## Open Decisions
None.

## Risks & Mitigations
- Specialist skills may still reference the old chain.
  - Mitigation: updated canonical workflow surfaces and noted residual risk.
- Analysis stage could be documented but not discoverable.
  - Mitigation: added to registry, guide, templates, and contracts.

## Observability
- Logging: None: documentation/skill workflow refactor.
- Metrics: None: no runtime behavior changed.
- Alerts/Dashboards: None: no production system changed.

## Acceptance Criteria (overall)
- [x] `lp-do-analysis` exists as a first-class skill and template-backed artifact.
- [x] `lp-do-fact-find` now hands off to analysis, not directly to plan.
- [x] `lp-do-plan` now inherits a chosen approach from analysis and focuses on task decomposition.
- [x] Canonical workflow docs and startup-loop handoffs reflect the new chain.

## Decision Log
- 2026-03-11: Chose a dedicated analysis stage over making fact-find or plan heavier.

## Overall-confidence Calculation
- Overall-confidence = 90%
- Reason: the surface area is broad but static, the user direction is explicit, and the change is primarily to workflow docs/templates/skills rather than runtime code.
