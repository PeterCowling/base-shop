Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread D — Quality Gates & Tests (Fast Launch)

This thread implements **Thread D** from `master-thread.fast-launch.md`:

- Define a standard, shop‑parametrised smoke test suite.
- Gate Launch/Deploy on these tests.
- Provide sample shops and seeding to make tests easy to run locally.

Cross‑cutting rules apply, in particular:

- **CC‑3 Platform‑compatible apps** — smoke tests are only guaranteed on platform‑compatible apps.
- **CC‑4 System‑only commerce blocks** — PB tests must respect system block placement rules.
- **CC‑5 Rental scope for v1** — smoke tests focus on rental flows (`RentalOrder`).

---

## D1 — Standard shop smoke tests

**Goal**

Provide a single, reusable, non‑destructive test suite that validates core commerce and PB flows for any given shop/env pair.

### D1‑1 Test coverage

**Work**

- Implement a test module (for example under `__tests__/shops/smoke.test.ts`) that uses environment variables or CLI args:
  - `SHOP_ID`
  - `SHOP_ENV` (an env string that is wired up to a shared `Environment` union you add to the codebase, e.g. `type Environment = 'dev' | 'stage' | 'prod'`, reused across Threads A/B/C; CI will mostly run on non‑prod)

- Keep this suite distinct from existing CMS and Storybook smoke tests (`pnpm e2e:smoke`, Storybook Playwright smoke runs); it is specifically for exercising the shop runtime.

- Resolve the runtime base URL via a shared helper, reusing Thread C’s deploy metadata (for example `deploy.json`):

  ```ts
  getShopBaseUrl({ shopId, env }: { shopId: string; env: Environment }): URL
  ```

  This keeps host resolution (including the shop’s configured runtime host) in one place rather than hard‑coding hostnames in tests.

- For apps that are known to be platform‑compatible (for example the template app), use the per‑app `runtimeContractManifest` (for example `runtimeContractManifest` exported from `@acme/template-app`) as the source of truth for which runtime capabilities and HTTP contracts the smoke tests should assert, rather than duplicating route lists in test code.

- Test core flows:
  - **Cart API**
    - Add item, update quantity, remove item.
    - Assert HTTP 2xx and consistent JSON responses.
  - **Checkout session API**
    - Create a checkout session using a known product fixture.
    - Assert that:
      - Stripe checkout session creation is attempted.
      - Config‑dependent behaviour (rental duration, deposits) behaves as expected.
    - Use test doubles for Stripe (MSW or similar); never hit live Stripe.
  - **Return/refund API (rental shops)**
    - For a rental shop, simulate a rental completion and return flow.
    - Assert rental order is updated and refund logic is triggered.
  - **Core pages**
    - `GET /` (home)
    - `GET` for at least one PLP (collection/Shop grid).
    - `GET` for at least one PDP.
    - `GET` for checkout shell page.
    - Assert HTTP 2xx and basic invariants (title present, key elements).
  - **PB page route**
    - Hit at least one PB‑driven route (`/[lang]/pages/[slug]` for a known CMS page).
    - Assert HTTP 2xx and presence of a known block marker (e.g. a `data-component-id` attribute).

- Standardise sample fixtures per shop so tests don’t need per‑shop IDs:
  - Ensure every testable shop exposes:
    - A product with a stable SKU/handle (for example `smoke-product`).
    - A PB page with a stable slug (for example `smoke-page`).
  - Smoke tests look up these fixtures by convention, not by hard‑coded IDs.

- Ensure all external providers (Stripe, shipping, tax, email) are mocked/stubbed:
  - Use MSW or custom stubs.
  - Ensure tests remain fast, deterministic, and safe in all envs.

- Make the suite non‑destructive and idempotent, especially when pointed at prod:
  - Do not perform irreversible actions against live prod systems (no real refunds, emails, etc.).
  - Treat prod runs as read‑mostly with mocked integrations and repeatable fixtures so the suite can be safely re‑run.

**Acceptance criteria**

- Tests can be run against any platform‑compatible shop by setting `SHOP_ID` and `SHOP_ENV`.
- No test issues live external calls.

---

### D1‑2 Shop parametrisation & script

**Work**

