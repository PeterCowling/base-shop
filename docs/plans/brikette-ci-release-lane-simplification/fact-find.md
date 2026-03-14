---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Infra
Workstream: Engineering
Created: 2026-03-11
Last-updated: 2026-03-11
Feature-Slug: brikette-ci-release-lane-simplification
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/brikette-ci-release-lane-simplification/analysis.md
artifact: fact-find
Dispatch-ID: IDEA-DISPATCH-20260311153000-9601
Trigger-Source: dispatch-routed
Trigger-Why: The current Brikette CI and deploy flow is harder to reason about than it should be. The operator wants one straightforward release model: changed-only validation on dev, staging as the preview lane reached by merge, and main as the live lane reached by merge.
Trigger-Intended-Outcome: type: operational | statement: Brikette has an analysis-ready fact-find for a simplified GitHub Actions setup where dev performs changed-only lint, typecheck, and tests in CI, staging is a merge-only preview lane, and main is a merge-only production lane. | source: operator
---

# Brikette CI Release Lane Simplification Fact-Find Brief

## Scope
### Summary
Investigate the simplest GitHub Actions and branch-flow shape that satisfies the stated Brikette release goals: CI owns validation, dev only validates code that actually changed, staging is a preview lane reached by merge for humans and agents, and main is the live lane reached by merge. The fact-find focuses on current workflow contracts, duplication, and the specific places where the current setup violates the desired "nothing changed, nothing to do" rule.

### Goals
- Establish the current validation and deploy lane behavior for `dev`, `staging`, and `main`.
- Identify where Brikette already meets the desired merge-only branch flow and where complexity remains.
- Trace exactly which CI steps are already changed-only and which still fan out beyond changed code.
- Produce an analysis-ready inventory of the smallest workflow changes that would reach the target state.

### Non-goals
- Implement workflow changes in this artifact.
- Redesign Brikette application code or static-export architecture beyond what is needed to explain workflow constraints.
- Generalize the final solution to non-Brikette apps in this fact-find.
- Re-open the already-landed repo policy decision that tests should run in CI rather than locally.

### Constraints & Assumptions
- Constraints:
  - The user wants the simplest, most straightforward GitHub Actions that satisfy the stated release requirements.
  - Validation of code changes must be CI-owned; local resource-heavy test execution is explicitly out of scope for the desired end state.
  - Staging must remain usable for users and agents, including MCP and Playwright-style verification.
  - Production publish should require nothing more than the normal merge path into `main`.
  - Staging and production should skip publication when a merge does not include Brikette-relevant changes.
  - Staging and production should be branch-merge only lanes with no manual publish entrypoint.
- Assumptions:
  - Changed scope should be defined by what is in the push and its affected dependency/workspace surface, with lint, typecheck, and test run only where relevant.
  - The current `staging.<project>.pages.dev` host is an acceptable staging preview surface for users and agent tooling.
  - Brikette-specific branch lanes can be simplified without changing the repo-wide `dev -> staging -> main` policy.

## Outcome Contract
- **Why:** The current Brikette CI and deploy flow is harder to reason about than it should be. The operator wants one straightforward release model: changed-only validation on dev, staging as the preview lane reached by merge, and main as the live lane reached by merge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette has an analysis-ready fact-find for a simplified GitHub Actions setup where dev performs changed-only lint, typecheck, and tests in CI, staging is a merge-only preview lane, and main is a merge-only production lane.
- **Source:** operator

## Access Declarations
None. This investigation used repository sources only.

## Evidence Audit (Current State)
### Entry Points
- `.github/workflows/ci.yml` - core CI lane for affected lint, affected typecheck, and affected unit tests on non-staging pushes and PRs.
- `.github/workflows/brikette.yml` - Brikette-specific dev/main workflow containing smoke, static-export verification, release CI, and production deploy logic.
- `.github/workflows/brikette-staging-fast.yml` - staging preview lane that already deploys from `staging` branch pushes with no lint, typecheck, or tests.
- `.github/workflows/reusable-app.yml` - shared app pipeline providing app-scoped validation, test sharding, and deploy gating.
- `scripts/git/ship-to-staging.sh` - current PR + auto-merge path into `staging`.
- `scripts/git/promote-to-main.sh` - current PR + auto-merge path from `dev` into `main`.
- `package.json` - root scripts defining `test:affected` and repo-level validation surfaces.
- `apps/brikette/src/utils/buildLanguages.ts` - current staging language subset lever already used by the staging fast path.

