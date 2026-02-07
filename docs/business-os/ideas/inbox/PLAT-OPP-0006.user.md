---
Type: Idea
ID: PLAT-OPP-0006
Business: PLAT
Status: Draft
Owner: Pete
Created-Date: 2026-02-06
Tags: [ci, deploy, staging, build-time, developer-experience, local-validation, cloudflare]
Last-updated: 2026-02-06
---

# Faster staging deploys: tailored CI and local pre-flight validation

## Summary

Radically reduce the number of CI cycles needed to get an app to staging by (a) making CI pipelines app-aware and change-aware instead of one-size-fits-all, and (b) catching platform-specific deployment failures locally before pushing.

## The problem

The brikette staging deployment took **82 CI runs** to get working. Each run takes 8-15 minutes. That's roughly **12-20 hours of wall-clock CI time** for what is fundamentally a deployment configuration task.

The root causes fall into two categories:

### 1. CI is not tailored to what changed

The current `reusable-app.yml` runs a fixed pipeline for every app: lint, typecheck, test, build, deploy. This means:

- **Unchanged code gets retested.** If only a workflow YAML or deploy config changed, the full lint/typecheck/test suite still runs. For brikette that's 4098 pages being pre-rendered even when the change was a one-line YAML edit.
- **No change-set awareness.** The pipeline doesn't know which files changed, so it can't skip irrelevant steps. A README change triggers the same pipeline as a core component refactor.
- **No fast-path for deploy-only changes.** Edits to `brikette.yml`, `wrangler.toml`, `_redirects`, or deploy scripts should skip app tests entirely and go straight to build+deploy.
- **Build configuration is validated only at build time.** Next.js `output: 'export'` has strict constraints (no catch-all routes, no conditional config exports, no route handlers in dynamic segments). These are only discovered when the full build runs in CI, not before.

### 2. Platform-specific failures are invisible locally

Five of the CI failures in the brikette deployment were caused by Next.js static export constraints that are well-defined and deterministic — they could have been caught before pushing:

1. **Catch-all routes (`[...slug]`)** don't work with `output: 'export'` even with `generateStaticParams`
2. **Route handlers in `[param]` directories** can't use `generateStaticParams` with static export
3. **Conditional expressions in config exports** (`dynamic`, `revalidate`) fail Next.js static analysis
4. **Cloudflare Image Resizing** not available on free Pages tier (wrong `buildCfImageUrl` path used)
5. **Cache headers check** fails on static Pages (no Worker to set headers)

Each of these was discovered one-at-a-time via CI, requiring a fix-commit-push-wait cycle each time. A local pre-flight check could have caught all five in seconds.

Similarly, Cloudflare-specific constraints (free tier limits, missing features, Worker size budgets) are only surfaced at deploy time. There's no local validation that says "this build configuration is incompatible with your target platform."

## Opportunity

### A. App-aware, change-aware CI

Instead of a monolithic pipeline, make CI smart about what changed:

- **Change-set detection:** Classify changes as code-only, config-only, deploy-only, or mixed. Skip irrelevant steps.
- **Fast path for deploy changes:** If only workflow YAML, wrangler config, or deploy scripts changed → skip lint/typecheck/test → build+deploy only.
- **Incremental testing:** Only run tests for packages whose source files actually changed (Turborepo already supports `--filter=...[HEAD~1]`).
- **Build caching:** Cache the Next.js build output between runs when source hasn't changed. Only rebuild what's needed.
- **App-specific pipeline profiles:** Different apps have different needs. Brikette's staging deploy (static export) has fundamentally different constraints than a Worker production deploy. The pipeline should reflect this.

### B. Local pre-flight validation

A script or tool that catches deployment failures before pushing:

- **Static export compatibility check:** Scan the app's route tree and flag incompatible patterns (catch-all routes, route handlers in dynamic segments, conditional config exports) — all without running a full build.
- **Platform constraint check:** Given a target (e.g., "Cloudflare Pages free tier"), validate that the build config is compatible: no Image Resizing URLs in client code, no middleware reliance, Worker size within budget.
- **Quick local build smoke test:** Run `next build` with `output: 'export'` locally in a fast mode (skip pre-rendering, just validate the route tree and config).
- **Deploy config linter:** Validate `brikette.yml` build commands against known constraints (are all incompatible routes being hidden? are env vars set?).

## What this looks like in practice

**Before (current state):**
```
edit → push → wait 10 min → CI fails → read logs → fix → push → wait 10 min → repeat x82
```

**After:**
```
edit → run local pre-flight (30 sec) → catches 5 issues → fix all → push → CI runs tailored pipeline (3 min) → deploy
```

## Success criteria

- **Reduce CI cycles for deploy config changes by 80%** (from ~82 to <15 for a comparable task)
- **Reduce wall-clock time per CI run by 50%** for deploy-only changes (skip lint/typecheck/test when only deploy config changed)
- **Catch >90% of static export incompatibilities locally** before pushing
- **Catch platform constraint violations locally** (free tier limits, missing features)
- **No regression in quality gates** — code changes still get full lint/typecheck/test

## Assumptions

- Turborepo's `--filter` and change detection can be leveraged for incremental CI
- Next.js route tree structure is parseable without running a full build (file system conventions)
- The static export constraints are well-defined enough to encode as lint rules
- GitHub Actions supports conditional step execution based on changed files (it does, via `paths` filters and `dorny/paths-filter` action)

## Rough approach (for fact-find to validate)

1. **Phase 1: Change-set aware CI** — Add a "classify changes" step to `reusable-app.yml` that determines which pipeline stages to run. Use `dorny/paths-filter` or similar. Quick win, high impact.
2. **Phase 2: Local pre-flight script** — `scripts/preflight-deploy.sh <app> <target>` that validates route tree compatibility, platform constraints, and deploy config. Catches the "five failures in a row" class of problems.
3. **Phase 3: Build caching** — Leverage Turborepo remote caching or GitHub Actions cache to avoid redundant builds. Bigger lift, needs measurement.
4. **Phase 4: App pipeline profiles** — Allow apps to declare their pipeline profile (static-export, worker, full-ssr) and have CI adapt accordingly.

## Relationship to other work

- **`.github/workflows/reusable-app.yml`** — The shared CI workflow that would be modified
- **`.github/workflows/brikette.yml`** — First consumer of tailored CI
- **`docs/brikette-deploy-decisions.md`** — Documents the static export gotchas that local pre-flight would catch
- **`.claude/skills/deploy-brikette/SKILL.md`** — Deploy skill would invoke pre-flight checks
- **PLAT-OPP-0003** / **PLAT-OPP-0004** — Other platform efficiency ideas (if they exist)

## Evidence from this session

The 82-run brikette deployment is the direct catalyst. Specific failures that local validation would have caught:

| CI Run | Failure | Local-catchable? |
|--------|---------|-----------------|
| ~10-15 | `[...slug]` missing generateStaticParams | Yes — route tree scan |
| ~16-20 | catch-all routes don't work with export even with generateStaticParams | Yes — known constraint |
| ~21-25 | ConditionalExpression in `dynamic` export | Yes — AST lint rule |
| ~26-30 | draft routes with ternary config exports | Yes — AST lint rule |
| ~35-40 | Image 404s (wrong buildCfImageUrl file edited) | Partially — import path validation |
| ~41-45 | Cache headers check on free tier | Yes — platform constraint check |
