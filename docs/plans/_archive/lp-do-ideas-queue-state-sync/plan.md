---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02 (all tasks complete)
Critique-Rounds: 3
Critique-Verdict: credible
Critique-Score: 4.5
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: lp-do-ideas-queue-state-sync
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# lp-do-ideas Queue-State Sync Plan

## Summary

When `lp-do-build` completes the full build + archive cycle for a plan, the originating dispatch in `queue-state.json` is not automatically marked completed. This plan adds a new TypeScript module `lp-do-ideas-queue-state-completion.ts` with an exported `markDispatchesCompleted()` function that atomically writes `completed_by` and updates `queue_state: "completed"` for any dispatches whose `processed_by.fact_find_slug` matches the archived feature slug. The module is idempotent (skips already-completed dispatches), recomputes the `counts` block from the live `dispatches[]` array, and is invoked as step 7.5 of the lp-do-build post-build flow inside the writer lock scope. A companion test file covers 6 TC cases including idempotency, multi-dispatch match, and counts recomputation.

## Active tasks
- [x] TASK-01: Implement `lp-do-ideas-queue-state-completion.ts` with tests — Complete (2026-03-02)
- [x] TASK-02: Insert step 7.5 into `lp-do-build/SKILL.md` post-build flow — Complete (2026-03-02)

## Goals
- Automate writing `completed_by` + `queue_state: "completed"` to queue-state.json at the end of every build cycle.
- Keep the `counts` block accurate after each write by recomputing from the full `dispatches[]` array.
- Make the hook idempotent: safe to re-run with the same slug without double-mutation.
- Document the hook as a required step in `lp-do-build/SKILL.md` with explicit writer-lock scope.

## Non-goals
- Modifying the in-memory `TrialQueue` class.
- Extending the `QueueState` TypeScript union to include `"completed"` (separate tidy-up).
- Backfilling the 5 stale brikette-sales-funnel-analysis dispatches (data-repair task).
- Touching lp-do-ideas-execution-guarantee logic (parallel agent).

## Constraints & Assumptions
- Constraints:
  - Idempotent: second call with same slug is a no-op.
  - Must not mutate dispatches already in `queue_state: "completed"`.
  - Atomic write (temp-rename) — same pattern as `lp-do-ideas-persistence.ts`.
  - No in-memory queue object dependency.
  - Writer lock must be acquired before step 7.5 fires; the hook and commit are one atomic unit.
  - Counts shape must remain stable (no new keys added for unknown variants).
- Assumptions:
  - `processed_by.fact_find_slug` is the canonical lookup key (confirmed from 11 existing completed entries).
  - `completed_by` schema: `{ plan_path: string; completed_at: string; outcome: string }`.
  - Both `status` and `queue_state` must be set to `"completed"` (confirmed from live data).

## Inherited Outcome Contract

- **Why:** Build completion is not auto-synced to queue-state.json. After a plan is archived, dispatches that triggered it remain in `queue_state: "auto_executed"` indefinitely. The `counts.completed` metric therefore undercounts actual throughput and the `counts.auto_executed` count accumulates stale entries. The hook closes this gap deterministically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After lp-do-build archives any plan, dispatches linked to that plan by `processed_by.fact_find_slug` are automatically written to `queue_state: "completed"` with `completed_by` populated. The operation is idempotent and does not touch already-completed dispatches.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/lp-do-ideas-queue-state-sync/fact-find.md`
- Key findings used:
  - `processed_by.fact_find_slug` confirmed as lookup key from 11 existing completed entries.
  - `completed_by` schema `{ plan_path, completed_at, outcome }` confirmed from live data.
  - Both `status` and `queue_state` fields must be written (confirmed from live data).
  - `counts` block must be recomputed from `dispatches[]` array (live drift of 4 observed).
  - Writer lock scope clarification: must cover step 7.5 through 8 as a single unit.
  - Atomic write pattern (temp-rename) confirmed from `lp-do-ideas-persistence.ts`.

## Proposed Approach

Only one viable approach exists: a standalone TypeScript module operating on the queue.v1 JSON file, callable via `node --import tsx` in the skill flow. No alternatives considered — the in-memory `TrialQueue` class is not involved (it operates on a different file format) and there is no CLI harness that exposes this kind of mutation.

**Chosen approach:** New standalone module `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts`, inserted as step 7.5 in `lp-do-build/SKILL.md` inside the writer lock scope.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Implement `lp-do-ideas-queue-state-completion.ts` with tests | 88% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Insert step 7.5 into `lp-do-build/SKILL.md` | 90% | S | Complete (2026-03-02) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Core module + tests; sequential prerequisite for TASK-02 |
| 2 | TASK-02 | TASK-01 Complete | SKILL.md update; references the module path validated in TASK-01 |

## Tasks

---

### TASK-01: Implement `lp-do-ideas-queue-state-completion.ts` with tests
- **Type:** IMPLEMENT
- **Deliverable:** New TypeScript module at `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` + test file at `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - Codex offload exit code: 0
  - Affects files present: `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` (6058 bytes), `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts` (9905 bytes)
  - `pnpm --filter scripts exec tsc --noEmit` passed
  - `pnpm exec eslint` on both files passed
  - Committed: `d8df20ff48` (feat(startup-loop): add queue-state completion hook for lp-do-build)
  - Route: Codex offload (CODEX_OK=1)
