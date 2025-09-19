# template-app — Agent Notes

## Purpose
Starter application template.

## File Organization Guidance

- Keep each file focused on a single clear responsibility instead of mixing unrelated concerns.
- Aim to keep every file under 350 lines of code. When exceeding this limit is absolutely necessary (for example, generated output or framework-required structure), document the justification and plan for follow-up refactors.
- Prefer extracting helpers, components, and modules rather than growing a file past the limit.

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
- **TS2307**: Cannot find module or its corresponding type declarations. This happens when TypeScript can’t find a module or its types due to missing type definitions, incorrect import paths, or a misconfigured `baseUrl`/`paths` setup:contentReference[oaicite:9]{index=9}. Check that the module exists (in `src/` or `node_modules`), install `@types` packages if the library has no built-in types:contentReference[oaicite:10]{index=10}, correct any relative paths in imports:contentReference[oaicite:11]{index=11}, and ensure `tsconfig.json` has the correct `baseUrl` and `paths` mappings:contentReference[oaicite:12]{index=12}.

## CI Expectations
`pnpm run check:references` and `pnpm run build:ts` must pass on a clean checkout.
