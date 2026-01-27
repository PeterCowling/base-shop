---
name: re-plan
description: Resolve low-confidence tasks in an existing plan. Investigate, remove uncertainty, make decisions with evidence, and update the plan doc so that remaining work can proceed safely.
---

# Re-Plan

Resolve low-confidence tasks in an existing plan. Investigate, remove uncertainty, make decisions with evidence, and update the plan doc so that remaining work can proceed safely.

## CI Policy

- In plan docs, **CI** means **Confidence Index** (plan confidence), not CI/CD.
- **CI ≥90 is a motivation, not a quota.** Increasing CI should come from reducing uncertainty (evidence, tests, spikes), not from deleting planned work.
- If work is valuable but not yet high-confidence, preserve it as **deferred/Phase 3** and add **“What would make this ≥90%”** notes.

## Operating Mode

**RE-PLANNING ONLY**

**Allowed:** read files, search repo, inspect tests, trace call sites/dependencies, review `docs/plans/`, review targeted git history, consult external official docs if needed.

**Not allowed:** code changes, refactors, commits except plan/notes updates, applying migrations, destructive commands.

## Inputs

- An existing plan doc: `docs/plans/<feature-slug>-plan.md`
- The task IDs to re-plan (explicit from user or inferred from below-threshold tasks)
- Optional: fact-find brief `docs/plans/<feature-slug>-fact-find.md`

## Outputs

- Update the existing plan doc in-place: `docs/plans/<feature-slug>-plan.md`
- Optional (only if the investigation is extensive): add a short supporting note: `docs/plans/<feature-slug>-replan-notes.md`
- No code changes. No commits except doc updates.

## When to Use

Run `/re-plan` when any of the following occurs:

- A plan task has overall confidence <80% (or is explicitly flagged as blocked).
- During implementation, confidence drops due to unexpected complexity or new evidence.
- New information invalidates assumptions, dependencies, or approach decisions.
- Build was stopped due to uncertainty and needs a structured reset.

**Note:** `/re-plan` is not for generating a plan from scratch; that is `/plan-feature`. `/re-plan` operates on a specific plan and task IDs.

## Workflow

### 1) Select tasks and establish the re-plan scope

Identify the target tasks:
- Prefer explicit task IDs provided by the user.
- Otherwise, scan the plan and select any tasks with overall confidence <80% **and** any tasks that depend on them.

For each target task, record:
- current confidence (overall + per dimension)
- current acceptance criteria
- dependencies (TASK-IDs)
- affected files/modules

**If the plan doc does not exist or is stale/out-of-sync with reality**, create a minimal recovery plan:
- Locate the most recent plan in `docs/plans/` for the feature slug.
- If none exists, stop and instruct the user to run `/plan-feature` (do not fabricate a plan under `/re-plan`).

### 2) Diagnose the confidence gap by dimension

For each low-confidence task, identify which dimension(s) caused the min-score:

| Weak Dimension | Typical Symptoms | Primary Work to Do |
|----------------|------------------|-------------------|
| **Implementation (<80%)** | unclear API, unknown how to integrate, no precedent | find analogous code; inspect interfaces; confirm library/framework behavior |
| **Approach (<80%)** | multiple viable designs; unclear long-term fit | enumerate options; evaluate tradeoffs; align to repo conventions; decide |
| **Impact (<80%)** | uncertain blast radius; hidden consumers; migration risk | trace call sites; map contracts; identify side effects; check tests and boundaries |

Record the diagnosis per task explicitly in the plan update.

### 3) Perform targeted investigation (evidence-driven)

#### A) Close Implementation gaps

**Minimum actions:**
- Locate at least one analogous pattern in the repo.
- Identify the exact integration seam (function/class/module boundaries).
- Confirm required types/contracts and where they are validated.
- Identify the correct test layer(s) that can prove correctness.

**Evidence to capture:**
- file paths (and key symbol names)
- pattern references ("this matches pattern used in X")
- relevant tests and how they assert behavior

#### B) Close Approach gaps

**Minimum actions:**
- List at least two viable approaches (A/B).
- Evaluate each for:
  - consistency with existing architecture and conventions
  - coupling and maintainability
  - migration/rollout complexity
  - operational risk and observability
- Decide on a chosen approach based on evidence.
- If the decision is genuinely a product preference, escalate to the user with a precise choice and recommendation.

**Deliverable:**
- A short "Decision" paragraph added to the plan (and a Decision Log entry).

#### C) Close Impact gaps

**Minimum actions:**
- Map upstream and downstream dependencies:
  - what this change depends on
  - who/what consumes it
- Identify integration boundaries:
  - package boundaries, service boundaries, API/event contracts
