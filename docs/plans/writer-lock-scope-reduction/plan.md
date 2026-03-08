---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: writer-lock-scope-reduction
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Writer Lock Scope Reduction Plan

## Summary
This plan codifies a narrower operational rule for Base-Shop writer-lock usage without changing lock internals in the same cycle. The active work is to update the canonical repo runbooks so humans and agents are told to hold the writer lock around actual git writes and other serialized repo mutations only, use guard-only mode for long read-only work, and run build or deploy steps outside the lock after artifacts are prepared. A later enforcement idea may follow if documentation alone does not change behavior, but that is not part of this build.

## Active tasks
- [x] TASK-01: Update writer-lock scope guidance across canonical repo runbooks

## Goals
- Make the narrower writer-lock rule explicit in canonical repo docs.
- Preserve strong single-writer expectations for git writes and other serialized repo mutations.
- Add practical guidance for long-running external commands so live deploy holders are handled cleanly.

## Non-goals
- Lock lease or heartbeat redesign.
- Automatic blocking of `wrangler` or `pnpm build` under the writer lock.
- Hook or wrapper code changes in this cycle.

## Constraints & Assumptions
- Constraints:
  - Build stays within documentation artifacts and must not weaken existing git safety controls.
  - Validation must respect repo policy that local tests remain CI-governed.
- Assumptions:
  - The operator-approved rule in chat is the source of truth for this cycle.
  - The current wrappers already provide sufficient read-only vs write-mode separation; the immediate gap is documentation.

## Inherited Outcome Contract
- **Why:** A long remote deploy blocked unrelated commit work because the writer lock scope is broader than the resource it is meant to protect.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop runbooks clearly require the writer lock only for serialized repo writes, and they direct build or deploy steps to run outside the lock after artifacts are prepared.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/writer-lock-scope-reduction/fact-find.md`
- Key findings used:
  - Canonical policy lives in `AGENTS.md`, with human-facing restatements in `docs/git-and-github-workflow.md` and `docs/git-hooks.md`.
  - `with-writer-lock.sh` holds the lock until the wrapped command exits.
  - `writer-lock.sh` refuses stale cleanup for live holders and only times out waiters, not holders.

## Proposed Approach
- Option A: Documentation-only adoption now, with enforcement deferred until a follow-on idea justifies added complexity.
- Option B: Combine documentation updates with wrapper or hook enforcement changes immediately.
- Chosen approach: Option A. The operator explicitly asked to adopt an operational rule. The smallest effective change is to update the canonical runbooks first, keeping scope bounded and avoiding safety-infrastructure changes before the rule is documented and tested in use.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update canonical repo runbooks to narrow writer-lock scope and document deploy-outside-lock guidance | 84% | S | Complete (2026-03-07) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Single bounded documentation task; no parallel split needed |

## Tasks

### TASK-01: Update writer-lock scope guidance across canonical repo runbooks
- **Type:** IMPLEMENT
- **Deliverable:** Updated canonical repo runbooks clarifying writer-lock scope in `AGENTS.md`, `docs/git-and-github-workflow.md`, and `docs/git-hooks.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Artifact-Destination:** Canonical repo docs updated in the working tree; commit deferred until the shared index is clean
- **Reviewer:** operator
- **Approval-Evidence:** Chat instruction on 2026-03-07 approving the narrower lock-scope rule and deploy-outside-lock guidance
- **Measurement-Readiness:** Manual process review; future long-holder incidents should be compared against the updated guidance during process audits
- **Affects:** `AGENTS.md`, `docs/git-and-github-workflow.md`, `docs/git-hooks.md`, `[readonly] scripts/agents/integrator-shell.sh`, `[readonly] scripts/agents/with-writer-lock.sh`, `[readonly] scripts/git/writer-lock.sh`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 92% - Three doc targets are directly identified and the requested wording is specific.
  - Approach: 90% - The new rule aligns with existing wrapper behavior and existing read-only mode.
  - Impact: 84% - Documentation should change operator behavior, but real-world adoption is not fully guaranteed without later enforcement.
