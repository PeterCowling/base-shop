---
Type: Fact-Find
Outcome: Planning
Status: Proposed
Domain: SEO
Created: 2026-01-28
Last-updated: 2026-01-28
Feature-Slug: brikette-seo-machine-readership-fixes
Related-Plan: docs/plans/brikette-seo-machine-readership-fixes-plan.md
---

# Brikette SEO + Machine-Readership Fact-Find Brief

## Scope

### Summary

Fix critical SEO issues affecting indexing, discoverability, and machine readership for the Brikette hostel website. Production audit reveals three P0 issues: incorrect hreflang alternates causing duplicate content risk, canonical URL/trailing-slash mismatch, and broken machine-layer API references in OpenAPI and JSON-LD.

### Goals

- Correct hreflang alternates to use localized slugs (eliminate duplicate content risk)
- Align canonical URLs with server trailing-slash behavior
- Fix or remove broken API endpoint references in machine-facing metadata
- Ensure complete social metadata (OG + Twitter tags with images) on all indexable pages
- Align repo and production machine artifacts (llms.txt, schema graphs, sitemap/robots)

### Non-goals

- Performance optimization (separate from SEO correctness)
- New SEO features (focus on fixing existing broken functionality)
- Redesigning URL structure (work within existing locale/slug patterns)
- Adding new API endpoints beyond the minimum needed for machine readability

### Constraints & Assumptions

- Constraints:
  - Must maintain existing URL patterns and locale structure (multilingual Next.js 15 App Router)
  - Cannot break existing indexed URLs (redirects required for incorrect hreflang targets)
  - Production is Cloudflare Pages deployment
  - Must support 10+ languages with localized slugs
- Assumptions:
  - BASE_URL is correctly configured for production (`https://hostel-positano.com`)
  - Trailing slashes are server-enforced (HTTP 308 redirects observed)

## Repo Audit (Current State)

### Entry Points

- `apps/brikette/src/app/_lib/metadata.ts` — Next.js App Router metadata builder (`buildAppMetadata()`, `buildAppLinks()`)
  - **Issue:** Uses naive string replacement `path.replace(\`/${lang}\`, ...)` for hreflang alternates (lines 56-60)
- `apps/brikette/src/utils/seo.ts` — Core SEO helper with **correct** slug translation logic (`buildLinks()`, `buildBreadcrumb()`, `buildMeta()`, `pageHead()`)
  - Lines 90-186: `buildLinks()` properly translates slugs using `SLUGS` map and `guideSlug()` for nested paths
  - This is the **source of truth** for correct hreflang generation
- `apps/brikette/src/components/seo/*` — JSON-LD structured data components (HomeStructuredData, AssistanceFaqJsonLd, GuideFaqJsonLd, DealsStructuredData)
- `apps/brikette/scripts/generate-public-seo.ts` — Sitemap/robots/schema generator (not wired into build)
- `apps/brikette/public/llms.txt` — Machine-layer index (repo version differs from production)

### Key Modules / Files

- `apps/brikette/src/slug-map.ts` — Centralized slug translations across all locales (SLUGS map)
- `apps/brikette/src/guides/slugs.ts` — Guide-specific slug lookup (GUIDE_SLUG_LOOKUP_BY_LANG, guideSlug(), guideNamespace())
- `apps/brikette/src/i18n.config.ts` — Language configuration (supportedLngs, fallbackLng)
- `apps/brikette/src/config/site.ts` — BASE_URL configuration
- `apps/brikette/src/utils/headConstants.ts` — Default OG_IMAGE dimensions

### Patterns & Conventions Observed

- **Multilingual routing:** `/[lang]/[slug]` with localized slugs per language (e.g., `/en/rooms`, `/de/zimmer`, `/es/habitaciones`)
- **Nested routes:** Guides use two-level localized slugs: `/{lang}/{namespace}/{guideSlug}` (e.g., `/en/experiences/ferry-schedules`, `/fr/experiences/horaires-ferries`)
- **SEO helper separation:** `utils/seo.ts` has correct logic; `app/_lib/metadata.ts` is Next.js App Router wrapper that incorrectly reimplements hreflang
- **Trailing slash enforcement:** Server redirects (HTTP 308) non-trailing to trailing (e.g., `/en/rooms` → `/en/rooms/`)
- **Canonical normalization:** Canonicals should strip trailing slashes (observed in `trimTrailingSlash` utility at seo.ts:66-67)

