---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Deploy
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: brikette-staging-to-live-launch
Related-Plan: docs/plans/brikette-staging-to-live-launch-plan.md
---

# Brikette Staging → Live Launch Fact-Find Brief

## Scope

### Summary

Determine what’s required to “go live” with Brikette (`apps/brikette`) after validating changes on staging. In this repo, “staging” and “production/live” map to Cloudflare Pages branch deployments driven by GitHub Actions.

### Goals

- Production (“live”) deployment of Brikette via `.github/workflows/brikette.yml` with a custom domain.
- Staging preview deployment remains available for ongoing validation.
- Release gates are green (build, typecheck, tests, deploy, post-deploy health check).
- Cloudflare runtime configuration is correct for SEO/canonical URLs.
- Clear rollback path (redeploy prior `main` commit / revert).

### Non-goals

- Fixing translation coverage or content quality issues (unless they block release gates).
- Large SEO redesign or performance work outside what’s required to ship safely.

### Constraints & Assumptions

- Deploy target: **Cloudflare Pages** via `@cloudflare/next-on-pages`.
- Production deploy is intentionally **manual-gated** (workflow dispatch) to control cutover.
- You have access to the Cloudflare account that hosts the Pages project and the DNS zone for the custom domain.

## Repo Audit (Current State)

### Entry Points

- `.github/workflows/brikette.yml` — Brikette deploy workflow (staging on push; production via manual dispatch).
- `.github/workflows/reusable-app.yml` — Shared validate/build/deploy pipeline used by Brikette.
- `scripts/validate-deploy-env.sh` — Pre-deploy gate for required secrets.
- `scripts/post-deploy-health-check.sh` — Post-deploy URL checks (homepage + `EXTRA_ROUTES`).

### Key Modules / Files

- `apps/brikette/next.config.mjs` — Defines which `NEXT_PUBLIC_*` env vars are wired into the build.
- `apps/brikette/src/config/baseUrl.ts` and `apps/brikette/src/config/env.ts` — Canonical origin/base-url resolution used by SEO generators and metadata.
- `apps/brikette/public/_redirects` — Cloudflare Pages redirect rules deployed alongside static output.
- `apps/brikette/src/app/api/debug-env/route.ts` — Debug endpoint that exposes a subset of env values.
- `docs/plans/brikette-cloudflare-staging-deployment-briefing.md` — Existing briefing on staging deploy + manual prod publish path.

### Data & Contracts

#### GitHub Actions secrets (deploy-time)

Required by `.github/workflows/reusable-app.yml`:
- `CLOUDFLARE_API_TOKEN` (required)
- `CLOUDFLARE_ACCOUNT_ID` (required)
- `SOPS_AGE_KEY` (required on `main` because `require-key: ${{ github.ref == 'refs/heads/main' }}` in the deploy job)

#### Cloudflare Pages environment variables (runtime)

