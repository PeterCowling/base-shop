Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# eslint-plugin-ds (Agent Brief)

## Snapshot
- Purpose: Custom ESLint rules enforcing design-system tokens and layout constraints.
- Owners: N/A
- Source of truth: `packages/eslint-plugin-ds/src/index.ts`
- Runtime surface: Dev tooling (lint-time)

## Commands
- Build: `pnpm --filter @acme/eslint-plugin-ds build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/eslint-plugin-ds test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/eslint-plugin-ds lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `eslint`
- Downstream consumers: `eslint.config.mjs`, `@apps/cms`, `@apps/skylar`

## Change boundaries
- Safe to edit: add new rules or extend rule metadata/tests.
- Do not edit without a plan: renaming rule ids or changing rule severity contracts.

## Notes
- Related docs: `docs/linting.md`
- Entry points: `packages/eslint-plugin-ds/src/index.ts`, `packages/eslint-plugin-ds/src/rules/`
