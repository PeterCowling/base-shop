## CI & Deploy Roadmap — Apps vs Platform

This document tracks the plan to:

- Add a Cloudflare Pages deployment for `apps/cms`.
- Make CI more precise for app-only changes.
- Treat **new apps** differently from **updates** to existing apps.

Use the checkboxes as a living status board as changes land.

---

## Phase 1 — Clarify Current State

- [x] **P1.1 Document existing workflows**
  - [x] Summarise what `.github/workflows/ci.yml` does (verify + release of `base-shop`).
    - `ci.yml` runs on every push. It installs dependencies, builds the ESLint plugin, runs monorepo-wide lint (including exceptions governance), typecheck, unit tests, and a full `pnpm build`, plus selected E2E suites (`pnpm e2e:dashboard`, `pnpm e2e:shop`). On `main`, it then deploys the `base-shop` Cloudflare Pages project via `@cloudflare/next-on-pages`.
  - [x] Summarise what `.github/workflows/skylar.yml` does (Skylar-only CI + deploy).
    - `skylar.yml` runs on pushes to `main` and manual dispatch. It installs deps, runs `pnpm -r build`, then lints, typechecks, tests, and builds `@apps/skylar`, and finally deploys the pre-exported static output from `apps/skylar/out` to the `skylar` Cloudflare Pages project via `wrangler pages deploy`.
  - [x] List any generated shop workflows (from `dist-scripts/setup-ci.js`) that are in use.
    - `dist-scripts/setup-ci.js` can generate `shop-<id>.yml` workflows, but there are currently no `shop-*.yml` files under `.github/workflows`, so no generated shop workflows are active.
- [x] **P1.2 Map Cloudflare projects**
  - [x] Confirm current Cloudflare Pages projects:
    - [x] `base-shop` (from `.github/workflows/ci.yml`).
    - [x] `skylar` (from `.github/workflows/skylar.yml` / `apps/skylar/AGENTS.md`).
  - [x] Decide the Pages project name and domain for CMS (e.g. `cms`, `skylar-cms`).
    - CMS Pages project name: `cms`.
    - Domain: use the default Cloudflare-assigned `cms` Pages URL for now (custom domain can be layered on later).
- [x] **P1.3 Identify app-to-package dependencies**
  - [x] For `apps/skylar`, list critical workspace packages it relies on.
    - Direct workspace deps: `@acme/config`, `@acme/i18n`, `@acme/next-config`, `@acme/tailwind-config`.
    - Through `@acme/next-config`, Skylar also depends on core platform packages such as `@acme/ui`, `@acme/platform-core`, `@acme/shared-utils`, theme packages, and config packages wired via the shared Next config.
  - [x] For `apps/cms`, list critical workspace packages it relies on.
    - Direct workspace deps: `@acme/configurator`, `@acme/config`, `@acme/date-utils`, `@acme/email`, `@acme/email-templates`, `@acme/i18n`, `@acme/next-config`, `@acme/plugin-sanity`, `@acme/shared-utils`, `@acme/theme`, `@acme/telemetry`, `@acme/zod-utils`, `@themes/base`.
    - Via its custom `next.config.mjs`, CMS also depends on `@acme/ui`, `@acme/platform-core`, `@acme/tailwind-config`, `@acme/types`, and the shared themes in `packages/themes`.
  - [x] For shops and other apps, note any packages that are “shared across many apps”.
    - Shared across multiple apps: `@acme/config`, `@acme/i18n`, `@acme/next-config`, `@acme/ui`, `@acme/shared-utils`, `@acme/platform-core`, `@acme/tailwind-config`, theme packages under `packages/themes`, and `@acme/types`. Changes to these should generally be treated as platform-affecting.
