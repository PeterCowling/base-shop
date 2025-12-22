Type: Contract
Status: Canonical
Domain: Runtime
Last-reviewed: 2025-12-02

Canonical code:
- packages/template-app/**
- packages/platform-core/**

# Template runtime contract

Canonical runtime contract for `@acme/template-app`. This document backs **Thread B** (Template runtime & tenant convergence) and is the reference for what it means for a shop runtime to be **platform‑compatible**.

- The concrete implementation lives in `packages/template-app`.
- The machine‑readable snapshot lives in `packages/template-app/src/runtimeContractManifest.ts`.
- Thread D (smoke tests) and CMS tooling should consume the manifest rather than scraping this document.

---

## 1. Environment configuration

All environment configuration is validated via `@acme/config/env/*`. This section summarises the categories that must be present for a platform‑compatible runtime; see the corresponding `@acme/config` modules for full schemas.

### 1.1 Shop selection & base URLs

- **Shop ID**
  - `NEXT_PUBLIC_SHOP_ID` (preferred) selects the current shop.
  - If absent, implementations fall back to sensible defaults (for example `"default"` or `"shop"`), but platform‑compatible apps should configure an explicit ID.
- **Base URL**
  - `NEXT_PUBLIC_BASE_URL` must point at the public origin used for sitemap links, canonical URLs, and redirects.

### 1.2 CMS / PB integration

- `CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`, `SANITY_API_VERSION` (and related CMS env) must be set so that:
  - Draft/published content for the configured shop can be fetched.
  - Page Builder preview can resolve PB documents for the preview routes in this contract.

### 1.3 Auth, sessions, and security

- `NEXTAUTH_SECRET`, `SESSION_SECRET` – strong (≥32 chars) secrets for session/auth integrity.
- `AUTH_TOKEN_TTL` – duration string (`15m`, `900s`, etc.) used by auth token validation.
- `CART_COOKIE_SECRET` – secret used by the shared cart cookie utilities.
- Session/cart storage providers:
  - `CART_STORE_PROVIDER`: `cloudflare` (Durable Object), `redis`, or `memory` (dev/test).
  - `SESSION_STORE_PROVIDER`: `cloudflare` (Durable Object), `redis`, or `memory`.
  - Cloudflare bindings required when using `cloudflare`:
    - `CART_DO` → `CartDurableObject`
    - `SESSION_DO` → `SessionDurableObject`
  - Redis remains supported via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` when the provider is `redis`.
- Login rate limiting:
  - `RATE_LIMIT_STORE_PROVIDER`: `kv` (Cloudflare KV) or `redis`.
  - Cloudflare KV binding when using `kv`: `LOGIN_RATE_LIMIT_KV`.
- Email/Billing providers:
  - `EMAIL_PROVIDER` and provider‑specific keys.
  - Stripe keys and webhooks are configured via `@acme/config/env/stripe` (see that module for the exact names).

In development, `packages/template-app/dev-defaults.mjs` provides safe defaults for required secrets so the app can boot; production and staging must supply real values.

---

## 2. HTTP routes and contracts

This section lists the HTTP routes that define the runtime contract for commerce and preview flows. The canonical TypeScript handlers live in `packages/template-app/src/api` and `packages/template-app/src/app/api`.

Where request/response schemas are defined in shared packages, the contract is:

- **Do not fork or wrap those schemas.**
- Platform‑compatible apps must re‑export the shared handlers or call them directly without changing their Zod contracts.

### 2.1 Cart API – `/api/cart`

- **Path**: `/api/cart`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Handler**: `packages/template-app/src/api/cart/route.ts`
- **Implementation**:
  - Re‑exports `DELETE`, `GET`, `PATCH`, `POST`, `PUT` from `@platform-core/cartApi`.
  - The canonical request/response schemas and supported methods are owned by `@platform-core/cartApi`.
- **Contract**:
  - A platform‑compatible app must expose `/api/cart` with the exact HTTP interface defined by `@platform-core/cartApi`.
  - Any behavioural changes must be made in `@platform-core/cartApi`, not per‑app.

### 2.2 Checkout session – `/api/checkout-session`

- **Path**: `/api/checkout-session`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Handler**: `packages/template-app/src/api/checkout-session/route.ts`
- **Implementation**:
  - Reads the cart via `@platform-core/cartCookie` and `@platform-core/cartStore`.
  - Computes prices using `@platform-core/pricing` and `convertCurrency`.
  - Creates a Stripe Checkout Session in `ui_mode: custom` using `@platform-core/checkout/session`.
  - Resolves the shop via `coreEnv.NEXT_PUBLIC_DEFAULT_SHOP` and `readShop`.
- **Contract**:
  - Accepts `POST` with a JSON body that can include:
    - `returnDate`, `coupon`, `currency`, `taxRegion`, `customer`, `shipping`, `billing_details`, `coverage` (see handler for exact fields).
  - Returns `200` with a JSON payload from `createCheckoutSession` on success.
    - `clientSecret` is the Checkout Session `client_secret` (for `ui_mode: custom`) and must be used with Stripe Custom Checkout (`initCheckout` / `CheckoutProvider`), not `stripe.confirmPayment`.
    - `orderId` may be included when a runtime reserves a platform order ID during checkout creation.
  - Returns JSON `{ error: string }` with:
    - `400` for validation issues (for example empty cart, invalid `returnDate`).
    - `502` for downstream Stripe/infra failures.
  - Platform‑compatible apps must either:
    - use this implementation directly, or
    - call the same shared helpers, preserving request/response semantics.

### 2.3 Returns – `/api/return`

- **Path**: `/api/return`
- **Runtime**: Edge (`runtime = "edge"`)
- **Handler**: `packages/template-app/src/api/return/route.ts`
- **Implementation**:
  - Uses `@platform-core/repositories/rentalOrders.server` to mark orders returned/refunded.
  - Uses `@platform-core/pricing.computeDamageFee` to calculate damage fees.
  - Uses Stripe refunds to return deposits.
  - Reads shop configuration via `readShop` and `getShopSettings`.
- **Contract**:
  - Accepts `POST` with one of two shapes:
    - **Return completion**: `{ sessionId, damage? }` – marks a rental as returned, computes any damage fee, issues a Stripe refund for the remaining deposit, and records refunded status.
    - **Home pickup** (when supported): `{ zip, date, time }` – schedules a pickup (writing to persistence and notifying an external carrier), subject to zip eligibility and feature flags.
  - Returns JSON `{ ok: true }` on successful flows.
  - Returns JSON `{ error: string }` with appropriate status codes:
    - `403` when returns or home pickup are disabled.
    - `404` when orders cannot be found.
    - `400` for validation errors (for example invalid ZIP).
  - Platform‑compatible apps must express return logic by calling shared platform‑core helpers; no bespoke Stripe/refund flows outside those helpers.
  - Whether the home pickup branch is implemented for a given app is advertised via `capabilities.returnsHomePickup` in that app’s `runtimeContractManifest`.

### 2.4 Preview and preview token

#### 2.4.1 `/api/preview`

- **Path**: `/api/preview`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Handler**: `packages/template-app/src/app/api/preview/route.ts`
- **Contract**:
  - Accepts `POST` with optional JSON body `{ versions?: unknown }`.
  - On success:
    - Sets a `component-versions` cookie (when `versions` is provided).
    - Returns `{ ok: true }`, status `200`.
  - Used by PB/CMS to set up component version overrides for preview.

#### 2.4.2 `/api/preview-token`

- **Path**: `/api/preview-token`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Handler**: `packages/template-app/src/app/api/preview-token/route.ts`
- **Implementation**:
  - Requires `manage_orders` permission via `@auth/requirePermission`.
  - Uses `coreEnv.UPGRADE_PREVIEW_TOKEN_SECRET` and `createUpgradePreviewToken` from `@platform-core/previewTokens`.
  - Reads `NEXT_PUBLIC_SHOP_ID` for the shop context.
- **Contract**:
  - Accepts `GET` with query parameter `pageId`.
  - Responses:
    - `200` `{ token: string }` on success.
    - `400` `{ error: "Missing pageId" }` when missing.
    - `401` `{ error: "Unauthorized" }` when permission check fails.
    - `500` `{ error: "Token secret not configured" }` when the HMAC secret is absent.

#### 2.4.3 Worker preview route – `/preview/[pageId]`

- **Path**: `/preview/[pageId]` (Cloudflare Worker)
- **Handler**: `packages/template-app/src/routes/preview/[pageId].ts`
- **Implementation**:
  - Verifies either a standard preview token or an upgrade token using `@platform-core/previewTokens`.
  - Loads pages via `getPages(shopId)` from `@platform-core/repositories/pages/index.server`.
- **Contract**:
  - Accepts `GET` with query parameters:
    - `token` for standard preview, or
    - `upgrade` for upgrade preview tokens.
  - Returns:
    - `200` with JSON PB document when token is valid and page exists.
    - `401` for invalid/expired tokens.
    - `404` when the page cannot be found.

### 2.5 Stripe webhook – `/api/stripe-webhook`

- **Path**: `/api/stripe-webhook`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Handler**: `packages/template-app/src/api/stripe-webhook/route.ts`
- **Implementation**:
  - Reads the raw request body.
  - Verifies the `Stripe-Signature` header using the configured webhook secret.
  - Forwards the verified event to `handleStripeWebhook` in `@platform-core/stripe-webhook`.
- **Contract**:
  - Accepts `POST` with the raw Stripe webhook payload.
  - Returns `200` on success (including duplicate deliveries).
  - Returns `400` when signature verification fails.

---

## 3. Page Builder routes

### 3.1 Preview

- The preview routes described in **2.4** form the PB preview contract:
  - `/api/preview` – sets component version cookies.
  - `/api/preview-token` – issues signed upgrade tokens.
  - `/preview/[pageId]` (worker) – renders PB documents for a given shop and page.

### 3.2 Marketing/legal PB routes (target)

- Platform‑compatible apps are expected to expose marketing/legal PB pages via a route like:
  - `/[lang]/pages/[slug]`
- The template app currently implements PB preview only; Marketing/legal PB routes are a **target contract** and are not yet wired in `@acme/template-app`.
- When implemented, they must:
  - Resolve `lang` against `ShopSettings.languages`.
  - Load PB documents via shared platform‑core repositories.
  - Render blocks through the shared block registry so PB pages behave consistently across apps.

### 3.3 Block registry contract

- The shared block registry contract is defined by `@acme/page-builder-core`:
  - `BlockTypeId` (alias of `PageComponent["type"]`) is the single vocabulary for PB block `type` across CMS, template app, and tenant apps.
  - `BlockDescriptor` / `BlockRegistry` and `buildBlockRegistry` are the canonical types/helpers for describing blocks and building per‑app registries.
  - `coreBlockDescriptors` is the canonical descriptor set for blocks supported by the default theme and template app.
- Platform‑compatible apps:
  - MUST treat `@acme/page-builder-core` as the source of truth for PB block `type` identifiers and descriptors.
  - SHOULD build their PB registries via `buildBlockRegistry(coreBlockDescriptors, entries)` (or a superset) instead of ad‑hoc maps so preview and live routes share the same contract.

---

## 4. Theme and design system

Platform‑compatible apps must treat `@acme/theme` and `@acme/ui` as the source of truth for styling and layout:

- Read theme tokens via the shared theme APIs (for example `themeTokens` and the Tailwind preset).
- Expose CSS custom properties as expected by `@acme/ui` components.
- Assume at least:
  - A base colour palette (brand, background, text, accents).
  - Typography scales for headings and body.
  - Spacing and radius tokens used by core layout components.

The exact token set is defined in `@acme/theme`; apps should not introduce alternative token shapes that would break prefab block rendering.

---

## 5. Platform‑compatible app checklist

An app is **platform‑compatible** when it satisfies all of the following:

- **Environment**
  - Validates configuration via `@acme/config/env/*`.
  - Configures `NEXT_PUBLIC_SHOP_ID` and `NEXT_PUBLIC_BASE_URL` for the target shop.
- **Core routes**
  - Exposes `/api/cart` by re‑exporting `@platform-core/cartApi` handlers.
  - Implements `/api/checkout-session` using shared cart/cookie/pricing helpers and `@platform-core/checkout/session`.
  - Implements `/api/return` using platform‑core rental order and pricing helpers, not bespoke Stripe logic.
  - Implements the preview contract: `/api/preview`, `/api/preview-token`, and `/preview/[pageId]` as described above.
- **Data access**
  - Uses platform‑core repositories for `Shop`, `ShopSettings`, pages, and products.
  - Does not read `data/shops/*` or similar files directly.
- **Page Builder**
  - Supports PB preview via the worker route and preview APIs.
  - (Target) Implements `/[lang]/pages/[slug]` or equivalent for PB marketing/legal pages using the shared block registry.
- **System‑only blocks (target)**
  - Treats `CartSection`, `CheckoutSection`, and similar blocks as system‑only:
    - Not rendered on generic marketing/legal routes.
    - Only mounted in designated slots on system routes such as `/[lang]/checkout`.
    - PB palettes expose system‑only blocks only on those system routes/slots.

System‑only block placement rules and PB marketing routes are **aspirational for v1**; the template app may not fully enforce them yet, but they are part of the forward contract for platform‑compatible apps.

---

## 6. Platform‑compatible and pilot apps

For Thread B, we distinguish:

- **Canonical template app**
  - `@acme/template-app` — defines the platform runtime contract and is platform‑compatible.
- **Platform‑compatible tenant apps**
  - `apps/cover-me-pretty` — first tenant app to converge on the template runtime contract; its manifest lives at `apps/cover-me-pretty/src/runtimeContractManifest.ts` and advertises full compatibility.
- **Pilot convergence targets**
  - `apps/storefront` — shared storefront logic and contexts; currently a pilot convergence target with a manifest at `apps/storefront/src/runtimeContractManifest.ts` but not yet a full runtime or platform‑compatible app.
  - Additional apps can opt in by adding their own `runtimeContractManifest` and, once converged, flipping `platformCompatible` to `true`.

Each app carries its own `runtimeContractManifest` so tests and tooling can reason about capabilities and routes without scraping code.

---

## 7. `runtimeContractManifest`

The machine‑readable view of this contract lives at:

- Template app: `packages/template-app/src/runtimeContractManifest.ts`
- Tenant/platform apps: per‑app manifest files (for example `apps/cover-me-pretty/src/runtimeContractManifest.ts`, `apps/storefront/src/runtimeContractManifest.ts`) with the same shape.

Shape (simplified):

- `appName: string` – e.g. `"@acme/template-app"`.
- `platformCompatible: boolean` – whether this app asserts full compliance.
- `routes`:
  - `apiCart`, `apiCheckoutSession`, `apiReturn` – each with `path` and `runtime`.
  - `preview` – object describing `pageRoute`, `workerRoute`, `apiPreviewRoute`, `apiPreviewTokenRoute`.
- `capabilities`:
  - Booleans such as `cart`, `checkout`, `returns`, `preview`.
  - Return-flow flags such as `returnsHomePickup` indicating whether the app implements the optional home pickup branch on `/api/return`.
  - PB flags such as `pageBuilderPreview` and `pageBuilderMarketingPages`.
  - `systemBlocks` flags for system‑only block support.

The manifest for the template app is exported as `runtimeContractManifest` and typed as:

- `export type RuntimeContractManifest = typeof runtimeContractManifest;`

Thread D and CMS/tests should:

- Import the manifest from `@acme/template-app`.
- Use it to decide which routes and capabilities to assert.
- Fail CI if a platform‑compatible app’s manifest no longer matches this contract (for example missing `/api/cart` or marking `pageBuilderMarketingPages: true` without the corresponding routes).
