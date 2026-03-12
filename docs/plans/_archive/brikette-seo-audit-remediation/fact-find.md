---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: brikette-seo-audit-remediation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/brikette-seo-audit-remediation/analysis.md
Trigger-Why: SEO tech audit (2026-03-08, fact-checked 2026-03-12) identified 4 open issues degrading crawl quality, content indexability, and freshness signals on hostel-positano.com
Trigger-Intended-Outcome: "type: operational | statement: All sitemap URLs return 200, no i18n keys leak in SSR HTML for how-to-get-here pages, /assistance redirects correctly, lastmod coverage ≥60% | source: auto"
---

# Brikette SEO Audit Remediation Fact-Find Brief

## Scope

### Summary

The SEO tech audit for hostel-positano.com (2026-03-08, fact-checked 2026-03-12) identified 4 open issues across sitemap generation, i18n SSR, redirect configuration, and content metadata. Two original findings (broken `/en/help`, `www` redirects) have already been resolved. The remaining 4 are all code/config changes in the brikette app.

### Goals

- Remove 24 dead `/directions/*` 404 URLs from the sitemap
- Fix i18n key leakage on how-to-get-here guide pages (SSR rendering shows raw keys)
- Add missing `/assistance` → `/en/help` redirect
- Improve `lastmod` sitemap coverage from 23% toward ≥60%

### Non-goals

- Keyword research, content strategy, or SERP analysis (those are lp-seo Phases 1-3, blocked on offer/channels artifacts)
- Google Search Console integration (no API access; tracked as backfill in standing artifact)
- Core Web Vitals optimization (separate concern)

### Constraints & Assumptions

- Constraints:
  - Tests run in CI only (no local test execution per testing policy)
  - Static export build (`OUTPUT_EXPORT=1`) has unique constraints (no middleware, no dynamic routes)
  - `_redirects` file governs Cloudflare Pages edge redirects
- Assumptions:
  - The 24 `/directions/*` slugs are a finite, stable set from `routes.json`
  - The i18n leakage is a namespace preload ordering issue, not a missing translation
  - `lastmod` backfill can be done via content JSON without schema changes

## Outcome Contract

