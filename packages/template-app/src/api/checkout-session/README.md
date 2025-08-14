# Checkout Session API

Clients must provide the following fields when POSTing to `/api/checkout-session`:

- `customer` (string, optional): Stripe customer ID to attach the payment to.
- `billing_details` (object):
  - `name` (string)
  - `email` (string)
  - `address` (object): `line1`, `city`, `postal_code`, `country` plus optional `line2` and `state`
  - `phone` (string, optional)
- `shipping` (object):
  - `name` (string)
  - `address` (object): `line1`, `city`, `postal_code`, `country` plus optional `line2` and `state`
  - `phone` (string, optional)

The client's IP address should be set via the `x-forwarded-for` header so it can be forwarded to Stripe for fraud checks.

## Luxury features

Shops may configure optional **luxuryFeatures** in the CMS:

- `fraudReviewThreshold` – charges above this amount are sent for manual review.
- `requireStrongCustomerAuth` – when enabled, qualifying payments request 3D Secure verification.

When these options are enabled and a checkout exceeds the threshold, the platform will mark the charge for review and, if requested, require Strong Customer Authentication.
