---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: xa-uploader-sync-fast-path
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Related-Plan: docs/plans/xa-uploader-sync-fast-path/plan.md
Trigger-Why: xa-uploader operator publish should execute only minimum required catalog/media pipeline work; code-quality gates belong to CI for code changes.
Trigger-Intended-Outcome: "type: operational | statement: Default operator sync path runs minimum required publish pipeline only, while GitHub CI continues lint/typecheck/test enforcement for code changes. | source: operator"
---

# XA Uploader Sync Fast Path - Fact-Find Brief

## Summary

The current xa-uploader sync path already avoids lint/typecheck/test during operator publishing, but it still runs both `validate-xa-inputs.ts` and `run-xa-pipeline.ts` on every local-runtime sync. For operator throughput, we should set a fast-path default that runs only required publish processing by default and keep strict validation as opt-in.

## Evidence

- Sync route runs two scripts only (`validate-xa-inputs.ts`, `run-xa-pipeline.ts`) and no code-quality gates:
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- UI defaults currently include `strict: true`, forcing pre-validation every run:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- CI workflow continues to enforce lint/typecheck/tests before deploy:
  - `.github/workflows/xa.yml`

## Scope

### In scope

- Change xa-uploader sync default to fast path (`strict` off by default)
- Execute `validate-xa-inputs.ts` only when strict mode is enabled
- Keep pipeline execution (`run-xa-pipeline.ts`) unchanged
- Keep CI quality gates unchanged

### Out of scope

- Removing strict validation mode
- Changing GitHub CI quality policy
- Adding new API routes

## Outcome Contract

- **Why:** xa-uploader operator publish should execute only minimum required catalog/media pipeline work; code-quality gates belong to CI for code changes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Default operator sync path runs minimum required publish pipeline only, while GitHub CI continues lint/typecheck/test enforcement for code changes.
- **Source:** operator

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-build xa-uploader-sync-fast-path`
