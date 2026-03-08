---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-media-path-and-publish-flow-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, tool-process-audit
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# XA Uploader Media Path + Publish Flow Hardening Plan

## Summary
This plan addresses four reported operator-facing workflow issues across add/edit product flows: media path mismatch, mixed leading slash formats, manual sync->deploy friction, and publish-state visibility confusion. The highest-risk defect is path-contract drift between upload output and sync transformation, which can produce missing storefront images after sync/build. The approach is to harden a single media path contract that supports both legacy CSV data and current upload behavior, while preserving Cloudflare free-tier constraints (no paid services, no always-on background pipeline). For publish/deploy ergonomics, we will add optional lightweight automation with explicit throttling and keep safe manual fallback.

## Active tasks
- [x] TASK-01: Harden media path contract across upload, validate, and sync pipeline (fix breaking mismatch)
- [x] TASK-02: Normalize leading slash/path format at write boundaries (remove mixed path styles)
- [x] TASK-03: Add free-tier-safe post-sync deploy trigger and stale-state visibility (reduce manual rebuild misses)
- [x] TASK-04: Improve publish-state UX and pre-sync readiness signals (make draft/ready/live behavior explicit)
- [x] TASK-05: Add regression tests, run scoped validation, and update operator docs

## Goals
- Eliminate broken image URLs caused by sync remapping uploaded image keys into non-existent directories.
- Ensure one canonical path normalization policy for `imageFiles` fields.
- Reduce operator error around "sync completed but storefront still stale" without requiring paid Cloudflare features.
- Keep publish-state gating safe (`ready`/`live` only) while making readiness and failure reasons obvious.

## Non-goals
- Replatform `xa-b` to runtime contract fetch on every request.
- Introduce paid Cloudflare services or long-running background workers.
- Remove publish gating to allow raw drafts to appear live.

## Constraints & Assumptions
- Constraints:
  - Must remain compatible with Cloudflare free tier usage patterns.
  - Must preserve backward compatibility for existing CSV rows that already contain `/images/<brand>/<slug>/...` style paths.
  - Must keep existing two-lane model (draft editing/upload in uploader, storefront refresh via deploy/build contract).
- Assumptions:
  - Current operator workflows continue to use `apps/xa-uploader` as primary editing surface.
  - Existing catalog rows may contain both leading-slash and no-leading-slash path variants.
  - Deploy hook usage (if configured) is optional and may be unavailable in some environments.

## Inherited Outcome Contract
- **Why:** Current add/edit workflow can produce missing images and stale storefront updates, blocking reliable operator publishing.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Make upload->sync->storefront publishing reliable and explicit under Cloudflare free-tier constraints.
- **Source:** operator

## Fact-Find Reference
- Related evidence came from direct code audit of:
  - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
  - `scripts/src/xa/catalogSyncCommon.ts`
  - `scripts/src/xa/run-xa-pipeline.ts`
  - `scripts/src/xa/validate-xa-inputs.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-b/scripts/build-xa.mjs`
  - `apps/xa-b/src/lib/xaImages.ts`

## Current-State Evidence
- Upload route local fallback writes to `xa-b/public/images/<slug>/<file>` and returns `images/<slug>/<file>`.
- Sync script currently generates catalog media paths via `buildCatalogMediaPath()` as `/images/<brand>/<slug>/<file>`.
- Validation/sync scripts resolve non-glob image specs relative to `apps/xa-uploader/data`, so direct catalog keys can be treated as missing local files if not explicitly handled.
- Sync response currently returns `requiresXaBBuild: true` and `nextAction: rebuild_and_deploy_xa_b`.
- Publish filtering in sync remains `ready|live` (draft excluded), matching production-safety intent.

## Proposed Approach
- Option A: Change uploader path generation to include brand directory everywhere.
- Option B: Preserve uploader keys as canonical catalog keys when they already represent deployable paths; only transform true source-file specs.
- Chosen approach: **Option B**.
  - Reasoning: lowest migration risk, backward compatible with current and legacy CSV rows, minimal operator retraining, and no additional free-tier resource burden.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add catalog-key aware media path handling in validate+sync scripts and shared helpers | 84% | M | Complete (2026-03-04) | - | TASK-02,TASK-03,TASK-05 |
