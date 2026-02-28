---
Type: Fact-Find
Outcome: Planning
Status: <Draft | Ready-for-planning | Needs-input>
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Workstream: <Engineering | Product | Marketing | Sales | Operations | Finance | Mixed>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Execution-Track: <code | business-artifact | mixed>
Deliverable-Family: <code-change | message | doc | spreadsheet | multi>
Deliverable-Channel: <none | email | whatsapp>
Deliverable-Subtype: <none | product-brief | marketing-asset>
Deliverable-Type: <code-change | email-message | whatsapp-message | product-brief | marketing-asset | spreadsheet | multi-deliverable>
Startup-Deliverable-Alias: <none | startup-budget-envelope | startup-channel-plan | startup-demand-test-protocol | startup-supply-timeline | startup-weekly-kpcs-memo | website-first-build-backlog | website-upgrade-backlog>
Primary-Execution-Skill: <lp-do-build | draft-email | biz-product-brief | draft-marketing | biz-spreadsheet | draft-whatsapp>
Supporting-Skills: <comma-separated or none>
Related-Plan: docs/plans/<feature-slug>/plan.md
Trigger-Why: <leave blank for dispatch-routed — populated from FactFindInvocationPayload.why; fill here for direct-inject path to supply the outcome contract source>
Trigger-Intended-Outcome: <leave blank for dispatch-routed — populated from FactFindInvocationPayload.intended_outcome; fill here for direct-inject path; format: "type: measurable|operational | statement: <text> | source: operator|auto">
---

# <Feature Name> Fact-Find Brief

## Scope
### Summary
<What change is being considered and why>

### Goals
- ...

### Non-goals
- ...

### Constraints & Assumptions
- Constraints:
  - ...
- Assumptions:
  - ...

## Outcome Contract

<!--
NON-OMITTABLE SECTION. This section cannot be skipped even if values are unknown.
Minimum payload: Why: TBD and Source: auto if operator has not confirmed values.

Propagation rules:
- dispatch-routed path: populate Why and Intended Outcome from FactFindInvocationPayload
  (which carries values from the dispatch.v2 packet via routeDispatchV2).
- direct-inject path: read Trigger-Why and Trigger-Intended-Outcome from frontmatter above;
  if both are present and non-empty, Source is "operator"; otherwise default to TBD / auto.
- Legacy fact-finds (no Outcome Contract section): treated as Source: auto / Why: TBD downstream.

Do not fabricate values. If the operator has not confirmed why this work is happening,
use Why: TBD and Source: auto — these are excluded from quality metrics.
-->

- **Why:** <operator-authored explanation of why this work is happening now — e.g. "Channel mix shifted toward DTC; we need to validate sell-pack guidance impact on hostel ROI". Use TBD if unknown.>
- **Intended Outcome Type:** <measurable | operational>
- **Intended Outcome Statement:** <non-empty statement; for measurable: include metric + target + timeframe; for operational: describe process/doc deliverable; use TBD placeholder if unknown>
- **Source:** <operator | auto> <!-- "operator" = confirmed by operator at Option B; "auto" = auto-generated fallback, excluded from quality metrics -->

## Evidence Audit (Current State)
### Entry Points
- `path/to/entry` - <role>

### Key Modules / Files
- `path/to/file` - <notes>

### Patterns & Conventions Observed
- <pattern> - evidence: `path/to/file`

### Data & Contracts
- Types/schemas/events:
  - ...
- Persistence:
  - ...
- API/contracts:
  - ...

### Dependency & Impact Map
- Upstream dependencies:
  - ...
- Downstream dependents:
  - ...
- Likely blast radius:
  - ...

### Delivery & Channel Landscape
- Audience/recipient:
  - ...
- Channel constraints:
  - ...
- Existing templates/assets:
  - ...
- Approvals/owners:
  - ...
- Compliance constraints:
  - ...
- Measurement hooks:
  - ...

### Website Upgrade Inputs
- Existing site baseline:
  - ...
- Platform capability baseline:
  - ...
- Business upgrade brief:
  - ...
- Reference sites:
  - ...

### Best-Of Synthesis Matrix
| Pattern | Source reference | User value | Commercial impact | Platform fit | Effort | Risk | Classification | Rationale |
|---|---|---:|---:|---:|---:|---:|---|---|
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

### Prioritized Website Upgrade Backlog Candidates
| Priority | Item | Why now | Acceptance criteria | Dependencies | Evidence refs |
|---|---|---|---|---|---|
| P1 | ... | ... | ... | ... | ... |

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | ... | ... | ... | ... |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | ... | ... | ... |

#### Falsifiability Assessment
- Easy to test:
  - ...
- Hard to test:
  - ...
- Validation seams needed:
  - ...

#### Recommended Validation Approach
- Quick probes:
  - ...
- Structured tests:
  - ...
- Deferred validation:
  - ...

### Test Landscape
#### Test Infrastructure
- Frameworks:
- Commands:
- CI integration:

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| ... | ... | ... | ... |

#### Coverage Gaps
- Untested paths:
  - ...
- Extinct tests:
  - ...

#### Testability Assessment
- Easy to test:
  - ...
- Hard to test:
  - ...
- Test seams needed:
  - ...

#### Recommended Test Approach
- Unit tests for:
- Integration tests for:
- E2E tests for:
- Contract tests for:

### Recent Git History (Targeted)
- `path/to/area/*` - <what changed + implications>

## External Research (If Needed)
- Finding: <summary> - <source>

## Questions
### Resolved
- Q: ...
  - A: ...
  - Evidence: `...`

### Open (Operator Input Required)
Only questions that cannot be answered without knowledge the operator holds that is not documented anywhere — undocumented budget, personal preference, real-world state the agent cannot determine. Any question answerable by reasoning about effectiveness, efficiency, and documented business requirements must be answered by the agent and placed in Resolved above. Leaving an answerable question here is a Major defect.
- Q: ...
  - Why operator input is required (not agent-resolvable): ...
  - Decision impacted: ...
  - Decision owner: <name or role>
  - Default assumption (if any) + risk: ...

## Confidence Inputs
- Implementation: <0-100>%
- Approach: <0-100>%
- Impact: <0-100>%
- Delivery-Readiness: <0-100>%
- Testability: <0-100>%

For each score, include evidence basis and what would raise it to >=80 and >=90.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| ... | ... | ... | ... |

## Planning Constraints & Notes
- Must-follow patterns:
  - ...
- Rollout/rollback expectations:
  - ...
- Observability expectations:
  - ...

## Suggested Task Seeds (Non-binding)
- ...

## Execution Routing Packet
- Primary execution skill:
  - ...
- Supporting skills:
  - ...
- Deliverable acceptance package:
  - ...
- Post-delivery measurement plan:
  - ...

## Evidence Gap Review
### Gaps Addressed
- ...

### Confidence Adjustments
- ...

### Remaining Assumptions
- ...

## Planning Readiness
- Status: <Ready-for-planning | Needs-input>
- Blocking items:
  - ...
- Recommended next step:
  - `/lp-do-plan` or answer blocking questions

## Section Omission Rule

If a section has no evidence for this run, either:
- omit it, or
- keep one line: `Not investigated: <reason>`

**Exception — non-omittable sections:**
- `## Outcome Contract` — MUST be present. If operator has not confirmed values, use:
  `Why: TBD` and `Source: auto`. Do not omit even for legacy or infrastructure-only fact-finds.
