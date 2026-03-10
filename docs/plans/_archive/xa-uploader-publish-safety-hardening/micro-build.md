---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: xa-uploader-publish-safety-hardening
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309104500-9304
Related-Plan: none
---

# XA Uploader Publish Safety Hardening Micro-Build

## Scope
- Change: Hard-stop publish when the draft is not durably saved, switch the publish API to operate on the saved product id plus revision rather than raw browser draft payload, mint fresh draft revisions when publish or sync changes publish state, and surface partial-success warnings to the operator.
- Non-goals: No new infrastructure. No broader XA uploader redesign. No local Jest execution.

## Execution Contract
- Affects:
  - apps/xa-uploader/src/app/api/catalog/publish/route.ts
  - apps/xa-uploader/src/app/api/catalog/sync/route.ts
  - apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts
  - apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts
  - apps/xa-uploader/src/lib/catalogPublishState.ts
  - apps/xa-uploader/src/lib/uploaderI18n.ts
  - apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts
  - apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx
- Acceptance checks:
  - Publish is blocked in the client while autosave is dirty or no saved revision exists.
  - Publish route no longer trusts raw draft JSON from the browser; it publishes the saved hosted draft by id and revision.
  - Publish/sync draft writeback mints fresh revisions when publish state changes.
  - Partial-success publish warnings are visible in operator feedback.
- Validation commands:
  - pnpm --filter @apps/xa-uploader typecheck
  - pnpm --filter @apps/xa-uploader lint
- Rollback note: Revert the files above; no data migration required.

## Outcome Contract
- **Why:** Hosted-only XA still had a publish side door that bypassed save/conflict safety and hid partial snapshot-write failures.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA publish now requires a saved hosted revision, publishes from the canonical snapshot rather than browser draft JSON, and reports partial-success warnings instead of silent success.
- **Source:** operator
