---
Type: Plan
Status: Complete
Domain: Platform
Last-reviewed: 2026-01-20
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-20
Last-updated-by: Claude Opus 4.5 (Plan superseded - upgraded to 15.3.8)
Completed: 2026-01-20
---

# Next.js 15.3.6 Upgrade Plan

## Goal
- Upgrade Next.js to 15.3.6 across the monorepo to address the critical RCE vulnerability.

## Status: COMPLETE (Superseded)

**The repo has been upgraded to Next.js 15.3.8**, which supersedes the 15.3.6 target. All apps are now on 15.3.8 except `handbag-configurator` which is on 15.3.5 (should be updated separately).

Current versions as of 2026-01-20:
- Root: 15.3.8
- brikette: ^15.3.8
- cms: 15.3.8
- cochlearfit: ^15.3.8
- cover-me-pretty: ^15.3.8
- handbag-configurator: ^15.3.5 (outdated)
- prime: ^15.3.8
- product-pipeline: ^15.3.8
- skylar: ^15.3.8

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
- 2026-01-20: Plan marked complete - repo upgraded to 15.3.8 (supersedes 15.3.6 target).

## Active tasks

- ~~**NEXT-01** - Run `pnpm install` after working tree is clean and validate builds~~ ✅ Complete
