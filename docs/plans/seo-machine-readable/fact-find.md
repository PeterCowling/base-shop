---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
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
- Bring Cochlearfit and Skylar up to parity with Cover-Me-Pretty's SEO maturity
- Add machine-readable AI support (llms.txt, ai-plugin.json) to all customer-facing apps
- Fix known bugs: CMP phantom ai-sitemap.xml reference, Cochlearfit placeholder `SITE_URL` (`cochlearfit.example`)

### Non-goals

- CMS-driven SEO configuration UI (deferred — current shop settings + code config is sufficient for now)
- OpenAPI spec generation (only Brikette has an API worth documenting)
- Brikette-specific schema types (hotel, hostel, room, guide) — these stay local
- React Router / non-Next.js framework support (all apps are Next.js App Router)

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

### Open (User Input Needed)

- Q: For Brikette extraction — should we extract utilities first (keeping Brikette imports working via re-exports) or do a full migration in one pass?
  - Why it matters: Incremental extraction is safer but creates a period of dual imports. Full migration is cleaner but riskier.
  - Decision impacted: Task decomposition and sequencing.
  - Decision owner: Pete
  - Default assumption: Incremental extraction (extract shared code, re-export from Brikette initially, migrate consumers in follow-up). Risk: temporary dual import paths.

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

## Planning Constraints & Notes

- Must-follow patterns:
  - New package: `packages/seo/` with `@acme/seo` name, `workspace:*`, composite TS, `dist/` output
  - Path aliases in `tsconfig.base.json`: `@acme/seo` and `@acme/seo/*`
  - Jest config extending `@acme/config/jest.preset.cjs`
  - Module mapper entry in `jest.moduleMapper.cjs`
  - JSON-LD components use `suppressHydrationWarning` + `serializeJsonLdValue()` for safety
- Rollout/rollback expectations:
  - Brikette extraction should be behind the same import paths initially (re-export pattern)
  - Each app integration is independently deployable
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
- Deliverable acceptance package:
  - `packages/seo/` exists with passing tests
  - All four apps pass `pnpm typecheck && pnpm lint`
  - Brikette JSON-LD contract tests still pass
  - Cochlearfit and Skylar have robots.ts, sitemap.ts, Organization structured data
  - CMP robots.ts no longer references phantom ai-sitemap.xml
  - Cochlearfit `SITE_URL` updated from placeholder to real production domain
- Post-delivery measurement plan:
  - Google Search Console: verify no coverage errors after rollout
  - Rich Results Test: validate structured data on representative pages
  - Manual: verify llms.txt accessible at each app's URL

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open questions have sensible defaults)
- Recommended next step: Proceed to `/lp-plan`
