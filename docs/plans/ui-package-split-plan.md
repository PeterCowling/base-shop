---
Type: Plan
Status: Active
Domain: Platform/UI
Last-reviewed: 2026-01-21
Relates-to charter: docs/architecture.md
Created: 2026-01-20
Created-by: Claude Opus 4.5
Last-updated: 2026-01-21
Revision: 5
Last-updated-by: Claude Opus 4.5
Branch: work/ui-package-split
---

# @acme/ui Package Split Plan

## Summary

Split `@acme/ui` (676 test files, ~2,200 source files) into three packages to achieve:
- **3x CI parallelization** (three independent test jobs)
- **Faster incremental builds** (smaller dependency graphs)
- **Cleaner architecture** (explicit layer boundaries)

## Motivation

Current `@acme/ui` is a monolithic package containing:
- Design system primitives (atoms, molecules, templates)
- CMS-specific UI (page-builder, blocks, marketing)
- Domain-specific components (shop, checkout, account)

This causes:
1. **Slow CI** — All 676 tests run sequentially
2. **Over-bundling** — Storefronts pull in CMS code they don't need
3. **Unclear boundaries** — Easy to accidentally create circular dependencies

## Goals

1. **CI parallelization** — Three independent test jobs running concurrently
2. **Cleaner imports** — Explicit layer boundaries enforced by package boundaries
3. **Smaller bundles** — Apps only import what they need
4. **Maintainability** — Clear ownership boundaries per package

## Non-Goals

- Changing component APIs
- Rewriting existing components
- Adding new components during migration
- Changing test frameworks or patterns

## Target Architecture

```
              @acme/design-system (~82 tests)
                   ↑            ↑
                   │            │
    @acme/cms-ui (~269 tests)  @acme/ui (~325 tests)
```

**Architecture note:** `@acme/cms-ui` and `@acme/ui` are **siblings** that both depend on `@acme/design-system`. Neither depends on the other in production code.

**Backward compatibility:** During migration, `@acme/ui` will temporarily re-export from both `@acme/design-system` AND `@acme/cms-ui` via shim files. These shims exist solely for backward compatibility and are deprecated. Phase 4 (import rewrites) removes the need for CMS shims by updating all consumers to import directly from `@acme/cms-ui`. After Phase 4, `@acme/ui` no longer depends on `@acme/cms-ui`.

**Build order implications:** Until Phase 4 completes, `@acme/ui` must build after both `@acme/design-system` and `@acme/cms-ui`. After Phase 4, siblings can build in parallel.

---

## Active Tasks

### Phase 0: Audit & Validation (BLOCKING)

- [x] **UI-00**: Capture CI baseline metrics
  - **Scope**: Record current CI times before any changes
  - **DoD**:
    - Run `@acme/ui` test suite 3 times, record median duration
    - Record total CI workflow duration from recent main branch runs
    - Document in "Success Metrics" section as "Before" values
  - **Depends on**: None
  - **Affects**: This plan document (Success Metrics section)
  - **Note**: Must complete before any code changes to get accurate baseline

- [x] **UI-01**: Complete exports audit and document migration mapping
  - **Scope**: Enumerate all 83 current `@acme/ui` exports, map each to target package
  - **DoD**:
    - Complete mapping table in Appendix A of this document
    - Each export marked: `design-system` | `cms-ui` | `ui` | `deprecated`
    - Server-only modules identified (`.server.ts` convention)
    - Wildcard exports expanded to concrete files
  - **Depends on**: None
  - **Affects**: This plan document (Appendix A)
  - **Verification**: `grep -c '"\./' packages/ui/package.json` matches documented count

- [x] **UI-02**: Validate no circular dependencies exist
  - **Scope**: Run `madge --circular` on current `@acme/ui`, fix any issues before split
  - **DoD**: `npx madge --circular --ts-config packages/ui/tsconfig.json --extensions ts,tsx packages/ui/src` returns no cycles
  - **Depends on**: None
  - **Affects**: `packages/ui/src/`
  - **Failure mode**: If cycles found, create sub-task to resolve before proceeding
  - **Result**: 8 internal cycles found, all in CMS code (page-builder, style, modal). These move together to `@acme/cms-ui` so don't block the split. Cross-package cycles will be prevented by the new package boundaries.

### Phase 1: Package Scaffolding

- [x] **UI-03**: Create `@acme/design-system` package structure
  - **Scope**: Create package.json, tsconfig.json, jest.config.cjs, tsconfig references
  - **DoD**:
    - `packages/design-system/package.json` exists with:
      - Exports from Appendix A (design-system section)
      - peerDependencies: `react`, `react-dom`
      - Build script: `"build": "tsc --build"`
      - Test script: `"test": "jest"`
    - `packages/design-system/tsconfig.json` with:
      - `extends` from shared config
      - `compilerOptions.outDir` set to `./dist`
      - `include` set to `["src"]`
    - `packages/design-system/jest.config.cjs` with:
      - `rootDir` updated to package root
      - `moduleNameMapper` updated for `@acme/design-system` self-references
      - `testMatch` set to `["<rootDir>/src/**/*.test.{ts,tsx}"]`
      - `setupFilesAfterEnv` pointing to shared test setup
    - `pnpm install` succeeds
    - `pnpm --filter @acme/design-system typecheck` passes (empty src)
  - **Depends on**: UI-01
  - **Affects**: `packages/design-system/`, root `tsconfig.json`

