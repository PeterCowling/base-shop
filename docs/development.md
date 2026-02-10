Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-09

# Development

## Linting and local checks

- Run lint locally before pushing:

  ```bash
  pnpm lint
  ```

- Pre-commit hooks run staged-scope checks:
  - env-file guard (`pre-commit-check-env.sh`)
  - writer-lock enforcement (`require-writer-lock.sh`)
  - partial-staging guard (`no-partially-staged.js`)
  - staged lint/typecheck (`run-lint-staged.sh`, `typecheck-staged.sh`, `lint-staged-packages.sh`)
  - agent-context validation (`pnpm validate:agent-context`)

- Pre-push uses `scripts/git-hooks/pre-push.sh`:
  - enforces writer lock and push safety
  - validates only the pushed delta via `VALIDATE_RANGE=<range> bash scripts/validate-changes.sh`

## Tests and CI gating

- Prefer CI for most test execution.
- For local testing, always run targeted commands (never unfiltered `pnpm test`):

  ```bash
  pnpm --filter @apps/cms test
  pnpm --filter @apps/skylar test
  ```

- `pnpm test:affected` runs `turbo run test --affected` and is the default integration test strategy.
- Full-matrix/coverage quality runs belong to the nightly/manual lane (`.github/workflows/test.yml`), not the standard integration push loop.

## CI ownership and workflows

- Root CI (`.github/workflows/ci.yml`):
  - change-scoped lint/typecheck (`turbo --affected`)
  - change-scoped tests (`pnpm test:affected`)
  - build and relevant smoke/e2e gates via path filters

- Nightly quality matrix (`.github/workflows/test.yml`):
  - full workspace matrix and coverage artefacts
  - scheduled nightly + manual `workflow_dispatch`

- App workflows:
  - `cms.yml` – CMS lint/test/build/deploy
  - `skylar.yml` – Skylar lint/typecheck/test/build/deploy
  - `cypress.yml` – CMS E2E smoke
  - `storybook.yml` – storybook/chromatic/UI smoke

When adding shared dependencies, update affected workflow `paths` filters so CI fan-out remains correct.

## First deploy vs ongoing updates

- New app:
  - use app workflow `workflow_dispatch` for first deploy after env setup
- Ongoing updates:
  - app-local changes: app workflow
  - shared/platform changes: root CI + relevant gated workflows

## Adding a new app + CI

- Generated shops:
  - scaffold workflow with `pnpm setup-ci <id>`
  - ensure env vars/secrets exist before first deploy

- Other apps:
  - add standard workspace scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`)
  - add app workflow with path filters for app + shared deps
  - add deploy step appropriate to runtime (`wrangler pages deploy` or `next-on-pages`)
  - update root/e2e/storybook filters if shared surfaces change

## Shop smoke tests (Thread D)

- Seed sample shop:
  - `pnpm seed:sample-shop`
- Run smoke locally:
  - `SHOP_ID=<id> SHOP_ENV=dev pnpm test:shop-smoke`
- Optional deploy/launch gate:
  - set `SHOP_SMOKE_ENABLED=1` so deploy/launch records and enforces smoke status

Always prefer:

- app workflows for app-local work
- change-scoped root CI for integration
- nightly matrix for deep coverage/quality passes
