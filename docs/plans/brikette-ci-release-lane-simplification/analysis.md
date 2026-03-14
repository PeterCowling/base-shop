---
Type: Analysis
Status: Ready-for-planning
Domain: Infra
Workstream: Engineering
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-ci-release-lane-simplification
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-analysis, lp-do-critique
Related-Fact-Find: docs/plans/brikette-ci-release-lane-simplification/fact-find.md
Related-Plan: docs/plans/brikette-ci-release-lane-simplification/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Brikette CI Release Lane Simplification Analysis

## Decision Frame
### Summary
Choose the simplest GitHub Actions shape for Brikette now that the operator has resolved the main policy forks: changed-scope validation in CI, merge-only staging and production publishes, no manual publish entrypoints, no publish when nothing Brikette-relevant changed, and no Brikette-specific smoke/static-export gating on `dev`.

### Goals
- Make `dev` validation easy to reason about: changed-scope lint, typecheck, and tests in CI only.
- Make `staging` the preview lane for humans and agents, entered by merge only.
- Make `main` the live lane, entered by merge only.
- Remove overlapping Brikette workflow responsibility and manual publish paths.

### Non-goals
- Re-architect Brikette's static export shape or Cloudflare Pages footprint.
- Solve every repo-wide CI governance concern unrelated to Brikette release flow.
- Introduce bespoke file-level classifiers beyond what the push diff and its affected surface require.

### Constraints & Assumptions
- Constraints:
  - Changed scope is defined by what is in the push and its affected dependency/workspace surface, with lint, typecheck, and tests run only where relevant.
  - Brikette-specific smoke/static-export checks are deferred from `dev`; the first export proof point moves to merge-driven staging.
  - `staging` and `main` are merge-only publish lanes with no `workflow_dispatch` fallback.
  - `staging` and `main` should skip publication when no Brikette-relevant paths changed.
- Assumptions:
  - The current Pages staging host is sufficient for MCP and Playwright usage.
  - Consolidating workflows is preferable to preserving reusable workflow abstractions if the abstraction is part of the current complexity.

