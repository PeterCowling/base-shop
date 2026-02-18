---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Mixed
Last-reviewed: 2026-02-18
Relates-to: docs/business-os/business-os-charter.md
Created: 2026-02-18
Last-updated: 2026-02-18
Build-Progress: TASK-01 complete (baseline artifact produced); TASK-00 pending (DECISION — requires human resolution); TASK-02..TASK-10 pending
Feature-Slug: email-draft-quality-upgrade
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-build
Supporting-Skills: lp-sequence, lp-replan, lp-fact-find
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Email Draft Quality Upgrade Plan

## Summary
This plan converts the fact-find into a staged mixed-track execution path that improves multi-question coverage, keeps deterministic safety guarantees, and adds measurable quality gates for Brikette email drafts. The sequence prioritizes quick operator wins first (skill flow patch + template/lint improvements), then core pipeline changes (`scenarios[]`, per-question ranking, shared coverage, and knowledge-backed patching), then full regression/evaluation hardening. The plan explicitly keeps cancellation/prepayment hard-rule behavior dominant and preserves additive compatibility for `EmailActionPlan`. LLM-in-tooling remains an explicit scope decision rather than an implicit side effect.

## Goals
- Improve draft completeness for multi-question emails without breaking deterministic safety behavior.
- Make knowledge-backed gap filling traceable and source-attributed.
- Upgrade composition from category-first to question-first coverage.
- Add measurable evaluation and regression gates before broader rollout.
- Preserve backwards compatibility for current `EmailActionPlan` consumers.

## Non-goals
- Replacing the MCP draft pipeline with an LLM-only generator in this wave.
- Redesigning Gmail inbox orchestration outside the draft-quality path.
- Shipping locale-specific template forks (IT/ES) in this wave.

## Constraints & Assumptions
- Constraints:
  - `scenario` singular must remain available while `scenarios[]` is introduced.
  - Cancellation/prepayment hard-rule categories remain dominant/exclusive.
  - Skill-level patching must not invent policy facts when sources are absent.
  - Validation stays targeted (`pnpm --filter <pkg> test -- <file>`); no unfiltered `pnpm test`.
- Assumptions:
  - Fact-find code inspection is accurate for current pipeline ordering (`draft_generate` before `draft_quality_check`).
  - Existing unit/integration tests in `packages/mcp-server/src/__tests__` are reliable extension points.
  - LLM insertion (if any) is deferred to a follow-on wave unless TASK-00 changes scope.

## Fact-Find Reference
- Related brief: `docs/plans/email-draft-quality-upgrade/fact-find.md`
- Key findings used:
  - Single-scenario model prevents robust multi-topic composition.
  - `knowledge_summaries` are computed but not injected into draft content.
  - No MCP tool currently performs semantic LLM reasoning.
  - Template inventory has high-frequency coverage gaps and at least one broken-link stub.
  - Current repository already has substantial test coverage for interpret/generate/quality/ranker behavior.

## Proposed Approach
- Option A: Deterministic-first upgrade now (selected): quick skill/doc bridge + additive model/data/code changes + regression harness; defer explicit LLM stage to checkpoint wave.
- Option B: Introduce a new LLM refinement MCP stage in this same wave.
- Chosen approach: **Option A**.

## Plan Gates
- Foundation Gate: **Pass**
  - Fact-find includes execution track, deliverable metadata, startup alias (`none`), testable code surfaces, and mixed-track scope evidence.
- Build Gate: **Fail (expected at planning start)**
  - Blocked by pending TASK-00 scope decision and unimplemented regression harness in TASK-09.
  - Pass criteria:
    - TASK-00 decision artifact finalized (LLM scope + versioning contract).
    - TASK-03/TASK-04/TASK-05 acceptance drafted and acknowledged by maintainer.
    - TASK-09 defines enforceable command contract for quality/regression checks.
