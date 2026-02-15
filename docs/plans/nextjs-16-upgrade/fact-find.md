---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
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
Related-Plan: docs/plans/nextjs-16-upgrade-plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Next.js 16 Upgrade Audit Fact-Find (Release Notes Alignment)

## Scope
### Summary
Audit the current `dev` branch (commit `f060014a752c3d444616b35619200476a4c74812`) against the official Next.js 16 release notes to identify:
- remaining breaking-risk issues
- remaining deprecated usage
- pragmatic opportunities to get more value from the upgrade

This is FACT-FIND ONLY: no migrations are applied in this brief.

### Goals
- Confirm Next 16 upgrade prerequisites are enforced (Node, React, lint toolchain)
- Identify any remaining Next 16 breaking-surface work (async request APIs, config removals)
- Identify and scope deprecation cleanup work (middleware -> proxy, config renames)
- Seed follow-up tasks that reduce regression risk and improve upgrade ROI

### Non-goals
- Implement fixes (that belongs in `/lp-build` tasks)
- Turbopack migration of custom webpack apps
- Middleware -> `proxy.ts` migration where Edge runtime is required

### Constraints & Assumptions
- Constraints:
  - This repo intentionally forces Webpack via CLI `--webpack` to preserve existing custom webpack behavior.
  - Some apps require Edge middleware behavior (rewrites/auth headers), so `proxy.ts` (Node-only per Next 16) is not universally viable.
- Assumptions:
  - CI and local dev use Node >=20.9.0 (verified via `.nvmrc` + GitHub Actions pin).

## Evidence Audit (Current State)
### Entry Points
- Root versions and constraints: `package.json`, `.nvmrc`, `.github/workflows/test.yml`
- Next app scripts (webpack opt-out enforcement): `apps/*/package.json`
- Middleware surface area: `apps/*/middleware.ts`, `apps/*/src/middleware.ts`
- Async Request API surface area: `apps/**/src/app/**` (pages + route handlers)

### Key Modules / Files
- Version pins:
  - `package.json` (Next 16.1.6, React 19.2.1, ESLint 9.30.1, eslint-config-next 16.1.6, next-auth 4.24.12, next-intl ^4.8.2)
  - `.nvmrc` (20.19.4)
  - `.github/workflows/test.yml` (node-version: 20.19.4)
- Webpack enforcement:
  - `apps/*/package.json` scripts all use `next build --webpack` and `next dev --webpack`.
- Middleware locations (Next 16 deprecation applies):
  - `apps/brikette/src/middleware.ts`
  - `apps/business-os/src/middleware.ts`
  - `apps/cms/src/middleware.ts`
  - `apps/cms/middleware.ts` (NOTE: duplicate location with `src/middleware.ts`)
  - `apps/xa/middleware.ts`
  - `apps/xa-b/middleware.ts`
  - `apps/xa-j/middleware.ts`
  - `apps/cover-me-pretty/middleware.ts`

### Patterns & Conventions Observed
- Next 16 prereqs are aligned:
  - Node engines are tightened and dev/CI pins exist (`package.json`, `.nvmrc`, `.github/workflows/test.yml`).
  - React/ReactDOM and TS types are aligned with React 19 (`package.json`).
- ESLint 9 + flat config is present:
  - `eslint.config.mjs` exists at repo root; ESLint is `^9.x` (`package.json`).
- Webpack safety net is applied consistently:
  - All Next apps’ `build`/`dev` scripts include `--webpack` (`apps/*/package.json`).
- Async request APIs are broadly migrated:
  - Many `params: Promise<...>` call sites exist across apps.
  - `cookies()`, `headers()`, `draftMode()` are used as `await cookies()` / `await headers()` / `await draftMode()` in key packages.

### Dependency & Impact Map
- Upstream dependencies:
  - Next.js 16 introduces removals/deprecations that can hard-break builds when hit (async params, removed `next lint`, removed runtime config).
- Downstream dependents:
  - 14+ apps in `apps/` plus shared packages (`packages/auth`, `packages/ui`, `packages/template-app`) are affected by Dynamic API changes.
- Likely blast radius:
  - Middleware warnings and runtime compatibility are the riskiest area because some middleware currently mixes Node-only dependencies.

