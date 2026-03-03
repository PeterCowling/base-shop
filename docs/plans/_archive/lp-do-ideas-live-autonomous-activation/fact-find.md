---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-25
Last-updated: 2026-02-25
Feature-Slug: lp-do-ideas-live-autonomous-activation
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-do-replan
Related-Plan: docs/plans/lp-do-ideas-live-autonomous-activation/plan.md
artifact: fact-find
Trigger-Source: direct-operator-decision: progress lp-do-ideas from trial to live/autonomous
direct-inject: true
direct-inject-rationale: Operator requested an evidence-backed readiness and bridge write-up for live/autonomous activation.
---

# lp-do-ideas Live/Autonomous Activation Fact-Find Brief

## Scope
### Summary
Assess whether standing-information-change intake is ready for live/autonomous operation, then define the bridge from current trial mode to a controlled live rollout with bounded autonomy.

### Decision Frame
- Decision owner: startup-loop maintainers (operator)
- Decision/question: what is required to move `lp-do-ideas` from trial-only behavior to safe live/advisory operation now, with bounded autonomous escalation later?

### Goals
- Confirm current runtime readiness versus trial/live contracts.
- Identify concrete blockers to live/advisory activation.
- Define a safe two-step target (`live advisory` -> `live autonomous`) with anti-loop and anti-fan-out controls intact.
- Provide planning-ready task seeds with objective acceptance criteria.

### Non-goals
- Implementing live mode in this fact-find cycle.
- Enabling hard blocking of `/startup-loop advance` on ideas dispatch in v1 live mode.
- Redesigning idea quality/ranking beyond current trial contracts.

### Constraints & Assumptions
- Constraints:
  - Preserve fail-closed behavior for unknown/unclassified artifacts.
  - Preserve trial artifacts and retrospective traceability.
  - Preserve stage-orchestration safety: no startup-loop stage mutation from ideas intake.
  - Keep live v1 advisory first; do not jump directly to full autonomy.
