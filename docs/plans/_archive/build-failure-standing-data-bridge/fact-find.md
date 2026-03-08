---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: build-failure-standing-data-bridge
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/build-failure-standing-data-bridge/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260304103000-0001
Trigger-Why: Build failures (infeasible tasks, confidence regressions, gate failures) are recorded in plans but never feed back to Layer A standing data, risking re-attempts of previously failed approaches.
Trigger-Intended-Outcome: type: operational | statement: Produce a build-failure bridge script that reads failure signals from plans and writes observations to standing data | source: operator
---

# Build-Failure Standing Data Bridge — Fact-Find Brief

## Scope

### Summary

Build failures (infeasible tasks, confidence regressions, gate failures, partial completions) are recorded in plan artifacts (`plan.md`, `replan-notes.md`, `build-record.user.md`) but never propagate to the self-evolving observation system. The existing success bridge (`self-evolving-from-build-output.ts`) only runs at plan completion (Step 2.6 of `lp-do-build`). A parallel failure bridge is needed to ingest failure signals as `MetaObservation` entries, enabling the repeat-work detector to prevent re-attempting failed approaches.

### Goals

- Create a `self-evolving-from-build-failure.ts` bridge script that reads failure signals from plan artifacts and emits `MetaObservation` entries
- Integrate invocation into `lp-do-build` at failure exit points (confidence regression, gate block, Infeasible declaration)
- Use differentiated severity and `error_or_reason_code` values to distinguish failure types
- Register the bridge in `SELF_TRIGGER_PROCESSES` as defense-in-depth (primary protection is that the bridge writes to `observations.jsonl`, not to standing artifacts that trigger dispatches)

### Non-goals

- Modifying the `ObservationType` enum — reuse existing types (`validation_failure` for gate/confidence failures, `execution_event` for infeasible declarations)
- Auto-remediating failures — the bridge only records observations; downstream action remains with the self-evolving orchestrator's repeat-work detector
- Modifying the build-event emitter — the `build-event.v1` schema is consumed by the Build Summary generator and is not the right propagation channel

### Constraints & Assumptions

- Constraints:
  - Must use the existing `MetaObservation` schema without adding new required fields
  - Must be fail-open (advisory) — bridge errors must never block build progression or failure handling
  - Must work with current `StartupState` prerequisite (benign no-op when `startup-state.json` is absent for a business)
- Assumptions:
  - The nine existing `ObservationType` values are sufficient to classify all failure signals without schema extension
  - Failure data is always available in plan artifacts at the point the build stops (plan.md task statuses, replan-notes frontmatter, build-record if partially written)

## Outcome Contract

- **Why:** Build failures don't propagate to Layer A standing data, risking re-attempts of previously failed approaches. A failed pricing model gets re-attempted because the system has no record of the failure.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Produce a build-failure bridge script that reads failure signals from plans (Infeasible status, repeated replan cycles, gate failures) and writes observations to standing data, preventing re-attempts of failed approaches.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` — success-path bridge (model for the failure bridge)
- `.claude/skills/lp-do-build/SKILL.md` — failure exit points (confidence regression → replan; three-strikes → Infeasible; gate blocks)

### Key Modules / Files

- `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts` — `MetaObservation` interface, `ObservationType` enum (9 values), `stableHash()`, `validateMetaObservation()`
- `scripts/src/startup-loop/self-evolving/self-evolving-events.ts` — `appendObservationAsEvent()` — writes to `observations.jsonl` + `events.jsonl`
- `scripts/src/startup-loop/self-evolving/self-evolving-detector.ts` — `buildHardSignature()`, `detectRepeatWorkCandidates()` — repeat detection with signature-based dedup and cooldown
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` — `runSelfEvolvingOrchestrator()` — full pipeline: ingest → detect repeats → score → generate candidates
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` — parallel bridge converting idea dispatches to observations (design pattern reference)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — `SELF_TRIGGER_PROCESSES` set (anti-loop registration point)
- `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` — `BuildEvent` schema (success-only; no failure variant)
- `scripts/src/startup-loop/diagnostics/metrics-aggregate.ts` — tracks `replan_count` as stabilization metric (threshold: 4)

