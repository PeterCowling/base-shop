---
name: fact-find
description: Gather evidence and context before planning or as a standalone briefing. Supports code and business deliverables by classifying execution track and routing to progressive execution skills.
---

# Fact Find

Gather evidence and context before planning or as a standalone briefing.

**Discovery mode:** When run without a specific topic, scans Business OS for raw ideas, cards in Inbox, and cards in Fact-finding lane, then presents options for the user to select.

**Outcomes:**

- **Outcome A — Planning Fact-Find Brief:** a structured brief that feeds directly into `/plan-feature`.
- **Outcome B — System Briefing Note:** an explainer of how something works today (no planning deliverable).

## Execution Model (Outcome A)

`/fact-find` is now a business-wide intake/orchestrator step, not just a code preflight.

For Outcome A, classify each request into:

- **Execution-Track:** `code` | `business-artifact` | `mixed`
- **Deliverable-Type:** one of:
  - `code-change`
  - `email-message`
  - `product-brief`
  - `marketing-asset`
  - `spreadsheet`
  - `whatsapp-message`
  - `multi-deliverable`

This classification drives `/plan-feature` task design and `/build-feature` execution routing.

## Operating Mode

**FACT-FIND ONLY**

**Allowed:** read files, search repo, inspect tests, trace dependencies, review `docs/plans`, review targeted git history, consult external official docs if needed.

**Not allowed:** code changes, refactors, migrations applied, destructive commands.

**Commits allowed:**
- Brief/note file (`docs/plans/<slug>-fact-find.md` or `docs/briefs/<slug>-briefing.md`)

## Step 0: Discovery and Selection

### Fast Path (with argument)

**If user provides a card ID or topic** (e.g., `/fact-find PLAT-ENG-0002` or `/fact-find email templates`):
- Skip discovery entirely
- If card ID: read card via agent API (`GET /api/agent/cards/:id`)
- If topic: proceed to "Ask for minimum inputs"
- **Target: <2 seconds to start investigating**

### Discovery Path (no argument)

**If user provides no topic**, read the pre-computed index (single file):

```
docs/business-os/_meta/discovery-index.json
```

This index contains all raw ideas, inbox cards, and fact-finding cards. Present immediately:

2. **Present a discovery table** organized by readiness:

   ```markdown
   ## Available for Fact-Finding

   ### Raw Ideas (need /work-idea first, then fact-find)
   | ID | Title | Business | Summary |
   |----|-------|----------|---------|
   | BRIK-OPP-0002 | Hostel booking FAQs | BRIK | FAQ content for bookings |

   ### Cards Ready to Start (Inbox lane → move to Fact-finding)
   | ID | Title | Business | Priority |
   |----|-------|----------|----------|
   | PLAT-OPP-0002 | Example card | PLAT | P2 |

   ### Cards In Progress (Fact-finding lane → needs completion)
   | ID | Title | Business | Priority |
   |----|-------|----------|----------|
   | PLAT-ENG-0002 | Agent Context Optimization | PLAT | P2 |
   | BRIK-ENG-0018 | Dashboard Upgrade Aggregator | BRIK | P2 |
   ```

3. **Ask user to select:**
   - "Which would you like to fact-find? Enter an ID (e.g., `PLAT-ENG-0002`) or describe a new topic."
   - Note: Raw ideas require `/work-idea` first to create a card before fact-finding.

4. **If user selects a card:** Read the card via agent API to extract context, then proceed.
   **If user selects a raw idea:** Inform them to run `/work-idea {ID}` first, then return to `/fact-find`.
   **If user describes a new topic:** Proceed to intake questions.

### When user selects an existing card

If the user selects a card ID from the discovery table:

1. **Read the card via agent API** (`GET /api/agent/cards/{CARD-ID}`)
2. **Extract pre-populated context:**
   - `Title` → Topic/area
   - `Business` → Business-Unit for frontmatter
   - Card description → Initial scope context
   - `Plan-Link` (if exists) → Check for existing fact-find brief
3. **Confirm intent:**
   - Cards in **Inbox lane**: Default to Outcome A (building/changing)
   - Cards in **Fact-finding lane**: Ask if completing existing fact-find or starting fresh
