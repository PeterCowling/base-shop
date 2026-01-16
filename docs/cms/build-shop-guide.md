Type: Guide
Status: Active
Domain: CMS
Last-reviewed: 2026-01-16

Related charters and contracts:
- docs/cms/cms-charter.md
- docs/cms/configurator-contract.md
- docs/runtime/runtime-charter.md

Primary code entrypoints:
- apps/cms/src/app/cms/configurator
- apps/cms/src/app/cms/shop/[shop]
- packages/platform-core/src/configurator.ts

# Build & Style a Shop — CMS Guide (Agent Runbook)

This guide explains how to go from “no shop” to a launch‑ready shop using only the CMS. It is written for agents that need to reason about the build process.

It assumes:

- The CMS is running and sign-in works.
- Required external accounts (for example Stripe) already exist and env vars are configured.
- You want a shop that passes all launch checks defined in `@acme/platform-core/configurator`.

For architecture and invariants, see `docs/cms/cms-charter.md` and `docs/cms/configurator-contract.md`.

---

## Quick reference

- For a code-linked map of the build journey (Configurator → Settings → Pages → Products), see `docs/cms/shop-build-journey-map.md`.
- For gaps and planned improvements to the build experience, see `docs/cms/shop-build-gap-analysis.md` and `docs/cms/shop-build-plan.md`.
- For the fastest path from “no shop” to “launch‑ready”, follow the **Launch in under an hour** track below, then use the later sections of this guide for more control.

## Launch in under an hour

This track focuses only on what is required to launch a real shop. Additional theme tuning, extra pages, or catalog expansion can be done later.

| Step | Where in CMS | Why it matters | Approx. time | Required before launch? |
| --- | --- | --- | --- | --- |
| 1. Shop basics | `/cms/configurator` → Shop Details / Shop Type | Creates the shop shell and sets identity and contact info. | 5–10 min | **Required** |
| 2. Pick a look | `/cms/configurator` → Theme / Tokens | Chooses a base theme and key typography so pages are readable and on‑brand enough to start. | 5–10 min | **Required** (fine‑tune later) |
| 3. Get paid & ship | `/cms/configurator` → Payment Provider / Shipping; `/cms/shop/{shop}/settings` for currency, tax region, shipping providers | Connects payments, sets currency and tax region, and enables at least one shipping provider so real orders can be placed. | 15–20 min | **Required** |
| 4. Add first product | `/cms/products` (or the first‑product wizard when available) | Creates at least one product with price and stock so customers can buy something. | 10–15 min | **Required** |
| 5. Make pages reachable | `/cms/configurator` → Navigation / Home / Checkout (and `/cms/pages` if checkout must be published) | Ensures the home page, product pages, and checkout route are present and reachable from navigation. | 5–10 min | **Required** |
| 6. Run the launch checklist | `/cms/configurator` → Summary / dashboard | Confirms all required checks are green (“Shop basics”, “Look & feel”, “Get paid”, “Shipping & tax”, “Checkout page”, “Products in stock”, “Home & navigation”). | 5–10 min | **Required** |

You can safely postpone:

- Deep Theme Editor work (token fine‑tuning beyond the basic presets).
- Additional pages beyond the essentials (About, FAQ, etc.).
- Large media library uploads.

Those are **nice to improve later** and are not required to get a working shop live.

## 1. Concepts — Build vs Launch vs Update

- **Build**
  - Everything needed to make a shop *ready* to go live:
    - Creating the shop shell.
    - Styling it (theme, tokens, navigation).
    - Adding mandatory content (products, inventory, checkout, home).
  - Build writes into `Shop` + `ShopSettings` + pages, and is validated via ConfigChecks.

- **Launch**
  - A single action that:
    - Re-runs all required `ConfigCheck`s for the shop.
    - If any required checks fail, blocks launch and returns structured errors.
    - If all pass, orchestrates create/init/seed/deploy for the chosen environment via `/api/launch-shop`.

- **Update**
  - Any change after launch:
    - Editing pages or theme via CMS.
    - Adjusting settings, payments, or logistics.
  - Uses the same repositories and ConfigChecks; shop health indicators re-use the same readiness logic.

The key invariant: **Build, Launch, and Update all operate on the same data model and checks.** There is no separate “launch system”.

---

## 2. Step 1 — Create the shop shell

**Goal:** create a new `Shop` and `ShopSettings` record and register the shop in the platform.

- Navigate to `/cms/configurator`:
  - From the CMS navigation, choose **Create Shop** (or **Configurator**).

- In the first step (“Shop Details” / “Shop basics”):
  - Choose a unique `shopId`.
  - Set the display name and basic identity fields (logo, contact email, shop type).
  - Pick a base template if prompted.

- What this does in code:
  - Seeds a `Shop` row and a `ShopSettings` row in `@acme/platform-core` via CMS actions.
  - Records wizard state under `data/cms/configurator-progress.json` so the flow can resume later.

