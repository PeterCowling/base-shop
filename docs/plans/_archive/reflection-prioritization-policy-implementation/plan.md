---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Operations
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reflection-prioritization-policy-implementation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); effort-weighted average S=1 M=2 L=3
Auto-Build-Intent: plan+auto
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

# Reflection Prioritization Policy Implementation Plan

## Summary

Implements the advisory phase (Phase 1) of the externally-reviewed canonical idea prioritization policy (v2). A new pure-function classifier module (`lp-do-ideas-classifier.ts`) applies the 8-tier decision tree (P0/P0R/P1+proximity/P1M/P2–P5), evidence-gated urgency admission (U0/U1/U2/U3), auto-demotion, and prerequisite ordering to produce a typed `IdeaClassification` record for every dispatched idea. Classifications are persisted as a separate JSONL artifact (`classifications.jsonl`) alongside the existing queue-state and telemetry — no changes to existing dispatch packet formats, schemas, or routing logic. The plan is purely additive with no enforcement gating; the output enables operator calibration before Phase 4 enforcement is turned on.

## Active Tasks

- [x] TASK-01: Define canonical classification types
- [x] TASK-02: Implement classifier module
- [x] TASK-03: Write classifier tests
- [x] TASK-04: Wire classifier into orchestrator
- [x] TASK-05: Add persistence and update trial contract
- [x] TASK-06: Update lp-do-ideas SKILL.md with evidence field guidance

## Goals

- New `lp-do-ideas-classifier.ts` module: pure `classifyIdea()` function implementing the 8-tier decision tree, urgency admission rules, auto-demotion, and `effective_priority_rank` computation
- New `IdeaClassification` TypeScript interface carrying all Section 4.1–4.4 fields from the canonical policy
- `classifications.jsonl` persisted to the designated trial artifact path
- Trial contract Section 6 updated with the new artifact path
- `/lp-do-ideas` SKILL.md updated with evidence field guidance
- All decision tree branches, urgency gates, and auto-demotion paths covered by unit tests
- `pnpm typecheck && pnpm lint` passes with no new errors

## Non-goals

- Enforcement gating (policy Phase 4)
- Blocking dispatch admission on missing classification fields
- Changing `priority: "P1"|"P2"|"P3"` on dispatch packets (coarse field retained for queue scheduling)
- Migrating existing queue-state.json or telemetry.jsonl entries
- Implementing the weekly audit sampling runner (policy Phase 5)
- Changing `planNextDispatches()` sort key to use `effective_priority_rank` (Phase 4 change)

## Constraints & Assumptions

- Constraints:
  - `lp-do-ideas-classifier.ts` must be a pure function (no file I/O, injectable clock for `classified_at`)
  - Classification fields must NOT be embedded in dispatch packets — both schemas have `additionalProperties: false`; the separate-record approach is mandatory in Phase 1
  - New artifact path `classifications.jsonl` must be added to trial contract Section 6 before the classifier writes to it (contract-first pattern)
  - Writer lock must be acquired before committing; pre-commit hooks must not be skipped
- Assumptions:
  - U0 leakage threshold is undefined for Phase 1; U0 admission relies only on `incident_id` or `deadline_date` until the operator defines a threshold
  - The persistence adapter's `appendTelemetry` pattern (atomic write-to-temp-then-rename + JSONL deduplication) is the model for `classifications.jsonl` persistence
  - The classifier is called by the orchestrator after packet emission; classification failure is non-fatal (log and skip, do not abort dispatch)

## Inherited Outcome Contract

