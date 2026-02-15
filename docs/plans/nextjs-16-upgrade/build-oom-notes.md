---
Type: Fact-Find-Artifact
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
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
- Confirm CMS mitigation approach (beyond heap):
  - try lower concurrency via Next config (`experimental.cpus: 1`) or build environment variables (if applicable)
  - identify large/accidental imports pulled into the build graph
- Once mitigation is chosen:
  - implement per-app script guard(s) (TASK-11 covers cover-me-pretty)
  - add a CI guardrail check to prevent regression (e.g., ensure `NODE_OPTIONS` is present for the known-OOM apps’ build steps)
