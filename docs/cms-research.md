# CMS & Shop Platform — Research Log

This document is a living log for understanding and improving the CMS and shop platform so we can launch new shops quickly, with consistent quality, and with all revisions flowing through the CMS (not ad‑hoc app edits).

Each section captures:

- **Goals** – what we want this area to enable.
- **Questions** – concrete topics to research or validate.
- **Findings** – what we have confirmed in code so far.

---

## 1. Overall architecture & boundaries

### Goals

- Understand how CMS, platform packages, and shop apps fit together.
- Clarify which pieces are per‑shop configuration vs shared code.
- Map the create/deploy/upgrade pipeline end‑to‑end.
- Identify where multi‑tenant behaviour and environments are controlled.

### Questions

- **Source of truth for shop configuration**
  - How `Shop` and `ShopSettings` are persisted and read between CMS and runtime?
  - How JSON files under `data/shops/*` relate to Prisma and runtime repositories?

- **Create/deploy/upgrade pipeline**
  - How `createShop` works, including theme/nav seeding and initial pages.
  - How CMS invokes this via actions and API routes (`create-shop`, `launch-shop`, `deploy-shop`, `upgrade-shop`).
  - How `packages/template-app` is used as the base runtime vs “real” tenant apps (`apps/skylar`, `apps/cover-me-pretty`, `apps/storefront`).

- **Environment & multi‑tenant concerns**
  - How a specific shop is selected at runtime (e.g. `NEXT_PUBLIC_SHOP_ID`, repo config).
  - How staging vs production is represented (if at all) and whether CMS supports multiple environments per shop.

### Findings

- **Core building blocks**
  - **CMS app** – `apps/cms` is a Next 15 app that owns the in‑browser CMS UI and CMS APIs. It composes:
    - Generic CMS UI from `packages/ui` (e.g. Page Builder, media manager, shop chooser, settings forms).
    - Domain logic and repositories from `@acme/platform-core` (shops, pages, settings, products, cart, etc.).
    - Shop‑specific services and actions under `apps/cms/src/services/shops/*` and `apps/cms/src/actions/*`.
  - **Platform domain** – `packages/platform-core` owns the shop domain model and persistence:
    - `Shop` and related types live in `packages/types/src/Shop.ts` and `ShopSettings.ts`.
    - Repositories in `packages/platform-core/src/repositories/*` (e.g. `shops.server.ts`, `settings.server.ts`, `pages/index.server.ts`) wrap Prisma and JSON fallbacks via `resolveRepo` and `DATA_ROOT` (see `docs/persistence.md` and `packages/platform-core/src/dataRoot.ts`).
  - **Runtime shop apps** – tenant‑facing shops are Next apps that sit on top of `platform-core` and `ui`:
    - `packages/template-app` is the canonical base shop app (`src/app` pages, Stripe API routes, cart/checkout wiring, preview routes).
    - `apps/cover-me-pretty` is a concrete shop built on the same primitives, with its own layout, SEO, sitemap and analytics.
    - `apps/skylar` shares the same infra but is branded and localized differently.

- **Source of truth for shop configuration**
  - The **authoritative `Shop` record** lives in the `Shop` Prisma model (see `docs/architecture.md` and `packages/platform-core/prisma/schema.prisma`), accessed via:
    - `getShopById` / `updateShopInRepo` in `packages/platform-core/src/repositories/shop.server.ts`.
    - JSON fallback in `packages/platform-core/src/repositories/shop.json.server.ts`, driven by `SHOP_BACKEND` and `DATA_ROOT` (documented in `docs/persistence.md`).
  - `readShop` in `packages/platform-core/src/repositories/shops.server.ts`:
    - Tries the current repository (`getShopById`), then a raw Prisma row, then `shop.json` under `<DATA_ROOT>/<shop>/shop.json`.
    - Normalizes theme fields via `applyThemeData`, ensuring `themeDefaults`, `themeOverrides` and `themeTokens` are always present and merged.
    - Falls back to a minimal in‑memory `Shop` if nothing is found, using `defaultFilterMappings` and base theme tokens.
  - **Shop settings** (languages, tax region, analytics config, returns, etc.) are stored separately via `Settings` repositories:
    - `packages/platform-core/src/repositories/settings.server.ts` provides `getShopSettings` / `saveShopSettings` and diff history.
    - It resolves to either Prisma (`settings.prisma.server.ts`) or JSON (`settings.json.server.ts`) via `SETTINGS_BACKEND`.
  - Filesystem mirrors:
    - `createShop` writes a copy of `shop.json` under `data/shops/<id>/shop.json` via `ensureDir` + `writeJSON` (`packages/platform-core/src/createShop/createShop.ts`).
    - `DATA_ROOT` is resolved by walking up from `cwd` looking for a `data/shops` directory, or overridden via the `DATA_ROOT` env var.

- **Create/deploy/upgrade pipeline**
  - **Creating a shop (CMS → platform-core)**:
    - CMS exposes `POST /cms/api/create-shop` at `apps/cms/src/app/api/create-shop/route.ts`.
    - The route validates `{ id, ...CreateShopOptions }` with `createShopOptionsSchema` from `@platform-core/createShop`, then calls the server action `createNewShop` in `apps/cms/src/actions/createShop.server.ts`.
    - `createNewShop` verifies authorization (`ensureAuthorized`), then invokes `createShop(id, options, { deploy: false })` from `packages/platform-core/src/createShop/createShop.ts`.
  - **`createShop` implementation (platform-core)**:
    - Validates the `id` via `validateShopName` and builds `prepared` options using `prepareOptions` (theme, name, navigation, pages, analytics/shipping/tax providers, etc.).
    - Loads theme tokens via `loadTokens(prepared.theme)` and constructs the initial `Shop` object with:
      - `themeId`, `themeDefaults`, `themeOverrides`, `themeTokens`.
      - `navigation` from `prepared.navItems`.
      - Provider IDs for payment/shipping/tax and flags like `enableEditorial`, `subscriptionsEnabled`, `coverageIncluded`, `luxuryFeatures`.
    - Persists the shop to Prisma (`prisma.shop.create`) and writes `data/shops/<id>/shop.json`.
    - Seeds initial pages when `prepared.pages` is non‑empty by writing `Page` records (`prisma.page.createMany`).
    - If `options?.deploy === false`, returns `{ status: "pending" }` without deployment; otherwise calls `deployShop` lazily (from `./index`) so tests can spy on it.
  - **Configurator‑driven launch**:
    - The `/cms/configurator` flow (see `apps/cms/src/app/cms/configurator/steps.tsx` and `hooks/useConfiguratorDashboardState.ts`) tracks a `ConfiguratorState` and step completion.
    - `useLaunchShop` (in `apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts`) checks that all required steps are complete, then POSTs to `/cms/api/launch-shop` with `{ shopId, state, seed }`.
    - `/cms/api/launch-shop` (second handler in `apps/cms/src/app/api/launch-shop/route.ts`) coordinates a multi‑step SSE stream with statuses for `create`, `init`, `deploy` (and optional `seed`), internally calling other internal endpoints like `/api/create-shop` and deployment helpers; the stream is consumed by the Configurator UI to show live progress.
  - **Deployment and hosting**:
    - `/cms/api/deploy-shop` (same file) delegates to `deployShopHosting`, `getDeployStatus`, `updateDeployStatus` in `apps/cms/src/actions/deployShop.server.ts`.
    - These in turn interact with the deployment adapter layer described in `docs/deployment-adapters.md` (backed by `packages/platform-core/src/createShop/deploy.ts` and adapters like Cloudflare Pages).
  - **Upgrade path**:
    - `/cms/api/upgrade-shop` (third handler in the same route file) is a Node‑only endpoint that shells out to `scripts/src/upgrade-shop.ts` via `pnpm tsx`.
    - It requires `manage_pages` permission via `@auth`, then runs the upgrade script in the repo root; failures surface as a generic 500 “Upgrade failed”.

