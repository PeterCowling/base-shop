---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: bos-ideas-dispatch-20260303-followthrough
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/bos-ideas-dispatch-20260303-followthrough/plan.md
Trigger-Why:
Trigger-Intended-Outcome:
---

# BOS Ideas Dispatch 2026-03-03 Followthrough Fact-Find Brief

## Scope
### Summary
This fact-find covers four queued BOS dispatches: standing registry domain gaps, lp-do-build post-commit hook wiring, self-evolving data activation, and queue-state schema consolidation strategy.

### Goals
- Register MARKET/SELL/PRODUCTS/LOGISTICS standing artifacts so deltas can trigger ideas.
- Add a deterministic post-commit hook utility for lp-do-build to surface dispatch candidates.
- Add a first self-evolving bridge from build artifacts into observation ingestion.
- Produce a migration-ready canonicalization plan for queue-state format divergence.

### Non-goals
- Activating autonomous ideas mode.
- Replacing existing queue-state file format in this cycle.

## Outcome Contract
- **Why:** These four gaps block the ideas feedback loop from seeing non-assessment strategic changes and from learning from build outputs.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Build and document a safe first-pass loop closure: broader registry coverage, callable post-commit hook, build-output self-evolving bridge, and a concrete queue-state migration spec.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` - queued dispatch payloads and current queue format.
- `docs/business-os/startup-loop/ideas/standing-registry.json` - currently assessment-only coverage.
- `.claude/skills/lp-do-build/SKILL.md` - post-task flow has no build-time ideas hook invocation step.
- `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts` - hook module exists but is standalone.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - ideas-to-observations bridge exists; no build-output bridge.

### Key Modules / Files
- `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts` - canonical queue-state.v1 persistence implementation.
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` - legacy `dispatches[]` queue writer confirms format divergence.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - observation ingestion + repeat detection + candidate generation.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md` - explicitly states build-time hook wiring remains pending.

### Dependency & Impact Map
- Upstream dependencies:
  - standing registry taxonomy in `standing-registry.json`
  - build commit artifacts (`build-record.user.md`, `results-review.user.md`, `pattern-reflection.user.md`)
- Downstream dependents:
  - dispatch queue visibility
  - self-evolving observations/candidates
  - operator queue review flow
- Likely blast radius:
  - scripts package only; no runtime app code paths

### Test Landscape
- Frameworks: Jest in `scripts/src/startup-loop/__tests__`
- Policy note: local test execution is CI-governed; run typecheck/lint gates only in this cycle.

## Questions
### Resolved
- Q: Is non-assessment domain coverage currently missing in the standing registry?
  - A: Yes; current artifact entries are ASSESSMENT only.
  - Evidence: `docs/business-os/startup-loop/ideas/standing-registry.json`.
- Q: Does a build-time hook module already exist?
  - A: Yes; `runLiveHook()` exists but is not wired into lp-do-build flow.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts`, seam contract section 2.1.
- Q: Is self-evolving receiving observations from build outputs?
  - A: No; observations file is empty and no build-output bridge exists.
  - Evidence: `docs/business-os/startup-loop/self-evolving/BRIK/observations.jsonl` (0 bytes).
- Q: Are there dual queue-state schemas in active code?
  - A: Yes; legacy `dispatches[]` on disk and canonical `entries[]` in persistence adapter.
  - Evidence: `docs/business-os/startup-loop/ideas/trial/queue-state.json`, `lp-do-ideas-persistence.ts`.

## Confidence Inputs
- Implementation: 86%
- Approach: 88%
- Impact: 84%
- Delivery-Readiness: 86%
- Testability: 82%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hook script over-triggers noisy dispatches | Medium | Medium | Scope to registered artifacts and semantic-delta sections only. |
| Self-evolving bridge emits weak observations | Medium | Medium | Emit bounded one-observation-per-build packet and log summary output. |
| Queue migration introduces data loss | Medium | High | Ship migration utility in dry-run mode + explicit canonicalization spec first. |

## Suggested Task Seeds (Non-binding)
- TASK-01: Expand standing registry coverage for non-assessment domains.
- TASK-02: Implement lp-do-build post-commit ideas hook utility.
- TASK-03: Implement self-evolving bridge from build outputs.
- TASK-04: Implement queue-state migration utility + spec artifact.

## Execution Routing Packet
- Primary execution skill:
  - lp-do-build
- Supporting skills:
  - none

## Evidence Gap Review
### Gaps Addressed
- Verified all four dispatch anchors against concrete file paths.

### Confidence Adjustments
- Increased approach confidence after confirming existing helper modules in ideas and self-evolving systems.

### Remaining Assumptions
- lp-do-build invocation remains skill-driven; utility scripts are the correct integration seam for now.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan`
