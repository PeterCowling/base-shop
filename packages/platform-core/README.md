# Platform Core

## Utilities

The `utils` module exposes a collection of helper functions that can be
used across the platform:

- **`slugify`** – Convert a string into a URL-friendly slug.
- **`genSecret`** – Generate a random hexadecimal secret.
- **`fillLocales`** – Ensure values exist for all supported locales, filling
  missing entries with a fallback.

Import them via the package index:

```ts
import { slugify, genSecret, fillLocales } from "@acme/platform-core";
```