- Sequenced: **Yes**
- Edge-case review complete: **Yes**
- Auto-build eligible: **No**
  - `Auto-Build-Intent` is `plan-only` and build gate is not satisfied.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-00 | DECISION | Lock v1.1 scope boundary (deterministic-first vs immediate LLM stage, versioning, locale policy) | 85% | S | Pending | TASK-01 | TASK-02, TASK-03, TASK-04, TASK-05 |
| TASK-01 | INVESTIGATE | Produce baseline quality/evaluation artifact and fixture manifest | 75% | M | Complete (2026-02-18) | - | TASK-00, TASK-09 |
| TASK-02 | IMPLEMENT | Patch `ops-inbox` workflow to perform mandatory post-quality gap patch loop | 85% | S | Pending | TASK-00 | TASK-10 |
| TASK-03 | IMPLEMENT | Add missing templates and enforce template-link/placeholder lint gates | 85% | M | Pending | TASK-00 | TASK-06, TASK-09 |
| TASK-04 | IMPLEMENT | Introduce additive multi-scenario action plan model with dominant/exclusive semantics | 85% | M | Pending | TASK-00 | TASK-06, TASK-08, TASK-09 |
| TASK-05 | IMPLEMENT | Extract shared coverage module and reuse across generate/quality tooling | 85% | M | Pending | TASK-00 | TASK-07, TASK-09 |
| TASK-06 | IMPLEMENT | Implement per-question template ranking and coherent composite assembly | 75% | M | Pending | TASK-03, TASK-04 | TASK-07, TASK-09 |
| TASK-07 | IMPLEMENT | Inject knowledge-backed answers with source attribution and escalation fallback | 75% | M | Pending | TASK-05, TASK-06 | TASK-09 |
| TASK-08 | IMPLEMENT | Improve implicit request/thread-context extraction and policy-safe language rules | 70% | M | Pending | TASK-04 | TASK-09 |
| TASK-09 | IMPLEMENT | Add end-to-end evaluation harness + non-regression command contract | 75% | M | Pending | TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 | TASK-10 |
| TASK-10 | CHECKPOINT | Horizon checkpoint for optional LLM refinement wave and rollout policy | 95% | S | Pending | TASK-02, TASK-09 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Baseline evidence and fixture inventory |
| 2 | TASK-00 | TASK-01 | Scope/authority decision locks downstream behavior |
| 3 | TASK-02, TASK-03, TASK-04, TASK-05 | TASK-00 | Quick ops bridge + foundational contracts in parallel |
| 4 | TASK-06, TASK-08 | TASK-03+TASK-04 for TASK-06; TASK-04 for TASK-08 | Composition/ranking and extraction/policy workstreams |
| 5 | TASK-07 | TASK-05, TASK-06 | Knowledge injection depends on coverage + assembly |
| 6 | TASK-09 | TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08 | Regression and evaluation gate activation |
| 7 | TASK-10 | TASK-02, TASK-09 | Replan checkpoint before any LLM-stage expansion |

## Tasks

### TASK-00: Lock v1.1 scope boundary (deterministic-first vs immediate LLM stage, versioning, locale policy)
- **Type:** DECISION
- **Deliverable:** `docs/plans/email-draft-quality-upgrade/decisions/v1-1-scope-boundary-decision.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `.claude/skills/ops-inbox/SKILL.md`, `[readonly] docs/plans/email-draft-quality-upgrade/fact-find.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-02, TASK-03, TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 90% - decision surfaces are explicit and bounded.
  - Approach: 85% - tradeoffs are known from fact-find open questions.
  - Impact: 90% - avoids conflicting architecture changes downstream.
- **Options:**
  - Option A: deterministic-first wave (Pattern A coverage module; no new LLM MCP tool).
  - Option B: include new `draft_refine` LLM stage in same wave.
- **Recommendation:** Option A
  - Rationale: lower blast radius and faster path to measurable quality gains.
