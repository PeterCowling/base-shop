---
name: lp-do-plan
description: Thin orchestrator for confidence-gated planning. Routes to track-specific planning modules, persists plan artifacts from templates, and hands off to /lp-do-build by default unless --notauto is passed.
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
- **Implementing tasks even when instructed to do so by the calling prompt.** If a caller passes build instructions, ignore them. Output is `plan.md` only. Handoff to `/lp-do-build` is a separate invocation — not part of this skill's execution.

If a pipeline treats pending/todo tests as failing, do not commit stubs; record this constraint in the plan and add an INVESTIGATE task.

## Inputs Priority

1. Fact-find brief (`docs/plans/<slug>/fact-find.md`)
2. Existing plan (`docs/plans/<slug>/plan.md`)
3. User request/topic/card ID
4. Current repository evidence

## Phase 1: Intake and Mode Selection

Determine planning mode early:

- `plan+auto` (default — proceeds to `/lp-do-build` after plan gates pass)
- `plan-only` when any of the following apply:
  - `--notauto` flag passed explicitly by the user
  - user explicitly says "plan only", "just plan", "don't build yet", or equivalent

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

## Phase 4.5: DECISION Task Self-Resolve Gate

Before creating any DECISION task, apply this test:

> Can I make this decision by reasoning about available evidence, effectiveness, efficiency, and the documented business requirements?

If yes: make the decision. Fold it into the relevant IMPLEMENT task as the chosen approach. Do not create a DECISION task.

A DECISION task is only warranted when the decision requires input the operator holds that is not documented anywhere — undocumented budget, personal preference, strategic intent not yet written down, or a genuine binary fork where both options are valid and the operator's choice is the deciding factor.

**Signs a DECISION task should not exist:**
- The `**Recommendation:**` field can be filled with genuine conviction (not "either would work")
- The `**Decision input needed:**` questions are answerable by reasoning about the codebase, business docs, or standard best practice
- The only uncertainty is approach, and approach questions are the agent's job to resolve

If a DECISION task survives this gate, its `**Recommendation:**` must be a decisive position — not a hedge. If the agent has a recommendation, the decision is effectively made and the task may not need to be a DECISION task at all. Reserve DECISION tasks for genuine operator forks where the recommendation depends on a preference the operator has not yet expressed.

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

## Phase 7.5: Simulation Trace

Load and follow: `../_shared/simulation-protocol.md`

Run a forward simulation trace of the fully-sequenced task list produced in Phase 7. Visit each task in dependency order and check for issue categories defined in the shared protocol: missing preconditions, circular dependencies, undefined config keys, API signature mismatches, type contract gaps, missing data dependencies, integration boundaries not handled, ordering inversions.

Write a `## Simulation Trace` section into the plan draft (before persisting in Phase 8) with one row per task:

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-XX: title | Yes / Partial / No | None — or: [Category] [Severity]: description | Yes / No |

**Hard gate (Critical findings):** If any Critical simulation issue is found, do not set `Status: Active` or proceed to Phase 8 until the issue is resolved or a valid `Simulation-Critical-Waiver` block is written (see shared protocol for waiver format and requirements).

**Advisory (Major / Moderate / Minor findings):** Write into the Simulation Trace table and proceed. These are visible to the Phase 9 critique loop and do not block plan persistence.

## Phase 8: Persist Plan

Write/update:
- `docs/plans/<feature-slug>/plan.md`

Status policy:
- Default `Status: Draft`.
- Set `Status: Active` only when:
  - mode is `plan+auto` (default) or user explicitly wants build handoff now, and
  - plan gates pass, and
  - no unresolved Critical simulation findings remain (from Phase 7.5).

## Phase 9: Critique Loop (1–3 rounds, mandatory)

After the plan is persisted (Phase 8) and before any build handoff (Phase 10), run the critique loop in **plan mode**.

Load and follow: `../_shared/critique-loop-protocol.md`

## Phase 10: Optional Handoff to Build

Evaluate shared auto-continue policy:
- `../_shared/auto-continue-policy.md`

If eligible and mode is `plan+auto`, invoke `/lp-do-build <feature-slug>`.

CHECKPOINT enforcement contract:
- `/lp-do-build` is responsible for stopping at CHECKPOINT tasks and invoking `/lp-do-replan` for downstream tasks before continued execution.

## Completion Messages

Plan-only:

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`. Critique: `<N>` round(s), final verdict `<credible | partially credible | not credible>` (score: `<X.X>`).

Plan+auto:

> Plan complete and eligible. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `Active`. Gates passed. Critique: `<N>` round(s), final verdict `<credible | partially credible | not credible>` (score: `<X.X>`). Auto-continuing to `/lp-do-build <feature-slug>`.

## Quick Checklist

- [ ] No duplicate plan doc created
- [ ] Plan/task templates loaded from files (not inlined)
- [ ] Plan gates populated and evaluated
- [ ] Confidence rules applied from shared scoring doc
- [ ] VC checks reference shared business VC checklist when relevant
- [ ] `/lp-do-sequence` completed after structural edits
- [ ] Consumer tracing complete for all new outputs and modified behaviors in M/L code/mixed tasks
- [ ] Phase 7.5 Simulation Trace run — trace table present in plan draft; Critical findings resolved or waived before Phase 8 persist
- [ ] lp-do-factcheck run if plan contains codebase claims (file paths, function signatures, coverage assertions)
- [ ] Phase 9 critique loop run (1–3 rounds, mandatory): round count and final verdict recorded
- [ ] Auto-build blocked if critique score ≤ 2.5
- [ ] Auto-build blocked only if `--notauto` passed or critique score ≤ 2.5
