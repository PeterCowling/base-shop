---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Build
Created: 2026-01-30
Last-updated: 2026-01-30
Feature-Slug: postbuild-tsx-esm-fix
Related-Plan: docs/plans/postbuild-tsx-esm-fix-plan.md
---

# Postbuild Script ESM/tsx Interop Fix - Fact-Find Brief

## Scope

### Summary

The `postbuild` script (`apps/brikette/scripts/generate-public-seo.ts`) fails when it transitively imports from `@acme/guides-core`. The immediate symptom is a runtime `TypeError` when calling `createGuideUrlHelpers`.

**Root cause (confirmed):** `apps/brikette/tsconfig.json` contains a `paths` mapping for `@acme/guides-core` that prioritizes a `.d.ts` file (`../../packages/guides-core/dist/index.d.ts`). When running scripts via `tsx` from within `apps/brikette/`, `tsx` applies TS path mapping at runtime and resolves `@acme/guides-core` to the `.d.ts` file, which produces an **empty runtime module**. The named import therefore becomes `undefined`, and the call fails.

This is **not** primarily an ESM/CJS `"type"` mismatch problem; the failure is driven by **runtime resolution to `.d.ts` via TS `paths`**.

The issue manifests as:
```
TypeError: (0 , import_guides_core.createGuideUrlHelpers) is not a function
```

### Goals

- Fix the postbuild script to run successfully in CI/CD builds
- Maintain ESM-first architecture across the monorepo
- Ensure solution is stable for long-term use with tsx
- Generate SEO artifacts (sitemap.xml, robots.txt, schema assets) during build

### Non-goals

- Rewriting the generate-public-seo.ts script logic
- Changing the monorepo's ESM-first approach
- Replacing tsx across all scripts (only if necessary for this specific case)
- Addressing other tsx/ESM issues in the codebase (focus on postbuild only)

### Constraints & Assumptions

- **Constraints:**
  - Build must complete successfully for CI/CD pipeline
  - Must preserve tsx for other scripts in the monorepo (heavily used: 60+ script invocations across package.json files)
  - Must maintain ESM-first approach (root package.json has `"type": "module"`)
  - Postbuild was added in commit cd6cd4cd1b (2026-01-28) as part of SEO machine-readability work

- **Assumptions:**
  - The SEO artifacts are required for production (sitemap, robots.txt, schema)
  - The Next.js build itself works correctly (verified: ✓ builds successfully)
  - The guides-core package is correctly built as ESM (verified: ✓ exports work in Node ESM)

## Repo Audit (Current State)

### Entry Points

- **Postbuild hook:** `apps/brikette/package.json` line 6
  ```json
  "postbuild": "pnpm exec tsx scripts/generate-public-seo.ts"
  ```

- **Script:** `apps/brikette/scripts/generate-public-seo.ts`
  - Imports from `@/config/site`, `@/routing/routeInventory`, `@/seo/robots`, etc.
  - Uses `import.meta.url` (ESM syntax)
  - Generates: `sitemap.xml`, `sitemap_index.xml`, `robots.txt`
  - Copies schema assets from `src/schema/hostel-brikette/*.jsonld` to `public/schema/`

### Key Modules / Files

- **guides-core package:** `packages/guides-core/`
  - `package.json` has `"type": "module"` (ESM)
  - `dist/index.js` uses `export` syntax (pure ESM)
  - Exports: `createGuideUrlHelpers`
  - Built with TypeScript compiler (tsc)

- **Import chain causing failure:**
  ```
  generate-public-seo.ts
    → @/routing/routeInventory (src/routing/routeInventory.ts)
    → @/routes.guides-helpers (src/routes.guides-helpers.ts)
    → @/guides/slugs (src/guides/slugs/index.ts)
    → @/guides/slugs/urls (src/guides/slugs/urls.ts)
    → @acme/guides-core (resolved by tsx to packages/guides-core/dist/index.d.ts via TS `paths`) ❌ FAILS HERE
  ```

- **Module type configuration:**
  - Root `package.json`: `"type": "module"` ✓
  - `apps/brikette/package.json`: NO `"type"` field (defaults to CJS) ⚠️
  - `packages/guides-core/package.json`: `"type": "module"` ✓
  - Note: This configuration is **not sufficient** to explain the observed failure by itself; see **Root Cause** below.

