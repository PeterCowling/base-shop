# Shared Utilities

## formatPrice

`formatPrice` provides consistent currency formatting in both browser and Node.js environments.

### Client usage

```tsx
import { formatPrice } from "@acme/shared-utils";

export function PriceTag({ amount }: { amount: number }) {
  return <span>{formatPrice(amount, "EUR")}</span>;
}
```

### Server usage

```ts
import { formatPrice } from "@acme/shared-utils";

export function getTotal() {
  const total = 42;
  return formatPrice(total, "EUR", "en-US");
}
```

The helper wraps `Intl.NumberFormat` so the output respects the provided locale and currency.
