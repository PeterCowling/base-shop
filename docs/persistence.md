# Persistence

## Inventory persistence

Inventory data can be stored using either a JSON file or a SQLite database. The active backend is selected by the `INVENTORY_BACKEND` environment variable, defaulting to the JSON implementation when unset.

When `INVENTORY_BACKEND` is set to `sqlite`, the repository uses [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) and creates an `inventory.sqlite` file for each shop under the `data/shops/<shop>` directory determined by `DATA_ROOT`. The repository ensures the database exists and bootstraps a single `inventory` table containing SKU, optional product reference and variant attributes, quantity tracking and optional wear & tear fields.

`DATA_ROOT` is resolved at runtime by walking up from the current working directory to find a `data/shops` folder or by honoring an explicit `DATA_ROOT` environment variable.

SQLite operations are performed in transactions to provide atomic updates and avoid partial writes. This approach offers stronger consistency and concurrency guarantees compared to the JSON backend while keeping the deployment lightweight.

*Per-shop SQLite location and schema:*
```ts
const dir = path.join(DATA_ROOT, shop);
await fs.mkdir(dir, { recursive: true });
const db = new ctor(path.join(dir, "inventory.sqlite"));
db.exec(
  "CREATE TABLE IF NOT EXISTS inventory (sku TEXT, productId TEXT, variantAttributes TEXT, quantity INTEGER, lowStockThreshold INTEGER, wearCount INTEGER, wearAndTearLimit INTEGER, maintenanceCycle INTEGER, PRIMARY KEY (sku, variantAttributes))",
);
```

