---
name: plan-feature
description: Create a confidence-gated implementation plan for a feature. Planning only - produces a plan doc with atomic tasks, acceptance criteria, and per-task confidence assessments. Build is gated at ≥80% confidence; Confidence ≥90% is a motivation, not a quota.
---

# Plan Feature

Create a confidence-gated implementation plan for a feature. Planning only: produce a plan doc with atomic tasks, acceptance criteria, and per-task confidence assessments.

**CI policy:** CI≥90 is a motivation/diagnostic, not a quota. Preserve breadth by phasing/deferment and by adding “What would make this ≥90%” notes. The **build gate** is still confidence-based: only IMPLEMENT tasks ≥80% proceed to `/build-feature`.

## Operating Mode

**PLANNING ONLY**

**Allowed:** read files, search repo, inspect tests, trace dependencies, run tests (for validation), run read-only commands (e.g., `rg`, `ls`, `cat`, `npm test -- --listTests`), consult existing `docs/plans`, consult external docs if needed, write test stubs for L-effort tasks.

**Not allowed:** implementation code changes, refactors, migrations applied, running destructive commands, opening PRs.

**Commits allowed:**
- Plan file (`docs/plans/<slug>-plan.md`)
- Test stub files for L-effort tasks
- If BOS integration active: card files (`docs/business-os/cards/{CARD-ID}.*`) and stage docs

## Inputs

Use the best available sources, in this priority order:

1. Fact-find brief from `/fact-find` (preferred)
2. Existing plan doc(s) in `docs/plans/`
3. Feature request / ticket / user prompt
4. Repo reality (current code + tests)

If a fact-find brief does not exist, proceed only if the feature is genuinely well-understood; otherwise, create INVESTIGATION tasks to raise confidence rather than guessing.

### Test Foundation Check (Required when fact-find exists)

When starting from a fact-find brief, verify the brief provides adequate test foundation:

**Required in fact-find brief:**
- [ ] Test Landscape section with: infrastructure, patterns, coverage, gaps
- [ ] Testability assessment (easy/hard to test, seams needed)
- [ ] Testability confidence input (0-100%)

**If Test Landscape is missing or incomplete:**
- Do NOT proceed with planning
- Return to `/fact-find` to complete the Test Landscape section
- Planning without test foundation leads to undertested implementations

### Consuming Fact-Find Confidence Inputs

If the fact-find brief includes Confidence Inputs (Implementation, Approach, Impact, Testability), use them as **starting baselines** for task confidence:

| Fact-Find Input | Informs |
|-----------------|---------|
| Implementation confidence | Individual task confidence scores |
| Approach confidence | Overall plan confidence; triggers DECISION tasks if <80% |
| Impact confidence | Blast radius accuracy; triggers INVESTIGATION tasks if <80% |
| Testability confidence | Test contract completeness expectations |

**Handoff rules:**
- If any fact-find confidence input is <80%, the plan MUST include tasks to raise it (INVESTIGATION or DECISION)
- Do not claim 90%+ task confidence if fact-find's testability confidence was <70%
- Task confidence cannot exceed fact-find's implementation confidence by >10% without new evidence

### Slug Stability

When a Card-ID is present (BOS integration), read `Feature-Slug` from the card frontmatter rather than re-deriving it. This ensures consistency across fact-find → plan → build.

## Outputs

- Create or update one plan file: `docs/plans/<feature-slug>-plan.md`
- For L-effort tasks: test stub files (failing tests that define acceptance criteria)
- No implementation code changes
- Commits: plan file only (S/M) or plan file + test stubs (L)

## Non-goals

- Writing implementation code
- Producing vague "do X somehow" tasks
- Inflating confidence without evidence (pattern references, file paths, tests, etc.)
- Duplicating existing plan docs
- Under-classifying effort to avoid validation requirements
- Deferring complex tasks because they require more upfront validation
- Splitting L-effort tasks into smaller tasks solely to avoid writing test stubs
- Deleting planned work purely to raise confidence (phase or defer instead, unless the user explicitly changes scope)

