Type: Research
Status: Historical
Domain: CMS
Last-reviewed: 2025-12-02
Superseded-by: docs/cms/cms-charter.md, docs/cms-plan/index.md, docs/cms/configurator-contract.md, docs/cms/build-shop-guide.md

# CMS & Shop Platform — Research Log

This document is a living log for understanding and improving the CMS and shop platform so we can launch new shops quickly, with consistent quality, and with all revisions flowing through the CMS (not ad‑hoc app edits).

## How to use this doc now

- Treat this file as a **historical research log**, not as a canonical source of current behaviour.
- For up-to-date objectives and invariants, prefer:
  - `docs/cms/cms-charter.md` (CMS goals and core flows),
  - `docs/cms/configurator-contract.md` (configurator, checks, launch),
  - `docs/cms/build-shop-guide.md` (build & style a shop),
  - `docs/cms-plan/index.md` and related `thread-*.md` files (active plans).
- Each section below roughly maps 1:1 to a CMS plan thread; use this file for background context and rationale when refining those plans or charters.

Each section captures:

- **Goals** – what we want this area to enable.
- **Questions** – concrete topics to research or validate.
- **Findings** – what we have confirmed in code so far.

### Target outcomes & constraints

- Time from “start configurator” to first live shop should be ≤ 30 minutes for a non‑technical user, assuming required external accounts (e.g. Stripe) already exist.
- CMS‑authored changes (pages, settings, theme) should appear live on all configured runtimes within ≤ 60 seconds of publish, without manual restarts.
- Any **platform‑compatible** tenant app (one that implements the documented contracts for providers, routes, env vars, preview hooks, and cart/checkout APIs) should be able to use prefabricated cart/checkout/header blocks with zero app-specific code changes; heavily forked or legacy apps may require convergence work before this guarantee applies.

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
  - How `packages/template-app` is used as the base runtime vs tenant apps (`apps/skylar`, `apps/cover-me-pretty`) and the `apps/storefront` contract manifest (which is a convergence harness, not a deployed runtime).

- **Environment & multi‑tenant concerns**
  - How a specific shop is selected at runtime (e.g. `NEXT_PUBLIC_SHOP_ID`, repo config).
  - How staging vs production is represented (if at all) and whether CMS supports multiple environments per shop.

### Findings

Architecture decisions and invariants in this section now drive the CMS execution plan:

- `docs/cms-plan/master-thread.md` uses the Phase 1 `ARCH-*` items to order architecture and persistence work.
- `docs/cms-plan/thread-a-architecture.md` operationalises §1 of this document into concrete tasks and should be treated as the backlog for architecture/tenancy/source-of-truth changes.

When these decisions change, update this section and `thread-a-architecture.md` first, then adjust the master thread accordingly.

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
    - Calls `getShopById` (which itself resolves Prisma vs JSON via `resolveRepo`), then normalizes theme fields via `applyThemeData`.
    - If that read fails it returns a minimal in‑memory `Shop` (using `defaultFilterMappings` and base theme tokens); there is no additional manual Prisma or filesystem fallback path beyond whatever backend `getShopById` selected.
  - **Shop settings** (languages, tax region, analytics config, returns, etc.) are stored separately via `Settings` repositories:
    - `packages/platform-core/src/repositories/settings.server.ts` provides `getShopSettings` / `saveShopSettings` and diff history.
    - It resolves to either Prisma (`settings.prisma.server.ts`) or JSON (`settings.json.server.ts`) via `SETTINGS_BACKEND`.
  - Filesystem mirrors:
    - `createShop` writes a copy of `shop.json` under `data/shops/<id>/shop.json` via `ensureDir` + `writeJSON` (`packages/platform-core/src/createShop/createShop.ts`).
    - `DATA_ROOT` is resolved by walking up from `cwd` looking for a `data/shops` directory, or overridden via the `DATA_ROOT` env var.

- **Create/deploy/upgrade pipeline**
  - **Creating a shop (CMS → platform-core)**:
    - CMS exposes `POST /cms/api/create-shop` at `apps/cms/src/app/api/create-shop/route.ts`.
    - The route validates `{ id, ...ShopConfig }` with `shopConfigSchema` from `@acme/types`, then calls the server action `createNewShop` in `apps/cms/src/actions/createShop.server.ts`.
    - `createNewShop` verifies authorization (`ensureAuthorized`), then invokes `createShopFromConfig(id, config, { deploy: false })` from `@acme/platform-core/createShop`, which parses the config, maps it to `CreateShopOptions`, and delegates to the underlying `createShop` helper without deploying.
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
  - **Creation status surfaces**:
    - `@acme/platform-core/createShop` writes a per‑shop `ShopCreationState` record to `data/shops/<id>/creation.json` whenever `createShopFromConfig` runs, capturing `status`, `env`, timestamps, and the last error (if any).
    - CMS reads this state via `readShopCreationState` and exposes it through:
      - `GET /cms/api/shop-creation-state/[shop]` (`apps/cms/src/app/api/shop-creation-state/[shop]/route.ts`), which returns the structured `ShopCreationState` for admins and ShopAdmins, and
      - A `CreationStatus` card on the per‑shop dashboard (`apps/cms/src/app/cms/shop/[shop]/CreationStatus.tsx`) that surfaces creation status and the last error inline.

  - **Environment & multi‑tenant behaviour**
  - **Shop selection in runtime apps**:
    - Most runtime code reads a **single active shop ID** from `NEXT_PUBLIC_SHOP_ID` (or similar) via `coreEnv`:
      - Example: `packages/template-app/src/app/AnalyticsScripts.tsx` uses `(coreEnv.NEXT_PUBLIC_SHOP_ID || "default")` to load shop settings and analytics config.
      - Preview routes like `packages/template-app/src/routes/preview/[pageId].ts` and `apps/cover-me-pretty/src/routes/preview/[pageId].ts` fallback to `"default"` or `"shop"` when the env is unset.
      - Sitemaps in both template app and `cover-me-pretty` (`app/sitemap.ts`) call `loadCoreEnv()` and choose `shop = NEXT_PUBLIC_SHOP_ID || "shop"`.
    - `apps/cover-me-pretty` also embeds a `shop.json` at build time and imports it in `[lang]/layout.tsx` to resolve SEO and theme tokens for that specific shop.
  - **CMS view of shops**:
    - Today, CMS lists shops by scanning the filesystem under `DATA_ROOT` using `apps/cms/src/lib/listShops.ts` (simple `fs.readdir` of `resolveDataRoot()`), not by querying Prisma directly.
    - The `/cms/api/shops` route (`apps/cms/src/app/api/shops/route.ts`) currently calls a separate `listShops` implementation from `apps/cms/src/lib/listShops`, so the CMS “shop chooser” effectively operates on the directories under `data/shops`.
    - Platform repositories (`shops.server.ts`, `settings.server.ts`, `pages/index.server.ts`) can use either Prisma or JSON according to `*_BACKEND` variables and `DATABASE_URL` (see `docs/persistence.md`).
    - This filesystem‑driven discovery is acceptable in local JSON/dev mode, but the **best‑bet direction** is to move CMS lists and configurator flows in shared environments to:
      - Query `Shop` via `@acme/platform-core/repositories/shops.server` as the primary registry, and
      - Optionally enrich those rows with “has app scaffold” / “has deploy.json” by checking `data/shops/<id>` and `apps/shop-<id>`.
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

- **Source of truth semantics (resolved in code/docs)**
  - Answered by `docs/persistence.md` and the shared `repoResolver` in `packages/platform-core/src/repositories/repoResolver.ts`:
    - `SHOP_BACKEND` / `SETTINGS_BACKEND` (or `DB_MODE`) select **exactly one backend per process** (`"prisma"` or `"json"`); there is no runtime DB→JSON fallback once a backend is chosen.
    - In shared environments where these resolve to `"prisma"`, Prisma/Postgres is the **canonical source of business state** for `Shop` and `ShopSettings`; JSON under `data/shops/<id>` is treated as a mirror/seed only.
    - Operational metadata (`status`, `componentVersions`, `lastUpgrade`, deploy/upgrade history, audit logs) is canonical under `data/shops/<id>` and manipulated by upgrade/deploy tooling.
    - In `json` mode (or when `DB_MODE="json"`), repositories use JSON under `DATA_ROOT` as their sole source of truth for both business and operational data; Prisma is not consulted.
  - Remaining gaps:
    - Ensure all shop/settings read paths in apps and CMS avoid ad‑hoc filesystem reads in DB mode and instead rely on the repositories configured via `*_BACKEND`/`DB_MODE`.

- **Platform vs tenant responsibilities (codified)**
  - Answered by `docs/platform-vs-apps.md` plus package `exports` maps:
    - Platform‑core owns domain models, persistence, and lifecycle flows; tenant apps own routing, branding, and composition and may only import documented public surfaces (for example `@acme/platform-core/repositories/*.server`, `@acme/platform-core/cart*`, `@acme/ui`).
    - Deep imports into `src/internal/**`, `*.prisma.server.ts`, `*.json.server.ts`, or `@acme/*/src/**` are explicitly treated as internal and are being phased out.
  - Remaining gaps:
    - Continue migrating any remaining deep imports in apps/CMS to the documented public entrypoints and enforce this via lint where appropriate.
- **Tenancy & environments (direction chosen; partially implemented)**
  - Direction and current behaviour are described below; see also `docs/architecture.md` and `docs/deployment-adapters.md`.
  - Remaining gaps:
    - Evolve CMS `listShops` and related flows in shared environments to query `@acme/platform-core/repositories/shops.server` as the primary registry and treat filesystem scanning as JSON‑mode/dev‑only behaviour.
  - **Details:**
    - *Shop registry (prod/stage vs local JSON mode)*
      - In shared and production environments, the **`Shop` table is the canonical registry** of which shops exist:
        - CMS lists, configurator flows, and health views should ultimately query shops via `@acme/platform-core/repositories/shops.server` (`getShops`, `getShopById`).
        - `data/shops/<id>` and `apps/shop-<id>` are **derived artefacts** (deployments, upgrades, exports); they do not themselves define whether a shop “exists”.
      - In local/offline JSON mode (`DATABASE_URL` unset and `SHOP_BACKEND=json`):
        - CMS may fall back to filesystem‑driven discovery (scanning `DATA_ROOT` for `data/shops/<id>` and `apps/shop-<id>`), since there is no DB‑backed registry.
        - This behaviour is explicitly scoped to JSON‑only dev/demo environments and is not used in prod/stage.
      - Current reality:
        - `/cms/api/shops` and `/cms/live` today implement shop discovery by scanning `DATA_ROOT` and `apps/shop-<id>`.
        - Best‑bet is to treat this as a transitional implementation and evolve `listShops()` to:
          - Use Prisma `Shop` as the primary source of shops in shared environments, and
          - Optionally enrich rows with “has app scaffold” / “has deploy.json” by checking the filesystem.
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
  - **Details:**
    - *Idempotency and repeatability*
      - We treat `createShop`, `createShopFromConfig`, `deployShop`, and the CLI upgrade tools as **per‑shop flows**, but with different guarantees:
        - `createShop(id, opts)` (`packages/platform-core/src/createShop/createShop.ts`):
          - Writes a `Shop` row to Prisma and `data/shops/<id>/shop.json`, seeds `Page` rows, and finally calls `deployShop`.
          - Given the same `(id, opts)` and the same template version, `createShop` is **deterministic across environments** (dev/stage/prod), producing the same basic shop shape with no hidden randomness and does not attempt to reconcile or merge existing shops.
        - `deployShopImpl` (`packages/platform-core/src/createShop/deploy.ts`):
          - Scaffolds `apps/<id>`, patches `.env` with a generated `SESSION_SECRET`, calls the deployment adapter, and writes `deploy.json` via `writeDeployInfo`.
          - It is **effectively idempotent per shop and build**: re‑running for the same shop just re‑scaffolds and redeploys that build; `.env` updates are overwriting but bounded, and `deploy.json` is treated as “last known deployment status” for that shop (we can extend it with explicit version/timestamp fields over time).
        - `upgrade-shop.ts`, `republish-shop.ts`, and `rollback-shop.ts` (`scripts/src/*`):
          - `upgrade-shop <shop>` copies from `packages/template-app` into `apps/<shop>`, backing up any overwritten files with `.bak`, updates `shop.json.lastUpgrade` and `shop.json.componentVersions` based on the shop’s `package.json`, writes `upgrade-changes.json` (changed components and affected page IDs), and writes `data/shops/<id>/upgrade.json` with component version metadata; `--rollback` restores `.bak` files and removes `lastUpgrade`/`componentVersions` from `shop.json`.
          - `republish-shop <shop>` reads `upgrade.json` if present, snapshots the current `componentVersions`/`lastUpgrade` into `history.json`, builds and deploys `apps/<shop>`, updates `shop.json.status` to `"published"` and refreshes `componentVersions` from `package.json`, removes `upgrade.json`, `upgrade-changes.json`, and `.bak` files, and appends an entry to `audit.log`.
          - `rollback-shop <shop>` uses `history.json` to restore the previous `componentVersions`/`lastUpgrade` into `shop.json`, rewrites `apps/<shop>/package.json` dependencies to match, runs `pnpm ... install/build/deploy`, and updates `shop.json.status` back to `"published"`.
      - For v1, the mental model is:
        - The higher‑level `createShopFromConfig` flow is **idempotent but non‑convergent** per `(shopId, env)`: in non‑production environments, if a `Shop(id)` row already exists it records a `"created"` `ShopCreationState` in `data/shops/<id>/creation.json` and returns without re‑seeding or mutating the shop; in production it fails fast when a duplicate is detected.
        - The underlying `createShop` helper remains a create‑only operation invoked by `createShopFromConfig` and does not attempt to merge or reconcile existing shops.
        - `deployShop`, `upgrade-shop`, `republish-shop`, and `rollback-shop` are **safe to re‑run** for the same shop (and build/version) as “make reality match the current desired state” operations.
    - *Per‑shop rollout/rollback story*
      - In a given environment, the intended lifecycle for a shop is, with a clear split between business data in Prisma and operational metadata under `data/shops/<id>`:
        - **Create** – CMS (or CLI) calls `createShop` to seed Prisma + `data/shops/<id>` and optionally deploy an initial app via `deployShop`, which writes `deploy.json` (adapter `status`, `previewUrl`, and any human‑readable `instructions`).
        - **Upgrade & preview** – when template/UI packages change, `upgrade-shop <shop>` stages updated components into `apps/<shop>`, records `lastUpgrade` and `componentVersions` in `shop.json`, writes `upgrade.json` with component version metadata and `upgrade-changes.json` with changed components and affected pages, and ensures `UPGRADE_PREVIEW_TOKEN_SECRET` exists in `.env` so `/upgrade-preview` can render staged components.
        - **Republish** – after manual review, `republish-shop <shop>` builds and deploys `apps/<shop>`, updates `shop.json.status` to `"published"`, snapshots the previous `componentVersions`/`lastUpgrade` into `history.json`, cleans up `.bak`, `upgrade.json`, and `upgrade-changes.json`, and appends an entry to `audit.log`.
        - **Rollback (pre‑publish)** – if a staged upgrade is not acceptable *before* republish, `upgrade-shop <shop> --rollback` restores `.bak` files in `apps/<shop>`/`data/shops/<id>`, removes `lastUpgrade`/`componentVersions` from `shop.json`, and leaves the last published deployment intact.
        - **Rollback (post‑publish)** – if a published upgrade needs to be undone, `rollback-shop <shop>` restores the previous entry from `history.json`, rewrites `shop.json.componentVersions`/`lastUpgrade` and the app’s `package.json` dependencies, redeploys, and updates `shop.json.status`.
      - CMS should treat these CLI flows as canonical and surface them as explicit actions for each shop (for example, “Stage upgrade”, “Preview upgrade”, “Republish”, “Rollback staged”, “Rollback to previous version”), backed by the operational state in `data/shops/<id>` (`shop.json.status`, `shop.json.componentVersions`, `shop.json.lastUpgrade`, `upgrade.json`, `history.json`, `deploy.json`, `audit.log`), rather than inventing separate mechanisms.
    - *Customisations vs template evolution*
      - `upgrade-shop` is explicitly **template‑centric**: it copies from `packages/template-app` into the shop app and uses `.bak` files plus checksums to detect changes; it does not perform semantic three‑way merges with tenant‑level custom code.
      - For template‑driven shops (those created from the template and kept in sync):
        - Code customisation should not live under `apps/<shopId>`; instead, shops rely on shared components from `packages/ui`/`template-app` plus CMS‑managed content and `ShopSettings`.
        - `shop.json.componentVersions` and `shop.json.lastUpgrade` are **owned by the upgrade tooling** (`upgrade-shop`, `republish-shop`, `rollback-shop`) and should not be mutated by CMS actions; that keeps “template version” state separate from content.
      - For heavily customised brand apps (e.g. `apps/skylar` or bespoke forks):
        - They may still consume shared packages (`@acme/ui`, `@acme/platform-core`), but they are treated as **forks**, not as template‑driven, platform‑compatible shops.
        - Generic `upgrade-shop <shop>` may still be useful as a diff helper, but upgrades are essentially manual work guided by `upgrade-changes.json` and should not be assumed to be safe or automatic; prefab cart/checkout/header blocks are opt‑in and only supported where the app explicitly meets the canonical contracts described later.
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
  - **Details:**
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
  - **Details:**
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
  - **Details:**
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

- Page Builder decisions here now feed directly into the CMS plan:
  - `docs/cms-plan/master-thread.md` uses the Phase 2 `PB-*` items to sequence Page Builder/schema/template work.
  - `docs/cms-plan/thread-b-page-builder.md` operationalises §2 of this document into concrete PB tasks and should be treated as the backlog for Page Builder, block registry, and template changes.

When these decisions change, update this section and `thread-b-page-builder.md` first, then adjust the master thread accordingly.

- **Page entity & history model**
  - Pages are typed via `pageSchema` (defined in `@acme/types` and re‑exported from `@acme/page-builder-core`):
    - Fields include `id`, `slug`, `status: "draft" | "published"`, optional `visibility: "public" | "hidden"`, `components: PageComponent[]`, `seo` (per-locale `title`/`description`/`image` + optional `noindex`), `createdAt`, `updatedAt`, `createdBy`, and optional `history?: HistoryState`.
  - CMS page actions (`apps/cms/src/actions/pages/*.ts`) implement CRUD:
    - `createPage` constructs a new `Page` with `components` from the form, localized SEO (`mapLocales`), timestamps, and `createdBy` from the session, then delegates to `savePage`.
    - `updatePage` parses a serialized `history` value, builds a patch `{ id, updatedAt, slug, status, components, seo, history }`, finds the previous page, and calls `updatePageInService`; it has a single conflict-resolution retry when the backend reports `"Conflict: page has been modified"`.
    - `deletePage` enforces auth and calls `deletePageFromService`.
  - Persistence and revision history are handled in `packages/platform-core/src/repositories/pages`, using shared helpers from `@acme/page-builder-core`:
    - `index.server.ts` routes calls to either `pages.prisma.server.ts` or `pages.json.server.ts` via `resolveRepo` and `PAGES_BACKEND`.
    - Both backends maintain a **diff history** per shop in `pages.history.jsonl` under `<DATA_ROOT>/<shop>`:
      - Each save/update appends `{ timestamp, diff }`, where `diff` is the field-wise difference between `previous` and `page` computed by `diffPage` from `@acme/page-builder-core`.
      - `diffHistory(shop)` reads and validates this log via `parsePageDiffHistory` (also from `@acme/page-builder-core`), exposing a list of `PageDiffEntry` for potential history/replay features.
    - The JSON backend enforces optimistic concurrency by comparing `previous.updatedAt` with `patch.updatedAt` and throwing on mismatch.

- **Editor metadata & runtime behaviour**
  - Editor-only metadata lives inside `history.editor` (see `docs/page-builder-metadata.md` and the shared `HistoryState`/`EditorFlags` types in `@acme/page-builder-core`):
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
      - Injects product data from `@acme/platform-core/products` into `ProductGrid` when the CMS block type is `ProductGrid`, wiring static structure to catalog data.

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
    - `packages/page-builder-core` exposes page schemas, history/diff helpers, export helpers, and shared block/template contracts (re‑exported from `@acme/types` and internal helpers) that are used by CMS and runtime apps.
    - `packages/templates` exports curated template catalog arrays (e.g. `corePageTemplates`, `homePageTemplates`, `shopPageTemplates`, `productPageTemplates`, `checkoutPageTemplates`) used by CMS/configurator flows.
    - `packages/page-builder-ui` currently exports only a `version` string and remains a placeholder for a future shared editor UI surface; React editor components still live in `packages/ui` and CMS code.

Overall, the Page Builder already covers:

- A strongly-typed page model with stored history/diffs.
- A shared editor with a rich block palette and per-block editors.
- A runtime renderer that reuses the same `PageComponent` tree to render into tenant apps.

The main gaps for our “prefab shop” goal are:

- Turning the stub `page-builder-core/ui/templates` packages into real public surfaces, so prefabs and templates can be shared and versioned cleanly across shops.
- Tightening the contract between commerce-oriented blocks (e.g. `ProductGrid`, cart/checkout sections, account sections) and platform APIs so these blocks can be dropped into any **platform‑compatible** shop from CMS with minimal wiring (see cart/checkout contract section for what “compatible” means).

### Open questions / gaps

- **Coverage of commerce‑critical page types (direction chosen; implementation incremental)**
  - For PLP (“shop” page), PDP, account (profile, orders, addresses), cart, checkout, legal pages, search, etc., which are:
    - Fully Page Builder–driven,
    - Implemented as fixed templates/routes, or
    - Not yet supported?
  - Which additional primitives are needed (login/register, subscription management, richer PLP filters, search results, etc.) to support real shops?
  - **Details:**
    - *Current coverage (template app + cover‑me‑pretty)*
      - **Home / marketing landing**:
        - `apps/cover-me-pretty/src/app/[lang]/page.tsx` loads `PageComponent[]` from `data/shops/<shopId>/pages/home.json` and renders them via `DynamicRenderer` in `page.client.tsx`, optionally prefixed with a blog teaser. This is effectively a **Page Builder–driven home page** with a small amount of app‑specific decoration.
      - **PLP (“shop” listing)**:
        - `/[lang]/shop` routes in template app and `cover-me-pretty` are **code‑driven PLPs** (`ShopClient` components) over `PRODUCTS`, with built‑in search and filters based on URL query params. They do not currently consume Page Builder pages; customization is via code and theme, not CMS blocks.
      - **PDP (product details)**:
        - `/[lang]/product/[slug]` is a fixed route that fetches products via `@acme/platform-core/products` and renders `PdpClient` plus some extra components (e.g. `CleaningInfo`), with SEO handled via `generateMetadata`. PDP is not Page Builder–driven today.
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
      - Current state:
        - Template and tenant apps still follow the “current coverage” described above (system PLP/PDP/checkout/account routes; PB‑driven home; no dedicated `/cart` route; no generic `/[lang]/pages/[slug]` route yet).
        - `@acme/templates` now exposes `corePageTemplates` (including home/shop/product/checkout shells), but these are not yet wired into a canonical CMS page routing scheme in the runtime apps.
      - Best‑bet split:
        - System pages keep **explicit Next routes** (e.g. `/[lang]/shop`, `/[lang]/product/[slug]`, `/[lang]/checkout`, `/account/*`, `/[lang]/returns`), with:
          - Strong, versioned templates in `@acme/ui`/`template-app` for critical flows (PLP grid, PDP layout, checkout steps, account views).
          - Limited, well‑defined extension points where Page Builder–authored sections can be injected (e.g. marketing bands above/below PLP grid, upsell sections on PDP, trust badges on checkout).
        - Marketing/editorial pages are **fully Page Builder–driven** (`PageComponent[]` trees rendered via `DynamicRenderer`), with:
          - A dedicated CMS page type (e.g. “Marketing Page”) and a generic `[lang]/pages/[slug]` route in future, built on the existing `Page` + `DynamicRenderer` primitives.
      - For commerce‑critical types, a pragmatic v1 plan is:
        - **PLP** – keep `/[lang]/shop` as a system route backed by `@acme/platform-core/products`, but:
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

- **Page-type model & constraints (still design-only)**
  - Current state in code/docs:
    - No `pageType` field or central `pageTypes` configuration is implemented yet; existing routes treat core commerce pages as explicit system routes and PB-driven marketing/legal pages as a separate concern only in docs.
  - Remaining gaps:
    - Introduce a `pageType` field and central config, and wire palette/publish-time validation to it, as described below.
  - Do we need an explicit “page type” on `Page` (Home, PDP, Checkout, Account, Marketing) with:
    - Allowed and required blocks per type,
    - Stronger rules for system pages vs marketing pages?
  - How should these constraints be enforced in the editor (validation) and at save/publish time?
  - **Details:**
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
- **Localization lifecycle (partially codified)**
  - Current state in code/docs:
    - `@acme/i18n` and `@acme/types` define `Locale`, `LOCALES`, and helpers such as `fillLocales`, `mapLocales`, and `resolveLocale`; page and SEO structures already use per‑locale records for titles/descriptions/images, as documented earlier and in `docs/page-builder-metadata.md`.
  - Remaining gaps:
    - A concrete `pageLocaleStatus` helper and UX around “publish‑ready per locale” remain design-only.
  - **Details:**
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
          - Labels like “Add to cart”, “Checkout”, “Sign in” remain **translation‑key driven** (e.g. `t("checkout.addToCart")`), never CMS text fields; their placement is constrained to system routes/slots as described in the page‑type/guardrail section.
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
- **Templates/prefabs and evolution (API codified; evolution still open)**
  - Current state in code/docs:
    - `@acme/page-builder-core` now exposes `TemplateDescriptor`, `ScaffoldContext`, and helpers like `scaffoldPageFromTemplate` and `cloneTemplateComponents` (`packages/page-builder-core/src/index.ts`).
    - `@acme/templates` exports curated template catalog arrays such as `corePageTemplates`, `homePageTemplates`, `shopPageTemplates`, `productPageTemplates`, and `checkoutPageTemplates` (`packages/templates/src/corePageTemplates.ts`), which are used by CMS/configurator flows.
  - Remaining gaps:
    - Version provenance on pages (e.g. `originTemplateId`/`originTemplateVersion`) and any migration tooling are still conceptual; the “Versioning and evolution” notes below are not yet fully implemented end‑to‑end.
  - **Details:**
    - *Roles of the three packages*
      - `@acme/page-builder-core` should own **schemas and registries**, not UI:
        - A `TemplateDescriptor` type that describes page/section templates in a mostly declarative way:
          ```ts
          type TemplateKind = "page" | "section" | "slot-fragment";
          interface TemplateDescriptor {
            id: string;            // stable identifier
            version: string;       // semver string (primarily informational)
            kind: TemplateKind;
            label: string;
            description?: string;
            category: "Hero" | "Features" | "Commerce" | "Legal" | "System";
            pageType?: "marketing" | "legal" | "fragment"; // where it’s valid
            slots?: string[];      // for slot fragments (e.g. ["checkoutSidebar"])
            // Core content as a raw tree, no shop/locale baked in
            components: PageComponent[];
            origin?: "core" | "remote" | "library";
          }

          interface ScaffoldContext {
            shopId: string;
            locale: Locale;
            primaryLocale: Locale;
          }

          function scaffoldPageFromTemplate(
            descriptor: TemplateDescriptor,
            ctx: ScaffoldContext
          ): Page { /* clone + apply locale/shop defaults + add seo/slug/origin */ }
          }
          ```
        - A simple registry API:
          - `registerTemplates(descriptors: TemplateDescriptor[])`.
          - `listTemplates(filters)` / `getTemplate(id, version?)`.
          - `scaffoldPageFromTemplate(descriptor, ctx)` and a convenience `scaffoldPage({ templateId, locale, shopId })` → `Page`.
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
      - For core, remote, and library templates, “build” semantics are deliberately simple:
        - Applying a template or preset means cloning its `components: PageComponent[]` tree and then:
          - Applying `fillLocales` against the shop’s `primaryLocale`, and
          - Optionally patching obvious fields like shop name if the template expects it.
        - There are no side effects beyond producing a new `Page`/section tree.
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
      - Template evolution should be **additive and id‑stable for compatible changes**:
        - Non‑breaking tweaks (copy, spacing, non‑required props) can bump the descriptor’s `version` in place; new pages will use the latest version.
        - Breaking changes (structural changes, removal/renaming of blocks/props) should create a **new template id**, full stop. Semver remains useful for humans (`home-hero-a@2.0.0`), but engineers should not reuse ids for incompatible shapes.
      - For pages already created from older templates:
        - We rely primarily on **block schema migrations** (see the next “Schema evolution & block versioning” section) to keep content valid when block props change.
        - Any structural migrations (e.g. “wrap these components in a new Section”) should be explicit tools:
          - A CLI or CMS action that:
            - Finds pages whose `origin.templateId` matches a given id, and optionally
            - Applies a content transform under operator control, with preview/rollback.
        - We do not auto‑rewrite pages on template edits in v1.
      - Provenance should have a single, well‑defined home on the page:
        - Extend `Page` with an optional `origin` field, for example:
          ```ts
          type PageOrigin = {
            templateId?: string;
            templateVersion?: string;
            originKind?: "core" | "remote" | "library";
          };

          interface Page {
            // ...
            origin?: PageOrigin;
          }
          ```
        - `scaffoldPageFromTemplate` is responsible for populating `origin` when a page is created from a template; migrations can then target `page.origin.templateId` directly.
    - *How this ties into createShop / scaffolding*
      - `createShop` and any “new shop from template” flows in CMS should:
        - Use a small set of **shop‑level scaffold templates** (e.g. base home page, example PLP, example PDP‑adjacent pages) defined in `@acme/templates` and described by `ScaffoldSpec` and `TemplateDescriptor`.
        - Call a canonical `scaffoldPage({ templateId, locale, shopId })` from `page-builder-core` to materialise initial `Page` records.
      - This keeps “initial content generation” and “per‑page templates/presets” on the same underlying machinery, and makes it easier to:
        - Upgrade scaffolds over time (new shops pick up new templates; existing shops keep what they already have).
        - Offer a consistent “Start from template” experience whether you’re creating a shop or just adding a new page.
      - `createShop` should treat `@acme/templates` as its **single source of truth** for initial page scaffolds (home, returns, promo pages):
        - Adding a new scaffold is “add a template to `@acme/templates` + wire it into the configurator”, not “hand‑code a new seeding function” next to `createShop`.
