---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Business-OS
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: startup-loop-s10-weekly-orchestration
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, startup-loop, lp-experiment, lp-signal-review, lp-do-fact-find
Related-Plan: docs/plans/startup-loop-s10-weekly-orchestration/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
Relates-to: docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md
---

# Startup Loop S10 Weekly Orchestration — Fact-Find Brief

## Scope
### Summary
Improve S10 with a dedicated weekly orchestrator contract and coordinated weekly flow. This fact-find uses three operator-provided findings as primary hypotheses and tests fit against the active v2 startup-loop plan.

### Goals
- Validate finding 1: use a separate S10 orchestrator name, `/lp-weekly`.
- Validate finding 2: coordinate existing S10 activities in one deterministic weekly sequence.
- Validate finding 3: treat S10 as a composite of three lanes:
  - `a)` weekly audit + continuous improvement
  - `b)` measurement compilation + weekly reporting
  - `c)` experiment design for the next cycle
- Identify concrete gaps in `a/b/c` with evidence pointers.
- Confirm all proposed changes can fit within `docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md` constraints.
- Define success measurements for two-cycle validation:
  - missed Section H checks per cycle,
  - unresolved REM carryover count,
  - new next-experiment specs created per cycle.

### Non-goals
- Changing stage IDs, stage ordering, or gate semantics.
- Replacing the weekly KPCS prompt as S10 decision authority.
- Replacing canonical S10 artifacts in first iteration.
- Implementing code/skill changes in this fact-find (planning only).

### Constraints & Assumptions
- Constraints:
  - S10 decision authority remains `weekly-kpcs-decision-prompt.md`.
  - Stage graph authority remains `docs/business-os/startup-loop/loop-spec.yaml`.
  - Any new orchestrator must preserve existing S10 outputs and compatibility aliases.
- Assumptions:
  - `/lp-weekly` is an orchestration wrapper, not a replacement for `/lp-experiment` internals.
  - Existing S10 artifacts remain canonical unless a migration task is explicitly planned.

## Authority Stack
| Surface | Authority | Non-authority |
|---|---|---|
| `docs/business-os/startup-loop/loop-spec.yaml` | Stage graph, stage mapping, stage ordering constraints | Not weekly memo content authority |
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | Weekly decision content authority (Sections A-H) | Not stage graph authority |
| S10 orchestrator skill (`/lp-weekly`, proposed) | Execution order, preflight checks, packetization, cross-artifact linking | Does not replace prompt authority or stage graph authority |

