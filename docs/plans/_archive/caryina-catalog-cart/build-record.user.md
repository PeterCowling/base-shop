---
Type: Build-Record
Status: Complete
Feature-Slug: caryina-catalog-cart
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — Caryina Catalog, Inventory & Cart

## What Was Built

**Workstream A — Product Admin (TASK-01, TASK-03 – TASK-06)**
TASK-01 configured the Caryina app for a Cloudflare Worker build by adding `@opennextjs/cloudflare`, creating `wrangler.toml`, and adding a CI Worker deploy job. This was a hard prerequisite for all admin and cart API routes. TASK-03 added an `/admin` route group with Next.js middleware auth-gating via an HMAC-signed `admin_session` HttpOnly cookie backed by `CARYINA_ADMIN_KEY`. TASK-04 added full product and inventory CRUD API routes under `/admin/api/products` and `/admin/api/inventory/[sku]`, wiring `writeRepo`, `updateProductInRepo`, `deleteProductFromRepo`, and `updateInventoryItem` from platform-core. TASK-05 added the admin product list and create/edit form pages, including `ProductForm.client.tsx` with text fields for English title/description, price (display € → store minor units ×100), status select, and media URL rows. TASK-06 added `InventoryEditor.client.tsx` embedded in the product edit page, giving quantity editing for each SKU variant.

**Workstream B — Inventory-Aware Storefront (TASK-02)**
TASK-02 added a `StockBadge` component reading `sku.stock` (already computed by `catalogSkus.server.ts`) and per-SKU `lowStockThreshold` passed as a prop. The badge renders "In stock", "Low stock (N left)", or "Out of stock" on both PLP cards (`ProductMediaCard.tsx`) and PDP (`product/[slug]/page.tsx`). Out-of-stock state disables the CTA.

**Workstream C — Cart + Stripe Checkout (TASK-08 – TASK-12)**
TASK-08 (investigate) confirmed `CART_COOKIE_SECRET` is set in `apps/caryina/.env.local` and `createShopCartApi({ shop: "caryina" })` provides a viable cookie-based cart storage approach — no Redis or Durable Objects needed. TASK-09 added `<CartProvider>` to the locale layout and created `/api/cart/route.ts` (GET/POST/DELETE) using the cookie-based backend. TASK-10 replaced the PDP's "Continue to checkout" link with `<AddToCartButton sku={sku} />`, rewrote `StickyCheckoutBar.client.tsx` to render `AddToCartButton` (props changed: `{priceLabel, sku}`), added `CartIcon.client.tsx` with badge count to `Header.tsx`, and created a new `/[lang]/cart/page.tsx` with quantity controls, remove button, cart total, and "Proceed to payment" link to `/checkout`. TASK-11 created `api/checkout-session/route.ts` (POST: decodes cart cookie → calls Stripe sessions API directly in hosted mode → returns `{ sessionId, url }`), extracted `verifyStripeSession.ts` to `src/lib/` for testability, and rewrote `/success/page.tsx` to verify `payment_status === 'paid'` before rendering confirmation. TASK-12 converted `/checkout/page.tsx` to a client component (`CheckoutClient.client.tsx`) that reads `useCart()`, renders a cart summary, and on "Pay now" click: POSTs to `/api/checkout-session` then does `window.location.href = data.url` to redirect to Stripe-hosted checkout. `/cancelled/page.tsx` was updated to show "Payment cancelled" with a "Return to cart" link.

## Tests Run

- `pnpm --filter caryina test` — all existing 8 caryina Jest tests passed throughout the build.
- Per-task TC validation:
  - TC-02/03/03b/04/empty-state (TASK-10): 5/5 PASS
  - TC-01/TC-02/TC-03/TC-04 (TASK-11): 4/4 PASS
  - TC-01 (fetch+redirect), error state, empty cart (TASK-12): PASS
- ESLint clean on all modified files.
- `STRIPE_USE_MOCK=true` used for all checkout unit tests (Stripe test-mode keys not yet set in env — noted as operator action item).

## Validation Evidence

| Task | Contract | Result |
|---|---|---|
| TASK-01 | Worker build config: wrangler.toml + @opennextjs/cloudflare present | PASS |
| TASK-02 | StockBadge renders on PLP + PDP; out-of-stock disables CTA | PASS |
| TASK-03 | Admin middleware rejects unauthenticated requests; login sets HttpOnly cookie | PASS |
| TASK-04 | CRUD routes: product create/edit/delete + inventory patch wired to repositories | PASS |
| TASK-05 | Product list loads (draft+active); create/edit form submits correctly | PASS |
| TASK-06 | Inventory quantity editable via InventoryEditor.client.tsx + PATCH route | PASS |
| TASK-07 | CHECKPOINT: Worker build ✓; Stripe keys caveat noted; TASK-08 ✓; all downstream eligible | PASS |
| TASK-08 | Cart storage approach confirmed: cookie-based via createShopCartApi | PASS |
| TASK-09 | CartProvider in layout; /api/cart GET/POST/DELETE working | PASS |
| TASK-10 | TC-02/03/03b/04/empty-state: 5/5 PASS; AddToCartButton + /cart page complete | PASS |
| TASK-11 | TC-01/02/03/04: 4/4 PASS; checkout-session route + success verification | PASS |
| TASK-12 | TC-01 + error/empty-cart: PASS; CheckoutClient → Stripe redirect wired | PASS |

## Scope Deviations

- **TASK-04 ID generation**: `ulid` not in caryina deps — used `crypto.randomUUID()` with a `getSubtle()` webcrypto fallback for jsdom compatibility. Product IDs are UUID format (string); contract unchanged.
- **TASK-11 checkout session pattern**: Plan referenced `createCheckoutSession()` from platform-core (returns `clientSecret` for embedded mode). Deviation: direct `stripe.checkout.sessions.create()` call used to obtain `session.url` for redirect to Stripe-hosted checkout (simpler and appropriate for Caryina's MVP). Documented in task build evidence.

## Outcome Contract

- **Why:** Caryina needs to move from a static-data demo to a real storefront — the operator needs to be able to upload products and customers need to be able to buy more than one item.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina admin can manage the product catalog and inventory via a web UI; the storefront displays live stock state; customers can add items to a cart and complete payment via Stripe.
- **Source:** operator
