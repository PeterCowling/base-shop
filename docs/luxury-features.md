Type: Guide
Status: Active
Domain: Commerce
Last-reviewed: 2025-12-02

# Luxury Features

Base Shop includes several optional "luxury" modules. All toggles default to `false`
and the shop operates normally without them. Enable features in a shop's
`luxuryFeatures` settings or via environment variables exposed through
`@platform-core/features`.

## Available Features

| Feature | How to Enable | Notes |
| ------- | ------------- | ----- |
| `blog` | Set `luxuryFeatures.blog` to `true` in shop settings. | Enables the editorial blog and related CMS endpoints. |
| `contentMerchandising` | Set `luxuryFeatures.contentMerchandising` to `true` in shop settings. | Requires the blog to be enabled. Has no effect for shops that do not publish content. |
| `raTicketing` | Set `luxuryFeatures.raTicketing` to `true` **and** enable the `raTicketing` flag in `@platform-core/features` (env `LUXURY_FEATURES_RA_TICKETING`). | Adds Return Authorization dashboard in the CMS. Shops that do not process returns should keep this disabled. |
| `fraudReviewThreshold` | Provide a number greater than `0` for `luxuryFeatures.fraudReviewThreshold`. | Used in the Stripe webhook to trigger manual review; ignored for non‑Stripe flows. |
| `requireStrongCustomerAuth` | Set `luxuryFeatures.requireStrongCustomerAuth` to `true`. | Forces 3‑D Secure on qualifying Stripe checkouts. Irrelevant when using other payment providers. |
| `strictReturnConditions` | Set `luxuryFeatures.strictReturnConditions` to `true`. | The return request API rejects worn or tagless items. Not needed for buy‑only shops. |
| `returns` | Set `luxuryFeatures.returns` to `true` **and** enable the environment flag `LUXURY_FEATURES_RETURNS`. | Allows shoppers to request returns and generate carrier labels. |
| `trackingDashboard` | Set `luxuryFeatures.trackingDashboard` to `true` **and** enable the environment flag `LUXURY_FEATURES_TRACKING_DASHBOARD`. | Provides shipment and return tracking dashboards. Disable for businesses without shipment tracking. |

## Compatibility

These features were designed for high‑touch rental and luxury retail shops.
Other business types can safely leave them disabled. Each module falls back to
standard behavior when its toggle is `false`, so non‑luxury shops retain normal
checkout, return, and CMS flows.
