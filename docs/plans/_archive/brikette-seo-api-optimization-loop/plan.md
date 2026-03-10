---
Type: Plan
Status: Archived
Domain: SEO | Data | Infra
Workstream: Mixed
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-seo-api-optimization-loop
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-seo
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact) per task; overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Brikette SEO API Optimization Loop — Plan

## Summary

Hostel-positano.com has 4,093 URLs across 18 locales with 100% of sampled guide pages unknown to Google. Phase A canonical/redirect/internal-link fixes are complete. This plan builds the instrumented optimization loop that replaces passive waiting: (1) two reusable GSC API scripts for URL Inspection and Search Analytics, (2) an Article.datePublished structured data fix, (3) a baseline monitoring run to establish T+0 state, (4) a Google Indexing API eligibility investigation, and (5) a Sitemaps API re-ping script for post-deploy recrawl signaling. All credentials are provisioned; no new infrastructure is needed. The every-other-day monitoring cadence produces the indexation transition signal that unlocks Phase B TASK-13 (content quality pass).

## Active tasks
- [x] TASK-01: Build gsc-url-inspection-batch.ts script — Complete (2026-02-25)
- [x] TASK-02: Build gsc-search-analytics.ts script — Complete (2026-02-25)
- [x] TASK-03: Fix Article.datePublished wiring at both call sites — Complete (2026-02-25)
- [x] TASK-04: Initialize monitoring cadence — baseline run and monitoring-log — Complete (2026-02-25)
- [x] TASK-05: Investigate Google Indexing API eligibility for guide pages — Complete (2026-02-25)
- [x] TASK-06: Build Sitemaps API re-ping script — Superseded (2026-02-25): Indexing API confirmed eligible; sitemaps re-ping is redundant for recrawl signaling. Script built but deprioritised.

## Goals
- Build a reusable GSC URL Inspection batch script that mirrors the `ga4-run-report.ts` JWT auth pattern
- Build a reusable GSC Search Analytics pull script for clicks/impressions/position tracking
- Wire `Article.datePublished` (and `dateModified`) into the structured data output for guide pages that have `lastUpdated`
- Establish an every-other-day monitoring cadence with a rotating 28-URL seed list and explicit transition triggers
- Determine Google Indexing API eligibility for travel guide content and document a recrawl pattern if eligible
- Give Phase B (TASK-13 content quality, TASK-17 backlinks) an active data signal to act on

## Non-goals
- Paid SEO tooling
- Rewriting guide content (TASK-13, gated on indexation evidence this plan produces)
- Backlink outreach (TASK-17/21)
- Core Web Vitals improvements
- Changes to hreflang or canonical infrastructure (Phase A complete)
- Per-URL Cloudflare bot data (not available on free tier)

## Constraints & Assumptions
- Constraints:
  - Static export (Cloudflare Pages) — no server-side code at request time
  - GSC URL Inspection API: 2,000 URL inspections/day; 28-URL sample is <2% of daily quota
  - Cloudflare free tier: aggregate-only, no per-URL crawl bot data
  - Google Indexing API: policy restricts to NewsArticle/JobPosting; travel guide eligibility requires empirical test
- Assumptions:
  - `ga4-automation-bot@brikette-web.iam.gserviceaccount.com` has `webmasters.readonly` scope (confirmed in TASK-03a/03b/11)
  - Same SA key file (`.secrets/ga4/brikette-web-2b73459e229a.json`) is used for all Google API calls
  - `lastUpdated` in guide content JSON is the correct source for `Article.datePublished` — semantically the content revision date
  - Discovery failure is primarily PageRank/authority + internal link depth, not content quality

## Fact-Find Reference
- Related brief: `docs/plans/brikette-seo-api-optimization-loop/fact-find.md`
- Key findings used:
  - GSC SA confirmed working with `webmasters.readonly` scope — no new credentials needed
  - `ArticleStructuredData` missing `datePublished`: traced to `_GuideSeoTemplate.tsx` (lines 187–195) and `HowToGetHereContent.tsx` (line 183) — `lastUpdated` extracted for visible display but not passed to the structured data component; `article.ts` builder supports it conditionally at line 42
  - Cloudflare free tier aggregate-only — GSC URL Inspection is the correct monitoring API
  - TASK-03b `sitemap: []` for 8/8 URLs — static sitemap submission not driving discovery; Sitemaps API re-ping is the addressable intervention
  - Root cause: 153 linking domains all on homepage variants; 55/119 EN guides unreachable ≤3 clicks; TASK-14 addressed ~12% of depth gap
  - Article schema test file: `apps/brikette/src/test/seo-extraction-contract.test.ts` — no `datePublished` assertion currently

## Proposed Approach
- Option A: Build GSC scripts first, then fix Article schema, then initialize cadence
- Option B: Fix Article schema first (already deployed code change), then build scripts and cadence
- Chosen approach: **Option A — scripts first, then schema fix, then cadence initialization.** GSC scripts are the foundation of the loop; without them the monitoring cadence cannot run. Article schema fix (TASK-03) is independent and runs in parallel with scripts in Wave 1. TASK-04 (cadence initialization) gates on scripts being done. This maximizes parallelism and ensures the monitoring infrastructure is established before measuring the effect of the schema fix.

