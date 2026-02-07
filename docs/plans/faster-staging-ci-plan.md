---
Type: Plan
Status: Active
Domain: Infra
Created: 2026-02-07
Last-updated: 2026-02-07
Re-planned: 2026-02-07
Fact-checked: 2026-02-07
Audit-Ref: working-tree (plan has uncommitted re-plan changes; all referenced workflow files verified at 7c81a4f556)
Feature-Slug: faster-staging-ci
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: PLAT
Card-ID:
---

# Faster Staging CI Plan

## Summary
This plan implements a conservative, change-aware staging deploy fast path for Brikette without weakening guardrails. The central work is adding a tested deploy-only classifier, using it to gate workflow validation steps with safe defaults, and adding a local preflight command to catch static-export/deploy misconfigurations before push. The plan also formalizes two dependencies discovered in fact-find: merge-gate policy for deploy-only changes and the Auto PR 403 permission failure. Planning keeps reliability work visible but scoped so speed improvements can ship incrementally.

## Goals
- Reduce staging deploy feedback time for deploy-only Brikette changes.
- Reduce rerun loops caused by deploy/static-export misconfiguration.
- Preserve guardrails: writer lock, protected-branch push protections, conservative CI defaults.
- Make skip/run decisions explicit and observable in logs.

## Non-goals
- Removing global quality gates (`Core Platform CI`, merge gate) without explicit policy decision.
- Refactoring all CI workflows in one pass.
- Solving all overnight `Package Quality Matrix` failures in this feature.

## Constraints & Assumptions
- Constraints:
  - Default behavior must be conservative: uncertain classification must run full validation.
  - Changes to `reusable-app.yml` affect multiple app deploy workflows.
  - Pre-push hooks remain full `pnpm typecheck && pnpm lint` unless explicitly re-decided.
- Assumptions:
  - Deploy-only changes can be identified from path sets with acceptable false-negative bias.
  - Local preflight catches a meaningful subset of staging failures (static-export incompatibility/config errors).

## Fact-Find Reference
- Related brief: `docs/plans/faster-staging-ci-fact-find.md`
- Key findings:
  - Staging successes average ~11.7m; `Validate & build` is the dominant portion.
  - `Lint + Typecheck` consume ~3.34m in successful baseline runs.
  - Deploy-only share in sampled staging pushes is ~51.5% (`17/33`).
  - Significant failure signatures are preflight-detectable (`generateStaticParams`, static-export route/data issues, deploy config errors).
  - Auto PR currently fails with 403 in most runs (`76/83`), affecting automation throughput.

## Existing System Notes
- Key modules/files:
  - `.github/workflows/reusable-app.yml` — central validation/build/deploy pipeline for app workflows.
  - `.github/workflows/brikette.yml` — staging caller using reusable workflow.
  - `.github/workflows/merge-gate.yml` — required workflow determination and wait logic.
  - `scripts/validate-deploy-env.sh` — existing deploy env gate, current workflow caller runs it with `continue-on-error: true`.
  - `scripts/git-hooks/pre-push-safety.sh` — destructive push guardrails.
  - `scripts/src/launch-shop/preflight.ts` — existing preflight architecture pattern for local gating.
- Patterns to follow:
  - Script module + focused Jest tests in `scripts/__tests__/...`.
  - CI workflow generation/contract testing pattern in `scripts/__tests__/setup-ci.test.ts`.
  - Guardrail policy coverage pattern in `scripts/__tests__/git-safety-policy.test.ts`.

## Proposed Approach
Introduce a deterministic deploy-only classifier as a reusable script module, test it with fixture-style path matrices, and wire it into `reusable-app.yml` to conditionally run `Lint/Typecheck/Test` only when classification is confident deploy-only. Emit explicit annotations so operators/agents see why each step ran or skipped. In parallel, add a local Brikette deploy preflight command that validates static-export compatibility and critical deploy config to reduce costly staging reruns.

- Option A: Inline classification logic directly in workflow YAML via bash/path matching.
  - Trade-offs: fast to start, hard to test, brittle as file rules evolve.
- Option B: Scripted classifier + workflow glue (chosen).
  - Trade-offs: adds one script/test surface, but gives testability, reuse, and auditable behavior.
