---
Type: Plan
Status: Active
Domain: CI-Deploy
Last-reviewed: 2026-01-17
Relates-to charter: docs/runtime/runtime-charter.md
Last-updated: 2026-01-20
Last-updated-by: Claude
---

## CI & Deploy Roadmap — Apps vs Platform

This document tracks the plan to:

- Add a Cloudflare Pages deployment for `apps/cms`.
- Make CI more precise for app-only changes.
- Treat **new apps** differently from **updates** to existing apps.
- Speed up CI test runs via change-aware test selection and caching.

## Active tasks

- **CI-01 — Finalise CMS Cloudflare setup and first deploy**
  - Status: ☐
  - Scope:
    - Complete P3.3 (Cloudflare Pages project creation, env vars, preview URLs) and P5.1 (first deploy execution).
    - The workflow itself is ready; this task is about the Cloudflare infrastructure setup.
  - Dependencies:
    - Cloudflare account access with Pages Write permissions.
  - Definition of done:
    - Cloudflare Pages project for CMS exists and is configured.
    - First deploy executed via `workflow_dispatch`.
    - Core CMS flows verified on deployed URL.

- **CI-02 — Add cache and first-deploy documentation**
  - Status: ☐
  - Scope:
    - Add Turbo cache debugging guidance to `docs/development.md`.
    - Add step-by-step first-deploy runbook with troubleshooting.
  - Dependencies: None.
  - Definition of done:
    - `docs/development.md` includes cache expectations and debugging section.
    - First-deploy runbook exists with prerequisites checklist and troubleshooting.

## Completed / historical

Use the remaining checkboxes as an active action list; completed phases are summarised for context.

---

## Phase 1 — Clarify Current State

_Phase completed; kept for context._

- Root and app workflows, Cloudflare projects, shared platform packages, and CI/runtime secrets have been mapped and documented.

> Outcome: we know which workflows exist, which Cloudflare projects they target, and which packages are “shared enough” that changing them should still trigger full-platform CI.

---

## Phase 2 — Design Path-Based CI Precision

_Phase completed 2026-01-20; kept for context._

- [x] **P2.1 Decide CI ownership boundaries**
  - [x] Define what the **root CI** (`ci.yml`) is responsible for:
    - Lint/typecheck/test/build of the **shared platform** (packages, core tools).
    - Cross-app E2Es (e.g. dashboard + shop flows).
    - Release of the `base-shop` Cloudflare project.
  - [x] Define what **app workflows** own:
    - App-local lint / typecheck / tests / build.
    - Deployments to their own Pages projects.
    - Any app-specific E2E or a11y suites.
  - [x] Clarify **local vs CI gating philosophy**:
    - Locally: fast, high-signal checks (lint, basic typecheck) should run by default or via pre-commit hooks so lint failures rarely reach CI.
    - In CI: treat tests (unit, integration, E2E) as the primary gate, avoiding a requirement for developers to run full suites locally.
  - _Documented in `docs/development.md` (lines 36-55)._
- [x] **P2.2 Draft path filters (conceptual)**
  - [x] For `ci.yml`, list the paths that **should trigger** full-platform verification, e.g.:
    - `packages/**`, `src/**`, `functions/**`, `tools/**`, `docs/**` (for platform-level docs), root configs.
  - [x] For app workflows (`skylar.yml`, future `cms.yml`), list the paths that should trigger them, e.g.:
    - `apps/skylar/**` for Skylar.
    - `apps/cms/**` for CMS.
    - The shared packages each app depends on (from P1.3), so changes to those packages **fan out** to the app workflows as well as root CI.
  - [x] Decide whether to hand-maintain those package path lists or derive them from the workspace graph (e.g. via pnpm filters / Turbo).
    - _Decision: hand-maintained path lists in each workflow._
  - [x] Add a contributor note (in `docs/development.md` or app-level `AGENTS.md`) reminding devs: when adding a new shared package dependency to an app, update its workflow path filters so CI fan-out stays correct.
  - _All workflows now have explicit path filters: `ci.yml`, `cms.yml`, `skylar.yml`, `cypress.yml`._
- [x] **P2.3 Decide E2E ownership**
  - [x] Decide which E2Es belong in root `ci.yml` (multi-app journeys).
  - [x] Decide which E2Es should move or be duplicated into app workflows (single-app coverage).
  - [x] Decide whether app workflows should ever block the `base-shop` release, or remain independent.
  - [x] Treat root E2Es primarily as **platform smoke tests** (does the platform boot and core cross-app flows work?) and app E2Es as deeper, app-scoped flows.
  - _Completed via [E2E Ownership Consolidation](../../historical/plans/e2e-ownership-consolidation-plan.md) (2026-01-17). Policy: one suite, one owner, one workflow._

> Outcome: we have a clear picture of which workflow runs when, and which checks are "global" vs "app-scoped".

---

## Phase 3 — CMS Deploy Workflow Design

