---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-reviewed: 2026-03-01
Last-updated: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-cloud-free-tier-replatform
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 82%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Cloud Free-Tier Replatform Plan

## Summary
Replatform xa-uploader away from local filesystem dependencies so hosted Cloudflare deployment can be used directly by non-technical end users. First execution tranche focuses on cloud-backed product draft CRUD (lane 1 foundation) because current APIs return `service_unavailable` in cloud runtime. We will extend drop-worker with draft endpoints and switch uploader products APIs to cloud fallback mode when local FS is unavailable.

## Active tasks
- [x] TASK-01: Add R2-backed draft contract endpoints to `xa-drop-worker`.
- [x] TASK-02: Add uploader draft contract client and route fallback for products CRUD.
- [x] TASK-03: Add cloud-runtime error mapping in uploader action feedback.
- [x] TASK-04: Add/extend route+contract tests for cloud draft path.
- [x] TASK-05: Run scoped validation and update plan evidence.

## Inherited Outcome Contract
- **Why:** End users cannot run local dev/ops commands; xa-uploader must be usable as a hosted product on Cloudflare free tier.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Ship xa-uploader cloud-native two-lane flows without local filesystem/server-script dependency.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-cloud-free-tier-replatform/fact-find.md`
- Key findings used:
  - Products APIs currently hard-fail in cloud via local-fs guard.
  - Existing drop-worker contract already serves as secure R2-backed integration point.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `/drafts/:storefront` contract on drop-worker | 85% | M | Complete (2026-03-01) | - | TASK-02,TASK-04 |
| TASK-02 | IMPLEMENT | Cloud fallback in uploader products routes via draft contract client | 82% | M | Complete (2026-03-01) | TASK-01 | TASK-03,TASK-04 |
| TASK-03 | IMPLEMENT | Error mapping for cloud mode responses in uploader UI actions | 92% | S | Complete (2026-03-01) | TASK-02 | TASK-05 |
| TASK-04 | IMPLEMENT | Tests for new draft contract and uploader cloud fallback behavior | 80% | M | Complete (2026-03-01) | TASK-01,TASK-02 | TASK-05 |
| TASK-05 | IMPLEMENT | Scoped lint/typecheck and plan evidence update | 95% | S | Complete (2026-03-01) | TASK-03,TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Introduces cloud draft contract |
| 2 | TASK-02 | TASK-01 | Rewire uploader products routes |
| 3 | TASK-03, TASK-04 | TASK-02 | UI error mapping + test updates can run together |
| 4 | TASK-05 | TASK-03,TASK-04 | Validate and capture evidence |

## Tasks

### TASK-01: Add R2-backed draft contract endpoints to xa-drop-worker
- **Type:** IMPLEMENT
- **Deliverable:** New draft CRUD HTTP contract in `apps/xa-drop-worker/src/index.ts` with tests in `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/xa-drop-worker/src/index.ts`, `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 85%
  - Implementation: 85% - existing route/auth patterns are reusable.
  - Approach: 88% - R2 JSON object model fits current worker.
  - Impact: 84% - enables hosted draft persistence.
- **Acceptance:**
  - `GET /drafts/:storefront` returns empty/default payload when no object exists.
  - `PUT /drafts/:storefront` with write token persists products/revisions/doc revision.
  - `DELETE /drafts/:storefront` with write token clears draft object.
  - Auth and invalid payload responses are deterministic.
- **Validation contract (TC-01):**
  - TC-01: valid authenticated draft put/get/delete -> expected statuses 201/200/200.
  - TC-02: missing/invalid token or invalid payload -> expected 401/400.
- **Build completion evidence:**
  - Added draft route family (`/drafts/:storefront`) in `apps/xa-drop-worker/src/index.ts` with auth + revision conflict handling.
  - Added draft contract coverage in `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`.

### TASK-02: Add uploader draft contract client and route fallback for products CRUD
- **Type:** IMPLEMENT
- **Deliverable:** cloud fallback path in products routes using new uploader draft contract client
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`, `apps/xa-uploader/src/app/api/catalog/products/route.ts`, `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 82%
  - Implementation: 81% - requires parity behavior with CSV-backed path.
  - Approach: 84% - contract-first fallback is clear.
  - Impact: 82% - removes primary cloud blocker for lane-1 edits.
