---
Type: Plan
Status: Historical
Domain: Build
Last-reviewed: 2026-01-19
Last-updated: 2026-02-09
Audit-Ref: daac6a9110
Relates-to charter: none
---

# Plan: Simplify Next.js Webpack Configuration

**Status:** Historical — archived

## Problem Statement

The template-app build fails with multiple issues:
1. "module has no exports" warnings when resolving internal packages
2. Conflicts between `transpilePackages` and webpack aliases pointing to different locations
3. Multiple React instance errors when using pre-built dist folders

The root cause is **over-engineered webpack configuration** that conflicts with Next.js's built-in module resolution.

## Known Issues with This Plan

> **Review notes:** Historical review findings are tracked below; current unresolved work is listed in "Active tasks".

| Severity | Issue | Status |
|----------|-------|--------|
| ~~**High**~~ | ~~Option A Step 5 still adds `@acme/*` TS paths which can permit deep imports and TS/runtime mismatches~~ | **RESOLVED** — Decision #4 updated (2026-02-09): remove shorthand aliases only; keep canonical `@acme/*` mappings per repo tsconfig guidance |
| **Medium** | Option B bypasses conditional exports and RSC boundary detection | **MITIGATED** — Option B demoted to rollback-only escape hatch |
| ~~**High**~~ | ~~Shorthand aliases kept but Step 5 only updates TS paths for `@acme/*`~~ | **RESOLVED** — Step 5 now shows both Option A and B paths |
| ~~**High**~~ | ~~Re-adding aliases into `node_modules` bypasses conditional exports~~ | **RESOLVED** — Option A removes shorthand aliases; Option B demoted to rollback-only |
| ~~**Medium**~~ | ~~"All packages have proper exports" claim is unverified~~ | **RESOLVED** — marked UNVERIFIED, gated on NEXT-CONFIG-00 |
| ~~**Medium**~~ | ~~No dev/watch strategy for keeping `dist` current~~ | **RESOLVED** — Step 4 now documents turbo watch + alternatives |
| ~~**Low**~~ | ~~Verification section omits validation gate~~ | **RESOLVED** — now includes `pnpm typecheck && pnpm lint` |
| ~~**Low**~~ | ~~Root cause incorrectly states "source TypeScript files"~~ | **RESOLVED** — corrected to "whatever files resolve"

## Current State Audit

### Webpack Aliases (next.config.mjs)

> **Fact-check (2026-02-09):** Most aliases from the original audit have already been removed. Only 4 workspace-related aliases remain. The table below reflects the current state.

| Alias | Points To | In transpilePackages? | Conflict? |
|-------|-----------|----------------------|-----------|
| `@` | template-app/src | N/A | No - legitimate app alias |
| `@acme/i18n` | i18n/dist | No | No - resolved via alias to dist |
| `drizzle-orm` | false (disabled) | No | No - intentional |
| `@themes-local` | ../themes | No | No - fixture path |

Aliases removed since original audit: `@i18n`, `@acme/types`, `@ui`, `@platform-core`, `@acme/config`, `@acme/date-utils`, `@acme/email`, `@acme/shared-utils`, `@auth`.

### transpilePackages (index.mjs)

> **Fact-check (2026-02-09):** The transpilePackages list has already been reduced from 9 entries to 2. The list below reflects the current state.