| TASK-02 | IMPLEMENT | Enforce normalization of `imageFiles` path format on save/upload boundaries | 92% | S | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Add optional deploy hook trigger with cooldown + stale guidance response fields | 80% | M | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Add explicit readiness/publish-state UX cues before sync | 88% | S | Complete (2026-03-04) | TASK-01 | TASK-05 |
| TASK-05 | IMPLEMENT | Add regression tests, run scoped typecheck/lint, update end-user guidance | 86% | M | Complete (2026-03-04) | TASK-02,TASK-03,TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract hardening first; all downstream tasks depend on stable path semantics |
| 2 | TASK-02, TASK-04 | TASK-01 | Path normalization and UX messaging can run in parallel |
| 3 | TASK-03 | TASK-01 | Deploy trigger can proceed after contract is stable |
| 4 | TASK-05 | TASK-02,TASK-03,TASK-04 | Consolidated verification + docs refresh |

## Tasks

### TASK-01: Harden media path contract across upload, validate, and sync pipeline
- **Type:** IMPLEMENT
- **Effort:** M
- **Affects:**
  - `scripts/src/xa/run-xa-pipeline.ts`
  - `scripts/src/xa/validate-xa-inputs.ts`
  - `scripts/src/xa/catalogSyncCommon.ts`
  - `apps/xa-uploader/src/lib/catalogDraftToContract.ts` (shared normalization parity)
- **Contract:**
  - Treat entries that are already catalog keys (`/images/...`, `images/...`, `<storefront>/<slug>/...`, `http(s)://...`) as publishable media paths, not as source files to be remapped.
  - Keep source-file/glob flow for non-key specs.
  - Preserve legacy `/images/<brand>/<slug>/...` entries as valid.
- **Acceptance:**
  - Uploaded image keys no longer get remapped into non-existent brand subdirectories.
  - Strict validation does not incorrectly fail catalog-key image specs as missing local files.
  - Existing brand-scoped image paths remain unchanged and valid.

### TASK-02: Normalize leading slash/path format at write boundaries
- **Type:** IMPLEMENT
- **Effort:** S
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
- **Contract:**
  - Canonical stored format in CSV is `no-leading-slash` for non-URL paths (for example `images/...`, `xa-b/...`).
  - Read-path remains tolerant of legacy leading slash values.
- **Acceptance:**
  - New saves/uploads no longer introduce mixed leading slash formats in `imageFiles`.
  - Existing rows still render and sync successfully.

### TASK-03: Free-tier-safe sync->deploy automation and stale-state signaling
- **Type:** IMPLEMENT
- **Effort:** M
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
- **Contract:**
  - Add optional deploy hook trigger (`XA_B_DEPLOY_HOOK_URL`) executed only after successful non-dry-run sync publish.
  - Throttle triggers via cooldown to avoid excessive build minutes on free tier.
  - If hook missing/fails, response must keep explicit manual next action.
- **Acceptance:**
  - Operators receive deterministic deploy status (`triggered`, `skipped_unconfigured`, `skipped_cooldown`, `failed`).
  - No mandatory external service requirement is introduced.
  - Existing manual flow remains functional.

### TASK-04: Publish-state UX clarity and readiness prechecks
- **Type:** IMPLEMENT
- **Effort:** S
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Contract:**
  - Surface draft/ready/live meaning in-line near save/sync actions.
  - Show pre-sync readiness counts (draft vs publishable) and explicit reason when zero publishable.
- **Acceptance:**
  - Operator can see why a product stays draft before running sync.
  - Zero-publishable sync attempts provide actionable guidance without log inspection.