### Key Modules / Files
- `.github/workflows/ci.yml`
  - Already runs `pnpm exec turbo run lint --affected`, `pnpm exec turbo run typecheck --affected`, and `pnpm test:affected`.
  - Also runs repo-global governance jobs and a fixed package-loop test typecheck step, which break the strict "nothing changed, nothing to do" target for Brikette-only work.
- `package.json`
  - Defines `test:affected` as `CI=true pnpm run test:governed -- turbo -- --affected --concurrency=2`, confirming repo-level changed-only unit test support already exists.
- `.github/workflows/brikette.yml`
  - Runs on `dev` and `main` pushes, plus PRs and manual dispatch.
  - Contains a Turbopack smoke job, a static export check, a reusable release CI lane, and a production deploy lane.
  - Repeats the route-hide/build/restore export workaround in multiple jobs.
- `.github/workflows/reusable-app.yml`
  - Provides app-level validation and test selection for Brikette via change classification, but still executes app-wide lint and turbo typecheck filters rather than strict changed-only file scope.
- `.github/workflows/brikette-staging-fast.yml`
  - Already behaves like a preview lane: branch-driven, no tests, no typecheck, no verify steps, and direct `wrangler pages deploy` to `staging`.
  - Still keeps a manual `workflow_dispatch` path and a separate workflow surface from the main Brikette pipeline.
- `scripts/git/ship-to-staging.sh`
  - Already enforces merge-to-staging by PR + auto-merge instead of direct deploy commands.
- `scripts/git/promote-to-main.sh`
  - Already enforces merge-to-main by PR + auto-merge from `dev`.
- `docs/plans/_archive/ci-only-test-execution/fact-find.md`
  - Confirms the repo already decided to offload heavy test execution to CI.
- `docs/plans/_archive/brikette-staging-upload-speed/fact-find.md`
  - Confirms the staging fast path exists because the preview lane was intentionally separated from full dev validation and also documents the current static-export volume pressure.

### Patterns & Conventions Observed
- **Heavy local testing has already been moved to CI at the repo-policy level.**
  - Evidence: archived `ci-only-test-execution` fact-find and plan state that the repo intentionally blocks local agent-mediated test execution and routes test feedback through CI.
- **Changed-only validation is already real in core CI, but only partially.**
  - Evidence: `ci.yml` uses `--affected` for lint and typecheck, and `test:affected` for unit tests. However, `typecheck` also runs a fixed package loop for test type resolution, and lint includes several repo-global governance steps even on narrow changes.
- **Brikette has two separate CI/deploy surfaces instead of one clearly layered release model.**
  - Evidence: `ci.yml` covers repo-core validation, while `brikette.yml` separately handles Brikette smoke/export/release/prod, and `brikette-staging-fast.yml` separately handles staging deploy.
- **Staging merge-only behavior is already mostly implemented operationally.**
  - Evidence: `ship-to-staging.sh` ships by PR + auto-merge to `staging`, and `brikette-staging-fast.yml` deploys on `staging` branch push.
- **Main merge-only behavior is already mostly implemented operationally.**
  - Evidence: `promote-to-main.sh` ships by PR + auto-merge from `dev` to `main`, and `brikette.yml` production deploy runs on `main` pushes.
- **Manual triggers still exist in both Brikette workflows.**
  - Evidence: `workflow_dispatch` exists in `brikette.yml` and `brikette-staging-fast.yml`, which conflicts with a strict interpretation of "nothing apart from a merge."
- **Static export complexity leaks into multiple CI jobs.**
  - Evidence: the same route-hide/build/restore sequence appears in static export check, release CI, production deploy, and staging fast path, increasing workflow surface area and failure modes.

