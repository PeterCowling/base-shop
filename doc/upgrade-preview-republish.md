# Upgrade, preview and republish

The `upgrade-shop` script stages template changes into an existing shop app.

## Upgrade

Run the script with a shop identifier to copy files from the template:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id>
```

Existing files are backed up next to their originals using a `.bak` suffix before
being replaced. The shop's `shop.json` gains a `lastUpgrade` timestamp so the
operation can be tracked.

## Rollback

If an upgrade needs to be undone, invoke the script with `--rollback`:

```bash
pnpm ts-node scripts/src/upgrade-shop.ts <shop-id> --rollback
```

All `.bak` files are restored to their original locations and the `lastUpgrade`
metadata is removed from `shop.json`.
