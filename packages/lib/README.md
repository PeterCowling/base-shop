Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# lib (Agent Brief)

## Snapshot
- Purpose: Shared helpers for shop validation, metadata generation, and try-on utilities.
- Owners: N/A
- Source of truth: `packages/lib/src/index.ts`
- Runtime surface: Shared (server + client), with server-only modules in `*.server.ts`

## Commands
- Build: `pnpm --filter @acme/lib build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/lib test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/lib lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@acme/config`, `@acme/platform-core`, `@acme/zod-utils`
- Downstream consumers: `@apps/cms`, `@apps/cover-me-pretty`, `@apps/api`, `@acme/email`

## Change boundaries
- Safe to edit: add new helpers or expand try-on utilities with stable exports.
- Do not edit without a plan: `validateShopName` regex, `checkShopExists` semantics, or `generateMeta` outputs.

## Notes
- Related docs: `docs/architecture.md`
- Entry points: `packages/lib/src/index.ts`, `packages/lib/src/checkShopExists.server.ts`, `packages/lib/src/tryon/index.ts`
