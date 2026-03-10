---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: SEO | Data | Infra
Workstream: Mixed
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: brikette-seo-api-optimization-loop
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Related-Plan: docs/plans/brikette-seo-api-optimization-loop/plan.md
Dispatch-ID: IDEA-DISPATCH-20260225000000-0001
---

# Brikette SEO API Optimization Loop — Fact-Find Brief

## Scope

### Summary

Hostel-positano.com has 4,093 sitemap URLs across 18 locales, significant translated content investment, and confirmed API access to GSC, GA4, and Cloudflare. Yet 100% of sampled guide URLs (30/30 in TASK-11) are "URL is unknown to Google" — not a ranking problem but a discovery failure. Phase A technical fixes (canonical normalization, www redirect, internal link surfacing) are complete. Phase B is stalled at 45% confidence waiting passively for an indexation signal.

This plan replaces passive waiting with an instrumented optimization loop: reusable API scripts, an every-other-day monitoring cadence, a structured data completeness fix (Article.datePublished), and a programmatic recrawl submission strategy — all using zero-cost first-party APIs with credentials already provisioned.

### Goals

- Build reusable GSC scripts for URL Inspection batch runs and Search Analytics pulls (mirrors the established `ga4-run-report.ts` pattern)
- Fix `Article.datePublished` gap — the data exists in guide content files and component hierarchy but is not wired into structured data output
- Establish an every-other-day monitoring cadence with a rotating URL sample and explicit trigger conditions
- Determine Google Indexing API eligibility for travel guide content and, if eligible, automate recrawl submission on content updates
- Give Phase B (TASK-13 content quality, TASK-17 backlinks) a data signal to act on rather than waiting weeks for passive crawl evidence

### Non-goals

- Paid SEO tooling (Ahrefs, SEMrush)
- Rewriting guide content (that is TASK-13, gated on indexation evidence this plan will produce)
- Backlink outreach execution (TASK-17/21)
- Core Web Vitals improvements
- Changes to hreflang or canonical infrastructure (complete in Phase A)

### Constraints & Assumptions

- Constraints:
  - Static export (Cloudflare Pages) — no server-side code at request time
  - GSC URL Inspection API: 2,000 URL inspections/day per property (confirmed quota)
  - No paid Cloudflare analytics add-on — per-URL crawl bot data not available; aggregate-only on free tier
  - Google Indexing API: restricted to content with `NewsArticle`/`JobPosting` schema by Google policy — travel guide eligibility uncertain, requires verification
- Assumptions:
  - GSC service account (`ga4-automation-bot@brikette-web.iam.gserviceaccount.com`) has `webmasters.readonly` scope confirmed active (used in TASK-03a/03b/11)
  - GA4 service account key at `.secrets/ga4/brikette-web-2b73459e229a.json` is the auth basis for both GA4 and GSC (same SA, different scope)
  - `lastUpdated` field is the correct date source for `Article.datePublished` — it is semantically the content publication/revision date
  - The discovery failure is primarily a PageRank/authority flow problem + internal link depth gap, not a content quality bar problem (content quality is the secondary hypothesis — TASK-13 addresses it once discovery improves)

