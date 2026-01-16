Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# Thread C — Create / Deploy / Upgrade Pipeline (Fast Launch)

This thread implements **Thread C** from `master-thread.fast-launch.md`. It starts from the **current implementation** in this repo and describes concrete changes to reach the desired Fast Launch behaviours.

- **Today (baseline)**:
  - CMS and CLI both call the `createShop` function implemented in `packages/platform-core/src/createShop/createShop.ts`:
    - CMS imports it via `@acme/platform-core/createShop` (`apps/cms/src/actions/createShop.server.ts`).
    - Scripts import it via `@acme/platform-core/createShop` (`scripts/src/create-shop.ts`, `scripts/src/shop/init.ts`).
  - Deploys are driven by `deployShop` in `@acme/platform-core/createShop`, which writes `deploy.json` using the existing `ShopDeploymentAdapter` (`CloudflareDeploymentAdapter`).
  - Template upgrades and rollback are implemented via `scripts/src/upgrade-shop.ts`, `scripts/src/republish-shop.ts`, and `scripts/src/rollback-shop.ts` operating on `shop.json`, `upgrade.json`, `upgrade-changes.json`, and `history.json`.
- **Target (Thread C)**:
  - Align CMS and CLI shop creation flows around a shared config contract and explicit creation state.
  - Extend CMS deploy to act as the primary control surface, backed by a richer deploy artefact and post‑deploy checks.
  - Standardise upgrade and rollback behaviours so JSON/DB and scripts/CMS share a single mental model for `upgrade.json` / `history.json` and `shop.json.componentVersions`.

Cross‑cutting rules in `master-thread.fast-launch.md` apply, especially:

- **CC‑1 Prisma vs `data/shops/*`** — Prisma `Shop` / `ShopSettings` are canonical, FS artefacts under `data/shops/<id>` are derived operational metadata written via platform‑core.
- **CC‑5 Rental scope for v1** — guarantees in this thread are scoped to rental orders; sale/hybrid flows are best‑effort.

---

## C1 — Harden `createShop` / `initShop` flows

**Goal**

Ensure shop creation from configuration is scriptable, idempotent in dev/stage, and consistent between CMS and CLI.

### C1‑1 CLI alignment (current → target)

**Work**

- Align on a single **config contract** for creation:
  - Define a `ShopConfig` DTO that matches Thread A’s Configurator output.
  - Implement a pure mapping `ShopConfig → CreateShopOptions` in `@acme/platform-core/createShop` (or a nearby module) and use it in both CLI and CMS.
- Introduce an explicit shared wrapper for config‑driven creation:

  ```ts
  // packages/platform-core/src/createShop/index.ts (or nearby)
  export async function createShopFromConfig(
    id: string,
    config: ShopConfig,
    options?: { deploy?: boolean }
  ) {
    const opts = mapConfigToCreateShopOptions(config);
    return createShop(id, opts, options);
  }
  ```

  - This wrapper delegates all DB + FS writes to the existing `createShop` implementation.
  - It becomes the single entrypoint for **config‑driven** creation from both CMS and CLI.
- Wire callers to the wrapper:
  - Update `createNewShop` in `apps/cms/src/actions/createShop.server.ts` to call `createShopFromConfig` (after validating/normalising the configurator payload).
  - Update `scripts/src/initShop.ts` and `scripts/src/createShop/write.ts` to call `createShopFromConfig` for config‑driven flows (while keeping the current prompt/flag UX).
- Make runtime app selection explicit as a follow‑up:
  - Today, scripts implicitly assume the template app (`packages/template-app`) and per‑shop apps under `apps/<shopId>`.
  - As we introduce additional runtime apps (for example `cover-me-pretty`), add a `runtimeAppId` (or similar) to `ShopConfig` / `CreateShopOptions` and thread it through to `createShopFromConfig`.

**Acceptance criteria**

- CMS `createNewShop` and CLI (`create-shop`, `init-shop`) call a shared `createShopFromConfig` wrapper that delegates to `createShop`.
- There is no separate, divergent creation logic outside this shared path; differences are only in how `ShopConfig` is gathered (wizard vs CLI flags/prompts).
- A future `runtimeAppId` field is wired through the same wrapper when introduced, so the runtime app choice for a shop is explicit and discoverable.

**Validation**

- Extend unit tests around CLI parsing and CMS actions:
  - `test/unit/__tests__/create-shop-cli.spec.ts` continues to pass.
  - New tests in `apps/cms` exercise `createNewShop` with a `ShopConfig` payload and assert that `createShopFromConfig` is called with the expected arguments.

