---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-improvement-workflow-closure
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, startup-loop
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Improvement Workflow Closure Plan

## Summary
This plan closes the remaining self-improving startup-loop workflow gaps after the integrity fixes. It makes the build-time ideas hook durable, stabilizes candidate identity across runs, introduces a canonical self-evolving follow-up emission path that feeds validated candidates back into the `lp-do-ideas -> lp-do-fact-find -> lp-do-plan -> lp-do-build` workflow, widens build-output reflection ingestion, and makes mature-boundary reporting explicit about measured versus inferred inputs.

## Active tasks
- [x] TASK-01: Make build-time ideas capture durable and truthful
- [x] TASK-02: Stabilize candidate identity and emit canonical follow-up workflow dispatches
- [x] TASK-03: Widen build-output ingestion and boundary provenance reporting

## Goals
- Persist build-time live hook output via the existing ideas queue/telemetry adapter.
- Prevent duplicate self-evolving candidates for the same repeat signature across runs.
- Turn validated self-evolving candidates into canonical workflow dispatches instead of leaving them in `backbone-queue.jsonl` only.
- Ensure build-output ingestion uses the full `results-review` and structured `pattern-reflection` artifacts.
- Report mature-boundary inputs with explicit provenance and conservative defaults for unknown values.

## Non-goals
- Fully autonomous downstream execution of fact-find/plan/build without operator review.
- Redesign of self-evolving scoring, budget policy, or container execution.
- Queue format migration away from current `queue-state.v1`.

## Constraints & Assumptions
- Constraints:
  - No local Jest execution.
  - Keep startup-loop changes isolated to `scripts` and directly related docs.
  - Preserve existing operator-confirmed workflow semantics.
- Assumptions:
  - `dispatch.v2` follow-up packets are the correct workflow handoff for validated self-evolving candidates.
  - Idempotent observation IDs plus explicit self-evolving follow-up markers are sufficient to prevent recursion.

## Inherited Outcome Contract
- **Why:** Close the remaining self-improving startup-loop gaps so validated ideas move through the canonical lp-do-ideas -> lp-do-fact-find -> lp-do-plan -> lp-do-build workflow instead of stalling in side ledgers, while keeping the signal layer durable and non-recursive.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-improving startup loop persists build-time ideas, emits stable self-evolving candidates, converts validated candidates into canonical workflow dispatches, ingests full build-output reflections, and reports maturity boundaries with explicit measured vs inferred provenance.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-improvement-workflow-closure/fact-find.md`
- Key findings used:
  - Build-time hook already produces `LiveDispatchPacket[]` but never persists them.
  - Self-evolving candidate IDs are run-scoped and dedupe incorrectly.
  - Backbone queue entries have no consumer and build-output does not enqueue them at all.
  - Build-output bridge truncates idea bullets and flattens pattern reflection into one signal.
  - Boundary reporting uses inferred values without exposing provenance.

## Proposed Approach
- Option A: patch each remaining symptom independently.
  - Pros: low initial code churn.
  - Cons: would duplicate queue logic and still leave workflow closure implicit.
- Option B: reuse existing ideas queue persistence and routing contracts, add a shared backbone queue/consumer layer, and make boundary/build-output handling explicit and idempotent.
  - Pros: fixes root seams and aligns the self-evolving layer with the canonical workflow.
  - Cons: touches several startup-loop modules together.
- Chosen approach:
  - **Option B**.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Persist build-time live-hook output and make the CLI contract truthful about event-file input and persistence mode | 90% | M | Complete | - | TASK-02 |
| TASK-02 | IMPLEMENT | Stabilize candidate identity, add shared backbone queue consumption, and emit canonical follow-up dispatches into the ideas workflow | 84% | L | Complete | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Widen build-output reflection ingestion and expose measured vs inferred boundary provenance in runtime reports | 86% | M | Complete | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Durable capture first so workflow packets are truthful |
| 2 | TASK-02 | TASK-01 | Shared queue/consumer layer depends on persisted workflow packet conventions |
| 3 | TASK-03 | TASK-02 | Finalize reflection recall and reporting once canonical follow-up flow exists |

## Tasks

### TASK-01: Make build-time ideas capture durable and truthful
- **Type:** IMPLEMENT
- **Deliverable:** code changes to build-time ideas hook and live-hook CLI so emitted live packets can be durably persisted and replayed deterministically
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`, `scripts/package.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 92% - persistence adapter and live hook integration tests already exist.
  - Approach: 90% - bounded integration change with no new persistence format.
  - Impact: 90% - closes a real durability gap on the `lp-do-build` side immediately.
- **Acceptance:**
  - Build commit hook persists emitted live dispatches to the configured live queue/telemetry targets.
  - Live hook CLI accepts `--events-path` and actually reads the supplied events file in read-only mode.
  - Hook result output distinguishes orchestration success from persistence success clearly.
- **Validation contract (TC-01):**
  - TC-01: temp-root build-commit hook smoke writes live queue-state and telemetry files when changed registered artifacts exist.
  - TC-02: live-hook CLI with `--events-path` reports dispatched packets from the provided file.
  - TC-03: existing live hook pure export remains write-free.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,260p' scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`
    - `sed -n '1,320p' scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts`
    - `sed -n '360,520p' scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`
  - Validation artifacts:
    - `scripts/src/startup-loop/__tests__/lp-do-ideas-live-integration.test.ts`
  - Unexpected findings:
    - Live hook comments already claim delegated persistence, but build-commit hook never calls the adapter.
