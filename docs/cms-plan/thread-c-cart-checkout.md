Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread C – Cart & checkout end-to-end

This thread operationalises §3 of `docs/historical/cms-research.md`.

It focuses on:

- Cart domain model, storage, and cookies.
- Shared cart API surface and app-specific endpoints.
- Cart UI primitives (header icon, mini-cart, order summary).
- Checkout flows (Stripe, rental vs sale) and CMS configuration.

---

## Context (from research)

- `@acme/platform-core` provides:
  - `CartLine`/`CartState` types and helpers.
  - `CartStore` abstraction with in-memory or Upstash Redis backends.
  - Cookie encoding/decoding (`__Host-CART_ID`) and security model.
  - `cartApi` handlers implementing `PUT`/`POST`/`PATCH`/`DELETE` for carts.
  - `CartProvider` React context and `useCart` hook for web clients.
- Template app:
  - Wraps app tree in `CartProvider` and exposes `/api/cart` backed by `cartApi`.
- `apps/cover-me-pretty`:
  - Diverges with a custom `/api/cart` storing full cart in the cookie.
- CMS:
  - Exposes `/cms/api/cart` for previews using similar semantics.
- Checkout:
  - Uses Stripe; research notes distinct rental vs sale flows and configuration via `ShopSettings` (tax region, currencies, fees, coverage).

---

## Decisions / direction (to keep aligned)

- `@acme/platform-core` cart types, store, API, and cookie model are canonical; apps should not reinvent cart persistence.
- Template and tenant apps should expose `/api/cart` by delegating to the shared `cartApi` (or a thin adapter) wherever possible.
- Checkout flows (Stripe session creation, pricing, tax, coverage) should be driven by `ShopSettings` and other platform-core APIs, not app-local logic.
- CMS configurator should gate launch on having a working cart/checkout setup for the shop.

---

## Tasks

- [x] **CART-01 – Align all `/api/cart` endpoints with `cartApi`**
  - Scope:
    - Standardise on `@acme/platform-core/cartApi` as the implementation for app cart endpoints.
  - Implementation:
    - Review:
      - Template app `/api/cart` route.
      - `apps/cover-me-pretty` `/api/cart` implementation.
      - CMS `/cms/api/cart` handlers.
    - Where apps diverge:
      - Introduce a small adapter around `cartApi` instead of a full reimplementation, preserving any needed app-specific behaviour via hooks or middleware.
    - Current state:
      - Template app and `apps/cover-me-pretty` now both expose `/api/cart` by re-exporting `@platform-core/cartApi` (App Router and pages routes), and cover-me-pretty’s checkout-session route reads carts via `getCart`/`CartStore`, matching the canonical cookie + CartStore semantics.
  - Definition of done:
    - All app/cart endpoints either:
      - Re-export `cartApi` handlers, or
      - Wrap them via a documented adapter.
    - No app directly manipulates cart storage in ways that contradict `CartStore` semantics.
  - Dependencies:
    - ARCH-01/ARCH-02 (platform public surface and repo consistency).

- [x] **CART-02 – Implement canonical header cart icon + mini-cart block**
  - Scope:
    - Create a reusable cart UI block for Page Builder that can be dropped into any header/footer.
  - Implementation:
    - In `@acme/ui` and PB templates:
      - `HeaderCart` block type added to `@acme/types` and `@acme/page-builder-core` as a shared `PageComponent["type"]` with a dedicated Zod schema and core descriptor.
      - Runtime implementation in `@acme/ui` uses `CartProvider` / `useCart` and the shared `MiniCart` organism to render a header cart trigger that shows line count, optional subtotal, and opens a mini-cart drawer.
    - Registered in the shared block registry (PB-03):
      - Included in `coreBlockDescriptors` and wired into the CMS `blockRegistry` so the block is available in Page Builder palettes.
    - Ensured CMS can add and configure this block in header/footer templates:
      - `HeaderCart` is exposed as an organism block alongside other chrome/commerce blocks and can be placed into header/footer layouts where those are managed via PB.
  - Definition of done:
    - A shop can enable a standard header cart icon + mini-cart purely via CMS blocks in a platform-compatible app (CartProvider + `/api/cart`).
    - Template app integrates the block into its PB-driven header/runtime via `DynamicRenderer`.
  - Dependencies:
    - PB-03 (block registry).
    - Thread D (header/footer wiring via CMS).

