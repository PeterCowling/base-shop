---
name: lp-do-fact-find
description: Thin orchestrator for discovery, intake routing, and evidence-first fact-finding. Routes to specialized modules and emits planning or briefing artifacts with a shared schema.
---

# Fact Find Orchestrator

`/lp-do-fact-find` is the intake and routing layer. Keep this file thin.

This orchestrator does seven things:
1. Discovery and selection (card/topic)
2. Sufficiency gate
3. Classification (outcome, track, deliverable)
4. Module routing (load only one relevant module, plus mixed-track add-on when needed)
5. Artifact persistence using shared templates
6. Automatic critique (Outcome A only)
7. Optional Business OS sync via shared integration contract

Do not embed long templates, long checklists, or API payload blocks here.

## Global Invariants

### Operating mode

**FACT-FIND ONLY**

### Repo actions (allowed)

- Read/search files and docs.
- Run non-destructive commands (for example `rg`, targeted tests, targeted lint/typecheck) when needed for evidence.
- Inspect targeted git history.

### External side effects (guarded)

- Business OS API writes are allowed only through `../_shared/fact-find-bos-integration.md`.
- Use fail-closed handling for Business OS writes.

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

- Intent: `planning` or `briefing`
- Concrete area anchor (feature/component/system)
- At least one location anchor (path guess, route, endpoint, error/log, user flow)
- For planning outcome: provisional deliverable family

If any item is missing, ask only the minimum follow-up questions needed to unblock.

## Phase 1: Discovery and Selection

### IDEAS-03 promotion trigger (idea card input)

If the trigger for this fact-find is an IDEAS-03 promotion (operator ran `/lp-do-fact-find` with an idea card ID or file path from the IDEAS pipeline):

1. Load the idea card from `docs/business-os/strategy/<BIZ>/idea-cards/IDEA-<BIZ>-<seq>.md`.
2. Verify the card is promotion-ready: `Score ≥ 3`, `Status: scored`, `Evidence-quality: Medium or High`.
3. Pre-fill the fact-find frontmatter with the following mandatory fields from the idea card:
   - `idea_card_id: <ID>` — verbatim copy of the idea card `ID:` field (e.g., `IDEA-BRIK-002`).
   - `layer_a_inputs: [<Source-Domain>]` — source Layer A domain from the idea card.
   - `layer_a_source: <Source-Link>` — path to the Layer A artifact that surfaced this idea.
4. Seed the `Outcome` section with the idea card's `Hypothesis:` as the starting assumption to test or refine.
5. After `fact-find.md` is created, update the idea card (`Status: promoted`, `Promoted-to: <path>`) and add a row to `idea-portfolio.user.md`. See `docs/business-os/startup-loop/ideas/handoff-to-fact-find.md` for full field mapping and maintenance instructions.

If this fact-find is NOT triggered by an IDEAS-03 promotion (direct-inject cycle), include `direct-inject: true` and `direct-inject-rationale: <reason>` in frontmatter instead of `idea_card_id`. A direct-inject cycle does not satisfy the IDEAS-03 gate.

### Fast path (argument provided)

- If argument is an idea card ID (format `IDEA-<BIZ>-<seq>`): follow the IDEAS-03 promotion trigger path above.
- If argument is a BOS card ID: load card and latest `fact-find` stage doc.
- If argument is a topic: proceed directly to sufficiency gate.

### Discovery path (no argument)

1. Read `docs/business-os/_meta/discovery-index.json`.
2. Show a short table of:
   - Raw ideas
   - Cards ready to start
   - Cards already in fact-finding
3. Ask user to select an ID or provide a new topic.

If user selects a raw idea, direct them to `/idea-develop <ID>` first.

## Phase 2: Context Hydration (Card path)

When a card is selected:

1. Read card via agent API.
2. Read latest stage doc for stage `fact-find` (if present).
3. Pre-fill:
   - Topic/scope anchors from card title/description
   - `Business-Unit`, `Card-ID`, `Feature-Slug` from card metadata
   - Existing findings/questions from stage doc as starting context
4. Lane hint:
   - `Inbox` -> default to planning outcome; propose transition to `Fact-finding`
   - `Fact-finding` -> continue existing or restart scope (ask user)

## Phase 3: Sufficiency Gate

Do not start repository investigation until minimum intake is satisfied.

If insufficient, ask targeted questions only, each tied to a decision it unlocks.

## Phase 4: Classification

Compute this routing header first.