- Chosen: Option B because long-term maintainability and confidence depend on deterministic tests, not ad hoc shell conditions.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Add CI telemetry snapshot script for repeatable baseline/post-change measurement (absorbs CI-PAR-01/02 from retired parallelization plan) | 90% | M | Completed | - |
| TASK-02 | IMPLEMENT | Implement deploy-only classifier module + fixture tests | 86% | M | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Integrate classifier into reusable app workflow with conservative defaults and explicit logs | 82% | M | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Add Brikette local deploy preflight command + tests and agent-facing usage docs | 84% | M | Pending | TASK-02 |
| TASK-05 | DECISION | Define merge-gate requirement contract for deploy-only changes | 80% | S | Pending | TASK-03 |
| TASK-06 | IMPLEMENT | Fix Auto PR 403 by adding job-level permissions | 90% | S | Pending | - |
| TASK-07 | IMPLEMENT | Provision secrets and remove `continue-on-error` on deploy env validation | 82% | S | Pending | TASK-04 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Add CI telemetry snapshot script for repeatable baseline/post-change measurement
- **Type:** IMPLEMENT
- **Affects:** `scripts/src/ci/collect-workflow-metrics.ts`, `scripts/__tests__/ci/collect-workflow-metrics.test.ts`, `scripts/package.json`, `[readonly] docs/plans/faster-staging-ci-fact-find.md`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — Existing scripts package patterns support CLI tools that consume `gh` output and emit structured summaries.
  - Approach: 90% — A checked-in script prevents baseline drift and avoids one-off manual telemetry.
  - Impact: 90% — Isolated to scripts/docs with no runtime app impact.
- **Acceptance:**
  - Script captures workflow run stats with explicit segmentation (`completed` vs `success`, branch/event filters).
  - Script output format includes outcome counts, p50/p90, and sample window metadata.
  - Script supports the workflows used in fact-find (`Deploy Brikette`, `Merge Gate`, `Core Platform CI`, `Package Quality Matrix`, Auto PR ID).
  - Script supports per-job duration breakdown to enable test-parallelization ROI analysis (absorbs CI-PAR-01/02 from retired `ci-test-parallelization-plan.md`).
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: mixed conclusions input (`success/failure/cancelled/null`) -> correct counts per conclusion.
    - TC-02: duration segmentation -> completed and success-only p50/p90 computed correctly.
    - TC-03: branch/event filter arguments -> output includes only matching runs.
    - TC-04: empty run list -> script exits cleanly with zeroed stats.
    - TC-05: per-job breakdown input -> individual job durations reported separately.
  - **Acceptance coverage:** TC-01/02 cover metrics math; TC-03/04 cover operational behavior; TC-05 covers parallelization analysis support.
  - **Test type:** unit (Jest, scripts package)
  - **Test location:** `scripts/__tests__/ci/collect-workflow-metrics.test.ts`
  - **Run:** `pnpm --filter scripts test -- scripts/__tests__/ci/collect-workflow-metrics.test.ts`
- **Planning validation:** (required for M/L effort)
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/setup-ci.test.ts` — pass (4/4), validating workflow-generation and script-test harness patterns.
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None.
- **Rollout / rollback:**
  - Rollout: add script/test, document usage in plan notes.
  - Rollback: remove script and references; no production behavior impact.
- **Documentation impact:**
  - Update `docs/plans/faster-staging-ci-fact-find.md` metric command examples to use the script once implemented.
- **Notes / references:**
  - Pattern: `scripts/src/docs-lint.ts` + associated tests in `scripts/__tests__/`.
  - Absorbs CI-PAR-01 (baseline measurement) and CI-PAR-02 (parallel savings estimation) from retired `docs/plans/ci-test-parallelization-plan.md`. Test parallelization decision criteria: proceed if test job >10m and parallel savings >30%; skip if <5m or `test:affected` suffices. Alternatives to evaluate: Jest `--shard`, turbo caching, `test:affected` optimization.
- **Build completion (2026-02-07):**
  - Delivered `scripts/src/ci/collect-workflow-metrics.ts` with reusable summary functions (`summarizeWorkflowRuns`, `summarizeJobDurations`) and a CLI around `gh run list`/`gh run view`.
  - Added scripted entrypoint: `pnpm --filter scripts run collect-workflow-metrics -- ...`.
  - Updated fact-find command examples in `docs/plans/faster-staging-ci-fact-find.md` to use the checked-in metrics command.
  - Confidence reassessment: **90% (holds)**. Tests matched planned assumptions on first implementation cycle; no scope change needed.
  - Validation run:
    - `pnpm --filter scripts test -- scripts/__tests__/ci/collect-workflow-metrics.test.ts` (pass, 5/5)
    - `pnpm --filter scripts exec cross-env JEST_FORCE_CJS=1 jest --config ../jest.config.cjs --no-cache scripts/__tests__/setup-ci.test.ts` (pass, 4/4; `--no-cache` required to bypass unrelated Jest cache writer issue in this environment)
    - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` (pass)
    - `pnpm exec eslint scripts/src/ci/collect-workflow-metrics.ts scripts/__tests__/ci/collect-workflow-metrics.test.ts` (pass)

