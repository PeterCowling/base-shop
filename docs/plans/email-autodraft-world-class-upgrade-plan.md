---
Type: Plan
Status: Active
Domain: Automation
Workstream: Mixed
Created: 2026-02-10
Last-updated: 2026-02-10
Feature-Slug: email-autodraft-world-class-upgrade
Deliverable-Type: multi-deliverable
Execution-Track: mixed
Primary-Execution-Skill: build-feature
Supporting-Skills: draft-email-message, process-emails
Overall-confidence: 83%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-ENG-0020
---

# Email Autodraft World-Class Upgrade Plan

## Summary

Upgrade the Brikette email autodraft pipeline from deterministic template assembly to policy-safe, context-aware, professional communication. The 3-stage pipeline (interpret → generate → quality gate) retains its rule-based architecture but gains: escalation-tier routing, a policy decision layer, richer knowledge/voice integration, per-question quality validation, unified taxonomy, and high-stakes template rewrites. Booking-email GAS fallback is removed in favour of MCP-only send path. Guest-email GAS migration and operator ergonomics are deferred to Phase 2.

## Goals

- Raise draft quality from template adequacy to policy-safe, context-aware, professional communication.
- Add robust handling for high-stakes categories (cancellation, refund, payment disputes, non-refundable edge cases).
- Align classification, template taxonomy, quality checks, and workflow transitions under a unified taxonomy.
- Establish measurable quality and safety gates with per-question coverage validation.
- Remove GAS fallback from booking-email send path (hard cut to MCP-only at release).

## Non-goals

- Fully autonomous sending without human review.
- Replacing Gmail as mailbox platform.
- Broad multi-language expansion (EN first; preserve IT/ES baseline).
- Guest-email GAS migration (Phase 2).
- Operator ergonomics overhaul of `/process-emails` (Phase 2).
- GAS inbox-monitor migration (Phase 2).

## Constraints & Assumptions

- Constraints:
  - Preserve human-in-loop review before send.
  - Keep MCP tool interfaces backward compatible where practical.
  - No LLM in the deterministic pipeline stages (orchestrating LLM calls stages but does not execute them).
  - Non-refundable bookings receive no concessions/refunds — policy meaning is fixed, language can be softened.
  - Hybrid architecture confirmed: deterministic for routine, richer composition for sensitive.
- Assumptions:
  - Pipeline integration tests continue to gate quality at ≥90% pass rate.
  - EUR threshold for high-value dispute escalation will be confirmed during CHECKPOINT (default: configurable constant, initially €500).

## Fact-Find Reference

- Related brief: `docs/plans/email-autodraft-world-class-upgrade-fact-find.md`
- Key findings:
  - F1: Generation underuses available action-plan intelligence (voice/guide loaded but unused at `draft-generate.ts:259-260`).
  - F2: No entity grounding for booking-specific decisions (schema at `draft-generate.ts:30` has no booking entity fields).
  - F3: Quality gate is structurally useful but semantically shallow (keyword `.some()` at `draft-quality-check.ts:177`).
  - F4: Template quality misaligned with risk level (2/38 cancellation templates, rigid language).
  - F5: Intent/scenario parsing is heuristic-heavy (first-match regex at `draft-interpret.ts:406`).
  - F6: GAS remains in live-path dependencies (reception hooks, inbox monitor).
  - F7: Workflow/operability constraints (sequential stages, per-message API calls).
  - F8: State/test/consistency risks (in-memory locks, hardcoded knowledge, taxonomy mismatch).
- Resolved questions from fact-find:
  - Hybrid architecture is working direction (sponsor confirmed).
  - Non-refundable = no exceptions (policy fixed).
  - EN only for phase 1 sensitive scenarios.
  - Hard cut to MCP-only at release for booking email (no GAS fallback window).
  - Balanced booking context required: type + payment status + cancellation deadline + prior commitments.
  - No upfront context step; reviewer validates after compilation.
  - Gmail template text is canonical source for non-refundable wording.

## Existing System Notes

- Key modules/files:
  - `packages/mcp-server/src/tools/draft-interpret.ts` — 3-stage interpretation: questions, requests, scenario classification
  - `packages/mcp-server/src/tools/draft-generate.ts` — Template ranking + assembly + quality check integration
  - `packages/mcp-server/src/tools/draft-quality-check.ts` — 6 structural checks + 2 warnings
  - `packages/mcp-server/src/utils/template-ranker.ts` — BM25 + hard rules, synonym expansion
  - `packages/mcp-server/data/email-templates.json` — 38 templates, 19 categories
  - `packages/mcp-server/data/draft-guide.json` — Length calibration, content rules, tone triggers
  - `packages/mcp-server/data/voice-examples.json` — 12 scenario tone examples with good/bad/phrases
  - `packages/mcp-server/src/resources/brikette-knowledge.ts` — FAQ (live), rooms/menu/policies (hardcoded)
  - `packages/mcp-server/src/tools/gmail.ts` — 5 MCP tools, label state machine, in-memory locks
  - `apps/reception/src/services/useBookingEmail.ts` — MCP flag + GAS fallback (line 120)
  - `.claude/skills/process-emails/SKILL.md` — Operator workflow (queue → interpret → compose → quality → present)
- Patterns to follow:
  - Pipeline test pattern: `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` (fixtures + 3-stage validation)
  - Unit test pattern: `packages/mcp-server/src/__tests__/draft-quality-check.test.ts` (TC-XX per check)
  - Template ranking: `packages/mcp-server/src/utils/template-ranker.ts` (hard rules + BM25)
  - Resource caching: `packages/mcp-server/src/resources/brikette-knowledge.ts` (5-min TTL cache)

## Proposed Approach

**Enrichment-first, then policy-layer, then templates.**

The approach builds outward from the existing 3-stage pipeline:

