---
Type: Micro-Build
Status: Active
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-memory-leak-fixes
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260312150000-C008
Related-Plan: none
---

# XA Admin Tool Memory/Freeze Fixes Micro-Build

## Scope
- Change: Fix memory leaks and potential freezes in the XA admin tool by adding AbortController cancellation to fetch calls and polling loops, moving clearTimeout to finally blocks, and adding 10s fetch timeouts
- Non-goals: Component refactoring, error boundaries, splitting large components, reducing prop drilling

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` -- add 10s fetch timeout to loadSession and loadCatalog
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx` -- add AbortController cancellation to usePersistedImageCleanup polling loop
  - `apps/xa-uploader/src/lib/deployHook.ts` -- move clearTimeout to finally block in triggerDeployHookOnce
  - `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx` -- add 10s fetch timeout to loadRates
- Acceptance checks:
  - All setTimeout handles cleaned up in finally blocks (deployHook.ts)
  - Polling loop in usePersistedImageCleanup cancellable via AbortController
  - Fetch operations in loadSession, loadCatalog, and CurrencyRatesPanel have 10s timeout
  - typecheck passes: `pnpm --filter xa-uploader exec tsc --noEmit`
  - lint passes: `pnpm --filter xa-uploader lint`
- Validation commands:
  - `pnpm --filter xa-uploader exec tsc --noEmit`
  - `pnpm --filter xa-uploader lint`
- Rollback note: Pure additive cleanup -- revert commit reverts all changes

## Outcome Contract
- **Why:** Background requests and polling loops run without cleanup, causing memory leaks and potential frozen UI during normal use
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** All fetch calls use AbortController with cleanup on unmount; all setTimeout handles cleaned up in finally blocks; fetch operations have 10s timeout
- **Source:** operator
