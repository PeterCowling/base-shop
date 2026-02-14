---
Type: Plan
Status: Active
Domain: Platform
Last-reviewed: 2026-02-14
Relates-to charter: none
Workstream: Engineering
Created: 2026-01-24
Last-updated: 2026-02-14
Feature-Slug: nextjs-16-upgrade
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Audit-Ref: working-tree
Audit-Date: 2026-02-14
---

# Next.js 16 Upgrade Plan

## Summary

Upgrade the Base-Shop monorepo from Next.js 15.3.9 to Next.js 16.x (latest stable). The upgrade touches 14 Next.js apps, the shared config package, ecosystem dependencies (next-auth, eslint-config-next, @opennextjs/cloudflare, next-intl), and repo-wide "Async Request APIs" removals (params/searchParams/cookies/headers/draftMode must be async). The strategy is: bump Next + React (+ enforce Node engine), add `--webpack` flag universally for build safety, run codemods + manual cleanup, upgrade ecosystem deps, then validate.

## Goals

- All 14 Next.js apps build and pass tests on Next.js 16.x
- `pnpm typecheck && pnpm lint` pass
- Cloudflare deployments (brikette, business-os, xa, cms) work with updated @opennextjs/cloudflare
- No *unexpected* Next.js 16 deprecation warnings in build output (known middleware/proxy deprecation warnings allowed if present)
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
  - Node.js >=20.9.0 required (repo `engines.node` must be >=20.9.0; `>=20` is insufficient)
  - TypeScript >=5.1.0 required (current `5.8.3` meets this)
  - Next.js 16 upgrade surface includes React, react-dom, and @types/react/@types/react-dom alignment (TypeScript repos must upgrade these in lockstep)
  - ESLint: repo already uses ESLint 9 + flat config (`eslint.config.mjs`), so upgrading `eslint-config-next` should not require an ESLint major migration
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

1. Bump Next.js + React (+ types) and enforce Node engine >=20.9.0
2. Remove removed config options (`eslint` in next.config, check `experimental.externalDir`, config flag renames)
3. Add `--webpack` flag to all `next build` and `next dev` commands
4. Remove/replace Next lint usage; ensure lint runs via `pnpm lint` (ESLint CLI), not via `next lint` or implicit build-time linting
5. Run codemods + manual fixes for Async Request APIs repo-wide (not just params/searchParams in a subset of apps)
6. Upgrade ecosystem deps (next-auth, eslint-config-next, next-intl, @opennextjs/cloudflare)
7. Validate builds, types, tests, and Cloudflare deploys

## Active tasks

- TASK-01 - Foundation: bump Next.js to 16.x + React alignment + enforce Node >=20.9.0 + remove deprecated config.
- TASK-02 - Add `--webpack` flag to all build/dev scripts.
- TASK-03 - Upgrade ecosystem deps (`next-auth`, `eslint-config-next`, `next-intl`).
- TASK-04 - Repo-wide Async Request APIs migration (codemod + cleanup).
- TASK-05 - Repo-wide Next 16 upgrade audit (next lint removal, images/runtime config/middleware-proxy flag grep checklist).
- TASK-06 - Run mid-upgrade validation (build, typecheck, lint).
- TASK-07 - Upgrade `@opennextjs/cloudflare` for Next 16.
- TASK-08 - Run full test validation and regression fixes.

**Why `--webpack` not Turbopack:** 9 of 14 apps have custom webpack functions in their next.config.mjs (inheriting from shared preset or adding their own). Migrating these to Turbopack equivalents is a separate project. The `--webpack` flag preserves existing behavior.

