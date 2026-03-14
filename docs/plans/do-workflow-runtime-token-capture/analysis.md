---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-runtime-token-capture
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Fact-Find: docs/plans/do-workflow-runtime-token-capture/fact-find.md
Related-Plan: docs/plans/do-workflow-runtime-token-capture/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Runtime Token Capture Analysis

## Decision Frame
### Summary
Choose how much provider-specific runtime token capture to add now, while keeping the workflow telemetry system deterministic and trustworthy.

### Goals
- auto-capture real token usage when the provider session seam is stable,
- keep the recorder fail-open when that seam is absent,
- avoid reverse-engineered telemetry becoming a hidden reliability risk.

### Non-goals
- forcing Claude into automatic capture without a stable current-session locator,
- inventing a second telemetry stream,
- adding prompt-path instrumentation.

## Inherited Outcome Contract
- **Why:** The workflow telemetry layer now records context and module cost, but the token fields still sit at 0% coverage because they are not populated from runtime metadata.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Auto-capture real workflow token usage for Codex-backed DO stages, keep the prompt path untouched, and support Claude when a concrete session-usage source is supplied while preserving manual fallback otherwise.
- **Source:** operator

## Evaluation Criteria
| Criterion | Why it matters | Weight |
|---|---|---|
| Determinism | workflow telemetry must remain trustworthy | High |
| Coverage gain | should materially improve token measurement | High |
| Provider fit | only stable provider seams should be automated | High |
| Operational simplicity | recorder commands should stay short | High |

## Options Considered
| Option | Description | Upside | Downside | Viable? |
|---|---|---|---|---|
| A | Auto-capture Codex runtime usage now, keep Claude manual/unknown fallback | immediate high-confidence gain with bounded scope | provider coverage remains partial | Yes |
| B | Auto-capture Codex now and support Claude only when a concrete Claude session id is supplied | broader coverage without unsafe guessing | slightly more contract surface | Yes |
| C | Keep manual token recording only | no provider-specific code | leaves the current 0% coverage gap unresolved | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | clear, explicit provider boundary | opaque “maybe automatic” behavior | prefer explicit boundary |
| Security / privacy | stores minimal numeric/provider fields only | more reverse-engineered home-dir telemetry handling | prefer bounded local data |
| Logging / observability / audit | snapshot provenance can be stored cleanly | provenance stays trustworthy if session id is explicit | explicit session seam is acceptable |
| Testing / validation | straightforward temp-log fixtures | modest extra parser/test surface | bounded extra surface is acceptable |
| Data / contracts | additive provider/session/snapshot fields | still additive, but Claude path needs explicit-session wording | explicit-session wording is acceptable |
| Performance / reliability | bounded tail scan + feature delta | scans more telemetry when Claude is enabled | explicit opt-in keeps runtime bounded |
| Rollout / rollback | simple: Codex on, Claude fallback | simple: Codex auto, Claude explicit opt-in | explicit opt-in remains simple enough |

## Chosen Approach
- Recommendation: auto-capture runtime token usage for Codex-backed workflow stages, record feature baselines starting at `lp-do-ideas`, compute later stage token deltas from cumulative totals, and support Claude only when a concrete Claude session id is supplied explicitly.
- Rejected alternatives:
  - implicit Claude auto-capture from “latest history” or ambient telemetry: rejected because the telemetry surface is present but not cleanly tied to the active workflow stage/session under concurrency.
  - manual-only token recording: rejected because it leaves the workflow summary blind in the dominant Codex path.
- Operator-only questions: None.

## Engineering Coverage Comparison Notes
- Add provider/session/snapshot metadata so the next stage can compute exact deltas without re-reading earlier prompt text.
- Keep home-directory paths out of the persisted repo telemetry; store provider/session IDs and numeric totals only.

## Planning Handoff
- Add a provider-aware runtime token helper and wire it into the recorder.
- Extend the schema contract to describe runtime snapshot provenance and delta/fallback modes.
- Update workflow guidance so `lp-do-ideas` can record the first feature-stage baseline.
- Keep Claude explicitly documented as explicit-session auto-capture or manual/unknown fallback, not “unsupported but maybe working.”
