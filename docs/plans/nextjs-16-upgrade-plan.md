---
Type: Plan
Status: Draft
Domain: Repo
Created: 2026-01-24
Created-by: Codex (GPT-5)
Last-reviewed: 2026-01-24
Relates-to charter: docs/runtime/runtime-charter.md
Priority: P1 — Platform upgrade
---

# Next.js 16 Upgrade Plan

## Background

Base-Shop is a multi-app Next.js monorepo currently on Next 15.x with shared Next config and a mix of App Router apps. Next.js 16 introduces runtime minimums, defaults Turbopack for dev/build, and includes breaking changes across request APIs, middleware, and image configuration that require coordinated changes across apps and shared packages. citeturn5view4turn5view5turn5view6turn6view7turn14view0turn14view2turn5view10

The latest stable Next 16 release is 16.1.4 (January 19, 2026). citeturn13view0

## Scope

- All Next.js applications in `apps/*` and `packages/template-app`.
- Shared Next config (`packages/next-config`) and app-specific overrides.
- Build/CI scripts and deployment tooling that execute `next build` or Cloudflare deploy commands.
- Core Next.js ecosystem dependencies (NextAuth, next-intl, next-on-pages, eslint-config-next, @next/env).

## Requirements and Breaking Changes to Address

- Node.js minimum runtime is 20.9.0 and TypeScript minimum is 5.1.0. citeturn5view4
- Turbopack is now the default bundler for `next dev` and `next build`; custom Webpack configs will fail unless explicitly opting out with `--webpack` or migrating config to Turbopack-compatible settings. citeturn5view5
- Async Request APIs are enforced; `cookies`, `headers`, `draftMode`, `params`, and `searchParams` must be accessed asynchronously everywhere they are used. citeturn5view6
- `middleware.ts` is deprecated in favor of `proxy.ts` (node runtime only); continuing with Edge runtime requires keeping `middleware.ts`. citeturn6view7
- `next/image` changes:
  - Local image query strings now require `images.localPatterns.search`. citeturn14view0
  - `images.minimumCacheTTL` default is now 4 hours (from 60 seconds). citeturn14view0
  - `images.imageSizes` default no longer includes 16px. citeturn14view2
- Parallel route slots must include `default.js` or builds fail. citeturn5view10

## Dependency Constraints / Blockers

- `@cloudflare/next-on-pages` only confirms support for Next 13.4.2 and does not guarantee parity with latest Next versions; upgrading to Next 16 may break these deployments. citeturn5view2
- Cloudflare recommends the OpenNext adapter for Next.js deployments on Cloudflare instead of Next on Pages. citeturn5view3
- `next-intl` 4.3.3 peer dependencies only support Next up to 15.x; need a version that explicitly supports Next 16. citeturn9search0
- `next-auth` 4.24.12 adds peer dependency support for Next 16; current repo version should be upgraded at least to that level. citeturn2search2

## Plan

### Phase 1 — Audit and Inventory

- Inventory all Next apps and shared config usage.
- Identify all custom `webpack` config blocks and plan Turbopack migration or `--webpack` opt-out per app.
- Scan for sync usage of request APIs (`cookies`, `headers`, `draftMode`, `params`, `searchParams`) and map required code changes.
- Find local `next/image` usages that include query strings and audit any local/private IP image usage.
- Search for parallel route slots (`app/@*`) and verify `default.js` is present.
- Map Cloudflare deployments and identify which apps use `@cloudflare/next-on-pages`.

### Phase 2 — Dependency Upgrade Strategy

- Set Next.js target to 16.1.4 across root and all workspace packages.
- Upgrade `eslint-config-next` and `@next/env` to match Next 16.
- Upgrade `next-auth` to >=4.24.12 (or v5 if necessary for other features).
- Upgrade `next-intl` to a version that explicitly supports Next 16.
- Validate other Next ecosystem packages (next-seo, next-secure-headers, storybook-next) for compatibility.

### Phase 3 — Config and Runtime Changes

- Decide on Turbopack strategy:
  - Migrate shared `webpack` config to Turbopack where possible, or
  - Opt out with `--webpack` for builds that require custom Webpack.
- Address `middleware.ts` vs `proxy.ts` per app based on runtime needs; update filenames/exports accordingly.
- Update `next/image` settings where needed: `localPatterns.search`, `minimumCacheTTL`, `imageSizes`, `qualities` if previous defaults are required.
- Add missing `app/@*/default.tsx` files where parallel routes exist.

### Phase 4 — Code Changes and Validation

- Refactor any synchronous request API usage to async across app routes, metadata, and API routes.
- Run `pnpm typecheck` and `pnpm lint`.
- Run targeted tests for affected apps (CMS, XA storefronts, template app).
- Validate Cloudflare deploy path for each app (OpenNext adapter or static export).

### Phase 5 — Rollout and Monitoring

- Stage upgrades per app group to reduce blast radius (CMS, storefronts, internal tools, template).
- Update CI workflows and deployment docs.
- Monitor build, runtime logs, and image optimization behavior for regressions.

## Acceptance Criteria

- All Next apps build and run on Next 16.1.4 locally and in CI.
- `pnpm typecheck` and `pnpm lint` pass.
- Targeted tests for CMS and storefront apps pass.
- Cloudflare deployment strategy is documented and working for each app.
- No Next.js 16 breaking-change warnings remain in CI output.

## Risks / Unknowns

- Cloudflare adapter migration complexity (Next on Pages to OpenNext).
- next-intl upgrade path (API changes and peer dependency alignment).
- Turbopack compatibility with current custom Webpack config and aliases.
- Parallel route defaults may exist in apps not yet audited.

## Pending Audit Work

- Enumerate all `app/@*` slot routes and confirm `default.tsx` presence.
- Confirm all `next/image` local URLs with query strings and any private IP usage.
- Identify whether any apps rely on Edge runtime in middleware and need to keep `middleware.ts`.
- Validate Storybook + Next compatibility after upgrading Next 16.
