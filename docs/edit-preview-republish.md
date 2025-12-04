Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02

# Edit components, preview and republish

Shop owners can tweak individual components in their shops without touching the underlying template. Edits are staged locally so they can be reviewed before publishing.

## Edit components

Use the CMS or theme editor to modify component properties such as text, images or layout options. Save the changes to persist them to the shop's data files.

## Preview with `/edit-preview`

Navigate to `/edit-preview` in the running shop to see the edits rendered. The route loads the staged component data and lets owners validate changes in context before they go live.

Use the device menu to preview common screen sizes:

- Desktop 1280
- Desktop 1440
- iPad
- iPad Pro
- iPhone SE
- iPhone 12
- Galaxy S8

Switch via the desktop/tablet/mobile buttons or the dropdown. The selection is not persisted and resets to **Desktop 1280** on reload.

## Republish the shop

After verifying the preview, rebuild and deploy the shop so the edits appear on the live site:

```bash
pnpm ts-node scripts/src/republish-shop.ts <shop-id>
```

The script rebuilds the shop, deploys it and marks it as `published` in `data/shops/<id>/shop.json`.

## How this differs from upgrading

The edit flow focuses on content tweaks made through the CMS. By contrast, the [upgrade flow](./upgrade-preview-republish.md) applies template updates using `upgrade-shop` before republishing. Upgrades may overwrite files and require a backup/rollback plan, while simple component edits only affect the shop's data.
