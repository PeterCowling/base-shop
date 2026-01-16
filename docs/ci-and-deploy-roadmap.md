Type: Plan
Status: Active
Domain: CI-Deploy
Last-reviewed: 2026-01-16
Last-updated: 2026-01-16
Last-updated-by: Codex
Relates-to charter: docs/architecture.md

## CI & Deploy Roadmap — Apps vs Platform

This document tracks the plan to:

- Add a Cloudflare Pages deployment for `apps/cms`.
- Make CI more precise for app-only changes.
- Treat **new apps** differently from **updates** to existing apps.
- Speed up CI test runs via change-aware test selection and caching.

Audience: agents only. Use this plan to track CI/deploy changes and keep the listed workflows aligned with the repo.

## Active tasks

- **CI-01 — Finalise CMS deploy workflow**
  - Status: ☐
  - Scope:
    - Complete the remaining P3.3/P5.1 items below for CMS Cloudflare configuration and first deploy.
  - Dependencies:
    - Runtime/architecture charters and Base-Shop plan.
  - Definition of done:
    - `.github/workflows/cms.yml` and Cloudflare Pages configuration match the design captured in this plan; CMS can be deployed via workflow dispatch.

## Completed / historical

Use the remaining checkboxes as an active action list; completed phases are summarised for context.

---

## Phase 1 — Clarify Current State

_Phase completed; kept for context._

- Root and app workflows, Cloudflare projects, shared platform packages, and CI/runtime secrets have been mapped and documented.

> Outcome: workflow inventory is mapped (workflows, target Cloudflare projects, and shared packages that should still trigger full-platform CI).

---

## Phase 2 — Design Path-Based CI Precision

_Phase completed; kept for context._

- CI ownership, path filters, and E2E responsibilities are defined for root vs app workflows.

> Outcome: workflow triggers are defined, with “global” vs “app-scoped” checks clearly separated.

---

## Phase 3 — CMS Deploy Workflow Design

- [x] **P3.1 Define CMS deploy behaviour**
  - [x] Decide that `apps/cms` deploys via `@cloudflare/next-on-pages` (dynamic Next.js app).
    - CMS is a dynamic Next.js app with API routes and non-exported runtime behaviour (`apps/cms/next.config.mjs` explicitly disables `output: "export"`), which matches the `@cloudflare/next-on-pages` pattern already used for `base-shop`. Deploy CMS via `npx @cloudflare/next-on-pages deploy` from the repo root or `apps/cms`, rather than static `wrangler pages deploy`.
  - [x] Confirm required production env vars for CMS (auth, Sanity, email, etc.).
    - Core URLs: `NEXTAUTH_URL` and `CMS_BASE_URL` set to the stable CMS production domain (`https://cms-9by.pages.dev`).
    - Auth/session: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`.
    - CMS/API linkage: `CMS_SPACE_URL` (currently pointing at `https://cms-9by.pages.dev` as a placeholder API host) and `CMS_ACCESS_TOKEN` (shared secret for schema pushes).
    - Sanity (stubbed for now): `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_API_VERSION`, `SANITY_PREVIEW_SECRET` all set to safe dummy values.
    - Email: `EMAIL_PROVIDER` set to `noop` until a real provider is configured.
  - [x] Decide which checks are mandatory before deploy:
    - Build CMS and its dependencies using a **filtered build** rather than a global `pnpm -r build` in this app-only workflow (e.g. with pnpm filters / Turbo’s dependency graph).
    - `pnpm --filter @apps/cms lint`.
    - `pnpm --filter @apps/cms typecheck`.
    - `pnpm --filter @apps/cms test`.
- [x] **P3.2 Define CMS workflow triggers**
  - [x] Trigger on `push` for:
    - `main` branch.
    - Path filters matching `apps/cms/**` and the shared packages CMS depends on (from P1.3), so shared changes re-validate CMS (implemented in `.github/workflows/cms.yml`).
  - [x] Add `workflow_dispatch` for manual “Deploy CMS” runs (implemented in `.github/workflows/cms.yml`).
