---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Created: 2026-02-07
Last-updated: 2026-02-07
Feature-Slug: ci-quality-overnight-fixes
Related-Plan: docs/plans/ci-quality-overnight-fixes-plan.md
Business-Unit: PLAT
---

# CI Quality Overnight Fixes — Fact-Find Brief

## Scope

### Summary

The overnight scheduled `Workspace CI` run (GitHub Actions run 21774140195, 2026-02-07 04:25 UTC) on `main` failed with 9 of ~50 workspace quality jobs red. This brief categorizes each failure, determines root cause, and recommends a fix disposition: **fix code**, **fix test**, **skip/remove**, or **already fixed on dev**.

### Goals

- Green overnight CI on main
- Each failure triaged with clear fix or explicit skip rationale

### Non-goals

- Fixing failures that only exist on feature branches
- Adding new test coverage beyond what's needed to fix failures

### Constraints & Assumptions

- Constraints:
  - Main and dev are significantly diverged (~4645 files changed). Some fixes may already exist on dev.
  - Scheduled CI runs on `main` branch only.
- Assumptions:
  - Fixes should be made on `dev` then merged to `main` via the normal PR flow.

## Failure Inventory

### Summary Table

| # | Workspace | Stage | Root Cause | Disposition | Effort | Priority |
|---|-----------|-------|-----------|-------------|--------|----------|
| 1 | `apps/product-pipeline` | typecheck | Zod type annotation mismatch | Fix code | S | P2 |
| 2 | `apps/brikette` | typecheck | React memo type variance | Investigate | S | P2 |
| 3 | `apps/cochlearfit` | typecheck | `@acme/i18n` not built before cochlearfit | Fix CI or prebuild | S | P2 |
| 4 | `apps/api` | test | Missing `withRequestContext` mock in component tests | Fix tests | M | P1 |
| 5 | `apps/prime` | lint | ESLint ignores all prime files | Fix config | S | P3 |
| 6 | `apps/storybook` | build | Webpack/duplicate stories (build already skipped) | Skip (pre-existing) | — | P4 |
| 7 | `packages/design-tokens` | typecheck | `@themes/base` not built; missing tsconfig reference | Fix tsconfig | S | P2 |
| 8 | `packages/configurator` | test | Missing env vars in auth test | Already fixed on dev | — | — |
| 9 | `packages/template-app` | build | `@acme/page-builder-ui` not built before template-app | Fix prebuild | S | P2 |

**Effort key:** S = small (< 30 min), M = medium (1-2 hours)

---

## Detailed Analysis

### 1. apps/product-pipeline — typecheck (Zod type annotation)

**Error:** `packages/types/src/shop-config.ts:11` — `ZodLazy<...>` not assignable to `ZodType<NavItem>` because `children` is `NavItem[] | undefined` vs required.

**Root cause:** The `NavItem` type has `children: NavItem[]` (required), but the schema uses `.optional()` on children, producing `NavItem[] | undefined`. The explicit `: z.ZodType<NavItem>` annotation rejects this mismatch.

**Pre-existing:** Yes — unchanged since commit `2414f395f2c` (Dec 2025).

**Fix (code):** Use `satisfies` instead of explicit annotation:
```typescript
export const navItemSchema = z.lazy(() =>
  z.object({
    label: z.string(),
    url: z.string(),
    children: z.array(navItemSchema).optional(),
  }).strict(),
) satisfies z.ZodType<NavItem>;
```
Also make `children` optional in the `NavItem` type to match the schema intent.

**Files:** `packages/types/src/shop-config.ts`

---

### 2. apps/brikette — typecheck (route-modules)

**Error:** `src/compat/route-modules.ts:8` — `NamedExoticComponent<object>` not assignable to `ExoticComponent<unknown>`.

**Key finding:** The compat directory was **deleted from main** and dev (confirmed via `git show main:apps/brikette/src/compat/route-modules.ts` → "does not exist"). This error may be from a stale CI cache or build artifact.

**Investigation needed:** Verify whether this reproduces on a clean `main` checkout. If the file is truly gone, this failure is a CI caching ghost and will self-resolve.

**Disposition:** Likely already fixed. Verify with a manual CI re-run or cache bust.

---

### 3. apps/cochlearfit — typecheck (`@acme/i18n` not found)

**Error:** `Cannot find module '@acme/i18n'` in `src/app/[lang]/layout.tsx:1`.

**Root cause:** CI workflow (`test.yml:55`) runs `pnpm --filter ./apps/cochlearfit... build`. With relative path filters, pnpm may not correctly resolve and build transitive workspace dependencies. `@acme/i18n` needs to be compiled (`tsc -b` → `dist/`) before cochlearfit can import it.

