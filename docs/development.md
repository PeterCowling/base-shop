# Development

## Linting and local checks

- Run the repository linter locally before pushing:

  ```bash
  pnpm lint
  ```

- Pre-commit hooks (`simple-git-hooks` + `lint-staged`) already run ESLint on staged files with `--max-warnings=0`, so lint failures should be caught locally rather than in CI.

## Tests and CI gating

- Prefer running tests in CI rather than locally for day-to-day work:
  - Use app- or package-scoped commands when you do need local tests, e.g.:

    ```bash
    pnpm --filter @apps/cms test
    pnpm --filter @apps/skylar test
    ```

- CI workflows (`ci.yml`, app-specific workflows, and the workspace matrix in `test.yml`) are responsible for running the full test suites (unit, integration, E2E) and acting as the main gate for merges and deploys.
- For monorepo-wide tests:
  - `pnpm test` runs `turbo run test` across all workspaces (used on `main` in CI).
  - `pnpm test:affected` runs `turbo run test --affected`, executing tests only in affected workspaces plus their dependents (used on pull requests and non-`main` branches in CI).

## CI ownership and app workflows

- Root CI (`.github/workflows/ci.yml`):
  - Runs platform-wide lint/typecheck/test/build.
  - Uses change-aware tests:
    - On `main`: runs `pnpm test` (full `turbo run test`).
    - On other branches/PRs: runs `pnpm test:affected` (change-scoped `turbo run test --affected`).
  - Runs cross-app E2E smoke tests (`pnpm e2e:dashboard`, `pnpm e2e:shop`) gated by path filters.
  - Deploys the `base-shop` Cloudflare Pages project.
- Workspace CI (`.github/workflows/test.yml`):
  - Builds and tests individual workspaces (packages and apps) using a matrix, excluding CMS and Skylar (which have their own workflows).
  - Runs as a “slow lane” on:
    - `push` to `main` (full workspace matrix with coverage artefacts).
    - Scheduled nightly runs.
    - Manual `workflow_dispatch` when you want an explicit, deep pass.
- App workflows:
  - `cms.yml` – lint/test/build/deploy for `@apps/cms`, triggered by CMS-related changes.
  - `skylar.yml` – lint/typecheck/test/build/deploy for `@apps/skylar` as a static export via `wrangler pages deploy`.
  - `cypress.yml` – CMS E2E smoke runs when CMS or its shared dependencies change.
  - `storybook.yml` – Storybook/Chromatic and UI smoke tests, triggered by Storybook/UI-related changes.

When adding a new shared package dependency to an app, remember to update the relevant workflow `paths` filters so CI fan-out stays correct (for example, ensure the new package path is included in the app’s workflow and, if appropriate, in any E2E or Storybook workflows it affects).

## First deploy vs ongoing updates

- New app (e.g. CMS):
  - Use the app’s own workflow (such as `cms.yml`) with `workflow_dispatch` for the first deploy, after configuring its Cloudflare Pages environment variables.
  - Optionally enable extra one-off steps (seeding, Lighthouse, extended a11y checks) behind workflow inputs or conditions instead of separate `*-init` workflows.
- Existing app updates:
  - Rely on the app’s workflow when changes are app-local (e.g. Skylar-only or CMS-only changes).
  - Let root CI (`ci.yml`) and Workspace CI (`test.yml`) handle shared/platform changes, with path filters ensuring that heavy checks (E2E, Storybook) only run when relevant paths change.

## Adding a new app + CI

When you add a new app, keep CI aligned with the patterns above:

- For generated shops:
  - Use `pnpm setup-ci <id>` to scaffold a `shop-<id>.yml` workflow under `.github/workflows/`.
  - The generated workflow:
    - Installs dependencies and runs `pnpm lint && pnpm test`.
    - Builds `@apps/shop-<id>` and deploys it to Cloudflare Pages via `@cloudflare/next-on-pages`.
  - Make sure the shop’s `.env` and Cloudflare Pages env vars are configured before the first deploy.

- For other apps (e.g. a new dashboard or marketing app):
  - Create a workspace under `apps/<name>` with standard scripts:
    - `dev`, `build`, `start`, `lint`, `typecheck`, `test` (follow existing apps as templates).
  - Add an app workflow `.github/workflows/<name>.yml` that:
    - Runs on `push`/`pull_request` with `paths` filters for `apps/<name>/**` and its shared `packages/**` dependencies.
    - Installs deps, builds any required packages, then runs `pnpm --filter @apps/<name> lint`, `typecheck`, `test`, and `build`.
    - Deploys the app to its own Cloudflare Pages project (using either `wrangler pages deploy` for static exports or `@cloudflare/next-on-pages` for dynamic apps).
  - Update root CI and any E2E/Storybook workflows with path filters if the new app participates in cross-app flows or shares UI components.

Always prefer:

- App workflows for app-local changes and deploys.
- Root/workspace CI for shared/platform changes and cross-app checks.