**Deep Localization Architecture:**
- **File system:** Next.js App Router uses English directory names (`src/app/[lang]/rooms/`, `/deals/`, etc.)
- **Middleware translation:** Rewrites user-facing localized URLs → internal English segments
  - Example: `/de/zimmer/` → `/de/rooms/` (internal) → serves from `src/app/[lang]/rooms/page.tsx`
  - Implementation: `src/middleware.ts:71-111` (`resolveTopLevelKey()` + rewrite logic)
- **Navigation generation:** Uses `buildNavLinks()` + `translatePath()` to emit localized links in UI
- **CRITICAL GAP:** Middleware only rewrites localized → internal; does NOT redirect English slugs in non-English locales
  - Result: Both `/de/zimmer/` and `/de/rooms/` render content (duplicate pages)
  - Impact: 10 languages × 15 routes = 150+ duplicate URL pairs currently serving
  - **This violates deep localization principle:** User-facing URLs should ONLY use locale-appropriate slugs

Evidence: `apps/brikette/src/utils/seo.ts:90-186`, test coverage in `apps/brikette/src/test/utils/seo.test.ts:24-243`, middleware at `src/middleware.ts:71-111`

### Data & Contracts

**Types:**
- `HtmlLinkDescriptor` (seo.ts:17-23) — Link tag structure (rel, href, hrefLang)
- `BreadcrumbList` (seo.ts:25-35) — Schema.org breadcrumb JSON-LD
- `AppMetadataArgs` (metadata.ts:10-27) — Next.js metadata builder input
- `PageHeadArgs` (seo.ts:277-286) — Unified head tag generator input

**Next.js Metadata object structure:**
- `Metadata.alternates.canonical` — Canonical URL string
- `Metadata.alternates.languages` — Record<lang, url> for hreflang (currently broken)
- `Metadata.openGraph` — OG tags (title, description, url, type, locale, images)
- `Metadata.twitter` — Twitter card tags

**Production endpoints observed (as of 2026-01-28):**
- `https://hostel-positano.com/robots.txt` — Minimal, allows all, points to sitemap
- `https://hostel-positano.com/sitemap.xml` — Localized URLs with lastmod (identical across entries)
- `https://hostel-positano.com/llms.txt` — Machine index (smaller than repo version)
- `https://hostel-positano.com/.well-known/openapi.yaml` — API spec (documents non-existent endpoints)
- `https://hostel-positano.com/.well-known/ai-plugin.json` — Points to OpenAPI
- `https://hostel-positano.com/schema/hostel-brikette/*.jsonld` — Schema graphs
- `https://hostel-positano.com/data/rates.json` — Rates data

### Dependency & Impact Map

**Upstream dependencies:**
- `i18nConfig` (supportedLngs, fallbackLng) — Language list drives hreflang generation
- `SLUGS` map (slug-map.ts) — Single source of truth for top-level route translations
- `GUIDE_SLUG_LOOKUP_BY_LANG` (guides/slugs.ts) — Guide-specific slug translations
- `BASE_URL` (config/site.ts) — Origin for canonical and alternate URLs
- Next.js App Router metadata API (generateMetadata return type)

**Downstream dependents:**
- All page routes using `buildAppMetadata()` — Currently emit incorrect hreflang
- Search engine crawlers — Interpreting wrong alternates as duplicate content
- Social media crawlers (Facebook, Twitter, LinkedIn) — Consuming OG/Twitter metadata
- AI agents and plugins — Consuming llms.txt, OpenAPI, JSON-LD
- Structured data consumers (Google Rich Results) — Processing JSON-LD blocks