- **Schema evolution & block versioning**
  - How do we version and migrate `PageComponent` schemas themselves (not just templates), so that block type changes do not break existing content?
  - Do we need a per‑block version and a migration pipeline that runs on load/save to normalise older block payloads?
  - **Details:**
    - *Versioning at the block schema level*
      - The `PageComponent` union in `packages/types/src/page/page.ts` is already the single source of truth for block shapes:
        - Each block type has a TS interface + Zod schema (`atoms`, `molecules`, `organisms`, `layouts`).
        - `pageComponentSchema` is a `z.discriminatedUnion("type", [...])` over those schemas, giving us strong validation on read/write.
      - Rather than introducing explicit per‑block `version` fields in page data for v1, we can:
        - Treat the Zod schemas as the **current version** of each block type.
        - Require all migrations from older shapes to happen via **normalising functions** that run before/after validation.
      - If we later need explicit per‑block versions (for more complex evolutions), we can add them to the schemas and to `componentMetadataSchema` once we have concrete use cases.
    - *Safe change vs breaking change rules (per block)*
      - For block schemas, we should adopt simple, enforceable rules:
        - Non‑breaking changes:
          - Adding optional props with sensible defaults.
          - Broadening literal unions (e.g. adding a new variant to `"preset"`).
          - Relaxing constraints in a way that still accepts existing data.
        - Breaking changes (require migration):
          - Renaming or removing required props.
          - Changing the meaning or type of an existing prop.
          - Changing `type` discriminant values.
      - Breaking changes must be accompanied by:
        - A migration helper for that block type, and
        - A bump to any templates/presets/library items that rely on the old shape (see previous section).
    - *Migration pipeline (where to run it)*
      - The migration story should be **centralised and deterministic**:
        - Add a `migratePageComponents(page: Page): Page` helper in `platform-core` that:
          - Walks the `Page.components` tree.
          - For each block type that has a migration registered, applies `migrateBlock(old)` → `new`.
          - Returns a normalised `Page` that passes `pageSchema` validation.
        - Maintain a simple registry:
          ```ts
          type BlockMigrateFn = (old: any) => any;
          const blockMigrations: Record<string, BlockMigrateFn[]> = {
            // keyed by block type, oldest→newest
            ProductGrid: [migrateProductGrid_v1_to_v2, migrateProductGrid_v2_to_v3],
            // ...
          };
          ```
      - Where migrations run:
        - On **read** in repositories: when `getPages(shopId)` loads data, it passes each page through `migratePageComponents` before returning it.
        - Optionally on **write** in CMS actions: after a successful save/publish, we may persist the migrated shape back to storage to avoid re‑migrating the same page repeatedly.
      - For v1, the migration registry can be lightweight and only used when we make real breaking changes; we do not need to pre‑populate it for every block.
    - *Schema evolution examples*
      - Simple additive change:
        - Add an optional `quickView?: boolean` to `ProductGridComponent` schema; no migration needed, as old pages remain valid and the default is `false`.
      - Renaming a prop (breaking):
        - Suppose `FeaturedProductComponent` moves from `sku: string` to `skuId: string`:
          - Add a migration: `migrateFeaturedProduct_v1_to_v2` that copies `component.sku` to `component.skuId` if present, then deletes `sku`.
          - Register it under `blockMigrations.FeaturedProduct`.
          - Keep template/library definitions in `@acme/templates` up to date with the new prop.
      - Changing a nested structure:
        - E.g., changing `PoliciesAccordion` from three separate HTML fields to an array of items:
          - Migration would synthesise the new array from existing `shippingHtml`/`returnsHtml`/`warrantyHtml` fields.
    - *Interaction with history and provenance*
      - Migrations operate on the **published page state** (and drafts where appropriate), not on `pages.history.jsonl`:
        - Diff history remains a log of past states; we don’t rewrite it as we migrate.
        - If needed, diffs can note migration‑related changes like other edits.
      - When provenance is present (`page.origin`):
        - Structural migrations that only make sense for certain templates can use both block type and `page.origin.templateId` to decide whether to run.
        - Block‑level migrations (e.g., prop rename) don’t need origin context; they run for all pages with that block type.
    - *What we are **not** doing in v1*
      - We are deliberately **not**:
        - Storing a per‑block `version` field in every `PageComponent` (adds weight/complexity without clear immediate benefit).
        - Running migrations in the browser at render time (keeps behaviour consistent and testable on the server).
        - Auto‑applying large structural changes to pages when templates evolve; those remain explicit operator‑triggered actions as described in the templates section.
- **History & UX integration**
  - What retention policy and inspection tooling do we need for `pages.history.jsonl` diff logs?
  - How should history be surfaced to non‑technical users (compare, review, rollback) as part of everyday CMS workflows?
  - **Details:**
    - *What we already have*
      - Every page write via `savePage` / `updatePage` appends a diff entry to `pages.history.jsonl` per shop:
        - Each line is `{ timestamp, diff }` where `diff` is a partial `Page` (fields that changed compared to previous).
        - `diffHistory(shop)` reads and validates these entries for potential inspection.
      - The Page Builder maintains an in‑memory `HistoryState` per page (undo/redo stacks and editor metadata), and saves the full state to `localStorage` as the user edits.
      - CMS actions (`createPage`, `updatePage`) already accept a serialised `history` payload and store it on `Page.history`, so we have both:
        - **Short‑term, interactive history** (undo/redo, local autosave via `HistoryState`), and
        - **Long‑term, server‑side history** (diff log via `pages.history.jsonl`).
      - There is currently no explicit `PageVersion` concept; it is helpful to make this first‑class to avoid inventing ad‑hoc versioning later.
        - A concrete shape could be:
          ```ts
          type PageVersionId = string;
          interface PageVersion {
            id: PageVersionId;
            pageId: string;
            shopId: string;
            createdAt: string;
            createdBy: string;
            label?: string;
            status: "draft" | "published";
            snapshot: Page; // full, validated Page
          }

          function listPageVersions(shopId: string, pageId: string): PageVersion[];
          function getPageVersion(shopId: string, versionId: PageVersionId): PageVersion | null;
          function savePageVersion(version: PageVersion): void;
          ```
        - With this, we have four clearly scoped “history layers”:
          - `HistoryState` (in‑memory + localStorage) – per‑session undo/redo and autosave; never leaves the browser unless explicitly saved into `Page.history`.
          - `Page.history` – the current page’s editor metadata and recent editing timeline; flows with the live draft.
          - `PageVersion` snapshots – the user‑visible versioning system (“v12 of the checkout page”), used for compare/restore.
          - `pages.history.jsonl` – low‑level append‑only diff log for audits/forensics and ops tooling.
    - *User‑facing history views*
      - Editors need two distinct history concepts:
        - **“While I’m editing this page”** – undo/redo and autosave within the builder session (already covered by `HistoryState`).
        - **“What changed over time”** – a per‑page list of saved/published versions, with meaningful labels.
      - Best‑bet UX for the second:
        - A **Versions panel** on the page detail screen that shows:
          - A list of significant events (draft saves, publishes) with timestamps, actor (from `createdBy`/audit logs), and a short summary (derived from `diff`).
          - A way to select two points and request a **diff view** for that page (field‑level diff for slug/SEO/props; maybe a side‑by‑side visual preview later).
        - A **“Restore this version”** action that:
          - Loads the chosen snapshot into the Page Builder as the current draft (do not auto‑publish).
          - Lets the user review and then explicitly publish.
      - Implementation sketch:
        - Backed by `PageVersion`:
          - `listPageVersions(shopId, pageId)` powers the Versions panel.
          - `getPageVersion(shopId, versionId)` powers “View version” and “Restore this version”.
        - For v1, prioritise a simple “Published versions” list (filter `PageVersion.status === "published"`), and use `pages.history.jsonl` as supporting detail for audits, not the primary UI source.
    - *Rollback and safety*
      - Rollback for PB‑driven pages should be:
        - **Page‑scoped** – rolling back page A should not affect other pages.
        - **Explicit** – always a two‑step “restore as draft → publish” flow, not an immediate revert of live content.
      - Under the hood:
        - Use `PageVersion` for versioning:
          - Each publish writes a new `PageVersion` with `status: "published"` and a full `Page` snapshot (including `components`, `seo`, and any editor metadata we choose to persist).
          - Optionally, explicit “Save draft” actions outside autosave can also write `PageVersion` entries with `status: "draft"` to support “draft versions” later.
        - Rollback:
          - Loads `snapshot` from a chosen version into the Page Builder as the current draft.
          - On save/publish, writes a **new** `PageVersion` (with a new `id`), leaving the previous version as historical context.
          - Leaves `pages.history.jsonl` intact as an audit trail.
    - *How `pages.history.jsonl` fits in*
      - Treat `pages.history.jsonl` as a **low‑level audit log**, not the direct UI feed:
        - It’s useful for:
          - Forensic debugging (“who changed what, when, at a field level?”).
          - Power‑user tooling (CLI/ops scripts) that need to inspect or export change history.
        - It is not ideal as the sole data source for end‑user history UX due to its diff‑only nature and potential growth.
      - For v1 CMS UX:
        - Use snapshot‑style `PageVersion` records for the primary Versions UI.
        - Expose `pages.history.jsonl` through admin/ops tooling (e.g. downloadable log, API) for deeper inspection when needed.
      - Retention and GC (high‑level, to align with the retention section):
        - Keep at least the last N published versions per page (e.g. 10) or last M days (e.g. 90 days), whichever is more generous.
        - Older `PageVersion` records can be:
          - Soft‑deleted (hidden from UI) or
          - Archived/exported and then purged, depending on compliance needs.
        - `pages.history.jsonl` can be compacted in tandem:
          - Cap file size/age per shop.
          - Provide a CLI/admin tool that truncates entries older than X days or rewrites the file keeping only diffs since the oldest retained `PageVersion`.
    - *History vs migrations*
      - Block/schema migrations described earlier operate on the current `Page` state (and drafts) rather than rewriting history:
        - History remains a record of what was saved at the time.
      - Safety invariant for any tool that mutates Page content (including migrations):
        - **Always** create a new `PageVersion` snapshot before applying changes, so “rollback from before this change” is possible.
        - Append a clear “migration” marker to diff/audit logs (and/or `PageVersion.label`) so operators can see which pages were touched by which migration.
- **SEO, SSR, performance**
  - How does `DynamicRenderer` interact with SSR/streaming, and what patterns should we encourage/avoid to protect LCP/CLS on highly composed pages?
  - How should Page Builder–authored SEO metadata map onto Next 15 metadata APIs for dynamic routes, especially for core commerce pages?
  - **Details:**
    - *SSR vs client‑side composition*
      - The current `DynamicRenderer` implementations in `@acme/ui` and `template-app` are marked `"use client"` and run entirely on the client:
        - CMS‑driven pages are rendered as a server‑side skeleton (layout + `<main>` shell), then PB blocks hydrate on the client.
        - Commerce system pages (PLP, PDP, checkout) are still server‑rendered via Next’s App Router (`generateMetadata`, `generateStaticParams`, server components for data fetching), and only parts of the tree (e.g. `DynamicRenderer`, cart/checkout widgets) are client components.
      - For v1 this is acceptable, but we should keep in mind:
        - PB‑composed marketing pages may be less optimal for LCP than fully server‑rendered templates.
        - Critical commerce content (product data, pricing, availability) should continue to be rendered on the server where possible, with PB used for layout and secondary content.
      - Longer‑term, we would like **server‑first PB rendering** for static content:
        - Blocks that are mostly static (text, images, basic layout) should be renderable as server components, with only interactive islands hydrated on the client.
        - To keep that path open, block implementations should avoid patterns that require `window` or client‑side data fetching in their render path; interactive behaviour should live in child client components when needed.
      - Conceptually, it helps to think of three block classes:
        - **Static blocks** – text, images, simple layout; should be SSR‑friendly and avoid heavy `useEffect` usage.
        - **Interactive blocks** – carousels, accordions, forms; can be client components, but should keep props small and delegate data fetching to server components.
        - **Heavy/experiential blocks** – parallax, Lottie, complex galleries; require explicit opt‑in and should never be the only above‑the‑fold content.
    - *Patterns to protect LCP/CLS*
      - Hero/above‑the‑fold sections:
        - PB blocks used at the top of critical pages (home hero, PDP hero) should:
          - Have predictable heights (use `minHeight`/height presets and aspect‑ratio wrappers like the `CmsImage` pattern).
          - Avoid layout thrash on hydration (no large font/spacing changes after first paint).
        - Where possible, SSR these sections as part of the app shell (e.g. server components that render a known hero template), and use PB for slots below the fold.
      - Images and media:
        - Use `next/image` (as `CmsImage` does in the template app) with width/height or `aspectRatio` to prevent CLS.
        - For PB image blocks, ensure their schemas include enough information (cropAspect, width/height) for the runtime to reserve space correctly.
      - Animations and scroll effects:
        - `DynamicRenderer` initialises scroll/timeline/Lottie effects in `useEffect` and uses `data-pb-*` attributes and CSS variables; to avoid jank:
          - Default animation durations/delays should be modest.
          - Avoid heavy parallax/scroll effects on long mobile pages unless specifically required.
      - Hydration:
        - Keep PB block trees reasonably shallow for above‑the‑fold content; deeply nested layouts and many client components increase hydration cost.
        - Use server components for data fetching (products, settings) and pass minimal props to PB components.
      - Streaming:
        - For PB pages rendered through the App Router, we can still take advantage of streaming:
          - Render the shell and any above‑the‑fold server content first.
          - Load PB JSON and hydrate `DynamicRenderer` lower in the tree.
        - Avoid putting a monolithic `DynamicRenderer` inside a blocking `Suspense` boundary for above‑the‑fold content; if a PB section can be slow, wrap it in its own `Suspense` with a light fallback so the rest of the page can stream.
    - *SEO metadata wiring*
      - Next 15 App Router encourages per‑route `generateMetadata` for SEO:
        - System pages already use this (e.g. `/[lang]/shop`, `/[lang]/product/[slug]`, `/[lang]/checkout`) to set `title`, `description`, and structured data via helper functions.
      - PB pages should map `Page.seo` into metadata as follows:
        - For generic PB routes (e.g. future `/[lang]/pages/[slug]`):
          - `generateMetadata` fetches the `Page`, picks `seo.title[locale]` / `seo.description[locale]`, and returns a `Metadata` object.
          - `seo.noindex === true` maps to `robots: { index: false }` and exclusion from sitemaps.
        - For PB‑influenced system pages (e.g. PDP with PB slots), precedence should be explicit:
          - PDP: `<title>` and main description come from product data (e.g. `product.title · brand` and `product.description`); PB can optionally override OpenGraph image and add extra structured data, but does not own the canonical `<title>`.
          - PLP: `<title>` derives from category/collection; PB may add structured data snippets or extra sections, but not replace the primary title.
      - Sitemaps and AI catalog:
        - Continue to derive sitemaps from App Router routes plus `Page` records where appropriate (see `docs/seo.md`).
        - The AI catalog API (`/api/ai/catalog`) should remain driven by product data, not PB pages; PB can influence how products are presented, not which products exist.
    - *Performance budgets and tooling*
      - Keep a simple budget for PB pages:
        - As a working budget, a typical PB marketing page should keep the serialised `Page.components` payload under ~50 KB gzipped; if we routinely exceed ~100 KB, we should consider splitting into slots or simplifying block structures.
        - Blocks must not inline large datasets (e.g. full product catalogues); they should carry filters/handles and rely on server‑side queries.
        - Runtime payloads for PB pages must not include editor‑only metadata (`history.editor`, selection state, comments, etc.); only the minimal `PageComponent[]` + resolved styles needed for rendering should be sent to the client.
      - Use existing tooling:
        - Lighthouse and k6 tests already exist for core flows; extend them to include:
          - One or two representative PB‑heavy pages (home, campaign) in Lighthouse budgets.
          - A small number of PB routes in k6 scenarios if they become part of the core funnel.
      - Where PB is used on critical commerce pages:
        - Measure LCP/CLS before and after adding PB sections.
        - Set thresholds (e.g. LCP < 2.5s on 4G) and adjust block usage/layout accordingly.
        - Feed Web Vitals (LCP, CLS, INP) into the observability pipeline, tagged with `shopId` and route, and alert if PB‑heavy pages exceed agreed thresholds over a rolling window.
- **Accessibility & guardrails**
  - What accessibility requirements (semantics, keyboard navigation, focus management, ARIA) should blocks adhere to, and where should we enforce them (linting, visual checks, CMS validation)?
  - How do we prevent authors from composing pages that are visually attractive but inaccessible (e.g., contrast, heading structure)?
  - **Details:**
    - *Block‑level accessibility expectations*
      - Core PB blocks and typical compositions should meet **WCAG 2.1/2.2 AA** for semantics, keyboard access, focus, and contrast by default; authors should not need to be accessibility experts to get a decent baseline experience.
      - Core PB blocks (headers, navigation, buttons, forms, carousels, product grids, accordions, modals) should follow a written set of a11y requirements:
        - Correct semantics (`<nav>`, `<main>`, `<header>`, headings in order, landmark roles where appropriate).
        - Keyboard support (tab order, focus traps in modals, ESC to close, arrow keys for carousels/menus where applicable).
        - ARIA attributes only where needed (labels for icons, expanded/collapsed state, relationships for accordions/tabs), avoiding ARIA that fights native semantics.
        - Sufficient colour contrast for default themes; PB style controls should not allow authors to easily violate WCAG contrast without a warning.
      - These requirements should be codified per block type (e.g. in component docs) so block authors have a clear contract.
      - “Never do” rules for block implementations:
        - No interactive `<div>`/`<span>` – use native elements (`<button>`, `<a>`, form controls) or well‑documented composite patterns.
        - No disabling visible focus outlines without providing an equally visible alternative.
        - No keyboard traps: modals and other overlays must be dismissible via keyboard and keep focus within the dialog while open.
    - *Where to enforce guardrails*
      - At implementation time (component code):
        - A11y‑critical behaviours live in the block implementations in `@acme/ui` and `@acme/platform-core/components`:
          - Use semantic elements by default (e.g. `<button>` instead of clickable `<div>`).
          - Ensure focus management and keyboard behaviour is baked in.
        - Complex interactive blocks (carousels, accordions, modals, menus) should ship with:
          - A small “a11y checklist” in their docs/stories (role, keyboard interactions, focus behaviour, ARIA attributes).
          - At least one Storybook story with the a11y addon enabled, so regressions surface early.
      - At design/content time (Page Builder):
        - The builder should discourage a11y‑hostile patterns:
          - Provide heading level guidance (e.g. enforce a single H1 per page, flag multiple H1s).
          - Warn when authors pick colour combinations that fall below contrast thresholds for body/text blocks.
          - Limit certain props (e.g. disabling ability to turn off visible focus outlines without an explicit “expert mode”).
          - Surface block‑level `a11yHints` metadata in the inspector (e.g. “This block must have alt text”, “Avoid using this as the only way to navigate”).
          - Show a small “contrast badge” next to colour pickers (AA/AAA/fail) for text vs background tokens.
      - At tooling time (linting/CI):
        - Use existing linting and automated checks (ESLint with a11y plugins, Storybook a11y) on block code.
        - Add a small smoke test that renders a canonical “kitchen sink” page (header + footer + a representative set of blocks) through an automated checker (e.g. axe, pa11y) in CI as a tripwire for egregious regressions.
    - *Preventing inaccessible compositions*
      - Some issues only arise at the page level (e.g. heading hierarchy, multiple `main` elements, too many auto‑playing videos). Guardrails should include:
        - Page‑level validators that:
          - Treat DOM order as the canonical reading order for keyboard and screen‑reader users; layout props (`orderMobile`, absolute positioning, `.pb-hide-*`) must not produce a nonsensical sequence (e.g. H3 → H1 → H2).
          - Ensure only one “main” landmark per page; header/footer/nav landmarks should be unique and consistent across pages for a given layout.
          - Check for exactly one top‑level H1 per page.
          - Prevent large heading level jumps (e.g. flag H2 → H4) unless explicitly opted in.
          - Flag excessive use of disruptive patterns (e.g. multiple auto‑playing/high‑motion blocks above the fold).
          - Highlight problematic combinations of `.pb-hide-*` where content vanishes visually but remains in a confusing order in the DOM, or vice versa.
        - Motion and auto‑play specifics:
          - Auto‑playing carousels/video must:
            - Honour the `prefers-reduced-motion` media query and reduce/disable motion when set.
            - Expose visible controls to pause/stop.
            - Use a minimum auto‑advance interval (e.g. ≥ 5s) and stop auto‑play once the user interacts.
          - Page‑level checks should warn when more than a small number of auto‑playing or high‑motion blocks appear above the fold.
        - Visual affordances in the builder:
          - A small “Accessibility” pill per page (e.g. `✅ Headings · ✅ Landmarks · ⚠ Contrast · ⚠ Motion`) that, when clicked, opens a panel listing:
            - Page‑level issues (multiple H1s, missing `main`, obvious motion problems, landmark issues).
            - Block‑level warnings (low contrast, missing alt text, risky layout props).
      - For v1, we can start small:
        - Focus on obvious high‑impact issues: headings, contrast, keyboard access to interactive components, and glaring motion problems.
        - Provide guidance text and non‑blocking warnings rather than hard blockers, except for egregious cases (e.g. non‑dismissible modals, keyboard traps, completely missing `main` landmark) where a publish‑time hard block is justified.
- **Extensibility / third‑party blocks**
  - How can internal/external teams introduce new blocks or templates safely (namespacing, review processes, constraints on props/layout)?
  - Do we want a formal plugin model for blocks/templates, or a curated “core only” set for now, and how would that decision affect multi‑shop safety?
  - **Details:**
    - *Scope for v1*
      - For now, we assume **blocks are authored by internal teams** and shared across shops; third‑party/extensible blocks are a future concern.
      - Even so, it is worth shaping the model so that external plugins could be added later without breaking invariants.
    - *Namespacing and registration*
      - Blocks are already identified by `PageComponent["type"]` and registered via `blockRegistry` in `@acme/ui` (for CMS) and a separate mapping in `template-app`:
        - Internal block types should use a clear `PascalCase` naming convention and be documented/owned (e.g. `HeroBanner`, `CartSection`, `AccountSection`).
        - For potential third‑party blocks, we can reserve a `Vendor:Name` or `plugin::<name>` naming convention (e.g. `acmeVideo:Hero`, `plugin::shoppableInstagram`) to avoid collisions.
      - Registration should go through explicit APIs:
        - `registerBlocks(registry: Record<string, BlockRegistryEntry>)` in `page-builder-core/ui`.
        - Apps/plugins call this during initialisation rather than mutating the registry directly.
    - *Contracts for block authors*
      - Any block—core or third‑party—must adhere to the same contracts:
        - **Props schema**: defined in `@acme/types` with Zod, added to `pageComponentSchema`.
        - **Public behaviour**: documented expectations around a11y, SSR‑friendliness, performance (as per previous sections).
        - **Data dependencies**: blocks must not fetch arbitrary data on the client; they should receive either:
          - Data from server components (for system blocks), or
          - Query descriptors/ids (for PB blocks) that `DynamicRenderer` or server components resolve.
      - Before introducing a new block type:
        - Add its schema and tests in `@acme/types`.
        - Implement its rendering in `@acme/ui` and, if needed, template‑app mapping.
        - Optionally add Storybook stories, a11y checks, and basic performance checks.
    - *Guardrails for “third‑party” blocks*
      - If/when external plugins are allowed, we will likely want:
        - A **review process** before enabling them in production (code review, security/a11y/perf checks).
        - Constraints enforced at registration time:
          - No access to global window in render.
          - No direct network calls from client components; use provided hooks/APIs instead.
          - Size limits on props and bundle to avoid regressions.
        - A mechanism to **disable** or quarantine problematic blocks (e.g. refuse to render unknown/disabled `type`s at runtime).
      - PB should treat unknown/unregistered block types as non‑renderable and surface a clear warning in CMS, so a mis‑configured plugin cannot silently break live pages.
    - *Templates & plugins*
      - The same `TemplateDescriptor` model described earlier can support third‑party templates:
        - Vendor templates can register under their own namespace (`templateId` with vendor prefix), with `originKind: "plugin"` or similar.
        - Shops can opt into specific template sets via configuration (e.g. “enable luxury templates”), and the CMS palette reflects that configuration.
      - We should prefer a curated “core + approved internal templates” set for v1; a full external plugin marketplace is out of scope but the registration model should not prevent it later.

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
      - `packages/template-app/src/api/cart/route.ts` re-exports `@acme/platform-core/cartApi` handlers but forces `runtime = "nodejs"` to avoid edge runtime limitations during development.
      - The template app’s layout wraps the tree with `CartProvider` (`packages/template-app/src/app/layout.tsx`), so any cart-aware UI block can access the shared context.
    - Cover-me-pretty:
      - `apps/cover-me-pretty/src/api/cart/route.ts` re-exports the shared handlers from `@acme/platform-core/cartApi`, and `src/app/api/cart/route.ts` is a thin shim that points the App Router route at the same implementation while forcing the Node runtime.
      - By delegating to `cartApi`, it uses the same `CartStore` (memory/Redis selection) and signed cart-ID cookie mechanics as the template app.
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
  - Cover-me-pretty checkout (`apps/cover-me-pretty/src/api/checkout-session/route.ts`):
    - Mirrors the template app’s handler but:
      - Runs on the edge runtime and reads the signed cart ID from `CART_COOKIE`, then calls `getCart(cartId)` to reconstruct state.
      - Uses `getCustomerSession` to tie sessions to an authenticated customer when available.
      - Passes `shop.id` from the embedded `shop.json` into `createCheckoutSession`.

  - **CMS configuration touchpoints for cart/checkout**
  - Shop-level settings for checkout:
    - `ShopSettings` (`packages/types/src/ShopSettings.ts`) includes:
      - `currency`, `taxRegion`, and multiple services that affect checkout/returns (deposit service, late fees, reverse logistics, return service, premier delivery, stock alerts, AI catalog).
    - CMS service `apps/cms/src/services/shops/settingsService.ts` exposes actions:
      - `updateCurrencyAndTax` → updates `currency` and `taxRegion`; directly used by template app checkout to pick display currency and tax region.
      - `updateDeposit`, `updateLateFee`, `updateReverseLogistics`, `updateUpsReturns`, `updateStockAlert`, `updatePremierDelivery`, `updateAiCatalog` configure services that influence background jobs, returns experience, and some UI.
  - Per‑page cart/checkout blocks in the Page Builder (system blocks):
    - `CartSection` (`packages/ui/src/components/cms/blocks/CartSection.tsx`):
      - Client block that renders `OrderSummary` plus optional promo/gift/loyalty UI; relies on `useCart` context when `cart` is not provided.
    - `CheckoutSection` (`packages/ui/src/components/cms/blocks/CheckoutSection.tsx`):
      - Wraps `CheckoutForm` and optional wallet/BNPL messaging; takes `locale` and `taxRegion` props.
    - These are **system commerce blocks**, not general‑purpose marketing blocks:
      - They are intended for use in the canonical `/[lang]/checkout` route and in dedicated checkout/account slot editors, not on arbitrary `pageType = "marketing" | "legal" | "fragment"` pages.
      - Palette filtering and publish‑time validation should prevent them from appearing on generic marketing/legal/fragment pages; where they do appear today, that is treated as a migration gap rather than desired behaviour.
    - Combined with `CartProvider` and the cart/checkout APIs, these blocks function in any **platform‑compatible** app that:
      - Includes the providers (`CartProvider`, `CurrencyProvider`) at the agreed layout level, and
      - Exposes `/api/cart` and `/api/checkout-session` endpoints with the expected semantics.

Taken together, the platform already has:

- A robust cart domain with pluggable storage and a secure cookie model.
- Shared cart APIs and React context that work across CMS and shop apps.
- A full Stripe-based checkout pipeline built on top of cart + pricing + tax + coupons, with reusable `CheckoutForm` and `OrderSummary` components.
- CMS-managed settings for currency/tax and related services, plus Page Builder blocks for cart and checkout sections.

The main gaps for “drop-in” prefabricated cart/checkout are:

- Ensuring every tenant app that wants prefab support strictly uses the shared `cartApi`/`CartStore` pattern (rather than custom cookie-based carts) so CMS-prefab blocks behave consistently.
- Tightening the contract between CMS config (shop settings, block props) and runtime endpoints (e.g. standardizing `/api/cart` and `/api/checkout-session` expectations) so placing `CartSection`/`CheckoutSection` into the **supported system contexts** (checkout/account routes and slots) in a platform‑compatible app is reliably sufficient, without extra per-app wiring.

### Open questions / gaps

