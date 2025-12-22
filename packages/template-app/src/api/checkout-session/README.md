# Checkout Session API

Creates a Stripe Checkout Session and returns the Checkout Session client secret.

Request: POST `/api/checkout-session`

Body fields:

- `returnDate` (string, optional): ISO date when the rental is returned. Used to compute rental days and pricing. Invalid or non‑positive durations return 400.
- `coupon` (string, optional): Discount code.
- `currency` (string, optional): ISO currency code (default `EUR`).
- `taxRegion` (string, optional): Region key used to look up tax rate.
- `customer` (string, optional): Stripe customer ID to attach the payment to.
- `billing_details` (object, optional):
  - `name` (string)
  - `email` (string)
  - `address` (object): `line1`, `city`, `postal_code`, `country` plus optional `line2` and `state`
  - `phone` (string, optional)
- `shipping` (object, optional):
  - `name` (string)
  - `address` (object): `line1`, `city`, `postal_code`, `country` plus optional `line2` and `state`
  - `phone` (string, optional)
- `coverage` (string[], optional): Coverage add‑ons; adds a line‑item and may reduce deposit when applicable.

Headers:

- `x-forwarded-for`: Client IP for Stripe risk checks; forwarded as `Stripe-Client-IP`.

Response 200 JSON:

```json
{ "sessionId": "cs_...", "clientSecret": "cs_test_..._secret_...", "orderId": "01H..." }
```

Error responses:

- 400 `{ "error": "Cart is empty" }`
- 400 `{ "error": "Invalid returnDate" }`
- 409 `{ "error": "Insufficient stock" }`
- 502 `{ "error": "Checkout failed" }`
