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

`ProductGrid`, `ProductCarousel` and `RecommendationCarousel` automatically
adjust how many products are shown based on available width. Use `minItems`
and `maxItems` to constrain the number of visible items so layouts remain
attractive across screen sizes.
