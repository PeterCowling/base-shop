---
Type: Build-Record
Status: Complete
Domain: API
Last-reviewed: 2026-03-12
Feature-Slug: xa-b-draft-product-storefront-visibility
Execution-Track: code
Completed-date: 2026-03-12
artifact: build-record
Build-Event-Ref: docs/plans/xa-b-draft-product-storefront-visibility/build-event.json
---

# Build Record: XA Draft Product Storefront Visibility

## Outcome Contract

- **Why:** Products can go live on the XA store without photos, breaking the shopping experience. P1 priority — store not ready for real customers until resolved.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing.
- **Source:** operator

## What Was Built

**TASK-01 (publish route fix):** Added `isCatalogPublishableState(deriveCatalogPublishState(product))` filter in `executeCloudPublish` (`apps/xa-uploader/src/app/api/catalog/publish/route.ts`) before the `buildCatalogArtifactsFromDrafts` call. This mirrors the already-correct sync route reference behavior and ensures only live/out_of_stock products (those with images and publish-ready state) appear in the catalog contract written to the live endpoint. A mixed-state snapshot test was added to `route.publish.test.ts` asserting that a draft product with empty `imageFiles` is excluded from the mock call.

**TASK-02 (xa-b defense layer):** Removed `"draft"` from the accepted value set in `normalizeProductStatus` in `apps/xa-b/src/lib/xaCatalogModel.ts` (line 186). The function now returns `null` for `"draft"` input; the existing `if (status === null) return products` guard in `parseXaCatalogModel` already handles null — draft products are silently dropped at catalog parse time. A new test file `xaCatalogModel.test.ts` was created covering draft-only (empty), mixed live+draft (live only), and out_of_stock (included) cases.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter xa-uploader typecheck` | Pass | Pre-commit hook — types generated successfully |
| `pnpm --filter xa-b typecheck` | Pass | Pre-commit hook — types generated successfully |
| `pnpm --filter xa-uploader lint` | Pass (0 errors) | Pre-commit hook — 3 pre-existing warnings, no new errors |
| `pnpm --filter xa-b lint` | Pass (0 errors) | Pre-commit hook — 2 pre-existing warnings, no new errors |
| `scripts/validate-engineering-coverage.sh` | Pass | `{ "valid": true, "errors": [], "warnings": [] }` |

CI tests (Jest) run in CI only per `docs/testing-policy.md` — will run on push.

## Workflow Telemetry Summary

4 stages recorded — `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, `lp-do-build`. 5 modules, 7 deterministic checks, 285,999 total context bytes across the pipeline. 4 records in `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`.

## Validation Evidence

### TASK-01
- TC-01: Logic trace confirms mixed-state snapshot (p1 live+images, p2 draft+empty imageFiles) → filter excludes p2 → `buildCatalogArtifactsFromDrafts` receives only p1. Test added in `route.publish.test.ts`.
- TC-02: All-live snapshot unaffected — filter returns all products (existing tests cover this path).
- TC-03: out_of_stock product with images → `deriveCatalogPublishState` returns `"out_of_stock"` → `isCatalogPublishableState("out_of_stock") === true` → included. TC-03 test added.
- TC-04: `pnpm --filter xa-uploader typecheck` — Pass (pre-commit hook).
- TC-05: `pnpm --filter xa-uploader lint` — Pass, 0 errors (pre-commit hook autofix sorted imports).

### TASK-02
- TC-01: `parseXaCatalogModel` with draft-only catalog → `normalizeProductStatus("draft")` returns null → product excluded → empty `products` array. Test file created.
- TC-02: live + draft → only live returned. Test covers.
- TC-03: out_of_stock → `normalizeProductStatus("out_of_stock")` still accepted → included. Test covers.
- TC-04: `pnpm --filter xa-b typecheck` — Pass (pre-commit hook).
- TC-05: `pnpm --filter xa-b lint` — Pass, 0 errors (pre-commit hook).

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | Evidence — TASK-02 removes draft products from catalog model at parse time; `filterAndSortProducts` and all listing pages never receive draft products | No broken-image cards possible |
| UX / states | Evidence — TASK-01 + TASK-02: `getAvailableStock` never sees a draft product after both fixes; add-to-cart path for draft items eliminated | Defense at both publish (contract) and parse (storefront) layers |
| Security / privacy | N/A | No auth or data exposure change |
| Logging / observability / audit | N/A | No log paths affected |
| Testing / validation | Evidence — New mixed-state snapshot test in `route.publish.test.ts`; new `xaCatalogModel.test.ts` with 3 TCs | Both regression gaps closed |
| Data / contracts | Evidence — Published catalog contract now excludes `status:"draft"` entries (TASK-01); xa-b model never contains `"draft"` (TASK-02) | Contract change is additive exclusion; live/out_of_stock format unchanged |
| Performance / reliability | N/A | `.filter()` on snapshot array and one condition removed from parse function; no hot-path impact |
| Rollout / rollback | Evidence — Standard Next.js/Cloudflare deploy; `git revert 7e67da512e` is clean; no data migration; per-fix rollback possible | Both fixes committed together in one commit |

## Scope Deviations

None. Import sort autofix by lint-staged (import added by TASK-01 was sorted into correct group automatically — this is expected behavior, not a scope change).
