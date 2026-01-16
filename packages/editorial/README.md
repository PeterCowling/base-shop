Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# editorial (Agent Brief)

## Snapshot
- Purpose: Blog content helpers for reading markdown/MDX from shop data.
- Owners: N/A
- Source of truth: `packages/editorial/src/index.ts`
- Runtime surface: Server-only

## Commands
- Build: `pnpm --filter @acme/editorial build`
- Dev: N/A
- Test (scoped): N/A
- Typecheck/Lint: `pnpm --filter @acme/editorial lint`

## Inputs and outputs
- Required env: N/A
- Data stores: Shop data under `data/<shop>/blog`
- External services: N/A

## Dependencies
- Upstream packages: `@acme/types`, `remark`, `rehype`
- Downstream consumers: N/A

## Change boundaries
- Safe to edit: parsing helpers or new metadata fields.
- Do not edit without a plan: front-matter parsing rules or slug generation.

## Notes
- Related docs: `docs/cms.md`
- Entry points: `packages/editorial/src/index.ts`
