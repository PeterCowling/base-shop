---
Type: Plan
Status: Historical
Domain: Repo
Last-reviewed: 2026-01-19
Relates-to charter: docs/runtime/runtime-charter.md
Audit-recommendation: P1.4
Created: 2026-01-19
Created-by: Claude (Opus 4.5)
Last-updated: 2026-01-19
Last-updated-by: Claude (Opus 4.5)
---

# Plan: Linting Enhancement for Code Quality and Maintainability

Source: Linting audit conducted 2026-01-19, cross-referenced with `docs/repo-quality-audit-2026-01.md`.

## Summary

Enhance the existing ESLint configuration with additional rules and plugins to close gaps in:
- Complexity management
- Import organization
- Promise/async error handling
- React performance guardrails
- Test hygiene

This plan directly supports the 3-hour launch readiness goal by reducing the likelihood of runtime errors, improving CI reliability, and making code reviews faster.

## Relationship to Launch Readiness Audit

**Reference**: [docs/repo-quality-audit-2026-01.md](../repo-quality-audit-2026-01.md)

| Audit Category | Current Score | Linting Impact | Projected Improvement |
|----------------|---------------|----------------|----------------------|
| Testing and regression | 3.0/5 | Test hygiene rules prevent `.only` commits, improve async test patterns | +0.25 |
| CI/CD and deployment | 3.5/5 | Stricter linting reduces CI failures from code quality issues | +0.25 |
| Security and tenancy isolation | 3.5/5 | Enhanced type safety and promise handling prevent edge-case bugs | +0.1 |
| Agent cohesion and delivery ops | 4.0/5 | Consistent code style reduces review friction, aids onboarding | +0.1 |

**Estimated total score impact**: +1.4 points (68.6 → 70.0)

This is a **P1.4 recommendation** in the launch readiness audit—important for quality but not a P0 blocker. The tasks within this plan are labeled by their internal priority (LINT-P0, LINT-P1, LINT-P2), not to be confused with the audit's P0/P1/P2 system.

## Problem Statement

The current linting setup has 11 active plugins with excellent design system governance but gaps in:

1. **No complexity limits**: Functions can grow unbounded (1000+ hooks without constraints)
2. **Import organization lacking**: 102+ `eslint-disable` comments suggest style inconsistencies
3. **Promise error handling absent**: Async/await patterns throughout platform-core have no guardrails
4. **Test hygiene incomplete**: No protection against `.only` commits
5. **React performance unguarded**: Inline objects/arrays/functions in JSX cause unnecessary re-renders

## Current State

### Installed ESLint Plugins (11 total)

| Plugin | Purpose | Coverage |
|--------|---------|----------|
| @typescript-eslint | TypeScript rules | Good |
| eslint-plugin-boundaries | Atomic design layers | Excellent |
| eslint-plugin-import | Import/export | Partial (no sorting) |
| eslint-plugin-jsx-a11y | Accessibility | Good |
| eslint-plugin-react-hooks | Hooks rules | Good |
| eslint-plugin-security | Security patterns | Good |
| eslint-plugin-storybook | Storybook rules | Good |
| eslint-plugin-testing-library | Testing patterns | Good |
| eslint-plugin-jest | Jest rules | Minimal usage |
| @acme/eslint-plugin-ds | Design system (35+ rules) | Excellent |
| eslint-plugin-tailwindcss | Tailwind linting | Optional load |

### Key Configuration Files

- Main config: [eslint.config.mjs](../../eslint.config.mjs)
- Custom DS plugin: [packages/eslint-plugin-ds/](../../packages/eslint-plugin-ds/)
- TypeScript base: [tsconfig.base.json](../../tsconfig.base.json) (strict: true)
- Prettier: [.prettierrc](../../.prettierrc)

### Critical Constraint: `--max-warnings=0`

