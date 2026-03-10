---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Audit-Ref: 6826042120681fca5c9fda66e66a6958415777e1
Feature-Slug: caryina-catalog-cart
Execution-Track: code
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-catalog-cart/plan.md
Dispatch-ID: IDEA-DISPATCH-20260226-0021
Trigger-Why: Operator-stated: Caryina business website needs a product upload facility tied to centralised inventory, displayed on the site, and ready for shopping cart usage.
Trigger-Intended-Outcome: type: operational | statement: Caryina has (1) a working product admin interface for managing the catalog, (2) inventory stock awareness displayed on the storefront, and (3) a multi-item shopping cart with real Stripe checkout replacing the current single-item stub | source: operator
---

# Caryina Catalog, Inventory & Cart Fact-Find Brief

## Scope

### Summary

Three distinct capabilities are needed for the Caryina storefront to move from an MVP stub to a fully operational e-commerce site:

1. **Product upload facility** — an admin interface to add, edit, and remove products from the centralised JSON-backed product store (`data/shops/caryina/products.json` + `inventory.json`).
2. **Inventory-aware storefront display** — surfaces stock counts and in/out-of-stock state on the PLP and PDP, pulling from the `stock` field that `catalogSkus.server.ts` already populates from `inventory.json`.
3. **Shopping cart + real checkout** — replaces the single-item direct-link funnel with a `CartProvider`-backed multi-item basket, a `/cart` page, and a live Stripe checkout session (replacing the current stub that links straight to `/success`).

The platform-core infrastructure for all three capabilities already exists. This plan is primarily about wiring the pieces into the Caryina app rather than building from scratch.

### Goals

- Admin can create, edit, and delete products and update inventory for the Caryina shop.
- PLP and PDP show accurate stock state (in stock / low stock / out of stock) sourced from `inventory.json`.
- Customers can add multiple products to a cart, review the basket, and complete payment via Stripe.
- The cart persists across page navigations (via `CartProvider` + localStorage fallback).

### Non-goals

- Multi-variant products (size/colour picker) — current SKUs are single-variant. Variant UI is out of scope for this plan.
- Channel inventory sync (Etsy, Instagram Shopping) — deferred.
- Order management / fulfilment tracking UI — deferred.
- Full CMS integration for Caryina — the CMS app (`apps/cms`) is noted as a future path but not in scope here.

### Constraints & Assumptions

- Constraints:
  - JSON backend for products/inventory (no DATABASE_URL configured for Caryina; `resolveRepo()` auto-selects JSON). Must keep atomic write + filesystem lock patterns already implemented.
  - Cloudflare Pages deployment for Caryina — static export (`OUTPUT_EXPORT=1`). Cart page must be client-rendered; API routes must work in the Worker build context.
  - **Worker build prerequisite:** Caryina is currently static-export only. API routes (`/api/cart`, `/api/checkout-session`, `/admin/api/*`) require a Cloudflare Worker build (`@opennextjs/cloudflare` + `wrangler.toml`). Configuring this is task A0 and is a hard prerequisite for all Workstream A and Workstream C tasks. Without A0, no admin or cart routes are reachable in any deployed environment.
  - Stripe keys must be provided as environment variables before checkout can be tested end-to-end.
  - Admin must be auth-gated. Cookie security requirements: HttpOnly; Secure; SameSite=Strict; 1-hour session expiry. `CARYINA_ADMIN_KEY` env var must be ≥ 32 random characters.
- Assumptions:
  - `shop.json` already declares `billingProvider: "stripe"` — Stripe is the intended payment processor.
  - The `packages/stripe` edge-compatible client and `createCheckoutSession()` in `packages/platform-core` will work without modification for Caryina.
  - Cart API backend (`/api/cart`) needs to be added to the Caryina app (currently only the analytics event route exists).

## Outcome Contract