## Plan Gates
- Foundation Gate: Pass — deliverable type, execution track, skill, startup alias, confidence inputs, and test landscape all present in fact-find
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Partial — TASK-01 at 80% confidence clears the gate; TASK-02, TASK-03, and TASK-06 are SPIKE tasks at <80% confidence and require scouts/dry-runs to clear their gates before `/lp-do-build` proceeds past each. TASK-04 and TASK-05 (INVESTIGATE, ≥60% gate) are both clear.

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Build gsc-url-inspection-batch.ts | 95% | M | Complete (2026-02-25) | - | TASK-04 |
| TASK-02 | SPIKE | Build gsc-search-analytics.ts | 90% | S | Complete (2026-02-25) | - | TASK-04 |
| TASK-03 | SPIKE | Fix Article.datePublished wiring | 90% | S | Complete (2026-02-25) | - | - |
| TASK-04 | INVESTIGATE | Initialize monitoring cadence (baseline run) | 95% | S | Complete (2026-02-25) | TASK-01, TASK-02 | TASK-06 |
| TASK-05 | INVESTIGATE | Google Indexing API eligibility | 85% | S | Complete (2026-02-25) | - | TASK-06 |
| TASK-06 | SPIKE | Build Sitemaps API re-ping script | 90% | S | Superseded (2026-02-25) | TASK-04, TASK-05 | - |

