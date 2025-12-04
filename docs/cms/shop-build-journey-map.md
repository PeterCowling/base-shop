Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03
Primary code entrypoints:
- `apps/cms/src/app/cms/configurator`
- `apps/cms/src/app/cms/shop/[shop]/settings`
- `apps/cms/src/app/cms/pages`
- `apps/cms/src/app/cms/products`
- `packages/page-builder-core`, `packages/page-builder-ui`, `packages/templates`
- `packages/ui/src/components/{atoms,molecules,organisms,templates}`

# Shop Build Journey Map

This document is the deliverable for **CMS-BUILD-01**. It maps the user journeys, CMS surfaces, and reference components that collectively make a shop build ready for launch (Configurator ⇒ Settings ⇒ Theme ⇒ Pages ⇒ Products).

- **Audience:** CMS developers, UX designers/writers, and AI agents that need a concise, code-linked overview of how build surfaces connect to ConfigChecks and templates.
- **Role:** this is the **“what exists & how it connects”** map. Gaps are described in `docs/cms/shop-build-gap-analysis.md`; fixes are planned in `docs/cms/shop-build-plan.md` and detailed for docs/help/telemetry in `docs/cms/shop-build-docs-help-plan.md`.

The map is intentionally concise and linked so agents can verify every step against the code and docs derived from `docs/cms/build-shop-guide.md` and `docs/cms/configurator-contract.md`.

> **Future review:** revisit this map whenever ConfigChecks change in `packages/platform-core/src/configurator.ts` or when new build surfaces are added/removed (for example, future CMS-BUILD-* tasks).

## 1. Entry points

- **Configurator (`/cms/configurator`)** – primary "build a shop" hub that walks through all required configuration steps. Implemented under `apps/cms/src/app/cms/configurator/steps`.
- **Shop chooser / dashboard (`/cms/shop/[shop]`)** – once launched, the shop selector and dashboard routes lead to Settings, Theme, Pages, Products, Media, and the upgrade/health surfaces.
- **Settings portal (`/cms/shop/[shop]/settings`)** – single-stop shop for currencies, taxes, logistics, SEO, and policy defaults. Many ConfigChecks continue to rely on fields edited here.
- **Pages (`/cms/pages`) and Products (`/cms/products`)** – host the full editors for CMS-managed pages and catalog content that connect back to ConfigChecks (navigation, home, PDP, checkout).
- **Media (`/cms/shop/[shop]/media`) and Theme (`/cms/shop/[shop]/themes`)** – supply assets and design tokens referenced by home/shop/layout templates.

### 1.1 Happy-path narrative (high-level)

1. Start at `/cms/configurator` and create the shop shell (Shop Details/Shop Type).
2. Choose a theme and typography tokens (Theme/Tokens steps) and confirm navigation/home layout.
3. Configure payments, shipping, and environment variables for providers.
4. Ensure core pages (home/shop/product/checkout) are scaffolded via templates and Page Builder.
5. Switch to `/cms/shop/{shop}/settings` to check languages, currency, tax region, and service automations.
6. Use `/cms/pages` and `/cms/products` to finalise mandatory content (home, checkout, at least one active product with inventory).
7. Review Configurator progress and shop health; when all required ConfigChecks pass, launch.

### 1.2 One-hour launch path (minimum viable)

For a “launch in about an hour” experience, focus on the minimum surfaces needed to satisfy all required ConfigChecks:

- **Configurator (required steps)**
  - Shop Details / Shop Type → `shop-basics`.
  - Theme / Tokens → `theme`.
  - Payment Provider / Shipping / Env Vars → `payments`, `shipping-tax`.
  - Navigation / Home / Shop / Product / Checkout → `navigation-home`, `checkout`, `products-inventory` (via PDP wiring).
- **Settings**
  - `/cms/shop/{shop}/settings`:
    - Languages, currency, tax region, shipping providers (feeds basics/payments/shipping‑tax checks).
- **Products**
  - `/cms/products`:
    - Create at least one active product with stock (minimal first‑product fields).
- **Pages (only if needed for checkout)**
  - `/cms/pages`:
    - Confirm the checkout page exists and is published when the Configurator cannot fully create/publish it.

Everything else (Theme Editor fine‑tuning, Additional Pages, media library, advanced automations) is **optional for initial launch** and can be revisited post‑launch. The shop-build guide’s “Launch in under an hour” section builds on this path for shop owners.

## 2. Configurator steps → ConfigChecks

