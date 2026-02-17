---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-15
Last-updated: 2026-02-17 (replan: TASK-12 spike done; TASK-21/22 precursor chain added)
Feature-Slug: nextjs-16-upgrade
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Auto-Build-Intent: plan-only
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
  - Cloudflare deployment must remain compliant with Workers Free/Pages Free constraints (no paid-plan-only assumptions in architecture or rollout criteria).
- Assumptions:
  - Node >=20.9.0 is enforced via `.nvmrc` and CI pins.
  - TypeScript >=5.1.0 is satisfied (repo uses 5.8.3 in root `package.json`).
  - Lint is enforced via `pnpm lint` (ESLint CLI/flat config). Next 16 removes `next lint` and `next build` no longer runs lint.
  - CI lint gates exist in `.github/workflows/ci.yml`, `.github/workflows/reusable-app.yml`, `.github/workflows/cms.yml`, and `scripts/validate-changes.sh`.

## Cloudflare Free-Tier Guardrails
- Workers/Pages Functions quota model:
  - Workers Free allows 100,000 requests/day (with 1,000 requests/min burst) and resets at midnight UTC.
  - Pages Functions consume the same Workers Free request quota; static asset requests remain free/unlimited when Functions are not invoked.
- Runtime limits on Free:
  - Per invocation defaults include 50 external subrequests (and 1,000 internal Cloudflare-service subrequests).
  - Worker size limit is 3 MB, memory limit is 128 MB/isolate.
- Pages platform limits on Free:
  - 500 builds/month per account, 20-minute build timeout.
  - 20,000 files/site and 25 MiB max asset file size.
- Free-tier storage/binding constraints relevant to this repo:
  - D1 Free: 10 databases/account, 500 MB max/database, 5 GB max/account, 50 D1 queries/invocation.
  - KV Free: 100,000 reads/day, 1,000 writes/day.
  - Queues Free: 10,000 ops/day and 24h retention.
- Overage behavior policy:
  - Cloudflare defaults differ by surface: Workers Routes default `fail open`; Workers Custom Domains default `fail closed`; Pages Runtime mode defaults `fail closed` while Pages Routing mode can `fail open`.
  - Security-critical request interception must be configured as `fail closed` (Workers route mode override or Pages Runtime mode) when quota is exhausted.
  - Non-critical marketing-only routes may use `fail open` only when documented.
- Pages invocation control:
  - `_routes.json` include/exclude rules must prevent unnecessary Functions invocation on static-heavy paths to protect daily quota.
- Source anchors (verify before release):
  - Workers/platform limits: `https://developers.cloudflare.com/workers/platform/limits/`
  - Limits and billing model details (free/paid): `https://developers.cloudflare.com/workers/platform/limits/#worker-limits`
  - Pages routing/fail-open-fail-closed behavior: `https://developers.cloudflare.com/pages/functions/routing/`
  - Pages platform limits: `https://developers.cloudflare.com/pages/platform/limits/`
  - D1 limits: `https://developers.cloudflare.com/d1/platform/limits/`
  - KV limits: `https://developers.cloudflare.com/kv/platform/limits/`
  - Queues free plan policy update: `https://developers.cloudflare.com/changelog/2026-02-04-workers-free-plan-updates/`

## Runtime Interception Policy (Next 16)
- Edge/Workers target (`@opennextjs/cloudflare`, `build:worker`): keep `middleware.ts` and remove Node-only dependencies from interception code.
- Node server target: migrate interception to `proxy.ts`.
- Revisit trigger: re-evaluate this policy when a Next minor release provides explicit Edge guidance for post-`middleware.ts` migration.

## Fact-Find Reference
- Related brief: `docs/plans/nextjs-16-upgrade/fact-find.md`
- Related artifact: `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md`
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
6. Add governance-hardening tranche from configuration audit: dependency ownership decisions, policy coverage hardening, and reproducible Turbopack blocker evidence.

## Plan Gates
- Foundation Gate: Pass
  - Fact-find metadata present in `docs/plans/nextjs-16-upgrade/fact-find.md` (Deliverable-Type, Execution-Track, Primary-Execution-Skill, confidence inputs).
  - Additional evidence baseline present in `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md`.
- Sequenced: Yes
- Edge-case review complete: Yes
  - Edge cases tracked: policy wrapper-scan bypass risk, `@next/env` version multiplicity drift, deployment-mode ambiguity for `OUTPUT_EXPORT`.
- Auto-build eligible: No
  - Reason: plan-only mode for this run; unresolved DECISION tasks and pending CHECKPOINTs.

