Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# tools (Agent Brief)

## Snapshot
- Purpose: Asset budget checks and GLB tooling helpers.
- Owners: N/A
- Source of truth: `packages/tools/src/index.ts`
- Runtime surface: CLI/Node utilities

## Commands
- Build: `pnpm --filter @acme/tools build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/tools test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/tools lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@gltf-transform/core`
- Downstream consumers: N/A

## Change boundaries
- Safe to edit: new budget checks or tooling utilities.
- Do not edit without a plan: CLI interface changes (`budgets:check`).

## Notes
- Related docs: N/A
- Entry points: `packages/tools/src/index.ts`, `packages/tools/src/cli.ts`
