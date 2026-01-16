Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# product-configurator (Agent Brief)

## Snapshot
- Purpose: Types and Zod schemas for product configurator flows.
- Owners: N/A
- Source of truth: `packages/product-configurator/src/index.ts`
- Runtime surface: Shared (server + client)

## Commands
- Build: `pnpm --filter @acme/product-configurator build`
- Dev: `pnpm --filter @acme/product-configurator dev`
- Test (scoped): `pnpm --filter @acme/product-configurator test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/product-configurator lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `zod`
- Downstream consumers: `apps/handbag-configurator`, `apps/handbag-configurator-api`

## Change boundaries
- Safe to edit: additive schema fields or new types.
- Do not edit without a plan: breaking changes to existing schema shapes.

## Notes
- Related docs: N/A
- Entry points: `packages/product-configurator/src/index.ts`, `packages/product-configurator/src/zod.ts`
