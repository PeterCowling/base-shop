# SEO Technical Audit: hostel-positano.com

**Original audit**: 2026-03-08
**Fact-checked**: 2026-03-12
**Site**: https://hostel-positano.com
**Scope**: Live technical/indexability review with Google-facing checks
**lp-seo phase**: Phase 4 (tech-audit)
**Business**: BRIK

## Executive Summary

The site has strong foundational SEO: `robots.txt` exists, the sitemap is live, canonical tags are present, hreflang coverage is broad across 18 locales, structured data is implemented, and Lighthouse SEO returns `100`.

Three issues remain open after fact-checking on 2026-03-12:

1. **24 dead `/directions/*` URLs in the sitemap** returning 404 — worse than originally reported (claimed redirects, actually dead links).
2. **i18n key leakage on some how-to-get-here pages** — confirmed on `naples-airport-positano-bus` (H1 is raw key, transport tokens visible). Other sections (experiences) now render correctly.
3. **Sparse `lastmod` coverage** — only 286 of 1,246 sitemap URLs (23%) include freshness signals.

Two original findings are now resolved:
- `/en/help` is fully server-rendered with title, canonical, meta description, and H1.
- `www` → non-www redirects work correctly; `/en/assistance` → `/en/help` redirects work. One gap: bare `/assistance` (no lang prefix) returns 404.

## What Looks Good

- `https://hostel-positano.com/robots.txt` is live and references the sitemap index.
- `https://hostel-positano.com/sitemap.xml` is live with 1,246 canonical-style URLs.
- The homepage has canonical, description, OG, Twitter, hreflang, and lodging schema.
- `/en/help` is fully server-rendered with title "Help centre with contact details and travel support - Hostel Brikette Positano", H1 "Help Centre", canonical, and meta description.
- `/en/experiences/cheap-eats-in-positano` renders correctly — H1 is "Cheap Eats in Positano: Budget Food Guide", all i18n keys resolved.
- `www.hostel-positano.com` correctly 301-redirects to `hostel-positano.com` (site-wide).
- `/en/assistance` correctly 301-redirects to `/en/help`.
- Lighthouse SEO score: `100`.

## Open Findings

### High

#### 1. Sitemap includes 24 dead `/directions/*` URLs (all 404)

**Severity**: High (was originally reported as redirects; actual status is worse — all 404)

**Evidence** (verified 2026-03-12)

- The sitemap contains 24 URLs under `https://hostel-positano.com/en/directions/*`.
- All 24 return **HTTP 404**, not 301.
- Example: `https://hostel-positano.com/en/directions/naples-to-positano-by-bus` → 404.
- Example: `https://hostel-positano.com/en/directions/positano-to-capri-by-ferry` → 404.
- Cloudflare `_redirects` has a rule `/directions/:slug → /en/how-to-get-here/:slug` but the sitemap emits `/en/directions/:slug` (language-prefixed), which does not match the redirect pattern.

**Root cause** (code)

- `apps/brikette/scripts/generate-public-seo.ts` line ~248: `listCanonicalSitemapPaths()` includes legacy direction paths from `how-to-get-here/routes.json`.
- These paths are emitted as `/en/directions/:slug` in the sitemap but the `_redirects` rule only catches `/directions/:slug` (without lang prefix).

**Impact**

- Google crawls 24 URLs that return 404, wasting crawl budget and generating coverage errors in Search Console.
- Sitemap trust degrades when Google repeatedly finds dead URLs.

**Action**

- Remove `/directions/*` URLs from sitemap generation in `generate-public-seo.ts`.
- Optionally add a redirect rule for `/en/directions/:slug` → `/en/how-to-get-here/:slug` to catch any remaining inbound links.

#### 2. i18n key leakage on how-to-get-here pages

**Severity**: High

**Evidence** (verified 2026-03-12)

On `https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus`:

- The H1 is the raw i18n key `naplesAirportPositanoBus` instead of a translated title.
- Visible text includes unresolved tokens:
  - `components.planChoice.title`
  - `components.planChoice.options.ferry`, `.trainBus`, `.transfer`
  - `transportNotice.title`
  - `transportNotice.items.buses`, `.trains`, `.ferries`, `.airlink`, `.driving`

**Scope**: Not all sections are affected. `/en/experiences/cheap-eats-in-positano` renders correctly with fully translated H1 and body. The issue appears specific to how-to-get-here pages that use `planChoice` and `transportNotice` component namespaces.

**Root cause** (code)

- `apps/brikette/src/utils/loadI18nNs.ts` preloads namespaces before render, but the `planChoice` and `transportNotice` component keys may be in a namespace that isn't included in the preload list for how-to-get-here pages.
- The keys resolve client-side after hydration but are missing during SSR.

**Impact**

- Google sees raw camelCase keys instead of topically relevant content for transport guide pages.
- Reduces relevance scoring for long-tail travel queries (e.g. "Naples airport to Positano bus").
- Users with JavaScript disabled see broken content.

**Action**

