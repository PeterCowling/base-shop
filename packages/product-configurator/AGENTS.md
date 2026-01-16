# product-configurator — Agent Notes

## Purpose
Shared product configuration types and Zod schemas used by the handbag
configurator app and API for validation and rendering.

## Operational Constraints
- Keep `types.ts` and `zod.ts` aligned; schema changes must update both.
- `version` fields in schemas are used for compatibility; avoid breaking
  changes without a versioned migration plan.
- Consumers rely on stable keys (regions/properties/hotspots). Avoid renames
  unless all downstream apps are updated in the same change.

## Commands
- Build: `pnpm --filter @acme/product-configurator build`
- Test: `pnpm --filter @acme/product-configurator test`

## Safe Change Checklist
- Regenerate and re-export types when adding schema fields.
- Validate against `@apps/handbag-configurator` and its API routes.
