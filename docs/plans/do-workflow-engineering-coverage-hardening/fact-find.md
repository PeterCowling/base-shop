---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: Repo / Agents
Workstream: Engineering
Created: "2026-03-11"
Last-updated: "2026-03-11"
Feature-Slug: do-workflow-engineering-coverage-hardening
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build, lp-do-critique
Related-Analysis: docs/plans/do-workflow-engineering-coverage-hardening/analysis.md
Trigger-Why: The DO workflow still spends tokens on repeated fixed rules and does not consistently force code-bearing work to cover UX, security, observability, testing, contracts, reliability, and rollout concerns end to end.
Trigger-Intended-Outcome: "type: operational | statement: Introduce one shared engineering coverage contract plus deterministic validation, and wire it through the lp-do-ideas -> lp-do-build workflow. | source: operator"
---

# DO Workflow Engineering Coverage Hardening Fact-Find Brief

## Scope
### Summary
Harden the `lp-do-ideas -> lp-do-build` workflow in two ways: reduce repeated token-taxed prose by lifting fixed engineering coverage doctrine into a shared contract plus deterministic validator, and reinforce end-to-end treatment of code-bearing concerns beyond frontend-only checks.

### Goals
- Introduce one shared engineering coverage contract used across DO workflow stages.
- Add deterministic validation for engineering coverage on code/mixed workflow artifacts.
- Wire the contract into ideas, fact-find, analysis, plan, build, critique, and canonical templates.

### Non-goals
- Redesign the live `lp-do-ideas` queue schema.
- Add full prompt/token telemetry instrumentation in this cycle.
- Change non-DO startup-loop stages.

### Constraints & Assumptions
- Constraints:
  - The live ideas queue and self-evolving files are already dirty in this checkout, so this cycle should avoid hand-editing them without a dedicated queue-safe operator path.
  - Existing `packages/skill-runner` utilities should be extended rather than duplicated.
  - The change must stay compatible with the current `fact-find -> analysis -> plan -> build` flow.
- Assumptions:
  - A shared engineering coverage matrix plus deterministic validator is the highest-leverage first step.
  - Lightweight `coverage-hint:` evidence refs are sufficient for `lp-do-ideas`; hard enforcement can start at fact-find.

## Outcome Contract

