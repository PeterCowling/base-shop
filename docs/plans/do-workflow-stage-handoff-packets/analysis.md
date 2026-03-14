---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-stage-handoff-packets
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Fact-Find: docs/plans/do-workflow-stage-handoff-packets/fact-find.md
Related-Plan: docs/plans/do-workflow-stage-handoff-packets/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Stage Handoff Packets Analysis

## Decision Frame
### Summary
Choose the right way to bound cross-stage context in the DO workflow now that telemetry shows repeated upstream carryover is the dominant token cost.

### Goals
- reduce cross-stage context volume with deterministic artifacts,
- keep packet semantics centralized,
- preserve end-to-end engineering coverage and task selection fidelity.

### Non-goals
- forcing a full workflow-runtime reset mechanism in this change,
- replacing `plan.md` task blocks with JSON execution contracts,
- adding a second competing handoff format.

### Constraints & Assumptions
- Constraints:
  - build still needs access to the full plan task block before it executes or edits a task,
  - the packet should not become a shadow artifact with its own free-form prose,
  - the workflow contract must stay simple enough for agents to follow.
- Assumptions:
  - a compact packet plus packet-first skill instructions is enough to materially improve progressive disclosure now,
  - telemetry can prove whether the packet paths are actually being used.

## Inherited Outcome Contract
- **Why:** The workflow now measures real token usage and shows that repeated stage-shell and thread carryover dominate cost, especially between analysis and plan.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add deterministic stage handoff packets so downstream DO stages can load bounded structured sidecars first, escalate to full upstream markdown only when needed, and preserve engineering coverage expectations across the whole workflow.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/do-workflow-stage-handoff-packets/fact-find.md`
- Key findings used:
  - the current workflow has no canonical bounded sidecar,
  - `skill-runner` already has deterministic markdown parsers,
  - build can consume a packet first but still needs the task block on demand.

## Evaluation Criteria
| Criterion | Why it matters | Weight |
|---|---|---|
| Determinism | token-saving artifacts must not become a second source of interpretation | High |
| Progressive disclosure quality | downstream stages should load less by default | High |
| Contract clarity | packet semantics should live in one place | High |
| Build fidelity | build must still identify runnable tasks and task scope cleanly | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Keep markdown-only artifacts and tighten skill prose about “load less” | low implementation cost | relies on agent discipline, not a deterministic artifact | drift and inconsistent token savings | No |
| B | Add canonical deterministic packet sidecars plus packet-first load order in the workflow docs and skills | bounded context artifact with one contract and measurable use in telemetry | adds a new sidecar file family | packet content must stay compact and source-derived | Yes |
| C | Build a full runtime session-handoff system first | attacks hidden thread carryover directly | much larger surface and higher uncertainty | over-scoped for the measured next step | No |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | agents still decide ad hoc what to load | one explicit packet-first load order | prefer explicit packet-first load order |
| Security / privacy | no new artifact | new sidecars, but source-derived only | sidecars acceptable if source-derived |
| Logging / observability / audit | telemetry keeps pointing at large markdown artifacts | telemetry can record packet paths directly | telemetry alignment favors packets |
| Testing / validation | nothing new to validate | generator and real packet outputs can be validated deterministically | bounded validation burden is acceptable |
| Data / contracts | no new contract | one canonical sidecar contract | contract clarity favors packets |
| Performance / reliability | token efficiency remains mostly policy-driven | packet size and fields can be bounded deterministically | packet approach is more reliable |
| Rollout / rollback | no change | additive sidecars with markdown fallback | additive rollout is safe |

## Chosen Approach
- **Recommendation:** add canonical deterministic packet sidecars for `fact-find`, `analysis`, and `plan`; generate them after validators pass; and make packet-first loading the default rule for downstream DO stages.
- **Why this wins:** it lifts the bounded summary work into code, keeps the semantics centralized in one contract, and gives the telemetry system a concrete smaller artifact to measure instead of relying on stage-shell discipline alone.
- **What it depends on:** a deterministic generator in `packages/skill-runner`, one canonical contract doc, and coordinated updates to the workflow guide and DO stage skills.

### Rejected Approaches
- docs-only “be more careful with context” guidance — rejected because it does not mechanize the repeated workload.
- full runtime handoff/session reset system first — rejected because it is the larger follow-on optimization, not the best immediate move.

### Open Questions (Operator Input Required)
None.

## Planning Handoff
- Planning focus:
  - implement a deterministic generator and CLI wrapper,
  - bind packet generation and packet-first loading into the core workflow docs and skills,
  - prove the flow with a persisted feature slug and real packet files.
- Validation implications:
  - `@acme/skill-runner` typecheck and lint,
  - fact-find / engineering coverage / plan validators for the new slug,
  - packet generation commands must produce stable sidecars for the new artifacts.
- Sequencing constraints:
  - generator before skill wiring,
  - contract before skill references,
  - persisted packet outputs before telemetry summary and build record.
- Risks to carry into planning:
  - build must not be documented as packet-only,
  - packet field scope must stay bounded enough to save tokens while still surfacing runnable tasks.

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Packet bloat weakens the token-saving goal | Medium | High | exact field shape is an implementation detail | keep packet fields compact and deterministic |
| Build packet-first wording hides the need for full task-block escalation | Medium | Medium | requires task-level planning/build wording | state packet-first, not packet-only |
| Sidecar contract drifts from skill instructions | Medium | High | needs documentation refactor in planning/build | keep the contract canonical and skill text referential |

## Planning Readiness
- Status: Go
- Rationale: one viable bounded approach is clearly better than the alternatives and is ready for task decomposition.

