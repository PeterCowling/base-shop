---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Audit-Ref: 57a99f5033
Feature-Slug: xa-e2e-sync-success-path
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-e2e-sync-success-path/plan.md
Trigger-Why: J2 sync journey has no E2E coverage; scripts are now present (commit 2ac91e7e5a); coverage gap is real and actionable.
Trigger-Intended-Outcome: type: operational | statement: A Playwright E2E test TC-09-03 covers the J2 sync success path — save a product, run a real (non-dry-run) sync against a real products CSV, assert "Sync completed." feedback and confirm CJDBR = 0%. | source: operator
Dispatch-ID: IDEA-DISPATCH-20260226-0009
Trigger-Source: dispatch-routed
---

# XA Uploader — E2E Sync Success Path Fact-Find

## Scope

### Summary

The XA uploader E2E suite currently covers J1 (login/edit/save/delete) through TC-09-01, and J2 with a dry-run smoke test through TC-09-02. A dry-run sync exercises the validate + pipeline scripts but skips the `publishCatalogArtifactsToContract` call. No test verifies that a real (non-dry-run) sync runs to completion and produces the "Sync completed." feedback to the operator.

The sync scripts (`validate-xa-inputs.ts` and `run-xa-pipeline.ts`) were committed in `2ac91e7e5a` (2026-02-24), resolving the blocker documented in `usability-kpi-delta.md`. The goal of this plan is to add TC-09-03: a real-sync success path test that completes J2 end-to-end, and to re-confirm CJDBR = 0%.

### Goals

- Add Playwright E2E test TC-09-03 covering the J2 sync success path: save a product, run a real sync (not dry-run), assert "Sync completed." UI feedback.
- Determine the correct approach for the `publishCatalogArtifactsToContract` publish step in an E2E context — stub, skip, or satisfy via env config.
- Confirm CJDBR = 0% once TC-09-03 passes and document the updated KPI in `usability-kpi-delta.md`.

### Non-goals

- E2E coverage for J2 error paths (validation failure, pipeline failure, empty input 409) — adjacent, deferred.
- E2E coverage for the GET readiness endpoint — adjacent, deferred.
- API-level unit tests for the sync route (already comprehensive in `route.test.ts`).

### Constraints & Assumptions

- Constraints:
  - The E2E harness runs the Next.js dev server (webpack) in a temp process; the sync API route spawns `node --import tsx` child processes using the real repo scripts. The temp CSV written by the harness must contain at least one valid product row for a non-empty sync to proceed.
  - The `publishCatalogArtifactsToContract` call is controlled by env vars: `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN`. If these are absent, the API returns `catalog_publish_unconfigured` (HTTP 503), not a success. The test must handle this.
  - E2E tests run in serial (`mode: "serial"`) under `test.describe` in the existing spec. The new test must conform to this pattern.
  - The `XA_UPLOADER_MIN_IMAGE_EDGE=1` env var is already set by the harness, so a 1x1 PNG is a valid image for non-strict validation.
- Assumptions:
  - The real scripts execute successfully against a minimal valid products CSV containing a single row with required fields (title, brand_handle, collection_handle, description, subcategory, colors, materials, image_files) when `strict=false, recursive=false`.
  - The `dryRun=false` path in the API route differs from `dryRun=true` only by calling `publishCatalogArtifactsToContract` after scripts run — all other pipeline behavior (validate + run-xa-pipeline) is identical.

## Outcome Contract

