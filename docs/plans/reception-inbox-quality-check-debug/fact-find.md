---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: reception-inbox-quality-check-debug
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-inbox-quality-check-debug/plan.md
Dispatch-ID: IDEA-DISPATCH-20260307153740-9203
Trigger-Why:
Trigger-Intended-Outcome:
---

# Reception Inbox Quality Check Debug Output Fact-Find Brief

## Scope

### Summary

When drafts fail quality checks in the reception inbox, the UI and MCP tool report check names (e.g. `"unanswered_questions"`, `"missing_policy_mandatory_content"`) but not which specific mandatory phrases were missing, which prohibited phrases were found, or which reference URLs were expected. Note: per-question detail is already partially available via the `question_coverage` array on `QualityCheckResult`, but policy, reference, and prohibited-claim checks return only a boolean — the specific failing items are either computed internally and discarded (policy phrases, reference URLs) or would require minor refactoring to capture (prohibited claims and thread contradictions currently return only booleans without capturing the matched phrase/commitment). The reception UI does not currently surface individual check names at all — `buildDraftQualityBadge()` shows only "Quality passed" / "Check before send".

### Goals

- Extend `QualityCheckResult` to include a new `failed_check_details` map that provides per-check actionable detail for checks that currently lack it
- Surface detail for: missing policy mandatory content (which phrases), policy prohibited content (which phrases), missing/inapplicable references (which URLs expected), prohibited claims (which phrases matched), contradicts_thread (which commitments contradicted). Note: unanswered questions already have detail via `question_coverage`.
- Ensure the MCP `draft_quality_check` tool returns the same enriched detail
- Ensure the parity snapshot and UI consumers are not broken

### Non-goals

- Changing the quality check logic itself (pass/fail thresholds, keyword matching)
- Redesigning the DraftReviewPanel UI (the detail will be available in the data; UI presentation is a separate concern)
- Changing the `draft_refine` tool's repair logic

### Constraints & Assumptions

- Constraints:
  - `QualityCheckResult` type is used in both the reception app (server-side) and the MCP server (duplicated code). Both must be updated in lockstep.
  - The parity snapshot type `AgentDraftParitySnapshot` only exposes `failed_checks: string[]` and `warnings: string[]` — adding detail must not break existing parity test fixtures.
  - The `draft_refine` tool reads `failed_checks` as `string[]` for repair dispatch; adding a new field is additive and non-breaking.
- Assumptions:
  - The `question_coverage` array is already computed and returned; the gap is that other checks (policy, reference) do not carry similar detail.
  - Adding a `failed_check_details` record alongside the existing `failed_checks` array is backward-compatible.

## Outcome Contract