---

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/scripts/generate-public-seo.ts` — build-time sitemap + robots.txt generation; already emits scoped `<lastmod>` for 681 eligible guide URLs (TASK-12)
- `apps/brikette/src/components/seo/ArticleStructuredData.tsx` — renders `<script type="application/ld+json">` for Article schema; called from guide templates without `datePublished`
- `scripts/src/brikette/ga4-run-report.ts` — established JWT-auth pattern for Google API calls; the template for new GSC scripts
- `scripts/src/brikette/cloudflare-analytics-client.ts` — Cloudflare GraphQL Analytics API; aggregate page view data (no per-URL crawl detail on free tier)

### Key Modules / Files

- `apps/brikette/src/utils/seo/jsonld/article.ts` — Article JSON-LD builder; `datePublished` is optional and conditionally included when passed
- `apps/brikette/src/app/[lang]/experiences/[slug]/_GuideSeoTemplate.tsx` — extracts `lastUpdated` from guide content (lines 187–195), threads it to visible `<time>` display but NOT to `ArticleStructuredData`
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` — second call site for `ArticleStructuredData` without `datePublished` (line 183)
- `packages/seo/src/metadata/buildAlternates.ts` — hreflang + canonical builder; slashless policy confirmed correct post-TASK-02
- `apps/brikette/src/routing/routeInventory.ts` — `listAppRouterUrls()` generates all 4,093 sitemap URL paths across 18 locales
- `memory/data-access.md` — credentials map for GSC, GA4, Cloudflare

### Patterns & Conventions Observed

- **JWT auth pattern (GA4 SA reuse):** `scripts/src/brikette/ga4-run-report.ts` proves the pattern for all Google API calls — no SDK, self-signed JWT with RS256, key from `.secrets/ga4/brikette-web-2b73459e229a.json`. New GSC scripts should replicate this pattern exactly. Evidence: `ga4-run-report.ts` lines 1–60.
- **Script output format:** Cloudflare and GA4 scripts write JSON/CSV to `docs/business-os/strategy/BRIK/data/`. New GSC monitoring scripts should write to `docs/plans/brikette-seo-api-optimization-loop/monitoring/` for plan-local artifact management.
- **Conditional JSON-LD emission:** `article.ts` builder only emits fields that are explicitly passed — `datePublished?: string` is structurally correct, just never called with the value. Evidence: `article.ts` line 42.
- **Guide lastUpdated extraction:** Already implemented in `_GuideSeoTemplate.tsx` lines 187–195 for visible display; `generate-public-seo.ts` uses it for sitemap `<lastmod>`. The wiring to structured data is the missing link.

### Data & Contracts

- **GSC URL Inspection API:** `POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect` — returns `indexStatusResult.coverageState`, `indexStatusResult.lastCrawlTime`, `indexStatusResult.googleCanonical`, `indexStatusResult.userCanonical`. Property: `sc-domain:hostel-positano.com`.
- **GSC Search Analytics API:** `POST https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Ahostel-positano.com/searchAnalytics/query` — returns clicks/impressions/CTR/position by page and/or query dimensions.
- **GA4 Data API:** `POST https://analyticsdata.googleapis.com/v1beta/properties/474488225:runReport` — organic landing-page funnel, bounce rates, locale segmentation. Custom dimension `language_preference` already configured.
- **Cloudflare GraphQL:** `https://api.cloudflare.com/client/v4/graphql` — `httpRequests1dGroups` for aggregate page views. No per-URL bot breakdown on free tier. Useful for anomaly detection only.
- **Article JSON-LD:** Schema emits `@type: Article` with `headline`, `description` always; `datePublished`, `dateModified`, `image`, `author`, `publisher` all optional/conditional.
- **Guide content JSON shape:** `src/locales/{lang}/guides/content/{key}.json` — top-level `lastUpdated?: string` (ISO date string) takes precedence over nested `seo.lastUpdated?.string`. 681/4,093 URLs have authoritative date fields (TASK-19 matrix).

### Dependency & Impact Map