## When to Use

Run `/plan-feature` when:

- A fact-find brief is complete and ready for planning (preferred entry point)
- The feature is well-understood and doesn't require extensive investigation
- An existing plan needs significant revision or new tasks added

Do **not** use `/plan-feature` if:
- You need to understand the current system first → use `/fact-find`
- You're addressing low-confidence tasks in an existing plan → use `/re-plan`
- You're ready to implement → use `/build-feature`

## Fast Path (with argument)

**If user provides a slug or card ID** (e.g., `/plan-feature commerce-core` or `/plan-feature BRIK-ENG-0020`):
- Skip discovery entirely
- If slug: read `docs/plans/<slug>-fact-find.md` directly (or create new plan)
- If card ID: look up plan link from card file
- **Target: <2 seconds to start planning**

## Discovery Path (no argument)

**If user provides no argument**, read the pre-computed index (single file):

```
docs/business-os/_meta/discovery-index.json
```

Present the `readyForPlanning` array as a table:

```markdown
## Ready for Planning

| Slug | Title | Card | Business |
|------|-------|------|----------|
| commerce-core-readiness | Commerce Core Readiness | - | - |
| email-autodraft-response-system | Email Autodraft Response System | BRIK-ENG-0020 | BRIK |

Enter a slug to start planning, or describe a new feature.
```

## Status Vocabulary (canonical)

Use these values consistently across all plan documents:

**Plan Status** (frontmatter):
- `Draft` — plan is being written, not ready for build (default for new plans)
- `Active` — plan is approved and work may proceed (set when ready for `/build-feature`)
- `Complete` — all tasks done
- `Superseded` — replaced by a newer plan

**Transition to Active:** Set Status to `Active` when:
- All intended tasks are captured
- DECISION tasks are either resolved or explicitly marked non-blocking
- All IMPLEMENT tasks have test contracts (TC-XX enumerated)
- The plan has been reviewed (by user or via explicit approval)

**Task Status** (per-task field):
- `Pending` — not yet started
- `In-Progress` — currently being worked
- `Complete (YYYY-MM-DD)` — done, with completion date
- `Blocked` — cannot proceed due to dependency or uncertainty
- `Superseded` — replaced by another task
- `Needs-Input` — waiting for user decision

## Workflow

### 1) Intake and scope alignment

- Identify the feature name and a stable **feature slug** for the plan filename.
- Define:
  - **Goals** (what success looks like)
  - **Non-goals** (explicit out-of-scope)
  - **Constraints** (performance, compatibility, security, rollout, deadlines if provided)
  - **Assumptions** (only if truly necessary; keep short)

### 2) Locate prior work and avoid duplicates

- Check `docs/plans/` for related work.
- If a plan exists: **update it** (preserve task IDs; append new tasks; mark superseded items).
- If multiple overlapping docs exist: consolidate into the most relevant plan and note consolidation in a short "Decision Log" entry.

### 3) Study the codebase (evidence-first)

Do enough repo study to justify task confidence. Minimum checklist:

- Identify entry points for the feature (routes/controllers/handlers/commands/UI components).
- Identify data models touched (DB schema, domain models, API contracts).
- Identify integration points (external services, queues, caches, auth).
- Identify test coverage and the correct test layer(s) (unit/integration/e2e).
- Identify configuration/feature-flag patterns already used.
- Identify observability patterns (logging, metrics, tracing, error reporting).
- Identify standing documentation that may need updates (architecture docs, API docs, READMEs, runbooks).

When you reference code patterns, include:
- File paths (and line numbers if easy)
- The name of an existing similar feature/module where applicable

### 4) Validate understanding through tests (effort-scaled)

Run existing tests to verify your understanding matches reality. The level of validation scales with task effort:

| Effort | Required Validation |
|--------|---------------------|
| S | Run tests for directly affected files; ≥1 TC per acceptance criterion |
| M | Run tests for affected modules + boundaries; test case specs with expected assertions |
| L | Run full test suites + write test stubs (`test.todo`) that implement TC specifications |

**Check for extinct tests first:**

