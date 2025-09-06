# Inventory Migration Plan

This document outlines the strategy for migrating inventory data from existing SQLite or JSON sources to a more consistent storage layer such as Prisma with a PostgreSQL database.

## Goals

- Consolidate inventory data into a single relational source of truth
- Preserve historical records and relationships during migration
- Provide a repeatable export/import workflow for future migrations

## Prerequisites

- A Prisma schema defining `InventoryItem`, `InventoryLevel`, and related tables
- Access to the current SQLite database or JSON files
- Node.js environment with `@prisma/client` and CLI tooling installed

## Export Strategy

1. **SQLite**: Use the `sqlite3` CLI or a Node script with `better-sqlite3` to dump tables to JSON or CSV.
   ```bash
   sqlite3 data/inventory.db \".mode json\" \"select * from items;\" > inventory-items.json
   ```
2. **JSON**: Copy existing JSON files from `data/shops/<shop>/inventory.json` and normalize them to match the Prisma schema.
3. Store exports in a version-controlled `migrations/inventory` directory to allow reruns and auditing.

## Import Strategy

1. Initialize the target database: `pnpm prisma migrate deploy` or `prisma db push`.
2. Write an import script using the Prisma client:

   ```ts
   import { PrismaClient } from "@prisma/client";
   import items from "./inventory-items.json" assert { type: "json" };

   const prisma = new PrismaClient();
   await prisma.inventoryItem.createMany({ data: items });
   ```

3. Run the script with `pnpm tsx scripts/import-inventory.ts`.
4. Verify counts with `pnpm tsx scripts/check-inventory.ts` to ensure parity with the original dataset.

## Tooling

- **Prisma CLI** for schema management and database access
- **TSX** or `ts-node` for running migration scripts
- Optional: `csv-parse` or `fast-csv` for handling CSV exports
- Optional: custom scripts in `scripts/` to automate export, transform, and import steps

## Rollback Plan

Keep the original SQLite/JSON exports. If issues arise, restore the previous inventory system by reloading the data into SQLite and updating application configuration accordingly.
