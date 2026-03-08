---
Type: Plan
Status: Active
Domain: Products
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-content-deploy-lane
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, ops-ci-fix
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall weighted by dependency-critical path risk
Auto-Build-Intent: plan-only
---

# XA Content Deploy Lane Plan

## Summary

Create an explicit split between code-change CI and uploader-driven content deploys:

1. Code-change lane stays strict in `.github/workflows/xa.yml` (lint + typecheck + tests + deploy).
2. Uploader content lane uses Pages hook first and `xa-b-redeploy.yml` fallback, without lint/typecheck/tests.

## Decision Frame

- **Decision owner:** product/engineering operator for XA deploy workflow.
- **Decision/question:** how to reduce uploader publish-to-live time without weakening code-change quality gates.
- **Implicit claim:** uploader-driven content deploys can be decoupled from code-quality CI while preserving CI quality for code pushes.

## Falsifiable Objective

By the end of TASK-04, uploader-triggered publishes must satisfy all:

- No uploader-triggered deployment dispatches `xa.yml`.
- Fast lane path is always one of:
  - Pages hook (`provider=cloudflare_pages_deploy_hook`), or
  - GitHub dispatch to `xa-b-redeploy.yml`.
- Publish-to-live latency (`dev.xa-b-site.pages.dev`) reaches p50 <= 8 minutes over 5 trials.
- Code-change pushes touching XA apps still run lint/typecheck/tests in `xa.yml`.

## Evidence Audit (Current State)

- `xa.yml` enforces lint/typecheck/tests before deploy jobs (`needs: [test]`): `.github/workflows/xa.yml`.
- `xa-b-redeploy.yml` exists as build+deploy workflow without lint/typecheck/tests: `.github/workflows/xa-b-redeploy.yml`.
- Drop-worker preview fallback is pinned to `XA_GITHUB_WORKFLOW_FILE = "xa-b-redeploy.yml"`: `apps/xa-drop-worker/wrangler.toml`.
- Deploy trigger path currently dispatches configured workflow when Pages hook is absent: `apps/xa-drop-worker/src/index.ts`.

## Scope

### In scope

- Route uploader-triggered deploys away from `xa.yml`.
- Harden fallback workflow selection so `xa.yml` cannot be used for uploader content deploy dispatch.
- Preserve and verify strict CI lane for code pushes.
- Produce measured before/after timing evidence.

### Out of scope

- Removing lint/typecheck/tests from code-change CI.
- Reworking XA app build systems.
- Replacing Cloudflare Pages deployment model.

## Active tasks

- [x] TASK-01: Enforce fast-lane workflow routing in drop-worker config/runtime
- [ ] TASK-02: Ensure `xa-b-redeploy.yml` is dispatchable from default-branch context (deferred until first main promotion)
- [x] TASK-03: Add deploy-lane observability and operator diagnostics
- [ ] TASK-04: Run checkpoint validation and cutover decision

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Remove `xa.yml` fallback path from uploader-triggered deploy routing | 90% | S | Complete (2026-03-05) | - | TASK-03,TASK-04 |
| TASK-02 | IMPLEMENT | Make `xa-b-redeploy.yml` reliably resolvable/dispatchable in GH Actions API path | 84% | M | Deferred (until first main promotion) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Surface lane/provider/workflow and hard failure reasons in sync response telemetry | 86% | S | Complete (2026-03-05) | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Validate latency + policy invariants and decide rollout completion | 88% | S | Pending | TASK-01,TASK-02,TASK-03 | - |

## Tasks

### TASK-01: Enforce fast-lane workflow routing in drop-worker config/runtime

- **Type:** IMPLEMENT
- **Deliverable:** uploader-triggered deploy requests cannot target `xa.yml`.
- **Execution-Skill:** lp-do-build
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-drop-worker/wrangler.toml`
  - `apps/xa-drop-worker/src/index.ts`
  - `apps/xa-drop-worker/__tests__/xaDropWorker*.test.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-04

**Confidence**

- Implementation: 92% (single routing path in `handleXaBDeployTrigger` and one preview var currently controls fallback target).
- Approach: 90% (explicit guard against `xa.yml` is straightforward and local to drop-worker).
- Impact: 88% (directly removes known slow-path trigger source).

**Evidence**

- Preview fallback currently points to `xa.yml` in `wrangler.toml`.
- Dispatch path reads configured workflow and posts to GitHub API in `index.ts`.