| Step | Route / file | Key ConfigCheck(s) | Notes / components |
| --- | --- | --- | --- |
| Shop Details | `apps/cms/src/app/cms/configurator/steps/StepShopDetails.tsx` | `checkShopBasics` | Creates `Shop` + `ShopSettings`, seeds languages, saves connectors via `ConfiguratorHooks`. |
| Theme | `.../StepTheme.tsx` | `checkTheme` | Picks theme ID and writes `Shop.themeId`; preview uses `ThemeEditorForm`. |
| Tokens | `.../StepTokens.tsx` | `checkTheme` | Edits token overrides persisted in `Shop.themeTokens`. |
| Layout | `.../StepLayout.tsx` | `checkNavigationHome` (indirect) | Chooses layout presets, tying to Page Builder templates (home/shop). |
| Navigation | `.../StepNavigation.tsx` | `checkNavigationHome` | Builds header/nav tree persisted on `Shop.navigation`. |
| Home Page | `.../StepHomePage.tsx` | `checkNavigationHome` | Calls Page Builder APIs; uses `packages/page-builder-core` blocks. |
| Shop Page | `.../StepShopPage.tsx` | `checkNavigationHome` | Configures listing layout (grid, filters). |
| Product Page | `.../StepProductPage.tsx` | `checkProductsInventory` | Links to PDP template descriptors from `packages/templates`. |
| Checkout Page | `.../StepCheckoutPage.tsx` | `checkCheckout` | Applies checkout shell template; `packages/templates` defines `CheckoutSection`, `CartSection`. |
| Additional Pages | `.../StepAdditionalPages` | `checkNavigationHome`, CMS defaults | Provides access to `apps/cms/src/app/cms/pages/new`, reuses Page Builder presets. |
| Inventory | `.../StepInventory.tsx` | `checkProductsInventory` | Hooks into `apps/cms/src/app/cms/products` helpers; ensures base inventory and `StockAlert` data. |
| Payment Provider | `.../StepPaymentProvider.tsx` | `checkPayments` | Collects currency + Stripe/Adyen tokens stored in `ShopSettings`. |
| Shipping | `.../StepShipping.tsx` | `checkShippingTax` | Sets tax region, shipping providers, and `Shop.shippingProviders`. |
| Environment Variables | `.../StepEnvVars.tsx` | `checkPayments`, `checkShippingTax` (indirect) | Prompts for provider env vars used by `platform-core`. |
| Summary | `.../StepSummary.tsx` | all checks | Shows progress, final review, `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts`. |

All ConfigChecks are defined in `packages/platform-core/src/configurator.ts`, and each required step above is expected to participate in the `build_flow_step_view`, `build_flow_step_complete`, and `build_flow_step_error` telemetry events described in `docs/cms/shop-build-docs-help-plan.md`.

## 3. Post-configurator surfaces

- **Shop Settings (`apps/cms/src/app/cms/shop/[shop]/settings/page.tsx`)** – sections: currency & tax (`CurrencyTaxEditor.tsx`), SEO (`seo/`), stock alerts/schedulers, logistics (returns, premier delivery, deposits). ConfigChecks continue to read from these persisted fields (`shopSettings.*`).
- **Theme Editor (`.../shop/[shop]/themes/ThemeEditor.tsx`)** – extends token overrides; pulls tokens from `packages/themes` and connects to `docs/theming.md`/`docs/theme-editor-tokens.md`.
- **Pages editors (`apps/cms/src/app/cms/pages/edit/page.tsx`, `.../new/page.tsx`)** – integrate Page Builder palettes, templates, and `packages/page-builder-ui`. Additional pages here complement Configurator Additional Pages step and expose starter kits.
- **Products flow (`apps/cms/src/app/cms/products/page.tsx`)** – lists products, quick "Add product" actions; interacts with `packages/platform-core/src/repositories/products.server.ts`.
- **Media and Marketing components** – `apps/cms/src/app/cms/shop/[shop]/media` and `marketing` sections supply imagery used by home/shop templates; they are *supporting* surfaces and do not currently gate launch readiness.
- **Navigation & Layout fragments** – `apps/cms/src/app/cms/shop/[shop]/sections` provides reusable pieces (hero, value props) referenced by Page Builder templates.

For launch readiness:

- **Required / strongly related surfaces**
  - Settings: languages, currency, tax region, shipping providers (shop basics, payments, shipping-tax).
  - Theme Editor: theme and tokens (theme).
  - Pages: home/shop/product/checkout pages and navigation (navigation-home, checkout).
  - Products: at least one active product with inventory (products-inventory).
- **Supporting surfaces**
  - Media/marketing: assets that improve quality but do not currently contribute to ConfigChecks.

## 4. Component / Template sources

- **Design System (packages/ui)** – atoms/molecules/organisms/templates in `packages/ui/src/components` are the building blocks the CMS pages render; Storybook (`apps/storybook`) documents their behaviour. Starter kits will be composed of these organisms (hero banners, value props, product grids, PDP details, checkout sections).
- **Core templates (`packages/templates/src/corePageTemplates.ts`)** – define default home, shop, product, checkout layouts; consumed by configurator steps (`StepHomePage`, `StepShopPage`, etc.) and reused post-launch for re-seeding/resets.
- **Page Builder libraries** – `packages/page-builder-core` + `packages/page-builder-ui` provide block metadata (`docs/page-builder-metadata.md`) and remote presets (`docs/pagebuilder-library.md`); `apps/cms` pulls presets into Configurator and `/cms/pages`.
- **Configurable starter kits** – these templates plus `Theme` + `Tokens` + `Navigation` combine to deliver quick-start shops; to be surfaced via CMS-BUILD-07 / CMS-BUILD-08.

## 5. Observability & next steps

- This map was the foundation for CMS-BUILD-02, which used it to produce the gap analysis in `docs/cms/shop-build-gap-analysis.md` (per-check coverage vs UX gaps).
- CMS-BUILD-06 and later tasks expand the component side of this map, turning each row into a richer `component/block → surface` matrix (for example, starter kits based on `packages/ui` organisms and Page Builder blocks).
- Build-flow telemetry events (`build_flow_step_*`, `build_flow_first_product_*`, `build_flow_help_requested`, `build_flow_exit`) should be emitted from the steps and surfaces listed here; see `docs/cms/shop-build-docs-help-plan.md` for event names and payloads.

Treat this map as the stable routing/structure reference; when ConfigChecks or core build flows change, update it in tandem with the gap analysis and docs/help plan so agents always have a current, code-linked overview.
