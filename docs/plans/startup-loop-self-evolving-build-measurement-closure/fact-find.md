---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-14
Last-updated: 2026-03-14
Feature-Slug: startup-loop-self-evolving-build-measurement-closure
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find
Related-Analysis: docs/plans/startup-loop-self-evolving-build-measurement-closure/analysis.md
Dispatch-ID: IDEA-DISPATCH-20260314202652-0001
Trigger-Why: Finished self-improving work can already close with verified measurement in queue completion, but lp-do-build still has no canonical place to put that proof, so most completed self-evolving work matures without observed evidence and promotion keeps stalling.
Trigger-Intended-Outcome: "type: operational | statement: Finished self-evolving builds can carry a canonical verified-measurement block in build-record.user.md, and queue-state completion automatically converts that block into verified self-evolving outcome closure. | source: operator"
artifact: fact-find
---

# Startup Loop Self-Evolving Build Measurement Closure Fact-Find Brief

## Scope
### Summary
The self-evolving runtime already knows how to record verified measurements when `lp-do-ideas` queue completion receives structured `selfEvolvingMeasurement` input. The missing seam is earlier: `lp-do-build` has no canonical build artifact section that carries that proof, and the queue completion CLI does not auto-read it from build outputs. This fact-find scopes the proof-closing gap at the build-output boundary, not the broader self-evolving policy stack.

### Goals
- Verify whether verified measurement closure is already implemented downstream of build completion.
- Identify the narrowest canonical surface where build outputs should carry self-evolving proof.
- Choose a closure path that improves proof write-back without introducing a parallel artifact format or manual CLI burden.

### Non-goals
- Reworking self-evolving scoring, promotion-gate math, or policy journaling.
- Designing a full new proving runtime before the build boundary is closed.
- Backfilling historical builds with invented measurements.

### Constraints & Assumptions
- Constraints:
  - Existing queue completion and self-evolving outcome closure contracts must remain additive.
  - The fix must preserve current pending-maturity behavior when no verified measurement exists.
  - Local Jest remains out of scope.
- Assumptions:
  - The correct seam is build-output contract plus automatic extraction, not manual flag passing.
  - A malformed declared proof block should fail closed rather than silently writing corrupted evidence.

## Outcome Contract
- **Why:** Finished self-improving work can already close with verified measurement in queue completion, but lp-do-build still has no canonical place to put that proof, so most completed self-evolving work matures without observed evidence and promotion keeps stalling.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Finished self-evolving builds can carry a canonical verified-measurement block in build-record.user.md, and queue-state completion automatically converts that block into verified self-evolving outcome closure.
- **Source:** operator

## Current Process Map
- Trigger: a self-evolving candidate routes into the canonical `lp-do-ideas -> lp-do-fact-find -> lp-do-analysis -> lp-do-plan -> lp-do-build` workflow and the build reaches queue completion.
- End condition: the build either closes with verified measurement in self-evolving memory or remains pending/missing proof.

### Process Areas
| Area | Current step-by-step flow | Owners / systems / handoffs | Evidence refs | Known issues |
|---|---|---|---|---|
| Build completion | `lp-do-build` writes `build-record.user.md`, archives the plan, then runs `startup-loop:queue-state-complete` with feature slug, plan path, and one-line outcome text | `lp-do-build`, `build-record.user.md`, `lp-do-ideas-queue-state-completion.ts` | `.claude/skills/lp-do-build/SKILL.md`, `docs/plans/_templates/build-record.user.md`, `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` | The completion CLI accepts verified measurement input in code but the workflow gives it no canonical source. |
| Self-evolving proof closure | `markDispatchesCompleted()` can stamp `completed_by.self_evolving`, write verified observations, and emit `outcome_recorded` lifecycle events when `selfEvolvingMeasurement` exists | `lp-do-ideas` queue completion, self-evolving lifecycle store | `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts`, `docs/plans/startup-loop-centralized-math-foundations/plan.md` | Most builds never supply that payload, so outcomes stay pending or become missing/censored. |
| Promotion gate | Promotion gate requires observed evaluation, verified observations, and complete target KPI fields before promote/revert decisions can move past hold | self-evolving promotion gate and evaluation dataset | `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-containers.ts` | `analytics-v1` still has no experiment hook and proof-bearing containers with hooks still starve because completed work does not feed canonical measurement proof back in. |