### Patterns & Conventions Observed

- **Root-level scripts:** Successfully use tsx with ESM
  - Evidence: `scripts/src/build-tokens.ts` uses `import.meta.url` and runs fine with `pnpm tsx`
  - Pattern: Root context inherits `"type": "module"` from root package.json

- **Monorepo tsx usage:** Extensive (60+ invocations)
  - Both root scripts and app-level scripts use tsx
  - Version: `tsx@4.20.3`
  - Node version: `v20.19.4`

- **ESM-first architecture:** Workspace is mostly ESM
  - **Correction:** The `packages/` workspace is *mostly* ESM (`43/45` are `"type": "module"`), but there are `commonjs` packages (e.g. `@acme/tailwind-config`, `@acme/cypress-image-snapshot`). Apps also vary (e.g. `apps/brikette` has no `"type"` field).

### Data & Contracts

- **guides-core exports:**
  ```typescript
  export interface GuidesCoreConfig<Lang, Key> { ... }
  export interface GuideUrlHelpers<Lang, Key> { ... }
  export function createGuideUrlHelpers(config) { ... }
  ```

- **SEO artifacts generated:**
  - `public/sitemap.xml` - URL inventory for search engines
  - `public/sitemap_index.xml` - Sitemap index
  - `public/robots.txt` - Crawler directives
  - `public/schema/hostel-brikette/*.jsonld` - Structured data

### Dependency & Impact Map

- **Upstream dependencies:**
  - tsx (TypeScript runner)
  - @acme/guides-core (slug/URL helpers)
  - App-level modules (@/config, @/routing, @/seo)

- **Downstream dependents:**
  - CI/CD build pipeline (blocks deploys when failing)
  - Search engine indexing (no sitemap if postbuild fails)
  - Structured data for machine readers (no schema files)

- **Likely blast radius:**
  - **Low risk:** Fix is isolated to postbuild execution context
  - **No code changes:** guides-core and app code work correctly in Next.js build
  - **Minimal surface:** Only affects postbuild script invocation

### Tests & Quality Gates

- **Existing tests:**
  - No direct tests for `generate-public-seo.ts`
  - Machine-readable contract tests: `src/test/machine-docs-contract.test.ts` (validates schema outputs)
  - URL coverage tests: reference SEO artifacts indirectly

- **Gaps:**
  - No CI test ensuring postbuild completes successfully
  - No validation that SEO artifacts are generated during builds

- **Commands/suites:**
  - Main build: `pnpm run build` (includes prebuild + build + postbuild)
  - Next.js build alone: Works ✓ (verified)
  - Postbuild alone: Fails ❌ (verified)

### Recent Git History (Targeted)

- **cd6cd4cd1b** (2026-01-28): "feat(seo): wire SEO artifact generator into build (TASK-SEO-7)"
  - Added postbuild hook
  - Introduced the current failure

- **f155699480** (earlier): "feat(seo): align canonical URLs with trailing-slash policy (TASK-SEO-4)"
  - SEO standardization work

- **233f76d85b**: "test(seo): add machine-document contract tests (TASK-SEO-10)"
  - Tests expect SEO artifacts to exist

## External Research

### Root Cause (Confirmed)

`apps/brikette/tsconfig.json` defines runtime-affecting `paths` mappings, including:

```json
"@acme/guides-core": [
  "../../packages/guides-core/dist/index.d.ts",
  "../../packages/guides-core/src/index.ts"
]
```

When executing `apps/brikette/scripts/generate-public-seo.ts` via `tsx` from within `apps/brikette/`, `tsx` applies TS path mapping at runtime and resolves `@acme/guides-core` to the first matching entry (`dist/index.d.ts`). A `.d.ts` has no runtime exports, so `import { createGuideUrlHelpers } from "@acme/guides-core"` becomes effectively `undefined` at runtime, causing:

```
TypeError: (0 , import_guides_core.createGuideUrlHelpers) is not a function
```

### Supporting Evidence (Commands)

- Failing baseline:
  - `cd apps/brikette && pnpm exec tsx scripts/generate-public-seo.ts` ❌
- Resolution changes after enabling tsx CJS hooks:
  - `cd apps/brikette && node -e "require('tsx/cjs'); console.log(require.resolve('@acme/guides-core'))"`
    - Resolves to `.../packages/guides-core/dist/index.d.ts` ❌ (runtime-empty)
