---
Type: Analysis
Status: Draft
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Workstream: <Engineering | Product | Marketing | Sales | Operations | Finance | Mixed>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Execution-Track: <code | business-artifact | mixed>
Deliverable-Type: <code-change | email-message | whatsapp-message | product-brief | marketing-asset | spreadsheet | multi-deliverable>
Startup-Deliverable-Alias: <none | startup-budget-envelope | startup-channel-plan | startup-demand-test-protocol | startup-supply-timeline | startup-weekly-kpcs-memo | website-first-build-backlog | website-upgrade-backlog>
Primary-Execution-Skill: <lp-do-build | draft-email | biz-product-brief | draft-marketing | biz-spreadsheet | draft-whatsapp>
Supporting-Skills: <comma-separated or none>
Related-Fact-Find: docs/plans/<feature-slug>/fact-find.md
Related-Plan: docs/plans/<feature-slug>/plan.md
Auto-Plan-Intent: <analysis-only | analysis+auto>
artifact: analysis
---

# <Feature Name> Analysis

## Decision Frame
### Summary
<What decision is being made and why now>

### Goals
- ...

### Non-goals
- ...

### Constraints & Assumptions
- Constraints:
  - ...
- Assumptions:
  - ...

## Inherited Outcome Contract

- **Why:** <carry from fact-find Outcome Contract; use TBD if absent>
- **Intended Outcome Type:** <measurable | operational | TBD>
- **Intended Outcome Statement:** <carry from fact-find; use TBD if absent>
- **Source:** <operator | auto>

## Fact-Find Reference
- Related brief: `docs/plans/<feature-slug>/fact-find.md`
- Key findings used:
  - ...

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| ... | ... | ... |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | ... | ... | ... | ... | Yes |
| B | ... | ... | ... | ... | Yes |

## Engineering Coverage Comparison
<!-- Required for Execution-Track: code | mixed. For business-artifact work, omit or write `None: not a code-bearing change`. Use the canonical row labels from `.claude/skills/_shared/engineering-coverage-matrix.md`. -->
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | ... | ... | ... |
| UX / states | ... | ... | ... |
| Security / privacy | ... | ... | ... |
| Logging / observability / audit | ... | ... | ... |
| Testing / validation | ... | ... | ... |
| Data / contracts | ... | ... | ... |
| Performance / reliability | ... | ... | ... |
| Rollout / rollback | ... | ... | ... |

## Chosen Approach
- **Recommendation:** <decisive recommendation>
- **Why this wins:** ...
- **What it depends on:** ...

### Rejected Approaches
- <option> — <why rejected>

### Open Questions (Operator Input Required)
- Q: ...
  - Why operator input is required: ...
  - Planning impact: ...

## End-State Operating Model

<!--
NON-OMITTABLE SECTION. If the chosen approach does not change any multi-step process,
workflow, lifecycle state, CI/deploy/release lane, approval path, or operator runbook,
write: `None: no material process topology change`.
-->

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

## Planning Handoff
- Planning focus:
  - ...
- Validation implications:
  - ...
- Sequencing constraints:
  - ...
- Risks to carry into planning:
  - ...

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Planning Readiness
- Status: <Go | Needs-input | Infeasible>
- Rationale: ...