## Evidence Audit
### Entry Points
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` - existing verified-measurement closure writer
- `.claude/skills/lp-do-build/SKILL.md` - current build completion workflow and queue-state completion hook
- `docs/plans/_templates/build-record.user.md` - canonical build output template consumed at plan completion
- `docs/business-os/startup-loop/contracts/loop-output-contracts.md` - build-record contract and downstream consumers
- `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts` - proof-required promotion holds

### Key Modules / Files
- `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` - already contains `SelfEvolvingMeasurementInput`, verified observation writing, and lifecycle event emission
- `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts` - focused regression seam for queue completion behavior
- `scripts/src/startup-loop/self-evolving/self-evolving-evaluation.ts` - turns verified/missing/pending completion state into observed/pending/censored/missing evaluation status
- `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts` - uses evaluation status and verified observations as hard gate inputs

### Data & Contracts
- Types/schemas/events:
  - `SelfEvolvingMeasurementInput` already defines the verified-measurement payload.
  - `QueueCompletedSelfEvolving.measurement_status` already supports `verified`, `verified_degraded`, `pending`, `missing`, and `insufficient_sample`.
  - `build-record.user.md` currently carries `## Outcome Contract` but no canonical self-evolving proof block.
- Persistence:
  - Queue closure writes `completed_by.self_evolving` into `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
  - Verified proof also writes `meta-observation.v2` and lifecycle events into the self-evolving business store.
- API/contracts:
  - `startup-loop:queue-state-complete` only requires `--feature-slug`, `--plan-path`, `--outcome`, and optional `--business`.

## Engineering Coverage Matrix
| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No UI changes | None | N/A |
| UX / states | Required | Build workflow already has a completion path and failure policy in the skill contract | Declared proof may silently disappear if the build artifact contract stays implicit | Choose a fail-closed rule for malformed declared proof only |
| Security / privacy | N/A | No new credential or privacy surface | None | N/A |
| Logging / observability / audit | Required | Queue completion already emits lifecycle events and verified observations | Build workflow provides no explicit build-side proof contract to audit against | The build artifact must become the canonical audit seam |
| Testing / validation | Required | Queue completion has focused regression coverage | No tests assert auto-extraction from build outputs | Add focused completion tests for valid and malformed proof blocks |
| Data / contracts | Required | `SelfEvolvingMeasurementInput` exists and is write-ready | Build-record contract does not expose a matching section | Add a canonical build-record section and document it |
| Performance / reliability | Required | Queue completion is a small file read/write path | Parsing must not fail unrelated builds or historical records | Missing section should stay fail-open; malformed declared section should fail closed |
| Rollout / rollback | Required | Additive docs/template/queue completion seam | A broken parser could block queue completion on all builds | Limit parsing to the optional section and preserve current behavior when absent |

## Confidence Inputs
| Dimension | Score | Rationale | Verification path |
|---|---:|---|---|
| Implementation seam clarity | 0.93 | The write-ready verified-measurement path already exists; only the build-output contract and extraction seam are missing | `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` |
| Blast radius control | 0.88 | The change is additive to build-record docs/templates and queue completion parsing | `docs/plans/_templates/build-record.user.md`, `docs/business-os/startup-loop/contracts/loop-output-contracts.md` |
| Outcome leverage | 0.95 | This is the first point where completed work can become observed proof rather than advisory structure | `scripts/src/startup-loop/self-evolving/self-evolving-promotion-gate.ts` |

## Analysis Readiness
- Status: Go
- Recommended deliverable type: `multi-deliverable`
- Recommended execution skill: `lp-do-build`
- Reasoning:
  - The build-output proof seam is concrete and narrower than a general proving engine.
  - Existing self-evolving contracts already support verified measurement closure, so the missing work is implementation and workflow contract alignment rather than exploratory math.
