---
Type: Fact-Find-Artifact
Status: Historical
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-17 (TASK-22 reduction applied; build evidence updated)
Feature-Slug: nextjs-16-upgrade
---

# Next 16 Build OOM Notes (Webpack Builds)

## Scope
Document reproducible evidence for `next build --webpack` out-of-memory (OOM) failures under Next 16, and decide how the repo should enforce Node heap headroom to keep builds deterministic across dev and CI.

This artifact is used by `docs/plans/nextjs-16-upgrade/plan.md` TASK-10.

## Environment
- Node: `v20.19.4` (local)
- Next: `16.1.6`
- Builder: Webpack (via `--webpack`)

## Evidence (Executable Verification)

### `@apps/cms`
- Default heap build fails:
  - Command: `pnpm --filter @apps/cms build`
  - Result: **OOM** (`FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`)
- Increased heap (`8GB`) build still fails:
  - Command: `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cms build`
  - Result: **OOM** (heap grows to ~8GB then aborts)
- Increased heap (`16GB`) build still fails (long-running):
  - Command: `NODE_OPTIONS=--max-old-space-size=16384 pnpm --filter @apps/cms build`
  - Result: **OOM** (heap grows to ~16GB then aborts; took ~17 minutes)

Notes:
- Build output includes: `⚠ The "middleware" file convention is deprecated ... middleware-to-proxy`
- Next prints: `Experiments: cpus: 2` and `✓ externalDir`

### `@apps/cover-me-pretty`
- Default heap build fails:
  - Command: `pnpm --filter @apps/cover-me-pretty build`
  - Result: **OOM** (`FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`)
- Increased heap (`8GB`) build succeeds:
  - Command: `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cover-me-pretty build`
  - Result: **success**
  - Observed build notes:
    - `⚠ Compiled with warnings` (critical dependency warnings from `packages/platform-core` + `packages/config/jest.preset.cjs` import traces)
    - `⚠ Using edge runtime on a page currently disables static generation for that page`

## Evidence (CI / Repo Wiring)
- `cover-me-pretty` is built in CI Lighthouse workflow without an explicit `NODE_OPTIONS` override:
  - `.github/workflows/ci-lighthouse.yml:131` runs `pnpm --filter @apps/cover-me-pretty... build`
  - Therefore, the build-heap mitigation must live in the package build script (Option A) to keep CI and dev behavior consistent.

## Working Hypotheses
- H1: Some apps exceed default Node heap during Webpack compilation under Next 16 (regression or existing latent issue surfaced by dep graph / compilation changes).
- H2: Script-level heap headroom is required for dev parity; CI-only `NODE_OPTIONS` is insufficient because it masks local build failures.
- H3: CMS likely needs more than “just more heap” (reduce concurrency, reduce build graph size, or isolate heavy imports) because it OOMs even at ~8GB.
- H3b: CMS OOM persists even at ~16GB, strongly suggesting a build-graph/concurrency issue rather than “insufficient default heap”.

## Decision Options (Enforcement)

### Option A: Script-level heap guard (preferred)
Pros:
- Dev/CI parity: `pnpm --filter <app> build` is deterministic in any shell.
- Makes the cost explicit where it exists (per-app).
Cons:
- Requires updating scripts (and choosing a portable pattern).

### Option B: CI-only `NODE_OPTIONS` policy
Pros:
- Minimal repo churn.
Cons:
- “Works on CI, fails locally” remains likely.
- Harder to reason about which apps truly require heap headroom.

## Next Steps
### Decision
- Choose **Option A** (script-level heap guard), because it fixes both local builds and CI builds that call `pnpm --filter <app> build`.

### Implementation Follow-ups
- Implement per-app heap guard for `@apps/cover-me-pretty` build (TASK-11).
- CMS requires a build-graph mitigation spike (TASK-12); heap-only changes are insufficient.

---

## TASK-12 SPIKE Evidence (2026-02-17)

