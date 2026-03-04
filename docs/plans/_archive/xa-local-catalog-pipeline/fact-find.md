---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Data
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: xa-local-catalog-pipeline
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-local-catalog-pipeline/plan.md
Trigger-Why: The xa-uploader to xa-b data pipeline is broken locally — sync errors on missing contract, build has no local fallback, CSV is empty. Decoupling data from images enables local dev workflow.
Trigger-Intended-Outcome: type: operational | statement: xa-uploader sync generates catalog artifacts locally, xa-b build consumes them directly, products flow from uploader to storefront without cloud dependencies | source: operator
---

# XA Local Catalog Pipeline Fact-Find Brief

## Scope

### Summary
The xa-uploader → xa-b data pipeline does not work locally. Sync returns 503 when the contract endpoint is unconfigured (even though artifacts are generated successfully). xa-b's build script has a fallback chain but requires the contract URL to be set for fresh data. No products CSV exists to seed the pipeline. The goal is to decouple data flow from cloud dependencies so products flow from uploader to storefront in local/dev environments.

### Goals
- Make xa-uploader sync succeed locally without a contract endpoint
- Enable xa-b to consume catalog artifacts directly from xa-uploader's output
- Seed the products CSV so the pipeline has input data
- Preserve the existing contract-based flow for production deployments

### Non-goals
- Image upload/R2 pipeline (separate plan — images out of scope)
- Changing the CatalogPayload schema (identical at every stage, no transformation needed)
- Cloud deployment or Cloudflare Worker configuration
- xa-uploader UI/UX changes (covered by xa-uploader-workflow-rebuild)

### Constraints & Assumptions
- Constraints:
  - Cloudflare free tier ONLY — Workers: 100K req/day, 10ms CPU, 128MB memory. R2: 10GB storage, 1M Class A writes/month, 10M Class B reads/month, zero egress.
  - Data pipeline only — images are out of scope (separate plan). Products must flow with placeholder/local images.
  - Static export to Cloudflare Pages for xa-b — no server-side rendering, no route handlers at runtime.
  - Monorepo — both apps can see each other's files at build time.
- Assumptions:
  - CatalogPayload format is identical at every pipeline stage (confirmed by code review — no transformation needed).
  - The `fast-csv` barrel import crash has been fixed (sub-path imports applied to 6 client files).
  - xa-b build can read files from xa-uploader's data directory since they share a monorepo workspace.

## Outcome Contract

- **Why:** The xa-uploader to xa-b data pipeline is broken locally — sync errors on missing contract, build has no local fallback, CSV is empty. Decoupling data from images enables local dev workflow.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader sync generates catalog artifacts locally, xa-b build consumes them directly, products flow from uploader to storefront without cloud dependencies.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — sync endpoint, 928 lines. POST handler routes to local FS or cloud pipeline; returns 503 when contract unconfigured.
- `apps/xa-b/scripts/build-xa.mjs` — build script, 250 lines. Fetches catalog from contract URL, falls back to committed catalog.json.
- `scripts/src/xa/run-xa-pipeline.ts` — sync pipeline script, 660 lines. Reads CSV, builds CatalogPayload + MediaIndexPayload, writes to sync-artifacts directory.

### Key Modules / Files
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — sync endpoint. POST handler with two runtime modes: local FS (spawns tsx scripts) and cloud (builds from draft snapshots). Both modes call `publishCatalogArtifactsToContract()` at the end, which throws `CatalogPublishError("unconfigured")` when env vars are missing.
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — contract HTTP client, 190 lines. `getCatalogContractReadiness()` returns `{ configured: false }` when `XA_CATALOG_CONTRACT_BASE_URL` or `XA_CATALOG_CONTRACT_WRITE_TOKEN` are unset.
- `apps/xa-b/scripts/build-xa.mjs` — pre-build orchestrator. Fallback chain: existing runtime files → seed from catalog.json → fetch from contract. Writes `catalog.runtime.json`, `catalog.media.runtime.json`, `catalog.runtime.meta.json`.
- `apps/xa-b/src/lib/demoData.ts` — static catalog loader, 93 lines. Imports `catalog.runtime.json` at build time, transforms to `XaProduct[]` with media URL hydration.
- `apps/xa-b/src/data/catalog.json` — committed fallback seed, ~10 Hermès products, 27KB.
- `apps/xa-b/src/data/catalog.runtime.json` — primary catalog, 12 products with multi-currency prices, 22KB. Auto-synced by build-xa.mjs.
- `scripts/src/xa/run-xa-pipeline.ts` — pipeline script. Args: `--products`, `--out`, `--media-out`, `--state`, `--currency-rates`. Outputs CatalogPayload JSON.
- `apps/xa-uploader/src/lib/catalogCsvColumns.ts` — CSV schema, 57 columns including taxonomy and details fields.
- `apps/xa-uploader/src/lib/catalogDraftToContract.ts` — cloud-mode artifact builder, 385 lines. Transforms `CatalogProductDraftInput[]` → CatalogPayload.

