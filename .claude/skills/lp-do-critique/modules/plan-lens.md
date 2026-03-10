# Plan Lens

Apply checks in order:
1. Plan-template conformance
2. Repo metadata policy conformance

Plan frontmatter baseline:
- `Type`, `Status`, `Domain`, `Workstream`, `Created`, `Last-updated`, `Feature-Slug`, `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Supporting-Skills`

Repo metadata policy check:
- `Last-reviewed` and `Relates-to charter`
- Missing repo-required metadata is a decision-quality defect unless explicit higher-precedence exemption applies

Confidence-gated markers:
- Task Summary includes `Confidence` column
- One or more tasks include confidence breakdowns (Implementation/Approach/Impact)
- Frontmatter includes `Overall-confidence` or `Confidence-Method`

Confidence metadata rule:
- If confidence-gated markers exist, missing `Overall-confidence` and/or `Confidence-Method` is a decision-quality defect.
- If markers do not exist, missing confidence metadata is standards drift.

Each IMPLEMENT task must include:
- Type, Deliverable, Execution-Skill, Affects, Depends on, Blocks
- Confidence (3 dimensions + evidence)
- Acceptance criteria
- Validation contract (TC-XX or VC-XX)
- Execution plan:
  - Code/mixed: Red -> Green -> Refactor
  - Business-artifact/mixed: VC-first Red -> Green -> Refactor
- Rollout/rollback
- Documentation impact

Business-artifact/mixed VC quality check (apply to each VC-XX):
- Each VC must be **isolated** (tests one variable), **pre-committed** (pass/fail decision stated before data), **time-boxed** (measurement deadline defined), **minimum viable sample** (smallest signal that constitutes evidence), **diagnostic** (failure indicates *why*), **repeatable** (another operator reaches same conclusion), and **observable** (metric is directly measurable).
- Anti-patterns to flag: "Validate demand is sufficient" (not isolated, not pre-committed, not observable), "Check market response" (no sample size, no deadline), "Confirm unit economics work" (conflates multiple variables).
- VCs failing ≥3 quality principles are Major; failing 1-2 is Moderate.

Agent-resolvable deferral checks (apply to every DECISION task and the Proposed Approach section):
- **Agent-resolvable DECISION task** (Major): a DECISION task whose `**Decision input needed:**` questions the agent could have answered by reasoning about available evidence, effectiveness, efficiency, or documented business requirements. The task should have been folded into an IMPLEMENT task with the chosen approach, or the `**Recommendation:**` should have been decisive and `**Decision input needed:**` left empty. Flag the specific question and what reasoning would have resolved it.
- **Weak or deferred recommendation** (Major): a DECISION task where `**Recommendation:**` is a hedge ("either A or B would work", "depends on preference", blank, or TBD). If the agent has enough context to list options, it has enough context to recommend. Flag and require a decisive position.
- **Deferred approach** (Major): `Chosen approach:` in `## Proposed Approach` is blank, TBD, or deferred to a DECISION task that itself fails the self-resolve gate. The agent must choose.

Plan minimum bar:
- Falsifiable objective
- Risk-first dependency order
- Enumerated validation cases
- Confidence tied to evidence
- Explicit risks and mitigations
