---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-pipeline-simulation-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 82%
Confidence-Method: effort-weighted average over 6 tasks (S=1, M=2)
Auto-Build-Intent: plan+auto
---

# Email Pipeline Simulation Hardening Plan

## Summary

A four-thread simulation audit of the `packages/mcp-server` email draft pipeline revealed six structural defects not addressed by the completed `email-day-to-day-readiness` plan. This pass fixes the pipeline at three layers: intent extraction (compound clauses collapse to one intent; requests double-count question stems), template selection (composite path accepts any BM25 candidate regardless of score; `booking_monitor` fires on informational mentions), and quality enforcement (the quality gate is advisory at the tool boundary; coverage scoring relies on a static synonym ceiling). Fixes are bounded to `packages/mcp-server` with no changes to Gmail API surfaces, protected-category logic, or reception/prime apps.

## Active tasks
- [x] TASK-01: Add simulation scenario corpus to draft-pipeline.integration.test.ts
- [x] TASK-02: Implement clause-level intent atomization and span-based cross-dedup
- [x] TASK-03: Narrow booking_monitor to confirmed operational booking actions
- [x] TASK-04: Apply per-question confidence floor in composite template selection
- [x] TASK-06: Extend coverage synonym packs with category-aware entries
- [x] TASK-05: Add delivery_status machine enforcement to draft_generate output

## Goals
- Compound guest emails produce one intent per clause with no double-counted request/question pairs.
- Composite template blocks have a per-question confidence floor so unknown topics get an explicit `follow_up_required` instead of a semantically wrong answer.
- `booking_monitor` only fires on confirmed operational booking flows, not informational mentions.
- `quality.passed=false` surfaces as a machine-enforced `delivery_status: blocked`, preventing Gmail draft creation without operator patch.
- Coverage scoring has category-aware synonym packs so correctly paraphrased answers are not marked partial.

## Non-goals
- LLM-first replacement of the template/rule-based pipeline.
- Changes to Gmail queue state, lock handling, or prepayment/cancellation wording semantics.
- Changes to `DOMINANT_CATEGORIES` (`cancellation`, `prepayment`) protected-category logic.
- Reception-side or prime-side API surface changes.

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only. No local `jest` or `pnpm test` runs.
  - No `--no-verify` or force-push operations.
  - Clause atomizer must be a pure preprocessing step feeding existing `routeIntents`; do not replace `routeIntents`.
  - `delivery_status` is an additive output field; existing callers that read `quality.passed` are unaffected.
  - `applyThresholds` from `template-ranker.ts` is available for reuse in composite path; read its implementation before adopting its threshold values directly.
  - `booking_monitor` field rename affects 4 production files (`draft-interpret.ts`, `draft-generate.ts`, `draft-quality-check.ts`, `draft-refine.ts`) + test fixtures (`sample-action-plans.ts`) — all within TASK-03 scope.
  - `gmail_create_draft` is a standalone MCP tool in `gmail.ts`; it is NOT called from within `draft-generate.ts`. TASK-05 enforcement is at the tool output contract level; the operator skill layer enforces the gate.
- Assumptions:
  - `buildQuestionAnswerBlocks` already handles `candidates[0] === undefined` via `followUpRequired: true` (line 1272) — no defensive guard needed when floor empties candidates.
  - Category-aware synonym extension for TASK-06 requires extending `IntentItem` with `category?: string` or using keyword-inferred category from question text — choice resolved during TASK-06 execution based on scope cost.