### Patterns & Conventions Observed
- Atomic file writes via temp→rename pattern — evidence: `build-xa.mjs` `writeRuntimeMeta()`.
- CatalogPayload shape (`{ collections, brands, products }`) is consistent at every stage — evidence: `run-xa-pipeline.ts:350-570`, `catalogDraftToContract.ts:274-384`, `build-xa.mjs:156-173`, `demoData.ts:66-88`.
- Sync artifacts written to `apps/xa-uploader/data/sync-artifacts/{storefrontId}/` — evidence: `sync/route.ts:149-154`.
- Build-time static JSON imports (not runtime file reads) — evidence: `demoData.ts:1-4`.
- Fallback with metadata tracking (source: "contract" vs "fallback") — evidence: `build-xa.mjs` `writeRuntimeMeta()`.

### Data & Contracts
- Types/schemas/events:
  - `CatalogPayload = { collections: CollectionSeed[], brands: BrandSeed[], products: CatalogProduct[] }` — shared across all pipeline stages
  - `MediaIndexPayload = { generatedAt, totals, items: { catalogPath, altText }[] }` — empty items array in current committed data
  - `CatalogProductDraftInput` — xa-uploader draft schema with taxonomy, details, image fields
  - `XaProductSeed` → `XaProduct` — xa-b build-time transformation adds hydrated media URLs
- Persistence:
  - Products CSV: `apps/xa-uploader/data/products-{storefrontId}.csv` (does NOT exist for xa-b)
  - Sync artifacts: `apps/xa-uploader/data/sync-artifacts/{storefrontId}/catalog.json` + `catalog.media.json`
  - Runtime catalog: `apps/xa-b/src/data/catalog.runtime.json` (written by build-xa.mjs)
  - Runtime media: `apps/xa-b/src/data/catalog.media.runtime.json` (written by build-xa.mjs)
  - Runtime meta: `apps/xa-b/src/data/catalog.runtime.meta.json` (source tracking)
  - Publish history: `apps/xa-uploader/data/publish-history/{storefrontId}.json`
- API/contracts:
  - Contract write: `PUT {XA_CATALOG_CONTRACT_BASE_URL}/{storefrontId}` with `X-XA-Catalog-Token` header
  - Contract read: `GET {XA_CATALOG_CONTRACT_READ_URL}` or computed from base URL + "/xa-b"
  - Both require env vars that are NOT set locally

### Dependency & Impact Map
- Upstream dependencies:
  - Products CSV (`products-xa-b.csv`) — does not exist, must be seeded
  - Currency rates (`apps/xa-uploader/data/currency-rates.json`) — must exist for multi-currency pricing
  - `fast-csv` sub-path imports (already fixed in this session)
- Downstream dependents:
  - `apps/xa-b/src/lib/demoData.ts` — imports `catalog.runtime.json` statically at build time
  - `apps/xa-b/src/lib/search/xaSearchConfig.ts` — converts XA_PRODUCTS to MiniSearch docs
  - All xa-b pages: product listing, PDP, collection, brand, search
- Likely blast radius:
  - Sync endpoint behavior change (graceful skip vs 503) — contained to xa-uploader sync API
  - Build script fallback path addition — contained to `build-xa.mjs`
  - CSV seed generation — one-time data transformation, no code impact

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (governed test runner via `pnpm -w run test:governed`)
- Commands: Tests run in CI only (`docs/testing-policy.md`). Never run locally.
- CI integration: GitHub Actions reusable workflow

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| catalogAdminSchema | Unit | `apps/xa-uploader/src/lib/__tests__/catalogAdminSchema.test.ts` | Schema validation tests exist |
| action-feedback | Unit | `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` | UI feedback logic tested |
| xaListingUtils | Unit | `apps/xa-b/src/lib/__tests__/xaListingUtils.test.ts` | Listing utility functions |
| useXaListingFilters | Unit | `apps/xa-b/src/lib/__tests__/useXaListingFilters.test.tsx` | Filter hook tests |

