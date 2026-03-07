---
Type: Plan
Status: Active
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-quality-check-debug
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Quality Check Debug Output Plan

## Summary

Add a `failed_check_details` record to `QualityCheckResult` that provides per-check actionable detail when drafts fail quality checks. Detail is provided for checks where the failure reason is non-obvious and specific items can be reported: which mandatory policy phrases are missing, which prohibited phrases were found, which reference URLs were expected, which prohibited claims matched, which prior commitments were contradicted, and which questions went unanswered. Self-explanatory binary checks (`missing_plaintext`, `missing_html`, `missing_signature`, `missing_required_link`) do not populate detail entries — their check name alone is sufficient. The change is additive — the existing `failed_checks: string[]` array is unchanged, and a new `failed_check_details` field is added alongside it. Both the reception app quality checker and the MCP server duplicate are updated in lockstep.

## Active tasks

- [ ] TASK-01: Add FailedCheckDetail type and update QualityCheckResult in reception app
- [ ] TASK-02: Mirror type and logic changes in MCP server draft-quality-check.ts
- [ ] TASK-03: Add unit tests for failed_check_details in both implementations

## Goals

- Quality check failures carry specific detail: which items failed, not just which check failed
- Both reception app and MCP server return enriched detail for the same set of checks where detail is actionable (policy, reference, prohibited claims, thread contradictions, unanswered questions). Note: `missing_plaintext` is unreachable via the MCP tool because its zod schema requires non-empty `bodyPlain`. `missing_html` is reachable in both (MCP `bodyHtml` is optional). All self-explanatory binary checks (`missing_plaintext`, `missing_html`, `missing_signature`, `missing_required_link`) have no detail entry by design
- Existing consumers (parity snapshot, draft_refine, UI badge) are unaffected

## Non-goals

- Changing quality check pass/fail logic or thresholds
- UI display of per-check detail (separate follow-up)
- Updating draft_refine to consume the new detail field

## Constraints & Assumptions

- Constraints:
  - Dual implementation must stay in sync (reception quality-check.ts and MCP draft-quality-check.ts)
  - `failed_check_details` must be additive — do not restructure `failed_checks: string[]`
  - Parity snapshot projection must not include the new field (keep it lossy as designed)
- Assumptions:
  - Helper functions (`containsProhibitedClaims`, `contradictsCommitments`, `hasMissingPolicyMandatoryContent`, `hasPolicyProhibitedContent`) can be refactored to return detail without changing their call sites' boolean semantics
  - No database schema changes needed — quality result is stored as JSON blob

## Inherited Outcome Contract

- **Why:** When a draft fails quality checks, the operator sees only opaque check names. This makes it impossible to quickly understand what needs fixing without reading the full email and manually cross-referencing policy rules. Actionable detail saves review time and reduces missed issues.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Quality check failures include specific detail: which mandatory phrases are missing, which prohibited phrases were found, and which reference URLs were expected. Available in the quality result object returned by `runQualityChecks()` and the MCP `draft_quality_check` tool.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reception-inbox-quality-check-debug/fact-find.md`
- Key findings used:
  - `question_coverage` detail already exists for unanswered questions — no work needed there
  - Policy phrases, reference URLs, and prohibited claims are computed internally but discarded to booleans
  - `containsProhibitedClaims()` and `contradictsCommitments()` need minor refactoring from boolean to detail-returning
  - All downstream consumers read only `failed_checks: string[]` — additive field is safe
  - Parity snapshot explicitly projects `{ passed, failed_checks, warnings }` — new field excluded

## Proposed Approach

- Option A: Add `failed_check_details: Record<string, string[]>` to `QualityCheckResult` — each key is a check name from `failed_checks`, value is an array of detail strings describing what specifically failed. Simple, flat, and easy to consume.
- Option B: Replace `failed_checks: string[]` with `failed_checks: Array<{ name: string; details: string[] }>` — richer but breaks all downstream consumers.
- Chosen approach: Option A. Additive field, zero breakage, follows the existing `question_coverage` pattern of structured detail alongside summary flags.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add FailedCheckDetail type and update quality checker in reception app | 85% | M | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Mirror type and logic changes in MCP server | 85% | S | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add unit tests for failed_check_details | 85% | S | Pending | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Define type, refactor helpers, populate detail in reception quality checker |
| 2 | TASK-02 | TASK-01 | Mirror identical changes in MCP server |
| 3 | TASK-03 | TASK-01, TASK-02 | Add tests for both implementations |

## Tasks

### TASK-01: Add FailedCheckDetail type and update quality checker in reception app

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `apps/reception/src/lib/inbox/draft-core/quality-check.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/draft-core/quality-check.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 85% - All helper functions identified; refactoring from boolean to detail-returning is straightforward but touches 4 functions. Evidence: fact-find lines 295-309, 94-101, 258-287, 196-226. Held-back test at 85: no single unknown would drop this below 80 — all data sources are in scope.
  - Approach: 90% - Additive `Record<string, string[]>` field follows existing `question_coverage` pattern. Evidence: fact-find patterns section.
  - Impact: 85% - Directly provides the operator-requested detail. Primary consumption via MCP tool and regenerate route. Evidence: fact-find outcome contract.