## Inherited Outcome Contract
- **Why:** The current Brikette CI and deploy flow is harder to reason about than it should be. The operator wants one straightforward release model: changed-only validation on dev, staging as the preview lane reached by merge, and main as the live lane reached by merge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette has an analysis-ready fact-find for a simplified GitHub Actions setup where dev performs changed-only lint, typecheck, and tests in CI, staging is a merge-only preview lane, and main is a merge-only production lane.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brikette-ci-release-lane-simplification/fact-find.md`
- Key findings used:
  - `ci.yml` already contains the repo's strongest changed-scope lint/typecheck/test primitives, but widens beyond the Brikette requirement in a few steps.
  - `brikette.yml` mixes dev validation, reusable release CI, and production publish responsibilities in one file.
  - `brikette-staging-fast.yml` already behaves like the desired preview lane apart from manual dispatch and duplication.
  - Branch-promotion scripts already make `staging` and `main` operationally merge-driven.

## Analysis Gates
- **Evidence Gate:** Pass
  - `fact-find.md` exists, is `Ready-for-analysis`, includes the outcome contract, and includes an engineering coverage matrix for `Execution-Track: code`.
  - The current-state workflow evidence is sufficient to compare simplification options without reopening discovery.
- **Option Gate:** Pass
  - Three approaches were compared explicitly, including one recommended path and two rejected alternatives.
- **Planning Handoff Gate:** Pass
  - The recommendation is decisive, rejected options are documented, no operator-only questions remain open, and planning constraints plus risk transfer are explicit.

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Operator clarity | The release model should be obvious from branch to workflow | High |
| Changed-scope correctness | CI should do only relevant lint/typecheck/test work | High |
| Workflow simplicity | Fewer overlapping files and fewer special cases reduce maintenance | High |
| Publish efficiency | Staging and production should not rebuild/deploy on irrelevant merges | High |
| Regression containment | Removing dev smoke/export must still leave a clear export proof point before live | Medium |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Keep the current split surfaces and trim obvious waste: retain `ci.yml`, keep a reduced `brikette.yml`, and keep `brikette-staging-fast.yml` | Smallest YAML diff | Operator still has to reason across three overlapping workflow surfaces; Brikette remains partly special-cased | Complexity remains distributed; duplicate export logic persists | Partial |
| B | Collapse Brikette to one dedicated workflow: changed-scope validation on `dev`/PR plus merge-only `staging`/`main` publish, while core `ci.yml` ignores Brikette app-only changes | Clearest execution boundary; keeps one Brikette workflow file; avoids core-CI wideners on app-only changes; removes manual publish paths | Shared package changes can still legitimately hit both core CI and Brikette CI | Need to preserve required production-only checks explicitly when leaving reusable-app and ensure publish skips workflow-only changes | Yes |
| C | Build a bespoke Brikette-only validation workflow with custom file-level relevance logic and separate staging/production deploy workflows | Maximum local control over what runs | More YAML, more classifiers, and more special-case logic than the operator asked for | Brittle maintenance; duplicates capabilities already present in affected-scope tooling | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | No direct impact; leaves preview/live publication surface split across files | No direct impact; preview/live lanes become one clearer publish surface | No UI changes; simplify workflow ownership only |
| UX / states | Operator has to remember which branch hits which workflow file | Branch meaning becomes straightforward: one Brikette workflow owns `dev` validation and merge-driven preview/live publication | Prefer branch-to-workflow clarity over preserving current file layout |
| Security / privacy | Manual dispatch remains tempting unless explicitly removed in multiple places | Branch-only publish path narrows privileged execution paths | Remove `workflow_dispatch` and keep credentialed deploys on branch merges only |
| Logging / observability / audit | Audit trail remains split across validation, staging, and production files | One Brikette workflow plus core CI carve-out make CI outcomes easier to audit | Preserve branch-driven auditability while reducing workflow sprawl |
| Testing / validation | Dev still has overlapping repo CI and Brikette CI concerns | Brikette app-only changes validate in one dedicated path; staging becomes first export proof point | Remove Brikette dev smoke/export gates and keep export proof in staging/main publish flow |
| Data / contracts | Reusable workflow inputs still obscure Brikette's actual deploy contract | Branch/path triggers and explicit build/deploy steps become the contract | Prefer explicit Brikette deploy steps over reusable-app indirection |
| Performance / reliability | Duplicate export/build logic and extra workflow fan-out remain | Fewer workflow surfaces and no publish on irrelevant merges reduce wasted work | Consolidate publish logic and keep path gates on `staging` and `main` |
| Rollout / rollback | Promotion scripts still work, but lane responsibilities remain fuzzy | Promotion scripts align directly to two workflow surfaces and symmetric publish rules | Preserve current branch flow and make rollback/promotion reasoning simpler |

## Chosen Approach
- **Recommendation:** Use one dedicated Brikette workflow for changed-scope validation on `dev`/PR and merge-only publication on `staging`/`main`, while carving pure `apps/brikette/**` changes out of broad core CI.
- **Why this wins:** It matches the operator's requirements with the smallest durable boundary. `dev` and PRs get one Brikette-specific changed-scope validation path. `staging` builds and publishes preview when Brikette changed. `main` builds and publishes live when Brikette changed. Pure Brikette app changes no longer trigger unrelated core-CI governance, but shared package changes can still flow through core CI when they genuinely affect more than Brikette.
- **What it depends on:** Tightening `ci.yml` path ignores for pure Brikette app/workflow changes, folding staging and production publish behavior into one explicit `brikette.yml`, ensuring workflow-only changes do not publish, and carrying forward any production-only health checks now hidden inside the reusable-app abstraction.

### Rejected Approaches
- Option A — rejected because it trims symptoms but leaves the same distributed contract in place. The operator would still be reasoning across three Brikette-related workflow surfaces.
- Option C — rejected because custom file-level classifier logic is more complicated than the stated requirement and duplicates capabilities the repo already has through push diff plus affected-scope evaluation.

### Open Questions (Operator Input Required)
None.

## Planning Handoff
- Planning focus:
  - Carve pure Brikette app/workflow changes out of broad `ci.yml` without losing shared-package coverage.
  - Design the single `brikette.yml` workflow that handles `dev`/PR validation plus `staging`/`main` branch pushes with branch-specific build/deploy settings.
  - Remove the staging fast-path workflow, reusable-app dependency, and manual dispatch paths from the current Brikette setup.
- Validation implications:
  - Workflow validation should prove that Brikette app-only pushes on `dev` run lint/typecheck/test only where relevant and do not trigger broad core CI.
  - Branch-trigger validation should prove that `staging` and `main` publish only on Brikette-relevant merges and never via manual dispatch.
  - Production planning must preserve any required post-deploy health checks currently supplied by `reusable-app.yml`.
- Sequencing constraints:
  - Finalize the target workflow boundary before editing triggers, otherwise path filters and branch responsibilities will drift.
  - Preserve production-only healthcheck behavior before removing Brikette's reusable-app production path.
  - Remove manual dispatch only after the branch-triggered publish path is confirmed complete.
- Risks to carry into planning:
  - `ci.yml` may need either targeted narrowing or a Brikette-specific entry path if repo-global governance jobs cannot be cleanly separated.
  - Consolidating staging and production publish into one workflow must not accidentally drop required production verification.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Carving pure Brikette app changes out of `ci.yml` leaves an unintended gap for shared-package validation | Medium | High | Requires concrete path-boundary design, not just approach choice | Plan must distinguish app-only paths from shared dependency paths explicitly |
| Consolidating deploy lanes out of `reusable-app.yml` drops a production-only safeguard | Medium | High | The exact retained checks must be selected during implementation planning | Inventory current production checks and re-home them deliberately |
| Staging as first export proof point catches export issues later than today's dev smoke/export jobs | Medium | Medium | The user explicitly chose this tradeoff, but the resulting guard shape still needs planning | Ensure staging publish failures are fast and visible enough to be useful |

## Planning Readiness
- Status: Go
- Rationale: The operator decisions close the main design forks, the preferred workflow boundary is clear, rejected alternatives are explicit, and the remaining work is now implementation planning rather than more discovery.
