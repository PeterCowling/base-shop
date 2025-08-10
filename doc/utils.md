# Utility Functions

The `@acme/platform-core` package exposes helper functions for string processing.

- `slugify(str)`: Convert a string into a URL-friendly slug.
- `genSecret(bytes?)`: Generate a random secret as a hexadecimal string.
- `fillLocales(values, fallback)`: Ensure all locales have a value, filling missing entries with the provided fallback.

Import them from the utils barrel:

```ts
import { slugify, genSecret, fillLocales } from "@acme/platform-core/utils";
```
