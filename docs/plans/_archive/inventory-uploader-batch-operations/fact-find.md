---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: inventory-uploader-batch-operations
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Dispatch-ID: IDEA-DISPATCH-20260313190000-0002
Trigger-Why: Counting all the stock at the end of a season means updating dozens of items. Doing them one by one takes a very long time. A batch input approach would cut that work from hours to minutes.
Trigger-Intended-Outcome: type: operational | statement: Staff can submit multiple stock changes in a single operation, reducing end-of-stock-take time significantly. | source: operator
---

# Inventory Uploader — Batch Operations Fact-Find Brief

## Scope

### Summary

Staff currently submit stock adjustments and stock inflows one item at a time via forms that select a single SKU, enter a delta/quantity, and POST a single-item `items[]` array to the API. The API layer already accepts an `items` array (Zod schema enforces `min(1)` but has no `max`), so the back-end already supports multi-item payloads structurally. The gap is entirely in the UI: the forms have no way to queue or submit multiple rows in one operation. This work would close that gap for end-of-season stock-takes where dozens of SKUs need updating.

### Goals

- Allow staff to submit adjustments for multiple SKUs in a single API call (batch adjustment).
- Allow staff to receive stock for multiple SKUs in a single API call (batch inflow).
- Reduce end-of-season stock-take from hours to minutes.

### Non-goals

- Changes to the import route (`/api/inventory/[shop]/import`) — it already handles bulk full-catalogue updates (CSV/JSON file). Batch adjustments/inflows are additive delta operations, not full catalogue replacements.
- Automated stock-take triggering or scheduling.
- Mobile-specific layout optimisation (tool is already a desktop operator console).

### Constraints & Assumptions

- Constraints:
  - The existing API schemas already define `items: z.array(...).min(1)` — no schema changes are required to accept multiple items in one call; only UI changes are needed for the core batch path.
  - A single shared `idempotencyKey` per batch POST is the current design — multiple items share one key. This works correctly as the idempotency check is per `referenceId` + `type` (one audit event per item-row).
  - The `reason` field on adjustments applies per-item in the schema, meaning a mixed-reason batch is already supported structurally.
- Assumptions:
  - Typical shop SKU count at end of season: 10–50 rows (observed max in data: 12 for cochlearfit). A multi-row form (not CSV) is the right fit for this scale.
  - Staff are comfortable entering data in a tabular form with one row per SKU. A CSV upload for adjustments/inflows would be over-engineered for this volume.
  - The `note` field remains batch-level (one note for the entire operation), consistent with current schema.

## Outcome Contract

- **Why:** Counting all the stock at the end of a season means updating dozens of items. Doing them one by one takes a very long time. A batch input approach would cut that work from hours to minutes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can submit multiple stock changes in a single operation, reducing end-of-stock-take time significantly.
- **Source:** operator

## Current Process Map

None: local code path only — this is a pure UI enhancement that changes how many items are collected before a single API POST. No workflow, approval path, CI lane, or operator runbook is affected.

## Evidence Audit (Current State)

### Entry Points

- `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` — POST handler for stock adjustments; delegates to `applyStockAdjustment`
- `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts` — POST handler for stock inflows; delegates to `receiveStockInflow`
- `apps/inventory-uploader/src/app/api/inventory/[shop]/import/route.ts` — POST handler for full-catalogue CSV/JSON import; already batch-capable

### Key Modules / Files

- `packages/platform-core/src/types/stockAdjustments.ts` — Zod schemas: `stockAdjustmentRequestSchema`, `stockAdjustmentItemSchema`, `adjustmentReasonSchema`
- `packages/platform-core/src/types/stockInflows.ts` — Zod schemas: `stockInflowRequestSchema`, `stockInflowItemSchema`
- `packages/platform-core/src/repositories/stockAdjustments.server.ts` — `applyStockAdjustment`: reads inventory, iterates `parsed.data.items`, writes back, creates per-item audit rows
- `packages/platform-core/src/repositories/stockInflows.server.ts` — `receiveStockInflow`: same pattern as adjustments
- `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx` — single-item form: one SKU selector, one delta input, one reason dropdown; POSTs `items: [{ sku, productId, quantity, reason }]`
- `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx` — single-item form: one SKU selector, one quantity input; POSTs `items: [{ sku, productId, quantity }]`
- `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` — left-panel inventory list; provides the full item list; has "Adjust stock" / "Receive stock" navigation buttons
- `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` — root console; tab layout wiring; `matrixRefreshKey` forces re-fetch after write operations
- `apps/inventory-uploader/src/lib/inventory-utils.ts` — shared types (`InventoryItem`, `AuditEntry`), URL builder, quantity parser, `createKey` (UUID generation for idempotency)

