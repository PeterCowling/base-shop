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

Note: Next 16 deprecates `middleware.ts` in favor of `proxy.ts`, but `proxy.ts` is Node-only and Edge runtime is not supported/configurable there. This creates an external dependency gap for Cloudflare/OpenNext (Workers) apps: deprecation cleanup is constrained by platform/runtime support and Next's promised follow-up Edge guidance in a later minor release.

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
  - TypeScript >=5.1.0 is satisfied (repo uses 5.8.3 in root `package.json`).
  - Lint is enforced via `pnpm lint` (ESLint CLI/flat config). Next 16 removes `next lint` and `next build` no longer runs lint.

## Fact-Find Reference
- Related brief: `docs/plans/nextjs-16-upgrade/fact-find.md`
- Legacy execution plan (phase 1 upgrade): `docs/plans/nextjs-16-upgrade-plan.md`

## Existing System Notes
- Shared Next config:
  - `packages/next-config/index.mjs` (base config; includes `images.qualities: [75, 80, 85, 90]`)
  - `packages/next-config/next.config.mjs` (webpack preset + aliases)
- Known remaining hard-break surface (from fact-find):
  - Residual sync route handler `params` typing (fixed on `dev`):
    - `apps/cms/src/app/api/auth/[...nextauth]/route.ts` (commit `98a0cb42fc`)
    - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` (commit `98a0cb42fc`)
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

### Pending Tasks

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-09 | IMPLEMENT | Fix XA build wrapper to force Webpack (`apps/xa/scripts/build-xa.mjs` adds `--webpack`) | 92% | S | Complete (2026-02-15) | - | TASK-13 |
| TASK-10 | INVESTIGATE | Build OOM mitigation: confirm which apps need increased Node heap and decide how to enforce | 86% | S | Complete (2026-02-15) | - | TASK-11, TASK-12, TASK-13 |
| TASK-11 | IMPLEMENT | Cover-me-pretty: enforce `next build` heap headroom to avoid OOM (script-level guard) | 85% | S | Pending | TASK-10 | TASK-13, TASK-15 |
| TASK-12 | SPIKE | CMS build OOM mitigation prototype (reduce build-graph size; validate `@apps/cms` build) | 82% | M | Pending | TASK-10 | TASK-13 |
| TASK-13 | CHECKPOINT | Post-hardening checkpoint: scoped builds + typecheck + lint; replan remaining tasks | 95% | S | Pending | TASK-01 (complete), TASK-02 (complete), TASK-06 (complete), TASK-08 (complete), TASK-09, TASK-10, TASK-11, TASK-12 | TASK-14, TASK-15 |
| TASK-14 | IMPLEMENT | Resolve CMS middleware ambiguity and enforce runtime-compatible dependencies | 72% ⚠️ | M | Pending | TASK-02 (complete), TASK-13 | - |
| TASK-15 | IMPLEMENT | Cover-me-pretty: remove Node crypto from middleware (Edge-safe CSP hash via Web Crypto) | 82% | S | Pending | TASK-13, TASK-11 | - |

### Completed Tasks (Historical)

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Fix remaining sync route handler `params` signatures (Next 16 async enforcement) | 95% | S | Complete (2026-02-15) | - | TASK-13 |
| TASK-02 | INVESTIGATE | Inventory request interception runtime per app (middleware vs proxy) | 85% | S | Complete (2026-02-15) | - | TASK-13, TASK-14 |
| TASK-06 | INVESTIGATE | Next/Image behavior drift audit (defaults + usage patterns) and decide pinning | 90% | S | Complete (2026-02-15) | - | TASK-07, TASK-13 |
| TASK-08 | INVESTIGATE | Audit tooling/scripts for `.next/dev` output changes; confirm no brittle assumptions | 88% | S | Complete (2026-02-15) | - | TASK-13 |
| TASK-07 | IMPLEMENT | Next/Image config pinning: confirm no further changes needed + record smoke pages | 90% | S | Complete (2026-02-15) | TASK-06 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-09, TASK-10 | - | Independent hardening: enforce Webpack in XA + decide build heap policy |
| 2 | TASK-11, TASK-12 | Wave 1: TASK-10 | Implement heap guard + spike CMS build-graph mitigation |
| 3 | TASK-13 | Wave 2: TASK-09, TASK-10, TASK-11, TASK-12 + TASK-01/02/06/08 (complete) | CHECKPOINT gate before runtime-sensitive middleware work |
| 4 | TASK-14, TASK-15 | Wave 3: TASK-13 | Middleware hardening (CMS + cover-me-pretty) |

**Max parallelism:** 2 (Waves 1, 2, 4)
**Critical path:** TASK-10 -> TASK-12 -> TASK-13 -> TASK-14 (4 waves)
**Total tasks:** 12

## Tasks

### TASK-09: Fix XA Build Wrapper To Force Webpack (`--webpack`)
- **Type:** IMPLEMENT
- **Deliverable:** Code change (XA build wrapper uses `next build --webpack`)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/xa/scripts/build-xa.mjs` (add `--webpack` to the `next build` invocation)
  - `[readonly] apps/xa-b/scripts/build-xa.mjs` (reference; already includes `--webpack`)
  - `[readonly] apps/xa-j/scripts/build-xa.mjs` (reference; already includes `--webpack`)
