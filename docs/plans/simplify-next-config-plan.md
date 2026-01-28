Type: Plan
Status: Draft

# Plan: Simplify Next.js Webpack Configuration

**Status:** Draft — requires review before implementation

## Problem Statement

The template-app build fails with multiple issues:
1. "module has no exports" warnings when resolving internal packages
2. Conflicts between `transpilePackages` and webpack aliases pointing to different locations
3. Multiple React instance errors when using pre-built dist folders

The root cause is **over-engineered webpack configuration** that conflicts with Next.js's built-in module resolution.

## Known Issues with This Plan

> **Warning:** This plan has unresolved issues identified during review. Do not implement until addressed.

| Severity | Issue | Status |
|----------|-------|--------|
| ~~**High**~~ | ~~Option A Step 5 still adds `@acme/*` TS paths which can permit deep imports and TS/runtime mismatches~~ | **RESOLVED** — Decision #4 set to A.1 (remove `@acme/*` paths) |
| **Medium** | Option B bypasses conditional exports and RSC boundary detection | **MITIGATED** — Option B demoted to rollback-only escape hatch |
| ~~**High**~~ | ~~Shorthand aliases kept but Step 5 only updates TS paths for `@acme/*`~~ | **RESOLVED** — Step 5 now shows both Option A and B paths |
| ~~**High**~~ | ~~Re-adding aliases into `node_modules` bypasses conditional exports~~ | **RESOLVED** — Option A removes shorthand aliases; Option B demoted to rollback-only |
| ~~**Medium**~~ | ~~"All packages have proper exports" claim is unverified~~ | **RESOLVED** — marked UNVERIFIED, gated on NEXT-CONFIG-00 |
| ~~**Medium**~~ | ~~No dev/watch strategy for keeping `dist` current~~ | **RESOLVED** — Step 4 now documents turbo watch + alternatives |
| ~~**Low**~~ | ~~Verification section omits validation gate~~ | **RESOLVED** — now includes `pnpm typecheck && pnpm lint` |
| ~~**Low**~~ | ~~Root cause incorrectly states "source TypeScript files"~~ | **RESOLVED** — corrected to "whatever files resolve"

## Current State Audit

### Webpack Aliases (next.config.mjs)

| Alias | Points To | In transpilePackages? | Conflict? |
|-------|-----------|----------------------|-----------|
| `@` | template-app/src | N/A | No - legitimate app alias |
| `@i18n` | i18n/dist (or src) | Yes | **Yes** - bypasses transpilation |
| `@acme/i18n` | i18n/dist | Yes | **Yes** - bypasses transpilation |
| `@acme/types` | types/dist (or src) | No | No - types-only package |
| `@ui` | ui/dist | Yes | **Yes** - bypasses transpilation |
| `@platform-core` | platform-core/dist | Yes | **Yes** - bypasses transpilation |
| `@acme/config` | config/dist | Yes | **Yes** - bypasses transpilation |
| `@acme/date-utils` | date-utils/src | No | No |
| `@acme/email` | email/src | No | No |
| `@acme/shared-utils` | shared-utils/src | Yes | **Yes** - should use dist |
| `@auth` | auth/src | Yes | **Yes** - should use dist |
| `drizzle-orm` | false (disabled) | No | No - intentional |
| `@themes-local` | ../themes | No | No - fixture path |

### transpilePackages (index.mjs)

```javascript
transpilePackages: [
  "@acme/config",
  "@acme/template-app",
  "@acme/shared-utils",
  "@acme/ui",
  "@acme/i18n",
  "@acme/platform-core",
  "@acme/page-builder-core",
  "@acme/page-builder-ui",
  "@acme/auth",
]
```

### Package Exports

> **Audit complete (NEXT-CONFIG-00, 2026-01-20):** Verified the packages below.
> 1. `exports` fields exist and point to `dist/` for runtime entries
> 2. Conditional exports limited to `types` + `import` (plus `default` where present); no `react-server` or `browser` conditions found
> 3. Dist output contains `.js`, `.d.ts`, plus JSON assets; no `.ts`, `.tsx`, or `.jsx`

