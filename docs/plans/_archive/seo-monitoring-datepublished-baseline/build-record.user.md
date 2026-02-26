---
Type: Build-Record
Status: Complete
Feature-Slug: seo-monitoring-datepublished-baseline
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record — SEO Monitoring: datePublished Structured Data Capture

## What Was Built

**TASK-01 — richResultsResult capture in gsc-url-inspection-batch.ts** (`scripts/src/brikette/gsc-url-inspection-batch.ts`, `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md`)

The GSC URL Inspection batch script now captures structured data detection status from the existing URL Inspection API response. Three new TypeScript types were added (`RichResultsDetectedItem`, `RichResultsResult`, and an extension to `InspectUrlResponse`), and three new fields appear in every URL result in monitoring run JSON files: `richResultsVerdict` (raw GSC verdict string — `"PASS"`, `"FAIL"`, or `null`), `richResultsDetectedTypes` (array of detected schema.org type names), and `articleStructuredDataValid` (boolean derived from the verdict: `true`=PASS, `false`=FAIL, `null`=no verdict). The `inspectUrl()` function return type was changed from `IndexStatusResult | null` to a combined `{ indexStatus, richResults }` object — the only caller is `main()`, so this is a self-contained change with no cross-file impact. All four result-push sites in `main()` (happy path, rate-limit skip, RateLimitError catch, general error catch) were updated to include the three new fields, using `null`/`[]`/`null` as safe defaults when no richResultsResult is available. No additional API calls are made — these fields come from the same response already being parsed.

The monitoring-log.md was updated with a note on Run 01 acknowledging the data gap (richResultsResult not recorded at T+0 baseline), plus a new "Run Summary Fields (from Run 02 onwards)" section documenting all three fields, their types, and semantics for future monitoring run records.

## Tests Run

| Command | Scope | Result |
|---|---|---|
| `tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts /tmp/test-urls.json --dry-run` | TC-05: TypeScript compile + dry-run | Pass — exit 0, URL list printed |
| Scout: `grep -c "inspectUrl(" gsc-url-inspection-batch.ts` | Call site count | 1 (single caller confirmed) |
| Scout: count `results.push(` sites | Result-push site count | 4 confirmed (happy path + rate-limit-skip + RateLimitError catch + general error catch) |

No Jest unit tests exist for this script (script has zero unit tests per the plan). TypeScript dry-run is the primary gate. TC-01 through TC-04 (live structured data response validation) are deferred to the next monitoring run once a guide page indexes with Article structured data — values for unindexed URLs are confirmed null/empty.

## Validation Evidence

**TC-01** (PASS verdict mapping): Validated by code inspection. `richResults?.verdict === "PASS" ? true : richResults?.verdict === "FAIL" ? false : null` correctly maps all three cases. Not yet exercised on a live API response with Article detection (no guide page with Article structured data has indexed yet). Will be confirmed on next monitoring run with a PASS verdict.

**TC-02** (absent richResultsResult → null defaults): Confirmed by dry-run. All 30 URLs in T+0 were unindexed (29 unknown, 1 indexed without Article structured data). The optional-chaining null fallbacks (`richResults?.verdict ?? null`, `?? []`) handle absent fields correctly.

**TC-03** (FAIL verdict): Validated by code inspection. Same ternary maps `"FAIL"` → `false`.

**TC-04** (VERDICT_UNSPECIFIED → null): Validated by code inspection. Neither `"PASS"` nor `"FAIL"` match → `null`.

**TC-05** (TypeScript compile + dry-run): `tsx --tsconfig scripts/tsconfig.json ... --dry-run` exit 0. Pass.

**TC-06** (Rate-limit error path): Validated by code inspection. The rate-limit-skip path at the top of the loop and the RateLimitError catch block both set `richResultsVerdict: null`, `richResultsDetectedTypes: []`, `articleStructuredDataValid: null`.

## Scope Deviations

None. All changes are within the `Affects` fields declared in TASK-01 (`scripts/src/brikette/gsc-url-inspection-batch.ts` + `[doc] monitoring-log.md`).

## Outcome Contract

- **Why:** The first transport page transitioned to indexed without any structured-data record. As more pages index, automatically capturing whether Google has picked up datePublished at the same inspection call costs nothing (same API call) and creates a permanent record of first structured-data appearances.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Monitoring run JSON files record whether Google has detected valid Article structured data (including datePublished) for each inspected URL, so the first structured-data pickup date is captured automatically alongside the indexation date.
- **Source:** operator