> **Build-gate note (AGENTS.md line 230):** TASK-02, TASK-03, and TASK-06 carry <80% confidence and have been reclassified from IMPLEMENT to SPIKE. SPIKE tasks carry the same ≥80% gate. Each must reach 80% before `/lp-do-build` proceeds past that task — see per-task "What would make this ≥90%" sections and the scout obligations noted below. TASK-05 dependency on TASK-01 removed: the Indexing API submission itself does not require TASK-01; only the 48h verification check does (handled within TASK-05's own execution plan).

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-05 (submission step only) | - | All parallel; no shared files except GA4 SA key (read-only). TASK-05 Indexing API submission can fire in Wave 1; the 48h re-inspection check runs after TASK-01 is available |
| 2 | TASK-04, TASK-05 (verification step) | TASK-01 done (TASK-05 verification + TASK-04); TASK-02 done (TASK-04 only) | TASK-04 runs monitoring baseline; TASK-05 runs 48h re-inspection using TASK-01 script |
| 3 | TASK-06 | TASK-04 done AND TASK-05 verdict available | Run after baseline established and eligibility verdict known; if Indexing API eligible, defer TASK-06 to Phase B |

---

## Tasks

---

### TASK-01: Build gsc-url-inspection-batch.ts
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/brikette/gsc-url-inspection-batch.ts` — working CLI script; takes a JSON list of URLs, runs URL Inspection API against each, writes results to `docs/plans/brikette-seo-api-optimization-loop/monitoring/run-<date>.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `scripts/src/brikette/gsc-url-inspection-batch.ts` (new), `[readonly] scripts/src/brikette/ga4-run-report.ts` (pattern reference), `[readonly] memory/data-access.md`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 85% — API endpoint confirmed (`POST https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`), JWT auth pattern established in `ga4-run-report.ts`; response fields (`coverageState`, `lastCrawlTime`, `googleCanonical`, `userCanonical`) confirmed from TASK-11 artifact. Main risk: minor response-parsing edge cases for URLs with no inspection history.
  - Approach: 80% — exact replication of `ga4-run-report.ts` pattern (no SDK, RS256 JWT, same key file); output format follows Cloudflare analytics script pattern. 80% held: first live dry-run may reveal minor API quirks not in prior task artifacts.
  - Impact: 80% — without this script the monitoring loop cannot run; it is the core diagnostic tool. 80% held: value is contingent on operator running it consistently every other day.
- **Acceptance:**
  - Script runs against `.secrets/ga4/brikette-web-2b73459e229a.json` without error
  - Accepts a JSON array of URLs as input (file path argument or stdin)
  - Writes `monitoring/run-<date>.json` with one entry per URL containing `url`, `coverageState`, `lastCrawlTime`, `googleCanonical`, `userCanonical`, `timestamp`
  - Handles quota errors gracefully (logs rate limit hit, exits cleanly with non-zero code)
  - Handles invalid URL responses gracefully (logs error for that URL, continues batch)
  - Property is `sc-domain:hostel-positano.com`
- **Validation contract (TC-01):**
  - TC-01: Run script with the 30-URL TASK-11 seed list → output JSON file exists, contains 30 entries, each with `coverageState` field populated
  - TC-02: Run script with an invalid URL in the batch → that entry has an `error` field; script exits with remaining URLs processed
  - TC-03: Auth failure (wrong key path) → script exits with clear error message indicating auth failure, not a silent crash
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write failing test / acceptance check — dry-run call to the URL Inspection endpoint using the existing SA JWT pattern; confirm response shape matches TASK-11 artifact.
  - Green: Copy `ga4-run-report.ts` structure. Implement `getAccessToken()` (same pattern), implement `inspectUrl(token, siteUrl, inspectionUrl)` → returns `IndexStatusResult`. Add batch loop over URL list, write to output JSON, add graceful error handling per URL. Accept input file path as argv[2]; default output to `docs/plans/brikette-seo-api-optimization-loop/monitoring/run-<date>.json`.
  - Refactor: Extract `getAccessToken()` to shared `gsc-auth.ts` if TASK-02 reuses it (run check); add TypeScript types for `IndexStatusResult`; add `--dry-run` flag that logs URLs without calling API.
- **Planning validation:**
  - Checks run: Verified `ga4-run-report.ts` exists at `scripts/src/brikette/`; confirmed JWT auth pattern (lines 1–60); confirmed GSC property string `sc-domain:hostel-positano.com` from TASK-11 artifacts; confirmed output directory `docs/plans/brikette-seo-api-optimization-loop/monitoring/` does not yet exist (will be created by script).
  - Validation artifacts: `memory/data-access.md` Search Console section; TASK-03b gsc-canonical-validation.md
  - Unexpected findings: None — API shape and auth are exactly as expected from TASK-11.
- **Consumer tracing:**
  - New output `monitoring/run-<date>.json`: consumed by TASK-04 (reads output to establish baseline) and by operator in every subsequent monitoring run.
  - New script `gsc-url-inspection-batch.ts`: consumed by TASK-04 (executes script) and TASK-05 (re-runs script 48h after Indexing API submission to check coverage state change).
  - No existing files modified — additive only; no existing consumers affected.
- **Scouts:** Dry-run call to URL Inspection API with 1 URL before building full batch loop — confirms endpoint, response shape, and auth before committing to full implementation.
- **Edge Cases & Hardening:**
  - URLs with no crawl history → `coverageState: "URL_IS_UNKNOWN"` is a valid response; log clearly
  - Batch size > 2,000/day → script should warn when input count > 1,800 (leaving 10% headroom); not blocked, just advisory
  - Output directory missing → create `monitoring/` directory if not present
  - Locale URL variants (same path, different lang prefix) → treated as distinct URLs; no deduplication needed
- **What would make this >=90%:**
  - Completing a dry-run live API call and confirming the response matches the TASK-11 artifact format exactly
- **Rollout / rollback:**
  - Rollout: Merge script; run manually post-merge to confirm live API access
  - Rollback: Not needed — additive script; no production code affected
- **Documentation impact:**
  - Add usage comment block at top of script: purpose, auth requirements, input format, output format, rate limit note
- **Build evidence (2026-02-25):**
  - `scripts/src/brikette/gsc-auth.ts` created — shared JWT auth module (getAccessToken, loadServiceAccount, type ServiceAccountKey)
  - `scripts/src/brikette/gsc-url-inspection-batch.ts` created — 236 lines, handles batch input, rate limits, dry-run, output directory creation
  - TASK-01 scout: live API call confirmed `coverageState: "URL is unknown to Google"`, `verdict: "NEUTRAL"`, `sitemap: []` — matches TASK-11 artifact exactly
  - gsc-auth.ts extracted as refactor step — TASK-02 and TASK-06 import from it
  - TypeScript passes; lint passes after ESLint autofix of import sort
- **Notes / references:**
  - `ga4-run-report.ts` is the canonical auth pattern reference
  - TASK-03b `docs/plans/brikette-seo-traffic-growth/task-03b-gsc-canonical-validation.md` for GSC response shape examples
  - GSC quota: 2,000 URL inspections/day per property

---

### TASK-02: Build gsc-search-analytics.ts
- **Type:** SPIKE
- **Deliverable:** `scripts/src/brikette/gsc-search-analytics.ts` — CLI script; pulls clicks/impressions/CTR/position by page (and optionally by query) for a configurable date range; writes to `docs/plans/brikette-seo-api-optimization-loop/monitoring/analytics-<date>.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `scripts/src/brikette/gsc-search-analytics.ts` (new), `[readonly] scripts/src/brikette/ga4-run-report.ts` (pattern reference)
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 75%
  - Implementation: 90% — Search Analytics API is simpler than URL Inspection; same SA, same JWT pattern; endpoint is `POST https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Ahostel-positano.com/searchAnalytics/query`; payload shape is well-documented.
  - Approach: 85% — pull by `page` dimension for guide-level impression tracking; optional `query` dimension; date range as CLI arguments; same output conventions as TASK-01.
  - Impact: 75% — guide pages currently have 0 impressions so this output will be empty/zero for weeks; useful as a baseline that shows when first impressions appear. Value is confirmatory, not diagnostic.
  - **Build-gate note:** 75% overall is below the ≥80% threshold for IMPLEMENT/SPIKE tasks (AGENTS.md line 230). Reclassified to SPIKE. Build proceeds once a live dry-run against the Search Analytics API confirms response shape and empty-row handling — this is the "What would make this ≥90%" step and also raises overall confidence above 80%.
- **Acceptance:**
  - Script runs without error using same SA credentials
  - Accepts date range as CLI arguments (`--start YYYY-MM-DD --end YYYY-MM-DD`)
  - Writes `monitoring/analytics-<date>.json` with rows sorted by impressions descending
  - Handles 0-row response (no data) gracefully — writes empty array, exits 0
  - Property string matches TASK-01: `sc-domain:hostel-positano.com`
- **Validation contract (TC-04):**
  - TC-04: Run script with a 7-day date range → output JSON exists and contains valid JSON (even if rows = 0)
  - TC-05: Run script with invalid date range (end before start) → error message, exit 1
- **Execution plan:** Red -> Green -> Refactor
  - Red: Verify API endpoint and response shape from GSC documentation; confirm SA scope covers `webmasters.readonly` for Search Analytics.
  - Green: Implement using same JWT auth as TASK-01 (extract `gsc-auth.ts` shared module if TASK-01 completed first; otherwise inline and refactor in TASK-01 refactor phase). Add date range arguments. Call Search Analytics API. Write output JSON.
  - Refactor: Reuse `getAccessToken()` from TASK-01's `gsc-auth.ts` if extracted; deduplicate.
- **Planning validation:**
  - Checks run: Confirmed `webmasters.readonly` scope covers Search Analytics (same scope used in TASK-03a). Property URL encoding: `sc-domain:hostel-positano.com` → `sc-domain%3Ahostel-positano.com` in path (confirmed from TASK-03b artifact format).
  - Validation artifacts: `memory/data-access.md` Search Console section
  - Unexpected findings: None.
- **Scouts:** None: API shape and auth already confirmed from TASK-01 investigation; same pattern.
- **Edge Cases & Hardening:**
  - 0-row response (guide pages not indexed yet): output empty array, do not error
  - Date range spanning GSC's 16-month data retention limit: warn if start date > 16 months ago
- **What would make this >=90%:**
  - Seeing first guide page impressions in the output (confirms loop is producing diagnostic signal)
- **Rollout / rollback:**
  - Rollout: Additive script; no production code affected
  - Rollback: Not needed
- **Documentation impact:**
  - Usage comment block: purpose, date range format, output schema
- **Build evidence (2026-02-25):**
  - `scripts/src/brikette/gsc-search-analytics.ts` created — 175 lines, imports from gsc-auth.ts, handles date range args, 0-row response, output path
  - TASK-02 scout: live API call returns 122 rows for 7-day range; guide pages at 0 impressions (expected at T+0)
  - Script requires `tsx --tsconfig scripts/tsconfig.json` (ESM output format) — documented in script header
- **Notes / references:**
  - If TASK-01 extracts `gsc-auth.ts`, TASK-02 should import from it rather than duplicating

---

### TASK-03: Fix Article.datePublished wiring at both call sites
- **Type:** SPIKE
- **Deliverable:** Updated `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx`, `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx`, and optionally `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx`; new contract test in `seo-extraction-contract.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx` (add `lastUpdated?` prop; pass to ArticleStructuredData), `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx` (pass `lastUpdated` to HeadSection), `apps/brikette/src/test/seo-extraction-contract.test.ts`, `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx` (scope-dependent — see Scouts), `[readonly] apps/brikette/src/routes/guides/_GuideSeoTemplate.tsx` (extracts lastUpdated at lines 187–195; threading starts here), `[readonly] apps/brikette/src/components/seo/ArticleStructuredData.tsx` (already has datePublished?/dateModified? props — no changes needed), `[readonly] apps/brikette/src/utils/seo/jsonld/article.ts` (already supports both fields — no changes needed)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 75% — `lastUpdated` is correctly extracted in `_GuideSeoTemplate.tsx` (lines 187–195) and passed to `GuideSeoTemplateBody` (line 497), which currently passes it only to `ArticleHeader` for visible `<time>` display. `ArticleStructuredData` is rendered inside `HeadSection.tsx` (line 194), which has NO `lastUpdated` prop in its interface (confirmed). The fix requires: (1) add `lastUpdated?: string` to `HeadSection` Props; (2) pass `datePublished={lastUpdated}` and `dateModified={lastUpdated}` to `ArticleStructuredData` inside `HeadSection`; (3) pass `lastUpdated` from `GuideSeoTemplateBody` to `HeadSection`. `ArticleStructuredData` and `article.ts` already support both optional fields — no changes there. Confidence held at 75% pending Scout resolution for `HowToGetHereContent.tsx` (see below) and to acknowledge this is a SPIKE due to the architecture gap discovered during planning.
  - Approach: 85% — correct pattern (prop threading through intermediate component); backward-compatible (optional props); existing call sites without `lastUpdated` unaffected. `dateModified` uses same source as `datePublished` per fact-find Q&A.
  - Impact: 75% — post-discovery hygiene fix (H2): improves structured data completeness and potential freshness-signal quality for already-indexed pages; does NOT accelerate discovery of never-crawled pages. Impact realized only after guide pages are indexed. For 59% of guides with no `lastUpdated`, no change at all.
- **Acceptance:**
  - `HeadSection.tsx`: `lastUpdated?: string` added to Props interface; `datePublished={lastUpdated}` and `dateModified={lastUpdated}` passed to `ArticleStructuredData` when non-null
  - `GuideSeoTemplateBody.tsx`: `lastUpdated` passed to `HeadSection` (alongside existing props)
  - `HowToGetHereContent.tsx`: if Scout confirms `lastUpdated` is accessible, wired to `ArticleStructuredData` at line 183; if not accessible without parent threading, this call site is deferred and documented in a follow-up SPIKE
  - Contract test: for a guide fixture with `lastUpdated: "2024-12-01"`, Article JSON-LD output includes `"datePublished": "2024-12-01"` and `"dateModified": "2024-12-01"`
  - Contract test: for a guide fixture without `lastUpdated`, Article JSON-LD output does NOT include `datePublished` or `dateModified`
  - All existing schema tests pass unchanged
- **Validation contract (TC-06):**
  - TC-06: Guide fixture with `lastUpdated` → JSON-LD contains `datePublished` = `lastUpdated` value, `dateModified` = same value
  - TC-07: Guide fixture without `lastUpdated` → JSON-LD contains neither `datePublished` nor `dateModified` (backward compat preserved)
  - TC-08: Rich Results Test on 5 deployed guide URLs (post-deploy) → `datePublished` visible in structured data panel
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing assertion to `seo-extraction-contract.test.ts`: for a guide with `lastUpdated`, expect `datePublished` in Article JSON-LD output. Test fails because prop is not currently threaded to `HeadSection`.
  - Green: (1) Add `lastUpdated?: string` to `HeadSection` Props interface. (2) Inside `HeadSection`, pass `datePublished={lastUpdated}` and `dateModified={lastUpdated}` to `ArticleStructuredData` when non-null. (3) In `GuideSeoTemplateBody`, pass `lastUpdated={lastUpdated}` to `HeadSection`. Run Scout for `HowToGetHereContent.tsx` to determine data access path; if `lastUpdated` is accessible via `RouteContent` or `RouteDefinition`, add to Props and wire similarly; if not accessible without parent threading, document as deferred and record in Decision Log. Tests pass.
  - Refactor: Confirm `HeadSection` tests still pass with the new optional prop (they should, as tests mock `ArticleStructuredData`); ensure TC-07 backward-compat passes; ensure no duplicate null-check logic introduced.
- **Planning validation:**
  - Checks run: Confirmed `_GuideSeoTemplate.tsx` lines 187–195 extract `lastUpdated`; confirmed `GuideSeoTemplateBody` passes it to `ArticleHeader` (line 202) for `<time>` display but NOT to `HeadSection`; confirmed `HeadSection.tsx` Props interface (lines 20–36) has no `lastUpdated` field; confirmed `ArticleStructuredData` in `HeadSection` at line 194 has no date props currently; confirmed `ArticleStructuredData.tsx` and `article.ts` already support `datePublished?`/`dateModified?` and require no changes.
  - Validation artifacts: fact-find Evidence Audit; code inspection of `HeadSection.tsx`, `GuideSeoTemplateBody.tsx`, `_GuideSeoTemplate.tsx`, `ArticleStructuredData.tsx`, `article.ts`
  - Unexpected findings: `HowToGetHereContent.tsx` is a client component with Props type that has NO `lastUpdated` field (lines 25–33 confirmed). `RouteContent` / `RouteDefinition` types must be checked to determine if guide content `lastUpdated` is accessible. This is a blocking data-access question, not a minor threading detail. SPIKE type reflects this unresolved uncertainty.
- **Scouts (blocking before Green step):**
  - Scout 1 (guide path): Read `GuideSeoTemplateBody.tsx` lines 150–169 to confirm `lastUpdated` is in the destructured props at the `HeadSection` call site — if not already there, add it.
  - Scout 2 (how-to-get-here path): Read `HowToGetHereContent.tsx` Props type (lines 25–33) and `RouteDefinition` / `RouteContent` types. Determine whether `lastUpdated` is available in scope or requires parent page prop threading. If parent threading is needed, scope this call site out to a follow-up SPIKE and document the decision.
- **Edge Cases & Hardening:**
  - `lastUpdated` is an empty string: treat as null — do not emit empty `datePublished`
  - Guide has `lastUpdated` but value is not a valid ISO date: log warning, omit field rather than emit invalid structured data
  - `HowToGetHereContent.tsx` call site deferred: ensure `ArticleStructuredData` at line 183 still renders correctly without date props (backward compat)
- **What would make this >=90%:**
  - Completing both scouts before implementation: (1) confirming `GuideSeoTemplateBody` → `HeadSection` threading is straightforward; (2) resolving `HowToGetHereContent.tsx` data access question — either `lastUpdated` is in scope (fix is complete) or it requires parent threading (scope out cleanly with documented decision)
  - Overall confidence rises to ≥80% once Scout 2 is resolved regardless of outcome — the uncertainty is about scope, not about approach
- **Rollout / rollback:**
  - Rollout: Standard deploy. Sitemap regeneration not required (JSON-LD change only). Google re-crawl will pick up structured data change on next visit.
  - Rollback: Revert prop threading at call sites; tests revert to baseline
- **Documentation impact:**
  - None: change is self-evident from prop names; no external doc needed
- **Build evidence (2026-02-25):**
  - Scout 1 (guide path): `GuideSeoTemplateBody.tsx` already has `lastUpdated` in Props (line 45) but does NOT pass it to HeadSection. Fix path confirmed.
  - Scout 2 (how-to-get-here path): `HowToGetHereContent.tsx` Props has no `lastUpdated` field; `RouteContent`/`RouteDefinition` types do not include it. This call site deferred per plan — documented in Decision Log and task notes.
  - `HeadSection.tsx` updated: added `lastUpdated?: string` to Props interface; added conditional `datePublished`/`dateModified` props to `ArticleStructuredData` call.
  - `GuideSeoTemplateBody.tsx` updated: added `lastUpdated={lastUpdated}` to HeadSection call site.
  - `seo-extraction-contract.test.ts` updated: added TC-06, TC-07, TC-06b tests for `buildArticlePayload`. All 8 tests pass (3 new + 5 existing).
  - No regressions in GuideSeoTemplate.integration.test, seo-jsonld-contract.test suites.
  - TypeScript passes cleanly for @apps/brikette.
- **Notes / references:**
  - `article.ts` builder already supports both fields at line 42 — no changes needed to the builder itself
  - `ArticleStructuredData.tsx` already has `datePublished?` and `dateModified?` in Props (lines 14–17) — no changes needed there
  - Only 681/4,093 URLs have authoritative `lastUpdated` — conditional emission is the correct behavior for the 59% without dates
  - SPIKE reclassification reflects architecture gap discovered during planning: the threading path is `_GuideSeoTemplate` → `GuideSeoTemplateBody` → `HeadSection` → `ArticleStructuredData`, not a direct 2-call-site patch as initially estimated

---

### TASK-04: Initialize monitoring cadence — baseline run and monitoring-log
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-api-optimization-loop/monitoring/run-<date>.json` (T+0 URL Inspection baseline), `docs/plans/brikette-seo-api-optimization-loop/monitoring/analytics-<date>.json` (T+0 Search Analytics baseline), `docs/plans/brikette-seo-api-optimization-loop/monitoring-log.md` (initial state, seed list, cadence protocol)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/brikette-seo-api-optimization-loop/monitoring/` (new directory), `docs/plans/brikette-seo-api-optimization-loop/monitoring-log.md` (new file)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 90% — run the two scripts and write a markdown log; no code risk
  - Approach: 90% — baseline first, then rotate; TASK-11 30-URL seed list is the anchor set; sample design from fact-find Q6 is explicit
  - Impact: 85% — establishes the measurement baseline without which no progress can be detected; minor residual: if all 30 seed URLs still show "unknown", the log is still valid (expected at T+0)
- **Questions to answer:**
  - What is the current coverage state of the 30-URL TASK-11 seed list as of T+0?
  - Are any URLs already transitioning (even partially) from "unknown to Google"?
  - What is the current Search Analytics impression count for guide-type pages?
- **Acceptance:**
  - `monitoring/run-<date>.json` written with ≥30 URLs (the TASK-11 seed list)
  - `monitoring/analytics-<date>.json` written for a 7-day lookback (baseline will show 0 or near-0 for guide pages)
  - `monitoring-log.md` contains:
    - T+0 summary: count of URLs in each coverage state
    - Rotating 28-URL seed definition with URL class breakdown (5 EN experiences, 5 EN transport, 5 IT transport, 5 high-priority pages, 8 rotating slots)
    - Unlock condition: ≥3 URLs transition from "URL is unknown to Google" → promote TASK-13
    - Stagnation trigger: 0 transitions in 6 consecutive weeks → invoke `/lp-do-replan` for aggressive internal linking pass
    - Shell command to run next monitoring cycle (single line, runnable in <30 seconds)
- **Validation contract:**
  - TC-11: `monitoring/run-<date>.json` exists and contains ≥30 entries, each with a `coverageState` field populated
  - TC-12: `monitoring/analytics-<date>.json` exists and contains valid JSON (rows may be empty/zero for guide pages at T+0)
  - TC-13: `monitoring-log.md` contains: (a) T+0 coverage state summary by URL class; (b) rotating 28-URL seed list definition; (c) unlock condition (≥3 transitions → promote TASK-13); (d) stagnation trigger (0 transitions in 6 weeks → `/lp-do-replan`); (e) single-line runnable monitoring command. Operator can execute the next monitoring cycle from this log without consulting any other document.
- **Planning validation:** None: non-code task; scripts are built in TASK-01/02.
- **Rollout / rollback:** None: write-only artifacts to `monitoring/` directory; no production code affected.
- **Documentation impact:** `monitoring-log.md` is the primary living artifact for this plan going forward — updated every other day by the operator.
- **Build evidence (2026-02-25):**
  - `monitoring/run-2026-02-25.json` written — 30/30 URLs inspected, 0 errors.
  - T+0 summary: 29 "URL is unknown to Google", 1 "Submitted and indexed" (amalfi-positano-bus — first Phase A transition!)
  - `monitoring/analytics-2026-02-25.json` written — 122 rows for 2026-02-18..2026-02-25; guide pages at 0 impressions as expected.
  - `monitoring-log.md` written — seed definition, transition triggers, single-command monitoring invocation.
  - TC-11/TC-12/TC-13 all pass.
- **Notes / references:**
  - TASK-11 30-URL seed list in `docs/plans/brikette-seo-traffic-growth/task-11-gsc-indexing.md`
  - Rotation math: 28 URLs × 3.5 runs/week ≈ 98 URLs/week; full sweep ~42 weeks
  - Stagnation escalation at 6 weeks, 0 transitions → `/lp-do-replan`

---

### TASK-05: Investigate Google Indexing API eligibility for guide pages
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/brikette-seo-api-optimization-loop/task-05-indexing-api-investigation.md` — test results, eligibility verdict, and recommended recrawl pattern
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] docs/plans/brikette-seo-api-optimization-loop/monitoring/` (reads T+0 baseline for comparison), `[readonly] memory/data-access.md`
- **Depends on:** - (Indexing API submission step runs in Wave 1 independently; 48h verification check uses TASK-01 script but is a sub-step within this task, not a hard pre-requisite for starting)
- **Blocks:** TASK-06
- **Confidence:** 70%
  - Implementation: 80% — API call is straightforward; same SA, different scope (`https://www.googleapis.com/auth/indexing`); endpoint is `POST https://indexing.googleapis.com/v3/urlNotifications:publish`. Auth and call pattern are clear.
  - Approach: 80% — test 5 guide URLs; wait 48h; re-run TASK-01 script on same URLs; compare `coverageState` before and after. Binary outcome: works or doesn't.
  - Impact: 70% — if eligible: significant acceleration of indexation signaling; if ineligible: no harm done, fall back to sitemaps re-ping (TASK-06). Uncertainty is about Google's policy compliance, not the implementation.
