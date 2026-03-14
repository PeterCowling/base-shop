---
Type: Build-Record
Status: Complete
Domain: Repo
Last-reviewed: 2026-03-11
Feature-Slug: do-workflow-analysis-stage
Completed-date: 2026-03-11
artifact: build-record
---

# Build Record: DO Workflow Analysis Stage

## Outcome Contract

- **Why:** Separate alternative exploration from task planning so planning can converge on execution instead of re-litigating approach choice.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce an analysis stage and refactor the canonical DO workflow to `fact-find -> analysis -> plan -> build` with coherent artifacts, templates, and handoffs.
- **Source:** operator

## What Was Built

Added a first-class `lp-do-analysis` skill with dedicated track modules and a canonical `analysis.md` template. Refactored `lp-do-fact-find`, `lp-do-plan`, critique support, shared workflow contracts, templates, and startup-loop handoff docs so the core DO chain now runs `fact-find -> analysis -> plan -> build`. Updated the skill registry, canonical workflow guides, and adjacent workflow-facing skills so future sessions discover the new stage by default.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `python -m json.tool .agents/registry/skills.json >/dev/null` | Pass | Registry JSON validated after adding `lp-do-analysis` |
| `git diff --check -- AGENTS.md .agents/registry/skills.json .claude/skills/_shared/critique-loop-protocol.md .claude/skills/_shared/simulation-protocol.md .claude/skills/_shared/stage-doc-templates.md .claude/skills/_shared/workspace-paths.md .claude/skills/idea-forecast/SKILL.md .claude/skills/idea-generate/SKILL.md .claude/skills/lp-do-analysis/SKILL.md .claude/skills/lp-do-analysis/modules/analyze-business.md .claude/skills/lp-do-analysis/modules/analyze-code.md .claude/skills/lp-do-analysis/modules/analyze-mixed.md .claude/skills/lp-do-build/SKILL.md .claude/skills/lp-do-critique/SKILL.md .claude/skills/lp-do-critique/modules/analysis-lens.md .claude/skills/lp-do-critique/modules/fact-find-lens.md .claude/skills/lp-do-critique/modules/plan-lens.md .claude/skills/lp-do-fact-find/SKILL.md .claude/skills/lp-do-fact-find/modules/outcome-a-business.md .claude/skills/lp-do-fact-find/modules/outcome-a-code.md .claude/skills/lp-do-fact-find/modules/outcome-a-website-first-build.md .claude/skills/lp-do-factcheck/SKILL.md .claude/skills/lp-do-plan/SKILL.md .claude/skills/lp-onboarding-audit/SKILL.md .claude/skills/lp-signal-review/modules/emit-phase.md .claude/skills/startup-loop/SKILL.md .claude/skills/startup-loop/modules/cmd-advance/market-product-website-gates.md .claude/skills/startup-loop/modules/cmd-start.md .claude/skills/tools-index.md .claude/skills/tools-meta-reflect/SKILL.md docs/agents/feature-workflow-guide.md docs/business-os/startup-loop/contracts/loop-output-contracts.md docs/plans/_templates/analysis.md docs/plans/_templates/build-record.user.md docs/plans/_templates/fact-find-planning.md docs/plans/_templates/plan.md docs/plans/do-workflow-analysis-stage/analysis.md docs/plans/do-workflow-analysis-stage/build-record.user.md docs/plans/do-workflow-analysis-stage/fact-find.md docs/plans/do-workflow-analysis-stage/plan.md docs/registry.json` | Pass | No whitespace or patch-application errors in the touched workflow files |
| `pnpm docs:lint` | Fail (pre-existing repo issues) | Rebuilt `docs/registry.json`, but exited non-zero because of existing unrelated docs metadata violations in archive and audit docs |

## Validation Evidence

### TASK-01
- New skill created at `.claude/skills/lp-do-analysis/`.
- New critique lens created at `.claude/skills/lp-do-critique/modules/analysis-lens.md`.
- New template created at `docs/plans/_templates/analysis.md`.

### TASK-02
- `lp-do-fact-find` now emits `Ready-for-analysis` and auto-invokes `lp-do-analysis`.
- `lp-do-plan` now consumes `analysis.md` and inherits the selected approach.
- Loop contracts and templates now encode the analysis handoff.

### TASK-03
- AGENTS, feature-workflow guide, startup-loop handoffs, registry metadata, and adjacent workflow-facing skills now reference the new chain.

## Scope Deviations

None.
