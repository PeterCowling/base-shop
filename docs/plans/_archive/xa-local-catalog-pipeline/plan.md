---
Type: Plan
Status: Archived
Domain: Data
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-local-catalog-pipeline
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Local Catalog Pipeline Plan

## Summary
The xa-uploader → xa-b data pipeline is broken locally because the sync endpoint returns 503 when the contract endpoint is unconfigured, even though catalog artifacts are generated successfully. Additionally, xa-b's build script only fetches from the contract URL or falls back to a stale committed file. This plan makes three targeted changes: (1) seed a products CSV so the pipeline has input data, (2) make the sync endpoint skip publish gracefully when the contract is unconfigured, (3) add a local artifact fallback path to xa-b's build script. A final checkpoint verifies the end-to-end pipeline.

## Active tasks
- [x] TASK-01: Seed products CSV from existing catalog data — Complete (2026-03-04)
- [x] TASK-02: Make sync endpoint graceful when contract unconfigured — Complete (2026-03-04)
- [x] TASK-03: Add local artifact fallback to xa-b build script — Complete (2026-03-04)
- [x] TASK-04: End-to-end local pipeline verification — Complete (2026-03-04)

## Goals
- xa-uploader sync succeeds locally without a contract endpoint
- xa-b build consumes catalog artifacts directly from xa-uploader output
- Products flow from uploader to storefront without cloud dependencies
- Production contract-based flow is unaffected

## Non-goals
- Image upload/R2 pipeline (separate plan)
- CatalogPayload schema changes (identical at every stage)
- Cloud deployment or Cloudflare Worker configuration
- xa-uploader UI/UX changes (covered by xa-uploader-workflow-rebuild)

## Constraints & Assumptions
- Constraints:
  - Cloudflare free tier only
  - Data pipeline only — images out of scope
  - Static export for xa-b — no runtime route handlers
  - Monorepo — both apps can read each other's files at build time
- Assumptions:
  - CatalogPayload format is identical at every pipeline stage (confirmed)
  - fast-csv barrel import crash already fixed (sub-path imports applied)
  - Existing catalog.runtime.json has 12 valid products that can seed the CSV

## Inherited Outcome Contract
- **Why:** The xa-uploader to xa-b data pipeline is broken locally — sync errors on missing contract, build has no local fallback, CSV is empty. Decoupling data from images enables local dev workflow.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader sync generates catalog artifacts locally, xa-b build consumes them directly, products flow from uploader to storefront without cloud dependencies.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-local-catalog-pipeline/fact-find.md`
- Key findings used:
  - CatalogPayload shape is identical at all pipeline stages — no transformation needed
  - Sync artifacts ARE generated before the publish step that returns 503
  - build-xa.mjs has an existing fallback chain (seed from catalog.json)
  - CSV column schema in `catalogCsvColumns.ts` has 57 columns matching CatalogProductDraftInput
  - UI consumer (`catalogConsoleActions.ts:426-437`) checks `data.ok` for success, shows rebuild message when `display.requiresXaBBuild === true`

## Proposed Approach
- Option A: Add a contract endpoint stub server for local dev — heavyweight, adds a new dependency, overkill for the problem.
- Option B: Skip publish when unconfigured + add local artifact fallback in build — minimal, targeted, backward-compatible.
- Chosen approach: **Option B** — three targeted code changes, no new dependencies, production flow unaffected.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Seed products CSV from catalog data | 85% | S | Complete (2026-03-04) | - | TASK-04 |
| TASK-02 | IMPLEMENT | Make sync graceful when contract unconfigured | 85% | S | Complete (2026-03-04) | - | TASK-04 |
| TASK-03 | IMPLEMENT | Add local artifact fallback to build-xa.mjs | 85% | S | Complete (2026-03-04) | - | TASK-04 |
| TASK-04 | CHECKPOINT | End-to-end local pipeline verification | - | S | Complete (2026-03-04) | TASK-01, TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three are independent code changes |
| 2 | TASK-04 | Wave 1 complete | Integration verification |

## Tasks

### TASK-01: Seed products CSV from existing catalog data
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-uploader/data/products-xa-b.csv` — products CSV file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/xa/seed-xa-csv.ts` (new), `apps/xa-uploader/data/products-xa-b.csv` (new), `[readonly] apps/xa-b/src/data/catalog.runtime.json`, `[readonly] apps/xa-uploader/src/lib/catalogCsvColumns.ts`, `[readonly] packages/lib/src/xa/catalogAdminSchema.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — CSV column schema known (57 columns in catalogCsvColumns.ts). CatalogProduct → CSV column mapping is straightforward. Source data (catalog.runtime.json) has 12 products with complete fields.
  - Approach: 90% — Read JSON, map fields to snake_case CSV columns, write file. One-time script.
  - Impact: 85% — Provides pipeline input data. Without CSV, sync endpoint rejects with "catalog_input_missing".
