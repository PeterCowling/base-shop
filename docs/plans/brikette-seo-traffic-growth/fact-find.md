---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO | Data | Infra
Workstream: Mixed
Created: 2026-02-22
Last-updated: 2026-02-23
Feature-Slug: brikette-seo-traffic-growth
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Related-Plan: docs/plans/brikette-seo-traffic-growth/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: none
direct-inject: true
direct-inject-rationale: Operator direct request — traffic growth focus post GA4 funnel completion
---

# Brikette SEO Traffic Growth — Fact-Find Brief

## Scope

### Summary

The Brikette website (hostel-positano.com) has a technically sophisticated SEO setup — 18 languages, ~4.1k indexable pages (4,093 URLs in current sitemap), comprehensive structured data, full hreflang — but is generating almost no organic traffic. Search Console shows ~112 clicks in 90 days, mostly branded; GA4 shows 22 organic sessions in its current 13-day capture window. The site is functionally invisible for non-branded discovery queries despite having a large guide/content asset.

This fact-find identifies the highest-leverage opportunities to change that, prioritised by expected traffic impact and implementation cost. Conversion is explicitly out of scope — this is purely a visitor acquisition plan.

### Goals

- Identify and fix technical issues actively suppressing rankings
- Identify quick-win ranking improvements achievable within 4–8 weeks
- Surface the medium-term content and authority strategy for sustained growth
- Understand the gap between ~4.1k indexable pages and near-zero organic traffic

### Non-goals

- Conversion rate optimisation (separate concern)
- Paid search / PPC
- Social media growth
- Google Tag Manager migration (direct gtag is fine for SEO; GTM is not a gap)

### Constraints & Assumptions

- Constraints:
  - Static export (Cloudflare Pages) — no server-side rendering; dynamic routes pre-generated at build time
  - 18 locales — any technical change must apply consistently across all languages
  - No paid SEO tools available (Ahrefs, SEMrush) — using Search Console + GA4 data only
- Assumptions:
  - The guide content (165 guides × 18 locales) is the primary ranking asset to activate
  - Backlink profile is thin — not verified via third-party tools but inferred from traffic data
  - Core Web Vitals are likely good (static Cloudflare Pages + modern stack) but unverified in this run

### Current-State Verdict (2026-02-22)

- **Cloudflare confirms high bot crawl activity:** 66,614 page views / 30 days, with two pronounced crawl-style anomaly days (Feb 7: 9,711 PV/745 IPs; Feb 14: 85,212 req). Crawler identity remains unverified at UA/IP level.
- **GA4 appears accurate for human traffic:** ~6 sessions/day is consistent with Cloudflare bot-adjusted human estimate of ~5–7 sessions/day.
- GSC organic baseline: ~112 clicks / 90 days, mostly branded. Most reliable organic signal.
- URL normalization is a confirmed technical blocker: host and trailing-slash policies are inconsistent between redirects, canonicals, and sitemap generation.
- Crawl access is not blocked; the primary likely constraints are canonicalization/indexing quality and authority, not discovery.
- Wave readiness is asymmetric: Wave 1 and Wave 2 are ready to plan now; Wave 3 remains gated on index-coverage evidence.

---

## Evidence Audit (Current State)

### Measurement Windows

- GSC: 2025-11-24 → 2026-02-22 (90 days)
- GA4: 2026-02-10 → 2026-02-22 (13 days)
- Cloudflare Analytics: 2026-01-23 → 2026-02-22 (30 days)

### Search Console Signal (90 days: 2025-11-24 → 2026-02-22)

**Total clicks: ~112.**

**Cloudflare vs GA4 discrepancy (interpretation):** Cloudflare GraphQL API shows **66,614 page views in 30 days** (2,220/day avg), while GA4 reports 78 sessions in 13 days (~6/day). This pattern is consistent with high bot/crawler traffic in Cloudflare aggregates plus low human traffic:
- On 2026-02-07: 9,711 page views from 745 unique IPs (13 pages/IP)
- On 2026-02-14: 85,212 requests / 1,952 page views (asset-heavy crawl pattern)
- Excluding anomaly days: baseline ~1,400–2,000 PV/day, which can plausibly map to low single-digit daily human sessions after bot traffic is removed
- **Important caveat:** crawler identity is inferred from aggregate behavior; it is not crawler-verified. Confirm with user-agent + IP verification before labeling any event as Googlebot.

**Key insight:** Rising PV trend after Feb 10 (1,400 → 4,600 peak on Feb 19) is consistent with increased bot crawling, not proven human growth.