### Patterns & Conventions Observed

- **Bridge pattern**: Both `self-evolving-from-build-output.ts` and `self-evolving-from-ideas.ts` follow the same pattern: parse source artifacts → build `MetaObservation[]` → call `runSelfEvolvingOrchestrator()` → return structured result. Evidence: `self-evolving-from-build-output.ts:189-277`, `self-evolving-from-ideas.ts` (parallel structure).
- **Hard signature construction**: `buildHardSignature()` takes 6 fields (fingerprint_version, source_component, step_id, normalized_path, error_or_reason_code, effect_class) and produces a SHA-256 hash. The repeat-work detector groups observations by hard signature. Evidence: `self-evolving-detector.ts:35-46`.
- **Observation-to-event mapping**: `OBSERVATION_TO_EVENT_TYPE` maps `validation_failure` → `"validation_failure"` event type, `execution_event` → `"execution_end"` event type. Evidence: `self-evolving-events.ts:28-41`.
- **Severity-driven event status**: Events with `severity >= 0.8` get `status: "error"`, others get `status: "ok"`. Evidence: `self-evolving-events.ts:210`.
- **CLI invocation pattern**: `--business <BIZ> --plan-slug <slug>` flags with defaults; `process.argv.slice(2)` parsing. Evidence: `self-evolving-from-build-output.ts:38-71`.
- **Anti-loop registration**: Scripts that produce artifacts which could trigger dispatch loops register in `SELF_TRIGGER_PROCESSES` as defense-in-depth. For this bridge, the primary protection is that `observations.jsonl` is not in the standing registry and cannot generate `ArtifactDeltaEvent` events. `SELF_TRIGGER_PROCESSES` suppression only applies to `ArtifactDeltaEvent.updated_by_process` (`lp-do-ideas-trial.ts:840-843`). Evidence: `lp-do-ideas-trial.ts:457-464` (6 entries).

### Data & Contracts

- Types/schemas/events:
  - `MetaObservation` (33 fields) — `self-evolving-contracts.ts:52-88`
  - `ObservationType`: `execution_event | validation_failure | operator_intervention | routing_override | metric_regression | metric_plateau | funnel_dropoff_detected | experiment_result_observed | customer_feedback_theme_recurring`
  - `HardSignatureInput`: 6 fields — `self-evolving-detector.ts:5-12`
  - `SelfEvolvingEvent` — `self-evolving-events.ts:43-59`
  - `BridgeResult` — `self-evolving-from-build-output.ts:23-36`
- Persistence:
  - `observations.jsonl` — append-only JSONL at `docs/business-os/startup-loop/self-evolving/{business}/observations.jsonl`
  - `events.jsonl` — append-only JSONL at `docs/business-os/startup-loop/self-evolving/{business}/events.jsonl`
  - `startup-state.json` — prerequisite for orchestrator at `docs/business-os/startup-loop/self-evolving/{business}/startup-state.json`
- API/contracts:
  - `appendObservationAsEvent(rootDir, businessId, observation)` — validates, deduplicates by `observation_id`, writes both observations and events logs
  - `runSelfEvolvingOrchestrator({ rootDir, business, run_id, session_id, startup_state, observations, now })` — full pipeline

### Dependency & Impact Map

- Upstream dependencies:
  - Plan artifacts (`plan.md`, `replan-notes.md`, `build-record.user.md`) — source of failure signals
  - `startup-state.json` — prerequisite for orchestrator (no-op when absent)
  - `lp-do-build` SKILL — invocation points for the bridge
- Downstream dependents:
  - `self-evolving-orchestrator.ts` — consumes observations for repeat detection
  - `self-evolving-report.ts` — dashboard visualization of observation patterns
  - `self-evolving-write-back.ts` — eventual standing data updates from candidates
  - Repeat-work detector — will surface recurring failure patterns as `ImprovementCandidate` entries