```yaml
Outcome: <planning | briefing>
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

- Planning + `code` track: `modules/outcome-a-code.md`
- Planning + `business-artifact` track: `modules/outcome-a-business.md`
- Planning + `mixed` track: load both code and business modules; merge evidence
- Planning + `website-first-build-backlog` alias: `modules/outcome-a-website-first-build.md`
- Planning + `website-upgrade-backlog` alias: `modules/outcome-a-website-upgrade.md`
- Any trigger + `startup-loop-gap-fill` alias: `modules/outcome-a-loop-gap.md` (outcome and output path determined by trigger type inside the module)
- Briefing outcome: `modules/outcome-b-briefing.md`

## Phase 6: Persist Artifact with Shared Templates

### Planning output (Outcome A)

- Output path: `docs/plans/<feature-slug>/fact-find.md`
- Template: `docs/plans/_templates/fact-find-planning.md`
- Always include the routing header fields in frontmatter.
- **Canonical artifact name:** `fact-find.md` is the formal loop output artifact for this skill. Required sections and frontmatter fields are defined in `docs/business-os/startup-loop/loop-output-contracts.md` (Artifact 1). The path above is authoritative; do not store this artifact at any other location.

### Briefing output (Outcome B)

- Preferred output path: `docs/briefs/<topic-slug>-briefing.md`
- Fallback if needed: `docs/plans/<topic-slug>-briefing.md`
- Template: `docs/briefs/_templates/briefing-note.md`

## Phase 7: Mandatory Evidence Gap Review (Outcome A)

Before marking `Ready-for-planning`, run checklist:

- `docs/plans/_templates/evidence-gap-review-checklist.md`

Then write outcomes into the brief section:

- `## Evidence Gap Review`
- `### Gaps Addressed`
- `### Confidence Adjustments`
- `### Remaining Assumptions`

If unresolved blockers remain, set `Status: Needs-input`, ask the minimal blocking questions, and stop.

## Phase 7a: Automatic Critique (Outcome A Only)

After persisting the fact-find artifact and completing the evidence gap review, automatically invoke `/lp-do-critique` on the written document.

### When to run

- Outcome A (planning) only. Skip for Outcome B (briefing).
- Run after Phase 7 evidence gap review is complete and written into the artifact.
- Run before Phase 8 BOS integration (critique may surface issues that affect card status).

### Execution

1. Invoke `/lp-do-critique` with the path to the persisted fact-find: `docs/plans/<feature-slug>/fact-find.md`.
2. Use default mode (`full` scope, autofix enabled).
3. Let the critique skill apply its autofix phase directly to the fact-find document.

### Post-critique gate

- If critique verdict is `not credible`: set `Status: Needs-input`, surface the top Critical/Major issues to the user, and stop. Do not proceed to BOS integration.
- If critique verdict is `partially credible` or `credible`: proceed to Phase 8. Record the critique round number and overall score in the completion message.

### Idempotency

- The critique creates/updates `docs/plans/<feature-slug>/critique-history.md`. This is expected and does not require separate user approval.
- If the fact-find is re-run (scope restart), the critique will append a new round to the existing ledger.

## Phase 8: Optional Business OS Integration (Default On)

When `Business-OS-Integration` is `on` and `Business-Unit` is present, execute shared procedure:

- `../_shared/fact-find-bos-integration.md`

Do not inline payload examples here. Use shared contracts for endpoint sequence, idempotency, concurrency, and conflict handling.

## Phase 9: Discovery Index Refresh Contract

When this run writes cards or stage docs, follow shared refresh contract:

- `../_shared/discovery-index-contract.md`

## Completion Messages

Planning outcome:

> Fact-find complete. Brief saved to `docs/plans/<feature-slug>/fact-find.md`. Status: `<Ready-for-planning | Needs-input>`. Primary execution skill: `<skill>`. Evidence gap review complete. Critique round <N>: verdict `<credible | partially credible | not credible>`, score <X.X>/5.0. Proceed to `/lp-do-plan` when blockers are resolved.

Briefing outcome:

> Briefing complete. Note saved to `<path>`. This documents current behavior and evidence pointers. No planning artifact was produced.

## Quick Validation Gate

- [ ] Intake satisfied before repo audit
- [ ] Routing header computed and written to frontmatter
- [ ] Only relevant module(s) loaded
- [ ] Output generated from shared template file (not inline template)
- [ ] Outcome A evidence gap review completed and recorded
- [ ] Outcome A automatic critique run and verdict recorded
- [ ] Business OS sync (if enabled) executed via shared contract
