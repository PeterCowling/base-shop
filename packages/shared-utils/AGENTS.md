# shared-utils — Agent Notes

## Purpose
Utilities shared across packages.

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
TS6305 indicates a missing build output or misconfigured reference. Clean the build and ensure the project reference is configured correctly.

## CI Expectations
`pnpm run check:references` and the TypeScript build must pass on a clean clone.