- [x] **UI-04**: Create `@acme/cms-ui` package structure
  - **Scope**: Create package.json, tsconfig.json, jest.config.cjs, tsconfig references
  - **DoD**:
    - `packages/cms-ui/package.json` exists with:
      - Exports from Appendix A (cms-ui section)
      - dependencies: `@acme/design-system`
      - peerDependencies: `react`, `react-dom`, `next`
      - Build script: `"build": "tsc --build"`
      - Test script: `"test": "jest"`
    - `packages/cms-ui/tsconfig.json` with:
      - `extends` from shared config
      - `references` to `@acme/design-system`
      - `compilerOptions.outDir` set to `./dist`
    - `packages/cms-ui/jest.config.cjs` with:
      - `rootDir` updated to package root
      - `moduleNameMapper` for both `@acme/cms-ui` and `@acme/design-system`
      - `testMatch` set to `["<rootDir>/src/**/*.test.{ts,tsx}"]`
    - `pnpm install` succeeds
    - `pnpm --filter @acme/cms-ui typecheck` passes (empty src)
  - **Depends on**: UI-01, UI-03
  - **Affects**: `packages/cms-ui/`, root `tsconfig.json`

- [x] **UI-05**: Add layer boundary lint rule
  - **Scope**: Add ESLint rule to enforce package boundaries (using `eslint-plugin-import` or `@nx/enforce-module-boundaries`)
  - **DoD**:
    - `@acme/design-system` cannot import from `@acme/cms-ui` or `@acme/ui`
    - `@acme/cms-ui` cannot import from `@acme/ui`
    - `@acme/ui` production code cannot import from `@acme/cms-ui`
    - **Exception**: `packages/ui/src/shims/**` files MAY import from `@acme/cms-ui` (backward compat only)
    - Rule added to shared ESLint config with ignore pattern for shims
    - `pnpm lint` passes
  - **Depends on**: UI-03, UI-04
  - **Affects**: `.eslintrc.js` or `eslint.config.mjs`
  - **Note**: Shim exception is temporary; removed after Phase 4 import rewrites complete

### Phase 2: Design System Migration (~82 tests)

**Sequencing note:** Each move task includes creating a re-export shim in `@acme/ui` immediately after the move. Shims include deprecation warnings that fire only in development mode. This keeps the build green at every commit while nudging consumers to update imports.

- [ ] **UI-06**: Move atoms (source + tests + shims) — 53 tests
  - **Scope**:
    - Move `src/atoms/` (1 test)
    - Move `src/components/atoms/` (52 tests, excluding primitives/ and shadcn/)
    - Merge into `packages/design-system/src/atoms/`
    - Add `@acme/design-system` as dependency in `packages/ui/package.json`
    - Create shims with deprecation warnings to preserve ALL existing export paths
  - **DoD**:
    - All atom source files in `packages/design-system/src/atoms/`
    - All 53 test files moved and passing
    - `pnpm --filter @acme/design-system test -- src/atoms` passes
    - `packages/ui/package.json` lists `@acme/design-system` as dependency
    - `pnpm install` succeeds after package.json change
    - Shims created in `packages/ui/src/shims/atoms/`:
      - `index.ts` → re-exports barrel from `@acme/design-system/atoms` with deprecation warning
      - Per-file shims for each atom (e.g., `Button.ts` → re-exports with warning)
      - Deprecation warnings only fire in `NODE_ENV === 'development'`
    - `packages/ui/package.json` exports updated to point `./atoms` and `./atoms/*` to shim files
    - `pnpm typecheck` passes
    - Existing imports work: `@acme/ui/atoms`, `@acme/ui/atoms/Button`, `@acme/ui/components/atoms/*`
  - **Depends on**: UI-03
  - **Affects**: `packages/design-system/src/atoms/`, `packages/ui/src/shims/atoms/`, `packages/ui/package.json`

- [ ] **UI-07**: Move molecules (source + tests + shims) — 15 tests
  - **Scope**:
    - Move `src/molecules/` (1 test)
    - Move `src/components/molecules/` (14 tests)
    - Create shims preserving `./molecules`, `./molecules/*`, `./components/molecules`, `./components/molecules/*`
  - **DoD**:
    - All 15 test files moved and passing
    - `pnpm --filter @acme/design-system test -- src/molecules` passes
    - Shims created in `packages/ui/src/shims/molecules/` (barrel + per-file)
    - `packages/ui/package.json` exports updated to point to shims
    - `pnpm typecheck` passes
  - **Depends on**: UI-06
  - **Affects**: `packages/design-system/src/molecules/`, `packages/ui/src/shims/molecules/`

