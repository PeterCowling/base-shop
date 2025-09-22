# Troubleshooting

Use this guide to capture detailed logs and resolve common issues in this monorepo.

## Dev server fails with “array.length” error

Symptoms: `pnpm run dev` (via Turbo) or a Next.js app crashes with an "array.length" error without a helpful stack trace.

Try these steps in order:

- Build everything (type‑check and ensure outputs):
  - `pnpm -r build`
- Regenerate config stubs if you touched `packages/config/src/env/*.impl.ts`:
  - `pnpm --filter @acme/config run build:stubs`
- Clean stale artifacts and rebuild:
  - `pnpm -r run clean && pnpm -r build`
- Capture a detailed stack trace by running the app directly with Node tracing enabled (replace the filter with your app):
  - `cross-env NODE_OPTIONS="--trace-uncaught --enable-source-maps" pnpm --filter @apps/cms run dev`
  - Or build with Next’s debug output:
  - `cross-env NODE_OPTIONS="--trace-uncaught --enable-source-maps" pnpm --filter @apps/cms exec next build --debug`
- If Turbo obscures output, run a focused dev without cache and grouped logs:
  - `TURBO_TELEMETRY_DISABLED=1 TURBO_LOG_ORDER=grouped pnpm exec turbo run dev --parallel --filter=@apps/cms --no-cache`
- If a specific page/route triggers the error, open it again with your terminal focused to capture the stack.

If you’re using Codex CLI, also run its failure-log command to attach structured logs for the failing step.

## TypeScript: TS2307 Cannot find module

- Ensure both `src` and `dist` paths are mapped for each workspace package the app imports.
- See `docs/tsconfig-paths.md` for working examples and guidelines.
- Clean and rebuild to refresh declaration outputs: `pnpm -r run clean && pnpm -r build`.

## TypeScript: Page Builder compile errors

Symptoms: `@acme/ui` fails to build with errors in Page Builder files, for example:

- TS2339/TS2345 around DragOverlayPreview palette typing
- TS2322 complaining a `ComponentType` is not a valid ReactNode
- TS1355 about an invalid `as const` usage in `PageBuilder.tsx`

Fixes applied in repo:

- DragOverlayPreview
  - Use `ComponentType` from `packages/ui/src/components/cms/page-builder/defaults.ts` instead of inferring from `palette.layout`.
  - Coerce dynamic values to strings when building the overlay `label` and when looking up the icon.
  - File: `packages/ui/src/components/cms/page-builder/DragOverlayPreview.tsx`
- PageBuilder
  - Replace `as const` return assertion with an explicit union return type for device mapping.
  - File: `packages/ui/src/components/cms/page-builder/PageBuilder.tsx`

Alternative mitigations if similar errors reappear:

- Narrow `palette` typings so each category shares a common meta type with `type: ComponentType`.
- Avoid indexing into `palette["layout"][number]`; use exported types or registries to derive a `string` union.
- When reflecting values into JSX text, always coerce uncertain types with `String(value)`.

Verification commands:

- `pnpm --filter @acme/ui build`
- For a full check: `pnpm -r build` (may take several minutes).

## Prisma: missing client or schema mismatches

- Generate Prisma client: `pnpm --filter @acme/platform-core exec prisma generate`
- Run migrations: `pnpm --filter @acme/platform-core exec prisma migrate dev`
- Seed data (optional): `pnpm --filter @acme/platform-core exec prisma db seed`

## Ports already in use

- Change the port or stop the conflicting process. Example:
  - CMS dev on a different port: `pnpm --filter @apps/cms run dev -- --port 3007`

## Cache and artifacts

- Remove build artifacts and Next caches if behavior seems stale:
  - `pnpm -r run clean`
  - Delete app `.next/` directories if needed.

## Next.js build ENOENT (cache rename) in template-app

Symptoms: `@acme/template-app` fails during `next build` with:

```
Error: ENOENT: no such file or directory, rename '<app>/.next/cache/webpack/client-production/3.pack_' -> '.../3.pack'
```

Root cause: Webpack filesystem cache rename flake under concurrent Turbo builds.

Fixes applied in repo:

- Disable Webpack cache for the template app by overriding `webpack` in `packages/template-app/next.config.mjs` and setting `config.cache = false` (unless `NEXT_CACHE=true`). This preserves the shared `@acme/next-config` webpack customizations.

Other options if you want to keep caching:

- Set a unique cache directory per package: `config.cache = { type: 'filesystem', cacheDirectory: path.join(__dirname, '.next/cache/webpack') }`.
- Run app builds sequentially in CI for the affected package.
- Ensure `.next/` is cleaned before builds: `rimraf .next && next build`.
- Re-run with `--debug` to confirm the failing stage: `pnpm --filter @acme/template-app exec next build --debug`.

## Still stuck?

- Open an issue with: the failing command, a minimal repro (if possible), your OS/Node/pnpm versions, and any logs captured with `--trace-uncaught` and source maps enabled.
