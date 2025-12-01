# CMS & Shop Platform — Research Log

This document is a living log for understanding and improving the CMS and shop platform so we can launch new shops quickly, with consistent quality, and with all revisions flowing through the CMS (not ad‑hoc app edits).

Each section captures:

- **Goals** – what we want this area to enable.
- **Questions** – concrete topics to research or validate.
- **Findings** – what we have confirmed in code so far.

### Target outcomes & constraints

- Time from “start configurator” to first live shop should be ≤ 30 minutes for a non‑technical user, assuming required external accounts (e.g. Stripe) already exist.
- CMS‑authored changes (pages, settings, theme) should appear live on all configured runtimes within ≤ 60 seconds of publish, without manual restarts.
- Any tenant app that implements a documented contract (providers, routes, env vars, and preview hooks) should be able to use prefabricated cart/checkout/header blocks with zero app-specific code changes.

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
  - **Best‑bet direction (current thinking):**
    - In production and other shared environments, `Shop` and `ShopSettings` should be persisted and read **only via Prisma/Postgres**. JSON is a non‑authoritative mirror used for export/import, debugging, and local seeding.
    - In dev/offline/demo environments, when a repo’s `*_BACKEND` is explicitly set to `"json"`, that repo uses JSON under `DATA_ROOT` as its **sole source of truth** for that environment; Prisma is ignored for that repo (and `DATABASE_URL` may be unset).
    - For shops/settings specifically:
      - When `SHOP_BACKEND` / `SETTINGS_BACKEND` are not `"json"` (DB mode):
        - `readShop` / `readShopSettings` should always read from Prisma; runtime code must not fall back to JSON. Stray JSON files are ignored by runtime code.
        - JSON snapshots, if desired, are produced via explicit export tooling (and/or optional auto‑snapshotting in local/dev, not in prod).
      - When `SHOP_BACKEND` / `SETTINGS_BACKEND` are `"json"` (JSON mode):
        - `readShop` / `readShopSettings` read/write JSON only; Prisma may be unset or unused.
    - Implementation‑wise, each repository should resolve **one backend per process** based on its `*_BACKEND` (and fail fast if Prisma is selected but `DATABASE_URL` is invalid), route all calls through that backend, and remove “try DB then JSON” reconciliation from core read paths. Hybrid scenarios (e.g. migrating from JSON to DB) should live in dedicated tooling, not in the main repos.
- **Platform vs tenant responsibilities**
  - Which responsibilities must live in `platform-core` (e.g., domain models, cart/checkout, orders, repositories) vs tenant apps (`apps/cover-me-pretty`, `apps/skylar`)?
  - Which `@acme/*` exports are “public API” that tenant apps can safely depend on, and which are internal details that may change?
  - **Best‑bet direction (current thinking):**
    - **Platform‑core responsibilities (`@acme/platform-core`)**
      - *What it owns*
        - Business domain and persistence for all shops:
          - `Shop`, `ShopSettings`, products, inventory, pricing, tax, cart, checkout, orders, returns, subscriptions, analytics, background services (`platform-machine`).
        - Repository layer:
          - `@platform-core/repositories/*` for shops/pages/settings/products/orders, with Prisma/JSON implementations hidden behind `resolveRepo` and `*_BACKEND` envs.
        - Runtime services and shared flows:
          - React contexts such as `CartContext`, `CurrencyContext`, `ThemeContext`, `LayoutContext`.
          - Shop lifecycle flows like `createShop`, `deployShop`, and related upgrade/preview helpers.
      - *Public API surface (apps may depend on these)* — examples (not exhaustive, but should become a documented list):
        - Cart & checkout:
          - `@platform-core/cart`, `@platform-core/cartCookie`, `@platform-core/cartStore`, `@platform-core/cartApi`.
          - `@platform-core/checkout/session`, `@platform-core/pricing`, `@platform-core/tax`, `@platform-core/coupons`.
        - Domain repositories (server‑side only):
          - `@platform-core/repositories/shops.server`.
          - `@platform-core/repositories/settings.server`.
          - `@platform-core/repositories/pages.server`.
          - `@platform-core/repositories/products.server`.
          - `@platform-core/repositories/orders.server`.
        - Shop lifecycle:
          - `@platform-core/createShop` (and any related helpers we explicitly bless).
        - These subpaths are intended as stable, documented contracts; apps can import them directly.
      - *Internal details (apps should not import these)*
        - Backend implementations and low‑level utilities:
          - `*.prisma.server.ts`, `*.json.server.ts`.
          - `db.ts`, `safeFs.ts`, internal `dataRoot` helpers.
        - Any `@platform-core/*` path that is not explicitly documented as public.
        - Contract: if an app imports these, it is in unsupported territory, and they may change without notice.
        - Rule of thumb: if a symbol is not referenced from docs or from `apps/*` via a clean, documented subpath, treat it as internal to platform-core.
    - **Tenant app responsibilities (`apps/cover-me-pretty`, `apps/skylar`, …)**
      - *What they own*
        - The Next.js shell:
          - App Router structure (`app/[lang]/…`), layouts, error and not‑found pages, route‑level data fetching.
          - Brand‑specific route naming and URL structure (within any global constraints we define).
        - Brand and UX composition:
          - Choosing fonts, colours, themes, SEO conventions.
          - Assembling pages with `@acme/ui` components and Page Builder–driven content.
          - Deciding which Page Builder blocks/templates are available for that brand.
      - *How they integrate with the platform*
        - They only consume public APIs from:
          - `@acme/platform-core` (domain, persistence, flows).
          - `@acme/ui` (design system, Page Builder UI, layout components).
        - They must not:
          - Implement their own cart/checkout/orders/pricing logic.
          - Talk directly to DB/JSON backends or copy/paste repository logic.
        - When an app needs behaviour that isn’t exposed yet (e.g., a new checkout variant, new order view), it should:
          - Request or design a new abstraction in platform-core (via ADR/issue).
          - Consume that abstraction once it exists, rather than building a one‑off in `apps/*`.
    - **UI package responsibilities (`@acme/ui`)**
      - *What it owns*
        - Shared design system:
          - Atoms/molecules/organisms/layout components used by CMS and storefront apps.
        - CMS & Page Builder UI:
          - Page Builder canvas, block palette, inspector panels.
          - CMS‑specific components (media manager, nav editor, shop chooser, etc.).
        - Layout primitives for tenant apps:
          - Shared `Header`, `Footer`, `AppShell`, grid systems, typography, etc.
      - *Public API surface*
        - Exports from `@acme/ui` (the package root) and any documented subpaths (for example, `@acme/ui/layout`, `@acme/ui/page-builder`, `@acme/ui/forms` once formalised).
        - These should be the only imports apps use from `@acme/ui`.
      - *Internal details*
        - Deep imports like `@acme/ui/src/...` are considered internal and should be removed over time:
          - They may change without notice.
          - Eventually we can enforce this with lint/CI.