- [ ] **UI-08**: Move templates (source + tests + shims) — 14 tests
  - **Scope**: Move `src/components/templates/`, create shims
  - **DoD**:
    - All 14 test files moved and passing
    - `pnpm --filter @acme/design-system test -- src/templates` passes
    - Shims created in `packages/ui/src/shims/templates/` (barrel + per-file)
    - `packages/ui/package.json` exports `./components/templates` and `./components/templates/*` point to shims
    - `pnpm typecheck` passes
  - **Depends on**: UI-07
  - **Affects**: `packages/design-system/src/templates/`, `packages/ui/src/shims/templates/`

- [ ] **UI-09**: Move primitives and shadcn (source + tests + shims)
  - **Scope**:
    - Extract `src/components/atoms/primitives/` from atoms (was excluded in UI-06)
    - Extract `src/components/atoms/shadcn/` from atoms (was excluded in UI-06)
    - Move to top-level directories in design-system (not nested under atoms)
    - Create shims preserving `./components/atoms/primitives`, `./components/atoms/primitives/*`, etc.
  - **DoD**:
    - Primitives in `packages/design-system/src/primitives/`
    - shadcn in `packages/design-system/src/shadcn/`
    - All tests pass
    - Shims created in `packages/ui/src/shims/primitives/` and `packages/ui/src/shims/shadcn/`
    - `packages/ui/package.json` exports updated for primitives and shadcn paths
    - `pnpm typecheck` passes
  - **Depends on**: UI-06
  - **Affects**: `packages/design-system/src/primitives/`, `packages/design-system/src/shadcn/`, `packages/ui/src/shims/`

- [ ] **UI-10**: Move style utilities (+ shims)
  - **Scope**: Move `src/utils/style/` to `@acme/design-system`, create shims
  - **DoD**:
    - `cn()`, `cssVars` utilities in `packages/design-system/src/utils/style/`
    - Tests pass
    - Shims created in `packages/ui/src/shims/utils/style/` (barrel + per-file)
    - `packages/ui/package.json` exports `./utils/style` and `./utils/style/*` point to shims
    - `pnpm typecheck` passes
  - **Depends on**: UI-03
  - **Affects**: `packages/design-system/src/utils/style/`, `packages/ui/src/shims/utils/style/`

- [ ] **UI-11**: Move presentation-only hooks (+ shims)
  - **Scope**: Move hooks with NO domain dependencies + create per-file shims:
    - `useTheme.ts`
    - `useReducedMotion.ts`
    - `useInView.ts`
    - `useViewport.ts`
    - `useScrollProgress.ts`
    - `useResponsiveImage.ts`
  - **DoD**:
    - 6 hooks in `packages/design-system/src/hooks/`
    - Domain hooks remain in `@acme/ui` (see Appendix B)
    - Tests pass
    - Per-file shims created in `packages/ui/src/shims/hooks/` (e.g., `useTheme.ts` → re-exports)
    - `packages/ui/package.json` exports `./hooks/useTheme` etc. point to shims
    - `pnpm typecheck` passes
    - `@acme/ui/hooks/useTheme` still works
  - **Depends on**: UI-03
  - **Affects**: `packages/design-system/src/hooks/`, `packages/ui/src/shims/hooks/`

### Phase 3: CMS UI Migration (~269 tests)

**Sequencing note:** Each move task includes creating re-export shims in `packages/ui/src/shims/`. These shims require `@acme/ui` to temporarily depend on `@acme/cms-ui` (removed after Phase 4).

- [ ] **UI-12**: Move page-builder (source + tests + shims) — 176 tests
  - **Scope**: Move `src/components/cms/page-builder/`, create shims
  - **DoD**:
    - All page-builder files in `packages/cms-ui/src/page-builder/`
    - All 176 tests moved and passing
    - `pnpm --filter @acme/cms-ui test -- src/page-builder` passes
    - `packages/ui/package.json` adds `@acme/cms-ui` as dependency (temporary for shims)
    - `pnpm install` succeeds
    - Shims created in `packages/ui/src/shims/cms/page-builder/` (barrel + per-file for wildcards)
    - `packages/ui/package.json` exports `./components/cms/page-builder/*` point to shims
    - `pnpm typecheck` passes
    - `@acme/ui/components/cms/page-builder/DragHandle` still works
  - **Depends on**: UI-04, UI-06 (page-builder imports atoms)
  - **Affects**: `packages/cms-ui/src/page-builder/`, `packages/ui/src/shims/cms/`, `packages/ui/package.json`

- [ ] **UI-13**: Move blocks (source + tests + shims) — 46 tests
  - **Scope**: Move `src/components/cms/blocks/`, create shims
  - **Note**: Includes server component `CollectionSection.server.tsx`
  - **DoD**:
    - All block files in `packages/cms-ui/src/blocks/`
    - Server components retain `.server.tsx` suffix
    - All 46 tests moved and passing
    - Shims created in `packages/ui/src/shims/cms/blocks/` (barrel + per-file for each block)
    - `packages/ui/package.json` exports `./components/cms/blocks/*` point to shims
    - `pnpm typecheck` passes
    - `@acme/ui/components/cms/blocks/HeroBanner` still works
  - **Depends on**: UI-12
  - **Affects**: `packages/cms-ui/src/blocks/`, `packages/ui/src/shims/cms/blocks/`

