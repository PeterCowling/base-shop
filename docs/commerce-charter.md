Type: Charter
Status: Draft
Domain: Commerce
Last-reviewed: 2025-12-29

Primary code entrypoints:
- packages/platform-core/src/repositories/products.server.ts
- packages/platform-core/src/repositories/inventory.server.ts
- packages/platform-core/src/repositories/media.server.ts
- packages/platform-core/src/repositories/productImport.server.ts
- packages/platform-core/src/repositories/stockInflows.server.ts
- packages/platform-core/src/repositories/orders.server.ts
- packages/platform-core/src/repositories/returns.server.ts
- packages/platform-core/src/repositories/reverseLogistics.server.ts
- packages/platform-core/src/checkout/session.ts
- apps/cochlearfit-worker/src/index.ts
- docs/cms/catalog-inventory-media-ops.md, docs/orders.md, docs/returns.md, docs/reverse-logistics-events.md, docs/seo.md

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Commerce Charter (Orders, Returns, Logistics, SEO)

## Goals

- Provide consistent contracts for rental/sale orders, returns, and reverse logistics across shops.
- Centralize catalogue, inventory, and media so storefronts can render real products from a shared, multi-tenant source of truth.
- Keep checkout flows (Stripe sessions, metadata) aligned with downstream orders and returns logic.
- Ensure SEO surfaces (sitemaps, AI catalog, meta tags) reflect the actual state of shops and products.

## Core Flows

### Catalogue, inventory, and media

- **Catalogue (products)**
  - Source of truth per shop is `data/shops/<shop>/products.json` (or Prisma when enabled via repo resolvers).
  - Products are authored in CMS via `/cms/shop/<shop>/products` (single edit) or `/cms/shop/<shop>/uploads/products` (bulk import with preview + idempotency + audit log).
  - Storefront visibility is status-driven: only `status = active` products are customer-visible by default.
  - Some storefronts (for example `cochlearfit`) are static export: catalogue/media changes are live only after rebuild/redeploy.

- **Inventory (stock)**
  - Source of truth per shop is `data/shops/<shop>/inventory.json` (or Prisma when enabled).
  - Operators can:
    - edit the full inventory matrix (absolute “set the truth”), and/or
    - receive stock inflows (delta-based) with preview + idempotency + immutable receipts log.

- **Media (images/videos)**
  - Uploaded media is stored per shop under `data/shops/<shop>/uploads/*` plus `uploads/metadata.json`.
  - Files are validated (type/size; optional orientation rules) and produce stable URLs that can be referenced from product media lists.
  - Storage backend can be local filesystem (dev) or R2 (prod) depending on configuration.
  - For static-export storefronts (cochlearfit), media is copied into built assets during the build step.

- **Order lifecycle**
  - `RentalOrder` (and related models) track the full lifecycle of an order, including deposit, shipping, delivery, return, and refund events.
  - Platform-core exposes helper functions such as `addOrder`, `listOrders`, `markShipped`, `markReturned`, `markRefunded`, `updateRisk`, and `setReturnTracking`.

- **Checkout**
  - `createCheckoutSession` in `@platform-core/checkout/session` creates Stripe sessions for:
    - Rental mode – with rental duration, deposit line items, and metadata (`rentalDays`, `returnDate`, `depositTotal`, sizes, etc.).
    - Sale mode – with direct product charges and neutral rental metadata.
  - Both modes share a common metadata layout so downstream services can interpret orders consistently.
  - Some storefronts use app-specific checkout adapters:
    - Cochlearfit uses `apps/cochlearfit-worker` to create Stripe sessions from a prebuilt variants catalogue (including Stripe price IDs) and validates stock via the configured Inventory Authority service.
    - Cochlearfit checkout pricing is sourced from `data/shops/cochlearfit/variants.json`, not the CMS product “price” field.

- **Returns and reverse logistics**
  - Returns configuration is driven by JSON/Prisma-backed settings and `data/return-logistics.json`:
    - Controls carrier labels (for example UPS) and tracking behaviour.
  - `ReverseLogisticsEvent` records each post-return stage (received, cleaning, repair, QA, available) for audit and dashboards.

- **SEO surfaces**
  - Sitemaps are generated from `src/app/sitemap.ts` and rebuilt when products or settings change.
  - AI product catalog is exposed at `/api/ai/catalog` with pagination and `If-Modified-Since` support.
  - SEO audits can be run via `pnpm run seo:audit`, emitting a local HTML report.

## Key Docs

- `docs/cms/catalog-inventory-media-ops.md` – operator workflow for products, inventory, and media.
- `docs/plans/catalog-stock-media-upload-facility-plan.md` – current architecture + remaining gaps for centralized uploads.
- `docs/orders.md` – Order model, helpers, and checkout interactions.
- `docs/returns.md` – Returns configuration and carrier toggles.
- `docs/reverse-logistics-events.md` – Reverse logistics event model and semantics.
- `docs/seo.md` – Sitemaps, AI catalog, and SEO audit helpers.

## Out of Scope

- Detailed marketing automation flows (covered in `docs/marketing-automation.md`).
- Non-commerce SEO surfaces (for example purely editorial or corporate pages) beyond what is already handled by sitemaps and metadata.
