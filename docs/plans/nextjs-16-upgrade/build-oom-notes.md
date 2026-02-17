---
Type: Fact-Find-Artifact
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-17
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