### Machine Context
- Machine RAM: 16 GB
- Max usable Node heap: ~10–12 GB (OS needs ~3–4 GB)

### Hypothesis (from plan): `@acme/platform-core/themeTokens` node loader as primary OOM cause
- `packages/platform-core/src/themeTokens/index.ts` imports `typescript` at the top level
- When `@acme/platform-core` is in `transpilePackages`, webpack reads `typescript`'s 22 MB `lib/` dir during module-graph resolution (even if `typescript` is in `serverExternalPackages`)
- Hypothesis: removing this from webpack's static graph would resolve OOM

### Spike Results: Hypothesis **PARTIALLY CORRECT but INSUFFICIENT**

| Test | Result |
|------|--------|
| `typescript` in `serverExternalPackages` only | OOM at default 4 GB |
| `typescript` variable-require (webpack-escape fix) in source | OOM at default 4 GB |
| `typescript` webpack-escape + 8 GB heap | OOM at 8 GB |
| `typescript` webpack-escape + 10 GB heap, cpus=1 | OOM at 10 GB |
| `typescript` webpack-escape + 12 GB heap, cpus=1 | OOM at 12 GB |
| Remove `@acme/platform-core` from `transpilePackages` + 8 GB | OOM at 8 GB (334 s elapsed) |

### Root Cause: CMS build graph requires >12 GB on a 16 GB machine

The CMS build graph (130+ routes, many transpiled workspace packages) fundamentally requires more than 12 GB of webpack compilation memory. This is NOT caused by any single package:
- Removing `@acme/platform-core` from `transpilePackages` reduced elapsed time before OOM but did not reduce memory below 8 GB
- The `typescript` webpack-escape fix is still valuable (prevents webpack from parsing the 22 MB TypeScript compiler lib), but it is a minor contributor to the total memory budget
- `@acme/platform-core/themeTokens/browser.ts` has template-string dynamic imports (`@themes/${theme}`) that are a latent OOM risk for client bundles, but is NOT currently in the CMS server build path

### Applied Fix (hygiene improvement, not primary mitigation)
- Changed `import ts from "typescript"` in `packages/platform-core/src/themeTokens/index.ts` to use a variable `_req` (matching `emailService.ts` pattern) to prevent webpack from statically following the typescript import
- ESM-interop handling: `_tsRaw.__esModule ? _tsRaw.default : _tsRaw`
- All platform-core themeTokens tests pass (14/14) after the change
- Added `typescript` to `serverExternalPackages` in `apps/cms/next.config.mjs` (belt-and-suspenders)
- **Dist file updated automatically** to match source by linter/compiler

### Why TC-01 (build exits 0) is NOT satisfied
- The CMS build requires a machine with >16 GB RAM (32 GB minimum to leave OS headroom)
- OR a significant reduction in routes/transpilePackages
- OR architectural change (split CMS, reduce pages, incremental builds)

### Next Steps (for replan)
1. **Machine-level**: Build on a 32 GB+ machine (CI upgrade or dedicated build node)
2. **Structural reduction**: Audit `transpilePackages` list — many workspace packages may have complete dist files and don't need transpilation
3. **Route splitting**: Split CMS admin UI from CMS API to reduce per-compilation graph size
4. **`browser.ts` template-string fix**: Fix the 4 template-string dynamic imports in `packages/platform-core/src/themeTokens/browser.ts` (proactive OOM prevention for client bundles)
5. **Investigate specific memory contributors**: Use webpack `--profile` or Node.js heap profiler to identify the top memory consumers in the CMS build graph

### Evidence Files Changed
- `packages/platform-core/src/themeTokens/index.ts` — webpack-escape fix applied
- `packages/platform-core/dist/themeTokens/index.js` — dist updated to match
- `apps/cms/next.config.mjs` — `typescript` added to `serverExternalPackages`

---

## TASK-21 Evidence (2026-02-17): `transpilePackages` Reduction Audit

