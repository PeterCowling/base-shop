---
Type: Build-Record
Status: Complete
Feature-Slug: xa-local-catalog-pipeline
Completed-date: 2026-03-04
artifact: build-record
Build-Event-Ref: docs/plans/xa-local-catalog-pipeline/build-event.json
---

# Build Record: XA Local Catalog Pipeline

## Outcome Contract

- **Why:** The xa-uploader to xa-b data pipeline is broken locally — sync errors on missing contract, build has no local fallback, CSV is empty. Decoupling data from images enables local dev workflow.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader sync generates catalog artifacts locally, xa-b build consumes them directly, products flow from uploader to storefront without cloud dependencies.
- **Source:** operator

## What Was Built

Three targeted changes to unblock the local xa-uploader to xa-b data pipeline:

**Seed CSV (TASK-01):** Created `scripts/src/xa/seed-xa-csv.ts` which reads the existing 12-product catalog from `catalog.runtime.json`, maps each product to the 57-column CSV schema defined in `catalogCsvColumns.ts`, and writes `apps/xa-uploader/data/products-xa-b.csv`. This provides the pipeline input data that was previously missing.

**Sync endpoint graceful skip (TASK-02):** Modified `apps/xa-uploader/src/app/api/catalog/sync/route.ts` to check contract readiness before attempting publish. When the contract endpoint is unconfigured, the sync now returns 200 with `ok: true` and `publishSkipped: true` instead of failing with 503. The GET readiness endpoint no longer requires contract configuration to report ready. Extracted `tryPublishArtifactsToContract()` helper to keep complexity within lint limits. Both local-FS and cloud sync paths updated.

**Build script local fallback (TASK-03):** Modified `apps/xa-b/scripts/build-xa.mjs` to check for local sync artifacts at `../../xa-uploader/data/sync-artifacts/xa-b/catalog.json` before falling back to the committed `catalog.json`. When found, validates the JSON has a `products` array, writes to runtime catalog, and records `source: "local-artifacts"` in metadata. Also copies `catalog.media.json` if present.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm typecheck` | Pass | Only pre-existing cover-me-pretty editorial errors (known) |
| `pnpm lint` | Pass | Only pre-existing xa-uploader tap-size warning (known) |
| `npx tsx scripts/src/xa/seed-xa-csv.ts` | Pass | Generated 12-product CSV |
| `python3 csv.DictReader` verification | Pass | 12 rows parsed correctly |
| `node --check build-xa.mjs` | Pass | Syntax valid |

## Validation Evidence

### TASK-01
- TC-01: Seed script ran successfully — CSV written with 12 data rows + 1 header
- TC-02: CSV header matches `XA_PRODUCTS_CSV_COLUMN_ORDER` exactly (57 columns verified)
- TC-03: Pipe-delimited fields verified (e.g. `image_files` contains `|` separator for multi-image products)
- TC-04: Taxonomy fields populated (department, category, color, material all present)

### TASK-02
- TC-01: Code path verified — POST sync with contract unconfigured skips publish via `tryPublishArtifactsToContract()` returning `{ published: false, skipped: true }`, response returns 200 with `ok: true, publishSkipped: true`
- TC-02: Existing publish path preserved in `else` branch — unchanged when contract is configured
- TC-03: Error handling preserved in catch block — 502/503 responses unchanged
- TC-04: GET readiness now returns `ready: syncReadiness.ready` without requiring contract — verified in code
- TC-05: GET readiness still returns `ready: false` when scripts missing (syncReadiness.ready is false)

### TASK-03
- TC-01: Local artifact check added before fallback — reads `catalog.json`, validates `products` array, writes runtime files with `source: "local-artifacts"`
- TC-02: When local artifacts don't exist, catch block falls through to existing `source: "fallback"` path
- TC-03: Contract URL takes priority — `resolveCatalogReadUrl()` returns early if URL is set, local artifact check only runs in "no URL" branch
- TC-04: Media index handling added — copies `catalog.media.json` if present, silently skips if absent

## Scope Deviations

- Extracted `tryPublishArtifactsToContract()` helper in sync/route.ts — controlled scope expansion to resolve lint complexity violation (21 > 20 max). Same logic, better structure.
- Applied contract-skip to cloud sync pipeline (`runCloudSyncPipeline()`) in addition to local-FS pipeline — necessary for consistency since both paths share the same publish failure mode.