**Blast radius:**
- **High impact:** Hreflang fix affects all localized pages across the site (10+ languages × ~50+ routes = 500+ pages)
- **Medium impact:** Canonical/trailing-slash fix affects all pages but is less risky (redirect logic only)
- **Low impact:** Machine-layer fixes affect only API documentation and llms.txt (no user-facing UI changes)

### Tests & Quality Gates

**Existing tests:**
- `apps/brikette/src/test/utils/seo.test.ts` (244 lines) — Comprehensive coverage of `buildLinks()`, `buildMeta()`, `buildBreadcrumb()`
  - Lines 24-243: 30+ test cases for hreflang alternate generation across all supported languages
  - Covers: home, subpages, localized slugs, guides, nested routes, room detail pages, alternate URL normalization
  - **Verdict:** Excellent coverage of **correct** logic in `utils/seo.ts`
- `apps/brikette/src/test/components/seo-jsonld-contract.test.tsx` (93 lines) — JSON-LD canonical URL validation
  - Tests HomeStructuredData, AssistanceFaqJsonLd, GuideFaqJsonLd, DealsStructuredData
  - Validates script tag escaping (prevents XSS in JSON-LD)
- `apps/brikette/src/test/utils/seo.logic.test.ts` — Additional SEO logic tests

**Gaps:**
- **No tests for `buildAppMetadata()`** in `app/_lib/metadata.ts` — The broken hreflang logic is untested
- **No integration tests** verifying that page routes actually call the correct SEO helper
- **No production validation suite** — Manual `curl` checks only, no automated monitoring
- **No tests for OpenAPI/JSON-LD endpoint validity** — Machine-layer contracts are unchecked

**Commands/suites:**
- `pnpm test` — Runs Jest unit tests (includes existing SEO tests)
- Manual validation: `curl` commands (see Reproduction Commands section below)

### Recent Git History (Targeted)

Recent commits relevant to guides/SEO/i18n (from git status and log):
- `44e99dfb29` — "brikette(guides): guide/i18n content migration snapshot" (2026-01-27)
- Multiple modified guides, locales, assistance tags, and guide manifest files
- Significant guide system refactoring in progress (draft dashboard, grouped collections, generic content builder)

Evidence: No recent commits directly touching `metadata.ts` or `seo.ts` — hreflang bug is longstanding.

## Issues Identified (Prioritized)

### P0: Indexing / Duplication / Correctness

#### Issue 1: Hreflang alternates use wrong URLs (duplicate content risk)

**Observed behavior (production):**
- `https://hostel-positano.com/en/rooms/` emits hreflang alternates: `https://hostel-positano.com/de/rooms`, `.../es/rooms`, etc.
- But sitemap contains localized URLs: `https://hostel-positano.com/de/zimmer`, `.../es/habitaciones`
- Wrong alternate URLs (e.g., `/de/rooms/`) resolve as separate 200 pages → duplicate content competing for indexing

**Root cause:**
- `apps/brikette/src/app/_lib/metadata.ts:56-60` — Naive string replacement `path.replace(\`/${lang}\`, \`/${supportedLang}\`)`
- Cannot handle localized slugs; assumes all path segments are language-agnostic
- Correct logic already exists in `utils/seo.ts:90-186` (`buildLinks()`), but is not used by `buildAppMetadata()`

**Evidence:**
- Production: `curl -sS https://hostel-positano.com/en/rooms/ | grep hreflang`
- Repo: `apps/brikette/src/app/_lib/metadata.ts:56-60` vs. `apps/brikette/src/utils/seo.ts:90-186`
- Tests validate correct logic but don't catch broken wrapper: `apps/brikette/src/test/utils/seo.test.ts:43-233`

**Deep localization architecture note:**
- Middleware (`src/middleware.ts:71-111`) correctly rewrites localized slugs → English internal segments (e.g., `/de/zimmer/` → `/de/rooms/`)
- Navigation uses `buildNavLinks()` + `translatePath()` to generate localized links
- **Gap:** Middleware does NOT redirect English slugs in non-English locales → Issue 1a below addresses this

#### Issue 1a: English slugs serve duplicate content in non-English locales (shallow localization)

