---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-02-10
Relates-to charter: none
Workstream: Engineering
Created: 2026-01-24
Last-updated: 2026-02-10
Feature-Slug: nextjs-16-upgrade
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: build-feature
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
---

# Next.js 16 Upgrade Plan

## Summary

Upgrade the Base-Shop monorepo from Next.js 15.3.9 to Next.js 16.x (latest stable). The upgrade touches 14 Next.js apps, the shared config package, ecosystem dependencies (next-auth, eslint-config-next, @opennextjs/cloudflare), and ~20 source files with synchronous request API usage that must become async. The strategy is: bump version + add `--webpack` flag universally for build safety, migrate async APIs, upgrade ecosystem deps, then validate.

## Goals

- All 14 Next.js apps build and pass tests on Next.js 16.x
- `pnpm typecheck && pnpm lint` pass
- Cloudflare deployments (brikette, business-os, xa, cms) work with updated @opennextjs/cloudflare
- No Next.js 16 deprecation warnings in build output
- CI pipelines unmodified or minimally updated

## Non-goals

- Migrating webpack configs to Turbopack (separate future effort — too large for this upgrade)
- Migrating `middleware.ts` → `proxy.ts` (all 3 apps need Edge runtime, `proxy.ts` is Node-only)
- Upgrading next-auth to v5 (separate migration)
- Performance optimization or Turbopack dev-mode adoption

## Constraints & Assumptions

- Constraints:
  - Must use `--webpack` flag for builds since all apps inherit webpack config from shared preset
  - Middleware files must stay as `middleware.ts` (Edge runtime requirement: brikette slug rewrites, CMS auth/CSRF, business-os auth guard)
  - @opennextjs/cloudflare must support Next 16 (confirmed per official docs: "All minor and patch versions of Next.js 16 are supported")
  - Node.js >=20.9.0 required (current engine `>=20` meets this)
  - TypeScript >=5.1.0 required (current `5.8.3` meets this)
- Assumptions:
  - The `--webpack` flag preserves full backward compatibility with existing webpack configs
  - next-auth 4.24.12+ has Next 16 peer dep support

## Existing System Notes

- Key modules/files:
  - `packages/next-config/index.mjs` — shared base config (no webpack)
  - `packages/next-config/next.config.mjs` — shared preset with webpack (extensions, aliases, NormalModuleReplacementPlugin)
  - `apps/cms/next.config.mjs` — extensive CMS-specific webpack (hash guard, React aliases, pino deps, entities aliases, cache config)
  - `apps/brikette/next.config.mjs` — webpack with client-side fallbacks and raw import rule
  - `apps/cms/src/middleware.ts` — auth/CSRF/security headers (Edge runtime)
  - `apps/brikette/src/middleware.ts` — localized slug rewrites (Edge runtime)
  - `apps/business-os/src/middleware.ts` — auth guard (Edge, currently disabled)
- Patterns to follow:
  - Async params pattern already used in cochlearfit, business-os, xa, parts of cover-me-pretty: `params: Promise<{ lang: string }>` + `await params`
  - pnpm override in root `package.json` controls Next.js version globally

## Proposed Approach

**Single-pass upgrade with `--webpack` safety net:**

1. Bump Next.js version + pnpm override to 16.x
2. Remove removed config options (`eslint` in next.config, check `experimental.externalDir`)
3. Add `--webpack` flag to all `next build` and `next dev` commands
4. Upgrade ecosystem deps (next-auth, eslint-config-next, @opennextjs/cloudflare)
5. Run codemod + manual fixes for async params/searchParams
6. Validate builds, types, tests, and Cloudflare deploys

## Active tasks

- TASK-01 - Bump Next.js to 16.x + remove deprecated config.
- TASK-02 - Add `--webpack` flag to all build/dev scripts.
- TASK-03 - Upgrade ecosystem deps (`next-auth`, `eslint-config-next`).
- TASK-04 - Migrate async params/searchParams in cover-me-pretty.
- TASK-05 - Migrate remaining async params/searchParams in cms and other routes.
- TASK-06 - Run mid-upgrade validation (build, typecheck, lint).
- TASK-07 - Upgrade `@opennextjs/cloudflare` for Next 16.
- TASK-08 - Run full test validation and regression fixes.