Before relying on existing tests for validation, verify they are still valid:
- Read test assertions and confirm they test *current* behavior, not obsolete contracts
- Tests are "extinct" if they assert behavior that no longer exists or test removed APIs
- Note any extinct tests found — they must be updated or removed during `/build-feature`
- Do not count extinct test results as validation evidence

**What to capture for each task:**
- Which test commands ran and their results
- Any unexpected failures or behaviors discovered
- Tests that exercise the contracts/boundaries you'll depend on
- Any extinct tests discovered (flag for update during build)
- For L tasks: file paths of test stubs written

**Confidence adjustment rules:**
- If tests reveal unexpected behavior → confidence drops (evidence trumps reasoning)
- For M/L tasks, confidence >80% requires documented test evidence
- Pure reasoning ("I read the code and it looks straightforward") caps at 75% for M/L tasks without test evidence

**For L tasks — write test stubs:**
- Translate acceptance criteria into test skeletons using `test.todo()` or `it.skip()` (non-failing)
- Include the test name, TC-XX reference, and a comment describing the expected assertion
- These validate that you understand what "done" looks like in executable terms
- Stubs become the starting point for build-feature's TDD cycle
- Commit test stubs with the plan (allowed exception to "no code changes")

**Test stub format (non-failing):**
```typescript
describe('Feature: <feature-name>', () => {
  // TC-01: <scenario> → <expected outcome>
  test.todo('should <expected behavior>');

  // TC-02: <error case> → <expected outcome>
  test.todo('should return error when <condition>');
});
```

**Why non-failing:** Test stubs use `test.todo()` or `it.skip()` so they don't break CI. Build-feature converts them to active tests at task start, then watches them fail for the right reason.

**If validation reveals problems:**
- Document unexpected findings in the task
- Adjust confidence scores based on evidence
- Create INVESTIGATION tasks for areas that need deeper understanding

### 5) Decide the approach (with alternatives when warranted)

- Write the proposed approach as a concise architecture description.
- If there are multiple viable approaches, document:
  - Option A / Option B
  - Trade-offs
  - Why the chosen approach is best long-term (or why the decision is deferred via a DECISION task)

### 6) Break work into atomic tasks

**Rules:**
- One logical unit per task (typically one file or one cohesive change set).
- Order tasks by prerequisites (infra/contracts before consumers).
- Each task must include:
  - **Affects** (file paths/modules — see format below)
  - **Dependencies** (TASK-IDs)
  - **Acceptance criteria**
  - **Test contract** (enumerated test cases — see below)
  - **Rollout/rollback** (feature flag, migration strategy, safe deploy)
  - **Documentation impact** (standing docs to update, or "None" if no docs affected)
  - **Notes** (links/pattern references)

**Affects field format:**
- **Primary** (files being modified): `src/path/to/file.ts`
- **Secondary** (read-only dependencies): `[readonly] src/path/to/types.ts`

Use `[readonly]` prefix for files that must be read to understand contracts but won't be changed. This helps `/build-feature` distinguish scope boundaries — modifying a `[readonly]` file is a scope expansion that requires re-planning.

**Test contract requirements:**
- Each acceptance criterion must map to ≥1 test case (TC-XX)
- Test cases enumerate specific scenarios with expected outcomes
- Format: `TC-XX: <scenario> → <expected outcome>`
- Include: happy path, error cases, edge cases
- For M/L tasks: test cases become the implementation contract
- "Add tests" is not a test contract — enumerate the scenarios

If something is uncertain, create an explicit **INVESTIGATION** task (to raise confidence) or a **DECISION** task (to choose between alternatives). Do not bury uncertainty inside implementation tasks.

### 7) Classify effort honestly (no gaming)

Effort classification determines validation requirements. Classify based on objective criteria, not to minimize validation work.

#### Effort criteria (use the HIGHEST applicable level)

