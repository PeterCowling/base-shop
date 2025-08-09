# Date Formatting Helper

UI components should use `formatTimestamp(ts, locale?)` from `@/lib/date` to display dates. It wraps `new Date(ts).toLocaleString(locale)` to ensure consistent, locale-aware formatting across the application.

```ts
import { formatTimestamp } from "@/lib/date";

formatTimestamp("2024-07-01T12:00:00Z");
```

Provide a locale string if you need to override the user's default:

```ts
formatTimestamp("2024-07-01T12:00:00Z", "en-GB");
```