- **Why:** Caryina needs to move from a static-data demo to a real storefront — the operator needs to be able to upload products and customers need to be able to buy more than one item.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina admin can manage the product catalog and inventory via a web UI; the storefront displays live stock state; customers can add items to a cart and complete payment via Stripe.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/caryina/src/app/[lang]/shop/page.tsx` — PLP; reads `readShopSkus(locale)` → renders product grid. No stock badge shown. Direct link to checkout per item.
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — PDP; reads `readShopSkuBySlug(locale, slug)`. Shows `StickyCheckoutBar` with "Continue to checkout" link (`?sku=<slug>`). No cart button, no stock display.
- `apps/caryina/src/app/[lang]/checkout/page.tsx` — single-item checkout stub. Reads `?sku=` param, renders one item. "Complete purchase" is a `<Link href="/{locale}/success?...">` — no Stripe call, no real payment.
- `apps/caryina/src/app/api/analytics/event/route.ts` — only API route in Caryina. Event allowlist already includes `"add_to_cart"`.

### Key Modules / Files

- `packages/platform-core/src/repositories/catalogSkus.server.ts` — **critical join layer**: `listShopSkus()` and `getShopSkuBySlug()` read from both `products.server.ts` and `inventory.server.ts`, computing `stock` (aggregate quantity across inventory items) and embedding it in the returned `SKU`. The `stock` field is therefore already available on every `SKU` returned to PLP/PDP — nothing new needs to be read for stock display. Evidence: `src/repositories/catalogSkus.server.ts:64–68`.
- `packages/platform-core/src/repositories/products.server.ts` — full product CRUD: `readRepo`, `writeRepo`, `updateProductInRepo`, `deleteProductFromRepo`, `duplicateProductInRepo`. Atomic write, JSON backend for Caryina.
- `packages/platform-core/src/repositories/inventory.server.ts` — full inventory CRUD: `readInventory`, `writeInventory`, `updateInventoryItem`. Filesystem lock, stock alert on write, Zod validation.
- `packages/platform-core/src/contexts/CartContext.tsx` — `CartProvider` + `useCart` hook. Backed by `/api/cart` REST endpoint. localStorage offline fallback. Dispatches `add`, `remove`, `setQty`, `clear`.
- `packages/platform-core/src/components/shop/AddToCartButton.client.tsx` — ready-made button component. Uses `useCart` dispatch.
- `packages/platform-core/src/checkout/createSession.ts` — `createCheckoutSession(cart, options)`. Builds Stripe Checkout Session, handles repricing drift, coupon application, SHA-256 idempotency key.
- `packages/stripe/src/index.ts` — edge-compatible Stripe client singleton. API version `2025-06-30.basil`. Mock mode via `STRIPE_USE_MOCK=true`.
- `apps/cms/src/app/cms/shop/[shop]/uploads/` — existing CMS inventory snapshot UI (confirmed via `useInventorySnapshot.client.ts`). The CMS app hosts inventory and product data API routes at `/api/data/[shop]/inventory`.
- `apps/caryina/src/lib/shop.ts` — thin wrapper: `readShopSkus`, `readShopSkuBySlug`, `readShopCurrency`. These call `catalogSkus.server.ts` and pass `SHOP_ID = "caryina"`.

### Patterns & Conventions Observed

- Server components fetch data; client components handle interactivity — evidence: `shop/page.tsx`, `product/[slug]/page.tsx` (server), `ProductGallery.client.tsx`, `StickyCheckoutBar.client.tsx` (client).
- File naming: client components use `.client.tsx` suffix — evidence: across `apps/caryina/src/`.
- Analytics events are fired from thin client wrapper components (`ShopAnalytics.client.tsx`, etc.) mounted in server component trees — evidence: `apps/caryina/src/app/[lang]/shop/page.tsx`.
- API routes in Caryina use `nodejs` runtime — evidence: `api/analytics/event/route.ts`.
- Atomic write pattern for JSON files (write to `.tmp`, then `rename`) — evidence: `packages/platform-core/src/repositories/products.json.server.ts`.

### Data & Contracts

- Types/schemas/events:
  - `SKU` (from `@acme/types`) — includes `stock: number` (aggregate from inventory), `forSale: boolean`, `media: MediaItem[]`, `title: string` (localised at read time by `catalogSkus.server.ts`).
  - `ProductPublication` (from `@acme/types`) — stored shape in `products.json`. Multi-locale `title`/`description`. `status: PublicationStatus` (`"draft" | "active" | ...`).
  - `InventoryItem` — Zod-validated: `{ sku, productId, quantity, variantAttributes, lowStockThreshold? }`. Evidence: `packages/platform-core/src/types/inventory.ts`.
  - `CartState` — `Record<productId, CartLine>` where `CartLine = { sku: SKU, qty: number, size?: string }`. Evidence: `packages/types/src/Cart.ts`.
  - Analytics event `add_to_cart` already in allowlist — evidence: `api/analytics/event/route.ts`.
- Persistence:
  - Products: `data/shops/caryina/products.json` (3 active SKUs as of 2026-02-23).
  - Inventory: `data/shops/caryina/inventory.json` (3 items; silver: 5, rose-splash: 7, peach: 4; all with `lowStockThreshold`).
  - Cart: server-side in `/api/cart` (HTTP) with localStorage fallback client-side.
- API/contracts:
  - Product CRUD: `ProductsRepository` interface — `read`, `write`, `getById`, `update`, `delete`, `duplicate`. Evidence: `packages/platform-core/src/repositories/products.types.ts`.
  - Inventory CRUD: `InventoryRepository` interface — `read`, `write`, `update`. Evidence: `packages/platform-core/src/repositories/inventory.types.ts`.
  - Checkout: `createCheckoutSession(CartState, options)` returns `{ sessionId, clientSecret, amount, currency, priceChanged }`. Evidence: `packages/platform-core/src/checkout/createSession.ts`.
  - Cart API: `/api/cart` — GET (read cart), POST (add/update), DELETE (remove/clear). Needs to be added to Caryina app.
  - **`lowStockThreshold` data gap:** `lowStockThreshold` is NOT mapped into `SKU` by `catalogSkus.server.ts` — it remains on `InventoryItem` only. The stock badge (B1) cannot read this value from the `SKU` object it receives. MVP resolution: hardcode threshold `2` as a constant in the stock badge component, pending a future settings-driven approach. Option (a) — extending `skuFromProduct()` to carry `lowStockThreshold` forward — is a cross-cutting platform-core change affecting all sibling apps and is deferred.

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/platform-core` — CartContext, AddToCartButton, createCheckoutSession, product/inventory repositories, catalogSkus.server.
  - `packages/stripe` — Stripe client singleton.
  - `packages/types` — SKU, ProductPublication, CartState, CartLine.
  - `data/shops/caryina/*.json` — source of truth for all product and inventory data.