- **Order lifecycle & reconciliation (partially codified)**
  - Current state in code/docs:
    - `docs/orders.md` and `packages/platform-core/src/orders/*` define `RentalOrder` as the primary order model, keyed by `(shop, sessionId)`, with helpers for creation (`creation.ts`), lifecycle transitions (`status.ts`), refunds (`refunds.ts`), and risk/returns.
    - `addOrder` currently does a simple `create` on `RentalOrder` (enforced unique on `(shop, sessionId)`), and `refundOrder` encapsulates Stripe refund logic plus `refundTotal`/`refundedAt` updates.
  - Remaining gaps:
    - Making `addOrder` idempotent/upsert-like on `(shop, sessionId)` as described below; capturing richer Stripe identifiers on `RentalOrder`; and introducing a first-class `OrderStatus` field/state machine remain future work rather than implemented behaviour.
  - **Details:**
    - *Order record scope*
      - Today, the `orders` module is focused on **rental orders** (`RentalOrder`), keyed by `(shop, sessionId)`:
        - One `RentalOrder` per successful Stripe Checkout session for a rental flow.
        - It records deposit, expected/actual return dates, refund metadata, fulfilment/shipping/cancellation timestamps, and risk/return logistics fields (see `docs/orders.md` and `RentalOrder` schema).
      - For v1, we treat this as the canonical **order entity** and optimise the platform for **rental flows**:
        - Platform‑level guarantees, lifecycle/state‑machine semantics, and money‑flow tests are defined for `RentalOrder` only.
        - Sale‑only or hybrid shops may reuse parts of this infrastructure (Stripe IDs, status model, refund handling), but a first‑class sale order model is out of scope for v1.
        - Future work may introduce a more general `Order` abstraction with a `kind: "rental" | "sale"` discriminator and different required fields per kind; until then, `RentalOrder` is the only order type with platform‑level guarantees.
    - *When orders are created*
      - Stripe checkout → internal order creation:
        - For rental flows, `checkout.session.completed` events are handled by `checkoutSessionCompleted`:
          - Reads `depositTotal`, `returnDate`, and optional `customerId` from `session.metadata`.
          - Calls `addOrder(shop, session.id, deposit, returnDate, customerId)`, creating or updating a `RentalOrder` row keyed by `(shop, sessionId)`.
        - The template app’s `/api/rental` endpoint also calls `addOrder` after a successful rental checkout; it should be treated as a **thin, idempotent wrapper** around the same `addOrder(shop, sessionId, ...)` logic (e.g. to trigger allocation and local side effects), not as an independent source of order creation.
      - Best‑bet behaviour:
        - **Source of truth:** `checkout.session.completed` is the **authoritative trigger** for creating a `RentalOrder`; any app‑local endpoints must behave as idempotent wrappers, not alternate sources of truth.
        - `addOrder(shop, sessionId, ...)` should behave like an **upsert keyed on `(shop, sessionId)`**:
          - First call: creates the order and sets `startedAt`.
          - Subsequent calls with the same data: no‑op (idempotent).
          - Subsequent calls with different data: either no‑op or log a warning for investigation, but **never** create duplicates; callers must handle errors rather than working around Prisma uniqueness violations.
        - Any future “create order from X” flows must go through this same `addOrder` contract and pass `(shop, sessionId)` explicitly.
    - *Order status model*
      - In addition to timestamps, we want a **named state machine** for orders to make lifecycle and monitoring clearer:
        ```ts
        type OrderStatus =
          | "created"
          | "paid"              // Stripe checkout.session.completed
          | "fulfilled"
          | "shipped"
          | "delivered"
          | "in_use"            // optional, for rentals in active use
          | "return_in_transit"
          | "returned"
          | "qa"
          | "completed"         // deposit handled, lifecycle done
          | "cancelled"
          | "needs_attention";  // risk / manual review
        ```
      - Conceptually:
        - `addOrder` creates an order with status `"created"` (and `startedAt` set).
        - `checkout.session.completed` (or equivalent confirmation) moves status → `"paid"`.
        - Fulfilment APIs (`markFulfilled`, `markShipped`, `markDelivered`) move through `"fulfilled"` → `"shipped"` → `"delivered"` and set corresponding timestamps.
        - Reverse‑logistics events (`markReceived`, `markCleaning`, `markQa`, `markAvailable`) plus return logistics fields (`returnStatus`) map to `"return_in_transit"` → `"returned"` → `"qa"` → `"completed"` for rentals once deposits/fees are settled.
        - Risk helpers (`markNeedsAttention`, risk flags) can move status to `"needs_attention"` for manual review.
      - The existing `RentalOrder` timestamps (`fulfilledAt`, `shippedAt`, `deliveredAt`, `returnedAt`, `refundedAt`, `cancelledAt`) and current reverse‑logistics `status` field are the **evidence** for these transitions; status can be stored explicitly or computed in helpers, but the state machine gives us a single vocabulary for:
        - Enforcing invariants (e.g. you cannot refund before `"paid"`, you cannot mark `"returned"` before `"shipped"`).
        - Monitoring and alerts (e.g. orders stuck in `"needs_attention"` for > X hours).
    - *Lifecycle stages*
      - Core lifecycle fields on `RentalOrder` represent:
        - Creation/start: `startedAt` set when `addOrder` is called.
        - Fulfilment/shipping/delivery: `fulfilledAt`, `shippedAt`, `deliveredAt` updated via `markFulfilled`, `markShipped`, `markDelivered`.
        - Cancellation: `cancelledAt` updated via `markCancelled`.
        - Returns & reverse logistics:
          - `returnedAt` set via `markReturned`; `status` and reverse‑logistics events (`received`, `cleaning`, `repair`, `qa`, `available`) track post‑return processing (see `reverseLogisticsEvents` and `processReverseLogisticsEventsOnce`).
          - `returnReceivedAt`, `trackingNumber`, `labelUrl`, `returnStatus` are filled by return logistics helpers and worker jobs.
        - Refunds and fees:
          - `refundedAt` and `refundTotal` track deposit refunds.
          - `damageFee` and `lateFeeCharged` track deductions/extra charges relative to deposit and rental terms.
      - High‑level intended lifecycle for rentals:
        - `startedAt` → (optional) `fulfilledAt`/`shippedAt`/`deliveredAt` → `returnedAt`/`returnReceivedAt` → `refundedAt` and/or `damageFee`/`lateFeeCharged` → reverse‑logistics `status` transitions back to `available`.
    - *Stripe webhooks and reconciliation*
      - Webhooks are the primary integration point with Stripe:
        - `checkout.session.completed` → creates `RentalOrder` via `addOrder`.
        - `charge.refunded` → `chargeRefunded` handler calls `markRefunded(shop, sessionId)` to set `refundedAt` and update `risk` fields as needed.
        - `payment_intent.succeeded` / `payment_intent.payment_failed` → update risk markers via `persistRiskFromCharge` / `markNeedsAttention`.
        - Other events (`invoice.payment_succeeded/failed`, `customer.subscription.*`, `review.*`) feed risk/analytics but do not change core order lifecycle directly.
      - Additionally, explicit server APIs can trigger refunds or adjustments:
        - `refundOrder(shop, sessionId, amount?)`:
          - Computes the refundable amount based on `total`/`deposit` and `refundTotal`.
          - Calls Stripe `refunds.create` against the underlying payment intent.
          - Updates `RentalOrder.refundedAt` and `refundTotal` accordingly.
        - The template app’s `/api/rental` PATCH endpoint:
          - Computes `damageFee` based on reported damage and coverage.
          - Issues Stripe refunds for the remaining deposit and, if needed, issues a follow‑up PaymentIntent for extra damage fees.
      - Best‑bet reconciliation model:
        - Stripe is the **source of truth for payments** (amounts captured/refunded); `RentalOrder` is the source of truth for business state.
        - `RentalOrder` should persist all relevant Stripe identifiers to make reconciliation easy:
          - `stripeCheckoutSessionId` (alias of `sessionId`), plus `stripePaymentIntentId?`, `stripeCustomerId?`, and arrays of `stripeChargeIds` / `stripeRefundIds` (or a future `OrderEvent` log).
        - Invariants we care about:
          - `refundTotal` on `RentalOrder` must never exceed the amount captured for that session; this is enforced by `refundOrder` using `refundTotal` + Stripe’s view of captures.
          - `damageFee + lateFeeCharged + refundTotal` should never exceed `deposit` plus any additional charges, unless there is an explicit, documented write‑off field explaining the difference.
        - Webhooks and server APIs should be **idempotent**:
          - Use `(shop, sessionId)` as the key when mutating orders.
          - Guard against double‑refunds by checking `refundTotal` (and/or known `stripeRefundIds`) before creating additional Stripe refunds.
        - A future reconciliation job can:
          - Fetch recent Stripe events for each `stripeCheckoutSessionId`.
          - Compare captured amounts and refunds against `RentalOrder` fields and `refundTotal`.
          - Emit structured logs/metrics or surface discrepancies in CMS for manual repair.
    - *Refunds, disputes, and a single write path*
      - To avoid divergent refund behaviour, we want a single conceptual helper (backed by `refundOrder` today) such as `applyRefund(shop, sessionId, options)` that:
        - Computes the allowed refund amount based on captured totals and `refundTotal`.
        - Calls `stripe.refunds.create` (or marks a refund that happened externally).
        - Updates `RentalOrder.refundTotal` and `refundedAt`, and optionally appends an `OrderEvent` entry like `{ type: "refund", source: "webhook" | "manual", amount, reason }`.
      - All refund paths should go through this helper:
        - `charge.refunded` webhooks.
        - Manual “Refund order” actions in CMS.
        - Damage/late fee adjustments via `/api/rental` or other domain APIs.
      - For disputes:
        - `charge.dispute.*` events should:
          - Set risk markers on `RentalOrder` (e.g. `riskLevel`, `flaggedForReview`, or future `disputedAt` / `disputeStatus` fields).
          - Optionally move the order into `"needs_attention"` status.
        - For v1, disputes **do not automatically change** the core lifecycle state or trigger refunds; operators handle them manually (e.g. via notes or a future `OrderEvent` table), but the system records that a dispute exists.
    - *Returns, exchanges, and partial/multi‑shipment flows*
      - Returns:
        - For rental flows, the primary return story is:
          - Customer initiates return; reverse logistics service uses `markReceived` / `markCleaning` / `markQa` / `markAvailable` to track item status.
          - `markReturned` records `returnedAt` (and optional `damageFee`).
          - `refundOrder` or `/api/rental` handles deposit refunds and additional damage charges.
      - Exchanges and multi‑shipment:
        - The current model treats each `RentalOrder` as tied to a **single Stripe Checkout session** (and conceptually a single rental), not per‑line shipments.
        - Partial shipments or exchanges would be modelled as:
          - Either separate `RentalOrder` records per session/transaction (linked via a future `parentOrderId`/`relatedOrderIds` field), or
          - A future evolution of the order model with line‑level shipment/return data.
    - *Explicit v1 limitations*
      - For v1, we explicitly **do not** attempt:
        - Multi‑session orders:
          - A `RentalOrder` represents exactly one Stripe Checkout session; add‑on charges or upsells are separate sessions and (if tracked) separate orders, possibly linked later via metadata.
        - Line‑level shipments/returns:
          - Line items live mainly on the Stripe side and in cart/session metadata; we do not model per‑line shipment or return status in the core order schema yet. All fulfilment/return timestamps apply at the whole‑order level.
        - True exchanges:
          - Exchanges are represented as a return on the original order plus a new order for the replacement; there is no first‑class “exchange” type in v1.
        - Full order management for sale‑only flows:
          - Beyond whatever reuses the rental model and refund infrastructure, dedicated sale‑order workflows are a future design.
        - Automatic dispute handling:
          - Beyond Stripe’s built‑in workflows; we record dispute signals on `RentalOrder` and route to humans, but do not attempt autonomous resolution.**
- **Inventory consistency & concurrency (partially codified)**
  - What behaviour do we want under concurrent add‑to‑cart and checkout operations for the same SKU (oversell vs strict reservations)?
  - Do we want a reservation model for inventory during checkout, or a simpler “best effort” approach, and how should failures be surfaced to users?
  - **Details:**
    - *Inventory model and atomicity*
      - Per‑shop inventory lives as `InventoryItem` records (`sku`, `productId`, `quantity`, `variantAttributes`, thresholds) defined in `@acme/types` (`inventoryItemSchema`) and exposed via `inventoryRepository` in `packages/platform-core/src/repositories/inventory.server.ts`, backed by either Prisma (`inventory.prisma.server.ts`) or JSON (`inventory.json.server.ts`).
      - **Operational availability is derived from `InventoryItem.quantity`**: this is the source of truth for how many units can actually be allocated for rentals/sales at a point in time.
      - `sku.stock` on the catalogue side is an **editorial cap and UX hint** (“this product usually has N units available”); it can be slightly stale and is used for add‑to‑cart gating, but allocation logic must always defer to `InventoryItem.quantity` when they disagree.
      - All mutations go through `inventoryRepository.update` / `updateInventoryItem(shop, sku, variantAttributes, mutate)`, which:
        - For Prisma: runs `findUnique` + `upsert` inside a `$transaction` keyed by `(shopId, sku, variantKey)`.
        - For JSON: acquires a per‑shop file lock, re‑reads `inventory.json`, applies `mutate(current)`, and writes a normalised file back.
      - This gives a simple invariant: **per `(shop, sku, variantAttributes)` updates are atomic**, so concurrent CMS edits, background stock checks, and reservation helpers cannot interleave and corrupt a single inventory row.
    - *Add‑to‑cart: per‑cart checks, no global reservation*
      - Cart endpoints (`@acme/platform-core/cartApi`, re-exported by both `packages/template-app/src/api/cart/route.ts` and `apps/cover-me-pretty/src/api/cart/route.ts`) enforce requested quantities against **product‑level `sku.stock`**, not live `InventoryItem.quantity`:
        - `POST`/`PUT` handlers compute `newQty` per cart line and reject with `409` `"Out of stock"` / `"Insufficient stock"` when `newQty > sku.stock`.
        - No inventory rows are touched at add‑to‑cart time; carts remain **ephemeral intent state** scoped to a single cookie/cart id.
      - For v1 we keep this behaviour: add‑to‑cart is a **per‑cart best‑effort gate** based on catalogue stock, and **global inventory enforcement happens at checkout/order creation** using `InventoryItem.quantity`, not on every cart mutation. Over time, add‑to‑cart can migrate to consulting `InventoryItem` as well, but that is an optimisation rather than a v1 requirement.
    - *Checkout and reservation semantics*
      - Rental flows:
        - After a successful Stripe Checkout, the template app’s `/api/rental` endpoint (when `shop.rentalInventoryAllocation` is truthy) loads `InventoryItem[]` via `readInventory(shop)` and calls `reserveRentalInventory(shop, items, sku, from, to)` for each rented SKU (see `packages/platform-core/src/orders/rentalAllocation.ts`).
        - `reserveRentalInventory` verifies availability windows and wear/maintenance limits, picks the first `InventoryItem` whose `quantity > 0`, then calls `updateInventoryItem` to decrement `quantity` and increment `wearCount`.
        - `updateInventoryItem` simply applies the mutate result; there is currently no guard that prevents a reservation race from persisting a negative `quantity`, nor do we emit a structured log or flag on the `RentalOrder` when `reserveRentalInventory` returns `null`.
        - For DB backends the mutate runs inside a Prisma transaction; for JSON it is guarded by a filesystem lock, but neither path enforces non‑negative quantities after concurrent decrements.
      - Sale flows:
        - There is **no sale-specific reservation helper** today; sale checkouts rely entirely on catalogue `sku.stock` checks and do not mutate `InventoryItem` rows.
      - Reservation model today:
        - We **do not implement long‑lived per‑cart reservations**; inventory is only touched when:
          - A rental checkout session is confirmed and `shop.rentalInventoryAllocation` is enabled, or
          - An admin explicitly adjusts inventory via CMS/import tooling.
        - Oversells are still possible if many customers check out simultaneously on a low‑stock SKU because nothing prevents `quantity` from dipping below zero under contention.
    - *Surfacing failures and keeping stock consistent*
      - Add‑to‑cart failures already surface as 4xx responses (`409` for insufficient stock, `404` for missing items); storefront UIs are expected to show friendly “out of stock” messages and leave the cart unchanged.
      - Gap – failure handling when allocation fails at checkout:
        - Today the template `/api/rental` route ignores the return value from `reserveRentalInventory`, so allocation failures are silent: we still create the `RentalOrder`, we do **not** set any `allocationFailed`/`needs_attention` marker, and there is no structured log/metric that operators can act on.
        - The desired behaviour remains the same (mark the order, emit `{ shopId, sku, requestedQty, reason }`, surface a queue and guide operators to adjust or refund), but it is not implemented yet.
        - Sale flows will need analogous handling once we introduce sale-side reservations; for now they lean entirely on catalogue stock checks and refunds remain manual.
      - Background stock checks and alerts:
        - `scheduleStockChecks` in `stockScheduler.server.ts` runs `checkAndAlert(shop, items)` on a schedule using `readInventory(shop)` as input, while `checkAndAlert` applies per‑shop thresholds and records alerts in a suppression log plus email/webhook notifications.
        - These jobs only read inventory (and append to a shop‑local log file), so they can run alongside checkouts without interfering with transactional updates, and they act as the safety net when catalogue `sku.stock` and true availability drift.
      - Tests and reconciliation jobs that are still missing:
        - There are **no concurrency tests** around `updateInventoryItem`/`reserveRentalInventory`; we rely on unit tests that stub out storage, so nothing currently asserts that `quantity` stays non‑negative or that successful reservations never exceed the initial quantity.
        - There is **no automated catalogue vs inventory reconciliation job**; we do not aggregate `InventoryItem.quantity` and compare it to `sku.stock`, so drift is only caught manually today.
