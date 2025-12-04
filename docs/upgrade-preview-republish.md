Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Upgrade, preview and republish

The upgrade flow stages template changes, lets them be previewed, and republishes the shop once verified.

## CLI usage

### `upgrade-shop`

Run the script with a shop identifier to copy files from the template:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id>
```

Existing files are backed up with a `.bak` suffix, the shop's `shop.json` gains a `lastUpgrade` timestamp, and `data/shops/<id>/upgrade.json` is generated with metadata about the staged components. The script also regenerates the upgrade preview props file so new components render correctly. Use `--rollback` to restore the backups:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id> --rollback
```

### `generate-example-props`

Scans `packages/ui/src/components` for exported components and writes
`apps/<shop>/src/app/upgrade-preview/example-props.ts` with sample props for
known components and empty objects for others. This runs automatically during
`upgrade-shop` but can be invoked directly:

```bash
pnpm ts-node scripts/src/generate-example-props.ts <shop-id>
```

### `republish-shop`

After testing an upgrade, rebuild and deploy the shop:

```bash
pnpm ts-node scripts/src/republish-shop.ts <shop-id>
```

The script requires a corresponding `data/shops/<id>/upgrade.json`, runs `pnpm --filter apps/<id> build` followed by `deploy`, marks the shop as `published` in `shop.json`, and removes the upgrade metadata file.

## API endpoints

- `GET /preview/:pageId?token=<hmac>` – returns page JSON for previews. Tokens are base64url‑encoded HMAC-SHA256 digests of `shopId:pageId` using `PREVIEW_TOKEN_SECRET` (or `UPGRADE_PREVIEW_TOKEN_SECRET` for upgrade previews).

## Preview UI

CMS components fetch the preview endpoint and render changes live. The configurator preview reads state from `localStorage` so edits appear instantly, and deployments expose a preview URL (`<shop-id>.pages.dev`) written to `deploy.json`.

## Metadata

- `data/shops/<id>/shop.json` stores `lastUpgrade` and the publish `status`.
- `data/shops/<id>/upgrade.json` captures information about the staged upgrade and is deleted after publishing.
- `data/shops/<id>/deploy.json` stores the `previewUrl` and deployment instructions.