- Downstream dependents:
  - `apps/caryina/src/app/[lang]/shop/page.tsx` — will gain stock badge display.
  - `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` — will gain AddToCartButton + stock display; StickyCheckoutBar changes to sticky cart CTA.
  - `apps/caryina/src/app/[lang]/checkout/page.tsx` — will be replaced by Stripe Checkout flow.
  - `apps/caryina/src/components/Header.tsx` — will gain cart icon with item count.
- Likely blast radius:
  - Adding `CartProvider` to the caryina locale layout wraps all child pages — minimal risk, additive only.
  - Replacing the checkout stub with real Stripe requires env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and a success/cancelled webhook or redirect handler.
  - Admin routes are fully additive (new routes only, no existing code modified except possibly middleware for auth gating).

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component tests), Playwright (e2e)
- Commands: `pnpm --filter caryina test` (Jest), `pnpm --filter caryina e2e` (Playwright)
- CI integration: standard Turborepo test pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `launchMediaContract` | Unit | `launchMediaContract.test.ts` | Full — slot presence, schema validation |
| `launchMerchandising` | Unit | `launchMerchandising.test.ts` | Full — family routing, media resolution, anchor building |
| `ProductGallery` | Component | `ProductGallery.client.test.tsx` | Keyboard nav, index advancement |
| `BrandMark` | Component + unit | `BrandMark.test.tsx`, `particleEngine.test.ts`, `sampleTextPixels.test.ts` | Static render, reduced-motion, coarse-pointer |
| `ThemeModeSwitch` | Component | `ThemeModeSwitch.test.tsx` | Light/dark toggle, system preference |
| Logo | E2E | `logo.visual.spec.ts` | Playwright visual check |