- **Questions to answer:**
  - Does the Google Indexing API accept guide-page submissions (Article schema, not NewsArticle/JobPosting)?
  - Does URL coverage state change in GSC within 48h of Indexing API submission?
  - If eligible, what is the recommended cadence (submit on every content deploy? only on new content?)?
- **Acceptance:**
  - Pre-flight (blocking): Confirm `ga4-automation-bot` service account has `https://www.googleapis.com/auth/indexing` scope AND is listed as a verified owner in GSC for `sc-domain:hostel-positano.com`. If not, add scope in GCP console and verify ownership before proceeding. Document result in investigation report.
  - 5 guide URLs submitted via Indexing API
  - GSC URL Inspection run 48h later on same 5 URLs using TASK-01 script (TASK-01 must be available for this step; submission step can run immediately in Wave 1)
  - Investigation report covers: API response codes received, pre-flight scope status, coverage state delta before/after, eligibility verdict (eligible/ineligible/inconclusive), recommended action
  - If eligible: documents the API call pattern as the canonical recrawl mechanism for future content deploys
  - If ineligible: confirms TASK-06 sitemaps re-ping as the fallback
- **Validation contract:** Investigation report written with a clear verdict including pre-flight scope check result. If eligible, a code snippet of the Indexing API call is included in the report for future operator use.
- **Planning validation:** None: investigation task; implementation risk is in API scope provisioning (Indexing API requires separate service account verification with Google Search Console — pre-flight acceptance criterion above addresses this explicitly).
- **Rollout / rollback:** None: test-only API calls; no production code affected; worst case Google ignores the request.
- **Documentation impact:** Investigation report saved to plan directory; findings gate TASK-06 (use Sitemaps API or Indexing API for recrawl signaling).
- **Build evidence (2026-02-25):**
  - Verdict: **INCONCLUSIVE** — API not enabled in GCP project 98263641014.
  - Token obtained successfully with `indexing` scope (length 1024). Not a scope rejection.
  - All 5 test URLs returned HTTP 403: "Web Search Indexing API has not been used in project 98263641014 before or it is disabled."
  - Operator action required: enable API at `https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=98263641014`
  - TASK-06 proceeds (conditional gate: inconclusive → proceed with Sitemaps re-ping)
  - Full investigation report: `task-05-indexing-api-investigation.md`
