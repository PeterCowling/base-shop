---
Type: Build-Record
Status: Complete
Feature-Slug: xa-uploader-deploy-state-hardening
Completed-date: 2026-03-07
artifact: build-record
---

# Build Record: XA Uploader Deploy State Hardening

## Outcome Contract
- **Why:** Fix the xa-uploader Make Live deploy path so deploy cooldown/pending state is enforced and operator feedback reflects real deploy outcomes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Make Live persists deploy cooldown state correctly, avoids repeated trigger spam during cooldown, and reports deploy-trigger failures truthfully to the operator.
- **Source:** operator

## What Was Built
`apps/xa-uploader/src/app/api/catalog/publish/route.ts` now resolves deploy-state context before invoking `maybeTriggerXaBDeploy()` and `reconcileDeployPendingState()`, instead of hardcoding `kv: null`. The route also returns `deployReason` and `deployNextEligibleAt` so the client can distinguish successful publish with failed deploy trigger from cooldown and unconfigured-hook branches.

`apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` and `apps/xa-uploader/src/lib/uploaderI18n.ts` now surface a dedicated Make Live success message for `deployStatus: "failed"`. Route and client tests were updated in `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` and `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` to cover deploy-state propagation and truthful feedback.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/xa-uploader typecheck` | Pass | Ran in read-only guard mode. |
| `pnpm --filter @apps/xa-uploader lint` | Pass | One existing unrelated warning remained in `EditProductFilterSelector.client.tsx` (`ds/min-tap-size`). |

## Validation Evidence

### TASK-01
- TC-01: Route test now asserts resolved KV/state paths are passed into deploy helpers.
- TC-02: Action-feedback test now covers successful publish with `deployStatus: "failed"` and verifies dedicated copy.
- TC-03: `pnpm --filter @apps/xa-uploader typecheck` passed.
- TC-04: `pnpm --filter @apps/xa-uploader lint` passed (warning-only unrelated issue outside task scope).

## Scope Deviations
None.

## Follow-On Ideas
- Remove `xa-uploader` local-fs runtime support in a dedicated cleanup pass if Cloudflare-only runtime is now the permanent product decision. Rationale: deployed preview/prod already set `XA_UPLOADER_LOCAL_FS_DISABLED = "1"`, but local-fs branching still exists across sync/products/currency/image routes and should be removed only as a deliberate cross-cutting simplification task.