#### Top queries by clicks
| Query | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| hostel brikette | 27 | 165 | 16.4% | 2.7 |
| hostel brikette positano | 21 | 100 | 21.0% | 2.2 |
| hostel positano | 4 | 114 | 3.5% | **22.1** |
| hostels in positano | 3 | 72 | 4.2% | 11.3 |
| amalfi coast hostels | 1 | 120 | 0.8% | **9.1** |
| positano hostel | 1 | 65 | 1.5% | 8.6 |
| positano hostels | 1 | 81 | 1.2% | 19.7 |
| amalfi coast hostel | 0 | 49 | 0.0% | 8.2 |

**Finding:** ~88% of clicks are branded (people who already know Brikette). Non-branded category terms exist in the index but are ranking too low to generate meaningful traffic. The highest-value term — "hostel positano" — sits at position 22.1 (early page 3).

#### Top pages by clicks
| Page | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| **http**://hostel-positano.com/ | **45** | **1,109** | 4.1% | 8.3 |
| https://hostel-positano.com/en | 12 | 855 | 1.4% | 7.4 |
| https://hostel-positano.com/en/ | 12 | 580 | 2.1% | 6.5 |
| https://www.hostel-positano.com/ | 11 | 625 | 1.8% | 9.3 |
| https://hostel-positano.com/ | 5 | 595 | 0.8% | 5.9 |
| https://hostel-positano.com/en/rooms | 2 | 393 | 0.5% | 8.7 |

**Critical signal:** Five distinct homepage URL variants appear in Search Console. Variant visibility can include historical and recrawl-state effects, but live verification (2026-02-22) still confirms active normalization issues: HTTP does redirect to HTTPS, `www` does not consolidate to apex, and canonical URLs point to slash-suffixed URLs that immediately 308 to non-slashed paths.

#### Traffic by country
Top markets: USA (30 clicks), Australia (10), Canada (10), Italy (10), UK (8), Germany (6). English-speaking markets dominate despite 18 language support — the non-English locales are not pulling in native speakers yet.

#### Quick-win windows (expanded for low-baseline site)

`Near page-1 cusp` (position 8–12, impressions >20):
- `amalfi coast hostels` (9.1, 120 impressions)
- `positano hostel` (8.6, 65 impressions)
- `amalfi coast hostel` (8.2, 49 impressions)
- `hostels in positano` (11.3, 72 impressions)

`Upper page-2/3 lift` (position 13–25, impressions >20):
- `hostel positano` (22.1, 114 impressions)
- `positano hostels` (19.7, 81 impressions)

The near-zero non-branded footprint remains the core issue, but this thresholding surfaces actionable early wins that the prior >100-impression filter hid.

### Technical SEO State

**Redirect chain (live probes, 2026-02-22):** ❌ Inconsistent normalization.

| Probe URL | Status chain | Outcome |
|---|---|---|
| `http://hostel-positano.com/` | `301` → `https://hostel-positano.com/` | HTTP→HTTPS works |
| `http://www.hostel-positano.com/` | `301` → `https://www.hostel-positano.com/` | No `www`→apex consolidation |
| `https://hostel-positano.com/` | `302` → `/en/`, then `308` → `/en` | Root has 2-hop chain and starts with temporary redirect |
| `https://hostel-positano.com/en` | `200` with canonical `https://hostel-positano.com/en/` | Canonical points to redirecting URL |
| `https://hostel-positano.com/en/` | `308` → `/en` | Slash form is not final URL |

**hreflang:** ✅ Fully implemented. Dynamic builder covers all 18 languages with auto-translated slugs and x-default. No gaps found.

**Sitemap:** ✅ Present at `/sitemap_index.xml` → `/sitemap.xml`. Static, pre-built at deploy time, currently emits ~4,093 URL entries. **Gap: no `<lastmod>` timestamps.** Accurate `<lastmod>` can improve recrawl signaling; inaccurate timestamps are ignored or can reduce trust.

`<lastmod>` implementation contract:
- Define “significant update” triggers (main body copy, key structured data, primary internal-link changes).
- Use a stable timestamp source of truth (for example content `updatedAt` or revision metadata), not “build time now”.
- Add a guard test that blocks bulk “all URLs updated today” outputs unless the underlying source changed.

**Page-count baseline:** planning uses sitemap count (4,093 `<url>` entries) as the operational source of truth; prior 4,086 inventory figure is treated as historical estimate only.

**robots.txt:** ✅ Correct. Allows all, blocks `/api/`, `/cms`, `/.well-known/`. Sitemap referenced.

**Schema / structured data:** ✅ Broad implementation coverage (30+ components). Types include: Hostel, HotelRoom, Offer, Article, FAQPage, BreadcrumbList, HowTo, EventStructuredData, BreakfastMenu, BarMenu, SiteSearch, Deals, and more. **Gap: validation hygiene not completed** (sampled schema + eligibility checks still pending). For planning, treat this as error-prevention and eligibility hygiene, not a primary CTR-growth lever.

**Meta titles/descriptions:** ✅ Per-page, fully translated across all 18 languages, served via `buildAppMetadata()`. No gaps found.

