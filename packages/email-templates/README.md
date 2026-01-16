Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# email-templates (Agent Brief)

## Snapshot
- Purpose: React email templates and variant catalog for marketing campaigns.
- Owners: N/A
- Source of truth: `packages/email-templates/src/index.ts`
- Runtime surface: Server-only rendering

## Commands
- Build: `pnpm --filter @acme/email-templates build`
- Dev: N/A
- Test (scoped): `pnpm --filter @acme/email-templates test -- <test-file>`
- Typecheck/Lint: `pnpm --filter @acme/email-templates lint`

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: `@acme/ui`, `react`, `react-dom`
- Downstream consumers: `@acme/email`, `@apps/cms`

## Change boundaries
- Safe to edit: add new template variants or props with additive changes.
- Do not edit without a plan: renaming exported template ids or breaking prop contracts.

## Notes
- Related docs: `packages/email/README.md`
- Entry points: `packages/email-templates/src/index.ts`, `packages/email-templates/src/marketingEmailTemplates.tsx`