#### Coverage Gaps

- Untested paths:
  - `shop.ts` (readShopSkus, readShopSkuBySlug, formatMoney) — no unit tests.
  - PLP and PDP server component rendering — no integration tests.
  - Checkout flow — currently stub; no tests. Will need unit + e2e once real.
  - Cart API route (to be created) — no tests exist yet.
  - Admin product CRUD routes (to be created) — no tests.
- Extinct tests:
  - None identified — existing tests remain valid.

#### Recommended Test Approach

- Unit tests for: cart API route handlers, admin product/inventory route handlers, stock badge logic, AddToCartButton dispatch.
- Integration tests for: `createCheckoutSession` with mock Stripe (mock already available via `STRIPE_USE_MOCK=true`), cart state transitions.
- E2E tests for: add-to-cart → cart page → checkout initiation flow (Playwright, staging env).

### Recent Git History (Targeted)

- `feat(caryina): complete HBAG image-first launch build and evidence` (80439bbe) — added `ProductGallery.client.tsx`, typed `launchMediaContract.ts`, 5 tests. This is the most recent major caryina work. The app is clean and stable post this commit.
- No recent changes to `packages/platform-core/src/repositories/` in the last 30 days — the CRUD infrastructure is stable.

## Questions

### Resolved

- Q: Does `catalogSkus.server.ts` already provide stock data to the PLP/PDP?
  - A: Yes. `listShopSkus()` and `getShopSkuBySlug()` call `readInventory()` and aggregate `quantity` values into a `stock: number` field on each returned `SKU`. The PLP and PDP already receive `stock` in the `SKU` object — displaying it is purely a UI addition with no new data fetching required.
  - Evidence: `packages/platform-core/src/repositories/catalogSkus.server.ts:64–68`

- Q: Is `CartContext`/`CartProvider` available and production-ready?
  - A: Yes. `CartProvider` in `packages/platform-core/src/contexts/CartContext.tsx` is a shared primitive used across apps. It connects to `/api/cart` (to be added to caryina) and falls back to localStorage. `AddToCartButton.client.tsx` is ready to drop into PDP and PLP.
  - Evidence: `packages/platform-core/src/contexts/CartContext.tsx`, `packages/platform-core/src/components/shop/AddToCartButton.client.tsx`

- Q: Is Stripe checkout infrastructure available?
  - A: Yes. `packages/stripe` provides the edge-compatible client. `createCheckoutSession()` in `packages/platform-core/src/checkout/createSession.ts` is the canonical session builder. `cover-me-pretty` has a working checkout session API route that can be used as a reference pattern.
  - Evidence: `packages/stripe/src/index.ts`, `packages/platform-core/src/checkout/createSession.ts`, `apps/cover-me-pretty/src/api/checkout-session/route.ts`

- Q: Where should the product admin UI live?
  - A: Within the caryina app itself — a new `/admin` route group, auth-gated by middleware checking an `CARYINA_ADMIN_KEY` env-var cookie. Rationale: `apps/xa-uploader` is XA-specific (has XA-branded field groups, XA catalog contract endpoint, XA storefronts). The existing CMS admin routes live in `apps/cms` which is a separate deployment. A lightweight `/admin` section within `apps/caryina` is the lowest-friction option for a 3-SKU shop: it shares the app's Next.js router, can reuse `products.server.ts` / `inventory.server.ts` directly, and requires no separate deployment. The CMS remains a future upgrade path if catalog complexity grows.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` (XA-specific), `apps/cms/src/app/cms/` (separate deployment)

- Q: What auth mechanism should gate the admin area?
  - A: Env-var-based admin key (`CARYINA_ADMIN_KEY`) checked via Next.js middleware on the `/admin` route group. On successful login (POST `/admin/api/auth`), set an `admin_session` HttpOnly cookie with a signed HMAC of the key. This mirrors the `apps/xa-b` admin pattern (`accessAdmin.ts`, `api/access-admin/login/route.ts`). No OAuth/external IdP needed for a single-operator shop.
  - Evidence: `apps/xa-b/src/lib/accessAdmin.ts`, `apps/xa-b/src/app/api/access-admin/login/route.ts`

