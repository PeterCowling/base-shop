# email-templates — Agent Notes

## Purpose
Reusable email template components.

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
