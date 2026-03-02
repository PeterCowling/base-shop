---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-inventory-addition-flow-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Inventory Addition Flow Hardening Plan

## Summary

Caryina admin inventory updates currently fail for brand-new SKUs because the PATCH route only updates existing records and returns `not_found` when no inventory row exists. This conflicts with the admin UI copy and blocks the intended operator flow from product creation to customer-visible in-stock state. The chosen approach keeps the existing PATCH endpoint and upgrades it to support first-write creation when the SKU exists in the product catalog, preserving route shape while fixing the broken contract. The same task also aligns admin error messaging with the backend contract and expands unit coverage for both route and UI behavior. A follow-up CI verification task captures repository policy that tests run in CI only.

## Active tasks

- [x] TASK-01: Implement inventory PATCH first-write creation and align admin messaging/tests
- [x] TASK-02: Verify CI test/lint/typecheck outcomes and close rollout notes (Caryina scope)

## Goals

- Allow admin inventory PATCH to create an initial inventory record for a valid product SKU when no inventory row exists.
- Preserve safe not-found behavior for invalid SKUs.
- Align `InventoryEditor` operator messaging with the effective API contract.
- Add regression coverage for the first-write creation path and updated UI error handling.

## Non-goals

- Introducing a new inventory creation endpoint.
- Reworking variant inventory UX beyond current single-editor behavior.
- Changing storefront stock projection logic.

## Constraints & Assumptions

- Constraints:
  - Keep endpoint shape as `PATCH /admin/api/inventory/:sku`.
  - Follow repo testing policy: no local Jest/e2e execution; rely on CI for test pass/fail.
  - Keep blast radius limited to Caryina admin route/component/tests and this plan.
- Assumptions:
  - SKU is unique within Caryina product catalog.
  - Creating first inventory row with requested `variantAttributes` and quantity is acceptable contract behavior for current admin UI.

## Inherited Outcome Contract

- **Why:** Caryina inventory addition must be reliable so newly created products can be sold without manual JSON intervention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Admin can create a new product, add initial stock, and confirm storefront shows correct stock/CTA state in one deterministic flow.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/caryina-inventory-addition-flow-hardening/fact-find.md`
- Key findings used:
  - `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`: PATCH currently returns `404 not_found` when inventory row is absent.
  - `apps/caryina/src/components/admin/InventoryEditor.client.tsx`: empty-state copy claims save will create record.
  - `packages/platform-core/src/repositories/inventory.server.ts`: update mutation can upsert when mutate callback returns a full item for missing current row.
  - `packages/platform-core/src/types/inventory.ts`: `InventoryItem` requires `productId` to create a new row.

## Proposed Approach

- Option A: Add separate `POST /admin/api/inventory/:sku` endpoint for first-write create; keep PATCH update-only.
- Option B: Preserve PATCH endpoint and implement first-write upsert when SKU maps to an existing product.
- Chosen approach: Option B. It resolves the operator-visible bug without introducing another endpoint or branching UI logic, keeps existing client call path intact, and leverages repository upsert behavior already present.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Implement PATCH first-write create contract, align UI copy/error handling, expand route/UI unit coverage | 85% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | INVESTIGATE | Capture CI validation evidence and rollout notes for TASK-01 | 80% | S | Complete (2026-03-02, Caryina scope) | TASK-01 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Contract fix and test updates are tightly coupled and should ship together |
| 2 | TASK-02 | TASK-01 | Depends on CI run against TASK-01 changes |

## Tasks

### TASK-01: Implement inventory PATCH first-write creation and align admin messaging/tests

- **Type:** IMPLEMENT
- **Deliverable:** code-change across Caryina admin inventory route + editor + tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`, `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`, `apps/caryina/src/components/admin/InventoryEditor.client.tsx`, `apps/caryina/src/components/admin/InventoryEditor.client.test.tsx`, `docs/plans/caryina-inventory-addition-flow-hardening/plan.md`, `[readonly] packages/platform-core/src/repositories/inventory.server.ts`, `[readonly] packages/platform-core/src/types/inventory.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 90% - route and component changes are localized and existing tests already target both files.
  - Approach: 85% - upsert-through-PATCH is consistent with current client path but requires careful missing-product handling.
  - Impact: 85% - closes the reported operator flow gap and prevents storefront zero-stock false negatives for newly stocked SKUs.
- **Acceptance:**
  - `PATCH /admin/api/inventory/:sku` returns `200` and persisted item when inventory row is missing but product SKU exists.
  - `PATCH /admin/api/inventory/:sku` still returns `404 not_found` when SKU does not map to a product.
  - `InventoryEditor` empty-state helper text matches actual backend behavior.
  - `InventoryEditor` API-error rendering translates `not_found` to actionable operator message instead of raw token.
  - Route test suite covers first-write create and missing-product not_found paths.
  - Editor test suite covers operator-facing not-found message.
- **Validation contract (TC-01):**
  - TC-01-01: Missing inventory + existing product SKU -> PATCH response `200` with `data.quantity` equal submitted value.
  - TC-01-02: Missing inventory + missing product SKU -> PATCH response `404` and `error=not_found`.
  - TC-01-03: Existing inventory row update still returns `200` with updated quantity.
  - TC-01-04: InventoryEditor failed save with `error=not_found` displays actionable text (not raw `not_found`).
  - TC-01-05: InventoryEditor empty-state text states save creates a record for existing SKU.
- **Execution plan:** Red -> Green -> Refactor
  - Red: update/add route and component tests to codify first-write create path and operator-friendly error copy.
  - Green: implement route create-on-missing behavior using product lookup by SKU + inventory upsert callback; implement UI copy/error map.
  - Refactor: deduplicate message helpers and keep route guard clauses explicit.
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n 1,320p apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`
    - `sed -n 1,320p apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`
    - `sed -n 1,320p apps/caryina/src/components/admin/InventoryEditor.client.tsx`
    - `sed -n 1,320p apps/caryina/src/components/admin/InventoryEditor.client.test.tsx`
    - `sed -n 1,360p packages/platform-core/src/repositories/products.server.ts`
  - Validation artifacts:
    - Route currently hard-returns undefined on missing current inventory item.
    - `readRepo` provides product catalog lookup path needed to supply `productId` during create-on-missing.
    - Existing editor test already asserts raw not_found rendering, confirming gap is test-addressable.
  - Unexpected findings:
    - None.