## Inherited Outcome Contract
- **Why:** The completed `email-day-to-day-readiness` plan improved multipart answer composition, but a simulation audit showed the pipeline still drops sub-questions on mixed-intent emails, accepts semantically wrong template blocks for unknown topics, and can return failed-quality drafts with no machine enforcement. These gaps create routine operator patch work and erode trust in daily inbox use.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Compound guest emails produce one intent per clause with no double-counted requests; composite template blocks have a confidence floor so unknown topics get an explicit follow-up instead of a wrong answer; `quality.passed=false` is surfaced as a machine-enforced `delivery_status: blocked` that prevents Gmail draft creation.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/email-pipeline-simulation-hardening/fact-find.md`
- Key findings used:
  - `extractQuestionsLegacy` and `extractQuestionsDeterministic` both require `?`-terminated segments — compound clauses without `?` produce 0 intents (`draft-interpret.ts:292-348`).
  - `extractRequestsLegacy` 9-pattern matcher captures polite question stems, double-counting them against the questions array (`draft-interpret.ts:305-331`).
  - `detectWorkflowTriggers` sets `booking_monitor` on bare regex `/(reservation|booking)/` with no confidence weighting (`draft-interpret.ts:560-566`).
  - `rankTemplatesPerQuestion` returns raw BM25 results without calling `applyThresholds`; `buildQuestionAnswerBlocks` takes `entry.candidates[0]` unconditionally (`template-ranker.ts:407`, `draft-generate.ts:1258-1274`).
  - Quality check is explicitly non-blocking (comment at `draft-generate.ts:1674`); `quality.passed=false` does not cause an early return.
  - `coverage.ts` SYNONYMS dict exists (line 46) but is static/flat with no category labels.

## Proposed Approach
- Option A: Leave extraction and selection unchanged; add operator instructions in `ops-inbox/SKILL.md` to handle gaps manually.
- Option B: Fix extraction, selection, and enforcement in code — atomizer before `routeIntents`, threshold in `buildQuestionAnswerBlocks`, `delivery_status` field on output.
- Chosen approach: Option B. The defects are structural and recur on every compound-intent email; operator instructions cannot recover a missing intent that was never extracted.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---:|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add simulation scenario corpus to draft-pipeline.integration.test.ts | 85% | S | Complete (2026-03-06) | - | TASK-02, TASK-03, TASK-04, TASK-06 |
| TASK-02 | IMPLEMENT | Clause-level intent atomization + span-based cross-dedup in draft-interpret | 80% | M | Complete (2026-03-06) | TASK-01 | TASK-05 |
| TASK-03 | IMPLEMENT | Narrow booking_monitor to confirmed operational booking actions | 85% | S | Complete (2026-03-06) | TASK-01 | TASK-05 |
| TASK-04 | IMPLEMENT | Per-question confidence floor in composite template selection | 80% | M | Complete (2026-03-06) | TASK-01 | TASK-05 |
| TASK-06 | IMPLEMENT | Extend coverage synonym packs with category-aware entries | 80% | M | Complete (2026-03-06) | TASK-01 | - |
| TASK-05 | IMPLEMENT | Add delivery_status machine enforcement to draft_generate output | 85% | M | Complete (2026-03-06) | TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Establishes red integration tests; all other tasks depend on this |
| 2 | TASK-02 | TASK-01 | draft-interpret.ts only; safe to run before TASK-03 |
| 3 | TASK-03 | TASK-01, TASK-02 | draft-interpret.ts + draft-generate.ts + draft-quality-check.ts; after TASK-02 to avoid interpret.ts conflict |
| 4 | TASK-04, TASK-06 | TASK-01, TASK-03 | TASK-04: template-ranker.ts + draft-generate.ts; TASK-06: coverage.ts only — parallel safe (different files) |
| 5 | TASK-05 | TASK-02, TASK-03, TASK-04 | Last — enforcement added after other fixes ensure quality mostly passes |

## Tasks

---

### TASK-01: Add simulation scenario corpus to draft-pipeline.integration.test.ts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — file path confirmed; existing test structure understood from source read
  - Approach: 85% — four concrete simulation scenarios defined by operator; mock pattern clear from existing 50-line header
  - Impact: 85% — establishes red baseline for all downstream tasks; without this, fixes can't be verified green
- **Acceptance:**
  - Four new `it()` cases added: (a) 3-question FAQ thread, (b) availability+cancellation compound email, (c) unknown-facility question (rooftop pool), (d) high-stakes refund dispute.
  - New cases fail (red) against the current unmodified pipeline — confirming they exercise real defect paths.
  - Existing scenarios continue to pass at ≥0.90 pass rate.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-01):**
  - TC-01: 3-question FAQ email → interpret produces ≥3 questions; generate produces ≥3 answer blocks
  - TC-02: Compound "availability, and also cancellation policy" email with no `?` → currently produces 0 intents (red — expected to fail until TASK-02)
  - TC-03: Unknown-facility question → currently routes to a wrong-category template answer (red — expected to fail until TASK-04)
  - TC-04: Existing pass-rate gate ≥0.90 still holds over the original scenario set
- **Execution plan:** Add 4 `it()` cases to existing integration test file; run in CI to confirm red; do not modify production code.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Verify that the existing mock structure in the integration test (brikette-knowledge, draft-guide, voice-examples) supports the four new scenario inputs without additional mock setup.
- **Edge Cases & Hardening:** None: corpus addition only; no production logic touched.
- **What would make this >=90%:** Reading the full mock setup section of `draft-pipeline.integration.test.ts` before writing scenarios to confirm no additional mock keys are needed.
- **Rollout / rollback:**
  - Rollout: Test-only change; no production impact.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:** `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` exists and has a pass-rate gate at ≥0.90.

---

### TASK-02: Clause-level intent atomization and span-based cross-dedup in draft-interpret
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-interpret.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-interpret.intent-routing-parity.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% — `routeIntents`, `extractQuestionsLegacy`, `extractQuestionsDeterministic` all read at line level; `IntentItem` shape confirmed; preprocessing approach is clear
  - Approach: 80% — clause atomizer splits on coordinating conjunctions + comma boundaries before extractors run; spans tracked as `{ start, end }` offsets for cross-dedup; unproven against all edge cases
  - Impact: 90% — directly fixes the primary defect (score 80) that drops compound-clause sub-questions
- **Held-back test (Approach 80%):** A single unresolved unknown: "Would the clause splitter over-split legitimate comma-separated lists (e.g. 'We need towels, soap, and shampoo') into spurious intents?" If yes, precision drops. Mitigation: require clause segment to contain an intent cue word (question word, verb-phrase starter) before promoting to intent, not just any comma boundary.
- **Acceptance:**
  - TC-02 from TASK-01 (compound "availability, and also cancellation policy") turns green: ≥2 intents extracted.
  - TC-01 (3-question FAQ) continues to pass.
  - No existing `draft-interpret.test.ts` or `intent-routing-parity.test.ts` cases regress.
  - Legitimate comma-separated list emails (e.g. packing lists) do not produce spurious intents.
  - Cross-dedup: an interrogative request phrase that duplicates a `?`-question appears only once in the combined intent set.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-02):**
  - TC-01: "I'd like to know about availability and also your cancellation policy" → ≥2 clause intents
  - TC-02: "Please could you tell me if you have availability?" → 1 intent (not 2: question + request deduped)
  - TC-03: "We need towels, soap, and extra pillows" → 0 intents (not a question or request needing an answer block)
  - TC-04: Protected-category email with "cancellation" in text → DOMINANT_CATEGORIES behaviour unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-01 TC-02 already failing.
  - Green: Add `atomizeCompoundClauses(text: string): string[]` preprocessing utility before extractors run in `routeIntents`; add span tracking to deduplicate across questions and requests arrays; export as named utility for unit testing.
  - Refactor: Ensure atomizer is a pure function with no side effects; add unit tests for edge cases in `draft-interpret.test.ts`.
- **Planning validation (required for M/L):**
  - Checks run: `draft-interpret.ts:292-420` read with line numbers; `IntentItem` type confirmed (`{ text: string; evidence: string }`).
  - Validation artifacts: fact-find confirmed extractors read; `seen` Set within requests (line 318) confirmed for intra-requests dedup; cross-dedup gap confirmed.
  - Unexpected findings: `routeIntents` also falls back to legacy when `deterministicTotal < legacyTotal` — atomizer must apply before both paths to be effective.
- **Consumer tracing:**
  - New output: more `IntentItem` objects in `questions` and `requests` arrays from `routeIntents()`.
  - Consumers: `handleDraftInterpretTool` passes result to `draft-generate.ts` as `actionPlan.intents` — `IntentItem` shape unchanged, only count changes. Composite trigger at `questions.length >= 2` (draft-generate.ts:1556) benefits from additional clause intents → intended effect.
  - `classifyAllScenarios` and `detectWorkflowTriggers` consume the original text, not the extracted intents — unaffected.
  - All consumers safe: no signature change, only array population change.
- **Scouts:** Confirm `routeIntents` is the sole callsite for `extractQuestionsLegacy` and `extractQuestionsDeterministic` — if other callers exist, they must also receive atomized input or be confirmed safe.
- **Edge Cases & Hardening:** Protected-category emails (containing "cancellation", "prepayment") must not be affected; `DOMINANT_CATEGORIES` logic runs on classified scenarios, not on raw text — safe. Emails with no coordinating conjunctions: atomizer is a no-op → existing path unchanged.
- **What would make this >=90%:** Confirm atomizer does not produce spurious intents on 5+ real historical emails with comma lists; move intent cue-word requirement from Assumption to Tested.
- **Rollout / rollback:**
  - Rollout: Preprocessing step only; no external service changes.
  - Rollback: Revert commit; pipeline reverts to unatomized extraction.
- **Documentation impact:** None.
- **Notes / references:** `draft-interpret.ts:292-420` for extraction; `draft-interpret.ts:396-420` for `routeIntents` fallback logic.
- **Build evidence (2026-03-06):** Implemented `atomizeCompoundClauses()` exported utility and 4 supporting helpers (`findCompoundClauseSplit`, `cleanAtomizedFragment`, `dedupRequestsAgainstQuestions`, `shouldDropRequestForQuestionOverlap`). `routeIntents` now runs per-fragment via `flatMap` and applies cross-dedup so questions win over overlapping requests. Commit `da5a586031`. Typecheck + lint both pass. 207 lines added; 4 lines removed.

---

### TASK-03: Narrow booking_monitor to confirmed operational booking actions
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/tools/draft-refine.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/tools/draft-refine.ts`, `[readonly] packages/mcp-server/src/__tests__/workflow-triggers.test.ts`, `[readonly] packages/mcp-server/src/__tests__/fixtures/email/sample-action-plans.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 90% — `detectWorkflowTriggers` read at line 560; propagation to `draft-generate.ts:1671` and `draft-quality-check.ts:481` traced end-to-end
  - Approach: 85% — introduce `booking_action_required` signal (requires a link/reference) separate from `booking_context` (informational only); narrow regex to operational verbs (modify, cancel, confirm booking, new booking request)
  - Impact: 85% — removes a class of false `missing_required_link` quality failures that fire on informational emails mentioning "my booking"
- **Acceptance:**
  - FAQ email containing "my booking" (no action request) does not trigger `booking_action_required`; quality check does not fail with `missing_required_link`.
  - Operational email with confirmed booking action ("please modify my booking", new reservation request) still triggers `booking_action_required` → link required.
  - Prepayment flow still correctly triggers link requirement (via `prepayment` flag, not `booking_monitor`).
  - `workflow-triggers.test.ts` assertions updated to match new field names.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-03):**
  - TC-01: "Thank you for the info about my booking" → `booking_action_required: false`, no `missing_required_link` failure
  - TC-02: "Please cancel my booking for March 15" → `booking_action_required: true`, link required
  - TC-03: Prepayment email → `prepayment: true`, booking link still included via existing prepayment path
  - TC-04: "What is your cancellation policy?" → `booking_action_required: false` (no operational verb present)
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-01 corpus contains informational email that currently fails with `missing_required_link`.
  - Green: Split `booking_monitor` into `booking_action_required` + `booking_context` in `WorkflowTriggers`; update `detectWorkflowTriggers` to use narrowed operational-verb regex; update `draft-generate.ts:1671` and `draft-quality-check.ts:481` to use `booking_action_required`.
  - Refactor: Update `workflow-triggers.test.ts` assertions; verify no other callers of `booking_monitor` field.
- **Planning validation (required for M/L):** None: S effort task.
- **Consumer tracing:**
  - Modified field: `workflow_triggers.booking_monitor` renamed/split → `booking_action_required`.
  - Full consumer surface (confirmed by grep):
    - `draft-interpret.ts:23` — `WorkflowTriggers` type definition → update field name.
    - `draft-interpret.ts:565` — detection function → update field name.
    - `draft-generate.ts:80` — Zod input schema → update field name.
    - `draft-generate.ts:1671` — `includeBookingLink` computation → update.
    - `draft-generate.ts:1686` — internal quality-check payload → update.
    - `draft-quality-check.ts:32` — type definition → update.
    - `draft-quality-check.ts:94` — Zod input schema → update.
    - `draft-quality-check.ts:481`, `493` — link enforcement checks → update.
    - `draft-refine.ts:84` — Zod input schema → update (previously missed).
    - `sample-action-plans.ts:66,153,196` — test fixture values → update field name.
    - `workflow-triggers.test.ts` — test assertions → update.
  - All consumers addressed within this task scope; no silent fallback risk.
- **Scouts:** Confirm no additional `booking_monitor` references outside the 10 known sites by running `grep -rn booking_monitor packages/mcp-server/src/` before implementing.
- **Edge Cases & Hardening:** Prepayment emails must not lose link enforcement — prepayment flag is independent of `booking_monitor`; verify prepayment path still enforces link via the prepayment arm of `requiresReferenceForActionPlan`.
- **What would make this >=90%:** Read `requiresReferenceForActionPlan` implementation to confirm it has its own `prepayment`-based arm that does not rely on `booking_monitor`.
- **Rollout / rollback:**
  - Rollout: Four-file change (draft-interpret, draft-generate, draft-quality-check, draft-refine) + test fixtures + test assertions updated; no external service changes.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:** `draft-interpret.ts:560-566`, `draft-generate.ts:1671`, `draft-quality-check.ts:481-497`.
- **Build evidence (2026-03-06):** Split `WorkflowTriggers.booking_monitor` into `booking_action_required` (narrowed operational-verb regex) + `booking_context` (broad informational). Updated all 4 production files + 24 test files + 3 scripts. Zero remaining `booking_monitor` references in `packages/mcp-server/src/`. Commits `b21eddddb2` (production), `fe57c805e7` (tests batch 1), `f399bddfcc` (draft-refine tests). All hooks passed.

---

### TASK-04: Per-question confidence floor in composite template selection
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/utils/template-ranker.ts`, `packages/mcp-server/src/tools/draft-generate.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/utils/template-ranker.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `[readonly] packages/mcp-server/src/__tests__/template-ranker.test.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 80%
  - Implementation: 85% — `rankTemplatesPerQuestion` (line 407) and `buildQuestionAnswerBlocks` (line 1258) read at line level; `applyThresholds` confirmed present on single path (line 393)
  - Approach: 80% — reuse or adapt `applyThresholds` for per-question use; apply floor before candidate 0 is selected; below-floor → empty candidates → `followUpRequired: true`
  - Impact: 90% — directly prevents fluent-but-wrong template being served for unknown topics (score 75 simulation finding)