- **Affects:**
  - `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` (new)
  - `scripts/src/startup-loop/__tests__/lp-do-ideas-queue-state-completion.test.ts` (new)
  - `[readonly] scripts/src/startup-loop/lp-do-ideas-trial-queue.ts`
  - `[readonly] scripts/src/startup-loop/lp-do-ideas-persistence.ts`
  - `[readonly] docs/business-os/startup-loop/ideas/trial/queue-state.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 88%
  - Implementation: 90% — All data structures, schemas, and write patterns confirmed from live production data and 3 analogous modules. Minor gap: QueueState union does not include "completed" but the new module uses `string` widening on dispatch objects to sidestep this without a type regression.
  - Approach: 90% — Standalone file-I/O module pattern is proven by `lp-do-ideas-persistence.ts`, `lp-do-build-event-emitter.ts`. No design ambiguity.
  - Impact: 85% — Completion rate metrics will reflect true throughput once the hook is invoked by every future build. Historical stale dispatches are not backfilled by this task (separate data-repair), so measured delta at deploy time is modest.
  - Held-back test (90% dims): "What single unknown would drop implementation below 90?" — The `counts` key set must exactly match the live file. Already enumerated from the live file: `enqueued, processed, skipped, error, suppressed, auto_executed, completed, total, fact_find_ready`. No unknown.
  - Held-back test (90% dims): "What single unknown would drop approach below 90?" — File format is fully confirmed. No unknown.
  - What would make this >=90%: Extending the `QueueState` union to include `"completed"` in the same task (removes last type-gap advisory); not done here to keep scope bounded.
- **Acceptance:**
  - `markDispatchesCompleted({ queueStatePath, featureSlug, planPath, outcome, clock? })` is exported from the module.
  - Given a queue.v1 file with one dispatch whose `processed_by.fact_find_slug === featureSlug` and `queue_state !== "completed"`, the function writes `queue_state: "completed"`, `status: "completed"`, and a `completed_by: { plan_path, completed_at, outcome }` block.
  - Given the same call a second time (idempotency), the dispatch is not mutated again; `completed_at` is unchanged.
  - Given a dispatch already in `queue_state: "completed"`, the function does not overwrite `completed_by`.
  - Given multiple dispatches with the same `fact_find_slug`, all are marked completed.
  - Given a slug with no matching dispatch, the file is unchanged (or only `counts` is rewritten with identical values — implementation may rewrite `counts` on every call for simplicity).
  - The `counts` block is recomputed from the full `dispatches[]` array after every mutation. The stable key set is: `enqueued, processed, skipped, error, suppressed, auto_executed, completed, total, fact_find_ready`. Unknown queue_state variants are not counted toward new keys.
  - Write is atomic (temp file + rename); partial writes are not possible.
  - All 6 TCs pass.
- **Validation contract:**
  - TC-01: Normal match — one dispatch with `processed_by.fact_find_slug === "my-slug"` and `queue_state: "auto_executed"` → after call, dispatch has `queue_state: "completed"`, `status: "completed"`, `completed_by.plan_path === planPath`, `completed_by.outcome === outcome`, `completed_by.completed_at === clock().toISOString()`.
  - TC-02: Idempotency — call with same slug twice → second call produces no mutation; `completed_by.completed_at` equals the value from the first call, not the second.
  - TC-03: No-match no-op — slug not present in any dispatch → no dispatch fields changed; `counts` may be rewritten but values are unchanged.
  - TC-04: Multi-dispatch match — two dispatches with same `fact_find_slug`, both `auto_executed` → both written to `completed` with `completed_by` populated.
  - TC-05: Already-completed guard — dispatch has `queue_state: "completed"` → skipped; `completed_by` not overwritten.
  - TC-06: Counts recomputed — after TC-01 write, `counts.completed` incremented by 1, `counts.auto_executed` decremented by 1 (reflecting the actual dispatches array state).
- **Execution plan:**
  - Red: Write TC-01 through TC-06 test cases using temp files and injectable clock. Push to CI to confirm all 6 fail (tests run in CI only per repo policy — do not run locally).
  - Green: Implement `lp-do-ideas-queue-state-completion.ts`. Minimum viable: `markDispatchesCompleted()` reads queue-state.json, iterates dispatches, mutates matching non-completed entries, recomputes counts, writes atomically. Push to CI — all 6 TCs go green.
  - Refactor: Add `business` filter parameter (optional, for multi-business safety per Risk 3). Add JSDoc. Verify clock injection is wired consistently. Confirm counts key set is enumerated from a constant (not scattered strings). Push to CI — all TCs still pass.
- **Planning validation:**
  - Checks run:
    - Confirmed `processed_by.fact_find_slug` field present in 11 completed entries in live queue-state.json.
    - Confirmed `status` and `queue_state` both set to `"completed"` in live data.
    - Confirmed `completed_by` schema `{ plan_path, completed_at, outcome }` from live data.
    - Confirmed atomic write (temp-rename) pattern from `lp-do-ideas-persistence.ts` lines 131–138.
    - Confirmed test pattern: `makeTmpDir()` + `randomBytes` from `lp-do-ideas-persistence.test.ts`.
    - Confirmed injectable clock usage from `lp-do-ideas-trial-queue.ts` `TrialQueueOptions.clock`.
    - Confirmed counts keys: `enqueued, processed, skipped, error, suppressed, auto_executed, completed, total, fact_find_ready` from live queue-state.json header.
    - Live dispatch count: 128 objects, `counts.total: 124` (drift of 4 — recompute must use array length for `total`).
  - Validation artifacts: live queue-state.json (128 dispatches, 11 completed), lp-do-ideas-persistence.ts, lp-do-build-event-emitter.ts.
  - Unexpected findings: None.
- **Consumer tracing (new outputs):**
  - New export `markDispatchesCompleted()`: consumed by TASK-02 (SKILL.md invocation instruction) and by the lp-do-build skill at runtime. No other consumer exists or needs updating — the function is introduced here and referenced in TASK-02.
  - Modified file `queue-state.json`: consumed by `lp-do-ideas-metrics-runner.ts` (reads `dispatches[].queue_state` as `string` — already tolerates `"completed"`, no change needed) and by any tooling reading the committed file. No consumer needs to be updated.
- **Scouts:** None: all data contracts verified from live data.
- **Edge Cases & Hardening:**
  - File-not-found: if queue-state.json does not exist, function returns `{ ok: false, reason: "file_not_found" }`. The lp-do-build skill treats this as a non-no_match failure requiring operator escalation before commit (per TASK-02 Edge Cases and failure policy).
  - Malformed JSON: catch parse error, return `{ ok: false, error: ... }` without writing.
  - No `processed_by` on dispatch: skip (dispatch was not routed via a fact-find); not a target for completion.
  - `processed_by` present but `fact_find_slug` absent: skip.
  - `business` filter (optional): if provided, only dispatches whose `business === options.business` AND `processed_by.fact_find_slug === featureSlug` are mutated.
- **Rollout / rollback:**
  - Rollout: module is introduced as a new file; no existing code is modified. Zero risk of regression to existing flows until TASK-02 adds the SKILL.md invocation step.
  - Rollback: remove the module and revert TASK-02's SKILL.md edit. Queue-state.json reverts to manual-write behavior.
- **Documentation impact:**
  - JSDoc on `markDispatchesCompleted()` explaining parameters, idempotency contract, and return shape.
  - SKILL.md update is handled in TASK-02.
- **Notes / references:**
  - Atomic write pattern: `lp-do-ideas-persistence.ts` lines 131–138.
  - Injectable clock pattern: `lp-do-ideas-trial-queue.ts` `TrialQueueOptions.clock`.
  - Test temp-dir pattern: `lp-do-ideas-persistence.test.ts` `makeTmpDir()`.
  - Counts key set confirmed from live queue-state.json: `{ enqueued, processed, skipped, error, suppressed, auto_executed, completed, total, fact_find_ready }`.

---

### TASK-02: Insert step 7.5 into `lp-do-build/SKILL.md`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `lp-do-build/SKILL.md` with step 7.5 in the Plan Completion and Archiving section
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Build evidence:**
  - Step 7.5 inserted at line 203 of SKILL.md (between step 7 at line 202 and step 8 at line 224)
  - References `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` and `markDispatchesCompleted` (lines 203, 206, 208)
  - Plan Completion Checklist entry added at line 269
  - Writer lock scope statement at line 222: "The writer lock scope covers steps 7.5 through 8 as a single atomic unit"
  - All 4 TCs verified by grep inspection
  - Route: inline execution (S-effort documentation edit)
- **Affects:**
  - `.claude/skills/lp-do-build/SKILL.md`
  - `[readonly] scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Edit is a targeted insertion into a well-understood section of SKILL.md. No ambiguity about where to insert or what to write.
  - Approach: 95% — Single-file markdown edit; no code change; no test needed.
  - Impact: 90% — Once the step is in SKILL.md, every future lp-do-build invocation will automatically call the hook. The hook's effectiveness is already validated by TASK-01.
  - Overall: min(90, 95, 90) = 90%.
  - Held-back test: "What single unknown would drop implementation below 90?" — The insertion point is confirmed: between step 7 and step 8 in the Plan Completion section. Writer lock scope wording is agreed (covers steps 7.5–8). No unknown.