| Criterion | S | M | L |
|-----------|---|---|---|
| Files affected | 1–2 | 3–5 | 6+ |
| Integration boundaries crossed | 0 | 1–2 | 3+ |
| New patterns introduced | None | Minor variation | New pattern |
| External dependencies touched | None | Existing only | New or modified |
| Data model changes | None | Additive only | Schema migration |
| Test layers needed | Unit only | Unit + integration | Unit + integration + e2e |

**Rules:**
- If ANY criterion hits L → the task is L-effort
- If ANY criterion hits M (and none hit L) → the task is M-effort
- S-effort only if ALL criteria are S-level

**Anti-gaming provisions:**
- Do not artificially split tasks to reduce effort classification. If the logical unit of work is L-effort, plan it as L-effort.
- Do not defer complex tasks because they require test stubs. The validation work is proportional to the risk—skipping it doesn't reduce the risk, it just hides it.
- If during build the actual scope exceeds the classified effort, build-feature will trigger `/re-plan`.

### 8) Confidence scoring (per task, evidence-based)

For each task, assign three dimension scores (0–100%). The overall confidence = min(Implementation, Approach, Impact).

#### Dimension definitions

| Dimension | What it measures | Evidence to cite |
|-----------|------------------|------------------|
| **Implementation** | We know how to write correct code | Existing pattern, known APIs, similar code, test harness exists |
| **Approach** | This is the right long-term design | Architectural fit, avoids tech debt, aligns with conventions |
| **Impact** | We understand what it touches and how to avoid regressions | Call sites identified, contracts clear, migrations/flags/rollout understood |

#### Scoring rubric (use consistently)

- **90–100:** Clear precedent + low novelty + testable + isolated impact
- **80–89:** Straightforward, minor unknowns, mitigations identified
- **60–79:** Material uncertainty remains; proceed only with explicit risks and verification steps
- **<60:** Do not build. Convert to INVESTIGATION/DECISION and trigger `/re-plan` for that area.

**Interpretation note:** Confidence ≥90% is not required to plan or build. If a task is <90, keep it in scope but include a short “What would make this ≥90%” note (tests, spikes, evidence, rollout rehearsal) that would raise confidence without deleting work.

#### Required "why" text

For each dimension, include one sentence explaining the score and what evidence supports it.

#### Evidence requirements by effort (for >80% confidence)

| Effort | Required Evidence |
|--------|-------------------|
| S | Code patterns identified; file paths documented; ≥1 TC per acceptance criterion |
| M | Above + existing tests pass + test cases with expected assertions documented |
| L | Above + failing test stubs committed with the plan |

**Test coverage gate:** A task cannot exceed 80% confidence without test cases that cover all acceptance criteria. Vague test plans ("add integration tests") cap confidence at 70%.

A task cannot exceed 80% confidence without executable evidence proportional to its effort level. Pure reasoning without test evidence caps M/L tasks at 75%.

### 9) Resolve open questions yourself (before asking the user)

When confidence is low:
- Read more repo code (neighbors, call sites, types, tests)
- Trace dependencies (imports, routes, service wiring)
- Validate assumptions by locating authoritative sources (internal docs, official library docs)
- Prefer evidence over inference

Only ask the user when:
- Business rules/UX intent cannot be inferred from repo or docs
- Two approaches are truly equivalent and require preference
- You have exhausted evidence sources and the uncertainty remains

When you do ask:
- Ask the minimum number of questions required to proceed
- Each question must state what decision it gates
- Include a recommended default with risk assessment if appropriate

### 10) Persist the plan doc

Write/update `docs/plans/<feature-slug>-plan.md` using the template below.

### 11) Completion message (decision-oriented)

At the end, tell the user:
- Which tasks are **Ready** (≥80%)
- Which are **Caution** (60–79%)
- Which are **Blocked** (<60%) and require `/re-plan`
- The recommended next action (`/build-feature` or `/re-plan`)

## Plan Template

