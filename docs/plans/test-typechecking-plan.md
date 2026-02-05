---
Type: Plan
Status: Active
Domain: Testing
Created: 2026-01-18
Created-by: Claude Opus 4.5
Last-updated: 2026-01-18
Last-updated-by: Codex
---

# Test Typechecking Plan

## Problem Statement

Test files (`.test.ts`, `.spec.ts`, `__tests__/**`) are excluded from the main `tsconfig.json` files across the monorepo. This creates two distinct problems:

1. **Editor UX**: VS Code doesn't typecheck test files because it uses `tsconfig.json` by default
2. **CI/CLI Typechecking**: Running `tsc -p tsconfig.test.json` fails due to architecture issues

## Progress Updates

### 2026-01-18

- Aligned test typecheck config `rootDir`/`include` to workspace sources to clear TS6059/TS6307 (see repo changes).
- Running targeted package checks with `TYPECHECK_FILTER=packages/ui node scripts/typecheck-tests.mjs`.
- Current focus: clearing remaining `packages/ui` test type errors (module aliases, strict prop typing in fixtures, and page-builder test scaffolding).

## Current State (Verified 2026-01-18)

### Test File Inventory

- **2,472 test files** across the monorepo (verified via `rg --files`)

### Error Analysis

The root `tsconfig.test.json` is a **hybrid config** with both:
- `include` patterns that directly include test files
- `references` to 32 package-level test configs

This hybrid design predates the current analysis. The `references` were likely intended to support `tsc -b` project graph builds, but as shown below, that mode currently fails. The ts-jest runtime has its own caching mechanism independent of TypeScript project references.

**Compiler Mode Results:**

| Mode | Command | Errors | Root Cause |
|------|---------|--------|------------|
| `-p` (project) | `tsc -p tsconfig.test.json --noEmit` | 770 TS6305 | References expect `.d.ts` in each project's `declarationDir` |
| `-b` (build) | `tsc -b tsconfig.test.json` | 11,000+ | `verbatimModuleSyntax` + per-package `rootDir` constraints |
| Flat (no refs) | `tsc -p tsconfig.test.flat.json --noEmit` | 4,279 | Real type errors + unresolved aliases |

**With a flat config (no project references), real errors by type:**

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2307 | 1,057 | Cannot find module |
| TS2345 | 822 | Argument type not assignable |
| TS2339 | 371 | Property does not exist |
| TS5097 | 291 | Import specifier not allowed (e.g., `.ts` extension without `allowImportingTsExtensions`) |
| TS18046 | 244 | Unknown type |
| TS7006 | 211 | Parameter implicitly has 'any' |

### Alias Resolution: Jest vs TypeScript

Many TS2307 errors come from aliases with different resolution contexts:

| Alias | Jest Mapping | In tsconfig? | Category |
|-------|--------------|--------------|----------|
| `@acme/types` | `packages/types/src/index.ts` | ❌ dist only | **Fix in base config** |
| `@/components/atoms/shadcn` | `test/__mocks__/shadcnDialogStub.tsx` | ❌ | Mock stub |
| `@/components/*` | `test/__mocks__/componentStub.js` | ❌ | Mock stub |
| `@/*` | `apps/cms/src/$1` | ❌ | **App-local alias** (CMS) |
| `@acme/telemetry` | `test/__mocks__/telemetryMock.ts` | ❌ | Mock stub |

**Key insight**: `@/*` is a real app-local alias used by CMS, not a Jest-only mock. A single root `tsconfig.test.typecheck.json` cannot safely model multiple apps' `@/*` if they differ. This argues for **per-app/per-package typechecking** (Option C) rather than a monolithic root config.

**Actionable errors after alias cleanup (estimated):**
- ~640 `@acme/types` → fixable via `tsconfig.base.json`
- ~200 mock stubs → mirror into typecheck config paths
- ~200 app-local aliases → requires per-app scoping or explicit paths
- ~3,200 other errors → real type issues to fix

**Errors by Directory (Top 10):**