### C1‑2 Idempotence & repair

**Work**

- Introduce a shared `Environment` union (coordinated with Threads A/D), for example:

  ```ts
  type Environment = 'dev' | 'stage' | 'prod';
  ```

  and adopt it consistently in CMS and CLI creation paths.
- Make environment selection explicit for creation flows:
  - CLI: add an `--env` flag (defaulting to `dev` for local usage), rather than relying on `NODE_ENV`.
  - CMS: pass the intended environment into `createShopFromConfig` (or use a known environment for “Fast Launch” flows, e.g. `stage`).
- Decide and implement behaviour when `createShopFromConfig` (or `createShop`) is invoked for an existing shop:
  - In `dev` / `stage`:
    - Allow a controlled “replay config” that:
      - Updates `Shop` / `ShopSettings` via repositories.
      - Regenerates pages as needed.
      - Records the attempt and outcome in creation state (below).
  - In `prod`:
    - Fail fast with a structured error and direct operators to explicit migrate/repair flows.
- Introduce a shared **shop creation state** artefact:
  - File: `data/shops/<id>/creation.json` with a well‑typed `ShopCreationState`.
  - Both Thread A (Configurator/launch) and Thread C (CLI/CMS) read/write this same artefact; do not create a second variant.
  - Fields (aligned with Thread A plan):
    - `shopId`
    - `status: 'pending' | 'created' | 'partial' | 'failed'`
    - `lastConfigHash?`
    - `lastError?`
    - Timestamps/metadata.
- Once Thread A’s “launchable per env” predicate is implemented, reuse it:
  - Before replaying config for an existing shop, apply the predicate to ensure config is being replayed into an appropriate environment and that idempotent replays are consistent with launch gating.

**Acceptance criteria**

- Re‑running config‑driven creation for an existing shop in `dev`/`stage` has a defined, tested behaviour; in `prod` it fails with a clear error.
- Creation state is observable via `creation.json` and/or DB, and CMS can surface “stuck” or failed creation attempts.

**Validation**

- Extend tests for `createShopFromConfig` and CLI/CMS flows to:
  - Cover duplicate creation in non‑prod envs and assert the chosen behaviour.
  - Assert that `creation.json` is written and updated as expected for success/failure cases.

## C2 — One‑click deploy from CMS

**Goal**

Provide a CMS action that takes a configured shop and triggers a build+deploy on the target platform, writing a consistent `deploy.json` artefact.

### C2‑1 Deployment adapter interface

**Work**

- Extend the existing `DeployShopResult` and adapter usage rather than redefining the interface:
  - Introduce optional metadata fields on `DeployShopResult` (or a wrapper type) to capture:
    - `env?: Environment`
    - `runtimeAppId?: string`
    - `version?: string` (build or componentVersions identifier)
    - `deployId?: string`
    - `logsUrl?: string`
  - Propagate these fields from call sites (CMS, scripts) into `deploy.json` via `writeDeployInfo`.
- Decide where `env` and `runtimeAppId` come from:
  - `env`:
    - Infer from the context (e.g. CMS “Launch to prod” vs “Deploy to staging”) and set it when calling `deployShop`, using the shared `Environment` union from C1‑2.
  - `runtimeAppId`:
    - In v1, derive implicitly from the shop/app id and existing template app layout.
    - When a dedicated `runtimeAppId` field is added to `ShopConfig` / `Shop`, thread it through to deployment.
- Keep `ShopDeploymentAdapter`’s method signatures stable for now:
  - Continue to call `deploy(id, domain?)` and have the adapter itself infer or attach additional metadata when writing `deploy.json`.

**Acceptance criteria**

- `DeployShopResult` (and `deploy.json`) carries enough information for CMS to show status, environment, and a link to logs.
- Adapter behaviour remains compatible with existing code but is ready to support multiple environments and runtime apps as those fields become available.

---

### C2‑2 CMS deploy action

**Work**

- Keep `deployShopHosting` as the CMS entrypoint and extend it:
  - Accept an `env: Environment` parameter.
  - Tag the resulting `DeployShopResult` with `env`, `runtimeAppId?`, and any version metadata (per C2‑1) before it is written to `deploy.json`.