- Create a wrapper script:

  ```bash
  pnpm test:shop-smoke --shop <id> --env <env>
  ```
  in the root `package.json` that delegates to the appropriate runtime app’s Jest runner (for example `pnpm --filter @apps/cover-me-pretty test -- --testPathPattern shops/smoke.test.ts`), and which:

  - Sets `SHOP_ID=<id>` and `SHOP_ENV=<env>`.
  - Invokes Jest with `--testPathPattern` pointing to the smoke tests.
  - Uses the shared `Environment` type you introduced (`'dev' | 'stage' | 'prod'`) for `--env`.
  - Fails fast with a clear, non‑zero exit if it cannot determine a valid, platform‑compatible runtime for the given `{shop, env}` pair (for example “shop/app is not platform‑compatible, smoke tests unsupported”).

- Allow the tests to derive:
  - Base URLs from the shared `getShopBaseUrl({ shopId, env })` helper (for example, staging host vs dev host).
  - Sample products/pages from the standardised fixtures for `<id>` (for example `smoke-product`, `smoke-page`).

**Acceptance criteria**

- Running `pnpm test:shop-smoke --shop sample-rental --env stage` executes the smoke suite against that shop.
- When run for a non‑platform‑compatible shop or unresolved runtime, the script exits early with a clear message and does not attempt tests.

**Validation**

- D1‑V: Run the suite against a sample rental shop in `stage` and confirm:
  - All core flows (cart, checkout, return, PB page) pass.

---

## D2 — Launch/Deploy gating in CMS

**Goal**

Make Launch/Deploy in CMS conditional on smoke tests passing for the target shop/env.

### D2‑1 Integrate with deploy flow

**Work**

- Introduce a shared post‑deploy verification helper in the CMS/server layer (for example `apps/cms/src/actions/verifyShopAfterDeploy.server.ts`) that shells out to the smoke suite:

  ```ts
  async function verifyShopAfterDeploy(
    shopId: string,
    env: Environment
  ): Promise<VerificationResult> {
    // run `pnpm test:shop-smoke --shop <shopId> --env <env>`,
    // collect pass/fail + summary (and optionally a link to logs)
  }
  ```

- Extend the existing deployment artefact and actions rather than inventing new ones:
  - Extend `DeployShopResult` in `@acme/platform-core/createShop` (and `CloudflareDeploymentAdapter.writeDeployInfo`) to include test metadata, for example:
    - `testsStatus: 'not-run' | 'passed' | 'failed'`
    - `testsError?: string`
    - `lastTestedAt?: string`
    - `env?: Environment`
  - Keep writing `data/shops/<id>/deploy.json` via the adapter so existing consumers (`deployShopHosting`, `getDeployStatus`, `updateDeployStatus`) continue to work.

- Update the CMS deploy and launch flows to call `verifyShopAfterDeploy` after a successful build/deploy:
  - In `apps/cms/src/actions/deployShop.server.ts` / `/cms/api/configurator/deploy-shop`:
    - After `deployShopHosting` reports success, call `verifyShopAfterDeploy(shopId, env)` for the `{shopId, env}` pair.
    - Merge the verification result into `deploy.json` via `updateDeployStatus`, using the extended `DeployShopResult` fields.
  - In `/api/launch-shop` (Thread A configurator launch SSE route):
    - Treat a successful deploy as a prerequisite.
    - Call `verifyShopAfterDeploy(shopId, env)` as the final launch step.
    - Surface pass/fail via the SSE stream so the dashboard “Launch readiness” panel reflects test status.

  - For upgrade flows (Thread C, e.g. `scripts/src/upgrade-shop.ts` or future CMS upgrade actions), reuse `verifyShopAfterDeploy(shopId, env)` in the same way so deploy and upgrade share post‑deploy checks.

  - Determine result:
    - If tests pass:
      - Mark the deployment as `success` in `deploy.json`.
    - If tests fail:
      - Keep `status` aligned with `DeployShopResult` (e.g. set `status: 'error'`) and record `testsStatus: 'failed'` with a `testsError` field summarising test failures.
      - **Do not** automatically roll back the runtime:
        - Keep last known good deploy live.
        - Treat the new deploy as a failed attempt in CMS UI and `deploy.json`.

- Clarify semantics:
  - “Deploy” = build + deploy a shop runtime for a given env (via the existing `deployShop` / `deployShopHosting` path) and write/update `deploy.json`.
  - “Launch to prod” = a deploy for `env='prod'` plus successful smoke tests via `verifyShopAfterDeploy`, then mark as live in CMS (for example by updating launch/health indicators in the configurator dashboard).

**Acceptance criteria**

