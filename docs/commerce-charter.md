Type: Charter
Status: Draft
Domain: Commerce
Last-reviewed: 2025-12-02

Primary code entrypoints:
- packages/platform-core/src/repositories/orders.server.ts
- packages/platform-core/src/repositories/returns.server.ts
- packages/platform-core/src/repositories/reverseLogistics.server.ts
- packages/platform-core/src/checkout/session.ts
- docs/orders.md, docs/returns.md, docs/reverse-logistics-events.md, docs/seo.md

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# Commerce Charter (Orders, Returns, Logistics, SEO)

## Goals

- Provide consistent contracts for rental/sale orders, returns, and reverse logistics across shops.
- Keep checkout flows (Stripe sessions, metadata) aligned with downstream orders and returns logic.
- Ensure SEO surfaces (sitemaps, AI catalog, meta tags) reflect the actual state of shops and products.

## Core Flows

- **Order lifecycle**
  - `RentalOrder` (and related models) track the full lifecycle of an order, including deposit, shipping, delivery, return, and refund events.
  - Platform-core exposes helper functions such as `addOrder`, `listOrders`, `markShipped`, `markReturned`, `markRefunded`, `updateRisk`, and `setReturnTracking`.

- **Checkout**
  - `createCheckoutSession` in `@acme/platform-core/checkout/session` creates Stripe sessions for:
    - Rental mode – with rental duration, deposit line items, and metadata (`rentalDays`, `returnDate`, `depositTotal`, sizes, etc.).
    - Sale mode – with direct product charges and neutral rental metadata.
  - Both modes share a common metadata layout so downstream services can interpret orders consistently.

- **Returns and reverse logistics**
  - Returns configuration is driven by JSON/Prisma-backed settings and `data/return-logistics.json`:
    - Controls carrier labels (for example UPS) and tracking behaviour.
  - `ReverseLogisticsEvent` records each post-return stage (received, cleaning, repair, QA, available) for audit and dashboards.

- **SEO surfaces**
  - Sitemaps are generated from `src/app/sitemap.ts` and rebuilt when products or settings change.
  - AI product catalog is exposed at `/api/ai/catalog` with pagination and `If-Modified-Since` support.
  - SEO audits can be run via `pnpm run seo:audit`, emitting a local HTML report.

## Key Docs

- `docs/orders.md` – Order model, helpers, and checkout interactions.
- `docs/returns.md` – Returns configuration and carrier toggles.
- `docs/reverse-logistics-events.md` – Reverse logistics event model and semantics.
- `docs/seo.md` – Sitemaps, AI catalog, and SEO audit helpers.

## Out of Scope

- Detailed marketing automation flows (covered in `docs/marketing-automation.md`).
- Non-commerce SEO surfaces (for example purely editorial or corporate pages) beyond what is already handled by sitemaps and metadata.

