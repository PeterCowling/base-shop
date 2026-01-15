## Prisma change: RentalOrder lineItems for variant linkage

- Added `lineItems Json?` to `RentalOrder` in `packages/platform-core/prisma/schema.prisma`.
- Purpose: store per-variant allocation info (sku/productId/variantAttributes/quantity) to feed inventory ledger and order/return reconciliation.
- Follow-up: run Prisma migrate for environments using the DB backend. JSON field is backwards-compatible; existing rows remain valid.
- Migration file: `packages/platform-core/prisma/migrations/20251229_add_rentalorder_lineitems/migration.sql`
