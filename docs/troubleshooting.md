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

## Still stuck?

- Open an issue with: the failing command, a minimal repro (if possible), your OS/Node/pnpm versions, and any logs captured with `--trace-uncaught` and source maps enabled.

