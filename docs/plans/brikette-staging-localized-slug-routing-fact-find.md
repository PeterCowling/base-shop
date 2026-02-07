---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Brikette/Routing
Last-reviewed: 2026-02-07
Relates-to:
  - docs/business-os/business-os-charter.md
Feature-Slug: brikette-staging-localized-slug-routing
Related-Plan: docs/plans/brikette-staging-localized-slug-routing-plan.md
---

# Brikette Staging Localized Slug Routing — Fact-Find

## Executive Findings
- Staging is deployed as static export (`output: 'export'`), so Next middleware does not run there.
- App links and sitemap generation still emit localized slugs (for example `/en/help`, `/fr/aide`, `/es/experiencias`) that depend on middleware rewriting.
- On staging, those localized slugs return `404`, while internal route segments (`/assistance`, `/experiences`, `/how-to-get-here`, etc.) return `200`.
- Current `public/_redirects` only covers `/`, `/api/health`, and `/directions/:slug`; it does not cover localized section slugs.
- CI did not catch this because middleware tests are unit-only and post-deploy health checks do not probe localized slug routes.

## Scope
### Summary
Audit why localized top-level slugs fail on Brikette staging and define an implementation-ready remediation path that preserves Cloudflare free-tier constraints.

### Goals
- Identify root cause with file-level evidence.
- Quantify user-facing impact on staging.
- Propose low-risk fix options compatible with static export.
- Define plan-ready tasks and acceptance criteria.

### Non-goals
- Migrating staging from static export to Worker runtime.
- Changing production routing behavior.
- Implementing fixes in this fact-find step.

## Repo Evidence
### 1) Staging is static export; middleware is intentionally unavailable
- `.github/workflows/brikette.yml`
  - Staging build sets `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1` and deploys `apps/brikette/out` via `wrangler pages deploy out --branch staging`.
- `packages/next-config/index.mjs`
  - `OUTPUT_EXPORT` enables `output: "export"`.
- `docs/brikette-deploy-decisions.md`
  - Explicitly documents: middleware does not run on staging static Pages.

### 2) Middleware is still the only locale-slug rewrite mechanism in app runtime
- `apps/brikette/src/middleware.ts`
  - Rewrites localized first segments to internal segments.
  - Performs wrong-locale redirects (for example internal `assistance` -> localized `aide`).
- There is no equivalent runtime rewrite layer in static Pages except `public/_redirects`.

### 3) `_redirects` currently does not cover localized slug routing
- `apps/brikette/public/_redirects` only includes:
  - `/  /en/ 302`
  - `/api/health  /en/ 302`
  - `/directions/:slug  /en/how-to-get-here/:slug 301`

### 4) Link/sitemap sources emit localized slugs
- `apps/brikette/src/routing/routeInventory.ts`
  - Builds URLs with `getSlug(...)` (localized section slugs).
- `apps/brikette/scripts/generate-public-seo.ts`
  - Uses `listAppRouterUrls()` as sitemap source.
- `apps/brikette/src/guides/slugs/namespaces.ts`
  - `guideNamespace(...).baseSlug` uses localized slug via `getSlug`.

## Runtime Verification (Staging)
All checks against `https://staging.brikette-website.pages.dev`.

### Top-level section slugs
A scripted probe across 18 locales and representative section keys (`assistance`, `experiences`, `howToGetHere`, `rooms`, `about`) found:
- Localized slug path: `404`
- Internal segment path: `200`

Examples:
- `/en/help` -> `404`, `/en/assistance` -> `200`
- `/fr/aide` -> `404`, `/fr/assistance` -> `200`
- `/es/experiencias` -> `404`, `/es/experiences` -> `200`
- `/es/como-llegar` -> `404`, `/es/how-to-get-here` -> `200`

### Nested route impact
Localized base segments also fail on nested routes:
- `/es/experiencias/acampar-en-la-costa-amalfitana` -> `404`
- `/es/experiences/acampar-en-la-costa-amalfitana` -> `200`

