# Fact-Find Lens

Required checks:
- Frontmatter fields:
  - `Type`, `Outcome`, `Status`, `Domain`, `Workstream`, `Created`, `Last-updated`, `Feature-Slug`, `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Supporting-Skills`, `Related-Plan`
- Sections present and substantive:
  - Scope (summary/goals/non-goals)
  - Evidence Audit
  - Confidence Inputs
  - Risks (specific to the work, not generic)
  - Planning Readiness
  - Test Landscape for code/mixed
  - Delivery and Channel Landscape for business-artifact/mixed
  - Hypothesis & Validation Landscape for business-artifact/mixed (key hypotheses, existing signal coverage, falsifiability assessment, recommended validation approach) — this feeds `/lp-do-plan`'s Business VC Quality Checklist. Missing on a business-artifact/mixed brief is Major (downstream VCs will lack grounding).

Fact-Find confidence dimensions:
- The lp-do-fact-find skill defines **5 dimensions**: Implementation, Approach, Impact, Delivery-Readiness, Testability.
- Do NOT penalize lp-do-fact-finds for having 5 dimensions instead of 3. The 3-dimension model (Implementation/Approach/Impact) applies to plan tasks, not lp-do-fact-find briefs.

Fact-Find `Related-Plan` field:
- `Related-Plan` is a **forward pointer** to the plan that will be created by `/lp-do-plan`.
- It is normal and expected for this file to not exist at lp-do-fact-find time.
- Do NOT flag a non-existent `Related-Plan` target as an issue.

Open questions checks:
- Each open question should include `Decision owner` (name or role). Missing decision owner is Moderate, not Critical.
- **Agent-resolvable deferral** (Major): any question in Open that the agent could have answered by reasoning about available evidence, effectiveness, efficiency, or documented business requirements. The question should appear in Resolved with a reasoned answer — not deferred to the operator. Flag the specific question and state what evidence or reasoning would have resolved it. This is a Major defect because it blocks the pipeline unnecessarily and signals the agent abdicated its core function.

Fact-Find minimum bar:
- Falsifiable goals
- Evidence trail for major factual claims
- Confidence justifications tied to evidence
- At least one specific risk identified
- No Ready-for-planning with untested load-bearing assumptions
