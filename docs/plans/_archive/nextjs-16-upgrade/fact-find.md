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
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/nextjs-16-upgrade/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Next.js 16 Upgrade Audit Fact-Find (Release Notes + Upgrade Guide)

## Scope
### Summary
Audit `dev` (local HEAD `3f0fd2ae54`, 2026-02-15) against:
- Next.js 16 release notes: `https://nextjs.org/blog/next-16`
- Next.js 16 upgrade guide: `https://nextjs.org/docs/app/guides/upgrading/version-16`

Goal: identify remaining work to:
1. avoid breaking issues
2. move away from deprecated elements
3. make the most of the upgrade

FACT-FIND ONLY (no code migrations applied here).

### Goals
- Confirm prerequisites and toolchain constraints are enforced (Node, TS, React, lint)
- Identify any remaining hard-break surfaces called out by Next 16
- Inventory remaining deprecations and runtime constraints (middleware vs proxy)
- Seed follow-up tasks with concrete evidence/paths for `/lp-do-plan`

### Non-goals
- Implement fixes (belongs in `/lp-do-build`)
- Turbopack migration for apps with custom webpack (separate project)

### Constraints & Assumptions
- Constraint: repo intentionally forces Webpack via CLI `--webpack` to preserve custom webpack behavior.
- Constraint: Cloudflare/OpenNext apps cannot adopt Node-only `proxy.ts` today (Workers runtime).

## External Research (Load-Bearing Facts)
These are the facts that should drive policy decisions in planning:

- Next.js 16 proxy/middleware (upgrade guide):
  - `proxy.ts` uses Node.js runtime.
  - Edge runtime is not supported in `proxy` (and cannot be configured).
  - If you need Edge behavior, you keep using `middleware` for now; Next states more Edge guidance will come in a later minor release.
  - Source: `https://nextjs.org/docs/app/guides/upgrading/version-16`

- Cloudflare Next.js on Workers (support reality check):
  - Cloudflare documents middleware support, and highlights current limitations around Node.js middleware support.
  - Practical implication: Cloudflare-deployed Next apps will likely be forced to keep Edge-compatible interception (middleware) despite deprecation until either:
    - Next ships the promised Edge guidance, and/or
    - the Cloudflare adapter/runtime supports the necessary Node/proxy behavior.
  - Source: `https://developers.cloudflare.com/pages/framework-guides/nextjs/`

## Evidence Audit (Current State)

### Upgrade Prereqs (Enforced)
- Node:
  - `.nvmrc` pins `20.19.4`
  - `package.json` enforces `engines.node: >=20.9.0`
- TypeScript:
  - root `package.json` has `typescript: 5.8.3` (meets Next 16 minimum `>=5.1`)
- Core versions (root `package.json`):
  - `next: 16.1.6`
  - `react/react-dom: 19.2.1`
  - `next-auth: 4.24.12`
  - `next-intl: ^4.8.2`
  - `eslint: ^9.30.1`, `eslint-config-next: 16.1.6`

### Linting Gate (Next 16 Behavioral Change)
Next 16 removes `next lint` and `next build` no longer runs lint.

Repo state:
- CI runs lint explicitly via `pnpm --filter <workspace> lint`.
  - Evidence: `.github/workflows/test.yml`, `.github/workflows/cms.yml`, `.github/workflows/reusable-app.yml`, `.github/workflows/ci.yml`
- No `next lint` usage found in repo scripts/CI (grep-based check).

### ESLint Config Format
Next’s ESLint plugin defaults to flat config.

Repo state:
- Flat config is present: `eslint.config.mjs` at repo root.
- Legacy config file is still present: `.eslintrc.cjs`.

Implication:
- Lint currently runs successfully under ESLint 9 across multiple workspaces, but removing/retaining `.eslintrc.cjs` should be an explicit decision to avoid “two config formats” confusion.

