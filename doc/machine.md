# Machine Utilities

## Deposit release service

Rental shops can automatically refund customer deposits after items are returned. The helpers in `@acme/platform-machine` read rental orders for each shop and issue Stripe refunds for any deposits that are marked as returned but not yet refunded.

```ts
import { startDepositReleaseService, releaseDepositsOnce } from "@acme/platform-machine";

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
- `DEPOSIT_RELEASE_INTERVAL_MINUTES` (number) sets the default interval.

Both variables may also be suffixed with a shop ID (e.g. `DEPOSIT_RELEASE_ENABLED_SHOP1`) to override settings per shop.

Stripe credentials (`STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) must be configured in the shop `.env` files. A one-off CLI utility is also available:

```bash
pnpm release-deposits
```

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