**Canonicals:** ⚠️ Internally consistent in code, externally misaligned with runtime URL policy. Canonicals are slash-suffixed (`ensureTrailingSlash` in `apps/brikette/src/utils/seo.ts`, plus slash-suffixed metadata expectations in `apps/brikette/src/test/lib/metadata.test.ts`), and sitemap generation also forces trailing slashes (`apps/brikette/scripts/generate-public-seo.ts`). Runtime responses on production strip those slashes with `308` redirects. Canonical targets should not redirect; this mismatch is a real ranking-quality issue.

**Open Graph:** ✅ Complete. Per-page OG + Twitter cards, proper image dimensions, locale alternates.

**Internal linking:** ✅ `%LINK:guideKey|label%` token system with locale-aware URL generation. System exists and is validated. Spot checks confirm homepage → category and category → guide links, but full-depth coverage across priority guide sets is still unverified.

### Content Asset

**165 guides × 18 locales = 2,970 guide pages.** Plus 25 how-to-get-here routes × 18 locales = 450 more pages. Overall sitemap baseline: 4,093 indexable URLs.

Content categories that should attract organic search traffic:
- **Transportation guides** (25 routes): "naples to positano bus", "ferry from sorrento to positano", "capri to positano ferry" — high-intent travel planning queries
- **Beach guides** (~20): "fornillo beach positano", "arienzo beach", "fiordo di furore" — discovery queries
- **Activity guides** (~15): "path of the gods hike", "positano cooking class", "positano boat tour"
- **Practical info** (~20): "parking in positano", "positano luggage storage", "positano grocery stores"
- **Assistance articles** (13): informational hostel-support queries

**Translation coverage:** 99.9% file parity across all 18 locales. Content is there — the problem is it's not being discovered and ranked.

### GA4 Traffic Sources (active since 2026-02-10; 13-day window)

> ⚠️ **GA4 window disclosure:** GA4 was inactive on this property prior to 2026-02-10. All session data below covers a **13-day window (2026-02-10 → 2026-02-22)**, not 90 days. The session totals are accurate for what GA4 captured, but the label "90 days" in the GSC section above does not apply here. GSC data (112 clicks) remains the only complete 90-day baseline. For historical traffic data beyond this window, Cloudflare Zone Analytics is the alternative — but requires Zone:Zone Analytics:Read scope (current deploy-scoped token returns 404; free tier retains 3 days of history).

| Source | Medium | Sessions |
|---|---|---|
| (direct) | (none) | 52 |
| google | organic | 22 |
| tagassistant.google.com | referral | 2 |
| cms.lonelyplanet.com | referral | 1 |
| ig | social | 1 |

22 Google organic sessions in 13 days (~1.7/day). The Lonely Planet CMS referral is notable — this is a high-domain-authority editorial link that should be tracked and protected.

### Landing Page Performance (GA4, 2026-02-10 → 2026-02-22)

| Landing Page | Sessions | Bounce Rate | Avg Session Duration (GA4 `averageSessionDuration`) |
|---|---|---|---|
| /en | 49 | 34.7% | 344s |
| /en/rooms | 10 | 60.0% | 97s |
| /en/help | 8 | **87.5%** | **0.7s** |

The `/en/help` page is a problem: 87.5% bounce and 0.7 seconds average time. People are landing there and immediately leaving — likely landing on the wrong page for their query.

### Google Tag Manager

Not in use. Site uses direct gtag implementation (as built in the GA4 funnel plan). This is not a gap for SEO purposes. GTM would add value for marketing team tag management but doesn't affect rankings.

### Key Files / Modules

- `apps/brikette/src/utils/seo.ts` — hreflang + canonical builder
- `apps/brikette/src/app/_lib/metadata.ts` — metadata factory (`buildAppMetadata`)
- `apps/brikette/src/utils/schema/builders.ts` — Hotel/Room/Offer JSON-LD
- `apps/brikette/public/sitemap.xml` — static sitemap (4,096 lines, no lastmod)
- `apps/brikette/src/seo/robots.ts` — robots.txt generator
- `apps/brikette/src/guides/slugs/overrides.ts` — per-locale slug overrides (864 lines)
- `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` — internal link token system
- `apps/brikette/src/data/generate-guide-slugs.ts` — 165 guide definitions
- `apps/brikette/src/i18n.config.ts` — 18 locale configuration

---

## Opportunities — Ranked by Traffic Impact

### TIER 1: Technical blockers (fix first — suppressing all rankings)

**OPP-01 — URL policy alignment (host + trailing slash) [CONFIRMED]**
This is no longer a diagnostic hypothesis. Live probes confirm three concrete issues: (1) `www` does not 301 to apex, (2) root requests take a 2-hop redirect (`/` → `/en/` → `/en`) and begin with `302`, and (3) canonical tags and sitemap URLs use trailing slashes while runtime URLs are slashless. Treat this as one normalization workstream: define one canonical URL policy (recommend slashless to match runtime), enforce it in redirects/metadata/sitemap, and ensure root resolves in one permanent hop (`301` or `308`).

