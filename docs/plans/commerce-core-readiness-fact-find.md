---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Platform / Commerce
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: commerce-core-readiness
Related-Plan: docs/plans/commerce-core-readiness-plan.md
---

# Commerce Core Readiness Fact-Find Brief

## Audit Metadata

- **Repo-Root:** `/Users/petercowling/base-shop`
- **Audit-Ref:** `working-tree` (uncommitted changes in fact-find doc)
- **Base-Commit:** `fbc1d0d7f50ff4acf7da8c25b1bf92f5e767d1d6`
- **Audit-Date:** 2026-02-01
- **Method:** Grep (ripgrep), Read (file inspection), Git (history/show), package.json inspection
- **Auditor:** Agent (Opus)

## Scope
### Summary
You asked for improvement ideas (planning inputs) for the platform's centralized **inventory**, **shopping cart**, and **checkout** capabilities, in preparation for launching apps where customers can buy products. The first target business is **CochlearFit Headbands** (`apps/cochlearfit` + `apps/cochlearfit-worker`), so this brief includes a specific gap analysis for that tenant.

### Goals
- Establish a clear "source of truth" and operational model for inventory checks + reservations across tenants.
- Standardize cart storage and validation so checkout can be reliable and secure (no price/stock tampering).
- Standardize checkout session creation + webhook finalization so orders and inventory are consistent.
- Identify the concrete gaps to get CochlearFit to a production-grade purchase flow using (as much as possible) shared platform primitives.

### Non-goals
- Redesigning product data modeling end-to-end (PIM, full catalog pipelines) beyond what's necessary to support cart/checkout correctness.
- Implementing long-horizon central inventory routing/allocation unless it is required for the first commercial launch.
- Building complete fulfillment/warehouse tooling (shipping label automation, etc.) beyond "close the initial purchase loop".

### Constraints & Assumptions
- Constraints:
  - **Fail-closed tenancy** for authoritative operations (checkout/session creation, webhooks, inventory holds). This is a core principle in `docs/plans/edge-commerce-standardization-implementation-plan.md`.
  - Edge to Node split: Workers can route, but authoritative writes generally land in Node/DB (see `apps/checkout-gateway-worker/src/index.ts`, `apps/front-door-worker/src/routing.ts`).
  - Inventory JSON fallback exists for offline/dev, but production-grade holds require a real DB-backed transactional store (see `packages/platform-core/src/inventoryHolds.ts`).
- Assumptions:
  - Headband commerce is primarily a **sale** flow (not rental), so we expect `mode: "sale"` paths to be exercised (see `docs/orders.md` and `packages/platform-core/src/checkout/createSession.ts`).

## Findings (Verified)

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

### Cart Storage Location

**Platform (cover-me-pretty and similar tenants):**
- Cart state persists **server-side** via `packages/platform-core/src/cartStore.ts`
- Backends supported: memory (default), Upstash Redis, Cloudflare Durable Objects
- Cookie contains only a **signed cart ID** (`__Host-CART_ID`), not the full payload
- Cart ID is base64url-encoded and HMAC-signed with `CART_COOKIE_SECRET`
- Evidence: `/packages/platform-core/src/cartCookie.ts` lines 14-55

**CochlearFit tenant:**
- Cart state persists **client-side** in `localStorage`
- Key: `cochlearfit:cart`
- Stores only `variantId` + `quantity` per item (no prices stored)
- Evidence: `/apps/cochlearfit/src/contexts/cart/cartStorage.ts` lines 4, 22-51

### Inventory Reservation is Part of Checkout Correctness
- Verified: `apps/cover-me-pretty/src/api/checkout-session/route.ts` attempts `createInventoryHold`, carries `inventoryReservationId` into the Stripe session metadata
- Webhook handlers commit or release holds on completion/expiry
- Evidence: `/packages/platform-core/src/webhookHandlers/checkoutSessionCompleted.ts` lines 97-100, `/packages/platform-core/src/webhookHandlers/checkoutSessionExpired.ts` lines 5-17

