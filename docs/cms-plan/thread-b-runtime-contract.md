Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread B — Template Runtime & Tenant Convergence (Fast Launch)

This thread implements **Thread B** from `master-thread.fast-launch.md`:

- Document the runtime contract for `packages/template-app`.
- Define and formalise the notion of a **platform‑compatible app**.
- Migrate at least one tenant app to comply with this contract behind safe feature flags.

Cross‑cutting rules in `master-thread.fast-launch.md` apply, especially:

- **CC‑3 Platform‑compatible apps** — defines the behaviours that must be present for prefab blocks and smoke tests to be guaranteed.
- **CC‑4 System‑only commerce blocks** — `CartSection`, `CheckoutSection`, etc. are system blocks, restricted to system routes/slots.

---

## B1 — Template runtime contract

**Goal**

Make the runtime contract explicit so both CMS and tenant apps can rely on it and the template app remains the canonical reference.

### B1‑1 Contract audit

**Work**

Inspect `packages/template-app` and related packages to identify:

- **Environment configuration**
  - Required `process.env` variables:
    - Shop selection (for example `NEXT_PUBLIC_SHOP_ID`, `NEXT_PUBLIC_DEFAULT_SHOP`, `SHOP_CODE`).
    - CMS base URL / API endpoints.
    - Stripe, shipping/tax, email keys (using `@acme/config/env/*`).
  - How runtime distinguishes `dev`/`stage`/`prod`.

- **API routes**
  - For each required route, record the HTTP contract:
    - Allowed HTTP methods.
    - Request body schema (Zod).
    - Response shape and status codes, including error responses/error codes.
  - Cart API:
    - Re‑export of `@acme/platform-core/cartApi` at `/api/cart` (HTTP interface, methods, payloads).
  - Checkout session endpoint:
    - `/api/checkout-session` using shared helpers from `@acme/platform-core/checkout/session` and related pricing utilities.
  - Return/refund endpoint for rentals:
    - `/api/return` wired to `rentalOrders` and pricing (for example via `@acme/platform-core/repositories/rentalOrders.server` and `@acme/platform-core/pricing`).
  - Preview route(s):
    - URL shape (for example `/preview/[pageId]` and Cloudflare Worker route `/preview/:pageId`).
    - Auth model (HMAC token, header names, expiry) using `@acme/platform-core/previewTokens`.
  - Health endpoint:
    - If we choose to make a health endpoint part of the contract, define its URL and expected response (for automated health checks). This does **not** exist yet in the runtime apps.

- **Data dependencies**
  - Repositories used:
    - `@acme/platform-core` for `Shop`, `ShopSettings`, pages, products.
  - Use of `data/shops/<id>` (only via platform‑core, not direct `fs`).

- **Page Builder integration**
  - Route patterns that render PB pages and core commerce surfaces:
    - Today: PB pages are rendered in runtime via `/preview/[pageId]` + `PreviewClient` + `DynamicRenderer`.
    - Future (aspirational): routes like `/[lang]/pages/[slug]` for PB marketing/legal pages; core commerce surfaces (for example `/[lang]/shop`, `/[lang]/product/[slug]`) are currently hand‑coded templates, not PB‑driven.
  - How the runtime resolves `lang` against `ShopSettings.languages` and passes locale into PB and `TranslationsProvider` (or similar).
  - How PB documents (`Page`, `PageType`) map to runtime components (block registry).

- **System routes & system‑only blocks**
  - Document how system routes (checkout, account, etc.) are implemented today (hand‑coded templates in the template app) and where PB slots, if any, are used.
  - Define the intended rules for “system‑only” blocks (for example `CartSection`, `CheckoutSection`, etc.) so that they are **treated as system blocks** and only used in those contexts, even though the current block registry and section library can surface them more broadly.

- **Theme & design system**
  - How theme tokens (`themeTokens`, tailwind preset, CSS vars) are read and applied.
  - Assumptions about which tokens must exist for the template app to render correctly.

**Acceptance criteria**

- A complete list of:
  - Required env vars.
  - Required routes and their contracts.
  - Data expectations from platform‑core.
  - PB and system route patterns, locale resolution rules, and theme integration rules.
  - System‑only block placement rules.

---

### B1‑2 Contract documentation

**Work**

Produce `docs/runtime/template-contract.md` that:

- Defines the contract for:
  - Env configuration.
  - Required API routes and their request/response shapes.
  - Preview contract:
    - Preview URL, auth HMAC, and how CMS calls it.
  - PB routes and how PB pages from CMS map into runtime (distinguishing existing preview routes from future marketing/legal PB routes).
  - Theme token usage and expected minimal token set.

- Describes a small machine‑readable `runtimeContractManifest` (JSON or TS object) that, per app, encodes:
  - Whether the app is platform‑compatible.
  - Which capabilities (cart, checkout, returns, preview, PB routes, system‑only blocks, etc.) it implements.

- Contains a **platform‑compatible app checklist**, for example:

  - Re‑export `@acme/platform-core/cartApi` at `/api/cart`.
  - Implement `/api/checkout-session` using shared helpers.
  - Use platform‑core repositories for `Shop`/`ShopSettings`/pages/products.
  - Implement preview route contract.
  - Render PB pages via the shared block registry.
  - Respect system‑only blocks (`CartSection`, `CheckoutSection`) and their routing constraints (aspirational for v1):
    - Do not render them on generic marketing/legal routes.
    - Render them only inside designated slots on system routes (for example `/[lang]/checkout`).
    - Ensure PB palettes for this app expose system‑only blocks only on those system routes/slots.