At this point, `checkShopBasics` in `packages/platform-core/src/configurator.ts` will start to pass once required fields (shop, id, languages) are in place.

---

## 3. Step 2 — Style and brand the shop

**Goal:** choose a base theme, set key tokens, and establish navigation and home layout so the shop has a coherent branded surface.

### 3.1 Choose theme and tokens

- From `/cms/configurator`, complete the **Theme** and **Tokens** steps:
  - Pick a base theme.
  - Adjust design tokens (colors, typography, spacing) using the Theme Editor.
  - Save presets if needed.

- Under the hood:
  - Writes `themeId`, `themeDefaults`, `themeOverrides`, and `themeTokens` into `Shop`.
  - See:
    - `docs/theming.md`, `docs/theme-lifecycle-and-library.md`, `docs/theme-editor-tokens.md`.
    - Theme Editor implementations under `apps/cms/src/app/cms/shop/[shop]/themes/`.

- Readiness:
  - `checkTheme(shopId)` requires:
    - `Shop.themeId` to be set.
    - `Shop.themeTokens` to be non-empty.

### 3.2 Configure navigation and home

- In the configurator:
  - Use the **Navigation**, **Home Page**, and related steps to:
    - Build the primary header navigation tree (links to home, shop, PDP, etc.).
    - Choose a home layout template and blocks via Page Builder.
    - Select a **Home** and **PDP** template from the core library (`/cms/api/page-templates?group=home|product`). These steps now require choosing a non-blank template and saving a draft before they can be marked complete, and Page Builder surfaces **Create from template** / **Replace with template** with a preview + diff before applying.

- Under the hood:
  - Writes navigation configuration into `Shop` or `ShopSettings` (depending on field).
  - Creates or updates the home page using Page Builder and page repositories.
  - See:
    - `docs/pagebuilder-library.md`, `docs/page-builder-metadata.md`.

- Readiness:
  - `checkNavigationHome(shopId)` requires:
    - Navigational config present.
    - At least one home page/layout configured in pages for the shop.

---

## 4. Step 3 — Add mandatory content and configuration

**Goal:** make sure the shop can accept payments, ship orders, and serve real product content. These are the **required** ConfigCheck areas.

### 4.1 Languages and SEO basics

- Ensure:
  - `ShopSettings.languages` lists at least one language (primary first).
  - Basic SEO fields are set in Settings and/or pages (titles, descriptions, favicon).

- Readiness:
  - `checkShopBasics` verifies languages and primary locale.
  - Additional SEO quality is covered by optional checks and guides (`docs/seo.md`).

### 4.2 Payments

- In the CMS Settings / Configurator:
  - Set the shop currency.
  - Configure payment and billing providers (e.g. Stripe).

- In infrastructure:
  - Ensure provider env vars are set (for example via `packages/config/env` and deployment configuration).

- Readiness:
  - `checkPayments(shopId)` ensures:
    - `ShopSettings.currency` is set.
    - At least one payment/billing provider is configured on the shop.
    - Required provider env vars are present (via `pluginEnvVars`).

### 4.3 Shipping and tax

- In the CMS:
  - Set `taxRegion` and any other tax settings in `ShopSettings`.
  - Configure at least one shipping provider or shipping option.

- Readiness:
  - `checkShippingTax(shopId)` ensures:
    - `ShopSettings.taxRegion` is set.
    - `shop.shippingProviders` is non-empty.

### 4.4 Products and inventory

- In the CMS (Products + Inventory screens):
  - Create at least one product, with pricing and attributes.
  - Ensure inventory is present for at least one SKU (and not zero).

- Readiness:
  - `checkProductsInventory(shopId)` ensures:
    - There is at least one published product for the shop.
    - There is at least one inventory item associated with the shop.

### 4.5 Checkout page

- In Page Builder or Settings:
  - Ensure the checkout page exists and is published (using the template’s checkout block/route).

- Readiness:
  - `checkCheckout(shopId)` ensures:
    - A checkout page for the shop exists in the pages repository.

When `checkShopBasics`, `checkTheme`, `checkPayments`, `checkShippingTax`, `checkProductsInventory`, `checkCheckout`, and `checkNavigationHome` all pass, the shop is considered **ready** from a configuration perspective.

---

## 5. Step 4 — Review readiness and shop health

**Goal:** confirm that both the configurator UI and server-side checks agree the shop is launch‑ready.

- From `/cms/configurator`:
  - Ensure all required steps in the dashboard are marked complete.
  - The progress widget should show all required steps complete.
  - The shop health indicator (where present) should show a “healthy” status derived from `ConfiguratorProgress`.

- Under the hood:
  - `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts`:
    - Calls `GET /api/configurator-progress?shopId=...`.
    - Uses `REQUIRED_CONFIG_CHECK_STEPS` and `OPTIONAL_CONFIG_CHECK_STEPS` from `@platform-core/configurator` to compute counts.
    - Derives a health status from `steps` and `errors`.

