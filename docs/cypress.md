# Cypress E2E Setup

This repo uses Cypress for end‑to‑end and a11y testing. Tests live under `apps/cms/cypress/e2e` and `test/e2e/__tests__`, with a single shared configuration and support layer.

Note: The Cypress config lives with the CMS app at `apps/cms/cypress.config.mjs`. The root `cypress.config.ts` re-exports this app config to keep existing scripts working.

## Layout

- Config: `apps/cms/cypress.config.mjs:1` (root `cypress.config.ts` re-exports this)
- Support hooks: `apps/cms/cypress/support/index.ts:1`
- TypeScript config: `apps/cms/cypress/tsconfig.json:1`
- E2E specs (new): `apps/cms/cypress/e2e/**/*.cy.ts`
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

See `apps/cms/cypress.config.mjs:7`.

- `baseUrl` — defaults to `http://localhost:3006`. Override via `CYPRESS_BASE_URL`.
  - `apps/cms/cypress.config.mjs:9`
- `specPattern` — runs both styles of tests: `apps/cms/cypress/e2e/**/*.cy.{js,ts}` and `test/e2e/**/*.spec.{js,ts}`.
  - `apps/cms/cypress.config.mjs:11-16`
- `supportFile` — global hooks and utilities.
  - `apps/cms/cypress.config.mjs:16`
- `env` — exposes:
  - `NEXTAUTH_SECRET` for tests that mint session tokens when simulating roles.
    - `apps/cms/cypress.config.mjs:18-21`
  - `TEST_DATA_ROOT` default pointing at `__tests__/data/shops`.
    - `apps/cms/cypress.config.mjs:22`
- Timeouts — `defaultCommandTimeout: 10000`.
  - `apps/cms/cypress.config.mjs:24`
- Custom tasks — simple `log` plus ephemeral test data helpers `testData:setup`/`testData:cleanup`.
  - `apps/cms/cypress.config.mjs:28-34`
  - `apps/cms/cypress.config.mjs:35-49`
  - `apps/cms/cypress.config.mjs:51-58`

## Global Support

`apps/cms/cypress/support/index.ts:1` wires a few global behaviors:

- a11y helpers: imports `cypress-axe`.
  - `apps/cms/cypress/support/index.ts:3`
- Network mocking: starts a Node MSW server using shared defaults in `test/msw/shared.ts`.
  - `apps/cms/cypress/support/index.ts:5`, `:13-15`
- Error handling: prevents app‐originated uncaught exceptions from failing tests.
  - `apps/cms/cypress/support/index.ts:7-11`
- Auth helper: `cy.loginAsAdmin()` signs in via credentials and can be cached with `cy.session`.
  - `apps/cms/cypress/support/index.ts:22,171`

See also MSW details in docs/testing-with-msw.md.

## Test Data

- Root fixtures: `__tests__/data/shops/<shop>/{pages.json,settings.json,products.json,...}`.
- Before running tests, scripts seed fixtures into `TEST_DATA_ROOT` via `scripts/src/seed-test-data.ts:1`.
- Some specs create an isolated, temporary data root at runtime:
  - `cy.task("testData:setup", shop)` creates a temp directory under the system tmp folder, copies minimal files (`pages.json`, `settings.json`), and returns the path.
  - `apps/cms/cypress.config.mjs:39-49`
  - The spec can then write extra files (e.g., `products.json`) and set `Cypress.env("TEST_DATA_ROOT", dir)` for the process under test to read.
    - Example: `apps/cms/cypress/e2e/cms-i18n.cy.ts:19-33, 44-50`
  - Clean up with `cy.task("testData:cleanup")`.
  - `apps/cms/cypress.config.mjs:51-58`
- The `pnpm e2e:cms:functional` command also isolates `DATA_ROOT` for Next and passes the same root to Cypress via `TEST_DATA_ROOT`, so assertions that read `settings.json`/`settings.history.jsonl` match the app’s writes.

## Authentication

Two common patterns are used in specs:

- Full credentials flow via `next-auth` credentials provider (requests `/api/auth/callback/credentials`).
  - Example: `test/e2e/__tests__/cms-access.spec.ts:10-23, 33-46`
- Direct cookie minting for role simulation using the configured `NEXTAUTH_SECRET`.
  - Example helper that signs a JWT and sets `next-auth.session-token`: `apps/cms/cypress/e2e/cms-middleware.cy.ts:7-16, 37-49`.

## Accessibility Testing

- `cypress-axe` is loaded globally. Typical usage in specs:
  - `cy.injectAxe(); cy.checkA11y();`
  - Example: `apps/cms/cypress/e2e/checkout-flow-a11y.cy.ts:20-23`
- For contrast‑only runs or debug logging, some specs invoke Axe directly and surface violations via `cy.task('log', ...)`.
  - Example: `apps/cms/cypress/e2e/cms-themes-a11y-debug.cy.ts:24-45`

## Keyboard Navigation

- `cypress-plugin-tab` is installed and imported in specs that validate focus order and tab stops.
  - Example: `apps/cms/cypress/e2e/checkout-flow-a11y.cy.ts:36-38`