- **Decision input needed:**
  - question: include explicit LLM refinement tool now or defer to next wave?
  - why it matters: changes latency/cost profile and test strategy.
  - default + risk: default `defer`; risk is slower semantic improvements.
  - question: `actionPlanVersion` format (`integer` vs `semver`)?
  - why it matters: compatibility checks and schema evolution policy.
  - default + risk: default `integer`; risk is less expressive release mapping.
  - question: locale policy for new templates (`english-only` vs `dual-language now`)?
  - why it matters: affects data model and QA burden.
  - default + risk: default `english-only`; risk is short-term locale gap.
- **Acceptance:**
  - Decision artifact records selected options, rationale, explicit out-of-scope list.
  - Decision artifact defines compatibility contract for `scenario` + `scenarios[]` and versioning semantics.
  - Decision artifact defines rollout trigger criteria for future LLM wave.
- **Validation contract:**
  - Decision closes only when no downstream task has conflicting interpretation of scope, versioning, or locale policy.
- **Planning validation:**
  - None: decision task.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds v1.1 scope decision record consumed by all IMPLEMENT tasks.

### TASK-01: Produce baseline quality/evaluation artifact and fixture manifest
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/email-draft-quality-upgrade/artifacts/quality-baseline-and-fixture-manifest.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Build evidence:** Artifact created at deliverable path. 3 parallel evidence subagents dispatched (Q1: fixture inventory, Q2: deterministic metrics, Q3: sample size). All acceptance criteria met: 57 pipeline fixtures catalogued (47 customer-facing); 4-level gap taxonomy (GAP-A..D); 14 deterministic metric definitions with formulas; minimum sample = 20 fixtures; 5 reproducible test commands; 6 blocked/unknown areas with follow-up actions. Key finding: `pipeline-integration.test.ts` 90% pass-rate gate over 47 fixtures IS the existing first regression gate. Key gaps: `policy`/`complaint` have no templates, `access`/`activities` have no pipeline fixtures, multilingual multi-Q untested.
- **Affects:** `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/data/email-templates.json`, `[readonly] docs/plans/email-draft-quality-upgrade/fact-find.md`
- **Depends on:** -
- **Blocks:** TASK-00, TASK-09
- **Confidence:** 75%
  - Implementation: 85% - existing tests and fixtures provide direct baseline inputs.
  - Approach: 75% - anonymized sample assembly still needs operator review.
  - Impact: 85% - required to measure later quality changes credibly.
- **Questions to answer:**
  - Which fixtures represent multi-question failure modes across top categories?
  - What baseline metrics can be collected with deterministic checks only?
  - What minimum sample size is feasible for first regression gate?
- **Acceptance:**
  - Baseline artifact defines fixture set, labels, and gap taxonomy.
  - Artifact includes metric definitions and exact command list for repeatable collection.
  - Artifact lists blocked/unknown areas (if any) with concrete follow-up actions.
- **Validation contract:**
  - Investigation closes only when baseline includes explicit sample size, metric formulas, and reproducible command protocol.
- **Planning validation:**
  - Checks run: `rg` scan of existing draft pipeline tests and fixtures.
  - Validation artifacts: fact-find + repository test inventory.
  - Unexpected findings: none.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:**
  - Adds baseline/evaluation artifact used by TASK-09.

