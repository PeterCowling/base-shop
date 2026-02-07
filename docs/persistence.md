Type: Contract
Status: Canonical
Domain: Platform
Last-reviewed: 2025-12-02

Canonical code:
- packages/platform-core/src/repositories/**
- packages/platform-core/src/dataRoot.ts

# Persistence and `DATA_ROOT`

Prisma with PostgreSQL is the primary datastore. Some repositories offer filesystem fallbacks when a database or remote service isn't configured. Data for these fallbacks is stored under a shop‑specific directory rooted at `DATA_ROOT`, enabling certain demos and tests to run offline.

## Repositories using the database

These repositories can use either Prisma (PostgreSQL) or a JSON filesystem backend. Each one resolves **exactly one backend per process** and never falls back between DB and JSON in its primary read/write paths once selected.

Use the corresponding environment variable to select the backend explicitly:

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

Each repository above uses a shared resolver that honors its `*_BACKEND` environment variable to select Prisma or JSON. A global `DB_MODE` variable provides a default when a repository‑specific variable is unset.

Each variable accepts:

- `json` – use the JSON filesystem backend exclusively. All reads and writes go through the JSON repository under `<DATA_ROOT>/<shop>`. Prisma is not consulted for that repo:
  - The Prisma delegate is never touched.
  - `DATABASE_URL` may be unset.
- `prisma` – use the Prisma/PostgreSQL backend exclusively. If `DATABASE_URL` is missing, or the required Prisma model delegate is not available, the repository fails fast instead of silently falling back to JSON.
- _unset_ – defers to `DB_MODE` when it is set. If both the repo‑specific variable and `DB_MODE` are unset, the resolver uses a legacy auto‑detection mode for backwards compatibility:
  - When `DATABASE_URL` is set and a Prisma model delegate exists, Prisma is used.
  - Otherwise the JSON backend is used.

## Failure surface and telemetry

- When a backend is explicitly set to `prisma`, errors such as a missing model delegate or transaction failures are surfaced to callers instead of falling back to JSON. Inventory routes respond with HTTP 503 in this case; CLI tools and jobs should do the same (log and retry/alert) rather than assuming a silent JSON write succeeded.
- Log inventory/backend errors so observability captures upstream outages; do not down-level to 4xx for these cases.

`DB_MODE` accepts the same values (`"json"` or `"prisma"`) and applies them across all repositories unless overridden by a specific `*_BACKEND` variable. Any other value for `*_BACKEND` or `DB_MODE` is treated as an error and will cause the resolver to throw with a clear message.

## Shops, settings, and operational metadata

For shops and settings there is an explicit split between **business state** (canonical in Prisma in shared environments) and **operational metadata** (canonical under `data/shops/<id>`).

### Business state (Prisma)

In **DB mode** (that is, when `SHOP_BACKEND` / `SETTINGS_BACKEND` resolve to `"prisma"` via their own values or via `DB_MODE`, or when both are unset and the legacy auto‑detection chooses Prisma because `DATABASE_URL` and the Prisma models are available):

- `Shop` rows in Prisma own the business shape of a shop:
  - Identity and branding: `id`, `name`, `logo`, `homeTitle`, `homeDescription`, `homeImage`.
  - Navigation and layout: `navigation`, `catalogFilters`, `filterMappings`, `themeId`, `themeDefaults`, `themeOverrides`, `themeTokens`.
  - Behaviour flags: `type`, `coverageIncluded`, `analyticsEnabled`, `returnsEnabled`, `rentalInventoryAllocation`, `subscriptionsEnabled`, `rentalSubscriptions`, `luxuryFeatures`, `lateFeePolicy`, `enableEditorial`, `editorialBlog`, `sanityBlog`, `domain`, `returnPolicyUrl`, `showCleaningTransparency`.
- `ShopSettings` rows in Prisma own per‑shop checkout and returns configuration:
  - Localisation and SEO: `languages`, `seo`.
  - Payments and tax: `currency`, `taxRegion`.
  - Services and flows: `depositService`, `reverseLogisticsService`, `lateFeeService`, `returnService`, `premierDelivery`, `stockAlert`, `trackingEnabled`, `trackingProviders`, `editorialBlog`, `luxuryFeatures`.
  - Audit fields: `updatedAt`, `updatedBy`.

These fields are read and written via Prisma‑backed repositories:

- `@acme/platform-core/repositories/shop.server` for low‑level access (`getShopById`, `updateShopInRepo`).
- `@acme/platform-core/repositories/shops.server` for higher‑level helpers (`readShop`, `writeShop`).
- `@acme/platform-core/repositories/settings.server` for `ShopSettings` (`getShopSettings`, `saveShopSettings`, `diffHistory`).

In DB mode, domain code must not read business fields from the filesystem; JSON under `DATA_ROOT` is treated as a mirror or seed only when the corresponding backend is explicitly set to `"json"` for that repository.

### Operational metadata (filesystem under `DATA_ROOT`)

Operational and deployment metadata for each shop live under `data/shops/<id>`:

- `shop.json`:
  - Operational fields such as `status`, `lastUpgrade`, and `componentVersions`.
  - These fields are manipulated by upgrade/deploy tooling (for example `upgrade-shop`, `republish-shop`, `rollback-shop`, and the `/api/publish-upgrade` route) and are treated as the source of truth for:
    - Which template/UI versions a shop currently runs (`componentVersions`).
    - When the last upgrade was staged or applied (`lastUpgrade`).
    - Whether the latest deployment is considered published (`status`).
  - When a field like `navigation` exists both in Prisma `Shop.data` and in `shop.json`, Prisma is authoritative; JSON is a denormalised mirror written via shared repositories, not a second source of truth.
- `deploy.json`:
  - Deployment adapter status, `previewUrl`, and any human‑readable instructions from the deployment adapter.
- `upgrade.json` and `upgrade-changes.json`:
  - Metadata about staged upgrades (changed components, affected pages, and target versions).
- `history.json`:
  - An append‑only history of previous `componentVersions`/`lastUpgrade` snapshots used for rollback.
- `audit.log`:
  - Per‑shop audit events such as republish and rollback actions.

In **JSON mode** (`SHOP_BACKEND="json"` or `SETTINGS_BACKEND="json"`, or `DB_MODE="json"` with no repo‑specific override), the corresponding repositories use JSON under `DATA_ROOT` as their sole source of truth for both business and operational data. Prisma is ignored for those repositories and `DATABASE_URL` may be unset. This keeps local/offline demos and tests lightweight while still enforcing Prisma as canonical in shared environments.

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
