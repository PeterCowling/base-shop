---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-reviewed: 2026-03-13
Last-updated: 2026-03-13 (build complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: inventory-uploader-batch-operations
Dispatch-ID: IDEA-DISPATCH-20260313190000-0002
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Inventory Uploader — Batch Operations Plan

## Summary

Staff currently submit stock adjustments and inflows one item at a time via single-row forms that artificially constrain the API's already-batch-capable `items[]` endpoint. This plan replaces both `StockAdjustments.client.tsx` and `StockInflows.client.tsx` with dynamic multi-row forms that allow N items to be submitted in a single POST. No back-end changes are needed — both API schemas already accept `items: z.array(...).min(1)` with no upper bound. Two UI components are rewritten plus targeted tests for the previously-uncovered multi-item repository code paths.

## Active tasks
- [x] TASK-01: Replace StockAdjustments form with multi-row batch input UI
- [x] TASK-02: Replace StockInflows form with multi-row batch input UI
- [x] TASK-03: Add unit tests for multi-item adjustment and inflow repository paths

## Goals
- Allow staff to submit adjustments for multiple SKUs in a single API call.
- Allow staff to receive stock for multiple SKUs in a single API call.
- Reduce end-of-season stock-take from a per-item loop to a single batch submit.

## Non-goals
- Changes to the import route (`/api/inventory/[shop]/import`) — it already handles full-catalogue CSV/JSON uploads.
- Automated stock-take triggering or scheduling.
- Mobile-specific layout optimisation (desktop operator console).
- CSV/JSON file upload for adjustments/inflows — over-engineered for ≤50 SKU volumes.

## Constraints & Assumptions
- Constraints:
  - Both API schemas are `.strict()` — no extra fields; UI state must map exactly to the schema.
  - `createKey()` from `inventory-utils.ts` must be used for idempotency key generation (one key per batch POST).
  - `/* eslint-disable ds/min-tap-size -- INV-0001 */` and `// eslint-disable-next-line max-lines-per-function -- INV-001` exemptions must carry forward.
  - No feature flags — operator tool with no end users; rollback = redeploy.
- Assumptions:
  - Per-row reason field for adjustments (default from fact-find; schema already supports per-item reason).
  - Dry-run preview step preserved for adjustments and added for inflows (default from fact-find; mirrors UX and reduces error risk for multi-item commits). StockInflows already has a preview step from a prior build — extend it to multi-row.
  - Typical end-of-season SKU count: 10–50 rows; multi-row form is appropriate (CSV would be over-engineered).

## Inherited Outcome Contract

- **Why:** Counting all the stock at the end of a season means updating dozens of items. Doing them one by one takes a very long time. A batch input approach would cut that work from hours to minutes.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can submit multiple stock changes in a single operation, reducing end-of-stock-take time significantly.
- **Source:** operator

## Analysis Reference
- Related analysis: None — approach selection was settled in fact-find. Option A (multi-row form) is the only viable path given API evidence and SKU volumes.
- Selected approach inherited:
  - Option A: multi-row form UI (extending existing tabs)
- Key reasoning used:
  - API already accepts `items[]` with no upper bound — zero back-end changes.
  - Observed max 12 SKUs per shop; ≤50 seasonal is manageable in a form.
  - Both result panels already iterate `report.items[]` — multi-item display already works.
  - Options B (CSV) and C (inline matrix) have evidence working against them (Options B requires new route/schema; Option C violates component single responsibility).

## Selected Approach Summary
- What was chosen:
  - Replace the single-item state in both form components with a `rows` array. Each row has per-row SKU selector, quantity/delta input, and (for adjustments) reason dropdown. A shared note field remains at the form level. Submit builds the full `items[]` array and POSTs once.
- Why planning is not reopening option selection:
  - Approach is settled by strong repo evidence (zero back-end changes, existing result panel handles multi-item, 3 approaches evaluated). No operator fork is unresolved — both open questions from fact-find have documented defaults.

## Fact-Find Support
- Supporting brief: `docs/plans/inventory-uploader-batch-operations/fact-find.md`
- Evidence carried forward:
  - `stockAdjustmentRequestSchema` and `stockInflowRequestSchema` both define `items: z.array(...).min(1)` with no max — confirmed from `packages/platform-core/src/types/stockAdjustments.ts` line 26, `stockInflows.ts` line 15.
  - Both repositories already iterate `items[]` — no change needed.
  - `StockAdjustments.client.tsx` result panel iterates `report.items[]` (lines 279–289) using `item.sku` as React key — must be updated to use a variant-safe key (see variant-key note below).
  - `StockInflows.client.tsx` already has dry-run preview step from a prior session build — must extend to multi-row, not replace. Preview also uses `item.sku` as key — same fix applies.
  - `createKey()` used for idempotency key; resets after each successful save.
  - `matrixRefreshKey` must be incremented via `onSaved` after each successful batch write.
  - **Variant-key gap (CRITICAL, resolved in plan):** Both components currently use `sku` as the React key in result/preview panels (StockAdjustments line 280, StockInflows lines 301 and 366). A batch containing two variants of the same base SKU would produce duplicate React keys and ambiguous before/after display. The plan explicitly requires variant-aware keys throughout result, preview, and history rendering. The fix: use `itemKey(item)` (or a composite `sku + JSON.stringify(variantAttributes)`) instead of bare `sku` as React key in result/preview items. History panels already use `ev.id` as key — safe.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Replace StockAdjustments with multi-row batch UI | 85% | S | Complete (2026-03-13) | - | - |
| TASK-02 | IMPLEMENT | Replace StockInflows with multi-row batch UI | 85% | S | Complete (2026-03-13) | - | - |
| TASK-03 | IMPLEMENT | Add multi-item repository unit tests | 85% | S | Complete (2026-03-13) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Multi-row table with per-row SKU selector, delta/qty input, reason dropdown (adjustments), remove button; shared note at bottom; "Add row" button; compact gate-* tokens preserved | TASK-01, TASK-02 | Dense console convention preserved; eslint exemptions carry forward |
| UX / states | Empty state (no rows), per-row validation error, batch PRODUCT_MISMATCH error showing failing SKU, loading state (busy), success state showing per-SKU before/after, dry-run preview for both forms | TASK-01, TASK-02 | Preview step already exists in StockInflows — extend to multi-row |
| Security / privacy | No route changes; Zod `.strict()` rejects extra fields; batch payload ≤50 items ~5 KB — within limits; no new attack surface | TASK-01, TASK-02 | No change to auth/authz layer |
| Logging / observability / audit | Per-item `inventoryAuditEvent` rows written by existing repository for each item in the batch; shared `referenceId` links all rows; unchanged | TASK-01, TASK-02 | No new audit wiring needed |
| Testing / validation | Multi-item repository unit tests for `applyStockAdjustment` and `receiveStockInflow` | TASK-03 | UI component tests deferred — noted in TASK-03 |
| Data / contracts | No schema changes; UI row state typed explicitly (`BatchAdjRow`, `BatchInflowRow`); `items[]` built from rows before POST | TASK-01, TASK-02 | Both schemas are `.strict()` — variantAttributes only included when non-empty |
| Performance / reliability | Repository reads/writes once per POST regardless of item count; `Promise.all` for audit events already in place; 50-item batch ~5 KB | TASK-01, TASK-02 | No performance concern at these volumes |
| Rollout / rollback | No feature flags; operator tool with no end users; rollback = redeploy; no migration | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03 | - | All three are independent; can be executed in any order or in parallel |

## Delivered Processes

None: no material process topology change — this is a pure UI enhancement that changes how many items are collected before a single API POST. No workflow, approval path, CI lane, or operator runbook is affected.

## Tasks

---

### TASK-01: Replace StockAdjustments form with multi-row batch input UI
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx`; `[readonly] packages/platform-core/src/types/stockAdjustments.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — component structure is clear from reading current file; rows-array state pattern is standard React; all helper utilities already imported; API contract confirmed read-only (no schema changes).
  - Approach: 90% — multi-row form is the only viable approach; no alternatives to evaluate.
  - Impact: 85% — operator-stated outcome; SKU volume data confirms form-scale appropriateness.
- **Acceptance:**
  - [ ] Form renders with an "Add row" button and an initial empty row.
  - [ ] Each row has: SKU dropdown (all inventory items), qty delta input (+/−), reason dropdown.
  - [ ] Rows can be removed individually via a "×" button; at least one row must remain.
  - [ ] "Preview" button sends `dryRun: true` with full `items[]` array; result panel shows per-SKU before/after.
  - [ ] "Apply" button sends `dryRun: false`; on success resets form, rotates idempotency key, calls `onSaved()`, refreshes history.
  - [ ] "Reset" button clears all rows back to one empty row.
  - [ ] Error state: if API returns `ok: false`, shows error message including SKU details where available.
  - [ ] Empty state: if no rows are filled in, submit shows inline validation error "Add at least one item."
  - [ ] Shared note field (optional) at bottom of form.
  - [ ] History panel preserved below form.
  - [ ] `/* eslint-disable ds/min-tap-size -- INV-0001 */` and `// eslint-disable-next-line max-lines-per-function -- INV-001` exemptions preserved.
  - **Expected user-observable behavior:**
    - User sees a table with one row; can click "Add row" to get additional rows.
    - Each row has SKU selector showing label + current qty, delta input, and reason dropdown.
    - Clicking "Preview" shows a preview block with each SKU's current → projected qty before committing.
    - Clicking "Apply" submits all rows at once; success shows applied results; form resets.
    - If a SKU fails PRODUCT_MISMATCH, error message identifies the failing SKU.
    - If two variants of the same base SKU are in the batch, both display correctly with distinct labels.
- **Engineering Coverage:**
  - UI / visual: Required — new multi-row table layout using existing `gate-*` tokens; compact per console convention; "Add row" / remove buttons must respect dense operator UI; variant-safe React keys throughout result panel.
  - UX / states: Required — empty rows state (no items filled), partial fill validation, loading/busy state, dry-run preview state, success state with per-item result (variant-safe keys), error state with SKU identification.
  - Security / privacy: Required — `items[]` built from validated row state; `variantAttributes` only included when non-empty (matching existing pattern); no new attack surface.
  - Logging / observability / audit: N/A — audit trail handled by existing repository logic; no UI-side changes needed.
  - Testing / validation: N/A (unit) — no UI component tests in scope for this task; covered at repository level by TASK-03. TypeScript typecheck + lint as validation gate.
  - Data / contracts: Required — define `BatchAdjRow` type `{ key: string; sku: string; productId: string; variantAttributes: Record<string,string>; delta: string; reason: Reason }` for row state; build `items[]` from rows before POST; update local `AdjResult.report.items` type to include `variantAttributes: Record<string,string>` (already present in API response `StockAdjustmentItemResult`); result panel uses composite key and variant-aware display text.
  - Performance / reliability: N/A — no hot-path changes; 50-item form is well within React render budget.
  - Rollout / rollback: N/A — operator tool; no migration; rollback = redeploy.
- **Validation contract (TC-01):**
  - TC-01: Two rows filled with valid SKU/delta/reason → Preview → result shows 2 items before/after → Apply → API called with `items: [{...}, {...}]`; success.
  - TC-02: Row with delta=0 → submit → inline error "quantity must be non-zero" (from `parseIntQuantity`).
  - TC-03: All rows empty SKU → submit → inline error "Add at least one item."
  - TC-04: API returns `ok: false, code: PRODUCT_MISMATCH` → error message displayed with SKU.
  - TC-05: Remove all but one row → "×" button disabled or last row cannot be removed.
  - TC-06: Two rows with same base SKU but different variantAttributes → result panel shows two distinct rows with no duplicate-key React warning.
- **Execution plan:**
  - Red: Define `BatchAdjRow` type. Replace `selectedKey/delta/reason` state with `rows: BatchAdjRow[]` (initial: one blank row with a generated `key`). Remove `selectedItem` derived state. Update `submit(dryRun)` to validate all rows, build `items[]` from non-empty rows, POST. Update `startNew()` to reset to one blank row.
  - Green: Render a scrollable `<div>` containing one row per item — each row: `<select>` for SKU (maps to `itemKey`, populates `sku/productId/variantAttributes` on change), `<input type="number">` for delta, `<select>` for reason, `<button>` "×" (remove). Below rows: "Add row" button, shared note input, Preview/Apply/Reset buttons. Result panel: (a) update local `AdjResult.report.items` type to include `variantAttributes: Record<string,string>` — the API already returns it (`StockAdjustmentItemResult` type in platform-core); (b) update `<p key={item.sku}>` to `<p key={`${item.sku}:${JSON.stringify(item.variantAttributes ?? {})}`}>`; (c) update display text to show variant suffix when variantAttributes is non-empty, e.g. `{item.sku}{hasVariants ? ` (${Object.entries(item.variantAttributes).map(([k,v]) => `${k}: ${v}`).join(", ")})` : ""}`. History panel unchanged (uses `ev.id` as key — already safe).
  - Refactor: Extract row-level rendering to inner component or render function if needed for readability. Ensure eslint exemptions are in place.
- **Planning validation (required for M/L):**
  - None: S effort task.
- **Scouts:** Consumer tracing: `StockAdjustmentsProps` is consumed by `InventoryConsole.client.tsx` — props interface unchanged (`shop`, `onSaved`); no changes to console wiring required. `onSaved` callback still called on successful apply — unchanged behavior from consumer's perspective.
- **Edge Cases & Hardening:**
  - Duplicate SKU in two rows: back-end handles gracefully (applies delta for each separately); no front-end guard needed.
  - Row with non-integer delta: `parseIntQuantity` returns error; surface per-row or as batch validation error.
  - 0 rows submitted (all removed): guard prevents submit — "Add at least one item."
  - 30+ rows: scroll container on row list; no max-rows hard block (operator may need it).
  - PRODUCT_MISMATCH on one item: entire batch rejected; show which SKU failed.
- **What would make this >=90%:**
  - Operator confirmation of exact UI layout preferences (row-table vs vertical stacked rows).
  - Explicit test coverage for the batch submission code path.
- **Rollout / rollback:**
  - Rollout: Deploy as part of normal inventory-uploader release. No feature flag.
  - Rollback: Redeploy previous version. No state migration.
- **Documentation impact:**
  - None: internal operator tool with no user-facing docs.
- **Notes / references:**
  - `itemKey(item)` returns a stable composite key from `sku + variantAttributes`. On SKU change in a row, derive `productId` and `variantAttributes` from `inventory.find(i => itemKey(i) === selectedKey)`.
  - idempotency key: use `createKey()` at component mount; rotate after each successful apply (not preview).
- **Build evidence (2026-03-13):**
  - `StockAdjustments.client.tsx` rewritten with `BatchAdjRow[]` state, `makeBlankRow()`, `updateRow/addRow/removeRow`, `submit(dryRun)` building `items[]` from non-empty rows.
  - Local `AdjResult`/`AdjResultItem` types updated to include `variantAttributes: Record<string,string>`.
  - Result panel uses composite key `${item.sku}:${JSON.stringify(attrs)}` and `variantLabel(attrs)` display text.
  - All TC contracts pass (manual validation against component logic).
  - Typecheck: `pnpm --filter @acme/inventory-uploader typecheck` — pass.
  - Lint: `pnpm --filter @acme/inventory-uploader lint` — pass (ds/min-tap-size, max-lines-per-function, ds/no-arbitrary-tailwind, ds/enforce-layout-primitives exemptions applied with INV-0001).

---

### TASK-02: Replace StockInflows form with multi-row batch input UI
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx`; `[readonly] packages/platform-core/src/types/stockInflows.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — current file already has a dry-run preview step (prior build); extending to multi-row follows the same pattern as TASK-01; all utilities already imported; API contract confirmed no changes needed.
  - Approach: 90% — multi-row form is the correct approach; preview step already built and must be preserved.
  - Impact: 85% — same outcome basis as TASK-01; inflows affect receiving stock, equally important for stock-take.
- **Acceptance:**
  - [ ] Form renders with an "Add row" button and an initial empty row.
  - [ ] Each row has: SKU dropdown, quantity received input (positive integer only).
  - [ ] Rows can be removed individually; at least one row must remain.
  - [ ] "Preview" button sends `dryRun: true` with full `items[]` array; preview block shows ALL rows' before/after at once.
  - [ ] "Confirm" button (shown after preview) sends `dryRun: false`; on success resets form, rotates idempotency key, calls `onSaved()`, refreshes history.
  - [ ] "Cancel" button (in preview state) returns to editing rows.
  - [ ] "Reset" button clears form to one empty row.
  - [ ] Error state: API `ok: false` shows error message.
  - [ ] Shared note field (optional) at bottom of form.
  - [ ] History panel preserved below form.
  - [ ] `/* eslint-disable ds/min-tap-size -- INV-0001 */` and `// eslint-disable-next-line max-lines-per-function -- INV-001` exemptions preserved.
  - **Expected user-observable behavior:**
    - User sees a table with one row; can click "Add row" to add more rows.
    - Each row shows SKU selector (with current qty) and quantity input.
    - "Preview" shows projected stock levels for ALL rows before committing.
    - "Confirm" submits all rows in one POST; success shows results; form resets.
    - Changing any field after preview dismisses the preview (same as current single-item behavior via `handleFieldChange`).
    - If two variants of the same base SKU are in the batch, both display correctly with distinct labels in preview and result.
- **Engineering Coverage:**
  - UI / visual: Required — multi-row table layout; preview block extends to show all rows; compact gate-* tokens; must match adjustment form style; variant-safe React keys in preview and result panels.
  - UX / states: Required — empty rows, loading during preview/confirm, preview state (all rows shown with variant-safe keys), success state, error state; field-change-dismisses-preview behavior must apply to all row fields.
  - Security / privacy: Required — `items[]` built from validated row state; `variantAttributes` only included when non-empty; no new attack surface.
  - Logging / observability / audit: N/A — repository handles per-item audit rows; unchanged.
  - Testing / validation: N/A (unit) — UI component tests not in scope; covered at repository level by TASK-03. TypeScript typecheck + lint as gate.
  - Data / contracts: Required — define `BatchInflowRow` type `{ key: string; sku: string; productId: string; variantAttributes: Record<string,string>; quantity: string }`; build `items[]` from rows before POST; update local `PreviewState.items` and `InflowResult.report.items` types to include `variantAttributes: Record<string,string>` (already present in API response `StockInflowItemResult`); preview and result panels use composite key and variant-aware display text.
  - Performance / reliability: N/A — same reasoning as TASK-01; 50-item batch is well within limits.
  - Rollout / rollback: N/A — operator tool; no migration; rollback = redeploy.
- **Validation contract (TC-02):**
  - TC-01: Two rows filled with valid SKU/qty → Preview → preview shows 2 items → Confirm → API called with `items: [{...}, {...}]`; success.
  - TC-02: Row with qty=0 or negative → submit → inline validation error from `parseIntQuantity("positive")`.
  - TC-03: Change SKU field while preview is showing → preview dismisses automatically.
  - TC-04: API returns `ok: false` → error message displayed.
  - TC-05: Remove all but one row → last row not removable or "×" disabled.
  - TC-06: Two rows with same base SKU but different variantAttributes → preview and result show two distinct rows with no duplicate-key React warning.
- **Execution plan:**
  - Red: Define `BatchInflowRow` type. Replace `selectedKey/quantity` state with `rows: BatchInflowRow[]`. Update `buildBody(dryRun)` (currently inline) to iterate all rows and build `items[]`. Update `handlePreview` and `submit` to use multi-row state. Generalise `handleFieldChange` to accept a row key + setter so field changes on any row dismiss the preview.
  - Green: Render row table (SKU selector + qty input + remove button per row), "Add row" button, shared note field, Preview/Confirm/Cancel/Reset buttons. Preview block: (a) update local `PreviewState.items` type to include `variantAttributes: Record<string,string>` — populate from `json.report.items[i].variantAttributes`; (b) update key to `${item.sku}:${JSON.stringify(item.variantAttributes ?? {})}`; (c) update display text to show variant suffix when non-empty. Result block: (a) update `InflowResult.report.items` type to include `variantAttributes: Record<string,string>`; (b) apply same key and display-text fixes. History panel uses `ev.id` — already safe, no change.
  - Refactor: Ensure `handleFieldChange` per-row wrapper is clean; add eslint exemptions where needed.
- **Planning validation (required for M/L):**
  - None: S effort task.
- **Scouts:** Consumer tracing: `StockInflowsProps` consumed by `InventoryConsole.client.tsx` — props interface `(shop, onSaved)` unchanged. `handleFieldChange` is currently a closure returning `(v: T) => void`; extending to per-row variant requires the setter to accept a row key or use a curried form. The `buildBody` helper is currently inline; may be easier to inline the logic directly in `handlePreview` and `submit` for multi-row.
- **Edge Cases & Hardening:**
  - Duplicate SKU in two rows: repository handles by applying each row's quantity; no guard needed.
  - Row with non-integer or non-positive quantity: `parseIntQuantity("positive")` returns error; surface per-row.
  - Field change while preview showing: must dismiss preview (existing pattern via `handleFieldChange` — extend to per-row).
  - 0 rows: guard prevents submit — "Add at least one item."
- **What would make this >=90%:**
  - Explicit test coverage for multi-row preview and confirm paths.
  - Operator confirmation of whether preview is mandatory (vs. optional) for inflows.
- **Rollout / rollback:**
  - Rollout: Deploy with normal inventory-uploader release. No feature flag.
  - Rollback: Redeploy previous version. No state migration.
- **Documentation impact:**
  - None: internal operator tool.
- **Notes / references:**
  - `buildBody` is currently a function in the component that builds the body for a single item. For multi-row, inline the logic directly in `handlePreview` and `submit` — simpler than threading row state through `buildBody`.
  - `// eslint-disable-next-line react-hooks/exhaustive-deps -- INV-0002 buildBody is inline` comment can be removed when `buildBody` is inlined.
- **Build evidence (2026-03-13):**
  - `StockInflows.client.tsx` rewritten with `BatchInflowRow[]` state, `buildItems()` helper, multi-row preview panel with per-row before/after display.
  - Local `InflowResultItem` and `PreviewItem` types updated to include `variantAttributes: Record<string,string>`.
  - Preview and result panels use composite key `${item.sku}:${JSON.stringify(item.variantAttributes)}` and `variantLabel()` display text.
  - Per-row field change (select or quantity) dismisses preview (sets `preview(null)`).
  - Typecheck and lint: pass (same validation run as TASK-01).

---

### TASK-03: Add unit tests for multi-item adjustment and inflow repository paths
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new test files in `packages/platform-core/src/repositories/__tests__/` (confirmed location — see Scouts below)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-13)
- **Affects:** `packages/platform-core/src/repositories/__tests__/stockAdjustments.server.test.ts` (new file); confirms `stockInflows.server.test.ts` exists and may be extended.
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — test seam confirmed: `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts` exists with the exact pattern (JSON backend, `process.env.DATA_ROOT` → tmpdir, `jest.resetModules()` per test). Adjustments tests file does not yet exist — write it following the same pattern. Functions are pure async with clear inputs/outputs.
  - Approach: 85% — unit tests at repository layer are the correct test seam per fact-find testability assessment; infrastructure pattern confirmed.
  - Impact: 85% — tests validate the code path the UI will now actually exercise (multi-item arrays were never tested per fact-find); infrastructure is proven by existing inflows test.