**Why `--webpack` not Turbopack:** 9 of 14 apps have custom webpack functions in their next.config.mjs (inheriting from shared preset or adding their own). Migrating these to Turbopack equivalents is a separate project. The `--webpack` flag preserves existing behavior.

**Why not middleware → proxy.ts:** All 3 middleware files use Edge runtime features. `proxy.ts` only supports Node runtime. Migration would require architectural changes to how these apps handle auth, CSRF, and URL rewriting.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bump Next.js to 16.x + remove deprecated config | 85% | L | Pending | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Add --webpack flag to all build/dev scripts | 90% | S | Pending | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | Upgrade ecosystem deps (next-auth, eslint-config-next) | 82% | S | Pending | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Migrate async params — cover-me-pretty | 85% | M | Pending | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Migrate async params — cms + remaining routes | 82% | M | Pending | TASK-01 | TASK-06 |
| TASK-06 | CHECKPOINT | Mid-upgrade validation — builds, typecheck, lint | 95% | S | Pending | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-07, TASK-08 |
| TASK-07 | IMPLEMENT | Upgrade @opennextjs/cloudflare for Next 16 | 80% | M | Pending | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Full test validation and regression fixes | 80% | M | Pending | TASK-06, TASK-07 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01 | - | Foundation: version bump + config removals |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | Wave 1: TASK-01 | No file overlaps — safe parallel. Scripts, deps, async API (two apps) |
| 3 | TASK-06 | Wave 2: TASK-02, TASK-03, TASK-04, TASK-05 | CHECKPOINT: builds, typecheck, lint before proceeding |
| 4 | TASK-07 | Wave 3: TASK-06 | Cloudflare adapter upgrade + worker build verification |
| 5 | TASK-08 | Wave 4: TASK-07 | Final validation gate: typecheck, lint, full test suite |

**Max parallelism:** 4 (Wave 2) | **Critical path:** TASK-01 → TASK-02 → TASK-06 → TASK-07 → TASK-08 (5 waves) | **Total tasks:** 8

## Tasks

### TASK-01: Bump Next.js to 16.x and remove deprecated config options

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated package.json files and next.config.mjs files across the monorepo
- **Execution-Skill:** build-feature
- **Affects:**
  - `package.json` (root — `next` in deps, devDeps, and `pnpm.overrides`)
  - `apps/cover-me-pretty/package.json`, `apps/skylar/package.json`, `apps/cochlearfit/package.json`, `apps/handbag-configurator/package.json`, `apps/prime/package.json`, `apps/xa-uploader/package.json`, `apps/reception/package.json`, `apps/business-os/package.json`, `apps/xa-b/package.json`, `apps/product-pipeline/package.json`, `apps/xa-j/package.json`, `apps/xa/package.json`, `apps/cms/package.json`, `apps/brikette/package.json` (14 apps — `next` version)
  - `apps/prime/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }`)
  - `apps/cms/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }`, check `experimental: { externalDir }`)
  - `packages/next-config/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }` from shared preset if present)
  - `[readonly] packages/next-config/index.mjs` (verify `baseConfig` shape still valid)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% — straightforward version bump pattern; pnpm override controls all apps; removed config options are clearly documented
  - Approach: 88% — single atomic version bump is the standard approach for framework upgrades
  - Impact: 85% — touches all 14 apps' package.json + 3 next.config files; risk is pnpm resolution or undocumented breaking changes
- **Acceptance:**
  - `next` version is 16.x in root package.json deps, devDeps, and `pnpm.overrides.next`
  - All 14 app package.json files reference `^16.x` for next
  - `eslint` config block removed from `apps/prime/next.config.mjs` and `apps/cms/next.config.mjs`
  - `experimental.externalDir` checked and handled (removed if deprecated, kept if still supported)
  - `pnpm install` succeeds without errors
