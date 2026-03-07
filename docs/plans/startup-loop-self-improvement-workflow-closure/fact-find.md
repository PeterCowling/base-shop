---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-03-05
Last-updated: 2026-03-05
Feature-Slug: startup-loop-self-improvement-workflow-closure
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, lp-do-plan, lp-do-ideas, startup-loop
Related-Plan: docs/plans/startup-loop-self-improvement-workflow-closure/plan.md
Trigger-Why: Close the remaining self-improving startup-loop gaps so validated ideas move through the canonical lp-do-ideas -> lp-do-fact-find -> lp-do-plan -> lp-do-build workflow instead of stalling in side ledgers, while keeping the signal layer durable and non-recursive.
Trigger-Intended-Outcome: "type: operational | statement: The self-improving startup loop persists build-time ideas, emits stable self-evolving candidates, converts validated candidates into canonical workflow dispatches, ingests full build-output reflections, and reports maturity boundaries with explicit measured vs inferred provenance. | source: operator"
---

# Startup Loop Self-Improvement Workflow Closure Fact-Find Brief

## Scope
### Summary
This tranche finishes the operational closure work left after the integrity fixes. The target is the path from `lp-do-ideas` and `lp-do-build` into the self-evolving runtime: make build-time idea capture durable, make self-evolving candidate identity stable across runs, turn validated candidates into canonical `dispatch.v2` workflow items instead of dead-ending in `backbone-queue.jsonl`, widen build-output ingestion so it consumes the full reflection artifacts, and make mature-boundary reporting explicit about measured vs inferred inputs.

### Goals
- Persist build-time live dispatches instead of treating the build hook as advisory-only output.
- Ensure self-evolving candidate identity is stable across reruns of the same recurring problem.
- Convert validated self-evolving candidates into canonical workflow dispatches that can proceed through `lp-do-fact-find -> lp-do-plan -> lp-do-build`.
- Make build-output ingestion consume all real idea bullets and structured pattern-reflection entries.
- Report mature-boundary inputs with explicit provenance so unknown values do not masquerade as measured facts.

### Non-goals
- Fully autonomous downstream invocation of `lp-do-fact-find`, `lp-do-plan`, or `lp-do-build` without operator confirmation.
- Queue-format migration away from existing `queue-state.v1` persistence.
- Broad redesign of self-evolving scoring, release controls, or actuator execution.
- Local Jest execution.

### Constraints & Assumptions
- Constraints:
  - Keep changes inside startup-loop scripts/docs and their direct tests.
  - Preserve the existing operator-confirmed workflow contract.
  - Avoid recursion where self-evolving follow-up dispatches re-enter the signal layer as fresh source work.
- Assumptions:
  - Existing `lp-do-ideas-persistence.ts` is the correct durable store for follow-up workflow packets.
  - `dispatch.v2` is the right canonical work-item shape for self-evolving follow-ups, even when the candidate originally mapped to build/plan lanes.

## Outcome Contract
- **Why:** Close the remaining self-improving startup-loop gaps so validated ideas move through the canonical lp-do-ideas -> lp-do-fact-find -> lp-do-plan -> lp-do-build workflow instead of stalling in side ledgers, while keeping the signal layer durable and non-recursive.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The self-improving startup loop persists build-time ideas, emits stable self-evolving candidates, converts validated candidates into canonical workflow dispatches, ingests full build-output reflections, and reports maturity boundaries with explicit measured vs inferred provenance.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `scripts/src/startup-loop/ideas/lp-do-ideas-build-commit-hook.ts` - build-time ideas hook; currently calls the live hook but does not persist emitted dispatches.
- `scripts/src/startup-loop/ideas/lp-do-ideas-live-hook.ts` - read-only CLI/pure hook; comments mention `--events-path` but the CLI ignores it.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts` - ideas ingestion path; writes backbone queue entries but does not turn them into canonical workflow packets.
- `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts` - build-output bridge; currently writes candidate ledger updates only, does not enqueue/consume backbone work, caps idea bullets at 3, and flattens pattern reflection into one blob signal.
- `scripts/src/startup-loop/self-evolving/self-evolving-report.ts` - boundary report path; currently derives boundary values heuristically and surfaces them as if factual.

### Key Modules / Files
- `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts` - existing durable queue/telemetry adapter for trial/live dispatches.
- `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` - canonical dispatch-to-workflow router; proves `dispatch.v2` is the correct downstream packet shape.
- `scripts/src/startup-loop/self-evolving/self-evolving-orchestrator.ts` - currently hashes `candidate_id` with `runId`, causing duplicate candidates across runs.
- `scripts/src/startup-loop/self-evolving/self-evolving-signal-helpers.ts` - currently manufactures boundary values from stage/channel counts.
- `docs/business-os/startup-loop/self-evolving/README.md` - documents only the report and manual ideas bridge, not a canonical consumer path.

### Patterns & Conventions Observed
- Startup-loop queue persistence is already standardized on `persistOrchestratorResult()` and `queue-state.v1`.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`
- `dispatch.v2` packets are the canonical work-unit shape for operator-confirmed workflow entry.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`, `docs/business-os/startup-loop/ideas/schemas/lp-do-ideas-dispatch.v2.schema.json`
- The self-evolving layer already uses append-only observations and a candidate ledger, so new workflow emission should be additive and idempotent rather than a new store.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-events.ts`, `scripts/src/startup-loop/self-evolving/self-evolving-candidates.ts`

