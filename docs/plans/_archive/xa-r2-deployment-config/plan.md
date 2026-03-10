---
Type: Plan
Status: Archived
Domain: Infra
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-r2-deployment-config
Deliverable-Type: multi
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA R2 Deployment Config Plan

## Summary

The R2 image upload feature is code-complete but requires deployment configuration to activate. The CI workflow for xa-b is missing the `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var in its build step — xa-b is a static export (Pages), so wrangler.toml `[vars]` are not consumed at build time. This plan adds the env var to the CI build step and updates the wrangler.toml placeholder for documentation consistency. Operator must also create R2 buckets and enable public access via the Cloudflare dashboard (documented in acceptance criteria as prerequisites).

## Inherited Outcome Contract

- **Why:** The R2 image upload feature is code-complete but cannot be used until the R2 bucket is created, public access enabled, and the actual public URL configured. This is the deployment blocker for the entire image upload capability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CI build environment configured with `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var (GitHub Actions variable reference) and xa-b wrangler.toml placeholder updated for documentation. Operator prerequisites (R2 bucket creation, public access, GitHub Actions variable, deployment, verification) are documented but out of scope for this plan's tasks.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-r2-deployment-config/fact-find.md`
- Key findings used:
  - xa-b is a static export (`output: "export"`) — wrangler.toml `[vars]` are NOT consumed at build time. The `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var must be set in the CI build step's `env:` block.
  - CI builds xa-b at `.github/workflows/xa.yml` line 125-128, currently only passes `XA_CATALOG_CONTRACT_READ_URL`.
  - CI deploys xa-uploader to staging only (`--env preview`). Production deploy is manual.
  - R2 bucket creation and public access enablement require wrangler CLI and Cloudflare dashboard access respectively.

## Proposed Approach

- **Chosen approach:** Add `NEXT_PUBLIC_XA_IMAGES_BASE_URL: ${{ vars.XA_IMAGES_BASE_URL }}` to the xa-b build step `env:` block in `.github/workflows/xa.yml`. Set `XA_IMAGES_BASE_URL` as a GitHub Actions repository variable. Update the placeholder in `apps/xa-b/wrangler.toml` for documentation consistency. Operator creates buckets and enables public access as documented prerequisites.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add R2 image URL env var to xa-b CI build step | 90% | S | Complete (2026-03-03) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task, no parallelism needed |

## Tasks

### TASK-01: Add R2 image URL env var to xa-b CI build step

- **Type:** IMPLEMENT
- **Deliverable:** CI workflow change + wrangler.toml update
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Affects:**
  - `.github/workflows/xa.yml`
  - `apps/xa-b/wrangler.toml`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — Adding one env var line to a YAML file. Pattern is already established by `XA_CATALOG_CONTRACT_READ_URL` on the same step.
  - Approach: 95% — GitHub Actions `vars.*` is the correct mechanism for non-secret build-time config. Same pattern used for the catalog contract URL.
  - Impact: 90% — This is required for images to resolve in xa-b. Without it, all image URLs resolve to empty string + path, which breaks.
- **Acceptance:**
  - `.github/workflows/xa.yml` xa-b build step includes `NEXT_PUBLIC_XA_IMAGES_BASE_URL: ${{ vars.XA_IMAGES_BASE_URL }}` in the `env:` block
  - `apps/xa-b/wrangler.toml` placeholder value updated to match the GitHub Actions variable name convention (comment noting it's not consumed at build time for Pages)
  - Pre-commit validation passes (typecheck + lint)
  - **Operator prerequisites (not part of this task, but documented):**
    - R2 buckets `xa-media` and `xa-media-preview` created via `wrangler r2 bucket create`
    - Public access enabled on `xa-media` bucket via Cloudflare dashboard
    - `XA_IMAGES_BASE_URL` set as a GitHub Actions repository variable with the actual R2 public URL
    - After CI runs with this change: verify xa-b build output includes the correct image URL
- **Validation contract (TC-01):**
  - TC-01: xa-b build step in xa.yml includes `NEXT_PUBLIC_XA_IMAGES_BASE_URL` in env block -> env var available at build time
  - TC-02: wrangler.toml placeholder updated with comment explaining Pages vs Worker runtime -> documentation accurate
- **Execution plan:**
  1. Add `NEXT_PUBLIC_XA_IMAGES_BASE_URL: ${{ vars.XA_IMAGES_BASE_URL }}` to `.github/workflows/xa.yml` line 128 (alongside existing `XA_CATALOG_CONTRACT_READ_URL`)
  2. Update `apps/xa-b/wrangler.toml` `NEXT_PUBLIC_XA_IMAGES_BASE_URL` with a comment noting it is not consumed at build time for Pages static exports
  3. Run pre-commit validation (typecheck-staged + lint-staged) to verify YAML and TOML changes are valid
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - `NEXT_PUBLIC_XA_IMAGES_BASE_URL` is consumed by:
    - `apps/xa-b/next.config.mjs:10` — reads at build time, extracts hostname for `remotePatterns`
    - `apps/xa-b/src/lib/xaImages.ts:1` — reads at build time, used by `buildXaImageUrl()`
  - Both consumers are already coded and committed. This task supplies the env var they expect.
  - No signature or semantic changes — additive config only.
- **Scouts:** None: straightforward env var addition
- **Edge Cases & Hardening:**
  - If `XA_IMAGES_BASE_URL` GitHub Actions variable is not yet set when CI runs, the env var will be empty string. This is the current behavior (no regression) — `buildXaImageUrl()` handles empty base URL gracefully.
  - If the variable contains a trailing slash, `buildXaImageUrl()` already trims it.
- **What would make this >=95%:**
  - Confirming the GitHub Actions variable is set and CI runs successfully with it. This is a post-deploy verification, not a pre-build uncertainty.
- **Rollout / rollback:**
  - Rollout: merge to dev → CI deploys automatically. No risk — env var is additive.
  - Rollback: revert the commit. xa-b reverts to empty image base URL (current behavior).
- **Documentation impact:**
  - Post-build analysis deployment checklist should be updated to reference the GitHub Actions variable instead of just wrangler.toml.
- **Notes / references:**
  - Prior art: `XA_CATALOG_CONTRACT_READ_URL` in the same build step (line 128)
  - xa-b is `output: "export"` — Pages static export, not a Worker. wrangler.toml `[vars]` are documentation only.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add R2 image URL env var to CI | Yes — `.github/workflows/xa.yml` exists and has the xa-b build step with env block | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GitHub Actions variable not set when CI runs | Medium (operator action required) | Low — same as current behavior (empty URL) | Document prerequisite; no regression |
| YAML syntax error in workflow file | Very Low | Medium — CI fails | Lint check before commit |

## Observability

None: CI workflow change. Observable via GitHub Actions run logs — env var will appear in build output if `NEXT_PUBLIC_` prefix is used (Next.js logs env vars).

## Acceptance Criteria (overall)

- [x] `.github/workflows/xa.yml` updated with `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var in xa-b build step
- [x] `apps/xa-b/wrangler.toml` placeholder updated with explanatory comment
- [x] Pre-commit validation passes

## Decision Log

- 2026-03-04: Chose `vars.*` (GitHub Actions variable) over `secrets.*` because the R2 public URL is not sensitive — it's a public URL.
- 2026-03-04: Chose not to hardcode the URL in the workflow file because it's not known until the operator creates the bucket and enables public access.

## Overall-confidence Calculation

- TASK-01: S (weight 1), confidence 90%
- Overall-confidence = 90%
