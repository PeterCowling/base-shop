---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09T13:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: writer-lock-operational-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 75%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Writer Lock Operational Hardening Plan

## Summary
This plan is the implementation follow-on to `writer-lock-scope-reduction`. The earlier cycle correctly documented the minimum-lock-time rule, but runtime behavior still left implicit long-held lock paths available through wrapper entrypoints and active skill protocols. The first runnable slice hardens the wrappers, active runbooks, and active skills so locked interactive shells and locked long-lived agent CLI sessions require explicit opt-in, then leaves the deeper offload and queue-latency work as explicit follow-on investigations.

## Active tasks
- [x] TASK-01: Harden wrapper entrypoints, active runbooks, and active skills around explicit write-session opt-ins
- [x] TASK-02: Design a minimum-lock-time build-offload path that removes shared-checkout `workspace-write` as the default mutable session model
- [x] TASK-03: Design a real narrow-window write workflow for queue wake-up and serialized write windows

## Goals
- Make implicit locked interactive shells a forbidden default path.
- Make implicit locked `codex` and `claude` sessions a forbidden default path, including common launcher wrappers.
- Keep active runbooks and active skills aligned with the explicit opt-in contract.
- Preserve single-writer safety while making the remaining unsolved architectural issues explicit.

## Non-goals
- Shipping the build-offload redesign in the same task as wrapper hardening.
- Replacing the queueing primitive in `writer-lock.sh` during TASK-01.
- Weakening commit/push enforcement or introducing bypass flags.

## Constraints & Assumptions
- Constraints:
  - TASK-01 must remain bounded to wrappers, active docs, active skills, and regression coverage.
  - Local validation must respect the CI-only test policy.
  - The repo may be dirty from unrelated work; commit scope must stay narrow.
- Assumptions:
  - Explicit opt-in for rare locked sessions is the correct immediate policy.
  - `workspace-write` build offload remains a genuine architectural exception until TASK-02 replaces it.

## Inherited Outcome Contract
- **Why:** Repeated writer-lock incidents still require manual kill and clean-stale recovery because the docs-only rule change did not remove implicit long-held lock paths or the shared-checkout build-offload exception.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop enforces explicit opt-in for locked interactive shells and locked agent CLI sessions, active runbooks and skills match that contract, and the remaining architectural work is captured as follow-on build tasks.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/writer-lock-operational-hardening/fact-find.md`
- Key findings used:
  - Wrapper entrypoints still permit implicit locked interactive shells.
  - Existing long-lived agent-session guard only covered exact first-argv `codex|claude`.
  - Active build-offload and ops-ci-fix skills still used direct locked Codex sessions.
  - Queue wake-up and `workspace-write` offload remain separate unsolved problems that need investigation, not wishful wording.

## Proposed Approach
- Option A: Wrapper/docs/skill hardening now, then separate investigation tasks for offload redesign and queue wake-up.
- Option B: Fold wrapper hardening, offload redesign, and queue wake-up changes into one large implementation task.
- Chosen approach: Option A. It fixes the immediate operational holes without pretending the architectural problems are already solved, and it keeps each remaining unknown visible as its own buildable task.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Harden wrapper entrypoints, active runbooks, and active skills around explicit write-session opt-ins | 86% | M | Complete (2026-03-09) | - | TASK-02, TASK-03 |
| TASK-02 | INVESTIGATE | Design a minimum-lock-time build-offload path that removes shared-checkout `workspace-write` as the default mutable session model | 72% | L | Complete (2026-03-09) | TASK-01 | - |
| TASK-03 | INVESTIGATE | Design a real narrow-window write workflow for queue wake-up and serialized write windows | 68% | M | Complete (2026-03-09) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Bounded hardening slice with direct file targets |
| 2 | TASK-02, TASK-03 | TASK-01 | Investigations can run in parallel after the wrapper contract is stable |

## Tasks

### TASK-01: Harden wrapper entrypoints, active runbooks, and active skills around explicit write-session opt-ins
- **Type:** IMPLEMENT
- **Deliverable:** Wrapper enforcement, active doc/skill alignment, and regression coverage for explicit locked-session opt-ins
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Artifact-Destination:** Updated wrapper scripts, active docs/skills, new regression test, and follow-on planning artifacts in the working tree
- **Reviewer:** operator
- **Approval-Evidence:** Operator instruction on 2026-03-09 to terminate the stale holder and proceed with implementation follow-on work
- **Measurement-Readiness:** Manual operational review until TASK-02/TASK-03 add structural telemetry or new workflow boundaries
- **Affects:** `scripts/agents/agent-session-guard.sh`, `scripts/agents/integrator-shell.sh`, `scripts/agents/with-writer-lock.sh`, `scripts/__tests__/agent-write-session-guard.test.ts`, `AGENTS.md`, `docs/git-safety.md`, `docs/git-and-github-workflow.md`, `docs/ralph-methodology-executive-summary.md`, `docs/business-os/security.md`, `.claude/skills/_shared/build-offload-protocol.md`, `.claude/skills/ops-ci-fix/SKILL.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 86%
  - Implementation: 90% - the wrapper and active doc/skill surfaces are directly identified and bounded.
  - Approach: 86% - explicit opt-in addresses the immediate failure mode without hiding the unsolved architecture.
  - Impact: 86% - accidental long-held locks become harder to create and active guidance becomes consistent.