- **Why:** The current pipeline generates dispatch packets with no canonical classification. Any priority assignment is ad-hoc. The externally-reviewed policy v2 defines an auditable, deterministic schema that, once implemented in advisory mode, lets the operator calibrate tier and urgency distributions before enforcement is turned on.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Advisory-phase classifier module implemented — every idea dispatched through the trial pipeline receives a complete canonical classification record (priority_tier, urgency, effort, reason_code, effective_priority_rank) persisted to the trial artifact store, without gating or blocking existing pipeline flow. Rollout Phase 1 of the canonical policy is complete.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/reflection-prioritization-policy-implementation/fact-find.md`
- Key findings used:
  - `additionalProperties: false` on both v1 and v2 dispatch schemas → separate-record architecture is mandatory
  - `priority: "P2"` hardcoded at lp-do-ideas-trial.ts line 918 → gap is complete; no partial classification exists
  - `appendTelemetry()` in lp-do-ideas-persistence.ts is the exact persistence model — JSONL append with dedup, atomic write, malformed-line tolerance
  - `lp-do-ideas-persistence.ts` exists and exports `appendTelemetry()` and `atomicWrite` helpers — TASK-05 should follow this pattern exactly (separate JSONL append function, not extending `persistOrchestratorResult`)
  - No classification code exists anywhere in `scripts/src/startup-loop/`
  - `TrialDispatchPacketV2.trigger` is `"artifact_delta" | "operator_idea"` — classifier input type must handle both; nullable `artifact_id` for `operator_idea`

## Proposed Approach

- Option A: Embed classification fields in dispatch packets (extend both schemas + TypeScript interfaces)
- Option B: New pure classifier module producing a separate `IdeaClassification` record (chosen)
- Option C: AI-only classification with no code enforcement

Chosen approach: **Option B** — the `additionalProperties: false` constraint on both schemas makes Option A a non-starter for advisory phase (regression risk in validation and routing). Option B is strictly additive: new file, new JSONL artifact, no changes to existing interfaces or schemas in Phase 1. Option C omits the auto-demotion and anti-gaming controls required by the policy.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

---

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define canonical classification TypeScript types | 90% | S | Complete (2026-02-26) | — | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Implement lp-do-ideas-classifier.ts | 85% | M | Complete (2026-02-26) | TASK-01 | TASK-03, TASK-04, TASK-05, TASK-06 |
| TASK-03 | IMPLEMENT | Write lp-do-ideas-classifier.test.ts | 85% | M | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Wire classifier into orchestrator | 85% | S | Complete (2026-02-26) | TASK-02, TASK-03 | — |
| TASK-05 | IMPLEMENT | Add persistence + update trial contract | 85% | S | Complete (2026-02-26) | TASK-02 | — |
| TASK-06 | IMPLEMENT | Update lp-do-ideas SKILL.md | 85% | S | Complete (2026-02-26) | TASK-02 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Types-first; all downstream tasks depend on types |
| 2 | TASK-02 | TASK-01 complete | Classifier implementation; unblocks all wave 3+ tasks |
| 3 | TASK-03, TASK-05, TASK-06 | TASK-02 complete | Tests, persistence, SKILL.md all unblocked by classifier; run in parallel |
| 4 | TASK-04 | TASK-02, TASK-03 complete | Wire-up requires passing tests as gate |

---

## Tasks

### TASK-01: Define canonical classification TypeScript types

- **Type:** IMPLEMENT
- **Deliverable:** New TypeScript types exported from `scripts/src/startup-loop/lp-do-ideas-classifier.ts` (or an adjacent `-types.ts` file if the build agent prefers separation — the classifier file is the preferred single-file approach)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - `scripts/src/startup-loop/lp-do-ideas-classifier.ts` created (720 lines, 1 file)
  - All exported types present: `PriorityTier`, `Proximity`, `Urgency`, `Effort`, `ReasonCode`, `OwnPriorityRank`, `OWN_PRIORITY_RANK`, `IdeaClassificationInput`, `IdeaClassification`, `ClassifierOptions`
  - TC-01 pass: `IdeaClassification` has all 22+ fields from policy Sections 4.1–4.4
  - TC-02 pass: `proximity` is `Proximity = "Direct" | "Near" | "Indirect" | null` — null allowed for non-P1
  - TC-03 pass: `RULE_INSUFFICIENT_EVIDENCE` present in `ReasonCode` union
  - `npx tsc --project scripts/tsconfig.json --noEmit` → 0 errors
  - `eslint` on new file → 0 errors, 0 warnings
  - Commit: 29d15c577e
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-classifier.ts` (new)
- **Depends on:** —
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — All types are directly readable from the canonical policy Sections 4.1–4.4. No ambiguity. Derivation is mechanical.
  - Approach: 90% — Single-file approach (types + implementation in `lp-do-ideas-classifier.ts`) follows existing module pattern in the directory. No external dependencies.
  - Impact: 90% — Types are the foundation for all downstream tasks; correct type definitions prevent rework. The policy is explicit about every field and its constraints.
  - Held-back test (all dimensions ≥90): No single unknown would push any dimension below 90. The policy document enumerates every required field, union value, and nullability rule. The existing module pattern is clear.
- **Acceptance:**
  - `IdeaClassificationInput` exported: accepts `trigger`, `area_anchor`, `evidence_refs`, `source_path?`, `source_excerpt?`, nullable evidence fields from Section 4.4, optional `parent_idea_id`, `is_prerequisite`
  - `IdeaClassification` exported: all Section 4.1–4.4 fields, `classified_by: string`, `classified_at: string` (ISO-8601), `status: "open" | "queued" | "in_progress" | "actioned" | "deferred" | "rejected"`
  - `PriorityTier` union exported: `"P0" | "P0R" | "P1" | "P1M" | "P2" | "P3" | "P4" | "P5"`
  - `Proximity` union exported: `"Direct" | "Near" | "Indirect" | null`
  - `Urgency` union exported: `"U0" | "U1" | "U2" | "U3"`
  - `Effort` union exported: `"XS" | "S" | "M" | "L" | "XL"`
  - `ReasonCode` union exported: covers deterministic rule identifiers (`RULE_LEGAL_EXPOSURE`, `RULE_REVENUE_PATH_BROKEN`, `RULE_P1_DIRECT_CAUSAL`, `RULE_P1M_MARGIN_LEAKAGE`, `RULE_P2_OPERATOR_EXCEPTION`, `RULE_P3_MEASUREMENT`, `RULE_P4_PROCESS_QUALITY`, `RULE_P5_DEFAULT`, `RULE_INSUFFICIENT_EVIDENCE`)
  - `OwnPriorityRank` integer mapping exported (1–10 per Section 6.2)
  - TypeScript compiles without errors on new types
