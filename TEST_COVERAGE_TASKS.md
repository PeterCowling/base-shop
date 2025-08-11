# Test Coverage Improvement Tasks

- [ ] Configure coverage for packages using Node's test runner. The `packages/next-config` package currently runs tests via `node --test`, which does not support `--coverage` and fails when running `pnpm test:coverage`.
- [ ] Mock Prisma client in CMS tests. Tests under `apps/cms/__tests__` fail because `packages/platform-core/src/db.ts` imports `@prisma/client`, leading to missing `.prisma/client/index-browser` during test execution.
- [ ] Add unit tests for the PayPal plugin to verify payment registration and processing logic.
- [ ] Cover `getShippingRate` with success and error paths. This function fetches rates from provider APIs and throws when the provider key or response is invalid.
- [ ] Add tests for tax calculation utilities, including rule caching in `getTaxRate` and API error handling in `calculateTax`.