- **Why:** When a draft fails quality checks, the operator sees only opaque check names. This makes it impossible to quickly understand what needs fixing without reading the full email and manually cross-referencing policy rules. Actionable detail saves review time and reduces missed issues.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Quality check failures include specific detail: which mandatory phrases are missing, which prohibited phrases were found, and which reference URLs were expected. Available in the quality result object returned by `runQualityChecks()` and the MCP `draft_quality_check` tool. Note: in the main inbox sync flow, failed drafts are not persisted (the thread flips to `needsManualDraft`), so detail is primarily consumed via the MCP tool and the regenerate API route (which does persist quality results). UI display of detail is a separate follow-up.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/reception/src/lib/inbox/draft-pipeline.server.ts` (line 151) — calls `runQualityChecks()` and returns full `QualityCheckResult` to the caller
- `packages/mcp-server/src/tools/draft-quality-check.ts` (line 576) — `handleDraftQualityTool` parses input, calls `runChecks()`, returns result via `jsonResult()`
- `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/regenerate/route.ts` — API route that calls `generateAgentDraft()` and stores `qualityResult` in the draft record

### Key Modules / Files

1. `apps/reception/src/lib/inbox/draft-core/quality-check.ts` — Reception app quality checker. Defines `QualityCheckResult` type and `runQualityChecks()`. Already computes `question_coverage: QuestionCoverageEntry[]` but does NOT compute per-item detail for policy/reference checks.
2. `apps/reception/src/lib/inbox/draft-core/coverage.ts` — `evaluateQuestionCoverage()` returns per-question `QuestionCoverageEntry` with `{ question, matched_count, required_matches, coverage_score, status }`.
3. `packages/mcp-server/src/tools/draft-quality-check.ts` — MCP server duplicate of the quality checker. Same logic, same return shape. Defines its own `QualityResult` type.
4. `packages/mcp-server/src/utils/coverage.ts` — MCP server duplicate of `coverage.ts`.
5. `apps/reception/src/lib/inbox/draft-pipeline.server.ts` — Pipeline orchestrator; `toParitySnapshot()` collapses quality result to `{ passed, failed_checks, warnings }`.
6. `apps/reception/src/components/inbox/presentation.ts` — `buildDraftQualityBadge()` only reads `quality.passed` — does not display check names or detail.
7. `apps/reception/src/components/inbox/DraftReviewPanel.tsx` — Renders the quality badge; does not currently display individual failed checks.
8. `packages/mcp-server/src/tools/draft-refine.ts` — Consumes `failed_checks` as `string[]` for repair routing (lines 525-576); does not use detail but would benefit from it for better repair targeting.
9. `apps/reception/src/lib/inbox/sync.server.ts` (line 668-675) — Stores `qualityResult` as JSON in the draft record.

### Patterns & Conventions Observed

- **Dual implementation pattern**: Quality check logic is duplicated between `apps/reception/src/lib/inbox/draft-core/` and `packages/mcp-server/src/tools/`. Both must be changed together. Evidence: identical function names (`runQualityChecks`/`runChecks`), identical check names, identical `question_coverage` structure.
- **Additive return type pattern**: The existing `question_coverage` field on `QualityCheckResult` demonstrates the pattern — rich per-item data returned alongside summary flags. The new `failed_check_details` follows this same pattern.
- **Parity snapshot lossy projection**: `toParitySnapshot()` in `draft-pipeline.server.ts` (line 108-129) deliberately drops `question_coverage` and `confidence`, keeping only `{ passed, failed_checks, warnings }`. The new detail field can similarly be excluded from parity snapshots.

### Data & Contracts

- Types/schemas/events:
  - `QualityCheckResult` (reception): `{ passed: boolean; failed_checks: string[]; warnings: string[]; confidence: number; question_coverage: QuestionCoverageEntry[] }`
  - `QualityResult` (MCP server): identical shape
  - `QuestionCoverageEntry`: `{ question: string; matched_count: number; required_matches: number; coverage_score: number; status: "covered" | "partial" | "missing" }`
  - `AgentDraftParitySnapshot.quality_result`: `{ passed: boolean; failed_checks: string[]; warnings: string[] } | null`
- Persistence:
  - Quality result stored as JSON blob in draft record via `sync.server.ts` and `regenerate/route.ts`
- API/contracts:
  - MCP tool `draft_quality_check` returns full `QualityResult` as JSON
  - The `draft_refine` tool internally calls `draft_quality_check` and reads `failed_checks` array for repair dispatch

### Dependency & Impact Map

- Upstream dependencies:
  - `evaluateQuestionCoverage()` in coverage.ts — already provides per-question detail
  - `policyDecision.mandatoryContent[]` and `policyDecision.prohibitedContent[]` — source of policy phrases
  - `requiresReferenceForActionPlan()` — computes `canonicalUrls` needed for reference detail
- Downstream dependents:
  - `draft-refine.ts` — reads `failed_checks` string array; new detail field is additive, no breakage
  - `toParitySnapshot()` — reads `passed`, `failed_checks`, `warnings`; new field excluded from snapshot
  - `buildDraftQualityBadge()` — reads only `quality.passed`; no impact
  - `DraftReviewPanel.tsx` — renders badge only; could later consume detail for richer display
  - Parity test fixtures — assert on `quality_result.failed_checks` as `string[]`; no impact if new field is separate
- Likely blast radius:
  - Small and well-contained. Two files need core changes (reception quality-check.ts, MCP draft-quality-check.ts). Type definitions change in two places. No downstream consumers break because the change is additive.

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Reception quality checks | Unit | `apps/reception/src/lib/inbox/__tests__/quality-check.test.ts` | Tests policy enforcement, language mismatch, question coverage breakdown |
| MCP quality check tool | Unit | `packages/mcp-server/src/__tests__/draft-quality-check.test.ts` | Tests individual check triggers (unanswered, prohibited, link, signature) |
| MCP draft refine | Unit | Multiple test files in `packages/mcp-server/src/__tests__/draft-refine.*.test.ts` | Tests repair logic per check type |
| Pipeline integration | Integration | `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` | End-to-end pipeline flow |

#### Coverage Gaps

- No test currently asserts on per-check detail content (since it does not exist yet)
- No test verifies that the detail map keys match `failed_checks` entries

#### Testability Assessment

- Easy to test: The detail is computed from data already available in scope. Unit tests can assert on the detail map contents for each check type.
- Test seams needed: None — existing test patterns work directly.

#### Recommended Test Approach

- Unit tests for: new `failed_check_details` field in both reception and MCP quality checkers, covering each check type
- Integration tests for: MCP `draft_quality_check` tool returns detail in JSON response
- Round-trip test for: reception regenerate API route persists enriched quality result in draft record

### Recent Git History (Targeted)

Not investigated: recent changes to the quality check area were not examined as the current code state is sufficient for this investigation.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is additive to existing return types. For policy/reference checks, the detail data is already in scope and just needs to be captured before the boolean reduction. For `prohibited_claims` and `contradicts_thread`, the helper functions need minor refactoring from boolean-return to returning the matched items. Two parallel implementations need updating but the logic is identical. No new dependencies, no schema migrations, no external service changes.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Reception quality-check.ts return type | Yes | None | No |
| MCP draft-quality-check.ts return type | Yes | None | No |
| coverage.ts / QuestionCoverageEntry | Yes | None | No |
| Policy phrase extraction (mandatory/prohibited) | Yes | None | No |
| Reference URL detail | Yes | None | No |
| Parity snapshot compatibility | Yes | None | No |
| Draft refine consumer compatibility | Yes | None | No |
| UI presentation layer | Yes | None | No |
| Persistence (JSON blob storage) | Yes | None | No |

## Questions

### Resolved

- Q: Does the quality checker already compute per-question detail?
  - A: Yes. `question_coverage: QuestionCoverageEntry[]` is already computed and returned, showing each question's text, matched keyword count, required matches, coverage score, and status (covered/partial/missing).
  - Evidence: `apps/reception/src/lib/inbox/draft-core/quality-check.ts` line 317, `apps/reception/src/lib/inbox/draft-core/coverage.ts` lines 5-11

- Q: Does the quality checker already have access to the specific policy phrases that failed?
  - A: Yes. `hasMissingPolicyMandatoryContent()` iterates `policyDecision.mandatoryContent` and checks each phrase. `hasPolicyProhibitedContent()` iterates `policyDecision.prohibitedContent`. Both have the phrases in scope but only return a boolean.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/quality-check.ts` lines 295-309