- **Validation contract:**
  - TC-01: `IdeaClassification` type has all 22+ fields from policy Sections 4.1–4.4 — verified by reading the compiled output
  - TC-02: `proximity` is `null` for non-P1 tiers in test fixtures
  - TC-03: `ReasonCode` includes `RULE_INSUFFICIENT_EVIDENCE` for auto-demotion path
- **Execution plan:** Red -> Green -> Refactor
  - Red: create file with empty exports → typecheck fails
  - Green: define all types per policy; typecheck passes
  - Refactor: add JSDoc on each type documenting policy section reference; document relationship between coarse `priority` field (dispatch packet) and `priority_tier` (classification record)
- **Planning validation:** None required (S effort)
- **Scouts:** None: types are directly specified in policy doc
- **Edge Cases & Hardening:**
  - `proximity` must be typed to allow `null` at the union level AND enforce `null` for non-P1 at runtime (enforced by classifier logic in TASK-02, not by TypeScript type narrowing)
  - `IdeaClassificationInput` must accept nullable `artifact_id` for `operator_idea` trigger dispatches
- **What would make this >=90%:** Already at 90%; reaches 95% once verified against a TypeScript build pass.
- **Rollout / rollback:**
  - Rollout: New file only; no existing code changed.
  - Rollback: Delete `lp-do-ideas-classifier.ts`.
- **Documentation impact:** JSDoc on each exported type cites the canonical policy section.
- **Notes / references:**
  - Policy: `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md`
  - `OwnPriorityRank` integer mapping (1=P0, 2=P0R, 3=P1+Direct, 4=P1M, 5=P1+Near, 6=P1+Indirect, 7=P2, 8=P3, 9=P4, 10=P5)

---