### Webpack Opt-Out Control Points
- App scripts: `apps/*/package.json` use `next dev --webpack` + `next build --webpack`.
- CI workflows: searched `.github/workflows/**` for `next build`/`next dev` without `--webpack` (0 matches).
- Known bypass fixed and pushed: `.github/workflows/brikette.yml` now runs `pnpm exec next build --webpack`.
- There is an existing policy check in `scripts/validate-changes.sh` output: “Next.js Webpack opt-out policy (--webpack)”.

### Async Request APIs (Hard-Break Surface)
Residual route handler signature mismatches were fixed and pushed:
- `apps/cms/src/app/api/auth/[...nextauth]/route.ts` (async `ctx.params`)
- `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` (async `params`)

Reminder for planning scope:
- Next 16 enforcement covers more than `page.tsx` + route handlers (layouts, metadata routes, icons, etc.).

### Middleware / Proxy Surface (Deprecation + Runtime)
Middleware entrypoints present:
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
- `apps/business-os/package.json` has `@opennextjs/cloudflare` and `build:worker: opennextjs-cloudflare build`
- `apps/xa/package.json` has `@opennextjs/cloudflare`
- `apps/cms/package.json` has `@opennextjs/cloudflare` and `build:worker: opennextjs-cloudflare build`

### Next/Image Defaults + Breaking/Behavior Changes
- Shared Next config mitigates a key Next 16 default change:
  - `packages/next-config/index.mjs` sets `images.qualities: [75, 80, 85, 90]` (Next 16 default is `[75]`).
- Deprecations: no evidence found of `images.domains` or `next/legacy/image`.
- Additional upgrade-guide config keys: no evidence found of:
  - `images.minimumCacheTTL`
  - `images.maximumRedirects`
  - `images.dangerouslyAllowLocalIP`
  - `images.imageSizes`
- Code usage: no evidence found of local `<Image src="/path?...">` query-string patterns.

### Build Output Layout: `.next/dev`
- No tracked scripts reference `.next/dev` or `.next/trace`.
- No `isolatedDevBuild` config found.
- One build-output consumer exists:
  - `apps/brikette/scripts/perf/analyze-chunks.mjs` reads `.next/static/chunks` (build output, not dev output).

### Cheap Repo-Wide Grep Checks (0 matches unless noted)
- `next lint`
- AMP: `useAmp`, `amp: true`
- runtime config: `publicRuntimeConfig`, `serverRuntimeConfig`, `next/config` usage
- removed/renamed config keys: `experimental.dynamicIO`, `cacheComponents`, `experimental.ppr`, `experimental_ppr`, `experimental.turbopack`, `turbopack: {}`
- caching API drift: `revalidateTag(` / `updateTag(` / `cacheTag(`
- middleware-url-normalize renames: `skipMiddlewareUrlNormalize` / `skipProxyUrlNormalize`
- removed API: `unstable_rootParams(`
- removed devIndicators options: `devIndicators.appIsrStatus`, `devIndicators.buildActivity`, `devIndicators.buildActivityPosition`
- parallel routes: no `@slot` directories detected under `apps/**/src/app/`

## Upgrade Guide Coverage Checklist (Planning-Grade)
This is a quick “did we explicitly check it?” map. Anything “Not checked” should become a task seed or an explicit conscious deferral.

| Upgrade guide item | Status | Evidence | Notes |
|---|---|---|---|
| Node >=20.9 | Checked | `.nvmrc`, `package.json` | CI should stay pinned; engines alone don’t enforce runtime |
| TS >=5.1 | Checked | `package.json` (`typescript: 5.8.3`) |  |
| React alignment | Checked | `package.json` (`react/react-dom: 19.2.1`) |  |
| `next lint` removed | Checked | grep + CI workflows | CI runs `pnpm lint` explicitly |
| ESLint config removal from next.config | Checked | grep next.config | CMS has no `eslint:` config block |
| ESLint flat config default | Checked | `eslint.config.mjs` exists | `.eslintrc.cjs` still exists; decide retention |
| Async Request APIs enforcement | Partially checked | targeted routes fixed | still needs repo-wide “entrypoint coverage” check |
| middleware -> proxy | Checked | middleware inventory | blocked by runtime constraints on Workers |
| config removals/renames | Checked | grep next.config | include `turbopack` key move / PPR flags |
| next/image changes | Checked | shared qualities + greps | consider defaults (TTL/redirects/local IP) explicitly |
| `.next/dev` output | Checked | grep scripts | no consumers found |
| parallel routes default.* | Checked | find `@*` under app/ | none present |

