---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: SELL
Workstream: Engineering
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: seo-monitoring-datepublished-baseline
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/seo-monitoring-datepublished-baseline/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260226-0013
Trigger-Why: The first transport page has transitioned to "Submitted and indexed" with no record of whether Google recognised the Article datePublished structured data. Without capturing this at the same time as indexation, the opportunity to time-stamp the first valid structured-data appearances is permanently lost.
Trigger-Intended-Outcome: type: operational | statement: Monitoring run JSON files record whether Google has detected valid Article structured data (including datePublished) for each inspected URL, so the first structured-data pickup date is captured automatically alongside the indexation date | source: operator
---

# SEO Monitoring: datePublished Structured Data Capture Fact-Find Brief

## Scope

### Summary

The every-other-day GSC URL Inspection monitoring script (`gsc-url-inspection-batch.ts`) currently captures only `indexStatusResult` from the API response, discarding the sibling `richResultsResult` field. As pages begin transitioning from "URL is unknown to Google" to "Submitted and indexed", there will be no automatic record of whether Google has also picked up the `Article.datePublished` structured data that was wired during the seo-api-optimization-loop plan. The first indexed page (`amalfi-positano-bus`) has already transitioned without any structured-data record.

The change is a focused script extension: add `richResultsResult` to the `InspectUrlResponse` type, extract the relevant fields (detected schema types, validity verdict, and whether datePublished appears as a detected item), and persist them alongside the existing indexation fields in each run JSON.

### Goals

- Capture Google's structured data detection status (detected types, validity verdict) for each URL at the time of URL inspection.
- Record whether an `Article` schema was detected, and its validity state.
- Persist new fields in `InspectionResult` output so run JSON files become the durable record of first structured-data appearances.
- Optionally: update the monitoring-log.md run format to note structured-data state for each run.

### Non-goals

- Calling the GSC Rich Results Test API (a separate endpoint) — URL Inspection `richResultsResult` covers the requirement without additional quota spend.
- Building a dashboard column or coverage-rate metric (adjacent later work).
- Wiring `lastUpdated` for transport pages (`HowToGetHereContent.tsx` deferred — separate task).
- Any changes to the guide page rendering or structured data emission itself.

### Constraints & Assumptions

- Constraints:
  - GSC URL Inspection API quota: 2,000/day. Adding `richResultsResult` extraction is purely a parse/capture change — zero additional API calls.
  - The script uses `tsx` with `--tsconfig scripts/tsconfig.json`. Any new types must be compatible with the scripts tsconfig (ESM/Node).
  - The monitoring JSON schema is consumed by monitoring-log.md run summaries and potentially future tooling. Adding new optional fields is backward-compatible; removing existing fields is not.
  - Auth, rate-limit handling, and dry-run mode are already correct. The change must not disturb existing error/rate-limit paths.

