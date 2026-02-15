---
Type: Plan
Status: Active
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
Overall-confidence: 78%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Next.js 16 Upgrade Completion Plan (Post-Upgrade Hardening)

## Summary
Next.js 16 is already in the repo (Next 16.1.6 + React 19.2.1 + ESLint 9 toolchain). This plan covers the remaining "upgrade-guide" hard-break and deprecation surface that can still cause build/runtime issues:
- remove remaining synchronous route handler `params` signatures (async request API enforcement)
- establish a middleware/proxy runtime policy per app, then fix middleware ambiguity + Node-only imports accordingly
- audit/lock down Next/Image behavior drift and Next 16 operational changes (notably `.next/dev` output)

## Goals
- All Next apps build on Next 16 with `--webpack`
- No remaining synchronous request API access (`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`), including route handler signatures
- Middleware/proxy usage is intentional per app, with runtime-compatible dependencies
- Next/Image behavior drift is audited and pinned where needed (avoid silent regressions)
- Tooling/scripts are resilient to `.next/dev` output changes

## Non-goals
- Turbopack migration (this repo intentionally forces Webpack with `--webpack`)
- React Compiler rollout (optional future work)
- Large refactors of middleware logic beyond what is needed for correctness and runtime compatibility

## Constraints & Assumptions
- Constraints:
  - Keep `--webpack` in `next dev` and `next build` scripts (custom webpack present across apps).
  - `proxy.ts` is Node-only per Next 16 guidance; Edge runtime is not supported in proxy.
- Assumptions:
  - Node >=20.9.0 is enforced via `.nvmrc` and CI pins.
  - TypeScript >=5.1.0 is satisfied (repo uses 5.8.3).

## Fact-Find Reference
- Related brief: `docs/plans/nextjs-16-upgrade/fact-find.md`
- Legacy execution plan (phase 1 upgrade): `docs/plans/nextjs-16-upgrade-plan.md`

## Existing System Notes
- Shared Next config:
  - `packages/next-config/index.mjs` (base config; includes `images.qualities: [75, 80, 85, 90]`)
  - `packages/next-config/next.config.mjs` (webpack preset + aliases)
