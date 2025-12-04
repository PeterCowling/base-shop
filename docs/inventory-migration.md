Type: Guide
Status: Reference
Domain: Inventory
Last-reviewed: 2025-12-02

# Inventory Migration Plan

This document outlines the strategy for migrating inventory data from existing JSON sources to a more consistent storage layer such as Prisma with a PostgreSQL database. Inventory data currently lives in JSON files.

How to use this doc now:

- Treat this as a **reference migration plan** for legacy shops that still rely on JSON-backed inventory.
- For new work and current behaviour, consult:
  - `docs/persistence.md` (backend selection and `*_BACKEND` semantics), and
  - `packages/platform-core/src/repositories/inventory.*.server.ts` for the current repository implementations.

## Goals

- Consolidate inventory data into a single relational source of truth
- Preserve historical records and relationships during migration
- Provide a repeatable export/import workflow for future migrations

## Prerequisites

- A Prisma schema defining `InventoryItem`, `InventoryLevel`, and related tables
- Access to the current JSON files
- Node.js environment with `@prisma/client` and CLI tooling installed

## Export Strategy

Current inventory data is sourced from `data/shops/<shop>/inventory.json` files or via Prisma.

1. **JSON**: Copy existing JSON files from `data/shops/<shop>/inventory.json` and normalize them to match the Prisma schema.
2. Store exports in a version-controlled `migrations/inventory` directory to allow reruns and auditing.

## Import Strategy

1. Initialize the target database: `pnpm prisma migrate deploy` or `prisma db push`.
2. Import JSON fixtures using the provided script:

   ```bash
   pnpm tsx scripts/src/inventory/import-json-to-postgres.ts --shop my-shop
   ```

   Pass `--dry-run` to preview changes without writing to the database.

3. Verify counts using the inventory check script to ensure parity with the original dataset.

   ```bash
   pnpm tsx scripts/src/inventory/check-inventory.ts --shop my-shop
   ```

   You can also run the packaged command `pnpm inventory:check` which invokes the same script.

## Tooling

- **Prisma CLI** for schema management and database access
- **TSX** or `ts-node` for running migration scripts
- Optional: `csv-parse` or `fast-csv` for handling CSV exports
- Optional: custom scripts in `scripts/` to automate export, transform, and import steps

## Backup Plan

Keep the JSON exports; they serve as the authoritative backup for inventory data. If issues arise, re-import the JSON files using the import script and update application configuration accordingly.