- **Acceptance:**
  - [ ] `QualityCheckResult` type has new `failed_check_details: Record<string, string[]>` field
  - [ ] When `unanswered_questions` fails, detail lists question texts with status "missing" (derived from existing `question_coverage`)
  - [ ] When `missing_policy_mandatory_content` fails, detail lists the specific mandatory phrases not found in the draft
  - [ ] When `policy_prohibited_content` fails, detail lists the specific prohibited phrases found in the draft
  - [ ] When `prohibited_claims` fails, detail lists which specific hardcoded claim phrase(s) matched
  - [ ] When `missing_required_reference` or `reference_not_applicable` fails, detail lists the expected canonical URLs
  - [ ] When `contradicts_thread` fails, detail lists the commitment text that was contradicted
  - [ ] When checks pass, `failed_check_details` is an empty object `{}`
  - [ ] `toParitySnapshot()` in `draft-pipeline.server.ts` does NOT include `failed_check_details` (no change needed — existing projection already excludes unknown fields)
- **Validation contract (TC-XX):**
  - TC-01: Draft with missing mandatory policy phrase -> `failed_check_details["missing_policy_mandatory_content"]` contains the missing phrase
  - TC-02: Draft with prohibited content -> `failed_check_details["policy_prohibited_content"]` contains the matched phrase
  - TC-03: Draft with prohibited claim ("availability confirmed") -> `failed_check_details["prohibited_claims"]` contains "availability confirmed"
  - TC-04: Draft with missing reference URL -> `failed_check_details["missing_required_reference"]` or `failed_check_details["reference_not_applicable"]` contains expected canonical URLs
  - TC-05: Draft contradicting prior commitment -> `failed_check_details["contradicts_thread"]` contains the contradicted commitment text
  - TC-06: Draft with unanswered questions -> `failed_check_details["unanswered_questions"]` lists the missing question texts
  - TC-07: All checks pass -> `failed_check_details` is `{}`
  - TC-08: `toParitySnapshot()` output unchanged (no `failed_check_details` key)
- **Execution plan:** Red -> Green -> Refactor
  1. Add `failed_check_details: Record<string, string[]>` to `QualityCheckResult` type
  2. Refactor `containsProhibitedClaims()` to return matched phrases instead of boolean; update call site to derive boolean from result
  3. Refactor `hasMissingPolicyMandatoryContent()` to return missing phrases instead of boolean; update call site
  4. Refactor `hasPolicyProhibitedContent()` to return matched phrases instead of boolean; update call site
  5. Refactor `contradictsCommitments()` to return contradicted commitment texts instead of boolean; update call site
  6. Capture `referencePolicy.canonicalUrls` in detail when reference checks fail
  7. Capture missing question texts from `question_coverage` entries with status "missing"
  8. Initialize `failed_check_details: {}` and populate it alongside each `failed_checks.push()` call
  9. Verify `toParitySnapshot()` does not need changes (it already projects only `{ passed, failed_checks, warnings }`)
- **Consumer tracing (new outputs):**
  - `failed_check_details` field on `QualityCheckResult`:
    - Read by: nothing yet (new field). Future consumers: UI components, MCP tool response.
    - `toParitySnapshot()` in `draft-pipeline.server.ts`: unchanged — projects only `{ passed, failed_checks, warnings }`. Safe because it uses explicit property selection.
    - `draft-refine.ts` in MCP server: reads `failed_checks` string array only. Does not destructure or spread the full object. New field is ignored. Consumer unchanged because: additive field, no TypeScript strict excess-property errors on the consuming side.
    - `sync.server.ts`: stores `qualityResult` as `Record<string, unknown>` via JSON — new field automatically included in persisted blob. Consumer unchanged because: it casts to generic Record.
    - `regenerate/route.ts`: passes `qualityResult` to `updateDraft`/`createDraft` — automatically includes new field. Consumer unchanged because: stores as JSON blob.
