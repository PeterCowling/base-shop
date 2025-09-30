# CMS Cypress Suite

Location and layout
- Config: `apps/cms/cypress.config.ts`
- E2E specs: `apps/cms/cypress/e2e/**/*.cy.ts`
- Component tests: `apps/cms/cypress/**/*.cy.{ts,tsx}` (CT uses `support/component.ts`)
- Support files: `apps/cms/cypress/support/*`
- TS config: `apps/cms/cypress/tsconfig.json`

Common commands
- Run all E2E (headless): `pnpm e2e`
- Open runner UI: `pnpm e2e:open`
- Focused dashboards: `pnpm e2e:dashboard`
- Dev server + single spec: `pnpm e2e:cms` (runs against `next dev` on port 3010)
- Functional flows (isolated DATA_ROOT): `pnpm e2e:cms:functional`
- Shop flows: `pnpm e2e:shop` (runs against `@apps/shop-bcd` on port 3004)
- Coverage run: `pnpm e2e:coverage` (instruments client + collects server route coverage)

Scripted spec globs
- `apps/cms/cypress/e2e/cms-a11y-*.cy.ts`
- `apps/cms/cypress/e2e/cms-*-functional.cy.ts`
- `apps/cms/cypress/e2e/shop-*.cy.ts`

Tips
- Base URL defaults to `http://localhost:3006`; override via `CYPRESS_BASE_URL`.
- Seed data lives in `__tests__/data/shops`; most scripts seed automatically.
- Use `cy.task('testData:setup')` to create a temporary fixture root in specs; clean up with `cy.task('testData:cleanup')`.

