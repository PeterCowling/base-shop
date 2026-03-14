---
Type: Micro-Build
Status: Active
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-branch-coverage
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260311153000-0003
Related-Plan: none
---

# XA Uploader Branch Coverage Micro-Build

## Scope
- Change: Add branch-coverage tests for 5 untested paths in xa-uploader
- Non-goals: No production source file changes; no new features

## Execution Contract
- Affects:
  - `apps/xa-uploader/src/lib/__tests__/rateLimit.test.ts` — C1 rate limit header assertions
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts` — C2 media validation strict-mode limit-exceeded
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts` — C3 empty catalog sync confirmation
  - `apps/xa-uploader/src/__tests__/middleware.test.ts` — C4 middleware malformed-cookie path
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts` — C5 image reorder/promote operations
- Acceptance checks:
  - All 5 coverage gaps have deterministic test cases with C1-C5 labels
  - TypeScript compiles without errors
  - ESLint passes
- Validation commands:
  - `pnpm --filter xa-uploader exec tsc --noEmit`
  - `pnpm --filter xa-uploader lint`
- Rollback note: Test-only changes; can be reverted without any production impact

## Outcome Contract
- **Why:** When unusual things happen during an upload — a bad file, a dropped connection, a missing product — the code has paths to handle them, but none of those paths have been tested.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader edge-case and error paths in rate limiting, media validation, sync confirmation, middleware auth, and image ordering are covered by deterministic tests.
- **Source:** auto