1. **Wire unused intelligence** (voice, guide, knowledge) into the generation stage — proves the enrichment path works without architectural change.
2. **Add escalation tier + unified taxonomy** — classification foundation needed before policy decisions can be made.
3. **Upgrade quality gate** — per-question validation replaces global keyword matching.
4. **CHECKPOINT** — validate that enrichment + classification improvements measurably raise pipeline test pass rates before investing in the policy layer.
5. **Policy decision layer** — new module between interpret and generate that constrains generation based on escalation tier, scenario, and business rules.
6. **Template rewrites** — rewrite high-stakes templates against the policy rubric.
7. **GAS migration** — remove booking-email fallback (independent of quality work).

- Option A: LLM-assisted generation for sensitive scenarios (higher quality ceiling, harder to test deterministically).
- Option B: Enhanced rule-based pipeline with policy constraints (predictable, testable, incremental).
- Chosen: **Option B** because sponsor confirmed hybrid approach and the existing pipeline handles routine scenarios well. LLM-assisted generation can be evaluated after the rule-based quality floor is raised.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Wire voice examples and draft guide into generation | 87% | S | Complete (2026-02-10) | - | TASK-02, TASK-07 |
| TASK-02 | IMPLEMENT | Upgrade knowledge summaries to cited snippets | 85% | S | Complete (2026-02-10) | TASK-01 | TASK-07 |
| TASK-03 | IMPLEMENT | Add escalation tier classification to EmailActionPlan | 82% | M | Pending | - | TASK-04, TASK-06, TASK-07 |
| TASK-04 | IMPLEMENT | Unify scenario taxonomy across pipeline stages | 80% | M | Pending | TASK-03 | TASK-05, TASK-06, TASK-07 |
| TASK-05 | IMPLEMENT | Upgrade quality gate to per-question coverage | 84% | M | Pending | TASK-04 | TASK-07 |
| TASK-06 | IMPLEMENT | Add high-stakes pipeline test fixtures | 88% | M | Pending | TASK-03, TASK-04 | TASK-07 |
| TASK-07 | CHECKPOINT | Validate enrichment approach before policy/template work | 95% | S | Pending | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Add policy decision layer before generation | 81% | L | Pending | TASK-07 | TASK-09 |
| TASK-09 | IMPLEMENT | Rewrite high-stakes templates against tone-policy rubric | 80% | M | Pending | TASK-08 | - |
| TASK-10 | IMPLEMENT | Migrate booking email to MCP-only (remove GAS fallback) | 85% | S | Pending | - | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | TASK-01, TASK-03, TASK-10 | - | Independent foundation tasks. TASK-10 (GAS migration) is fully independent of quality work. |
| 2 | TASK-02, TASK-04 | Wave 1: TASK-01, TASK-03 | TASK-02 needs TASK-01 (file overlap: draft-generate.ts). TASK-04 needs TASK-03 (file overlap: draft-interpret.ts). |
| 3 | TASK-05, TASK-06 | Wave 2: TASK-04 | TASK-05 needs TASK-04 (taxonomy). TASK-06 needs TASK-03 + TASK-04 (escalation + taxonomy). |
| 4 | TASK-07 (CHECKPOINT) | Waves 1–3: all tasks | Re-assessment gate. Auto-continue pauses here for `/re-plan`. |
| 5 | TASK-08 | Wave 4: TASK-07 | Policy decision layer (L-effort). Sequential bottleneck. |
| 6 | TASK-09 | Wave 5: TASK-08 | Template rewrites depend on policy rubric. |

**Max parallelism:** 3 (Wave 1)
**Critical path:** TASK-03 → TASK-04 → TASK-05 → TASK-07 → TASK-08 → TASK-09 (6 waves)
**Total tasks:** 10 (9 IMPLEMENT + 1 CHECKPOINT)
**Auto-continue boundary:** Builds Waves 1–3, pauses at Wave 4 CHECKPOINT

## Tasks

