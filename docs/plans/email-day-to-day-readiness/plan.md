---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-05
Last-reviewed: 2026-03-05
Last-updated: 2026-03-05 (TASK-03 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: email-day-to-day-readiness
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tool-process-audit
Overall-confidence: 86%
Confidence-Method: Existing email pipeline is understood; multipart composition fix is bounded to generator + quality regressions
Auto-Build-Intent: plan+auto
---

# Email Day-to-Day Readiness Plan

## Summary
This pass focuses on the current Brikette email drafting pipeline as it exists in `packages/mcp-server`, with emphasis on daily operator reliability rather than a full architectural rewrite. The main gap is not simple template availability anymore; it is that multipart emails are still composed as stitched template fragments instead of atomic per-question answers. That makes mixed-intent guest emails harder to answer cleanly and leaves the operator with manual patching work that should be handled by the generator. The implementation scope is therefore bounded to atomic multipart composition, per-question fallback behavior, and the regression coverage needed to keep the pipeline safe for daily use.

## Active tasks
- [x] TASK-01: Persist this readiness plan and execution scope
- [x] TASK-02: Refactor multipart draft generation into ordered per-question answer blocks
- [x] TASK-03: Add per-question fallback handling and regression tests for daily-use edge cases

## Goals
- Produce atomic multipart drafts where each detected question gets its own answer block.
- Replace generic trailing fallback behavior with per-question follow-up handling.
- Improve operator confidence for day-to-day inbox use without weakening protected-category safeguards.

## Non-goals
- Full replacement of the template/rule-based pipeline with an LLM-first architecture.
- Reworking Gmail queue state, lock handling, or reception-side API surfaces in this pass.
- Changing protected `prepayment` or `cancellation` wording semantics.

## Constraints & Assumptions
- Constraints:
  - Keep deterministic protected-category behavior intact.
  - Stay within `@acme/mcp-server` scope unless a documentation update is directly required.
  - Use targeted validation only; no local Jest/e2e broad test runs outside policy.
- Assumptions:
  - Existing multi-scenario interpretation and template ranking are sufficiently stable to build on.
  - The highest-value daily-use improvement is better multipart composition, not more template volume.

## Inherited Outcome Contract
- **Why:** Make the email system reliable for day-to-day guest support and close the remaining multipart-composition gap.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators can generate drafts for multi-question guest emails without manual template stitching or ambiguous unanswered sub-questions.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/briefs/email-autodraft-world-class-audit-briefing.md`
- Supporting audit: `docs/plans/_archive/email-system-design-gaps-v2/fact-find.md`
- Key findings used:
  - Multipart drafting still relies on template splicing rather than atomic answer composition.
  - `draft-guide.json` requires numbered handling for multiple questions, but generator behavior does not implement it.
  - The current generic fallback sentence is not mapped per question and is not sufficient for complex daily-use threads.

## Proposed Approach
- Option A: leave generator mostly unchanged and rely on manual patching in the inbox skill.
- Option B: move multipart composition into `draft_generate` so question ordering, answer block structure, and fallback handling are deterministic and testable.
- Chosen approach: Option B. The failure is structural in generation, so the fix belongs in runtime code rather than operator instructions.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Persist focused readiness plan for this pass | 95% | S | Complete (2026-03-05) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Refactor multipart generation into atomic per-question answer blocks | 84% | M | Complete (2026-03-05) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add per-question fallback handling and regression tests | 82% | M | Complete (2026-03-05) | TASK-02 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Planning anchor only |
| 2 | TASK-02 | TASK-01 | Core generator change |
| 3 | TASK-03 | TASK-02 | Tests follow final response shape |

## Risks & Mitigations
- Coverage heuristics may over-credit answer blocks if headings echo question keywords.
  - Mitigation: keep answer blocks concise and validate against regression cases that previously failed.
- Multipart refactor could regress simple single-question drafts.
  - Mitigation: keep single-question path stable and scope atomic assembly to multipart flows.
- Follow-up fallback wording could accidentally mutate protected categories.
  - Mitigation: retain protected-category guards and exclude those categories from atomic rewrite logic.

## Observability
- Logging: keep existing selection/refinement signal events; expose per-question block data in draft output for operator inspection.
- Metrics: use existing quality gate plus new regression coverage for multipart flows.
- Alerts/Dashboards: None in this pass.

## Acceptance Criteria (overall)
- [x] Multipart drafts are composed as ordered per-question answer blocks rather than stitched template bodies.
- [x] Missing sub-questions get explicit per-question follow-up handling instead of one generic trailing sentence.
- [x] Existing protected-category safeguards remain intact.
- [x] Scoped validation for `@acme/mcp-server` passes.

## Decision Log
- 2026-03-05: Chose generator-level atomic multipart composition over skill-only patching because the defect is structural and recurs in daily use.
- 2026-03-05: Kept the single-question path stable and scoped the new atomic composition to multipart flows to limit regression risk.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)