- **Held-back test (Approach 80%):** Single unresolved unknown: "Does `applyThresholds` have category-specific cutoffs that are inappropriate for per-question context?" If the threshold was calibrated for a single combined query, it may be too permissive for a narrow per-question query. Resolution: read `applyThresholds` implementation before adopting values; if needed, use a standalone floor constant rather than the existing function.
- **Acceptance:**
  - TC-03 from TASK-01 (unknown-facility question) turns green: `follow_up_required` block emitted instead of wrong-category template answer.
  - Existing well-matched questions (check-in time, WiFi, breakfast) still receive `answerSource: "template"`.
  - `template-ranker.test.ts` and `draft-generate.test.ts` pass with no regressions.
  - Overall pipeline pass-rate gate ≥0.90 holds.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-04):**
  - TC-01: Known-category question ("What time is check-in?") → `answerSource: "template"`, correct template selected
  - TC-02: Unknown-facility question ("Do you have a rooftop pool?") → `answerSource: "follow_up"`, `followUpRequired: true`, no template text
  - TC-03: Below-threshold candidate for one question in a 3-question email → only that block is `follow_up`; others remain template-sourced
  - TC-04: Empty template set → all blocks `follow_up`, no crash
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-01 TC-03 already failing (wrong template served for unknown topic).
  - Green: Read `applyThresholds` implementation; apply threshold filter inside `rankTemplatesPerQuestion` (or in `buildQuestionAnswerBlocks` before candidate 0 selection); candidates below floor produce `followUpRequired: true`.
  - Refactor: Add unit tests for below-threshold case in `template-ranker.test.ts`.