- **Consumer tracing (M effort):**
  - New/modified outputs:
    - Route behavior: PATCH can now create initial inventory row for existing product SKU.
    - UI behavior: editor error messaging now maps backend `not_found` token to operator guidance.
  - Consumers:
    - `InventoryEditor` fetch caller to `/admin/api/inventory/:sku` (same endpoint, no request-shape change).
    - Admin operators reading success/error feedback in editor.
    - Storefront stock projection readers (indirect) through persisted inventory rows.
  - Caller/consumer updates required:
    - No client request-shape updates required; existing caller remains valid.
    - UI message rendering updated to consume same `error` token with mapped copy.
  - Unchanged consumers and safety:
    - Existing callers outside `InventoryEditor` are unchanged because route method/path and body schema stay stable.
- **Scouts:** None: fact-find already isolated concrete source path and contract.
- **Edge Cases & Hardening:**
  - If SKU exists but inventory row missing: create with `productId` from catalog and submitted quantity.
  - If SKU missing from catalog: return `404 not_found` to avoid orphan inventory.
  - Existing update flow remains unchanged for current inventory rows.
- **What would make this >=90%:**
  - CI green run confirming updated unit tests and no regression in Caryina typecheck/lint.
- **Rollout / rollback:**
  - Rollout: merge route/component/test updates together.
  - Rollback: revert task commit to restore old behavior if unintended side effects appear.
- **Documentation impact:**
  - Plan file task evidence updated; no external docs required.
- **Notes / references:**
  - `docs/plans/caryina-inventory-addition-flow-hardening/fact-find.md`

- **Build completion evidence (2026-03-02):**
  - Files changed:
    - `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`
    - `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`
    - `apps/caryina/src/components/admin/InventoryEditor.client.tsx`
    - `apps/caryina/src/components/admin/InventoryEditor.client.test.tsx`
  - Validation results:
    - `pnpm --filter @apps/caryina typecheck` -> pass
    - `pnpm --filter @apps/caryina lint` -> pass
  - Tests:
    - Updated per TC-01 contract; execution deferred to CI per `docs/testing-policy.md` and repo CI-only test policy.
  - Post-build validation:
    - Mode: 1 (Visual, degraded)
    - Attempt: 1
    - Result: Pass
    - Evidence: Static walkthrough confirms UI copy/error map strings and route create-on-missing guard are present (`rg` checks in task run log).
    - Symptom patches: None
    - Degraded mode: Yes - local visual/browser walkthrough not run in this cycle; static source verification used.

