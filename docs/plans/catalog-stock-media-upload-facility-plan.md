<!-- docs/plans/catalog-stock-media-upload-facility-plan.md -->

Type: Guide
Status: Active
Domain: Commerce
Last-reviewed: 2025-12-29

Related docs:
- docs/commerce-charter.md
- docs/cms/catalog-inventory-media-ops.md
- docs/permissions.md

Primary code entrypoints:
- packages/platform-core/src/repositories/products.server.ts
- packages/platform-core/src/repositories/inventory.server.ts
- packages/platform-core/src/repositories/media.server.ts
- packages/platform-core/src/repositories/productImport.server.ts
- packages/platform-core/src/repositories/stockInflows.server.ts
- packages/platform-core/src/repositories/catalogSkus.server.ts
- apps/cms/src/app/cms/shop/[shop]/products/**
- apps/cms/src/app/cms/shop/[shop]/uploads/**
- apps/cms/src/app/cms/shop/[shop]/media/**
- apps/cms/src/app/cms/shop/[shop]/data/inventory/**
- apps/cover-me-pretty/src/app/uploads/[shop]/[filename]/route.ts
- apps/cochlearfit/src/lib/cochlearfitCatalog.server.ts
- apps/cochlearfit/scripts/syncUploads.mjs
- apps/cochlearfit-worker/src/index.ts

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Centralized catalog, stock inflows, and media uploads

This repo has a centralized, multi-tenant facility for managing:

- Product catalogue data (titles/descriptions/prices/status/media ordering)
- Product media (images/videos) upload + metadata
- Stock inflows (receiving inventory into stock) with an audit trail

Initial adopters (already integrated):

- `apps/cover-me-pretty`
- `apps/cochlearfit`

Explicitly out of scope for this work:

- `apps/xa/**`
- `apps/brikette/**`

## Storage layout (source of truth)

All shop data lives under `data/shops/<shopId>/…`:

- `products.json` — product catalogue (`ProductPublication[]`)
- `inventory.json` — inventory rows (`InventoryItem[]`)
- `uploads/` — uploaded media files
- `uploads/metadata.json` — media metadata (title/alt/tags/etc)
- `product-imports.jsonl` — immutable product import audit log (written by product import pipeline)
- `stock-inflows.jsonl` — immutable stock inflow receipts log

## CMS surfaces (operator workflows)

For non-technical “how to” steps, use `docs/cms/catalog-inventory-media-ops.md`.

In the CMS, per shop:

- Products CRUD: `/cms/shop/<shop>/products`
- Uploads hub: `/cms/shop/<shop>/uploads`
  - Product import: `/cms/shop/<shop>/uploads/products`
  - Stock inflows: `/cms/shop/<shop>/uploads/stock-inflows`
  - Media library: `/cms/shop/<shop>/media`
- Inventory matrix: `/cms/shop/<shop>/data/inventory`

## API surfaces (CMS-backed)

These endpoints are used by the CMS Uploads UI:

- Product import: `POST /api/shop/<shop>/product-import`
- Stock inflows: `POST /api/shop/<shop>/stock-inflows`
- Media library: `GET/POST/PATCH/DELETE /api/media?shop=<shop>`
- Inventory matrix: `POST /api/data/<shop>/inventory`

All write surfaces are permission-gated; see `docs/permissions.md`.

## Storefront integrations

### `apps/cover-me-pretty`

- Reads catalogue + inventory via platform-core repositories at runtime.
- Media URLs like `/uploads/<shop>/<filename>` are served by the app route handler.

### `apps/cochlearfit`

- Reads `data/shops/cochlearfit/products.json` + `inventory.json` at build time.
- Copies `data/shops/cochlearfit/uploads/*` into the built site at `public/uploads/cochlearfit/*` during builds.
- Checkout uses `data/shops/cochlearfit/variants.json` as the source of truth for variant pricing + Stripe price IDs.

## Security/validation model (high level)

- Shop IDs validated via platform-core validators (`validateShopName`, `checkShopExists`).
- Media upload: strict file type + size checks; safe paths; optional image orientation rules.
- Product import + stock inflows + stock adjustments: dry-run preview + commit; idempotency keys prevent double application; immutable audit logs.
- Role/permission checks enforced for write endpoints.

## Onboarding a new shop/app (developer checklist)

To adopt this facility for another app:

1) Create `data/shops/<shopId>/shop.json` (and optionally `settings.json`).
2) Create `products.json`, `inventory.json`, and `uploads/` as needed.
3) Ensure your storefront reads products via platform-core (`products.server.ts` / `catalogSkus.server.ts`) or an app-specific loader.
4) Ensure uploaded media URLs are reachable in the storefront:
   - Serve `/uploads/<shop>/<filename>` (like cover-me-pretty), or
   - Copy `data/shops/<shop>/uploads/*` into deployed static assets at build time (like cochlearfit).
5) If checkout pricing is variant-based, centralize Stripe price IDs in one place (for cochlearfit today this is `data/shops/cochlearfit/variants.json`).

## Remaining gaps / follow-ups (unimplemented)
 - [ ] Ensure order allocation/return entries carry real before/after quantities (requires inventory reservation linkage), and migrate DBs to include `lineItems` JSON column on RentalOrder.