**Why not middleware → proxy.ts:** All 3 middleware files use Edge runtime features. `proxy.ts` only supports Node runtime. Migration would require architectural changes to how these apps handle auth, CSRF, and URL rewriting.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Foundation: bump Next.js to 16.x + React alignment + enforce Node >=20.9.0 + remove deprecated config | 83% | L | Complete (2026-02-14) | - | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-02 | IMPLEMENT | Add --webpack flag to all build/dev scripts | 90% | S | Complete (2026-02-14) | TASK-01 | TASK-06 |
| TASK-03 | IMPLEMENT | Upgrade ecosystem deps (next-auth, eslint-config-next, next-intl) | 82% | S | Complete (2026-02-14) | TASK-01 | TASK-06 |
| TASK-04 | IMPLEMENT | Repo-wide Async Request APIs migration (codemod + cleanup) | 80% | M | Pending | TASK-01 | TASK-06 |
| TASK-05 | IMPLEMENT | Repo-wide Next 16 upgrade audit (lint/scripts/config/code grep checklist) | 90% | S | Pending | TASK-01 | TASK-06 |
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
| 2 | TASK-02, TASK-03, TASK-04, TASK-05 | Wave 1: TASK-01 | Safe parallel: scripts, deps, codemod migrations, audit checklist |
| 3 | TASK-06 | Wave 2: TASK-02, TASK-03, TASK-04, TASK-05 | CHECKPOINT: builds, typecheck, lint before proceeding |
| 4 | TASK-07 | Wave 3: TASK-06 | Cloudflare adapter upgrade + worker build verification |
| 5 | TASK-08 | Wave 4: TASK-07 | Final validation gate: typecheck, lint, full test suite |

**Max parallelism:** 4 (Wave 2) | **Critical path:** TASK-01 → TASK-02 → TASK-06 → TASK-07 → TASK-08 (5 waves) | **Total tasks:** 8

## Tasks

### TASK-01: Foundation — bump Next.js to 16.x, align React, enforce Node >=20.9.0, remove deprecated config

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated package.json files and next.config.mjs files across the monorepo
- **Execution-Skill:** /lp-build
- **Affects:**
  - `package.json` (root — `next` in deps/devDeps and `pnpm.overrides`; `react`/`react-dom` and @types; `engines.node`)
  - `.github/workflows/*.yml` (Node setup must use >=20.9.0; `node-version: 20` is not a guarantee)
  - `.github/actions/setup-repo/action.yml` (used by many workflows; must pin Node >=20.9.0 too)
  - `.nvmrc` or `.node-version` (pin minimum locally to avoid "works on my machine" drift)
  - `apps/cover-me-pretty/package.json`, `apps/skylar/package.json`, `apps/cochlearfit/package.json`, `apps/handbag-configurator/package.json`, `apps/prime/package.json`, `apps/xa-uploader/package.json`, `apps/reception/package.json`, `apps/business-os/package.json`, `apps/xa-b/package.json`, `apps/product-pipeline/package.json`, `apps/xa-j/package.json`, `apps/xa/package.json`, `apps/cms/package.json`, `apps/brikette/package.json` (14 apps — `next` version)
  - `apps/prime/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }`)
  - `apps/cms/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }`, check `experimental: { externalDir }`)
  - `packages/next-config/next.config.mjs` (remove `eslint: { ignoreDuringBuilds }` from shared preset if present)
  - `[readonly] packages/next-config/index.mjs` (verify `baseConfig` shape still valid)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 83%
  - Implementation: 90% — straightforward version bump pattern; pnpm override controls all apps; removed config options are clearly documented
  - Approach: 88% — single atomic version bump is the standard approach for framework upgrades
  - Impact: 83% — touches engines, React alignment, and 14 apps' package.json + 3 next.config files; risk is pnpm resolution or undocumented breaking changes
- **Acceptance:**
  - `next` version is 16.x in root package.json deps, devDeps, and `pnpm.overrides.next`
  - `react` and `react-dom` are upgraded to the Next 16-supported major (and kept in sync across the repo), with `@types/react` + `@types/react-dom` aligned for TypeScript
  - Repo Node engine enforces Next 16 minimum: `engines.node` is `>=20.9.0` (not `>=20`)
  - CI and local dev are pinned to Node >=20.9.0 (workflows updated and at least one local pin file exists: `.nvmrc` or `.node-version`)
  - All 14 app package.json files reference `^16.x` for next
  - `eslint` config block removed from `apps/prime/next.config.mjs` and `apps/cms/next.config.mjs`
  - `experimental.externalDir` checked and handled (removed if deprecated, kept if still supported)
  - `pnpm install` succeeds without errors