- [ ] **UI-14**: Move remaining CMS UI (+ shims) — 47 tests
  - **Scope**:
    - `src/components/cms/marketing/`
    - `src/components/cms/media/`
    - `src/components/cms/products/`
    - `src/components/cms/nav/`
    - `src/components/cms/style/`
    - Create shims for each preserving all existing subpath exports
  - **DoD**:
    - All CMS UI in `packages/cms-ui/src/`
    - All 47 tests pass (269 - 176 - 46 = 47)
    - Shims created in `packages/ui/src/shims/cms/` for each moved directory
    - `packages/ui/package.json` exports updated
    - `pnpm typecheck` passes
  - **Depends on**: UI-04, UI-06 (CMS components import atoms)
  - **Affects**: `packages/cms-ui/src/`, `packages/ui/src/shims/cms/`

- [ ] **UI-15**: Move DynamicRenderer and CMS hooks (+ shims)
  - **Scope**:
    - Move `src/components/DynamicRenderer.tsx`
    - Move CMS-specific hooks: `usePreviewDevice`, `useTokenEditor`, `useTokenColors`
    - Create per-file shims
  - **DoD**:
    - `DynamicRenderer` in `packages/cms-ui/src/`
    - CMS hooks in `packages/cms-ui/src/hooks/`
    - Block registration system works
    - Shims created: `packages/ui/src/shims/DynamicRenderer.ts`, `packages/ui/src/shims/hooks/usePreviewDevice.ts`, etc.
    - `packages/ui/package.json` exports updated
    - `pnpm typecheck` passes
  - **Depends on**: UI-12, UI-13
  - **Affects**: `packages/cms-ui/src/`, `packages/ui/src/shims/`

### Phase 4: Import Rewrites (REQUIRED for sibling architecture)

**Note:** This phase removes the temporary `@acme/ui` → `@acme/cms-ui` dependency by rewriting all consumers to import directly from canonical packages. After this phase, `@acme/ui` only depends on `@acme/design-system`, achieving the sibling architecture.

- [ ] **UI-16**: Create import rewrite script
  - **Scope**: Automated script using ts-morph to update all imports
  - **DoD**:
    - Script at `scripts/rewrite-ui-imports.ts`
    - Handles all mappings in Appendix A
    - Handles wildcard imports (e.g., `@acme/ui/hooks/*`)
    - Handles default vs named exports correctly
    - Dry-run mode available
  - **Depends on**: UI-11, UI-15
  - **Affects**: `scripts/`

- [ ] **UI-17**: Run import rewrites on source files
  - **Scope**: Execute rewrite script on all packages and apps
  - **DoD**:
    - All source file imports updated to canonical paths:
      - `@acme/ui/atoms/*` → `@acme/design-system/atoms/*`
      - `@acme/ui/components/cms/*` → `@acme/cms-ui/*`
    - `pnpm typecheck` passes
  - **Depends on**: UI-16
  - **Affects**: All packages and apps

- [ ] **UI-18**: Run import rewrites on test files
  - **Scope**: Execute rewrite script specifically on test files
  - **DoD**:
    - All test file imports updated to canonical paths
    - All tests pass with new imports
    - No test imports from old `@acme/ui` shim paths
  - **Depends on**: UI-17
  - **Affects**: All `__tests__/` directories

- [ ] **UI-18a**: Remove CMS shims and dependency
  - **Scope**: Delete CMS shims, remove `@acme/cms-ui` from `@acme/ui` dependencies
  - **DoD**:
    - `packages/ui/src/shims/cms/` deleted
    - `packages/ui/package.json` no longer lists `@acme/cms-ui` as dependency
    - `packages/ui/package.json` exports for `./components/cms/*` point to error shims with migration message:
      ```ts
      // packages/ui/src/shims/cms/deprecated.ts
      throw new Error('Import from @acme/cms-ui instead. See docs/plans/ui-package-split-plan.md');
      ```
    - `./components/cms` barrel export also points to error shim
    - `pnpm install` succeeds
    - `pnpm typecheck` passes
    - `pnpm lint` passes (shim exception in UI-05 can be tightened or removed)
  - **Depends on**: UI-18
  - **Affects**: `packages/ui/src/shims/`, `packages/ui/package.json`

### Phase 5: Build & CI Configuration

- [ ] **UI-19**: Update tsconfig project references
  - **Scope**: Configure TypeScript project references for incremental builds
  - **DoD**:
    - Root `tsconfig.json` references all three packages
    - `@acme/cms-ui` references `@acme/design-system`
    - `@acme/ui` references `@acme/design-system` only (sibling architecture achieved after UI-18a)
    - `pnpm build` uses incremental compilation
  - **Depends on**: UI-18a (must complete CMS shim removal first)
  - **Affects**: `tsconfig.json` files