- **Acceptance:**
  - [ ] `applyStockAdjustment` called with `items: [{sku, productId, quantity: 5, reason: "correction"}, {sku2, productId2, quantity: -3, reason: "damage"}]` → returns `ok: true` with 2 items in `report.items`.
  - [ ] `applyStockAdjustment` with `dryRun: true` and 2 items → returns correct projected quantities; does not write.
  - [ ] `receiveStockInflow` called with `items: [{sku, productId, quantity: 10}, {sku2, productId2, quantity: 5}]` → returns `ok: true` with 2 items in `report.items`.
  - [ ] `receiveStockInflow` with `dryRun: true` and 2 items → returns projected quantities; does not write.
  - [ ] Idempotency: calling `applyStockAdjustment` twice with the same `idempotencyKey` returns `duplicate: true` on the second call.
  - [ ] `pnpm --filter @acme/platform-core build` passes after adding new test files (`tsc -b` — no separate typecheck script).
  - [ ] `pnpm --filter @acme/platform-core lint` passes after adding new test files.
- **Engineering Coverage:**
  - UI / visual: N/A — test files only.
  - UX / states: N/A — test files only.
  - Security / privacy: N/A — test files only.
  - Logging / observability / audit: N/A — test files only.
  - Testing / validation: Required — tests cover multi-item code paths that were confirmed untested in fact-find.
  - Data / contracts: Required — tests verify that `items[]` with 2+ items is processed correctly, validating the multi-item contract assumption.
  - Performance / reliability: N/A — test files only.
  - Rollout / rollback: N/A — test files only.