```javascript
transpilePackages: [
  "@acme/template-app",
  "@acme/lib",
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

> **DECISION (RESOLVED):** Shorthand aliases (`@i18n`, `@ui`, `@platform-core`, `@auth`)
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
- `@acme/lib` - utility library currently in transpilePackages

**~~Kept in transpilePackages (source transpilation needed):~~**
- ~~`@acme/shared-utils` - simple utils without dist build~~ — **Obsolete (2026-02-09):** `@acme/shared-utils` no longer has a `package.json` (deleted in `4d9325702e`). The directory contains only orphaned `dist/` output. Superseded by `@acme/lib`.

#### Step 2: Update index.mjs

> **Fact-check (2026-02-09):** This step is already done. The current transpilePackages is `["@acme/template-app", "@acme/lib"]`. `@acme/shared-utils` no longer exists as a package.

```javascript
// CURRENT STATE — already applied
transpilePackages: [
  "@acme/template-app",
  "@acme/lib",
],
```

#### Step 3: Update next.config.mjs

**Option A (Preferred): Remove shorthand aliases entirely**

> **Fact-check (2026-02-09):** This step is mostly done. The current config only has `@`, `@acme/i18n`, `drizzle-orm`, and `@themes-local`. The remaining `@acme/i18n` alias still points to `i18n/dist` and could be removed to let Node resolution handle it via exports.

After migrating imports to `@acme/*` names:

```javascript
// TARGET STATE — remove the remaining @acme/i18n alias
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
  // @shared-utils removed — package no longer exists

  "@themes-local": path.resolve(__dirname, "../themes"),
  "drizzle-orm": false,
};
```

#### Step 4: Ensure All Packages Are Built (Dev Workflow)

> **CRITICAL:** Without `transpilePackages`, changes to package source won't be picked up until `dist` is rebuilt. This affects dev experience.

**Production builds:** Ensure turbo dependency so packages are built before template-app:

> **Fact-check (2026-02-09):** Already configured. `turbo.json` already has `"dependsOn": ["^build"]` on the build task.

```json
// turbo.json — ALREADY IN PLACE
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

> **Note:** `concurrently` is already installed as a dev dependency (`^9.2.1`). The `dev:template-app` script is already present in root `package.json`.

#### Step 5: Update tsconfig.json Paths

> **Fact-check (2026-02-09):** This step is complete. Shorthand alias paths (`@ui/*`, `@i18n/*`, `@platform-core/*`, `@auth/*`, `@date-utils/*`) were removed from `packages/template-app/tsconfig.json`; canonical `@acme/*` mappings were retained.

> **Decision update (2026-02-09):** Do **not** remove canonical `@acme/*` workspace resolution. Repo guidance requires apps to resolve workspace packages through `src` + `dist` mappings (see `docs/tsconfig-paths.md`, `README.md`). This plan now targets shorthand cleanup only.

**Target state:**
- Keep app-local `@/*` alias with current compatibility fallbacks used by template-app
- Remove shorthand aliases: `@i18n/*`, `@platform-core/*`, `@ui/*`, `@auth/*`, `@date-utils/*`
- Keep canonical `@acme/*` mapping (src + dist)

```json
{
  "paths": {
    "@/*": [
      "./src/*",
      "../ui/dist/src/*",
      "../i18n/dist/*",
      "../ui/src/*",
      "./dist/*"
    ]
    // No shorthand package aliases.
  }
}
```

## Verification

**Required validation gate (per repo runbook):**

```bash
# Typecheck and lint (required)
pnpm typecheck && pnpm lint
```

> **Test audit (2026-01-19):** Searched for `*{build,config,next}*.test.{ts,tsx,js}` — no tests exist in `packages/next-config/` or `apps/template-app/` for build configuration. Matches found were in unrelated packages (platform-machine, email, etc.) or node_modules.

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

> **Fact-check (2026-02-09):** Updated to reflect current completion status.

**Already done:**
1. ~~`packages/next-config/index.mjs` — reduce transpilePackages (Step 2)~~ — Done (now `["@acme/template-app", "@acme/lib"]`)
2. ~~`packages/next-config/next.config.mjs` — remove shorthand aliases (Step 3, Option A)~~ — Mostly done (only `@acme/i18n` alias remains)
3. ~~`turbo.json` — ensure `dependsOn: ["^build"]` for build task (Step 4)~~ — Already configured
4. ~~`package.json` (root) — add `dev:packages` and `dev:template-app` scripts (Step 4)~~ — Already present
5. ~~`package.json` (root) — add `concurrently` as dev dependency~~ — Already installed (`^9.2.1`)

**Remaining:**
1. `packages/next-config/next.config.mjs` — investigate and remove `@acme/i18n` alias only after proving template-app and brikette builds pass without it (currently blocked by runtime regression; see Active tasks)

## Blast Radius: Brikette

> **Added 2026-02-09.** The shared `packages/next-config` is imported by brikette (`apps/brikette/next.config.mjs` line 5: `import sharedConfig from "@acme/next-config/next.config.mjs"`). Changes to the shared config affect both template-app and brikette.

| Remaining Task | Affects Brikette? | Detail |
|----------------|-------------------|--------|
| Migrate 7 shorthand imports in `template-app/src/` | No | **Done (2026-02-09)** |
| Remove `@acme/i18n` alias from `next.config.mjs` | **Yes** | **Blocked** — currently causes template-app build failure; requires follow-up investigation |
| Remove shorthand TS paths from `template-app/tsconfig.json` | No | **Done (2026-02-09)** |
| Test with app build (NEXT-CONFIG-06) | N/A | **Done (2026-02-09)** |

**Mitigation update (2026-02-09):** The expected safe removal did not hold in practice. Removing the alias caused template-app build failures; the alias has been restored pending root-cause analysis.

**Required:** NEXT-CONFIG-06 must build **both** apps:
```bash
pnpm --filter @acme/template-app build
pnpm --filter brikette build
```

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
| 4 | Remove shorthand TS paths while preserving canonical `@acme/*` mapping? | **Chosen** — remove shorthand only; keep canonical workspace mappings | Preserves TS/runtime parity without diverging from repo tsconfig guidance |

## Pre-Implementation Checklist

- [x] **NEXT-CONFIG-00:** Audit all package `exports` fields (especially `@acme/config`, `@acme/types`, `@acme/page-builder-ui`) — completed 2026-01-20
- [x] **NEXT-CONFIG-01:** Identify packages with conditional exports (`react-server`, `browser`) — none found in `packages/*/package.json` (2026-01-19)
- [x] **NEXT-CONFIG-02:** Decide on shorthand alias strategy — **Decision #1 set to Option A** (2026-01-19)
- [x] **NEXT-CONFIG-03:** Codemod to update shorthand imports to `@acme/*` — completed 2026-02-09 (migrated 7 imports across `packages/template-app/src/app/[lang]/success/page.tsx`, `packages/template-app/src/lib/requestContext.ts`, `packages/template-app/src/api/order-status/route.ts`, `packages/template-app/src/app/success/status/route.ts`)
- [x] **NEXT-CONFIG-04:** Decide on TS paths strategy — **Decision #4 updated:** remove shorthand only; keep canonical `@acme/*` mapping (2026-02-09)
- [x] **NEXT-CONFIG-05:** Added `concurrently` dev dependency (2026-01-19)
- [x] **NEXT-CONFIG-06:** Test with representative app build (not just typecheck) — completed 2026-02-09 (`pnpm --filter @acme/template-app build`, `pnpm --filter brikette build`)


## Active tasks

> **Updated 2026-02-09 (implementation):** NEXT-CONFIG-03 and Step 5 are complete. NEXT-CONFIG-06 validation is complete. One item remains.

1. **Step 3 (blocked):** Removing `@acme/i18n` alias from `packages/next-config/next.config.mjs` currently breaks template-app build with `Module not found: Can't resolve '@acme/i18n'` in `src/app/[lang]/layout.tsx` and `src/app/[lang]/checkout/layout.tsx`. Keep alias in place until root-cause is resolved.