- **Acceptance:**
  - `AGENTS.md` explicitly states that the writer lock is for actual git writes and other serialized repo mutations, not for whole build/deploy pipelines.
  - `AGENTS.md` explicitly states that long read-only discovery/planning stays in `--read-only` mode.
  - `AGENTS.md`, `docs/git-and-github-workflow.md`, and `docs/git-hooks.md` each include deploy/build-outside-lock guidance after artifacts are prepared.
  - Incident guidance warns against force-releasing a live holder before the owning command exits cleanly.
- **Validation contract (VC-01):**
  - VC-01: Diff review confirms all three target docs carry the narrower lock-scope rule and preserve existing git-safety expectations.
  - VC-02: `rg -n "deploy outside the lock|actual git writes|serialized repo mutations|read-only"` across the updated docs returns the intended guidance in each target file.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: Identify the current wording gaps in the three target docs and capture the missing distinctions.
  - Green evidence plan: Add the minimum wording needed to close those gaps and satisfy both validation checks.
  - Refactor evidence plan: Tighten wording for consistency across the three docs without broadening scope into enforcement design.
- **Planning validation (required for M/L):**
  - None: S-effort documentation task with directly identified files.
- **Scouts:** None: operator already selected the bounded documentation-first approach.
- **Edge Cases & Hardening:** Clarify that temporary repo mutations or staged write sequences may still justify holding the lock until that serialized mutation phase is complete; the rule is not "never hold the lock for anything but `git commit`."
- **What would make this >=90%:**
  - Add a follow-on measured control, such as lock-hold telemetry or an enforcement guard, after the documentation update lands.
- **Rollout / rollback:**
  - Rollout: Commit the documentation updates on `dev` once the shared index is clean, then use the new guidance immediately for future deploys and write sessions.
  - Rollback: Revert the docs commit if the wording proves ambiguous or causes unsafe usage guidance.
- **Documentation impact:**
  - Updates three canonical repo runbooks; no new document should be introduced unless the build discovers a genuine documentation gap that cannot fit existing files.
- **Notes / references:**
  - Evidence source: `docs/plans/writer-lock-scope-reduction/fact-find.md`
  - Build evidence (2026-03-07):
    - Updated `AGENTS.md` Git Rules to define the writer lock as a narrow serialized-write critical section, direct long read-only work to `--read-only`, and warn against force-releasing live deploy holders.
    - Updated `docs/git-and-github-workflow.md` troubleshooting guidance with the same narrow-scope rule and explicit deploy-outside-lock instruction.
    - Updated `docs/git-hooks.md` writer-lock troubleshooting with the same scope rule and live-holder handling guidance.
    - VC-01 pass: scoped diff review confirmed only the intended wording changes in the three target docs.
    - VC-02 pass: targeted `rg` checks found `actual git writes`, `serialized repo mutations`, `--read-only`, `wrangler`, and live-holder guidance in the updated docs.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Update writer-lock scope guidance across canonical repo runbooks | Yes | None | No |

## Risks & Mitigations
- Documentation-only adoption may not fully prevent future long lock holds.
  - Mitigation: keep enforcement as explicit follow-on work if the incident pattern repeats.
- Wording could be interpreted too narrowly and discourage holding the lock during legitimate serialized repo mutations.
  - Mitigation: state examples for both required and non-required lock scope.

## Observability
- Logging: None in this cycle
- Metrics: None in this cycle
- Alerts/Dashboards: None in this cycle

## Acceptance Criteria (overall)
- [x] Canonical repo docs consistently define writer-lock scope as serialized repo writes or repo mutations, not whole deploy pipelines.
- [x] Canonical repo docs direct build and deploy steps to run outside the lock after artifacts are prepared.
- [x] Canonical repo docs include safe incident handling for long-running live holders.

## Decision Log
- 2026-03-07: Chose documentation-first adoption instead of immediate enforcement because the operator-approved ask is an operational rule change and the bounded first cycle is sufficient to ship that change.

## Overall-confidence Calculation
- TASK-01 weight: S=1
- Overall-confidence = 84 / 1 = 84%

## What Would Make This >=90%
- Add a follow-on instrumented or enforced control that proves the guidance changed lock-hold behavior in practice.
