# Cypress E2E Setup

This repo uses Cypress for end‑to‑end and a11y testing. Tests live under `cypress/e2e` and `test/e2e/__tests__`, with a single shared configuration and support layer.

## Layout

- Config: `cypress.config.ts:1`
- Support hooks: `cypress/support/index.ts:1`
- TypeScript config: `cypress/tsconfig.json:1`
- E2E specs (new): `cypress/e2e/**/*.cy.ts`
- Legacy/compat specs: `test/e2e/__tests__/**/*.spec.ts`
- Shared MSW handlers: `test/msw/shared.ts:1`

## Run Commands

- `pnpm e2e` — builds `@apps/cms`, seeds test data, starts the app on port 3006, then runs all Cypress specs headlessly.
- `pnpm e2e:open` — same as above, but opens the Cypress runner UI.
- `pnpm e2e:dashboard` — runs a focused subset of CMS flows.
- `pnpm e2e:shop` — builds and serves `@apps/shop-bcd` on port 3004 and runs shop flows.
- `pnpm test:e2e` — convenience wrapper that runs `e2e:dashboard` then `e2e:shop`.
- Dev server variant (useful for debugging): `pnpm e2e:cms` starts `next dev` on port 3010 and runs a single spec against it. Note the `env -u ELECTRON_RUN_AS_NODE` in this script avoids a known Electron/Next dev interaction.
- CMS functional flows (using isolated DATA_ROOT): `pnpm e2e:cms:functional` runs functional CMS specs against a temporary data root so file assertions use the same directory the app writes to.
- Coverage run (client+server): `pnpm e2e:coverage` builds/starts with `COVERAGE=1`, instruments client bundles and collects server route coverage via `/api/__coverage__`.
- Lighthouse only: `pnpm e2e:lh` runs the LH‑tagged specs (`grepTags=lh`) on Chrome, desktop viewport.

All of the above rely on `start-server-and-test` to boot the app and wait until the target port responds before executing `cypress run`.

Scripts are defined in `package.json:34-39`.

## Config Highlights

See `cypress.config.ts:7`.

- `baseUrl` — defaults to `http://localhost:3006`. Override via `CYPRESS_BASE_URL`.
  - `cypress.config.ts:9`
- `specPattern` — runs both styles of tests: `cypress/e2e/**/*.cy.{js,ts}` and `test/e2e/**/*.spec.{js,ts}`.
  - `cypress.config.ts:11-14`
- `supportFile` — global hooks and utilities.
  - `cypress.config.ts:16`
- `env` — exposes:
  - `NEXTAUTH_SECRET` for tests that mint session tokens when simulating roles.
    - `cypress.config.ts:18-21`
  - `TEST_DATA_ROOT` default pointing at `__tests__/data/shops`.
    - `cypress.config.ts:22`
- Timeouts — `defaultCommandTimeout: 10000`.
  - `cypress.config.ts:24`
- Custom tasks — simple `log` plus ephemeral test data helpers `testData:setup`/`testData:cleanup`.
  - `cypress.config.ts:28-34`
  - `cypress.config.ts:35-49`
  - `cypress.config.ts:51-58`

## Global Support

`cypress/support/index.ts:1` wires a few global behaviors:

- a11y helpers: imports `cypress-axe`.
  - `cypress/support/index.ts:3`
- Network mocking: starts a Node MSW server using shared defaults in `test/msw/shared.ts`.
  - `cypress/support/index.ts:5`, `:13-15`
- Error handling: prevents app‐originated uncaught exceptions from failing tests.
  - `cypress/support/index.ts:7-11`
- Auth helper: `cy.loginAsAdmin()` signs in via credentials and can be cached with `cy.session`.
  - `cypress/support/index.ts:22,171`

See also MSW details in docs/testing-with-msw.md.

## Test Data

- Root fixtures: `__tests__/data/shops/<shop>/{pages.json,settings.json,products.json,...}`.
- Before running tests, scripts seed fixtures into `TEST_DATA_ROOT` via `scripts/src/seed-test-data.ts:1`.
- Some specs create an isolated, temporary data root at runtime:
  - `cy.task("testData:setup", shop)` creates a temp directory under the system tmp folder, copies minimal files (`pages.json`, `settings.json`), and returns the path.
  - `cypress.config.ts:39-49`
  - The spec can then write extra files (e.g., `products.json`) and set `Cypress.env("TEST_DATA_ROOT", dir)` for the process under test to read.
    - Example: `cypress/e2e/cms-i18n.cy.ts:19-33, 44-50`
  - Clean up with `cy.task("testData:cleanup")`.
    - `cypress.config.ts:51-58`
- The `pnpm e2e:cms:functional` command also isolates `DATA_ROOT` for Next and passes the same root to Cypress via `TEST_DATA_ROOT`, so assertions that read `settings.json`/`settings.history.jsonl` match the app’s writes.

## Authentication

Two common patterns are used in specs:

- Full credentials flow via `next-auth` credentials provider (requests `/api/auth/callback/credentials`).
  - Example: `test/e2e/__tests__/cms-access.spec.ts:10-23, 33-46`
- Direct cookie minting for role simulation using the configured `NEXTAUTH_SECRET`.
  - Example helper that signs a JWT and sets `next-auth.session-token`: `cypress/e2e/cms-middleware.cy.ts:7-16, 37-49`.

