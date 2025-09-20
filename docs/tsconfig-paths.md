# TypeScript Workspace Path Mapping

Apps must map workspace packages to both raw sources (`src`) and built outputs (`dist`) so imports resolve whether or not packages have been built.

## Why
- During development, editors and TS server should resolve from `src`.
- After building, runtime and type declarations resolve from `dist`.

## Base Setup
The repo’s `tsconfig.base.json` defines shared path aliases that already point to both `src` and `dist`. Apps can rely on these or add app‑specific aliases.

Example from `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@acme/platform-core": [
        "packages/platform-core/src/index.ts",
        "packages/platform-core/dist/index.d.ts"
      ],
      "@acme/platform-core/*": [
        "packages/platform-core/src/*",
        "packages/platform-core/dist/*"
      ]
    }
  }
}
```

## App Example (`apps/<app>/tsconfig.json`)
Ensure the app extends the base config and, if needed, adds local aliases that include both `src` and `dist` for each workspace dependency:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "noEmit": false,
    "outDir": "dist",
    "rootDir": "./src",
    "paths": {
      "@acme/lib": [
        "../../packages/lib/src/index.ts",
        "../../packages/lib/dist/index.d.ts"
      ],
      "@acme/lib/*": [
        "../../packages/lib/src/*",
        "../../packages/lib/dist/*"
      ]
    }
  },
  "include": ["src/**/*"]
}
```

## Guidelines
- Always list the `src` path(s) first, followed by the built `dist` equivalents.
- For package‑level imports, map both the entrypoint and the `/*` wildcard.
- Keep `references` up to date to enable project builds (`tsc -b`).

