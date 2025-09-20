# @acme/test-utils

Lightweight helpers for Jest-based integration/unit tests that need a throwaway repo on disk or common platform mocks.

Import from `@acme/test-utils`:

- `withTempRepo(cb, opts?)`
- `withShop(cb)`
- `seedShop(dir, shop?)`
- `setupRentalData(dir, shopId?)`
- `mockNextAuthAdmin()` / `mockSessionAndEmail()` / `mockShop(tokens?)`

## withTempRepo
Creates an isolated temporary directory, sets `process.cwd` to it, and restores afterwards.

What it does:
- Creates `<tmp>/<prefix>/data/shops/<shopId>` (configurable).
- Applies safe polyfills used by route-handler tests: `Response.json`, `setImmediate`.
- Seeds common env for tests (auth secrets, Stripe keys, CMS env) unless disabled.
- Calls `jest.resetModules()` so imports inside the callback see the new CWD and mocks.

Signature:
```
withTempRepo(cb: (dir: string) => Promise<void>, opts?: {
  prefix?: string;         // folder prefix (default: 'repo-')
  shopId?: string;         // created under data/shops (default: 'test')
  setCommonEnv?: boolean;  // set typical test env (default: true)
  createShopDir?: boolean; // create data/shops/<shopId> (default: true)
}): Promise<void>
```

Usage:
```
await withTempRepo(async (dir) => {
  // place jest.doMock calls here (after resetModules), then import code under test
  const { GET } = await import('../src/app/api/foo/route');
  const res = await GET(new Request('http://test'));
});
```

## withShop
Like `withTempRepo`, but also sets `process.env.DATA_ROOT = <dir>/data/shops` so repository functions that resolve `DATA_ROOT` read/write inside the temp repo.

```
await withShop(async (dir) => {
  await seedShop(dir); // write data/shops/test/shop.json
  const repo = await import('@platform-core/repositories/shops.server');
  const shop = await repo.readShop('test');
});
```

## seedShop
Writes a minimal `shop.json` for a given directory (defaults shown):
```
await seedShop(dir, {
  id: 'test',
  name: 'Seed',
  catalogFilters: [],
  themeId: 'base',
  themeDefaults: {},
  themeOverrides: {},
  themeTokens: {},
  filterMappings: {},
  priceOverrides: {},
  localeOverrides: {},
});
```

## setupRentalData
Ensures the rental pricing fixture is available for tests that touch rental flows. Also creates `data/shops/<shopId>` if missing.
```
await setupRentalData(dir, 'bcd');
// Copies repository data/rental/pricing.json → <dir>/data/rental/pricing.json
```

## Mocks
- `mockNextAuthAdmin()` – Mocks `next-auth` to always resolve an admin session.
- `mockSessionAndEmail()` – Calls `mockNextAuthAdmin()` and mocks `@acme/email` to a no-op `sendEmail`.
- `mockShop(tokens?)` – Mocks DB + theme token loaders for shop tests; returns provided `tokens` from loaders.

## Tips
- Put `jest.doMock(...)` calls inside the `withTempRepo`/`withShop` callback (after resetModules) and before importing the modules under test.
- If a suite must not create `data/shops/<shopId>`, pass `{ createShopDir: false }`.
- `withTempRepo` sets sensible defaults for Stripe and auth env; override via `process.env` inside the callback when needed.