The pre-commit hook enforces `eslint --max-warnings=0` via lint-staged ([package.json:125](../../package.json#L125)):

```json
"lint-staged": {
  "**/*.{ts,tsx,js,jsx}": [
    "eslint --max-warnings=0 --cache --cache-location .eslintcache --no-warn-ignored"
  ]
}
```

**Implication**: Any new `warn`-level rules will **immediately block commits** unless we either:
1. Fix all existing violations before enabling the rule, OR
2. Use a baseline/diff approach (`lint:exceptions` workflow), OR
3. Set new rules to `off` initially and upgrade to `error` after cleanup

This plan adopts **approach #1 for high-value rules** (fix violations first) and **approach #3 for noisy rules** (disabled until cleanup complete).

### Critical Constraint: Type-Aware Rules and `project: null` Overrides

**20+ file overrides** disable the TypeScript project for performance or compatibility. Type-aware rules will **error** in these files unless explicitly disabled.

**Complete list of `project: null` overrides** (from `eslint.config.mjs`):

| Line | Files Pattern | Reason |
|------|---------------|--------|
| 424 | `packages/design-tokens/**/*` | Generated dist files |
| 436 | `packages/config/env-schema.ts` | Root-level config |
| 448 | `packages/configurator/**/*` | Package isolation |
| 460 | `packages/i18n/**/*` | Package isolation |
| 473 | `packages/tailwind-config/**/*` | Config package |
| 520 | `packages/ui/src/story-utils/**/*` | Storybook helpers |
| 563 | `packages/eslint-plugin-ds/tests/**/*` | Plugin test fixtures |
| 645 | `packages/platform-core/defaultFilterMappings.ts`, `prisma/**/*` | Root files |
| 661 | `**/*.d.ts` | Declaration files |
| 698 | `scripts/seo-audit.ts` | Script file |
| 709 | `apps/*/scripts/**/*` | App scripts |
| 722 | `apps/cms/cypress.config.mjs`, `cypress/**/*`, `middleware.ts` | Cypress config |
| 747 | `scripts/**/*.js` | Plain JS scripts |
| 827 | `packages/themes/dummy/tailwind-tokens/src/**/*` | Dummy theme tokens |
| 840 | `apps/storybook/.storybook*/**/*` | Storybook config |
| 863 | `plopfile.ts` | Root plopfile |
| 946 | `**/__tests__/**/*`, `**/*.test.*`, `**/*.spec.*`, `**/*.cy.*` | Test files |
| 1059 | `packages/ui/**/*.stories.*` | UI stories |
| 1332 | `**/__tests__/**/*`, `**/*.test.*`, `**/*.spec.*` (final override) | Tests |

**Implication**: Type-aware rules like `@typescript-eslint/no-floating-promises` and `@typescript-eslint/no-misused-promises` will **error** in these files unless explicitly disabled per-override.

## Goals (Outcomes)

1. **Complexity guardrails**: Prevent functions from exceeding maintainability thresholds
2. **Consistent imports**: Auto-fixable import sorting across all files
3. **Async safety**: Catch unhandled promises and missing error handling
4. **Test reliability**: Prevent accidental `.only` commits
5. **Performance awareness**: Flag inline prop allocations in React components
6. **TypeScript strictness**: Enforce consistent type imports/exports

## Non-Goals

- Rewriting the custom `@acme/eslint-plugin-ds` rules (they're excellent)
- Adding rules that conflict with existing Prettier configuration
- Enforcing JSDoc on all functions (only public APIs, if at all)
- Adding rules with high false-positive rates that slow development

## Active Tasks

### LINT-01: Add complexity limits (built-in ESLint rules)

- **Status**: ☐
- **Priority**: LINT-P0 (Critical within this plan)
- **Estimated effort**: Small
- **Scope**:
  - Add built-in ESLint rules for complexity management
  - **Strategy**: Set to `error` with conservative thresholds; fix violations before merge
  - Configuration:
    ```js
    {
      'complexity': ['error', 20],              // Start generous, tighten later
      'max-depth': ['error', 5],                // Reasonable nesting limit
      'max-nested-callbacks': ['error', 4],     // Callback nesting
      'max-params': ['error', 6],               // Function parameters
      'max-lines-per-function': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
    }
    ```
  - **Baseline discovery command** (matches LINT-04 scope for consistency):
    ```bash
    # Note: --rule uses JSON format with numeric severity (2 = error)
    pnpm exec eslint \
      "{apps,packages,functions,scripts,tools,src,test}/**/*.{ts,tsx,js,jsx,mjs}" \
      --rule 'complexity: [2, 20]' \
      --rule 'max-depth: [2, 5]' \
      --rule 'max-nested-callbacks: [2, 4]' \
      --rule 'max-params: [2, 6]' \
      --rule 'max-lines-per-function: [2, {"max": 200, "skipBlankLines": true, "skipComments": true}]' \
      --ignore-pattern "**/dist/**" \
      --ignore-pattern "**/.next/**" \
      --ignore-pattern "**/node_modules/**" \
      2>&1 | head -100
    ```
  - Fix violations before enabling rules
- **Dependencies**: None
- **Definition of done**:
  - Rules added to `eslint.config.mjs`
  - All existing violations fixed
  - `pnpm lint` passes (zero errors from new rules)

### LINT-02: Add eslint-plugin-no-only-tests

- **Status**: ☐
- **Priority**: LINT-P0 (Critical within this plan)
- **Estimated effort**: Small
- **Scope**:
  - Install `eslint-plugin-no-only-tests`
  - **Comprehensive test file coverage** (all patterns used in repo, including `.mjs`):
    ```js
    {
      files: [
        // TypeScript test files
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        // JavaScript test files
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.spec.js',
        '**/*.spec.jsx',
        // ESM test files (e.g., packages/next-config/__tests__/index.test.mjs)
        '**/*.test.mjs',
        '**/*.spec.mjs',
        // Cypress files
        '**/*.cy.ts',
        '**/*.cy.tsx',
        // Directory-based test files
        '**/__tests__/**/*.{ts,tsx,js,jsx,mjs}',
        '**/e2e/**/*.{ts,tsx,js,jsx}',
        '**/playwright/**/*.{ts,tsx,js,jsx}',
      ],
      rules: {
        'no-only-tests/no-only-tests': 'error',
      },
    }
    ```
  - **Known `.mjs` test files** (must be included):
    - `packages/next-config/__tests__/index.test.mjs`
    - `test/unit/__tests__/esm-cjs-load.test.mjs`
- **Dependencies**: None
- **Rationale**: Prevents `.only` from slipping through to CI, which causes partial test runs
- **Definition of done**:
  - Plugin installed and configured
  - Attempting to commit a `.only` test fails lint

### LINT-03: Enhance @typescript-eslint rules

- **Status**: ☐
- **Priority**: LINT-P0 (Critical within this plan)
- **Estimated effort**: Medium (due to type-aware rule complexity)
- **Scope**:
  - **Split into type-aware vs non-type-aware rules**

  **Non-type-aware rules** (safe to enable globally):
  ```js
  // In main TS files block
  {
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports'
    }],
    '@typescript-eslint/consistent-type-exports': ['error', {
      fixMixedExportsWithInlineTypeSpecifier: true
    }],
  }
  ```

  **Type-aware rules** (require project):
  ```js
  // In main TS files block (line ~232)
  {
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': ['error', {
      checksVoidReturn: { attributes: false }  // Reduce false positives in JSX
    }],
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
  }
  ```

  **Explicit disables for ALL `project: null` overrides** (see complete list in "Critical Constraint" section above):
  ```js
  // Create a reusable rule set for type-aware rule disables
  const TYPE_AWARE_RULES_OFF = {
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off',
  };

  // Add to EACH of the 20+ project: null override blocks:
  // - packages/design-tokens/**/*
  // - packages/config/env-schema.ts
  // - packages/configurator/**/*
  // - packages/i18n/**/*
  // - packages/tailwind-config/**/*
  // - packages/ui/src/story-utils/**/*
  // - packages/eslint-plugin-ds/tests/**/*
  // - packages/platform-core/defaultFilterMappings.ts, prisma/**/*
  // - **/*.d.ts
  // - scripts/seo-audit.ts
  // - apps/*/scripts/**/*
  // - apps/cms/cypress.config.mjs, cypress/**/*
  // - scripts/**/*.js
  // - packages/themes/dummy/tailwind-tokens/src/**/*
  // - apps/storybook/.storybook*/**/*
  // - plopfile.ts
  // - **/__tests__/**/*, **/*.test.*, **/*.spec.*, **/*.cy.*
  // - packages/ui/**/*.stories.*
  ```

- **Dependencies**: None
- **Definition of done**:
  - Rules added to `eslint.config.mjs` with proper scoping
  - Type-aware rules disabled in ALL 20+ `project: null` overrides
  - Existing violations fixed via auto-fix where possible
  - `pnpm lint` passes

### LINT-04: Add eslint-plugin-simple-import-sort

- **Status**: ☐
- **Priority**: LINT-P1 (High within this plan)
- **Estimated effort**: Medium
- **Scope**:
  - Install `eslint-plugin-simple-import-sort`
  - **Note on `eslint-plugin-import`**: Already imported and registered in `eslint.config.mjs` (lines 6, 988, 1027). The `import/*` rules below use this existing registration—no new plugin registration needed for `import`.
  - **Corrected group ordering** (more specific patterns first):
    ```js
    {
      plugins: {
        'simple-import-sort': simpleImportSort,
        // 'import' already registered globally in eslint.config.mjs
      },
      rules: {
        'simple-import-sort/imports': ['error', {
          groups: [
            // Side effects (e.g., CSS imports, polyfills)
            ['^\\u0000'],
            // Node.js builtins
            ['^node:'],
            // React/Next first, then other external packages (NOT starting with @acme)
            ['^react', '^next', '^(?!@acme)@?\\w'],
            // Internal packages (@acme/*)
            ['^@acme/'],
            // Internal aliases (@/)
            ['^@/'],
            // Parent imports (..)
            ['^\\.\\.'],
            // Sibling imports (./)
            ['^\\.'],
          ],
        }],
        'simple-import-sort/exports': 'error',
        // These use the existing eslint-plugin-import registration
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
      },
    }
    ```
  - **Auto-fix command** (includes custom groups via inline JSON):
    ```bash
    # Full coverage: apps, packages, functions, scripts, tools, src, test
    # Note: --rule uses JSON format with numeric severity (2 = error)
    pnpm exec eslint \
      "{apps,packages,functions,scripts,tools,src,test}/**/*.{ts,tsx,js,jsx,mjs}" \
      --fix \
      --rule 'simple-import-sort/imports: [2, {"groups": [["^\\u0000"], ["^node:"], ["^react", "^next", "^(?!@acme)@?\\w"], ["^@acme/"], ["^@/"], ["^\\.\\."], ["^\\."]]}]' \
      --rule 'simple-import-sort/exports: 2' \
      --ignore-pattern "**/dist/**" \
      --ignore-pattern "**/.next/**" \
      --ignore-pattern "**/node_modules/**"
    ```
  - **Note**: Goal is "consistent imports across all files", not just apps/packages
- **Dependencies**: None
- **Rationale**: Reduces 102+ eslint-disable comments, makes imports consistent and readable
- **Definition of done**:
  - Plugin installed and configured
  - Auto-fix applied to ALL source directories (apps, packages, functions, scripts, tools, src, test)
  - Import order is consistent across codebase

### LINT-05: Add eslint-plugin-promise

- **Status**: ☐
- **Priority**: LINT-P1 (High within this plan)
- **Estimated effort**: Medium
- **Scope**:
  - Install `eslint-plugin-promise`
  - **All rules as `error`** (since `--max-warnings=0`):
    ```js
    {
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-return-in-finally': 'error',
      'promise/valid-params': 'error',
      // These disabled initially due to likely high violation count:
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'promise/no-nesting': 'off',
      'promise/no-promise-in-callback': 'off',
      'promise/no-callback-in-promise': 'off',
    }
    ```
  - Enable `off` rules incrementally after cleanup
- **Dependencies**: LINT-03 (TypeScript promise rules complement these)
- **Rationale**: Async/await is used heavily in platform-core and serverless functions
- **Definition of done**:
  - Plugin installed and configured
  - Error-level rules pass
  - `pnpm lint` passes

### LINT-06: Add eslint-plugin-sonarjs

- **Status**: ☐
- **Priority**: LINT-P2 (Medium within this plan)
- **Estimated effort**: Medium
- **Scope**:
  - Install `eslint-plugin-sonarjs`
  - **Conservative initial config** (error-only for low-noise rules):
    ```js
    {
      // Error level (unlikely to have many violations)
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-unused-collection': 'error',
      // Disabled until baseline cleanup
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-collapsible-if': 'off',
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/prefer-object-literal': 'off',
    }
    ```
- **Dependencies**: None
- **Rationale**: Catches code smells and logic errors that other linters miss
- **Definition of done**:
  - Plugin installed and configured
  - Error-level rules pass

### LINT-07: Add eslint-plugin-react-perf

- **Status**: ☐
- **Priority**: LINT-P2 (Medium within this plan)
- **Estimated effort**: Medium
- **Scope**:
  - Install `eslint-plugin-react-perf`
  - **Disabled by default** (high false-positive potential):
    ```js
    {
      // All off initially; enable per-package after assessment
      'react-perf/jsx-no-new-object-as-prop': 'off',
      'react-perf/jsx-no-new-array-as-prop': 'off',
      'react-perf/jsx-no-new-function-as-prop': 'off',
      'react-perf/jsx-no-jsx-as-prop': 'off',
    }
    ```
  - Enable selectively in performance-critical packages (e.g., `packages/ui`)
- **Dependencies**: None
- **Rationale**: 1000+ React components benefit from performance guardrails
- **Known limitation**: High false positives for intentional inline props
- **Definition of done**:
  - Plugin installed
  - Rules remain `off` until targeted enablement plan created

### LINT-08: Console and debugger enforcement

- **Status**: ☐
- **Priority**: LINT-P1 (High within this plan)
- **Estimated effort**: Small
- **Scope**:
  - Tighten existing console rules:
    ```js
    {
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
    }
    ```
  - Add exception for CLI scripts (including `.mjs` files):
    ```js
    {
      files: ['scripts/**/*.{ts,js,mjs}', 'tools/**/*.{ts,js,mjs}'],
      rules: {
        'no-console': 'off',
      },
    }
    ```
  - **Known `.mjs` script files** that need this exception:
    - `scripts/add-i18n-keys.mjs`
    - `scripts/fix-hardcoded-next-config-imports.mjs`
    - `scripts/src/build-tokens.mjs`
    - `scripts/src/check-tailwind-preset.mjs`
    - `scripts/typecheck-tests.mjs`
- **Dependencies**: None
- **Definition of done**:
  - Rules updated in `eslint.config.mjs`
  - No `console.log` in production code paths

## Implementation Priority Path

### Phase 1: High-Value, Low-Disruption (Immediate)

| Task | Plugin | Approach |
|------|--------|----------|
| LINT-02 | no-only-tests | Error, no existing violations expected |
| LINT-08 | Built-in | Error with CLI exceptions |

**Definition of done for Phase 1**:
- Both tasks complete
- `pnpm lint` passes (zero errors from new rules)
- Pre-commit hook works for commits that don't touch existing warned code

### Phase 2: TypeScript & Imports (Short-term)

| Task | Plugin | Approach |
|------|--------|----------|
| LINT-03 | @typescript-eslint | Error, with explicit `project: null` disables |
| LINT-04 | simple-import-sort | Error, auto-fix existing code |

**Definition of done for Phase 2**:
- Both tasks complete
- Auto-fix applied to imports
- Type-aware rules properly scoped

### Phase 3: Complexity & Quality (Medium-term)

| Task | Plugin | Approach |
|------|--------|----------|
| LINT-01 | Built-in | Error with generous thresholds, fix violations first |
| LINT-05 | promise | Partial error, rest disabled |
| LINT-06 | sonarjs | Partial error, rest disabled |

**Definition of done for Phase 3**:
- All error-level rules pass
- Disabled rules tracked for future enablement

### Phase 4: Performance (Long-term, Optional)

| Task | Plugin | Approach |
|------|--------|----------|
| LINT-07 | react-perf | Installed but disabled; enable per-package |

**Definition of done for Phase 4**:
- Plugin installed
- Enablement plan created for performance-critical packages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `--max-warnings=0` blocks commits | High | High | Use `error` only after fixing violations; use `off` for noisy rules |
| Type-aware rules fail in `project: null` files | High | High | Explicit per-override disables |
| Import sort groups match wrong packages | Medium | Low | Test regex patterns; use more specific patterns first |
| Too many violations to fix at once | High | Medium | Phase rollout; start with low-noise rules |

## Metrics to Track

After implementation, track:

| Metric | Current | Target |
|--------|---------|--------|
| eslint-disable comments | 102+ (cms app) | < 50 |
| Complexity violations | Unknown | 0 (with thresholds met) |
| Test `.only` incidents | Unknown | 0 |
| CI lint failures | ~5%? | < 1% |

## Open Questions (Resolved)

1. **Q: Should warnings fail CI given `--max-warnings=0`?**
   - **A**: Yes, they already do. This plan uses `error` for rules we want enforced and `off` for rules not yet ready.

2. **Q: Should LINT-03 type-aware rules be limited to files with a project?**
   - **A**: Yes. Explicit `off` overrides added to all `project: null` blocks.

## Existing Warnings Baseline

**Important**: The repo currently has existing warnings (from `warn`-level DS rules in templates/CMS). The acceptance criteria below do NOT require fixing all existing warnings—only that:
1. New rules don't ADD warnings (they're either `error` after fix or `off`)
2. `pnpm lint` passes (errors = 0)
3. Pre-commit hook (`--max-warnings=0`) works for clean commits

The existing DS migration warnings are tracked separately and not in scope for this plan.

## Acceptance Criteria

- [ ] Phase 1 complete: no-only-tests, console enforcement
- [ ] Phase 2 complete: TypeScript rules (with proper scoping for 20+ `project: null` overrides), import sorting
- [ ] Phase 3 complete: complexity, promise (partial), sonarjs (partial)
- [ ] `pnpm lint` passes on all packages (zero errors from new rules; existing DS warnings unchanged)
- [ ] Pre-commit hook (`--max-warnings=0`) works for commits that don't modify files with existing DS warnings
- [ ] New rules use `error` (after fixing violations) or `off` (not `warn`)—never `warn`
- [ ] All new plugins properly imported and registered in flat config format (see Appendix)
- [ ] Documentation updated in `CLAUDE.md` or contributing guide

## Appendix: Plugin Registration in ESLint 9.x Flat Config

All new plugins must be **imported and registered** in the flat config format. Unlike legacy `.eslintrc`, plugins are not auto-discovered from `package.json`.

### Plugin Registration Pattern

```js
// At top of eslint.config.mjs
import noOnlyTests from 'eslint-plugin-no-only-tests';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import promise from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import reactPerf from 'eslint-plugin-react-perf';

// In config array
export default [
  // ... existing configs
  {
    // Plugin registration block
    plugins: {
      'no-only-tests': noOnlyTests,
      'simple-import-sort': simpleImportSort,
      'promise': promise,
      'sonarjs': sonarjs,
      'react-perf': reactPerf,
    },
  },
  {
    // Rule configuration block (can be same or separate)
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    rules: {
      'no-only-tests/no-only-tests': 'error',
      'simple-import-sort/imports': 'error',
      // ... etc
    },
  },
];
```

### Plugin Compatibility Notes

All plugins must support ESLint 9.x flat config format. Verified compatible:
- eslint-plugin-simple-import-sort (v12+)
- eslint-plugin-promise (v7+)
- eslint-plugin-no-only-tests (v3+)
- eslint-plugin-sonarjs (v3+)
- eslint-plugin-react-perf (v4+)

### React 19 / Next.js 15 Compatibility

Some ESLint plugins lag behind React 19. Monitor for:
- False positives with React 19 features (use, Server Components)
- Next.js App Router patterns not recognized

### Tailwind v4 Compatibility

`eslint-plugin-tailwindcss` has optional load in current config due to v4 compatibility. Monitor for stable v4 support.

## Related Work

- Launch readiness audit: [docs/repo-quality-audit-2026-01.md](../repo-quality-audit-2026-01.md)
- Existing DS plugin: [packages/eslint-plugin-ds/](../../packages/eslint-plugin-ds/)
- ESLint config: [eslint.config.mjs](../../eslint.config.mjs)
- Testing policy: [docs/testing-policy.md](../testing-policy.md)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-01-19 | Claude (Opus 4.5) | Initial plan created based on linting audit |
| 2026-01-19 | Claude (Opus 4.5) | **Major revision** addressing Codex review: (1) Clarified `--max-warnings=0` constraint and shifted to `error`/`off` strategy instead of `warn`; (2) Added explicit `project: null` override disables for type-aware rules; (3) Fixed priority labeling (LINT-P0/P1/P2 vs audit P0/P1/P2); (4) Corrected import-sort group ordering; (5) Changed auto-fix command to direct eslint; (6) Expanded test file patterns for no-only-tests |
| 2026-01-19 | Claude (Opus 4.5) | **Second revision** addressing additional Codex findings: (1) Documented complete list of 20+ `project: null` overrides (not just 3); (2) Added `.mjs` test file patterns for no-only-tests (covers `index.test.mjs`, `esm-cjs-load.test.mjs`); (3) Expanded import-sort auto-fix to ALL directories (functions/, scripts/, tools/, src/, test/); (4) Fixed DS plugin path (`packages/eslint-plugin-ds/` not `packages/config/eslint-plugin-ds/`); (5) Added "Existing Warnings Baseline" section clarifying existing DS warnings are out of scope |
| 2026-01-19 | Claude (Opus 4.5) | **Third revision** addressing Grok findings: (1) Added complete Plugin Registration appendix with import/registration examples for ESLint 9.x flat config; (2) Expanded LINT-08 console exception to include `.mjs` files with list of known scripts; (3) Added LINT-01 baseline discovery command matching LINT-04's broader directory scope; (4) Fixed inconsistent "zero warnings" language in DoD statements (now "zero errors from new rules"); (5) Clarified pre-commit acceptance criterion re: existing DS warnings |
| 2026-01-19 | Claude (Opus 4.5) | **Fourth revision** addressing review findings: (1) Clarified that `eslint-plugin-import` is already registered in `eslint.config.mjs` (lines 6, 988, 1027)—no new registration needed for `import/*` rules in LINT-04; (2) Fixed LINT-04 auto-fix command to include custom groups config via inline JSON instead of bare `error`; (3) Fixed LINT-01 baseline command to use numeric severities (2) and quoted JSON for object options instead of unquoted literals |