### Standard Cart/Checkout API Shape
- The platform is converging on `/api/cart`, `/api/checkout-session`, `/api/stripe-webhook`, and `/api/inventory/validate`
- Both `/api/checkout-session` and `/api/checkout/session` are supported (front-door and gateway allowlist both)
- Evidence: `/apps/front-door-worker/src/routing.ts` lines 14-16, `/apps/checkout-gateway-worker/src/routing.ts` lines 10-11

### Stripe Session Creation Uses Idempotency Key
- Stripe session creation uses `buildCheckoutIdempotencyKey` based on normalized cart inputs
- Evidence: `/packages/platform-core/src/checkout/createSession.ts` lines 332-370

### Coupon Validation is Server-Side
- Coupons are looked up server-side via `findCoupon(shopId, coupon)`, not trusted from client
- Evidence: `/packages/platform-core/src/checkout/createSession.ts` lines 205-214

### CochlearFit Uses Stripe Price IDs (Not price_data)
- Worker creates checkout sessions using Stripe Price IDs (line_items[n][price])
- Price IDs are currently placeholders (`price_${prefix}_${size}_${color}`)
- Evidence: `/apps/cochlearfit-worker/src/index.ts` lines 111, 246-260

### Key Modules / Files
#### Inventory
- `packages/platform-core/src/types/inventory.ts` — canonical `InventoryItem` schema + `variantKey(sku, variantAttributes)`.
- `packages/platform-core/src/repositories/inventory.server.ts` — backend resolver (Prisma vs JSON) and `readInventory`/`writeInventory`.
- `packages/platform-core/src/inventoryValidation.ts` — converts cart to inventory requests; validates per-shop inventory; optionally validates via central inventory routing.
- `packages/platform-core/src/inventoryHolds.ts` — DB-backed inventory reservation holds (decrement inventory at hold time; commit/release later).
- `packages/platform-core/src/centralInventory/centralInventory.server.ts` — DB-only "central inventory + routing" subsystem (not stubbed when `DATABASE_URL` is unset).
- `docs/inventory-migration.md` + `docs/persistence.md` + `docs/.env.reference.md` — backend selection semantics and migration references.

#### Cart
- `packages/platform-core/src/cartStore.ts` — cart persistence abstraction (memory/redis/cloudflare durable objects) + default factory.
- `packages/platform-core/src/cartCookie.ts` — cart id cookie encode/decode.
- `packages/platform-core/src/cartApiForShop.ts` — shop-aware cart API (uses `getShopSkuById`).
- `packages/platform-core/src/repositories/catalogSkus.server.ts` — builds `SKU` from products + inventory (computes `stock` and `sizes`).
- `packages/platform-core/src/cart/cartLineSecure.ts` + `packages/platform-core/src/cart/migrate.ts` — "secure cart" formats that store only `skuId` (no pricing data) + migration helpers.
- `packages/platform-core/src/cart/hydrate.ts` + `packages/platform-core/src/cart/apiTypes.ts` — supports hydrating secure cart lines with fresh SKU data at read time.
- `packages/platform-core/src/cart/cartValidation.ts` — unified cart validation + optional hold creation; currently DB-only for holds and error-prone if central inventory tables are absent.

#### Checkout
- `packages/platform-core/src/checkout/createSession.ts` — creates Stripe checkout sessions; supports `mode: "rental" | "sale"`.
- `packages/platform-core/src/checkout/reprice.ts` — "trust boundary" repricing of secure carts (currently unused).
- `packages/platform-core/src/orders/creation.ts` — order persistence (`RentalOrder` model is used as the order record for now).

#### Headband (CochlearFit tenant)
- `apps/cochlearfit/src/data/products.ts` — hardcoded catalog + placeholder Stripe price ids + `inStock: true`.
- `apps/cochlearfit/src/contexts/cart/CartContext.tsx` — localStorage-backed cart state.
- `apps/cochlearfit/src/lib/checkout.ts` — calls `/api/checkout/session` and `/api/checkout/session/:id`.
- `apps/cochlearfit-worker/src/index.ts` — creates **hosted** Stripe checkout sessions via Stripe REST API, validates inventory via `INVENTORY_AUTHORITY_URL`, stores a minimal order record in KV, and handles Stripe webhooks.

