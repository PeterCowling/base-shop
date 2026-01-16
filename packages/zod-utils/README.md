Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# zod-utils (Agent Brief)

## Snapshot
- Purpose: Zod error-map helpers and auto-init for friendly validation messages.
- Owners: N/A
- Source of truth: `packages/zod-utils/src/index.ts`
- Runtime surface: Shared (server + client)

## Commands
- Build: `pnpm --filter @acme/zod-utils build`
- Dev: `pnpm --filter @acme/zod-utils dev`
- Test (scoped): `pnpm --filter @acme/zod-utils test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/zod-utils lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `zod`
- Downstream consumers: `@acme/config`, `@acme/lib`, `@apps/cms`, `@apps/cover-me-pretty`

## Change boundaries
- Safe to edit: new helper exports or additional Zod utilities.
- Do not edit without a plan: auto-init behavior in `initZod` or existing error mappings.

## Notes
- Related docs: `docs/linting.md`
- Entry points: `packages/zod-utils/src/index.ts`, `packages/zod-utils/src/zodErrorMap.ts`