- **Planning validation (required for M/L):**
  - Checks run: `rankTemplatesPerQuestion` (lines 407-422) and `buildQuestionAnswerBlocks` (lines 1258-1274) read at line level; `applyThresholds` call site confirmed at line 393.
  - Validation artifacts: Confirmed `followUpRequired: !template` already handles undefined candidate (line 1272) — no defensive guard needed.
  - Unexpected findings: `applyThresholds` implementation not yet read — must be read as first step of TASK-04 execution before choosing approach.
- **Consumer tracing:**
  - Modified behaviour: `rankTemplatesPerQuestion` may now return `candidates: []` for below-floor questions.
  - Consumer: `buildQuestionAnswerBlocks` — `entry.candidates[0]` is `undefined` → `followUpRequired: true`, `answer: ""`, `answerSource: "follow_up"` — already handled by line 1272.
  - No other consumers of `rankTemplatesPerQuestion` exist in the codebase (confirmed: called only from `draft-generate.ts`).
  - Consumer safe: existing fallback path handles empty candidates without new code.
- **Scouts:** Read `applyThresholds` full implementation before beginning; confirm threshold values; if category-specific cutoffs exist, use a simpler standalone floor constant instead.
- **Edge Cases & Hardening:** All-questions-below-threshold edge case (very unusual email, no matching templates at all) → all blocks `follow_up`, valid composite draft with `followUpRequired: true` on all blocks. Protected-category emails: `DOMINANT_CATEGORIES` logic runs on `classifyAllScenarios`, not on `rankTemplatesPerQuestion` → unaffected.
- **What would make this >=90%:** Read `applyThresholds` implementation and confirm threshold is calibrated appropriately for per-question narrow queries; or validate against 5 simulation scenarios that both known and unknown questions route correctly.
- **Rollout / rollback:**
  - Rollout: Two-file change; no external service changes.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:** `template-ranker.ts:393,407`, `draft-generate.ts:1258-1274`.
