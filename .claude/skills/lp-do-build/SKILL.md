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
- Post-build validation (IMPLEMENT tasks only): after TC/VC contracts pass, run `modules/build-validate.md`. Mode is selected by deliverable type (Mode 1: visual UI, Mode 2: data/API, Mode 3: business artifact). Fix+retry loop (max 3 attempts) is required before a task can be marked complete. SPIKE, INVESTIGATE, and CHECKPOINT tasks are exempt.

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
2. **Auto-draft `results-review.user.md`** from build context — do not leave this for the operator — then regenerate the process-improvements page:
   - Write `docs/plans/<feature-slug>/results-review.user.md` using the template at `docs/plans/_templates/results-review.user.md`.
   - Pre-fill every section the agent can answer from build evidence:
     - `## Observed Outcomes` — stub: `Pending — check back after first live activation. Expected: <restate intended outcome from build-record>.`
     - `## Standing Updates` — list every standing doc modified during the build, or `None.`
     - `## New Idea Candidates` — list any improvement ideas or edge cases surfaced during build, or `None.`
     - `## Standing Expansion` — agent recommendation based on scope changes observed, or `No standing expansion: <reason>.`
     - `## Intended Outcome Check` — fill `Intended:` from build-record; leave `Observed:` and `Verdict:` as stubs for post-deployment update.
   - **Run the reflection debt emitter** after drafting:
     - Evaluate the drafted `results-review.user.md` against the minimum payload.
     - If still incomplete (stubs don't count as payload), upsert `reflection-debt.user.md` with deterministic key `reflection-debt:{build_id}`.
     - Soft-gate policy: debt is assigned to lane `IMPROVE`, SLA `7` days; breach behavior is `block_new_admissions_same_owner_business_scope_until_resolved_or_override`.
   - **Regenerate the process-improvements page** after drafting results-review and emitting reflection debt:
     - Run: `pnpm --filter scripts startup-loop:generate-process-improvements`
     - This extracts idea candidates, open reflection debts, and pending reviews from all plan files and rewrites `docs/business-os/process-improvements.user.html` automatically.
3. **Produce `reflection-debt.user.html`** if reflection debt was emitted:
   - Use template: `docs/templates/visual/loop-output-report-template.html`.
   - Replace `{{NAV_PREFIX}}` with `../../../business-os` (archive depth) or `../../business-os` (active plans depth).
   - **Writing rules (mandatory):** Write for the business operator, not the engineer. No technical jargon (no "minimum payload", "ctaLocation", "breach behavior", "artifact", schema terms). Every page readable in under 60 seconds. One clear action per page — say exactly what to do, where, and when.
   - Content pattern: status strip (amber = pending) → what was done (plain English, one bullet per change) → action box (what the operator must do, plain steps, deadline stated plainly).
4. **Invoke `/ops-ship`** immediately after producing `build-record.user.md` and reflection-debt update (if any). Push all committed task work to remote. **Do not watch CI** — push and stop.
5. Set plan frontmatter `Status: Archived`.
6. Archive the plan following `../_shared/plan-archiving.md`.
7. **Encourage `results-review.user.md` completion**: archiving is not blocked, but missing minimum payload will keep reflection debt open until resolved.

### Plan Archival Checklist

- [ ] All executable tasks are `Complete`.
- [ ] `build-record.user.md` exists at `docs/plans/<feature-slug>/build-record.user.md`.
- [ ] `results-review.user.md` auto-drafted with all agent-fillable sections complete.
- [ ] Reflection debt emitter was executed and `reflection-debt.user.md` updated if needed.
- [ ] `reflection-debt.user.html` produced from `docs/templates/visual/loop-output-report-template.html` (operator-readable, full nav).
- [ ] Plan `Status` set to `Archived` in frontmatter.
- [ ] Archive procedure from `../_shared/plan-archiving.md` followed.


## CHECKPOINT Contract

When the next task is CHECKPOINT:

- run `modules/build-checkpoint.md`,
- invoke `/lp-do-replan` for all downstream tasks,
- if topology changed, run `/lp-do-sequence`,
- re-evaluate confidence for all downstream tasks after replan:
  - if all downstream tasks meet their type threshold (IMPLEMENT/SPIKE ≥80%, INVESTIGATE ≥60%) → **continue automatically without pausing for user input**,
  - if any downstream task remains below threshold after replan → stop, report the specific task and confidence gap, ask for operator input.

Do not stop to ask the user just because a CHECKPOINT was reached. The checkpoint triggers replan; if replan passes, build continues.

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
