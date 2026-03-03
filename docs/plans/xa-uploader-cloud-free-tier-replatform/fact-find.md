---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-cloud-free-tier-replatform
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Related-Plan: docs/plans/xa-uploader-cloud-free-tier-replatform/plan.md
Trigger-Why: End users cannot run local dev/ops commands; xa-uploader must be usable as a hosted product on Cloudflare free tier.
Trigger-Intended-Outcome: type: operational | statement: Ship xa-uploader cloud-native two-lane flows (bulk data + media assign/reassign) without local filesystem/server-script dependency. | source: operator
---

# XA Uploader Cloud Free-Tier Replatform Fact-Find Brief

## Scope
### Summary
Replatform xa-uploader operator flows that currently require local filesystem and process spawning so hosted Cloudflare deployment is functional for end users.

### Goals
- Replace local-FS product draft CRUD in uploader APIs with cloud storage-backed operations.
- Preserve two-lane UX intent: data bulk lane + media assign/reassign lane.
- Keep xa-b publish/display path verifiable on cloud.

### Non-goals
- Desktop app packaging.
- Full UI redesign.

### Constraints & Assumptions
- Constraints:
  - Must work on Cloudflare free-tier compatible runtime constraints.
  - Keep existing auth/session model unless a change is strictly required.
- Assumptions:
  - `xa-drop-worker` remains available as the cloud contract service.

## Outcome Contract
- **Why:** End users cannot run terminal-based local ops; hosted uploader must be day-one usable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Ship cloud-native xa-uploader flows for product data and media assignment without local filesystem dependency.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/xa-uploader/src/app/api/catalog/products/route.ts` - local-FS guarded list/upsert.
- `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts` - local-FS guarded get/delete.
- `apps/xa-uploader/src/app/api/catalog/submission/route.ts` - local ZIP generation from disk.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` - local script spawning + publish.

### Key Modules / Files
- `apps/xa-uploader/src/lib/catalogCsv.ts` - CSV file persistence.
- `apps/xa-uploader/src/lib/submissionZip.ts` - filesystem file scan/package logic.
- `apps/xa-uploader/src/lib/localFsGuard.ts` - cloud-disabled response path.
- `apps/xa-drop-worker/src/index.ts` - R2-backed upload/catalog contract endpoints.
- `apps/xa-b/scripts/build-xa.mjs` - build-time catalog sync.

### Data & Contracts
- Product draft contract: `CatalogProductDraftInput` via `@acme/lib/xa/catalogAdminSchema`.
- Current cloud publish/read contract: `/catalog/:storefront` on drop-worker.

### Dependency & Impact Map
- Upstream: uploader auth/session, draft schema validation, storefront selector.
- Downstream: xa-b build reads catalog contract; operator publish confirmation relies on sync outcomes.
- Blast radius: uploader API behavior, drop-worker contract surface, route tests, error mapping.

### Test Landscape
- Existing route unit tests for products/submission/sync include local-FS-disabled branches.
- Existing drop-worker tests cover upload + catalog contract but not draft CRUD API.

### Coverage Gaps
- No cloud-backed draft CRUD integration tests.
- No end-to-end publish verification chain test for hosted uploader path.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Contract growth in drop-worker causes auth ambiguity | Medium | High | Reuse explicit write/read token checks and path-segment routing tests |
| Concurrent draft writes cause lost updates | Medium | High | Add document-level revision + 409 conflict handling |
| UI still shows non-actionable cloud errors | High | Medium | Add explicit `service_unavailable`/cloud-mode feedback mapping |

## Suggested Task Seeds (Non-binding)
- TASK-01: Implement cloud draft contract in drop-worker (`/drafts/:storefront`).
- TASK-02: Add uploader cloud draft client + wire products routes to cloud fallback mode.
- TASK-03: Improve action feedback mapping for cloud/runtime-specific failures.
- TASK-04: Add contract tests (drop-worker + uploader products routes).
- TASK-05: Validate/lint affected packages and update plan evidence.

## Evidence Gap Review
### Gaps Addressed
- Confirmed exact local-FS failure paths and existing contract endpoints.

### Confidence Adjustments
- Implementation confidence reduced for submission/sync replatform scope; raised for first slice (products CRUD) due to clear boundaries.

### Remaining Assumptions
- Dedicated draft endpoint on drop-worker is acceptable as canonical cloud draft store for uploader.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for first implementation slice.
- Recommended next step:
  - `/lp-do-build` on approved plan tasks.
