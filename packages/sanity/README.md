Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# sanity (Agent Brief)

## Snapshot
- Purpose: Sanity client helpers for blog content per shop.
- Owners: N/A
- Source of truth: `packages/sanity/src/index.ts`
- Runtime surface: Server-only

## Commands
- Build: `pnpm --filter @acme/sanity build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/sanity test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/sanity lint`

## Inputs and outputs
- Required env: Sanity credentials in shop config
- Data stores: Sanity content API
- External services: Sanity

## Dependencies
- Upstream packages: `@acme/platform-core`, `@sanity/client`
- Downstream consumers: `@acme/template-app`, `apps/cover-me-pretty`

## Change boundaries
- Safe to edit: additive fields on blog queries.
- Do not edit without a plan: changing config schema or query shapes used by CMS/runtime.

## Notes
- Related docs: `docs/cms.md`
- Entry points: `packages/sanity/src/index.ts`