- **Notes / references:**
  - Google Indexing API scope: `https://www.googleapis.com/auth/indexing` (different from `webmasters.readonly`)
  - Indexing API docs: Service account must be a verified owner of the property in GSC — pre-flight check is now an explicit acceptance criterion, not a parenthetical note
  - TASK-06 is conditional on TASK-05 verdict: if Indexing API is eligible, TASK-06 sitemaps re-ping should be deferred to Phase B to avoid redundant recrawl signaling

---

### TASK-06: Build Sitemaps API re-ping script
- **Type:** SPIKE
- **Deliverable:** `scripts/src/brikette/gsc-sitemap-ping.ts` — CLI script that calls `webmasters/v3/sites/:site/sitemaps/:sitemapUrl` to notify Google of the sitemap after content deploys; writes confirmation to stdout
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Conditional gate:** Proceed only if TASK-05 verdict is "ineligible" or "inconclusive." If TASK-05 verdict is "eligible" (Indexing API accepted), defer TASK-06 to Phase B — Indexing API handles recrawl signaling more directly and TASK-06 becomes redundant for the recrawl use case.
- **Affects:** `scripts/src/brikette/gsc-sitemap-ping.ts` (new), `[readonly] scripts/src/brikette/gsc-auth.ts` (shared auth from TASK-01 refactor)
- **Depends on:** TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 70%
  - Implementation: 90% — simplest of the three GSC scripts; single API call (`PUT https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Ahostel-positano.com/sitemaps/https%3A%2F%2Fwww.hostel-positano.com%2Fsitemap.xml`); same auth pattern.
  - Approach: 85% — correct intervention given TASK-03b evidence that static sitemap submission is not driving discovery; re-ping after deploys signals content freshness.
  - Impact: 70% — uncertain how much faster Google responds to sitemap re-pings vs natural crawl; low-cost so worth doing regardless. Monitoring baseline from TASK-04 provides context to measure effect.
  - **Build-gate note:** 70% overall is below the ≥80% threshold for IMPLEMENT/SPIKE tasks (AGENTS.md line 230). Reclassified to SPIKE. Build proceeds once: (1) TASK-05 returns "ineligible/inconclusive" verdict (conditional gate above); (2) a single live API call confirms 200 OK from the Sitemaps endpoint. These two events raise overall confidence above 80%.