- **Upstream:** guide content JSON files → `lastUpdated` field → feeds both sitemap lastmod (TASK-12 done) and proposed Article.datePublished fix
- **Downstream from Article fix:** Google structured data validators will see complete Article entities; no runtime dependency (static export, JSON-LD is baked into HTML)
- **Downstream from GSC scripts:** monitoring cadence outputs JSON to `monitoring/` directory; feeds Phase B TASK-13 unlock decision
- **Blast radius of Article.datePublished fix:** limited to `ArticleStructuredData.tsx` and two call sites in guide templates; no cascade to routing, metadata, or test infrastructure beyond the structured data schema tests
- **Blast radius of new GSC scripts:** additive only; no changes to app code; scripts run outside the Next.js build pipeline

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Discovery failure is primarily internal-link/PageRank-flow caused — guides receive no authority from external links and many are still unreachable from the homepage graph | TASK-10 link audit (done), TASK-14 shipped | Low — monitor GSC for guide indexation improvement 4–6 weeks after TASK-14 | 4–6 weeks |
| H2 | Article.datePublished absence is a structured data hygiene gap — once guide pages are discovered and crawled, undated Article entities may rank lower for freshness-sensitive queries and are ineligible for some rich result types; this fix does not accelerate discovery (datePublished is read post-crawl) but improves quality once indexed | Schema audit TASK-05 (done) | Low — fix is fast; measure GSC ranking position changes for guide pages 4+ weeks after indexation begins | 4–8 weeks post-indexation |
| H3 | Monitoring every other day will catch indexation transitions (unknown → crawled → indexed) within days, enabling faster course-correction than passive observation | GSC API availability (confirmed) | Near-zero — script produces data immediately | Immediate |
| H4 | Sitemap submission via API (not just static file) will trigger faster Googlebot recrawl after content changes | GSC Sitemaps API availability | Low — API call is free | 1–2 weeks |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | 30/30 guides unknown to Google; TASK-14 added 6–8 homepage guide links (~10–15% of 55 unreachable guides now reachable via homepage); majority of unreachable guides unchanged | TASK-11, TASK-10 link audit, TASK-14 build evidence | High — discovery failure confirmed; TASK-14 impact is modest (~12% of link gap) |
| H2 | 5 critical Article.datePublished missing findings; `datePublished` omitted from all Article JSON-LD | TASK-05 schema scan, code investigation | High — gap confirmed in source |
| H3 | GSC URL Inspection API working (used in TASK-03a/03b/11); SA has webmasters.readonly scope | Prior API calls in task artifacts | High — proven API access |
| H4 | TASK-03b: `sitemap: []` returned for all 8 inspected URLs — Google not using sitemap | TASK-03b results | Medium — suggests sitemap not being actively followed |

#### Recommended Validation Approach

- **Quick probes (immediate):** Run GSC URL Inspection on the same 30-URL sample from TASK-11 every other day for 4 weeks — look for first transition from `URL is unknown to Google`
- **Structured tests (H2 — post-discovery hygiene):** After Article.datePublished fix deploys, run Rich Results Test on 5 guide URLs; confirm `datePublished` field appears in structured data output. H2 ranking impact is only measurable after guide pages are indexed — compare GSC position for guide pages 4 weeks post-indexation vs pre-fix baseline
- **Deferred validation:** TASK-13 (content quality pass) remains gated on indexation evidence — only promote once ≥3 guides in the TASK-11 sample transition to `Crawled - currently not indexed` or `Indexed`

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Article schema builder | Unit | `apps/brikette/src/test/seo-extraction-contract.test.ts` | Validates schema output structure; datePublished not currently asserted (not emitted) |
| Sitemap lastmod | Contract | `apps/brikette/src/test/lib/generate-public-seo.lastmod.test.ts` | TC-12/TC-13; lastmod emission and bulk-today guard |
| Metadata canonical | Unit | `apps/brikette/src/test/lib/metadata.test.ts` | Slashless canonical assertion (updated in TASK-02) |
| SEO extraction | Contract | `apps/brikette/src/test/seo-extraction-contract.test.ts` | Schema types and required fields |

#### Coverage Gaps

- No test asserts that `datePublished` is present in Article JSON-LD output for guide pages
- No test asserts that `dateModified` is present when a guide has `lastUpdated`
- GSC monitoring scripts will be non-tested scripts (CLI tools, not library code) — validate via dry-run output inspection rather than unit tests

#### Recommended Test Approach

