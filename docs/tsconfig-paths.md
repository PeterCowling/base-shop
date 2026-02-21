Type: Guide
Status: Active
Domain: TypeScript
Last-reviewed: 2025-12-02

# TypeScript Workspace Path Mapping

Apps should usually map workspace packages to both raw sources (`src`) and built outputs (`dist`) so imports resolve whether or not packages have been built.

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
- For most workspace packages, list `src` path(s) first, followed by built `dist` equivalents.
- For package‑level imports, map both the entrypoint and the `/*` wildcard.
- Keep `references` up to date to enable project builds (`tsc -b`).

## i18n Exception (Required)
`@acme/i18n` is a resolver-contract exception: consumers must use a **dist-only** mapping (do not map to `packages/i18n/src/*` in app tsconfigs).

Required shape:

```json
{
  "compilerOptions": {
    "paths": {
      "@acme/i18n": [
        "packages/i18n/dist/index.js",
        "packages/i18n/dist/index.d.ts"
      ],
      "@acme/i18n/*": [
        "packages/i18n/dist/*"
      ]
    }
  }
}
```

Rationale:
- Keeps webpack, Turbopack, and Node runtime resolution aligned for i18n imports.
- Prevents recurrence of source-resolution failures tied to i18n source specifier behavior.

Enforcement:
- Resolver contract is checked via `node scripts/check-i18n-resolver-contract.mjs`.
- CI wiring runs this command in `scripts/validate-changes.sh` and `.github/workflows/merge-gate.yml` for relevant config/path changes.
