---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: hbag-caryina-checkout-inventory-integrity
Dispatch-ID: IDEA-DISPATCH-20260302100120-0123
Trigger-Source: dispatch-routed
Business: HBAG
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/hbag-caryina-checkout-inventory-integrity/plan.md
Trigger-Why: Checkout inventory integrity gap. Caryina can accept payment without decrementing inventory, which creates oversell risk and incorrect stock visibility.
Trigger-Intended-Outcome: type: measurable | statement: Checkout flow prevents oversell by validating real inventory at payment time and decrementing stock exactly once on successful payment, with deterministic tests proving behavior | source: auto
---

# HBAG Caryina Checkout Inventory Integrity — Fact-Find Brief

## Scope
### Summary
Caryina currently validates stock when items are added to cart, but checkout success does not mutate inventory. The payment route removes cart state after successful Axerve response, yet inventory quantity remains unchanged. This creates a stock-integrity gap: concurrent buyers can both pass add-to-cart checks against stale stock and both complete payment without decrementing inventory.

### Goals
- Define a production-safe inventory integrity contract for Caryina checkout.
- Introduce checkout-time inventory validation against current inventory, not cart snapshot alone.
- Decrement inventory exactly once for successful payments and protect against duplicate/parallel success paths.
- Add explicit tests for oversell prevention and inventory mutation behavior.

### Non-goals
- Full reservation/hold system across long-lived carts.
- OMS/order-table redesign.
- UI redesign of cart or checkout pages.

### Constraints & Assumptions
- Constraints:
  - Existing checkout uses Axerve S2S and returns success synchronously from POST /api/checkout-session.
  - Inventory source of truth is repository-backed (data/shops/caryina/inventory.json via platform-core inventory repository).
  - Cart API currently caps quantity using sku.stock at add/update time, but does not reserve stock.
- Assumptions:
  - This gap is launch-critical (SELL domain) because oversell risk directly affects customer trust and fulfillment.

## Outcome Contract
- **Why:** Caryina can complete payment without reducing stock, which can cause oversell and operational failures.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** Checkout blocks payment when current inventory is insufficient and reduces inventory on successful payment, with automated tests covering success, insufficient stock, and concurrent purchase edge cases.
- **Source:** auto

## Access Declarations
- External services: None required for this fact-find.
- Repo + local runtime evidence only.

## Evidence Audit (Current State)
### Entry Points
- apps/caryina/src/app/api/checkout-session/route.ts - payment success path.
- apps/caryina/src/app/api/cart/route.ts + packages/platform-core/src/cartApiForShop.ts - cart-time stock checks.
- packages/platform-core/src/repositories/catalogSkus.server.ts - sku.stock derivation from inventory.
- apps/caryina/src/app/admin/api/inventory/[sku]/route.ts - only existing inventory mutation path.

### Key Modules / Files
- apps/caryina/src/app/api/checkout-session/route.ts
  - Reads cart, validates card fields, calls Axerve, deletes cart, sends emails, returns success.
  - No inventory repository imports and no inventory write operations in success path.
- packages/platform-core/src/cartApiForShop.ts
  - Enforces quantity <= sku.stock on cart PUT and POST.
  - This is pre-checkout validation only, not reservation or post-payment decrement.
- packages/platform-core/src/repositories/catalogSkus.server.ts
  - Computes sku.stock by summing inventory quantities.
- apps/caryina/src/app/admin/api/inventory/[sku]/route.ts
  - Demonstrates inventory mutation through updateInventoryItem; not wired to checkout.

### Patterns & Conventions Observed
- Checkout route is side-effect oriented in success path (cart delete + notifications), but inventory integrity is not part of the side-effect bundle.
- Inventory mutation is centralized in platform-core repositories with file/DB backend abstraction.
- Caryina route tests mock payment/cart/email behavior but omit inventory assertions.

### Data & Contracts
- Checkout success API shape: { success: true, transactionId, amount, currency }.
- Cart API rejects insufficient stock at add/replace time with 409.
- No checkout response code/path currently represents inventory insufficiency at submit time.

### Dependency & Impact Map
- Upstream dependencies:
  - Axerve payment result handling in checkout route.
  - Cart store contents and cart cookie decoding.