### TASK-02: Patch `ops-inbox` workflow to perform mandatory post-quality gap patch loop
- **Type:** IMPLEMENT
- **Deliverable:** skill guidance update for short-term gap coverage (`draft_generate -> draft_quality_check -> patch -> draft_quality_check -> gmail_create_draft`)
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.claude/skills/ops-inbox/SKILL.md`, `[readonly] packages/mcp-server/src/tools/draft-generate.ts`, `[readonly] packages/mcp-server/src/tools/draft-quality-check.ts`
- **Depends on:** TASK-00
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 90% - bounded to skill flow and operator instructions.
  - Approach: 85% - aligned with fact-find Pattern C bridge.
  - Impact: 85% - immediate quality lift before code rollout.
- **Acceptance:**
  - Skill requires explicit patch step when `question_coverage` has `missing`/`partial` entries.
  - Skill forbids invented answers and protects prepayment/cancellation text.
  - Skill mandates second `draft_quality_check` before draft creation.
- **Validation contract (TC-02):**
  - TC-02-01: walkthrough runbook includes mandatory second quality gate.
  - TC-02-02: guidance explicitly defines escalation language when no source snippet is available.
  - TC-02-03: deterministic hard-rule categories remain uneditable in patch step.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort task.
- **Scouts:** None: bounded doc-scope bridge task.
- **Edge Cases & Hardening:**
  - Include rule for multi-question emails where only subset can be source-backed.
- **What would make this >=90%:**
  - One pilot inbox session with zero missed mandatory patch loops.
- **Rollout / rollback:**
  - Rollout: publish updated skill and announce operator flow change.
  - Rollback: revert skill patch and rely on current deterministic-only workflow.
- **Documentation impact:**
  - Updates operator runbook flow and guardrails.

### TASK-03: Add missing templates and enforce template-link/placeholder lint gates
- **Type:** IMPLEMENT
- **Deliverable:** expanded template dataset + CI-safe lint rules for broken links/placeholders
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/utils/template-lint.ts`, `packages/mcp-server/src/__tests__/template-lint.test.ts`, `packages/mcp-server/src/__tests__/email-template.test.ts`
- **Depends on:** TASK-00
- **Blocks:** TASK-06, TASK-09
- **Confidence:** 85%
  - Implementation: 90% - concrete scenario list and lint criteria are defined.
  - Approach: 85% - follows existing template/lint architecture.
  - Impact: 90% - closes known response holes and prevents link regressions.
- **Acceptance:**
  - Adds the 10 missing scenario templates identified in fact-find.
  - Lint fails when template text uses "here"/"click here" without URL in same sentence.
  - Lint fails on unresolved placeholders in generated output paths.
  - Existing template tests updated to cover new categories and stub-fix expectations.
