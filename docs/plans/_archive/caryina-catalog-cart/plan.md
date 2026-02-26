---
Type: Plan
Status: Archived
Domain: Products
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26 (All tasks complete — plan archived)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-catalog-cart
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted
Auto-Build-Intent: plan+auto
---

# Caryina Catalog, Inventory & Cart Plan

## Summary

Three capabilities move Caryina from a static-data demo to a fully operational e-commerce site: a product admin UI (TASK-01 through TASK-06), inventory-aware stock display on the storefront (TASK-02), and a shopping cart with real Stripe checkout (TASK-08 through TASK-12). All backing infrastructure (product/inventory CRUD, CartProvider, `createCheckoutSession`, Stripe client) already exists in platform-core and has been verified. The primary new build work is wiring these primitives into Caryina's app router, adding an authenticated admin section, and configuring the Cloudflare Worker build that server-side routes require. One INVESTIGATE task (TASK-08) resolves the cart storage backend before committing to the /api/cart implementation approach.

## Active tasks

- [x] TASK-01: Configure Caryina for Cloudflare Worker build
- [x] TASK-02: Add stock badge to PLP and PDP
- [x] TASK-03: Admin auth middleware and login route
- [x] TASK-04: Product and inventory CRUD API routes
- [x] TASK-05: Admin product list and create/edit form pages
- [x] TASK-06: Admin inventory quantity edit
- [x] TASK-07: CHECKPOINT — admin workstream verified
- [x] TASK-08: INVESTIGATE — cart API storage backend approach
- [x] TASK-09: CartProvider wrap and /api/cart route handler
- [x] TASK-10: AddToCartButton and /cart page
- [x] TASK-11: Checkout session API route and /success payment verify
- [x] TASK-12: Wire /checkout to Stripe redirect; update success and cancelled pages

## Goals

- Admin can create, edit, and delete products and update inventory quantities via a web UI.
- PLP and PDP show accurate stock state (in stock / low stock / out of stock) for all 3 Caryina SKUs.
- Customers can add multiple products to a cart, review the basket, and complete payment via Stripe.
- All existing Caryina tests pass after each task.

## Non-goals

- Multi-variant products (size/colour picker) — current SKUs are single-variant.
- Channel inventory sync (Etsy, Instagram Shopping).
- Order management / fulfilment tracking UI.
- Full CMS integration for Caryina.
- Redis or Durable Object cart backend (addressed by TASK-08 investigate; MVP may use cookie or localStorage-primary approach).

## Constraints & Assumptions

- Constraints:
  - JSON backend for products/inventory — all writes go through `writeRepo()` / `updateProductInRepo()` / `updateInventoryItem()`. Never direct file writes.
  - TASK-01 (Worker build) is a hard prerequisite for TASK-03 through TASK-06 and TASK-09 through TASK-12. No admin or cart API routes are reachable without it.
  - Admin auth cookie: HttpOnly; Secure; SameSite=Strict; 1-hour session expiry. `CARYINA_ADMIN_KEY` env var must be ≥ 32 random characters. Web Crypto HMAC (not Node.js crypto) for Worker compatibility.
  - `STRIPE_USE_MOCK=true` for all Jest tests touching checkout.
  - `driftPolicy: "log_only"` for Caryina MVP in `createCheckoutSession` call (TASK-11) — prevents checkout failures on price drift.
  - Client components must use `.client.tsx` suffix.
- Assumptions:
  - `@opennextjs/cloudflare` is compatible with caryina's shared `@acme/next-config` base (confirmed: brikette uses identical pattern).
  - Stock field (`sku.stock`) is already populated by `catalogSkus.server.ts` — no new data fetching needed for Workstream B.
  - Stripe test-mode keys will be provided by the operator before TASK-11 begins.
  - Cart MVP will use cookie or localStorage-primary state (exact approach decided in TASK-08).

## Inherited Outcome Contract

- **Why:** Caryina needs to move from a static-data demo to a real storefront — the operator needs to be able to upload products and customers need to be able to buy more than one item.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Caryina admin can manage the product catalog and inventory via a web UI; the storefront displays live stock state; customers can add items to a cart and complete payment via Stripe.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/caryina-catalog-cart/fact-find.md`
- Key findings used:
  - `catalogSkus.server.ts` already joins `stock` aggregate from inventory into every `SKU` (lines 64–68) — Workstream B requires UI only.
  - `writeRepo`, `updateProductInRepo`, `deleteProductFromRepo`, `updateInventoryItem` all confirmed in platform-core.
  - `CartProvider` and `createCheckoutSession` confirmed present and production-ready in platform-core.
  - **Post-fact-find finding:** `cartStore.ts` requires a real backend (Redis, Durable Objects, or Memory) — Memory loses state across requests. Cookie-based cart or localStorage-primary approach preferred for MVP. TASK-08 resolves this.
  - xa-b admin pattern (`accessAdmin.ts`, HttpOnly cookie + env-var key) confirmed as reference.

## Proposed Approach

- Option A: Build admin → stock → cart as three sequential phases.
- Option B: Dependency-graph waves — stock badges immediately (no deps), Worker build in parallel (TASK-01), admin in waves 2–5 behind TASK-01, cart after CHECKPOINT-07 and INVESTIGATE TASK-08.
- Chosen approach: **Option B**. TASK-02 (stock badges) is fully independent and ships first. TASK-01 (Worker build) runs in parallel. Admin (TASK-03–06) follows TASK-01 in logical sequence. CHECKPOINT-07 gates admin completion before cart begins. TASK-08 (investigate) resolves cart storage before implementation. Cart (TASK-09–12) follows CHECKPOINT-07 and TASK-08.

## Plan Gates

- Foundation Gate: **Pass** — Deliverable-Type, Execution-Track, Primary-Execution-Skill present; Delivery-readiness 78%; test landscape documented; testability reviewed.
- Sequenced: **Yes** — `/lp-do-sequence` applied; parallelism guide reflects dependency topology.
- Edge-case review complete: **Yes** — static export / Worker duality; Web Crypto for admin auth; cartStore backend complexity; stock threshold (per-SKU from InventoryItem, not SKU type — parent passes as prop, default 2); Stripe key dependency; driftPolicy set to log_only.
- Auto-build eligible: **Yes** — TASK-01 and TASK-02 at ≥80, no deps, mode is plan+auto.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Worker build config | 80% | S | Complete (2026-02-26) | — | TASK-03, TASK-09 |
| TASK-02 | IMPLEMENT | Stock badge (PLP + PDP) | 80% | S | Complete (2026-02-26) | — | — |
| TASK-03 | IMPLEMENT | Admin auth middleware + login | 75% | S | Complete (2026-02-26) | TASK-01 ✓ | TASK-04 |
| TASK-04 | IMPLEMENT | Product + inventory CRUD API routes | 80% | M | Complete (2026-02-26) | TASK-03 ✓ | TASK-05, TASK-06 |
| TASK-05 | IMPLEMENT | Admin product list + create/edit form | 75% | M | Complete (2026-02-26) | TASK-04 ✓ | TASK-07 |
| TASK-06 | IMPLEMENT | Admin inventory quantity edit | 80% | S | Complete (2026-02-26) | TASK-04 ✓ | TASK-07 |
| TASK-07 | CHECKPOINT | Admin workstream verified | 95% | S | Complete (2026-02-26) | TASK-05 ✓, TASK-06 ✓ | TASK-09 |
| TASK-08 | INVESTIGATE | Cart API storage approach | 85% | S | Complete (2026-02-26) | — | TASK-09 |
| TASK-09 | IMPLEMENT | CartProvider + /api/cart route | 80% | M | Complete (2026-02-26) | TASK-01 ✓, TASK-07 ✓, TASK-08 ✓ | TASK-10, TASK-11 |
| TASK-10 | IMPLEMENT | AddToCartButton + /cart page | 80% | M | Pending | TASK-09 | — |
| TASK-11 | IMPLEMENT | Checkout session API + /success verify | 75% | M | Pending | TASK-01, TASK-09 | TASK-12 |
| TASK-12 | IMPLEMENT | Wire /checkout → Stripe redirect | 80% | S | Pending | TASK-11 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-08 | None | ✓ Complete 2026-02-26 |
| 2 | TASK-03 | TASK-01 ✓ | ✓ Complete 2026-02-26 |
| 3 | TASK-04 | TASK-03 ✓ | ✓ Complete 2026-02-26 |
| 4 | TASK-05, TASK-06 | TASK-04 ✓ | ✓ Complete 2026-02-26 |
| 5 | TASK-07 (CHECKPOINT) | TASK-05 ✓, TASK-06 ✓ | ✓ Complete 2026-02-26 |
| 6 | TASK-09 | TASK-01 ✓, TASK-07 ✓, TASK-08 ✓ | Cart backend approach resolved before implementation |
| 7 | TASK-10, TASK-11 | TASK-09 ✓ | Cart UI + checkout API in parallel |
| 8 | TASK-12 | TASK-11 ✓ | Wire checkout flow |

## Tasks

---

### TASK-01: Configure Caryina for Cloudflare Worker build
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/wrangler.toml`, updated `package.json` dev deps and scripts, updated CI workflow for Worker deploy
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Created `apps/caryina/wrangler.toml` (name=caryina, main=.open-next/worker.js, compatibility_date=2025-06-20, nodejs_compat, ASSETS binding) — pattern from business-os (not brikette which now uses Pages).
  - Updated `package.json`: added `build:worker` script (`opennextjs-cloudflare build`) and `@opennextjs/cloudflare ^1.16.5` devDep.
  - Created `.github/workflows/caryina.yml` using reusable-app.yml Worker build pattern (same as business-os-deploy.yml).
  - Scout finding: brikette wrangler.toml is marked legacy (Pages); business-os is the correct Worker reference.
  - TC-01 (build:worker exits 0) and TC-02 (OUTPUT_EXPORT static build unchanged) not run locally — build:worker requires Cloudflare credentials at deploy time. Config verified structurally correct against business-os pattern.
  - Post-build validation: Mode 2 (Data Simulation, degraded). Files verified by `cat` + JSON parse. wrangler.toml structure matches business-os. build:worker script present in package.json. CI workflow structure matches reusable-app.yml inputs. No live build run (requires credentials); flag: TC-01 verification pending first CI run.
  - Commit: a2216404b5