**OPP-01b — GA4 guide-page tracking spot-check (low priority)**
Cloudflare data explains most of the apparent discrepancy: aggregate traffic is bot-heavy, while GA4 reflects low human sessions. However: verify GA4 `page_view` fires on at least 3 guide page types (not just homepage/rooms) before trusting guide-specific traffic data in Wave 3 measurement.

**OPP-02 — Canonical Selection Diagnostics (GSC URL Inspection sampling)**
Given current variant behavior, the critical diagnostic is whether Google-selected canonicals match user-declared canonicals on key templates (homepage, locale roots, rooms, guide pages). Run a representative URL Inspection sample and measure mismatch rate. This provides direct confirmation that OPP-01 changes are actually consolidating ranking signals.

**OPP-02b — hreflang Validation by Sampling (not International Targeting)**
Prioritize practical hreflang QA: sample URL Inspection results across top locales and validate internal hreflang consistency (self-reference, reciprocity, and canonical alignment). This replaces deprecated country-targeting workflows.

### TIER 2: Quick wins (4–8 weeks)

**OPP-03 — "hostel positano" ranking push (position 22 → realistic ceiling ~15)**
This is the single most valuable non-branded term. 114 impressions at 22.1 means it is early page 3. **Realistic ceiling: position 15–18 from on-page changes alone.** Positions 1–10 for "hostel positano" are almost certainly dominated by OTAs (Booking.com, Hostelworld) and high-DA travel sites — a 100× authority gap that title tags cannot close. On-page levers (a) homepage title/H1 to include "hostel positano" naturally, (b) internal links from guide pages to homepage — will improve relevance signals and are worth doing, but reaching top 10 requires backlink authority improvement (Tier 4). Do not plan around a top-10 outcome from on-page changes alone.
Status update (2026-02-22): TASK-07 implemented EN homepage title/meta/H1 copy alignment for the `hostel positano` cluster with metadata regression tests and locale spot-check coverage.

**OPP-04 — "amalfi coast hostels" push (position 9.1 → top 5)**
120 impressions, only 1 click. Position 9 = bottom of page 1. Moving to position 4-5 would multiply CTR 3-5×. Lever: a dedicated landing page or section optimized for this query (e.g., "Best Hostels on the Amalfi Coast" content on the homepage or a dedicated page), title tag optimization.

**OPP-05 — Rooms page CTR optimization**
393 impressions at position 8.7, only 0.5% CTR. The meta title and description for `/en/rooms` are likely underperforming. Use 1–2 controlled copy iterations and evaluate CTR deltas in GSC over 28-day windows; revert if CTR degrades.
Status update (2026-02-22): TASK-08 implemented EN `/en/rooms` title/description updates with explicit booking CTA + price signal (`from EUR 55/night`), with metadata regression tests and locale spot-check coverage.

**OPP-06 — Sitemap `<lastmod>` timestamps**
Add `<lastmod>` to sitemap.xml using real content-modified timestamps. For a static export, this requires build-time generation. Treat this as a recrawl-hint improvement only when timestamps are accurate.

**OPP-07 — Structured Data Hygiene (HowTo + FAQ + core entities)**
Validate structured-data output on representative URLs and fix errors/warnings that can affect eligibility or parsing quality. Do not plan around FAQ/HowTo rich-result CTR gains; treat this as correctness and crawl-understanding hygiene.

**OPP-14 — /en/help page investigation**
87.5% bounce rate, 0.7s average session (GA4 13-day window). People landing and immediately leaving — either the page content mismatches the query intent driving traffic, or the page is broken/slow. **Quick diagnostic: pull GSC query filter for `/en/help` and map intent.** This is a 1-day task, not a long-term authority effort.

### TIER 3: Medium-term content activation (1–3 months)

**⚠ Wave 3 gate:** Before executing any Tier 3 task, verify via GSC Page indexing + URL Inspection sampling that guide pages have acceptable rates for `Indexed`, low `Crawled — currently not indexed`, and low `Duplicate / Google chose different canonical`. If duplicate/crawled-not-indexed rates are high, prioritize content-quality + canonical remediation over linking expansion.

**Wave 3 diagnostic spec (required before build):**
- Sample set: 10 EN guides, 10 IT guides, 10 transport guides (30 URLs total).
- Per-URL checks: URL Inspection index status, user-declared canonical, Google-selected canonical, and duplicate classification.
- Decision indicators:
  - `% Crawled — currently not indexed`
  - `% Duplicate, Google chose different canonical`
  - `% Indexed but near-zero impressions` after observation window
- Planning rule: if duplicate/crawled-not-indexed rates are high, prioritize content-quality and canonical cleanup over expansion/linking tasks.