#### Coverage Gaps
- No tests for sync endpoint (`sync/route.ts`) — 928 lines untested
- No tests for `build-xa.mjs` build script
- No tests for `run-xa-pipeline.ts` pipeline script
- No tests for `catalogContractClient.ts` publish/readiness checks

#### Testability Assessment
- Easy to test: sync endpoint behavior change (mock contract client, verify response shape changes)
- Easy to test: build-xa.mjs local file fallback (mock filesystem, verify correct file read)
- Hard to test: Full pipeline integration (requires CSV + pipeline script + build script chain)

#### Recommended Test Approach
- Unit tests for: sync endpoint graceful-skip logic (mock `getCatalogContractReadiness`, verify 200 instead of 503)
- Integration tests for: build-xa.mjs local artifact resolution (verify it reads from xa-uploader sync-artifacts path)
- Contract tests for: CatalogPayload shape consistency between pipeline output and build-xa.mjs expectations

### Recent Git History (Targeted)
- `apps/xa-uploader/src/components/catalog/*.tsx` — barrel import fix (this session): 6 client files changed from `@acme/lib/xa` to sub-path imports to prevent fast-csv crash
- `docs/plans/xa-uploader-workflow-rebuild/` — active plan for product authoring UX, TASK-01 complete (2026-03-03). Complementary scope (form workflow vs data pipeline).

## Questions

### Resolved
- Q: Is the CatalogPayload format identical at every pipeline stage?
  - A: Yes. `{ collections, brands, products }` shape is used in run-xa-pipeline.ts output, catalogDraftToContract.ts output, contract PUT payload, build-xa.mjs input, and demoData.ts import. No transformation is needed.
  - Evidence: `run-xa-pipeline.ts:350-570`, `catalogDraftToContract.ts:274-384`, `build-xa.mjs:156-173`, `demoData.ts:66-88`

- Q: Where exactly does the sync endpoint fail when the contract is unconfigured?
  - A: `catalogContractClient.ts` line 123-129 throws `CatalogPublishError("unconfigured")`. Caught in `sync/route.ts:617-636`, returns HTTP 503 with error `"catalog_publish_unconfigured"`. The sync artifacts ARE already generated successfully at this point — only the publish step fails.
  - Evidence: `catalogContractClient.ts:44-51` (`getCatalogContractReadiness`), `sync/route.ts:605-636`

- Q: Can build-xa.mjs read files from xa-uploader's directory?
  - A: Yes. Monorepo structure means both apps can reference each other's files at build time via relative paths. build-xa.mjs already reads from `apps/xa-b/src/data/` — extending to `apps/xa-uploader/data/sync-artifacts/xa-b/` is straightforward.
  - Evidence: monorepo workspace structure, `build-xa.mjs` file read patterns

- Q: What seed data exists?
  - A: `apps/xa-b/src/data/catalog.json` has ~10 Hermès products in full CatalogPayload format (27KB). `catalog.runtime.json` has 12 products with multi-currency prices (22KB). Either can be reverse-mapped to CSV format for seeding.
  - Evidence: `catalog.json` (1060 lines), `catalog.runtime.json` (484 lines)

- Q: Does the xa-uploader-workflow-rebuild plan overlap?
  - A: No material overlap. That plan focuses on authoring UX (step-based workflow, required vs optional fields, createdAt auto-generation). This plan focuses on data flow (sync graceful skip, build fallback, CSV seeding). They are complementary.
  - Evidence: `docs/plans/xa-uploader-workflow-rebuild/plan.md` scope section

### Open (Operator Input Required)
None. All questions resolved from available evidence.

