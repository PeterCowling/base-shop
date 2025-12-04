Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# CMS Plan — Fast Shop Launch & Stability

**Goal**

Reduce time from “start configurator” to first live shop to ≤30 minutes for a non‑technical user (assuming external accounts like Stripe already exist), while keeping launches stable, repeatable, and observable across shops and environments.

**Non‑goals**

- Rebranding or redesign of tenant apps beyond what the theme system already supports.
- Replacing the existing deployment platform(s); this plan integrates with current adapters.
- Full observability platform roll‑out; this plan focuses on minimal, consistent signals that can be shipped now.

---

## Milestones

1. **Configurator MVP**  
   CMS guides a user through all required shop inputs and produces a fully valid `Shop` + `ShopSettings` + pages + theme in one flow.

2. **Template Runtime Contract**  
   `packages/template-app` is documented and used as the canonical runtime for at least one tenant shop.

3. **One‑Click Create + Deploy**  
   CMS can create a new shop, run necessary scripts, and deploy a working runtime with a single action.

4. **Standard Smoke Tests**  
   Every shop build runs a shared test suite that gates “Launch”.

5. **Health & Status in CMS**  
   CMS surfaces per‑shop, per‑environment health derived from deploy/upgrade artifacts and logs.

Each thread below feeds one or more milestones.

---

## Cross‑cutting rules

- **CC‑1 Prisma vs `data/shops/*`**  
  If a field exists both in Prisma (`Shop`, `ShopSettings`) and in `data/shops/<id>/*`, the Prisma value is authoritative. Filesystem artefacts are derived/operational metadata only and must be written/read via platform‑core repositories (deploy/upgrade metadata, snapshots), never as a second source of truth.

- **CC‑2 Envs & secrets**  
  The Configurator never stores or edits secrets. It only:
  - Collects shop‑level feature flags / provider selections (e.g. “this shop uses Stripe”, “UPS returns enabled”).  
  - Validates env‑level secrets via `@acme/config/env/*` and surfaces errors (for example, “`STRIPE_SECRET_KEY` missing in this env”).  
  Secrets remain environment‑level concerns, managed outside CMS.

- **CC‑3 Platform‑compatible apps**  
  A “platform‑compatible” tenant app:
  - Re‑exports `@acme/platform-core/cartApi` at `/api/cart`.  
  - Uses shared checkout helpers at `/api/checkout-session`.  
  - Uses platform‑core repositories for `Shop`, `ShopSettings`, pages, and products.  
  - Implements the preview route contract.  
  Prefab cart/checkout/header blocks and the shared smoke tests are only guaranteed to work on platform‑compatible apps. Heavily forked/legacy apps are best‑effort and may be out of scope.

- **CC‑4 System‑only commerce blocks**  
  `CartSection`, `CheckoutSection`, and similar commerce blocks are **system blocks**:
  - They may only be used in designated system routes/slots (checkout/cart shells), not arbitrary marketing pages.
  - The block palette should hide them for non‑system `pageType`s.  
  - Publish‑time validation should reject pages that use them outside allowed contexts.

- **CC‑5 Rental scope for v1**  
  For v1, platform‑level guarantees (contracts, smoke tests, observability) are scoped to rental orders (`RentalOrder`). Sale‑only/hybrid flows may reuse the same infrastructure but are considered experimental and are **not** required for “launchable” status.

---

## Thread A — Configurator & CMS as Source of Truth

**Objective**  
Make CMS the single control surface for shop configuration and ensure every shop reaches a “valid, launchable” state via a guided flow.

### A1. Finalise configuration contracts

**Intent**

Define exactly what “configured shop” means in terms of types and schemas, and separate “required for launch” from “optional”.

**Tasks**

- **A1‑1 Shop & Settings contracts**
  - Confirm and, where necessary, refine the shape of:
    - `Shop` (branding, locales, currency, features, providers, domains).
    - `ShopSettings` (SEO, navigation, page templates, checkout/returns policies).
  - Ensure schemas live in shared packages:
    - `packages/types` and/or `@acme/config` for `Shop` and `ShopSettings`.
    - Zod schemas for provider configuration: Stripe, tax, shipping, email.

- **A1‑2 Provider/env schemas**
  - Extend or tighten:
    - `@acme/config/env/core` for Stripe and general env.
    - `@acme/config/env/shipping` for tax/shipping APIs.
  - Clearly mark which keys are mandatory for a shop to be “launchable” per environment.