- Known remaining hard-break surface (from fact-find):
  - Residual sync route handler `params` typing in:
    - `apps/cms/src/app/api/auth/[...nextauth]/route.ts`
    - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts`
  - Middleware ambiguity in CMS:
    - `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` both present
  - Node-only imports in middleware entrypoints:
    - `apps/cover-me-pretty/middleware.ts` imports `node:crypto`
    - `apps/cms/middleware.ts` imports `crypto` and `helmet`
    - `apps/cms/src/middleware.ts` imports `helmet` (and Node `http` types), which is not Edge-compatible
    - Cloudflare/OpenNext apps (`apps/brikette`, `apps/business-os`, `apps/xa`, `apps/cms`) may not be eligible for `proxy.ts` because the deployment runtime is Worker/Edge, not a full Node.js server

## Proposed Approach
1. Fix deterministic hard-breakers (route handler signatures) first.
2. Inventory middleware entrypoints and classify each app as "Edge-required" vs "Node-OK" for request interception.
3. Audit Next/Image behavior drift and `.next/dev` output layout assumptions (low-risk discovery tasks).
4. CHECKPOINT: scoped validation + replan for middleware/proxy work and any image pinning.
5. Execute middleware/proxy consolidation and image config changes with per-app validation.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix remaining sync route handler `params` signatures (Next 16 async enforcement) | 90% | S | Pending | - | TASK-05 |
| TASK-02 | INVESTIGATE | Inventory request interception runtime per app (middleware vs proxy) | 82% | S | Pending | - | TASK-05, TASK-03, TASK-04 |
| TASK-06 | INVESTIGATE | Next/Image behavior drift audit (defaults + usage patterns) and decide pinning | 85% | S | Pending | - | TASK-05, TASK-07 |
| TASK-08 | IMPLEMENT | Audit tooling/scripts for `.next/dev` output changes; fix any brittle assumptions | 80% | S | Pending | - | TASK-05 |
| TASK-05 | CHECKPOINT | Post-hardening checkpoint: scoped builds + typecheck + lint; replan remaining tasks | 95% | S | Pending | TASK-01, TASK-02, TASK-06, TASK-08 | TASK-03, TASK-04, TASK-07 |
| TASK-03 | IMPLEMENT | Resolve CMS middleware ambiguity and enforce runtime-compatible dependencies | 78% ⚠️ | M | Pending | TASK-02, TASK-05 | - |
| TASK-04 | IMPLEMENT | Fix Node-only imports in middleware by migrating to proxy or rewriting for Edge | 70% ⚠️ | L | Pending | TASK-02, TASK-05 | - |
| TASK-07 | IMPLEMENT | Apply Next/Image config pinning (if required) + smoke validation | 75% ⚠️ | M | Pending | TASK-06, TASK-05 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-02, TASK-06, TASK-08 | - | Independent fixes/audits |
| 2 | TASK-05 | Wave 1: TASK-01, TASK-02, TASK-06, TASK-08 | CHECKPOINT gate before riskier runtime work |
| 3 | TASK-03, TASK-04, TASK-07 | Wave 2: TASK-05 | Middleware/proxy and image pinning depend on checkpoint |

**Max parallelism:** 4 (Wave 1)
**Critical path:** TASK-02 -> TASK-05 -> TASK-04 (3 waves)
**Total tasks:** 8

## Tasks

### TASK-01: Fix Remaining Sync Route Handler `params` Signatures
- **Type:** IMPLEMENT
- **Deliverable:** Code change (route handler signature updates)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cms/src/app/api/auth/[...nextauth]/route.ts`
  - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 90%
  - Implementation: 95% - mechanical Next 16 signature alignment; patterns already exist in the repo.
  - Approach: 90% - align to Next 16 enforcement rather than relying on incidental compatibility.
  - Impact: 90% - isolated to two route handlers; blast radius is limited and testable.
- **Acceptance:**
  - Route handlers use `params: Promise<...>` where Next 16 expects async params.
  - No synchronous access to `params` remains in those handlers.
- **Validation contract:**
  - TC-01: `@apps/cms` builds with Webpack -> `pnpm --filter @apps/cms build` exits 0.
  - TC-02: `@apps/cover-me-pretty` builds with Webpack -> `pnpm --filter @apps/cover-me-pretty build` exits 0.
  - TC-03: `@apps/cms` typecheck passes -> `pnpm --filter @apps/cms typecheck` exits 0.
  - Acceptance coverage: TC-01/02/03 cover all acceptance criteria.
  - Validation type: integration (build) + typecheck.
  - Run/verify: commands above.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: ship with other Next 16 hardening changes on `dev`.
  - Rollback: revert commit.
- **Documentation impact:** None.

### TASK-02: Inventory Request Interception Runtime Per App (Middleware vs Proxy)
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact: `docs/plans/nextjs-16-upgrade/runtime-inventory.md`
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/*/middleware.ts`
  - `apps/*/src/middleware.ts`
  - Deployment entrypoints for each affected app (OpenNext/Cloudflare where applicable)
- **Depends on:** -
- **Blocks:** TASK-05, TASK-03, TASK-04
- **Confidence:** 82%
  - Implementation: 90% - inventory is straightforward and can be derived from repo structure + package metadata.
  - Approach: 82% - default recommendation is conservative: keep middleware for OpenNext/Cloudflare apps unless proxy feasibility is proven.
  - Impact: 85% - inventory directly reduces the chance of runtime-incompatible interception changes.
- **Blockers / questions to answer:**
  - For each app with request interception, classify as:
    - Edge-required (must remain middleware), or
    - Node-OK (eligible to migrate to proxy)
  - For each interception entrypoint, list Node-only imports (if any) and whether they are required.
- **Acceptance:**
  - A table exists for all middleware/proxy candidates with: app, file path, purpose, required runtime, Node-only deps, deployment target.
  - Deployment target evidence is recorded from repo metadata (e.g., presence of `@opennextjs/cloudflare` in `apps/<app>/package.json` or `build:worker` scripts).
  - A recommended action is recorded per app: keep middleware (Edge) vs migrate to proxy (Node), with an explicit note when the recommendation is constrained by Cloudflare/OpenNext runtime.

### TASK-06: Next/Image Behavior Drift Audit
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact: `docs/plans/nextjs-16-upgrade/image-audit.md`
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/next-config/index.mjs` (shared images config)
  - `apps/*/next.config.*` (per-app images config overrides)
  - Representative `<Image />` call sites in `apps/` + `packages/`