- Plain Node resolution (no tsx hooks) points to runtime JS:
  - `cd apps/brikette && node -e "console.log(require.resolve('@acme/guides-core'))"`
    - Resolves to `.../packages/guides-core/dist/index.js` ✓
- Successful run with a scripts-specific tsconfig that preserves `@/*` but reorders `@acme/guides-core` away from `.d.ts`:
  - `cd apps/brikette && pnpm exec tsx --tsconfig /tmp/tsx-brikette-scripts-tsconfig.json scripts/generate-public-seo.ts` ✓
  - Artifacts generated:
    - `apps/brikette/public/sitemap.xml`
    - `apps/brikette/public/sitemap_index.xml`
    - `apps/brikette/public/robots.txt`
    - `apps/brikette/public/schema/hostel-brikette/*.jsonld`

### Notes on ESM/CJS (Secondary)

The failing stack trace shows `node:internal/modules/cjs/loader` and a `tsx` CJS register module, so this *is* happening in a CJS execution context. However, the failure is explained by **`.d.ts` runtime resolution**, not by an inability to load ESM output from `@acme/guides-core`.

- **Node.js ESM/CJS interop (v20.19.4):**
  - ESM ↔ CJS interop depends on exact entrypoint, export shape, and Node semantics/flags
  - This issue does **not** require changing module type: the confirmed failure is `.d.ts` runtime resolution under `tsx`, not ESM/CJS incompatibility

- **TypeScript compilation:**
  - guides-core tsconfig: `"module": "esnext"`, `"moduleResolution": "node"`
  - Compiles to pure ESM (no CJS compat layer)

## Questions

### Resolved

- **Q: Why does the Next.js build succeed but tsx fails?**
  - A: Next.js builds fine because it doesn't execute this script and/or because its compilation/bundling doesn't attempt to resolve `@acme/guides-core` to a `.d.ts` at runtime. The failure occurs when `tsx` runs in `apps/brikette/` and applies TS `paths` resolution at runtime, resolving `@acme/guides-core` to `dist/index.d.ts`.
  - Evidence: `apps/brikette/tsconfig.json` `paths` + tsx runtime resolution behavior (see Root Cause / Supporting Evidence).

- **Q: Why do root-level tsx scripts work but brikette scripts fail?**
  - A: Root-level scripts generally do not use the `apps/brikette/tsconfig.json` `paths` mapping that aliases workspace packages to `.d.ts`. In brikette, that mapping is present and `tsx` uses it at runtime.
  - Evidence: `apps/brikette/tsconfig.json` maps `@acme/guides-core` to `.d.ts` first; enabling tsx hooks (`require('tsx/cjs')`) makes `require.resolve('@acme/guides-core')` resolve to that `.d.ts`.

- **Q: Can guides-core be loaded at all by Node?**
  - A: Yes, via ESM `import()`. Testing confirms: `node --eval "import('./packages/guides-core/dist/index.js').then(m => console.log(Object.keys(m)))"` succeeds.
  - Evidence: Direct ESM import works

- **Q: Is the postbuild script required for production?**
  - A: Yes. SEO artifacts (sitemap, robots.txt, schema) are generated by this script and are necessary for search engines and machine readers.
  - Evidence: Commit cd6cd4cd1b added it as part of SEO machine-readability initiative

### Open (User Input Needed)

*None - ready for planning.*

## Confidence Inputs (for /plan-feature)

- **Implementation:** 95%
  - Root cause is clear: runtime resolution to `.d.ts` via `apps/brikette/tsconfig.json` `paths` when running under `tsx`
  - Working mitigation verified: `tsx --tsconfig <scripts tsconfig>` that preserves `@/*` but reorders `@acme/guides-core` away from `.d.ts`
  - What's missing: Decide whether to apply scripts tsconfig only to postbuild or to all brikette `tsx` scripts

- **Approach:** 90%
  - Recommended approach is clear: scripts-specific tsconfig + `tsx --tsconfig` for postbuild
  - Secondary option exists: change app tsconfig `paths` ordering (riskier for IDE/typecheck)
  - What's missing: Whether we standardize all `apps/brikette` `tsx` scripts on the scripts tsconfig

