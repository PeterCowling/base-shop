---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: mcp-server-reply
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/mcp-server-reply/analysis.md
Dispatch-IDs: IDEA-DISPATCH-20260306090000-0002, IDEA-DISPATCH-20260306090000-0003
Work-Package-Reason: Both dispatches target the same draft-generation pipeline in packages/mcp-server, were raised on the same day, and have overlapping fix surfaces (draft-generate.ts, coverage.ts, template-ranker.ts). One plan and one build cycle is more efficient than two sequential cycles with re-read overhead.
---

# MCP Server Draft Reply — Honesty Gate and Quality Enforcement Fact-Find Brief

## Scope

### Summary

Two related gaps in the Brikette AI email-reply pipeline remain partially unaddressed after recent
confidence-floor and booking-trigger fixes (commit 5eae09457f). This fact-find maps what is already
fixed, what is not, and what needs to be built.

**Gap 1 (Dispatch 0002):** The composite-path template selector (`selectQuestionTemplateCandidate`)
applies a flat 70% confidence floor but lacks the hinted/unhinted category distinction that the
single-question path (`selectSingleQuestionTemplate`) already has. A generic "faq" template (e.g.,
"Hostel Facilities and Services") can score ≥70% for an unknown question (e.g., "Do you have a
rooftop pool?") via synonym expansion of "pool" → "facility", "amenity". The selected template would
then produce a fluent but factually unrelated reply.

**Gap 2 (Dispatch 0003):** `draft_generate` computes and returns `delivery_status: "blocked"` when
`quality.passed === false`, but `gmail_create_draft` has no corresponding gate. The block lives only
in SKILL.md instructions to the AI agent. Any direct tool call, or an agent session that skips or
mis-reads that step, can create a Gmail draft for a failed-quality reply. Additionally, coverage
scoring in `coverage.ts` uses overly broad `TOPIC_SYNONYMS` (e.g., "pool" → "amenity", "facility"),
producing false-positive "covered" marks that hide real coverage gaps from the quality check.

### Goals

- Apply hinted/unhinted category distinction to `selectQuestionTemplateCandidate` (composite path),
  matching the logic already in `selectSingleQuestionTemplate`.
- Enforce `delivery_status: "blocked"` at the `gmail_create_draft` tool boundary (reject the call,
  not just warn in SKILL.md).
- Tighten `TOPIC_SYNONYMS` in `coverage.ts` to prevent generic facility terms ("amenity", "facility")
  from masking unknown-topic coverage gaps.

### Non-goals

- Rewriting the BM25 index or `rankTemplates` / `rankTemplatesPerQuestion` (working correctly for
  their role; the issue is downstream selection logic and synonym specificity).
- Semantic/LLM-based question understanding.
- Changing the `PER_QUESTION_FLOOR = 25` constant (already appropriate for candidate pre-filtering).
- Fixing the separate `booking_context` broadness beyond what commit 5eae09457f already did.

### Constraints & Assumptions

- Constraints:
  - All changes must stay within `packages/mcp-server`; no app-layer changes required.
  - `gmail_create_draft` schema change must be backward-compatible (new field optional with safe default).
  - Tests run in CI only (no local jest).
- Assumptions:
  - The `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` constant is the correct shared threshold; no new
    constant needed.
  - `deliveryStatus` passed into `gmail_create_draft` is self-reported by the caller (not looked up);
    enforcement is a belt-and-suspenders gate, not a cryptographic guarantee.

## Outcome Contract

- **Why:** When a guest asks about something the AI has not seen before, instead of flagging it as
  uncertain it picks its best guess and sends it as if it were correct. This risks giving guests wrong
  information about their booking or stay. Making the AI honest about what it does not know means
  staff only need to review the genuinely tricky cases. The AI also has a quality check that spots
  weak replies, but it is just a warning — staff can skip past it and send the reply anyway. Building
  a proper block means the quality bar is a guarantee, not just a guideline.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** (1) Composite-path template selection applies hinted-first logic —
  unknown-topic questions routed to follow_up_required instead of a fluent wrong template. (2)
  `gmail_create_draft` rejects calls with `deliveryStatus: "blocked"` at the tool boundary.
  (3) Coverage scoring false-positives reduced by tightening `TOPIC_SYNONYMS` for facility-type terms.
- **Source:** operator

## Current Process Map

- **Trigger:** Incoming guest email picked up by ops-inbox skill (`gmail_list_pending`).
- **End condition:** Gmail draft created (`gmail_create_draft`) and presented to staff for review/send.

### Process Areas

| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Interpretation | `draft_interpret` → `EmailActionPlan` (scenario, intents, workflow_triggers) | MCP tool | `tools/draft-interpret.ts` | `booking_context` still broad (acceptable per 5eae09457f) |
| Single-question template selection | `rankTemplates` → `selectSingleQuestionTemplate` → hinted-first (any confidence) + unhinted ≥70% | `tools/draft-generate.ts:1331–1348` | `tools/draft-generate.ts` | Fixed in 5eae09457f |
| Composite template selection | `rankTemplatesPerQuestion` → `selectQuestionTemplateCandidate` → flat ≥70% floor, no hinted/unhinted | `tools/draft-generate.ts:1321–1328` | `tools/draft-generate.ts` | **BUG**: faq templates score ≥70% for unknown topics via synonym expansion |
| Coverage scoring | `evaluateQuestionCoverage` in `draft_quality_check` uses `TOPIC_SYNONYMS` (pool→amenity etc) | `utils/coverage.ts` | `utils/coverage.ts:20–35` | False-positive "covered" for unknown-topic questions; false-partial for paraphrased answers |
| Quality gate (in-process) | `handleDraftQualityTool` → `quality.passed`, `failed_checks`, `warnings` → `computeDeliveryStatus` → `delivery_status` in output | `tools/draft-generate.ts:1603–1610` | `tools/draft-generate.ts` | `delivery_status` is computed and returned but not enforced downstream |
| Draft creation gate | ops-inbox SKILL.md step 7: "Do not call `gmail_create_draft` while `delivery_status === "blocked"`" | `.claude/skills/ops-inbox/SKILL.md:256–266` | SKILL.md only | **BUG**: gate is advisory text, not code; `gmail_create_draft` handler accepts any call |
| Gmail draft creation | `gmail_create_draft` → Gmail API | `tools/gmail-handlers.ts:375+` | `tools/gmail-handlers.ts` | No delivery_status check |

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/draft-generate.ts` — orchestrates full draft pipeline; calls template
  ranker, quality check, slot resolution; returns `delivery_status`
- `packages/mcp-server/src/tools/gmail-handlers.ts` — `handleCreateDraft` accepts `emailId`,
  `subject`, `bodyPlain`, `bodyHtml`; no delivery_status parameter

### Key Modules / Files

- `packages/mcp-server/src/utils/template-ranker.ts` — `rankTemplates`, `rankTemplatesPerQuestion`,
  `PER_QUESTION_FLOOR = 25`, `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70`, `SYNONYMS`
- `packages/mcp-server/src/tools/draft-generate.ts:1321–1348` — `selectQuestionTemplateCandidate`
  (composite) vs `selectSingleQuestionTemplate` (single); the composite variant lacks hinted-first logic
- `packages/mcp-server/src/utils/coverage.ts` — `TOPIC_SYNONYMS` (lines 20–35); `evaluateQuestionCoverage`
- `packages/mcp-server/src/tools/draft-quality-check.ts` — `runChecks`, `computeDeliveryStatus`
  (line 1603–1610 in draft-generate.ts; `draft-quality-check.ts` exposes `handleDraftQualityTool`)
- `packages/mcp-server/data/email-templates.json` — 180 templates; "Hostel Facilities and Services"
  (category: "faq") is a confirmed false-match risk for pool/facility questions

### Patterns & Conventions Observed

- Hinted/unhinted pattern: `selectSingleQuestionTemplate` (draft-generate.ts:1331) filters `policyCandidates`
  to `hintedCandidates` (matching scenario category set); accepts hinted at any confidence, unhinted
  only at ≥70%. `selectQuestionTemplateCandidate` does not do this — flat floor only.
- `computeDeliveryStatus` returns `"blocked"` when `quality.passed === false`. This field is present
  in the `draft_generate` JSON output but the `createDraftSchema` in `gmail-handlers.ts` has no
  corresponding input field.
- `TOPIC_SYNONYMS["pool"]` = `["swimming", "pool", "rooftop", "facility", "amenity", "outdoor", "water"]`.
  Any template body containing "facility" or "amenity" will satisfy a "pool" keyword match, pushing
  coverage to "covered" even when no pool is mentioned in the reply.

### Dependency & Impact Map

- Upstream dependencies:
  - `draft_interpret` produces `EmailActionPlan` with scenario classification; scenario categories
    feed into `resolveScenarioCategoryHints` (hinted set)
- Downstream dependents:
  - `ops-inbox` skill workflow (SKILL.md step 7) depends on `delivery_status` in draft_generate output
  - `gmail_create_draft` is the terminal action; enforcement change affects this tool's contract
- Likely blast radius:
  - `selectQuestionTemplateCandidate`: composite path only (multi-question emails); no change to
    single-question path or `rankTemplatesPerQuestion` itself
  - `gmail_create_draft` schema: additive-only (new optional `deliveryStatus` field); callers that
    omit it default to no enforcement (safe)
  - `TOPIC_SYNONYMS` tightening: affects all coverage evaluations; tightening means fewer false
    "covered" marks; could increase "partial" frequency for previously-masked gaps

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `rankTemplatesPerQuestion` floor | Unit | `__tests__/template-ranker.test.ts` TC-06-03 | Confirms rooftop pool → 0 candidates (below floor) with mock templates |
| Single-question hinted gate | Unit | `__tests__/draft-generate.test.ts` TC-01-01–TC-01-05 | Added in 5eae09457f; covers hinted/unhinted single-question logic |
| Composite rooftop pool path | Integration | `__tests__/draft-pipeline.integration.test.ts` SIM-02 | Tests multi-question with rooftop pool; verifies follow_up_required for unknown topic |
| `delivery_status` field presence | Unit | `__tests__/draft-generate.test.ts` (implicit) | Field is returned; no test that `gmail_create_draft` rejects on blocked |
| booking-issues reference check | Unit | `__tests__/draft-quality-check.test.ts` TC-02-01–TC-02-03 | Added in 5eae09457f |
| Coverage scoring | Unit | Inferred from `__tests__/draft-quality-check.test.ts` | No explicit test for TOPIC_SYNONYMS false-positive path |

#### Coverage Gaps

- Untested paths:
  - Composite-path hinted/unhinted gating (selectQuestionTemplateCandidate category logic — not yet
    written)
  - `gmail_create_draft` rejection when `deliveryStatus: "blocked"` passed — no test exists
  - `TOPIC_SYNONYMS` tightening impact on known questions (regression baseline needed)
- Test seams needed:
  - `createDraftSchema` needs a `deliveryStatus` field; handler rejects and returns error result

#### Recommended Test Approach

- Unit tests for: `selectQuestionTemplateCandidate` hinted-first variant; `gmail_create_draft`
  rejection on blocked; TOPIC_SYNONYMS tightening regression (pool/facility/amenity keywords)
- Integration tests for: composite multi-question email with one unknown topic (build on SIM-02)
- E2E: not required (no UI surface)

### Recent Git History (Targeted)

- `packages/mcp-server/src/tools/draft-generate.ts` (5eae09457f) — Added `selectSingleQuestionTemplate`
  with hinted-first + UNHINTED_TEMPLATE_CONFIDENCE_FLOOR; `selectQuestionTemplateCandidate` for
  composite path NOT updated with same pattern
- `packages/mcp-server/src/tools/draft-quality-check.ts` (5eae09457f) — Removed `booking-issues`
  from `STRICT_REFERENCE_CATEGORIES`
- `packages/mcp-server/src/tools/draft-generate.ts` (41940d851c) — Added `computeDeliveryStatus`
  and `delivery_status` field to output
- `packages/mcp-server/src/tools/draft-generate.ts` (b21eddddb2) — Split booking trigger into
  `booking_action_required` + `booking_context`

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI surface; MCP tool layer only | — | No |
| UX / states | Required | `followUpRequired: true` path exists; escalation fallback sentence appended | Composite path may still send wrong template instead of follow_up | Yes — verify composite follow_up state |
| Security / privacy | N/A | No auth or data-exposure change; `deliveryStatus` is caller-supplied, not verified | Caller could lie about status; acceptable given belt-and-suspenders design | No |
| Logging / observability / audit | Required | `email_fallback_detected` telemetry fires via `usedTemplateFallback` (draft-generate.ts:1502) and existing emission at line 1695; applies to composite path already | Regression check: verify composite follow_up path continues to emit after TASK-01 change | Yes |
| Testing / validation | Required | TC-01–TC-06 + SIM-02 exist; gaps noted above | 3 new test cases needed (composite gate, gmail reject, synonyms regression) | Yes |
| Data / contracts | Required | `createDraftSchema` in gmail-handlers.ts has no `deliveryStatus` field | Additive schema change required; downstream callers unaffected (optional field) | Yes |
| Performance / reliability | N/A | Changes are pure logic, no I/O or hot-path change | — | No |
| Rollout / rollback | Required | Single package; no migration; rollback = revert commit | `TOPIC_SYNONYMS` tightening could increase "partial" rate — monitor for regression in ops-inbox quality stats | Yes |

## Questions

### Resolved

- Q: Does `selectQuestionTemplateCandidate` (composite path) already apply hinted-first logic?
  - A: No. Lines 1321–1328 of `draft-generate.ts` apply a flat `>= UNHINTED_TEMPLATE_CONFIDENCE_FLOOR`
    check. No category hint filtering. The hinted-first logic was only added to `selectSingleQuestionTemplate`
    (lines 1331–1348) in commit 5eae09457f.
  - Evidence: `packages/mcp-server/src/tools/draft-generate.ts:1321–1348`

- Q: Can a "Hostel Facilities and Services" (category: faq) template actually score ≥70% for a
  "rooftop pool" question in production?
  - A: **Inferred risk — not verified by ranker test.** `expandQuery("Do you have a rooftop pool?")`
    appends synonyms including "facility", "amenity" (via `SYNONYMS["pool"]`). The "Hostel Facilities
    and Services" template is confirmed to exist (email-templates.json:344–347) and its subject/body
    likely contains these terms. If ≥2 of the ~7 expanded queryTerms appear in the template, the
    confidence formula (`matchedTerms.size / totalTerms * 100`) could reach ≥70. This is a plausible
    false-match path and warrants a guard, but the exact production score has not been verified with
    a ranker probe. TASK-01 should include a regression test that confirms the guard prevents this.
  - Evidence: `utils/template-ranker.ts:151–196` (SYNONYMS), `data/email-templates.json:344–347`

- Q: Is `delivery_status` enforced anywhere other than SKILL.md?
  - A: No. Searched all `packages/mcp-server/src` for `delivery_status.*blocked` and
    `blocked.*delivery_status` — no matches except `computeDeliveryStatus` (definition) and the
    SKILL.md text. `createDraftSchema` in `gmail-handlers.ts` has no `deliveryStatus` field.
  - Evidence: `tools/gmail-handlers.ts:66–70`, SKILL.md step 7

- Q: Does `TOPIC_SYNONYMS["pool"]` actually differ from `SYNONYMS["pool"]`?
  - A: Both exist and both contain "facility" and "amenity" for "pool". They serve different roles:
    `SYNONYMS` (template-ranker.ts) feeds BM25 query expansion (affects which templates surface as
    candidates); `TOPIC_SYNONYMS` (coverage.ts) feeds coverage keyword matching (affects quality-check
    pass/fail). The required fix for the quality-check false-positive is **coverage.ts only** —
    tightening `TOPIC_SYNONYMS` directly reduces false "covered" marks. Tightening `SYNONYMS` in
    template-ranker.ts is an optional additional improvement (reduces candidate noise for pool questions)
    but is a broader ranking-behavior change and is not required to satisfy the delivery-status gate
    or coverage-accuracy outcomes. It should be treated as a separate judgment call in the plan.
  - Evidence: `utils/template-ranker.ts:179` (`SYNONYMS["pool"]`), `utils/coverage.ts:23` (`TOPIC_SYNONYMS["pool"]`)

- Q: Would removing "amenity" and "facility" from SYNONYMS["pool"] break existing test cases?
  - A: Unknown without running tests, but the risk is low. These terms are over-broad for "pool" —
    removing them makes the ranker more specific, not less. The TC-06-03 test already confirms the
    expected behaviour (0 candidates) for real template data, so tightening synonyms should maintain
    that result.
  - Evidence: `__tests__/template-ranker.test.ts:233–242`

### Open (Operator Input Required)

- Q: Should `gmail_create_draft` silently reject (return error) or raise a loud error when
  `deliveryStatus: "blocked"` is passed?
  - Why operator input is required: Both are technically valid; the choice depends on whether the ops-inbox
    workflow should surface the block to staff (loud error) or simply prevent draft creation silently and
    let the `delivery_status` in `draft_generate` output serve as the signal. A loud error may be confusing
    in automated runs; silent may hide a bug.
  - Decision impacted: Error handling contract for `gmail_create_draft`
  - Decision owner: operator
  - Default assumption: Return a structured error result (non-throw) with a clear `blocked_reason` field.
    This is consistent with the tool's existing error-return pattern (`errorResult()`). Risk: agent may not
    surface it to staff if not checking the result.

## Confidence Inputs

- Implementation: 92% — Three bounded changes with clear entry points; no architectural ambiguity.
  Raise to 95% by confirming delivery_status gate design choice (open question above).
- Approach: 88% — Composite hinted-first pattern mirrors existing single-question code exactly.
  Coverage synonym tightening is a data change (low complexity). Gmail gate is a schema + handler
  change (low complexity). Raise to 93% with operator answer on error handling.
- Impact: 90% — Eliminates the last confirmed false-match path in composite mode; makes the quality
  block a code guarantee not just a text rule. Raise to 95% after verifying ops-inbox telemetry
  catches the new composite follow_up path.
- Delivery-Readiness: 90%
- Testability: 90% — All three changes are unit-testable. Existing SIM-02 provides integration
  regression baseline for composite path.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Tightening TOPIC_SYNONYMS increases "partial" rate for genuine pool/facility coverage in FAQ replies | Low | Low | Add regression test asserting "Hostel Facilities and Services" template body is marked "covered" for questions it genuinely answers |
| gmail_create_draft gate is bypassable if caller omits deliveryStatus | Medium | Low | Acceptable as belt-and-suspenders; tool cannot enforce without access to draft_generate internal state |
| Composite-path hinted-first change could suppress a valid low-confidence template that is the best available match | Low | Low | Hinted candidates accepted at any confidence (same as single-question path); only unhinted ones filtered |

## Planning Constraints & Notes

- Must-follow patterns:
  - `selectQuestionTemplateCandidate` update must mirror `selectSingleQuestionTemplate` pattern exactly
    (reuse `resolveScenarioCategoryHints` and the same `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR` constant)
  - `createDraftSchema` change must use optional field with `z.string().optional()` to preserve backward compat
  - New tests must follow existing `TC-NN-NN` naming and be in the correct `__tests__/` file
- Rollout/rollback expectations:
  - Single commit per task; no migration; instant rollback by revert
  - Monitor `draft-signal-events.jsonl` for change in `email_fallback_detected` frequency after deploy

## Suggested Task Seeds (Non-binding)

- TASK-01: Apply hinted-first logic to `selectQuestionTemplateCandidate` in `draft-generate.ts`
  (mirror `selectSingleQuestionTemplate`); add TC-01-06/07 (composite hinted + unhinted-rejected cases)
- TASK-02: Add optional `deliveryStatus` field to `createDraftSchema` in `gmail-handlers.ts`;
  reject with `errorResult()` when `"blocked"`; add TC-02-04 (blocked rejection) + TC-02-05 (absent = pass)
- TASK-03: Remove "amenity" and "facility" from `TOPIC_SYNONYMS["pool"]` in `coverage.ts`; add
  regression tests confirming known questions still score "covered" and unknown-topic questions
  (rooftop pool) score "missing" or "partial". Optional follow-up (separate decision): apply the
  same tightening to `SYNONYMS["pool"]` in `template-ranker.ts` to reduce candidate noise — this
  is a broader ranking-behaviour change and not required for the quality-gate outcome.

## Scope Signal

- **Signal:** right-sized
- **Rationale:** Three changes, each touching ≤30 lines of production code and ≤5 test cases.
  All entry points identified; blast radius is low (single package, no DB or API contract changes
  except one optional field addition). Existing SIM-02 integration test provides regression baseline.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Composite template selector (`selectQuestionTemplateCandidate`) | Yes | Missing hinted/unhinted distinction vs single-question path | No — identified as primary task |
| Single-question path (`selectSingleQuestionTemplate`) | Yes | Already fixed in 5eae09457f | No |
| Coverage scoring TOPIC_SYNONYMS | Yes | "pool" → "amenity"/"facility" causes false covered for unknown topics | No — identified as TASK-03 |
| `delivery_status` computation | Yes | Computed correctly by `computeDeliveryStatus` | No |
| `gmail_create_draft` gate | Yes | No code enforcement; SKILL.md only | No — identified as TASK-02 |
| Email template data | Yes | "Hostel Facilities and Services" confirmed as false-match candidate | No — fixed by TASK-01+TASK-03 |
| Test coverage for new paths | Partial | 3 gaps identified (composite gate, gmail reject, synonyms regression) | No — captured in TASK seeds |

## Evidence Gap Review

### Gaps Addressed

- Confirmed that `selectQuestionTemplateCandidate` lacks hinted-first logic by direct code inspection
- Confirmed "Hostel Facilities and Services" template (faq category) exists and contains facility/amenity terms
- Confirmed `gmail_create_draft` schema has no `deliveryStatus` field via `createDraftSchema` inspection
- Confirmed recent commits have addressed: booking-issues STRICT removal, delivery_status field, single-question hinted gate

### Confidence Adjustments

- Initial confidence was 90% (from dispatch); adjusted to 92% on implementation (clearer entry points)
- The remaining open question (error handling style for gmail gate) introduces minor approach uncertainty

### Remaining Assumptions

- Removing "amenity"/"facility" from `SYNONYMS["pool"]` will not break any integration test that
  expects those terms to count as pool synonyms. Confidence: 90%.
- Callers of `gmail_create_draft` (ops-inbox skill) will pass `deliveryStatus` from `draft_generate`
  output. If a caller omits it, the gate passes silently — this is the stated acceptable risk.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: CI passes (typecheck + lint + jest in CI); no regressions in
  existing SIM-02 and TC-01 through TC-06 suites; 3 new test cases pass
- Post-delivery measurement plan: monitor `draft-signal-events.jsonl` for `email_fallback_detected`
  events from composite path; check ops-inbox session logs for any new blocked-delivery events

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none (open question on error-handling style is advisory; default stated)
- Recommended next step: `/lp-do-analysis mcp-server-reply`