### Patterns & Conventions Observed
- Repository backend selection is centralized via `packages/platform-core/src/repositories/repoResolver.ts` and env vars (`DB_MODE`, `*_BACKEND`) documented in `docs/.env.reference.md`.
- Tenant apps are converging on a **contracted route set** and capability declarations (see `apps/cover-me-pretty/src/runtimeContractManifest.ts` and `apps/storefront/src/runtimeContractManifest.ts`).
- Edge routing for authoritative endpoints is "explicit allowlist" (front-door and gateway) rather than "route anything under /api/*" (see `apps/front-door-worker/src/routing.ts`, `apps/checkout-gateway-worker/src/routing.ts`).
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

#### Inventory authority contract (edge/worker to node)
- There are currently two shapes in-repo:
  - Multi-tenant-ish: `apps/cms/src/app/api/inventory/validate/route.ts` expects `{ shopId, items: [{ sku, quantity, variantKey? }] }` but uses `validateInventoryAvailability` which only consumes `variantAttributes` (and Zod strips unknown keys).
  - Tenant-scoped: `apps/cover-me-pretty/src/api/inventory/validate/route.ts` expects `{ items: [{ sku, quantity, variantAttributes? }] }` and uses the tenant's `shop.id`.
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

#### Likely blast radius of "centralized improvements"
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
  - "Sale" checkout flow is present in platform-core (`mode: "sale"`) but is not exercised by any tenant route in `apps/*` (only docs/tests mention it; see `docs/orders.md` and `packages/platform-core/__tests__/checkout-session.test.ts`).
  - Inventory authority contract mismatch across apps (CMS vs tenant endpoints) is not centrally tested; it's easy for workers to drift.

### Related docs/plans
- `docs/plans/edge-commerce-standardization-implementation-plan.md` — defines the intended end-state routing + tenancy requirements for inventory/checkout.
- `docs/orders.md` — documents "rental vs sale" checkout semantics (platform intention).
- `docs/inventory-migration.md` — JSON to Prisma inventory migration reference.

### Recent Git History (Targeted)
- Platform-core cart/checkout area was refactored and test coverage was added around checkout helpers in late 2025 (e.g. "refactor: modularize checkout helpers", "test: cover optional checkout metadata fields") — see `git log` on `packages/platform-core/src/cart` and `packages/platform-core/src/checkout`.
- CochlearFit apps have had little recent churn relative to platform-core (see `git log` on `apps/cochlearfit` and `apps/cochlearfit-worker`).

## Decisions (Needed)

### Decision 1: CochlearFit Architecture
**Question:** For the headband launch, do you want to converge CochlearFit onto the platform contract (front-door + gateway + node authority), or keep the per-tenant `apps/cochlearfit-worker` approach?

**Why it matters:** This determines whether checkout logic and webhooks live in platform-core/node (shared) vs. remain duplicated in a tenant worker.

**Options:**
- **Option A (recommended):** Converge onto platform contract — route CochlearFit API calls through front-door + gateway to node commerce authority; retire `apps/cochlearfit-worker`.
- **Option B:** Keep `apps/cochlearfit-worker`, but extract and share catalog + Stripe price id mapping with the frontend to remove duplication and drift.

**Trade-offs:**
- Option A: Higher upfront integration effort if CochlearFit must remain "static export + worker-only"; long-term maintenance reduction.
- Option B: Faster to ship but keeps webhook/checkout logic fragmented; requires CochlearFit-specific monitoring.

### Decision 2: Checkout Mode
**Question:** Which checkout UX is desired for headbands: hosted Stripe Checkout (simpler, best for static exports) vs custom Payment Element (`ui_mode: "custom"`, currently used by platform-core)?

**Why it matters:** `packages/platform-core/src/checkout/createSession.ts` currently creates custom UI sessions (`ui_mode: "custom"` + `return_url`), while CochlearFit worker creates hosted sessions (`success_url`/`cancel_url`).

**Options:**
- **Option A:** Hosted Stripe Checkout for CochlearFit — add hosted-checkout session creator to platform-core/node authority.
- **Option B:** Migrate CochlearFit to custom UI — requires more frontend work in CochlearFit app.