### TASK-01: Wire voice examples and draft guide into generation

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-generate.ts`
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-07
- **Confidence:** 87%
  - Implementation: 90% — Both resources are already loaded (lines 259–260); just need to consume return values and incorporate into composition context.
  - Approach: 85% — Using draft-guide for length/tone calibration and voice-examples for phrase selection follows the existing resource pattern.
  - Impact: 85% — Isolated to generation stage; no schema changes needed.
- **Acceptance:**
  - `handleDraftGuideRead()` return value is consumed and applied to draft length calibration and content rules.
  - `handleVoiceExamplesRead()` return value is consumed and used for tone/phrase selection in draft composition.
  - Pipeline integration tests continue to pass at ≥90%.
  - Draft guide content rules (always/if/never) are enforced during composition.
- **Validation contract:**
  - TC-01: Generation with FAQ scenario → draft length within guide-specified range (50–100 words for FAQ).
  - TC-02: Generation with cancellation scenario → draft uses preferred phrases from voice examples, avoids bad examples.
  - TC-03: Generation with policy scenario → content rules "always" items are present (answer all questions, link to website, professional tone).
  - TC-04: Generation with any scenario → "never" rules are respected (no availability confirmation, no charge claims, no internal notes).
  - Acceptance coverage: TC-01 covers length calibration; TC-02 covers voice integration; TC-03–04 cover content rules.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/draft-generate.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed `handleDraftGuideRead()` and `handleVoiceExamplesRead()` exist and return JSON data (via draft-guide.ts:33-48 and voice-examples.ts:33-48).
  - Confirmed draft-guide.json contains length calibration (17 categories), content rules (always/if/never), and tone triggers (13 scenarios).
  - Confirmed voice-examples.json contains 12 scenario entries with good/bad examples and phrases.
  - Unexpected findings: None.
- **What would make this ≥90%:** Confirming that draft-guide and voice-examples data shapes are stable (no pending redesign).
- **Rollout / rollback:**
  - Rollout: Direct deploy — enriches existing generation with no external-facing contract change.
  - Rollback: Revert to ignoring return values (restore lines 259–260 to current state).
- **Documentation impact:** None
- **Notes / references:**
  - Draft guide data: `packages/mcp-server/data/draft-guide.json`
  - Voice examples data: `packages/mcp-server/data/voice-examples.json`
  - Resource handlers: `packages/mcp-server/src/resources/draft-guide.ts`, `packages/mcp-server/src/resources/voice-examples.ts`

#### Build Completion (2026-02-10)
- **Status:** Complete
- **Commits:** `2b6608c81c`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 2 (red-green plus pipeline-pass-rate stabilization)
  - Initial validation: FAIL expected (new TASK-01 tests failed before implementation)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 87%
  - Post-validation: 84%
  - Delta reason: Validation confirmed core assumptions; one additional cycle was required to stabilize pipeline pass rate ≥90%.
- **Validation:**
  - Ran: `JEST_FORCE_CJS=1 pnpm exec jest --config ./jest.config.cjs --modulePathIgnorePatterns '/.worktrees/' '/.ts-jest/' '/.open-next/' '/.next/' --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts` — PASS (9/9 tests)
  - Ran: `JEST_FORCE_CJS=1 pnpm exec jest --config ./jest.config.cjs --modulePathIgnorePatterns '/.worktrees/' '/.ts-jest/' '/.open-next/' '/.next/' --runTestsByPath packages/mcp-server/src/__tests__/pipeline-integration.test.ts` — PASS (quality gate 29/31, 93.5%)
  - Ran: `pnpm --filter @acme/mcp-server build` — PASS
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only, pre-existing security plugin warnings)
  - Business OS API integration steps were not executed in this run because `BOS_AGENT_API_BASE_URL` and `BOS_AGENT_API_KEY` were not present in the environment.
- **Documentation updated:** None required
- **Implementation notes:** Consumed `draft-guide` + `voice-examples` payloads in generation, added always/if/never composition enforcement, phrase sanitization, preferred-phrase insertion, and guide-driven length calibration (with safe fallback behavior when guide data is absent). Added TASK-01 validation tests in `draft-generate.test.ts`.

---

### TASK-02: Upgrade knowledge summaries to cited snippets

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-generate.ts`
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Depends on:** TASK-01 _(file overlap: draft-generate.ts)_
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 90% — `loadKnowledgeSummaries` at line 129 already loads full JSON payloads; needs to extract relevant entries instead of counting.
  - Approach: 82% — Cited snippets follow the existing resource pattern; extraction logic is the main design question.
  - Impact: 82% — Changes summary format consumed by generation; no external contract change.
- **Acceptance:**
  - `loadKnowledgeSummaries` returns actual content snippets (FAQ answers, room details, menu items) relevant to the scenario, not just `items:N`/`keys:N` counts.
  - Snippets are scenario-filtered (e.g., cancellation scenario gets policy FAQ items, not breakfast info).
  - Knowledge summaries are available to generation for citation in drafts.
  - Pipeline integration tests continue to pass at ≥90%.
- **Validation contract:**
  - TC-01: FAQ scenario knowledge summary → includes relevant FAQ item text, not just `items:29`.
  - TC-02: Cancellation scenario → knowledge includes policy-related FAQ items filtered by relevance.
  - TC-03: Knowledge summary respects max-length limit (avoid prompt bloat — cap at ~500 words per resource).
  - TC-04: Non-matching knowledge (e.g., no menu for wifi question) → returns empty or minimal summary.
  - Acceptance coverage: TC-01–02 cover content extraction; TC-03 covers length bounds; TC-04 covers irrelevant filtering.
  - Validation type: unit
  - Validation location: `packages/mcp-server/src/__tests__/draft-generate.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed `loadKnowledgeSummaries` loads from 4 URIs: faq, rooms, pricing/menu, policies.
  - Confirmed data structures: FAQ is array of items, rooms is array of room configs, menu is categorized pricing, policies is mixed.
  - Unexpected findings: None.
- **What would make this ≥90%:** Spike on relevance-matching algorithm (keyword overlap vs category match).
- **Rollout / rollback:**
  - Rollout: Direct deploy — enriches existing generation with no external-facing contract change.
  - Rollback: Revert to count-only summaries.
- **Documentation impact:** None
- **Notes / references:**
  - Knowledge resources: `packages/mcp-server/src/resources/brikette-knowledge.ts` (lines 88–312)
  - Current summary logic: `draft-generate.ts:129–145`

#### Build Completion (2026-02-10)
- **Status:** Complete
- **Commits:** `b3d219dd7a`
- **Execution cycle:**
  - Validation cases executed: TC-01, TC-02, TC-03, TC-04
  - Cycles: 3 (red-green plus lint-gate refactor cycle)
  - Initial validation: FAIL expected (new TASK-02 tests failed before implementation)
  - Final validation: PASS
- **Confidence reassessment:**
  - Original: 85%
  - Post-validation: 80%
  - Delta reason: Validation confirmed extraction approach and relevance filtering; one additional lint-gate cycle was required to split oversized test describe blocks.
- **Validation:**
  - Ran: `JEST_FORCE_CJS=1 pnpm exec jest --config ./jest.config.cjs --modulePathIgnorePatterns '/.worktrees/' '/.ts-jest/' '/.open-next/' '/.next/' --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts` — PASS (13/13 tests)
  - Ran: `JEST_FORCE_CJS=1 pnpm exec jest --config ./jest.config.cjs --modulePathIgnorePatterns '/.worktrees/' '/.ts-jest/' '/.open-next/' '/.next/' --runTestsByPath packages/mcp-server/src/__tests__/pipeline-integration.test.ts` — PASS (quality gate 29/31, 93.5%)
  - Ran: `pnpm --filter @acme/mcp-server lint` — PASS (warnings only, pre-existing security plugin warnings)
  - Ran: `pnpm --filter @acme/mcp-server build` — PASS
  - Ran: `pnpm --filter @acme/mcp-server typecheck` — SKIP (`@acme/mcp-server` has no `typecheck` script)
- **Documentation updated:** `docs/plans/email-autodraft-world-class-upgrade-plan.md`
- **Implementation notes:** Replaced count-only knowledge summaries with scenario-filtered cited snippets across FAQ, rooms, pricing/menu, and policies resources. Added relevance scoring from action-plan context, per-resource snippet selection, and 500-word summary caps. Added TASK-02 unit coverage for citation output, policy-focused filtering, length cap, and irrelevant-resource handling.

---

### TASK-03: Add escalation tier classification to EmailActionPlan

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-interpret.ts`
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-06, TASK-07
- **Confidence:** 82%
  - Implementation: 85% — Escalation triggers are enumerated in the fact-find; implementation follows `classifyScenario` pattern (line 406).
  - Approach: 80% — Two-tier model (HIGH/CRITICAL) with configurable thresholds is well-scoped.
  - Impact: 80% — Adds new field to EmailActionPlan type; existing consumers are not affected (field is additive).
