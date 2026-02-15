---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: nextjs-16-upgrade
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Related-Plan: docs/plans/nextjs-16-upgrade/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Next.js 16 Upgrade Audit Fact-Find (Release Notes Alignment)

## Scope
### Summary
Audit the current `dev` branch (local HEAD `e7ee234ab1`, 2026-02-15) against the official Next.js 16 release notes to identify:
- remaining breaking-risk issues
- remaining deprecated usage
- pragmatic opportunities to get more value from the upgrade

This is FACT-FIND ONLY: no migrations are applied in this brief.

### Goals
- Confirm Next 16 upgrade prerequisites are enforced (Node, TypeScript, React, lint toolchain)
- Identify any remaining Next 16 breaking-surface work (async request APIs, removed/renamed config)
- Identify and scope deprecation cleanup work (middleware -> proxy, config renames)
- Seed follow-up tasks that reduce regression risk and improve upgrade ROI

### Non-goals
- Implement fixes (that belongs in `/lp-build` tasks)
- Turbopack migration of custom webpack apps
- Middleware -> `proxy.ts` migration where Edge runtime is required

### Constraints & Assumptions
- Constraints:
  - This repo intentionally forces Webpack via CLI `--webpack` to preserve existing custom webpack behavior.
  - Some apps require Edge middleware behavior (rewrites/auth headers), so `proxy.ts` (Node-only per Next 16) is not universally viable.
- Assumptions:
  - CI and local dev use Node >=20.9.0 (verified via `.nvmrc` + GitHub Actions pin).

## Evidence Audit (Current State)
### Entry Points
- Root versions and constraints: `package.json`, `.nvmrc`, `.github/workflows/test.yml`
- Next app scripts (webpack opt-out enforcement): `apps/*/package.json`
- CI workflows that bypass app scripts: `.github/workflows/*.yml`
- Next shared config: `packages/next-config/index.mjs`, `packages/next-config/next.config.mjs`
- Middleware surface area: `apps/*/middleware.ts`, `apps/*/src/middleware.ts`
- Async Request API surface area: `apps/**/src/app/**` (pages + route handlers + layouts + metadata/image routes)

### Key Modules / Files
- Version pins:
  - `package.json` (Next 16.1.6, React 19.2.1, TypeScript 5.8.3, ESLint ^9.30.1, eslint-config-next 16.1.6, next-auth 4.24.12, next-intl ^4.8.2)
  - `.nvmrc` (20.19.4)
  - `.github/workflows/test.yml` (node-version: 20.19.4)
- Webpack enforcement:
  - `apps/*/package.json` scripts all use `next build --webpack` and `next dev --webpack`.
  - Exception risk: CI can still invoke `pnpm exec next build` directly (bypassing scripts), which would default to Turbopack on Next 16 unless `--webpack` is passed.
- Image config (Next 16 defaults audit hooks):
  - `packages/next-config/index.mjs` sets `images.qualities: [75, 80, 85, 90]` and sets `images.unoptimized` for static export builds.
- Middleware locations (Next 16 deprecation applies):
  - `apps/brikette/src/middleware.ts`
  - `apps/business-os/src/middleware.ts`
  - `apps/cms/src/middleware.ts`
  - `apps/cms/middleware.ts` (NOTE: duplicate location with `src/middleware.ts`)
  - `apps/xa/middleware.ts`
  - `apps/xa-b/middleware.ts`
  - `apps/xa-j/middleware.ts`
  - `apps/cover-me-pretty/middleware.ts`

### Patterns & Conventions Observed
- Next 16 prereqs are aligned:
  - Node engines are tightened and dev/CI pins exist (`package.json`, `.nvmrc`, `.github/workflows/test.yml`).
  - TypeScript is above Next's minimum requirement (`package.json`).
  - React/ReactDOM and TS types are aligned with React 19 (`package.json`).
- ESLint 9 + flat config is present:
  - `eslint.config.mjs` exists at repo root; ESLint is `^9.x` (`package.json`).
- Webpack safety net is applied consistently:
  - All Next apps' `build`/`dev` scripts include `--webpack` (`apps/*/package.json`).
- Async request APIs are broadly migrated:
  - Many `params: Promise<...>` call sites exist across apps.
  - `cookies()`, `headers()`, `draftMode()` are used as `await cookies()` / `await headers()` / `await draftMode()` in key packages.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js 16 removes transitional compatibility for async request APIs and removes a set of options/configs that can hard-break builds.
- Downstream dependents:
  - 14+ apps in `apps/` plus shared packages (`packages/auth`, `packages/ui`, `packages/template-app`) are affected by Dynamic API changes.
- Likely blast radius:
  - Middleware + runtime boundaries (Edge vs Node) remain the riskiest area due to deprecations and runtime constraints.