### TASK-02: Implement deploy-only classifier module + fixture tests
- **Type:** IMPLEMENT
- **Affects:** `scripts/src/ci/classify-deploy-change.ts`, `scripts/__tests__/ci/classify-deploy-change.test.ts`, `scripts/src/ci/classifier-fixtures.ts`, `scripts/package.json`
- **Depends on:** TASK-01
- **Confidence:** 86%
  - Implementation: 88% — Path-based classification is straightforward and already evidenced in fact-find analysis.
  - Approach: 86% — Module-based classifier is maintainable and testable versus inline workflow logic.
  - Impact: 86% — Impacts CI behavior when integrated, but isolated behind conservative default.
- **Acceptance:**
  - Classifier returns at minimum: `isDeployOnly`, `reason`, `uncertain`.
  - Default behavior marks unknown/ambiguous path sets as `uncertain=true`.
  - Brikette deploy surfaces (`.github/workflows/reusable-app.yml`, `.github/workflows/brikette.yml`, deploy scripts/config files) classify as deploy-only.
  - Runtime code/content changes classify as non-deploy-only.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: workflow-only commit paths -> `isDeployOnly=true`, `uncertain=false`.
    - TC-02: mixed workflow + `apps/brikette/src/**` -> `isDeployOnly=false`.
    - TC-03: unknown new file category (e.g., unclassified path) -> `uncertain=true`.
    - TC-04: empty path set -> `uncertain=true`.
    - TC-05: deploy config change (`apps/brikette/wrangler.toml`) -> `isDeployOnly=true`.
  - **Acceptance coverage:** TC-01/05 cover positive cases; TC-02/03/04 cover safety and edge cases.
  - **Test type:** unit (Jest)
  - **Test location:** `scripts/__tests__/ci/classify-deploy-change.test.ts`
  - **Run:** `pnpm --filter scripts test -- scripts/__tests__/ci/classify-deploy-change.test.ts`
- **Planning validation:** (required for M/L effort)
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/launch-shop/preflight.test.ts` — pass (17/17), validating preflight-style gating and script testing patterns.
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None.
- **What would make this ≥90%:**
  - Validate classifier against a sampled historical set (e.g., last 50 staging SHAs) and document false-positive/false-negative rates.
- **Rollout / rollback:**
  - Rollout: ship classifier behind workflow integration in TASK-03.
  - Rollback: classifier module can remain unused; no runtime impact.
- **Documentation impact:**
  - Add classifier rule list to plan/fact-find and operator notes.
- **Notes / references:**
  - Conservative default requirement from fact-find: uncertain => run full validation path.

### TASK-03: Integrate classifier into reusable app workflow with conservative defaults and explicit logs
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/reusable-app.yml`, `scripts/src/ci/classify-deploy-change.ts`, `[readonly] .github/workflows/brikette.yml`, `[readonly] .github/workflows/merge-gate.yml`
- **Depends on:** TASK-02
- **Confidence:** 82%
  - Implementation: 84% — Workflow conditions are straightforward once classifier output is available.
  - Approach: 82% — Central reusable workflow integration avoids app-specific drift.
  - Impact: 82% — High blast radius across deploy callers requires careful rollout and logging.
