# Testing

This guide explains how to run unit and integration tests and how to choose between mocking Prisma calls or using a real database. Tests run with a stubbed Prisma client by default.

> **For agent-specific testing rules, see [docs/testing-policy.md](../../docs/testing-policy.md).**
> Key rule: Always use targeted tests — never run `pnpm test` unfiltered.

## Running tests

### Targeted Test Commands (REQUIRED)

Always scope tests to the minimum necessary:

```bash
# Run a single test file (preferred)
pnpm --filter @acme/platform-core test -- src/cart/addItem.test.ts

# Run tests matching a pattern
pnpm --filter @acme/platform-core test -- --testPathPattern="cart"

# Limit workers for broader runs
pnpm --filter @acme/platform-core test -- --maxWorkers=2
```

### Stubbed Prisma client (`DATABASE_URL` unset)

When `DATABASE_URL` is not defined, the platform swaps Prisma with an in-memory stub. This mode is ideal for fast unit tests that focus on business logic.

### Real Prisma client (`DATABASE_URL` set)

Set `DATABASE_URL` to point at a test database to exercise the real Prisma client. Run pending migrations before executing the tests. This enables end-to-end and integration tests that need actual queries.

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/base_shop_test"
pnpm prisma migrate deploy
# Run targeted tests (never unfiltered pnpm test)
pnpm --filter @acme/platform-core test -- --testPathPattern="integration"
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

## Load testing

Load tests use [k6](https://k6.io) and are run manually. They are not executed in continuous integration.

To exercise the rental and return flows for the shop app:

```bash
cd apps/cover-me-pretty/load-tests
SHOP_BASE_URL=http://localhost:3004 k6 run rental-return.k6.js
```
