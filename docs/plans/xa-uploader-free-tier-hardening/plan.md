---
Type: Plan
Status: Complete
Domain: Products
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-free-tier-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 88%
Confidence-Method: implementation evidence + Cloudflare runtime constraint audit
Auto-Build-Intent: plan+auto
---

# XA Uploader Free-Tier Hardening Plan

## Summary

Take forward the XA uploader review findings without breaching Cloudflare free-tier constraints.
The chosen approach keeps all hardening inside the current architecture:

1. Security and response-validation fixes stay inside the existing Next/Workers request path.
2. Currency-rates hardening either hides local-only controls in cloud mode or makes their failure modes explicit.
3. Sync serialization is upgraded from best-effort KV locking to R2-backed conditional writes through the existing `xa-drop-worker` service binding, avoiding Durable Objects, Queues, cron, or paid products.

## Free-Tier Decision

Yes: all reviewed issues can be taken forward on Cloudflare free tier.

### Why this stays within free tier

- No new Cloudflare product is introduced.
- No Durable Objects, Queues, cron, or paid Workers features are required.
- The cloud sync lock can use the already-bound `CATALOG_BUCKET` R2 bucket in `apps/xa-drop-worker`.
- The uploader already has the `XA_CATALOG_CONTRACT_SERVICE` binding, so no new network topology is needed.
- Currency-rate hardening reduces misleading cloud behavior rather than adding new cloud persistence.

## Evidence

- Uploader cloud mode already runs through the contract worker and R2-backed draft/catalog paths:
  - `apps/xa-uploader/wrangler.toml`
  - `apps/xa-drop-worker/wrangler.toml`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - `apps/xa-drop-worker/src/index.ts`
- Current sync mutex is KV get-then-put and explicitly documented as fail-open / non-atomic:
  - `apps/xa-uploader/src/lib/syncMutex.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Currency-rates API is repo-local FS only while sync readiness already distinguishes cloud mode:
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Autosave conflict handling currently merges image tuples but replays full local draft state:
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- IP extraction is inconsistent between access control and rate limiting:
  - `apps/xa-uploader/src/lib/accessControl.ts`
  - `apps/xa-uploader/src/lib/rateLimit.ts`

## Hard Constraints

- Must remain compatible with Cloudflare free tier.
- Must not introduce paid-only Cloudflare dependencies.
- Must not run Jest or e2e locally; validation remains targeted typecheck/lint only.
- Must preserve existing uploader cloud architecture and contract worker boundary.

## Scope

### In scope

- Trust-gated IP allowlist extraction.
- Draft contract response schema validation.
- Autosave conflict retry rebasing only image fields onto fresh server state.
- Currency-rates UI/API hardening so cloud mode is not misleading.
- Truthful currency save-and-sync feedback.
- Atomic cloud sync locking through the existing contract worker + R2.

### Out of scope

- New cloud persistence for currency rates in cloud mode.
- Replacing the draft/catalog contract architecture.
- Introducing background jobs, paid queues, or Durable Objects.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Harden trusted IP extraction and validate contract snapshot payloads | 91% | S | Complete (2026-03-05) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Fix autosave conflict retry so only image fields rebase onto fresh server draft | 87% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Align currency-rates UX/API with runtime mode and truthful sync feedback | 86% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-04 | IMPLEMENT | Replace cloud sync KV mutex with R2-backed atomic contract lock | 82% | M | Complete (2026-03-05) | - | TASK-05 |
| TASK-05 | CHECKPOINT | Run targeted validation and record free-tier-safe completion evidence | 94% | S | Complete (2026-03-05) | TASK-01,TASK-02,TASK-03,TASK-04 | - |

## Completed tasks

- [x] TASK-01: Trusted IP extraction + contract validation
- [x] TASK-02: Autosave conflict retry rebase
- [x] TASK-03: Currency-rates runtime alignment
- [x] TASK-04: Atomic cloud sync lock
- [x] TASK-05: Validation checkpoint

## Tasks

### TASK-01: Trusted IP extraction + contract validation

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-uploader/src/lib/accessControl.ts`
  - `apps/xa-uploader/src/lib/rateLimit.ts`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 91%
  - Implementation: 92% - the validated/trust-gated IP extractor already exists in `rateLimit.ts`.
  - Approach: 92% - sharing one extractor removes a concrete bypass seam.
  - Impact: 89% - prevents allowlist drift and rejects malformed contract payloads earlier.
- **Acceptance:**
  - Access control only trusts forwarded IP headers when proxy trust is enabled and the IP parses cleanly.
  - Contract snapshot reads reject malformed `products` and malformed `revisionsById` values.
  - Targeted tests cover both behaviors.
- **Validation contract (TC-01):**
  - Access-control tests cover trust-disabled and invalid-header cases.
  - Contract-client tests cover invalid product payload and invalid revision map payload.
