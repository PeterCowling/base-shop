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

_To be filled in as we research this area._

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

_To be filled in as we research this area._

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

_To be filled in as we research this area._

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

_To be filled in as we research this area._

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

_To be filled in as we research this area._