**Trade-offs:**
- Hosted: simpler UX, Stripe manages payment form, less frontend code; limited customization.
- Custom UI: more control, consistent with platform-core; higher frontend complexity.

### Decision 3: Inventory Enforcement in Production
**Question:** What should happen if central inventory is unavailable in production?

**Options:**
- **Option A (recommended):** Fail-closed — reject checkout if inventory cannot be validated against authoritative source.
- **Option B:** Fallback to per-shop inventory in production (acceptable for shops that don't use central inventory).

**Recommendation:** Per-shop capability flag:
- If shop has `requiresCentralInventory: true`, FAIL in production when central is unavailable.
- If shop has `requiresCentralInventory: false`, fallback to per-shop inventory is acceptable.
- In DEV, fallback is always OK.

---

## Critical Gaps

### Gap 1: Webhook Tenancy — Per-Tenant Routes with Hardcoded Shop IDs

**Current State:** PER-TENANT WEBHOOK ROUTES WITH HARDCODED SHOP IDS. A tenant resolution mechanism (`StripeObjectShopMap` + metadata) exists for multi-tenant handling but is not uniformly used in the webhook route layer.

**Topology:**
- Each tenant app has its own webhook route that hardcodes the shop ID:
  - `apps/cover-me-pretty/src/api/stripe-webhook/route.ts`: `handleStripeWebhook("cover-me-pretty", event)`
  - `packages/template-app/src/api/stripe-webhook/route.ts`: `handleStripeWebhook("bcd", event)`
- CochlearFit worker has its own webhook endpoint with a **separate Stripe webhook secret** (`STRIPE_WEBHOOK_SECRET` in worker env)
- No global webhook endpoint exists that dynamically resolves tenant from metadata

**Tenant Resolution Mechanism (exists but not used at route layer):**
- `packages/platform-core/src/stripeTenantResolver.ts` provides `resolveShopIdFromStripeEventWithFallback()`
- Resolution order: (1) Stripe metadata `shop_id`, (2) `StripeObjectShopMap` lookup, (3) RentalOrder records
- This is designed for a multi-tenant webhook endpoint but current routes bypass it with hardcoded shop IDs

**Invariant Violated / Risk:**
- Routes pass hardcoded shop IDs, bypassing the resolver entirely
- If a webhook arrives at the wrong tenant endpoint, it will be processed with the wrong shop ID
- No fail-closed assertion validates that the event's metadata matches the hardcoded shop

**Risk Level: MEDIUM** (per-tenant routes are acceptable if properly configured; becomes HIGH if a global multi-tenant webhook is added without validation)

**Evidence:**
- `/apps/cover-me-pretty/src/api/stripe-webhook/route.ts` line 24: `await handleStripeWebhook("cover-me-pretty", event);`
- `/packages/template-app/src/api/stripe-webhook/route.ts` line 25: `await handleStripeWebhook("bcd", event);`
- `/apps/cochlearfit-worker/src/index.ts` lines 3-4: separate `STRIPE_WEBHOOK_SECRET`
- `/packages/platform-core/src/stripeTenantResolver.ts` lines 62-75: unused resolver

**Recommendation:**
1. For per-tenant routes: Add fail-closed assertion — resolve shop from event metadata and assert it matches the hardcoded shop ID; reject if mismatch.
2. If migrating to a global webhook endpoint: Use `resolveShopIdFromStripeEventWithFallback()` and reject if resolution fails.
3. Document architectural divergence: CochlearFit worker uses separate Stripe credentials (may or may not be same Stripe account).

**Proof Test:** `Given a webhook event with shop_id=X delivered to tenant Y's endpoint, the handler should reject with 4xx status if X !== Y.`

---

### Gap 2: Hold Idempotency and Atomicity

**Current State:** Hold creation and Stripe session creation are NOT atomic. Holds are not idempotent on retry.

**Invariant Violated / Risk:**
- If checkout-session creation retries, each retry creates a NEW hold (keyed on ULID, not cart)
- If Stripe session creation fails AFTER hold creation, the hold is NOT released (orphaned until TTL)
- This can exhaust inventory for legitimate customers

**Evidence:**
- `/apps/cover-me-pretty/src/api/checkout-session/route.ts` lines 153-201: hold created before Stripe session, no release on Stripe failure
- `/packages/platform-core/src/inventoryHolds.ts` line 65: `const holdId = ulid();` — new ID per call, not idempotent

**Recommendation:**
1. Derive hold idempotency key from the SAME normalized inputs used to build Stripe's idempotency key (or explicitly reuse `buildCheckoutIdempotencyKey` output as part of the hold key)
2. Add try/catch around Stripe session creation to release hold on failure
3. **Alternative:** Create hold AFTER Stripe session creation (requires verification: can we attach `inventory_reservation_id` to session metadata post-creation via Stripe API update?)

**Proof Test:** `Given two identical checkout requests within TTL, only ONE inventory hold should exist, and both requests should return the same Stripe session ID.`

---

### Gap 3: Cart Threat Model — Repricing Not Wired

**Current State:** Platform checkout trusts cart-provided prices. Repricing module exists but is not wired.

**Cart Storage Locations:**
- Platform tenants (cover-me-pretty): Server-side (Redis/memory/DO) with signed cart ID in cookie — risk is staleness/correctness, not direct tampering
- CochlearFit: Client-side localStorage — stores only `variantId + quantity`, no prices; prices looked up from worker's catalog at checkout time

**Invariant Violated / Risk:**
- `packages/platform-core/src/checkout/createSession.ts` uses `item.sku.price` from cart state
- A compromised or stale server-side cart could lead to incorrect pricing
- CochlearFit is safer here (uses Stripe Price IDs), but platform-core path is vulnerable

**Evidence:**
- `/packages/platform-core/src/checkout/createSession.ts` lines 63-86: `buildInventorySnapshot` uses `line.sku.price` from cart
- `/packages/platform-core/src/checkout/reprice.ts` lines 48-137: unused repricing function with security comment
- `/apps/cochlearfit/src/contexts/cart/cartStorage.ts` lines 44-50: stores only variantId + quantity

**Recommendation:**
1. Wire `repriceCart` into checkout-session creation flow (priority 1)
2. Repricing can be wired WITHOUT full secure-cart storage migration — call reprice before session creation on current cart format
3. Migrate cart storage to `CartStateSecure` format in a subsequent phase

**Proof Test:** `Given a cart with stale/incorrect prices, checkout-session creation should reject or use authoritative prices from the catalog.`

---

### Gap 4: Stripe Account Model — Partially Resolved

**Current State:** Single set of Stripe env vars per deployment. Tenant-specific accounts may exist but are not proven.

**What's Proven:**
- Single `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` from `@acme/config/env/payments`
- No per-shop Stripe key lookup in platform-core code
- CochlearFit worker has its own env vars (may be same or different Stripe account)
- Platform uses `price_data` (dynamic pricing) — this is a design choice that avoids Price ID drift

**What's Unclear:**
- Whether tenant-specific Stripe accounts exist or are planned
- Whether CochlearFit's Stripe credentials point to the same account
- Whether one deployment serves all tenants or one deployment per tenant

**Evidence:**
- `/packages/config/src/env/payments.ts` lines 5-29: single set of Stripe credentials
- `/apps/cochlearfit-worker/src/index.ts` lines 2-12: separate env vars, unknown if same account
- Grep for "shop.*stripe.*key" returned no per-tenant key selection code

**Recommendation:**
1. Document Stripe account ownership and credential management per environment
2. Confirm CochlearFit credentials are same/different account
3. If multi-account is needed, implement per-shop Stripe credential lookup

**Proof Test:** `Given shop configuration, Stripe API calls should use the correct credentials for that shop.`

---

### Gap 5: Central Inventory Fallback Behavior

**Current State:** Silent fallback to per-shop inventory when central is unavailable.

**Invariant Violated / Risk:**
- Read-only validation silently falls back, which could allow checkout when central inventory should be authoritative
- No environment-specific policy (same code path for DEV and PROD)

**Evidence:**
- `/packages/platform-core/src/inventoryValidation.ts` lines 92-130: catches import error and falls back
- Hold creation requires DB and fails-closed (good)

**Recommendation:**
1. Add per-shop capability flag: `requiresCentralInventory: boolean`
2. Fallback policy:
   - DEV: fallback always OK
   - PROD + shop requires central: FAIL (reject checkout)
   - PROD + shop doesn't use central: fallback OK
3. Log/alert when falling back to per-shop inventory in production
4. Add health check for central inventory availability

**Proof Test:** `Given PROD environment with shop.requiresCentralInventory=true and central inventory unavailable, checkout should fail with explicit error.`

---

### Gap 6: Rate Limiting on Checkout Endpoints

**Current State:** No rate limiting on checkout-session creation. Anonymous checkout is allowed.

**Invariant Violated / Risk:**
- Anonymous checkout + no rate limiting = abuse vector
- Could be exploited for: inventory hold exhaustion, Stripe rate limit exhaustion, card testing attacks

**Evidence:**
- `/apps/cover-me-pretty/src/api/checkout-session/route.ts`: no rate limit imports or calls
- `/apps/cochlearfit-worker/src/index.ts`: no rate limit logic
- `/apps/cms/src/lib/server/rateLimiter.ts` exists for CMS operations but not checkout

**Risk Level: HIGH (Launch-Blocking)**

**Recommendation:**
1. Add rate limiting to checkout-session creation (10 requests/minute/IP suggested)
2. Rate limiting should live at edge (gateway worker) for best protection
3. Add to Phase 1, not post-launch
4. Reasoning: prevents inventory hold exhaustion + Stripe abuse before it happens

**Proof Test:** `Given 15 checkout requests from same IP within 1 minute, requests 11-15 should receive 429 Too Many Requests.`

---

## Proposed Way Forward (Reframed Phases)

### Phase 0: Decisions and Invariants (BLOCKER)

Before implementation work begins, these decisions must be made:

1. **CochlearFit architecture decision** (see Decision 1)
2. **Checkout mode decision** (see Decision 2)
3. **Inventory enforcement policy** (see Decision 3)

**Deliverable:** Architecture Decision Records (ADRs) for each decision

**Proof test:** ADRs reviewed and signed off.

---

### Phase 1: Checkout Correctness Envelope

**Goal:** Checkout session creation is authoritative and idempotent across retries; holds are 1:1 with checkout intent; failures do not strand holds.

**Work items:**
1. **Wire repricing into checkout flow**
   - Call `repriceCart` before `createCheckoutSession`
   - Reject if repriced totals differ from cart by more than epsilon
   - Add tests for price tampering rejection

2. **Make hold creation idempotent**
   - Derive hold idempotency key from `buildCheckoutIdempotencyKey` inputs
   - Return existing hold if already created for same cart + checkout intent

3. **Handle Stripe failure after hold creation**
   - Wrap Stripe call in try/catch
   - Release hold on Stripe failure

4. **Add rate limiting to checkout endpoints**
   - Implement per-IP rate limiting at gateway worker (10/min suggested)
   - Add abuse detection metrics

**Proof test:** `Given two identical checkout requests: (1) only one hold exists, (2) both return same session ID, (3) prices match authoritative catalog, (4) 11th request from same IP within minute returns 429.`

---

### Phase 2: Contract Coherence + Webhook Hardening

**Goal:** All commerce paths enforce the same contracts; webhook tenant resolution is fail-closed.

**Work items:**
1. **Unify inventory authority contract**
   - Canonicalize request shape: `{ items: [{ sku, quantity, variantAttributes? }] }`
   - Shop context from `x-shop-id` header or explicit `shopId` body field
   - Add contract tests for all consumers

2. **Add fail-closed webhook tenant assertion**
   - Resolve shop from event metadata
   - Assert matches expected shop ID; reject on mismatch
   - Log resolution failures for monitoring

3. **Add conformance tests**
   - Webhook idempotency test
   - Metadata completeness test
   - Tenant resolution test

4. **Clarify route path divergence**
   - Confirm `/api/checkout-session` and `/api/checkout/session` both work
   - Document canonical path; ensure workers allowlist covers both

**Proof test:** `Given webhook event with shop_id=X at tenant Y endpoint (Y !== X), handler rejects with 400. Given inventory validate request without shop context, handler rejects with 400.`

---

### Phase 3: CochlearFit Integration

**Goal:** Get CochlearFit to production-grade checkout using platform primitives.

**Work items (depend on Phase 0 decisions):**

1. **Replace placeholder Stripe Price IDs**
   - Create real Stripe Products and Prices in Stripe dashboard
   - OR migrate to `price_data` (dynamic pricing like platform-core)

2. **Wire up shop context**
   - Add `shop_id` to metadata
   - Configure inventory authority URL

3. **Migrate order persistence** (if converging to platform)
   - From KV to platform order store
   - OR add reconciliation bridge

4. **Add webhook handling alignment**
   - `checkout.session.completed` — record order via platform
   - `checkout.session.expired` — cleanup

**Proof test:** `CochlearFit checkout flow completes end-to-end: inventory validated, hold created, Stripe session created, webhook processed, order persisted, hold committed.`

---

### Phase 4: Platform Hardening

**Goal:** Production-grade reliability and observability.

**Work items:**
1. **Environment enforcement**
   - `REQUIRE_CENTRAL_INVENTORY` flag for production (per-shop capability)
   - `REQUIRE_DB_BACKEND` flag for production

2. **Add scheduled hold reaper**
   - Cron job to release expired holds (supplement opportunistic reaping)
   - Alert on high hold expiration rate

3. **Observability**
   - Hold creation/commit/release metrics
   - Checkout success/failure rates by shop
   - Inventory validation latency

4. **Security hardening**
   - CAPTCHA for high-value guest checkout
   - Card testing detection
   - Fraud review integration (Stripe Radar)

**Proof test:** `Grafana dashboard shows hold lifecycle metrics; PagerDuty alerts on >10% hold expiration rate; checkout failure rate <1%.`

---

## Launch Readiness Assessment

### Launch-Blocking Items

| Item | Status | Risk | Notes |
|------|--------|------|-------|
| Repricing wired into checkout | NOT DONE | HIGH | Prices currently trusted from cart |
| Hold idempotency | NOT DONE | HIGH | Retries create multiple holds |
| Hold release on Stripe failure | NOT DONE | HIGH | Orphaned holds possible |
| Rate limiting on checkout | NOT DONE | HIGH | Abuse vector; prevents hold exhaustion |
| CochlearFit real Price IDs | NOT DONE | MEDIUM | Placeholder IDs in code |

### Requires Decision (Blocking)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| CochlearFit architecture | Platform contract vs Worker | Platform contract (long-term maintainability) |
| Checkout mode | Custom UI vs Hosted | Depends on CochlearFit frontend constraints |
| Inventory enforcement | Fail-closed vs Fallback | Per-shop capability flag |

### Post-Launch (Can Defer)

| Item | Risk | Notes |
|------|------|-------|
| Central inventory routing | LOW | Can launch with per-shop inventory |
| Hold TTL extension | LOW | 20 min TTL usually sufficient |
| Scheduled hold reaper | LOW | Opportunistic reaping adequate initially |
| CAPTCHA for high-value checkout | LOW | Monitor first, add if abuse detected |

---

## Updated Confidence Inputs (for /plan-feature)

- **Implementation:** 60%
  - Critical gaps identified: repricing not wired, hold idempotency broken, no rate limiting
  - Strong foundation exists but significant work remains in Phase 1

- **Approach:** 85%
  - Clear phase structure now defined with explicit proof tests
  - Blocking decisions identified upfront
  - Risk levels properly categorized

- **Impact:** 70%
  - Blast radius well-documented
  - CochlearFit requires more work than expected
  - Phase 1 is self-contained and can ship incrementally

---

## Suggested Task Seeds (Non-binding)

### Platform-level improvements (shared)
- Unify inventory authority request/response contract
- Make central inventory validation fail-closed with per-shop capability flag
- Complete secure-cart migration (phase 2)
- Add first-class "sale checkout-session" route support

### CochlearFit-specific gap closure
- Decide convergence model (Phase 0)
- Fix inventory validation shop context
- Replace placeholder Stripe Price IDs
- Close the "purchase loop" UX (clear cart on payment, shipping/tax)
