---
name: re-plan
description: Resolve low-confidence tasks in an existing plan. Investigate, remove uncertainty, make decisions with evidence, and update the plan doc so that remaining work can proceed safely.
---

# Re-Plan

Resolve low-confidence tasks in an existing plan. Investigate, remove uncertainty, make decisions with evidence, and update the plan doc so that remaining work can proceed safely.

## Confidence Policy

- **Confidence ≥90 is a motivation, not a quota.** Increasing confidence should come from reducing uncertainty (evidence, tests, spikes), not from deleting planned work.
- If work is valuable but not yet high-confidence, preserve it as **deferred/Phase 3** and add **"What would make this ≥90%"** notes.

## TDD Compliance Requirement

**Every IMPLEMENT task must have an enumerated test contract before it can be marked Ready.**

A task without test cases (TC-XX) cannot proceed to `/build-feature`, regardless of confidence score. Re-plan must add test contracts to any tasks missing them.

**Test contract format:**
```markdown
- **Test contract:**
  - **TC-01:** <scenario> → <expected outcome>
  - **TC-02:** <error case> → <expected outcome>
  - **TC-03:** <edge case> → <expected outcome>
  - **Test type:** <unit | integration | e2e | contract>
  - **Test location:** <path/to/test.ts (existing) or path/to/new-test.ts (new)>
  - **Run:** <command to execute>
```

**Minimum test contract requirements:**
- At least one TC per acceptance criterion
- Happy path covered (TC-01 typically)
- At least one error/edge case for M/L effort tasks
- Test type and location specified

## Operating Mode

**RE-PLANNING ONLY**

**Allowed:** read files, search repo, inspect tests, trace call sites/dependencies, review `docs/plans/`, review targeted git history, consult external official docs if needed.

**Not allowed:** code changes, refactors, commits except plan/notes updates, applying migrations, destructive commands.

## Inputs

- An existing plan doc: `docs/plans/<feature-slug>-plan.md`
- The task IDs to re-plan (explicit from user or inferred from below-threshold tasks)
- Optional: fact-find brief `docs/plans/<feature-slug>-fact-find.md`

**If the plan doc does not exist:**
- **With fact-find:** Offer to create initial plan from fact-find, then proceed with re-planning
- **Without fact-find:** Stop and instruct: "No plan exists. Run `/plan-feature` to create initial plan first."

**If the plan doc is stale/out-of-sync:**
- Create a minimal recovery plan if salvageable (preserve task IDs, update with current reality)
- Otherwise, recommend `/plan-feature` for clean rebuild

## Outputs

- Update the existing plan doc in-place: `docs/plans/<feature-slug>-plan.md`
- Optional (only if the investigation is extensive): add a short supporting note: `docs/plans/<feature-slug>-replan-notes.md`
- No code changes. No commits except doc updates.

## When to Use

Run `/re-plan` when any of the following occurs:

- A plan task has overall confidence <80% (or is explicitly flagged as blocked).
- **A task is missing a test contract (TC-XX enumeration) — cannot proceed to build without it.**
- During implementation, confidence drops due to unexpected complexity or new evidence.
- New information invalidates assumptions, dependencies, or approach decisions.
- Build was stopped due to uncertainty and needs a structured reset.
- `/build-feature` rejected a task due to missing test contract.

**Note:** `/re-plan` is not for generating a plan from scratch; that is `/plan-feature`. `/re-plan` operates on a specific plan and task IDs.

## Workflow

### 1) Select tasks and establish the re-plan scope

Identify the target tasks:
- Prefer explicit task IDs provided by the user.
- Otherwise, scan the plan and select any tasks with overall confidence <80% **and** any tasks that depend on them.
- **Also select any IMPLEMENT tasks missing test contracts (TC-XX)** — these cannot proceed to build regardless of confidence.

For each target task, record:
- current confidence (overall + per dimension)
- current acceptance criteria
- dependencies (TASK-IDs)
- affected files/modules
- **test contract status:** complete (has TC-XX) | incomplete | missing

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

### 3b) Complete test contracts for tasks missing them

For each IMPLEMENT task missing a test contract (or with incomplete TC-XX enumeration):

**Step 1: Review acceptance criteria**
- Each acceptance criterion must map to at least one test case
- Identify gaps: criteria without corresponding TCs

**Step 2: Enumerate test cases**
- **TC-01** (always): Happy path / primary success scenario
- **TC-02+**: Error cases, edge cases, boundary conditions
- For M/L effort tasks: at least 3 TCs required
- For S effort tasks: at least 1 TC required (may be more based on complexity)

**Step 3: Specify test metadata**
- **Test type:** unit | integration | e2e | contract
- **Test location:** existing file to extend, or new file path
- **Run command:** exact command to execute tests

