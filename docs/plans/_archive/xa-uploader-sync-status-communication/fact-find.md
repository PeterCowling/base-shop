---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-sync-status-communication
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-critique, lp-do-ideas
Related-Plan: docs/plans/xa-uploader-sync-status-communication/plan.md
---

# XA Uploader Sync Status Communication Fact-Find

## Scope

Align XA uploader status communication with the real publish pipeline:

- local edit and autosave state
- catalog publish state
- site deploy and verification-pending state

This work covers truthful operator messaging, per-product publish blockers, and safe autosync trigger design.

## Evidence

- Autosave is already a queued save loop and sync is blocked while autosave is dirty or saving:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- Per-product UI already renders only coarse states (`Incomplete`, `Draft ready`, `Ready to go live`, `Live`):
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`
- Publish readiness is stricter than "has images"; it also depends on valid draft data, image-role count match, supported roles, and required roles by category:
  - `packages/lib/src/xa/catalogWorkflow.ts`
  - `packages/lib/src/xa/catalogImageRoles.ts`
- `publishState: "live"` is set at catalog publish time before deploy completion is verified:
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Sync responses already carry deploy outcome, pending-deploy metadata, and display guidance, but the UI flattens them into one feedback string:
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
- Triggered deploys are explicitly modeled as verification-pending, not confirmed live:
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`
- Manual save already protects live products from accidental demotion, but autosave cannot confirm and falls back to manual recovery:
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`

## Findings

1. The operator needs a three-layer model, not a two-stage model:
   - local save/autosave
   - catalog published
   - site rebuild pending / failed / awaiting verification
2. Current UI labels over-compress state and make `publishState: "live"` look more authoritative than it is.
3. The data needed for catalog vs deploy separation already exists in the API contract; the main gap is UI consumption and state modeling.
4. Per-product readiness hints need a richer breakdown than `isPublishReady`; today the UI can say "not ready" but cannot explain exact publish blockers.
5. Autosync after image upload is feasible only as a coalesced post-autosave scheduler. Immediate sync on each autosave success will race busy locks and hit deploy cooldown repeatedly.

## Decisions

- Do not surface `Site: Live` until a real verification source exists.
- Treat `publishState: "live"` as "published to catalog records", not "verified live on site".
- Add a persistent catalog/site status strip driven by existing deploy metadata before adding autosync.
- Add per-product publish blocker detail before or alongside autosync so operators understand why auto-publish does or does not fire.
- Gate autosync on autosave-settled state and publish-readiness recomputation.

## Residual Risk

- No source of truth currently proves a Pages rebuild has finished and the site is live.
- Existing `workflowLive` copy will remain misleading until the per-product semantics are tightened.
- Autosync can still feel broken if status messaging ships after the scheduler instead of before it.

## Planning Readiness

- Status: Ready-for-planning
- Recommended execution:
  1. Define truthful status semantics and operator copy.
  2. Surface per-product publish blockers.
  3. Render persistent catalog/site strip from existing sync metadata.
  4. Add coalesced autosync scheduler only after the status model is in place.