- **A1‑3 Launch‑critical vs optional (per env)**
  - Document per field and per environment (`dev` / `stage` / `prod`):
    - Required at initial launch (for example, Stripe keys required in `stage`/`prod`, optional in `dev`).
    - Optional or “can be added later” (for example, advanced SEO, certain feature flags).
  - Encode these requirements into Zod refinements so they are enforced at save time and can be evaluated in CMS for gating Launch.

**Deliverables**

- `docs/cms-plan/thread-a-config-contracts.md`:
  - Enumerates configuration primitives (`Shop`, `ShopSettings`, providers, templates).
  - Labels each field as `required-for-launch` or `optional`.
- Exported Zod schemas:
  - Re‑used by CMS forms, scripts, and tests.

**Validation**

- A1‑V: Add targeted unit tests in `@acme/config` / `@acme/types` that exercise the schemas and per‑environment “required for launch” rules; run with:
  - `pnpm --filter @acme/config test -- --testPathPattern env`  
  - `pnpm --filter @acme/types test -- --testPathPattern Shop`

---

### A2. Configurator wizard UX in `apps/cms`

**Intent**

Provide a non‑technical, multi‑step wizard that collects all required data to configure a shop end‑to‑end.

**Tasks**

- **A2‑1 Wizard structure**
  - Implement routes under `apps/cms/src/app/cms/configurator/*` with steps:
    1. **Shop basics**  
       Name, slug, primary locale, additional locales, currency.
    2. **Theme & tokens**  
       Theme selection, base palette (e.g. primary/accent), typography presets.
    3. **Core pages**  
       Selection from `corePageTemplates` (home, PLP, PDP, checkout shell).
    4. **Navigation & chrome**  
       Header (including HeaderCart), footer, primary nav, essential links (e.g. returns, terms, privacy).
    5. **Providers & env**  
       - Collect shop‑level choices (for example, “this shop uses Stripe”, “UPS returns enabled”).  
       - Validate env‑level secrets using schemas from A1 (surfacing missing/invalid values), but never store or edit secrets directly.
-    6. **Domains & environments**  
+    6. **Domains & environments**  
       Staging and production URLs, environment flags, deployment adapter selection.

- **A2‑2 Validation & UX**
  - For each step:
    - Bind form state to the corresponding Zod schema.
    - Show inline error messages; disable “Next” when invalid.
  - Implement a summary step:
    - Show a checklist of launch prerequisites with clear green/red indicators.
    - Allow users to jump back to fix missing items.
  - Visually distinguish “required for launch” vs “optional enhancements” per step, and gate the final **Launch** button on all required fields being valid for the target environment(s).

- **A2‑3 Draft handling**
  - Persist configurator progress as a draft:
    - In memory during session.
    - Optionally as a draft shop record (“config draft”) tied to a user, so work is not lost.

**Deliverables**

- A functional Configurator wizard that produces a single configuration object:
  - `{ shop: ShopConfig, settings: ShopSettingsConfig, pages: [...], providers: {...}, domains: {...} }`.
- Unit/integration tests ensuring:
  - Validation prevents progression with invalid data.
  - The final summary reflects missing configuration accurately.

**Validation**

- A2‑V: Add Configurator integration tests in `apps/cms` that drive the wizard through all steps and assert:
  - Invalid inputs block progression.
  - A fully filled, valid config reaches the summary and can be submitted.  
  Run with:  
  `pnpm --filter @apps/cms test -- --testPathPattern configurator`

---

### A3. CMS actions that materialise configuration

**Intent**

Turn the Configurator’s configuration object into actual `Shop` records, `ShopSettings`, and initial filesystem state via a robust, idempotent service.

**Tasks**

- **A3‑1 ConfiguratorService abstraction**
  - Add `apps/cms/src/services/shops/ConfiguratorService.ts` with responsibilities:
    - Validate full config object using schemas from A1.
    - Create or update:
      - `Shop` via `@acme/platform-core` repositories.
      - `ShopSettings` for the shop.
      - Initial page documents based on `corePageTemplates`.
      - Derived JSON under `data/shops/<id>`, using platform-core JSON repos (no direct `fs` from CMS).
    - Persist **database state first** via Prisma repositories; treat filesystem writes as derived artefacts. FS failures must be logged and surfaced but must not leave Prisma in an unknown state.