## Evidence Audit (Current State)
### Entry Points
| Surface | What it controls |
|---|---|
| `.claude/skills/startup-loop/SKILL.md` | Stage-to-skill mapping summary (S10 -> `/lp-experiment`) |
| `docs/business-os/startup-loop/loop-spec.yaml` | Canonical S10 stage contract and prompt template pointer |
| `.claude/skills/startup-loop/modules/cmd-advance.md` | S10 dispatch/gates behavior (`/lp-signal-review`, feedback gap-fill dispatch) |
| `.claude/skills/lp-experiment/SKILL.md` | Experiment lifecycle (design/readout) |
| `.claude/skills/lp-signal-review/SKILL.md` | Weekly signal-strengthening audit flow |
| `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | KPCS memo output format and Section H weekly audit |
| `docs/business-os/startup-loop/audit-cadence-contract-v1.md` | Weekly light-audit + monthly deep-audit rules |
| `docs/business-os/startup-loop-workflow.user.md` | Operator cadence and standing workflow contracts |
| `docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md` | Active v2 scope boundaries and acceptance criteria |

### Key Modules / Files
- `.claude/skills/startup-loop/SKILL.md`
  - S10 currently mapped to `/lp-experiment`.
- `docs/business-os/startup-loop/loop-spec.yaml`
  - S10 skill is `/lp-experiment`; prompt is `weekly-kpcs-decision-prompt.md`.
- `.claude/skills/startup-loop/modules/cmd-advance.md`
  - S10 includes GATE-BD-08 warning.
  - S10 dispatches `/lp-signal-review` weekly.
  - Pre-S10 gate dispatches `/lp-do-fact-find --startup-loop-gap-fill --trigger feedback`.
- `.claude/skills/lp-experiment/SKILL.md`
  - Defines experiment `design` and per-experiment `readout`.
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
  - Defines KPCS output A-G plus Section H weekly audit.
- `docs/business-os/startup-loop/audit-cadence-contract-v1.md`
  - Defines weekly light-audit and monthly deep-audit contracts.

### Patterns & Conventions Observed
- S10 responsibilities are split across prompt contracts and multiple skills.
- Weekly audit execution is prompt-driven, not orchestrator-driven.
- Continuous-improvement findings exist (`/lp-signal-review`, feedback-loop audit), but promotion/closure flow is partly manual.
- Experiment lifecycle exists in `/lp-experiment`, but portfolio-level weekly orchestration is not specified as one contract.

### Data & Contracts
- S10 decision artifact:
  - `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md`
- Signal review artifact:
  - `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`
- Feedback loop audit artifact:
  - `docs/business-os/strategy/<BIZ>/feedback-loop-audit-<YYYY-MM-DD>.md`
- Monthly deep-audit artifact:
  - `docs/business-os/strategy/<BIZ>/<YYYY-MM>-monthly-audit.user.md`
- Weekly audit REM format:
  - `REM-<BIZ>-<YYYYMMDD>-<n>`

### Negative Evidence Method (Absence Claims)
Absence claims in this brief were validated by targeted repository searches:
- No dedicated S10 monthly-deep-audit orchestration dispatch found in startup-loop skill surfaces.
- No normalized weekly measurement packet artifact contract found in S10 contracts.
- No single S10 contract found that requires portfolio-level experiment rollup at weekly close.

Search surfaces:
- `.claude/skills/startup-loop/SKILL.md`
- `.claude/skills/startup-loop/modules/cmd-advance.md`
- `.claude/skills/lp-experiment/SKILL.md`
- `docs/business-os/startup-loop/audit-cadence-contract-v1.md`
- `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`

### Dependency & Impact Map
- Upstream dependencies:
  - KPI snapshot, denominator inputs, experiment outcomes, stage artifacts, exception tickets, CAP contracts.
- Downstream dependents:
  - S10 decision memo, REM backlog, fact-find promotions, replan triggers, next-cycle experiment backlog.
- Likely blast radius:
  - Medium if introducing `/lp-weekly` as wrapper (startup-loop mapping, docs, tests).
  - Low if first implementation is alias/wrapper-only and additive.

## Findings
### Finding 1 — S10 should have a dedicated orchestrator name `/lp-weekly`
Assessment: **Supported**.

Why:
- S10 owns more than experiments (decisioning, audits, reporting, CI handoffs).
- `/lp-experiment` is scoped to experiment design/readout, not full weekly orchestration.

Evidence:
- S10 mapping currently points to `/lp-experiment`.
- Weekly decision authority and Section H audit live outside `/lp-experiment` in prompt/contract docs.

Recommendation:
- `/lp-weekly` should be both:
  - operator-visible command,
  - startup-loop-internal orchestrator entrypoint.

### Finding 2 — Existing S10 activities should be coordinated as one flow
Assessment: **Supported**.

Current fragmentation:
- Weekly decision memo via prompt contract.
- Weekly signal review via `cmd-advance` dispatch.
- Pre-S10 feedback-loop audit via advisory gate dispatch.
- Monthly deep audit documented, but not orchestrated as part of one S10 skill flow.

### Finding 3 — S10 should explicitly combine lanes `a/b/c`
Assessment: **Supported**.

Model:
- `a) Audit + CI`: Section H weekly audit, monthly deep audit, signal-review findings, feedback-loop audit, REM closure.
- `b) Measurement + reporting`: denominator checks, weekly deltas, data-quality notes, risk watch.
- `c) Next experiments`: readout rollups and next-cycle experiment specs.

## `/lp-weekly` Adoption Path (Transition Contract)
| Phase | Behavior | Invocation path | Blocking policy |
|---|---|---|---|
| Phase 0 (compat) | `/lp-weekly` exists; additive packet only; no mapping changes | Manual operator invocation allowed | Never blocks S10 |
| Phase 1 (default route) | Startup-loop S10 entry routes through `/lp-weekly` orchestration sequence | `/startup-loop` internally calls `/lp-weekly` | Never blocks S10 |
| Phase 2 (remap) | `loop-spec.yaml` S10 skill mapping changes to `/lp-weekly`; `/lp-experiment` runs as sub-step | Stage mapping points to `/lp-weekly` | Still no gate-semantics changes |

Default for planning: **Phase 0 -> Phase 1 first**, then evaluate Phase 2 remap.

## S10 Weekly Orchestration Sequence v0
1. Preflight
- Inputs: business code, week anchor, required KPI sources, prior-week decision artifact.
- Output: preflight status (`ready` or `restricted`) + missing-input list.
2. Measurement compilation
- Inputs: KPI sources and denominator data.
- Output: normalized measurement summary section for weekly packet.
3. Decisioning (authoritative prompt)
- Execute weekly KPCS prompt; maintain canonical decision artifact path.
4. Weekly audit lane (`a`)
- Run Section H checks and monthly deep-audit trigger check when applicable.
5. CI capture
- Link signal-review and feedback-loop audit outputs; apply dedup rule; emit REM summary.
6. Experiment lane (`c`)
- Roll up experiment readouts and update/create next-cycle experiment backlog entries.
7. Publish
- Emit additive S10 weekly packet and update a latest pointer/index.

### Sequence Invariants
- Decision memo path is unchanged and remains canonical.
- Orchestrator packet is additive-first (never replaces canonical artifacts in first iteration).
- First iteration does not block stage close; failures produce `restricted` lane status + REM tasks.
- Rerun behavior is idempotent by week key (overwrite same packet path or supersede deterministically; no duplicate unresolved artifacts).

## Lane Contracts (`a/b/c`)
| Lane | Inputs | Outputs | Exit condition | Failure handling | Owner |
|---|---|---|---|---|---|
| `a` Audit + CI | KPCS artifact, exception tickets, CAP state, prior REM | Section H status + CI summary + REM delta | Weekly checks completed; monthly trigger evaluated | Warning + REM; lane marked `incomplete` | Operator |
| `b` Measurement + reporting | KPI snapshots, denominator values, data-quality notes | Measurement summary section + denominator validity state | All required KPI families assessed or explicitly restricted | `restricted` state + REM for missing data | Operator + data owner |
| `c` Next experiments | Experiment readouts, decision class, prior refs | Experiment portfolio rollup + next-spec backlog updates | Next-cycle backlog updated or explicit rationale recorded | Warning + carry-forward action + owner | Growth owner / operator |

## Gap Analysis (a / b / c)
### a) Weekly audit + continuous improvement gaps
| Gap | Gap type | Current state | Fix pattern | Impact | Priority |
|---|---|---|---|---|---|
| A1 | Contract gap | Weekly light-audit has no orchestrator contract | Add lane `a` orchestration step + packet section + test | Audit quality depends on manual prompt discipline | High |
| A2 | Process gap | Monthly deep-audit trigger documented, not in orchestrator sequence | Add monthly trigger check in lane `a` | Missed monthly reviews | High |
| A3 | Process gap | No explicit weekly REM reconciliation before close | Add REM reconciliation step + owner enforcement | Failure loops persist | Medium |
| A4 | Tooling gap | Signal-review + feedback audit have no dedup merge rule | Add dedup key + merge policy | Duplicate follow-ups | Medium |

### b) Measurement compilation + reporting gaps
| Gap | Gap type | Current state | Fix pattern | Impact | Priority |
|---|---|---|---|---|---|
| B1 | Contract gap | Measurement preflight contract absent (inputs + denominator validity + restricted state) | Add sequence step 1-2 + lane `b` exit criteria + check | Denominator drift and inconsistent decision validity | High |
| B2 | Tooling gap | No normalized weekly measurement packet | Add additive packet section + pointer/index | Hard replayability and weak handoff | Medium |

### c) Devising new experiments gaps
| Gap | Gap type | Current state | Fix pattern | Impact | Priority |
|---|---|---|---|---|---|
| C1 | Contract gap | `/lp-experiment` readout is per experiment; no mandatory portfolio rollup at S10 close | Add lane `c` rollup contract | Partial planning for next cycle | High |
| C2 | Process gap | No deterministic mapping from decision class to experiment actions | Define decision-to-action table in orchestrator | Decision-to-execution gap | High |
| C3 | Tooling gap | Prior updates (`prior_refs`) optional and not audited at close | Add lane `c` validation check | Baseline drift | Medium |

## Artifact Continuity Policy
- Additive-first: new weekly packet references canonical artifacts; it does not replace them in first iteration.
- Canonical artifacts retained:
  - Weekly KPCS decision memo,
  - Signal Review,
  - Feedback-loop audit,
  - Monthly deep-audit summary.
- New packet purpose:
  - orchestration trace,
  - lane status snapshot,
  - cross-artifact linking and replayability.

## Fit Check Against `startup-loop-orchestrated-os-comparison-v2`
### Alignment Matrix
| Proposed change | v2 task bucket | Acceptance tie | Test evidence |
|---|---|---|---|
| Add `/lp-weekly` orchestration contract with additive packetization | TASK-06 (skills/docs/prompt alignment) | Maintains authority boundaries and canonical terms | Doc diff + skill contract checks |
| Add deterministic S10 sequence and lane contracts | TASK-06 | Operator clarity and consistent terminology | Reviewer can map top 3 weekly priorities to lanes/workstreams <=15 min |
| Add compatibility checks for wrapper + canonical artifact continuity | TASK-07 (regression checks) | No stage authority drift; existing outputs unchanged | Regression checks: old artifacts still emitted; new packet references them |
| Keep prompt authority and stage semantics intact | TASK-06 + non-goals | `weekly-kpcs` remains canonical; `loop-spec` graph unchanged | Targeted grep/assertion checks over touched files |

### Required Guardrails to Stay In-Bounds
- `/lp-weekly` remains an orchestration wrapper around existing authorities.
- No stage ID/order/gate-semantic mutation.
- Any mapping update is additive and compatibility-tested first.
- First iteration never converts warnings into new hard gates.

### Scope-Risk Flags
- If `/lp-weekly` requires runtime behavior changes beyond docs/skills orchestration, split after v2 TASK-06/TASK-07.
- Avoid bundling S10 orchestration refactor with unrelated v2 taxonomy migration edits.

## Questions
### Resolved
- Q: Does `/lp-experiment` currently exist?
  - A: Yes (`.claude/skills/lp-experiment/SKILL.md`).
- Q: Is weekly S10 CI dispatch already present?
  - A: Yes (`/lp-signal-review` dispatch in `cmd-advance.md`).
- Q: Is monthly deep-audit orchestrated by dedicated skill flow?
  - A: No dedicated S10 orchestrator flow found.

### Open (User Input Needed)
- Q: For phase transition, do we approve Phase 1 internal routing in the same wave as Phase 0 skill introduction?
  - Why it matters: determines whether `/lp-weekly` is immediately live in default S10 flow.
  - Decision impacted: initial implementation sequencing.
  - Decision owner: Operator.
  - Default assumption + risk: yes (Phase 0 + Phase 1 together), risk is small routing-touch regression.

## Confidence Inputs
- Implementation: 85%
  - Evidence basis: explicit sequence, lane contracts, and fit matrix now defined.
  - To reach >=90: draft `/lp-weekly` I/O skeleton file and run one pilot weekly trace.
- Approach: 84%
  - Evidence basis: additive-first with explicit transition phases and no gate-semantics change.
  - To reach >=90: confirm phase decision and wrapper-call path in plan TASK-01.
- Impact: 86%
  - Evidence basis: addresses concrete operational failure modes in `a/b/c`.
  - To reach >=90: demonstrate 2-cycle directional improvement in defined metrics.
- Delivery-Readiness: 83%
  - Evidence basis: no unresolved architecture ambiguity; migration gate is explicit.
  - To reach >=90: finalize Phase 1 timing decision.
- Testability: 82%
  - Evidence basis: compatibility assertions now specified.
  - To reach >=90: implement wrapper regression checks in TASK-07-style suite.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Wrapper rename causes operator confusion during transition | Medium | Medium | Phase contract + usage notes + alias period |
| Scope creep into runtime semantics beyond v2 boundaries | Medium | High | Keep to orchestration wrapper and additive artifacts |
| Dual S10 authority interpretation (prompt vs skill) | Medium | High | Maintain explicit authority stack in docs and tests |
| Weekly close overhead grows beyond practical cadence | Medium | Medium | Keep no-block policy; lane timebox; only required checks |
| Re-entrancy creates duplicate weekly artifacts | Medium | Medium | Deterministic week-key overwrite/supersede policy |
| Week boundary ambiguity causes wrong cycle grouping | Low | Medium | Explicit week anchor convention in orchestrator contract |
| Partial inputs produce silent low-quality outputs | Medium | High | `restricted` lane status + REM emissions for missing denominators |

## Planning Constraints & Notes
- Must-follow patterns:
  - Thin orchestrator (`SKILL.md` + modules).
  - Additive-first artifact policy.
  - Compatibility-first rollout; no new hard blocking in first iteration.
- Rollout/rollback expectations:
  - Rollout: Phase 0/1 wrapper introduction, then optional phase-2 remap.
  - Rollback: keep `/lp-experiment` direct mapping and retain canonical outputs.
- Observability expectations:
  - Weekly packet includes lane status (`a/b/c`), unresolved REM count, and next-experiment backlog delta.

## Suggested Task Seeds (Non-binding)
1. TASK-01 decision gate: confirm Phase 1 timing (default: include with Phase 0).
2. Define `/lp-weekly` I/O contract skeleton (inputs, outputs, side effects, idempotency key).
3. Implement S10 sequence v0 and lane contracts in skill/docs.
4. Add dedup/merge rule for signal-review and feedback-loop findings.
5. Add additive weekly packet + latest pointer policy.
6. Add compatibility checks: canonical S10 outputs unchanged, packet linking valid, no stage-semantics drift.
7. Add 2-cycle measurement capture for success metrics.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `startup-loop`, `lp-experiment`, `lp-signal-review`, `lp-do-fact-find`
- Deliverable acceptance package:
  - `/lp-weekly` orchestration contract
  - S10 sequence and lane contracts
  - additive packet policy and compatibility tests
- Post-delivery measurement plan:
  - 2-cycle tracking of:
    - missed Section H checks,
    - unresolved REM carryover,
    - next-experiment specs created.

## Evidence Gap Review
### Gaps Addressed
- Added explicit authority stack.
- Added explicit adoption phases and caller path.
- Added deterministic sequence v0 with invariants and idempotency posture.
- Added lane input/output/exit/failure/owner contracts.
- Added negative-evidence method notes for absence claims.
- Added auditable v2 TASK-06/TASK-07 mapping matrix.

### Confidence Adjustments
- Approach +2 after transition phases and sequence invariants were formalized.
- Testability +3 after compatibility assertions were made explicit.

### Remaining Assumptions
- Phase 0 and Phase 1 can be delivered together without introducing routing risk above acceptable threshold.
- Week-key convention can be standardized without conflicting with existing ISO-week artifact naming.

## Planning Readiness
- Status: Ready-for-planning
- Decision gate for plan Task 1:
  - Confirm transition mode (default in this brief: Phase 0 + Phase 1 together, no phase-2 remap yet).
- Blocking items:
  - None for planning start; phase decision is gated as first plan task with a default.
- Recommended next step:
  - `/lp-do-plan startup-loop-s10-weekly-orchestration`
  - Include fit gates against `docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md` TASK-06 and TASK-07.
