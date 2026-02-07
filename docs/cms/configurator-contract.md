Type: Contract
Status: Canonical
Domain: CMS
Last-reviewed: 2025-12-02
Implements: cms-charter::Launch and health

Canonical code:
- apps/cms/src/app/api/configurator-progress/route.ts
- apps/cms/src/app/api/launch-shop/route.ts
- apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts
- apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts
- packages/platform-core/src/configurator.ts

If behaviour in this doc contradicts the code, treat the code as canonical and update this doc as a follow‑up.

# CMS Configurator and Launch Contract

This document describes the observable contract for:

- Configurator progress and step status.
- Server-side configuration checks (ConfigChecks).
- Launch gating and launch status.
- Shop health aggregation.

It is the basis for CMS dashboard UI, tests, and any automation that relies on shop readiness.

## 1. Types and step model

Configurator types are defined in `@acme/types` and `@acme/platform-core`:

- `ConfiguratorStepId` – string union of known steps:
  - Required: `shop-basics`, `theme`, `payments`, `shipping-tax`, `checkout`, `products-inventory`, `navigation-home`.
  - Optional: `domains`, `reverse-logistics`, `advanced-seo`.
- `StepStatus` / `ProgressStepStatus` – one of:
  - `"pending"` – no server-side result yet.
  - `"complete"` – server-side checks succeeded.
  - `"error"` – server-side checks failed.
- `ConfiguratorProgress` – shape returned by server-side progress:
  - `shopId: string`
  - `steps: Record<ConfiguratorStepId, ProgressStepStatus>`
  - `errors?: Partial<Record<ConfiguratorStepId, string>>`
  - `lastUpdated: string` (ISO timestamp)

Client-only state (wizard progress, skipped steps) is modeled separately in `apps/cms/src/app/cms/wizard/schema` and is not part of this contract.

## 2. ConfigChecks

`packages/platform-core/src/configurator.ts` defines the canonical configuration checks:

- **Types**
  - `ConfigCheckResult`:
    - `{ ok: true }`, or
    - `{ ok: false; reason: string; details?: unknown }`.
  - `ConfigCheck = (shopId: string) => Promise<ConfigCheckResult>`.

- **Checks**
  - `checkShopBasics`:
    - Ensures `Shop` exists and has an `id`.
    - Ensures `ShopSettings.languages` is a non-empty array and a primary locale exists.
  - `checkTheme`:
    - Ensures `shop.themeId` is set.
    - Ensures `shop.themeTokens` has at least one key.
  - `checkPayments`:
    - Ensures `ShopSettings.currency` is set.
    - Ensures at least one payment or billing provider is configured on the shop.
    - Ensures required provider env vars are present via `pluginEnvVars`.
  - `checkShippingTax`:
    - Ensures `ShopSettings.taxRegion` is set.
    - Ensures `shop.shippingProviders` is non-empty.
  - `checkCheckout`:
    - Ensures page data for the checkout route exists in `pages` for the shop.
  - `checkProductsInventory`:
    - Ensures at least one published product and inventory item exist for the shop.
  - `checkNavigationHome`:
    - Ensures navigation and home page configuration exist for the shop.

- **Registry**
  - `configuratorChecks: Partial<Record<ConfiguratorStepId, ConfigCheck>>` maps step IDs to checks:
    - Required steps: `shop-basics`, `theme`, `payments`, `shipping-tax`, `checkout`, `products-inventory`, `navigation-home`.
    - Optional steps: `domains`, `reverse-logistics`, `advanced-seo` (may have checks added over time).

The mapping between `ConfiguratorStepId` and `ConfigCheck` is the canonical source for what each step validates.

## 3. Progress API – `/api/configurator-progress`

**Route:** `apps/cms/src/app/api/configurator-progress/route.ts`

### 3.1 GET – per-user wizard state and server progress

- **Authentication**
  - Requires a valid session; unauthenticated requests return `401`.

- **Query**
  - Optional `shopId` query string parameter:
    - If omitted:
      - Returns the current user’s persisted wizard state from `data/cms/configurator-progress.json`.
      - Shape: internal to CMS (`{ state, completed }`); not part of the public contract.
    - If provided:
      - Returns server-side `ConfiguratorProgress` for that `shopId` by calling:
        - `getConfiguratorProgressForShop(shopId)` from `@acme/platform-core/configurator`.

- **Responses**
  - `200` with JSON:
    - When `shopId` is present:
      - `ConfiguratorProgress` as defined above (`shopId`, `steps`, `errors?`, `lastUpdated`).
    - When `shopId` is absent:
      - Per-user wizard state object.
  - `401` when no session or user is present.
  - `500` with `{ error: string }` when server-side checks or file I/O fail.

### 3.2 PUT/PATCH – wizard persistence

- **Purpose**
  - Persist per-user configurator state and step completion to `data/cms/configurator-progress.json`.
  - This state is used for restoring the wizard UI; it does *not* directly affect server-side ConfigChecks.

- **Validation**
  - Request bodies are validated with:
    - `configuratorStateSchema` (partial) for state.
    - `stepStatusSchema` / `StepStatus` for step completion.
  - Invalid bodies throw `api.common.invalidRequest`.