- Pragmatically:
  - If the dashboard shows all required steps complete and health is green, server-side `ConfigCheck`s should be passing as per `docs/cms/configurator-contract.md`.

---

When all required checks are green, the Summary view effectively becomes a **launch checklist**:

- Each required area should appear under a plain, builder‑friendly label (see “Required checks in plain language” below), not an internal check name.
- The UI can safely say “Your shop is launch‑ready” and, where configured, surface a “Launch” or “View shop” action.

---

## 6. Step 5 — Launch the shop

**Goal:** run the final checks and deploy the shop.

- In the configurator dashboard:
  - Use the **Launch** button in the Launch panel.
  - If required steps are missing, the UI will:
    - Prevent launch.
    - Highlight missing steps and show a tooltip listing them.
  - Stage-first rule for first prod launch:
    - Deploy to Stage and run smoke tests (or mark smoke as disabled) at least once.
    - Review the staging site and tick the QA acknowledgement checkbox tied to that Stage deploy.
    - The Prod toggle remains disabled until both are satisfied.

- Under the hood:
  - `useLaunchShop`:
    - Verifies all required steps are marked `"complete"` in the wizard state (`allRequiredDone`).
    - Calls `POST /api/launch-shop` with:
      - `shopId`, `state`, `seed` flag, and `env`.
    - Consumes SSE events to update per-step launch status (`create`, `init`, `deploy`, `seed?`).
  - `/api/launch-shop`:
    - Authenticates the request.
    - Calls `runRequiredConfigChecks(shopId)` and `getLaunchStatus(env, shopId)` from `@platform-core/configurator`.
    - If configuration is invalid:
      - Does **not** deploy and returns an error; UI surfaces a failure state.
    - If configuration is valid:
      - Runs create/init/seed/deploy steps and streams status events.

- After a successful launch:
  - The shop runtime for the chosen environment should be live and queryable via `/cms/live` or equivalent tooling.

---

## 7. Required checks in plain language

Internally, platform code talks about `ConfigCheck`s such as `checkProductsInventory`. Builders should see simple labels and explanations instead.

These are the recommended mappings (see `docs/cms/configurator-contract.md` for the underlying types):

| ConfigCheck / stepId | Builder‑facing label | What it means |
| --- | --- | --- |
| `checkShopBasics` / `shop-basics` | **Shop basics** | “Name, language, and basic identity are set so the shop can be addressed and localised.” |
| `checkTheme` / `theme` | **Look & feel** | “A base theme and essential design tokens are configured so pages are readable and on‑brand enough to launch.” |
| `checkPayments` / `payments` | **Get paid** | “Currency is set and at least one payment/billing provider is connected so customers can pay.” |
| `checkShippingTax` / `shipping-tax` | **Shipping & tax** | “A tax region and at least one shipping provider are configured so orders can be shipped compliantly.” |
| `checkCheckout` / `checkout` | **Checkout page** | “A working checkout page exists and is reachable so customers can complete their orders.” |
| `checkProductsInventory` / `products-inventory` | **Products in stock** | “There is at least one active product with stock available so customers can buy something.” |
| `checkNavigationHome` / `navigation-home` | **Home & navigation** | “The home page and navigation menu are set so visitors can find key pages.” |

In the CMS UI and inline help, prefer these labels over the raw `ConfigCheck` IDs; the IDs remain the source of truth in code and in `docs/cms/configurator-contract.md`.

---

## 8. Step 6 — Update after launch

**Goal:** safely change a live shop while keeping configuration and health consistent.

- Use the same CMS surfaces:
  - Shop Settings (`/cms/shop/{shop}/settings`) for identity, providers, logistics.
  - Theme (`/cms/shop/{shop}/theme`) and Theme Editor for styling changes.
  - Pages (Page Builder) for content and layout updates.

- Under the hood:
  - Updates the same `Shop`, `ShopSettings`, and pages repositories used during Build.
  - `ConfigCheck`s continue to run via:
    - `getConfiguratorProgressForShop`.
    - Shop health indicators in CMS (per `CONF-06`).

- Operationally:
  - If a change breaks configuration (for example removing all shipping providers), the relevant `ConfigCheck` will begin to fail, and:
    - The dashboard/health indicator will show degraded or broken status.
    - A subsequent re-launch or deploy will be gated until configuration is fixed.

---

## 9. Quick‑launch path

**Goal:** create a sandbox shop as quickly as possible for demos or testing.

- In the configurator dashboard:
  - Use the **Quick Launch** action in the hero panel.

- Under the hood:
  - Applies safe defaults for required steps (for example default payment/shipping providers, starter categories, basic theme).
  - Marks required configurator steps as `"complete"` in the wizard state where reasonable.
  - Triggers a refresh of server-side `ConfigCheck`s via `/api/configurator-progress`.
  - Surfaces any remaining issues in the dashboard and health indicator.

Quick‑launch is intended for sandbox/demos; production shops should still be checked against the full readiness and launch gating flow described above.