- [x] **P3.1 Define CMS deploy behaviour**
  - [x] Decide that `apps/cms` deploys via `@cloudflare/next-on-pages` (dynamic Next.js app).
    - CMS is a dynamic Next.js app with API routes and non-exported runtime behaviour (`apps/cms/next.config.mjs` explicitly disables `output: "export"`), which matches the `@cloudflare/next-on-pages` pattern already used for `base-shop`. We will deploy CMS via `npx @cloudflare/next-on-pages deploy` from the repo root or `apps/cms`, rather than static `wrangler pages deploy`.
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
  - [ ] Decide how preview URLs are exposed to developers:
    - [ ] Use `wrangler pages deploy` / `@cloudflare/next-on-pages` output to capture the preview URL in a step with an `id`.
    - [ ] Pipe that URL into either a workflow summary or an `actions/github-script` step that posts a PR comment.
    - [ ] Optionally, explore Cloudflare’s GitHub integration if we want first-class PR comment support instead of bespoke scripting.
  - [ ] Map production vs preview environment variables in Cloudflare (for example: preview CMS uses staging services; production CMS uses production services).

> Outcome: we know exactly what the CMS workflow should do, and how it fits Cloudflare.

---

## Phase 4 — New App vs Existing App Strategy

_Phase completed; kept for context._

- New apps and existing apps share a consistent pattern for CI, deployments, and scaffolded workflows (`scripts/src/setup-ci.ts`).

> Outcome: first-time deploys and ongoing updates follow different, explicit playbooks.

---

## Phase 5 — Implementation Steps (High Level)

- [ ] **P5.1 CMS deploy & Cloudflare setup** _(tracked as CI-01 above)_
  - [ ] Run an initial CMS deploy via `.github/workflows/cms.yml` using `workflow_dispatch` and production-like environment variables.
  - [ ] Sanity-check core CMS flows on the deployed URL (`https://cms-9by.pages.dev`).
  - [ ] Complete CMS Cloudflare configuration from Phase 3.3:
    - [ ] Ensure the Cloudflare Pages project for CMS exists and is wired to this repo.
    - [ ] Configure branch behaviour (production = `main`, others = previews).
    - [ ] Add runtime env vars for production and preview, and confirm API tokens have Pages Write + Workers Pages permissions.
    - [ ] Decide how preview URLs are surfaced to developers (workflow summary and/or PR comments).
- [x] **P5.2 CI test performance & “slow lane”**
  - [x] Add a `test:affected` script in `package.json` that runs `CI=true turbo run test --affected`.
  - [x] Update `.github/workflows/ci.yml` to:
    - [x] Ensure `actions/checkout` uses `fetch-depth: 0` so Turbo can compute affected packages.
    - [x] Run `pnpm test:affected` on pull requests and non-`main` branches.
    - [x] Keep full `pnpm test` (all workspaces) on `main`.
  - [x] Update `.github/workflows/test.yml` to:
    - [x] Trigger on `push` to `main`, `workflow_dispatch`, and a nightly `schedule` (currently `0 3 * * *`), not on every pull request.
    - [x] Use the existing workspace matrix primarily for coverage artefacts and deep confidence (the CI “slow lane”).
- [x] **P5.3 Turbo cache strategy & documentation**
  - [x] Enable Turbo caching for `test` tasks in CI by removing `cache: false` from the `test` task in `turbo.json` and scoping its cache with `env: ["CI"]`.
  - [x] Configure cache-related env vars and secrets for relevant workflows.
    - _`TURBO_TOKEN` and `TURBO_TEAM` configured in `.github/actions/setup-repo/action.yml` and passed by all workflows._
  - [x] Verify repeated runs across `ci.yml`, `cms.yml`, and app workflows make effective use of the cache.
  - [ ] Document cache expectations and debugging guidance in `docs/development.md`.
- [x] **P5.4 Document first-deploy flows**
  - [x] For CMS: document using `.github/workflows/cms.yml` via `workflow_dispatch` for the first deploy, and any extra one-time steps (e.g. seeding, migrations, Lighthouse) controlled by inputs/conditions.
    - _Documented in `docs/development.md` (lines 58-66)._
  - [x] For future apps/shops: document how to reuse their app workflows for initial deploys (no separate `*-init.yml` files).
    - _Documented in `docs/development.md` (lines 76-86)._
  - [ ] Add step-by-step first-deploy runbook with troubleshooting guidance.

> Outcome: YAML, Cloudflare config, and CI workflows reflect the strategy; we can start iterating on performance and coverage.

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

## Quick Reference — Responsibilities

- **Root CI (`ci.yml`)**
  - Platform-wide lint/typecheck/test/build.
  - Cross-app E2Es.
  - Deploy `base-shop` Pages project.
- **App workflows (`skylar.yml`, `cms.yml`, `shop-*.yml`)**
  - App-specific lint/typecheck/test/build.
  - App-specific E2Es / a11y checks.
  - Deploy their Cloudflare Pages projects.
  - Trigger on app-local changes **and** on changes to the shared packages they depend on (from P1.3), so shared updates are re-validated in each app.
- **First deploys**
  - Use the same app workflow (`cms.yml`, `skylar.yml`, `shop-*.yml`) via manual `workflow_dispatch` for the initial deploy, with any extra one-off steps gated by inputs/conditions rather than separate workflows.
