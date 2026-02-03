---
Type: Card
Lane: Fact-finding
Priority: P2
Owner: Pete
ID: PLAT-ENG-0012
Title: Next.js 16 Upgrade Plan
Business: PLAT
Tags:
  - plan-migration
  - repo
Created: 2026-01-24T00:00:00.000Z
Updated: 2026-01-24T00:00:00.000Z
---
# Next.js 16 Upgrade Plan

**Source:** Migrated from `nextjs-16-upgrade-plan.md`


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

[... see full plan in docs/plans/nextjs-16-upgrade-plan.md]