### Patterns & Conventions Observed

- **Items-array API is already the contract.** Both `stockAdjustmentRequestSchema` and `stockInflowRequestSchema` define `items: z.array(...).min(1)` with no upper bound. The UI artificially constrains this to 1 item. Evidence: `StockAdjustments.client.tsx` line 116 `items: [{ ... }]`.
- **Dry-run preview pattern.** Adjustments support `?dryRun=true` with a "Preview" button before commit. Inflows do not have a preview step in the current UI (submit immediately). Batch UI should preserve the preview capability for adjustments and consider adding it for inflows.
- **Idempotency per-batch.** `idempotencyKey` is a UUID created with `createKey()` at component mount and reset after each successful save. It is sent once per POST covering all items in the call.
- **matrixRefreshKey pattern.** `InventoryConsole` increments `matrixRefreshKey` after any write to force `InventoryMatrix` to re-fetch. Batch writes should trigger this the same way.
- **Tab-based console layout.** Right panel has 4 tabs: Variant Editor, Stock Ledger, Adjustments, Receive Stock. A batch form would replace or extend the existing Adjustments/Receive Stock tabs.
- **Dense operator UI convention.** `/* eslint-disable ds/min-tap-size */` comment on both form components acknowledges that compact buttons are intentional for the operator console.
- **eslint max-lines-per-function exemption.** Both form components already carry `// eslint-disable-next-line max-lines-per-function -- INV-001 monolithic form+history component; split deferred`. A batch form will be larger; this exemption needs to carry forward.

### Data & Contracts

- Types/schemas/events:
  - `stockAdjustmentRequestSchema`: `{ idempotencyKey: UUID, items: [{sku, productId, quantity (nonzero int), variantAttributes?, reason}]+, dryRun?, note? }`
  - `stockInflowRequestSchema`: `{ idempotencyKey: UUID, items: [{sku, productId, quantity (positive int), variantAttributes?}]+, dryRun?, note? }`
  - Both schemas are `.strict()` — any extra fields will be rejected.
  - `AdjResult` type in `StockAdjustments.client.tsx` already handles multi-item `report.items[]` in the UI result panel — it iterates items and renders each SKU's before/after.
  - `InflowResult` type in `StockInflows.client.tsx` — same multi-item result structure.
- Persistence:
  - Inventory items stored in JSON (dev) or Prisma/Neon (production). Both backends via `writeInventory` / `readInventory`.
  - Audit events: one `inventoryAuditEvent` row per item per batch call. A 10-item batch creates 10 audit rows sharing the same `referenceId`.
- API/contracts:
  - No API contract changes required for batch support — both POST routes accept the existing multi-item schema already.
  - The routes pass the raw body to the repository functions; no size limit exists on the adjustments/inflows routes (unlike the 5 MB limit on the import route). A batch of 50 items is well within safe payload size.

### Dependency & Impact Map

- Upstream dependencies:
  - `InventoryMatrix.client.tsx` provides the inventory item list (all SKUs/variants) that both forms consume for their dropdown selectors.
  - `@acme/platform-core/repositories/stockAdjustments.server` and `stockInflows.server` — back-end, unchanged.
- Downstream dependents:
  - `InventoryConsole.client.tsx` — wires the tabs and `onSaved` callbacks; needs no structural changes, just the new component(s) in the tab slots.
  - `StockLedger.client.tsx` — reads ledger events; unchanged.
  - `InventoryMatrix.client.tsx` — re-fetched via `matrixRefreshKey`; unchanged.
- Likely blast radius:
  - UI only. Two components replaced or extended (`StockAdjustments.client.tsx`, `StockInflows.client.tsx`). Console wiring in `InventoryConsole.client.tsx` is a small change (pass new props/callbacks).
  - No API route changes, no schema changes, no Prisma changes, no platform-core changes.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/component), no E2E for inventory-uploader (no Playwright/Cypress config observed)