- **Acceptance:**
  - `EmailActionPlan` type extended with `escalation: { tier: 'NONE' | 'HIGH' | 'CRITICAL', triggers: string[], confidence: number }`.
  - HIGH triggers detected: cancellation/refund dispute, chargeback hint, repeated complaint, vulnerable circumstance.
  - CRITICAL triggers detected: legal threat, regulator/platform escalation threat, public-media threat, high-value dispute (≥configurable EUR threshold), explicit misconduct/fraud accusation.
  - Multiple triggers combine to highest tier.
  - Escalation classification runs after scenario classification (reuses normalized text and thread summary).
- **Validation contract:**
  - TC-01: Email mentioning "refund" + "dispute" → HIGH escalation tier.
  - TC-02: Email mentioning "lawyer" or "legal action" → CRITICAL escalation tier.
  - TC-03: Email mentioning "chargeback" → HIGH escalation tier.
  - TC-04: Standard FAQ question ("What time is check-in?") → NONE escalation tier.
  - TC-05: Email mentioning "I will contact Booking.com" → CRITICAL (platform escalation threat).
  - TC-06: Email with "medical" + "emergency" context → HIGH (vulnerable circumstance).
  - TC-07: Multiple HIGH triggers in one email → still HIGH (does not auto-promote to CRITICAL).
  - TC-08: Multiple triggers including one CRITICAL → CRITICAL (highest wins).
  - TC-09: Thread with 3+ prior staff responses + complaint tone → HIGH (repeated complaint).
  - TC-10: Existing pipeline fixtures still produce valid EmailActionPlan with `escalation.tier: 'NONE'` for standard scenarios.
  - Acceptance coverage: TC-01–03 cover HIGH triggers; TC-04 covers NONE baseline; TC-05–06 cover CRITICAL triggers; TC-07–08 cover combination logic; TC-09 covers thread-based detection; TC-10 covers backward compatibility.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/draft-interpret.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-interpret.test.ts packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed `classifyScenario` pattern at `draft-interpret.ts:406` — ordered regex with fixed confidence outputs.
  - Confirmed `ThreadSummary` type includes `prior_commitments`, `previous_response_count`, `tone_history` which can be used for repeated-complaint detection.
  - Confirmed `EmailActionPlan` is exported (line 46) and consumed by generate and quality-check stages.
  - Unexpected findings: None.
- **What would make this ≥90%:** Validated trigger keyword lists against real inbox samples (would be E2 evidence).
- **Rollout / rollback:**
  - Rollout: Additive field — no existing consumer breaks. Default `escalation.tier: 'NONE'` for unclassified.
  - Rollback: Remove escalation field; downstream consumers ignore it (field is optional until policy layer depends on it).
- **Documentation impact:** None
- **Notes / references:**
  - Fact-find escalation triggers: `docs/plans/email-autodraft-world-class-upgrade-fact-find.md` (lines 174–178)
  - EUR threshold: configurable constant, default €500, to be confirmed at CHECKPOINT.

---

### TASK-04: Unify scenario taxonomy across pipeline stages

- **Type:** IMPLEMENT
- **Deliverable:** code-change — shared category enum + alignment across 4 modules
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/draft-interpret.ts`, `packages/mcp-server/src/utils/template-ranker.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-03 _(file overlap: draft-interpret.ts)_
- **Blocks:** TASK-05, TASK-06, TASK-07
- **Confidence:** 80%
  - Implementation: 82% — Mechanical mapping from 19 template categories + 5 classifier categories to unified enum. Each file change is isolated.
  - Approach: 80% — Single shared enum is the standard pattern; avoids string-matching drift.
  - Impact: 78% — Touches 4+ files but each change is a category string replacement. Risk: missed mapping.
- **Acceptance:**
  - Shared `ScenarioCategory` enum (or union type) is defined and used by interpret, ranker, quality-check, and template data.
  - Interpret's `classifyScenario` outputs unified categories instead of 5 coarse categories.
  - Template ranker's category matching uses the unified enum.
  - Quality check's scenario-specific logic uses the unified enum.
  - Template JSON `category` field values align with the unified enum.
  - All existing pipeline integration tests pass (category expectations updated to unified values).
