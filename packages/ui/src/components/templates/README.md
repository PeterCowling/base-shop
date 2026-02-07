# Templates

Shared page-level layouts that compose atoms, molecules and organisms into
complete experiences. Templates wire up data slots, orchestrate context
providers and expose configuration hooks so apps can swap in bespoke content.

## Usage

```tsx
import { AppShell, DashboardTemplate } from "@ui/components/templates";
import { Header, Footer, SideNav } from "@ui/components/organisms";

export default function DashboardPage() {
  return (
    <AppShell
      header={<Header locale="en" shopName="Acme" />}
      sideNav={<SideNav />}
      footer={<Footer shopName="Acme" />}
    >
      <DashboardTemplate stats={stats} />
    </AppShell>
  );
}
```

`AppShell` wraps children with the shared `ThemeProvider` and `LayoutProvider` so
breadcrumbs, mobile navigation and tokens are available via `useLayout()` and
`useTheme()`.

## Template reference

| Template | Purpose & key props |
| --- | --- |
| `AppShell` | Page chrome with header, side navigation and footer slots. Accepts `className` overrides and renders children inside a responsive main area. Automatically wires `ThemeProvider` and `LayoutProvider`. |
| `DashboardTemplate` / `AnalyticsDashboardTemplate` | Dashboard layouts that expect a `stats: StatItem[]` array plus optional chart/table data. Pair with `StatsGrid` or analytics organisms for detail panes. |
| `ProductDetailTemplate` | Hero layout for a single `product: SKU`. Supports optional `badges`, `onAddToCart` callback and custom `ctaLabel`. Automatically renders media, pricing and description blocks. |
| `SearchResultsTemplate` | Search landing page with `suggestions`, `results`, pagination details and optional filters. Accepts `minItems`/`maxItems` to control grid density and `isLoading` to show skeletons. |
| `CheckoutTemplate` | Multi-step checkout workflow. Provide `steps: { label; content }[]`, optionally `initialStep`, and respond to `onStepChange`/`onComplete` callbacks. |
| `ProductGalleryTemplate` / `RecommendationCarouselTemplate` | Catalog browsing layouts that forward `minItems`/`maxItems` and device-specific props to the underlying carousel/grid organisms. |
| `OrderConfirmationTemplate`, `CartTemplate`, `WishlistTemplate` | Post-purchase and account flows that accept line items, totals and callback handlers for editing cart state. |

Additional templates such as `StoreLocatorTemplate`, `LiveShoppingEventTemplate`,
`LoyaltyHubTemplate`, `OrderTrackingTemplate` and error pages (`Error404Template`,
`Error500Template`) provide specialised shells for their respective workflows. In
each case the API mirrors the underlying organisms—pass data via named props and
attach event handlers for interactivity.

## Examples

Storybook groups templates under `Templates/*`. These stories demonstrate the
expected data shapes (sample SKUs, analytics stats, streaming metadata). Use
them as a reference when supplying props from the CMS or storefront apps.
