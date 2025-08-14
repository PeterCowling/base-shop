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

Shops can configure additional fraud protection under `luxuryFeatures`:

- `fraudReviewThreshold` (number): charges above this amount are placed into manual review.
- `requireStrongCustomerAuth` (boolean): when enabled, 3‑D Secure verification is requested for qualifying charges.
