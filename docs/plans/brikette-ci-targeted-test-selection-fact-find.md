---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: CI/Infrastructure
Workstream: Engineering
Created: 2026-02-10
Last-updated: 2026-02-10
Feature-Slug: brikette-ci-targeted-test-selection
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: wf-build
Supporting-Skills: none
Related-Plan: docs/plans/brikette-ci-targeted-test-selection-plan.md
Business-Unit: PLAT
Card-ID:
---

# Brikette CI Targeted Test Selection - Fact-Find Brief

## Scope
### Summary
Investigate why Deploy Brikette CI still feels slow after sharding and determine why it runs the full Brikette suite instead of only tests related to changed code.

### Goals
- Confirm current gating and test-selection behavior with code and run-log evidence.
- Quantify current runtime impact in recent staging runs.
- Identify concrete root causes for "run all tests" behavior.
- Produce implementation-ready remediation options.

### Non-goals
- Implementing workflow changes in this wf-fact-find.
- Reducing quality gates without explicit fallback behavior.
- Changing app deploy policies outside Brikette scope.

### Constraints & Assumptions
- Constraints:
  - Keep conservative fallback for uncertain change sets.
  - Do not reduce deploy safety checks.
  - Keep reusable workflow behavior stable for non-Brikette callers.
- Assumptions:
  - Jest `--findRelatedTests` can be safely used for Brikette code-path changes when file types are supported.
  - Non-code runtime changes may still need full fallback unless explicitly classified.

## Evidence Audit (Current State)
### Entry Points
- `.github/workflows/brikette.yml` - Brikette deploy workflow trigger and reusable workflow caller.
- `.github/workflows/reusable-app.yml` - validation gating, test strategy, and test execution.
- `scripts/src/ci/classify-deploy-change.ts` - classifies changed paths into deploy-only vs runtime/unknown.
- `scripts/src/ci/classifier-fixtures.ts` - path category fixtures used by classifier.

### Key Modules / Files
- `.github/workflows/reusable-app.yml:117` - default `run_validation="true"`.
- `.github/workflows/reusable-app.yml:123` - Brikette-specific classifier branch.
- `.github/workflows/reusable-app.yml:191` - validation gate decision; only `run_validation=true|false`.
- `.github/workflows/reusable-app.yml:205` - Brikette sharded mode toggle.
- `.github/workflows/reusable-app.yml:362` - Brikette shard command runs full suite with `--shard`, no related-test filter.
- `scripts/src/ci/classify-deploy-change.ts:174` - `runValidation = !(isDeployOnly && !uncertain)` (binary gate).
- `scripts/src/ci/classifier-fixtures.ts:18` - runtime prefixes include broad `apps/` and `packages/`.

### Patterns & Conventions Observed
- Current Brikette CI uses binary gating:
  - deploy-only confident -> skip lint/typecheck/test
  - otherwise -> full lint/typecheck/test
- There is no intermediate mode for related/targeted tests in deploy workflow.
- Brikette tests are sharded for speed, not scoped for relevance.

### Data & Contracts
- Classifier output contract (workflow outputs):
  - `run_validation`, `is_deploy_only`, `uncertain`, `reason`, `changed_file_count`
- Current reasons from classifier:
  - `deploy_only_paths`, `runtime_path_detected`, `unknown_path_detected`, `empty_path_set`
- No output field exists for test selection mode (`full|related|direct`).

### Dependency & Impact Map
- Upstream dependencies:
  - Git diff base selection in `.github/workflows/reusable-app.yml:124-139`.
  - Path fixtures in `scripts/src/ci/classifier-fixtures.ts`.
- Downstream dependents:
  - `validate` job outputs control test job execution (`test`/`test-sharded`).
  - `build` waits on test jobs; slow tests directly slow deploy loop.
- Likely blast radius of fix:
  - `.github/workflows/reusable-app.yml`
  - `scripts/src/ci/classify-deploy-change.ts` and fixtures/tests
  - possibly `docs/testing-policy.md`

### Test Landscape
#### Test Infrastructure
- Framework: Jest 29 (`apps/brikette/package.json:13`).
- CI command today (per shard):
  - `pnpm --filter @apps/brikette exec jest --ci --runInBand --passWithNoTests --shard=<n>/3`

#### Existing Test Coverage
- Brikette suite in recent runs: 104 suites / 699 tests (historic baseline from prior wf-fact-find).
- Current deploy path always runs full Brikette suite when validation is on.

#### Test Patterns & Conventions
- Repo already uses related-test selection in local validation tooling:
  - `scripts/validate-changes.sh:271` probes with `jest --listTests --findRelatedTests`.
  - `scripts/validate-changes.sh:290` runs targeted related tests.
- Deploy workflow does not reuse this pattern.