- **Validation contract (TC-03):**
  - TC-03-01: valid template set passes lint and tests.
  - TC-03-02: broken-link stub fixture fails with deterministic error text.
  - TC-03-03: unresolved placeholder fixture fails with deterministic error text.
  - TC-03-04: targeted tests pass with `pnpm --filter mcp-server test -- src/__tests__/template-lint.test.ts` and `pnpm --filter mcp-server test -- src/__tests__/email-template.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: fact-find template audit + repository test inventory scan.
  - Validation artifacts: `docs/plans/email-draft-quality-upgrade/fact-find.md`, existing template test files.
  - Unexpected findings: none.
- **Scouts:** None: low ambiguity in data/lint scope.
- **Edge Cases & Hardening:**
  - Keep category assignment precise (`city-tax` in check-in lane per fact-find).
- **What would make this >=90%:**
  - One full template-lint run on production-like template payloads with zero false positives.
- **Rollout / rollback:**
  - Rollout: ship templates + lint gate in same change to prevent uncaught stubs.
  - Rollback: revert new templates and lint rule additions together.
- **Documentation impact:**
  - Update internal template maintenance notes for new lint expectations.

### TASK-04: Introduce additive multi-scenario action plan model with dominant/exclusive semantics
- **Type:** IMPLEMENT
- **Deliverable:** `EmailActionPlan` additive contract update (`scenarios[]` + compatibility-preserving `scenario` + version field)
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-00
- **Blocks:** TASK-06, TASK-08, TASK-09
- **Confidence:** 85%
  - Implementation: 85% - clear type and consumer touchpoints already identified.
  - Approach: 85% - additive model avoids hard-breaking existing consumers.
  - Impact: 90% - unblocks multi-topic selection and coverage improvements.
- **Acceptance:**
  - `EmailActionPlan` includes `scenarios[]` and retains legacy `scenario` field.
  - Dominant/exclusive metadata enforces cancellation/prepayment precedence.
  - Version marker is added and validated in consumer paths.
  - Existing single-topic behavior remains stable for unchanged inputs.
- **Validation contract (TC-04):**
  - TC-04-01: legacy consumer path still works with singular `scenario`.
  - TC-04-02: multi-question input yields ordered `scenarios[]` with deterministic confidence ordering.
  - TC-04-03: hard-rule category dominance suppresses invalid dilution behavior.
  - TC-04-04: pipeline integration tests pass for both legacy and additive payload shapes.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: repository scan for `EmailActionPlan` consumers and scenario references.
  - Validation artifacts: `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`.
  - Unexpected findings: none.
- **Scouts:** None: call sites are known and bounded.
- **Edge Cases & Hardening:**
  - Keep deterministic ordering for `scenarios[]` to avoid flaky tests.
- **What would make this >=90%:**
  - Two-round compatibility test run with unchanged outputs for golden single-topic fixtures.
- **Rollout / rollback:**
  - Rollout: release additive schema and update all first-party consumers in same patch.
  - Rollback: feature-flag `scenarios[]` consumption and keep singular path active.
- **Documentation impact:**
  - Add action-plan versioning note in MCP tool docs.

### TASK-05: Extract shared coverage module and reuse across generate/quality tooling
- **Type:** IMPLEMENT
- **Deliverable:** shared `coverage.ts` utility used by `draft_generate` and `draft_quality_check`
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/utils/coverage.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-00
- **Blocks:** TASK-07, TASK-09
- **Confidence:** 85%
  - Implementation: 90% - existing coverage logic is extractable from one source.
  - Approach: 85% - selected Pattern A aligns pipeline ordering constraints.
  - Impact: 85% - removes duplicated logic and enables pre-generation gap checks.
- **Acceptance:**
  - Coverage scoring logic moves into shared utility without semantic regressions.
  - Both tools consume shared utility and return deterministic coverage outputs.
  - No duplicated scoring logic remains in tool handlers.
- **Validation contract (TC-05):**
  - TC-05-01: existing quality-check tests pass unchanged for baseline fixtures.
  - TC-05-02: generate path can compute preliminary coverage using shared utility.
  - TC-05-03: regression fixture confirms equal coverage result between tool paths for same input.
  - TC-05-04: targeted tests pass with `pnpm --filter mcp-server test -- src/__tests__/draft-quality-check.test.ts` and `pnpm --filter mcp-server test -- src/__tests__/draft-generate.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: symbol scan for `evaluateQuestionCoverage` usage and current call flow.
  - Validation artifacts: `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/tools/draft-generate.ts`.
  - Unexpected findings: none.
- **Scouts:** None: extraction path is straightforward.
- **Edge Cases & Hardening:**
  - Ensure tokenization/stemming behavior is unchanged after extraction.
- **What would make this >=90%:**
  - Snapshot parity test proving identical coverage payloads pre/post extraction on fixture set.
- **Rollout / rollback:**
  - Rollout: land shared module and consumer updates atomically.
  - Rollback: revert module extraction and restore inline quality-check logic.
- **Documentation impact:**
  - Add internal note documenting shared coverage utility ownership.

### TASK-06: Implement per-question template ranking and coherent composite assembly
- **Type:** IMPLEMENT
- **Deliverable:** question-first ranking and deterministic numbered assembly with plain/html parity
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/utils/template-ranker.ts`, `packages/mcp-server/src/__tests__/template-ranker.test.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-07, TASK-09
- **Confidence:** 75%
  - Implementation: 85% - per-question logic is clear but touches ranking + assembly paths.
  - Approach: 75% - balancing coverage and verbosity needs careful heuristic tuning.
  - Impact: 85% - directly addresses multi-question quality failures.
- **Acceptance:**
  - Ranking is executed per extracted question/request, not single category only.
  - Selection heuristic maximizes question coverage with hard cap on template blocks.
  - Composite body uses numbered structure and removes duplicate greeting/signature blocks.
  - Plain and HTML outputs are generated from shared assembly logic.
