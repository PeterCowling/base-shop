# CMS blocks

Reusable content blocks consumed by the CMS page builder. Blocks expose a
predictable prop interface so the builder can serialise configuration and render
previews on the fly.

Most blocks honour the shared layout props (`width`, `height`, `padding`,
`margin`) in addition to their functional props.

## Usage

- Import blocks via `@ui/components/cms/blocks/*` when composing custom previews.
- Within the CMS, block props are edited through form controls and persisted as
  JSON. The components here map those props to design-system primitives.
- Blocks that fetch remote data (`ProductGrid`, `CollectionList`) handle loading
  and state management internally so the builder can stay declarative.

## Block reference

| Block | Key props | Notes |
| --- | --- | --- |
| `HeroBanner` | `slides?: Slide[]`, optional `minItems`/`maxItems` | Renders the marketing hero carousel. The list is trimmed to `maxItems`; returning fewer than `minItems` hides the block. |
| `CollectionList` | `collections: Category[]`, responsive sizing props, `gapClassName?` | Responsive grid that adapts column count using a `ResizeObserver`. Pass Tailwind gap classes to control spacing. |
| `ProductGrid` | `skus?: SKU[]`, optional `collectionId` (fetches via CMS API), `minItems`/`maxItems`, device-specific counts | Falls back to CMS fixtures when `skus` is omitted. When `collectionId` is set the block fetches live data and memoises results. |
| `ProductCarousel` / `RecommendationCarousel` | `products: SKU[]`, `minItems`, `maxItems`, device-specific props | Proxy to the organism carousels with identical responsive behaviour. Useful for hero rails and personalised lists. |
| `TestimonialSlider` / `ReviewsCarousel` | `items: Testimonial[]`, optional autoplay duration | Displays editorial content with accessible focus management for keyboard users. |
| `StoreLocatorBlock` | `locations: Location[]` | Wraps the map organism and handles geolocation props generated in the CMS UI. |
| `FormBuilderBlock` | `fields`, `ctaLabel`, `successMessage` | Declarative form definition that renders input atoms and posts submissions to the CMS API. |

Additional content blocks—`GiftCardBlock`, `ValueProps`, `NewsletterSignup`,
`PricingTable`, etc.—follow the same pattern: props map one-to-one with the
builder schema so editors can drag, drop and configure content without touching
code.

Refer to the Storybook entries under `CMS/Blocks/*` for full examples, including
typical prop payloads emitted by the page builder.