- [ ] **UI-20**: Update turbo.json build dependencies
  - **Scope**: Configure correct build order for sibling architecture
  - **DoD**:
    - `@acme/design-system` builds first (no deps)
    - `@acme/cms-ui` builds after design-system
    - `@acme/ui` builds after design-system (parallel with cms-ui — they are siblings)
    - `pnpm build` succeeds
  - **Depends on**: UI-19
  - **Affects**: `turbo.json`
  - **Note**: This parallel build only works after UI-18a removes the CMS dependency

- [ ] **UI-21**: Add parallel test jobs to CI
  - **Scope**: Configure GitHub Actions for parallel test execution
  - **DoD**:
    - Three parallel jobs: `test-design-system`, `test-cms-ui`, `test-ui`
    - Jobs have correct dependency relationships
    - CI time reduced (compare to baseline from UI-00)
  - **Depends on**: UI-20
  - **Affects**: `.github/workflows/ci.yml`

- [ ] **UI-21a**: Update Storybook configuration
  - **Scope**: Configure Storybook to find stories in all three packages
  - **DoD**:
    - `.storybook/main.ts` updated with story globs for all three packages:
      - `../packages/design-system/src/**/*.stories.{ts,tsx}`
      - `../packages/cms-ui/src/**/*.stories.{ts,tsx}`
      - `../packages/ui/src/**/*.stories.{ts,tsx}`
    - `pnpm storybook` starts without errors
    - Stories from all three packages appear in sidebar
  - **Depends on**: UI-04 (packages exist)
  - **Affects**: `.storybook/main.ts`
  - **Note**: Can run in parallel with Phase 2-3 migrations; stories appear as files are moved

### Phase 6: Shim Verification

**Note:** Shims were created inline during Phases 2-3 (with deprecation warnings). This phase verifies completeness.

- [ ] **UI-23**: Verify all 83 export paths work via shims
  - **Scope**: Verify every original `@acme/ui` export path still resolves correctly
  - **DoD**:
    - Test file that imports all 83 export paths from `@acme/ui`
    - All imports resolve without errors
    - TypeScript types resolve correctly
    - Deprecation warnings appear in development mode (from shims created in Phases 2-3)
    - Test added to `packages/ui/__tests__/shims.test.ts`
    - Update README with canonical import paths
  - **Depends on**: UI-15
  - **Affects**: `packages/ui/__tests__/`, `packages/ui/README.md`
  - **Note**: This task subsumes previous UI-22 (deprecation warnings) and UI-24 (exports map) since shim creation now happens inline during Phases 2-3

### Phase 7: Verification

- [ ] **UI-25**: Run full test suite
  - **Scope**: Verify all tests pass across all three packages
  - **DoD**:
    - `pnpm --filter @acme/design-system test` passes (82 tests)
    - `pnpm --filter @acme/cms-ui test` passes (269 tests)
    - `pnpm --filter @acme/ui test` passes (325 tests)
    - Total: 676 tests (same as before)
    - No flaky tests introduced
  - **Depends on**: UI-21, UI-23 (CI config + shim verification)
  - **Affects**: None (verification only)
  - **Failure mode**: If tests fail, check shims and import rewrites

- [ ] **UI-26**: Verify app builds
  - **Scope**: Ensure all apps still build and work
  - **DoD**:
    - `pnpm build --filter @apps/cms` succeeds
    - `pnpm build --filter @apps/brikette` succeeds
    - `pnpm build --filter @apps/cover-me-pretty` succeeds
    - `pnpm build --filter @apps/reception` succeeds
  - **Depends on**: UI-25
  - **Affects**: None (verification only)
  - **Failure mode**: If builds fail, check shims (UI-23, UI-24)

- [ ] **UI-27**: Verify no circular dependencies
  - **Scope**: Run madge on all three packages
  - **DoD**:
    - `npx madge --circular --ts-config packages/design-system/tsconfig.json --extensions ts,tsx packages/design-system/src` returns no cycles
    - `npx madge --circular --ts-config packages/cms-ui/tsconfig.json --extensions ts,tsx packages/cms-ui/src` returns no cycles
    - `npx madge --circular --ts-config packages/ui/tsconfig.json --extensions ts,tsx packages/ui/src` returns no cycles
    - Layer direction enforced: design-system has no imports from cms-ui or ui
  - **Depends on**: UI-25
  - **Affects**: None (verification only)

- [ ] **UI-28**: Measure CI performance improvement
  - **Scope**: Compare CI times to baseline from UI-00
  - **DoD**:
    - Run CI 3 times, record median duration
    - Compare to baseline from UI-00
    - Calculate percentage improvement
    - Document in Success Metrics section
  - **Depends on**: UI-27, UI-00
  - **Affects**: This plan document (Success Metrics section)

---

## Completed Tasks

_(Move tasks here as they are completed)_

---

## Runtime Boundaries

### Server-Only Modules

Files with `.server.ts`/`.server.tsx` suffix that MUST include `import "server-only"`:

| Module | Current Location | Target Package |
|--------|------------------|----------------|
| `CollectionSection.server.tsx` | `components/cms/blocks/` | `@acme/cms-ui` |

### Client-Only Modules

Files requiring `"use client"` directive:

| Module Type | Target Package | Reason |
|-------------|----------------|--------|
| Interactive atoms (Dialog, Dropdown, etc.) | `@acme/design-system` | Event handlers, refs |
| Page builder canvas | `@acme/cms-ui` | Drag-and-drop, Zustand state |
| Cart components | `@acme/ui` | Client state management |
| `*.client.tsx` files | Various | Explicit client boundary |

### Prevention Strategy

1. **Build check**: Next.js will error if server-only code reaches client bundle
2. **Convention**: `.server.ts` suffix for server-only, `"use client"` for client-only
3. **Lint rule**: UI-05 adds package boundary enforcement; consider also adding `eslint-plugin-react-server-components` for server/client boundary violations

---

## Appendix A: Export Keys Mapping

**Total export keys: 83** (from `packages/ui/package.json`)

**Terminology:**
- **Export key**: An entry in `package.json` `"exports"` field (e.g., `"./atoms"`, `"./atoms/*"`)
- **Wildcard**: Pattern like `"./atoms/*"` that matches many concrete paths at runtime

**Note:** Tables below enumerate all 83 export keys. Wildcard keys (`*`) match dynamically at import time. Run `node -e "console.log(Object.keys(require('./packages/ui/package.json').exports).length)"` to verify count.

### Design System Export Keys (19)

| Current Export | Target | Type |
|----------------|--------|------|
| `./atoms` | `@acme/design-system/atoms` | barrel |
| `./atoms/*` | `@acme/design-system/atoms/*` | wildcard |
| `./molecules` | `@acme/design-system/molecules` | barrel |
| `./molecules/*` | `@acme/design-system/molecules/*` | wildcard |
| `./components/atoms` | `@acme/design-system/atoms` | barrel |
| `./components/atoms/*` | `@acme/design-system/atoms/*` | wildcard |
| `./components/atoms/Price` | `@acme/design-system/atoms/Price` | specific |
| `./components/atoms/primitives` | `@acme/design-system/primitives` | barrel |
| `./components/atoms/primitives/*` | `@acme/design-system/primitives/*` | wildcard |
| `./components/atoms/primitives/textarea` | `@acme/design-system/primitives/textarea` | specific |
| `./components/atoms/shadcn` | `@acme/design-system/shadcn` | barrel |
| `./components/atoms/shadcn/*` | `@acme/design-system/shadcn/*` | wildcard |
| `./components/molecules` | `@acme/design-system/molecules` | barrel |
| `./components/molecules/*` | `@acme/design-system/molecules/*` | wildcard |
| `./components/templates` | `@acme/design-system/templates` | barrel |
| `./components/templates/*` | `@acme/design-system/templates/*` | wildcard |
| `./utils/style` | `@acme/design-system/utils/style` | barrel |
| `./utils/style/*` | `@acme/design-system/utils/style/*` | wildcard |
| `./utils/style/cssVars` | `@acme/design-system/utils/style/cssVars` | specific |

### CMS UI Export Keys (26)

| Current Export | Target | Type |
|----------------|--------|------|
| `./components/cms` | `@acme/cms-ui` | barrel |
| `./components/cms/blocks/*` | `@acme/cms-ui/blocks/*` | wildcard |
| `./components/cms/page-builder/*` | `@acme/cms-ui/page-builder/*` | wildcard |
| `./components/cms/blocks/CollectionSection.server` | `@acme/cms-ui/blocks/CollectionSection.server` | server |
| `./components/cms/blocks/CollectionSection.client` | `@acme/cms-ui/blocks/CollectionSection.client` | client |
| `./components/cms/blocks/HeaderSection` | `@acme/cms-ui/blocks/HeaderSection` | specific |
| `./components/cms/blocks/FooterSection` | `@acme/cms-ui/blocks/FooterSection` | specific |
| `./components/cms/blocks/HeroBanner` | `@acme/cms-ui/blocks/HeroBanner` | specific |
| `./components/cms/blocks/Gallery` | `@acme/cms-ui/blocks/Gallery` | specific |
| `./components/cms/blocks/Testimonials` | `@acme/cms-ui/blocks/Testimonials` | specific |
| `./components/cms/blocks/TestimonialSlider` | `@acme/cms-ui/blocks/TestimonialSlider` | specific |
| `./components/cms/blocks/ContactForm` | `@acme/cms-ui/blocks/ContactForm` | specific |
| `./components/cms/blocks/ContactFormWithMap` | `@acme/cms-ui/blocks/ContactFormWithMap` | specific |
| `./components/cms/blocks/BlogListing` | `@acme/cms-ui/blocks/BlogListing` | specific |
| `./components/cms/blocks/Section` | `@acme/cms-ui/blocks/Section` | specific |
| `./components/cms/blocks/HeaderCart` | `@acme/cms-ui/blocks/HeaderCart` | specific |
| `./components/cms/blocks/CurrencySelector` | `@acme/cms-ui/blocks/CurrencySelector` | specific |
| `./components/cms/blocks/RentalAvailabilitySection` | `@acme/cms-ui/blocks/RentalAvailabilitySection` | specific |
| `./components/cms/blocks/RentalTermsSection` | `@acme/cms-ui/blocks/RentalTermsSection` | specific |
| `./components/cms/blocks/StructuredDataSection` | `@acme/cms-ui/blocks/StructuredDataSection` | specific |
| `./components/cms/blocks/ConsentSection` | `@acme/cms-ui/blocks/ConsentSection` | specific |
| `./components/cms/blocks/AnalyticsPixelsSection` | `@acme/cms-ui/blocks/AnalyticsPixelsSection` | specific |
| `./components/cms/blocks/RentalDemoProvider.client` | `@acme/cms-ui/blocks/RentalDemoProvider.client` | client |
| `./components/cms/page-builder/libraryStore` | `@acme/cms-ui/page-builder/libraryStore` | specific |
| `./components/cms/page-builder/DragHandle` | `@acme/cms-ui/page-builder/DragHandle` | specific |
| `./hooks/usePreviewDevice` | `@acme/cms-ui/hooks/usePreviewDevice` | specific |

