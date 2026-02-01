---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform / Commerce
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: commerce-core-readiness
Related-Plan: docs/plans/commerce-core-readiness-plan.md
---

# Commerce Core Readiness Fact-Find Brief

## Scope
### Summary
You asked for improvement ideas (planning inputs) for the platform’s centralized **inventory**, **shopping cart**, and **checkout** capabilities, in preparation for launching apps where customers can buy products. The first target business is **CochlearFit Headbands** (`apps/cochlearfit` + `apps/cochlearfit-worker`), so this brief includes a specific gap analysis for that tenant.

### Goals
- Establish a clear “source of truth” and operational model for inventory checks + reservations across tenants.
- Standardize cart storage and validation so checkout can be reliable and secure (no price/stock tampering).
- Standardize checkout session creation + webhook finalization so orders and inventory are consistent.
- Identify the concrete gaps to get CochlearFit to a production-grade purchase flow using (as much as possible) shared platform primitives.

### Non-goals
- Redesigning product data modeling end-to-end (PIM, full catalog pipelines) beyond what’s necessary to support cart/checkout correctness.
- Implementing long-horizon central inventory routing/allocation unless it is required for the first commercial launch.
- Building complete fulfillment/warehouse tooling (shipping label automation, etc.) beyond “close the initial purchase loop”.

### Constraints & Assumptions
- Constraints:
  - **Fail-closed tenancy** for authoritative operations (checkout/session creation, webhooks, inventory holds). This is a core principle in `docs/plans/edge-commerce-standardization-implementation-plan.md`.
  - Edge ↔ Node split: Workers can route, but authoritative writes generally land in Node/DB (see `apps/checkout-gateway-worker/src/index.ts`, `apps/front-door-worker/src/routing.ts`).
  - Inventory JSON fallback exists for offline/dev, but production-grade holds require a real DB-backed transactional store (see `packages/platform-core/src/inventoryHolds.ts`).
- Assumptions:
  - Headband commerce is primarily a **sale** flow (not rental), so we expect `mode: "sale"` paths to be exercised (see `docs/orders.md` and `packages/platform-core/src/checkout/createSession.ts`).

## Repo Audit (Current State)
### Entry Points
- Cart API (tenant app):
  - `apps/cover-me-pretty/src/api/cart/route.ts` — exposes a shop-aware cart API via `createShopCartApi`.
  - `packages/platform-core/src/cartApiForShop.ts` — `createShopCartApi` implementation (SKU resolution via shop catalog + inventory).
- Checkout session API (tenant app):
  - `apps/cover-me-pretty/src/api/checkout-session/route.ts` — creates Stripe checkout sessions + attempts inventory holds (DB) with a read-only validation fallback.
- Stripe webhook handling:
  - `packages/platform-core/src/handleStripeWebhook.ts` + `packages/platform-core/src/stripe-webhook.ts` — dispatches webhooks with idempotency tracking.
  - `packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts` — creates/updates orders and commits inventory holds.
  - `packages/platform-core/src/webhookHandlers/checkoutSessionExpired.ts` — releases inventory holds on expiry.
- Inventory authority (for edge/worker callers):
  - `apps/cms/src/app/api/inventory/validate/route.ts` — multi-tenant-ish validate endpoint (currently expects `shopId` in the body).
  - `apps/cover-me-pretty/src/api/inventory/validate/route.ts` — tenant-scoped validate endpoint (shop id from `shop.json`).
- Edge routing allowlists:
  - `apps/front-door-worker/src/routing.ts` — allowlist that routes `/api/cart` to storefront and `/api/checkout-session`, `/api/inventory/validate`, `/api/stripe-webhook` to the gateway.
  - `apps/checkout-gateway-worker/src/routing.ts` — allowlist that enforces `x-shop-id` for shop-scoped endpoints.