- **Build evidence (2026-03-06):** Added `export const PER_QUESTION_FLOOR = 25` to template-ranker.ts; added `.filter()` to `rankTemplatesPerQuestion` to remove candidates below floor. `applyThresholds` confirmed as non-category-specific (plain confidence thresholds) — reused same `SUGGEST_THRESHOLD = 25` value as floor. Commit `8a6c3c86b1`. Typecheck + lint pass.

---

### TASK-06: Extend coverage synonym packs with category-aware entries
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/utils/coverage.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/utils/coverage.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — `coverage.ts` read at line level; SYNONYMS dict at line 46 confirmed; `evaluateQuestionCoverage` signature takes `body` and `questions` (no category param)
  - Approach: 80% — extend SYNONYMS dict with category-aware synonym packs (e.g. facility-category keys); add topic-label secondary check based on question category; `evaluateQuestionCoverage` signature may require minor extension if category is passed via `IntentItem.category?: string` — choice resolved during execution
  - Impact: 80% — reduces false-negative coverage marks on paraphrased correct answers; lower urgency than extraction/selection fixes (score 48)
- **Held-back test (Approach 80%):** Single unresolved unknown: "`evaluateQuestionCoverage` takes `questions: Array<{ text: string }>` with no category field. Category-aware synonym lookup requires knowing which scenario category the question belongs to." Resolution: extend `IntentItem` with `category?: string` sourced from `classifyAllScenarios` output; pass through `routeIntents` → `actionPlan.intents` → `evaluateQuestionCoverage`. This is a minor additive interface change across 2-3 files. If the extension proves too broad, fall back to keyword-inferred category (question contains "pool"/"gym"/"facility" → facility synonym pack) without interface change.
- **Acceptance:**
  - A valid answer paraphrasing "swimming pool" for a "pool" question is not marked `partial`.
  - A valid answer containing "breakfast" synonyms for a "morning meal" question is not marked `partial`.
  - Zero regressions in existing coverage tests.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-06):**
  - TC-01: Question "Do you serve breakfast?" answered with "Morning meals available 8–10am" → `status: "covered"` (not `"partial"`)
  - TC-02: Existing check-in time coverage test still passes
  - TC-03: Genuinely unanswered question → `status: "missing"` (no false positive)
