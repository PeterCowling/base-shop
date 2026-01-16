# Checkout Gateway Worker

Edge gateway for the commerce authority endpoints. Intended topology:

`Front Door Worker -> Checkout Gateway Worker -> Node Commerce Service`

## Allowed routes

This worker only serves a strict allowlist under `/api/*`:

- `/api/checkout-session`
- `/api/stripe-webhook`
- `/api/inventory/validate`
- `/api/return`
- `/api/returns/mobile`
- `/api/rental`
- `/api/subscribe`
- `/api/subscription/change`
- `/api/subscription/cancel`
- `/api/billing/webhook`
- `/api/reconciliation`

## Bindings

- `COMMERCE_NODE` (Fetcher, optional): service binding to the Node Commerce Service.
- `COMMERCE_ORIGIN` (string, optional): URL origin to proxy to when service bindings are not configured.