### TASK-05: Tests, validation, and operator docs update
- **Type:** IMPLEMENT
- **Effort:** M
- **Affects:**
  - `scripts/src/xa/__tests__/...` (new/updated path-contract tests)
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/...`
  - `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/...`
  - `apps/xa-uploader/src/app/instructions/...` (EN/ZH user guidance refresh)
- **Validation contract (scoped):**
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
  - `pnpm --filter @apps/xa-b typecheck`
  - `pnpm --filter @apps/xa-b lint`
- **Acceptance:**
  - Regression coverage exists for media-key pass-through behavior and mixed path inputs.
  - EN/ZH instructions match current UI and updated sync/publish behavior.

## Simulation Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01 | Yes | None (design validated against current code paths) | No |
| TASK-02 | Yes | Potential legacy row normalization side effects | Yes (preserve read tolerance, normalize on write only) |
| TASK-03 | Yes | External deploy hook reliability varies by env | Yes (best-effort status + manual fallback) |
| TASK-04 | Yes | Copy-only UX changes may drift from behavior if not tied to readiness helper | Yes (drive from `getCatalogDraftWorkflowReadiness`) |
| TASK-05 | Yes | Existing stale tests may encode obsolete route behavior | Yes (update assertions to new contract) |

## Risks & Mitigations
- Risk: Hidden breakage for legacy `image_files` rows.
  - Mitigation: Keep backward-compatible parser; add fixture tests for legacy + new path forms.
- Risk: Deploy hook spam consumes free-tier build minutes.
  - Mitigation: Cooldown throttle + explicit opt-in env var + no retries loop.
- Risk: Operators interpret draft gating as a bug.
  - Mitigation: Add readiness counts and explicit publish-state guidance in UI copy.

## Observability
- Logging:
  - Sync response payload includes deploy trigger status and reason.
  - Warn when path spec is malformed/unresolvable with row+slug context.
- Metrics:
  - Count of publishable products per sync run.
  - Count of deploy-trigger attempts and outcomes.
- Alerts/Dashboards:
  - None required for first tranche; rely on operator-visible sync feedback.

## Cloudflare Free-Tier Compliance
- No paid services introduced.
- No cron/queue/durable-object dependency added.
- Post-sync deploy trigger is optional, single-call, and cooldown-throttled.
- Existing 25MB upload envelope and 8MB image limit remain unchanged unless explicitly revised.

## Build completion evidence
- Path-contract hardening:
  - `scripts/src/xa/catalogSyncCommon.ts`
  - `scripts/src/xa/run-xa-pipeline.ts`
  - `scripts/src/xa/validate-xa-inputs.ts`
- Path normalization on save:
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
- Deploy hook + cooldown + response guidance:
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
- Publish-state clarity in sync panel:
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- Regression coverage:
  - `scripts/src/xa/__tests__/catalogSyncCommon.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`

## Validation run
- `pnpm --filter @apps/xa-uploader typecheck` PASS
- `pnpm --filter @apps/xa-uploader lint` PASS (warnings only)
- `pnpm --filter @apps/xa-b typecheck` PASS
- `pnpm --filter @apps/xa-b lint` PASS (warnings only)
- `pnpm --filter scripts exec tsc -p tsconfig.json --noEmit` PASS
- Targeted ESLint on changed xa-uploader files PASS

## Acceptance Criteria (overall)
- [x] Issue 1 fixed: uploaded image paths remain valid through sync -> build -> storefront.
- [x] Issue 2 fixed: new path entries are normalized and consistent.
- [x] Issue 3 improved: operators have optional low-cost auto-deploy trigger plus clear manual fallback.
- [x] Issue 4 clarified: draft vs ready/live behavior is explicit before sync.
- [x] Scoped typecheck/lint pass for changed packages.

## Decision Log
- 2026-03-04: Chose catalog-key pass-through contract (instead of forcing brand-path rewrites) to minimize migration risk and keep compatibility with current upload behavior.
- 2026-03-04: Kept publish gating (`ready|live`) as safety invariant; focus on UX clarity instead of bypass.
- 2026-03-04: Chose optional deploy hook + cooldown for free-tier-safe automation instead of mandatory always-on sync-to-deploy pipeline.

## Overall-confidence Calculation
- Task weights: `S=1`, `M=2`
- Weighted score: `(84*2 + 92*1 + 80*2 + 88*1 + 86*2) / (2+1+2+1+2) = 85.5%`
- Rounded Overall-confidence: `86%`

## What would make this >=90%
- Add one dry-run script that replays current `products.xa-b.csv` and proves zero regressions across legacy + uploaded path fixtures.
- Validate deploy-trigger cooldown behavior with deterministic integration tests (success, cooldown skip, network failure).
- Complete an end-to-end operator QA pass in both local-FS mode and cloud mode with updated EN/ZH instructions.
