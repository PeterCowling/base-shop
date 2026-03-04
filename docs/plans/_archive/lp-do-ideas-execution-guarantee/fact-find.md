---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: lp-do-ideas-execution-guarantee
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/lp-do-ideas-execution-guarantee/plan.md
Trigger-Source: dispatch-routed
Dispatch-ID: IDEA-DISPATCH-20260302-0095
---

# lp-do-ideas Execution Guarantee Fact-Find Brief

## Scope

### Summary

When the `lp-do-fact-find` skill is invoked from the queue pipeline and completes, the `queue-check-gate.md` instruction tells the agent to write `processed_by` back into `queue-state.json`. But there is no atomicity contract between that write and the actual fact-find execution. If the agent writes `processed_by` before (or independently of) persisting the fact-find artifact, or if execution fails silently, the queue records routing intent without the artifact ever landing on disk.

Operator-stated evidence: 19 of 43 selected dispatches had `processed_by` set but no `fact-find.md` on disk (as of dispatch context; queue has since grown). Direct measurement at investigation time: 67 dispatches carry `processed_by`; of these, 22 have a `fact_find_path` present on disk, 31 have a `fact_find_path` pointing to a missing file, and 14 have `processed_by` but no `fact_find_path` field (these are `auto_executed` metadata entries carrying only `route` and `processed_at` — not briefing entries). The actionable gap is 31 entries where a fact-find path is claimed but no file exists (queue-state.json as of 2026-03-02).

The fix scope is: make the `processed_by` write conditional on artifact existence, OR add a re-queue detection pass that finds `processed_by`-without-artifact entries and reinstates them as `enqueued`. This is a reliability fix only — no new autonomy.

### Goals
- Prevent queue entries from being permanently marked as processed when the fact-find artifact was never produced.
- Give the operator a way to detect and recover missing-artifact dispatches without manual audit.
- Keep the fix safe to deploy without changing trial mode contract or operator confirmation gates.

### Non-goals
- Automating fact-find invocation (Option C autonomy) — explicitly out of scope.
- Removing operator confirmation from the dispatch pipeline.
- Changing T1/T2 trigger thresholds or dispatch routing logic.
- Automatically re-queuing historical `processed_by`-without-artifact entries — the detection script reports only. Any re-queue action on historical entries requires explicit operator confirmation per a separate operator-initiated step.

### Constraints & Assumptions
- Constraints:
  - The fix must not add new autonomy or remove operator confirmation gates (trial contract Section 2 is inviolable).
  - The fix must leave the existing `queue-state.json` schema intact — no schema version bump required for a no-op writer change.
  - The queue-check-gate instruction is executed by an LLM agent (Claude), not a TypeScript module. Any machine-enforced guard must live at the persistence layer or in a detection script, not solely in prose instructions.
- Assumptions:
  - The root cause is in the queue-check-gate prose instruction: it tells the agent to write `processed_by` without requiring the artifact to exist first. The agent can write it eagerly (before the fact-find runs) or when the fact-find fails silently mid-execution.
  - The `queue-state.json` file being used in production is the flat `queue.v1` format (not the `PersistedQueueState` schema from `lp-do-ideas-persistence.ts`), maintained by the agent directly rather than via the TypeScript persistence adapter.
  - The `lp-do-ideas-persistence.ts` TypeScript adapter handles orchestrator-emitted dispatch packets — it does not handle the `processed_by` field, which is written only by the LLM agent during queue-check-gate Phase 6.

## Outcome Contract

