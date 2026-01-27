---
name: build-feature
description: Implement tasks from an approved plan, one task at a time, with strict confidence gating and mandatory validation. Update the plan as execution proceeds.
---

# Build Feature

Implement tasks from an approved plan, one task at a time, with strict confidence gating and mandatory validation. Update the plan as execution proceeds.

**CI note:** CI≥90 is a motivation/diagnostic, not a requirement. The implementation gate is still **≥80%** confidence for IMPLEMENT tasks.

## Operating Mode

**BUILDING ONLY**

**Allowed:** modify code, add/update tests, run validations, commit changes, update the plan doc.

**Not allowed:** implement tasks below threshold, do work not in the plan, skip validation, commit failing code, silently change scope.

## Prerequisites

- **Plan exists:** `docs/plans/<feature-slug>-plan.md`
- **Task(s) to build are:**
  - Type: `IMPLEMENT`
  - Confidence ≥80% (overall and all implied dimension minimums via the plan rubric)
  - All dependencies completed
  - No blockers noted in the task

**If any selected IMPLEMENT task is <80% → STOP and run `/re-plan` for that task.**

**If a selected task is 80–89%:** it is eligible to build, but treat the “unknowns” as real—ensure the task has explicit risks/verification steps (or update the plan before proceeding).

## Inputs

- The plan doc: `docs/plans/<feature-slug>-plan.md`
- Optional: fact-find brief: `docs/plans/<feature-slug>-fact-find.md`
- Optional: user-specified task IDs to build first

If the user does not specify tasks, build in ascending TASK order among eligible IMPLEMENT tasks.

## Pre-Build Check (Required)

Before editing any code, verify all of the following:

### A) Plan integrity

- The plan file exists and is the active source of truth.
- The target task exists and includes:
  - Type, Affects (file paths), Depends on, Confidence breakdown, Acceptance, Test plan, Planning validation (for M/L effort), Rollout/rollback notes, Documentation impact.
- The task is not marked `Superseded`/`Blocked`/`Needs-input`.

**If any required task fields are missing → treat as a confidence drop → STOP → `/re-plan`.**

### B) Eligibility gate

Confirm:
- Task Type = `IMPLEMENT`
- Overall confidence ≥80%
- All dependency tasks are complete (per plan status)
- No open DECISION tasks gate this work

**If not eligible → STOP → `/re-plan`.**

### C) Local readiness gate

- Working tree is clean (or you explicitly understand any local diffs and they are unrelated and will not be mixed).
- Baseline is sane:
  - If the repo has a standard "quick check" (typecheck/lint/unit), run it before starting.
  - If baseline is failing for unrelated reasons, do not proceed without documenting it in the plan and/or resolving via a separate, explicitly planned task.

### D) File-reading gate

Before changing anything:
- Read **all** files listed in "Affects"
- Read any immediately adjacent files needed to understand invariants (callers, types, schemas, tests)
- Check for test stubs from planning (L-effort tasks should have them; use as starting point for TDD)

**If you discover additional files must be modified and they are not in "Affects", treat as new scope:**
- STOP and update the plan (or `/re-plan`) before proceeding

## Build Loop (One Task per Cycle)

### 1) Select the next eligible task

**Rules:**
- Only one IMPLEMENT task at a time.
- Only tasks ≥80% confidence.
- Dependencies must be done.

### 2) Restate the task constraints (from the plan)

Extract from the plan into your working context:
- Acceptance criteria
- Test plan (what tests to add/run)
- Rollout/rollback requirements (flags, migrations, backwards compatibility)
- Observability expectations (logging/metrics)
- Documentation impact (standing docs to update)

**If any of these are unclear during execution → treat as confidence drop → STOP → `/re-plan`.**

### 3) Implement using TDD (test-first)

Follow test-driven development: write tests first, verify they fail, implement to make them pass.

**a) Audit existing tests for extinction**

Before writing new tests, check for existing tests related to the code you're modifying:

1. **Find related tests:** Search for test files covering the affected modules/components
2. **Evaluate test validity:** Read each test and verify it tests *current* behavior, not obsolete contracts
3. **Identify extinct tests:** Tests are "extinct" if they:
   - Assert behavior that no longer exists
   - Test removed/renamed APIs or props
   - Pass or fail for reasons unrelated to current functionality
   - Were not updated when the functional code last changed
4. **Update or remove extinct tests:** Do not layer new tests on top of outdated ones
   - Update extinct tests to reflect current behavior
   - Remove tests for functionality that no longer exists
   - Document any test removals in the commit message

**Why this matters:** Extinct tests give false confidence signals. A passing test suite that includes outdated tests does not validate current behavior.

**b) Write or complete tests first**
- If test stubs exist from planning (L-effort tasks): flesh them out into full tests
- If no stubs exist: write tests based on the task's acceptance criteria and test plan
- Tests should cover the expected behavior before any implementation code is written

**c) Run tests — verify they fail for the right reasons**
- Tests should fail because the feature/fix doesn't exist yet
- If tests pass unexpectedly → investigate (feature may already exist, or test is wrong)
- If tests fail for unexpected reasons → STOP → `/re-plan`

**d) Implement minimum code to make tests pass**
- Write only what's needed to make tests green
- Keep changes tightly scoped to the task
- Follow established patterns referenced in the plan (or discovered during file-reading)
- Do not "sneak in" refactors or over-engineer; if refactor is required, add a new task via `/re-plan`

**e) Refactor if needed (tests stay green)**
- Clean up implementation while keeping tests passing
- This is for minor cleanup only, not architectural changes

**f) Update documentation**
- Update all docs listed in the task's "Documentation impact" field
- If the task specifies "None", skip this step
- If implementation revealed additional docs needing updates not listed in the plan, update them and note the deviation

### 4) Final validation (mandatory)

Run repo-standard validations to ensure nothing is broken:
- Typecheck
- Lint
- Full relevant test suites (not just the new tests)

**Rule: never commit failing code.** If failures occur:
- If the fix is straightforward and clearly within the task scope, fix it
- If the failure indicates unclear behavior, unexpected dependencies, or uncertain approach:
  - STOP → `/re-plan`

### 5) Confidence and effort re-check during implementation

If you encounter any of the following, treat it as a **confidence regression**:
- unexpected dependency or integration boundary
- ambiguous long-term design choice not addressed in the plan
- blast radius larger than documented
- unclear contract/data shape
- validation failures that are non-obvious

**Effort misclassification check:**

If the actual work exceeds the classified effort level, STOP and `/re-plan`:
- S-effort task requires 3+ files → should be M or L
- M-effort task requires 6+ files or 3+ integration boundaries → should be L
- Any task introduces a new pattern but wasn't classified L → should be L
- Any task needs e2e tests but wasn't classified L → should be L

Do not continue building an under-classified task. The validation requirements exist to match the actual risk.

**Action:**
- STOP immediately
- Capture what you learned (files, symptoms, failing tests, actual scope)
- Run `/re-plan` for the task with corrected effort classification

### 6) Commit (task-scoped)

Create commits that are unambiguously tied to the task.

**Commit requirements:**
- Include the TASK ID in the subject line.
- Keep the commit scope limited to the task.
- Include the repository's required AI co-author trailer.

**Recommended format:**
```
feat(<feature-slug>): <short change summary> (TASK-XX)
fix(<feature-slug>): <short change summary> (TASK-XX)
test(<feature-slug>): <short change summary> (TASK-XX)
docs(plans): mark TASK-XX complete
```

**Co-authorship:** include `Co-authored-by:` using the exact convention already present in this repo's history/policy.

### 7) Update the plan (required after each task)

After committing the task, update `docs/plans/<feature-slug>-plan.md`:

**Per-task updates:**

Add or update:
- **Status:** `Complete (YYYY-MM-DD)`
- **Implementation Notes:** what changed, and where
- **Validation Evidence:** commands run + results summary
- **Commit(s):** commit hash(es) for traceability

If execution changed understanding:
- note confidence changes (and why)
- if confidence would now be <80%, do not "paper over" it—stop and `/re-plan`