- **Environment & multi‑tenant behaviour**
  - **Shop selection in runtime apps**:
    - Most runtime code reads a **single active shop ID** from `NEXT_PUBLIC_SHOP_ID` (or similar) via `coreEnv`:
      - Example: `packages/template-app/src/app/AnalyticsScripts.tsx` uses `(coreEnv.NEXT_PUBLIC_SHOP_ID || "default")` to load shop settings and analytics config.
      - Preview routes like `packages/template-app/src/routes/preview/[pageId].ts` and `apps/cover-me-pretty/src/routes/preview/[pageId].ts` fallback to `"default"` or `"shop"` when the env is unset.
      - Sitemaps in both template app and `cover-me-pretty` (`app/sitemap.ts`) call `loadCoreEnv()` and choose `shop = NEXT_PUBLIC_SHOP_ID || "shop"`.
    - `apps/cover-me-pretty` also embeds a `shop.json` at build time and imports it in `[lang]/layout.tsx` to resolve SEO and theme tokens for that specific shop.
  - **CMS view of shops**:
    - CMS lists shops by scanning the filesystem under `DATA_ROOT` using `apps/cms/src/lib/listShops.ts` (simple `fs.readdir` of `resolveDataRoot()`), not by querying Prisma directly.
    - The `/cms/api/shops` route (`apps/cms/src/app/api/shops/route.ts`) currently calls a separate `listShops` implementation from `apps/cms/src/lib/listShops`, so the CMS “shop chooser” effectively operates on the directories under `data/shops`.
    - Platform repositories (`shops.server.ts`, `settings.server.ts`, `pages/index.server.ts`) can use either Prisma or JSON according to `*_BACKEND` variables and `DATABASE_URL` (see `docs/persistence.md`).
  - **Environments (staging/production)**
    - There is **no explicit multi‑environment abstraction** per shop in the core types; `Shop` and `ShopSettings` are environment‑agnostic and represent a single configuration.
    - Environment differences are controlled via **process‑wide env vars** and backend switches:
      - `DATABASE_URL`, `DATA_ROOT`, and `*_BACKEND` values select different stores (e.g. local JSON vs production Postgres).
      - Core env (`@acme/config/env/core`) carries values like `NEXT_PUBLIC_BASE_URL`, Stripe keys, and `NEXT_PUBLIC_SHOP_ID`.
    - This means “staging vs production” is typically realised by running separate deployments with different env vars, not multiple environments per shop managed inside the CMS.

These findings suggest that:

- **Configuration authority** is split between `Shop` JSON/Prisma and `ShopSettings`, with CMS mostly writing into those via `services/shops/*` and server actions.
- **Runtime shop selection** is currently **single‑tenant per deployment** (one `NEXT_PUBLIC_SHOP_ID`) rather than a dynamic multi‑tenant router, though multiple shops can exist in the data layer and be managed from CMS.
- The **create/deploy/upgrade lifecycle** is already centralised in `platform-core` + CMS APIs, but we will likely need clearer “environment” and “per‑shop runtime” concepts if we want truly push‑button, multi‑shop launches from a single CMS instance.

### Open questions / gaps

- **Source of truth semantics**
  - Should Prisma or JSON be treated as authoritative for `Shop` and `ShopSettings`, and in which scenarios?
  - How should drift be handled when a shop exists in the DB but not in `data/shops` (or vice versa)?
  - Is JSON intended as a cache, backup, or first‑class peer to Prisma, and does that differ per repository?
- **Platform vs tenant responsibilities**
  - Which responsibilities must live in `platform-core` (e.g., domain models, cart/checkout, orders, repositories) vs tenant apps (`apps/cover-me-pretty`, `apps/skylar`)?
  - Which `@acme/*` exports are “public API” that tenant apps can safely depend on, and which are internal details that may change?
- **Tenancy & environments**
  - Is the current “one active shop per deployment” model acceptable for the goal of launching many shops from a single CMS, or do we need a multi‑tenant runtime (host-header routing, per‑shop subdomains, etc.)?
  - How do we ensure strict data isolation between shops at the repository level (e.g., consistent scoping by shop ID in all queries)?
  - What is the right abstraction for per‑shop environments (dev/stage/prod) beyond process‑wide env vars?
- **Deployments & upgrades**
  - What guarantees of repeatability and idempotency do we need for `createShop`, deployments, and `upgrade-shop` across environments?
  - What is the standard per‑shop rollout/rollback story (and how is it surfaced in CMS)?
  - How does `upgrade-shop` behave in the presence of tenant‑level customizations, and how are template/component versions tracked per shop to avoid breakage?
- **Operational observability**
  - How do we log and surface metrics/traces per shop to debug misbehaving tenants?
  - How do we track “which runtime version + config revision is live for this shop right now?” in a way that CMS can show succinctly?

---

## 2. Page builder, blocks, and templates

### Goals

- Understand how CMS models pages and blocks and how that maps into runtime React components.
- Identify gaps between current block palette and what we need for fully‑featured shops (PDP, account, cart, checkout, etc.).
- Clarify responsibilities of `page-builder-core`, `page-builder-ui`, and `templates`.

### Questions

- **Page entity and revision history**
  - Structure of `Page` and `PageComponent`.
  - How pages are stored and versioned (including diff history, draft vs published, and rollback).

- **Editor UX and block registry**
  - How the Page Builder palette is constructed and how block types map to runtime components (`DynamicRenderer`).
  - How product/content blocks (e.g. product grids, hero banners, testimonials) are wired to actual data sources.

- **Template & composition layer**
  - Intended responsibilities for `page-builder-core`, `page-builder-ui`, and `templates` packages.
  - How reusable templates (e.g. home, shop, PDP) are defined and applied per shop.

### Findings

- **Page entity & history model**
  - Pages are typed via `pageSchema` in `packages/types/src/page/page.ts`:
    - Fields include `id`, `slug`, `status: "draft" | "published"`, optional `visibility: "public" | "hidden"`, `components: PageComponent[]`, `seo` (per-locale `title`/`description`/`image` + optional `noindex`), `createdAt`, `updatedAt`, `createdBy`, and optional `history?: HistoryState`.
  - CMS page actions (`apps/cms/src/actions/pages/*.ts`) implement CRUD:
    - `createPage` constructs a new `Page` with `components` from the form, localized SEO (`mapLocales`), timestamps, and `createdBy` from the session, then delegates to `savePage`.
    - `updatePage` parses a serialized `history` value, builds a patch `{ id, updatedAt, slug, status, components, seo, history }`, finds the previous page, and calls `updatePageInService`; it has a single conflict-resolution retry when the backend reports `"Conflict: page has been modified"`.
    - `deletePage` enforces auth and calls `deletePageFromService`.
  - Persistence and revision history are handled in `packages/platform-core/src/repositories/pages`:
    - `index.server.ts` routes calls to either `pages.prisma.server.ts` or `pages.json.server.ts` via `resolveRepo` and `PAGES_BACKEND`.
    - Both backends maintain a **diff history** per shop in `pages.history.jsonl` under `<DATA_ROOT>/<shop>`:
      - Each save/update appends `{ timestamp, diff }`, where `diff` is the field-wise difference between `previous` and `page` (using JSON string comparisons).
      - `diffHistory(shop)` reads and validates this log, exposing a list of `PageDiffEntry` for potential history/replay features.
    - The JSON backend enforces optimistic concurrency by comparing `previous.updatedAt` with `patch.updatedAt` and throwing on mismatch.