- Deploys that fail smoke tests are clearly marked as such, with the previous deploy still live.

---

### D2‑2 UI feedback

**Work**

- In CMS:
  - Show per‑env deploy status:
    - `success` with last tested timestamp and summary.
    - `failed` with the reason (link to logs/tests if available).
  - Surface:
    - A link/button to “View smoke test logs”.
    - A clear call to action (“Fix issues and redeploy”).
  - Display the last known good version per env so it’s obvious that a failed attempt didn’t replace the running build, for example:
    - “Last successful deploy: `<version>` at `<timestamp>`”.

**Acceptance criteria**

- Users can see at a glance whether the last deploy for each env has passed tests.
- Failed deploys are obvious and actionable.

**Validation**

- D2‑V: In staging, deliberately cause smoke tests to fail after a deploy and verify:
  - CMS marks the deploy as failed.
  - The previous live version remains in place.

---

## D3 — Sample shops & local seeding

**Goal**

Provide sample shops and seeding scripts that make smoke tests easy to run locally and in CI.

### D3‑1 Sample configs

**Work**

- Define a small set of sample shop configurations (JSON or TS fixtures), e.g.:
  - `sample-rental` — canonical rental flow with PB pages and standard blocks.
  - `sample-sale-experimental` — optional, for future sale/hybrid work.
- Each sample config should:
  - Include basic shop details, theme, and settings.
  - Seed products and pages needed for smoke tests (home, PLP, PDP, checkout shell, PB page).
  - Encode the standard smoke fixtures explicitly:
    - A product with SKU/handle `smoke-product`.
    - A PB page with slug `smoke-page`.
  - Start from the existing templates under `data/templates` (for example `data/templates/default`) so sample configs stay consistent with current seeding patterns.

**Acceptance criteria**

- Sample configs are versioned in this repo (for example under `data/templates/<sample-id>` or a dedicated `scripts/fixtures/shops` folder) and are referenced by both seeding scripts and tests.

---

### D3‑2 Seeding scripts

**Work**

- Extend existing seeding scripts (in particular `scripts/src/seedShop.ts` and `scripts/src/shop/createShopAndSeed.ts`, and, where helpful, `scripts/src/seed-test-data.ts`) to:
  - Accept a `--shop` / `--fixture` argument.
  - Use the shared config/schema from Thread A to:
    - Create `Shop` and `ShopSettings` records.
    - Populate `data/shops/<id>` with required JSON (via platform‑core repos).
  - Enforce the same Zod (or equivalent) validation used by the configurator in Thread A so fixtures cannot drift into invalid or unsynchronised states.
- Provide a CLI entry:

  ```bash
  pnpm seed:sample-shop --shop sample-rental
  ```

**Acceptance criteria**

- Running seed command sets up a complete, testable sample shop locally.

---

### D3‑3 DX documentation

**Work**

- Update `docs/development.md` (or create `thread-f-developer-ergonomics.md` if appropriate) with:
  - Steps to:
    - Seed a sample shop.
    - Start CMS + runtime apps.
    - Run smoke tests against the sample shop.
  - Troubleshooting tips for common failures (e.g. missing env vars, port conflicts).

**Acceptance criteria**

- New developers can follow docs to:
  - Seed, run, and smoke‑test a sample shop in under ~15–20 minutes.

**Validation**

- D3‑V: Ask a teammate unfamiliar with this thread to follow the docs:
  - Seed a sample shop.
  - Run `pnpm test:shop-smoke --shop sample-rental --env dev`.
  - Collect feedback and iterate if steps are unclear.

---

## Completion criteria for Thread D

Thread D is complete when:

1. A standard, non‑destructive smoke test suite exists and can be run for any platform‑compatible shop/env via `pnpm test:shop-smoke`, using:
   - Shared helpers to resolve the runtime base URL.
   - Standardised sample fixtures (`smoke-product`, `smoke-page`) discoverable by convention.
2. Launch/Deploy in CMS uses a shared post‑deploy verification helper that wraps `pnpm test:shop-smoke`, marking deploys as `success` only when tests pass, and as `failed` otherwise, without silently replacing the last known good runtime (which remains visible in the UI with version + timestamp).
3. Sample shop fixtures and seeding scripts:
   - Are validated with the same schemas as configurator output (Thread A).
   - Are documented well enough that a new developer can seed, run, and smoke‑test a sample shop locally in a single sitting.
