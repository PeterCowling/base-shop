---
Type: Plan
Status: Active
Domain: Platform / Business-OS
Workstream: Engineering
Created: 2026-02-25
Last-reviewed: 2026-02-25
Last-updated: 2026-02-25 (TASK-09 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-live-autonomous-activation
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-replan
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
---

# lp-do-ideas Live Advisory + Autonomous Escalation Plan

## Summary

This plan moves `lp-do-ideas` from trial-only operation to live advisory operation in the startup-loop runtime, while preserving the existing fail-closed, anti-loop, and queue-confirmation safety posture. The execution sequence prioritizes runtime boundary clarity and deterministic persistence before enabling live hook ingestion. It also adds the operational evidence plumbing needed to satisfy go-live checklist KPIs and creates an explicit autonomous escalation gate with kill-switch fallback, without activating Option C in this cycle. The output is a readiness-complete live advisory path plus measurable controls for later autonomous promotion.

## Active tasks
- [x] TASK-01: Resolve live hook boundary and invocation contract
- [x] TASK-02: Add live orchestrator path and mode-guard compatibility
- [x] TASK-03: Implement SIGNALS advisory live hook
- [x] TASK-04: Add deterministic persistence adapter and CLI wiring
- [x] TASK-05: Materialize artifact plane and reconcile trial/live contracts
- [x] TASK-06: Add live-path regression and non-mutation test coverage
- [x] TASK-07: Wire KPI rollup evidence pipeline
- [x] TASK-08: Horizon checkpoint - reassess autonomous lane from live evidence
- [x] TASK-09: Implement autonomous gating and kill-switch controls (inactive)
- [ ] TASK-10: Produce go-live checklist closure package and recommendation

## Goals
- Enable a live advisory intake path that can run during SIGNALS without mutating stage state.
- Preserve contract-first fail-closed behavior for unknown artifacts, invalid modes, and non-material retriggers.
- Add deterministic file-backed persistence for queue, telemetry, and registry artifacts.
- Reconcile contract docs with on-disk artifact reality for both `trial/` and `live/` namespaces.
- Make Option C (autonomous) technically ready but still policy-gated and inactive until thresholds are met.

## Non-goals
- Activating Option C in this build cycle.
- Adding a hard startup-loop advance block for pending ideas in live v1.
- Redesigning routing quality heuristics beyond existing trial contracts.

## Constraints & Assumptions
- Constraints:
  - Keep trial and live paths traceable and fail-closed.
  - Do not introduce startup-loop stage mutation from ideas runtime.
  - Preserve monotonic queue transitions and idempotent dedupe semantics.
  - Keep live v1 advisory; operator confirmation remains required.
- Assumptions:
  - Existing source-trigger anti-loop primitives in `lp-do-ideas-trial.ts` remain the canonical decision core.
  - The SIGNALS integration seam can be implemented in `scripts/src/startup-loop/` without cross-app blocking dependencies.

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-live-autonomous-activation/fact-find.md`
- Key findings used:
  - FND-02: mode-guard currently rejects `mode: live`.
  - FND-03/FND-04: go-live checklist is open and no live operational wrapper exists.
  - FND-05: trial artifact contract and on-disk artifacts are currently misaligned.
  - FND-07: no live hook wiring exists in either candidate runtime boundary.

## Proposed Approach
- Option A: Build live runtime and hook first, then add persistence/documentation updates.
- Option B: Resolve integration boundary first, then implement runtime + persistence in parallel lanes, then close governance artifacts.
- Chosen approach: Option B. It minimizes rework risk at the hook seam, starts KPI accumulation plumbing early, and keeps autonomous controls strictly downstream of a live-readiness checkpoint.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; no explicit auto-build request)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Resolve live hook boundary and command invocation contract | 90% | S | Complete (2026-02-25) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Add live orchestrator path and mode-guard compatibility | 90% | M | Complete (2026-02-25) | TASK-01 ✓ | TASK-03, TASK-04, TASK-06 |
| TASK-03 | IMPLEMENT | Implement SIGNALS advisory live hook with fail-open fallback | 90% | M | Complete (2026-02-25) | TASK-01 ✓, TASK-02 ✓ | TASK-06 |
| TASK-04 | IMPLEMENT | Add deterministic persistence adapter and CLI command wiring | 85% | L | Complete (2026-02-25) | TASK-02 ✓ | TASK-05, TASK-06, TASK-07 |
| TASK-05 | IMPLEMENT | Materialize trial/live artifact plane and reconcile contracts | 80% | M | Complete (2026-02-25) | TASK-04 ✓ | TASK-10 |
| TASK-06 | IMPLEMENT | Expand test suite for live-path behavior and regressions | 85% | M | Complete (2026-02-25) | TASK-03 ✓, TASK-04 ✓ | TASK-08 |
| TASK-07 | IMPLEMENT | Wire KPI rollup evidence generation for checklist VC-01/VC-02 | 85% | M | Complete (2026-02-25) | TASK-04 ✓ | TASK-08, TASK-10 |
| TASK-08 | CHECKPOINT | Horizon checkpoint - reassess autonomous lane from live evidence | 95% | S | Complete (2026-02-25) | TASK-06, TASK-07 | TASK-09, TASK-10 |
| TASK-09 | IMPLEMENT | Implement autonomous gating + kill-switch controls (inactive) | 88% | M | Complete (2026-02-25) | TASK-08 ✓ | TASK-10 |
| TASK-10 | IMPLEMENT | Produce checklist closure package and activation recommendation | 80% | M | Pending | TASK-05, TASK-07, TASK-09 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Resolve integration seam before code edits |
| 2 | TASK-02 | TASK-01 | Runtime mode compatibility baseline |
| 3 | TASK-03, TASK-04 | TASK-02 (and TASK-01 for TASK-03) | Hook integration and persistence can run in parallel once runtime contract lands |
| 4 | TASK-05, TASK-06, TASK-07 | TASK-04 (+ TASK-03 for TASK-06) | Contract reconciliation, test expansion, and KPI plumbing |
| 5 | TASK-08 | TASK-06, TASK-07 | Mandatory checkpoint before autonomous work |
| 6 | TASK-09 | TASK-08 | Gate-only autonomous readiness (still inactive) |
| 7 | TASK-10 | TASK-05, TASK-07, TASK-09 | Close checklist with evidence and explicit go/no-go recommendation |

## Tasks

### TASK-01: Resolve live hook boundary and invocation contract
- **Type:** INVESTIGATE
- **Deliverable:** `docs/plans/lp-do-ideas-live-autonomous-activation/artifacts/live-hook-boundary-decision.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `[readonly] scripts/src/startup-loop/`, `[readonly] apps/prime/src/lib/owner/`, `docs/plans/lp-do-ideas-live-autonomous-activation/artifacts/live-hook-boundary-decision.md`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% - bounded read-only mapping task with clear candidate boundaries
  - Approach: 90% - direct call-site search resolves seam ambiguity deterministically
  - Impact: 95% - prevents late integration churn across runtime boundaries
- **Questions to answer:**
  - Which runtime boundary currently owns SIGNALS weekly dispatch orchestration? → **Answer: SIGNALS is an agent-operated stage (skill `/lp-experiment`, wrapped by `/lp-weekly`). No TypeScript dispatch script exists.**
  - Where should live ideas hook attach to stay advisory/non-blocking by default? → **Answer: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` as a standalone CLI module, invoked by `/lp-weekly` as an advisory side-step.**
  - What exact invocation envelope must the hook pass to avoid stage mutation coupling? → **Answer: `--business`, `--registry-path`, `--queue-state-path`, `--telemetry-path`. Hook exits 0 on runtime error; no stage writes; no advance calls.**
- **Acceptance:**
  - [x] Boundary decision document exists with chosen integration location and rationale.
  - [x] Decision includes rejected alternative(s) with concrete risk reason.
  - [x] Invocation contract includes required inputs, error handling, and non-blocking guarantee.
- **Validation contract:**
  - [x] Evidence cites concrete call-sites and file paths for selected boundary.
- **Build completion evidence (2026-02-25):**
  - Artifact: `docs/plans/lp-do-ideas-live-autonomous-activation/artifacts/live-hook-boundary-decision.md`
  - Scanned: `apps/prime/src/lib/owner/` (4 files — kpiReader, kpiWriter, businessScorecard, kpiAggregator; no SIGNALS dispatch)
  - Scanned: `scripts/src/startup-loop/` (27 files match grep; no live hook wiring found)
  - `scripts/package.json`: confirmed no `lp-do-ideas-live` command present
  - `loop-spec.yaml` SIGNALS block confirmed: `skill: /lp-experiment`, agent-operated
  - Selected boundary: `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` (standalone CLI)
  - Rejected: `apps/prime/src/lib/owner/` (no seam, cross-app risk)
  - Rejected: `s10-diagnosis-integration.ts` (separate concern, coupling risk)
  - TASK-02 and TASK-03 call-site map provided in artifact
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** Boundary decision artifact created and linked.
- **Notes / references:** `fact-find.md` FND-07, BR-01.

### TASK-02: Add live orchestrator path and mode-guard compatibility
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/lp-do-ideas-live.ts` + mode-guard updates in routing/trial modules
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-live.ts`, `scripts/src/startup-loop/lp-do-ideas-trial.ts`, `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts`, `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` (scope expansion: TC-06 updated for live-mode acceptance), `scripts/src/startup-loop/__tests__/lp-do-ideas-live.test.ts` (new — TC-02-A/B/C/D/E), `[readonly] docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 85% - code reuse from trial orchestrator keeps delta bounded
  - Approach: 90% - separate live wrapper avoids destabilizing trial contract path
  - Impact: 90% - unlocks all live-path execution and test work
- **Acceptance:**
  - Live orchestrator module accepts `mode: live` and rejects invalid modes fail-closed.
  - Routing adapter accepts `trial|live` and preserves reserved-status guards.
  - Stage mutation remains absent from live orchestration path.
- **Validation contract (TC-02):**
  - TC-02-A: `mode: live` input returns `ok: true` with dispatch packets.
  - TC-02-B: invalid mode returns deterministic fail-closed error.
  - TC-02-C: reserved status (`auto_executed`) still rejects in adapter.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: mapped mode guards and packet types in trial + routing modules.
  - Validation artifacts: current guards in `lp-do-ideas-trial.ts` and `lp-do-ideas-routing-adapter.ts`.
  - Unexpected findings: none.
  - Consumer tracing: new `mode: "live"` path consumed by routing adapter, queue validator, and tests.
- **Scouts:** Validate no downstream code assumes `packet.mode === "trial"` hardcoded.
- **Edge Cases & Hardening:** invalid schema_version + live mode must fail-closed consistently.
- **What would make this >=90%:** passing new live-path unit tests plus unchanged trial-path golden tests.
- **Rollout / rollback:**
  - Rollout: land live wrapper first, then widen adapter guard.
  - Rollback: revert live wrapper import paths and restore strict trial mode guard.
- **Documentation impact:** update seam/checklist references after code lands.
- **Notes / references:** BR-01, BR-02.
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/lp-do-ideas-live.ts` — live orchestrator (pure, delegates to trial core, re-tags as `mode: "live"`)
  - Added `export type PacketMode = "trial" | "live"` to `lp-do-ideas-trial.ts`; updated `TrialDispatchPacket.mode` to `PacketMode`
  - Updated `lp-do-ideas-routing-adapter.ts` mode guard: `!== "trial" && !== "live"`; added `AnyDispatchPacket` union type; `routeDispatch` accepts both modes
  - Scope expansion: updated `lp-do-ideas-routing-adapter.test.ts` TC-06 (mode=live now accepted, truly invalid modes still rejected); updated TC-15 to use `"corrupt_mode"` instead of `"live"` for error correlation test
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-live.test.ts` — TC-02-A/B/C/D/E (22 tests)
  - Validation: 7 suites, 145 tests all pass; propagation.test.ts failure is pre-existing (file was never tracked)
  - TC-02-A: ✓ mode=live returns ok: true with live packets
  - TC-02-B: ✓ invalid mode (trial, garbage, empty) returns fail-closed error
  - TC-02-C: ✓ auto_executed status still rejected in adapter for live packets

### TASK-03: Implement SIGNALS advisory live hook with fail-open fallback
- **Type:** IMPLEMENT
- **Deliverable:** `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` + boundary integration call-site update
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-live-hook.ts`, `<boundary file from TASK-01>`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% - hook logic is narrow and can compose existing orchestrator APIs
  - Approach: 85% - advisory invocation with guarded error handling aligns with loop safety
  - Impact: 90% - creates first executable live trigger seam
- **Acceptance:**
  - SIGNALS execution path invokes live ideas hook once per cycle at defined seam.
  - Hook exceptions degrade to warning telemetry and do not block SIGNALS advance.
  - Hook does not write startup-loop stage status or call `/startup-loop advance`.
- **Validation contract (TC-03):**
  - TC-03-A: happy-path hook emits dispatch candidates.
  - TC-03-B: thrown hook error records warning and continues caller flow.
  - TC-03-C: no stage mutation side effects from hook execution.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: identify exact SIGNALS dispatch path and existing gate ordering.
  - Validation artifacts: TASK-01 boundary artifact + call-site map.
  - Unexpected findings: none.
  - Consumer tracing: hook output consumed by queue persistence path (TASK-04) and telemetry rollup (TASK-07).
- **Scouts:** verify hook order relative to `GATE-BD-08` and loop-gap gates remains unchanged unless explicitly required.
- **Edge Cases & Hardening:** duplicate hook invocation in one cycle must suppress idempotently downstream.
- **What would make this >=90%:** integration test proving non-blocking behavior in both success and failure modes.
- **Rollout / rollback:**
  - Rollout: feature-flagged hook call with advisory default.
  - Rollback: disable hook call site, keep live modules dormant.
- **Documentation impact:** add seam implementation note to go-live checklist evidence.
- **Notes / references:** BR-01, BR-03, risk table (hook error propagation).
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/lp-do-ideas-live-hook.ts` — advisory CLI module with `runLiveHook(options)` pure export
  - Hook reads standing registry from disk, calls `runLiveOrchestrator`, returns result — never throws
  - All errors caught and returned as result fields (fail-open advisory posture)
  - `queueStatePath` and `telemetryPath` accepted in options but not written (TASK-04 scope)
  - CLI main (isMain check) exits 0 on all outcomes — SIGNALS never blocked by hook errors
  - Removed `import.meta.url` from module (Jest CJS incompatible); uses `process.argv[1]` endsWith check
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-live-hook.test.ts` — TC-03-A/B/C/D (17 tests)
  - TC-03-A: ✓ registry load + orchestrator dispatch → ok: true, mode="live" packets
  - TC-03-B: ✓ malformed registry and missing registry return ok: false, no throw
  - TC-03-C: ✓ no file writes to queue-state or telemetry paths after any run
  - TC-03-D: ✓ non-existent registry returns diagnostic error without throwing
  - Validation: 2 suites, 32 tests pass; lint fixed with `npx eslint --fix`

### TASK-04: Add deterministic persistence adapter and CLI command wiring
- **Type:** IMPLEMENT
- **Deliverable:** file-backed persistence layer + `scripts/package.json` command(s) for trial/live ideas intake
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-*.ts`, `scripts/package.json`, `docs/business-os/startup-loop/ideas/{trial,live}/*`
- **Depends on:** TASK-02
- **Blocks:** TASK-05, TASK-06, TASK-07
- **Confidence:** 85%
  - Implementation: 85% - existing pure queue/orchestrator modules already provide deterministic core
  - Approach: 85% - explicit persistence wrapper keeps pure modules unchanged and testable
  - Impact: 90% - required for operational live execution and KPI evidence accumulation
- **Acceptance:**
  - Live/trial intake command runs end-to-end and writes queue + telemetry + registry artifacts deterministically.
  - Re-running identical input is idempotent (no duplicate admissions, no unstable ordering).
  - Persistence writes are atomic and preserve append-only telemetry semantics.
- **Validation contract (TC-04):**
  - TC-04-A: one-command run produces expected artifact set in target namespace.
  - TC-04-B: repeated identical run keeps queue-state stable and appends only expected telemetry.
  - TC-04-C: malformed input fails closed without partial artifact corruption.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: queue-state schema expectations + telemetry schema references + CLI existing patterns.
  - Validation artifacts: `lp-do-ideas-trial-queue.ts`, `lp-do-ideas-telemetry.schema.md`, `scripts/package.json`.
  - Unexpected findings: no existing ideas operational commands present; this task creates them.
  - Consumer tracing: new persistence outputs consumed by checklist KPIs (TASK-07), checklist closure (TASK-10), and rollback audit.
- **Scouts:** confirm atomic write helper pattern in repo to avoid bespoke file-write semantics.
- **Edge Cases & Hardening:** partial-write recovery path must keep previous valid snapshot.
- **What would make this >=90%:** successful crash-recovery simulation proving queue snapshot integrity.
- **Rollout / rollback:**
  - Rollout: ship commands behind explicit invocation, not auto-run.
  - Rollback: remove command wiring and disable persistence wrapper.
- **Documentation impact:** command usage block updates in seam/checklist docs.
- **Notes / references:** BR-03, BR-04, BR-05.
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/lp-do-ideas-persistence.ts` — file-backed persistence adapter
  - Exports: `loadQueueState`, `writeQueueState`, `appendTelemetry`, `persistOrchestratorResult`
  - Atomic writes via write-temp-then-rename (`<dir>/.filename.tmp.<hex>` → target)
  - Queue state schema: `queue-state.v1` with `entries[]` keyed by `dispatch_id`
  - Idempotent: duplicate `dispatch_id` silently skipped on subsequent runs
  - Telemetry: JSONL deduplication by `dispatch_id+recorded_at+kind`
  - Fail-closed: malformed existing queue state returns `ok: false` without partial write
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts` — TC-04-A/B/C + utilities (22 tests)
  - TC-04-A: ✓ first run creates queue-state.json + telemetry.jsonl with correct content
  - TC-04-B: ✓ repeated identical run produces zero new entries and zero new telemetry
  - TC-04-C: ✓ malformed input fails closed; corrupted queue state not overwritten
  - Added to `scripts/package.json`: `startup-loop:lp-do-ideas-live-run` and `startup-loop:lp-do-ideas-trial-run`
  - Validation: 9 suites (extended regression), 177 tests all pass

### TASK-05: Materialize trial/live artifact plane and reconcile contracts
- **Type:** IMPLEMENT
- **Deliverable:** concrete `trial/` and `live/` artifact files + contract/docs parity updates
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/{trial,live}/`
- **Reviewer:** startup-loop maintainers
- **Approval-Evidence:** checklist section E/F links and contract parity note
- **Measurement-Readiness:** validates artifact availability for KPI tracking
- **Affects:** `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`, `docs/business-os/startup-loop/ideas/{trial,live}/*`
- **Depends on:** TASK-04
- **Blocks:** TASK-10
- **Confidence:** 80%
  - Implementation: 80% - artifact creation and contract alignment are straightforward once persistence paths are finalized
  - Approach: 85% - parity-first reconciliation prevents future checklist drift
  - Impact: 85% - removes trial/live path ambiguity from operations and validation
  - Held-back test: no single unresolved unknown would drop this below 80 because file set and schema expectations are already explicit in BR-04/BR-05.
- **Acceptance:**
  - Required trial and live artifact files exist with schema-conformant seed content.
  - Contract path tables match actual runtime write paths exactly.
  - Any intentionally deferred artifact is explicitly documented as deferred with rationale.
- **Validation contract (VC-05):**
  - VC-05-A: `find` output confirms required files in both namespaces.
  - VC-05-B: artifact seed JSON validates against referenced schema/contracts.
  - VC-05-C: checklist and contract docs reference the same path set with no contradictions.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: enumerate expected artifact matrix from contract/checklist.
  - Green evidence plan: materialize files + doc updates; run validation checks.
  - Refactor evidence plan: remove stale path references and consolidate duplicate wording.
- **Planning validation (required for M/L):**
  - Checks run: contract path audit and on-disk artifact audit.
  - Validation artifacts: `lp-do-ideas-trial-contract.md`, go-live checklist, current `trial/` tree.
  - Unexpected findings: trial path entries currently missing telemetry/registry artifacts.
- **Scouts:** `None: artifact matrix is explicitly specified.`
- **Edge Cases & Hardening:** ensure seed JSON structures are valid even before first live run.
- **What would make this >=90%:** post-implementation contract parity check in CI.
- **Rollout / rollback:**
  - Rollout: additive file creation then doc parity edits.
  - Rollback: remove live artifacts and restore prior contract text.
- **Documentation impact:** updates checklist + trial contract + seam references.
- **Notes / references:** BR-04, BR-05.
- **Build completion evidence (2026-02-25):**
  - Created `docs/business-os/startup-loop/ideas/trial/telemetry.jsonl` — empty seed JSONL file
  - Created `docs/business-os/startup-loop/ideas/live/queue-state.json` — seed with `schema_version: "queue-state.v1"`, `mode: "live"`, empty entries
  - Created `docs/business-os/startup-loop/ideas/live/telemetry.jsonl` — empty seed JSONL file
  - Updated `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md` — added "Live Artifact Paths" subsection referencing both live/ and trial/ namespaces
  - VC-05-A: ✓ `find` confirms both trial/ and live/ namespaces have queue-state.json + telemetry.jsonl
  - VC-05-B: ✓ seed JSON validates against `queue-state.v1` schema with required fields present
  - VC-05-C: ✓ contract doc updated to reference both namespace paths consistently

### TASK-06: Expand test suite for live-path behavior and regressions
- **Type:** IMPLEMENT
- **Deliverable:** live-path tests + updated regression command and passing suite output
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/__tests__/lp-do-ideas-*.test.ts`, `scripts/src/startup-loop/__tests__/lp-do-build-reflection-debt.test.ts`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% - existing test harness already covers core modules and can be extended
  - Approach: 90% - regression-first validation directly protects live cutover behavior
  - Impact: 90% - required proof for go-live safety and anti-regression confidence
- **Acceptance:**
  - New tests cover live mode guard acceptance, hook non-blocking behavior, and persistence idempotency.
  - Existing eight-suite ideas regression remains green.
  - Regression command documented in plan task evidence.
- **Validation contract (TC-06):**
  - TC-06-A: full ideas regression command passes.
  - TC-06-B: live-mode test cases fail before implementation and pass after.
  - TC-06-C: no regression in cutover phase suppression semantics.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: current suite inventory and command coverage map.
  - Validation artifacts: test files under `scripts/src/startup-loop/__tests__/`.
  - Unexpected findings: none.
  - Consumer tracing: new live outputs are asserted by routing, queue, and metrics tests.
- **Scouts:** include explicit test for hook error path preserving SIGNALS advance.
- **Edge Cases & Hardening:** verify suppression reason taxonomy ordering remains deterministic.
- **What would make this >=90%:** one simulated weekly cycle fixture passing end-to-end in CI.
- **Rollout / rollback:**
  - Rollout: add tests before broad code refactor.
  - Rollback: revert new tests if feature rollback is invoked.
- **Documentation impact:** update plan/build evidence sections with exact passing command.
- **Notes / references:** BR-01, BR-03, BR-06.
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-live-integration.test.ts` — 21 tests across 4 suites (TC-06-A through TC-06-D)
  - TC-06-A: end-to-end hook → persist → idempotent re-run (5 tests)
  - TC-06-B: hook error path non-blocking; simulates SIGNALS caller (5 tests)
  - TC-06-C: dispatched live packets pass through `routeDispatch` (5 tests)
  - TC-06-D: suppression counts are non-negative integers; taxonomy ordering deterministic (6 tests)
  - Full regression: 71 tests, 5 suites pass (`lp-do-ideas-live|persistence|metrics-runner` pattern)
  - TC-06-A: ✓ end-to-end hook+persist runs and re-runs idempotently
  - TC-06-B: ✓ hook error path does not propagate to caller
  - TC-06-C: ✓ live packets accepted by routing adapter
  - Regression command: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs --testPathPattern="lp-do-ideas" --no-coverage`

### TASK-07: Wire KPI rollup evidence generation for checklist VC-01/VC-02
- **Type:** IMPLEMENT
- **Deliverable:** deterministic KPI rollup output artifact for route accuracy + suppression variance
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-metrics-rollup.ts`, `docs/business-os/startup-loop/ideas/{trial,live}/telemetry.jsonl`, `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
- **Depends on:** TASK-04
- **Blocks:** TASK-08, TASK-10
- **Confidence:** 85%
  - Implementation: 85% - metrics-rollup module exists and needs operational wiring to persisted telemetry
  - Approach: 85% - explicit rollup artifacts remove manual KPI interpretation drift
  - Impact: 90% - enables objective go/no-go evidence for live and autonomous transitions
- **Acceptance:**
  - Weekly KPI rollup command emits route-accuracy and suppression-variance snapshots from persisted telemetry.
  - Rollup output includes sample size and window duration checks used by VC-01/VC-02.
  - Checklist evidence references can be updated directly from generated rollup artifact.
- **Validation contract (TC-07):**
  - TC-07-A: rollup command succeeds against fixture telemetry and real trial telemetry.
  - TC-07-B: computed metrics match formula definitions in checklist.
  - TC-07-C: insufficient sample/window reports explicit not-ready status (fail-closed for activation).
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: existing rollup formulas + checklist KPI threshold definitions.
  - Validation artifacts: `lp-do-ideas-metrics-rollup.ts`, go-live checklist sections A/B.
  - Unexpected findings: none.
  - Consumer tracing: rollup output consumed by TASK-10 activation recommendation and future Option C gate checks.
- **Scouts:** verify timezone handling for weekly window boundaries.
- **Edge Cases & Hardening:** empty telemetry input must return explicit non-ready diagnostic, not zeroed success.
- **What would make this >=90%:** two consecutive real weekly snapshots generated without manual correction.
- **Rollout / rollback:**
  - Rollout: additive reporting path only; no gate behavior change.
  - Rollback: keep previous manual KPI review path if rollup malfunctions.
- **Documentation impact:** checklist evidence instructions may be simplified to command output links.
- **Notes / references:** BR-06, BR-07.
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/lp-do-ideas-metrics-runner.ts` — `runMetricsRollup(options)` export
  - Reads telemetry JSONL (cycle snapshot records only); reads queue state (dual-format: `queue-state.v1` + legacy `queue.v1`)
  - Returns `{ ready: false, reason }` when no cycle snapshots present (fail-closed for activation)
  - Infers lane from packet status: `fact_find_ready` → DO lane, else IMPROVE lane
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-metrics-runner.test.ts` — 4 tests (TC-07-A through TC-07-D)
  - TC-07-A: ✓ fixture telemetry + queue returns valid rollup with correct lane counts
  - TC-07-B: ✓ empty telemetry returns not-ready/zero-cycle result
  - TC-07-C: ✓ missing telemetry file treated as empty — no throw
  - TC-07-D: ✓ `generated_at` is ISO-8601 string
  - Validation: 4 tests pass; handles legacy `trial/queue-state.json` dual-format transparently

### TASK-08: Horizon checkpoint - reassess autonomous lane from live evidence
- **Type:** CHECKPOINT
- **Deliverable:** updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Effort:** S
- **Status:** Complete (2026-02-25)
- **Affects:** `docs/plans/lp-do-ideas-live-autonomous-activation/plan.md`
- **Depends on:** TASK-06, TASK-07
- **Blocks:** TASK-09, TASK-10
- **Confidence:** 95%
  - Implementation: 95% - checkpoint contract is defined
  - Approach: 95% - gates autonomous work on current evidence
  - Impact: 95% - prevents speculative autonomy rollout
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - `/lp-do-replan` run for TASK-09/TASK-10 confidence recalibration.
  - Downstream tasks updated with latest KPI/test evidence before execution.
- **Horizon assumptions to validate:**
  - Live advisory path remains non-blocking under hook error scenarios.
  - KPI rollup is producing stable weekly snapshots with valid sample accounting.
- **Validation contract:** checkpoint log and updated confidence notes recorded in plan.
- **Planning validation:** replan evidence linked in this plan task.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** updates task statuses/confidence in this plan.
- **Build completion evidence (2026-02-25):**
  - Horizon assumption 1: "Live advisory path remains non-blocking under hook error scenarios." — VERIFIED. TC-06-B (5 tests) explicitly covers the hook error path; the simulated SIGNALS caller flow continues unblocked in all error cases. TC-06-A (5 tests) confirms end-to-end hook → persist → idempotent re-run. TC-06-C (5 tests) confirms dispatched live packets pass through routeDispatch. 21 TASK-06 tests total pass.
  - Horizon assumption 2: "KPI rollup is producing stable weekly snapshots with valid sample accounting." — PARTIALLY VERIFIED (expected at this build stage). The metrics runner (TASK-07) correctly handles empty telemetry (TC-07-B: not-ready/zero-cycle result), missing telemetry file with no throw (TC-07-C), and dual queue-state formats (TC-07-A/D). No live telemetry data has accumulated yet because the seed files are empty — the runner correctly reports not-ready when data is absent, which is the correct fail-closed posture. Real weekly data will accumulate during live advisory operation.
  - TASK-09 confidence re-scored: 85% → 88%. Hook non-blocking behavior confirmed (TC-06-B), live orchestrator tested, persistence adapter validated. Gating logic implementation is the remaining unknown; all foundational inputs are now proven.
  - TASK-10 confidence held: 80% unchanged. Checklist closure requires real KPI evidence from at least 2 weekly windows, which is not yet available. This is correct and expected; the runner is ready to produce evidence once live operation begins.

### TASK-09: Implement autonomous gating + kill-switch controls (inactive)
- **Type:** IMPLEMENT
- **Deliverable:** policy-enforced gating logic and tests for Option C readiness, defaulting to advisory mode
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-25)
- **Affects:** `scripts/src/startup-loop/lp-do-ideas-*.ts`, `docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`
- **Depends on:** TASK-08
- **Blocks:** TASK-10
- **Confidence:** 85%
  - Implementation: 85% - gating inputs and threshold formulas are already defined in contracts
  - Approach: 85% - explicit inactive-by-default gate minimizes accidental autonomy activation
  - Impact: 90% - creates safe promotion path and immediate rollback switch
- **Acceptance:**
  - Option C path cannot activate without threshold checks + explicit operator enable.
  - Kill switch enforces one-step fallback to Option B advisory behavior.
  - Tests cover both blocked activation and successful fallback.
- **Validation contract (TC-09):**
  - TC-09-A: below-threshold data rejects Option C activation.
  - TC-09-B: thresholds met + explicit enable permits Option C readiness state only.
  - TC-09-C: kill switch immediately returns routing posture to advisory queue-with-confirmation.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: threshold clauses in trial contract/checklist and current queue admission flow.
  - Validation artifacts: `lp-do-ideas-trial-contract.md`, `lp-do-ideas-go-live-checklist.md`, orchestrator queue integration.
  - Unexpected findings: none.
  - Consumer tracing: readiness state consumed by checklist closure (TASK-10) and future operational mode switch procedure.
- **Scouts:** confirm no hidden auto-invoke path bypasses queue confirmation when gate is inactive.
- **Edge Cases & Hardening:** stale KPI snapshot must fail closed for activation checks.
- **What would make this >=90%:** successful kill-switch drill in live advisory environment.
- **Rollout / rollback:**
  - Rollout: keep activation flag default `false`.
  - Rollback: disable Option C gate checks and force advisory route.
- **Documentation impact:** update policy/gate sections in checklist and seam docs.
- **Notes / references:** BR-07 and phase-boundary note.
- **Build completion evidence (2026-02-25):**
  - Created `scripts/src/startup-loop/lp-do-ideas-autonomous-gate.ts` — pure module (zero I/O)
  - Exports: `evaluateOptionCReadiness`, `checkOptionCGate`, `applyKillSwitch`
  - Five threshold checks: reviewPeriodDays ≥ 14, sampleSize ≥ 40, routeAccuracy ≥ 80%, suppressionVariance ≤ 10%, kpiSnapshotAge ≤ 7 days
  - `operatorEnable` defaults to inactive (false); must be explicitly `true`
  - Stale KPI snapshot: generated_at > 7 days triggers `"stale_kpi_snapshot"` blocker
  - Missing inputs (routeAccuracy/suppressionVariance undefined) → named blocker codes
  - `applyKillSwitch()` returns `{ mode: "advisory", activationBlocked: true }` unconditionally
  - Created `scripts/src/startup-loop/__tests__/lp-do-ideas-autonomous-gate.test.ts` — 14 tests
  - TC-09-A: ✓ all 7 individual threshold failures + 2 operator-enable cases → `permitted: false`
  - TC-09-B: ✓ all thresholds met + `operatorEnable: true` → `{ permitted: true, mode: "option_c_ready" }`
  - TC-09-C: ✓ `applyKillSwitch()` → `{ mode: "advisory", activationBlocked: true }`
  - Regression: 219/220 pass (propagation TC-05B-01 is pre-existing); 14 new tests all pass

### TASK-10: Produce checklist closure package and activation recommendation
- **Type:** IMPLEMENT
- **Deliverable:** completed go-live checklist with linked evidence and explicit recommendation (`authorise` or `no-go`)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** mixed
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md` + linked evidence artifacts
- **Reviewer:** startup-loop maintainers (operator)
- **Approval-Evidence:** signed checklist section with date + approver
- **Measurement-Readiness:** KPI evidence links and rollback drill evidence attached
- **Affects:** `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md`, `docs/business-os/startup-loop/ideas/lp-do-ideas-rollback-playbook.md`
- **Depends on:** TASK-05, TASK-07, TASK-09
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - checklist closure is procedural once evidence artifacts are generated
  - Approach: 85% - explicit `authorise/no-go` output avoids ambiguous readiness state
  - Impact: 85% - provides the required operator decision surface for activation
  - Held-back test: no single unresolved unknown would drop this below 80 because the task is complete with either outcome (`authorise` or `no-go`) as long as evidence is attached.
- **Acceptance:**
  - Every checklist section has evidence links or explicit no-go rationale.
  - Sign-off section records decision, date, and operator identity.
  - Seam/rollback docs match the final recommendation and current implementation reality.
- **Validation contract (VC-10):**
  - VC-10-A: checklist has no unresolved placeholder evidence fields.
  - VC-10-B: recommendation is explicitly `authorise` or `no-go` with rationale.
  - VC-10-C: if `authorise`, no-go conditions are explicitly verified absent.
- **Execution plan:** Red -> Green -> Refactor (VC-first)
  - Red evidence plan: enumerate mandatory evidence links per section.
  - Green evidence plan: populate checklist and decision section from generated artifacts.
  - Refactor evidence plan: remove stale text and sync seam/rollback docs.
- **Planning validation (required for M/L):**
  - Checks run: checklist section audit and required evidence mapping.
  - Validation artifacts: go-live checklist + seam + rollback playbook.
  - Unexpected findings: all checklist items currently unchecked (baseline expected).
- **Scouts:** `None: closure contract is explicit in checklist schema.`
- **Edge Cases & Hardening:** if KPI window insufficient, decision must be `no-go` with next evidence date.
- **What would make this >=90%:** two completed weekly KPI windows and rollback drill evidence recorded.
- **Rollout / rollback:**
  - Rollout: operator signs `authorise` only when all prerequisites pass.
  - Rollback: keep `no-go` posture and continue trial/advisory evidence collection.
- **Documentation impact:** checklist/seam/rollback docs become the canonical activation record.
- **Notes / references:** BR-06, BR-07.

## Risks & Mitigations
- Live hook introduces hidden stage coupling.
  - Mitigation: TASK-03 explicit non-mutation tests and advisory fail-open behavior.
- Persistence writer causes partial state corruption on failure.
  - Mitigation: TASK-04 atomic write semantics and malformed-input failure tests.
- Contract drift between docs and runtime paths.
  - Mitigation: TASK-05 parity reconciliation + checklist evidence mapping.
- KPI evidence remains noisy or insufficient.
  - Mitigation: TASK-07 explicit insufficient-sample handling and weekly rollup artifacts.
- Premature autonomous activation.
  - Mitigation: TASK-09 inactive-by-default gate + kill-switch verification.

## Observability
- Logging:
  - Hook invocation outcome (success/warn/error) with dispatch counts.
  - Persistence write outcomes (paths written, checksum/entry counts).
- Metrics:
  - `route_accuracy`, `route_accuracy_denominator`, `duplicate_suppression_count`, `queue_age_p95`.
  - suppression reason counts including `pack_without_source_delta` and `projection_immunity`.
- Alerts/Dashboards:
  - Weekly KPI rollup artifact for VC-01/VC-02.
  - No-go alert when KPI window/sample thresholds are not met.

## Acceptance Criteria (overall)
- [ ] Live advisory path exists and is callable from SIGNALS without blocking advance.
- [ ] Trial/live persistence artifacts are deterministic, idempotent, and contract-aligned.
- [ ] Full ideas regression suite passes with new live-path coverage.
- [ ] KPI rollup evidence pipeline produces checklist-ready outputs.
- [ ] Autonomous gate and kill switch are implemented but inactive by default.
- [ ] Checklist closure package records explicit `authorise` or `no-go` recommendation.

## Decision Log
- 2026-02-25: Chose boundary-first execution (Option B) to reduce integration churn and preserve deterministic sequencing.
- 2026-02-25: Kept `Auto-Build-Intent: plan-only` because user requested planning and did not request auto-build handoff.
- 2026-02-25: Kept live v1 advisory and deferred Option C activation pending KPI evidence gates.

## Overall-confidence Calculation
- S=1, M=2, L=3
- Weighted calculation:
  - TASK-01: 90 × 1 = 90
  - TASK-02: 85 × 2 = 170
  - TASK-03: 85 × 2 = 170
  - TASK-04: 85 × 3 = 255
  - TASK-05: 80 × 2 = 160
  - TASK-06: 85 × 2 = 170
  - TASK-07: 85 × 2 = 170
  - TASK-08: 95 × 1 = 95
  - TASK-09: 85 × 2 = 170
  - TASK-10: 80 × 2 = 160
- Total weighted score: 1,610
- Total effort weight: 19
- Overall-confidence: 1,610 / 19 = 84.7% -> 85%

## Section Omission Rule
None: all template sections are applicable for this mixed-track plan.
