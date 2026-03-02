---
Type: Plan
Status: Active
Domain: UI
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: caryina-test-coverage-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 93%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Caryina Test Coverage Hardening Plan

## Summary
This plan hardened Caryina test coverage across authentication guards, analytics emitters, admin UI/forms, PDP branch logic, cart route handler delegation, and three server-page coverage waves. It also implemented a phased CI coverage gate for Caryina by forcing coverage collection in the app pipeline and setting an explicit non-zero baseline threshold.

## Active tasks
- [x] TASK-01: Add `proxy.ts` guard tests.
- [x] TASK-02: Add analytics emitter contract tests.
- [x] TASK-03: Add admin login + form flow tests.
- [x] TASK-04: Add PDP page branch tests (`notFound`, material details section).
- [x] TASK-05: Extend cart route delegation tests for `PATCH` and `PUT`.
- [x] TASK-06: Decide and implement Caryina CI coverage gate policy (dispatch `...-0122`).
- [x] TASK-07: Expand server-page coverage beyond PDP/home/shop in wave 2.
- [x] TASK-08: Expand localized server-page coverage for support/policy/home/shop (wave 3).

## Inherited Outcome Contract
- **Why:** Coverage audit identified branch-critical gaps in authentication, analytics, and admin/storefront behavior that can regress without detection.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add targeted tests that lock the identified high-risk behavioral contracts in Caryina and pass package type/lint gates.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/caryina-test-coverage-hardening/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add proxy guard tests | 90% | S | Complete | - | - |
| TASK-02 | IMPLEMENT | Add analytics emitter tests | 88% | S | Complete | - | - |
| TASK-03 | IMPLEMENT | Add admin UI tests | 86% | M | Complete | - | - |
| TASK-04 | IMPLEMENT | Add PDP branch tests | 82% | M | Complete | - | - |
| TASK-05 | IMPLEMENT | Extend cart route tests | 92% | S | Complete | - | - |
| TASK-06 | DECISION | Coverage gate policy (phased CI rollout implemented) | 86% | M | Complete | - | release governance |
| TASK-07 | IMPLEMENT | Server page coverage wave 2 | 84% | L | Complete | TASK-04 | release confidence |
| TASK-08 | IMPLEMENT | Localized server-page coverage wave 3 | 88% | M | Complete | TASK-07 | release confidence |

## Build Evidence
### TASK-06
- Added reusable pipeline input `jest-force-coverage` and wired `JEST_FORCE_COVERAGE` into both standard and sharded test jobs.
- Enabled `jest-force-coverage: true` for Caryina in `.github/workflows/caryina.yml`.
- Added explicit Caryina Jest phase-one coverage threshold baseline (`5/2/5/5`) in `apps/caryina/jest.config.cjs`.

### TASK-07
- Added server-page tests for:
  - `apps/caryina/src/app/admin/products/page.tsx`
  - `apps/caryina/src/app/admin/products/new/page.tsx`
  - `apps/caryina/src/app/admin/products/[id]/page.tsx`
  - `apps/caryina/src/app/[lang]/checkout/page.tsx`
  - `apps/caryina/src/app/[lang]/success/page.tsx`
  - `apps/caryina/src/app/[lang]/cancelled/page.tsx`

### TASK-08
- Added localized server-page tests for:
  - `apps/caryina/src/app/[lang]/support/page.tsx`
  - `apps/caryina/src/app/[lang]/returns/page.tsx`
  - `apps/caryina/src/app/[lang]/shipping/page.tsx`
  - `apps/caryina/src/app/[lang]/terms/page.tsx`
  - `apps/caryina/src/app/[lang]/privacy/page.tsx`
  - `apps/caryina/src/app/[lang]/page.tsx`
  - `apps/caryina/src/app/[lang]/shop/page.tsx`
- Validated package gates:
  - `pnpm --filter @apps/caryina lint`
  - `pnpm --filter @apps/caryina typecheck`

## Risks & Mitigations
- Coverage baseline threshold is intentionally low in phase one.
  - Mitigation: ratchet threshold upward after CI establishes stable baseline over multiple runs.
- Route render contracts are now broad, but route-level e2e remains minimal.
  - Mitigation: expand CI e2e to include at least one checkout happy path + one admin edit path.

## Acceptance Criteria (overall)
- [x] New tests added for proxy, analytics emitters, admin UI, PDP branches, and cart PATCH/PUT delegation.
- [x] Wave-2 server-page tests added for key admin and checkout/success/cancelled pages.
- [x] Wave-3 server-page tests added for support/policy/home/shop localized routes.
- [x] `pnpm --filter @apps/caryina typecheck` passes.
- [x] `pnpm --filter @apps/caryina lint` passes.
- [x] CI coverage threshold strategy agreed and implemented.
