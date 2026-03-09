---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-hosted-only-runtime
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Hosted-Only Runtime Plan

## Summary
`xa-uploader` still carries a live dual-runtime model where operator flows can read and write repo-local CSV/filesystem state even though the product decision is now Cloudflare free-tier hosted mode only. That split has already produced incorrect behavior in the publish flow and creates ongoing maintenance noise because route logic, tests, and audit surfaces still pretend local-FS is a supported lane. This plan collapses the active operator runtime onto the contract-backed cloud path, removes local filesystem fallbacks from operator-facing routes, and updates the affected test contracts. Local helper modules and archived docs may remain temporarily if they are no longer referenced by the active runtime.

## Active tasks
- [x] TASK-01: Remove local-FS branching from active xa-uploader operator runtime and tests

## Goals
- Make xa-uploader operator routes use one hosted/cloud source of truth.
- Remove repo-local file fallbacks from active operator workflows.
- Keep the implementation within current Cloudflare free-tier architecture.

## Non-goals
- Deleting every historical local-helper file in this same pass.
- Rewriting archived plan artifacts or historical docs.
- Changing business behavior outside `xa-uploader` runtime paths.

## Constraints & Assumptions
- Constraints:
  - Must not add infrastructure that exceeds current Cloudflare free-tier assumptions.
  - Must preserve current machine-token API contracts where possible.
  - Local Jest/e2e execution remains repo-policy blocked.
- Assumptions:
  - Contract-backed drafts, currency rates, publish, KV, and R2 remain the canonical hosted runtime.
  - Any missing Cloudflare binding/config should fail closed with explicit operator-visible errors rather than local fallback.

## Inherited Outcome Contract
- **Why:** Running a duplicate local-FS system serves no real purpose and creates false-positive maintenance requirements.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Use one cloud-mode system for xa-uploader, provided the solution stays within Cloudflare free tier.
- **Source:** operator

## Fact-Find Reference
- Related brief: None: direct operator direction plus code audit in-session
- Key findings used:
  - Product CRUD and publish were split across local CSV and cloud snapshot paths.
  - Sync, image persistence, currency rates, and deploy bookkeeping still exposed repo-local fallbacks.
  - Local-FS branching in active routes materially increased maintenance surface and produced incorrect behavior.

## Proposed Approach
- Option A: Keep local-FS code but flip the default with environment config only.
- Option B: Remove local-FS branching from active operator routes and require hosted bindings/config explicitly.
- Chosen approach: Option B. Environment-only flipping would leave the duplicate runtime and its maintenance burden intact.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Collapse xa-uploader operator runtime to hosted/cloud-only paths and update affected tests | 87% | L | Complete | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Cross-cutting runtime simplification; keep as one serial task to avoid conflicting route/test edits |

## Tasks

### TASK-01: Remove local-FS branching from active xa-uploader operator runtime and tests
- Type: IMPLEMENT
- Execution-Skill: lp-do-build
- Why: The active operator runtime must use one hosted system, not a silent local fallback lane.
- Affects:
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`
  - `apps/xa-uploader/src/lib/r2Media.ts`
  - `apps/xa-uploader/src/lib/syncMutex.ts`
  - `apps/xa-uploader/src/lib/localFsGuard.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/bulk/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.cloud-publish.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/deploy-drain/__tests__/route.test.ts`
  - `docs/plans/xa-uploader-hosted-only-runtime/plan.md`
- Acceptance:
  - All active xa-uploader operator routes use contract/KV/R2-hosted paths only.
  - Missing contract or media bindings return explicit service/config errors, never local file fallback behavior.
  - Sync readiness reflects hosted prerequisites closely enough that obvious hard blockers are not reported as ready.
  - Affected route tests reflect hosted-only behavior and no longer encode local-FS as a supported runtime lane.
- Expected user-observable behavior:
  - Operators edit, publish, sync, and manage currency rates against one cloud-backed catalog state.
  - If hosted bindings/config are missing, the UI receives explicit failures instead of silently using repo-local files.
  - Image upload/delete no longer succeeds via hidden local-disk fallback when storage bindings are unavailable.
- Validation:
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
  - `bash scripts/validate-changes.sh`
- Build evidence:
  - Active operator routes now use hosted contract/KV/R2 paths only; local-FS routing branches were removed from products, currency rates, images, publish, and sync routes.
  - `sync/route.ts` now runs the hosted draft-to-contract pipeline only, and the obsolete local script branch test was deleted.
  - Hosted-only route tests were updated to remove local-FS assumptions and stale local CSV mocks.
  - Validation: `pnpm --filter @apps/xa-uploader typecheck`; `pnpm --filter @apps/xa-uploader lint`; `bash scripts/validate-changes.sh` (repo gate passed, but only against pre-existing staged files in the worktree).

## Risks & Mitigations
- Risk: Hosted-only failures may surface missing bindings that were previously masked by local fallback.
  - Mitigation: Fail with explicit machine codes/recovery guidance instead of silently using disk.
- Risk: Existing route tests may overfit to removed local mode.
  - Mitigation: Update or remove only the tests that encode local runtime as a supported lane.

## Observability
- Logging: Preserve existing contract/deploy warnings; no new noisy logs.
- Metrics: None: current route surface uses rate-limit and machine-code responses rather than dedicated metrics.
- Alerts/Dashboards: None: unchanged in this tranche.

## Acceptance Criteria (overall)
- [x] xa-uploader operator runtime no longer depends on repo-local filesystem branches for live behavior.
- [x] Hosted/cloud prerequisites are the only supported runtime path in active xa-uploader routes.
- [x] Targeted validation passes locally.

## Decision Log
- 2026-03-09: Chose hosted-only runtime cleanup now that Cloudflare free-tier hosted mode is the explicit product direction.
- 2026-03-09: Completed the hosted-only route cutover and removed the remaining active local-FS sync branch/test surface.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
