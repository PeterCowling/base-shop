# Domain: SEO Technical Readiness

**Goal**: Verify that search engines can discover, crawl, index, and understand the site.
**Required output schema**: `{ domain: "seo", status: "pass|fail|warn", checks: [{ id: "<S1>", status: "pass|fail|warn", evidence: "<string>" }] }`

## Checks

- **S1: Sitemap exists and is valid**
  - **What:** Fetch `/sitemap.xml` (or sitemap path from baseline); parse and validate structure
  - **Pass condition:** Sitemap returns 200, valid XML, includes expected URLs (home, key landing pages, legal pages)
  - **Evidence:** Sitemap URL + XML snippet showing valid structure + URL count
  - **Fail condition:** 404, malformed XML, empty sitemap, missing critical URLs

- **S2: Robots.txt allows indexing**
  - **What:** Fetch `/robots.txt`; verify `Disallow: /` is NOT present for production (allowed for staging)
  - **Pass condition:** robots.txt allows crawling of public pages; sitemap referenced in robots.txt
  - **Evidence:** robots.txt content snippet
  - **Fail condition:** Production site blocks all crawlers, sitemap not referenced

- **S3: Canonical tags are correct**
  - **What:** Inspect key pages (home, landing pages, legal pages) for `<link rel="canonical">` tags
  - **Pass condition:** Canonical tag present, points to self or correct primary URL, no conflicting canonicals
  - **Evidence:** HTML snippet showing canonical tag for 2–3 sample pages
  - **Fail condition:** Missing canonical, points to wrong URL, conflicts with alternate tags

- **S4: Meta tags present and unique**
  - **What:** Inspect key pages for `<title>` and `<meta name="description">` tags
  - **Pass condition:** Title and description present, unique per page, within length limits (title ≤60 chars, description ≤160 chars)
  - **Evidence:** Title + description text for 2–3 sample pages
  - **Fail condition:** Missing tags, duplicate across pages, exceeds length limits

- **S5: Structured data (schema.org) present**
  - **What:** Inspect key pages for JSON-LD structured data (e.g., Organization, WebSite, Product, LocalBusiness)
  - **Pass condition:** At least one valid schema.org type present on home page; validates via Google Structured Data Testing Tool or schema.org validator
  - **Evidence:** JSON-LD snippet + validation result
  - **Fail condition:** No structured data, invalid JSON, schema errors
  - **Note:** Skip if baseline explicitly states "no structured data required"

- **S6: Index status check (production only)**
  - **What:** For production sites, check Google Search Console for indexing status
  - **Pass condition:** Key pages indexed; no "Excluded" errors for primary pages
  - **Evidence:** Search Console screenshot showing indexed page count
  - **Fail condition:** Pages excluded, indexing errors, no pages indexed after >7 days live
  - **Note:** Skip for staging or sites <7 days old

## Domain Pass Criteria

All applicable checks pass. One failure is a warning (not a blocker) unless it affects primary conversion pages.
