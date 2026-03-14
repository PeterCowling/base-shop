---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-hot-path-telemetry
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Fact-Find: docs/plans/do-workflow-hot-path-telemetry/fact-find.md
Related-Plan: docs/plans/do-workflow-hot-path-telemetry/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Hot-Path Telemetry Analysis

## Decision Frame
### Summary
Choose how to add measurable workflow telemetry without creating a second reporting system or burdening each DO stage with large manual commands.

### Goals
- keep telemetry additive to the existing ideas stream,
- keep stage commands short via canonical path inference,
- provide both machine-readable JSON and human-readable markdown summary output.

### Non-goals
- real-time model interception,
- replacing ideas metrics rollup,
- schema-breaking telemetry changes.

## Inherited Outcome Contract
- **Why:** The DO workflow now has better shared contracts, but token efficiency is still measured mostly by inference rather than stage-by-stage telemetry.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic hot-path telemetry for the `lp-do-ideas -> lp-do-build` workflow, reusing the existing ideas telemetry stream and summarising stage/module/context cost.
- **Source:** operator

## Evaluation Criteria
| Criterion | Why it matters | Weight |
|---|---|---|
| Compatibility | must not break existing ideas telemetry or rollups | High |
| Token efficiency | commands and docs should stay short | High |
| Deterministic enforceability | append/dedupe/report logic must be code, not prose | High |
| Adoption fit | stages should have natural emit points after existing validators | High |

## Options Considered
| Option | Description | Upside | Downside | Viable? |
|---|---|---|---|---|
| A | Append discriminated `workflow_step` lines to existing ideas telemetry stream and add a dedicated reporter | one stream, additive, existing rollups ignore unknown lines | requires schema/doc extension | Yes |
| B | Create a separate DO workflow telemetry file and report pipeline | isolated | second reporting system, duplicated persistence doctrine | No |
| C | Keep telemetry in build-record prose only | low code cost | not machine-readable, still inferred not measured | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | N/A process-only | N/A process-only | N/A |
| UX / states | stage cost visible in one stream | split visibility across files | prefer one stream |
| Security / privacy | repo-local additive lines only | another persistence surface to secure | prefer additive |
| Logging / observability / audit | strongest audit trail in one append-only log | fractured audit surface | prefer one stream |
| Testing / validation | one recorder + one report + unit tests | more surfaces to test | prefer one stream |
| Data / contracts | discriminated line type is additive | new schema contract and separate artifact | prefer additive |
| Performance / reliability | same atomic append semantics as current telemetry | duplicate append code or divergent behavior | prefer shared pattern |
| Rollout / rollback | easy to ignore by existing runners | requires new consumer adoption path | prefer additive |

## Chosen Approach
- Recommendation: use the existing ideas telemetry JSONL stream, add discriminated `workflow_step` records for downstream stages, and provide a separate reporter that filters only those lines.
- Rejected alternatives:
  - separate telemetry file: rejected because it duplicates the reporting system and increases operator discovery cost.
  - prose-only reporting: rejected because it does not produce reusable measurement data.
- Operator-only questions: None.

## Planning Handoff
- Build one shared JSONL helper to avoid duplicating append/read patterns.
- Add a workflow-step recorder that infers canonical artifact and skill paths from `stage + feature-slug`.
- Add a report command that can output JSON or markdown.
- Wire fact-find, analysis, plan, and build docs to emit telemetry after validators pass.
- Update `build-record.user.md` to carry a telemetry summary section when recorded.