- **Acceptance:**
  - `reusable-app.yml` computes classification before validation steps.
  - `Lint/Typecheck/Test` gates are conditional on classifier outcome and still run on uncertainty.
  - Workflow logs include a clear statement of classification result and why steps were skipped/run.
  - No direct bypass of `Build` and `Deploy` without explicit separate policy.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: deploy-only paths + confident classification -> validation steps skip, build/deploy still run.
    - TC-02: mixed/runtime paths -> validation steps run.
    - TC-03: uncertain classification -> validation steps run (safe default).
    - TC-04: non-Brikette caller using reusable workflow -> no workflow syntax/runtime regressions.
    - TC-05: YAML syntax validation of modified `reusable-app.yml` -> valid workflow syntax (actionlint or equivalent).
  - **Acceptance coverage:** TC-01/02/03 cover gating contract; TC-04 covers shared workflow blast radius; TC-05 catches syntax regressions locally.
  - **Test type:** workflow integration (draft PR/actions runs) + local YAML lint
  - **Test location:** GitHub Actions runs for workflows calling `reusable-app.yml`; local: `actionlint .github/workflows/reusable-app.yml`
  - **Run:** create draft PRs with controlled file-change sets and compare job-step outcomes; locally: `actionlint .github/workflows/reusable-app.yml`
- **Planning validation:** (required for M/L effort)
  - Tests run: `pnpm --filter scripts test -- scripts/__tests__/setup-ci.test.ts` — pass (4/4), verifying existing reusable-workflow contract generation pattern.
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None.
- **What would make this ≥90%:**
  - Execute two controlled draft PR validations (deploy-only and mixed-change) and archive workflow links in plan notes.
- **Rollout / rollback:**
  - Rollout: enable gating in reusable workflow with explicit conservative conditions.
  - Rollback: revert workflow gating conditions to always-run validation path.
- **Documentation impact:**
  - Update operator documentation with classifier behavior and skip rationale interpretation.
- **Notes / references:**
  - Existing central blast-radius pattern already established in `.github/workflows/reusable-app.yml`.
  - actionlint bumped to v1.7.10 in `merge-gate.yml` (7c81a4f556), resolving false positive on `include-hidden-files`. TC-05 can use this version.

### TASK-04: Add Brikette local deploy preflight command + tests and agent-facing usage docs
- **Type:** IMPLEMENT
- **Affects:** `scripts/src/brikette/preflight-deploy.ts`, `scripts/__tests__/brikette/preflight-deploy.test.ts`, `package.json`, `docs/testing-policy.md`, `[readonly] scripts/src/launch-shop/preflight.ts`
- **Depends on:** TASK-02
- **Confidence:** 84%
  - Implementation: 86% — Existing preflight architecture in scripts package can be adapted for Brikette deploy checks.
  - Approach: 84% — Catching known failure signatures locally reduces CI rerun cost.
  - Impact: 84% — Adds local command/docs without changing branch protections.
- **Acceptance:**
  - New command checks static-export compatibility and critical deploy config (`generateStaticParams`-style guardrails, required config fields).
  - Command exits non-zero on deploy-blocking findings and emits actionable diagnostics.
  - Docs include when to run command in staging deploy loops.
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: valid fixture config/routes -> exit 0.
    - TC-02: missing static-export requirement fixture -> non-zero with specific diagnostic.
    - TC-03: missing required deploy config field -> non-zero with config-specific diagnostic.
    - TC-04: unknown parser/runtime error -> non-zero with stable error envelope.
  - **Acceptance coverage:** TC-01 covers happy path; TC-02/03/04 cover known failure and resilience paths.
  - **Test type:** unit/integration-lite (fixture-based script tests)
  - **Test location:** `scripts/__tests__/brikette/preflight-deploy.test.ts`
  - **Run:** `pnpm --filter scripts test -- scripts/__tests__/brikette/preflight-deploy.test.ts`
- **Planning validation:** (required for M/L effort)
  - Tests run:
    - `pnpm --filter scripts test -- scripts/__tests__/launch-shop/preflight.test.ts` — pass (17/17)
    - `pnpm --filter scripts test -- scripts/__tests__/git-safety-policy.test.ts` — pass (114/114), validating guardrail-related script test harness quality.
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None.
- **What would make this ≥90%:**
  - Replay latest 20 staging-failure signatures through fixtures and prove which are caught pre-push.
- **Rollout / rollback:**
  - Rollout: add command and document operator/agent usage; initially optional, then evaluate hook integration separately.
  - Rollback: remove command/docs only; no CI impact.
- **Documentation impact:**
  - Update `docs/testing-policy.md` or workflow guide section with targeted preflight command usage.