## Accessibility Testing

- `cypress-axe` is loaded globally. Typical usage in specs:
  - `cy.injectAxe(); cy.checkA11y();`
  - Example: `cypress/e2e/checkout-flow-a11y.cy.ts:20-23`
- For contrast‑only runs or debug logging, some specs invoke Axe directly and surface violations via `cy.task('log', ...)`.
  - Example: `cypress/e2e/cms-themes-a11y-debug.cy.ts:24-45`

## Keyboard Navigation

- `cypress-plugin-tab` is installed and imported in specs that validate focus order and tab stops.
  - Example: `cypress/e2e/checkout-flow-a11y.cy.ts:36-38`

## Network Mocking

- MSW default handlers cover common CMS endpoints and intentionally pass through cart and API route calls.
  - Defaults: `test/msw/shared.ts:12-63, 70-87`
- You can add test‑specific overrides with `server.use(...)` from `~test/msw/server`.
- Specs may also use `cy.intercept` where convenient.
  - Example: `cypress/e2e/checkout-flow-a11y.cy.ts:6-9`

## TypeScript

- Cypress TS config includes both spec locations and pulls in `cypress` + `node` types.
  - `cypress/tsconfig.json:4-8`
- The `~test/*` path alias maps to `test/*` (configured in `tsconfig.base.json`), enabling short imports like `~test/msw/server`.

## Tips

- Base URL: If your app runs on a different port, set `CYPRESS_BASE_URL` (or use the `e2e:shop`/`e2e:cms` scripts which set it for you).
- Headed debugging: `pnpm e2e:open`.
- Screenshots/videos: standard Cypress defaults apply; failures are captured under `cypress/screenshots`.
- Prevent flaky network: prefer MSW (`server.use`) or `cy.intercept` over live requests.

## CMS Functional Examples

- Shop Editor (name/theme/luxury flags): `cypress/e2e/cms-shop-editor-functional.cy.ts:1`
- Currency & tax: `cypress/e2e/cms-currency-tax-functional.cy.ts:1`
- Deposits: `cypress/e2e/cms-deposits-functional.cy.ts:1`
- Returns: `cypress/e2e/cms-returns-functional.cy.ts:1`
- Reverse logistics: `cypress/e2e/cms-reverse-logistics-functional.cy.ts:1`
- Late fees: `cypress/e2e/cms-late-fees-functional.cy.ts:1`
- Premier delivery: `cypress/e2e/cms-premier-delivery-functional.cy.ts:1`
- SEO save: `cypress/e2e/cms-seo-functional.cy.ts:1`
- SEO freeze translations: `cypress/e2e/cms-seo-freeze-functional.cy.ts:1`
- SEO warnings (length): `cypress/e2e/cms-seo-warnings-functional.cy.ts:1`
- SEO locales (freeze off): `cypress/e2e/cms-seo-locales-functional.cy.ts:1`
- SEO generate (stubbed): `cypress/e2e/cms-seo-generate-functional.cy.ts:1`
- SEO audit panel (stubbed): `cypress/e2e/cms-seo-audit-functional.cy.ts:1`
- Overrides duplicate resolution: `cypress/e2e/cms-overrides-duplicate-functional.cy.ts:1`
- Theme reset (multiple): `cypress/e2e/cms-theme-reset-multi-functional.cy.ts:1`
- Live previews list: `cypress/e2e/cms-live-previews-functional.cy.ts:1`
- Edit Preview page: `cypress/e2e/cms-edit-preview-functional.cy.ts:1`
- Configurator dashboard + Shop Details: `cypress/e2e/cms-configurator-functional.cy.ts:1`
- Configurator launch (SSE stub): `cypress/e2e/cms-configurator-launch-functional.cy.ts:1`
- Configurator Theme step: `cypress/e2e/cms-configurator-theme-functional.cy.ts:1`
- Configurator Home Page step: `cypress/e2e/cms-configurator-homepage-functional.cy.ts:1`
- Configurator Tokens step: `cypress/e2e/cms-configurator-tokens-functional.cy.ts:1`
- AI Catalog: `cypress/e2e/cms-ai-catalog-functional.cy.ts:1`
- Theme override reset: `cypress/e2e/cms-theme-reset-functional.cy.ts:1`
- RBAC (viewer): `cypress/e2e/cms-rbac-viewer-functional.cy.ts:1`
- Stock scheduler (toast only): `cypress/e2e/cms-stock-scheduler-functional.cy.ts:1`
- Providers (tracking): `cypress/e2e/cms-providers-functional.cy.ts:1`
- Overrides + localization: `cypress/e2e/cms-overrides-functional.cy.ts:1`
- Maintenance scan (toast only): `cypress/e2e/cms-maintenance-scan-functional.cy.ts:1`
- Overrides validation (negative): `cypress/e2e/cms-overrides-validation-functional.cy.ts:1`
- Overview reflects settings: `cypress/e2e/cms-overview-readonly-functional.cy.ts:1`
- Stock alerts validation: `cypress/e2e/cms-stock-alerts-validation-functional.cy.ts:1`
  - When `COVERAGE=1`, `after:run` fetches server coverage and writes `.nyc_output/server.coverage.json` for merging.
