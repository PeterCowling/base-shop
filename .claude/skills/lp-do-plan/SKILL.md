---
name: lp-do-plan
description: Thin orchestrator for confidence-gated planning. Routes to track-specific planning modules, persists plan artifacts from templates, and optionally hands off to /lp-do-build when explicit auto-build intent is present.
---

# Plan Orchestrator

`/lp-do-plan` is the intake, gating, and routing layer for planning.

It owns:
1. Discovery/intake/dedupe
2. Planning gates
3. Track routing to specialized planner modules
4. Plan persistence using external templates
5. Mandatory critique via `/lp-do-critique` (autofix mode)
6. Optional handoff to `/lp-do-build`

It does not embed large plan/task templates or long doctrine blocks.

## Global Invariants

### Terminology rule

- `CI` means continuous integration only.
- Use `confidence` / `Overall-confidence` for planning scores.

### Operating mode

**PLANNING FIRST**

### Allowed actions

- Read/search files and docs.
- Run non-destructive validation commands needed for evidence.
- Edit plan docs.
- Allowed exception: for L-effort code/mixed tasks, add non-failing test stubs (`test.todo()` / `it.skip()`) only.

### Prohibited actions

- Production implementation changes, refactors, migrations, or deploy operations.
- Destructive shell/git commands.
- Failing test stubs in planning mode.

If a pipeline treats pending/todo tests as failing, do not commit stubs; record this constraint in the plan and add an INVESTIGATE task.

## Inputs Priority

1. Fact-find brief (`docs/plans/<slug>/fact-find.md`)
2. Existing plan (`docs/plans/<slug>/plan.md`)
3. User request/topic/card ID
4. Current repository evidence

## Phase 1: Intake and Mode Selection

Determine planning mode early:

- `plan-only` (default in interactive sessions)
- `plan+auto` when any of the following apply:
  - explicit user intent: "build now", "ship now", "implement now"
  - `--auto` flag passed (set by `/lp-do-fact-find` pipeline auto-handoff)
  - invoked automatically as part of a pipeline initiated by the user

Never assume silent approval to auto-build in interactive sessions where the user has not expressed intent. `--auto` is only set by the pipeline or by explicit user instruction.

## Phase 2: Discovery and De-duplication

### Fast path (argument provided)

- Slug or fact-find path -> open matching plan/fact-find paths directly.

### Discovery path (no argument)

- Scan `docs/plans/*/fact-find.md` files for entries with `Status: Ready-for-planning`.
- Present results as a short table (slug | title | track | effort).
- Ask user to select a slug or topic.

### De-duplication rule

Before creating a new plan file:
- search `docs/plans/` for overlapping plan docs,
- update existing canonical plan when possible,
- avoid duplicate plan files for the same feature slug.

## Phase 3: Plan Gates (Canonical)

Populate and evaluate these gates in the plan doc:

- Foundation Gate
- Build Gate
- Auto-Continue Gate

### Foundation Gate

If fact-find exists, require:
- `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`
- `Startup-Deliverable-Alias` (`none` unless startup)
- Delivery-readiness confidence input
- Track-specific validation foundation
  - code/mixed: test landscape + testability
  - business/mixed: channel landscape + hypothesis/validation landscape

If missing, stop planning and return to `/lp-do-fact-find` or add explicit INVESTIGATE tasks with confidence penalty.

### Build Gate (for auto-continue readiness)

For automatic handoff from `/lp-do-plan` to `/lp-do-build`, require at least one `IMPLEMENT` task with:
- confidence >=80,
- dependencies complete,
- no blocking decision/input gates.

Note:
- `/lp-do-build` may execute `SPIKE` tasks at >=80 and `INVESTIGATE` tasks at >=60 when explicitly selected/routed.

### Auto-Continue Gate

Use shared policy:
- `../_shared/auto-continue-policy.md`

## Phase 4: Track Classification and Routing

Determine:
- `Execution-Track`: `code | business-artifact | mixed`
- `Deliverable-Type`: canonical downstream type
- `Primary-Execution-Skill` and `Supporting-Skills`