**Comparison:** `packages/template-app` solves this with a `prebuild` script: `"prebuild": "pnpm --filter @acme/i18n build"`. Cochlearfit has no such step.

**Fix (code):** Add prebuild to `apps/cochlearfit/package.json`:
```json
"prebuild": "pnpm --filter @acme/i18n build"
```

**Files:** `apps/cochlearfit/package.json`

---

### 4. apps/api — test (66 failures, 9 suites)

**Error pattern A (publish-upgrade tests):** `TypeError: (0, shared_utils_1.withRequestContext) is not a function`

**Error pattern B (validation/auth tests):** `toHaveBeenCalledWith` assertions fail with extra `env`/`service` properties.

**Root cause:** The `[shopId].ts` route handler imports `withRequestContext` from `@acme/lib/context` (line 14). The **publish-upgrade** test helper correctly mocks this:
```typescript
jest.mock("@acme/lib/context", () => ({
  withRequestContext: (_ctx: unknown, fn: () => unknown) => fn(),
}));
```
But the **components** test helpers (`onRequestTestUtils.ts`, `testHelpers.ts`) do **not** mock `@acme/lib/context`. Without the mock, `withRequestContext` tries to run real context setup which fails, and the handler never reaches the assertion points.

Pattern B is a consequence: the handler code now passes `{ id, service: SERVICE_NAME, env: ENV_LABEL }` to `logger.warn`, but the tests use `expect.objectContaining({ id })` which should match. However, because `withRequestContext` fails first, the tests fail before reaching the logger call. The CI log snippets showing assertion mismatches are from tests that somehow get past context (possibly different code paths).

**Fix (tests):** Add the mock to `onRequestTestUtils.ts`:
```typescript
jest.mock('@acme/lib/context', () => ({
  withRequestContext: (_ctx: unknown, fn: () => unknown) => fn(),
}));
```
Also add to `testHelpers.ts` for the older test suites.

After adding the mock, verify the `toHaveBeenCalledWith` assertions still pass — they use `expect.objectContaining` so extra properties should be fine.

**Files:**
- `apps/api/src/routes/components/__tests__/onRequestTestUtils.ts`
- `apps/api/src/routes/components/__tests__/testHelpers.ts`

---

### 5. apps/prime — lint (ESLint ignores all files)

**Error:** `ESLint 9.30.1 — all files matching glob "." are ignored`

**Root cause:** `tools/eslint-ignore-patterns.cjs:46-47` contains `"apps/prime/**"` in the global ignore list with comment "Prime app: exempt while in early development". When CI runs `eslint .` inside prime, the root flat config's global ignore matches everything, and ESLint exits with error code 2.

**Regression:** Introduced in commit `5b064ce34f` (Feb 5, 2026) which extracted ignore patterns.

**Options:**
1. **Remove prime from global ignores** — if prime is ready for linting
2. **Skip lint for prime in CI** — if prime is truly in early development
3. **Add `--no-error-on-unmatched-pattern`** — suppress the error (not recommended, hides real issues)

**Recommended:** Option 1 — remove the exempt. If prime has lint issues, fix them or add targeted ESLint disable comments.

**Files:** `tools/eslint-ignore-patterns.cjs`

---

### 6. apps/storybook — build (webpack/duplicate stories)

**Error (CI log):** `Cannot find package 'webpack' imported from .storybook/main.ts`

**Actual state:** The `build` script in `apps/storybook/package.json` is already `echo 'Storybook build skipped - webpack hash bug'`. The real issue (when using `build:full`) is **duplicate story IDs** from workspace symlinks, not a missing webpack package.

**Pre-existing:** Yes. Build has been skipped since commit `0b6130bde6`.

**Disposition:** **Skip** — this is a known pre-existing issue. The storybook build skip is intentional. The CI failure may be from the test.yml matrix running `build` which echoes the skip message but exits 0... unless the workflow is somehow running `build:full`.

**Note:** If the CI is actually running storybook build and it's failing, the issue is that pnpm-installed webpack isn't hoisted to where Storybook ESM imports expect it. This would need a `webpack` devDependency in `apps/storybook/package.json`.

---

### 7. packages/design-tokens — typecheck (`@themes/base` not found)

**Error:** `src/exportedTokenMap.ts:8` — `Cannot find module '@themes/base'`

**Root cause:** `packages/design-tokens/tsconfig.json` has `references: [{ "path": "../types" }]` but does **not** reference `../themes/base`. When building with `tsc -p tsconfig.json`, TypeScript can't resolve `@themes/base` because:
1. The path alias points to `packages/themes/base/src` (via `tsconfig.base.json`)
2. With `composite: true`, TypeScript needs explicit project references
3. `@themes/base` dist isn't built in CI before design-tokens

