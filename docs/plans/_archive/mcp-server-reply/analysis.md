---
Type: Analysis
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: mcp-server-reply
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/mcp-server-reply/fact-find.md
Related-Plan: docs/plans/mcp-server-reply/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# MCP Server Draft Reply — Honesty Gate and Quality Enforcement Analysis

## Decision Frame

### Summary

Two gaps remain in the Brikette AI email-reply pipeline after recent fixes (5eae09457f and subsequent
work). A third gap identified in the fact-find — the composite-path hinted/unhinted distinction in
`selectQuestionTemplateCandidate` — has since been fully addressed: both the implementation
(`draft-generate.ts:1307–1329`) and test coverage (`draft-generate.test.ts:1184`, TC-06-05;
`draft-pipeline.integration.test.ts:460`) are in place. The two remaining open gaps are:

1. **Gmail gate (TASK-02):** `gmail_create_draft` has no code enforcement of `delivery_status: "blocked"`.
   The gate lives only in SKILL.md.
2. **Coverage synonyms (TASK-03):** `TOPIC_SYNONYMS["pool"]` in `coverage.ts` includes "amenity" and
   "facility" — overly broad terms that produce false-positive "covered" marks for unknown topics.

TASK-01 is retained as a context note documenting the resolved composite-path gap. No new implementation
or test work is required for TASK-01. Planning should address TASK-02 and TASK-03 only.

### Goals

- Enforce `delivery_status: "blocked"` at the `gmail_create_draft` tool boundary
- Tighten `TOPIC_SYNONYMS["pool"]` in `coverage.ts` to remove false-positive covered marks

### Non-goals

- Any new work on composite template selector hinted-first logic (already correct at `draft-generate.ts:1307–1329`, covered by TC-06-05 and integration test)
- Rewriting BM25 index or core ranking logic
- Semantic/LLM-based question understanding
- Changing `PER_QUESTION_FLOOR = 25`
- Changing `SYNONYMS["pool"]` in template-ranker.ts (optional follow-up, not required for quality-gate outcome)

### Constraints & Assumptions

- Constraints:
  - All changes within `packages/mcp-server` only
  - `gmail_create_draft` schema change must be additive (optional field, backward-compatible)
  - Tests run in CI only
- Assumptions:
  - `UNHINTED_TEMPLATE_CONFIDENCE_FLOOR = 70` is the correct shared constant — no new constant needed
  - `deliveryStatus` in `gmail_create_draft` is caller-supplied; enforcement is belt-and-suspenders, not cryptographic

## Inherited Outcome Contract