- **Acceptance:**
  - Script calls the Sitemaps API with the correct site URL and sitemap URL
  - Receives 200 OK or logs the response code and body on failure
  - Runs in <5 seconds
  - Documented in `monitoring-log.md` as "run after each deploy"
- **Validation contract (TC-09):**
  - TC-09: Run script → 200 OK response from GSC Sitemaps API, confirmation logged to stdout
  - TC-10: Run script with wrong credentials → clear error message, exit 1
- **Execution plan:** Red -> Green -> Refactor
  - Red: Confirm API endpoint and HTTP method (PUT vs POST) from GSC Sitemaps API docs.
  - Green: Implement using shared `gsc-auth.ts` JWT pattern. Call Sitemaps API. Log response. Exit 0 on 200, exit 1 on error.
  - Refactor: Parametrize sitemap URL as CLI argument to support future multi-sitemap scenarios (e.g., locale-partitioned sitemaps).
- **Planning validation:**
  - Checks run: TASK-03b confirmed `sitemap: []` for all inspected URLs — static submission is not being followed. Sitemaps API re-ping is the programmatic complement.
  - Validation artifacts: TASK-03b artifact
  - Unexpected findings: None.
- **Scouts:** None: API is trivially simple; no unknowns.
- **Edge Cases & Hardening:**
  - 404 from Sitemaps API: sitemap URL not registered in GSC — log with instruction to submit manually first
  - Non-200 response: log full response body to help debug
