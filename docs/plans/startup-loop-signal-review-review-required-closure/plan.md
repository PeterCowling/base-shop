---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-signal-review-review-required-closure
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-signal-review, startup-loop
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Signal Review Review-Required Closure Plan

## Summary
Signal Review is correctly surfacing repeated failures, but its closure path is still a lossy copy-paste promotion stub. This plan adds a durable review-required work-item path that preserves manual decision authority while removing transcription loss. The first tranche is intentionally bounded: create a canonical review-required operator-work item on an existing workflow surface and have signal review emit or refresh it for repeated findings. It must not invent a free-floating second backlog.

## Active tasks
- [ ] TASK-01: Define and persist a canonical review-required operator-work item for repeated Signal Review findings
- [ ] TASK-02: Update Signal Review guidance and supporting workflow touchpoints to emit/refresh those work items deterministically

## Goals
- Preserve manual review authority while removing copy-paste as the closure mechanism.
- Make repeated findings durable, attributable, and status-bearing.
- Support owner, due date, and escalation-state tracking for recurring issues.

## Non-goals
- Automatic creation of downstream code changes.
- Rewriting the principle-scoring rubric.
- Full operator task-management system redesign.

## Constraints & Assumptions
- Constraints:
  - `lp-signal-review` remains audit-first and trial-safe.
  - The first tranche should fit existing startup-loop artifact conventions.
  - Local Jest remains out of scope.
- Assumptions:
  - Review-required items must reuse an existing operational surface rather than inventing a standalone store.
  - Finding fingerprints and repeat labels already provide enough identity for dedupe/refresh.

