---
Type: Plan
Status: Complete
Domain: Products
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-deploy-state-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Deploy State Hardening Plan

## Summary
Harden the xa-uploader Make Live deploy path so deploy cooldown and pending-state persistence actually work in the publish route and the operator sees truthful feedback for deploy-trigger failures. The route already performs the correct catalog publish pipeline; the defect is in how it invokes the deploy-state helper and how the client compresses deploy outcomes into success copy. The build stays bounded to the Make Live path and its tests, with no worker-side infra changes. CI remains the authority for updated Jest coverage because local Jest execution is repo-policy blocked.

## Active tasks
- [x] TASK-01: Harden Make Live deploy-state propagation and truthful feedback

## Goals
- Restore cooldown/pending-state persistence on `POST /api/catalog/publish`.
- Distinguish Make Live deploy-trigger failure from cooldown and unconfigured branches in operator feedback.
- Keep catalog publish semantics and auth/lock behavior unchanged.

## Non-goals
- Change xa-drop-worker provider selection or runtime secrets.
- Change sync-route behavior outside the Make Live path in this task.
- Add new deploy infrastructure.

## Constraints & Assumptions
- Constraints:
  - Existing unrelated worktree changes must remain untouched.
  - Local validation is limited to scoped typecheck/lint; Jest runs in CI only.
- Assumptions:
  - Returning deploy failure reason from the route is acceptable contract expansion for the Make Live client.

## Inherited Outcome Contract
- **Why:** Fix the xa-uploader Make Live deploy path so deploy cooldown/pending state is enforced and operator feedback reflects real deploy outcomes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Make Live persists deploy cooldown state correctly, avoids repeated trigger spam during cooldown, and reports deploy-trigger failures truthfully to the operator.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-deploy-state-hardening/fact-find.md`
- Key findings used:
  - `publish/route.ts` passes `kv: null` and no `statePaths` into deploy-state helpers.
  - `deploy-drain/route.ts` already demonstrates the correct deploy-state-context resolution pattern.
  - Make Live UI currently maps deploy failure into the same message as an unconfigured hook.

## Proposed Approach
- Option A:
  - Patch `publish/route.ts` only and keep current Make Live UI copy branching.
  - Pros: smallest code delta.
  - Cons: operator feedback stays misleading on successful publish + failed deploy.
- Option B:
  - Patch `publish/route.ts` to resolve deploy-state context and expand response fields for failed deploy outcomes; update Make Live client/test coverage accordingly.
  - Pros: fixes both the actual cooldown bug and the misleading operator feedback in one bounded task.
  - Cons: slightly broader response-contract change.
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Harden Make Live deploy-state propagation and truthful feedback | 90% | S | Complete (2026-03-07) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded implementation slice |

## Tasks

### TASK-01: Harden Make Live deploy-state propagation and truthful feedback
- **Type:** IMPLEMENT
- **Deliverable:** code-change in Make Live route/client/tests under `apps/xa-uploader`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`, `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`, `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`, `[readonly] apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`, `[readonly] apps/xa-uploader/src/lib/deployHook.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 92% - exact failing call site and adjacent correct pattern are confirmed.
  - Approach: 90% - bounded route/client contract hardening with no schema or infra migration.
  - Impact: 88% - directly fixes repeated deploy-trigger spam and misleading operator feedback.
- **Acceptance:**
  - Make Live route resolves deploy-state context before calling deploy helpers.
  - Make Live route returns deploy failure detail needed for truthful client feedback.
  - Make Live client shows distinct copy for `triggered`, `skipped_cooldown`, `skipped_unconfigured`, and `failed`.
  - Route/UI tests cover the new behavior.
- **Validation contract (TC-01):**
  - TC-01: publish route passes deploy-state context into `maybeTriggerXaBDeploy()` and `reconcileDeployPendingState()`.
  - TC-02: successful publish with `deployStatus: "failed"` shows distinct failure-success message instead of “No deploy hook configured.”
  - TC-03: `pnpm --filter @apps/xa-uploader typecheck`
  - TC-04: `pnpm --filter @apps/xa-uploader lint`
- **Execution plan:** Red -> Green -> Refactor
- **Build completion evidence:**
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts` now resolves KV/filesystem deploy-state context before calling `maybeTriggerXaBDeploy()` and `reconcileDeployPendingState()`, and returns `deployReason` / `deployNextEligibleAt` in the success payload.
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` now maps `deployStatus: "failed"` to dedicated Make Live feedback instead of reusing the unconfigured-hook branch.
  - `apps/xa-uploader/src/lib/uploaderI18n.ts` adds EN/ZH copy for successful publish with failed deploy trigger.
  - `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` now asserts deploy-state context propagation and `deployReason` passthrough.
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` now covers the successful-publish + failed-deploy-feedback branch.
  - Validation results:
    - `pnpm --filter @apps/xa-uploader typecheck` passed.
    - `pnpm --filter @apps/xa-uploader lint` passed with one existing unrelated warning in `apps/xa-uploader/src/components/catalog/EditProductFilterSelector.client.tsx` (`ds/min-tap-size`).
- **Scouts:** None: route and feedback patterns are already identified.
- **Edge Cases & Hardening:**
  - Keep lock/auth/publish failure handling unchanged.
  - Preserve cooldown and unconfigured copy paths.
- **What would make this >=90%:**
  - CI pass on updated publish route and action-feedback tests.
- **Rollout / rollback:**
  - Rollout: ship bounded xa-uploader route/client change.
  - Rollback: revert the task-scoped commit if feedback contract regresses.
- **Documentation impact:**
  - Update plan task evidence after build.
- **Notes / references:**
  - `docs/plans/xa-uploader-deploy-state-hardening/fact-find.md`

## Risks & Mitigations
- Risk: response-shape expansion could miss a client branch.
- Mitigation: update route and client tests together.
- Risk: local runtime still lacks a backing state store in environments without KV/filesystem access.
- Mitigation: preserve current best-effort behavior; this task only restores the existing intended backends.

## Observability
- Logging: preserve existing route error mapping.
- Metrics: none new in this task.
- Alerts/Dashboards: none.

## Acceptance Criteria (overall)
- [x] Make Live deploy cooldown/pending state is no longer bypassed by the publish route.
- [x] Make Live feedback distinguishes deploy-trigger failure from unconfigured deploy hook.
- [x] Scoped xa-uploader typecheck and lint pass.

## Decision Log
- 2026-03-07: Chose bounded Make Live route/client hardening instead of worker-side infra changes because the confirmed repo defects are local to xa-uploader.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