- Likely blast radius:
  - New file: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-failure.ts` (~150-250 lines)
  - Modified: `lp-do-build/SKILL.md` (add failure bridge invocation at exit points)
  - Modified: `scripts/package.json` (add script entry)
  - Modified: `lp-do-ideas-trial.ts` (add to `SELF_TRIGGER_PROCESSES`)
  - Test: new test file for the bridge

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (governed runner)
- Commands: CI-only via governed runner: `pnpm -w run test:governed -- jest -- --config ./jest.config.cjs --testPathPattern=<pattern>`
- CI integration: governed test runner via `tests/run-governed-test.sh` — tests run in CI only per `docs/testing-policy.md`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| MetaObservation validation | Unit | `self-evolving-contracts.test.ts` | Field validation, range checks |
| Repeat-work detection + scoring | Unit | `self-evolving-detector-scoring.test.ts` | Signature grouping, density, cooldown |
| Container lifecycle | Unit | `self-evolving-lifecycle-container.test.ts` | State transitions |
| Orchestrator integration | Integration | `self-evolving-orchestrator-integration.test.ts` | End-to-end observation → candidate pipeline |
| Release replay | Integration | `self-evolving-release-replay.test.ts` | Replay mechanics |
| Write-back | Integration | `self-evolving-write-back.test.ts` | Tier classification, eligibility gates, SHA checks |

#### Coverage Gaps

- No tests for the success bridge (`self-evolving-from-build-output.ts`) — no `self-evolving-from-build-output.test.ts` exists
- No tests for the ideas bridge (`self-evolving-from-ideas.ts`)
- Failure bridge is entirely new — needs dedicated tests

#### Testability Assessment

- Easy to test:
  - Failure signal extraction from plan markdown (regex/string parsing, pure functions)
  - Observation construction (deterministic, no IO)
  - Severity mapping (lookup table)
  - Hard signature differentiation (deterministic hash, verifiable)
- Hard to test:
  - Full orchestrator integration (requires startup-state.json fixture + JSONL files) — but pattern already established in `self-evolving-orchestrator-integration.test.ts`
- Test seams needed:
  - None new — existing `runSelfEvolvingOrchestrator` accepts injected observations

#### Recommended Test Approach

- Unit tests for: failure signal extraction (parse replan-notes frontmatter, detect Infeasible tasks in plan.md, extract gate failure evidence), observation construction (severity mapping, error_or_reason_code differentiation, hard signature uniqueness), CLI argument parsing
- Integration tests for: end-to-end bridge run with fixture plan artifacts, orchestrator integration with failure observations
- Contract tests for: MetaObservation validation passes for all failure observation variants

### Recent Git History (Targeted)

- `scripts/src/startup-loop/self-evolving/*` — self-evolving system stable; most recent changes were the `self-evolving-from-build-output.ts` bridge and pattern-promote scripts (this session)
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — `SELF_TRIGGER_PROCESSES` expanded from 4 to 6 entries in `bf33bfc138` (this session)
- `scripts/package.json` — two script entries added in `bf33bfc138` (this session)

## Access Declarations

None — all data sources are local repository files.

## Questions

### Resolved

- Q: Should we add new `ObservationType` values (e.g. `build_failure`) to the contracts?
  - A: No. The existing `validation_failure` type maps correctly for gate/confidence failures, and `execution_event` works for infeasible declarations. Adding new types would require updating the `OBSERVATION_TO_EVENT_TYPE` mapping and potentially downstream consumers. Differentiation is better achieved through `error_or_reason_code` values.
  - Evidence: `self-evolving-events.ts:28-41` — existing mapping; `self-evolving-contracts.ts:22-31` — enum definition

- Q: Where exactly should the failure bridge be invoked in lp-do-build?
  - A: At three exit points: (1) when `lp-do-build` stops due to confidence regression below threshold and routes to replan, (2) when a task is declared Infeasible after three replan attempts, (3) when a gate failure stops the build cycle. All three are documented in SKILL.md and produce structured failure information.
  - Evidence: `.claude/skills/lp-do-build/SKILL.md` lines 56-59 (confidence policy), 162-164 (Infeasible policy), gate descriptions

- Q: Should this be a new mode of `self-evolving-from-build-output.ts` or a separate script?
  - A: Separate script. The success bridge has a fundamentally different data source (post-completion artifacts: build-record, results-review, pattern-reflection) vs failure signals (mid-build plan state: task statuses, replan notes, gate evidence). Merging would complicate both paths and make the success bridge less safe (it's currently fail-open and zero-side-effect on the build completion path).
  - Evidence: `self-evolving-from-build-output.ts:189-277` — tightly coupled to completion artifacts

- Q: What severity values should failure observations use?
  - A: Differentiated by failure type: Infeasible declaration = 0.9 (near-critical — approach permanently invalidated), three-strikes replan exhaustion = 0.8 (high — repeated failure), single confidence regression = 0.6 (moderate — may recover after replan), gate block = 0.5 (moderate — may be transient).
  - Evidence: Success bridge uses flat `severity: 0.35` (`self-evolving-from-build-output.ts:152`); events with `severity >= 0.8` get error status (`self-evolving-events.ts:210`). Failure observations should meaningfully differentiate.

- Q: What `error_or_reason_code` values should be used?
  - A: Four distinct codes matching the four failure types: `infeasible_declaration`, `replan_exhaustion`, `confidence_regression`, `gate_block`. These become part of the hard signature, so the repeat-work detector will group recurring failures of the same type at the same context path.
  - Evidence: `self-evolving-detector.ts:35-46` — `error_or_reason_code` is one of the 6 hard signature fields

### Open (Operator Input Required)

None — all design questions resolved from available evidence.

## Confidence Inputs

- Implementation: 90% — direct parallel of existing bridge pattern (`self-evolving-from-build-output.ts`); all contracts, utilities, and orchestrator already exist. Would raise to 95% with a working integration test.
- Approach: 85% — reusing existing `ObservationType` values with differentiated `error_or_reason_code` is clean; no schema changes needed. Small risk that the repeat-work detector's recurrence_threshold (default 2) may be too low for failure signals. Would raise to 90% with evidence from the detector's behavior with high-severity observations.
- Impact: 80% — the Infeasible policy has never been triggered in production (0 archived plans with Infeasible status), so failure observations may be sparse initially. However, the replan-notes evidence shows 9 replan rounds across archived plans — these would have generated observations. Would raise to 90% when the system has ingested real failure data.
- Delivery-Readiness: 90% — all dependencies exist, test infrastructure is in place, no external services needed.
- Testability: 90% — pure functions for signal extraction + existing orchestrator integration test pattern. Would raise to 95% with fixtures for all 4 failure types.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Sparse failure data — Infeasible policy never triggered | High | Low | Bridge also captures replan cycles and gate blocks, which do occur. Even sparse data is valuable for preventing re-attempts. |
| Duplicate observations from repeated build attempts on same plan | Medium | Low | Each occurrence gets a unique `observation_id` (timestamp-based, per success bridge convention). Grouping for repeat detection is handled by `hard_signature` — same failure type at the same context path produces the same hard signature, which the repeat-work detector groups and counts. Multiple occurrences is the desired behavior: the detector requires `recurrence_threshold` (default 2) observations per hard signature to surface a repeat-work candidate. |
| Startup-state.json absent for some businesses | High | None | Bridge is fail-open — returns `{ ok: false }` when startup-state missing, identical to success bridge behavior. |
| Self-triggering loop via standing data updates | Low | Medium | Bridge writes to `observations.jsonl` (not standing artifacts), so dispatch-trigger risk is already minimal — observations.jsonl is not in the standing registry and cannot generate `ArtifactDeltaEvent` events. `SELF_TRIGGER_PROCESSES` registration is defense-in-depth only. |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Success bridge structure (model) | Yes | None | No |
| MetaObservation contract + validation | Yes | None | No |
| Hard signature differentiation | Yes | None — 4 distinct `error_or_reason_code` values produce 4 distinct signatures | No |
| Observation persistence pipeline | Yes | None — `appendObservationAsEvent()` handles validation, dedup, and dual-log writes | No |
| Orchestrator integration | Yes | None — `runSelfEvolvingOrchestrator()` accepts observation arrays, no source filtering | No |
| Failure signal extraction from plan artifacts | Yes | None — replan-notes have `Replan-round:` frontmatter, plan.md has task status markers | No |
| lp-do-build invocation points | Partial | [Scope gap] [Minor]: SKILL.md failure exit points are documented in prose, not structured hooks. The bridge invocation will need to be described in SKILL.md prose — no programmatic hook point exists. | No — consistent with success bridge invocation pattern |
| Anti-loop registration | Yes | None — `SELF_TRIGGER_PROCESSES` pattern established | No |
| Test infrastructure | Yes | None — governed Jest runner, existing self-evolving test patterns | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The scope is bounded to one new TypeScript file (~150-250 lines) following an established bridge pattern, plus minor SKILL.md and registration changes. All upstream contracts and downstream consumers already exist. No schema changes, no new external dependencies. The 4 failure types (infeasible, replan exhaustion, confidence regression, gate block) are a complete enumeration of documented failure exit points in lp-do-build.

## Planning Constraints & Notes

- Must-follow patterns:
  - Follow `self-evolving-from-build-output.ts` bridge pattern (BridgeOptions → parse → build observations → orchestrate → BridgeResult)
  - Use `buildHardSignature()` from `self-evolving-detector.ts` for consistent signature construction
  - Register in `SELF_TRIGGER_PROCESSES` in `lp-do-ideas-trial.ts` (defense-in-depth; primary protection is that observations.jsonl is not a standing artifact)
  - Keep `observation_id` per-occurrence unique (timestamp-based, matching success bridge convention) — do NOT use stable IDs, as the repeat-work detector needs multiple observations per `hard_signature` to trigger candidate generation
  - Add `scripts/package.json` entry with `startup-loop:self-evolving-from-build-failure` key
- Rollout/rollback expectations:
  - Bridge is advisory/fail-open — can be added without risk to existing build flows
  - Rollback: remove SKILL.md invocation lines; script remains inert
- Observability expectations:
  - Bridge result JSON to stdout (same as success bridge)
  - Observations visible in `observations.jsonl` and `events.jsonl` per business

## Suggested Task Seeds (Non-binding)

1. Create `self-evolving-from-build-failure.ts` with failure signal extraction + observation construction
2. Add bridge invocation to `lp-do-build/SKILL.md` at failure exit points
3. Register in `SELF_TRIGGER_PROCESSES` + add `scripts/package.json` entry
4. Create unit + integration tests

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package: bridge script produces valid `MetaObservation` entries for all 4 failure types; observations pass `validateMetaObservation()`; repeat-work detector groups same-context failures correctly
- Post-delivery measurement plan: monitor `observations.jsonl` for failure-type observations after builds that stop early; verify repeat-work detector surfaces recurring failure patterns

## Evidence Gap Review

### Gaps Addressed

- Confirmed all 9 `ObservationType` values — `validation_failure` and `execution_event` cover all failure scenarios without schema extension
- Verified `appendObservationAsEvent()` handles the full write pipeline including validation and deduplication
- Confirmed `SELF_TRIGGER_PROCESSES` pattern for anti-loop registration
- Examined all 9 archived replan-notes files to understand real-world failure signal structure
- Verified zero Infeasible declarations in archive (policy exists but never triggered)

### Confidence Adjustments

- Implementation confidence raised from initial 85% to 90% after confirming the ideas bridge (`self-evolving-from-ideas.ts`) provides a second parallel model
- Impact confidence set at 80% due to sparse failure data — but this is a prevention mechanism, not a reactive one

### Remaining Assumptions

- Replan-notes frontmatter structure (`Replan-round: N`) is stable across all plans — verified in 9 files
- `MetaObservation` schema does not need new fields for failure context (kill rationale, blocked reason) — context is carried in `evidence_refs` and `context_path`, consistent with success bridge

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step: `/lp-do-plan build-failure-standing-data-bridge --auto`

## Section Omission Rule

Sections with no evidence omitted: External Research, Delivery & Channel Landscape, Website Upgrade Inputs, Best-Of Synthesis Matrix, Hypothesis & Validation Landscape.