#### Coverage Gaps (Planning Inputs)
- No CI test-selection contract between classifier and test jobs.
- No handling for irrelevant runtime paths in Brikette classifier context.

#### Testability Assessment
- Easy to test:
  - classifier behavior via unit tests (`scripts/__tests__/ci/classify-deploy-change.test.ts`).
  - workflow syntax via `actionlint`.
- Hard to test:
  - end-to-end timing gains require real GitHub runs.

#### Recommended Test Approach
- Add unit tests for classifier selection logic (`full` vs `related`).
- Add workflow-level dry checks (`actionlint`) and targeted live probes.

### Recent Git History (Targeted)
- Recent Deploy Brikette staging push runs show repeated full validation paths:
  - Run `21860231934` (2026-02-10) validation notice: `reason=runtime_path_detected changed_files=5`.
  - Run `21844716403` (2026-02-09) validation notice: `reason=runtime_path_detected changed_files=3084`.
- Example commit behind run `21860231934` included prime + workflow edits:
  - `.github/workflows/brikette.yml`
  - `apps/prime/src/components/homepage/HomePage.tsx`
  - `docs/plans/prime-ui-theme-centralization-wf-fact-find.md`
  - `docs/plans/prime-ui-theme-centralization-plan.md`
  - `eslint.config.mjs`
- Classifier treats `apps/prime/...` as runtime for Brikette because runtime prefix is `apps/`.

## External Research (If needed)
- Not needed; all evidence came from repository code and GitHub Actions run telemetry/logs.

## Questions
### Resolved
- Q: Does Brikette deploy CI currently run full tests whenever validation is required?
  - A: Yes.
  - Evidence: `.github/workflows/reusable-app.yml:322` and `.github/workflows/reusable-app.yml:362`.

- Q: Is there a middle path for related tests in deploy workflow?
  - A: No.
  - Evidence: `.github/workflows/reusable-app.yml:191-195` (binary gate only).

- Q: Can unrelated app paths in a merge diff force full Brikette validation?
  - A: Yes, when Brikette workflow is triggered by any included path and classifier sees runtime via broad prefixes.
  - Evidence: `scripts/src/ci/classifier-fixtures.ts:18-20`, run `21860231934` notice `reason=runtime_path_detected changed_files=5`.

### Open (User Input Needed)
- None required for initial implementation if we keep conservative fallback:
  - only use related-test mode for supported code file types,
  - fallback to full suite for uncertain/non-code/runtime-mixed cases.

## Confidence Inputs (for /wf-plan)
- **Implementation:** 89%
  - Existing scripts and Jest capabilities already support related-test selection patterns.
- **Approach:** 86%
  - Strong fit if fallback remains conservative; needs careful file-type and scope policy.
- **Impact:** 88%
  - Affects central deploy workflow behavior for Brikette path; bounded blast radius.
- **Delivery-Readiness:** 92%
  - Clear owner surface (`reusable-app.yml` + CI scripts), clear validation commands.
- **Testability:** 90%
  - Unit tests + `actionlint` + controlled staging probes provide strong verification.

What would raise to >=90 across all dimensions:
- Two controlled staging probes showing:
  - runtime code change -> related-test mode executes and passes.
  - non-code/uncertain change -> full fallback executes and passes.
- 10-run telemetry window with reduced test shard p50 and no missed-regression incidents.

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep conservative fallback semantics on uncertainty.
  - Preserve current non-Brikette behavior in reusable workflow.
- Rollout/rollback expectations:
  - Rollout behind Brikette-only path.
  - Rollback by reverting test-selection branch and restoring current full-shard command.
- Observability expectations:
  - Log explicit test mode (`full` vs `related`) with reason and selected file count.

## Suggested Task Seeds (Non-binding)
- Add Brikette-scoped changed-path relevance filtering before classification (ignore unrelated app paths).
- Extend classifier contract to emit test mode and selected source paths for CI.
- Update `test-sharded` command to use `--findRelatedTests` when mode is `related`.
- Keep full fallback when changed files include unsupported/non-code runtime paths.
- Add unit tests for new classifier modes and line-level runbook docs for operator visibility.

## Execution Routing Packet
- Primary execution skill:
  - `wf-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Brikette deploy workflow supports related-test mode with conservative fallback.
  - Non-Brikette callers remain unchanged.
  - Workflow lint and targeted CI probes pass.
- Post-delivery measurement plan:
  - `pnpm --filter scripts run collect-workflow-metrics -- --workflow "Deploy Brikette" --limit 20 --branch staging --event push --include-jobs`
  - compare `Test (shard 1/3..3/3)` p50 vs current snapshot.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - none for conservative first cut
- Recommended next step:
  - proceed to `/wf-plan` (or implement directly) for Brikette targeted test selection in deploy CI.
