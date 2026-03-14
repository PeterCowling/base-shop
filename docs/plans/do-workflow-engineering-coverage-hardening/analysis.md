---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-engineering-coverage-hardening
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Fact-Find: docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md
Related-Plan: docs/plans/do-workflow-engineering-coverage-hardening/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Engineering Coverage Hardening Analysis

## Decision Frame
### Summary
Choose how to improve token efficiency and engineering-coverage completeness in the DO workflow without exploding process surface area or duplicating doctrine.

### Goals
- Reduce repeated fixed workflow prose.
- Make code/mixed coverage expectations explicit from fact-find through build.
- Keep the ideas stage lightweight.

### Non-goals
- Prompt-level telemetry instrumentation.
- Queue schema redesign.

### Constraints & Assumptions
- Constraints:
  - Existing DO stages and templates must remain recognizable.
  - Deterministic logic should live in `packages/skill-runner`.
- Assumptions:
  - A shared contract can replace repeated row lists without reducing rigor.

## Inherited Outcome Contract
- **Why:** The DO workflow still spends tokens on repeated fixed rules and does not consistently force code-bearing work to cover UX, security, observability, testing, contracts, reliability, and rollout concerns end to end.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce one shared engineering coverage contract plus deterministic validation, and wire it through the `lp-do-ideas -> lp-do-build` workflow.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/do-workflow-engineering-coverage-hardening/fact-find.md`
- Key findings used:
  - the deterministic runner already exists and should be reused
  - current workflow coverage is front-end-heavy and back-loaded
  - the ideas stage should remain hint-level, not a full engineering interview

## Evaluation Criteria
| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Token efficiency | Repeated fixed prose should become one shared contract plus executable checks. | High |
| Workflow completeness | Code-bearing work should cover the full engineering matrix, not just UI/tests. | High |
| Surface-area control | The solution should not require queue schema churn or large new subsystems. | High |
| Deterministic enforceability | The critical contract should be machine-checkable. | High |

## Options Considered
| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Shared engineering coverage contract + deterministic validator + template/skill wiring | One source of truth, executable, thin-skill friendly | Requires touching many workflow docs/files | manageable docs churn | Yes |
| B | Docs-only reinforcement in each skill/template | Low code cost | Keeps token tax, no deterministic enforcement | drift and omission remain | Yes |
| C | Validator-only change with no shared contract | Enforceable | Still leaves repeated prose and unclear canonical row labels | contract ambiguity | Yes |

## Engineering Coverage Comparison
| Coverage Area | Option A | Option B | Chosen implication |
|---|---|---|---|
| UI / visual | Preserved in shared matrix | Still duplicated in plan/build docs | Keep, but normalize |
| UX / states | Explicit from fact-find onward | Mostly late-stage | Move earlier |
| Security / privacy | Explicit and reusable | Repeated/partial | Normalize |
| Logging / observability / audit | Elevated to first-class row | Still easy to miss | Major improvement |
| Testing / validation | Explicit across stages | Strong only late | Normalize |
| Data / contracts | Preserved and normalized | Remains scattered | Normalize |
| Performance / reliability | Promoted beyond one fact-find slice | Still inconsistent | Normalize |
| Rollout / rollback | Elevated from task tail field to shared row | Remains easy to under-specify | Normalize |

## Chosen Approach
- **Recommendation:** Option A.
- **Why this wins:** It is the only option that improves token efficiency and coverage completeness at the same time. A shared contract removes repeated prose, and the validator makes omission detectable.
- **What it depends on:** a stable shared row set, a validator in `packages/skill-runner`, and template/skill updates that adopt the row set verbatim.

### Rejected Approaches
- Option B — cheaper in the moment, but it leaves the workflow paying token cost on every run and provides no enforcement.
- Option C — better than docs-only, but still leaves canonical row labels and stage expectations fragmented.

### Open Questions (Operator Input Required)
- None.

## Planning Handoff
- Planning focus:
  - shared contract
  - deterministic validator
  - workflow/template wiring
  - build-record/frontmatter alignment
- Validation implications:
  - run `validate-fact-find.sh`, `validate-plan.sh`, and the new `validate-engineering-coverage.sh`
  - run package typecheck/lint on `@acme/skill-runner`
- Sequencing constraints:
  - add the shared contract first
  - add validator second
  - wire skills/templates after the contract and validator exist
- Risks to carry into planning:
  - avoid making `lp-do-ideas` heavy
  - avoid introducing another duplicated contract surface

## Risks to Carry Forward
| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Shared row labels drift from templates | Low | High | Requires implementation discipline | Update templates and validator in same task |
| Coverage contract becomes bureaucratic | Medium | Medium | Needs task-level formatting choices | Keep the block compact and allow `N/A: reason` |
| Missing build-record track metadata weakens later proof | Medium | Medium | Needs artifact change | Add `Execution-Track` to build-record template/contract |

## Planning Readiness
- Status: Go
- Rationale: The chosen approach is decisive, bounded, and directly implementable with current repo primitives.
