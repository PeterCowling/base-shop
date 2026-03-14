---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-hot-path-telemetry
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Analysis: docs/plans/do-workflow-hot-path-telemetry/analysis.md
Trigger-Source: "direct-operator-decision: continue DO workflow token-efficiency hardening by adding real hot-path telemetry"
Trigger-Why: The DO workflow now has better shared contracts, but token efficiency is still measured mostly by inference rather than stage-by-stage telemetry.
Trigger-Intended-Outcome: "type: operational | statement: Add deterministic hot-path telemetry for the lp-do-ideas -> lp-do-build workflow, reusing the existing ideas telemetry stream and summarising stage/module/context cost. | source: operator"
artifact: fact-find
---

# DO Workflow Hot-Path Telemetry Fact-Find Brief

## Scope
### Summary
Add a deterministic telemetry layer for the DO workflow so actual stage/module/context cost can be recorded and reviewed instead of inferred from skill size alone.

### Goals
- Reuse the existing `lp-do-ideas` telemetry stream instead of inventing a separate reporting surface.
- Record one stable workflow-step line per DO stage after artifact persistence and deterministic validation.
- Provide a deterministic report command that summarises stage coverage, module counts, context bytes, and token-measurement coverage.

### Non-goals
- Prompt/runtime interception inside the model API.
- Replacing the existing ideas queue rollup.
- Adding a second queue or lifecycle state machine.

### Constraints & Assumptions
- Constraints:
  - The telemetry stream must remain append-only and safe for existing ideas rollups.
  - Stage docs should stay short; the recorder command should infer canonical paths where possible.
- Assumptions:
  - Current true token counts are not available everywhere, so proxy metrics plus optional token fields are acceptable.

## Outcome Contract

- **Why:** The DO workflow now has better shared contracts, but token efficiency is still measured mostly by inference rather than stage-by-stage telemetry.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic hot-path telemetry for the `lp-do-ideas -> lp-do-build` workflow, reusing the existing ideas telemetry stream and summarising stage/module/context cost.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-ideas/SKILL.md` - existing queue/cycle telemetry doctrine.
- `docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md` - canonical ideas telemetry contract.
- `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts` - append-only JSONL persistence seam.
- `scripts/src/startup-loop/ideas/lp-do-ideas-metrics-runner.ts` - cycle snapshot parser and rollup entrypoint.
- `.claude/skills/lp-do-fact-find/SKILL.md`, `.claude/skills/lp-do-analysis/SKILL.md`, `.claude/skills/lp-do-plan/SKILL.md`, `.claude/skills/lp-do-build/SKILL.md` - downstream stages to instrument.

### Key Findings
- The ideas telemetry stream already supports append-only JSONL and tolerates heterogeneous lines so long as rollup-required fields are absent from non-cycle lines.
- The downstream DO stages currently have no shared deterministic telemetry step after artifact persistence.
- Build has a natural place to summarise telemetry in `build-record.user.md`.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | workflow/process change only | no product UI change | N/A: process-only |
| UX / states | Required | stage docs exist but cost visibility is weak | stage burden is inferred, not measured | compare shared-stream vs separate-stream approaches |
| Security / privacy | Required | telemetry files already exist in repo | new recorder must avoid secrets and unsafe writes | keep data minimal and repo-local |
| Logging / observability / audit | Required | ideas queue telemetry is append-only and auditable | downstream DO stages have no equivalent line type | make workflow-step records first-class |
| Testing / validation | Required | scripts package already carries deterministic helpers and tests | new telemetry layer must be deterministic and testable | add unit coverage and targeted validation |
| Data / contracts | Required | schema doc exists for ideas telemetry | adding fields in the wrong place could break rollups | extend contract additively with discriminated lines |
| Performance / reliability | Required | JSONL append pattern exists | duplicate append or brittle path resolution would reduce trust | use dedupe key and canonical path inference |
| Rollout / rollback | Required | additive telemetry path can be ignored by current rollups | invasive persistence changes would widen blast radius | prefer additive stream extension and optional token fields |

## Confidence Inputs
- Implementation: 87% - existing ideas telemetry/persistence seams make the change additive rather than greenfield.
- Approach: 90% - one shared stream plus discriminated `workflow_step` lines fits the current architecture cleanly.
- Impact: 84% - stage/module/context proxies will materially improve measurement, but true runtime token counts remain partial.

## Analysis Readiness
- Ready: Yes
- Recommended next step: `lp-do-analysis`
- Rationale:
  - there is a clear architectural seam to extend,
  - the main remaining decision is whether to generalize JSONL append helpers or duplicate append logic,
  - operator-only input is not required.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Ideas telemetry stream | Yes | None | No |
| Downstream skill handoff points | Partial | [Moderate] telemetry step not yet specified per stage | Yes |
| Deterministic reporting surface | Partial | [Minor] report format choice still open | Yes |