4. **Set frontmatter defaults:**
   - `Business-Unit`: from card's `Business` field
   - `Card-ID`: from the selected card
   - `Feature-Slug`: read from card frontmatter if present (do not re-derive)
5. **Skip to "Sufficiency gate"** with pre-filled context

**Example flow for selected card:**
```
User: PLAT-ENG-0002
Agent: I'll fact-find on "Agent Context Optimization Plan" (PLAT-ENG-0002).

Pre-populated from card:
- Business-Unit: PLAT
- Card-ID: PLAT-ENG-0002
- Current lane: Fact-finding (in progress)

This card is already in Fact-finding lane. Would you like to:
A) Complete the existing fact-find investigation
B) Start a fresh fact-find with new scope

What's the specific goal or question you want this fact-find to answer?
```

### Ask for minimum inputs (new topics only)

For new topics not linked to an existing card, collect enough to choose the correct outcome and scope the investigation.

**Intent (choose one):**
- A. I want to build/change something (this should feed into `/plan-feature`)
- B. I only want to understand how something works (briefing/audit)

**Topic / area:**
- Name the feature/system/component (e.g., "checkout discounts", "CMS publishing", "auth session refresh").
- If known: relevant paths/modules (even rough guesses are fine).

**Prompting detail (pick what applies):**
- For A (build/change): what's the desired new behavior/outcome?
- For B (briefing): what question(s) are you trying to answer?

**Deliverable shape (Outcome A):**
- What should exist at the end? (code, email, marketing asset, spreadsheet, WhatsApp message, product brief, or mixed pack)
- Where will it be used? (channel/system/team)

**Constraints (if any):**
- Compatibility, performance, security, rollout requirements, deadlines.

### Sufficiency gate: when to ask follow-up questions

If the user's answer is insufficient to meaningfully investigate, ask targeted questions immediately. Do not start repo auditing until you have at least:

- a concrete area (feature/component name or user-facing behavior), and
- the intended outcome (A vs. B), and
- at least one anchor for where to look (a path guess, an entrypoint guess, a UI route, an endpoint name, a log/error message, or "where in the product it appears").
- for Outcome A: a provisional deliverable shape (can be refined after initial audit).

**Pre-populated context from cards counts toward sufficiency:**
- Card Title → satisfies "concrete area"
- Card in Inbox/Fact-finding lane → implies Outcome A (building/changing)
- Card description/linked docs → may provide anchors for where to look
- Still ask for the specific goal/question if not obvious from the card

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

Produce a planning-ready evidence brief with impact mapping, execution routing, and confidence inputs aligned to `/plan-feature`'s confidence rubric.

### Output File

Create/update:
```
docs/plans/<feature-slug>-fact-find.md
```

(Use the same `<feature-slug>` that `/plan-feature` will use for `docs/plans/<feature-slug>-plan.md`.)

### Progressive Skill Routing (Outcome A)

Set `Primary-Execution-Skill` in the brief based on the dominant deliverable:

| Deliverable-Type | Primary-Execution-Skill | Supporting-Skills (example) |
|---|---|---|
| `code-change` | `/build-feature` | `/create-api-endpoint`, `/create-server-action`, `/create-ui-component` |
| `email-message` | `/draft-email-message` | `/process-emails` |
| `product-brief` | `/write-product-brief` | `/update-business-plan` |
| `marketing-asset` | `/draft-marketing-asset` | `/update-business-plan` |
| `spreadsheet` | `/create-ops-spreadsheet` | `/update-business-plan` |
| `whatsapp-message` | `/draft-whatsapp-message` | `/update-business-plan` |
| `multi-deliverable` | `/build-feature` (orchestrator mode) | select per task in plan |

### Workflow (Outcome A)

#### 1) Define scope for planning

Capture:
- Goals / non-goals
- Constraints (security, performance, compatibility, rollout)
- Assumptions (minimize; only if necessary)
- Execution profile:
  - `Deliverable-Type`
  - `Execution-Track` (`code` | `business-artifact` | `mixed`)
  - Intended channels/surfaces (repo, email, ad channel, WhatsApp, spreadsheet consumer, etc.)