## Task Summary

### Remaining Tasks

Package-name mapping note: `@apps/xa-c` is the package name for filesystem app `apps/xa`.

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-21 | INVESTIGATE | Audit CMS `transpilePackages` — identify packages with complete dist/ safe to remove | 88% | S | Pending | TASK-12 (complete) | TASK-22 |
| TASK-22 | IMPLEMENT | CMS build graph reduction: apply transpilePackages reduction + commit deferred config | 68% ⚠️ | M | Pending (below threshold — see TASK-21) | TASK-21 | TASK-13 |
| TASK-13 | CHECKPOINT | Post-hardening checkpoint: scoped builds + typecheck + lint; replan remaining tasks | 95% | S | Pending | TASK-01 (complete), TASK-02 (complete), TASK-06 (complete), TASK-08 (complete), TASK-09, TASK-10, TASK-11, TASK-12 (complete), TASK-22 | TASK-14, TASK-15 |
| TASK-14 | IMPLEMENT | Resolve CMS middleware ambiguity and enforce runtime-compatible dependencies | 72% ⚠️ | M | Pending | TASK-02 (complete), TASK-13 | - |
| TASK-15 | IMPLEMENT | Cover-me-pretty: remove Node crypto from middleware (Edge-safe CSP hash via Web Crypto) | 82% | S | Pending | TASK-13, TASK-11 | - |
| TASK-16 | INVESTIGATE | Harden Next `--webpack` policy coverage map; enumerate wrapper/script bypass vectors and candidate scanner scope | 86% | S | Pending | TASK-13 | TASK-17 |
| TASK-17 | DECISION | Decide dependency ownership model: `@acme/next-config` (peer vs dev vs dep) and root `next` single-source policy | 83% | S | Pending | TASK-16 | TASK-18 |
| TASK-18 | IMPLEMENT | Apply dependency policy decision (manifest alignment for D-01/D-02) with minimal churn | 78% ⚠️ | M | Pending | TASK-17 | TASK-20 |
| TASK-19 | INVESTIGATE | Create reproducible Turbopack-blocker evidence matrix (observed repros vs comment claims) | 81% | M | Pending | TASK-13 | TASK-20 |
| TASK-20 | CHECKPOINT | Governance checkpoint: re-sequence and re-score remaining Next 16 tasks after policy + repro tranche | 95% | S | Pending | TASK-18, TASK-19 | - |

### Completed In This Plan (With Commits)

| Task ID | Description | Status | Commit |
|---|---|---|---|
| TASK-01 | Fix remaining sync route handler `params` signatures (Next 16 async enforcement) | Complete (2026-02-15) | `98a0cb42fc` |
| TASK-02 | Inventory request interception runtime per app (middleware vs proxy) | Complete (2026-02-15) | `35bdb0f8ec` |
| TASK-06 | Next/Image behavior drift audit (defaults + usage patterns) and decide pinning | Complete (2026-02-15) | `3df2f18ec6` |
| TASK-07 | Next/Image config pinning: confirm no further changes needed + record smoke pages | Complete (2026-02-15) | `fa4942a94d` |
| TASK-08 | Audit tooling/scripts for `.next/dev` output changes; confirm no brittle assumptions | Complete (2026-02-15) | `c9772fbe90` |
| TASK-09 | Fix XA build wrapper to force Webpack (`apps/xa/scripts/build-xa.mjs` adds `--webpack`) | Complete (2026-02-15) | `d377c8a730` |
| TASK-10 | Build OOM mitigation: confirm which apps need increased Node heap and decide how to enforce | Complete (2026-02-15) | `95652530c0` |
| TASK-11 | Cover-me-pretty: enforce `next build` heap headroom to avoid OOM (script-level guard) | Complete (2026-02-15) | `e582db8822` |
| TASK-12 | SPIKE — CMS build OOM: webpack-escape for typescript import committed; TC-01 (build exits 0) not satisfied on 16 GB machine; precursor chain TASK-21→TASK-22 created | Spike Complete (2026-02-17) / TC-01 unmet | `71fe4c561d` |

### Deferred / Blocked

