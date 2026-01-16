Type: Reference
Status: Active
Domain: Package
Last-reviewed: 2026-01-16

# themes (Agent Brief)

## Snapshot
- Purpose: Workspace container for theme packages (brand-specific token sets).
- Owners: N/A
- Source of truth: `packages/themes/*`
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
- Downstream consumers: `@acme/design-tokens`, app theme imports

## Change boundaries
- Safe to edit: add new theme packages.
- Do not edit without a plan: renaming theme package folders or ids.

## Notes
- Related docs: `docs/typography-and-color.md`
- Entry points: `packages/themes/base/`, `packages/themes/skylar/`, `packages/themes/prime/`