- **Editor metadata & runtime behaviour**
  - Editor-only metadata lives inside `history.editor` (see `docs/page-builder-metadata.md` and `packages/ui/src/components/cms/page-builder/state/history.schema.ts`):
    - Per-component flags like `name`, `locked`, `zIndex`, `hidden` (per breakpoint), `stackStrategy`, `orderMobile`, etc.
    - This metadata is not part of the core `PageComponent` schema by default but is persisted alongside it in `HistoryState`.
  - Persistence/export flow:
    - `usePageBuilderState` (in the Page Builder) keeps a `HistoryState` in memory and mirrors it to `localStorage` under `page-builder-history-{page.id}`.
    - `usePageBuilderSave` serializes the history into the form payload; CMS actions merge `editor` metadata into components via `exportComponents(list, editor)` when needed so runtime renderers can rely on flattened props.
  - Runtime rendering applies metadata:
    - `packages/ui/src/components/DynamicRenderer.tsx` is the generic renderer that:
      - Looks up each `PageComponent.type` in `blockRegistry` (from `cms/blocks`), strips builder-only props, and forwards normalized props plus `locale` to the block component.
      - Reads flattened style overrides from `block.styles` and turns them into CSS variables via `cssVars`, then applies inheritable typography (`--font-size`, `--line-height`, `--font-family`).
      - Applies `.pb-hide-desktop/tablet/mobile` classes and inline styles for position/size/z-index, as well as data attributes for scroll effects, timelines, hover/click actions and Lottie.
    - `packages/template-app/src/components/DynamicRenderer.tsx` is a template-app-specific renderer that:
      - Maps a subset of block types (e.g. `HeroBanner`, `ValueProps`, `ReviewsCarousel`, `ProductGrid`, `Section`, `ContactForm`, `Gallery`, `BlogListing`) to concrete components.
      - Injects product data from `@platform-core/products` into `ProductGrid` when the CMS block type is `ProductGrid`, wiring static structure to catalog data.

- **Editor UX & block registry**
  - The main Page Builder UI lives under `packages/ui/src/components/cms/page-builder`:
    - `PageBuilder` wraps `PageBuilderLayout` with `usePageBuilderLayout`, providing canvas, side panels, keyboard shortcuts, device presets, etc.
    - CMS re-exports this in `apps/cms/src/components/cms/PageBuilder.tsx`, so the builder is shared without forking.
  - Block registries:
    - Blocks are defined in `packages/ui/src/components/cms/blocks/*` and aggregated into `blockRegistry` in `blocks/index.ts`.
      - Each entry associates a `type` string with a React component plus metadata and optional `getRuntimeProps` to compute props at render time.
      - Registries are split by layer (`atomRegistry`, `moleculeRegistry`, `organismRegistry`, `containerRegistry`, `layoutRegistry`, `overlayRegistry`) but merged for runtime use.
    - `editorRegistry` in `page-builder/editorRegistry.ts` maps `PageComponent.type` values to lazily-loaded **editor components** (e.g. `HeroBannerEditor`, `ProductGridEditor`, `HeaderEditor`, `CheckoutSection` editors), so each block has a tailored configuration UI.
  - Palette and categories:
    - `paletteData.ts` builds palette categories using the registries and a simple labelification of type names.
    - Apps can extend the palette via `registerAppPalette(appId, categories)` with additional or overridden items; these are merged with the base categories for a given set of installed apps.
  - Page management UI:
    - `PagesPanel` (`packages/ui/src/components/cms/page-builder/pages-panel/PagesPanel.tsx`) provides a slide-in drawer with:
      - `PagesList` (search, select, reorder, toggle visibility, add, save order/draft) and
      - `PageSettings` (per-page settings like slug, SEO).
    - `usePagesState` wires this panel to the backend, deriving the current shop either from props or via `deriveShopFromPath`.
    - CMS entry `apps/cms/src/app/cms/pages/page.tsx` is a shop chooser that forwards users into per-shop editors under `/cms/shop/[shop]/pages/...`.

- **Template & composition layer**
  - Built-in section templates:
    - `page-builder/builtInSections.data.ts` and `built-in-sections/*` define curated section templates (header/footer variants, hero layouts, etc.) as `PageComponent` subtrees.
    - `getBuiltInSections(t)` returns these templates with localized labels/descriptions; the Page Builder uses them to offer “one-click” sections in the palette.
  - Library & remote presets:
    - `docs/pagebuilder-library.md` describes:
      - A per-shop/user library accessible via `/cms/api/library?shop=<id>` for saving/reusing component trees.
      - An optional `NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL` that returns remote presets (`template: PageComponent`) to augment the built-in catalog.
  - `page-builder-core`, `page-builder-ui`, `templates` packages:
    - `packages/page-builder-core`, `packages/page-builder-ui`, and `packages/templates` currently export only a `version` string; the real implementation resides inside `packages/ui` and `apps/cms`.
    - These stub packages appear to be placeholders for a future extraction where:
      - `page-builder-core` would expose schemas and logic (e.g. `Page`, `PageComponent`, validation rules, history),
      - `page-builder-ui` would expose framework-specific editor components, and
      - `templates` would provide reusable page/section templates for bootstrapping shops.

Overall, the Page Builder already covers:

- A strongly-typed page model with stored history/diffs.
- A shared editor with a rich block palette and per-block editors.
- A runtime renderer that reuses the same `PageComponent` tree to render into tenant apps.

The main gaps for our “prefab shop” goal are:

- Turning the stub `page-builder-core/ui/templates` packages into real public surfaces, so prefabs and templates can be shared and versioned cleanly across shops.
- Tightening the contract between commerce-oriented blocks (e.g. `ProductGrid`, cart/checkout sections, account sections) and platform APIs so these blocks can be dropped into any shop from CMS with minimal wiring.

### Open questions / gaps

- **Coverage of commerce‑critical page types**
  - For PLP (“shop” page), PDP, account (profile, orders, addresses), cart, checkout, legal pages, search, etc., which are:
    - Fully Page Builder–driven,
    - Implemented as fixed templates/routes, or
    - Not yet supported?
  - Which additional primitives are needed (login/register, subscription management, richer PLP filters, search results, etc.) to support real shops?
- **Page-type model & constraints**
  - Do we need an explicit “page type” on `Page` (Home, PDP, Checkout, Account, Marketing) with:
    - Allowed and required blocks per type,
    - Stronger rules for system pages vs marketing pages?
  - How should these constraints be enforced in the editor (validation) and at save/publish time?
- **Localization lifecycle**
  - How are block‑level props localized (beyond SEO titles/descriptions), and what are the fallback rules between locales?
  - How do we determine that a page is “publish‑ready” in all required languages, and how is this communicated to editors?
- **Templates/prefabs and evolution**
  - What concrete API should `page-builder-core/ui/templates` expose for reusable templates and prefabs shared across shops?
  - How are template versions tracked, and how do we safely roll out template changes to pages that were created from older versions (including block prop migrations)?
- **History & UX integration**
  - What retention policy and inspection tooling do we need for `pages.history.jsonl` diff logs?
  - How should history be surfaced to non‑technical users (compare, review, rollback) as part of everyday CMS workflows?
- **SEO, SSR, performance**
  - How does `DynamicRenderer` interact with SSR/streaming, and what patterns should we encourage/avoid to protect LCP/CLS on highly composed pages?
  - How should Page Builder–authored SEO metadata map onto Next 15 metadata APIs for dynamic routes, especially for core commerce pages?

---

## 3. Cart & checkout end‑to‑end

### Goals

- Have a robust, prefabricated cart and checkout flow that can be “dropped into” a shop (e.g. in the header) and “just works”.
- Ensure CMS can configure all necessary cart/checkout behaviour without touching app code.

### Questions

- **Cart domain & API**
  - Cart types, storage, and cookie mechanics.
  - Shared cart API surface and how apps expose it (template app, tenant apps, CMS preview).

- **Cart UI primitives**
  - Existing cart UI components (mini‑cart, sticky add‑to‑cart, order summary, etc.) and how they connect to cart state.
  - What’s missing to make a reusable “header with cart icon + mini‑cart” block that CMS can place.

- **Checkout flow integration**
  - How checkout sessions are created and confirmed (Stripe, pricing, shipping, tax).
  - How rental vs sale flows differ and are configured per shop.
  - How CMS surfaces and persists checkout‑related configuration (tax region, currencies, late fees, coverage, etc.).

### Findings