### Key Modules / Files
#### Inventory
- `packages/platform-core/src/types/inventory.ts` — canonical `InventoryItem` schema + `variantKey(sku, variantAttributes)`.
- `packages/platform-core/src/repositories/inventory.server.ts` — backend resolver (Prisma vs JSON) and `readInventory`/`writeInventory`.
- `packages/platform-core/src/inventoryValidation.ts` — converts cart → inventory requests; validates per-shop inventory; optionally validates via central inventory routing.
- `packages/platform-core/src/inventoryHolds.ts` — DB-backed inventory reservation holds (decrement inventory at hold time; commit/release later).
- `packages/platform-core/src/centralInventory/centralInventory.server.ts` — DB-only “central inventory + routing” subsystem (not stubbed when `DATABASE_URL` is unset).
- `docs/inventory-migration.md` + `docs/persistence.md` + `docs/.env.reference.md` — backend selection semantics and migration references.

#### Cart
- `packages/platform-core/src/cartStore.ts` — cart persistence abstraction (memory/redis/cloudflare durable objects) + default factory.
- `packages/platform-core/src/cartCookie.ts` — cart id cookie encode/decode.
- `packages/platform-core/src/cartApiForShop.ts` — shop-aware cart API (uses `getShopSkuById`).
- `packages/platform-core/src/repositories/catalogSkus.server.ts` — builds `SKU` from products + inventory (computes `stock` and `sizes`).
- `packages/platform-core/src/cart/cartLineSecure.ts` + `packages/platform-core/src/cart/migrate.ts` — “secure cart” formats that store only `skuId` (no pricing data) + migration helpers.
- `packages/platform-core/src/cart/hydrate.ts` + `packages/platform-core/src/cart/apiTypes.ts` — supports hydrating secure cart lines with fresh SKU data at read time.
- `packages/platform-core/src/cart/cartValidation.ts` — unified cart validation + optional hold creation; currently DB-only for holds and error-prone if central inventory tables are absent.

#### Checkout
- `packages/platform-core/src/checkout/createSession.ts` — creates Stripe checkout sessions; supports `mode: "rental" | "sale"`.
- `packages/platform-core/src/checkout/reprice.ts` — “trust boundary” repricing of secure carts (currently unused).
- `packages/platform-core/src/orders/creation.ts` — order persistence (`RentalOrder` model is used as the order record for now).

#### Headband (CochlearFit tenant)
- `apps/cochlearfit/src/data/products.ts` — hardcoded catalog + placeholder Stripe price ids + `inStock: true`.
- `apps/cochlearfit/src/contexts/cart/CartContext.tsx` — localStorage-backed cart state.
- `apps/cochlearfit/src/lib/checkout.ts` — calls `/api/checkout/session` and `/api/checkout/session/:id`.
- `apps/cochlearfit-worker/src/index.ts` — creates **hosted** Stripe checkout sessions via Stripe REST API, validates inventory via `INVENTORY_AUTHORITY_URL`, stores a minimal order record in KV, and handles Stripe webhooks.

