---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04T11:00:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: build-failure-standing-data-bridge
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Build-Failure Standing Data Bridge Plan

## Summary

Create a failure-path bridge script (`self-evolving-from-build-failure.ts`) that reads failure signals from plan artifacts and emits `MetaObservation` entries into the self-evolving observation system. This parallels the existing success bridge (`self-evolving-from-build-output.ts`) but operates at build failure exit points. Four failure types are captured: infeasible declarations, replan exhaustion, confidence regressions, and gate blocks. Each produces differentiated severity and `error_or_reason_code` values so the repeat-work detector can group and surface recurring failure patterns.

## Active tasks

- [x] TASK-01: Create self-evolving-from-build-failure.ts bridge script
- [x] TASK-02: Register bridge and add SKILL.md invocation
- [x] TASK-03: Create unit and integration tests

## Goals

- Emit `MetaObservation` entries for build failures into `observations.jsonl` and `events.jsonl`
- Differentiate failure types via severity (0.5–0.9) and `error_or_reason_code`
- Enable repeat-work detector to surface recurring failure patterns as `ImprovementCandidate` entries
- Maintain fail-open / advisory semantics — bridge errors never block build flows

## Non-goals

- Modifying the `ObservationType` enum or `MetaObservation` schema
- Auto-remediating failures
- Modifying the build-event emitter (`build-event.v1`)

## Constraints & Assumptions

- Constraints:
  - Must use existing `MetaObservation` schema without new required fields
  - Must be fail-open (advisory) — identical to success bridge error handling
  - Bridge writes to `observations.jsonl` (not standing artifacts) — no dispatch-trigger risk
- Assumptions:
  - Existing `ObservationType` values (`validation_failure`, `execution_event`) are sufficient
  - Plan artifacts contain parseable failure signals at build failure exit points

## Inherited Outcome Contract

- **Why:** Build failures don't propagate to Layer A standing data, risking re-attempts of previously failed approaches.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a build-failure bridge script that reads failure signals from plans (Infeasible status, repeated replan cycles, gate failures) and writes observations to standing data, preventing re-attempts of failed approaches.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/build-failure-standing-data-bridge/fact-find.md`
- Key findings used:
  - Success bridge pattern at `self-evolving-from-build-output.ts` (287 lines) — model for structure
  - `MetaObservation` with 9 `ObservationType` values — reuse `validation_failure` and `execution_event`
  - `buildHardSignature()` with `error_or_reason_code` as signature discriminator
  - 9 archived replan-notes files confirm `Replan-round: N` frontmatter structure
  - 0 Infeasible declarations in archive — policy exists but never triggered
  - `observation_id` must be per-occurrence unique (timestamp-based) for repeat-work detection; `hard_signature` handles grouping
  - `SELF_TRIGGER_PROCESSES` registration is defense-in-depth only — primary protection is that `observations.jsonl` is not in the standing registry

## Proposed Approach

- Option A: New standalone `self-evolving-from-build-failure.ts` following the bridge pattern
- Option B: Add failure mode to existing `self-evolving-from-build-output.ts`
- Chosen approach: **Option A** — separate script. Success and failure bridges have fundamentally different data sources (completion artifacts vs mid-build plan state). Merging would complicate the success bridge's zero-side-effect guarantee.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create self-evolving-from-build-failure.ts | 85% | S | Complete (2026-03-04) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Register bridge + add SKILL.md invocation | 85% | S | Complete (2026-03-04) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Create unit and integration tests | 85% | S | Complete (2026-03-04) | TASK-01, TASK-02 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core bridge script |
| 2 | TASK-02 | TASK-01 | Registration edits |
| 3 | TASK-03 | TASK-01, TASK-02 | Tests verify both script (TASK-01) and registration (TASK-02) |

## Tasks

### TASK-01: Create self-evolving-from-build-failure.ts bridge script

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-detector.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — direct parallel of success bridge (287 lines); all imports, contracts, and utilities exist. The 4 failure extractors (infeasible, replan exhaustion, confidence regression, gate block) are string-parsing pure functions.
  - Approach: 85% — reuse existing `ObservationType` with differentiated `error_or_reason_code`; no schema changes. Held-back test: no single unknown would drop this below 80 — the approach is a proven pattern used by 2 existing bridges.
  - Impact: 85% — addresses a real gap; replan-notes exist in 9 archived plans that would have generated observations. Sparse infeasible data is expected but not a blocker.
