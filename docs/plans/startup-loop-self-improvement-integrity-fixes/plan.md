---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-self-improvement-integrity-fixes
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, startup-loop
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Self-Improvement Integrity Fixes Plan

## Summary
This plan repairs the concrete runtime integrity defects in the self-improving startup loop without redesigning the broader system. It fixes false-zero reporting, corrects live-vs-trial ideas command wiring, stabilizes self-evolving observation identity so repeat work can cluster across runs, suppresses placeholder build-output observations, and realigns the operator-facing startup-loop docs/skill to the canonical loop spec. The work stays inside startup-loop scripts/docs and uses targeted validation only.

## Active tasks
- [x] TASK-01: Fix self-evolving report and live-mode command wiring
- [x] TASK-02: Stabilize observation identity and suppress placeholder build-output signals
- [x] TASK-03: Align startup-loop skill/operator docs to loop-spec v3.14.0

## Goals
- Make `startup-loop:self-evolving-report` reflect real observation and candidate data.
- Prevent live ideas commands from pointing at trial artifact paths.
- Ensure self-evolving repeat detection can cluster semantically repeated work across runs.
- Remove placeholder `None` observations from build-output ingestion.
- Eliminate current spec version/stage-set drift in canonical operator-facing startup-loop surfaces.

## Non-goals
- Full queue-format migration from trial dispatch JSON to canonical `queue-state.v1`.
- Autonomous promotion of self-evolving candidates into delivery without existing manual gates.
- Broad redesign of candidate governance, maturity policy, or rollout semantics.

## Constraints & Assumptions
- Constraints:
  - No local Jest execution.
  - Keep compatibility with existing self-evolving JSONL data.
  - Keep changes isolated to startup-loop scripts/docs.
- Assumptions:
  - Existing BRIK self-evolving data is sufficient to validate repaired reporting.
  - Additive observation metadata is safe for current downstream consumers.

## Inherited Outcome Contract
- **Why:** Repair the self-improving startup-loop runtime defects surfaced in the audit so the loop reports true state, separates live vs trial paths, recognizes repeat work across runs, suppresses placeholder observations, and aligns human-facing docs with the canonical loop spec.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-improving startup loop reads real self-evolving data, keeps live and trial ideas paths distinct, clusters repeated work with stable fingerprints, ignores placeholder build artifacts, and has startup-loop operator docs/skill metadata aligned to loop-spec v3.14.0.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-self-improvement-integrity-fixes/fact-find.md`
- Key findings used:
  - `self-evolving-report.ts` resolves default paths relative to `scripts/`, producing false zero counts.
  - The live ideas package script points to trial queue/telemetry paths.
  - Current build-output and ideas observation builders produce overly specific hard signatures.
  - Build-output extraction currently admits placeholder `None` bullets.
  - Startup-loop spec version references are stale across the operator guide and startup-loop skill.

## Proposed Approach
- Option A: Patch each symptom directly with minimal local edits.
  - Pros: fastest path.
  - Cons: higher risk of leaving drift and routing heuristics unresolved.
- Option B: Repair the affected runtime seams and add structured observation hints where needed, while separately realigning operator-facing contracts.
  - Pros: fixes the reported defects without over-expanding scope; addresses root causes in observation identity and command wiring.
  - Cons: touches a few more files than a symptom-only patch.
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
| TASK-01 | IMPLEMENT | Fix self-evolving report root resolution and separate live-mode command paths from trial paths | 90% | M | Complete | - | TASK-02 |
| TASK-02 | IMPLEMENT | Stabilize observation fingerprints/hints and suppress placeholder build-output observations | 84% | M | Complete | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Align startup-loop skill/operator docs to loop-spec v3.14.0 and current stage set | 88% | S | Complete | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Runtime entrypoint repair first so validation reads true state |
| 2 | TASK-02 | TASK-01 | Observation identity changes depend on repaired runtime seams |
| 3 | TASK-03 | TASK-02 | Finalize human-facing contract alignment after runtime behavior is settled |

## Tasks

### TASK-01: Fix self-evolving report and live-mode command wiring
- **Type:** IMPLEMENT
- **Deliverable:** code/doc change to `scripts/package.json`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, and any directly affected live-mode CLI entrypoints/docs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `scripts/package.json`, `scripts/src/startup-loop/self-evolving/self-evolving-report.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`, `[readonly] docs/business-os/startup-loop/ideas/trial/queue-state.json`, `[readonly] docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 92% - path-resolution and script-wiring patterns already exist in nearby scripts.
  - Approach: 90% - bounded runtime repair with no queue-format migration.
  - Impact: 90% - removes false-zero diagnostics and live/trial command confusion immediately.
- **Acceptance:**
  - `startup-loop:self-evolving-report -- --business BRIK` reads the real BRIK self-evolving files when invoked from the `scripts` package.
  - Live-mode package script no longer points at trial queue/telemetry paths.
  - Live advisory hook CLI behavior is explicit about whether it persists or remains read-only.
  - No trial command behavior regresses.
