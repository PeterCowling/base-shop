Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# auth (Agent Brief)

## Snapshot
- Purpose: Session handling, RBAC helpers, MFA utilities, and OIDC integrations.
- Owners: N/A
- Source of truth: `packages/auth/src/index.ts`
- Runtime surface: Server-focused with shared types for clients

## Commands
- Build: `pnpm --filter @acme/auth build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/auth test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/auth lint`

## Inputs and outputs
- Required env: N/A
- Data stores: In-memory store, Upstash Redis (optional)
- External services: OIDC providers (e.g., Keycloak)

## Dependencies
- Upstream packages: `@acme/config`, `@acme/platform-core`, `iron-session`, `@upstash/redis`, `openid-client`
- Downstream consumers: `apps/cms`, `packages/ui`, `packages/template-app`

## Change boundaries
- Safe to edit: additive helpers or new auth providers.
- Do not edit without a plan: session cookie names, RBAC role IDs, or permissions map behavior.

## Notes
- Related docs: `docs/permissions.md`, `docs/mfa.md`
- Entry points: `packages/auth/src/index.ts`, `packages/auth/src/session.ts`, `packages/auth/src/permissions.ts`