### Patterns & Conventions Observed
- Repository backend selection is centralized via `packages/platform-core/src/repositories/repoResolver.ts` and env vars (`DB_MODE`, `*_BACKEND`) documented in `docs/.env.reference.md`.
- Tenant apps are converging on a **contracted route set** and capability declarations (see `apps/cover-me-pretty/src/runtimeContractManifest.ts` and `apps/storefront/src/runtimeContractManifest.ts`).
- Edge routing for authoritative endpoints is “explicit allowlist” (front-door and gateway) rather than “route anything under /api/*” (see `apps/front-door-worker/src/routing.ts`, `apps/checkout-gateway-worker/src/routing.ts`).
- Checkout/session is designed to be idempotent (see checkout idempotency key in `packages/platform-core/src/checkout/createSession.ts`).

### Data & Contracts
#### Inventory data model
- Per-shop inventory items (JSON fallback): `data/shops/<shop>/inventory.json` (described in `README.md` and `docs/inventory-migration.md`).
- Canonical variant identity: `variantKey(sku, variantAttributes)` in `packages/platform-core/src/types/inventory.ts`.
- Holds (reservations): `packages/platform-core/src/inventoryHolds.ts` relies on DB-backed `inventoryItem`, `inventoryHold`, `inventoryHoldItem` models (no JSON hold implementation).

#### Cart data model
- Current cart store (`CartState`) stores hydrated `SKU` objects (legacy, mutable; see `packages/platform-core/src/cart/cartState.ts`).
- Secure cart format exists (`CartStateSecure`) and is designed to store only identifiers and metadata (see `packages/platform-core/src/cart/cartLineSecure.ts`), but is not yet wired through `packages/platform-core/src/cartStore.ts` or the cart APIs.

#### Checkout contracts
- Stripe session creation is centralized in `packages/platform-core/src/checkout/createSession.ts`.
- Webhook side effects are centralized in `packages/platform-core/src/handleStripeWebhook.ts` and handlers under `packages/platform-core/src/webhookHandlers/*`.
- Inventory hold linkage is carried via `metadata.inventory_reservation_id` (see `packages/platform-core/src/checkout/createSession.ts`, `packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts`).

#### Inventory authority contract (edge/worker → node)
- There are currently two shapes in-repo:
  - Multi-tenant-ish: `apps/cms/src/app/api/inventory/validate/route.ts` expects `{ shopId, items: [{ sku, quantity, variantKey? }] }` but uses `validateInventoryAvailability` which only consumes `variantAttributes` (and Zod strips unknown keys).
  - Tenant-scoped: `apps/cover-me-pretty/src/api/inventory/validate/route.ts` expects `{ items: [{ sku, quantity, variantAttributes? }] }` and uses the tenant’s `shop.id`.
- CochlearFit worker currently POSTs `{ items: [{ sku, quantity, variantAttributes }] }` **without** a `shopId` and expects the authority to accept this (`apps/cochlearfit-worker/src/index.ts`), so it will not work with the CMS endpoint as written.

### Dependency & Impact Map
#### Upstream dependencies
- Stripe:
  - Node SDK via `@acme/stripe` in platform-core checkout/webhooks.
  - Direct Stripe REST API usage in `apps/cochlearfit-worker/src/index.ts`.
- Datastore:
  - Prisma/Postgres for orders + holds (see `packages/platform-core/src/db.ts`, `packages/platform-core/src/orders/creation.ts`, `packages/platform-core/src/inventoryHolds.ts`).
  - JSON fallback under `DATA_ROOT` for inventory and some other repos.
- Edge routing:
  - Cloudflare Workers in `apps/front-door-worker` and `apps/checkout-gateway-worker`.
- Cart storage:
  - Upstash Redis (optional) and Cloudflare Durable Objects (optional) via `packages/platform-core/src/cartStore.ts`.

#### Downstream dependents (current)
- `apps/cover-me-pretty` depends on:
  - `@acme/platform-core/cartApiForShop` (`apps/cover-me-pretty/src/api/cart/route.ts`)
  - `@acme/platform-core/checkout/session` (`apps/cover-me-pretty/src/api/checkout-session/route.ts`)
  - `@acme/platform-core/inventoryHolds` (`apps/cover-me-pretty/src/api/checkout-session/route.ts`)
- `apps/cms` depends on:
  - `@acme/platform-core/inventoryValidation` (`apps/cms/src/app/api/inventory/validate/route.ts`)
  - its own cart handlers (`apps/cms/src/app/api/cart/*`)
- `apps/cochlearfit`/`apps/cochlearfit-worker` currently do **not** depend on platform-core cart/checkout; they implement their own.

#### Likely blast radius of “centralized improvements”
- Platform-core changes to cart storage format or checkout flow impact any tenant using:
  - `@acme/platform-core/cartStore`, `@acme/platform-core/cartCookie`, `@acme/platform-core/cartApiForShop`
  - `@acme/platform-core/checkout/session`
  - `@acme/platform-core/stripe-webhook`
- Edge route contract changes affect:
  - `apps/front-door-worker` and `apps/checkout-gateway-worker` allowlists
  - Any tenant worker currently calling `/api/inventory/validate` (e.g. CochlearFit worker).

### Tests & Quality Gates
- Platform-core has targeted tests for cart cookie, cart API handlers, cart store, inventory, checkout totals/metadata/session, and webhook handlers under `packages/platform-core/__tests__/*`.
- cover-me-pretty has route-level tests for checkout-session and runtime contract manifest under `apps/cover-me-pretty/__tests__/*`.
- Notable gaps for the stated goals:
  - Secure-cart repricing (`packages/platform-core/src/checkout/reprice.ts`) exists but is unused (no integration tests around it).
  - “Sale” checkout flow is present in platform-core (`mode: "sale"`) but is not exercised by any tenant route in `apps/*` (only docs/tests mention it; see `docs/orders.md` and `packages/platform-core/__tests__/checkout-session.test.ts`).
  - Inventory authority contract mismatch across apps (CMS vs tenant endpoints) is not centrally tested; it’s easy for workers to drift.

### Related docs/plans
- `docs/plans/edge-commerce-standardization-implementation-plan.md` — defines the intended end-state routing + tenancy requirements for inventory/checkout.
- `docs/orders.md` — documents “rental vs sale” checkout semantics (platform intention).
- `docs/inventory-migration.md` — JSON → Prisma inventory migration reference.

### Recent Git History (Targeted)
- Platform-core cart/checkout area was refactored and test coverage was added around checkout helpers in late 2025 (e.g. “refactor: modularize checkout helpers”, “test: cover optional checkout metadata fields”) — see `git log` on `packages/platform-core/src/cart` and `packages/platform-core/src/checkout`.
- CochlearFit apps have had little recent churn relative to platform-core (see `git log` on `apps/cochlearfit` and `apps/cochlearfit-worker`).

## Questions
### Resolved
- Q: Is there an intended “standard” cart + checkout API shape?
  - A: Yes. The platform is converging on `/api/cart`, `/api/checkout-session`, `/api/stripe-webhook`, and `/api/inventory/validate` routed via front-door/gateway workers (see `apps/front-door-worker/src/routing.ts`, `apps/checkout-gateway-worker/src/routing.ts`, and the route matrix in `docs/plans/edge-commerce-standardization-implementation-plan.md`).
- Q: Is inventory reservation (hold) intended to be part of checkout correctness?
  - A: Yes. `apps/cover-me-pretty/src/api/checkout-session/route.ts` attempts `createInventoryHold`, carries `inventoryReservationId` into the Stripe session metadata, and the webhook handler commits or releases the hold (`packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts`, `packages/platform-core/src/webhookHandlers/checkoutSessionExpired.ts`).

### Open (User Input Needed)
- Q: For the headband launch, do you want to converge CochlearFit onto the platform contract (front-door + gateway + node authority), or keep the per-tenant `apps/cochlearfit-worker` approach?
  - Why it matters: This determines whether checkout logic and webhooks live in platform-core/node (shared) vs. remain duplicated in a tenant worker.
  - Decision impacted: Integration plan for checkout and inventory holds; ops model (Stripe secrets, webhook endpoints, order persistence).
  - Default + risk: Default to platform contract to reduce duplication; risk is higher upfront integration effort if CochlearFit must remain “static export + worker-only”.
- Q: Which checkout UX is desired for headbands: hosted Stripe Checkout (simpler, best for static exports) vs custom Payment Element (`ui_mode: "custom"`, currently used by platform-core)?
  - Why it matters: `packages/platform-core/src/checkout/createSession.ts` currently creates custom UI sessions (`ui_mode: "custom"` + `return_url`), while CochlearFit worker creates hosted sessions (`success_url`/`cancel_url`).
  - Decision impacted: Whether we add a hosted-checkout session creator to platform-core/node authority, or migrate CochlearFit to custom UI.
  - Default + risk: Default to hosted checkout for CochlearFit; risk is divergence from platform-core’s current session creator unless we extend it.

## Confidence Inputs (for /plan-feature)
- **Implementation:** 75%
  - Strong evidence: most primitives exist (inventory validation, holds, cart store abstraction, checkout creation, webhooks).
  - Missing: wiring secure cart + repricing end-to-end; unifying inventory authority contract; adding tenant usage of sale mode.
- **Approach:** 70%
  - Two viable architectures exist for CochlearFit (platform-converged vs per-tenant worker). Both are plausible; choosing one improves confidence significantly.
  - The edge-commerce standardization plan provides a coherent end-state, but not all tenants follow it yet.
- **Impact:** 70%
  - We can enumerate current call sites (cover-me-pretty, CMS, workers), but a “standardization” effort can touch multiple apps/workers and requires careful contract management and testing.

## Planning Constraints & Notes
- Must-follow patterns:
  - Tenant context must be explicit for authoritative operations (prefer `x-shop-id` at the gateway boundary; do not silently default).
  - Pricing trust boundary: do not trust client/cart-provided prices; reprice server-side before session creation (secure cart + `packages/platform-core/src/checkout/reprice.ts`).
  - Inventory reservations must be idempotent and linked to Stripe sessions via metadata.
- Rollout/rollback expectations:
  - Prefer introducing new endpoints/variants behind a capability flag or manifest-driven routing (see `apps/*/src/runtimeContractManifest.ts`) before switching traffic.
  - Keep old routes as aliases only when they are deterministic and safe (`/api/checkout/session` vs `/api/checkout-session`).
- Observability expectations:
  - Propagate request ids end-to-end (see `apps/checkout-gateway-worker/src/requestId.ts`).

## Suggested Task Seeds (Non-binding)
### Platform-level improvements (shared)
- Unify inventory authority request/response contract:
  - Canonicalize on `{ items: [{ sku, quantity, variantAttributes? }] }` + shop context from `x-shop-id` (gateway) or explicit `shopId` (node-only), but not both competing shapes.
  - Add contract tests covering worker → node expectations.
- Make central inventory validation safe-by-default:
  - Ensure `validateInventoryFromCentral` / `validateCart` fall back cleanly when central inventory tables/delegates are absent (avoid “inventory unavailable” in JSON/dev mode).
- Complete secure-cart migration:
  - Update cart storage APIs to store `CartStateSecure` and return `hydrated` SKUs for display.
  - Wire `repriceCart` into checkout session creation to enforce price/stock trust boundary.
- Add first-class “sale checkout-session” route support:
  - Implement `mode: "sale"` selection at the app route level (based on shop configuration), and add tenant route coverage exercising it.

### CochlearFit-specific gap closure
- Decide convergence model:
  - Option A (preferred): route CochlearFit API calls through front-door + gateway to node commerce authority; retire `apps/cochlearfit-worker`.
  - Option B: keep `apps/cochlearfit-worker`, but extract and share catalog + Stripe price id mapping with the frontend to remove duplication and drift.
- Fix inventory validation for CochlearFit:
  - Ensure the worker provides correct shop context and variant attributes to the authority (`apps/cochlearfit-worker/src/index.ts` currently omits `shopId` and only sends `variantAttributes`).
  - Ensure an authoritative inventory dataset exists for CochlearFit (either via `data/shops/<shop>` JSON or DB-backed inventory).
- Close the “purchase loop” UX:
  - Clear the cart on confirmed payment (currently not done in `apps/cochlearfit/src/components/checkout/ThankYouPanel.tsx` / cart context).
  - Add shipping/tax decisions (Stripe Tax vs static rates, shipping address + rates) and implement them in the chosen checkout mode.
  - Ensure webhook finalization persists an order record in a durable store aligned with the platform (KV-only may be insufficient for long-term operations).

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (recommended to decide early, but can be planned as explicit DECISION tasks):
  - CochlearFit architecture choice (platform contract vs tenant worker).
  - Hosted vs custom checkout session mode for the headband launch.
- Recommended next step:
  - Proceed to `/plan-feature` using `Feature-Slug: commerce-core-readiness`, and include a small first phase of DECISION tasks to lock the CochlearFit approach and checkout mode.

