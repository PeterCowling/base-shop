## CI & Deploy Roadmap — Apps vs Platform

This document tracks the plan to:

- Add a Cloudflare Pages deployment for `apps/cms`.
- Make CI more precise for app-only changes.
- Treat **new apps** differently from **updates** to existing apps.

Use the checkboxes as a living status board as changes land.

---

## Phase 1 — Clarify Current State

- [ ] **P1.1 Document existing workflows**
  - [ ] Summarise what `.github/workflows/ci.yml` does (verify + release of `base-shop`).
  - [ ] Summarise what `.github/workflows/skylar.yml` does (Skylar-only CI + deploy).
  - [ ] List any generated shop workflows (from `dist-scripts/setup-ci.js`) that are in use.
- [ ] **P1.2 Map Cloudflare projects**
  - [ ] Confirm current Cloudflare Pages projects:
    - [ ] `base-shop` (from `.github/workflows/ci.yml`).
    - [ ] `skylar` (from `.github/workflows/skylar.yml` / `apps/skylar/AGENTS.md`).
  - [ ] Decide the Pages project name and domain for CMS (e.g. `cms`, `skylar-cms`).
- [ ] **P1.3 Identify app-to-package dependencies**
  - [ ] For `apps/skylar`, list critical workspace packages it relies on.
  - [ ] For `apps/cms`, list critical workspace packages it relies on.
  - [ ] For shops and other apps, note any packages that are “shared across many apps”.

> Outcome: we know which workflows exist, which Cloudflare projects they target, and which packages are “shared enough” that changing them should still trigger full-platform CI.

---

## Phase 2 — Design Path-Based CI Precision

- [ ] **P2.1 Decide CI ownership boundaries**
  - [ ] Define what the **root CI** (`ci.yml`) is responsible for:
    - Lint/typecheck/test/build of the **shared platform** (packages, core tools).
    - Cross-app E2Es (e.g. dashboard + shop flows).
    - Release of the `base-shop` Cloudflare project.
  - [ ] Define what **app workflows** own:
    - App-local lint / typecheck / tests / build.
    - Deployments to their own Pages projects.
    - Any app-specific E2E or a11y suites.
- [ ] **P2.2 Draft path filters (conceptual)**
  - [ ] For `ci.yml`, list the paths that **should trigger** full-platform verification, e.g.:
    - `packages/**`, `src/**`, `functions/**`, `tools/**`, `docs/**` (for platform-level docs), root configs.
  - [ ] For app workflows (`skylar.yml`, future `cms.yml`), list the paths that should trigger them, e.g.:
    - `apps/skylar/**` for Skylar.
    - `apps/cms/**` for CMS.
    - Potentially a small set of app-specific packages, if any.
- [ ] **P2.3 Decide E2E ownership**
  - [ ] Decide which E2Es belong in root `ci.yml` (multi-app journeys).
  - [ ] Decide which E2Es should move or be duplicated into app workflows (single-app coverage).
  - [ ] Decide whether app workflows should ever block the `base-shop` release, or remain independent.

> Outcome: we have a clear picture of which workflow runs when, and which checks are “global” vs “app-scoped”.

---

## Phase 3 — CMS Deploy Workflow Design

- [ ] **P3.1 Define CMS deploy behaviour**
  - [ ] Decide that `apps/cms` deploys via `@cloudflare/next-on-pages` (dynamic Next.js app).
  - [ ] Confirm required production env vars for CMS (auth, Sanity, email, etc.).
  - [ ] Decide which checks are mandatory before deploy:
    - `pnpm -r build` for workspace packages.
    - `pnpm --filter @apps/cms lint`.
    - `pnpm --filter @apps/cms test`.
    - Optional: `pnpm --filter @apps/cms typecheck`.
- [ ] **P3.2 Define CMS workflow triggers**
  - [ ] Trigger on `push` for:
    - `main` branch.
    - Path filters matching `apps/cms/**` (and any CMS-only packages).
  - [ ] Add `workflow_dispatch` for manual “Deploy CMS” runs.
- [ ] **P3.3 Define CMS Cloudflare configuration**
  - [ ] Create the Cloudflare Pages project for CMS.
  - [ ] Configure branch behaviour (production = `main`, others = previews).
  - [ ] Add runtime env vars to the Pages project.
  - [ ] Confirm or create a Cloudflare API token with Pages Write + Workers Pages permissions.

> Outcome: we know exactly what the CMS workflow should do, and how it fits Cloudflare.

---

## Phase 4 — New App vs Existing App Strategy

- [ ] **P4.1 Define “new app init” pattern**
  - [ ] Specify that a **new app** (e.g. CMS, future shops) uses a one-off “init” workflow:
    - Manual-only (`workflow_dispatch`).
    - Runs full-platform CI (root `ci.yml`-equivalent checks).
    - Runs app-specific tests and build.
    - Performs the first deploy to its Pages project.
  - [ ] Decide what extra checks belong only in init (e.g. Lighthouse, extended a11y).
- [ ] **P4.2 Define “existing app update” pattern**
  - [ ] Specify that updates to an already-initialised app:
    - Run only app-specific workflows (`skylar.yml`, `cms.yml`, shop workflows) when changes are app-local.
    - Trigger root `ci.yml` only when shared paths change (from Phase 2 filters).
  - [ ] Decide whether app deployments may proceed when root CI fails on unrelated paths.
- [ ] **P4.3 Template this into tooling**
  - [ ] Extend or document `dist-scripts/setup-ci.js` so that new apps can generate:
    - An app-scoped workflow `<app>.yml`.
    - (Optionally) a `<app>-init.yml` for the first deploy.
  - [ ] Capture this pattern in `docs/development.md` or a dedicated CI guide.

> Outcome: first-time deploys and ongoing updates follow different, explicit playbooks.

---

## Phase 5 — Implementation Steps (High Level)

- [ ] **P5.1 Implement CMS workflow**
  - [ ] Add `.github/workflows/cms.yml` based on the design from Phase 3.
  - [ ] Wire in Cloudflare secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`).
  - [ ] Run an initial CMS deploy via a manual workflow dispatch.
  - [ ] Sanity-check core CMS flows on the deployed URL.
- [ ] **P5.2 Refine Skylar workflow**
  - [ ] Review `.github/workflows/skylar.yml` for alignment with `apps/skylar/AGENTS.md`:
    - Consider switching to `@cloudflare/next-on-pages` to match the documented pattern.
    - Ensure it only runs Skylar-relevant checks.
  - [ ] Add path filters so it triggers on Skylar changes.
- [ ] **P5.3 Tighten root `ci.yml`**
  - [ ] Add `paths` / `paths-ignore` so `ci.yml`:
    - Runs for shared/platform changes.
    - Skips app-only changes that are covered by app workflows.
  - [ ] Gate the heaviest steps (e.g. E2Es) behind additional path or conditional checks if needed.
- [ ] **P5.4 Introduce (or document) “init” workflows**
  - [ ] For CMS: optionally add `cms-init.yml` as the one-off, heavy first deploy workflow.
  - [ ] For future apps/shops: document how to generate or add their init workflows.

> Outcome: YAML and Cloudflare config reflect the strategy; we can start iterating on performance and coverage.

---

## Phase 6 — Feedback and Iteration

- [ ] **P6.1 Measure CI impact**
  - [ ] Track average runtime of:
    - Root `ci.yml` before vs after path filters.
    - `skylar.yml` and `cms.yml` after changes.
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
- **Init workflows (`*-init.yml`, optional)**
  - One-off heavy verification + first deploy for a new app.

