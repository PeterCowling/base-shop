# Configurator Testing

This guide explains how to run the end-to-end configurator test.

## Required commands

1. `pnpm install`
2. `pnpm -r build`
3. `pnpm cypress run --spec test/e2e/configurator.spec.ts`

## Environment variables

- `NEXTAUTH_SECRET` – secret used by NextAuth for session signing.
- `TEST_DATA_ROOT` – root directory for test fixtures. Defaults to `__tests__/data/shops`.

## Cleanup

If the test fails, remove any partially created shop data to reset the environment:

```bash
rm -rf "${TEST_DATA_ROOT:-__tests__/data}/shops/*"
```

Then re-seed fixtures as needed:

```bash
pnpm tsx scripts/src/seed-test-data.ts
```
