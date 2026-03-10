---
Type: Results-Review
Status: Draft
Feature-Slug: brikette-staging-upload-speed
Review-date: 2026-03-08
artifact: results-review
---

# Results Review

## Observed Outcomes

Both tasks completed on 2026-03-08.

**TASK-01 (Timing measurement):** Three CI runs captured. Run 2 (first full success): 5m 13s total, CF upload 41s. Run 3 (no-code-change redeploy): 5m 2s total, CF upload 34s. Wrangler content-addressed dedup saved only 7s (~17%), not the 50-80% hypothesised. The Next.js build (1m 51s) and workspace dep setup (~77s) now dominate the job. Overall reduction: **~37 min → ~5 min (86% reduction)**. Deliverable `task-01-timing.md` created with full per-step breakdown.

**TASK-02 (Language filter + workflow env):** `getBuildLanguages()` added to `static-params.ts`; wired into all four `generateStaticParams` call sites. EN+IT language filter confirmed working: 4,032 HTML files reduced to 448 (~89%). Workflow env var `BRIKETTE_STAGING_LANGS: "en,it"` added to `brikette-staging-fast.yml`. Read-only files (`i18n.config.ts`, `staticExportRedirects.ts`, `metadata.ts`) confirmed untouched. Typecheck and lint gates passed. Commit: `7f45ac10c1`.

Note: `apps/inventory-uploader` and `apps/reception` files in the git diff are from other concurrent work on the branch, not from this plan.

## Standing Updates
- No standing updates: no registered artifacts changed

## New Idea Candidates
<!-- Scan for signals in these five categories. For each, cite a "Trigger observation" from this build. Use "None." if no evidence found for any category.
  1. New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
  2. New open-source package — library to replace custom code or add capability
  3. New skill — recurring agent workflow ready to be codified as a named skill
  4. New loop process — missing stage, gate, or feedback path in the startup loop
  5. AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
-->
- New standing data source — None.
- New open-source package — None.
- New skill — None.
- New loop process — **Build artifact caching for staging:** The 1m 51s Next.js build now dominates the job. Caching the `.next/cache` directory between runs (e.g. via GitHub Actions cache) could reduce repeat build times. Trigger observation: Next.js build time unchanged between Run 2 and Run 3 despite identical code, suggesting no incremental cache was available.
- AI-to-mechanistic — **Chunk count monitoring:** The ~13k `_next/static` files dominate the upload regardless of language filter. A deterministic script checking chunk count against a threshold could flag regressions. Trigger observation: CF upload time is bounded from below by the cost of hashing ~13k files locally (~30-40s), not by network transfer.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** Brikette staging deploys complete materially faster than 37 min, with a concrete reduction achieved via language-subset builds and/or wrangler dedup.
- **Observed:** Staging deploys now complete in ~5 min 13s (Run 2) and ~5 min 2s (Run 3), down from ~37 min — an 86% reduction. EN+IT language filter reduced HTML output by 89% (4,032 → 448 files). CF upload time: 41s first deploy, 34s incremental. Wrangler dedup savings were minimal (~17%), not the 50-80% hypothesised.
- **Verdict:** Met
- **Notes:** All 2 tasks completed successfully.
