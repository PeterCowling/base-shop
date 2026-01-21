# Utility Functions

Shared helpers for platform-core.

- `getShopFromPath(path)` – extract a shop identifier from a URL path.
- `replaceShopInPath(path, shop)` – swap the shop identifier in a path.
- `initTheme` – initialize the client's theme based on saved preferences.
- `logger` – structured console logger; set `LOG_LEVEL` (`error`, `warn`, `info`, `debug`) to control output (defaults to `info`).

These utilities are re-exported from the `@platform-core` package root for
easy consumption. Functions like `slugify` and `genSecret` now live in
`@acme/shared-utils`.