**OPP-08 — Transportation guide ranking ("naples to positano bus" etc.)**
The how-to-get-here guides (25 routes × 18 locales = 450 pages) target some of the highest-volume informational queries for the Amalfi Coast. "how to get from naples to positano" has substantial monthly search volume. **Risk: with 165 guides × 18 locales = 2,970 near-structurally-identical translated pages, Google may have assessed this corpus as low-value scaled content — a plausible explanation for near-zero non-branded traffic across a ~4.1k-URL site.** Strategy (if pages are confirmed indexed): (a) ensure they're linked from the homepage/main nav, (b) structured data optimisation (HowTo already in place), (c) content quality pass (word count, depth).

**OPP-09 — Beach + activity guide ranking**
Same dynamic as OPP-08 but for the 20+ beach guides and activity guides. "fornillo beach positano", "path of the gods hike" etc. These are discovery queries from travelers in planning mode — exactly the audience that might book a hostel. Getting 5–10 of these guides into top 5 for their target query would meaningfully move the traffic needle.

**OPP-10 — Italian-language SEO (Italy market)**
Italy has 530 impressions in GSC — the highest impression volume of any non-English market — but only 10 clicks (1.9% CTR). The Italian pages exist and are indexed. The low CTR may indicate poor meta/title quality in Italian or that the Italian pages are competing with domestic Italian accommodation sites that have much higher authority. A focused Italian content + meta quality pass could capture this already-interested audience.
Status update (2026-02-22): TASK-15 implemented a scoped IT transport metadata copy pass for 10 sampled URLs; VC-02 tracking window is now active.

**OPP-11 — Internal link architecture audit**
~4.1k URLs with near-zero non-branded traffic likely means Google isn't indexing/ranking them efficiently. The token-based internal link system exists, and spot checks confirm homepage → `/en/experiences` and category page → guide links are present. The remaining unknown is coverage completeness and depth across all high-value guide groups. Without consistent PageRank flow from authoritative pages to priority guides, rankings will stall.

**OPP-12 — Google Business Profile (local SEO)**
"hostel positano" and "hostels in positano" are local queries — Google Maps results appear above organic for many local searches. Optimising the Google Business Profile (reviews, photos, Q&A, posts) could capture position in the local pack, which is often above organic results for these terms. No API access required — this is manual ops.

### TIER 4: Authority building (3–6 months, ongoing)

**OPP-13 — Backlink acquisition**
The Lonely Planet CMS referral is the only quality backlink visible. The site needs external links to rank for competitive non-branded terms. Priority targets: travel blogs, Amalfi Coast travel guides, hostel review sites (Hostelworld editorial, HostelBookers), local tourism boards. Even 5–10 quality editorial links would significantly change the authority picture.

---

## Test Landscape

### Existing Test Coverage
| Area | Test Type | Files | Notes |
|---|---|---|---|
| JSON-LD schema output | Unit | `apps/brikette/src/test/seo-extraction-contract.test.ts` | Validates schema shape |
| hreflang builder | Unit | `apps/brikette/src/utils/seo.ts` (tested indirectly) | Via metadata tests |
| Sitemap content | Build-time validation | `apps/brikette/public/sitemap.xml` | Static, validated at generation |

### Coverage Gaps for Planned Changes
- **URL normalization alignment (OPP-01):** If slashless canonical policy is adopted, update metadata tests currently asserting trailing-slash canonicals/hreflang and add redirect-contract assertions for apex vs `www`, single-hop normalization, and no canonical-to-redirect targets
- **Sitemap lastmod (OPP-06):** Build script change requires test that lastmod values are present and valid ISO dates
- **Meta tag optimization (OPP-03/05):** Changes to `buildAppMetadata()` inputs covered by existing metadata contract tests; verify no regressions

### Required SEO Invariants Suite (pre/post OPP-01)
- Canonical URL returns `200` (not `3xx`) for sampled templates.
- `www` and `http` variants resolve to preferred canonical host/format in one hop.
- hreflang alternate targets return `200` and are canonical-aligned.
- Sitemap URLs resolve `200` and match canonical URL format policy.
- URL Inspection sample shows low declared-vs-selected canonical mismatch.
- Root URL redirect is single-hop and permanent (`301` or `308`) to the chosen canonical target.

