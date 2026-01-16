# Front Door Worker

Universal edge entrypoint for multi-tenant routing and canonical/locale enforcement.

## Local dev (bootstrap mapping)

Run the worker and proxy to a local storefront runtime:

```bash
HOST_MAPPING_JSON='{"store.example":{"shopId":"shop","canonicalHost":"store.example","defaultLocale":"en","locales":["en"],"mode":"active"}}' \
STOREFRONT_ORIGIN="http://localhost:3000" \
GATEWAY_ORIGIN="http://localhost:3000" \
pnpm --filter @apps/front-door-worker dev
```

Then visit `http://store.example:8787/` (or set a hosts entry) so the Worker can resolve the host mapping.

## Routing allowlist

`/api/*` requests are denied unless explicitly allowlisted:

- Storefront: `/api/cart`
- Gateway: `/api/checkout-session`, `/api/stripe-webhook`, `/api/inventory/validate`, `/api/return`, `/api/returns/mobile`, `/api/rental`, `/api/subscribe`, `/api/subscription/change`, `/api/subscription/cancel`, `/api/billing/webhook`, `/api/reconciliation`

## Bindings

- `HOST_MAPPING_DB` (D1): source of truth for `host -> shop` resolution.
- `HOST_MAPPING_CACHE` (KV): read-optimized cache with stale-while-revalidate behaviour.
- Optional service bindings:
  - `STOREFRONT` (Fetcher)
  - `GATEWAY` (Fetcher)

## Internal mapping control plane

The worker exposes a token-protected internal API for managing `host_mappings` without redeploying.

- Allowed hosts: set `CONTROL_PLANE_ALLOWED_HOSTS` to a comma-separated list of hostnames that can serve internal requests.
- Auth: `Authorization: Bearer $CONTROL_PLANE_TOKEN` (or `x-control-plane-token: $CONTROL_PLANE_TOKEN`).

Example (local):

```bash
CONTROL_PLANE_ALLOWED_HOSTS="admin.example" \
CONTROL_PLANE_TOKEN="dev-secret" \
pnpm --filter @apps/front-door-worker dev
```

```bash
curl -X PUT "http://admin.example:8787/__internal/host-mappings/store.example" \
  -H "authorization: Bearer dev-secret" \
  -H "content-type: application/json" \
  --data '{"shopId":"shop","canonicalHost":"store.example","defaultLocale":"en","locales":["en"],"mode":"active"}'
```