- **Acceptance:**
  - SKILL.md Plan Completion and Archiving section has a new step numbered `7.5`.
  - Step 7.5 text instructs: acquire writer lock (if not already held), then invoke `markDispatchesCompleted()` from `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` with `featureSlug`, `planPath` (the archived plan path from step 7), and `outcome` (a one-line summary from the build-record).
  - Step 7.5 text explicitly states: the writer lock scope covers steps 7.5 through 8 (hook write + commit as a single atomic unit).
  - Plan Completion Checklist in SKILL.md includes a new checkbox: `[ ] queue-state completion hook run (markDispatchesCompleted called with feature slug, plan path, outcome)`.
  - SKILL.md is valid markdown; no trailing whitespace issues.
- **Validation contract:**
  - TC-01: SKILL.md contains a step 7.5 in the Plan Completion section between step 7 and step 8.
  - TC-02: Step 7.5 references `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts` and the `markDispatchesCompleted` function name.
  - TC-03: Plan Completion Checklist contains a new line for the queue-state hook.
  - TC-04: SKILL.md writer lock scope statement covers steps 7.5 through 8.
- **Execution plan:**
  - Red: Not applicable for a documentation edit (no test harness for SKILL.md). Acceptance is verified by inspection and grep.
  - Green: Insert step 7.5 text and update the checklist.
  - Refactor: Re-read the full Plan Completion section to confirm numbering is consistent and no step is orphaned.