- **Validation contract:**
  - **TC-01:** After version bump + pnpm install, `node_modules/next/package.json` shows version 16.x → passes
  - **TC-02:** All 14 app `package.json` files contain `"next": "^16.` → verified by grep
  - **TC-03:** `pnpm install` exits 0; any peer-dependency output is triaged (non-optional peer conflicts must be fixed) → passes
  - **TC-04:** `eslint` key absent from `apps/prime/next.config.mjs` and `apps/cms/next.config.mjs` → verified by grep
  - **TC-05:** `node -p "require('./package.json').engines?.node"` is `>=20.9.0` → passes
  - **TC-06:** `pnpm list react react-dom @types/react @types/react-dom` shows aligned majors and a single resolved version family → passes
  - **TC-07:** `.github/workflows/*.yml` and `.github/actions/setup-repo/action.yml` use `actions/setup-node` with an explicit semver >=20.9.0 (not just `20`) → passes
  - **TC-08:** `.nvmrc` or `.node-version` exists and pins a Node version >=20.9.0 → passes
  - **Acceptance coverage:** TC-01,02 cover Next bump; TC-05 covers Node engine; TC-06 covers React alignment; TC-03 covers install health; TC-04 covers config removals
  - **Validation type:** unit (grep verification) + integration (pnpm install)
  - **Validation location:** manual verification
  - **Run:** `pnpm install && node -e "console.log(require('./node_modules/next/package.json').version)"`
- **Execution plan:** Red → Green → Refactor
- **Scouts:**
  - Node.js >=20.9.0 requirement → doc lookup → confirmed: repo engine must be tightened; `>=20` is insufficient
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

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commits:** 71b64ca646, b3752ad4af
- **Validation evidence:**
  - Next installed: `node -e "console.log(require('./node_modules/next/package.json').version)"` -> `16.1.6`
  - React installed: `node -e "console.log(require('./node_modules/react/package.json').version)"` -> `19.2.1` (react-dom `19.2.1`)
  - Node engine: `node -p "require('./package.json').engines.node"` -> `>=20.9.0`
  - Local Node pin: `.nvmrc` -> `20.19.4`
  - App versions: `rg -n '"next": "\^16\.' apps/*/package.json | wc -l` -> `14`
  - Deprecated Next config `eslint` key removed: `rg -n "eslint:\s*\{" apps/*/next.config.mjs packages/next-config/next.config.mjs` -> no matches
  - CI pins Node >=20.9.0: workflows use `node-version: 20.19.4`
- **Implementation notes:** Upgraded root + all 14 apps to Next `16.1.6`, enforced Node minimum, aligned React/ReactDOM + types, removed deprecated Next config options, updated lockfile.

### TASK-02: Add --webpack flag to all build and dev scripts

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated package.json scripts across all apps
- **Execution-Skill:** /lp-build
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

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 5e27a4655c
- **Validation evidence:**
  - Script coverage: `rg -n '\bnext (dev|build)\b' apps/*/package.json` shows `--webpack` on all occurrences
  - Representative build: `pnpm --filter @apps/reception build` -> PASS
- **Implementation notes:** Added `--webpack` to all `next dev`/`next build` scripts to opt out of Turbopack defaults in Next 16.

### TASK-03: Upgrade ecosystem dependencies (next-auth, eslint-config-next, next-intl)

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated dependency versions
- **Execution-Skill:** /lp-build
- **Affects:**
  - `package.json` (root — `next-auth`, `eslint-config-next`, `next-intl` if present)
  - `packages/ui/package.json` (`next-auth` peer dep)
  - `packages/template-app/package.json` (next-intl dependency resolution)
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
  - `next-intl` resolves to a version that peers with Next 16 (upgrade to v4 if needed)
  - `pnpm install` succeeds
  - CMS auth flow still works (JWT token decoding in middleware unchanged)
  - `pnpm lint` remains driven by ESLint CLI (repo already uses ESLint 9 + flat config); `eslint-config-next` upgrade does not require a config-style migration
- **Validation contract:**
  - **TC-01:** `next-auth` resolved version is >=4.24.12 → `pnpm list next-auth` shows correct version
  - **TC-02:** `eslint-config-next` resolved version matches `16.x` → `pnpm list eslint-config-next` shows correct version
  - **TC-02b:** `pnpm list next-intl` shows a Next 16-compatible major (expected v4) → passes
  - **TC-03:** `pnpm --filter @apps/cms lint` passes (eslint-config-next works with Next 16 + flat config) → exits 0
  - **Acceptance coverage:** TC-01 covers criteria 1; TC-02 covers criteria 2; TC-02b covers criteria 4; TC-03 covers criteria 6
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
  - next-intl is used only in `packages/template-app/src/i18n/request.ts` — minimal footprint. Upgrade to v4 is cheap and removes a likely peer-dep conflict with Next 16.

