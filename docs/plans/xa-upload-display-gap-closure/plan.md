---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-upload-display-gap-closure
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact)
---

# XA Upload-to-Display Gap Closure Plan

## Summary
Implemented a focused gap-closure tranche to make the cloud uploader path operationally viable for day-one use without local script execution, while preserving current local flows.

## Active tasks
- [x] TASK-01: Add cloud sync publish path in uploader sync route.
- [x] TASK-02: Add cloud-safe submission export fallback.
- [x] TASK-03: Add bulk products API for lane-1 ingestion.
- [x] TASK-04: Harden draft read auth/token semantics on drop-worker.
- [x] TASK-05: Add/adjust tests for new cloud branches and token behavior.
- [x] TASK-06: Run scoped typecheck/lint validation.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status |
|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | Cloud-mode sync branch builds contract payload from draft snapshot and publishes without local script spawn | 82% | M | Complete (2026-03-01) |
| TASK-02 | IMPLEMENT | Cloud-mode submission endpoint emits export package from draft products instead of 503 | 80% | M | Complete (2026-03-01) |
| TASK-03 | IMPLEMENT | Add `/api/catalog/products/bulk` endpoint for batch upsert | 84% | M | Complete (2026-03-01) |
| TASK-04 | IMPLEMENT | Enforce draft GET read-token (when configured) and validate draft payloads server-side | 86% | S | Complete (2026-03-01) |
| TASK-05 | IMPLEMENT | Extend route/worker tests for new cloud + auth behaviors | 82% | M | Complete (2026-03-01) |
| TASK-06 | IMPLEMENT | Scoped lint + typecheck gates for changed packages | 95% | S | Complete (2026-03-01) |

## Build completion evidence
- Cloud sync path:
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts`
  - `apps/xa-uploader/src/lib/catalogContractClient.ts`
- Cloud submission fallback:
  - `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - `apps/xa-uploader/src/lib/submissionZip.ts`
- Bulk API:
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
- Draft auth + validation hardening:
  - `apps/xa-drop-worker/src/index.ts`
- Tests:
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/__tests__/route.test.ts`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`

## Validation
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (existing warnings only in untouched currency-rates route)
- `pnpm --filter @apps/xa-drop-worker typecheck` PASS
- `pnpm --filter @apps/xa-drop-worker lint` PASS

## Pending Audit Work
- `xa-b` still consumes build-time `catalog.runtime*.json`; no runtime contract fetch path yet.
- Live storefront freshness is still bounded by deploy cadence; publish does not immediately rehydrate production pages.
