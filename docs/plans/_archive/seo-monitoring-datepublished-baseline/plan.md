---
Type: Plan
Status: Archived
Domain: SELL
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Last-completed-task: TASK-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: seo-monitoring-datepublished-baseline
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# SEO Monitoring: datePublished Structured Data Capture Plan

## Summary

Add `richResultsResult` capture to `gsc-url-inspection-batch.ts` so each monitoring run records whether Google has detected valid structured data (Article schema, datePublished) for each inspected URL. The change is additive: three new TypeScript types, three new output fields in `InspectionResult`, and a return-type change to `inspectUrl()`. No additional API calls, no deployment, no consumer code affected. The monitoring run JSON files become the permanent record of first structured-data appearances. The change is time-sensitive: as guide pages begin indexing, the first detection events should be captured automatically rather than retroactively reconstructed.

## Active tasks

- [x] TASK-01: Extend gsc-url-inspection-batch.ts with richResultsResult capture — Complete (2026-02-26)

## Goals

- Capture Google's structured data detection status (verdict, detected types, Article validity) for each URL in every monitoring run.
- Record the first structured-data detection event automatically when guide pages begin indexing.
- Extend the monitoring-log.md run format with a standard structured-data note.

## Non-goals

- Calling the GSC Rich Results Test API (a separate endpoint — deferred to adjacent later task).
- Building a dashboard column or coverage-rate metric.
- Wiring `lastUpdated` for transport pages (HowToGetHereContent.tsx — separate task).
- Any changes to guide page rendering or structured data emission.

## Constraints & Assumptions

- Constraints:
  - Zero additional API calls — richResultsResult is returned in the existing URL Inspection API response.
  - No deployment required — script is run manually or via cron.
  - New fields must be additive-only; existing InspectionResult fields must not change.
  - All new types must remain local to gsc-url-inspection-batch.ts (not exported).
  - The `inspectUrl()` return type change is internal — no cross-file callers.

- Assumptions:
  - `richResultsResult` is at `inspectionResult.richResultsResult` per GSC URL Inspection API v1 (`urlInspection.index.inspect`, `InspectUrlResponse`). Documented but not yet empirically observed for this property.
  - `webmasters.readonly` scope returns the full inspection result including rich results (confirmed via gsc-auth.ts constant).
  - Absent-field (`richResultsResult` not present) is handled by optional chaining (`?.`) — returns null, correct behaviour for unindexed URLs.
  - Transport pages (e.g., `amalfi-positano-bus`) may emit HowTo JSON-LD — `richResultsDetectedTypes` may capture this even without Article datePublished wiring.

## Inherited Outcome Contract