- **A3‑2 CMS actions**
  - Implement `createShopFromConfig` action in `apps/cms/src/actions/*`:
    - Accepts configuration from the wizard.
    - Runs `ConfiguratorService` to perform writes.
    - Emits structured logs with `shopId`, `env`, `operationId`.
  - Ensure idempotence:
    - Re‑running the action with the same config is safe (either no‑ops or cleanly updates records).

- **A3‑3 Error handling & rollback**
  - Define failure semantics:
    - If partial failure occurs, mark a `shop-creation-state` record in the shop’s data root.
    - Surface this state in CMS as “Needs repair” with a “Retry creation” action.

**Deliverables**

- `createShopFromConfig` action callable by:
  - The Configurator wizard’s “Create shop” button.
  - Tests and CLI tools.
- End‑to‑end tests:
  - Set up a minimal config.
  - Call the action.
  - Assert that the shop is present in repo, settings are saved, and pages exist.

**Validation**

- A3‑V: Add tests in `apps/cms` exercising `createShopFromConfig`, including:
  - Successful creation path.
  - Simulated filesystem failure after DB writes, asserting DB remains consistent and creation state reflects the error.  
  Run with:  
  `pnpm --filter @apps/cms test -- --testPathPattern createShopFromConfig`

---

## Thread B — Template Runtime & Tenant Convergence

**Objective**  
Standardise on a runtime contract so shops are primarily configured, not coded.

### B1. Document the template app runtime contract

**Intent**

Make it explicit what a runtime must provide to be considered “platform‑compatible”.

**Tasks**

- **B1‑1 Contract audit**
  - Inspect `packages/template-app` to list:
    - Required environment variables (`SHOP_ID`, Stripe keys, CMS URLs, etc.).
    - Required API routes:
      - Cart: add/update/remove.
      - Checkout session: create.
      - Return: rental return/refund.
      - Preview and health endpoints.
    - Data dependencies:
      - Use of `@acme/platform-core` for shops, settings, products, pages.
      - Use of theme tokens (Tailwind & CSS variables).
    - Preview contract:
      - Preview route shape (for example, `/preview/[pageId]`), auth model (HMAC token), and how CMS triggers it.
    - Page Builder route contract:
      - Mapping of PB pages to runtime routes (for example, `/[lang]/pages/[slug]` → `Page`/`PageType` nodes).

- **B1‑2 Contract documentation**
  - Write `docs/runtime/template-contract.md` covering:
    - File/route structure.
    - How “current shop” is selected (by host, path, or explicit env).
    - APIs expected by CMS (preview hooks, asset URLs).
    - How CMS‑authored page templates map to runtime components.

**Deliverables**

- `docs/runtime/template-contract.md` referenced by CMS and app teams.
- A short “checklist” in the doc that lets a developer verify a tenant app’s compliance.

**Validation**

- B1‑V: Add a contract “lint” or test that verifies a candidate app implements required routes/exports by importing `docs/runtime/template-contract.md`’s checklist into code or using a small validator; run for template app and the pilot tenant with:  
  `pnpm --filter @apps/template-app test -- --testPathPattern contract`

---

### B2. Make a tenant app fully template‑based

**Intent**

Prove the contract by converging at least one tenant onto the template app model.

**Tasks**

- **B2‑1 Target selection**
  - Choose a tenant app (for example, `apps/cover-me-pretty`) as the pilot.

- **B2‑2 Refactor to contract**
  - Ensure the app:
    - Uses platform‑core for all cart/checkout/return operations (no custom duplicates).
    - Reads `Shop` and `ShopSettings` via `@acme/platform-core` repositories only.
    - Renders pages using CMS blocks and templates from `page-builder-core` + `ui`.
    - Depends on template contracts for theme tokens and shared components.
  - Drive refactor behind feature flags or environment gating:
    - Allow staging to run “before” and “after” modes side‑by‑side before switching production over.

- **B2‑3 Remove special cases**
  - Identify and eliminate app‑specific forks of:
    - Checkout routes.
    - Return routes.
    - Cart logic.
  - Replace them with configured behaviors (flags, settings, themes).

**Deliverables**

- At least one tenant app documented as “platform‑compatible” in `docs/runtime/template-contract.md`.
- A short migration guide for converting additional tenants to this model.

**Validation**

- B2‑V: For the pilot tenant:
  - Run the shared smoke tests from Thread D against both the legacy and template‑compatible modes in staging.
  - Enable template mode only once smoke tests pass and key routes behave as expected.

---

## Thread C — Create / Deploy / Upgrade Pipeline

**Objective**  
Make “Create shop” and “Launch shop” single operations initiated from CMS, with clear artefacts and rollback paths.

