---
Type: Build-Record
Status: Complete
Feature-Slug: <feature-slug>
Completed-date: <YYYY-MM-DD>
artifact: build-record
# Optional — set when a strategy artifact references this build for Build Summary integration:
# Build-Event-Ref: docs/plans/<feature-slug>/build-event.json
---

# Build Record: <Feature Name>

## Outcome Contract

<!--
Carry from plan.md § Inherited Outcome Contract, which inherits from fact-find.md § Outcome Contract.
Source: "operator" if confirmed at Option B; "auto" if auto-generated fallback.
"auto" and "TBD" values pass the contract but are excluded from operator-quality metrics.
The build-event.json emitter reads this section; absent/TBD values produce why_source: "heuristic".
-->

- **Why:** <carry from plan Inherited Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from plan; must be non-empty if known; use TBD if absent>
- **Source:** <operator | auto>

## What Was Built

<Concise narrative of every task completed: what changed, where, and why. One paragraph per task group.>

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `<test command>` | Pass / Fail | <any skips or notable failures> |

## Validation Evidence

<Per-task TC/VC pass evidence. Copy from plan or summarise. Must show each contract was met.>

### TASK-01
- TC-01-A: <pass evidence>
- TC-01-B: <pass evidence>

## Scope Deviations

<Any controlled scope expansions made during build, with rationale. None if no deviations.>
