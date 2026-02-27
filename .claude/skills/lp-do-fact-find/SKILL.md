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

## Phase 0: Queue Check Gate

Load and follow: `../_shared/queue-check-gate.md` (fact-find mode).

## Phase 1: Discovery and Selection

- **Fast path** (argument provided): If argument is a topic, proceed directly to sufficiency gate.
- **Discovery path** (no argument): Scan `docs/plans/` for directories with `fact-find.md`; show list; ask user to select or provide new topic.

## Phase 2: Context Hydration

If a matching `fact-find.md` already exists at `docs/plans/<feature-slug>/fact-find.md`, read it and use existing findings and open questions as starting context. Otherwise, start fresh from the topic anchor.

## Phase 3: Sufficiency Gate

Do not start repository investigation until minimum intake is satisfied. If insufficient, ask targeted questions only, each tied to a decision it unlocks.

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

Use `routing/deliverable-routing.yaml` to map family/channel/subtype to canonical `Deliverable-Type`. Keep `Deliverable-Type` in canonical downstream format expected by `/lp-do-plan` and `/lp-do-build`. Execution skill IDs are canonicalized without leading slash (e.g., `lp-do-build`).

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

## Phase 5.5: Scope Simulation

Load and follow: `../_shared/simulation-protocol.md`

Run a scope simulation of the investigation completed in Phase 5. This is not a code execution trace — it is a scope-gap check. Walk through each evidence area identified in the investigation and apply the scope simulation checklist defined in the shared protocol (5 categories: concrete investigation path, investigation ordering, system boundary coverage, circular investigation dependency, missing domain coverage).

Write a `## Simulation Trace` section into the fact-find draft (before persisting in Phase 6) with one row per scope area:

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| <evidence domain or entry point> | Yes / Partial / No | None — or: [Category] [Severity]: description | Yes / No |

**Hard gate (Critical findings):** If any Critical scope gap is found, do not set `Status: Ready-for-planning` or proceed to Phase 6 until the issue is resolved or a valid `Simulation-Critical-Waiver` block is written (see shared protocol for waiver format and requirements).

**Advisory (Major / Moderate / Minor findings):** Write into the Simulation Trace table and proceed. These are visible to the Phase 7a critique loop and do not block fact-find persistence.

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

## Phase 7a: Critique Loop (1–3 rounds, mandatory)

After persisting the fact-find artifact and completing the evidence gap review, run the critique loop in **fact-find mode**.

Load and follow: `../_shared/critique-loop-protocol.md`

## Completion Message

> Fact-find complete. Brief saved to `docs/plans/<feature-slug>/fact-find.md`. Status: `<Ready-for-planning | Needs-input | Infeasible>`. Primary execution skill: `<skill>`. Evidence gap review complete. Critique: `<N>` round(s), final verdict `<credible | partially credible | not credible>`, score `<X.X>`/5.0.

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
- [ ] Phase 5.5 Scope Simulation run — scope trace table present in fact-find draft; Critical scope gaps resolved or waived before Phase 6 persist
- [ ] Outcome A evidence gap review completed and recorded
- [ ] Minimum evidence floor gate passed (or `Status: Needs-input` set if floor failed)
- [ ] lp-do-factcheck run if fact-find contains codebase claims (file paths, function names, coverage assertions)
- [ ] Critique loop run (1–3 rounds): round count, final verdict, and score recorded (≥4.0 required for auto-handoff)
- [ ] Status classified as `Ready-for-planning`, `Needs-input`, or `Infeasible` (not left ambiguous)
- [ ] If `Ready-for-planning`: `/lp-do-plan <feature-slug> --auto` automatically invoked