- [ ] **P3.3 Define CMS Cloudflare configuration**
  - [ ] Create the Cloudflare Pages project for CMS.
  - [ ] Configure branch behaviour (production = `main`, others = previews).
  - [ ] Add runtime env vars to the Pages project.
  - [ ] Confirm or create a Cloudflare API token with Pages Write + Workers Pages permissions.
  - [ ] Decide how preview URLs are exposed to agents/operators:
    - [ ] Use `wrangler pages deploy` / `@cloudflare/next-on-pages` output to capture the preview URL in a step with an `id`.
    - [ ] Pipe that URL into either a workflow summary or an `actions/github-script` step that posts a PR comment.
    - [ ] Optionally, explore Cloudflare’s GitHub integration if first-class PR comment support is required instead of bespoke scripting.
  - [ ] Map production vs preview environment variables in Cloudflare (for example: preview CMS uses staging services; production CMS uses production services).

> Outcome: CMS workflow behavior is defined and aligned with Cloudflare deployment constraints.

---

## Phase 4 — New App vs Existing App Strategy

_Phase completed; kept for context._

- New apps and existing apps share a consistent pattern for CI, deployments, and scaffolded workflows (`scripts/src/setup-ci.ts`).

> Outcome: first-time deploys and ongoing updates follow different, explicit playbooks.

---

## Phase 5 — Implementation Steps (High Level)

- [ ] **P5.1 CMS deploy & Cloudflare setup**
  - [ ] Run an initial CMS deploy via `.github/workflows/cms.yml` using `workflow_dispatch` and production-like environment variables.
  - [ ] Sanity-check core CMS flows on the deployed URL (`https://cms-9by.pages.dev`).
  - [ ] Complete CMS Cloudflare configuration from Phase 3.3:
    - [ ] Ensure the Cloudflare Pages project for CMS exists and is wired to this repo.
    - [ ] Configure branch behaviour (production = `main`, others = previews).
    - [ ] Add runtime env vars for production and preview, and confirm API tokens have Pages Write + Workers Pages permissions.
-    - [ ] Decide how preview URLs are surfaced to developers (workflow summary and/or PR comments).
- [x] **P5.2 CI test performance & “slow lane”**
  - [x] Add a `test:affected` script in `package.json` that runs `CI=true turbo run test --affected`.
  - [x] Update `.github/workflows/ci.yml` to:
    - [x] Ensure `actions/checkout` uses `fetch-depth: 0` so Turbo can compute affected packages.
    - [x] Run `pnpm test:affected` on pull requests and non-`main` branches.
    - [x] Keep full `pnpm test` (all workspaces) on `main`.
  - [x] Update `.github/workflows/test.yml` to:
    - [x] Trigger on `push` to `main`, `workflow_dispatch`, and a nightly `schedule` (currently `0 3 * * *`), not on every pull request.
    - [x] Use the existing workspace matrix primarily for coverage artefacts and deep confidence (the CI “slow lane”).
- [ ] **P5.3 Turbo cache strategy & documentation**
  - [x] Enable Turbo caching for `test` tasks in CI by removing `cache: false` from the `test` task in `turbo.json` and scoping its cache with `env: ["CI"]`.
  - [ ] Configure cache-related env vars and secrets for relevant workflows.
  - [ ] Verify repeated runs across `ci.yml`, `cms.yml`, and app workflows make effective use of the cache.
  - [ ] Document cache expectations and debugging guidance in `docs/development.md`.
- [ ] **P5.4 Document first-deploy flows**
  - [ ] For CMS: document using `.github/workflows/cms.yml` via `workflow_dispatch` for the first deploy, and any extra one-time steps (e.g. seeding, migrations, Lighthouse) controlled by inputs/conditions.
  - [ ] For future apps/shops: document how to reuse their app workflows for initial deploys (no separate `*-init.yml` files).

> Outcome: YAML, Cloudflare config, and CI workflows reflect the strategy; iteration on performance and coverage can start.

---

## Phase 6 — Feedback and Iteration

- [ ] **P6.1 Measure CI impact**
  - [ ] Track average runtime of:
    - Root `ci.yml` before vs after applying path filters and “affected tests” / slow-lane changes.
    - `skylar.yml`, `cms.yml`, and the workspace matrix workflow after changes.
  - [ ] Identify any redundant work still happening on app-only updates.
- [ ] **P6.2 Adjust coverage vs speed**
  - [ ] If app workflows are too slow, consider:
    - Moving some checks to scheduled runs.
    - Narrowing test subsets (e.g. smoke suites on push, full suites nightly).
  - [ ] If regressions slip through, consider:
    - Adding targeted E2Es to app workflows.
    - Expanding which paths trigger root `ci.yml`.