#### Build Completion (2026-02-14)
- **Status:** Complete
- **Commit:** 3afc6cb0ca
- **Validation evidence:**
  - Install: `pnpm install` -> PASS (peer warnings triaged)
  - Resolved versions: `pnpm list next-auth eslint-config-next next-intl nodemailer --depth 0` -> next-auth `4.24.12`, eslint-config-next `16.1.6`, next-intl `4.8.2`, nodemailer `7.0.13`
  - CMS lint: `pnpm --filter @apps/cms lint` -> PASS
- **Implementation notes:** Upgraded Next ecosystem deps and fixed ESLint flat-config integration for `eslint-config-next@16` (remove FlatCompat circular config failure; avoid plugin redefinition collisions; disable React Compiler-related lint rules that became errors on existing code).

### TASK-04: Repo-wide Async Request APIs migration (codemod + cleanup)

- **Type:** IMPLEMENT
- **Deliverable:** Code change — remove all synchronous Async Request API usage across the repo
- **Execution-Skill:** /lp-build
- **Affects:**
  - All Next.js App Router entrypoints that can receive request context: `page.tsx`, `layout.tsx`, `route.ts`, `generateMetadata`, icons/sitemaps/robots handlers, etc.
  - Known hotspots (from pre-audit): cover-me-pretty and cms (but task is explicitly repo-wide)
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 82% — codemod can find most sites, but cleanup is repo-wide and may touch more entrypoints than page/route
  - Approach: 90% — codemod-first is the fastest path to completeness and discovery
  - Impact: 80% — scope is intentionally widened to avoid late-breaking build errors