- [x] **P1.4 Audit secrets and environments**
  - [x] List which secrets are currently repo-wide vs environment-specific (GitHub Environments, Cloudflare project vars).
    - GitHub Actions secrets used in workflows include `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (for Skylar and base-shop deploys), `CHROMATIC_PROJECT_TOKEN` (for Storybook/Chromatic), and Lighthouse credentials (`LHCI_USERNAME`, `LHCI_PASSWORD`) for `ci-lighthouse.yml`.
    - Cloudflare Pages project-level env vars (for `base-shop` and `skylar`) are not tracked in the repo, but we rely on them for runtime configuration; CMS will need its own project vars.
  - [x] Identify which secrets are shared across apps vs app-specific (CMS-only, Skylar-only, shop-specific).
    - `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` are shared infra secrets used by both base-shop and Skylar deploy workflows.
    - `CHROMATIC_PROJECT_TOKEN` is Storybook/Chromatic-specific.
    - `LHCI_USERNAME` / `LHCI_PASSWORD` are Lighthouse-only.
    - CMS-specific secrets (Sanity, email, auth) are currently baked into dev defaults in `apps/cms/next.config.mjs` but must be set as real values in production Cloudflare env vars.
  - [x] Decide where app-specific secrets should live to avoid cross-app leakage (e.g. per-app GitHub Environments, per-project Cloudflare env vars).
    - Infra-level deploy credentials (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) remain GitHub repository secrets, shared by workflows that deploy Pages projects.
    - Runtime app secrets (for example: `CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`, `SANITY_*`, `NEXTAUTH_SECRET`, `SESSION_SECRET`, `EMAIL_PROVIDER`, provider API keys) live in per-project Cloudflare Pages environment variables for each app (base-shop, skylar, cms), not as GitHub secrets.
    - Storybook/Chromatic remains an example of a shared CI-only secret (`CHROMATIC_PROJECT_TOKEN`) that is not exposed to app runtimes.

> Outcome: we know which workflows exist, which Cloudflare projects they target, and which packages are “shared enough” that changing them should still trigger full-platform CI.

---

## Phase 2 — Design Path-Based CI Precision

- [x] **P2.1 Decide CI ownership boundaries**
  - [x] Define what the **root CI** (`ci.yml`) is responsible for:
    - Lint/typecheck/test/build of the **shared platform** (packages, core tools).
    - Cross-app E2Es (e.g. dashboard + shop flows).
    - Release of the `base-shop` Cloudflare project.
  - [x] Define what **app workflows** own:
    - App-local lint / typecheck / tests / build (`skylar.yml`, `cms.yml`, shop workflows).
    - Deployments to their own Pages projects.
    - Any app-specific E2E or a11y suites (`cypress.yml` for CMS, Storybook workflows for UI).
  - [x] Clarify **local vs CI gating philosophy**:
    - Locally: fast, high-signal checks (lint, basic typecheck) should run by default or via pre-commit hooks so lint failures rarely reach CI.
    - In CI: treat tests (unit, integration, E2E) as the primary gate, avoiding a requirement for developers to run full suites locally.
- [x] **P2.2 Draft path filters (conceptual)**
  - [x] For `ci.yml`, list the paths that **should trigger** full-platform verification, e.g.:
    - Implemented via `paths-ignore` that excludes `apps/skylar/**` and `apps/cms/**` (app-only changes) while still running on shared/platform paths.
  - [x] For app workflows (`skylar.yml`, `cms.yml`), list the paths that should trigger them:
    - Implemented via `paths` filters in each workflow for their app directories plus their key shared dependencies under `packages/**`.
  - [x] Decide whether to hand-maintain those package path lists or derive them from the workspace graph (e.g. via pnpm filters / Turbo).
    - Current approach: hand-maintained path lists based on package.json and `next.config` deps; revisit for tooling support in Phase 6.
  - [ ] Add a contributor note (in `docs/development.md` or app-level `AGENTS.md`) reminding devs: when adding a new shared package dependency to an app, update its workflow path filters so CI fan-out stays correct.
- [x] **P2.3 Decide E2E ownership**
  - [x] Decide which E2Es belong in root `ci.yml` (multi-app journeys).
    - `ci.yml` runs `pnpm e2e:dashboard` and `pnpm e2e:shop` as cross-app smoke tests, gated by `dorny/paths-filter` on relevant paths.
  - [x] Decide which E2Es should move or be duplicated into app workflows (single-app coverage).
    - `cypress.yml` covers CMS E2E smoke; app workflows cover unit/integration tests.
  - [x] Decide whether app workflows should ever block the `base-shop` release, or remain independent.
    - Current model: app workflows are independent; root `ci.yml` guards platform releases.
  - [x] Treat root E2Es primarily as **platform smoke tests** (does the platform boot and core cross-app flows work?) and app E2Es as deeper, app-scoped flows.

> Outcome: we have a clear picture of which workflow runs when, and which checks are “global” vs “app-scoped”.

---

## Phase 3 — CMS Deploy Workflow Design

- [ ] **P3.1 Define CMS deploy behaviour**
  - [x] Decide that `apps/cms` deploys via `@cloudflare/next-on-pages` (dynamic Next.js app).
    - CMS is a dynamic Next.js app with API routes and non-exported runtime behaviour (`apps/cms/next.config.mjs` explicitly disables `output: "export"`), which matches the `@cloudflare/next-on-pages` pattern already used for `base-shop`. We will deploy CMS via `npx @cloudflare/next-on-pages deploy` from the repo root or `apps/cms`, rather than static `wrangler pages deploy`.
  - [x] Confirm required production env vars for CMS (auth, Sanity, email, etc.).
    - Core URLs: `NEXTAUTH_URL` and `CMS_BASE_URL` set to the stable CMS production domain (`https://cms-9by.pages.dev`).
    - Auth/session: `NEXTAUTH_SECRET`, `SESSION_SECRET`, `CART_COOKIE_SECRET`.
    - CMS/API linkage: `CMS_SPACE_URL` (currently pointing at `https://cms-9by.pages.dev` as a placeholder API host) and `CMS_ACCESS_TOKEN` (shared secret for schema pushes).
    - Sanity (stubbed for now): `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_API_VERSION`, `SANITY_PREVIEW_SECRET` all set to safe dummy values.
    - Email: `EMAIL_PROVIDER` set to `noop` until a real provider is configured.
  - [ ] Decide which checks are mandatory before deploy:
    - Build CMS and its dependencies using a **filtered build** rather than a global `pnpm -r build` in this app-only workflow (e.g. with pnpm filters / Turbo’s dependency graph).
    - `pnpm --filter @apps/cms lint`.
    - `pnpm --filter @apps/cms test`.
    - Optional: `pnpm --filter @apps/cms typecheck`.
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
  - [x] Add `.github/workflows/cms.yml` based on the design from Phase 3.
  - [x] Wire in Cloudflare secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`).
  - [ ] Run an initial CMS deploy via a manual workflow dispatch using the configured environment variables.
  - [ ] Sanity-check core CMS flows on the deployed URL (`https://cms-9by.pages.dev`).
- [ ] **P5.2 Refine Skylar workflow**
  - [x] Review `.github/workflows/skylar.yml` for alignment with `apps/skylar/AGENTS.md`:
    - Confirmed we are intentionally keeping Skylar as a static export deployed via `wrangler pages deploy` (no `@cloudflare/next-on-pages`), and updated `apps/skylar/AGENTS.md` to match.
    - Ensured it only runs Skylar-relevant checks and uses path filters for Skylar and its shared dependencies.
  - [x] Add path filters so it triggers on Skylar changes.
- [ ] **P5.3 Tighten root `ci.yml`**
  - [x] Add `paths` / `paths-ignore` so `ci.yml`:
    - [x] Runs for shared/platform changes.
    - [x] Skips app-only changes (`apps/skylar/**`, `apps/cms/**`) that are covered by dedicated app workflows.
  - [x] Gate the heaviest steps (e.g. E2Es) behind additional path or conditional checks:
    - [x] Use `dorny/paths-filter` in `ci.yml` to detect changes affecting dashboard (`apps/dashboard/**`, core UI/theme packages) and shop flows (`apps/shop-bcd/**`, `apps/cms/**`, key platform packages).
    - [x] Run `pnpm e2e:dashboard` only when dashboard-related paths change.
    - [x] Run `pnpm e2e:shop` only when shop/CMS/platform paths that affect the shop flows change.
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