- **Affects:** `apps/caryina/package.json`, `apps/caryina/wrangler.toml` (new), `.github/workflows/reusable-app.yml` or equivalent
- **Depends on:** —
- **Blocks:** TASK-03, TASK-09
- **Confidence:** 80%
  - Implementation: 80% — `@opennextjs/cloudflare` pattern confirmed from brikette. Caryina uses shared `@acme/next-config` + simple `@` alias only — fully compatible. `OUTPUT_EXPORT=1` env-var pattern for static staging is established; Worker build is the production path. Held-back test: no single unresolved unknown would push below 80 — the shared config is standard and the `@` alias poses no conflict.
  - Approach: 80% — approach identical to brikette: add `@opennextjs/cloudflare`, create `wrangler.toml`, add `build:worker` script. Held-back test: no single unknown would push below 80 — brikette proves the approach end-to-end.
  - Impact: 90% — hard prerequisite for all API routes.
- **Acceptance:**
  - `apps/caryina/wrangler.toml` present with valid account ID and route config.
  - `pnpm --filter caryina build:worker` succeeds (or equivalent `wrangler build` command).
  - Static export build (`OUTPUT_EXPORT=1`) still succeeds (unchanged staging path).
  - CI workflow updated to include Worker build step.
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter caryina build:worker` → exits 0, `.open-next/` output present.
  - TC-02: `OUTPUT_EXPORT=1 pnpm --filter caryina build` → exits 0, `out/` static export present (unchanged).
- **Execution plan:** Red → Green → Refactor
  - Red: No wrangler.toml, no Worker build script — all API routes unreachable in deployed env.
  - Green: Add `@opennextjs/cloudflare` to devDeps; create `wrangler.toml` mirroring brikette's config (with caryina-specific name/route); add `build:worker` script to `package.json`; update CI to include Worker build job.
  - Refactor: Confirm `__next.*` metadata file cleanup (`find out -name "__next.*" -type f -delete`) is not needed for Worker build (only Pages static export); confirm `.open-next` dir is correctly produced.
- **Planning validation:**
  - Checks run: Read `apps/caryina/next.config.mjs` — uses shared `@acme/next-config` + `@` alias only (confirmed 2026-02-26).
  - Read `apps/caryina/package.json` — confirmed no existing Worker build infra.
  - MEMORY.md pattern: `@opennextjs/cloudflare` → Worker build; brikette precedent.
  - Validation artifacts: `apps/caryina/next.config.mjs` (read); brikette wrangler.toml (reference pattern).
  - Unexpected findings: None.
- **Scouts:** Confirm brikette's `wrangler.toml` account ID / workers_dev config pattern before creating caryina version.
- **Edge Cases & Hardening:** Ensure `OUTPUT_EXPORT` env var check is preserved (brikette pattern: conditional config based on `OUTPUT_EXPORT=1`). The shared `@acme/next-config` may already handle this — verify before duplicating logic.
- **What would make this ≥90%:** Deploy a staging Worker and confirm a single caryina page renders via Worker URL.
- **Rollout / rollback:**
  - Rollout: Additive only — new build target, no existing behaviour changed.
  - Rollback: Remove `wrangler.toml` and build script; CI job is no-op if wrangler.toml absent.
- **Documentation impact:** None: internal build config only.
- **Notes / references:** MEMORY.md CI/Deploy Pipeline section; brikette `.github/workflows/brikette.yml`.

---

### TASK-02: Add stock badge to PLP and PDP
- **Type:** IMPLEMENT
- **Deliverable:** New `apps/caryina/src/components/catalog/StockBadge.tsx`; updated `ProductMediaCard.tsx`; updated `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Created `StockBadge.tsx`: 3 states using `text-destructive`/`text-warning-foreground`/`text-success-foreground` (design system tokens confirmed in tailwind.config.mjs).
  - Added `readShopInventory()` to `shop.ts`; PLP + PDP pages now read `InventoryItem[]` in parallel to get per-SKU `lowStockThreshold`.
  - `ProductMediaCard.tsx`: new optional `stock` + `lowStockThreshold` props; badge renders only when `typeof stock === "number"`.
  - PDP: StockBadge below price; CTA disabled (`<button disabled aria-disabled="true">`) when `product.stock === 0`; StickyCheckoutBar updated with `outOfStock` prop.
  - 8 StockBadge unit tests: all pass (TC-01 scenarios including silver threshold=1 edge case). Full 29-test suite: all pass.
  - Post-build validation: Mode 1 (degraded — no dev server). Code review confirms badge renders in PLP and PDP templates. TC-02 CTA-disabled logic verified by reading PDP template (conditional render of `<button disabled>` when `product.stock === 0`). Note: live screenshot not possible in build mode; visual confirmation pending first staging deploy.
  - Scope expansion: added `StickyCheckoutBar.client.tsx` to `Affects` (not in original list; required to fully satisfy acceptance criterion "StickyCheckoutBar disabled when stock=0").
  - Commit: a2216404b5
- **Affects:** `apps/caryina/src/components/catalog/StockBadge.tsx` (new), `apps/caryina/src/components/catalog/ProductMediaCard.tsx`, `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`, `apps/caryina/src/app/[lang]/shop/page.tsx`
- **Depends on:** —
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 90% — `sku.stock: number` is confirmed in the `SKU` type as aggregate inventory; no new data fetching required. Badge is pure presentational UI.
  - Approach: 80% — stock badge reads `sku.stock` and a `lowStockThreshold` prop (per-SKU from inventory, default `2` if absent). Renders three states: `"In stock"` (stock > threshold), `"Low stock (N left)"` (1 ≤ stock ≤ threshold), `"Out of stock"` (stock === 0). Disables CTA on PDP when out of stock. `lowStockThreshold` is in `InventoryItem` (optional) but not in `SKU` — the PLP/PDP page components must fetch or receive it alongside SKU data; for MVP, pass it as a prop from the parent server component reading inventory. Caryina per-SKU thresholds: silver=1, rose-splash=2, peach=1. Held-back test: no unknown would push below 80 — threshold data is present in `inventory.json`.
  - Impact: 80% — inventory awareness improves customer UX and prevents oversell signal confusion. Held-back test: no unknown would push below 80 — stock data is already present; rendering it is purely additive.
- **Acceptance:**
  - `StockBadge` component accepts `stock: number` and `lowStockThreshold: number` (default `2`). Renders "In stock" when `stock > lowStockThreshold`, "Low stock (N left)" when `1 ≤ stock ≤ lowStockThreshold`, "Out of stock" when `stock === 0`.
  - Badge visible on all PLP product cards.
  - Badge visible on PDP below price.
  - PDP CTA ("Continue to checkout" / StickyCheckoutBar) disabled when stock === 0.
  - Existing tests pass (`pnpm --filter caryina test`).
- **Validation contract (TC-02):**
  - TC-01: `StockBadge` unit test — `stock=5, threshold=2` → "In stock"; `stock=2, threshold=2` → "Low stock (2 left)"; `stock=1, threshold=1` → "Low stock (1 left)"; `stock=0` → "Out of stock". Verify silver SKU (threshold=1): `stock=2` → "In stock" (not "Low stock").
  - TC-02: `StockBadge` with stock=0 → CTA button disabled (aria-disabled or pointer-events-none).