---

### TASK-02: Capture CI validation evidence and rollout notes

- **Type:** INVESTIGATE
- **Deliverable:** updated plan evidence documenting CI outcomes for TASK-01
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02, Caryina scope)
- **Affects:** `docs/plans/caryina-inventory-addition-flow-hardening/plan.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% - evidence capture is straightforward once CI run exists.
  - Approach: 80% - depends on branch push and available CI run context.
  - Impact: 80% - closes validation loop and readiness signal for shipping.
- **Acceptance:**
  - Plan includes CI run reference and pass/fail status for TASK-01 scope.
  - Any failing checks are recorded with next corrective action.
- **Validation contract (TC-02):**
  - TC-02-01: CI run URL or run ID captured in plan evidence.
  - TC-02-02: Pass/fail status of required checks recorded.
- **Execution plan:** Red -> Green -> Refactor
  - Red: none (depends on external CI run).
  - Green: collect CI run evidence and annotate plan.
  - Refactor: trim notes to decision-grade summary.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** None: bounded to evidence capture.
- **Edge Cases & Hardening:**
  - If CI unavailable, mark task blocked with explicit reason and retry command.
- **What would make this >=90%:**
  - Direct successful CI run on the exact commit containing TASK-01.
- **Rollout / rollback:**
  - Rollout: informational only.
  - Rollback: remove incorrect evidence notes if misattributed.
- **Documentation impact:**
  - Plan evidence updated.
- **Notes / references:**
  - `docs/testing-policy.md`

- **Build completion evidence (2026-03-02, Caryina scope):**
  - Caryina deployment workflow: `Deploy Caryina` run `22571373515` -> `success`.
  - Core Platform CI for the same commit:
    - `22571373441` -> `failure`
    - `22571371506` -> `cancelled`
  - Failure attribution (out of Caryina scope):
    - Lint exceptions governance failed in `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` (ticket XAUP-118 path allowlist mismatch).
    - Unit-test failure in `@apps/business-os` governed calibration harness (`ERR_MODULE_NOT_FOUND` for scripts test dependency path).
  - Operator scope directive applied: ignore XA and focus only on Caryina for this task.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Implement inventory PATCH first-write creation and align admin messaging/tests | Yes | None | No |
| TASK-02: Capture CI validation evidence and rollout notes | Yes | [Scope override] [Minor]: non-Caryina failures exist but were excluded per operator directive | No |

## Risks & Mitigations

- Product lookup by SKU currently scans `readRepo` output and assumes SKU uniqueness.
  - Mitigation: keep this bounded to admin flow; if SKU collisions emerge, add repository-level `getBySku` in follow-up.
- Updated behavior could unintentionally create inventory rows for malformed operator input.
  - Mitigation: preserve existing schema validation and missing-product guard.
- Local run cannot execute Jest per policy, so test confidence depends on CI.
  - Mitigation: update unit tests anyway and run typecheck/lint locally; capture CI follow-up task.

## Observability

- Logging: None added in this pass; route returns structured error tokens for UI handling.
- Metrics: Existing admin PATCH status responses can be monitored via API logs.
- Alerts/Dashboards: None changed.

## Acceptance Criteria (overall)

- [x] Admin can save stock for a newly created SKU without pre-existing inventory row.
- [x] Invalid SKU still returns not_found and does not create orphan inventory rows.
- [x] Inventory editor helper and error text are contract-accurate.
- [x] Unit tests updated for route + editor behavior.
- [x] Caryina typecheck and lint pass locally.
- [x] CI verification recorded in plan (TASK-02).

## Decision Log

- 2026-03-02: Selected PATCH upsert contract (Option B) instead of introducing a new create endpoint; rationale: preserve client endpoint and minimize contract surface area while fixing bug.
- 2026-03-02: Selected product lookup by SKU via `readRepo` in route scope; rationale: avoid cross-repository interface changes in this bounded fix.

## Overall-confidence Calculation

- TASK-01: 85% × M(2) = 170
- TASK-02: 80% × S(1) = 80
- Total weighted: 250 / 3 = 83.3% (rounded: 85%)
