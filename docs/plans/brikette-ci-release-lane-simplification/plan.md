---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11 (all tasks complete)"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-ci-release-lane-simplification
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/brikette-ci-release-lane-simplification/analysis.md
artifact: plan
---

# Brikette CI Release Lane Simplification Plan

## Summary
This plan simplifies Brikette CI down to one dedicated workflow file and one core-CI carve-out. Pure `apps/brikette/**` changes should validate through changed-scope lint, typecheck, and tests in `brikette.yml` without triggering broad core CI. Merge-driven `staging` and `main` publishes should live in the same `brikette.yml` file, with no `workflow_dispatch`, no dev smoke/export gates, and no deploy when only workflow-only files changed. Shared package changes that genuinely affect more than Brikette should still be allowed to trigger core CI.

## Active tasks
- [x] TASK-01: Rebuild the Brikette workflow contract around changed-scope validation and merge-only publish lanes
- [x] TASK-02: Carve pure Brikette app/workflow changes out of core CI and update current docs
- [x] TASK-03: Validate the new workflow contract and record build evidence

## Goals
- Ensure pure Brikette app changes trigger only relevant Brikette validation checks.
- Keep changed scope defined by the push and its affected dependency/workspace surface.
- Make `staging` preview-only by merge and `main` live-only by merge, both path-gated and manual-trigger-free.
- Remove the old Brikette staging fast-path and reusable-app indirection from the active Brikette release path.

## Non-goals
- Re-architect Brikette application code or shrink the Pages artifact in this change.
- Replace repo-wide merge-gate policy or unrelated app workflows.
- Add bespoke file-level classifiers for every validation step.

## Constraints & Assumptions
- Constraints:
  - Local tests remain offloaded to CI; no local Jest/e2e execution.
  - `staging` and `main` must skip publish when no Brikette-relevant code changed.
  - `workflow_dispatch` must be removed from the Brikette release path.
  - Existing production health-check coverage must survive the workflow refactor.
- Assumptions:
  - Pure `apps/brikette/**` changes can safely bypass broad core-CI governance jobs once Brikette has its own changed-scope validation path.
  - Shared package changes should still be allowed to hit both core CI and Brikette CI when they genuinely affect both surfaces.

## Inherited Outcome Contract
- **Why:** The current Brikette CI and deploy flow is harder to reason about than it should be. The operator wants one straightforward release model: changed-only validation on dev, staging as the preview lane reached by merge, and main as the live lane reached by merge.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Brikette has an analysis-ready fact-find for a simplified GitHub Actions setup where dev performs changed-only lint, typecheck, and tests in CI, staging is a merge-only preview lane, and main is a merge-only production lane.
- **Source:** operator

## Analysis Reference
- Related analysis: `docs/plans/brikette-ci-release-lane-simplification/analysis.md`
- Selected approach inherited:
  - Use one dedicated Brikette workflow for changed-scope validation on `dev`/PR and merge-only publication on `staging`/`main`, while carving pure `apps/brikette/**` changes out of broad core CI.
- Key reasoning used:
  - Core `ci.yml` is too broad for pure Brikette app changes.
  - Keeping `brikette.yml` as the single active Brikette workflow preserves a simple operator mental model and avoids merge-gate churn.
  - Shared dependency changes should still be treated as shared and may legitimately hit more than one workflow.

## Selected Approach Summary
- What was chosen:
  - Keep `.github/workflows/brikette.yml` as the single active Brikette workflow.
  - Remove `.github/workflows/brikette-staging-fast.yml`.
  - Move Brikette dev/PR validation into changed-scope steps inside `brikette.yml`.
  - Narrow `.github/workflows/ci.yml` so pure Brikette app/workflow changes do not trigger broad core CI.
- Why planning is not reopening option selection:
  - The operator closed the major policy forks, and deeper workflow inspection showed this boundary is simpler than forcing Brikette back through the broad core workflow.

## Fact-Find Support
- Supporting brief: `docs/plans/brikette-ci-release-lane-simplification/fact-find.md`
- Evidence carried forward:
  - `ci.yml` widens beyond Brikette-only scope today.
  - `brikette.yml` and `brikette-staging-fast.yml` duplicate export/publish logic.
  - Merge-only branch promotion already exists via `ship-to-staging.sh` and `promote-to-main.sh`.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Rebuild `brikette.yml` as the single Brikette validation + publish workflow and add the shared export helper | 84% | M | Complete (2026-03-11) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Narrow `ci.yml`, remove the staging fast-path workflow, and update current docs to the new contract | 86% | M | Complete (2026-03-11) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Validate workflow YAML/contracts and record final build evidence | 92% | S | Complete (2026-03-11) | TASK-01, TASK-02 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A | TASK-01, TASK-02, TASK-03 | Workflow/docs change only; no product UI impact. |