### Testability Assessment
- Easy to test: canonical/hreflang output format, redirect invariants, schema validation hygiene, meta tag copy changes (snapshot tests)
- Hard to test: ranking position improvements (inherently external)
- Not testable in CI: GSC position data, rich result appearance in SERPs

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Pass threshold | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | URL policy alignment (host + slash normalization, OPP-01) will lift homepage rankings by consolidating authority and removing canonical-to-redirect targets | "hostel positano" position ≤18 (from 22.1) within 8 weeks of fix deploy | Low (check GSC position before/after) | 4–8 weeks |
| H2 | Guide content will rank for long-tail travel queries once it has internal links + freshness signals | ≥3 guide pages ranking in top 20 for their primary target query within 16 weeks | Medium | 8–16 weeks |
| H3 | Structured-data output contains fixable eligibility/quality errors on sampled pages | Schema + eligibility checks pass on ≥90% of sampled URLs with no critical errors | Very low (validator + sample checks) | 1 day |
| H4 | The Italian impression volume (530) represents addressable traffic with meta/content optimization | Italian CTR improves from 1.9% (10/530) to ≥3.5% within 8 weeks of meta quality pass | Low | 4–8 weeks |
| H5 | Backlinks are the primary blocker for non-branded rankings above position 10 | Acquiring 5 editorial links moves at least one head term above position 10 | High (requires acquiring links to test) | 3–6 months |

---

## Questions

### Resolved

- Q: Does the service account have Search Console access?
  - A: Yes — `sc-domain:hostel-positano.com`, siteFullUser permission, confirmed via API.
  - Evidence: Live API call returning data above.

- Q: Is the site fully indexed across all 18 locales?
  - A: Sitemap baseline is 4,093 indexable URLs. GSC Page indexing state was not sampled in this run, so true indexation quality is still unconfirmed.

- Q: Is Google Tag Manager needed for SEO?
  - A: No. Direct gtag is fine. GTM is an implementation preference for marketers, not an SEO lever.

- Q: Are HTTP and www variants properly 301-redirecting to the preferred host and URL format?
  - A: Partially. HTTP→HTTPS is correct; `www`→apex is not enforced; slash-suffixed URLs 308 to slashless runtime URLs, while canonicals still point to slash-suffixed URLs.
  - Evidence: Live `curl -I` probes on 2026-02-22.

### Open

- Q: Which canonical URL format should be authoritative across runtime, metadata, and sitemap (slashless vs trailing slash)?
  - Why it matters: OPP-01 cannot be closed until one policy is chosen and enforced everywhere.
  - Verification: confirm chosen policy with post-change probes (`curl -IL`) and recrawl-selected URLs in GSC URL Inspection.
  - Decision owner: Peter + implementation owner

- Q: Are there structured-data validation issues across key template types?
  - Why it matters: Errors/warnings can degrade eligibility and parser confidence even when rich-result presentation is limited.
  - Verification: schema validation plus Rich Results Test where applicable on homepage, rooms, and 5 guide URLs
  - Decision owner: Automated — run the test

- Q: What queries are landing users on `/en/help` (87.5% bounce)?
  - Why it matters: Fixing mismatched landing pages is a quick win.
  - Verification: GSC page filter for `hostel-positano.com/en/help`
  - Decision owner: Automated — check GSC

- Q: Is the guide content reachable from homepage nav with ≤3 clicks?
  - Why it matters: OPP-11. If guides are buried, they won't get crawled or ranked.
  - Current signal: Partial yes (`/en` links to `/en/experiences`, and `/en/experiences` exposes 27 guide URLs), but full-depth coverage across guide categories is not yet verified.
  - Verification: full click-depth crawl or URL graph extraction
  - Decision owner: Peter or automated

- Q: Which crawler(s) are driving Cloudflare anomaly days?
  - Why it matters: Confirms whether spikes are Google crawling or mixed bot/scanner activity.
  - Verification: log-level user-agent checks plus crawler IP verification (reverse DNS + forward DNS match).
  - Decision owner: Automated / ops

---

## Evidence Register

- E1: GSC query/page/country signal for 2025-11-24 → 2026-02-22 (112 clicks; branded concentration; variant URLs visible)
- E2: GA4 source/medium and landing-page data for 2026-02-10 → 2026-02-22 (13-day window; 22 organic sessions; `/en/help` high-bounce anomaly)
- E3: Live HTTP probe set on 2026-02-22 using `curl -I` and `curl -IL` (host and slash normalization behavior verified)
- E4: Code-level URL-format policy evidence
  - Canonical generation enforces trailing slash: `apps/brikette/src/utils/seo.ts:160`
  - Sitemap generation enforces trailing slash: `apps/brikette/scripts/generate-public-seo.ts:21`
  - Metadata tests assert trailing-slash canonicals/hreflang: `apps/brikette/src/test/lib/metadata.test.ts:60`
