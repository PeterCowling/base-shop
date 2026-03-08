---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS | Startup Loop
Workstream: Operations
Created: 2026-03-06
Last-updated: 2026-03-06
Feature-Slug: ideas-micro-build-direct-lane
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/ideas-micro-build-direct-lane/plan.md
Trigger-Why: Some queued ideas are so trivially bounded that the fact-find and full-plan stages add more overhead than signal, but bypassing build entirely would break queue accuracy, validation, and outcome recording.
Trigger-Intended-Outcome: "type: operational | statement: Add a canonical direct-build micro-build lane from lp-do-ideas to lp-do-build, with route-aware queue metadata and minimal execution artifacts that preserve auditability. | source: operator"
direct-inject: true
direct-inject-rationale: Workflow redesign requested directly by the operator.
---

# Ideas Micro-Build Direct Lane Fact-Find

## Scope
### Summary
The ideas pipeline currently routes only to fact-find or briefing. A third lane is needed for very small executable work so the queue stays accurate without paying the full fact-find/plan overhead.

### Goals
- Add a canonical `micro_build_ready -> lp-do-build` route.
- Preserve queue lifecycle accuracy for direct-build packets.
- Keep build validation and post-build records, but replace full fact-find/plan with a minimal direct-build artifact.

### Non-goals
- Auto-executing micro-builds without confirmation.
- Replacing the normal fact-find/plan/build path for non-trivial work.

## Outcome Contract
- **Why:** Tiny executable ideas should avoid unnecessary ceremony, but they still need build controls and queue reconciliation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The ideas workflow can send trivially bounded changes straight to build with a minimal execution contract while keeping queue, validation, and reflection records accurate.
- **Source:** operator

## Evidence Audit
- `.claude/skills/lp-do-ideas/SKILL.md` only documents `fact_find_ready` and `briefing_ready`.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` only routes to fact-find or briefing.
- `.claude/skills/lp-do-build/SKILL.md` assumes a full `plan.md`.
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` has no minimal direct-build artifact.
- Queue processed/completed metadata is still fact-find-shaped.

## Confidence Inputs
- Implementation: 86%
- Approach: 88%
- Impact: 90%
- Delivery-Readiness: 87%
- Testability: 84%

## Planning Readiness
- Go: the route, queue, and build-contract seams are identified and bounded.