### Retained in @acme/ui (38 export keys)

**Note:** Design-system shims remain for backward compat; CMS shims removed after Phase 4.

| Current Export | Status | Notes |
|----------------|--------|-------|
| `.` | keep | Main barrel |
| `./server` | keep | Server utilities |
| `./account` | keep | Domain-specific |
| `./operations` | keep | Domain-specific |
| `./organisms` | keep | Domain-specific |
| `./organisms/*` | keep | Domain-specific |
| `./organisms/modals` | keep | Domain-specific |
| `./organisms/modals/*` | keep | Domain-specific |
| `./components` | keep | Re-exports |
| `./components/*` | keep | Wildcard |
| `./components/*.json` | keep | JSON assets |
| `./components/organisms` | keep | Domain-specific |
| `./components/organisms/*` | keep | Domain-specific |
| `./components/organisms/StoreLocatorMap` | keep | Domain-specific |
| `./components/platform/*` | keep | Domain-specific |
| `./components/home/*` | keep | Domain-specific |
| `./components/home/ReviewsCarousel` | keep | Domain-specific |
| `./components/home/ValueProps` | keep | Domain-specific |
| `./components/layout/*` | keep | Domain-specific |
| `./components/layout/Footer` | keep | Domain-specific |
| `./components/layout/Header` | keep | Domain-specific |
| `./components/ComponentPreview` | keep | Utility |
| `./components/DeviceSelector` | keep | Utility |
| `./hooks` | keep | Barrel |
| `./hooks/*` | keep | Wildcard |
| `./context/*` | keep | Domain-specific |
| `./providers/*` | keep | Domain-specific |
| `./shared` | keep | Utilities |
| `./shared/*` | keep | Utilities |
| `./types/*` | keep | Type definitions |
| `./config/*` | keep | Configuration |
| `./data/*` | keep | Static data |
| `./data/*.json` | keep | JSON data |
| `./utils/*` | keep (partial) | Non-style utils shimmed |
| `./utils/devicePresets` | keep | Utility |
| `./lib/*` | keep | Utilities |
| `./i18n.config` | keep | i18n |
| `./locales/*` | keep | Translations |

---

## Appendix B: Hooks Classification

**Total hooks: 30 files** (excluding `.d.ts` duplicates)

### Design System Hooks (6) → `@acme/design-system`

| Hook | Reason |
|------|--------|
| `useTheme.ts` | Pure presentation |
| `useReducedMotion.ts` | Accessibility, no domain |
| `useInView.ts` | Intersection observer, no domain |
| `useViewport.ts` | Viewport detection, no domain |
| `useScrollProgress.ts` | Scroll position, no domain |
| `useResponsiveImage.ts` | Image sizing, no domain |

### CMS Hooks (3) → `@acme/cms-ui`

| Hook | Reason |
|------|--------|
| `usePreviewDevice.ts` | CMS preview functionality |
| `useTokenEditor.tsx` | Design token editing |
| `useTokenColors.ts` | Design token colors |

### Domain Hooks (21) → `@acme/ui`

| Hook | Domain |
|------|--------|
| `useCart.ts` | E-commerce |
| `useProductFilters.ts` | E-commerce |
| `useProductInputs.ts` | E-commerce |
| `useProductEditorFormState.tsx` | CMS product editing |
| `useProductEditorNotifications.ts` | CMS product editing |
| `useFileUpload.tsx` | Media |
| `useImageUpload.tsx` | Media |
| `useMediaUpload.tsx` | Media |
| `useImageOrientationValidation.ts` | Media |
| `useRemoteImageProbe.ts` | Media |
| `usePublishLocations.ts` | Publishing |
| `useContrastWarnings.ts` | Accessibility |
| `useCurrentLanguage.ts` | i18n |
| `useRoomPricing.ts` | Domain-specific |
| `tryon/analytics.ts` | Try-on feature |
| `tryon/useTryOnAnalytics.ts` | Try-on feature |
| `tryon/useTryOnController.ts` | Try-on feature |
| `tryon/useDirectR2Upload.ts` | Try-on feature |
| `upload/filePolicy.ts` | Upload |
| `upload/ingestExternalUrl.ts` | Upload |
| `upload/uploadToCms.ts` | Upload |

