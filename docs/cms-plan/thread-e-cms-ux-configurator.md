Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread E – CMS UX, configurator, and safety rails

This thread operationalises §5 of `docs/historical/cms-research.md`.

It focuses on:

- Configurator flow for creating/launching shops.
- Shared step model and server-side readiness checks.
- Launch gating and go-live pipeline.
- Page Builder ergonomics and safety rails.

---

## Context (from research)

- `/cms/configurator` is the opinionated entry point for creating and launching shops.
- Research proposes:
  - A shared `ConfiguratorStepId` and `ConfiguratorProgress` model in a common package.
  - Server-side `ConfigCheck` functions that determine step completion.
  - A `ConfiguratorProgress` API used by CMS UI and launch gating.
  - A quick-launch path that seeds defaults via existing actions.
  - A unified “shop health” indicator built from the same checks.
- Required vs optional steps map to concrete contracts:
  - Required: languages, theme/tokens, payments, shipping/tax, cart/checkout routes, at least one product/inventory, navigation/home.
  - Optional: domains, reverse logistics, advanced SEO, luxury features, etc.

---

## Decisions / direction (to keep aligned)

- Configurator is the canonical front door for creating/launching shops (CLI is dev-only).
- Step IDs and their semantics are defined once in shared types and reused everywhere.
- “Complete” for a step is determined by server-side `ConfigCheck`s, not just form submissions.
- Launch gating and shop health reuse the same checks.

---

## Tasks

- [x] **CONF-01 – Introduce shared configurator types**
  - Scope:
    - Add `ConfiguratorStepId`, `StepStatus`, and `ConfiguratorProgress` types to a shared package.
  - Implementation:
    - In `@acme/types` (or a focused config package), define:
      - `ConfiguratorStepId` union of known steps (shop basics, theme, payments, shipping-tax, checkout, products-inventory, navigation-home, domains, reverse-logistics, advanced-seo, etc.).
      - `StepStatus` and `ConfiguratorProgress` per the research.
    - Export from a stable subpath (e.g. `@acme/types/configurator`).
  - Definition of done:
    - Types exist and can be imported by CMS, `platform-core`, and `cms-marketing`.
  - Dependencies:
    - ARCH-01 (public surface guidance).

- [ ] **CONF-02 – Implement `ConfigCheck` abstraction in platform-core**
  - Scope:
    - Provide server-side `ConfigCheck` helpers to evaluate configurator steps.
  - Implementation:
    - In `@acme/platform-core` or `packages/cms-marketing`:
      - Define `ConfigCheck` and `ConfigCheckResult` types as per research.
      - Implement initial checks:
        - `checkShopBasics`, `checkTheme`, `checkPayments`, `checkShippingTax`, `checkCheckout`, `checkProductsInventory`, `checkNavigationHome`.
      - Each check reads from repositories and returns structured errors.
  - Definition of done:
    - A small number of checks are implemented and callable from CMS.
    - Each check has at least one focused test.
  - Dependencies:
    - ARCH-03 (Shop/Settings field ownership).
    - CART-03/CART-04 for checkout-related checks.

- [x] **CONF-03 – Add `/cms/api/configurator-progress`**
  - Scope:
    - Expose configurator progress as an API for CMS UI and automation.
  - Implementation:
    - In CMS:
      - Implemented an API route `/cms/api/configurator-progress` that:
        - Accepts an optional `shopId` query parameter on `GET`.
        - When `shopId` is provided, runs the shared `ConfigCheck`s from `@platform-core/configurator` and returns a typed `ConfiguratorProgress` payload from `@acme/types`.
        - Preserves existing behaviour (per-user persisted wizard state) when `shopId` is omitted so current clients and tests keep working.
      - Configurator dashboard now calls this API when a `shopId` is present and derives the header progress counts from the server-side step statuses, falling back to local state when checks are unavailable.
  - Definition of done:
    - Configurator dashboard progress now reflects server-side `ConfigCheck` results where available, with a local fallback.
    - API shape is stable and backed by shared types in `@acme/types`.
  - Dependencies:
    - CONF-01 and CONF-02.

- [ ] **CONF-04 – Implement launch gating and go-live pipeline**
  - Scope:
    - Wire launch button to server-side checks and deployment flow.
  - Implementation:
    - In CMS:
      - Implement a “Launch shop” action that:
        - Re-runs all required `ConfigCheck`s for the shop.
        - If failures exist, returns structured errors and does not deploy.
        - If all pass, triggers `createShop`/`deployShop` (or equivalent) for the current environment.
      - Ensure idempotency per `(shopId, environment)`.
    - Persist deployment metadata in the appropriate place (e.g. `deploy.json`, DB).
  - Definition of done:
    - A shop cannot be launched without all required steps passing checks.
    - Re-launch converges existing deployments rather than creating duplicates.
  - Dependencies:
    - ARCH-02/ARCH-03 (create/deploy semantics and metadata).
    - CONF-02/CONF-03 (checks and progress API).

- [x] **CONF-05 – Add quick-launch path**
  - Scope:
    - Provide a “quick launch” button that fills defaults and runs checks.
  - Implementation:
    - In CMS configurator:
      - Implement a quick-launch action on the dashboard that:
        - Applies safe defaults for required steps in the configurator state (payment and shipping providers, starter categories).
        - Marks required configurator steps as complete using the existing persistence helpers so progress and shop health stay in sync.
        - Triggers a refresh of server-side `ConfigCheck`s via the configurator-progress API and surfaces any remaining issues in the dashboard.
  - Definition of done:
    - A non-technical user can produce a sandbox shop via quick-launch within the target 30-minute window, assuming required external accounts exist.
  - Dependencies:
    - PB-04 (home/shop/checkout templates).
    - CART-04 (checkout configuration).

- [x] **CONF-06 – Expose shop health indicator using ConfigChecks**
  - Scope:
    - Reuse `ConfigCheck`s to surface shop health (healthy/degraded/broken).
  - Implementation:
    - In `packages/cms-marketing` or CMS app:
      - Implement a small health aggregation utility that:
        - Maps individual `ConfigCheck` results to a simple health status.
      - Surface this in:
        - Shop list or dashboard views.
        - Configurator overview panel.
  - Definition of done:
    - CMS shows a high-level health status per shop based on configuration checks.
  - Dependencies:
    - CONF-02 (checks) and CONF-03 (progress API).

- [x] **CONF-07 – Improve Page Builder ergonomics and guardrails**
  - Scope:
    - Address the ergonomics/safety items from the research (shortcuts, breakpoints, localisation, error handling).
  - Implementation:
    - In `@acme/ui` Page Builder:
      - Implement or document keyboard shortcuts for core actions.
      - Clarify breakpoint-specific vs global props (e.g. UI indicators, reset actions).
      - Improve locale-switching behaviour (clear primary/fallback indicators, copy-primary affordances).
      - Improve error handling when blocks are misconfigured (validation messages, safe fallbacks).
  - Definition of done:
    - Core ergonomics improvements are in place or documented as follow-up tickets with clear scope.
  - Dependencies:
    - PB-05 (metadata handling) for safe guardrails.

---

## Dependencies & validation

- Depends on:
  - ARCH-01/ARCH-03 for shared types and Shop/Settings semantics.
  - PB and CART threads for block templates and checkout readiness.
- Validation:
  - Configurator reflects server-side checks accurately.
  - Launch gating prevents misconfigured shops from going live.
  - Quick-launch path can be exercised end-to-end in a dev environment.
  - Page Builder ergonomics improvements are visible in CMS.