```markdown
---
Type: Plan
Status: Draft
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Overall-confidence: <weighted average %>
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort
# Business OS Integration (optional - inherited from fact-find or manually provided)
Business-Unit: <BRIK | PLAT | PIPE | BOS | etc.>
Card-ID: <from fact-find or manually provided>
---

# <Feature Name> Plan

## Summary
<What we're building and why. 3–6 sentences max.>

## Goals
- <Goal 1>
- <Goal 2>

## Non-goals
- <Non-goal 1>
- <Non-goal 2>

## Constraints & Assumptions
- Constraints:
  - <perf/security/compatibility/rollout constraints>
- Assumptions:
  - <only if necessary>

## Fact-Find Reference
- Related brief: `docs/plans/<feature-slug>-fact-find.md` (if exists)
- Key findings: <inline bullets of key findings + resolved questions>

## Existing System Notes
- Key modules/files:
  - `path/to/area` — <why relevant>
- Patterns to follow:
  - <reference similar code by path/module name>

## Proposed Approach
<High-level design, data flow, contracts. Include alternatives if relevant.>
- Option A: <summary + trade-offs>
- Option B: <summary + trade-offs>
- Chosen: <A/B> because <reason>

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| TASK-01 | IMPLEMENT | ... | 92% | M | Pending | - |
| TASK-02 | INVESTIGATE | ... | 55% ⚠️ | S | Pending | TASK-01 |
| TASK-03 | DECISION | ... | 60% ⚠️ | S | Needs-Input | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Tasks

### TASK-01: <description>
- **Type:** IMPLEMENT
- **Affects:** `path/to/file.ts`, `path/to/other.ts`
- **Depends on:** <TASK-IDs or "-">
- **Confidence:** 92%
  - Implementation: 95% — <why>
  - Approach: 90% — <why>
  - Impact: 90% — <why>
- **Acceptance:**
  - <bullet list of verifiable outcomes>
- **Test contract:**
  - **Test cases (enumerated):**
    - TC-01: <scenario> → <expected outcome>
    - TC-02: <error case> → <expected outcome>
    - TC-03: <edge case> → <expected outcome>
  - **Acceptance coverage:** <which acceptance criteria each TC covers>
  - **Test type:** <unit | integration | e2e | contract>
  - **Test location:** <path/to/test.ts (existing) or path/to/new-test.ts (new)>
  - **Run:** <command to execute>
- **Planning validation:** (required for M/L effort)
  - Tests run: `<commands>` — <pass/fail, count>
  - Test stubs written: <file paths, or "N/A" for S effort>
  - Unexpected findings: <any behavior that differed from expectation, or "None">
- **What would make this ≥90%:** (include when task confidence <90%)
  - <concrete evidence/tests/spike that would raise confidence>
- **Rollout / rollback:**
  - Rollout: <flag/gradual rollout/migration steps>
  - Rollback: <safe revert strategy>
- **Documentation impact:**
  - <docs to update: e.g., `docs/architecture.md`, `README.md`, API docs — or "None">
- **Notes / references:**
  - <links to internal docs or code patterns>

### TASK-02: <description>
- **Type:** INVESTIGATE
- **Affects:** <areas to inspect>
- **Depends on:** <TASK-IDs or "-">
- **Confidence:** 55% ⚠️ BELOW THRESHOLD
  - Implementation: 70% — <why unknown>
  - Approach: 50% — <decision unresolved>
  - Impact: 45% — <unknown blast radius>
- **Blockers / questions to answer:**
  - <specific questions with concrete outputs>
- **Acceptance:**
  - <what evidence will raise confidence, e.g., "identify call sites; confirm contract; propose chosen approach; update plan">
- **Notes / references:**
  - <where to look in repo, likely files>

### TASK-03: <description>
- **Type:** DECISION
- **Affects:** <areas impacted by this decision>
- **Depends on:** <TASK-IDs or "-">
- **Confidence:** 60% ⚠️ BELOW THRESHOLD
  - Implementation: 80% — both options are implementable
  - Approach: 50% — genuinely equivalent options; requires preference
  - Impact: 70% — impact understood but varies by choice
- **Options:**
  - **Option A:** <description + trade-offs>
  - **Option B:** <description + trade-offs>
- **Recommendation:** <A or B> because <rationale>
- **Question for user:**
  - <precise question that gates the decision>
  - Why it matters: <context>
  - Default if no answer: <option + risk>
- **Acceptance:**
  - User selects option; plan updated with decision; dependent tasks unblocked

## Risks & Mitigations
- <Risk>: <Mitigation>
- <Risk>: <Mitigation>

## Observability
- Logging: <what events/errors should be logged>
- Metrics: <key counters/timers>
- Alerts/Dashboards: <if applicable>

## Acceptance Criteria (overall)
- [ ] <Criterion 1>
- [ ] <Criterion 2>
- [ ] <No regressions / tests passing>

## Decision Log
- YYYY-MM-DD: <Decision made> — <rationale>
```

