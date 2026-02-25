---
name: lp-do-fact-find
description: Thin orchestrator for discovery, intake routing, and evidence-first fact-finding. Routes to specialized modules and emits planning artifacts ready for /lp-do-plan. For understanding-only briefings, use /lp-do-briefing.
---

# Fact Find Orchestrator

`/lp-do-fact-find` is the intake and routing layer. Keep this file thin.

This orchestrator does five things:
1. Discovery and selection (topic)
2. Sufficiency gate
3. Classification (track, deliverable)
4. Module routing (load only one relevant module, plus mixed-track add-on when needed)
5. Artifact persistence using shared templates + automatic critique

Do not embed long templates, long checklists, or API payload blocks here.

## Global Invariants

### Operating mode

**FACT-FIND ONLY**

### Repo actions (allowed)

- Read/search files and docs.
- Run non-destructive commands (for example `rg`, targeted tests, targeted lint/typecheck) when needed for evidence.
- Inspect targeted git history.

### Prohibited actions

- Code changes, refactors, migrations, or production data writes.
- Destructive shell/git commands.
- Planning/build execution (this skill ends at fact-find output).

### Evidence and quality rules

- Evidence first: non-trivial claims require explicit pointers.
- Unknowns must include a concrete verification path.
- Omit sections with no evidence, or collapse to a one-line `Not investigated: <reason>`.
- Keep signal high:
  - max 10 key files/modules in primary evidence list
  - max 10 risks
  - max 8 open questions

## Required Inputs

Minimum intake before investigation:

- Concrete area anchor (feature/component/system)
- At least one location anchor (path guess, route, endpoint, error/log, user flow)
- Provisional deliverable family

If any item is missing, ask only the minimum follow-up questions needed to unblock.

For understanding-only briefings (no planning intent), use `/lp-do-briefing` instead.

## Phase 0: Queue Check Gate

Before doing anything else, check whether a queued dispatch packet exists for this invocation.

**How to check:**
Read `docs/business-os/startup-loop/ideas/trial/queue-state.json` (if it exists). Look for any packet where:
- `queue_state: enqueued`, AND
- `business` matches the invoked business, AND
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
> Do you want to proceed with this fact-find? Reply **yes** to confirm, or anything else to leave it queued.

If the operator replies **yes**: proceed to Phase 1 with `Dispatch-ID` set to the matching packet's `dispatch_id`. On artifact persistence (Phase 6), populate `processed_by` in the packet: `route: dispatch-routed`, `processed_at: <now>`, `fact_find_slug` and `fact_find_path` from the output. Set `queue_state: processed`.

If the operator replies anything other than **yes**, or does not reply: stop. Do nothing. The packet remains `enqueued`.

**If no matching queued packet is found:**

Proceed to Phase 1 as a direct inject. `Trigger-Source` is required in the fact-find frontmatter (per `loop-output-contracts.md` Artifact 1).

## Phase 1: Discovery and Selection

### Fast path (argument provided)

- If argument is a topic: proceed directly to sufficiency gate.

### Discovery path (no argument)

1. Scan `docs/plans/` for directories that already contain a `fact-find.md` (topics already in fact-finding).
2. Show the list and ask the user to select an entry or provide a new topic.

## Phase 2: Context Hydration

If a matching `fact-find.md` already exists at `docs/plans/<feature-slug>/fact-find.md`, read it and use existing findings and open questions as starting context. Otherwise, start fresh from the topic anchor.

## Phase 3: Sufficiency Gate

Do not start repository investigation until minimum intake is satisfied.

If insufficient, ask targeted questions only, each tied to a decision it unlocks.

## Phase 4: Classification

Compute this routing header first.

```yaml
Outcome: planning
Execution-Track: <code | business-artifact | mixed>
Deliverable-Family: <code-change | message | doc | spreadsheet | multi>
Deliverable-Channel: <none | email | whatsapp>
Deliverable-Subtype: <none | product-brief | marketing-asset>
Deliverable-Type: <canonical downstream type>
Startup-Deliverable-Alias: <none | startup-budget-envelope | startup-channel-plan | startup-demand-test-protocol | startup-supply-timeline | startup-weekly-kpcs-memo | website-first-build-backlog | website-upgrade-backlog | startup-loop-gap-fill>
Loop-Gap-Trigger: <none | block | bottleneck | feedback>
```