- **Consumer tracing (required):**
  - New outputs:
    - Persisted live queue entries and telemetry records.
  - Modified behavior:
    - `runBuildCommitIdeasHook()` becomes the durable wrapper around the still-pure `runLiveHook()` export.
    - CLI-only `--events-path` now affects read-only hook execution.
- **Edge Cases & Hardening:** maintain advisory exit code 0 even when persistence fails; surface failure in result body instead.
- **Build completion evidence:**
  - `lp-do-ideas-build-commit-hook.ts` now persists emitted live packets via `persistOrchestratorResult()` and reports queue/telemetry write counts.
  - `lp-do-ideas-live-hook.ts` CLI now reads `--events-path` payloads in read-only mode for deterministic replays.
  - Temp-root smoke on March 5, 2026 produced `dispatched_count: 1`, `queue_entries_written: 1`, and `telemetry_records_written: 1`.

### TASK-02: Stabilize candidate identity and emit canonical follow-up workflow dispatches
- **Type:** IMPLEMENT
- **Deliverable:** shared backbone queue/consumer layer plus stable candidate IDs and recursion-safe follow-up dispatch emission
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`, `scripts/package.json`, `docs/business-os/startup-loop/self-evolving/README.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 84%
  - Implementation: 82% - several modules change together and follow-up dispatch emission must be idempotent.
  - Approach: 86% - canonical `dispatch.v2` emission is the cleanest workflow closure but needs a recursion guard.
  - Impact: 84% - this is the actual loop-closing change.
- **Acceptance:**
  - Repeated candidates across runs keep one stable `candidate_id`.
  - `self-evolving-from-ideas` and `self-evolving-from-build-output` both enqueue validated candidates and emit canonical follow-up dispatches.
  - Follow-up dispatch emission is idempotent and does not recursively re-enter self-evolving ingestion.
  - Backbone queue entries record their follow-up dispatch outcome so repeated drains do not spam the workflow.
- **Validation contract (TC-02):**
  - TC-01: rerunning the same repeat signature across two run IDs updates one candidate rather than creating two.
  - TC-02: temp-root ideas/build-output runs produce at least one persisted follow-up dispatch in the trial queue when recurrence threshold is met.
  - TC-03: re-running the same drain produces zero additional follow-up dispatches.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,340p' scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
    - `sed -n '1,340p' scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
    - `sed -n '1,340p' scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`
    - `sed -n '1,260p' scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`
  - Validation artifacts:
    - `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`
    - `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
  - Unexpected findings:
    - Build-output bridge currently does not write backbone queue entries at all.