## Overall-confidence calculation

Use Effort-weighted average of task overall confidence:

- S=1, M=2, L=3
- Overall-confidence = sum(confidence × weight) / sum(weight)

Note: This is informational only; build gating is still per-task.

## Quality Checks

A plan is considered complete only if:

- [ ] All potentially affected areas have been studied (not assumed).
- [ ] Each task has all required fields: Type, Affects, Depends on, Confidence (with dimension breakdown), Acceptance, Test contract, Planning validation (for M/L), Rollout/rollback, Documentation impact.
- [ ] Confidence scores are justified with evidence (file paths, patterns, tests).
- [ ] Test validation completed per effort level (S: affected files, M: modules + boundaries, L: full suites + stubs).
- [ ] For M/L tasks claiming >80% confidence: test evidence is documented.
- [ ] INVESTIGATE/DECISION tasks are used for uncertainty (not buried in IMPLEMENT tasks).
- [ ] Dependencies are explicitly mapped and ordered correctly.
- [ ] Risks and mitigations are documented.
- [ ] User questions were asked only when genuinely unavoidable.

### TDD Quality Checks

- [ ] Every acceptance criterion maps to ≥1 enumerated test case (TC-XX).
- [ ] Test cases include happy path, error cases, and edge cases.
- [ ] M/L tasks have test case specifications with expected outcomes.
- [ ] L tasks have test stubs committed with the plan.
- [ ] No task claims >80% confidence without enumerated test cases.

### Test Foundation Check (from Fact-Find)

Before planning tasks, verify the fact-find brief includes:
- [ ] Test infrastructure documented
- [ ] Test patterns/conventions identified
- [ ] Coverage gaps mapped
- [ ] Testability assessment provided

**If missing:** Create an INVESTIGATION task to complete test landscape, OR incorporate into first IMPLEMENT task with confidence penalty (-10% for missing test foundation).

## Decision Points

| Situation | Action |
|-----------|--------|
| All IMPLEMENT tasks ≥80% | Proceed to `/build-feature` |
| Some tasks 60–79% | Build ≥80% tasks first; create verification steps for 60–79%; re-assess after prerequisite tasks land |
| Any IMPLEMENT task <60% | Do NOT build it. Convert to INVESTIGATE/DECISION and run `/re-plan` for that area |
| Genuine product/UX ambiguity | Ask the user only after repo/doc investigation |

## Completion Output (what to say to the user)

**If all ≥80%:**
> "Plan ready. All implementation tasks are ≥80% confidence. Proceed to `/build-feature`."

**If some below threshold:**
> "Plan ready with blockers. Tasks <IDs> are below threshold (<%>). Recommend `/re-plan` for those tasks before implementation; remaining tasks can proceed."

---

## Business OS Integration (Optional)

Plan documents can optionally integrate with Business OS for card tracking. This is entirely opt-in.

### When to Use

Include `Business-Unit` and/or `Card-ID` in the frontmatter when:
- The fact-find brief already has Business-Unit/Card-ID (inherit them)
- The feature should be tracked on the Business OS kanban board
- You want automatic stage doc creation and lane transitions

### Business Unit Codes

- `BRIK` - Brikette (guide booking platform)
- `PLAT` - Platform (shared infrastructure)
- `PIPE` - Pipeline (product pipeline tools)
- `BOS` - Business OS (internal tools)

### Planned Stage Doc Workflow (After Plan Completion)

