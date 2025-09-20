# TypeScript configuration

## Base `tsconfig`

`tsconfig.base.json` provides shared compiler options for the monorepo:

- `target: "ES2022"` for modern language features
- `moduleResolution: "bundler"` so packages resolve like they do in bundlers
- `strict: true` to enable strict type checking
- a large `paths` map that aliases packages such as `@acme/ui` and `@cms`
 - apps should map workspace packages to both `src` and `dist` so imports resolve pre/post build. See `docs/tsconfig-paths.md` for examples.

## Project references

TypeScript project references stitch the workspace together:

- **`tsconfig.json`** – root entrypoint that references packages and apps, used for editor tooling and full workspace builds
- **`tsconfig.packages.json`** – compiles all internal packages in `composite` mode and re‑emits declarations for incremental builds
- **`tsconfig.test.json`** – Jest/Testing config, tuned for JSDOM and referencing every package's test config

## Adding new packages

1. Create `packages/<name>/tsconfig.json` extending `../../tsconfig.base.json`, with `composite: true` and `noEmit: false`
2. Add a path alias for the package inside `tsconfig.base.json`
3. List the package in `tsconfig.packages.json` references and add a `tsconfig.test.json` referenced from the root test config if it has tests

## Adding new apps

1. Create `apps/<name>/tsconfig.json` extending `../../tsconfig.base.json` and mark it `composite`
2. Add `references` to any packages it uses
3. Add the app to the root `tsconfig.json` references
4. If the app has tests, create a `tsconfig.test.json` and reference it from the root test config

Following these steps keeps the TypeScript setup consistent across the repo.

## Casting to index signatures safely

When you need to access ad‑hoc properties on a strongly typed object (e.g., treat a union as a `Record<string, unknown>` for dynamic keys), cast through `unknown` first so TypeScript does not reject potentially unsafe conversions:

```ts
// good: cast through unknown, then to the indexable type
const meta = item as unknown as Record<string, unknown>;
const tags = (meta["tags"] as unknown[] | undefined)?.filter((t): t is string => typeof t === "string") ?? [];
```

This keeps the code explicit about the unchecked access without weakening the source types globally.
