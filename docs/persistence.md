# Persistence and `DATA_ROOT`

Many repositories use a simple filesystem backend when a database or remote service isn't configured. Data is stored under a shop-specific directory rooted at `DATA_ROOT` so the demo and tests work completely offline.

## Repositories with disk fallbacks

The following repositories read and write JSON or JSONL files under `<DATA_ROOT>/<shop>`:

- `@acme/platform-core` repositories for shops, products, pages, settings, theme presets, analytics and SEO audits.
- `@acme/email` repositories for campaigns, segments and abandoned cart reminders.
- Background services in `@acme/platform-machine` that log analytics or scheduling data.

These fallbacks keep the project functional during development before wiring up a real database and make it easy to run the stack without any external dependencies.

## `DATA_ROOT`

`DATA_ROOT` resolves to the root directory that holds per‑shop data files. If the variable is unset, `resolveDataRoot` walks up from the current working directory looking for `data/shops` and falls back to `<cwd>/data/shops`.

Override it to store data elsewhere, isolate test fixtures or run the system offline:

```bash
DATA_ROOT=/tmp/my-data pnpm dev
```

This environment variable is intended for development and other offline scenarios. Production deployments should replace the filesystem repositories with persistent services such as databases.