- **Cart domain, storage & cookie model**
  - Cart data structures:
    - `CartLine` (`packages/platform-core/src/cart/cartLine.ts`) holds `sku: SKU`, `qty`, optional `size`, optional `meta` (including `tryOn` metadata), and optional `rental` payload.
    - `CartState` is a `Record<string, CartLine>` keyed by a composite id (e.g. `"skuId:size"`), defined in `cartState.ts` and re-exported in `cart/index.ts`.
  - Storage backends via `CartStore` (`packages/platform-core/src/cartStore.ts`):
    - `createCartStore` chooses between in‑memory and Upstash Redis based on env (`SESSION_STORE`, `UPSTASH_REDIS_REST_URL/TOKEN`, `CART_TTL`), with `MemoryCartStore` as fallback.
    - `getDefaultCartStore` lazily instantiates a default store on first use; helpers `createCart`, `getCart`, `setCart`, `deleteCart`, `incrementQty`, `setQty`, `removeItem` all delegate to this shared store.
  - Cookie & security model (`packages/platform-core/src/cartCookie.ts`):
    - Cart identity is tracked via a signed cookie named `__Host-CART_ID`.
    - `encodeCartCookie` signs a base64url payload with `HMAC-SHA256` using `CART_COOKIE_SECRET` from core env; `decodeCartCookie` verifies and returns either a parsed JSON value or plain string, or `null` if invalid.
    - `asSetCookieHeader` constructs a secure, `HttpOnly`, `SameSite=Lax` cookie with a 30‑day `Max-Age` by default.
  - React cart context (`packages/platform-core/src/contexts/CartContext.tsx`):
    - `CartProvider`:
      - On mount, calls `fetch(getCartApi())` to load `/api/cart` or `/cms/api/cart` depending on `window.location.pathname` (so the same provider works in CMS previews and storefront apps).
      - Stores cart state both in React state and `localStorage` as a resilience layer.
      - Subscribes to `online` events to retry syncing a locally cached cart to the API when connectivity returns.
    - `useCart` exposes `[CartState, dispatch]`, where `dispatch` sends `POST`/`PATCH`/`DELETE` requests to the cart API for actions `add`, `setQty`, `remove`, `clear`, then updates local state and `localStorage`.

- **Cart APIs & app integration**
  - Shared cart API (`packages/platform-core/src/cartApi.ts`):
    - Implements `PUT`, `POST`, `PATCH`, `DELETE` for the cart, with `runtime = "edge"`, and normalizes all backends onto `CartState` + signed `CART_ID` cookie:
      - `PUT` replaces the entire cart based on validated `lines`, checking stock and required size, then persists via `setCart`.
      - `POST` adds an item: validates body with `postSchema`, looks up SKU, enforces size and stock, then uses `incrementQty` to apply changes (including optional `rental` payload).
      - `PATCH` updates quantity for a given line, and `DELETE` removes a line entirely; both handle missing carts/items with appropriate 404 responses.
    - All responses set the `CART_ID` cookie via `asSetCookieHeader(encodeCartCookie(cartId))` and return `{ ok, cart }`.
  - App-specific cart endpoints:
    - Template app:
      - `packages/template-app/src/api/cart/route.ts` re-exports `@platform-core/cartApi` handlers but forces `runtime = "nodejs"` to avoid edge runtime limitations during development.
      - The template app’s layout wraps the tree with `CartProvider` (`packages/template-app/src/app/layout.tsx`), so any cart-aware UI block can access the shared context.
    - Cover-me-pretty:
      - Implements a separate `/api/cart` (`apps/cover-me-pretty/src/api/cart/route.ts`) that directly manipulates a cart stored entirely in the cookie (serializing `CartState` into the signed cookie value rather than a separate cart ID).
      - Still uses `CART_COOKIE`, `encodeCartCookie`, and `decodeCartCookie`, but diverges from the central `CartStore` abstraction.
    - CMS:
      - Exposes `/cms/api/cart` using handlers in `apps/cms/src/app/api/cart/handlers/*.ts`:
        - These mirror the shared behaviour (product lookup, size/stock validation) but rely on `ensureCartStore` / `createCartStore` and maintain cart IDs consistent with platform-core.
      - This enables cart previews and load tests from within the CMS environment.

