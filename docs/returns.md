Type: Guide
Status: Active
Domain: Returns
Last-reviewed: 2025-12-02

# Returns configuration

This guide explains how return logistics configuration and returns flows behave today.

For a higher-level overview of orders, returns, and logistics, see `docs/commerce-charter.md`.

## Return logistics configuration

Return logistics settings are stored per environment and may be backed by JSON or Prisma depending on `RETURN_LOGISTICS_BACKEND` / `DB_MODE`:

- In JSON mode:
  - `packages/platform-core/src/returnLogistics.ts` reads from `<DATA_ROOT>/../return-logistics.json`.
- In DB mode:
  - `packages/platform-core/src/repositories/returnLogistics.server.ts` uses the `ReturnLogistics` Prisma model.

Key fields (from `ReturnLogistics`):

- `bagType` – packaging type used for returns.
- `labelService` – label provider (for example `"UPS"`).
- `tracking` – whether tracking is enabled.
- `returnCarrier` – list of carrier identifiers (for example `["UPS"]`).
- `homePickupZipCodes` – ZIP codes eligible for home pickup.

You can retrieve a subset of these fields for UI and API usage via:

- `getReturnBagAndLabel()` in `packages/platform-core/src/returnLogistics.ts`.

## UPS labels and tracking

The sample returns API (`packages/template-app/src/app/api/return/route.ts`) currently:

- Uses `getReturnBagAndLabel()` to obtain `labelService`, `tracking`, `returnCarrier`, and `homePickupZipCodes`.
- Uses `createReturnLabel()` in `packages/platform-core/src/repositories/returnLogistics.server.ts` to generate a tracking number and label URL for `"UPS"`.

To prevent UPS labels and tracking for a given environment:

1. Update return logistics configuration (JSON or DB) to remove `"UPS"` from the `returnCarrier` list or set `labelService` to a non‑UPS value.
2. Ensure any API routes or services that call `createReturnLabel()` are updated or guarded accordingly; by default the helper throws for non‑UPS carriers.

## Home pickup flow (example)

The template returns API also supports home pickup requests:

- Uses `getReturnBagAndLabel()` and `getShopSettings(shopId)` to validate:
  - `settings.returnService.homePickupEnabled` is true.
  - The requested ZIP is in `homePickupZipCodes`.
- Persists or forwards the pickup appointment (currently via placeholder logging and a stubbed carrier call).

When disabling home pickup:

- Set `returnService.homePickupEnabled` to `false` in `ShopSettings`.
- Optionally clear or restrict `homePickupZipCodes` in return logistics configuration.