### Test Landscape
- CI explicitly runs `lint` + `typecheck` per workspace:
  - `.github/workflows/test.yml` runs `pnpm --filter <workspace> lint` and `pnpm --filter <workspace> typecheck`.
- Known gaps to validate (not executed in this fact-find run):
  - Fresh clone test runner robustness (script executability vs `bash script.sh`).
  - Jest haste-map collisions due to duplicate `__mocks__` across apps (previously observed; verify in follow-up).

## External Research (Next.js 16 Release Notes)
Source: `https://nextjs.org/blog/next-16`

Relevant items to this repo:
- **Breaking behavior**
  - `next build` uses Turbopack by default; opt out via `--webpack`.
  - Async Request APIs are enforced (e.g. `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`).
  - Parallel routes now require `default.(js|tsx)` per slot.
  - `next/script` no longer sets `scroll-behavior: smooth` automatically; opt in via `data-scroll-behavior="smooth"`.
- **Removals**
  - `next lint` removed; `next build` no longer runs lint.
  - AMP removed.
  - `devIndicators` options removed.
  - `publicRuntimeConfig` / `serverRuntimeConfig` removed.
- **Deprecations**
  - `middleware.{js,ts}` file convention deprecated in favor of `proxy` (Node-only).

## Findings

### 1) Avoid Breaking Issues (Remaining Work)

1) Residual sync `params` types in route handlers
- `apps/cms/src/app/api/auth/[...nextauth]/route.ts` uses `ctx: { params: { nextauth: string[] } }` and forwards to `handler(req, ctx)`.
- `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts` types context as `{ params: { id: string } }`.

Why it matters:
- Next 16 type generation expects `params`/`searchParams` to be Promises across entrypoints, including route handlers. Even if the params are unused, mismatched handler signatures can fail build/typecheck.

2) CMS has two middleware entrypoints (high-risk ambiguity)
- Both `apps/cms/middleware.ts` and `apps/cms/src/middleware.ts` exist.

Why it matters:
- Next supports middleware under repo root or `src/`, but having both is ambiguous and can cause build-time errors or “wrong middleware runs” behavior.
- `apps/cms/middleware.ts` imports Node crypto (`import crypto from "crypto"`) and `helmet`, which is unlikely to be compatible with Edge middleware semantics.

3) Node-only crypto usage inside middleware (runtime risk)
- `apps/cover-me-pretty/middleware.ts` imports `node:crypto` and uses `createHash`.
- `apps/cms/middleware.ts` imports Node `crypto`.

Why it matters:
- Next 16 deprecates middleware in favor of Node-only `proxy.ts`, but `proxy.ts` is not Edge-capable per release notes. If these middleware must remain Edge, Node crypto usage must be eliminated (Web Crypto / alternative approach).

4) Middleware deprecation warnings are currently unavoidable in some apps
- Multiple middleware files exist (see list above).

Why it matters:
- If “no warnings in build output” is still a hard acceptance criterion, it may be unattainable until Next provides an Edge-compatible proxy story. Plan/CI should treat this as a known/allowed deprecation (or explicitly fail only on unexpected warnings).

### 2) Move Away From Deprecated Elements

Already clean / no evidence of deprecated usage:
- No `next lint` in scripts/CI (`.github/workflows/test.yml` runs ESLint directly).
- No AMP usage (`useAmp` / `amp: true` not found).
- No `devIndicators` options found.
- No `next/config` runtime config usage found (`next/config`, `publicRuntimeConfig`, `serverRuntimeConfig`).
- No `images.domains` or `next/legacy/image` usage found.

Remaining deprecation surface:
- Middleware filename deprecation: multiple apps still use `middleware.ts` (expected).

### 3) Make The Most Of The Upgrade (Opportunities)

1) Turbopack build/dev adoption (selective, after stability)
- Current state forces Webpack everywhere (`--webpack`).
- A contained pilot could target the simplest app with minimal custom webpack to evaluate:
  - build time improvements
  - compatibility with existing tooling (OpenNext/Cloudflare where relevant)

2) React Compiler pilot (only where it is safe)
- Next 16 release notes highlight React 19 era improvements.
- A pilot should be limited to one app/package, with perf and regression checks.

3) Explicitly codify “warnings policy”
- If middleware deprecation warnings are expected, encode a policy:
  - allowlisted warnings vs failing on any warning
  - where warnings are checked (CI log scan step vs local discipline)

