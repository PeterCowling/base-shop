# Molecules

Composable building blocks that combine multiple atoms into richer UI elements.
Most molecules expose optional layout helpers (`width`, `height`, `padding`,
`margin`) via the shared `boxProps` utility so pages can adjust spacing without
forking the component.

## Usage

```ts
import {
  SearchBar,
  PaginationControl,
  PriceCluster,
  QuantityInput,
} from "@/components/molecules";
```

Molecules tend to orchestrate behaviour (search suggestions, quantity counters,
form labels) so downstream apps only need to forward event handlers.

## Component reference

| Component | Key props | Example |
| --- | --- | --- |
| `SearchBar` | `suggestions: string[]`, `label: string`, optional `onSearch`/`onSelect` callbacks. Maintains highlighted suggestion state for keyboard users. | ```tsx
<SearchBar
  label="Search products"
  suggestions={popularQueries}
  onSearch={(value) => router.push(`/search?q=${encodeURIComponent(value)}`)}
/>
``` |
| `PaginationControl` | `page: number`, `pageCount: number`, `onPageChange?: (page) => void`. Renders up to five buttons and previous/next controls. | ```tsx
<PaginationControl page={page} pageCount={totalPages} onPageChange={setPage} />
``` |
| `PriceCluster` | `price: number`, optional `compare` and `currency`. Automatically displays a discount badge when `compare` is higher than `price`. | ```tsx
<PriceCluster price={49} compare={79} currency="USD" />
``` |
| `QuantityInput` | `value`, optional `min`, `max`, `onChange`. Emits next value when the +/- buttons are pressed. | ```tsx
<QuantityInput value={qty} min={1} max={10} onChange={setQty} />
``` |
| `FormField` | `label`, optional `htmlFor`, `error`, `required`, layout props. Wraps custom form controls with accessible labelling and error messaging. | ```tsx
import { Input } from "@/components/atoms/shadcn";

<FormField label="Email" htmlFor="email" required error={errors.email}>
  <Input id="email" type="email" value={form.email} onChange={handleChange} />
</FormField>
``` |

Other molecules—such as `Breadcrumbs`, `CurrencySwitcher`,
`PaymentMethodSelector` and the sustainability badges—follow the same patterns:
explicit props for configuration plus layout overrides via `boxProps`.

## Examples

Storybook showcases each molecule under the `Molecules/*` hierarchy. Prefer the
documented events and layout props over manipulating DOM structure manually; the
components encapsulate keyboard interactions, ARIA attributes and theming tokens
that the CMS and storefront rely on.
