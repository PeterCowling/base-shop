---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-testing-hardening
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact)
---

# XA Testing Hardening Plan

## Summary
Operator requested solid testing coverage improvements across XA-B, XA-uploader, and XA uploader worker surfaces. Existing coverage was uneven: XA-uploader had broad route/component tests but key backend contract paths were missing; XA-B had minimal behavior coverage for critical state/search logic; worker coverage was broad but missed several edge/error branches. This execution added high-risk missing tests first and validated changed packages with scoped typecheck/lint gates.

## Active tasks
- [x] TASK-01: Add missing XA-uploader API/contract unit tests (download route + contract clients + job store/request parsing helpers).
- [x] TASK-02: Add XA-B behavioral tests (inventory and search service behavior).
- [x] TASK-03: Add XA uploader worker edge/error branch tests.
- [x] TASK-04: Run scoped validation gates for changed apps and update plan evidence.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status |
|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Cover untested uploader backend branches and contract clients | 91% | M | Complete (2026-03-02) |
| TASK-02 | IMPLEMENT | Cover missing XA-B user-critical behavior paths | 86% | M | Complete (2026-03-02) |
| TASK-03 | IMPLEMENT | Cover worker misconfiguration and failure mapping branches | 88% | S | Complete (2026-03-02) |
| TASK-04 | IMPLEMENT | Run scoped typecheck/lint for changed apps | 95% | S | Complete (2026-03-02) |

## Build completion evidence
- XA-uploader new route coverage:
  - `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/submission/status/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts` (async lifecycle success + failure transitions)
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/__tests__/route.test.ts`
- XA-uploader backend contract/helper coverage:
  - `apps/xa-uploader/src/lib/__tests__/catalogContractClient.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/submissionJobStore.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/requestJson.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogStorefront.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogSyncInput.test.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/catalogSubmissionClient.test.ts` (direct poll timeout + API error/fallback behavior)
- XA-B behavior coverage:
  - `apps/xa-b/src/lib/__tests__/inventoryStore.test.ts`
  - `apps/xa-b/src/lib/search/__tests__/xaSearchService.test.ts`
  - `apps/xa-b/src/contexts/__tests__/XaCartContext.test.tsx`
  - `apps/xa-b/src/contexts/__tests__/XaWishlistContext.test.tsx`
  - `apps/xa-b/src/lib/__tests__/xaCart.test.ts`
  - `apps/xa-b/src/lib/__tests__/storage.test.ts`
  - `apps/xa-b/src/lib/__tests__/useXaListingFilters.test.tsx` (query/apply/sort/chip-removal filtering behavior)
  - `apps/xa-b/src/lib/search/__tests__/xaSearchDb.test.ts`
  - `apps/xa-b/src/lib/search/__tests__/xaSearchWorkerClient.test.ts`
  - `apps/xa-b/src/lib/search/__tests__/xaSearchWorker.test.ts` (worker protocol build/load/search + error responses)
- XA uploader worker edge/error branch coverage:
  - `apps/xa-drop-worker/__tests__/xaDropWorker.branches.test.ts` (stream-size overflow handling, malformed catalog/draft payloads, ETag normalization, corrupted draft JSON, unsupported route methods)

## Validation
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-b typecheck` PASS
- `pnpm --filter @apps/xa-drop-worker typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS
- `pnpm --filter @apps/xa-b lint` PASS
- `pnpm --filter @apps/xa-drop-worker lint` PASS

## Acceptance Criteria (overall)
- [x] New tests added for identified missing high-risk paths in all three target apps.
- [x] No regressions introduced in affected packages via scoped typecheck/lint.
- [x] Plan captures concrete evidence of implemented files and validation commands.