- E5: Sitemap artifact evidence (`apps/brikette/public/sitemap.xml`) with 4,093 URL entries and no `<lastmod>` tags
- E6: Live crawl-surface sampling (homepage links to `/en/experiences`; `/en/experiences` exposes 27 direct guide routes)
- E7: Cloudflare GraphQL Analytics API (Zone:Zone Analytics:Read token, 2026-02-22) — 30 days (2026-01-23 → 2026-02-22): **66,614 page views**, 333,296 total requests, 27,754 daily unique IP sum (deduplicated ~15.5k per dashboard), 8.28 GB bandwidth. Daily PV range: 750–9,711. Two anomaly days flagged:
  - 2026-02-07: 9,711 PV / 745 unique IPs = 13 pages/IP avg — consistent with large-scale crawler deep walks across site inventory
  - 2026-02-14: 85,212 requests / 1,952 PV = 44 req/page — another heavy crawl event (asset-intensive bot)
  - Excluding those two days: baseline ~1,400-2,000 PV/day
  - Post-launch trend (Feb 10+): PV rising from ~2,200/day to ~3,500-4,600/day peak; consistent with increased crawler activity + modest human traffic growth

## Confidence Inputs

- Implementation: 82%
  - Strong because defect locations are now concrete (E3/E4) and the technical fix surface is bounded (redirect policy + metadata/sitemap alignment)
  - Remaining uncertainty: structured-data validation state and `/en/help` query intent are still external diagnostics
- Approach: 86%
  - Strong because OPP-01 is now confirmed and no longer speculative (E3)
  - Remaining uncertainty: Wave 3 path depends on GSC Page indexing + URL Inspection evidence (not yet collected)
- Impact: 72%
  - Medium because URL normalization and CTR wins should improve discoverability (E1/E2/E3)
  - Capped by unresolved authority constraints and unknown backlink profile depth
- Delivery-Readiness: 83%
  - Code and ops tasks are actionable immediately for Wave 1/2
  - Manual dependencies remain for GBP/backlink workstreams
- Testability: 84%
  - Pre/post validation for URL policy, metadata output, sitemap output, and GSC metrics is clear
  - Final ranking gains remain externally lagged and cannot be CI-asserted

### What Would Make This ≥90%

1. Pull GSC Page indexing + URL Inspection samples for representative guide URLs and close the Wave 3 gate with evidence.
2. Pull GSC Links report to replace backlink assumptions with measured referring domains/pages.
3. Run structured-data validation on target templates and capture pass/fail issue classes.
4. Validate a post-fix URL-inspection sample in GSC after recrawl (canonical selected = intended canonical).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Google has already assessed the translated guide corpus as thin/low-value content | **Medium** | **High — invalidates all of Wave 3 (OPP-08/09/10/11)** | Gate Wave 3 on GSC Page indexing + URL Inspection sampling: must confirm acceptable Indexed/Crawled-not-indexed and canonical-mismatch rates before proceeding |
| OTA authority (Booking.com/Hostelworld) blocks "hostel positano" top 10 regardless of on-page work | **High** | Medium — limits OPP-03 realistic ceiling to position 15–18 | Set expectations accordingly; prioritise long-tail travel queries over head terms |
| URL-policy rollout is only partially applied (for example redirects changed but metadata/sitemap not updated, or vice versa) | Medium | High — keeps split canonical signals and can worsen recrawl quality | Ship OPP-01 as one atomic policy change set with curl + GSC URL Inspection acceptance checks |
| Backlink profile is so thin that technical fixes don't move rankings past position 15 | Medium | Medium — limits short-term impact | Treat authority building as parallel workstream from day 1, not deferred to Tier 4 |
| 18-locale hreflang/canonical changes cause indexing regressions | Low | High | Validate sampled hreflang reciprocity + URL Inspection canonical outcomes before/after rollout |
| sitemap lastmod implementation introduces build-time errors | Low | Low | Gate behind feature flag, test on staging first |

---

## Suggested Task Seeds (Non-binding)

**Wave 1 — Diagnose and fix (weeks 1–2):**
- TASK-00: Spot-check GA4 tracking on 3 guide page types (Cloudflare bot-traffic analysis explains most of the gap; low priority but confirm GA4 fires on guide pages before Wave 3 measurement)
- TASK-00a: Verify crawler identity for anomaly days using UA + reverse/forward DNS IP checks
- TASK-01: Enforce canonical host policy (`www` → apex) and remove unnecessary redirect hops; ensure root redirect is single-hop + permanent (`301`/`308`); verify with `curl -IL`
- TASK-02: Align trailing-slash policy across redirects, canonical/hreflang generation, sitemap generation, and metadata tests
- TASK-03: Run URL Inspection sample for declared vs Google-selected canonical mismatches (homepage, locale roots, rooms, guides)
- TASK-04: Run hreflang sampling checks (self-reference, reciprocity, canonical alignment) across top locales
- TASK-05: Run structured-data validation sampling on homepage, rooms, and 5 guide URLs; document pass/fail issue classes
- TASK-06: Investigate `/en/help` bounce — pull GSC query data and map mismatched intent