### Data & Contracts
- Types/schemas/events:
  - `dispatch.v2` packet for this fact-find captures the operator request as an `lp-do-ideas` handoff.
  - `reusable-app.yml` exposes `run_validation`, `run_tests`, `run_sharded_tests`, `test_scope`, and `should_deploy` outputs for app pipelines.
- Persistence:
  - Staging and production publishes are Cloudflare Pages deploys from `apps/brikette/out`.
  - CI feedback is primarily GitHub Actions job state plus uploaded artifacts where applicable.
- API/contracts:
  - `test:affected` is the canonical changed-only unit test contract in core CI.
  - `ship-to-staging.sh` and `promote-to-main.sh` are the current branch-promotion contracts.
  - `BRIKETTE_STAGING_LANGS` and `NEXT_PUBLIC_BRIKETTE_BUILD_LANGS` already provide a staging build-scope contract for language subsets.

### Dependency & Impact Map
- Upstream dependencies:
  - GitHub branch flow (`dev -> staging -> main`).
  - Shared repo validation in `.github/workflows/ci.yml`.
  - Shared app orchestration in `.github/workflows/reusable-app.yml`.
  - Cloudflare Pages project settings and deploy credentials for Brikette.
- Downstream dependents:
  - Human staging review on Pages preview URLs.
  - Agent browser tooling and Playwright/MCP inspection against staging.
  - Production publish on the Brikette custom domain.
  - The `ops-ship`, `ship-to-staging`, and `promote-to-main` operator flows.
- Likely blast radius:
  - Brikette workflow YAML files.
  - Shared reusable-app validation semantics if Brikette remains on that path.
  - Potentially `ci.yml` if the cleanest solution is to centralize dev validation there and remove duplicate Brikette validation from `brikette.yml`.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The simplest target shape is: core CI validates changed code on `dev`, staging workflow only deploys on `staging` merge, and production workflow only deploys on `main` merge. | Current branch scripts and workflow triggers already support merge-driven staging and main. | Low | Low |
| H2 | Brikette-specific dev validation can be reduced because core CI already covers affected lint/typecheck/tests. | Static-export/smoke checks are not required on every Brikette dev change, or can be relocated to a smaller lane. | Medium | Medium |
| H3 | Strict file-only lint/typecheck is not necessary to meet the "changed code only" operator intent; workspace-affected scope is the simpler acceptable interpretation. | Operator accepts changed-workspace validation instead of bespoke file-by-file lint/typecheck routing. | Low | Low |
| H4 | Manual workflow dispatches can be removed or narrowed without harming normal release operations. | No operator-critical hotfix path depends on workflow_dispatch today. | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Both staging and main already have PR + auto-merge scripts, and corresponding branch-push deploy workflows exist. | `ship-to-staging.sh`, `promote-to-main.sh`, `brikette-staging-fast.yml`, `brikette.yml` | High |
| H2 | Core CI already does affected lint/typecheck/tests, while Brikette workflow adds extra smoke/export/release logic. | `ci.yml`, `brikette.yml` | High |
| H3 | Repo already uses `--affected` semantics for lint, typecheck, and tests; no file-only lint/typecheck mechanism is required by current contracts. | `ci.yml`, `package.json`, `reusable-app.yml` | Medium |
| H4 | Manual dispatch remains present, but no repository evidence shows it is required for the normal branch-promotion path. | `brikette.yml`, `brikette-staging-fast.yml`, promotion scripts | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Whether staging and main already satisfy the merge-only requirement operationally.
  - Whether core CI already covers changed-only lint/typecheck/tests for normal dev pushes.
  - Whether Brikette-specific validation is duplicating work already done elsewhere.
- Hard to test:
  - Whether removing manual dispatches harms an undocumented emergency workflow.
  - Whether app-specific smoke/static-export checks can be fully removed from dev without unacceptable regression risk.
- Validation seams needed:
  - Desired interpretation of "changed code only" for lint/typecheck.
  - Required minimum Brikette-specific checks before staging publish.
  - Acceptability of removing manual workflow_dispatch paths.

#### Recommended Validation Approach
- Quick probes:
  - Compare required dev guarantees against what `ci.yml` already provides.
  - Isolate exactly which `brikette.yml` jobs are true duplicates versus unique safeguards.
  - Confirm whether staging and production lane triggers can be branch-push only.
