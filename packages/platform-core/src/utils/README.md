# Utility Functions

Shared helpers for platform-core.

- `getShopFromPath(path)` – extract a shop identifier from a URL path.
- `replaceShopInPath(path, shop)` – swap the shop identifier in a path.

These utilities are re-exported from the `@acme/platform-core` package root for
easy consumption. Functions like `slugify` and `genSecret` now live in
`@acme/shared-utils`.
