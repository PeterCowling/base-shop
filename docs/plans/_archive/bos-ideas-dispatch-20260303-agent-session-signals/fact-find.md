---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-updated: 2026-03-03
Feature-Slug: bos-ideas-dispatch-20260303-agent-session-signals
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/bos-ideas-dispatch-20260303-agent-session-signals/plan.md
Trigger-Why: Agent walkthrough and manual testing findings are a high-frequency discovery source but currently disappear when the session ends.
Trigger-Intended-Outcome: Agent-session findings are captured from transcript evidence and routed into the ideas queue as deduplicated dispatch candidates.
---

# BOS Ideas Dispatch 0157 Fact-Find Brief

## Scope
### Summary
This fact-find covers dispatch `IDEA-DISPATCH-20260303235900-0157`: create a deterministic bridge from agent-session findings into the ideas queue, using transcript-backed extraction and queue-safe dedupe.

### Goals
- Parse recent Claude session transcripts for walkthrough/testing sessions with issue findings.
- Persist findings into a synthetic standing artifact and emit one artifact-delta event per meaningful change.
- Route admitted deltas through the existing trial orchestrator and queue-state append path.
- Register the new synthetic artifact + semantic keywords for T1 routing eligibility.

### Non-goals
- Full NLP-grade transcript understanding or auto-triage severity scoring.
- Queue schema migration (`dispatches[]` to canonical `entries[]`) in this cycle.
- Live-mode automation changes.

## Outcome Contract
- **Why:** Agent sessions are a primary source of actionable bug/flow findings, but those findings are not persisted into the loop’s dispatch pipeline.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A deterministic transcript-to-dispatch bridge captures recurring session findings and emits deduplicated queue candidates through the existing ideas trial pipeline.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- `docs/business-os/startup-loop/ideas/standing-registry.json`
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts`
- `scripts/src/startup-loop/ideas/lp-do-ideas-codebase-signals-bridge.ts`
- `.claude/projects/-Users-petercowling-base-shop/*.jsonl`

### Key Findings
- Dispatch `0157` is queued as `fact_find_ready`, but no dedicated implementation artifact exists yet.
- Transcript files contain structured JSONL with user/assistant messages and session IDs, enabling deterministic parsing.
- Existing bridge patterns already support synthetic artifact emission + dedupe + queue append.
- Standing registry currently has no `AGENT_SESSION_FINDINGS` source artifact.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Transcript source availability | Yes | No parser currently in ideas bridge suite | Yes |
| Signal extraction model | Partial | Needs bounded heuristic for finding-level extraction | Yes |
| Queue append path | Yes | Must remain dedupe-safe and compatibility-safe with queue.v1 | Yes |
| Registry routing eligibility | Yes | Missing artifact + missing T1 keywords for session findings | Yes |

## Scope Signal
Signal: right-sized

Rationale: Existing bridge modules and orchestrator contracts allow a bounded additive implementation with low blast radius (scripts + registry only).

## Evidence Gap Review
### Gaps Addressed
- Confirmed transcript structure can be read without external dependencies.
- Confirmed orchestrator + queue append interfaces can be reused.

### Confidence Adjustments
- Raised implementation confidence after verifying an existing bridge template with near-identical queue semantics.

### Remaining Assumptions
- Transcript quality is sufficient for conservative extraction heuristics; false negatives are acceptable in first pass.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-build`
