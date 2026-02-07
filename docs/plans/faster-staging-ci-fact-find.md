---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: CI/Infrastructure
Created: 2026-02-06
Last-updated: 2026-02-07
Feature-Slug: faster-staging-ci
Related-Plan: docs/plans/faster-staging-ci-plan.md
Business-Unit: PLAT
Card-ID:
---

# Faster Staging CI Fact-Find Brief

## Scope
### Summary
Reduce staging feedback time without weakening quality or safety controls. The target is faster iteration for deploy/config-only changes (especially Brikette staging) while preserving merge gate behavior, commit/push guardrails, and nightly quality signals.

### Goals
- Cut median `Deploy Brikette` runtime on `staging` deploy loops from ~12.0 minutes to <=6.0 minutes for deploy-only changes.
- Reduce repeat push cycles caused by static-export/deploy config failures by adding local pre-flight validation.
- Preserve existing effective controls: pre-commit checks, writer lock enforcement, pre-push safety, and merge gate.
- Make the workflow explicit enough that agents follow it directly instead of attempting workarounds.

### Non-goals
- Disabling global quality checks (`Core Platform CI`, merge gate, or hook safety checks).
- Replacing GitHub Actions/Turborepo architecture.
- Reworking production deployment flow.
- Solving every unrelated CI failure in this same implementation pass.

### Constraints & Assumptions
- Constraints:
  - Source changes must continue to run lint/typecheck/tests before merge.
  - Direct pushes to `staging`/`main` and non-fast-forward pushes remain blocked (`scripts/git-hooks/pre-push-safety.sh`).
  - Commit/push operations continue requiring lock ownership (`scripts/git-hooks/require-writer-lock.sh`).
  - Any "skip validation" logic must fail open (if classification is uncertain, run full validation).
- Assumptions:
  - Deploy-only changes can be classified from paths with acceptable false-negative risk when implemented as fail-open.
  - Most recent Brikette reruns are from build/deploy config errors rather than business logic defects.
  - Overnight Package Quality Matrix remains a longitudinal quality signal, not a merge gate prerequisite.

## Repo Audit (Current State)
### Entry Points
- `.github/workflows/reusable-app.yml` — reusable deploy pipeline used by app deploy workflows.
- `.github/workflows/brikette.yml` — Brikette deploy caller (staging + production modes).
- `.github/workflows/merge-gate.yml` — merge orchestration that waits on required workflows by change set.
- `.github/workflows/ci.yml` — Core Platform CI (lint, typecheck, tests, build, e2e gating).
- `.github/workflows/test.yml` — Package Quality Matrix (push to `main`, manual, and nightly schedule).
- `.github/workflows/auto-pr.yml` — automation for `dev` -> `staging` pipeline PR creation.
- `scripts/git-hooks/pre-commit.sh` — local commit gate chain.
- `scripts/git-hooks/pre-push-safety.sh` — blocks direct pushes to protected branches and history rewrites.
- `scripts/git-hooks/require-writer-lock.sh` — enforces single-writer lock ownership for write operations.
- `scripts/validate-changes.sh` — broader local validation gate script (typecheck/lint/targeted tests).

### Key Modules / Files
- `.github/workflows/reusable-app.yml` — currently always runs `Lint` + `Typecheck`; skips `Test` only on `staging` (`if: github.ref != refs/heads/staging`), then always builds.
- `.github/workflows/reusable-app.yml` — `Validate deploy environment` is still `continue-on-error: true` (temporary unblock).
- `.github/workflows/brikette.yml` — static-export workaround temporarily renames incompatible routes during staging build.
- `.github/workflows/merge-gate.yml` — uses `dorny/paths-filter@v3` and waits on selected workflows; currently commonly fails at `Wait for required workflows` due upstream CI failures.
- `.github/workflows/test.yml` — nightly `0 3 * * *` matrix run on `main` with recurring failures in the same workspace subset.
- `scripts/git-hooks/pre-commit.sh` — chains env-file guard, writer-lock check, partial-staging guard, lint-staged, staged typecheck, staged package lint, agent-context validation.
- `scripts/git-hooks/typecheck-staged.sh` — package-scoped typecheck for staged workspaces (fallback full typecheck only for root TS changes).
- `scripts/git-hooks/lint-staged-packages.sh` — package-scoped lint for staged workspaces.
- `package.json` (`simple-git-hooks.pre-push`) — runs writer-lock + pre-push safety + full `pnpm typecheck && pnpm lint`.