- **Acceptance:**
  - Script exports `runSelfEvolvingFromBuildFailure(options: FailureBridgeOptions): FailureBridgeResult`
  - Accepts `--business`, `--plan-slug`, `--failure-type`, `--task-id` CLI flags
  - Produces valid `MetaObservation` entries that pass `validateMetaObservation()`
  - Four `error_or_reason_code` values: `infeasible_declaration`, `replan_exhaustion`, `confidence_regression`, `gate_block`
  - Four severity mappings: infeasible=0.9, replan_exhaustion=0.8, confidence_regression=0.6, gate_block=0.5
  - Feeds observations into `runSelfEvolvingOrchestrator()` and returns structured `FailureBridgeResult`
  - Fail-open: returns `{ ok: false }` when startup-state.json is absent (no throw)
  - CLI entrypoint via `if (process.argv[1]?.includes(...))` guard
- **Validation contract (TC-XX):**
  - TC-01: infeasible failure type → observation with `observation_type: "execution_event"`, `error_or_reason_code: "infeasible_declaration"`, `severity: 0.9`
  - TC-02: replan_exhaustion failure type → observation with `observation_type: "validation_failure"`, `error_or_reason_code: "replan_exhaustion"`, `severity: 0.8`
  - TC-03: confidence_regression failure type → observation with `observation_type: "validation_failure"`, `error_or_reason_code: "confidence_regression"`, `severity: 0.6`
  - TC-04: gate_block failure type → observation with `observation_type: "validation_failure"`, `error_or_reason_code: "gate_block"`, `severity: 0.5`
  - TC-05: missing startup-state.json → `{ ok: false, error: "startup-state.json not found..." }`
  - TC-06: all 4 failure types produce distinct `hard_signature` values for the same plan slug
  - TC-07: `observation_id` is per-occurrence unique (timestamp-based), not stable across repeated calls — this is intentional: if the same build is retried and fails again, both occurrences should be recorded as separate observations to feed the repeat-work detector
- **Execution plan:** Red → Green → Refactor
  - Red: write TC-01..TC-07 expectations
  - Green: implement `FailureBridgeOptions` interface, `FAILURE_TYPE_CONFIG` lookup, `extractFailureContext()`, `buildFailureObservation()`, `runSelfEvolvingFromBuildFailure()`, `parseArgs()`, CLI entrypoint
  - Refactor: extract shared types if any duplication with success bridge
- **Planning validation (required for M/L):** None: S-effort task
- **Consumer tracing:**
  - New exports: `runSelfEvolvingFromBuildFailure()`, `FailureBridgeOptions`, `FailureBridgeResult` — consumed by: CLI entrypoint (same file), TASK-03 tests, lp-do-build SKILL.md (prose invocation reference). No other consumers.
  - Consumer `runSelfEvolvingOrchestrator()` is unchanged — it accepts any `MetaObservation[]` array, no filtering by source.
- **Scouts:** None: established bridge pattern with 2 existing implementations
- **Edge Cases & Hardening:**
  - Empty plan.md or missing replan-notes → bridge returns `{ ok: true, observations_generated: 0 }` with warning
  - Unknown `failure-type` CLI arg → return error result, do not throw
  - Plan slug with special characters → `context_path` sanitization via existing `stableHash()`
- **What would make this >=90%:**
  - Working integration test with full orchestrator pipeline confirming repeat-work detection groups failure observations correctly
- **Rollout / rollback:**
  - Rollout: merge to dev; script is inert until SKILL.md invocation is added (TASK-02)
  - Rollback: delete file; no other code depends on it until TASK-02
- **Documentation impact:** None: internal script
- **Notes / references:**
  - Model: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
  - Second model: `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
- **Build evidence:**
  - Commit: `d011137340`
  - Typecheck: clean (scripts/tsconfig.json)
  - Lint: clean
  - Post-build validation: Mode 2 (Data Simulation) — entry point verified (exports `runSelfEvolvingFromBuildFailure`, `FailureBridgeOptions`, `FailureBridgeResult`, `buildFailureObservation`, `extractFailureContext`), CLI entrypoint guard present, 4 failure types with correct severity mappings, fail-open on missing startup-state
  - Build-time ideas hook: 0 dispatches (expected — new file not in standing registry)

### TASK-02: Register bridge and add SKILL.md invocation

- **Type:** IMPLEMENT
- **Deliverable:** Updates to `scripts/package.json`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `.claude/skills/lp-do-build/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/package.json`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `.claude/skills/lp-do-build/SKILL.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — three small edits following established patterns: package.json script entry, SELF_TRIGGER_PROCESSES entry, SKILL.md prose addition. All patterns verified in fact-find.
  - Approach: 85% — SKILL.md invocation is prose-based (no programmatic hook); consistent with success bridge invocation at Step 2.6. Held-back test: no single unknown would drop this below 80 — all three edit patterns have been done before (most recently in `bf33bfc138`).
  - Impact: 85% — registration activates the bridge for future builds; without it TASK-01 is inert.
