Type: Guide
Status: Active
Domain: Platform
Last-reviewed: 2025-12-02

# Machine Utilities

## Deposit release service

Rental shops can automatically refund customer deposits after items are returned. The helpers in `@acme/platform-machine` read rental orders for each shop and issue Stripe refunds for any deposits that are marked as returned but not yet refunded.

```ts
import {
  startDepositReleaseService,
  releaseDepositsOnce,
} from "@acme/platform-machine";

// process all shops once
await releaseDepositsOnce();

// or run it on an interval (default: hourly)
const stop = startDepositReleaseService();
// stop(); // call to clear the interval
```

Each shop configures the service in `data/shops/<id>/settings.json` under the `depositService` key:

```json
{
  "depositService": { "enabled": true, "intervalMinutes": 60 }
}
```

The `intervalMinutes` value is specified in minutes and converted to milliseconds internally. The service subtracts any `damageFee` from the refunded amount and calls `markRefunded` so the order is not processed again.

Environment variables can be used to configure the service:

- `DEPOSIT_RELEASE_ENABLED` (boolean) toggles the service globally.
- `DEPOSIT_RELEASE_INTERVAL_MS` (number) sets the default interval.

Both variables may also be suffixed with a shop ID (e.g. `DEPOSIT_RELEASE_ENABLED_SHOP1`) to override settings per shop.

Stripe credentials (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`) must be configured in the shop `.env` files. A one-off CLI utility is also available:

```bash
pnpm release-deposits
```

## Reverse logistics service

Rental operations often track returned items through several post‑rental stages. The reverse logistics worker in `@acme/platform-machine` reads event files for each shop and updates rental order statuses. Each transition is also recorded through the `reverseLogisticsEvents` repository so other services and dashboards can observe the flow of goods.

```ts
import {
  processReverseLogisticsEventsOnce,
  startReverseLogisticsService,
} from "@acme/platform-machine";

// handle all pending events once
await processReverseLogisticsEventsOnce();

// or run on an interval (default: hourly)
const stop = await startReverseLogisticsService();
// stop(); // call to clear the interval
```

Events are JSON files placed in `data/shops/<id>/reverse-logistics/` with a `sessionId` and `status` field (e.g. `received`, `cleaning`, `repair`, `qa`, or `available`). As the worker processes each file it emits a matching event to the `reverseLogisticsEvents` table, providing an auditable history of lifecycle changes.
See [reverse logistics events](./reverse-logistics-events.md) for details on the persistence layer and event schema.

Operational dashboards can read from this event log to provide real‑time visibility into how many items are in each stage of the reverse logistics pipeline and to spot bottlenecks.

Each shop controls the worker in `data/shops/<id>/settings.json` under `reverseLogisticsService`:

```json
{
  "reverseLogisticsService": { "enabled": true, "intervalMinutes": 60 }
}
```

Running `pnpm ts-node scripts/setup-ci.ts <shop>` exposes a `REVERSE_LOGISTICS_ENABLED` environment variable in the generated workflow so the service can be toggled per shop.

## Finite State Machine (FSM)

The package also exports a tiny, type-safe FSM helper for modeling UI or service workflows.

```ts
import { createFSM } from "@acme/platform-machine";

const fsm = createFSM("idle", [
  { from: "idle", event: "FETCH", to: "loading" },
  { from: "loading", event: "RESOLVE", to: "success" },
  { from: "loading", event: "REJECT", to: "error" },
]);

fsm.send("FETCH"); // => "loading"
fsm.send("RESOLVE"); // => "success"
```

Unhandled events simply keep the current state, making the helper suitable for small flows without external libraries.
