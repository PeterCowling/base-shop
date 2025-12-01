# Thread F – Developer ergonomics & testing

This thread operationalises §6 of `docs/cms-research.md`.

It focuses on:

- Layering between `platform-core`, `ui`, `cms-marketing`, and apps.
- Public vs internal surfaces for shared packages.
- Page Builder extraction (in concert with Thread B).
- Testing of critical flows (create, edit, publish, checkout).

---

## Context (from research)

- Layering contracts:
  - `@acme/platform-core` owns domain logic and persistence; it must not depend on `@acme/ui` or apps.
  - `@acme/ui` owns design system and CMS/editor UI; it may depend on platform-core types/helpers, but not on persistence or apps.
  - `packages/cms-marketing` (and similar CMS-only packages) sit above platform-core/ui and below CMS app, owning CMS workflows and dashboards.
  - Apps (template, tenant) are thin shells that compose these layers; they must not expose new domain logic.
- Public surface vs internal details:
  - Shared packages should have small, documented public surfaces and treat deep imports (`src/**`) as internal.
  - Apps must not import from internal paths.
- Page Builder extraction:
  - Core PB logic should move into `page-builder-core`/`page-builder-ui`/`templates` (Thread B).
- Testing:
  - Critical flows (create shop, edit, publish, checkout) should have good coverage via unit, integration, and appropriate E2E tests.

---

## Decisions / direction (to keep aligned)

- Enforce layering via import rules and package-level docs.
- Make public surfaces explicit (`src/index.ts` or `src/public/**`) and keep internal details hidden.
- Centralise PB logic in dedicated packages (Thread B) and keep CMS/app code thin.
- Prioritise tests around core flows and contracts over broad “test everything” approaches.

---

## Tasks

- [x] **DX-01 – Codify layering rules and public surfaces**
  - Scope:
    - Turn layering and public-surface expectations into explicit docs and conventions.
  - Implementation:
    - Extend `docs/architecture.md` or add `docs/layering-and-apis.md`:
      - Describe allowed dependency directions between packages.
      - Define where public APIs live (e.g. `src/index.ts`, `src/public/**`).
    - Update package READMEs (`platform-core`, `ui`, `cms-marketing`, PB packages) to link to this guidance.
  - Definition of done:
    - Layering rules are documented in one canonical place and referenced from key packages.
  - Dependencies:
    - ARCH-01 (platform vs tenant API surface doc).

- [x] **DX-02 – Add lint rules for import boundaries**
  - Scope:
    - Enforce layering and public-surface rules via tooling.
  - Implementation:
    - In ESLint config (or a dedicated plugin if already present):
      - Add rules that prevent:
        - Apps importing from `@acme/platform-core/src/**` or `@acme/ui/src/**`.
        - Lower layers importing from higher ones (e.g. `platform-core` → `ui` or apps).
      - Use `eslint-plugin-import` or the repo’s custom plugin where appropriate.
  - Definition of done:
    - Lint fails if code violates layering or deep-import rules.
  - Dependencies:
    - DX-01 (documented rules to encode).

- [x] **DX-03 – Clean up existing deep imports**
  - Scope:
    - Fix current violations of the layering/public-surface rules.
  - Implementation:
    - Use `rg` or TypeScript tooling to find imports from internal paths:
      - `@acme/ui/src/**`, `@acme/platform-core/src/**`, other undocumented subpaths.
    - For each:
      - Either replace with a documented public export, or
      - Add a new public export to the appropriate package and then update the import.
  - Definition of done:
    - No remaining deep imports from shared packages in apps/CMS.
  - Dependencies:
    - DX-01/DX-02 so fixes align with the intended rules.

- [x] **DX-04 – Consolidate Page Builder dev experience (with Thread B)**
  - Scope:
    - Improve the developer experience around PB by centralising docs and examples.
  - Implementation:
    - In `page-builder-*` packages:
      - Add minimal “how to add a block/template” guides.
      - Provide one or two small example blocks/templates wired end-to-end (CMS → runtime).
    - Ensure examples reference only public surfaces.
  - Definition of done:
    - Developers adding new PB blocks/templates can follow a short guide without digging through CMS/app code.
  - Dependencies:
    - PB-01–PB-04 (PB extraction work).

- [x] **DX-05 – Hardening tests for critical flows**
  - Scope:
    - Ensure that create/edit/publish/checkout flows are covered by focused tests.
  - Implementation:
    - Identify existing tests (unit/integration/E2E) that exercise:
      - Shop creation and configuration.
      - Page editing and publishing.
      - Cart/checkout flows.
    - Current coverage:
      - Shop creation and configuration:
        - Domain and scripts: `packages/platform-core/__tests__/createShop.unit.test.ts`, `packages/platform-core/src/createShop/__tests__/createShop.test.ts`, `test/unit/__tests__/create-shop-cli.spec.ts`, `test/unit/__tests__/seedShop.spec.ts`.
        - End-to-end configurator flow: `test/e2e/__tests__/configurator.spec.ts`.
      - Page editing and publishing:
        - Domain and repositories: `packages/platform-core/__tests__/pagesRepoMock.test.ts`, `packages/platform-core/__tests__/pagesRepoFallback.test.ts`.
        - CMS actions and API: `test/unit/__tests__/publish-action.spec.ts`, `test/integration/__tests__/publish-api.spec.ts`.
        - End-to-end CMS flows: `test/e2e/__tests__/page-builder.spec.ts`, `test/e2e/__tests__/blog-post-workflow.spec.ts`.
      - Cart/checkout flows:
        - Domain and API handlers: `packages/platform-core/__tests__/cartApi.*.test.ts`, `packages/platform-core/__tests__/checkout-totals.test.ts`.
        - End-to-end checkout and rental flows: `test/e2e/__tests__/checkout-flow.spec.ts`, `test/e2e/__tests__/rental-return-flow.spec.ts`.
  - Definition of done:
    - There is at least one reliable test path for each core flow; regressions in those flows are likely to be caught.
  - Dependencies:
    - Threads A–E, as they introduce/modify flows.

- [x] **DX-06 – Trim and clarify internal-only helpers**
  - Scope:
    - Reduce accidental coupling by clearly marking internal helpers/modules.
  - Implementation:
    - In shared packages:
      - Move internal-only modules under `src/internal/**` (or similar).
      - Ensure they are not exported from package entrypoints.
      - Update any accidental external imports to use public APIs instead.
  - Definition of done:
    - Internal helpers are clearly separated and unimportable from apps without opt-in rule breaks.
  - Dependencies:
    - DX-01/DX-02.

---

## Dependencies & validation

- Depends on:
  - ARCH-01 for public API surface definition.
  - Thread B for PB extraction work.
- Validation:
  - ESLint rules enforce layering; no remaining deep imports.
  - PB docs/examples align with the implemented package structure.
  - Critical flows have at least one robust test path that runs in CI.
