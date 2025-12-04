Type: Contract
Status: Canonical
Domain: Reverse-Logistics
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/platform-core/src/repositories/reverseLogisticsEvents.server.ts
- packages/platform-core/src/repositories/rentalOrders.server.ts
- packages/platform-machine/src/processReverseLogisticsEventsOnce.ts

# Reverse logistics events

The `ReverseLogisticsEvent` model records each step an item passes through after it is returned. It provides an auditable history that other services and background workers can consume.

## Model

Prisma model (simplified):

| field       | type   | description |
|-------------|--------|-------------|
| `id`        | string | Unique identifier for the event. |
| `shop`      | string | Shop identifier associated with the event. |
| `sessionId` | string | Rental session to which the event applies. |
| `event`     | string | Name of the stage (see below). |
| `createdAt` | string | ISO timestamp when the event was recorded. |

The corresponding TypeScript types live in `@acme/types` as `ReverseLogisticsEvent` and `ReverseLogisticsEventName`.

## Event names

The `event` field is restricted to the following values:

- `received` – item has been returned to the warehouse.
- `cleaning` – item is being cleaned or laundered.
- `repair` – item is under repair.
- `qa` – item is undergoing quality assurance checks.
- `available` – item is ready to be rented again.

Each time reverse logistics processing runs, it persists an entry using this model.

## Repository API

The primary repository implementation lives in `packages/platform-core/src/repositories/reverseLogisticsEvents.server.ts`:

- `recordEvent(shop, sessionId, event, createdAt?)`
  - Inserts a single event row.
- `listEvents(shop)`
  - Returns all events for a shop ordered by `createdAt` ascending.

For convenience, `packages/platform-core/src/returnLogistics.ts` exposes:

- `reverseLogisticsEvents` – a helper object with methods:
  - `received(shop, sessionId, createdAt?)`
  - `cleaning(shop, sessionId, createdAt?)`
  - `repair(shop, sessionId, createdAt?)`
  - `qa(shop, sessionId, createdAt?)`
  - `available(shop, sessionId, createdAt?)`

These helpers delegate to `recordEvent` with the appropriate `event` name.

## Integration with rental orders

Reverse logistics events complement, but do not replace, the status and timestamps on `RentalOrder`:

- `packages/platform-core/src/repositories/rentalOrders.server.ts` exposes helpers such as:
  - `markReceived`, `markCleaning`, `markRepair`, `markQa`, `markAvailable`.
- Background workers in `packages/platform-machine` (for example `processReverseLogisticsEventsOnce.ts`) can:
  - Consume external status feeds.
  - Write `ReverseLogisticsEvent` rows.
  - Update `RentalOrder` status and timestamps via the rental orders repository.
