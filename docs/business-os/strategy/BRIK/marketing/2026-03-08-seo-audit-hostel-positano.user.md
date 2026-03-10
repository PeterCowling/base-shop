# SEO Audit: hostel-positano.com

**Generated**: 2026-03-08
**Site**: https://hostel-positano.com
**Scope**: Live technical/indexability review with Google-facing checks

## Executive Summary

The site has strong foundational SEO on many live content pages: `robots.txt` exists, the sitemap is live, canonical tags are present, hreflang coverage is broad, structured data is implemented, and a local Lighthouse SEO run returned `100`.

The main problems are not "basic SEO missing". They are:

1. A broken `/en/help` hub page that is linked in navigation and listed in the sitemap but returns an error-shell document instead of a clean server-rendered page.
2. Sitemap pollution from redirecting and legacy alias URLs, including `/en/dorms` and 24 `/directions/*` aliases.
3. Server-rendered body leakage on article pages, where untranslated/internal keys such as `cheapEats`, `components.planChoice.title`, and `transportNotice.title` appear in the fetched HTML.
4. Weak Google consolidation signals: public search results still surface legacy `www` and `/assistance` URLs.

## What Looks Good

- `https://hostel-positano.com/robots.txt` is live and references the sitemap index.
- `https://hostel-positano.com/sitemap.xml` is live and contains current canonical-style URLs.
- The homepage has canonical, description, OG, Twitter, hreflang, and lodging schema.
- Sample content pages such as:
  - `https://hostel-positano.com/en/experiences/cheap-eats-in-positano`
  - `https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus`
  return `200`, include descriptive titles and meta descriptions, self canonicals, 19 hreflang links, and schema types including `Article`, `BreadcrumbList`, `WebPage`, `WebSite`, and `Organization`.
- A local run of `pnpm -s tsx scripts/seo-audit.ts https://hostel-positano.com` returned:
  - SEO score: `100`
  - Recommendations: none

## Findings

### Critical

#### 1. `/en/help` is broken as a server-rendered SEO page

**Evidence**

- `https://hostel-positano.com/en/help` returns `HTTP 200`.
- The raw fetched HTML contains:
  - `__next_error__`
  - `NEXT_REDIRECT;replace;/en/help;308;`
- The raw fetched HTML does **not** contain:
  - `<title>`
  - canonical link
  - meta description
- Browser rendering still leaves the page without a title/primary heading in the observed document state, while the page exposes mostly header/footer navigation.
- The URL is still listed in the sitemap.

**Impact**

- Google can fetch a successful response for a page that is not a clean, fully rendered help index.
- Internal linking points to a weak hub instead of a usable topical index.
- This can suppress indexing and internal PageRank flow across the 34 `/en/help/*` child articles.

**Action**

- Fix `/en/help` so the initial server response is the actual help hub page, not an error/redirect shell.
- Ensure raw HTML includes:
  - a stable title
  - meta description
  - self canonical
  - visible H1/body content
- Revalidate after deployment with raw `curl` output, not only in a browser.

### High

#### 2. The sitemap includes non-canonical/redirecting URLs

**Evidence**

- Total sitemap URLs: `3981`
- URLs with `lastmod`: `682`
- URLs without `lastmod`: `3299`
- The sitemap includes:
  - `https://hostel-positano.com/en/dorms`
  - 24 legacy aliases under `https://hostel-positano.com/directions/*`
- `https://hostel-positano.com/en/dorms` returns `301` to `https://hostel-positano.com/en/book-dorm-bed`.
- The legacy `/directions/*` URLs resolve to `/en/how-to-get-here/*` destinations rather than representing final canonical targets.

**Impact**

- Crawl budget is spent on redirects and aliases instead of final pages.
- Canonical clarity is weakened.
- Sitemap trust drops when Google repeatedly finds non-final URLs inside it.

**Action**

- Remove redirecting URLs from the sitemap.
- Restrict sitemap output to final `200` canonical URLs only.
- Keep legacy aliases live if needed, but exclude them from sitemap generation.

#### 3. Content pages leak untranslated/internal keys in server-rendered HTML

**Evidence**

On raw fetched HTML for live article pages:

- `https://hostel-positano.com/en/experiences/cheap-eats-in-positano`
- `https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus`

the server response contains internal text tokens including:

- `cheapEats`
- `components.planChoice.title`
- `components.planChoice.options.ferry`
- `components.planChoice.options.trainBus`
- `components.planChoice.options.transfer`
- `transportNotice.title`
- `transportNotice.items.airlink`

