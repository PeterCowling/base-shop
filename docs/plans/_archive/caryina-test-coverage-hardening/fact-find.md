---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: caryina-test-coverage-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/caryina-test-coverage-hardening/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260302095925-0118, IDEA-DISPATCH-20260302095925-0119, IDEA-DISPATCH-20260302095925-0120, IDEA-DISPATCH-20260302095925-0121, IDEA-DISPATCH-20260302095925-0122
artifact: fact-find
---

# Caryina Test Coverage Hardening Fact-Find

## Scope
### Summary
Caryina’s route-handler coverage is strong, but high-risk untested areas remain: admin edge guard (`proxy.ts`), analytics client emitters, admin UI flows, and PDP server-page conditional rendering. This wave hardens those areas with targeted tests that are cheap to maintain and directly tied to regressions surfaced in the coverage review.

### Goals
- Add direct tests for the admin proxy guard decision tree.
- Add direct tests for analytics emitter payload contracts.
- Add direct tests for admin login, product form, and inventory editor workflows.
- Add PDP page tests for `notFound` and material details conditional rendering.
- Add missing `PATCH` and `PUT` delegation tests for `/api/cart`.

### Non-goals
- Full server-page coverage across all 17 `page.tsx` routes in one wave.
- CI coverage-threshold policy rollout in this same build wave.
- E2E expansion beyond current test policy constraints.

### Constraints & Assumptions
- Constraints:
  - No local Jest/e2e execution (CI-only test policy).
  - Changes must stay within `@apps/caryina` scope.
- Assumptions:
  - Existing Jest preset + test environment remain unchanged.
  - Incremental test additions reduce risk without requiring immediate CI coverage gates.

## Outcome Contract
- **Why:** Coverage audit identified branch-critical gaps in authentication, analytics, and admin/storefront behavior that can regress without detection.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add targeted tests that lock the identified high-risk behavioral contracts in Caryina and pass package type/lint gates.
- **Source:** operator

## Access Declarations
None.

## Evidence Audit (Current State)
### Entry Points
- `apps/caryina/src/proxy.ts`
- `apps/caryina/src/app/[lang]/shop/ShopAnalytics.client.tsx`
- `apps/caryina/src/app/[lang]/checkout/CheckoutAnalytics.client.tsx`
- `apps/caryina/src/app/[lang]/product/[slug]/ProductAnalytics.client.tsx`
- `apps/caryina/src/app/[lang]/success/SuccessAnalytics.client.tsx`
- `apps/caryina/src/app/admin/login/page.tsx`
- `apps/caryina/src/components/admin/ProductForm.client.tsx`
- `apps/caryina/src/components/admin/InventoryEditor.client.tsx`
- `apps/caryina/src/app/[lang]/product/[slug]/page.tsx`
- `apps/caryina/src/app/api/cart/route.ts`

### Key Findings
- `proxy.ts` had no direct tests despite being the `/admin/*` access boundary.
- Analytics emitter components had no contract tests for event payloads.
- Admin UI clients had no component-level tests for submit/error/delete flows.
- PDP server page lacked direct tests for `notFound` and material-details branch behavior.
- Cart route exported `PATCH`/`PUT`, but tests only covered `GET`/`POST`/`DELETE`.

## Questions
### Resolved
- Q: Can these gaps be addressed without changing runtime code paths?
  - A: Yes. Gaps are covered by adding focused tests and one existing test-file extension.

### Open (Operator Input Required)
- Q: Should Caryina coverage thresholds be enforced in CI immediately or rolled out in a separate governance wave?
  - Why operator input is required: threshold strictness affects merge friction and team policy.
  - Decision impacted: dispatch `...-0122` implementation scope.
  - Decision owner: operator.

## Confidence Inputs
- Implementation: 92%
- Approach: 90%
- Impact: 84%
- Delivery-Readiness: 90%
- Testability: 91%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Overfitting tests to mocked contracts | Medium | Medium | Keep assertions behavior-level and avoid internal implementation coupling |
| Remaining untested server pages | High | Medium | Track as explicit follow-up wave |
| CI gate policy uncertainty | Medium | Medium | Keep governance item separated from test hardening build wave |
