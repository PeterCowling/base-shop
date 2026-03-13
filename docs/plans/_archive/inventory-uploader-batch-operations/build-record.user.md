---
Type: Build-Record
Feature-Slug: inventory-uploader-batch-operations
Build-Date: 2026-03-13
Status: Complete
---

# Build Record — Inventory Uploader Batch Operations

## Outcome Contract

- **Why:** Counting all the stock at the end of a season means updating dozens of items. Doing them one by one takes a very long time. A batch input approach cuts that work from hours to minutes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can submit multiple stock changes in a single operation, reducing end-of-stock-take time significantly.
- **Source:** operator

## Build Summary

All three tasks completed in a single build cycle (Wave 1 — all tasks independent).

**TASK-01 — StockAdjustments batch UI:**
- Rewrote `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx`
- Replaced single `selectedKey/delta/reason` state with `rows: BatchAdjRow[]` array
- New types: `BatchAdjRow = { key; selectedKey; delta; reason }`, `AdjResultItem` now includes `variantAttributes: Record<string,string>`
- `makeBlankRow()`, `updateRow()`, `addRow()`, `removeRow()` row management
- `submit(dryRun)` validates all filled rows, builds `items[]`, posts once
- Result panel uses composite key `${item.sku}:${JSON.stringify(attrs)}` — safe for multi-variant batches
- ESLint exemptions INV-0001 (ds/min-tap-size, ds/no-arbitrary-tailwind, ds/enforce-layout-primitives) and INV-0002 (react-hooks/exhaustive-deps) carried forward

**TASK-02 — StockInflows batch UI:**
- Rewrote `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx`
- Replaced single-item state with `rows: BatchInflowRow[]` array
- New types: `BatchInflowRow = { key; selectedKey; quantity }`, `InflowResultItem` and `PreviewItem` now include `variantAttributes`
- `buildItems()` helper validates rows and builds `items[]` array
- Any per-row field change (select or quantity) dismisses the preview (`setPreview(null)`)
- Preview and result panels use composite keys and `variantLabel()` for variant-aware display
- Same ESLint exemptions carried forward

**TASK-03 — Repository unit tests:**
- Created `packages/platform-core/src/repositories/__tests__/stockAdjustments.server.test.ts`
- 5 tests: single-item apply and inventory write, 2-SKU batch, idempotency (second call returns `duplicate: true`), PRODUCT_MISMATCH, dryRun (no inventory write, event.id === "dry-run")
- Follows exact pattern of existing `stockInflows.server.test.ts`: `jest.resetModules()` per test, `INVENTORY_BACKEND=json`, `SKIP_STOCK_ALERT=1`, `DATA_ROOT=tmpDir`

## Engineering Coverage Evidence

| Coverage Area | Delivered |
|---|---|
| UI / visual | Multi-row table with per-row SKU selector, delta/qty input, reason dropdown; variant-safe React keys throughout; compact gate-* tokens preserved |
| UX / states | Empty rows guard, per-row validation, PRODUCT_MISMATCH error, loading/busy state, dry-run preview state, success result |
| Security / privacy | No route changes; `variantAttributes` included only when non-empty; no new attack surface |
| Logging / observability | Per-item audit events handled by existing repository — unchanged |
| Testing / validation | 5 repository unit tests for adjustments (multi-item path previously uncovered) |
| Data / contracts | `BatchAdjRow`, `BatchInflowRow` types; `AdjResult`/`InflowResult` include `variantAttributes` |
| Performance / reliability | One POST per batch regardless of row count; 50-item batch ~5 KB |
| Rollout / rollback | No feature flag; rollback = redeploy |

## Validation Gates

- `pnpm --filter @acme/inventory-uploader typecheck` — pass
- `pnpm --filter @acme/inventory-uploader lint` — pass
- `pnpm --filter @acme/platform-core build` — pass
- `pnpm --filter @acme/platform-core lint` — pass
- `scripts/validate-engineering-coverage.sh docs/plans/inventory-uploader-batch-operations/plan.md` — `{ "valid": true }`

## Workflow Telemetry Summary

| Stage | Records | Modules | Context Input Bytes | Artifact Bytes | Tokens |
|---|---:|---:|---:|---:|---:|
| lp-do-fact-find | 1 | 1.00 | 49703 | 29580 | 0.0% |
| lp-do-plan | 1 | 1.00 | 69868 | 35193 | 0.0% |
| lp-do-build | 1 | 2.00 | 89806 | 0 | 0.0% |

**Totals:** Context input bytes: 209,377 — Artifact bytes: 64,773 — Modules counted: 4 — Deterministic checks: 5