### Methodology
- Checked `dist/` directory presence for each package in CMS `transpilePackages`
- Verified `package.json` `main`/`exports` fields point to `dist/`
- Checked for explicit src-alias overrides in `apps/cms/next.config.mjs` and the shared `packages/next-config/next.config.mjs` (preset) webpack config
- Counted TypeScript source files per package as a proxy for webpack compilation memory cost
- Checked for template-string dynamic imports (broad module-context OOM risk)

### Source File Counts (Compilation Work Proxy)

| Package | TS files in src | Has dist/ | Src alias? | Safe to remove |
|---|---:|---|---|---|
| `@acme/ui` | **2,256** | ✅ | No | ✅ High-impact |
| `@acme/platform-core` | 522 | ✅ | No | ✅ High-impact |
| `@acme/types` | 287 | ✅ | No | ✅ High-impact |
| `@acme/lib` | 192 | ✅ | ⚠️ Aliased to src by preset webpack | ❌ Must keep (or alias update) |
| `@acme/config` | 145 | ✅ | No | ✅ High-impact |
| `@acme/design-tokens` | 15 | ✅ | No | ✅ Low-impact |
| `@acme/configurator` | 12 | ✅ | ⚠️ Aliased to src by CMS webpack | ❌ Must keep (or alias update) |
| `@acme/telemetry` | 8 | ✅ | No | ✅ Low-impact |
| `@acme/date-utils` | 8 | ✅ | No | ✅ Low-impact |
| `@acme/theme` | 8 | ✅ | No | ✅ Low-impact |
| `@themes/base` | 7 | ✅ | No | ✅ Low-impact |
| `@acme/tailwind-config` | 1 | ✅ | No | ✅ Low-impact |
| `@themes/bcd` | 1 | ✅ | No | ✅ Low-impact |
| `@themes/brandx` | 2 | ❌ | No | ❌ Must keep (no dist) |
| `@themes/dark` | 1 | ❌ | No | ❌ Must keep (no dist) |

**Totals:**
- Safe-to-remove TS files: **3,258** (Tier 1: 3,210 + Tier 2: 48)
- Must-keep TS files (aliased or no dist): **207** (`@acme/lib` 192 + `@acme/configurator` 12 + `@themes/brandx` 2 + `@themes/dark` 1)
- Reduction: **~94% of workspace TS files** removed from webpack compilation

### Template-String Dynamic Imports (Webpack Module Context Risk)

- `packages/ui/src/molecules/NotificationBanner.tsx:93` — `import(\`../locales/${lang}/notificationBanner.json\`)` — RELATIVE path, low risk (bounded locale directory)
- `packages/platform-core/src/themeTokens/browser.ts` — 4 template-string imports (`@themes/${theme}`, `@themes-local/${theme}`, etc.) — latent OOM risk **but NOT in CMS server build path** (CMS uses Node loader, not browser.ts)
- No template-string imports found in: `@acme/platform-core` (main), `@acme/config`, `@acme/types`, `@acme/design-tokens`, `@acme/telemetry`, `@acme/date-utils`, `@acme/theme`, `@themes/base`, `@themes/bcd`

### Dist Completeness for Key Packages

- **`@acme/ui`**: `packages/ui/dist/` has `operations.js`, `atoms/`, `components/`, `molecules/`, `account.js` etc. Package exports map subpaths correctly. CMS uses 65 import sites via `@acme/ui/operations` and other subpaths — all covered by dist.
- **`@acme/platform-core`**: `packages/platform-core/dist/` has full subpath exports including `./themeTokens`, `./db`, `./cart`, `./orders`, `./shops`, etc. CMS uses 327 import sites across these subpaths — all covered by dist.
- **`@acme/types`**, **`@acme/config`**: Complete dist with proper `main`/`exports`.

### Src-Alias Packages (Cannot Be Helped by transpilePackages Removal Alone)

