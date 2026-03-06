---
Type: Plan
Status: Active
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: ideas-work-package-promotion
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 89%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Ideas Work-Package Promotion Plan

## Summary
This plan closes the missing work-package seam between `lp-do-ideas` and the `fact-find -> plan -> build` workflow. The implementation keeps atomic dispatch emission intact, adds deterministic candidate discovery for adjacent queued dispatches, adds a fail-closed helper to stamp `processed_by` for every bundled dispatch, and updates the workflow contract so multi-dispatch fact-finds are canonical instead of undocumented drift.

## Active tasks
- [x] TASK-01: Extract shared queue-state file helpers and add work-package candidate discovery
- [x] TASK-02: Add deterministic multi-dispatch fact-find promotion helper with tests
- [x] TASK-03: Update workflow contracts, templates, and fact-find skill guidance

## Goals
- Preserve atomic idea logging while allowing one coherent work package to promote into one fact-find / plan.
- Make multi-dispatch traceability canonical.
- Remove manual queue-state edits from bundled fact-find promotion.

## Non-goals
- Autonomous bundle execution.
- Reworking downstream build completion behavior.

## Constraints & Assumptions
- Constraints:
  - Queue-state writes must remain atomic.
  - Bundled promotion must fail closed on conflicts.
- Assumptions:
  - Operators still confirm bundle use; candidates are suggestions, not automatic promotions.

## Inherited Outcome Contract
- **Why:** Related ideas are already being bundled manually, but the workflow contract still treats promotion as one dispatch to one slug. That mismatch wastes time and tokens and makes traceability inconsistent.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The ideas workflow supports canonical multi-dispatch work packages before fact-find promotion, with deterministic candidate discovery, explicit fact-find metadata, and queue-state processing for every bundled dispatch.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/ideas-work-package-promotion/fact-find.md`
- Key findings used:
  - Atomic dispatch decomposition is intentional and should remain.
  - Multi-dispatch fact-finds already exist in practice.
  - Queue completion already supports multiple dispatches by shared `fact_find_slug`.

## Proposed Approach
- Option A:
  - Collapse related ideas earlier by making `lp-do-ideas` emit coarse bundles.
  - Cons: loses atomic traceability and makes intake classification weaker.
- Option B:
  - Keep atomic dispatches, add a deterministic work-package promotion seam before fact-find.
  - Pros: preserves logging fidelity while reducing downstream overhead.
- Chosen approach:
  - Option B.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Shared queue-state helpers + work-package candidate derivation | 90% | M | Complete (2026-03-06) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Multi-dispatch promotion helper + deterministic tests | 90% | M | Complete (2026-03-06) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Workflow docs/contracts/templates for canonical bundled fact-find promotion | 88% | M | Complete (2026-03-06) | TASK-01, TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Code changes are tightly related and were executed as one bounded workstream |
| 2 | TASK-03 | TASK-01, TASK-02 | Contracts updated after helper shape stabilized |

## Tasks

### TASK-01: Shared queue-state helpers + work-package candidate derivation
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-file.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`, `scripts/package.json`
- **Confidence:** 90%
- **Acceptance:**
  - Shared queue-state read/count/write helpers extracted for reuse.
  - Pending fact-find dispatches can be grouped into deterministic work-package candidates.
  - CLI entry exists to inspect candidates from queue-state.
- **Build evidence:** Added `lp-do-ideas-queue-state-file.ts`, added `startup-loop:ideas-work-package-candidates`, and implemented candidate derivation in `lp-do-ideas-work-packages.ts`.

### TASK-02: Multi-dispatch promotion helper + deterministic tests
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `scripts/src/startup-loop/ideas/lp-do-ideas-work-packages.ts`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-work-packages.test.ts`
- **Confidence:** 90%
- **Acceptance:**
  - Bundled dispatch IDs can be marked `processed` for one fact-find slug/path.
  - Re-runs are idempotent.
  - Conflicting queue-state assignments fail closed.
- **Build evidence:** Added `markDispatchesProcessed()`, reused shared queue-state helpers in completion helper, and added focused temp-file tests.

### TASK-03: Workflow docs/contracts/templates for canonical bundled fact-find promotion
- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:** `.claude/skills/_shared/queue-check-gate.md`, `.claude/skills/lp-do-fact-find/SKILL.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md`, `docs/plans/_templates/fact-find-planning.md`
- **Confidence:** 88%
- **Acceptance:**
  - Queue gate documents bundled candidate confirmation.
  - Fact-find contract supports canonical `Dispatch-IDs` + `Work-Package-Reason`.
  - Fact-find skill guidance distinguishes single-dispatch vs bundled frontmatter.
- **Build evidence:** Updated queue gate, fact-find skill validation checklist, loop output contract, and fact-find template.

## Risks & Mitigations
- Candidate grouping may still under-group or over-group edge cases.
  - Mitigation: bundle generation is advisory and operator-confirmed.
- Existing ad hoc multi-dispatch docs may still use `Dispatch-ID` with comma-separated values.
  - Mitigation: contract now formalizes the preferred plural field going forward.

## Observability
- Logging: queue-state mutations remain visible in `queue-state.json`.
- Metrics: existing completion metrics continue to work because bundled promotions still converge on one `fact_find_slug`.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] Related queued dispatches can be surfaced as deterministic work-package candidates.
- [x] One fact-find can deterministically stamp `processed_by` for every dispatch in a bundled work package.
- [x] Bundled fact-find metadata is canonical in the contract/template/skill docs.

## Decision Log
- 2026-03-06: Preserved atomic dispatch logging and introduced a promotion-layer work-package seam instead of bundling at intake.