### Test Landscape
- CI explicitly runs `lint` + `typecheck` per workspace:
  - `.github/workflows/test.yml` runs `pnpm --filter <workspace> lint` and `pnpm --filter <workspace> typecheck`.
- Known gaps to validate (not executed in this fact-find run):
  - Jest haste-map collisions due to duplicate `__mocks__` across apps (previously observed; verify in follow-up).
  - Fresh clone test runner robustness if any scripts are executed directly (executable bit vs `bash script.sh`).

## External Research (Next.js 16 Release Notes)
Source: `https://nextjs.org/blog/next-16`

Key items called out in the release notes that map to repo risk:
- **Turbopack default:** Next 16 uses Turbopack by default for `next dev` and `next build`; `--webpack` is the supported opt-out.
- **Async Request APIs enforcement:** Next 15 introduced async request APIs with transitional compatibility; Next 16 removes synchronous access.
- **Next lint removed:** `next lint` removed and `next build` no longer runs lint.
- **Middleware convention deprecated:** `middleware.ts` deprecated in favor of `proxy.ts` (Node-only).
- **Config removals/renames:** e.g. `experimental.dynamicIO` -> `cacheComponents`, PPR config removals, turbopack config move.
- **Caching API deprecation:** `revalidateTag` signature changes/deprecations.
- **Next/Image behavior/default changes:** defaults like `images.minimumCacheTTL`, `images.imageSizes`, `images.qualities`, local IP optimization restriction, maximum redirects.
- **Build output layout:** `next dev` outputs to `.next/dev`, enabling concurrent `next dev` and `next build` and adding lockfile behavior.
- **Navigation scroll behavior override:** Next 16 no longer overrides your global `scroll-behavior` during SPA transitions by default; opt back into the prior behavior via `data-scroll-behavior="smooth"` on the `<html>` element (typically in `app/layout.tsx`).

## Findings

### 1) Avoid Breaking Issues (Remaining Work)

