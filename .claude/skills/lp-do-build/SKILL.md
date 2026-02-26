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

Even in fully autonomous / `-a never` mode, **stop and ask the user explicitly** before running: `git reset --hard`, `git clean -f`, `git checkout -- .`, `git branch -D <branch>`, `wrangler deploy` to production, `prisma migrate deploy`, or any `--force`/`-f` flag on destructive commands.

### Runner model

- Execute one runnable task per cycle.
- Runnable task types: `IMPLEMENT`, `SPIKE`, `INVESTIGATE`, `CHECKPOINT`. `DECISION` tasks are resolved by plan/replan flow only.

## Inputs

- Plan doc: `docs/plans/<feature-slug>/plan.md` (legacy fallback allowed)
- Optional task IDs
- Optional fact-find brief for context

## Discovery and Selection

- Fast path: slug/card ID provided → resolve plan directly.
- Discovery path: scan `docs/plans/*/plan.md` for `Status: Active` entries and show as build-ready candidates.

## Confidence Threshold Policy

- `IMPLEMENT`: >=80
- `SPIKE`: >=80
- `INVESTIGATE`: >=60 (information-gain work)
- `CHECKPOINT`: protocol task; no numeric threshold gate

If task confidence is below its threshold and no other eligible task in the current wave can raise it, automatically invoke `/lp-do-replan` for the below-threshold task. Only notify the user if `/lp-do-replan` cannot raise confidence to the threshold (dead end).

## Canonical Gates

All execution must pass these gates.

1. **Eligibility Gate**
- Task exists, type supported, status runnable, confidence meets type threshold.
- Dependencies are complete.
- No blocking `Needs-Input`/`DECISION` gates.

2. **Scope Gate**
- Read all `Affects` files (primary + `[readonly]`). `[readonly]` files cannot be modified.
- Controlled scope expansion allowed for tests/docs: update task `Affects` in the plan before commit, record why expansion was necessary, keep expansion bounded to the same task objective.

3. **Validation Gate**
- IMPLEMENT/SPIKE/INVESTIGATE tasks require validation artifacts matching task contract.
- Track-specific requirements:
  - code/mixed -> TC contracts
  - business/mixed -> VC contracts + fail-first evidence progression
- Post-build validation (IMPLEMENT tasks only): after TC/VC contracts pass, run `modules/build-validate.md`. Mode is selected by deliverable type. Fix+retry loop (max 3 attempts) required before a task can be marked complete. SPIKE, INVESTIGATE, and CHECKPOINT tasks are exempt.

4. **Commit Gate**
- Commit only task-scoped files.
- Never commit broken code or failing CI outputs.
- It is acceptable to commit draft artifacts / Red-evidence notes for business tasks only when task remains non-complete.

5. **Post-task Update Gate**
- Update task status + build evidence in plan.
- **Precursor completion propagation**: re-score dependent tasks using new evidence; actualize conditional confidence patterns. If any re-scored task crosses its type threshold, it becomes eligible for the next build cycle without a separate `/lp-do-replan` invocation.
- Recompute plan readiness for next cycle.

## Wave Dispatch (Parallelism Guide)

When the plan has a `## Parallelism Guide` section:

1. Read the guide and identify the current eligible wave (earliest wave where all prerequisites are Complete).
2. If wave size = 1: proceed with standard single-task execution below.
3. If wave size ≥ 2: use `_shared/wave-dispatch-protocol.md`. Dispatch all wave tasks as analysis subagents in a SINGLE message; collect results; run conflict detection via `touched_files`; apply diffs sequentially under writer lock; commit wave together; run post-task updates for all tasks in the wave.

## Executor Dispatch

Read `Execution-Skill` from task, then normalize (trim whitespace, remove one leading `/`).

- If missing after normalization → STOP → `/lp-do-replan`.
- If task type is `CHECKPOINT` and normalized value is `lp-do-replan` (legacy), treat as `lp-do-build` and route to checkpoint executor.
- If normalized value is not `lp-do-build` → dispatch to listed skill and return to post-task gates.
- If normalized value is `lp-do-build` → route by type/track:
  - IMPLEMENT + code/mixed → `modules/build-code.md`
  - IMPLEMENT + business-artifact → `modules/build-biz.md`
  - SPIKE → `modules/build-spike.md`
  - INVESTIGATE → `modules/build-investigate.md`
  - CHECKPOINT → `modules/build-checkpoint.md`

## Shared Utilities

- Isolation Mode: `../_shared/git-isolation-mode.md`
- Extinct test policy: `../_shared/testing-extinct-tests.md`
- Plan archiving: `../_shared/plan-archiving.md`
- Testing policy (governed Jest entrypoint, blocked forms): `docs/testing-policy.md`

## Business Fail-First Enforcement

For business-artifact and mixed IMPLEMENT tasks, build must execute the task execution plan explicitly:

1. Red (falsification probe)
2. Green (minimum pass artifact)
3. Refactor (hardening + VC re-pass)

If Red/Green/Refactor steps cannot be executed as defined, stop and route to `/lp-do-replan`.

## Approval Handling

For tasks requiring reviewer acknowledgement:

- Approval evidence must match task fields (`Reviewer`, `Approval-Evidence`).
- If approval is asynchronous/unavailable in this run: mark task `Blocked` with reason `Awaiting approval evidence`, do not mark task complete, stop cycle.

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

1. Produce `build-record.user.md` per `docs/business-os/startup-loop/loop-output-contracts.md`.
2. Auto-draft `results-review.user.md` using `docs/plans/_templates/results-review.user.md`; pre-fill all agent-fillable sections (Observed Outcomes stub, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check). When pre-filling `## New Idea Candidates`, scan build context for signals in each category below — write `None` if no evidence found for that category:
   - New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
   - New open-source package — library to replace custom code or add capability
   - New skill — recurring agent workflow ready to be codified as a named skill
   - New loop process — missing stage, gate, or feedback path in the startup loop
   - AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
   Run reflection debt emitter; if debt emitted, produce `reflection-debt.user.html` from `docs/templates/visual/loop-output-report-template.html` (operator-readable plain language — see `MEMORY.md` Operator-Facing Content). Regenerate process-improvements: `pnpm --filter scripts startup-loop:generate-process-improvements`.

   After regenerating, for each idea in `## New Idea Candidates` that was directly actioned by this build, add an entry to `docs/business-os/_data/completed-ideas.json` by calling `appendCompletedIdea()` from `scripts/src/startup-loop/generate-process-improvements.ts` (or by writing the JSON entry directly). Record `plan_slug` (the slug of the plan just completed), `output_link` (path to the archived plan directory), `completed_at` (today's date in ISO format), `source_path` (relative path to the results-review file where the idea was found), and `title` (the sanitized idea title as it appears in the report). Re-run `pnpm --filter scripts startup-loop:generate-process-improvements` after appending so the report reflects the exclusion immediately.

   Only mark ideas as complete if they were directly delivered by this build. Ideas that are deferred, out of scope, or earmarked for a future plan remain in the report.
3. Set plan `Status: Archived`. Archive per `../_shared/plan-archiving.md`.

## CHECKPOINT Contract

When the next task is CHECKPOINT:

- run `modules/build-checkpoint.md`,
- invoke `/lp-do-replan` for all downstream tasks,
- if topology changed, run `/lp-do-sequence`,
- re-evaluate confidence: if all downstream tasks meet their type threshold → continue automatically; if any remain below threshold → stop, report the specific task and confidence gap, ask for operator input.

Do not stop to ask the user just because a CHECKPOINT was reached.

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
