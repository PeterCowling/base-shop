Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# types (Agent Brief)

## Snapshot
- Purpose: Shared type definitions and data contracts for apps and packages.
- Owners: N/A
- Source of truth: `packages/types/src/index.ts`
- Runtime surface: Type-only with a few runtime constants/enums

## Commands
- Build: `pnpm --filter @acme/types build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/types test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/types lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@acme/i18n`
- Downstream consumers: `@acme/platform-core`, `@acme/ui`, `@apps/cms`, `@apps/cover-me-pretty`

## Change boundaries
- Safe to edit: additive types, new subpath exports, or doc improvements.
- Do not edit without a plan: removing or renaming exported types, or altering `exports` map paths.

## Notes
- Related docs: `docs/architecture.md`
- Entry points: `packages/types/src/index.ts`, `packages/types/src/page/index.ts`, `packages/types/src/theme/index.ts`