- **Planning validation (required for M/L):**
  - Checks run: Read all 4 helper functions, confirmed they have the failing items in scope. Confirmed `toParitySnapshot()` projects only named fields. Confirmed `draft-refine.ts` reads only `failed_checks` array.
  - Validation artifacts: fact-find evidence audit lines 72-80, 101-114
  - Unexpected findings: None
- **Scouts:** None: all data sources verified in fact-find
- **Edge Cases & Hardening:**
  - When `policyDecision` is undefined, `failed_check_details` has no policy-related keys (policy checks are skipped entirely)
  - When `question_coverage` has zero entries, `failed_check_details` has no `unanswered_questions` key
  - Multiple prohibited claims can match simultaneously — detail array should include all matched phrases, not just the first
  - `contradicts_thread` can match multiple commitments — detail should include all contradicted commitments
- **What would make this >=90%:**
  - Running the existing test suite after changes to confirm no regressions (build-time verification)
- **Rollout / rollback:**
  - Rollout: Deploy with normal release. No feature flag needed — additive data.
  - Rollback: Revert the commit. No data migration needed — persisted JSON blobs with extra field are harmlessly ignored by older code.
- **Documentation impact:**
  - None: MCP tool schema description could note the new field but is not mandatory
- **Notes / references:**
  - Reception quality-check.ts and MCP draft-quality-check.ts are near-identical duplicates. TASK-01 establishes the pattern; TASK-02 mirrors it.

### TASK-02: Mirror type and logic changes in MCP server draft-quality-check.ts