- Integrate post‑deploy verification once Thread D scripts exist:
  - Introduce a shared helper (e.g. in `@acme/platform-core` or a scripts module):

    ```ts
    async function verifyShopAfterDeploy(
      shopId: string,
      env: Environment
    ): Promise<VerificationResult> {
      // wrap pnpm test:shop-smoke (once implemented), collect pass/fail + summary
    }
    ```

  - After a successful call to `deployShop`, have `deployShopHosting` (or a higher‑level action) call `verifyShopAfterDeploy` and:
    - Update `deploy.json` with test status and error summary.
    - Leave the previous runtime live if tests fail; treat failed tests as a failed deploy attempt in `deploy.json`.
- CMS UI work:
  - Reuse the existing deploy endpoints but:
    - Surface per‑env deploy status (when env is available).
    - Add clear semantics:
      - “Deploy” = build + deploy to the selected env.
      - “Launch to prod” = `env='prod'` + passing smoke tests.

**Acceptance criteria**

- CMS deploy endpoints remain compatible with current usage but start recording env/version metadata in `deploy.json` as those fields are added.
- Once `verifyShopAfterDeploy` and `test:shop-smoke` exist, deploy and upgrade flows use them to gate “success” vs “failed” deploys without silently replacing the last known good runtime.

**Validation**

- In a staging environment, manually:
  - Trigger deploy from CMS for a sample shop.
  - Confirm `deploy.json` has expected fields.
  - Confirm runtime responds on the recorded URL.
  - Verify `deployId`/`logsUrl` are usable for debugging.

---

## C3 — Upgrade & rollback

**Goal**

Standardise how upgrades and rollbacks are performed and tracked, building on the existing CLI flows (`upgrade-shop`, `republish-shop`, `rollback-shop`) so CMS and operators can reason about shop runtime versions.

### C3‑1 Upgrade artefacts

**Work**

- Keep the existing CLI upgrade flow (`scripts/src/upgrade-shop.ts`) but tighten artefact semantics:
  - Make the current shape of `data/shops/<shopId>/upgrade.json` explicit and documented:

    ```jsonc
    {
      "timestamp": "...",
      "componentVersions": { /* from apps/<id>/package.json */ },
      "components": [ /* changed components */ ]
    }
    ```

  - Add an optional `fromComponentVersions` (or `fromVersion`) field derived from the current `shop.json.componentVersions` before overwriting, so before/after are visible in one artefact.
- Clarify and document the role of `history.json` alongside the existing `scripts/src/republish-shop.ts` behaviour:
  - Ensure `data/shops/<id>/history.json` is maintained as an append‑only log of previous `{ componentVersions, lastUpgrade, timestamp }` snapshots:
    - Adjust `scripts/src/rollback-shop.ts` (and its tests) so it appends a new entry instead of popping the last one, preserving the full history.
  - Update docs and any callers to treat `history.json` as the source of truth for rollback targets.
- Keep runtime/template version fields in `shop.json` as the owner of template upgrade state:
  - Ensure `upgrade-shop` continues to update `shop.json.lastUpgrade` and `shop.json.componentVersions` when staging upgrades.
  - Ensure `republish-shop` continues to refresh `shop.json.status` and `shop.json.componentVersions` after a successful build+deploy.

**Acceptance criteria**

- `upgrade-shop` continues to stage upgrades and write `upgrade.json`, but the JSON shape is clearly documented and includes enough context to understand before/after versions.
- `republish-shop` remains responsible for populating `history.json` with append‑only snapshots used by rollback.
- The doc and scripts agree on which artefacts each tool owns (`upgrade.json`, `upgrade-changes.json`, `history.json`, `shop.json.lastUpgrade`, `shop.json.componentVersions`).

---

### C3‑2 CMS upgrade/rollback actions

**Work**

- Define “version” for CMS upgrade/rollback UX as:
  - The combination of `shop.json.componentVersions` and `shop.json.lastUpgrade`.
  - The entries in `data/shops/<id>/history.json` that record previous snapshots.
- Add CMS actions that delegate to existing scripts:
  - `upgradeShop` (in `apps/cms/src/actions`):
    - Calls `pnpm ts-node scripts/src/upgrade-shop.ts <shop-id>` via a safe server‑side wrapper.
    - Reads `upgrade.json` and `upgrade-changes.json` from `DATA_ROOT` and returns them for CMS to display.
  - `republishUpgradedShop`:
    - Calls `pnpm ts-node scripts/src/republish-shop.ts <shop-id>` via a wrapper.
    - After completion, reads updated `shop.json` and `history.json` and returns the new runtime “version” and history.
  - `rollbackShop`:
    - Calls `pnpm ts-node scripts/src/rollback-shop.ts <shop-id>` via a wrapper.
    - After completion, reads updated `shop.json` and `history.json` and returns the restored runtime “version”.