- Q: Does the quality checker already have access to the expected reference URLs?
  - A: Yes. `requiresReferenceForActionPlan()` returns `{ requiresReference: boolean; canonicalUrls: string[] }`. The canonical URLs are available when the reference check fails but are not included in the result.
  - Evidence: `apps/reception/src/lib/inbox/draft-core/quality-check.ts` lines 196-226, line 344

- Q: Will adding a new field to QualityCheckResult break the draft_refine tool?
  - A: No. `draft_refine` reads `failed_checks` as `string[]` for repair dispatch routing (lines 525-576 of draft-refine.ts). It destructures specific string values. A new `failed_check_details` field is additive and ignored by existing code.
  - Evidence: `packages/mcp-server/src/tools/draft-refine.ts` lines 525-576

- Q: Will the parity snapshot break?
  - A: No. `toParitySnapshot()` explicitly projects `{ passed, failed_checks, warnings }` from qualityResult. A new field is not included in the projection.
  - Evidence: `apps/reception/src/lib/inbox/draft-pipeline.server.ts` lines 120-126

### Open (Operator Input Required)

No open questions. All investigation questions were resolved from codebase evidence.

## Confidence Inputs

- Implementation: 95% — The data needed for detail is already computed or in scope within each check. The change is extracting and returning what already exists. Raises to >=90: already there.
- Approach: 90% — Additive field on existing type is the simplest and safest approach. Alternative (restructuring failed_checks to objects) would break downstream consumers. Raises to >=90: already there.
- Impact: 85% — Directly addresses the operator pain point. Detail is available in API responses and stored in draft records. UI consumption is a separate follow-up. Raises to >=90: confirming UI displays the detail (out of scope for this change).
- Delivery-Readiness: 90% — All entry points, types, and consumers are identified. No unknowns remain. Raises to >=90: already there.
- Testability: 90% — Existing test patterns extend naturally. Unit tests can assert on detail content for each check type. Raises to >=90: already there.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| MCP server and reception implementations diverge | Low | Medium | Both files are near-identical; change both in the same commit. Add a test comment noting the dual implementation. |
| Detail field increases JSON payload size for stored drafts | Low | Low | Detail is small (a few strings per failed check). No pagination or truncation needed. |
| draft_refine repair logic does not use new detail yet | N/A | Low | Additive — refine can adopt detail later for smarter repair targeting. Not a risk, just a follow-up opportunity. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Update both `apps/reception/src/lib/inbox/draft-core/quality-check.ts` and `packages/mcp-server/src/tools/draft-quality-check.ts` in lockstep
  - New field must be optional or have a default empty value for backward compatibility
  - Follow the existing `question_coverage` pattern: structured detail alongside summary flags