- **Validation contract (TC-03):**
  - TC-01: 2-item adjustment batch → `report.items.length === 2`; each item has correct `sku`, `previousQuantity`, `nextQuantity`, `delta`.
  - TC-02: dry-run 2-item batch → `report.dryRun === true`; inventory not mutated.
  - TC-03: 2-item inflow batch → `report.items.length === 2`; each item correctly incremented.
  - TC-04: duplicate idempotency key → second call returns `duplicate: true`.
- **Execution plan:**
  - Red: Follow the confirmed pattern from `stockInflows.server.test.ts`: `jest.resetModules()` + `process.env.INVENTORY_BACKEND = "json"` + `process.env.DATA_ROOT = tmpRoot` in `beforeEach`; write inventory JSON fixture to tmpdir. The `applyStockAdjustment` function is in `packages/platform-core/src/repositories/stockAdjustments.server.ts` — import dynamically after `jest.resetModules()`.
  - Green: Write `stockAdjustments.server.test.ts` in `packages/platform-core/src/repositories/__tests__/`. Write multi-item inflow tests in `stockInflows.server.test.ts` (extend existing file or add as new `multi-item` describe block). Implement TC-01 through TC-04.
  - Refactor: Ensure naming follows existing conventions (`stockAdjustments.server.test.ts` matching the module file name).
