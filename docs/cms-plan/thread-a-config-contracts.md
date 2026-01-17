Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread A — Configurator & CMS as Source of Truth (Fast Launch)

This thread implements **Thread A** from `master-thread.fast-launch.md` for the “Fast Shop Launch & Stability” plan.

It describes:

- How existing configuration contracts (`Shop`, `ShopSettings`, providers) and launch‑readiness checks are structured in the codebase.
- How the Configurator wizard in `apps/cms` collects shop configuration and feeds the creation/launch pipeline.
- Where additional work is still useful (for example, richer launch metadata), and where the current implementation is already the intended source of truth.

This thread aligns with the cross‑cutting rules in `master-thread.fast-launch.md`, in particular:

- **CC‑1 Prisma vs `data/shops/*`** — In shared environments, Prisma is canonical for business state; `data/shops/<id>/*` holds derived/operational metadata accessed via platform‑core repositories.
- **CC‑2 Envs & secrets** — Long‑term, Configurator should validate env‑level configuration and write shop‑level flags only; secrets themselves are managed via env/config, not per‑shop JSON.

---

## A1 — Configuration contracts & launch requirements

**Goal**

Describe the schemas for shop‑level configuration and make it clear which fields are required for a shop to be “launch‑ready”, reusing the existing `@acme/types` and `@acme/config` contracts.

### A1‑1 Shop & Settings contracts

**Current state**

- `Shop` and `ShopSettings` are defined as Zod schemas in `@acme/types`:
  - `packages/types/src/Shop.ts`
  - `packages/types/src/ShopSettings.ts`
- These schemas already include the fields required by runtime apps and CMS and are used by:
  - Platform‑core repositories for shops/settings.
  - CMS shop/settings flows via dedicated form schemas that are kept in sync logically rather than sharing a single inferred type.
- Commercial mode is represented today via `Shop["type"]` (for example `"sale"` / `"rental"`); any finer‑grained billing modes would need additional design rather than a drop‑in `BillingMode` discriminator.
- The source‑of‑truth rule is enforced at the repository level:
  - In DB mode, Prisma `Shop` / `ShopSettings` rows are canonical for business fields.
  - `data/shops/<id>/shop.json` holds operational metadata (status, lastUpgrade, componentVersions, deploy history, etc.).

**Remaining work (optional refinements)**

- If we need more granular “commercial mode” behavior than `type: "sale" | "rental"`, introduce an explicit discriminator (for example `billingMode`) in `@acme/types/Shop` and thread it through launch checks.
- Keep CMS form schemas aligned with `@acme/types` by:
  - Treating `shopSchema` in `apps/cms/src/actions/schemas.ts` as a view over the canonical `Shop` shape.
  - Avoiding fields that exist only in CMS and not in `Shop`/`ShopSettings` unless they are genuinely CMS‑local concerns.

**Acceptance criteria**

- `Shop` and `ShopSettings` continue to be defined as Zod schemas in `@acme/types` and remain the canonical description of shop business state.
- Platform‑core repositories and CMS flows treat these schemas as the reference shape when adding new fields or behaviors.

---

### A1‑2 Provider/env schemas

**Current state**

- Provider env contracts live in `@acme/config/env/*`:
  - Payments (Stripe etc.) — `@acme/config/env/payments`.
  - Shipping/tax — `@acme/config/env/shipping`.
  - Email/marketing — `@acme/config/env/email`.
- Each module exposes a Zod schema and `load*Env` helper that:
  - Captures env variables used by template/tenant apps.
  - Enforces required vs optional values and reports invalid combinations via structured errors.
- Configurator‑side checks currently use:
  - `@acme/platform-core/configurator.validateShopEnv` to validate `.env` files for a given shop.
  - `pluginEnvVars` in the same module to assert required variables for Stripe, PayPal, and Sanity based on selected providers.

**Remaining work (optional refinements)**

- If desired, add small adapter helpers that surface env validation results to the CMS in a more structured, per‑environment shape, building on the existing `load*Env` functions.

**Acceptance criteria**

- `@acme/config/env/*` remains the single source of truth for provider env schemas.
- Configurator/env validation code continues to reuse those schemas (directly or via thin adapters) rather than duplicating variable lists.

---

### A1‑3 Launch‑critical vs optional (per environment)