- **Notes / references:**
  - Pattern reference: `scripts/src/launch-shop/preflight.ts` and `scripts/__tests__/launch-shop/preflight.test.ts`.

### TASK-05: Define merge-gate requirement contract for deploy-only changes
- **Type:** DECISION
- **Affects:** `[readonly] .github/workflows/merge-gate.yml`, `[readonly] .github/workflows/ci.yml`, `[readonly] docs/plans/faster-staging-ci-fact-find.md`
- **Depends on:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — `merge-gate.yml` uses `dorny/paths-filter@v3` with per-workflow filters; adding deploy-only exclusion to the `core` filter is a known pattern.
  - Approach: 80% — Investigation confirmed staging has no branch protection (only `main` has a ruleset requiring `verify`). Deploy-only changes on staging don't currently wait for merge gate anyway. For PRs to `main`, the path filter approach is proven.
  - Impact: 80% — Blast radius is limited: only PRs to `main` with exclusively deploy-config paths would skip Core Platform CI. Conservative default (uncertain → run Core CI) already built into classifier design.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 70%
- **Updated confidence:** 80%
  - Implementation: 85% — `merge-gate.yml:42-47` defines `core` filter as `**/*` minus `cms/skylar`; adding deploy-only exclusions follows the same negation pattern.
  - Approach: 80% — Staging has no branch protection (API returns 404). Active ruleset targets `main` only (`ruleset 11841137`). Speed gains from this task only materialize on PRs to main; staging pushes already bypass merge gate entirely.
  - Impact: 80% — Path-filter is already the mechanism for scoped requirements. Adding deploy-only exclusion is consistent with existing cms/skylar exclusions.
- **Investigation performed:**
  - Repo: `.github/workflows/merge-gate.yml` (path filters lines 29-119, dynamic workflow mapping lines 210-227, polling lines 298-352)
  - Repo: `.github/workflows/ci.yml` (paths-ignore config lines 5-15)
  - Repo: GitHub branch protection API — `dev`/`staging` return 404 (unprotected); `main` has ruleset 11841137 requiring `verify` status check
  - Docs: `docs/plans/faster-staging-ci-fact-find.md` — confirms "0-success workflows coexist with ongoing delivery" because staging is unprotected
- **Decision / resolution:**
  - **Decision: Option A (keep Core Platform CI required) for initial implementation.** Re-evaluate after classifier evidence is collected in TASK-02/03.
  - Rationale: Since staging has no branch protection, the speed gain from this task only applies to PRs to `main`. The existing path-filter mechanism in merge-gate already supports scoped exclusions (cms/skylar pattern). When classifier evidence is available, adding deploy-only exclusions to the `core` filter is low-risk and follows established patterns.
  - Revisit checkpoint: after TASK-03 ships and 2 weeks of classifier telemetry is collected.
- **Changes to task:**
  - Dependencies: unchanged (TASK-03)
  - Type changed from DECISION to DECISION (confirmed — no implementation needed until revisit checkpoint)

- **Options:**
  - **Option A:** Keep `Core Platform CI` required for deploy-only changes. ← **Chosen for initial implementation.**
    - Trade-off: slower PR-to-main loop, stronger global safety.
  - **Option B:** Add deploy-only path exclusions to `core` filter in `merge-gate.yml` (analogous to existing cms/skylar exclusions).
    - Trade-off: faster PR-to-main loop, requires precise classifier and 2-week evidence window.
    - Implementation path: add negation patterns to `core` filter (e.g., `!.github/workflows/brikette.yml`, `!apps/brikette/wrangler.toml`, etc.)
- **Recommendation:** Option A now, Option B after classifier evidence window.
- **Acceptance:**
  - Decision recorded in plan decision log.
  - Required workflow mapping contract documented for deploy-only vs runtime categories.
  - Revisit checkpoint date recorded.

