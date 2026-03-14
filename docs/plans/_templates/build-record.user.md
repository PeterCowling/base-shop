---
Type: Build-Record
Status: Complete
Domain: <Repo | CMS | Platform | UI | API | Data | Infra | etc.>
Last-reviewed: <YYYY-MM-DD>
Feature-Slug: <feature-slug>
Execution-Track: <code | business-artifact | mixed>
Completed-date: <YYYY-MM-DD>
artifact: build-record
# Optional — set when a strategy artifact references this build for Build Summary integration:
# Build-Event-Ref: docs/plans/<feature-slug>/build-event.json
---

# Build Record: <Feature Name>

## Outcome Contract

<!--
Carry from plan.md § Inherited Outcome Contract, which inherits from analysis.md § Inherited Outcome Contract and ultimately from fact-find.md § Outcome Contract.
Source: "operator" if confirmed at Option B; "auto" if auto-generated fallback.
"auto" and "TBD" values pass the contract but are excluded from operator-quality metrics.
The build-event.json emitter reads this section; absent/TBD values produce why_source: "heuristic".
-->

- **Why:** <carry from plan Inherited Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from plan; must be non-empty if known; use TBD if absent>
- **Source:** <operator | auto>

## Self-Evolving Measurement

<!--
Optional proof block for builds that close a self-evolving dispatch with a verified KPI result.
`startup-loop:queue-state-complete` reads this section automatically from the adjacent
`build-record.user.md` when present.

Rules:
- Use `Status: none` for normal builds or when no verified proof exists yet.
- Use `Status: verified` only when every required field below is known.
- A malformed declared (`verified`) block should be fixed before queue completion runs.
-->

- **Status:** none

<!-- When Status is `verified`, replace the block above with:
- **Status:** verified
- **KPI Name:** <name>
- **KPI Value:** <number>
- **KPI Unit:** <ratio | count | currency | seconds | score>
- **Aggregation Method:** <mean | median | sum | rate>
- **Sample Size:** <integer>
- **Baseline Ref:** <baseline identifier or artifact ref>
- **Measurement Window:** <window label or ISO range>
- **Baseline Window:** <window label or ISO range>
- **Post Window:** <window label or ISO range>
- **Measured Impact:** <number>
- **Impact Confidence:** <number>
- **Regressions Detected:** <integer>
- **Data Quality Status:** <ok | degraded>
- **Traffic Segment:** <segment or all>
- **Artifact Refs:** <comma-separated repo-relative paths or refs>
-->

## What Was Built

<Concise narrative of every task completed: what changed, where, and why. One paragraph per task group.>

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `<test command>` | Pass / Fail | <any skips or notable failures> |

## Workflow Telemetry Summary

<!-- Populate when DO workflow telemetry was recorded. Preferred source:
`pnpm --filter scripts startup-loop:lp-do-ideas-report-workflow-telemetry -- --feature-slug <feature-slug> --format markdown`
Summarise stage coverage, context bytes, module counts, deterministic checks, and token-measurement coverage. -->

<Short summary of workflow telemetry, or `None: workflow telemetry not recorded`.>

## Validation Evidence

<Per-task TC/VC pass evidence. Copy from plan or summarise. Must show each contract was met.>

### TASK-01
- TC-01-A: <pass evidence>
- TC-01-B: <pass evidence>

## Engineering Coverage Evidence

<!-- Required for code/mixed builds. For business-artifact-only builds, omit or write `None: not a code-bearing change`. Use the canonical row labels from `.claude/skills/_shared/engineering-coverage-matrix.md`. -->
| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | ... | ... |
| UX / states | ... | ... |
| Security / privacy | ... | ... |
| Logging / observability / audit | ... | ... |
| Testing / validation | ... | ... |
| Data / contracts | ... | ... |
| Performance / reliability | ... | ... |
| Rollout / rollback | ... | ... |

## Scope Deviations

<Any controlled scope expansions made during build, with rationale. None if no deviations.>