- [x] **CART-03 – Clarify and codify rental vs sale checkout flows**
  - Scope:
    - Document and implement the difference between rental and sale flows as first-class concepts.
  - Implementation:
    - In `@acme/platform-core`:
      - Rental-specific logic is now explicitly isolated in `checkout/lineItems.ts` and `checkout/totals.ts` (`buildLineItemsForItem` / `computeTotals`) and mirrored by sale-specific helpers (`buildSaleLineItemsForItem`, `computeSaleTotals`).
      - `createCheckoutSession` accepts a `mode: "rental" | "sale"` option and branches internally between the two strategies while keeping a single Stripe integration path (tax line, shared metadata, payment-intent wiring).
      - Rental flows continue to use `returnDate`/`rentalDays`/`depositTotal` metadata and deposit line items; sale flows charge `sku.price` only and record neutral rental metadata (`rentalDays = 0`, `depositTotal = 0`).
    - In template/tenant apps:
      - `packages/template-app` derives the checkout mode from `Shop.type` (`"rental"` vs `"sale"`) via `readShop` and passes it to `createCheckoutSession`.
      - `apps/cover-me-pretty` uses `mode: "rental"` explicitly to preserve existing rental + deposit behaviour for its `/api/checkout-session` and `/api/rental` flows.
    - Configuration surface:
      - Flow selection is driven by `Shop.type` (business model) together with SKU flags (`forSale`/`forRental`), while `ShopSettings.currency` and `ShopSettings.taxRegion` remain the source of truth for currency and tax.
  - Definition of done:
    - There is a single, well-documented helper (`createCheckoutSession`) for creating checkout sessions with an explicit `mode: "rental" | "sale"` configuration, plus dedicated helpers for each flow.
    - Docs updated (`docs/orders.md`) to describe how rental vs sale checkout flows are configured and how they map onto orders and returns.
  - Dependencies:
    - ARCH-03 (Shop/Settings field ownership).

- [x] **CART-04 – Surface checkout configuration in CMS configurator**
  - Scope:
    - Wire cart/checkout readiness into the configurator’s “payments”, “shipping-tax”, and “checkout” steps.
  - Implementation:
    - Coordinate with Thread E to:
      - Ensure checkout-related fields in `ShopSettings` (currency, taxRegion, shipping options, fees) are covered by CMS configuration flows:
        - `ShopSettings.currency` and `ShopSettings.taxRegion` remain editable via the shop settings UI (`apps/cms/src/app/cms/shop/[shop]/settings`), and are consumed by configurator checks.
        - Payment and shipping providers are configured via the configurator steps (`StepPaymentProvider`, `StepShipping`) which populate `payment`/`shipping` options used by `createShop` and downstream cart/checkout flows.
      - Implement `ConfigCheck`s like `checkPayments`, `checkShippingTax`, `checkCheckout` that rely on existing cart/checkout APIs:
        - Implemented in `packages/platform-core/src/configurator.ts` and exported via `configuratorChecks` keyed by `ConfiguratorStepId` (`"payments"`, `"shipping-tax"`, `"checkout"`).
        - `/cms/api/configurator-progress` calls these checks when a `shopId` is provided and returns a typed `ConfiguratorProgress` payload, which the configurator dashboard uses to drive server-side progress counts for the cart/checkout-related steps.
        - The `/api/launch-shop` pipeline runs `runRequiredConfigChecks` (covering `payments`, `shipping-tax`, `checkout`, and related steps) before `deployShop`, and fails the deploy stage with a structured error when any checkout-related check fails.
  - Definition of done:
    - A shop cannot be launched (per configurator) without a working cart/checkout setup.
  - Dependencies:
    - Thread E (Configurator types and API).

- [x] **CART-05 – Add focused tests for cart API and cookie semantics**
  - Scope:
    - Strengthen tests around cart handlers and cookie security.
  - Implementation:
    - In `@acme/platform-core` (and possibly template app):
      - Add tests for:
        - `cartApi` request/response behaviour for each method.
        - Cookie encoding/decoding (including invalid signatures).
        - TTL and store behaviour for memory vs Upstash backends (where feasible).
      - Current state:
        - `@acme/platform-core` now has dedicated tests for `cartApi` handlers (success and error paths for `GET`/`POST`/`PUT`/`PATCH`/`DELETE`, including rental payloads), cookie helpers (`encodeCartCookie`/`decodeCartCookie` and `asSetCookieHeader`, covering invalid signatures and header flags), and cart stores (memory and Redis/Upstash backends with TTL, env-based selection, and fallback behaviour).
  - Definition of done:
    - Regressions in cookie handling or API shape are caught by tests.
  - Dependencies:
    - CART-01 to settle on a canonical implementation.

---

## Dependencies & validation

- Depends on:
  - ARCH-01/ARCH-02 for stable cart-related public APIs and store backends.
  - Thread E for configurator integration.
- Validation:
  - `/api/cart` behaves consistently across template and tenant apps.
  - Header cart + mini-cart block works in Page Builder and on live shops.
  - Configurator’s checkout-related steps correctly reflect cart/checkout readiness.