- **Why:** The DO workflow still spends tokens on repeated fixed rules and does not consistently force code-bearing work to cover UX, security, observability, testing, contracts, reliability, and rollout concerns end to end.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Introduce one shared engineering coverage contract plus deterministic validation, and wire it through the `lp-do-ideas -> lp-do-build` workflow.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-ideas/SKILL.md` - intake and dispatch routing for operator ideas.
- `.claude/skills/lp-do-fact-find/SKILL.md` - evidence-first discovery and readiness gate.
- `.claude/skills/lp-do-analysis/SKILL.md` - approach selection handoff layer.
- `.claude/skills/lp-do-plan/SKILL.md` - task decomposition and delivery rehearsal.
- `.claude/skills/lp-do-build/SKILL.md` - execution and build-record generation.
- `packages/skill-runner/src/` - existing deterministic workflow helpers.

### Key Modules / Files
- `packages/skill-runner/src/confidence-thresholds.ts` - deterministic confidence/build gate logic already extracted.
- `packages/skill-runner/src/validate-plan.ts` - deterministic plan frontmatter validator already extracted.
- `packages/skill-runner/src/validate-fact-find.ts` - deterministic fact-find gate, but stale to the pre-analysis status wording.
- `.claude/skills/lp-do-build/modules/build-validate.md` - build validation rules; currently strong on UI walkthroughs, weaker on generic engineering-coverage proof.
- `docs/plans/_templates/*.md` - canonical artifact/task templates; currently no shared engineering coverage section.

### Patterns & Conventions Observed
- Deterministic workflow logic already belongs in `packages/skill-runner`, with shell wrappers in `scripts/`.
- `lp-do-analysis` is already a thinner orchestrator than the rest of the hot path.
- UI/UX/security expectations are more explicit in planning/build than observability, reliability, and rollout expectations.

### Data & Contracts
- Existing deterministic validators:
  - `scripts/validate-plan.sh`
  - `scripts/validate-fact-find.sh`
  - `scripts/validate-build-eligibility.sh`
- Missing deterministic contract:
  - no validator currently checks whether code/mixed artifacts or tasks explicitly cover UI, UX states, security/privacy, observability/logging, testing, data/contracts, performance/reliability, and rollout/rollback.

### Dependency & Impact Map
- Upstream dependencies:
  - existing plan/fact-find markdown parser in `packages/skill-runner/src/markdown.ts`
  - workflow templates under `docs/plans/_templates/`
- Downstream dependents:
  - DO workflow skill docs
  - future plan/build artifacts generated from templates
- Likely blast radius:
  - docs-only workflow behavior plus one new validator CLI

### Test Landscape
#### Test Infrastructure
- Frameworks: TypeScript package typecheck/lint
- Commands: `pnpm --filter @acme/skill-runner typecheck`, `pnpm --filter @acme/skill-runner lint`
- CI integration: package lint/typecheck via repo validation

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Skill-runner validators | package lint/typecheck | `packages/skill-runner/src/*` | no dedicated test suite in package yet |

#### Coverage Gaps
- Untested paths:
  - new engineering coverage validator logic
- Extinct tests:
  - None identified

#### Testability Assessment
- Easy to test:
  - markdown-frontmatter-driven validators
- Hard to test:
  - end-to-end skill invocation behavior without running the agents themselves
- Test seams needed:
  - none beyond existing markdown parser helpers

#### Recommended Test Approach
- Unit-style validation through package typecheck/lint now
- add dedicated validator tests in a follow-up if this contract evolves materially

### Recent Git History (Targeted)
- `do-workflow-analysis-stage` artifact set - recent insertion of the analysis stage means deterministic validators and templates must align with `Ready-for-analysis` / `Ready-for-planning`.
- `packages/skill-runner` additions - indicates prior deterministic extraction work is already underway and should be reused.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | Required | Plan/build explicitly cover UI tasks and design QA. | Over-weighted relative to other concerns. | Keep, but rebalance against the full matrix. |
| UX / states | Required | Plan delivery rehearsal checks user-visible flow states. | Not enforced early enough in fact-find/analysis. | Require across fact-find, analysis, plan, build. |
| Security / privacy | Required | Ideas capture risk vectors; plan delivery rehearsal checks auth boundaries. | Coverage is partial and late. | Make it a canonical row across stages. |
| Logging / observability / audit | Required | Mentioned in scattered plans, not in the core DO contract. | Common blind spot; not enforced deterministically. | Add as a canonical row plus validator enforcement. |
| Testing / validation | Required | Strong in plan/build, thinner in ideas/fact-find. | Can arrive too late to shape approach choice. | Carry into every code/mixed artifact. |
| Data / contracts | Required | Fact-find and plan already mention contracts and consumer tracing. | Not framed as part of one shared matrix. | Keep and normalize. |
| Performance / reliability | Required | Fact-find mentions performance boundaries. | Reliability and degraded behavior are not consistently carried forward. | Promote to explicit row. |
| Rollout / rollback | Required | Present in plan task templates, but not as a workflow-wide row. | Often reduced to a tail field rather than a gating concern. | Make explicit in analysis, plan, and build evidence. |

## Questions
### Resolved
- Q: Should this be solved by more prose in each skill?
  - A: No. The better path is one shared contract plus one deterministic validator, then thin skill references to both.
  - Evidence: `packages/skill-runner/src/*.ts`, `docs/plans/_templates/*.md`
- Q: Should the live ideas queue schema be expanded in this cycle?
  - A: No. A lightweight `coverage-hint:` convention in `evidence_refs` is sufficient for the ideas stage without broad queue churn.
  - Evidence: `.claude/skills/lp-do-ideas/modules/operator-idea-structured-intake.md`

### Open (Operator Input Required)
- None.

## Confidence Inputs
- Implementation: 90%
  - Evidence basis: existing `skill-runner` and templates make the change bounded.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met.
- Approach: 92%
  - Evidence basis: shared contract + validator is cleaner than duplicating prose across skills.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met.
- Impact: 84%
  - Evidence basis: touches the full DO path and future artifacts, but does not yet add prompt-level telemetry.
  - What raises this to >=80: already met.
  - What raises this to >=90: add invocation-level token metrics in a follow-up cycle.
- Delivery-Readiness: 88%
  - Evidence basis: repo-local docs/code changes only.
  - What raises this to >=80: already met.
  - What raises this to >=90: validate with a real future plan generated from the new templates.
- Testability: 82%
  - Evidence basis: validator logic is deterministic and lint/typecheck-friendly.
  - What raises this to >=80: already met.
  - What raises this to >=90: add dedicated tests for validator edge cases.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Over-specifying engineering coverage turns planning into boilerplate | Medium | Medium | Keep ideas-stage hints lightweight and centralize the doctrine in one shared file. |
| New validator drifts from templates | Low | High | Use canonical row labels in templates and validator from one shared contract. |
| Workflow docs mention validators without executable support | Low | High | Implement the validator and shell wrapper in the same change. |
| Build-record coverage proof stays non-deterministic because track metadata is missing | Medium | Medium | Add `Execution-Track` to the build-record template and contract. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Extend `packages/skill-runner`; do not invent a second validator location.
  - Keep `lp-do-ideas` thin; avoid queue schema churn.
- Rollout/rollback expectations:
  - No runtime deploy impact; rollback is doc/script revert.
- Observability expectations:
  - This cycle improves workflow observability doctrine, not application runtime telemetry.

## Suggested Task Seeds (Non-binding)
- Introduce the shared engineering coverage contract and update templates.
- Add deterministic coverage validation to `skill-runner` and align stale fact-find validation.
- Wire the contract/validator through ideas, fact-find, analysis, plan, build, critique, and workflow docs.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-ideas`, `lp-do-fact-find`, `lp-do-analysis`, `lp-do-plan`, `lp-do-build`, `lp-do-critique`
- Deliverable acceptance package:
  - validator pass + template wiring + updated workflow docs
- Post-delivery measurement plan:
  - use a future real DO run to confirm the new contract is actually populated and the validator catches omissions

## Evidence Gap Review
### Gaps Addressed
- Confirmed the deterministic runner already exists and is the right home for the new validator.
- Confirmed fact-find validator still needed post-analysis-stage alignment.

### Confidence Adjustments
- Delivery-Readiness raised after confirming `packages/skill-runner` is already present.

### Remaining Assumptions
- A future cycle should add invocation-level token telemetry; this cycle does not.

## Analysis Readiness
- Status: Ready-for-analysis
- Blocking items:
  - None.
- Recommended next step:
  - `/lp-do-analysis do-workflow-engineering-coverage-hardening`
