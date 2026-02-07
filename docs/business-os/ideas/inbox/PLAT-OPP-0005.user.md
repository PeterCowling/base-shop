---
Type: Idea
ID: PLAT-OPP-0005
Business: PLAT
Status: Draft
Owner: Pete
Created-Date: 2026-02-06
Tags: [kanban, agents, bottleneck, sweep, growth, operating-system, automation]
---

# Periodic Kanban Sweep Agent: Bottleneck-First Growth Loop

## Summary

Add a periodic "sweep" capability to the Business OS that uses AI agents to scan the kanban system (business plans + cards/tasks + people profiles), identify the current growth bottleneck, and generate fresh ideas, experiments, and backlog suggestions. The sweep acts as a second pair of eyes on the system, enforcing a constraint-first operating mentality: name the bottleneck, then propose the smallest change that tests a hypothesis.

## The problem

The Business OS tracks plans, tasks, and people -- but the system doesn't currently examine itself. Nobody periodically asks: "What is the single rate-limiting constraint right now, and are we working on the right thing to relieve it?"

**Without a sweep loop, common failure modes emerge:**

1. **Feature factory:** Work gets added because someone thought of it, not because it targets a constraint. The backlog grows, WIP increases, throughput drops.
2. **Stale work accumulates silently.** Cards age in doing/review/blocked without anyone noticing the pattern or asking why.
3. **Ownership gaps go undetected.** Tasks without a named owner drift. Nobody is accountable, so nobody acts.
4. **Bottlenecks shift without being re-identified.** After a constraint is relieved, the next one isn't diagnosed -- the team keeps optimising the old bottleneck.
5. **No closed loop.** Work ships but there's no systematic check of whether it moved the metric. Reflection happens ad-hoc if at all.

The existing skill pipeline (`/fact-find` -> `/plan-feature` -> `/build-feature` -> `/session-reflect`) handles individual features well. What's missing is the **meta-level** loop that decides *which* feature to work on next by examining the whole system.

## Proposed approach

### Core concept: a periodic read-only sweep

An AI agent reads a snapshot of the Business OS (all businesses, all cards, all people) and produces a "sweep pack" of suggestions. It does not modify the kanban directly -- it proposes, humans decide.

### The sweep loop (runs weekly or biweekly)

1. **Ingest** -- Snapshot the current state: businesses (plans, goals, stage), cards (status, blockers, aging, ownership), people (capacity, skills, focus areas).
2. **Analyse flow** -- Compute signals: WIP by status/business, blocked ratio, aging distribution, ownership gaps, capacity vs load per person.
3. **Diagnose bottleneck** -- Name one primary constraint with evidence and a confidence score. Categories: execution throughput, decision latency, ownership/coordination, capability mismatch, quality/rework, business clarity, external dependency.
4. **Generate ideas** -- 3-10 interventions aligned to the bottleneck, in this order of preference: **Delete** (remove steps/tasks/requirements) -> **Simplify** (split oversized tasks, reduce coupling) -> **Accelerate** (shorten cycle time, reduce handoffs) -> **Automate** (tooling, only after deletion/simplification).
5. **Design experiments** -- 1-3 lightweight experiments for the top ideas, with hypothesis, success metrics, rollout/rollback, and owner.
6. **Propose backlog edits** -- Concrete suggestions: split oversized cards, merge duplicates, reorder work, clarify ownership, flag missing instrumentation.
7. **Assemble report** -- A decision-ready sweep report with executive summary, bottleneck brief, ranked recommendations, and next actions for the week.
8. **Reflect** (if prior sweep exists) -- Compare to last sweep: did the bottleneck shift? Were recommendations accepted? What predictions were wrong?

### Constitution (operating mentality, not a prompt)

The sweep agent operates under hard invariants:

- **Constraint-first:** Do not propose work until you name the current constraint and the metric that evidences it.
- **Read-only by default:** Produce suggestions and artifacts. Do not change kanban data unless explicitly granted write capability.
- **Delete -> Simplify -> Accelerate -> Automate (in that order):** Prefer removing requirements/steps/tasks over adding new ones. Do not optimize work that should not exist.
- **Evidence and traceability:** Every claim must point to snapshot facts (task aging, blockers, WIP, ownership gaps, capacity).
- **Smallest shippable learning unit:** Prefer minimal changes that produce a measurable signal quickly.
- **Measurement required:** Every proposed build/experiment must specify success metrics, instrumentation, evaluation window, and rollback.
- **Named ownership:** Every suggested change must name a responsible owner.
- **Safety and sustainability:** Do not recommend practices that rely on burnout or heroics.

### Scoring rubric for ideas

To prevent hand-wavy prioritisation, each idea is scored:

- **Impact** (0-10): expected movement in constraint metric / North Star
- **Confidence** (0-10): strength of evidence from snapshot
- **Time-to-signal** (0-10): how quickly you'll learn if it works
- **Effort** (0-10): coordination + build cost
- **Risk** (0-10): reversibility, compliance, blast radius