- **Behaviour**
  - PUT:
    - Accepts `stepId?`, `data?`, and `completed?` (single `StepStatus` or record).
    - Merges into per-user record and persists.
  - PATCH:
    - Accepts `stepId` and `completed` (`StepStatus`), updating a single step.

The server-side progress returned when `shopId` is provided is independent of wizard persistence and is derived exclusively from `ConfigCheck`s.

## 4. Progress computation – `getConfiguratorProgressForShop`

**Location:** `packages/platform-core/src/configurator.ts`

- `getConfiguratorProgressForShop(shopId, steps?)`:
  - Default `steps` = all required + optional `ConfiguratorStepId`s.
  - For each step:
    - If a `ConfigCheck` exists:
      - Executes the check and maps the result to a `ProgressStepStatus`:
        - `ok: true` → `"complete"`.
        - `ok: false` → `"error"` with `reason` recorded in `errors[stepId]`.
    - If no check exists:
      - Sets status `"pending"`.
  - Returns a `ConfiguratorProgress` with:
    - `shopId`
    - `steps`
    - `errors?` (only when at least one error exists)
    - `lastUpdated` (ISO timestamp).

CMS and other tools should treat `ConfiguratorProgress` as the canonical server-side view of readiness per step.

## 5. Launch gating – `/api/launch-shop` and `getLaunchStatus`

### 5.1 Launch status helper

**Location:** `packages/platform-core/src/configurator.ts`

- `runRequiredConfigChecks(shopId, steps?)`:
  - Runs all required `ConfigCheck`s for the shop.
  - Returns:
    - `{ ok: true }` when all checks pass.
    - `{ ok: false; error: string }` with a combined failure string when any check fails.

- `getLaunchStatus(env: LaunchEnv, shopId: string)`:
  - In parallel:
    - `runRequiredConfigChecks(shopId)`
    - `getConfiguratorProgressForShop(shopId)`
  - Computes:
    - `status: LaunchStatus`:
      - `"ok"` – all required checks passed and no optional steps are in `error`.
      - `"blocked"` – one or more required checks failed.
      - `"warning"` – required checks passed but one or more optional steps are in `error`.
    - `reasons: string[]`:
      - Contains error messages from required and optional checks.
  - Returns `LaunchCheckResult`:
    - `{ env, status, reasons }`

### 5.2 Launch API – `/api/launch-shop`

**Route:** `apps/cms/src/app/api/launch-shop/route.ts`

- **Method**
  - `POST /api/launch-shop`

- **Input**
  - JSON body:
    - `shopId: string` – required.
    - `state: ConfiguratorState` – current wizard state (used for seeding and metadata).
    - `seed: boolean` – whether to seed initial data.
    - `env: Environment` – launch environment (e.g. `"stage"`, `"prod"`).
  - CSRF:
    - Requires `x-csrf-token` header derived from `getCsrfToken()` on the client.

- **Behaviour**
  - Authenticates the user; unauthenticated requests are rejected.
  - Re-evaluates readiness:
    - Uses `runRequiredConfigChecks(shopId)` to gate launch.
    - Optionally uses `getLaunchStatus` to compute a launch summary (status, reasons).
  - Orchestrates:
    - Shop creation and initialization.
    - Optional seeding based on `seed`.
    - Deployment via the configured shop deployment adapter.
  - Streams status events via Server-Sent Events (SSE):
    - Each event is a JSON object with `step` and `status` fields (`"pending" | "success" | "failure"`), and optional `error`.

- **Responses**
  - On success:
    - `200` with `Content-Type: text/event-stream`, streaming per-step launch status.
  - On configuration failure:
    - `4xx` / `5xx` with an error payload summarising why launch could not proceed.

Client code (`useLaunchShop`) consumes the SSE stream and updates local launch status per step.

## 6. CMS dashboard and health indicators

**Location:** `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts`

- The dashboard:
  - Initially computes local progress from wizard `completed` state.
  - When a `shopId` is present:
    - Calls `GET /api/configurator-progress?shopId=...`.
    - Uses `REQUIRED_CONFIG_CHECK_STEPS` and `OPTIONAL_CONFIG_CHECK_STEPS` from `@acme/platform-core/configurator` to derive:
      - `completedRequired`, `totalRequired`.
      - `completedOptional`, `totalOptional`.
    - Updates the progress ring and counts based on server-side status.
    - Derives a shop health indicator from the returned `ConfiguratorProgress` (for example healthy/degraded/broken).

Local wizard progress is used as a fallback when server-side checks are unavailable; server-side `ConfigCheck`s are the source of truth for readiness.

## 7. Builder-facing labels and copy guidelines

Although `ConfiguratorStepId` and `ConfigCheck` names are technical, the CMS surfaces built on this contract should present them to builders as a small set of clear, human‑language objectives.

### 7.1 Recommended labels for required checks

The table below lists the recommended mapping between internal identifiers and builder‑facing labels. This mapping is not enforced by types, but CMS components that render launch checklists or health summaries (for example the Configurator Summary, dashboard widgets, Settings snapshots) should use these labels wherever possible.

