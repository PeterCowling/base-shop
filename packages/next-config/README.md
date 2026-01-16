Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# next-config (Agent Brief)

## Snapshot
- Purpose: Shared Next.js base config and helpers for apps.
- Owners: N/A
- Source of truth: `packages/next-config/index.mjs`
- Runtime surface: Build-time (Next config)

## Commands
- Build: N/A
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/next-config test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/next-config lint`

## Inputs and outputs
- Required env: `OUTPUT_EXPORT`, `NEXT_PUBLIC_PHASE`, `NEXT_PUBLIC_DEFAULT_SHOP`, `SHOP_CODE`
- Data stores: `data/shops` (for default shop lookup)
- External services: N/A

## Dependencies
- Upstream packages: `@acme/config`, `next`
- Downstream consumers: `apps/cms`, `apps/cover-me-pretty`, `apps/skylar`, `apps/brikette`

## Change boundaries
- Safe to edit: additive config defaults or helper exports.
- Do not edit without a plan: transpile package list or export output behavior.

## Notes
- Related docs: `docs/setup.md`
- Entry points: `packages/next-config/index.mjs`, `packages/next-config/next.config.mjs`
