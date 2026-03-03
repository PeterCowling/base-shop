---
Type: Build-Record
Status: Complete
Feature-Slug: caryina-test-coverage-hardening
Completed-date: 2026-03-02
artifact: build-record
---

# Build Record: Caryina Test Coverage Hardening

## Outcome Contract
- **Why:** Coverage audit identified branch-critical gaps in authentication, analytics, and admin/storefront behavior that can regress without detection.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add targeted tests that lock the identified high-risk behavioral contracts in Caryina and pass package type/lint gates.
- **Source:** operator

## What Was Built
Completed the full Caryina coverage-hardening wave across all planned areas: admin proxy guard tests, analytics emitter payload-contract tests, admin login/product/inventory form-flow tests, PDP conditional-render branch tests, and cart API method delegation coverage (`PATCH` and `PUT`). Then expanded server-page coverage in two waves (admin pages + checkout/success/cancelled, followed by localized support/policy/home/shop routes). Post-plan hardening ratcheted Caryina coverage thresholds from `5/2/5/5` to `10/5/10/10` and added a CI smoke e2e gate for checkout and admin product edit paths wired through reusable app workflow inputs.

## Tests Run
| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/caryina typecheck` | Pass | Re-run after coverage additions and CI wiring updates |
| `pnpm --filter @apps/caryina lint` | Pass | No new lint errors in Caryina package |
| `pnpm --filter @acme/axerve lint` | Pass | Included due test determinism adjustment in `packages/axerve/src/index.test.ts` |
| `pnpm run lint:exceptions` | Pass | Verified newly registered active exception tickets |

Note: per repository policy, local Jest/e2e execution was not run; test execution remains CI source-of-truth.

## Validation Evidence
- TASK-01 to TASK-05: Direct behavior coverage added for proxy/auth boundary, analytics emitters, admin UI workflows, PDP branches, and cart method delegation; plan acceptance criteria marked complete in `plan.md`.
- TASK-06: CI coverage collection enabled for Caryina and explicit app threshold baseline introduced, then ratcheted to `10/5/10/10` in follow-up hardening.
- TASK-07 and TASK-08: Server-page coverage expansion completed across planned admin, checkout-state, support/policy, and localized storefront routes.
- Post-plan CI hardening: Added Playwright smoke tests (`checkout.smoke.spec.ts`, `admin-product-edit.smoke.spec.ts`) and wired reusable workflow `e2e-smoke-cmd` input for Caryina app pipeline.

## Scope Deviations
- Added bounded post-plan hardening inside the same risk objective:
  - Coverage threshold ratchet (`apps/caryina/jest.config.cjs`)
  - Smoke e2e scaffolding + workflow wiring (`apps/caryina/e2e/*`, `apps/caryina/playwright.config.ts`, `.github/workflows/reusable-app.yml`, `.github/workflows/caryina.yml`)
  - Axerve test-environment cleanup to keep deterministic pathing (`packages/axerve/src/index.test.ts`)
- These changes remained aligned to the original test-coverage hardening outcome and did not expand into unrelated product behavior.