### C1. Harden `createShop` / `initShop` flows

**Intent**

Ensure shop creation from config is scriptable, idempotent, and consistent with CMS actions.

**Tasks**

- **C1‑1 CLI alignment**
  - Update `scripts/src/createShop` / `initShop` to:
    - Accept a config object (or JSON file path) matching the Configurator output.
    - Use platform‑core repositories and helpers only (no ad hoc `fs`).
  - Ensure alignment between CMS’ `createShopFromConfig` and CLI:
    - Both share the same underlying service function if possible.

- **C1‑2 Idempotence & repair**
  - Make creation idempotent:
    - If `Shop` already exists, either:
      - Refuse with a clear error; or
      - Support a “replay” that reconciles config vs existing state. In v1, treat “replay config onto existing shop” as a dev/stage‑only capability; production should prefer explicit “migrate” or “repair” flows.
  - Introduce a `creation.json` or similar artefact to record creation runs and failures.

**Deliverables**

- `pnpm create-shop --shop <id> --config <config>` CLI, documented in `docs/cms-plan/thread-c-create-deploy.md`.
- Tests verifying:
  - Creation from a minimal config yields a correct set of shop files and DB records.
  - Re‑running creation behaves predictably.

**Validation**

- C1‑V: Add CLI tests (or integration tests) that:
  - Run `createShop` on a fresh config.
  - Run it again to exercise idempotence.
  - Confirm these behaviours in `dev`/`stage` environments only.  
  Run with:  
  `pnpm --filter scripts test -- --testPathPattern createShop`

---

### C2. One‑click deploy from CMS

**Intent**

Provide a single CMS action that takes a configured shop and makes it live on a runtime environment.

**Tasks**

- **C2‑1 Deployment adapter interface**
  - Define an adapter interface (if not already present), e.g.:

    ```ts
    interface ShopDeploymentAdapter {
      buildAndDeploy(args: {
        shopId: string;
        env: 'stage' | 'prod';
      }): Promise<{
        version: string;
        url: string;
        status: 'success' | 'failed';
        error?: string;
        deployId?: string;
        logsUrl?: string;
      }>;
    }
    ```

  - Implement concrete adapters for the current deployment platforms.

- **C2‑2 CMS deploy action**
  - Add `deployShop` action in `apps/cms/src/actions`:
    - Validates that config is ready (using A1/A3).
    - Invokes the adapter for {shopId, env}.
    - Writes `data/shops/<id>/deploy.json` including:
      - `version`, `env`, `timestamp`, `status`, `error?`, `url?`, `deployId?`, `logsUrl?`.
  - Surface a “Deploy to staging” / “Deploy to production” button per shop in CMS.

**Deliverables**

- `deploy.json` artefacts with a stable schema, documented alongside.
- CMS “Deployment” panel showing:
  - Last deploy per environment.
  - Deploy controls and current status.

**Validation**

- C2‑V: In a staging environment, trigger `deployShop` from CMS for a sample shop and verify:
  - `deploy.json` is written with expected fields.
  - The runtime responds on the reported URL.
  - `deployId` / `logsUrl` allow cross‑referencing build logs.  
  Manual validation plus a basic integration test that stubs the adapter.

---

### C3. Upgrade & rollback

**Intent**

Allow controlled upgrades of shop runtimes (e.g. new components, theme changes) with clear history and rollback.

**Tasks**

- **C3‑1 Upgrade artefacts**
  - Ensure `upgrade-shop` script writes:
    - `upgrade.json` with current in‑progress or last upgrade.
    - Entries appended to `history.json` with:
      - `shopId`, `fromVersion`, `toVersion`, `timestamp`, `status`, `notes`.
    - On successful upgrade, update `shop.json.componentVersions` and `shop.json.lastUpgrade` via platform‑core repositories.

- **C3‑2 CMS actions**
  - Add `upgradeShop` CMS action that:
    - Triggers the upgrade script.
    - Optionally triggers a republish + redeploy.
    - Updates `upgrade.json` and `history.json`.
  - Add `rollbackShop` action that:
    - Picks a previous version from `history.json`.
    - Runs a rollback script or replays config for that version.
    - Re‑deploys the runtime and updates deploy artefacts.

- **C3‑3 Guard with tests**
  - Integrate Thread D’s smoke tests:
    - Upgrades are only marked as `success` in `upgrade.json` if the post‑deploy tests pass.

**Deliverables**