- Audit the i18n namespace preload configuration for how-to-get-here route templates.
- Ensure `planChoice` and `transportNotice` namespaces are loaded server-side.
- Verify fix with raw `curl` fetch, not browser rendering.
- Spot-check at least 3 other how-to-get-here pages after fix.

### Medium

#### 3. Sparse `lastmod` coverage in sitemap

**Severity**: Medium

**Evidence** (verified 2026-03-12)

- Total sitemap URLs: 1,246
- With `<lastmod>`: 286 (23%)
- Without `<lastmod>`: 960 (77%)

`lastmod` is only emitted for guide-detail pages that have a `lastUpdated` or `seo.lastUpdated` field in their content JSON.

**Impact**

- Google gets weak update signals for 77% of the site.
- Travel/logistics pages benefit from freshness hints (seasonal routes, schedule changes).

**Action**

- Emit `lastmod` for all pages where a reliable content update timestamp exists.
- For guide pages: ensure `lastUpdated` field is populated in content JSON during guide authoring/translation.
- For static pages (booking, rooms): use build timestamp or git commit date as fallback.

#### 4. Bare `/assistance` path returns 404

**Severity**: Medium

**Evidence** (verified 2026-03-12)

- `https://hostel-positano.com/en/assistance` → 301 → `/en/help` (correct)
- `https://hostel-positano.com/assistance` → **404** (no redirect)
- `https://www.hostel-positano.com/assistance` → 301 → `hostel-positano.com/assistance` → **404**

**Impact**

- If Google has indexed `hostel-positano.com/assistance` or inbound links point there, visitors hit a dead end.

**Action**

- Add `/assistance` → `/en/help` to `_redirects` file.

## Resolved Findings (since original audit)

### ~~1. `/en/help` broken SSR~~ — RESOLVED

**Original claim**: Page returned error shell with `__next_error__`, no title/canonical/description.

**Verified 2026-03-12**: Page is fully server-rendered with:
- Title: "Help centre with contact details and travel support - Hostel Brikette Positano"
- Canonical: `https://hostel-positano.com/en/help`
- Meta description present
- H1: "Help Centre"
- ~571 KB of full server-rendered content

### ~~2. `/en/dorms` in sitemap~~ — RESOLVED

**Original claim**: `/en/dorms` (redirecting URL) listed in sitemap.

**Verified 2026-03-12**: Bare `/en/dorms` is NOT in the sitemap. Eight `/en/dorms/*` sub-pages are listed and all return 200 — these are valid. The `/en/dorms` → `/en/book-dorm-bed` 301 redirect works correctly.

### ~~3. `cheap-eats-in-positano` i18n leakage~~ — RESOLVED

**Original claim**: H1 is raw key `cheapEats`.

**Verified 2026-03-12**: H1 is "Cheap Eats in Positano: Budget Food Guide" — fully translated. `cheapEats` only appears in serialized JSON hydration data, not in visible HTML.

### ~~4. www redirect consolidation~~ — RESOLVED

**Original claim**: Legacy www URLs not redirected.

**Verified 2026-03-12**: `www.hostel-positano.com` → `hostel-positano.com` via 301 (site-wide). Working correctly.

## Sitemap Inventory Snapshot (2026-03-12)

- Total URLs: 1,246
- With lastmod: 286 (23%)
- Without lastmod: 960 (77%)
- Dead `/directions/*` URLs: 24 (all 404)

## Data Gaps — Cannot Verify Without Credentials

| Data Source | What It Would Provide | Status |
|---|---|---|
| Google Search Console | Coverage report, indexing issues, canonical mismatches, query/page performance | No API access configured |
| URL Inspection API | Google's rendered view of specific pages (confirm i18n fix from Google's perspective) | Requires GSC API |
| PageSpeed Insights (authenticated) | Lab + field Core Web Vitals per page type | Rate-limited on 2026-03-08; re-run needed |
| CrUX (Chrome UX Report) | Real-user performance data by origin and URL | Via PSI API or BigQuery |

## Priority Order (Updated)

1. Remove 24 dead `/directions/*` URLs from sitemap generation.
2. Fix i18n namespace loading for how-to-get-here pages (SSR key leakage).
3. Add bare `/assistance` → `/en/help` redirect.
4. Expand `lastmod` coverage across guide content.
5. Re-run PageSpeed Insights API for CWV baseline.
6. Establish Google Search Console API access for coverage monitoring.

## Success Criteria For Next Audit

- Sitemap contains only canonical 200 URLs (zero 404s, zero redirects).
- No sampled how-to-get-here page exposes raw i18n keys in server-rendered HTML.
- `lastmod` coverage ≥ 60% of sitemap URLs.
- `/assistance` (bare) redirects to `/en/help`.
- PageSpeed field data available for homepage + booking page.

## Source URLs

- https://hostel-positano.com/robots.txt
- https://hostel-positano.com/sitemap_index.xml
- https://hostel-positano.com/sitemap.xml
- https://hostel-positano.com/en
- https://hostel-positano.com/en/help
- https://hostel-positano.com/en/experiences/cheap-eats-in-positano
- https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus
- https://hostel-positano.com/en/directions/naples-to-positano-by-bus (404)
- https://hostel-positano.com/assistance (404)