#### 2) Audit evidence sources (system + business, evidence-first)

Always audit the sources that matter for the selected execution track.

**For `code` or `mixed` tracks (required):**
- Entry points (routes/handlers/pages/jobs)
- Key modules/files and responsibilities
- Data/contracts touched (types, schemas, DB models)
- Upstream dependencies and downstream dependents (blast radius)
- **Performance patterns** (N+1 queries in affected data paths, caching layers, high-frequency code paths touched by the feature)
- **Security boundaries** (auth/authorization on affected routes, data access controls, input validation points for untrusted data)
- **Test landscape** (infrastructure, patterns, coverage gaps, testability, extinct tests)
- Existing conventions/patterns to follow
- Related docs/plans
- Targeted recent git history in affected areas

**For `business-artifact` or `mixed` tracks (required):**
- Audience/recipient definition and segmentation evidence
- Channel constraints (email platform, WhatsApp policy, ad channel specs, spreadsheet consumer/tooling)
- Existing templates/assets/playbooks and performance baselines (if available)
- Approval/ownership path (who signs off, who executes/sends)
- Compliance and risk constraints (legal, brand, privacy, opt-in/contact policy)
- Measurement plan (how impact will be tracked after delivery)

**If you discover factual inaccuracies in an existing plan or related docs that would change confidence scores:**
- Note the inaccuracies in the fact-find brief, with evidence.
- Flag the confidence impact explicitly (which task(s), which dimension(s)).
- Recommend `/re-plan` to update the plan’s confidence scores accordingly.

#### 3) External research (only if needed)

Only if repo evidence cannot answer:
- API/library docs for the stack patterns in use
- Compatibility notes verified against repo versions (package.json/lockfile)
- Channel/platform policies or constraints for non-code deliverables (official docs only)

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
- **Implementation** — do we know how to execute this deliverable correctly?
- **Approach** — is this the right long-term design?
- **Impact** — do we understand what this touches and how to avoid regressions?
- **Delivery-Readiness** — do we have clear execution owner/channel/quality gate for the selected deliverable type?

Include:
- What would raise each score to **≥80** (build-eligible planning), if currently below.
- What would raise each score to **≥90** (high confidence), if currently below — tests, spikes, evidence, rollout rehearsal.

**Confidence policy reminder:** Confidence ≥90% is a motivation/diagnostic, not a quota. Do not recommend deleting planned work just to raise confidence; preserve it as phased/deferred with clear “what would make this ≥90%” actions.

#### 6) Provide planning handoff artifacts

Include:
- Planning constraints (patterns to follow, rollout expectations, observability expectations)
- Suggested task seeds (non-binding), to accelerate `/plan-feature`
- Execution routing packet:
  - `Primary-Execution-Skill`
  - `Supporting-Skills`
  - Deliverable-specific quality gate expectations

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
Workstream: <Engineering | Product | Marketing | Sales | Operations | Finance | Mixed>
Created: YYYY-MM-DD
Last-updated: YYYY-MM-DD
Feature-Slug: <kebab-case>
Deliverable-Type: <code-change | email-message | product-brief | marketing-asset | spreadsheet | whatsapp-message | multi-deliverable>
Execution-Track: <code | business-artifact | mixed>
Primary-Execution-Skill: <build-feature | draft-email-message | write-product-brief | draft-marketing-asset | create-ops-spreadsheet | draft-whatsapp-message>
Supporting-Skills: <comma-separated or none>
Related-Plan: docs/plans/<feature-slug>-plan.md
# Business OS Integration (default-on; set Business-OS-Integration: off for standalone work)
Business-OS-Integration: <on | off>  # default: on
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

## Evidence Audit (Current State)
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

### Delivery & Channel Landscape (for business-artifact or mixed)
- Audience/recipient:
  - ...
- Channel constraints:
  - ...
- Existing templates/assets:
  - ...
- Approvals/owners:
  - ...
- Compliance constraints:
  - ...
- Measurement hooks:
  - ...

### Test Landscape (required for `code` or `mixed`; optional otherwise)