- **Security & compliance**
  - Can we explicitly document the security boundary (no card data at rest, reliance on Stripe for PCI/SCA/3DS) and any remaining obligations in our code?
  - Are cart cookies robust against tampering/replay, and how do they interact with CSRF protections and session management?
  - **Details:**
    - *Payments boundary and Stripe responsibilities*
      - We operate as a **Stripe‑integrated SaaS**: card data entry and SCA/3DS flows live entirely in Stripe; our responsibility is to correctly orchestrate sessions, webhooks, and order state, and to protect all non‑payment PII and business data (this is closest to an SAQ‑A‑style PCI footprint).
      - Card details and strong customer authentication (SCA/3DS) are handled by **Stripe**:
        - Storefronts use Stripe Checkout / Elements so raw card numbers never transit our servers; backend code only sees tokens/IDs (Checkout session IDs, PaymentIntent IDs, customer IDs) and high‑level status.
        - `@acme/config/env/payments` enforces that when `PAYMENTS_PROVIDER=stripe`, keys like `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are present and valid, failing fast otherwise.
      - Our responsibilities:
        - Keep Stripe secrets in env/config only (never in `Shop`, `ShopSettings`, JSON, logs, or PB content).
        - Treat Stripe as the **source of truth for money** (captures/refunds) and `RentalOrder` (and any future order models) as the source of truth for business state; reconciliation jobs compare our records to Stripe, not vice versa.
        - Ensure webhook handlers (`checkout.session.completed`, `charge.refunded`, `payment_intent.*`, etc.) are idempotent and keyed by `(shop, sessionId)`, so replayed events cannot double‑create orders or refunds.
    - *Cart cookie integrity and scope*
      - Cart identity and state are protected via `@acme/platform-core/cartCookie`:
        - The cookie name is `__Host-CART_ID` (`CART_COOKIE`), set with `Path=/`, `Secure`, `HttpOnly`, and `SameSite=Lax` by `asSetCookieHeader`, which limits exposure to the current origin and mitigates some CSRF risks.
        - Cookie values are HMAC‑signed strings produced by `encodeCartCookie` using `CART_COOKIE_SECRET` from `loadCoreEnv`; `decodeCartCookie` verifies signatures with `timingSafeEqual` and returns `null` on tampering or malformed JSON (it will parse JSON payloads for backwards compatibility, but production handlers only ever store cart IDs).
        - Both the template app and cover-me-pretty run the shared `cartApi`, so the cookie stores a **cart ID** and all cart mutations go through `CartStore` abstractions (memory/Redis) on the server.
      - Best‑bet stance:
        - Continue to use `__Host-`‑style, signed cookies for cart identifiers and keep the authoritative cart state server‑side.
        - Cart cookies are **not an authentication mechanism**: they identify a basket, not a user; customer identity and permissions always come from `customer_session`/NextAuth tokens.
        - Treat any failure to verify cart cookies as “no cart”: drop the cookie, create a fresh cart, and do not attempt to recover anything from the untrusted payload or leak validation details to clients.
    - *CSRF and session interaction*
      - CMS and authenticated APIs:
        - Customer and operator sessions are handled via `@acme/auth` (`customer_session` + `csrf_token` cookies) and NextAuth for CMS (`apps/cms/src/app/api/auth/[...nextauth]/route.ts`), with rate limiting on auth endpoints.
        - CMS middleware (`apps/cms/src/middleware.ts`) enforces:
          - Role‑based access control via `@auth/rbac` (`canRead`/`canWrite`) for `/cms/**` routes.
          - A lightweight **CSRF check** for mutating `/api/**` requests (excluding NextAuth): `x-csrf-token` header must match the `csrf_token` cookie; otherwise it returns `403` before hitting handlers.
        - The `@acme/auth` session layer rotates session IDs, uses `SameSite=strict` cookies, and pairs each session with a CSRF token generated on login or first activity.
      - Storefront APIs (cart/checkout):
        - Cart and checkout endpoints (`/api/cart`, `/api/checkout-session`, `/api/rental`) are not behind the CMS middleware, but they:
          - Rely on `SameSite=Lax` `__Host-CART_ID` cookies and do not trust any client‑supplied prices or totals (server recomputes using `pricing`/`tax` modules).
          - Only create Stripe sessions or modify ephemeral cart state for the current browser; they do not expose user PII or privileged account operations, which constrains CSRF impact.
          - All money‑moving calls still require Stripe‑side SCA/3DS; a forged request cannot complete a payment without the user passing Stripe’s challenge.
        - Best‑bet for v1 is to keep storefront APIs **stateless and origin‑bound** (via SameSite cookies, CORS defaults, and only using POST/PUT/PATCH/DELETE for state changes), and:
          - When we later introduce authenticated customer endpoints (addresses, saved cards, account updates), require them to adopt the same CSRF pattern as CMS (`csrf_token` cookie + header) or a documented alternative (e.g. short‑lived bearer tokens).
    - *Logging, headers, and hardening*
      - CMS middleware already applies a set of security headers using `next-secure-headers` + `helmet`:
        - CSP defaults (`default-src 'self'`, no `object-src`, `frame-ancestors 'none'`, etc.), `Strict-Transport-Security`, `X-Frame-Options` via `frameGuard`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, `X-Download-Options: noopen`, and a tight `Permissions-Policy` (camera/mic/geo disabled).
        - In development, CSP is relaxed just enough for Next dev tooling (HMR, eval‑based source maps, etc.) while remaining stricter in production.
      - Best‑bet:
        - Keep all sensitive logs structured and free of secrets or high‑risk PII: no raw card data, full postal addresses, or full JWT/session tokens; prefer stable IDs and coarse aggregates instead.
        - Run Stripe webhooks and auth/session code on Node runtimes (not edge) by default where required, to ensure crypto and env‑loading behave predictably (we can introduce carefully constrained edge handlers later if needed).
        - For any new public API routes touching money or identity, require:
          - Idempotent server logic keyed by stable IDs.
          - Validation via shared schemas (`zod`), never trusting raw request bodies.
          - Consistent use of CSRF/session helpers if the route is tied to an authenticated user.
    - *What’s explicitly out of scope for v1*
      - We do **not** attempt:
        - To store or process raw card numbers; PCI burden for card data sits entirely with Stripe and any other PSPs we integrate via similar patterns.
        - To implement our own 3DS/SCA flows; we rely on Stripe’s flows and model them via status fields and webhooks.
        - To provide per‑shop encryption key management or custom HSM integration; secrets remain env‑driven and, in future, can be delegated to a central secrets manager without changing app‑level contracts.
- **Cart identity & cross-device behaviour**
  - Should carts be associated with user accounts across devices and merged on login, or remain purely device‑scoped?
  - How long should carts persist, and what UX expectations (e.g., “remembered basket”) should we support?
  - **Details:**
    - *V1 contract at a glance*
      - For v1, carts are **anonymous, per‑origin, per‑browser profile, and per‑shop**: they are keyed by a signed `__Host-CART_ID` cookie, are not tied to customer accounts, and are only “remembered” on that device/profile for roughly 30 days.
    - *Cart identity today (anonymous vs authenticated)*
      - Cart identity is currently **cookie‑scoped**, not account‑scoped:
        - Anonymous carts are keyed by the signed `__Host-CART_ID` cookie (see `cartCookie.ts` / `cartStore.ts`), which encodes a cart ID that maps to state kept in the shared cart store.
        - Authenticated customers are represented separately via `@auth` sessions (`customer_session` + `csrf_token`) and `CustomerProfile` records; there is no first‑class “customer cart” table yet.
      - For v1, we keep the model simple:
        - Each browser/profile has its own cart per origin, expiring after `CART_TTL` (default 30 days) via `MemoryCartStore`/`RedisCartStore`.
        - Because each storefront deployment is single‑shop and typically on its own domain/subdomain, `__Host-CART_ID` is effectively scoped to `(shopId, environment, browser profile)`; carts are not shared across shops or environments.
        - Logging in as a customer does **not** automatically merge or override carts across devices or profiles; carts remain per‑browser‑profile, per‑shop.
    - *Desired long‑term association with customers*
      - Even without implementing it immediately, we want a clear long‑term story:
        - When a customer is logged in (`getCustomerSession` returns a `customerId`), we can associate carts and orders with that ID (e.g. for “saved baskets”, subscriptions, or account views).
        - A future `CustomerCart` concept could store a server‑side snapshot keyed by `(shopId, customerId)`, with:
          - A deterministic, documented merge strategy at login (e.g. “union with last‑write‑wins quantities by SKU, then delete the anonymous cart”).
          - Explicit rules for what happens when anonymous and authenticated carts disagree.
      - For v1, we document that:
        - “Remembered basket” expectations are **per device/profile**; cross‑device cart persistence is a future enhancement.
        - Any authenticated flows (subscriptions, account swaps, saved items) should not rely on implicit cart merging; they should load state from server‑side sources (subscriptions usage, `CustomerProfile`, orders) and treat the cart as ephemeral.
        - When we do introduce customer‑scoped carts, merge logic should live in a dedicated `CustomerCart` service in `platform-core`; storefront apps should call that service and must not implement bespoke merge behaviour on their own.
    - *Persistence and expiry*
      - Cart persistence is governed by:
        - `CART_TTL` (in seconds) in core env / process env, read by `createCartStore`, which controls how long a cart is kept in memory/Redis.
        - The `__Host-CART_ID` cookie `Max-Age` (default 30 days) from `asSetCookieHeader`, which controls how long the browser keeps the cart identifier.
      - Best‑bet defaults and behaviour:
        - Keep carts for ~30 days of inactivity as a baseline “remembered basket” per browser profile, per shop.
        - Allow shops/environments to tune `CART_TTL` down for highly perishable inventory, or up where long‑lived carts are acceptable, but document that long TTLs increase the chance of stale pricing/stock.
        - If the cookie exists but the backing cart store entry has expired or been evicted, treat it as “no cart”: the server returns an empty cart (and may mint a new cart ID); the UI should simply show an empty basket rather than an error.
    - *UX implications for v1*
      - Given the above, the v1 UX contract is:
        - Guests and logged‑in customers both get a “remembered cart” on a per‑browser‑profile basis for ~30 days.
        - Logging in does **not** guarantee that the same cart will appear on another device or browser; cross‑device synchronisation is out of scope and should be communicated as such in merchant/docs copy.
        - Account pages and subscription flows (e.g. swaps, plan changes) should treat the cart as an ephemeral workspace:
          - They can populate the cart based on server‑side state (e.g. current subscription contents), but should not assume carts are authoritative.
        - The cart is a **convenience layer, not a source of truth**: durable state (orders, subscriptions, saved items, account settings) must always come from server‑side models, not from whatever happens to be in the cart at that moment.
- **Canonical cart contract & migrations**
  - How do we converge divergent cart implementations (template-app vs cover-me-pretty) onto a single canonical contract?
  - What tests and scaffolding do we need so new tenant apps always implement the same `/api/cart` and `CartProvider` contract?
  - **Details:**
    - *Canonical `/api/cart` contract*
      - **Contract:** all tenant apps must expose `/api/cart` by re‑exporting `@acme/platform-core/cartApi` (or an exact, tested equivalent), and `CartProvider` is only supported against this contract.
      - The shared cart API in `@acme/platform-core/cartApi` (as re‑exported by `packages/template-app/src/api/cart/route.ts`) is the **canonical contract** all tenant apps should implement:
        - **Routes**:
          - `POST`, `PUT`, `PATCH`, `DELETE`, and `GET` on `/api/cart`.
          - `/cms/api/cart` in CMS uses the exact same contract, with `CartContext` resolving the base path via `getCartApi`.
        - **Schemas and shapes**:
          - Request/response schemas are defined in `@acme/platform-core/cartApi` via shared zod schemas (`postSchema`, `putSchema`, `patchSchema`, plus an internal `deleteSchema`); conceptually:
            - `POST /api/cart` – add an item: body like `{ sku: { id }, qty, size?, rental? }`, returns `{ ok: true, cart }`.
            - `PUT /api/cart` – replace cart: body like `{ lines: Array<{ sku: { id }, qty, size? }> }`, returns `{ ok: true, cart }`.
            - `PATCH /api/cart` – update quantity: body like `{ id, qty }`, returns `{ ok: true, cart }`.
            - `DELETE /api/cart` – remove an item: body like `{ id }` (or an empty object to clear the cart when used by `CartProvider`), returns `{ ok: true, cart }`.
            - `GET /api/cart` – fetch current cart: returns `{ ok: true, cart }`, creating a cart if needed.
          - The `cart` in all success responses is always a `CartState` keyed by `sku.id[:size]`, matching what `CartContext` expects.
        - **Error behaviour** (normative):
          - `400` – schema/validation errors (`postSchema`/`putSchema`/`patchSchema`/`deleteSchema` failures); body is the flattened zod `fieldErrors` object.
          - `404` – unknown cart/line/SKU where applicable (`"Cart not found"`, `"Item not found"`, `"Item not in cart"`).
          - `409` – stock/size constraints (`"Out of stock"` vs `"Item not found"`, `"Insufficient stock"`).
          - In non‑validation cases, error bodies follow `{ error: string }`, which `CartProvider` surfaces as the error message for UI.
        - **Other invariants**:
          - All handlers enforce stock limits against `sku.stock`, validate payloads with shared schemas, and handle sizes consistently (error if the SKU has sizes but `size` is missing).
          - Pricing and totals are **never** trusted from the client; `/api/cart` stores SKUs/quantities/metadata only, and totals are recomputed in pricing/checkout code.
      - Tenant apps should **not** hand‑roll their own cookie‑based cart logic; instead they should:
        - Re‑export the shared handlers (`import { DELETE, GET, PATCH, POST, PUT } from "@acme/platform-core/cartApi";`) and set the runtime (`runtime = "nodejs"` where needed).
        - Ensure `CartProvider`/`CartContext` from `@acme/platform-core/contexts/CartContext` is wired into their app layout so prefab blocks (`CartSection`, `CheckoutSection`, header cart icon) behave consistently.
      - For prefab CMS blocks to “just work”, an app must satisfy **both** and is then considered **platform‑compatible** for cart/checkout:
        - Use `CartProvider` at the appropriate layout level, and
        - Expose `/api/cart` (and `/cms/api/cart` for CMS) that honours the above contract, plus a shared `/api/checkout-session` that uses the platform checkout helpers.
        - Apps that do not yet satisfy these contracts (for example, legacy or heavily forked brand apps) are **not prefab‑ready** until they converge; prefab blocks are best‑effort or explicitly unsupported there.
    - *Converging legacy implementations / preventing regressions*
      - Both template app and cover-me-pretty now ship the shared `cartApi` implementation, so there are no outstanding divergences.
      - To keep things that way (and to catch any future fork), keep a shared “cart contract” harness (e.g. `@acme/test/cartContract`) that:
        - Spins up an app and hits `/api/cart` with a matrix of scenarios (add, setQty, remove, clear, invalid payloads, stock errors).
        - Asserts responses and side effects against `@acme/platform-core/cartApi` running in isolation.
      - If a brand app ever diverges again, the convergence steps remain:
        - Wrap `/api/cart` in a thin shim that re-exports `cartApi`, or temporarily delegates while reusing shared helpers, until contract tests pass.
        - Once behaviour matches, drop bespoke logic entirely so changes happen in one place (`@acme/platform-core/cartApi`).
    - *Scaffolding and tests for new apps*
      - To keep future tenant apps aligned:
        - Provide a small **scaffold** (plop template or CLI) that:
          - Adds a `src/api/cart/route.ts` that re‑exports `@acme/platform-core/cartApi` handlers and opts into the appropriate runtime (e.g. `export const runtime = "nodejs";`).
          - Wraps the root layout with `CartProvider` (and the agreed currency provider), and demonstrates usage in header/footer/cart pages.
          - Includes an `.env.example` with `CART_COOKIE_SECRET`, `SESSION_STORE`, and any Redis env vars required for `CartStore`.
        - Add reusable tests (e.g. in `@acme/platform-core` or shared test utilities) that:
          - Hit an app’s `/api/cart` with the standard flows (add, setQty, remove, clear, GET) and assert behaviour matches the shared helpers used in `packages/template-app/__tests__/cart/*.test.ts`.
          - Cover both success paths and edge cases (missing size, stock exceeded, invalid payloads).
        - New apps are considered “CMS prefab ready” only once the cart contract tests pass.
      - Versioning and evolution:
        - Treat `@acme/platform-core/cartApi` as a versioned public API for tenant apps:
          - Breaking changes (removing fields, changing error semantics) should either:
            - Bump to a new entry point (e.g. `cartApiV2`) with updated contract tests and migration notes, or
            - Be rolled out in a coordinated way across all apps with clear documentation.
        - `cartApi` should not be treated as an internal helper that apps can “fork”; changes to it are platform‑level decisions that must respect the shared contract.
- **Checkout configuration surface**
  - Which `ShopSettings` fields are strictly required for a functioning checkout vs optional enhancements?
  - How should advanced scenarios (multi-currency, multiple tax regions, B2B pricing, customer groups) be represented in settings and supporting code?
  - How do we want merchants to configure and understand the differences between pure sale, rental, and hybrid shop behaviours?
  - **Details:**
    - *Minimum viable checkout (v1 checklist)*
      - A shop is **checkout‑ready** in v1 if all of the following hold:
        - `ShopSettings.currency` is set to a supported ISO 4217 code.
        - `ShopSettings.taxRegion` is set to a known region identifier.
        - `PAYMENTS_PROVIDER=stripe` and required Stripe env vars (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) are present for this deployment.
        - The app exposes `/api/cart` with the canonical contract from `@acme/platform-core/cartApi` and exposes `/api/checkout-session` wired to `createCheckoutSession` (or an exact, tested equivalent).
        - At least one product/SKU is available with:
          - `price` and `deposit` for rental flows, or
          - `price` for simple sale flows.
      - The configurator and CMS can treat this as the hard “checkout‑ready” gate; everything else in this section is an enhancement on top.
    - *Required vs optional settings for v1 checkout*
      - For a basic rental checkout to function, we rely on:
        - A single **base currency** and tax region per shop:
          - `ShopSettings.currency` (ISO 3‑letter code) and `ShopSettings.taxRegion` (region identifier) configured via `updateCurrencyAndTax`.
          - These feed into `createCheckoutSession` as `currency` and `taxRegion`, and into pricing displays via `useCurrency`/`convertCurrency`.
        - A working Stripe integration at the environment level:
          - `PAYMENTS_PROVIDER=stripe` plus required Stripe keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`) configured via `@acme/config/env/payments`.
        - Rental catalogue data consistent with the checkout pipeline:
          - SKUs with `price`, `deposit`, `wearAndTearLimit`, `maintenanceCycle`, and `availability` where relevant so `buildLineItemsForItem` and `computeTotals` can derive prices and deposits correctly.
      - Optional enhancements controlled by `ShopSettings` (per shop, editable in CMS):
        - **Deposit service** and late fees:
          - `depositService` (enabled + interval) and `lateFeeService` influence post‑checkout workflows (deposit release checks, late fees), but are not required to take payment.
        - **Reverse logistics and returns**:
          - `reverseLogisticsService` and `returnService` (e.g. `upsEnabled`, `bagEnabled`, `homePickupEnabled`) affect the returns experience and labels/tracking, not whether checkout itself can run.
        - **Premier delivery / shipping extras**:
          - `premierDelivery` (regions, windows, carriers, surcharge) enables premium shipping options and UI messaging; the minimum viable checkout can still operate with standard shipping.
        - **AI catalog / analytics / luxuryFeatures**:
          - `seo.aiCatalog`, `analytics`, `luxuryFeatures` and tracking settings affect marketing and analytics, not whether carts can be converted.
      - Environment‑level configuration (per deployment, owned by infra/ops):
        - Stripe keys and webhook secrets (payments, refunds, webhooks).
        - Any third‑party shipping/tax provider secrets.
      - In other words:
        - CMS/`ShopSettings` are responsible for **what checkout should do** (currency/tax, returns/deposit rules, premium delivery),
        - The environment is responsible for **how money actually moves** (Stripe keys, tax/shipping provider secrets).
    - *Single‑currency, single‑tax‑region baseline*
      - For v1 we assume:
        - Each shop runs in a **single selling currency** (`ShopSettings.currency`) and a single tax region per environment (`ShopSettings.taxRegion`), and:
          - All cart/checkout flows use that currency; any multi‑currency support is out of scope beyond cosmetic display (e.g. showing converted prices for information).
          - `getTaxRate(taxRegion)` provides a single tax rate per shop, used to compute `Tax` line items.
        - “Multi‑region”/B2B scenarios (different tax regimes, customer groups, price lists) are future work and would require:
          - Extending `ShopSettings` to include structured price list/grouping config.
          - Adapting `createCheckoutSession` to choose currency/tax based on customer or channel attributes.
      - For v1 we explicitly **do not** support:
        - Multiple selling currencies per shop,
        - Multiple tax regimes per shop,
        - Price lists per customer group / B2B tiers.
      - These require explicit model and API work and must not be hacked in via ad‑hoc flags or per‑app conditionals; the current API shape for `createCheckoutSession({ currency, taxRegion, shopId, ... })` is sufficient for v1 and advanced cases should be framed as deliberate follow‑ups, not local hacks.
    - *Expressing shop type (sale vs rental vs hybrid)*
      - Today, the system is rental‑first:
        - SKUs carry rental‑specific fields (`dailyRate`, `weeklyRate`, `monthlyRate`, `availability`) as well as `forSale`/`forRental`, and checkout metadata includes `rentalDays`, `returnDate`, and `depositTotal`.
      - Best‑bet is to treat **“shop type”** as a combination of catalogue flags and `Shop`/`ShopSettings` fields, not a separate mode switch:
        - At minimum:
          - SKUs must mark `forRental` vs `forSale`, and shops that are rental‑only should set `forSale=false` by default.
          - Additional shop‑level booleans (e.g. `shop.rentalEnabled`, future `shop.saleEnabled`) can drive which flows and UI are surfaced in configurator/checkout (which flows appear in the configurator, which entry points `/shop` vs rental configurator are exposed).
        - For v1, hybrid behaviour is possible in a limited way:
          - Rental checkout uses the existing `returnDate`/`rentalDays`/deposit model and the `RentalOrder` lifecycle described above.
          - Simple sale checkout can reuse the same infrastructure but ignore rental‑specific fields when `forSale=true` and `forRental=false`; such flows are considered **experimental** and do not yet have the same platform‑level guarantees as rentals.
      - CMS copy and configurator flows should present this as:
        - “This shop: Rental only / Sale only / Hybrid (both)”, backed by simple flags that map onto SKUs + `ShopSettings`/`Shop` shape, rather than per‑app branching.
    - *How CMS settings map into checkout UI blocks*
      - `CheckoutSection` and `CartSection` should treat `ShopSettings` as their configuration surface:
        - Currency and tax labels come from `ShopSettings.currency`/`taxRegion` (via shared hooks/context).
        - Feature flags like deposit service, late fees, premier delivery, and strict returns influence:
          - Which bits of UI are shown (e.g. deposit explanation, late fee warnings, “premier delivery available” badges).
          - Which metadata is attached to the Stripe session for downstream workers (deposit release jobs, reverse logistics, etc.).
      - The contract we want is:
        - If `ShopSettings` passes basic validation (currency, taxRegion present; required services enabled where used), then configuring `CartSection`/`CheckoutSection` in the supported **system contexts** (checkout/account routes and slots) of a platform‑compatible app that implements the canonical `/api/cart` and `/api/checkout-session` is sufficient for a working checkout.
        - Per‑shop advanced behaviour (premium shipping, stricter returns, AI catalog integration) stays an additive layer driven by `ShopSettings`, not by ad‑hoc environment flags or app‑specific config.
- **Shipping & tax integrations**
  - How do carrier/shipping methods and tax services plug in (globally vs per shop), and which parts should be configurable from the CMS?
  - How do changes to shipping/tax configuration surface in the checkout UX (available methods, prices, validation messages) without code edits?
  - **Details:**
    - *Tax calculation and configuration*
      - **Tax contract (v1)**:
        - `ShopSettings.taxRegion: string` is a **logical region key** (e.g. `"US-CA"`, `"GB"`), never a numeric rate.
        - `tax/rules.json` (per environment) is the single source of truth for tax rates:
          - Conceptually: `{ [region: string]: number }` mapping region codes to rates (e.g. `0.07` for 7%); it is environment‑level, not per‑shop.
        - The shared `tax` module in `@acme/platform-core`:
          - `getTaxRate(region)` is the only way to convert a region key into a tax percentage; it loads `rules.json` from `DATA_ROOT/../tax/` and returns a cached rate (or `0` if no rule is found).
          - `calculateTax({ provider: "taxjar", ... })` exists for future API‑backed tax calculation via `TAXJAR_KEY` and other shipping env vars, but is not required for v1 checkout.
        - `createCheckoutSession` must:
          - Read `taxRegion` from `ShopSettings` (or an explicit override in its options), then call `getTaxRate(taxRegion)`.
          - Derive a single “Tax” line item from that rate (when `taxRate > 0`).
          - Never accept tax rate/amount from the client; tax is always computed server‑side.
      - For v1:
        - Each shop uses at most **one `taxRegion` per environment**; all orders for that shop in that environment use the same region.
        - Tax rules are configured centrally via `tax/rules.json` (per environment); CMS drives *which* region a shop uses via `ShopSettings.taxRegion`, not the numeric values.
        - Tax is **shop‑scoped, not address‑scoped** in v1. Future address‑based tax and external tax APIs (`calculateTax`) must build on this contract; they do not bypass it.
    - *Shipping providers and env vs shop config*
      - Conceptually, we can think of:
        ```ts
        type ShippingProviderEnv = {
          provider: "none" | "external" | "shippo" | "ups" | "dhl";
          keys: Record<string, string>; // UPS_KEY, DHL_KEY, TAXJAR_KEY, etc.
          allowedCountries: string[];
          defaultCountry?: string;
          freeShippingThreshold?: number;
        };

        type ShopShippingConfig = {
          premierDelivery?: {
            enabled: boolean;
            regions: string[];
            surcharge?: number;
            label?: string;
          };
          returnService?: {
            upsEnabled: boolean;
            bagEnabled?: boolean;
            homePickupEnabled?: boolean;
          };
          reverseLogisticsService?: {
            enabled: boolean;
            intervalMinutes: number;
          };
        };
        ```
      - Environment‑level `ShippingProviderEnv` comes only from `loadShippingEnv` (`@acme/config/env/shipping`):
        - Validates env vars such as:
          - `SHIPPING_PROVIDER` (`"none" | "external" | "shippo" | "ups" | "dhl"`).
          - Provider API keys (`UPS_KEY`, `DHL_KEY`, `TAXJAR_KEY`) and coarse global defaults (`ALLOWED_COUNTRIES`, `LOCAL_PICKUP_ENABLED`, `DEFAULT_COUNTRY`, `DEFAULT_SHIPPING_ZONE`, `FREE_SHIPPING_THRESHOLD`).
        - These keys **must not** be stored in `Shop`/`ShopSettings`; they live purely in env and are consumed in backend services (e.g. `calculateTax`, return logistics, future rate‑shopping APIs).
      - Per‑shop `ShopShippingConfig` comes from `ShopSettings` and shop data:
        - `ShopSettings.premierDelivery` (regions, windows, carriers, surcharge, `serviceLabel`) controls whether a **premium shipping tier** is offered and how it is presented.
        - `returnService` and `reverseLogisticsService` determine returns logistics:
          - `returnService.upsEnabled` / `bagEnabled` / `homePickupEnabled` in `ShopSettings` and `shop.json` control whether UPS labels, reusable bags, and home pickup are **offered as real options** in return APIs.
          - `getReturnLogistics` + `getReturnBagAndLabel` read global return logistics config from `data/return-logistics.json`, and APIs like `apps/cover-me-pretty/src/app/api/return/route.ts` honour these settings when generating labels (e.g. UPS) and status lookups.
        - CMS exposes these via targeted actions (`updateUpsReturns`, `updateReverseLogistics`, `updatePremierDelivery`), so shop operators can toggle offerings without code changes.
      - High‑level rules:
        - CMS/`ShopSettings` decide **which shipping/returns options a shop wants to offer**; env/shipping config decides **which external providers and keys are available** to back those options.
        - All external carrier/tax calls (UPS/DHL labels, TaxJar, future rate shopping) must go through shared helpers in `@acme/platform-core` (e.g. `calculateTax`, `getReturnLogistics`, future `getShippingRates`); tenant apps must not call carrier SDKs directly.
        - Return mechanics (labels, tracking URLs, home pickup) are **order‑side behaviour** driven by `returnService`/reverse‑logistics helpers and order APIs. Page Builder blocks may explain “how returns work”, but the actual return options a customer gets come from backend logic, not CMS copy alone.
        - The only place we decide which shipping methods a customer sees at checkout should be shared checkout logic (e.g. a helper like `getAvailableShippingOptions(shop, country)`), not ad‑hoc per app or inside Page Builder blocks.
    - *How changes surface in checkout UX*
      - Checkout UI should treat shipping/tax config as two layers:
        - **Eligibility and labels** from `ShopSettings`/`Shop`:
          - Whether to show “Premium delivery”, “Free shipping over X”, or “UPS labels / home pickup available” is driven by `premierDelivery`, `returnService`, and global config from `getReturnLogistics`.
          - Which countries/regions are selectable for shipping can be filtered using `ALLOWED_COUNTRIES`/`DEFAULT_COUNTRY` and any shop‑level constraints.
        - **Price and tax computation** from shared services:
          - Shipping prices, tax line items, and any surcharges are computed server‑side (via `computeTotals`, `getTaxRate`, and future shipping‑rate helpers), never trusted from client props.
      - Shipping prices in v1 are intentionally simple:
        - A single base shipping price per environment/shop (where configured) plus:
          - An optional free‑shipping threshold (`FREE_SHIPPING_THRESHOLD`) that zeroes shipping when the order total meets/exceeds the threshold.
          - An optional `premierDelivery.surcharge` per shop for premium delivery tiers.
        - All of the above are computed server‑side in shared helpers (e.g. a `computeShippingAmount(order, shopSettings, shippingEnv)`‑style function), never trusted from client input.
      - When shipping/tax configuration is invalid or incomplete (e.g. `taxRegion` missing, `SHIPPING_PROVIDER=ups` but `UPS_KEY` unset):
        - Backend helpers should fail fast with clear, structured errors (for example an error like `"CHECKOUT_CONFIG_INVALID"` with specific issue codes) rather than silently defaulting to incorrect rates.
        - Checkout‑related blocks in CMS preview should render a friendly “Checkout not fully configured for this shop” state and link to the relevant settings panel instead of exposing broken flows.
        - Live storefronts should fail closed:
          - For **blocking issues** (e.g. missing taxRegion, missing required provider key), `/api/checkout-session` should return a 4xx configuration error and the UI should show “Checkout is temporarily unavailable” rather than attempting to create a Stripe session.
          - For **non‑blocking issues** (e.g. misconfigured premier delivery), those specific features should be disabled (no premier option rendered), while standard checkout still works.
        - In v1, misconfigured tax/shipping must never cause us to under‑charge; we prefer disabling a feature or blocking checkout over silently falling back to zero‑tax/zero‑shipping.
    - *Scope for v1 vs future work*
      - For v1 shipping & tax, we explicitly **do not** attempt:
        - Per‑shop, per‑address dynamic tax rate shopping; `getTaxRate` + `rules.json` give a single effective rate per shop/region.
        - Full carrier rate shopping across providers; shipping prices beyond `FREE_SHIPPING_THRESHOLD` and simple surcharges are static and shop‑configured.
        - Fine‑grained per‑line shipping methods (e.g. line‑level carrier selection) in the checkout contract; shipping is modelled at the order level.
      - For merchants, the v1 story is deliberately simple:
        - One effective tax rate per shop/region.
        - Static, shop‑configured shipping prices (beyond simple thresholds and surcharges).
        - Order‑level shipping methods only; no per‑line carrier selection or location‑based rate shopping yet.
      - Future improvements should layer on top of:
        - `loadShippingEnv` for provider credentials/allowed regions.
        - `ShopSettings.premierDelivery`, `returnService`, and `reverseLogisticsService` for per‑shop strategy.
        - `calculateTax` and future shipping‑rate helpers as the only place that talks to external tax/shipping APIs, with clear contracts back into checkout/order code.
- **Customer identity model**
  - What is the relationship between carts, orders, and customers (guest vs logged‑in), and how should carts be merged or preserved on login?
  - Which flows must work for guests, and which require authenticated customers (e.g., subscription management, saved payment methods, order history)?
  - **Details:**
    - *Identity surfaces and core models*
      - We distinguish three main identities:
        - **CMS operators** – NextAuth users with roles (`admin`, `ShopAdmin`, etc.) for `/cms/**`; not directly relevant to storefront carts/checkout.
        - **Storefront customers** – represented by `CustomerSession` (`customer_session` cookie managed by `@auth/session`) containing `{ customerId, role }`; used by account APIs and subscription flows.
        - **Anonymous visitors** – no `CustomerSession`; identified only by cart cookies and Stripe session IDs.
      - Persistent customer data lives in:
        - `User` records (auth/users module) for credentials/email verification, and
        - `CustomerProfile` (`customerId`, `name`, `email`) for per‑shop contact details (`getCustomerProfile`/`updateCustomerProfile`).
      - Orders link back to customers via the optional `customerId` field on `RentalOrder`; `getOrdersForCustomer(shop, customerId)` is the primary read path for account order history.
    - *Relationship between carts, orders, and customers*
      - Carts:
        - Are always **anonymous, cookie‑scoped** (see the Cart identity section): `__Host-CART_ID` identifies a basket per browser/origin/shop; carts are not tied to customer accounts in v1.
        - `CartProvider` and `/api/cart` do not know about `customerId`; they only manage SKU/qty/metadata.
      - At checkout:
        - When a customer is logged in, APIs like `/api/checkout-session` and `/api/account/profile` call `getCustomerSession()` and pass `customerId` into `createCheckoutSession` and later into `addOrder`; the resulting `RentalOrder` rows have `customerId` populated.
        - When a customer checks out as a guest (no `CustomerSession`), `customerId` is omitted; orders still exist keyed by `(shop, sessionId)`, but are not associated with an account.
      - After checkout:
        - Account‑level views (e.g. `apps/cover-me-pretty/src/app/account/orders/page.tsx` and `/api/orders` routes) use `getCustomerSession` + `getOrdersForCustomer(shop, customerId)` to list and manage orders (including cancellations/refunds) for authenticated customers.
        - Guest orders can be surfaced via order‑ID+email flows or support tooling later, but there is no automatic “attach past guest orders when someone signs up” logic in v1.
    - *Guest vs authenticated flows (v1)*
      - Must work for guests:
        - Browsing, cart operations, and checkout for one‑off rentals/sales.
        - Returns initiated via generic channels (e.g. `/[lang]/returns` page, email support) where the customer supplies order/session identifiers.
      - Require authenticated customers (`getCustomerSession`):
        - Account pages (`/account/**`), order history (`/api/orders`, `/api/orders/[id]`), and order detail/tracking UIs.
        - Profile management (`/api/account/profile`) built on `CustomerProfile`.
        - Subscription flows (e.g. `/[lang]/subscribe`, swaps in `/account/swaps`) which assume a stable `customerId` across billing periods.
      - For v1:
        - Logging in **does not** merge or resurrect carts across devices; carts remain per‑browser‑profile, per‑shop, and account flows rely on server‑side models (`RentalOrder`, `CustomerProfile`, subscription usage), not the cart.
    - *Cart merging and preservation on login*
      - In v1 there is no cart merging on login:
        - If a user adds items as a guest and then logs in, they keep whatever cart is associated with their current browser’s `__Host-CART_ID`; no additional “customer cart” is pulled from the server.
        - Other devices/browsers where the customer is logged in maintain their own anonymous carts; there is no cross‑device or cross‑browser cart synchronisation.
      - Future work (outlined in the Cart identity section) may introduce a `CustomerCart` service keyed by `(shopId, customerId)` with deterministic merge semantics, but until then:
        - **Orders and subscriptions**, not carts, are the source of truth for “what this customer has bought or rented”.
    - *Design rules for new features*
      - When adding new customer‑facing APIs or flows:
        - Treat `customerId` from `getCustomerSession()` as the only trusted customer identifier; never accept `customerId` from request bodies or query params.
        - For features that need to work for both guests and logged‑in users (e.g. returns), design the flow so:
          - Guests authenticate by a combination of order IDs/session IDs and PII (e.g. email), and
          - Logged‑in customers use `customerId` to filter and manage their own orders.
        - Keep the invariant that **anonymous carts may be discarded at any time** without breaking core accounting: once an order exists, its lifecycle and customer association must not depend on the cart that created it.
- **Test strategy for money flows**
  - What automated tests (unit/integration/E2E) are required to treat prices, taxes, discounts, and refunds as “safety‑critical”, especially around Stripe webhooks?
  - Which invariants (e.g., totals matching Stripe, no negative totals, idempotent webhook handling) must be covered by tests before changes ship?
  - **Details:**
    - *Core invariants to protect*
      - We treat the following as **non‑negotiable** invariants for money flows, and they should be copied verbatim into unit/contract tests:
        - For every checkout:
          - `lineItem.subtotal >= 0`.
          - `discountTotal >= 0`.
          - `taxTotal >= 0`.
          - `grandTotal >= 0`.
        - For every order (per Stripe checkout session):
          - `capturedAmount >= grandTotal` (we never charge less than the order total).
          - `0 <= refundTotal <= capturedAmount`.
          - `damageFee + lateFeeCharged + refundTotal <= capturedAmount + extraCharges`.
        - For Stripe webhooks:
          - `checkout.session.completed` can be replayed arbitrarily; we still end up with exactly **one** order per `(shop, sessionId)` (idempotent `addOrder` keyed on session id).
          - `charge.refunded` (and related refund events) can be replayed; we never create more Stripe refunds than allowed for the underlying charge/payment, and `refundTotal` never grows past `capturedAmount`.
        - For pricing and tax:
          - `getTaxRate(taxRegion)` is the only place a region becomes a tax percentage, and `createCheckoutSession` is the only place that turns that into a “Tax” line item.
          - Pricing is always recomputed server‑side based on SKUs, ShopSettings, and tax rules; we never trust client‑provided totals or tax amounts.
    - *Unit tests (pricing/tax/orders/refunds)*
      - Unit tests should cover:
        - Pricing and discounts:
          - `pricing` helpers (e.g. rental day calculation, discount application) with representative SKUs: bundle cases where coupons apply and where they don’t, and verify totals match expectations.
          - Rounding and currency edge cases where conversion + tax + discounts stress rounding (e.g. `0.3333…` tax or exchange rates), asserting that `computeTotals`, the Stripe payload, and the persisted `RentalOrder` all agree to the cent.
        - Tax rules:
          - `tax/rules.json` + `getTaxRate` for representative regions (e.g. `"US-CA"`, `"GB-LND"`) and ensure unknown regions yield `0`.
          - A small contract test that ensures `rules.json` maps region codes to numeric rates in the expected range and that `getTaxRate` never throws due to malformed entries.
        - Rental date math:
          - Helpers that compute rental periods and late‑fee windows should be tested around “ends at midnight”, DST boundaries, and “same day vs next day” so that `rentalDays` is correct and can’t go negative.
        - Orders & refunds (`orders.creation`, `orders.refunds`, `orders.risk`):
          - `addOrder` idempotency on `(shop, sessionId)`; repeated calls with the same session id produce a single order.
          - `refundOrder` calculations: `refundTotal` never exceeds captured total; partial vs full refunds behave as expected; errors from Stripe are handled and do not corrupt order state.
        - Stripe webhook handlers:
          - `stripe-webhook` tests for each handled event (`checkout.session.completed`, `charge.refunded`, `payment_intent.*`, subscription events) to assert correct calls into orders/subscriptions modules and **idempotent behaviour**:
            - Feed the same fixture event 2–3 times and assert that:
              - The number of orders created stays at 1.
              - The number of Stripe refunds created stays at 1.
              - Order totals and statuses don’t “double‑advance”.
            - Also test out‑of‑order events (e.g. `charge.refunded` arriving before `checkout.session.completed`), ensuring we either no‑op and log or handle gracefully once the order exists, but never crash or corrupt state.
    - *Integration tests (API routes and flows)*
      - Use MSW and integration tests around key API routes:
        - `/api/cart` contract tests (already present) to ensure stock/size constraints, error codes, and cart shapes behave correctly.
        - `/api/checkout-session`:
          - Successful path with a simple cart and valid `ShopSettings` (currency/taxRegion) and Stripe env; assert the shape of the Stripe session payload (metadata, line items, tax line).
          - At least one **“golden payload”** test that builds a small fixture cart + `ShopSettings`, calls the route, and asserts that the Stripe checkout request includes exactly the expected fields (line item prices/quantities, tax behaviour, metadata such as `shopId`, `sessionId`, `rentalDays`).
          - Failure when configuration is missing or invalid (e.g. `taxRegion` unset, Stripe env incomplete), expecting a typed configuration error rather than a generic 500.
        - `/api/rental` and account/order APIs:
          - Ensure that completing a checkout leads to `addOrder` being called once, and that order lifecycle operations (cancel, mark delivered, refund) produce expected state changes and Stripe interactions.
      - For CMS flows, Cypress specs (or equivalent) should exercise:
        - A full “configure shop → add to cart → checkout → see order in account” path in at least one tenant app, backed by MSW/Stripe mocks.
        - Edge cases such as invalid return dates, invalid coupons, and inventory failures at checkout to ensure the UI surfaces errors and logs consistently.
    - *End‑to‑end and contract tests*
      - E2E tests (via Cypress and MSW) should focus on:
        - A **happy‑path checkout** for at least one shop per “platform‑blessed” app (template app plus at least one tenant app), with assertions on:
          - Cart behaviour (adding/removing items, stock errors).
          - Checkout form validation and Stripe flow (using mocked Stripe).
          - Order visibility in `/account` for authenticated customers.
        - A **refund flow** where an operator triggers a refund via CMS or an API and the end‑to‑end effects are observed:
          - Stripe mock records the refund.
          - `RentalOrder.refundTotal` and `refundedAt` (or equivalent refund event records) are updated.
          - Account UI reflects the refund status.
      - We should also maintain **contract tests** for shared public APIs:
        - `/api/cart` (as described earlier) and `/api/checkout-session`, asserting that any app implementing them behaves identically to the template app for a suite of scenarios, including:
          - Consistent error semantics for invalid configuration (e.g. `CHECKOUT_CONFIG_INVALID` for missing `taxRegion` or bad Stripe env).
          - Explicitly ignoring any bogus client‑supplied totals or tax amounts.
        - Stripe webhook handler (`handleStripeWebhook`) using fixture events to ensure risk/refund/subscription paths stay correct and idempotent as code evolves.
    - *Where not to over‑test*
      - Given repo size, we do **not** need:
        - Full cross‑product combinatorial tests; representative SKUs and flows are sufficient.
        - End‑to‑end coverage of every edge case in both template and all tenant apps; focus deep coverage on shared modules and a small number of canonical flows per app.
      - The priority is to keep:
        - Shared money‑critical modules (pricing, tax, orders, refunds, Stripe webhooks) well‑unit‑tested, and
        - A small, reliable set of E2E scenarios that exercise end‑user flows from cart through checkout to order history.

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
    - In line with the shop‑registry best‑bet, this filesystem‑based discovery is expected to remain a **dev‑only convenience**; in shared environments, `/cms/live` should ultimately derive its shop list from the Prisma `Shop` registry and merely attach “has local runtime” signals based on `apps/shop-<id>`.

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
    - CMS saves pages via `apps/cms/src/actions/pages/service.ts` → `@acme/platform-core/repositories/pages/index.server.ts`, which persists to Prisma or JSON and tracks diffs.
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

- **Preview token model (codified in code/docs; rotation still open)**
  - Current state in code/docs:
    - `docs/preview-flows.md` and the Cloudflare/Next preview routes (`apps/cover-me-pretty/src/routes/preview/[pageId].ts`, template app `/preview/[pageId]`) define HMAC-based tokens for runtime preview, scoped to `(env, shopId, pageId)` using `PREVIEW_TOKEN_SECRET` / `UPGRADE_PREVIEW_TOKEN_SECRET`.
    - Tokens are not stored; both normal and upgrade previews recompute and verify a base64url-encoded HMAC SHA‑256 over `\`${shopId}:${pageId}\`` per request.
  - Remaining gaps:
    - Operational practices around secret rotation and explicit token revocation (beyond changing secrets) are still design-only.
  - **Details:**
    - *Runtime preview tokens (`/preview/:pageId`)* 
      - The template app’s `/preview/:pageId` endpoint uses **HMAC tokens** derived from the shop + page identity and env secrets:
        - `PREVIEW_TOKEN_SECRET` and `UPGRADE_PREVIEW_TOKEN_SECRET` in `coreEnv` are **per‑environment** secrets; dev/stage/prod must never share the same secret.
        - Tokens are **not stored**; instead:
          - Define a canonical payload string: `payload = \`\${shopId}:\${pageId}\``.
          - For “normal” preview, `token = base64url(HMAC_SHA256(payload, PREVIEW_TOKEN_SECRET))`.
          - For upgrade previews, `upgrade = base64url(HMAC_SHA256(payload, UPGRADE_PREVIEW_TOKEN_SECRET))`.
          - Token format: base64url of the full 32‑byte SHA‑256 digest, without padding.
        - The route reads `shopId` (from `NEXT_PUBLIC_SHOP_ID` or equivalent) and `pageId`, recomputes the HMAC over `"\${shopId}:\${pageId}"`, and verifies tokens via a timing‑safe comparison (`timingSafeEqual`).
      - Contract (v1):
        - **Input to the HMAC MUST always include `shopId`**: we never hash `pageId` alone; runtime preview tokens are therefore scoped to `(env, shopId, pageId)` by construction.
        - Tokens are base64url‑encoded HMAC digests over at least 256 bits of entropy (full SHA‑256), making them effectively unguessable.
        - Tokens grant **read‑only** access to page JSON for runtime preview; they never allow writes or configuration changes.
        - Runtime `/preview/:pageId` URLs should only ever be constructed by CMS‑side helpers or CLI tooling; preview tokens are never generated on the client.
        - Rotating `PREVIEW_TOKEN_SECRET` / `UPGRADE_PREVIEW_TOKEN_SECRET` acts as an environment‑wide **“kill switch”** for all runtime preview URLs for that environment; individual page‑level revocation is not supported in v1.
        - CMS tooling and scripts that generate preview URLs should always compute tokens using this canonical HMAC pattern; no app should invent its own token format for `/preview/:pageId`.
        - Behaviour on failure:
          - If the token verification fails for a given `(shopId, pageId)`, the endpoint returns `401 Unauthorized`.
          - If the token is valid but no page is found for `(shopId, pageId)`, the endpoint returns `404 Not Found`.
          - `/preview/:pageId` should never appear in sitemaps, and any HTML variants of preview routes must set `X-Robots-Tag: noindex` (or equivalent) so they are not accidentally indexed.
      - Future evolutions (optional):
        - If we need per‑page expiry, we can extend the scheme to include timestamps or use a small server‑side store keyed by `(token, pageId)`; but v1 keeps things simple and relies on secret rotation plus limited distribution.
    - *Versioned preview tokens (`/cms/api/page-versions/preview/:token`)* 
      - CMS page‑version previews use **link tokens** stored server‑side:
        - Tokens are generated using a cryptographically strong RNG (e.g. `crypto.randomUUID` / `crypto.randomBytes`), and never derived from predictable data like IDs.
        - Each token carries at least 128 bits of entropy (for example 16 random bytes encoded as base64url, or a UUIDv4).
        - The raw token string is used directly as the key in `page-preview-links.json`; there is no further derivation step.
        - `data/cms/page-preview-links.json` maps opaque `token` strings to `{ shop, pageId, versionId, createdAt, passwordHash?, revokedAt? }`.
        - `data/cms/page-versions.json` stores the actual version payloads (`components`, `editor`, etc.) keyed by `shop` and `pageId`.
        - `/cms/api/page-versions/preview/:token`:
          - Looks up the link by token; 404s if missing or flagged as revoked.
          - If `passwordHash` is present, requires a matching `pw` query param (hashed with SHA‑256) or returns 401; password comparisons should be performed using a timing‑safe/constant‑time comparison.
          - Returns a JSON payload with `shop`, `pageId`, `versionId`, `label`, `timestamp`, `components`, and optional `editor`.
      - Contract (v1):
        - Tokens are **opaque**, per‑link identifiers; they are not HMACs and are safe to share as long as the link exists and is not revoked.
        - Scope is per `(shop, pageId, versionId)`; each token points to exactly one version.
        - Revocation is handled by:
          - Marking the token entry as revoked (e.g. setting `revokedAt`) and treating any token with a non‑null `revokedAt` as invalid, or by removing it from `page-preview-links.json` via CMS tooling or admin scripts.
          - Optionally tightening access with a password (set `passwordHash`).
        - V1 does not enforce automatic expiry, but `createdAt` is available to implement time‑based expiry or cleanup jobs; in future we can:
          - Treat links older than N days as invalid at read time, and
          - Run a periodic cleanup job that hard‑deletes entries older than N days (or N days after `revokedAt`).
    - *Preview safety and hygiene*
      - General rules for preview tokens:
        - Treat preview endpoints as **read‑only** surfaces; they should never allow mutations or expose secrets.
        - Do not log full tokens in application logs; when needed, log only hashed identifiers (for example log `tokenHash = SHA-256(token)` alongside `{ shopId, pageId }`), and never the raw token or even its prefix.
        - For runtime `/preview/:pageId`, distribution of HMAC tokens should be limited to trusted CMS/editor surfaces and internal tooling; public/shareable links for non‑technical stakeholders should favour CMS versioned previews, which can be revoked individually and optionally password‑protected.
      - If a preview token leaks:
        - For `/preview/:pageId`, rotate the relevant secret (`PREVIEW_TOKEN_SECRET` or `UPGRADE_PREVIEW_TOKEN_SECRET`) to invalidate all HMAC tokens in that environment, and ensure any cached preview URLs in CMS UI are regenerated using the new secret.
        - For versioned CMS previews, mark the specific token as revoked (and, if necessary, change any associated password); periodic cleanup can later remove old revoked entries.
- **Caching & revalidation**
  - How should CMS edits trigger revalidation or cache invalidation in runtime apps (ISR, `revalidatePath`, CDN purge)?
  - Do preview endpoints bypass caches entirely, or share them cautiously, and how do we guarantee live storefronts are not serving stale CMS-managed content?
  - **Details:**
    - *Baseline caching model*
      - For runtime pages that render CMS‑managed content (including any future CMS page route and PB‑driven slots), the default should match existing product/blog behaviour in the template and tenant apps: **static generation with `export const revalidate = 60`** so that content is at most ~60 seconds stale and aligns with the top‑level SLA.
      - Commerce‑critical APIs and pages that depend on highly dynamic data (cart, checkout session creation, account dashboards, order tracking) should remain **fully dynamic** using `cache: "no-store"` in `fetch` calls or equivalent, so they always see the latest prices, inventory, and auth state.
    - *How CMS edits trigger revalidation*
      - Only **publish‑like** CMS actions that change live content should trigger revalidation:
        - Page publish/unpublish (and visibility toggles that affect live routing).
        - Shop settings changes that affect layout/SEO/navigation or theme.
        - Other configuration that influences what runtime apps render (e.g. enabling/disabling PB slots on system pages).
      - Draft saves, autosaves, and purely local editor state must **not** trigger revalidation; they are only visible via preview endpoints.
      - All publish‑like actions should call a **shared invalidation helper** in platform/UI, conceptually:
        - 
          ```ts
          type InvalidationScope =
            | "pages"
            | "seo"
            | "navigation"
            | "theme"
            | "all";

          async function invalidateShopContent(
            shopId: string,
            scope: InvalidationScope,
          ): Promise<void> {
            // v1: use revalidatePath() for a small, well-defined set of routes per scope.
            // future: use revalidateTag(`shop:${shopId}:${scope}`) tags instead of paths.
          }
          ```
        - CMS actions call `invalidateShopContent(shopId, scope)` rather than sprinkling `revalidatePath`/`revalidateTag` calls throughout the codebase.
      - In v1, `invalidateShopContent` can be implemented in terms of **path‑based** revalidation (`revalidatePath`) for a small, well‑defined set of routes per shop (for example `/[lang]`, `/[lang]/shop`, `/[lang]/product/[slug]`, and any future `/[lang]/pages/[slug]`), plus the relevant CMS settings pages; this keeps behaviour predictable and testable.
      - As we adopt Next’s tag‑based caching more widely, runtime pages that consume CMS data should opt into **`revalidateTag` keyed by shop and concern** (e.g. `shop:${shopId}:pages`, `shop:${shopId}:seo`, `shop:${shopId}:navigation`, `shop:${shopId}:theme`), and `invalidateShopContent` should fan out to the appropriate tags instead of paths; tenant apps should not bypass this helper with ad‑hoc invalidation logic.
    - *Preview vs live caching*
      - Preview UIs in both the template app and tenant apps already fetch from `/preview/:pageId` with `cache: "no-store"`, and preview APIs should continue to send **`Cache-Control: no-store, max-age=0`** at the edge (Cloudflare) so preview responses are never cached by CDNs or browsers.
      - Preview routes in app land (template and tenant apps) should be marked as dynamic (e.g. `export const dynamic = "force-dynamic"` or equivalent) to bypass Next’s route cache explicitly.
      - Any `fetch` used by preview pages or APIs must use `{ cache: "no-store" }` so that neither the Next data cache nor CDNs cache preview data.
      - CMS versioned previews (`/cms/api/page-versions/preview/:token`) should likewise be treated as **strictly non‑cacheable**, as they are development/editor tools rather than production content; any intermediate proxies should bypass caching for these routes.
      - Live storefront routes remain cacheable according to their `revalidate` / ISR settings; preview traffic should not share or poison those caches.
    - *Guarantees and failure modes*
      - The operational SLO is: **for any successfully published CMS change, all live storefront views of that content converge within ≤ 60 seconds** under normal operation, either via the route’s `revalidate` interval or explicit invalidation from CMS; we favour slightly stale content over brittle zero‑TTL setups.
      - If `invalidateShopContent` fails (e.g. `revalidatePath` throwing because the static generation store is absent, as already handled defensively in SEO services), the failure should be logged with shop context and a stable `operationId`, but treated as **non‑fatal**; the next scheduled `revalidate` window will still pick up changes.
      - Over time, we may expose a lightweight health signal (admin panel or endpoint) that surfaces “last invalidation for shop X failed at time T”, to aid debugging when someone reports “I published and nothing changed”.
      - CDN‑level cache configuration (Cloudflare/Vercel) should mirror this model: allow caching for GETs on runtime routes with an effective TTL around 60 seconds, and explicitly disable caching for preview and sensitive POST/PUT/PATCH endpoints.

- **CMS page routing (direction chosen; not yet implemented)**
  - Current state in code:
    - Runtime apps currently only expose explicit system routes (`/[lang]/shop`, `/[lang]/product/[slug]`, `/[lang]/checkout`, `/account/*`, `/[lang]/returns`, etc.) and do not implement a generic CMS marketing route such as `/[lang]/pages/[slug]`.
  - Remaining gaps:
    - Implementing the shared CMS marketing route shape and slug validation described below across the template app and tenant apps.
  - **Details:**
    - *Canonical route shape for CMS pages*
      - For v1, the canonical shape for CMS‑driven **marketing** pages in runtime apps should be **`/[lang]/pages/[slug]`**, where:
        - `lang` is one of the shop’s configured languages (as today for `/[lang]/shop`, `/[lang]/product/[slug]`).
        - `slug` is a flat slug (no `/`), stored on the `Page` as a per‑page, single‑locale field (per earlier i18n decision: content/SEO is per‑locale, slugs remain single‑locale per page in v1).
      - Core legal pages (e.g. returns, terms, privacy) are still stored as `Page` records with `pageType = "legal"`, but are served via **explicit routes** such as `/[lang]/returns` that look up the appropriate `Page` by a fixed legal identifier rather than by slug.
      - Nested paths (`/foo/bar`) can be modelled as a convention on `slug` (e.g. storing `"foo-bar"` and deriving breadcrumbs from content) rather than as nested folders in the route; true nested paths are a **future** extension and would require explicit migration and conflict checks.
      - Per shop, `slug` must be unique across all `Page` records with `pageType === "marketing" | "legal"` (even though legal pages are not routed under `/pages/[slug]`), so navigation and routing logic can treat slugs as unique identifiers within that scope.
    - *Reserved prefixes and conflict avoidance*
      - The template app and tenant apps already use explicit system routes under known prefixes (e.g. `/[lang]/shop`, `/[lang]/product/[slug]`, `/[lang]/checkout`, `/account`, `/returns`, `/success`, `/cancelled`); these prefixes should be treated as **reserved** and not usable as CMS page slugs.
      - Contract: PB/CMS “marketing/legal” pages may only occupy slugs that do **not** collide with:
        - System commerce routes (`shop`, `product`, `checkout`, `subscribe`, `account`, `returns`, `success`, `cancelled`, `api`, `preview`, `upgrade-preview`, etc.).
        - Any hand‑authored app routes under `src/app` for a given app.
      - The path segment `pages` itself is reserved for CMS marketing pages: apps should not define conflicting routes under `/[lang]/pages/**` that bypass the shared CMS routing layer.
      - CMS should enforce this by:
        - Validating new/edited page slugs against a known **reserved list** (shared via a small configuration module in the template app, conceptually:
          - 
            ```ts
            export const RESERVED_SLUGS = [
              "shop",
              "product",
              "checkout",
              "subscribe",
              "account",
              "returns",
              "success",
              "cancelled",
              "api",
              "preview",
              "upgrade-preview",
              "pages", // reserved segment for CMS marketing pages
            ];
            ```
          )
          and a per‑app route manifest (either a generated JSON of `src/app` routes at build time, or a small hand‑maintained config listing extra reserved slugs owned by that app), and
        - Refusing to publish pages whose slugs would collide with system routes, surfacing a clear error to editors.
    - *Runtime wiring for CMS routes*
      - The template app should introduce a single dynamic server route, conceptually `packages/template-app/src/app/[lang]/pages/[slug]/page.tsx`, that:
        - Resolves `lang` and `slug`, then looks up the `Page` for the current `shopId` and slug via a helper such as `getPageBySlug(shopId, slug)` in `@acme/platform-core/repositories/pages`.
        - Restricts to pages where `pageType === "marketing"`, `status === "published"`, and visibility flags indicate the page should be live; all other cases should return `notFound()` to avoid leaking drafts or non‑marketing types.
        - Implements `generateStaticParams` to pre‑render all published marketing pages for each language and sets `export const revalidate = 60;` so the route’s caching behaviour matches the global CMS content SLO.
        - Renders the page via the same `DynamicRenderer`/layout shell as preview, wrapped in the app’s standard layout (`[lang]/layout.tsx`) so header/footer/nav and theme remain consistent.
      - Legal routes (e.g. `/[lang]/returns`) should remain explicit and use a separate helper such as `getLegalPage(shopId, "returns")` that internally resolves a `Page` with `pageType = "legal"` and a known key/slug, then renders via the same PB/SEO pipeline.
      - Tenant apps that want to support CMS marketing/legal pages should either:
        - Re‑export the template app’s implementation of `/[lang]/pages/[slug]`, or
        - Implement an equivalent route that calls the same repository helpers (`getPageBySlug`, `getPageSeo`, `getLegalPage`) and uses the same `DynamicRenderer`/block registry, so PB blocks behave uniformly.
    - *Migration story for existing apps*
      - Existing template and tenant apps today rely on explicit routes like `/[lang]`, `/[lang]/shop`, `/[lang]/product/[slug]`, and there is no generic CMS page route; introducing `/[lang]/pages/[slug]` is additive and does **not** break those routes.
      - CMS can start by:
        - Allowing `Page.pageType === "marketing"` to opt into the `pages` route shape via a new `slug` field and a “published” flag.
        - Keeping legacy marketing content as code (e.g. the current home page and shop index) while new CMS pages live under `/[lang]/pages/*`.
      - Over time, we can migrate specific marketing pages (e.g. “About”, “FAQ”, “Returns policy”) by:
        - Creating PB pages with the desired content and SEO under `/[lang]/pages/...`, and
        - Updating nav/footer links (from `Shop.navigation`) to point to those routes.
      - The `/[lang]/pages/[slug]` route can be present in all apps by default; a given shop only “opts in” once it has at least one `Page` with `pageType = "marketing"`, a published `slug`, and navigation linking to it. Until nav points at those pages, they are effectively dark.
      - For backward‑compatibility and SEO, any future move to make the **home page itself PB‑driven** should be handled explicitly (e.g. by wiring a specific `Page` as the home route, not by overloading `/[lang]/pages/[slug]`).
    - *Relationship to page types and SEO*
      - `Page.pageType` continues to govern what kinds of blocks and layouts are allowed; the routing rule is:
        - System commerce pages (`"system"`/`"commerce"` types) keep their explicit routes (PDP, PLP, checkout, account).
        - `"marketing"` PB pages live under `/[lang]/pages/[slug]` by default in v1.
        - `"legal"` PB pages are looked up by a fixed key (e.g. `"returns"`, `"terms"`, `"privacy"`) and served via explicit routes such as `/[lang]/returns`; they may still have slugs for CMS purposes, but routing does not depend on them.
        - `"fragment"` pages remain non‑routable, used only as slots/fragments embedded in other pages.
      - SEO for PB pages follows a single `Page.seo` → `generateMetadata` mapping:
        - The `/[lang]/pages/[slug]` route should resolve the `Page` via something like `getPageBySlug(shopId, slug)` and then call a helper (e.g. `getPageSeo(shopId, slug, lang)`) so metadata and PB content stay in sync and reuse the same i18n/alternate‑language wiring as product/blog routes.
        - Legal routes such as `/[lang]/returns` should call the same SEO helper under the hood (e.g. via `getLegalPage` → `getPageSeo`), keyed by the legal page ID instead of the slug, so all PB‑backed pages share the same SEO logic regardless of route shape.
- **Header/footer/nav as content**
  - Should header/footer/navigation be first-class CMS entities, with support for multiple variants and per-page overrides?
  - How do we reconcile `Header`’s current dependency on `shop.json` (JSON backend) with the Prisma-backed shop repository to avoid source-of-truth skew?
  - **Details:**
    - *Source of truth for navigation*
      - `Shop.navigation` (and related `home*` fields) should remain the **single source of truth** for top‑level navigation in runtime apps, consistent with the persistence model:
        - In production and other shared environments, **Prisma `Shop` is canonical**; `shop.json` is a snapshot/export only. Header/Footer in those environments must not read JSON directly.
        - In local/offline JSON mode (`SHOP_BACKEND=json`), `shop.json` becomes canonical and the shop repositories resolve to JSON under the hood.
        - CMS manages `Shop.navigation` via shop settings forms that always go through repositories (`fetchShop`/`persistShop`), which abstract over Prisma vs JSON.
        - Runtime `Header`/`Footer` components should be migrated to use the same consolidated repository (e.g. `getShop(shopId)` from `@acme/platform-core/repositories/shops.server`) rather than JSON‑specific helpers like `readShop`, so there is a single code path for reading navigation in all environments.
        - Over time, JSON‑only helpers such as `readShop` should be treated as deprecated for new code in favour of repository functions, to avoid re‑introducing skew between backends.
      - In v1, navigation is **shop‑level**, not per‑page: the same nav is rendered for all pages of a given shop, with the exception of context‑specific highlights (e.g. “current page” styling) handled in the layout, not by duplicating nav structures per page.
    - *Header/footer as CMS‑driven layout with system slots*
      - Header and footer remain **code‑defined layout components** in `@acme/ui` with a small number of CMS‑driven slots:
        - Header:
          - Uses `Shop.navigation` to render primary links; nav items are stored as data in `Shop` and rendered by layout code.
          - Encapsulates system elements such as logo, cart icon, account link, and search trigger as fixed slots, not editable blocks; CMS can toggle visibility via flags in `ShopSettings` (e.g. `showAccountLink`, `enableSearch`) rather than arbitrary customisation.
          - Localisation:
            - Nav item labels are stored as per‑locale values (conceptually `Record<Locale, string>`) and normalised/fill‑filled at write‑time via the same `fillLocales` logic used elsewhere, so every label has a value for required locales.
            - At render‑time, `Header` picks the label for the current `lang` (falling back to `en` or the first available value), and there is no per‑page custom label; nav i18n is shop‑level and consistent.
        - Footer:
          - Renders a fixed layout for legal links (privacy, terms), which are wired to explicit legal routes (`/[lang]/legal/privacy`, `/[lang]/legal/terms`) backed by `Page.pageType = "legal"`.
          - CMS controls labels and targets via `ShopSettings.seo` and legal `Page` content; the footer component remains a thin shell over those.
      - We **do not** make header/footer fully free‑form PB areas in v1; instead:
        - PB can manage marketing content near the top/bottom of pages (hero sections, promos) within `<main>`, while header/footer remain stable for accessibility and performance.
        - Future experiments with “PB‑driven header/footer variants” must layer on top of this, e.g. via a small set of variant configs or a limited PB slot inside the header, not full replacement.
    - *Per‑page nav nuances*
      - Per‑page overrides for navigation are kept intentionally narrow in v1:
        - A page may mark itself as “hide from nav” or “highlighted” via simple flags in `Page` metadata that affect how `Shop.navigation` entries are rendered or filtered (e.g. hide a link whose URL points at an unpublished page).
        - We avoid per‑page bespoke nav trees; instead, nav entries link to CMS pages (including `/[lang]/pages/[slug]` and legal routes) and the header uses the current request path to determine active state.
      - Contract‑wise this can be thought of as a small `PageMeta` shape:
        - 
          ```ts
          interface PageMeta {
            hideFromNav?: boolean;
            highlightInNav?: boolean;
            layoutVariant?: "default" | "minimal" | "campaign";
          }
          ```
        - `Header` may read `layoutVariant` to switch between a small set of header variants (e.g. default vs minimal), but it never swaps out the nav structure or core controls based on a page; only styling and minor toggles change.
    - *Reconciling JSON vs Prisma for header data*
      - To avoid source‑of‑truth skew:
        - CMS should always read/write navigation and header‑related properties (`navigation`, `homeTitle`, `homeDescription`, `homeImage`, `domain`, etc.) via **platform repositories** (`fetchShop`/`persistShop`), which already abstract over Prisma vs JSON.
        - Runtime `Header`/`Footer` should be updated to use the same consolidated repository (`getShop(shopId)` from `@acme/platform-core/repositories/shops.server`) instead of the JSON‑only `readShop`, so both CMS and runtime agree on the same `Shop` shape.
      - Any future schema changes to `Shop.navigation` (e.g. adding icons, badges, or deep‑link metadata) must be reflected in:
        - The shared `Shop` type in `@acme/types`, and
        - A migration path for existing `shop.json` files and Prisma rows, keeping `Header`/`Footer` logic stable.
    - *Where Page Builder fits*
      - PB remains responsible for the **content inside `<main>`** (marketing sections, content bands, promos) and does not attempt to control the global shell (header/footer/nav) in v1:
        - Navigation items link **into** PB pages via their URLs.
        - PB blocks can include “secondary nav” (e.g. section tabs, content tables of contents) within a page, but those are independent from `Shop.navigation`.
      - If we ever need “header promo” / “footer promo” content, a future‑proof pattern is:
        - Model such promos as PB fragment pages (e.g. `pageType = "fragment"`).
        - Store fragment IDs like `headerPromoFragmentId` / `footerPromoFragmentId` on `ShopSettings`.
        - Allow `Header`/`Footer` to optionally render those fragments via `DynamicRenderer` in known promo slots inside the shell, while layout, nav, and system controls stay code‑owned.
      - For preview and live routing, PB and header/footer stay aligned by:
        - Using the same runtime layout (`[lang]/layout.tsx`) for CMS routes (`/[lang]/pages/[slug]`, legal routes, system routes).
        - Ensuring that any changes to `Shop.navigation` via CMS settings are reflected immediately in header/footer across all PB and non‑PB routes for that shop.
- **Domains & base URLs**
  - How do shops map to domains/subdomains in a multi-shop deployment, and how should CMS preview behave with custom domains?
  - How should SEO, link generation, and email templates use per-shop base URLs (including preview vs production)?
  - **Details:**
    - *Per‑shop domain model*
      - `Shop.domain` (via the `ShopDomain` type and `getDomain`/`setDomain` helpers in `@acme/platform-core/shops`) is the **single place** where a shop’s primary runtime domain is recorded (e.g. `shop.example.com` or `www.brand.com`):
        - For dev/stage, this may be a subdomain of a shared host (e.g. `shop-id.dev.example.net`), while production uses the merchant’s real domain.
        - CMS reads/writes `Shop.domain` through the same shop repositories that abstract over Prisma vs JSON so the value remains consistent for both CMS and runtime.
      - V1 assumes **one primary domain per shop per environment**; multiple domains/aliases (e.g. `.com` + `.de`) are future work and must be modelled explicitly (e.g. an array of `ShopDomain` entries) before being used.
    - *Base URLs and SEO*
      - For SEO and canonical URLs, the primary base URL comes from `ShopSettings.seo[locale].canonicalBase` (as seen in `apps/cover-me-pretty/src/lib/seo.ts` and `seo-validation` tests):
        - `canonicalBase` is a per‑locale origin/root (e.g. `https://site.com` for `en`, `https://site.de` for `de`); `getSeo` derives locale‑specific canonical URLs such as `https://site.com/en` and Hreflang alternates from this.
        - In v1, we treat `canonicalBase` as the **authoritative base URL for SEO**, and `Shop.domain.name` as the operational domain used by deployment adapters and for constructing non‑SEO absolute links when needed.
      - Conceptually:
        - `Shop.domain` answers **“where is this shop actually hosted in this environment?”**.
        - `ShopSettings.seo[locale].canonicalBase` answers **“what host/URL should search engines treat as canonical for this locale?”**.
        - In production, those generally match (same host, possibly with locale segments in the path); in dev/stage, `Shop.domain` can be a dev host while `canonicalBase` is either unset/dummy with `noindex` or explicitly points at a staging host if you deliberately want it discoverable (rare).
      - Contract:
        - CMS must validate that `canonicalBase` values are well‑formed HTTPS origins (no paths/query fragments), and that they are consistent with the configured `Shop.domain` for production.
        - Runtime metadata generation (`generateMetadata` and `getSeo`) should:
          - Prefer `Page.seo.canonical` when present.
          - Fallback to locale‑specific `canonicalBase` + path.
          - Use the same base to compute `alternates.languages` entries for that page.
    - *How runtimes build absolute URLs*
      - Runtimes should not hand‑concatenate hostnames or guess domains; instead they should:
        - Use `getSeo`/`Page.seo` for SEO canonicals and open graph URLs.
        - For absolute links in emails and system notifications, use a small helper (conceptually `getShopBaseUrl(shopId, locale)` in a shared URLs module), which resolves to:
          - `ShopSettings.seo[locale].canonicalBase` when available, or
          - A URL built from `Shop.domain.name` with a locale‑aware path prefix (e.g. `https://shop.example.com/${locale}`).
        - For purely internal/runtime concerns (e.g. dev tooling URLs, internal API bases), apps may continue to use environment‑level settings such as `NEXT_PUBLIC_BASE_URL` from `coreEnv`; but any user‑facing URLs (SEO canonicals, hreflangs, email links) must be derived from `ShopSettings.seo[locale].canonicalBase`/`Shop.domain` via shared helpers, **not** from `NEXT_PUBLIC_BASE_URL` directly.
      - Email templates and background jobs should always go through that helper so that a shop’s domain/base URL is changed in **one place** (shop settings + domain) and reflected everywhere.
    - *Multi‑shop deployments and preview behaviour*
      - In a multi‑shop deployment, each storefront runtime remains **single‑shop** and is bound to one `shopId` via config (`NEXT_PUBLIC_SHOP_ID` and `Shop.id`/`shop.json`), even if multiple runtimes share the same physical host.
      - For preview:
        - CMS’s `/cms/live` panel already discovers local runtimes and exposes per‑shop preview URLs (e.g. `http://localhost:<port>`), which are inherently non‑canonical and environment‑specific.
        - `/preview/:pageId` endpoints (Cloudflare Functions) should respect the shop’s **configured runtime base** (cloud host + route), but preview URLs must never be written into `canonicalBase` or surfaced in sitemaps; they are strictly tooling‑only.
        - Preview/dev origins (local `http://localhost:*`, staging Pages URLs, `/preview/:pageId` links) are always **non‑canonical**: they must be `noindex`, omitted from sitemaps, and never copied into `canonicalBase` or long‑lived email templates.
        - When a shop has a custom production domain configured via `Shop.domain` + `canonicalBase`, CMS UI should clearly separate:
          - “Live storefront” links (production domain).
          - “Preview/dev” links (dev/stage origins).
    - *Environment boundaries*
      - Domain and base URL configuration is **environment‑specific**:
        - Dev/stage typically run on shared hosts or localhost with `canonicalBase` pointing at those environments (or left blank to avoid polluting real SEO signals).
        - Production uses real merchant domains and fully configured `canonicalBase` per locale.
      - The same logical `shopId` may appear in multiple environments (dev/stage/prod), each with its own `Shop.domain` and `canonicalBase`; CMS always shows and edits domain/base‑URL settings **for the current environment only**, with no implicit sharing between environments.
      - CMS and deployment scripts must never copy production domains into non‑prod environments automatically; cross‑environment domain reuse should be a deliberate, audited action.
    - *Future considerations*
      - Supporting **multiple domains per shop** (e.g. per‑locale TLDs or brand aliases) will require:
        - Extending `ShopDomain` to hold an array of domains with roles (primary/secondary, locale affinity).
        - Making SEO helpers and link builders aware of domain selection per locale or per route.
      - Until then, v1 keeps a simple rule: one primary domain per shop/environment, `canonicalBase` per locale for SEO, and a shared helper for building absolute URLs across runtime pages and emails.
- **Media pipeline**
  - Where do CMS-uploaded media assets live in production (S3/R2/CDN), and how do preview and live environments resolve media URLs?
  - How should runtime apps consume media in a way that is both performant (responsive images, CDNs) and consistent with CMS storage?
  - **Details:**
    - *Storage backends and environments*
      - For v1, we assume a **single media backend per environment**, configured via env (e.g. Cloudflare R2, S3, or local disk in dev), exposed to CMS and runtime through a thin abstraction rather than direct SDK calls from apps:
        - CMS upload routes (e.g. `/cms/api/media`) and any future media services live in the CMS app and platform packages; tenant storefront apps never talk to the storage provider directly.
        - In development, it is acceptable to use a local filesystem or a dev R2 bucket; in shared/stage/prod, media must be stored in a durable object store behind a CDN (R2 + public base URL, S3 + CloudFront, etc.).
      - The try‑on system (`docs/tryon.md`) already outlines a **direct‑to‑R2** pattern for heavy assets (presigned POST/PUT to `R2_BUCKET_TRYON`); the general media pipeline should follow a similar pattern where possible to keep large uploads off Next app servers.
    - *Public URLs and media references*
      - CMS and runtime treat media as **immutable objects referenced by a typed descriptor**, not arbitrary strings:
        - We standardise on a storage‑agnostic `MediaAsset` shape and ID:
          - 
            ```ts
            type MediaId = string;

            interface MediaAsset {
              id: MediaId;         // stable id, not the raw object key
              url: string;         // public (or signed) URL for this env
              width: number;
              height: number;
              alt: string;
              contentType?: string;
              fileSizeBytes?: number;
              aspectRatio?: number;
              focalPoint?: { x: number; y: number };
              blurDataURL?: string;
            }

            // In content, we may embed either the full asset or a lean ref:
            type MediaRef = MediaAsset | { id: MediaId };
            ```
        - Page components, products, and settings store `MediaAsset` or `MediaRef[]` rather than bare strings; at minimum, we expect `{ id, url, width, height, alt }` to be present for images.
        - The media index (table/JSON) is the **canonical store** of `MediaAsset` by `id`; pages/products may embed a denormalised snapshot, but `id` is the authoritative link used for retention and tooling.
        - The CMS media manager always returns `MediaAsset` objects when picking/uploading assets; PB and settings UIs pass those through into content.
        - Public media URLs are either:
          - Direct CDN/R2/S3 URLs under a known public base (e.g. `MEDIA_PUBLIC_BASE_URL/<shop>/<path>`), or
          - Short‑lived signed URLs returned by a signing endpoint when access control is required.
      - Contract for PB blocks and runtime components:
        - Blocks receive `MediaAsset` (or equivalent structured shape) from CMS/domain layers and never talk to the storage provider directly; they treat `url` and dimensions as read‑only.
        - Runtimes should consume media via a **single design‑system image component** (e.g. `CmsImage`) that:
          - Accepts a `MediaAsset` plus layout props (`sizes`, `fill`, etc.).
          - Enforces width/height/aspect‑ratio and sensible lazy‑loading defaults.
          - Internally wraps `next/image` (or equivalent) so all PB blocks and UIs benefit from the same performance constraints in one place.
        - PB blocks must not call `next/image` directly; they call `CmsImage` (or the designated design‑system image component) with a `MediaAsset`. This gives us a single choke‑point to enforce media performance, CLS, and lazy‑loading behaviour.
    - *How preview and live resolve media*
      - CMS preview and live runtime are expected to see the **same URLs** for a given asset in the same environment:
        - In dev/stage, previews reference dev/stage media origins; in production, previews reference production CDNs.
        - `/preview/:pageId` and CMS versioned previews simply read the `components`/`seo` payload from the same backing store (Prisma/JSON) and trust the media URLs embedded there.
      - Any environment‑specific differences (e.g. R2 dev bucket vs prod bucket) are handled at upload/generation time and via central configuration (e.g. `MEDIA_BASE_URL`), not by conditional logic in PB blocks.
    - *Performance and transformations*
      - To keep media performant:
        - CMS should capture and persist intrinsic image dimensions (width/height) and, where possible, normalised aspect ratios so that runtime can set `aspect-ratio`/placeholder sizes and avoid CLS.
        - Media uploads should be validated for maximum dimensions and file size; heavy transformations (e.g. resizing, format conversion) should run in a background pipeline (edge functions or worker jobs) and publish optimised variants under predictable URLs.
        - Runtime components should avoid inlining large images or videos directly into PB JSON; PB JSON should reference media via URLs and light metadata only.
      - For specialised media pipelines such as try‑on:
        - Continue using direct‑to‑R2 uploads with presigned URLs as documented in `docs/tryon.md`, keeping large upload bodies off Next app runtimes.
        - Serve previews either via short‑lived signed URLs or via public R2 origin fronted by CDN, with strict CORS and CSP as already described there.
    - *Consistency and governance*
      - Media objects are **shared assets** at the shop level:
        - A single uploaded asset can be referenced by multiple pages/products; CMS should track references so retention jobs can distinguish “in‑use” vs “orphaned” media (as outlined earlier in the retention section).
        - Deleting media from CMS should be a two‑step process: mark as unused/soft‑deleted in metadata, then physically delete from storage after a grace period, to avoid breaking pages unexpectedly.
      - Public vs restricted media:
        - **Public media** (product images, marketing assets):
          - Served from a CDN origin such as `MEDIA_PUBLIC_BASE_URL`.
          - Referenced directly in PB and product data via `MediaAsset`.
          - Safe to embed in OG tags, marketing emails, etc., and must never require auth to load.
        - **Restricted media** (sensitive documents, internal assets, some try‑on outputs):
          - Stored in a separate bucket or prefix.
          - Only accessed via short‑lived signed URLs from a media API (e.g. `/cms/api/media/signed-url`) that checks permissions (customer, role, shop) and encodes an expiry; never embedded as raw URLs in public PB content or persistent SEO fields.
      - Immutability and cache‑busting:
        - Media URLs are treated as **immutable**: once issued, a given URL should never change its underlying content.
        - Any “edit image” action in CMS (e.g. replace, crop, re‑encode) must:
          - Uploads a new object with a new `id`/filename (ideally including a content hash or version in the path/query).
          - Create a new `MediaAsset` and update all references in content to point to the new asset; storage never overwrites existing objects in production buckets.
        - This enables long CDN TTLs and avoids “hero still showing the old image” confusion.
      - Environment separation and retention:
        - Each environment has its own media backend and `MEDIA_BASE_URL`; CMS must not write prod media URLs into dev content or vice versa.
        - On save, CMS should validate that every `MediaAsset.url` starts with the current environment’s `MEDIA_BASE_URL`; if not, the write is rejected. This protects against accidentally pasting prod URLs into dev content (and vice versa).
        - Within a given environment, preview and live always see the same `MediaAsset.url`; preview code must never write localhost/dev origins into persisted media or SEO fields for that environment.
        - Dev/stage previews always point at dev/stage media; if prod has assets that dev lacks, that is a migration concern, not something PB cross‑links automatically.
        - A periodic job should:
          - Maintain a media index (Media records with `MediaAsset` + metadata).
          - Scan all pages/products/settings for `mediaId`s, mark unreferenced items with `orphanedAt`, and permanently delete blobs and records after `MEDIA_RETENTION_DAYS`.
      - From a DX perspective:
        - Tenant apps must never talk to S3/R2 directly; only CMS and shared platform services know about buckets/providers.
        - Storefront apps only ever see `MediaAsset` objects and URLs provided by those services, and future plugins (e.g. additional media providers) should plug into the same abstraction rather than introducing per‑app upload flows.
- **Per-app preview correctness**
  - How do we guarantee that preview uses the same block registry, layout, and theming as each tenant app (especially once apps diverge from the template app)?
  - Do we need an explicit “preview adapter” contract that each app implements to integrate CMS-driven preview cleanly?
  - **Details:**
    - *Single source of truth: each app owns its preview route*
      - Every storefront app that wants first‑class CMS preview should expose its **own** preview page that:
        - Lives under a stable path (e.g. `/preview/[pageId]` in App Router).
        - Uses the app’s own layout shell (`[lang]/layout.tsx` or equivalent) and theming providers (translations, ThemeStyle, etc.).
        - Calls the shared Cloudflare `GET /preview/:pageId?token=…` API to fetch page JSON and renders it via that app’s `DynamicRenderer` + block registry.
      - The template app already follows this pattern (`packages/template-app/src/app/preview/[pageId]/page.tsx`); tenant apps like `apps/cover-me-pretty` should mirror it rather than re‑implementing bespoke preview fetch/render logic.
    - *Preview adapter contract (conceptual)*
      - Instead of a heavy “preview adapter” interface, we rely on a **lightweight contract per app**:
        - The app must provide a `PreviewPage` route that:
          - Accepts `pageId` and preview tokens via URL/query.
          - Fetches JSON from the platform preview API with `cache: "no-store"` and appropriate error handling.
          - Passes `components`, `history.editor`, and `locale` into the app’s own `DynamicRenderer`/preview client.
        - The app must use the same **block registry** and **layout/theming context** in preview as in live routes (e.g. shared `DynamicRenderer` and `TranslationsProvider`/`ThemeStyle`).
      - This gives us a de‑facto “preview adapter” without introducing a new registry; CMS simply links to `/<app>/preview/[pageId]?token=…` for the selected shop/app.
    - *Keeping preview and live in sync*
      - To ensure preview remains accurate even as apps diverge:
        - Block registries and dynamic renderers should live in shared packages (`@acme/ui`, `@acme/platform-core/page-builder-core`), and apps should configure them via composition (e.g. `registerBlocks`), not by copying code.
        - Any app‑specific blocks must be registered in a **single place** and used both in live routes and in the app’s PreviewPage; preview must never import a “lighter” or different block map.
        - The app’s preview route should wrap `DynamicRenderer` in the same providers as live (translations, theme tokens, cart context where relevant) so styling and behaviour match.
      - When apps need to diverge significantly from the template app, they should do so by:
        - Extending the shared block registry with additional blocks instead of forking the core preview pipeline.
        - Still wiring their PreviewPage to the common platform preview API and shared renderers, so CMS does not need per‑app special cases.
    - *CMS integration*
      - CMS does not guess which layout/registry a given shop uses; instead:
        - Each shop’s runtime app registers its preview base URL (e.g. via `deploy.json` or a small `previewBaseUrl` field in `Shop`/`ShopSettings`).
        - CMS composes preview links as `previewBaseUrl + "/preview/" + pageId + "?token=…"` and opens them in a new tab.
      - This keeps CMS agnostic to individual app implementations while ensuring previews always go through the **app’s own shell**, not a generic CMS‑side renderer.
- **Unsupported blocks / graceful degradation**
  - What should happen if a CMS page uses a block type that a given runtime app does not support (build-time error, runtime warning, CMS validation)?
  - How should we surface unsupported/mismatched blocks back to CMS users so they can fix or avoid them?
  - **Details:**
    - *Single registry per app + explicit compatibility*
      - Each app has a **block registry** that maps block `type` strings to React components; the registry is the single source of truth for what that app can render:
        - Core blocks live in shared packages (`@acme/ui`, `@acme/platform-core/page-builder-core`) and are registered in every app that uses PB.
        - App‑specific blocks are registered only in that app’s registry.
      - The combination of:
        - The page’s `component.type` values, and
        - The app’s block registry
        defines a **compatibility set** per app: any `type` not in the registry is unsupported for that app.
      - At build‑time (or via a small exported module), each app should publish a **BlockCapabilityManifest** describing its supported blocks:
        - Conceptually:
          - 
            ```ts
            type PageType = "marketing" | "legal" | "fragment" | "system";

            interface BlockCapability {
              type: string;
              supportedPageTypes: PageType[];
              deprecated?: boolean;
              // optionally:
              // requiredProviders?: ("CartProvider" | "CurrencyProvider" | "AuthProvider")[];
            }

            type BlockCapabilityManifest = BlockCapability[];
            ```
        - CMS reads this manifest per app/shop to drive:
          - Palette contents.
          - “Unsupported in this app” warnings.
          - Page‑type‑based validation (e.g. blocking checkout‑only blocks on marketing pages).
    - *Runtime behaviour on unknown blocks*
      - Runtime renderers (`DynamicRenderer`) must be resilient to unknown block types:
        - When they encounter a `component.type` that is missing from the registry, they should:
          - Skip rendering that block (or render a minimal `<div data-block-unsupported="type">` container), and
          - Log a structured warning such as `log.warn("unsupported_block", { shopId, pageId, type, appId, path })` so observability can surface it.
        - `DynamicRenderer` must also guard block component failures:
          - Catch errors thrown by individual block components, log a `block_render_error` with similar context, and treat them as unsupported (skip that block) rather than letting them break the whole page.
        - Unknown or broken blocks must never crash the page or break layout; at worst they produce missing content with log entries.
      - For end users, the default is **fail soft**: do not show visibly broken UI for unsupported blocks; render the rest of the page and rely on CMS guardrails to prevent this state from being published in the first place.
    - *CMS‑side detection and guardrails*
      - CMS should detect unsupported blocks at edit/publish time by comparing:
        - The `Page.components[*].type` values against the target app’s `BlockCapabilityManifest`.
      - It is useful to distinguish three failure modes:
        - **Unknown type** – the page references `type = "FooBar"` that does not exist in the registry/manifest at all.
        - **Known but disabled/deprecated** – the type exists in the manifest, but is marked `deprecated: true` or disabled for this app/shop.
        - **Known but not allowed for this page type** – the type is supported in the app, but not for the current `Page.pageType` (e.g. a checkout‑only block on a marketing page).
      - Behaviour:
        - In the Page Builder UI:
          - Unknown types should be marked as “Unknown block type” (likely migration/bug).
          - Known but disabled/deprecated blocks should show messaging like “This block is not enabled in this app/shop.”
          - Page‑type‑forbidden blocks should say “This block can’t be used on {pageType}; change the page type or remove it.”
          - All unsupported variants are clearly marked (e.g. “Unsupported in app X”; grayed‑out with an icon).
          - Editors can remove or replace them; they should not be allowed to add new blocks of unsupported types for the current app.
        - On publish:
          - By default (for real shops), publishing is **blocked** if any unsupported blocks remain for that app/shop, with a clear error listing the offending types and reasons.
          - Optionally, an admin‑only “force publish” escape hatch may exist that:
            - Requires an explicit confirmation step.
            - Writes an audit entry with `{ shopId, pageId, appId, unsupportedTypes, actor }`.
      - This keeps runtime graceful‑degradation as a last resort; the **primary defence** is CMS validation.
    - *Per‑app compatibility in a multi‑shop world*
      - Since CMS can manage multiple apps/shops with different registries:
        - Block palettes in the Page Builder should be filtered per shop/app, showing only blocks supported by that app’s registry and page type.
        - When the same CMS page is intended for multiple apps (rare), per‑app compatibility can be displayed as badges (e.g. “Template app: OK; Shop A: 1 unsupported block”).
      - A page is always edited in the context of a **target app/shop**; compatibility is evaluated against that app’s manifest, not a global registry. Most of the time a page is “for Shop A on App X”, and that is the only compatibility that matters.
      - Block deprecations/evolutions should be handled by:
        - Marking block types as `deprecated: true` in the manifest.
        - Hiding deprecated blocks from the palette for new content (or showing them with a “deprecated” badge) while allowing existing instances to render.
        - Providing a migration path (CLI or CMS tool) to transform old blocks to new types.
        - Only once migration is complete, removing the type from manifest/registry so it becomes truly “unsupported”.
    - *Developer ergonomics and testing*
      - To prevent regressions:
        - Add unit tests around the registry → renderer path to assert that unknown block types do not throw and that warnings are logged.
        - Introduce a small “registry manifest” (even as a generated JSON in tests) that lists all known block types per app; CMS can consume this manifest to drive palettes and validation.
      - For third‑party or future plugin blocks:
        - Registration should still go through the same registry; unknown/unregistered plugin types are treated exactly like unsupported core types.
        - Apps must not bypass the registry with ad‑hoc renderers, or CMS can’t reason about compatibility.
- **Search & discovery**
  - How should CMS pages and product content participate in site search (indexing strategy, search provider), and how are indexes kept up to date when CMS content changes?
  - How should search result routes be wired relative to CMS routes so that search and CMS navigation remain consistent?
  - **Details:**
    - *What belongs in search*
      - V1 search should cover:
        - **Products/SKUs** – primary search surface for shoppers (by name, description, tags, category).
        - **CMS pages** – selected PB marketing/legal pages where merchants explicitly opt‑in (e.g. “About”, “FAQ”, “Returns policy”), not every internal fragment.
      - We do not index:
        - PB fragments (`pageType = "fragment"`).
        - Internal system pages (checkout, account, etc.).
        - Draft/unpublished pages or products.
    - *Index shape and provider*
      - The search index is a **logical abstraction** (could be Algolia/Meilisearch/Elastic or a simple DB table in v1); the important part is the shared shape:
        - Conceptually:
          - 
            ```ts
            type SearchKind = "product" | "page";

            interface SearchDocument {
              id: string;          // index doc id (unique per shop+kind+entity+locale)
              shopId: string;
              kind: SearchKind;

              entityId: string;    // underlying productId or pageId
              locale: string;

              title: string;
              description?: string;
              url: string;         // canonical URL to navigate to
              tags?: string[];

              updatedAt: string;
              popularityScore?: number; // optional; derived from views/orders
              category?: string;        // optional; product category, etc.
            }
            ```
        - `id` can follow any provider‑specific pattern (e.g. `shop:kind:entityId:locale`), while `entityId` gives a stable link back into the platform domain for reindexing, debugging, or “show me all docs for this product/page”.
        - Products flow into the index via product services (SKUs and their locales); CMS pages flow via page services for `pageType = "marketing" | "legal"` and `status = "published"`, and only for locales that the shop has enabled in `ShopSettings.languages`.
        - For locales where content is purely coming from fallback (per the localisation lifecycle earlier), we must choose a consistent rule:
          - Either index documents for those locales using the fallback content (so search still returns something in that language), or
          - Restrict indexing to locales with explicit content and treat others as primary‑locale only; whichever choice we make should be encoded in a helper like `buildSearchDocumentsForPage(page, shopSettings.languages)` so apps/CMS code do not have to reason about it.
      - Search provider choice is deferred; `SearchDocument` is the contract CMS/runtime code depends on.
    - *Keeping indexes up to date*
      - Index maintenance should be **event‑driven** where possible, with a single write surface:
        - A shared search service exposes:
          - `upsertSearchDocuments(shopId, docs: SearchDocument[]): Promise<void>`
          - `deleteSearchDocuments(shopId, ids: string[]): Promise<void>`
        - Product changes (create/update/delete) emit events (or directly call `upsertSearchDocuments`/`deleteSearchDocuments`) to update product entries per locale.
        - CMS publish/unpublish for pages calls the same helper to upsert or delete page documents for affected locales.
        - Bulk rebuilds (e.g. after schema changes) are handled by a `reindexShop(searchProvider, shopId)` job that scans products + pages and regenerates all `SearchDocument`s, then calls `upsertSearchDocuments` in batches.
      - V1 can implement this synchronously in CMS/product actions; longer term this can move behind a job queue without changing the contract.
    - *Routing of search results*
      - Search results should always navigate to **canonical runtime routes**, not CMS URLs:
        - For products, results link to `/[lang]/product/[slug]` (or the app’s canonical PDP route).
        - For PB pages, results link to `/[lang]/pages/[slug]` for `pageType = "marketing"`, and to explicit legal routes (e.g. `/[lang]/returns`) for `pageType = "legal"`.
      - The `url` field in `SearchDocument` must be computed using the same routing rules described earlier (page types + slugs) and `ShopSettings.seo[locale].canonicalBase` for absolute URLs when needed.
      - Search UIs treat `doc.url` as an opaque string and never construct links themselves; if routing rules change (e.g. legal pages move under `/[lang]/info/[slug]`), only the indexing helpers and runtime route implementations need to be updated.
      - This keeps search and navigation consistent: clicking a search result is equivalent to clicking the same page/product from nav or internal links.
    - *Search UI and shop/apps*
      - Each app is responsible for its own search UI (search box, results page), but:
        - They all call a shared search API (conceptually `GET /api/search?q=&lang=&kind=`) that returns `SearchDocument`s for that shop/env.
        - Results pages resolve to the app’s own runtime routes; they do not embed CMS SLUG logic themselves.
      - CMS does not own the storefront search route; it only owns how PB content is indexed and how URLs are computed for search documents.
    - *Future extensions*
      - Once core search is stable, we can extend the index to include:
        - Additional content types (blog posts, collections) with their own `kind` and routing rules.
        - AI/semantic search over a subset of content, still returning `SearchDocument` entries with canonical URLs.
      - Throughout, the invariant remains: search documents carry enough information to route to canonical URLs, and all search UI in apps uses those URLs rather than constructing links ad‑hoc.

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
  - **Details:**
    - *Configurator as the canonical “create shop” front door*
      - `/cms/configurator` is the single, opinionated entry point for creating and launching new shops; CLI flows (`create-shop`) and ad‑hoc JSON edits are for developers only.
      - Every shop that should be eligible for “one‑click launch” must go through the configurator steps at least once so we have a consistent, auditable baseline.
    - *First‑class step model and progress*
      - Steps should be modelled as a small, shared type in `@acme/types` / `platform-core` so CMS UI, APIs, and background checks all speak the same language:
        - Conceptually:
          - 
            ```ts
            type ConfiguratorStepId =
              | "shop-basics"
              | "theme"
              | "payments"
              | "shipping-tax"
              | "checkout"
              | "products-inventory"
              | "navigation-home"
              | "domains"           // optional
              | "reverse-logistics" // optional
              | "advanced-seo";     // optional

            type StepStatus = "pending" | "in-progress" | "complete" | "error";

            interface ConfiguratorProgress {
              shopId: string;
              steps: Record<ConfiguratorStepId, StepStatus>;
              lastUpdated: string;
              errors?: Partial<Record<ConfiguratorStepId, string>>;
            }
            ```
        - `/cms/api/configurator-progress` returns `ConfiguratorProgress` for a given shop, and the launch button relies on this structure; UI should not invent new step IDs outside this shared model.
    - *Required track vs optional track*
      - Steps map directly to concrete contracts identified elsewhere (payments, shipping, tax, checkout, inventory, theme), and each step is marked as:
        - **Required for launch** – currency/taxRegion, Stripe config, `/api/cart` + `/api/checkout-session`, at least one product/SKU, basic theme/tokens, navigation/home page.
        - **Optional/advanced** – reverse logistics, late fees, try‑on, luxury features, advanced SEO, custom domains.
      - The launch button is gated strictly on required steps; optional steps can be completed post‑launch without blocking.
    - *End‑to‑end wiring to actions and checks*
      - Each configurator step must be wired both to:
        - A concrete CMS/platform action:
          - Shop details/theme → `updateShop` + `patchTheme`.
          - Payments/shipping/tax → `updateSettings` for `ShopSettings` + environment validation (Stripe keys, shipping/tax providers).
          - Checkout page → create/configure PB page(s) and ensure `/[lang]/checkout` is wired to configured blocks.
          - Inventory/data import → seed products/SKUs/inventory via import APIs or fixtures.
        - A server‑side **validation check** that determines completion, rather than just “form submitted once”:
          - 
            ```ts
            type ConfigCheckResult =
              | { ok: true }
              | { ok: false; reason: string; details?: unknown };

            type ConfigCheck = (shopId: string) => Promise<ConfigCheckResult>;
            ```
          - Examples:
            - `checkShopBasics` – `Shop` exists; `ShopSettings.languages` non‑empty; primary locale chosen.
            - `checkTheme` – theme tokens present; base theme selected.
            - `checkPayments` – Stripe env vars present/valid; `ShopSettings.currency` set.
            - `checkShippingTax` – `ShopSettings.taxRegion` set; `getTaxRate` succeeds; at least one shipping option configured.
            - `checkCheckout` – canonical `/[lang]/checkout` route exists and uses the canonical cart/checkout contract.
            - `checkProductsInventory` – at least one published product/SKU and non‑zero inventory.
            - `checkNavigationHome` – home/nav configuration is valid and points at routable pages.
      - `/cms/api/configurator-progress` derives `StepStatus` values by running these checks; the UI can still mark steps “in‑progress” optimistically, but “complete” comes from server‑side validation.
    - *Progress, retries, and “quick launch”*
      - Progress indicators and the launch panel should always reflect the persisted state of the shop (via `/cms/api/configurator-progress`), not just the last session; `ConfiguratorProgress.errors` can be used to surface concrete issues to the UI (e.g. “Payments: missing STRIPE_SECRET_KEY”).
      - The configurator should support:
        - A **“quick launch”** path that uses the same step model but preselects defaults:
          - Single locale (e.g. primary language only).
          - Simple base theme.
          - Basic shipping/tax configuration and minimal SEO.
          - Auto‑seeding one demo product/SKU and a basic nav/home layout from templates.
        - Implementation‑wise, quick launch is a button that applies these defaults via existing actions (`updateShop`, `updateSettings`, scaffolding helpers) and then re‑runs the configurator checks; it does **not** bypass steps, it just fills them in on the user’s behalf.
        - Safe retries and idempotent actions for all steps:
          - Re‑running “configure payments” with the same inputs overwrites settings but does not create duplicates.
          - Re‑running “seed products/inventory” either no‑ops when sample data already exists, or is gated behind an explicit “reset demo data” operation.
      - All configurator actions should be idempotent per `(shopId, step)` so it is safe to re‑trigger steps on failure or during “recheck”.
    - *Launch gating and go‑live pipeline*
      - A shop is launchable if and only if:
        - All required steps have `StepStatus === "complete"` in `ConfiguratorProgress` for that shop, and
        - There are no critical errors in underlying health checks (e.g. payments misconfigured).
      - On “Launch shop”, the platform should:
        - Re‑run all required `ConfigCheck`s server‑side as a last sanity pass.
        - If any fail, return a structured error listing which step(s) to fix; the UI reflects this via `ConfiguratorProgress.errors`.
        - If all pass, execute the canonical go‑live pipeline:
          - Create or materialise the shop via `createShop` if it doesn’t exist in the runtime yet.
          - Deploy the runtime app via `deployShop` or the configured deploy adapter.
          - Update `deploy.json`/`shop.json.status` and mark `launchedAt` (or equivalent) in the DB.
      - Launch should be idempotent per `(shopId, environment)`: re‑launching a shop that is already live simply converges its deployment to the current configuration rather than creating new shops.
    - *Post‑launch usage & shop health*
      - After launch, the same configurator UI doubles as a **“readiness dashboard”**:
        - Shows which foundational tracks are configured (payments, shipping, returns, SEO, analytics).
        - Highlights missing or misconfigured areas (e.g. no return policy page, no canonicalBase configured) without blocking normal CMS editing.
      - The same `ConfigCheck`s that drive configurator completion can also feed a shop‑level **health indicator** (healthy/degraded/broken) exposed elsewhere in CMS:
        - Configurator answers “can we launch this shop right now?”.
        - Shop health answers “is this shop still correctly configured and deployable after launch?”.
      - Re‑using the same checks avoids parallel mechanisms for onboarding vs ongoing health and keeps all configuration expectations in one place.
      - Current state in code/docs:
        - `@acme/platform-core/configurator` implements `getConfiguratorProgressForShop` and `getLaunchStatus` over shared `ConfiguratorStepId`/`ConfiguratorProgress` types.
        - `apps/cms/src/app/lib/shopHealth.ts` exposes `deriveShopHealth(progress)` and `ShopHealthSummary` (`"healthy"` / `"degraded"` / `"broken"`), and both the configurator dashboard hooks (`useConfiguratorDashboardState`, `heroData`) and the per‑shop dashboard (`apps/cms/src/app/cms/shop/[shop]/page.tsx`) use these to render configuration health badges.

- **Page builder ergonomics**
  - Editing experience (keyboard shortcuts, device presets, breakpoint controls, media workflows).
  - Error handling and guardrails when users misconfigure blocks or styles.
  - **Details:**
    - *Fast, predictable editing loop*
      - Page Builder should optimise for a tight edit → preview loop:
        - Keyboard shortcuts for common actions (undo/redo, duplicate, delete, move, device toggle) with a visible cheat‑sheet.
        - Device presets and breakpoint controls that clearly indicate which props are per‑breakpoint vs global, with a safe “reset breakpoint overrides” affordance.
        - Autosave of drafts and editor state (history, selection, open panes) per page/locale, with clear “Draft saved” vs “Published” markers.
    - *Locale and variant editing*
      - Locale switching within Page Builder should respect the localisation lifecycle defined earlier:
        - A current editing locale is always active; inputs show values for that locale.
        - Fallback‑only values are clearly indicated (e.g. “Using primary locale”) with a one‑click “Copy primary → this locale” action.
        - Per‑locale readiness badges (via `pageLocaleStatus`) surface which locales are complete/fallback/missing before publish.
      - For A/B variants or experiments, Page Builder should treat each variant as a separate `Page` or `PageVersion`, not as hidden state inside a single page.
    - *Guardrails for layout, media, and blocks*
      - Guardrails should be enforced at multiple levels:
        - Block‑level validation (Zod schemas) with inline error states in the inspector when props are invalid or incomplete.
        - Page‑level checks for dangerous compositions (e.g. too many hero‑like sections above the fold, multiple auto‑playing media blocks) surfaced as non‑blocking warnings.
        - Media workflows that always go through the shared media picker and `MediaAsset` components, so aspect‑ratio/size constraints and alt‑text requirements are enforced centrally.
      - Hot reload/preview errors should surface as clear, non‑technical messages in the UI (with a link to developer logs), rather than cryptic stack traces.
    - *Safe experimentation & rollback*
      - Editors should feel safe to experiment:
        - Changes apply to drafts by default; explicit “Publish” is required to affect live content.
        - A single “Versions” or “History” panel (backed by `PageVersion` + diff logs) should make it easy to view, compare, and restore previous versions without leaving Page Builder.
        - “Preview as” controls (device, locale, optional UTM context) should be available directly from the builder toolbar.
      - Error states (validation failures, blocked publish due to required checks) should be clearly tied back to the offending blocks/fields so editors know exactly what to fix.

- **Shop settings UX breadth**
  - Which shop settings are required to launch a shop vs advanced/optional.
  - How settings are grouped in the UI and whether the current grouping matches real workflows.
  - **Details:**
    - *Basic vs advanced modes*
      - Shop settings should present a **basic mode** that covers everything needed for a viable shop, with an explicit toggle or separate “Advanced” tab for more complex options:
        - **Basic mode** = everything that contributes to the same `checkoutReady` / `shopReady` flags used by configurator/health:
          - Currency + languages.
          - Tax region.
          - Payment provider selection (and passing env validation).
          - At least one shipping method.
          - Returns policy (page or URL).
          - Canonical base URL for the primary locale.
          - At least one product/SKU, with `/api/cart` and `/api/checkout-session` wired to the canonical contracts.
        - **Advanced mode** = everything that does not affect the ability to take a basic order:
          - Deposit/late‑fee configuration.
          - Reverse logistics and try‑on.
          - Luxury features, extra analytics/pixels, advanced SEO patterns.
          - Fine‑grained pricing and filter mappings.
      - Both the configurator and the settings screen derive their “ready/not ready” status from the same `ConfigCheck`s over `Shop` + `ShopSettings` + environment, not from ad‑hoc UI flags. This keeps configurator, the readiness summary, and settings in sync.
    - *Clear grouping by workflow and data ownership*
      - Settings should be grouped by **merchant workflows**, but the grouping should map cleanly back to the data model:
        - “Store basics” → `Shop` + a subset of `ShopSettings` (name, languages, contact info, brand/logo).
        - “Payments & tax” → `ShopSettings.currency`, `ShopSettings.taxRegion`, plus environment validation helpers for payment providers.
        - “Shipping & returns” → `ShopSettings` fields for shipping methods, thresholds, return policy URL/page, `returnService`, `reverseLogisticsService`.
        - “Appearance & theme” → `Shop.themeId`, tokens, fonts/colours.
        - “SEO & domains” → `ShopSettings.seo`, `Shop.domain`, sitemap/robots toggles.
        - “Tracking & integrations” → `ShopSettings.analytics`, tracking providers, optional third‑party integrations.
      - Shop‑level settings (`Shop`, `ShopSettings`) are editable by merchants in CMS; environment‑level config (Stripe keys, shipping/tax provider keys) is displayed read‑only with “Configured / Missing” badges and is not edited in CMS.
      - Each group should call out which fields are **required for checkout readiness** and link back to the configurator/dashboard when something critical is missing.
    - *Strong validation & inline guidance*
      - Shop settings forms should reuse the validation and readiness logic defined elsewhere:
        - Currency/taxRegion validated via the same helpers used for checkout configuration.
        - Stripe/tax/shipping providers validated with environment‑aware checks, surfacing clear status such as “Stripe: Configured (test mode)” vs “Stripe: Missing STRIPE_SECRET_KEY”.
        - Domain and canonicalBase validated as HTTPS origins, with warnings when they don’t match.
        - Some failures should be treated as hard blockers (e.g. no payment provider configured), while others are warnings (e.g. analytics not set up yet).
      - Inline help (short hints, tooltips, and links to docs) should be concentrated around high‑risk fields (tax, returns, legal pages), so merchants understand consequences without reading long docs.
    - *Readiness surfacing inside settings*
      - The shop settings screen should surface a lightweight **readiness summary** for critical flows (checkout, returns, SEO):
        - E.g. “Checkout: ✅ Ready”, “Returns: ⚠ Missing policy page”, “SEO: ⚠ canonicalBase missing for en”.
      - Each settings group can show a small status chip derived from the same `ConfigCheck`s (“Checkout: Ready”, “Returns: Needs attention”), and the global summary at the top reuses those checks so configurator, readiness, and settings stay aligned.
    - *Safe defaults and gradual disclosure*
      - Where possible, settings should come with safe, opinionated defaults:
        - A default shipping method (e.g. “Standard shipping”) and a reasonable default return window (e.g. 14–30 days).
        - A default SEO title pattern such as `{{shopName}} – {{pageTitle}}` for the primary locale.
        - Analytics and advanced tracking features off by default; merchants must explicitly opt‑in.
      - Advanced fields that can cause harm if misused (e.g. changing taxRegion on a live shop) should:
        - Require an extra confirmation and/or elevated role (e.g. admin/ShopAdmin).
        - Explain the implications clearly (“May affect how tax is calculated on existing orders/pages”).
      - Some settings should be viewable by many, editable by few:
        - Payments, taxRegion, domains, and returns policy links should be limited to admin/ShopAdmin roles.
        - Copy/SEO tweaks, navigation labels, and theme colours can be editable by broader content roles.

- **Governance: revisions, publishing, and “no direct edits”**
  - How draft vs published content is handled (pages and shop settings).
  - How revisions and history are surfaced to users and whether rollbacks are supported.
  - Whether there is any enforcement that shop apps are not edited per‑shop (vs config‑only changes).
  - **Details:**
    - *Single mental model for “change & publish”*
      - For non‑technical users, the CMS should present a unified publishing story:
        - Drafts are the working copy; publish makes changes live.
        - Session undo/redo is separate from long‑term versions; both are visible and labelled as such.
        - Page Builder, edit‑preview, and version‑preview are stitched together into a single “Change → Preview → Publish → Rollback” flow, rather than separate screens.
      - System pages (checkout, PDP, cart) follow the same draft/publish model, but with additional checks and warnings before publishing changes that affect the funnel.
    - *Pages: drafts, versions, and rollback*
      - Pages use the `Page.status` + `PageVersion` model defined earlier:
        - `status: "draft" | "published"` governs what is live.
        - Every publish writes a `PageVersion` snapshot (`{ id, pageId, shopId, createdAt, createdBy, status: "published", snapshot: Page }`).
      - The UX should expose this as:
        - A **Versions** sidebar that lists published versions (and optionally significant drafts), with actions:
          - “Preview this version” – opens the runtime preview for that snapshot.
          - “Restore as draft” – copies that snapshot into the current draft; publish remains an explicit step.
        - Clear labels for the current working copy (“Draft since …”) and current live version (“Live: v12 from …”).
      - Rollback semantics:
        - Restoring a version creates a new `PageVersion` on publish; old version IDs are not reused.
        - System pages (checkout, PDP) may require a stronger confirmation or additional checks before publishing a rollback.
    - *Settings and shop‑level changes*
      - Shop settings and configuration changes should follow a similar pattern:
        - Changes are edited in forms with explicit “Save” actions.
        - Important settings (payments, shipping, domains, tax) should:
          - Be covered by health/config checks surfaced in the configurator dashboard and settings readiness summary.
          - Optionally emit their own “configuration version” entries (lightweight snapshots or an audit log) so critical changes can be traced and, where possible, reverted.
      - Unlike pages, shop settings usually do not have a full multi‑version rollback UI in v1, but:
        - High‑risk operations (e.g. changing taxRegion, deleting a shop, running `upgrade-shop`) should require elevated roles and additional confirmation steps.
        - A human‑readable audit log (below) should capture who changed what and when.
    - *Governance and “no direct edits”*
      - The platform’s governance model should steer all tenant changes through CMS/configurator and shared upgrade/edit flows, not per‑shop code edits:
        - **Preferred path**:
          - Content and layout: Page Builder and CMS pages.
          - Behaviour and flows: configuration in CMS + `@acme/platform-core` logic.
          - Template changes: shared components + `edit-preview-republish` / `upgrade-shop` flows.
        - **Disallowed/strongly discouraged path**:
          - Editing tenant app code under `apps/<shop>` in ways that diverge from the template and are not reflected in CMS or shared packages.
      - Enforcement in v1 is primarily **conventions + tooling**, but we can strengthen it by:
        - CI checks that flag direct edits to `apps/<shop>` code except in allowed areas (branding, minor layout wrappers).
        - Scripts and docs that clearly delineate “configurable via CMS” vs “template‑level code”, and that default new shops to code that imports from shared packages instead of copying logic.
        - A roadmap toward stricter multi‑tenant isolation if/when the platform hosts many tenants (e.g. disallow per‑shop app folders entirely in favour of configuration + theming).
    - *Audit trail and approvals (future)*
      - Over time, governance can be strengthened with:
        - A human‑readable audit log per shop (and global admin view) capturing key events:
          - Page publishes and rollbacks (who, when, which version).
          - Shop settings changes (old → new values for critical fields).
          - Template upgrades and deploys.
        - Optional approval flows for high‑risk content:
          - E.g. home page, checkout copy, legal pages require an “approver” role to publish.
        - Scheduling capabilities (publish windows) for selected pages, still backed by `PageVersion` snapshots.
      - These are future extensions; v1 focuses on clear draft/publish semantics, safe rollback for pages, and strong guidance (plus light tooling) to avoid per‑shop code edits.

### Findings

- **CMS shell, navigation & roles**
  - Global layout:
    - `apps/cms/src/app/layout.tsx` wraps the entire CMS app with `CurrencyProvider` and `CartProvider`, applying global fonts and theme initialization via `initTheme`.
    - All `/cms/*` routes are wrapped by `apps/cms/src/app/cms/layout.tsx`, which:
      - Retrieves the NextAuth session and passes it through `CmsSessionProvider`.
      - Wraps children in `LayoutProvider` (`@acme/platform-core/contexts/LayoutContext`) to expose breadcrumbs and configurator progress to client components.
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

- **Onboarding & happy path (partially codified via ConfigChecks)**
  - What is the minimal set of steps and configuration needed to launch a viable shop, and how should the configurator foreground that “happy path”?
  - Which steps should be strictly blocking vs optional at first launch?
  - Where should embedded help (tooltips, docs links, best-practice defaults) live to guide non-technical users?
  - Current state in code/docs:
    - `@acme/platform-core/configurator` defines `ConfiguratorStepId`, `ConfigCheck`, and concrete checks such as `checkShopBasics`, `checkTheme`, `checkPayments`, `checkShippingTax`, `checkCheckout`, `checkProductsInventory`, and `checkNavigationHome` (`packages/platform-core/src/configurator.ts`), and `/cms/api/configurator-progress` / `/cms/api/launch-shop` use them to drive progress and gate `deployShop`.
  - Remaining gaps:
    - UX-level decisions about the minimal “happy path”, embedded guidance, and which steps are strictly blocking vs optional are still design-only.

- **Revision & publishing workflow (partially codified)**
  - How should drafts, change history, edit-preview, and version-preview be presented as a cohesive “change & publish” flow for non-technical users?
  - Do we need scheduling (publish windows) and/or approval flows for certain pages (home, checkout, PDP)?
  - How should system pages (checkout, PDP, cart) differ from marketing pages in terms of publish risk and required checks?
  - Current state in code/docs:
    - Page drafts/publishing, diff history, and page-version preview flows are implemented across the page repositories/`PageVersion` handling and described in `docs/preview-flows.md` and `docs/edit-preview-republish.md`.
    - Template/component upgrade and rollback flows are implemented via `upgrade-shop`, `republish-shop`, and `rollback-shop` plus `docs/upgrade-preview-republish.md`.
  - Remaining gaps:
    - A unified, user-facing “change → preview → publish → rollback” UX that hides underlying complexity is still future work.

- **RBAC & governance (roles codified; governance partially open)**
  - Do we need per-shop and per-section permissions (content vs settings vs code-adjacent changes), and what are the roles (editor, approver, admin) we care about?
  - Are there governance mechanisms we can adopt to discourage direct app edits (e.g., CI checks, conventions, tooling)?
  - Current state in code/docs:
    - `docs/permissions.md`, `SECURITY.md`, and `security/AGENTS.md` document role/permission mappings and security priorities; CMS actions and APIs consistently call `ensureAuthorized` / `ensureCanRead` and use `@auth/rbac` helpers with tests around them.
  - Remaining gaps:
    - Fine-grained per-shop/per-section permissions, formal approval flows, and strict enforcement against per-shop code edits remain design-level rather than fully implemented.

- **Guardrails for dangerous operations (still design-only)**
  - Which CMS actions are high-risk (shop deletion, data resets, tax/region changes on live shops, upgrades), and what additional confirmations/warnings/role checks should wrap them?
- **Settings UX**
  - Do we need “basic vs advanced” modes or progressive disclosure for shop settings to avoid overwhelming first-time merchants?
  - How can we better communicate dependencies between settings (e.g., enabling a feature that relies on specific env vars or third-party credentials)?

- **Audit trail & activity history (still design-only)**
  - Do we need a human-readable audit log (who changed what, when) for pages, settings, products, and shops, and how should it be stored?
  - Where should such an audit log be surfaced (per shop, global admin view, or both)?
- **Concurrency & conflicts beyond pages**
  - How should we handle concurrent edits to shop settings or products (last-write-wins vs explicit conflict detection/resolution UI)?
  - Are there particular areas where we must avoid silent overwrites (e.g., tax settings, inventory)?

- **CMS internationalisation (still design-only)**
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
  - **Details:**
    - *Layering and dependency direction*
      - We keep a strict layering contract to prevent dependency cycles:
        - `@acme/platform-core`:
          - Owns domain logic and persistence; **may not import** from `@acme/ui` or any app.
        - `@acme/ui`:
          - Owns design system + CMS/editor UI primitives; **may not import** from any app and may only depend on platform‑core types or very light helpers (never on persistence or app‑specific code).
        - `packages/cms-marketing`:
          - Lives above `platform-core`/`ui`, below the CMS app; owns CMS‑specific flows and views (configurator orchestration, marketing dashboards, shop health views), and depends on `platform-core` for domain operations and `ui` for layout/PB primitives.
          - Must not contain runtime storefront code or reach into raw DB access; it is CMS glue, not a mini app.
        - Apps (template + tenants):
          - May depend on both `platform-core` and `ui`, plus app‑specific packages, but never the other way around.
    - *Clear layering between UI, domain, CMS glue, and apps*
      - `packages/platform-core`:
        - Owns all **domain logic and persistence** for shops, pages, products, cart/checkout, pricing, tax, orders, returns, and settings.
        - Apps and CMS call platform‑core services and repositories instead of implementing their own business rules.
        - New domain features (e.g. new pricing or tax rules) are added here first and then surfaced through CMS and apps.
      - `packages/ui`:
        - Is the **design system and CMS UI toolkit**:
          - Exposes stable, documented components (atoms → templates) and higher‑level CMS constructs (Page Builder, media manager, layout components).
          - Contains as little domain logic as possible; anything domain‑specific should come from `platform-core` via props/hooks.
      - `packages/cms-marketing` (or similar CMS‑only packages):
        - Own CMS‑specific workflows and views such as:
          - Configurator orchestration and marketing dashboards.
          - Shop health/status components built on top of `ConfigCheck`s.
        - Depend on `platform-core` for domain operations (shops, pages, health checks) and `ui` for layout and PB/editor primitives.
        - Must not contain runtime storefront routes or business logic; they are “CMS glue”, not a second app.
      - Apps (`@acme/template-app`, tenant apps):
        - Are **thin shells** that compose `platform-core`, `ui`, and CMS glue where appropriate, providing routing, branding, and app‑specific glue (e.g. where PB is mounted, which slots exist).
        - App‑specific behaviour should be implemented as small adapters/hooks on top of platform‑core, not by forking core logic.
    - *Public surface vs internal details*
      - Each shared package should have a deliberately small **public surface**, with conventions to enforce it:
        - Directory/layout:
          - `src/public/*` or named exports from `src/index.ts` = stable API.
          - `src/internal/*` or other deep paths = fair game to change.
        - Import rules:
          - Apps must not import from `@acme/ui/src/**` or `@acme/platform-core/src/**`.
          - Only `@acme/ui` and documented subpaths (e.g. `@acme/platform-core/cart`, `@acme/platform-core/repositories/shops.server`) are allowed in app code.
      - When we add a new capability, we first decide if it belongs on the public surface of `platform-core`/`ui`/`cms-marketing`; apps should never “reach inside just this once”, as that erodes the boundary over time.
    - *Page Builder extraction plan*
      - Page Builder logic should gradually move from app‑local code into dedicated packages:
        - `page-builder-core` – pure data model and transforms (schemas, migrations, page‑level validators).
        - `page-builder-ui` – framework‑agnostic UI primitives (or Next‑specific for now) for canvas, inspector, toolbar, etc.
        - `@acme/templates` – declarative templates/presets and their descriptors.
      - CMS and apps should depend on these packages, not on ad‑hoc copies of Page Builder logic; this ensures PB ergonomics/features land once and propagate everywhere.
    - *Template app and themes*
      - `@acme/template-app` remains the canonical reference runtime:
        - Demonstrates how to:
          - Wire `/api/cart`, `/api/checkout-session`, `/preview/[pageId]`, CMS routes, SEO, and analytics.
          - Use PB routes and slots.
        - Only imports from public `platform-core` and `ui` surfaces; this app must compile and pass tests using only those exports, acting as a canary for accidental internal coupling.
        - Tenant apps should follow its patterns:
          - Reuse its API contracts (`/api/cart`, `/api/checkout-session`, `/preview/:pageId`).
          - Re‑export shared handlers and use the same providers where possible.
      - `@acme/themes` / `@acme/theme` are **theme/config packages**, not sources of business logic:
        - Provide tokens and light layout variants:
          - Colour scales, typography, spacing, radii.
          - Optional layout “frames” (e.g. header/footer variants) that still delegate to `@acme/ui` atoms/molecules.
        - Must not:
          - Fetch data or know about cart/checkout/orders.
          - Contain API routes or domain services.
      - All business rules live in `platform-core`, all layout and styling primitives live in `ui`/themes, and the template app is just one way to assemble them.
    - *Where new shared logic belongs*
      - A simple decision rule to avoid “misc” packages:
        - Does it change domain behaviour or persistence (shops, pricing, tax, inventory, orders, PB schemas, migrations)?
          - → `platform-core`.
        - Does it change how things look/feel or add reusable CMS/editor widgets?
          - → `ui` (or PB subpackages).
        - Does it orchestrate CMS‑only workflows (configurator, health dashboards, marketing views)?
          - → `cms-marketing` (or other CMS glue packages).
        - Does it only apply to one runtime app (a specific brand or experiment)?
          - → that app (e.g. `apps/<name>/lib/*`), not in shared packages.

- **Test coverage for critical flows**
  - Where unit/integration/e2e tests already cover CMS + runtime flows.
  - Where we should add focused tests to protect new prefabs and workflows.
  - **Details:**
    - *Three golden journeys as first‑class “test epics”*
      - We treat three end‑to‑end journeys as first‑class “golden paths”; new features that materially affect them are not “done” until at least one layer of tests covers the impact:
        - **Shop creation & launch**:
          - CMS: `/cms/configurator` → `createShop` → `deployShop` → `deploy.json` written.
          - Runtime: shop is reachable on `/[lang]` with correct theme/nav and no “misconfigured” state.
        - **Content editing & publish**:
          - CMS: PB edit → page saved as draft → preview via app `/preview/[pageId]` → publish.
          - Runtime: `/[lang]/pages/[slug]` (or home/returns/etc.) reflects new content within the expected revalidation window.
        - **Checkout**:
          - Runtime: add to cart → `/api/cart` operations → `/api/checkout-session` → (mocked Stripe) → webhook → `RentalOrder`/order visible in `/account/orders`.
      - For each golden journey, we want:
        - Targeted unit/module tests in `platform-core`.
        - Integration tests on CMS actions/APIs and runtime API routes.
        - At least one E2E scenario in the template app **and** in at least one tenant app to prove wiring across CMS + runtime.
    - *Unit/integration tests in platform‑core*
      - Platform‑core should remain heavy on unit/integration tests for:
        - `createShop`/`deployShop` flows (including idempotency and partial failure modes).
        - Cart/checkout (`/api/cart` contract handlers, checkout session creation, pricing/tax/shipping calculations).
        - Orders/payments (order creation from Stripe checkout, refunds, reconciliation invariants and idempotency).
        - Page repositories and migrations (schema evolution, `PageVersion` handling).
        - Page types and constraints:
          - Enforcing `pageType` rules (marketing/legal/fragment/system) via validators.
          - Rejecting illegal block types for a given `pageType` at publish time.
        - Localisation helpers:
          - `fillLocales` and `pageLocaleStatus` correctness for representative pages and requiredLocales/primaryLocale combinations.
        - Config/health checks:
          - `ConfigCheck` functions (payments, tax, shipping, returns, SEO) used in configurator/shop health behave as expected: they flag misconfigurations and don’t yield spurious failures.
      - These tests run without any app code and use Prisma/JSON repositories as appropriate.
    - *App‑level integration tests and contract harness*
      - Apps should have thin integration tests that assert adherence to shared HTTP contracts:
        - `/api/cart` and `/api/checkout-session` – responses and error semantics match `@acme/platform-core/cartApi` and checkout helpers.
        - `/preview/:pageId` – honours the HMAC token model and returns valid `Page` JSON.
        - Any PB routes (e.g. `/[lang]/pages/[slug]`) – correctly resolve pages by slug and render via `DynamicRenderer`.
      - A small shared “contract harness” (e.g. in `@acme/test/contracts`) can:
        - Spin up each app, point at its dev server, and run the same tests against those endpoints.
        - Assert status codes, response shapes, and error semantics (validation vs stock vs not‑found).
        - Treat a failing contract test as “this app is not platform‑compatible” and block merges until fixed.
      - These tests don’t re‑test domain logic; they prove that apps are correctly wired to shared services and public surfaces.
    - *Cross‑cutting E2E tests tying CMS and runtime*
      - We should maintain a small, stable E2E suite (Cypress/Playwright) where every scenario crosses the CMS/runtime boundary at least once:
        - Template app:
          - Run through configurator to create/configure a shop.
          - Publish a PB marketing page and verify it appears live.
          - Complete a checkout via the storefront.
        - At least one tenant app:
          - Exercise the same golden journey but through that app’s skin (header cart icon, custom layout, etc.).
      - When we add large new prefabs (e.g. `CheckoutSection`, `CartSection`, major hero templates), they only need to appear in at least one E2E golden path, not in every app.
      - These E2Es should remain tightly scoped (few tests, high value) to avoid slowing the monorepo.
    - *Negative paths and regression traps*
      - In addition to happy paths, a few failure modes should have dedicated tests:
        - Checkout:
          - Invalid config (missing `taxRegion`, missing Stripe key) yields a typed configuration error (e.g. `CHECKOUT_CONFIG_INVALID`), not a generic 500.
          - Stock races at checkout emit a friendly error plus logs/metrics instead of silently letting inventory go negative — this does **not** happen today, so a regression test would lock in the desired behaviour once we implement it.
        - CMS publish:
          - Publishing a page with unsupported block types for that app, or with pageType/block violations (e.g. checkout block on a marketing page), returns clear server‑side validation errors.
        - Preview:
          - Bad/expired tokens on `/preview/:pageId` return 401 without leaking data.
          - Unknown/unsupported blocks still allow the page to render remaining blocks and log warnings.
      - These tests catch “we broke production UX” regressions early.
    - *Where tests live and when to add them*
      - We should make it obvious where to put tests and when to add them:
        - New public platform API → add or extend contract tests in the shared harness.
        - New money‑touching path → add unit tests in `platform-core` and at least one app‑level integration test.
        - New PB prefab for core flows (cart/checkout/account) → ensure it appears in at least one E2E golden path.
        - New config/health check → add a small unit test alongside its implementation and wire it into a “config readiness” test suite.

### Findings

- **Libraries & shared abstractions**
  - UI and CMS:
    - `packages/ui` is the central design system and CMS UI library, structured along Atomic Design lines (atoms → molecules → organisms → templates) per `docs/architecture.md`.
    - CMS uses these components directly (Page Builder, media manager, layout components, etc.), so improvements to `packages/ui` propagate across apps without duplication.
    - CMS-specific glue (e.g. `apps/cms/src/components/cms/PageBuilder.tsx`) is intentionally thin, keeping behaviour in shared packages.
  - Domain and persistence:
    - `packages/platform-core` encapsulates domain logic (shops, pages, products, cart, checkout, pricing, tax, orders, returns, settings) and repository resolution logic (`resolveRepo`, `DATA_ROOT`, `*_BACKEND` envs), documented in `docs/persistence.md` and other domain docs (orders, returns, upgrade flow).
    - Template app and tenant shops (e.g. `apps/cover-me-pretty`, `apps/skylar`) import from `@acme/platform-core` to avoid reimplementing business rules.
    - `packages/types` provides Zod-backed schemas for core entities (`Shop`, `ShopSettings`, `Page`, `PageComponent`, `SKU`, etc.), giving compile-time and runtime validation for CMS and runtimes.
  - Page Builder:
    - The shared Page Builder data model and transforms now live primarily in `@acme/page-builder-core` (schemas, diff/history helpers, export helpers, block registries) and `@acme/templates` (curated template catalogs); React editor components still live in `packages/ui` and CMS code, while `@acme/page-builder-ui` remains a small placeholder package that currently only exports a `version` string.
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
    - Boundary tests should reinforce the layering model:
      - `platform-core`:
        - Heavy on unit/integration tests around domain services and repositories.
        - No tests import app code.
      - `ui`:
        - Component, accessibility, and visual regression tests.
        - Uses mock domain data only; no real DB/filesystem access.
      - Template app and tenant apps:
        - Thin integration/E2E tests that prove “wire‑up correctness” (routes, providers, contracts like `/api/cart`, `/api/checkout-session`, `/preview/:pageId`).
        - The template app in particular must compile and pass tests using only the public exports from `platform-core` and `ui`, acting as a canary for accidental coupling to internals.

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

- **Coverage vs goals (still largely to be mapped)**
  - Which test suites concretely cover our critical goals (create shop → configure → publish → live checkout), and where are there gaps?
  - Do we have at least one end-to-end scenario that passes through configurator, CMS editing, deployment, and a live Stripe checkout for a tenant app?
  - **Details:**
    - *Map goals → suites explicitly*
      - We treat three “golden journeys” as the backbone of coverage:
        - **Journey A – Shop → live storefront**  
          Configurator → `createShop` / `deployShop` → runtime responds on `/[lang]`.
        - **Journey B – Edit → publish → live page**  
          PB edit → save → preview → publish → runtime `/[lang]/pages/[slug]` shows the new content within the target SLO.
        - **Journey C – Cart → checkout → order in account**  
          Add to cart → `/api/cart` → `/api/checkout-session` → Stripe webhooks → order visible in `/account/orders`.
      - For each journey we want:
        - `platform-core` tests to cover domain invariants.
        - App‑level integration tests to prove wiring to routes/providers/config.
        - At least one E2E (template app + one tenant) to prove the full path.
    - *Which suites cover what (target state)*
      - **Journey A – Shop creation & launch**
        - `platform-core`:
          - Unit/integration tests for `createShop` and `deployShop` (idempotency, failure modes, Prisma/JSON consistency, `deploy.json` integrity).
        - CMS:
          - Integration tests for configurator APIs/actions asserting that required steps flip readiness flags and call the underlying `platform-core` helpers.
        - Apps:
          - Integration tests asserting that a seeded shop responds on `/[lang]` with the expected layout/theming for its app.
        - E2E:
          - A scenario that starts from a new/seeded shop, runs configurator to “launch‑ready”, triggers deploy, and verifies the live storefront responds on the expected base URL.
      - **Journey B – Content edit → publish → live page**
        - `platform-core`:
          - Tests for Page repos (slug uniqueness, pageType constraints, draft vs published).
          - Tests for localisation helpers (`fillLocales`, `pageLocaleStatus`) and page history/versioning (snapshot on publish, rollback restores the right data).
        - CMS:
          - Integration tests for PB save/publish actions (correct `Page` / `PageVersion` written; page history logs updated).
          - Tests that publish calls the shared invalidation helper (path/tag‑based revalidation) with the right `shopId`/keys.
        - Apps:
          - Integration tests for `/[lang]/pages/[slug]` that:
            - Return 404 for unknown/unpublished pages.
            - Call `generateMetadata` based on `Page.seo`.
            - Render via the same `DynamicRenderer` + layout shell as preview.
          - Integration tests for `/preview/:pageId` validating the HMAC token model and `no-store`/`force-dynamic` caching semantics.
        - E2E:
          - A scenario that edits a PB page in CMS, previews it, publishes it, then hits `/[lang]/pages/[slug]` on the runtime and asserts the new content is visible (without depending on internal ISR details).
      - **Journey C – Cart → checkout → order in account**
        - `platform-core`:
          - Unit/integration tests for:
            - Cart API handlers (`@acme/platform-core/cartApi`) and cart store.
            - Pricing/tax helpers and checkout session creation.
            - Order creation from Stripe events and refund helpers.
            - Idempotent webhook handlers keyed by `(shopId, sessionId)` (or equivalent).
        - Apps:
          - Integration tests for `/api/cart` and `/api/checkout-session` to ensure behaviour matches the shared contract (schemas, status codes, error shapes, server‑side recompute of totals).
          - Integration tests for `/account/orders` that load orders via `getCustomerSession` + `getOrdersForCustomer`.
        - E2E:
          - A scenario (per reference app) that:
            - Adds items to cart, runs checkout against a mocked Stripe environment, and simulates webhooks.
            - Verifies the order appears in `/account/orders` with the expected totals and status.
    - *Gaps and expectations*
      - We don’t need every app to have its own full E2E suite; instead:
        - The template app and at least one tenant app implement all three journeys as E2E tests.
        - Other tenant apps rely on:
          - Shared contract tests for public APIs (`/api/cart`, `/api/checkout-session`, `/preview/:pageId`, Stripe webhook handler).
          - Local integration tests where they materially diverge.
      - Any change that can affect money flows, shop creation, publishing, or preview should either:
        - Be covered by `platform-core` unit/integration tests only, or
        - Be accompanied by updates to at least one of the golden‑path E2Es.
      - Pure UI changes and non‑critical CMS tweaks can be covered by package‑local unit/integration tests without expanding the E2E surface.
- **Prefab & block workflow**
  - What is the standard, documented developer workflow for adding new prefab blocks so they are:
    - Type-safe, storybook-covered, tested, palette-registered, and mapped into runtimes?
  - Should we provide scaffolding (plop generators, lint rules) to enforce that workflow?
  - **Details:**
    - *Schema‑first, single workflow for new blocks*
      - Adding a new block or prefab should follow a single, schema‑first pipeline:
        - Define the block’s **schema and types** in `@acme/types` (Zod schema + TypeScript type); no block is allowed without a schema + TS type.
        - The schema must:
          - Encode or reference pageType/slot constraints (via pageType config) so validators and palettes know where it may be used.
          - Mark which props are localised vs structural so localisation helpers and `pageLocaleStatus` can reason about them.
          - Represent media via `MediaAsset`/`MediaRef`, not raw URLs, so it flows through the shared media pipeline.
        - Implement the **React component** in `@acme/ui` (or appropriate PB subpackage), using only public design‑system primitives and `MediaAsset`/`CmsImage` where relevant.
        - Register the block in:
          - The **block registry** for CMS (Page Builder) and
          - App registries (template app + tenants) that should support it, via shared registration APIs.
        - Add a `BlockCapability` entry to the app’s `BlockCapabilityManifest`:
          - `type`, `allowedPageTypes` (e.g. `["marketing","legal"]`), `allowedSlots` (e.g. `["main","checkoutSidebar"]`), `deprecated?`, and optionally `requiresProviders?` (e.g. `"CartProvider" | "TranslationsProvider"`).
        - Wire it into **Storybook** with at least one story per mode and a basic a11y story.
        - Add **tests**:
          - Unit tests on the schema (validation) and component behaviour.
          - Extra tests for “money/flow” blocks (Cart/Checkout/Account) that assert correct API calls, error handling, and respect for `ShopSettings`.
      - This workflow should be captured in a short “Adding a block/prefab” doc and is the default expectation for new blocks.
    - *Manifest + registry as single source of truth*
      - The `BlockCapabilityManifest` is the authoritative list of block types per app:
        - Every registered block type must appear in the manifest; every manifest entry must correspond to a registered block.
        - CI can enforce this by generating a manifest from the registry in tests or comparing a static manifest to the runtime registry and failing on drift.
      - CMS and Page Builder rely on the manifest (plus schemas) to drive:
        - Palettes (which blocks appear for a given pageType/slot).
        - PageType/slot validation at publish time (e.g. forbidding `CheckoutSection` on generic marketing pages).
        - App‑specific compatibility, in combination with the unsupported‑blocks behaviour defined earlier.
      - Any `PageComponent.type` not present in the manifest for a given app is treated as unsupported:
        - Runtime: `DynamicRenderer` skips it or renders a minimal placeholder and logs a structured warning.
        - CMS: Page Builder hides it from palettes, flags existing instances, and treats it as a publish‑blocking error (unless an explicit “publish anyway” override is used by an admin).
    - *Definition of done for blocks/prefabs*
      - A block or prefab is considered “ready for use” when:
        - Schema + type are defined and exported from `@acme/types`.
        - React component is implemented in `@acme/ui` (or PB subpackage) using design‑system primitives and `MediaAsset`/`CmsImage` where appropriate.
        - It is:
          - Registered in the CMS block registry, and
          - Registered in app registries that support it.
        - It has a `BlockCapability` entry (type, allowedPageTypes, allowedSlots, palette category, `deprecated?`).
        - It has:
          - At least one Storybook story (including a basic a11y story).
          - At least one test (schema/component behaviour, with deeper coverage for complex/interactive or money‑touching blocks).
        - It appears in the Page Builder palette with:
          - A short description, and
          - Correct page type/layout constraints surfaced in the inspector.
      - Code review and CI should treat this as the checklist for accepting new blocks into the shared library.
    - *Scaffolding and linting: one happy path*
      - We should provide a small generator (e.g. `pnpm new:block`) that:
        - Asks for type, label, category, pageTypes, and slots.
        - Scaffolds the schema/type, component, registry registration, manifest entry, story, and test file stubs for a new block.
        - Hooks the new block into the appropriate block palette category and PageType constraints.
      - Lint rules / CI checks can enforce basics:
        - No block component under `@acme/ui` without a corresponding schema/type.
        - No block schema without at least a minimal story and test.
        - No app registry entries for unknown block types; all types must be declared in the manifest.
      - In practice: “if you’re not using the generator, you’re probably doing it wrong”.
    - *Prefab vs “raw” blocks and evolution*
      - Distinguish between:
        - **Raw blocks** – the fundamental building units (Section, Hero, ContentRow) with flexible props.
        - **Prefabs** – opinionated compositions of raw blocks (e.g. “Standard hero with image + CTA”) that:
          - Are defined as data (template descriptors) rather than new components where possible.
          - Can be inserted into pages from a “Library”/“Prefabs” tab in Page Builder.
      - The developer workflow for a prefab is:
        - Define a `TemplateDescriptor` in `@acme/templates` using existing blocks.
        - Register it so CMS can show it in the prefab library for relevant pageTypes.
        - No new runtime components are needed unless the prefab exposes new behaviour; migration is handled via normal PB/template evolution.
      - Prefabs are **copy‑on‑use**:
        - Applying a prefab copies its `PageComponent[]` into the page once; existing pages are not live‑linked to later prefab edits.
        - Non‑breaking tweaks (copy, spacing, minor style defaults) can update the existing `TemplateDescriptor`; new uses get the updated version, existing pages remain unchanged.
        - Structural or breaking changes should:
          - Introduce a new descriptor ID/version (e.g. `HeroStandardV2`), and
          - Mark the old one as deprecated in the prefab library, not silently change its meaning.
      - This keeps behaviour predictable for editors and aligns prefab evolution with the broader template/versioning story.
    - *Keeping template and tenant apps aligned*
      - The template app is the primary target for new blocks/prefabs:
        - New blocks are first registered and tested in the template app.
        - Tenant apps opt in by:
          - Importing the same block registry and capability manifest.
          - Optionally hiding blocks that they don’t want in their palettes, but not altering behaviour.
      - Contract tests (as above) help ensure that once a block is supported by an app, it behaves the same way as in the template app.
    - *Documentation and discoverability*
      - Every block/prefab should have:
        - A short description and usage guidance (what it’s for, where it’s safe to use).
        - PageType and layout constraints (e.g. “LegalBody: legal pages only”, “CheckoutSummary: checkout system route only”).
      - Page Builder should surface this metadata in:
        - The block palette (hover/tooltip).
        - The inspector (info panel), so editors know how and where to use blocks, and developers know how to evolve them without surprising users.
- **API contracts & public surfaces**
  - What are the formal public APIs of `@acme/platform-core`, `@acme/ui`, Page Builder packages, and key runtime endpoints (`/api/cart`, `/api/checkout-session`, `/preview/:pageId`), and how do we document and enforce them (contract tests, semver, docs)?
  - **Details:**
    - *Define explicit public entrypoints per package*
      - Each shared package should expose a small, documented public API; everything else is treated as internal:
        - `@acme/platform-core`:
          - Public (examples, not exhaustive):
            - `@acme/platform-core/cartApi` – shared HTTP handlers + schemas for `/api/cart`.
            - `@acme/platform-core/checkout` – `createCheckoutSession`, config validation, and tax/shipping helpers.
            - `@acme/platform-core/repositories/*` – shop/page/product/settings repositories with clearly defined methods (e.g. `getShop`, `getShopSettings`, `getPages`).
            - `@acme/platform-core/configurator` – `ConfigCheck`s and shop readiness helpers.
          - Internal:
            - Raw Prisma/FS wiring, migrations, low‑level utilities, and any deep `src/*` paths not explicitly re‑exported.
        - `@acme/ui`:
          - Public:
            - Design‑system primitives (`Button`, `Input`, `Card`, layout primitives).
            - Shared layout components (Header/Footer shells, grid/layout wrappers).
            - CMS/PB UI (Page Builder canvas, inspector, media manager, `CmsImage`).
          - Internal:
            - Story‑only components, experimental widgets, private hooks, and internal layout wrappers not re‑exported at the root.
        - Page Builder packages:
          - `page-builder-core` – types, Zod schemas, migrations, page‑level validators, and template/model types.
          - `page-builder-ui` – Next/React UI for the builder (canvas, toolbar, inspector) wired to `page-builder-core` types.
          - `@acme/templates` – `TemplateDescriptor[]` and prefab/shop scaffolding helpers.
      - A small “Public API” doc per package should list these entrypoints with brief descriptions and stability expectations (public vs experimental vs internal).
    - *Runtime HTTP contracts as first‑class APIs*
      - A small set of runtime endpoints are part of the platform surface, not app‑local details:
        - `/api/cart`:
          - Implemented via `@acme/platform-core/cartApi`.
          - Schemas, status codes, and error semantics are normative and shared across apps.
        - `/api/checkout-session`:
          - Thin adapter over `createCheckoutSession`.
          - Responsible for enforcing config/tax/shipping invariants and returning typed error responses for misconfiguration.
        - `/preview/:pageId`:
          - Cloudflare/edge route using the preview HMAC token model (`shopId + pageId + secret`).
          - Read‑only; returns page JSON + metadata for runtime preview, with `no-store`/`force-dynamic` semantics.
        - PB page routes (e.g. `/[lang]/pages/[slug]`):
          - Map `(shopId, slug, locale)` → `Page` content for `pageType = "marketing" | "legal"`.
      - These HTTP contracts are:
        - Documented in a short “HTTP API contracts” doc (request/response shapes, error codes).
        - Enforced by a shared contract test harness that runs against the template app and selected tenant apps.
    - *Enforcement: linting, tsconfig, and contract tests*
      - To keep boundaries healthy:
        - Lint/tsconfig rules should:
          - Disallow imports from `@acme/ui/src/**` and `@acme/platform-core/src/**` in app code.
          - Allow only public entrypoints (`@acme/ui`, `@acme/platform-core/cartApi`, `@acme/platform-core/repositories/shops.server`, etc.).
        - The shared contract harness (for `/api/cart`, `/api/checkout-session`, `/preview/:pageId`, PB routes) acts as a **runtime enforcement** of HTTP contracts across apps.
      - When a public API must change:
        - Prefer additive, backwards‑compatible changes.
        - For breaking changes, version explicitly (e.g. `cartApiV2`) and maintain both until apps have migrated.
        - Use semver on shared packages (`@acme/platform-core`, `@acme/ui`) and document breaking changes in a changelog.
    - *Documentation & discoverability*
      - Public APIs and contracts should be discoverable in:
        - A short “Platform API” section in `docs/` that:
          - Lists public `platform-core` and `ui` entrypoints.
          - Describes HTTP contracts (cart, checkout, preview, PB routing, search).
          - Points to concrete examples in the template app.
        - Storybook and/or a small internal “API explorer” that demonstrates:
          - How to call key helpers (e.g. `createCheckoutSession`, `getPages`, `getShopSettings`).
      - This reduces the temptation for engineers to “just reach into an internal module” and encourages consistent usage of the shared surfaces.
    - *Internationalisation and SEO for PB routes*
      - For PB‑driven routes (e.g. `/[lang]/pages/[slug]`), SEO and i18n should follow the same rules as other content:
        - `ShopSettings.languages` defines the per‑shop locale set and primary locale.
        - `Page.slug` + visibility/SEO fields determine:
          - Which locales are exposed in sitemaps.
          - Which locales get `metadata.alternates.languages` (hreflang) entries.
      - PB changes that affect routes/SEO (`slug`, `visibility`, `seo.noindex`, canonical) must:
        - Trigger `revalidatePath` or tag‑based revalidation for the affected routes so `generateMetadata` and page payloads stay in sync.
        - Ensure `generateMetadata` sees the same data as the page renderer, so canonical URLs and hreflang always reflect current PB content.
- **Versioning & breaking changes**
  - How do we manage breaking changes in `platform-core` or `ui` with multiple tenant apps live on different timelines?
  - How should `componentVersions` and `lastUpgrade` in `shop.json` be used to coordinate upgrades and detect incompatible changes?
  - What release / rollout strategy (branching model, feature flags, canary or pilot shops) do we want for platform and UI changes that affect multiple live tenant apps?
  - **Details:**
    - *Versioning axes and guarantees*
      - We treat versioning along three axes:
        - **Packages** – `@acme/platform-core`, `@acme/ui`, `@acme/templates`, Page Builder packages, and the template app all use semver in `package.json`; minor/patch releases are additive/backwards‑compatible on public surfaces, majors may introduce breaking changes.
        - **Runtime builds** – `deploy.json` records a per‑shop build/version ID (commit SHA or hosting deployment ID) plus status and timestamps for each environment.
        - **Template/component versions per shop** – `shop.json.componentVersions` is a snapshot of the app’s `dependencies` at the time `upgrade-shop`/`republish-shop` last ran (primarily `@acme/*` packages), and `shop.json.lastUpgrade` records when that snapshot was taken.
      - Public APIs (TS entrypoints and HTTP contracts) follow the rules already described under “API contracts & public surfaces”: avoid breaking changes; when unavoidable, introduce explicitly versioned APIs (e.g. `cartApiV2`) and keep the old variant until apps migrate.
    - *Using `componentVersions` and `lastUpgrade`*
      - CLI tools (`upgrade-shop`, `republish-shop`, `rollback-shop`) are the **only writers** of `shop.json.componentVersions` and `shop.json.lastUpgrade`; CMS actions never mutate them.
      - `componentVersions` is treated as `Record<string, string>` of package → version, with platform‑relevant keys being `@acme/platform-core`, `@acme/ui`, `@acme/templates`, Page Builder packages, and any other shared libraries the template depends on.
      - `history.json` stores an append‑only log of previous `{ componentVersions, lastUpgrade }` snapshots for that shop; together, these files let us answer:
        - “Which platform/UI/template versions is this shop currently on?”
        - “Which shops are still on an older major of `platform-core`/`ui` and need an upgrade?”
        - “What changed between two upgrades for this shop?”.
      - Upgrade tooling should centralise simple helpers like:
        - `getShopComponentVersions(shopId)` → current `componentVersions` for the shop.
        - `isShopOnVersion(shopId, pkg, range)` → whether the shop’s recorded version for `pkg` satisfies a semver range, to drive eligibility checks and safety rails.
    - *Breaking change policy for shared packages*
      - For `platform-core`/`ui` and other shared packages:
        - Minor/patch releases must not break public APIs or change documented behaviour; they may add new capabilities and deprecate old ones.
        - Breaking changes ship as **new majors** and, where feasible, through **newly named entrypoints** (`fooV2`/`fooV3`) rather than silently changing existing ones.
        - When we introduce a new major, upgrade tooling should:
          - Ensure the template app and its dependencies are bumped first.
          - Use `upgrade-shop` to stage upgrades for selected shops by copying the updated template (and `package.json`), thereby updating `componentVersions`.
          - Refuse to stage upgrades for shops whose customisations are incompatible (e.g. local diffs in files that changed significantly), flagging them for manual work.
      - At runtime, code can consult `componentVersions` (e.g. via a `RuntimeConfig` helper) to enable “compat” code paths where necessary:
        - Example: if a shop is still on `@acme/ui < 3.0.0`, use old prop shapes or avoid new features that require the latest components.
    - *Rollout and canary strategy*
      - For risky platform/core changes we prefer **incremental rollout** rather than “flip for everyone”:
        - Develop on feature branches; merge to `main` behind flags or compat layers where needed.
        - First upgrade **internal/canary shops** (marked via a simple flag in `Shop`/`ShopSettings` or a small config list) using `upgrade-shop`, then republish and run the golden‑journey tests against them.
        - Once canaries are healthy, roll out to more shops in batches, guided by queries over `componentVersions` (e.g. “all shops still on `@acme/platform-core` 1.x”).
      - Each environment is independent:
        - Dev/stage shops are upgraded first; only once they are healthy do we run the same upgrade commands against production shops.
        - `componentVersions` and `history.json` are per‑environment, so we can see exactly which version each shop is on in dev/stage/prod.
    - *Guardrails and tests around upgrades*
      - Contract tests (for `/api/cart`, `/api/checkout-session`, `/preview/:pageId`, PB routes) should run against both the template app and at least one upgraded tenant app whenever shared packages change, acting as a safety net for breaking changes.
      - The upgrade CLI can add simple pre‑flight checks before staging/publishing:
        - Refuse to run if `shop.json` is missing or invalid, or if `componentVersions` indicates a jump across more than one major without an explicit “force” flag.
        - Emit clear summaries of what will change (derived from diffs and `componentVersions` deltas) before applying upgrades.
      - Combined with `history.json` and `rollback-shop`, this gives us a pragmatic, per‑shop rollback story if a breaking change causes regressions after publish.
- **Local dev & data seeding**
  - How easy is it today to spin up a realistic shop locally (products, pages, orders), and what scripts/fixtures do we need to make that trivial?
  - Do we need standard “sample shops” for QA/regression testing of prefabs and flows?
  - **Details:**
    - *Standard “sample shops” as fixtures*
      - We commit to a small set of **canonical sample shops**, each with a stable `shopId` and profile:
        - `shop-sample-basic`:
          - Single‑locale (e.g. `en`), simple theme, minimal product catalogue.
          - One PB marketing page (e.g. `/en/pages/about`) and one legal page (e.g. `/en/returns`).
          - Basic PLP/PDP and a simple `/en/checkout` flow (single currency, straightforward shipping).
        - `shop-sample-multilocale`:
          - 2–3 locales, richer navigation and PB content, more complex SEO (hreflang, per‑locale canonicalBase).
          - Useful for i18n + SEO regressions (home, key PB pages, and legal pages across locales).
        - `shop-sample-advanced`:
          - Rental features, deposits, reverse logistics/premier delivery, try‑on toggles enabled.
          - At least one order in each lifecycle state to exercise account/returns UIs.
      - For each sample we should document:
        - `shopId`, default locale(s), currency, `taxRegion`.
        - Which apps it is wired into by default (template app, one tenant, etc.).
        - A few “golden” routes for manual QA (e.g. `/en`, `/en/shop`, `/en/pages/about`, `/en/checkout`).
      - These fixtures underpin local dev, integration tests, and E2E golden paths without bespoke setup in every test.
    - *One‑command local spin‑up tied to real flows*
      - Local setup should aim for “one command → realistic shop using the same flows as production”:
        - A script/CLI (or Turbo task) that:
          - Runs migrations.
          - Seeds sample shops (including PB pages, settings, products, inventory, and a few orders), preferably via `createShop` + `seedSampleShop` rather than raw inserts.
          - Ensures `data/shops/<id>/shop.json` and any necessary `deploy.json`/`history.json` scaffolding exist for those shops.
          - Starts CMS + at least one runtime app pointing at a chosen sample shop (via `NEXT_PUBLIC_SHOP_ID` or equivalent).
        - Idempotent seeding: re‑running the command updates fixtures in place (or no‑ops) rather than duplicating data.
      - Local target state could be described as:
        - `pnpm dev:sample` → CMS + template app running against `shop-sample-basic` with PB and checkout ready to use.
    - *Sample shops for QA and prefab regression*
      - For QA/regression of PB and prefabs, we favour:
        - Re‑using the canonical sample shops in both tests and docs:
          - E2E tests assume `shop-sample-basic` / `shop-sample-multilocale` / `shop-sample-advanced` exist rather than re‑seeding random shops.
          - Storybook stories (particularly for PB blocks/prefabs) can optionally mock data taken from these samples so visual states match reality.
        - Ensuring each sample exercises specific surfaces:
          - `sample-basic`: PLP/PDP, simple checkout, basic legal page wiring.
          - `sample-multilocale`: multi‑locale PB pages, SEO + hreflang.
          - `sample-advanced`: rentals, deposits, reverse logistics, try‑on, orders across lifecycle states.
      - When adding a new prefab/block that’s important to one of these surfaces, engineers should know which sample shop/page to use for visual and E2E verification.
    - *Data isolation and reset*
      - To keep local experiments safe and repeatable:
        - Sample shops should be clearly identifiable:
          - Distinct `shop.id` values (e.g. prefixed with `shop-sample-*`) and optionally an `isSample: true` flag in `Shop`/`ShopSettings`.
          - Seeded products/pages/orders for samples can share a `sampleId` tag or naming convention so reset scripts can find them deterministically.
        - Provide a narrow, idempotent “reset sample data” script that:
          - Drops/re‑creates only sample shop data (or re‑applies fixtures) without affecting arbitrary dev data.
          - Is safe to run before each integration/E2E suite and multiple times in a row.
        - Avoid using real production‑like secrets or PII in sample data; fixtures should be obviously synthetic but realistic enough for UX.
    - *Where seeding logic lives and how it’s tested*
      - Seeding logic should sit close to the domain model (in `platform-core` or a small `@acme/fixtures` package), not inside apps:
        - `platform-core` can expose helpers like `seedSampleShop(id, profile)` that:
          - Call repositories/services (`shopsRepo`, `settingsRepo`, `pagesRepo`, `productsRepo`, `ordersRepo`) to create/update shops, settings, products, pages, inventory, and orders.
          - Avoid talking directly to Prisma/FS except through those repositories, keeping fixtures aligned with real persistence behaviour (including any JSON/DB dual‑writes).
        - CMS/tests/scripts call these helpers rather than hand‑crafting inserts.
      - Fixtures and seeding helpers themselves should be typed and lightly tested:
        - Define fixture payloads as typed constants (e.g. `SampleShopFixture`, `SampleProductFixture`).
        - Unit test `seedSampleShop` against an in‑memory/SQLite DB to ensure:
          - It succeeds end‑to‑end and is idempotent.
          - Required invariants are satisfied (settings valid for checkout, at least one product in stock, required pages exist).
      - When schemas evolve (e.g. new required fields on `ShopSettings`, new PB block types), fixtures and seeding helpers are updated alongside, so local dev and tests continue to reflect a realistic, launchable shop.
- **Observability**
  - What logging/metrics/tracing conventions should we use (tagging by shop ID) for critical flows like createShop, publish, upgrade, checkout?
  - How should developers instrument new features so production issues can be quickly attributed to specific shops, versions, or flows?
  - **Details:**
    - *Reuse the shared logging context everywhere*
      - We standardise on the same logging conventions described under “Operational observability”:
        - All logs go through the shared structured logger (JSON with at least `timestamp`, `level`, `shopId`, `app`, `env`, `requestId`, `operationId`, and a short `message`).
        - A per‑request context (in CMS, APIs, runtimes) attaches `shopId`, `userId` (if present), and an `operationId` for multi‑step flows (`createShop`, `publishPage`, `upgradeShop`, `checkout`, etc.).
      - From a DX perspective, this means:
        - New code that materially affects a golden journey should either reuse an existing `operationId` or clearly define a new one.
        - Logs for a given shop/flow are always discoverable by filtering on `{ shopId, operationId }`.
    - *Metrics around golden journeys, not every function*
      - Rather than instrumenting everything, we focus metrics on the three journeys:
        - Journey A (shop → live storefront): counters and latencies for `createShop`, `deployShop`, and their failure modes (tagged by `shopId`, `env`, `result`).
        - Journey B (edit → publish → live page): counters for `publishPage` outcomes (success/validation error/runtime error), plus simple “publish → first successful revalidation” timings where possible.
        - Journey C (cart → checkout → order): counters and latencies for `/api/cart`, `/api/checkout-session`, and Stripe webhook handling, tagged by `shopId`, `currency`, `result`, and `errorCode` for failures.
      - New features should ask “which journey does this touch?” and, if applicable, increment the appropriate metric and reuse the existing labels rather than inventing ad‑hoc ones.
    - *Traces as an optional but aligned layer*
      - If/when we add distributed tracing (e.g. OpenTelemetry), we piggy‑back on the same context:
        - Spans are named after operations (`createShop`, `publishPage`, `upgradeShop`, `checkoutSession`) and always carry `shopId`, `app`, and `env` attributes.
        - CMS, APIs, and runtimes all create child spans under a shared `operationId` where flows cross process boundaries.
      - For now, the main requirement for developers is to:
        - Use the shared logger and context helpers instead of ad‑hoc `console.log`.
        - Add log/metric hooks at the “edges” of the golden journeys (start/end/failure), not in every helper.
    - *Developer guidance for new code*
      - When adding or changing a feature, engineers should:
        - Decide which journey(s) it touches and ensure at least one log + (if meaningful) one metric is emitted at the journey level.
        - Include `shopId`, `operationId`, and a stable `errorCode` when logging failures that could affect merchants or money flows.
      - This keeps observability focused, consistent, and tied directly to the behaviours we care about, without turning every internal helper into a source of noisy logs.
- **Third‑party / plugin developer experience**
  - Do we anticipate external integrators building on this platform, and if so, what guarantees and tooling do they need (SDKs, examples, sandbox shops, test data)?
  - **Details:**
    - *Treat external integrators as “first‑class app developers”*
      - For any future third‑party/plugin story, we assume integrators build against:
        - Documented HTTP contracts (`/api/cart`, `/api/checkout-session`, `/preview/:pageId`, search, webhooks).
        - Public `@acme/*` entrypoints (or a small, dedicated “plugin SDK” wrapper) rather than internal modules.
      - Guarantees we should aim to provide:
        - Stable, versioned APIs with clear semver and deprecation guidance.
        - A sandbox environment with test shops and fake payment credentials for development.
    - *Lightweight SDKs over raw HTTP where helpful*
      - For flows that are hard to implement correctly by hand (e.g. cart/checkout, webhooks), we can expose:
        - A minimal TypeScript client (or set of helpers) that wraps public endpoints and schemas.
        - A webhook helper that validates signatures, parses events, and normalises common patterns (idempotency, retries).
      - These helpers are thin shims over our own public APIs so they don’t introduce a second, competing abstraction.
    - *Examples and fixtures*
      - Provide small, self‑contained examples that show:
        - How to integrate a custom frontend with the cart/checkout APIs.
        - How to consume webhooks and update an external system.
        - How to work with preview URLs/tokens safely.
      - Examples should use the same sample shops and fixtures defined under “Local dev & data seeding”, so integrators see realistic payloads and flows.
    - *Scope of the plugin surface*
      - In early phases, we keep the third‑party surface narrow:
        - Focus on API and webhook integrations (e.g. analytics, fulfilment, CRM).
        - Defer “arbitrary UI plugins inside Page Builder” until the core CMS and shop platform are stable.
      - This keeps the internal layering (`platform-core`, `ui`, `cms-marketing`, apps) intact while still making it feasible to integrate external systems.
- **DX metrics & pain points**
  - What are the current DX bottlenecks (cold-start times, rebuild times, debugging cross-package issues), and how will we measure improvement?
  - Which core workflows (e.g., adding a block, spinning up a new shop, running tests) should we prioritise for DX investment?
  - **Details:**
    - *Measure the core developer journeys*
      - We focus DX metrics on a few recurring workflows:
        - **Bootstrapping** – time from `git clone` to “CMS + template app running against a sample shop”.
        - **Adding a block/prefab** – time/steps from “need new block” to “block appears in PB and a runtime route with passing tests”.
        - **Golden‑path test runs** – wall‑clock time and stability for the main golden‑path E2Es and key `platform-core` suites.
      - Where possible, we track these via:
        - CI timings (per pipeline stage, per suite).
        - Occasional manual spot‑checks for local workflows, recorded in this doc or a small internal DX log.
    - *Prioritise friction along golden journeys*
      - When deciding what to improve, we ask:
        - Does this friction affect creating shops, publishing content, or running checkout flows?
        - Does it slow down the “add a new prefab” workflow or golden‑path tests?
      - Items that materially slow or complicate those paths (e.g. very slow golden‑path E2Es, hard‑to‑debug cross‑package errors) get priority over one‑off pain points.
    - *Keep tests fast and focused by default*
      - We continue to favour:
        - Fast, package‑local unit/integration tests in `platform-core` and `ui`.
        - A small, stable set of contract tests and golden‑path E2Es.
      - DX improvements should avoid turning golden‑path E2Es into a large, brittle suite; instead, we:
        - Optimise their runtime (selective seeding, headless runs).
        - Keep them narrowly focused on the journeys they represent.
    - *Documentation as part of DX*
      - For workflows we care about (new block, new shop, running tests), we treat up‑to‑date docs as part of the DX contract:
        - A short, current “Adding a block/prefab” guide aligned with the scaffolding and manifest rules.
        - A “New shop locally” guide that leans on sample shops/seed scripts.
        - A “Which tests to run when…” guide that maps common changes to the suites that should be run.
      - This keeps the mental load low for new contributors and helps avoid misuse of internal APIs and ad‑hoc dev workflows.
      - Internationalisation and SEO:
        - For PB routes, use `ShopSettings.languages` and `Page.slug`/`visibility` to drive:
          - `metadata.alternates.languages` (hreflang) per locale.
          - Inclusion in sitemaps per locale.
        - PB edits that affect routes/SEO (e.g. slug, visibility, noindex) should trigger `revalidatePath` or tag‑based revalidation for the affected routes so `generateMetadata` and page payloads stay in sync.
