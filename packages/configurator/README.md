Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# configurator (Agent Brief)

## Snapshot
- Purpose: CLI entry that validates env and runs configurator build/dev/deploy.
- Owners: N/A
- Source of truth: `packages/configurator/src/index.ts`
- Runtime surface: CLI (Node)

## Commands
- Build: `pnpm --filter @acme/configurator build`
- Dev: `pnpm --filter @acme/configurator dev`
- Test (scoped): `pnpm --filter @acme/configurator test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/configurator lint`

## Inputs and outputs
- Required env: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `CART_COOKIE_SECRET`
- Data stores: N/A
- External services: Cloudflare Pages (via `wrangler`)

## Dependencies
- Upstream packages: `@acme/config`
- Downstream consumers: `apps/cms`

## Change boundaries
- Safe to edit: CLI messaging or new subcommands.
- Do not edit without a plan: required env list or deploy command wiring.

## Notes
- Related docs: `docs/setup.md`
- Entry points: `packages/configurator/src/index.ts`, `packages/configurator/bin/configurator.cjs`, `packages/configurator/src/providers.ts`