- **Acceptance:**
  - Locked interactive shells are no longer a normal no-arg path; explicit opt-in is required.
  - Long-lived `codex` and `claude` sessions under the writer lock require explicit opt-in, including the common `nvm exec ...` and `bash -lc 'claude ...'` wrapper forms.
  - Active runbooks and active skill docs are updated to the new explicit opt-in contract.
  - Regression coverage exists for the new agent-session guard behavior.
- **Validation contract (TC-01):**
  - TC-01: `bash -n` passes for the new shared guard script and both wrapper scripts.
  - TC-02: `pnpm --filter scripts typecheck` passes.
  - TC-03: `pnpm --filter scripts lint` passes.
  - TC-04: `git diff --check -- <task files>` passes.
- **Execution plan:** Red -> Green -> Refactor
  - Red evidence plan: confirm the wrappers still expose implicit locked shells and narrow first-argv-only detection.
  - Green evidence plan: land shared detection, explicit opt-ins, active doc/skill updates, and regression coverage.
  - Refactor evidence plan: centralize detection logic so the two wrappers do not drift.
- **Edge Cases & Hardening:** The wrappers must still allow rare locked interactive shells and rare locked agent sessions when explicitly requested; the goal is explicitness, not removing those escape hatches entirely.
- **What would make this >=90%:**
  - CI passing the new regression coverage on the next run.
- **Rollout / rollback:**
  - Rollout: commit on `dev`, then let the updated wrappers and docs become the active local contract immediately.
  - Rollback: revert the scoped commit if the explicit opt-in contract blocks a legitimate workflow unexpectedly.
- **Documentation impact:**
  - Update only active runbooks and active skill docs in this task; archived plans remain historical evidence.
- **Notes / references:**
  - Build evidence (2026-03-09):
    - Added `scripts/agents/agent-session-guard.sh` as a shared detector for direct, wrapped, and shell-string `codex|claude` invocations.
    - `integrator-shell.sh` now requires explicit `--interactive-write-shell` for locked interactive write shells and uses the shared detector before allowing locked agent sessions.
    - `with-writer-lock.sh` now requires explicit `--interactive-shell` for locked interactive shells and explicit `--agent-write-session` for locked agent sessions.
    - Updated active runbooks and active skills to use the explicit opt-in contract.
    - Added regression coverage in `scripts/__tests__/agent-write-session-guard.test.ts`.

### TASK-02: Design a minimum-lock-time build-offload path that removes shared-checkout `workspace-write` as the default mutable session model
- **Type:** INVESTIGATE
- **Deliverable:** Investigation note with a recommended replacement for the current shared-checkout mutable offload path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-09)
- **Artifact-Destination:** `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`
- **Affects:** `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`, `[readonly] .claude/skills/_shared/build-offload-protocol.md`, `[readonly] .claude/skills/lp-do-build/SKILL.md`, `[readonly] docs/plans/_archive/lp-do-build-codex-offload/plan.md`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 72%
  - Implementation: 78% - the evidence base is already identified.
  - Approach: 72% - patch-return vs scratch-clone vs other designs still need comparative analysis.
  - Impact: 78% - this is the only path to true minimum-lock-time offload.