- **Consumer tracing (required):**
  - New outputs:
    - Shared backbone queue entries with consumption metadata.
    - Follow-up `dispatch.v2` packets persisted into trial queue-state.
  - Modified behavior:
    - Candidate identity is stable across runs.
    - `self-evolving-from-ideas` and build-output bridge now emit workflow-ready packets instead of stopping at side files.
- **Edge Cases & Hardening:** self-evolving follow-up packets must be clearly marked so later ideas ingestion ignores them.
- **Build completion evidence:**
  - Added shared `self-evolving-backbone-queue.ts` and `self-evolving-backbone-consume.ts` so validated candidates are emitted as canonical `dispatch.v2` workflow packets.
  - `candidate_id` is now stable on `business + repeat_signature`, and ideas observations now use deterministic IDs derived from dispatch identity.
  - Temp-root two-run smoke on March 5, 2026 produced one candidate, one follow-up dispatch, and zero duplicate emissions on the second run.

### TASK-03: Widen build-output ingestion and boundary provenance reporting
- **Type:** IMPLEMENT
- **Deliverable:** code/doc changes to parse full build-output reflections and expose measured/inferred/unknown mature-boundary inputs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-boundary.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `.claude/skills/lp-do-build/SKILL.md`, `docs/business-os/startup-loop/self-evolving/README.md`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 86%
  - Implementation: 86% - bounded parser/report changes using existing artifacts and `js-yaml`.
  - Approach: 86% - additive provenance reporting with conservative defaults avoids breaking existing callers.
  - Impact: 86% - improves both candidate recall and operator trust in the report.
- **Acceptance:**
  - Build-output bridge ingests all real idea bullets, not only the first three.
  - Pattern reflection frontmatter entries generate individual observation seeds when present.
  - Self-evolving report includes boundary signal provenance and does not imply measured revenue/headcount/support values when startup state lacks them.
  - Build skill/README describe the new workflow-closure behavior accurately.
- **Validation contract (TC-03):**
  - TC-01: pattern-reflection fixture with multiple frontmatter entries generates multiple observation seeds.
  - TC-02: report output for startup state without revenue data marks revenue source as `unknown` and does not claim a revenue threshold breach.
  - TC-03: `extractBulletCandidates()` returns every real non-placeholder bullet in order.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,340p' scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
    - `sed -n '1,360p' scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts`
    - `sed -n '1,240p' scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
    - `sed -n '1,240p' docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md`
  - Validation artifacts:
    - archived `pattern-reflection.user.md` examples
    - `docs/business-os/startup-loop/self-evolving/BRIK/startup-state.json`
  - Unexpected findings:
    - Historical pattern-reflection files vary between frontmatter-driven and body-only layouts, so fallback parsing is required.
- **Consumer tracing (required):**
  - New outputs:
    - Boundary signal provenance metadata in report output.
  - Modified behavior:
    - Build-output bridge produces more granular observation seeds.
    - Report and orchestrator use a conservative signal snapshot instead of silent stage-derived facts.
- **Edge Cases & Hardening:** body-only historical pattern-reflection files must still degrade gracefully.
- **Build completion evidence:**
  - Build-output bridge now parses frontmatter `entries[]`, ingests all real idea bullets, enqueues backbone work, and emits follow-up workflow packets.
  - Boundary snapshot helper now reports `signal_sources` and uses conservative unknown defaults for absent revenue/headcount/support signals.
  - Real BRIK report on March 5, 2026 shows `monthly_revenue: 0` with source `unknown`; temp-root build-output smoke produced `repeat_candidates_detected: 1`, `backbone_queued: 1`, and `followup_dispatches_emitted: 1`.
