# Utility Functions

Common string helpers are available from `@acme/platform-core/utils`.

## `slugify`

Converts a string into a URL‑friendly slug by trimming whitespace, lowercasing
and replacing non‑alphanumeric characters with dashes.

```ts
import { slugify } from "@acme/platform-core/utils";
slugify(" Hello World! "); // "hello-world"
```

## `genSecret`

Generates a random hexadecimal string. Pass the number of bytes to control the
length.

```ts
import { genSecret } from "@acme/platform-core/utils";
const secret = genSecret(8); // 16‑char string
```

## `fillLocales`

Ensures a value exists for all supported locales. Missing entries are filled
with a provided fallback.

```ts
import { fillLocales } from "@acme/platform-core/utils";
fillLocales({ en: "Hello" }, "Hi");
// => { en: "Hello", de: "Hi", ... }
```
