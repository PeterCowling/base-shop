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

## Responsive Carousels

`ProductCarousel` and `RecommendationCarousel` automatically adjust their
visible item count based on screen width. The `minItems` and `maxItems` props
allow callers to bound how many products appear at once.