## Confidence Inputs
- Implementation: 90% — All code paths are well-understood. Sync endpoint has a clear error path to modify. Build script has an existing fallback mechanism to extend. CSV seeding is a data transformation of known shapes. Raise to 95: add unit test for sync graceful-skip behavior.
- Approach: 95% — CatalogPayload format is identical everywhere; no schema changes needed. Monorepo cross-app file reads are standard. The approach is minimal: skip publish when unconfigured, add local artifact path to build fallback chain.
- Impact: 85% — Unblocks local development workflow for the entire xa data pipeline. Enables iterating on products without cloud dependencies. Does not affect production contract-based flow.
- Delivery-Readiness: 90% — All tools, patterns, and infrastructure are in place. The fast-csv barrel fix is already applied. No new dependencies needed.
- Testability: 75% — No existing tests for the affected files (sync endpoint, build script, pipeline). New unit tests can be added for the sync graceful-skip. Integration testing of the full pipeline is harder but not blocking. Raise to 85: add targeted tests for the sync endpoint behavior change.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sync endpoint behavior change breaks production flow | Low | High | Guard behind `getCatalogContractReadiness()` — only changes behavior when contract IS unconfigured. Production always has contract configured. |
| CSV seed data drifts from catalog.json | Low | Low | One-time seed; CSV becomes source of truth after initial population. |
| Build-xa.mjs local path resolution breaks on CI | Low | Medium | Use monorepo-relative paths; test in CI. Existing fallback to catalog.json remains as safety net. |
| Multi-currency rates missing in local pipeline | Medium | Low | Pipeline already handles missing rates gracefully (defaults to 1.0 for all currencies). Seed currency-rates.json from existing data. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Atomic file writes (temp→rename) for catalog runtime files
  - CatalogPayload shape must remain identical at all pipeline stages
  - Env var configuration pattern for contract endpoint (add, don't change)
- Rollout/rollback expectations:
  - Changes are backward-compatible: production contract flow is unaffected
  - Local-only changes can be tested by running xa-uploader sync then xa-b build
- Observability expectations:
  - `catalog.runtime.meta.json` already tracks source ("contract" vs "fallback") — extend with "local-artifacts" source

## Suggested Task Seeds (Non-binding)
1. **Make sync endpoint graceful when contract unconfigured** — Modify `sync/route.ts` to return 200 with artifacts path (instead of 503) when `getCatalogContractReadiness()` returns `{ configured: false }`. Artifacts are already generated; only the publish step should be skipped.
2. **Add local artifact fallback to build-xa.mjs** — Extend the fallback chain to check `apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json` before falling back to committed `catalog.json`. Write meta with `source: "local-artifacts"`.
3. **Seed products CSV from catalog.json** — Transform existing `catalog.json` (or `catalog.runtime.json`) into CSV format at `apps/xa-uploader/data/products-xa-b.csv`. One-time data generation using the column schema from `catalogCsvColumns.ts`.
4. **Verify end-to-end local pipeline** — Run xa-uploader sync → verify artifacts generated → run xa-b build → verify products rendered. This is the integration checkpoint.

## Execution Routing Packet
- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - xa-uploader sync returns 200 (not 503) when contract unconfigured
  - xa-b build consumes local sync artifacts
  - Products from xa-uploader appear in xa-b storefront
  - Production contract-based flow unaffected
- Post-delivery measurement plan:
  - Run xa-uploader sync locally, verify 200 response with artifacts path
  - Run xa-b build, verify catalog.runtime.json updated from local artifacts
  - Open xa-b in browser, verify products displayed

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Sync endpoint error path | Yes | None | No |
| Contract client readiness check | Yes | None | No |
| Build script fallback chain | Yes | None | No |
| CatalogPayload format consistency | Yes | None | No |
| CSV column schema | Yes | None | No |
| Pipeline script inputs/outputs | Yes | None | No |
| Runtime meta tracking | Yes | None | No |
| Image pipeline separation | Yes | None (explicitly out of scope) | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Four targeted changes to well-understood code paths. CatalogPayload format is identical everywhere (no schema changes). All affected files are mapped. Scope is bounded to data flow only (images explicitly excluded). Risk is low because production contract flow is unaffected.

## Evidence Gap Review

### Gaps Addressed
- Confirmed CatalogPayload format is identical at all pipeline stages (no hidden transformation)
- Confirmed sync artifacts ARE generated before the publish step that fails with 503
- Confirmed build-xa.mjs already has a fallback mechanism (catalog.json seed)
- Confirmed CSV column schema matches CatalogProductDraftInput fields

### Confidence Adjustments
- Implementation raised from initial 85% to 90% after confirming no schema changes needed
- Approach raised from initial 90% to 95% after confirming monorepo cross-app reads are standard

### Remaining Assumptions
- Currency rates file exists or pipeline handles missing rates gracefully (confirmed: defaults to 1.0)
- Build-xa.mjs relative path resolution works from CI (mitigated by existing catalog.json fallback)

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-local-catalog-pipeline --auto`