- **Tenancy & environments**
  - Is the current “one active shop per deployment” model acceptable for the goal of launching many shops from a single CMS, or do we need a multi‑tenant runtime (host-header routing, per‑shop subdomains, etc.)?
  - How do we ensure strict data isolation between shops at the repository level (e.g., consistent scoping by shop ID in all queries)?
  - What is the right abstraction for per‑shop environments (dev/stage/prod) beyond process‑wide env vars?
  - Where and how are custom domains/subdomains stored and mapped to shops, and how is that mapping updated over time?
  - **Best‑bet direction (current thinking):**
    - *Tenancy model (near term)*
      - Treat the current model as intentional: the CMS and DB are **multi‑shop**, and each storefront deployment is **single‑shop**.
      - CMS manages many shops in a shared DB using `shopId`‑scoped entities (`Shop`, `ShopSettings`, products, pages, orders, etc.).
      - Each shop is materialised as a separate app (for example, `apps/shop-<id>` or a brand app like `apps/cover-me-pretty`) built from the template app plus shop data and deployed independently via a `ShopDeploymentAdapter` (Cloudflare by default).
      - A deployment is bound to a single `shopId` via `NEXT_PUBLIC_SHOP_ID` (or an embedded `shop.json` in brand apps); re‑binding a URL to a different shop requires a new deployment, not an in‑place flip.
      - Pros we accept for v1:
        - Strong blast‑radius isolation: perf bugs, deploy failures, or bad env vars affect one shop.
        - Simplified runtime config: essentially `NEXT_PUBLIC_SHOP_ID` + env vars per app.
        - Easier custom domain mapping: host → app is handled at the infra level, not via a complex multi‑tenant router.
      - Cons we accept for v1:
        - `N` shops ⇒ `N` storefront deployments.
        - Heavier deploy footprint vs a single multi‑tenant runtime.
        - Some duplication of code/config across app instances.
      - These trade‑offs are acceptable as long as deployment remains push‑button via the `ShopDeploymentAdapter`. A host‑header‑based multi‑tenant storefront is a **future optimisation**; our data model already scopes by `shopId`, so a multi‑tenant runtime could be added later without changing persistence.
    - *Runtime selection & `NEXT_PUBLIC_SHOP_ID`*
      - Keep `NEXT_PUBLIC_SHOP_ID` (and, for brand apps, embedded `shop.json`) as the mechanism to bind a runtime to a single shop:
        - Template app reads `NEXT_PUBLIC_SHOP_ID` to resolve `readShop`, `getShopSettings`, preview, sitemap, analytics, etc.
        - Brand apps embed a specific `shop.json` and `shopId` at build time.
      - Under this model, a deployment serves exactly one shop; DNS/hosting config decide which app instance a request hits.
    - *Data isolation in repositories*
      - All per‑shop repositories take an explicit `shopId: string` parameter (for example, `getPages(shopId)`, `getShopSettings(shopId)`, `listOrders(shopId)`).
      - Queries for per‑shop data must always include `shopId` in where clauses and, where appropriate, in composite keys/constraints.
      - Global data (for example, shared rental pricing matrices) is modelled explicitly as global and documented; we avoid ambiguous “sometimes per shop, sometimes global” tables.
      - Enforcement ideas:
        - Code‑level: no per‑shop repo functions without a `shopId` parameter; shared helpers like `withShopScope` to reduce “forgot to add `shopId`” mistakes.
        - DB‑level: composite unique keys that always include `shopId` (e.g. `(shopId, slug)`), foreign keys that keep related rows on the same shop, and (optionally) row‑level policies for background services in future.
    - *Per‑shop environments (dev/stage/prod)*
      - Environment boundaries live at the **deployment + DB** level, not inside `Shop`:
        - A “dev” deployment talks to a dev DB (or schema) and dev env vars.
        - A “stage” deployment talks to a stage DB and env vars.
        - A “prod” deployment talks to a prod DB and env vars.
      - The same logical `shopId` may exist in multiple environments (e.g. `"acme"` in dev vs prod), but each environment is isolated by its own deployment + database (or schema).
      - We do **not** add an `env` field to `Shop` or multiplex dev/stage/prod inside one DB row; if we need environment metadata per shop (e.g. “this shop has a staging deployment at URL X”), we store that as deployment metadata (e.g. in `deploy.json` or a dedicated table), not on `Shop` itself.
    - *Domains & DNS mapping*
      - `Shop.domain` (via `shopDomainSchema`) is the canonical mapping between a shop and its primary domain:
        - `shop.domain.name` is the primary domain; `status` and `certificateStatus` track provisioning state.
      - For v1 we support a single primary domain per shop; aliases/secondary domains are out of scope.
      - Deployment adapters (e.g. `CloudflareDeploymentAdapter`) are responsible for:
        - Writing deployment metadata (e.g. `deploy.json`) for a shop, including preview URLs and hosting info.
        - Reconciling DNS / Pages / certificates based on `shopId` + `shop.domain.name` when a shop is created or its domain changes.
      - Runtime routing remains straightforward:
        - Infra maps host → app deployment.
        - Within each app, `NEXT_PUBLIC_SHOP_ID` (or embedded `shop.json`) determines which `Shop` record the code uses.
- **Deployments & upgrades**
  - What guarantees of repeatability and idempotency do we need for `createShop`, deployments, and `upgrade-shop` across environments?
  - What is the standard per‑shop rollout/rollback story (and how is it surfaced in CMS)?
  - How does `upgrade-shop` behave in the presence of tenant‑level customizations, and how are template/component versions tracked per shop to avoid breakage?
  - What are the concrete failure modes for `createShop`/deploy/upgrade, and what rollback mechanisms (per shop) do we need when these only partially succeed?
  - Do we need a notion of “shop health” (healthy/degraded/broken) surfaced in CMS based on recent deploy/upgrade status and runtime checks?
  - **Best‑bet direction (current thinking):**
    - *Idempotency and repeatability*
      - We treat `createShop`, `deployShop`, and the CLI upgrade tools as **per‑shop flows**, but with different guarantees:
        - `createShop(id, opts)` (`packages/platform-core/src/createShop/createShop.ts`):
          - Writes a `Shop` row to Prisma and `data/shops/<id>/shop.json`, seeds `Page` rows, and finally calls `deployShop`.
          - It is **create‑only, not idempotent**: once a `Shop(id)` exists in a given environment, re‑running `createShop` for that `id` should fail loudly with a clear “shop already exists” error and must not attempt to mutate or merge an existing shop.
          - Given the same `(id, opts)` and the same template version, `createShop` should be **deterministic across environments** (dev/stage/prod), producing the same basic shop shape with no hidden randomness.
        - `deployShopImpl` (`packages/platform-core/src/createShop/deploy.ts`):
          - Scaffolds `apps/<id>`, patches `.env` with a generated `SESSION_SECRET`, calls the deployment adapter, and writes `deploy.json` via `writeDeployInfo`.
          - It is **effectively idempotent per shop and build**: re‑running for the same shop just re‑scaffolds and redeploys that build; `.env` updates are overwriting but bounded, and `deploy.json` is treated as “last known deployment status” for that shop (we can extend it with explicit version/timestamp fields over time).
        - `upgrade-shop.ts`, `republish-shop.ts`, and `rollback-shop.ts` (`scripts/src/*`):
          - `upgrade-shop <shop>` copies from `packages/template-app` into `apps/<shop>`, backing up any overwritten files with `.bak`, updates `shop.json.lastUpgrade` and `shop.json.componentVersions` based on the shop’s `package.json`, writes `upgrade-changes.json` (changed components and affected page IDs), and writes `data/shops/<id>/upgrade.json` with component version metadata; `--rollback` restores `.bak` files and removes `lastUpgrade`/`componentVersions` from `shop.json`.
          - `republish-shop <shop>` reads `upgrade.json` if present, snapshots the current `componentVersions`/`lastUpgrade` into `history.json`, builds and deploys `apps/<shop>`, updates `shop.json.status` to `"published"` and refreshes `componentVersions` from `package.json`, removes `upgrade.json`, `upgrade-changes.json`, and `.bak` files, and appends an entry to `audit.log`.
          - `rollback-shop <shop>` uses `history.json` to restore the previous `componentVersions`/`lastUpgrade` into `shop.json`, rewrites `apps/<shop>/package.json` dependencies to match, runs `pnpm ... install/build/deploy`, and updates `shop.json.status` back to `"published"`.
      - For v1, the mental model is:
        - `createShop` should either succeed once per `shopId` in an environment or fail clearly on duplicates; it is **not** a “converge” operation.
        - `deployShop`, `upgrade-shop`, `republish-shop`, and `rollback-shop` are **safe to re‑run** for the same shop (and build/version) as “make reality match the current desired state” operations.
    - *Per‑shop rollout/rollback story*
      - In a given environment, the intended lifecycle for a shop is:
        - **Create** – CMS (or CLI) calls `createShop` to seed Prisma + `data/shops/<id>` and optionally deploy an initial app via `deployShop`, which writes `deploy.json` (adapter `status`, `previewUrl`, and any human‑readable `instructions`).
        - **Upgrade & preview** – when template/UI packages change, `upgrade-shop <shop>` stages updated components into `apps/<shop>`, records `lastUpgrade` and `componentVersions` in `shop.json`, writes `upgrade.json` with component version metadata and `upgrade-changes.json` with changed components and affected pages, and ensures `UPGRADE_PREVIEW_TOKEN_SECRET` exists in `.env` so `/upgrade-preview` can render staged components.
        - **Republish** – after manual review, `republish-shop <shop>` builds and deploys `apps/<shop>`, updates `shop.json.status` to `"published"`, snapshots the previous `componentVersions`/`lastUpgrade` into `history.json`, cleans up `.bak`, `upgrade.json`, and `upgrade-changes.json`, and appends an entry to `audit.log`.
        - **Rollback (pre‑publish)** – if a staged upgrade is not acceptable *before* republish, `upgrade-shop <shop> --rollback` restores `.bak` files in `apps/<shop>`/`data/shops/<id>`, removes `lastUpgrade`/`componentVersions` from `shop.json`, and leaves the last published deployment intact.
        - **Rollback (post‑publish)** – if a published upgrade needs to be undone, `rollback-shop <shop>` restores the previous entry from `history.json`, rewrites `shop.json.componentVersions`/`lastUpgrade` and the app’s `package.json` dependencies, redeploys, and updates `shop.json.status`.
      - CMS should treat these CLI flows as canonical and surface them as explicit actions for each shop (for example, “Stage upgrade”, “Preview upgrade”, “Republish”, “Rollback staged”, “Rollback to previous version”), backed by the state in `shop.json`, `upgrade.json`, `history.json`, `deploy.json`, and `audit.log`, rather than inventing separate mechanisms.
    - *Customisations vs template evolution*
      - `upgrade-shop` is explicitly **template‑centric**: it copies from `packages/template-app` into the shop app and uses `.bak` files plus checksums to detect changes; it does not perform semantic three‑way merges with tenant‑level custom code.
      - For template‑driven shops (those created from the template and kept in sync):
        - Code customisation should not live under `apps/<shopId>`; instead, shops rely on shared components from `packages/ui`/`template-app` plus CMS‑managed content and `ShopSettings`.
        - `shop.json.componentVersions` and `shop.json.lastUpgrade` are **owned by the upgrade tooling** (`upgrade-shop`, `republish-shop`, `rollback-shop`) and should not be mutated by CMS actions; that keeps “template version” state separate from content.
      - For heavily customised brand apps (e.g. `apps/skylar` or bespoke forks):
        - They may still consume shared packages (`@acme/ui`, `@acme/platform-core`), but they are treated as **forks**, not as template‑driven shops.
        - Generic `upgrade-shop <shop>` may still be useful as a diff helper, but upgrades are essentially manual work guided by `upgrade-changes.json` and should not be assumed to be safe or automatic.
      - Per‑shop `componentVersions` in `shop.json` plus `history.json` give a concrete basis for:
        - Understanding which template/UI versions a shop is currently on.
        - Deciding which shops are eligible for a given upgrade.
        - Auditing how and when upgrades were applied or rolled back.
    - *Failure modes and health*
      - The current code already includes some resilience and audit hooks:
        - `createShop` writes to Prisma first, then attempts filesystem writes, and finally calls `deployShop`; filesystem write errors are swallowed, while deployment errors are captured via the adapter’s `DeployShopResult` and written to `deploy.json`.
        - `upgrade-shop` always creates `.bak` files before overwriting and exposes `--rollback` to restore them.
        - `republish-shop` refuses to run without a valid `shopId`, throws on failed `pnpm ... build/deploy`, and leaves `upgrade.json`/`.bak` files in place if an error occurs, so they can be inspected.
        - `rollback-shop` maintains `history.json` as an append‑only log of previous `componentVersions`/`lastUpgrade` snapshots and uses it to drive rollbacks.
      - A reasonable v1 health model is **per shop per environment**:
        - **Data health** – `Shop`/`ShopSettings`/page rows exist in DB and validate; `data/shops/<id>/shop.json` (if present) parses and passes schema checks.
        - **Deployment health** – the last entry written to `deploy.json` has `status: "success"`; the corresponding app responds to a basic health probe.
        - **Upgrade health** – no stale `upgrade.json` stuck for longer than a chosen threshold without a matching republish; `history.json` shows a consistent progression of `componentVersions` and `lastUpgrade`.
      - CMS can surface a coarse **`healthy` / `needs attention` / `broken`** status per shop per environment derived from these artefacts, with links to `deploy.json`, `history.json`, `upgrade.json`, and `audit.log` plus clear calls to action (“retry deploy”, “rollback upgrade”, “repair snapshot”) to help operators resolve issues quickly.