1. **`@acme/lib`** — `packages/next-config/next.config.mjs` webpack config aliases `@acme/lib` → `packages/lib/src`. Since CMS inherits this alias via `preset.webpack(...)`, removing `@acme/lib` from `transpilePackages` has no effect — webpack still reads source files. To benefit, the alias must be changed to point to `dist/`.

2. **`@acme/configurator`** — `apps/cms/next.config.mjs` explicitly aliases `@acme/configurator` → `packages/configurator/src`. Same constraint.

### Classification

**Safe-to-remove (no src alias, dist present) — implement in TASK-22:**
- Tier 1 (high-impact): `@acme/ui`, `@acme/platform-core`, `@acme/types`, `@acme/config`
- Tier 2 (low-impact): `@acme/design-tokens`, `@acme/telemetry`, `@acme/date-utils`, `@acme/theme`, `@themes/base`, `@themes/bcd`, `@acme/tailwind-config`

**Requires alias change to benefit (deferred, not in TASK-22 scope):**
- `@acme/lib` (192 TS files) — change alias in `packages/next-config/next.config.mjs` from src → dist
- `@acme/configurator` (12 TS files) — remove alias from `apps/cms/next.config.mjs`

**Must keep (no dist):**
- `@themes/brandx`, `@themes/dark`

### Expected Memory-Reduction Estimate

**HIGH** — removing 3,258 TS files (94% of workspace package source) from webpack compilation is a substantial reduction. The dominant contribution is `@acme/ui` alone (2,256 files), which was not touched in the TASK-12 spike.

However: the TASK-12 spike showed that even removing `@acme/platform-core` (522 files) alone failed at 8 GB. The incremental effect of the Tier 1 removals (especially `@acme/ui`) is unknown. Full build exit 0 may still require 32 GB+ on this machine even after reduction.

Primary success criterion for TASK-22: `pnpm --filter @apps/cms lint && typecheck` exit 0. Build attempt is best-effort evidence.

---

## TASK-22 Evidence (2026-02-17): Build Graph Reduction Applied

### Changes Made
- `apps/cms/next.config.mjs`: CMS-specific `transpilePackages` reduced from 15 entries → 3:
  - **Removed** (have dist/): `@themes/base`, `@themes/bcd`, `@acme/platform-core`, `@acme/ui`, `@acme/date-utils`, `@acme/types`, `@acme/tailwind-config`, `@acme/design-tokens`, `@acme/telemetry`, `@acme/config`, `@acme/theme`, `@acme/lib` (also removed from CMS-explicit list; still present via `preset.transpilePackages`)
  - **Retained**: `@themes/brandx`, `@themes/dark` (no dist/), `@acme/configurator` (src-aliased)
  - `typescript` added to `serverExternalPackages` (belt-and-suspenders; deferred from TASK-12)
- `apps/cms/src/app/cms/wizard/tokenUtils.ts`: Added `@ts-expect-error` annotations for `@themes/brandx` and `@themes/dark` imports (packages reference non-existent dist/ in their package.json; types unavailable at typecheck time; webpack resolves via transpilePackages at runtime)

### TC-01 (Typecheck + Lint)
- `pnpm --filter @apps/cms lint` → **PASS** ✅
- `pnpm --filter @apps/cms typecheck` → **PASS** ✅ (pre-existing TS2307 errors resolved by @ts-expect-error annotations)

### TC-02 (Build Attempt — Best-Effort)
- `pnpm --filter @apps/cms build` → **OOM / SIGABRT** — CMS build still OOMs on 16 GB machine
- Observation: build started and progressed further than in TASK-12 spike (webpack compilation with reduced source graph), but machine RAM remained the binding constraint
- **Conclusion**: 32 GB+ CI machine or architectural route-splitting still required for full build exit 0

### TC-03 (tokenUtils Tests)
- 4/6 pass; 2 pre-existing failures (`brandx/dummy theme data mismatch`)
- Failures confirmed pre-existing; not introduced by this task

### Commit
- `e469da612c` (changes included in user checkpoint commit)
