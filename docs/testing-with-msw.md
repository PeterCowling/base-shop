# Testing with MSW

Centralized network mocking for tests uses a single shared MSW server and a small set of default handlers. Suites can extend or override these per test.

## TL;DR

- Import the shared server via the alias: `import { server, rest } from '~test/msw/server'`.
- Add or override handlers in a test with `server.use(...)`.
- Defaults live in `test/msw/shared.ts` as `defaultHandlers`. Update them when you want repo‑wide behavior.
- CMS tests automatically layer their own handlers on top of defaults.

## Files

- Shared defaults and utilities: `test/msw/shared.ts`
  - Exports:
    - `defaultHandlers`: workspace‑wide defaults
    - `createServer(...extraHandlers)`: factory to compose defaults + extras
    - `rest`: MSW REST helper re‑export
- Global server (used by Jest setup): `test/msw/server.ts`
- Global lifecycle hooks: `jest.setup.ts`
- CMS suite composition: `apps/cms/__tests__/msw/server.ts`

## Global usage (most tests)

```ts
import { server, rest } from '~test/msw/server';

// Add/override handlers for this test file or individual tests
beforeAll(() => {
  server.use(
    rest.get('/api/example', (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true })))
  );
});

// No need to start/stop/reset here — jest.setup.ts manages lifecycle
```

## CMS test composition

CMS tests get the shared defaults plus CMS‑specific handlers:

- `apps/cms/__tests__/msw/handlers.ts`: CMS‑specific handlers
- `apps/cms/__tests__/msw/server.ts`: re‑applies those handlers in `beforeEach()` so they persist across the global reset managed by `jest.setup.ts`.

You generally don’t need to import the server in CMS tests directly; the suite setup wires it for you. If you do need custom behavior in a specific test, you can still import and call `server.use(...)` as usual.

```ts
// Inside a CMS test (optional override)
import { server, rest } from '~test/msw/server';

test('overrides CMS handler', () => {
  server.use(rest.get('/cms/api/configurator-progress', (_req, res, ctx) => res(ctx.status(200), ctx.json({ state: { step: 'x' }, completed: {} }))));
  // ... assertions
});
```

## The `~test` alias

- Jest: mapped in `jest.moduleMapper.cjs`.
- TypeScript: mapped in `tsconfig.base.json`.

Importing `~test/msw/server` ensures stable, short paths from any workspace package/app.

## Cypress (note)

Cypress currently imports the same shared server in `cypress/support/index.ts`. If you prefer true browser interception, switch to `msw/browser` with a service worker and initialize it in Cypress; the shared handlers can be reused.