#### Test Infrastructure
- **Frameworks:** <Jest | Vitest | Cypress | Playwright | etc.>
- **Commands:** `pnpm test`, `pnpm test:e2e`, etc.
- **CI integration:** <how tests run in CI; required checks>
- **Coverage tools:** <if any; current thresholds>

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `path/to/module` | unit | `path/to/test.ts` | <what's covered> |
| `path/to/api` | integration | `path/to/test.ts` | <what's covered> |

#### Test Patterns & Conventions
- Unit tests: <patterns observed, e.g., "mock repositories, test services in isolation">
- Integration tests: <patterns observed, e.g., "real DB with test fixtures">
- E2E tests: <patterns observed, e.g., "Cypress with page objects">
- Test data: <how fixtures/factories work>

#### Coverage Gaps (Planning Inputs)
- **Untested paths:**
  - `path/to/module` — <what's not tested>
- **Extinct tests** (tests asserting obsolete behavior):
  - `path/to/test.ts:L42` — <why extinct; must update/remove during build>

#### Testability Assessment
- **Easy to test:** <areas with clear boundaries, existing patterns>
- **Hard to test:** <areas with tight coupling, external dependencies, no seams>
- **Test seams needed:** <where we need to add interfaces/mocks for testability>

#### Recommended Test Approach
- **Unit tests for:** <what should be unit tested>
- **Integration tests for:** <what needs integration testing>
- **E2E tests for:** <critical user flows>
- **Contract tests for:** <API boundaries, if applicable>
- **Note:** This informs test case enumeration in `/plan-feature`

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
- **Delivery-Readiness:** <0–100>%
  - <do we have owner, channel constraints, quality checks, and deployment/send path?>
- **Testability:** <0–100>%
  - <how testable is this feature given current infrastructure and patterns?>
  - <what would improve testability? test seams, mocks, fixtures needed?>

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

## Execution Routing Packet
- Primary execution skill:
  - ...
- Supporting skills:
  - ...
- Deliverable acceptance package (what must exist before task can be marked complete):
  - ...
- Post-delivery measurement plan:
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

### Validation Foundation Checks (Outcome A only)

- [ ] Execution profile is present: Deliverable-Type + Execution-Track + Primary-Execution-Skill.
- [ ] Delivery-Readiness confidence input is provided (0-100%).
- [ ] For `code` or `mixed` tracks: Test Landscape section is complete (infrastructure, patterns, coverage, gaps, testability).
- [ ] For `code` or `mixed` tracks: Recommended test approach is documented.
- [ ] For `code` or `mixed` tracks: Extinct tests are identified and flagged for update/removal during build.
- [ ] For `business-artifact` or `mixed` tracks: Delivery & Channel Landscape is complete (audience, channel constraints, approvals, measurement).

## Final Hand-off Messages

**Outcome A (Planning):**
> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning (or Needs-input). Primary execution skill: `<skill>`. Proceed to `/plan-feature` once blocking questions are answered."

**Outcome B (Briefing):**
> "Briefing complete. Note saved to `<path>`. This documents the current behavior and evidence pointers. No planning artifact was produced."

---

## Business OS Integration (Default)

Outcome A (`Planning`) runs with Business OS integration by default.

### Escape Hatch (Exception Only)

Set this frontmatter field when work is intentionally standalone:

```yaml
Business-OS-Integration: off
```

When `off`, skip card/stage-doc writes and call out the exception explicitly in completion output.

### Business Unit Codes

- `BRIK` - Brikette (guide booking platform)
- `PLAT` - Platform (shared infrastructure)
- `PIPE` - Pipeline (product pipeline tools)
- `BOS` - Business OS (internal tools)

### Card + Stage-Doc Workflow (Integration On)

**When:** after persisting the fact-find brief (Outcome A), if `Business-OS-Integration` is omitted or `on`.

**Fail-closed:** if any API call fails, stop and surface the error.

**Step 1: Check for existing card**

- If `Card-ID` already exists in brief frontmatter: fetch card via API and skip to Step 4.
- Otherwise allocate a new ID via API (Step 2).