## Findings

## 1) Avoid Breaking Issues (Remaining Work)

### 1.1 Cloudflare proxy-runtime gap is a top-tier external dependency risk
Facts you can’t “code your way out of” today:
- Next 16 wants `proxy.ts` (Node-only) as the replacement convention.
- Next 16 says Edge runtime is not supported for `proxy` and cannot be configured.
- Cloudflare Workers deployments do not provide a general Node runtime.

Implication:
- Cloudflare/OpenNext apps cannot fully “move away from deprecated middleware” today without upstream platform movement.
- Planning should explicitly model this as an external dependency and treat deprecation cleanup for those apps as “defer pending Next/adapter support”.

### 1.2 CMS middleware duplication is a deterministic correctness hazard
- Both `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` exist.

Why it matters:
- Ambiguous interception entrypoints are brittle across Next versions.
- This risk is independent of the deprecation warning.

### 1.3 Node-only imports inside middleware are a deterministic runtime risk for Edge/Workers
Evidence:
- `apps/cover-me-pretty/middleware.ts` imports `node:crypto`.
- `apps/cms/middleware.ts` imports `crypto` and `helmet`.
- `apps/cms/src/middleware.ts` imports `helmet`.

Nuance:
- This is deterministic only if the app is truly Edge/Worker deployed.
- If an app is Node deployed and can migrate to `proxy.ts`, Node-only imports become acceptable (and may be preferable).

### 1.4 Webpack opt-out must remain an enforced policy
Why it matters:
- Next 16 defaults to Turbopack for `next dev` and `next build`.
- With custom webpack configs present, allowing “naked” `next build` invocations is a CI-only failure trap.

### 1.5 CMS local build remains an operational risk (OOM)
Not re-validated in this session.

Why it matters:
- If CMS can’t build reliably on typical dev machines, “CI-only build validation” becomes the de facto workflow and increases time-to-debug.

## 2) Move Away From Deprecated Elements

### 2.1 `middleware.ts` deprecation needs a runtime-classified policy
Decision framing:
- Node deployments:
  - migrate `middleware.ts` -> `proxy.ts`
  - keep Node-only dependencies where appropriate
- Edge/Worker deployments:
  - keep `middleware.ts` for now
  - refactor to Web APIs only (no Node-only imports)
  - accept deprecation until Next ships the promised Edge guidance

## 3) Make The Most Of The Upgrade (Opportunities)

### 3.1 Scroll behavior: make it explicit
Next 16 no longer overrides global `scroll-behavior` during navigation by default; you can opt back into the prior override behavior via `data-scroll-behavior="smooth"` on the `<html>` element.

Repo evidence:
- No `data-scroll-behavior` usage found.

Opportunity:
- Decide per app whether to opt into the prior behavior, or rely purely on CSS.

### 3.2 Selective Turbopack adoption (future)
Once stable:
- Identify apps without custom webpack and consider removing `--webpack` for faster dev/build.

## Open Questions (User Input Needed)
1. Runtime classification: which apps are Cloudflare/Workers vs Node deployments? (We can infer OpenNext for 4 apps; the rest are unknown without deployment intent.)
2. CMS canonical interception entrypoint: is `apps/cms/src/middleware.ts` the intended canonical file, and can `apps/cms/middleware.ts` be removed?
3. Warnings policy: do we allow `middleware` deprecation warnings only for apps explicitly classified as Edge/Worker, and fail on any other new deprecation class?

