---
Type: Plan
Status: Complete
Domain: Products
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-sync-fast-path
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Sync Fast Path Plan

## Summary

Implement a streamlined operator sync path in xa-uploader: disable strict pre-validation by default and only execute `validate-xa-inputs.ts` when strict mode is explicitly enabled. Preserve `run-xa-pipeline.ts` execution and keep GitHub CI lint/typecheck/test gates unchanged.

## Active tasks

- [x] TASK-01: Implement fast-path sync defaults and conditional strict validation

## Inherited Outcome Contract

- **Why:** xa-uploader operator publish should execute only minimum required catalog/media pipeline work; code-quality gates belong to CI for code changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Default operator sync path runs minimum required publish pipeline only, while GitHub CI continues lint/typecheck/test enforcement for code changes.
- **Source:** operator

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Default strict off in UI and skip pre-validation script unless strict=true | 90% | S | Complete (2026-03-05) | - | - |

## Tasks

### TASK-01: Implement fast-path sync defaults and conditional strict validation

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Status:** Complete (2026-03-05)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `[readonly] .github/workflows/xa.yml`
- **Acceptance:**
  - xa-uploader sync option defaults to `strict=false`
  - `/api/catalog/sync` does not run `validate-xa-inputs.ts` when strict=false
  - `/api/catalog/sync` still runs `run-xa-pipeline.ts`
  - strict=true still runs pre-validation and preserves existing error behavior
  - CI workflow keeps lint/typecheck/test gates unchanged
- **Validation contract (TC-01):**
  - `pnpm --filter @apps/xa-uploader typecheck`
  - `pnpm --filter @apps/xa-uploader lint`
- **Build completion evidence:**
  - Set sync defaults to fast path (`strict: false`) in `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`.
  - Made `/api/catalog/sync` run `validate-xa-inputs.ts` only when strict mode is enabled in `apps/xa-uploader/src/app/api/catalog/sync/route.ts`.
  - Updated strict-option label copy to "full validation" / "完整校验" in `apps/xa-uploader/src/lib/uploaderI18n.ts`.
  - Confirmed CI quality gates remain unchanged (`.github/workflows/xa.yml` untouched in this build).
  - Validation passed:
    - `pnpm --filter @apps/xa-uploader lint`
    - `pnpm --filter @apps/xa-uploader typecheck`

## Risks & Mitigations

- Risk: strict-off default may let weak data through if operator forgets strict mode.
- Mitigation: keep strict option visible and available for manual full checks.

## Acceptance Criteria (overall)

- [x] Fast-path default is active in xa-uploader sync UI/state
- [x] Sync route conditionally executes pre-validation only for strict mode
- [x] CI quality gates remain unchanged
