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
Dispatch-ID: <IDEA-DISPATCH-xxx | none>
Deliverable-Type: <code-change | email-message | product-brief | marketing-asset | spreadsheet | whatsapp-message | multi-deliverable>
Startup-Deliverable-Alias: <none | startup-budget-envelope | startup-channel-plan | startup-demand-test-protocol | startup-supply-timeline | startup-weekly-kpcs-memo | website-first-build-backlog | website-upgrade-backlog>
Execution-Track: <code | business-artifact | mixed>
Primary-Execution-Skill: <lp-do-build | draft-email | biz-product-brief | draft-marketing | biz-spreadsheet | draft-whatsapp>
Supporting-Skills: <comma-separated or none>
Overall-confidence: <0-100%>
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: <plan-only | plan+auto>
Related-Analysis: docs/plans/<feature-slug>/analysis.md
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
Populated by /lp-do-plan from the analysis's `## Inherited Outcome Contract` section.
Those values ultimately originate from fact-find `## Outcome Contract`.
If the analysis has no inherited outcome contract section (legacy): mark as Source: auto / Why: TBD.
Do not fabricate values.
-->

- **Why:** <carry from analysis Inherited Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from analysis; use TBD if absent>
- **Source:** <operator | auto> <!-- carries through from analysis; auto values excluded from quality metrics -->

## Analysis Reference
- Related analysis: `docs/plans/<feature-slug>/analysis.md`
- Selected approach inherited:
  - ...
- Key reasoning used:
  - ...

## Selected Approach Summary
- What was chosen:
  - ...
- Why planning is not reopening option selection:
  - ...

## Fact-Find Support
- Supporting brief: `docs/plans/<feature-slug>/fact-find.md`
- Evidence carried forward:
  - ...

## Plan Gates
- Foundation Gate: <Pass | Fail>
- Sequenced: <Yes | No>
- Edge-case review complete: <Yes | No>
- Auto-build eligible: <Yes | No>

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ... | 85% | M | Pending | - | TASK-02 |

## Engineering Coverage
<!-- Required for Execution-Track: code | mixed. For business-artifact work, omit or write `None: not a code-bearing change`. Use the canonical row labels from `.claude/skills/_shared/engineering-coverage-matrix.md`. -->
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | ... | TASK-XX | ... |
| UX / states | ... | TASK-XX | ... |
| Security / privacy | ... | TASK-XX | ... |
| Logging / observability / audit | ... | TASK-XX | ... |
| Testing / validation | ... | TASK-XX | ... |
| Data / contracts | ... | TASK-XX | ... |
| Performance / reliability | ... | TASK-XX | ... |
| Rollout / rollback | ... | TASK-XX | ... |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | ... |

## Delivered Processes

<!--
NON-OMITTABLE SECTION. If the plan does not change any multi-step process, workflow,
lifecycle state, CI/deploy/release lane, approval path, or operator runbook, write:
`None: no material process topology change`.
-->

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

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

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: ... | Yes / Partial / No | None — or: [Category] [Severity]: description | Yes / No |

## Overall-confidence Calculation
- S=1, M=2, L=3
- Overall-confidence = sum(task confidence * effort weight) / sum(effort weight)

## Section Omission Rule

If a section is not relevant, either omit it or write:
- `None: <reason>`

**Exception — non-omittable sections:**
- `## Delivered Processes` — MUST be present. If there is no material process topology change, use:
  `None: no material process topology change`.