- **Depends on:** -
- **Blocks:** TASK-13
- **Confidence:** 92%
  - Implementation: 95% - align to existing xa-b/xa-j wrapper pattern.
  - Approach: 92% - Next 16 defaults `next build` to Turbopack; `--webpack` is the supported opt-out for repos with custom webpack.
  - Impact: 90% - isolated to XA build wrapper; reduces risk of "works in some XA apps but not others".
- **Acceptance:**
  - `apps/xa/scripts/build-xa.mjs` invokes `pnpm exec next build --webpack` (or equivalent argument ordering) for Next 16.
  - XA build uses Webpack consistently with the rest of the repo’s Next apps.
- **Validation contract:**
  - TC-01: Wrapper contains `--webpack` -> `rg -n \"pnpm exec next build\" apps/xa/scripts/build-xa.mjs` shows the flag.
  - TC-02: `@apps/xa-c` typecheck passes -> `pnpm --filter @apps/xa-c typecheck` exits 0.
  - TC-03: `@apps/xa-c` lint passes -> `pnpm --filter @apps/xa-c lint` exits 0.
  - TC-04: `@apps/xa-c` build uses wrapper and succeeds -> `pnpm --filter @apps/xa-c build` exits 0.
  - Acceptance coverage: TC-01..TC-04 cover all acceptance criteria.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: ship with other Next 16 hardening changes on `dev`.
  - Rollback: revert commit.
- **Documentation impact:** None.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** d377c8a730
- **Execution cycle:** Red -> Green (single pass)
- **Validation:**
  - Ran: `pnpm --filter @apps/xa-c build` -> PASS
  - Ran: `pnpm --filter @apps/xa-c typecheck` -> PASS (note: requires a prior build to generate `.next/types`)
  - Ran: `pnpm --filter @apps/xa-c lint` -> PASS
- **Implementation notes:**
  - Updated `apps/xa/scripts/build-xa.mjs` to call `next build --webpack`, matching xa-b/xa-j behavior under Next 16.

### TASK-10: Build OOM Mitigation (Next 16)
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact: `docs/plans/nextjs-16-upgrade/build-oom-notes.md`
- **Execution-Skill:** /lp-build
- **Affects:**
  - `docs/plans/nextjs-16-upgrade/build-oom-notes.md`
  - `[readonly] apps/cms/package.json` (build script / memory policy)
  - `[readonly] apps/cover-me-pretty/package.json` (build script / memory policy)
  - `[readonly] .github/workflows/ci.yml` (CI build invocations)
  - `[readonly] .github/workflows/ci-lighthouse.yml` (CI build invocations)
- **Depends on:** -
- **Blocks:** TASK-11, TASK-12, TASK-13
- **Confidence:** 86%
  - Implementation: 90% - reproducible build runs can confirm OOM and identify minimal mitigation.
  - Approach: 86% - decision is “script-level guard” vs “CI env policy”; both are straightforward but need a single repo standard.
  - Impact: 86% - build stability is a gating prerequisite for all remaining hardening tasks.
- **Uncertainty statement:**
  - Which Next apps in this repo require increased Node heap for `next build --webpack` on Next 16, and what is the least-bad way to enforce the heap headroom (scripts vs CI env)?
- **Falsifiable checks / evidence targets:**
  - E2: Run `pnpm --filter <app> build` with default heap vs increased heap; record pass/fail.
  - E2: Confirm whether CI already sets `NODE_OPTIONS` for builds (grep workflows).
