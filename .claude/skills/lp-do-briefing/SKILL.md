---
name: lp-do-briefing
description: Produce an understanding-only system briefing — how something works now, traced end-to-end with evidence pointers. No planning artifacts or tasks. Use when you need current-behavior understanding without committing to a plan.
---

# Briefing Orchestrator

`/lp-do-briefing` produces concise system briefings: current behavior explained end-to-end with evidence, no planning tasks.

Use this skill when:
- You want to understand a system before deciding whether to change it.
- A stakeholder needs a factual snapshot of current behavior.
- You need evidence pointers before writing a spec or planning a change.

Use `/lp-do-fact-find` instead when you intend to plan or build a change.

## Global Invariants

### Operating mode

**BRIEFING ONLY**

### Allowed actions

- Read/search files and docs.
- Run non-destructive commands (`rg`, targeted lint/typecheck) for evidence.
- Inspect targeted git history.

### Prohibited actions

- Code changes, refactors, or production data writes.
- Destructive shell/git commands.
- Planning/build execution — this skill ends at a briefing note.

### Evidence and quality rules

- Non-trivial claims require file/line pointers.
- Unknowns must include a concrete verification path.
- Omit empty sections or collapse to one-line `Not investigated: <reason>`.

## Required Inputs

- Topic or system area to understand.
- At least one location anchor (path guess, route, endpoint, error/log, or user flow).

If either is missing, ask only the minimum follow-up questions needed to unblock.

## Phase 0: Queue Check Gate

Before doing anything else, check whether a queued dispatch packet exists for this invocation.

**How to check:**
Read `docs/business-os/startup-loop/ideas/trial/queue-state.json` (if it exists). Look for any packet where:
- `queue_state: enqueued`, AND
- `business` matches the invoked business, AND
- `status: briefing_ready`, AND
- `area_anchor` or `artifact_id` overlaps materially with the invoked topic.

**If a matching queued packet is found:**

Stop immediately. Output only the following — do not run any phases, read any files, or produce any artifacts:

> A queued dispatch packet exists for this topic and requires confirmation before proceeding.
>
> **Area:** `<area_anchor>`
> **What changed:** `<current_truth>`
> **Proposed scope:** `<next_scope_now>`
> **Priority:** `<priority>`
>
> _(If `triggered_by` is present, insert this block — otherwise omit entirely:)_
> ⚠️ **This was triggered by a recent build, not a new external signal.** Check that this is genuinely new work before confirming — you may be looking at a follow-on from something you already ran.
> _Source: `<triggered_by dispatch_id>`_
>
> Do you want to proceed with this briefing? Reply **yes** to confirm, or anything else to leave it queued.

If the operator replies **yes**: proceed to Phase 1 with `Dispatch-ID` set to the matching packet's `dispatch_id`. On artifact persistence (Phase 4), populate `processed_by` in the packet: `route: dispatch-routed`, `processed_at: <now>`, `fact_find_slug` (briefing topic slug), `fact_find_path` (briefing output path). Set `queue_state: processed`.

If the operator replies anything other than **yes**, or does not reply: stop. Do nothing. The packet remains `enqueued`.

**If no matching queued packet is found:**

Proceed to Phase 1 as a direct briefing.

## Phase 1: Topic Selection

### Fast path (argument provided)

- Argument is a topic, file path, or system area → proceed to sufficiency gate.

### Discovery path (no argument)

- Ask the user what system, feature, or behavior they want to understand.

## Phase 2: Sufficiency Gate

Do not start investigation until topic and location anchor are both satisfied.

## Phase 3: Investigate

Load and follow:

- `modules/briefing.md`

## Phase 4: Persist Artifact

- Output path: `docs/briefs/<topic-slug>-briefing.md`
- Fallback: `docs/plans/<topic-slug>-briefing.md`
- Template: `docs/briefs/_templates/briefing-note.md`
- Fill with evidence. Omit empty sections.

## Completion Message

> Briefing complete. Note saved to `<path>`. This documents current behavior and evidence pointers. No planning artifact was produced. Use `/lp-do-fact-find` when you are ready to plan a change.
