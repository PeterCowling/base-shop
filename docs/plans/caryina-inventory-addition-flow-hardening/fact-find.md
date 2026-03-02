---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: caryina-inventory-addition-flow-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-inventory-addition-flow-hardening/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Caryina Inventory Addition Flow Hardening Fact-Find Brief

## Scope
### Summary
The Caryina admin workflow currently allows creating a new active product, but does not provide a working path to create the first inventory record for that SKU. This breaks the expected operational flow from admin stock entry to customer-visible in-stock state.

### Goals
- Verify the exact failure point in new-SKU inventory addition.
- Map UI/API/storefront data contracts that create the break.
- Define planning-ready implementation slices to restore end-to-end correctness.

### Non-goals
- Implementing the fix in this fact-find.
- Redesigning all admin UX.

### Constraints & Assumptions
- Constraints:
  - Fact-find only; no code changes.
  - Evidence is based on local simulation and source audit.
- Assumptions:
  - HBAG is the governing business context for Caryina storefront work.

## Outcome Contract
- **Why:** Caryina inventory addition must be reliable so newly created products can be sold without manual JSON intervention.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Admin can create a new product, add initial stock, and confirm storefront shows correct stock/CTA state in one deterministic flow.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/src/app/admin/products/new/page.tsx` - admin create-product entry.
- `apps/caryina/src/app/admin/products/[id]/page.tsx` - edit page that hosts inventory editor.
- `apps/caryina/src/components/admin/InventoryEditor.client.tsx` - inventory submit path and operator copy.
- `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts` - inventory PATCH route.
- `packages/platform-core/src/repositories/catalogSkus.server.ts` - stock derivation for storefront SKU model.

### Key Modules / Files
- `apps/caryina/src/components/admin/InventoryEditor.client.tsx`
  - Empty-state copy claims save will create a record.
  - Sends `PATCH /admin/api/inventory/:sku` with `variantAttributes` default `{}`.
- `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts`
  - Uses `updateInventoryItem` and returns `404 not_found` when current record is missing.
- `apps/caryina/src/app/admin/api/products/route.ts`
  - Creates product record only; no bootstrap inventory creation.
- `packages/platform-core/src/repositories/catalogSkus.server.ts`
  - Storefront stock is sum of matching inventory records; no record => stock `0`.

### Patterns & Conventions Observed
- Admin APIs return machine-readable errors (`not_found`, `validation_error`) and UI surfaces these directly in some paths.
- Storefront stock badge and cart CTA are fully data-driven from `SKU.stock`.

### Data & Contracts
- Inventory PATCH contract:
  - Input: `{ quantity: int>=0, variantAttributes: Record<string,string> }`
  - Behavior: update only; missing record returns `404`.
- Product create contract:
  - Input includes `sku`, `title`, `price`, `status`, etc.
  - Behavior: writes product publication; no inventory side-effect.
- Stock contract:
  - `SKU.stock = sum(inventory.quantity for product matches)`.

### Dependency & Impact Map
- Upstream dependencies:
  - Admin auth/session for protected routes.
  - Product repository and inventory repository backends.
- Downstream dependents:
  - `/en/shop` card stock badges.
  - `/en/product/[slug]` stock text and Add to cart enablement.
- Likely blast radius:
  - Caryina admin inventory flow.
  - Caryina shop/PDP stock correctness.

### Test Landscape
#### Existing Test Coverage
- `apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts`
  - Covers update success and not-found behavior.
- No end-to-end test was found for: create product -> add first inventory -> verify storefront stock state.

#### Coverage Gaps
- Missing contract for first-write inventory creation/upsert.
- Missing integration test tying admin inventory write to customer-visible stock state.

### Recent Git History (Targeted)
- Existing archived plan evidence indicates inventory editor and PATCH route were built for update flows, not explicitly for new-SKU bootstrap creation.
  - `docs/plans/_archive/caryina-catalog-cart/plan.md`

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Admin product create | Yes | None | No |
| Admin inventory add for brand-new SKU | Yes | [API contract] [Critical]: PATCH path is update-only; missing record returns not_found | Yes |
| Inventory UI operator guidance | Yes | [UX contract] [Major]: copy says record will be created but API cannot create | Yes |
| Storefront stock projection | Yes | [Behavior] [Major]: new active product appears out-of-stock immediately | Yes |
| End-to-end regression coverage | Partial | [Test gap] [Major]: no integrated contract test for create->stock->storefront | Yes |

## Questions
### Resolved
- Q: Why does new SKU stock stay at zero even after admin submit?
  - A: Inventory PATCH route only mutates existing records; it does not create on missing current record.
  - Evidence: `apps/caryina/src/app/admin/api/inventory/[sku]/route.ts` and observed `404 not_found` from local simulation.

- Q: Why is Add to cart disabled on newly created active SKU?
  - A: Stock derives from inventory sum; with no inventory record, stock resolves to `0`.
  - Evidence: `packages/platform-core/src/repositories/catalogSkus.server.ts`, PDP render path in `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`.

## Confidence Inputs
- Implementation: 90%
  - Evidence: isolated code paths and live reproduction are consistent.
  - To reach >=95: run a post-fix replay with automated contract test.
- Approach: 88%
  - Evidence: clear narrow options (upsert or explicit create route).
  - To reach >=95: settle exact contract choice and acceptance criteria with operator.
- Impact: 92%
  - Evidence: issue blocks core admin-to-customer merchandising path.
  - To reach >=95: quantify frequency from production analytics/admin logs.
- Delivery-Readiness: 86%
  - Evidence: scope is localized and testable.
  - To reach >=90: codify migration/compat behavior for existing inventory rows.
- Testability: 84%
  - Evidence: route tests exist; integration seam is straightforward.
  - To reach >=90: define and implement create->stock->storefront integration test harness.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Choosing wrong creation contract (`PATCH` upsert vs `POST` create) causes future API ambiguity | Medium | High | Decide one canonical write contract in planning phase and document it in tests |
| UI copy remains misleading after backend fix | Medium | Medium | Include explicit UI copy/error-map task in implementation plan |
| Fix applied without storefront contract test regresses later | High | High | Add integration test as mandatory acceptance criterion |

## Suggested Task Seeds (Non-binding)
- TASK-01: Decide and document canonical inventory bootstrap contract (upsert PATCH or explicit create endpoint).
- TASK-02: Implement inventory bootstrap support for new SKUs.
- TASK-03: Align InventoryEditor copy and error mapping with API contract.
- TASK-04: Add integration test for create product -> add stock -> shop/PDP in-stock state.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Updated admin inventory write path and UI feedback.
  - Passing targeted route + integration tests.
  - Verified storefront stock/CTA behavior for new SKU flow.
- Post-delivery measurement plan:
  - Track admin inventory PATCH/creation error rates.
  - Spot-check newly created SKUs in shop/PDP after stock entry.

## Evidence Gap Review
### Gaps Addressed
- Reproduced and source-traced the broken new-SKU inventory path.
- Confirmed customer impact through stock projection path.

### Confidence Adjustments
- Raised implementation confidence due to deterministic repro and narrow blast radius.

### Remaining Assumptions
- Business preference for API shape (upsert vs explicit create) remains to be chosen in planning.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning.
- Recommended next step:
  - `/lp-do-plan caryina-inventory-addition-flow-hardening --auto`
