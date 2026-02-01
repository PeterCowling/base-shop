---
name: fact-find
description: Gather evidence and context before planning or as a standalone briefing. Produces either a Planning Fact-Find Brief (feeds /plan-feature) or a System Briefing Note (understanding-only explainer).
---

# Fact Find

Gather evidence and context before planning or as a standalone briefing. Produces one of two outcomes:

- **Outcome A — Planning Fact-Find Brief:** a structured brief that feeds directly into `/plan-feature`.
- **Outcome B — System Briefing Note:** an explainer of how something works today (no planning deliverable).

## Operating Mode

**FACT-FIND ONLY**

**Allowed:** read files, search repo, inspect tests, trace dependencies, review `docs/plans`, review targeted git history, consult external official docs if needed.

**Not allowed:** code changes, refactors, commits (except the brief/note file), migrations applied, destructive commands.

## Step 0: User Intake and Outcome Selection (Required)

When the user runs `/fact-find`, begin by asking them to describe what they want fact-finding on.

### Ask for these minimum inputs

You must collect enough to choose the correct outcome and scope the investigation.

**Intent (choose one):**
- A. I want to build/change something (this should feed into `/plan-feature`)
- B. I only want to understand how something works (briefing/audit)

**Topic / area:**
- Name the feature/system/component (e.g., "checkout discounts", "CMS publishing", "auth session refresh").
- If known: relevant paths/modules (even rough guesses are fine).

**Prompting detail (pick what applies):**
- For A (build/change): what's the desired new behavior/outcome?
- For B (briefing): what question(s) are you trying to answer?

**Constraints (if any):**
- Compatibility, performance, security, rollout requirements, deadlines.

### Sufficiency gate: when to ask follow-up questions

If the user's answer is insufficient to meaningfully investigate, ask targeted questions immediately. Do not start repo auditing until you have at least:

- a concrete area (feature/component name or user-facing behavior), and
- the intended outcome (A vs. B), and
- at least one anchor for where to look (a path guess, an entrypoint guess, a UI route, an endpoint name, a log/error message, or "where in the product it appears").

### Follow-up question bank (use selectively)

Use only what's needed to get unblocked.

**If intent is unclear:**
- "Are you trying to change/build something, or just understand the current behavior?"
- "If you had the answer, what would you do next—implement a change or document understanding?"

**If the area is unclear:**
- "Where do you see this in the product (URL/screen/flow)?"
- "Is there an API endpoint name, route, error message, or log line associated with it?"
- "Is this UI, API, background job, or data pipeline?"

**If the desired outcome is unclear (Outcome A):**
- "What is the acceptance criterion (what should be true when we're done)?"
- "Who is the user/persona affected, and what is the expected behavior change?"
- "Any constraints: backwards compatibility, feature flag, migration, rollout?"

**If the question is too broad (Outcome B):**
- "Which aspect do you want: data model, request flow, side effects, configuration, or failure modes?"
- "What level of depth: executive summary vs. implementation detail with file references?"

### Decision: Choose Outcome A or Outcome B

**Default rules:**
- If the user mentions implementing, adding, changing, fixing, migrating, refactoring, rolling out → **Outcome A**.
- If the user mentions understanding, remembering, explaining, auditing, tracing behavior → **Outcome B**.
- If mixed, treat it as **Outcome A**, but include a "Current Behavior Briefing" section in the fact-find.

---

## Outcome A: Planning Fact-Find Brief (feeds /plan-feature)

### Purpose

Produce a planning-ready evidence brief with impact mapping and "confidence inputs" aligned to `/plan-feature`'s confidence rubric.

### Output File

Create/update:
```
docs/plans/<feature-slug>-fact-find.md
```

(Use the same `<feature-slug>` that `/plan-feature` will use for `docs/plans/<feature-slug>-plan.md`.)

### Workflow (Outcome A)

#### 1) Define scope for planning

Capture:
- Goals / non-goals
- Constraints (security, performance, compatibility, rollout)
- Assumptions (minimize; only if necessary)

#### 2) Audit the repo (evidence-first)

**Minimum evidence checklist:**
- Entry points (routes/handlers/pages/jobs)
- Key modules/files and responsibilities
- Data/contracts touched (types, schemas, DB models)
- Upstream dependencies and downstream dependents (blast radius)
- Tests present + gaps + extinct tests (tests asserting obsolete behavior must be flagged)
- Existing conventions/patterns to follow
- Related docs/plans
- Targeted recent git history in affected areas