**Observed behavior:**
- Middleware rewrites localized slugs → internal English segments (working correctly: `/de/zimmer/` → `/de/rooms/` internal)
- **But:** English slugs in non-English locales are NOT redirected (e.g., `/de/rooms/` also renders page)
- Result: Both `/de/zimmer/` and `/de/rooms/` serve identical content (duplicate pages)
- Same issue for all locales × all routes: `/fr/deals/` vs `/fr/offres/`, `/es/careers/` vs `/es/empleos/`, etc.

**Root cause:**
- Middleware `resolveTopLevelKey()` (middleware.ts:42-69) checks if segment matches locale-specific slug
- If English slug doesn't match localized slug, `key` returns `null`
- Middleware calls `NextResponse.next()` without redirect → page renders anyway
- No enforcement that user-facing URLs must use locale-appropriate slugs

**Impact:**
- Duplicate content: 10+ languages × 15+ routes = **150+ duplicate URL pairs**
- Search engines may index both versions, splitting page authority
- Users can discover and share non-localized URLs, breaking consistency
- Undermines the entire localization strategy (URLs not "deeply localized")

**Evidence:**
- Repo: `src/middleware.ts:89-92` — Only rewrites if `key` is found; no redirect for mismatches
- Architecture: Next.js App Router uses English directory names (`/app/[lang]/rooms/`), relies on middleware for URL translation
- Test gap: No tests verifying that `/de/rooms/` redirects to `/de/zimmer/`

**What deep localization should enforce:**
- User-facing URLs MUST use locale-appropriate slugs (e.g., `/de/zimmer/`, NOT `/de/rooms/`)
- English slugs in non-English locales should 301 redirect → localized canonical
- Only exception: Language-agnostic identifiers (UUIDs, room codes like `double_room`, brand names)

#### Issue 2: Canonical URLs conflict with trailing-slash redirects

**Observed behavior (production):**
- Server redirects `/en/rooms` → `/en/rooms/` (HTTP 308)
- Page at `/en/rooms/` declares canonical `https://hostel-positano.com/en/rooms` (no trailing slash)
- Sitemap lists URLs without trailing slashes

**Impact:**
- Canonical URLs require redirect hop (crawl inefficiency)
- Mixed signals confuse crawlers about preferred URL form

**Root cause:**
- Server-side trailing-slash enforcement (likely Cloudflare Pages config)
- Canonical generation uses `trimTrailingSlash()` (seo.ts:66-67)
- Mismatch between deployment config and SEO helper convention

**Evidence:**
- Production: `curl -sI https://hostel-positano.com/en/rooms` → `Location: /en/rooms/`
- Production: `curl -sS https://hostel-positano.com/en/rooms/ | grep canonical`

#### Issue 3: OpenAPI and JSON-LD reference non-existent API endpoints

**Observed behavior (production):**
- `openapi.yaml` documents `GET /api/rooms`, `POST /api/book`
- `https://hostel-positano.com/api/rooms` returns HTML (not JSON)
- `https://hostel-positano.com/api/book` returns HTTP 405 for POST
- Home page JSON-LD includes `ReserveAction` target: `https://hostel-positano.com/api/quote?...` (returns HTML)

**Impact:**
- Breaks machine trust (AI agents, plugins, scrapers)
- Downstream integrations fail when consuming OpenAPI/JSON-LD

**Root cause:**
- Machine-layer documentation out of sync with implemented endpoints
- No validation gate ensuring documented APIs actually exist

**Evidence:**
- Production: `curl -sS -I https://hostel-positano.com/api/rooms`
- Production: `curl -sS -i -X POST https://hostel-positano.com/api/book -H 'Content-Type: application/json' -d '{}'`

### P1: Social + Rich Results Quality

#### Issue 4: Social metadata coverage incomplete/inconsistent

**Observed behavior:**
- Root layout defines `openGraph.siteName`, `twitter.site`, `twitter.creator` (apps/brikette/src/app/layout.tsx)
- Page-level `buildAppMetadata()` does not preserve these fields when overriding metadata
- OG images and Twitter card tags missing on some pages (e.g., `/en/rooms/`)

