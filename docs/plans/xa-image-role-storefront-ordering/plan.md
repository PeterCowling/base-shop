---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-image-role-storefront-ordering
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact)
---

# XA Image Role Storefront Ordering Plan

## Summary
Propagate image perspective roles from uploader draft data through both sync pipelines, then enforce storefront ordering so `front`, `back`, and `top` render first instead of raw upload order.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status |
|---|---|---|---:|---:|---|
| TASK-01 | IMPLEMENT | Thread role metadata through pipeline + storefront and enforce deterministic role ordering | 90% | M | Complete (2026-03-04) |

## Tasks
### TASK-01: Propagate roles and enforce storefront ordering
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Affects:**
  - `packages/lib/src/xa/catalogImageRoles.ts`
  - `packages/lib/src/xa/catalogAdminSchema.ts`
  - `packages/lib/src/xa/index.ts`
  - `scripts/src/xa/run-xa-pipeline.ts`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
  - `apps/xa-b/src/lib/demoData.ts`
  - `apps/xa-b/src/components/XaImageGallery.client.tsx`
  - `packages/lib/src/xa/__tests__/catalogImageRoles.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`
- **Acceptance:**
  - `imageRoles` are preserved in catalog `media` entries for both local and cloud sync paths.
  - Storefront media ordering is deterministic: `front`, `back`, `top` first; unknown roles retain stable fallback order.
  - No Cloudflare tier changes required.
- **Validation contract:**
  - `pnpm --filter @acme/lib typecheck`
  - `pnpm --filter @acme/lib lint`
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
  - `pnpm --filter @apps/xa-b typecheck`
  - `pnpm --filter @apps/xa-b lint`
  - `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit`

## Build completion evidence
- Shared role utility + schema alignment:
  - `packages/lib/src/xa/catalogImageRoles.ts`
  - `packages/lib/src/xa/catalogAdminSchema.ts`
  - `packages/lib/src/xa/index.ts`
- Local sync role propagation + ordering:
  - `scripts/src/xa/run-xa-pipeline.ts`
- Cloud sync role propagation + ordering:
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
- Storefront role-aware media mapping + gallery order:
  - `apps/xa-b/src/lib/demoData.ts`
  - `apps/xa-b/src/components/XaImageGallery.client.tsx`
- Added regression tests:
  - `packages/lib/src/xa/__tests__/catalogImageRoles.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogDraftToContract.test.ts`

## Validation run
- `pnpm --filter @acme/lib build` PASS
- `pnpm --filter @acme/lib exec tsc -p tsconfig.json --noEmit` PASS
- `pnpm --filter @acme/lib lint` PASS
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (warnings only, pre-existing)
- `pnpm --filter @apps/xa-b typecheck` PASS
- `pnpm --filter @apps/xa-b lint` PASS (warnings only, pre-existing)
- `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` PASS
