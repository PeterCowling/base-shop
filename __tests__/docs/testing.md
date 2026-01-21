# Testing

This guide explains how to run unit and integration tests and how to choose between mocking Prisma calls or using a real database. Tests run with a stubbed Prisma client by default, so `pnpm test` completes without requiring a database.

## Coverage Targets

All packages must meet minimum coverage thresholds:

| Metric     | Global Default | `@acme/ui` |
|------------|----------------|------------|
| Lines      | 80%            | 90%        |
| Branches   | 80%            | 85%        |
| Functions  | 80%            | 90%        |

For detailed coverage configuration, reports, and how to merge coverage from different test runners, see [docs/coverage.md](../../docs/coverage.md).

## Running tests

### Stubbed Prisma client (`DATABASE_URL` unset)

When `DATABASE_URL` is not defined, the platform swaps Prisma with an in-memory stub. This mode is ideal for fast unit tests that focus on business logic.

Run tests without a database:

```bash
pnpm test
```

### Real Prisma client (`DATABASE_URL` set)

Set `DATABASE_URL` to point at a test database to exercise the real Prisma client. Run pending migrations before executing the tests. This enables end-to-end and integration tests that need actual queries.

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/base_shop_test"
pnpm prisma migrate deploy
pnpm test
```

## Mocking Prisma vs. using a test database

- **Mock Prisma calls** for isolated unit tests where database access would slow down execution or introduce external dependencies. Mocks let you assert that code calls Prisma with the expected arguments.
- **Use a test database** for integration tests that rely on real SQL behavior, migrations, or interactions across multiple layers of the application.

Mock Prisma calls in unit tests to keep them fast and focused. Use a Postgres database for integration tests to verify end-to-end behavior.

## Seeding the database for integration tests

When running integration tests against a real database, ensure the schema is migrated and populated with baseline data:

```bash
pnpm --filter @acme/platform-core exec prisma migrate reset --force
pnpm --filter @acme/platform-core exec prisma db seed
```

`pnpm --filter @acme/platform-core exec prisma db seed` seeds inventory and orders by default. Run `pnpm --filter @acme/platform-core exec prisma db seed -- --skip-inventory` to omit inventory data. Inventory fixtures come from `__tests__/data/shops/*/inventory.json` and compute `variantKey` for each variant.

Run these commands before `pnpm test` so each test suite starts from a clean, seeded state.

## Jest Mock Patterns

### The globalThis Pattern for Mock Hoisting

Jest hoists `jest.mock()` calls to the top of the file, which means variables declared in the test file are not yet initialized when the mock factory runs. This causes "Cannot access before initialization" errors.

**Problem:**
```typescript
// ❌ BROKEN - testFiles is not initialized when mock factory runs
const testFiles = new Map<string, string>();

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(async (p: string) => {
      return testFiles.get(p);  // ReferenceError!
    }),
  },
}));
```

**Solution: Use globalThis**
```typescript
// ✅ CORRECT - globalThis is always accessible
declare global {
  var __testFiles: Map<string, string> | undefined;
}
globalThis.__testFiles = new Map<string, string>();

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(async (p: string) => {
      return globalThis.__testFiles?.get(p);
    }),
  },
}));

// Access mocked modules after jest.mock declarations
const { readFile } = require("fs").promises as { readFile: jest.Mock };

beforeEach(() => {
  globalThis.__testFiles?.clear();
});

afterAll(() => {
  delete globalThis.__testFiles;
});
```

**Key points:**
1. Declare the global type with `declare global { var __varName: Type | undefined; }`
2. Initialize on `globalThis` before `jest.mock()` calls
3. Use optional chaining (`?.`) when accessing in mock factories
4. Clean up in `beforeEach` and `afterAll`
5. Use `require()` to access mocked modules after mock declarations

### Shared Test Utilities

The `~test/setup` module provides commonly used test helpers:

```typescript
import {
  createGlobalThisMock,
  getGlobalThisMock,
  globalThisMockKey,
  withMockedFetch,
  mockFetchJson,
  mockFetchText,
  mockFetchError,
  mockHttpErrors,
} from "~test/setup";
```

#### `createGlobalThisMock` — Avoid Mock Hoisting Issues

A helper that creates mocks on globalThis to avoid Jest's hoisting issues:

```typescript
import { createGlobalThisMock, globalThisMockKey } from "~test/setup";

const mockFn = createGlobalThisMock<jest.Mock>("myModule", jest.fn());

jest.mock("./myModule", () => ({
  get doSomething() {
    return (globalThis as any)[globalThisMockKey("myModule")];
  },
}));

// In tests:
mockFn.mockReturnValue("test");
expect(mockFn).toHaveBeenCalled();
```

#### `withMockedFetch` — Mock Global Fetch

Provides helpers for mocking the global `fetch` function:

```typescript
import { withMockedFetch, mockFetchJson, mockHttpErrors } from "~test/setup";

describe("API tests", () => {
  let fetchMock: jest.Mock;
  let restore: () => void;

  beforeEach(() => {
    ({ fetchMock, restore } = withMockedFetch());
  });

  afterEach(() => {
    restore();
  });

  it("fetches data", async () => {
    fetchMock.mockResolvedValueOnce(mockFetchJson({ data: "test" }));
    const result = await myApiCall();
    expect(result).toEqual({ data: "test" });
  });

  it("handles errors", async () => {
    fetchMock.mockResolvedValueOnce(mockHttpErrors.notFound());
    await expect(myApiCall()).rejects.toThrow();
  });
});
```

### Environment Variable Testing with withEnv

The `withEnv` utility in `@acme/config/test/utils/withEnv.ts` isolates environment variables for tests. Be aware of carry-over keys:

```typescript
import { withEnv } from "@acme/config/test/utils/withEnv";
import {
  PRODUCTION_BASE_ENV,
  withoutCarryOverKeys
} from "@acme/config/test/fixtures/productionEnv";

// Production mode test
it("works in production", async () => {
  await withEnv(
    { NODE_ENV: "production", ...PRODUCTION_BASE_ENV },
    async () => { /* test code */ }
  );
});

// Test development defaults (must explicitly unset carry-over keys)
it("uses dev defaults", async () => {
  await withEnv(
    withoutCarryOverKeys({ NODE_ENV: "development" }),
    async () => { /* test code */ }
  );
});
```

### Skipping Integration Tests Without Database

For tests that require a real database connection, use conditional skipping:

```typescript
// This test requires a real database connection
const describeFn = process.env.DATABASE_URL ? describe : describe.skip;

describeFn("integration tests", () => {
  // These tests only run when DATABASE_URL is set
});
```

## Load testing

Load tests use [k6](https://k6.io) and are run manually. They are not executed in continuous integration.

To exercise the rental and return flows for the shop app:

```bash
cd apps/cover-me-pretty/load-tests
SHOP_BASE_URL=http://localhost:3004 k6 run rental-return.k6.js
```