- **Impact:** 100%
  - Blast radius fully mapped: only affects postbuild execution
  - No changes to guides-core or app code required
  - Rollback is trivial (revert package.json change)
  - CI/CD impact: fixes blocking build failure

## Planning Constraints & Notes

- **Must-follow patterns:**
  - Maintain ESM-first architecture (all packages are `"type": "module"`)
  - Preserve tsx for existing scripts (60+ invocations across monorepo)
  - Keep solution simple and documented

- **Rollout/rollback expectations:**
  - Zero-downtime: Change is build-time only
  - Rollback: Revert package.json change if needed
  - Validation: Run full build (`pnpm run build`) to confirm postbuild succeeds

- **Observability expectations:**
  - Build logs should show postbuild completion
  - SEO artifacts should exist in `public/` after build
  - CI should pass without manual intervention

## Suggested Task Seeds (Non-binding)

### Solution A: Add a scripts-specific tsconfig and point postbuild at it (RECOMMENDED)

**Tasks:**
1. Create `apps/brikette/tsconfig.scripts.json` (or similar) that preserves `@/*` but ensures `@acme/guides-core` resolves to runtime code (`src/index.ts` or `dist/index.js`) instead of `.d.ts`.
2. Update postbuild to use it:
   - `"postbuild": "pnpm exec tsx --tsconfig tsconfig.scripts.json scripts/generate-public-seo.ts"`
3. Test: `cd apps/brikette && pnpm run postbuild`
4. Verify artifacts generated in `apps/brikette/public/` (sitemap, robots, schema copies)
5. Optional hardening: update other `tsx` scripts in brikette to use the scripts tsconfig to prevent future `.d.ts` runtime-resolution footguns.

**Pros:**
- Fixes the actual root cause (runtime resolution to `.d.ts`)
- Localized: only affects script execution (not Next.js app build)
- Compatible with existing TypeScript/IDE setup (keep current tsconfig for app/editor)
- Demonstrated working via `tsx --tsconfig` override (see Supporting Evidence)

**Cons:**
- Adds one more tsconfig file (minor complexity)
- If other workspace packages are also mapped to `.d.ts` first, they may need similar treatment in the scripts tsconfig

**Risk:** Low

### Solution B: Change `apps/brikette/tsconfig.json` `paths` ordering (FAST, RISKIER)

**Tasks:**
1. Update `apps/brikette/tsconfig.json` so `@acme/guides-core` resolves to `src/index.ts` (or `dist/index.js`) before `dist/index.d.ts`.
2. Test: `cd apps/brikette && pnpm run postbuild`

**Pros:**
- One file change
- Fixes all brikette `tsx` scripts without updating each script command

**Cons:**
- May impact IDE/typecheck behavior that relied on `.d.ts` being preferred
- Risk of accidental runtime coupling to source TS in contexts that should prefer built artifacts

**Risk:** Medium (touches the primary app tsconfig)

### Solution C: Change `@acme/guides-core` packaging to avoid `.d.ts` runtime resolution (NOT RECOMMENDED)

**Tasks:**
1. Change `packages/guides-core/package.json` / `exports` and/or build outputs so that resolution cannot land on `.d.ts` under tsx hooks

**Pros:**
- Centralizes the fix in the library

**Cons:**
- Treats the symptom in one package while leaving the underlying `paths -> .d.ts` runtime pattern in place
- Likely to scale poorly across the monorepo

**Risk:** Medium/High

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None
- **Recommended next step:** Proceed to `/plan-feature` with Solution A as the primary approach (scripts-specific tsconfig + `tsx --tsconfig ...` for postbuild), with Solution B only if we explicitly decide that `apps/brikette/tsconfig.json` can be safely changed without harming editor/typecheck expectations.

## Evidence Summary

**Root cause confirmed:**
- `apps/brikette/tsconfig.json` maps `@acme/guides-core` to `dist/index.d.ts` first
- `tsx` applies TS `paths` at runtime when running scripts, and resolves `@acme/guides-core` to that `.d.ts`
- Importing from a `.d.ts` yields an empty runtime module, producing the `TypeError`

**Solution validated:**
- Running with a scripts-specific tsconfig that preserves `@/*` but resolves `@acme/guides-core` to runtime code makes `generate-public-seo.ts` succeed and generate artifacts.
