# Build Record: Brikette SEO API Optimization Loop

**Plan:** `docs/plans/brikette-seo-api-optimization-loop/plan.md`
**Status:** All tasks complete
**Build date:** 2026-02-25
**Branch:** dev

---

## What Was Built

### TASK-01: gsc-auth.ts + gsc-url-inspection-batch.ts

**Files created:**
- `scripts/src/brikette/gsc-auth.ts` — shared JWT auth module (ServiceAccountKey type, getAccessToken, loadServiceAccount, scope constants)
- `scripts/src/brikette/gsc-url-inspection-batch.ts` — batch URL Inspection script

**Auth pattern:** Exact replication of `ga4-run-report.ts` (RS256 JWT, no SDK, same SA key file)

**Capabilities:**
- Accepts JSON array of URL strings or `{url, bucket}` objects
- Input from file path (argv[2]) or stdin
- Writes `monitoring/run-<YYYY-MM-DD>.json` with coverageState, lastCrawlTime, googleCanonical, userCanonical, verdict, indexingState, robotsTxtState, pageFetchState, sitemap per URL
- Handles rate limits (exit code 2), partial errors (exit code 1), dry-run mode
- Warns when input exceeds 1,800 URLs (GSC quota headroom)

**Live scout result:** 1 URL, response matched TASK-11 artifact exactly.

**Run with:** `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts <urls.json>`

---

### TASK-02: gsc-search-analytics.ts

**Files created:**
- `scripts/src/brikette/gsc-search-analytics.ts` — Search Analytics pull script

**Capabilities:**
- `--start`/`--end` date range args (defaults to last 7 days with 3-day lag)
- `--query` flag to include query dimension alongside page
- Writes `monitoring/analytics-<YYYY-MM-DD>.json`, rows sorted by impressions desc
- Handles 0-row response gracefully (empty array, exit 0)
- Validates date range; warns if start date > 16 months ago (GSC retention limit)

**Live scout result:** 122 rows returned for 7-day range; guide pages at 0 impressions at T+0 (expected).

**Run with:** `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-search-analytics.ts`

---

### TASK-03: Article.datePublished wiring

**Files modified:**
- `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx` — added `lastUpdated?: string` to Props; pass `datePublished`/`dateModified` to ArticleStructuredData when non-empty
- `apps/brikette/src/routes/guides/guide-seo/template/GuideSeoTemplateBody.tsx` — added `lastUpdated={lastUpdated}` to HeadSection call

**Files updated (controlled scope expansion):**
- `apps/brikette/src/test/seo-extraction-contract.test.ts` — added TC-06, TC-07, TC-06b contract tests

**Scout findings:**
- Scout 1 (guide path): `GuideSeoTemplateBody` has `lastUpdated` in props but was NOT passing it to HeadSection — confirmed fix path.
- Scout 2 (how-to-get-here path): `HowToGetHereContent.tsx` has no `lastUpdated` in Props; `RouteContent`/`RouteDefinition` types don't include it. This call site deferred — requires parent prop threading, documented in plan Decision Log.

**Test results:** 8 tests pass (3 new + 5 existing); 0 regressions in GuideSeoTemplate.integration + seo-jsonld-contract suites.

---

### TASK-04: T+0 Monitoring Baseline

**Files created:**
- `docs/plans/brikette-seo-api-optimization-loop/monitoring/run-2026-02-25.json` — 30-URL URL Inspection baseline
- `docs/plans/brikette-seo-api-optimization-loop/monitoring/analytics-2026-02-25.json` — Search Analytics baseline (7-day, 2026-02-18..2026-02-25)
- `docs/plans/brikette-seo-api-optimization-loop/monitoring-log.md` — seed definition, triggers, commands

**T+0 coverage state summary:**

| State | Count | Buckets |
|---|---|---|
| URL is unknown to Google | 29 | en_guides(10), it_transport(10), en_transport(9) |
| Submitted and indexed | **1** | en_transport: `amalfi-positano-bus` |