- **Acceptance:**
  - A list of apps that OOM on default Node heap is recorded (at minimum `@apps/cms`, `@apps/cover-me-pretty`).
  - For each OOM app, the minimal mitigation is recorded (e.g., `NODE_OPTIONS=--max-old-space-size=8192`).
  - A repo enforcement decision is recorded:
    - Option A: script-level guard in `apps/*/package.json` (preferred for dev parity), or
    - Option B: CI-only `NODE_OPTIONS` policy (acceptable only if dev workflows are unaffected).
  - Evidence: `docs/plans/nextjs-16-upgrade/build-oom-notes.md` (partial; CMS mitigation still unresolved as of 2026-02-15).
- **Validation contract:**
  - TC-01: Default heap build for `@apps/cms` fails with OOM -> `pnpm --filter @apps/cms build` exits non-zero (observed 2026-02-15).
  - TC-02: Default heap build for `@apps/cover-me-pretty` fails with OOM -> `pnpm --filter @apps/cover-me-pretty build` exits non-zero (observed 2026-02-15).
  - TC-03: Increased heap build for `@apps/cover-me-pretty` succeeds -> `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @apps/cover-me-pretty build` exits 0 (observed 2026-02-15).
  - TC-04: Increased heap build for `@apps/cms` is characterized -> record result in artifact.
    - Observed 2026-02-15: fails at `8192` and `16384` (see `docs/plans/nextjs-16-upgrade/build-oom-notes.md`).
  - Test type: integration (build).
  - Run: commands above.

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** 95652530c0
- **Output:** Updated `docs/plans/nextjs-16-upgrade/build-oom-notes.md` with CI wiring evidence and an explicit enforcement decision.
- **Decision:** Enforce heap headroom via per-app build scripts (Option A). CI Lighthouse runs `pnpm --filter @apps/cover-me-pretty... build` without `NODE_OPTIONS`, so script-level is the only dev/CI-parity mechanism.
- **Evidence:**
  - `docs/plans/nextjs-16-upgrade/build-oom-notes.md` (OOM runs + CI workflow reference).

### TASK-11: Cover-Me-Pretty Build Heap Headroom Guard
- **Type:** IMPLEMENT
- **Deliverable:** Code change (cover-me-pretty build uses increased heap by default)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cover-me-pretty/package.json` (`build` script)
- **Depends on:** TASK-10
- **Blocks:** TASK-13, TASK-15
- **Confidence:** 85%
  - Implementation: 88% - proven that increased heap resolves build OOM on this app (E2).
  - Approach: 85% - choose a cross-platform script pattern aligned with repo conventions.
  - Impact: 85% - reduces dev/CI divergence; enables checkpoint builds.
- **Acceptance:**
  - `pnpm --filter @apps/cover-me-pretty build` succeeds without requiring manual `NODE_OPTIONS` exports.
  - The chosen script pattern is consistent with repo portability expectations (documented in TASK-10 artifact).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cover-me-pretty build` exits 0 on a fresh shell (no pre-set `NODE_OPTIONS`).
  - TC-02: `pnpm --filter @apps/cover-me-pretty lint && pnpm --filter @apps/cover-me-pretty typecheck` exit 0.