- Expose these actions through CMS UI:
  - Add per‑shop controls for “Stage upgrade”, “Republish upgrade”, and “Rollback to previous version”.
  - Display current version, staged upgrade metadata, and available rollback points using `shop.json`, `upgrade.json`, `upgrade-changes.json`, and `history.json`.

**Acceptance criteria**

- Operators can trigger upgrade, republish, and rollback from CMS using actions that delegate to the existing scripts.
- Each operation leaves clear audit trails in `upgrade.json` / `history.json`, and CMS can render a coherent view of current and past runtime versions.

---

### C3‑3 Guard with tests

**Work**

- Implement a shared post‑deploy verification helper (coordinated with Thread D):

  ```ts
  async function verifyShopAfterDeploy(
    shopId: string,
    env: Environment
  ): Promise<VerificationResult> {
    // run pnpm test:shop-smoke (to be added), collect pass/fail + summary
  }
  ```

- Integrate verification into the upgrade path:
  - After `republish-shop` completes (whether invoked via CLI or via CMS actions), call `verifyShopAfterDeploy(shopId, env)` for the relevant `{shopId, env}` pair.
  - Record the test outcome:
    - In `deploy.json` (via extended `DeployShopResult` fields).
    - Optionally in `history.json` entries (`testsStatus` / `testsSummary`), without changing existing semantics.
- Keep rollback behaviour operator‑driven:
  - If smoke tests fail after republish:
    - Mark the deploy as `failed` in `deploy.json` and surface this in CMS.
    - Do **not** automatically run `rollback-shop`; leave the last known good deploy live.
    - Let operators invoke rollback explicitly via the CMS `rollbackShop` action when appropriate.

**Acceptance criteria**

- Failed upgrades are clearly recorded as such and do not silently change the live runtime.
- Successful upgrades are backed by passing smoke tests.

**Validation**

- Use a sample shop in staging to:
  - Run a simulated upgrade, verify `upgrade.json`, `history.json`, and `Shop.componentVersions` / `lastUpgrade` are updated and smoke tests pass.
  - Force a failure (script or tests) and verify artefacts show `failed` status with error reason and that live runtime remains on last known good version.

---

## Completion criteria for Thread C

Thread C is complete when:

1. CMS and CLI share a config‑driven creation path:
   - A `createShopFromConfig` wrapper (or equivalent) in `@acme/platform-core/createShop` maps a common `ShopConfig` to `CreateShopOptions` and calls `createShop`.
   - `createNewShop` in CMS and `create-shop` / `init-shop` in scripts use this wrapper for config‑driven flows.
   - Creation is environment‑aware and records status in `creation.json` / `ShopCreationState` (shared with Thread A).
2. Deploy from CMS is wired to the existing deployment adapter but enriched:
   - `deployShopHosting` (and related routes) call `deployShop`, tagging results with env/version/runtime metadata as those fields are introduced.
   - `deploy.json` remains the adapter‑owned artefact, extended to carry the data CMS needs.
   - Once available, `verifyShopAfterDeploy` is invoked after deploys to gate “success” vs “failed” without silently replacing the last known good runtime.
3. Upgrade and rollback flows build on the current scripts with clear artefacts:
   - `upgrade-shop` continues to stage upgrades and write `upgrade.json` / `upgrade-changes.json`, with a documented JSON shape.
   - `republish-shop` appends to `history.json`, rebuilds, deploys, updates `shop.json.status` and `componentVersions`, and cleans up temporary files.
   - `rollback-shop` uses `history.json` to restore previous `componentVersions` / `lastUpgrade` into `shop.json` and the app’s `package.json`, then rebuilds and redeploys.
   - CMS actions exist that wrap these scripts so operators can trigger stage/republish/rollback from the UI.
4. Upgrade success and failures are observable and test‑guarded:
   - After republish + deploy, smoke tests (Thread D) run via `verifyShopAfterDeploy`; successful upgrades are marked as such, failed upgrades are recorded and do not silently change the live runtime.
   - `deploy.json`, `upgrade.json`, and `history.json` together give a coherent picture of upgrade history and current runtime “version” for each shop.
