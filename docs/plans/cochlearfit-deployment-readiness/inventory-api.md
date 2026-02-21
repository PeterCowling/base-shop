---
Type: Contract-Memo
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Relates-to: docs/plans/cochlearfit-deployment-readiness/plan.md
---

# Cochlear Fit Inventory Authority API Contract

This memo captures the inventory validation contract the Worker expects.

Source of truth: `apps/cochlearfit-worker/src/index.ts:170-194`.

## Endpoint

`POST /api/inventory/validate`

Full URL (staging/production examples):
- Staging: `${INVENTORY_AUTHORITY_URL}/api/inventory/validate`
- Production: `${INVENTORY_AUTHORITY_URL}/api/inventory/validate`

Where `INVENTORY_AUTHORITY_URL` is configured per environment (Wrangler var) and the Worker adds the `/api/inventory/validate` suffix.

## Auth

- Header: `Authorization: Bearer ${INVENTORY_AUTHORITY_TOKEN}`
- The Worker treats missing URL or token as **503 Inventory backend unavailable** (fail-closed) before any checkout is created.

## Shop Context

The inventory authority endpoint is multi-tenant and requires a shop identifier.

- Header: `x-shop-id: cochlearfit`
- The current Cochlearfit Worker sends shop context via the header (it does **not** include `shopId` in the request body).

## Request Body

```json
{
  "items": [
    {
      "sku": "classic-kids-sand",
      "quantity": 1,
      "variantAttributes": {
        "size": "kids"
      }
    }
  ]
}
```

Notes:
- `sku` is the variant ID from the catalog (see `data/shops/cochlearfit/variants.json` `id`).
- `variantAttributes.size` is currently the only attribute the Worker sends.

## Response Semantics

The Worker only inspects HTTP status:

- `200 OK` (or any 2xx): inventory OK
- `409 Conflict`: insufficient stock
- Any other non-2xx: treated as `503 Inventory backend unavailable`

Response body is ignored by the current Worker implementation.

## Example Curl

```bash
curl -sS -X POST \
  -H "Content-Type: application/json" \
  -H "x-shop-id: cochlearfit" \
  -H "Authorization: Bearer $INVENTORY_AUTHORITY_TOKEN" \
  -d {items:[sku:classic-kids-sand]} \
  "$INVENTORY_AUTHORITY_URL/api/inventory/validate" \
  -i
```

## Operational Expectations

- Latency should be low enough to run inline during checkout session creation.
- Prefer deterministic 409 responses for out-of-stock.
- Avoid leaking any internal stock data in error messages (response body is ignored anyway).
