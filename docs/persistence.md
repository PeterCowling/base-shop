# Persistence and `DATA_ROOT`

Prisma with PostgreSQL provides the primary data store. For development or
test scenarios where a database isn't available, certain repositories can
fall back to a simple filesystem backend rooted at `DATA_ROOT`.

## Repositories with disk fallbacks

Currently only the `@acme/platform-core` inventory repository reads and
writes JSON (or SQLite) files under `<DATA_ROOT>/<shop>`. These fallbacks
are meant to support development before a database is configured.

## `DATA_ROOT`

`DATA_ROOT` resolves to the root directory that holds per‑shop data files. If the variable is unset, `resolveDataRoot` walks up from the current working directory looking for `data/shops` and falls back to `<cwd>/data/shops`.

Override it to store data elsewhere or isolate test fixtures:

```bash
DATA_ROOT=/tmp/my-data pnpm dev
```

This environment variable is intended for development and other offline scenarios. Production deployments should replace the filesystem repositories with persistent services such as databases.

