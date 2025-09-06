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

Inventory currently relies on a local SQLite database. When inventory data
is moved to another database or service, export the existing SQLite tables
and import them into the new storage layer using the tooling provided by
that system. Keep the export handy so the migration can be repeated if the
target storage changes again.
