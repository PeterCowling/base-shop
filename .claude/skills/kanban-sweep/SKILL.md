---
name: kanban-sweep
description: Periodic read-only sweep of the Business OS kanban system to identify bottlenecks and generate ranked ideas, experiments, and backlog suggestions.
---

# Kanban Sweep

Periodic read-only analysis of the Business OS kanban system. Identifies the current growth bottleneck, generates ranked interventions following Delete > Simplify > Accelerate > Automate preference ordering, and produces a single decision-ready sweep report. Invoked manually by Pete via `/kanban-sweep`.

## Operating Mode

**READ-ONLY ANALYSIS** (default)

When `--create-ideas` flag is passed: **READ-ONLY ANALYSIS + DRAFT IDEAS**

**Allowed:**
- Read all agent API endpoints (businesses, people, cards, ideas, stage-docs)
- Compute flow signals from snapshot data
- Write a single sweep report to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`
- Read previous sweep reports for reflection/comparison
- When `--create-ideas`: create draft ideas via `POST /api/agent/ideas`

**Not allowed:**
- Modify cards, ideas, or stage docs (no PATCH calls)
- Move cards between lanes (use `/propose-lane-move` for that)
- Create cards (use `/work-idea` for that)
- Read files outside the agent API (API is the sole data source)
- Run destructive commands
- Auto-schedule or self-invoke

**Fail-closed:** If any API call fails, stop and surface the error. Do not write the sweep report with partial data.

## Inputs

**Required:** None (the sweep reads all data from the agent API)

**Optional:**
- `--create-ideas` — Enable draft idea creation in inbox (default: report-only)

## API Prerequisites

The sweep requires the Business OS agent API to be running.

**Environment variables:**
- `BOS_AGENT_API_BASE_URL` — `https://business-os.peter-cowling1976.workers.dev` (prod) or `http://localhost:3020` (local)
- `BOS_AGENT_API_KEY` — shared secret for agent auth

**Header:** `X-Agent-API-Key: ${BOS_AGENT_API_KEY}`

**Rate limit:** 100 requests per 60 seconds per key. Full sweep budget is ~20-30 requests (well under limit).

## Constitution (Non-Negotiable Invariants)

These rules override all other instructions. The sweep must not produce output that violates any of them.

1. **Constraint-first:** Do not propose work until you name the current constraint and the metric(s) that evidence it.
2. **Read-only by default:** Produce suggestions and artifacts. Do not change kanban data unless `--create-ideas` is explicitly passed.
3. **Delete > Simplify > Accelerate > Automate (preference ordering):** Prefer removing requirements/steps/tasks over adding new ones. Do not optimize work that should not exist. This is a tiebreaker when scores are close — an Automate idea scoring 8.0 beats a Delete idea scoring 2.0.
4. **Evidence and traceability:** Every claim must point to snapshot facts (task aging, blockers, WIP counts, ownership gaps, capacity). No unsourced assertions.
5. **Smallest shippable learning unit:** Prefer minimal changes that produce a measurable signal quickly.
6. **Measurement required:** Every proposed build/experiment must specify success metrics (leading + lagging), instrumentation required, evaluation window, and rollback/kill switch.
7. **Named ownership:** Every suggested change must name a responsible owner and clarify handoffs.
8. **Safety and sustainability:** Do not recommend practices that rely on burnout, heroics, or violating policy. Optimize for sustained throughput.

## Bottleneck Categories

When diagnosing the primary constraint, classify it into exactly one of these 7 categories:

| Category | Diagnostic Signals |
|---|---|
| **Execution throughput** | High WIP in active lanes, low completion rate, aging cards in In-progress. Max confidence 6/10 (no historical transition data). |
| **Decision latency** | Cards aging in Fact-finding or Planned without progress. Unresolved DECISION tasks in plans. Cards waiting on user input. |
| **Ownership / coordination** | Unowned cards in active lanes. Multiple cards assigned to same person exceeding capacity (>3 active WIP). Cards with no recent `Updated` date. |
| **Capability mismatch** | Cards blocked by skills not present in the team. External dependency blocks. Cards requiring research that hasn't started. |
| **Quality / rework** | Cards moving backwards (Done → In-progress). Blocked cards citing quality issues. Multiple iterations visible in stage docs. |
| **Business clarity** | Vague card descriptions. Missing acceptance criteria. No linked plan or fact-find. Business goals not defined or outdated. |
| **External dependency** | Cards blocked by vendors, third parties, or systems outside the team's control. Blocked-Reason citing external factors. |

