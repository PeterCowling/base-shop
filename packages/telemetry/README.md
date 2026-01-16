Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# telemetry (Agent Brief)

## Snapshot
- Purpose: Client-side telemetry buffering, sampling, and error capture.
- Owners: N/A
- Source of truth: `packages/telemetry/src/index.ts`
- Runtime surface: Client/runtime

## Commands
- Build: `pnpm --filter @acme/telemetry build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/telemetry test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/telemetry lint`

## Inputs and outputs
- Required env: `NEXT_PUBLIC_ENABLE_TELEMETRY`, `NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE`, `NEXT_PUBLIC_TELEMETRY_ENDPOINT`
- Data stores: N/A
- External services: Telemetry endpoint (HTTP)

## Dependencies
- Upstream packages: N/A
- Downstream consumers: `apps/cms`, `apps/brikette`, `apps/dashboard`, `@acme/ui`

## Change boundaries
- Safe to edit: additive event fields or new helper exports.
- Do not edit without a plan: sampling rules or PII stripping behavior.

## Notes
- Related docs: `docs/telemetry-deployment.md`
- Entry points: `packages/telemetry/src/index.ts`, `packages/telemetry/src/sanitize.ts`
