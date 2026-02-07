---
Type: Plan
Status: Active
Domain: Infra
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: faster-staging-ci
Overall-confidence: 81%
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
| TASK-01 | IMPLEMENT | Add CI telemetry snapshot script for repeatable baseline/post-change measurement | 90% | M | Pending | - |
| TASK-02 | IMPLEMENT | Implement deploy-only classifier module + fixture tests | 86% | M | Pending | TASK-01 |
| TASK-03 | IMPLEMENT | Integrate classifier into reusable app workflow with conservative defaults and explicit logs | 82% | M | Pending | TASK-02 |
| TASK-04 | IMPLEMENT | Add Brikette local deploy preflight command + tests and agent-facing usage docs | 84% | M | Pending | TASK-02 |
| TASK-05 | DECISION | Define merge-gate requirement contract for deploy-only changes | 70% | S | Needs-Input | TASK-03 |
| TASK-06 | INVESTIGATE | Resolve Auto PR 403 prerequisite path (settings/token/app model) | 65% | S | Pending | - |
| TASK-07 | INVESTIGATE | Define and verify criteria to remove `continue-on-error` on deploy env validation | 75% | S | Pending | TASK-04 |

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
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: mixed conclusions input (`success/failure/cancelled/null`) -> correct counts per conclusion.
    - TC-02: duration segmentation -> completed and success-only p50/p90 computed correctly.
    - TC-03: branch/event filter arguments -> output includes only matching runs.
    - TC-04: empty run list -> script exits cleanly with zeroed stats.
  - **Acceptance coverage:** TC-01/02 cover metrics math; TC-03/04 cover operational behavior.
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
  - **Acceptance coverage:** TC-01/02/03 cover gating contract; TC-04 covers shared workflow blast radius.
  - **Test type:** workflow integration (draft PR/actions runs)
  - **Test location:** GitHub Actions runs for workflows calling `reusable-app.yml`.
  - **Run:** create draft PRs with controlled file-change sets and compare job-step outcomes.
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
- **Confidence:** 70% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — Updating required-workflow mapping is technically straightforward.
  - Approach: 70% — Policy tradeoff (speed vs risk) requires explicit governance choice.
  - Impact: 70% — Mergeability and safety envelope can change significantly.
- **Options:**
  - **Option A:** Keep `Core Platform CI` required for deploy-only changes.
    - Trade-off: slower loop, stronger global safety.
  - **Option B:** Introduce scoped merge-gate contract where deploy-only changes require a narrower set.
    - Trade-off: faster loop, higher need for precise classifier and guardrails.
- **Recommendation:** Option A initially, then evaluate Option B after classifier + preflight evidence is collected.
- **Question for user:**
  - Confirm whether policy should remain Option A for initial implementation.
  - Why it matters: determines whether speed gains are limited to post-merge staging deploy time or include merge-gate path.
  - Default if no answer: Option A (safer), with documented revisit checkpoint.
- **Acceptance:**
  - Decision recorded in plan decision log.
  - Required workflow mapping contract documented for deploy-only vs runtime categories.

### TASK-06: Resolve Auto PR 403 prerequisite path (settings/token/app model)
- **Type:** INVESTIGATE
- **Affects:** `.github/workflows/auto-pr.yml`, `[readonly] repository settings (Actions/permissions)`, `[readonly] docs/plans/faster-staging-ci-fact-find.md`
- **Depends on:** -
- **Confidence:** 65% ⚠️ BELOW THRESHOLD
  - Implementation: 70% — Likely solvable via repo settings/app token changes, but exact root permission model is external.
  - Approach: 65% — Must avoid insecure over-permissioning while restoring automation.
  - Impact: 65% — Affects dev->staging automation throughput and operational burden.
- **Blockers / questions to answer:**
  - Is repository configured to allow GitHub Actions to create PRs?
  - Does `GITHUB_TOKEN` policy permit required endpoint scope, or is a GitHub App/PAT required?
  - What is the least-privileged remediation path?
- **Acceptance:**
  - Root-cause documented with concrete setting/token evidence.
  - Remediation path selected and documented as prerequisite or accepted manual fallback.
  - Follow-on implementation task created with confidence >=80.
- **Notes / references:**
  - Latest failure evidence: run `21778494952` with `403 GitHub Actions is not permitted to create or approve pull requests`.

### TASK-07: Define and verify criteria to remove `continue-on-error` on deploy env validation
- **Type:** INVESTIGATE
- **Affects:** `.github/workflows/reusable-app.yml`, `scripts/validate-deploy-env.sh`, `[readonly] secrets provisioning process docs`
- **Depends on:** TASK-04
- **Confidence:** 75% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — Removing flag is simple once prerequisites are verified.
  - Approach: 75% — Requires explicit readiness criteria to avoid breaking staging deploy loop.
  - Impact: 75% — Can convert silent risk into hard fail; high operational sensitivity.
- **Blockers / questions to answer:**
  - Which secrets are required per environment and are they consistently provisioned?
  - Which current staging failures are expected fallout vs signal when fail-closed?
  - What rollback trigger/owner is needed if failure rate spikes?
- **Acceptance:**
  - Exit criteria documented (secret inventory complete, validation dry-runs pass, rollback owner identified).
  - Implementation-ready follow-on task created to flip `continue-on-error` off with confidence >=80.
- **Notes / references:**
  - Existing temporary exception in `.github/workflows/reusable-app.yml`.

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
- [ ] Baseline/post-change telemetry can be reproduced from a checked-in script.
- [ ] Merge-gate and Auto PR policy dependencies are explicitly decided or tracked with owners.

## Decision Log
- 2026-02-07: Selected script-based classifier approach over inline YAML logic for testability and maintenance.
- 2026-02-07: Kept merge-gate policy decision open; default recommendation is conservative (keep existing required checks initially).
- 2026-02-07: Classified Auto PR 403 as prerequisite for full automation throughput, not a hidden assumption.
