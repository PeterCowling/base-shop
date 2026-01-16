Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# theme (Agent Brief)

## Snapshot
- Purpose: Theme schema validation and token merge utilities.
- Owners: N/A
- Source of truth: `packages/theme/src/index.ts`
- Runtime surface: Build-time + server

## Commands
- Build: `pnpm --filter @acme/theme build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/theme test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/theme lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@acme/types`, `zod`
- Downstream consumers: `apps/cms`

## Change boundaries
- Safe to edit: additive schema fields or new token merge helpers.
- Do not edit without a plan: breaking changes to theme schema contracts.

## Notes
- Related docs: `docs/typography-and-color.md`
- Entry points: `packages/theme/src/index.ts`, `packages/theme/src/io/theme-schema.ts`