- Add assertion to `seo-extraction-contract.test.ts`: for guide pages with `lastUpdated` present in content, Article JSON-LD output must include `datePublished` equal to the `lastUpdated` value
- Unit test for `ArticleStructuredData` component: when `datePublished` prop is provided, rendered JSON-LD must include it; when absent, must omit it (preserves existing conditional behavior)

### Recent Git History (Targeted)

- `apps/brikette/scripts/generate-public-seo.ts` — TASK-12: scoped lastmod emission for guide-detail URLs (2026-02-22); TASK-02: slashless canonical normalisation
- `apps/brikette/src/components/landing/FeaturedGuidesSection.tsx` — TASK-14: homepage featured guides section added (2026-02-22) — first step toward reducing orphan guide count
- `apps/brikette/public/sitemap.xml` — regenerated in TASK-12 with 681 `<lastmod>` entries (2026-02-22)
- `packages/seo/src/metadata/buildAlternates.ts` — TASK-02: slashless alternates (2026-02-22)

---

## Questions

### Resolved

- **Q: Does the GSC service account have the right scope for URL Inspection and Search Analytics?**
  - A: Yes. `ga4-automation-bot@brikette-web.iam.gserviceaccount.com` with scope `https://www.googleapis.com/auth/webmasters.readonly` — confirmed working in TASK-03a, TASK-03b, TASK-11.
  - Evidence: `memory/data-access.md` Search Console section; task artifacts.

- **Q: Do we need new credentials for GSC scripts?**
  - A: No. The same service account key file (`.secrets/ga4/brikette-web-2b73459e229a.json`) is used for both GA4 and GSC. Scope is passed at token request time. No new credentials needed.
  - Evidence: `memory/data-access.md` Search Console auth pattern.

- **Q: Why are 100% of sampled guide URLs unknown to Google despite active Googlebot crawling?**
  - A: Three compounding causes: (1) External authority is entirely concentrated on homepage variants (153 linking domains → homepage; zero deep links to guide pages per TASK-18). PageRank does not flow to guide pages. (2) Internal link depth — 55/119 EN guide URLs were unreachable from homepage in ≤3 clicks pre-TASK-14 (TASK-10 audit). TASK-14 partially addressed this. (3) Google may be spending crawl budget on already-indexed core pages rather than exploring the graph. The Cloudflare aggregate shows ~12,000+ bot PVs/month, but this appears concentrated on a small fraction of URLs.
  - Evidence: TASK-10 link depth audit, TASK-11 indexation results, TASK-18 backlink baseline.

- **Q: Why does GSC URL Inspection return `sitemap: []` for all inspected URLs including indexed ones?**
  - A: Most likely because the static sitemap file (`public/sitemap.xml`) is submitted to GSC but Google is discovering pages via crawl rather than sitemap queue. `sitemap: []` means Google did not attribute the discovery of that URL to a sitemap ping. This is not blocking but confirms that sitemap submission alone is not driving discovery. The Sitemaps API (`webmasters/v3/sites/:site/sitemaps`) can be used to re-ping the sitemap programmatically after content updates.
  - Evidence: TASK-03b results (sitemap field empty for 8/8 URLs).

- **Q: Is the Google Indexing API applicable to travel guide pages?**
  - A: Likely not by default. Google's Indexing API documentation restricts programmatic indexing requests to pages that include `NewsArticle` or `JobPosting` schema. Travel guide pages use `Article` + `HowTo` schema. However, some evidence suggests the API may work for `Article` pages in practice. The correct approach is: (1) attempt a test submission on 5 guide URLs via the API; (2) check GSC URL Inspection post-submission for coverage state change; (3) if it works, integrate into the post-content-update pipeline. Risk is low (worst case: API returns 403 or submission is ignored).
  - Evidence: Google Indexing API docs (requires `NewsArticle` or `JobPosting`); `Article` edge case documented in external reports.