Priority = (Impact x Confidence x Time-to-signal) / (Effort x (1 + Risk))

### Integration with existing Business OS

The sweep agent reads from the same data the Business OS already manages:

| Business OS concept | Sweep agent input |
|---|---|
| Business plans (`docs/business-os/strategy/`) | Goals, North Star metrics, constraints |
| Cards (`docs/business-os/cards/`) | Status, lane, blockers, ownership, aging, stage docs |
| Ideas (`docs/business-os/ideas/`) | Existing idea backlog (avoid duplicates) |
| People (`docs/business-os/people/`) | Capacity, skills, focus areas |
| Agent APIs (`/api/agent/cards`, `/api/agent/ideas`) | Read current state, propose new ideas |

Sweep outputs map to existing artifacts:
- New ideas -> `/api/agent/ideas` (or idea cards in inbox)
- Bottleneck briefs -> stored in `docs/business-os/sweeps/<date>/`
- Experiment cards -> feed into `/fact-find` -> `/plan-feature` pipeline
- Backlog suggestions -> human-reviewed, then applied via card PATCH API

### What this is NOT

- **Not a replacement for human judgment.** The sweep proposes, humans decide. Read-only by default.
- **Not a replacement for the feature pipeline.** `/fact-find` -> `/plan-feature` -> `/build-feature` remains the execution path. The sweep decides what to feed into that pipeline.
- **Not a metrics dashboard.** It computes flow signals from the kanban snapshot, not from analytics/billing/support systems. Those integrations come later.
- **Not a general-purpose chatbot.** It's a structured, periodic process with defined inputs, outputs, and quality criteria.

## Starting point: ChatGPT draft pack

A complete generic draft pack exists at `~/Downloads/kanban-sweep-agent-draft/` with:
- Constitution, agent manifest, glossary
- 10 skill specs (orchestrator, ingest, flow analysis, bottleneck diagnosis, idea generation, experiment design, backlog rewrite, sweep report, reflection, governance/safety)
- 5 playbooks (bottleneck selection, deletion-first, meetingless decisions, risk management, scoring rubric)
- 9 JSON schema data contracts (snapshot, business plan, task, person, flow analysis, bottleneck brief, idea card, experiment card, backlog suggestions)
- 5 output templates (sweep report, bottleneck brief, idea card, experiment card, decision log)
- Evaluation rubric, red flags, test cases, example snapshot
- System prompt template and role prompts (operator, critic, scribe)

This draft is generic. The next step is to bind it to the actual Business OS data model, agent APIs, skill conventions, and repo structure.

## Key architectural questions (for fact-find)

1. **Snapshot source:** Build from the agent APIs (`GET /api/agent/cards`, `GET /api/agent/people`) or directly from the markdown files in `docs/business-os/`? API is cleaner but may not expose all fields.
2. **Skill structure:** One monolithic `/kanban-sweep` skill, or a skill-set (10 sub-skills as in the draft)? The existing skill convention is one SKILL.md per skill -- a meta-orchestrator that calls sub-steps internally may be the right fit.
3. **Output location:** `docs/business-os/sweeps/<date>/` as a new directory alongside `cards/`, `ideas/`, `strategy/`? Or feed outputs through the existing idea/card APIs?
4. **Data contracts:** Adopt the draft pack's JSON schemas or map directly to the Business OS card/idea frontmatter format? The existing system uses YAML frontmatter in markdown, not JSON.
5. **Scheduling/triggering:** Manual invocation via a skill command (e.g., `/kanban-sweep`), or automated periodic trigger? Start manual, automate later.
6. **Multi-agent execution:** Single agent runs end-to-end, or operator + critic pattern from the draft pack's role prompts?

## Relationship to other work

- **Business OS app** (`apps/business-os/`) -- The sweep reads from the same system. If the BoS app exposes richer APIs (lane history, card timestamps), the sweep gets better inputs.
- **`/session-reflect`** -- Reflection on individual sessions. The sweep is reflection on the whole system.
- **`/scan-repo`** -- Scans `docs/business-os/` for changes and creates ideas. The sweep is broader: it analyses flow, capacity, and bottlenecks, not just doc changes.
- **Business maturity model** (`docs/business-os/strategy/business-maturity-model.md`) -- The sweep should be aware of each business's maturity stage when diagnosing bottlenecks.

## Next steps

1. **Fact-find:** Map the draft pack's data contracts to the actual Business OS data model (cards, ideas, people, plans). Identify gaps and overlaps.
2. **Fact-find:** Determine the best snapshot source (agent APIs vs markdown files vs combination).
3. **Fact-find:** Design the skill structure (single orchestrator skill vs multi-skill set) based on existing skill conventions.
4. **Prototype:** Run a manual sweep on the current Business OS state to validate the bottleneck diagnosis approach.
5. **Decide:** Output format -- JSON sweep pack vs markdown artifacts vs both.
6. **Build:** Implement as a skill, starting with ingest + flow analysis + bottleneck diagnosis (the minimum viable sweep).