**Step 4: Add test contract to task**
Use this format:
```markdown
- **Test contract:**
  - **TC-01:** <scenario> → <expected outcome>
  - **TC-02:** <error case> → <expected outcome>
  - **Acceptance coverage:** TC-01 covers criteria 1,2; TC-02 covers criteria 3
  - **Test type:** <unit | integration | e2e>
  - **Test location:** `path/to/test.ts`
  - **Run:** `pnpm test --testPathPattern=<pattern>`
```

**Deriving test cases from acceptance criteria:**

| Acceptance Criterion Type | Test Case Pattern |
|---------------------------|-------------------|
| "X returns Y" | TC: Call X → assert Y |
| "X validates Y" | TC-a: Valid input → success; TC-b: Invalid input → error |
| "X handles error Z" | TC: Trigger Z → assert error handling |
| "X is visible in Y" | TC: Create X → query Y → assert presence |
| "X with auth" | TC-a: With auth → success; TC-b: Without auth → 401 |

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

### 5a) Confidence Score Validation Checklist (Mandatory Before Finalizing)

Before marking any task as Ready or finalizing confidence scores, verify:

- [ ] **Evidence citation:** Every non-trivial claim includes file path + line number
  - Example: "Bug location: `metadata.ts:56-60`" not "metadata.ts has a bug"
- [ ] **Code verification:** If claiming something exists/doesn't exist, you've read the file
  - Example: "No tests exist: `rg generateMetadata apps/brikette/src/test` → zero hits"
- [ ] **Min-of-dimensions:** Overall confidence = min(Implementation, Approach, Impact), not weighted average
- [ ] **Internal consistency:** Confidence in task body matches confidence in summary table
- [ ] **No assumptions:** If you haven't verified in code, it's an "Unknown" not a confident claim
- [ ] **Test impact quantified:** If tests will break, list how many and which files

**If any checklist item fails, do NOT finalize the confidence score. Investigate or mark as Unknown.**

### 5b) Test Contract Validation Checklist (Mandatory for all IMPLEMENT tasks)

Before marking any IMPLEMENT task as Ready, verify:

- [ ] **TC enumeration exists:** Task has at least one `TC-XX:` line
- [ ] **Acceptance coverage:** Every acceptance criterion maps to at least one TC
- [ ] **Scenario + outcome:** Each TC has format `<scenario> → <expected outcome>`
- [ ] **Test type specified:** unit | integration | e2e | contract
- [ ] **Test location specified:** file path (existing or new)
- [ ] **Run command specified:** exact command to execute tests
- [ ] **Minimum TC count met:**
  - S-effort: ≥1 TC
  - M-effort: ≥3 TCs (including at least one error/edge case)
  - L-effort: ≥5 TCs (including error cases, edge cases, and integration scenarios)

**If any checklist item fails, the task is NOT ready for build. Add the missing test contract elements.**

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

- **Ready to build:** all IMPLEMENT tasks are ≥80% confidence **AND** have complete test contracts (TC-XX)
- **TDD incomplete:** confidence ≥80% but some tasks missing test contracts — add test contracts before proceeding
- **Partially ready:** some tasks are 60–79% with explicit verification steps; none below 60%
- **Blocked:** any IMPLEMENT task is <60% or requires user input to proceed safely

**TDD gate is mandatory.** A task with 90% confidence but no test contract is NOT ready for build.

Provide the recommended next action:
- `/build-feature` if ready (confidence ≥80% AND test contracts complete)
- `/re-plan` again if remaining blocked tasks exist or test contracts are missing
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
- [ ] Plan doc updated: task confidence deltas, dependencies, acceptance criteria, test contract, rollout/rollback.
- [ ] Related tasks re-assessed and updated where necessary.
- [ ] User questions are only asked when genuinely unavoidable and are decision-framed.
- [ ] **TDD compliance:** Every IMPLEMENT task has a complete test contract with TC-XX enumeration.
- [ ] **Test contract validation:** All items in 5b) checklist pass for every IMPLEMENT task.

## Completion Messages

**All ≥80% with complete test contracts:**
> "Re-plan complete. Updated `docs/plans/<feature-slug>-plan.md`. All implementation tasks are ≥80% confidence with complete test contracts. Proceed to `/build-feature`."

**Confidence ≥80% but missing test contracts:**
> "Re-plan complete. Updated plan. Tasks <IDs> are ≥80% confidence but missing test contracts (TC-XX). Run `/re-plan` again to add test contracts before proceeding to build."

**Some caution tasks (60–79%) but none <60%:**
> "Re-plan complete. Updated plan. Tasks <IDs> remain 60–79% with explicit verification steps; recommend building ≥80% tasks first and reassessing."

**Blocked / needs user input:**
> "Re-plan complete but still blocked on <IDs> (<%>) due to <dimension>. I need the following decisions from you: <questions>."