| Directory | Errors |
|-----------|--------|
| packages/config/src/env/__tests__ | 350 |
| packages/template-app/__tests__ | 161 |
| apps/cms/__tests__ | 156 |
| packages/ui/src/components/cms/page-builder | 144 |
| packages/platform-core/__tests__ | 126 |
| packages/lib/src/__tests__ | 96 |
| packages/auth/src/__tests__ | 93 |
| packages/ui/__tests__ | 91 |
| packages/ui/src/components/cms/page-builder/__tests__ | 90 |
| packages/config/src/env/__tests__/core | 86 |

## Problem Separation

### Problem 1: Editor UX (VS Code doesn't typecheck tests)

**Symptom:** VS Code shows squiggly lines in test files or ignores type errors

**Root cause:** Main `tsconfig.json` files have `exclude` patterns:
```json
"exclude": ["**/__tests__/**", "**/*.test.*", "**/*.spec.*"]
```

**Options:**
1. Remove test exclusions from main tsconfig (may slow editor, increases memory)
2. Keep current setup (developers run `tsc` manually)
3. Per-package `tsconfig.json` that includes tests (used for that package's editor context)
4. Multi-root VS Code workspace with per-package discovery

### Problem 2: CI/CLI Typechecking (actual errors)

**Symptom:** Cannot run `tsc -p tsconfig.test.json` without errors

**Root causes:**
1. **Hybrid config architecture**: Both `include` AND `references` creates conflicts when using `-p` mode
2. **Missing path aliases**: `@acme/types` only resolves to `dist/`, not `src/`
3. **Real type errors**: ~3,200 genuine type issues in test files
4. **App-local aliases**: `@/*` differs per app, can't be modeled in single root config
5. **Mock stubs**: Need explicit paths to resolve

**Options:**
- A) **Root typecheck config**: Create `tsconfig.test.typecheck.json` scoped to one app (e.g., CMS) or packages only
- B) **Per-package typecheck**: Each package has its own typecheck command, CI runs them in sequence
- C) **Hybrid**: Packages use root config, apps use their own `tsconfig.test.json` extended with `noEmit: true`

## Recommended Approach

### Phase 1: Fix Path Aliases in `tsconfig.base.json`

Update `@acme/types` to include source path for development:

```json
"@acme/types": [
  "packages/types/src/index.ts",
  "packages/types/dist/index.d.ts"
],
"@acme/types/*": [
  "packages/types/src/*",
  "packages/types/dist/*"
],
```

This eliminates ~660 errors and aligns with how Jest already resolves it (see `jest.moduleMapper.cjs` line 94).

### Phase 2: Create Dedicated Typecheck Config (Packages Only)

Create `tsconfig.test.typecheck.json` for **packages only** (not apps). Apps have conflicting `@/*` aliases and should use per-app typechecking.

```json
// tsconfig.test.typecheck.json — packages only, not apps
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["node", "jest", "@testing-library/jest-dom"],
    "allowJs": true,
    "resolveJsonModule": true,
    "rootDir": ".",
    "noEmit": true,
    "verbatimModuleSyntax": false,
    "paths": {
      // Inherit from base, plus mock stubs
      "@acme/telemetry": ["test/__mocks__/telemetryMock.ts"],
      "@acme/plugin-sanity": ["test/__mocks__/pluginSanityStub.ts"],
      "@acme/plugin-sanity/*": ["test/__mocks__/pluginSanityStub.ts"],
      "@prisma/client": ["__mocks__/@prisma/client.ts"]
      // Note: Do NOT add @/* here — it's app-specific
    }
  },
  "include": [
    "jest.setup.ts",
    "test/**/*.ts",
    "test/**/*.tsx",
    "test/**/*.js",
    "packages/**/__tests__/**/*.ts",
    "packages/**/__tests__/**/*.tsx",
    "packages/**/?(*.)+(spec|test).ts",
    "packages/**/?(*.)+(spec|test).tsx"
  ],
  "exclude": ["test/e2e/**", "**/node_modules/**", "**/dist/**"]
}
```

**Note**: `functions/**/*.ts(x)` was removed—including all `.ts` files would typecheck non-test code. Tests pull in their dependencies via imports.