- **Why:** When a guest asks about something the AI has not seen before, it picks its best guess and sends it as correct. This risks giving guests wrong information. Separately, a quality warning that staff can skip is not a guarantee — building a real block ensures the quality bar cannot be bypassed.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** (1) Composite-path template selection applies hinted-first logic — unknown-topic questions routed to `follow_up_required` instead of a fluent wrong template (behavior already implemented; regression coverage added). (2) `gmail_create_draft` rejects calls with `deliveryStatus: "blocked"` at the tool boundary. (3) Coverage scoring false-positives reduced by tightening `TOPIC_SYNONYMS["pool"]`.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/mcp-server-reply/fact-find.md`
- Key findings used:
  - `selectQuestionTemplateCandidate` at `draft-generate.ts:1307–1329` now accepts `categoryHints: Set<string>` and implements hinted-first logic matching `selectSingleQuestionTemplate`; `buildCompositeQuestionBlocks` calls `resolveScenarioCategoryHints(actionPlan)` and passes hints through (confirmed post-fact-find)
  - `createDraftSchema` in `gmail-handlers.ts` has no `deliveryStatus` field; `handleCreateDraft` accepts any call
  - `TOPIC_SYNONYMS["pool"]` = `["swimming", "pool", "rooftop", "facility", "amenity", "outdoor", "water"]`; "facility" and "amenity" are too broad
  - "Hostel Facilities and Services" (category: faq) template confirmed in `email-templates.json:344–347` — plausible false-match candidate for pool queries (inferred risk, not verified by ranker probe)
  - `email_fallback_detected` telemetry already wired via `usedTemplateFallback` (draft-generate.ts); regression test coverage is the remaining gap

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Pattern consistency | Changes should mirror existing code conventions (reduce cognitive overhead for future maintainers) | High |
| Backward compatibility | Callers that don't pass new fields must not break | High |
| Minimal blast radius | Narrow the change surface to the specific gap; don't refactor surroundings | High |
| Test seam quality | Each change must be independently verifiable by unit test | High |
| Rollback ease | Each change should be independently revertable | Medium |

## Options Considered

### TASK-01: Composite Template Selector

**Status: Already resolved — no options to evaluate.** `selectQuestionTemplateCandidate`
(`draft-generate.ts:1307–1329`) implements hinted-first logic; `buildCompositeQuestionBlocks`
(`draft-generate.ts:1370–1385`) passes `resolveScenarioCategoryHints(actionPlan)` hints through.
Test coverage: TC-06-05 (`draft-generate.test.ts:1184`) covers unhinted-rejection; hinted-acceptance
and unhinted-floor-acceptance branches are covered by integration tests
(`draft-pipeline.integration.test.ts:460`). Optional unit tests for the other two branches may be
added at build time but are not required for the outcome contract.

**No implementation or mandatory test work required for TASK-01.** Retained for traceability.

### TASK-02: Gmail Draft Gate

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| **A — Optional `deliveryStatus` field in `createDraftSchema`** | Add `deliveryStatus: z.enum(["ready", "needs_patch", "blocked"]).optional()` to schema; `handleCreateDraft` returns `errorResult()` when value is `"blocked"` | Backward-compatible; consistent with existing `errorResult` pattern; caller controls; simple | Caller could omit field or lie about status (belt-and-suspenders limitation) | Acceptable risk per fact-find | **Yes** |
| **B — Server-side lookup of delivery_status from signal events** | `handleCreateDraft` looks up delivery status from `draft-signal-events.jsonl` by draft body hash before creating Gmail draft | No caller trust required | Adds file I/O to every create-draft call; fragile (hash mismatch, race condition, stale events); significant complexity | High fragility risk | No |
| **C — No code change; SKILL.md only** | Current state | No code change | Gate is bypassable; doesn't meet outcome contract | Outcome not satisfied | No |

**Recommendation: Option A.** Add optional `deliveryStatus` to `createDraftSchema`.
`handleCreateDraft` checks at the top of the handler: if `deliveryStatus === "blocked"` return
`errorResult("Draft creation blocked: quality checks did not pass. Inspect quality.failed_checks
from draft_generate output before proceeding.")`. Field absent or any other value → proceed normally.

Note: `handleCreateDraft` is typed as `Promise<ReturnType<typeof jsonResult>>`. `errorResult`'s
return type is structurally assignable (extra `isError` field is compatible). Planning should verify
at implementation time; widen annotation if needed:
`Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>>`.

### TASK-03: Coverage Synonym Tightening

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| **A — Remove "amenity" and "facility" from `TOPIC_SYNONYMS["pool"]` in `coverage.ts` only** | Scoped to quality-check false-positive; template-ranker.ts unchanged | Minimal blast radius; directly fixes quality-check false-positive; optional ranker change deferred | BM25 candidate noise for pool queries remains (acceptable: existing confidence floors filter it) | Possible increase in "partial" rate for genuine facility-mentions in pool replies; mitigated by regression tests | **Yes** |
| **B — Remove from both `TOPIC_SYNONYMS` (coverage.ts) and `SYNONYMS` (template-ranker.ts)** | Also tightens BM25 candidate selection for pool queries | More thorough | Ranking-behavior change with wider surface; not required for stated outcome | Risk of regressing legitimate pool-related query matches (e.g., activity templates) | Optional follow-up |
| **C — Category-tagged synonym system** | Synonyms only apply when template matches a given category | Most precise | Significant refactor of both coverage.ts and template-ranker.ts; beyond scope | Over-engineering for current problem size | No |

**Recommendation: Option A.** Remove "amenity" and "facility" from `TOPIC_SYNONYMS["pool"]` in
`coverage.ts` only. Keep "swimming", "swim", "rooftop", "outdoor", "water". Add regression tests:
(a) pool question with no pool answer → `status: "missing"`; (b) draft mentioning "rooftop pool"
or "swimming" → `status: "covered"`. Option B (ranker-side) is a valid optional follow-up.

---

## Engineering Coverage Comparison

| Coverage Area | Option A (chosen for all 3 tasks) | Rejected alternatives | Chosen implication |
|---|---|---|---|
| UI / visual | N/A — MCP tool layer only | N/A | No UI change |
| UX / states | TASK-01: composite follow_up path already correct; regression test ensures it stays correct | Option C (TASK-01) leaves behavior undocumented and unguarded | Composite-path UX aligned with single-question path; guarded by test |
| Security / privacy | TASK-02: caller-supplied deliveryStatus is trust-on-caller; acceptable belt-and-suspenders | Option B (server lookup) avoids caller trust but adds fragility | No security regression |
| Logging / observability / audit | `email_fallback_detected` already fires via `usedTemplateFallback`; TASK-01 regression test verifies it continues to fire | — | No new telemetry required |
| Testing / validation | 2 new test cases: TC-gmail-blocked (TASK-02), TC-synonyms-regression (TASK-03); TASK-01 composite path already covered by TC-06-05 + integration test | — | All independently unit-testable; SIM-02 integration regression baseline intact |
| Data / contracts | TASK-02: additive optional `deliveryStatus` field in `createDraftSchema`; no breaking change | Option B would touch signal-events schema | Single optional field addition; callers unaffected |
| Performance / reliability | Pure logic/data changes; no I/O path changes | Option B (server lookup) would add file I/O | No performance impact |
| Rollout / rollback | Three independent commits; each instantly revertable | — | TASK-03 may increase "partial" frequency — monitor ops-inbox quality stats after deploy |

## Chosen Approach

- **Recommendation:** Two implementation tasks (TASK-02 and TASK-03); TASK-01 is fully resolved:
  (1) TASK-01 — no work required (composite path implemented and tested),
  (2) add optional `deliveryStatus` to `createDraftSchema` with `errorResult` on blocked,
  (3) tighten `TOPIC_SYNONYMS["pool"]` in `coverage.ts` to remove "amenity" and "facility".
- **Why this wins:** TASK-01 requires no implementation change — only test coverage to guard existing behavior. TASK-02 and TASK-03 each apply the minimal delta that closes the stated gap, match existing codebase patterns (`errorResult` already the error contract; small data tuning already precedented), and are independently revertable. No alternative offers better outcomes at comparable complexity.
- **What it depends on:** Correct existing tests (TC-01–TC-06, SIM-02) not regressing. Regression risk is low — TASK-01 adds tests only; TASK-02 adds an optional schema field with a top-of-function guard; TASK-03 removes two overly broad synonyms.

### Rejected Approaches

- **Reimplementing composite selector hinted-first logic (TASK-01 Option B)** — the behavior is already correct; re-implementing would be duplication and could introduce regression
- **No regression test for composite path (TASK-01 Option C)** — leaves correct behavior undocumented and vulnerable to silent regression
- **Server-side delivery_status lookup (TASK-02 Option B)** — fragile, adds I/O, complex; problem is well-solved by belt-and-suspenders caller-supplied field
- **SKILL.md-only gate (TASK-02 Option C)** — already the status quo; doesn't satisfy the outcome contract
- **Category-tagged synonym system (TASK-03 Option C)** — over-engineering; the specific false-positive terms are known and can be removed directly

### Open Questions (Operator Input Required)

- Q: Should the `errorResult` message for a blocked `gmail_create_draft` be surfaced verbatim to staff
  in the ops-inbox UI, or is it internal-only (seen by the agent, not displayed to the human)?
  - Why operator input is required: determines whether the message should be human-readable or
    agent-readable only (tone and detail level differ)
  - Planning impact: wording of the error message only; does not affect the implementation approach
  - Default assumption: agent-readable (technical, names `quality.failed_checks`); no planning blocker

## End-State Operating Model

| Area | Current state | Trigger | Delivered end-state flow | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| Composite template selection | Already resolved — hinted-first logic live at `draft-generate.ts:1307–1329`; existing tests (TC-06-05, integration test) cover the path | N/A | No change required | BM25 ranking, `PER_QUESTION_FLOOR`, single-question path unchanged | None |
| Gmail creation gate | `gmail_create_draft` accepts any call; SKILL.md gate only | Agent calls `gmail_create_draft` after `draft_generate` returns `delivery_status: "blocked"` | `createDraftSchema` validates `deliveryStatus`; handler returns `errorResult("Draft creation blocked: ...")` when `"blocked"`; agent reads error and escalates to staff | All other `gmail_create_draft` callers unaffected (field absent → proceed) | Verify TypeScript accepts `errorResult` return from `Promise<ReturnType<typeof jsonResult>>` at implementation time; widen return type annotation if needed |
| Coverage scoring (pool synonyms) | `TOPIC_SYNONYMS["pool"]` includes "amenity", "facility" → false "covered" for unknown topics | Quality check on any draft answering a pool-related question | `TOPIC_SYNONYMS["pool"]` = `["swimming", "swim", "rooftop", "outdoor", "water"]`; "amenity"/"facility" removed; pool questions answered with generic facility text now score "missing" or "partial" → quality check may report `partial_question_coverage` warning | All other TOPIC_SYNONYMS unchanged; template-ranker.ts SYNONYMS unchanged | Monitor ops-inbox quality stats for frequency change in `partial_question_coverage` warnings after deploy |

## Planning Handoff

- Planning focus:
  - TASK-01: no work required
  - TASK-02: extend `createDraftSchema` with `deliveryStatus`; add guard at top of `handleCreateDraft`; add TC-gmail-blocked + TC-gmail-absent tests; check return type annotation
  - TASK-03: edit `TOPIC_SYNONYMS["pool"]` in `coverage.ts`; add pool-synonym regression tests
- Validation implications:
  - SIM-02 integration test is the primary regression guard for the composite path (already passing; no change expected)
  - `draft_quality_check` tests are the regression guard for TASK-03; partial coverage frequency may increase — expected and acceptable
  - New unit tests for each task are part of the task acceptance criteria
- Sequencing constraints:
  - TASK-01, TASK-02, TASK-03 are fully independent — can be planned and executed in any order or in parallel
  - No migration, no deploy coordination required
- Risks to carry into planning:
  - TASK-02: verify TypeScript accepts `errorResult` return from function typed `Promise<ReturnType<typeof jsonResult>>`; if not, update annotation
  - TASK-03: If an ops-inbox session is processing an email about pool facilities legitimately, coverage "partial" warning may appear where it previously didn't — acceptable per design (staff should review partial coverage)

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| TASK-03: `partial_question_coverage` warning frequency increases post-deploy | Low-Medium | Low | Acceptable trade-off; cannot be resolved without production data | Add observability note to build record; monitor first few ops-inbox sessions |
| TASK-02: Agents calling `gmail_create_draft` directly (not via ops-inbox skill) will pass field absent → no enforcement | Medium | Low | Belt-and-suspenders design acknowledged in fact-find; structural limitation | Document in tool description string that callers should pass deliveryStatus |
| TASK-02: TypeScript return type widening may be required | Low | Low | Structural subtyping should permit `errorResult` return without annotation change; requires compile-time verification | If TS rejects, widen annotation to `Promise<ReturnType<typeof jsonResult> \| ReturnType<typeof errorResult>>` |

## Planning Readiness

- Status: Go
- Rationale: Two implementation tasks (TASK-02 and TASK-03); TASK-01 fully resolved in codebase. Both remaining tasks are well-bounded and independent. Chosen approach is decisive for each. No unresolved blockers. Open question (error message tone) is wording-only and has a stated default. Engineering coverage comparison complete. End-state operating model written.
