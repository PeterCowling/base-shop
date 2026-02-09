---
name: plan-feature
description: Create a confidence-gated implementation plan for a feature, then auto-continue to build if eligible. Produces a plan doc with atomic tasks, acceptance criteria, and per-task confidence assessments. Build is gated at ≥80% confidence; Confidence ≥90% is a motivation, not a quota.
---

# Plan Feature

Create a confidence-gated implementation plan for a feature, then auto-continue to build when eligible. Produces a plan doc with atomic tasks, acceptance criteria, and per-task confidence assessments.

**CI policy:** CI≥90 is a motivation/diagnostic, not a quota. Preserve breadth by phasing/deferment and by adding "What would make this ≥90%" notes. The **build gate** is still confidence-based: only IMPLEMENT tasks ≥80% proceed to `/build-feature`.

**Auto-continue:** After planning completes, if there are no open questions and ≥1 IMPLEMENT task at ≥80% confidence, this skill automatically invokes `/build-feature` on the plan. No user intervention required for the handoff.

## Operating Mode

**PLANNING → AUTO-BUILD**

**Planning phase:** read files, search repo, inspect tests, trace dependencies, run tests (for validation), run read-only commands (e.g., `rg`, `ls`, `cat`, `npm test -- --listTests`), consult existing `docs/plans`, consult external docs if needed, write test stubs for L-effort tasks.

**Not allowed during planning:** implementation code changes, refactors, migrations applied, running destructive commands, opening PRs.

**Auto-continue phase:** After the plan is persisted and sequenced, if auto-continue criteria are met (see step 12), invoke `/build-feature` which transitions to full build mode.

**Commits allowed:**
- Plan file (`docs/plans/<slug>-plan.md`)
- Test stub files for L-effort tasks
- If BOS integration active: card/stage-doc updates via agent API (no markdown writes)

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
- `Draft` — plan is being written and not ready for build (do not ship as final output)
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
- Identify performance-sensitive paths (N+1 queries, missing caching, high-frequency code paths the feature touches).
- Identify security boundaries (auth/authorization on affected routes, data access controls, input validation for untrusted data).
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

#### Assumption scouting (proactive dead-end prevention)

Beyond running existing tests, **actively probe risky assumptions** before they become embedded in the plan. The goal is to discover dead ends during planning (cheap) rather than during build (expensive).

**What to scout:**
- **API/library feasibility:** If the plan depends on a library or framework supporting X, look up the official docs and verify. Write a minimal probe test if the docs are ambiguous.
- **Contract compatibility:** If task N depends on a data shape or interface from task N-1, write a type-level or schema-level test that verifies the contract exists or can be created.
- **Integration seams:** If two systems need to connect, verify both sides of the seam exist and are compatible. Run existing integration tests that cross the boundary.
- **Platform constraints:** If deploying to a specific environment (Cloudflare Workers, static export, etc.), verify the feature is supported in that runtime.

**How to scout:**
- **Doc lookup:** Check official docs for the exact version in use (verify against `package.json` / lockfile). Cite the doc URL and version.
- **Probe test:** Write a small, throwaway test that exercises the assumption. If it passes, you have E2 evidence. If it fails, you've caught a dead end before planning around it.
- **Existing test run:** Run tests that exercise the contract or boundary you'll depend on.
- **Type-level check:** Run `tsc` against a minimal type assertion to verify a contract holds.

**Scout results feed confidence:**
- Scout passes → E2 evidence → confidence can increase
- Scout fails → assumption disproved → create INVESTIGATION task or revise approach
- Scout inconclusive → flag as risk, keep confidence where it is

**Where scouts appear in the plan:**
Each IMPLEMENT task that depends on a non-obvious assumption should include a `Scouts` field listing what was probed and what was found. This is distinct from the test contract (which tests the feature) — scouts test the assumptions the feature depends on.

### 5) Decide the approach (with alternatives when warranted)