| UX / states | Clarify branch-to-workflow behavior so operator/agent flows are predictable | TASK-01, TASK-02 | Workflow triggers and publish skip rules are the relevant state model. |
| Security / privacy | Remove manual publish entrypoints and preserve secreted deploy paths only on merge-driven branches | TASK-01, TASK-02 | No new secrets introduced. |
| Logging / observability / audit | Keep one active Brikette workflow and preserve production health checks | TASK-01, TASK-03 | Merge-gate and post-deploy visibility must still work. |
| Testing / validation | Enforce changed-scope lint/typecheck/test for app-only Brikette changes; validate YAML and shell flow statically locally | TASK-01, TASK-03 | No local Jest/e2e runs. |
| Data / contracts | Update workflow triggers, path contracts, and any classifier config consistently | TASK-01, TASK-02 | Merge-gate/current docs must agree on the active workflow contract. |
| Performance / reliability | Remove duplicate publish surfaces and avoid deploys on workflow-only/no-op merges | TASK-01, TASK-02 | Export still runs on staging/main only. |
| Rollout / rollback | Keep rollback as workflow-file reversion and branch redeploy | TASK-01, TASK-02, TASK-03 | No irreversible infra change in repo code. |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establish the new active Brikette workflow contract first. |
| 2 | TASK-02 | TASK-01 complete | Core-CI carve-out and doc cleanup depend on the new Brikette contract. |
| 3 | TASK-03 | TASK-01, TASK-02 complete | Final validation and evidence only. |

## Rehearsal Trace
| Task | Preconditions checked | Blocking finding | Resolution |
|---|---|---|---|
| TASK-01 | Existing `brikette.yml` and staging-fast workflow both duplicate export logic; merge-gate still keys off `brikette.yml` file identity | If the active Brikette workflow file changes identity, merge-gate and docs drift immediately | Keep `.github/workflows/brikette.yml` as the active Brikette workflow file and refactor in place |
| TASK-02 | Core CI currently still owns broad governance for all non-cms/non-skylar changes | Excluding shared packages from core CI would create validation gaps for non-Brikette dependents | Carve out only pure `apps/brikette/**` plus Brikette-specific workflow/script paths; leave shared packages in core CI |
| TASK-03 | Local test execution is disallowed by policy | Full runtime confidence is unavailable locally | Use YAML/static validation, `actionlint`, `git diff --check`, and artifact validators; rely on CI for runtime confirmation |

## Tasks

