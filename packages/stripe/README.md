# @acme/stripe

Utilities for interacting with the Stripe API.

## TODO

The current implementation uses dummy Stripe credentials for development.
Replace these placeholders with real secrets before deploying and remove
 the fallback defaults in `packages/config/src/env/payments.ts` once
 proper environment injection is in place.

## Webhook testing

Example Stripe event fixtures live in `test/fixtures` and cover common
scenarios such as `checkout.session.completed` and
`payment_intent.payment_failed`.

Use the helper script to POST these fixtures to a local webhook endpoint:

```
pnpm stripe:send-test-event checkout.session.completed http://localhost:3000/api/stripe-webhook
```

If no URL is provided, the command defaults to
`http://localhost:3000/api/stripe-webhook`.