- **Why:** The first transport page transitioned to indexed without any structured-data record. As more pages index, automatically capturing whether Google has picked up datePublished at the same inspection call costs nothing (same API call) and creates a permanent record of first structured-data appearances.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Monitoring run JSON files record whether Google has detected valid Article structured data (including datePublished) for each inspected URL, so the first structured-data pickup date is captured automatically alongside the indexation date.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/seo-monitoring-datepublished-baseline/fact-find.md`
- Key findings used:
  - `inspectUrl()` returns only `data?.inspectionResult?.indexStatusResult ?? null` at line 153 — richResultsResult discarded.
  - T+0 run JSON (run-2026-02-25.json) has no richResultsResult data for any of 30 URLs, including the one indexed URL (amalfi-positano-bus).
  - 3 Article.datePublished contract tests (TC-06/TC-07/TC-06b) pass — datePublished is correctly wired for guide pages with `lastUpdated`.
  - Transport pages do not emit datePublished yet (HowToGetHereContent.tsx deferred).
  - Field type design resolved: dual-field approach — `richResultsVerdict: string | null` (raw) + `articleStructuredDataValid: boolean | null` (derived).
  - No downstream consumers of monitoring JSON in any application code.

## Proposed Approach

- Option A: Add richResultsResult extraction inline within existing `inspectUrl()` — keep return type as `IndexStatusResult | null` and add richResultsResult as a side effect or second return value via tuple.
- Option B: Change `inspectUrl()` to return a combined object `{ indexStatus: IndexStatusResult | null; richResults: RichResultsResult | null }`, then extract both in `main()`.

- Chosen approach: **Option B** — the combined-object return is explicit, TypeScript-idiomatic, and keeps `main()` as the single place where all field extraction happens. Option A with a tuple is less readable; a side effect would be an anti-pattern. The inspectUrl() change is internal (single caller: main()). This is the approach described in the fact-find Planning Constraints.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (task overall confidence 75% — below 80% threshold; impact uncertainty from API field presence deferred to post-delivery observation)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extend gsc-url-inspection-batch.ts with richResultsResult capture | 75% | S | Complete (2026-02-26) | - | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single task; no parallelism needed |

## Tasks

### TASK-01: Extend gsc-url-inspection-batch.ts with richResultsResult capture

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `scripts/src/brikette/gsc-url-inspection-batch.ts` (updated); `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md` (run format note added)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Scout: `inspectUrl(` appears exactly 1 time in `main()` (line 286 of original). Confirmed single call site.
  - Scout: 4 result-push sites confirmed — (1) rate-limit-skip at loop top, (2) happy path, (3) RateLimitError catch, (4) general error catch. All 4 updated with new fields.
  - Compile check: `npx tsx --tsconfig scripts/tsconfig.json scripts/src/brikette/gsc-url-inspection-batch.ts /tmp/test-urls.json --dry-run` exited 0.
  - Dry-run stdout: "Dry run mode: would inspect 1 URLs" — confirmed TypeScript compiled cleanly.
  - `monitoring-log.md` updated: Run 01 note added acknowledging T+0 data gap; "Run Summary Fields" section added documenting richResultsVerdict, richResultsDetectedTypes, articleStructuredDataValid fields.
  - Commit: `9692c76d8d` (included in xa-uploader archive commit, staged files picked up by concurrent agent).
- **Affects:** `scripts/src/brikette/gsc-url-inspection-batch.ts`, `[readonly] scripts/src/brikette/gsc-auth.ts`, `[doc] docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — Script fully read (375 lines). Change is additive: 3 new types, return-type change on `inspectUrl()`, field extraction in `main()`. Single internal caller (main()). Held-back test at 80: no single known unknown would break compilation or produce wrong output — API uses optional chaining, absent field gracefully returns null. Score: 80.
  - Approach: 90% — Option B (combined object return) is TypeScript-idiomatic and matches the explicit field-assignment pattern already used in main(). No viable alternative. Score: 90.
  - Impact: 75% — Value deferred: impact materialises when guide pages index with datePublished and Google detects Article schema. Current indexed URL (transport page) likely won't show Article richResultsResult. However HowTo detection for that URL is a plausible immediate capture. Downward bias applied at 75 vs 80 because timing of first meaningful capture is genuinely unknown.
- **Acceptance:**
  - `gsc-url-inspection-batch.ts` TypeScript-compiles cleanly under `tsx --tsconfig scripts/tsconfig.json` (dry-run exits 0).
  - Output JSON for all URLs includes `richResultsVerdict: string | null`, `richResultsDetectedTypes: string[]`, `articleStructuredDataValid: boolean | null`.
  - For URLs with no structured data detected, these fields are `null`, `[]`, `null` respectively.
  - For a URL with detected structured data, `richResultsVerdict` contains the raw verdict string and `articleStructuredDataValid` correctly maps `"PASS"→true`, `"FAIL"→false`, `"VERDICT_UNSPECIFIED"→null`.
  - Existing `InspectionResult` fields (coverageState, lastCrawlTime, googleCanonical, userCanonical, verdict, indexingState, robotsTxtState, pageFetchState, sitemap) are unchanged.
  - Rate-limit, dry-run, and error paths are unaffected.
  - `monitoring-log.md` includes a standard structured-data note format for future run summaries.

- **Validation contract (TC-01 to TC-06):**
  - TC-01: `inspectUrl()` called with a URL that returns `richResultsResult: { verdict: "PASS", detectedItems: [{ richResultType: "Article", items: [{ name: "datePublished", value: "2024-12-01" }] }] }` → result object contains `richResultsVerdict: "PASS"`, `richResultsDetectedTypes: ["Article"]`, `articleStructuredDataValid: true`. [Manual fixture test or live run with indexed guide page]
  - TC-02: `inspectUrl()` called with a URL that returns no `richResultsResult` field (absent) → result object contains `richResultsVerdict: null`, `richResultsDetectedTypes: []`, `articleStructuredDataValid: null`. [Dry-run + current T+0 re-run confirms all 29 unindexed URLs]
  - TC-03: `inspectUrl()` called with `richResultsResult: { verdict: "FAIL", detectedItems: [] }` → `richResultsVerdict: "FAIL"`, `richResultsDetectedTypes: []`, `articleStructuredDataValid: false`.
  - TC-04: `inspectUrl()` called with `richResultsResult: { verdict: "VERDICT_UNSPECIFIED" }` → `richResultsVerdict: "VERDICT_UNSPECIFIED"`, `articleStructuredDataValid: null`.
  - TC-05: Dry-run mode exits 0, `richResultsResult` types are present in the compiled output shape (TypeScript type-check gate).
  - TC-06: Rate-limit error path — when a RateLimitError is thrown, the result still populates `richResultsVerdict: null`, `richResultsDetectedTypes: []`, `articleStructuredDataValid: null` (same as absent-field pattern). No breakage of existing error path structure.

- **Execution plan:** Red → Green → Refactor
  - **Red:** No test for richResultsResult extraction currently exists. Script has zero unit tests; TC-01/TC-02 are validated manually or via live run. TypeScript type-check is the primary gate.
  - **Green:**
    1. Add `RichResultsDetectedItem` type: `{ richResultType?: string; items?: Array<{ name?: string; value?: string }> }`.
    2. Add `RichResultsResult` type: `{ verdict?: string; detectedItems?: RichResultsDetectedItem[] }`.
    3. Extend `InspectUrlResponse.inspectionResult` to add `richResultsResult?: RichResultsResult`.
    4. Add `richResultsVerdict: string | null`, `richResultsDetectedTypes: string[]`, `articleStructuredDataValid: boolean | null` to `InspectionResult`.
    5. Change `inspectUrl()` return type from `IndexStatusResult | null` to `{ indexStatus: IndexStatusResult | null; richResults: RichResultsResult | null }`.
    6. Update `inspectUrl()` body to return `{ indexStatus: data?.inspectionResult?.indexStatusResult ?? null, richResults: data?.inspectionResult?.richResultsResult ?? null }`.
    7. Update all call sites of `inspectUrl()` in `main()` — extract `{ indexStatus, richResults }` from the return value, then use `indexStatus` where `result` was previously used.
    8. Extend the result-building block in `main()` (both the happy-path and all error/rate-limit paths) to set: `richResultsVerdict: richResults?.verdict ?? null`, `richResultsDetectedTypes: richResults?.detectedItems?.map(d => d.richResultType ?? "").filter(Boolean) ?? []`, `articleStructuredDataValid: richResults?.verdict === "PASS" ? true : richResults?.verdict === "FAIL" ? false : null`.
    9. For all error/rate-limit push paths (where `richResults` is unavailable), set the same three fields to `null`, `[]`, `null`.
    10. Add structured-data note format to `monitoring-log.md` template section.
  - **Refactor:** Review optional-chaining and null-fallback consistency; confirm all InspectionResult construction sites (happy-path + 2 error branches + rate-limit branch) have the new fields.

- **Planning validation (required for M/L):**
  - None: S-effort task. Direct file read was the planning evidence.

- **Consumer tracing (new outputs):**
  - `richResultsVerdict`, `richResultsDetectedTypes`, `articleStructuredDataValid` — written to `monitoring/run-<date>.json` only. No application code, no CI pipeline, no database reads these files. Confirmed from fact-find blast radius analysis. Safe to add without consumer updates.
  - `inspectUrl()` return type change: single caller is `main()`. No other files import this function. Confirmed: script has no exports, no cross-file callers.

- **Scouts:**
  - Confirm `inspectUrl()` has exactly one call site in `main()` before making the return-type change (search `gsc-url-inspection-batch.ts` for `inspectUrl(`).
  - Confirm `InspectionResult` construction sites — count how many places in `main()` push to `results[]` (happy path + RateLimitError branch + general error branch + rate-limit-skip branch = 4 sites). All 4 must receive the new fields.

- **Edge Cases & Hardening:**
  - `richResultsResult.detectedItems` is absent or empty → `richResultsDetectedTypes: []` (handled by `?? []` fallback).
  - `richResultsResult.detectedItems[i].richResultType` is undefined → filtered out by `.filter(Boolean)`.
  - `richResultsResult` present but `verdict` is an unexpected string value → stored raw in `richResultsVerdict`; `articleStructuredDataValid` maps to `null` (correct — only PASS/FAIL map to boolean).
  - Rate-limit error path: the `RateLimitError` catch block pushes a result with all existing fields null. The new fields must also be null in this branch (not left undefined, which would create inconsistent JSON shapes).
  - General error path: same as rate-limit — new fields must be explicitly set to `null`/`[]`/`null`.
  - Rate-limit-skip path (when `rateLimitHit` is true for subsequent URLs): same null defaults required.

- **What would make this >=90%:**
  - Empirically confirm that `richResultsResult` appears in the live API response for an indexed URL with valid Article structured data (a future guide-page indexation event or a targeted live test against `amalfi-positano-bus` to check HowTo detection).
  - Add a Jest unit test with a fixture JSON mock of the API response, exercising the extraction logic for TC-01 through TC-04.

- **Rollout / rollback:**
  - Rollout: Script change takes effect on the next manual monitoring run. No deployment, no migration, no configuration change.
  - Rollback: Revert `gsc-url-inspection-batch.ts` to the previous commit. No data migration needed (new fields are additive; existing run JSONs are unaffected).

- **Documentation impact:**
  - `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring-log.md` — add a standard structured-data note format line to the run summary template. Update Run 01 notes to acknowledge T+0 baseline had no richResultsResult capture (data gap acknowledged).

- **Notes / references:**
  - GSC URL Inspection API v1: `urlInspection.index.inspect`, `InspectUrlResponse.inspectionResult.richResultsResult`.
  - Fact-find: `docs/plans/seo-monitoring-datepublished-baseline/fact-find.md`.
  - T+0 baseline: `docs/plans/_archive/brikette-seo-api-optimization-loop/monitoring/run-2026-02-25.json`.
  - Contract tests for Article.datePublished: `apps/brikette/src/test/seo-extraction-contract.test.ts` (TC-06/TC-07/TC-06b — all pass, no changes needed).

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `richResultsResult` absent from API response even for indexed URLs with valid structured data (Google detection delay) | Medium | Low | Optional-chaining null fallbacks handle gracefully. Monitor over subsequent runs. |
| `detectedItems` shape differs from documented schema | Low | Low | Optional chaining throughout. Extraction produces empty array if shape is wrong — silent, non-breaking. |
| TypeScript error from `inspectUrl()` return-type change | Low | Low | No cross-file callers. Validate with `tsx --tsconfig scripts/tsconfig.json ... --dry-run` before commit. |
| Transport pages never show Article richResultsResult without datePublished wiring | High | Low | Expected. HowTo detection may still appear. Monitoring records correctly regardless. |
| Null conflation: `VERDICT_UNSPECIFIED` and "not detected" both produce `articleStructuredDataValid: null` | Low | Low | Mitigated by dual-field design: `richResultsVerdict` (raw string) distinguishes the two states. |
| One of 4 result-push sites in `main()` missed during implementation | Low | Medium | Explicit scout: count all 4 push sites before starting. Review all 4 in refactor step. |

## Observability

- Logging: None — script writes to stdout/stderr (existing behaviour unchanged).
- Metrics: None — output JSON is the artifact.
- Post-delivery check: Confirm next monitoring run JSON contains `richResultsVerdict`, `richResultsDetectedTypes`, `articleStructuredDataValid` keys for all 30 URLs (values may be null — that is correct for unindexed URLs).

## Acceptance Criteria (overall)

- [x] `gsc-url-inspection-batch.ts` TypeScript-compiles without errors under `tsx --tsconfig scripts/tsconfig.json`.
- [x] All 30-URL monitoring run output JSON contains the 3 new fields for every result entry.
- [x] Existing fields in `InspectionResult` are unchanged.
- [x] Rate-limit, error, and dry-run paths are unaffected.
- [x] `monitoring-log.md` has a standard structured-data note format documented.
- [x] Run 01 notes updated to acknowledge T+0 data gap.

## Decision Log

- 2026-02-26: Chosen approach B (combined object return from `inspectUrl()`). Rationale: TypeScript-idiomatic, single extraction site in `main()`, explicit return type. No alternative provides comparable clarity.
- 2026-02-26: Dual-field output design (`richResultsVerdict` raw + `articleStructuredDataValid` derived boolean). Rationale: preserves full fidelity while providing ergonomic query field. Eliminates VERDICT_UNSPECIFIED null-conflation risk.
- 2026-02-26: Auto-continue blocked at plan level (task confidence 75% — impact uncertainty). Build requires manual invocation after plan review.

## Overall-confidence Calculation

- TASK-01: S-effort (weight=1), confidence=75%
- Overall-confidence = 75% × 1 / 1 = **75%**

Note on confidence cap: Impact is capped at 75% (downward bias applied) because the timing of first meaningful capture (guide page indexation with Article structured data detection) is genuinely unknown and could be weeks away. Once a guide page indexes and richResultsResult is empirically observed in the API response, confidence would rise to ≥85%.
