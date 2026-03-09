---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: lp-do-ideas-structured-operator-intake
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-ideas-structured-operator-intake/plan.md
Trigger-Why: Operator intake currently burns 2-4k tokens per idea because lp-do-ideas relies on free-form inference to decide which follow-up questions to ask and which evidence fields to capture.
Trigger-Intended-Outcome: type: operational | statement: lp-do-ideas uses a structured five-question pre-router intake for operator ideas, captures evidence through fixed prompts, and preserves the existing routing judgment path. | source: operator
---

# lp-do-ideas Structured Operator Intake Fact-Find Brief

## Scope
### Summary
`/lp-do-ideas` currently handles `operator_idea` intake through free-text interpretation in the skill contract. The medium-fix target is to replace the free-form Step 3 intake with a structured pre-router questionnaire and deterministic field-assembly rules, while leaving Step 4 routing intelligence unchanged.

### Goals
- Replace free-form `operator_idea` context gathering with five fixed structured questions.
- Add conditional evidence prompts so incident, deadline, leakage, risk, and metric fields are captured intentionally rather than inferred opportunistically.
- Preserve existing routing judgment and downstream dispatch contracts.

### Non-goals
- Replacing the `fact_find_ready` versus `briefing_ready` versus `logged_no_action` judgment with keywords or hard automation.
- Changing `artifact_delta` routing in the TypeScript orchestrator.
- Changing queue schemas, classifier rules, or live-mode policy.

### Constraints & Assumptions
- Constraints:
  - `lp-do-ideas` intake behavior is primarily encoded in `.claude/skills/lp-do-ideas/SKILL.md`; changes must preserve the existing dispatch contract.
  - `operator_idea` packets still need non-binary fields such as `area_anchor`, `domain`, and evidence references.
  - The routing adapter remains fail-closed on missing packet fields.
- Assumptions:
  - A structured intake module is sufficient for this cycle; no TypeScript runtime feature is required because the conversational intake path is skill-defined.
  - A five-question core plus conditional evidence prompts is enough to cut most free-form context gathering without degrading route quality.

## Outcome Contract
- **Why:** Operator intake currently burns 2-4k tokens per idea because lp-do-ideas relies on free-form inference to decide which follow-up questions to ask and which evidence fields to capture.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** lp-do-ideas uses a structured five-question pre-router intake for operator ideas, captures evidence through fixed prompts, and preserves the existing routing judgment path.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/lp-do-ideas/SKILL.md` - authoritative operator-intake and routing contract.
- `docs/analysis/lp-do-ideas-build-llm-deterministic-classification.md` - prior analysis of which intake phases are templatable versus judgment-bound.

### Key Modules / Files
- `.claude/skills/lp-do-ideas/SKILL.md` - free-text operator intake, routing intelligence, evidence-field guidance.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` - fail-closed packet validation and downstream route payload construction.
- `scripts/src/startup-loop/ideas/lp-do-ideas-classifier.ts` - downstream evidence-aware classification fields and tier logic.
- `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` - deterministic routing for `artifact_delta`, not for conversational `operator_idea` intake.
- `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` - packet field expectations and route mapping coverage.

### Patterns & Conventions Observed
- Conversational intake rules live in the skill file; TypeScript begins after a dispatch packet already exists.
- `operator_idea` routing intentionally avoids hard keyword lists and keeps materiality/admin-suppression as judgment calls.
- Packet validation is strict about `area_anchor`, `evidence_refs`, and route/status consistency.

### Data & Contracts
- Types/schemas/events:
  - `dispatch.v2` requires `area_anchor`, `recommended_route`, `status`, and `evidence_refs`.
  - Classifier evidence fields include `incident_id`, `deadline_date`, `risk_vector`, `risk_ref`, `failure_metric`, `baseline_value`, `funnel_step`, and `metric_name`.