- Commands: standard Jest via `pnpm test` (CI only per testing policy)
- CI integration: standard CI pipeline

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Auth/session | Unit | `src/lib/auth/__tests__/accessControl.test.ts`, `session.test.ts`, `rateLimit.test.ts` | Auth layer well covered |
| Import size limit | Unit | `src/lib/auth/__tests__/importSizeLimit.test.ts` | Size constant tested, not the full route |
| StockAdjustments UI | None | — | No tests for the form components |
| StockInflows UI | None | — | No tests for the form components |
| API routes (adjustments, inflows) | None | — | No route-level tests found |
| Platform-core stockAdjustments.server | None | — | Repository logic untested at unit level |

#### Coverage Gaps

- Untested paths:
  - `applyStockAdjustment` multi-item path (currently only ever called with 1 item from UI, but schema allows N)
  - `receiveStockInflow` multi-item path (same situation)
  - Both route handlers (POST /adjustments, POST /inflows) have no test coverage
  - The new batch UI components would have no tests without explicit effort
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - Repository functions (`applyStockAdjustment`, `receiveStockInflow`) with mocked Prisma + filesystem — pure async functions with clear inputs/outputs
  - Schema validation (Zod) — instant unit tests, no infrastructure
- Hard to test:
  - Full UI interaction in batch form (multi-row add/remove/submit flow) — requires JSDOM + React Testing Library; feasible but non-trivial
- Test seams needed:
  - Mocked `inventoryApiUrl` and `fetch` for component tests

#### Recommended Test Approach

- Unit tests for: Schema validation of multi-item payloads (already structurally correct, add explicit multi-item cases); `applyStockAdjustment` with 3+ items
- Integration tests for: POST /adjustments and POST /inflows with multi-item arrays
- E2E tests for: Not required per testing policy for operator tools at this scope
- Contract tests for: None — API contract unchanged

### Recent Git History (Targeted)

