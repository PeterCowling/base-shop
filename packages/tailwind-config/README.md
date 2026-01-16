Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# tailwind-config (Agent Brief)

## Snapshot
- Purpose: Shared Tailwind preset and workspace scan config.
- Owners: N/A
- Source of truth: `packages/tailwind-config/src/index.ts`
- Runtime surface: Build-time (Tailwind config)

## Commands
- Build: `pnpm --filter @acme/tailwind-config build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/tailwind-config test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/tailwind-config lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `tailwindcss`, `@tailwindcss/forms`, `@tailwindcss/container-queries`
- Downstream consumers: `@apps/cms`, `@apps/cover-me-pretty`, `@acme/ui`, `@acme/template-app`

## Change boundaries
- Safe to edit: adding new token mappings or Tailwind plugins.
- Do not edit without a plan: removing `presets` array or renaming token CSS vars used by UI components.

## Notes
- Related docs: `docs/typography-and-color.md`
- Entry points: `packages/tailwind-config/src/index.ts`, `packages/tailwind-config/tailwind.config.mjs`