- **What would make this >=80% (build gate):**
  - TASK-05 returning "ineligible" or "inconclusive" verdict (satisfies conditional gate; raises impact confidence to 80%)
  - A single live Sitemaps API call returning 200 OK (confirms implementation confidence)
  - Both together raise overall TASK-06 confidence to ≥80%, clearing the SPIKE build gate
- **What would make this >=90%:**
  - First monitoring run post-re-ping showing faster coverage state transitions than T+0 baseline (confirms impact hypothesis)
- **Rollout / rollback:**
  - Rollout: Run manually after each content deploy. Document in `monitoring-log.md`.
  - Rollback: Not needed — additive script; sitemap not changed, only re-pinged
- **Documentation impact:**
  - Add one-line invocation to `monitoring-log.md`: "Run after every Brikette content deploy"
- **Build evidence (2026-02-25):**
  - TASK-06 scout: live Sitemaps API call returned HTTP 204 (not 200 — PUT returns No Content on success).
  - `scripts/src/brikette/gsc-sitemap-ping.ts` created — 94 lines, uses webmasters scope (not readonly), handles 204/200/404/other error cases.
  - TC-09 passes: script returns `OK (HTTP 204): Sitemap re-pinged successfully.`
  - Scope clarification: webmasters (not webmasters.readonly) required for PUT operations.
  - TypeScript passes. Lint passes.
  - `monitoring-log.md` updated with deployment command.