### TASK-06: Fix Auto PR 403 by adding job-level permissions
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/auto-pr.yml`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — Root cause identified: `auto-pr.yml` declares workflow-level permissions but repository `default_workflow_permissions` is `read`. Adding job-level permissions block is a 4-line fix following GitHub's documented behavior.
  - Approach: 90% — Job-level permissions is the least-privileged fix: only affects `auto-pr.yml`, doesn't change repo-wide settings. Proven pattern: `bos-export.yml` uses equivalent setup.
  - Impact: 90% — Only affects `auto-pr.yml` workflow. Restores dev->staging automation (currently 76/83 failures).

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 65%
- **Updated confidence:** 90%
  - Implementation: 92% — Root cause confirmed via repo investigation. `auto-pr.yml` uses `actions/github-script@v7` with implicit `GITHUB_TOKEN`. Workflow-level `permissions` block exists (line ~5-8) but is overridden by repo default `default_workflow_permissions: read`. Fix: add `permissions` block at job level.
  - Approach: 90% — Three options evaluated; job-level permissions is least-privileged. `bos-export.yml` uses equivalent pattern (explicit `GH_TOKEN` env var with same permission set) and works.
  - Impact: 90% — Scoped to one workflow file. No other workflows affected. Restores automation that currently fails 91.6% of runs.
- **Investigation performed:**
  - Repo: `.github/workflows/auto-pr.yml` — has workflow-level `permissions: { contents: write, pull-requests: write, issues: write }` but no job-level permissions block
  - Repo: `.github/workflows/bos-export.yml` — successful PR creation using same permission structure + explicit `GH_TOKEN` env var
  - GitHub API: `default_workflow_permissions: read`, `can_approve_pull_request_reviews: false`
  - Evidence: `actions/github-script@v7` at line 30-64 uses implicit `GITHUB_TOKEN` for `github.rest.pulls.create()`
- **Decision / resolution:**
  - **Root cause:** Repository default workflow permissions is `read`. Workflow-level permission declarations are insufficient when the repo default is restrictive — job-level permissions are needed.
  - **Chosen fix:** Add job-level `permissions` block to the `ensure-pr` job in `auto-pr.yml`. This is the least-privileged option (only affects this workflow, no repo settings changes).
  - **Rejected alternatives:**
    - Change repo `default_workflow_permissions` to `write` — too broad, affects all workflows.
    - Switch to `gh` CLI with explicit `GH_TOKEN` env var — works but unnecessary when job-level permissions suffice.
- **Changes to task:**
  - Type: INVESTIGATE → IMPLEMENT (root cause resolved, implementation path clear)
  - Dependencies: none (unchanged)

- **Acceptance:**
  - `auto-pr.yml` `ensure-pr` job has explicit job-level `permissions: { contents: write, pull-requests: write }`.
  - Auto PR workflow succeeds on next dev->staging trigger (no more 403).
  - No other workflows are modified.
- **Test contract:**
  - **TC-01:** Push to dev branch triggers auto-pr workflow → PR created successfully to staging (no 403).
  - **TC-02:** Existing PR already exists for dev->staging → workflow handles gracefully (no duplicate PR error).
  - **Test type:** workflow integration (live trigger)
  - **Test location:** GitHub Actions run logs for `auto-pr.yml`
  - **Run:** Push a commit to dev and verify workflow run in `gh run list --workflow auto-pr.yml --limit 5`
- **Rollout / rollback:**
  - Rollout: merge permissions fix; verify on next dev push.
  - Rollback: revert the 4-line permissions block; returns to current broken state (manual PRs).
- **Notes / references:**
  - Failure evidence: run `21778494952` with `403 GitHub Actions is not permitted to create or approve pull requests`.
  - Fix pattern: same as `bos-export.yml` job-level permissions.

### TASK-07: Provision secrets and remove `continue-on-error` on deploy env validation
- **Type:** IMPLEMENT
- **Affects:** `.github/workflows/reusable-app.yml` (lines 156-161), GitHub repository secrets, `scripts/validate-deploy-env.sh`
- **Depends on:** TASK-04
- **Confidence:** 82%
  - Implementation: 85% — Secret inventory is complete. Missing secrets identified: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`. Provisioning via `gh secret set` is straightforward. Removing `continue-on-error: true` is a 1-line deletion.
  - Approach: 82% — Two viable paths: provision GitHub secrets directly (simplest) or use SOPS per-app encrypted files. Direct provisioning is recommended for Brikette since it's a static site and auth secrets are build-time placeholders.
  - Impact: 82% — Converts soft-fail to hard-fail in `reusable-app.yml`. Other callers (`ci.yml`, `cms.yml`) already hard-fail on this step, so behavior is being aligned. Risk: if a secret is accidentally removed, staging deploys will block — but this is the intended behavior.