- **Acceptance:**
  - `scripts/package.json` has entry: `"startup-loop:self-evolving-from-build-failure": "node --import tsx src/startup-loop/self-evolving/self-evolving-from-build-failure.ts"`
  - `SELF_TRIGGER_PROCESSES` set in `lp-do-ideas-trial.ts` includes `"self-evolving-from-build-failure"`
  - `lp-do-build/SKILL.md` documents failure bridge invocation at three exit points: confidence regression, infeasible declaration, gate block
  - Invocation is documented as advisory/fail-open (matching Step 2.6 success bridge pattern)
  - SKILL.md prose documents single-invocation semantics: bridge is called once per failure event, not on retries of the same build cycle. If a build is retried and fails again, that is a new failure event warranting a new observation.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm --filter scripts startup-loop:self-evolving-from-build-failure -- --help` runs without error (script entry resolves)
  - TC-02: `SELF_TRIGGER_PROCESSES` set contains `"self-evolving-from-build-failure"` (grep verification)
  - TC-03: SKILL.md contains failure bridge invocation text at each of the three failure exit points
- **Execution plan:**
  1. Add `scripts/package.json` entry
  2. Add `SELF_TRIGGER_PROCESSES` entry in `lp-do-ideas-trial.ts`
  3. Add failure bridge invocation prose to `lp-do-build/SKILL.md` at: (a) confidence regression section, (b) Infeasible declaration section, (c) gate failure stop section
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: direct edit following established patterns
- **Edge Cases & Hardening:** None: registration-only changes
- **What would make this >=90%:**
  - End-to-end test of a simulated build failure triggering the bridge via the SKILL.md-documented invocation path
- **Rollout / rollback:**
  - Rollout: merge to dev; bridge becomes active for future builds
  - Rollback: revert SKILL.md lines; script and registration remain but are inert
- **Documentation impact:** SKILL.md is self-documenting
- **Notes / references:**
  - Pattern: `bf33bfc138` added pattern-promote scripts to same three files
- **Build evidence:**
  - Commit: `13a8f30f39`
  - TC-01: package.json entry resolves (1 match)
  - TC-02: SELF_TRIGGER_PROCESSES contains `self-evolving-from-build-failure` (1 match)
  - TC-03: SKILL.md contains failure bridge invocation at 3 exit points (3 matches)
  - Build-time ideas hook: 0 dispatches

### TASK-03: Create unit and integration tests

- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/__tests__/self-evolving-from-build-failure.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-04)
- **Affects:** `scripts/src/startup-loop/__tests__/self-evolving-from-build-failure.test.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `[readonly] scripts/src/startup-loop/self-evolving/self-evolving-detector.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — pure-function unit tests + tmpdir integration tests. Pattern from `pattern-promote.test.ts` (396 lines) and `self-evolving-orchestrator-integration.test.ts`.
  - Approach: 85% — 4 failure types × observation validation + hard signature uniqueness + edge cases. Held-back test: no single unknown would drop this below 80 — test patterns are established and all test infrastructure exists.
  - Impact: 85% — ensures bridge correctness for all 4 failure types and prevents regressions.
- **Acceptance:**
  - Test file covers all 7 TC contracts from TASK-01
  - Tests pass via governed Jest runner in CI
  - Uses `beforeEach`/`afterEach` tmpdir cleanup for integration tests
  - Verifies `validateMetaObservation()` returns empty array for all 4 failure observation variants
  - Verifies 4 distinct `hard_signature` values for same plan slug
  - Verifies `observation_id` uniqueness across repeated calls
- **Validation contract (TC-XX):**
  - TC-01: Each of 4 failure types produces valid `MetaObservation` (passes `validateMetaObservation()`)
  - TC-02: Hard signatures are distinct across failure types for same plan
  - TC-03: Missing startup-state returns `{ ok: false }`
  - TC-04: Empty/missing plan artifacts return `{ ok: true, observations_generated: 0 }` with warnings
  - TC-05: observation_id differs between calls with same inputs (timestamp-based)
  - TC-06: Anti-loop integration — `SELF_TRIGGER_PROCESSES` contains `"self-evolving-from-build-failure"` (reads live source file)
- **Execution plan:**
  1. Create test file with describe blocks: observation construction, bridge function, edge cases, anti-loop integration
  2. Write fixtures for 4 failure types
  3. Implement unit tests for pure functions
  4. Implement integration test with tmpdir + orchestrator
  5. Verify ESLint clean
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: test patterns established
- **Edge Cases & Hardening:** None: test file only
- **What would make this >=90%:**
  - CI green with all tests passing
- **Rollout / rollback:**
  - Rollout: merge to dev; tests run in CI
  - Rollback: delete test file
- **Documentation impact:** None
- **Notes / references:**
  - Pattern: `scripts/src/startup-loop/__tests__/pattern-promote.test.ts` (396 lines)
  - Pattern: `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