Route to one module only (or mixed pair):
- code -> `modules/plan-code.md`
- business-artifact -> `modules/plan-business.md`
- mixed -> `modules/plan-mixed.md`

## Phase 5: Decompose Tasks with External Templates

Use:
- Plan template: `docs/plans/_templates/plan.md`
- Task templates:
  - `docs/plans/_templates/task-implement-code.md`
  - `docs/plans/_templates/task-implement-biz.md`
  - `docs/plans/_templates/task-investigate.md`
  - `docs/plans/_templates/task-decision.md`
  - `docs/plans/_templates/task-checkpoint.md`

Rules:
- One logical unit per task.
- Use CHECKPOINT tasks for long dependency chains.
- If a field is not applicable: write `None: <reason>` (no placeholder `TBD`).

## Phase 5.5: Consumer Tracing (code/mixed, M/L effort only)

For each IMPLEMENT task with `Execution-Track: code | mixed` and `Effort: M | L`, run the following checks before setting confidence ≥80 on that task:

**New outputs check**

For every new value this task introduces — interface field, function return value, config-file key, MCP tool response field, environment variable — name it explicitly and list every code path that will consume it. Confirm the execution plan addresses all consumers, or state explicitly why unchanged consumers are safe.

**Modified behavior check**

For every existing function, field, or behavior noted in Planning Validation, check whether the execution plan modifies its signature or semantics. If yes, list all callers/consumers and confirm each is addressed within this task or a dependent task.

**Failure modes to prevent:**

| Failure mode | Pattern | Symptom |
|---|---|---|
| Dead-end field | New field computed and attached to object; no consumer reads it | Feature is silent no-op |
| Silent fallback | Consumer not updated to read new field; uses old value silently | New behavior never activates |
| Split definition | Task sets value at one layer; different layer still overwrites with old value | Intermittent or environment-dependent behaviour |

**Quick-check questions (required before task confidence ≥80):**

- "For every new value this task produces, what is every code path that reads it?"
- "For every existing function or field noted in Planning Validation, does the execution plan update all callers if the signature or semantics change?"

If a consumer is out of scope for this task, add an explicit note: `Consumer <X> is unchanged because <reason>`. Do not leave it undocumented.

## Phase 6: Confidence Scoring

Apply compact scoring doctrine from:
- `../_shared/confidence-scoring-rules.md`

Use evidence-based scores only. Every task must explain confidence briefly.

## Phase 7: Sequence + Edge-Case Review

1. Run `/lp-do-sequence` after decomposition/topology edits.
2. Run edge-case review and update impacted tasks.
3. If task structure changes again, run `/lp-do-sequence` again.

Set plan gate statuses explicitly:
- Foundation Gate: Pass/Fail
- Sequenced: Yes/No
- Edge-case review complete: Yes/No
- Auto-build eligible: Yes/No

## Phase 8: Persist Plan

Write/update:
- `docs/plans/<feature-slug>/plan.md`

Status policy:
- Default `Status: Draft`.
- Set `Status: Active` only when:
  - user explicitly wants build handoff now, or `--auto` flag is set, and
  - plan gates pass.

## Phase 10: Optional Handoff to Build

Evaluate shared auto-continue policy:
- `../_shared/auto-continue-policy.md`

If eligible and mode is `plan+auto`, invoke `/lp-do-build <feature-slug>`.

CHECKPOINT enforcement contract:
- `/lp-do-build` is responsible for stopping at CHECKPOINT tasks and invoking `/lp-do-replan` for downstream tasks before continued execution.

## Phase 11: Automatic Critique (score-gated)

After the plan is persisted (Phase 8) and before any build handoff (Phase 10), evaluate two independent triggers. Either trigger alone is sufficient to invoke `/lp-do-critique` automatically.

**Trigger 1 — Whole-plan confidence:** `Overall-confidence` < 4.0 (i.e. < 80 on a 5-point scale).