- Assumptions:
  - Existing source-trigger and anti-loop implementation from the 2026-02-25 build can be reused for live activation.
  - Queue-with-confirmation (Option B) remains the safest first live posture.

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/lp-do-ideas-trial.ts`
- `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`
- `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`
- `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`
- `docs/business-os/startup-loop/ideas/trial/queue-state.json`
- `scripts/package.json`
- `docs/business-os/startup-loop/loop-spec.yaml`
- `docs/plans/_archive/lp-do-ideas-source-trigger-operating-model/build-record.user.md`

### Key Modules / Files
- `lp-do-ideas-trial.ts`
  - Runtime is mode-locked; rejects `mode != "trial"`.
  - Marked pure; no file I/O.
- `lp-do-ideas-routing-adapter.ts`
  - Routing adapter is mode-locked to `trial` and pure (no invocation side-effects).
- `lp-do-ideas-trial-queue.ts`
  - In-memory queue/telemetry with deterministic behavior and no persistence layer.
- `lp-do-ideas-go-live-checklist.md`
  - Live activation prerequisites and code/artifact/governance checks remain unchecked.
- `lp-do-ideas-go-live-seam.md`
  - Defines required live hook, mode-guard updates, and live artifact path switch.
- `lp-do-ideas-trial-contract.md`
  - Defines trial-only boundary and thresholded path to higher autonomy.
- `queue-state.json`
  - Trial queue exists and has processed entries, but no enqueued backlog at check time.
- `scripts/package.json`
  - No explicit `startup-loop:lp-do-ideas-*` operational command wiring.
- `loop-spec.yaml`
  - IDEAS remains a standing pipeline spec, still framed as pack-diff + operator inject.
- `startup-loop SIGNALS routing`
  - No existing `lp-do-ideas-live-hook.ts` wiring found in `scripts/src/startup-loop/` or `apps/prime/src/lib/owner/`; integration point is not yet implemented.
- `build-record.user.md`
  - Source-trigger operating model marked complete with tests and simulation checkpoint.

### Patterns & Conventions Observed
- Runtime core is contract-first and deterministic, with strong test coverage.
- Trial/live separation is explicit and fail-closed.
- Live activation is documented as a seam/checklist/playbook package, but not activated in runtime.
- Queue persistence/invocation orchestration is intentionally separated from pure runtime modules.

### Data & Contracts
- Dispatch/schema/registry v2/cutover/anti-loop contracts are in place and updated.
- Live-mode contract package exists but is operationally incomplete (checklist not signed, live paths absent).
- Trial path files expected by contract are partially present (`queue-state.json` exists; telemetry/dispatch-ledger/standing-registry missing).

### Dependency & Impact Map
- Upstream dependencies:
  - Standing artifact deltas and registry classification.
  - SIGNALS weekly cycle integration point.
- Downstream dependents:
  - `lp-do-fact-find` and `lp-do-briefing` dispatch routing.
  - Queue governance (`DO`/`IMPROVE`) and reflection debt behavior.
- Likely blast radius for live activation:
  - `scripts/src/startup-loop/` ideas runtime wiring
  - `docs/business-os/startup-loop/ideas/live/*` artifact paths
  - startup-loop orchestration hook insertion (advisory only)
  - tests/contracts for live path parity

### Delivery & Channel Landscape
- Audience/recipient:
  - startup-loop maintainers operating weekly SIGNALS cadence.
- Channel constraints:
  - internal repo tooling and markdown/json artifacts only; no external customer-facing channel.
- Approvals/owners:
  - operator sign-off required via `lp-do-ideas-go-live-checklist.md`.
- Compliance constraints:
  - no startup-loop stage mutation from ideas runtime in v1 live advisory.
- Measurement hooks:
  - queue/telemetry artifacts plus metrics rollup thresholds (`route_accuracy`, suppression stability, queue age p95).

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Live advisory hook can run ideas intake without mutating stage state. | Hook placement + mode guard updates | Medium | 1-2 days |
| H2 | Persisted live queue/telemetry path remains idempotent under repeated trigger inputs. | Persistence adapter + deterministic keys | Medium | 1 day |
| H3 | Option B live advisory can sustain >=80% route precision with acceptable suppression variance before Option C. | Real dispatch sample quality + operator confirmation | Medium-High | >=14 days |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Trial runtime is pure and fail-closed; no stage writes in current path. | `lp-do-ideas-trial.ts`, tests | Medium |
| H2 | Queue and dedupe primitives are deterministic and tested in-memory. | `lp-do-ideas-trial-queue.ts`, tests | Medium |
| H3 | Policy thresholds are defined, but no live evidence yet. | trial contract + go-live checklist | Low-Medium |

#### Falsifiability Assessment
- Easy to test:
  - mode-guard acceptance/rejection behavior for `trial/live/invalid`.
  - idempotent persistence and replay suppression on identical input.
- Hard to test:
  - sustained precision and suppression stability require calendar time and sample volume.
- Validation seams needed:
  - explicit live hook integration tests and trial/live artifact parity checks.

#### Recommended Validation Approach
- Quick probes:
  - run live hook in dry fixture mode and assert zero stage mutations.
  - replay same deltas twice and assert identical queue snapshot.
- Structured tests:
  - live-mode orchestrator/adapter test suite, persistence adapter integration tests.
- Deferred validation:
  - Option C activation decision only after L1 evidence window closes.

### Test Landscape
#### Existing Test Coverage
- `lp-do-ideas-trial.test.ts` (mode, cutover, anti-loop behavior)
- `lp-do-ideas-trial-queue.test.ts` (idempotency, scheduling, telemetry)
- `lp-do-ideas-routing-adapter.test.ts` (routing contract)
- `lp-do-ideas-metrics-rollup.test.ts` (observability formulas)
- `lp-do-ideas-fingerprint.test.ts` (cluster fingerprint computation)
- `lp-do-ideas-propagation.test.ts` (propagation contract)
- `lp-do-ideas-registry-migrate-v1-v2.test.ts` (registry migration/schema)
- `lp-do-build-reflection-debt.test.ts` (build reflection debt tracking)

#### Validation Run (this session)
- Executed command:
  - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts`
- Result:
  - `4 passed` suites, `118 passed` tests.
- Required pre-build full ideas regression run:
  - `pnpm --filter scripts test -- src/startup-loop/__tests__/lp-do-ideas-trial.test.ts src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts src/startup-loop/__tests__/lp-do-ideas-metrics-rollup.test.ts src/startup-loop/__tests__/lp-do-ideas-fingerprint.test.ts src/startup-loop/__tests__/lp-do-ideas-propagation.test.ts src/startup-loop/__tests__/lp-do-ideas-registry-migrate-v1-v2.test.ts src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`

#### Coverage Gaps
- No live-mode runtime tests because live orchestrator/hook do not yet exist.
- No end-to-end persisted operational command that executes ideas intake from trigger to filesystem artifacts in one path.
- Mode-guard and routing adapter changes (BR-01/BR-02) will affect modules imported by fingerprint, propagation, and registry-migrate tests — include all 8 test suites in the live-path validation run to confirm no regressions.

## Findings
| ID | Finding | Evidence | Impact |
|---|---|---|---|
| FND-01 | Source-trigger operating model implementation and test checkpoint are complete for trial. | `build-record.user.md` | Core logic is not the blocker. |
| FND-02 | Runtime still hard-rejects `mode: live` in orchestrator and routing adapter. | `lp-do-ideas-trial.ts`, `lp-do-ideas-routing-adapter.ts` | Live cannot be enabled without code changes. |
| FND-03 | Go-live checklist remains entirely unchecked; required live files/hooks are absent. | `lp-do-ideas-go-live-checklist.md`, `lp-do-ideas-go-live-seam.md` | Activation prerequisites are not met. |
| FND-04 | Queue runtime is in-memory/pure; persistence/invocation is caller responsibility and not fully wired as an operational script path. | `lp-do-ideas-trial-queue.ts`, `scripts/package.json`, telemetry contract note | Operational reliability depends on missing wrapper/wiring work. |
| FND-05 | Trial contract path set is only partially materialized on disk (`queue-state` present; telemetry/dispatch-ledger/standing-registry absent). | `docs/business-os/startup-loop/ideas/trial/*` | Metrics/ops evidence path is incomplete. |
| FND-06 | Loop spec still presents IDEAS triggers as pack-diff + operator inject; live SIGNALS hook remains a documented future seam. | `loop-spec.yaml`, `lp-do-ideas-go-live-seam.md` | Live-trigger ingestion is not yet runtime-authoritative. |
| FND-07 | No existing live ideas hook wiring exists in either candidate runtime boundary. | repo search over `scripts/src/startup-loop/` and `apps/prime/src/lib/owner/` | BR-01 must include first-time hook insertion and boundary choice as an explicit design decision. |

## Gap to Live/Autonomous
| Gap ID | Gap | Why it matters | Bridge outcome |
|---|---|---|---|
| GAP-01 | Live mode entrypoints missing | No production path for standing-change triggers | Add `lp-do-ideas-live.ts` + hook integration |
| GAP-02 | Mode guards trial-only | Live packets fail at boundary | Extend/branch guards for live path |
| GAP-03 | Operational wrapper incomplete | Pure modules alone are insufficient for autonomous ops | Add persistence and command wiring |
| GAP-04 | Live artifact plane absent | No durable telemetry/queue/registry in live namespace | Create and validate live artifact paths |
| GAP-05 | Checklist governance incomplete | Unsafe activation risk | Satisfy and sign all go-live checklist sections |
| GAP-06 | Autonomy escalation not operationalized | "Autonomous" target remains conceptual | Define and implement explicit Option B -> C transition controls |

## Target Operating Model (Recommended)
### Phase L1: Live Advisory (first activation)
- Trigger source: SIGNALS weekly hook computes deltas against live standing registry.
- Admission: source-trigger rules and anti-loop guards enforced.
- Execution posture: Option B (`queue-with-confirmation`) remains active.
- Stage safety: advisory only, no hard block on `/startup-loop advance`.
- Persistence: write live telemetry/queue-state/standing-registry paths.

### Phase L2: Live Autonomous (controlled escalation)
- Keep same dispatch contracts and anti-loop invariants.
- Escalate from Option B to Option C only when thresholds are sustained:
  - review period >=14 days
  - sample >=40 dispatches
  - route precision >=80%
  - suppression stability and rollback drill criteria satisfied
- Autonomy scope: auto-invoke limited to highest-confidence class (for example P1) with immediate kill-switch fallback to Option B.

### Core Safety Invariants (must remain true in both phases)
- Projection/read-model updates never auto-admit.
- Self-trigger non-material updates are suppressed.
- Lineage depth and cooldown controls remain enforced.
- `trigger_policy: never` cannot be bypassed.
- Queue transitions are monotonic and idempotent.

## Bridge Requirements
### BR-01: Live Runtime Entry + Hook
- Deliverables:
  - `scripts/src/startup-loop/lp-do-ideas-live.ts`
  - `scripts/src/startup-loop/lp-do-ideas-live-hook.ts`
- Acceptance:
  - SIGNALS run can invoke ideas live intake without stage mutation.
  - Hook is advisory and non-blocking in v1.

### BR-02: Mode Guard Expansion
- Deliverables:
  - Update mode checks in orchestrator/adapter or introduce strict live wrapper.
- Acceptance:
  - `mode: live` packets are accepted on live path.
  - `mode` contract remains fail-closed for invalid values.

### BR-03: Persistence + Command Wiring
- Deliverables:
  - Operational command(s) for running live intake and writing artifacts.
  - Persistence adapter that serializes queue snapshot + telemetry + ledger deterministically.
- Acceptance:
  - One command can run trigger intake end-to-end and leave consistent live artifacts.
  - Repeat run with same inputs is idempotent.
- Sequencing note: Trial telemetry persistence (appending route annotations to `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl`) must be wired before or concurrently with live activation code. The go-live checklist §A (VC-01: route_accuracy ≥80% over ≥40 dispatches, ≥14 days) and §B (VC-02: suppression rate variance over ≥2 weekly snapshots) both require this file to exist. Without it the KPI accumulation window cannot start, and live activation will be gated by an additional 14+ days after build completion. See TASK-09.

### BR-04: Live Artifact Plane Initialization
- Deliverables:
  - `docs/business-os/startup-loop/ideas/live/telemetry.jsonl`
  - `docs/business-os/startup-loop/ideas/live/queue-state.json`
  - `docs/business-os/startup-loop/ideas/live/standing-registry.json`
- Acceptance:
  - Files exist and validate against contracts before activation.

### BR-05: Trial Artifact Contract Reconciliation
- Deliverables:
  - Reconcile missing trial artifacts (`telemetry`, `dispatch-ledger`, `standing-registry`) or update contract/docs if intentionally deferred.
- Acceptance:
  - Contracted paths and actual runtime behavior match exactly.

### BR-06: Checklist Closure + Governance Evidence
- Deliverables:
  - Fully checked live checklist with sign-off and evidence links.
- Acceptance:
  - No-go checks explicitly verified absent.
  - Rollback drill evidence recorded.

### BR-07: Autonomous Escalation Controls
- Deliverables:
  - Policy update that codifies Option C trigger thresholds and kill-switch procedure.
  - Tests for autonomous-path gating and fallback.
- Acceptance:
  - Autonomous path cannot activate unless thresholds are met.
  - One-step rollback to advisory mode is verified.
- Phase boundary: Implementation scope in this cycle is groundwork only — policy definition, gating logic, and kill-switch tests. Option C operational activation requires ≥40 live dispatches at ≥80% precision sustained over L1 live advisory; operational validation is deferred to a post-L1 planning cycle. BR-07 acceptance criteria in this cycle cover code/policy readiness, not operational qualification.

## Questions
### Resolved
- Q: Is the core source-trigger + anti-loop model implemented enough to be a base for live?
  - A: Yes; implementation/test/simulation evidence is complete for trial.
  - Evidence: source-trigger build record + test suites.
- Q: Is live/autonomous already switch-on ready?
  - A: No; live mode guard, hook wiring, artifact plane, and checklist completion are still missing.
  - Evidence: mode guards + unchecked checklist + missing live directory.
- Q: Should autonomous be activated directly from current state?
  - A: No. Activate advisory live first, then escalate on measured thresholds.
  - Evidence: existing Option B/Option C policy and go-live contract structure.

### Open (Operator Input Required)
None.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: trial core is implemented/tested; remaining work is integration and operational wiring.
  - To reach >=80: already met.
  - To reach >=90: complete live hook + mode updates + e2e live-path tests.
- Approach: 88%
  - Evidence basis: phased advisory->autonomous rollout aligns with existing contracts and risk posture.
  - To reach >=80: already met.
  - To reach >=90: complete one successful live advisory cycle with rollback rehearsal.
- Impact: 82%
  - Evidence basis: standing-change intake moves from manual/trial to operational live coverage.
  - To reach >=80: already met.
  - To reach >=90: show sustained routing precision and reduced missed implications over >=2 cycles.
- Delivery-Readiness: 74%
  - Evidence basis: clear worklist exists, but checklist items and runtime wiring are not done.
  - To reach >=80: complete BR-01 through BR-04.
  - To reach >=90: complete BR-06/BR-07 evidence and runbook sign-off.
- Testability: 86%
  - Evidence basis: existing deterministic modules and tests provide strong seams.
  - To reach >=80: already met.
  - To reach >=90: add live-path integration tests (hook + persistence + mode checks).

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Live hook introduces hidden stage mutation coupling | Medium | High | Enforce advisory-only boundary and add explicit tests for no stage writes. |
| Incomplete persistence wiring causes silent data loss | Medium | High | Add atomic writes and validation checks per run. |
| Premature autonomy increases false positives | Medium | Medium-High | Keep Option B until thresholds sustained; enable scoped autonomy only. |
| Contract drift between docs and runtime | Medium | Medium | Add contract parity checks in tests/CI for mode/path semantics. |
| Metrics semantics mislead go/no-go decisions | Medium | Medium | Keep suppression reason taxonomy deterministic and review dashboards with fixtures. |
| VC-01/VC-02 accumulation window delayed by missing trial telemetry | High | High | Schedule TASK-09 (trial telemetry persistence) early in build cycle to start 14-day KPI window before code is complete. |
| SIGNALS hook error propagates into weekly cycle, breaking SIGNALS advance | Medium | Medium | Wrap hook call in try-catch with advisory-only fallback; add explicit error-path test in TASK-05. |
| SIGNALS hook requires changes in apps/prime (cross-boundary), expanding BR-01 scope | Medium | Medium | Resolve integration point location before TASK-02 planning (see Remaining Assumptions). Escalate if cross-app change is required. |

## Planning Constraints & Notes
- Preserve fail-closed behavior at every mode boundary.
- Treat live/advisory activation and autonomous escalation as separate checkpoints.
- Do not add hard advance gates in live v1 unless explicitly re-scoped.
- Keep rollback path first-class and rehearsed before activation.

## Suggested Task Seeds (Non-binding)
- TASK-01: Implement live orchestrator + routing mode support.
- TASK-02: Implement SIGNALS live hook (advisory) and end-to-end command wrapper.
- TASK-03: Implement persistence adapter for queue/telemetry/ledger with deterministic writes.
- TASK-04: Materialize live artifact paths and initialize live standing registry.
- TASK-05: Add live-path tests (mode, hook, persistence, non-mutation guarantees).
- TASK-06: Reconcile trial artifact contract vs on-disk/runtime behavior.
- TASK-07: Complete go-live checklist and rollback rehearsal evidence.
- TASK-08: Implement autonomy escalation controls + kill-switch path and tests.
- TASK-09: Wire trial telemetry persistence — append-only writes to `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` (schema-valid, idempotent). This starts the VC-01/VC-02 KPI accumulation window and is a prerequisite for go-live checklist §A and §B sign-off. Schedule early in the build cycle.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `lp-do-replan`
- Deliverable acceptance package:
  - Live orchestrator/hook modules, persistence wiring, live artifact set, checklist sign-off, and tested autonomy control path.
- Post-delivery measurement plan:
  - Track route precision, suppression stability, queue age p95, and rollback drill readiness per cycle.

## Evidence Gap Review
### Gaps Addressed
- Verified runtime and contract state directly in source files instead of relying on prior summaries.
- Re-ran targeted test suites for current-state confidence.
- Validated operational artifact presence/absence on disk for trial/live namespaces.

### Confidence Adjustments
- Increased implementation confidence because source-trigger tests remain green.
- Reduced delivery-readiness because live operational wiring/checklist is still incomplete.

### Remaining Assumptions
- Boundary selection for the new live hook remains a design choice (`apps/prime` owner boundary vs `scripts/src/startup-loop` tooling boundary) even though no current hook exists in either location.
- Existing test governor workflow remains stable for added live-path tests.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning; blockers are implementation tasks captured in task seeds.
- Recommended next step:
  - `/lp-do-plan lp-do-ideas-live-autonomous-activation --auto`
