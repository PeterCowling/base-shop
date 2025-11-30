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
- [ ] **P1.4 Audit secrets and environments**
  - [ ] List which secrets are currently repo-wide vs environment-specific (GitHub Environments, Cloudflare project vars).
  - [ ] Identify which secrets are shared across apps vs app-specific (CMS-only, Skylar-only, shop-specific).
  - [ ] Decide where app-specific secrets should live to avoid cross-app leakage (e.g. per-app GitHub Environments, per-project Cloudflare env vars).

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
  - [ ] Clarify **local vs CI gating philosophy**:
    - Locally: fast, high-signal checks (lint, basic typecheck) should run by default or via pre-commit hooks so lint failures rarely reach CI.
    - In CI: treat tests (unit, integration, E2E) as the primary gate, avoiding a requirement for developers to run full suites locally.
- [ ] **P2.2 Draft path filters (conceptual)**
  - [ ] For `ci.yml`, list the paths that **should trigger** full-platform verification, e.g.:
    - `packages/**`, `src/**`, `functions/**`, `tools/**`, `docs/**` (for platform-level docs), root configs.
  - [ ] For app workflows (`skylar.yml`, future `cms.yml`), list the paths that should trigger them, e.g.:
    - `apps/skylar/**` for Skylar.
    - `apps/cms/**` for CMS.
    - The shared packages each app depends on (from P1.3), so changes to those packages **fan out** to the app workflows as well as root CI.
  - [ ] Decide whether to hand-maintain those package path lists or derive them from the workspace graph (e.g. via pnpm filters / Turbo).
  - [ ] Add a contributor note (in `docs/development.md` or app-level `AGENTS.md`) reminding devs: when adding a new shared package dependency to an app, update its workflow path filters so CI fan-out stays correct.
- [ ] **P2.3 Decide E2E ownership**
  - [ ] Decide which E2Es belong in root `ci.yml` (multi-app journeys).
  - [ ] Decide which E2Es should move or be duplicated into app workflows (single-app coverage).
  - [ ] Decide whether app workflows should ever block the `base-shop` release, or remain independent.
  - [ ] Treat root E2Es primarily as **platform smoke tests** (does the platform boot and core cross-app flows work?) and app E2Es as deeper, app-scoped flows.

> Outcome: we have a clear picture of which workflow runs when, and which checks are “global” vs “app-scoped”.

---

## Phase 3 — CMS Deploy Workflow Design

- [ ] **P3.1 Define CMS deploy behaviour**
  - [ ] Decide that `apps/cms` deploys via `@cloudflare/next-on-pages` (dynamic Next.js app).
  - [ ] Confirm required production env vars for CMS (auth, Sanity, email, etc.).
  - [ ] Decide which checks are mandatory before deploy:
    - Build CMS and its dependencies using a **filtered build** rather than a global `pnpm -r build` in this app-only workflow (e.g. with pnpm filters / Turbo’s dependency graph).
    - `pnpm --filter @apps/cms lint`.
    - `pnpm --filter @apps/cms test`.
    - Optional: `pnpm --filter @apps/cms typecheck`.
- [ ] **P3.2 Define CMS workflow triggers**
  - [ ] Trigger on `push` for:
    - `main` branch.
    - Path filters matching `apps/cms/**` and the shared packages CMS depends on (from P1.3), so shared changes re-validate CMS.
  - [ ] Add `workflow_dispatch` for manual “Deploy CMS” runs.
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

- [ ] **P4.1 Define “new app first-deploy” pattern**
  - [ ] Specify that a **new app** (e.g. CMS, future shops) uses its **normal app workflow** for the first deploy:
    - Triggered manually via `workflow_dispatch` for the first run.
    - Optionally enabling extra one-off steps (e.g. seeding, Lighthouse, a11y sweeps) guarded by inputs/conditions rather than a separate workflow file.
  - [ ] Document any one-time infrastructure tasks (Cloudflare project creation, DNS, etc.) outside of YAML or as clearly marked conditional steps in the app workflow.
- [ ] **P4.2 Define “existing app update” pattern**
  - [ ] Specify that updates to an already-initialised app:
    - Run only app-specific workflows (`skylar.yml`, `cms.yml`, shop workflows) when changes are app-local.
    - Trigger root `ci.yml` when shared paths change (from Phase 2 filters).
    - Ensure that changes to shared packages **fan out** to both root `ci.yml` and the app workflows that depend on those packages (from P1.3/P2.2), so apps are verified against updated packages.
  - [ ] Decide whether app deployments may proceed when root CI fails on unrelated paths.
- [ ] **P4.3 Template this into tooling**
  - [ ] Extend or document `dist-scripts/setup-ci.js` so that new apps can generate:
    - An app-scoped workflow `<app>.yml` with both push triggers and a manual `workflow_dispatch` entry (including optional “first deploy” inputs/flags).
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
- [ ] **P5.4 Document first-deploy flows**
  - [ ] For CMS: document using `.github/workflows/cms.yml` via `workflow_dispatch` for the first deploy, and any extra one-time steps (e.g. seeding, migrations, Lighthouse) controlled by inputs/conditions.
  - [ ] For future apps/shops: document how to reuse their app workflows for initial deploys (no separate `*-init.yml` files).
  - [ ] Verify Turbo caching is effective across workflows:
    - [ ] Confirm that Turbo’s cache is enabled in CI and that repeated builds (e.g. root `ci.yml` + `cms.yml` on the same commit) are mostly cache hits rather than full rebuilds.
    - [ ] If remote cache is introduced later, document how to configure it (e.g. TURBO_TOKEN / remote URL) so fan-out doesn’t multiply build time.

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
  - Trigger on app-local changes **and** on changes to the shared packages they depend on (from P1.3), so shared updates are re-validated in each app.
- **First deploys**
  - Use the same app workflow (`cms.yml`, `skylar.yml`, `shop-*.yml`) via manual `workflow_dispatch` for the initial deploy, with any extra one-off steps gated by inputs/conditions rather than separate workflows.
