Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread E — Health, Logs & Metrics (Fast Launch)

This thread implements **Thread E** from `master-thread.fast-launch.md`:

- Standardise logging across CMS, platform‑core, and runtimes.
- Introduce minimal metrics for core flows.
- Surface per‑shop, per‑environment health in CMS.

- **Today (baseline)**:
  - Shared JSON logging via `@acme/shared-utils/logger` wraps `pino` and is already used in CMS middleware, selected platform‑core utilities, and the API upgrade/component routes.
  - CMS health badges are currently derived from Configurator progress via `deriveShopHealth(progress)` in `apps/cms/src/app/lib/shopHealth.ts` and surfaced in dashboard and shop views.
  - There is no per‑shop system metrics backend or per‑environment operational health derivation yet; the metrics and health rules in this thread describe the target behaviour.

It operationalises the “Operational observability” decisions described in `docs/historical/cms-research.md`, scoped deliberately to **pragmatic observability**:

- Just enough logging/metrics to support:
  - Thread A (“Configurator” / launchability predicate).
  - Thread C (create/deploy/upgrade, deploy artefacts).
  - Thread D (smoke tests and synthetic checks).
- Not a general‑purpose telemetry platform.

Cross‑cutting rules apply, especially:

- **CC‑1 Prisma vs `data/shops/*`** — when writing observability artefacts under `data/shops/<id>`, treat them as derived metadata; canonical business state remains in Prisma.
- “Operational truth” for a shop/environment lives in:
  - `deploy.json`, `upgrade.json`, `history.json` under `data/shops/<id>/…`,
  - smoke test artefacts from Thread D,
  - logs and metrics emitted by CMS, platform‑core, and runtimes.

---

## E1 — Logging standardisation

**Goal**

Ensure all relevant services emit structured, shop‑aware logs that can be correlated across CMS, platform‑core, and runtimes using `requestId` and `operationId`.

**Current implementation**

- `@acme/shared-utils` exposes:
  - A Pino‑backed `logger` that consults a shared `RequestContext` helper.
  - `RequestContext` carries `{ requestId, operationId?, shopId?, env, service }`.
- CMS middleware (`apps/cms/src/middleware.ts`) and key API routes wrap their handlers in `withRequestContext`, so logs automatically include `requestId`, `service`, `env`, and (when available) `shopId`.

### E1‑1 Logger usage

**Current state**

- `@acme/shared-utils/logger` wraps `pino` and exposes `error` / `warn` / `info` / `debug(message, meta?)`, emitting JSON logs with level and timestamp.
- It is used in:
  - CMS middleware (`apps/cms/src/middleware.ts`) for auth/CSRF/authorization logs.
  - Platform‑core utilities via the re‑export in `packages/platform-core/src/utils/logger.ts` (for example plugin resolver errors).
  - API upgrade/component routes in `apps/api`.
- Other packages (for example `packages/email`, `packages/stripe`, `packages/telemetry`, and `apps/cms/instrumentation.ts`) still use `console.*` directly for logging.

**Work**

- Adopt `@acme/shared-utils/logger` as the default logger in:
  - `apps/cms`
  - `packages/platform-core`
  - `packages/template-app` (and platform‑compatible tenants)
  - Background workers, CRON‑style services, and edge functions (where feasible).

- Refactor:
  - Replace direct `console.log` / `console.error` where used for **operational** logging with logger calls.
  - Document that `console.*` is reserved for tests or very local, ad‑hoc debugging during development and **must not** be left in production code paths.

- Runtime nuance:
  - Where the full logger implementation is not available (edge/runtime limitations), provide a thin, compatible facade that:
    - Exposes the same API and emits the same JSON event shape.
    - May write to `console` (or the runtime’s logging primitive) under the hood.

**Acceptance criteria**

- All new **operational** logging (anything used for health/incident response or dashboards) uses the shared logger (or its edge/runtime facade).
- Legacy `console.*` calls in critical paths are either removed or wrapped.