- **Checkout flow & Stripe integration**
  - Core checkout logic (`packages/platform-core/src/checkout/*`):
    - `createCheckoutSession` encapsulates Stripe Checkout creation:
      - Validates and normalizes options: `returnDate`, `coupon`, `currency`, `taxRegion`, `customerId`, `shipping`, `billing_details`, plus extras for coverage/fees.
      - Uses `calculateRentalDays` from `@acme/date-utils`, `findCoupon` from `coupons`, `getTaxRate` from `tax`, and helper functions `buildLineItemsForItem`, `computeTotals`, `buildCheckoutMetadata`.
      - Builds Stripe `line_items` from the cart per SKU, rental duration, and discount; optionally appends tax and coverage line items.
      - Computes totals (subtotal, deposits, discount) via `computeTotals`, converts to target currency using `convertCurrency` (`packages/platform-core/src/pricing/index.ts`), and includes these in both payment intent data and checkout metadata.
      - Creates a Stripe checkout session via `stripe.checkout.sessions.create` and returns `{ sessionId, clientSecret? }`.
    - Pricing helpers (`pricing/index.ts`) load pricing matrices and exchange rates from JSON under `<DATA_ROOT>/../rental`, supply `priceForDays` and `computeDamageFee` for rental flows.
  - Template app checkout (`packages/template-app/src`):
    - `api/checkout-session/route.ts`:
      - Reads `CART_COOKIE`, uses `decodeCartCookie` and `getCart` to reconstruct `CartState`.
      - Validates request body, then calls `createCheckoutSession` with:
        - `currency` (default `"EUR"`), `taxRegion`, `returnDate`, `coupon`, `customerId`, `shipping`, `billing_details`, `coverage` data, and `shopId` from `coreEnv`.
      - Adds coverage-specific line items and metadata when `coverageIncluded` is true in the shop and coverage codes are provided, adjusting deposits accordingly.
    - Checkout page: `packages/template-app/src/app/[lang]/checkout/page.tsx`:
      - Reads the cart back from the cookie for server-side rendering, revalidates products via `getProductById`, and recomputes totals for sale vs rental shops:
        - For sale shops, totals are simple `price * qty` + deposit.
        - For rental shops, it uses `priceForDays` + `convertCurrency` to derive rental prices for the requested period.
      - Renders `OrderSummary` with validated cart and totals plus a local `CheckoutSection` that wraps `CheckoutForm`.
    - `CheckoutForm` (`packages/ui/src/components/checkout/CheckoutForm.tsx`):
      - Client component using `@stripe/react-stripe-js`:
        - Calls `/api/checkout-session` to create a session with `{ returnDate, currency, taxRegion, coverage }`.
        - Renders `PaymentElement` and handles `stripe.confirmPayment`, redirecting to `/{lang}/success` or `/{lang}/cancelled` as appropriate.
      - Relies on `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `useCurrency` for currency context.
  - Cover-me-pretty checkout (`apps/cover-me-pretty/src/app/api/checkout-session/route.ts`):
    - Very similar to the template app’s route but:
      - Reads cart state directly from the JSON-encoded cookie value (since its cart API stores the full cart in the cookie).
      - Uses `getCustomerSession` to tie sessions to an authenticated customer when available.
      - Passes `shop.id` from a local `shop.json` into `createCheckoutSession`.

- **CMS configuration touchpoints for cart/checkout**
  - Shop-level settings for checkout:
    - `ShopSettings` (`packages/types/src/ShopSettings.ts`) includes:
      - `currency`, `taxRegion`, and multiple services that affect checkout/returns (deposit service, late fees, reverse logistics, return service, premier delivery, stock alerts, AI catalog).
    - CMS service `apps/cms/src/services/shops/settingsService.ts` exposes actions:
      - `updateCurrencyAndTax` → updates `currency` and `taxRegion`; directly used by template app checkout to pick display currency and tax region.
      - `updateDeposit`, `updateLateFee`, `updateReverseLogistics`, `updateUpsReturns`, `updateStockAlert`, `updatePremierDelivery`, `updateAiCatalog` configure services that influence background jobs, returns experience, and some UI.
  - Per-page cart/checkout blocks in the Page Builder:
    - `CartSection` (`packages/ui/src/components/cms/blocks/CartSection.tsx`):
      - Client block that renders `OrderSummary` plus optional promo/gift/loyalty UI; relies on `useCart` context when `cart` is not provided.
    - `CheckoutSection` (`packages/ui/src/components/cms/blocks/CheckoutSection.tsx`):
      - Wraps `CheckoutForm` and optional wallet/BNPL messaging; takes `locale` and `taxRegion` props.
    - Combined with `CartProvider` and the cart/checkout APIs, these blocks can already be placed in a page via the Page Builder and should function in any app that:
      - Includes the providers (`CartProvider`, `CurrencyProvider`), and
      - Exposes `/api/cart` and `/api/checkout-session` endpoints with the expected semantics.

Taken together, the platform already has:

- A robust cart domain with pluggable storage and a secure cookie model.
- Shared cart APIs and React context that work across CMS and shop apps.
- A full Stripe-based checkout pipeline built on top of cart + pricing + tax + coupons, with reusable `CheckoutForm` and `OrderSummary` components.
- CMS-managed settings for currency/tax and related services, plus Page Builder blocks for cart and checkout sections.

The main gaps for “drop-in” prefabricated cart/checkout are:

- Ensuring every tenant app strictly uses the shared `cartApi`/`CartStore` pattern (rather than custom cookie-based carts) so CMS-prefab blocks behave consistently.
- Tightening the contract between CMS config (shop settings, block props) and runtime endpoints (e.g. standardizing `/api/cart` and `/api/checkout-session` expectations) so placing `CartSection`/`CheckoutSection` in a header or page via CMS is reliably sufficient, without extra per-app wiring.

### Open questions / gaps

- **Order lifecycle & reconciliation**
  - When and where are orders created in relation to Stripe checkout sessions and webhooks?
  - How do we handle refunds (full/partial), cancellations, disputes, and reconcile any mismatches between Stripe’s state and our internal order models?
- **Inventory consistency & concurrency**
  - What behaviour do we want under concurrent add‑to‑cart and checkout operations for the same SKU (oversell vs strict reservations)?
  - Do we want a reservation model for inventory during checkout, or a simpler “best effort” approach, and how should failures be surfaced to users?
- **Security & compliance**
  - Can we explicitly document the security boundary (no card data at rest, reliance on Stripe for PCI/SCA/3DS) and any remaining obligations in our code?
  - Are cart cookies robust against tampering/replay, and how do they interact with CSRF protections and session management?
- **Cart identity & cross-device behaviour**
  - Should carts be associated with user accounts across devices and merged on login, or remain purely device‑scoped?
  - How long should carts persist, and what UX expectations (e.g., “remembered basket”) should we support?
- **Canonical cart contract & migrations**
  - How do we converge divergent cart implementations (template-app vs cover-me-pretty) onto a single canonical contract?
  - What tests and scaffolding do we need so new tenant apps always implement the same `/api/cart` and `CartProvider` contract?
- **Checkout configuration surface**
  - Which `ShopSettings` fields are strictly required for a functioning checkout vs optional enhancements?
  - How should advanced scenarios (multi-currency, multiple tax regions, B2B pricing, customer groups) be represented in settings and supporting code?
  - How do we want merchants to configure and understand the differences between pure sale, rental, and hybrid shop behaviours?

---

## 4. CMS → shop runtime wiring & preview

### Goals

- Ensure what users see in CMS preview closely matches the live shop.
- Clarify how CMS‑managed pages and settings feed into runtime apps.

### Questions

- **Preview pipeline and tokens**
  - How preview tokens are generated and validated.
  - How the template app fetches page data for preview and which components it uses to render.

- **Navigation, header/footer, and layout**
  - How `Shop.navigation` is represented and used in runtime apps.
  - Whether header/footer are CMS‑editable blocks and how they map onto runtime components.
  - What’s needed to add cart/account/search/etc. as CMS‑controlled header/footer elements.

- **Routing & page types**
  - How CMS pages map to routes in the template app and tenant apps.
  - How “marketing” vs “shop” pages are modelled and rendered.

### Findings

- **Preview pipeline (page content)**
  - Template app preview endpoint (`packages/template-app/src/routes/preview/[pageId].ts`):
    - Cloudflare Pages Function that:
      - Validates a `token` or `upgrade` query param via HMAC (`PREVIEW_TOKEN_SECRET` / `UPGRADE_PREVIEW_TOKEN_SECRET` from `coreEnv`).
      - Reads pages for the current shop (`NEXT_PUBLIC_SHOP_ID || "default"`) via `getPages(shop)` and returns the matching page JSON or 404/401.
    - Documented in `docs/upgrade-preview-republish.md` as `GET /preview/:pageId?token=<hmac>`.
  - Template app preview UI (`packages/template-app/src/app/preview/[pageId]/page.tsx` + `PreviewClient.tsx`):
    - Server route fetches `/preview/:pageId` (no-store), parses with `pageSchema`, extracts `components` and optional `history.editor`, and chooses a locale based on the page’s SEO titles.
    - It derives an initial device preset from `device` / `view` query, then renders `PreviewClient`.
    - `PreviewClient` is a client component that:
      - Manages device selection with `usePreviewDevice` and `DeviceSelector`.
      - Embeds `DynamicRenderer` (template app version) inside a frame that matches the selected device’s width/height.
    - This gives a true runtime preview of the page as rendered by the shop app, subject to the same `DynamicRenderer` and block mapping as live traffic.
  - CMS version preview (`apps/cms/src/app/preview/[token]/page.tsx`):
    - Client page that:
      - Accepts a `token` param (for a specific saved version), optional password, and fetches `/cms/api/page-versions/preview/:token` (not shown here) with no caching.
      - Shows metadata (shop, page, versionId, label, timestamp, component count) and a JSON dump of the version payload, with a link to open the raw data in a new tab.
    - Uses `TranslationsProvider` with `en` messages and `useTranslations` for the shell UI.
    - This is currently a **data-centric preview**; rendering of the version into a full page would require feeding `components` into a renderer similar to `DynamicRenderer`.

- **Configurator & local live preview**
  - Wizard preview (`apps/cms/src/app/cms/wizard/WizardPreview.tsx`):
    - Renders a live preview of the configurator’s current page definition:
      - Reads wizard state from `localStorage` (via `STORAGE_KEY` from `useConfiguratorPersistence`) and pulls a `components: PageComponent[]` array.
      - Applies theme tokens from `usePreviewTokens` (stored under `PREVIEW_TOKENS_KEY` in `localStorage`) into the preview container’s inline style, combined with a selected device preset from `devicePresets`.
      - Renders blocks by looking up `component.type` in `blockRegistry` and mounting the corresponding UI component inside an `AppShell` with `Header`/`Footer` from `packages/ui`.
    - Hook `usePreviewTokens` listens for `storage` and `PREVIEW_TOKENS_EVENT` to keep tokens in sync across tabs.
    - Theme token hover events (`THEME_TOKEN_HOVER_EVENT`) apply outlines to elements with matching `data-token` attributes in the preview, giving visual feedback during theme editing.
  - This preview path is **local-only** (driven by browser storage), optimized for fast feedback while configuring a new shop before anything is persisted or deployed.

- **CMS “Live” previews for running shops**
  - `/cms/live` page (`apps/cms/src/app/cms/live/page.tsx`):
    - Lists shops by scanning `DATA_ROOT` (`listShops()`).
    - For each shop, attempts to resolve an app directory `apps/shop-<shop>` and read its `package.json` to infer the dev/start port (via `-p <port>` in scripts).
    - Builds preview URLs (typically `http://localhost:<port>`) and surfaces them as “Live preview” links.
  - `LivePreviewList`:
    - Client component that renders a card per shop with status tags (“Preview ready” vs “Unavailable”) and an “Open preview” / “View details” button.
    - Uses `window.open` to open the preview URL in a new tab, with a toast for blocked popups or errors.
  - This feature is primarily about **orchestrating dev instances per shop** and giving CMS users a one-click way to open the live app; it doesn’t directly mediate page content, but it’s important for the overall preview story.