## Network Mocking

- MSW default handlers cover common CMS endpoints and intentionally pass through cart and API route calls.
  - Defaults: `test/msw/shared.ts:12-63, 70-87`
- You can add test‑specific overrides with `server.use(...)` from `~test/msw/server`.
- Specs may also use `cy.intercept` where convenient.
  - Example: `apps/cms/cypress/e2e/checkout-flow-a11y.cy.ts:6-9`

## TypeScript

- Cypress TS config includes both spec locations and pulls in `cypress` + `node` types.
  - `apps/cms/cypress/tsconfig.json:4-8`
- The `~test/*` path alias maps to `test/*` (configured in `tsconfig.base.json`), enabling short imports like `~test/msw/server`.

## Tips

- Base URL: If your app runs on a different port, set `CYPRESS_BASE_URL` (or use the `e2e:shop`/`e2e:cms` scripts which set it for you).
- Headed debugging: `pnpm e2e:open`.
- Screenshots/videos: standard Cypress defaults apply; failures are captured under `apps/cms/cypress/screenshots`.
- Prevent flaky network: prefer MSW (`server.use`) or `cy.intercept` over live requests.

## CMS Functional Examples

- Shop Editor (name/theme/luxury flags): `apps/cms/cypress/e2e/cms-shop-editor-functional.cy.ts:1`
- Currency & tax: `apps/cms/cypress/e2e/cms-currency-tax-functional.cy.ts:1`
- Deposits: `apps/cms/cypress/e2e/cms-deposits-functional.cy.ts:1`
- Returns: `apps/cms/cypress/e2e/cms-returns-functional.cy.ts:1`
- Reverse logistics: `apps/cms/cypress/e2e/cms-reverse-logistics-functional.cy.ts:1`
- Late fees: `apps/cms/cypress/e2e/cms-late-fees-functional.cy.ts:1`
- Premier delivery: `apps/cms/cypress/e2e/cms-premier-delivery-functional.cy.ts:1`
- SEO save: `apps/cms/cypress/e2e/cms-seo-functional.cy.ts:1`
- SEO freeze translations: `apps/cms/cypress/e2e/cms-seo-freeze-functional.cy.ts:1`
- SEO warnings (length): `apps/cms/cypress/e2e/cms-seo-warnings-functional.cy.ts:1`
- SEO locales (freeze off): `apps/cms/cypress/e2e/cms-seo-locales-functional.cy.ts:1`
- SEO generate (stubbed): `apps/cms/cypress/e2e/cms-seo-generate-functional.cy.ts:1`
- SEO audit panel (stubbed): `apps/cms/cypress/e2e/cms-seo-audit-functional.cy.ts:1`
- Overrides duplicate resolution: `apps/cms/cypress/e2e/cms-overrides-duplicate-functional.cy.ts:1`
- Theme reset (multiple): `apps/cms/cypress/e2e/cms-theme-reset-multi-functional.cy.ts:1`
- Live previews list: `apps/cms/cypress/e2e/cms-live-previews-functional.cy.ts:1`
- Edit Preview page: `apps/cms/cypress/e2e/cms-edit-preview-functional.cy.ts:1`
- Configurator dashboard + Shop Details: `apps/cms/cypress/e2e/cms-configurator-functional.cy.ts:1`
- Configurator launch (SSE stub): `apps/cms/cypress/e2e/cms-configurator-launch-functional.cy.ts:1`
- Configurator Theme step: `apps/cms/cypress/e2e/cms-configurator-theme-functional.cy.ts:1`
- Configurator Home Page step: `apps/cms/cypress/e2e/cms-configurator-homepage-functional.cy.ts:1`
- Configurator Tokens step: `apps/cms/cypress/e2e/cms-configurator-tokens-functional.cy.ts:1`
- AI Catalog: `apps/cms/cypress/e2e/cms-ai-catalog-functional.cy.ts:1`
- Theme override reset: `apps/cms/cypress/e2e/cms-theme-reset-functional.cy.ts:1`
- RBAC (viewer): `apps/cms/cypress/e2e/cms-rbac-viewer-functional.cy.ts:1`
- Stock scheduler (toast only): `apps/cms/cypress/e2e/cms-stock-scheduler-functional.cy.ts:1`
- Providers (tracking): `apps/cms/cypress/e2e/cms-providers-functional.cy.ts:1`
- Overrides + localization: `apps/cms/cypress/e2e/cms-overrides-functional.cy.ts:1`
- Maintenance scan (toast only): `apps/cms/cypress/e2e/cms-maintenance-scan-functional.cy.ts:1`
- Overrides validation (negative): `apps/cms/cypress/e2e/cms-overrides-validation-functional.cy.ts:1`
- Overview reflects settings: `apps/cms/cypress/e2e/cms-overview-readonly-functional.cy.ts:1`
- Stock alerts validation: `apps/cms/cypress/e2e/cms-stock-alerts-validation-functional.cy.ts:1`
  - When `COVERAGE=1`, `after:run` fetches server coverage and writes `.nyc_output/server.coverage.json` for merging.
