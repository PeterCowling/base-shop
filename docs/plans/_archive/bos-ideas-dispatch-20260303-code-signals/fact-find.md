---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: bos-ideas-dispatch-20260303-code-signals
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/bos-ideas-dispatch-20260303-code-signals/plan.md
Trigger-Why: Bug scan findings and structural code changes are currently high-signal inputs that do not reliably enter the ideas dispatch queue.
Trigger-Intended-Outcome: Automatic dispatch emission for high-severity bug-scan and codebase-structure signals.
---

# BOS Ideas Dispatch 0155/0156 Fact-Find Brief

## Scope
### Summary
This fact-find covers dispatches `0155` and `0156`: bridge bug-scan findings and structural code changes into ideas dispatch generation, then integrate the bridge into the post-build flow.

### Goals
- Emit dispatch packets when critical bug-scan findings change.
- Emit dispatch packets when structural code changes (API/route/schema/dependency/component) are detected.
- Ensure the bridge writes to queue-state with idempotent repeat suppression.

### Non-goals
- Queue-state schema migration (`dispatches[]` -> `entries[]`) in this cycle.
- Live-mode activation changes.

## Outcome Contract
- **Why:** Code quality and code evolution signals are present in the repository but not consistently routed into the ideas queue.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A deterministic bridge emits queue dispatches from bug-scan and structural code changes with bounded dedupe and clear evidence refs.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/quality/bug-scan.ts`
- `scripts/src/startup-loop/build/generate-process-improvements.ts`
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- `docs/business-os/startup-loop/ideas/standing-registry.json`

### Key Findings
- Bug-scan artifacts are consumed by process-improvements generation but not routed into dispatch queue generation.
- Structural code changes are not modeled as registered artifacts, so ideas routing has no source event for them.
- Trial orchestrator already supports synthetic artifact-delta events if artifact IDs are registered and eligible.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Bug-scan artifact ingestion | Yes | Missing bridge into orchestrator event model | Yes |
| Codebase structural diff signals | Yes | No existing signal-to-event bridge | Yes |
| Queue emission path | Partial | Legacy queue format requires compatible append path | Yes |
| Registry eligibility | Yes | New synthetic artifacts required | Yes |

## Scope Signal
Signal: right-sized

Rationale: The required behavior can be delivered with one bridge module, registry expansion, and one integration point in existing post-build generation.

## Evidence Gap Review
### Gaps Addressed
- Confirmed exact missing link points for both dispatches.
- Confirmed trial orchestrator can emit packets from synthetic events.

### Confidence Adjustments
- Increased implementation confidence after verifying queue append and orchestrator interfaces are already in place.

### Remaining Assumptions
- Legacy queue (`dispatches[]`) remains active during this tranche.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-build`