- **Operational observability**
  - How do we log and surface metrics/traces per shop to debug misbehaving tenants?
  - How do we track “which runtime version + config revision is live for this shop right now?” in a way that CMS can show succinctly?
  - **Best‑bet direction (current thinking):**
    - *Logging*
      - Use `@acme/shared-utils/logger` as the single structured logger across CMS, platform‑core, and runtimes. All logs should be JSON with at least:
        - `level` (`info` for happy path, `warn` for degraded-but-handled situations, `error` for failing operations),
        - `timestamp`,
        - `service` (e.g. `cms`, `template-app`, `platform-core`, `background-worker`),
        - `env` (`dev`/`stage`/`prod`),
        - `shopId` (where applicable),
        - `requestId` (per HTTP request), and
        - `operationId` (for multi‑step flows like `createShop`, `upgrade-shop`, `deployShop`, so logs from different services for the same logical operation can be tied together).
      - Log messages should be small, structured events `{ message, meta }` rather than free‑form strings, with `meta` holding additional context (e.g. `pageId`, `userRole`, `endpoint`, `statusCode`). A consistent shape like `{ level, timestamp, service, env, shopId?, requestId?, operationId?, message, meta }` makes shipping logs to any central system trivial later.
      - Per‑shop observability comes from always including `shopId` when a log relates to a specific shop (CMS actions, repo calls, cart/checkout APIs, deployment/upgrade flows, background jobs). Linting and code review should steer new code away from `console.log` and towards the shared logger so observability doesn’t fragment.
    - *Metrics*
      - Focus metrics on a tiny, well‑defined set of core flows, always labelled by `shopId` and `env` (and optionally `service`):
        - Shop lifecycle: counters for `createShop` attempts/success/failure.
        - CMS editing: page publishes, settings saves, media uploads.
        - Commerce flows: cart API calls, checkout attempts, successful checkouts, checkout failures (by coarse reason such as `validation`/`provider_error`).
        - Upgrades: `upgrade-shop`, `republish-shop`, and `rollback` runs.
      - Concretely, we expect counters and latency histograms such as:
        - `cms_shop_create_total{shopId,env,status}`,
        - `cms_page_publish_total{shopId,env,status}`,
        - `cms_settings_save_total{shopId,env,status}`,
        - `cart_checkout_requests_total{shopId,env,status}`,
        - `upgrade_republish_total{shopId,env,status}`,
        - plus latency histograms for cart/checkout and CMS save/publish endpoints.
      - To avoid metric cardinality explosions, we **only** use `shopId`, `env`, and possibly `service` as labels; high‑cardinality data like `userId`, `pageId`, or arbitrary slugs go into logs, not metric labels. The concrete metrics backend (Prometheus, vendor, etc.) can be chosen later as long as these naming and labelling conventions are honoured.
    - *Traces (future‑ready)*
      - The codebase is already structured around explicit `shopId`; we can make it more trace‑friendly by standardising a light `RequestContext` object (e.g. `{ shopId, env, requestId, operationId }`) that is passed into platform‑core services and longer‑running flows from CMS and runtimes.
      - Today, this context can power logging and simple timing; in a future phase, we can attach an OpenTelemetry‑style tracer to the same context to emit spans for key flows (checkout, `createShop`, `upgrade`, `deploy`) without refactoring function signatures again.
      - For now, `requestId` (per inbound request) and `operationId` (per multi‑step flow) are the main tools for correlating logs and any future traces across CMS, APIs, and storefronts.
    - *Tracking “which version/config is live?”*
      - We derive a per‑shop, per‑environment “live state” from a few existing artefacts plus a small amount of extra metadata:
        - **Runtime code version**:
          - `data/shops/<id>/deploy.json` (written by the `ShopDeploymentAdapter`) should hold:
            - `version` (build/artefact ID, e.g. commit SHA or hosting deployment ID),
            - `status` (`"pending"` | `"success"` | `"error"`),
            - a `timestamp` for the last attempt, and
            - the storefront `previewUrl` / `url` plus any human‑readable `instructions`.
        - **Template/component version**:
          - `data/shops/<id>/shop.json` already holds `componentVersions` and `lastUpgrade`, reflecting which version of each template‑owned component is currently published for this shop.
          - `data/shops/<id>/history.json` records previous `componentVersions`/`lastUpgrade` values so we can see how a shop has moved forward (and back) over time; this is primarily about template upgrades rather than day‑to‑day content.
        - **Config/content revision**:
          - The DB `Shop` and `ShopSettings` rows carry `updatedAt` (and could grow a dedicated `configRevision`/`publishedAt`); CMS pages carry their own `updatedAt`/`status`.
          - “Live config” should be interpreted as the latest **published** page revisions plus `ShopSettings` as of their last successful save; draft changes don’t affect this state until published.
      - Combining these, CMS can surface, for each shop and environment, a concise status such as:
        - `Live on build abcd1234, template v1.4.2 (header v3, footer v2), config published 2025‑04‑03, domain example.com, healthy`, or
        - `Upgrade staged (1 package pending), last deploy failed 2025‑04‑02 (view logs)`.
      - The shop dashboard and shop list can both show this “live state”:
        - As badges in the list view (`Healthy`, `Needs attention`, `Broken`).
        - As a richer status panel on the shop detail page with direct links to logs (`deploy.json` / `audit.log`), upgrade history, and the most relevant next actions (retry deploy, rollback, or open upgrade preview).
