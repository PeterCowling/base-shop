# Migrate inventory repositories to Prisma

## Summary
Inventory persistence currently supports a SQLite backend implemented in `inventory.sqlite.server.ts`, storing each shop's data in `data/shops/<shop>/inventory.sqlite`. For consistency with the rest of the platform, which already uses Prisma and PostgreSQL, the inventory repositories should migrate to Prisma.

## Goals
- Replace custom SQLite and JSON backends with a Prisma-based repository.
- Centralize inventory data in PostgreSQL alongside other models.

## Prisma schema changes
```prisma
model InventoryItem {
  id String @id @default(cuid())
  shopId String
  sku String
  productId String?
  variantAttributes Json @default("{}")
  quantity Int
  lowStockThreshold Int?
  wearCount Int?
  wearAndTearLimit Int?
  maintenanceCycle Int?
  Shop Shop @relation(fields: [shopId], references: [id], onDelete: Cascade)
  @@unique([shopId, sku, variantAttributes])
}
```

## Data migration
- Script to iterate through `data/shops/*/inventory.sqlite` databases and upsert records via Prisma.
- Script to convert existing `inventory.json` files to the Prisma model.
- Provide backup strategy for legacy files during migration.

## Tasks
- Extend `packages/platform-core/prisma/schema.prisma` with the `InventoryItem` model and generate a Prisma migration.
- Implement a Prisma-backed `InventoryRepository`.
- Update `inventory.server.ts` to default to the Prisma backend.
- Add migration scripts for SQLite and JSON inventories.
- Remove or deprecate old backends after successful migration.

