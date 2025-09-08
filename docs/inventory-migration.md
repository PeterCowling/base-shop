# Inventory Migration Plan

This document outlines the strategy for migrating inventory data from existing JSON sources to a more consistent storage layer such as Prisma with a PostgreSQL database. Inventory data currently lives in JSON files; there is no live SQLite store. The `.sqlite.server` repository is a no-op proxy that delegates all operations to the JSON implementation. Every `*.sqlite.server.ts` module simply forwards calls to the JSON repository, so these files can be ignored entirely during the migration.

## Goals

- Consolidate inventory data into a single relational source of truth
- Preserve historical records and relationships during migration
- Provide a repeatable export/import workflow for future migrations

## Prerequisites

- A Prisma schema defining `InventoryItem`, `InventoryLevel`, and related tables
- Access to the current JSON files (historical SQLite dumps can be exported if available)
- Node.js environment with `@prisma/client` and CLI tooling installed

## Export Strategy

1. **SQLite (historical only)**: If you have legacy SQLite databases, use the `sqlite3` CLI or a Node script with `better-sqlite3` to dump tables to JSON or CSV.
   ```bash
   sqlite3 data/inventory.db ".mode json" "select * from items;" > inventory-items.json
   ```
2. **JSON**: Copy existing JSON files from `data/shops/<shop>/inventory.json` and normalize them to match the Prisma schema.
3. Store exports in a version-controlled `migrations/inventory` directory to allow reruns and auditing.

## Import Strategy

1. Initialize the target database: `pnpm prisma migrate deploy` or `prisma db push`.
2. Import JSON fixtures using the provided script:

   ```bash
   pnpm tsx scripts/src/inventory/import-json-to-postgres.ts --shop my-shop
   ```

   Pass `--dry-run` to preview changes without writing to the database.
3. Verify counts with `pnpm tsx scripts/check-inventory.ts` to ensure parity with the original dataset.

## Tooling

- **Prisma CLI** for schema management and database access
- **TSX** or `ts-node` for running migration scripts
- Optional: `csv-parse` or `fast-csv` for handling CSV exports
- Optional: custom scripts in `scripts/` to automate export, transform, and import steps

## Backup Plan

Keep the JSON exports; they serve as the authoritative backup for inventory data. If issues arise, re-import the JSON files using the import script and update application configuration accordingly.