- Write the proposed approach as a concise architecture description.
- If there are multiple viable approaches, document:
  - Option A / Option B
  - Trade-offs
  - Why the chosen approach is best long-term (or why the decision is deferred via a DECISION task)

### 6) Break work into atomic tasks

#### Planning Horizon & Risk Front-Loading

Plans with many tasks in a dependency chain carry **compounding uncertainty** — task 8 depends on assumptions from tasks 1–7, any of which could prove wrong. Mitigate this:

**Front-load risk validation:**
- Order tasks so the riskiest assumptions are tested first. If the whole feature depends on "X is possible," task 1 should prove X.
- Early tasks should be the ones most likely to reveal dead ends. If task 1 fails, you've wasted one task, not eight.
- Each task should leave the codebase in a valid state — no task should be a "point of no return" that commits you to the full plan.

**Keep tasks independently valuable:**
- Prefer tasks that deliver incremental value even if later tasks are abandoned or replanned.
- Avoid tasks that only make sense if all subsequent tasks also land (unless truly unavoidable).
- If a task creates a new abstraction, it should be usable even if the planned consumers change.

**Insert CHECKPOINT tasks at horizon boundaries:**
- When a plan has **>3 IMPLEMENT tasks in a dependency chain**, insert a `CHECKPOINT` task after the first 2–3 IMPLEMENT tasks.
- A CHECKPOINT is a lightweight re-assessment gate: "Given what we've built so far, does the rest of the plan still make sense?"
- CHECKPOINTs don't produce code — they produce an updated plan (via `/re-plan`).
- Auto-continue builds up to the first CHECKPOINT, then pauses for re-assessment before continuing.

**CHECKPOINT task format:**
```markdown
### TASK-XX: Horizon checkpoint — reassess remaining plan
- **Type:** CHECKPOINT
- **Depends on:** <last IMPLEMENT task before the boundary>
- **Blocks:** <first IMPLEMENT task after the boundary>
- **Confidence:** 95%
- **Acceptance:**
  - Run `/re-plan` on all tasks after this checkpoint
  - Reassess remaining task confidence using evidence from completed tasks
  - Confirm or revise the approach for remaining work
  - Update plan with any new findings, splits, or abandoned tasks
- **Horizon assumptions to validate:**
  - <assumption 1 that later tasks depend on — should now be verified by completed work>
  - <assumption 2>
```

**When to insert CHECKPOINTs:**
- After the first 2–3 tasks that validate the core approach
- At natural phase boundaries (e.g., data layer done → UI layer starts)
- Before any task that depends on assumptions not yet proven by completed work
- When the dependency chain crosses 3+ waves in the Parallelism Guide

**When NOT to insert CHECKPOINTs:**
- Plans with ≤3 total IMPLEMENT tasks (too short to need them)
- All tasks are independent (no dependency chain to compound uncertainty)
- All tasks follow well-established patterns with E2+ evidence

**Rules:**
- One logical unit per task (typically one file or one cohesive change set).
- Order tasks so riskiest assumptions are validated first, then by prerequisites (infra/contracts before consumers). This is an initial authoring heuristic — `/sequence-plan` (step 10a) will formalize the ordering, renumber tasks, and add blocker metadata.
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
- Every IMPLEMENT task must include an explicit **TDD execution plan**:
  - **Red:** which test(s) will be written/activated first and expected to fail
  - **Green:** minimal implementation change that makes Red tests pass
  - **Refactor:** cleanup step while keeping tests green
- If a task spans multiple apps/services/packages, include cross-boundary **contract tests** for shared schemas/nodes/events.
- If a task defines a user-facing flow, include at least one **e2e scenario** that validates the flow end-to-end.

If something is uncertain, create an explicit **INVESTIGATION** task (to raise confidence) or a **DECISION** task (to choose between alternatives). Do not bury uncertainty inside implementation tasks.

If the planning horizon is long, insert a **CHECKPOINT** task at natural boundaries (see "Planning Horizon & Risk Front-Loading" above). CHECKPOINTs force a re-assessment before committing to deep implementation.

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

