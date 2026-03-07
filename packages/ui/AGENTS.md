# ui — Agent Notes

## Purpose
UI component library.

Scope
- Generic, app-agnostic components (atoms/molecules/organisms), overlays, layout scaffolding.
- Generic hooks and utilities without CMS/page model or routing awareness.

Out of Scope (migrate out)
- CMS and page-builder UI (`src/components/cms/**`) → `@acme/page-builder-ui` / `apps/cms`
- Page-builder core state and utils → `@acme/page-builder-core`
- CMS marketing (`src/components/cms/marketing/**`) → `@acme/cms-marketing`
- App/domain templates (`src/components/templates/**`) → `@acme/templates`

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

## Adding shadcn components

Use the CLI to scaffold new components into the shared package:

```sh
npx shadcn@latest add <component> --cwd packages/ui --yes
```

After the CLI writes the file:
1. Add the component to `src/components/atoms/shadcn/index.ts` (CLI does not update barrels)
2. Add a smoke render test in `src/components/atoms/shadcn/__tests__/` following the pattern in `wrappers.test.tsx`
3. Update the exports map in `package.json` if the component needs a named subpath export

**Notes:**
- `cssVariables: false` in `components.json` is intentional — the design token system in `packages/themes/base/tokens.css` handles theming; do not change this setting
- `tailwind.baseColor: "neutral"` — new components will use neutral as the default; override via className as needed
- CLI-generated files import `cn` from `@/lib/utils` — this resolves to `src/lib/utils.ts` which re-exports from `src/utils/style/cn.ts`
- `tailwind.config: ""` is intentional — `packages/ui` has no per-package Tailwind config; the repo root `tailwind.config.mjs` is picked up by apps

## CI Expectations
`pnpm run check:references` and `pnpm run build:ts` must pass on a clean checkout.