- **Validation contract:**
  - TC-01: Interpret classifies breakfast email → `ScenarioCategory.BREAKFAST` (not generic `faq`).
  - TC-02: Interpret classifies cancellation email → `ScenarioCategory.CANCELLATION`.
  - TC-03: Template ranker receives unified category → matches correct templates.
  - TC-04: Quality check receives unified category → applies correct length/content rules.
  - TC-05: All 36 existing pipeline fixtures → pass with unified categories.
  - TC-06: Template JSON categories are all valid `ScenarioCategory` values (lint test).
  - Acceptance coverage: TC-01–02 cover interpreter alignment; TC-03–04 cover consumer alignment; TC-05 covers regression; TC-06 covers data integrity.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`, `packages/mcp-server/src/__tests__/template-ranker.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/pipeline-integration.test.ts packages/mcp-server/src/__tests__/template-ranker.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed 19 template categories: access, activities, booking-changes, booking-issues, breakfast, cancellation, check-in, checkout, employment, faq, house-rules, lost-found, luggage, payment, policies, prepayment, promotions, transportation, wifi.
  - Confirmed 5 interpret categories: payment, cancellation, policy, faq, general (at `draft-interpret.ts:406–421`).
  - Confirmed quality check uses scenario-based length targets (at `draft-quality-check.ts:85–112`).
  - Unexpected findings: Template ranker hard-rule categories are `["prepayment", "cancellation"]` — these must be preserved in unified enum.
- **What would make this ≥90%:** Automated lint test verifying all template categories match the enum at build time.
- **Rollout / rollback:**
  - Rollout: Internal change — no MCP tool schema change, no external contract.
  - Rollback: Revert to string categories (all consumers currently use strings).
- **Documentation impact:** None
- **Notes / references:**
  - Template ranker hard rules: `template-ranker.ts:87` (`new Set(["prepayment", "cancellation"])`)
  - Quality check scenario targets: `draft-quality-check.ts:85–112`

---

### TASK-05: Upgrade quality gate to per-question coverage

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/draft-quality-check.ts`
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-04
- **Blocks:** TASK-07
- **Confidence:** 84%
  - Implementation: 88% — Current `answersQuestions` at line 168 is well-understood; upgrade path is clear (require minimum keyword coverage per question, not just `.some()`).
  - Approach: 82% — Per-question coverage is the natural improvement over global keyword matching. Synonym expansion already exists in ranker and can be reused.
  - Impact: 82% — May cause some existing tests to fail if current drafts don't meet stricter coverage — this is expected and desired.
- **Acceptance:**
  - `answersQuestions` requires minimum 2 keyword matches per question (up from 1 via `.some()`).
  - Per-question coverage score is tracked and reported in quality result.
  - Contradiction detection expanded beyond `not` + commitment token pattern (line 193) to handle common negation patterns ("cannot provide", "is not available", "we are unable to").
  - Quality result includes per-question breakdown (which questions were adequately addressed vs not).
  - Pipeline integration tests pass at ≥90% (some may need fixture/draft adjustment).
- **Validation contract:**
  - TC-01: Draft addressing all questions with ≥2 keywords each → quality passes.
  - TC-02: Draft missing one question entirely → `unanswered_questions` failure with question identified.
  - TC-03: Draft with only 1 keyword match for a multi-keyword question → quality warns (soft) or fails (hard) depending on question complexity.
  - TC-04: Contradiction "We cannot provide the early check-in you requested" detected against commitment "We will arrange early check-in".
  - TC-05: Contradiction "X is not available" detected against commitment "X is available".
  - TC-06: Non-contradiction "We can certainly provide" does NOT trigger false positive.
  - TC-07: Per-question breakdown in quality result includes question text and coverage score.
  - TC-08: Pipeline integration pass rate remains ≥90% after gate upgrade.
  - Acceptance coverage: TC-01–03 cover per-question coverage; TC-04–06 cover contradiction detection; TC-07 covers reporting; TC-08 covers regression.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/draft-quality-check.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-quality-check.test.ts packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed current `answersQuestions` at lines 168–191: `.every(question)` with `.some(keyword)` inside.
  - Confirmed `contradictsCommitments` at lines 193–209: only detects "not" within 2 tokens of commitment word.
  - Confirmed synonym expansion exists in template-ranker.ts (lines 89–112, 69 mappings) — can be extracted to shared utility.
  - Unexpected findings: None.
- **What would make this ≥90%:** Profiling current pass rate to understand how many drafts currently pass with shallow coverage (would reveal false-positive rate).
- **Rollout / rollback:**
  - Rollout: Quality gate becomes stricter — drafts that previously passed may now fail. This is intentional.
  - Rollback: Revert to `.some()` threshold.
- **Documentation impact:** None
- **Notes / references:**
  - Synonym dict: `template-ranker.ts:89–112` (candidate for shared extraction)
  - Current stop words: `draft-quality-check.ts:152–157`

---

### TASK-06: Add high-stakes pipeline test fixtures

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-07
- **Confidence:** 88%
  - Implementation: 92% — Test infrastructure is solid; adding fixtures follows exact established pattern (lines 146–579).
  - Approach: 85% — Fixture-driven testing with scenario coverage is the right pattern.
  - Impact: 85% — Test-only change; no production code affected.
- **Acceptance:**
  - Add ≥8 new fixtures covering gaps identified in fact-find:
    - Prepayment step 2 (2nd attempt failed).
    - Prepayment step 3 (cancelled after 3rd attempt).
    - Prepayment success.
    - Cancellation with medical/hardship mention.
    - Cancellation with dispute/chargeback language.
    - Payment dispute with legal threat language.
    - Composite: cancellation + refund in same email.
    - Composite: multiple high-stakes questions (payment + policy).
  - Each fixture includes `escalation` expectations (from TASK-03).
  - Each fixture uses unified categories (from TASK-04).
  - Pipeline pass rate remains ≥90% with expanded fixture set.
- **Validation contract:**
  - TC-01: All new fixtures are valid (pass pipeline without crashing).
  - TC-02: Cancellation-hardship fixture classifies as `cancellation` category with `HIGH` escalation.
  - TC-03: Legal-threat fixture classifies as `CRITICAL` escalation.
  - TC-04: Prepayment step-2 fixture selects correct template via hard-rule matching.
  - TC-05: Composite cancellation+refund fixture produces composite draft addressing both concerns.
  - TC-06: Expanded fixture set pass rate ≥90%.
  - Acceptance coverage: TC-01 covers fixture validity; TC-02–03 cover escalation; TC-04 covers template selection; TC-05 covers composite; TC-06 covers overall quality.
  - Validation type: integration
  - Validation location: `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed fixture schema at lines 146–579 in pipeline test.
  - Confirmed 2/36 cancellation fixtures (CAN-01, CAN-02) and 1/36 prepayment fixture (PRE-01) — gaps for steps 2/3/success.
  - Confirmed 4/36 by expectedCategory contain "cancellation" (CAN-01, CAN-02, AGR-04, SYS-02).
  - Unexpected findings: None.