- Rollout/rollback expectations:
  - No feature flag needed — the change is additive data enrichment
  - Rollback is simply reverting the type change; no data migration
- Observability expectations:
  - None beyond existing quality check logging

## Suggested Task Seeds (Non-binding)

1. Define `FailedCheckDetail` type and add `failed_check_details` to `QualityCheckResult` in reception app
2. Update `runQualityChecks()` in reception app to populate detail for each check type
3. Mirror type and logic changes in MCP server `draft-quality-check.ts`
4. Add unit tests for detail content in both reception and MCP quality checkers
5. Verify parity snapshot and draft_refine compatibility (no-op confirmation)

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: Unit tests asserting detail content for each failed check type in both reception and MCP implementations
- Post-delivery measurement plan: Operator confirms quality check failures now show specific detail in MCP tool responses

## Evidence Gap Review

### Gaps Addressed

- Confirmed `question_coverage` is already computed and returned (not just internally available)
- Confirmed policy phrase data is in scope within the check functions but discarded to boolean
- Confirmed reference URL data is computed by `requiresReferenceForActionPlan()` but not returned in result
- Verified all downstream consumers (draft_refine, parity snapshot, UI badge) are unaffected by additive field
- Verified test landscape covers individual check types and can extend to detail assertions

### Confidence Adjustments

- No downward adjustments needed. All evidence slices confirmed the feasibility and safety of the additive approach.

### Remaining Assumptions

- The `prohibited_claims` check uses hardcoded strings in `containsProhibitedClaims()` rather than a configurable list. Detail for this check can report which specific prohibited claim phrase was found, but the list is small (4 phrases).
- The `contradicts_thread` check uses keyword matching against prior commitments. Detail can report which commitment was contradicted, but the matching is heuristic.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan reception-inbox-quality-check-debug --auto`