- Downstream dependents:
  - Shop/PDP stock display (sku.stock) derived from inventory.
  - Fulfillment and merchant operations that assume stock accuracy.
- Likely blast radius:
  - Checkout route behavior and tests.
  - Potential additions to inventory repository usage in checkout flow.
  - Potential extension of API error contract for inventory conflicts.

### Test Landscape
#### Existing Test Coverage
- apps/caryina/src/app/api/checkout-session/route.test.ts
  - Covers success/KO/SOAP error/missing fields/email-error handling.
  - No inventory read/write checks.
- apps/caryina/src/app/admin/api/inventory/[sku]/route.test.ts
  - Confirms inventory update endpoint behavior separately from checkout.

#### Coverage Gaps
- No test asserting inventory decrement after successful payment.
- No checkout-time inventory insufficiency test.
- No concurrency/idempotency test for double-submit/double-success race.

#### Recommended Test Approach
- Route-level unit tests for checkout with mocked inventory repository calls.
- Integration-style test against JSON backend for before/after quantity verification.
- Concurrency scenario test (or deterministic idempotency guard test) to prevent double decrement.

### Runtime Verification Snapshot
- Agent-run local flow: product -> cart -> checkout -> payment success (200, redirect to /en/success).
- Before/after quantity for caryina-mini-facade-bag-charm-silver remained 5 -> 5.
- data/shops/caryina/inventory.json SHA-256 unchanged before vs after checkout.

## Questions
### Resolved
- Q: Is inventory decremented on successful sale today?
  - A: No.
  - Evidence: checkout route success path has no inventory mutation; runtime verification shows no file change.

- Q: Is there any stock validation in current flow?
  - A: Yes, but only at cart operations (add/replace), not at checkout submit.
  - Evidence: packages/platform-core/src/cartApiForShop.ts quantity checks.

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 86%
  - Existing repository primitives support safe inventory mutation; checkout route change is bounded.
  - Raise to >=90 with explicit idempotency design selected (payment transaction keyed mutation or lock strategy).
- Approach: 90%
  - Clear seam: augment checkout route with inventory validation + decrement.
- Impact: 94%
  - Directly addresses oversell and stock-trust risk in primary revenue flow.
- Delivery-Readiness: 88%
  - Evidence complete for planning; implementation details for concurrency/idempotency need design choice.
- Testability: 89%
  - Existing route test harness is strong; concurrency cases need deliberate deterministic strategy.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Double decrement from duplicate success execution | Medium | High | Add idempotency guard keyed by transaction/cart id before decrement write. |
| Inventory backend write contention | Medium | Medium | Use existing repository lock/update semantics and fail-safe response path. |
| API contract change affects checkout UX | Low | Medium | Use explicit inventory conflict status (409) and clear client error handling. |

## Planning Constraints & Notes
- Preserve existing checkout success response shape unless explicit client change is planned.
- Keep inventory mutation coupled to confirmed payment success only.
- Ensure failure mode does not silently accept payment while skipping decrement.

## Suggested Task Seeds (Non-binding)
- Add checkout-time inventory verification helper in Caryina checkout route.
- Add atomic per-line decrement via inventory repository mutation.
- Add route tests: success decrement, insufficient stock conflict, duplicate-submit idempotency.
- Add telemetry/logging for inventory conflict and decrement outcomes.

## Execution Routing Packet
- Primary execution skill:
  - lp-do-build
- Supporting skills:
  - none
- Deliverable acceptance package:
  - Code diff + route tests + validation output for affected packages.
- Post-delivery measurement plan:
  - Track checkout conflict rate and verify stock alignment after successful orders.

## Evidence Gap Review
### Gaps Addressed
- Verified code-path claim (no inventory decrement in checkout route) via source and runtime evidence.
- Verified current stock-check behavior is cart-time only.

### Confidence Adjustments
- Increased Impact confidence after runtime confirmation that inventory remains unchanged post-sale.

### Remaining Assumptions
- Idempotency mechanism selection is deferred to plan/build stage.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - /lp-do-plan hbag-caryina-checkout-inventory-integrity --auto