- **Security / isolation model**
  - How are secrets (Stripe keys, env vars, service credentials) isolated per shop and per environment, and where are they stored?
  - In a future multi‑tenant runtime, what per-request context do we need so isolation is enforced at the app layer (e.g., shop-scoped configuration and data access)?
  - **Best‑bet direction (current thinking):**
    - *Secrets and env isolation today*
      - Secrets are modelled as **environment‑level configuration**, not per‑shop fields:
        - Core secrets (auth/session) come from `@acme/config/env/auth` (`NEXTAUTH_SECRET`, `SESSION_SECRET`, `PREVIEW_TOKEN_SECRET`, `UPGRADE_PREVIEW_TOKEN_SECRET`, Redis tokens, etc.) and are validated eagerly in production.
        - Payments are configured via `@acme/config/env/payments` (`PAYMENTS_PROVIDER`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENTS_SANDBOX`, `PAYMENTS_CURRENCY`).
        - Shipping/tax integrations use `@acme/config/env/shipping` (`TAXJAR_KEY`, `UPS_KEY`, `DHL_KEY`, etc.), with strong validation to fail fast when required keys are missing.
        - Cart cookies are signed using `CART_COOKIE_SECRET` read via `loadCoreEnv` in `cartCookie.ts`.
        - CMS and external content services are configured via `cmsEnv` (`CMS_SPACE_URL`, `CMS_ACCESS_TOKEN`, `SANITY_*` secrets).
      - Under the current single‑tenant‑per‑deployment model, **each storefront deployment has its own `.env` and env vars**, so secrets are already isolated at the “shop + environment” level by virtue of separate deployments and databases:
        - `apps/shop-<id>` or brand apps like `apps/cover-me-pretty` read env vars from their own `.env` files (scaffolded and patched by `deployShopImpl`).
        - CMS runs with its own env (auth, CMS API tokens, etc.); it does not share runtime secrets with storefront apps beyond what is needed for preview and API calls.
      - Best current stance:
        - Keep **one secret set per deployment** (shop + env) and avoid ever putting raw secrets into `Shop`, `ShopSettings`, `shop.json`, page content, or Page Builder metadata; those records may be copied, exported, or inspected by people who should not see secrets.
        - When per‑shop variation is needed (e.g. different Stripe accounts for different shops), represent it as **different deployments with different env** (today), not as secret blobs stored in the database.
        - Secrets must not be logged or surfaced in CMS UI; logger helpers and UI components should treat anything resembling a secret as sensitive and either avoid logging it or mask it.
    - *Per‑shop configuration vs secrets*
      - `ShopSettings` and related domain objects should store **identifiers and configuration**, not secret material:
        - E.g. `"paymentProviders": [{ type: "stripe", mode: "live", accountLabel: "acme-main", credentialId: "stripe-acme-main" }]`, where `credentialId` is an opaque handle rather than a key.
        - Shipping/tax providers are selected by provider id/region; underlying keys come from env or, in future, a secrets manager.
      - This keeps a clear boundary:
        - CMS can fully manage “which providers/features are enabled for this shop” via structured config.
        - Secrets remain in env or an external secrets manager, managed via CI/infra tooling and rotated out‑of‑band.
    - *Future multi‑tenant runtime constraints*
      - If we later introduce a **multi‑tenant storefront runtime** (host‑header routing, many shops per process), we’ll need a stricter per‑request isolation model:
        - A `RequestContext` (or similar) would carry `{ shopId, env, requestId, operationId }` and be the **only** way to access per‑shop configuration. `shopId` should be derived once at the routing edge (host header / path prefix) and not trusted from request bodies or query parameters.
        - Repositories and services already take `shopId` explicitly; in a multi‑tenant runtime they would additionally take a `RequestContext` or derive env‑backed configuration from it, and `shopId` would be non‑optional for storefront requests.
      - Secret handling in a multi‑tenant runtime should follow one of:
        - **Single shared secret set** for all shops in that runtime (e.g. one Stripe account per environment). Shop‑specific behaviour is config only, not secrets.
        - Or a **registry of per‑shop secret handles** (e.g. `stripeAccountKeyId` / `credentialId` stored in `ShopSettings`, with the actual key fetched from a secrets manager keyed by `(env, shopId, keyId)`), never raw secrets in DB.
        - In practice this looks like a small in‑process config/secrets service:
          - Reads `ShopSettings` for IDs/modes/labels.
          - Resolves any handles via env + a secrets manager (with caching and TTL).
          - Exposes a `getShopRuntimeConfig(shopId)` that controllers/services call using the `RequestContext`, instead of reading env/DB directly.
      - In both cases:
        - Secrets are fetched at process start or via a dedicated secrets client, **not** from tenant‑controlled data.
        - All per‑shop data access continues to be scoped by `shopId`, and any future per‑request context must ensure we never accidentally cross shops in queries or config lookup.
- **Data retention & privacy**
  - What retention policies do we need for orders, carts, page histories (`pages.history.jsonl`), media, and audit logs?
  - What requirements do we have for deletion/DSR flows (GDPR “right to be forgotten”), and how should those be implemented across CMS and runtime apps?
  - **Best‑bet direction (current thinking):**
    - *Retention policy (high‑level)*
      - Treat retention as **policy‑driven per data class**, not ad‑hoc per table/file. Exact durations should be agreed with legal/compliance, but the likely shape is:
        - **Orders/payments** – retained for the longest period (e.g. 6–7 years) for accounting, tax, fraud, and dispute handling; hard‑delete only when legally required. Where possible, minimise PII attached to orders up front so older records are less sensitive.
        - **Customers/accounts** – retained while the account is active; subject to deletion/DSR flows on request. When accounts are deleted, associated PII should be removed or pseudonymised, while preserving order/payment records where required.
        - **Carts** – short‑lived (e.g. 30–90 days) to support “return to cart” UX; expired carts can be hard‑deleted without notice. Cart state is non‑authoritative and should not contain more PII than strictly needed.
        - **CMS content (pages, shop settings)** – current/published state retained indefinitely; history/logs (diffs, audit logs) subject to a bounded retention window (e.g. 90–365 days) to limit growth while still supporting rollback/audit needs.
        - **Media** – retained as long as referenced by published content or active products; orphaned media can be soft‑deleted and then hard‑deleted on a schedule.
      - Concretely, this suggests:
        - Configurable **retention windows** per data category (e.g. `CART_RETENTION_DAYS`, `PAGE_HISTORY_RETENTION_DAYS`, `AUDIT_LOG_RETENTION_DAYS`, `MEDIA_GRACE_DAYS`) with sensible defaults and clear doc per environment.
        - Background jobs (in `@acme/platform-machine` or similar) that periodically purge or archive data older than the configured thresholds, using soft‑delete → hard‑delete where appropriate.
    - *Specific artefacts in this repo*
      - **`pages.history.jsonl` (per shop)**:
        - Append‑only log of page diffs; useful for diff/rollback but unbounded by default.
        - Best‑bet: treat it as *operational history*, not permanent record:
          - Keep only the last N days/months per shop/page; older entries can be truncated or moved to cold storage if needed.
          - Provide tooling to inspect, compact, and truncate these logs so they don’t grow without bound.
      - **`history.json` and `audit.log` under `data/shops/<id>`**:
        - `history.json` tracks template upgrade history (component versions, timestamps); `audit.log` tracks republish actions.
        - Best‑bet: retain upgrade history as long as the shop exists (it’s small and valuable for debugging), but:
          - Allow admins/ops to **export and prune** old entries, and
          - Apply a retention window to very old audit noise if it becomes a storage issue.
      - **Orders and payments (Prisma DB + Stripe)**:
        - Follow accounting/tax guidance; do not purge automatically based solely on time unless a legal/compliance policy is defined.
        - Ensure PII stored alongside orders is minimised and covered by DSR flows: where orders must be retained, PII can be pseudonymised (e.g. replace names/emails with hashed or placeholder values) while keeping amounts, items, and timestamps.
      - **Carts**:
        - Carts are keyed by a signed cookie and stored in memory or Upstash Redis; retention is governed by explicit TTLs (`CART_TTL`) and cookie expiry.
        - Best‑bet: treat carts as **ephemeral, non‑authoritative**:
          - Enforce a max TTL (using `CART_TTL` and backend‑level TTLs); expired carts should be dropped automatically from the backing store.
          - Avoid storing unnecessary PII in cart metadata (no full names/emails; ideally only product SKUs, quantities, and anonymous flags like `tryOn`).
      - **Media**:
        - Stored via filesystem or external providers today; production should prefer an object store + CDN.
        - Best‑bet:
          - Track media references via CMS metadata (which pages/products use which assets).
          - Periodically identify **unreferenced** media and mark for soft delete (hidden from UI) with a grace period before hard deletion.
          - For user‑specific media (avatars, profile images), tie deletion to customer/account DSR flows (see below).
    - *Deletion / DSR flows*
      - For GDPR/DSR‑style “right to be forgotten”, we should design explicit flows rather than ad‑hoc scripts:
        - **Customers / end users**:
          - Provide a server‑side action (and eventually an API) that, given a stable customer identifier, removes or irreversibly pseudonymises PII in:
            - customer/account records,
            - associated profiles/preferences,
            - any marketing/notification tables we own.
          - Order/payment records should be preserved where legally required, but PII fields (name, email, phone, address) should be replaced with anonymised placeholders or salted hashes that cannot be reversed.
        - **CMS users/operators**:
          - Operator accounts contain PII (names/emails). A DSR flow should:
            - delete or pseudonymise the operator record, and
            - preserve action history while breaking the link to the real person (e.g. “Edited by deleted-user-123”).
        - **Logs and history**:
          - Logs (`audit.log`, `pages.history.jsonl`, application logs, analytics events) should be designed to avoid unnecessary PII in the first place (use user IDs, not emails, wherever possible).
          - Where PII is present, DSR flows should either:
            - redact those fields in place (e.g. overwrite email with `null`/placeholder), or
            - mark them as anonymised and stop further processing.
      - Implementation‑wise, this points to:
        - Explicit **DSR helpers** in `platform-core` that know how to scrub PII per domain entity (customers, CMS users, logs/history), and can be invoked by both CMS and background workers.
        - Clear CMS‑side UX and documentation that explain what “Delete customer” / “Anonymise customer” does:
          - which data is removed or anonymised,
          - what is retained for compliance reasons,
          - and that some aggregated/derived metrics may remain but are no longer linked to an identifiable person.

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
  - **Best‑bet direction (current thinking):**
    - *Current coverage (template app + cover‑me‑pretty)*
      - **Home / marketing landing**:
        - `apps/cover-me-pretty/src/app/[lang]/page.tsx` loads `PageComponent[]` from `data/shops/<shopId>/pages/home.json` and renders them via `DynamicRenderer` in `page.client.tsx`, optionally prefixed with a blog teaser. This is effectively a **Page Builder–driven home page** with a small amount of app‑specific decoration.
      - **PLP (“shop” listing)**:
        - `/[lang]/shop` routes in template app and `cover-me-pretty` are **code‑driven PLPs** (`ShopClient` components) over `PRODUCTS`, with built‑in search and filters based on URL query params. They do not currently consume Page Builder pages; customization is via code and theme, not CMS blocks.
      - **PDP (product details)**:
        - `/[lang]/product/[slug]` is a fixed route that fetches products via `@platform-core/products` and renders `PdpClient` plus some extra components (e.g. `CleaningInfo`), with SEO handled via `generateMetadata`. PDP is not Page Builder–driven today.
      - **Checkout / order confirmation / cancellation**:
        - `/[lang]/checkout` (template + `cover-me-pretty`) is a fixed route that reads the cart cookie, fetches products/settings, computes totals, and composes `OrderSummary` + `CheckoutForm` inside a `Section` block. Success/cancel pages are simple, non‑PB routes.
      - **Cart**:
        - There is currently **no dedicated `/cart` route**; cart UX is handled via `CartContext`, header/cart icon, and components like `CartTemplate` (prefab but not yet wired as a Page Builder block).
      - **Account / returns / legal**:
        - Account pages in `cover-me-pretty` (`/account/profile`, `/account/orders`, `/account/sessions`) are wired to templates from `@ui/account`, not Page Builder.
        - Returns/return‑policy is handled via a fixed `/[lang]/returns` route that renders copy derived from `ShopSettings` and return‑logistics helpers; other legal pages (e.g. terms/privacy) are not yet formalized as Page Builder page types.
      - **Search & collections**:
        - Product search is via a dedicated API (`/api/search`) plus in‑page search (e.g. `ShopClient` search input and `collections/[slug]`); there is no explicit `/[lang]/search` Page Builder route.
    - *Target model for commerce‑critical page types*
      - Distinguish between:
        - **System commerce pages** – routes whose primary job is to handle core flows (PLP, PDP, cart, checkout, account, returns, auth, legal/checkout terms).
        - **Marketing/editorial pages** – home, campaigns, stories, landing pages, blog, and content‑heavy sections.
      - A concise classification for v1:
        - Home – PB‑driven (today) via `PageComponent[]` + `DynamicRenderer`, with optional app decorations (e.g. blog teaser).
        - PLP – system route (`/[lang]/shop`) + PB slots (marketing bands above/below grid).
        - PDP – system route (`/[lang]/product/[slug]`) + PB slots (secondary content/upsells).
        - Checkout – system route (`/[lang]/checkout`) + PB slots for trust/upsell/copy only.
        - Account – system routes (`/account/*`) using `@ui/account` templates, with PB‑composable “adjacent” sections (e.g. support, FAQ) but not full PB pages.
        - Legal – system routes (e.g. `/[lang]/returns`, `/[lang]/terms`) with PB‑managed content blocks.
        - Search – system route(s) + PB search blocks (search box/results) that can be reused on other pages.
        - Cart – system flow (future explicit route) + PB cart blocks (cart icon, mini‑cart, cart table) for layout/header/footer use.
      - Best‑bet split:
        - System pages keep **explicit Next routes** (e.g. `/[lang]/shop`, `/[lang]/product/[slug]`, `/[lang]/checkout`, `/account/*`, `/[lang]/returns`), with:
          - Strong, versioned templates in `@acme/ui`/`template-app` for critical flows (PLP grid, PDP layout, checkout steps, account views).
          - Limited, well‑defined extension points where Page Builder–authored sections can be injected (e.g. marketing bands above/below PLP grid, upsell sections on PDP, trust badges on checkout).
        - Marketing/editorial pages are **fully Page Builder–driven** (`PageComponent[]` trees rendered via `DynamicRenderer`), with:
          - A dedicated CMS page type (e.g. “Marketing Page”) and a generic `[lang]/pages/[slug]` route in future, built on the existing `Page` + `DynamicRenderer` primitives.
      - For commerce‑critical types, a pragmatic v1 plan is:
        - **PLP** – keep `/[lang]/shop` as a system route backed by `@platform-core/products`, but:
          - Introduce PLP‑oriented blocks (`ProductGrid`, filter sidebar, category hero) that can be used both in the PLP template and in Page Builder pages.
          - Allow limited PB slots (above/below the grid) controlled from CMS.
        - **PDP** – keep `/[lang]/product/[slug]` as a system route that:
          - Uses a standard `ProductDetail` template and product data from `platform-core`.
          - Exposes PB slots for secondary content (e.g. stories, UGC, cross‑sell sections).
        - **Checkout** – keep `/[lang]/checkout` as a system route with strict templates for the core checkout flow; for v1 we **do not** make checkout fully Page Builder–driven. It only exposes PB slots for secondary content (trust badges, help copy, upsells) around the main flow.
        - **Account / orders / returns** – keep as system pages using `@ui/account` + platform APIs; for v1 we **do not** make account flows fully Page Builder–driven:
          - Provide PB blocks for account‑adjacent content (FAQ, support tiles) that can be dropped into layout slots.
        - **Cart** – continue to treat as a system flow with strict templates, but:
          - Wrap cart UI (icon + mini‑cart + full cart table) and checkout forms as composable blocks/sections so they can appear in headers/layouts where needed, while still delegating all logic to shared cart/checkout abstractions.
        - **Legal / policy** – add a small set of legal page types (returns, terms, privacy) where:
          - Legal text is stored and versioned via CMS.
          - Routes remain explicit (e.g. `/[lang]/returns`) to avoid SEO/UX surprises.
        - **Search** – keep search as a dedicated API + template(s), and expose search boxes/result blocks as PB components for marketing pages and headers, rather than making the entire search results page PB‑driven.
      - In terms of `Page` types, this implies:
        - Marketing/editorial pages would have `pageType = "marketing"` and be fully PB‑driven, likely served by a generic `[lang]/pages/[slug]` route backed by `Page` + `DynamicRenderer`.
        - Legal/policy pages could have `pageType = "legal"`, with content managed via PB but bound to explicit routes (/returns, /terms, /privacy).
        - System commerce pages (PLP, PDP, checkout, account, cart) are **not** `Page` records themselves; they expose well‑defined PB slots that accept `PageComponent[]` subtrees configured from CMS.
      - For v1 this also means, explicitly:
        - Checkout and account remain strict, template‑driven flows with limited PB slots; they are **not** arbitrarily reconfigurable PB pages.
    - *Additional primitives needed*
      - To make commerce‑critical pages feel “prefab but flexible” from CMS, we likely need:
        - **Authentication & account blocks** – login/register forms, account overview, addresses, saved cards, order history summary, “my rentals/subscriptions”.
        - **Cart & checkout blocks** – cart icon + badge, mini‑cart drawer (using `CartTemplate`), full cart section, checkout form sections (billing/shipping, summary, payment), and post‑checkout “thank you” sections.
        - **PLP/PDP blocks** – product grid, product list, product detail hero/specs/upsell sections, “related products” blocks that can be reused across PLP/PDP and marketing pages. These should be thin wrappers around the same underlying templates/logic used by `/shop` and `/product/[slug]` routes so behaviour (sorting, availability badges, pricing, tracking) stays consistent between system pages and PB‑composed pages.
        - **Legal/consent blocks** – terms acceptance, privacy notices, marketing opt‑in sections for checkout and account flows.
        - **Search & discovery blocks** – search box with autocomplete, search results listing that can be embedded in pages or used by a `/search` template.
      - Many of these primitives (cart icon + badge, mini‑cart drawer, login/account entry point, search box) are also intended for **header/footer layouts**:
        - Header/footer remain system layout components, but expose PB‑configurable regions that can host these blocks.
      - All of these should be **backed by platform‑core APIs** (products, cart, checkout, account, orders, search) so that dropping them into a PB‑managed page or layout does not require app‑specific wiring beyond including the right providers and routes.
- **Page-type model & constraints**
  - Do we need an explicit “page type” on `Page` (Home, PDP, Checkout, Account, Marketing) with:
    - Allowed and required blocks per type,
    - Stronger rules for system pages vs marketing pages?
  - How should these constraints be enforced in the editor (validation) and at save/publish time?
  - **Best‑bet direction (current thinking):**
    - *What `pageType` is for (and not for)*
      - We do want an explicit `pageType` on `Page`, but not to drive **all** routes:
        - `pageType` applies to **PB‑driven pages** (marketing, legal, editorial, fragments), not to core system pages like `/shop`, `/product/[slug]`, `/checkout`, or `/account/*` (those stay as explicit routes with templates and PB slots as described above).
        - System commerce pages are not `Page` records themselves; instead, they expose named **slots** that can host PB component trees (e.g. `pdpBelowFold`, `plpAboveGrid`, `checkoutSidebar`), configured from CMS.
      - Existing pages that have no `pageType` should be treated as `"marketing"` by default for backwards compatibility.
      - For v1, a minimal `pageType` enum might be:
        - `"marketing"` – fully PB‑driven marketing/editorial pages (home variants, campaigns, landing pages) served by a generic `[lang]/pages/[slug]` route in future.
        - `"legal"` – PB‑managed legal/policy pages whose content is stored as `Page` records but bound to explicit routes (e.g. `/[lang]/returns`, `/[lang]/terms`, `/[lang]/privacy`).
        - `"fragment"` – PB‑composed sections intended for use in slots (e.g. homepage hero variants, checkout trust strips) but not directly routed to.
        - (Optional future types: `"blog"` for CMS‑driven article pages, `"system"` reserved for internal use.)
    - *Constraints per page type*
      - Rather than hard‑coding rules in many places, define a central `pageTypes` config that describes, for each `pageType`, something like:
        ```ts
        const pageTypes = {
          marketing: {
            allowedBlockTags: ["hero", "section", "form", "product-grid-lite", "content"],
            forbiddenBlockTypes: ["checkoutSection", "accountSection", "cartSection"],
            requiredStructure: [{ kind: "atLeastOne", blockTag: "hero" }],
            reservedSlugs: ["shop", "checkout", "product", "account", "returns"],
          },
          legal: {
            allowedBlockTags: ["text", "heading", "policy", "toc"],
            forbiddenBlockTypes: ["checkoutSection", "cartSection"],
            requiredStructure: [{ kind: "atLeastOne", blockTag: "policy" }],
          },
          fragment: {
            allowedBlockTags: ["hero", "banner", "trust", "faq", "upsell"],
            // fragments are more flexible but still exclude dangerous blocks
            forbiddenBlockTypes: ["checkoutSection", "accountSection"],
          },
        };
        ```
      - Enforcement should happen in three layers:
        - **Palette** – filter/hide disallowed blocks for the current `pageType` so authors can’t easily pick them.
        - **Editor validation** – show inline warnings if a page violates *soft* rules (e.g. missing hero) before save/publish.
        - **Server‑side validation** – on publish, reject pages that violate **hard** constraints (e.g. a marketing page containing `checkoutSection`, or a slug that collides with a reserved route), with clear error messages.
    - *Interaction with routing*
      - `pageType = "marketing"`:
        - Pages appear under a generic, CMS‑driven route (e.g. `/[lang]/pages/[slug]`) and in nav/sitemap based on `visibility`.
        - Slugs are flexible, but validation should prevent conflicts with reserved system routes (`shop`, `checkout`, `account`, etc.).
      - `pageType = "legal"`:
        - Pages are associated with fixed routes (e.g. a “Returns policy” page bound to `/[lang]/returns`) via a routing config (e.g. `legalRoute: "/[lang]/returns"` or a `legalKey: "returns"` that the app maps to a route).
        - Slug changes may be restricted or ignored; the route is determined by configuration, not the slug field.
      - `pageType = "fragment"`:
        - Fragments are never directly routed; they are addressable by ID in slot configuration (e.g. `checkout.sidebar = fragment:abcd1234`).
        - The editor can provide a separate “Fragments” list where authors curate and name these reusable sections, distinct from full pages and from the existing per‑shop “library” of component trees/presets.
    - *Guardrails for checkout/account*
      - For v1 we explicitly **do not** make checkout or account flows fully Page Builder–driven:
        - Checkout/account routes stay as strict templates in `template-app`/`@ui/account`, with PB slots only for secondary content (trust badges, FAQ, banners).
        - Blocks that materially affect core flow (e.g. `checkoutSection`, `accountSection`, `cartSection`, `thankYouSection`, `dsarSection`) should be:
          - Hidden by default from generic marketing/fragment pages, and
          - Only available in dedicated “system slot” editors (e.g. a “Checkout sidebar content” editor that understands it’s configuring a slot, not a standalone page).
      - This gives strong guarantees that:
        - You can’t accidentally remove key elements from checkout/account via CMS.
        - Commerce flows remain testable and versioned at the template level, with PB used for copy/adjacent UX rather than the flow itself.
    - *How to evolve from here*
      - Start with a small `pageType` enum and a simple `pageTypes` config:
        - Focus on `"marketing"` and `"legal"` plus `"fragment"` where needed.
        - Implement palette filtering + publish‑time validation for obviously dangerous block/pageType combinations.
      - As more system pages grow PB slots, we can:
        - Introduce per‑slot constraints (e.g. checkout sidebar only accepts certain block types).
        - Add richer page types (`"blog"`, `"campaign"`) once we have concrete use cases.
- **Localization lifecycle**
  - How are block‑level props localized (beyond SEO titles/descriptions), and what are the fallback rules between locales?
  - How do we determine that a page is “publish‑ready” in all required languages, and how is this communicated to editors?
  - **Best‑bet direction (current thinking):**
    - *Locales and fallbacks*
      - Locales are defined centrally in `@acme/types` and re‑exported from `@acme/i18n` as `LOCALES` and `Locale`:
        - `resolveLocale` normalises arbitrary inputs to a supported locale, falling back to a global `DEFAULT_LOCALE` (usually `"en"`) for UI chrome and framework‑level decisions.
        - CMS‑authored content uses the shop’s `primaryLocale` (from `ShopSettings.languages[0]`) as its fallback via `fillLocales`.
      - Translation messages for UI chrome are loaded:
        - On the server via `useTranslations(locale)` in `@acme/i18n/useTranslations.server` (per‑locale JSON + English fallback).
        - On the client via `TranslationsProvider` + `useTranslations` (`packages/i18n/src/Translations.tsx`), with a default English bundle when no provider is mounted.
      - For CMS‑authored structures:
        - `Page.seo.title/description/image` are explicitly `Record<Locale, string>`; helpers like `mapLocales` and `fillLocales` (`packages/i18n/src/fillLocales.ts`) fill missing translations with a fallback string.
        - Shop‑level SEO in `ShopSettings.seo` uses a similar pattern: per‑locale records with per‑route overrides managed via `seoService`.
      - For each shop, the **primary fallback locale** should be derived from configuration:
        - Use `ShopSettings.languages` (or equivalent) to define the per‑shop language list; the first entry (`languages[0]`) is the `primaryLocale`.
        - All other locales fall back to `primaryLocale` via `fillLocales`; global `"en"` is just another locale and only acts as primary when chosen as such.
    - *Block‑level localisation*
      - Today, most block props are language‑neutral (layout, media URLs, tokens) or rely on runtime translations via `useTranslations` for labels and static copy.
      - For blocks that carry author‑editable text (headlines, button labels, rich text), the model should be:
        - **System blocks** (cart, checkout, account, etc.):
          - Labels like “Add to cart”, “Checkout”, “Sign in” remain **translation‑key driven** (e.g. `t("checkout.addToCart")`), never CMS text fields.
        - **Marketing blocks** (hero, promo banners, rich text sections):
          - Headline, body, CTA label, etc. are stored as `Record<Locale, string>` (or per‑locale rich text).
          - At save time, require a value for the primary locale and use `fillLocales` to copy that value into other locales that have not been explicitly set.
      - This keeps system copy consistent and localised via code, while letting editors control per‑locale marketing copy without ending up with half‑translated pages by accident.
    - *“Publish‑ready” per locale*
      - PB pages and page‑backed SEO need a notion of “translation completeness” per shop:
        - Let `primaryLocale` and `requiredLocales` come from `ShopSettings.languages` (and possibly a stricter `requiredLocales` subset).
        - Define a helper, e.g.:
          ```ts
          type LocaleReadiness = "complete" | "fallback" | "missing";
          type PageLocaleStatus = Record<Locale, LocaleReadiness>;

          function pageLocaleStatus(
            page: Page,
            requiredLocales: Locale[],
            primaryLocale: Locale
          ): PageLocaleStatus { /* inspect seo + block props */ }
          ```
        - Rough rules:
          - `complete` – SEO title/description present and all required localised block fields have a non‑empty value for that locale.
          - `fallback` – the locale only has values because `fillLocales` copied from `primaryLocale` (no explicit overrides).
          - `missing` – some required fields are empty even after fallback (e.g. primary locale not set).
      - Best‑bet v1 UX:
        - Publish is allowed if:
          - The primary locale is `complete`, and
          - All other required locales are either `complete` or `fallback`.
        - CMS shows:
          - A per‑locale pill for each required locale (e.g. ✅ Complete / ⚠️ Fallback / ⛔ Missing).
          - A warning on publish if any required locale is `fallback` or `missing`, but hard‑blocks only if the primary locale is `missing`.
        - Longer‑term, shops can opt into a stricter flag (e.g. `requireFullLocalization = true`) to enforce “all required locales must be complete before publish”.
    - *Where localisation logic lives*
      - The core rules should live in shared helpers:
        - Pure locale utilities (`fillLocales`, `mapLocales`, `resolveLocale`) stay in `@acme/i18n`.
        - Domain‑aware helpers like `pageLocaleStatus(page, requiredLocales, primaryLocale)` live in `platform-core` (or a CMS‑specific service), since they understand `Page`, `PageComponent`, and which block props are “localised vs structural”.
      - Storage vs runtime behaviour:
        - On **write** (CMS save/publish), use `mapLocales` to normalise inputs and `fillLocales` to persist a fully populated `Record<Locale, string>` keyed by the shop’s `LOCALES` and `primaryLocale`.
        - On **read**, do not mutate again; runtime code trusts that DB/JSON content is already filled and only uses `resolveLocale` to select the appropriate locale.
        - In practice, CMS computes `pageLocaleStatus` on the in‑memory form state **before** applying `fillLocales` and saving, so it can distinguish explicit per‑locale values from purely fallback‑derived ones without storing extra markers. The runtime does not need this distinction; it just reads the already‑filled content.
      - Editor UX:
        - Page Builder already has a concept of a current editing locale (toolbar switch).
        - When switching locale:
          - Inputs show the value for that locale.
          - If a value is coming purely from fallback (no explicit override), the UI can show a subtle “using primary locale” hint and offer a “Copy primary → this locale” action.
        - The editor consumes `pageLocaleStatus` to color these hints and publish controls consistently.
- **Templates/prefabs and evolution**
  - What concrete API should `page-builder-core/ui/templates` expose for reusable templates and prefabs shared across shops?
  - How are template versions tracked, and how do we safely roll out template changes to pages that were created from older versions (including block prop migrations)?
  - **Best‑bet direction (current thinking):**
    - *Roles of the three packages*
      - `@acme/page-builder-core` should own **schemas and registries**, not UI:
        - A `TemplateDescriptor` type that describes page/section templates:
          ```ts
          type TemplateKind = "page" | "section" | "slot-fragment";
          interface TemplateDescriptor {
            id: string;            // stable identifier
            version: string;       // semver string
            kind: TemplateKind;
            label: string;
            description?: string;
            category: "Hero" | "Features" | "Commerce" | "Legal" | "System";
            pageType?: "marketing" | "legal" | "fragment"; // where it’s valid
            slots?: string[];      // for slot fragments (e.g. ["checkoutSidebar"])
            build: (ctx: { shopId: string }) => PageComponent[]; // or Page for page-templates
          }
          ```
        - A simple registry API:
          - `registerTemplates(descriptors: TemplateDescriptor[])`.
          - `listTemplates(filters)` / `getTemplate(id, version?)`.
          - `scaffoldPage({ templateId, locale, shopId })` → `Page`.
      - `@acme/page-builder-ui` should expose **editor‑level primitives** for templates:
        - “New page from template” flows that call `listTemplates` + `scaffoldPage`.
        - Palette/Library UI that treats templates/presets as first‑class items.
        - A common modal for inserting **section templates** (built‑in sections, library items, remote presets) regardless of origin.
      - `@acme/templates` should host the **curated, versioned template catalog**:
        - Built‑in page templates (e.g. hero‑heavy home variants, simple landing page, legal page skeleton).
        - Built‑in section templates (what is currently under `builtInSections.data.ts` and `presets.data.ts`).
        - Commerce‑oriented templates (PLP hero sections, featured product rails, cart/checkout trust strips) backed by platform‑core block types.
        - These are exported as `TemplateDescriptor[]` and registered via `page-builder-core`.
    - *Unifying presets, library, and templates*
      - Today we have:
        - Built‑in section templates in `builtInSections.data.ts`.
        - Editor presets in `presets.data.ts`.
        - A per‑shop/user library (`/cms/api/library?shop=<id>`) and optional remote presets feed (`NEXT_PUBLIC_PAGEBUILDER_PRESETS_URL`) that return bare `PageComponent` trees.
      - Best‑bet is to normalise everything onto a single **template/preset vocabulary**:
        - Built‑ins from `@acme/templates` → registered at boot, tagged as `origin: "core"`.
        - Remote presets → parsed into `TemplateDescriptor` structures with `origin: "remote"` and a source URL/version.
        - Library items → stored as lightweight template descriptors with `origin: "library"`, `shopId`, `createdBy`, and no hard versioning (they are user content).
      - The Page Builder UI doesn’t need to care where a template came from; it just:
        - Fetches descriptors via a unified API.
        - Shows them in “Templates”, “My Library”, or “Remote presets” tabs.
        - Applies them by calling `build`/`scaffoldPage`.
    - *Copy‑on‑use vs live templates*
      - For v1, templates/prefabs should be **copy‑on‑use**, not live‑linked:
        - Applying a page or section template inserts a copy of its `PageComponent[]` tree into the current page.
        - Subsequent changes to the template definition do **not** mutate existing pages; they only affect new pages/sections created from that template.
        - This matches current behaviour for presets and library items and avoids surprising merchants when templates evolve.
      - We may still want to track provenance:
        - Optionally record `originTemplateId` and `originTemplateVersion` in page metadata (or `history.editor`) so we can later answer “which pages were seeded from template X v1.2?”.
        - That provenance is for reporting and targeted migrations, not for automatic live updates.
    - *Versioning and evolution*
      - Template evolution can be handled with **semver and additive behaviour**:
        - Non‑breaking tweaks (copy, spacing, non‑required props) can bump a minor version and overwrite the descriptor in `@acme/templates`; new pages will use the latest version.
        - Breaking changes (structural changes, removal of blocks/props) should create a **new template id** or at least a new major version that co‑exists with the old one, so existing pages are unaffected.
      - For pages already created from older templates:
        - We rely primarily on **block schema migrations** (see the next “Schema evolution & block versioning” section) to keep content valid when block props change.
        - Any structural migrations (e.g. “wrap these components in a new Section”) should be explicit tools:
          - A CLI or CMS action that:
            - Finds pages with `originTemplateId/version` and
            - Applies a content transform under operator control, with preview/rollback.
        - We do not auto‑rewrite pages on template edits in v1.
    - *How this ties into createShop / scaffolding*
      - `createShop` and any “new shop from template” flows in CMS should:
        - Use a small set of **shop‑level scaffold templates** (e.g. base home page, example PLP, example PDP‑adjacent pages) defined in `@acme/templates` and described by `ScaffoldSpec` and `TemplateDescriptor`.
        - Call a canonical `scaffoldPage({ templateId, locale, shopId })` from `page-builder-core` to materialise initial `Page` records.
      - This keeps “initial content generation” and “per‑page templates/presets” on the same underlying machinery, and makes it easier to:
        - Upgrade scaffolds over time (new shops pick up new templates; existing shops keep what they already have).
        - Offer a consistent “Start from template” experience whether you’re creating a shop or just adding a new page.
- **Schema evolution & block versioning**
  - How do we version and migrate `PageComponent` schemas themselves (not just templates), so that block type changes do not break existing content?
  - Do we need a per‑block version and a migration pipeline that runs on load/save to normalise older block payloads?
- **History & UX integration**
  - What retention policy and inspection tooling do we need for `pages.history.jsonl` diff logs?
  - How should history be surfaced to non‑technical users (compare, review, rollback) as part of everyday CMS workflows?
- **SEO, SSR, performance**
  - How does `DynamicRenderer` interact with SSR/streaming, and what patterns should we encourage/avoid to protect LCP/CLS on highly composed pages?
  - How should Page Builder–authored SEO metadata map onto Next 15 metadata APIs for dynamic routes, especially for core commerce pages?
- **Accessibility & guardrails**
  - What accessibility requirements (semantics, keyboard navigation, focus management, ARIA) should blocks adhere to, and where should we enforce them (linting, visual checks, CMS validation)?
  - How do we prevent authors from composing pages that are visually attractive but inaccessible (e.g., contrast, heading structure)?
- **Extensibility / third‑party blocks**
  - How can internal/external teams introduce new blocks or templates safely (namespacing, review processes, constraints on props/layout)?
  - Do we want a formal plugin model for blocks/templates, or a curated “core only” set for now, and how would that decision affect multi‑shop safety?

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
  - When and where are orders created in relation to Stripe checkout sessions and webhooks, including returns, exchanges, and any partial/multi-shipment flows?
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
- **Shipping & tax integrations**
  - How do carrier/shipping methods and tax services plug in (globally vs per shop), and which parts should be configurable from the CMS?
  - How do changes to shipping/tax configuration surface in the checkout UX (available methods, prices, validation messages) without code edits?
- **Customer identity model**
  - What is the relationship between carts, orders, and customers (guest vs logged‑in), and how should carts be merged or preserved on login?
  - Which flows must work for guests, and which require authenticated customers (e.g., subscription management, saved payment methods, order history)?
- **Test strategy for money flows**
  - What automated tests (unit/integration/E2E) are required to treat prices, taxes, discounts, and refunds as “safety‑critical”, especially around Stripe webhooks?
  - Which invariants (e.g., totals matching Stripe, no negative totals, idempotent webhook handling) must be covered by tests before changes ship?

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
- **Per-app preview correctness**
  - How do we guarantee that preview uses the same block registry, layout, and theming as each tenant app (especially once apps diverge from the template app)?
  - Do we need an explicit “preview adapter” contract that each app implements to integrate CMS-driven preview cleanly?
- **Unsupported blocks / graceful degradation**
  - What should happen if a CMS page uses a block type that a given runtime app does not support (build-time error, runtime warning, CMS validation)?
  - How should we surface unsupported/mismatched blocks back to CMS users so they can fix or avoid them?
- **Search & discovery**
  - How should CMS pages and product content participate in site search (indexing strategy, search provider), and how are indexes kept up to date when CMS content changes?
  - How should search result routes be wired relative to CMS routes so that search and CMS navigation remain consistent?

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
- **Audit trail & activity history**
  - Do we need a human-readable audit log (who changed what, when) for pages, settings, products, and shops, and how should it be stored?
  - Where should such an audit log be surfaced (per shop, global admin view, or both)?
- **Concurrency & conflicts beyond pages**
  - How should we handle concurrent edits to shop settings or products (last-write-wins vs explicit conflict detection/resolution UI)?
  - Are there particular areas where we must avoid silent overwrites (e.g., tax settings, inventory)?
- **CMS internationalisation**
  - Do we need the CMS UI itself localized for non-English operators, and if so, which locales and flows are highest priority?
  - What is the plan for maintaining CMS i18n (strings, message catalogs) in step with product changes?

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
- **API contracts & public surfaces**
  - What are the formal public APIs of `@acme/platform-core`, `@acme/ui`, Page Builder packages, and key runtime endpoints (`/api/cart`, `/api/checkout-session`, `/preview/:pageId`), and how do we document and enforce them (contract tests, semver, docs)?
- **Versioning & breaking changes**
  - How do we manage breaking changes in `platform-core` or `ui` with multiple tenant apps live on different timelines?
  - How should `componentVersions` and `lastUpgrade` in `shop.json` be used to coordinate upgrades and detect incompatible changes?
  - What release / rollout strategy (branching model, feature flags, canary or pilot shops) do we want for platform and UI changes that affect multiple live tenant apps?
- **Local dev & data seeding**
  - How easy is it today to spin up a realistic shop locally (products, pages, orders), and what scripts/fixtures do we need to make that trivial?
  - Do we need standard “sample shops” for QA/regression testing of prefabs and flows?
- **Observability**
  - What logging/metrics/tracing conventions should we use (tagging by shop ID) for critical flows like createShop, publish, upgrade, checkout?
  - How should developers instrument new features so production issues can be quickly attributed to specific shops, versions, or flows?
- **Third‑party / plugin developer experience**
  - Do we anticipate external integrators building on this platform, and if so, what guarantees and tooling do they need (SDKs, examples, sandbox shops, test data)?
- **DX metrics & pain points**
  - What are the current DX bottlenecks (cold-start times, rebuild times, debugging cross-package issues), and how will we measure improvement?
  - Which core workflows (e.g., adding a block, spinning up a new shop, running tests) should we prioritise for DX investment?