### Data & Contracts
- Types/schemas/events:
  - `TrialDispatchPacketV2`, `LiveDispatchPacket`, and `dispatch.v2` schema define the canonical work item.
  - `ImprovementCandidate`, `MetaObservation`, and `StartupState` define self-evolving state.
- Persistence:
  - Ideas workflow persists to `docs/business-os/startup-loop/ideas/{trial,live}/queue-state.json` and `telemetry.jsonl`.
  - Self-evolving state persists to `docs/business-os/startup-loop/self-evolving/<BIZ>/`.
- API/contracts:
  - `startup-loop:lp-do-ideas-build-commit-hook` should be advisory for build progression, but durable for emitted workflow packets.
  - `startup-loop:self-evolving-from-build-output` and `startup-loop:self-evolving-from-ideas` should leave behind canonical workflow-followup artifacts rather than only candidate ledgers.

### Dependency & Impact Map
- Upstream dependencies:
  - `lp-do-build` runs the build-time ideas hook after task commit and the build-output bridge on plan completion.
  - `lp-do-ideas` queue/telemetry readers already understand persisted `dispatch.v2` packets.
- Downstream dependents:
  - Operators who review queue-state for new work.
  - Any future `lp-do-fact-find` / `lp-do-plan` / `lp-do-build` automation layered on top of canonical dispatch packets.
  - Self-evolving report/dashboard consumers.
- Likely blast radius:
  - `scripts` package startup-loop modules and their targeted tests.
  - Self-evolving README and build-skill documentation if workflow behavior changes are surfaced.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Persisting live hook output through the existing ideas persistence adapter closes the build-time durability gap without changing the live hook’s pure-function contract. | `lp-do-ideas-persistence.ts` compatibility with `LiveDispatchPacket[]` | Low | Low |
| H2 | Stable `candidate_id = hash(business + repeat_signature)` is sufficient to dedupe recurring candidates across runs while still allowing score/state refresh. | Existing candidate ledger merge semantics | Low | Low |
| H3 | Emitting canonical `dispatch.v2` follow-up packets from validated candidates is the right closure mechanism because the routing adapter and queue persistence already exist. | Dispatch schema + queue persistence + operator-confirmed workflow contract | Medium | Low |
| H4 | Parsing frontmatter `entries[]` from `pattern-reflection.user.md` will materially improve recall compared to the current single-blob bridge. | `js-yaml` dependency and frontmatter shape stability | Low | Low |
| H5 | Boundary provenance can be made explicit without breaking callers by adding a snapshot helper and conservative defaults for unknown signals. | Existing report/orchestrator boundary API | Low | Low |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Live hook integration tests already persist dispatched packets through `persistOrchestratorResult()` | `scripts/src/startup-loop/__tests__/lp-do-ideas-live-integration.test.ts` | High |
| H2 | `candidate_id` currently includes `runId`; ledger dedupe is by `candidate_id` only | `self-evolving-orchestrator.ts`, `self-evolving-candidates.ts` | High |
| H3 | `backbone-queue.jsonl` has no consumer, while `dispatch.v2` already routes into the workflow | `self-evolving-from-ideas.ts`, `lp-do-ideas-routing-adapter.ts` | High |
| H4 | Build-output bridge currently uses `candidateBullets.slice(0, 3)` and one `pattern-reflection` seed | `self-evolving-from-build-output.ts` | High |
| H5 | Boundary helper currently synthesizes revenue/headcount/support from stage and counts | `self-evolving-signal-helpers.ts` | High |

