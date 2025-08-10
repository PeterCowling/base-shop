# Utility Functions

Shared helpers for platform-core.

- `slugify(str)` – convert a string into a URL-friendly slug.
- `genSecret(bytes?)` – create a random hexadecimal secret.
- `fillLocales(values, fallback)` – ensure all supported locales have a value,
  falling back when missing.

These utilities are re-exported from the `@acme/platform-core` package root for
easy consumption.