## Scoring Rubric

Score each intervention on 5 dimensions (0-10 scale):

| Dimension | What it measures |
|---|---|
| **Impact** | Expected movement in the constraint metric / North Star |
| **Confidence** | Strength of evidence from the snapshot |
| **Time-to-signal** | How quickly you'll learn if it works |
| **Effort** | Total coordination + build cost |
| **Risk** | Reversibility, compliance, blast radius |

**Priority formula (invariant):**

```
Priority = (Impact × Confidence × Time-to-signal) / (Effort × (1 + Risk))
```

**Scoring rules:**
- If Risk >= 8: require staged rollout + explicit reviewer
- If Confidence <= 4: treat as discovery — propose the minimal experiment, not a build
- When two ideas have similar Priority scores: prefer Delete/Simplify over Accelerate/Automate

**Confidence thresholds:**
- **0-3:** Discovery needed — insufficient data to act
- **4-6:** Weak evidence — proceed with caution, design experiment first
- **7-8:** Solid — evidence supports the intervention
- **9-10:** Strong — clear signal from snapshot data

When confidence < 7, you MUST list the specific evidence gaps and what data would raise it.

## Workflow

### 1. Ingest Snapshot via API

Fetch the current state of the Business OS by calling these endpoints in sequence:

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/businesses", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ businesses: Business[] }`

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/people", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ people: Person[] }` (includes `capacity.maxActiveWip` per person)

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/cards", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ cards: Card[] }` (all cards, all businesses, all lanes)

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/ideas?location=inbox", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ ideas: Idea[] }` (inbox ideas)

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/ideas?location=worked", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ ideas: Idea[] }` (worked ideas)

**Stage docs (selective — active WIP lanes only):**

For each card where `Lane` is one of `Fact-finding`, `In progress`, or `Blocked`:

```json
{ "method": "GET", "url": "${BOS_AGENT_API_BASE_URL}/api/agent/stage-docs?cardId={CARD-ID}", "headers": { "X-Agent-API-Key": "${BOS_AGENT_API_KEY}" } }
```
→ `{ stageDocs: StageDoc[] }` (all stages for that card — `stage` param is optional)

**Blocked detection:** A card is blocked if `Lane === "Blocked"` OR `Blocked === true`.

**If any API call fails:** STOP. Surface the error. Do not proceed with partial data.

### 2. Compute Flow Signals

From the snapshot, compute:

- **WIP by lane:** Count cards in each lane (Inbox, Fact-finding, Planned, In progress, Blocked, Done, Reflected)
- **WIP by business:** Count active WIP cards (Fact-finding + In progress + Blocked) per business
- **Blocked ratio:** `blocked_cards / total_active_wip` (where blocked = lane OR field)
- **Aging distribution:** For each active WIP card, compute `days_since_updated = today - card.Updated` (or `today - card.Created` if no Updated). Flag cards aging > 7 days as "aging hotspots".
- **Ownership gaps:** Count active WIP cards where `Owner` is empty or undefined
- **Capacity vs load:** For each person, count their active WIP cards. Compare to `capacity.maxActiveWip` (default: 3). Flag overloaded people.
- **Idea backlog:** Count inbox ideas and worked ideas. Flag businesses with 0 ideas.
- **Stage doc completeness:** For active WIP cards, check whether expected stage docs exist (e.g., a card in "In progress" should have a fact-find and/or plan stage doc)

**Limitation:** Throughput and cycle time cannot be computed (no per-lane transition history). If you diagnose an execution throughput bottleneck, cap confidence at 6/10 and note this limitation explicitly.

### 3. Diagnose Primary Bottleneck

Using the flow signals, diagnose **one** primary constraint:

**Output format:**

> **Constraint statement:** "The system is rate-limited by ____."
>
> **Category:** (one of the 7 categories)
>
> **Evidence:**
> - (3-7 bullets, each citing specific snapshot facts)
>
> **Confidence:** X/10
> - (if < 7: list specific evidence gaps)
>
> **First actions (Delete > Simplify):**
> 1. ...
> 2. ...
> 3. ...
>
> **Disproof signals:** What would we observe in the next sweep that disproves this diagnosis?

