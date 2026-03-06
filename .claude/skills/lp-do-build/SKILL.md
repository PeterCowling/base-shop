---
name: lp-do-build
description: Thin build orchestrator. Executes one runnable unit per cycle from an approved plan using canonical gates, track-specific executors, and shared ops utilities.
---

# Build Orchestrator

`/lp-do-build` executes plan tasks safely, one runnable unit per cycle (single task or eligible wave), with gate enforcement and explicit handoffs. It also supports a direct-dispatch micro-build fast lane for trivially bounded `lp-do-ideas` packets.

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

- Execute one runnable unit per cycle:
  - default: one runnable task,
  - when `## Parallelism Guide` defines an eligible wave: one runnable wave.
- Runnable task types: `IMPLEMENT`, `SPIKE`, `INVESTIGATE`, `CHECKPOINT`. `DECISION` tasks are resolved by plan/replan flow only.

## Inputs

- Plan doc: `docs/plans/<feature-slug>/plan.md` (legacy fallback allowed), or `docs/plans/<feature-slug>/micro-build.md` for direct-dispatch micro-builds
- Optional task IDs
- Optional fact-find brief for context

## Discovery and Selection

- Fast path: slug/card ID provided → resolve plan directly.
- Discovery path: scan `docs/plans/*/plan.md` for `Status: Active` entries and show as build-ready candidates.

## Direct-Dispatch Micro-Build Lane

Use this lane only for `lp-do-ideas` packets classified `micro_build_ready`. Criteria:
- one bounded surface,
- no architecture or product decision,
- no external research,
- no meaningful planning branch,
- clear validation path already known.

Before any edits:
1. Confirm the queued micro-build dispatch.
2. Create `docs/plans/<feature-slug>/micro-build.md` from `docs/plans/_templates/micro-build.md`.
3. Stamp queue-state `processed_by` with `target_route: "lp-do-build"` and the new micro-build path.

This lane skips `fact-find.md` and `plan.md`, but it does not skip build controls, validation, build outputs, or queue completion.

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
- Frontend/UI IMPLEMENT tasks -> scoped QA loop must run as part of post-build validation: `/lp-design-qa`, `/tools-ui-contrast-sweep`, `/tools-ui-breakpoint-sweep` limited to changed routes/components, with mandatory auto-fix + re-run for all Critical/Major findings in the same task cycle.
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

### Codex Offload Check (CODEX_OK)

Before routing to an executor module, check whether `codex` is available under Node 22:

```bash
nvm exec 22 codex --version >/dev/null 2>&1 && CODEX_OK=1 || CODEX_OK=0
```

- **If `CODEX_OK=1`:** use the offload route per `../_shared/build-offload-protocol.md`. Claude retains all gate ownership (writer lock, VC/TC verification, post-build validation, commit, plan updates). Codex executes the task work.
- **If `CODEX_OK=0`:** execute inline using the relevant executor module below (existing path unchanged).

> **CODEMOOT_OK vs CODEX_OK:** The critique loop uses `CODEMOOT_OK` (checks `codemoot` availability). Build offload uses `CODEX_OK` (checks `codex` directly). These are independent checks for separate features. When both are needed in the same build cycle, run each check independently — they are not interchangeable.

### Module Routing

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
- Run the build-failure bridge (advisory/fail-open) before routing to replan:
  `pnpm --filter scripts startup-loop:self-evolving-from-build-failure -- --business <BUSINESS> --plan-slug <slug> --failure-type confidence_regression --task-id <TASK-ID>`
  This is a single invocation per failure event. If the build is retried and confidence regresses again, that retry is a new failure event warranting a new observation.
- stop and route to `/lp-do-replan`.
- If the same task is routed to `/lp-do-replan` three or more times without crossing its threshold: declare the task `Infeasible` in the plan, record a one-line kill rationale, surface to user, and stop the build cycle. Do not route to replan a fourth time. Run the failure bridge for the infeasible declaration:
  `pnpm --filter scripts startup-loop:self-evolving-from-build-failure -- --business <BUSINESS> --plan-slug <slug> --failure-type infeasible_declaration --task-id <TASK-ID>`