**Impact:**
- Poor social sharing previews (no images, incomplete branding)
- Reduced click-through from social platforms

**Root cause:**
- Next.js metadata merging behavior: page metadata overrides root layout metadata
- `buildAppMetadata()` doesn't include siteName/twitter.site in returned object

**Evidence:**
- Repo: `apps/brikette/src/app/_lib/metadata.ts:62-95` (no siteName, no twitter.site/creator)
- Production: Manual inspection shows missing twitter:card, og:image on some pages

#### Issue 5: SearchAction JSON-LD target URL is malformed

**Observed behavior:**
- Homepage SearchAction target: `https://hostel-positano.comassistance?q={search_term_string}`
- Missing `/` after domain, missing locale segment

**Impact:**
- Search action in rich results (if triggered) would result in 404

**Root cause:**
- URL construction error in JSON-LD component (likely string concatenation bug)

**Evidence:**
- Production: `curl -sS https://hostel-positano.com/en/ | grep -A5 SearchAction`

### P2: Operations / Reproducibility

#### Issue 6: Repo vs. production machine artifacts out of sync

**Observed behavior:**
- Production `llms.txt` is smaller/different from `apps/brikette/public/llms.txt`
- `apps/brikette/scripts/generate-public-seo.ts` exists but is not wired into build scripts
- Unclear which is source of truth: static public/ files or dynamic generation

**Impact:**
- Deployments may not be reproducible
- Manual updates to public/ files can be overwritten or forgotten

**Root cause:**
- Migration from static to generated artifacts incomplete
- No build step ensuring artifacts are current

**Evidence:**
- Repo: `apps/brikette/public/llms.txt` vs. production `https://hostel-positano.com/llms.txt`
- Repo: `apps/brikette/scripts/generate-public-seo.ts` not referenced in `package.json` scripts

## External Research (If needed)

Not required for this fact-find. All necessary information available in repo and production inspection.

## Questions

### Resolved

- Q: Where is the correct hreflang logic implemented?
  - A: `apps/brikette/src/utils/seo.ts:90-186` (`buildLinks()` function) with comprehensive test coverage
  - Evidence: `apps/brikette/src/test/utils/seo.test.ts:24-243` (30+ test cases)

- Q: Does the repo have slug translation infrastructure?
  - A: Yes, centralized in `SLUGS` map (slug-map.ts) and `GUIDE_SLUG_LOOKUP_BY_LANG` (guides/slugs.ts)
  - Evidence: Used by `buildLinks()` at seo.ts:141-145, 164-168

- Q: Are wrong alternate URLs actually serving duplicate content?
  - A: Yes, at least `/de/rooms/` resolves as 200 (separate page from `/de/zimmer/`)
  - Evidence: Production curl tests (see Reproduction Commands)

- Q: Is trailing-slash behavior server-enforced or app-enforced?
  - A: Server-enforced (HTTP 308 redirects observed, likely Cloudflare Pages config)
  - Evidence: `curl -sI https://hostel-positano.com/en/rooms` → `Location: /en/rooms/`

### Open (User Input Needed)

None. All questions resolved via repo audit and production inspection.

## Confidence Inputs (for /plan-feature)

### Implementation: 85%

**Why:**
- Correct logic already exists and is well-tested (`utils/seo.ts` with 30+ test cases)
- Fix is primarily about **calling the right function** rather than writing new logic
- Clear root cause identified in `metadata.ts:56-60`
- Next.js App Router metadata API is well-documented

**What's missing for ≥90%:**
- Spike: Verify Next.js metadata merging behavior (does alternates.languages fully override parent layout?)
- Spike: Confirm trailing-slash policy decision (keep with slashes? Change to without?)
- Integration test: Create test verifying page routes actually emit correct alternates in rendered HTML

**Evidence:**
- Existing test suite: `apps/brikette/src/test/utils/seo.test.ts`
- Production validation path: curl + grep for hreflang tags

### Approach: 80%

**Why:**
- Solution is straightforward: replace string replacement with slug map lookup
- Pattern already established in codebase (`buildLinks()` is the proven approach)
- No architectural changes required (stay within Next.js App Router metadata API)
- Trailing-slash decision is a policy choice, not a technical risk

