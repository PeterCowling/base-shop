---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Feature-Slug: seo-machine-readable
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-system
Related-Plan: docs/plans/seo-machine-readable/plan.md
Business-OS-Integration: on
Business-Unit: PLAT
---

# SEO & Machine-Readable Infrastructure Fact-Find Brief

## Scope

### Summary

Create a centralized `@acme/seo` shared package that consolidates SEO logic (metadata, structured data, robots.txt, sitemaps, llms.txt, AI plugin manifests) currently scattered across individual apps. All four customer-facing apps use Next.js 15 App Router, so the package targets Next.js exclusively — no React Router support needed.

### Goals

- Consolidate reusable SEO utilities from Brikette (reference implementation) into `@acme/seo`
- Bring Cochlearfit and Skylar up to SEO parity (see [SEO Parity Checklist](#seo-parity-checklist) below)
- Add llms.txt to all customer-facing apps; ai-plugin.json only where an app has a meaningful API (currently Brikette only)
- Fix known bugs: CMP phantom ai-sitemap.xml reference, Cochlearfit placeholder `SITE_URL` (`cochlearfit.example`)

### Non-goals

- CMS-driven SEO configuration UI (deferred — current shop settings + code config is sufficient for now)
- OpenAPI spec generation (only Brikette has an API worth documenting)
- Brikette-specific schema types (hotel, hostel, room, guide) — these stay local
- React Router / non-Next.js framework support (all apps are Next.js App Router)
- ai-plugin.json for apps without an API — publishing a plugin manifest without a backing API is misleading and a maintenance liability; require explicit opt-in per app

### Constraints & Assumptions

- Constraints:
  - Must not break existing Brikette SEO (world-class, 28 structured data components)
  - Must follow existing monorepo package patterns (`@acme/*`, `workspace:*`, composite TS)
  - Existing shop settings schema already has `seo` field in `packages/types/src/ShopSettings.ts` — extend, don't replace
  - Static export builds (Brikette staging) must continue working
- Assumptions:
  - Brikette migration to `@acme/seo` can be incremental (import shared, keep local specifics)
  - Cochlearfit and Skylar are low-traffic enough that SEO rollout doesn't need feature flags

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/app/_lib/metadata.ts` — `buildAppMetadata()` wrapper used by 27 pages via `generateMetadata()`
- `apps/brikette/src/utils/seo.ts` — Core utilities: `buildLinks()`, `pageHead()`, `buildBreadcrumb()`, `buildMeta()`, `ensureTrailingSlash()`
- `apps/brikette/src/utils/seo/jsonld/` — JSON-LD serialization: `serializeJsonLdValue()`, `buildArticlePayload()`, `buildBreadcrumbList()`, `buildHowToPayload()`
- `apps/brikette/src/utils/schema/builders.ts` — Domain schema builders: `buildHotelNode()`, `buildOffer()`, `buildHomeGraph()`
- `apps/brikette/src/seo/robots.ts` — `buildRobotsTxt()` function
- `apps/brikette/src/app/robots.txt/route.ts` — Route Handler serving robots.txt
- `apps/cover-me-pretty/src/lib/seo.ts` — `getSeo()` merges shop settings with page-level SEO
- `apps/cover-me-pretty/src/lib/jsonld.tsx` — `organizationJsonLd()`, `productJsonLd()`, `articleJsonLd()`, `blogItemListJsonLd()`, `JsonLdScript`
- `apps/cochlearfit/src/lib/seo.ts` — `buildMetadata()` basic metadata builder
- `apps/cochlearfit/src/lib/site.ts` — Site constants (SITE_NAME, SITE_URL, etc.)

### Key Modules / Files

**Brikette (reference implementation — 28 SEO components):**
- `apps/brikette/src/components/seo/SeoHead.tsx` — Legacy head builder (mostly superseded by `generateMetadata()`)
- `apps/brikette/src/components/seo/HomeStructuredData.tsx` — Unified `@graph` for homepage
- `apps/brikette/src/components/seo/ArticleStructuredData.tsx` — Article schema
- `apps/brikette/src/components/seo/BreadcrumbStructuredData.tsx` — BreadcrumbList
- `apps/brikette/src/components/seo/FaqJsonLdScript.tsx` — Generic FAQ renderer
- `apps/brikette/src/components/seo/RoomStructuredData.tsx` — HotelRoom + Offer (Brikette-specific)
- `apps/brikette/src/components/seo/HostelStructuredData.tsx` — Hostel schema (Brikette-specific)
- `apps/brikette/src/components/seo/EventStructuredData.tsx` — Event schema
- `apps/brikette/src/components/seo/ServiceStructuredData.tsx` — Service schema
- `apps/brikette/src/components/seo/SiteSearchStructuredData.tsx` — WebSite + SearchAction
- `apps/brikette/src/components/seo/ExperiencesStructuredData.tsx` — ItemList
- `apps/brikette/src/components/seo/DealsStructuredData.tsx` — Offer schema
- `apps/brikette/public/llms.txt` — AI discovery file (801 bytes)
- `apps/brikette/public/.well-known/ai-plugin.json` — ChatGPT plugin manifest
- `apps/brikette/public/.well-known/openapi.yaml` — OpenAPI spec for rates API
- `apps/brikette/public/sitemap.xml` — Static sitemap (371KB, 10+ languages)
- `apps/brikette/public/sitemap_index.xml` — Sitemap index
- `apps/brikette/public/robots.txt` — Static fallback

**Cover-Me-Pretty (good SEO, some gaps):**
- `apps/cover-me-pretty/src/app/robots.ts` — Dynamic robots with AI bot allowlisting
- `apps/cover-me-pretty/src/app/sitemap.ts` — Dynamic sitemap with products + blog + i18n
- `apps/cover-me-pretty/src/lib/jsonld.tsx` — Organization, Product, Article, BlogPosting schemas
- `apps/cover-me-pretty/src/lib/seo.ts` — Shop-settings-driven metadata builder

**Cochlearfit (per-page metadata via helper, no robots/sitemap/structured data):**
- `apps/cochlearfit/src/lib/seo.ts` — `buildMetadata()` helper used by 15 pages via `generateMetadata()`
- `apps/cochlearfit/src/lib/site.ts` — Site constants (`SITE_URL` is placeholder `https://cochlearfit.example`)
- `apps/cochlearfit/src/app/layout.tsx` — Root metadata using correct `SITE_NAME` / `SITE_URL` from site.ts

**Skylar (minimal):**
- `apps/skylar/src/app/layout.tsx` — Static metadata only (title, description, metadataBase)
- Pages: `[lang]/page.tsx`, `[lang]/people/page.tsx`, `[lang]/products/page.tsx`, `[lang]/real-estate/page.tsx`

### Patterns & Conventions Observed

- **Metadata pattern**: All Next.js apps (except Skylar) use `generateMetadata()` with a per-app wrapper function — evidence: `apps/brikette/src/app/_lib/metadata.ts:buildAppMetadata()`, `apps/cover-me-pretty/src/lib/seo.ts:getSeo()`, `apps/cochlearfit/src/lib/seo.ts:buildMetadata()` (15 pages)
- **Structured data pattern**: Memoized React components rendering `<script type="application/ld+json">` with `suppressHydrationWarning` and `dangerouslySetInnerHTML` using `serializeJsonLdValue()` for XSS-safe serialization — evidence: all 28 components in `apps/brikette/src/components/seo/`
- **Package pattern**: `@acme/*` namespace, `workspace:*` deps, `private: true`, ESM (`"type": "module"`), composite TypeScript with `dist/` output — evidence: `packages/ui/package.json`, `packages/types/package.json`, `packages/date-utils/package.json`
- **Path aliases**: `tsconfig.base.json` maps `@acme/pkg` → `["packages/pkg/src/index.ts", "packages/pkg/dist/index.d.ts"]` plus wildcard subpath — evidence: `tsconfig.base.json`
- **Jest config**: Extends `@acme/config/jest.preset.cjs`, rootDir at monorepo root, roots at package dir — evidence: `packages/types/jest.config.cjs`

### Data & Contracts

- Types/schemas:
  - `packages/types/src/ShopSettings.ts` — `shopSettingsSchema` with `seo: seoSettingsSchema` field (currently holds `aiCatalog` config + catchall `shopSeoFieldsSchema`)
  - `packages/types/src/ShopSettings.ts` — exports `ShopSettings`, `AiCatalogConfig`, `HreflangMap` types
  - No shared SEO types exist yet beyond shop settings
- Persistence:
  - Shop settings loaded via `packages/platform-core/src/repositories/settings.json.server.ts`
  - Default SEO settings: `aiCatalog: { enabled: true, fields: [...], pageSize: 50 }`
- API/event contracts:
  - Brikette: `robots.txt/route.ts` serves `buildRobotsTxt()` as `force-static` route
  - CMP: `robots.ts` and `sitemap.ts` use Next.js metadata API conventions
  - No shared SEO API contract exists

### Dependency & Impact Map

- Upstream dependencies:
  - `@acme/types` — `ShopSettings`, `Locale`, `seoSettingsSchema`
  - `@acme/platform-core` — `settings.json.server.ts` for loading shop settings
  - `@acme/i18n` — locale definitions, language codes
- Downstream dependents (apps that would consume `@acme/seo`):
  - `apps/brikette` — incremental migration (extract shared utilities, keep domain-specific local)
  - `apps/cover-me-pretty` — replace local `seo.ts` + `jsonld.tsx` with shared package
  - `apps/cochlearfit` — add robots, sitemap, structured data
  - `apps/skylar` — add full SEO stack from near-zero
- Likely blast radius:
  - **Brikette**: Medium — refactoring imports, no behavior change expected. 32 files import from `seo.ts`, 28 structured data components. Risk: breaking i18n slug translation during extraction.
  - **Cover-Me-Pretty**: Low-Medium — replacing working implementations with shared ones. 11 `generateMetadata()` files, 1 `jsonld.tsx`.
  - **Cochlearfit**: Low — adding robots, sitemap, structured data to app that already has per-page metadata (15 pages with `generateMetadata()`).
  - **Skylar**: Low — adding new capabilities to near-empty SEO surface.

### Test Landscape

#### Test Infrastructure

- **Framework:** Jest with ts-jest
- **Commands:** `pnpm exec jest --ci --runInBand --passWithNoTests` (per app)
- **CI integration:** 3-shard parallel execution for Brikette via `.github/workflows/reusable-app.yml`; classification-based test selection skips tests for deploy-only changes
- **Coverage tools:** Jest coverage, configured per-package

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Brikette `seo.ts` | unit | `src/test/utils/seo.test.ts` (12.5KB), `seo.logic.test.ts` | Comprehensive: buildLinks, buildMeta, buildBreadcrumb across 10 languages |
| Brikette JSON-LD | contract | `src/test/components/seo-jsonld-contract.test.tsx` | Tests HomeStructuredData, AssistanceFaq, GuideFaq, Deals |
| Brikette SiteSearch | unit | `src/test/components/seo/SiteSearchStructuredData.test.tsx` | WebSite + SearchAction across all locales |
| Brikette FAQ builder | unit | `src/test/utils/buildFaqJsonLd.test.ts` | FAQ JSON-LD builder |
| Brikette SEO audit | unit | `src/test/lib/seo-audit.test.ts` | Guide SEO audit scoring |
| Brikette hydration | integration | `src/test/routes/guides/__tests__/hydration/faq-structured-data-hydration.test.tsx` | FAQ structured data hydration safety |
| CMP SEO metadata | unit | `__tests__/seo.test.ts` (70 lines) | getSeo(), canonical URLs, locale fallbacks |
| CMP layout metadata | unit | `__tests__/lang-layout.test.tsx` | generateMetadata locale resolution |
| Cochlearfit | — | none | No SEO tests |
| Skylar | — | none | No SEO tests |

#### Test Patterns & Conventions

- Unit tests: Mock `next/navigation`, `react-i18next`, `fs/promises`. Test utility functions in isolation.
- Contract tests: Render structured data components, parse `<script type="application/ld+json">`, validate JSON-LD fields.
- Hydration tests: Render with SSR, verify no hydration mismatch for dynamic structured data.
- Test data: Inline fixtures, mock translation functions returning key paths.

#### Coverage Gaps (Planning Inputs)

- **Untested paths:**
  - `apps/brikette/src/app/_lib/metadata.ts:buildAppMetadata()` — the main Next.js metadata wrapper has no direct unit test (tested indirectly via page tests)
  - `apps/brikette/src/seo/robots.ts:buildRobotsTxt()` — no unit test for robots builder
  - `apps/cover-me-pretty/src/lib/jsonld.tsx` — JSON-LD output is mocked in tests, not validated
  - `GuideSeoTemplate.integration.test.tsx` — 8 `.todo()` placeholders, not implemented
- **Extinct tests:** None identified

#### Testability Assessment

- **Easy to test:** Metadata builders (pure functions), robots.txt generators, JSON-LD serializers, structured data builders — all pure functions with deterministic output
- **Hard to test:** i18n slug translation (depends on translation fixtures), shop-settings-driven metadata (needs mock settings)
- **Test seams needed:** `@acme/seo` package should export pure utility functions that don't depend on Next.js runtime — this makes them easily testable in isolation

#### Recommended Test Approach

- **Unit tests for:** All shared utilities (buildMetadata, buildLinks, buildBreadcrumb, generateRobotsTxt, generateLlmsTxt, serializeJsonLdValue, all structured data builders)
- **Contract tests for:** Structured data components (render → parse JSON-LD → validate schema)
- **Integration tests for:** Per-app wiring (does the app's `generateMetadata()` call produce correct output using shared utilities?)
- **Note:** Tests should be in `packages/seo/` for shared utilities, in `apps/*/` for app-specific wiring

### Recent Git History (Targeted)

- `apps/brikette/src/utils/seo.ts` — Last modified Feb 11. Active file with regular updates.
- `apps/brikette/src/components/seo/` — Last modified Feb 8. Stable directory, infrequent changes.
- `apps/brikette/public/llms.txt` — Last modified Jan 28. Static content.
- `apps/cover-me-pretty/src/lib/seo.ts` — Stable, infrequent changes.
- `apps/cover-me-pretty/src/lib/jsonld.tsx` — Stable.
- Storefront app retired Feb 11 2026 (commit `c4c44428a9`) — no longer in scope.

## Architectural Decisions

### Endpoint Serving Strategy

**Decision:** `@acme/seo` exports builder functions; each app owns its route entrypoints.

Next.js App Router requires route files to live in each app's `src/app/` tree. You cannot centralize a route file in a shared package and have Next.js treat it as a metadata route. Therefore:

- **`robots.ts`** — each app has `src/app/robots.ts` that calls `@acme/seo/robots` builders
- **`sitemap.ts`** — each app has `src/app/sitemap.ts` that calls `@acme/seo/sitemap` helpers
- **`llms.txt`** — served from `public/llms.txt` (static file). For static-export-compatible apps, this is the only safe option. Content generated at build time by a prebuild script calling `@acme/seo/ai` generators, writing output to each app's `public/`.
- **`ai-plugin.json`** — served from `public/.well-known/ai-plugin.json` (static file, opt-in per app). Same prebuild approach.
- **Brikette static sitemaps** — `public/sitemap.xml` and `public/sitemap_index.xml` remain as-is (checked into git). `@acme/seo` may provide validation utilities but does not replace Brikette's static sitemap generation.

**Rationale:** Build-time file generation into `public/` is the lowest operational risk given the static export constraint. Runtime route handlers work for robots/sitemap (which Next.js handles natively) but not for arbitrary static files in export mode.

### Package Dependency Posture

**Decision:** `@acme/seo` declares `next` and `react` as `peerDependencies` (and `devDependencies` for local typecheck).

- Core utility functions (buildLinks, serializeJsonLdValue, generateRobotsTxt, etc.) are pure — no Next.js or React runtime imports.
- The `@acme/seo/metadata` subpath uses `import type { Metadata } from "next"` (type-only, erased at runtime).
- The `@acme/seo/jsonld` subpath exports React components (`<JsonLdScript />`), requiring React as a peer.
- In strict pnpm, the package must explicitly declare these peer deps for module resolution to succeed during typecheck.

### Extraction Boundaries

| Moves to `@acme/seo` (shared) | Stays app-local |
|-------------------------------|-----------------|
| `ensureTrailingSlash()` | Brikette hotel/hostel/room/guide schema nodes |
| Generic canonical URL builder | Brikette slug translation / route constants |
| Generic hreflang/alternates builder (no slug translation) | Brikette `buildHomeGraph()`, `buildHotelNode()`, `buildOffer()` |
| `serializeJsonLdValue()` + shared `<JsonLdScript />` component | Brikette static sitemap artifacts (`public/sitemap*.xml`) |
| Generic structured data builders: Organization, Product, Article/BlogPosting, BreadcrumbList, FAQPage, WebSite+SearchAction, ItemList, Event, Service | CMP `getSeo()` shop-settings integration (thin wrapper over `@acme/seo/metadata`) |
| `buildRobotsTxt()` (configurable paths + AI bot list) | Cochlearfit `buildMetadata()` (thin wrapper over `@acme/seo/metadata`) |
| Sitemap helpers for Next.js metadata routes | Each app's `src/app/robots.ts`, `src/app/sitemap.ts` route files |
| `buildLlmsTxt()` template generator | |
| `buildAiPluginManifest()` (opt-in) | |

### Package API Proposal (Draft)

```
@acme/seo/config
  SeoSiteConfig     — siteName, siteUrl, defaultLocale, locales, twitterHandle, defaultOgImage
  SeoRobotsConfig   — allowIndexing, disallowPaths, sitemapPaths, aiBotPolicy
  SeoAiConfig       — llmsTxt sections, pluginManifest fields (optional)

@acme/seo/metadata
  buildMetadata(config, pageSeo) → Metadata
  buildAlternates(config, { canonicalPath, locales }) → alternates object
  ensureTrailingSlash(path) → string

@acme/seo/jsonld
  serializeJsonLdValue(value) → string (XSS-safe)
  <JsonLdScript value={...} />
  organizationJsonLd(config) → object
  productJsonLd(input) → object
  articleJsonLd(input) → object
  breadcrumbJsonLd(items) → object
  faqJsonLd(items) → object
  websiteSearchJsonLd(config) → object
  itemListJsonLd(items) → object
  eventJsonLd(input) → object
  serviceJsonLd(input) → object

@acme/seo/robots
  buildRobotsTxt(config) → string
  buildRobotsMetadataRoute(config) → MetadataRoute.Robots

@acme/seo/sitemap
  buildSitemapEntry(url, options) → MetadataRoute.Sitemap entry
  buildSitemapWithAlternates(pages, config) → MetadataRoute.Sitemap[]

@acme/seo/ai
  buildLlmsTxt(config) → string
  buildAiPluginManifest(config) → object
```

**Key design constraint:** Everything in `@acme/seo/config`, `@acme/seo/robots`, `@acme/seo/ai` is pure (no React, no Next.js runtime). Only `@acme/seo/metadata` uses Next.js types (type-only imports). Only `@acme/seo/jsonld` exports React components.

### SEO Parity Checklist

Measurable definition of "SEO parity" — the feature set each customer-facing app should have after this work:

| Feature | Brikette | CMP | Cochlearfit | Skylar | Notes |
|---------|----------|-----|-------------|--------|-------|
| Canonical URL + `alternates.languages` (hreflang) | Has | Has | **Add** | **Add** | For all localized pages |
| OpenGraph + Twitter cards with default images | Has | Has | Has (OG only) | **Add** | Cochlearfit missing Twitter cards |
| `robots.ts` with environment-aware noindex for staging | Has | Has | **Add** | **Add** | |
| `sitemap.ts` with indexable pages + i18n alternates | Has (static) | Has | **Add** | **Add** | |
| Organization JSON-LD on all pages | Has | Has | **Add** | **Add** | |
| Product JSON-LD on product detail pages | Has | Has | **Add** | N/A | Skylar has no products |
| Article/BlogPosting JSON-LD on blog pages | Has | Has | N/A | N/A | Only CMP + Brikette have blogs |
| BreadcrumbList JSON-LD where navigation is hierarchical | Has | N/A | **Add** (if applicable) | N/A | |
| FAQ JSON-LD on FAQ pages | Has | N/A | **Add** | N/A | Cochlearfit has `/faq` page |
| `llms.txt` for AI crawler discovery | Has | **Add** | **Add** | **Add** | |
| `ai-plugin.json` (opt-in, only with backing API) | Has | Skip | Skip | Skip | |

### Config Precedence Rules

When multiple config sources provide SEO values, precedence is:

1. **Per-page overrides** (`generateMetadata()` args) — highest priority
2. **Shop settings `seo`** (runtime/config from `@acme/types`)
3. **App defaults** (`site.ts` constants like `SITE_NAME`, `SITE_URL`)
4. **Package fallbacks** (`@acme/seo` sensible defaults) — lowest priority

`metadataBase` is set once per app in root layout from `SITE_URL` or environment variable. For static export compatibility, it cannot depend on request headers.

### Environment Behavior (Prod vs Staging vs Preview)

| Environment | `robots` | `sitemap` | `canonical host` |
|------------|----------|-----------|-------------------|
| **Production** | `index, follow` + AI bot allowlisting | Full sitemap with all indexable pages | Real domain (e.g., `hostel-positano.com`) |
| **Staging** (static export) | `noindex, nofollow` via `<meta>` or robots.txt `Disallow: /` | Omit or return empty | Staging domain (no canonical confusion) |
| **Preview** (PR deploys) | `noindex, nofollow` | Omit | Preview domain |

Implementation: `@acme/seo/robots` builder accepts an `allowIndexing` flag. Apps set it based on environment variable (e.g., `NEXT_PUBLIC_ALLOW_INDEXING !== 'true'` → noindex). This is already partially implemented in CMP's robots.ts.

### SEO Correctness Invariants

These regress easily during refactors and should become unit tests in `packages/seo/`:

1. **Canonical URLs are absolute and stable** — host + path + trailing slash policy applied consistently
2. **hreflang alternates cover all locales** and use valid BCP 47 language tags (not mixed `en` / `en-US` / `pt_BR` formats)
3. **robots.txt includes correct sitemap URLs** that actually resolve (no phantom references like CMP's current `ai-sitemap.xml`)
4. **JSON-LD serialization is XSS-safe** and stable across SSR/CSR (no hydration mismatch)
5. **`metadataBase` is consistent with canonical host** — prevents indexation of multiple hosts
6. **Trailing slash policy is uniform** — canonical, sitemap, and hreflang URLs all use the same trailing slash convention

### Brikette Extraction Decision

**Decision:** Incremental extraction with re-exports.

- **Phase 1:** Extract shared utilities into `@acme/seo`. Brikette re-exports from its existing paths (e.g., `apps/brikette/src/utils/seo.ts` re-exports from `@acme/seo/metadata`). Zero breaking changes for Brikette consumers.
- **Phase 2 (follow-up):** Migrate Brikette consumers to import directly from `@acme/seo`. Remove re-export shims.

**Rationale:** Minimizes blast radius. 32 files import from `seo.ts` — changing all of them simultaneously is high-risk. Re-exports preserve existing import paths while contract tests verify no behavioral regression. Temporary dual import paths are acceptable.

## Questions

### Resolved

- Q: Does Brikette use React Router?
  - A: No. Brikette uses Next.js 15 App Router (`next: ^15.3.9`, `next.config.mjs`, `src/app/` directory).
  - Evidence: `apps/brikette/package.json`, `apps/brikette/next.config.mjs`

- Q: Does Cover-Me-Pretty already have structured data?
  - A: Yes — comprehensive JSON-LD (Organization, Product, Article, BlogPosting) in `src/lib/jsonld.tsx`.
  - Evidence: `apps/cover-me-pretty/src/lib/jsonld.tsx`

- Q: Does the shop settings schema already have SEO config?
  - A: Yes — `seo` field in `shopSettingsSchema` holds `aiCatalog` config and catchall SEO fields.
  - Evidence: `packages/types/src/ShopSettings.ts`

- Q: What package structure conventions exist?
  - A: `@acme/*` namespace, `workspace:*` deps, ESM, composite TS, `dist/` output, path aliases in `tsconfig.base.json`.
  - Evidence: `packages/ui/package.json`, `packages/types/tsconfig.json`, `tsconfig.base.json`

- Q: Is SeoHead.tsx the primary metadata approach?
  - A: No — `SeoHead.tsx` is legacy. Pages use `generateMetadata()` with `buildAppMetadata()` wrapper.
  - Evidence: 27 files use `generateMetadata()`, only 1 file references `SeoHead` (documentation)

- Q: Are sitemaps dynamic or static in Brikette?
  - A: Static — `public/sitemap.xml` (371KB) and `public/sitemap_index.xml` are checked into version control.
  - Evidence: `apps/brikette/public/sitemap.xml`, `apps/brikette/public/sitemap_index.xml`

- Q: For Brikette extraction — incremental with re-exports or full migration?
  - A: Incremental extraction with re-exports (decided — see [Brikette Extraction Decision](#brikette-extraction-decision)).
  - Rationale: 32 importers, high blast radius. Re-exports preserve paths while contract tests verify behavior.

### Open (User Input Needed)

- (None — all questions resolved with sensible defaults)

## Confidence Inputs (for /lp-plan)

- **Implementation:** 82%
  - Strong reference implementation exists in Brikette with clear patterns. All apps use the same framework (Next.js App Router). Package infrastructure patterns are well-established. Gap: exact extraction boundaries for Brikette's i18n-heavy slug translation logic (tightly coupled to Brikette routes).
- **Approach:** 85%
  - Single viable approach: extract shared utilities into `@acme/seo`, keep domain-specific components local. No React Router complexity. Shop settings schema already has SEO config to extend. The original plan's CMS-driven config UI is deferred (not needed now).
- **Impact:** 78%
  - Brikette blast radius is the main concern: 32 files import `seo.ts`, 28 structured data components. i18n slug translation is heavily intertwined with Brikette-specific route structure. Other apps have smaller surface area. Would benefit from a spike to map the exact extraction boundary in `seo.ts`.
- **Delivery-Readiness:** 90%
  - Clear owner (engineering), clear deployment path (monorepo package publish via pnpm workspace), clear quality gates (existing test patterns to follow, CI pipeline in place).
- **Testability:** 88%
  - Core utilities are pure functions — highly testable. Brikette already has strong SEO test coverage (54 test files referencing SEO terms) providing patterns to follow. New `@acme/seo` tests can be comprehensive from day one.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Brikette i18n slug translation is too tightly coupled to extract cleanly | Medium | High | Spike: map `buildLinks()` dependencies on Brikette-specific route/guide constants. May need to keep slug translation in Brikette and share only the generic hreflang builder. |
| Breaking existing Brikette SEO during extraction | Low | High | Incremental extraction with re-exports preserves existing imports. JSON-LD contract tests in Brikette catch regressions. |
| Cochlearfit `SITE_URL` is placeholder domain (`cochlearfit.example`) — may affect canonical URLs and sitemaps | Medium | Medium | Verify whether Cochlearfit is deployed with a real domain; update `SITE_URL` in `src/lib/site.ts` before adding robots/sitemap. |
| Cover-Me-Pretty `ai-sitemap.xml` referenced in robots.ts but doesn't exist (404) | High | Low | Remove reference or implement ai-sitemap. Decision: remove reference for now, add proper ai-sitemap later. |
| Static sitemap approach (Brikette) vs dynamic sitemap approach (CMP) creates two patterns | Low | Low | Accept both patterns. Brikette's static sitemap is checked in and works well for its use case. Shared package provides the dynamic generator for apps that need it. |
| Canonical + trailing slash policy drift between canonical URLs, sitemap, and hreflang | Medium | Medium | Enforce single normalization rule in `@acme/seo/metadata`. Add unit tests that canonical, sitemap entry, and hreflang URL formatting match for the same page. |
| hreflang BCP 47 correctness — mixed locale formats (`en`, `en-US`, `pt_BR`) silently break hreflang | Low | Medium | Central locale normalization function in `@acme/seo` + tests for all supported locales. |
| AI bot allowlist ages silently as new crawlers appear | Low | Low | Make bot list config-driven (not hard-coded). Keep defaults minimal and app-overrideable. |

## Planning Constraints & Notes

- Must-follow patterns:
  - New package: `packages/seo/` with `@acme/seo` name, `workspace:*`, composite TS, `dist/` output
  - `next` and `react` as `peerDependencies` + `devDependencies` in `packages/seo/package.json`
  - Path aliases in `tsconfig.base.json`: `@acme/seo` and `@acme/seo/*`
  - Jest config extending `@acme/config/jest.preset.cjs`
  - Module mapper entry in `jest.moduleMapper.cjs`
  - JSON-LD components use `suppressHydrationWarning` + `serializeJsonLdValue()` for safety
  - `@acme/seo` exports builders; apps keep route entrypoints (`robots.ts`, `sitemap.ts`) — see [Endpoint Serving Strategy](#endpoint-serving-strategy)
  - Machine-readable static files (`llms.txt`, `ai-plugin.json`) generated at build time into `public/` — see [Endpoint Serving Strategy](#endpoint-serving-strategy)
  - Environment-aware indexing: staging/preview = noindex; production = index — see [Environment Behavior](#environment-behavior-prod-vs-staging-vs-preview)
  - [SEO Correctness Invariants](#seo-correctness-invariants) must be unit-tested in `packages/seo/`
- Rollout/rollback expectations:
  - Brikette extraction uses incremental re-export pattern — see [Brikette Extraction Decision](#brikette-extraction-decision)
  - Each app integration is independently deployable (staged — see acceptance package)
  - No feature flags needed — changes are additive for Cochlearfit/Skylar, import-swap for Brikette/CMP
- Observability expectations:
  - Google Search Console validation after rollout (manual)
  - Rich Results Test for structured data validation (manual)
  - Existing JSON-LD contract tests catch regressions in CI

## Suggested Task Seeds (Non-binding)

1. **Fix CMP robots.ts phantom ai-sitemap.xml reference** (S, standalone)
2. **Verify/fix Cochlearfit `SITE_URL` placeholder** — confirm real production domain, update `src/lib/site.ts` (S)
3. **Create `packages/seo/` package scaffold** — package.json, tsconfig, jest config, path aliases (S)
4. **Extract generic metadata builders** — `buildAppMetadata()`, `buildLinks()` (generic hreflang without Brikette slug translation), `ensureTrailingSlash()` (M)
5. **Extract JSON-LD utilities** — `serializeJsonLdValue()`, generic structured data builders (Organization, Product, Article, FAQ, Breadcrumb, Event, Service) (M)
6. **Extract robots.txt generator** — `buildRobotsTxt()` with configurable paths and AI bot list (S)
7. **Create llms.txt generator** — template-driven from config (S)
8. **Integrate `@acme/seo` into Cochlearfit** — add robots, sitemap, Organization structured data, Product structured data, FAQ structured data (M)
9. **Integrate `@acme/seo` into Skylar** — add robots, sitemap, Organization structured data, per-page metadata (M)
10. **Integrate `@acme/seo` into Cover-Me-Pretty** — swap local implementations for shared package (M)
11. **Begin Brikette extraction** — migrate generic imports to `@acme/seo`, keep Brikette-specific (hotel/hostel/guide) local (L)

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: none required
- Deliverable acceptance package (staged):
  - **Stage 1 — Bug fixes (standalone):** CMP robots.ts phantom reference removed; Cochlearfit `SITE_URL` updated from placeholder
  - **Stage 2 — Package scaffold:** `packages/seo/` exists with passing unit tests; path aliases registered; `pnpm typecheck` passes monorepo-wide
  - **Stage 3 — CMP integration:** CMP imports from `@acme/seo`; existing SEO behavior preserved; `pnpm test --filter cover-me-pretty` passes
  - **Stage 4 — Cochlearfit integration:** robots.ts, sitemap.ts, Organization + Product + FAQ structured data added; `pnpm test --filter cochlearfit` passes
  - **Stage 5 — Skylar integration:** robots.ts, sitemap.ts, Organization structured data, per-page metadata added
  - **Stage 6 — Brikette extraction:** Generic imports migrated to `@acme/seo` via re-exports; Brikette JSON-LD contract tests still pass; all 32 `seo.ts` importers unchanged
- Post-delivery measurement plan:
  - Google Search Console: verify no coverage errors after rollout
  - Rich Results Test: validate structured data on representative pages
  - Manual: verify llms.txt accessible at each app's URL

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open questions have sensible defaults)
- Recommended next step: Proceed to `/lp-plan`