For `cheap-eats-in-positano`, the raw H1 extracted from HTML is `cheapEats`, while the browser-observed hydrated page title/heading is correct.

**Impact**

- Google’s first-pass HTML may contain weaker topical signals than the hydrated page.
- This creates a mismatch between what users eventually see and what crawlers first receive.
- It may reduce relevance scoring, especially for long-tail guide pages.

**Action**

- Fix SSR/i18n resolution so final human-readable copy is present in the initial HTML.
- Audit all route templates that rely on tokenized content blocks.
- Recheck at least:
  - one `/en/experiences/*` article
  - one `/en/help/*` article
  - one `/en/how-to-get-here/*` article

### Medium

#### 4. Google still appears to know old IA/domain variants

**Evidence**

Public Google search results sampled on 2026-03-08 still surfaced:

- legacy `www.hostel-positano.com` URLs
- legacy `/assistance/...` paths

alongside current `/help/...` and `/how-to-get-here/...` pages.

**Impact**

- Link equity and indexing signals may still be split across old and new URL families.
- Search snippets may continue showing outdated IA until consolidation is completed.

**Action**

- Confirm all old `www` and `/assistance/*` URLs 301 directly to their final non-`www` replacements.
- Confirm the final destination self-canonicalizes.
- Submit recrawl requests for representative migrated pages after redirect validation.

#### 5. Sitemap freshness data is sparse for a content-heavy site

**Evidence**

- `3981` total URLs
- only `682` include `lastmod`
- `3299` have no `lastmod`

**Impact**

- Google gets weak update signals for most of the site.
- Large content sets benefit from accurate freshness hints, especially for travel/logistics pages.

**Action**

- Emit `lastmod` for all pages where a reliable content update timestamp exists.
- Prioritize guides, help articles, and transport pages first.

## Section Inventory Snapshot

- Locales: mostly `219-220` URLs each across 18 locales plus root/legacy entries
- English sections:
  - `/en/experiences/*`: `127`
  - `/en/help/*`: `34`
  - `/en/how-to-get-here/*`: `32`
  - `/en/dorms/*`: `8`

This is a large SEO surface. Crawl discipline matters more here than on a small hostel brochure site.

## Google / API Check

### Public Google-facing checks completed

- Google search result sampling for live/legacy URL families
- Public crawlable assets:
  - `robots.txt`
  - `sitemap_index.xml`
  - `sitemap.xml`
- Public page fetch validation with raw HTML and browser-rendered checks

### API result

The public PageSpeed Insights endpoint was reachable but returned:

- `429 RESOURCE_EXHAUSTED`
- quota exceeded for anonymous daily queries

That means PageSpeed API integration is valid in principle, but this audit could not get fresh PSI field/lab data from the anonymous endpoint on 2026-03-08.

### Recommended next API layer

If credentials are available, the next pass should pull:

1. Google Search Console
   - coverage
   - pages with indexing issues
   - queries/pages/countries
   - canonical selection mismatches
2. URL Inspection API samples
   - `/en/help`
   - `/en/book-dorm-bed`
   - one `/en/help/*` article
   - one `/en/experiences/*` article
   - one `/en/how-to-get-here/*` article
3. PageSpeed / CrUX
   - homepage
   - booking page
   - one help article
   - one experience article

## Priority Order

1. Fix `/en/help` server-rendered output.
2. Remove redirecting/legacy URLs from the sitemap.
3. Fix SSR/i18n token leakage in article HTML.
4. Reconfirm legacy redirect mapping for `www` and `/assistance/*`.
5. Expand `lastmod` coverage.

## Success Criteria For The Next Audit

- `/en/help` raw HTML contains title, description, canonical, H1, and visible help-index content.
- Sitemap contains only canonical `200` URLs.
- No sampled article page exposes untranslated/internal keys in initial HTML.
- Google search results stop surfacing legacy `/assistance` URLs over time.
- Search Console shows clean indexing for the core hubs:
  - `/en`
  - `/en/help`
  - `/en/how-to-get-here`
  - `/en/experiences`

## Source URLs

- https://hostel-positano.com/robots.txt
- https://hostel-positano.com/sitemap_index.xml
- https://hostel-positano.com/sitemap.xml
- https://hostel-positano.com/en
- https://hostel-positano.com/en/help
- https://hostel-positano.com/en/help/arriving-by-car
- https://hostel-positano.com/en/experiences/cheap-eats-in-positano
- https://hostel-positano.com/en/how-to-get-here/naples-airport-positano-bus
- https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://hostel-positano.com/en&strategy=mobile