#### Re-plan Update (2026-02-07)
- **Previous confidence:** 75%
- **Updated confidence:** 82%
  - Implementation: 85% — Full secret inventory completed. `validate-deploy-env.sh` checks: always-required (`NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) + conditional (Stripe, Redis, email, Sanity). Cloudflare secrets ✅ provisioned. Auth secrets ❌ missing. Workflow already uses fallback placeholders (`ci-build-placeholder-32chars!!`).
  - Approach: 82% — Direct secret provisioning is simplest. SOPS alternative exists but Brikette has no `.env.preview.sops` file. Other workflows (`ci.yml:320`, `cms.yml:165`) already hard-fail on this validation — `reusable-app.yml` is the only one with `continue-on-error`.
  - Impact: 82% — Scoped to deploy validation step. Aligns `reusable-app.yml` with `ci.yml`/`cms.yml` behavior. Added in commit `c66d3cc235` (2026-02-06) as explicit temporary unblock.
- **Investigation performed:**
  - Repo: `scripts/validate-deploy-env.sh` — full secret inventory: always-required (5 vars), conditional Stripe (3), Redis (2), email (1-2), Sanity (2)
  - Repo: `.github/workflows/reusable-app.yml:156-161` — `continue-on-error: true` with TEMP comment
  - Repo: `.github/workflows/ci.yml:320` — no `continue-on-error` (hard-fail) ✅
  - Repo: `.github/workflows/cms.yml:165` — no `continue-on-error` (hard-fail) ✅
  - GitHub: `gh secret list` — `CLOUDFLARE_ACCOUNT_ID` ✅, `CLOUDFLARE_API_TOKEN` ✅, `NEXTAUTH_SECRET` ❌, `SESSION_SECRET` ❌, `CART_COOKIE_SECRET` ❌
  - Repo: `.github/workflows/reusable-app.yml:167-169` — fallback placeholder values used for missing auth secrets
- **Decision / resolution:**
  - **Provision 3 missing auth secrets** via `gh secret set` (generate cryptographically random 32+ char values).
  - **Remove `continue-on-error: true`** from `reusable-app.yml:161` after secrets are provisioned.
  - **Remove fallback placeholder values** from deploy step env vars (lines 167-169) — no longer needed once real secrets exist.
  - Rollback owner: platform team (revert to `continue-on-error: true` if failure rate spikes).
- **Changes to task:**
  - Type: INVESTIGATE → IMPLEMENT (root cause resolved, implementation path clear)
  - Dependencies: TASK-04 (unchanged — preflight should exist before tightening CI validation)

- **Acceptance:**
  - `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` provisioned in GitHub repository secrets.
  - `continue-on-error: true` removed from `reusable-app.yml` deploy env validation step.
  - Fallback placeholder values removed from deploy step env vars.
  - Next staging deploy run passes validation step (no soft-fail).
- **Test contract:**
  - **TC-01:** Staging deploy with provisioned secrets → validation step passes (exit 0), deploy proceeds.
  - **TC-02:** Validation script dry-run locally with all required env vars set → exit 0.
  - **TC-03:** Validation script dry-run with one required secret missing → exit non-zero with diagnostic.
  - **Test type:** workflow integration (live CI run) + local dry-run
  - **Test location:** GitHub Actions run logs for `reusable-app.yml`; local: `DRY_RUN=1 ./scripts/validate-deploy-env.sh`
  - **Run:** Push staging deploy change and verify validation step in workflow logs; locally: `DRY_RUN=1 NEXTAUTH_SECRET=x SESSION_SECRET=x CART_COOKIE_SECRET=x CLOUDFLARE_ACCOUNT_ID=x CLOUDFLARE_API_TOKEN=x ./scripts/validate-deploy-env.sh`
- **Rollout / rollback:**
  - Rollout: provision secrets → verify dry-run → remove `continue-on-error` → verify live run.
  - Rollback: re-add `continue-on-error: true` to `reusable-app.yml` (1-line revert).
- **Notes / references:**
  - Temporary exception added in commit `c66d3cc235` (2026-02-06).
  - Related: `docs/plans/archive/integrated-secrets-workflow-plan.md` for long-term SOPS strategy.
  - **Partial pre-work done (7c81a4f556):** `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET` are now *declared* as optional secrets in `reusable-app.yml`'s `workflow_call.secrets` block (lines 58-63, all `required: false`). All 6 caller workflows (brikette, xa, prime, business-os-deploy, product-pipeline, skylar — 7 total `secrets: inherit` instances including brikette's 2 jobs) use `secrets: inherit` so no caller changes were needed. Remaining work: provision the actual secret values in GitHub and remove `continue-on-error`.

## Risks & Mitigations
- Classifier false positives skip needed validation.
  - Mitigation: uncertain defaults to full validation; fixture tests and historical replay before broad rollout.
- Shared workflow blast radius causes regressions in non-Brikette apps.
  - Mitigation: draft PR validation for at least one additional reusable workflow caller before merge.
- Speed gains hidden by unrelated CI reliability failures.
  - Mitigation: track both per-run duration and loop-level time-to-green; include reliability stream status in reporting.
- Auto PR remains broken and reduces realized throughput.
  - Mitigation: treat as prerequisite for full automation and track explicitly as dependency stream.

## Observability
- Logging:
  - Emit classifier decision and matched rule set in workflow annotations.
  - Emit explicit reason strings for each skipped validation step.
- Metrics:
  - Deploy-only run count, skip count, uncertain count, fallback-to-full count.
  - Staging deploy p50/p90 and time-to-green before/after implementation.
- Alerts/Dashboards:
  - Weekly check on misclassification incidents and rerun-to-green counts.

## Acceptance Criteria (overall)
- [ ] Deploy-only classifier exists, is tested, and defaults safely on uncertainty.
- [ ] Reusable app workflow can skip only intended validation steps with clear logs.
- [ ] Local preflight exists and catches known Brikette deploy/static-export failure signatures.
- [x] Baseline/post-change telemetry can be reproduced from a checked-in script.
- [ ] Merge-gate and Auto PR policy dependencies are explicitly decided or tracked with owners.

## Absorbed Plans
- `docs/plans/ci-test-parallelization-plan.md` (retired 2026-02-07): CI test performance baseline measurement (CI-PAR-01) and parallel savings estimation (CI-PAR-02) absorbed into TASK-01. Decision criteria preserved: proceed with parallelization if test job >10m and savings >30%; skip if <5m or `test:affected` suffices. Alternatives to evaluate (CI-PAR-03): Jest `--shard`, turbo caching, `test:affected` optimization. Phase 1 implementation (CI-PAR-04/05) and Phase 2 docs (CI-PAR-06) deferred pending TASK-01 baseline data.

## Decision Log
- 2026-02-07: Selected script-based classifier approach over inline YAML logic for testability and maintenance.
- 2026-02-07: Kept merge-gate policy decision open; default recommendation is conservative (keep existing required checks initially).
- 2026-02-07: Classified Auto PR 403 as prerequisite for full automation throughput, not a hidden assumption.
- 2026-02-07 (re-plan): Auto PR 403 root-caused to repo `default_workflow_permissions: read` overriding workflow-level permissions. Fix: add job-level permissions block. TASK-06 promoted from INVESTIGATE to IMPLEMENT.
- 2026-02-07 (re-plan): Deploy env validation `continue-on-error` root-caused to 3 missing auth secrets (`NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`). Fix: provision secrets + remove soft-fail. TASK-07 promoted from INVESTIGATE to IMPLEMENT.
- 2026-02-07 (re-plan): Merge-gate investigation confirmed staging has no branch protection; speed gain from TASK-05 only applies to PRs to main. Confirmed Option A (keep Core Platform CI required) with revisit checkpoint after classifier evidence.
- 2026-02-07 (re-plan): Absorbed `ci-test-parallelization-plan.md` into TASK-01. Test perf baseline, parallelization alternatives, and decision criteria preserved. Original plan retired.
- 2026-02-07 (build): Completed TASK-01 with checked-in telemetry collector script/tests and fact-find command migration to scripted collection.
- 2026-02-07 (external): Commit `7c81a4f556` fixed 5 actionlint errors across 3 workflows. Relevant to this plan: (a) TASK-07 — 3 auth secrets now declared in `reusable-app.yml` workflow_call.secrets block (provisioning still needed); (b) TASK-03 — actionlint v1.7.10 now pinned in `merge-gate.yml` (resolves false positive on `include-hidden-files`).
