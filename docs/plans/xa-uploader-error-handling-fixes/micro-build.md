---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-error-handling-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C009
Related-Plan: none
---

# XA-Uploader Error Handling Fixes Micro-Build

## Scope
- Change: Fix auth error masking in deploy-drain route (`.catch(() => false)` now logs error), fix generic error catch in bulk route to only treat `CatalogDraftContractError` as 400, add error logging to bulk and deploy-drain routes, remove dead `statePaths` variable in deploy-drain, fix misleading error message in catalogDraftContractClient
- Non-goals: Full error response shape standardization across all routes, auth ordering refactor, currency rate sanity checks

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- Acceptance checks:
  - Auth errors in deploy-drain logged before returning false
  - Bulk route only catches CatalogDraftContractError as 400; other errors propagate as 500
  - Dead `statePaths` variable removed from deploy-drain
  - Error message for empty slug is descriptive not misleading
- Validation commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- Rollback note: Pure additive error handling — revert commit reverts all changes

## Outcome Contract
- **Why:** When something goes wrong in the admin tool, error messages are misleading or missing — a server glitch looks like a login failure, and some errors are silently swallowed with no log
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Auth errors logged before response in deploy-drain; bulk route distinguishes validation errors from unexpected failures; dead code removed; error message for empty slug describes actual problem
- **Source:** operator