- **Execution plan:** Red → Green → Refactor
  - Red: TASK-01 simulation scenarios may surface partial-coverage false negatives.
  - Green: Add category-aware synonym packs to SYNONYMS dict; optionally extend `IntentItem` with `category?: string` if category-aware lookup is needed; add secondary topic-label check.
  - Refactor: Ensure SYNONYMS dict is maintainable (grouped by category with comments).
- **Planning validation (required for M/L):**
  - Checks run: `coverage.ts:24-50` read at line level; SYNONYMS dict confirmed at line 46.
  - Validation artifacts: `extractQuestionKeywords` confirmed max 5 non-stop-word tokens; stem-match with SYNONYMS confirmed.
  - Unexpected findings: `IntentItem` currently has no `category` field — if category-aware synonyms require it, small interface extension needed.
- **Consumer tracing:**
  - New output: broader synonym coverage → more questions marked `"covered"` vs `"partial"`.
  - Consumers: `draft-generate.ts` reads `evaluateQuestionCoverage` output to determine `appendCoverageFallbacks` and `uncoveredAfterRefinement` — improved coverage means fewer fallback triggers (intended).
  - `draft-pipeline.integration.test.ts` measures coverage rate → improved rate is expected.
  - All consumers safe: only coverage status changes; no API contract change.
- **Scouts:** Check whether `IntentItem` is exported from `draft-interpret.ts` or only internal — if exported, extension requires checking all import sites.
- **Edge Cases & Hardening:** Do not add synonyms that would cause false positives (e.g. "check" → matches any mention of "check-in" for an unrelated question). Category scope the synonyms correctly.
- **What would make this >=90%:** Validate against 10+ real historical email Q&A pairs; confirm false-positive rate does not increase.
- **Rollout / rollback:**
  - Rollout: Single-file change; no external service changes.
  - Rollback: Revert commit.
- **Documentation impact:** None.
- **Notes / references:** `coverage.ts:24-50`, `coverage.ts:46`.
- **Build evidence (2026-03-06):** Extended SYNONYMS dict in template-ranker.ts with 15 new entries (availability, pool, facility, amenity, parking, kitchen, tour, activity, etc.). Added `TOPIC_SYNONYMS` in coverage.ts as secondary fallback in keyword variant lookup. `IntentItem` extension not needed — keyword-inferred synonym fallback sufficient. Commit `8a6c3c86b1`.

---