### User-facing crawl samples
Homepage link crawl (Playwright + HEAD checks):
- `/en`: 14 internal links checked, 5 broken (`/en/help*` family).
- `/es`: 14 internal links checked, 11 broken (localized sections + help links).

### Quantified mismatch set
Slug-map audit for top-level candidate sections (middleware candidates):
- 233 localized-vs-internal mismatches across 18 locales.

## Why CI Did Not Catch It
- `apps/brikette/src/test/middleware.test.ts` validates middleware behavior in isolation, not deployed static behavior.
- `apps/brikette/src/test/migration/url-inventory.test.ts` validates fixture parity and only asserts `_redirects` contains `/directions/:slug`.
- `scripts/post-deploy-health-check.sh` currently checks homepage and `/api/health` only (via reusable workflow), not localized slug routes.

## Root Cause
Staging static export depends on edge redirects for locale slug compatibility, but redirect coverage is incomplete.

Causal chain:
1. Static export disables middleware routing.
2. App still generates localized URLs.
3. `_redirects` does not map localized section slugs to internal static paths.
4. Localized URLs 404 on staging.

## Options
### Option A (Recommended): Generate localized slug redirects into `_redirects`
- Add a generator that derives rules from `slug-map.ts` + internal segment map.
- Cover:
  - Top-level sections (for example `/fr/aide` -> `/fr/assistance`).
  - Nested paths (for example `/fr/aide/*` -> `/fr/assistance/:splat`).
  - Experiences tags localized segment (`guidesTags`) mapping to internal `tags`.
- Keep manually authored redirects (`/`, `/api/health`, `/directions/:slug`) as non-generated header block.
- Benefits: minimal runtime risk, static-compatible, deterministic parity with slug source of truth.
- Risk: ordering mistakes can cause multi-hop or shadowed redirects; mitigate with generated ordering tests.

### Option B: Conditional URL generation for static mode
- Emit internal segment URLs when `OUTPUT_EXPORT=1`.
- Benefits: fewer redirect rules.
- Risks: broad app-wide behavior split, high blast radius, regression risk in navigation/SEO links.

### Option C: Move staging to Worker runtime
- Restores middleware naturally.
- Not viable under current free-tier constraints and existing deployment strategy.

## Recommendation
Proceed with Option A and treat redirect generation as code-generated infrastructure, not hand-maintained config.

## Plan-Ready Task Seeds
1. Create redirect generator (`scripts/`), sourced from `slug-map.ts` + internal segment map, outputting a managed block in `apps/brikette/public/_redirects`.
2. Include both section root and nested wildcard rules for all localized mismatches.
3. Add specific handling for localized `guidesTags` path under localized experiences base.
4. Add tests that verify generated redirect coverage for all mismatches (not just `/directions/:slug`).
5. Extend staging post-deploy health checks to probe representative localized URLs (for example `/en/help`, `/fr/aide`, `/es/experiencias`).
6. Verify staging deploy run + Cloudflare deployment with localized-route smoke tests across at least EN/FR/ES.

## Acceptance Criteria for Implementation Plan
- Localized section roots resolve (200/301->200) on staging for all supported locales.
- Localized nested guide/article/room/tag URLs resolve on staging.
- `_redirects` coverage is generated and test-enforced against `slug-map.ts`.
- Post-deploy checks fail fast when localized slug routing regresses.

## Residual Risk
- Cloudflare `_redirects` pattern precedence errors can silently regress specific paths if ordering is incorrect.
- Mitigation: deterministic generator order + explicit integration assertions for section roots and nested examples.

## Pending Audit Work
- Verify behavior on `staging.hostel-positano.com` from an environment with stable DNS resolution to confirm parity with `staging.brikette-website.pages.dev`.
- Confirm final wildcard placeholder style (`:splat` mapping) in deployed `_redirects` syntax with one canary rule before full rollout.