| ConfigCheck / stepId | Builder label | Short description (for UI) |
| --- | --- | --- |
| `checkShopBasics` / `shop-basics` | **Shop basics** | “Name, language, and basic identity are set.” |
| `checkTheme` / `theme` | **Look & feel** | “A base theme and essential design tokens are configured.” |
| `checkPayments` / `payments` | **Get paid** | “Currency is set and at least one payment/billing provider is connected.” |
| `checkShippingTax` / `shipping-tax` | **Shipping & tax** | “A tax region and at least one shipping provider are configured.” |
| `checkCheckout` / `checkout` | **Checkout page** | “A working checkout page exists and is reachable.” |
| `checkProductsInventory` / `products-inventory` | **Products in stock** | “There is at least one active product with stock available.” |
| `checkNavigationHome` / `navigation-home` | **Home & navigation** | “Homepage and navigation menu are set so visitors can find key pages.” |

**Guidelines:**

- UI should not expose raw `ConfigCheck` IDs or low‑level field names (for example `ShopSettings.languages`) to builders.
- Error messages should be framed as tasks, e.g. instead of “`checkProductsInventory` failed”, say “Add at least one active product with stock so customers can buy something.”
- Any launch checklist built on this contract should:
  - List each required check using the builder labels above.
  - Clearly indicate when all required checks are passing (for example “Your shop is launch‑ready”).
  - Provide a single “Fix it” entry point per failing row that links to the appropriate Configurator step or CMS surface.

These guidelines describe how to present the contract; they do not change the underlying behaviour defined earlier in this document.

## 8. Client launch hook – `useLaunchShop`

**Location:** `apps/cms/src/app/cms/configurator/hooks/useLaunchShop.ts`

- The hook:
  - Computes required steps via `getRequiredSteps` and the wizard `completed` map.
  - Exposes:
    - `launchShop()` – triggers the launch flow via `POST /api/launch-shop`.
    - `launchStatus` – per-step `LaunchStepStatus` (`idle | pending | success | failure`).
    - `launchError` – last error string, if any.
    - `failedStep` – the last step that failed.
    - `allRequiredDone` – whether the wizard considers all required steps complete.
    - `tooltipText` – user-facing explanation derived from translations.
  - Enforces the UI gate:
    - If `allRequiredDone` is false:
      - Does not call `/api/launch-shop`.
      - Calls `onIncomplete` callback with missing steps (for highlighting in UI).

The **UI gate** (`allRequiredDone`) and the **server gate** (`runRequiredConfigChecks`) must both pass for a launch to complete successfully.

## 9. Telemetry conventions for build flows

The configurator and related CMS surfaces can emit telemetry events via `@acme/telemetry`. This section standardises event names and payloads for the **build flow** so analytics and dashboards can reason about shop readiness and time‑to‑launch.

These events are not enforced by types in this module, but they are the recommended contract for new instrumentation:

| Event name | When to emit | Required payload fields |
| --- | --- | --- |
| `build_flow_step_view` | When a Configurator step is viewed (for example from each `Step*` component). | `{ shopId, stepId }` |
| `build_flow_step_complete` | When `useStepCompletion` marks a step complete (`markComplete(true)`). | `{ shopId, stepId }` |
| `build_flow_step_error` | When a step fails validation or a server error prevents completion. | `{ shopId, stepId, reason }` |
| `build_flow_first_product_prompt_viewed` | When the “Add your first product” prompt/modal is shown. | `{ shopId }` |
| `build_flow_first_product_created` | When the minimal first product (as defined in `docs/cms/shop-build-docs-help-plan.md`) is created successfully. | `{ shopId, productId }` |
| `build_flow_help_requested` | When a builder clicks an inline help control related to the build journey (for example StatusBar help, Settings help link, Products zero‑state help). | `{ shopId, stepId, surface }` where `surface` is a small enum string such as `"statusBar"`, `"settingsHero"`, `"configurationOverview"`, `"products"`, `"pageBuilder"`, `"themeEditor"`. |
| `build_flow_exit` | When a builder leaves the Configurator or build surfaces via a deliberate navigation (e.g. “Go to Settings”, “Go to Products”, “Replay tour”). | `{ shopId, reason, surface }` where `reason` is one of `"settings"`, `"pages"`, `"products"`, `"tour"`, `"launch"`, and `surface` identifies the UI element (for example `"statusBar"`, `"dashboard"`). |
| `build_flow_launch_ready` | When all required ConfigChecks first pass for a given `shopId` (as reported by `getConfiguratorProgressForShop` / `runRequiredConfigChecks`). | `{ shopId, checksPassing }` where `checksPassing` is a list of either ConfigCheck IDs or builder labels used in the checklist. |

Implementations that emit these events should:

- Use the `build_flow_` prefix for all build‑journey events so telemetry UIs can easily filter on this family.
- Consider measuring:
  - Time from the first `build_flow_step_view` for a shop to its first `build_flow_launch_ready`.
  - Percentage of shops that reach `build_flow_launch_ready` within 60 minutes.

These metrics support the CMS charter’s goal of letting non‑technical users create and launch a new shop quickly while keeping the underlying contract and checks stable.