- **Depends on:** -
- **Blocks:** TASK-05, TASK-07
- **Confidence:** 85%
  - Implementation: 90% - grep-driven audit with targeted spot checks.
  - Approach: 85% - pin only where needed to avoid locking bad defaults.
  - Impact: 85% - image regressions are user-visible.
- **Acceptance:**
  - Audit covers:
    - local images with query strings (and whether `images.localPatterns.search` is needed)
    - `images.minimumCacheTTL`, `images.imageSizes`, `images.qualities` drift
    - local IP optimization restrictions (`dangerouslyAllowLocalIP`) if any local URLs are used
    - redirect behavior (`maximumRedirects`) if any remote patterns rely on redirects
  - A recommended set of explicit config pins (or confirmation that no pins are needed) is recorded.

### TASK-08: Audit Tooling For `.next/dev` Output Changes
- **Type:** IMPLEMENT
- **Deliverable:** Code change (scripts/CI/tooling adjustments) if any brittle assumptions exist
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `scripts/**`
  - `.github/**`
  - Any app tooling that reads `.next/*` directly
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% - mostly search + patch.
  - Approach: 80% - prefer resilience (no hardcoded `.next` internals) over chasing layout.
  - Impact: 80% - prevents CI flakes.
- **Acceptance:**
  - No tooling assumes `next dev` output lives directly under `.next/`.
  - Any scripts referencing `.next/*` are either updated or documented as build-only.
- **Validation contract:**
  - TC-01: `rg -n "\.next/dev|\.next/trace" .github scripts apps packages` remains 0 (or references are intentional and documented).
  - TC-02: CI job that runs workspace builds remains green.

### TASK-05: CHECKPOINT - Post-Hardening Validation And Replan
- **Type:** CHECKPOINT
- **Depends on:** TASK-01, TASK-02, TASK-06, TASK-08
- **Blocks:** TASK-03, TASK-04, TASK-07
- **Confidence:** 95%
- **Acceptance:**
  - Run scoped builds/typecheck/lint for all changed apps.
  - Compare build output warnings and classify expected vs unexpected.
  - Run `/lp-replan` on tasks after this checkpoint.
- **Horizon assumptions to validate:**
  - Async request API enforcement is fully satisfied (no residual signature mismatches).
  - Runtime classification is sufficient to choose middleware vs proxy per app.
  - Image audit outputs are sufficient to decide whether pins are necessary.

### TASK-03: Resolve CMS Middleware Ambiguity And Enforce Runtime-Compatible Dependencies
- **Type:** IMPLEMENT
- **Deliverable:** Code change (single authoritative middleware/proxy entrypoint for CMS)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cms/middleware.ts`
  - `apps/cms/src/middleware.ts`
  - `[readonly] apps/cms/next.config.mjs`
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 78% ⚠️
  - Implementation: 80% - consolidation is mechanical but runtime constraints may force architecture change.
  - Approach: 78% - depends on classification outcome (Edge vs Node).
  - Impact: 78% - CMS request interception is security-sensitive.
- **Acceptance:**
  - Exactly one request interception entrypoint is used for CMS (either middleware or proxy).
  - No Node-only imports remain in Edge-executed interception code.
  - CMS still enforces auth/CSRF/security headers as intended.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cms build` exits 0.
  - TC-02: `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` exit 0.
  - TC-03: Interception behavior smoke check (manual):
    - unauthenticated access to protected `/cms/shop/<shop>/...` is blocked
    - security headers are present on HTML responses
  - Acceptance coverage: TC-01/02/03 cover all acceptance criteria.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: ship on `dev`, verify staging CMS.
  - Rollback: revert commit.