- **Build evidence (2026-03-05):**
  - Added shared trusted-header parser in `apps/xa-uploader/src/lib/requestIp.ts` and routed both rate limiting and access control through it.
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` now schema-validates snapshot `products` and `revisionsById` instead of casting them through.
  - Added regression coverage in `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts` and `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`.

### TASK-02: Autosave conflict retry rebase

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 87%
  - Implementation: 86% - tuple merge is already centralized and only needs rebase semantics tightened.
  - Approach: 90% - image-only merge is the correct boundary for an image-triggered autosave retry.
  - Impact: 85% - prevents replaying stale non-image fields on 409 conflicts.
- **Acceptance:**
  - A 409 autosave retry rebases only `imageFiles`, `imageRoles`, and `imageAltTexts` onto the fresh server draft.
  - Concurrent remote edits to non-image fields survive the retry.
  - Existing image-delete preservation behavior still holds.
- **Validation contract (TC-02):**
  - Add regression coverage for concurrent non-image edits surviving autosave conflict retry.
- **Build evidence (2026-03-05):**
  - `mergeAutosaveImageTuples()` now rebases image tuple fields onto the fresh server draft instead of replaying stale local non-image fields.
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` now asserts remote title/price edits survive a 409 autosave retry while the new image still persists.

### TASK-03: Currency-rates runtime alignment

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/CurrencyRatesPanel.test.tsx`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 86%
  - Implementation: 84% - some UI contract threading is required across readiness + panel props.
  - Approach: 89% - local-only capability should be explicit instead of pretending to work in cloud mode.
  - Impact: 85% - removes misleading operator affordances and success states.
- **Acceptance:**
  - Cloud mode exposes sync controls without exposing the local-only currency-rates editor.
  - Currency-rate panel starts empty/locked until load succeeds.
  - Successful save only reports sync-applied feedback after the sync promise resolves successfully.
  - Cloud-mode currency-rates API returns an explicit unavailable response instead of reading/writing repo-local files.
- **Validation contract (TC-03):**
  - Panel tests cover empty-on-load, load-failure state, save failure, and awaited sync success/failure.
  - Route tests cover cloud-mode service-unavailable response.
- **Build evidence (2026-03-05):**
  - `SyncReadinessResponse` now carries `mode`, local readiness returns `mode: "local"`, and cloud readiness returns `mode: "cloud"`.
  - `CatalogConsole.client.tsx` now keeps sync accessible in cloud mode while hiding the local-only currency editor and relabeling the header action to `Sync`.
  - `CurrencyRatesPanel.client.tsx` now loads into an empty/disabled state until GET succeeds and only shows synced success after `handleSync()` returns `{ ok: true }`.
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` now returns `503 service_unavailable` when local FS runtime is disabled.

### TASK-04: Atomic cloud sync lock

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-drop-worker/src/index.ts`
  - `apps/xa-drop-worker/src/draftSyncLock.ts`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.branches.test.ts`
  - `apps/xa-drop-worker/__tests__/xaDropWorker.sync-lock.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 80% - requires careful conditional-write semantics and expiry handling.
  - Approach: 86% - R2 conditional writes via the existing contract worker are the strongest free-tier-safe lock primitive already available in this architecture.
  - Impact: 81% - closes the known double-sync race in cloud mode without adding paid infra.
- **Acceptance:**
  - Cloud sync lock acquisition is atomic against parallel writers.
  - A held lock returns `409 sync_already_running`.
  - Lock release cannot tombstone another owner’s newer lease.
  - Local FS sync path remains unaffected.
- **Validation contract (TC-04):**
  - Worker tests cover create, expired-lock takeover, stale-etag rejection, and release semantics.
  - Uploader sync route tests cover contract-lock conflict and release paths.
- **Build evidence (2026-03-05):**
  - Added worker-side R2 conditional-write lease helper in `apps/xa-drop-worker/src/draftSyncLock.ts`.
  - Added `/drafts/:storefront/sync-lock` POST/DELETE handling in `apps/xa-drop-worker/src/index.ts`.
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` now acquires/releases sync locks through the existing contract service binding.
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts` now uses contract-backed locking in cloud mode and maps lock-service failures to existing contract recovery messages instead of failing open.

### TASK-05: Validation checkpoint

- **Type:** CHECKPOINT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `docs/plans/xa-uploader-free-tier-hardening/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 94%
  - Implementation: 95% - affected-package validation commands are deterministic.
  - Approach: 94% - scoped validation is repo policy for changed packages.
  - Impact: 93% - provides the build gate required before handoff/CI.
- **Acceptance:**
  - `@apps/xa-uploader` typecheck and lint pass.
  - `@apps/xa-drop-worker` typecheck and lint pass.
  - Plan evidence records that the implementation remained within Cloudflare free-tier-safe architecture.
- **Build evidence (2026-03-05):**
  - Targeted validation passed:
    - `pnpm --filter @apps/xa-uploader typecheck`
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @apps/xa-drop-worker typecheck`
    - `pnpm --filter @apps/xa-drop-worker lint`
  - Local Jest/e2e were not run because repo policy reserves tests for CI.
  - The completed implementation stayed inside existing Workers + R2 + service-binding boundaries; no paid Cloudflare product was introduced.