### TASK-02: Implement lp-do-ideas-classifier.ts

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/lp-do-ideas-classifier.ts` — exports `classifyIdea(input: IdeaClassificationInput, options?: ClassifierOptions): IdeaClassification`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - `classifyIdea()` exported and callable; decision tree covers all 8 tiers (P0–P5)
  - Auto-demotion: P0 missing `risk_ref` → P4 + `RULE_INSUFFICIENT_EVIDENCE`; P0R requires `incident_id` OR (`failure_metric`+`baseline_value`); P1+Direct requires `funnel_step`+`metric_name`+`baseline_value`
  - Urgency gates: U0 (incident_id, deadline ≤72h, leakage > threshold); U1 (first_observed_at ≤7d, deadline ≤14d); U2 default
  - `classified_by: "lp-do-ideas-classifier-v1"`, `classified_at` from injectable clock, `status: "open"` always
  - `// Phase 4: prerequisite inheritance — deferred` comment at deferral site
  - U0 leakage gate disabled by default (`u0_leakage_threshold` undefined)
  - `npx tsc --project scripts/tsconfig.json --noEmit` → 0 errors
  - Commit: 29d15c577e (combined with TASK-01)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-classifier.ts` (new — types + implementation)
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 85% — The decision tree (Section 5), urgency gates (Section 8), auto-demotion rules (Section 9), and rank computation (Section 6) are fully specified in the policy. The implementation is a direct mechanical translation. The only ambiguity is the leakage threshold for U0 gate 3 — handled by defaulting to `undefined` (disabled) with an injectable threshold in `ClassifierOptions`.
  - Approach: 85% — Pure function pattern with injectable clock and threshold is proven in this codebase (`TrialQueue` uses injectable clock). The decision tree is 8 linear branches with a first-match-wins rule — simple switch/if-else chain.
  - Impact: 85% — This is the core deliverable. Without this task, no classification output is produced. Auto-demotion and urgency gating directly affect signal quality.
  - Held-back test (Implementation at 85%, not 80): Held-back threshold not applicable — score is above 80. Capped at 85 (not 90) because: leakage threshold undefined introduces one untested code path (U0 gate 3), and the `effective_priority_rank` prerequisite inheritance requires reading a parent classification from a store that does not yet exist — deferred to defaulting `is_prerequisite = false` in Phase 1 with a `parent_idea_id` field that is always null until a future task wires up parent lookups.
- **Acceptance:**
  - `classifyIdea()` exported and callable with any `IdeaClassificationInput`
  - Decision tree: P0 fires when `risk_vector` is present; P0R fires when `incident_id` or `failure_metric`+`baseline_value` present; P1-Direct fires when `funnel_step`+`metric_name`+`baseline_value` present; P1M for margin leakage signals; P2/P3/P4/P5 by content tag defaults
  - Auto-demotion: P0 missing `risk_vector`+`risk_ref` → demotes to P4 with `reason_code: RULE_INSUFFICIENT_EVIDENCE`; P0R missing required evidence → demotes; P1-Direct missing funnel evidence → demotes
  - `urgency`: U0 requires `incident_id` (open/mitigated) OR `deadline_date` within 72h; U1 requires recurrence in 7 days OR deadline within 14 days OR linked launch blocker; default U2; U3 for speculative items
  - `effective_priority_rank`: equals `own_priority_rank` (prerequisite inheritance deferred — `is_prerequisite` always false, `parent_idea_id` always null in Phase 1)
  - `classified_by`: `"lp-do-ideas-classifier-v1"`
  - `classified_at`: injectable clock result as ISO-8601 string
  - `status`: always `"open"` at classification time
  - `proximity`: set correctly for P1 tiers; `null` for all others; validates and throws if P1 tier produced without proximity
- **Validation contract:**
  - TC-01: `classifyIdea({ risk_vector: "security", risk_ref: "CVE-2026-001", ... })` → `priority_tier: "P0"`, `reason_code: "RULE_LEGAL_EXPOSURE"`, `urgency: "U2"` (no incident or deadline)
  - TC-02: `classifyIdea({ incident_id: "INC-001", ... })` → `priority_tier: "P0R"`, `urgency: "U0"` (incident_id present)
  - TC-03: `classifyIdea({ funnel_step: "checkout_start", metric_name: "checkout_cr", baseline_value: 0.45, ... })` → `priority_tier: "P1"`, `proximity: "Direct"`
  - TC-04: `classifyIdea({})` (no evidence) → `priority_tier: "P5"`, `reason_code: "RULE_P5_DEFAULT"`, `urgency: "U2"`
  - TC-05: P0 input missing `risk_ref` → auto-demotes to `P4`, `reason_code: "RULE_INSUFFICIENT_EVIDENCE"`
  - TC-06: P0R input missing both `incident_id` and `failure_metric` → auto-demotes
  - TC-07: P1-Direct input missing `baseline_value` → auto-demotes
  - TC-08: `deadline_date` within 72h (from injectable now) → `urgency: "U0"` regardless of tier
  - TC-09: `classified_by === "lp-do-ideas-classifier-v1"` always
  - TC-10: `classified_at` is ISO-8601 string from injectable clock
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add type stubs only; `classifyIdea` returns `null as any`; tests fail (via TASK-03 TC definitions)
  - Green: Implement decision tree branches one by one; urgency gates; auto-demotion; rank computation; all TC pass
  - Refactor: Extract `ownPriorityRank()` helper; add JSDoc; ensure consistent naming with policy section references
- **Planning validation (M effort):**
  - Consumer tracing for new outputs: `IdeaClassification` record is returned from `classifyIdea()`. Consumers in this plan: TASK-04 (orchestrator wiring) and TASK-05 (persistence). No existing code consumes it yet (new function). No silent fallback risk.
  - Modified behavior check: No existing function signatures changed. New file only.
  - New output check: `classifyIdea()` return value → TASK-04 reads it and attaches to orchestrator result; TASK-05 persists it. Both are explicit in their respective tasks.
  - Unexpected findings: None — implementation is purely additive.
- **Scouts:** `effective_priority_rank` prerequisite inheritance requires a parent classification lookup. In Phase 1 this is deferred — `is_prerequisite = false` always, `parent_idea_id = null` always. A future enforcement-phase task will wire up the parent lookup once a classifications store is queryable.
- **Edge Cases & Hardening:**
  - `deadline_date` parsing: use `Date.parse()` for ISO date strings; if parsing fails, treat as absent (do not throw)
  - `leakage_estimate_value` U0 gate: threshold is injectable (`ClassifierOptions.u0_leakage_threshold?`); if `undefined`, gate is disabled (U0 not granted on leakage alone)
  - P1 without proximity: internal invariant error — throw with descriptive message (never surfaces in production; indicates decision tree bug)
  - All nullable evidence fields: treat absent/null/undefined identically (coerce to null for output)
  - `risk_vector` values outside the allowed enum: treat as absent (auto-demote)
- **What would make this >=90%:**
  - Confirm `effective_priority_rank` prerequisite inheritance is explicitly deferred (not forgotten) by adding a `// Phase 4: prerequisite inheritance` comment at the deferred call site
  - Leakage threshold gate confirmed as disabled-by-default with a dedicated TC in TASK-03
- **Rollout / rollback:**
  - Rollout: New file, no existing files changed. Zero deployment risk.
  - Rollback: Delete `lp-do-ideas-classifier.ts`; remove import from orchestrator (TASK-04 is the only caller).
- **Documentation impact:** Module-level JSDoc documents the advisory phase context and policy version.
- **Notes / references:**
  - Policy decision tree: `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` Section 5
  - Urgency admission: Section 8
  - Auto-demotion: Section 9
  - Rank mapping: Section 6.2

