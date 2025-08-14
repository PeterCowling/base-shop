# Upgrade, preview and republish

The upgrade flow stages template changes, lets them be previewed, and republishes the shop once verified.

## CLI usage

### `upgrade-shop`

Run the script with a shop identifier to copy files from the template:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id>
```

Existing files are backed up with a `.bak` suffix, the shop's `shop.json` gains a `lastUpgrade` timestamp, and `data/shops/<id>/upgrade.json` is generated with metadata about the staged components. Use `--rollback` to restore the backups:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id> --rollback
```

### `republish-shop`

After testing an upgrade, rebuild and deploy the shop:

```bash
pnpm ts-node scripts/src/republish-shop.ts <shop-id>
```

The script requires a corresponding `data/shops/<id>/upgrade.json`, runs `pnpm --filter apps/<id> build` followed by `deploy`, marks the shop as `published` in `shop.json`, and removes the upgrade metadata file.

### `generate-example-props`

Creates `apps/<id>/src/app/upgrade-preview/example-props.ts` with example props for all exported components:

```bash
pnpm ts-node scripts/src/generate-example-props.ts <shop-id>
```

The `upgrade-shop` script invokes this automatically so previews render reliably.

## API endpoints

- `GET /preview/:pageId?token=<hmac>` – returns page JSON for previews. Tokens are HMAC-SHA256 digests using `PREVIEW_TOKEN_SECRET`.

## Preview UI

CMS components fetch the preview endpoint and render changes live. The wizard's preview reads state from `localStorage` so edits appear instantly, and deployments expose a preview URL (`<shop-id>.pages.dev`) written to `deploy.json`.

## Metadata

- `data/shops/<id>/shop.json` stores `lastUpgrade` and the publish `status`.
- `data/shops/<id>/upgrade.json` captures information about the staged upgrade and is deleted after publishing.
- `data/shops/<id>/deploy.json` stores the `previewUrl` and deployment instructions.
