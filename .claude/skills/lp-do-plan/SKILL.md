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
5. Optional BOS sync
6. Mandatory critique via `/lp-do-critique` (autofix mode)
7. Optional handoff to `/lp-do-build`

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

- `plan-only` (default)
- `plan+auto` (only when explicit user intent says build now, ship now, implement now, or user passes an explicit `--auto` style instruction)

Never assume silent approval to auto-build.

## Phase 2: Discovery and De-duplication

### Fast path (argument provided)

- Slug -> open matching plan/fact-find paths directly.
- Card ID -> resolve card, then slug/plan link from card metadata.

### Discovery path (no argument)

- Read `docs/business-os/_meta/discovery-index.json`.
- Present short planning-ready table.
- Ask user to select a slug/card/topic.

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

1. Run `/lp-sequence` after decomposition/topology edits.
2. Run edge-case review and update impacted tasks.
3. If task structure changes again, run `/lp-sequence` again.

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
  - user explicitly wants build handoff now, and
  - plan gates pass.

## Phase 9: Optional Business OS Integration

When `Card-ID` exists and integration is on, execute:
- `../_shared/plan-bos-integration.md`

Payload shapes live in:
- `../_shared/bos-api-payloads.md`

Use shared discovery index contract for BOS mutations:
- `../_shared/discovery-index-contract.md`

## Phase 10: Optional Handoff to Build

Evaluate shared auto-continue policy:
- `../_shared/auto-continue-policy.md`

If eligible and mode is `plan+auto`, invoke `/lp-do-build <feature-slug>`.

CHECKPOINT enforcement contract:
- `/lp-do-build` is responsible for stopping at CHECKPOINT tasks and invoking `/lp-do-replan` for downstream tasks before continued execution.

## Phase 11: Automatic Critique (score-gated)

After the plan is persisted (Phase 8) and before any build handoff (Phase 10), evaluate `Overall-confidence` from the plan to decide whether `/lp-do-critique` runs automatically.

**Gate rule:** If `Overall-confidence` < 4.0 (i.e. < 80), automatically invoke `/lp-do-critique`. Plans scoring >= 4.0 skip automatic critique (user can still invoke manually).

**Invocation (when triggered):**
- Target: `docs/plans/<feature-slug>/plan.md`
- Mode: default (CRITIQUE + AUTOFIX)
- Scope: `full`

**Flow:**
1. Read `Overall-confidence` from the persisted plan frontmatter.
2. If score >= 4.0: skip critique, proceed to Phase 10.
3. If score < 4.0: run `/lp-do-critique docs/plans/<feature-slug>/plan.md`.
4. Critique produces findings and applies autofixes to the plan.
5. After critique:
   - If critique verdict is `not credible` or critique score <= 2.5:
     - Set plan `Status: Draft` (block auto-build).
     - Report critique findings to user.
     - Recommend `/lp-do-replan` or revision before proceeding.
   - If critique verdict is `partially credible` (critique score 3.0–3.5):
     - Autofixes are already applied.
     - Report top issues to user.
     - Proceed to build handoff only if mode is `plan+auto` and user confirms.
   - If critique verdict is `credible` (critique score >= 4.0):
     - Autofixes are already applied.
     - Proceed normally (build handoff if eligible).

**Ordering:** Phase 11 runs after Phase 8 (persist) and Phase 9 (BOS sync), but before Phase 10 (build handoff). Build eligibility is re-evaluated after critique autofixes are applied.

## Completion Messages

Plan-only (confidence >= 4.0, critique skipped):

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`. Overall-confidence: `<X.X>` (critique skipped — above threshold).

Plan-only (confidence < 4.0, critique ran):

> Plan complete. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `<Draft | Active>`. Gates: Foundation `<Pass/Fail>`, Sequenced `<Yes/No>`, Edge-case review `<Yes/No>`, Auto-build eligible `<Yes/No>`. Critique verdict: `<credible / partially credible / not credible>` (score: `<X.X>`).

Plan+auto:

> Plan complete and eligible. Saved to `docs/plans/<feature-slug>/plan.md`. Status: `Active`. Gates passed. Critique verdict: `<credible / partially credible / not credible>` (score: `<X.X>`). Auto-continuing to `/lp-do-build <feature-slug>`.

## Quick Checklist

- [ ] No duplicate plan doc created
- [ ] Plan/task templates loaded from files (not inlined)
- [ ] Plan gates populated and evaluated
- [ ] Confidence rules applied from shared scoring doc
- [ ] VC checks reference shared business VC checklist when relevant
- [ ] `/lp-sequence` completed after structural edits
- [ ] Consumer tracing complete for all new outputs and modified behaviors in M/L code/mixed tasks
- [ ] Phase 11 gate evaluated: `/lp-do-critique` ran automatically if Overall-confidence < 4.0
- [ ] Critique verdict and score reported in completion message (or skipped note if >= 4.0)
- [ ] Auto-build blocked if critique score <= 2.5
- [ ] Auto-build only when explicit intent + eligibility
