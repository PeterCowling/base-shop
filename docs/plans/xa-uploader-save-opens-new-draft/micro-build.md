---
Type: Micro-Build
Status: Complete
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: xa-uploader-save-opens-new-draft
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313120000-C001
Related-Plan: none
---

# XA Uploader Save Opens New Draft Micro-Build

## Scope
- Change: After a successful manual save in the XA uploader catalog form, keep the existing saved-state delay, then open a blank new draft via the existing `handleNew()` path instead of re-selecting the saved product.
- Non-goals: Changing image autosave behavior, changing publish/sync flow, changing catalog persistence semantics, introducing a next-item queue.

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- Acceptance checks:
  - Manual save success keeps the existing short saved-state transition, then resets the editor to a new blank draft by calling the existing `handleNew()` flow.
  - The saved product is still persisted successfully before the editor resets.
  - If the operator changes selection during the saved-state delay, the delayed reset is cancelled.
  - Image autosave does not trigger the blank-new-draft transition.
- Validation commands:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- Rollback note: Revert the task-scoped commit to restore the current post-save re-selection behavior.

## Outcome Contract
- **Why:** Operators saving one product at a time should land on a fresh draft for the next item instead of being left in the product they just completed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After a successful manual save in XA uploader, the editor shows the saved confirmation state briefly and then opens a fresh draft via `handleNew()`, unless the operator has already changed context.
- **Source:** operator

## Build Evidence
- Implemented the delayed post-save transition by routing `handleSaveAdvanceFeedback` through the existing `handleNew()` flow in `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`.
- Added a saved-state cancellation guard keyed to editor context changes in `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` so changing selection during the 2-second saved window cancels the pending reset.
- Updated operator copy in `apps/xa-uploader/src/lib/uploaderI18n.ts` to reflect the new behavior.
- Added focused test coverage in:
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx`
- Validation:
  - `pnpm --filter @apps/xa-uploader typecheck` -> pass
  - `pnpm --filter @apps/xa-uploader lint` -> pass with 3 pre-existing warnings outside this change set