**When:** After persisting the plan document, if `Card-ID` is present in frontmatter.

**Step 1: Check for Card-ID**

If the fact-find brief or plan frontmatter contains `Card-ID`:
- Verify the card exists at `docs/business-os/cards/{Card-ID}.user.md`
- If card doesn't exist: warn user (card should have been created during /fact-find)
- If card exists: proceed to Step 2

**Step 2: Create planned stage doc**

Create `docs/business-os/cards/{CARD-ID}/planned.user.md`:

```markdown
---
Type: Stage-Doc
Card-ID: {CARD-ID}
Stage: Planned
Created: {DATE}
Owner: Pete
Plan-Link: docs/plans/{feature-slug}-plan.md
Plan-Confidence: {OVERALL-CONFIDENCE}%
---

# Planned: {Feature Title}

## Plan Reference

**Plan Document:** `docs/plans/{feature-slug}-plan.md`

**Overall Confidence:** {OVERALL-CONFIDENCE}%

## Task Summary

| Task ID | Description | Confidence | Status |
|---------|-------------|------------|--------|
{Table from plan document}

## Key Decisions

{Summarize key decisions from plan document}

## Build Prerequisites

- [ ] All IMPLEMENT tasks >=80% confidence
- [ ] Dependencies resolved
- [ ] Test infrastructure ready

## Transition Criteria

**To In Progress:**
- Plan approved
- At least one task ready to build
- `/build-feature` initiated
```

See `.claude/skills/_shared/stage-doc-operations.md` for full template.

**Step 3: Update card frontmatter**

Add plan metadata to the card's frontmatter in `docs/business-os/cards/{CARD-ID}.user.md`:

```yaml
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
# ... existing fields ...
Plan-Link: docs/plans/{feature-slug}-plan.md
Plan-Confidence: {OVERALL-CONFIDENCE}%
Plan-Created: {DATE}
---
```

**Step 4: Propose lane transition (if all tasks >=80%)**

If all IMPLEMENT tasks are >=80% confidence, propose the lane transition.

**Option A: Use `/propose-lane-move` (recommended)**
```
/propose-lane-move {CARD-ID} Planned
```

**Option B: Inline proposal (set in card frontmatter)**

Add `Proposed-Lane` to the card's frontmatter:
```yaml
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
Proposed-Lane: Planned  # Lane transition proposal
# ... other fields ...
---
```

**Evidence to cite for transition:**
- Planned stage doc exists: `docs/business-os/cards/{CARD-ID}/planned.user.md`
- Plan doc with acceptance criteria: `docs/plans/{feature-slug}-plan.md`
- All tasks have >=80% confidence

**If some tasks <80%:** Do NOT propose lane transition. The card should remain in Fact-finding until `/re-plan` raises confidence on blocked tasks.

**Step 5: Validate**

```bash
pnpm docs:lint
```

### Completion Message (with Business OS)

When Card-ID is present:

> "Plan ready. All implementation tasks are ≥80% confidence.
>
> **Business OS Integration:**
> - Card: `<Card-ID>`
> - Planned stage doc created: `docs/business-os/cards/<Card-ID>/planned.user.md`
> - Card updated with plan link and confidence
> - **Suggested lane transition:** Fact-finding -> Planned
> - Run `/propose-lane-move <Card-ID> Planned` to formally propose transition
>
> Proceed to `/build-feature`."

When Card-ID is present but some tasks below threshold:

> "Plan ready with blockers. Tasks <IDs> are below threshold (<%>).
>
> **Business OS Integration:**
> - Card: `<Card-ID>`
> - Planned stage doc created: `docs/business-os/cards/<Card-ID>/planned.user.md`
> - Card updated with plan link and confidence
> - **Note:** Lane transition to Planned should wait until tasks >=80%
>
> Recommend `/re-plan` for blocked tasks."

### Backward Compatibility

- Plans without `Business-Unit`/`Card-ID` work exactly as before
- No card operations occur unless these fields are explicitly provided
- Existing plans are unaffected
- The standard completion message is used when no Business OS integration