- Structured tests:
  - Workflow dry-run reasoning against the three branch lanes (`dev`, `staging`, `main`).
  - Targeted workflow lint/contract review if YAML changes are later planned.
- Deferred validation:
  - Actual CI duration reduction and Pages deploy reliability after any workflow simplification.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Turbo affected lint/typecheck/test in core CI.
  - Jest app test selection and sharding in `reusable-app.yml`.
  - Brikette-specific Turbopack smoke and static-export verification in `brikette.yml`.
- Commands:
  - `pnpm exec turbo run lint --affected`
  - `pnpm exec turbo run typecheck --affected`
  - `pnpm test:affected`
  - `pnpm exec turbo run build --filter=@apps/brikette^...`
- CI integration:
  - Core repo validation in `ci.yml`.
  - App-specific release/deploy orchestration in `brikette.yml`.
  - Fast-path staging deploy in `brikette-staging-fast.yml`.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Changed-only lint | CI workflow | `.github/workflows/ci.yml` | Already affected-scoped at the repo level. |
| Changed-only typecheck | CI workflow | `.github/workflows/ci.yml` | Affected-scoped initially, then widened by fixed package test-typecheck loop. |
| Changed-only unit tests | CI workflow | `package.json`, `.github/workflows/ci.yml` | Already uses `test:affected`. |
| Brikette app tests | CI workflow | `.github/workflows/reusable-app.yml`, `.github/workflows/brikette.yml` | Change-classified and sharded, but still attached to a larger app workflow. |
| Staging preview lane | Deploy workflow | `.github/workflows/brikette-staging-fast.yml` | Already excludes lint/typecheck/tests entirely. |
| Production publish lane | Deploy workflow | `.github/workflows/brikette.yml` | Deploys from `main` push after production job conditions pass. |

#### Coverage Gaps
- `ci.yml` violates strict changed-only behavior for Brikette by running repo-global governance jobs even on narrow Brikette changes.
- `ci.yml` typecheck widens beyond changed workspaces through the fixed package-loop `typecheck-tests` step.
- `brikette.yml` still duplicates export/build logic across multiple jobs.
- Manual workflow dispatch remains available even though the desired operator contract is merge-only staging and main.

#### Testability Assessment
- Easy to test:
  - Workflow trigger simplification.
  - Removal of duplicate Brikette jobs when the surviving validation path is clear.
  - Narrowing staging and production to branch-merge publication semantics.
- Hard to test:
  - Safety of removing all Brikette-specific dev smoke/export checks without a replacement gate.
  - Whether a simplified workflow still catches Pages-export-specific regressions early enough.
- Test seams needed:
  - A clearly chosen minimum Brikette-specific validation contract.
  - A shared definition of acceptable changed-only scope.

#### Recommended Test Approach
- Unit tests for:
  - Existing classifier logic only if workflow classification contracts are changed.
- Integration tests for:
  - Workflow contract review and deterministic YAML validation in CI.
- E2E tests for:
  - None in this fact-find; staging remains the operator/agent inspection lane rather than a local test surface.
- Contract tests for:
  - Branch-trigger and deploy-lane expectations once a target approach is selected.

### Recent Git History (Targeted)
- Not investigated via commit-by-commit shell audit in this fact-find.
- Recent repository evidence is still available through adjacent archived work:
  - `docs/plans/_archive/ci-only-test-execution/fact-find.md` and `plan.md` capture the repo-level move to CI-owned tests on 2026-02-27.
  - `docs/plans/_archive/brikette-staging-upload-speed/fact-find.md` captures the 2026-03-08 staging fast-path split and current Pages upload pressure.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No product UI surface changes are being scoped in this fact-find. | None. | N/A |
