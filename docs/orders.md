Type: Contract
Status: Canonical
Domain: Orders
Last-reviewed: 2026-02-03

Primary code entrypoints:
- packages/platform-core/src/repositories/rentalOrders.server.ts
- packages/platform-core/src/checkout/session.ts

# Orders

## Purpose
The orders module manages rental orders for a shop. It stores each order's status lifecycle and deposit information.

## Key Prisma model
`RentalOrder` contains fields such as:
- `id` – primary key.
- `shop` and `sessionId` – unique per order.
- `deposit` – amount held for the rental.
- Optional reconciliation fields: `currency`, `subtotalAmount`, `taxAmount`, `shippingAmount`, `discountAmount`, `totalAmount`, `cartId`, and Stripe identifiers (`stripePaymentIntentId`, `stripeChargeId`, `stripeBalanceTransactionId`, `stripeCustomerId`).
- Timestamps: `startedAt`, `returnedAt`, `refundedAt`, `fulfilledAt`, `shippedAt`, `deliveredAt`, `cancelledAt`.
- Optional fields like `expectedReturnDate`, `returnDueDate`, `customerId`, `damageFee`, `riskLevel`, `riskScore`, `flaggedForReview`, `trackingNumber`, `labelUrl`, and `returnStatus`.
- `customerId` is the internal customer identifier (not the Stripe customer id). Stripe is stored separately in `stripeCustomerId`.

Unique constraints:
- `@@unique([shop, sessionId])`
- `@@unique([shop, trackingNumber])`
- `@@index([customerId])`

## Public API
```ts
import { addOrder, listOrders, markShipped } from "@acme/platform-core/orders";

// create a new order
await addOrder({
  shop: "shop1",
  sessionId: "sess_123",
  deposit: 500,
  expectedReturnDate: "2025-01-01",
  customerId: "cust_1",
});

// list orders for a shop
const orders = await listOrders("shop1");

// update lifecycle status
await markShipped("shop1", "sess_123");
```
Other lifecycle helpers include `markFulfilled`, `markDelivered`, `markCancelled`, `markReturned`, `markRefunded`, `updateRisk`, `getOrdersForCustomer`, `setReturnTracking`, and `setReturnStatus`.

## Checkout flows

Checkout sessions for both rentals and straight sales are created via the shared helper `createCheckoutSession` in `@acme/platform-core/checkout/session`:

- **Rental checkout**
  - Call `createCheckoutSession(cart, { mode: "rental", returnDate, currency, taxRegion, shopId, internalCustomerId, stripeCustomerId, ... })`.
  - Uses rental duration and deposit semantics, building separate rental and deposit line items plus a tax line.
  - Metadata includes `rentalDays`, `returnDate`, `depositTotal`, and per-SKU `sizes`; these are later consumed by rental order and returns flows (for example `/api/rental` handlers).
  - When authenticated, pass both `internalCustomerId` (platform ID) and `stripeCustomerId` (Stripe ID). `internalCustomerId` is persisted on orders; `stripeCustomerId` is used for Stripe attachment and reconciliation.
  - Rental readiness is driven by:
    - `Shop.type === "rental"` and SKU flags like `forRental`,
    - `ShopSettings.currency` and `ShopSettings.taxRegion` for currency and tax region.

- **Sale checkout**
  - Call `createCheckoutSession(cart, { mode: "sale", currency, taxRegion, shopId, internalCustomerId, stripeCustomerId, ... })`.
  - Charges SKU prices directly using `sku.price`, without adding deposit line items; `depositTotal` is always `0` in metadata.
  - Rental-specific metadata (`rentalDays`, `returnDate`) is set to neutral values and ignored by downstream rental workflows.
  - Flow selection is typically based on `Shop.type` (`"sale"` vs `"rental"`) and catalogue flags (`forSale`/`forRental`), with `ShopSettings.currency` and `ShopSettings.taxRegion` continuing to drive totals and tax.

Both flows share the same Stripe integration (session creation, tax line calculation, metadata layout) so storefront apps can switch between them by changing configuration rather than reimplementing checkout logic.

## Stripe webhook tenancy (fail-closed)

Webhook endpoints must enforce **tenant isolation** to prevent cross-shop event processing.

Resolution model:

1. Resolve the tenant shop ID from the Stripe event (`shop_id`/`shopId` metadata fast-path, then safe fallbacks).
2. Compare resolved shop ID to the tenant implied by the route/deployment.

Fail-closed behavior:

- If the resolved shop ID **differs** from the route tenant → return **403** and do not process.
- If the tenant **cannot be resolved** → return **503** so Stripe retries (never return 400 for this case).

Metrics:

- `webhook_tenant_mismatch_total`
- `webhook_tenant_unresolvable_total`

## Interactions
When `addOrder` is called with a `customerId` and the shop has subscriptions enabled, it calls `incrementSubscriptionUsage` to record a shipment for that customer. Orders are also tracked via the analytics module through `trackOrder`.

## Notes
- Lifecycle fields (e.g., `startedAt`, `returnedAt`, `refundedAt`) track the order's progress.
- The module ensures tracking number and session ID uniqueness per shop.
- Failed `markReturned` or `markRefunded` calls return `null` if the order does not exist.