- **CMS-managed navigation, header/footer & runtime mapping**
  - Shop navigation and SEO:
    - `Shop` type includes `navigation` and `home*` fields, and `ShopSettings` includes `seo` per locale; CMS services under `apps/cms/src/services/shops/*` manage these via forms.
    - `apps/cover-me-pretty/src/lib/seo.ts` shows how runtime apps resolve SEO/OG metadata from `ShopSettings` and `ShopSettings.seo` per locale (using `getShopSettings(shopId)` and `NEXT_PUBLIC_SHOP_ID`).
  - Layout wiring in a concrete shop (cover-me-pretty):
    - `apps/cover-me-pretty/src/app/[lang]/layout.tsx`:
      - Resolves `lang`, loads translated messages, fetches shop settings and SEO (`getSeo`), and injects `ThemeStyle` for per-shop theme tokens.
      - Renders `Header` and `Footer` from `packages/ui/src/components/layout`, plus `JsonLdScript` for organization structured data.
    - `Header` server component (`packages/ui/src/components/layout/Header.tsx`):
      - Reads the cart cookie and uses `createCartStore` to compute an `initialQty` for the cart from `CartState`, so the header’s cart icon can show a badge.
      - Reads the shop configuration via `readShop(shopId)` (from `repositories/json.server`), using `shop.navigation` to build the nav model:
        - Normalizes navigation `label` to a string for the current `lang`, handling localized label objects.
      - Passes `lang`, `initialQty`, and processed `nav` to a client `HeaderClient` component that renders the actual header UI.
    - `Footer` client component renders basic legal links and uses `data-token` attributes for color theming.
  - This gives a **runtime mapping** from CMS-managed shop and settings data (`navigation`, SEO, theme) into header/footer layout components found in the UI package.

- **CMS → runtime wiring for CMS pages**
  - Page storage and retrieval:
    - CMS saves pages via `apps/cms/src/actions/pages/service.ts` → `@platform-core/repositories/pages/index.server.ts`, which persists to Prisma or JSON and tracks diffs.
    - Runtime apps, including the template app, read pages via the same `getPages(shop)` function for preview (`/preview/:pageId`) and potentially for dynamic content routes.
  - Rendering CMS pages in runtime:
    - Template app’s preview pipeline shows the “end‑to‑end” path:
      - CMS writes pages (with `components` and `history`).
      - Runtime preview route fetches them based on id + HMAC token.
      - `PreviewClient` uses `DynamicRenderer` to render the blocks in a device frame.
    - There is currently no fully generic `[slug]` CMS page route wired in the template app (the repo leans on explicit routes like `/[lang]/shop`, `/[lang]/checkout`, etc.), but the building blocks (repositories + `DynamicRenderer`) exist to add such a route.

Overall, the wiring between CMS and runtime currently supports three main preview modes:

- **Local configurator preview** (wizard + blockRegistry + localStorage tokens).
- **Versioned page previews** via CMS APIs (`/cms/api/page-versions/preview/:token`) and data viewer UI.
- **Runtime app previews** using the template app’s `/preview/:pageId` HMAC-protected endpoint and `PreviewClient`.

The key gaps for our goal are:

- Making the “generic CMS page → runtime route” mapping first-class (e.g., a standard dynamic route in the template app that renders CMS pages by slug).
- Tightening the layering so header/footer/nav rendering is clearly driven from CMS configuration (and optionally per-page overrides) while still being easy to drop into new tenant apps built on the template app. 

### Open questions / gaps

- **Preview token model**
  - How are preview tokens generated, scoped (per shop/page/user vs global), rotated, and expired for `/preview/:pageId` and version-preview APIs?
  - What is the revocation story if a token leaks or a preview should be invalidated early?
- **Caching & revalidation**
  - How should CMS edits trigger revalidation or cache invalidation in runtime apps (ISR, `revalidatePath`, CDN purge)?
  - Do preview endpoints bypass caches entirely, or share them cautiously, and how do we guarantee live storefronts are not serving stale CMS-managed content?
- **CMS page routing**
  - What standard route shape should CMS pages use in runtime apps (e.g. `/[lang]/pages/[slug]`, nested paths, reserved prefixes)?
  - How do we avoid conflicts between CMS-generated routes and hand-authored app routes, and how can we migrate existing apps to a new routing scheme?
- **Header/footer/nav as content**
  - Should header/footer/navigation be first-class CMS entities, with support for multiple variants and per-page overrides?
  - How do we reconcile `Header`’s current dependency on `shop.json` (JSON backend) with the Prisma-backed shop repository to avoid source-of-truth skew?
- **Domains & base URLs**
  - How do shops map to domains/subdomains in a multi-shop deployment, and how should CMS preview behave with custom domains?
  - How should SEO, link generation, and email templates use per-shop base URLs (including preview vs production)?
- **Media pipeline**
  - Where do CMS-uploaded media assets live in production (S3/R2/CDN), and how do preview and live environments resolve media URLs?
  - How should runtime apps consume media in a way that is both performant (responsive images, CDNs) and consistent with CMS storage?

---

## 5. CMS UX, workflows, and safety rails

### Goals

- Make the CMS extremely easy to use for non‑technical users.
- Provide clear workflows for creating, editing, and publishing shops without risky “foot‑guns”.

### Questions

- **Configurator experience & onboarding**
  - How the `/cms/configurator` flow is structured (steps, progress, required vs optional).
  - How each step is wired to concrete actions (theme selection, environment variables, payment/shipping config, etc.).
  - What’s missing for a realistic “from zero to launch” process.

- **Page builder ergonomics**
  - Editing experience (keyboard shortcuts, device presets, breakpoint controls, media workflows).
  - Error handling and guardrails when users misconfigure blocks or styles.

- **Shop settings UX breadth**
  - Which shop settings are required to launch a shop vs advanced/optional.
  - How settings are grouped in the UI and whether the current grouping matches real workflows.

- **Governance: revisions, publishing, and “no direct edits”**
  - How draft vs published content is handled (pages and shop settings).
  - How revisions and history are surfaced to users and whether rollbacks are supported.
  - Whether there is any enforcement that shop apps are not edited per‑shop (vs config‑only changes).

### Findings

- **CMS shell, navigation & roles**
  - Global layout:
    - `apps/cms/src/app/layout.tsx` wraps the entire CMS app with `CurrencyProvider` and `CartProvider`, applying global fonts and theme initialization via `initTheme`.
    - All `/cms/*` routes are wrapped by `apps/cms/src/app/cms/layout.tsx`, which:
      - Retrieves the NextAuth session and passes it through `CmsSessionProvider`.
      - Wraps children in `LayoutProvider` (`@platform-core/contexts/LayoutContext`) to expose breadcrumbs and configurator progress to client components.
      - Renders `LayoutClient` with the user’s role, which drives the top navigation/menu and shop selector.
  - Navigation & shop selection (per `docs/cms.md` and `apps/cms/src/app/cms/page.tsx` + `shop/settings` index pages):
    - Top-level nav options: Dashboard, Products, Pages, Media, Theme, Settings, Live, RBAC, Account Requests, Create Shop.
    - Many menus operate as “choose-a-shop first” entry points (`/cms/products`, `/cms/pages`, `/cms/settings`, `/cms/shop`) that:
      - Use `listShops()` (filesystem-based) to show shops.
      - Navigate into shop-scoped flows like `/cms/shop/{shop}/products`, `/cms/shop/{shop}/settings`, `/cms/shop/{shop}/pages/edit/...`.
    - Admin-only routes (RBAC, account requests, configurator) are guarded by role checks; hitting them without `admin` role yields redirects or 403.
  - Permissions & safety:
    - `ensureAuthorized` and `ensureCanRead` (in `apps/cms/src/actions/common/auth.ts`) centralize permission checks:
      - `ensureAuthorized` enforces “not viewer” by default (i.e., any non-viewer role may perform write operations in CMS actions), with test-only overrides.
      - `ensureCanRead` uses `canRead` from `@auth/rbac` for finer-grained read access, also with test-only admin assumptions when `CMS_TEST_ASSUME_ADMIN=1`.
    - The middleware tests (`apps/cms/src/__tests__/cmsAccess.integration.test.tsx`) verify:
      - Unauthenticated `/cms` access redirects to `/login`.
      - Authenticated admins pass through to CMS and can render shop lists.
      - Roles without read access are rewritten to `/403` with a 403 status.
    - `docs/permissions.md` documents default permission → role mappings (e.g. `manage_pages`, `checkout`, `manage_cart`), aligning storefront behaviour with CMS expectations.