### Phase 3: Per-App Typecheck Configs

Each app creates its own test typecheck config that extends the app's main tsconfig:

```json
// apps/cms/tsconfig.test.typecheck.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node", "jest", "@testing-library/jest-dom"],
    "verbatimModuleSyntax": false,
    "paths": {
      // App-specific paths including @/*
      "@/*": ["./src/*"],
      "@/components/atoms/shadcn": ["../../test/__mocks__/shadcnDialogStub.tsx"],
      "@/components/*": ["../../test/__mocks__/componentStub.js"]
    }
  },
  "include": [
    "__tests__/**/*.ts",
    "__tests__/**/*.tsx",
    "src/**/*.test.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.ts",
    "src/**/*.spec.tsx"
  ]
}
```

### Phase 4: Fix Real Type Errors

Prioritize by error count:
1. `packages/config/src/env/__tests__` - 350 errors
2. `packages/template-app/__tests__` - 161 errors
3. `apps/cms/__tests__` - 156 errors

### Phase 5: CI Integration

Add to CI after errors reach zero:

```yaml
- name: Typecheck package tests
  run: pnpm exec tsc -p tsconfig.test.typecheck.json

- name: Typecheck CMS tests
  run: pnpm exec tsc -p apps/cms/tsconfig.test.typecheck.json

# Add other apps as needed
```

### Phase 6: Editor UX (Deferred)

This is a separate concern from CI. Options to evaluate later:
- Per-package tsconfig that includes tests
- Multi-root VS Code workspace
- Accept CLI-only test typechecking

## Decision: Why Per-App Scoping?

A single root `tsconfig.test.typecheck.json` for all apps would require:
1. Modeling every app's `@/*` alias (they may conflict)
2. Or using a catch-all `@/*` that points to one app (breaks others)

Per-app configs avoid this by inheriting each app's path resolution. The trade-off is more configs to maintain, but they're small and rarely change.

## Open Questions

1. **Which apps need typecheck configs?** Start with CMS (highest test count), add others incrementally.

2. **`-b` mode as future track?** Build mode exposes deeper issues (per-package `rootDir`, cross-package source imports). Worth fixing only if incremental build perf becomes a priority.

## Progress Log

| Date | Phase | Notes |
|------|-------|-------|
| 2026-01-18 | Analysis | Completed baseline with verified methodology |
| 2026-01-18 | Analysis | Updated per critique: separate typecheck config, preserve ts-jest, clarify aliases |
| 2026-01-18 | Analysis | Revised per critique: per-app scoping for `@/*`, mirror mock stubs, remove non-test includes |
| 2026-01-18 | Phase 1-2 | Implemented configs: fixed `@acme/types` in base, created `tsconfig.test.typecheck.json` (packages) and `apps/cms/tsconfig.test.typecheck.json` |
| 2026-01-18 | Phase 1-2 | Results: errors reduced from 4,279 → 1,934 (55% reduction). TS2307 dropped from 1,057 → 36. Added `allowImportingTsExtensions`. |
| 2026-01-18 | Phase 4 | Fixed SpyInstance types, WithEnvExecutor signature, withEnv parameter type. Errors: 4,279 → 1,797 (58% reduction). |
| 2026-01-18 | Phase 4 | Fixed TS2540 (process.env readonly) across 34 files, fixed SpyInstance type mismatches. Errors: 1,797 → 1,618 (62% reduction). |
| 2026-01-18 | Phase 4 | Removed unused @ts-expect-error directives (TS2578). Errors: 1,618 → 1,539 (64% reduction). |
| 2026-01-18 | Phase 4 | Loosened env override typing in auth env tests, guarded safeParse errors, fixed env symbol casts. Errors: 1,539 → 1,506 (65% reduction). |

## Current Status

**Packages typecheck** (`tsconfig.test.typecheck.json`): 1,506 errors (down from 4,279)
**CMS typecheck** (`apps/cms/tsconfig.test.typecheck.json`): 756 errors (not re-run in this update)

### Error Breakdown (Packages)

