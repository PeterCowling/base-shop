---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: email-pipeline-simulation-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/email-pipeline-simulation-hardening/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# Email Pipeline Simulation Hardening Fact-Find Brief

## Scope

### Summary

A four-thread simulation audit of the email draft pipeline in `packages/mcp-server` revealed six structural defects not addressed by the completed `email-day-to-day-readiness` plan. The defects fall into three layers: (1) intent extraction collapses compound clauses and double-counts interrogative requests before scenario ranking; (2) the composite template-selection path has no confidence threshold, and `booking_monitor` triggers too broadly; (3) the quality gate is advisory at the tool boundary and coverage scoring has a static synonym ceiling. The prior plan fixed multipart answer composition (TASK-02) and per-question fallback structure (TASK-03); this pass fixes the input and output quality guarantees around those improvements.

### Goals
- Atomize compound clause questions before scenario ranking so mixed-intent emails route correctly.
- Deduplicate question/request intents by source span to prevent double-coverage pressure.
- Apply a per-question minimum confidence floor before accepting any template block in composite mode.
- Narrow `booking_monitor` from any mention of "booking/reservation" to confirmed operational booking actions.
- Make quality gate state machine-enforced at the tool boundary (`delivery_status` field).
- Extend coverage synonym packs to be category-aware and add a topic-label secondary check.

### Non-goals
- Full LLM-first architectural replacement of the template pipeline.
- Changes to Gmail queue state, lock handling, or prepayment/cancellation wording semantics.
- Reworking reception-side API surfaces.

### Constraints & Assumptions
- Constraints:
  - Keep deterministic protected-category (`prepayment`, `cancellation`) behavior intact — no changes to their scenario rules or dominant-category logic.
  - Stay within `packages/mcp-server` scope.
  - Tests run in CI only; no local `jest` or `pnpm test` runs.
  - No force-pushes or `--no-verify` bypasses.
- Assumptions:
  - The existing `applyThresholds` function in `template-ranker.ts` (used on the single-template path) provides a usable threshold model that composite mode can adopt.
  - SYNONYMS dict in `coverage.ts` is authoritative for existing synonym expansion; extending it with category-aware entries is safe without touching the core stem-match algorithm.

## Outcome Contract