**Acceptance Criteria**

- `wrangler.toml` preview fallback workflow is `xa-b-redeploy.yml`.
- Runtime guard rejects uploader-triggered dispatch when configured workflow is `xa.yml`.
- Tests cover guard behavior and successful dispatch behavior.

**Validation Contract (TC-01)**

- `pnpm --filter @apps/xa-drop-worker typecheck`
- `pnpm --filter @apps/xa-drop-worker lint`
- CI signal: `XA Apps CI` run for code-change push remains green on validation/test phases.

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Add/adjust tests that fail when workflow fallback remains `xa.yml` or runtime allows dispatch to `xa.yml`.
- Green:
  - Update preview fallback variable.
  - Add runtime guard + explicit error payload.
- Refactor:
  - Consolidate workflow validation in a helper to avoid duplicated checks.

**Rollout / Rollback**

- Rollout: deploy drop-worker preview after merge to dev.
- Rollback: revert guard + fallback var change if uploader deploys fail unexpectedly.

**Documentation Impact**

- Update deploy comments in `apps/xa-drop-worker/wrangler.toml` to reflect final fallback policy.

### TASK-02: Ensure `xa-b-redeploy.yml` is dispatchable from default-branch context

- **Type:** IMPLEMENT
- **Deliverable:** fallback workflow is resolvable by GitHub workflow-dispatch endpoint in active branch flow.
- **Execution-Skill:** lp-do-build
- **Status:** Deferred (until first main promotion)
- **Affects:**
  - `.github/workflows/xa-b-redeploy.yml`
  - branch-flow operational state (`dev -> staging -> main`)
- **Depends on:** TASK-01
- **Blocks:** TASK-04

**Confidence**

- Implementation: 86% (workflow already exists; main risk is default-branch visibility/state).
- Approach: 84% (use branch-flow promotion and direct API verification).
- Impact: 82% (fallback reliability determines publish continuity when Pages hook unavailable).

**Evidence**

- Workflow file exists in repo.
- GitHub API lookup previously returned 404 for this workflow on default branch context.

**Acceptance Criteria**

- GitHub API resolves `xa-b-redeploy.yml` workflow on default branch.
- Dispatch from drop-worker fallback returns accepted response with workflow `xa-b-redeploy.yml`.
- No uploader-triggered dispatch uses `xa.yml`.

**Validation Contract (TC-02)**

- `gh workflow view xa-b-redeploy.yml` succeeds (or equivalent API check).
- Manual dispatch dry-run to `xa-b-redeploy.yml` succeeds for `dev` ref.
- `pnpm --filter @apps/xa-b lint` and `pnpm --filter @apps/xa-b typecheck` remain unaffected for code lane changes.

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Verify workflow lookup/dispatch currently fails in default-branch context.
- Green:
  - Promote workflow visibility through standard branch flow.
  - Re-run lookup + dispatch verification.
- Refactor:
  - Add a short ops note to avoid future fallback regressions to `xa.yml`.

**Rollout / Rollback**

- Rollout: enable fallback policy only after successful workflow resolution check.
- Rollback: temporary Pages-hook-only mode if fallback dispatch degrades.

**Documentation Impact**

- Record workflow visibility requirement in plan completion notes.

### TASK-03: Add deploy-lane observability and operator diagnostics