- **Acceptance:**
  - When local FS unavailable, products routes use cloud draft contract (not 503).
  - Upsert/delete conflict and not-found semantics remain stable.
- **Build completion evidence:**
  - Added `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`.
  - Updated products routes to cloud fallback paths:
    - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
    - `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`

### TASK-03: Add cloud-runtime error mapping in uploader action feedback
- **Type:** IMPLEMENT
- **Deliverable:** actionable cloud-specific error feedback in uploader UI action layer
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`, `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** TASK-02
- **Blocks:** TASK-05
- **Confidence:** 92%
  - Implementation: 95% - small localized change.
  - Approach: 90% - straightforward mapping extension.
  - Impact: 92% - improves operator recovery.
- **Build completion evidence:**
  - Added `service_unavailable` mapping in `catalogConsoleFeedback.ts`.
  - Added i18n copy key `apiErrorServiceUnavailable` in `uploaderI18n.ts`.

### TASK-04: Add/extend tests for cloud draft path
- **Type:** IMPLEMENT
- **Deliverable:** updated drop-worker and uploader route tests covering cloud fallback behaviors
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/xa-drop-worker/__tests__/xaDropWorker.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 80% - test harness updates are predictable.
  - Approach: 82% - clear scenario matrix.
  - Impact: 80% - closes regression gap.
- **Build completion evidence:**
  - Updated products route tests for cloud fallback behavior:
    - `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`
    - `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.branches.test.ts`
    - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
    - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.branches.test.ts`

### TASK-05: Run scoped validation and update plan evidence
- **Type:** IMPLEMENT
- **Deliverable:** passing typecheck/lint on changed packages and updated plan evidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-01)
- **Affects:** `apps/xa-uploader/`, `apps/xa-drop-worker/`, `docs/plans/xa-uploader-cloud-free-tier-replatform/plan.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - standard validation gate.
  - Approach: 95% - scoped package checks.
  - Impact: 95% - ensures build readiness.
- **Build completion evidence:**
  - `pnpm --filter @apps/xa-uploader typecheck` PASS.
  - `pnpm --filter @apps/xa-uploader lint` PASS (existing warnings only in untouched currency-rates route).
  - `pnpm --filter @apps/xa-drop-worker typecheck` PASS.
  - `pnpm --filter @apps/xa-drop-worker lint` PASS.

## Risks & Mitigations
- Lost updates across concurrent writes -> add document revision + 409 conflict contract.
- Auth leakage across contract paths -> enforce token checks per route and test negative cases.

## Free-Tier Compliance: Explicitly Not Implemented
These options were intentionally not selected for this replatform tranche to preserve Cloudflare Free Tier operational fit and keep the product aligned to the agreed two-lane workflow.

### Rejected for this tranche
- Single-pass "data + all media in one bulk upload" flow.
  Reason: pushes request/runtime complexity and file-size pressure into one operation, increasing timeout/failure risk on free-tier limits.
- Large monolithic upload target (for example, 100MB single upload payloads).
  Reason: unnecessary for current operator workflow and increases risk of request rejection, retries, and degraded UX.
- Desktop-native uploader packaging as the primary operational path.
  Reason: adds distribution/install/support burden; web-hosted flow is required for day-one operator usability.
- Local filesystem dependent APIs as production behavior.
  Reason: not compatible with hosted Cloudflare runtime expectations.
- Local script-spawn orchestration as required publish path.
  Reason: process-spawn dependencies are not a reliable free-tier hosted assumption.

### Chosen shape instead
- Two-lane model:
  - Lane 1: bulk product data upload/edit (cloud draft contract).
  - Lane 2: media assign/reassign per product with per-image constraints and role-specific slots (front/side/top, etc.).
- Incremental cloud-native contracts and API fallbacks that keep requests bounded and recoverable.

## Acceptance Criteria (overall)
- [x] Hosted uploader can list/save/delete product drafts in cloud mode.
- [x] Cloud-mode failure messages are actionable.
- [x] New contract behaviors covered by route/worker tests.
- [x] Changed packages pass scoped typecheck + lint.

## Decision Log
- 2026-03-01: Chose incremental replatform starting with lane-1 cloud draft CRUD as highest-risk blocker for hosted usability.
