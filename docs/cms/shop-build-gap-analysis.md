Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2025-12-03
File: docs/cms/shop-build-gap-analysis.md
Primary code entrypoints:
- `packages/platform-core/src/configurator.ts`
- `apps/cms/src/app/cms/configurator/steps`
- `apps/cms/src/app/cms/shop/[shop]/settings`
- `apps/cms/src/app/cms/products`
- `apps/cms/src/app/cms/pages`

# Shop Build Gap Analysis — Required Checks & First-Product Flow

This document is a **diagnostic gap analysis** for the required ConfigChecks and the surfaces outside the Configurator that influence them. It also proposes candidate fixes and quick wins, but:

- Final solution ownership and status live in:
  - `docs/cms/shop-build-plan.md` (tasks such as CMS-BUILD-02, CMS-BUILD-10, CMS-BUILD-11).
  - `docs/cms/shop-build-docs-help-plan.md` (docs/help/telemetry implementation for CMS-BUILD-11).
- Behaviour and invariants always come from `packages/platform-core/src/configurator.ts` and related repositories; this file explains where UX and flows fall short from a builder’s perspective.

## 1. ConfigCheck coverage + gaps

All ConfigChecks referenced here are defined in `packages/platform-core/src/configurator.ts`. The table below focuses on the *UX coverage* and current friction; solution status is tracked in `docs/cms/shop-build-plan.md`.

| ConfigCheck | Existing surface(s) | Observed gap / opportunity | Status |
| --- | --- | --- | --- |
| `checkShopBasics` | `StepShopDetails` (shop/create form) seeds `Shop` + `ShopSettings`; `ShopEditor` and `ConfigurationOverview` (settings page) surface languages via `settings.languages`. | **Gap:** there is no explicit “Confirm languages” flow during build and languages default to the full `LOCALES` set (`DEFAULT_LANGUAGES` in `packages/platform-core/src/repositories/settings.json.server.ts`). Builders may never intentionally set their primary locale. **Ideal state:** a small “Choose primary language” prompt during build plus clear snapshot in Settings. **Likely fix locations:** Configurator summary, `SettingsHero`, `ConfigurationOverview`. | Planned (CMS-BUILD-02, CMS-BUILD-03, CMS-BUILD-11) |
| `checkTheme` | `StepTheme` and `StepTokens` (configurator steps) alongside the Theme Editor (`apps/cms/src/app/cms/shop/[shop]/themes/ThemeEditor.tsx`) drive `Shop.themeId` + `themeTokens`. | **Gap:** the Theme step currently only lets you pick a base preset; token overrides require the Theme Editor, which lives behind the `/themes` route. Non-technical users can leave tokens empty and still fail `checkTheme`. **Ideal state:** a clear “Theme ready” state where a base theme is chosen and at least the starter kit’s required tokens are set, with obvious links from summary to Theme Editor. **Likely fix locations:** `StepTheme`, Configurator summary, Theme Editor help links. | Planned (CMS-BUILD-04, CMS-BUILD-06, CMS-BUILD-07, CMS-BUILD-09, CMS-BUILD-11) |
| `checkPayments` | `StepPaymentProvider` configures connectors via `providersByType("payment")`. Payment provider IDs persist to `Shop.paymentProviders`, and currency is set earlier in the wizard or defaulted via Settings. | **Gap:** the Configurator step focuses on OAuth flows but does not surface missing environment variables (`pluginEnvVars` in `packages/platform-core/src/configurator.ts`) or currency defaults. **Ideal state:** a short “Vault readiness” summary that flags missing Stripe/PayPal env vars and prompts for currency if unset. **Likely fix locations:** `StepPaymentProvider`, Configurator summary, Settings snapshot. | Open (to be scoped into CMS-BUILD-02/03 follow-up tasks) |
| `checkShippingTax` | `StepShipping` collects tax region and shipping provider selections; Settings sections (`ShopProvidersSection`, `CurrencyTaxEditor.tsx`, `deposits/`, etc.) persist shipping providers and tax settings. | **Gap:** shipping providers can only be toggled in the Settings form, yet the Configurator step redirects back to `/cms/configurator`. There is no direct path from a failing check to the specific Settings subsection. **Ideal state:** a CTA or inline banner that moves builders directly to `/cms/shop/{shop}/settings#shipping`/`ShopProvidersSection`. **Likely fix locations:** `StepShipping`, Configurator summary, `SettingsHero`. | Planned (CMS-BUILD-02, CMS-BUILD-03, CMS-BUILD-11) |
| `checkCheckout` | `StepCheckoutPage` wires up the `checkout` page via Page Builder templates and `packages/templates/src/corePageTemplates.ts`. | **Gap:** checkout templates are created during setup but once the shop is live, the Pages UI (`apps/cms/src/app/cms/pages/edit/page.tsx`) is the only way to see/publish the page. Configurators often skip the “Publish checkout” action, resulting in `missing-checkout-page`. **Ideal state:** a “Fix checkout” CTA on the summary that opens the checkout page in edit mode with a clear publish indicator. **Likely fix locations:** `StepCheckoutPage`, Configurator summary, Pages list empty state. | Planned (CMS-BUILD-02, CMS-BUILD-04, CMS-BUILD-08, CMS-BUILD-11) |
| `checkProductsInventory` | Products list `apps/cms/src/app/cms/products/page.tsx` + inventory settings (StepInventory, Settings sections) back the Catalog check. | **Gap (historical):** originally there was no “Add your first product” flow; builders had to leave Configurator to access `/cms/products`, navigate the catalog UI, fill in multiple fields, and then return. This was the most common blocker for this check. **Current state:** `apps/cms/src/app/cms/shop/[shop]/products/first/page.tsx` implements a minimal first-product wizard using the canonical fields in `docs/cms/shop-build-docs-help-plan.md#minimal-first-product-fields-canonical-list`, and the Products zero state surfaces a clear CTA to this wizard plus telemetry (`build_flow_first_product_*`). **Ideal state:** continue refining CTAs from Configurator summary into the wizard and ensuring telemetry confirms the flow is actually reducing time-to-launch. | Partially addressed (CMS-BUILD-02, CMS-BUILD-05, CMS-BUILD-10, CMS-BUILD-11, CMS-BUILD-12, CMS-BUILD-13) |
| `checkNavigationHome` | `StepNavigation`, `StepHomePage`, `StepShopPage`, and Additional Pages (plus any post-launch Page Builder edits) feed `Shop.navigation` and home layouts. | **Gap:** navigation construction happens over many steps and the tree can easily end up empty or with blank URLs. The `ConfigurationOverview` snapshot highlights “Languages / Theme” but not navigation completeness. **Ideal state:** a visible “Navigation missing/incomplete” badge with a one-click path back to the Navigation step or relevant Page Builder sections (see Journey Map §2). **Likely fix locations:** Configurator summary, `ConfigurationOverview`, navigation-related sections under `apps/cms/src/app/cms/shop/[shop]/sections`. | Planned (CMS-BUILD-02, CMS-BUILD-03, CMS-BUILD-06, CMS-BUILD-08, CMS-BUILD-11) |