- Treat the contracts in this document as **platform‑level public APIs**:
  - Breaking changes require a new versioned entrypoint or a major version bump in `@acme/platform-core` / `@acme/ui`.

**Acceptance criteria**

- Document is self‑contained and can be used as:
  - A reference when building/upgrading tenant apps.
  - A source for automated “contract linting”.
  - A reference for generating/validating the per‑app `runtimeContractManifest`.

**Validation**

- B1‑V1: Run through the checklist for `packages/template-app` and ensure it satisfies all items.
- B1‑V2: Ensure there is a small test or script that reads the `runtimeContractManifest` for the template app, asserts presence of key routes/exports and capabilities, and is referenced from CI (currently `packages/template-app/__tests__/runtimeContractManifest.test.ts`; required before marking apps as platform‑compatible).

---

## B2 — Tenant convergence on template contract

**Goal**

Bring at least one tenant app into full compliance with the template contract, behind safe feature flags, to prove the pattern.

### B2‑1 Target selection

**Work**

- Choose a pilot tenant app, for example:
  - `apps/cover-me-pretty`, or
  - a new “reference shop” app if that is safer.
- Confirm stakeholders are aligned that this app will become the first platform‑compatible tenant.

**Acceptance criteria**

- A single pilot app is identified and documented in `template-contract.md` under a “Platform‑compatible apps” section as the initial convergence target.
  - Initially, this means adding it as a **pilot convergence target** (for example `apps/cover-me-pretty`) rather than marking it fully platform‑compatible; its `runtimeContractManifest` should track current capabilities vs the template contract.

---

### B2‑2 Refactor to contract (behind flags)

**Work**

For the pilot app:

- **Cart & checkout**
  - Re‑export `@acme/platform-core/cartApi` at `/api/cart`.
  - Ensure `/api/checkout-session` uses shared checkout helpers from platform‑core (no inline Stripe logic).
  - Do not implement any cart/checkout HTTP logic that bypasses `@acme/platform-core` contracts.

- **Returns**
  - Wire return/refund endpoints to platform‑core `rentalOrders` and pricing helpers, mirroring template app behaviour.
  - Do not introduce additional return HTTP routes that bypass or fork platform‑core logic.

- **Core data**
  - Replace any direct DB/JSON access with calls to platform‑core repositories for:
    - `Shop`, `ShopSettings`, pages, and products.

- **PB integration**
  - Ensure PB page routes follow the contract documented in B1‑2.
  - For apps that adopt PB marketing/legal pages, implement `/[lang]/pages/[slug]` (or equivalent) using the same resolver helpers and block registry as the template app’s PB preview flow, so PB pages behave consistently.

- **Feature flags / environment gating**
  - (Optional) Introduce flags (env or config) allowing:
    - Legacy and template‑compatible modes to run side‑by‑side in staging where a tenant app needs both.
    - Safe toggling between modes for testing and rollback.
  - If we standardise a runtime mode flag (for example `runtimeMode: 'legacy' | 'template'` in `ShopSettings`, or `SHOP_RUNTIME_MODE=legacy|template`), document it here; this is not yet implemented in code.

**Acceptance criteria**

- Pilot app can run in:
  - Current (legacy) mode.
  - Template‑compatible mode (all contracts satisfied), where applicable.
- Where dual modes are required, mode selection is controlled via configuration/flags, not code edits.

---

### B2‑3 Remove special cases

**Work**

- Identify app‑specific forks of:
  - Cart routes.
  - Checkout routes.
  - Return logic.
  - Ad hoc product/shop lookups outside platform‑core.
- For each:
  - Replace with calls into shared platform‑core APIs and config‑driven behaviour (flags, settings, theme).
  - Ensure differences in behaviour (if truly needed) are expressed via configuration, not forks.

**Acceptance criteria**

- There are no remaining “shadow” implementations of core flows in the pilot app.
- Differences in behaviour vs template app are explainable via:
  - Shop configuration.
  - Theme configuration.
  - Explicit, documented feature flags.
  - Legacy/forked apps (for example `apps/skylar`) are explicitly not required to converge in Thread B; their support remains best‑effort until a separate convergence plan is defined.

**Validation**

- B2‑V1: Run Thread D’s smoke tests against:
  - Legacy mode of the pilot app in staging.
  - Template‑compatible mode in staging.
  Both runs must pass before considering flipping production to template mode.
- B2‑V2: Once stable, mark the pilot app as “platform‑compatible” in `template-contract.md` (under “Platform‑compatible apps”) and add a CI job that, for every app marked as platform‑compatible, runs the contract tests plus Thread D’s smoke suite and fails on regressions.

---

## Completion criteria for Thread B

Thread B is complete when:

1. `docs/runtime/template-contract.md` exists and fully describes env, route, PB, and theme contracts, including the platform‑compatible app checklist, and there is a small machine‑readable manifest (or equivalent) used by CI to assert the template app’s compliance.
2. `packages/template-app` passes the contract checklist and the contract tests for `/api/cart`, `/api/checkout-session`, preview, PB routes, and system‑only blocks.
3. At least one tenant app can run in both legacy and template modes, with smoke tests (Thread D) passing in template mode in staging.
4. In that pilot app, there are no remaining cart/checkout/return implementations outside `@acme/platform-core` routes; any behavioural differences vs template are driven by configuration/flags, not forks.
