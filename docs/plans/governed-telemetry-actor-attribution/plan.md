---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-04
Last-reviewed: 2026-03-04
Last-updated: 2026-03-04
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: governed-telemetry-actor-attribution
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Governed Telemetry Actor Attribution Plan

## Summary
Add actor attribution metadata to governed test telemetry so incidents can be attributed to the originating actor/session directly from `.cache/test-governor/events.jsonl`, eliminating heuristic timeline correlation during zombie forensics.

## Active tasks
- [x] TASK-01: Extend telemetry event schema and emitter CLI to accept attribution fields. - Complete (2026-03-04)
- [x] TASK-02: Wire governed test runner emission paths to pass attribution metadata. - Complete (2026-03-04)
- [x] TASK-03: Add deterministic validation coverage for attribution fields and fallback behavior. - Complete (2026-03-04)
- [x] TASK-04: Document attribution query/triage workflow and update relevant runbook references. - Complete (2026-03-04)

## Inherited Outcome Contract
- **Why:** Zombie incident attribution confidence stayed below 80% because governed telemetry events in `.cache/test-governor/events.jsonl` do not include actor/session metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Governed telemetry events include stable actor attribution metadata (session_id and/or caller_pid), enabling deterministic actor identification during incident forensics.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/governed-telemetry-actor-attribution/fact-find.md`

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `session_id` + `caller_pid` fields to telemetry emitter schema/output with explicit fallback contract | 90% | S | Complete (2026-03-04) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Pass attribution values from `run-governed-test.sh` emission callsites (admission timeout + completion) | 86% | M | Complete (2026-03-04) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add deterministic checks (unit/shell) that verify attribution fields are present and correctly formatted | 84% | M | Complete (2026-03-04) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update incident attribution docs/runbook with actor-level query path and compatibility notes | 90% | S | Complete (2026-03-04) | TASK-03 | - |

## Acceptance Criteria (overall)
- [x] Governed telemetry JSONL rows include `session_id` and `caller_pid` fields.
- [x] Both emission paths (admission-timeout and command-complete) populate attribution fields.
- [x] Validation coverage fails when required attribution fields are omitted or malformed.
- [x] Incident runbook contains copyable queries for actor/session filtering.

## Execution Notes
- Preferred attribution contract: `session_id` as primary stable join key; `caller_pid` as supplemental forensic hint.
- Compatibility: historical rows without attribution remain readable; new rows enforce attribution.
- Keep scope limited to governed test telemetry (`scripts/tests/telemetry-log.sh` and `scripts/tests/run-governed-test.sh`) unless hard blockers appear.

## What would make this >=90%
- Add one deterministic test that executes both governed emission paths and asserts non-empty `session_id`/numeric `caller_pid` in emitted JSON rows.
- Confirm no existing consumers parse telemetry with strict fixed-key schemas that would break on added fields.
- Confirm runbook update references the exact post-change JSON shape with one real sample row.

## Build Evidence (2026-03-04)
- `scripts/tests/telemetry-log.sh`
  - Added emitter schema fields: `session_id` (string), `caller_pid` (number).
  - Added CLI flags: `--session-id`, `--caller-pid`.
  - Added fallback contract: env-backed deterministic defaults when explicit flags are omitted.
- `scripts/tests/run-governed-test.sh`
  - Added attribution derivation (`telemetry_session_id`, `telemetry_caller_pid`).
  - Passed attribution fields to both telemetry emission callsites:
    - admission timeout path
    - completion path
- `scripts/tests/validate-governed-telemetry-attribution.mjs` (new)
  - Deterministic validator: fails when governed events have empty `session_id` or non-positive/non-integer `caller_pid`.
- `scripts/tests/run-governed-calibration.sh`
  - Integrated attribution validator into calibration flow.
- `docs/testing-policy.md`
  - Added governed telemetry attribution contract and validation path.