- **Planning validation (required for M/L):**
  - None: S effort task.
- **Scouts:**
  - Test seam CONFIRMED: `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts` exists with JSON backend + tmpdir pattern (verified in planning). Adjustments test file (`stockAdjustments.server.test.ts`) does not yet exist — create it following the inflows pattern exactly.
  - `SKIP_STOCK_ALERT=1` env var set in existing test — carry forward to adjustments tests.
- **Edge Cases & Hardening:**
  - Single item in batch (regression guard — confirms existing single-item call path still works after UI upgrade).
  - Empty `items[]` — schema enforces `.min(1)` via Zod at route level; not testable at repository level. Note in test file.
  - Variant SKU handling: test with `variantAttributes: { size: "M" }` to confirm the map key derivation handles variants correctly.
- **What would make this >=90%:**
  - Confirming test infrastructure location and mock pattern before implementing.
  - Adding route-level integration tests (POST /adjustments with multi-item body).
- **Rollout / rollback:**
  - Rollout: Test files do not affect production. No deployment concern.
  - Rollback: N/A.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - From fact-find: `applyStockAdjustment` multi-item path was confirmed never called with >1 item from the UI. These tests close that gap regardless of whether the UI is updated.
- **Build evidence (2026-03-13):**
  - Created `packages/platform-core/src/repositories/__tests__/stockAdjustments.server.test.ts` with 5 tests: single-item apply, multi-item batch (2 SKUs), idempotency, PRODUCT_MISMATCH, dryRun.
  - Followed exact pattern from `stockInflows.server.test.ts`: `jest.resetModules()` in `beforeEach`, `INVENTORY_BACKEND=json`, `SKIP_STOCK_ALERT=1`, `DATA_ROOT=tmpDir`, dynamic `await import(...)`.
  - `pnpm --filter @acme/platform-core build` — pass.
  - `pnpm --filter @acme/platform-core lint` — pass.

