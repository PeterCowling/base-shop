# Analysis Lens

Required checks:
- Frontmatter fields:
  - `Type`, `Status`, `Domain`, `Workstream`, `Created`, `Last-updated`, `Feature-Slug`, `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`, `Supporting-Skills`, `Related-Fact-Find`, `Related-Plan`
- Sections present and substantive:
  - Decision Frame
  - Inherited Outcome Contract
  - Evaluation Criteria
  - Options Considered
  - Engineering Coverage Comparison for code/mixed
  - Chosen Approach
  - End-State Operating Model (or explicit `None: no material process topology change`)
  - Planning Handoff
  - Risks to Carry Forward
  - Planning Readiness

Analysis minimum bar:
- At least 2 viable options compared, or one viable option with explicit elimination rationale for others
- Recommendation is decisive, not hedged
- Rejected options are materially different, not strawmen
- For process-affecting work, the delivered operating model is explicit enough that planning does not need to reverse-engineer the end state
- Planning handoff gives enough detail for `/lp-do-plan` to decompose without redoing option selection
- For code/mixed work, option comparison includes engineering coverage implications rather than only implementation speed
- Open questions are operator-only, not agent-resolvable

Analysis anti-patterns:
- Decision already made but no comparison shown
- Comparison table present but no explicit criteria
- Recommendation that says "either could work"
- Handoff notes that are actually task decomposition