### TASK-01: Rebuild `brikette.yml` as the single Brikette validation + publish workflow
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/brikette.yml` plus any supporting helper/config files needed to express one active Brikette workflow
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Build evidence:** Rewrote `.github/workflows/brikette.yml` so one workflow now owns `dev`/PR changed-scope validation and merge-only `staging`/`main` publication. Added `scripts/brikette/build-static-export.sh` to centralize the route-hide/export/restore flow for staging and production builds. Staging and production deploys now key off a `changes` job that skips publication when only workflow/supporting-script files changed. `workflow_dispatch`, reusable-app usage, Turbopack smoke, and the separate static-export-check path were removed from the active Brikette release path.
- **Affects:** `.github/workflows/brikette.yml`, `scripts/brikette/build-static-export.sh`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 84%
  - Implementation: 84% - The existing workflow and reusable-app health-check paths provide working source material; the main risk is preserving deploy semantics while simplifying triggers.
  - Approach: 86% - One active Brikette workflow is the simplest boundary that still respects merge-gate and the operator's branch model.
  - Impact: 88% - This task removes the main workflow overlap and establishes the new operator-facing contract directly.
- **Acceptance:**
  - `brikette.yml` triggers on Brikette-relevant `push` events for `dev`, `staging`, and `main`, plus relevant PRs, with no `workflow_dispatch`.
  - Dev/PR validation runs changed-scope lint, typecheck, and tests only.
  - `staging` and `main` publish jobs run only on push to their branch and only when Brikette deploy-surface files changed.
  - Production retains post-deploy health checks.
- **Engineering Coverage:**
  - UI / visual: N/A - Workflow-only change.
  - UX / states: Required - Branch and event behavior become the operator-visible state model.
  - Security / privacy: Required - Manual publish paths are removed.
  - Logging / observability / audit: Required - Publish and health-check evidence must remain visible.
  - Testing / validation: Required - Changed-scope validation contract is the core of the task.
  - Data / contracts: Required - Workflow triggers and classifier outputs are the contract being edited.
  - Performance / reliability: Required - Deploy-skip logic and export timing are part of the target behavior.
  - Rollout / rollback: Required - Reverting the workflow file must restore the old contract cleanly.
- **Validation contract (TC-01):**
  - TC-01-A: `.github/workflows/brikette.yml` parses cleanly and passes `actionlint`.
  - TC-01-B: No `workflow_dispatch` remains in the active Brikette workflow.
  - TC-01-C: Staging and production deploy jobs are gated by branch push and deploy-surface change detection, not PR/manual events.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed existing `brikette.yml`, `brikette-staging-fast.yml`, `reusable-app.yml`, `merge-gate.yml`
  - Validation artifacts: workflow YAML plus any supporting helper/config diffs
  - Unexpected findings: merge-gate depends on `brikette.yml` file identity, so refactor must stay in-place
- **Scouts:** None: current workflow files already expose all required branch and deploy behavior
- **Edge Cases & Hardening:** Workflow-only changes must not trigger deploy; PRs must not publish; production-only health checks must survive reusable-app removal
- **What would make this >=90%:**
  - Prove the publish-surface change detector can distinguish workflow-only edits from real deploy-surface changes without adding brittle scripting
- **Rollout / rollback:**
  - Rollout: merge to `dev`, then branch promotion to `staging` and `main`
  - Rollback: revert the workflow/helper changes and re-merge
- **Documentation impact:**
  - Update current non-archive docs that still describe manual Brikette production or the staging fast path
- **Notes / references:**
  - Keep `.github/workflows/brikette.yml` as the canonical Brikette workflow file for merge-gate compatibility

### TASK-02: Narrow `ci.yml`, remove the staging fast-path workflow, and update current docs
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml`, deleted `.github/workflows/brikette-staging-fast.yml`, and corrected current documentation
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-11)
- **Build evidence:** Added a pure-Brikette carve-out to `.github/workflows/ci.yml` for `apps/brikette/**`, `.github/workflows/brikette.yml`, and `scripts/brikette/build-static-export.sh` so app-only Brikette changes no longer trigger broad core CI. Removed `.github/workflows/brikette-staging-fast.yml`. Updated `scripts/src/ci/filter-config.ts` and `scripts/ci/path-classifier.cjs` so current Brikette scope includes the active helper/workspace dependencies. Updated current docs in `docs/github-setup.md`, `docs/testing-policy.md`, `docs/brikette-deploy-decisions.md`, and `docs/briefs/safe-github-update-strategy-briefing.md` to remove manual-production/staging-fast guidance.
- **Affects:** `.github/workflows/ci.yml`, `.github/workflows/brikette-staging-fast.yml`, `scripts/src/ci/filter-config.ts`, `scripts/ci/path-classifier.cjs`, `docs/github-setup.md`, `docs/testing-policy.md`, `docs/brikette-deploy-decisions.md`, `docs/briefs/safe-github-update-strategy-briefing.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 86%
  - Implementation: 85% - The carve-out is small if limited to pure Brikette app/workflow paths; deleting the old staging workflow is straightforward once `brikette.yml` owns staging.
  - Approach: 88% - This preserves shared-package coverage while eliminating the main source of irrelevant checks on pure Brikette app changes.
  - Impact: 86% - It removes redundant workflow entrypoints and makes current docs match actual release behavior.
- **Acceptance:**
  - Pure `apps/brikette/**` changes no longer trigger broad core CI.
  - Shared package changes still remain eligible for core CI.
  - `.github/workflows/brikette-staging-fast.yml` is removed from the active repo surface.
  - Current docs no longer describe manual Brikette production or the staging fast-path as active behavior.
- **Engineering Coverage:**
  - UI / visual: N/A - Workflow/docs change.
  - UX / states: Required - Clarifies which workflow a change should hit.
  - Security / privacy: Required - Removes outdated manual-deploy guidance.
  - Logging / observability / audit: Required - Current docs and workflow entrypoints must agree.
  - Testing / validation: Required - Core CI carve-out is the key validation boundary.
  - Data / contracts: Required - Path-ignore and docs are part of the release contract.
  - Performance / reliability: Required - Removes redundant workflow triggers.
  - Rollout / rollback: Required - Deletion and path-ignore changes must be reversible.
- **Validation contract (TC-02):**
  - TC-02-A: `.github/workflows/ci.yml` parses cleanly and passes `actionlint`.
  - TC-02-B: `paths-ignore` carve-out in `ci.yml` excludes only pure Brikette app/workflow surfaces, not shared dependency packages.
  - TC-02-C: Current docs mention merge-driven staging/main and no manual Brikette publish path.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: reviewed current `ci.yml` triggers and `docs/github-setup.md` environment docs
  - Validation artifacts: workflow YAML diff, docs diff
  - Unexpected findings: shared package changes must remain in core CI to avoid coverage gaps
- **Scouts:** None: the carve-out surface is known from workflow paths and dependency review
- **Edge Cases & Hardening:** Keep shared packages in core CI; update docs only in current, non-archive files
- **What would make this >=90%:**
  - Confirm no other current doc outside the touched set still claims manual Brikette production or staging-fast behavior
- **Rollout / rollback:**
  - Rollout: same merge path as TASK-01
  - Rollback: restore deleted workflow and remove the `ci.yml` carve-out
- **Documentation impact:**
  - Required: current GitHub/deploy docs must align to the new release path
- **Notes / references:**
  - Archive and historical plan docs are not part of the active contract and should not be rewritten

### TASK-03: Validate the new workflow contract and record final build evidence
- **Type:** IMPLEMENT
- **Deliverable:** Verified workflow/docs state plus updated plan/build artifacts for this slug
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-11)
- **Build evidence:** `actionlint .github/workflows/brikette.yml .github/workflows/ci.yml` passed after fixing one pre-existing shellcheck issue in `ci.yml`. `bash -n scripts/brikette/build-static-export.sh scripts/post-deploy-health-check.sh scripts/post-deploy-brikette-cache-check.sh` passed. `git diff --check` passed for the touched files. `scripts/validate-plan.sh` and `scripts/validate-engineering-coverage.sh` both passed for this plan slug.
- **Affects:** `docs/plans/brikette-ci-release-lane-simplification/plan.md`, `docs/plans/brikette-ci-release-lane-simplification/build-record.user.md`, `docs/plans/brikette-ci-release-lane-simplification/analysis.md`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 92% - Validation commands and artifact update flow are deterministic.
  - Approach: 92% - Static workflow validation is the correct local gate under the no-local-tests policy.
  - Impact: 94% - Captures the actual result and ensures the planning/build artifacts are complete.
- **Acceptance:**
  - Plan validators pass.
  - Workflow YAML passes `actionlint`.
  - Final build record captures the resulting contract and validations run.
- **Engineering Coverage:**
  - UI / visual: N/A - Artifact-only verification.
  - UX / states: Required - Final evidence must describe branch behavior clearly.
  - Security / privacy: Required - Validation confirms manual publish removal and guarded deploy path.
  - Logging / observability / audit: Required - Build record becomes the audit artifact.
  - Testing / validation: Required - Static validation is the main deliverable of this task.
  - Data / contracts: Required - Final artifact set must match the implemented workflow contract.
  - Performance / reliability: Required - Validation confirms deploy skip logic exists.
  - Rollout / rollback: Required - Build record must document rollback posture.
- **Validation contract (TC-03):**
  - TC-03-A: `scripts/validate-plan.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` -> pass
  - TC-03-B: `scripts/validate-engineering-coverage.sh docs/plans/brikette-ci-release-lane-simplification/plan.md` -> pass
  - TC-03-C: `actionlint` passes on the touched workflow files
  - TC-03-D: `git diff --check` passes for the touched files
- **Execution plan:** Red -> Green -> Refactor
- **Scouts:** None
- **Edge Cases & Hardening:** None: final artifact and validator pass only
- **What would make this >=90%:**
  - Already >=90%
- **Rollout / rollback:**
  - Rollout: ship to `dev`, then promote normally
  - Rollback: revert if CI exposes a branch-trigger gap
- **Documentation impact:**
  - Build record and plan status updates only
- **Notes / references:**
  - CI remains the source of truth for runtime validation after merge

## Risks & Mitigations
- If publish-surface detection is too narrow, real Brikette deploy changes could skip staging/main publishes.
- If the `ci.yml` carve-out is too broad, shared-package changes may lose needed core-CI coverage.
- If reusable-app production checks are not preserved, deployment correctness could regress silently.

## Observability
- Logging: GitHub Actions job logs for `brikette.yml` and `ci.yml`
- Metrics: CI duration deltas visible in workflow history
- Alerts/Dashboards: None added in this change

## Acceptance Criteria (overall)
- [ ] Pure Brikette app changes validate in Brikette CI without triggering broad core CI.
- [ ] `staging` and `main` publishes are merge-only, path-gated, and manual-trigger-free.
- [ ] No publish occurs on workflow-only/no-op Brikette merges.
- [ ] Current docs match the active Brikette release path.

## Decision Log
- 2026-03-11: Implementation refines the analysis boundary by keeping `brikette.yml` as the canonical Brikette workflow file while carving pure app-only changes out of broad core CI. This preserves merge-gate compatibility and still satisfies the operator’s “relevant checks only” requirement.
- 2026-03-11: Production health checks were preserved directly in `brikette.yml` rather than through `reusable-app.yml`; staging remains build-verified but does not add a post-deploy health-check step.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
