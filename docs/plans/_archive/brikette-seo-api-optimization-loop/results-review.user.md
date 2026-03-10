---
Type: Results-Review
Status: Draft
Feature-Slug: brikette-seo-api-optimization-loop
Review-date: 2026-02-25
artifact: results-review
---

# Results Review

## Observed Outcomes
- T+0 URL Inspection baseline run against 30 URLs confirms 29 of 30 guide/transport pages are unknown to Google — exactly as expected given Phase A canonical fixes were completed just before this plan ran.
- One URL (`amalfi-positano-bus`) was crawled and indexed on the same day as the baseline run (2026-02-25), marking the first detected Phase A transition. The unlock threshold for Phase B is 3 transitions; currently 1 of 3.
- Google Search Console API scripts (`gsc-url-inspection-batch.ts`, `gsc-search-analytics.ts`, `gsc-sitemap-ping.ts`) are operational and confirmed working with live credentials — sitemap re-ping returned HTTP 204 on the first test run.
- `Article.datePublished` / `Article.dateModified` structured data is now wired and passing for guide pages (HeadSection), confirmed by 3 new contract tests.
- Google Indexing API investigation returned HTTP 403 on all 5 test submissions — the API is not yet enabled in GCP for the Brikette project. This is a required operator action before indexing API submissions can be tested.
- Search Analytics baseline (7-day window) shows 122 rows: homepage and rooms pages have impressions; all guide/transport pages show 0 impressions at T+0, consistent with "unknown to Google" state.

## Standing Updates
- `CLAUDE.md` (or `MEMORY.md`): Add a note that `gsc-url-inspection-batch.ts`, `gsc-search-analytics.ts`, and `gsc-sitemap-ping.ts` must be run with `tsx --tsconfig scripts/tsconfig.json` (not plain `tsx`) due to the scripts tsconfig path alias requirement. Also note the sitemap re-ping should be run after every production deploy.
- `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md`: Update with the T+0 baseline result and the 1/3 unlock threshold status before archiving.

## New Idea Candidates
- Enable Google Indexing API and test URL submission eligibility | Trigger observation: All 5 test submissions returned HTTP 403 — API not enabled in GCP project 98263641014 | Suggested next action: spike (operator enables API at GCP console, then re-runs 5 test URLs)
- Wire `lastUpdated` prop through HowToGetHereContent to unlock datePublished on transport pages | Trigger observation: 31 EN transport pages have no `lastUpdated` in RouteDefinition; datePublished fix was deferred from TASK-03 | Suggested next action: defer
- Add datePublished to monitoring baseline to track when guide pages first appear with valid structured data in search results | Trigger observation: T+0 baseline has 29 unknown URLs; structured data correctness cannot be validated until pages are indexed | Suggested next action: defer

## Standing Expansion
No standing expansion: learnings captured in build-record and monitoring-log.md; GSC script usage pattern is repo-specific operational tooling rather than a reusable architectural pattern.

## Intended Outcome Check

- **Intended:** Build an instrumented SEO optimization loop — two reusable GSC API scripts for URL Inspection and Search Analytics, an Article.datePublished fix, a T+0 monitoring baseline, a Google Indexing API eligibility investigation, and a Sitemaps re-ping script — so that Phase A canonical fixes can be observed empirically and Phase B content work unlocked when ≥3 indexation transitions are confirmed.
- **Observed:** All five deliverables shipped and confirmed live. T+0 baseline captured. One indexation transition already detected. Indexing API investigation completed (inconclusive — API disabled; operator action required to continue). Sitemap re-ping confirmed working (HTTP 204). datePublished fix deployed with test coverage. The every-other-day monitoring cadence is ready to run.
- **Verdict:** Met
- **Notes:** The Indexing API 403 was an expected possible outcome — the investigation task was scoped as eligibility check, not guaranteed activation. The deferred HowToGetHereContent datePublished work is low priority and does not affect the outcome of this plan. All unlock prerequisites for Phase B monitoring are in place.