- **Validation contract (TC-06):**
  - TC-06-01: multi-question fixture yields >=1 mapped answer block per question when template exists.
  - TC-06-02: single-topic fixtures remain within prior tone/length bounds.
  - TC-06-03: duplicated greeting/signature regression fixture fails before fix and passes after fix.
  - TC-06-04: targeted tests pass with `pnpm --filter mcp-server test -- src/__tests__/template-ranker.test.ts` and `pnpm --filter mcp-server test -- src/__tests__/draft-generate.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: review of current ranker limit behavior and composite assembly flow.
  - Validation artifacts: fact-find GAP-4/GAP-6/GAP-7 evidence + existing tests.
  - Unexpected findings: none.
- **Scouts:**
  - Probe heuristic cap values (3/4/5) against fixture coverage before finalizing default.
- **Edge Cases & Hardening:**
  - Preserve deterministic output ordering for CI stability.
- **What would make this >=90%:**
  - Fixture run showing >=95% question coverage with no length-rule regressions.
- **Rollout / rollback:**
  - Rollout: feature-flag new ranking mode for initial validation cycle.
  - Rollback: disable question-first mode and fall back to current category-first ranker.
- **Documentation impact:**
  - Update draft generation notes for question-first selection behavior.

### TASK-07: Inject knowledge-backed answers with source attribution and escalation fallback
- **Type:** IMPLEMENT
- **Deliverable:** pre-send gap-fill insertion using `knowledge_summaries` with `sources_used` metadata
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-05, TASK-06
- **Blocks:** TASK-09
- **Confidence:** 75%
  - Implementation: 85% - insertion points are known after shared coverage + assembly work.
  - Approach: 75% - source-priority and escalation semantics need careful boundary tests.
  - Impact: 85% - closes highest-value gap (unanswered questions).
- **Acceptance:**
  - Missing-question gaps trigger source-backed insertions when high-relevance snippet exists.
  - Policy-critical topics prioritize policy sources; unsupported cases escalate safely.
  - Output metadata includes `sources_used` entries traceable to snippet origin.
  - No hallucinated claims are introduced in patched content.
- **Validation contract (TC-07):**
  - TC-07-01: fixture with matching snippet inserts attributed answer and passes quality check.
  - TC-07-02: fixture without sufficient snippet produces escalation text (no fabricated answer).
  - TC-07-03: policy-topic fixture prefers policy snippet over FAQ/pricing sources.
  - TC-07-04: targeted tests pass with `pnpm --filter mcp-server test -- src/__tests__/draft-generate.test.ts`, `pnpm --filter mcp-server test -- src/__tests__/draft-quality-check.test.ts`, and `pnpm --filter mcp-server test -- src/__tests__/pipeline-integration.test.ts --testPathPattern="draft" --maxWorkers=2`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: fact-find pipeline-order constraint review + test inventory check.
  - Validation artifacts: Pattern A notes in fact-find and existing pipeline integration tests.
  - Unexpected findings: none.
- **Scouts:**
  - Validate snippet relevance threshold sensitivity to reduce false insertions.
- **Edge Cases & Hardening:**
  - Maintain deterministic sentence insertion order for reproducibility.
- **What would make this >=90%:**
  - Hallucination audit over fixture set shows zero unsupported inserted claims.
- **Rollout / rollback:**
  - Rollout: ship with metric logging on coverage/hallucination deltas.
  - Rollback: disable insertion branch while retaining coverage diagnostics.
- **Documentation impact:**
  - Update operator notes for source-attribution metadata interpretation.

### TASK-08: Improve implicit request/thread-context extraction and policy-safe language rules
- **Type:** IMPLEMENT
- **Deliverable:** upgraded request extraction patterns + thread-aware handling + variable-language guardrails
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/data/draft-guide.json`, `packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts`, `.claude/skills/ops-inbox/SKILL.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-09
- **Confidence:** 70%
  - Implementation: 75% - touchpoints are known but thread-body availability is uncertain.
  - Approach: 70% - quoted-text handling and continuation detection need careful tuning.
  - Impact: 75% - improves follow-up email quality but has broader parsing risk.
- **Acceptance:**
  - Implicit request regex patterns cover documented missing phrasings.
  - Thread-aware extraction uses available prior messages without duplicating quoted content.
  - Draft guide adds explicit variable-data language safeguards.
  - New behavior remains deterministic and auditable.
- **Validation contract (TC-08):**
  - TC-08-01: implicit-request fixtures are captured into requests list.
  - TC-08-02: reply-thread fixture avoids double-answering quoted historic questions.
  - TC-08-03: variable-policy fixture enforces guarded wording for uncertain details.
  - TC-08-04: targeted tests pass with `pnpm --filter mcp-server test -- src/__tests__/draft-interpret.test.ts` and `pnpm --filter mcp-server test -- src/__tests__/gmail-organize-inbox.test.ts`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: repository scan for thread context support and current interpret tests.
  - Validation artifacts: `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/tools/gmail.ts`, fact-find W2/W3 notes.
  - Unexpected findings: includeThread body-depth still needs empirical verification.
- **Scouts:**
  - Scout whether `includeThread: true` consistently returns sufficient full-message bodies.
- **Edge Cases & Hardening:**
  - Prevent false-positive request extraction from signature/footer lines.
- **What would make this >=90%:**
  - Evidence that thread-context extraction improves follow-up fixture coverage without precision loss.
- **Rollout / rollback:**
  - Rollout: enable updated extraction with targeted regression checks.
  - Rollback: revert to current extraction patterns while preserving policy-guide improvements.
- **Documentation impact:**
  - Update extraction behavior notes in ops-inbox skill and draft guide references.

### TASK-09: Add end-to-end evaluation harness + non-regression command contract
- **Type:** IMPLEMENT
- **Deliverable:** fixture-driven quality benchmark and enforceable check command(s) for ongoing regression control
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/mcp-server/data/test-fixtures/draft-pipeline/`, `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`, `packages/mcp-server/package.json`, `docs/testing-policy.md`
- **Depends on:** TASK-01, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 75%
  - Implementation: 85% - fixture framework can build on existing integration suite.
  - Approach: 75% - metric thresholds need calibration from baseline data.
  - Impact: 85% - required to prove improvements and block regressions.
