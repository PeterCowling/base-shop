---
Type: Plan
Status: Complete
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09T15:42Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: writer-lock-active-contract-alignment
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas
Overall-confidence: 84%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Writer Lock Active Contract Alignment Plan

## Summary
This plan is the bounded follow-on to `writer-lock-operational-hardening`. Wrapper opt-in enforcement now exists, but active workflow docs still advertise a stale shared-checkout Codex offload path and the launcher detector still misses common wrapper forms. The correct immediate fix is to fail closed to inline execution in active workflow docs, widen the detector, add regression coverage, and clean the still-live stale guidance while leaving the patch-return pilot and queue redesign to their dedicated plans.

## Active tasks
- [x] TASK-01: Align the active writer-lock workflow contract, widen agent launcher detection, and update regression coverage

## Goals
- Make active workflow docs truthful about the current safe path.
- Disable the stale mutable Codex offload as a normal active default.
- Expand the launcher detector to cover additional common wrapper forms.
- Add regression coverage for the widened detector.
- Remove still-live stale guidance that points operators at the old path.

## Non-goals
- Shipping the patch-return pilot in this plan.
- Replacing queue polling or arbitrary file-write enforcement.
- Rewriting archived or historical plan artifacts beyond still-live guidance that remains operationally misleading.

## Constraints & Assumptions
- Constraints:
  - The validated patch-return protocol does not exist yet.
  - Local validation must stay inside the repo test policy.
  - Commit scope must stay limited to this task's files.
- Assumptions:
  - Inline execution is the safest current default.
  - Active docs should fail closed rather than preserve a risky "temporary" default.

## Inherited Outcome Contract
- **Why:** The wrapper hardening landed, but the active build/offload workflow still advertises a stale shared-checkout Codex path and the agent-session guard still misses common launcher forms.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Base-Shop disables the stale shared-checkout Codex offload as a normal active workflow, widens launcher detection for long-lived locked agent sessions, and aligns active docs/tests with the current lock policy.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/writer-lock-active-contract-alignment/fact-find.md`

## Proposed Approach
- Option A: leave the active mutable offload docs in place until the patch-return pilot is ready.
- Option B: fail closed now by making inline execution the active default, while keeping the patch-return work in its own plan.
- Chosen approach: Option B. It removes the currently sanctioned stale path immediately without pretending the future pilot is already ready.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Align the active writer-lock workflow contract, widen agent launcher detection, and update regression coverage | 84% | M | Complete (2026-03-09) | - | - |

## Tasks

### TASK-01: Align the active writer-lock workflow contract, widen agent launcher detection, and update regression coverage
- **Type:** IMPLEMENT
- **Deliverable:** Updated active workflow docs, widened launcher detector, regression coverage, and a corrected still-live fact-find reference
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Artifact-Destination:** Updated skill docs, shell guard, tests, and plan docs in the working tree
- **Affects:** `docs/plans/writer-lock-active-contract-alignment/fact-find.md`, `docs/plans/writer-lock-active-contract-alignment/plan.md`, `.agents/registry/skills.json`, `.claude/skills/_shared/build-offload-protocol.md`, `.claude/skills/lp-do-build/SKILL.md`, `.claude/skills/lp-do-build/modules/build-code.md`, `.claude/skills/lp-do-build/modules/build-biz.md`, `.claude/skills/lp-do-build/modules/build-spike.md`, `.claude/skills/lp-do-build/modules/build-investigate.md`, `.claude/skills/ops-ci-fix/SKILL.md`, `scripts/agents/agent-session-guard.sh`, `scripts/__tests__/agent-write-session-guard.test.ts`, `docs/plans/agent-setup-improvement-fact-find.md`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 84%
  - Implementation: 90% - all target files are directly identified and bounded.
  - Approach: 84% - fail-closed inline execution is the correct immediate active contract while the pilot remains unresolved.
  - Impact: 84% - removes the stale sanctioned lock-hog path from active use and closes the most obvious detection gaps.
- **Acceptance:**
  - Active workflow docs no longer tell operators to run `codex exec -a never --sandbox workspace-write` as a normal path.
  - Active `lp-do-build` and `ops-ci-fix` instructions default to inline execution until a validated patch-return pilot exists.
  - The agent-session guard catches additional common wrapper forms including `pnpm exec`, `npx`, and direct `node` script launchers where the script path is `codex` or `claude`.
  - Regression coverage exists for the newly supported wrapper forms.
  - Still-live stale guidance in `docs/plans/agent-setup-improvement-fact-find.md` is corrected.
- **Validation contract (TC-01):**
  - TC-01: `bash -n scripts/agents/agent-session-guard.sh scripts/agents/integrator-shell.sh scripts/agents/with-writer-lock.sh` passes.
  - TC-02: `bash scripts/validate-changes.sh` passes.
  - TC-03: `git diff --check -- <task files>` passes.
  - TC-04: direct runtime sanity checks show the new wrapper forms are blocked without explicit opt-in.
- **Execution plan:** Red -> Green -> Refactor

### TASK-01 Build Evidence
- 2026-03-09: Added `writer-lock-active-contract-alignment` fact-find/plan artifacts to anchor the follow-on slice.
- 2026-03-09: Disabled shared-checkout mutable Codex offload as the active default in `lp-do-build` and `ops-ci-fix`, while preserving the legacy protocol only as migration context until the patch-return pilot is validated.
- 2026-03-09: Widened `agent-session-guard.sh` to catch additional `pnpm exec`, `npx`, and direct `node /path/to/codex|claude` launcher forms; added matching regression coverage in `scripts/__tests__/agent-write-session-guard.test.ts`.
- 2026-03-09: Corrected still-live stale guidance in `docs/plans/agent-setup-improvement-fact-find.md` and refreshed `.agents/registry/skills.json` for the `ops-ci-fix` description change.
- 2026-03-09: Validation passed via `bash -n scripts/agents/agent-session-guard.sh scripts/agents/integrator-shell.sh scripts/agents/with-writer-lock.sh`, direct runtime sanity checks on `pnpm exec`, `npx`, and `node /tmp/codex`, `git diff --check -- <task files>`, and `bash scripts/validate-changes.sh`.

## Pending Audit Work
- Queue wake-up remains poll-based and is still tracked separately in `docs/plans/writer-lock-operational-hardening/queue-and-window-investigation.md`.
- Arbitrary working-tree mutation is still not hook-enforced before commit/push; that remains a structural follow-on rather than a bounded slice here.