- **Rollout / rollback:**
  - Rollout: Test-only change. No production impact.
  - Rollback: Remove fixtures.
- **Documentation impact:** None
- **Notes / references:**
  - Existing fixture IDs: FAQ-01–06, POL-01–03, PAY-01–03, CAN-01–02, AGR-01–05, PRE-01, BRK-01–02, LUG-01–02, WIFI-01, CHG-01, CO-01, HR-01, MOD-01, IT-01–02, SYS-01–05.

---

### TASK-07: Horizon checkpoint — reassess remaining plan

- **Type:** CHECKPOINT
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06
- **Blocks:** TASK-08
- **Confidence:** 95%
- **Acceptance:**
  - Run `/re-plan` on TASK-08, TASK-09, TASK-10 using evidence from completed tasks.
  - Reassess pipeline test pass rate after enrichment + classification + quality upgrades.
  - Confirm EUR threshold for high-value dispute escalation (default €500).
  - Confirm template rewrite source: use existing repo text as baseline (or import Gmail text if user provides it).
  - Update plan with any new findings, splits, or abandoned tasks.
- **Horizon assumptions to validate:**
  - Voice/guide integration measurably improves draft quality scores (evidence from TASK-01).
  - Knowledge snippets are scenario-relevant and don't cause prompt bloat (evidence from TASK-02).
  - Escalation tier classification doesn't produce false positives on routine emails (evidence from TASK-03 + TASK-06).
  - Unified taxonomy doesn't break existing template ranking (evidence from TASK-04).
  - Stricter quality gate doesn't drop pass rate below 90% threshold (evidence from TASK-05).
  - High-stakes fixtures expose real quality gaps that justify policy layer investment (evidence from TASK-06).

---

### TASK-08: Add policy decision layer before generation

- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `packages/mcp-server/src/tools/policy-decision.ts` + integration
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/src/tools/policy-decision.ts` (new), `packages/mcp-server/src/tools/draft-generate.ts`, `packages/mcp-server/src/tools/draft-quality-check.ts`, `packages/mcp-server/src/__tests__/policy-decision.test.ts` (new), `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - `[readonly] packages/mcp-server/src/tools/draft-interpret.ts` — reads EmailActionPlan type
- **Depends on:** TASK-07
- **Blocks:** TASK-09
- **Confidence:** 81%
  - Implementation: 83% — Policy rules are enumerated (non-refundable = no exceptions, tone constraints, mandatory content). New module follows quality-check pattern.
  - Approach: 80% — Policy layer between interpret and generate is the right insertion point. Constrains generation without restructuring it.
  - Impact: 80% — Crosses 3 integration boundaries (interpret type → policy → generate → quality validation). L-effort.
- **Acceptance:**
  - New `evaluatePolicy()` function takes `EmailActionPlan` (with escalation tier) → returns `PolicyDecision`.
  - `PolicyDecision` includes: `mandatoryContent` (phrases/sections that MUST appear), `prohibitedContent` (phrases that MUST NOT appear), `toneConstraints` (formal/empathetic/etc.), `reviewTier` ('standard' | 'mandatory-review' | 'owner-alert'), `templateConstraints` (category restrictions for template selection).
  - `draft-generate.ts` consumes `PolicyDecision` to constrain template selection and draft assembly.
  - `draft-quality-check.ts` validates `PolicyDecision.mandatoryContent` presence and `prohibitedContent` absence.
  - HIGH escalation → `mandatory-review` review tier.
  - CRITICAL escalation → `owner-alert` review tier.
  - Non-refundable cancellation → mandatory content includes policy statement; prohibited content excludes concession language.
  - Pipeline integration tests pass with policy layer active.
- **Validation contract:**
  - TC-01: Non-refundable cancellation → no-exceptions policy, empathetic tone, mandatory policy statement.
  - TC-02: HIGH escalation → mandatory-review flag set.
  - TC-03: CRITICAL escalation → mandatory-review + owner-alert.
  - TC-04: Routine FAQ → standard policy, no special constraints.
  - TC-05: Refundable booking refund request → standard refund-process policy path.
  - TC-06: Payment dispute → HIGH escalation policy.
  - TC-07: Legal threat → CRITICAL escalation policy.
  - TC-08: Policy output includes mandatory and prohibited content arrays.
  - TC-09: Policy output includes tone constraints matching scenario.
  - TC-10: Multiple escalation triggers → highest tier wins.
  - TC-11: Standard refundable cancellation → not escalated.
  - TC-12: Thread with 3+ exchanges + complaint → HIGH escalation.
  - Acceptance coverage: TC-01 covers non-refundable policy; TC-02–03 cover review tiers; TC-04–05 cover standard paths; TC-06–07 cover escalation mapping; TC-08–09 cover output structure; TC-10–12 cover edge cases.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/policy-decision.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/policy-decision.test.ts packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - Cross-boundary coverage: Integration tests verify interpret → policy → generate → quality pipeline end-to-end.