- **Q: How many URLs should the every-other-day monitoring sample cover?**
  - A: 20–30 URLs per run is the right balance. This gives sufficient statistical coverage across URL classes and locales without burning API quota (2,000/day limit means 20-30 URLs leaves ample room). The sample should rotate through: 5 EN experiences guides, 5 EN transport guides, 5 IT transport guides, 5 high-priority pages (homepage, rooms, experiences category, help category). The TASK-11 30-URL seed list should be included in every run for continuity. Rotation math: 28 URLs × 3.5 runs/week = ~98 URLs/week; full 4,093-URL coverage ~42 weeks; diagnostic value comes from the seed list, not full coverage.
  - Evidence: TASK-11 sample design (30 URLs, 3 buckets of 10); GSC quota constraints.

- **Q: What triggers TASK-13 (content quality pass) promotion from deferred?**
  - A: The explicit unlock condition is: ≥3 URLs in the TASK-11 sample transitioning from `URL is unknown to Google` to `Crawled - currently not indexed` or better. This is now measurable via the monitoring loop this plan builds. Previously this was waiting on a passive signal; the loop makes it active.
  - Evidence: TASK-13 deferred status in plan v2; TASK-11 result.

- **Q: Should Article.dateModified be fixed alongside datePublished?**
  - A: Yes. Both fields should be threaded together. `dateModified` maps to the same `lastUpdated` source as `datePublished` for initial implementation (we have no separate "original publish date" vs "last modified" distinction in the content schema currently). If the content file has `lastUpdated`, both `datePublished` and `dateModified` should be emitted with the same value. Future: if a separate `publishedAt` field is added to guide content, `datePublished` can be split.
  - Evidence: `article.ts` builder interface shows both `datePublished?: string` and `dateModified?: string` as independent optional fields.

### Open (Operator Input Required)

None. All scoping and routing decisions are resolvable from documented constraints and evidence above.

---

## Confidence Inputs

- **Implementation: 82%**
  - Evidence: GSC API patterns are proven (TASK-03a/03b/11 show exact API shapes and auth flow). The Article.datePublished fix is a 2-file prop-threading change. GA4 SA reuse for GSC is confirmed working. New scripts follow established `ga4-run-report.ts` pattern.
  - What raises to ≥90%: Completing a dry-run GSC script call and confirming output format before building the full monitoring cadence.

- **Approach: 78%**
  - Evidence: Root cause is identified (discovery/authority failure, not content quality). The intervention order is well-sequenced: monitoring loop first (passive), Article fix second (structural), recrawl submission third (active). The every-other-day cadence matches the operator's stated frequency and is operationally lightweight.
  - What raises to ≥90%: First monitoring run showing at least some URLs transitioning from "unknown" to "crawled not indexed" — confirms the loop produces actionable data.

- **Impact: 75%**
  - Evidence: If discovery is the blocker (confirmed by TASK-11), fixing the PageRank flow to guide pages and improving structured data completeness will eventually unlock indexation. The 4–6 week lag to see Google's response is the main uncertainty.
  - What raises to ≥90%: First GSC monitoring run post-TASK-14 showing guide URL transitions — quantifies progress rate and informs whether additional interventions are needed.

- **Delivery-Readiness: 85%**
  - Evidence: All credentials provisioned. Script pattern established. No external approvals needed. Owner is clear (Peter / operator). Output is local files — no deployment gating.
  - What raises to ≥90%: Confirming Indexing API test submission eligibility.

- **Testability: 72%**
  - Evidence: Article.datePublished fix is testable via unit test against existing schema test infrastructure. GSC scripts are CLI tools — testable via dry-run against real API but not unit-testable in isolation.
  - What raises to ≥90%: Adding a mock/fixture test for the GSC batch script using a captured API response.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Content quality is the primary blocker (not discovery) — TASK-13 would need to run before monitoring shows improvement | Medium | Medium — delays Phase B unlock by 4–8 weeks | Monitoring cadence detects this signal fast: if URLs transition to "crawled not indexed" (not indexed), content quality is the issue; if still "unknown", discovery is |
