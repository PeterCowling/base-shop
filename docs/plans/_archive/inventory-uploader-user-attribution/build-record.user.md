---
Type: Build-Record
Status: Complete
Feature-Slug: inventory-uploader-user-attribution
Completed: 2026-03-13
Execution-Track: code
---

# Build Record — Inventory Uploader User Attribution

## What was built

Every stock adjustment and stock inflow now records which network address made the change. Before this change, the `operatorId` column on every stock event was always blank — there was no record of who performed any stock operation. After this change, the requester's IP address is captured from the HTTP request headers and stored in `operatorId` on every write.

The ledger endpoint (`GET /api/inventory/[shop]/ledger`) now includes `operatorId` in each event returned, so the audit history shows the IP address of whoever made each change.

## Files changed

- `packages/platform-core/src/types/stockAdjustments.ts` — added `ip?: string` to `StockAdjustmentActor`
- `packages/platform-core/src/types/stockInflows.ts` — added `ip?: string` to `StockInflowActor`
- `packages/platform-core/src/repositories/stockAdjustments.server.ts` — replaced `operatorId: null` with `options?.actor?.ip || null`
- `packages/platform-core/src/repositories/stockInflows.server.ts` — replaced `operatorId: null` with `options?.actor?.ip || null`
- `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` — extract IP, build actor, pass to `applyStockAdjustment`
- `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts` — extract IP, build actor, pass to `receiveStockInflow`
- `apps/inventory-uploader/src/lib/inventory-utils.ts` — added `operatorId: string | null` to `LedgerEvent` type
- `apps/inventory-uploader/src/app/api/inventory/[shop]/ledger/route.ts` — added `operatorId` field to response mapper

## Engineering Coverage Evidence

| Coverage Area | Evidence |
|---|---|
| UI / visual | N/A — no UI changes |
| UX / states | N/A — API response change is additive; existing consumers unaffected |
| Security / privacy | IP extracted server-side from trusted headers; cannot be supplied by caller via request body; `null` stored gracefully when proxy header trust is disabled |
| Logging / observability / audit | `operatorId` now written to `InventoryAuditEvent` on every non-dryRun stock write; visible in ledger GET response |
| Testing / validation | TypeScript build passed (pre-commit hook ran turbo typecheck across both affected packages); lint passed |
| Data / contracts | `StockAdjustmentActor`, `StockInflowActor`, and `LedgerEvent` types updated; Zod event schemas unchanged (nested actor objects are not `.strict()`); change confirmed backward-compatible |
| Performance / reliability | N/A — synchronous IP extraction, one additional nullable field in DB write |
| Rollout / rollback | Additive change; null rows pre-deploy remain valid; rollback = code revert; no migration to reverse |

## Validation

- TypeScript: passed (turbo typecheck — `@acme/platform-core` and `@acme/inventory-uploader`)
- Lint: passed (turbo lint — both packages)
- Pre-commit hook: all 15 tasks successful

## Outcome Contract Verification

- **Stated outcome:** Every stock change record shows which staff member made it, enabling accountability and easier error investigation.
- **Delivered:** Every `InventoryAuditEvent` row written after this deploy will carry `operatorId` set to the requester's IP address (or null when proxy headers are disabled). The ledger GET endpoint exposes `operatorId` in each event. Staff can now query the ledger to see which IP address submitted each stock change.
- **Limitation:** The current auth model is single-token (all staff share one session). `operatorId` stores an IP address, not a named user. This is the maximum attribution available without adding per-user accounts.
