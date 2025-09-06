# Orders

## Purpose
The orders module manages rental orders for a shop. It stores each order's status lifecycle and deposit information.

## Key Prisma model
`RentalOrder` contains fields such as:
- `id` – primary key.
- `shop` and `sessionId` – unique per order.
- `deposit` – amount held for the rental.
- Timestamps: `startedAt`, `returnedAt`, `refundedAt`, `fulfilledAt`, `shippedAt`, `deliveredAt`, `cancelledAt`.
- Optional fields like `expectedReturnDate`, `returnDueDate`, `customerId`, `damageFee`, `riskLevel`, `riskScore`, `flaggedForReview`, `trackingNumber`, `labelUrl`, and `returnStatus`.

Unique constraints:
- `@@unique([shop, sessionId])`
- `@@unique([shop, trackingNumber])`
- `@@index([customerId])`

## Public API
```ts
import { addOrder, listOrders, markShipped } from "@platform-core/orders";

// create a new order
await addOrder("shop1", "sess_123", 500, "2025-01-01", undefined, "cust_1");

// list orders for a shop
const orders = await listOrders("shop1");

// update lifecycle status
await markShipped("shop1", "sess_123");
```
Other lifecycle helpers include `markFulfilled`, `markDelivered`, `markCancelled`, `markReturned`, `markRefunded`, `updateRisk`, `getOrdersForCustomer`, `setReturnTracking`, and `setReturnStatus`.

## Interactions
When `addOrder` is called with a `customerId` and the shop has subscriptions enabled, it calls `incrementSubscriptionUsage` to record a shipment for that customer. Orders are also tracked via the analytics module through `trackOrder`.

## Notes
- Lifecycle fields (e.g., `startedAt`, `returnedAt`, `refundedAt`) track the order's progress.
- The module ensures tracking number and session ID uniqueness per shop.
- Failed `markReturned` or `markRefunded` calls return `null` if the order does not exist.