| Google Indexing API rejects travel guide submissions (non-news content) | Medium | Low — worst case: no-op, fall back to sitemap ping | Test with 5 URLs first; if rejected, use Sitemaps API re-ping instead |
| GSC URL Inspection API quota saturation if scope expands | Low | Low — 2,000/day limit is generous for a 20-30 URL daily sample | Keep sample ≤50 URLs/run; track running count if multiple operators run scripts |
| Article.datePublished date values are absent for 59% of guides (only 681/4,093 have authoritative lastUpdated) | Medium | Low — only guides with authoritative dates will emit the field; no regression for others | Conditional emission already in the builder — only pass `datePublished` when `lastUpdated` is non-null |
| TASK-14 featured guides impact is too small — 6-8 homepage links cover ~12% of the 55 unreachable EN guides; ~46+ EN guides remain unreachable from homepage | Medium | Medium — internal link gap persists; discovery still slow | Monitoring loop detects stagnation; 6-week trigger fires `/lp-do-replan` for internal linking pass on category pages |
| Manual cadence degrades — operator skips monitoring runs, signal gap accumulates | Medium | Medium — TASK-13 unlock signal delayed; Phase B stalls longer | Scripts should be runnable in <30 seconds via a single shell wrapper; document exact command in monitoring-log.md |

---

## Planning Constraints & Notes

- **Must-follow patterns:**
  - New GSC scripts must use the same JWT auth pattern as `ga4-run-report.ts` — no new SDK dependencies, no gcloud CLI dependency
  - Script output files go to `docs/plans/brikette-seo-api-optimization-loop/monitoring/` — not to `apps/` or `public/`
  - `ArticleStructuredData` must remain backward-compatible: `datePublished` is optional; existing call sites without the prop must continue working without change
  - All new tests use the existing Jest config for `@apps/brikette`