- **Why:** The queue pipeline records routing intent without enforcing execution — 31/67 dispatches with `processed_by` set have no fact-find artifact on disk. This creates false confidence that work was done and permanently loses those dispatches from the queue without any output.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this fix, a dispatch entry will only be marked as processed when the fact-find artifact can be verified on disk, and any existing `processed_by`-without-artifact entries can be detected and reported by a read-only detection utility.
- **Source:** auto

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/_shared/queue-check-gate.md` — The LLM instruction that governs when and how `processed_by` is written back to `queue-state.json`. This is the primary failure surface: line 36–39 instructs the agent to "populate `processed_by` in the packet" on artifact persistence, but the instruction is prose — no runtime guard enforces that the artifact file exists before the write.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — The live queue file. Top-level shape: `{ queue_version: "queue.v1", mode, created_at, last_updated, counts, dispatches[] }`. Each dispatch entry may have a `processed_by` object with `{ route, processed_at, queue_state, fact_find_slug, fact_find_path }`.

### Key Modules / Files

- `.claude/skills/_shared/queue-check-gate.md` — The shared gate instruction consumed by both `lp-do-fact-find` (Phase 0) and `lp-do-briefing` (Phase 0). The `processed_by` write instruction is at lines 36–39. **This is the primary change target for Option 1 (instruction hardening).**
- `scripts/src/startup-loop/lp-do-ideas-persistence.ts` — TypeScript persistence adapter. Handles `persistOrchestratorResult()`, `loadQueueState()`, `writeQueueState()`, `appendTelemetry()`, `appendClassifications()`. Does NOT handle `processed_by` — this field is agent-written only. **This is the target for Option 2 (detection/re-queue script).**
- `scripts/src/startup-loop/lp-do-ideas-trial-queue.ts` — In-memory `TrialQueue` class with `enqueue()`, `advance()`, `planNextDispatches()`. The `advance()` method transitions `enqueued → processed`. This module does not interact with `processed_by` — it operates on the in-memory queue before serialization.
- `scripts/src/startup-loop/lp-do-ideas-routing-adapter.ts` — `routeDispatch()` and `routeDispatchV2()`. Pure functions; produce invocation payloads but do not write queue state.
- `scripts/src/startup-loop/lp-do-ideas-trial.ts` — `runTrialOrchestrator()`. Pure function; produces dispatch packets. Does not read or write `queue-state.json`.
- `.claude/skills/lp-do-fact-find/SKILL.md` — Fact-find skill. Phase 6 is where the artifact is persisted; Phase 0 is where the queue-check-gate runs and `processed_by` gets written.

### Data & Contracts

- Types/schemas/events:
  - `queue-state.json` uses `queue.v1` schema (agent-maintained, not validated by TypeScript). The `dispatches[]` array contains raw dispatch packets with an optional `processed_by` object appended by the agent.
  - `processed_by` object shape: `{ route: "dispatch-routed", processed_at: ISO-8601, queue_state: "processed", fact_find_slug: string, fact_find_path: string }`.
  - The TypeScript `PersistedQueueState` type (`queue-state.v1`) is a separate schema used by the orchestrator persistence path and does not include `processed_by`.
  - There is no JSON Schema validation for `processed_by` — it is purely a prose-governed write.
- Persistence:
  - `queue-state.json` is written by the LLM agent (direct JSON edit) in the queue-check-gate path.
  - `persistOrchestratorResult()` writes new dispatch packets; it does not read or write `processed_by`.
  - `atomicWrite()` in the persistence adapter uses temp-rename for crash safety — this protection is absent from agent-side writes.
- API/contracts:
  - Trial contract Section 2 (Option B — Queue with Confirmation): "Operator reviews queue and confirms each invocation explicitly". The `processed_by` write is the operator-confirmation record. If the agent writes it before the work is done, the confirmation record is false.
  - Trial contract Section 7 (Queue Lifecycle): `enqueued → processed` requires "operator confirms invocation". The prose does not say "and artifact exists on disk".

### Dependency & Impact Map

- Upstream dependencies:
  - Queue-check-gate.md instruction governs agent behavior → queue-state.json content.
  - lp-do-fact-find Phase 6 (artifact persistence) → the artifact that `processed_by.fact_find_path` should point to.
- Downstream dependents:
  - Any tooling or human that reads `queue_state: "processed"` as proof of work completion relies on the artifact actually being present.
  - The detection/re-queue use case (next iteration) would read `processed_by.fact_find_path` to verify artifact existence.
  - `lp-do-ideas-metrics-rollup.ts` and any KPI counting that uses `processed_count` from `queue-state.json` would overcount completed work.
- Likely blast radius:
  - Change to `queue-check-gate.md`: affects all future `lp-do-fact-find` and `lp-do-briefing` invocations that go through the queue path. No TypeScript module is changed.
  - Detection script (new file): read-only. Produces a report of missing-artifact entries. Does not write to `queue-state.json`.

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (scripts package)
- Commands: `pnpm --filter scripts startup-loop:test` (governed test runner pattern: `pnpm -w run test:governed -- jest -- --config=scripts/jest.config.cjs`)
- CI integration: scripts tests run in CI

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `lp-do-ideas-persistence.ts` | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-persistence.test.ts` | Covers `persistOrchestratorResult`, `loadQueueState`, `writeQueueState`, `appendTelemetry`, `appendClassifications`. Does NOT cover `processed_by` (agent-written field). |
| `lp-do-ideas-trial-queue.ts` | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-trial-queue.test.ts` | Covers `TrialQueue.enqueue()`, `advance()`, `planNextDispatches()`. No tests for `processed_by`. |
| `lp-do-ideas-routing-adapter.ts` | Unit | `scripts/src/startup-loop/__tests__/lp-do-ideas-routing-adapter.test.ts` | Covers routing logic. No queue state writes. |
| `queue-check-gate.md` | None | — | Prose instruction — no automated tests. No regression possible without runtime harness. |

#### Coverage Gaps

- No tests for the detection path: "find dispatches where `processed_by` is set but `fact_find_path` does not exist on disk". This is entirely new.
- No tests for write-back behavior — but write-back is out of scope for this fix (detection script is read-only by default).
- The queue-check-gate instruction change has no test coverage by nature (prose-only). Coverage relies on any agent following the updated instruction correctly.

#### Testability Assessment

- Easy to test:
  - A new TypeScript detection function `detectMissingArtifacts(queueStatePath, basedir)` that returns a list of dispatch entries where `processed_by.fact_find_path` does not exist on disk. This is pure file I/O with no side effects — trivially unit-testable with a tmp dir fixture.
- Hard to test:
  - The queue-check-gate instruction change itself (prose — no automated testing).
  - The "agent writes `processed_by` before artifact exists" failure mode — requires an integration test with a mocked agent, which is out of scope.
- Test seams needed:
  - The detection function should accept an injectable `fs.existsSync`-equivalent and a `basedir` parameter to make it testable with fixture files in `tmpdir`.

#### Recommended Test Approach

- Unit tests for: `detectMissingArtifacts()` (new detection function) — at minimum 3 cases: all present, some missing, `processed_by` absent (should not count).
- Integration tests for: none required for this scope (the fix is a prose change + a detection utility).
- E2E tests for: not applicable.
- Contract tests for: not applicable.

### Recent Git History (Targeted)

- `scripts/src/startup-loop/lp-do-ideas-persistence.ts` — Last substantively changed in `e926cc2957` (startup-loop TASK-03+04). No `processed_by` handling has ever been added — this is consistent with it being agent-maintained only.
- `.claude/skills/_shared/queue-check-gate.md` — Last changed in `688a77678f` (lp-do-skills token efficiency Wave 1). The `processed_by` write instruction has been in place since initial authoring; no safety guard has been added.
- `docs/business-os/startup-loop/ideas/trial/queue-state.json` — Currently modified (in git status). The file has accumulated 128 entries with the gap pattern described above.

## Questions

### Resolved

- Q: Does any TypeScript module write `processed_by`?
  - A: No. Grep across all `scripts/src/startup-loop/*.ts` for `processed_by` returns no results. The field is written exclusively by the LLM agent following `queue-check-gate.md`.
  - Evidence: `grep -rn "processed_by" scripts/src/startup-loop/` → no output.

- Q: What is the gap count? (operator stated 19/43; current actual?)
  - A: At investigation time: 31 of 67 `processed_by` entries point to a file path that does not exist on disk. The discrepancy from the operator's 19/43 figure is because the queue has grown since the dispatch was created.
  - Evidence: Python analysis of `queue-state.json` against `os.path.exists()` for each `fact_find_path`.

- Q: Are there two different queue-state schemas in use?
  - A: Yes. The agent-maintained `queue-state.json` uses `queue.v1` (flat dispatch array). The TypeScript `PersistedQueueState` uses `queue-state.v1` (entries-wrapped format). These are separate schemas. The `processed_by` field only exists in `queue.v1`. The `lp-do-ideas-persistence.ts` adapter is not used for the agent-maintained file.
  - Evidence: `queue-state.json` top-level keys: `queue_version: "queue.v1"`. `lp-do-ideas-persistence.ts` `PersistedQueueState.schema_version: "queue-state.v1"`.

- Q: Is the `processed_by` write instruction conditional on artifact existence?
  - A: No. `queue-check-gate.md` lines 36–39 say "On artifact persistence, populate `processed_by`" — but "artifact persistence" is the fact-find Phase 6 step, and the instruction does not require the agent to verify the file exists on disk before writing `processed_by`. The agent can write it at any time once it has the slug and path values, even if the write fails partway through.
  - Evidence: `.claude/skills/_shared/queue-check-gate.md` lines 36–39, direct read.

- Q: Does the trial contract need to change?
  - A: No change to the contract is required. The contract already says `enqueued → processed` when "operator confirms invocation". Tightening the queue-check-gate instruction to require artifact existence is consistent with the contract — it is not a new policy, just a tighter implementation of the existing policy.
  - Evidence: `lp-do-ideas-trial-contract.md` Section 7.

### Open (Operator Input Required)

- Q: Should the detection script ever write back to `queue-state.json` (e.g. to clear a false `processed_by`) or remain permanently read-only?
  - Why operator input is required: A write-back mode would allow future tooling to clean up the queue automatically. Some operators may prefer this; others may want the queue to be append-only except for the agent pipeline. The default (report-only) is safe and does not require operator input to build, but a write-back mode would be a small scope extension.
  - Decision impacted: Whether a `--fix` flag is added to the detection utility.
  - Decision owner: Operator (Peter).
  - Default assumption: Detection script is permanently report-only. Write-back is never added automatically. This is consistent with the trial contract's Option B posture and keeps the utility safe to run at any time.

## Confidence Inputs

- Implementation: 92%
  - Evidence: The root cause is fully understood. The fix surface is small: one prose instruction file + one new utility function. No TypeScript production paths change.
  - What raises to 95%: confirm the re-queue scope decision (open question above) before build starts.
- Approach: 90%
  - Evidence: Two well-defined options exist (instruction hardening only, or instruction hardening + detection script). Both are safe. The recommended approach (both) is clearly bounded.
  - What raises to 95%: operator confirms detection script scope (report-only default is assumed).
- Impact: 85%
  - Evidence: The fix prevents future `processed_by`-without-artifact entries. It does not recover historical entries (by default). All trial contract invariants are preserved.
  - What raises to 90%: if operator chooses to enable re-queue, the impact expands to recovering historical gaps.
- Delivery-Readiness: 90%
  - Evidence: No build dependencies, no TypeScript schema changes, no migrations. Detection function is a new utility with no callers to update.
  - What raises to 95%: confirmation that re-queue scope is report-only (simplifies the build).
- Testability: 88%
  - Evidence: Detection function is purely testable. Queue-check-gate change has no automated test coverage by nature (prose instruction), but the risk of regression there is low — the agent will follow the updated instruction.
  - What raises to 90%: Write 3 unit tests for the detection function covering all nominal paths.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agent ignores updated queue-check-gate instruction | Low | Medium | The instruction change is unambiguous. The verification step is a file existence check, not an inference. |
| Detection script re-queues legitimately abandoned dispatches | Medium (if re-queue enabled) | Low (noise only) | Default to report-only; require explicit operator confirmation before any re-queue action. |
| Concurrent agent writes to queue-state.json cause lost updates | Low | Medium | The queue-check-gate is a single-agent operation by convention. In a multi-agent session, concurrent writers could race. Mitigated by the existing writer-lock policy (`scripts/agents/with-writer-lock.sh`) — the fact-find skill runs under this lock. The detection script is read-only and does not need locking. |
| TypeScript `PersistedQueueState` and agent `queue.v1` schema diverge further | Low | Low | These two schemas serve different code paths and are already diverged. No convergence needed for this fix. |
| Detection script misidentifies valid paths (case sensitivity, relative vs absolute) | Low | Low | Normalize paths using the same `basedir` as the artifact output convention. Cover with unit tests. |

## Planning Constraints & Notes

- Must-follow patterns:
  - Trial contract Section 2 (Option B) must not be weakened. The queue-check-gate update must not add any auto-invocation.
  - The detection script must be read-only by default. Any write path requires explicit operator approval and must be documented as a separate operator action.
  - No schema changes to `queue-state.json` are required. The fix is additive (stricter gate) not structural.
- Rollout/rollback expectations:
  - The queue-check-gate change is effective immediately after the file is updated. No deploy required.
  - The detection script is a new utility. It can be invoked on-demand; it does not need to be wired into any CI pipeline.
- Observability expectations:
  - After the fix, `processed_by`-without-artifact count should remain 0 for all new dispatches. The detection script can be re-run periodically to confirm.

## Suggested Task Seeds (Non-binding)

- TASK-01: Update `.claude/skills/_shared/queue-check-gate.md` to require artifact existence verification before writing `processed_by`. The agent must confirm the `fact_find_path` file exists on disk (via `ls` or `Read` tool) before setting `processed_by`. If the file does not exist, the agent must not write `processed_by` and must surface an error.
- TASK-02: Add a `detectMissingArtifacts(queueStatePath, basedir)` TypeScript utility function to a new file (e.g. `scripts/src/startup-loop/lp-do-ideas-queue-audit.ts`) that reads `queue-state.json`, iterates `dispatches[]`, and returns entries where `processed_by.fact_find_path` does not exist on disk.
- TASK-03: Write unit tests for `detectMissingArtifacts()` covering: all-present (returns empty), some-missing (returns correct subset), no-`processed_by` (not counted).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Updated `queue-check-gate.md` with artifact existence verification step.
  - New `lp-do-ideas-queue-audit.ts` with `detectMissingArtifacts()` function.
  - Unit tests for `detectMissingArtifacts()` (3 nominal cases).
- Post-delivery measurement plan:
  - Re-run detection script after build to confirm 0 new `processed_by`-without-artifact entries in subsequent dispatches.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| queue-check-gate.md instruction (root cause) | Yes | None | No |
| `processed_by` write path in TypeScript modules | Yes | None — field is agent-written only, no TS code involved | No |
| `queue-state.json` schema (queue.v1 vs queue-state.v1 distinction) | Yes | None — two schemas confirmed distinct and non-conflicting | No |
| Existing test coverage for `processed_by` | Yes | None — confirmed no existing tests for this field | No |
| Trial contract compliance of proposed fix | Yes | None — fix consistent with Section 2 and Section 7 | No |
| Detection function testability seams | Yes | None — injectable fs seam identified | No |
| Historical gap count measurement | Yes | None — 31/67 confirmed by script | No |

## Scope Signal

Signal: right-sized

Rationale: The fix is limited to a prose instruction change (one file) and a new utility function (one file + tests). The root cause is fully isolated to the `queue-check-gate.md` write ordering. No TypeScript production modules, schemas, or pipeline components need to change. Expanding scope to include historical re-queue would require operator decision and is deliberately deferred.

## Evidence Gap Review

### Gaps Addressed

- Confirmed that `processed_by` is agent-written only — no TypeScript module writes this field.
- Confirmed the exact queue-state schema format (`queue.v1` flat array, not `queue-state.v1` PersistedQueueState).
- Measured the actual gap count (31/67 entries) from live data.
- Confirmed that trial contract does not need to change for this fix.
- Identified that the detection function is purely testable with injectable seams.

### Confidence Adjustments

- Implementation confidence starts at 92% (not 95%) because the re-queue scope decision (open question) could add modest complexity. If report-only is confirmed, this rises to 95%.
- No downward adjustments made — all evidence is confirmed from code/files.

### Remaining Assumptions

- Detection script is report-only by default. No write-back mode is in scope for this build.
- The 31-entry missing-path count and 14-entry no-path count are a snapshot as of 2026-03-02. The count may change if additional dispatches are processed before the build executes.
- The 14 entries with `processed_by` but no `fact_find_path` field are `auto_executed` metadata entries (they carry only `route` and `processed_at`). These are not part of the actionable gap for this fix — the detection script will filter them out by checking for `fact_find_path` presence before testing existence.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None (open question about re-queue scope is advisory — default assumption of report-only is safe to build against)
- Recommended next step: `/lp-do-plan lp-do-ideas-execution-guarantee --auto`