- **Type:** IMPLEMENT
- **Deliverable:** code-change in `packages/mcp-server/src/tools/draft-quality-check.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - Identical logic to TASK-01 applied to the MCP duplicate. Evidence: fact-find key modules 3-4. Held-back test at 85: no unknown — pure mirroring.
  - Approach: 90% - Same additive pattern as TASK-01.
  - Impact: 85% - MCP tool is the primary consumption surface for quality check detail.
- **Acceptance:**
  - [ ] `QualityResult` type in MCP server has `failed_check_details: Record<string, string[]>`
  - [ ] `runChecks()` populates detail identically to reception `runQualityChecks()`
  - [ ] `handleDraftQualityTool()` returns full result including detail via `jsonResult()`
- **Validation contract (TC-XX):**
  - TC-01: MCP `draft_quality_check` tool call with failing draft -> JSON response includes `failed_check_details` with expected entries
  - TC-02: MCP tool call with passing draft -> `failed_check_details` is `{}`
- **Execution plan:** Red -> Green -> Refactor
  1. Add `failed_check_details: Record<string, string[]>` to MCP `QualityResult` type
  2. Mirror all helper function refactors from TASK-01 (containsProhibitedClaims, hasMissingPolicyMandatoryContent, hasPolicyProhibitedContent, contradictsCommitments)
  3. Populate `failed_check_details` in `runChecks()` identically to reception `runQualityChecks()`
- **Consumer tracing (new outputs):**
  - `failed_check_details` on MCP `QualityResult`:
    - `handleDraftQualityTool()` returns via `jsonResult(result)` — automatic, no change needed.
    - `draft-refine.ts` `parseQualityGateResult()`: parses JSON as `{ passed, failed_checks, warnings }` — does not destructure or assert on extra fields. Consumer unchanged because: it only reads the three named fields.
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: pure mirror of TASK-01
- **Edge Cases & Hardening:** Same as TASK-01 (same logic, same edge cases)
- **What would make this >=90%:**
  - Confirming MCP tool tests pass after changes
- **Rollout / rollback:**
  - Rollout: Deploy with normal release
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - The MCP server uses `readFileSync` for template data and has its own `coverage.ts` — no changes needed in coverage module since question_coverage detail is already computed there

### TASK-03: Add unit tests for failed_check_details in both implementations

- **Type:** IMPLEMENT
- **Deliverable:** code-change in test files
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/__tests__/quality-check.test.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - Existing test patterns directly extend. Evidence: fact-find test landscape. Held-back test at 85: no unknown — test infrastructure is established.
  - Approach: 90% - Follow existing test fixture patterns.
  - Impact: 85% - Tests validate the core acceptance criteria.
- **Acceptance:**
  - [ ] Reception test file has assertions for `failed_check_details` content for: missing_policy_mandatory_content, policy_prohibited_content, prohibited_claims, missing_required_reference/reference_not_applicable, contradicts_thread, unanswered_questions
  - [ ] MCP test file has assertions for `failed_check_details` in tool JSON response
  - [ ] Tests assert `failed_check_details` is `{}` when all checks pass
  - [ ] Tests assert detail map keys are a subset of `failed_checks` entries (no orphaned details). Note: self-explanatory checks (`missing_plaintext`, `missing_html`, `missing_signature`, `missing_required_link`) intentionally have no detail entry.
- **Validation contract (TC-XX):**
  - TC-01: Test with mandatory content missing -> detail contains the missing phrase text
  - TC-02: Test with prohibited content present -> detail contains the matched phrase text
  - TC-03: Test with all checks passing -> detail is empty object
  - TC-04: Test that every key in `failed_check_details` exists in `failed_checks` (no orphaned detail). Self-explanatory checks (missing_plaintext, missing_html, missing_signature, missing_required_link) are excluded from this invariant — they have no detail entry by design.
- **Execution plan:** Red -> Green -> Refactor
  1. Add test cases to reception `quality-check.test.ts` asserting on `failed_check_details` content
  2. Add test cases to MCP `draft-quality-check.test.ts` asserting on `failed_check_details` in parsed JSON
  3. Add a structural test that `Object.keys(result.failed_check_details)` is a subset of `result.failed_checks`
- **Scouts:** None: test infrastructure verified in fact-find
- **Edge Cases & Hardening:** None: tests themselves are the hardening mechanism
- **What would make this >=90%:**
  - Adding parametric tests covering all check types systematically
- **Rollout / rollback:**
  - Rollout: Tests run in CI
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - Tests run in CI only per testing policy. Do not run locally.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add type and update reception quality checker | Yes | None | No |
| TASK-02: Mirror changes in MCP server | Yes — depends on TASK-01 pattern | None | No |
| TASK-03: Add unit tests | Yes — depends on TASK-01 and TASK-02 being complete | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dual implementation drift | Low | Medium | TASK-02 explicitly mirrors TASK-01; TASK-03 tests both |
| Increased JSON blob size in draft records | Low | Low | Detail is a few strings per failed check — negligible |
| Helper refactoring introduces regression | Low | Medium | Existing tests verify check pass/fail behavior; TASK-03 adds detail assertions |

## Observability

- Logging: None beyond existing quality check logging
- Metrics: None
- Alerts/Dashboards: None

## Acceptance Criteria (overall)

- [ ] `QualityCheckResult` (reception) and `QualityResult` (MCP) both include `failed_check_details: Record<string, string[]>`
- [ ] Detail is populated for checks where items can be enumerated: unanswered_questions, prohibited_claims, missing_policy_mandatory_content, policy_prohibited_content, missing_required_reference, reference_not_applicable, contradicts_thread. Self-explanatory binary checks (missing_plaintext, missing_html, missing_signature, missing_required_link) intentionally have no detail entry.
- [ ] Detail is empty object when all checks pass
- [ ] Existing parity tests and draft_refine tests continue to pass without modification
- [ ] New unit tests cover detail content for each check type

## Decision Log

- 2026-03-07: Chose additive `Record<string, string[]>` over restructuring `failed_checks` to avoid breaking downstream consumers. Agent-resolved — no operator input needed.
- 2026-03-07: Self-explanatory binary checks (missing_plaintext, missing_html, missing_signature, missing_required_link) do not populate detail entries. Their check name alone is sufficient — adding detail would be noise. Agent-resolved.
- 2026-03-07: [Adjacent: delivery-rehearsal] Regenerate route persistence round-trip test for `failed_check_details` — existing route test at `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` could be extended to assert the new field survives persistence. However, this is an integration-level concern that verifies JSON blob storage passthrough — the field is automatically included via the existing `qualityResult` pass-through. Routed to post-build follow-up if needed.

## Overall-confidence Calculation

- TASK-01: 85% * M(2) = 170
- TASK-02: 85% * S(1) = 85
- TASK-03: 85% * S(1) = 85
- Total: 340 / 4 = 85%