Use `routing/deliverable-routing.yaml` to map family/channel/subtype to canonical `Deliverable-Type` and execution-skill defaults.

Compatibility rule:
- Keep `Deliverable-Type` in canonical downstream format expected by `/lp-do-plan` and `/lp-do-build`.
- Execution skill IDs in routing/frontmatter are canonicalized without leading slash (for example `lp-do-build`, `draft-email`).
- Family/channel/subtype exist to reduce intake branching, not to break existing consumers.

Hard branches:
- If invocation includes `--website-first-build-backlog`, set `Startup-Deliverable-Alias: website-first-build-backlog` before routing.
- If `Startup-Deliverable-Alias: website-first-build-backlog`, route immediately to the website-first-build module and skip generic business/code checklists that do not apply.
- If `Startup-Deliverable-Alias: website-upgrade-backlog`, route immediately to the website-upgrade module and skip generic business/code checklists that do not apply.
- If `Startup-Deliverable-Alias: startup-loop-gap-fill`, route immediately to the loop-gap module. Set `Loop-Gap-Trigger` from the argument (block/bottleneck/feedback) or ask one targeted question. Output path and outcome (briefing vs planning) are determined by the module based on trigger type. Skip Phase 6 standard output paths — use trigger-specific paths defined in the module.

## Phase 5: Route to a Single Module

Load only the relevant module file(s):

- `code` track: `modules/outcome-a-code.md`
- `business-artifact` track: `modules/outcome-a-business.md`
- `mixed` track: load both code and business modules; merge evidence
- `website-first-build-backlog` alias: `modules/outcome-a-website-first-build.md`
- `website-upgrade-backlog` alias: `modules/outcome-a-website-upgrade.md`
- `startup-loop-gap-fill` alias: `modules/outcome-a-loop-gap.md` (output path determined by trigger type inside the module)

## Phase 6: Persist Artifact with Shared Templates

- Output path: `docs/plans/<feature-slug>/fact-find.md`
- Template: `docs/plans/_templates/fact-find-planning.md`
- Always include the routing header fields in frontmatter.
- **Canonical artifact name:** `fact-find.md` is the formal loop output artifact for this skill. Required sections and frontmatter fields are defined in `docs/business-os/startup-loop/loop-output-contracts.md` (Artifact 1). The path above is authoritative; do not store this artifact at any other location.

## Phase 6.5: Open Question Self-Resolve Gate

Before running the evidence gap review or critique, review every question currently marked as Open.

For each open question, apply this test:

> Can I answer this by reasoning about available evidence, effectiveness, efficiency, and the documented business requirements?

If yes: answer it. Move it to the Resolved section with a reasoned answer and the evidence or logic basis. Do not leave it open.

A question is genuinely Open (operator input required) only if it meets one of these:
- Requires knowledge the operator holds that is not documented anywhere (budget cap, undocumented strategic intent, personal preference)
- Requires a real-world fact the agent cannot determine from any accessible source (supplier availability, current sales data not in the repo, regulatory status)
- Is a strategic fork where the operator's preference is the deciding factor AND that preference is genuinely absent from all docs

Questions of the form "which approach is better?", "how should we handle X?", or "what's the right architecture here?" are almost never genuinely open — reason through the tradeoffs using documented constraints and recommend. If the recommendation has uncertainty, state the confidence and the assumption it rests on, but do not defer the decision to the operator.

The goal is a Resolved section that is long and an Open section that is short or empty.

## Phase 7: Mandatory Evidence Gap Review (Outcome A)

Before marking `Ready-for-planning`, run checklist:

- `docs/plans/_templates/evidence-gap-review-checklist.md`

Then write outcomes into the brief section:

- `## Evidence Gap Review`
- `### Gaps Addressed`
- `### Confidence Adjustments`
- `### Remaining Assumptions`

If unresolved blockers remain, classify the blocker type before setting status:

