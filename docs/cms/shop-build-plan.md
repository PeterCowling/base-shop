Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Shop Build Plan — Pre-Launch Configuration & UX

This plan covers the **build** and **configuration** workflows that precede launching a shop, focusing on the CMS experience (Configurator, Settings, Theme, Pages, Products).

It assumes launch/update/upgrade flows and ConfigChecks are already robust, and uses `docs/cms/build-shop-guide.md` and `docs/cms/configurator-contract.md` as behavioural references.

The primary UX aspiration is that a non‑technical shop owner can go from “no shop” to a launch‑ready shop in around **one hour**, by following the fast path documented in:

- `docs/cms/build-shop-guide.md` (see **Launch in under an hour** and **Required checks in plain language**).
- `docs/cms/shop-build-journey-map.md` (see **One-hour launch path (minimum viable)**).
- `docs/cms/shop-build-docs-help-plan.md` (docs/help/telemetry spec for CMS-BUILD-11).

## Active tasks

- **CMS-BUILD-01 — Map the full build journey (happy path) [COMPLETED]**
  - Status: ☑
  - Scope:
    - Produce a concise, repo-backed map of the end‑to‑end “build a shop” journey:
      - Entry points: `/cms/configurator`, Shop selector, Settings, Theme, Pages, Products.
      - Surfaces and steps that contribute to ConfigChecks (`checkShopBasics`, `checkTheme`, `checkPayments`, `checkShippingTax`, `checkProductsInventory`, `checkCheckout`, `checkNavigationHome`).
      - Places where users must leave the Configurator (e.g. detailed product/SEO setup).
    - Run at least one review session with a second agent or UX‑focused team member (not the author) to validate that the map reflects actual flows rather than assumptions.
  - Dependencies:
    - `docs/cms/build-shop-guide.md` and `docs/cms/configurator-contract.md`.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/**`
    - `apps/cms/src/app/cms/shop/[shop]/settings/**`
    - `apps/cms/src/app/cms/pages/**`, `apps/cms/src/app/cms/products/**`
  - Definition of done:
    - A short, linked journey map (doc or section) exists that an agent can use to see exactly which CMS routes and components participate in the pre‑launch build flow, and it has been reviewed and explicitly signed off by at least one other team member (human or agent) who did not author the map.

- **CMS-BUILD-02 — Identify missing or weak build surfaces for required checks [COMPLETED]**
  - Status: ☑
  - Scope:
    - For each required `ConfigCheck`:
      - `shop-basics`, `theme`, `payments`, `shipping-tax`, `checkout`, `products-inventory`, `navigation-home`
    - Verify there is a clear, non‑expert‑friendly CMS surface to satisfy it:
      - Obvious entry point from Configurator or Settings.
      - Minimal required fields with sensible defaults.
    - Capture gaps (for example: complicated paths to set tax region, fragmented navigation configuration, missing prompts for first product).
  - Dependencies:
    - CMS-BUILD-01 (journey map).
    - ConfigChecks in `packages/platform-core/src/configurator.ts`.
  - Code/docs:
    - `packages/platform-core/src/configurator.ts`
    - `apps/cms/src/app/cms/configurator/steps/**`
    - `apps/cms/src/app/cms/shop/[shop]/settings/**`
  - Definition of done:
    - For each required check, a corresponding CMS surface is identified; any missing or weak surfaces are documented as follow‑up tasks (e.g. CMS-BUILD‑0x) with concrete UI/code targets.

- **CMS-BUILD-03 — Tighten Configurator vs Settings vs Shop screens**
  - Status: ☑
  - Scope:
    - Review how `/cms/configurator` and `/cms/shop/{shop}/settings` interact:
      - Where does the user land post‑launch?
      - How do they discover “next steps” (SEO, returns, advanced settings) after initial build?
    - Propose and document a minimal set of navigation/links or summary panels that:
      - Keep build vs ongoing Settings coherent.
      - Make it easy to jump from Configurator to Settings/Pages/Products without getting lost.
  - Dependencies:
    - CMS-BUILD-01, CMS-BUILD-02.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/Dashboard.tsx`
    - `apps/cms/src/app/cms/shop/[shop]/settings/page.tsx`
    - `docs/cms.md`, `docs/shop-editor-refactor.md`
  - Definition of done:
    - A concrete list of small navigation/UX changes exists (e.g. buttons, banners, contextual links) that agents can implement to unify build and settings flows.

- **CMS-BUILD-04 — Improve build-time content defaults and templates**
  - Status: ☑
  - Scope:
    - Assess how much work a new user must do to get:
      - A usable home page (PB templates).
      - Basic legal/trust pages (terms, privacy, returns, shipping).
      - Minimal SEO metadata.
    - Identify opportunities to:
      - Use existing templates (`@acme/templates`, PB library) as quick‑start options.
      - Seed legal/trust pages with configurable defaults from the CMS.
    - Verify i18n capability for all proposed legal/trust page defaults and quick‑start content so global shops can localise required copy without forking templates.
  - Dependencies:
    - CMS-BUILD-01, CMS-BUILD-02.
    - `docs/i18n/i18n-charter.md`, `docs/i18n/i18n-plan.md`.
  - Code/docs:
    - `docs/pagebuilder-library.md`, `docs/page-builder-metadata.md`
    - `packages/templates/**`, `packages/page-builder-core/**`, `packages/page-builder-ui/**`
    - `apps/cms/src/app/cms/pages/**`
  - Definition of done:
    - A short list of specific template/default additions is defined (e.g. “Add Legal starter pack to Additional Pages step”), each with code/file references suitable for implementation tasks.

- **CMS-BUILD-05 — Capture friction and observability for build flows**
  - Status: ☑
  - Scope:
    - Define minimal telemetry to understand where users stall in the build process:
      - Which Configurator steps see the most exits or repeated edits?
      - Where do users abandon before satisfying required checks?
    - Align with `docs/cms-plan/thread-e-observability.md` so build‑specific metrics feed into shop health/UX improvements.
  - Dependencies:
    - CMS-BUILD-01 (journey map).
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/**`
    - `docs/cms-plan/thread-e-observability.md`
  - Definition of done:
    - A minimal set of build‑flow events and suggested metrics is defined, and planned for implementation in CMS telemetry.

- **CMS-BUILD-06 — Map component and block usage across build flows**
  - Status: ☑
  - Scope:
    - Cross‑reference UI components (atoms, molecules, organisms, templates), Page Builder blocks, and core page templates with the shop build journey:
      - Identify which components/blocks power each major surface (Configurator steps, Theme, Pages, Products, Settings).
      - Produce a matrix of `component/block → surfaces and routes` that participate in pre‑launch build and initial post‑launch editing.
    - Highlight any critical sections that are only reachable via advanced flows or undocumented entry points.
  - Dependencies:
    - CMS-BUILD-01 (journey map).
    - `docs/pagebuilder-library.md`, `docs/page-builder-metadata.md`, `docs/storybook.md`.
  - Code/docs:
    - `packages/ui/src/components/atoms/**`, `packages/ui/src/components/molecules/**`, `packages/ui/src/components/organisms/**`, `packages/ui/src/components/templates/**`
    - `packages/templates/src/corePageTemplates.ts`
    - `packages/page-builder-core/**`, `packages/page-builder-ui/**`
    - `apps/storybook/**`
  - Definition of done:
    - A concise, linkable matrix exists that an agent can use to see which concrete components/blocks underpin each part of the build journey, with clear pointers into both CMS UI and runtime/templates.

- **CMS-BUILD-07 — Define opinionated starter kits for new shops**
  - Status: ☑
  - Scope:
    - Using the component/template map from CMS-BUILD-06, define one or more “starter kits” that specify:
      - Which core templates apply to home, shop, product, and checkout routes.
      - Which organisms/sections (hero, value props, trust, grid, PDP, checkout shell) are required vs optional for a credible first launch.
    - Capture how these kits differ by shop type (for example, catalogue‑focused vs editorial) if applicable.
  - Dependencies:
    - CMS-BUILD-01, CMS-BUILD-02, CMS-BUILD-06.
    - `docs/cms/build-shop-guide.md`, `docs/cms/cms-charter.md`.
  - Code/docs:
    - `packages/templates/src/corePageTemplates.ts`
    - `packages/ui/src/components/organisms/**`, `packages/ui/src/components/templates/**`
    - `docs/pagebuilder-library.md`
  - Definition of done:
    - A short, canonical description of starter kits exists (within this plan or a linked doc) that lists routes, required sections, and backing templates/components, suitable for turning into concrete implementation tasks.

- **CMS-BUILD-08 — Wire starter kits and presets into CMS UI**
  - Status: ☑
  - Scope:
    - Design and document concrete UX that exposes the starter kits and curated presets to non‑technical users during shop build:
      - Configurator steps for Layout/Home/Shop/Checkout/Additional Pages.
      - `/cms/pages` flows for creating or re‑seeding key pages.
    - Ensure there are obvious entry points from Configurator and Pages to apply a starter kit or preset rather than composing from scratch.
  - Dependencies:
    - CMS-BUILD-04, CMS-BUILD-06, CMS-BUILD-07.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/steps/**`
    - `apps/cms/src/app/cms/pages/**`
    - `docs/cms.md`, `docs/pagebuilder-library.md`
  - Definition of done:
    - A concrete list of UI changes (buttons, presets, starter‑kit selectors) is defined with target routes/components and props, ready to be broken into implementation tasks.

- **CMS-BUILD-09 — Bridge design system docs into the build flow**
  - Status: ☑
  - Scope:
    - Make it easy for builders and agents to understand “what this section is made of” when editing a shop:
      - Identify key CMS surfaces (Theme Editor, Page Builder, Product/SEO forms) where inline help or doc links would be valuable.
      - Propose a minimal pattern for surfacing links from CMS UI to design‑system and theming docs (e.g. “View section in Storybook”, “Read theming guide”).
  - Dependencies:
    - CMS-BUILD-06, CMS-BUILD-08.
    - `docs/theming.md`, `docs/theming-advanced.md`, `docs/design-system-package-import.md`.
  - Code/docs:
    - `apps/cms/src/app/cms/shop/[shop]/themes/**`
    - `apps/cms/src/app/cms/pages/edit/**`, `apps/cms/src/app/cms/pages/new/**`
    - `docs/storybook.md`, `docs/theme-lifecycle-and-library.md`
  - Definition of done:
    - A documented set of inline help/link patterns exists, with explicit CMS components/routes to update and pointers to the relevant design‑system/theming docs, enabling future implementation tasks.

- **CMS-BUILD-10 — Simplify first product creation workflow**
  - Status: ☑
  - Scope:
    - Focus on the first‑time product/inventory experience needed for `checkProductsInventory` to pass:
      - Analyse current “Add product” and inventory flows for new shops, including empty‑state UX.
      - Design a minimal “Add your first product” wizard or modal that collects only the fields required for readiness (name, price, basic media, inventory) and links clearly to the full product editor for later refinement.
      - Ensure this flow is discoverable from both the Configurator (when products are missing) and the Products section for a newly created shop.
  - Dependencies:
    - CMS-BUILD-02 (confirmed requirements for `checkProductsInventory`).
    - `docs/commerce-charter.md`, `docs/commerce-plan.md`, `docs/stock-checks.md`.
  - Code/docs:
    - `apps/cms/src/app/cms/products/**`
    - `apps/cms/src/app/cms/configurator/steps/**`
    - `packages/platform-core/src/repositories/products.server.ts`
  - Definition of done:
    - A concrete first‑product UX is specified (flows, entry points, and required fields) with referenced components/routes, and broken out into implementation tasks that will make `checkProductsInventory` easy to satisfy for non‑experts.

- **CMS-BUILD-11 — Align build/config guides with updated flows**
  - Status: ☑
  - Scope:
    - Update core CMS behavioural references so they accurately describe the improved build and configuration experience:
      - Reflect journey, surfaces, and starter‑kit behaviour from CMS-BUILD-01 through CMS-BUILD-09 in `docs/cms/build-shop-guide.md`.
      - Update `docs/cms/configurator-contract.md` to cover any new Configurator‑adjacent UX (links into Settings/Pages/Products, starter‑kit selection, first‑product prompts).
    - Ensure examples and terminology align with the CMS charter and current implementation.
  - Dependencies:
    - CMS-BUILD-01, CMS-BUILD-03, CMS-BUILD-04, CMS-BUILD-07, CMS-BUILD-08, CMS-BUILD-10.
    - `docs/AGENTS.docs.md`, `docs/docs-plan.md`.
  - Code/docs:
    - `docs/cms/build-shop-guide.md`
    - `docs/cms/configurator-contract.md`
  - Definition of done:
    - Both `docs/cms/build-shop-guide.md` and `docs/cms/configurator-contract.md` are updated to match the current build experience and contracts, pass `pnpm docs:lint`, explicitly reference any new flows introduced by this plan, and describe the “Launch in under an hour” path and builder-facing checklist/labels in a way that is consistent with the underlying code.

- **CMS-BUILD-12 — Surface a visible launch checklist and celebration state**
  - Status: ☑
  - Scope:
    - Treat the Configurator Summary/dashboard as the primary “launch cockpit” for builders:
      - Render a visible launch checklist that lists each required `ConfigCheck` using the builder labels from `docs/cms/configurator-contract.md`.
      - Show simple statuses (“Done” / “Needs attention”) and a single “Fix it” CTA per failing row that deep-links to the relevant surface (Configurator step or Settings/Pages/Products).
      - Present a clear, positive “Your shop is launch‑ready” state when all required checks pass, including a celebratory message and (where configured) a “Launch” or “View shop” action.
  - Dependencies:
    - CMS-BUILD-01, CMS-BUILD-02, CMS-BUILD-03.
    - `docs/cms/configurator-contract.md` (builder labels and telemetry conventions).
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/steps/StepSummary.tsx`
    - `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts`
    - `apps/cms/src/app/cms/configurator/components/LaunchPanel.tsx`
  - Definition of done:
    - A launch checklist UI exists in the Summary/dashboard that uses the builder labels, links to the right surfaces, and exposes a clear “launch‑ready” state distinct from the underlying SSE launch flow.

- **CMS-BUILD-13 — Instrument and track the one-hour launch funnel**
  - Status: ☑
  - Scope:
    - Emit and analyse build-flow telemetry to measure how close the experience is to the one-hour launch aspiration:
      - Ensure Configurator steps and related surfaces emit `build_flow_step_*`, `build_flow_first_product_*`, `build_flow_help_requested`, `build_flow_exit`, and `build_flow_launch_ready` events following `docs/cms/shop-build-docs-help-plan.md` and `docs/cms/configurator-contract.md`.
      - Define basic metrics (in observability docs or dashboards) for:
        - Time from first `build_flow_step_view` for a shop to its first `build_flow_launch_ready`.
        - Percentage of shops that reach `build_flow_launch_ready` within 60 minutes.
  - Dependencies:
    - CMS-BUILD-05 (telemetry scope), CMS-BUILD-10 (first-product flow), CMS-BUILD-11 (docs/help spec).
    - `docs/cms-plan/thread-e-observability.md`.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/**` (step components, status bar, summary/dashboard)
    - `apps/cms/src/app/cms/products/page.tsx`
    - `apps/cms/src/app/cms/telemetry/**`
  - Definition of done:
    - The agreed telemetry events are in place for build flows, and the observability docs describe how to calculate and monitor the one-hour launch funnel using those events.

- **CMS-BUILD-14 — Restore full theming coverage in Configurator**
  - Status: ☑
  - Scope:
    - Reinstate base theme selection and color token overrides in the Configurator flow.
    - Ensure `StepTheme` and `StepTokens` cover theme ID + color tokens + typography, and wire to `checkTheme`.
    - Add explicit links from Configurator summary to Theme Editor when advanced overrides are required.
  - Dependencies:
    - CMS-BUILD-02, CMS-BUILD-09.
  - Code/docs:
    - `apps/cms/src/app/cms/configurator/steps/StepTheme.tsx`
    - `apps/cms/src/app/cms/configurator/steps/StepTokens.tsx`
    - `apps/cms/src/app/cms/configurator/steps/StepSummary.tsx`
    - `docs/cms/shop-build-gap-analysis.md`
  - Definition of done:
    - Configurator exposes end-to-end theme readiness (theme selection + tokens) and `checkTheme` passes without requiring a hidden `/themes` detour.

## Completed / historical

- None yet.