---

### E1‑2 Event structure & context propagation

**Current state**

- The shared logger writes JSON logs via Pino’s default shape with `level`, timestamp, message, and the provided `meta` object; there is no enforced event schema across services.
- Request‑ and shop‑level context is passed manually in `meta` in a few places (for example `path` / `role` / `shop` in `apps/cms/src/middleware.ts`, `shopId` / `id` in upgrade/component routes), but there is no shared `RequestContext` helper and no `requestId` / `operationId` propagation.

**Work**

- Standardise on an event shape, for example:

  ```ts
  {
    level: 'info' | 'warn' | 'error';
    timestamp: string;
    service: 'cms' | 'template-app' | 'platform-core' | 'worker';
    env: 'dev' | 'stage' | 'prod';
    shopId?: string;
    requestId?: string;
    operationId?: string;
    message: string;
    meta?: Record<string, unknown>;
  }
  ```

- Define a centralised `RequestContext` type and helper, for example:

  ```ts
  interface RequestContext {
    requestId: string;
    operationId?: string;
    shopId?: string;
    env: 'dev' | 'stage' | 'prod';
    service: 'cms' | 'template-app' | 'platform-core' | 'worker';
  }
  ```

- Implement `RequestContext` propagation:
  - For HTTP entrypoints (Next.js routes, API handlers):
    - Generate a `requestId` at ingress, or read from `X-Request-ID` header if present.
    - Initialise `RequestContext` (e.g. via `AsyncLocalStorage`) with `{ requestId, env, service }`.
  - For background jobs (CRON, queues, workers):
    - Create a synthetic `requestId` when enqueuing or at job start.
    - Initialise `RequestContext` explicitly for each job execution.
  - For multi‑step operations (createShop, deployShop, upgradeShop):
    - Generate an `operationId`.
    - Attach `operationId` to `RequestContext` at the boundary of the operation.
  - Logger integration:
    - The shared logger should consult `RequestContext` by default so you do not need to pass `requestId`/`shopId` on every call, while still allowing explicit overrides in exceptional cases.

- Shop inference:
  - For single‑shop runtimes, `shopId` can be injected into `RequestContext` once at startup (from `NEXT_PUBLIC_SHOP_ID` / env) and reused for all requests.
  - CMS and platform‑core APIs should attach `shopId` based on the current shop in scope when handling multi‑tenant workflows.
  - This keeps logging low‑friction in the common case while retaining explicit `shopId` in multi‑tenant paths.

**Acceptance criteria**

- It is possible to correlate:
  - CMS action logs.
  - Platform‑core logs.
  - Runtime logs.
  for a given `requestId`/`operationId`.
- Request‑ and operation‑level context is initialised once at ingress/job start, then propagated automatically via the `RequestContext` helper.

---

### E1‑3 Console hygiene & test behaviour

**Work**

- Clarify in docs and linting:
  - `console.*` is not allowed in production paths except via the shared logger.
  - Tests may use `console.*` for debugging but should not spam CI logs.
- Optionally:
  - Add ESLint rules to flag unwrapped `console.*` calls in non‑test, non‑script files.
  - Allow direct `console.*` usage in `scripts/**` where CLI output is expected.
  - Continue to rely on the shared `jest.setup.ts` console patch to filter a small set of known‑noisy `console.error` / `console.warn` messages (JSDOM navigation warnings, expected env validation failures, etc.) while ensuring unexpected `error` logs for genuine failures remain visible in CI.

**Current state**

- There is no repo‑wide ban on `console.*`; the base ESLint config applies `"no-console": ["warn", { allow: ["error", "warn"] }]` only in certain UI paths, not across all server code.
- Many operational code paths (for example in `packages/email`, `packages/stripe`, `packages/telemetry`, and `apps/cms/instrumentation.ts`) still log directly via `console.error` / `console.warn`.
- `jest.setup.ts` currently patches `console.error` and `console.warn` in tests to drop a small set of known‑noisy messages while allowing other logs through; it does not globally silence `info` / `debug` logs.