### Patterns & Conventions Observed
- Reusable deploy pipeline pattern: app workflows call `.github/workflows/reusable-app.yml` (central blast radius).
- Change-set filtering already exists at trigger level (`paths` in app workflows, `dorny/paths-filter` in merge gate/core CI), but not yet at step-level inside `reusable-app.yml`.
- Safety-over-speed guardrails are layered: local hooks, writer lock, protected-branch commit block, protected-branch push block, non-fast-forward push block.
- `cancel-in-progress: true` is common in CI workflows to reduce stale run waste.
- Nightly quality matrix is broad by design and currently unstable; it acts as ongoing signal, not a merge gate.

### Data & Contracts
- Types/schemas:
  - `reusable-app.yml` `workflow_call` contract defines deploy input surface (`app-filter`, `build-cmd`, `artifact-path`, `deploy-cmd`, environment metadata, healthcheck inputs).
  - No explicit typed contract yet for "change classification" (code vs deploy-only).
- Persistence:
  - Turbo remote cache via `setup-repo` action.
  - GitHub Actions artifacts for build outputs/coverage.
- API/event contracts:
  - Brikette deploy triggers on path-scoped `push` (`main`, `staging`) and `pull_request`.
  - Merge Gate computes required workflows from file changes and polls workflow run status for the commit SHA.
  - Package Quality Matrix runs on `main` push and nightly schedule.
  - Local hooks enforce lock + validation before commit/push.

### Dependency & Impact Map
- Upstream dependencies:
  - `dorny/paths-filter@v3`
  - `actions/checkout@v4`, `actions/upload-artifact@v4`, `actions/download-artifact@v4`
  - `actions/github-script@v7`
  - internal composite actions: `setup-repo`, `decrypt-secrets`
- Downstream dependents:
  - Deploy workflows calling `reusable-app.yml`: Brikette, Prime, Product Pipeline, Skylar, and other app deploy callers.
  - Merge Gate policy uses outcomes from Core CI and app deploy workflows.
  - Local developer/agent workflow depends on pre-commit and pre-push hooks in `package.json`.
- Likely blast radius:
  - `reusable-app.yml` step-level gating changes affect all app deploy workflows.
  - Hook changes affect every contributor/agent push path.
  - Merge Gate requirement changes affect repository-wide mergeability.

### Test Landscape

#### Test Infrastructure
- **Frameworks:** GitHub Actions runs (integration-level behavior), shell hook scripts, Jest/Node tests for selected helper scripts.
- **Commands:** local hook chain (`pre-commit`, `pre-push`), workflow jobs, `scripts/validate-changes.sh`.
- **CI integration:** Merge Gate waits on required workflows; Core Platform CI and app deploy workflows are the active gate checks.
- **Coverage tools:** Codecov used in Core CI for unit test coverage; no coverage framework for workflow/hook behavior.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Deploy workflows | live workflow runs | `.github/workflows/reusable-app.yml`, `.github/workflows/brikette.yml` | Validated by Actions outcomes; no unit harness for workflow logic |
| Merge orchestration | live workflow runs | `.github/workflows/merge-gate.yml` | Behavior validated by polling real runs |
| Local hook chain | runtime hook execution | `scripts/git-hooks/*.sh` | No dedicated automated tests for hook decisions/messages |
| Deploy pre-flight pattern reference | unit | `scripts/__tests__/launch-shop/preflight.test.ts` | Existing pre-flight architecture is test-backed and reusable as pattern |
| Validation gate script | runtime script execution | `scripts/validate-changes.sh` | No dedicated script-level automated tests |

#### Test Patterns & Conventions
- CI/workflow behavior is primarily validated in real Actions runs (not mocked).
- Local hooks favor staged-scope checks at pre-commit, then broader full checks pre-push.
- Build/deploy regressions are currently discovered late (during CI runs), not preflighted locally.

#### Coverage Gaps (Planning Inputs)
- **Untested paths:**
  - Step-level "deploy-only" classifier logic does not exist yet; no tests for it.
  - Hook chain behavior (especially bypass/env flags and edge cases) lacks automated regression tests.
  - No automated assertion that merge-gate required-workflow mapping remains in sync with workflow triggers.
- **Extinct tests:**
  - None identified for this scope.

#### Testability Assessment
- **Easy to test:**
  - Path classification logic (pure function/fixture based).
  - Local deploy pre-flight checks (filesystem + config fixtures).
- **Hard to test:**
  - Full merge-gate behavior across asynchronous workflow states.
  - End-to-end behavior of GitHub permissions constraints in `Auto PR` (depends on repository settings).
- **Test seams needed:**
  - Extract classifier logic into a script/module with fixture tests.
  - Add deterministic fixtures for deploy-only vs code-change path sets.

