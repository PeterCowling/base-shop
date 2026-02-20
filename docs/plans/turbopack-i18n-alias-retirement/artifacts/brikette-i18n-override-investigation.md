# Brikette i18n Override Investigation

Date: 2026-02-20  
Task: TASK-06 (`INVESTIGATE`)

## Objective
Determine whether Brikette still needs the app-local `@acme/i18n` path override in `apps/brikette/tsconfig.json` after TASK-02 contract normalization and TASK-04 alias retirement.

## State A: Current baseline (override present)
Configuration:
- `apps/brikette/tsconfig.json` contains:
  - `"@acme/i18n": ["../../packages/i18n/dist/index.js", "../../packages/i18n/dist/index.d.ts"]`
  - `"@acme/i18n/*": ["../../packages/i18n/dist/*"]`

Command evidence:
- `pnpm --filter @apps/brikette typecheck` -> pass (exit 0)
- `pnpm --filter @apps/brikette build` -> pass (exit 0)
- `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> pass (exit 0)

Notes:
- One initial parallel probe attempt produced a transient `.next/lock` collision between concurrent webpack/Turbopack builds; rerun in single-command sequence passed cleanly.

## State B: Probe (override removed)
Temporary change applied for probe only:
- Removed `@acme/i18n` and `@acme/i18n/*` keys from `apps/brikette/tsconfig.json`.

Command evidence:
- `pnpm --filter @apps/brikette typecheck` -> pass (exit 0)
- `pnpm --filter @apps/brikette build` -> pass (exit 0)
- `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` -> pass (exit 0)

## Comparison
- Both states are green for typecheck, webpack build, and Turbopack production build.
- No resolver or runtime regression was observed when the app-local i18n override was removed.

## Recommendation
Recommendation: **remove the Brikette app-local i18n override in TASK-07**.

Rationale:
- The override is now redundant under the normalized dist-only contract.
- Removing it reduces app-local divergence and aligns Brikette with shared defaults.

## TASK-07 implementation guidance
- Remove only `@acme/i18n` and `@acme/i18n/*` entries from `apps/brikette/tsconfig.json`.
- Keep non-i18n path aliases unchanged.
- Re-run TASK-07 validation contract:
  - `pnpm --filter @apps/brikette typecheck`
  - `pnpm --filter @apps/brikette build`
  - `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build`

## Rollback
If TASK-07 introduces unexpected regressions, restore the two `@acme/i18n` path entries in `apps/brikette/tsconfig.json` and re-run the three validation commands.

## Workspace hygiene
- Probe edit to `apps/brikette/tsconfig.json` was reverted after testing.
- No persistent code/config changes were made by TASK-06 beyond this artifact and plan status updates.
