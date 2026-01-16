Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# date-utils (Agent Brief)

## Snapshot
- Purpose: Shared date/time helpers for formatting, parsing, and rental-day math.
- Owners: N/A
- Source of truth: `packages/date-utils/src/index.ts`
- Runtime surface: Shared (server + client)

## Commands
- Build: `pnpm --filter @acme/date-utils build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/date-utils test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/date-utils lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `date-fns`, `date-fns-tz`
- Downstream consumers: `@acme/platform-core`, `@acme/ui`, `@acme/template-app`, `@apps/cms`

## Change boundaries
- Safe to edit: add new helpers or locale-safe formatting utilities.
- Do not edit without a plan: behavior changes to `nowIso`, `calculateRentalDays`, or `formatTimestamp`.

## Notes
- Related docs: `docs/architecture.md`
- Entry points: `packages/date-utils/src/index.ts`
