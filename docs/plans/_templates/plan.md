---
Type: Plan
Status: <Draft | Active | Archived | Superseded>
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Workstream: <Engineering | Product | Marketing | Sales | Operations | Finance | Mixed>
Created: YYYY-MM-DD
Last-reviewed: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: <kebab-case>
Deliverable-Type: <code-change | email-message | product-brief | marketing-asset | spreadsheet | whatsapp-message | multi-deliverable>
Startup-Deliverable-Alias: <none | startup-budget-envelope | startup-channel-plan | startup-demand-test-protocol | startup-supply-timeline | startup-weekly-kpcs-memo | website-first-build-backlog | website-upgrade-backlog>
Execution-Track: <code | business-artifact | mixed>
Primary-Execution-Skill: <lp-do-build | draft-email | biz-product-brief | draft-marketing | biz-spreadsheet | draft-whatsapp>
Supporting-Skills: <comma-separated or none>
Overall-confidence: <0-100%>
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: <plan-only | plan+auto>
---

# <Feature Name> Plan

## Summary
<3-6 sentences>

## Active tasks
- [ ] TASK-01: <short title>

## Goals
- ...

## Non-goals
- ...

## Constraints & Assumptions
- Constraints:
  - ...
- Assumptions:
  - ...

## Inherited Outcome Contract

<!--
Populated by /lp-do-plan from the fact-find's `## Outcome Contract` section.
For dispatch-routed fact-finds: values come from the dispatch.v2 payload.
For direct-inject fact-finds: values come from Trigger-Why / Trigger-Intended-Outcome frontmatter.
If the fact-find has no Outcome Contract section (legacy): mark as Source: auto / Why: TBD.
Do not fabricate values.
-->

- **Why:** <carry from fact-find Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from fact-find; use TBD if absent>
- **Source:** <operator | auto> <!-- carries through from fact-find; auto values excluded from quality metrics -->

## Fact-Find Reference
- Related brief: `docs/plans/<feature-slug>/fact-find.md`
- Key findings used:
  - ...

## Proposed Approach
- Option A:
- Option B:
- Chosen approach: (required — agent must decide; if genuinely requires operator input, open a DECISION task, but apply the DECISION task self-resolve gate first)

## Plan Gates
- Foundation Gate: <Pass | Fail>
- Sequenced: <Yes | No>
- Edge-case review complete: <Yes | No>
- Auto-build eligible: <Yes | No>

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ... | 85% | M | Pending | - | TASK-02 |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | ... |

## Tasks

Use task templates:
- `docs/plans/_templates/task-implement-code.md`
- `docs/plans/_templates/task-implement-biz.md`
- `docs/plans/_templates/task-investigate.md`
- `docs/plans/_templates/task-decision.md`
- `docs/plans/_templates/task-checkpoint.md`

## Risks & Mitigations
- ...

## Observability
- Logging:
- Metrics:
- Alerts/Dashboards:

## Acceptance Criteria (overall)
- [ ] ...

## Decision Log
- YYYY-MM-DD: ...

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`