---

### TASK-03: Write lp-do-ideas-classifier.test.ts

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` — all decision tree branches, urgency gates, auto-demotion paths, rank computation, and anti-gaming field presence covered
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - 33 test cases in 6 describe blocks: decision tree (TC-01–09), auto-demotion (TC-10–11), urgency admission (TC-12–20), rank computation (TC-21–25), Phase 1 defaults (TC-26–32), OWN_PRIORITY_RANK (TC-33)
  - All 8 decision tree branches covered (P0 through P5)
  - All 3 auto-demotion paths covered (P0/P0R/P1-Direct missing evidence)
  - U0/U1/U2 urgency gates, leakage gate disabled by default confirmed
  - `classified_by === "lp-do-ideas-classifier-v1"` verified in every test; `proximity === null` for non-P1 tiers verified
  - All 10 `own_priority_rank` values verified against Section 6.2 mapping
  - Test runner: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-classifier` exits 0
  - Commit: 4b6a1f3964
- **Affects:**
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` (new)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — All test cases are directly derivable from the policy decision tree and urgency rules. The classifier is a pure function — no mocking required beyond the injectable clock.
  - Approach: 85% — Follows the established test pattern in this directory (`describe`/`it` blocks, `@jest/globals`, fixture builders). Injectable clock via `ClassifierOptions`.
  - Impact: 85% — Tests are the validation gate for TASK-02. Without passing tests, TASK-04 wire-up is not safe. Tests also serve as living documentation of the policy rules.
- **Acceptance:**
  - All 8 decision tree branches covered (P0 through P5)
  - All 3 auto-demotion paths covered (P0/P0R/P1-Direct missing evidence)
  - U0 gates: deadline within 72h, incident present, leakage gate (disabled by default)
  - U1 gates: deadline within 14 days, recurrence flag
  - Default U2 fallback
  - `classified_by === "lp-do-ideas-classifier-v1"` verified in every test
  - `classified_at` is injectable clock result
  - `proximity === null` for all non-P1 tiers verified
  - `effective_priority_rank === own_priority_rank` in Phase 1 (no parent)
  - All 10 `own_priority_rank` values verified against Section 6.2 mapping
  - Test runner: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-classifier` exits 0
- **Validation contract:**
  - TC-01 through TC-10 from TASK-02 must all have corresponding test cases
  - TC-11: `proximity` is `null` for P0, P0R, P1M, P2, P3, P4, P5 tiers
  - TC-12: `own_priority_rank` = 1 for P0; 2 for P0R; 3 for P1+Direct; 4 for P1M; 5 for P1+Near; 6 for P1+Indirect; 7 for P2; 8 for P3; 9 for P4; 10 for P5
  - TC-13: leakage U0 gate disabled when `u0_leakage_threshold` is undefined
  - TC-14: `status` is always `"open"` at classification time
- **Execution plan:** Red -> Green -> Refactor
  - Red: Write test file importing from classifier; all tests fail (classifier returns stub)
  - Green: Tests pass once TASK-02 implementation is complete
  - Refactor: Group tests by decision tree section; add descriptive `describe` blocks matching policy section names
- **Planning validation (M effort):**
  - This task produces only test assertions. No new code outputs beyond the test file itself.
  - Consumer tracing: Not applicable (test file has no runtime consumers).
- **Scouts:** None: pure test task.
- **Edge Cases & Hardening:**
  - Test the `deadline_date` boundary condition at exactly 72h, 71h59m, and 72h01m from injectable now
  - Test `risk_vector` with an invalid value → auto-demotion to P4
  - Test completely empty input `{}` → P5 default
- **What would make this >=90%:**
  - Add a snapshot test that serializes a complete `IdeaClassification` record to JSON and verifies the shape matches the canonical policy Section 4 schema exactly
- **Rollout / rollback:**
  - Rollout: New test file only. Zero production risk.
  - Rollback: Delete test file.