### Build-Time Ideas Hook (Advisory)

After each task commit, run the build-time ideas hook utility:

`pnpm --filter scripts startup-loop:lp-do-ideas-build-commit-hook -- --business <BUSINESS> --from-ref HEAD~1 --to-ref HEAD`

- This step is advisory/fail-open: hook errors are surfaced as warnings and must not block task progression.
- The hook only considers changed files that are active entries in `docs/business-os/startup-loop/ideas/standing-registry.json`.
- The hook persists emitted live dispatches into the configured live queue/telemetry targets. If dispatch candidates are emitted, log the persisted queue result in build evidence for operator review.

## Plan Completion and Archiving

When all executable tasks are complete, execute **every step below in order**. Do not emit the completion message until all steps are done and the Plan Completion Checklist is clear.

Post-build artifacts are reflective only — they must not contain unexecuted work items that the plan or build already knew were required.

1. Produce `build-record.user.md` per `docs/business-os/startup-loop/contracts/loop-output-contracts.md`.
   - Enforce `## Outcome Contract` presence and populated fields (`Why`, `Intended Outcome Type`, `Intended Outcome Statement`, `Source`) before proceeding. Use explicit `TBD/auto` fallback only when canonical values are unavailable.
1.5 Emit canonical `build-event.json` in `docs/plans/<slug>/` using `scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` (`emitBuildEvent()` + `writeBuildEvent()`) with values sourced from `build-record.user.md` `## Outcome Contract`.
   - Verify file exists and is non-empty before continuing.
1.7 **Pre-fill results-review scaffold (deterministic).** Run:
   ```
   pnpm --filter scripts startup-loop:results-review-prefill -- --slug <slug> --plan-dir docs/plans/<slug>
   ```
   - On non-zero exit or missing/empty output file: log warning in build evidence and fall through to Step 2 (codemoot/inline) which generates from scratch. Pre-fill is additive — failure here does not break the existing flow.
   - On success: `docs/plans/<slug>/results-review.user.md` now contains a deterministic scaffold with standing-updates intersection, 5-category None scan, and auto-verdict. Step 2 refines it.
2. Refine `results-review.user.md` — the pre-filled scaffold from Step 1.7 (or generate from scratch if Step 1.7 was skipped/failed).

   **Codemoot route check:**
   ```
   nvm exec 22 codemoot --version >/dev/null 2>&1 && CODEMOOT_OK=1 || CODEMOOT_OK=0
   ```

   **If `CODEMOOT_OK=1` (codemoot route — preferred):**
   - Run:
     ```
     nvm exec 22 codemoot run "Refine docs/plans/<slug>/results-review.user.md. The file already contains a pre-filled scaffold with deterministic sections (Standing Updates, New Idea Candidates with None categories, Intended Outcome Check with auto-verdict). Read the build context from docs/plans/<slug>/plan.md and docs/plans/<slug>/build-record.user.md. Only populate sections that contain placeholders or are missing substantive content: fill Observed Outcomes with concrete build observations, replace any placeholder comments with real content, and add genuine idea candidates for any of the 5 categories where the build produced relevant signals. Do not overwrite correctly pre-filled None entries unless there is actual evidence. Use the template at docs/plans/_templates/results-review.user.md for structure reference." --mode autonomous
     ```
   - Wait for exit. On non-zero exit or missing/empty file: fall back to inline route with a warning note recorded in the build evidence.
   - Verify `docs/plans/<slug>/results-review.user.md` exists and is non-empty before continuing.

   **If `CODEMOOT_OK=0` (inline fallback):**
   - If pre-filled scaffold exists from Step 1.7: read it and refine only sections with placeholders (Observed Outcomes, any placeholder comments). Preserve correctly pre-filled content (Standing Updates, None categories, auto-verdict).
   - If no scaffold exists: auto-draft `results-review.user.md` inline; pre-fill all agent-fillable sections (Observed Outcomes stub, Standing Updates, New Idea Candidates, Standing Expansion, Intended Outcome Check). When pre-filling `## New Idea Candidates`, scan build context for signals in each category below — write `None` if no evidence found for that category:
     - New standing data source — external feed, API, or dataset suitable for Layer A standing intelligence
     - New open-source package — library to replace custom code or add capability
     - New skill — recurring agent workflow ready to be codified as a named skill
     - New loop process — missing stage, gate, or feedback path in the startup loop
     - AI-to-mechanistic — LLM reasoning step replaceable with a deterministic script