## 2. First-product friction (CMS-BUILD-10)

- **Surface (now):** `apps/cms/src/app/cms/shop/[shop]/products/page.tsx` shows the full catalog and, when there are no products, surfaces an inline “first product” prompt plus a CTA into the minimal wizard at `apps/cms/src/app/cms/shop/[shop]/products/first/page.tsx`. The wizard collects only the minimal fields and redirects to the full editor once the product is created.
- **Canonical fields:** the wizard and related docs use the **Minimal first-product fields** defined in `docs/cms/shop-build-docs-help-plan.md#minimal-first-product-fields-canonical-list`:
  - Title (primary locale).
  - Base price.
  - Inventory item (location + quantity).
  - Publish flag.
  - Optional image.
  The wizard calls the same write paths (`packages/platform-core/src/repositories/products.server.ts`) via `apps/cms/src/actions/products.server.ts` and `createMinimalFirstProduct`, which in turn writes a `ProductPublication`, updates inventory, and emits `build_flow_first_product_created`. A persistent “first-product prompt” flag could still be added in a later iteration; this analysis does not prescribe the field name so it remains code-aligned.

## 3. Quick wins and next actions

- **Add targeted CTAs from Configurator summary / status surfaces**
  - For each failing check, the summary view should expose a direct link to the relevant Settings/Theme/Pages/Products surface (for example, “Fix shipping” → `/cms/shop/{shop}/settings#shipping`, “Fix checkout” → checkout page editor).
  - Likely implementation components: Configurator summary view, `ConfiguratorStatusBar`.
- **Surface the Settings snapshot in build contexts**
  - Reuse the `SettingsHero` “Current snapshot” values (`languages`, `currency`, `taxRegion`, `theme`) on the Configurator dashboard so builders see their readiness at a glance.
  - Link those snapshots back to `docs/cms/shop-build-journey-map.md` so agents can cross-check routes/components.
- **Align telemetry with build-flow events**
  - When CMS-BUILD-05 adds build-flow telemetry, emit the `build_flow_step_*`, `build_flow_first_product_*`, `build_flow_help_requested`, and `build_flow_exit` events described in `docs/cms/shop-build-docs-help-plan.md` from:
    - `StepPaymentProvider`, `StepShipping`, `StepInventory`, `StepHomePage`, `StepCheckoutPage`.
    - Products page (zero state and wizard).
    - Settings snapshot and language/help links.
- **Move forward with CMS-BUILD-10**
  - Design and implement the first-product prompt based on the fields above, wiring it to `packages/platform-core/src/repositories/products.server.ts` and `productSchema` in `apps/cms/src/actions/schemas.ts` so validation remains shared.

This analysis feeds **CMS-BUILD-02** (gap → tasks), **CMS-BUILD-10** (first-product experience), and **CMS-BUILD-11** (docs + inline help + telemetry). The Journey Map (`docs/cms/shop-build-journey-map.md`) should be treated as the “what exists & how it connects”, this file as “what’s missing & why it hurts”, and `docs/cms/shop-build-docs-help-plan.md` as “how we’re fixing it”.