- Q: Should real Stripe payment be in scope for this plan?
  - A: Yes. The operator asks for the site to be "ready for shopping cart usage" — a cart that doesn't complete payment is incomplete. The Stripe infrastructure already exists and `cover-me-pretty` provides the reference route. Wiring real checkout adds ~2 tasks of moderate complexity with low risk (test via `STRIPE_USE_MOCK=true`). Excluding it would require a follow-up plan immediately.
  - Evidence: `apps/caryina/shop.json` (`"billingProvider": "stripe"`), `packages/platform-core/src/checkout/createSession.ts`

- Q: Can the static export (`OUTPUT_EXPORT=1`) support cart/admin functionality?
  - A: Partially. Static export is used for Caryina staging on Cloudflare Pages (free tier). API routes (`/api/cart`, `/api/checkout-session`, `/admin/api/*`) do not render statically — they require the Worker build. For the Worker build (production), all route handlers work. For staging static export, API routes must be excluded (using the same `mv dir _dir-off` pattern documented in MEMORY.md). Cart state on the static export can fall back to localStorage only (no server cart API), which is acceptable for staging review.
  - Evidence: MEMORY.md CI/Deploy Pipeline section, `apps/caryina/shop.json`

### Open (Operator Input Required)

- Q: Are Stripe API keys available for Caryina, or do they need to be set up (new Stripe account vs. shared with another shop)?
  - Why operator input is required: API key provisioning requires account access the operator holds.
  - Decision impacted: Checkout task cannot be completed without valid keys; test mode keys are needed at minimum.
  - Decision owner: Pete (operator)
  - Default assumption: Stripe test-mode keys will be provided; plan tasks will use `STRIPE_USE_MOCK=true` for unit tests and rely on real test-mode keys for staging.

## Confidence Inputs

- Implementation: 82%
  - Evidence basis: Full CRUD infrastructure exists in platform-core. CartContext, AddToCartButton, createCheckoutSession all present and used in other apps. Main implementation unknowns: cart API route in caryina, admin middleware + auth, product form UI.
  - Raises to ≥80: Already there. Confirmed by reading platform-core CRUD layer.
  - Raises to ≥90: Reading `cover-me-pretty` checkout session route in full + running typecheck against caryina with new imports.

- Approach: 80%
  - Evidence basis: Architecture decisions resolved (admin in-app, env-var auth, CartProvider wrap, Stripe session route). Three workstreams are independent and can be sequenced.
  - Raises to ≥80: Already there.
  - Raises to ≥90: Operator confirms Stripe keys available; a spike confirms `CartProvider` wraps cleanly into caryina's locale layout without regression.

- Impact: 88%
  - Evidence basis: Customer-facing: replaces stub checkout with real purchase capability. Operator-facing: replaces manual JSON edits with web UI. Both are unambiguously valuable. Minor risk: stock display adds latency to PLP/PDP if inventory reads become slow (mitigated by the existing error-catch fallback in `catalogSkus.server.ts:103`).
  - Raises to ≥90: Confirm `stock` field renders correctly on staging for all 3 SKUs.

- Delivery-Readiness: 78%
  - Evidence basis: All dependencies exist. Stripe keys are the one unknown. Admin UI needs design work (form for product fields).
  - Raises to ≥80: Operator confirms Stripe test keys are available or will be created.
  - Raises to ≥90: Keys set in env; `STRIPE_USE_MOCK=true` passes for cart/checkout unit tests.

- Testability: 75%
  - Evidence basis: Cart integration test pattern exists (`functions/themes/[theme]/__tests__/cart-checkout-integration.test.ts`). Stripe mock already built. Admin routes will need new test patterns.
  - Raises to ≥80: Cart API route + admin CRUD routes have unit tests written alongside implementation.
  - Raises to ≥90: E2E Playwright test covers add-to-cart → checkout flow on staging.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Stripe keys not yet provisioned for Caryina | Medium | High | Plan tasks gate checkout wiring on `STRIPE_TEST_KEY` being set; mock mode (`STRIPE_USE_MOCK=true`) covers unit tests. Operator confirms before task starts. |