Set frontmatter `Status: Active` in the final persisted plan unless the user explicitly says the plan should remain Draft.

### 10a) Sequence the plan (automatic)

After persisting the plan doc, run `/sequence-plan` on it. This:

- Topologically sorts tasks into correct implementation order based on explicit dependencies, file-overlap analysis, and phase ordering
- Renumbers tasks sequentially (`TASK-01`, `TASK-02`, ... or `DS-01`, `DS-02`, ... preserving domain prefix)
- Adds a `Blocks` field to every task (inverse of `Depends on`) so agents know what they unblock
- Generates a **Parallelism Guide** showing which tasks can be dispatched to concurrent subagents

**This step modifies the plan doc that was just persisted in step 10.** The completion message (step 11) should reflect the sequenced state.

**Skip conditions:** Only skip this step if the plan has fewer than 2 active tasks (nothing to sequence).

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
Status: Active
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
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | ... | 92% | M | Pending | - | TASK-02 |
| TASK-02 | INVESTIGATE | ... | 55% ⚠️ | S | Pending | TASK-01 | - |
| TASK-03 | DECISION | ... | 60% ⚠️ | S | Needs-Input | - | - |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)

## Parallelism Guide

_Generated by `/sequence-plan` (step 10a). Shows which tasks can run concurrently via subagents._

| Wave | Tasks | Prerequisites | Notes |
|------|-------|---------------|-------|
| 1 | ... | - | ... |

**Max parallelism:** N | **Critical path:** W waves | **Total tasks:** T

## Tasks

### TASK-01: <description>
- **Type:** IMPLEMENT
- **Affects:** `path/to/file.ts`, `path/to/other.ts`
- **Depends on:** <TASK-IDs or "-">
- **Blocks:** <TASK-IDs or "-"> _(populated by `/sequence-plan`)_
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
  - **Cross-boundary coverage (if applicable):** <shared contract test(s) across producer/consumer modules>
  - **End-to-end coverage (major flows):** <at least one e2e scenario TC-ID or "N/A - non-user-facing task">
- **TDD execution plan:**
  - **Red:** <tests to write/enable first and expected failing assertion>
  - **Green:** <minimal implementation change to satisfy Red>
  - **Refactor:** <cleanup/improvement after Green while tests stay passing>
- **Scouts:** (include when task depends on non-obvious assumptions)
  - <assumption> → <how validated: doc lookup / probe test / existing test / type check> → <result: confirmed / disproved / inconclusive>
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
- **Blocks:** <TASK-IDs or "-"> _(populated by `/sequence-plan`)_
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
- **Blocks:** <TASK-IDs or "-"> _(populated by `/sequence-plan`)_
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
- [ ] `/sequence-plan` has been run: tasks are topologically sorted, renumbered, `Blocks` fields added, and Parallelism Guide generated.
- [ ] Risks and mitigations are documented.
- [ ] User questions were asked only when genuinely unavoidable.
- [ ] Auto-continue criteria evaluated: no open questions + ≥1 task ≥80% → `/build-feature` invoked; otherwise reason for stopping documented.

### TDD Quality Checks

- [ ] Every acceptance criterion maps to ≥1 enumerated test case (TC-XX).
- [ ] Test cases include happy path, error cases, and edge cases.
- [ ] M/L tasks have test case specifications with expected outcomes.
- [ ] L tasks have test stubs committed with the plan.
- [ ] No task claims >80% confidence without enumerated test cases.
- [ ] Every IMPLEMENT task includes an explicit Red → Green → Refactor execution plan.
- [ ] Tasks spanning multiple apps/services include cross-app contract tests for shared data contracts.
- [ ] Each major user flow has at least one e2e scenario in the plan’s test contracts.

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
| All IMPLEMENT tasks ≥80%, no open questions | **Auto-continue:** invoke `/build-feature` immediately |
| Some tasks ≥80%, others 60–79%, no open questions | **Auto-continue:** invoke `/build-feature` for eligible tasks; note remaining tasks need `/re-plan` |
| ≥1 IMPLEMENT task ≥80% but open DECISION/Needs-Input tasks exist | **Stop and ask:** present open questions to user; do NOT auto-continue |
| All IMPLEMENT tasks <80% | Do NOT build. Recommend `/re-plan` |
| Any IMPLEMENT task <60% | Do NOT build it. Convert to INVESTIGATE/DECISION and run `/re-plan` for that area |
| Genuine product/UX ambiguity | Ask the user only after repo/doc investigation |