| Item | Current State | Unblock Condition |
|---|---|---|
| CMS middleware consolidation (TASK-14) | Blocked on CMS typecheck/lint baseline | TASK-22 produces CMS `typecheck + lint` baseline (full build exits 0 may require 32 GB+ CI machine; TASK-13 checkpoint accepts typecheck/lint as primary gate) |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting). Overall-confidence is computed as weighted average of task confidence by effort, with completed tasks treated as 100%.

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-09, TASK-10 | - | Independent hardening: enforce Webpack in XA + decide build heap policy — **complete** |
| 2 | TASK-11, TASK-12 | Wave 1: TASK-10 | Heap guard + spike — **complete** |
| 3 | TASK-21 | Wave 2: TASK-12 (complete) | Audit CMS transpilePackages for safe-to-remove entries |
| 4 | TASK-22 | Wave 3: TASK-21 | Apply build-graph reduction + commit deferred config changes |
| 5 | TASK-13 | Wave 4: TASK-22 + TASK-01/02/06/08/09/10/11 (all complete) | CHECKPOINT gate before runtime-sensitive middleware work |
| 6 | TASK-14, TASK-15 | Wave 5: TASK-13 | Middleware hardening (CMS + cover-me-pretty) |
| 7 | TASK-16, TASK-19 | Wave 5: TASK-13 | Governance evidence tranche (policy coverage + Turbopack repro evidence) |
| 8 | TASK-17 | Wave 7: TASK-16 | Decide dependency ownership and declaration policy |
| 9 | TASK-18 | Wave 8: TASK-17 | Apply manifest/dependency policy |
| 10 | TASK-20 | Wave 9: TASK-18 and Wave 7: TASK-19 | Final governance checkpoint and confidence recalibration |

**Max parallelism:** 2 (Waves 1, 2, 6, 7)
**Critical path (remaining):** TASK-21 → TASK-22 → TASK-13 → TASK-16 → TASK-17 → TASK-18 → TASK-20 (7 tasks)
**Total tasks:** 19

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

#### Build Completion (2026-02-15)
- **Status:** Complete
- **Commits:** e582db8822
- **Validation:**
  - Ran: `pnpm --filter @apps/cover-me-pretty build` -> PASS (no OOM)
  - Ran: `pnpm --filter @apps/cover-me-pretty lint` -> PASS
  - Ran: `pnpm --filter @apps/cover-me-pretty typecheck` -> PASS
- **Implementation notes:**
  - Updated `apps/cover-me-pretty/package.json` build script to run Next via `node --max-old-space-size=8192 .../next build --webpack`.
  - Added `typecheck` script to make validation explicit for this app.

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

#### Build Notes (2026-02-17) — TASK-12 SPIKE
- **Status:** Requires replan — spike invalidated primary hypothesis
- **Applied fix:** Webpack-escape for `typescript` import in `packages/platform-core/src/themeTokens/index.ts` (variable `_req` pattern, matches `emailService.ts`). All platform-core themeTokens tests pass (14/14). Added `typescript` to `serverExternalPackages` in `apps/cms/next.config.mjs`.
- **Hypothesis invalidated:** `typescript` import in themeTokens was a MINOR contributor, not the primary OOM cause. Removing it from webpack's graph reduces memory marginally but the CMS build still OOMs at 10–12 GB.
- **Root cause:** CMS build graph (130+ routes + transpiled workspace packages) requires >12 GB on a 16 GB machine. No single package is the cause.
- **TC-01 status:** FAIL — CMS build still OOMs. Machine requires 32 GB+ or architectural changes.
- **TC-03 status:** Pre-existing failures (2 tokenUtils tests; brandx/dummy theme data mismatch, unrelated to this spike).
- **Scope expansion documented:** `apps/cms/next.config.mjs` (not in original Affects list) — added `typescript` to `serverExternalPackages` as belt-and-suspenders.
- **Routing:** → `/lp-replan` for TASK-12 with new evidence. See full spike evidence in `docs/plans/nextjs-16-upgrade/build-oom-notes.md`.