2.4. **Pre-fill pattern-reflection scaffold (deterministic).** Run:
   ```
   pnpm --filter scripts startup-loop:pattern-reflection-prefill -- --slug <slug> --plan-dir docs/plans/<slug> --archive-dir docs/plans/_archive
   ```
   - On non-zero exit: log warning in build evidence and fall through to Step 2.5 (LLM generates from scratch). Pre-fill is additive.
   - On success: `docs/plans/<slug>/pattern-reflection.user.md` now contains a deterministic scaffold with archive recurrence counts, routing targets, and the empty-state when no patterns exist. Step 2.5 refines it.
2.5. Refine the pattern-reflection artifact from Step 2.4 (or generate from scratch if Step 2.4 was skipped/failed). Read the `results-review.user.md` just produced. For each entry in `## New Idea Candidates`, identify whether it describes a pattern that has recurred across recent builds or could recur in future builds. If a pre-filled scaffold exists from Step 2.4, review and correct category classifications using build context (the pre-fill defaults to `unclassified` when category cannot be determined deterministically). Then write or update `docs/plans/<slug>/pattern-reflection.user.md` using the schema at `docs/plans/startup-loop-build-reflection-gate/task-01-schema-spec.md`. Each entry must include: a plain summary (≤100 characters), the category, the routing result (see schema routing criteria), and how many times the pattern has been observed. If no patterns are present, write the empty-state artifact with `None identified` in both `## Patterns` and `## Access Declarations` sections. The artifact must always be produced — an empty-state is valid and closes any potential gap in the record.

2.6. Run self-evolving build-output bridge (advisory) to feed build artifacts into observation ingestion:

   `pnpm --filter scripts startup-loop:self-evolving-from-build-output -- --business <BUSINESS> --plan-slug <slug>`

   - This step is advisory/fail-open. It must not block completion if startup-state or artifacts are missing; record warnings in build evidence.
   - When validated repeat-work candidates are detected, the bridge now enqueues them in the self-evolving backbone queue and emits canonical follow-up `dispatch.v2` packets back into the startup-loop ideas trial queue for normal `lp-do-ideas -> lp-do-fact-find -> lp-do-plan -> lp-do-build` handling.