- **Documentation impact:** Test file doubles as executable policy documentation.
- **Notes / references:**
  - Run command: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern=lp-do-ideas-classifier`

---

### TASK-04: Wire classifier into orchestrator

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/src/startup-loop/lp-do-ideas-trial.ts` — orchestrator calls `classifyIdea()` after packet emission; classification record attached to orchestrator result; classification failure is non-fatal
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - `TrialOrchestratorResult` extended with `classifications: IdeaClassification[]` field
  - `classifyIdea()` called once per dispatched packet after `dispatched.push()`; non-fatal try/catch with stderr logging
  - `IdeaClassificationInput` populated from packet `trigger`, `artifact_id`, `area_anchor`, `evidence_refs`
  - 87/87 existing `lp-do-ideas-trial.test.ts` tests pass without modification (additive change)
  - JSDoc on `classifications` field directs caller to persist via `appendClassifications()`
  - `pnpm typecheck && pnpm lint` pass with no new errors
  - Commit: f4c6edfcfc
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-trial.ts` (modified)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** TASK-05
- **Confidence:** 85%
  - Implementation: 85% — The orchestrator dispatch emission point is at line 918 (where `priority: "P2"` is hardcoded). The classifier is called after that point with the packet's `area_anchor`, `evidence_refs`, and evidence fields. The wiring is a small addition to the existing orchestrator flow.
  - Approach: 85% — Non-fatal failure pattern (try/catch, log and continue) is already established in the codebase. No new architectural pattern required.
  - Impact: 85% — This task is what connects the classifier to live dispatch flow. Without it, the classifier exists but is never called.
  - Held-back test (Implementation at 85%): Capped because the orchestrator function at line 703 needs to be read carefully to identify the exact insertion point without disrupting the existing dispatch emission and deduplication logic.
- **Acceptance:**
  - `classifyIdea()` is called once per dispatched packet
  - Classification result is attached to `TrialOrchestratorResult` (or a new wrapper — build agent decides the cleanest approach, e.g. a `classifications: IdeaClassification[]` field alongside `dispatched: TrialDispatchPacket[]`)
  - If `classifyIdea()` throws, the error is caught, logged to stderr, and the orchestrator continues (classification failure does not abort dispatch)
  - Existing tests in `lp-do-ideas-trial.test.ts` continue to pass (no regressions)
  - `pnpm typecheck` passes with the new field on `TrialOrchestratorResult`
- **Validation contract:**
  - TC-01: Orchestrator run with a valid dispatch packet → `result.classifications` contains one `IdeaClassification` record
  - TC-02: Orchestrator run where classifier throws → dispatch still completes; `result.classifications` is empty or contains error sentinel
  - TC-03: Existing orchestrator unit tests pass without modification
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add `classifications` field to `TrialOrchestratorResult` → typecheck fails until populated
  - Green: Call `classifyIdea()` at dispatch point; populate `result.classifications`; typecheck passes
  - Refactor: Ensure non-fatal failure path is clean; add JSDoc on the new field
- **Planning validation (S effort):** None required.
- **Scouts:** Read lines 700–950 of `lp-do-ideas-trial.ts` to identify exact dispatch emission point and `TrialOrchestratorResult` definition before modifying.
- **Edge Cases & Hardening:**
  - `operator_idea` packets: pass `trigger: "operator_idea"` and `artifact_id: null` to classifier input; classifier must not throw on null artifact_id
  - Multiple dispatches in one orchestrator run: `result.classifications` must have one entry per dispatched packet, in the same order
- **What would make this >=90%:**
  - Read the orchestrator return type definition before writing to confirm `TrialOrchestratorResult` field name conventions
- **Rollout / rollback:**
  - Rollout: One file modified; classification is purely additive to the result object
  - Rollback: Remove the `classifyIdea()` call and `classifications` field from the result
- **Documentation impact:** JSDoc on `TrialOrchestratorResult.classifications` field.
- **Notes / references:**
  - `TrialOrchestratorResult` defined at lp-do-ideas-trial.ts line 365
  - `TrialOrchestratorError` at line 374
  - Connection to TASK-05: after TASK-04 attaches `result.classifications` to `TrialOrchestratorResult`, the caller of `runTrialOrchestrator()` (the CLI or hook layer) is responsible for calling `appendClassifications(classificationsPath, result.classifications)`. TASK-04 does not call `appendClassifications()` directly — it only populates the result. The build agent implementing TASK-04 should add a note to the orchestrator result type's JSDoc indicating that `classifications` should be persisted via `appendClassifications()` after the orchestrator call.

---

### TASK-05: Add persistence and update trial contract

- **Type:** IMPLEMENT
- **Deliverable:** (a) `appendClassifications()` function in `scripts/src/startup-loop/lp-do-ideas-persistence.ts`; (b) `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` created (empty); (c) `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` Section 6 updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - Pre-existing: `appendClassifications(filePath, records)` already present in `lp-do-ideas-persistence.ts` following `appendTelemetry` pattern (JSONL, atomicWrite, dedup by `idea_id+classified_at`, malformed-line tolerance)
  - Pre-existing: `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` exists (empty)
  - Pre-existing: Trial contract Section 6 table already has classification records row
  - Wave 3 analysis confirmed all three deliverables were implemented prior to this build cycle
  - No additional changes required; task accepted as-is
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-persistence.ts` (modified — new `appendClassifications()` export)
  - `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` (new — empty file)
  - `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` (modified — Section 6 table)
- **Depends on:** TASK-02
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 90% — The `appendTelemetry()` function in `lp-do-ideas-persistence.ts` is the exact pattern to follow. `appendClassifications()` is a near-identical implementation: read existing JSONL, deduplicate by `idea_id+classified_at`, atomicWrite. The dedup key for classifications is `idea_id + classified_at` (two classifications for the same idea at the same timestamp are duplicates).
  - Approach: 85% — Contract-first pattern (update contract before writing to the path) is documented in the planning constraints.
  - Impact: 85% — Without this task, the classifier output is never persisted. The `classifications.jsonl` artifact is the primary observable output for advisory phase calibration.