- **Recoverable** (missing evidence, awaiting user input, resolvable with more investigation): set `Status: Needs-input`, ask the minimal blocking questions, and stop.
- **Structural / infeasible** (architecture prevents this, risk is prohibitive, fundamental scope mismatch, or no viable path exists regardless of evidence gathered): set `Status: Infeasible`, write a `## Kill Rationale` section with a one-sentence explanation, and stop. Do not route to planning.

### Minimum Evidence Floor Gate

Before running critique, verify the brief is not empty in critical areas. A brief that passes critique scoring but has no substance in core sections will produce a low-quality plan. If any floor condition below fails, set `Status: Needs-input` immediately and list what is missing — do not run critique on an empty brief.

**Code track (required):**
- At least 1 entry point identified with a file path.
- At least 1 key module/file listed with a role description.
- Test landscape section present with at least a characterisation of coverage (even if gaps are noted).

**Business track (required):**
- At least 1 hypothesis stated in the Hypothesis & Validation Landscape section.
- `Delivery-Readiness` confidence input ≥ 60%. If below 60%, the owner, channel, or approval path is too uncertain to proceed — surface what is blocking it.

**Mixed:** apply both code and business checks above.

## Phase 7a: Automatic Critique

After persisting the fact-find artifact and completing the evidence gap review, automatically invoke `/lp-do-critique` on the written document.

### When to run

- Run after Phase 7 evidence gap review is complete and written into the artifact.

### Execution

1. Invoke `/lp-do-critique` with the path to the persisted fact-find: `docs/plans/<feature-slug>/fact-find.md`.
2. Use default mode (`full` scope, autofix enabled).
3. Let the critique skill apply its autofix phase directly to the fact-find document.

### Post-critique gate

- If critique verdict is `not credible`: evaluate whether the issues are recoverable.
  - Recoverable (fixable with more evidence or scope adjustment): set `Status: Needs-input`, surface the top Critical/Major issues to the user, and stop.
  - Structural (Critical/Major issues cannot be resolved without fundamentally changing the scope): set `Status: Infeasible`, write `## Kill Rationale`, and stop.
- If critique verdict is `partially credible` (score 3.0–3.5): set `Status: Needs-input`, surface the top-ranked findings to the user, and stop. A fact-find must reach a `credible` verdict (score ≥4.0) before auto-handoff to planning. Extend the investigation or decompose the complexity to address the findings, then re-run `/lp-do-critique`.
- If critique verdict is `credible` (score ≥4.0): record the critique round number and overall score in the completion message and proceed to completion.

### Idempotency

- The critique creates/updates `docs/plans/<feature-slug>/critique-history.md`. This is expected and does not require separate user approval.
- If the fact-find is re-run (scope restart), the critique will append a new round to the existing ledger.

## Completion Message

> Fact-find complete. Brief saved to `docs/plans/<feature-slug>/fact-find.md`. Status: `<Ready-for-planning | Needs-input | Infeasible>`. Primary execution skill: `<skill>`. Evidence gap review complete. Critique round <N>: verdict `<credible | partially credible | not credible>`, score <X.X>/5.0.

Status-dependent next action (execute immediately, do not wait for user):

- `Ready-for-planning` → automatically invoke `/lp-do-plan <feature-slug> --auto` to continue the pipeline.
- `Needs-input` → surface the specific blocking questions, then stop. Do not invoke `/lp-do-plan`.
- `Infeasible` → surface the kill rationale, then stop. Pipeline ends here.

## Quick Validation Gate

- [ ] Phase 0 queue check run — matching queued packet confirmed or direct-inject path taken
- [ ] Intake satisfied before repo audit
- [ ] Routing header computed and written to frontmatter
- [ ] Only relevant module(s) loaded
- [ ] Output generated from shared template file (not inline template)
- [ ] Outcome A evidence gap review completed and recorded
- [ ] Minimum evidence floor gate passed (or `Status: Needs-input` set if floor failed)
- [ ] Outcome A automatic critique run and verdict recorded (≥4.0 required for auto-handoff)
- [ ] Status classified as `Ready-for-planning`, `Needs-input`, or `Infeasible` (not left ambiguous)
- [ ] If `Ready-for-planning`: `/lp-do-plan <feature-slug> --auto` automatically invoked