#### Recommended Test Approach
- **Unit tests for:** path-classification logic and local pre-flight checks.
- **Integration tests for:** hook-chain decision points (lock ownership, staged-scope package detection) in a temporary git fixture repo.
- **E2E tests for:** none; use draft PR workflow runs for CI behavior verification.
- **Contract tests for:** expected mapping between change categories and required validation steps (fail-open behavior).
- **Note:** This should be planned explicitly in `/plan-feature` so speed gains do not regress safety guarantees.

### Recent Git History (Targeted)
- CI/deploy hardening and Brikette staging fixes are concentrated in recent commits touching reusable deploy workflows and Brikette workflow.
- Hook scoping work has already landed (`pre-commit` staged package lint/typecheck), while pre-push remains full-repo validation.
- Current fact-find document itself has not been kept aligned with latest run telemetry and needs this refresh (this update).

### Measured GitHub Actions Baseline (captured 2026-02-07)

#### Deploy Brikette (`gh run list --workflow "Deploy Brikette" --limit 120`)
- Sample: 93 runs (2026-01-16 to 2026-02-07).
- Completed outcomes: 3 success (3.3%), 66 failure (73.3%), 21 cancelled (23.3%), 3 in progress.
- Duration (completed): p50 5.5m, p90 20.4m, avg 7.9m.
- `staging` branch subset: 37 runs, 3 success / 26 failure / 8 cancelled, p50 12.0m, p90 18.9m, avg 11.2m.
- Successful staging runs (IDs `21762631207`, `21761875065`, `21761417017`): total ~11.6-11.8m; `Validate & build` ~8.9-9.2m; `Deploy` ~2.4-2.7m.
- Recent staging failure hotspots (latest 20 staging runs):
  - Failing jobs: `Deploy` (10), `Validate & build` (7).
  - Failing steps: `Build` (7), `Deploy` (4), `Post-Deploy Health Check` (4), cache header check (1), artifact download (1).

#### Merge Gate (`gh run list --workflow "Merge Gate" --limit 80`)
- Sample: 40 runs (2026-02-01 to 2026-02-07).
- Outcomes: 0 success, 38 failure, 2 cancelled.
- Duration: p50 2.3m, p90 6.7m.
- Latest 20 failures: dominant failing step is `Gate :: Wait for required workflows` (15/20).
- Example run `21777909794`: gate watched `Core Platform CI` + `Deploy Brikette`; failed when Core CI concluded failure.

#### Core Platform CI (`gh run list --workflow "Core Platform CI" --limit 120`)
- Sample: 120 runs (2026-02-02 to 2026-02-07).
- Outcomes: 0 success, 65 failure, 55 cancelled.
- Duration: p50 12.1m, p90 20.4m, avg 12.9m.
- Latest 20 failed runs hotspots:
  - Failing jobs: `Unit tests` (12), `Lint` (12), `Build` (4), `Typecheck` (4), `Business OS Mirror Guard` (2).
  - Failing steps include `Docs lint`, `Plans lint`, template lint, unit tests, build, typecheck.

#### Auto PR (dev -> staging) (`gh run list --workflow 224568433 --limit 120`)
- Sample: 81 runs (2026-01-17 to 2026-02-07).
- Outcomes: 7 success, 74 failure.
- Duration: p50 0.1m, p90 0.2m (fast fail).
- Latest failure (`21777909299`) error: `GitHub Actions is not permitted to create or approve pull requests` (403).

#### Package Quality Matrix (`gh run list --workflow "Package Quality Matrix"`)
- All events sample: 120 runs (2025-11-29 to 2026-02-07) -> 20 success, 90 failure, 9 cancelled, 1 in progress.
- Scheduled-only sample: 69 runs (2025-12-01 to 2026-02-07) -> 1 success, 68 failure.
- 2026 scheduled subset (2026-01-01 to 2026-02-07): 38 runs -> 0 success, 38 failure; duration p50 3.8m, p90 4.7m.
- Latest 10 scheduled runs show the same 9 failing workspace jobs each run:
  - `apps/product-pipeline`, `apps/brikette`, `apps/cochlearfit`, `apps/api`, `apps/prime`, `apps/storybook`, `packages/design-tokens`, `packages/configurator`, `packages/template-app`.
  - Recurring failing steps include `Build workspace (scoped)`, `apps/api coverage`, `apps/prime lint`, `packages/configurator test with coverage`.

## External Research (If needed)
- None required. Repository audit and first-party GitHub Actions telemetry were sufficient.

## Questions
### Resolved
- Q: Do we already have scoped local checks before commit?
  - A: Yes. Pre-commit already scopes typecheck/lint to staged workspaces and enforces lock + staged-file safety.
  - Evidence: `scripts/git-hooks/pre-commit.sh`, `scripts/git-hooks/typecheck-staged.sh`, `scripts/git-hooks/lint-staged-packages.sh`.