- **Acceptance:**
  - Fixture set includes labeled single-topic and multi-topic examples with expected coverage outcomes.
  - Regression command contract is explicit for local + CI use.
  - Metrics include question coverage, unsupported-claim checks, and escalation correctness.
  - Contract defines fail thresholds and deterministic reporting format.
- **Validation contract (TC-09):**
  - TC-09-01: benchmark run emits coverage/escalation metric summary.
  - TC-09-02: known-regression fixture fails with actionable diagnostics.
  - TC-09-03: command contract is documented and reproducible on clean checkout.
  - TC-09-04: targeted run passes with `pnpm --filter mcp-server test -- src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: existing pipeline integration suite discovery and fixture path scan.
  - Validation artifacts: `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`, fact-find W1 requirements.
  - Unexpected findings: fixture anonymization workflow not yet documented.
- **Scouts:**
  - Scout anonymization workflow for production-derived emails before fixture commit.
- **Edge Cases & Hardening:**
  - Ensure benchmark avoids flaky expectations tied to nondeterministic ordering.
- **What would make this >=90%:**
  - Two consecutive CI runs with stable metric outputs and zero flaky fixture failures.
- **Rollout / rollback:**
  - Rollout: introduce command as non-blocking for first cycle, then promote to blocking after stability confirmation.
  - Rollback: demote to informational check while preserving fixture generation scripts.
- **Documentation impact:**
  - Add benchmark/check command docs and expected metric interpretation.

### TASK-10: Horizon checkpoint for optional LLM refinement wave and rollout policy
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-replan` for any post-v1.1 LLM-stage work
- **Execution-Skill:** lp-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/email-draft-quality-upgrade/plan.md`
- **Depends on:** TASK-02, TASK-09
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% - checkpoint process is established.
  - Approach: 95% - forces evidence-based scope expansion decisions.
  - Impact: 95% - protects against premature architecture expansion.
- **Acceptance:**
  - `/lp-build` checkpoint executor run.
  - `/lp-replan` run for any proposed LLM-stage tasks.
  - downstream confidence/dependencies recalibrated from benchmark evidence.
  - explicit decision: defer or proceed with LLM-stage tasks.
- **Horizon assumptions to validate:**
  - Deterministic-first upgrades materially reduce multi-question coverage failures.
  - Regression harness is stable enough to evaluate incremental LLM benefit/cost.
- **Validation contract:**
  - Checkpoint closes only when post-TASK-09 metrics are logged and next-wave decision is explicit.
- **Planning validation:**
  - Replan evidence appended to decision log.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:**
  - Updates this plan with checkpoint outcomes and next-wave route.

## Risks & Mitigations
- Regression in hard-rule categories (cancellation/prepayment).
  - Mitigation: dominant/exclusive semantics in TASK-04 + targeted regression coverage in TASK-09.
- Hallucinated inserted answers during gap fill.
  - Mitigation: source-priority + escalation fallback + attribution requirements in TASK-07.
- Ranking complexity introduces nondeterministic output and flaky tests.
  - Mitigation: deterministic ordering constraints and fixed fixture expectations in TASK-06/TASK-09.
- Scope creep into immediate LLM-stage implementation.
  - Mitigation: TASK-00 decision boundary and TASK-10 checkpoint gate.

## Observability
- Logging:
  - Draft pipeline checks emit deterministic per-fixture pass/fail diagnostics.
  - Gap-fill path logs source attribution (`uri`, `snippetId`) for injected answers.
- Metrics:
  - Question coverage rate (covered / total extracted questions).
  - Unsupported-claim count per fixture set.
  - Escalation precision/recall on labeled fixtures.
  - Legacy single-topic parity pass rate.
- Alerts/Dashboards:
  - None in this wave; surfaced through check command failures and CI logs.

## Acceptance Criteria (overall)
- [ ] Scope and versioning decisions are explicit and non-conflicting for all downstream tasks.
- [ ] Operator bridge flow is in place (`generate -> quality -> patch -> quality`) with strict safety instructions.
- [ ] Template inventory/lint gates close known scenario and broken-link gaps.
- [ ] Multi-scenario model is additive and backwards compatible.
- [ ] Shared coverage logic powers both generation and quality checks.
- [ ] Per-question ranking/composite assembly improves multi-topic coverage without deterministic regressions.
- [ ] Knowledge-backed insertion is source-attributed and escalation-safe.
- [ ] Evaluation harness and command contract provide repeatable regression evidence.
- [ ] Checkpoint decision for optional LLM wave is explicitly recorded.

## Decision Log
- 2026-02-18: Initial plan created from `docs/plans/email-draft-quality-upgrade/fact-find.md` via `/lp-plan`.
- 2026-02-18: Sequenced into seven execution waves with explicit mixed-track dependencies and checkpoint gate.
- 2026-02-18: TASK-01 complete. Baseline artifact at `artifacts/quality-baseline-and-fixture-manifest.md`. Key findings: existing 90% pass-rate gate over 47 pipeline fixtures is the first regression gate; `policy`/`complaint` have zero templates (blocked from fixture coverage); minimum TASK-09 sample = 20 fixtures; 14 deterministic metric definitions ready for TASK-09 calibration. TASK-00 DECISION now unblocked — requires operator input on 3 scope questions before TASK-02..TASK-05 can proceed.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted sum:
  - S tasks: `85 + 85 + 95 = 265`
  - M tasks: `2 * (75 + 85 + 85 + 85 + 75 + 75 + 70 + 75) = 1250`
- Total weight: `3 + 16 = 19`
- Overall-confidence: `1515 / 19 = 79.74%` -> **80%**