**What's missing for ≥90%:**
- Decision: Trailing-slash policy (server config + canonical + sitemap must all align)
- Decision: API endpoints — implement or remove? (affects P0 Issue 3)
- Validation: Google Search Console review after deployment (confirm no duplicate content)
- Rollback plan: Document how to revert if indexing issues arise

**Tradeoffs:**
- Option A (implement APIs): More work upfront, enables future integrations, better machine trust
- Option B (remove API refs): Faster, lower risk, but removes future machine-readership opportunity
- Recommendation: Option B (remove) for quick P0 fix, defer API implementation to separate feature

### Impact: 70%

**Why:**
- Blast radius is large (500+ pages across 10+ languages)
- **NEW FINDING:** Issue 1a reveals 150+ duplicate URL pairs currently being served (English slugs in non-English locales)
- Fixing requires middleware changes + redirect strategy for all duplicate pairs
- Deployment to production requires coordination (Cloudflare Pages)
- Risk of introducing new SEO issues if not careful with redirects
- No staging environment mentioned (unclear if there's a pre-production validation gate)

**What's missing for ≥90%:**
- Validation plan: Structured pre-deployment checklist (sample 10-20 pages, all locales)
- Monitoring: Set up Google Search Console alerts for new indexing issues
- Rollback rehearsal: Document steps to revert deployment if duplicate content worsens
- Redirect strategy: Confirm whether to 301 wrong alternates → correct canonicals
- Staging deployment: Deploy to preview environment first, validate sample pages

**Current gaps:**
- No integration tests covering rendered HTML output
- No automated SEO regression suite (manual curl checks only)
- Unclear production validation process

**To raise to ≥90%:**
- Add integration test suite for metadata output (Playwright or similar)
- Create deployment checklist with validation steps
- Set up post-deployment monitoring (Search Console API integration or manual review schedule)

## Planning Constraints & Notes

### Must-follow patterns

- **Deep localization enforcement:** User-facing URLs MUST use locale-appropriate slugs at all levels
  - `/de/zimmer/` is correct; `/de/rooms/` must redirect (not serve content)
  - English slugs in non-English locales = duplicate content (150+ duplicate pairs currently)
  - Exception: Language-agnostic identifiers (UUIDs, room codes, brand names)
- **Use existing slug infrastructure:** All translations must come from `SLUGS` map and `GUIDE_SLUG_LOOKUP_BY_LANG`
- **Preserve `utils/seo.ts` as source of truth:** Do not duplicate slug translation logic; call `buildLinks()` directly or extract its core logic
- **Maintain test coverage:** Extend existing test suite (`seo.test.ts`) to cover `buildAppMetadata()` wrapper
- **Follow Next.js App Router conventions:** Use `generateMetadata` return type, respect metadata merging behavior

### Rollout/rollback expectations

- **Phased rollout preferred:** Deploy to preview environment first, validate sample pages
- **Validation gate:** Manual spot-check of 10-20 pages across all locales before production
- **Monitoring:** Check Google Search Console 1 week and 1 month post-deployment for indexing changes
- **Rollback plan:** Document git revert steps and redeployment process

### Observability expectations

- **Pre-deployment:** Automated test suite must cover hreflang output (unit + integration)
- **Post-deployment:**
  - Manual validation checklist (see Reproduction Commands for curl patterns)
  - Google Search Console monitoring for duplicate content warnings
  - Sitemap coverage report (ensure all localized URLs are indexed)

### Risk mitigation

- **Redirect strategy:** Add 301 redirects from wrong alternates (e.g., `/de/rooms/`) to correct canonicals (e.g., `/de/zimmer/`)
- **Gradual indexing:** Search engines may take 2-4 weeks to re-crawl and update indexes
- **Backwards compatibility:** Ensure old URLs continue to work (redirects, not 404s)

## Suggested Task Seeds (Non-binding)

1. **Fix hreflang alternates in `buildAppMetadata()`**
   - Replace string replacement logic with call to `buildLinks()` from `utils/seo.ts`
   - Extract `alternates.languages` map from `HtmlLinkDescriptor[]` output
   - Ensure x-default is preserved

2. **Add integration tests for `buildAppMetadata()`**
   - Test hreflang output for sample pages: home, rooms, guides, nested routes
   - Cover all supported languages
   - Verify correct slug translation for each route pattern

3. **Align canonical URL trailing-slash policy**
   - Decision: Keep trailing slashes (align with server redirects) OR remove (update server config)
   - Update `trimTrailingSlash()` usage or server redirect config accordingly
   - Update sitemap generation to match chosen policy

4. **Fix or remove broken API references**
   - Audit OpenAPI spec: remove `GET /api/rooms`, `POST /api/book` (or implement endpoints)
   - Fix JSON-LD ReserveAction target (remove or implement `/api/quote`)
   - Add validation test ensuring documented endpoints return expected status codes

5. **Complete social metadata coverage**
   - Update `buildAppMetadata()` to include `openGraph.siteName`, `twitter.site`, `twitter.creator`
   - Ensure OG images are provided for all indexable pages
   - Add default fallback image if page-specific image not available

6. **Fix SearchAction JSON-LD URL**
   - Locate SearchAction component/logic
   - Fix URL construction to include leading `/` and locale segment
   - Add test validating SearchAction target format

7. **Align repo and production machine artifacts**
   - Decision: Wire `generate-public-seo.ts` into build OR remove script and use static files
   - If using generator: Add to package.json scripts, run in pre-build hook
   - If using static: Update `public/llms.txt` to match production, document manual update process

8. **Create deployment validation checklist**
   - Document sample URLs to manually check (10-20 pages, all locales)
   - Create curl/grep patterns for automated spot-checks
   - Set up Google Search Console monitoring alerts

9. **Enforce deep localization: Redirect English slugs in non-English locales (Issue 1a)**
   - Update middleware to detect when non-localized slug is used in wrong locale
   - Add 301 redirect logic: `/de/rooms/` → `/de/zimmer/`, `/fr/deals/` → `/fr/offres/`, etc.
   - Apply to all slug keys: rooms, deals, careers, about, assistance, experiences, apartment, etc.
   - Preserve query params and hash fragments in redirects
   - Add middleware tests verifying redirect behavior for all language × route combinations
   - Ensure redirect chain doesn't exceed 2 hops (e.g., `/de/rooms` → `/de/rooms/` → `/de/zimmer/` is 3 hops; should be `/de/rooms` → `/de/zimmer/`)

## Planning Readiness

**Status:** Ready-for-planning

**Blocking items:** None

**Recommended next step:** Proceed to `/plan-feature` with the following task priorities:
- P0 (must-do): Tasks 1, 2, 3, 4 (hreflang, tests, canonical, API refs)
- P1 (should-do): Tasks 5, 6, 9 (social metadata, SearchAction, redirects)
- P2 (nice-to-have): Tasks 7, 8 (artifact sync, validation checklist)

**Confidence summary:**
- Implementation: 85% (high confidence, clear fix path)
- Approach: 80% (solid, needs trailing-slash policy decision)
- Impact: 75% (large blast radius, needs validation and monitoring plan)

**Overall readiness:** High. All root causes identified, correct logic exists, fix is primarily integration work. Primary risk is deployment validation — recommend phased rollout with manual spot-checks.

---

## Appendix: Reproduction Commands (Fast Checks)

```bash
# Robots + sitemap headers
curl -sS https://hostel-positano.com/robots.txt
curl -sS https://hostel-positano.com/sitemap.xml | head -n 40

# Canonical + alternates on a localized-slug page (look for /de/rooms etc)
curl -sS https://hostel-positano.com/en/rooms/ | head -n 40

# OpenAPI “machine layer” claims vs reality
curl -sS -I https://hostel-positano.com/api/rooms | sed -n '1,12p'
curl -sS -i -X POST https://hostel-positano.com/api/book -H 'Content-Type: application/json' -d '{}' | sed -n '1,20p'
```