| UX / states | Required | Branch-promotion scripts and workflow triggers define the operator and agent interaction model for dev, staging, and main. | The current workflow surface is harder to reason about than the desired three-lane mental model. | Compare whether one workflow per lane or a more centralized workflow is clearer without losing guarantees. |
| Security / privacy | Required | Deploy lanes rely on GitHub branch flow, PR auto-merge, and Cloudflare secrets. | Manual dispatch paths and duplicated workflows increase the number of privileged execution paths. | Keep the final design branch-driven and reduce ad hoc publication paths. |
| Logging / observability / audit | Required | CI already exposes changed-only job state, and branch-promotion scripts make the release path auditable through PRs. | Multiple workflows split visibility across dev validation, staging deploy, and production publish. | Prefer a shape where each branch has one obvious source of truth for its outcome. |
| Testing / validation | Required | `ci.yml` already performs affected lint, typecheck, and unit tests; Brikette workflows add smoke/export checks. | Changed-only validation is only partial, and Brikette dev validation duplicates some repo-level guarantees. | Decide the minimum unique Brikette validation that must survive beyond core CI. |
| Data / contracts | Required | Workflow outputs, branch scripts, and env vars already define the release contracts. | Contracts are spread across core CI, reusable-app, Brikette-specific YAML, and branch-promotion scripts. | Consolidate the contract into the smallest set of workflow files possible. |
| Performance / reliability | Required | Archived staging-upload-speed work and current workflow duplication show Pages deploy and repeated export builds are the major operational pressure points. | Extra jobs and repeated export logic increase runtime and failure surface. | Favor lane separation that reduces duplicated export work and preserves staging as the pressure-release lane. |
| Rollout / rollback | Required | Current branch scripts already provide PR-based promotion to staging and main. | The workflow set still mixes validation, preview publish, and production publish responsibilities across multiple files and manual triggers. | Preserve branch-driven rollback/promotion semantics and keep the final shape compatible with current scripts. |

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Dev validation lane (`ci.yml`, `brikette.yml`, `reusable-app.yml`) | Yes | None | No |
| Staging preview lane (`brikette-staging-fast.yml`, `ship-to-staging.sh`) | Yes | None | No |
| Main production lane (`brikette.yml`, `promote-to-main.sh`) | Yes | None | No |
| Shared branch-flow and operator contract | Partial | [Advisory] Existing behavior is already close to target, but the remaining complexity is distributed across multiple workflow files and overlapping checks. | No |

## Scope Signal
**Signal:** right-sized

**Rationale:** The investigation is bounded to the Brikette release workflow and already has enough direct repository evidence to support approach selection without expanding into wider platform redesign. Broader Pages deploy-unit splitting remains relevant but is a separate follow-on if workflow simplification does not remove enough friction.

## Evidence Gap Review
### Gaps Addressed
- Verified that heavy local testing was already moved to CI and should not be rediscovered as new work.
- Verified that staging and main already use branch-promotion scripts, so the fact-find could focus on simplification rather than inventing a new release model.
- Verified the exact changed-only and non-changed-only seams in `ci.yml`, rather than inferring them from memory.

### Confidence Adjustments
- Raised confidence in merge-only staging/main feasibility because the current scripts already enforce PR + auto-merge promotion.
- Reduced confidence in a purely "delete Brikette dev workflow" approach because Brikette still carries unique export/smoke checks not obviously covered by core CI.