#### 3) External research (only if needed)

Only if repo evidence cannot answer:
- API/library docs for the stack patterns in use
- Compatibility notes verified against repo versions (package.json/lockfile)

#### 4) Questions: resolve first, escalate only when necessary

- Maintain "Resolved Questions" with file-based evidence.
- Maintain "Open Questions (User Input Needed)" only when escalation is genuinely required.

**Escalation criteria:** Only ask the user when:
- Business rules/UX intent cannot be inferred from repo or docs
- Two approaches are truly equivalent and require preference
- You have exhausted evidence sources and the uncertainty remains

When you do ask:
- Ask the minimum number of questions required to proceed
- Each question must state what decision it gates
- Include a recommended default with risk assessment if appropriate

#### 5) Produce confidence inputs for /plan-feature

Provide three "feature-level" scores (0–100) that calibrate planning:
- **Implementation** — do we know how to write correct code?
- **Approach** — is this the right long-term design?
- **Impact** — do we understand what this touches and how to avoid regressions?

Include:
- What would raise each score to **≥80** (build-eligible planning), if currently below.
- What would raise each score to **≥90** (high confidence), if currently below — tests, spikes, evidence, rollout rehearsal.

**CI policy reminder:** CI≥90 is a motivation/diagnostic, not a quota. Do not recommend deleting planned work just to raise confidence; preserve it as phased/deferred with clear “what would make this ≥90%” actions.

#### 6) Provide planning handoff artifacts

Include:
- Planning constraints (patterns to follow, rollout expectations, observability expectations)
- Suggested task seeds (non-binding), to accelerate `/plan-feature`

#### 7) End with Planning Readiness

- **Ready-for-planning** if open questions are non-blocking or resolved.
- **Needs-input** if user decisions are required before tasking can be accurate.

If status is **Needs-input**, ask the user the open questions and stop (do not proceed to planning).

### Brief Template (Outcome A)

