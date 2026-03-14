---
Type: Results-Review
Status: Draft
Feature-Slug: xa-b-draft-product-storefront-visibility
Review-date: 2026-03-12
artifact: results-review
---

# Results Review

## Observed Outcomes
- TASK-01 complete: `executeCloudPublish` in `apps/xa-uploader/src/app/api/catalog/publish/route.ts` now filters `updatedSnapshot.products` through `isCatalogPublishableState(deriveCatalogPublishState(product))` before passing to `buildCatalogArtifactsFromDrafts`. Draft products with empty `imageFiles` are excluded from the published catalog contract.
- TASK-02 complete: `normalizeProductStatus` in `apps/xa-b/src/lib/xaCatalogModel.ts` no longer accepts `"draft"` — it returns `null`, and the existing null-filter in `parseXaCatalogModel` silently drops draft products at parse time.
- Defense-in-depth achieved: both the publish contract (server side) and the storefront catalog model (client side) independently exclude draft products. Either fix alone would close the P1; both together eliminate the gap at every layer.
- New test coverage: mixed-state snapshot test in `route.publish.test.ts` (TASK-01); `xaCatalogModel.test.ts` with 3 TCs covering draft-only, mixed live+draft, and out_of_stock cases (TASK-02).
- No regressions: existing live/out_of_stock behavior is identical — only `"draft"` input is newly excluded.

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
- New loop process — None.
- AI-to-mechanistic — None.

## Standing Expansion
- No standing expansion: no new external data sources or artifacts identified

## Intended Outcome Check

<!--
Warn mode (introduced TASK-06, startup-loop-why-intended-outcome-automation, 2026-02-25).
This section is non-blocking during the warn window. After one loop cycle (~14 days) it
will be promoted to a hard gate. A valid verdict keyword is required to clear the warn.
-->

- **Intended:** The xa-b storefront only displays products that are publishable (live or out_of_stock with complete images); draft products with missing images never appear in any listing.
- **Observed:** Draft products with no images are excluded from the published catalog contract (xa-uploader publish route) and silently dropped at xa-b catalog parse time. Store now only surfaces live and out_of_stock products with complete images.
- **Verdict:** Met
- **Notes:** All 2 tasks completed successfully.