**Common mistakes to avoid:**
- Naming a symptom ("things are slow") instead of a mechanism ("review queue is the constraint due to scarce reviewer capacity")
- Picking multiple constraints without justifying why one isn't primary
- Making claims without snapshot evidence

### 4. Generate Ideas (3-10 Interventions)

For each idea:

- **Title** — concise action statement
- **Targets bottleneck:** (link to the constraint statement)
- **Type:** Delete | Simplify | Accelerate | Automate
- **Mechanism:** Why this relieves the constraint
- **Evidence from snapshot:** (2+ bullets)
- **Score:** Impact, Confidence, Time-to-signal, Effort, Risk (all 0-10)
- **Priority:** computed from formula
- **First step (<48h):** concrete action
- **Measurement plan:** leading indicators, lagging indicators, instrumentation needed
- **Suggested skill invocation:** e.g., `/work-idea <title>`, `/fact-find <topic>`, `/propose-lane-move <card-id>`

### 5. Score and Rank

Apply the scoring rubric to all ideas. Rank by Priority (descending). When scores are close (within 10% of each other), prefer Delete/Simplify over Accelerate/Automate.

Present as a ranked table:

```markdown
| Rank | Idea | Type | Impact | Conf | T2S | Effort | Risk | Priority | First Step |
|------|------|------|--------|------|-----|--------|------|----------|------------|
| 1 | ... | Delete | 8 | 7 | 9 | 3 | 2 | 168.0 | ... |
| 2 | ... | Simplify | 7 | 8 | 7 | 4 | 3 | 98.0 | ... |
```

### 6. Design Experiments (1-3)

For the top ideas that have Confidence <= 6, design lightweight experiments:

- **Hypothesis:** (one sentence)
- **Change:** (what will be done)
- **Scope:** population/area + duration/evaluation window
- **Success metrics:** leading + lagging
- **Instrumentation:** events, logs, manual tracking
- **Rollout plan:** stages, canary, comms
- **Rollback plan:** kill switch, revert steps, criteria
- **Owner:** (named person)

### 7. Assemble Sweep Report

Write a single file to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md` using the template below.

**If `--create-ideas` flag was passed:** After writing the report, create draft ideas via the API (see Step 7b).

### 7b. Create Draft Ideas (only when `--create-ideas` is passed)

For each recommended idea (from the ranked list), create a draft idea in the inbox:

```json
{
  "method": "POST",
  "url": "${BOS_AGENT_API_BASE_URL}/api/agent/ideas",
  "headers": {
    "X-Agent-API-Key": "${BOS_AGENT_API_KEY}",
    "Content-Type": "application/json"
  },
  "body": {
    "business": "<business code>",
    "content": "# <Idea Title>\n\n**Source:** Sweep report <YYYY-MM-DD>\n**Targets bottleneck:** <constraint statement>\n**Type:** <Delete|Simplify|Accelerate|Automate>\n**Priority score:** <computed priority>\n\n## Mechanism\n<why this relieves the constraint>\n\n## First step\n<concrete action>\n\n## Measurement\n<leading + lagging indicators>",
    "tags": ["sweep-generated", "sweep-<YYYY-MM-DD>"]
  }
}
```

**Limits:** Create at most 5 draft ideas per sweep (top 5 by Priority). If the sweep generates more, include the rest only in the report.

### 8. Reflect on Previous Sweep

**Find previous sweep:** Look for the most recent file in `docs/business-os/sweeps/` by filename date sort (excluding today's sweep).

**If a previous sweep exists**, add a Reflection section to the report:

- **Did the bottleneck shift?** Compare previous constraint category and statement to current.
- **Were recommendations accepted?** Check if previous ideas were converted to cards or worked ideas.
- **What predictions were wrong?** Compare previous disproof signals to current evidence.
- **System trajectory:** Is the system improving, stable, or degrading? Cite evidence.

**If no previous sweep exists:** Note "First sweep — no prior data for comparison" and skip reflection.

## Sweep Report Template

```markdown
---
Type: Sweep
Date: YYYY-MM-DD
Previous-Sweep: docs/business-os/sweeps/YYYY-MM-DD-sweep.user.md  # or "None"
Bottleneck-Category: <one of 7 categories>
Bottleneck-Confidence: X/10
Ideas-Generated: N
Ideas-Created: N  # 0 if --create-ideas not passed
---

