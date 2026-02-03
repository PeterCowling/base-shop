# Inventory Authority — Validate Contract

This document defines the shared request/response contract for **inventory validation** across:

- Central inventory authority endpoints (multi-tenant, e.g. CMS-backed)
- Tenant inventory endpoints (single-tenant, e.g. `cover-me-pretty`)
- Worker callers (e.g. CochlearFit)

## Endpoint

`POST /api/inventory/validate`

### Auth

- `Authorization: Bearer <INVENTORY_AUTHORITY_TOKEN>`

### Shop context

Shop ID is resolved from **either**:

1. `x-shop-id` request header (gateway/front-door injected), or
2. `shopId` field in the request body (multi-tenant / CMS clients)

If both are provided, they **must match** (fail-closed).

## Request body

```json
{
  "shopId": "optional-shop-id",
  "items": [
    {
      "sku": "sku_123",
      "quantity": 1,
      "variantAttributes": { "size": "adult" },
      "variantKey": "sku_123#size:adult"
    }
  ]
}
```

### `items[]`

- `sku` (string, required): SKU identifier.
- `quantity` (int, required, min 1): Requested quantity.
- `variantAttributes` (object, optional): Variant attributes (preferred).
- `variantKey` (string, optional, **deprecated**): A legacy encoded key of the form:
  - `sku` (no attrs), or
  - `sku#k:v|k2:v2` (attrs sorted lexicographically by key)

## Fail-closed mismatch rules

1. **Header vs body shop mismatch**
   - If both `x-shop-id` and `body.shopId` exist and differ → **400**
2. **variantKey vs variantAttributes mismatch**
   - If both exist: compute server-side `variantKey(sku, variantAttributes)`
   - If computed key differs from provided `variantKey` → **400**
   - If they match, ignore `variantKey` (treat as deprecated input)
3. **`sku` vs `variantKey` mismatch**
   - If `variantKey` is provided, its embedded `sku` must match `items[].sku` → **400**

## Responses

- `200 OK`
  - `{ "ok": true }`
- `400 Bad Request`
  - `{ "error": "Invalid request", ... }`
- `401 Unauthorized`
  - `{ "error": "Unauthorized" }`
- `409 Conflict` (insufficient stock)
  - `{ "ok": false, "code": "inventory_insufficient", "items": [...] }`
- `503 Service Unavailable`
  - `{ "error": "Inventory backend unavailable" }` (shape may vary by endpoint)

## Deprecation note

`variantKey` remains accepted as input for backward compatibility, but **new callers should send `variantAttributes`**. The system enforces strict consistency when both are present to prevent cross-variant mistakes.