- **Acceptance:**
  - `appendClassifications(filePath: string, records: IdeaClassification[]): void` exported from persistence module
  - Deduplication: records with identical `idea_id + classified_at` are skipped (idempotent)
  - Atomic write: follows `atomicWrite()` pattern — write temp, rename
  - `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` exists (empty file or `\n`)
  - Trial contract Section 6 table has new row: `| Classification records | docs/business-os/startup-loop/ideas/trial/classifications.jsonl | newline-delimited JSON |`
  - `pnpm typecheck` passes
- **Validation contract:**
  - TC-01: `appendClassifications(path, [record1, record2])` → file contains 2 JSONL lines
  - TC-02: `appendClassifications(path, [record1])` called twice with same record → file contains 1 JSONL line (deduplication)
  - TC-03: `appendClassifications(path, [])` → file unchanged (no-op)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add `appendClassifications` to persistence module with empty body → typecheck fails
  - Green: Implement following `appendTelemetry` pattern; add trial contract table row; create empty JSONL file; all TC pass
  - Refactor: Confirm dedup key choice is documented in JSDoc
- **Planning validation (S effort):** None required.
- **Scouts:** Read lines 241–268 of `lp-do-ideas-persistence.ts` (`appendTelemetry` implementation) as the implementation template.
- **Edge Cases & Hardening:**
  - Malformed lines in existing `classifications.jsonl`: silently skip (same as telemetry pattern)
  - First run (file does not exist): create file and parent dirs via `mkdirSync({ recursive: true })`
- **What would make this >=90%:**
  - Add `appendClassifications` test cases to `__tests__/lp-do-ideas-persistence.test.ts` (new TCs in existing test file)
- **Rollout / rollback:**
  - Rollout: New export in persistence module; new empty file; contract doc update. No breaking changes.
  - Rollback: Remove `appendClassifications` export; delete `classifications.jsonl`; revert contract doc row.
- **Documentation impact:** Trial contract Section 6 is the canonical artifact path registry — adding the row here is the persistence contract.
- **Notes / references:**
  - `appendTelemetry` at lp-do-ideas-persistence.ts lines 247–268 is the implementation template

---

### TASK-06: Update lp-do-ideas SKILL.md with evidence field guidance

- **Type:** IMPLEMENT
- **Deliverable:** Updated `.claude/skills/lp-do-ideas/SKILL.md` — new section guiding the AI to populate evidence fields from operator context at intake
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Build evidence:**
  - `## Evidence Fields for Classification` section added to `.claude/skills/lp-do-ideas/SKILL.md`
  - All 12 evidence field names from Section 4.4 present: incident_id, deadline_date, repro_ref, leakage_estimate_value, leakage_estimate_unit, first_observed_at, risk_vector, risk_ref, failure_metric, baseline_value, funnel_step, metric_name
  - Plain-language table with "when to ask" guidance per field (no system-internal nouns)
  - Concrete examples included (e.g., "If the operator says 'we have a live payment failure', ask for the incident reference")
  - Guidance is advisory (evidence absence does not block intake)
  - Commit: 4b6a1f3964
- **Affects:**
  - `.claude/skills/lp-do-ideas/SKILL.md` (modified)
- **Depends on:** TASK-02
- **Blocks:** —
- **Confidence:** 85%
  - Implementation: 85% — The SKILL.md already has a well-structured intake flow (Steps 1–4). Adding evidence field guidance is a bounded additive edit. The evidence fields and their admission rules are fully specified in the canonical policy.
  - Approach: 85% — The guidance must align with the advisory phase constraint: evidence fields are optional; their absence triggers auto-demotion but does not block intake or dispatch. The tone should encourage capture, not enforce it.
  - Impact: 85% — Without this update, the AI will not surface or capture evidence fields at intake. Every classification will auto-demote to P4/P5. This makes the advisory phase output uniformly low-signal and useless for calibration.
- **Acceptance:**
  - New section in SKILL.md: "## Evidence Fields for Classification"
  - Lists all evidence fields from Section 4.4 of the policy with a plain-language description of when to ask for each
  - Guidance: at `operator_idea` intake, if the description implies urgency, a known incident, a deadline, or a funnel metric, the AI should ask for or infer the relevant evidence fields (e.g. if the operator says "we have an active outage", capture `incident_id` and infer `urgency: U0`)
  - Guidance: evidence fields are advisory — if the operator does not provide them, proceed without them; the classifier will apply auto-demotion
  - The intake flow Steps 3–4 reference the new section
- **Validation contract:**
  - TC-01: SKILL.md section "## Evidence Fields for Classification" present
  - TC-02: All 12 evidence field names from Section 4.4 appear in the new section (incident_id, deadline_date, repro_ref, leakage_estimate_value, leakage_estimate_unit, first_observed_at, risk_vector, risk_ref, failure_metric, baseline_value, funnel_step, metric_name)
  - TC-03: The guidance does not block intake when evidence fields are absent