**Acceptance criteria**

- Operational logs are predictable and consistent; console noise is minimised.

**Validation**

- E1‑V: Spot‑check logs from:
  - A CMS action (e.g. `createShopFromConfig`).
  - A deploy/upgrade flow.
  - A runtime request (cart/checkout).
  Confirm they:
  - Use the shared logger.
  - Include `shopId`, `env`, and `requestId` (and `operationId` for multi‑step flows).

---

## E2 — Metrics & CMS health badges

**Goal**

Introduce a minimal metrics model and surface shop health states in CMS (per shop today; per shop/env in a later phase). Internally the health helper uses `healthy` / `degraded` / `broken` as status codes; CMS surfaces these as “Healthy”, “Needs attention”, and “Blocked”.

This is the implementation of the “Operational observability” section in `docs/cms-research.md`.

### E2‑1 Core metrics

**Current state**

- There is no shared system metrics backend for shop lifecycle, CMS editing, commerce flows, or upgrades/deployments.
- `packages/telemetry` provides a small client‑side `track(name, payload)` helper that batches anonymised telemetry events to `/api/telemetry`, and CMS/marketing UIs compute engagement metrics from analytics events, but these are not yet wired into a per‑shop/per‑env operational metrics model.

**Current implementation**

- `packages/platform-core/src/utils/metrics.ts` provides `recordMetric(name, labels, value?)`:
  - Emits structured log events of the form `{ metric, env, shopId?, service?, status?, value? }` via the shared logger.
- Metrics currently wired:
  - `cms_shop_create_total{shopId,env,status}` in `createShop` (create without deploy → `skipped`; successful deploy → `success`).
  - `cms_page_publish_total{shopId,env,status}` for:
    - Blog publish/unpublish services.
    - CMS page create/update flows (publishing new pages or promoting drafts to published).
  - `cms_settings_save_total{shopId,env,status}` for settings/SEO save flows.
  - `cart_checkout_requests_total{shopId,env,status}` for checkout session creation.
  - `upgrade_republish_total{shopId,env,status}` in the CMS republish API (`apps/cms/src/app/api/shop/[shop]/republish/route.ts`), with:
    - `status: "success"` when post‑deploy verification reports `status === "passed"`.
    - `status: "failure"` when verification fails or errors.

**Work**

- Define a small set of counters/histograms, labelled only with:
  - `shopId`
  - `env`
  - `service` (optional)
  - `status` (with a small, fixed vocabulary).

- Suggested metrics:
  - **Shop lifecycle**
    - `cms_shop_create_total{shopId,env,status}`
  - **CMS editing**
    - `cms_page_publish_total{shopId,env,status}`
    - `cms_settings_save_total{shopId,env,status}`
  - **Commerce flows**
    - `cart_checkout_requests_total{shopId,env,status}`
  - **Upgrades/deployments**
    - `upgrade_republish_total{shopId,env,status}`

- Standardise status values for these metrics, for example:
  - `"success"`
  - `"failure"`
  - `"skipped"`
  - `"invalid-config"`
  (Implementations may add new values sparingly and only via shared constants.)

- Start with a simple implementation:
  - v1 may:
    - Emit metrics as structured log events (for example `{"metric":"cms_shop_create_total", ...}`) via the shared logger.
    - Optionally expose a simple `/metrics` JSON endpoint in dev/stage that aggregates them in‑memory for inspection.
  - Integration with a production metrics backend (Prometheus, etc.) is a follow‑up and **must not** block initial implementation.

**Acceptance criteria**

- Key flows have counters that can be inspected per shop/env.
- Metric cardinality remains bounded (no userId/pageId/etc. in labels).

---

### E2‑2 Health derivation rules

**Current state**

