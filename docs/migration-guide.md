Type: Guide
Status: Reference
Domain: Platform
Last-reviewed: 2025-12-02

# Migration Guide

Use the `migrate-shop` script to transition a shop to the new theme and token system.

```bash
pnpm tsx scripts/migrate-shop.ts --dry-run
```

Run with `--apply` to create a migration branch and apply codemods.

## Migrate Pages from `pages.json`

Legacy shops stored page definitions in `data/<shop>/pages.json`. The
`migrate-pages` script relocates these files into the new
`data/shops/<shop>/pages.json` structure used by the CMS.

```bash
pnpm tsx scripts/migrate-pages.ts
```

Run the script once; it will move each existing `pages.json` into the
correct location and skip shops that are already migrated.

## Import Users and Customers

User and customer records can be migrated into the Prisma tables using a
simple seeding script:

1. Export existing user and customer data to JSON or CSV.
2. Write a seed script that loads the data and calls the Prisma client to
   create `User` and `CustomerProfile` records.
3. Execute the seed with `pnpm tsx path/to/seed.ts` after running `prisma
   db push` to ensure the schema exists.

Passwords should be hashed before inserting, and any related tables such as
`CustomerMfa` should be populated as needed.

## Inventory Migration

Inventory currently uses JSON-based storage as a fallback. When moving
inventory data to Prisma or another service, export the existing JSON files
and import them into the new storage layer using the tooling provided by that
system. See [Inventory Migration](./inventory-migration.md) for up-to-date
migration steps. Keep the export handy so the migration can be repeated if the
target storage changes again.

How to use this doc now:

- This guide is primarily for **one-off migrations** of legacy shops between older storage/layouts and the current system.
- For new shops and ongoing behaviour:
  - Prefer `docs/architecture.md`, `docs/persistence.md`, and `docs/platform-vs-apps.md`.
  - Treat the scripts and commands here as examples rather than canonical interfaces.