```markdown
---
Type: Fact-Find
Outcome: Planning
Status: <Draft | Ready-for-planning | Needs-input>
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Related-Plan: docs/plans/<feature-slug>-plan.md
# Business OS Integration (optional - triggers card creation)
Business-Unit: <BRIK | PLAT | PIPE | BOS | etc.>
Card-ID: <auto-generated when card is created>
---

# <Feature Name> Fact-Find Brief

## Scope
### Summary
<What change is being considered and why>

### Goals
- ...

### Non-goals
- ...

### Constraints & Assumptions
- Constraints:
  - ...
- Assumptions:
  - ...

## Repo Audit (Current State)
### Entry Points
- `path/to/entry` — <role>

### Key Modules / Files
- `path/to/file` — <notes>

### Patterns & Conventions Observed
- <pattern> — evidence: `path/to/file`

### Data & Contracts
- Types/schemas:
  - `...`
- Persistence:
  - `...`
- API/event contracts:
  - `...`

### Dependency & Impact Map
- Upstream dependencies:
  - ...
- Downstream dependents:
  - ...
- Likely blast radius:
  - ...

### Tests & Quality Gates
- Existing tests:
  - `...`
- Gaps:
  - ...
- Commands/suites:
  - ...

### Recent Git History (Targeted)
- `path/to/area/*` — <what changed + implications>

## External Research (If needed)
- Finding: <summary> — <source>
- Compatibility verified via: <package.json/lockfile notes>

## Questions
### Resolved
- Q: ...
  - A: ...
  - Evidence: `...`

### Open (User Input Needed)
- Q: ...
  - Why it matters: ...
  - Decision impacted: ...
  - Default assumption (if any) + risk: ...

## Confidence Inputs (for /plan-feature)
- **Implementation:** <0–100>%
  - <why + evidence; what's missing>
- **Approach:** <0–100>%
  - <why + tradeoffs; what's missing>
- **Impact:** <0–100>%
  - <why + blast radius confidence; what's missing>

## Planning Constraints & Notes
- Must-follow patterns:
  - ...
- Rollout/rollback expectations:
  - ...
- Observability expectations:
  - ...

## Suggested Task Seeds (Non-binding)
- ...
- ...

## Planning Readiness
- Status: <Ready-for-planning | Needs-input>
- Blocking items (if any):
  - ...
- Recommended next step:
  - If ready: proceed to `/plan-feature`
  - If needs input: answer the open questions above
```

---

## Outcome B: System Briefing Note (understanding-only)

### Purpose

Explain how the target area works today, with evidence and practical "how to reason about it" guidance. No planning deliverable is required.

This is the mode for cases like:
- user forgot how a subsystem works
- audit/tracing a flow
- onboarding documentation
- "what happens when…" questions

### Output File

Prefer creating a briefing note separate from planning docs:
- If `docs/briefs/` exists: `docs/briefs/<topic-slug>-briefing.md`
- Otherwise: `docs/plans/<topic-slug>-briefing.md`

(Do not create a plan doc.)

### Workflow (Outcome B)

#### 1) Define the briefing questions

Convert the user's request into 3–8 explicit questions (e.g., "Where is X computed?", "What is the source of truth?", "What are the side effects?").

#### 2) Trace the flow end-to-end

Depending on the topic:
- Request lifecycle (UI → API → service → persistence)
- Background job lifecycle (schedule → worker → side effects)
- Data lifecycle (write path → read path → caching/indexing)
- Auth/session flow, permissions enforcement points
- Error handling and retry behavior

#### 3) Document structure and invariants

Capture:
- Components and responsibilities
- Key contracts and data shapes
- Configuration/feature flags that affect behavior
- Edge cases and known failure modes
- Where tests exist, and what they cover

#### 4) Identify unknowns and how to validate

If something cannot be determined from repo evidence:
- Mark it as "Unknown" and list the exact files/logs/tests that would confirm it.

#### 5) Optional: "If you later want to change this"

Include a short section describing likely change points and risks, without turning it into an implementation plan.

### Briefing Template (Outcome B)

```markdown
---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: <CMS | Platform | UI | API | Data | Infra | etc.>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Topic-Slug: <kebab-case>
---

# <Topic> Briefing

## Executive Summary
<What this subsystem does, in plain terms, and why it matters.>

## Questions Answered
- Q1: ...
- Q2: ...

## High-Level Architecture
- Components:
  - `path/to/component` — <role>
- Data stores / external services:
  - ...

## End-to-End Flow
### Primary flow
1) ...
2) ...
- Evidence pointers: `path/to/file`, `path/to/file`

### Alternate / edge flows
- ...

## Data & Contracts
- Key types/schemas:
  - ...
- Source of truth:
  - ...

## Configuration, Flags, and Operational Controls
- Feature flags:
  - ...
- Environment/config:
  - ...

## Error Handling and Failure Modes
- Common errors and where they originate:
  - ...
- Retries/timeouts/idempotency:
  - ...

## Tests and Coverage
- Existing tests:
  - ...
- Extinct tests (tests that assert obsolete behavior):
  - <list any tests that test removed APIs, old contracts, or behavior that no longer exists>
  - <these must be updated or removed during build to avoid false confidence signals>
- Gaps / confidence notes:
  - ...

## Unknowns / Follow-ups
- Unknown: ...
  - How to verify: <exact file/test/log to check>

## If You Later Want to Change This (Non-plan)
- Likely change points:
  - ...
- Key risks:
  - ...
- Evidence-based constraints:
  - ...
```

### Completion behavior (Outcome B)

Provide a concise summary to the user and point to the saved briefing note.

If the user then decides to implement a change, instruct them to run `/fact-find` again in Outcome A mode (or reuse the existing briefing as an input and add the missing planning-specific sections).

---

## Quality Checks (both outcomes)

- [ ] You do not proceed without sufficient intake to scope the investigation.
- [ ] All non-trivial claims cite evidence (paths/modules/tests/docs).
- [ ] Dependencies and blast radius are explicitly mapped (Outcome A required; Outcome B when relevant).
- [ ] External research is current and version-aware when used.
- [ ] Unknowns are called out with a concrete verification path.
- [ ] Output file is created/updated in the correct location; no code changes.

## Final Hand-off Messages

**Outcome A (Planning):**
> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning (or Needs-input). Proceed to `/plan-feature` once blocking questions are answered."

**Outcome B (Briefing):**
> "Briefing complete. Note saved to `<path>`. This documents the current behavior and evidence pointers. No planning artifact was produced."

---

## Business OS Integration (Optional)

Fact-find briefs can optionally integrate with Business OS for card tracking. This is entirely opt-in.

### When to Use

Include `Business-Unit` in the frontmatter when:
- The work should be tracked on the Business OS kanban board
- The feature is part of a specific business unit's roadmap (BRIK, PLAT, PIPE, BOS)
- You want automatic card creation and lifecycle tracking

### Business Unit Codes

- `BRIK` - Brikette (guide booking platform)
- `PLAT` - Platform (shared infrastructure)
- `PIPE` - Pipeline (product pipeline tools)
- `BOS` - Business OS (internal tools)

### Card Creation Workflow (After Brief Completion)

**When:** After persisting the fact-find brief (Outcome A only), if `Business-Unit` is present in frontmatter.

**Step 1: Check for existing card**

```bash
# Check if Card-ID already exists in brief frontmatter
# If yes: skip to Step 4 (create/update stage doc only)
# If no: proceed to Step 2
```

See `.claude/skills/_shared/card-operations.md` for idempotency check details.

**Step 2: Allocate Card-ID (scan-based)**

```bash
BUSINESS="PLAT"  # From Business-Unit frontmatter
MAX_ID=$(ls docs/business-os/cards/${BUSINESS}-ENG-*.user.md 2>/dev/null | \
  sed 's/.*-ENG-\([0-9]*\)\.user\.md/\1/' | \
  sort -n | tail -1)
NEXT_ID=$(printf "%04d" $((${MAX_ID:-0} + 1)))
CARD_ID="${BUSINESS}-ENG-${NEXT_ID}"
```

**Step 3: Create card files**

Create two files in `docs/business-os/cards/`:

**`{CARD-ID}.user.md`:**
```markdown
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
Priority: P3
Business: {BUSINESS-UNIT}
Owner: Pete
Created: {DATE}
Title: {Feature title from brief}
Plan-Link: docs/plans/{feature-slug}-fact-find.md
---

# {Feature Title}

## Description
{Summary from fact-find brief}

## Value
{Goals from fact-find brief}

## Next Steps
1. Complete fact-finding phase
2. If findings are positive, proceed to /plan-feature
3. Review evidence and transition to Planned lane
```

**`{CARD-ID}.agent.md`:**
```markdown
---
Type: Card
ID: {CARD-ID}
Lane: Fact-finding
Priority: P3
Business: {BUSINESS-UNIT}
Owner: Pete
Created: {DATE}
Title: {Feature title from brief}
Plan-Link: docs/plans/{feature-slug}-fact-find.md
---

## Card: {CARD-ID}

**Linked Artifacts:**
- Fact-find: `docs/plans/{feature-slug}-fact-find.md`

**Current Lane:** Fact-finding

**Context for LLM:**
- {Summary of what's being investigated}
- {Key constraints from fact-find}

**Transition Criteria:**
- Fact-finding -> Planned: Requires completed fact-find with positive findings and /plan-feature
```

**Step 4: Create fact-finding stage doc**

Create `docs/business-os/cards/{CARD-ID}/fact-finding.user.md`:

```markdown
---
Type: Stage-Doc
Card-ID: {CARD-ID}
Stage: Fact-finding
Created: {DATE}
Owner: Pete
---

# Fact-Finding: {Feature Title}

## Questions to Answer

{Import questions from fact-find brief}

## Findings

{Import findings from fact-find brief or "To be completed"}

## Recommendations

{Import recommendations or "To be completed based on findings"}

## Transition Decision

**Status:** {Ready-for-planning | Needs-input | Needs more fact-finding}
**Next Lane:** {If ready: Planned | Otherwise: Fact-finding}
```

See `.claude/skills/_shared/stage-doc-operations.md` for full template.

**Step 5: Update brief frontmatter**

Add `Card-ID` to the fact-find brief:
```yaml
---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
# ... other fields ...
Business-Unit: PLAT
Card-ID: PLAT-ENG-0024  # Added after card creation
---
```

**Step 6: Validate**

```bash
pnpm docs:lint
```

### Completion Message (with Business OS)

When Business-Unit is present and card is created:

> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning.
>
> **Business OS Integration:**
> - Created card: `<Card-ID>`
> - Card location: `docs/business-os/cards/<Card-ID>.user.md`
> - Stage doc: `docs/business-os/cards/<Card-ID>/fact-finding.user.md`
> - Card-ID added to brief frontmatter
>
> Proceed to `/plan-feature` once blocking questions are answered."

When Business-Unit is present but card already exists:

> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning.
>
> **Business OS Integration:**
> - Using existing card: `<Card-ID>`
> - Stage doc updated: `docs/business-os/cards/<Card-ID>/fact-finding.user.md`
>
> Proceed to `/plan-feature` once blocking questions are answered."

### Backward Compatibility

- Briefs without `Business-Unit` work exactly as before
- No card is created unless `Business-Unit` is explicitly provided
- Existing briefs are unaffected
- The standard completion message is used when no Business OS integration