- **Build evidence:**
  - Commit: `1d3708d0d4`
  - Typecheck: clean
  - Lint: clean (after auto-fix import sort)
  - 12 test cases covering: 4 failure type observations (TC-01..04), missing startup-state (TC-05), hard signature uniqueness (TC-06), observation_id uniqueness (TC-07), edge cases, anti-loop integration
  - Tests run in CI per testing policy
  - Build-time ideas hook: 0 dispatches

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create bridge script | Yes — all readonly dependencies exist, imports verified, contracts stable | None | No |
| TASK-02: Register bridge | Yes — TASK-01 produces the script file; package.json, trial.ts, SKILL.md all exist and patterns verified | None | No |
| TASK-03: Create tests | Yes — TASK-01 produces the script; TASK-02 adds SELF_TRIGGER_PROCESSES entry needed for TC-06; test infrastructure, governed runner, tmpdir patterns all exist | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sparse failure data initially | High | Low | Bridge captures all 4 failure types including replan cycles (9 in archive); even sparse data prevents re-attempts |
| Orchestrator recurrence_threshold too low for failure signals | Low | Low | Default threshold is 2; failures are inherently rare so threshold is appropriate. Adjustable via config if needed |
| SKILL.md prose invocation not followed by agents | Medium | Low | Same risk exists for success bridge (Step 2.6) and has worked reliably; failure bridge follows identical pattern |
| Bridge re-run on same failure produces duplicate observation | Low | Low | Each observation gets unique timestamp-based ID. Duplicates from re-runs are acceptable: if a build is retried and fails identically, both observations are legitimate signals. SKILL.md documents single-invocation-per-failure-event semantics. The repeat-work detector requires ≥2 observations per hard_signature — duplicate observations from genuine re-failures are the intended input. |

## Observability

- Logging: bridge result JSON to stdout (same as success bridge)
- Metrics: observations visible in `observations.jsonl` and `events.jsonl` per business; events with `severity >= 0.8` get `status: "error"` for filtering
- Alerts/Dashboards: self-evolving dashboard (`self-evolving-report.ts`) will display failure observations alongside success observations

## Acceptance Criteria (overall)

- [ ] Bridge script produces valid `MetaObservation` entries for all 4 failure types
- [ ] All observations pass `validateMetaObservation()`
- [ ] 4 distinct `hard_signature` values for same plan slug with different failure types
- [ ] Severity differentiation: infeasible=0.9, replan_exhaustion=0.8, confidence_regression=0.6, gate_block=0.5
- [ ] Fail-open: missing startup-state returns `{ ok: false }`, no throw
- [ ] Registered in SELF_TRIGGER_PROCESSES, package.json, SKILL.md
- [ ] Tests pass in CI
- [ ] Typecheck clean

## Decision Log

- 2026-03-04: Chose separate script (Option A) over adding mode to success bridge (Option B) — different data sources, preserve success bridge safety
- 2026-03-04: Chose to reuse existing ObservationType values with differentiated error_or_reason_code — no schema changes needed
- 2026-03-04: Chose per-occurrence unique observation_id (timestamp-based) — repeat-work detector needs multiple observations per hard_signature

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- Overall: (85 + 85 + 85) / 3 = **85%**
