# API

This package provides the API server for the monorepo.

## Test Coverage

Contributors should maintain high test coverage for code in `src/`.
We require **at least 90% branch coverage** for the source directory.
Run the following to verify coverage locally:

```bash
pnpm --filter @apps/api coverage
```

The CI pipeline runs this command and will fail if branch coverage
falls below the required threshold.