## Inherited Outcome Contract
- **Why:** Signal Review is correctly finding recurring loop failures, but the closure path is still a lossy copy-paste promotion step, so repeated findings can remain visible without becoming durable operator review work.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Repeated Signal Review findings create durable review-required workflow items with owner, due date, and escalation state, while keeping final promotion decisions manual.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-signal-review-review-required-closure/fact-find.md`
- Key findings used:
  - `lp-signal-review` explicitly forbids auto-spawning downstream work today.
  - Live Signal Review artifacts already contain repeat findings and fingerprints.
  - The real gap is durable manual closure, not a lack of autonomous execution.

## Proposed Approach
- Option A: keep markdown-only promotion stubs and tighten operator instructions.
  - Pros: minimal implementation.
  - Cons: does not solve transcription loss or durable tracking.
- Option B: add canonical review-required operator-work items on an existing queue/work-item surface keyed by finding fingerprint and update `lp-signal-review` to emit or refresh them while keeping final action manual.
  - Pros: closes the follow-through gap without violating trial governance or inventing a second backlog surface.
  - Cons: touches both process docs and a bounded persistence surface.
- Chosen approach: Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define and persist a canonical review-required operator-work item for repeated Signal Review findings | 82% | M | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Update Signal Review workflow guidance to emit/refresh review-required items and recurrence escalation metadata | 80% | M | Pending | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Stable artifact contract first |
| 2 | TASK-02 | TASK-01 | Workflow guidance depends on the artifact shape |

## Tasks

### TASK-01: Define and persist a canonical review-required operator-work item for repeated Signal Review findings
- **Type:** IMPLEMENT
- **Deliverable:** review-required operator-work item contract and helper logic keyed by finding fingerprint and recurrence state, persisted on an existing workflow surface
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `.claude/skills/lp-signal-review/SKILL.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `scripts/src/startup-loop/diagnostics/` or adjacent helper path as needed, `scripts/src/startup-loop/build/generate-process-improvements.ts`, `docs/business-os/process-improvements.user.html`, `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 82%
  - Implementation: 82% - bounded contract/persistence work, but there is no existing dedicated surface yet.
  - Approach: 83% - a durable operator-work item is the right first step, but only if it reuses an existing surface.
  - Impact: 82% - removes the main closure-loss mode.
- **Acceptance:**
  - A canonical review-required item shape exists with fingerprint, owner, due date, and escalation state.
  - The item lives on an existing queue/work-item surface rather than a new standalone store.
  - The contract is documented well enough for `lp-signal-review` to emit/refresh items deterministically.
- **Validation contract (TC-01):**
  - TC-01: contract documentation and any helper logic agree on required fields.
  - TC-02: duplicate findings refresh the same review-required item identity on the chosen canonical surface.
  - TC-03: targeted lint/type validation passes for any touched scripts paths.
  - Scope expansion note: `generate-process-improvements.ts` and the operator report surface were added so the new review-required contract reuses an existing workflow surface instead of becoming a dead sidecar.
- **Build evidence (2026-03-09):**
  - Added `signal-review.review-required.v1` sidecar contract with required fields (`fingerprint`, `owner`, `due_date`, `escalation_state`, recurrence metadata) and documented its reuse of the existing `process-improvements` pending-review surface.
  - Added `scripts/src/startup-loop/diagnostics/signal-review-review-required.ts` to extract repeated Signal Review findings into deterministic review-required sidecars adjacent to each Signal Review artifact.
  - Extended `generate-process-improvements.ts` to ingest `signal-review-*.review-required.json`, dedupe by `business + fingerprint`, and surface one refreshed pending-review item instead of cloning duplicates.
  - Updated `docs/business-os/process-improvements.user.html` copy/rendering so the pending-review surface can show review owner, due date, escalation state, and fingerprint for repeated Signal Review work items.
  - Added targeted tests covering sidecar extraction and duplicate-surface refresh semantics.
  - Validation:
    - `pnpm exec eslint scripts/src/startup-loop/diagnostics/signal-review-review-required.ts scripts/src/startup-loop/build/generate-process-improvements.ts scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts scripts/src/startup-loop/__tests__/signal-review-review-required.test.ts --no-warn-ignored`
    - `pnpm exec tsc --noEmit --pretty false --module NodeNext --moduleResolution NodeNext --target ES2022 --lib ES2022 --types node --esModuleInterop --resolveJsonModule --skipLibCheck scripts/src/startup-loop/diagnostics/signal-review-review-required.ts`
    - `node --import tsx -e "import { extractSignalReviewRequiredItems } from './scripts/src/startup-loop/diagnostics/signal-review-review-required.ts'; ..."`
    - `node --import tsx -e "import { collectProcessImprovements } from './scripts/src/startup-loop/build/generate-process-improvements.ts'; ..."`
  - Validation note: package-wide `pnpm exec tsc --noEmit -p scripts/tsconfig.json --pretty false` is currently blocked by unrelated pre-existing errors under `scripts/src/startup-loop/ideas/` and `scripts/src/startup-loop/self-evolving/`; TASK-01 touched paths validated cleanly via scoped compile/import.

### TASK-02: Update Signal Review workflow guidance to emit/refresh review-required items and recurrence escalation metadata
- **Type:** IMPLEMENT
- **Deliverable:** `lp-signal-review` guidance and any supporting helper wiring that turn repeated findings into durable review-required items instead of copy-paste stubs
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Pending
- **Affects:** `.claude/skills/lp-signal-review/SKILL.md`, `.claude/skills/startup-loop/SKILL.md`, `docs/business-os/strategy/<BIZ>/signal-review-*.md` generation guidance, supporting scripts/helpers if introduced
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 79% - the skill/process layer is clear, but exact helper placement needs care.
  - Approach: 82% - durable manual closure is the right middle ground.
  - Impact: 81% - repeated issues become tractable instead of textual reminders.
- **Acceptance:**
  - Repeated findings emit or refresh durable review-required items keyed by fingerprint.
  - Signal Review still does not auto-spawn implementation work.
  - Escalation metadata becomes explicit for repeated unresolved findings.
  - Same fingerprint plus new context refreshes one item rather than creating duplicates; escalation increments rather than cloning work.
- **Validation contract (TC-02):**
  - TC-01: a repeated finding walkthrough produces a review-required item instead of only a stub.
  - TC-02: non-repeated findings do not create duplicate durable items.
  - TC-03: any touched scripts/docs validate cleanly.

## Risks & Mitigations
- New review-required items could become a second stale backlog.
  - Mitigation: require owner/due-date fields from the start, key updates by fingerprint, and reuse an existing workflow surface rather than inventing a new store.
- Process-only changes could drift from actual emitted artifacts.
  - Mitigation: define the artifact contract before changing workflow guidance.

## Observability
- Logging: review-required item creation/refresh results if helper code is introduced.
- Metrics: future counts of open vs escalated repeated findings.
- Alerts/Dashboards: none in this tranche.

## Acceptance Criteria (overall)
- [ ] Repeated Signal Review findings become durable review-required items.
- [ ] Manual decision authority is preserved.
- [ ] Review-required items carry owner, due date, and escalation state.
- [ ] Review-required items live on an existing workflow surface, not a free-floating second backlog.
- [ ] Same fingerprint refreshes one item with appended context and escalation metadata.

## Decision Log
- 2026-03-09: Chose durable review-required items over tighter prose-only promotion guidance.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