- Inventory existing tests that cover impacted paths, plus gaps.
- **Check for extinct tests:** Tests that assert obsolete behavior give false confidence. Flag any tests that:
  - Test removed/renamed APIs or contracts
  - Assert behavior that no longer exists
  - Were not updated when functional code last changed
- Identify rollout/rollback requirements:
  - feature flags, backward compatibility, migration sequencing

**Evidence to capture:**
- callers / references (file paths)
- contracts (types/schemas/endpoints)
- tests and commands
- extinct tests flagged for update during build

### 4) Resolve open questions (self-serve first; escalate last)

**Rules:**
- Investigate the repo and official docs first.
- Only ask the user when:
  - business rules/UX intent cannot be inferred,
  - two approaches are truly equivalent and require preference,
  - or you have exhausted evidence sources and the uncertainty remains.

**If user input is needed:**
- Ask only the minimum set of questions required to proceed.
- Each question must include:
  - why it matters
  - what decision it affects
  - a recommended default with risk (if appropriate)

### 5) Update the plan doc with deltas (mandatory structure)

Update `docs/plans/<feature-slug>-plan.md` as follows:

**For each re-planned task:**
- Preserve the same TASK-ID (do not renumber).
- Add a **Re-plan Update** block containing:
  - Previous confidence → new confidence
  - What was investigated (repo areas, tests, docs)
  - Decisions made (and why)
  - Updated dependencies/order (if changed)
  - Updated acceptance criteria/test plan/rollout notes as needed

**If the task remains complex:**
- Split into:
  - an INVESTIGATE task (to remove remaining unknowns), and
  - one or more IMPLEMENT tasks that become ≥80% once the investigation is done.

**Also update:**
- `Last-updated` in frontmatter
- `Overall-confidence` (effort-weighted as defined in `/plan-feature`)
- Task Summary table (confidence, effort, dependencies)

### 6) Re-assess knock-on effects

After resolving the target tasks:

Identify any tasks whose confidence should change due to:
- new constraints
- new dependencies
- revised approach
- newly discovered blast radius

Update those tasks' confidence (and notes) if materially affected.

If the plan ordering changes, update dependencies explicitly.

### 7) Decision point and handoff

End by classifying the plan state:

- **Ready to build:** all IMPLEMENT tasks are ≥80%
- **Partially ready:** some tasks are 60–79% with explicit verification steps; none below 60%
- **Blocked:** any IMPLEMENT task is <60% or requires user input to proceed safely

Provide the recommended next action:
- `/build-feature` if ready (or for high-confidence subset)
- `/re-plan` again if remaining blocked tasks exist
- Ask user questions if genuinely required

## Plan Update Snippet (insert into each affected task)

Add this block inside the task section:

```markdown
#### Re-plan Update (YYYY-MM-DD)
- **Previous confidence:** 55%
- **Updated confidence:** 84%
  - Implementation: 84% — <why + evidence>
  - Approach: 88% — <why + evidence>
  - Impact: 84% — <why + evidence>
- **Investigation performed:**
  - Repo: `path/to/file.ts`, `path/to/other.ts`
  - Tests: `path/to/test.spec.ts` (notes)
  - Docs: <internal/external reference>
- **Decision / resolution:**
  - <what was decided and why>
- **Changes to task:**
  - Dependencies: <updated TASK-IDs>
  - Acceptance: <updated bullets if changed>
  - Test plan: <updated bullets if changed>
  - Rollout/rollback: <updated notes if changed>
```

Also add a short entry to the plan's **Decision Log** whenever an approach decision is made or reversed.

## Quality Checks (must pass)

- [ ] Each low-confidence task has the weak dimension(s) explicitly diagnosed.
- [ ] Investigation is targeted and evidenced (file paths/tests/docs).
- [ ] Any approach decision includes alternatives, tradeoffs, and rationale.
- [ ] Impact is mapped (upstream/downstream) with explicit blast radius notes.
- [ ] Plan doc updated: task confidence deltas, dependencies, acceptance criteria, test plan, rollout/rollback.
- [ ] Related tasks re-assessed and updated where necessary.
- [ ] User questions are only asked when genuinely unavoidable and are decision-framed.

## Completion Messages

**All ≥80%:**
> "Re-plan complete. Updated `docs/plans/<feature-slug>-plan.md`. All implementation tasks are ≥80% confidence. Proceed to `/build-feature`."

**Some caution tasks (60–79%) but none <60%:**
> "Re-plan complete. Updated plan. Tasks <IDs> remain 60–79% with explicit verification steps; recommend building ≥80% tasks first and reassessing."

**Blocked / needs user input:**
> "Re-plan complete but still blocked on <IDs> (<%>) due to <dimension>. I need the following decisions from you: <questions>."