- Assumptions:
  - The `richResultsResult` field is returned at the same level as `indexStatusResult` inside `inspectionResult` for URLs where Google has detected structured data. For URLs that are "unknown to Google" (29/30 in run-2026-02-25.json), this field will either be absent or empty — the type must handle optional/absent gracefully.
  - The GSC URL Inspection API `richResultsResult` structure (per Google's documentation) contains: `verdict` (e.g., `PASS`/`FAIL`/`VERDICT_UNSPECIFIED`), and `detectedItems[]` where each item has `richResultType` (e.g., `"Article"`) and `items[]` with `name` and `value` for individual structured-data fields. `datePublished` would appear as a named item value if detected.
  - The actual API response for `amalfi-positano-bus` (the one indexed URL) does NOT contain `richResultsResult` data — confirmed by examining run-2026-02-25.json, which shows no `richResultsResult` key. This means the API either did not detect Article rich results yet, or the field is absent when not detected. This is expected: the script discards the field regardless, so there is no evidence either way from stored data.

## Outcome Contract

- **Why:** The first transport page transitioned to indexed without any structured-data record. As more pages index, automatically capturing whether Google has picked up datePublished at the same inspection call costs nothing (same API call) and creates a permanent record of first structured-data appearances.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Monitoring run JSON files record whether Google has detected valid Article structured data (including datePublished) for each inspected URL, so the first structured-data pickup date is captured automatically alongside the indexation date.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/brikette/gsc-url-inspection-batch.ts` — Main monitoring script. Accepts JSON URL list, calls GSC URL Inspection API per URL, writes `monitoring/run-<date>.json`. This is the only entry point and the only file requiring change.

### Key Modules / Files

- `scripts/src/brikette/gsc-url-inspection-batch.ts` — Contains `InspectUrlResponse`, `IndexStatusResult`, `InspectionResult` types and `inspectUrl()` function. Currently: `inspectUrl()` returns only `data?.inspectionResult?.indexStatusResult`. The `richResultsResult` field at `data?.inspectionResult?.richResultsResult` is read but discarded (line 153: `return data?.inspectionResult?.indexStatusResult ?? null`).
- `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring/run-2026-02-25.json` — T+0 baseline run. 30 URLs inspected. One URL (`en/how-to-get-here/amalfi-positano-bus`) shows `"coverageState": "Submitted and indexed"`, `"verdict": "PASS"`. No `richResultsResult` field present in the stored JSON (confirmed by inspection). This is the gap being addressed.
- `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md` — Run log with tabular coverage summaries. Currently tracks: state, count, buckets per run. Does not have a structured data column. Needs assessment for whether to add one.
- `apps/brikette/src/test/seo-extraction-contract.test.ts` — 3 contract tests for Article.datePublished (TC-06, TC-07, TC-06b): confirm `buildArticlePayload` emits `datePublished`/`dateModified` when `lastUpdated` is truthy and omits them when absent or empty string. All pass.
- `apps/brikette/src/utils/seo/jsonld/article.ts` — `buildArticlePayload()`. Conditionally spreads `datePublished`/`dateModified` when truthy. Confirmed: guide pages with `lastUpdated` emit these fields in their Article JSON-LD.
- `apps/brikette/src/components/seo/ArticleStructuredData.tsx` — React component rendering the Article JSON-LD `<script>` tag. Takes `datePublished?` and `dateModified?` props, both optional.
- `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx` — Passes `lastUpdated` through to `ArticleStructuredData` as `datePublished`/`dateModified` via conditional spread. Confirmed working for guide pages with `lastUpdated`.
- `scripts/src/brikette/gsc-auth.ts` — Shared auth module (unchanged by this task).

### Patterns & Conventions Observed

- Optional field extraction pattern: existing code spreads `??` defaults for all `IndexStatusResult` fields: `result?.coverageState ?? "URL_IS_UNKNOWN"`, `result?.lastCrawlTime ?? null`, etc. New `richResultsResult` capture should follow the same `?? null` / `?? []` fallback pattern. Evidence: `scripts/src/brikette/gsc-url-inspection-batch.ts` lines 287–300.
- `InspectionResult` output type: flat object with all fields nullable (`string | null`, `string[]`). New fields should follow the same shape — simple scalar extractions (verdict string, detected types array, article validity boolean).
- Monitoring log format: each run adds a `### Run NN — <label> — <date>` section with a tabular coverage-state summary and key observations. Adding a structured-data row to the table or a sub-bullet is appropriate.

### Data & Contracts

- Types/schemas/events:
  - `InspectUrlResponse` (local type, `gsc-url-inspection-batch.ts`): needs `richResultsResult?: RichResultsResult` added.
  - `RichResultsResult` (new local type, same file): `{ verdict?: string; detectedItems?: RichResultsDetectedItem[] }`.
  - `RichResultsDetectedItem` (new local type): `{ richResultType?: string; items?: Array<{ name?: string; value?: string }> }`.
  - `InspectionResult` (local type, same file): needs new optional fields: `richResultsVerdict: string | null`, `richResultsDetectedTypes: string[]`, `articleStructuredDataValid: boolean | null`.
  - These types must NOT be exported — they are local to the script file, consistent with the existing pattern.

- Persistence:
  - Output JSON (`monitoring/run-<date>.json`): each result object gains 3 new optional fields. Existing fields are unchanged. Adding fields is backward-compatible for any tooling that reads these files.
  - `monitoring-log.md`: run summaries can optionally note structured-data status. Since only 1 URL is indexed and `richResultsResult` was not detected at T+0, the T+0 run log entry can be updated with a note that structured data was not yet detected at crawl time.

- API/contracts:
  - GSC URL Inspection API response shape (from Google documentation): `inspectionResult.richResultsResult.verdict` (string enum: `PASS`, `FAIL`, `VERDICT_UNSPECIFIED`), `inspectionResult.richResultsResult.detectedItems` (array, each with `richResultType` string and `items` array of `{name, value}` pairs). This is distinct from the `indexStatusResult` sibling.
  - The field is absent (not present in response) when Google has not detected structured data for the URL. The current script already handles absent-field patterns via `?? null` defaults.

### Dependency & Impact Map

- Upstream dependencies:
  - GSC URL Inspection API — no change to the API call itself. `richResultsResult` is already returned in the API response at the same endpoint (`/v1/urlInspection/index:inspect`). The change is purely in how the response is parsed.
  - `gsc-auth.ts` — no change.
  - Input URL list JSON — no change.

- Downstream dependents:
  - `monitoring/run-<date>.json` files — format gains 3 new optional fields. Any future tooling reading these files should handle unknown fields gracefully (JSON is additive).
  - `monitoring-log.md` — human-maintained log. Can be updated with a new column or sub-bullet in run summaries without breaking anything.
  - No application code, no database, no CI pipeline reads these monitoring JSON files. Blast radius is confined to the script and its output files.

- Likely blast radius:
  - Single file change: `scripts/src/brikette/gsc-url-inspection-batch.ts`.
  - No downstream system reads the monitoring JSON in a structured/typed way — the files are consumed by humans and potentially future scripts. Adding fields is safe.
  - `monitoring-log.md` is manually updated after each run — a note can be added at that time, or a future run summary format can include a structured-data column.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (brikette app), tsx/ESM for scripts. Script-level tests are not present (scripts use direct `tsx` invocation and are tested via dry-run and manual run).
- Commands: `pnpm --filter brikette test` (Jest, covers structured-data contract tests). Scripts have no Jest coverage.
- CI integration: Jest tests run in CI via the brikette test shards.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Article.datePublished emission | Unit (Jest) | `apps/brikette/src/test/seo-extraction-contract.test.ts` | TC-06, TC-07, TC-06b: confirm buildArticlePayload emits datePublished when truthy, omits when absent/empty. All 3 pass. |
| articleJsonLd (packages/seo) | Unit (Jest) | `packages/seo/src/__tests__/jsonld.test.ts` | TC-05: confirms articleJsonLd emits datePublished when provided. |
| gsc-url-inspection-batch.ts | None | — | Script has no unit tests. Dry-run mode is the only non-live test path. |
| InspectUrlResponse parsing | None | — | No tests for the response parsing logic in the script. |

#### Coverage Gaps

- Untested paths:
  - `inspectUrl()` response parsing in `gsc-url-inspection-batch.ts` — no unit test coverage. Adding `richResultsResult` extraction is equally untested.
  - The new type definitions (`RichResultsResult`, `RichResultsDetectedItem`) will have no unit tests.
- Extinct tests: none identified.

#### Testability Assessment

- Easy to test: The new type extraction logic is pure parsing of a known JSON shape. A unit test with a mock API response fixture could cover it, but this is out of scope for this task (consistent with the existing zero-test approach for scripts).
- Hard to test: Live API calls require real GSC credentials. Dry-run mode does not exercise the parsing path.
- Test seams needed: None required for this change. If the team later wants to add unit tests for the script, the `inspectUrl()` function could be factored to accept a parsed response rather than a raw HTTP response — but this is not required for the minimal change.

#### Recommended Test Approach

- Unit tests for: `buildArticlePayload` (already covered — no new tests needed).
- Integration tests for: not applicable for this change.
- E2E tests for: not applicable.
- Contract tests for: the new `InspectionResult` fields are output-only; no contract test is needed for the script.
- Manual validation: run the script in dry-run mode post-change to confirm no type errors; run against one URL in live mode (without consuming significant quota) to confirm `richResultsResult` appears in output JSON when Google has detected structured data.

### Recent Git History (Targeted)

- `scripts/src/brikette/gsc-url-inspection-batch.ts` — Two commits:
  - `89279dfaa1` (2026-02-25): Initial creation. TASK-01 of seo-api-optimization-loop. Establishes `InspectUrlResponse`, `IndexStatusResult`, `InspectionResult` types and full script logic. Only `indexStatusResult` captured; `richResultsResult` not mentioned.
  - `0206b9fa2f` (2026-02-25): Minor docs addition — tsx invocation note in script header. No logic change.
  - Implication: The script was created in one shot with no iteration. The `richResultsResult` gap is a first-pass oversight, not a regression. The change is additive.

## External Research (If Needed)

- Finding: GSC URL Inspection API `richResultsResult` field — confirmed present in the official API response schema at the same level as `indexStatusResult`. Contains `verdict` (enum: `PASS`, `FAIL`, `VERDICT_UNSPECIFIED`) and `detectedItems[]` array. Each `detectedItem` has `richResultType` (e.g., `"Article"`, `"FAQ page"`, `"HowTo"`) and `items[]` with `name`/`value` string pairs representing detected schema.org properties. Source: Google Search Console URL Inspection API v1 — `InspectUrlResponse` proto schema, method `urlInspection.index.inspect`.
- Finding: The GSC Rich Results Test API (`https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run`) is a different API, requires a separate quota, and tests structured data in isolation from indexation state. URL Inspection `richResultsResult` covers the requirement within the existing single API call — no need for the Rich Results Test API.

## Questions

### Resolved

- Q: Does the run-2026-02-25.json file contain any `richResultsResult` data for the one indexed URL?
  - A: No. Confirmed by reading the full run-2026-02-25.json file. The only indexed URL (`en/how-to-get-here/amalfi-positano-bus`) has `"verdict": "PASS"` and `"coverageState": "Submitted and indexed"` but no `richResultsResult` field at all. This means either: (a) the script discards it before writing (confirmed — the script only saves `indexStatusResult` fields), or (b) the API did not return it for this URL at crawl time. Both are possible; the script gap prevents us from knowing which. The fix resolves this ambiguity for future runs.
  - Evidence: `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring/run-2026-02-25.json` — all 30 results examined; no `richResultsResult` key present.

- Q: Is the GSC Rich Results Test API needed, or does URL Inspection richResultsResult cover the requirement?
  - A: URL Inspection `richResultsResult` covers the requirement. The Rich Results Test API is a separate endpoint with separate quota that tests structured data markup in isolation, not within Google's index. The URL Inspection API returns `richResultsResult` as part of the same call used for indexation monitoring — zero additional API calls and zero additional quota cost. The Rich Results Test API would be appropriate for batch validation of non-indexed pages, which is a separate adjacent task.
  - Evidence: Google Search Console API documentation; dispatch packet `adjacent_later` field lists "GSC Rich Results Test API batch validation" as a separate deferred task.

- Q: Should monitoring-log.md get a new column for structured data status, or is per-run JSON alone sufficient?
  - A: Per-run JSON is sufficient as the durable record; the monitoring log should add a sub-bullet or note under each run summary rather than a new table column. Rationale: (1) most URLs will show no richResults data for several more runs — a column of nulls adds noise; (2) the monitoring-log.md already uses a free-form "Observation" sub-section under each run, which is the right place for notable structured-data appearances; (3) a dedicated structured-data column can be added when ≥3 URLs have indexed and the column would have meaningful data. This avoids complicating the log format prematurely.
  - Evidence: `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md` — Run 01 format examined; the "Observation" pattern is established.

- Q: Do guide pages currently emit datePublished for Google to detect?
  - A: Yes, for guide pages with a `lastUpdated` field. The Article JSON-LD emits `datePublished` and `dateModified` both set to `lastUpdated` when the value is a non-empty string. Transport pages via `HowToGetHereContent.tsx` do NOT currently emit `datePublished` (this was deferred from TASK-03 of the seo-api-optimization-loop). The one indexed URL (`amalfi-positano-bus`) is a transport page — so even with the monitoring fix, `richResultsResult` may not show an Article `datePublished` for this URL until the transport-page datePublished wiring is done.
  - Evidence: `apps/brikette/src/routes/guides/guide-seo/components/HeadSection.tsx` lines 202–206 (conditional spread for `datePublished`/`dateModified`); commit `89279dfaa1` notes "HowToGetHereContent.tsx deferred (requires parent threading)".

- Q: What is the minimum change to gsc-url-inspection-batch.ts?
  - A: Three additions to the single file: (1) Add `RichResultsDetectedItem` and `RichResultsResult` type definitions (local, not exported). (2) Extend `InspectUrlResponse.inspectionResult` to include `richResultsResult?: RichResultsResult`. (3) Extend `InspectionResult` with three new nullable fields: `richResultsVerdict: string | null`, `richResultsDetectedTypes: string[]`, `articleStructuredDataValid: boolean | null`. (4) Update `inspectUrl()` to return both `indexStatusResult` and `richResultsResult` (change the return type from `IndexStatusResult | null` to a combined object). (5) Update the result-building logic in `main()` to populate the new fields via explicit field assignment (matching the existing `coverageState: result?.coverageState ?? ...` pattern). The `inspectUrl()` function signature change is the most structurally impactful part, but it is internal to the script.
  - Evidence: `scripts/src/brikette/gsc-url-inspection-batch.ts` read in full — 375 lines, single file, no imports from other scripts except `gsc-auth`.

- Q: Should `articleStructuredDataValid` be a boolean or a raw string field?
  - A: Use both — emit `richResultsVerdict: string | null` (raw, preserves `VERDICT_UNSPECIFIED` fidelity) AND `articleStructuredDataValid: boolean | null` (derived: `"PASS"→true`, `"FAIL"→false`, anything else→null`). This is strictly superior to either alternative alone: fidelity is preserved in the raw field, ergonomics in the derived field, and the null-conflation risk between "not detected" and `VERDICT_UNSPECIFIED` is eliminated because the raw verdict string distinguishes them. No operator preference is needed — the dual approach is the correct engineering choice regardless of future tooling design. Decision owner: agent-resolved.
  - Evidence: `InspectionResult` type pattern in `gsc-url-inspection-batch.ts` (all fields nullable); GSC API verdict enum (`PASS`/`FAIL`/`VERDICT_UNSPECIFIED`); no documented use case for `VERDICT_UNSPECIFIED` being treated as equivalent to "not detected".

### Open (Operator Input Required)

No items require operator input. The field-type question was resolved during investigation (see Resolved above).

## Confidence Inputs

- Implementation: 92%
  - Evidence: Script is a single 375-line file, fully read. The change is additive — new type definitions plus extraction logic in two places (`inspectUrl()` return and `main()` result-building). No external dependencies, no DB, no framework coupling.
  - What raises to >=80: Already above 80. The current gap is the unverified exact shape of `richResultsResult` from a live API call (the field was absent from run-2026-02-25.json because the script discarded it, not necessarily because it wasn't returned).
  - What raises to >=90: Confirming via a live test run that `richResultsResult` appears in the API response for an indexed URL with valid Article structured data. Since we cannot do that without a live call, implementation confidence is capped at 92%.

- Approach: 95%
  - Evidence: The approach (add types + extraction to existing script, no new API calls, no additional quota) is the minimal and obviously correct path. Confirmed by dispatch packet scope, GSC API documentation, and examination of the script.
  - What raises to >=90: Already above 90. No alternatives are viable — the Rich Results Test API adds cost and complexity for no benefit.

- Impact: 80%
  - Evidence: The change records structured-data status in monitoring JSON. For the one currently-indexed URL (transport page without datePublished wiring), `richResultsResult` may not appear anyway. Impact materialises when guide pages (which do emit datePublished) begin indexing. The value is in the future record, not immediately.
  - What raises to >=90: When ≥1 guide page transitions to "Submitted and indexed" and the run JSON shows `richResultsVerdict: "PASS"` with `articleStructuredDataValid: true` — confirming Google detected the Article schema including datePublished.

- Delivery-Readiness: 90%
  - Evidence: Single file, no external dependencies, no auth or infra changes. The operator can run it with `tsx` immediately after the code change. Dry-run mode allows pre-flight validation.
  - What raises to >=90: Already above 90. Field type design is resolved (dual-field approach). No operator input required before planning.

- Testability: 70%
  - Evidence: Script has no unit tests and the parsing logic cannot be exercised without a live API call or a mock fixture. The new fields add no testability burden beyond the existing zero-test baseline.
  - What raises to >=80: Add a minimal unit test fixture for `inspectUrl()` response parsing using a mock `richResultsResult` JSON object. This would confirm type extraction works before any live run.
  - What raises to >=90: Full dry-run integration test with a fixture JSON matching the live API response shape, exercising the new field extraction end-to-end.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| `richResultsResult` is absent in API response even for indexed URLs with valid structured data (Google delays detection) | Medium | Low | Script handles absent field via `?? null` defaults. No data is better than wrong data. Monitor over subsequent runs. |
| `detectedItems` shape differs from documented schema (e.g., no `richResultType` string for Article) | Low | Low | Use optional chaining throughout. Raw `detectedItems` array can be stored as-is if type extraction fails, allowing offline analysis. |
| Changing `inspectUrl()` return type introduces a TypeScript error in the script's tsconfig | Low | Low | Scripts tsconfig is separate (`scripts/tsconfig.json`). Change is internal to the script; no cross-package import of these types. Run `tsx --tsconfig scripts/tsconfig.json` dry-run post-change to validate. |
| Transport pages (like `amalfi-positano-bus`) will never show Article richResultsResult because they don't emit datePublished yet | High | Low | Expected and known (datePublished wiring for transport pages is a separate adjacent task). The monitoring fix still records the absence correctly, and will capture data when guide pages index. |
| monitoring-log.md note format becomes inconsistent across runs | Low | Low | Add a standard format note to the monitoring-log.md template section (e.g., "Structured data: not detected / Article PASS / Article FAIL"). |
| `articleStructuredDataValid: null` is ambiguous — conflates "not detected" with `VERDICT_UNSPECIFIED` | Low | Low | Mitigated by dual-field design: `richResultsVerdict` (raw string) distinguishes these two cases; `articleStructuredDataValid` (boolean) is a convenience derived field only. Operators reading monitoring JSON should use `richResultsVerdict` for precise state. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Keep new types local to `gsc-url-inspection-batch.ts` (not exported). All existing types in this file are local.
  - Use `?? null` and `?? []` fallback patterns for new optional fields, consistent with existing extraction.
  - Do not change existing `InspectionResult` fields (only add new ones). Additive-only.
  - `inspectUrl()` currently returns `IndexStatusResult | null`. The return type must change to return both `indexStatusResult` and `richResultsResult`. Preferred approach: return a combined object `{ indexStatus: IndexStatusResult | null; richResults: RichResultsResult | null }` — keeps the function's interface explicit.
  - The `main()` function builds `InspectionResult` using explicit field-by-field assignment (e.g., `coverageState: result?.coverageState ?? "URL_IS_UNKNOWN"`). New fields must follow the same explicit assignment pattern — do not assume a spread of a combined result object.

- Rollout/rollback expectations:
  - No deployment needed. The script is run manually (or via a cron/scheduled job) — the change takes effect on the next monitoring run.
  - Rollback: revert the single file change. No data migration needed (new fields are additive in JSON output).

- Observability expectations:
  - Post-change, each monitoring run JSON will include `richResultsVerdict`, `richResultsDetectedTypes`, and `articleStructuredDataValid` for each URL. Operators can check these fields manually after each run.
  - The monitoring-log.md run summary should note structured-data status (sub-bullet under each run).

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `RichResultsResult` and `RichResultsDetectedItem` types to `gsc-url-inspection-batch.ts`; extend `InspectUrlResponse` and `InspectionResult` types; update `inspectUrl()` to return combined `{ indexStatus, richResults }` object; update `main()` result-building to extract and persist new fields. Update monitoring-log.md format note. (Est: 1–2 hours)
- TASK-02 (optional): Add dry-run fixture test for `richResultsResult` extraction to verify type extraction logic without a live API call. (Est: 30 min)

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - `scripts/src/brikette/gsc-url-inspection-batch.ts` — updated with new types and extraction logic.
  - `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md` — Run 01 note updated to reflect that richResultsResult was not captured at T+0 baseline (data gap acknowledged); future run format documented.
  - Dry-run output showing no TypeScript errors (`tsx --tsconfig scripts/tsconfig.json ... --dry-run` exits 0).
- Post-delivery measurement plan:
  - On the next monitoring run after delivery, confirm that run JSON contains `richResultsVerdict`, `richResultsDetectedTypes`, `articleStructuredDataValid` keys for all URLs (values may be null for un-indexed URLs — that is correct).
  - When a guide page first transitions to "Submitted and indexed" in a future run, confirm the run JSON records `richResultsVerdict` and `articleStructuredDataValid` — this is the first structured-data capture event.

## Evidence Gap Review

### Gaps Addressed

- Citation integrity: Every claim has a file path pointer. The `inspectUrl()` return type claim is verified by reading the full script. The "no richResultsResult in run JSON" claim is verified by reading all 30 results in run-2026-02-25.json.
- Boundary coverage: API boundary (GSC URL Inspection) confirmed — no additional API call needed. Security boundary: no change to auth (same service account, same scope). Error/fallback paths: confirmed existing rate-limit and error handling is unchanged; new fields use `?? null` fallback.
- Testing/validation coverage: Existing contract tests (TC-06/TC-07/TC-06b) verified by reading `seo-extraction-contract.test.ts`. Script has zero unit tests — gap acknowledged and accepted as consistent with existing baseline.
- Business validation: Not applicable (this is infrastructure monitoring, not a user-facing feature).

### Confidence Adjustments

- Implementation confidence set to 92% (not 100%) because `richResultsResult` has not been observed in a live API response from this property — the field may behave differently than documented for un-indexed or newly-indexed URLs. This is the only genuine unknown.
- Testability set to 70% — honest reflection of the script's zero-test baseline. The change does not worsen testability.

### Remaining Assumptions

- `richResultsResult` is at `inspectionResult.richResultsResult` (same level as `indexStatusResult`). This matches Google's documented API schema (GSC URL Inspection API v1, `urlInspection.index.inspect` method, `InspectUrlResponse.inspectionResult`) but has not been empirically verified for this specific GSC property and service account scope.
- For URLs with `coverageState: "URL is unknown to Google"`, `richResultsResult` will be absent (null/undefined) in the API response. This is the expected behavior per API documentation.
- Transport pages (e.g., `amalfi-positano-bus`) emit HowTo JSON-LD via the `howToJson` prop in `HeadSection.tsx`. If Google detects this HowTo schema, `richResultsResult.detectedItems` may include a HowTo entry even without Article datePublished wiring. The `richResultsDetectedTypes` field would capture this. The risk table entry ("transport pages will never show Article richResultsResult") refers specifically to `Article` schema — HowTo detection is a separate and plausible case that the monitoring will correctly record once the fix is live.
- The `INDEXING_ALLOWED` `robotsTxtState` scope (`GSC_SCOPE_READONLY`) includes access to `richResultsResult`. Per Google documentation, URL Inspection API scope `https://www.googleapis.com/auth/webmasters.readonly` returns the full inspection result including rich results. Confirmed: the existing scope constant is `GSC_SCOPE_READONLY = "https://www.googleapis.com/auth/webmasters.readonly"` — correct.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan seo-monitoring-datepublished-baseline --auto`