3. Run reflection debt emitter; if debt emitted, produce `reflection-debt.user.html` from `docs/templates/visual/loop-output-report-template.html` (operator-readable plain language — see `MEMORY.md` Operator-Facing Content).
4. Run bug scan and persist findings as a plan artifact: `pnpm bug-scan -- --changed --format=json --fail-on=none --business-scope=<BUSINESS> --idea-artifact=docs/plans/<slug>/bug-scan-findings.user.json`.
5. Run `pnpm --filter scripts startup-loop:generate-process-improvements`. Confirm the output line `updated docs/business-os/process-improvements.user.html` appears before continuing.
6. For each idea in `## New Idea Candidates` that was directly actioned by this build, add an entry to `docs/business-os/_data/completed-ideas.json` by calling `appendCompletedIdea()` from `scripts/src/startup-loop/build/generate-process-improvements.ts` (or by writing the JSON entry directly). Record `plan_slug` (the slug of the plan just completed), `output_link` (path to the archived plan directory), `completed_at` (today's date in ISO format), `source_path` (relative path to the results-review file where the idea was found), and `title` (the sanitized idea title as it appears in the report). Re-run `pnpm --filter scripts startup-loop:generate-process-improvements` after appending so the report reflects the exclusion immediately. Only mark ideas as complete if they were directly delivered by this build; deferred or future ideas remain in the report.
7. Set plan `Status: Archived`. Archive per `../_shared/plan-archiving.md`.
7.5. **Queue-state completion hook** — inside the writer lock scope (which must already be held from step 7 onward and continues through step 8), invoke `markDispatchesCompleted()` from `scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.ts` to mark the originating dispatch as completed in `docs/business-os/startup-loop/ideas/trial/queue-state.json`:

   ```typescript
   import { markDispatchesCompleted } from "scripts/src/startup-loop/ideas/lp-do-ideas-queue-state-completion.js";

   const result = await markDispatchesCompleted({
     queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
     featureSlug: "<feature-slug>",          // the archived plan slug
     planPath: "docs/plans/_archive/<feature-slug>/plan.md",  // the archived plan path from step 7
     outcome: "<one-line outcome from build-record ## Outcome Contract>",
     business: "<BUSINESS>",  // optional; include when known to prevent cross-business slug collision
   });
   ```

   **Failure policy (must enforce before proceeding to step 8):**
   - `{ ok: true }` — log `mutated` count and continue.
   - `{ ok: false, reason: "no_match" }` — benign no-op (plan was not triggered by a dispatch); log a notice and continue.
   - `{ ok: false, reason: "parse_error" | "write_error" | "file_not_found" }` — **stop immediately and escalate to the operator**. Do not proceed to step 8. The commit must not happen while queue-state sync has failed — doing so would permanently lose the completion record for these dispatches. Surface the `reason` and `error` fields in the build output.

   The writer lock scope covers steps 7.5 through 8 as a single atomic unit (hook write + commit). Do not release the lock between step 7.5 and step 8.

8. Commit all post-build artifacts (build-record, build-event, results-review, pattern-reflection, reflection-debt if produced, bug-scan-findings, process-improvements, archive move, queue-state.json if mutated) as a single commit via `scripts/agents/with-writer-lock.sh`.

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

When a build stops due to a gate failure, run the build-failure bridge (advisory/fail-open):
`pnpm --filter scripts startup-loop:self-evolving-from-build-failure -- --business <BUSINESS> --plan-slug <slug> --failure-type gate_block --task-id <TASK-ID>`
This is a single invocation per gate-block event. If the build is retried after fixing the gate issue and fails at a different gate, that is a separate failure event.

## Quick Checklist

- [ ] Canonical gates passed
- [ ] One runnable unit executed this cycle (single task or full wave)
- [ ] Scope respected (or controlled expansion documented)
- [ ] Validation evidence captured
- [ ] Plan updated after task

## Plan Completion Checklist

Run through this before emitting the "Build complete" message:

- [ ] `build-record.user.md` produced
- [ ] `build-record.user.md` includes `## Outcome Contract` with populated fields (or explicit `TBD/auto` fallback)
- [ ] `build-event.json` emitted and non-empty at `docs/plans/<slug>/build-event.json`
- [ ] `results-review.user.md` produced (all sections filled, including New Idea Candidates)
- [ ] `pattern-reflection.user.md` produced (empty-state with `None identified` is valid; artifact must always be present at `docs/plans/<slug>/pattern-reflection.user.md`)
- [ ] Reflection debt emitter run (`reflection-debt.user.html` produced if debt exists, skipped if none)
- [ ] Bug scan run and artifact written to `docs/plans/<slug>/bug-scan-findings.user.json`
- [ ] `pnpm --filter scripts startup-loop:generate-process-improvements` run and confirmed updated
- [ ] `completed-ideas.json` checked — entries added for any ideas directly actioned by this build
- [ ] Queue-state completion hook run (`markDispatchesCompleted` called with feature slug, archived plan path, and outcome; `no_match` is the only acceptable continue-on-failure; all other failures must stop and escalate before commit)
- [ ] Plan moved to `docs/plans/_archive/<slug>/` (no stale copy in active `docs/plans/`)
- [ ] All post-build artifacts committed via writer lock (including `queue-state.json` if mutated)