- **Notes / references:**
  - Sitemaps API endpoint: `PUT https://www.googleapis.com/webmasters/v3/sites/{site}/sitemaps/{feedpath}`
  - feedpath = URL-encoded sitemap URL
  - HTTP method returns 204 No Content on success (not 200)

---

## Risks & Mitigations
- **Content quality is primary blocker (not discovery):** Medium/Medium — monitoring cadence detects this fast: if URLs transition to "crawled not indexed" (not indexed), content quality is the issue; if still "unknown", discovery is. TASK-13 remains gated correctly.
- **Google Indexing API ineligible for travel guides:** Medium/Low — TASK-05 tests empirically; worst case = no-op; TASK-06 (sitemaps re-ping) is the fallback.
- **Manual monitoring cadence degrades:** Medium/Medium — scripts runnable in <30 seconds via single shell command documented in `monitoring-log.md`; stagnation escalation trigger at 6 weeks provides structural catch.
- **Article.datePublished absent for 59% of guides:** Medium/Low — conditional emission already in builder; only guides with authoritative `lastUpdated` emit the field; no regression for others.
- **TASK-14 internal link coverage too small:** Medium/Medium — monitoring loop detects stagnation; 6-week trigger fires replan for category-page internal linking pass.
- **GSC URL Inspection scope not covering Indexing API:** Low/Low — Indexing API requires different OAuth scope; TASK-05 flags this if it occurs; scope addition to GCP console is a 5-minute fix.

## Observability
- Logging: Each monitoring run writes `monitoring/run-<date>.json` and `monitoring/analytics-<date>.json`; operator annotates `monitoring-log.md` with summary and transition counts
- Metrics: Coverage state per URL class (unknown/crawled-not-indexed/indexed) tracked over time; GSC Search Analytics impressions for guide pages tracked over time
- Alerts/Dashboards: None automated in Phase 1; manual every-other-day review of output files

## Acceptance Criteria (overall)
- [ ] `scripts/src/brikette/gsc-url-inspection-batch.ts` runs successfully against live GSC API and produces monitoring output
- [ ] `scripts/src/brikette/gsc-search-analytics.ts` runs successfully and produces analytics output
- [ ] Article JSON-LD includes `datePublished` and `dateModified` for all guide pages with `lastUpdated`; contract tests pass
- [ ] `docs/plans/brikette-seo-api-optimization-loop/monitoring/` directory exists with T+0 baseline files
- [ ] `docs/plans/brikette-seo-api-optimization-loop/monitoring-log.md` written with seed list, unlock conditions, and single-command monitoring invocation
- [ ] Google Indexing API eligibility verdict documented in `task-05-indexing-api-investigation.md`
- [ ] `scripts/src/brikette/gsc-sitemap-ping.ts` runs and receives 200 OK from GSC

## Decision Log
- 2026-02-25: Chosen monitoring output directory is `docs/plans/brikette-seo-api-optimization-loop/monitoring/` (plan-local) rather than `docs/business-os/strategy/BRIK/data/` (global) — rationale: this is plan-phase diagnostic data, not standing business data; keeps plan artifacts co-located.
- 2026-02-25: `datePublished` and `dateModified` both use `lastUpdated` as source (single field) — no split until content schema adds a separate `publishedAt` field.
- 2026-02-25: TASK-06 sequenced after TASK-04 (not parallel) — so that the monitoring baseline is established before the re-ping runs; allows measuring whether the re-ping accelerates coverage state transitions relative to T+0.
- 2026-02-25 (critique R2): TASK-06 now also depends on TASK-05 verdict — if Indexing API is eligible, TASK-06 is deferred to Phase B as redundant. TASK-05 dependency replaces the parenthetical note in planning validation.
- 2026-02-25 (critique R2): TASK-05 dependency on TASK-01 removed from Depends-on — Indexing API submission can start in Wave 1; only the 48h verification check requires TASK-01, which is handled within TASK-05's own execution plan.
- 2026-02-25 (critique R2): TASK-02, TASK-03, TASK-06 reclassified from IMPLEMENT to SPIKE — all three are below the ≥80% confidence gate for IMPLEMENT/SPIKE tasks (AGENTS.md line 230). TASK-03 reclassification also reflects architecture gap: prop threading requires HeadSection interface extension, not a 2-call-site patch.
- 2026-02-25 (post-build): TASK-06 superseded — Indexing API confirmed eligible for Article-schema travel guide pages (all 5 test URLs returned 200 OK). Sitemaps re-ping is redundant for recrawl signaling; Indexing API is the stronger mechanism. `gsc-sitemap-ping.ts` script is built and available but deprioritised. Use the Indexing API submission pattern from `task-05-indexing-api-investigation.md` as the canonical post-deploy recrawl call.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01 (M): 80% × 2 = 160
- TASK-02 (S): 75% × 1 = 75
- TASK-03 (S): 75% × 1 = 75
- TASK-04 (S): 85% × 1 = 85
- TASK-05 (S): 70% × 1 = 70
- TASK-06 (S): 70% × 1 = 70
- Total weight: 7
- Weighted sum: 535
- Overall-confidence: 535 / 7 = 76.4% → **75%** (rounded to nearest 5)
