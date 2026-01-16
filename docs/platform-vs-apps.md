Type: Contract
Status: Canonical
Domain: Platform
Last-reviewed: 2025-12-02

Canonical code:
- packages/platform-core/**
- packages/ui/**
- apps/**

# Platform vs tenant responsibilities and public API

This document is the canonical reference for:

- What the **platform** (`@acme/platform-core`, `@acme/ui`) owns vs what **tenant apps** own.
- Which **import paths are public API** and safe for apps/CMS to depend on.
- Which paths are **internal details** (subject to change without notice).

The same rules apply whether code imports the packages directly (for example `@acme/platform-core`) or via workspace aliases (for example `@acme/platform-core`, `@ui`) configured in `tsconfig.paths`.

---

## Platform vs tenant responsibilities

### Platform-core (`@acme/platform-core`)

**What it owns**

- Business domain and persistence for all shops:
  - `Shop`, `ShopSettings`, products, inventory, pricing, tax, cart, checkout, orders, returns, subscriptions, analytics, and background services.
- Repository layer:
  - `@acme/platform-core/repositories/*` entrypoints for shops/pages/settings/products/orders and related domains, with Prisma/JSON backends hidden behind `*_BACKEND` env vars.
- Runtime services and shared flows:
  - React contexts such as `CartContext`, `CurrencyContext`, `ThemeContext`, `LayoutContext`.
  - Shop lifecycle flows like `createShop`, `deployShop`, and related upgrade/preview helpers.

### UI package (`@acme/ui`)

**What it owns**

- Shared design system:
  - Atoms/molecules/organisms/layout components used by CMS and storefront apps.
- CMS & Page Builder UI:
  - Page Builder canvas, block palette, inspector panels.
  - CMS‑specific components (media manager, navigation editor, shop chooser, etc.).
- Layout primitives for tenant apps:
  - Shared `Header`, `Footer`, `AppShell`, grids, typography, and related layout scaffolding.

### Tenant apps (`apps/cover-me-pretty`, `apps/skylar`, …)

**What they own**

- The Next.js shell:
  - App Router structure (`app/[lang]/…`), layouts, error and not‑found pages, route‑level data fetching.
- Brand and UX composition:
  - Fonts, colours, themes, SEO conventions.
  - Page composition using `@acme/ui` components and Page Builder–driven content.
  - Choosing which Page Builder blocks/templates are available for that brand.

**How they integrate with the platform**

- They only consume **public APIs** from:
  - `@acme/platform-core` (domain, persistence, flows).
  - `@acme/ui` (design system, Page Builder UI, layout components).
- They must not:
  - Implement their own cart/checkout/orders/pricing logic.
  - Talk directly to DB/JSON backends or copy/paste repository internals.
- When an app needs behaviour that isn’t exposed yet, it should:
  - Design or request a new abstraction in platform-core.
  - Consume that abstraction once it exists, instead of building a one‑off in `apps/*`.

---

## Public API: `@acme/platform-core`

The patterns below describe the **intended public surface**. Code in apps and CMS should stick to these imports (or their `@acme/platform-core` alias equivalents).

### Root export

- `@acme/platform-core`
  - React contexts:
    - `LayoutProvider`, `ThemeProvider`, `CurrencyProvider`, hooks from `LayoutContext`, `ThemeContext`, `CurrencyContext`.
  - Profile helpers:
    - Exports from `./profile` (for example customer profile types and helpers).
  - Rule: keep the root entrypoint small and focused on contexts/hooks and generally useful, stable helpers. Prefer subpath imports for everything else.

### Cart & checkout

Apps may import the following for cart and checkout behaviour:

- Cart state and persistence:
  - `@acme/platform-core/cart`
  - `@acme/platform-core/cartCookie`
  - `@acme/platform-core/cartStore`
  - `@acme/platform-core/cartApi`
- Checkout and pricing:
  - `@acme/platform-core/checkout/*` (for example `checkout/session`).
  - `@acme/platform-core/pricing`
  - `@acme/platform-core/tax`
  - `@acme/platform-core/coupons`

These subpaths are designed to be the only way tenant apps implement cart and checkout; apps should not re‑implement pricing, tax, or session logic.

### Domain repositories (server‑side)

Server code in apps and CMS may call **repository entrypoints** for domain access:

- Shops and settings:
  - `@acme/platform-core/repositories/shops.server`
  - `@acme/platform-core/repositories/shop.server`
  - `@acme/platform-core/repositories/settings.server`
- Pages and content:
  - `@acme/platform-core/repositories/pages.server`
  - `@acme/platform-core/repositories/blog.server`
- Products and inventory:
  - `@acme/platform-core/repositories/products.server`
  - `@acme/platform-core/repositories/inventory.server`
- Orders and returns:
  - `@acme/platform-core/repositories/orders.server`
  - `@acme/platform-core/repositories/rentalOrders.server`
  - `@acme/platform-core/repositories/subscriptionUsage.server`
  - `@acme/platform-core/repositories/returnAuthorization.server`
  - `@acme/platform-core/repositories/returnLogistics.server`
- Other per‑shop data:
  - `@acme/platform-core/repositories/themePresets.server`
  - `@acme/platform-core/repositories/seoAudit.server`

Pattern rule:

- `@acme/platform-core/repositories/*.server` are **public repository entrypoints**.
- Backend‑specific `.prisma.server` / `.json.server` modules remain **internal implementation details** (see “Internal-only paths” below).

### Shop lifecycle and deployment

Apps, CMS, and tooling may depend on:

- `@acme/platform-core/createShop`
- `@acme/platform-core/themeTokens`
- `@acme/platform-core/stripe-webhook`
- `@acme/platform-core/handleStripeWebhook`

These paths encapsulate the create/deploy/upgrade flows and Stripe webhook behaviour. Tenant apps should use them rather than re‑creating flows.

### Schemas and validation

For shared API contracts and validation, apps may import:

- `@acme/platform-core/schemas/*` (for example `schemas/cart`, `schemas/address`).
- `@acme/platform-core/validation/*` for Page Builder and template validation (for example `validation/templateValidation`, `validation/sectionRules`, `validation/options`).

These modules define request/response shapes and validation logic that both CMS and runtime apps rely on.

### Other stable modules

The following modules are also considered public:

- `@acme/platform-core/products` and `@acme/platform-core/products/*`
- `@acme/platform-core/shops` and `@acme/platform-core/shops/*`
- `@acme/platform-core/orders`
- `@acme/platform-core/shipping`
- `@acme/platform-core/returnLogistics`
- `@acme/platform-core/analytics`
- `@acme/platform-core/customerProfiles`

If a symbol is exported via a documented path above and used in apps, treat it as part of the platform API.

---

## Public API: `@acme/ui`

Apps and CMS code should import UI from `@acme/ui` (or the `@ui` alias), sticking to the entrypoints below.

### Root export

- `@acme/ui`
  - Re‑exports from:
    - `components` (atoms/molecules/organisms/templates, CMS components, overlays).
    - `hooks`
    - `utils`
  - Examples:
    - Layout and shell components such as `Header`, `Footer`, `AppShell`.
    - Page Builder UI components (via the `cms` exports).
    - Common hooks and utilities (for example form helpers).

Rule:

- Prefer `import { Component } from "@acme/ui"` (or `@ui`) over deep `components/*` imports wherever possible.

### CMS and Page Builder blocks

The following subpaths are explicitly public and safe for apps to use:

- `@acme/ui/components/cms/blocks/CollectionSection.server`
- `@acme/ui/components/cms/blocks/CollectionSection.client`
- `@acme/ui/components/cms/blocks/HeaderSection`
- `@acme/ui/components/cms/blocks/FooterSection`
- `@acme/ui/components/cms/blocks/CurrencySelector`
- `@acme/ui/components/cms/blocks/RentalAvailabilitySection`
- `@acme/ui/components/cms/blocks/RentalTermsSection`
- `@acme/ui/components/cms/blocks/StructuredDataSection`
- `@acme/ui/components/cms/blocks/ConsentSection`
- `@acme/ui/components/cms/blocks/AnalyticsPixelsSection`
- `@acme/ui/components/cms/blocks/RentalDemoProvider.client`

These match the package’s explicit `exports` map and are intended for use by tenant apps and CMS routes.

### Account aggregate entrypoint

- `@acme/ui/account`
  - Public aggregate for account‑related UI (for example order history and profile views).

### Layout primitives and utilities

In addition to the root exports, the following are treated as public for layout/theming:

- `@acme/ui/components/ThemeStyle` — server component that injects theme tokens and fonts for a shop.
- `@acme/ui/components/cms/ShopChooser` — CMS shop chooser.
- Layout primitives used by CMS and dashboards:
  - `@acme/ui/components/atoms/primitives` (for example `Grid`, `Stack`, `Inline`, `Sidebar`).
- Layout shell components for storefronts:
  - `@acme/ui/components/layout/Header`
  - `@acme/ui/components/layout/Footer`

New code should prefer using these via `@acme/ui` (for example `import { ThemeStyle } from "@acme/ui"`) once equivalent forwards are in place, but the paths above are considered part of the supported public surface.

---

## Internal-only paths

The following patterns are **internal implementation details** and should not be imported from apps or CMS UI. They may change without notice.

### Platform-core internals

- Backend-specific repository implementations:
  - `@acme/platform-core/repositories/*.prisma.server`
  - `@acme/platform-core/repositories/*.json.server`
- Low-level infrastructure helpers:
  - `@acme/platform-core/db`
  - `@acme/platform-core/dataRoot`
  - `@acme/platform-core/utils/safeFs`
- Any path under an explicit `internal` folder (for example `@acme/platform-core/internal/**`) if/when added.
- Any `@acme/platform-core/*` path not covered in the “Public API” section above should be treated as internal by default.

### UI internals

- Source-only paths:
  - `@acme/ui/src/**`
  - `@ui/src/**`
- Deep component paths that are not documented as public:
  - `@acme/ui/components/**` and `@ui/components/**` except for the specific public subpaths listed in this document.
- Any new `internal` or `__tests__` folders under `packages/ui`.

When in doubt, prefer importing from:

- `@acme/platform-core` root or its documented subpaths.
- `@acme/ui` root or the documented subpaths above.

If you find yourself needing an internal import for a new feature, treat that as a signal to propose a new public abstraction in platform-core or UI instead.
