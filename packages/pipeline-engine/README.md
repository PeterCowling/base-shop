Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# pipeline-engine (Agent Brief)

## Snapshot
- Purpose: Financial pipeline calculations (stage K, sensitivities, cashflow math).
- Owners: N/A
- Source of truth: `packages/pipeline-engine/src/index.ts`
- Runtime surface: Shared (server + client)

## Commands
- Build: `pnpm --filter @acme/pipeline-engine build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/pipeline-engine test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/pipeline-engine lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: N/A
- Downstream consumers: `apps/product-pipeline`

## Change boundaries
- Safe to edit: additive helpers or new types.
- Do not edit without a plan: changes to `computeStageK` or sensitivity math outputs.

## Notes
- Related docs: N/A
- Entry points: `packages/pipeline-engine/src/index.ts`, `packages/pipeline-engine/src/types.ts`