- **Type:** IMPLEMENT
- **Deliverable:** sync responses and logs clearly report chosen deploy lane, workflow/provider, and actionable failure reasons.
- **Execution-Skill:** lp-do-build
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-drop-worker/src/index.ts`
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route*.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04

**Confidence**

- Implementation: 88% (deploy result objects already carry `status`, `reason`, `nextEligibleAt`, and provider/workflow payload shapes).
- Approach: 86% (surface existing fields consistently; add explicit guard error codes).
- Impact: 84% (operator can distinguish transient hook failures from policy failures immediately).

**Evidence**

- `handleXaBDeployTrigger` returns provider/workflow information for success cases.
- uploader deploy guidance builder already consumes structured deploy result states.

**Acceptance Criteria**

- Sync API response always includes lane-identifying details for deploy outcome.
- Policy failure (`workflow=xa.yml` attempt) has deterministic error code and operator guidance.
- Tests assert telemetry fields for Pages hook, GH dispatch, cooldown, and policy-failure paths.

**Validation Contract (TC-03)**

- `pnpm --filter @apps/xa-uploader typecheck`
- `pnpm --filter @apps/xa-uploader lint`
- `pnpm --filter @apps/xa-drop-worker typecheck`
- `pnpm --filter @apps/xa-drop-worker lint`

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Add tests for missing/ambiguous lane telemetry and policy-failure code paths.
- Green:
  - Implement consistent response shaping and operator display guidance.
- Refactor:
  - Centralize error-code mapping to prevent drift between drop-worker and uploader.

**Rollout / Rollback**

- Rollout: deploy drop-worker + uploader preview together to preserve contract compatibility.
- Rollback: revert telemetry additions only if they cause response-contract regressions.

**Documentation Impact**

- Add lane diagnostics fields to any internal operator runbook references touched by this change.

### TASK-04: Checkpoint validation and cutover decision

- **Type:** CHECKPOINT
- **Execution-Skill:** lp-do-build
- **Status:** Pending
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -

**Checkpoint Contract (CK-01)**

- Baseline capture:
  - Gather last 30 `XA Apps CI` push run durations; compute p50/p90.
- Post-change trial:
  - Execute 5 uploader publish runs in preview with wall-clock timestamps.
  - Record publish accepted time, deploy trigger provider/workflow, and first HTTP 200 on target product URL.
- Policy guard verification:
  - Confirm zero uploader-triggered references to `xa.yml` across trial logs/responses.

**Exit Criteria**

- p50 publish-to-live <= 8 minutes.
- 5/5 runs use approved fast lane providers (`cloudflare_pages_deploy_hook` or `xa-b-redeploy.yml`).
- Code-change push still executes `xa.yml` validation + test stages.

**Rollback Decision Rule**

- If >=2/5 trials fail fast-lane policy or p50 exceeds 10 minutes, pause rollout and run `/lp-do-replan` before further changes.

## Risks & Mitigations

- Risk: fallback workflow API resolution breaks outside dev branch context.
  - Mitigation: make workflow visibility an explicit task gate before enabling fallback.
- Risk: Pages hook transient failures increase failed publishes.
  - Mitigation: preserve fallback dispatch and surface explicit operator diagnostics.
- Risk: accidental regression reintroduces `xa.yml` fallback.
  - Mitigation: runtime guard + tests + CK-01 policy verification.
- Risk: confidence overstatement due missing environment access.
  - Mitigation: checkpoint requires observed preview trials before marking complete.

## Acceptance Criteria (Overall)

- [ ] Uploader-triggered deploy path cannot dispatch `xa.yml`.
- [ ] `xa.yml` remains unchanged as strict code-change lane.
- [ ] Fast lane is observable (provider/workflow) in operator-facing sync results.
- [ ] Publish-to-live latency improves to target threshold and is documented with trial evidence.

## Build Completion Evidence (This Cycle)

- Updated preview deploy fallback lane to `xa-b-redeploy.yml` in `apps/xa-drop-worker/wrangler.toml` (removed `xa.yml` fallback).
- Added runtime guard to reject uploader-triggered dispatch targets using `xa.yml` and return `deploy_workflow_not_allowed` in `apps/xa-drop-worker/src/index.ts`.
- Added deploy-trigger fallback: when Pages hook fails, drop-worker now attempts GitHub workflow dispatch instead of hard-failing immediately.
- Updated uploader deploy guidance to explicitly mark deploy as pending verification (`await_xa_b_deploy_and_verify_live`) in `apps/xa-uploader/src/lib/deployHook.ts`.
- Updated operator success copy to avoid implying deploy completion in `apps/xa-uploader/src/lib/uploaderI18n.ts`.
- Added/updated branch tests for:
  - Pages-hook failure fallback to GitHub dispatch.
  - Rejection of disallowed workflow target `xa.yml`.
  - Updated sync display expectation for deploy verification pending.
- Validation passed:
  - `pnpm --filter @apps/xa-drop-worker typecheck`
  - `pnpm --filter @apps/xa-drop-worker lint`
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`

## What would make this >=90%

- Verify current preview/prod secret state for `XA_B_PAGES_DEPLOY_HOOK_URL` and deploy trigger token.
- Complete one successful end-to-end preview trial after TASK-01 and TASK-03.
- Confirm GitHub default-branch workflow API resolution for `xa-b-redeploy.yml`.
