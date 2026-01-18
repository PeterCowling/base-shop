---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-01-16
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
---

# Next.js 15.3.6 Upgrade Plan

## Goal
- Upgrade Next.js to 15.3.6 across the monorepo to address the critical RCE vulnerability.

## Scope
- Update all `package.json` files that declare a `next` dependency.
- Update `pnpm-lock.yaml` after the versions change.

## Approach
- Replace `15.3.5` with `15.3.6` for `next` in every workspace `package.json`.
- Refresh the lockfile with `pnpm install` once the working tree is clean.

## Risks
- Patch-level behavior changes affecting `@cloudflare/next-on-pages` or Next internals referenced by test tooling.
- Canary React overrides may surface warnings if Next tightens version checks.

## Test Plan
- Targeted builds for critical apps (e.g. `pnpm --filter @apps/cms build`).
- Run any app-specific smoke tests if available.

## Rollback
- Revert `next` version changes in `package.json` files and `pnpm-lock.yaml`.

## Progress
- 2026-01-16: Updated `next` versions in workspace `package.json` files to 15.3.6. Lockfile update pending until the working tree is clean.

## Active tasks

- **NEXT-01** - Run `pnpm install` after working tree is clean and validate builds