**Fix (code):** Add reference to `packages/design-tokens/tsconfig.json`:
```json
"references": [
  { "path": "../types" },
  { "path": "../themes/base" }
]
```

**Files:** `packages/design-tokens/tsconfig.json`

---

### 8. packages/configurator — test (auth env vars)

**Error:** `env.auth.test.ts:159` — validation throws because `OAUTH_ISSUER` and `OAUTH_REDIRECT_ORIGIN` missing.

**Status:** **Already fixed on dev.** Commit `4d9325702e` (Jan 21, 2026) added the missing env vars to the test. This fix hasn't reached main yet.

**Disposition:** No action needed — will be fixed when dev merges to main.

---

### 9. packages/template-app — build (`@acme/page-builder-ui` not found)

**Error:** `Module not found: Can't resolve '@acme/page-builder-ui'` in `src/components/DynamicRenderer.tsx`

**Root cause:** Same pattern as cochlearfit (#3). The CI build filter doesn't ensure `@acme/page-builder-ui` (and its transitive deps: `cms-ui`, `page-builder-core`, `ui`) are built first. Template-app's prebuild only builds `@acme/i18n`.

**Fix (code):** Extend prebuild in `packages/template-app/package.json`:
```json
"prebuild": "pnpm --filter @acme/i18n build && pnpm --filter @acme/page-builder-ui... build"
```

**Files:** `packages/template-app/package.json`

---

## Cross-Cutting Root Cause: CI Build Filter Pattern

Failures #3, #7, and #9 share a root cause: **`test.yml:55` uses `pnpm --filter ./${{ matrix.workspace }}... build`** which doesn't reliably build transitive dependencies in CI with cold caches.

**Alternative systemic fix:** Change line 55 to use Turborepo which correctly resolves the dependency graph:
```yaml
run: pnpm exec turbo run build --filter=./${{ matrix.workspace }}
```
Turbo's `^build` dependsOn in `turbo.json` handles transitive deps. This would fix #3, #7, and #9 in one change and prevent future similar issues.

---

## Questions

### Resolved

- Q: Is the brikette compat error real or a CI ghost?
  - A: The files don't exist on main. Likely stale cache. Needs verification with a clean run.
  - Evidence: `git show main:apps/brikette/src/compat/route-modules.ts` → "does not exist"

- Q: Are the api test failures fixable by updating tests or does the code need changes?
  - A: Tests need updating — missing `@acme/lib/context` mock. Code is correct.
  - Evidence: `publish-upgrade.test-helpers.ts:13` has the mock; `onRequestTestUtils.ts` doesn't.

### Open (User Input Needed)

- Q: Should `apps/prime` be linted in CI, or is it still in early development?
  - Why it matters: Determines whether to remove the ESLint exemption or skip linting.
  - Default: Remove exemption and fix any lint issues (treat prime as a real app).

---

## Confidence Inputs (for /plan-feature)

- **Implementation:** 90%
  - All fixes are well-understood with clear code changes. Only brikette (#2) needs verification.
- **Approach:** 85%
  - Individual fixes are straightforward. The systemic CI filter fix (using Turbo) is higher-impact but needs validation.
- **Impact:** 90%
  - Changes are isolated to test helpers, tsconfig references, package.json scripts, and CI config. Low blast radius.
- **Testability:** 95%
  - Each fix can be verified by re-running the specific CI job.

## Planning Constraints & Notes

- Must-follow patterns:
  - Use `prebuild` scripts for build ordering (matches template-app pattern)
  - Use `jest.mock` for `@acme/lib/context` (matches publish-upgrade pattern)
- Rollout expectations:
  - Fix on dev, then merge to main via PR
- Observability:
  - Green CI on next overnight run confirms success

## Suggested Task Seeds (Non-binding)

1. **Fix navItemSchema type annotation** — `packages/types/src/shop-config.ts` — use `satisfies`
2. **Add withRequestContext mock to api component tests** — `onRequestTestUtils.ts` + `testHelpers.ts`
3. **Fix CI build ordering (systemic)** — change `test.yml:55` to use `turbo run build` OR add prebuild scripts to cochlearfit, template-app
4. **Add tsconfig reference for @themes/base** — `packages/design-tokens/tsconfig.json`
5. **Fix prime ESLint config** — remove `apps/prime/**` from `tools/eslint-ignore-patterns.cjs`
6. **Verify brikette failure** — re-run CI or bust cache to confirm compat ghost
7. **Fix storybook stories glob** — exclude `node_modules` from glob pattern (low priority, build already skipped)

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (prime lint question has a safe default)
- Recommended next step: proceed to `/plan-feature`