#### Re-plan Update (2026-02-17)
- Confidence: 82% → Spike Complete (TC-01 unmet); Evidence: E2 (executable build verification at 4/8/10/12 GB)
- Key change: Spike done — primary hypothesis invalidated; precursor chain TASK-21→TASK-22 created to pursue transpilePackages reduction
- Dependencies: TASK-21 now blocks TASK-22; TASK-22 now blocks TASK-13 (replacing TASK-12's direct TASK-13 block)
- Validation contract: TC-01 deferred to TASK-22 (typecheck+lint gate) and potentially TASK-13 (full build; may require 32 GB+ CI)
- Notes: `apps/cms/next.config.mjs` (typescript in serverExternalPackages) deferred to TASK-22 — commit blocked by pre-existing tokenUtils.ts TS2307 errors triggering CMS typecheck on staged files

### TASK-21: INVESTIGATE - CMS `transpilePackages` Reduction Audit
- **Type:** INVESTIGATE
- **Deliverable:** Audit note appended to `docs/plans/nextjs-16-upgrade/build-oom-notes.md` — list of packages safe to remove from CMS `transpilePackages`, with must-keep rationale and expected memory-impact estimate.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/nextjs-16-upgrade/build-oom-notes.md`
  - `[readonly] apps/cms/next.config.mjs` (transpilePackages list to audit)
  - `[readonly] packages/*/dist/` (verify compiled output exists for each candidate)
- **Depends on:** TASK-12 (complete)
- **Blocks:** TASK-22
- **Confidence:** 88%
  - Implementation: 92% — straightforward: check dist/ presence for each package in transpilePackages.
  - Approach: 88% — packages with complete dist/ output do not need transpilation by webpack; removal reduces build graph.
  - Impact: 85% — spike showed removing a single package (platform-core) is insufficient at 8 GB; full-list reduction may change the picture but magnitude is uncertain.
- **Questions to answer:**
  - Which packages in CMS `transpilePackages` have a complete `dist/` with `index.js` and type declarations?
  - Which packages have template-string dynamic imports or other webpack-hostile patterns that _require_ transpilation?
  - What is the minimum-keep set for CMS typecheck/lint to pass?
- **Acceptance:**
  - Documented list: (a) safe-to-remove, (b) must-keep with rationale, (c) uncertain.
  - Qualitative memory-reduction estimate (low/medium/high) with reasoning.
- **Validation contract:** File-system checks + static analysis; no behavior changes in this task.
- **Planning validation:** `None: investigation-only task`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Append transpilePackages audit section to `docs/plans/nextjs-16-upgrade/build-oom-notes.md`.

### TASK-22: IMPLEMENT - CMS Build Graph Reduction
- **Type:** IMPLEMENT
- **Deliverable:** Code change — reduced `transpilePackages` in `apps/cms/next.config.mjs` + committed deferred `serverExternalPackages` change; documented pre-existing tokenUtils.ts typecheck errors.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending (below IMPLEMENT confidence threshold — see conditional note)
- **Affects:**
  - `apps/cms/next.config.mjs` (transpilePackages reduction + `typescript` to serverExternalPackages)
  - `apps/cms/src/app/cms/wizard/tokenUtils.ts` (document or fix pre-existing TS2307 for `@themes/brandx/tailwind-tokens`, `@themes/dark/tailwind-tokens`)
  - `docs/plans/nextjs-16-upgrade/build-oom-notes.md` (updated post-reduction build evidence)
- **Depends on:** TASK-21
- **Blocks:** TASK-13
- **Confidence:** 68% ⚠️ (→ ≥80% conditional on TASK-21 confirming sufficient safe-to-remove candidates)
  - Implementation: 68% — cannot confirm feasibility until TASK-21 identifies which packages can be safely removed without CMS typecheck/lint regressions.
  - Approach: 78% — established pattern: packages with complete dist/ can use compiled output; removal reduces webpack compilation work.
  - Impact: 72% — memory reduction magnitude is unknown until TASK-21; spike confirmed single-package removal insufficient at 8 GB.
- **Conditional note:** Below IMPLEMENT threshold (80%). Execute TASK-21 first, then re-run `/lp-replan` to promote confidence based on audit findings before building this task.
- **Acceptance:**
  - `transpilePackages` reduced per TASK-21 safe-to-remove list.
  - `typescript` committed to `serverExternalPackages` in `apps/cms/next.config.mjs`.
  - Pre-existing `tokenUtils.ts` TS2307 errors documented (or fixed) so CMS typecheck runs to completion without pre-existing errors masking real regressions.
  - `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` exit 0.
  - `pnpm --filter @apps/cms build` attempted; result documented in build-oom-notes.md (OOM threshold improved, or exits 0 if reduction sufficient on 16 GB).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` exit 0.
  - TC-02: `pnpm --filter @apps/cms build` attempted; OOM threshold documented (best-effort; 32 GB+ may be required for full exit 0).
  - TC-03: `pnpm --filter @apps/cms test -- --testPathPattern tokenUtils` exits 0 or pre-existing failures explicitly confirmed (not introduced by this task).
- **Execution plan:** Red → Green → Refactor
- **What would make this ≥90%:** TASK-21 confirms ≥4 safe-to-remove packages that together account for a significant portion of build-graph compilation time.
- **Rollout / rollback:**
  - Rollout: ship on `dev`; verify CMS dev server still starts (`pnpm --filter @apps/cms dev`).
  - Rollback: revert `apps/cms/next.config.mjs` changes.
- **Documentation impact:** Append post-reduction build evidence to `docs/plans/nextjs-16-upgrade/build-oom-notes.md`.

### TASK-13: CHECKPOINT - Post-Hardening Validation And Replan
- **Type:** CHECKPOINT
- **Depends on:** TASK-01 (complete), TASK-02 (complete), TASK-06 (complete), TASK-08 (complete), TASK-09, TASK-10, TASK-11, TASK-12 (complete), TASK-22
- **Blocks:** TASK-14, TASK-15
- **Confidence:** 95%
- **Acceptance:**
  - Run the scoped command set below for impacted apps (`@apps/cms`, `@apps/cover-me-pretty`, `@apps/xa-c`).
  - Run async request API detection checks and record zero unresolved findings before promoting middleware tasks.
  - Complete Cloudflare Free-tier compliance checks for touched Cloudflare apps (Workers/Pages mode, quota-risk posture, fail mode policy, and invocation routing controls).
  - Persist a Cloudflare audit note at `docs/plans/nextjs-16-upgrade/cloudflare-free-tier-audit.md` with per-app request/binding budgets and latest observed usage snapshot.
  - Compare build output warnings and classify expected vs unexpected (expected = known non-fatal warnings already tracked in plan artifacts; unexpected = new warning class or warning count increase).
  - Run `/lp-replan` on tasks after this checkpoint.
- **Command set (deterministic):**
  - `pnpm --filter @apps/cms build && pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck`
  - `pnpm --filter @apps/cover-me-pretty build && pnpm --filter @apps/cover-me-pretty lint && pnpm --filter @apps/cover-me-pretty typecheck`
  - `pnpm --filter @apps/xa-c build && pnpm --filter @apps/xa-c lint && pnpm --filter @apps/xa-c typecheck`
  - `rg -n \"\\b(cookies|headers|draftMode)\\s*\\(\" apps --glob '!**/*.test.*' --glob '!**/*.spec.*'`
  - `rg -n \"searchParams|params\" apps --glob '**/page.*' --glob '**/layout.*' --glob '**/route.*' --glob '**/default.*' --glob '**/opengraph-image.*' --glob '**/icon.*' --glob '**/apple-icon.*' --glob '**/sitemap.*'`
  - `pnpm --filter @apps/cms exec npx next typegen`
  - `rg -n \"^main = \\\"\\.open-next/worker\\.js\\\"|^pages_build_output_dir|^\\[assets\\]|^\\[\\[d1_databases\\]\\]|^\\[\\[kv_namespaces\\]\\]|^\\[\\[queues\\.(producers|consumers)\\]\\]|^\\[\\[r2_buckets\\]\\]\" apps/*/wrangler.toml`
  - `rg -n \"_routes\\.json|routing =|invocation routes|include|exclude|fail open|fail closed\" apps/* docs/plans/nextjs-16-upgrade`
  - Manual dashboard/API snapshot: record current request volume and free-tier headroom for Workers/Pages Functions plus D1/KV/Queues usage into `docs/plans/nextjs-16-upgrade/cloudflare-free-tier-audit.md`
- **Horizon assumptions to validate:**
  - Async request API enforcement is fully satisfied (no residual `params`/`searchParams` signature mismatches and no unresolved sync dynamic API access in route/page/layout/metadata handler surfaces).
  - Runtime classification is sufficient to choose middleware vs proxy per app.
  - Cloudflare deployments remain inside Free-tier request, invocation, and binding limits without requiring a paid-plan fallback.
  - Image audit outputs are sufficient to decide whether pins are necessary.
  - Build heap policy is explicit and checkpoint builds are reproducible without ad-hoc local env tweaks.
  - Note (replan 2026-02-17): CMS `pnpm --filter @apps/cms build` may OOM on 16 GB machine even after TASK-22; checkpoint accepts `typecheck + lint + middleware validation` as primary gate; build evidence is best-effort and documented in build-oom-notes.md.

#### Re-plan Update (2026-02-17)
- Confidence: 95% → unchanged
- Key change: Added TASK-22 to Depends-on; CMS build (TC-01 in command set) noted as best-effort — typecheck+lint+middleware checks are the primary verification targets
- Dependencies: TASK-22 added; TASK-12 now complete
- Validation contract: unchanged — command set retained; annotated that CMS build may require 32 GB+
- Notes: see TASK-21/22 for the path to CMS build baseline

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
  - An automated probe exists for at least one protected CMS route asserting redirect/block semantics and required security headers.
- **Validation contract:**
  - TC-01: CMS build exits 0 under the repo’s chosen heap policy -> see TASK-10 (e.g. `NODE_OPTIONS=... pnpm --filter @apps/cms build`).
  - TC-02: `pnpm --filter @apps/cms lint && pnpm --filter @apps/cms typecheck` exit 0.
  - TC-03: Automated probe/test validates interception behavior for a protected CMS route and presence of required headers.
  - TC-04: Interception behavior smoke check (manual):
    - unauthenticated access to protected `/cms/shop/<shop>/...` is blocked
    - security headers are present on HTML responses
  - Acceptance coverage: TC-01/02/03/04 cover all acceptance criteria.
- **Execution plan:** Red -> Green -> Refactor
- **Rollout / rollback:**
  - Rollout: ship on `dev`, verify staging CMS.
  - Rollback: revert commit.
- **Documentation impact:** None.

#### Re-plan Update (2026-02-17)
- Confidence: 72% (→ 84% conditional on TASK-10, TASK-12) → 72% (→ 82% conditional on TASK-22); Evidence: E2 (spike build evidence)
- Key change: Promotion condition updated — TASK-12 spike done (complete); TASK-22 now provides the CMS typecheck+lint baseline that unblocks validation. Full `next build` exit 0 may require 32 GB+ CI; TC-01 softened to typecheck+lint primary gate.
- Dependencies: TASK-13 still blocks this; TASK-13 now depends on TASK-22; chain intact.
- Validation contract: TC-01 updated — CMS typecheck+lint exit 0 (from TASK-22); build attempt is best-effort documented in build-oom-notes.md.
- Notes: Confidence promotion condition changes from "TASK-12 makes build reproducible" to "TASK-22 produces typecheck+lint baseline"

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
  - Add a unit test for CSP hash generation helper (deterministic base64 SHA-256 output for known inputs).
- **Validation contract:**
  - TC-01: `pnpm --filter @apps/cover-me-pretty build` exits 0.
  - TC-02: `pnpm --filter @apps/cover-me-pretty lint && pnpm --filter @apps/cover-me-pretty typecheck` exit 0.
  - TC-03: Unit test for CSP hash helper passes.
  - TC-04: Manual smoke:
    - request to `/` redirects to `/${LOCALES[0]}` as before
    - request to `/<locale>/...` sets CSP when consent cookie is present
- **Execution plan:** Red -> Green -> Refactor
- **What would make this >=90%:** Add middleware integration probe asserting `sha256-...` appears in CSP for expected inline script.

### TASK-16: INVESTIGATE - Webpack Policy Coverage Hardening (Wrapper/Baseline Gaps)
- **Type:** INVESTIGATE
- **Deliverable:** Analysis artifact update in `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md` with a scanner-hardening recommendation and explicit scope map.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `scripts/check-next-webpack-flag.mjs`
  - `scripts/__tests__/next-webpack-flag-policy.test.ts`
  - `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md`
- **Depends on:** TASK-13
- **Blocks:** TASK-17
- **Confidence:** 86%
  - Implementation: 90% - gap inventory is straightforward and file-scoped.
  - Approach: 86% - must separate policy intent from scanner mechanics to avoid false confidence.
  - Impact: 86% - closes D-04 blind spot before policy decisions are finalized.
- **Questions to answer:**
  - Which wrapper/script locations currently bypass static enforcement?
  - Should enforcement extend to wrapper files or centralize all Next invocations to a helper?
- **Acceptance:**
  - A documented coverage map exists (what is covered vs intentionally out-of-scope).
  - At least one concrete hardening option is proposed with expected false-positive/false-negative tradeoffs.
  - D-04 status updated to either accepted limitation with rationale or converted to actionable implementation.
- **Validation contract:** Evidence review via command + file inspection; no behavior changes in this task.
- **Planning validation:** `None: investigation-only task`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Update audit artifact and this plan.

### TASK-17: DECISION - Dependency Ownership Model (`@acme/next-config` + Root Next Policy)
- **Type:** DECISION
- **Deliverable:** Decision log entry in this plan + selected ownership model with explicit rationale.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/next-config/package.json`
  - `root/package.json`
- **Depends on:** TASK-16
- **Blocks:** TASK-18
- **Confidence:** 83%
  - Implementation: 85% - decision mechanics are simple.
  - Approach: 83% - tradeoff between tooling clarity and package-local test ergonomics.
  - Impact: 83% - affects future upgrade hygiene and scanner signal quality.
- **Options:**
  - Option A: `@acme/next-config` uses peerDependencies for `next/react/react-dom` and optional devDependencies for local tests.
  - Option B: keep hard dependency declarations aligned to root versions.
- **Recommendation:** Option A (peer-first) unless a concrete package-local runtime constraint requires hard dependency.
- **Decision input needed:**
  - question: Should shared config package ownership be peer-first?
  - why it matters: determines D-01 remediation strategy and future version bump workflow.
  - default + risk: default peer-first; risk is slightly more setup complexity for isolated package testing.
- **Acceptance:**
  - Selected option recorded with rationale and migration implications.
  - D-01/D-02 remediation path explicitly defined.
- **Validation contract:** decision review in PR/plan notes.
- **Planning validation:** `None: decision task`
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** plan decision log + task updates.

### TASK-18: IMPLEMENT - Apply Dependency Policy Decision (D-01/D-02 Remediation)
- **Type:** IMPLEMENT
- **Deliverable:** Manifest updates aligned to TASK-17 decision.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/next-config/package.json`, `root/package.json`, `pnpm-lock.yaml`
- **Depends on:** TASK-17
- **Blocks:** TASK-20
- **Confidence:** 78%
  - Implementation: 80% - manifest edits are mechanical.
  - Approach: 78% - lockfile and downstream tooling effects need careful validation.
  - Impact: 80% - high leverage on upgrade hygiene; moderate risk to package-tooling assumptions.
- **Acceptance:**
  - D-01 resolved per selected ownership model.
  - D-02 resolved with one documented root ownership policy for `next`.
  - Workspace build/typecheck/lint baselines remain green for impacted packages.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm -r list next react react-dom --depth -1` shows expected resolved versions post-change.
  - TC-02: `pnpm why @next/env` reflects expected version topology after remediation.
  - TC-03: targeted validations for impacted workspaces pass (`typecheck` + `lint`).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: dependency graph + targeted package validation.
  - Validation artifacts: command outputs in task completion notes.
  - Unexpected findings: to capture during execution.
- **Scouts:** `None: policy-driven manifest change`
- **Edge Cases & Hardening:** lockfile churn and peer-resolution warnings must be reviewed explicitly.
- **What would make this >=90%:**
  - Pre-run dry validation in a throwaway branch confirming no peer-resolution regressions.
- **Rollout / rollback:**
  - Rollout: land with explicit changelog note in plan decision log.
  - Rollback: revert manifest + lockfile commit.
- **Documentation impact:** update config snapshot artifact drift section.

### TASK-19: INVESTIGATE - Turbopack Blocker Repro Matrix (Observed vs Assumed)
- **Type:** INVESTIGATE
- **Deliverable:** Repro matrix appended to `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md`.
- **Execution-Skill:** /lp-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/next-config/next.config.mjs`
  - `apps/cms/next.config.mjs`
  - `apps/brikette/next.config.mjs`
  - `docs/plans/nextjs-16-upgrade/config-snapshot-fact-find-2026-02-17.md`
- **Depends on:** TASK-13
- **Blocks:** TASK-20
- **Confidence:** 81%
  - Implementation: 82% - targeted repro probes are feasible.
  - Approach: 81% - must constrain probes to avoid broad migration work in planning tranche.
  - Impact: 81% - converts inference-only blocker claims into measurable evidence.
- **Questions to answer:**
  - Which blockers are reproducibly Turbopack-incompatible today?
  - Which are historical comments without current repro evidence?
- **Acceptance:**
  - Each blocker class labeled `Observed-repro` or `Unverified-assumption`.
  - For unverified blockers, a concise test protocol exists for future validation.
- **Validation contract:** command transcripts and pass/fail outcomes captured in artifact.
- **Planning validation:** required for M effort; include command list and outcome summary.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** config snapshot evidence quality upgraded.

### TASK-20: CHECKPOINT - Governance Tranche Replan And Confidence Recalibration
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan sequencing + confidence recalculation after TASK-18 and TASK-19.
- **Execution-Skill:** /lp-replan
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/nextjs-16-upgrade/plan.md`
- **Depends on:** TASK-18, TASK-19
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - process-defined checkpoint.
  - Approach: 95% - prevents stale confidence and stale dependency assumptions.
  - Impact: 95% - improves handoff quality for remaining implementation tasks.
- **Acceptance:**
  - `/lp-replan` run for any tasks impacted by dependency-policy or blocker-evidence updates.
  - Task confidences updated with explicit evidence deltas.
  - Cloudflare Free-tier posture is re-validated (quota assumptions, fail mode assignments, and invocation routing controls documented for touched apps).
  - Plan gates re-evaluated and recorded.
- **Horizon assumptions to validate:**
  - Dependency ownership decisions did not introduce new unresolved build/test constraints.
  - Turbopack blocker claims now have correct evidence labels.
- **Validation contract:** updated plan includes refreshed task table + gate statuses.
- **Planning validation:** replan evidence recorded in plan decision log.
- **Rollout / rollback:** `None: planning control task`

## Risks & Mitigations
- Next 16 Webpack builds OOM on default Node heap (observed in CMS and cover-me-pretty).
  - Mitigation: TASK-10 establishes heap/concurrency policy; TASK-11 enforces it for cover-me-pretty; CMS requires additional mitigation before TASK-14 can proceed.
- Middleware/proxy runtime mismatch causes production request interception failures.
  - Mitigation: TASK-02 runtime inventory + per-app smoke tests; prefer smallest-change migration.
- Node-only imports in Edge middleware lead to runtime bundling errors.
  - Mitigation: migrate to proxy when Node is acceptable; otherwise rewrite for Edge.
- Next/Image default drift causes silent visual/caching regressions.
  - Mitigation: TASK-06/07 audit + explicit config pins.
- Cloudflare Free-tier quota exhaustion can degrade routing or bypass middleware when fail-open modes are used.
  - Mitigation: enforce explicit fail-mode policy per route/app class, minimize Pages Functions invocation scope, and keep quota budgets documented at checkpoint tasks.

## Observability
- Logging: capture any middleware/proxy errors at request boundaries (app-level logger).
- Metrics: track error rates on protected CMS routes and key storefront routes after changes.

## Acceptance Criteria (overall)
- [ ] `pnpm --filter <touched-app> build` passes for all touched apps
- [ ] `pnpm --filter <touched-app> lint && pnpm --filter <touched-app> typecheck` pass for all touched apps
- [ ] No remaining sync route handler param signatures in `apps/**/src/app` (excluding tests)
- [ ] CMS has a single authoritative request interception entrypoint
- [ ] Image audit completed and config pins applied (if needed)
- [ ] Cloudflare Free-tier constraints are documented and validated for touched apps (request budget, fail mode, invocation routing, and binding usage)

## Confidence Formula
- Task confidence: `min(Implementation, Approach, Impact)`.
- Effort weights: `S=1`, `M=2`, `L=3`.
- Overall confidence: weighted average across all plan tasks.
- Completed tasks are treated as `100%` in the weighted average.

## Decision Log
- 2026-02-15: Created a post-upgrade hardening plan to cover Next 16 upgrade-guide enforcement and remaining runtime/deprecation surface. Legacy plan remains as phase 1 record.
- 2026-02-15: Build OOM surfaced as a gating risk for Webpack builds; enforce explicit heap headroom per app (preferred) rather than relying on ad-hoc local env or CI-only settings.
- 2026-02-17: Replanned in `plan-only` mode after audit-grade config snapshot. Added governance tranche (TASK-16..TASK-20) for policy coverage hardening, dependency ownership decisions, manifest drift remediation (D-01/D-02), and blocker-evidence quality upgrades.
- 2026-02-17: Applied audit-hygiene corrections: split status accounting into Remaining/Completed/Deferred, filled missing TASK-11 commit evidence, defined deterministic TASK-13 checkpoint commands, added runtime policy outcomes (Edge middleware vs Node proxy), and documented confidence formula treatment for completed tasks.
- 2026-02-17: Added explicit Cloudflare Free-tier guardrails (Workers/Pages quotas, fail-mode policy, and invocation-scope checks) to keep the plan compliant with Free-tier deployment constraints.
- 2026-02-17: TASK-12 spike complete (evidence committed, `71fe4c561d`). Primary hypothesis invalidated: typescript import was a minor contributor; root cause is CMS build graph (130+ routes + transpilePackages) requiring >12 GB on 16 GB machine. Created precursor chain TASK-21 (INVESTIGATE: transpilePackages audit) → TASK-22 (IMPLEMENT: apply reduction + commit deferred config). TASK-13 now depends on TASK-22. TASK-14 confidence condition updated from "TASK-12" to "TASK-22." CMS full build (exit 0) may require 32 GB+ CI machine; checkpoint accepts typecheck+lint as primary verification gate.