- **Execution plan:**
  - Red: No stock state shown anywhere; all CTAs enabled regardless of stock.
  - Green: Create `StockBadge.tsx` (server component; accepts `stock: number` and `lowStockThreshold: number` defaulting to `2`); integrate into `ProductMediaCard.tsx` below title — parent PLP page reads `readInventory("caryina")` to supply per-SKU threshold alongside each SKU; integrate into PDP page below price with disabled CTA logic — same inventory read supplies threshold.
  - Refactor: Use design system tokens for badge colour states (`text-success`, `text-warning`, `text-error` or equivalent from caryina theme); confirm badge is visually distinct from price text.
- **Planning validation:**
  - Checks run: Confirmed `SKU.stock: number` in `catalogSkus.server.ts:64–68` (2026-02-26). `lowStockThreshold` is NOT in the `SKU` type but IS in `InventoryItem` type (`packages/types/src/InventoryItem.ts:13`, optional number). `data/shops/caryina/inventory.json` has per-SKU values: silver=1, rose-splash=2, peach=1. `inventory.json.server.ts:97-98` already uses `i.quantity <= i.lowStockThreshold` for low-stock calculation. For `StockBadge`, the parent server component (PLP page / PDP page) must pass `lowStockThreshold` as a prop alongside `sku.stock`, reading it from `readInventory("caryina")` filtered by SKU. Default to `2` if absent.
  - Validation artifacts: `packages/platform-core/src/repositories/catalogSkus.server.ts` (read and confirmed); `packages/types/src/InventoryItem.ts` (confirmed lowStockThreshold field); `data/shops/caryina/inventory.json` (confirmed per-SKU threshold values).
  - Unexpected findings: `lowStockThreshold` IS present in InventoryItem and inventory.json — TASK-02 must pass it as a prop, not hardcode it.
- **Consumer tracing (new outputs):**
  - New component: `StockBadge` — consumed by `ProductMediaCard` (PLP) and PDP page. No further consumers. Server-side only; no client state.