- [ ] **P6.3 Keep docs aligned**
  - [ ] Update `docs/development.md` and any relevant `AGENTS.md` files when workflow behaviour changes.
  - [ ] Periodically review this roadmap and tick off completed items.

---

## Phase 7 — Staging/Production Workflow (COMPLETED)

_Implemented 2026-01-16 by Claude Opus 4.5._

All app workflows now follow a two-stage deployment pattern:

1. **Staging (automatic):** Merging a PR to `main` triggers validation + build + deploy to staging
2. **Production (manual + approval):** Manual `workflow_dispatch` with `deploy-target: production` triggers deploy to production, gated by GitHub Environment protection rules

### Apps Migrated

| App | Workflow | Staging URL | Production URL |
|-----|----------|-------------|----------------|
| product-pipeline | `product-pipeline.yml` | `staging.product-pipeline.pages.dev` | `product-pipeline.pages.dev` |
| cms | `cms.yml` | `staging.cms-9by.pages.dev` | `cms-9by.pages.dev` |
| brikette | `brikette.yml` | `staging.brikette.pages.dev` | `brikette.pages.dev` |
| skylar | `skylar.yml` | `staging.skylar.pages.dev` | `skylar.pages.dev` |
| reception | `reception.yml` | `staging.reception.pages.dev` | `reception.pages.dev` |
| prime | `prime.yml` | `staging.prime.pages.dev` | `prime.pages.dev` |
| cover-me-pretty | `cover-me-pretty.yml` | `staging.cover-me-pretty.pages.dev` | `cover-me-pretty.pages.dev` |
| xa | `xa.yml` | `staging.xa.pages.dev` | `xa.pages.dev` |
| xa-b | `xa-b.yml` | `staging.xa-b.pages.dev` | `xa-b.pages.dev` |
| xa-j | `xa-j.yml` | `staging.xa-j.pages.dev` | `xa-j.pages.dev` |
| cochlearfit | `cochlearfit.yml` | `staging.cochlearfit.pages.dev` | `cochlearfit.pages.dev` |
| handbag-configurator | `handbag-configurator.yml` | `staging.handbag-configurator.pages.dev` | `handbag-configurator.pages.dev` |

### Apps Excluded from Staging/Production Workflow

These apps are intentionally excluded from the staging/production deployment pattern:

| App | Reason |
|-----|--------|
| `storybook` | Dev tool only, not deployed to production |
| `*-worker` apps | Cloudflare Workers use `wrangler deploy`, different deployment pattern |
| `api` | Separate deployment mechanism |
| `dashboard` | Library/incomplete app, no build script |
| `storefront` | Library/incomplete app, no build script |

### Key Files

- **Reusable workflow:** `.github/workflows/reusable-app.yml` — Updated with `target-environment` input and split `deploy-staging`/`deploy-production` jobs
- **Convenience workflow:** `.github/workflows/promote-to-production.yml` — Centralized way to promote any app to production

### Usage

See [docs/deployment-workflow.md](./deployment-workflow.md) for detailed instructions.

### GitHub Environments Setup (One-Time)

To enable the approval workflow:

1. Go to **Settings → Environments** in GitHub
2. Create `staging` environment (no protection rules needed)
3. Create `production` environment with:
   - **Required reviewers:** Add the approver GitHub usernames
   - **Deployment branches:** Restrict to `main`

---

## Quick Reference — Responsibilities

- **Root CI (`ci.yml`)**
  - Platform-wide lint/typecheck/test/build.
  - Cross-app E2Es.
  - Deploy `base-shop` Pages project.
- **App workflows (`skylar.yml`, `cms.yml`, `shop-*.yml`)**
  - App-specific lint/typecheck/test/build.
  - App-specific E2Es / a11y checks.
  - Deploy their Cloudflare Pages projects.
  - **Staging:** Auto-deploy on merge to `main` via `--branch staging`.
  - **Production:** Manual trigger with approval via `--branch main`.
  - Trigger on app-local changes **and** on changes to the shared packages they depend on (from P1.3), so shared updates are re-validated in each app.
- **First deploys**
  - Use the same app workflow (`cms.yml`, `skylar.yml`, `shop-*.yml`) via manual `workflow_dispatch` for the initial deploy, with any extra one-off steps gated by inputs/conditions rather than separate workflows.
- **Production promotion**
  - Use `promote-to-production.yml` or the individual app workflow with `deploy-target: production`.
