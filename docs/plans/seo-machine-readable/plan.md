---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: seo-machine-readable
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: PLAT
---

# SEO & Machine-Readable Infrastructure Plan

## Summary

Create a centralized `@acme/seo` shared package that consolidates SEO logic (metadata, structured data, robots.txt, sitemaps, llms.txt, AI plugin manifests) currently scattered across individual apps. Extract generic utilities from Brikette (reference implementation with 28 SEO components), then integrate into Cochlearfit, Skylar, and Cover-Me-Pretty to achieve SEO parity across all customer-facing apps.

## Goals

- Consolidate reusable SEO utilities from Brikette into `@acme/seo` with subpath exports (`/config`, `/metadata`, `/jsonld`, `/robots`, `/sitemap`, `/ai`)
- Bring Cochlearfit and Skylar to SEO parity (robots, sitemaps, structured data, hreflang) per the [SEO Parity Checklist](./fact-find.md#seo-parity-checklist)
- Add `llms.txt` to all customer-facing apps; `ai-plugin.json` only where an app has a backing API (Brikette only)
- Fix known bugs: CMP phantom `ai-sitemap.xml` reference in robots.ts, Cochlearfit placeholder `SITE_URL`

## Non-goals

- CMS-driven SEO configuration UI (deferred)
- OpenAPI spec generation (only Brikette has an API worth documenting)
- Brikette-specific schema types (hotel, hostel, room, guide) — stay local
- React Router / non-Next.js framework support
- `ai-plugin.json` for apps without an API

## Constraints & Assumptions

- Constraints:
  - Must not break existing Brikette SEO (28 structured data components, 32 `seo.ts` importers)
  - Must follow `@acme/*` package patterns (workspace:*, composite TS, dist/ output, ESM)
  - Extend existing `seoSettingsSchema` in `@acme/types` — don't replace
  - Static export builds (Brikette staging) must continue working — machine-readable files go in `public/`
  - `@acme/seo` exports builder functions; each app owns its route entrypoints (`robots.ts`, `sitemap.ts`)
- Assumptions:
  - Brikette migration is incremental with re-exports (zero breaking changes for consumers)
  - Cochlearfit and Skylar are low-traffic; SEO rollout doesn't need feature flags

## Fact-Find Reference

- Brief: `docs/plans/seo-machine-readable/fact-find.md`
- Key findings:
  - All 4 apps use Next.js 15 App Router — single framework target
  - `@acme/ui/lib/seo/` already shares `serializeJsonLd()` and `buildCanonicalUrl()` (14 importers) — move to `@acme/seo`, re-export from `@acme/ui` for backward compat
  - Brikette `seo.ts` has tight coupling to slug translation (`SLUGS`, `GUIDE_SLUG_LOOKUP_BY_LANG`) — extract generic hreflang builder, keep slug translation local
  - CMP robots.ts references phantom `/ai-sitemap.xml` (404)
  - Cochlearfit `SITE_URL` is placeholder `cochlearfit.example` — should be env-driven
  - Skylar has zero SEO infrastructure (static metadata in layout.tsx only)
  - Confidence inputs: Implementation 82%, Approach 85%, Impact 78%, Delivery-Readiness 90%, Testability 88%

## Existing System Notes

- Key modules/files:
  - `apps/brikette/src/utils/seo.ts` — Core SEO utilities (buildLinks, buildMeta, buildBreadcrumb, ensureTrailingSlash); 32 importers
  - `apps/brikette/src/utils/seo/jsonld/` — JSON-LD serialization (serialize.ts, breadcrumb.ts, article.ts, howto.ts, normalize.ts)
  - `apps/brikette/src/app/_lib/metadata.ts` — `buildAppMetadata()` Next.js metadata wrapper
  - `apps/brikette/src/seo/robots.ts` — `buildRobotsTxt()` plain text generator
  - `apps/cover-me-pretty/src/lib/seo.ts` — `getSeo()` shop-settings-driven metadata
  - `apps/cover-me-pretty/src/lib/jsonld.tsx` — Organization, Product, Article, BlogPosting JSON-LD
  - `packages/ui/src/lib/seo/` — Already-shared `serializeJsonLd()` + `buildCanonicalUrl()` (14 importers)
  - `packages/types/src/ShopSettings.ts` — `seoSettingsSchema` with `aiCatalog` config + catchall
- Patterns to follow:
  - Package scaffold: see `packages/date-utils/package.json`, `packages/types/tsconfig.json`
  - Path aliases: `tsconfig.base.json` `@acme/pkg` → `["packages/pkg/src/index.ts", "packages/pkg/dist/index.d.ts"]`
  - Jest: `jest.moduleMapper.cjs` entries + `@acme/config/jest.preset.cjs`
  - JSON-LD: `suppressHydrationWarning` + `dangerouslySetInnerHTML` with `serializeJsonLdValue()`
  - Metadata: `generateMetadata()` with per-app wrapper calling builder functions

## Proposed Approach

**Single shared package with subpath exports, incremental Brikette migration:**

1. Create `packages/seo/` with subpath exports matching the [Package API Proposal](./fact-find.md#package-api-proposal-draft): `@acme/seo/config`, `/metadata`, `/jsonld`, `/robots`, `/sitemap`, `/ai`
2. Core utilities are pure functions (no React/Next.js runtime). Only `/metadata` uses Next.js type-only imports. Only `/jsonld` exports React components.
3. `next` and `react` as `peerDependencies` + `devDependencies`
4. Move `serializeJsonLd()` and `buildCanonicalUrl()` from `@acme/ui/lib/seo` to `@acme/seo/jsonld` and `@acme/seo/metadata` respectively. Re-export from `@acme/ui` for backward compat (14 existing importers unchanged).
5. Integrate into Cochlearfit and Skylar (additive — new files, no existing code replaced).
6. Integrate into CMP (swap local implementations for shared package).
7. Begin Brikette extraction incrementally: generic seo.ts functions re-export from `@acme/seo`; Brikette-specific slug translation stays local.

- **Alternative considered:** Full Brikette migration in one pass (change all 32 importers). Rejected — too high blast radius for Phase 1. Re-export shim pattern preserves all existing import paths while contract tests verify no behavioral regression.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---|---|---|---|
| SEO-01 | IMPLEMENT | Fix CMP robots.ts phantom ai-sitemap.xml | 95% | S | Pending | - | SEO-09 |
| SEO-02 | IMPLEMENT | Fix Cochlearfit SITE_URL to env-driven pattern | 88% | S | Pending | - | SEO-07 |
| SEO-03 | IMPLEMENT | Create @acme/seo package — scaffold, config types, metadata builders | 85% | M | Pending | - | SEO-04, SEO-05 |
| SEO-04 | IMPLEMENT | Extract JSON-LD utilities and structured data builders | 82% | M | Pending | SEO-03 | SEO-06 |
| SEO-05 | IMPLEMENT | Extract robots, sitemap, and AI discovery generators | 88% | M | Pending | SEO-03 | SEO-06 |
| SEO-06 | CHECKPOINT | Verify package API, reassess app integrations | 95% | S | Pending | SEO-04, SEO-05 | SEO-07, SEO-08, SEO-09, SEO-10 |
| SEO-07 | IMPLEMENT | Integrate @acme/seo into Cochlearfit | 84% | M | Pending | SEO-02, SEO-06 | - |
| SEO-08 | IMPLEMENT | Integrate @acme/seo into Skylar | 82% | M | Pending | SEO-06 | - |
| SEO-09 | IMPLEMENT | Integrate @acme/seo into Cover-Me-Pretty | 84% | M | Pending | SEO-01, SEO-06 | SEO-10 |
| SEO-10 | IMPLEMENT | Begin Brikette extraction with re-exports | 75% ⚠️ | L | Pending | SEO-06, SEO-09 | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | SEO-01, SEO-02, SEO-03 | - | Independent: two bug fixes + package scaffold. All can run concurrently. |
| 2 | SEO-04, SEO-05 | Wave 1: SEO-03 | Both extract into @acme/seo. SEO-01, SEO-02 may also complete here. |
| 3 | SEO-06 (CHECKPOINT) | Wave 2: SEO-04, SEO-05 | Reassess app integrations using E2 evidence from built package. |
| 4 | SEO-07, SEO-08, SEO-09 | Wave 3: SEO-06 (+ SEO-02 for SEO-07, SEO-01 for SEO-09) | Three app integrations in parallel (Cochlearfit, Skylar, CMP). |
| 5 | SEO-10 | Wave 4: SEO-09 | Brikette extraction after CMP validates shared package in swap scenario. |

**Max parallelism:** 3 (Waves 1 and 4)
**Critical path:** SEO-03 → SEO-04 → SEO-06 → SEO-09 → SEO-10 (5 waves)
**Total tasks:** 10 (9 IMPLEMENT + 1 CHECKPOINT)
**Auto-continue boundary:** Waves 1–2 build automatically; Wave 3 (CHECKPOINT) pauses for reassessment.

## Tasks

### SEO-01: Fix CMP robots.ts phantom ai-sitemap.xml reference

- **Type:** IMPLEMENT
- **Deliverable:** Bug fix — `apps/cover-me-pretty/src/app/robots.ts`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cover-me-pretty/src/app/robots.ts`
- **Depends on:** -
- **Blocks:** SEO-09
- **Confidence:** 95%
  - Implementation: 98% — remove one array element from sitemap array (line 15)
  - Approach: 95% — obvious fix; the referenced file doesn't exist
  - Impact: 95% — isolated change; removes a 404 from robots.txt output
- **Acceptance:**
  - `robots.ts` sitemap array contains only `/sitemap.xml` (not `ai-sitemap.xml`)
  - CMP test suite passes: `pnpm --filter cover-me-pretty test`
- **Validation contract:**
  - TC-01: robots.ts sitemap output contains `/sitemap.xml` only → no `ai-sitemap.xml` in output
  - Acceptance coverage: TC-01 covers both acceptance criteria
  - Validation type: unit
  - Validation location: `apps/cover-me-pretty/__tests__/robots.test.ts` (new, or verify inline)
  - Run: `pnpm --filter cover-me-pretty test`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **Rollout / rollback:**
  - Rollout: Deploy with next CMP release
  - Rollback: Revert single line; phantom reference caused no harm, just a 404 in robots.txt
- **Documentation impact:** None
- **Notes:** CMP robots.ts line 15: `sitemap: [\`${base}/sitemap.xml\`, \`${base}/ai-sitemap.xml\`]` — second entry references nonexistent file.

---

### SEO-02: Fix Cochlearfit SITE_URL to env-driven pattern

- **Type:** IMPLEMENT
- **Deliverable:** Bug fix — `apps/cochlearfit/src/lib/site.ts`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cochlearfit/src/lib/site.ts`
  - **[readonly]** `apps/cover-me-pretty/src/app/robots.ts` (reference for env pattern)
- **Depends on:** -
- **Blocks:** SEO-07
- **Confidence:** 88%
  - Implementation: 92% — CMP already uses `NEXT_PUBLIC_BASE_URL` env var; same pattern
  - Approach: 90% — env-driven URL is the standard pattern across the monorepo
  - Impact: 85% — 15 pages use `buildMetadata()` which reads `SITE_URL` from this file; all continue working
- **Acceptance:**
  - `SITE_URL` reads from `process.env.NEXT_PUBLIC_BASE_URL` with fallback to current placeholder
  - Existing page metadata still renders correctly (no regression)
  - Root layout `metadataBase` resolves correctly
- **Validation contract:**
  - TC-01: `SITE_URL` uses env var when set → returns env value
  - TC-02: `SITE_URL` falls back to placeholder when env var is not set → returns `https://cochlearfit.example`
  - TC-03: Existing `buildMetadata()` calls produce valid metadata with new SITE_URL pattern
  - Acceptance coverage: TC-01,02 cover criteria 1; TC-03 covers criteria 2,3
  - Validation type: unit
  - Validation location: `apps/cochlearfit/src/test/lib/site.test.ts` (new)
  - Run: `pnpm --filter cochlearfit test`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **Rollout / rollback:**
  - Rollout: Set `NEXT_PUBLIC_BASE_URL` in Cloudflare Pages env when deploying to production
  - Rollback: Revert `site.ts`; fallback value preserves current behavior
- **Documentation impact:** None
- **Notes:** Current `SITE_URL = "https://cochlearfit.example"`. CMP pattern: `loadCoreEnv()` → `NEXT_PUBLIC_BASE_URL`. Cochlearfit may not have `loadCoreEnv()` — use `process.env.NEXT_PUBLIC_BASE_URL` directly.

---

### SEO-03: Create @acme/seo package — scaffold, config types, metadata builders

- **Type:** IMPLEMENT
- **Deliverable:** New package — `packages/seo/`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/seo/package.json`, `packages/seo/tsconfig.json`, `packages/seo/jest.config.cjs`, `packages/seo/src/index.ts`, `packages/seo/src/config/index.ts`, `packages/seo/src/metadata/index.ts`, `packages/seo/src/metadata/buildMetadata.ts`, `packages/seo/src/metadata/buildAlternates.ts`, `packages/seo/src/metadata/ensureTrailingSlash.ts`, `tsconfig.base.json`, `jest.moduleMapper.cjs`
  - **[readonly]** `packages/date-utils/package.json` (scaffold reference), `packages/types/tsconfig.json` (tsconfig reference), `packages/types/jest.config.cjs` (jest config reference)
- **Depends on:** -
- **Blocks:** SEO-04, SEO-05
- **Confidence:** 85%
  - Implementation: 88% — clear patterns from existing `@acme/*` packages; `ensureTrailingSlash()` is pure, `buildMetadata()` needs refactoring from Brikette's `buildAppMetadata()` to accept config injection
  - Approach: 90% — API shape defined in fact-find Package API Proposal; subpath exports follow `@acme/types` pattern
  - Impact: 82% — new package, zero blast radius on existing code; only risk is path alias registration
- **Acceptance:**
  - Package builds: `pnpm --filter @acme/seo build` succeeds
  - Monorepo typecheck passes: `pnpm typecheck` (no new errors)
  - Config types exported: `SeoSiteConfig`, `SeoRobotsConfig`, `SeoAiConfig`
  - `buildMetadata(config, pageSeo)` returns valid Next.js `Metadata` object
  - `buildAlternates(config, { canonicalPath, locales })` generates correct hreflang alternates
  - `ensureTrailingSlash(path)` handles edge cases
  - All unit tests pass
- **Validation contract:**
  - TC-01: `pnpm --filter @acme/seo build` exits 0 → package compiles correctly
  - TC-02: `buildMetadata({siteName, siteUrl}, {title, description, path})` → returns `Metadata` with correct title template, metadataBase, openGraph
  - TC-03: `buildAlternates({siteUrl, locales: ["en","it","de"]}, {canonicalPath: "/rooms"})` → returns alternates with hreflang entries for all locales
  - TC-04: `ensureTrailingSlash("")` → `"/"`, `ensureTrailingSlash("/rooms")` → `"/rooms/"`, `ensureTrailingSlash("/rooms/")` → `"/rooms/"`
  - TC-05: `SeoSiteConfig` type enforces required `siteName` and `siteUrl` fields
  - TC-06: `pnpm typecheck` exits 0 → path aliases resolve across monorepo
  - Acceptance coverage: TC-01,06 cover build/typecheck; TC-02 covers buildMetadata; TC-03 covers buildAlternates; TC-04 covers ensureTrailingSlash; TC-05 covers config types
  - Validation type: unit + integration (typecheck)
  - Validation location: `packages/seo/src/__tests__/metadata.test.ts`
  - Run: `pnpm --filter @acme/seo test && pnpm typecheck`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **Scouts:**
  - Next.js `Metadata` type compatibility with type-only import → confirmed: `import type { Metadata } from "next"` is erased at runtime, no bundler issue
  - Subpath exports with composite TS → confirmed: `@acme/types` uses same pattern successfully
- **Planning validation:**
  - Checks run: Read `packages/date-utils/package.json`, `packages/types/tsconfig.json`, `tsconfig.base.json`, `jest.moduleMapper.cjs` — all pattern references verified
  - Unexpected findings: None
- **What would make this ≥90%:** Probe test that imports `@acme/seo/metadata` from another package and verifies type resolution
- **Rollout / rollback:**
  - Rollout: Merge package; no consumers until later tasks wire it up
  - Rollback: Delete `packages/seo/`; revert tsconfig.base.json and jest.moduleMapper.cjs changes
- **Documentation impact:** None (README in package optional)
- **Notes:**
  - Package.json: `"name": "@acme/seo"`, `"private": true`, `"type": "module"`, peerDeps on `next` + `react`
  - Subpath exports: `.`, `./config`, `./metadata` (more added in later tasks)
  - `buildMetadata()` is a generic refactor of Brikette's `buildAppMetadata()` — accepts `SeoSiteConfig` instead of importing site constants
  - `buildAlternates()` is a generic hreflang builder — does NOT include Brikette slug translation (that stays local)

---

### SEO-04: Extract JSON-LD utilities and structured data builders

- **Type:** IMPLEMENT
- **Deliverable:** Package subpath — `@acme/seo/jsonld`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/seo/src/jsonld/index.ts`, `packages/seo/src/jsonld/serialize.ts`, `packages/seo/src/jsonld/JsonLdScript.tsx`, `packages/seo/src/jsonld/organization.ts`, `packages/seo/src/jsonld/product.ts`, `packages/seo/src/jsonld/article.ts`, `packages/seo/src/jsonld/breadcrumb.ts`, `packages/seo/src/jsonld/faq.ts`, `packages/seo/src/jsonld/websiteSearch.ts`, `packages/seo/src/jsonld/itemList.ts`, `packages/seo/src/jsonld/event.ts`, `packages/seo/src/jsonld/service.ts`, `packages/ui/src/lib/seo/serializeJsonLd.ts`, `packages/ui/src/lib/seo/index.ts`
  - **[readonly]** `apps/brikette/src/utils/seo/jsonld/serialize.ts` (source), `apps/brikette/src/utils/seo/jsonld/breadcrumb.ts` (source), `apps/brikette/src/utils/seo/jsonld/article.ts` (source), `apps/cover-me-pretty/src/lib/jsonld.tsx` (reference for Organization/Product/Article builders)
- **Depends on:** SEO-03
- **Blocks:** SEO-06
- **Confidence:** 82%
  - Implementation: 85% — Brikette jsonld utilities (serialize, breadcrumb, article) are fully generic and ready to extract; CMP jsonld.tsx provides Organization/Product/Article patterns; some normalize.ts functions have Brikette-specific deps that need abstraction
  - Approach: 88% — extraction boundaries clearly defined in fact-find; `@acme/ui` re-export is straightforward
  - Impact: 80% — `@acme/ui/lib/seo` re-exports must not break 14 existing importers; contract tests verify JSON-LD output
- **Acceptance:**
  - `serializeJsonLdValue()` is XSS-safe and matches current `@acme/ui/lib/seo/serializeJsonLd` behavior
  - `<JsonLdScript />` renders valid `<script type="application/ld+json">` with `suppressHydrationWarning`
  - All 9 generic structured data builders produce valid Schema.org JSON-LD: Organization, Product, Article, BreadcrumbList, FAQPage, WebSite+SearchAction, ItemList, Event, Service
  - `@acme/ui/lib/seo` re-exports point to `@acme/seo/jsonld` — 14 existing importers unchanged
  - All unit + contract tests pass
- **Validation contract:**
  - TC-01: `serializeJsonLdValue({name: "<script>alert(1)</script>"})` → escapes `<` and `>` correctly
  - TC-02: `<JsonLdScript value={{...}} />` → renders `<script type="application/ld+json">` with valid JSON
  - TC-03: `organizationJsonLd({name, url, logo})` → produces `{"@type": "Organization", ...}` with all required fields
  - TC-04: `productJsonLd({name, price, currency, sku})` → produces `{"@type": "Product", "offers": {"@type": "Offer", ...}}`
  - TC-05: `articleJsonLd({headline, datePublished, author})` → produces `{"@type": "Article", ...}`
  - TC-06: `faqJsonLd([{question, answer}])` → produces `{"@type": "FAQPage", "mainEntity": [...]}`
  - TC-07: `breadcrumbJsonLd([{name, url}])` → produces `{"@type": "BreadcrumbList", "itemListElement": [...]}`
  - TC-08: `import { serializeJsonLd } from "@acme/ui/lib/seo"` → resolves to `@acme/seo/jsonld` implementation
  - TC-09: `<JsonLdScript />` SSR output matches CSR output (no hydration mismatch)
  - Acceptance coverage: TC-01 covers XSS safety; TC-02,09 cover JsonLdScript; TC-03-07 cover builders; TC-08 covers backward compat
  - Validation type: unit + contract
  - Validation location: `packages/seo/src/__tests__/jsonld.test.ts`, `packages/seo/src/__tests__/jsonld-contract.test.tsx`
  - Run: `pnpm --filter @acme/seo test`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **Scouts:**
  - `@acme/ui` wildcard export `./lib/*` → confirmed at `packages/ui/package.json` line 299-302; re-export shim will work
  - Brikette normalize.ts `normalizeHowToSteps()` depends on `ensureArray` from i18nContent → extract `ensureArray` as generic utility or inline
- **Planning validation:**
  - Checks run: Read all source files in `apps/brikette/src/utils/seo/jsonld/`, `apps/cover-me-pretty/src/lib/jsonld.tsx`, `packages/ui/src/lib/seo/`. Verified 14 importers of `@acme/ui/lib/seo`.
  - Unexpected findings: `serializeJsonLd` in `@acme/ui` is the canonical implementation; Brikette's `serialize.ts` wraps it. Move canonical to `@acme/seo`, re-export from `@acme/ui`.
- **What would make this ≥90%:** Probe test importing from `@acme/ui/lib/seo` after re-export to verify module resolution
- **Rollout / rollback:**
  - Rollout: Merge with SEO-03; no consumer changes until integration tasks
  - Rollback: Revert `packages/seo/src/jsonld/` and `packages/ui/src/lib/seo/` changes
- **Documentation impact:** None
- **Notes:**
  - `buildCanonicalUrl()` from `@acme/ui/lib/seo` also moves to `@acme/seo/metadata`; re-export from `@acme/ui`
  - Brikette-specific builders (`buildHotelNode`, `buildOffer`, `buildHomeGraph`) stay in `apps/brikette/src/utils/schema/`
  - Some Brikette normalize.ts functions (`normalizeHowToSteps`, `unifyNormalizedFaqEntries`) depend on Brikette-specific modules — these stay local or get refactored to accept callbacks

---

### SEO-05: Extract robots, sitemap, and AI discovery generators

- **Type:** IMPLEMENT
- **Deliverable:** Package subpaths — `@acme/seo/robots`, `@acme/seo/sitemap`, `@acme/seo/ai`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `packages/seo/src/robots/index.ts`, `packages/seo/src/robots/buildRobotsTxt.ts`, `packages/seo/src/robots/buildRobotsMetadataRoute.ts`, `packages/seo/src/sitemap/index.ts`, `packages/seo/src/sitemap/buildSitemapEntry.ts`, `packages/seo/src/sitemap/buildSitemapWithAlternates.ts`, `packages/seo/src/ai/index.ts`, `packages/seo/src/ai/buildLlmsTxt.ts`, `packages/seo/src/ai/buildAiPluginManifest.ts`
  - **[readonly]** `apps/brikette/src/seo/robots.ts` (source), `apps/cover-me-pretty/src/app/robots.ts` (MetadataRoute pattern), `apps/cover-me-pretty/src/app/sitemap.ts` (sitemap pattern), `apps/brikette/public/llms.txt` (format reference), `apps/brikette/public/.well-known/ai-plugin.json` (format reference)
- **Depends on:** SEO-03
- **Blocks:** SEO-06
- **Confidence:** 88%
  - Implementation: 90% — Brikette `buildRobotsTxt()` and CMP `robots.ts` + `sitemap.ts` provide clear source patterns; llms.txt and ai-plugin.json formats are simple
  - Approach: 90% — parameterized builders accepting config objects; MetadataRoute type for Next.js convention
  - Impact: 85% — new package subpaths, no existing consumers; only risk is MetadataRoute type compatibility
- **Acceptance:**
  - `buildRobotsTxt(config)` generates valid robots.txt with configurable Allow/Disallow/Sitemap/AI bots
  - `buildRobotsMetadataRoute(config)` returns `MetadataRoute.Robots` object
  - Environment-aware: `allowIndexing: false` → `Disallow: /`
  - `buildSitemapEntry()` and `buildSitemapWithAlternates()` produce valid sitemap entries with hreflang
  - `buildLlmsTxt(config)` generates valid llms.txt matching Brikette format
  - `buildAiPluginManifest(config)` generates valid ChatGPT plugin JSON matching v1 schema
  - All tests pass
- **Validation contract:**
  - TC-01: `buildRobotsTxt({siteUrl, sitemapPaths: ["/sitemap.xml"], disallowPaths: ["/api/"]})` → output contains `User-agent: *`, `Allow: /`, `Disallow: /api/`, `Sitemap:` line
  - TC-02: `buildRobotsTxt({allowIndexing: false})` → output contains `Disallow: /` for all user agents
  - TC-03: `buildRobotsMetadataRoute(config)` → returns object with `rules` array and `sitemap` array matching Next.js MetadataRoute.Robots shape
  - TC-04: `buildSitemapWithAlternates([{path: "/rooms", lastModified}], {siteUrl, locales: ["en","it"]})` → returns array of MetadataRoute.Sitemap entries with alternates per locale
  - TC-05: `buildLlmsTxt({siteName: "Test", description: "Desc", sources: [{title, url}]})` → output starts with `# Test`, includes `## Machine-readable sources`, lists sources as markdown links
  - TC-06: `buildAiPluginManifest({nameForHuman, api: {url}})` → returns object with `schema_version: "v1"`, all required fields
  - Acceptance coverage: TC-01,02 cover robots with/without indexing; TC-03 covers MetadataRoute; TC-04 covers sitemap; TC-05 covers llms.txt; TC-06 covers ai-plugin
  - Validation type: unit
  - Validation location: `packages/seo/src/__tests__/robots.test.ts`, `packages/seo/src/__tests__/sitemap.test.ts`, `packages/seo/src/__tests__/ai.test.ts`
  - Run: `pnpm --filter @acme/seo test`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **Scouts:**
  - Next.js `MetadataRoute.Robots` type available via `import type` → confirmed: CMP uses this pattern at `apps/cover-me-pretty/src/app/robots.ts`
  - `MetadataRoute.Sitemap` type available → confirmed: CMP uses this at `apps/cover-me-pretty/src/app/sitemap.ts`
- **Planning validation:**
  - Checks run: Read Brikette robots.ts, CMP robots.ts, CMP sitemap.ts, Brikette llms.txt, Brikette ai-plugin.json. All patterns documented.
  - Unexpected findings: Brikette buildRobotsTxt returns plain text string (not MetadataRoute); CMP returns MetadataRoute object. `@acme/seo` should offer both: `buildRobotsTxt()` → string, `buildRobotsMetadataRoute()` → MetadataRoute.Robots.
- **Rollout / rollback:**
  - Rollout: Merge with SEO-03/04; no consumers until integration tasks
  - Rollback: Revert `packages/seo/src/robots/`, `/sitemap/`, `/ai/`
- **Documentation impact:** None
- **Notes:**
  - AI bot allowlist is config-driven, not hardcoded (addresses "bot list churn" risk)
  - `buildRobotsMetadataRoute()` is the preferred API for apps using Next.js metadata convention
  - `buildRobotsTxt()` kept for apps that need plain text (e.g., Brikette's `robots.txt/route.ts`)

---

### SEO-06: Horizon checkpoint — verify package API, reassess app integrations

- **Type:** CHECKPOINT
- **Depends on:** SEO-04, SEO-05
- **Blocks:** SEO-07, SEO-08, SEO-09, SEO-10
- **Confidence:** 95%
- **Acceptance:**
  - Run `/lp-replan` on all tasks after this checkpoint (SEO-07 through SEO-10)
  - Reassess remaining task confidence using evidence from completed package (E2 evidence)
  - Confirm or revise the approach for app integrations
  - If Brikette extraction (SEO-10) can be promoted to ≥80% based on E2 evidence, update its plan
  - Update plan with any new findings, splits, or abandoned tasks
  - Write test stubs for SEO-10 (L-effort) if promoted to build-eligible
- **Horizon assumptions to validate:**
  - Package API shape (subpath exports) works correctly with monorepo typecheck and jest module resolution
  - `@acme/ui/lib/seo` re-export pattern works without breaking 14 existing importers
  - JSON-LD builders produce output compatible with existing Brikette contract tests
  - `buildMetadata()` config injection pattern is ergonomic enough for all 4 apps
  - Sitemap/robots MetadataRoute types resolve correctly as peerDep

---

### SEO-07: Integrate @acme/seo into Cochlearfit

- **Type:** IMPLEMENT
- **Deliverable:** App integration — `apps/cochlearfit/`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cochlearfit/src/app/robots.ts` (new), `apps/cochlearfit/src/app/sitemap.ts` (new), `apps/cochlearfit/src/lib/jsonld.tsx` (new), `apps/cochlearfit/src/lib/seo.ts` (update), `apps/cochlearfit/src/app/layout.tsx` (update — add Organization JSON-LD), `apps/cochlearfit/src/app/[lang]/faq/page.tsx` (update — add FAQ JSON-LD), `apps/cochlearfit/package.json` (add @acme/seo dep), `apps/cochlearfit/public/llms.txt` (new)
  - **[readonly]** `apps/cochlearfit/src/lib/site.ts` (site constants), `apps/cover-me-pretty/src/app/robots.ts` (pattern ref), `apps/cover-me-pretty/src/app/sitemap.ts` (pattern ref)
- **Depends on:** SEO-02, SEO-06
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 86% — CMP provides clear integration pattern; Cochlearfit already has 15 pages with `generateMetadata()`
  - Approach: 88% — additive work, no existing SEO code to break
  - Impact: 82% — adding robots/sitemap/JSON-LD to a live app; low traffic mitigates risk
- **Acceptance:**
  - `robots.ts` returns environment-aware robots config (noindex for staging/preview)
  - `sitemap.ts` includes all indexable pages with hreflang alternates
  - Organization JSON-LD renders on all pages via root layout
  - FAQ JSON-LD renders on `/faq` page
  - `generateMetadata()` produces canonical URLs with real domain (env-driven from SEO-02)
  - Product JSON-LD on product detail pages (if applicable)
  - `llms.txt` accessible at `/llms.txt`
  - `pnpm --filter cochlearfit test` passes
  - `pnpm --filter cochlearfit build` succeeds
- **Validation contract:**
  - TC-01: `GET /robots.txt` with `NEXT_PUBLIC_ALLOW_INDEXING=true` → `Allow: /` + `Sitemap:` referencing real sitemap URL
  - TC-02: `GET /robots.txt` with `NEXT_PUBLIC_ALLOW_INDEXING` unset → `Disallow: /`
  - TC-03: `sitemap.ts` generates entries for all pages with `lastModified` and per-locale alternates
  - TC-04: Root layout renders `<script type="application/ld+json">` containing Organization schema
  - TC-05: FAQ page renders `<script type="application/ld+json">` containing FAQPage schema
  - TC-06: `buildMetadata()` returns canonical URL using `NEXT_PUBLIC_BASE_URL` env var
  - Acceptance coverage: TC-01,02 cover robots; TC-03 covers sitemap; TC-04 covers Organization; TC-05 covers FAQ; TC-06 covers canonical
  - Validation type: unit + contract
  - Validation location: `apps/cochlearfit/src/test/seo/` (new directory)
  - Run: `pnpm --filter cochlearfit test && pnpm --filter cochlearfit build`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **What would make this ≥90%:** Verify Cochlearfit page structure to confirm all pages and their metadata needs; confirm 16 pages map correctly to sitemap entries
- **Rollout / rollback:**
  - Rollout: Deploy to Cochlearfit production; set `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_ALLOW_INDEXING` env vars
  - Rollback: Revert Cochlearfit changes; new files can be deleted cleanly
- **Documentation impact:** None
- **Notes:**
  - Cochlearfit has 16 pages under `[lang]/` — all need sitemap entries
  - `buildMetadata()` already exists and works; update to add hreflang alternates via `@acme/seo/metadata`
  - JSON-LD components use `@acme/seo/jsonld` generic builders

---

### SEO-08: Integrate @acme/seo into Skylar

- **Type:** IMPLEMENT
- **Deliverable:** App integration — `apps/skylar/`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/skylar/src/lib/seo.ts` (new), `apps/skylar/src/app/robots.ts` (new), `apps/skylar/src/app/sitemap.ts` (new), `apps/skylar/src/lib/jsonld.tsx` (new), `apps/skylar/src/app/layout.tsx` (update), `apps/skylar/src/app/[lang]/page.tsx` (update), `apps/skylar/src/app/[lang]/products/page.tsx` (update), `apps/skylar/src/app/[lang]/real-estate/page.tsx` (update), `apps/skylar/src/app/[lang]/people/page.tsx` (update), `apps/skylar/package.json` (add @acme/seo dep), `apps/skylar/public/llms.txt` (new)
  - **[readonly]** `apps/cochlearfit/src/lib/seo.ts` (pattern ref after SEO-07)
- **Depends on:** SEO-06
- **Blocks:** -
- **Confidence:** 82%
  - Implementation: 84% — most work from scratch but following patterns established in Cochlearfit integration; Skylar has only 5 pages
  - Approach: 85% — same pattern as Cochlearfit integration
  - Impact: 82% — minimal existing app; adding new features to near-empty SEO surface
- **Acceptance:**
  - `robots.ts` returns environment-aware robots config
  - `sitemap.ts` includes all 5 pages with hreflang alternates
  - Organization JSON-LD renders on all pages via root layout
  - All 5 pages have `generateMetadata()` returning title, description, OG, canonical, hreflang
  - Root layout metadata uses `@acme/seo` with correct `metadataBase`
  - `llms.txt` accessible at `/llms.txt`
  - `pnpm --filter skylar test` passes
  - `pnpm --filter skylar build` succeeds
- **Validation contract:**
  - TC-01: `robots.ts` returns correct MetadataRoute.Robots object with environment-aware indexing
  - TC-02: `sitemap.ts` returns 5 entries with hreflang for all configured locales
  - TC-03: Root layout renders Organization JSON-LD with Skylar SRL data
  - TC-04: All 5 pages export `generateMetadata()` returning title + description + OG + canonical
  - TC-05: `metadataBase` in root layout reads from shop settings or env var (not hardcoded)
  - Acceptance coverage: TC-01 covers robots; TC-02 covers sitemap; TC-03 covers JSON-LD; TC-04 covers page metadata; TC-05 covers metadataBase
  - Validation type: unit + contract
  - Validation location: `apps/skylar/src/test/seo/` (new directory)
  - Run: `pnpm --filter skylar test && pnpm --filter skylar build`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **What would make this ≥90%:** Map Skylar's exact page structure and i18n setup to confirm integration points
- **Rollout / rollback:**
  - Rollout: Deploy to Skylar production
  - Rollback: Revert Skylar changes; new files can be deleted cleanly
- **Documentation impact:** None
- **Notes:**
  - Skylar currently has zero `generateMetadata()` exports — all 5 pages need to add it
  - Skylar pages are client components; may need to convert some to server components for `generateMetadata()` or use root layout metadata only
  - `metadataBase` currently hardcoded to `https://skylarsrl.com` — keep this as production value with env override

---

### SEO-09: Integrate @acme/seo into Cover-Me-Pretty

- **Type:** IMPLEMENT
- **Deliverable:** App integration — `apps/cover-me-pretty/`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/cover-me-pretty/src/lib/seo.ts` (update — wrap @acme/seo/metadata), `apps/cover-me-pretty/src/lib/jsonld.tsx` (update — use @acme/seo/jsonld), `apps/cover-me-pretty/package.json` (add @acme/seo dep), `apps/cover-me-pretty/public/llms.txt` (new)
  - **[readonly]** `apps/cover-me-pretty/src/app/robots.ts`, `apps/cover-me-pretty/src/app/sitemap.ts`, `apps/cover-me-pretty/src/app/[lang]/layout.tsx`
- **Depends on:** SEO-01, SEO-06
- **Blocks:** SEO-10
- **Confidence:** 84%
  - Implementation: 86% — CMP already has working SEO; replace local implementations with shared package calls
  - Approach: 88% — thin wrapper pattern: `getSeo()` delegates to `@acme/seo/metadata`, `jsonld.tsx` uses `@acme/seo/jsonld` builders
  - Impact: 82% — replacing working code with shared implementations; CMP has existing tests to catch regressions
- **Acceptance:**
  - `getSeo()` returns identical metadata output when backed by `@acme/seo/metadata`
  - All JSON-LD functions (Organization, Product, Article, BlogPosting) produce identical output via `@acme/seo/jsonld`
  - `robots.ts` unchanged (still works correctly — phantom reference removed by SEO-01)
  - `sitemap.ts` unchanged (already works correctly)
  - `llms.txt` accessible at `/llms.txt`
  - All existing CMP tests pass: `pnpm --filter cover-me-pretty test`
  - Build succeeds: `pnpm --filter cover-me-pretty build`
- **Validation contract:**
  - TC-01: `getSeo("en", {title: "Test"})` before/after → identical `Metadata` output
  - TC-02: `organizationJsonLd()` before/after → identical JSON-LD output
  - TC-03: `productJsonLd({name, price, ...})` before/after → identical JSON-LD output
  - TC-04: `articleJsonLd({headline, ...})` before/after → identical JSON-LD output
  - TC-05: `robots.ts` output has no `ai-sitemap.xml` (regression check for SEO-01)
  - TC-06: `llms.txt` is a valid file accessible at public/llms.txt
  - Acceptance coverage: TC-01 covers getSeo; TC-02-04 cover JSON-LD; TC-05 covers robots; TC-06 covers llms.txt
  - Validation type: unit + contract
  - Validation location: `apps/cover-me-pretty/__tests__/seo.test.ts` (existing), `apps/cover-me-pretty/__tests__/jsonld.test.ts` (new or updated)
  - Run: `pnpm --filter cover-me-pretty test && pnpm --filter cover-me-pretty build`
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **What would make this ≥90%:** Snapshot test comparing getSeo() output before/after migration
- **Rollout / rollback:**
  - Rollout: Deploy with next CMP release
  - Rollback: Revert seo.ts and jsonld.tsx to local implementations
- **Documentation impact:** None
- **Notes:**
  - `getSeo()` is a thin wrapper integrating shop settings with metadata — keep the wrapper, delegate core metadata construction to `@acme/seo/metadata`
  - CMP's `JsonLdScript` component can be replaced with `@acme/seo/jsonld`'s version
  - CMP's robots.ts and sitemap.ts stay as-is — they already use Next.js MetadataRoute pattern

---

### SEO-10: Begin Brikette extraction with re-exports

- **Type:** IMPLEMENT
- **Deliverable:** Incremental migration — `apps/brikette/` + `packages/seo/`
- **Startup-Deliverable-Alias:** none
- **Execution-Skill:** /lp-build
- **Affects:**
  - **Primary:** `apps/brikette/src/utils/seo.ts` (update — re-export generic functions from @acme/seo), `apps/brikette/src/utils/seo/jsonld/serialize.ts` (update — re-export from @acme/seo), `apps/brikette/src/app/_lib/metadata.ts` (update — use @acme/seo/metadata internally), `apps/brikette/package.json` (add @acme/seo dep), `apps/brikette/public/llms.txt` (optional: wire to generator)
  - **[readonly]** 32 files importing from `apps/brikette/src/utils/seo.ts` (verify no breakage), 14 files importing from `@acme/ui/lib/seo` (verify re-export works), `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx`, `apps/brikette/src/test/utils/seo.test.ts`
- **Depends on:** SEO-06, SEO-09
- **Blocks:** -
- **Confidence:** 75% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — re-export pattern is well-defined; `seo.ts` can re-export `ensureTrailingSlash`, `buildMeta` from `@acme/seo` while keeping Brikette-specific `buildLinks` and `buildBreadcrumb` local
  - Approach: 85% — incremental approach with re-exports decided; Phase 2 full migration deferred
  - Impact: 72% — 32 `seo.ts` importers + 14 `@acme/ui/lib/seo` importers; i18n slug translation coupling is the key risk; need to verify no import resolution breakage across all Brikette test shards
  - **Conditional confidence:** 75% → 82% conditional on SEO-06 checkpoint completion (E2 evidence from built package validates re-export approach and contract compatibility)
- **Acceptance:**
  - All 32 `seo.ts` importers compile without changes (re-export shim preserves API surface)
  - `buildAppMetadata()` output is identical before/after extraction
  - All 28 structured data components render valid JSON-LD (contract tests pass)
  - `buildLinks()` with Brikette slug translation still produces correct hreflang for all 10+ languages
  - `@acme/ui/lib/seo` importers (14 files) resolve correctly via re-export chain
  - `buildBreadcrumb()` with localized paths still works
  - Full Brikette test suite passes across all 3 CI shards
- **Validation contract:**
  - TC-01: All 32 seo.ts importers compile → `pnpm typecheck` exits 0 with no new errors in `apps/brikette/`
  - TC-02: `buildAppMetadata()` with test fixture → identical Metadata output before/after
  - TC-03: All JSON-LD contract tests pass → `pnpm --filter brikette test -- --testPathPattern=seo-jsonld-contract`
  - TC-04: `buildLinks("en", "/rooms", origin)` → produces correct canonical + 10+ hreflang alternates
  - TC-05: `import { serializeJsonLd } from "@acme/ui/lib/seo"` in Brikette context → resolves via @acme/seo re-export chain
  - TC-06: `buildBreadcrumb("en", [{name, url}])` → produces correct BreadcrumbList JSON-LD
  - TC-07: Full Brikette test suite → `pnpm --filter brikette test` passes
  - Acceptance coverage: TC-01 covers compilation; TC-02 covers metadata; TC-03 covers JSON-LD; TC-04 covers hreflang; TC-05 covers import chain; TC-06 covers breadcrumb; TC-07 covers full suite
  - Validation type: unit + contract + integration
  - Validation location: `apps/brikette/src/test/seo-extraction-contract.test.ts` (new, L-effort test stubs below)
  - Run: `pnpm typecheck && pnpm --filter brikette test`
  - Cross-boundary coverage: `@acme/seo` ↔ `@acme/ui/lib/seo` re-export chain verified via TC-05; `@acme/seo` ↔ `apps/brikette` contract verified via TC-03
- **Execution plan:** Red → Green → Refactor
  - Red evidence: _(to be captured during build)_
  - Green evidence: _(to be captured during build)_
  - Refactor evidence: _(to be captured during build)_
- **What would make this ≥90%:**
  - Spike: map exact `buildLinks()` dependencies — confirm which i18n/slug imports can be abstracted vs. must stay local
  - Run Brikette test suite with `@acme/seo` wired as re-exports (E2 evidence)
  - Verify 3-shard CI test execution with the re-export chain
- **Rollout / rollback:**
  - Rollout: Deploy with next Brikette release; re-exports are backward-compatible
  - Rollback: Revert `seo.ts` re-exports; restore direct implementations. Low risk since re-exports don't change behavior.
- **Documentation impact:** None
- **Notes:**
  - Phase 1 (this task): re-export generic functions from `@acme/seo` through existing Brikette paths
  - Phase 2 (future, not in this plan): migrate Brikette consumers to import directly from `@acme/seo`; remove re-export shims
  - Key file: `apps/brikette/src/utils/seo.ts` — generic functions (`ensureTrailingSlash`, `buildMeta`, `pageHead`) re-export from `@acme/seo`; Brikette-specific functions (`buildLinks`, `buildBreadcrumb`) stay local
  - `buildAppMetadata()` in `apps/brikette/src/app/_lib/metadata.ts` — can internally call `@acme/seo/metadata` while keeping its Brikette-specific defaults

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Brikette i18n slug translation too tightly coupled to extract `buildLinks()` | Medium | High | Keep `buildLinks()` in Brikette; extract only generic hreflang builder to `@acme/seo`. CHECKPOINT validates this before committing to integration. |
| Breaking existing Brikette SEO during extraction | Low | High | Re-export pattern preserves all import paths. JSON-LD contract tests catch regressions. Full test suite run across 3 CI shards. |
| `@acme/ui/lib/seo` re-export chain breaks existing importers | Low | Medium | TC-05/TC-08 verify re-export resolution. 14 importers tested. Rollback: revert `@acme/ui` changes. |
| Cochlearfit SITE_URL env var not set in production | Medium | Medium | Fallback to placeholder domain. SEO-02 documents required env vars for deployment. |
| CMP `getSeo()` behavioral regression after swap to @acme/seo | Low | Medium | Before/after comparison tests (TC-01 for SEO-09). Existing CMP test suite catches regressions. |
| Canonical/trailing-slash drift between apps | Medium | Medium | `@acme/seo/metadata` provides single `ensureTrailingSlash()` implementation. Invariant tests in package. |
| hreflang BCP 47 mixed formats (`en` vs `en-US`) | Low | Medium | Central locale normalization in `@acme/seo/metadata`. Tests for all supported locales. |
| AI bot allowlist ages silently | Low | Low | Bot list is config-driven, not hardcoded in `@acme/seo/robots`. Apps override as needed. |
| Skylar pages are client components — cannot export `generateMetadata()` | Medium | Medium | Investigate during SEO-08 build; may need to convert to server components or use root layout metadata only. |

## Observability

- Logging: Not applicable (build-time + static output; no runtime SEO logic)
- Metrics: Google Search Console coverage errors post-rollout (manual check)
- Alerts/Dashboards: None needed for package; post-integration GSC monitoring is manual

## Acceptance Criteria (overall)

- [ ] `packages/seo/` exists with all 6 subpaths (config, metadata, jsonld, robots, sitemap, ai)
- [ ] `pnpm --filter @acme/seo build && pnpm --filter @acme/seo test` passes
- [ ] `pnpm typecheck` passes monorepo-wide with no new errors
- [ ] CMP phantom ai-sitemap.xml reference removed
- [ ] Cochlearfit has robots.ts, sitemap.ts, Organization JSON-LD, FAQ JSON-LD
- [ ] Skylar has robots.ts, sitemap.ts, Organization JSON-LD, per-page metadata
- [ ] CMP seo.ts and jsonld.tsx delegate to `@acme/seo`
- [ ] All 4 apps have `llms.txt` accessible
- [ ] Brikette generic seo.ts functions re-export from `@acme/seo` with zero breakage
- [ ] All app test suites pass
- [ ] SEO Correctness Invariants tested in `packages/seo/` (canonical URL stability, hreflang BCP 47, trailing slash uniformity, JSON-LD XSS safety, robots.txt sitemap validity)
- [ ] No regressions in existing Brikette SEO (contract tests, full test suite)

## Decision Log

- 2026-02-13: Package API uses subpath exports (6 subpaths) — matches `@acme/types` pattern, enables tree-shaking
- 2026-02-13: Move `serializeJsonLd()` and `buildCanonicalUrl()` from `@acme/ui` to `@acme/seo` with re-exports — puts SEO utilities in the right package; `@acme/ui/lib/seo` becomes a backward-compat shim
- 2026-02-13: Brikette extraction uses re-export pattern (Phase 1) — minimizes blast radius for 32 importers
- 2026-02-13: Cochlearfit SITE_URL uses env-driven pattern — matches CMP's `NEXT_PUBLIC_BASE_URL` approach
- 2026-02-13: `ai-plugin.json` is opt-in per app — only Brikette (which has an API) gets it; prevents misleading manifests
- 2026-02-13: CHECKPOINT after package extraction — validates API before committing to 4 app integrations
