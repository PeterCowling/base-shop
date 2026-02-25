---
Type: Reflection-Debt
Status: Resolved
Feature-Slug: startup-loop-why-intended-outcome-automation
Debt-Key: reflection-debt:startup-loop-why-intended-outcome-automation
Lane: IMPROVE
SLA-days: 7
SLA-deadline: 2026-03-04
Breach-behavior: block_new_admissions_same_owner_business_scope_until_resolved_or_override
Emitted-at: 2026-02-25
---

# Reflection Debt: startup-loop-why-intended-outcome-automation

`results-review.user.md` is missing or incomplete for this build. The minimum
payload required to resolve this debt is:

1. `## Observed Outcomes` — at least one concrete observed outcome after deployment/activation
2. `## Standing Updates` — required standing artifact updates, or explicit `No standing updates: <reason>`
3. `## New Idea Candidates` — new idea candidates surfaced, or explicit `None.`
4. `## Standing Expansion` — expansion decision, or explicit `No standing expansion: <reason>`
5. `## Intended Outcome Check` — `Intended:`, `Observed:`, `Verdict: <Met | Partially Met | Not Met>`, `Notes:`

## Resolution path

Create `docs/plans/startup-loop-why-intended-outcome-automation/results-review.user.md` (or
`docs/plans/_archive/startup-loop-why-intended-outcome-automation/results-review.user.md` if
already archived) using the template at `docs/plans/_templates/results-review.user.md`.

The intended outcome from the build-record is:

> Introduce a contract-first pipeline (dispatch.v2 schema, template propagation, canonical
> build-event.json emitter, reflection debt expansion) that structurally eliminates the
> missing-field problem without fabricating data. Measured by: new builds using dispatch.v2
> produce Build Summary rows with non-heuristic `why_source`.

Once the minimum payload is complete (all 5 sections present with non-template content),
set `Status: Resolved` in this file's frontmatter to clear the debt.

## Breach note

SLA breach on 2026-03-04 activates:
`block_new_admissions_same_owner_business_scope_until_resolved_or_override`

To override the block, add `Override: true` with a written rationale to this file before
or at the breach date.
