# Reverse logistics events

The `ReverseLogisticsEvent` model records each step an item passes through after it is returned. It provides an auditable history that other services and dashboards can consume.

## Model

| field      | type   | description |
|------------|--------|-------------|
| `id`       | string | Unique identifier for the event. |
| `shop`     | string | Shop identifier associated with the event. |
| `sessionId`| string | Rental session to which the event applies. |
| `event`    | string | Name of the stage. One of the values listed below. |
| `createdAt`| string | ISO timestamp when the event was recorded. |

## Event names

The `event` field is restricted to the following values:

- `received` – item has been returned to the warehouse.
- `cleaning` – item is being cleaned or laundered.
- `repair` – item is under repair.
- `qa` – item is undergoing quality assurance checks.
- `available` – item is ready to be rented again.

Each time the reverse logistics worker processes a status file it persists an entry using this model.