- **Configurator UX & workflow**
  - Configurator entry (`/cms/configurator`):
    - Only admins can access this (documented in `docs/cms.md` as admin-only).
    - `apps/cms/src/app/cms/configurator/page.tsx` defers heavy work to client-only `ConfiguratorDashboard` and `GuidedTour` via dynamic imports to keep server rendering light.
  - Workflow structure:
    - `apps/cms/src/app/cms/configurator/steps.tsx` defines a canonical ordered list of steps, grouped by tracks (“foundation”, “experience”, “operations”, “growth”) and localized via `useTranslations`.
    - Steps include: shop type, shop details, theme, tokens, payment provider, shipping, checkout page, inventory, env vars, import data, hosting.
    - `getRequiredSteps` filters required steps; `stepIndex` maps step IDs to positions for progress indicators.
  - Dashboard state & progress:
    - `useConfiguratorDashboardState` wires together:
      - Fetching persisted state from `/api/configurator-progress` and merging it with local state.
      - Persisting per-step completion via `useConfiguratorPersistence`.
      - Calculating high-level progress metrics via `calculateConfiguratorProgress` for display in the header and quick stats.
      - Building `heroData`, `trackProgress` items, and `launchPanelData` (including tooltips and failed step links) using helper builders.
    - `useLaunchShop` coordinates the launch button:
      - Checks that all required steps are complete; otherwise calls `onIncomplete` with missing steps and surfaces a toast listing them.
      - Posts `{ shopId, state, seed }` to `/cms/api/launch-shop`, then consumes an SSE stream of step updates (`create`, `init`, `deploy`, `seed`) to show fine-grained launch status.
  - UX qualities:
    - The configurator surfaces context-rich hero sections, track-progress lists, and structured call-to-actions, but it still exposes many advanced options; for a “super simple” launch flow we may need a thinner, more opinionated “quick launch” path layered over the existing structure.

- **Page Builder ergonomics & guardrails**
  - Page Builder UI:
    - `PageBuilder` (<- `packages/ui/src/components/cms/PageBuilder.tsx`) provides canvas, panels, keyboard hotkeys, device presets, and inspector panels; CMS uses it directly via `apps/cms/src/components/cms/PageBuilder.tsx`.
    - Cypress CT suites under `apps/cms/src/app/_ct` (PageToolbar, breakpoints, hotkeys, router smoke tests) specifically validate:
      - Locale switching behaviour (`PageToolbar (CT)`).
      - Device selection and orientation.
      - Router param handling and basic rendering under different route configurations.
  - Editor metadata and safety rails:
    - `docs/page-builder-metadata.md` documents how `history.editor` holds flags like visibility, z-index, and stack strategy; these values are:
      - Persisted through history state and localStorage.
      - Applied to runtime via `.pb-hide-*` classes and CSS variables for typography, reducing risk of breakage when editing responsive visibility or text styles.
    - Actions like multi-select, locking, and z-order adjustments are limited to unlocked, absolutely positioned elements, avoiding accidental shifts of base layout sections.
  - Draft vs published:
    - Page actions and UI support:
      - Draft saves and explicit publishing (per docs and Page Builder UI), with `status: "draft" | "published"` in `Page`.
      - `diffHistory` in the page repository gives a technical change log, but there isn’t yet a full UX around browsing, comparing, and rolling back page versions in the CMS.
    - Safety gap:
      - While there is guardrail logic (validation schemas, conflict detection, history logs), the end-user experience for “safe editing, preview, and rollback” is spread across multiple screens (Page Builder, edit-preview preview, version preview) and could be unified into a single, simplified workflow.

- **Shop settings UX**
  - Settings entry (`/cms/settings`):
    - `apps/cms/src/app/cms/settings/page.tsx` is a “choose shop” page with a guided hero, feature highlight cards, and a shop chooser that navigates into `/cms/shop/[shop]/settings`.
    - Encourages a top-down mental model: first select a shop, then configure policies, team, and integrations for that shop.
  - Shop settings editor (see `docs/shop-editor-refactor.md` and `apps/cms/src/app/cms/shop/[shop]/settings/*`):
    - `ShopEditor` constructs the view via `useShopEditorForm`, which exposes:
      - `info`: the full `Shop` record, plus setter.
      - An `errors` map keyed by field names.
      - Derived token/override rows and helpers for editing `filterMappings`, `priceOverrides`, `localeOverrides` via `useMappingRows`.
      - Provider lists and submit handler.
    - UX patterns:
      - All inputs are wired through `useShopEditorForm` and separate validation helpers (e.g. `parseCurrencyTaxForm`, `parseDepositForm`).
      - Error strings from the shared `errors` map drive `aria-invalid`, contextual error messages, and validation hints near each section (e.g. currency/tax, deposit/late fees, reverse logistics, returns).
      - Reusable subcomponents (`FilterMappings`, `PriceOverrides`, `LocaleOverrides`) keep repeated UI consistent and easier to maintain.
  - Safety considerations:
    - Most mutating operations on shops and settings call `authorize()` / `ensureAuthorized()` before persisting via `persistSettings` / `updateShopInRepo`, so shop configuration is gated behind CMS roles.
    - However, the breadth of configuration surfaces (multiple tabs and forms) can overwhelm non-technical users; there is room to introduce “basic vs advanced” modes and clearer guidance on which fields must be set to launch a viable shop.

- **Governance & “no direct edits”**
  - Content and config editing flows:
    - Pages and products are edited entirely through CMS UIs (Page Builder, product editors) and persisted via platform repositories.
    - Shop configuration is edited through the Shop Editor and CMS settings forms.
    - Template-level upgrades and component edits are intentionally separated:
      - `docs/edit-preview-republish.md` covers the “edit components, preview via `/edit-preview`, then republish via CLI” flow.
      - `docs/upgrade-preview-republish.md` covers upgrading template components with `upgrade-shop`, previewing changes, and republishing or rolling back.
  - Enforcement:
    - There is **directional guidance** (docs + scripts) that all changes should go through CMS and the upgrade/edit flows, rather than hand-editing app code per shop.
    - However, there is no strict technical enforcement preventing developers from editing tenant apps directly; the governance is primarily conventions + tooling rather than hard multi-tenant isolation.

Taken together, the CMS already offers:

- A structured, role-aware shell with a shop selector and admin-only routes.
- A guided configurator that persists progress and gates launch on required steps.
- A sophisticated page builder with ergonomics tests and metadata-driven safety rails.
- Rich shop settings UI with form-level validation and error surfacing.

For the “extremely easy to use” goal, likely improvements include:

- A more opinionated “happy path” for shop creation and configuration, hiding advanced options behind explicit “advanced” toggles.
- A unified, user-friendly revision/rollback UI that brings together drafts, history diffs, and previews into one flow.
- Stronger guidance (and possibly automation) to keep tenant app code aligned with CMS-managed configuration and upgrade/edit flows, minimizing direct app edits.

### Open questions / gaps

- **Onboarding & happy path**
  - What is the minimal set of steps and configuration needed to launch a viable shop, and how should the configurator foreground that “happy path”?
  - Which steps should be strictly blocking vs optional at first launch?
  - Where should embedded help (tooltips, docs links, best-practice defaults) live to guide non-technical users?
- **Revision & publishing workflow**
  - How should drafts, change history, edit-preview, and version-preview be presented as a cohesive “change & publish” flow for non-technical users?
  - Do we need scheduling (publish windows) and/or approval flows for certain pages (home, checkout, PDP)?
  - How should system pages (checkout, PDP, cart) differ from marketing pages in terms of publish risk and required checks?