- **Validation contract:**
  - **TC-01:** After version bump + pnpm install, `node_modules/next/package.json` shows version 16.x → passes
  - **TC-02:** All 14 app `package.json` files contain `"next": "^16.` → verified by grep
  - **TC-03:** `pnpm install` exits 0 with no unresolved peer dep errors for `next` → passes
  - **TC-04:** `eslint` key absent from `apps/prime/next.config.mjs` and `apps/cms/next.config.mjs` → verified by grep
  - **Acceptance coverage:** TC-01,02 cover criteria 1,2; TC-03 covers criteria 5; TC-04 covers criteria 3,4
  - **Validation type:** unit (grep verification) + integration (pnpm install)
  - **Validation location:** manual verification
  - **Run:** `pnpm install && node -e "console.log(require('./node_modules/next/package.json').version)"`
- **Execution plan:** Red → Green → Refactor
- **Scouts:**
  - Node.js >=20.9.0 requirement → doc lookup → confirmed: repo engine `>=20` + typical dev machines run 20.x+
  - TypeScript >=5.1.0 requirement → doc lookup → confirmed: repo has `5.8.3`
  - `eslint` config in next.config.mjs removed → official upgrade guide → confirmed: "the `eslint` option in next.config.js is removed"
- **What would make this ≥90%:** Run `pnpm install` with Next 16 and verify zero peer dep conflicts
- **Rollout / rollback:**
  - Rollout: single commit with version bump + config fixes; all apps upgrade together via pnpm override
  - Rollback: revert commit, run `pnpm install`
- **Documentation impact:** None
- **Notes / references:**
  - Next.js 16 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-16
  - pnpm override at `package.json:379` controls all workspace package versions