- **Acceptance:**
  - `apps/xa-uploader/data/products-xa-b.csv` exists with 12 product rows
  - CSV header matches `XA_PRODUCTS_CSV_COLUMN_ORDER` from catalogCsvColumns.ts
  - Each row maps correctly: slug, title, brand_handle, price, stock, taxonomy fields, image_files, etc.
  - All products have `publish_state: "ready"` so they pass the publishable filter
- **Validation contract (TC-XX):**
  - TC-01: Run seed script → CSV written with 12 data rows + 1 header row
  - TC-02: CSV columns match `XA_PRODUCTS_CSV_COLUMN_ORDER` exactly (57 columns)
  - TC-03: Pipe-delimited fields (sizes, image_files, image_alt_texts) use `|` separator consistently
  - TC-04: Taxonomy fields (department, category, color, material) populated from CatalogProduct.taxonomy
- **Execution plan:**
  - Red: Confirm `apps/xa-uploader/data/products-xa-b.csv` does not exist
  - Green: Write a seed script at `scripts/src/xa/seed-xa-csv.ts` that reads `catalog.runtime.json`, maps each product to CSV columns, writes the CSV. Run it once to generate the file.
  - Refactor: Verify the generated CSV can be read back by `run-xa-pipeline.ts` (spot-check column mapping)
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Column mapping from CatalogProduct (camelCase) to CSV (snake_case) — straightforward but verify: `compareAtPrice` → `compare_at_price`, `taxonomy.sizeClass` → `taxonomy_size_class`, etc. Image `media[]` array must flatten to pipe-delimited `image_files` and `image_alt_texts`.
- **Edge Cases & Hardening:**
  - Products with empty optional fields (details, sizes) → write empty string in CSV cell
  - Products with multiple media entries → join paths with `|` separator
  - Taxonomy array fields (color, material) → join with `|` separator
- **What would make this >=90%:**
  - Automated roundtrip test: seed CSV → run-xa-pipeline.ts → compare output catalog.json with input
- **Rollout / rollback:**
  - Rollout: Run seed script once; commit generated CSV
  - Rollback: Delete the CSV file
- **Documentation impact:** None
- **Consumer tracing:**
  - New output: `apps/xa-uploader/data/products-xa-b.csv`
  - Consumer 1: `sync/route.ts:buildCatalogInputGuardResponse()` — checks CSV exists and has rows. Already expects this file path via `data/products-{storefrontId}.csv` pattern.
  - Consumer 2: `run-xa-pipeline.ts` — reads CSV via `--products` arg. Already expects this format per catalogCsvColumns.ts column schema.
  - No consumer code changes needed.
- **Notes / references:**
  - Column order defined at `apps/xa-uploader/src/lib/catalogCsvColumns.ts`
  - Source data at `apps/xa-b/src/data/catalog.runtime.json` (12 products, CatalogPayload format)

### TASK-02: Make sync endpoint graceful when contract unconfigured
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — Error path is well-understood (lines 605-636). Change is targeted: check contract readiness before publish, skip if unconfigured. UI consumer already handles `ok: true` + `display.requiresXaBBuild: true`.
  - Approach: 90% — Skip publish step, return success shape. Clean separation of concerns (artifact generation vs publish).
  - Impact: 90% — Directly unblocks local sync workflow. Production path (contract configured) unchanged.
- **Acceptance:**
  - POST sync returns 200 with `ok: true` when contract is unconfigured and artifacts are generated
  - Response includes `display.requiresXaBBuild: true` (same as normal success)
  - Response includes `publishSkipped: true` to indicate publish was skipped
  - POST sync still returns 503 when contract IS configured but publish fails (production path unchanged)
  - GET readiness returns `ready: true` when sync scripts exist, even if contract is unconfigured
- **Validation contract (TC-XX):**
  - TC-01: POST sync with contract unconfigured + valid CSV → 200 with `ok: true, publishSkipped: true, display.requiresXaBBuild: true`
  - TC-02: POST sync with contract configured + publish success → 200 with `ok: true, publishSkipped: undefined` (existing behavior unchanged)
  - TC-03: POST sync with contract configured + publish failure → 502/503 (existing error behavior unchanged)
  - TC-04: GET readiness with contract unconfigured + scripts present → `ready: true, contractConfigured: false`
  - TC-05: GET readiness with contract unconfigured + scripts missing → `ready: false` (existing behavior)