- `apps/cms/src/app/lib/shopHealth.ts` defines:

  ```ts
  export type ShopHealthStatus = "healthy" | "degraded" | "broken";

  export interface ShopHealthSummary {
    status: ShopHealthStatus;
    issues: Array<{ stepId: ConfiguratorStepId; reason: string }>;
  }
  ```

- Health is derived purely from Configurator progress (Thread A):
  - Required steps with `status === "error"` or an associated error string mark the shop as `broken`.
  - Required steps that are present but not `complete` mark the shop as `degraded`.
  - Optional steps can contribute issues and cause `degraded` but never `broken`.
  - When no progress is available, the shop is treated as `degraded` with an empty `issues` array.
- This helper is used in:
  - `apps/cms/src/app/cms/configurator/hooks/useConfiguratorDashboardState.ts` and `apps/cms/src/app/cms/configurator/hooks/dashboard/heroData.ts` to drive the dashboard “Shop health” quick stat.
  - `apps/cms/src/app/cms/shop/[shop]/page.tsx` to display the “Shop health” stat on the per‑shop dashboard (“Healthy”, “Needs attention”, “Blocked”).
- The current implementation does **not** look at `deploy.json`, `upgrade.json`, smoke tests, or runtime logs, and it has no explicit per‑environment dimension.

**Current implementation**

- `packages/platform-core/src/shops/health.ts` implements `deriveOperationalHealth(shopId, env?)`:
  - Reads deploy artefacts (`deploy.json`) via `readDeployInfo`.
  - Reads per‑shop error counters from `health.json` (recent error count + last error timestamp, decayed over a 24h window).
  - Reads upgrade history from `history.json` (last upgrade status / timestamp).
  - Returns:
    - `status: "healthy" | "needs-attention" | "broken"`.
    - `reasons`: a list of signals such as `deploy-missing`, `deploy-error`, `tests-failed`, `tests-not-run`, `recent-errors`, `upgrade-failed`.
    - `deploy`: the last deploy info, including `testsStatus` and `lastTestedAt`.
    - `errorCount` / `lastErrorAt` and `upgradeStatus` / `lastUpgradeTimestamp`.
  - Status resolution:
    - Any `deploy-error` or `tests-failed` → `broken`.
    - Else, any reasons (including upgrade failure or recent errors) → `needs-attention`.
    - Else → `healthy`.


**Work**

- Extend the health model to incorporate operational signals from Threads C and D in addition to configurator status, and define a per‑shop, per‑env health state derived from:
  - `deploy.json` (last deploy status, timestamp, deployId/logsUrl).
  - `upgrade.json` / `history.json` (upgrade status and recency).
  - Smoke test recency and results (from Thread D).
  - Recent error logs (e.g. number of `error` level events in last N minutes).
  - (Thread C produces deploy/upgrade artefacts; Thread D produces smoke test results; metrics from E2‑1 provide additional context.)

- Define health derivation precedence so conflicting signals resolve predictably. For example, for a given `{shopId, env}`:
  1. If the last deploy has `status: "failed"` → `broken`.
  2. Else if the last upgrade is `failed`, or is `pending` for more than **X** hours → `needs attention` or `broken` (depending on severity).
  3. Else if the last smoke test run failed, or is older than **N** hours → `needs attention`.
  4. Else if error rate above threshold in the last **M** minutes → `needs attention`.
  5. Else → `healthy`.

- Provide initial defaults (configurable per environment, but not per shop):
  - Smoke tests considered “stale” after **N = 24h**.
  - Critical error threshold expressed as “> X errors/hour” for key flows in a given env.
  - These values should live in a shared configuration module (e.g. `platform-core`), not scattered across apps.

- v1 error counting:
  - Where a full log backend is not yet available, approximate error counts by:
    - Maintaining a small, per‑shop rolling counter stored under something like `data/shops/<id>/health.json`.
    - Updating this counter when emitting `error`‑level logs in critical paths (deploy/upgrade, smoke tests, runtime entrypoints).
  - This keeps the health derivation implementable with the existing filesystem‑based infrastructure.