**Verified exports (2026-01-20):**
- `@acme/i18n` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`; subpaths include `./Translations`, `./*`, `./*.json`, `./package.json`
- `@acme/ui` — `.`: `types/import` → `./dist/index.d.ts` + `./dist/index.js` (no `default`); subpaths include `./components/*` (atoms/molecules/organisms/templates/home/layout/cms), `./components/cms/blocks/*`, `./components/cms/page-builder/*`, `./components/atoms/*`, `./components/organisms/*`, `./components/templates/*`, `./atoms/*`, `./molecules/*`, `./organisms/*`, `./operations`, `./hooks/*`, `./utils/*`, `./data/*.json`, `./locales/*`, `./i18n.config`, `./shared/*`, `./types/*`, `./config/*`, `./lib/*`
- `@acme/platform-core` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`; subpaths include `./components/*`, `./contexts/*`, `./hooks/*`, `./repositories/*`, `./repositories/pages`, `./repositories/pages/schema.json`, `./router/*`, `./rental/*`, `./pricing`, `./tax`, `./*`
- `@acme/page-builder-core` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`
- `@acme/page-builder-ui` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`
- `@acme/auth` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`; subpaths include `./types`, `./types/*`, `./*`
- `@acme/config` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`; subpaths include `./env`, `./env/core`, `./env/auth`, `./env/cms`, `./env/email`, `./env/payments`, `./env/shipping`, `./env-schema`, `./jest.preset.cjs`, `./tsconfig.app.json`
- `@acme/types` — `.`: `types/import/default` → `./dist/index.d.ts` + `./dist/index.js`; subpaths include `./page`, `./page/*`, `./settings`, `./settings/*`, `./theme`, `./theme/*`, `./ds`, `./ds/*`, `./*`, `./package.json`

## Root Cause Analysis

**The conflict**: When a package is in `transpilePackages`, Next.js expects to:
1. Resolve the package via Node module resolution (using `exports`)
2. Transpile **whatever files resolve** (not necessarily TypeScript source — could be dist if exports point there)

But webpack aliases override step 1, pointing directly to `dist` or `src` folders, which:
- Bypasses the package's `exports` field (including conditional exports like `react-server`)
- Creates inconsistent resolution (some via alias, some via node_modules)
- Can bundle different versions of React if dist files have their own dependencies
- **Breaks RSC/client boundary detection** if conditional exports are bypassed

## Proposed Solution

### Strategy: Remove Redundant Aliases

Since packages *should* have proper `exports` fields pointing to `dist/`, we should:

1. **Remove webpack aliases for packages that have proper exports** — let Node resolution use `exports`
2. **Migrate shorthand imports OR add matching TS paths** (see decision needed below)
3. **Remove packages from transpilePackages** that don't need transpilation (already built)

> **DECISION (RESOLVED):** Shorthand aliases (`@i18n`, `@ui`, `@platform-core`, `@auth`, `@shared-utils`)
>
> **Option A (chosen):** Migrate all imports to `@acme/*` package names — this is the only approach that preserves conditional exports and RSC boundary detection.
>
> **Option B (rollback only):** Keep shorthand aliases with TS path mappings — this bypasses conditional exports and breaks RSC. Use only as a temporary escape hatch if Option A causes unforeseen issues.
>
> If Option A: Add codemod task to migrate imports before this plan executes.

### Implementation Steps

#### Step 1: Categorize Packages

> **BLOCKED:** This categorization is contingent on NEXT-CONFIG-00 audit. Do not proceed until exports are verified.

**Pre-built (use dist via exports, NOT transpilePackages) — VERIFIED (NEXT-CONFIG-00, 2026-01-20):**
- `@acme/i18n` — exports → dist + JSON locales
- `@acme/ui` — exports → dist + JSON assets
- `@acme/platform-core` — exports → dist + JSON schema
- `@acme/page-builder-core` — exports → dist
- `@acme/page-builder-ui` — exports → dist
- `@acme/auth` — exports → dist + JSON assets
- `@acme/types` — exports → dist
- `@acme/config` — exports → dist + env/jest/tsconfig subpaths

**Need transpilation (no dist, or app code):**
- `@acme/template-app` - the app itself

**Kept in transpilePackages (source transpilation needed):**
- `@acme/shared-utils` - simple utils without dist build; stays in `transpilePackages` so Next.js compiles from source via package `main` field

#### Step 2: Update index.mjs

```javascript
transpilePackages: [
  "@acme/template-app",
  "@acme/shared-utils",
],
```

#### Step 3: Update next.config.mjs

**Option A (Preferred): Remove shorthand aliases entirely**

After migrating imports to `@acme/*` names:

```javascript
config.resolve.alias = {
  ...config.resolve.alias,
  // App source shorthand (keep - this is app-specific)
  "@": path.resolve(__dirname, "../template-app/src"),

  // Theme fixtures (keep - external fixture path)
  "@themes-local": path.resolve(__dirname, "../themes"),

  // Disable drizzle-orm (intentional)
  "drizzle-orm": false,
};

// Keep node: prefix handling
for (const mod of ["assert", "buffer", ...]) {
  config.resolve.alias[`node:${mod}`] = mod;
}
```

**Option B (Rollback only): Keep shorthand aliases**

> **ROLLBACK ESCAPE HATCH ONLY** — Do not implement Option B as the primary approach. This option exists solely as a fallback if Option A causes unforeseen issues that require immediate reversion. Option B should be used temporarily while investigating the root cause, not as a permanent solution.

> **Critical Limitation:** Aliases pointing to `node_modules` bypass conditional exports. Packages with `react-server` or `browser` conditions will **not** resolve correctly, breaking RSC boundary detection. This is fundamentally incompatible with the App Router's server/client component model.

```javascript
// ROLLBACK CONFIG ONLY — do not use as primary implementation
config.resolve.alias = {
  ...config.resolve.alias,
  "@": path.resolve(__dirname, "../template-app/src"),

  // Shorthand aliases — these bypass conditional exports!
  "@i18n": path.resolve(__dirname, "../../node_modules/@acme/i18n"),
  "@ui": path.resolve(__dirname, "../../node_modules/@acme/ui"),
  "@platform-core": path.resolve(__dirname, "../../node_modules/@acme/platform-core"),
  "@auth": path.resolve(__dirname, "../../node_modules/@acme/auth"),
  "@shared-utils": path.resolve(__dirname, "../../node_modules/@acme/shared-utils"),

  "@themes-local": path.resolve(__dirname, "../themes"),
  "drizzle-orm": false,
};
```

#### Step 4: Ensure All Packages Are Built (Dev Workflow)

> **CRITICAL:** Without `transpilePackages`, changes to package source won't be picked up until `dist` is rebuilt. This affects dev experience.

**Production builds:** Add turbo dependency to ensure packages are built before template-app:

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]  // Ensures dependencies build first
    }
  }
}
```

**Local development:** Choose one:

| Option | Command | Pros | Cons |
|--------|---------|------|------|
| **turbo watch** | `turbo watch --filter=@acme/ui --filter=@acme/i18n ...` | Auto-rebuilds on change | Resource intensive |
| **tsc --watch per package** | Run in separate terminals | Lightweight | Manual setup |
| **tsup watch** | If packages use tsup | Fast, handles multiple formats | Requires tsup config |
| **Keep transpilePackages for dev** | Different config for dev/prod | No workflow change | Complexity |

**Recommended (Decision #3 chosen):** Use `turbo watch` with dependency filter in development:

```json
// package.json (root)
{
  "scripts": {
    "dev:packages": "turbo watch build --filter=@acme/template-app^...",
    "dev:template-app": "concurrently \"pnpm dev:packages\" \"pnpm --filter @acme/template-app dev\""
  }
}
```

> **Note:** The `--filter=@acme/template-app^...` syntax watches all dependencies of template-app automatically. This avoids hard-coding the package list and ensures new dependencies are included.

> **Note:** The `dev:template-app` script scopes both the package watcher and the Next.js dev server to the template-app context. This avoids ambiguity about which app is being run.

> **Note:** `concurrently` must be installed as a dev dependency. If not present:
> ```bash
> pnpm add -D concurrently -w
> ```
> Alternatively, use shell background processes: `pnpm dev:packages & pnpm --filter @acme/template-app dev`

#### Step 5: Update tsconfig.json Paths

The tsconfig paths must match webpack aliases — **including shorthand aliases if kept (Option B)**.

**Option A (after migrating imports):**

> **DECISION #4 (RESOLVED):** Use Option A.1 — remove `@acme/*` TS paths and let TypeScript resolve via `node_modules` `exports`.

**Option A.1 — No TS paths (let exports resolve):**

```json
{
  "paths": {
    "@/*": ["./src/*"]
    // No @acme/* paths — TypeScript uses node_modules resolution
  }
}
```

**Option A.2 — Explicit TS paths (rejected):**

> Not chosen. This permits deep imports and can diverge from runtime resolution.

**Option B (rollback only — if reverting to shorthand aliases):**

> **ROLLBACK ONLY** — Use this configuration only if Option A causes issues requiring temporary reversion.

```json
{
  "paths": {
    "@/*": ["./src/*"],
    // Shorthand aliases — MUST match webpack aliases
    "@i18n": ["../../packages/i18n/dist/index.d.ts"],
    "@i18n/*": ["../../packages/i18n/dist/*"],
    "@ui": ["../../packages/ui/dist/index.d.ts"],
    "@ui/*": ["../../packages/ui/dist/*"],
    "@platform-core": ["../../packages/platform-core/dist/index.d.ts"],
    "@platform-core/*": ["../../packages/platform-core/dist/*"],
    "@auth": ["../../packages/auth/dist/index.d.ts"],
    "@auth/*": ["../../packages/auth/dist/*"],
    "@shared-utils": ["../../packages/shared-utils/dist/index.d.ts"],
    "@shared-utils/*": ["../../packages/shared-utils/dist/*"],
    // Also keep @acme/* for any imports using full names
    "@acme/i18n": ["../../packages/i18n/dist/index.d.ts"],
    // ...
  }
}
```

> **Note:** Pointing TS paths to `dist` means types are only available after build. For better DX, consider pointing to `src` during development and `dist` in CI, or use TypeScript project references.

## Verification

**Required validation gate (per repo runbook):**

```bash
# Typecheck and lint (required)
pnpm typecheck && pnpm lint
```

> **Test audit (2026-01-19):** Searched for `*{build,config,next}*.test.{ts,tsx,js}` — no tests exist in `packages/next-config/` or `apps/template-app/` for build configuration. Matches found were in unrelated packages (shared-utils, platform-machine, email, etc.) or node_modules.

**Manual build verification:**

```bash
# Full build of template-app and dependencies
pnpm --filter @acme/template-app build

# Verify no "module has no exports" warnings in output
# Verify single React instance (no duplicate React warnings)
# Verify static generation completes without context errors
```

After changes, the build should:
1. Resolve `@acme/*` packages via their `exports` fields → `dist/`
2. Not show "module has no exports" warnings
3. Have a single React instance (from root node_modules)
4. Complete static generation without context errors
5. **Conditional exports work** — RSC components resolve `react-server` condition
6. **Dev workflow works** — changes to package source are reflected after rebuild

## Rollback Plan

If issues arise, we can:
1. Revert to the current config
2. Keep individual packages in transpilePackages as needed
3. Add specific aliases only where package exports are insufficient

## Files to Modify

**Required:**
1. `packages/next-config/index.mjs` — reduce transpilePackages (Step 2)
2. `packages/next-config/next.config.mjs` — remove shorthand aliases (Step 3, Option A)
3. `packages/template-app/tsconfig.json` — update or remove paths (Step 5, depends on Decision #4)
4. `turbo.json` — ensure `dependsOn: ["^build"]` for build task (Step 4)

**Required if using turbo watch dev workflow:**
5. `package.json` (root) — add `dev:packages` and `dev:template-app` scripts (Step 4)
6. `package.json` (root) — add `concurrently` as dev dependency: `pnpm add -D concurrently -w`

## Open Questions

1. Are there imports using `@acme/platform-core/components/pdp/ImageGallery` that need wildcard exports in platform-core?
2. Do any packages actually need source transpilation (contain JSX that's not pre-compiled)?
3. Conditional export audit (2026-01-19): **none found** in `packages/*/package.json` (`react-server` or `browser` conditions not present).

## Decisions Needed Before Implementation

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | Migrate shorthand imports or add TS paths? | **A chosen** — migrate to `@acme/*` (Option B is rollback-only) | Determines Step 3 and Step 5 |
| 2 | Which packages have conditional exports? | **None found** (audit 2026-01-19) | Confirms rollback risk is theoretical, not observed |
| 3 | Dev workflow for keeping dist current? | **turbo watch chosen** — `turbo watch build --filter=@acme/template-app^...` | Keeps dev in sync with template-app deps |
| 4 | Remove `@acme/*` TS paths entirely (Option A)? | **A.1 chosen** — remove paths, let exports resolve | Improves TS/runtime parity and prevents deep-import drift |

## Pre-Implementation Checklist

- [x] **NEXT-CONFIG-00:** Audit all package `exports` fields (especially `@acme/config`, `@acme/types`, `@acme/page-builder-ui`) — completed 2026-01-20
- [x] **NEXT-CONFIG-01:** Identify packages with conditional exports (`react-server`, `browser`) — none found in `packages/*/package.json` (2026-01-19)
- [x] **NEXT-CONFIG-02:** Decide on shorthand alias strategy — **Decision #1 set to Option A** (2026-01-19)
- [x] **NEXT-CONFIG-03:** Codemod to update shorthand imports to `@acme/*` (2026-01-19)
- [x] **NEXT-CONFIG-04:** Decide on TS paths strategy — **Decision #4 set to A.1 (remove paths)** (2026-01-19)
- [x] **NEXT-CONFIG-05:** Added `concurrently` dev dependency (2026-01-19)
- [ ] **NEXT-CONFIG-06:** Test with representative app build (not just typecheck)