- **Execution plan:**
  - Red: Call POST sync endpoint locally → confirm 503 with `catalog_publish_unconfigured`
  - Green: In `runSyncPipeline()` (around line 600), check `getCatalogContractReadiness()` before calling `publishCatalogArtifactsToContract()`. If `configured === false`, skip publish and return success response with `publishSkipped: true`. In GET handler (around line 914), change `ready` to not require `contractReadiness.configured` — only require `syncReadiness.ready`.
  - Refactor: Verify the UI (CatalogSyncPanel) correctly shows success message on `ok: true` response.
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** None: the UI consumer path is fully traced — `catalogConsoleActions.ts:426-437` checks `data.ok` then `display.requiresXaBBuild` for the success message.
- **Edge Cases & Hardening:**
  - Dry-run mode with contract unconfigured → should still work (dryRun + publishSkipped both true)
  - Cloud sync mode with contract unconfigured → same behavior (skip publish in `runCloudSyncPipeline()` too)
  - Race condition: contract becomes configured between readiness check and publish → not an issue (publish is idempotent)
- **What would make this >=90%:**
  - Unit test mocking `getCatalogContractReadiness()` to return `{ configured: false }`, verifying 200 response
- **Rollout / rollback:**
  - Rollout: Deploy updated sync endpoint. Production has contract configured → no change in behavior.
  - Rollback: Revert the single file change.