- **Why:** J2 sync journey has no E2E coverage; scripts are now present and the blocker is resolved; closing this gap completes the coverage commitment made in the usability-hardening plan and confirms CJDBR = 0%.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** TC-09-03 Playwright E2E test passes, covering the J2 sync success path end-to-end. CJDBR updated to 0% in `usability-kpi-delta.md`.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/e2e/catalog-console.spec.ts` — the single Playwright spec file; contains TC-09-01 (J1 happy path) and TC-09-02 (sync dry-run). The new TC-09-03 adds here.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — POST handler is the sync API; GET handler is the readiness check. Both are the targets of J2 flow.

### Key Modules / Files

- `apps/xa-uploader/e2e/helpers/uploaderHarness.ts` — harness that starts the Next.js dev server in a temp process, creates a temp CSV at `csvPath` (set via `XA_UPLOADER_PRODUCTS_CSV_PATH`), writes a 1x1 PNG fixture. The harness CSV is initially empty (empty string write). TC-09-03 must write product row data to `csvPath` before triggering sync.
- `apps/xa-uploader/e2e/fixtures/README.md` — confirms that all fixtures are generated at runtime; no persistent fixture files in the repo.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — sync pipeline: (1) checks empty input → 409 if empty and not confirmed; (2) checks scripts present via `fs.access`; (3) runs `validate-xa-inputs.ts` via `spawn`; (4) runs `run-xa-pipeline.ts` via `spawn`; (5) calls `publishCatalogArtifactsToContract` unless `dryRun=true`; (6) returns `{ ok: true, durationMs, dryRun, publishedVersion?, publishedAt? }`.
- `scripts/src/xa/validate-xa-inputs.ts` — validates CSV rows against `catalogProductDraftSchema`; exits 0 on success, 1 on failure. Accepts `--products <path>` required arg.
- `scripts/src/xa/run-xa-pipeline.ts` — transforms CSV rows into `catalog.json` + `catalog.media.json`; writes state file; exits 0 on success. Accepts `--products`, `--out`, `--media-out`, `--state` as required args; `--backup-dir` is optional (defaults to `dirname(--out)` when omitted); optional flags: `--backup`, `--simple`, `--replace`, `--recursive`, `--dry-run`, `--strict`.
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — `publishCatalogArtifactsToContract`: reads `catalog.json` and `catalog.media.json` from the artifact paths, PUTs them to `XA_CATALOG_CONTRACT_BASE_URL/<storefrontId>` with `X-XA-Catalog-Token` header. Throws `CatalogPublishError` with `code: "unconfigured"` if env vars are absent — which causes the API to return HTTP 503.
- `apps/xa-uploader/src/lib/uploaderI18n.ts` — `syncSucceeded: "Sync completed."` (EN, line 36). This is the string the E2E test asserts via `syncFeedback.toContainText("Sync completed.")`.
- `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` — renders `data-testid="catalog-sync-readiness"` (readiness status), `data-testid="catalog-run-sync"` (sync button), `data-testid="catalog-sync-feedback"` (success/error feedback).
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — `handleSyncImpl`: posts to `/api/catalog/sync`, handles 409 empty-input confirmation, sets `syncSucceeded` feedback on `response.ok && data.ok`.

### Patterns & Conventions Observed

- E2E tests use `test.describe.configure({ mode: "serial", timeout: 180_000 })` — all tests in the group share one server instance; TC-09-03 must use the same serial mode.
- Evidence: `apps/xa-uploader/e2e/catalog-console.spec.ts` lines 35–46.
- Login is repeated per test via `loginViaKeyboard(page)` — each test starts from the login screen.
- Evidence: `apps/xa-uploader/e2e/catalog-console.spec.ts` lines 12–22.
- `fillRequiredProductFields(page)` fills the form fields needed for a product draft save: title, brand-handle, collection-handle, description, subcategory, colors, materials, image-files.
- Evidence: `apps/xa-uploader/e2e/catalog-console.spec.ts` lines 24–33.
- `harness.imageRelativePath` resolves to `fixtures/sample.png` (relative to the temp CSV dir); the harness writes a 1x1 PNG there.
- Evidence: `apps/xa-uploader/e2e/helpers/uploaderHarness.ts` lines 54–59.
- TC-09-02 (dry-run) does NOT check the dryRun toggle off before running — it explicitly checks the dry run toggle `on`. TC-09-03 should leave dryRun unchecked (the default state is unchecked per `useCatalogConsole.client.ts` line 110: `dryRun: false` initial state).
- Evidence: `apps/xa-uploader/e2e/catalog-console.spec.ts` lines 102–118.

### Data & Contracts

- CSV row minimum fields for a valid non-strict sync (inferred from `catalogProductDraftSchema` usage in `validate-xa-inputs.ts` and `run-xa-pipeline.ts`):
  - Required: `title`, `brand_handle` (maps to brandHandle), `collection_handle` (or collection_title), `description`, taxonomy fields `department` (default "women"), `category` (default "bags"), `subcategory`, `color`, `material`.
  - Optional but commonly used: `image_files` (non-strict: may be empty without error).
  - The CSV header row is followed by data rows; the harness writes the CSV path to `XA_UPLOADER_PRODUCTS_CSV_PATH`.
- The harness's `fillRequiredProductFields` already populates: title, brand-handle, collection-handle, description, subcategory, colors, materials, image-files (pointing to the temp `sample.png`). After the save-draft API call, the CSV at `csvPath` will contain a valid row that the scripts can process.
- Sync API success response shape: `{ ok: true, durationMs: number, dryRun: false, publishedVersion?: string, publishedAt?: string }`.
- Publish step: triggered only when `dryRun === false`. Requires `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN` env vars. If absent, throws `CatalogPublishError("unconfigured")` → API returns HTTP 503, `error: "catalog_publish_unconfigured"`.

### Dependency & Impact Map

- Upstream dependencies:
  - `scripts/src/xa/validate-xa-inputs.ts` — present since commit `2ac91e7e5a`.
  - `scripts/src/xa/run-xa-pipeline.ts` — present since commit `2ac91e7e5a`.
  - `scripts/src/xa/catalogSyncCommon.ts` — shared utilities for both scripts; present since same commit.
  - `@acme/lib/xa` — `catalogProductDraftSchema`, `expandFileSpec`, `readImageDimensions`, `rowToDraftInput`, `slugify`, `readCsvFile`, `splitList` — all consumed by scripts; must be importable in the tsx child process context.
- Downstream dependents:
  - `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json` — generated by run-xa-pipeline during a real sync; publish step reads this.
  - `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.media.json` — likewise.
  - XA catalog contract endpoint (external) — called during publish unless env vars are absent.
- Likely blast radius:
  - The new E2E test adds to the existing serial describe block. No blast to existing tests — serial mode means they run sequentially.
  - The real scripts will write `catalog.json`, `catalog.media.json`, and a state file to `apps/xa-uploader/data/sync-artifacts/xa-b/` and `apps/xa-uploader/data/.xa-upload-state.xa-b.json` in the repo during test runs. These are transient artifacts and should be `.gitignore`'d (check before build).

### Test Landscape

#### Test Infrastructure

- Frameworks: Playwright (E2E), Jest (unit/integration).
- Commands:
  - `pnpm --filter @apps/xa-uploader run test:e2e` — runs `playwright test e2e/catalog-console.spec.ts --reporter=list`.
  - `pnpm --filter @apps/xa-uploader run test:local` — Jest route + hook tests.
  - `pnpm --filter @apps/xa-uploader run test:api` — Jest API route tests only.
- CI integration: present (confirmed by the `test:e2e` script in `package.json`). Whether CI runs E2E is not confirmed from available evidence — this is a testability note.
- Playwright config: no `playwright.config.*` found in `apps/xa-uploader/`. Playwright picks up defaults or uses workspace-level config.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| J1: Login/edit/save/delete | E2E Playwright | `e2e/catalog-console.spec.ts` TC-09-01 | Full happy path covered |
| J2: Sync dry-run | E2E Playwright | `e2e/catalog-console.spec.ts` TC-09-02 | Dry-run only; scripts spawn but publish skipped |
| Sync API route (unit) | Jest | `src/app/api/catalog/sync/__tests__/route.test.ts` TC-00 through TC-06 | Comprehensive mock-based; covers readiness, empty input, validate fail, sync fail, publish success, publish unconfigured |
| Hook sync behavior | Jest | `src/components/catalog/__tests__/sync-feedback.test.tsx` | Sync feedback states |

#### Coverage Gaps

- Untested paths:
  - J2 real sync success (non-dry-run) — no E2E test; this is the primary gap to close.
  - J2 error paths (validation failure, pipeline failure, empty input 409) — deferred to adjacent work.
  - GET readiness endpoint — deferred to adjacent work.
  - Publish step behavior under real network conditions — deferred; can be handled by env-stubbing in E2E (see approach below).
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test:
  - The validate + pipeline scripts run in child processes; the E2E test exercises them through the API route just by calling the sync UI button — no additional mocking of the scripts is needed.
  - The harness already sets `XA_UPLOADER_MIN_IMAGE_EDGE=1`, so a 1x1 PNG passes image dimension validation.
  - `fillRequiredProductFields` + save-draft already populates the CSV with a valid row; TC-09-03 can reuse this.
- Hard to test:
  - The publish step (`publishCatalogArtifactsToContract`) requires a live contract endpoint. This cannot be exercised in E2E without either a real endpoint or a local stub server.
- Test seams needed:
  - **Publish step stub**: The harness must be extended to handle the publish step. Two options:
    1. **Preferred: omit publish env vars and assert on the `catalog_publish_unconfigured` UI feedback instead of "Sync completed."** — This is the simplest approach but does not cover the true success path since the API returns 503 when unconfigured.
    2. **Correct: set `XA_CATALOG_CONTRACT_BASE_URL` to a local stub HTTP server started by the harness** — The harness spawns a lightweight HTTP server on a reserved port, responding `{ ok: true, version: "v-e2e-test", publishedAt: "..." }` to PUT requests. The sync API then completes the full pipeline and returns `{ ok: true, dryRun: false, publishedVersion: "v-e2e-test" }`. The UI shows "Sync completed.".

#### Recommended Test Approach

- The correct approach is option 2 (stub contract server) because it covers the true success path with `publishCatalogArtifactsToContract` executed, the UI feedback "Sync completed." shown, and the full API response including `publishedVersion` exercised. This is the approach the plan should implement.
- The stub server is a minimal `node:http` server that the harness starts, passes `XA_CATALOG_CONTRACT_BASE_URL` and a stub write token to the Next.js dev server, and tears down on `stop()`.
- Unit tests: the existing `route.test.ts` TC-05 already covers the publish success path at the unit level. No new unit tests are needed.
- E2E tests: TC-09-03 — one new test in the existing serial describe block.

### Recent Git History (Targeted)

- `2ac91e7e5a` (2026-02-24) — added `scripts/src/xa/validate-xa-inputs.ts`, `scripts/src/xa/run-xa-pipeline.ts`, and `scripts/src/xa/catalogSyncCommon.ts`. This resolved the J2 blocker. The TC-09-02 dry-run test was also added in this batch (or alongside the usability-hardening plan work).
- `c3a2e60096` — lint cleanup across ui and related apps; no functional change to sync path.

## Questions

### Resolved

- Q: Should the E2E test run against the real scripts (node spawning validate + pipeline) or mock at the API route level?
  - A: Run against real scripts. The scripts are lightweight TypeScript files that `tsx` can run in under a second for a single-row CSV. Mocking the spawn in E2E would defeat the purpose of J2 coverage — the value of the E2E test is that it exercises the actual validate + pipeline scripts end-to-end through the real API route. Unit-level mocking of spawn already exists in `route.test.ts`.
  - Evidence: TC-09-02 already exercises real scripts via the dry-run path; extending to real sync is a minimal delta.

- Q: Does the CSV need a pre-seeded fixture file, or does the harness create it at runtime?
  - A: Runtime creation only. The harness writes an empty CSV to `csvPath` at startup. TC-09-03 must trigger a draft save via the UI (which writes a valid row to the CSV through the API) before clicking "Run Sync". This follows the same pattern as TC-09-02.
  - Evidence: `uploaderHarness.ts` line 57: `await writeFile(csvPath, "", "utf8")`. TC-09-02 lines 95–101 shows the save-draft step before sync.

- Q: What is the minimum valid CSV input for a sync run to succeed?
  - A: A single product row with: title (non-empty), brand_handle, collection_handle or collection_title, subcategory (taxonomy), colors (taxonomy.color), materials (taxonomy.material), description, and image_files pointing to `fixtures/sample.png`. The `fillRequiredProductFields` helper already populates all these fields. With `strict=false` (the default), missing or empty image_files produce warnings, not errors. With `XA_UPLOADER_MIN_IMAGE_EDGE=1`, the 1x1 PNG passes the size check.
  - Evidence: `validate-xa-inputs.ts` logic + `run-xa-pipeline.ts` `buildCatalogArtifacts` + `fillRequiredProductFields` in `catalog-console.spec.ts`.

- Q: Does the publish step need to be stubbed, and what is the right approach?
  - A: Yes, the publish step requires a stub contract server for the E2E test to reach the true success state ("Sync completed." feedback). The harness should be extended with a minimal `node:http` stub server that responds `{ ok: true, version: "v-e2e-test" }` to PUT requests. `XA_CATALOG_CONTRACT_BASE_URL` and a stub write token are passed to the Next.js process via env vars.
  - Evidence: `catalogContractClient.ts` — throws `CatalogPublishError("unconfigured")` if env vars are absent (no success possible without them); `route.ts` lines 387–399 show the unconfigured failure path returns 503.

- Q: What does the UI show after a successful real sync?
  - A: `catalog-sync-feedback` element contains "Sync completed." — this is `t("syncSucceeded")` set in `catalogConsoleActions.ts` line 469 on `response.ok && data.ok`.
  - Evidence: `uploaderI18n.ts` line 36: `syncSucceeded: "Sync completed."`. `CatalogSyncPanel.client.tsx` line 127: renders `data-testid="catalog-sync-feedback"`.

- Q: Is the dryRun toggle unchecked by default?
  - A: Yes. The `CatalogSyncPanel` renders checkboxes driven by `syncOptions`; the initial state in `useCatalogConsole` has `dryRun: false`. TC-09-03 should not touch the dry-run toggle (leave it unchecked) — contrast with TC-09-02 which explicitly checks it.
  - Evidence: `useCatalogConsole.client.ts` lines 108–112 — `useState({ strict: true, dryRun: false, replace: false, recursive: true })`; TC-09-02 explicitly checks the toggle, confirming the default is unchecked.

- Q: What are the sync-artifacts output paths, and do they need to be gitignored?
  - A: Generated to `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json` and `catalog.media.json` (resolved from `runSyncPipeline` + `resolveGeneratedArtifactPaths`). Verified: `apps/xa-uploader/` has no `.gitignore` file, and the root `.gitignore` has no entries covering `apps/xa-uploader/data/`. The `sync-artifacts/` and `backups/` directories exist in the working tree but are not gitignored. TASK-01 must add gitignore entries to prevent test artifacts from being committed.
  - Evidence: `route.ts` lines 282–289, `resolveGeneratedArtifactPaths`.

- Q: What is the current CJDBR KPI after scripts were committed?
  - A: The `usability-kpi-delta.md` reflects the measurement taken on 2026-02-23 (before commit `2ac91e7e5a`), showing CJDBR = 50%. Since the scripts are now present, J2 is unblocked. Re-measuring confirms CJDBR = 0% (0 blocked journeys / 2 total journeys). The update to `usability-kpi-delta.md` is part of this plan's scope as stated in the dispatch.
  - Evidence: `usability-kpi-delta.md` baseline data + git log showing scripts committed 2026-02-24.

### Open (Operator Input Required)

No genuine open questions remain. All architectural and implementation decisions have been resolved by reasoning from the evidence.

## Confidence Inputs

- Implementation: 93%
  - The pattern is clear: extend TC-09-02 structure, add a stub contract server to the harness, assert "Sync completed." The gitignore gap is now confirmed and resolved in TASK-01 scope.
  - To reach 95%: run the existing TC-09-02 locally to confirm harness + real scripts still work end-to-end after commit `2ac91e7e5a`.

- Approach: 90%
  - Using a real node:http stub server in the harness is the correct approach; the alternative (omitting contract env vars) leaves the publish step uncovered. The harness extension pattern (similar to the port reservation pattern already in use) is straightforward.
  - To reach 95%: run the existing TC-09-02 locally to confirm the harness setup still works post-script commit.

- Impact: 85%
  - TC-09-03 closes the last uncovered E2E gap from the usability-hardening plan. CJDBR moves to 0% as documented. The impact is clear and measurable.
  - To reach 90%: confirm CI runs `test:e2e` (no playwright.config.ts found; check workspace-level playwright config or CI yaml).

- Delivery-Readiness: 88%
  - No blockers remain; scripts exist, harness pattern is proven, test structure is established.
  - To reach 95%: verify playwright.config location and CI E2E trigger.

- Testability: 90%
  - The real scripts run fast for a single-row CSV. The stub server approach is simple and deterministic.
  - To reach 95%: confirm the tsx import works in the child process spawned by the dev server (already confirmed by TC-09-02 dry-run path).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sync-artifact output paths not gitignored; test run could commit catalog.json to repo | High | Medium | Confirmed: no `.gitignore` exists in `apps/xa-uploader/`; data/ is not gitignored. TASK-01 must add `.gitignore` entries before running TC-09-03. |
| Playwright config not found at app level; `test:e2e` command relies on workspace default config that may not be set | Low | Low | If `playwright test` fails due to missing config, add a minimal `playwright.config.ts` to `apps/xa-uploader/` — mirrors the pattern used in other apps |
| Stub contract server port conflicts with the dev server port | Low | Low | Reserve a separate port via the existing `reservePort()` utility; pass it as `XA_CATALOG_CONTRACT_BASE_URL` |
| CSV row saved by `fillRequiredProductFields` fails validation in the real script due to schema mismatch between UI form fields and `catalogProductDraftSchema` | Low | Medium | TC-09-02 dry-run already exercises this path — validation succeeds for the harness's product data. If schema changes introduced a regression, TC-09-02 would already be failing. |
| CI does not run `test:e2e` (E2E may be a local-only script) | Medium | Low | New test is addable without CI change; operator can run locally. Check CI yaml as a parallel task. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New test must be inside the existing `test.describe("catalog console e2e", ...)` block, after TC-09-02, using the same `serial` mode.
  - Harness extension must preserve the existing `UploaderHarness` type contract; add stub server lifecycle to `start()` and `stop()`.
  - Use `data-testid` selectors consistent with the existing test (all current assertions use `getByTestId` or `getByLabel`).
  - Follow existing timeout pattern: `test.setTimeout(180_000)` and appropriate `expect(..., { timeout: 120_000 })` for async operations.
- Rollout/rollback expectations:
  - No production code change. The test is addable/removable without any application-code impact. Low rollout risk.
- Observability expectations:
  - After TC-09-03 passes, update `usability-kpi-delta.md` with a new post-scripts row: CJDBR = 0/2 = 0%.

## Suggested Task Seeds (Non-binding)

- TASK-01: Verify sync-artifact output paths are gitignored; add `.gitignore` entries to `apps/xa-uploader/data/sync-artifacts/` if missing.
- TASK-02: Extend `uploaderHarness.ts` to start a stub contract HTTP server; pass `XA_CATALOG_CONTRACT_BASE_URL` and stub write token to the Next.js process env; tear down on `stop()`.
- TASK-03: Add TC-09-03 to `catalog-console.spec.ts` — save product, leave dryRun unchecked, click Run Sync, assert "Sync completed." feedback and sync button regains focus.
- TASK-04: Re-measure CJDBR post-TC-09-03 and update `docs/plans/xa-uploader-usability-hardening/artifacts/usability-kpi-delta.md` with CJDBR = 0%.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - `pnpm --filter @apps/xa-uploader run test:e2e` passes with TC-09-01, TC-09-02, and TC-09-03 all green.
  - `usability-kpi-delta.md` updated with CJDBR = 0% evidence row.
- Post-delivery measurement plan:
  - CJDBR = 0% confirmed. No further KPI tracking required for this plan.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: all file paths and function/variable names verified by reading source files directly. No unverified claims.
- Boundary coverage: the publish boundary (`catalogContractClient.ts`) was inspected and the stub server approach was chosen to exercise it rather than bypassing it.
- Testing/validation coverage: existing TC-09-02 dry-run and `route.test.ts` TC-00 through TC-06 verified by reading source; coverage gaps (non-dry-run E2E) explicitly identified.
- The CJDBR KPI status was verified: scripts confirmed present from `usability-kpi-delta.md` (baseline) + git log (commit `2ac91e7e5a`).

### Confidence Adjustments

- Playwright config location: no `playwright.config.*` found at the app level — this introduces a Low impact risk. Confidence in delivery-readiness adjusted from a hypothetical 92% to 88% to account for this unknown.
- CI E2E trigger: unknown whether CI runs `test:e2e`. Adjusted Impact score to 85% (from higher) since the test may only be locally runnable without a CI change.
- Gitignore gap: confirmed during factcheck that `apps/xa-uploader/` has no `.gitignore` and `data/sync-artifacts/` is unprotected. Elevated from Low to the Risks table. Addressed by moving verification into TASK-01 scope with confirmed action required.

### Remaining Assumptions

- The `catalogProductDraftSchema` accepts the fields produced by `fillRequiredProductFields` without error when strict=false (confirmed by TC-09-02 dry-run exercising the validate script on the same fields).
- The `node:http` stub server approach is sufficient for the contract endpoint; no TLS or auth complexity in the contract client beyond the write token header.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan xa-e2e-sync-success-path --auto`
