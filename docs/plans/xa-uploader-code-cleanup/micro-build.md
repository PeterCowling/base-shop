---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-code-cleanup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C011
Related-Plan: none
---

# XA-Uploader Code Cleanup Micro-Build

## Scope
- Change: Extract shared `buildCatalogContractUrl()` to new `catalogContractUtils.ts`, update both `catalogDraftContractClient.ts` and `catalogContractClient.ts` to use it, rename confusing `access` import to `fs` in `catalogSyncInput.ts`, replace unsafe `as Extract<...>` type assertions with discriminant checks in `deployHook.ts`, replace unsafe type assertion with `isRecord()` guard in `catalogDraftContractClient.ts`
- Non-goals: Implementing skipped tests, full refactor of contract client architecture

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/lib/catalogContractUtils.ts` (new)
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - `apps/xa-uploader/src/lib/catalogContractClient.ts`
  - `apps/xa-uploader/src/lib/catalogSyncInput.ts`
  - `apps/xa-uploader/src/lib/deployHook.ts`
- Acceptance checks:
  - `buildCatalogContractUrl` exists once in catalogContractUtils.ts and is imported by both clients
  - catalogSyncInput.ts uses `fs` not `access` for the node:fs/promises import
  - deployHook.ts uses discriminant property checks instead of type assertions
  - catalogDraftContractClient.ts uses isRecord() guard instead of `as` assertion
- Validation commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- Rollback note: Pure refactoring — revert commit reverts all changes

## Outcome Contract
- **Why:** Duplicated URL builder logic means any change to the catalog API URL pattern requires updating two files — risk of divergence; confusing import alias and unsafe type assertions make the code harder to maintain safely
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** buildCatalogContractUrl deduplicated to single source; import alias corrected; unsafe type assertions replaced with runtime checks
- **Source:** operator
