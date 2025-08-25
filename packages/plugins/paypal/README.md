# PayPal Plugin

Provides a PayPal payment provider for the platform.

## Setup

Run `pnpm init-shop` and select **PayPal** from the plugins list. The wizard adds `@acme/plugin-paypal` to the new shop and prompts for:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`

Fill these environment variables in `apps/shop-<id>/.env`.