- **Validation contract (TC-01):**
  - TC-01: `pnpm --filter scripts startup-loop:self-evolving-report -- --business BRIK` returns non-zero observation count when BRIK observations exist.
  - TC-02: `scripts/package.json` `startup-loop:lp-do-ideas-live-run` references `ideas/live/` paths only.
  - TC-03: `scripts/package.json` `startup-loop:lp-do-ideas-trial-run` continues to reference `ideas/trial/` paths only.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter scripts startup-loop:self-evolving-report -- --business BRIK`
    - `sed -n '1,120p' scripts/src/startup-loop/self-evolving/self-evolving-report.ts`
    - `sed -n '1,120p' scripts/package.json`
  - Validation artifacts:
    - `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`
    - `docs/business-os/startup-loop/ideas/live/queue-state.json`
  - Unexpected findings:
    - Live hook currently accepts queue/telemetry paths but does not persist by itself.
- **Consumer tracing (required):**
  - New outputs:
    - None: output shapes stay unchanged.
  - Modified behavior:
    - `startup-loop:self-evolving-report` changes how default paths are resolved; the only consumer is the package script/CLI invocation.
    - `startup-loop:lp-do-ideas-live-run` changes its default artifact targets; trial command remains unchanged.
- **Scouts:** None: bounded runtime seam.
- **Edge Cases & Hardening:** Keep relative-path support for explicit `--observations` and `--candidates` flags.
- **What would make this >=90%:**
  - Verified clean targeted validation after the runtime edits land.
- **Rollout / rollback:**
  - Rollout: direct on next CLI invocation.
  - Rollback: revert the small set of entrypoint/script changes.
- **Documentation impact:**
  - Update any live-hook comments that still imply misleading path behavior.
- **Notes / references:**
  - `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
  - `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts`

### TASK-02: Stabilize observation identity and suppress placeholder build-output signals
- **Type:** IMPLEMENT
- **Deliverable:** code change to self-evolving observation builders/orchestrator so repeat-work detection uses stable semantic identity and build-output placeholder bullets are ignored
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete
- **Affects:** `scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-detector.ts`, `[readonly] scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 84%
  - Implementation: 84% - localized but touches observation identity and candidate generation together.
  - Approach: 86% - explicit stable hints/fingerprints are cleaner than ad hoc string trimming.
  - Impact: 84% - directly addresses the self-improving loop’s current inability to recognize recurrence and avoid junk signals.
- **Acceptance:**
  - Build-output bridge suppresses placeholder bullets such as `None`, `None.`, and `* — None.`.
  - Ideas/build-output observations carry stable semantic identity that can recur across different plans/runs when the underlying issue recurs.
  - Candidate generation no longer depends solely on plan-specific context strings.
  - Existing observation log compatibility is preserved.
- **Validation contract (TC-02):**
  - TC-01: Re-running self-evolving ingestion on repeated semantically equivalent signals yields at least one repeat candidate once recurrence threshold is met.
  - TC-02: Placeholder `None` bullets produce zero build-output observations.
  - TC-03: Existing JSONL observations remain readable by the report/orchestrator after additive contract updates.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,220p' scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
    - `sed -n '1,220p' scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
    - `sed -n '1,160p' scripts/src/startup-loop/self-evolving/self-evolving-detector.ts`
    - `sed -n '80,140p' docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl`
  - Validation artifacts:
    - Existing BRIK observation log
    - `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts`
  - Unexpected findings:
    - Current observation log already contains placeholder `None` idea entries from one bridge run.
- **Consumer tracing (required):**
  - New outputs:
    - Optional additive observation hints/identity fields used by candidate typing and executor-path inference.
  - Modified behavior:
    - `dispatchToMetaObservation()` and build-output `buildObservation()` change the hard-signature basis.
    - `runSelfEvolvingOrchestrator()` consumes the normalized identity and any new hints before scoring/routing.
- **Scouts:** None: evidence already shows exact over-specific fields causing starvation.
- **Edge Cases & Hardening:** Preserve uniqueness of `observation_id`; only stabilize repeat identity, not event identity.
- **What would make this >=90%:**
  - Targeted validation showing repeat candidates generated from controlled repeated signals without noisy placeholder events.
- **Rollout / rollback:**
  - Rollout: additive runtime contract plus observation-builder changes.
  - Rollback: revert observation-builder/orchestrator files together.
- **Documentation impact:**
  - Document any additive observation hint fields inline in code comments if needed.
- **Notes / references:**
  - `docs/business-os/startup-loop/self-evolving/README.md`
  - `docs/plans/startup-loop-self-evolving-launch-accelerator/plan.md`

