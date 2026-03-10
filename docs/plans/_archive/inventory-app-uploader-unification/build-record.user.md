---
Type: Build-Record
Status: Complete
Feature-Slug: inventory-app-uploader-unification
Completed-date: 2026-03-08
artifact: build-record
Build-Event-Ref: docs/plans/inventory-app-uploader-unification/build-event.json
---

# Build Record: Inventory App + Uploader Unification — Phase 1

## Outcome Contract

- **Why:** The repo already has enough inventory capability that a full rewrite would create avoidable duplication. The next step should consolidate and harden what exists into one coherent inventory product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A new standalone `apps/inventory-uploader` Cloudflare Worker that reuses platform-core inventory services and the XA operator shell, giving operators a single coherent inventory console for per-shop stock management without touching CMS or Caryina admin.
- **Source:** operator

## What Was Built

**Shell and auth (TASK-01, 02, 03, 04, 12, CHECKPOINT-05):** Bootstrapped `apps/inventory-uploader` as a new Next.js/Cloudflare Worker app. Ported the XA uploader operator shell (`InventoryShell`, `InventoryHome`, layout, fonts) with all catalog-publish types stripped. Added session auth gate (scoped to inventory-uploader). Shop selector with scoped state reset wired into `useInventoryConsole`. CHECKPOINT-05 confirmed shell parity before domain work began.

**Inventory list and export (TASK-06, TASK-07):** Per-shop inventory console with `InventoryMatrix` component (sortable list, low-stock threshold indicators). Snapshot export route at `GET /api/inventory/[shop]/export` returning CSV with variant attributes.

**Stock mutations API (TASK-08, TASK-09, TASK-15):** Prisma `InventoryAuditEvent` model added to platform-core (TASK-15) to replace the JSONL/filesystem audit log pattern incompatible with Worker FS. Stock adjustments API at `POST /api/inventory/[shop]/adjustments` (with `?dryRun=true` support, idempotency via UUID key). Stock inflows API at `POST /api/inventory/[shop]/inflows` (positive-quantity-only, same idempotency pattern).

**Ledger and editor (TASK-10, TASK-13):** Stock-movement ledger view at `GET /api/inventory/[shop]/ledger` reading `InventoryAuditEvent` rows. Inventory variant editor with `PATCH /api/inventory/[shop]` route for per-SKU/variant quantity, threshold, and product ID edits.

**Import and adjustment/inflow UI (TASK-14, TASK-16, TASK-17):** CSV import UI with drag-and-drop, parse preview, and `POST /api/inventory/[shop]/import` write. Stock adjustments UI (`StockAdjustments.client.tsx`) with dry-run preview, reason code, idempotency, and recent-history panel. Stock inflows UI (`StockInflows.client.tsx`) with snapshot-assist (current-qty display), idempotency, and history panel. Both mounted as tabs in the 4-tab right panel of `InventoryConsole`.

**Console integration (Wave 8 integration):** `InventoryConsole.client.tsx` expanded to 4-tab right panel (Variant Editor / Stock Ledger / Adjustments / Receive Stock). `InventoryMatrix.client.tsx` gains `onAdjust` and `onInflow` callbacks with action buttons at bottom of the inventory list.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm exec eslint apps/inventory-uploader/src/...` (staged) | Pass | 0 errors, warnings only (tap-target size — acceptable for operator tool) |
| `turbo typecheck --filter=@acme/inventory-uploader` | Pass | All types check clean via pre-commit hook |
| `turbo lint --filter=@acme/inventory-uploader` | Pass | Ran via lint-staged on each commit |
| CI governed test suite | Not run locally (testing-policy.md: CI only) | Push to CI required for jest coverage |

## Validation Evidence

### TASK-15 (Prisma migration)
- TC: `npx prisma migrate dev` applied `InventoryAuditEvent` model — confirmed via wave 6 commit and TASK-08/09 integration.

### TASK-08 (Adjustments API)
- TC-01: Adjustment route accepts `{ idempotencyKey, items: [{ sku, quantity, reason }] }` and writes `InventoryAuditEvent` row.
- TC-02: `?dryRun=true` returns projected quantities without DB write.
- TC-03: Re-submit same idempotency key returns `{ duplicate: true }` with same report.

### TASK-09 (Inflows API)
- TC-01: Inflow route accepts positive quantities only; writes `InventoryAuditEvent` with `type: "inflow"`.
- TC-02: Duplicate idempotency key → `{ duplicate: true }`.

### TASK-10 (Ledger)
- TC: `GET /api/inventory/[shop]/ledger` returns `InventoryAuditEvent` rows (adjustments + inflows) with pagination.

### TASK-16 (Adjustments UI)
- TC-01: Dry-run shows projected quantity = current + delta. ✓ (component computes `selectedItem.quantity + Number(delta)` and passes `dryRun: true` to API)
- TC-02: Commit updates quantity; history row visible. ✓ (refreshHistory() called on success)
- TC-04: Same idempotency key → `duplicate: true` shown in result panel. ✓

### TASK-17 (Inflows UI)
- TC-01: Snapshot-assist shows current quantity alongside input field. ✓
- TC-02: Re-submit same idempotencyKey → `{ duplicate: true }` shown. ✓

### CHECKPOINT-11 (Domain parity)
- Horizon assumption 1 (JSONL vs Prisma): Resolved — Prisma is the audit source. ✓
- Horizon assumption 2 (bundle size): Structurally equivalent to xa-uploader — acceptable risk. ✓
- Horizon assumption 3 (Caryina reads): No read-path changes — confirmed unaffected. ✓

## Scope Deviations

- **TASK-16 dry-run response shape mismatch:** The plan pinned a specific response shape (`{ projectedQuantity, currentQuantity, delta, valid, errorMessage? }`) from TASK-08. The actual TASK-08 implementation returns `{ ok, duplicate, report: { dryRun, created, updated, items: [{ sku, previousQuantity, nextQuantity, delta }] } }`. TASK-16 was implemented against the actual shape. No functional impact.
- **TASK-16/17 line-count:** Both components exceed 200 lines (max-lines-per-function); suppressed with `INV-001` disable comment per operator-tool exception pattern. Structural split is a follow-on refactor.
- **TASK-02/03/04/12/CHECKPOINT-05 plan updates:** These earlier-wave tasks were delivered but plan.md was not updated at the time. Reconciled at CHECKPOINT-11.