**Plan-level updates:**
- Update `Last-updated`
- If your plan uses an effort-weighted `Overall-confidence`, recompute only if you materially changed confidence values (optional; do not churn it unnecessarily)
- If the plan has a Task Summary table, update it (e.g., add a Status column if not present, or mark TASK-XX as Done). If it does not, do status tracking inside each TASK section.

**Suggested per-task completion snippet:**

Add under the task:

```markdown
#### Build Completion (YYYY-MM-DD)
- **Status:** Complete
- **Commits:** <hash1>, <hash2>
- **TDD cycle:**
  - Tests written/completed: <file paths>
  - Initial test run: FAIL (expected — feature not implemented)
  - Post-implementation: PASS
- **Validation:**
  - Ran: `pnpm typecheck` — PASS
  - Ran: `pnpm lint` — PASS
  - Ran: `pnpm test <relevant-suite>` — PASS
- **Documentation updated:** <list of docs updated, or "None required">
- **Implementation notes:** <what changed, any deviations from plan>
```

### 8) Repeat

Move to the next eligible IMPLEMENT task and repeat the cycle.

## Stopping Conditions (Hard Stops)

| Condition | Action |
|-----------|--------|
| Task is <80% confidence (or becomes unclear mid-build) | Stop immediately → `/re-plan` |
| Task requires modifying files not listed in "Affects" | Stop → update plan or `/re-plan` |
| Unexpected dependency / larger blast radius discovered | Stop → `/re-plan` (and update affected tasks) |
| Actual scope exceeds classified effort level | Stop → `/re-plan` with corrected effort (validation must match risk) |
| Validation fails and fix is non-obvious | Stop → `/re-plan` |
| A DECISION is required (product/UX preference) | Stop → ask user via DECISION task in plan |
| Baseline repo is failing unrelated checks | Stop → document and resolve via separate planned work |

## Rules

- One IMPLEMENT task per cycle.
- Never build below 80% confidence.
- Never skip validation.
- Never commit failing code.
- Do not expand scope beyond the plan.
- Update the plan after every completed task.

**Escalation to user:** Only ask the user when:
- Business rules/UX intent cannot be inferred from repo or docs
- Two approaches are truly equivalent and require preference
- You have exhausted evidence sources and the uncertainty remains

When you do ask:
- Ask the minimum number of questions required to proceed
- Each question must state what decision it gates
- Include a recommended default with risk assessment if appropriate

## Quality Checks

A build cycle is considered complete only if:

- [ ] Pre-build checks (A–D) all passed before editing code.
- [ ] Existing related tests were audited for extinction (updated or removed if outdated).
- [ ] Tests were written/completed BEFORE implementation code (TDD).
- [ ] Tests initially failed for the expected reasons (feature not yet implemented).
- [ ] Implementation is scoped exactly to the task (no scope creep).
- [ ] Actual scope matched classified effort (if not, stopped and re-planned with correct effort).
- [ ] Standing documentation updated per "Documentation impact" field (or confirmed "None").
- [ ] All validation commands passed (typecheck, lint, tests).
- [ ] Commits include TASK ID and are scoped to the task.
- [ ] Plan doc updated with Status, Commits, Validation evidence.
- [ ] Confidence was re-assessed; if <80%, stopped and triggered `/re-plan`.
- [ ] No failing code was committed.

## Completion Messages

Use one of the following outcomes:

**A) All eligible tasks complete:**
> "All eligible IMPLEMENT tasks are complete and validated. Plan updated with completion status and validation evidence. Remaining work: <none / list>. Ready for PR review."

**B) Some tasks remain but are not eligible:**
> "Completed N/M IMPLEMENT tasks (≥80% confidence). Tasks <IDs> are not eligible (confidence <80% or blocked). Recommend `/re-plan` for those tasks before continuing."

**C) Stopped mid-task due to confidence regression:**
> "Stopped during TASK-XX due to newly discovered complexity or unclear blast radius. No further implementation will proceed until `/re-plan` updates the plan for TASK-XX (and any dependent tasks)."