### TASK-12: SPIKE - CMS Build OOM Mitigation Prototype
- **Type:** SPIKE
- **Deliverable:** Prototype code change + evidence notes in `docs/plans/nextjs-16-upgrade/build-oom-notes.md`
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/platform-core/src/themeTokens/index.ts` (likely root cause: Node-only imports + broad dynamic import context)
  - `apps/cms/src/services/shops/theme.ts` and `apps/cms/src/services/shops/themeService.ts` (consumers)
  - `apps/cms/src/app/cms/shop/[shop]/themes/page.tsx` (server usage)
- **Depends on:** TASK-10
- **Blocks:** TASK-13
- **Confidence:** 82%
  - Implementation: 80% - CMS OOM persists even at `NODE_OPTIONS=--max-old-space-size=16384`, so mitigation likely requires reducing the build graph rather than “more heap”.
  - Approach: 82% - first candidate is refactoring `@acme/platform-core/themeTokens` to avoid bundling Node-only token loaders (and `typescript`) into Next builds.
  - Impact: 82% - unblocks all downstream CMS hardening by making builds runnable again.
- **Uncertainty statement:**
  - Can we eliminate CMS build OOM by removing/isolating the `@acme/platform-core/themeTokens` Node loader (which imports `typescript`, `node:fs`, `node:vm`) from the Next build graph?
- **Falsifiable check / evidence target:**
  - E3: Implement a minimal refactor that prevents Next/Webpack from including `typescript` and broad `@themes/*` import contexts in the CMS build, then re-run `pnpm --filter @apps/cms build`.
- **Acceptance:**
  - `pnpm --filter @apps/cms build` exits 0 under a documented heap policy (ideally default heap; otherwise explicit).
  - A short note is added to `docs/plans/nextjs-16-upgrade/build-oom-notes.md` describing:
    - the mitigation applied
    - why it reduced memory footprint
    - what follow-ups are required to harden it (tests, invariants, fallback behavior)
- **Test contract:**
  - TC-01: `pnpm --filter @apps/cms build` exits 0.
  - TC-02: `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` exit 0.
  - TC-03: `pnpm --filter @apps/cms test -- --testPathPattern tokenUtils` exits 0 (theme token behavior preserved).
  - Test type: integration (build) + targeted tests.
  - Run: commands above.

### TASK-13: CHECKPOINT - Post-Hardening Validation And Replan
- **Type:** CHECKPOINT
- **Depends on:** TASK-01 (complete), TASK-02 (complete), TASK-06 (complete), TASK-08 (complete), TASK-09, TASK-10, TASK-11, TASK-12
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 95%
- **Acceptance:**
  - Run scoped builds/typecheck/lint for all changed apps.
  - Compare build output warnings and classify expected vs unexpected.
  - Run `/lp-replan` on tasks after this checkpoint.
- **Horizon assumptions to validate:**
  - Async request API enforcement is fully satisfied (no residual signature mismatches).
  - Runtime classification is sufficient to choose middleware vs proxy per app.
  - Image audit outputs are sufficient to decide whether pins are necessary.
  - Build heap policy is explicit and checkpoint builds are reproducible without ad-hoc local env tweaks.

### TASK-14: Resolve CMS Middleware Ambiguity And Enforce Runtime-Compatible Dependencies
- **Type:** IMPLEMENT
- **Deliverable:** Code change (single authoritative middleware/proxy entrypoint for CMS)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cms/middleware.ts`
  - `apps/cms/src/middleware.ts`
  - `[readonly] apps/cms/next.config.mjs`
- **Depends on:** TASK-02 (complete), TASK-13
- **Blocks:** -
- **Confidence:** 72% ⚠️ (→ 84% conditional on TASK-10, TASK-12)
  - Implementation: 72% - CMS `next build --webpack` currently OOMs even with increased heap, preventing reliable validation until a stable build policy exists.
  - Approach: 85% - CMS is Worker/Edge (OpenNext) and therefore must remain Edge interception for now (middleware; accept deprecation).
  - Impact: 80% - CMS request interception is security-sensitive; changes must be validated with route-level smoke checks.

#### Re-plan Update (2026-02-15)
- **Previous confidence:** 78%
- **Updated confidence:** 72% (→ 84% conditional on TASK-10, TASK-12)
  - **Evidence class:** E2 (executable verification)
  - CMS build on default heap fails with OOM: `pnpm --filter @apps/cms build` (observed 2026-02-15).
  - CMS build with `NODE_OPTIONS=--max-old-space-size=8192` still fails with OOM (observed 2026-02-15).
  - CMS build with `NODE_OPTIONS=--max-old-space-size=16384` still fails with OOM (observed 2026-02-15; ~17 min).
  - Therefore this task cannot be promoted until TASK-10 (policy decision) and TASK-12 (build-graph reduction prototype) make CMS builds reproducible.
- **Decision / resolution:**
  - Treat CMS as **Edge-required** due to `@opennextjs/cloudflare` + `build:worker` (`apps/cms/package.json`), so do **not** plan a `proxy.ts` migration for CMS in this phase.
  - Plan to remove Node-centric middleware dependencies (`helmet`, Node `crypto`) and keep `middleware.ts` until platform/runtime support changes.
- **Changes to task:**
  - TC-01 updated to refer to the heap policy established in TASK-10.
- **Acceptance:**
  - Exactly one request interception entrypoint is used for CMS (either middleware or proxy).
  - No Node-only imports remain in Edge-executed interception code.
  - CMS still enforces auth/CSRF/security headers as intended.
- **Validation contract:**
  - TC-01: CMS build exits 0 under the repo’s chosen heap policy -> see TASK-10 (e.g. `NODE_OPTIONS=... pnpm --filter @apps/cms build`).
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

### TASK-15: Cover-Me-Pretty Middleware Edge-Safety (Remove `node:crypto`)
- **Type:** IMPLEMENT
- **Deliverable:** Code change (Edge-safe CSP hash generation for cover-me-pretty)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cover-me-pretty/middleware.ts`
- **Depends on:** TASK-13, TASK-11
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 82% - mechanical rewrite: replace `node:crypto` SHA-256 hashing with Web Crypto (`crypto.subtle.digest`) and preserve CSP behavior.
  - Approach: 85% - prefer an Edge-safe implementation that also runs on Node (no `proxy.ts` migration required).
  - Impact: 82% - touches CSP header generation; requires smoke checks for analytics consent flows.

#### Re-plan Update (2026-02-15)
- **Previous confidence:** 70%
- **Updated confidence:** 82%
  - **Evidence class:** E2 (executable verification) + E1 (static audit)
  - `apps/cover-me-pretty/middleware.ts` imports `node:crypto` and uses it for CSP hashing (E1).
  - `@apps/cover-me-pretty` build succeeds under increased heap headroom, enabling reliable validation after TASK-11 (E2).
- **Decision / resolution:**
  - Use an Edge-safe hashing implementation (Web Crypto) to eliminate runtime ambiguity.
- **Acceptance:**
  - `apps/cover-me-pretty/middleware.ts` no longer imports `node:crypto` (or other Node-only APIs).
  - CSP `script-src` continues to allow GA4 inline init when `consent.analytics=true` and `NEXT_PUBLIC_GA4_ID` is set.
  - Locale redirect behavior is unchanged.
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cover-me-pretty build` exits 0.
  - TC-02: `pnpm --filter @apps/cover-me-pretty lint && pnpm --filter @apps/cover-me-pretty typecheck` exit 0.
  - TC-03: Manual smoke:
    - request to `/` redirects to `/${LOCALES[0]}` as before
    - request to `/<locale>/...` sets CSP when consent cookie is present
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** Add a small unit test for the SHA-256 base64 helper and/or a middleware integration probe that asserts the CSP contains `sha256-...` for the expected inline script.

## Completed Tasks (Historical)

### TASK-01: Fix Remaining Sync Route Handler `params` Signatures
- **Type:** IMPLEMENT
- **Deliverable:** Code change (route handler signature updates)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `apps/cms/src/app/api/auth/[...nextauth]/route.ts`
  - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts`
- **Depends on:** -
- **Blocks:** TASK-13
- **Confidence:** 95%
  - Implementation: 95% - mechanical Next 16 signature alignment; patterns already exist in the repo.
  - Approach: 95% - align to Next 16 enforcement rather than relying on incidental compatibility.
  - Impact: 95% - isolated to two route handlers; validated by typecheck/lint + related tests.
- **Acceptance:**
  - Route handlers use `params: Promise<...>` where Next 16 expects async params.
  - No synchronous access to `params` remains in those handlers.
- **Validation contract:**
  - TC-01: `@apps/cms` typecheck passes -> `pnpm --filter @apps/cms typecheck` exits 0.
  - TC-02: `@apps/cms` lint passes -> `pnpm --filter @apps/cms lint` exits 0.
  - TC-03: `@apps/cms` related tests pass -> Jest related tests for `apps/cms/src/app/api/auth/[...nextauth]/route.ts` exit 0.
  - TC-04: `@apps/cover-me-pretty` lint passes -> `pnpm --filter @apps/cover-me-pretty lint` exits 0.
  - TC-05: `@apps/cover-me-pretty` related tests pass -> Jest related tests for `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` exit 0.
  - Acceptance coverage: TC-01..TC-05 cover all acceptance criteria.
  - Validation type: typecheck + lint + related integration tests.
  - Evidence: commit `98a0cb42fc` (validated by pre-push `scripts/validate-changes.sh`).
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
- **Blocks:** TASK-13, TASK-14
- **Confidence:** 85%
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
  - Evidence: `docs/plans/nextjs-16-upgrade/runtime-inventory.md` (created 2026-02-15).

### TASK-06: Next/Image Behavior Drift Audit
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact: `docs/plans/nextjs-16-upgrade/image-audit.md`
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/next-config/index.mjs` (shared images config)
  - `apps/*/next.config.*` (per-app images config overrides)
  - Representative `<Image />` call sites in `apps/` + `packages/`
- **Depends on:** -
- **Blocks:** TASK-07, TASK-13
- **Confidence:** 90%
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
  - Evidence: `docs/plans/nextjs-16-upgrade/image-audit.md` (created 2026-02-15).

### TASK-08: Audit Tooling For `.next/dev` Output Changes
- **Type:** INVESTIGATE
- **Deliverable:** Analysis notes in this task (and a follow-up IMPLEMENT task only if any brittle assumptions exist)
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `scripts/**`
  - `.github/**`
  - Any app tooling that reads `.next/*` directly
- **Depends on:** -
- **Blocks:** TASK-13
- **Confidence:** 88%
  - Implementation: 90% - grep-driven audit + targeted spot checks.
  - Approach: 85% - prefer resilience (no hardcoded `.next` internals) over chasing layout.
  - Impact: 85% - prevents CI flakes.
- **Acceptance:**
  - Confirm no tooling assumes `next dev` output lives directly under `.next/` (Next 16 moves dev output to `.next/dev`).
  - Any scripts referencing `.next/*` are either explicitly build-only, or updated to tolerate `.next/dev` layout.
- **Validation contract:**
  - TC-01: `rg -n \"\\.next/dev|\\.next/trace\" .github scripts apps packages` remains 0 (or references are intentional and documented).
  - TC-02: CI job that runs workspace builds remains green.
  - Findings (2026-02-15):
    - No `.next/dev` or `.next/trace` consumers found in tracked scripts/workflows.
    - `.next` references are limited to: `tsconfig.json` includes of `.next/types/**`, ignore patterns, and a build-only chunk analyzer `apps/brikette/scripts/perf/analyze-chunks.mjs` reading `.next/static/chunks` after a completed build.
    - A hard-break risk remains outside `.next/dev`: `apps/xa/scripts/build-xa.mjs` runs `pnpm exec next build` without `--webpack` (Next 16 defaults to Turbopack). This is tracked as TASK-09.

### TASK-07: Apply Next/Image Config Pinning + Smoke Validation
- **Type:** IMPLEMENT
- **Deliverable:** Code change (shared/per-app next config) + validation notes
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - `packages/next-config/index.mjs`
  - Any `apps/*/next.config.*` files requiring overrides
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% - required pin (`images.qualities`) is already present in shared config.
  - Approach: 90% - audit indicates no other pins are required unless regressions are observed.
  - Impact: 90% - no behavioral change planned; this is confirmation + smoke-entrypoint inventory.

#### Re-plan Update (2026-02-15)
- **Previous confidence:** 75%
- **Updated confidence:** 90%
  - **Evidence class:** E1 (static audit)
  - `packages/next-config/index.mjs` already pins `images.qualities: [75, 80, 85, 90]` and real call sites use `quality={80|85|90}` (see `docs/plans/nextjs-16-upgrade/image-audit.md`).
  - No evidence found of `images.domains`, `next/legacy/image`, local-image query strings, or local IP optimization needs (see `docs/plans/nextjs-16-upgrade/image-audit.md`).
- **Decision / resolution:**
  - Treat Next/Image as “already pinned where required”; additional pinning is deferred until a smoke test demonstrates a regression.
  - Record concrete image-heavy UI entrypoints to smoke during TASK-13 checkpoint.
- **Acceptance:**
  - Confirm required config pins exist (notably `images.qualities`) and no additional pins are needed based on repo evidence.
  - Record at least 2 image-heavy UI entrypoints per app to smoke during TASK-13:
    - `@apps/cover-me-pretty`: `apps/cover-me-pretty/src/app/[lang]/product/[slug]/ComparePreview.tsx`, `apps/cover-me-pretty/src/app/account/orders/[id]/MobileReturnLink.tsx`
    - `@apps/cms`: `apps/cms/src/app/cms/configurator/rapid-launch/review/DerivedPagePreview.tsx`, `apps/cms/src/app/cms/shop/[shop]/media/components/MediaOverviewHero.tsx`
    - `@apps/brikette`: `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`, `apps/brikette/src/components/careers/CareersSection.tsx`
- **Validation contract:**
  - TC-01: `rg -n \"images\\.qualities\" packages/next-config/index.mjs` shows `[75, 80, 85, 90]` (config pin present).
  - TC-02: Manual smoke during TASK-13: open the recorded entrypoints and confirm images render as expected in dev/prod preview.

## Risks & Mitigations
- Next 16 Webpack builds OOM on default Node heap (observed in CMS and cover-me-pretty).
  - Mitigation: TASK-10 establishes heap/concurrency policy; TASK-11 enforces it for cover-me-pretty; CMS requires additional mitigation before TASK-14 can proceed.
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
- 2026-02-15: Build OOM surfaced as a gating risk for Webpack builds; enforce explicit heap headroom per app (preferred) rather than relying on ad-hoc local env or CI-only settings.