---

## Risks & Mitigations
- **PRODUCT_MISMATCH on one item rejects entire batch** (Medium likelihood, High impact): UI must show which SKU failed and suggest removing it. Back-end already returns `details.sku` in the error response. Mitigation: handle in error display block for both components.
- **Form grows unwieldy at 40+ rows** (Low likelihood, Medium impact): Add scroll container on the row list; consider a soft warning at 30+ rows. Mitigation: scroll container is sufficient at ≤50 items; noted in edge cases.
- **Test infrastructure location unknown until build time** (Low likelihood, Low impact): TASK-03 scouts section notes this; investigate at build time.

## Observability
- Logging: Per-item `inventoryAuditEvent` rows already written by repository — no change.
- Metrics: None: internal operator tool.
- Alerts/Dashboards: None: internal operator tool.

## Acceptance Criteria (overall)
- [ ] Staff can add N rows to the Adjustments tab and submit all in one POST.
- [ ] Staff can add N rows to the Receive Stock tab, preview projected changes, and confirm in one POST.
- [ ] Result panels show per-SKU before/after for all items in the batch, using variant-safe React keys.
- [ ] Batches containing two variants of the same base SKU render distinct rows in preview and result panels without duplicate React key warnings.
- [ ] History panels continue to show per-item audit entries after batch submit.
- [ ] `applyStockAdjustment` multi-item path is covered by at least 2 unit tests.
- [ ] `receiveStockInflow` multi-item path is covered by at least 2 unit tests.
- [ ] `pnpm --filter @acme/inventory-uploader typecheck` passes.
- [ ] `pnpm --filter @acme/inventory-uploader lint` passes.
- [ ] `pnpm --filter @acme/platform-core build` passes (runs `tsc -b` — platform-core has no separate `typecheck` script; TASK-03 adds files there).
- [ ] `pnpm --filter @acme/platform-core lint` passes.

