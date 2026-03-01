---
Type: Plan
Status: Complete
Domain: Engineering
Workstream: Platform
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-free-tier-anti-copy-hardening
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact)
artifact: plan
---

# XA Free-Tier Anti-Copy Hardening Plan

## Summary
Apply low-cost anti-copy hardening that does not require paid Cloudflare features and does not increase infrastructure leakage in end-user/operator-visible surfaces.

## Tasks
- [x] TASK-01: Add uploader ingress IP allowlist controls with default-open behavior.
- [x] TASK-02: Add drop-worker ingress IP allowlist controls with default-open behavior.
- [x] TASK-03: Remove provider/storage-key leakage from uploader submission UI/status messages.
- [x] TASK-04: Add/extend tests for new allowlist behavior.

## Build Evidence
- Added `xa-uploader` request access utility + middleware + API fallback checks:
  - `apps/xa-uploader/src/lib/accessControl.ts`
  - `apps/xa-uploader/src/middleware.ts`
  - `apps/xa-uploader/src/app/api/uploader/{login,session,logout}/route.ts`
- Added worker allowlist gate:
  - `apps/xa-drop-worker/src/index.ts`
  - `apps/xa-drop-worker/wrangler.toml`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`
- Reduced operator-facing leakage:
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
- Added uploader access control tests:
  - `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts`

## Validation
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (existing warnings only in untouched currency route)
- `pnpm --filter @apps/xa-drop-worker typecheck` PASS
- `pnpm --filter @apps/xa-drop-worker lint` PASS
