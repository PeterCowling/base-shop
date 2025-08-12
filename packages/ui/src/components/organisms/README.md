# Organisms

Composite layout sections composed of atoms and molecules.

Organisms must expose `width`, `height`, `padding` and `margin`
props to control their rendered dimensions.

Current components:

- `Header`
- `SideNav`
- `Footer`
- `Content`
- `StatsGrid`
- `DataTable`
  `ProductCard`
- `ProductCarousel`
- `ProductGrid`
- `ProductFeatures`
- `ProductVariantSelector`
- `ReviewsList`
- `StoreLocatorMap`
- `LiveChatWidget`
- `OrderTrackingTimeline`
- `AccountPanel`
- `DeliveryScheduler`
- `CheckoutStepper`
- `FilterSidebar`
- `WishlistDrawer`
- `QAModule`
- `MiniCart`
- `StickyAddToCartBar`
- `RecommendationCarousel`
- `CategoryCard`
- `ProductGallery`
- `OrderSummary`

## Responsive Product Displays

`ProductGrid`, `ProductCarousel` and `RecommendationCarousel` can display
different numbers of products per viewport. Configure `desktopItems`,
`tabletItems` and `mobileItems` for explicit device counts. When left unset,
the components fall back to responsive `minItems`/`maxItems` bounds.