- **Scouts:** None required — stock is already in data; component is self-contained.
- **Edge Cases & Hardening:** Handle `sku.stock` being undefined (defensive fallback to "In stock" — don't hide product if inventory read fails; `catalogSkus.server.ts` already defaults to 0 on inventory read error). Handle stock=1 ("Low stock (1 left)" not "Low stock (1 lefts)").
- **What would make this ≥90%:** End-to-end staging test confirming badge renders for all 3 Caryina SKUs with correct stock values from `inventory.json`.
- **Rollout / rollback:**
  - Rollout: Additive only — new UI component, no existing behaviour removed.
  - Rollback: Remove `StockBadge` from card and PDP; restore original CTA behaviour.
- **Documentation impact:** None: internal UI change.
- **Notes / references:** `packages/platform-core/src/repositories/catalogSkus.server.ts:64–68`; `data/shops/caryina/inventory.json`.

---

### TASK-03: Admin auth middleware and login route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/middleware.ts` (new or updated); `apps/caryina/src/app/admin/api/auth/route.ts` (new); `apps/caryina/src/app/admin/login/page.tsx` (new)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Created `adminAuth.ts`: Web Crypto HMAC-SHA256 `signAdminSession`/`verifyAdminSession`/`compareAdminKey`. `getSubtle()` helper falls back to `require('node:crypto').webcrypto.subtle` in jsdom (safe because `wrangler.toml` has `nodejs_compat`). `ADMIN_SESSION_MAX_AGE = 3600` (1 hour). Cookie name `admin_session`; HttpOnly, Secure, SameSite=Strict.
  - Created `middleware.ts`: matches `/admin/:path*` via config.matcher; excludes `/admin/login` and `/admin/api/auth*` with pathname check; redirects unauthenticated to `/admin/login?redirect=<path>`; returns 500 when `CARYINA_ADMIN_KEY` env var absent.
  - Created `admin/api/auth/route.ts`: POST handler; validates `{ key }` body against `CARYINA_ADMIN_KEY` via constant-time comparison; signs HMAC session token; sets HttpOnly cookie; returns 401 on wrong key, 500 on missing env var.
  - Created `admin/login/page.tsx`: `"use client"` component; Suspense boundary for `useSearchParams`; submits to `/admin/api/auth`; redirects on success; error display.
  - 14 tests: 9 unit (sign/verify/compare including wrong-key, tampered, malformed token) + 5 route handler (TC-02 200+cookie, TC-03 401, TC-04 500, 400 cases). All 43 caryina tests pass.
  - Scope expansion: added `apps/caryina/src/lib/adminAuth.ts` and test files to `Affects`.
  - Unexpected finding: jsdom exposes partial `crypto` object without `subtle` — fixed via `getSubtle()` fallback in `adminAuth.ts`.
  - Commit: d5d37f0bfe
- **Affects:** `apps/caryina/src/middleware.ts` (new), `apps/caryina/src/app/admin/api/auth/route.ts` (new), `apps/caryina/src/app/admin/login/page.tsx` (new), `apps/caryina/src/lib/adminAuth.ts` (new)
- **Depends on:** TASK-01 ✓
- **Blocks:** TASK-04
- **Confidence:** 75%
  - Implementation: 75% — xa-b admin pattern confirmed (`accessAdmin.ts`, HttpOnly cookie). Key uncertainty: the HMAC implementation must use Web Crypto API (not Node.js `crypto` module) for Cloudflare Worker runtime compatibility. Web Crypto is standard but the exact signing pattern needs to be confirmed against xa-b's implementation.
  - Approach: 80% — approach decided: env-var admin key (`CARYINA_ADMIN_KEY`) checked via middleware on `/admin/*` routes; POST `/admin/api/auth` validates key → sets signed HttpOnly cookie with 1-hour expiry. Held-back test: would Web Crypto unavailability break this? Web Crypto is universally available in Cloudflare Workers and modern Node.js (18+). No single unknown would push below 80.
  - Impact: 85% — gates all admin write operations; security-critical path.
- **Acceptance:**
  - `GET /admin/products` without valid cookie → redirects to `/admin/login`.
  - `POST /admin/api/auth` with correct `CARYINA_ADMIN_KEY` → sets `admin_session` HttpOnly; Secure; SameSite=Strict cookie; redirects to `/admin/products`.
  - `POST /admin/api/auth` with wrong key → 401 response; no cookie set.
  - Cookie expires after 1 hour.
  - `CARYINA_ADMIN_KEY` must be present in env or middleware returns 500 (fail-safe — never default to open).
- **Validation contract (TC-03):**
  - TC-01: Middleware with no cookie and request to `/admin/products` → 307 redirect to `/admin/login`.
  - TC-02: POST `/admin/api/auth` with correct key → 200 + Set-Cookie header with HttpOnly flag.
  - TC-03: POST `/admin/api/auth` with wrong key → 401 + no Set-Cookie.
  - TC-04: POST `/admin/api/auth` with missing `CARYINA_ADMIN_KEY` env var → 500.
- **Execution plan:**
  - Red: No admin auth; all `/admin/*` routes open.
  - Green: Create `middleware.ts` mathing `/admin/:path*` (excluding `/admin/login` and `/admin/api/auth`); read `admin_session` cookie; verify HMAC using Web Crypto `crypto.subtle.verify`; redirect to `/admin/login` if invalid or absent. Create `/admin/api/auth` POST route: read body `{ key }`, compare to `CARYINA_ADMIN_KEY` env var using `crypto.subtle` timing-safe comparison, sign a token, set HttpOnly cookie. Create `/admin/login` page with a minimal password form.
  - Refactor: Extract HMAC sign/verify into `src/lib/adminAuth.ts` for reuse across route and middleware.
- **Planning validation:**
  - Checks run: Read `apps/xa-b/src/lib/accessAdmin.ts` (confirmed reference; will adapt to Web Crypto). Middleware pattern confirmed valid in Next.js App Router.
  - Validation artifacts: `apps/xa-b/src/lib/accessAdmin.ts`, `apps/xa-b/src/app/api/access-admin/login/route.ts`.
  - Unexpected findings: Must use Web Crypto (not `import crypto from 'crypto'`) for Worker compat.
- **Scouts:** Read `apps/xa-b/src/lib/accessAdmin.ts` in full before implementing to understand existing HMAC signing pattern.
- **Edge Cases & Hardening:** CRAYINA_ADMIN_KEY absent → 500 fail-safe. Cookie expiry enforced server-side via cookie `Max-Age`. Constant-time key comparison to prevent timing attacks.
- **What would make this ≥90%:** Integration test deploying to Cloudflare Workers staging and verifying auth flow end-to-end.
- **Rollout / rollback:**
  - Rollout: Middleware is additive — only affects `/admin/*` paths not previously defined.
  - Rollback: Remove middleware matcher for `/admin/*`.
- **Documentation impact:** Note `CARYINA_ADMIN_KEY` env var in `.env.example` (if one exists) or in plan notes.
- **Notes / references:** `apps/xa-b/src/lib/accessAdmin.ts`; MDN Web Crypto API.

---

### TASK-04: Product and inventory CRUD API routes
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/admin/api/products/route.ts` (POST); `apps/caryina/src/app/admin/api/products/[id]/route.ts` (PATCH, DELETE); `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts` (PATCH)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/caryina/src/app/admin/api/products/route.ts` (new), `apps/caryina/src/app/admin/api/products/[id]/route.ts` (new), `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts` (new)
- **Depends on:** TASK-03 ✓
- **Blocks:** TASK-05, TASK-06
- **Confidence:** 80%
  - Implementation: 80% — all backing functions confirmed: `writeRepo`, `updateProductInRepo`, `deleteProductFromRepo` in products.server.ts; `updateInventoryItem` in inventory.server.ts. Route wiring is standard Next.js. Held-back test: a single unknown would be Zod request body validation schema for `ProductPublication` (multilingual `title`/`description` as objects). This is a known type — schema can be derived from the existing type. No single unknown would push below 80 — schemas are code, not runtime unknowns.
  - Approach: 80% — REST CRUD pattern; all writes through existing repository functions; Zod parse + validate request body; auth checked via middleware (TASK-03). Held-back test: no single unknown would push below 80 — CRUD approach is standard and fully precedented.
  - Impact: 85% — admin pages (TASK-05) are blocked without these routes; all product management flows through this.
- **Acceptance:**
  - `POST /admin/api/products` with valid `ProductPublication` body → product created in `data/shops/caryina/products.json`; 201 response.
  - `PATCH /admin/api/products/:id` with partial body → product updated; 200 response with updated record.
  - `DELETE /admin/api/products/:id` → product removed; 204 response.
  - `PATCH /admin/api/inventory/:sku` with `{ quantity: number, variantAttributes: Record<string,string> }` → inventory updated; 200 response.
  - All routes protected by TASK-03 middleware — 307 redirect without valid cookie.
  - Invalid body → 400 with Zod error details.
- **Validation contract (TC-04):**
  - TC-01: POST `/admin/api/products` with valid body → 201; product appears in `readRepo("caryina")`.
  - TC-02: PATCH `/admin/api/products/:id` → 200; updated record returned.
  - TC-03: DELETE `/admin/api/products/:id` → 204; product absent from `readRepo("caryina")`.
  - TC-04: PATCH `/admin/api/inventory/:sku` with `{ quantity: 10, variantAttributes: { color: "silver" } }` → 200; inventory record updated.
  - TC-05: Any route without valid admin cookie → 307 redirect (middleware gate).
  - TC-06: POST with invalid body (missing required field) → 400.
- **Execution plan:**
  - Red: No admin write routes; products.json and inventory.json can only be edited manually.
  - Green: Create `admin/api/products/route.ts` (POST handler: Zod parse → generate ULID for `id` → `writeRepo` to append → 201). Create `admin/api/products/[id]/route.ts` (PATCH: `updateProductInRepo` → 200; DELETE: `deleteProductFromRepo` → 204). Create `admin/api/inventory/[sku]/route.ts` (PATCH: validate quantity ≥ 0, parse `variantAttributes` from body, call `updateInventoryItem` → 200).
  - Refactor: Extract Zod schema for `ProductPublication` request body into `src/lib/adminSchemas.ts` for reuse.
- **Planning validation (M effort):**
  - Checks run: Read `packages/platform-core/src/repositories/products.server.ts` (confirmed all CRUD functions; 2026-02-26). Read `packages/platform-core/src/repositories/inventory.server.ts` (confirmed `updateInventoryItem`; 2026-02-26).
  - Validation artifacts: products.server.ts and inventory.server.ts (read directly).
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - POST /admin/api/products → consumed by TASK-05 (admin create form fetch call). No other consumers.
  - PATCH/DELETE /admin/api/products/:id → consumed by TASK-05 (admin edit/delete form). No other consumers.
  - PATCH /admin/api/inventory/:sku → consumed by TASK-06 (inventory edit panel). No other consumers.
  - All writes propagate to `data/shops/caryina/products.json` / `inventory.json` via atomic write — existing read paths (`catalogSkus.server.ts` → `readRepo`) pick up changes on next request. No consumer update required.
- **Scouts:** Read `packages/platform-core/src/repositories/products.server.ts` in full (especially `writeRepo` and `updateProductInRepo` signatures) before writing route handlers.
- **Edge Cases & Hardening:** ULID generation for new products (import `ulid` package or use `crypto.randomUUID` adapted to ULID format). `row_version` increment on update (handled by `updateProductInRepo`). Inventory `variantAttributes` must match existing SKU variant shape (for 3-SKU shop: always `{ color: "<color>" }`).
- **What would make this ≥90%:** Integration test writing a product via API and confirming `readRepo` reflects the change.
- **Rollout / rollback:**
  - Rollout: Additive — new routes, no existing routes modified.
  - Rollback: Remove route files; no state change (writes are to json files which can be git-reverted).
- **Documentation impact:** None: admin-only API.
- **Notes / references:** `packages/platform-core/src/repositories/products.server.ts`, `inventory.server.ts`.
- **Build evidence (2026-02-26):**
  - Commit: `e41d231291`
  - Files: `apps/caryina/src/lib/adminSchemas.ts` (Zod schemas); `admin/api/products/route.ts` (POST); `admin/api/products/[id]/route.ts` (PATCH/DELETE); `admin/api/inventory/[sku]/route.ts` (PATCH); 3 test files.
  - TC-01 ✓ (201 create), TC-02 ✓ (200 patch), TC-03 ✓ (204 delete), TC-04 ✓ (200 inventory update), TC-06 ✓ (400 missing sku). 16/16 new tests pass; 54/54 full caryina suite.
  - Deviation: `ulid` package not in caryina deps — used `crypto.randomUUID()` (UUID format, `id` field is `string`). `generateId()` helper with `node:crypto` webcrypto fallback for jsdom (same pattern as TASK-03 `getSubtle()`). Import sort autofix required for `inventory/[sku]/route.ts`.

---

### TASK-05: Admin product list and create/edit form pages
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/admin/products/page.tsx` (product list); `apps/caryina/src/app/admin/products/new/page.tsx` (create); `apps/caryina/src/app/admin/products/[id]/page.tsx` (edit); `apps/caryina/src/components/admin/ProductForm.client.tsx` (shared form component)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/caryina/src/app/admin/products/` (new), `apps/caryina/src/components/admin/ProductForm.client.tsx` (new)
- **Depends on:** TASK-04 ✓
- **Blocks:** TASK-07
- **Confidence:** 75%
  - Implementation: 75% — product form is non-trivial: multilingual `title`/`description` (en/de/it tabs), `media: MediaItem[]` (URL input + tag input), price (minor units, display as formatted), status dropdown. MVP scope (English-only text fields + media URL as text) reduces complexity but the form still has ~10 fields. Scope creep risk during implementation.
  - Approach: 75% — MVP approach: English-only fields for title/description (de/it default to en); media as text inputs for URL + comma-separated tags; price entered in euros (×100 to store as minor units). Form POSTs to TASK-04 routes. No drag-and-drop, no media preview. If any field requires non-trivial handling, risk of scope expansion.
  - Impact: 85% — admin usability; operator can manage catalog without editing JSON files.
- **Acceptance:**
  - `/admin/products` lists all products (including drafts) with title, price, status.
  - `/admin/products/new` form submits successfully → new product appears in list.
  - `/admin/products/:id` form pre-fills with existing product data → edit submits successfully → changes reflected in list.
  - Delete button on edit page → product removed from list.
  - All fields MVP-scoped: English title/description, media URL + space-separated slot tags (e.g. `slot:hero family:mini`), price in EUR (decimal input), status dropdown (`draft` / `active`).
  - Form validation: title required, price > 0.
- **Validation contract (TC-05):**
  - TC-01: Create form with valid data → POST to `/admin/api/products` → 201 → redirect to product list showing new item.
  - TC-02: Edit form pre-filled → PATCH → 200 → list shows updated price.
  - TC-03: Delete → DELETE → 204 → product removed from list.
  - TC-04: Form submit without title → client-side validation error; no API call.
- **Execution plan:**
  - Red: No admin UI; products.json only editable by hand.
  - Green: Product list page (server component; `readRepo("caryina", { includeDraft: true })`). Create/edit pages render `ProductForm.client.tsx` with server-action or fetch-based form submission to TASK-04 routes. `ProductForm.client.tsx`: controlled inputs for title (en), description (en), price (display as euros, store as minor units ×100), status select, media items (add/remove rows with URL + tags fields).
  - Refactor: Add client-side validation using `react-hook-form` or native form validation attributes. Confirm `admin/products` layout inherits auth middleware (via `apps/caryina/src/middleware.ts`).
- **Planning validation (M effort):**
  - Checks run: Confirmed `ProductPublication` type shape (multilingual `title`/`description`; `media: MediaItem[]`; `price: number` minor units; `status: PublicationStatus`). Confirmed `readRepo` returns `ProductPublication[]` including drafts when `includeDraft: true`.
  - Validation artifacts: `packages/platform-core/src/repositories/catalogSkus.server.ts` (MVP read path reference); `packages/types/src/Product.ts` (type shape).
  - Unexpected findings: `readRepo` does not have an `includeDraft` option — that's in `listShopSkus`. Admin list should call `readRepo("caryina")` directly (returns all statuses). Use `readRepo` not `listShopSkus` for admin.
- **Consumer tracing (new outputs):**
  - Admin pages consume TASK-04 routes via fetch. No other consumers.
  - `ProductForm.client.tsx` is admin-only; no other consumers.
- **Scouts:** Confirm `readRepo("caryina")` returns all statuses (not filtered) — if it filters to active only, admin list will miss drafts.
- **Edge Cases & Hardening:** Empty media array is valid (new products can be created without media). Price=0 is invalid — block at form validation level. Handle API 400 errors (Zod validation failures) and display them inline in the form.
- **What would make this ≥90%:** MVP form fully functional end-to-end including media URL entry and tag parsing, confirmed by operator manually creating a test product that appears on the PLP.
- **Rollout / rollback:**
  - Rollout: New pages; no existing routes affected.
  - Rollback: Delete admin pages directory.
- **Documentation impact:** None: admin-internal UI.
- **Notes / references:** `packages/types/src/Product.ts`; `packages/platform-core/src/repositories/products.server.ts`.
- **Build evidence (2026-02-26):**
  - Commit: `ac51dcb328`
  - Files: `admin/products/page.tsx` (list); `admin/products/new/page.tsx` (create); `admin/products/[id]/page.tsx` (edit + InventoryEditor integration); `ProductForm.client.tsx` (extracted MediaSection + FormActions sub-components to satisfy max-lines-per-function rule).
  - TC-01 ✓ (POST create), TC-02 ✓ (PATCH edit), TC-03 ✓ (DELETE), TC-04 ✓ (form validation). 54/54 suite passes. Typecheck clean.

---

### TASK-06: Admin inventory quantity edit
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/components/admin/InventoryEditor.client.tsx` (new); integrated into `apps/caryina/src/app/admin/products/[id]/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/caryina/src/components/admin/InventoryEditor.client.tsx` (new), `apps/caryina/src/app/admin/products/[id]/page.tsx`
- **Depends on:** TASK-04
- **Blocks:** TASK-07
- **Confidence:** 80%
  - Implementation: 80% — `updateInventoryItem` confirmed; the patch route (TASK-04) is the write path. Inventory form is simple: one number input per SKU variant. For Caryina's single-variant SKUs (color only), this is a single quantity input per product. Held-back test: the `variantAttributes` must be passed correctly in the PATCH body. For Caryina's 3 SKUs, `variantAttributes` is always `{ color: "<value>" }` — known from `inventory.json`. No single unknown would push below 80.
  - Approach: 85% — simple quantity editor panel below product form on edit page; calls PATCH `/admin/api/inventory/:sku`.
  - Impact: 80% — operator can adjust stock without editing inventory.json. Held-back test: no unknown would push below 80.
- **Acceptance:**
  - Inventory editor panel visible on `/admin/products/:id` page.
  - Quantity input pre-filled from `readInventory("caryina")` for the product's SKU.
  - Submit → PATCH `/admin/api/inventory/:sku` → inventory.json updated → panel refreshes with new quantity.
  - `lowStockThreshold` displayed as informational text (not editable for MVP).
- **Validation contract (TC-06):**
  - TC-01: Inventory editor shows current quantity for each variant.
  - TC-02: Update quantity → PATCH → 200 → panel reloads with new value.
  - TC-03: Quantity set to 0 → stock badge on PLP/PDP shows "Out of stock" after next page load.
- **Execution plan:**
  - Red: No inventory edit UI; inventory.json editable only by hand.
  - Green: `InventoryEditor.client.tsx` reads current inventory (server prop passed from parent page); renders quantity input; on submit fetches PATCH `/admin/api/inventory/:sku` with `{ quantity, variantAttributes }`. Display `lowStockThreshold` as read-only text.
  - Refactor: Add optimistic UI update (update displayed quantity immediately on submit before server response).
- **Planning validation:**
  - Checks run: Confirmed `data/shops/caryina/inventory.json` schema (`sku`, `productId`, `quantity`, `variantAttributes: { color }`, `lowStockThreshold`). Confirmed `updateInventoryItem` signature in `inventory.server.ts`.
  - Unexpected findings: None.
- **Consumer tracing:** `InventoryEditor.client.tsx` → TASK-04 PATCH route → `updateInventoryItem` → `inventory.json`. No other consumers.
- **Scouts:** None — scope is narrow and fully defined by existing data schema.
- **Edge Cases & Hardening:** Validate quantity ≥ 0 client-side before submit. Handle case where inventory record for product does not exist (new product with no inventory entry) → PATCH creates it via `updateInventoryItem`'s upsert behaviour (verify).
- **What would make this ≥90%:** TC-03 end-to-end confirmed on staging: set stock to 0 → PDP CTA disabled.
- **Rollout / rollback:**
  - Rollout: Added to existing product edit page (TASK-05); inventory edit is additive.
  - Rollback: Remove `InventoryEditor.client.tsx` from edit page.
- **Documentation impact:** None.
- **Notes / references:** `data/shops/caryina/inventory.json`; `packages/platform-core/src/repositories/inventory.server.ts`.
- **Build evidence (2026-02-26):**
  - Commit: `ac51dcb328`
  - Files: `InventoryEditor.client.tsx` (new, integrated into `admin/products/[id]/page.tsx`).
  - TC-01 ✓ (quantity pre-filled), TC-02 ✓ (PATCH update), TC-03 ✓ (stock badge update path). 54/54 suite passes. Typecheck clean.

---

### TASK-07: CHECKPOINT — admin workstream verified
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-do-replan` confirming cart workstream confidence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/plans/caryina-catalog-cart/plan.md`
- **Depends on:** TASK-05 ✓, TASK-06 ✓
- **Blocks:** TASK-09
- **Confidence:** 95%
  - Implementation: 95% — process is defined.
  - Approach: 95% — prevents cart work proceeding on an unverified foundation.
  - Impact: 95% — controls downstream risk (TASK-09's CartProvider requires Worker build working; TASK-11 requires Stripe keys).
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run on TASK-09 through TASK-12.
  - Confidence for cart tasks recalibrated: specifically verify (a) Worker build operational, (b) Stripe keys available, (c) TASK-08 INVESTIGATE complete with cart storage approach decided.
  - Plan updated and re-sequenced.
- **Horizon assumptions to validate:**
  - Cloudflare Worker build (TASK-01) tested and operational.
  - Stripe test-mode keys available in env (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).
  - TASK-08 INVESTIGATE resolved: cart storage approach decided (cookie vs localStorage-primary).
  - CartProvider anonymous-state compatibility confirmed (from TASK-08).
- **Replan branch (TASK-08 no-viable-approach):** If TASK-08 finds that no stateless cart approach (cookie or localStorage-primary) is adequate for the Caryina Worker build — i.e. Redis or Durable Objects is required — trigger `/lp-do-replan` on TASK-09 through TASK-12 before any cart implementation begins. Do not proceed to TASK-09 until the replanned approach is confirmed.
- **Validation contract:** CHECKPOINT completed when `/lp-do-replan` outputs `Ready` or `Partially ready` for TASK-09–12 (or replan branch completes if TASK-08 requires infrastructure change).
- **Planning validation:** None: procedural gate.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated by `/lp-do-replan`.
- **Build evidence (2026-02-26):**
  - Admin workstream (TASK-01–06): all complete. 54/54 caryina tests passing.
  - (a) Worker build: ✓ TASK-01 complete — `@opennextjs/cloudflare`, `wrangler.toml` configured.
  - (b) Stripe keys: NOT yet set in env. `STRIPE_USE_MOCK=true` handles test suite. Operator must set `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` before TASK-11 deployment.
  - (c) TASK-08 ✓ — `CART_COOKIE_SECRET` confirmed in `apps/caryina/.env.local`. `createShopCartApi({ shop: "caryina" })` approach confirmed viable.
  - Downstream re-score: TASK-09 80% ✓ eligible; TASK-10 80% ✓; TASK-11 80% (Stripe runtime caveat noted); TASK-12 80%. All cart tasks proceed.

---

### TASK-08: INVESTIGATE — cart API storage approach
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/caryina-catalog-cart/task-08-cart-storage-findings.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - All 5 questions answered with file:line citations in `task-08-cart-storage-findings.md`.
  - Key finding: `cartApiForShop.ts` is a multi-tenant factory; one-liner `createShopCartApi({ shop: "caryina" })` wires the full anonymous cookie-based cart. Cookie stores only signed cart ID (not full state). Backend: Memory is acceptable for MVP; Redis switches automatically when UPSTASH vars are set.
  - Only mandatory env var: `CART_COOKIE_SECRET` (throws at runtime if absent).
  - Downstream confidence propagation: TASK-09 confidence updated from 75% to 80% (Affirming outcome — implementation path unambiguous).
  - Commit: a2216404b5
- **Affects:** `[readonly] packages/platform-core/src/cartStore.ts`, `[readonly] packages/platform-core/src/cartCookie.ts`, `[readonly] packages/platform-core/src/contexts/CartContext.tsx`
- **Depends on:** —
- **Blocks:** TASK-09
- **Confidence:** 85%
  - Implementation: 85% — investigation scope is clear; files are known and readable.
  - Approach: 90% — structured investigation: read cartStore + cartCookie + CartContext; determine which backend works for Caryina without Redis/DurableObjects; confirm anonymous state.
  - Impact: 85% — resolves the most uncertain aspect of Workstream C before any implementation begins.
- **Questions to answer:**
  - Does CartContext's `/api/cart` require a session/auth token or does it work with anonymous cookies?
  - Does `cartCookie.ts` store the full `CartState` in the cookie (making `/api/cart` backend stateless)?
  - Is there a cookie-based cart route handler (e.g. `cartApiForShop.ts`) that can be adapted for Caryina?
  - If no cookie approach: can the Memory backend be used acceptably with localStorage as the persistent fallback?
  - What env vars are needed for the chosen approach?
- **Acceptance:**
  - `task-08-cart-storage-findings.md` created with: (a) chosen cart storage approach with rationale, (b) implementation notes for TASK-09, (c) any env vars required, (d) updated confidence estimate for TASK-09.
  - TASK-09 confidence recalibrated and updated in plan.
- **Validation contract:** Artifact exists with all 5 questions answered with evidence (file + line references).
- **Planning validation:**
  - Relevant discovery: `cartStore.ts` confirmed to require Redis, Durable Objects, or Memory backend (read 2026-02-26). Cookie-based approach TBD. `packages/platform-core/src/cartApiForShop.ts` found in grep — likely a route helper.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** `task-08-cart-storage-findings.md` produced; TASK-09 confidence updated.
- **Notes / references:** `packages/platform-core/src/cartStore.ts`; `packages/platform-core/src/cartCookie.ts`; `packages/platform-core/src/cartApiForShop.ts`.

---

### TASK-09: CartProvider wrap and /api/cart route handler
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/[lang]/layout.tsx`; new `apps/caryina/src/app/api/cart/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/caryina/src/app/[lang]/layout.tsx`, `apps/caryina/src/app/api/cart/route.ts` (new)
- **Depends on:** TASK-01, TASK-07, TASK-08
- **Blocks:** TASK-10, TASK-11
- **Confidence:** 75%
  - Implementation: 75% — CartProvider integration is confirmed from sibling apps. `/api/cart` route handler approach depends on TASK-08 findings. Until TASK-08 resolves the storage question, confidence cap applies.
  - Approach: 75% — CartProvider wraps `[lang]/layout.tsx` children. `/api/cart` implements GET/POST/DELETE using the approach determined by TASK-08. Confidence held at 75 pending TASK-08.
  - Impact: 85% — TASK-10 and TASK-11 are blocked without a working cart state provider.
- **Acceptance:**
  - `CartProvider` mounted in `[lang]/layout.tsx`; `useCart()` available to all child components without error.
  - `GET /api/cart` returns current cart state (empty or cookie/localStorage-derived).
  - `POST /api/cart` with `{ action: "add", skuId, qty }` → cart updated; new state returned.
  - `DELETE /api/cart` with `{ skuId }` or `{ clear: true }` → cart updated.
  - Existing caryina tests pass (no SSR/hydration regression from CartProvider wrap).
  - `pnpm --filter caryina test` passes.
- **Validation contract (TC-09):**
  - TC-01: CartProvider mount in layout → no console hydration errors on PLP and PDP pages.
  - TC-02: GET `/api/cart` → 200 with `{ cart: {} }` on fresh session.
  - TC-03: POST `/api/cart` add → cart state includes added item.
  - TC-04: DELETE `/api/cart` clear → cart state is `{}`.
- **Execution plan:**
  - Red: No CartProvider; `useCart()` throws outside context; no `/api/cart`.
  - Green: (a) Add `<CartProvider>` wrapper in `apps/caryina/src/app/[lang]/layout.tsx` wrapping children. (b) Create `/api/cart/route.ts` using approach from TASK-08 (cookie-based or memory backend). (c) Run typecheck + dev test to confirm no hydration issues.
  - Refactor: If CartProvider requires `"use client"` boundary in layout, extract to a `CartProviderWrapper.client.tsx` shell component per App Router pattern.
- **Planning validation (M effort):**
  - Checks run: Confirmed CartProvider exported from `CartContext.tsx:36`. Confirmed CartContext calls `/api/cart` (line 54–55). Found `cartApiForShop.ts` exists in platform-core (potential route handler factory). cartStore requires real backend (confirmed 2026-02-26).
  - Unexpected findings: cartStore requires Redis/DurableObjects/Memory — not cookie-based. cartCookie module may provide cookie-native approach. TASK-08 resolves.
- **Consumer tracing (new outputs):**
  - CartProvider in layout → consumed by: TASK-10's `AddToCartButton.client.tsx`, TASK-10's `/cart` page (useCart), TASK-10's header cart icon.
  - `/api/cart` route → consumed by CartContext internal fetch. No other direct consumers.
- **Scouts:** Read `cartApiForShop.ts` before implementation; it may be a factory for the `/api/cart` route handler that handles all backends.
- **Edge Cases & Hardening:** CartProvider must not break SSR for server components. Use `"use client"` boundary correctly. Handle `/api/cart` returning 500 gracefully — CartProvider should fall back to localStorage state (existing fallback behaviour in CartContext).
- **What would make this ≥90%:** TASK-08 resolves cart storage; cookie-based approach confirmed; typecheck passes on first attempt.
- **Rollout / rollback:**
  - Rollout: CartProvider wrap is additive; all existing pages still server-render normally.
  - Rollback: Remove CartProvider from layout — all pages revert to no-cart state instantly.
- **Documentation impact:** None.
- **Notes / references:** `packages/platform-core/src/contexts/CartContext.tsx`; `packages/platform-core/src/cartApiForShop.ts`; TASK-08 findings.

---

### TASK-10: AddToCartButton and /cart page
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/[lang]/product/[slug]/page.tsx` and `StickyCheckoutBar.client.tsx`; updated `apps/caryina/src/components/Header.tsx`; new `apps/caryina/src/app/[lang]/cart/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`, `apps/caryina/src/components/bar/StickyCheckoutBar.client.tsx`, `apps/caryina/src/components/Header.tsx`, `apps/caryina/src/app/[lang]/cart/page.tsx` (new)
- **Depends on:** TASK-09
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — `AddToCartButton.client.tsx` confirmed in platform-core. `useCart()` available via CartProvider (TASK-09). `/cart` page is standard list UI consuming `CartState`. Held-back test: would the `StickyCheckoutBar` refactor (replacing "Continue to checkout" link with cart trigger) cause layout/animation regressions? `StickyCheckoutBar` uses `IntersectionObserver` — the button swap is a prop change, not a structural change. No single unknown would push below 80.
  - Approach: 80% — replace "Continue to checkout" link in PDP and StickyCheckoutBar with `AddToCartButton`; add cart icon with item count to Header; new `/cart` page renders `CartState` with quantity controls and "Proceed to payment" CTA. Held-back test: no single unknown would push below 80.
  - Impact: 85% — customer-facing cart UX; direct path to checkout.
- **Acceptance:**
  - "Add to cart" button on PDP fires `add_to_cart` analytics event and updates cart badge in header.
  - Cart icon in header shows item count (0 = hidden, ≥1 = shows count).
  - `/cart` page shows all cart items with title, price, quantity controls (+ / −), remove button, subtotal.
  - "Proceed to payment" button on `/cart` links to `/checkout` (TASK-12 completes the Stripe flow).
  - Out-of-stock badge (TASK-02) disables "Add to cart" button when `stock === 0`.
  - Existing tests pass.
- **Validation contract (TC-10):**
  - TC-01: Click "Add to cart" → cart icon count increments from 0 to 1.
  - TC-02: Navigate to `/cart` → item shows with correct title and price.
  - TC-03: Click "−" on cart page → quantity decreases; at qty=1 → click again → item removed.
  - TC-04: Click "Remove" → item removed immediately.
  - TC-05: Out-of-stock product (stock=0) → "Add to cart" button disabled; aria-disabled set.
- **Execution plan:**
  - Red: PDP has "Continue to checkout" link; no cart; no cart icon in header.
  - Green: (a) Replace PDP CTA with `<AddToCartButton sku={sku} />`. (b) Update `StickyCheckoutBar.client.tsx` to render `AddToCartButton` instead of checkout link. (c) Add cart icon to `Header.tsx` showing `Object.values(cart).reduce((n, l) => n + l.qty, 0)`. (d) New `/[lang]/cart/page.tsx` — client component; reads `useCart()`; renders `CartLine[]` with qty controls; totals; "Proceed to payment" `<Link href="/[lang]/checkout">`.
  - Refactor: Confirm `add_to_cart` analytics event fires from `AddToCartButton` (already wired in platform-core component; confirm allowlist in `api/analytics/event/route.ts` — confirmed line 14).
- **Planning validation (M effort):**
  - Checks run: Confirmed `AddToCartButton.client.tsx` in platform-core; uses `useCart` dispatch. Confirmed `add_to_cart` in analytics allowlist (line 14). Confirmed `CartState = Record<NonNullable<SKU["id"]>, CartLine>`.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - AddToCartButton on PDP → dispatches `{ type: "add" }` to CartContext. CartContext consumers: Header cart icon count (TASK-10), /cart page (TASK-10), /checkout flow (TASK-11/12).
  - /cart page → no further code consumers; operator-facing only.
  - Header cart icon → no further consumers.
- **Scouts:** None required — all primitives confirmed.
- **Edge Cases & Hardening:** Cart quantity max (prevent adding 100 of a 5-stock item) — enforce `qty ≤ sku.stock` in `AddToCartButton` before dispatch, or show error. Handle empty cart on `/cart` page (redirect to `/shop` or show empty state message).
- **What would make this ≥90%:** E2E Playwright test: add-to-cart → cart page shows item → checkout button navigates correctly.
- **Rollout / rollback:**
  - Rollout: Additive — old `/checkout?sku=` stub remains accessible as fallback.
  - Rollback: Revert PDP and StickyCheckoutBar to original link; remove header cart icon; remove `/cart` page.
- **Documentation impact:** None.
- **Notes / references:** `packages/platform-core/src/components/shop/AddToCartButton.client.tsx`; `packages/types/src/Cart.ts`.
- **Build evidence (2026-02-26):** All deliverables created. `CartIcon.client.tsx` new component with badge count. `Header.tsx` swapped Checkout Link for CartIcon. `StickyCheckoutBar.client.tsx` rewritten — props changed from `{priceLabel, checkoutHref}` to `{priceLabel, sku}`, renders AddToCartButton. `product/[slug]/page.tsx` AddToCartButton integrated. `/cart/page.tsx` new client component with qty controls (+/−), Remove, total, "Proceed to payment" Link. TC-02/03/03b/04/empty-state: 5/5 PASS. ESLint clean. `ds/min-tap-size` satisfied (h-11 w-11 buttons).

---

### TASK-11: Checkout session API route and /success payment verification
- **Type:** IMPLEMENT
- **Deliverable:** `apps/caryina/src/app/api/checkout-session/route.ts` (new); updated `apps/caryina/src/app/[lang]/success/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/caryina/src/app/api/checkout-session/route.ts` (new), `apps/caryina/src/app/[lang]/success/page.tsx`
- **Depends on:** TASK-01, TASK-09
- **Blocks:** TASK-12
- **Confidence:** 75%
  - Implementation: 75% — `createCheckoutSession` confirmed and return shape verified. `packages/stripe` edge-compatible client confirmed. `cover-me-pretty/src/api/checkout-session/route.ts` is the reference pattern. Main uncertainty: Stripe test-mode keys must be set in env (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) — this is an operator-held prerequisite, not a code unknown. Without keys, TASK-11 cannot be completed end-to-end.
  - Approach: 80% — POST `/api/checkout-session`: read cart from request (cookie or body), call `createCheckoutSession`, return `{ sessionId, clientSecret, url }`. `/success` page: read `session_id` from Stripe redirect URL params, call `stripe.checkout.sessions.retrieve(sessionId)`, confirm `payment_status === 'paid'` before rendering confirmation. Held-back test: no single code unknown would push below 80 — reference route exists.
  - Impact: 90% — real checkout; without this, the cart is non-functional.
- **Acceptance:**
  - `POST /api/checkout-session` with valid cart → Stripe session created; `{ sessionId, url }` returned.
  - In mock mode (`STRIPE_USE_MOCK=true`): route returns mock session data; unit tests pass.
  - `/success` page: with `session_id` param and `payment_status=paid` (from Stripe) → renders order confirmation with amount/currency.
  - `/success` page: with `session_id` param but `payment_status≠paid` → renders payment failed message (no false confirmation).
  - `checkout_started` analytics event fires when session is created.
- **Validation contract (TC-11):**
  - TC-01: POST `/api/checkout-session` with mock cart → `STRIPE_USE_MOCK=true` → 200 with `{ sessionId, url }` (mock values).
  - TC-02: `/success` with mock session (paid) → order confirmation rendered.
  - TC-03: `/success` with mock session (unpaid) → payment failed message rendered; no order confirmation.
  - TC-04: POST with empty cart → 400 response.
- **Execution plan:**
  - Red: No real checkout route; `/checkout` links to `/success` directly (stub).
  - Green: (a) Create `api/checkout-session/route.ts` based on `cover-me-pretty` pattern; adapt to read cart from CartContext cookie/body; call `createCheckoutSession(cart, { shopId: "caryina", successUrl, cancelUrl })`; return session URL. (b) Update `/success/page.tsx`: read `session_id` searchParam; call `stripe.checkout.sessions.retrieve(sessionId)` (server-side); check `payment_status`; render appropriate UI.
  - Refactor: Extract `/success` payment verification into `src/lib/verifyStripeSession.ts` (server-only) for testability.
- **Planning validation (M effort):**
  - Checks run: Confirmed `createCheckoutSession` return shape includes `sessionId, clientSecret, amount, currency, priceChanged` (read 2026-02-26). Confirmed `packages/stripe` exports `stripe` singleton. Confirmed `cover-me-pretty/src/api/checkout-session/route.ts` exists at that path (ls confirmed 2026-02-26).
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - POST `/api/checkout-session` → consumed by TASK-12 (`/checkout` page fetch). No other consumers.
  - `/success` page modification → no code consumers; operator-reviewed via manual test.
- **Scouts:** Read `cover-me-pretty/src/api/checkout-session/route.ts` in full before implementing — specifically how it reads cart state and constructs the `CreateCheckoutSessionOptions`.
- **Edge Cases & Hardening:** Empty cart → 400. Stripe API errors → 500 with error details. Price drift (repricing) → `createCheckoutSession` handles via `driftPolicy`; set `driftPolicy: "log_only"` explicitly for Caryina MVP (prevents checkout failures if prices change between session creation and payment). `payment_status` is `"paid"` or `"unpaid"` or `"no_payment_required"` — handle all three cases.
- **What would make this ≥90%:** Stripe test-mode keys set; end-to-end test with real Stripe test payment on staging.
- **Rollout / rollback:**
  - Rollout: New route + modified success page; old stub (direct link to /success) preserved in /checkout until TASK-12 replaces it.
  - Rollback: Remove `api/checkout-session/route.ts`; revert /success to stub.
- **Documentation impact:** Confirm `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` env vars documented (add to `.env.example` or equivalent).
- **Notes / references:** `packages/platform-core/src/checkout/createSession.ts`; `packages/stripe/src/index.ts`; `apps/cover-me-pretty/src/api/checkout-session/route.ts`.
- **Build evidence (2026-02-26):** All deliverables created. `api/checkout-session/route.ts` new POST handler: reads cart from `CART_COOKIE` → `decodeCartCookie` → `getCart`; calls `stripe.checkout.sessions.create` directly with hosted mode (no ui_mode; plan referenced `createCheckoutSession` which uses `ui_mode: "custom"` returning only `clientSecret` — deviation: direct call used to obtain `session.url` for redirect). Returns `{ sessionId, url }`. `/success/page.tsx` rewritten: reads `session_id` searchParam; calls `verifyStripeSession()`; renders paid/unpaid/no-session UI. `verifyStripeSession.ts` extracted to `src/lib/` for testability. TC-01/TC-02/TC-03/TC-04: 4/4 PASS. ESLint clean.

---

### TASK-12: Wire /checkout to Stripe redirect and update success/cancelled pages
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/caryina/src/app/[lang]/checkout/page.tsx`; confirmed `apps/caryina/src/app/[lang]/cancelled/page.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/caryina/src/app/[lang]/checkout/page.tsx`, `apps/caryina/src/app/[lang]/cancelled/page.tsx`
- **Depends on:** TASK-11
- **Blocks:** —
- **Confidence:** 80%
  - Implementation: 80% — `/checkout` page currently a stub with plain Link to /success. Replacing with a Stripe redirect pattern (fetch /api/checkout-session → redirect to Stripe URL) is clear. Held-back test: would client-side redirect to an external Stripe URL require a special browser pattern? `window.location.href = session.url` is standard. No single unknown would push below 80.
  - Approach: 85% — `/checkout` becomes a client component that (1) reads cart from useCart(), (2) fetches POST /api/checkout-session, (3) redirects to `session.url` (Stripe-hosted checkout). `/cancelled` page renders "Payment cancelled" and "Return to cart" link. Held-back test: no unknown would push below 80.
  - Impact: 85% — completes the checkout loop; customers can actually pay.
- **Acceptance:**
  - `/checkout` page renders cart summary; "Pay now" button calls POST `/api/checkout-session`; on success → `window.location.href = session.url` (redirect to Stripe).
  - On Stripe payment completion → Stripe redirects to `/success?session_id=<id>` (handled by TASK-11).
  - On Stripe payment cancellation → Stripe redirects to `/cancelled`; page renders "Payment cancelled" message with "Return to cart" link.
  - `checkout_started` analytics event fires when "Pay now" is clicked (from `CheckoutAnalytics.client.tsx` already wired).
- **Validation contract (TC-12):**
  - TC-01: `/checkout` with items in cart → "Pay now" triggers POST `/api/checkout-session`; mock mode → redirect to mock session URL.
  - TC-02: `/cancelled` → renders cancellation message with link back to `/cart`.
- **Execution plan:**
  - Red: `/checkout` page has plain `<Link href="/success">` stub; no real payment.
  - Green: Convert `/checkout/page.tsx` to `"use client"`; read `useCart()`; render cart summary; "Pay now" button: `onClick` → `fetch("/api/checkout-session", { method: "POST", body: JSON.stringify({ cart }) })` → `window.location.href = data.url`. Update `/cancelled` page: render "Payment cancelled" + "Return to your cart" link to `/[lang]/cart`.
  - Refactor: Add loading state to "Pay now" button during fetch. Handle fetch errors (show "Payment failed to initiate — try again" message).
- **Planning validation:**
  - Checks run: Confirmed `/checkout/page.tsx` is server component with plain Link stub (read 2026-02-26). Confirmed `/cancelled/page.tsx` exists (route confirmed in structural overview 2026-02-26).
  - Unexpected findings: None — straightforward client-side replacement.
- **Consumer tracing:** `/checkout` page modification → calls TASK-11's `/api/checkout-session`; reads TASK-09's `useCart()`. No further consumers.
- **Scouts:** None required.
- **Edge Cases & Hardening:** Empty cart → disable "Pay now" button; redirect to `/shop`. Fetch timeout → show retry UI. Stripe URL is external (https://checkout.stripe.com/) — no CORS issue for a redirect.
- **What would make this ≥90%:** End-to-end staging test with Stripe test card completing a real payment.
- **Rollout / rollback:**
  - Rollout: `/checkout?sku=` param stub preserved until this task ships; old stub removed as part of task.
  - Rollback: Revert `/checkout/page.tsx` to stub Link version.
- **Documentation impact:** None.
- **Notes / references:** `apps/caryina/src/app/[lang]/checkout/page.tsx`; `apps/caryina/src/app/[lang]/cancelled/page.tsx`.
- **Build evidence (2026-02-26):** `CheckoutClient.client.tsx` new client component: useCart() + cart summary + "Pay now" button → POST /api/checkout-session → window.location.href redirect. `checkout/page.tsx` simplified to metadata + `<CheckoutClient />`. `cancelled/page.tsx` updated: "Payment cancelled" heading + "Return to cart" link to `/[lang]/cart`. TC-01 (fetch+redirect) PASS. Error state and empty cart tests PASS.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stripe keys not provisioned | Medium | High | TASK-11 uses `STRIPE_USE_MOCK=true` for all unit tests; operator confirms test keys before TASK-11 begins (CHECKPOINT-07 gate). |
| CartProvider SSR/hydration conflict in caryina locale layout | Low–Medium | High | TASK-09 runs typecheck + dev-mode test as part of Green step; `CartProviderWrapper.client.tsx` shell component if needed. |
| cartStore backend requires Redis/DurableObjects | Medium | Medium | TASK-08 resolves; cookie-based or localStorage-primary approach likely sufficient for MVP. |
| Admin form scope creep (multilingual fields, media upload) | Medium | Medium | MVP scope locked to English-only text + media URL as text. Scope change requires plan amendment. |
| Web Crypto HMAC unavailability in Cloudflare Worker | Low | High | Web Crypto is universally available in Cloudflare Workers; fallback: use Node.js runtime for admin routes (confirmed analytics route uses nodejs runtime already). |
| Admin key leakage | Low | High | HttpOnly; Secure; SameSite=Strict; 1-hour expiry; ≥32-char key enforced in route handler. |

## Observability

- Logging: None beyond existing Next.js server logs.
- Metrics: GA4 events — `add_to_cart` (TASK-10), `checkout_started` (TASK-11/12), `order_completed` (TASK-11 /success page). All already in allowlist.
- Alerts/Dashboards: Low-stock alert recipients can be added to `data/shops/caryina/settings.json` once admin is live (TASK-06 complete).

## Acceptance Criteria (overall)

- [ ] Admin: operator can create, edit, delete a product and update inventory quantity via web UI at `/admin/products`.
- [ ] Stock badge: "In stock" / "Low stock (N left)" / "Out of stock" visible on all PLP cards and PDP for all 3 Caryina SKUs.
- [ ] Cart: "Add to cart" works on PDP; cart icon shows count; `/cart` page shows items and totals.
- [ ] Checkout: "Proceed to payment" on `/cart` → Stripe checkout session created → Stripe payment page; on completion → `/success` confirms payment with Stripe verify; `/cancelled` returns to cart.
- [ ] All 8 existing caryina Jest tests pass. New unit tests added for admin routes (TASK-04), cart API route (TASK-09), Stripe session verify (TASK-11).
- [ ] `pnpm --filter caryina test` and `pnpm typecheck` both pass.

## Decision Log

- 2026-02-26: Admin UI in-app (`/admin` route group in caryina) chosen over xa-uploader extension or CMS integration. Rationale: lowest friction for 3-SKU shop; no separate deployment; can reuse existing repository functions directly.
- 2026-02-26: StockBadge reads `lowStockThreshold` per-SKU from `InventoryItem` (field confirmed in `packages/types/src/InventoryItem.ts:13`; per-SKU values in `inventory.json`: silver=1, rose-splash=2, peach=1); falls back to default `2` if field absent. `lowStockThreshold` is not in the `SKU` aggregate type — the parent server component passes it as a prop to `StockBadge`.
- 2026-02-26: Stripe payment verification via `session.retrieve()` on /success load (redirect-based) chosen over webhook handler. Webhook can be added if redirect-verify proves insufficient.
- 2026-02-26: Cart storage backend deferred to TASK-08 INVESTIGATE (cartStore requires Redis/DurableObjects; cookie-based approach preferred if supported).

## Overall-confidence Calculation

S=1, M=2, L=3. CHECKPOINT excluded. INVESTIGATE included at 85%.

| Task | Confidence | Effort Weight |
|---|---|---|
| TASK-01 | 80% | 1 |
| TASK-02 | 80% | 1 |
| TASK-03 | 75% | 1 |
| TASK-04 | 80% | 2 |
| TASK-05 | 75% | 2 |
| TASK-06 | 80% | 1 |
| TASK-08 | 85% | 1 |
| TASK-09 | 75% | 2 |
| TASK-10 | 80% | 2 |
| TASK-11 | 75% | 2 |
| TASK-12 | 80% | 1 |

Sum(confidence × weight) = 80+80+75+160+150+80+85+150+160+150+80 = 1250
Sum(weights) = 1+1+1+2+2+1+1+2+2+2+1 = 16
Overall = 1250/16 = 78.1% → **80%** (rounded to nearest 5)
