Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# design-tokens (Agent Brief)

## Snapshot
- Purpose: Core design tokens, context tokens, and Tailwind plugin exports.
- Owners: N/A
- Source of truth: `packages/design-tokens/src/index.ts`
- Runtime surface: Shared (build + runtime)

## Commands
- Build: `pnpm --filter @acme/design-tokens build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/design-tokens test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/design-tokens lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@themes/base`
- Downstream consumers: `@acme/tailwind-config`, `@acme/ui`, `@apps/cms`, `@apps/reception`, `@apps/product-pipeline`

## Change boundaries
- Safe to edit: additive tokens or context exports.
- Do not edit without a plan: renaming token keys, contexts, or exported type names.

## Notes
- Related docs: `packages/design-tokens/USAGE.md`
- Entry points: `packages/design-tokens/src/index.ts`, `packages/design-tokens/src/tailwind-plugin.ts`