**Current state**

- Launch/readiness checks are implemented via `configuratorChecks` in `@acme/platform-core/configurator` and keyed by `ConfiguratorStepId`:
  - `checkShopBasics`, `checkTheme`, `checkPayments`, `checkShippingTax`, `checkCheckout`, `checkProductsInventory`, `checkNavigationHome`, etc.
- These checks are used to:
  - Populate `ConfiguratorProgress` for a shop via:
    - `getConfiguratorProgressForShop` in `@acme/platform-core/configurator`, and
    - `GET /api/configurator-progress?shopId=…` in `apps/cms`, which delegates to that helper.
  - Gate Launch in `POST /api/launch-shop` by calling the shared `runRequiredConfigChecks` helper in `@acme/platform-core/configurator` before `deployShop`.
- The checks operate per shop and current process env; they do not currently bake in explicit `Env = 'dev' | 'stage' | 'prod'` distinctions.

**Remaining work (optional refinements)**

- A thin per‑environment launchability API exists:
  - `LaunchEnv`, `LaunchStatus`, and `LaunchCheckResult` types live in `@acme/types/configurator`.
  - `getLaunchStatus(env, shopId)` in `@acme/platform-core/configurator` combines:
    - `runRequiredConfigChecks` (to mark the shop as `blocked` when critical checks fail), and
    - `getConfiguratorProgressForShop` (to surface optional‑step failures as `warning` states).
- If we later need more nuanced behaviour per env, `getLaunchStatus` can be extended to:
  - Treat some checks as warnings in `dev` but blockers in `prod`.
  - Incorporate commercial mode (`Shop["type"]` / future `billingMode`) when deciding which checks are required.

**Acceptance criteria**

- There is a programmatic way (whether via `configuratorChecks` directly or an aggregator) to answer:
  - “Is this shop ready to launch?” for the target env.
- CMS uses these checks to gate “Launch” and “Deploy” flows, and the reasons for failures are visible in the Configurator dashboard.

---

## A2 — Configurator wizard UX in `apps/cms`

**Goal**

Describe the existing multi‑step Configurator wizard in `apps/cms` that collects the configuration needed for shop creation and launch, and highlight any remaining UX/coverage gaps.

### A2‑1 Wizard structure

**Current state**

- The Configurator wizard lives under:
  - `apps/cms/src/app/cms/configurator/*`
- Steps are defined in `steps.tsx` and include (among others):
  - `shop-details` (shop id, name, logos, contact email).
  - `shop-type` (sale vs rental).
  - `theme` and `tokens` (theme selection and design tokens).
  - `payment-provider`, `shipping`, `checkout-page`, `inventory`.
  - `env-vars` (guided env variable entry for Stripe, auth, CMS, email, etc.).
  - `import-data` (optional) and `hosting`.
- The wizard is navigable forwards/backwards, embedded under a single Next.js route (`/cms/configurator`), and is wired into the CMS dashboard entry points.

**Remaining work (optional refinements)**

- Ensure that, for a “fast launch” flow, the minimum required steps for a viable shop (identity, theme, core pages, providers/env, hosting) are clearly marked and surfaced in the dashboard.
- Align step naming and grouping with the mental model in other docs (for example, “Shop basics”, “Theme & tokens”, “Core pages”, “Navigation”, “Providers & env”, “Domains & environments”) where it helps comprehension, without changing the underlying behavior.

---

### A2‑2 Validation & UX

**Current state**

- Individual steps use local Zod schemas and shared helpers for validation (for example, `StepShopDetails`’ schema and `useConfiguratorStep`).
- Wizard‑level state and validation are handled via `ConfiguratorState` in `apps/cms/src/app/cms/wizard/schema.ts`, including:
  - Required fields and sensible defaults for titles/descriptions.
  - Provider and env settings (`ProviderSettings`, `EnvironmentSettings`).
- A summary step (`StepSummary`) surfaces the collected configuration and allows final edits before creation.
- Launch readiness is surfaced separately via:
  - `useLaunchShop`/`LaunchPanel` in the Configurator dashboard.
  - Back‑end checks in `configuratorChecks` and `/api/launch-shop`.

**Remaining work (optional refinements)**