1) Residual sync `params` types in route handlers on `dev` branch (hard-break risk)
- On `dev` as of `e7ee234ab1`:
  - `apps/cms/src/app/api/auth/[...nextauth]/route.ts` uses `ctx: { params: { nextauth: string[] } }` and forwards to `handler(req, ctx)`.
  - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` types context as `{ params: { id: string } }`.
- In the current working tree (uncommitted), both files are already updated to async params (`params: Promise<...>` + `await params`).

Why it matters:
- Next 16 removes synchronous access for route context params; mismatched handler signatures can fail build/typegen even if params are unused.

Quantification note:
- Simple greps for `params: {` are noisy in this repo because many helpers use a `params` key in payloads or function args (for example `apps/cover-me-pretty/src/app/api/analytics/tryon/route.ts`), and CT tests mount router params.
- For route handlers, prefer auditing `apps/**/src/app/api/**/route.ts` signatures directly.

2) CI workflow bypasses `--webpack` on Next 16 (hard-break / flake risk)
- `.github/workflows/brikette.yml` runs `pnpm exec next build` (no `--webpack`) as part of the static export build command.

Why it matters:
- Next 16 defaults `next build` to Turbopack unless opted out.
- This can diverge from local/app-script builds (which use `--webpack`) and can introduce CI-only failures or different output.

3) CMS has two middleware entrypoints (routing ambiguity risk)
- Both `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` exist.

Why it matters:
- Next supports middleware under app root or `src/`, but having both is ambiguous and can cause build-time errors or "wrong middleware runs" behavior.

4) Middleware runtime incompatibility risk (Edge vs Node)
- Node-only imports exist in middleware entrypoints:
  - `apps/cover-me-pretty/middleware.ts` imports `node:crypto`.
  - `apps/cms/middleware.ts` imports `crypto` and `helmet`.
  - `apps/cms/src/middleware.ts` imports `helmet` (and Node `http` types), which is not Edge-compatible.

Why it matters:
- Next 16's preferred replacement (`proxy.ts`) is Node-only.
- If the app needs Edge interception, it must remain middleware (for now) and must not depend on Node-only modules.
- For Cloudflare/OpenNext apps (`apps/brikette`, `apps/business-os`, `apps/xa`, `apps/cms`), `proxy.ts` may not be viable at all because the deployment runtime is Worker/Edge, not a full Node.js server.

5) Build output directory changes: `.next/dev` (tooling/CI flake risk)
- Next 16 changes dev output to `.next/dev` and adds lockfile behavior for concurrent dev/build.

Repo evidence:
- No explicit references to `.next/dev` or `.next/trace` were found in tracked code.
- There are multiple references to `.next/**`:
  - `scripts/validate-changes.sh` ignores `apps/*/.next/` when resolving related tests (this should still work under `.next/dev` because it remains under `.next/`).
  - `apps/brikette/scripts/perf/analyze-chunks.mjs` expects `.next/static/chunks` (build output; not dev output).
  - Many `tsconfig.json` files include `.next/types/**/*.ts` (expected).

6) Scroll behavior change is currently unmanaged (behavior drift risk)
- Next 16 no longer overrides global `scroll-behavior` during SPA transitions by default; opt back into the prior override behavior via `data-scroll-behavior="smooth"` on the `<html>` element.

Repo evidence:
- No `data-scroll-behavior` attribute is present in app roots (0 matches).
- Brikette sets `scroll-behavior: smooth` in `apps/brikette/src/styles/global.css`.

Actionable implication:
- Decide per-app whether "smooth scroll on navigation" is desired, and implement it explicitly (HTML attribute) rather than relying on implicit framework behavior.

### 2) Move Away From Deprecated/Removed Elements

Already clean / no evidence of removed usage (repo-wide grep on tracked sources):
- No `next lint` usage in scripts/CI (lint runs via `pnpm <pkg> lint`).
- No AMP usage (`useAmp` / `amp: true`).
- No `devIndicators` options.
- No Next runtime config usage (`next/config`, `publicRuntimeConfig`, `serverRuntimeConfig`).
- No `images.domains` or `next/legacy/image` usage.
- No `unstable_rootParams()` usage.
- No metadata image route entrypoints were found (`opengraph-image.*`, `twitter-image.*`, `icon.*`, `apple-icon.*` not present), so the "metadata image route params async" change is currently a non-issue.
- No `revalidateTag(` usage found.

Remaining deprecation surface:
- Middleware filename convention deprecation: multiple apps still use `middleware.ts` (expected).

### 3) Make The Most Of The Upgrade (Opportunities)

1) Turbopack build/dev adoption (selective, after stability)
- Current state forces Webpack everywhere (`--webpack`).
- A contained pilot could target the simplest app with minimal custom webpack to evaluate build/dev gains and compatibility (especially OpenNext/Cloudflare apps).

2) React Compiler pilot (only where it is safe)
- Next 16 is aligned to the React 19 ecosystem; after stability, pilot React Compiler in one contained app/package with perf + regression checks.

3) Operational policy: runtime classification + warning control
- Replace "warnings allowed?" with explicit runtime classification:
  - If an app requires Edge interception, it remains middleware (for now) and must not import Node-only modules.
  - If an app can run interception on Node, migrate to `proxy.ts` and eliminate middleware usage.
- Treat middleware deprecation warnings as acceptable only for explicitly "Edge-required" apps; fail CI on any new/unclassified warning class.

## Questions
### Resolved
- Q: Are Next 16 prerequisites enforced (Node/TS/React/tooling)?
  - A: Yes, based on repo pins.
  - Evidence:
    - Node: `.nvmrc`, `.github/workflows/test.yml`, `package.json` engines.
    - TypeScript: `package.json` (TypeScript 5.8.3).
    - React: `package.json` (React/ReactDOM 19.2.1 + types).
    - ESLint: `eslint.config.mjs`, `package.json` (ESLint ^9).

### Open (User Input Needed)
- Q: For each app with request interception, do we classify it as "Edge-required" or "Node-OK"?
  - Why it matters: it determines middleware vs proxy and how strict we should be about Node-only imports in middleware.
  - Decision impacted: runtime correctness, deprecation strategy, and CI warning policy.
  - Default assumption + risk: classify Edge-required by default where middleware already exists; risk is preserving Node-only middleware that will fail at runtime.

## Confidence Inputs (for /lp-plan)
- **Implementation:** 85%
  - Concrete remaining work items are file-specific; repo already uses the required Webpack opt-out strategy.
- **Approach:** 82%
  - Middleware/proxy direction is constrained by Edge runtime needs; needs an explicit per-app runtime classification to avoid accidental Node-only imports.
- **Impact:** 80%
  - Most removals/renames show no repo usage, but middleware and residual route signatures can still break builds.
- **Delivery-Readiness:** 85%
  - CI runs lint/typecheck per workspace; scripts are already aligned away from `next lint`.
- **Testability:** 75%
  - Some known test infra hazards exist (jest collisions, script exec bits) and should be stabilized.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|------------|--------|----------------------------|
| Residual sync `params` handler signatures cause typegen/build failures | Medium | High | Sweep and convert remaining route handler signatures to `params: Promise<...>` + `await params`; add grep-based gate. |
| Duplicate CMS middleware entrypoints cause ambiguity | Medium | High | Consolidate to a single middleware entrypoint; verify which one Next is using today. |
| Node-only imports in Edge middleware break at runtime | Medium | High | Per-app runtime classification; remove Node-only deps from Edge middleware (Web Crypto / move logic to Node routes) or migrate to `proxy.ts` where Node is acceptable. |
| Image optimization default changes cause caching/quality regressions | Low/Medium | Medium | Confirm shared `images.qualities` (done) and decide whether to pin `minimumCacheTTL`/`imageSizes` where needed; add a visual smoke test for image-heavy pages. |
| Tooling assumes `.next` layout that changed in Next 16 | Low/Medium | Medium | Validate any scripts that read `.next/*` against `.next/dev` behavior; update paths or make them resilient. |
| Middleware deprecation warning policy is unclear | High | Medium | Tie warnings allowlist to the runtime classification inventory; fail on unknown warnings. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep `--webpack` for build/dev until Turbopack migration is explicitly planned and tested.
  - Prefer codemods + repo-wide greps to discover edge cases (metadata routes, helper wrappers) instead of app-by-app manual hunting.

## Suggested Task Seeds (Non-binding)
- TASK-A: Repo-wide async request API "residuals" sweep
  - (Optional) Use official codemods as discovery/validation helpers (not executed in this fact-find):
    - `npx @next/codemod@latest next-async-request-api .`
    - `npx @next/codemod@latest next-lint-to-eslint-cli .`
    - `npx @next/codemod@canary upgrade latest` (multi-change upgrade codemod)
  - Convert remaining route handler signatures still using sync `{ params: { ... } }`.
  - Fix known files:
    - `apps/cms/src/app/api/auth/[...nextauth]/route.ts`
    - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts`
- TASK-B: Middleware inventory + runtime classification
  - Inventory all middleware files; decide "Edge-required" vs "Node-OK" per app.
  - Separate workstreams:
    - Routing ambiguity cleanup (CMS duplicate middleware locations)
    - Runtime compatibility cleanup (remove Node-only imports where Edge-required)
- TASK-C: Next 16 operational behavior checks
  - Confirm no tooling depends on old `.next` dev layout; add a small CI smoke check if needed.
  - Decide and implement scroll behavior intent per app (`data-scroll-behavior` vs CSS only).
- TASK-E: CI/Workflow build invocation consistency
  - Ensure no workflow runs `next build` without `--webpack` (example: `.github/workflows/brikette.yml`).
  - Validate whether `opennextjs-cloudflare build` is already enforcing Webpack on Next 16; if not, document the supported knob (env/config) and apply consistently across CF apps.
- TASK-D (Optional): Turbopack pilot
  - Select one low-customization app and evaluate dropping `--webpack`.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-build`
- Deliverable acceptance package:
  - Targeted builds for affected apps + `lint`/`typecheck` gates
  - Runtime classification inventory + warning policy tied to it

## How This Audit Was Performed (Appendix)
Tracked-file scans (to avoid local uncommitted WIP skew):
- Versions/prereqs: `git show HEAD:package.json | rg ...`, `.nvmrc`, `.github/workflows/*.yml`
- Webpack opt-out: `git grep -n "next build" apps/*/package.json` and `git grep -n "next dev" apps/*/package.json`
- Middleware inventory: `find apps -maxdepth 3 -name middleware.ts` plus content spot checks.
- Async params residuals: `rg -n "params\s*:\s*\{" apps/**/src/app` excluding tests/CT.
- Removed/deprecated checks:
  - `git grep -nE "\bnext lint\b|\buseAmp\b|\bamp\s*:\s*true\b|\bdevIndicators\b|\bpublicRuntimeConfig\b|\bserverRuntimeConfig\b|next/legacy/image|images\.domains" .`
  - `rg -n "revalidateTag\(" apps packages`.
  - `rg -n "unstable_rootParams\(" apps packages`.
  - Next config drift checks: `git grep -nE "experimental\.dynamicIO|cacheComponents|experimental\.ppr|experimental_ppr|experimental\.turbopack|\bturbopack\s*:\s*\{" -- apps/**/next.config.* packages/**/next.config.*` (0 matches).
- Image behavior checks:
  - Counted `next/image` imports (94) and quality props (6).
  - Searched for JSX `src="/...?..."` patterns in `apps/` + `packages/` (0 matches).
  - Verified `images.qualities` is configured in `packages/next-config/index.mjs`.
- `.next/dev` layout/tooling checks:
  - `rg -n "\.next/dev|\.next/trace" .github scripts apps packages` (0 matches).
- Parallel routes:
  - `find apps (...) -prune -o -type d -name "@*" -print` with `node_modules`, `.next`, and `.open-next` pruned (no results).

Important note on grep hygiene:
- The repo contains generated lint report artifacts like `apps/cms.eslint.json` that embed source code strings.
- All code-scanning greps in this brief should exclude `**/*.eslint.json` to avoid false positives and stale embedded content.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any): none (but runtime classification is needed to resolve middleware risks correctly).