- **Execution plan:** Red -> Green -> Refactor
  - Red: None (doc edit; no failing state)
  - Green: Add section; cross-reference from Steps 3–4; verify all field names present
  - Refactor: Ensure plain language (no system-internal nouns); test: "Could someone understand this without knowing the system internals?"
- **Planning validation (S effort):** None required.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - Plain language rule (MEMORY.md): no system-internal nouns in human-readable guidance. "evidence fields" is acceptable; "Section 4.4 evidence governance fields" is not.
- **What would make this >=90%:**
  - Add concrete examples: "If the operator says 'we have a live payment failure', ask for the incident ID and check if there is a deadline for resolution"
- **Rollout / rollback:**
  - Rollout: Doc edit only. Zero production risk.
  - Rollback: Revert the SKILL.md edit.
- **Documentation impact:** SKILL.md is the primary operator-facing intake guide for `/lp-do-ideas`. This edit directly affects classification quality.
- **Notes / references:**
  - Evidence fields: `docs/business-os/startup-loop/2026-02-26-reflection-prioritization-expert-brief.user.md` Section 4.4

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema `additionalProperties: false` test failures if classification fields accidentally added to dispatch packets | Low | Medium | Separate-record architecture eliminates this. TASK-01 must NOT add new fields to `TrialDispatchPacket` or `TrialDispatchPacketV2` |
| `effective_priority_rank` prerequisite inheritance silently deferred without documentation | Low | Medium | TASK-02 must add explicit `// Phase 4: prerequisite inheritance — deferred` comment at the deferral point |
| Classification record format drift between advisory and enforcement phases | Medium | Medium | `IdeaClassification` TypeScript interface is the enforcement artifact from day 1; policy document is the specification input |
| `lp-do-ideas-trial.test.ts` existing tests fail after TASK-04 adds `classifications` to `TrialOrchestratorResult` | Low | Low | TASK-04 acceptance criteria explicitly requires existing tests continue to pass; new field is additive to the result type |

## Observability

- Logging: Classifier errors logged to stderr (non-fatal); include `dispatch_id` and error message
- Metrics: `classifications.jsonl` line count = classification throughput; auto-demotion rate visible as frequency of `reason_code: "RULE_INSUFFICIENT_EVIDENCE"`
- Alerts/Dashboards: None for advisory phase — manual inspection of `classifications.jsonl` is sufficient for calibration

## Acceptance Criteria (overall)

- [ ] `scripts/src/startup-loop/lp-do-ideas-classifier.ts` present and exports `classifyIdea()`
- [ ] `scripts/src/startup-loop/__tests__/lp-do-ideas-classifier.test.ts` passes (all TC)
- [ ] `scripts/src/startup-loop/lp-do-ideas-persistence.ts` exports `appendClassifications()`
- [ ] `docs/business-os/startup-loop/ideas/trial/classifications.jsonl` exists
- [ ] `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` Section 6 has `classifications.jsonl` row
- [ ] `.claude/skills/lp-do-ideas/SKILL.md` has "## Evidence Fields for Classification" section
- [ ] `pnpm typecheck && pnpm lint` passes with no new errors
- [ ] Existing tests in `lp-do-ideas-trial.test.ts`, `lp-do-ideas-trial-queue.test.ts`, `lp-do-ideas-routing-adapter.test.ts` continue to pass

## Decision Log

- 2026-02-26: Separate-record approach chosen over packet-embedding. Rationale: `additionalProperties: false` on both dispatch schemas makes packet-embedding a non-trivial regression risk in Phase 1. The separate record is the minimal faithful advisory-phase implementation. Schema embedding deferred to Phase 4 enforcement.
- 2026-02-26: U0 leakage threshold: disabled by default in Phase 1. Injectable via `ClassifierOptions.u0_leakage_threshold`. Operator to define threshold before enabling.
- 2026-02-26: `effective_priority_rank` prerequisite inheritance deferred in Phase 1. `is_prerequisite = false` and `parent_idea_id = null` always. Phase 4 enforcement task will wire up parent lookup.

## Overall-confidence Calculation

| Task | Confidence | Effort | Weight | Weighted |
|---|---|---|---|---|
| TASK-01 | 90% | S | 1 | 90 |
| TASK-02 | 85% | M | 2 | 170 |
| TASK-03 | 85% | M | 2 | 170 |
| TASK-04 | 85% | S | 1 | 85 |
| TASK-05 | 85% | S | 1 | 85 |
| TASK-06 | 85% | S | 1 | 85 |
| **Total** | | | **8** | **685** |

**Overall-confidence: 685 / 8 = 85.6% → 85%** (rounded to nearest 5)

Fact-find baseline: Implementation 88%, Approach 85%, Impact 90%.
Task confidence does not exceed fact-find implementation confidence +10 on any task. ✓
