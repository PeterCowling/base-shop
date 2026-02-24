---
name: lp-do-build
description: Thin build orchestrator. Executes one runnable task per cycle from an approved plan using canonical gates, track-specific executors, and shared ops utilities.
---

# Build Orchestrator

`/lp-do-build` executes plan tasks safely, one task per cycle, with gate enforcement and explicit handoffs.

## Global Invariants

### Operating mode

**BUILDING ONLY**

### Allowed actions

- Modify code/artifacts within task scope.
- Run validations.
- Commit task-scoped changes.
- Update plan status/evidence after each task.

### Prohibited actions

- Work outside plan scope without explicit scope expansion handling.
- Skipping validation gates.
- Destructive shell/git commands (see list below).
- Executing unresolved DECISION tasks. When a DECISION task is encountered: write the specific decision question to `docs/plans/<feature-slug>/replan-notes.md`, surface it explicitly to the user with a concrete ask, and stop cleanly. Never silently park as `Blocked`.

### Always confirm first (model-layer gate — not covered by git hooks)

Even in fully autonomous / `-a never` mode, **stop and ask the user explicitly** before running:

- `git reset --hard`, `git clean -f`, `git checkout -- .` (destructive, no hook)
- `git branch -D <branch>` (branch deletion, no hook fires)
- `wrangler deploy` to production (irreversible live deploy)
- `prisma migrate deploy` (irreversible schema migration)
- Any `--force` / `-f` flag on destructive commands

These are not blocked by git hooks or sandbox mode. The model must enforce this gate itself.

### Runner model

- Execute one runnable task per cycle.
- Runnable task types in this skill: `IMPLEMENT`, `SPIKE`, `INVESTIGATE`, `CHECKPOINT`.
- `DECISION` tasks are resolved by plan/replan flow, not by build execution.

## Inputs

- Plan doc: `docs/plans/<feature-slug>/plan.md` (legacy fallback allowed)
- Optional task IDs
- Optional fact-find brief for context

## Discovery and Selection

### Fast path

- Slug/card ID provided -> resolve plan directly.

### Discovery path

- Scan `docs/plans/*/plan.md` for `Status: Active` entries and show as build-ready candidates.

## Task-Type Execution Policy

`/lp-do-build` can execute one runnable task per cycle for these task types:

- `IMPLEMENT`
- `SPIKE`
- `INVESTIGATE`
- `CHECKPOINT`

`DECISION` tasks are not executable here; they must be resolved through plan/replan flow.

## Confidence Threshold Policy

- `IMPLEMENT`: >=80
- `SPIKE`: >=80
- `INVESTIGATE`: >=60 (information-gain work)
- `CHECKPOINT`: protocol task; no numeric threshold gate

If task confidence is below its threshold and no other eligible task in the current wave can raise it (e.g., an INVESTIGATE that feeds the low-confidence task), automatically invoke `/lp-do-replan` for the below-threshold task. Do not stop to ask the user — attempt the replan first. Only notify the user if `/lp-do-replan` cannot raise confidence to the threshold (dead end).

## Canonical Gates

All execution must pass these gates.

1. **Eligibility Gate**
- Task exists, type supported, status runnable, confidence meets type threshold.
- Dependencies are complete.
- No blocking `Needs-Input`/`DECISION` gates.

2. **Scope Gate**
- Read all `Affects` files (primary + `[readonly]`).
- `[readonly]` files cannot be modified.
- Controlled scope expansion is allowed for tests/docs when required by validation or documentation impact:
  - update task `Affects` in the plan before commit,
  - record why expansion was necessary in task build notes.
  - keep expansion bounded to the same task objective.

3. **Validation Gate**
- IMPLEMENT/SPIKE/INVESTIGATE tasks require validation artifacts matching task contract.
- Track-specific requirements:
  - code/mixed -> TC contracts
  - business/mixed -> VC contracts + fail-first evidence progression

4. **Commit Gate**
- Commit only task-scoped files.
- Never commit broken code or failing CI outputs.
- It is acceptable to commit draft artifacts / Red-evidence notes for business tasks only when task remains non-complete.

5. **Post-task Update Gate**
- Update task status + build evidence in plan.
- **Precursor completion propagation**: if the completed task appears in other tasks' `Depends on` or `Blocks` lists, re-score those dependent tasks using the new evidence and actualize any conditional confidence patterns (see `modules/build-investigate.md` § Downstream Confidence Propagation and `modules/build-spike.md` step 4). If any re-scored task crosses its type threshold, it becomes eligible for the next build cycle without a separate `/lp-do-replan` invocation.
- Recompute plan readiness for next cycle.

## Wave Dispatch (Parallelism Guide)

When the plan has a `## Parallelism Guide` section:

1. Read the guide and identify the current eligible wave (earliest wave where all prerequisites are Complete).
2. If wave size = 1: proceed with standard single-task execution below.
3. If wave size ≥ 2: use `_shared/wave-dispatch-protocol.md`.
   - Dispatch all wave tasks as analysis subagents in a SINGLE message.
   - Collect results; run conflict detection via `touched_files`.
   - Apply phase: orchestrator applies diffs sequentially under writer lock.
   - Commit wave together; run post-task updates for all tasks in the wave.

## Executor Dispatch

Read `Execution-Skill` from task, then normalize before comparison:

- trim whitespace
- remove one leading `/` if present (legacy compatibility)
- canonical stored values use no slash (`lp-do-build`, `lp-do-replan`, `draft-email`, `biz-product-brief`, etc.)

- If missing after normalization -> STOP -> `/lp-do-replan`.
- If task type is `CHECKPOINT` and normalized value is `lp-do-replan` (legacy), treat it as `lp-do-build` and route to checkpoint executor.
- If normalized value is not `lp-do-build` -> dispatch to listed skill and then return to post-task gates.
- If normalized value is `lp-do-build` -> route by type/track:
  - IMPLEMENT + code/mixed -> `modules/build-code.md`
  - IMPLEMENT + business-artifact -> `modules/build-biz.md`
  - SPIKE -> `modules/build-spike.md`
  - INVESTIGATE -> `modules/build-investigate.md`
  - CHECKPOINT -> `modules/build-checkpoint.md`

## Shared Utilities

- Isolation Mode: `../_shared/git-isolation-mode.md`
- Extinct test policy: `../_shared/testing-extinct-tests.md`
- Plan archiving: `../_shared/plan-archiving.md`

## Business Fail-First Enforcement

For business-artifact and mixed IMPLEMENT tasks, build must execute the task execution plan explicitly:

1. Red (falsification probe)
2. Green (minimum pass artifact)
3. Refactor (hardening + VC re-pass)

If Red/Green/Refactor steps cannot be executed as defined, stop and route to `/lp-do-replan`.

## Approval Handling

For tasks requiring reviewer acknowledgement:

- Approval evidence must match task fields (`Reviewer`, `Approval-Evidence`).
- If approval is asynchronous/unavailable in this run:
  - mark task `Blocked` with reason `Awaiting approval evidence`,
  - do not mark task complete,
  - stop cycle.

## Post-Task Plan Updates

After each completed task:

- Mark status `Complete (YYYY-MM-DD)`.
- Add concise build completion evidence block.
- Update `Last-updated`.
- Update task summary status/dependencies if changed.

If confidence regresses below task threshold during execution:
- stop and route to `/lp-do-replan`.
- If the same task is routed to `/lp-do-replan` three or more times without crossing its threshold: declare the task `Infeasible` in the plan, record a one-line kill rationale, surface to user, and stop the build cycle. Do not route to replan a fourth time.

## Plan Completion and Archiving

When all executable tasks are complete:

1. **Produce `build-record.user.md`** at `docs/plans/<feature-slug>/build-record.user.md`. This artifact records what was built, tests run, and validation evidence. See formal contract: `docs/business-os/startup-loop/loop-output-contracts.md`.
2. **Invoke `/ops-ship`** immediately after producing `build-record.user.md`. Push all committed task work to remote and watch CI to green.
3. Set plan frontmatter `Status: Archived`.
4. Archive the plan following `../_shared/plan-archiving.md`.
5. **Encourage (not require) `results-review.user.md`**: notify the operator that writing a results review when outcomes are observable will propagate learnings to Layer A standing files. This is advisory — it does not block archiving.

### Plan Archival Checklist

- [ ] All executable tasks are `Complete`.
- [ ] `build-record.user.md` exists at `docs/plans/<feature-slug>/build-record.user.md`.
- [ ] Plan `Status` set to `Archived` in frontmatter.
- [ ] Archive procedure from `../_shared/plan-archiving.md` followed.
- [ ] Operator notified to write `results-review.user.md` when outcomes are observable (advisory).


## CHECKPOINT Contract

When the next task is CHECKPOINT:

- run `modules/build-checkpoint.md`,
- invoke `/lp-do-replan` for downstream tasks,
- if topology changed, run `/lp-do-sequence`,
- resume only when downstream tasks are again eligible.

## Completion Messages

All eligible tasks complete:

> Build complete. Plan archived to `docs/plans/_archive/<feature-slug>/plan.md` with `Status: Archived`.

Partial completion:

> Build progressed. Some tasks remain blocked or below threshold. See updated plan and run `/lp-do-replan` for blocked tasks.

Stopped by gate:

> Build stopped by gate (`Eligibility` | `Scope` | `Validation` | `Commit` | `Post-task`). See plan updates for required next action.

## Quick Checklist

- [ ] Canonical gates passed
- [ ] One task executed this cycle
- [ ] Scope respected (or controlled expansion documented)
- [ ] Validation evidence captured
- [ ] Plan updated after task