## Auto-Continue to Build (Step 12)

After the completion message (step 11), evaluate whether to auto-continue:

### Auto-continue criteria (ALL must be true)

1. **No open questions:** No DECISION tasks with status `Needs-Input`, no unresolved user questions
2. **≥1 eligible task:** At least one IMPLEMENT task has confidence ≥80%
3. **Plan status is Active:** The plan was set to `Active` (not left as `Draft`)

### Auto-continue scope (CHECKPOINT-bounded)

Auto-continue builds only up to the **first CHECKPOINT task** in the plan. This prevents committing to deep implementation before validating near-horizon assumptions.

- If the plan has no CHECKPOINTs: auto-continue builds all eligible tasks (plan is short enough that horizon risk is acceptable)
- If the plan has CHECKPOINTs: auto-continue builds eligible tasks up to the first CHECKPOINT, then the CHECKPOINT triggers `/re-plan` on remaining tasks before continuing

This means a plan with 8 tasks and a CHECKPOINT after task 3 will:
1. Auto-continue → build tasks 1–3
2. Hit CHECKPOINT → run `/re-plan` on tasks 5–8 using evidence from tasks 1–3
3. If re-plan confirms remaining tasks → continue building
4. If re-plan reveals problems → revise before wasting more effort

### When criteria are met

- Output the completion message (step 11) noting auto-continuation
- Invoke `/build-feature <feature-slug>` immediately
- The build skill takes over from here with its own operating mode
- Build will automatically pause at the first CHECKPOINT for re-assessment

### When criteria are NOT met

- Output the completion message (step 11) with the blocking reason
- Do NOT invoke `/build-feature`
- Recommend the appropriate next action (`/re-plan`, answer DECISION tasks, etc.)

### Override

If the user explicitly says the plan should remain Draft or asks NOT to auto-build, respect that and stop after the completion message.

## Completion Output (what to say to the user)

**If all ≥80% and auto-continuing:**
> "Plan ready. All implementation tasks are ≥80% confidence. Tasks sequenced into N execution waves (max parallelism: P). Auto-continuing to `/build-feature`..."

**If some ≥80% and auto-continuing (others below threshold):**
> "Plan ready with blockers. Tasks <IDs> are below threshold (<%>). Tasks sequenced into N execution waves. Auto-continuing to `/build-feature` for eligible tasks. Recommend `/re-plan` for blocked tasks after initial build completes."

**If blocked from auto-continue (open questions):**
> "Plan ready but has open questions. Tasks <IDs> need decisions before build can proceed. Please resolve DECISION tasks, then run `/build-feature`."

**If blocked from auto-continue (all tasks <80%):**
> "Plan ready with blockers. No tasks are above the 80% build threshold. Recommend `/re-plan` to raise confidence before building."

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

**Fail-closed:** if any API call fails, stop and surface the error. Do not write markdown files.

**Step 1: Read card via API and lock Feature-Slug**

- Fetch the card via API.
- If the card is missing: warn and stop (card should have been created during `/fact-find`).
- Read `Feature-Slug` from the card frontmatter and use it (do not re-derive from title).

```json
{
  "method": "GET",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards/PLAT-ENG-0023",
  "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" }
}
```

**Step 2: Create planned stage doc via API**

