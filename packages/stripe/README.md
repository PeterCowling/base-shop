# @acme/stripe

Utilities for interacting with the Stripe API.

## Mocking during development

Set the `STRIPE_USE_MOCK` environment variable to `true` to replace the
real Stripe client with a lightweight mock. The mock logs all requests and
returns predictable dummy data:

```ts
process.env.STRIPE_USE_MOCK = "true";
import { stripe } from "@acme/stripe";

await stripe.checkout.sessions.create({
  mode: "payment",
  success_url: "https://example.com/success",
  cancel_url: "https://example.com/cancel",
  line_items: [{ price: "price_123", quantity: 1 }],
});
// → logs "[stripe-mock] checkout.sessions.create" and returns
//   { id: "cs_test_mock", url: "https://example.com/mock-session" }
```

`paymentIntents.update` is also implemented. Unset the flag or set it to any
value other than `true` to use the real Stripe API.

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