- **Execution plan:** Red → Green → Refactor
- **Scouts:**
  - `draft-generate.ts` has clear insertion point after template ranking (line 229) and before assembly (line 231) → confirmed, can pass `PolicyDecision` to constrain assembly.
  - `draft-quality-check.ts` `runChecks` function (line 211) accepts `actionPlan` and `draft` → can be extended to accept `PolicyDecision` as third argument.
- **Planning validation:**
  - Test stubs committed: `packages/mcp-server/src/__tests__/policy-decision.test.ts`
  - Confirmed generation insertion point: after `rankTemplates()` at line 229, before `selectedTemplate` at line 231.
  - Confirmed quality-check extension point: `runChecks()` at line 211 can accept additional argument.
  - Unexpected findings: None.
- **What would make this ≥90%:** Reviewed real cancellation/dispute emails to validate trigger keyword coverage.
- **Rollout / rollback:**
  - Rollout: Policy layer activates for all drafts. No feature flag (the layer defaults to standard policy for NONE escalation).
  - Rollback: Remove policy consumption from generate + quality-check; policy module becomes dead code.
- **Documentation impact:** `.claude/skills/process-emails/SKILL.md` — add review-tier guidance for mandatory-review and owner-alert scenarios.
- **Notes / references:**
  - Non-refundable policy: fact-find resolved Q (line 158) — no concessions, no exceptions.
  - Tone policy: factual + professional, not cold. Soften phrasing, not meaning.
  - EUR threshold: configurable constant `HIGH_VALUE_DISPUTE_EUR` (default 500, confirm at CHECKPOINT).

---

### TASK-09: Rewrite high-stakes templates against tone-policy rubric

- **Type:** IMPLEMENT
- **Deliverable:** mixed — `packages/mcp-server/data/email-templates.json` + template tests
- **Execution-Skill:** build-feature
- **Affects:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/__tests__/template-lint.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - `[readonly] packages/mcp-server/src/tools/policy-decision.ts` — reads policy rubric for tone alignment
- **Depends on:** TASK-08
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 82% — Template structure is well-understood (subject + body + category). Rewrites follow established format.
  - Approach: 80% — Rewriting against policy rubric ensures consistency. Tone-policy rubric from TASK-08 provides clear guidelines.
  - Impact: 78% — Template changes directly affect all draft output for these categories. Careful tone calibration needed.
- **Acceptance:**
  - Rewrite 2 cancellation templates ("Cancellation of Non-Refundable Booking", "No Show") with empathetic but policy-firm tone.
  - Rewrite 4 prepayment templates with clearer escalation language per chase step.
  - Rewrite 2 booking-issues templates ("Why cancelled", relevant others) to align with policy.
  - Add ≥3 new templates for missing high-stakes scenarios: medical/hardship response, dispute acknowledgment, overbooking handling.
  - All rewritten/new templates pass template-lint tests (no placeholders, no broken links, no policy keyword mismatches).
  - Rewritten templates remove rigidity ("pre-paid, non-refundable" phrasing softened to policy-aligned language).
  - Pipeline integration tests pass with rewritten templates.
- **Validation contract:**
  - TC-01: Rewritten cancellation template contains policy statement but no rigid "pre-paid, non-refundable" phrasing.
  - TC-02: Rewritten cancellation template includes empathetic opening before policy statement.
  - TC-03: New medical/hardship template addresses circumstance with compassion while maintaining policy.
  - TC-04: New dispute-acknowledgment template provides clear next-steps without conceding.
  - TC-05: All rewritten templates pass template-lint (no placeholders, valid links, policy keywords aligned).
  - TC-06: Pipeline integration with rewritten templates — pass rate ≥90%.
  - TC-07: Rewritten prepayment templates use escalating urgency across chase steps (1st gentle, 2nd firm, 3rd final).
  - Acceptance coverage: TC-01–02 cover tone; TC-03–04 cover new templates; TC-05 covers lint; TC-06 covers regression; TC-07 covers prepayment progression.
  - Validation type: unit + integration
  - Validation location: `packages/mcp-server/src/__tests__/template-lint.test.ts`, `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
  - Run: `pnpm exec jest --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/pipeline-integration.test.ts`
- **Execution plan:** Draft → Review → Finalize (mixed track: content drafting + test validation)
- **Planning validation:**
  - Confirmed 2 cancellation templates: "Cancellation of Non-Refundable Booking" and "No Show".
  - Confirmed 4 prepayment templates (Octorate 1st, Hostelworld 1st, 2nd attempt, cancelled post-3rd).
  - Confirmed rigid phrasing exists in 7 templates across categories.
  - Confirmed template-lint.test.ts checks: placeholder detection, broken links, policy keyword mismatch.
  - Unexpected findings: None.
- **What would make this ≥90%:** User-reviewed tone calibration samples (A/B comparison of old vs new template language).
- **Rollout / rollback:**
  - Rollout: Template changes take effect immediately for all new drafts. No feature flag.
  - Rollback: Revert template JSON to pre-rewrite state via git.
- **Documentation impact:** None (templates are data, not docs)
- **Notes / references:**
  - Canonical non-refundable wording: Gmail template (fact-find Q, line 171). Use existing repo text as baseline if Gmail text not provided.
  - Tone policy: factual + professional, not cold (fact-find resolved Q, line 161).

---

### TASK-10: Migrate booking email to MCP-only (remove GAS fallback)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/services/useBookingEmail.ts`
- **Execution-Skill:** build-feature
- **Affects:** `apps/reception/src/services/useBookingEmail.ts`
  - `[readonly] apps/reception/src/app/api/mcp/booking-email/route.ts` — verify MCP route is functional
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — MCP path already works (lines 121–134). Remove flag check and GAS fallback (lines 135–148).
  - Approach: 85% — Hard cut confirmed by sponsor. No fallback window needed.
  - Impact: 80% — Removes a live code path. Must verify MCP route is production-ready.