- **Planning validation:**
  - Checks run: Read lp-do-build/SKILL.md Plan Completion section to confirm step numbering (confirmed: steps 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8 with step 8 being the commit). New step 7.5 slots cleanly between 7 and 8.
  - Validation artifacts: `.claude/skills/lp-do-build/SKILL.md` lines 168–208 (Plan Completion and Archiving section) + lines 235–249 (Plan Completion Checklist).
  - Unexpected findings: None.
- **Consumer tracing:** None — SKILL.md is documentation for the lp-do-build skill agent. No code consumers.
- **Scouts:** None: insertion point is confirmed.
- **Edge Cases & Hardening:**
  - If `markDispatchesCompleted()` returns `{ ok: false, error }`, the skill must surface the error explicitly in build output and escalate to the operator before proceeding to step 8. The commit must not proceed silently while queue-state sync has failed — doing so would permanently lose the completion record for these dispatches. The only acceptable continue-on-failure scenario is `{ ok: false, reason: "no_match" }` (no dispatches matched the slug — a benign no-op for plans that were not operator-idea dispatches). For all other failure reasons (parse error, write error, missing file), the skill must stop and report the error to the operator.
- **Rollout / rollback:**
  - Rollout: SKILL.md update takes effect on the next lp-do-build invocation.
  - Rollback: Revert the SKILL.md edit. Future builds will revert to not calling the hook.