**Trigger 2 — Uncovered low-confidence task:** Any individual task has `confidence < 80%` AND has no upstream SPIKE or INVESTIGATE task that would plausibly resolve its uncertainty before it falls due.

### Trigger 2 — Evaluation procedure

For every task in the plan with `confidence < 80%`:

1. Identify all tasks that are sequenced *before* this task (direct blockers and their transitive predecessors — i.e. the dependency chain upstream of this task).
2. Check whether any of those upstream tasks has `Type: SPIKE` or `Type: INVESTIGATE`.
3. If yes → the uncertainty is covered; this task passes Trigger 2 (skip to next low-confidence task).
4. If no upstream SPIKE/INVESTIGATE exists → this task is **uncovered**. Trigger 2 fires.

A task is only considered "covered" if the SPIKE/INVESTIGATE is upstream (i.e. must complete before the low-confidence task runs). A SPIKE that is parallel or downstream does not count.

**Invocation (when either trigger fires):**
- Target: `docs/plans/<feature-slug>/plan.md`
- Mode: default (CRITIQUE + AUTOFIX)
- Scope: `full`
- When reporting, note which trigger(s) fired and which task(s) caused Trigger 2 (if applicable).

**Flow:**
1. Read `Overall-confidence` from the persisted plan frontmatter → evaluate Trigger 1.
2. Scan all task confidence values → evaluate Trigger 2 per the procedure above.
3. If neither trigger fires: skip critique, proceed to Phase 10.
4. If either trigger fires: run `/lp-do-critique docs/plans/<feature-slug>/plan.md`.
5. Critique produces findings and applies autofixes to the plan.
6. After critique:
   - If critique verdict is `not credible` or critique score <= 2.5:
     - Set plan `Status: Draft` (block auto-build).
     - Report critique findings to user.
     - Recommend `/lp-do-replan` or revision before proceeding.
   - If critique verdict is `partially credible` (critique score 3.0–3.5):
     - Autofixes are already applied.
     - Report top issues.
     - In `plan+auto` mode: proceed to build handoff. Add `Critique-Warning: partially-credible` to plan frontmatter. Do not require interactive confirmation.
     - In `plan-only` mode: report to user and stop; recommend `/lp-do-replan` before proceeding.
   - If critique verdict is `credible` (critique score >= 4.0):
     - Autofixes are already applied.
     - Proceed normally (build handoff if eligible).

**Ordering:** Phase 11 runs after Phase 8 (persist) but before Phase 10 (build handoff). Build eligibility is re-evaluated after critique autofixes are applied.

## Completion Messages

Plan-only (both triggers clear, critique skipped):

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`. Overall-confidence: `<X.X>` (critique skipped — all tasks covered above threshold).

Plan-only (critique ran — note which trigger):

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`. Critique triggered by: `<Overall-confidence below 4.0 | uncovered low-confidence task(s): [task IDs]>`. Critique verdict: `<credible / partially credible / not credible>` (score: `<X.X>`).

Plan+auto:

> Plan complete and eligible. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `Active`. Gates passed. Critique verdict: `<credible / partially credible / not credible>` (score: `<X.X>`). Auto-continuing to `/lp-do-build <feature-slug>`.

## Quick Checklist

- [ ] No duplicate plan doc created
- [ ] Plan/task templates loaded from files (not inlined)
- [ ] Plan gates populated and evaluated
- [ ] Confidence rules applied from shared scoring doc
- [ ] VC checks reference shared business VC checklist when relevant
- [ ] `/lp-do-sequence` completed after structural edits
- [ ] Consumer tracing complete for all new outputs and modified behaviors in M/L code/mixed tasks
- [ ] Phase 11 Trigger 1 evaluated: Overall-confidence vs 4.0 threshold
- [ ] Phase 11 Trigger 2 evaluated: every task with confidence < 80% checked for upstream SPIKE/INVESTIGATE coverage
- [ ] Critique trigger reason(s) reported in completion message (or "skipped — all tasks covered" if both clear)
- [ ] Auto-build blocked if critique score <= 2.5
- [ ] Auto-build only when explicit intent + eligibility