- **RBAC & governance**
  - Do we need per-shop and per-section permissions (content vs settings vs code-adjacent changes), and what are the roles (editor, approver, admin) we care about?
  - Are there governance mechanisms we can adopt to discourage direct app edits (e.g., CI checks, conventions, tooling)?
- **Guardrails for dangerous operations**
  - Which CMS actions are high-risk (shop deletion, data resets, tax/region changes on live shops, upgrades), and what additional confirmations/warnings/role checks should wrap them?
- **Settings UX**
  - Do we need “basic vs advanced” modes or progressive disclosure for shop settings to avoid overwhelming first-time merchants?
  - How can we better communicate dependencies between settings (e.g., enabling a feature that relies on specific env vars or third-party credentials)?

---

## 6. Developer ergonomics & testing

### Goals

- Make it easy for engineers to add new prefabs/flows without breaking existing shops.
- Ensure critical flows (create shop, edit, publish, checkout) are well tested.

### Questions

- **Libraries & shared abstractions**
  - How generic CMS UI and domain logic are split between `packages/ui`, `packages/platform-core`, `packages/cms-marketing`, and app‑specific code.
  - How `@acme/template-app`, `@acme/themes`, and `@acme/theme` interact.

- **Test coverage for critical flows**
  - Where unit/integration/e2e tests already cover CMS + runtime flows.
  - Where we should add focused tests to protect new prefabs and workflows.

### Findings

- **Libraries & shared abstractions**
  - UI and CMS:
    - `packages/ui` is the central design system and CMS UI library, structured along Atomic Design lines (atoms → molecules → organisms → templates) per `docs/architecture.md`.
    - CMS uses these components directly (Page Builder, media manager, layout components, etc.), so improvements to `packages/ui` propagate across apps without duplication.
    - CMS-specific glue (e.g. `apps/cms/src/components/cms/PageBuilder.tsx`) is intentionally thin, keeping behaviour in shared packages.
  - Domain and persistence:
    - `packages/platform-core` encapsulates domain logic (shops, pages, products, cart, checkout, pricing, tax, orders, returns, settings) and repository resolution logic (`resolveRepo`, `DATA_ROOT`, `*_BACKEND` envs), documented in `docs/persistence.md` and other domain docs (orders, returns, upgrade flow).
    - Template app and tenant shops (e.g. `apps/cover-me-pretty`, `apps/skylar`) import from `@platform-core` to avoid reimplementing business rules.
    - `packages/types` provides Zod-backed schemas for core entities (`Shop`, `ShopSettings`, `Page`, `PageComponent`, `SKU`, etc.), giving compile-time and runtime validation for CMS and runtimes.
  - Page Builder:
    - Page Builder logic currently lives in `packages/ui` and CMS code; stub packages (`page-builder-core`, `page-builder-ui`, `templates`) exist but only export `version`, indicating a planned future extraction of public surfaces.
    - Supporting docs (`docs/page-builder-metadata.md`, `docs/pagebuilder-library.md`, `docs/page-builder-metadata.md`) outline how metadata, library import/export, and presets are intended to work across apps.

- **Testing & tooling**
  - Unit and integration tests:
    - `apps/cms` has extensive Jest suites covering:
      - Actions and services (pages, products, media, shops, RBAC, maintenance, etc.).
      - Auth/authorization (e.g. `cmsAccess.integration.test.tsx`, `authorization.test.ts`).
      - Page Builder and CMS components (`apps/cms/src/components/cms/__tests__`, `apps/cms/src/app/cms/__tests__`).
    - `packages/platform-core` includes tests for repositories, cart/checkout, pricing, createShop, and background services (see `README.md` and individual test files).
    - `packages/types` has schema tests (e.g. `pageSchema.test.ts`) to ensure types and Zod schemas remain aligned.
  - Component/canvas tests:
    - Cypress component tests under `apps/cms/src/app/_ct` exercise Page Builder UI (toolbar, hotkeys, breakpoints, router integration) and fundamental i18n behaviour, ensuring the editing experience is stable.
    - `docs/cypress.md` documents how these tests should be run and scoped to avoid expensive monorepo-wide runs.
  - E2E & load tests:
    - K6 scripts under `apps/cms/load-tests` stress the cart API and media upload endpoints, with thresholds set on latency and error rate (e.g., `cart.k6.js`, `media-upload.k6.js`, `upload-csv.k6.js`).
    - Lighthouse configs (`lighthouserc*.json`) and docs (`docs/lighthouse.md`, `docs/performance-budgets.md`) define performance budgets and usage patterns for CI.
  - Testing guidance:
    - `docs/testing-with-msw.md`, `docs/cypress.md`, and `docs/development.md` outline strategies for:
      - Using MSW (Mock Service Worker) in Jest and Storybook for networked components.
      - Running tests in a scoped way (per package/app) rather than monorepo-wide.
      - Managing Next.js, Storybook, and Playwright integration.

- **Developer ergonomics**
  - Monorepo workflow:
    - `docs/development.md` and `docs/install.md` describe the PNPM + Turbo repo setup, local dev commands, and how to run specific apps and packages.
    - `docs/tsconfig-paths.md` explains the path mapping scheme so apps can import shared packages via `@acme/*` aliases in both source and built output.
    - `docs/package-management.md` and `docs/design-system-package-import.md` provide guidance on cross-package dependencies and how to consume design system components correctly (avoiding deep import paths).
  - Upgrade/edit flows:
    - `docs/edit-preview-republish.md` and `docs/upgrade-preview-republish.md` describe CLI flows for:
      - Editing components (through CMS), previewing via `/edit-preview`, and republishing.
      - Upgrading template components via `upgrade-shop`, previewing upgraded components/pages, and republishing or rolling back.
    - These flows are supported by CLI scripts under `scripts/src`, and their status/metadata is surfaced in CMS (`/cms/shop/{shop}`) via quick actions and preview panels.
  - Security & permissions:
    - `SECURITY.md` and `security/AGENTS.md` (for security work) plus `docs/permissions.md` give clear guidance on reviewing external surfaces, auth, and role/permission mappings.
    - CMS actions consistently go through `ensureAuthorized` / `ensureCanRead` and `@auth/rbac` helpers, with dedicated tests to avoid accidental exposures.

Overall, the repo already has a strong foundation for shared abstractions and testing. For our prefab CMS/shop goals, developer-facing improvements that would help include:

- Firming up the `page-builder-core/ui/templates` packages as real, documented public APIs so editor logic and templates are easier to evolve and reuse.
- Adding targeted tests around newly introduced prefabs (cart/checkout/header blocks, shop creation flows) to guarantee drop-in behaviour across apps.
- Providing higher-level scaffolding/CLI commands to create new tenant apps that are “correctly wired” (providers, routes, envs) for CMS-driven composition by default.

### Open questions / gaps

- **Coverage vs goals**
  - Which test suites concretely cover our critical goals (create shop → configure → publish → live checkout), and where are there gaps?
  - Do we have at least one end-to-end scenario that passes through configurator, CMS editing, deployment, and a live Stripe checkout for a tenant app?
- **Prefab & block workflow**
  - What is the standard, documented developer workflow for adding new prefab blocks so they are:
    - Type-safe, storybook-covered, tested, palette-registered, and mapped into runtimes?
  - Should we provide scaffolding (plop generators, lint rules) to enforce that workflow?
- **Versioning & breaking changes**
  - How do we manage breaking changes in `platform-core` or `ui` with multiple tenant apps live on different timelines?
  - How should `componentVersions` and `lastUpgrade` in `shop.json` be used to coordinate upgrades and detect incompatible changes?
- **Local dev & data seeding**
  - How easy is it today to spin up a realistic shop locally (products, pages, orders), and what scripts/fixtures do we need to make that trivial?
  - Do we need standard “sample shops” for QA/regression testing of prefabs and flows?
- **Observability**
  - What logging/metrics/tracing conventions should we use (tagging by shop ID) for critical flows like createShop, publish, upgrade, checkout?
  - How should developers instrument new features so production issues can be quickly attributed to specific shops, versions, or flows?