- **Acceptance:**
  - Recommends one primary design for mutable offload that shortens lock scope materially.
  - Defines lock boundaries, artifact boundaries, and failure recovery behavior.
  - Explains why the recommended design is safer than the current shared-checkout `workspace-write` model.
- **Validation contract:** Investigation note exists at `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md` and directly answers the acceptance bullets with one recommended design.
- **Planning validation:** Read current active protocol, archived `lp-do-build-codex-offload` artifacts, and current plan/fact-find before writing the redesign note.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds `build-offload-redesign.md` as the canonical follow-on design artifact for this plan.
- **Notes / references:**
  - Build evidence (2026-03-09):
    - Created `docs/plans/writer-lock-operational-hardening/build-offload-redesign.md`.
    - Compared three paths: patch-return, scratch clone/disposable mirror, and status quo shared-checkout `workspace-write`.
    - Recommended patch-return offload as the only option that materially shortens writer-lock duration while preserving the single-checkout operating model.
    - Defined target contract phases: task packet, offloaded patch generation, serialized apply window, and failure handling.

### TASK-03: Design a real narrow-window write workflow for queue wake-up and serialized write windows
- **Type:** INVESTIGATE
- **Deliverable:** Investigation note covering queue wake-up latency, `writer-lock-window.sh`, and a recommended adoption path
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Artifact-Destination:** `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`
- **Affects:** `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`, `[readonly] scripts/git/writer-lock.sh`, `[readonly] scripts/git-hooks/writer-lock-window.sh`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 68%
  - Implementation: 74% - current queue and helper files are known.
  - Approach: 68% - wake-up strategy tradeoffs need real analysis.
  - Impact: 74% - polling latency is real, but secondary to the offload architecture.
- **Acceptance:**
  - Explains why the current 30-second poll loop creates avoidable idle time.
  - Determines whether `writer-lock-window.sh` should be adopted, replaced, or removed.
  - Recommends a concrete next implementation slice.
- **Validation contract:** Investigation note exists at `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md` and directly answers the acceptance bullets with a concrete recommendation.
- **Planning validation:** Read current queue implementation and `writer-lock-window.sh`; repo search confirmed no active caller before writing the investigation note.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Adds `queue-and-window-investigation.md` as the canonical queue/window design artifact for this plan.
- **Notes / references:**
  - Build evidence (2026-03-09):
    - Created `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`.
    - Documented that 30-second polling creates avoidable idle handoff time.
    - Determined that `writer-lock-window.sh` should be retained but not adopted for current shared-checkout `workspace-write` flows.
    - Recommended sequencing: offload redesign first, then active-window adoption and queue wake-up tightening.

## Risks & Mitigations
- TASK-01 reduces accidental long-held locks but does not solve sanctioned shared-checkout offload.
  - Mitigation: keep TASK-02 explicit and pending.
- Wrapper detection may still miss an uncommon launcher form.
  - Mitigation: centralize detection in one shared helper and extend it as new cases appear.
- Dirty unrelated worktree state could contaminate commit scope.
  - Mitigation: stage only task files and commit path-limited.

## Observability
- Logging: None added in TASK-01
- Metrics: None added in TASK-01
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] Active wrapper entrypoints require explicit opt-in for locked interactive shells and locked long-lived agent sessions.
- [x] Active runbooks and active skills use the new explicit opt-in contract.
- [x] A replacement design for shared-checkout `workspace-write` offload is documented and ready for implementation.
- [x] A recommended queue wake-up and narrow-window write design is documented and ready for implementation.

## Decision Log
- 2026-03-09: Chose a sequenced follow-on plan instead of collapsing wrapper hardening and architectural redesign into one implementation task.
- 2026-03-09: Treated shared-checkout `workspace-write` offload and queue polling as explicit unsolved follow-on work, not as bugs that could be fixed by wording alone.

## Overall-confidence Calculation
- TASK-01 weight: M=2
- TASK-02 weight: L=3
- TASK-03 weight: M=2
- Overall-confidence = (86*2 + 72*3 + 68*2) / 7 = 74.9% -> 75%

## What Would Make This >=90%
- Convert the two completed investigation artifacts into the next implementation plan.

## Section Omission Rule
- None: all sections are relevant for this follow-on plan.