# Kanban Sweep Report — YYYY-MM-DD

## Executive Summary

- **Primary bottleneck:** <one sentence constraint statement>
- **Confidence:** X/10
- **What changed since last sweep:** <one sentence, or "First sweep">
- **Top 3 recommendations:** <brief list>
- **Top risks / decisions needed:** <brief list>

## Snapshot Overview

- **Businesses:** N active
- **Cards:** N total (Inbox: N, Fact-finding: N, Planned: N, In progress: N, Blocked: N, Done: N, Reflected: N)
- **Active WIP:** N (Fact-finding + In progress + Blocked)
- **People:** N
- **Ideas:** N inbox, N worked

## Flow Signals

### WIP Distribution

| Lane | Count | % of Total |
|------|-------|------------|
| ... | ... | ... |

### WIP by Business

| Business | Active WIP | Blocked | Aging >7d |
|----------|-----------|---------|-----------|
| ... | ... | ... | ... |

### Aging Hotspots

| Card ID | Title | Lane | Days Since Update | Owner |
|---------|-------|------|-------------------|-------|
| ... | ... | ... | ... | ... |

### Ownership & Capacity

| Person | Active WIP | Max WIP | Status |
|--------|-----------|---------|--------|
| ... | ... | ... | OK / Overloaded / Underloaded |

### Blocked Cards

| Card ID | Title | Lane | Blocked-Reason | Owner |
|---------|-------|------|----------------|-------|
| ... | ... | ... | ... | ... |

## Primary Bottleneck Brief

### Constraint Statement

"The system is rate-limited by ____."

### Category

<one of: Execution throughput | Decision latency | Ownership/coordination | Capability mismatch | Quality/rework | Business clarity | External dependency>

### Evidence

- <fact from snapshot with specific numbers>
- <fact from snapshot with specific numbers>
- <3-7 bullets total>

### Confidence: X/10

<If < 7: list specific evidence gaps and what data would raise confidence>

### First Actions (Delete > Simplify)

1. <action> — `/skill-invocation`
2. <action> — `/skill-invocation`
3. <action> — `/skill-invocation`

### Disproof Signals

What would we observe in the next sweep that disproves this diagnosis?
- <signal>
- <signal>

## Per-Business Breakdown

### PLAT — Platform
- Active WIP: N
- Key observation: ...
- Recommendation: ...

### BRIK — Brikette
- Active WIP: N
- Key observation: ...
- Recommendation: ...

### BOS — Business OS
- Active WIP: N
- Key observation: ...
- Recommendation: ...

(Repeat for each business with active cards)

## Ranked Interventions

| Rank | Idea | Type | Impact | Conf | T2S | Effort | Risk | Priority | Next Step |
|------|------|------|--------|------|-----|--------|------|----------|-----------|
| 1 | ... | ... | ... | ... | ... | ... | ... | ... | `/skill ...` |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | `/skill ...` |

### Idea 1: <Title>

**Targets bottleneck:** <constraint>
**Type:** Delete | Simplify | Accelerate | Automate

**Mechanism:** <why this relieves the constraint>

**Evidence:** <2+ snapshot facts>

**Scores:** Impact X, Confidence X, Time-to-signal X, Effort X, Risk X → **Priority: X.X**

**First step (<48h):** <concrete action>

**Measurement plan:**
- Leading: ...
- Lagging: ...
- Instrumentation: ...

**Suggested next step:** `/skill-invocation argument`

(Repeat for each idea)

## Experiments (1-3)

### Experiment 1: <Title>

- **Hypothesis:** <one sentence>
- **Change:** <what will be done>
- **Scope:** <population + duration>
- **Success metrics:** leading + lagging
- **Instrumentation:** <how to measure>
- **Rollout:** <stages>
- **Rollback:** <kill switch + criteria>
- **Owner:** <name>

## Backlog Suggestions