**Key finding:** First Phase A transition detected. `amalfi-positano-bus` was crawled and indexed on 2026-02-25T08:22:06Z — same day as this baseline run. Phase A canonical fixes are beginning to have effect. Unlock threshold: ≥3 transitions; currently 1/3.

**Analytics:** 122 rows; homepage and rooms pages have impressions; all guide/transport pages at 0 impressions (expected).

---

### TASK-05: Google Indexing API Investigation

**Files created:**
- `docs/plans/brikette-seo-api-optimization-loop/task-05-indexing-api-investigation.md`

**Verdict: INCONCLUSIVE**

The SA token was obtained for the indexing scope (no scope rejection). However, all 5 test URL submissions returned HTTP 403: "Web Search Indexing API has not been used in project 98263641014 before or it is disabled."

**Required operator action:** Enable the Indexing API at `https://console.developers.google.com/apis/api/indexing.googleapis.com/overview?project=98263641014`

**Impact on TASK-06:** Conditional gate cleared (inconclusive → proceed with Sitemaps re-ping).

---

### TASK-06: gsc-sitemap-ping.ts

**Files created:**
- `scripts/src/brikette/gsc-sitemap-ping.ts` — Sitemaps API re-ping script

**Capabilities:**
- `--sitemap` and `--site` args for custom URLs
- Uses `webmasters` scope (not `webmasters.readonly`) — required for PUT
- Handles 204 (success), 200 (alt success), 404 (sitemap not registered — prints actionable instruction), other errors

**Scout correction:** HTTP method is PUT returning 204 No Content (not 200 as assumed from docs). Script handles both 204 and 200.

**TC-09 result:** Live API call returned HTTP 204; script exits 0.

**Run after every deploy:** `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts`

---

## Tests Run

| Suite | Result | Notes |
|---|---|---|
| seo-extraction-contract | 8 pass, 1 todo | 3 new datePublished tests |
| GuideSeoTemplate.integration | 4 pass, 8 todo | No regressions |
| seo-jsonld-contract | 4 pass, 0 todo | No regressions |
| scripts typecheck | 0 errors | gsc-auth/batch/analytics/ping all clean |
| brikette typecheck | 0 errors | HeadSection changes clean |

---

## Commits

1. `89279dfaa1` — feat(seo): add GSC API scripts and wire Article.datePublished (Wave 1)
2. `0206b9fa2f` — docs(seo): add tsx --tsconfig invocation note to GSC script headers
3. `927c12e6c5` — feat(seo): T+0 monitoring baseline and Indexing API investigation (Wave 2)
4. `5f51ea5a24` — feat(seo): add gsc-sitemap-ping.ts Sitemaps API re-ping script (Wave 3)

---

## Operator Follow-up Actions

1. **Enable Google Indexing API** (TASK-05): GCP console URL in investigation report. After enabling, re-submit 5 test guide URLs and re-run URL inspection after 48h to close the eligibility question.

2. **Run monitoring every other day**: Use the single-command invocation from `monitoring-log.md`. The unlock threshold is ≥3 URL transitions from "unknown" to any indexed state.

3. **Run sitemap re-ping after every deploy**: `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-sitemap-ping.ts`

4. **HowToGetHereContent.tsx datePublished deferred**: The `/en/how-to-get-here/` pages do not have `lastUpdated` in scope. A follow-up SPIKE is needed to thread it through from the parent page or `RouteDefinition`. This is low priority — affects only 31 EN transport pages, none of which have authoritative dates in the current content schema.

---

## Results Observable

- **T+7 days:** Run monitoring again; check if `amalfi-positano-bus` transition was followed by others.
- **T+14 days:** If ≥2 additional transitions, TASK-13 content quality pass becomes eligible.
- **T+42 days:** Stagnation trigger fires if 0 new transitions — invoke `/lp-do-replan` for aggressive internal linking.
