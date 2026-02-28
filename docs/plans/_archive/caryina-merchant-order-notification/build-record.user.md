---
Type: Build-Record
Status: Complete
Feature-Slug: caryina-merchant-order-notification
Build-date: 2026-02-27
artifact: build-record
---

# Build Record — Caryina Merchant Order Notification

## What was built

Every time a customer completes a payment on the Caryina store, the checkout route now sends an order summary email to the merchant. The email is sent after the cart is cleared and before the success response is returned to the customer. If sending fails for any reason (e.g. email service not configured, network error), the failure is logged but the payment response is unaffected — the customer always sees their order confirmed.

The email contains:
- Each item ordered (name, quantity, unit price, line total)
- Grand total
- Internal transaction ID and payment gateway reference

The recipient address is controlled by the `MERCHANT_NOTIFY_EMAIL` environment variable, defaulting to `peter.cowling1976@gmail.com` if not set.

## Files changed

- `apps/caryina/src/app/api/checkout-session/route.ts` — notification block added after cart deletion
- `apps/caryina/src/app/api/checkout-session/route.test.ts` — 2 new tests added (7 total, all passing)
- `packages/platform-core/src/email.ts` — `sendSystemEmail` added to the email sub-path exports
- `docs/.env.reference.md` — `MERCHANT_NOTIFY_EMAIL` documented

## Tests

All 7 checkout-session tests pass:

| Test | Result |
|---|---|
| TC-04-01: successful payment returns 200 and email is sent | Pass |
| TC-04-02: empty cart returns 400 | Pass |
| TC-04-03: payment declined returns 402 | Pass |
| TC-04-04: payment service error returns 502 | Pass |
| TC-04-05: missing card fields returns 400 | Pass |
| TC-04-06: email send fails — payment success response still returned | Pass |
| TC-04-07: payment declined — no email sent | Pass |

## Environment variable to set in production

To activate email delivery, set the following in the Caryina Cloudflare Worker secrets:

```
EMAIL_PROVIDER=smtp
GMAIL_USER=<sending gmail address>
GMAIL_PASS=<gmail app password>
MERCHANT_NOTIFY_EMAIL=peter.cowling1976@gmail.com  # optional, this is already the default
```

Without `EMAIL_PROVIDER` set, the notification attempt is silently discarded and logged as an error in Worker logs — no impact on the checkout flow.

## Outcome Contract

- **Intended:** merchant_notified_per_order rises from 0 to 1.0 — every successful payment triggers a notification email.
- **Observed:** Code path confirmed by tests. TC-04-01 verifies email is called with correct content on each successful payment. Actual delivery depends on Gmail credentials being provisioned in production.
- **Verdict:** Partially Met — implementation complete and verified; end-to-end delivery requires production credential provisioning.