Brikette’s Next config reads and exposes these (see `apps/brikette/next.config.mjs` and `apps/brikette/src/config/env.ts`):
- `NEXT_PUBLIC_SITE_ORIGIN` and/or `NEXT_PUBLIC_SITE_DOMAIN` (canonical origin/domain)
- `NEXT_PUBLIC_BASE_URL` (explicit override for absolute URL generation)
- Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_NOINDEX_PREVIEW`, guide authoring/debug flags, etc.

### Dependency & Impact Map

- Upstream dependencies:
  - GitHub Actions runner environment, repo secrets, and environments (`staging`/`production`).
  - Cloudflare Pages project configuration (project name, production branch, branch deployments, env vars).
  - DNS/custom domain routing for live cutover.
- Downstream dependents:
  - SEO artifacts generated at build time (`apps/brikette/scripts/generate-public-seo.ts`) depend on correct base URL/origin selection.
  - Post-deploy health check success gates deployment status in GitHub Actions.

### Tests & Quality Gates

#### What CI enforces for Brikette deploys

In `reusable-app.yml`, the Brikette pipeline runs:
- `pnpm --filter @apps/brikette lint` (Brikette currently prints “Lint temporarily disabled…” and exits 0).
- `pnpm --filter @apps/brikette typecheck`
- `pnpm --filter @apps/brikette test`
- `pnpm --filter @apps/brikette... build`
- Deploy + post-deploy health check (on `main` only)

#### Local evidence (2026-02-01)

- Build: `pnpm --filter @apps/brikette... build` ✅ PASS (generated 4134 static pages and ran `postbuild` SEO generator).
- Typecheck: `pnpm --filter @apps/brikette typecheck` ✅ PASS.
- Tests: `pnpm --filter @apps/brikette test` ❌ FAIL.
  - Example failures observed:
    - `apps/brikette/src/locales/__tests__/english-fallback.test.ts` — fails on English strings copied into non-EN locales (3440 findings).
    - `apps/brikette/src/test/routes/guides/__tests__/block-template-wiring.test.tsx` — fails on unexpected `console.warn` from `react-i18next` missing instance.
    - `apps/brikette/src/test/styles/theme-init.test.ts` — string/assertion mismatch vs current init theme script output.
    - `apps/brikette/src/test/content-readiness/guides/guide-namespace-migration.test.ts` — snapshot mismatch.
  - Jest summary at the time: “13 failed, 80 passed, 1 skipped” (partial list above).

#### Deploy health check mismatch (likely blocker)

The reusable deploy job sets `EXTRA_ROUTES="/api/health"` for all app deploys.

Repo evidence suggests Brikette does not implement `/api/health`:
- Brikette API routes present: `apps/brikette/src/app/api/**` (e.g. `/api/debug-env`, `/api/guides/*`)
- No `apps/brikette/src/app/api/health/route.ts` exists.

This likely means: even if deploy succeeds, the post-deploy health check will fail unless `EXTRA_ROUTES` is overridden or a health endpoint is added.

### Recent Git History (Targeted)

- `.github/workflows/brikette.yml` introduced in commit `8b068fc011` (2026-01-27).
- `reusable-app.yml` updated for Brikette warn-only guide checks in commit `cfaf8df8fb` (2026-01-29).

## Questions

### Resolved

- Q: How does Brikette deploy to staging vs production?
  - A: Staging deploy runs on pushes to `main` (deploys to Cloudflare Pages “branch” `staging`). Production deploy is manual: `workflow_dispatch` with `publish_to_production=true`, which deploys branch `main`.
  - Evidence: `.github/workflows/brikette.yml`

- Q: What quality gates must pass before deploy happens?
  - A: Lint, typecheck, tests, and build all run before the deploy job; deploy runs only on `main`.
  - Evidence: `.github/workflows/reusable-app.yml`

### Open (User Input Needed)

- Q1: What is the canonical “live” hostname: `https://hostel-positano.com` or `https://www.hostel-positano.com`?
  - Why it matters: Brikette code/tests and workflow currently reference both; canonical URL/origin drives sitemap/robots/metadata output and SEO correctness.
  - Decision impacted: Cloudflare custom domain setup, `NEXT_PUBLIC_SITE_ORIGIN` / `NEXT_PUBLIC_SITE_DOMAIN` values, and health-check base URL.
  - Default recommendation + risk: Prefer `https://hostel-positano.com` as canonical (multiple tests assert this), and redirect `www → apex`. Risk: if the business expects `www` canonical, tests/config need to be aligned before launch.

- Q2: Should production deploy be blocked on the current Brikette test suite, or do you want a temporary policy for “content readiness” / translation-related failures?
  - Why it matters: The current workflow requires `pnpm --filter @apps/brikette test` to pass; locally it fails for multiple reasons including content checks.
  - Decision impacted: Whether launch requires test fixes vs. a workflow change (e.g., separating content-readiness into warn-only runs).
  - Default recommendation + risk: Fix tests and keep the deploy gate strict. Risk: more work before launch; benefit: higher confidence and less SEO/content regression risk.

- Q3: How should post-deploy health checks work for Brikette?
  - Why it matters: Current deploy pipeline checks `/api/health`, which Brikette likely doesn’t provide.
  - Decision impacted: Release pipeline reliability (green deploys) and operational monitoring endpoints.
  - Default recommendation + risk: Add a minimal `/api/health` endpoint in Brikette and keep the shared `EXTRA_ROUTES` policy. Risk: small code change; benefit: consistent monitoring across apps.

## Confidence Inputs (for /plan-feature)

- **Implementation:** 70%
  - Evidence: Deploy workflow and build/typecheck are in place and `build` succeeds locally.
  - Missing: Brikette test suite currently fails locally; deploy health check route mismatch likely fails post-deploy.
- **Approach:** 85%
  - Evidence: Manual-gated production deploy + reusable pipeline is consistent with other apps and supports staged cutover.
  - Missing: Canonical domain decision and health check strategy.
- **Impact:** 75%
  - Evidence: Primary blast radius is Cloudflare Pages + SEO/public artifacts; entry points are well defined.
  - Missing: Confirmation of existing live traffic/domain ownership and whether there is an existing production Pages project already serving the domain.

## Planning Constraints & Notes

- Keep production deploy manual-gated until the first successful live cutover is stable.
- Don’t bypass failing tests without an explicit policy decision and a replacement quality gate (e.g., warn-only content readiness + strict unit tests).
- Align canonical domain references across:
  - Cloudflare custom domains + redirects
  - Brikette `NEXT_PUBLIC_*` config
  - GitHub Actions environment URL + health checks

## Suggested Task Seeds (Non-binding)

- Fix/triage failing Brikette tests to make `pnpm --filter @apps/brikette test` green.
- Decide canonical live hostname; configure Cloudflare Pages custom domain(s) + redirects; set production env vars.
- Add/align a health endpoint for Brikette (or override `EXTRA_ROUTES`) so deploy health checks are reliable.
- Run staged validation:
  - Deploy to staging (workflow push path) and verify:
    - rendered pages + critical routes
    - robots/sitemap correctness for staging (if needed)
  - Run manual production publish and validate:
    - canonical URLs, sitemap/robots point to canonical hostname
    - redirects (www/apex, trailing slashes) behave as expected

## Planning Readiness

- Status: Needs-input
- Blocking items:
  - Canonical domain decision (Q1)
  - Release policy for failing tests / content readiness (Q2)
  - Health check strategy (Q3)
- Recommended next step:
  - Answer Q1–Q3, then proceed to `/plan-feature` to produce `docs/plans/brikette-staging-to-live-launch-plan.md`.