## Questions
### Resolved
- Q: Is Node >=20.9.0 enforced in dev/CI?
  - A: Yes. `.nvmrc` is `20.19.4` and GitHub Actions pins `20.19.4`; `package.json` depends on Node >=20.9.0.
  - Evidence: `.nvmrc`, `.github/workflows/test.yml`, `package.json`.

### Open (User Input Needed)
- Q: Should middleware deprecation warnings be allowed (explicit allowlist), or should we treat them as failing the build?
  - Why it matters: Next 16 deprecates middleware in favor of `proxy.ts` but `proxy.ts` is Node-only; some apps appear to require Edge behavior.
  - Decision impacted: Upgrade acceptance criteria, CI log policy.
  - Default assumption + risk: Allowlist known middleware warnings; risk is missing a new warning class unless log scanning is still strict for unknown warnings.

## Confidence Inputs (for /lp-plan)
- **Implementation:** 85%
  - We have concrete, file-specific remaining work items and a clear validation surface.
- **Approach:** 80%
  - Middleware/proxy direction is constrained by Edge runtime needs; requires explicit policy and possibly architectural follow-ups.
- **Impact:** 78%
  - Most repo-wide removals are already clean, but middleware and remaining async params signatures can still break builds.
- **Delivery-Readiness:** 85%
  - CI already runs lint/typecheck/tests per workspace, enabling tight iteration.
- **Testability:** 75%
  - Some known test infrastructure hazards exist (fresh-clone script executability, jest mock collisions) and should be stabilized.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|------------|--------|----------------------------|
| Residual sync `params` handler signatures cause typegen/build failures | Medium | High | Run repo-wide async API audit/codemod + fix remaining call sites; add grep-based gate for common patterns. |
| Duplicate CMS middleware entrypoints causes wrong middleware to run or build ambiguity | Medium | High | Consolidate to a single middleware entrypoint; verify target runtime compatibility. |
| Node crypto usage in middleware breaks in Edge deployments | Medium | High | Replace with Web Crypto or move logic elsewhere (headers config / server route); decide per-app runtime expectations. |
| Middleware deprecation causes noisy builds or policy failures | High | Medium | Adopt allowlist policy; track Next guidance for Edge-compatible proxy path. |
| React 19 peer-dep mismatches in third-party libs (install/runtime risk) | Medium | High | Run `pnpm install` with peer warnings as errors in CI (or explicitly allow); upgrade/replace incompatible deps. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep `--webpack` for build/dev until Turbopack migration is explicitly planned and tested.
  - Prefer repo-wide codemods + targeted fixes over per-app manual hunting for async API regressions.
- Rollout/rollback expectations:
  - Changes should be staged per app where possible (especially middleware).

## Suggested Task Seeds (Non-binding)
- TASK-A: Repo-wide async request API “residuals” sweep
  - Add a gate for route handler signatures still using `{ params: { ... } }` and convert to `Promise` + `await`.
  - Fix specific known files:
    - `apps/cms/src/app/api/auth/[...nextauth]/route.ts`
    - `apps/cover-me-pretty/src/app/api/orders/[id]/tracking/route.ts`
- TASK-B: Middleware inventory + consolidation
  - For each middleware file: classify required runtime (Edge vs Node-only behavior), then decide:
    - keep middleware and remove Node-only code
    - move logic into route handlers / headers config
    - (where possible) adopt `proxy.ts` (Node-only) when Edge is not required
  - Resolve CMS duplicate middleware location.
- TASK-C: Peer dependency compatibility audit (React 19)
  - Identify any packages peering only to React 18 and decide upgrade/replace/pin strategy.
- TASK-D: Test infrastructure hardening (if still failing)
  - Eliminate jest `__mocks__` collisions across apps.
  - Ensure scripts invoked by tests are run via `bash` rather than relying on executable bits.
- TASK-E (Optional): Turbopack pilot
  - Select one low-customization app, remove `--webpack` in a short-lived branch, measure build/dev and validate.
- TASK-F (Optional): React Compiler pilot
  - Enable in one isolated app with perf/regression checks.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-build`
- Deliverable acceptance package:
  - Targeted builds for affected apps + `lint`/`typecheck` gates
  - Clear policy for known deprecations (middleware) vs unknown warnings

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any): None (but middleware warning policy needs an explicit decision during planning).
