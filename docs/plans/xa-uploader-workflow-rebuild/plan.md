---
Type: Plan
Status: Active
Domain: Products
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-workflow-rebuild
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 87%
Confidence-Method: implementation evidence + targeted validation
---

# XA Uploader Workflow Rebuild Plan

## Summary

Convert the current single-screen product authoring form into a step-based workflow with explicit readiness states:
- classify what is required vs optional,
- auto-generate inferable/system fields (notably `createdAt`),
- permit saving drafts without images,
- require complete data + images before submission packaging.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Step workflow + draft/submission readiness + image/data decoupling | 87% | M | Complete (2026-03-03) | - | - |

## Active tasks

### TASK-01: Step workflow + draft/submission readiness + image/data decoupling

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/catalogDraft.ts`
  - `packages/lib/src/xa/catalogAdminSchema.ts`
  - `packages/lib/src/xa/catalogCsvMapping.ts`
  - `packages/lib/src/xa/catalogWorkflow.ts`
  - `packages/lib/src/xa/index.ts`
- **Acceptance:**
  - Product editing flow is step-based, not a single continuous form surface.
  - `createdAt` is not user-entered and is auto-filled at persistence time.
  - Drafts can be saved without images.
  - Submission selection and submission API enforce image presence.
  - Image step is blocked until core data validates.
  - Existing submission step-state feedback remains functional.

- **Build evidence (2026-03-03):**
  - Targeted validation pass:
    - `pnpm --filter @apps/xa-uploader typecheck`
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @acme/lib lint`
    - `bash scripts/validate-changes.sh` (repo gate passed; unrelated warnings only)