- **Split:** <oversized cards to split, with rationale>
- **Merge:** <duplicate or overlapping cards>
- **Reorder:** <priority changes based on bottleneck>
- **Clarify:** <cards needing clearer description/acceptance criteria>
- **Missing:** <tasks to add — instrumentation, discovery, docs>

## Governance & Safety Notes

- **Data gaps:** <what data is missing that would improve analysis>
- **Capacity concerns:** <overloaded people, sustainability risks>
- **Compliance/security:** <flags if relevant, or "None">
- **People data quality:** <note if using default capacity due to missing profiles>

## Next Actions This Week

| Priority | Action | Owner | Skill Invocation |
|----------|--------|-------|------------------|
| 1 | ... | ... | `/skill ...` |
| 2 | ... | ... | `/skill ...` |
| 3 | ... | ... | `/skill ...` |

## Reflection (vs Previous Sweep)

<If previous sweep exists:>

- **Bottleneck shift:** <same | shifted from X to Y | new>
- **Recommendations accepted:** <which previous ideas were acted on>
- **Predictions wrong:** <what disproof signals showed>
- **System trajectory:** <improving | stable | degrading> — evidence: ...

<If no previous sweep:>

First sweep — no prior data for comparison.
```

## Evaluation Rubric (Quality Checks)

After producing the sweep report, self-evaluate against these 6 dimensions (0-5 each, total /30):

| Dimension | 0 (fail) | 3 (adequate) | 5 (excellent) |
|---|---|---|---|
| **Constraint quality** | No bottleneck chosen | Bottleneck chosen but weak evidence | Single constraint, strong evidence, clear mechanism |
| **Actionability** | Generic advice | Some concrete steps | Clear tasks/owners/next actions with minimal ambiguity |
| **Deletion-first bias** | Mostly "build more" | Mix of build and simplification | Clear deletion/simplification leading recommendations |
| **Measurement discipline** | No metrics/rollback | Metrics listed but vague | Specific metrics + instrumentation + evaluation window + rollback |
| **Kanban/flow literacy** | Ignores WIP/aging/blockers | Mentions them but no quantification | Uses them correctly with numbers to justify actions |
| **People/system framing** | Blames individuals | Neutral | System-focused, uses ownership/capacity respectfully |

**Threshold:** ≥18/30 for Phase 0 acceptance. If below, revise the weakest dimensions before finalizing.

## Red Flags (Hard Guardrails)

If any of these are true, the sweep report is invalid and must be revised:

1. Recommends >10 ideas with no prioritization
2. Recommends new work without naming the constraint it relieves
3. Invents metrics not present in the snapshot
4. Produces "rewrite the roadmap" outputs (thrash)
5. Suggests "work harder/longer" as the main lever
6. Reassigns work ignoring stated capacity limits
7. Proposes risky changes with no rollout/rollback plan

## Edge Cases

### No active WIP cards

If all cards are in Inbox, Planned, Done, or Reflected (no active work):
- Diagnose as "Decision latency" or "Business clarity" bottleneck
- Focus recommendations on moving cards from Inbox/Planned into active work
- Skip capacity analysis

### Single-person team (Phase 0)

Pete is the sole operator. Capacity analysis is simplified:
- Default `maxActiveWip = 3`
- "Ownership coordination" bottleneck becomes "context-switching" bottleneck when WIP > 3
- Do not recommend "hire someone" — instead recommend reducing WIP

### All cards blocked

If blocked ratio > 50%:
- Prioritize unblocking over new work
- Examine Blocked-Reason patterns for common themes
- Recommend external dependency resolution or scope reduction

### Insufficient data for diagnosis

If flow signals are ambiguous (e.g., low card count, no aging, no blocks):
- State what is missing
- Provide a "best-effort" hypothesis with explicit uncertainty (confidence ≤ 4)
- Recommend the minimum additional data needed (e.g., "run `/scan-repo` to surface new ideas")

## Integration with Other Skills

The sweep connects to the feature pipeline:

| Sweep Output | Next Skill | When |
|---|---|---|
| New idea recommendation | `/work-idea <title>` | To convert sweep idea into a worked idea with card |
| Area needing investigation | `/fact-find <topic>` | To deep-dive before planning |
| Card ready to move lanes | `/propose-lane-move <card-id>` | When evidence supports a transition |
| Stale card to reconsider | `/propose-lane-move <card-id>` | Suggest Done/Reflected for abandoned work |
| Repo changes to detect | `/scan-repo` | Complement sweep with change-detection |
| Business plan needs update | `/update-business-plan` | When goals or metrics need revision |

## Example Session

```
User: /kanban-sweep

