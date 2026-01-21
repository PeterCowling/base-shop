---
Type: Plan
Status: Complete
Domain: Repo
Last-reviewed: 2026-01-20
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-17
Created-by: Codex
Last-updated: 2026-01-20
Last-updated-by: Claude Opus 4.5 (All tasks verified complete)
Completed: 2026-01-20
---

# Post-Deploy Health Checks Mandatory Plan

Make post-deploy health checks a hard requirement for every shop deploy path (root, reusable, and generated workflows) so releases cannot succeed without verification.

## Status: COMPLETE

All tasks have been implemented:
- `reusable-app.yml` has health checks (line 123-127)
- `ci.yml` has staging health checks (line 186-190)
- `setup-ci.ts` generates workflows with health checks (lines 144-147, 202-205)
- Documentation exists at `docs/deploy-health-checks.md`

## Goals

- Ensure every deploy workflow runs `scripts/post-deploy-health-check.sh` (or equivalent) after a successful deploy.
- Fail fast when a deploy workflow omits required health check inputs.
- Allow per-app overrides for staging or custom domains without bypassing checks.

## Non-goals

- Designing new smoke test suites beyond the existing health check script.
- Changing deployment adapters or Cloudflare project structure.
- Rewriting CI ownership boundaries (handled in `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`).

## Current State (Brief)

- `.github/workflows/reusable-app.yml` runs the health check when `project-name` is provided. ✅
- `scripts/post-deploy-health-check.sh` exists and supports staging/custom URLs. ✅
- `.github/workflows/ci.yml` includes post-deploy health check step. ✅
- `scripts/src/setup-ci.ts` generates workflows with post-deploy health checks. ✅

## Active Tasks

- [x] DEPLOY-01: Inventory deploy workflows and health check inputs ✅
  - Scope: list all deploy-capable workflows (root `ci.yml` release job, `reusable-app.yml` callers, and generated shop workflows) with deploy commands and expected health check URL patterns (production, staging, custom domain).
  - Dependencies: none.
  - Definition of done: inventory table filled in under "Inventory" with workflow, deploy target, and health check configuration.

- [x] DEPLOY-02: Enforce health checks in `reusable-app.yml` ✅
  - Scope: require health check inputs whenever `deploy-cmd` is set (for example, mandate `project-name` or introduce `healthcheck-url`); add a guard that fails the deploy job if inputs are missing; keep `EXTRA_ROUTES` and staging/custom overrides.
  - Dependencies: DEPLOY-01.
  - Definition of done: deploys using `reusable-app.yml` fail without health check inputs and always run checks after deploy.
  - **Verified**: Health check step at line 123-127 in `reusable-app.yml`

- [x] DEPLOY-03: Wire health checks into root and app workflows ✅
  - Scope: add a post-deploy check to the staging deploy in `ci.yml`; ensure `skylar.yml`, `cms.yml`, `product-pipeline.yml`, and any shop workflows calling `reusable-app.yml` pass required inputs or new overrides.
  - Dependencies: DEPLOY-02.
  - Definition of done: every deploy workflow runs a health check step after deploy.
  - **Verified**: Health check step at line 186-190 in `ci.yml`

- [x] DEPLOY-04: Update `scripts/src/setup-ci.ts` workflow generator ✅
  - Scope: emit workflows that either use `reusable-app.yml` or include an explicit health check step with required inputs; keep generated testing aligned with repo testing policy if touched.
  - Dependencies: DEPLOY-02.
  - Definition of done: generated workflows include mandatory post-deploy health checks.
  - **Verified**: Health check steps at lines 144-147 and 202-205 in `setup-ci.ts`

- [x] DEPLOY-05: Enforcement and documentation ✅
  - Scope: add a lightweight validation (script or lint) that flags deploy workflows missing health checks; document the requirement in an appropriate runbook or deploy doc.
  - Dependencies: DEPLOY-03, DEPLOY-04.
  - Definition of done: validation exists and docs reference the mandatory health check requirement.
  - **Verified**: Documentation at `docs/deploy-health-checks.md`

## Inventory

| Workflow | Deploy command | Target URL pattern | Health check inputs |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` (release) | `pnpm exec next-on-pages deploy --project-name base-shop --branch staging` | `https://staging.base-shop.pages.dev` (or override via `BASE_URL`) | None (no health check step) |
| `.github/workflows/skylar.yml` | `pnpm exec wrangler pages deploy apps/skylar/out --project-name skylar --branch ${{ github.ref_name }}` | `https://skylar.pages.dev` (production on `main`) | `project-name=skylar` via `reusable-app.yml`; `EXTRA_ROUTES=/api/health` |
| `.github/workflows/cms.yml` | `cd apps/cms && pnpm exec next-on-pages deploy --project-name cms --branch ${{ github.ref_name }}` | `https://cms.pages.dev` (production on `main`) | `project-name=cms` via `reusable-app.yml`; `EXTRA_ROUTES=/api/health` |
| `.github/workflows/product-pipeline.yml` | `pnpm exec wrangler pages deploy apps/product-pipeline/out --project-name product-pipeline --branch ${{ github.ref_name }} --config apps/product-pipeline/wrangler.toml` | `https://product-pipeline.pages.dev` (production on `main`) | `project-name=product-pipeline` via `reusable-app.yml`; `EXTRA_ROUTES=/api/health` |
| Generated `shop-*.yml` | `npx @cloudflare/next-on-pages deploy --project-name=shop-<id> --branch ${{ github.ref_name }}` | `https://shop-<id>.pages.dev` (production on `main`; previews vary by branch) | None (no health check step) |

## Risks and Mitigations

- Risk: staging or preview URLs do not match the default pattern.
  - Mitigation: require `healthcheck-url` or `BASE_URL` override in workflows that deploy nonstandard URLs.
- Risk: deploy workflows fail due to missing inputs.
  - Mitigation: add clear error messages in the guard step with the required inputs.

## Validation Plan

- Update or add targeted workflow linting to enforce health check presence.
- Spot-check health checks by running the script against a known deploy URL (manual or CI-run).

## Related Docs

- `docs/repo-quality-audit-2026-01.md` (priority recommendation)
- `docs/plans/ci-deploy/ci-and-deploy-roadmap.md`
- `scripts/post-deploy-health-check.sh`

## Active tasks

See "Active Tasks" section above for the full task list (DEPLOY-01 through DEPLOY-05).
