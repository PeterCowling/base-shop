---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-updated: 2026-03-04
Feature-Slug: governed-telemetry-actor-attribution
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/governed-telemetry-actor-attribution/plan.md
Dispatch-ID: IDEA-DISPATCH-20260304213000-0991
Trigger-Source: operator-idea
Trigger-Why: Zombie incident attribution confidence stayed below 80% because governed telemetry events in .cache/test-governor/events.jsonl do not include actor/session metadata.
Trigger-Intended-Outcome: Governed telemetry events include stable actor attribution metadata (session_id and/or caller_pid), enabling deterministic actor identification during incident forensics.
---

# Governed Telemetry Actor Attribution Fact-Find Brief

## Scope
### Summary
The governed test runner emits telemetry to `.cache/test-governor/events.jsonl`, but event rows currently lack actor attribution. Incident analysis therefore depends on time correlation and side logs instead of a deterministic actor key.

### Goals
- Define attribution schema extension for governed telemetry events (`session_id`, `caller_pid`, or both).
- Identify all governed telemetry emission callsites that must pass attribution fields.
- Define compatibility policy for historical events without attribution fields.
- Define deterministic validation checks that fail when governed events are emitted without required attribution metadata.

### Non-goals
- Rewriting historical telemetry data.
- Broad startup-loop telemetry redesign outside governed test runner scope.
- Changing test admission/kill logic in this cycle.

## Outcome Contract
- **Why:** Zombie incident attribution confidence stayed below 80% because governed telemetry events in `.cache/test-governor/events.jsonl` do not include actor/session metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Governed telemetry events include stable actor attribution metadata (session_id and/or caller_pid), enabling deterministic actor identification during incident forensics.
- **Source:** operator

## Evidence Audit (Current State)
- `docs/plans/_archive/build-subagent-jest-zombie-cleanup/results-review.user.md` records the gap and suggests creating a card for actor attribution.
- `scripts/tests/telemetry-log.sh` writes governed events as JSONL rows but current schema includes no actor fields (only class/sig/admission/kill metrics).
- `scripts/tests/run-governed-test.sh` emits telemetry at admission-timeout and completion, but does not pass caller/session identity.
- `docs/plans/_archive/build-subagent-jest-zombie-cleanup/incident-attribution.md` explicitly names this as the confidence blocker and recommends `session_id` or `caller_pid`.

## Questions
- Should attribution be required as both `session_id` and `caller_pid`, or allow one as fallback?
- What is the canonical source for `session_id` in non-interactive runs?
- Should `caller_pid` represent shell PID, command PID, or parent PID chain root?
- Which events must be hard-fail when attribution is missing (all governed events vs subset)?

## Confidence Inputs
- Implementation: 86%
- Approach: 88%
- Impact: 89%
- Delivery-Readiness: 85%
- Testability: 87%

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Inconsistent session source across shells/agents | Medium | High | Define one canonical `session_id` derivation contract and fallback order in plan Task 1 |
| Over-strict validation blocks legitimate edge runs | Medium | Medium | Stage rollout: warn-first then enforce once callsites are updated |
| PID-only attribution not stable across wrappers | High | Medium | Prefer `session_id` primary key; keep `caller_pid` as supplemental forensic hint |

## Planning Readiness
- Status: Ready-for-planning
- Recommended next step:
  - `/lp-do-plan` for `governed-telemetry-actor-attribution` with tasks for schema contract, emitter wiring, validation enforcement, and incident query documentation.