## Suggested Task Seeds (for `/lp-do-plan`)

1. **App runtime classification inventory (required foundation)**
- Produce a table mapping each Next app to deployment runtime (Node vs Worker/Edge) and interception mechanism (proxy vs middleware).
- Acceptance:
  - A single authoritative table in the plan.
  - Each app has one of: `Node`, `Worker/Edge`, `Unknown` with an owner to confirm.

2. **Resolve CMS middleware duplication**
- Remove the duplicate middleware entrypoint and ensure only one interception file exists.
- Acceptance:
  - Exactly one of `apps/cms/middleware.ts` or `apps/cms/src/middleware.ts` remains.
  - A smoke check proves the canonical middleware is active (for example: request to `/login` includes expected security headers).
  - `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` pass.

3. **Edge-compat middleware hardening (Workers apps only)**
- For each Worker/Edge app with middleware, ensure middleware uses Web APIs only.
- CMS specific: remove `helmet` usage and any Node-only shims from the canonical middleware.
- cover-me-pretty specific: replace `node:crypto` hashing with Web Crypto (`crypto.subtle.digest`) if it must remain middleware.
- Acceptance:
  - No Node-only imports in middleware for Worker/Edge apps.
  - Existing middleware tests pass (add tests if missing).

4. **CI guardrail: forbid `next build` without `--webpack`**
- Ensure the existing policy check remains enforced and covers:
  - `.github/workflows/**`
  - `apps/*/package.json`
  - any ad-hoc scripts that invoke Next directly
- Acceptance:
  - Policy check fails on a contrived violation.
  - CI never runs Turbopack by accident.

5. **Async Request APIs: repo-wide entrypoint coverage check**
- Run a repo-wide audit/codemod pass focused on:
  - `apps/**/src/app/**/(page|layout|route|template|loading|error).*`
  - metadata/image route entrypoints if present
  - `cookies()`, `headers()`, `draftMode()` await usage
- Acceptance:
  - 0 remaining sync access violations.

6. **Next/image upgrade-guide behavior confirmation**
- Confirm explicitly whether any app relies on:
  - local IP image optimization (blocked by default)
  - minimum cache TTL expectations
  - redirect limits
  - removed default `imageSizes`
- Acceptance:
  - Either: “not applicable” evidence recorded, or config changes made intentionally.

7. **CMS build OOM mitigation (INVESTIGATE first)**
- Instrument memory with `EXPERIMENTAL_DEBUG_MEMORY_USAGE=1` during `@apps/cms` build.
- Reduce peak heap usage (workers/SSG concurrency, source maps, etc.).
- Acceptance:
  - CMS build succeeds on a 16GB machine using a documented command.

## Confidence Inputs For `/lp-do-plan`
- Implementation: 82
  - What raises to ≥90: land one Worker/Edge middleware hardening end-to-end (CMS is the best stress case).
- Approach: 80
  - What raises to ≥90: complete runtime classification + proxy/middleware policy table.
- Impact: 84
  - What raises to ≥90: repo-wide async entrypoint coverage check with a measured match-count of violations (ideally 0).
- Delivery-Readiness: 86
  - What raises to ≥90: make the “webpack opt-out policy check” a non-optional CI gate and keep it close to the Next upgrade plan.

## How This Audit Was Performed
Repo searches were run with `rg` and `find` across `apps/`, `packages/`, `scripts/`, and `.github/workflows/` focusing on:
- Next 16 breaking removals/renames and deprecated APIs
- `next build`/`next dev` invocations missing `--webpack`
- middleware entrypoints and Node-only imports inside them
- lint/toolchain enforcement in CI
- next/image config keys and common usage patterns
- `.next/dev` consumers and parallel routes slot defaults

## Planning Readiness
**Status:** Ready-for-planning

Open questions gate *which* remediation path applies (proxy vs middleware), but not the existence of required work. CMS middleware duplication and Edge-incompatible middleware imports are deterministic risks once runtime classification is known.