- **Documentation impact:** None
- **Consumer tracing:**
  - Modified behavior: POST `/api/catalog/sync` returns 200 instead of 503 when contract unconfigured
  - Consumer: `catalogConsoleActions.ts:handleSyncImpl()` — checks `data.ok` (line 426). With `ok: true`, enters success path (line 429+). Checks `display.requiresXaBBuild` (line 430) → shows rebuild message. No code change needed in consumer.
  - New field: `publishSkipped: true` in response — informational only, no consumer reads it yet. Dead-end field is acceptable here (it's metadata for operator debugging, not a functional dependency).
  - Modified behavior: GET readiness no longer requires contract configured → `ready: true` with scripts present
  - Consumer: `CatalogSyncPanel.client.tsx` readiness display. Currently shows "unconfigured" warning when `contractConfigErrors.length > 0`. This still works — it warns about missing contract but doesn't block sync.
- **Notes / references:**
  - Success response shape: `sync/route.ts:640-652`
  - Unconfigured error path: `sync/route.ts:617-636`
  - GET readiness: `sync/route.ts:865-927`

### TASK-03: Add local artifact fallback to xa-b build script
- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-b/scripts/build-xa.mjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-b/scripts/build-xa.mjs`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — build-xa.mjs fallback chain is well-understood (ensureRuntimeCatalogSeed → syncCatalogFromContract). The local artifacts path (`../../xa-uploader/data/sync-artifacts/xa-b/catalog.json`) is a known location.
  - Approach: 90% — Add one more file check in the "no URL" branch. Existing fallback pattern to follow.
  - Impact: 85% — Enables xa-b to consume fresh data from xa-uploader without contract.
- **Acceptance:**
  - When contract URL is not set and local artifacts exist at `../../xa-uploader/data/sync-artifacts/xa-b/catalog.json`, build uses them as catalog source
  - `catalog.runtime.meta.json` records `source: "local-artifacts"` with artifact path
  - When contract URL IS set, existing behavior unchanged (fetch from contract)
  - When local artifacts don't exist and contract not set, falls back to committed catalog.json (existing behavior)
- **Validation contract (TC-XX):**
  - TC-01: No contract URL + local artifacts exist → catalog.runtime.json updated from local artifacts, meta.source = "local-artifacts"
  - TC-02: No contract URL + no local artifacts → fallback to catalog.json, meta.source = "fallback" (existing behavior)
  - TC-03: Contract URL set + local artifacts exist → fetch from contract (contract takes priority), meta.source = "contract"
  - TC-04: Local artifacts catalog.json has different product count than committed catalog.json → runtime catalog reflects local artifact count
- **Execution plan:**
  - Red: Confirm build-xa.mjs uses committed catalog.json as fallback when contract URL is not set
  - Green: In `syncCatalogFromContract()`, in the "no URL" branch (lines 81-88), before writing fallback metadata and returning, check if `../../xa-uploader/data/sync-artifacts/xa-b/catalog.json` exists. If it does, read it, validate it has a `products` array, write to runtime catalog files, write meta with `source: "local-artifacts"`, and return.
  - Refactor: Verify `demoData.ts` correctly imports the updated catalog.runtime.json (it's a static JSON import — works automatically).
- **Planning validation (required for M/L):** None: S effort
- **Scouts:** Path resolution: `build-xa.mjs` uses `path.resolve(__dirname, ...)` — verify `__dirname` is `apps/xa-b/scripts/` and `../../xa-uploader/data/sync-artifacts/xa-b/` resolves correctly.
- **Edge Cases & Hardening:**
  - Local artifacts file exists but is invalid JSON → skip, fall through to committed catalog.json fallback
  - Local artifacts file exists but has no `products` array → skip, fall through to fallback
  - Local artifacts include `catalog.media.json` → also read and write to `catalog.media.runtime.json` if present
- **What would make this >=90%:**
  - Integration test: write a mock local artifact, run build-xa.mjs, verify runtime catalog matches
- **Rollout / rollback:**
  - Rollout: Deploy updated build script. Production has contract URL set → no change in behavior.
  - Rollback: Revert the single file change.
- **Documentation impact:** None
- **Consumer tracing:**
  - Modified behavior: `syncCatalogFromContract()` gains a new source in the fallback chain
  - New meta value: `source: "local-artifacts"` in catalog.runtime.meta.json
  - Consumer: `demoData.ts` reads `catalog.runtime.meta.json` for freshness display. The `source` field is used for `XA_CATALOG_RUNTIME_META` export. Type is `string` — new value is safe.
  - Consumer: `demoData.ts` reads `catalog.runtime.json` — CatalogPayload shape, same as always. No change needed.
- **Notes / references:**
  - Fallback chain: `build-xa.mjs:73-192`
  - Local artifacts path: `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json`

### TASK-04: End-to-end local pipeline verification
- **Type:** CHECKPOINT
- **Execution-Skill:** lp-do-build
- **Effort:** S
- **Status:** Pending
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -
- **Checkpoint scope:**
  1. Run xa-uploader sync: `curl -X POST http://localhost:3020/api/catalog/sync -H 'Content-Type: application/json' -d '{"options":{},"storefront":"xa-b"}'` → expect 200 with `ok: true`
  2. Verify sync artifacts generated at `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json`
  3. Run xa-b build: `cd apps/xa-b && node scripts/build-xa.mjs` (or `pnpm build` without full next build) → expect catalog.runtime.json updated from local artifacts
  4. Verify `catalog.runtime.meta.json` shows `source: "local-artifacts"`
  5. Start xa-b dev server and verify products render in browser
- **Success criteria:** Products added via xa-uploader CSV appear in xa-b storefront without any contract endpoint configuration.
- **Failure actions:** If any step fails, diagnose the specific step, update the relevant IMPLEMENT task, and replan.

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sync endpoint change breaks production contract flow | Low | High | Guarded by `getCatalogContractReadiness()` — only affects unconfigured state. Production always has contract configured. |
| CSV column mapping drifts from schema | Low | Low | One-time seed; CSV becomes source of truth. Column order defined in catalogCsvColumns.ts. |
| build-xa.mjs path resolution differs in CI vs local | Low | Medium | Use path.resolve with __dirname. Existing catalog.json fallback remains as safety net. |

## Observability
- `catalog.runtime.meta.json` tracks source: `"contract"` / `"fallback"` / `"local-artifacts"` — distinguishes data origin
- Sync response includes `publishSkipped: true` when contract is unconfigured — visible in UI logs

## Acceptance Criteria (overall)
- [ ] xa-uploader sync returns 200 (not 503) when contract unconfigured
- [ ] xa-b build consumes local sync artifacts when contract URL not set
- [ ] Products from xa-uploader CSV appear in xa-b storefront
- [ ] Production contract-based flow unaffected (existing behavior preserved)
- [ ] Typecheck passes: `pnpm typecheck`
- [ ] Lint passes: `pnpm lint`

## Decision Log
- 2026-03-04: Chosen approach: skip publish when unconfigured + local artifact fallback. Rejected contract stub server (heavyweight, unnecessary).
- 2026-03-04: CSV seed from catalog.runtime.json (12 products, full data) rather than catalog.json (10 products, less data).

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- Overall = (85 + 85 + 85) / 3 = 85%

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Seed products CSV | Yes — catalog.runtime.json exists, CSV column schema available | None | No |
| TASK-02: Sync graceful skip | Yes — sync endpoint code understood, error path mapped | None | No |
| TASK-03: Build fallback | Yes — build-xa.mjs fallback chain understood, monorepo paths verified | None | No |
| TASK-04: E2E checkpoint | Partial — requires all three IMPLEMENT tasks complete | [Missing data dependency] [Minor]: xa-uploader dev server must be running for sync curl; xa-b dev server must be running for browser check | No (operational, not code dependency) |