Agent: Starting kanban sweep...

[Fetching snapshot from Business OS API]
✓ 3 businesses loaded
✓ 3 people loaded
✓ 47 cards loaded
✓ 12 inbox ideas, 8 worked ideas loaded
✓ Stage docs loaded for 11 active WIP cards

[Computing flow signals]
- Active WIP: 11 (Fact-finding: 3, In progress: 6, Blocked: 2)
- Blocked ratio: 18% (2/11)
- Aging hotspots: 3 cards >7 days without update
- Pete: 9 active WIP (capacity: 3) — OVERLOADED

[Diagnosing primary bottleneck]
Category: Ownership / coordination
Constraint: "The system is rate-limited by single-owner WIP overload — Pete has 9 active cards against a capacity of 3."
Confidence: 8/10

[Generating interventions]
5 ideas generated, scored, and ranked.

[Writing sweep report]
✓ Sweep report saved to docs/business-os/sweeps/2026-02-06-sweep.user.md

[Self-evaluation: 22/30]
- Constraint quality: 4/5
- Actionability: 4/5
- Deletion-first bias: 3/5
- Measurement discipline: 4/5
- Kanban/flow literacy: 4/5
- People/system framing: 3/5

Sweep complete. Report: docs/business-os/sweeps/2026-02-06-sweep.user.md
Top recommendation: Reduce Pete's active WIP from 9 to 3 by moving 4 lowest-priority cards to Planned and 2 stale cards to Done.
Suggested next step: /propose-lane-move BRIK-ENG-0015 Planned
```

## Error Handling

| Error | Action |
|---|---|
| API returns non-200 | STOP. Surface error with URL and status code. Do not write partial report. |
| API returns empty cards list | Proceed but note "No cards in system" in the report. Skip flow analysis. |
| Previous sweep file cannot be parsed | Skip reflection section. Note the parsing error in Governance. |
| Rate limit hit (429) | STOP. Surface error. Recommend waiting 60 seconds and retrying. |
| `BOS_AGENT_API_BASE_URL` not set | STOP. Inform user to set environment variable. |

## Phase 0 Constraints

- **Pete-triggered only.** No automated scheduling or self-invocation.
- **Agent identity.** All API calls use the agent API key. Any created ideas are tagged `sweep-generated`.
- **Prompt-only.** All analysis logic lives in this SKILL.md. No TypeScript modules for flow analysis or scoring. Extract to code later if patterns stabilize.
- **No throughput metrics.** Cards have `Created` and `Updated` dates but no per-lane transition history. Throughput and cycle time cannot be computed. Cap confidence at 6/10 for throughput-based diagnoses.
- **Default capacity.** `maxActiveWip = 3` per person unless the people API returns richer data.
- **Single-file output.** One sweep report per invocation. No split artifacts.
- **Max 5 draft ideas** per sweep when `--create-ideas` is passed.

## Success Metrics

- Sweep report produced in <5 minutes
- Evaluation rubric score ≥18/30
- Bottleneck diagnosis cites ≥3 evidence bullets from snapshot
- At least one recommendation of type Delete or Simplify
- All recommendations include a concrete skill invocation
- No red flags triggered
- Pete finds the report useful for weekly prioritization (subjective)

## Completion Messages

**Standard (report-only):**
> "Sweep complete. Report saved to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Self-evaluation: X/30. Top recommendation: <one-liner>. Suggested next step: `/<skill> <args>`."

**With idea creation:**
> "Sweep complete. Report saved to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. N draft ideas created in inbox (tagged `sweep-generated`). Self-evaluation: X/30. Top recommendation: <one-liner>. Suggested next step: `/<skill> <args>`."

**Insufficient data:**
> "Sweep complete with limited confidence. Report saved to `docs/business-os/sweeps/<YYYY-MM-DD>-sweep.user.md`. Data gaps noted in Governance section. Recommend: <specific data-gathering action>."