### Test Landscape
#### Test Infrastructure
- Frameworks: Jest under governed `scripts` package runner.
- Commands: local lint/type validation allowed; local Jest disallowed by policy.
- CI integration: CI remains the source of truth for test execution.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Live hook + persistence | Integration | `scripts/src/startup-loop/__tests__/lp-do-ideas-live-integration.test.ts` | Already proves live hook output is persistable |
| Ideas -> candidates -> backbone queue | Integration | `scripts/src/startup-loop/__tests__/self-evolving-orchestrator-integration.test.ts` | Covers candidate generation and queue write, but not follow-up consumption |
| Signal helper integrity | Unit | `scripts/src/startup-loop/__tests__/self-evolving-signal-integrity.test.ts` | Covers placeholder suppression and recurrence identity; boundary expectations now need updating |

#### Coverage Gaps
- No direct test for build-commit hook durability.
- No direct test for emitting workflow follow-up dispatches from validated candidates.
- No direct test for build-output pattern reflection parsing.
- No direct test for measured vs inferred boundary provenance.

## Questions
### Resolved
- Q: Is there an existing durable store for emitted live dispatches?
  - A: Yes. `persistOrchestratorResult()` already persists both trial and live packets to `queue-state.v1` plus telemetry JSONL.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-persistence.ts`
- Q: Does the self-evolving layer already have a queue that can be drained?
  - A: Yes. `self-evolving-from-ideas.ts` writes `backbone-queue.jsonl`, but no consumer reads it.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-ideas.ts`
- Q: Does the build-output bridge currently enqueue backbone work?
  - A: No. It only runs the orchestrator and returns the candidate ledger path.
  - Evidence: `scripts/src/startup-loop/self-evolving/self-evolving-from-build-output.ts`
- Q: Is `dispatch.v2` already the operator-facing work packet for the workflow?
  - A: Yes. The routing adapter consumes `dispatch.v2` and produces typed `lp-do-fact-find` / `lp-do-briefing` invocation payloads.
  - Evidence: `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts`

### Open (Operator Input Required)
None. The remaining decisions are implementation and workflow-shaping decisions already bounded by repo policy.

## Confidence Inputs
- Implementation: 90%
  - Basis: the missing seams already exist in neighboring modules; the work is mostly integration and contract cleanup.
  - What raises it further: clean targeted lint/type validation on all touched scripts.
- Approach: 87%
  - Basis: converting candidates into canonical dispatch packets is a stronger closure mechanism than inventing a new queue consumer path, but it must avoid recursive re-ingestion.
  - What raises it further: explicit recursion guard plus idempotent observation IDs.
- Impact: 92%
  - Basis: this directly fixes the main remaining loop-closure gap and prevents misleading maturity reporting.
  - What raises it further: temp-root smoke proving emitted follow-up packets appear in the trial queue.
- Delivery-Readiness: 91%
  - Basis: no external systems are required and all runtime stores are repo-local.
  - What raises it further: none beyond implementation.
- Testability: 84%
  - Basis: targeted test files exist and can be updated, but local Jest execution is blocked.
  - What raises it further: add focused test cases for consumer emission and boundary provenance before pushing to CI.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Follow-up dispatches re-enter self-evolving ingestion and create recursive noise | Medium | High | Mark self-evolving follow-up packets with deterministic evidence/root IDs and suppress them in ideas ingestion |
| Build-time persistence writes duplicate queue entries on reruns | Low | Medium | Use existing queue-state idempotency and stable candidate/backbone IDs |
| Pattern-reflection parsing becomes too permissive on free-form historical files | Medium | Medium | Prefer frontmatter `entries[]`; fall back to body parsing only when frontmatter is absent |
| Boundary evaluation still overstates maturity using inferred values | Medium | Medium | Make unknown values explicit, use safe defaults, and surface signal provenance in the report |

## Planning Constraints & Notes
- Must-follow patterns:
  - Reuse `persistOrchestratorResult()` rather than creating a new persistence path.
  - Keep self-evolving stores additive and idempotent.
  - Keep `lp-do-ideas-live-hook.ts` pure at the export boundary.
- Rollout/rollback expectations:
  - Rollout is script-only and reversible by reverting the touched startup-loop files.
  - Queue and self-evolving store writes should remain deterministic and replay-safe.
- Observability expectations:
  - CLI results should report persistence/emission counts clearly.
  - `self-evolving-report` should expose both signal values and provenance.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None
- Recommended next step:
  - `/lp-do-plan startup-loop-self-improvement-workflow-closure`

## Scope Signal
Signal: right-sized

Rationale: The work is larger than a single-file patch but still bounded to the startup-loop runtime seams already identified in the audit. It closes a concrete workflow gap without reopening the broader self-evolving system design.
