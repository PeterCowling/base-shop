Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# config (Agent Brief)

## Snapshot
- Purpose: Environment schemas, generated stubs, and shared Jest presets.
- Owners: N/A
- Source of truth: `packages/config/src/index.ts`
- Runtime surface: Build-time + server/runtime env access

## Commands
- Build: `pnpm --filter @acme/config build`
- Dev: `pnpm --filter @acme/config dev`
- Test (scoped): `pnpm --filter @acme/config test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/config lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@acme/zod-utils`
- Downstream consumers: `@apps/cms`, `@apps/cover-me-pretty`, `@acme/platform-core`, `@acme/lib`

## Change boundaries
- Safe to edit: additive env keys or new presets.
- Do not edit without a plan: changing env schema behavior or removing stubs; rerun `pnpm --filter @acme/config build:stubs` after `*.impl.ts` edits.

## Notes
- Related docs: `docs/setup.md`, `docs/tsconfig-paths.md`
- Entry points: `packages/config/src/index.ts`, `packages/config/src/env/index.ts`, `packages/config/jest-presets/base.cjs`