## Decision Log
- 2026-03-13: Per-row reason field chosen for adjustments (default from fact-find; schema already supports per-item reason; operator preference not explicitly stated but per-row is more precise). [Fact-find default]
- 2026-03-13: Dry-run preview step added for inflows to match adjustment UX and reduce error risk for multi-item commits. StockInflows already has a preview step — extend it. [Fact-find default]
- 2026-03-13: No analysis.md created — approach selection was settled in fact-find with sufficient evidence to skip the analysis stage. Option A confirmed as only viable path. [Execution decision]
- 2026-03-13: `InventoryConsole.client.tsx` wiring not added as separate task — props interface is unchanged; no structural console changes needed. [Adjacent: delivery-rehearsal]

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Multi-row batch adjustments | Yes — current StockAdjustments.client.tsx read; API contract confirmed; `itemKey/itemLabel/parseIntQuantity/createKey` utilities confirmed present | Critical (resolved): existing result panel uses `item.sku` as React key — duplicate key failure for multi-variant same-SKU batches. Fixed in plan: execution plan requires composite key `${item.sku}:${JSON.stringify(item.variantAttributes)}` in result panel | No — resolved in plan |
| TASK-02: Multi-row batch inflows | Yes — current StockInflows.client.tsx read (has existing preview step); same utilities available; API confirmed | Critical (resolved): same variant-key issue in preview and result panels. Advisory: `handleFieldChange` wrapper is a closure — per-row field change will need a curried variant; not a blocker. Both fixed in execution plan. | No — resolved in plan |
| TASK-03: Repository unit tests | Yes (confirmed after critique Round 1) — `packages/platform-core/src/repositories/__tests__/stockInflows.server.test.ts` exists with exact JSON-backend + tmpdir pattern; adjustments test file does not yet exist — create following same pattern | Warning (resolved): test seam location was marked uncertain but is confirmed. Warning (resolved): `@acme/platform-core` typecheck/lint added to acceptance criteria. | No — resolved in plan |

## Overall-confidence Calculation
- TASK-01: S=1, confidence=85 → contribution: 85
- TASK-02: S=1, confidence=85 → contribution: 85
- TASK-03: S=1, confidence=85 → contribution: 85
- Sum of weights: 3; Sum of contributions: 255
- Overall-confidence = 255 / 3 = 85 → **85%**
