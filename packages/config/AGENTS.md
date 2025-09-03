# config — Agent Notes

## Purpose
Exposes configuration files through generated JavaScript stubs backed by TypeScript implementations.

## Regenerating Stubs
Run `pnpm run build:stubs` whenever a `*.impl.ts` file changes to rebuild the JavaScript stubs. This command runs `scripts/generate-env-stubs.mjs`, which scans `src/env/*.impl.ts` and writes matching `.js` files that re-export the compiled implementations.

## Tooling
- **Next.js** loads the `*.js` stubs for runtime configuration.
- **Jest** resolves the stubs so tests run without a custom transformer.
- **ESLint** reads configuration from the stubs for consistent linting.

## TypeScript Build Contract
- `compilerOptions.composite` is `true`
- `declaration` and `declarationMap` are `true`
- `rootDir` is `"src"` and `outDir` is `"dist"`
- `package.json` includes `"types": "dist/index.d.ts"`
- Add a project reference in `tsconfig.json` when importing this package.

## Clean & Rebuild
```sh
rimraf dist tsconfig.tsbuildinfo
tsc -b
```

## Common Errors
- **TS6305**: Build outputs are missing or stale. Clean the project (rimraf dist tsconfig.tsbuildinfo) and rebuild.
- **TS6202**: Circular project references. Update references to remove cycles.

## CI Expectations
`pnpm run check:references` and `pnpm run build:ts` must pass on a clean checkout.