- **Why:** The completed `email-day-to-day-readiness` plan improved multipart answer composition, but a simulation audit showed the pipeline still drops sub-questions on mixed-intent emails, accepts semantically wrong template blocks for unknown topics, and can return failed-quality drafts with no machine enforcement. These gaps create routine operator patch work and erode trust in daily inbox use.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Compound guest emails produce one intent per clause with no double-counted requests; composite template blocks have a confidence floor so unknown topics get an explicit follow-up instead of a wrong answer; `quality.passed=false` is surfaced as a machine-enforced `delivery_status: blocked` that prevents Gmail draft creation.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/draft-interpret.ts` — `routeIntents()` (line 396): outer function driving question and request extraction; feeds `classifyAllScenarios` and `detectWorkflowTriggers`.
- `packages/mcp-server/src/tools/draft-generate.ts` — `handleDraftGenerateTool()` (line ~1550): composite trigger gate and `buildQuestionAnswerBlocks` call; also quality check call site and output shape.
- `packages/mcp-server/src/tools/draft-quality-check.ts` — `handleDraftQualityTool()` (line ~460): booking_monitor reference check and quality result.
- `packages/mcp-server/src/utils/template-ranker.ts` — `rankTemplatesPerQuestion()` (line 407): per-question BM25 ranking without threshold.
- `packages/mcp-server/src/utils/coverage.ts` — `evaluateQuestionCoverage()` (line 32): keyword-overlap coverage scoring.

### Key Modules / Files

- `packages/mcp-server/src/tools/draft-interpret.ts`
  - `extractQuestionsLegacy` (line 292): splits on `?`; compound clauses without `?` never produce an intent.
  - `extractQuestionsDeterministic` (line 333): splits on `.?!` or newlines, keeps only `?`-terminated segments — same limitation.
  - `extractRequestsLegacy` (line 305): 9 regex patterns including `/(can|could|would) you/` — intercepts question-stem phrasing, producing double entries when the same clause is also extracted as a question.
  - `routeIntents` (line 396): prefers deterministic path when `deterministicTotal >= legacyTotal`; falls back to legacy. Neither path atomizes compound coordinated clauses (e.g. "availability, and also cancellation policy" = 0 intents extracted if no `?`).
  - `detectWorkflowTriggers` (line 560): `booking_monitor: /(reservation|booking)/.test(lower)` — bare regex, no confidence weighting.
  - `DOMINANT_CATEGORIES` (line 570): `Set(["cancellation", "prepayment"])` — protected; these are out of scope for this pass.

- `packages/mcp-server/src/tools/draft-generate.ts`
  - `buildQuestionAnswerBlocks` (line 1258): `entry.candidates[0]` taken unconditionally — no score floor applied.
  - Composite trigger (line 1556): `actionPlan.intents.questions.length >= 2` — requires 2+ `?`-terminated questions; clause-level intents are never counted.
  - `includeBookingLink` (line 1671): `actionPlan.workflow_triggers.booking_monitor && !agreementTemplate` — the raw `booking_monitor` flag is passed to quality check.
  - Quality check call (line 1674, comment: "non-blocking — result shapes the output but never throws") — `quality.passed=false` never causes an early return; draft is always returned.

- `packages/mcp-server/src/utils/template-ranker.ts`
  - `rankTemplates` (single-template path, line ~393): calls `applyThresholds(candidates)` before returning.
  - `rankTemplatesPerQuestion` (composite path, line 407): does NOT call `applyThresholds`; raw BM25 results are returned. `buildQuestionAnswerBlocks` then takes `entry.candidates[0]` directly.

- `packages/mcp-server/src/tools/draft-quality-check.ts`
  - Line 481: `if (actionPlan.workflow_triggers.booking_monitor && !containsAnyLink) { failed_checks.push("missing_required_link"); }` — any email mentioning "reservation" or "booking" must contain a link or the draft fails.
  - Line 486–497: `requiresReferenceForActionPlan` + `hasApplicableReference` — second tier reference check also uses `booking_monitor`.

- `packages/mcp-server/src/utils/coverage.ts`
  - `extractQuestionKeywords` (line 24): max 5 non-stop-word keywords per question; long questions lose tail tokens.
  - SYNONYMS dict (line ~46): `variants = [keyword, ...(SYNONYMS[keyword] ?? [])]` — synonym expansion exists but is a static dict with no category-awareness.
  - `evaluateQuestionCoverage` (line 32): stem-match against bodySet; `status: "covered"` requires `matched_count >= required_matches` (threshold inferred from keyword count).

### Data & Contracts

- Types/schemas/events:
  - `IntentItem` — `{ text: string; evidence: string }` — no `type` flag distinguishing question vs request; both arrays live separately.
  - `WorkflowTriggers` — `{ prepayment: boolean; terms_and_conditions: boolean; booking_monitor: boolean }`.
  - `QuestionAnswerBlock` — `{ question, label, answer, answerSource, templateSubject, templateCategory, knowledgeCitation, followUpRequired }` — no `confidence` field exposed.
  - `PerQuestionRankEntry` — `{ question, candidates: TemplateCandidate[] }` — candidates are ordered by BM25 score but no threshold recorded in the entry.
  - Draft output (line 1768): includes `quality` sub-object with `passed`, `failed_checks`, `warnings`, `confidence`. No `delivery_status` field.
- Persistence:
  - Learning ledger writes occur when `quality.passed=false` (among other conditions) — these are downstream of the quality check and not relevant to the enforcement gap.

### Dependency & Impact Map

- Upstream dependencies:
  - `gmail.ts` provides raw email text → feeds `draft_interpret` → feeds `draft_generate`.
  - `template-ranker.ts` (BM25 index builder, `applyThresholds`) — used by both single and composite paths; `applyThresholds` already exists.
  - `brikette-knowledge.js` and `draft-guide.js` resources — mocked in tests; unchanged in this pass.
- Downstream dependents:
  - `ops-inbox/SKILL.md` — operator workflow reads `quality.passed` and `failed_checks` from the draft output; adding `delivery_status` extends the output contract without breaking existing reads (additive field).
  - `gmail_create_draft` tool — currently called after `draft_generate` returns; `delivery_status: blocked` gate can be checked by the caller.
  - Learning ledger (`reviewed-ledger.ts`) — quality failure capture is triggered conditionally; no change needed here.
  - Signal events (`signal-events.ts`) — consumes draft output telemetry; additive field is safe.
- Likely blast radius:
  - Narrow: all changes are within `packages/mcp-server`. No changes to Firebase, Gmail API, or any reception/prime app.
  - Risk surface: composite-mode change could affect any multi-question email — guarded by existing `draft-pipeline.integration.test.ts` pass-rate gate (≥0.90).

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (`/** @jest-environment node */`)
- Commands: `pnpm -w run test:governed -- jest -- --testPathPattern="<pattern>" --no-coverage`
- CI integration: tests run in CI only; do not run locally.

#### Existing Test Coverage

| Area | Test Type | File | Coverage Notes |
|---|---|---|---|
| Intent extraction | Unit | `draft-interpret.test.ts` | Covers deterministic/legacy routing; no clause-atomization cases |
| Intent routing parity | Unit | `draft-interpret.intent-routing-parity.test.ts` | Parity between legacy and deterministic paths |
| Template ranking | Unit | `template-ranker.test.ts` | Covers single path; no composite threshold test |
| Draft generation | Unit | `draft-generate.test.ts` | Mocks resources; covers single and composite paths |
| Pipeline E2E | Integration | `draft-pipeline.integration.test.ts` | Full interpret→generate→quality loop; 5 FAQ scenarios; pass rate ≥0.90 gate |
| Quality check | Unit | `draft-quality-check.test.ts` | Covers individual check assertions |
| Pipeline bugs | Unit | `pipeline-bugs.test.ts` | Regression corpus for known past defects |
| Workflow triggers | Unit | `workflow-triggers.test.ts` | Covers `detectWorkflowTriggers` |
| Coverage scoring | Unit (inferred) | `draft-generate.test.ts` | `evaluateQuestionCoverage` imported in pipeline test |

#### Coverage Gaps

- Untested paths:
  - Compound/coordinated-clause email with no `?` marks (the main atomization gap) — not in any current test.
  - Composite mode with a below-threshold BM25 match (unknown topic) — not present; tests use well-matched FAQ questions.
  - `delivery_status: blocked` enforcement — field does not exist yet.
  - `booking_monitor` false-positive scenario (plain FAQ mentioning "my booking" → link failure) — not in current corpus.
  - Category-aware synonym extension — no test exercises SYNONYMS dict with category labels.
- Test seams needed:
  - Clause tokenizer (new utility) should be unit-tested independently of `routeIntents`.
  - Per-question confidence floor in `buildQuestionAnswerBlocks` should have a dedicated unit test with a below-threshold candidate.

#### Recommended Test Approach

- Unit tests for: clause tokenizer, span-based deduplication, `delivery_status` gate, booking_monitor scope narrowing, per-question confidence floor.
- Integration tests for: four simulation scenarios (3-question FAQ, availability+cancellation, unknown-facility, refund dispute) added to `draft-pipeline.integration.test.ts`.
- No E2E required.

### Recent Git History (Targeted)

- `packages/mcp-server/src/tools/` — most recent relevant commit: `58f6c21426 feat(mcp-server): TASK-03 — draft cancellation confirmation on code-22 activity` — TASK-03 from `email-day-to-day-readiness`; no subsequent changes to draft-interpret, draft-generate, or coverage.ts after that commit. Confirms the simulation findings reflect current state.

## Questions

### Resolved

- Q: Does `applyThresholds` in `template-ranker.ts` exist and apply to the single-template path already?
  - A: Yes — confirmed at line 393: `return applyThresholds(candidates)`. It is NOT called by `rankTemplatesPerQuestion` (composite path, line 407). The threshold model is available for reuse in composite mode without new logic.
  - Evidence: `packages/mcp-server/src/utils/template-ranker.ts:393,407`

- Q: Does `extractRequestsLegacy` have any dedup guard today?
  - A: Yes, a `seen` Set dedups within the requests array (`draft-interpret.ts:318`). However there is no cross-dedup between the questions array and requests array. A polite question like "Could you tell me about availability?" is extracted both as a deterministic question (has `?`) and as a request (matches `(can|could|would) you`).
  - Evidence: `packages/mcp-server/src/tools/draft-interpret.ts:305-331`

- Q: Does `coverage.ts` have any synonym expansion today?
  - A: Yes — `SYNONYMS` dict exists and is applied at line 46. The gap is that it is a static flat dict, not category-labelled, so adding a synonym for "pool" would apply to any category, not just facility FAQs.
  - Evidence: `packages/mcp-server/src/utils/coverage.ts:46`

- Q: Is the composite path reachable today for the user-described compound clause email?
  - A: No. Composite requires `actionPlan.intents.questions.length >= 2`. A compound clause like "availability, and also cancellation policy" with no `?` produces 0 `?`-terminated questions from either extractor. The email routes as single-question or falls to fallback, never to composite.
  - Evidence: `draft-interpret.ts:333-348`, `draft-generate.ts:1556`

- Q: Does `booking_monitor=true` propagate to quality check when no booking ACTION is required?
  - A: Yes. `detectWorkflowTriggers` sets `booking_monitor=true` on any "reservation|booking" regex match. `draft-generate.ts:1671` computes `includeBookingLink = booking_monitor && !agreementTemplate` and passes it to quality check. So a plain FAQ like "What is your cancellation policy for my booking?" sets `booking_monitor=true` → quality requires a link → draft fails with `missing_required_link`.
  - Evidence: `draft-interpret.ts:560-566`, `draft-generate.ts:1671,1686`, `draft-quality-check.ts:481`

### Open (Operator Input Required)

- None. All questions are resolvable from code evidence and simulation findings.

## Confidence Inputs

- **Implementation: 88%**
  - Evidence: All affected functions are read with exact line numbers; data-flow traced end-to-end. `applyThresholds` is available for composite reuse; `IntentItem` shape is simple.
  - To reach 90%: confirm `applyThresholds` threshold values are appropriate for per-question use (may need per-category calibration), and verify no hidden caller of `delivery_status` in ops-inbox SKILL.md that would break on the additive field.

- **Approach: 85%**
  - Evidence: Clause atomization with a coordinating-conjunction splitter is a bounded NLP change. Per-question threshold reuse from existing `applyThresholds` is additive. `delivery_status` field is purely additive to existing output shape.
  - To reach 90%: prototype clause split on 3-4 representative inputs in tests before wiring into `routeIntents`.

- **Impact: 90%**
  - Evidence: Simulation confirmed the four defect categories with concrete email examples. The booking_monitor fix alone removes a class of false quality failures that fire on informational emails. The confidence floor prevents fluent-but-wrong template selection.
  - To reach 95%: run the four simulation scenarios through the actual governed test harness post-fix.

- **Delivery-Readiness: 86%**
  - Evidence: All changes are in `packages/mcp-server` with no external service changes. Test infrastructure is in place. Writer-lock and CI discipline apply.
  - To reach 90%: ensure clause tokenizer is fully unit-tested before wiring into `routeIntents` to prevent regression on existing extraction cases.

- **Testability: 88%**
  - Evidence: `draft-pipeline.integration.test.ts` with a pass-rate gate is the right harness for the four simulation scenarios. Individual unit tests are straightforward for the clause tokenizer and confidence floor.
  - To reach 90%: add the simulation scenarios to the integration test corpus before implementing fixes, so they start red → green.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Clause atomizer over-splits simple single-intent emails | Medium | Medium | Unit-test with ≥10 real inputs before wiring; keep atomizer as preprocessing step that feeds existing `routeIntents` unchanged |
| Confidence floor rejects valid low-score matches for niche questions | Low | Medium | Calibrate threshold against existing passing scenarios in `draft-pipeline.integration.test.ts`; keep floor below current `applyThresholds` minimum |
| `delivery_status: blocked` field breaks existing `ops-inbox/SKILL.md` callers | Low | Low | Field is additive; existing callers reading `quality.passed` are unaffected |
| booking_monitor narrowing accidentally suppresses legitimate operational flows | Low | High | Narrow definition must keep ALL prepayment and agreement flows passing; add explicit tests for prepayment email → booking_monitor=true still holds |
| Synonym extension introduces false positives in coverage | Low | Low | Category-aware additions scoped to new categories only; existing entries unchanged |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Clause-level extraction path (`extractQuestionsDeterministic`, `extractQuestionsLegacy`) | Yes | None — confirmed: `?`-split boundary only, compound clauses without `?` produce 0 intents | No |
| Cross-dedup between questions and requests arrays | Yes | Minor: `seen` Set exists within requests but not across questions+requests | No — confirmed, fix scope is clear |
| Composite trigger gate (`questions.length >= 2`) | Yes | None — gate confirmed at draft-generate.ts:1556 | No |
| `rankTemplatesPerQuestion` vs `rankTemplates` threshold difference | Yes | Confirmed: single path calls `applyThresholds`, composite does not | No |
| `booking_monitor` data flow (interpret → generate → quality check) | Yes | None — full propagation confirmed across 3 files | No |
| Quality gate return path (draft always returned) | Yes | Confirmed: comment at line 1674 explicit; no early-return on `quality.passed=false` | No |
| Coverage synonym expansion | Yes | Partial — SYNONYMS dict exists but is static/flat, no category label | No |
| Test corpus gaps | Yes | None — 4 simulation scenarios absent from `draft-pipeline.integration.test.ts` | No |

No critical simulation findings. All scope areas investigated.

## Scope Signal

- Signal: right-sized
- Rationale: All 6 defects are in the same package, well-bounded to 5 files, with no external service dependencies. The prior plan's scope discipline (stay within mcp-server, no protected-category changes) applies and holds. Three independent work streams (extraction, selection, quality enforcement) can be sequenced within one plan without blast radius concerns.

## Planning Constraints & Notes

- Must-follow patterns:
  - `DOMINANT_CATEGORIES` (`cancellation`, `prepayment`) must not be touched.
  - Clause atomizer must be a pure preprocessing step — feeds `routeIntents` input, does not replace it.
  - `delivery_status` is an additive output field — existing callers must not break.
  - Add simulation scenarios to `draft-pipeline.integration.test.ts` as the first task so they start red and the fix makes them green.
- Rollout/rollback expectations:
  - No feature flags needed — all changes are within the MCP tool layer with no external state mutation. Rollback = revert commit.
- Observability expectations:
  - `delivery_status` field in draft output is the primary observability artifact for the quality gate change.
  - Per-question `followUpRequired: true` blocks in existing output already expose the confidence threshold outcome.

## Suggested Task Seeds (Non-binding)

1. **TASK-01 (S)**: Add four simulation scenarios to `draft-pipeline.integration.test.ts` as failing cases — compound-clause FAQ, unknown-facility, availability+cancellation, high-stakes refund. This is the regression corpus prerequisite.
2. **TASK-02 (M)**: Implement clause-level intent atomization and span-based cross-dedup in `draft-interpret.ts`. New preprocessing step before `routeIntents`; unit tests cover ≥10 examples including protected-category emails.
3. **TASK-03 (S)**: Narrow `booking_monitor` in `detectWorkflowTriggers` — introduce `booking_action_required` signal vs `booking_context` flag; update quality check to use `booking_action_required` for link enforcement.
4. **TASK-04 (M)**: Apply per-question confidence floor in `rankTemplatesPerQuestion` / `buildQuestionAnswerBlocks`. Below-floor candidates produce `followUpRequired: true` instead of accepting candidate 0. Reuse or adapt `applyThresholds` from single-template path.
5. **TASK-05 (M)**: Add `delivery_status` field to draft output (`ready | needs_patch | blocked`); enforce `blocked` when `quality.passed=false` — prevent the caller from creating a Gmail draft without patching.
6. **TASK-06 (M)**: Extend `coverage.ts` SYNONYMS dict with category-aware synonym packs; add topic-label secondary check so paraphrased correct answers are not marked partial.

Sequencing: TASK-01 → {TASK-02, TASK-03, TASK-04} in parallel → TASK-05 → TASK-06.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: `draft-pipeline.integration.test.ts` pass-rate ≥0.90 with the four simulation scenarios included; no typecheck or lint errors in `packages/mcp-server`.
- Post-delivery measurement plan: Run `draft-pipeline.integration.test.ts` in CI; monitor `delivery_status` distribution and `followUpRequired` rate in operator inbox logs over next 2 weeks.

## Evidence Gap Review

### Gaps Addressed

- All affected function names and line numbers were read from actual source files — no inferred claims.
- `applyThresholds` availability on single-template path confirmed from `template-ranker.ts:393`.
- Cross-dedup gap confirmed from `draft-interpret.ts:318` — `seen` Set exists within requests, not cross-array.
- `booking_monitor` propagation traced through all three files: interpret (line 560) → generate (line 1671) → quality check (line 481).
- SYNONYMS dict presence confirmed at `coverage.ts:46` — reframes the fix as extension (not replacement).
- Test corpus inspected: `draft-pipeline.integration.test.ts` confirmed present; simulation scenarios confirmed absent.

### Confidence Adjustments

- Coverage scoring confidence raised slightly (was at "too lexical") because SYNONYMS dict already exists — work is extension, not rewrite. Effort estimate drops from M to S/M.
- Composite threshold gap raised confidence that `applyThresholds` can be reused rather than building a new threshold model — Implementation confidence at 88% reflects this.

### Remaining Assumptions

- `applyThresholds` threshold values are appropriate for per-question use without category-specific tuning. This will be visible in TASK-01 red/green results — if simulation scenarios pass unexpectedly, threshold may be too permissive.
- `booking_action_required` narrowing keeps all prepayment email paths passing. This is verifiable with existing `workflow-triggers.test.ts` cases.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan email-pipeline-simulation-hardening --auto`