---

## Appendix C: Test Distribution (Verified)

| Location | Test Count | Target Package |
|----------|------------|----------------|
| `src/atoms/` | 1 | `@acme/design-system` |
| `src/components/atoms/` | 52 | `@acme/design-system` |
| `src/molecules/` | 1 | `@acme/design-system` |
| `src/components/molecules/` | 14 | `@acme/design-system` |
| `src/components/templates/` | 14 | `@acme/design-system` |
| **Design System Total** | **82** | |
| `src/components/cms/page-builder/` | 176 | `@acme/cms-ui` |
| `src/components/cms/blocks/` | 46 | `@acme/cms-ui` |
| `src/components/cms/` (other) | 47 | `@acme/cms-ui` |
| **CMS UI Total** | **269** | |
| `src/organisms/` | 1 | `@acme/ui` |
| `src/components/organisms/` | 46 | `@acme/ui` |
| Remaining | 278 | `@acme/ui` |
| **UI Total** | **325** | |
| **Grand Total** | **676** | |

---

## Open Questions (Resolved)

1. **Locales**: Stay in `@acme/ui` — they contain domain-specific strings, not design system strings.
2. **Storybook**: Single Storybook instance with stories from all three packages — see UI-21a for configuration task.
3. **Types**: Shared component prop types move with components; domain types stay in `@acme/types`.

---

## Success Metrics

| Metric | Before | Target | Measurement |
|--------|--------|--------|-------------|
| CI test time | ~2-5 min (Root CI) | -60% | GitHub Actions duration |
| @acme/ui test files | 489 files | Split: 82 + 269 + 138 | `find packages/*/src -name "*.test.ts*" \| wc -l` |
| Test parallelization | 1 job | 3 jobs | CI job count |
| Single test run | ~62s | N/A | Per-test baseline (Section.test.tsx) |

**Baseline captured**: 2026-01-21
- Recent CI runs: 2m9s to 5m23s (varies by branch)
- Test file count: 489 test files in `packages/ui/src/`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Broken imports after migration | Shims created inline with each move (Phases 2-3) keep build green |
| Test failures from moved files | Move tests with source, verify each batch |
| Circular dependencies introduced | Run madge after each phase (UI-02, UI-27) |
| Apps fail to build | Build verification in Phase 7 with failure mode defined (UI-26) |
| Performance regression | Benchmark before/after (UI-00 baseline, UI-28 comparison) |
| Missing shim for obscure export | Complete audit in UI-01 before starting, verify in UI-23 |

---

## Rollback Plan

If issues arise after partial completion:

1. **Git revert**: All changes on single branch (`work/ui-package-split`)
2. **Incremental rollback**:
   - Re-export shims are created inline with each move (Phases 2-3), so the build stays green at every commit
   - Can stop at any phase boundary and ship partial split
3. **Full rollback**:
   ```bash
   git checkout main -- packages/ui/
   git rm -rf packages/design-system packages/cms-ui
   git checkout main -- turbo.json tsconfig.json .github/workflows/ci.yml
   ```

---

## Quick Reference

| Task ID | Description | Tests | Phase |
|---------|-------------|-------|-------|
| UI-00 | Capture CI baseline metrics | — | 0 |
| UI-01 | Complete exports audit | — | 0 |
| UI-02 | Validate no circular deps | — | 0 |
| UI-03 | Create design-system package | — | 1 |
| UI-04 | Create cms-ui package | — | 1 |
| UI-05 | Add layer boundary lint rule | — | 1 |
| UI-06 | Move atoms + shim + add dep | 53 | 2 |
| UI-07 | Move molecules + shim | 15 | 2 |
| UI-08 | Move templates + shim | 14 | 2 |
| UI-09 | Move primitives/shadcn + shims | — | 2 |
| UI-10 | Move style utilities + shim | — | 2 |
| UI-11 | Move presentation hooks + shims | — | 2 |
| UI-12 | Move page-builder + shim | 176 | 3 |
| UI-13 | Move blocks + shim | 46 | 3 |
| UI-14 | Move remaining CMS + shims | 47 | 3 |
| UI-15 | Move DynamicRenderer/hooks + shims | — | 3 |
| UI-16 | Create import rewrite script | — | 4 |
| UI-17 | Rewrite source imports | — | 4 |
| UI-18 | Rewrite test imports | — | 4 |
| UI-18a | Remove CMS shims and dep | — | 4 |
| UI-19 | Update tsconfig references | — | 5 |
| UI-20 | Update turbo.json | — | 5 |
| UI-21 | Add parallel CI jobs | — | 5 |
| UI-21a | Update Storybook config | — | 5 |
| UI-23 | Verify all 83 export paths | — | 6 |
| UI-25 | Run full test suite | 676 | 7 |
| UI-26 | Verify app builds | — | 7 |
| UI-27 | Verify no circular deps | — | 7 |
| UI-28 | Measure CI improvement | — | 7 |

**Note:** UI-22 and UI-24 were merged into other tasks (deprecation warnings now inline with Phase 2-3 shim creation; exports map verification merged into UI-23).