- Stable `upgrade.json` / `history.json` formats and docs.
- CMS UI showing:
  - Upgrade history.
  - Buttons for “Upgrade to latest” and “Rollback to previous version”.

**Validation**

- C3‑V: Add integration tests that:
  - Run a simulated upgrade, assert `upgrade.json`, `history.json`, and `shop.json.componentVersions` / `lastUpgrade` are updated.
  - Simulate a failed upgrade and confirm status and error fields in `upgrade.json` are set appropriately.

---

## Thread D — Quality Gates & Tests

**Objective**  
Ensure every shop passes a minimal, standard test suite before being considered live.

### D1. Shop smoke tests

**Intent**

Create a reusable test suite that validates core commerce flows for any shop/environment.

**Tasks**

- **D1‑1 Test coverage**
  - Implement tests that:
    - Call cart API (add item, update quantity, remove) and assert success.
    - Call checkout session API and verify:
      - Stripe session creation is attempted.
      - Config‑dependent behavior (rental sale modes) works for sample data.
    - Use stubbed/double implementations for external providers (Stripe, shipping, tax) via MSW or equivalent; smoke tests must not hit live external services.
    - Call return/refund API for a rental shop (if applicable).
    - Hit key pages:
      - Home, PLP, PDP, checkout shell.
      - Assert 2xx status and basic HTML structure (no top‑level errors).
    - Hit at least one PB‑driven route (for example, `/[lang]/pages/[slug]`) for a known CMS page and assert 2xx status plus presence of a known block marker (for example, a data attribute), to confirm CMS → runtime PB wiring is intact.

- **D1‑2 Shop parametrisation**
  - Allow tests to be run for any shop:
    - Use environment variables or CLI flags: `SHOP_ID`, `SHOP_ENV`.
    - Load shop config and use sample products from that shop’s data root or fixtures.

**Deliverables**

- `pnpm test:shop-smoke --shop <id> --env <env>` script.
- CI configuration to run these tests automatically when deploying/upgrading a shop.

**Validation**

- D1‑V: Run the smoke suite against a known “sample shop” in `dev`/`stage` with:  
  `pnpm test:shop-smoke --shop sample-shop --env stage`

---

### D3. Sample shops & local seeding

**Intent**

Make it easy for developers and QA to stand up realistic, testable shops locally with a single command.

**Tasks**

- **D3‑1 Sample configs**
  - Create one or more “sample shop” configuration fixtures (for example, `sample-rental`, `sample-sale-experimental`) that:
    - Cover typical PB pages and blocks.
    - Exercise core flows used in smoke tests.

- **D3‑2 Seeding scripts**
  - Add or extend scripts (for example, `scripts/src/seed-test-data.ts`) so that:
    - `pnpm seed:sample-shop --shop sample-rental` creates all necessary `Shop`, `ShopSettings`, and `data/shops/<id>` state locally for that sample config.

- **D3‑3 DX docs**
  - Document a one‑command local setup in `docs/development.md` or `docs/cms-plan/thread-f-developer-ergonomics.md`, referencing these seeds.

**Deliverables**

- One or more sample shops that can be created locally via a single seed command.
- Documentation for developers describing how to bring up a local, testable shop.

**Validation**

- D3‑V: Run the seed command for a sample shop, start the relevant runtime, and then run:
  - `pnpm test:shop-smoke --shop sample-rental --env dev`  
  to confirm the seeded shop is ready for smoke testing.

---

### D2. Launch/Deploy gating in CMS

**Intent**

Enforce that shops cannot be marked live unless the smoke tests pass.

**Tasks**

- **D2‑1 Integrate with deploy flow**
  - Modify `deployShop` / `launchShop` actions to:
    - After deploying, run `test:shop-smoke` for the relevant shop and environment.
    - Mark deployment as:
      - `success` only if tests pass.
      - `failed` with `error` recorded in `deploy.json` if tests fail.
    - Do **not** automatically roll back on failed deploy+tests; keep the last known good deploy live and surface the new deploy as failed in CMS UI and `deploy.json`.

- **D2‑2 UI feedback**
  - Show:
    - “Launch successful” with last test timestamp and summary.
    - “Launch failed” with link to test logs and recommended remediation.

**Deliverables**

- `Launch` in CMS is a single action that chains:
  - Config validation → creation/upgrade if needed → deploy → tests → status update.
- Clear separation in CMS between “deployed but unhealthy” and “live & healthy”.

**Validation**