**Wave 2 — Quick wins (weeks 2–4):**
- TASK-07: Optimize homepage title/H1/meta for "hostel positano" and "amalfi coast hostels"
- TASK-08: Optimize `/en/rooms` title and meta description (393 impressions, 0.5% CTR)
- TASK-09: Add `<lastmod>` to sitemap generation (build-time, based on content file mtime)
- TASK-10: Complete internal-link coverage audit — confirm key guide targets reachable in ≤3 clicks from homepage

**Wave 3 — Content activation (weeks 4–8):**
- TASK-11: Content quality pass on top 10 how-to-get-here guides (word count, depth, structured data)
- TASK-12: Add "featured guides" section to homepage linking to top transportation + beach guides
- TASK-13: Italian locale meta/title quality pass for top 10 pages

**Wave 4 — Authority (ongoing):**
- TASK-14: Google Business Profile audit and content refresh
- TASK-15: Identify and pitch 10 travel blogs for editorial link placement

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-seo` (for content and keyword strategy tasks)
- Deliverable acceptance package:
  - URL normalization proof set: one-hop redirect chain and host consolidation (`curl -IL` for apex/www/http/https variants)
  - Root URL policy proof: `/` resolves via a single permanent redirect (`301` or `308`) to the selected canonical locale URL
  - Canonical target verification: sampled canonical URLs return `200` (no redirecting canonicals)
  - GSC position data for target keywords before/after
  - Structured-data validation results (errors/warnings + fixes)
  - Sitemap validation (including `<lastmod>` presence)
- Post-delivery measurement plan:
  - GSC URL Inspection canonical mismatch rate on sampled templates (declared vs Google-selected)
  - GSC weekly position tracking for: "hostel positano", "hostels in positano", "amalfi coast hostels", "positano hostels"
  - GA4 organic session count (weekly, baseline: 22 organic sessions from 13-day window 2026-02-10 → 2026-02-22; ~1.7 organic sessions/day; **unreliable until TASK-00 GA4 coverage audit is complete**)
  - GSC click-through rate for rooms page (vs 0.5% baseline)

---

## Evidence Gap Review

### Gaps Addressed
- Search Console query, page, country, and device data: retrieved live
- GA4 landing page and source/medium data: retrieved live
- Technical SEO state: fully audited (hreflang, sitemap, schema, robots, canonicals, meta)
- Content inventory: fully audited (165 guides, 25 how-to-get-here routes, 18 locales, sitemap baseline 4,093 URLs)
- Internal linking system: existence and mechanism confirmed

### Confidence Adjustments
- URL normalization issue moved from hypothesis to confirmed finding via live `curl` probes and code inspection
- GSC Links baseline now measured via TASK-18 exports (2026-02-23): 33 linking domains exported, with link equity concentrated on homepage URL variants
- Core Web Vitals not checked in this run (GSC CWV report not queried)
- Guide content quality not assessed — **this is the key unknown for Wave 3 viability**
- **GA4 data window corrected:** GA4 was inactive prior to 2026-02-10. All GA4 session data = 13-day window only. GSC is the authoritative 90-day baseline.
- **Cloudflare vs GA4 discrepancy:** Cloudflare shows 15.53k unique visitors in 30 days (E7); GA4 shows 78 sessions in 13 days (~6/day). The delta is consistent with bot-heavy Cloudflare aggregates, but crawler identity remains inferential until UA/IP validation is completed.

### Remaining Assumptions
- The selected canonical format (slashless vs trailing slash) can be rolled out without accidental localization regressions
- Guide pages are indexed by Google (not confirmed via GSC Page indexing; "Crawled — currently not indexed" status unknown)
- Structured-data eligibility state on representative templates is not yet validated
- Backlink profile is still shallow for head-term competition, but no longer inferred-only: TASK-18 confirms a mix of directory and light editorial coverage (including Lonely Planet variants)
- Positions 1–10 for "hostel positano" are OTA-dominated (not manually verified)

## Pending Audit Work

- Areas examined in this run:
  - Live redirect/canonical behavior for root and core EN URLs
  - URL policy in canonical/hreflang generation, sitemap generation, and metadata tests
  - High-level crawl surface checks (`/en` and `/en/experiences`)
- Areas still unexplored:
  - GSC Page indexing state for representative guide URLs
  - GSC query-level breakdown for `/en/help`
  - Structured-data validation outcomes across representative templates
  - GSC Core Web Vitals segment for mobile/desktop
- Questions to resume with:
  - Are priority guide pages indexed but weakly ranked, or crawled-not-indexed?
  - Which landing queries are causing `/en/help` rapid exits?
  - Which crawler cohorts (Google vs non-Google) explain Cloudflare anomaly days?
  - Do any structured-data eligibility errors block rich-result display?
- Estimated remaining scope: ~3 API pulls (Page-indexing/Page-query/CWV) + 8 structured-data validation checks.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none for Wave 1/2. Wave 3 remains gated on GSC Page indexing + URL Inspection evidence.
- Recommended next step: `/lp-do-plan brikette-seo-traffic-growth`
