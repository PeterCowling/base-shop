# Upgrading, Previewing, and Republishing Shops

This guide explains how to upgrade shop data to the latest schema, verify the results in a preview environment, and republish the shop.

## CLI commands

The repository exposes two utilities for working with existing shops:

- `pnpm upgrade-shop <shop-id>` – migrates `data/shops/<id>` to the current schema. The command prints a summary of fields that changed and writes updated JSON files back to disk.
- `pnpm republish-shop <shop-id>` – rebuilds the static payload for the given shop and pushes the metadata to the configured publish locations.

Both commands accept a `--dry-run` flag that reports what would change without touching any files or remote stores.

## API endpoints

The same actions are available through the API for programmatic use:

- `POST /api/shops/:id/upgrade` upgrades a shop using the logic from `upgrade-shop`.
- `POST /api/shops/:id/republish` runs the republish workflow.

Each endpoint returns a JSON body with a status message and any error information.

## Preview UI

To inspect a shop before republishing, launch the preview server:

```bash
pnpm preview
```

Then open `http://localhost:8788/` and use the **Preview** toggle in the header. This surfaces unpublished changes so you can verify theme updates, inventory adjustments, and other metadata updates before pushing them live.

## Metadata storage

Shop metadata is stored as JSON under `data/shops/<id>/`:

- `shop.json` – core shop configuration such as theme, providers, and catalog filters.
- `settings.json` – runtime settings like locale overrides.
- `inventory.json` and `products.json` – product data that the republish workflow serializes.

Upgrades mutate these files to match the latest schema. Republishing reads the updated metadata and publishes it to the environments listed in `data/publish-locations.json`.

