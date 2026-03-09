---
Type: Replan-Notes
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-status-and-media-model-rewrite
Replan-round: 1
---

# XA Uploader Status and Media Model Rewrite Replan Notes

## Scope
- Invocation: `lp-do-replan`
- Mode: standard
- Targeted tasks: `TASK-02`, `TASK-03`, `TASK-04`
- Outcome: ready

## Why Replan Was Needed
- `TASK-02`, `TASK-03`, and `TASK-04` were all below the `IMPLEMENT >=80%` build gate.
- The operator decision on legacy-data survival removed one unknown, but repo review showed two hidden seams still embedded inside downstream IMPLEMENT tasks:
  - fail-closed cleanup behavior for legacy CSV/cloud/runtime rows
  - cart quantity and stale-cart behavior after `stock` removal

## Evidence Summary

### E1 — File Review
- `apps/xa-b/src/contexts/XaCartContext.tsx`
  - `maxQtyForLine()` still computes availability from `sku.stock`, `sold`, and `reservedOther`.
- `apps/xa-b/src/app/cart/page.tsx`
  - `QuantityInput` still uses `max={line.sku.stock}`.
- `apps/xa-b/src/components/XaBuyBox.client.tsx`
  - PDP still exposes quantity increment/decrement controls independent of status-only semantics.
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - cloud draft payload parsing still validates against the current draft schema, so legacy row handling must be explicit if schema fields change.
- `apps/xa-uploader/src/lib/catalogCsv.ts`
  - CSV read/write paths still round-trip `rowToDraftInput()` and `buildCsvRowUpdateFromDraft()`.
- `packages/lib/src/xa/catalogCsvMapping.ts`
  - current CSV mapping still reads/writes `stock`, `publish_state=ready`, and role-derived `media_paths`.

### E2 — Repo-Wide Search
- Legacy status/media/persistence surface still appears in:
  - `apps/xa-uploader/src/lib/catalogCsvColumns.ts`
  - `apps/xa-uploader/data/products.xa-b.csv`
  - `apps/xa-uploader/src/lib/__tests__/catalogCsvMapping.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogDraftContractClient.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `apps/xa-b/src/data/catalog.runtime.json`
  - `apps/xa-b/src/data/catalog.media.runtime.json`
  - `apps/xa-b/src/lib/demoData.ts`
  - `apps/xa-b/src/components/XaImageGallery.client.tsx`
  - `apps/xa-b/src/i18n/en.json`
- This confirms the low-confidence issue was not lack of product definition. It was hidden breadth.

## Task Delta
- Added `TASK-06` as an `INVESTIGATE` precursor for fail-closed cleanup behavior across CSV, cloud draft, and runtime fixture paths.
- Added `TASK-07` as an `INVESTIGATE` precursor for status-only cart quantity and stale-cart semantics.
- Updated `TASK-02` to depend on `TASK-06` and `TASK-07`; confidence raised from `75%` to `85%`.
- Updated `TASK-03` to depend on `TASK-06` and `TASK-02`; confidence raised from `75%` to `85%`.
- Updated `TASK-04` confidence from `75%` to `82%` after enumerating the missing fixture/copy/test surface and closing the cleanup/quantity seams.

## Precursor Intent

### TASK-06
- Goal: decide one cleanup mode per legacy-shaped surface: `discard`, `regenerate`, or `ignore on read`.
- Reason it is separate: build tasks should not invent cleanup behavior ad hoc while changing schema/routes/UI.

### TASK-07
- Goal: decide one explicit quantity/stale-cart rule for status-only availability.
- Reason it is separate: `stock` removal otherwise changes PDP controls, cart clamping, and persistence behavior implicitly.

## TASK-06 Outcome

### Legacy Cleanup Contract
| Surface | Mode | Decision |
|---|---|---|
| Local uploader CSV draft rows via `catalogCsv.ts` and `rowToDraftInput()` | `discard` | Rows that do not satisfy the new canonical schema are dropped from read results instead of being migrated forward. Successful saves rewrite only canonical rows. |
| Cloud draft snapshot products via `parseSnapshotPayload()` in `catalogDraftContractClient.ts` | `ignore on read` | Invalid legacy product entries are filtered out during snapshot reads so one stale entry does not block the whole draft surface. A later canonical save regenerates the surviving snapshot shape. |
| Checked-in sample/runtime artifacts (`products.xa-b.csv`, `catalog.runtime.json`, `catalog.media.runtime.json`) | `regenerate` | Repo fixtures are rewritten to the canonical status/media contract; no backward-compatible fixture shape is retained. |
| Contract serializers/hydrators (`catalogCsvColumns.ts`, `catalogCsvMapping.ts`, `catalogDraftToContract.ts`, `demoData.ts`) | `regenerate` | Writers and readers move to the canonical shape only; compatibility fields are removed rather than dual-written. |

### Consequence For Build Tasks
- `TASK-02` can remove compatibility-preserving status/stock logic entirely.
- `TASK-03` can remove role-shaped media compatibility branches entirely.
- `TASK-04` must regenerate fixtures/tests/copy rather than preserving mixed old/new expectations.

## TASK-07 Outcome

### Status-Only Quantity Contract
- Quantity ceiling is binary:
  - `1` when product status is not `out_of_stock`
  - `0` when product status is `out_of_stock`
- PDP behavior:
  - remove the quantity stepper
  - `Add To Bag` always submits `qty = 1`
- Quick add behavior:
  - remains fixed at `qty = 1`
- Cart behavior:
  - line quantity is fixed at `1`
  - cart quantity editing is removed or rendered non-interactive
  - `setQty(0)` remains the remove-line path
- Stale-cart behavior:
  - cart lines reconcile against current catalog status by product id/slug during hydration/render
  - if the current product is `out_of_stock`, keep the line visible, mark it unavailable, block quantity increase/re-add, and allow manual removal only
- Inventory helper consequence:
  - `getAvailableStock()` becomes a status-derived binary helper instead of `stock - sold - reserved`
  - any sold/reserved arithmetic that becomes unused should be removed during `TASK-02`

### Consequence For Build Tasks
- `TASK-02` now has an explicit storefront availability rule rather than an in-task design decision.
- `TASK-04` must add regression coverage for stale-cart reconciliation and fixed-quantity cart behavior.

## Readiness Decision
- Status: ready
- Build now:
  - `TASK-02`
- `TASK-03` becomes runnable after `TASK-02`.
- `TASK-04` becomes runnable after `TASK-02` and `TASK-03`.
- Next replan trigger:
  - only if `TASK-02` or `TASK-03` discovers a new contract seam not covered by the cleanup/quantity rules above
