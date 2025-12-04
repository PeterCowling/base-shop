Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Upgrade flow

The upgrade system stages template changes, tracks versions, lets them be previewed and republishes or rolls back depending on the review.

## Version tracking
- `data/shops/<id>/shop.json` stores `lastUpgrade` and a `componentVersions` map recording the package version used for each UI component.
- `data/shops/<id>/upgrade.json` is written when `upgrade-shop` runs and records the timestamp, the components that changed and the component versions used.

## Diff API
- `GET /components/:shopId` lists packages whose versions differ from those recorded in `shop.json`.
- Adding `?diff` also returns lists of template and translation files that changed relative to `packages/template-app`.

## Preview upgrades
- `pnpm ts-node scripts/src/upgrade-shop.ts <shop-id>` stages files from the template and generates `upgrade-changes.json` alongside example props so changed components can render.
- Navigate to `/upgrade-preview` in the shop to render each changed component and follow any page links to validate affected pages.

## Republish or rollback
- After verifying the preview, publish the upgrade with `pnpm ts-node scripts/src/republish-shop.ts <shop-id>`.
- If the upgrade should be aborted, run `pnpm ts-node scripts/src/upgrade-shop.ts <shop-id> --rollback` to restore the previous files and component versions.

## Extending the diff/preview pipeline
- **New component layers** – create the layer under `packages/ui/src/components`, export it from the barrel files and, if components require props, extend `scripts/src/generate-example-props.ts` with defaults so upgrade previews render.
- **Plugin components** – add plugins under `packages/plugins/*` and export a default plugin object. Ensure their package names appear in `shop.json`'s `componentVersions` so the diff API can detect upgrades. If plugin components live outside `packages/ui/src/components`, update `scripts/src/component-names.ts` to include those directories.