| Error Code | Count | Category | Fix Pattern |
|------------|-------|----------|-------------|
| TS2345 | 407 | Argument type mismatch | Update function signatures, add generics |
| TS2339 | 201 | Property doesn't exist | Add type assertions or fix mocks |
| TS2322 | 125 | Type not assignable | Fix return types |
| TS2352 | 114 | Type conversion | Add explicit casts |
| TS2741 | 100 | Missing property | Add required properties |
| TS2551 | 77 | Jest async methods | `@jest/globals` lacks `isolateModulesAsync`, etc. |
| TS18048 | 59 | Possibly undefined | Add null checks or assertions |
| TS18046 | 52 | Unknown type | Add type assertions |
| TS2353 | 50 | Object literal | Add index signature or use type assertion |
| TS7006 | 45 | Implicit any | Add type annotations |
| TS2307 | 36 | Cannot find module | Fix path aliases |

### Common Fix Patterns

1. **`process.env` readonly errors (TS2540)**: ✅ Fixed — Tests assign to `process.env.NODE_ENV` directly. Fixed with:
   ```typescript
   (process.env as Record<string, string | undefined>).NODE_ENV = "test";
   ```

2. **SpyInstance type errors (TS2345/TS2741)**: ✅ Partially fixed — Use loose `AnySpyInstance` type to handle version mismatches between `@jest/globals` and `@types/jest`:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   type AnySpyInstance = { mockRestore: () => void } & Record<string, any>;
   ```

3. **WithEnv executor errors**: ✅ Fixed — Updated `WithEnvExecutor` type signature to match actual implementation.

4. **Unused @ts-expect-error (TS2578)**: ✅ Fixed — Removed 47 obsolete directives across test files.

5. **Jest async methods (TS2551)**: ⏳ Deferred — `@jest/globals` types don't include newer async methods like `isolateModulesAsync` and `advanceTimersByTimeAsync`. These are runtime-available but not typed. Consider upgrading `@jest/globals` or using type assertions.

6. **Env override typing (TS2345)**: ✅ Fixed — Use `Record<string, string | undefined>` for test env overrides and cast when calling loaders, preserving runtime defaults.

### Files Created

- `tsconfig.test.typecheck.json` — Packages-only typecheck config
- `apps/cms/tsconfig.test.typecheck.json` — CMS app typecheck config

### Files Modified

- `tsconfig.base.json` — Added `src/` to `@acme/types` path alias
- `packages/config/test/utils/expectInvalidAuthEnv.ts` — Fixed SpyInstance and WithEnvExecutor types
- `packages/config/test/utils/withEnv.ts` — Fixed parameter type to `Record<string, string | undefined>`
- `packages/config/src/env/__tests__/authTestHelpers.ts` — Fixed SpyInstance type
- `packages/config/src/env/__tests__/auth.env.base.test.ts` — Fixed SpyInstance type
- `packages/platform-core/src/shops/__tests__/health.test.ts` — Fixed SpyInstance type
- Multiple test files — Fixed TS2540 process.env readonly errors (34 files)
- Multiple test files — Removed unused @ts-expect-error directives (47 files)
- `packages/auth/src/__tests__/envTestUtils.ts` — Fixed env symbol casting
- `packages/auth/src/__tests__/env.core.test.ts` — Loosened env override typing
- `packages/auth/src/__tests__/env.matrix.test.ts` — Loosened env override typing
- `packages/auth/src/__tests__/env.payments.test.ts` — Loosened env override typing
- `packages/auth/src/__tests__/env.shipping.test.ts` — Wrapped loader to accept env overrides
- `packages/auth/src/__tests__/env.core.extra.test.ts` — Guarded safeParse error access

## References

- Root test config: `tsconfig.test.json` (ts-jest optimized, keep unchanged)
- Base config: `tsconfig.base.json`
- Jest module mapper: `jest.moduleMapper.cjs`
- Testing policy: `docs/testing-policy.md`
- Coverage policy: `docs/test-coverage-policy.md`
- TypeScript guide: `docs/typescript.md`
