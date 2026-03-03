---
Status: Complete
Feature-Slug: xa-r2-deployment-config
Completed-date: 2026-03-03
artifact: build-record
Build-Event-Ref: docs/plans/xa-r2-deployment-config/build-event.json
---

# Build Record — xa-r2-deployment-config

## What Was Built

### TASK-01: Add R2 image URL env var to xa-b CI build step

Added `NEXT_PUBLIC_XA_IMAGES_BASE_URL: ${{ vars.XA_IMAGES_BASE_URL }}` to the xa-b build step in `.github/workflows/xa.yml` (line 129), alongside the existing `XA_CATALOG_CONTRACT_READ_URL`. This env var is required because xa-b is a static export (Cloudflare Pages) — wrangler.toml `[vars]` are not consumed at build time, so the env var must be injected in the CI build step for Next.js to bake it into the client bundle.

Updated `apps/xa-b/wrangler.toml` with documentation-only comments explaining that the `[vars]` block is not consumed at build time for Pages static exports, and pointing to the CI workflow as the actual source of the env var value.

**Files changed:**
- `.github/workflows/xa.yml` — added `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var to xa-b build step
- `apps/xa-b/wrangler.toml` — updated comments to explain Pages vs Worker runtime distinction

**Commit:** `de51b697` on `dev` branch.

## Tests Run

- Typecheck: `@apps/xa-b` — PASS (via pre-commit hook `typecheck-staged`)
- Lint: `@apps/xa-b` — PASS (via pre-commit hook `lint-staged-packages`)
- YAML validation: Python yaml.safe_load + assertion that `NEXT_PUBLIC_XA_IMAGES_BASE_URL` exists in the xa-b build step env block — PASS

No unit tests affected — this is a CI config change, not a code change.

## Validation Evidence

- **TC-01:** xa-b build step in xa.yml includes `NEXT_PUBLIC_XA_IMAGES_BASE_URL` in env block — PASS (verified at line 129)
- **TC-02:** wrangler.toml placeholder updated with comment explaining Pages vs Worker runtime — PASS (lines 6-15)
- **Post-build validation:** Mode 2 (Data Simulation) — YAML parse + env var assertion. Attempt 1. PASS.

## Scope Deviations

None.

## Outcome Contract

- **Why:** The R2 image upload feature is code-complete but cannot be used until the R2 bucket is created, public access enabled, and the actual public URL configured. This is the deployment blocker for the entire image upload capability.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CI build environment configured with `NEXT_PUBLIC_XA_IMAGES_BASE_URL` env var (GitHub Actions variable reference) and xa-b wrangler.toml placeholder updated for documentation. Operator prerequisites (R2 bucket creation, public access, GitHub Actions variable, deployment, verification) are documented but out of scope for this plan's tasks.
- **Source:** operator