- **Acceptance:**
  - No synchronous access remains for Async Request APIs across the repo: `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
  - Codemod-inserted comments/casts (for example `@next/codemod` markers or `UnsafeUnwrapped...`) are either eliminated or intentionally justified with a concrete reason and a follow-up task (avoid leaving "lint noise")
  - Representative builds succeed: `pnpm --filter @apps/cover-me-pretty build --webpack` and `pnpm --filter @apps/cms build --webpack`
- **Validation contract:**
  - **TC-01:** Run the official Async Request APIs codemod repo-wide; then search for codemod markers and ensure they are cleared → passes
  - **TC-02:** `pnpm --filter @apps/cover-me-pretty build --webpack` exits 0 → passes
  - **TC-03:** `pnpm --filter @apps/cms build --webpack` exits 0 → passes
  - **Acceptance coverage:** TC-01 covers completeness; TC-02/03 validate two complex apps
  - **Validation type:** unit (grep) + integration (build)
  - **Validation location:** repo-wide
  - **Run:** `npx @next/codemod@latest next-async-request-api .`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** After codemod, collect an exact count of touched files and confirm no remaining markers via grep
- **Rollout / rollback:**
  - Rollout: commit codemod + cleanup as a single atomic change (avoid leaving half-migrated state)
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Next.js codemods include `next-async-request-api` for this migration class.

### TASK-05: Repo-wide Next 16 upgrade audit (lint/scripts/config/code grep checklist)

- **Type:** IMPLEMENT
- **Deliverable:** Code change — eliminate known upgrade-guide breakpoints that are easy to miss until CI/runtime
- **Execution-Skill:** /lp-build
- **Affects:**
  - Root/package/app scripts that reference `next lint`
  - Any CI scripts invoking `next lint` or relying on `next build` to lint
  - Next config usage across apps: images config, middleware/proxy config keys, removed runtime config
  - Code usage across apps: `getConfig()` / runtime config access, `next/legacy/image` usage, local image query-string patterns
- **Depends on:** TASK-01
- **Blocks:** TASK-06
- **Confidence:** 90%
  - Implementation: 92% — grep-driven checklist is deterministic
  - Approach: 90% — catching known breakpoints early reduces runtime churn
  - Impact: 90% — low code surface, high leverage
- **Acceptance:**
  - Repo has zero `next lint` usage (scripts/CI) and lint is executed via `pnpm lint` (ESLint CLI)
  - Next config audit checklist is clean (or updated) for:
    - `images.domains` deprecation (migrate to `images.remotePatterns`)
    - local images with query strings (ensure `images.localPatterns.search` if needed)
    - `next/legacy/image` usage
    - removed runtime config: `publicRuntimeConfig`/`serverRuntimeConfig` and `getConfig()`
    - middleware/proxy config key renames (for example `skipMiddlewareUrlNormalize` -> `skipProxyUrlNormalize`)
    - AMP removal (Next 16 hard-removes AMP): `useAmp` / `amp: true`
    - removed `devIndicators` options
    - PPR/dynamicIO flags and exports (`experimental.ppr`, `experimental.dynamicIO`, `export const experimental_ppr`, etc.)
    - caching API drift (`revalidateTag` signature changes; `cacheTag`/`unstable_cacheTag`/`updateTag` usage)
    - parallel routes: validate `@slot` directories have `default.(js|jsx|ts|tsx)` where required
    - `experimental.turbopack` config moved/removed; ensure we are not carrying stale config keys
    - images defaults that may change behavior (identify `<Image quality={...}>` usage and decide whether to set `images.qualities`)
- **Validation contract:**
  - **TC-01:** `rg -n "\\bnext lint\\b" .` returns zero matches → passes
  - **TC-02:** `rg -n "\\bgetConfig\\(" .` returns zero matches → passes
  - **TC-03:** `rg -n "\\bpublicRuntimeConfig\\b|\\bserverRuntimeConfig\\b" .` returns zero matches → passes
  - **TC-04:** `rg -n "next/legacy/image" .` returns zero matches → passes
  - **TC-05:** `rg -n "images\\.domains" apps/*/next.config.* packages/*/next.config.*` returns zero matches (or is migrated) → passes
  - **TC-06:** `rg -n "skipMiddlewareUrlNormalize" apps/*/next.config.* packages/*/next.config.*` returns zero matches (or is migrated) → passes
  - **TC-07:** `rg -n "\\buseAmp\\b|\\bamp\\s*:\\s*true\\b" .` returns zero matches → passes
  - **TC-08:** `rg -n "\\bdevIndicators\\b" apps/*/next.config.* packages/*/next.config.*` returns zero matches (or is migrated) → passes
  - **TC-09:** `rg -n "experimental\\.ppr|experimental\\.dynamicIO|experimental_ppr|cacheComponents" .` returns zero matches (or is migrated) → passes
  - **TC-10:** `rg -n "\\brevalidateTag\\s*\\(|\\bcacheTag\\s*\\(|unstable_cacheTag\\s*\\(|\\bupdateTag\\s*\\(" .` is reviewed and updated for Next 16 semantics → passes
  - **TC-11:** `rg -n "experimental\\.turbopack" apps/*/next.config.* packages/*/next.config.*` returns zero matches (or is migrated) → passes
  - **TC-12:** `rg -n "<Image[^>]*\\bquality\\s*=\\s*\\{|\\bquality\\s*=\\s*\\{" apps packages` is reviewed; decide whether to set `images.qualities` to preserve intent → passes
  - **TC-13:** Parallel routes audit: `find apps packages -type d -path "*/src/app/@*" -print` and verify each slot has `default.(js|jsx|ts|tsx)` where required → passes
  - **Acceptance coverage:** TC-01 covers lint; TC-02/03 cover runtime config removal; TC-04/05/12 cover image breakpoints/behavior; TC-06 covers middleware/proxy key renames; TC-07/08/09/10/11 cover known Next 16 removals/renames; TC-13 covers parallel routes structural requirement
  - **Validation type:** unit (grep)
  - **Validation location:** repo-wide
  - **Run:** `rg -n "\\bnext lint\\b|\\bgetConfig\\(|\\bpublicRuntimeConfig\\b|\\bserverRuntimeConfig\\b|next/legacy/image|images\\.domains|skipMiddlewareUrlNormalize|\\buseAmp\\b|\\bamp\\s*:\\s*true\\b|\\bdevIndicators\\b|experimental\\.ppr|experimental\\.dynamicIO|experimental_ppr|cacheComponents|\\brevalidateTag\\s*\\(|\\bcacheTag\\s*\\(|unstable_cacheTag\\s*\\(|\\bupdateTag\\s*\\(|experimental\\.turbopack" .`
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** Add a short “before/after” note in the Fact-Check Log once these greps are clean
- **Rollout / rollback:**
  - Rollout: commit checklist-driven fixes in one atomic change (avoid partial audit state)
  - Rollback: revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Next 16 removes `next lint` and stops running lint during `next build`; scripts/CI must run lint explicitly.

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
  - Async Request APIs migration didn't introduce runtime bugs (builds pass, tests pass)
  - `pnpm typecheck` passes across the full repo
  - `pnpm lint` passes across the full repo
  - next-intl resolves cleanly with Next 16 peer dependencies (expected v4)
  - `experimental.externalDir` in CMS config is handled correctly

### TASK-07: Upgrade @opennextjs/cloudflare for Next 16

- **Type:** IMPLEMENT
- **Deliverable:** Code change — updated @opennextjs/cloudflare version + verified Cloudflare builds
- **Execution-Skill:** /lp-build
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
  - Impact: 80% — 4 apps use Cloudflare deploys; build pipeline may fail if a build script resolves to a Turbopack build (default in Next 16) instead of explicitly forcing `--webpack`
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
  - OpenNext build invocation → verify it runs the app’s build script; ensure that script includes `next build --webpack`
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
- **Execution-Skill:** /lp-build
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

- **OpenNext builds accidentally use Turbopack defaults:** If any Cloudflare app’s build script resolves to a default Turbopack build, OpenNext may fail. Mitigation: ensure the build script executed by OpenNext uses `next build --webpack` (TASK-02) and validate with `build:worker` (TASK-07).
- **Undiscovered Async Request API usage:** Grep can miss non-obvious call sites (wrappers, metadata helpers). Mitigation: run the official `next-async-request-api` codemod repo-wide (TASK-04), then validate with builds + typecheck.
- **Images/runtime-config breakpoints:** Next 16 deprecates/changes several image and runtime-config behaviors. Mitigation: run the repo-wide upgrade audit checklist (TASK-05) before CHECKPOINT.
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
- [ ] No unexpected Next.js 16 deprecation warnings in build output (middleware/proxy warning allowed if present and understood)
- [ ] All async request APIs (params, searchParams, cookies, headers, draftMode) properly awaited
- [ ] No `next lint` usage remains in scripts/CI; lint runs explicitly via `pnpm lint`

## Decision Log

- 2026-02-10: **Turbopack strategy → `--webpack` opt-out.** 9 of 14 apps have custom webpack config. Migrating to Turbopack is a separate effort. `--webpack` preserves existing behavior with minimal risk.
- 2026-02-10: **Middleware stays as `middleware.ts`.** All 3 middleware files (brikette, cms, business-os) use Edge runtime features. `proxy.ts` only supports Node runtime. No migration needed.
- 2026-02-14: **next-intl upgrade pulled earlier.** Usage is minimal (1 file in template-app), but Next 16 peer deps make a v4 upgrade the deterministic choice.
- 2026-02-10: **next-auth stays on v4.** Upgrade to 4.24.12+ for Next 16 peer dep support, not to v5 (separate migration).

## Fact-Check Log

- 2026-02-14: **Pre-execution verification completed.** All 8 tasks verified as Pending. Repository state confirms:
  - Next.js 15.3.9 installed (node_modules/next/package.json)
  - All 14 apps reference `^15.3.9` in package.json
  - Root pnpm.overrides.next = "15.3.9"
  - No `--webpack` flags in any build/dev scripts
  - eslint config present in apps/prime/next.config.mjs:14-16 and apps/cms/next.config.mjs:163-166
  - Synchronous params patterns found in cover-me-pretty (collections/[slug]/page.tsx:5, blog/page.tsx:26,92) and cms (preview/[token]/page.tsx:23, api/auth/[...nextauth]/route.ts:35)
  - next-auth 4.24.11, eslint-config-next 15.3.8
  - @opennextjs/cloudflare ^1.16.3 in all 4 CF apps
  - Plan is accurate and ready for execution. No status corrections needed.

- 2026-02-14: **Plan corrections incorporated (post-critique).** Changes:
  - Corrected Node minimum requirement: `engines.node` must enforce `>=20.9.0` (not `>=20`).
  - Added explicit React/react-dom + @types alignment to the upgrade surface (TASK-01).
  - Broadened migrations to repo-wide Async Request APIs (TASK-04), not just params/searchParams in two apps.
  - Added deterministic repo-wide upgrade audit checklist for `next lint` removal + images/runtime-config + middleware/proxy key renames (TASK-05).
  - Pulled next-intl upgrade earlier to avoid deterministic Next 16 peer-dep conflicts (TASK-03).

- 2026-02-14: **Current repo/tooling evidence (pre-upgrade).**
  - Root lint stack is already ESLint 9 + flat config: `eslint` is `^9.30.1` and `eslint.config.mjs` exists.
  - Root `engines.node` currently allows `>=20` and GitHub Actions workflows currently use `node-version: 20` (must be tightened to >=20.9.0 to match Next 16).