```json
{
  "method": "GET",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards/PLAT-ENG-0023",
  "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" }
}
```

See `.claude/skills/_shared/card-operations.md` for idempotency details.

**Step 2: Allocate Card-ID (API)**

```json
{
  "method": "POST",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/allocate-id",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": { "business": "PLAT", "type": "card" }
}
```

**Step 3: Create card via API**

Use the returned ID (or existing `Card-ID`). Include `Feature-Slug` and `Plan-Link` so later stages stay consistent.

```json
{
  "method": "POST",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "business": "PLAT",
    "title": "{Feature title from brief}",
    "description": "{Summary from fact-find brief}",
    "lane": "Fact-finding",
    "priority": "P3",
    "owner": "Pete",
    "Feature-Slug": "{feature-slug}",
    "Plan-Link": "docs/plans/{feature-slug}-fact-find.md"
  }
}
```

**Step 4: Create fact-finding stage doc (API)**

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
    "stage": "fact-find",
    "content": "# Fact-Finding: {Feature Title}\n\n## Execution Profile\n\n- Deliverable-Type: {from brief}\n- Execution-Track: {from brief}\n- Primary-Execution-Skill: {from brief}\n- Supporting-Skills: {from brief}\n\n## Questions to Answer\n\n{Import questions from fact-find brief}\n\n## Findings\n\n{Import findings from fact-find brief or \\"To be completed\\"}\n\n## Recommendations\n\n{Import recommendations or \\"To be completed based on findings\\"}\n\n## Transition Decision\n\n**Status:** {Ready-for-planning | Needs-input | Needs more fact-finding}\n**Next Lane:** Fact-finding (lane transition occurs in /plan-feature when plan gate is satisfied)\n"
  }
}
```

**Note:** `content` is markdown body only (no frontmatter). Export job adds frontmatter.

**Step 5: Update brief frontmatter**

- Add `Card-ID` to fact-find brief.
- If a card already existed, read `Feature-Slug` from card and align brief frontmatter (do not re-derive from title).

```yaml
---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
# ... other fields ...
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: PLAT-ENG-0023
Feature-Slug: my-feature
---
```

### Completion Message (with Business OS)

When integration is on and card is created:

> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning.
>
> **Business OS Integration (default-on):**
> - Created card via API: `<Card-ID>`
> - Stage doc created via API: `fact-find`
> - Card-ID added to brief frontmatter
> - Baseline lane remains `Fact-finding`; `/plan-feature` performs deterministic `Fact-finding -> Planned` when plan gate is met
>
> Proceed to `/plan-feature` once blocking questions are answered."

When integration is on and card already exists:

> "Fact-find complete. Brief saved to `docs/plans/<feature-slug>-fact-find.md`. Status: Ready-for-planning.
>
> **Business OS Integration (default-on):**
> - Using existing card via API: `<Card-ID>`
> - Stage doc created/updated via API: `fact-find`
>
> Proceed to `/plan-feature` once blocking questions are answered."

### Backward Compatibility

- Use `Business-OS-Integration: off` for intentionally standalone work.
- Existing docs without the field default to `on`.

---

## Discovery Index Freshness (Loop Contract)

`docs/business-os/_meta/discovery-index.json` powers zero-argument discovery in `/fact-find`, `/plan-feature`, and `/build-feature`.

### Trigger Points

Rebuild index immediately after successful loop writes:
- Idea/card/stage-doc create or update in `/ideas-go-faster`
- Card/stage-doc writes in `/fact-find`
- Card/stage-doc writes and deterministic `Fact-finding -> Planned` transition in `/plan-feature`
- Card/stage-doc writes and deterministic lane transitions in `/build-feature`

### Rebuild Command

```bash
docs/business-os/_meta/rebuild-discovery-index.sh > docs/business-os/_meta/discovery-index.json
```

### Failure Mode (Deterministic)

- Retry rebuild once after a short backoff.
- If it still fails: stop and surface `discovery-index stale` with:
  - failing command,
  - retry count,
  - stderr summary,
  - explicit operator rerun command.
- Do not emit a success completion message claiming discovery is current.
