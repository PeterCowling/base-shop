# Persistence and `DATA_ROOT`

Prisma with PostgreSQL is the primary datastore. Some repositories offer filesystem fallbacks when a database or remote service isn't configured. Data for these fallbacks is stored under a shop‑specific directory rooted at `DATA_ROOT`, enabling certain demos and tests to run offline.

## Repositories using the database

These repositories default to Prisma when a `DATABASE_URL` is defined. Set the corresponding environment variable to use a filesystem backend instead:

| Repository          | Environment variable        |
| ------------------- | --------------------------- |
| Inventory           | `INVENTORY_BACKEND`         |
| Pages               | `PAGES_BACKEND`             |
| Shop                | `SHOP_BACKEND`              |
| Products            | `PRODUCTS_BACKEND`          |
| Settings            | `SETTINGS_BACKEND`          |
| Theme presets       | `THEME_PRESETS_BACKEND`     |
| Analytics           | `ANALYTICS_BACKEND`         |
| Coupons             | `COUPONS_BACKEND`           |
| SEO audits          | `SEO_AUDIT_BACKEND`         |
| Pricing             | `PRICING_BACKEND`           |
| Return logistics    | `RETURN_LOGISTICS_BACKEND`  |
| Return authorization| `RETURN_AUTH_BACKEND`       |
Each repository above uses a shared resolver that honors its `*_BACKEND` environment variable to switch between Prisma and filesystem stores. A global `DB_MODE` variable provides a default when a repository‑specific variable is unset.

Each variable accepts:

- `json` – read and write JSON files under `<DATA_ROOT>/<shop>`.
- _unset_ – uses Prisma when `DATABASE_URL` is present; otherwise falls back to JSON.

`DB_MODE` accepts the same values and applies them across all repositories unless overridden by a specific `*_BACKEND` variable.

## Repositories with disk fallbacks

The following repositories still read and write JSON or JSONL files under `<DATA_ROOT>/<shop>`:

- `@acme/email` repositories for campaigns, segments and abandoned cart reminders.
- Background services in `@acme/platform-machine` that log analytics or scheduling data.

These fallbacks keep parts of the project functional during development or when the database is unreachable.

## `DATA_ROOT`

`DATA_ROOT` resolves to the root directory that holds per‑shop data files. If the variable is unset, `resolveDataRoot` walks up from the current working directory and selects the outermost `data/shops` directory (typically the one at the repository root). If none is found, it falls back to `<cwd>/data/shops`.

Set `DATA_ROOT` to store data elsewhere, isolate test fixtures, or run the system offline:

```bash
DATA_ROOT=/tmp/my-data pnpm dev
```

This environment variable is intended for development and other offline scenarios. Production deployments should replace the filesystem repositories with persistent services such as databases.

