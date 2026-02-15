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

# Next.js 16 Upgrade Audit Fact-Find (Release Notes + Upgrade Guide)

## Scope
### Summary
Audit the current `dev` branch (local HEAD `98a0cb42fc`, 2026-02-15) against:
- Next.js 16 release notes: `https://nextjs.org/blog/next-16`
- Next.js 16 upgrade guide: `https://nextjs.org/docs/app/guides/upgrading/version-16`

Goal is to identify what remains to:
1. avoid breaking issues
2. move away from deprecated elements
3. make the most of the upgrade

FACT-FIND ONLY (no code migrations applied here).

### Goals
- Confirm prerequisites and toolchain constraints are enforced (Node, TS, React, lint)
- Identify any remaining hard-break surfaces called out by Next 16
- Inventory remaining deprecations and runtime constraints (middleware vs proxy)
- Seed follow-up tasks with concrete evidence/paths for `/lp-plan`

### Non-goals
- Implement fixes (belongs in `/lp-build`)
- Turbopack migration for apps with custom webpack

### Constraints & Assumptions
- Constraint: repo intentionally forces Webpack via CLI `--webpack` to preserve custom webpack behavior.
- Constraint: Cloudflare/OpenNext apps cannot rely on Node-only `proxy.ts` (Workers runtime). They must keep Edge-compatible request interception.

## Evidence Audit (Current State)
### Upgrade Prereqs (Enforced)
- Node:
  - `.nvmrc` pins `20.19.4`
  - `package.json` enforces `engines.node: >=20.9.0`
- Core versions (root `package.json`):
  - `next: 16.1.6`
  - `react/react-dom: 19.2.1`
  - `next-auth: 4.24.12`
  - `next-intl: ^4.8.2`
  - `eslint: ^9.30.1`, `eslint-config-next: 16.1.6`

### Webpack Opt-Out Control Points
- App scripts: `apps/*/package.json` use `next dev --webpack` + `next build --webpack`.
- CI workflows: searched `.github/workflows/**` for `next build`/`next dev` without `--webpack` (0 matches).
- Known CI bypass fixed and pushed: `.github/workflows/brikette.yml` now runs `pnpm exec next build --webpack`.

