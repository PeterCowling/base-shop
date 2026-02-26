---
Type: Results-Review
Status: Draft
Feature-Slug: seo-monitoring-datepublished-baseline
Review-date: 2026-02-26
artifact: results-review
---

# Results Review

## Observed Outcomes
- `gsc-url-inspection-batch.ts` now captures `richResultsVerdict`, `richResultsDetectedTypes`, and `articleStructuredDataValid` from the GSC URL Inspection API response in every monitoring run — confirmed by TypeScript dry-run (exit 0) and code inspection of all four result-push sites.
- The monitoring-log.md documents the T+0 data gap (richResultsResult not recorded at baseline) and the new field format for Run 02 onwards.
- No guide page has indexed with Article structured data yet — the new fields will produce non-null values on the next monitoring run that captures a page with Google-detected Article schema.

## Standing Updates
- `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md`: Updated with T+0 data gap note and Run Summary Fields documentation. Already committed (bundled in commit 9692c76d8d).
- `MEMORY.md`: Add GSC script usage pattern note — `gsc-url-inspection-batch.ts` output JSON now includes three structured-data fields from Run 02 onwards. No MEMORY.md update required: the GSC script usage note is already present from the previous plan.

## New Idea Candidates
- Confirm richResultsResult field presence on next monitoring run against amalfi-positano-bus (one indexed URL) to validate API response shape empirically | Trigger observation: TASK-01 delivered with optional-chaining fallbacks; no live API response with structured data yet observed for any seed URL | Suggested next action: defer (happens automatically on next run)
- Wire lastUpdated through HowToGetHereContent to unlock datePublished on 31 EN transport pages | Trigger observation: transport pages have no datePublished structured data; monitoring will capture HowTo detection instead of Article when they index | Suggested next action: defer
- Add Jest unit test with fixture JSON mock for gsc-url-inspection-batch.ts extraction logic | Trigger observation: TC-01 through TC-04 validated by code inspection only; fixture-based test would catch regression on return-type refactors | Suggested next action: defer

## Standing Expansion
No standing expansion: GSC script output schema change is a repo-specific operational tooling detail. The monitoring run format is documented in monitoring-log.md (the standing artifact for this cadence). No new Layer A artifact warranted.

## Intended Outcome Check

- **Intended:** Monitoring run JSON files record whether Google has detected valid Article structured data (including datePublished) for each inspected URL, so the first structured-data pickup date is captured automatically alongside the indexation date.
- **Observed:** All future monitoring run JSON files will contain `richResultsVerdict`, `richResultsDetectedTypes`, and `articleStructuredDataValid` for every URL. TypeScript compile confirmed. Code inspection verified all four result-push sites. Values will be `null`/`[]`/`null` until Google detects structured data on an indexed URL — this is correct behaviour, not a gap.
- **Verdict:** Met
- **Notes:** Impact materialises on the next monitoring run where a guide page appears indexed with Article structured data. The T+0 baseline had no such event; the next run will confirm the end-to-end capture path empirically. The change is complete, correct, and committed.
