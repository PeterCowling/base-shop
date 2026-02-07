# Hospitality Component Kit

Shared UI composites for Prime guest flows, Reception desk operations, and owner KPI surfaces.

## Exports

- `UtilityActionStrip`
  - Props: `actions`, `className`
  - Use for contextual quick actions (maps, support, ETA, calendar).

- `ReadinessSignalCard`
  - Props: `score`, `completedCount`, `totalCount`, `readyLabel`, `className`
  - Use for guest readiness progress and “ready for arrival” feedback.

- `ArrivalCodePanel`
  - Props: `title`, `isLoading`, `code`, `loadingLabel`, `unavailableLabel`, `renderCode`, `className`
  - Use for check-in code/QR display with loading and unavailable states.

- `StaffSignalBadgeGroup`
  - Props: `title`, `signals`, `className`
  - Use for desk-facing readiness/status badges.

- `OwnerKpiTile`
  - Props: `label`, `value`, `trend`, `description`, `icon`, `variant`, `className`
  - Use for owner and operations KPI cards.