- **Why:** SEO tech audit identified crawl waste (24 dead URLs in sitemap), content quality degradation (raw i18n keys visible to Google on transport guide pages), and sparse freshness signals (77% of sitemap without lastmod). These directly impact search indexing quality for a 1,246-URL multilingual travel site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All sitemap URLs return 200, no i18n keys leak in SSR HTML for how-to-get-here pages, /assistance redirects correctly, lastmod coverage ≥60%
- **Source:** auto

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/scripts/generate-public-seo.ts` — sitemap generation (findings #1, #3 lastmod)
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` — transport guide SSR (finding #2)
- `apps/brikette/public/_redirects` — Cloudflare edge redirects (findings #1 redirect, #3 assistance)

### Key Modules / Files

1. `apps/brikette/scripts/generate-public-seo.ts` — `listCanonicalSitemapPaths()` (line ~248), `listDirectionPaths()` (lines 244-246), `shouldExcludeFromSitemap()` (lines 67-81), `buildGuideLastmodByPath()` (lines 133-164), `resolveGuideLastmod()` (lines 98-116)
2. `apps/brikette/src/data/how-to-get-here/routes.json` — 24 route slugs that feed into dead sitemap entries
3. `apps/brikette/src/routing/routeInventory.ts` — `listLocalizedPublicUrls()` (lines 111-154) already includes canonical `/en/how-to-get-here/*` URLs
4. `apps/brikette/public/_redirects` — line 20: `/directions/:slug /en/how-to-get-here/:slug 301` (only catches bare `/directions/`, not `/en/directions/`)
5. `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` — line 111: calls `loadGuideI18nBundle()`, line 53: preloads `guides` namespace for metadata only
6. `apps/brikette/src/app/_lib/guide-i18n-bundle.ts` — `loadGuideI18nBundle()` (lines 49-50): calls `getTranslations(lang, ["guides"])` but timing may not cover SSR render of child components
7. `apps/brikette/src/components/guides/PlanChoice.tsx` — line 34: `useTranslation("guides", { lng: lang })` — requires guides namespace preloaded before SSR
8. `apps/brikette/src/components/guides/TransportNotice.tsx` — line 60: `useTranslation("guides", { useSuspense: false })` — same preload dependency
9. `apps/brikette/src/locales/en/guides/components.json` — contains `planChoice.title`, `planChoice.options.*` keys
10. `apps/brikette/src/locales/en/guides/transportNotice.json` — contains `transportNotice.title`, `transportNotice.items.*` keys

### Patterns & Conventions Observed

- Sitemap generation is a build-time script, not a runtime route — evidence: `scripts/generate-public-seo.ts`
- Redirect rules use Cloudflare Pages `_redirects` format (`:slug` placeholder, no language prefix matching by default) — evidence: `public/_redirects`
- Guide i18n uses a two-layer system: central bundle (guide-specific content) + namespace preload (shared component keys) — evidence: `guide-i18n-bundle.ts`, `loadI18nNs.ts`
- `lastmod` is only sourced from guide content JSON `lastUpdated` / `seo.lastUpdated` fields — evidence: `resolveGuideLastmod()` lines 98-116

### Data & Contracts

- Types/schemas/events:
  - `GuideLastmodResolution` type returned by `resolveGuideLastmod()` — `{ lastmod: string | undefined, hasConflict: boolean }`
  - Sitemap XML contract: `<url><loc>...</loc>[<lastmod>...</lastmod>]</url>`
- Persistence:
  - Sitemap emitted to `public/sitemap.xml` and `out/sitemap.xml` at build time
  - Guide content JSON at `apps/brikette/src/locales/{lang}/guides/content/*.json`
- API/contracts:
  - No external API dependencies for any fix

### Dependency & Impact Map

- Upstream dependencies:
  - `routes.json` defines the 24 direction slugs (consumed by `listDirectionPaths()`)
  - Guide content JSON files define `lastUpdated` values
  - `guides.imports.ts` GLOBAL_IMPORTS array defines which sub-namespaces load under `guides`
- Downstream dependents:
  - Sitemap consumed by Google/Bing crawlers
  - SSR HTML consumed by search engine crawlers (first-pass indexing)
  - `_redirects` consumed by Cloudflare Pages edge
- Likely blast radius:
  - Finding #1 (sitemap cleanup): sitemap only — no page rendering affected
  - Finding #2 (i18n preload): how-to-get-here guide pages only — experiences and help sections unaffected
  - Finding #3 (redirect): single redirect rule addition — minimal risk
  - Finding #4 (lastmod): sitemap metadata only — no page rendering affected

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (unit/integration), governed test runner
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=<pattern>`
- CI integration: tests run in CI only per testing policy

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Sitemap lastmod | Unit | `src/test/lib/generate-public-seo.lastmod.test.ts` | TC-12 (lastmod emission), TC-13 (precedence + bulk guard), TC-14 (canonical path inclusion) |
| SSR i18n audit | Integration | `src/test/app/guides/guide-content-ssr-audit.test.tsx` | Renders GuideContent server-side and checks for leaked i18n placeholders |

#### Coverage Gaps

- No test asserts that `/directions/*` URLs are absent from sitemap
- SSR audit test exists but the how-to-get-here pages with `planChoice`/`transportNotice` may not be covered in the test sample
- No test validates `_redirects` rules

#### Testability Assessment

- Easy to test:
  - Sitemap URL exclusion (extend TC-14 to assert no `/directions/*` URLs)
  - `lastmod` coverage improvements (extend TC-12)
- Hard to test:
  - `_redirects` rules (Cloudflare Pages runtime, not testable locally)
  - Actual SSR i18n preload timing (depends on server-only module loading order)
- Test seams needed:
  - None — existing test infrastructure covers both sitemap and SSR audit

#### Recommended Test Approach

- Unit tests for: sitemap exclusion of `/directions/*` paths (extend generate-public-seo tests)
- Integration tests for: SSR i18n audit including how-to-get-here pages with PlanChoice/TransportNotice
- Contract tests for: `lastmod` coverage threshold assertion

### Recent Git History (Targeted)

- `5eee52c4f4` — "Harden Brikette rich text and SEO contracts"
- `8b64d76350` — "Fix Brikette stale i18n namespace cache"
- `747196ad8c` — "fix(brikette): finalize localized route rollout"
- `67cbec2149` — "fix(brikette): restore SEO + SSR content for private accommodation booking page"
- `1dc4e3f8fa` — "feat(brikette): rename rooms→dorms and apartment→private-rooms with full locale support"

The `/en/help` fix likely happened during this period (SSR content restoration and SEO hardening).

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No visual changes — all fixes are build-time scripts and edge config | None | None |
| UX / states | N/A | No user-facing interaction changes | None | None |
| Security / privacy | N/A | No auth, input handling, or data exposure changes | None | None |
| Logging / observability / audit | N/A | Sitemap generation logs to build output; no runtime logging changes | None | None |
| Testing / validation | Required | Existing tests cover sitemap lastmod (TC-12/13/14) and SSR i18n audit. No test for sitemap URL exclusion of `/directions/*` | Add sitemap exclusion assertion; verify SSR audit covers how-to-get-here pages | Add test tasks for sitemap exclusion and SSR i18n coverage |
| Data / contracts | Required | Sitemap XML contract unchanged. Guide content JSON `lastUpdated` field already defined. `_redirects` format is stable. | `lastmod` backfill needs ~128 guide content files updated per language (only for guides that actually have known update dates) | Plan lastmod backfill scope carefully |
| Performance / reliability | N/A | Build-time changes only; no runtime performance impact | None | None |
| Rollout / rollback | Required | Deployed via standard Cloudflare Pages pipeline. Sitemap changes take effect on next build. Redirects take effect on next deploy. | All changes are independently deployable and reversible. Sitemap cleanup can be rolled back by re-adding `listDirectionPaths()` | Standard deploy; no migration ordering concerns |

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Sitemap generation (`generate-public-seo.ts`) | Yes | None | No |
| Direction paths data source (`routes.json`) | Yes | None | No |
| URL inventory (`routeInventory.ts`) | Yes | None | No |
| Cloudflare redirects (`_redirects`) | Yes | None | No |
| i18n SSR preload chain (`guide-i18n-bundle.ts` → `loadI18nNs.ts` → component `useTranslation`) | Partial | [Scope gap] [Minor]: Exact timing of `getTranslations()` call vs. component render in RSC pipeline needs verification during build — the investigation identified the likely gap but root cause is based on reasoning about execution order, not traced in a debugger | No |
| Guide content JSON (`lastUpdated` field coverage) | Yes | None | No |
| Existing test coverage | Yes | None | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** All 4 findings are well-bounded code/config changes in a single app. Root causes are identified with file paths and line numbers. Existing test infrastructure covers the relevant areas. No external dependencies or cross-app impact.

## Questions

### Resolved

- Q: Are the `/directions/*` URLs actually needed in the sitemap for any purpose?
  - A: No. The canonical how-to-get-here URLs are already included via `listLocalizedPublicUrls()`. The `/directions/*` paths are purely legacy redirect sources defined in `_redirects`.
  - Evidence: `routeInventory.ts:111-154`, `_redirects:20`

- Q: Why does `/en/experiences/cheap-eats-in-positano` render correctly but `/en/how-to-get-here/naples-airport-positano-bus` doesn't?
  - A: The experience pages don't use `PlanChoice` or `TransportNotice` components. These components require `guides/components` and `guides/transportNotice` sub-namespaces that must be preloaded server-side. The guide content itself (title, body) loads correctly — it's the shared component translations that fail.
  - Evidence: `PlanChoice.tsx:34`, `TransportNotice.tsx:60`, `guides.imports.ts:23-35`

- Q: Should we add a redirect for `/en/directions/:slug` as well as removing from sitemap?
  - A: Yes. The existing `_redirects` rule catches `/directions/:slug` but not `/en/directions/:slug`. Adding the language-prefixed variant catches any remaining inbound links while we clean up the sitemap.
  - Evidence: `_redirects:20`, verified: `/en/directions/naples-to-positano-by-bus` returns 404

- Q: What's the right approach for `lastmod` backfill — bulk timestamp or per-guide dates?
  - A: Per-guide dates are more valuable to Google. For guides with unknown update dates, the most reliable fallback is git commit date of the content file. A build-time script could extract this. Bulk-stamping with today's date is blocked by the `assertNoBulkTodayLastmod()` guard (≥50 entries with ≥95% same-day → error).
  - Evidence: `generate-public-seo.ts:166-182`

### Open (Operator Input Required)

None. All questions resolved from available evidence.

## Confidence Inputs

- Implementation: 90% — all 4 fixes have identified root causes and clear code changes. Finding #2 (i18n preload) has slight uncertainty around exact SSR timing.
  - To ≥95%: verify i18n preload fix with a local SSR render test
- Approach: 95% — standard code fixes with no architectural changes
  - To 100%: n/a, already high confidence
- Impact: 85% — fixes directly address crawl quality and content indexability. `lastmod` impact is softer (Google treats lastmod as advisory, not authoritative).
  - To ≥90%: post-deployment verification via Google Search Console coverage report
- Delivery-Readiness: 90% — no blockers, no external dependencies, existing test coverage
  - To ≥95%: ship and verify in CI
- Testability: 85% — existing test infrastructure covers sitemap and SSR audit. `_redirects` not locally testable.
  - To ≥90%: extend existing test suites per recommended test approach

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| i18n fix changes preload order, causing side effects on other guide pages | Low | Medium | SSR audit test covers a sample of guide pages; run full guide SSR audit after fix |
| Removing `listDirectionPaths()` breaks something that depends on it | Very Low | Low | Function is only called from `listCanonicalSitemapPaths()`; search confirms no other consumers |
| `lastmod` backfill accidentally triggers bulk-today guard | Low | Low | Guard rejects ≥95% same-day entries; stagger backfill or use actual git dates |
| `/en/directions/:slug` redirect rule interacts with existing route matching | Very Low | Low | No App Router routes match this pattern; `_redirects` takes precedence at edge |

## Planning Constraints & Notes

- Must-follow patterns:
  - Tests run in CI only — push and watch
  - Sitemap generation is a build script, not a route handler
  - `_redirects` is the redirect mechanism (no middleware on static export)
- Rollout/rollback expectations:
  - All 4 fixes are independently deployable
  - Sitemap and redirect changes take effect on next deploy
  - i18n fix requires app rebuild
- Observability expectations:
  - Post-deploy: verify sitemap via `curl https://hostel-positano.com/sitemap.xml`
  - Post-deploy: verify SSR via `curl https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus` and check for raw keys
  - Post-deploy: verify redirect via `curl -I https://hostel-positano.com/assistance`

## Suggested Task Seeds (Non-binding)

1. Remove `/directions/*` from sitemap generation + add `/en/directions/:slug` redirect rule + add sitemap exclusion test
2. Fix i18n namespace preload for how-to-get-here pages (PlanChoice/TransportNotice SSR) + extend SSR audit test coverage
3. Add `/assistance` → `/en/help` redirect to `_redirects`
4. Backfill `lastmod` for guide content JSON files (investigate git-date extraction approach)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Sitemap contains zero `/directions/*` URLs
  - No raw i18n keys in SSR HTML for sampled how-to-get-here pages
  - `/assistance` returns 301 to `/en/help`
  - `lastmod` coverage ≥60% of sitemap URLs
- Post-delivery measurement plan:
  - Re-run SEO tech audit (update standing artifact)
  - Monitor Google Search Console coverage after deployment (when access available)

## Evidence Gap Review

### Gaps Addressed

- Verified all 4 findings against live site (2026-03-12) — 2 original findings already resolved, 4 remaining confirmed
- Traced root causes to specific functions and line numbers in source code
- Identified existing test coverage and gaps

### Confidence Adjustments

- i18n finding #2: reduced from "definite namespace preload gap" to "likely namespace preload ordering issue" — exact RSC timing needs build-time verification (does not block planning)

### Remaining Assumptions

- The `planChoice` and `transportNotice` components are the only sources of i18n leakage on how-to-get-here pages (other components may also be affected — SSR audit test will catch these)
- `lastmod` backfill via git dates is feasible at build time (git history available in CI)

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Recommended next step: `/lp-do-analysis brikette-seo-audit-remediation`
