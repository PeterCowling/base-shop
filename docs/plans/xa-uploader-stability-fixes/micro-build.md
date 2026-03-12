---
Type: Micro-Build
Status: Complete
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-stability-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C008
Related-Plan: none
---

# XA-Uploader Stability Fixes Micro-Build

## Scope
- Change: Add AbortController cleanup to all fetch calls in useCatalogConsole, add cancellation to usePersistedImageCleanup polling loop, move clearTimeout to finally blocks in deployHook and catalogCloudPublish, add 10s fetch timeouts to CurrencyRatesPanel and useCatalogConsole loading functions
- Non-goals: Component refactoring, error boundary additions, component splitting

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/lib/catalogCloudPublish.ts`
  - `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx`
- Acceptance checks:
  - All fetch calls use AbortController with cleanup on unmount
  - All setTimeout handles cleaned up in finally blocks
  - Fetch operations have timeout (10s default)
  - No React setState-on-unmount warnings in dev console
- Validation commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- Rollback note: Pure additive cleanup — revert commit reverts all changes

## Outcome Contract
- **Why:** Background requests and polling loops run without cleanup, causing memory leaks and frozen UI during normal use
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** All fetch calls use AbortController with cleanup on unmount; all setTimeout handles cleaned up in finally blocks; fetch operations have 10s timeout; no React setState-on-unmount warnings in dev console
- **Source:** operator