- **Acceptance:**
  - `isMcpBookingEmailEnabled()` flag check removed — always uses MCP path.
  - GAS fallback code (hardcoded URL at line 143) removed entirely.
  - MCP path error handling preserved and tested.
  - Booking email functionality verified end-to-end via existing test infrastructure.
- **Validation contract:**
  - TC-01: `sendBookingEmail` sends via MCP route (POST to `/api/mcp/booking-email`).
  - TC-02: MCP route error → function throws with descriptive error (no silent fallback to GAS).
  - TC-03: Payload format unchanged (bookingRef, recipients, occupantLinks).
  - TC-04: Test mode override (`EMAIL_TEST_MODE`) still works via MCP path.
  - Acceptance coverage: TC-01 covers primary path; TC-02 covers error handling; TC-03 covers payload contract; TC-04 covers test mode.
  - Validation type: unit
  - Validation location: existing or new test for `useBookingEmail`
  - Run: relevant reception test suite
- **Execution plan:** Red → Green → Refactor
- **Planning validation:**
  - Confirmed MCP path at lines 121–134 in useBookingEmail.ts.
  - Confirmed GAS fallback at lines 135–148 with hardcoded URL.
  - Confirmed `isMcpBookingEmailEnabled()` import at line 27.
  - Confirmed MCP route handler at `apps/reception/src/app/api/mcp/booking-email/route.ts:5` — thin wrapper delegating to `@acme/mcp-server`.
  - Unexpected findings: None.
- **What would make this ≥90%:** End-to-end test sending a booking email through MCP route in test environment.
- **Rollout / rollback:**
  - Rollout: Hard cut — GAS fallback removed at deploy.
  - Rollback: Re-add flag check and GAS URL (git revert).
- **Documentation impact:** None
- **Notes / references:**
  - GAS script URL (to be removed): `AKfycbz236VUy...` at `useBookingEmail.ts:143`
  - MCP route: `apps/reception/src/app/api/mcp/booking-email/route.ts`

---

## Deferred to Phase 2

The following are explicitly out of scope for this plan. They should be planned separately after Phase 1 is complete.

| Item | Hypothesis | Confidence | Reason for Deferral |
|------|-----------|------------|---------------------|
| Guest email GAS migration | A9 (partial) | 75% | Requires new MCP tool; unclear requirements for `useEmailGuest` migration. Needs `/fact-find`. |
| Operator ergonomics | A8 | 72% | Workflow design changes need operator feedback data. Fact-find estimates are directional only. |
| GAS inbox monitor migration | A9 (partial) | 65% | `Code.gs` inbox monitoring has no MCP equivalent yet. Large scope, needs separate plan. |
| Hardcoded knowledge sync | F8 (partial) | 70% | Room/menu data drift is a risk but not urgent. Build step or JSON generation needed. |

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stricter quality gate drops pipeline pass rate below 90% | Medium | High | TASK-05 adjusts thresholds carefully; TASK-06 adds fixtures to validate. CHECKPOINT validates before policy layer. |
| Unified taxonomy breaks template ranking | Medium | Medium | TASK-04 preserves hard-rule categories (prepayment, cancellation). Existing ranker tests validate. |
| Policy layer introduces over-constraining for routine emails | Low | Medium | Default policy for NONE escalation imposes no additional constraints. |
| GAS removal breaks booking email for edge cases | Low | High | MCP path already handles all cases. Verify with existing test infrastructure before removal. |
| EUR threshold miscalibrated | Medium | Medium | Configurable constant; adjust post-deployment based on real escalation patterns. |

## Observability

- Logging: Log escalation tier classification for each processed email (tier, triggers, confidence).
- Metrics: Track quality gate pass/fail rate broken down by escalation tier and scenario category.
- Alerts/Dashboards: Alert on >2 CRITICAL escalations per day (unusual volume). Dashboard for policy decision distribution.

## Acceptance Criteria (overall)

- [ ] Voice/guide resources are consumed in generation (not loaded-and-ignored).
- [ ] Knowledge summaries provide cited content, not just counts.
- [ ] Escalation tier classification detects HIGH and CRITICAL scenarios.
- [ ] Unified taxonomy used across all pipeline stages.
- [ ] Quality gate validates per-question coverage (not global keyword match).
- [ ] High-stakes test fixtures cover cancellation, prepayment, dispute, and composite scenarios.
- [ ] Policy decision layer constrains generation based on escalation tier and business rules.
- [ ] High-stakes templates rewritten with empathetic, policy-firm tone.
- [ ] Booking email sends via MCP-only (GAS fallback removed).
- [ ] Pipeline integration tests pass at ≥90% with all changes active.
- [ ] No regressions in existing email processing functionality.

## Decision Log

- 2026-02-10: Hybrid architecture confirmed by sponsor — deterministic for routine, richer composition for sensitive.
- 2026-02-10: Non-refundable policy = no exceptions. Language softened, meaning fixed.
- 2026-02-10: Hard cut to MCP-only at release for booking email. No GAS fallback window.
- 2026-02-10: EN only for phase 1 sensitive scenarios.
- 2026-02-10: EUR threshold for high-value dispute defaulted to €500 (configurable); to be confirmed at CHECKPOINT.
- 2026-02-10: Template rewrite uses existing repo text as baseline; Gmail template sync deferred to user-initiated import.