**Acceptance criteria**

- Configurator‑based health:
  - `deriveShopHealth` is the single source of truth for configuration health thresholds (required vs optional steps, error vs incomplete states) and is covered by tests.
- Operational health (when implemented):
  - Given a set of JSON artefacts and recent error counters, a deterministic helper can assign a health state following the precedence rules above.
  - Thresholds and timing windows are defined once (and tested) rather than being implicit in multiple callers.

---

### E2‑3 CMS presentation

**Work**

- Implement a richer health panel in CMS as operational signals become available:
  - Shop overview:
    - For each shop, show a matrix `[env] x [status]`.
  - Shop detail:
    - Show:
      - Last deploy info (version, URL, timestamp, status, deployId, logsUrl).
      - Last upgrade info (from/to, status, timestamps).
      - Timestamp of last successful smoke tests.
      - Summary of recent errors.
    - Provide quick links:
      - View `deploy.json`, `upgrade.json`, `history.json`.
      - View logs in external system (if integrated) via logsUrl or similar.

- Add an “Operator view”:
  - A list of shops filtered by `needs attention` / `broken`.
  - CTA buttons:
    - “Redeploy”
    - “Retry upgrade”
    - “Repair config”

**Current state**

- CMS already surfaces configuration‑based shop health:
  - The configurator dashboard hero (`apps/cms/src/app/cms/configurator/hooks/dashboard/heroData.ts`) includes a “Shop health” quick stat powered by `deriveShopHealth`.
  - The per‑shop dashboard page (`apps/cms/src/app/cms/shop/[shop]/page.tsx`) fetches configurator progress via `/api/configurator-progress?shopId=…`, calls `deriveShopHealth`, and shows the resulting status in a “Shop health” stat card (“Healthy”, “Needs attention”, “Blocked”).
- These views currently show a single health state per shop (no per‑environment matrix) and do not surface deploy/upgrade/smoke‑test details; operators can still navigate to live previews and maintenance scans, but there is no dedicated operator list filtered by health state.

**Acceptance criteria**

- Operators can quickly identify:
  - Healthy shops.
  - Shops needing attention.
  - Broken shops and their likely causes.
- The CMS health UI uses shared health derivation helpers rather than re‑implementing logic:
  - For configuration health, use `deriveShopHealth` from `apps/cms/src/app/lib/shopHealth.ts`.
  - For operational health (once implemented), call a shared helper (likely in `platform-core`) that encapsulates the deploy/upgrade/smoke/log thresholds.
- The health panel reads deploy/upgrade artefacts via the platform‑core filesystem repositories introduced in Thread C (rather than ad‑hoc `fs` access from CMS) once those artefacts are exposed there.

**Validation**

- E2‑V: For a small set of test shops, manipulate:
  - `deploy.json`
  - `upgrade.json` / `history.json`
  - Simulated error logs
  and confirm the CMS health panel reflects expected states per the thresholds.

---

## Completion criteria for Thread E

Thread E is complete when:

1. Shared logging with `requestId`/`operationId` is in use across CMS, platform‑core, and runtimes.
2. Core metrics exist for shop creation, CMS editing, commerce flows, and upgrades/deployments, labelled by `shopId` and `env`.
3. CMS surfaces per‑shop, per‑env health states derived from artefacts and logs, with an operator view for remediation.
4. Health derivation logic for shops/environments flows through shared, tested helpers:
   - Configuration health uses `deriveShopHealth` in `apps/cms/src/app/lib/shopHealth.ts` as the only source for CMS status badges.
   - Operational health, once implemented, is exposed via a shared helper (likely in `platform-core`) and consumed by CMS without re‑implementing thresholds.
- Configurator and operational health are exposed in CMS as:
  - A high‑level “Shop health” card (configurator).
  - A “Runtime health” card showing operational status and smoke test state.
  - A “Health details” panel that surfaces deploy status, upgrade state, smoke test status, recent error counts, and contributing reasons for operators.