- **Documentation impact:** None.

### TASK-04: Fix Node-Only Imports In Middleware (Migrate To Proxy Or Rewrite For Edge)
- **Type:** IMPLEMENT
- **Deliverable:** Code change (runtime-correct request interception)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cover-me-pretty/middleware.ts`
  - `apps/xa/middleware.ts`, `apps/xa-b/middleware.ts`, `apps/xa-j/middleware.ts`
  - `apps/brikette/src/middleware.ts`, `apps/business-os/src/middleware.ts` (as inventory references)
  - Any new `proxy.ts` files introduced
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 70% ⚠️
  - Implementation: 75% - mechanics are clear but per-app runtime/deploy constraints can change the correct solution.
  - Approach: 70% - needs per-app runtime policy from TASK-02.
  - Impact: 70% - request interception is user-facing and security-sensitive.
- **Acceptance:**
  - For each app classified as Node-OK, interception is moved to `proxy.ts` and middleware removed.
  - For each app classified as Edge-required, middleware remains but uses runtime-compatible APIs only (no Node-only imports).
  - Known middleware deprecation warnings are tracked and intentionally allowed only for Edge-required apps.
- **Validation contract:**
  - TC-01: Build passes for each touched app (`pnpm --filter <app> build`).
  - TC-02: Typecheck + lint pass for each touched app.
  - TC-03: Targeted interception behavior smoke checks per app (redirects/rewrites/auth guards).
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** Confirm deployment/runtime constraints per app (Cloudflare/OpenNext vs Node server) with an end-to-end build + deploy dry run.

### TASK-07: Apply Next/Image Config Pinning + Smoke Validation
- **Type:** IMPLEMENT
- **Deliverable:** Code change (shared/per-app next config) + validation notes
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/next-config/index.mjs`
  - Any `apps/*/next.config.*` files requiring overrides
- **Depends on:** TASK-06, TASK-05
- **Blocks:** -
- **Confidence:** 75% ⚠️
  - Implementation: 80% - config changes are mechanical.
  - Approach: 75% - depends on audit outputs.
  - Impact: 75% - changes can affect caching/cost and visual output.
- **Acceptance:**
  - Config pins are applied only where audit indicates risk.
  - Representative image-heavy pages render correctly (manual smoke).
- **Validation contract:**
  - TC-01: Builds pass for affected apps.
  - TC-02: Manual smoke: at least 2 pages per affected app with remote + local images.

## Risks & Mitigations
- Middleware/proxy runtime mismatch causes production request interception failures.
  - Mitigation: TASK-02 runtime inventory + per-app smoke tests; prefer smallest-change migration.
- Node-only imports in Edge middleware lead to runtime bundling errors.
  - Mitigation: migrate to proxy when Node is acceptable; otherwise rewrite for Edge.
- Next/Image default drift causes silent visual/caching regressions.
  - Mitigation: TASK-06/07 audit + explicit config pins.

## Observability
- Logging: capture any middleware/proxy errors at request boundaries (app-level logger).
- Metrics: track error rates on protected CMS routes and key storefront routes after changes.

## Acceptance Criteria (overall)
- [ ] `pnpm --filter <touched-app> build` passes for all touched apps
- [ ] `pnpm --filter <touched-app> lint && pnpm --filter <touched-app> typecheck` pass for all touched apps
- [ ] No remaining sync route handler param signatures in `apps/**/src/app` (excluding tests)
- [ ] CMS has a single authoritative request interception entrypoint
- [ ] Image audit completed and config pins applied (if needed)

## Decision Log
- 2026-02-15: Created a post-upgrade hardening plan to cover Next 16 upgrade-guide enforcement and remaining runtime/deprecation surface. Legacy plan remains as phase 1 record.