- **Documentation impact:**
  - SKILL.md is the primary documentation artifact for this task. No other docs affected.
- **Notes / references:**
  - SKILL.md Plan Completion section: `.claude/skills/lp-do-build/SKILL.md` lines ~168–208.
  - Plan Completion Checklist: lines ~235–249.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Implement module + tests | Yes — queue.v1 schema confirmed, atomic write pattern confirmed, test patterns confirmed | None | No |
| TASK-02: SKILL.md step 7.5 insertion | Yes — TASK-01 module path and function name known at plan time; SKILL.md insertion point confirmed | None | No |

No critical simulation findings. The plan is linear with one dependency (TASK-02 depends on TASK-01 for the confirmed module path). No type contract gaps that block build execution.

## Risks & Mitigations
1. **Incomplete counts recompute** — Mitigation: enumerate only the stable key set confirmed from live data; ignore unknown variants (no new keys added).
2. **Hook invoked before archive complete** — Mitigation: hook is step 7.5, after `git mv` in step 7 succeeds; plan path is passed as explicit argument.
3. **Cross-business slug collision** — Mitigation: optional `business` filter parameter on `markDispatchesCompleted()`.
4. **Concurrent write** — Mitigation: writer lock scope explicitly covers steps 7.5–8 as a single unit per TASK-02 SKILL.md text.
5. **queue-state.json not found** — Mitigation: function returns `{ ok: false, reason: "file_not_found" }` without throwing. Per the failure policy: `file_not_found` is treated as a non-`no_match` failure and causes the skill to stop and escalate to the operator before committing. Plans that lack a queue-state.json should not have silent archive commits.

## Observability
- Logging: `markDispatchesCompleted()` returns `{ ok: true; mutated: number; skipped: number }` or `{ ok: false; reason: "no_match" | "parse_error" | "write_error" | "file_not_found"; error?: string }`. Step 7.5 logs the mutated count on success. On `reason: "no_match"` the skill logs a notice and continues. On all other failure reasons the skill stops and escalates to the operator.
- Metrics: `counts.completed` in queue-state.json reflects accurate throughput after each build cycle.
- Alerts/Dashboards: None: queue-state.json is a committed file; dashboards reading it will reflect accurate counts after the next commit.

## Acceptance Criteria (overall)
- [ ] `markDispatchesCompleted()` exported from `scripts/src/startup-loop/lp-do-ideas-queue-state-completion.ts`.
- [ ] All 6 TCs pass (TC-01 through TC-06).
- [ ] `lp-do-build/SKILL.md` has step 7.5 with writer lock scope statement.
- [ ] Plan Completion Checklist in SKILL.md includes queue-state hook checkbox.
- [ ] `pnpm typecheck` passes on the scripts package.
- [ ] `pnpm lint` passes on the scripts package.

## Decision Log
- 2026-03-02: New standalone module chosen over adding to `lp-do-ideas-trial-queue.ts` — file-I/O concerns kept out of the in-memory class module.
- 2026-03-02: `completed_by.outcome` is caller-provided (not auto-generated) — consistent with existing manual entries and avoids fabricated summary text.
- 2026-03-02: Writer lock scope explicitly extended to cover step 7.5 (not just step 8) — addresses concurrency risk raised in critique round 1.

## Overall-confidence Calculation
- TASK-01: confidence 88%, effort M (weight 2)
- TASK-02: confidence 90%, effort S (weight 1)
- Overall = (88 × 2 + 90 × 1) / (2 + 1) = (176 + 90) / 3 = 266 / 3 ≈ 88.7% → **88%**