### Remaining Assumptions
- Deferring Brikette-specific smoke/static-export checks from `dev` to merge-driven staging and production lanes remains acceptable so long as the staging lane becomes the first export proof point.
- Changed-only publication should continue to rely on Brikette path relevance rather than publishing on every merge regardless of scope.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-analysis brikette-ci-release-lane-simplification`

## Questions
### Resolved
- Q: Has test execution already been offloaded to CI for agent workflows?
  - A: Yes. The archived `ci-only-test-execution` work already established CI-owned testing and blocked the normal agent-mediated local test paths.
  - Evidence: `docs/plans/_archive/ci-only-test-execution/fact-find.md`, `docs/plans/_archive/ci-only-test-execution/plan.md`

- Q: Does Brikette already have a merge-driven staging lane?
  - A: Yes, mostly. `ship-to-staging.sh` already creates a PR and enables auto-merge into `staging`, and `brikette-staging-fast.yml` deploys from `staging` pushes.
  - Evidence: `scripts/git/ship-to-staging.sh`, `.github/workflows/brikette-staging-fast.yml`

- Q: Does Brikette already have a merge-driven production lane?
  - A: Yes, mostly. `promote-to-main.sh` already creates a PR and enables auto-merge from `dev` to `main`, and `brikette.yml` production deploy runs on `main` pushes.
  - Evidence: `scripts/git/promote-to-main.sh`, `.github/workflows/brikette.yml`

- Q: Are lint, typecheck, and unit tests already changed-aware in CI?
  - A: Partially yes. Core lint and unit tests are affected-scoped, and the first typecheck step is affected-scoped. The gap is that typecheck then widens to a fixed package loop and lint also includes several repo-global governance checks.
  - Evidence: `.github/workflows/ci.yml`, `package.json`

 - Q: For lint and typecheck, what should count as "changed code only"?
  - A: The relevant scope is what is in the push plus its affected dependency/workspace surface. Lint, typecheck, and tests should run only where that changed surface makes them relevant.
  - Evidence: operator clarification on 2026-03-11

- Q: Should Brikette-specific dev smoke/static-export checks remain on `dev`, move to a narrower dedicated lane, or be deferred to staging/main only?
  - A: Defer them from `dev`; the first Pages/export proof point should be in merge-driven staging, with production repeating that build on `main`.
  - Evidence: operator clarification on 2026-03-11

- Q: Should staging deploys run on every merge to `staging` regardless of what changed?
  - A: No. If nothing Brikette-relevant changed, do not publish. The same rule applies to `main`.
  - Evidence: operator clarification on 2026-03-11

- Q: Should `workflow_dispatch` remain available as an emergency path?
  - A: No. Staging and production should be merge-only lanes with no manual publish entrypoint.
  - Evidence: operator clarification on 2026-03-11

- Q: Is the current Pages staging host sufficient for agent tooling?
  - A: Yes. The current Pages staging host is sufficient for MCP and Playwright usage.
  - Evidence: operator clarification on 2026-03-11

### Open
None.

## Confidence Inputs
- **Implementation: 84%**
  - Evidence: workflow entry points, branch scripts, changed-only seams, and the operator choices on scope, trigger model, and deploy-lane behavior are now explicit.
  - To reach >=90%: map the exact YAML edits needed to remove duplicate validation and manual dispatches without broadening the blast radius.

- **Approach: 86%**
  - Evidence: the desired merge-only branch model is already mostly present, and the remaining design forks have now been resolved by operator input.
  - To reach >=90%: compare the minimal viable workflow shapes and select the most maintainable one.

- **Impact: 88%**
  - Evidence: removing overlapping workflow surfaces and aligning each branch to one obvious responsibility should reduce operator confusion and CI/Wrangler friction materially.
  - To reach >=90%: quantify current duplicate job/runtime cost across `ci.yml`, `brikette.yml`, and `brikette-staging-fast.yml`.

- **Delivery-Readiness: 82%**
  - Evidence: the relevant files are known, the key preference forks are closed, and no external system discovery is blocking the next phase.
  - To reach >=90%: convert the chosen workflow shape into a concrete implementation order with validation checkpoints.

- **Testability: 84%**
  - Evidence: the workflow contracts are deterministic and can be reviewed by trigger/job/branch semantics without local heavy test execution.
  - To reach >=90%: define the exact staging/main build-proof responsibilities after dev smoke/export deferral.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Simplification removes a Brikette-specific guard that core CI does not replace | Medium | High | Keep the decision explicit around smoke/export gates; do not assume core CI covers Pages-export correctness. |
| "Changed code only" is interpreted too literally, forcing a brittle custom file-level classifier for lint/typecheck | Medium | Medium | Prefer workspace-affected scope unless the operator explicitly needs file-only semantics. |
| Staging merge-only and path-filtered deploy expectations conflict | Medium | Medium | Decide whether merge-only means every merge publishes, or every relevant merge publishes. |
| Manual dispatch removal breaks an undocumented emergency release flow | Low | Medium | Confirm whether workflow_dispatch is actually needed before deleting it. |
| Workflow cleanup helps CI clarity but does not materially reduce Pages/Wrangler pain because deploy artifact size remains the main bottleneck | Medium | Medium | Keep deploy-unit splitting as a follow-on option in analysis rather than overloading this fact-find. |