- Persistence:
  - Trial queue file: `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- API/contracts:
  - `routeDispatch()` rejects incomplete packets and non-routable states.

### Dependency & Impact Map
- Upstream dependencies:
  - Operator invokes `/lp-do-ideas` with no args or free text.
  - Skill must determine trigger type before structured operator questioning begins.
- Downstream dependents:
  - `lp-do-fact-find`, `lp-do-build`, and `lp-do-briefing` consume routed packets after adapter validation.
  - `lp-do-ideas-classifier.ts` benefits from cleaner evidence capture but does not control intake.
- Likely blast radius:
  - Narrow. Main change is skill-level intake instructions plus any helper module added under `.claude/skills/lp-do-ideas/`.

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest in `scripts/src/startup-loop/__tests__/`
- Commands: targeted `pnpm --filter scripts typecheck` / `pnpm --filter scripts lint` are available for script changes; not inherently useful for skill-only instruction edits.
- CI integration: governed by repo-wide CI; local test execution is policy-restricted.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Packet validation | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` | Confirms required fields and route/status mapping |
| Artifact-delta routing | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial.test.ts` | Covers deterministic packet generation for artifact deltas |

#### Coverage Gaps
- Untested paths:
  - No automated tests assert the skill-level `operator_idea` intake questionnaire because it is instruction-driven.
- Extinct tests:
  - None investigated.

### Recent Git History (Targeted)
- Not investigated: current worktree is heavily dirty and this change is intentionally scoped away from unrelated in-flight edits.

## Questions
### Resolved
- Q: Should the medium fix replace routing judgment?
  - A: No. Existing repo analysis identifies route decision and admin suppression as genuinely judgment-heavy and not safe to hard-template away in this cycle.
  - Evidence: `docs/analysis/lp-do-ideas-build-llm-deterministic-classification.md`

- Q: Should this be implemented in TypeScript runtime code?
  - A: No for this cycle. The conversational intake path is encoded in the skill contract, while TypeScript only validates and persists already-formed packets.
  - Evidence: `.claude/skills/lp-do-ideas/SKILL.md`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`

- Q: Can the intake be only yes/no questions?
  - A: No. `area_anchor` and domain selection require short structured text or enum answers; pure binary prompts cannot satisfy the current packet contract.
  - Evidence: `.claude/skills/lp-do-ideas/SKILL.md`, `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`

### Open (Operator Input Required)
None: the implementation scope is narrow and the medium-fix boundary is already explicit.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Skill-defined intake flow | Yes | None | No |
| Downstream dispatch contract | Yes | None | No |
| Evidence-field compatibility | Yes | None | No |
| Runtime/code integration need | Yes | None | No |

## Scope Signal
- Signal: right-sized
- Rationale: the change is limited to the `operator_idea` intake contract, does not alter routing semantics, and can be implemented additively with low blast radius.

## Evidence Gap Review
### Gaps Addressed
- Confirmed that the structured-intake opportunity is already documented in repo analysis and separated from the previously completed build-completion deterministic work.
- Confirmed that downstream validation and classifier files already accept the evidence fields the new questionnaire should collect.

### Confidence Adjustments
- Implementation confidence increased because the change lands in one authoritative skill file plus an optional helper module.
- Impact confidence remains below 90 because operator-idea route quality is still untested against a real archived corpus in this cycle.

### Remaining Assumptions
- Agents following the updated skill will consistently use the structured module instead of reverting to free-form inference.
- Examples included in the skill/module are sufficient to keep `area_anchor` formatting stable.

## Confidence Inputs
- Implementation: 88%
  - Basis: bounded file set; no runtime schema change.
  - To reach >=90: add a reusable helper module with explicit field-assembly rules and examples.
- Approach: 84%
  - Basis: aligns with prior analysis that Step 3 is templatable but Step 4 is not.
  - To reach >=90: shadow-run the questionnaire against a small archived idea set.
- Impact: 78%
  - Basis: likely token reduction and better evidence capture are well-motivated but not measured in this cycle.
  - To reach >=80: document a post-change measurement plan for token and evidence completeness.
- Delivery-Readiness: 90%
  - Basis: no operator input blocker and low code risk.
- Testability: 62%
  - Basis: skill instructions are hard to automate directly.
  - To reach >=80: add a manual walkthrough checklist in the module and checkpoint it in the plan.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Questionnaire is too rigid for multi-gap ideas | Medium | Medium | Keep decomposition rule explicit before packet assembly |
| Agents ignore the structured flow and keep inferring | Medium | Medium | Move rules into a dedicated module and make the skill reference it directly |
| Route quality regresses because intake becomes too terse | Low | High | Preserve Step 4 routing judgment and do not hard-template route choice |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep `operator_idea` route decision in Step 4.
  - Preserve existing dispatch packet field names and enums.
- Rollout/rollback expectations:
  - Rollout is additive and instruction-first.
  - Rollback is removal of the module reference and structured prompts.
- Observability expectations:
  - No code telemetry in this cycle; observability is through documented examples and future operator usage.

## Suggested Task Seeds (Non-binding)
- TASK-01: Add a structured operator-intake module and wire `lp-do-ideas` Step 3 to use it.
- TASK-02: Checkpoint the new intake against current packet field requirements and representative examples.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - none
- Deliverable acceptance package:
  - updated `lp-do-ideas` skill instructions, structured intake module, completed plan evidence
- Post-delivery measurement plan:
  - compare intake token usage and evidence completeness on the next operator-idea packets
