---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-free-tier-hard-constraint-followup
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact)
---

# XA Free Tier Hard Constraint Follow-up Plan

## Summary
Applied hard free-tier ceilings and operator-facing guidance so deployments cannot silently drift into non-free-tier behavior.

## Active tasks
- [x] TASK-01: Clamp uploader submission max bytes to free-tier ceiling.
- [x] TASK-02: Clamp drop-worker upload/catalog byte limits and upload-token TTL to free-tier-safe ceilings.
- [x] TASK-03: Add explicit display-sync guidance to sync success payloads.
- [x] TASK-04: Add bounded row diagnostics for bulk data validation failures.
- [x] TASK-05: Add/extend tests for clamps + diagnostics + sync guidance.
- [x] TASK-06: Run scoped typecheck/lint validation.

## Build completion evidence
- Free-tier clamps:
  - `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - `apps/xa-drop-worker/src/index.ts`
- Sync display guidance:
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Bulk diagnostics:
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
- Tests:
  - `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.branches.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/__tests__/route.test.ts`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`

## Validation
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (existing warnings only in untouched currency-rates route)
- `pnpm --filter @apps/xa-drop-worker typecheck` PASS
- `pnpm --filter @apps/xa-drop-worker lint` PASS
