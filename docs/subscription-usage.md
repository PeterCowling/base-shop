Type: Guide
Status: Active
Domain: Commerce
Last-reviewed: 2025-12-02

# Subscription Usage

## Purpose
Tracks how many shipments each subscribed customer uses per month.

## Key Prisma model
`SubscriptionUsage` fields:
- `id` – primary key.
- `shop` – shop identifier.
- `customerId` – customer using the subscription.
- `month` – ISO `YYYY-MM` string.
- `shipments` – number of shipments in that month.

Unique constraint:
- `@@unique([shop, customerId, month])`

## Public API
```ts
import { getSubscriptionUsage, incrementSubscriptionUsage } from "@acme/platform-core/subscriptionUsage";

// read current usage
await getSubscriptionUsage("shop1", "cust_1", "2025-01");

// increment shipments for the month
await incrementSubscriptionUsage("shop1", "cust_1", "2025-01", 2);
```
`incrementSubscriptionUsage` uses an upsert so the first call creates the record and subsequent calls increment `shipments`.

## Interactions
The `addOrder` function from the orders module invokes `incrementSubscriptionUsage` whenever a qualifying order ships for a subscribed customer.

## Notes
- Shipment counts are scoped by `shop`, `customerId`, and `month`.
- The module assumes month strings are normalized (`YYYY-MM`).
- No automatic reset occurs; a new record is created for each month.
