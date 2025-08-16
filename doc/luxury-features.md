# Luxury Features

The platform includes optional modules tailored for high-end shops. All feature flags default to `false` so shops operate normally without them.

## Environment flags

Configure global features through environment variables or the `features` service (`@platform-core/features`).

- `LUXURY_FEATURES_RA_TICKETING`
  - Enables Return Authorization ticketing in the CMS.
  - When `false`, the RA page is hidden and the shop continues without ticketing.
- `LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD`
  - Deposit amount that triggers manual fraud review.
  - Set to `0` to disable reviews. Works with all shop types.
- `LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH`
  - Requests 3‑D Secure for deposits exceeding the fraud review threshold.
  - Ignored unless `LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD` is greater than `0`.

## Shop settings

Per‑shop settings live under `luxuryFeatures` in `ShopSettings`:

- `contentMerchandising` – integrates product pages with an editorial blog. Only enable when the blog module is configured.
- `strictReturnConditions` – enforces tighter return checks. Standard retail businesses may prefer the default behaviour.

## Enabling features

1. Set the desired environment variables to `true` or a numeric threshold.
2. Update the shop's `luxuryFeatures` settings as needed.
3. Deploy with these values so other business types remain unaffected.

All flags default to `false`, providing safe fallbacks across the platform.