### Async Request APIs (Hard-Break Surface)
- Residual route handler signature mismatches were fixed and pushed:
  - `apps/cms/src/app/api/auth/[...nextauth]/route.ts` (async `ctx.params`)
  - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` (async `params`)

### Middleware / Proxy Surface (Deprecation + Runtime)
Next 16 deprecates `middleware.ts` filename convention in favor of `proxy.ts` (Node-only). This repo has multiple middleware entrypoints:
- `apps/brikette/src/middleware.ts`
- `apps/business-os/src/middleware.ts`
- `apps/cms/middleware.ts` (duplicate entrypoint)
- `apps/cms/src/middleware.ts` (duplicate entrypoint)
- `apps/cover-me-pretty/middleware.ts`
- `apps/xa/middleware.ts`
- `apps/xa-b/middleware.ts`
- `apps/xa-j/middleware.ts`

Cloudflare/OpenNext apps (Workers runtime):
- `apps/brikette/package.json` has `@opennextjs/cloudflare`
- `apps/business-os/package.json` has `@opennextjs/cloudflare`
- `apps/xa/package.json` has `@opennextjs/cloudflare`
- `apps/cms/package.json` has `@opennextjs/cloudflare`

### Image Defaults / Deprecations
- Shared Next config already mitigates one key Next 16 behavioral change:
  - `packages/next-config/index.mjs` sets `images.qualities: [75, 80, 85, 90]` (Next 16 default is `[75]`).
- No evidence found of:
  - `images.domains`
  - `next/legacy/image`
  - local `<Image src="/path?...">` query-string patterns

### Cheap Repo-Wide Grep Checks (0 matches unless noted)
- `next lint`
- AMP: `useAmp`, `amp: true`
- runtime config: `publicRuntimeConfig`, `serverRuntimeConfig`, `next/config` usage
- Next 16 config removals/renames: `experimental.dynamicIO`, `cacheComponents`, `experimental.ppr`, `experimental_ppr`, `experimental.turbopack`, `turbopack: {}`
- caching API deprecations: `revalidateTag(` / `updateTag(` / `cacheTag(`
- middleware-url-normalize renames: `skipMiddlewareUrlNormalize` / `skipProxyUrlNormalize`
- parallel routes `@slot` directories missing `default.*` (no parallel routes detected)

### Tooling Risk: `.next/dev`
- No tracked scripts reference `.next/dev` or `.next/trace`.
- One build-output consumer exists:
  - `apps/brikette/scripts/perf/analyze-chunks.mjs` reads `.next/static/chunks` (build output, not dev output).

## Findings

## 1) Avoid Breaking Issues (Remaining Work)

### 1.1 CMS middleware duplication is a deterministic risk
- `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` both exist.

Why this matters:
- It is ambiguous which middleware entrypoint Next will pick (and future Next versions may error when both exist).
- This is independent of the deprecation warning; it is a correctness and maintainability hazard.

### 1.2 Node-only imports in middleware are a deterministic runtime risk
`middleware.ts` runs in Edge runtime. Node-only imports can break at runtime (or during bundling) depending on deployment.

Evidence:
- `apps/cover-me-pretty/middleware.ts` imports `node:crypto` to hash inline script for CSP.
- `apps/cms/middleware.ts` imports `crypto` and `helmet`.
- `apps/cms/src/middleware.ts` imports `helmet`.

Why this matters:
- For Cloudflare/OpenNext apps (CMS included), request interception must be Worker/Edge compatible.
- The middleware/proxy deprecation warning is not the actual failure mode; Node-only imports are.

### 1.3 Webpack enforcement in CI is now correct, but must remain a policy
We now have evidence that repo scripts and workflows do not call `next build`/`next dev` without `--webpack`.

Why this matters:
- Next 16 defaults to Turbopack for `next dev` and `next build`.
- Any future CI step that runs `pnpm exec next build` directly (bypassing app scripts) must include `--webpack`.

### 1.4 CMS local build is currently not a reliable validation gate (OOM)
Not re-run in this fact-find session, but prior work indicates `pnpm --filter @apps/cms build` can exceed heap in 16GB environments even with `NEXT_BUILD_CPUS=1` and large heaps.

Why this matters:
- It can turn build verification into a CI-only gate, which is operationally risky.

## 2) Move Away From Deprecated Elements

### 2.1 `middleware.ts` deprecation needs an explicit policy, not a blanket “no warnings” goal
Next 16 deprecates `middleware.ts` in favor of `proxy.ts`.

Constraints:
- `proxy.ts` is Node-only, and cannot be used for Worker/Edge runtimes.
- Cloudflare/OpenNext apps (`apps/brikette`, `apps/business-os`, `apps/xa`, `apps/cms`) will almost certainly need to keep Edge interception and therefore keep `middleware` (until Next provides Edge-compatible guidance).

Actionable reframing:
- Treat middleware deprecation warnings as acceptable only for apps explicitly classified as Edge-required.
- For Node-deployed apps, migrate to `proxy.ts` to eliminate deprecation and reduce Edge-runtime constraints.

## 3) Make The Most Of The Upgrade (Opportunities)

### 3.1 Explicitly decide scroll behavior
Next 16 changes navigation scroll override behavior; you can opt into the prior behavior via `data-scroll-behavior="smooth"` on the `<html>` element.

Repo state:
- No `data-scroll-behavior` attribute is present.
- Brikette already sets `scroll-behavior: smooth` in CSS; other apps may diverge.

Opportunity:
- Decide per app whether to opt into the prior framework behavior, or rely purely on CSS.

### 3.2 Selective Turbopack adoption (future)
Once stable:
- Identify apps without custom webpack and consider removing `--webpack` for faster dev/build.
- Keep the current default as Webpack until the middleware/proxy and CMS build stability issues are resolved.

## Open Questions (User Input Needed)
1. For `apps/cover-me-pretty`: is it deployed on Node (eligible for `proxy.ts`) or on an Edge/Worker runtime?
2. For `apps/cms`: which middleware file should be canonical (`apps/cms/src/middleware.ts` is the likely target), and can we remove the duplicate root middleware safely?
3. Warnings policy: do we treat `middleware` deprecation warnings as allowed for Worker/Edge apps, but fail builds on any other new deprecation class?

## Suggested Task Seeds (for `/lp-plan`)

1. **Resolve CMS middleware duplication**
- Remove the duplicate middleware entrypoint and ensure only one is used.
- Acceptance:
  - Exactly one of `apps/cms/middleware.ts` or `apps/cms/src/middleware.ts` remains.
  - `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` pass.

2. **Make CMS middleware Edge-compatible** (required if CMS runs on Cloudflare Workers)
- Replace `helmet` usage with static header composition (no Node req/res shims).
- Ensure no Node-only imports remain in the middleware entrypoint.
- Acceptance:
  - Middleware bundle compiles for Edge runtime (no `node:*` imports).
  - Auth guard still works (JWT decode, CSRF checks) with tests updated.

3. **Fix cover-me-pretty middleware Node crypto usage**
- Replace `node:crypto` hashing with Web Crypto (`crypto.subtle.digest`) or move interception to `proxy.ts` if Node runtime is acceptable.
- Acceptance:
  - No Node-only imports in Edge middleware (if staying on middleware).
  - CSP header still contains correct script hash.

4. **Scroll behavior decision**
- Decide per app whether to add `data-scroll-behavior="smooth"` in root `app/layout.tsx`.

5. **CMS build OOM mitigation (INVESTIGATE first)**
- Instrument `@apps/cms` build memory with `EXPERIMENTAL_DEBUG_MEMORY_USAGE=1`.
- Identify the heaviest build phase and reduce memory (worker count, SSG concurrency, source maps, etc.).
- This should land as an INVESTIGATE task before committing to “CI-only build validation”.

## Confidence Inputs For `/lp-plan`
- Implementation: 82
  - What raises to ≥90: prove Edge-compatible middleware changes for CMS via a local build or a deterministic worker build step.
- Approach: 80
  - What raises to ≥90: explicitly classify each app as Node vs Worker/Edge, and choose proxy vs middleware accordingly.
- Impact: 84
  - What raises to ≥90: run a repo-wide Next codemod validation pass in CI and capture the “no remaining async request API violations” evidence.
- Delivery-Readiness: 85
  - What raises to ≥90: tighten the warnings policy and add a CI check that forbids `next build` invocations without `--webpack`.

## How This Audit Was Performed
Repo searches were run with `rg` and `find` across `apps/`, `packages/`, `scripts/`, and `.github/workflows/` focusing on:
- Next 16 breaking removals/renames and deprecated APIs
- direct `next build`/`next dev` invocations without `--webpack`
- middleware entrypoints and Node-only imports inside them
- image config and query-string local image usage
- parallel route slot folder defaults

## Planning Readiness
**Status:** Ready-for-planning

Open questions exist, but they only gate *which* follow-up tasks are chosen (proxy vs middleware), not whether work is necessary. The unsafe middleware imports and CMS duplication are deterministic risks regardless.
