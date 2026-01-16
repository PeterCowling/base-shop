Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# plugins (Agent Brief)

## Snapshot
- Purpose: Workspace container for plugin packages (payment, shipping, CMS).
- Owners: N/A
- Source of truth: `packages/plugins/*`
- Runtime surface: N/A (container directory)

## Commands
- Build: N/A
- Dev: N/A
- Test (scoped): N/A
- Typecheck/Lint: N/A

## Inputs and outputs
- Required env: N/A
- Data stores: N/A
- External services: N/A

## Dependencies
- Upstream packages: N/A
- Downstream consumers: `apps/cms`, plugin-specific apps

## Change boundaries
- Safe to edit: add new plugin packages.
- Do not edit without a plan: renaming plugin package folders or ids.

## Notes
- Related docs: `docs/commerce/inventory-integration-guide.md`
- Entry points: `packages/plugins/paypal/`, `packages/plugins/premier-shipping/`, `packages/plugins/sanity/`