```json
{
  "method": "POST",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/stage-docs",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "cardId": "PLAT-ENG-0023",
    "stage": "plan",
    "content": "# Planned: {Feature Title}\n\n## Plan Reference\n\n**Plan Document:** `docs/plans/{feature-slug}-plan.md`\n\n**Overall Confidence:** {OVERALL-CONFIDENCE}%\n\n## Task Summary\n\n| Task ID | Description | Confidence | Status |\n|---------|-------------|------------|--------|\n{Table from plan document}\n\n## Key Decisions\n\n{Summarize key decisions from plan document}\n\n## Build Prerequisites\n\n- [ ] All IMPLEMENT tasks >=80% confidence\n- [ ] Dependencies resolved\n- [ ] Test infrastructure ready\n\n## Transition Criteria\n\n**To In Progress:**\n- Plan approved\n- At least one task ready to build\n- `/build-feature` initiated\n"
  }
}
```

**Note:** `content` is the markdown body only (no frontmatter). The export job adds frontmatter.

**Step 3: Update card Plan-Link via API**

```json
{
  "method": "PATCH",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards/PLAT-ENG-0023",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "baseEntitySha": "<entitySha from GET>",
    "patch": { "Plan-Link": "docs/plans/{feature-slug}-plan.md" }
  }
}
```

**Conflict handling:** if PATCH returns 409, refetch and retry once. If it conflicts again, stop and surface the error.

**Step 4: Propose lane transition (if all tasks >=80%)**

If all IMPLEMENT tasks are >=80% confidence, propose the lane transition.

**Option A: Use `/propose-lane-move` (recommended)**
```
/propose-lane-move {CARD-ID} Planned
```

**Option B: Inline proposal (API PATCH)**

```json
{
  "method": "PATCH",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards/PLAT-ENG-0023",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "baseEntitySha": "<entitySha from GET>",
    "patch": { "Proposed-Lane": "Planned" }
  }
}
```

**Evidence to cite for transition:**
- Planned stage doc exists (API stage `plan`)
- Plan doc with acceptance criteria: `docs/plans/{feature-slug}-plan.md`
- All tasks have >=80% confidence

**If some tasks <80%:** Do NOT propose lane transition. The card should remain in Fact-finding until `/re-plan` raises confidence on blocked tasks.

**Step 5: Validate**

- Documentation-only change; no automated validation required.

### Completion Message (with Business OS)

When Card-ID is present and auto-continuing:

> "Plan ready. All implementation tasks are ≥80% confidence.
>
> **Business OS Integration:**
> - Card: `<Card-ID>`
> - Planned stage doc created via API: `plan`
> - Card updated with Plan-Link via API
> - **Suggested lane transition:** Fact-finding -> Planned
> - Run `/propose-lane-move <Card-ID> Planned` to formally propose transition
>
> Auto-continuing to `/build-feature`..."

When Card-ID is present but some tasks below threshold (still auto-continuing for eligible tasks):

> "Plan ready with blockers. Tasks <IDs> are below threshold (<%>).
>
> **Business OS Integration:**
> - Card: `<Card-ID>`
> - Planned stage doc created via API: `plan`
> - Card updated with Plan-Link via API
>
> Auto-continuing to `/build-feature` for eligible tasks. Recommend `/re-plan` for blocked tasks after initial build."

When Card-ID is present but auto-continue is blocked (open questions or all tasks <80%):

> "Plan ready but cannot auto-continue. <reason>.
>
> **Business OS Integration:**
> - Card: `<Card-ID>`
> - Planned stage doc created via API: `plan`
> - Card updated with Plan-Link via API
> - **Note:** Lane transition to Planned should wait until tasks >=80%
>
> Recommend `/re-plan` for blocked tasks."

### Backward Compatibility

- Plans without `Business-Unit`/`Card-ID` work exactly as before
- No card operations occur unless these fields are explicitly provided
- Existing plans are unaffected
- The standard completion message is used when no Business OS integration