- D2‑V: In staging, intentionally introduce a failure that causes smoke tests to fail after deploy, and verify:
  - CMS marks the deploy as failed.
  - The previously healthy runtime remains live.

---

## Thread E — Health, Logs & Metrics

**Objective**  
Give teams fast insight into shop health and behavior per shop and environment.

### E1. Logging standardisation

**Intent**

Make logs structured and shop‑aware everywhere.

**Tasks**

- **E1‑1 Logger usage**
  - Replace ad hoc logging in:
    - `apps/cms`,
    - `packages/platform-core`,
    - `packages/template-app`,
    - background workers / CRON‑style functions,
    with `@acme/shared-utils/logger`.

- **E1‑2 Event structure**
  - Standardise on a shape like:

    ```ts
    {
      level: 'info' | 'warn' | 'error',
      timestamp: string,
      service: 'cms' | 'template-app' | 'platform-core' | 'worker' | ...,
      env: 'dev' | 'stage' | 'prod',
      shopId?: string,
      requestId?: string,
      operationId?: string,
      message: string,
      meta?: Record<string, unknown>
    }
    ```

  - Ensure all shop‑specific events include `shopId`.
  - For HTTP entrypoints, generate a `requestId` on ingress (or read `X-Request-ID` when present) and propagate it through CMS → platform‑core → runtime. All logs for a given request should share this ID.

- **E1‑3 Console hygiene**
  - Where console APIs remain (tests, legacy code), wrap them so they produce structured logs or are clearly marked as test‑only.

**Deliverables**

- `docs/observability/logging-conventions.md` describing required fields and examples.
- Logs that can be filtered by `shopId` and `operationId` to debug create/upgrade/deploy/checkouts.

---

### E2. Metrics & CMS health badges

**Intent**

Provide a minimal but useful set of metrics and a simple health summary in CMS.

These metrics and health states implement the “Operational observability” decisions outlined in `docs/historical/cms-research.md`; keep this thread and that document in sync.

**Tasks**

- **E2‑1 Core metrics**
  - Define and emit counters/histograms (even if initially as JSON or stub endpoints) for:
    - `cms_shop_create_total{shopId,env,status}`
    - `cms_page_publish_total{shopId,env,status}`
    - `cms_settings_save_total{shopId,env,status}`
    - `cart_checkout_requests_total{shopId,env,status}`
    - `upgrade_republish_total{shopId,env,status}`
    - Latency measures for checkout and CMS save/publish endpoints.

- **E2‑2 Health derivation**
  - Combine:
    - Latest `deploy.json`,
    - `upgrade.json` status,
    - `history.json`,
    - and recent error logs,
    into a simple status with rough thresholds, for example:
    - `healthy` — last deploy succeeded; smoke tests executed successfully within N hours; no critical errors in the last M minutes.
    - `needs attention` — degraded signals (for example, last tests stale or soft failures present) but not outright broken.
    - `broken` — recent deploy/upgrade failure or repeated critical errors in a short window.

- **E2‑3 CMS presentation**
  - In the shop overview:
    - Render a per‑shop matrix: `[environment] x [status]`.
  - In shop detail:
    - Show:
      - Last deploy info (version, url, timestamp, status).
      - Last upgrade info.
      - Quick links to artefacts and logs.

**Deliverables**

- A basic “Operator view” inside CMS for:
  - Listing shops by health.
  - Drilling into issues with clear actions: redeploy, retry upgrade, repair config.

**Validation**

- E2‑V: For a small set of test shops, manipulate:
  - Deploy results,
  - Smoke test recency,
  - Error logs,  
  and confirm the CMS health badges reflect `healthy` / `needs attention` / `broken` according to the documented thresholds.

---

## Recommended Implementation Order

1. **Thread A1 → A2 → A3**  
   Lock down config contracts, build the wizard, and wire `createShopFromConfig`.
2. **Thread B1 → B2**  
   Document the runtime contract and bring one tenant app into compliance.
3. **Thread C1 → C2**  
   Harden `createShop`/`initShop`, then build CMS‑driven deploy (`deployShop`).
4. **Thread D1 → D2**  
   Implement the standard shop smoke tests and gate Launch/Deploy on them.
5. **Thread C3**  
   Add upgrades/rollbacks based on `upgrade.json`/`history.json`.
6. **Thread E1 → E2**  
   Standardise logging/metrics and surface per‑shop health in CMS.

This master thread should be kept in sync with detailed thread documents (e.g. `thread-a-configurator.md`, `thread-b-runtime.md`) as implementation proceeds.