### TASK-03: Align startup-loop skill/operator docs to loop-spec v3.14.0
- **Type:** IMPLEMENT
- **Deliverable:** doc changes updating duplicated loop-spec version/stage references to match `docs/business-os/startup-loop/specifications/loop-spec.yaml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete
- **Affects:** `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/startup-loop-workflow.user.md`, `[readonly] docs/business-os/startup-loop/specifications/loop-spec.yaml`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 88%
  - Implementation: 92% - small bounded doc/skill edits.
  - Approach: 88% - direct alignment to canonical spec is straightforward.
  - Impact: 88% - removes current operator/runtime drift in visible startup-loop contract surfaces.
- **Acceptance:**
  - Skill output contract version matches current `loop-spec.yaml`.
  - Operator guide version label matches current `loop-spec.yaml`.
  - Stage ID listings include ASSESSMENT-13..15 where the canonical spec does.
- **Validation contract (TC-03):**
  - TC-01: `rg -n "loop-spec v3\\.14\\.0|loop_spec_version: 3\\.14\\.0" docs/business-os/startup-loop-workflow.user.md .claude/skills/startup-loop/SKILL.md`
  - TC-02: `rg -n "ASSESSMENT-13|ASSESSMENT-14|ASSESSMENT-15" docs/business-os/startup-loop-workflow.user.md .claude/skills/startup-loop/SKILL.md`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation:** None: bounded doc alignment task.
- **Scouts:** None: direct spec alignment.
- **Edge Cases & Hardening:** Keep `ASSESSMENT-12` described as skill-only/non-loop-spec if referenced.
- **What would make this >=90%:**
  - Add a future lint/check script; outside this bounded repair set.
- **Rollout / rollback:**
  - Rollout: immediate on next operator/agent read.
  - Rollback: revert the two doc surfaces.
- **Documentation impact:**
  - These files are the documentation impact.
- **Notes / references:**
  - `docs/business-os/startup-loop/specifications/loop-spec.yaml`

## Risks & Mitigations
- Repeat-identity normalization may over-cluster unrelated work.
  - Mitigation: preserve event uniqueness and keep recurrence threshold/cooldown intact.
- Live/trial script repair may expose that live queue persistence is still advisory-only.
  - Mitigation: clarify behavior in CLI/docs and do not widen scope into queue-format migration.

## Observability
- Logging:
  - Use CLI report output and existing BRIK observation files as the primary verification artifact.
- Metrics:
  - Observation count and candidate count from `startup-loop:self-evolving-report`.
  - Placeholder suppression verified by absence of new `None` observations in generated output.
- Alerts/Dashboards:
  - None new in this tranche; existing report output is the bounded diagnostic surface.

## Acceptance Criteria (overall)
- [x] `startup-loop:self-evolving-report` reflects real BRIK observation data from the existing repo files.
- [x] Live and trial `lp-do-ideas` commands target distinct artifact paths.
- [x] Self-evolving observation identity is stable enough to detect recurrence across runs.
- [x] Placeholder build-output bullets no longer enter the self-evolving observation log.
- [x] Startup-loop skill/operator docs are aligned to loop-spec v3.14.0 and include the current stage set.

## Decision Log
- 2026-03-05: Chose bounded integrity repair over broader self-evolving architecture redesign.

## Build Evidence
- `pnpm exec eslint scripts/src/startup-loop/self-evolving/self-evolving-boundary.ts scripts/src/startup-loop/self-evolving/self-evolving-contracts.ts scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts scripts/src/startup-loop/self-evolving/self-evolving-report.ts scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` passed.
- `pnpm --filter scripts startup-loop:self-evolving-report -- --business BRIK` now resolves repo-root paths and returns the real BRIK dashboard totals (`observations: 5`, `startup_state_present: true`) instead of a false-zero report.
- A temp-root `self-evolving-from-ideas` smoke run over a mixed-business `dispatches[]` queue produced `observations_generated: 2`, `repeat_candidates_detected: 1`, and `candidates_generated: 1` for BRIK while ignoring an XA packet, confirming both business filtering and stable recurrence identity.
- `pnpm --filter scripts startup-loop:lp-do-ideas-live-run -- --business BRIK` now resolves the live registry/targets from repo root and emits the explicit read-only contract (`persistence_mode: "read_only"`, live queue/telemetry targets).
- `pnpm exec tsc -p scripts/tsconfig.eslint.json --noEmit` and a narrower file-scoped `pnpm exec tsc --noEmit ...` remain blocked by unrelated pre-existing baseline errors in `packages/platform-core`, `packages/types`, and older `scripts` tests/imports. Local runtime smokes and ESLint were used as the bounded validation signal for this tranche.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
- Pre-build weighted calculation: `(90*2 + 84*2 + 88*1) / 5 = 87.2%`, rounded to `87%`
- Post-build evidence uplift: clean lint plus runtime smoke validation raises delivered confidence to `90%`.