- Q: Do local push guardrails already prevent destructive GitHub actions?
  - A: Yes. Direct pushes to protected branches and non-fast-forward pushes are blocked locally.
  - Evidence: `scripts/git-hooks/pre-push-safety.sh`.

- Q: Is deploy workflow step-level validation currently change-aware?
  - A: No. In reusable app pipeline, lint/typecheck always run; tests are only conditionally skipped on `staging`.
  - Evidence: `.github/workflows/reusable-app.yml`.

- Q: Is overnight quality CI currently healthy?
  - A: No. Scheduled Package Quality Matrix has failed every 2026 run sampled (38/38).
  - Evidence: workflow run telemetry and repeated failing workspace set.

### Open (User Input Needed)
- Q: Should `Core Platform CI` remain a required merge-gate dependency for deploy-only Brikette config changes?
  - Why it matters: This is a major contributor to staging cycle time even when app code is unchanged.
  - Decision impacted: Whether planning includes merge-gate requirement refinement vs only reusable deploy step refinement.
  - Default assumption + risk: Keep current requirement initially (safer), then refine with explicit path-based contract. Risk is slower iteration until refined.

- Q: Should pre-push remain full `pnpm typecheck && pnpm lint`, or move to staged-scope parity with pre-commit?
  - Why it matters: Full pre-push improves safety but adds latency and duplicate work vs CI.
  - Decision impacted: Whether speed plan includes local developer/agent loop optimization.
  - Default assumption + risk: Keep full pre-push for now; optimize only with evidence-backed false-negative analysis. Risk is continued local latency.

- Q: Should recurring overnight matrix failures be treated as blocking for this initiative or tracked as a parallel reliability stream?
  - Why it matters: They distort merge-gate/CI signals and may mask true speed improvements.
  - Decision impacted: Sequencing and acceptance criteria for faster-staging-ci.
  - Default assumption + risk: Parallel stream with explicit visibility in plan; do not block staging-speed implementation on full matrix repair. Risk is ongoing background red signal.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 84%
  - Why: Existing infra already includes path filters, staged-scope hooks, and reusable workflow pattern; adding step-level classifier + local preflight is straightforward.
  - To >=90: implement classifier with fixture tests and validate on one draft PR containing both deploy-only and code changes.

- **Approach:** 79%
  - Why: Direction is clear (change-aware deploy validation + local preflight), but merge-gate dependency policy and pre-push scope policy require explicit decision.
  - To >=80: decide merge-gate treatment for deploy-only changes.
  - To >=90: decide both open policy questions and run a measured trial comparing before/after cycle time across at least 10 staging runs.

- **Impact:** 88%
  - Why: Blast radius is well-known (`reusable-app.yml`, hooks, merge gate), and telemetry identifies bottlenecks precisely.
  - To >=90: define explicit rollback toggles and acceptance metrics in the implementation plan.

- **Testability:** 74%
  - Why: Local classifier/preflight are testable, but workflow orchestration is primarily validated via live Actions runs.
  - To >=80: add fixture tests for classifier and preflight checks.
  - To >=90: add automated regression harness for hook-chain behavior and a CI metrics check script to detect regressions in skip decisions.

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep all safety guardrails (writer lock, protected-branch commit/push blocks, non-fast-forward block).
  - Use fail-open gating logic for any step-skipping behavior.
  - Prefer central reusable workflow updates over app-specific drift.
- Rollout/rollback expectations:
  - Rollout in phases: metrics baseline -> classifier behind explicit conditions -> local preflight -> gate refinements.
  - Rollback is straightforward: remove/disable classifier conditions in `reusable-app.yml` and keep full validation path.
- Observability expectations:
  - CI should explicitly log why steps were skipped or executed.
  - Plan should include baseline vs post-change metrics tracking (p50/p90 run durations, rerun count to success).

## Suggested Task Seeds (Non-binding)
- Build a small metrics script to snapshot workflow latency/failure baselines (same queries used in this fact-find).
- Add deploy change classification to `.github/workflows/reusable-app.yml` and gate lint/typecheck/test with fail-open defaults.
- Add a local `preflight-deploy` script for Brikette static-export and deploy-config checks.
- Add unit tests for classifier and preflight logic using path/fixture matrices.
- Add explicit CI log annotations for skip decisions to improve agent/operator clarity.
- Decide whether merge-gate required workflows should be refined for deploy-only changes.
- Create a parallel reliability mini-plan for recurring overnight Package Quality Matrix failures.

## Planning Readiness
- Status: **Ready-for-planning**
- Blocking items (if any):
  - None for starting planning; open questions are policy choices with safe defaults.
- Recommended next step:
  - Proceed to `/plan-feature faster-staging-ci` and include explicit policy decisions for merge-gate dependency scope, pre-push scope, and overnight-matrix handling.