### TASK-02: Add --webpack flag to all build and dev scripts

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated package.json scripts across all apps
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/cover-me-pretty/package.json` (`build`, `dev`)
  - `apps/cochlearfit/package.json` (`build`, `dev`, `preview`, `preview:pages`)
  - `apps/xa-j/package.json` (`dev`)
  - `apps/business-os/package.json` (`build`, `dev`)
  - `apps/xa-b/package.json` (`dev`)
  - `apps/prime/package.json` (`build`, `dev`)
  - `apps/skylar/package.json` (`build`, `dev`)
  - `apps/brikette/package.json` (`build`, `dev`)
  - `apps/xa-uploader/package.json` (`build`, `dev`)
  - `apps/reception/package.json` (`build`, `dev`)
  - `apps/xa/package.json` (`dev`)
  - `apps/cms/package.json` (`build`, `dev`, `dev:debug`)
  - `apps/product-pipeline/package.json` (`build`, `dev`)
  - `apps/handbag-configurator/package.json` (`build`, `dev`)
  - `[readonly] packages/next-config/next.config.mjs` (to verify webpack config structure)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 95% — simple string append to existing scripts; `--webpack` is a documented flag
  - Approach: 92% — `--webpack` is the official opt-out mechanism; no alternative needed
  - Impact: 90% — all scripts are self-contained; change is purely additive
- **Acceptance:**
  - All `next build` commands include `--webpack` flag
  - All `next dev` commands include `--webpack` flag
  - `opennextjs-cloudflare build` commands checked (these call next build internally — may need env var or config)
  - No scripts reference `--turbopack` explicitly
- **Validation contract:**
  - **TC-01:** `grep -r "next build" apps/*/package.json` shows `--webpack` on every occurrence → passes
  - **TC-02:** `grep -r "next dev" apps/*/package.json` shows `--webpack` on every occurrence → passes
  - **TC-03:** One representative app builds successfully: `pnpm --filter @apps/reception build` exits 0 → passes
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02 covers criteria 2; TC-03 validates runtime correctness
  - **Validation type:** unit (grep) + integration (build)
  - **Validation location:** manual verification
  - **Run:** `grep -r "next build\|next dev" apps/*/package.json`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Already ≥90%
- **Rollout / rollback:**
  - Rollout: atomic commit with all script changes
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Next 16 docs: "you can keep using Webpack by using the `--webpack` flag"
  - Note: `opennextjs-cloudflare build` wraps `next build` — need to verify it passes `--webpack` through or uses its own invocation

### TASK-03: Upgrade ecosystem dependencies (next-auth, eslint-config-next)

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated dependency versions
- **Execution-Skill:** build-feature
- **Affects:**
  - `package.json` (root — `next-auth`, `eslint-config-next`)
  - `packages/ui/package.json` (`next-auth` peer dep)
  - `[readonly] apps/cms/src/middleware.ts` (verify next-auth JWT API unchanged)
  - `[readonly] apps/cms/src/app/api/auth/[...nextauth]/route.ts` (verify auth config unchanged)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 85% — version bumps with known target versions; next-auth 4.24.12 is a patch bump
  - Approach: 85% — staying on next-auth v4 (not jumping to v5) is conservative and correct
  - Impact: 82% — next-auth JWT API used in CMS middleware; eslint-config-next may introduce new rules
- **Acceptance:**
  - `next-auth` version is >=4.24.12 in root `package.json`
  - `eslint-config-next` version matches Next 16.x series
  - `packages/ui/package.json` next-auth peer dep updated to match
  - `pnpm install` succeeds
  - CMS auth flow still works (JWT token decoding in middleware unchanged)
- **Validation contract:**
  - **TC-01:** `next-auth` resolved version is >=4.24.12 → `pnpm list next-auth` shows correct version
  - **TC-02:** `eslint-config-next` resolved version matches `16.x` → `pnpm list eslint-config-next` shows correct version
  - **TC-03:** `pnpm lint --filter @apps/cms` passes (eslint-config-next works with Next 16) → exits 0
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02 covers criteria 2; TC-03 covers criteria 5
  - **Validation type:** unit (version check) + integration (lint)
  - **Validation location:** manual verification
  - **Run:** `pnpm list next-auth && pnpm list eslint-config-next`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Verify next-auth 4.24.12 changelog confirms no breaking API changes for JWT/middleware usage
- **Rollout / rollback:**
  - Rollout: single commit with dep version bumps
  - Rollback: revert commit, `pnpm install`
- **Documentation impact:** None
- **Notes / references:**
  - Current: next-auth 4.24.11, eslint-config-next 15.3.8
  - next-intl ^3.5.0 is used only in `packages/template-app/src/i18n/request.ts` — minimal footprint. Upgrade to v4 deferred unless Next 16 peer dep requires it (to be checked during CHECKPOINT).

### TASK-04: Migrate synchronous params/searchParams — cover-me-pretty

- **Type:** IMPLEMENT
- **Deliverable:** Code change — async params/searchParams in cover-me-pretty app
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/cover-me-pretty/src/app/[lang]/collections/[slug]/page.tsx` (sync params + searchParams)
  - `apps/cover-me-pretty/src/app/[lang]/blog/page.tsx` (sync params + searchParams)
  - `apps/cover-me-pretty/src/app/[lang]/blog/[slug]/page.tsx` (sync params)
  - `apps/cover-me-pretty/src/app/[lang]/returns/page.tsx` (sync params in generateMetadata)
  - `apps/cover-me-pretty/src/app/[lang]/product/[slug]/page.tsx` (sync params)
  - `apps/cover-me-pretty/src/app/[lang]/success/page.tsx` (sync params)
  - `apps/cover-me-pretty/src/app/account/orders/[id]/page.tsx` (sync params in generateMetadata + Page)
  - `apps/cover-me-pretty/src/app/preview/[pageId]/page.tsx` (sync searchParams)
  - `apps/cover-me-pretty/src/app/api/password-reset/[token]/route.ts` (sync params)
  - `apps/cover-me-pretty/src/app/api/orders/[id]/route.ts` (sync params)
  - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` (sync params)
  - `apps/cover-me-pretty/src/app/api/collections/[id]/route.ts` (sync params)
  - `[readonly] apps/cover-me-pretty/src/app/[lang]/page.tsx` (already async — reference pattern)
  - `[readonly] apps/cover-me-pretty/src/app/[lang]/checkout/page.tsx` (already async — reference pattern)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — existing async pattern in same app to follow (`[lang]/page.tsx`, `[lang]/checkout/page.tsx`); mechanical transform
  - Approach: 92% — `params: Promise<T>` + `await params` is the only valid approach per Next 16
  - Impact: 85% — 12 files to modify; some have generateMetadata which also needs async params
- **Acceptance:**
  - All page/route files in cover-me-pretty use `Promise<>` for params and searchParams types
  - All params/searchParams access uses `await`
  - `pnpm --filter @apps/cover-me-pretty build --webpack` succeeds
  - TypeScript: no type errors in modified files
- **Validation contract:**
  - **TC-01:** `grep -r "params: {" apps/cover-me-pretty/src/app` returns zero matches (all converted to Promise) → passes
  - **TC-02:** `pnpm --filter @apps/cover-me-pretty build --webpack` exits 0 → passes
  - **TC-03:** `searchParams` typed as `Promise<>` in collections and blog pages → verified by read
  - **TC-04:** `generateMetadata` functions await params before use → verified by read
  - **Acceptance coverage:** TC-01,03 cover criteria 1,2; TC-02 covers criteria 3; TC-04 covers criteria 2
  - **Validation type:** unit (grep) + integration (build)
  - **Validation location:** `apps/cover-me-pretty/src/app/`
  - **Run:** `pnpm --filter @apps/cover-me-pretty build --webpack`
- **Execution plan:** Red → Green → Refactor
- **Scouts:**
  - Existing async pattern in same app → read `apps/cover-me-pretty/src/app/[lang]/page.tsx:36-39` → confirmed: `params: Promise<{ lang?: string }>` + `await params`
- **What would make this ≥90%:** Run the Next.js codemod `npx @next/codemod@canary upgrade latest` in a dry-run to see if it handles these automatically
- **Rollout / rollback:**
  - Rollout: commit with all async migrations for this app
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Reference pattern: `apps/cover-me-pretty/src/app/[lang]/checkout/page.tsx:25,42` — already uses `params: Promise<{ lang?: string }>`

### TASK-05: Migrate synchronous params/searchParams — cms + remaining routes

- **Type:** IMPLEMENT
- **Deliverable:** Code change — async params/searchParams in CMS app and remaining route files
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/cms/src/app/preview/[token]/page.tsx` (sync params)
  - `apps/cms/src/app/cms/shop/[shop]/sections/history/page.tsx` (sync params)
  - `apps/cms/src/app/cms/shop/[shop]/sections/presets/page.tsx` (sync params)
  - `apps/cms/src/app/cms/shop/[shop]/marketing/email/page.tsx` (sync params)
  - `apps/cms/src/app/api/smoke-tests/[shop]/route.ts` (sync params)
  - `apps/cms/src/app/api/sections/[shop]/history/route.ts` (sync params)
  - `apps/cms/src/app/api/sections/[shop]/presets/route.ts` (sync params)
  - `apps/cms/src/app/api/sections/[shop]/restore/route.ts` (sync params)
  - `apps/cms/src/app/api/auth/[...nextauth]/route.ts` (sync params — catch-all)
  - `[readonly] apps/cms/src/app/cms/themes/library/page.tsx` (uses `await headers()` — already async)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 82%
  - Implementation: 85% — same mechanical transform as TASK-04; CMS has more complex server components
  - Approach: 90% — same `Promise<>` + `await` pattern
  - Impact: 82% — CMS is the most complex app; auth route catch-all `[...nextauth]` needs care; 9 files to modify
- **Acceptance:**
  - All page/route files in cms use `Promise<>` for params types
  - All params access uses `await`
  - `[...nextauth]` route works correctly with async params
  - `pnpm --filter @apps/cms build --webpack` succeeds
  - TypeScript: no type errors in modified files
- **Validation contract:**
  - **TC-01:** `grep -r "params: {" apps/cms/src/app` returns zero matches for sync params patterns → passes
  - **TC-02:** `pnpm --filter @apps/cms build --webpack` exits 0 → passes
  - **TC-03:** CMS existing tests pass: `pnpm --filter @apps/cms test` exits 0 → passes
  - **TC-04:** `[...nextauth]` route handler correctly awaits params → verified by read
  - **Acceptance coverage:** TC-01 covers criteria 1,2; TC-02 covers criteria 4; TC-03 covers criteria 5; TC-04 covers criteria 3
  - **Validation type:** unit (grep) + integration (build + tests)
  - **Validation location:** `apps/cms/src/app/`
  - **Run:** `pnpm --filter @apps/cms build --webpack && pnpm --filter @apps/cms test`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Verify `[...nextauth]` route handler's exact params usage to confirm simple await is sufficient
- **Rollout / rollback:**
  - Rollout: commit with all async migrations for CMS
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - CMS already has async pattern for `headers()` in `apps/cms/src/app/cms/themes/library/page.tsx:21`

### TASK-06: CHECKPOINT — Mid-upgrade validation

- **Type:** CHECKPOINT
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 95%
- **Acceptance:**
  - Run `/re-plan` on all tasks after this checkpoint
  - Reassess remaining task confidence using evidence from completed tasks
  - Confirm or revise the approach for remaining work
  - Update plan with any new findings, splits, or abandoned tasks
- **Horizon assumptions to validate:**
  - `--webpack` flag works correctly and all apps build without errors
  - Async params migration didn't introduce runtime bugs (builds pass, tests pass)
  - `pnpm typecheck` passes across the full repo
  - `pnpm lint` passes across the full repo
  - next-intl ^3.5.0 works with Next 16 (or needs upgrade — to be determined here)
  - `experimental.externalDir` in CMS config is handled correctly

### TASK-07: Upgrade @opennextjs/cloudflare for Next 16

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated @opennextjs/cloudflare version + verified Cloudflare builds
- **Execution-Skill:** build-feature
- **Affects:**
  - `apps/brikette/package.json` (`@opennextjs/cloudflare`)
  - `apps/business-os/package.json` (`@opennextjs/cloudflare`)
  - `apps/xa/package.json` (`@opennextjs/cloudflare`)
  - `apps/cms/package.json` (`@opennextjs/cloudflare`)
  - `[readonly] apps/brikette/next.config.mjs` (verify OpenNext config compatibility)
  - `[readonly] apps/business-os/next.config.mjs` (verify OpenNext config compatibility)
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 82% — version bump is mechanical; OpenNext docs confirm Next 16 support
  - Approach: 85% — staying on OpenNext adapter is the correct path (already migrated from next-on-pages)
  - Impact: 80% — 4 apps use Cloudflare deploys; build pipeline may need adjustment if OpenNext's internal `next build` call doesn't pass `--webpack`
- **Acceptance:**
  - `@opennextjs/cloudflare` version supports Next 16 in all 4 apps
  - `opennextjs-cloudflare build` succeeds for at least one app (brikette or business-os)
  - Worker output is valid (dry-run wrangler deploy if possible)
- **Validation contract:**
  - **TC-01:** `pnpm list @opennextjs/cloudflare` shows version that supports Next 16 → passes
  - **TC-02:** `pnpm --filter @apps/business-os run build:worker` exits 0 → passes (business-os is simplest CF app)
  - **TC-03:** Worker output at `.open-next/` contains valid entry point → verified by file check
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02,03 cover criteria 2,3
  - **Validation type:** integration (build)
  - **Validation location:** `apps/business-os/.open-next/`
  - **Run:** `pnpm --filter @apps/business-os run build:worker`
- **Execution plan:** Red → Green → Refactor
- **Scouts:**
  - OpenNext Next 16 support → doc lookup (opennext.js.org/cloudflare) → confirmed: "All minor and patch versions of Next.js 16 are supported"
  - OpenNext internal `next build` invocation → needs verification: does it pass `--webpack` or does it need config?
- **What would make this ≥90%:** Successfully build one CF app end-to-end with Next 16 + OpenNext
- **Rollout / rollback:**
  - Rollout: bump @opennextjs/cloudflare in all 4 apps; deploy staging first (brikette staging)
  - Rollback: revert version bump
- **Documentation impact:** None
- **Notes / references:**
  - Current version: `^1.16.3`
  - OpenNext docs: https://opennext.js.org/cloudflare
  - MEMORY.md note: brikette staging uses static export (not OpenNext) — only production uses OpenNext

### TASK-08: Full test validation and regression fixes

- **Type:** IMPLEMENT
- **Deliverable:** Code change — fix any test failures or regressions from the Next 16 upgrade
- **Execution-Skill:** build-feature
- **Affects:**
  - Any test files that fail due to Next 16 changes (unknown scope until tests run)
  - `[readonly] apps/*/src/**/__tests__/*.{test,spec}.{ts,tsx}` (test files to run)
  - `[readonly] test/unit/__tests__/*.spec.ts` (repo-level test files)
- **Depends on:** TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% — running tests is straightforward; fixing failures depends on what breaks
  - Approach: 85% — test-then-fix is the standard approach for framework upgrades
  - Impact: 80% — unknown scope until tests run; may discover runtime behavior changes
- **Acceptance:**
  - `pnpm typecheck` passes
  - `pnpm lint` passes
  - `pnpm test:all` passes (or failures are pre-existing and documented)
  - No new test failures introduced by the Next 16 upgrade
- **Validation contract:**
  - **TC-01:** `pnpm typecheck` exits 0 → passes
  - **TC-02:** `pnpm lint` exits 0 → passes
  - **TC-03:** `pnpm test:all` exit code matches pre-upgrade baseline (no new failures) → passes
  - **TC-04:** Brikette-specific tests pass: `pnpm --filter brikette test` → passes (or pre-existing skips documented)
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02 covers criteria 2; TC-03,04 cover criteria 3,4
  - **Validation type:** integration (full test suite)
  - **Validation location:** repo-wide
  - **Run:** `pnpm typecheck && pnpm lint && pnpm test:all`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Know the exact set of test failures before starting (run tests at CHECKPOINT)
- **Rollout / rollback:**
  - Rollout: commit fixes as they are identified
  - Rollback: revert if regression count is unmanageable
- **Documentation impact:**
  - `docs/testing-policy.md` — update if any test skip patterns change
- **Notes / references:**
  - 13 tests currently skipped with `describe.skip` on brikette (pre-existing, see MEMORY.md)
  - Next 16 scroll-behavior change may affect brikette (`apps/brikette/src/styles/global.css:160` uses `scroll-behavior: smooth`) — Next 16 no longer overrides this, which is actually favorable

## Risks & Mitigations

- **Webpack flag not passed by OpenNext:** OpenNext internally calls `next build` — if it doesn't support `--webpack` passthrough, builds will fail. Mitigation: check OpenNext config options; may need to set turbopack opt-out via next.config.mjs turbopack config instead of CLI flag.
- **Undiscovered sync API usage:** Grep may miss edge cases (dynamic imports, helper functions wrapping params). Mitigation: `pnpm typecheck` will catch type errors; builds will fail on sync access.
- **next-intl peer dep conflict:** `next-intl ^3.5.0` may have a peer dep on `next ^14 || ^15` that rejects Next 16. Mitigation: check at CHECKPOINT; upgrade to v4 if needed (minimal usage — only `packages/template-app/src/i18n/request.ts`).
- **CMS webpack complexity:** CMS has the most extensive webpack config (hash guard, React aliases, pino deps). If `--webpack` has subtle behavior changes in Next 16, CMS build may fail. Mitigation: CMS build is an explicit validation step at CHECKPOINT.
- **`experimental.externalDir` removal:** If Next 16 removes this experimental flag, CMS config needs updating. Mitigation: checked at TASK-01; flag may now be default behavior.

## Observability

- Logging: monitor build output for Next 16 deprecation warnings
- Metrics: build time comparison (Next 15 vs 16 with --webpack) — informational only
- Alerts/Dashboards: CI pipeline will surface any build/test failures

## Acceptance Criteria (overall)

- [ ] All 14 Next.js apps build successfully on Next 16.x with `--webpack` flag
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:all` passes (no new test failures)
- [ ] Cloudflare builds succeed for brikette, business-os, xa, cms
- [ ] No Next.js 16 deprecation warnings in build output
- [ ] All async request APIs (params, searchParams, cookies, headers, draftMode) properly awaited

## Decision Log

- 2026-02-10: **Turbopack strategy → `--webpack` opt-out.** 9 of 14 apps have custom webpack config. Migrating to Turbopack is a separate effort. `--webpack` preserves existing behavior with minimal risk.
- 2026-02-10: **Middleware stays as `middleware.ts`.** All 3 middleware files (brikette, cms, business-os) use Edge runtime features. `proxy.ts` only supports Node runtime. No migration needed.
- 2026-02-10: **next-intl upgrade deferred.** Usage is minimal (1 file in template-app). Will check peer dep compatibility at CHECKPOINT and upgrade only if required.
- 2026-02-10: **next-auth stays on v4.** Upgrade to 4.24.12+ for Next 16 peer dep support, not to v5 (separate migration).