- `apps/inventory-uploader/` — `45a78f0` (2026): Products view UI added. `b4cd077` (data-hardening), `5a35a1a` (route validation + env schema hardening), `4234b13` (DS compliance). The adjustment and inflow forms have not been touched since initial creation — no churn risk.
- `packages/platform-core/src/repositories/stock*` — Last touched in the data-hardening and product management waves. No recent changes to the adjustment/inflow logic.

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Single-item form components (`StockAdjustments.client.tsx`, `StockInflows.client.tsx`); dense console design tokens (`gate-*`); tab layout in `InventoryConsole.client.tsx` | Batch form needs dynamic row list — add/remove rows, per-row SKU selector and quantity input, shared note + reason fields; must stay compact within tab panel | Yes — UI approach is the primary architectural choice |
| UX / states | Required | Preview (dry-run) button for adjustments; no preview for inflows; history panel below form; result panel per item | Batch empty state (no rows added); partial-error state (backend rejects if any item fails with `PRODUCT_MISMATCH`); loading state while submitting N items; success state showing N results | Yes — error handling for partial failures |
| Security / privacy | Required | Routes delegate to `applyStockAdjustment` / `receiveStockInflow`; Zod `.strict()` rejects extra fields; shop name validated via `validateShopName`; no auth gate in route code (middleware handles it) | Batch payload size: no explicit limit on adjustments/inflows routes (unlike import's 5 MB limit). A batch of 50 items is ~5 KB — no practical risk, but worth noting | Low — document in plan that no size limit needed at this scale |
| Logging / observability / audit | Required | Per-item `inventoryAuditEvent` rows written for each item in a batch; shared `referenceId` (idempotency key) links all rows in a batch; `type: "adjustment"` or `type: "inflow"` | No new gaps — audit trail already works for multi-item (already designed for it) | No |
| Testing / validation | Required | Auth tests exist; UI components and API routes have no tests | Multi-item repository tests and route integration tests should be written as part of this work | Yes — test tasks needed |
| Data / contracts | Required | `stockAdjustmentRequestSchema` and `stockInflowRequestSchema` already accept `items[]` with no upper bound | No schema changes needed; UI state shape for a row list needs definition | Yes — UI state type design |
| Performance / reliability | Required | Repository reads full inventory JSON, builds Map, iterates items, writes back — O(n) over inventory size; no N+1 for items in a batch | For 50-item batch: inventory read + write happens once per POST (not per item); `Promise.all` for audit event creates is already in place; acceptable | No |
| Rollout / rollback | Required | No feature flags; operator-tool with no external users; inventory-uploader deploys independently | No migration required; UI change is additive; rollback = redeploy previous version | No |

## Questions

### Resolved

- Q: Does the API already support multiple items in one POST?
  - A: Yes. Both `stockAdjustmentRequestSchema` and `stockInflowRequestSchema` define `items: z.array(...).min(1)` with no `max`. The UI currently always sends exactly 1 item. Evidence: `packages/platform-core/src/types/stockAdjustments.ts` line 26, `stockInflows.ts` line 15.

- Q: Would the import route (`/api/inventory/[shop]/import`) be reused for batch adjustments?
  - A: No. The import route replaces the entire inventory catalogue (full write). Adjustments and inflows are additive delta operations with per-item reason codes and idempotency tracking. They use different endpoints, schemas, and semantics.

- Q: What is the realistic SKU count per shop?
  - A: Observed data: cochlearfit 12 SKUs (highest), caryina 3, demo 3, c2 1, cover-me-pretty 2. A realistic end-of-season stock-take is 10–50 rows. A multi-row form is the right fit; CSV would be over-engineered.

- Q: Does the dry-run preview work for multi-item payloads?
  - A: Yes. `applyStockAdjustment` handles `dryRun: true` by computing the result and returning without writing. It iterates all items in the array. Evidence: `stockAdjustments.server.ts` line 191–212.

- Q: Does the idempotency key model work for batches?
  - A: Yes. One `idempotencyKey` UUID per POST; the check is per `referenceId` + `type`, not per item. All items in a batch share the same `referenceId` in `inventoryAuditEvent`. This is the existing design. Evidence: `stockAdjustments.server.ts` line 71–123.

- Q: What happens if one item fails (e.g., `PRODUCT_MISMATCH`)?
  - A: The entire batch is rejected with `ok: false`. The repository returns early on first mismatch. Evidence: `stockAdjustments.server.ts` line 139–145. The UI must communicate this clearly.

- Q: What approach options exist?
  - A: Three viable options exist (see Approach Options below). The multi-row form is recommended — it matches the operator's mental model for a stock-take list and the observed SKU volumes.

### Open (Operator Input Required)

- Q: For the batch inflow form, should a dry-run preview step be added (matching the adjustment form)?
  - Why operator input is required: This is a product design choice about whether staff would value seeing a preview before committing a batch inflow. The current single-item inflow has no preview. Adding one increases friction (extra click) but reduces error risk for large batches.
  - Decision impacted: Whether to implement a "Validate" button on the batch inflow form.
  - Decision owner: Operator
  - Default assumption (if any) + risk: Default — add preview for batch inflows (mirrors adjustment UX, lower error risk for multi-item commits). Risk: slight extra click; low impact.

- Q: Should the batch form use a single `reason` for all items (simpler) or per-row `reason` (more precise)?
  - Why operator input is required: This is a workflow preference. A shared reason is faster to fill in (one dropdown for the whole stock-take). Per-row reason is more accurate for mixed scenarios (some items were damaged, some miscounted).
  - Decision impacted: UI layout complexity and the `items[]` structure sent to the API.
  - Decision owner: Operator
  - Default assumption (if any) + risk: Default — per-row reason, matching the schema which already supports it per-item. Risk: slightly more complex UI; manageable at 10–50 rows.

## Approach Options

Three viable architectural approaches for enabling batch input:

### Option A: Multi-row form UI (extending existing tabs)

Replace the single-item form in the Adjustments and Receive Stock tabs with a dynamic row list. Staff add rows (one per SKU), fill in quantity per row, then submit all rows in a single POST.

- Back-end changes: None.
- UI changes: Replace `StockAdjustments.client.tsx` and `StockInflows.client.tsx` with batch-capable versions. Each has an "Add row" button; rows display a SKU selector + quantity input; submit sends full `items[]`.
- Evidence it fits: API already accepts `items[]`. Observed SKU count (≤50) is manageable in a form. Current result panel already iterates `report.items[]`.
- Complexity: Medium. Dynamic row state, per-row validation, scroll handling in tab panel.
- Best for: End-of-season stock-takes where staff are filling in a list from a physical count sheet.

### Option B: CSV/JSON file upload for adjustments/inflows

Add a CSV import mode to the Adjustments and Receive Stock tabs (like the existing `InventoryImport` component but emitting adjustment deltas, not absolute counts).

- Back-end changes: New import parsing logic for adjustment/inflow CSVs (columns: sku, delta, reason). New POST handler or a mode flag on the existing import route.
- UI changes: Add a file drop zone to the Adjustments/Inflows tabs; display parse results before submission.
- Evidence against: The import route writes absolute quantities, not deltas. Reusing it for adjustments would require significant schema changes. The existing `InventoryImport` pattern is for catalogue replacement, not auditable delta events. CSV is a high-friction format for ad-hoc stock-takes at 10–50 items.
- Complexity: High. New route/schema, CSV column definition, error display.
- Best for: High-volume operations (hundreds of SKUs) or when staff already maintain a spreadsheet.

### Option C: Inline editing on the InventoryMatrix

Add inline quantity delta inputs directly on each row of the `InventoryMatrix` left panel, with a "Submit all changes" button at the bottom.

- Back-end changes: None.
- UI changes: `InventoryMatrix` would need to track per-row pending deltas and submit them as a batch.
- Evidence against: `InventoryMatrix` is a read-only display component; it does not have the adjustment fields (reason, note, idempotency key). Mixing display and mutation in the same component increases complexity and muddies the audit trail.
- Complexity: Medium-high. The component's single responsibility (display) would be violated.
- Best for: Scenarios where staff want to click rows and type quantities inline — faster but less explicit audit trail.

**Recommended approach: Option A (multi-row form UI).** The API already supports it with zero back-end changes. The observed SKU volumes fit a form UI. The existing result panel already handles multi-item display. The operator's mental model of a stock-take list maps directly to a row-based form.

## Confidence Inputs

- **Implementation: 85%**
  - Evidence basis: API contract requires zero changes. Repository logic already handles multi-item arrays. Two form components need replacement with batch-capable versions. `InventoryConsole` wiring is a small change.
  - What raises to ≥80: Already there. Operator confirmation of reason-field design (shared vs. per-row) would raise further.
  - What raises to ≥90: Operator answers the two open questions above, locking the exact UI shape.

- **Approach: 80%**
  - Evidence basis: Option A is clearly the right fit based on API evidence, SKU volume data, and existing component architecture. Options B and C have evidence working against them.
  - What raises to ≥80: Already there.
  - What raises to ≥90: Operator confirms Option A with specific UX preferences (reason field scope, preview for inflows).

- **Impact: 75%**
  - Evidence basis: Operator has stated the change would reduce stock-take from hours to minutes. SKU volumes (observed max 12 in data, plausible seasonal count up to 50) support this claim.
  - What raises to ≥80: Confirmation of typical SKU count at stock-take time.
  - What raises to ≥90: Post-build measurement of actual stock-take duration.

- **Delivery-Readiness: 85%**
  - Evidence basis: No schema changes, no migrations, no API changes. Two UI components to rewrite; one console wiring change. All patterns are established (tabs, refresh key, audit entries).
  - What raises to ≥80: Already there.
  - What raises to ≥90: Operator answers to open questions, locking component design.

- **Testability: 70%**
  - Evidence basis: Repository functions are testable; routes have no existing tests but are straightforward. UI components require React Testing Library setup.
  - What raises to ≥80: Establishing a test harness for the route handlers.
  - What raises to ≥90: Completing multi-item repository unit tests before UI implementation.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Staff adds many rows then encounters a PRODUCT_MISMATCH on one — entire batch rejected | Medium | High | UI must show which SKU failed; allow removal of failing row and resubmit. Back-end already returns `details.sku`. |
| Duplicate submission of the same batch (network retry) | Low | Medium | Existing idempotency key handles this — duplicate detection returns `ok: true, duplicate: true`. No change needed. |
| Form grows unwieldy at 40+ rows in a compact tab panel | Low | Medium | Add scroll container to row list; consider a max-rows warning (e.g., "30+ items — consider CSV import"). |
| Per-row reason dropdown makes form too wide for 320px left column | Low | Low | Adjustments tab is in the right panel (full width), not the left column. Not a concern. |
| Test coverage for multi-item code paths is currently zero | High | Medium | Plan must include explicit test tasks for repository multi-item paths and route integration. |

## Planning Constraints & Notes

- Must-follow patterns:
  - `/* eslint-disable ds/min-tap-size -- INV-0001 */` comment must be preserved on batch form components.
  - `// eslint-disable-next-line max-lines-per-function -- INV-001` exemption carries forward; batch components will exceed the line limit.
  - `createKey()` from `inventory-utils.ts` for idempotency key generation.
  - `inventoryApiUrl(shop, "adjustments")` and `inventoryApiUrl(shop, "inflows")` URL builder pattern.
  - `matrixRefreshKey` increment on `onSaved` — wire correctly in console.
  - Back-end writes use `writeInventory` (full array replacement) — this is already handled by the repositories; no change needed.
- Rollout/rollback expectations:
  - No feature flags required — operator tool with no end users.
  - Rollback = redeploy. No migration to reverse.
- Observability expectations:
  - Audit trail unchanged — per-item rows written to `inventoryAuditEvent` with shared `referenceId`.
  - History panels in the form components (already present) will continue to show audit entries.

## Suggested Task Seeds (Non-binding)

- TASK-01: Rewrite `StockAdjustments.client.tsx` as a batch multi-row form (add/remove rows, per-row SKU + delta + reason, shared note, preview + apply)
- TASK-02: Rewrite `StockInflows.client.tsx` as a batch multi-row form (add/remove rows, per-row SKU + quantity, shared note, apply ± preview)
- TASK-03: Update `InventoryConsole.client.tsx` to wire new batch components (no structural change expected beyond new props if any)
- TASK-04: Add unit tests for `applyStockAdjustment` multi-item path and `receiveStockInflow` multi-item path
- TASK-05: Add integration tests for POST /adjustments and POST /inflows with multi-item arrays

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - None
- Deliverable acceptance package:
  - Batch adjustment form: staff can add N rows, preview, and apply in one POST; result shows per-SKU before/after
  - Batch inflow form: staff can add N rows and apply in one POST; result shows per-SKU before/after
  - History panels continue to show per-item audit entries
  - Multi-item repository tests pass
- Post-delivery measurement plan:
  - Operator reports on stock-take duration at next end-of-season count

## Evidence Gap Review

### Gaps Addressed

- API schema evidence: confirmed from `packages/platform-core/src/types/stockAdjustments.ts` and `stockInflows.ts` — no changes needed.
- Repository multi-item handling: confirmed from `stockAdjustments.server.ts` and `stockInflows.server.ts` — already iterates items array.
- SKU data volume: confirmed from `data/shops/*/inventory.json` files — max 12 observed, plausible seasonal max ~50.
- UI component structure: confirmed from `StockAdjustments.client.tsx`, `StockInflows.client.tsx`, `InventoryConsole.client.tsx`.
- Idempotency behaviour: confirmed from repository code — shared key per batch, per-item audit rows.

### Confidence Adjustments

- API layer confidence raised to high (zero changes needed) from initial assumption that schema changes would be required.
- UI complexity confirmed medium — dynamic row list with per-row state is achievable within existing patterns.

### Remaining Assumptions

- Typical end-of-season SKU count is in the 10–50 range. If it exceeds 100, a CSV approach would become more appropriate.
- Operator prefers per-row reason (default assumption) — to be confirmed.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| API schema (adjustments) | Yes | None — `items[]` already array with no max | No |
| API schema (inflows) | Yes | None — `items[]` already array with no max | No |
| Repository multi-item handling | Yes | None — both repositories iterate items[] correctly | No |
| Import route relevance | Yes | Import replaces catalogue; not relevant for batch deltas | No |
| UI component inventory | Yes | Two components to replace; one console wiring change | No |
| Test coverage | Yes | Zero tests for UI components and routes — gap is real | Yes — plan must include test tasks |
| Idempotency model | Yes | Works for multi-item batches by design | No |
| SKU data volume | Yes | Max 12 observed; form approach is appropriate | No |
| Open questions | Partial | 2 open questions remain (preview for inflows; per-row vs shared reason) — defaults assigned | No (defaults allow planning to proceed) |

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items:
  - None — defaults assigned for both open questions; planning can proceed.
- Recommended next step:
  - `/lp-do-analysis` to compare Option A (multi-row form) vs Option B (CSV) vs Option C (inline matrix) across engineering coverage dimensions, and confirm Option A as the implementation path.
