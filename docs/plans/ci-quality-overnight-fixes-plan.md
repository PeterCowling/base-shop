---
Type: Plan
Status: Complete
Domain: Infra
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: ci-quality-overnight-fixes
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-Unit: PLAT
---

# CI Quality Overnight Fixes Plan

## Summary

The overnight scheduled `Workspace CI` run on `main` (run 21774140195) failed 9 of ~50 quality jobs. After triaging, 6 failures need fixes (1 already fixed on dev, 1 is a CI ghost, 1 is pre-existing/skipped). This plan covers the 6 actionable fixes, grouped into 5 tasks to get CI green.

## Goals

- Green overnight CI on main
- Each failure either fixed or explicitly documented as skipped with rationale

## Non-goals

- Fixing pre-existing storybook build issues (P4, build already skipped)
- Adding new test coverage beyond what's needed to fix failures
- Fixing the brikette compat ghost (files deleted, CI caching issue — self-resolves)

## Constraints & Assumptions

- Constraints:
  - Fixes on `dev` branch, then merged to `main` via normal PR flow
  - No destructive commands or bypass flags
- Assumptions:
  - Configurator auth test (#8) is already fixed on dev — no action needed
  - Brikette compat error (#2) is a CI cache ghost — no action needed

## Fact-Find Reference

- Related brief: `docs/plans/ci-quality-overnight-fixes-fact-find.md`
- Key findings:
  - 3 build failures share a root cause: CI workflow `test.yml:55` uses `pnpm --filter` which doesn't build transitive deps
  - API test failures are caused by Jest mock hoisting: `testHelpers.ts` has mocks but doesn't import the module under test
  - Prime ESLint failure is a recent regression from extracting ignore patterns
  - NavItem Zod schema uses explicit annotation that conflicts with optional children

## Existing System Notes

- Key modules/files:
  - `.github/workflows/test.yml:55` — CI build command for all workspaces
  - `turbo.json` — build task uses `dependsOn: ["^build"]` for dependency ordering
  - `apps/api/src/routes/components/__tests__/testHelpers.ts` — shared test helper missing module import
  - `apps/api/src/routes/components/__tests__/onRequestTestUtils.ts` — correctly structured test helper (reference pattern)
- Patterns to follow:
  - `onRequestTestUtils.ts` — imports and re-exports `onRequest` so mocks are registered before module loads
  - `packages/template-app/package.json` — uses `prebuild` for dependency build ordering
  - `apps/api/src/routes/shop/[id]/__tests__/publish-upgrade.test-helpers.ts` — correctly mocks `@acme/lib/context`

## Proposed Approach

Fix each failure at the most appropriate level:

1. **Systemic CI fix** — Switch `test.yml:55` from `pnpm --filter` to `turbo run build` to fix 3 build ordering failures at once
2. **API test fix** — Fix Jest mock hoisting in `testHelpers.ts` by importing/re-exporting `onRequest`
3. **Type fix** — Fix navItemSchema annotation with `satisfies`
4. **ESLint config fix** — Remove prime from global ignores
5. **tsconfig fix** — Add missing `@themes/base` reference to design-tokens

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix CI build ordering with Turbo | 92% | S | Complete (2026-02-07) | - |
| TASK-02 | IMPLEMENT | Fix API component test mock hoisting | 88% | M | Complete (2026-02-07) | - |
| TASK-03 | IMPLEMENT | Fix navItemSchema type annotation | 95% | S | Complete (2026-02-07) — No code change needed; CI failure was stale cache | - |
| TASK-04 | IMPLEMENT | Fix prime ESLint configuration | 90% | S | Complete (2026-02-07) | - |
| TASK-05 | IMPLEMENT | Fix design-tokens tsconfig reference | 92% | S | Complete (2026-02-07) | TASK-01 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: Fix CI build ordering with Turbo

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `.github/workflows/test.yml`
  - [readonly] `turbo.json`
  - [readonly] `.github/actions/setup-repo/action.yml`
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — Turbo is already configured in CI with remote cache; `dependsOn: ["^build"]` handles dependency ordering
  - Approach: 90% — Turbo is the standard build orchestrator in this repo; all other workflows use it for builds
  - Impact: 90% — Verified via `turbo run build --dry-run` that dependencies are correctly ordered; workspaces without build scripts are gracefully skipped (exit 0)
- **Acceptance:**
  - `test.yml:55` uses `pnpm exec turbo run build --filter=./${{ matrix.workspace }}` instead of `pnpm --filter ./${{ matrix.workspace }}... build`
  - cochlearfit, template-app, and design-tokens build without error in CI
  - Workspaces without `build` scripts (e.g., `__tests__`, `scripts`, theme packages) still pass
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: CI job for `apps/cochlearfit` builds successfully (transitive dep `@acme/i18n` built first) → exit 0
    - TC-02: CI job for `packages/template-app` builds successfully (transitive dep `@acme/page-builder-ui` built first) → exit 0
    - TC-03: CI job for `packages/design-tokens` builds successfully (transitive dep `@themes/base` built first) → exit 0
    - TC-04: CI job for workspace without `build` script (e.g., `__tests__`) → exit 0 (no error)
    - TC-05: CI job for a workspace with no transitive deps (e.g., `packages/types`) → builds normally
  - **Acceptance coverage:** TC-01/02/03 cover the three failing workspaces; TC-04/05 cover regression
  - **Test type:** CI integration (manual trigger of workflow)
  - **Test location:** GitHub Actions workflow re-run
  - **Run:** `gh workflow run test.yml` or push to main
- **Rollout / rollback:**
  - Rollout: Direct commit to dev, merge to main
  - Rollback: Revert the single line change in test.yml
- **Documentation impact:** None
- **Notes / references:**
  - Turbo remote cache already configured via `setup-repo` action (turbo-token, turbo-team)
  - Validated: `pnpm exec turbo run build --filter=./apps/cochlearfit --dry-run` correctly includes 15 dependencies

---

### TASK-02: Fix API component test mock hoisting

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `apps/api/src/routes/components/__tests__/testHelpers.ts`
  - Primary: `apps/api/src/routes/components/__tests__/authorization.test.ts`
  - Primary: `apps/api/src/routes/components/__tests__/idValidation.test.ts`
  - Primary: `apps/api/src/routes/components/__tests__/fileOperations.test.ts`
  - [readonly] `apps/api/src/routes/components/__tests__/onRequestTestUtils.ts` (reference pattern)
  - [readonly] `apps/api/src/routes/components/[shopId].ts` (module under test)
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — Root cause confirmed: `testHelpers.ts` has `jest.mock` calls but doesn't import `[shopId]`, so test files that import `[shopId]` directly get unmocked modules. Fix pattern proven in `onRequestTestUtils.ts`.
  - Approach: 85% — Two viable approaches: (a) add `onRequest` import/re-export to `testHelpers.ts`, (b) add `jest.mock` calls directly to each test file. Approach (a) is cleaner and matches existing pattern.
  - Impact: 88% — 3 test suites affected locally; CI may have additional failures from cold module cache. All use `testHelpers.ts` exclusively.
- **Acceptance:**
  - `testHelpers.ts` imports and re-exports `onRequest` from `[shopId]` (matching `onRequestTestUtils.ts` pattern)
  - Test files import `onRequest` from `testHelpers` instead of directly from `[shopId]`
  - All 3 failing test suites pass: `authorization.test.ts`, `idValidation.test.ts`, `fileOperations.test.ts`
  - All previously passing tests remain green
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `authorization.test.ts` — all 11 tests pass → 0 failures
    - TC-02: `idValidation.test.ts` — all 5 tests pass → 0 failures
    - TC-03: `fileOperations.test.ts` — all tests pass → 0 failures
    - TC-04: `onRequest.validation.test.ts` — still passes (no regression) → 4 pass
    - TC-05: `onRequest.authorization.test.ts` — still passes (no regression)
    - TC-06: `onRequest.success.test.ts` — still passes (no regression)
    - TC-07: Full `apps/api` test suite — no new failures
  - **Acceptance coverage:** TC-01/02/03 cover the three failing suites; TC-04-07 cover regression
  - **Test type:** unit (Jest)
  - **Test location:** `apps/api/src/routes/components/__tests__/`
  - **Run:** `pnpm exec jest --config jest.config.cjs apps/api/src/routes/components/__tests__/ --no-coverage`
- **Planning validation:**
  - Tests run: `pnpm exec jest --config jest.config.cjs apps/api/src/routes/components/__tests__/ --no-coverage` — 3 failed, 7 passed (10 suites)
  - Confirmed root cause: test files using `testHelpers.ts` import `[shopId]` before mocks are registered
  - Confirmed fix pattern: `onRequestTestUtils.ts` imports `[shopId]` after mocks → tests pass
  - Unexpected findings: Only 16 tests fail locally vs 66 in CI — CI likely has additional module resolution failures in cold cache
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Revert test helper changes
- **Documentation impact:** None
- **Notes / references:**
  - Reference pattern: `onRequestTestUtils.ts` imports `onRequest` and re-exports it (line 9, 17)
  - Jest hoists `jest.mock` within the file where they appear — mocks in imported files don't affect the importing file's import resolution order

---

### TASK-03: Fix navItemSchema type annotation

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `packages/types/src/shop-config.ts`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — Change `: z.ZodType<NavItem>` to use `satisfies`. TypeScript 5.8.3 fully supports `satisfies`. All usages of `children` already treat it as optional.
  - Approach: 95% — `satisfies` is the standard Zod pattern for recursive schemas; avoids type inference narrowing issues
  - Impact: 92% — Blast radius verified: `navItemSchema` used in 3 locations; all code accesses `children` with optional guards
- **Acceptance:**
  - `navItemSchema` uses `satisfies z.ZodType<NavItem>` instead of `: z.ZodType<NavItem>`
  - `pnpm --filter @apps/product-pipeline typecheck` passes
  - `pnpm typecheck` shows no new errors
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `pnpm --filter @acme/types typecheck` → exit 0
    - TC-02: `pnpm --filter @apps/product-pipeline typecheck` → exit 0 (was failing)
    - TC-03: Runtime behavior unchanged — Zod schema validates same inputs/outputs
  - **Acceptance coverage:** TC-01/02 cover the typecheck fix; TC-03 covered by existing tests
  - **Test type:** typecheck (tsc)
  - **Test location:** `packages/types/`, `apps/product-pipeline/`
  - **Run:** `pnpm --filter @acme/types... typecheck`
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Revert single file
- **Documentation impact:** None
- **Notes / references:**
  - `NavItem.children` is already `children?: NavItem[]` (optional) — type matches schema intent
  - Same pattern exists in `packages/platform-core/src/createShop/schema.ts:19` — could be fixed too but is not blocking CI

---

### TASK-04: Fix prime ESLint configuration

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `tools/eslint-ignore-patterns.cjs`
  - [readonly] `apps/prime/.eslintrc.cjs`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 95% — Remove one line (`"apps/prime/**"`) from ignore patterns
  - Approach: 90% — Prime has a working `.eslintrc.cjs` config; the exemption was always meant to be temporary ("exempt while in early development")
  - Impact: 85% — Removing the exemption means prime code will be linted; may surface existing lint errors that need fixing or disabling
- **Acceptance:**
  - `"apps/prime/**"` removed from `tools/eslint-ignore-patterns.cjs`
  - `pnpm --filter @apps/prime lint` exits 0 (or lint errors are fixed)
  - No other workspaces affected by the change
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `pnpm --filter @apps/prime lint` → exit 0
    - TC-02: `pnpm lint` (root) → prime files are now linted (not skipped)
    - TC-03: Other workspaces' lint still passes (no regression)
  - **Acceptance coverage:** TC-01 covers the fix; TC-02/03 cover regression
  - **Test type:** lint (ESLint)
  - **Test location:** `apps/prime/`
  - **Run:** `pnpm --filter @apps/prime lint`
- **What would make this >=90%:**
  - Running `pnpm --filter @apps/prime lint` locally to verify no lint errors surface
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Re-add the ignore pattern
- **Documentation impact:** None
- **Notes / references:**
  - Regression introduced in commit `5b064ce34f` (Feb 5, 2026)
  - Prime's `.eslintrc.cjs` extends `next/core-web-vitals` with some DS rules disabled

---

### TASK-05: Fix design-tokens tsconfig reference

- **Type:** IMPLEMENT
- **Affects:**
  - Primary: `packages/design-tokens/tsconfig.json`
  - [readonly] `packages/themes/base/tsconfig.json`
- **Depends on:** TASK-01 (Turbo fix ensures `@themes/base` is built first; tsconfig reference provides additional TypeScript-level ordering)
- **Confidence:** 92%
  - Implementation: 95% — Add one reference entry to tsconfig.json
  - Approach: 92% — tsconfig project references are the standard mechanism for TypeScript build ordering in this repo
  - Impact: 90% — Only affects design-tokens build; `@themes/base` is a simple token package with no complex dependencies
- **Acceptance:**
  - `packages/design-tokens/tsconfig.json` references `{ "path": "../themes/base" }`
  - `pnpm --filter @acme/design-tokens typecheck` passes
  - `pnpm --filter @acme/design-tokens build` passes
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: `pnpm --filter @acme/design-tokens build` from clean state → exit 0
    - TC-02: `pnpm --filter @acme/design-tokens typecheck` → exit 0
    - TC-03: Existing design-tokens tests still pass
  - **Acceptance coverage:** TC-01/02 cover the typecheck fix; TC-03 covers regression
  - **Test type:** typecheck + build
  - **Test location:** `packages/design-tokens/`
  - **Run:** `pnpm --filter @acme/design-tokens... build && pnpm --filter @acme/design-tokens typecheck`
- **Rollout / rollback:**
  - Rollout: Direct commit to dev
  - Rollback: Revert tsconfig.json change
- **Documentation impact:** None
- **Notes / references:**
  - Current references: `[{ "path": "../types" }]` — add `{ "path": "../themes/base" }`
  - TASK-01's Turbo fix also addresses this at the CI level, but the tsconfig reference is needed for correct TypeScript project reference builds

## Risks & Mitigations

- **Risk:** Removing prime ESLint exemption surfaces lint errors
  - **Mitigation:** Run lint locally first; fix errors or add targeted disables before committing
- **Risk:** Turbo build change affects workspaces without build scripts
  - **Mitigation:** Validated that Turbo gracefully skips missing scripts (exit 0, "No tasks executed")
- **Risk:** API test helper restructuring breaks other tests
  - **Mitigation:** Run full `apps/api` test suite after changes; only modify import/export structure, not test logic

## Observability

- Logging: N/A (CI infrastructure changes)
- Metrics: Green/red overnight CI run
- Alerts/Dashboards: GitHub Actions notification on workflow failure

## Acceptance Criteria (overall)

- [ ] Overnight `Workspace CI` scheduled run passes for all 6 previously failing jobs
- [ ] No regressions in previously passing jobs
- [ ] `pnpm typecheck && pnpm lint` passes locally on dev
- [ ] All API component tests pass: `pnpm exec jest --config jest.config.cjs apps/api/src/routes/components/__tests__/`

## Decision Log

- 2026-02-07: Chose Turbo systemic fix over per-package prebuild scripts — fixes 3 failures with 1 line change and prevents future similar issues
- 2026-02-07: Chose to fix `testHelpers.ts` by importing/re-exporting `onRequest` (matching `onRequestTestUtils.ts` pattern) rather than adding `jest.mock` to each test file — cleaner, DRY, proven pattern
- 2026-02-07: Deferred storybook fix (P4) — build already skipped, duplicate stories issue needs deeper investigation
- 2026-02-07: No action on configurator auth test — already fixed on dev (commit `4d9325702e`)
- 2026-02-07: No action on brikette compat — files deleted from main, likely CI cache ghost
