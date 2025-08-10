# Templates

Shared page-level layouts used across apps. Currently includes:

- `AppShell` – flex layout with slots for header, side navigation and footer. It
  automatically wraps children with `LayoutProvider` so breadcrumbs and mobile
  navigation state are available via `useLayout()`.
  - `DashboardTemplate` – basic stats overview.
- `AnalyticsDashboardTemplate` – stats, line chart and table for dashboards.
- `ProductGalleryTemplate` – grid or carousel listing of products. Supports
  `minItems` and `maxItems` to control the responsive number of items per row
  or slide.
- `ProductDetailTemplate` – hero-style view for a single product.
- `FeaturedProductTemplate` – showcase layout for highlighting a product.
- `ProductComparisonTemplate` – side-by-side view of multiple products.
- `HomepageTemplate` – layout with hero and recommendation slots.
- `CartTemplate` – editable list of cart items with totals.
- `CategoryCollectionTemplate` – grid of category cards.
- `SearchResultsTemplate` – search bar with paginated product results. Accepts
  `minItems` and `maxItems` to adjust the responsive product grid.
- `CheckoutTemplate` – multi-step layout for collecting checkout information.
- `OrderConfirmationTemplate` – summary of purchased items and totals.
- `WishlistTemplate` – list of saved items with add-to-cart and remove actions.
- `AccountDashboardTemplate` – overview of user details, stats and order list.
- `StoreLocatorTemplate` – map view with a list of store locations.
- `LiveShoppingEventTemplate` – live video with chat and product highlights.
- `LoyaltyHubTemplate` – dashboard for customer loyalty stats and history.
- `Error404Template` – simple page not found layout.
- `Error500Template` – generic server error page.
- `MarketingEmailTemplate` – responsive layout for promotional emails.
- `OrderTrackingTemplate` – progress tracker for shipping status.
- `ProductMediaGalleryTemplate` – gallery view focused on media assets.