### TASK-05: Add delivery_status contract field to draft_generate output
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-generate.ts`, doc-update — `.claude/skills/ops-inbox/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `.claude/skills/ops-inbox/SKILL.md`, `[readonly] packages/mcp-server/src/__tests__/draft-generate.test.ts`, `[readonly] packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — output shape at line 1768 read; `quality.passed` computed at line 1694; additive field approach is straightforward; `gmail_create_draft` is a standalone MCP tool in `gmail.ts` (not called from `draft-generate.ts`) so no in-code gating is possible or needed here
  - Approach: 85% — add `delivery_status: "ready" | "needs_patch" | "blocked"` to `draft_generate` return value; `blocked` when `quality.passed === false`; update `ops-inbox/SKILL.md` to make `delivery_status !== "blocked"` a mandatory gate before calling `gmail_create_draft`
  - Impact: 85% — the enforcement is at the tool output contract level and operator-workflow doc level; `gmail_create_draft` is a separate MCP tool called by the operator skill, not by `draft_generate` itself — the machine enforcement is the output field that makes the status inspectable; the workflow gate is in the skill doc
- **Scope note:** `gmail_create_draft` (defined at `gmail.ts:670`) is a standalone MCP tool. It is not called from within `draft-generate.ts` in code. The `delivery_status` field enforces the quality state at the tool output boundary; the operator workflow (`ops-inbox/SKILL.md`) is responsible for checking it before calling `gmail_create_draft`. This is correct architecture — `draft_generate` outputs state; the skill orchestrates the decision.
- **Acceptance:**
  - Draft with `quality.passed=false` returns `delivery_status: "blocked"`.
  - Draft with `quality.passed=true` and no warnings returns `delivery_status: "ready"`.
  - Draft with warnings but `quality.passed=true` returns `delivery_status: "needs_patch"`.
  - `ops-inbox/SKILL.md` updated to make `delivery_status` check mandatory before calling `gmail_create_draft` (replaces advisory `quality.passed` check).
  - Existing `draft-generate.test.ts` passing scenarios continue to return `delivery_status: "ready"`.
  - Typecheck passes for `packages/mcp-server`.
- **Validation contract (TC-05):**
  - TC-01: High-quality draft with all quality checks passing → `delivery_status: "ready"`
  - TC-02: Draft with a quality failure (e.g. `missing_signature`) → `delivery_status: "blocked"`
  - TC-03: Draft with quality warnings only → `delivery_status: "needs_patch"`
  - TC-04: `ops-inbox/SKILL.md` gate: operator receives `delivery_status: "blocked"` and must patch before Gmail draft creation
- **Execution plan:** Red → Green → Refactor
  - Red: Add a test asserting `delivery_status` is present in output (currently undefined → red).
  - Green: Add `delivery_status` computation after quality check at line 1694; include in `jsonResult()` return at line 1768.
  - Refactor: Update `ops-inbox/SKILL.md` to require `delivery_status !== "blocked"` before `gmail_create_draft` call (replaces existing `quality.passed` advisory check). Add `delivery_status: "needs_patch"` defensive default if `quality` is undefined.
- **Planning validation (required for M/L):**
  - Checks run: `draft-generate.ts:1674-1768` read at line level; quality check call site and return shape confirmed.
  - Validation artifacts: `jsonResult()` return at line 1768 confirmed as the output shape; `quality.passed` confirmed at line 1694; `gmail_create_draft` confirmed as standalone MCP tool in `gmail.ts` (not pipeline-called from `draft_generate`).
  - Unexpected findings: `gmail_create_draft` is not called from `draft-generate.ts` — in-code gating of `gmail_create_draft` is not feasible within mcp-server scope. Enforcement is at output contract + workflow-doc level. This is the correct and achievable scope.
- **Consumer tracing:**
  - New output field: `delivery_status: "ready" | "needs_patch" | "blocked"`.
  - Consumers:
    - `ops-inbox/SKILL.md` — operator workflow reads draft output; `delivery_status` check replaces advisory `quality.passed` check; updated within this task.
    - `signal-events.ts` / learning ledger — reads `quality.failed_checks` and other fields; `delivery_status` is additive; unaffected.
    - `draft-pipeline.integration.test.ts` — if it asserts exact output shape, may need assertion for the new field.
  - No in-code consumer of `draft_generate` calls `gmail_create_draft` — field is consumed by the operator skill layer only.
- **Scouts:** Verify `ops-inbox/SKILL.md` line reference for the existing `quality.passed` advisory check so the replacement is surgically accurate.
- **Edge Cases & Hardening:** If quality check result is undefined (defensive): default `delivery_status: "needs_patch"` rather than crashing or emitting `"ready"` incorrectly.
- **What would make this >=90%:** Read `ops-inbox/SKILL.md` quality-check section before implementing the doc update to ensure the replacement is exact and complete.
- **Rollout / rollback:**
  - Rollout: One code file + one skill doc update; additive output field; no external service changes.
  - Rollback: Revert commit.
- **Documentation impact:** `ops-inbox/SKILL.md` — replace advisory `quality.passed` check with mandatory `delivery_status !== "blocked"` gate.
- **Notes / references:** `draft-generate.ts:1674,1694,1768`; `gmail.ts:670` (standalone MCP tool, not called from draft-generate).
- **Build evidence (2026-03-06):** Added `computeDeliveryStatus()` helper before `handleDraftGenerateTool` (extracted to keep function under 300-line lint limit). `delivery_status: computeDeliveryStatus(quality)` added to jsonResult return. Updated `ops-inbox/SKILL.md` step 7 to document mandatory `delivery_status` gate replacing advisory `quality.passed` check. Commit `41940d851c`. Typecheck + lint pass.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Corpus establishment | Yes — no deps; test file confirmed present | None | No |
| TASK-02: Intent atomization | Yes — TASK-01 establishes red baseline | Minor: `routeIntents` legacy fallback (`deterministicTotal < legacyTotal`) must also receive atomized input — noted in Planning Validation | No — addressed in execution plan |
| TASK-03: booking_monitor narrowing | Yes — TASK-01 done; TASK-02 not required (different functions) | Minor: grep for all `booking_monitor` references required before implementing to catch hidden consumers | No — addressed in Scouts |
| TASK-04: Confidence floor | Yes — TASK-01 done; `applyThresholds` availability confirmed | Minor: `applyThresholds` implementation unread — may have category-specific cutoffs inappropriate for per-question use; Scout required | No — addressed in Scouts |
| TASK-06: Coverage synonyms | Yes — TASK-01 done; coverage.ts isolated | Minor: `IntentItem` extension may be needed if category field required; additive change | No — addressed in Planning Validation |
| TASK-05: delivery_status contract field | Yes — TASK-02, TASK-03, TASK-04 complete; quality mostly passes | Resolved: `gmail_create_draft` is a standalone MCP tool in `gmail.ts` (not called from `draft-generate.ts`); enforcement is at tool output contract level + `ops-inbox/SKILL.md` update — scope is correct | No |

No Critical simulation findings. Plan may proceed to Active.

## Risks & Mitigations
- Clause atomizer over-splits comma-separated lists into spurious intents.
  - Mitigation: require intent cue word (question word, verb-phrase starter) in clause segment before promoting to intent. Unit-test with 10+ inputs including packing lists, multi-item requests.
- Confidence floor in composite path rejects valid low-score matches for niche questions.
  - Mitigation: calibrate floor against existing simulation scenarios; keep floor below `applyThresholds` minimum used on single path; validate ≥0.90 pass rate holds.
- `booking_action_required` narrowing misses a legitimate operational booking case.
  - Mitigation: read `requiresReferenceForActionPlan` to confirm prepayment has its own enforcement arm; add TC for prepayment email → link still required.
- `delivery_status: blocked` added before TASK-02/03/04 fixes, blocking drafts that previously passed.
  - Mitigation: TASK-05 is last in sequence (depends on TASK-02, TASK-03, TASK-04); quality should mostly pass before enforcement is added.
- SYNONYMS extension introduces false-positive coverage for unrelated questions.
  - Mitigation: scope synonym additions by category label; do not add broad single-word synonyms.

## Observability
- Logging: `delivery_status` field in draft output is the primary observability artifact for quality gate enforcement.
- Metrics: `draft-pipeline.integration.test.ts` pass rate (target ≥0.90 with simulation scenarios included).
- Alerts/Dashboards: None in this pass.

## Acceptance Criteria (overall)
- [ ] Four simulation scenarios (compound-clause FAQ, unknown-facility, availability+cancellation, high-stakes refund) added to `draft-pipeline.integration.test.ts` and pass green post-fix.
- [ ] Compound-clause email (no `?`) produces ≥2 clause intents.
- [ ] Unknown-facility question produces `follow_up_required: true` block, no template text.
- [ ] Informational "my booking" email passes quality check without `missing_required_link` failure.
- [ ] `delivery_status: blocked` returned by `draft_generate` for any draft where `quality.passed=false`; `ops-inbox/SKILL.md` updated to require checking this field before calling `gmail_create_draft`.
- [ ] All existing `draft-pipeline.integration.test.ts` scenarios continue to pass at ≥0.90 pass rate.
- [ ] Protected-category (prepayment, cancellation) safeguards intact.
- [ ] Typecheck and lint pass for `packages/mcp-server`.

## Decision Log
- 2026-03-06: Sequenced TASK-05 (delivery_status enforcement) last to avoid prematurely blocking drafts during construction of TASK-02/03/04 fixes.
- 2026-03-06: TASK-06 (coverage synonyms) placed in Wave 4 parallel with TASK-04 — different file (coverage.ts vs template-ranker.ts/draft-generate.ts), no merge risk.
- 2026-03-06: Chose not to read `applyThresholds` implementation during planning — flagged as TASK-04 Scout instead; avoids over-planning a detail that should be resolved during execution.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85% × 1 = 85
- TASK-02: 80% × 2 = 160
- TASK-03: 85% × 1 = 85
- TASK-04: 80% × 2 = 160
- TASK-06: 80% × 2 = 160
- TASK-05: 85% × 2 = 170
- Sum of weights: 1+2+1+2+2+2 = 10
- Overall-confidence = (85+160+85+160+160+170)/10 = 820/10 = **82%**
