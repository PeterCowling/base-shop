# Migration Guide

Use the `migrate-shop` script to transition a shop to the new theme and token system.

```bash
pnpm tsx scripts/migrate-shop.ts --dry-run
```

Run with `--apply` to create a migration branch and apply codemods.
