# Organisms

Composite layout sections composed of atoms and molecules. Each organism owns a
specific UX workflow—product discovery, navigation, checkout review—and exposes
props that let apps plug in data while preserving consistent theming.

Most organisms forward optional layout props (`width`, `height`, `padding`,
`margin`) and accept `className` overrides for additional Tailwind classes.

## Usage

```ts
import {
  ProductCarousel,
  FilterSidebar,
  MiniCart,
  OrderSummary,
} from "@/components/organisms";
```

Pair them with the relevant context providers from `@acme/platform-core` (e.g.
`useCart`, `useLayout`) when the component expects shared state.

## Component reference

| Component | Purpose & key props | Example |
| --- | --- | --- |
| `ProductCarousel` | `products: SKU[]`, responsive sizing via `minItems`/`maxItems` or explicit `desktopItems`/`tabletItems`/`mobileItems`. Optional quick view (`enableQuickView`) with `onAddToCart`. | ```tsx
<ProductCarousel
  products={featuredProducts}
  minItems={2}
  maxItems={4}
  enableQuickView
  onAddToCart={(sku) => console.log("Add", sku.id)}
/> 
``` |
| `FilterSidebar` | Receives `onChange` callback and optional `width`. Opens a Radix dialog that emits selected filters, debounced for better performance. | ```tsx
<FilterSidebar width="w-72" onChange={(filters) => setFilters(filters)} />
``` |
| `MiniCart` | Fly-out drawer bound to the cart context. Accepts a custom `trigger` node and optional drawer `width`. Handles quantity updates, removals and error toasts. | ```tsx
import { Button } from "@/components/atoms/shadcn";

<MiniCart trigger={<Button>Open cart</Button>} width={360} />
``` |
| `OrderSummary` | Displays line items and totals. Accepts optional `cart` and `totals` props for server-rendered data and falls back to the cart context otherwise. | ```tsx
<OrderSummary cart={serverCart} totals={validatedTotals} />
``` |
| `CheckoutStepper` | Guides customers through checkout stages. Provide a `steps: string[]` list and the zero-based `currentStep` index to highlight progress. |

Other organisms—`Header`, `Footer`, `WishlistDrawer`, `LiveChatWidget`,
`StoreLocatorMap`, `ProductGallery`, etc.—follow the same approach: data and
callbacks enter via explicit props and layout tokens are exposed through
`className` or the shared `boxProps` helpers.

### Responsive product displays

`ProductGrid`, `ProductCarousel` and `RecommendationCarousel` can display
different numbers of products per viewport. Provide explicit counts via the
`desktopItems`, `tabletItems` and `mobileItems` props or rely on the adaptive
`minItems`/`maxItems` bounds to let the component choose a value based on
available width.