- Where helpful, align step‑level schemas with the canonical `@acme/types` contracts to reduce drift.
- Consider extending the summary view to show a high‑level readiness checklist that reuses the `configuratorChecks` results for the current shop.

---

### A2‑3 Draft handling

**Current state**

- Configurator progress is persisted:
  - In memory during navigation via `ConfiguratorContext`.
  - In the browser via `localStorage` under `cms-configurator-progress`.
  - On the server in `data/cms/configurator-progress.json` via `/cms/api/configurator-progress`, with:
    - Wizard state fields (excluding `env`) stored under `state`.
    - Step completion stored under `completed`.
- Env/secrets are managed via a dedicated flow:
  - `env` values in the wizard state are posted to `/cms/api/env/[shopId]`, which writes `.env` files under the shop’s data directory and triggers provider setup (for example, Sanity blog).
  - Server‑side configurator drafts deliberately do not persist `env` to align with CC‑2; any legacy `env` data in drafts is ignored on hydration.
- `useConfiguratorPersistence`:
  - Hydrates wizard state from the server (falling back to legacy localStorage where needed).
  - Writes updated state back to the server and localStorage with debouncing.
  - Supports clearing state via `resetConfiguratorProgress`.

**Remaining work (optional refinements)**

- If we need per‑shop/per‑user drafts beyond the current single‑user progress file, introduce a more structured persistence layer (for example, a `ShopConfigDraft` model) and migrate `configurator-progress.json` into it.
- Review how env values are stored in drafts and ensure we align with the long‑term secret‑handling goals in CC‑2 (for example, storing only placeholders or validation status where appropriate).

---

## A3 — Shop creation & launch pipeline

**Goal**

Describe how the configuration produced by the wizard flows into:

- Canonical database records (`Shop`, `ShopSettings` via Prisma/platform‑core).
- Derived filesystem artefacts under `data/shops/<id>` via platform‑core JSON repositories.
- The subsequent launch/deploy steps.

### A3‑1 Creation path (current)

**Current state**

- The creation pipeline is implemented as:
  - Wizard UI → `createShop` wizard service (`apps/cms/src/app/cms/wizard/services/createShop.ts`).
  - `POST /cms/api/configurator` (`apps/cms/src/app/api/configurator/route.ts`) which:
    - Validates the payload with `createShopOptionsSchema` from `@acme/platform-core/createShop`.
    - Calls `createNewShop` in `apps/cms/src/actions/createShop.server.ts`.
  - `createNewShop` delegates to `@acme/platform-core/createShop`, which:
    - Writes Prisma `Shop`/`ShopSettings` state.
    - Writes initial filesystem artefacts under `data/shops/<id>` via repositories.
  - After creation, `/cms/api/configurator` attempts env validation via `validateShopEnv(id)` and returns any env errors alongside creation status.
- Launch uses `/api/launch-shop`, which:
  - Ensures all required Configurator steps are marked complete.
  - Calls `runRequiredConfigChecks` from `@acme/platform-core/configurator` for the shop, which runs the shared `configuratorChecks` for the required step set.
  - Delegates to `deployShop` (and related services) to perform the deploy, optionally seeding demo data.

**Remaining work (optional refinements)**

- If we need richer tracking of creation attempts, introduce a lightweight “creation state” artefact (for example, recording last error and timestamp) built on top of the existing pipeline, without replacing `@acme/platform-core/createShop`.
- Extend logging/telemetry around creation and launch so CMS operators can more easily see and retry failures.

**Acceptance criteria**

- The wizard, `POST /cms/api/configurator`, `createNewShop`, and `@acme/platform-core/createShop` remain the single, shared path for turning Configurator state into a new shop.
- Launch and deploy flows continue to build on this path, using `configuratorChecks` to guard unsafe deployments.

---

## Summary of Thread A completion criteria

Thread A is considered aligned when:

1. `Shop`, `ShopSettings`, and provider schemas in `@acme/types` / `@acme/config` are treated as the canonical contracts for shop configuration.
2. The Configurator wizard in `apps/cms` can collect the configuration required for a viable shop and surface readiness via `configuratorChecks` and the dashboard.
3. The existing creation and launch pipeline (`createShop` wizard service → `/cms/api/configurator` → `createNewShop` → `@acme/platform-core/createShop` → `/api/launch-shop`) is the documented, shared path from configuration to live shop.