- **Rollout/rollback expectations:**
  - Article.datePublished fix: standard deploy + sitemap regeneration; rollback = revert prop threading; no infrastructure dependencies
  - GSC scripts: additive CLI tools; no rollback needed (don't modify app code)
  - Monitoring cadence: write-only artifacts to `monitoring/` directory; no rollback concern
- **Observability expectations:**
  - Primary metric: GSC URL Inspection coverage state transitions per URL class over time
  - Secondary: GSC Search Analytics impressions for guide pages (any impressions = indexed)
  - Cadence: every other day; write JSON output to monitoring directory; note transitions in a running `monitoring-log.md`
  - Execution: manual CLI runs by operator using the scripts built in this plan (no automated job in Phase 1); scripts should be runnable in <30 seconds via a single shell wrapper
  - Rotation math: 28 URLs per run × 3.5 runs/week = ~98 URLs checked per week; full 4,093-URL sweep takes ~42 weeks; the TASK-11 30-URL seed list should be included in every run (highest diagnostic value) with remaining slots rotating through the full URL space by category
  - Stagnation escalation: if 0 URLs transition out of "URL is unknown to Google" after 6 continuous weeks of monitoring, trigger `/lp-do-replan` for a more aggressive internal linking pass (extend guide surfacing from homepage to category pages; analyse Cloudflare aggregate logs for Googlebot crawl activity anomalies)

---

## Suggested Task Seeds (Non-binding)

1. **TASK-A: Build `gsc-url-inspection-batch.ts`** — reusable script; takes a JSON list of URLs, runs URL Inspection API against each, writes results to `monitoring/run-<date>.json`; uses existing GA4 SA auth pattern
2. **TASK-B: Build `gsc-search-analytics.ts`** — reusable script; pulls clicks/impressions/position by page (and optionally by query) for a configurable date range; writes results to `monitoring/analytics-<date>.json`
3. **TASK-C: Fix Article.datePublished wiring** — thread `lastUpdated` from guide template into `ArticleStructuredData` at two call sites; add `dateModified` at same time; add contract test asserting `datePublished` present when `lastUpdated` non-null
4. **TASK-D: Initialize monitoring cadence** — run TASK-A and TASK-B scripts as a baseline (T+0); write `monitoring-log.md` with initial state; define rotating 28-URL seed list covering all URL classes
5. **TASK-E: Investigate Indexing API eligibility** — submit 5 guide URLs via Indexing API; check GSC URL Inspection 48h later for coverage state change; if works, document as recrawl submission pattern
6. **TASK-F: Sitemaps API re-ping automation** — call `webmasters/v3/sites/:site/sitemaps` to programmatically re-notify Google of the sitemap after content deploys; wire into build pipeline or run manually post-deploy

---

## Execution Routing Packet

- **Primary execution skill:** lp-do-build
- **Supporting skills:** lp-seo (for content quality signals interpretation)
- **Deliverable acceptance package:**
  - `scripts/src/brikette/gsc-url-inspection-batch.ts` — working, documented, auth pattern matches GA4 script
  - `scripts/src/brikette/gsc-search-analytics.ts` — working, documented
  - `ArticleStructuredData.tsx` and call sites updated; contract test added and passing
  - `docs/plans/brikette-seo-api-optimization-loop/monitoring/` directory initialized with baseline run
  - `docs/plans/brikette-seo-api-optimization-loop/monitoring-log.md` with T+0 baseline state
- **Post-delivery measurement plan:**
  - Every other day: run GSC batch inspection on 28-URL rotating sample; log transitions
  - Every other day: run GSC search analytics pull; log any first-impression appearances for guide URLs
  - Week 4 checkpoint: if ≥3 guide URLs have transitioned out of "unknown" state → promote TASK-13
  - Week 6 checkpoint: if guide URLs are "crawled not indexed" without improvement → content quality is the blocker, escalate TASK-13 immediately

---

## Evidence Gap Review

### Gaps Addressed

1. **GSC credentials**: confirmed SA has `webmasters.readonly` scope; same key file as GA4; no new provisioning needed
2. **Article.datePublished root cause**: traced from schema builder through component tree to exact call sites missing the prop; confirmed data is available in component scope
3. **Cloudflare analytics scope**: confirmed free tier gives aggregate-only page views; per-URL crawl bot data not available; Cloudflare analytics not useful for guide-level monitoring (GSC is the right tool)
4. **Sitemap discovery**: TASK-03b `sitemap: []` result explains why static sitemap submission alone is insufficient; Sitemaps API re-ping is the addressable intervention
5. **Why guide pages are unknown to Google**: root cause identified as PageRank concentration on homepage + internal link depth gap — not a robots.txt or crawl accessibility problem

### Confidence Adjustments

- Implementation raised to 82% (from 75% prior to investigation) — all auth patterns confirmed, call sites identified, no new dependencies needed
- Approach held at 78% — root cause is clear but Google's response timeline is uncertain
- Delivery-Readiness at 85% — all inputs available; no external blockers

### Remaining Assumptions

- `lastUpdated` values in guide content files are editorially accurate (not generated timestamps). TASK-12 bulk-today guard provides structural protection; this assumption is behavioral.
- Google will begin indexing guides within 4–8 weeks of TASK-14 (featured guides) and Article schema fix. If not, the monitoring loop will detect stagnation and trigger TASK-13.
- The GSC URL Inspection API rate limit (2,000/day) is sufficient for the proposed 28-URL every-other-day cadence. Confirmed: 28 URLs per run is <2% of daily quota.

---

## Planning Readiness

- **Status: Ready-for-planning**
- Blocking items: none
- Recommended next step: `/lp-do-plan brikette-seo-api-optimization-loop --auto`