| Static export incompatibility for `/api/cart` and `/admin/api/*` routes | Low | Medium | Use the established `mv dir _dir-off` pattern during static export; API routes hidden during export, present in Worker build. Already precedented in CI pipeline. |
| Admin form complexity grows (media upload, multilingual titles) | Medium | Medium | MVP admin scoped to text fields + quantity update only. Media URLs entered as text (or file upload via simple `<input type="file">` + local storage). Full media management deferred. |
| Cart session persistence across Cloudflare Worker requests | Low | Medium | `CartProvider` already has localStorage fallback. Server-side cart via cookie is the primary path; verify cookie-based cart survives navigation in Worker context. |
| `writeRepo` / `writeInventory` race condition under concurrent admin saves | Low | Low | Atomic write pattern + filesystem lock already implemented in JSON backends. No additional mitigation needed. |
| Admin auth key leakage or misconfiguration | Low | High | HMAC cookie required. Additional: set HttpOnly; Secure; SameSite=Strict cookie flags; enforce 1-hour session expiry; `CARYINA_ADMIN_KEY` must be ≥ 32 random chars (document in Planning Constraints). |

## Planning Constraints & Notes

- Must-follow patterns:
  - Client components must use `.client.tsx` suffix (repo convention).
  - All inventory writes must go through `inventoryRepository.write()` or `updateInventoryItem()` — never direct file writes.
  - All product writes must go through `writeRepo()` or `updateProductInRepo()`.
  - Admin routes must be protected by the same auth middleware as the login check — never expose write endpoints without auth.
  - `STRIPE_USE_MOCK=true` for all Jest tests touching checkout.
- Rollout/rollback expectations:
  - Additive only: `CartProvider` wrap is additive. Stock display is additive. Admin routes are new. Existing funnel (`/checkout?sku=`) can remain as fallback until Stripe checkout is verified.
  - Rollback: removing `CartProvider` from layout restores previous behaviour instantly.
- Observability expectations:
  - Analytics event `add_to_cart` already in allowlist — fires automatically from `AddToCartButton`.
  - `checkout_started` and `order_completed` analytics clients already wired in existing pages.
  - Add low-stock alert recipients to `data/shops/caryina/settings.json` once admin is live.

## Suggested Task Seeds (Non-binding)

**Workstream A — Product Admin**
- A0: Configure Caryina for Cloudflare Worker build — add `@opennextjs/cloudflare` dev dependency, create `wrangler.toml`, add CI Worker deploy job. **Prerequisite for all Workstream A + C tasks.**
- A1: Add `/admin` route group to caryina app with middleware auth gate (`CARYINA_ADMIN_KEY`)
- A2: Add `POST /admin/api/auth` login route (env-var key validation → HttpOnly cookie)
- A3: Add product list admin page (`/admin/products`) — reads `readRepo("caryina")` including drafts
- A4: Add product create/edit form page (`/admin/products/[id]`) — POST to new product CRUD API route
- A5: Add product CRUD API routes (`POST /admin/api/products`, `PATCH /admin/api/products/[id]`, `DELETE /admin/api/products/[id]`) wiring `writeRepo`/`updateProductInRepo`/`deleteProductFromRepo`
- A6: Add inventory edit panel to product admin — `PATCH /admin/api/inventory/[sku]` wiring `updateInventoryItem`

**Workstream B — Inventory-Aware Storefront**
- B1: Add stock badge component — reads `sku.stock` (already in `SKU`); renders "In stock", "Low stock (N left)" (when `stock ≤ 2` — MVP hardcoded threshold; see `lowStockThreshold` data gap note in Data & Contracts), or "Out of stock"
- B2: Render stock badge on PLP cards (`ProductMediaCard.tsx`)
- B3: Render stock badge on PDP (`product/[slug]/page.tsx`) + disable CTA when `stock === 0`

**Workstream C — Cart + Stripe Checkout**
- C1: Add `CartProvider` to caryina locale layout (`app/[lang]/layout.tsx`)
- C2: Add `/api/cart` route handler (GET/POST/DELETE) — implements the server-side cart store that `CartProvider` calls. Use `@acme/platform-core/cartCookie` and `@acme/platform-core/cartStore` as the backing layer; confirm these modules work with anonymous cookie-only state (no auth session required) before starting.
- C3: Replace "Continue to checkout" link on PDP/StickyCheckoutBar with `AddToCartButton` + cart icon in header
- C4: Add `/cart` page — renders `CartState`, quantity controls, remove buttons, subtotal, "Proceed to payment" button
- C5: Add checkout session API route (`/api/checkout-session`) wiring `createCheckoutSession()` — based on `cover-me-pretty` reference
- C5b: Add Stripe payment verification on `/success` — call `stripe.checkout.sessions.retrieve(sessionId)` on page load and confirm `payment_status === 'paid'` before showing confirmation. This guards against redirect manipulation showing success for unpaid orders. Alternative: implement `POST /api/webhooks/stripe` (`payment_intent.succeeded`) if redirect-only verify proves insufficient.
- C6: Wire `/checkout` page to call `/api/checkout-session` and redirect to Stripe-hosted checkout; update `/success` and `/cancelled` to handle Stripe redirect params

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none required
- Deliverable acceptance package:
  - Admin: product list loads, product can be created/edited/deleted, inventory quantity editable.
  - Storefront: stock badge visible on PLP + PDP for all 3 SKUs; "Out of stock" disables CTA.
  - Cart: add-to-cart works on PDP; cart page shows items + totals; "Proceed to payment" initiates Stripe session (test mode); success/cancelled pages handle redirect.
  - All existing caryina tests pass. New unit tests added for admin routes + cart API route.
- Post-delivery measurement plan:
  - `add_to_cart` GA4 event fires (verify in GA4 debug view).
  - `checkout_started` fires on Stripe redirect.
  - `order_completed` fires on `/success` with correct `orderId` + `amount`.
  - Admin: operator manually creates a test product and verifies it appears on the PLP.

## Evidence Gap Review

### Gaps Addressed

1. **Citation Integrity**: All core claims traced to specific files and line numbers. `catalogSkus.server.ts:64–68` cited for stock aggregation. Repository CRUD interfaces cited. CartContext and Stripe session builder confirmed via direct file reads.
2. **Boundary Coverage**: Static export incompatibility for API routes identified and mitigation documented (precedented `mv` pattern). Admin auth boundary defined (HttpOnly cookie + middleware). Stripe mock for test isolation confirmed.
3. **Testing/Validation Coverage**: Existing test files verified (read during investigation). Coverage gaps for new paths (cart API, admin routes) explicitly identified with recommended approach.
4. **Business Validation**: Hypotheses stated. All three workstreams have explicit acceptance criteria.
5. **CMS relationship clarified**: `apps/cms` confirmed to host inventory API routes (`/api/data/[shop]/inventory`) but is a separate deployment — admin-in-app approach selected for Caryina, with CMS as a noted future upgrade path.

### Confidence Adjustments

- Implementation confidence raised from initial 70% estimate to 82%: confirmed that `cartSkus.server.ts` already provides `stock` (no new data layer needed for workstream B), and that `CartProvider` + `createCheckoutSession` are fully built and used in sibling apps.
- Delivery-Readiness docked to 78% (from potential 85%) due to open Stripe key question.

### Remaining Assumptions

- Stripe test-mode keys will be provided by the operator before C5/C6 tasks begin.
- `CartProvider` with `/api/cart` backend will work correctly within Caryina's Next.js App Router layout without structural conflict — reasonable given precedent in other apps, but not verified by running a typecheck or dev server. Additionally: CartContext `/api/cart` is assumed to work with anonymous cookie-only state (no pre-existing auth/session required). Verify the CartContext fetch handler has no session dependency before C1–C4 tasks begin.
- Admin product form will be acceptable as a simple text-field form for MVP (no drag-and-drop media upload); media URLs entered as text strings matching the `MediaItem.url` shape.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (Stripe keys are a task-level dependency, not a planning blocker)
- Recommended next step: `/lp-do-plan caryina-catalog-cart --auto`
