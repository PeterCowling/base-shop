---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Product
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-process-naming-ux
Execution-Track: business-artifact
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan
Related-Plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Startup Loop Process Naming UX — Fact-Find Brief

## Scope
### Summary
Audit startup-loop process naming from an operator UX perspective, focusing on instant comprehension: where am I, what is this step for, and what happens next. The current system is operationally correct for machine orchestration, but stage IDs and internal terminology still leak into user-facing surfaces.

### Goals
- Identify where process naming is not immediately understandable to a non-technical operator.
- Preserve runtime-stable stage IDs while improving operator-facing clarity.
- Define a canonical naming dictionary schema to prevent label drift.
- Define non-breaking contract changes for run packets, submit commands, and docs.
- Produce planning-ready task seeds with lint/test enforcement.

### Non-goals
- Renaming canonical stage IDs (`S0..S10`, `S1B`, `S2A`, `S6B`, etc.).
- Changing stage order, gate logic, or execution semantics.
- Rewriting historical artifacts retroactively.

### Constraints & Assumptions
- Constraints:
  - Stage IDs are runtime contracts and must remain stable.
  - Current command contract still uses `current_stage` and `/submit --stage <S#>`.
  - UX naming changes must be additive and fail-closed.
- Assumptions:
  - Operator UX should be label-first, ID-secondary.
  - Canonical dictionary + generated views is required to avoid new drift.

## Evidence Audit (Current State)
### Entry Points
- `.claude/skills/startup-loop/SKILL.md` - run packet and command contract.
- `docs/business-os/startup-loop/loop-spec.yaml` - canonical stage IDs and names.
- `docs/business-os/startup-loop-workflow.user.md` - operator workflow copy.
- `docs/business-os/workflow-prompts/README.user.md` - prompt index stage naming.

### Key Modules / Files
- `.claude/skills/startup-loop/SKILL.md:49` - run packet requires `current_stage: <S#>`.
- `.claude/skills/startup-loop/SKILL.md:115` - `/submit` requires `--stage <S#>`.
- `.claude/skills/startup-loop/SKILL.md:64` - stage list is ID-first (`S0..S10`, `S1B`, `S2A`, `S6B`).
- `docs/business-os/startup-loop-workflow.user.md:122` - stage status table uses code-first labels.
- `docs/business-os/startup-loop-workflow.user.md:61` - 8-step diagram includes stage IDs in each node.
- `docs/business-os/workflow-prompts/README.user.md:23` - prompt index is code-led.

### Patterns & Conventions Observed
- Operator surfaces are code-forward, not meaning-forward.
  - Evidence: `.claude/skills/startup-loop/SKILL.md:64`, `docs/business-os/workflow-prompts/README.user.md:23`
- Letter suffix semantics (`A/B`) are implementation-facing and opaque to new users.
  - Evidence: `loop-spec.yaml` entries for `S1B`, `S2A`, `S2B`, `S5A`, `S5B`, `S9B`
- Composite stage concepts are underspecified in operator language (example: `S6B` = channels + SEO + outreach).
  - Evidence: `.claude/skills/startup-loop/SKILL.md:74`
- There is no canonical naming dictionary consumed by all operator surfaces.
  - Evidence: docs and skill files duplicate labels manually.

### Data & Contracts
- Runtime contract is machine-safe but UX-thin:
  - Required `current_stage` ID exists.
  - No required `current_stage_display` / `current_stage_label` fields.
- Submit contract is ID-addressed only (`--stage <S#>`).
- Current evidence is documented by line references but not yet enforced through schema/lint generation paths.

### Dependency & Impact Map
- Upstream dependencies:
  - `loop-spec.yaml` (runtime authority)
  - `/startup-loop` wrapper contract
- Downstream dependents:
  - operator workflow doc
  - prompt index
  - run-packet display surfaces
- Likely blast radius:
  - Low for runtime behavior if IDs stay unchanged.
  - Medium for docs/command UX and contract tests.

## UX Findings (Naming)
1. `Critical` Stage IDs are primary user-facing labels in run/submit flows, forcing users to decode internal notation.
2. `High` `A/B` suffixes are taxonomy artifacts, not user intent labels.
3. `High` Mixed abstraction levels (`Offer design`, `BOS sync`, `QA gates`) increase cognitive switching.
4. `High` “Operator label” as free text is underspecified and will drift without schema + generation.
5. `Medium` Free-form `--stage-label` is unsafe (ambiguity, localization drift, brittle automation).
6. `Medium` Composite stages need hierarchy/microsteps, not just renamed top-level labels.

## Canonical Stage Dictionary Contract (Required)
### Minimum Schema
| Field | Required | Purpose |
|---|---|---|
| `id` | yes | Canonical stage ID (e.g., `S6B`) |
| `name_machine` | yes | Current internal stage name |
| `label_operator_short` | yes | Label for chips/tables |
| `label_operator_long` | yes | Label for headers/full context |
| `outcome_operator` | yes | “Done means” statement in operator language |
| `operator_next_prompt` | optional | One-sentence “Next you will…” cue |
| `aliases` | yes | Stable slug aliases (machine-parseable) |
| `operator_microsteps` | optional | Checklist for composite stages |
| `display_order` | yes | Canonical operator rendering order |

### Rules
- IDs remain stable and authoritative.
- Aliases are deterministic slugs (no free text, unique globally).
- Operator docs/CLI help/prompt index are generated from this dictionary (no manual duplication).
- Label changes are versioned through this dictionary only.

## Operator Hierarchy Model (A/B + Composite Stages)
- Keep runtime stages unchanged.
- Add operator hierarchy metadata:
  - `macro_stage` (e.g., “Build Baseline Inputs”)
  - `child_step` (e.g., `S2A`, `S2B`)
- For composite stages (example `S6B`), render microsteps in operator UX:
  - Select channels
  - Set SEO focus
  - Prepare outreach assets

## Provisional Stage Label Map (Canonical Runtime Order)
| Stage ID | Current machine name | Operator label (short) | Operator label (long) | Alias |
|---|---|---|---|---|
| S0 | Intake | Capture Context | Capture Business Context | `capture-context` |
| S1 | Readiness | Check Readiness | Check Launch Readiness | `check-readiness` |
| S1B | Measure | Set Up Tracking | Set Up Tracking (Pre-website) | `setup-tracking-prewebsite` |
| S2A | Results | Load Baseline | Load Existing Performance Baseline | `load-existing-baseline` |
| S2 | Market intelligence | Research Market | Research Market and Competitors | `research-market` |
| S2B | Offer design | Define Offer | Define Offer and Positioning | `define-offer` |
| S3 | Forecast | Model Outcomes | Model 90-Day Outcomes | `model-outcomes` |
| S6B | Channel strategy + GTM | Choose Channels | Choose Launch Channels | `choose-launch-channels` |
| S4 | Baseline merge | Consolidate Baseline | Consolidate Decision Baseline | `consolidate-baseline` |
| S5A | Prioritize | Rank Bets | Rank Next Bets | `rank-next-bets` |
| S5B | BOS sync | Commit Backlog | Commit Bets to Execution Backlog | `commit-execution-backlog` |
| S6 | Site-upgrade synthesis | Define Site Backlog | Define Site Improvement Backlog | `define-site-backlog` |
| S7 | Fact-find | Investigate Bet | Investigate Selected Bet | `investigate-bet` |
| S8 | Plan | Create Plan | Create Execution Plan | `create-execution-plan` |
| S9 | Build | Implement | Implement and Ship | `implement-and-ship` |
| S9B | QA gates | Run Launch Checks | Run Launch Readiness Checks | `run-launch-checks` |
| S10 | Weekly readout + experiments | Weekly Decision Loop | Weekly Decision and Experiment Loop | `weekly-decision-loop` |

## Operator Display Rules (Recommended)
- Default operator mode:
  - `Label-first + ID-secondary` (e.g., `Choose Launch Channels (S6B)`).
- Detail/log mode:
  - `ID-first + label-secondary` (e.g., `S6B — Choose Launch Channels`).
- Outside code blocks and raw logs, never show raw stage IDs without adjacent operator label.

## Runtime Contract Additions (Non-breaking)
- Keep required:
  - `current_stage: "S6B"`
- Add derived fields (generated):
  - `current_stage_display: "Choose Launch Channels (S6B)"`
  - `current_stage_label: "Choose Launch Channels"`
  - `next_stage_display`
  - `next_stage_label`

## Submit Command Addressing (Fail-Closed)
- Canonical:
  - `--stage S6B`
- Operator-friendly deterministic alias:
  - `--stage-alias choose-launch-channels`
- Do not rely on free-form label matching.
- If `--stage-label` is retained for compatibility:
  - exact-match only against canonical dictionary labels
  - fail closed with suggestions
  - no fuzzy matching

## Label Quality Gate (Required)
Each stage label must pass:
1. Verb-object or clear noun-phrase grammar.
2. Unique/non-overlapping meaning with other stages.
3. Explicit operator outcome (“done means”).
4. `label_operator_short` target length <= 28 chars.
5. No internal subsystem jargon unless unavoidable.

## Questions
### Resolved
- Q: Is naming friction real and structural?
  - A: Yes. Operator surfaces are still primarily ID-driven and taxonomy-heavy.
  - Evidence: `.claude/skills/startup-loop/SKILL.md:49`, `.claude/skills/startup-loop/SKILL.md:64`, `docs/business-os/workflow-prompts/README.user.md:23`.

### Open (User Input Needed)
- Q: Keep `--stage-label` (exact-match only) as compatibility sugar, or remove and standardize on `--stage` + `--stage-alias` only?
  - Why it matters: determines long-term command UX and parser complexity.
  - Decision impacted: startup-loop CLI contract and docs examples.
  - Decision owner: Pete.
  - Default assumption + risk: standardize on `--stage` + `--stage-alias`; keep `--stage-label` only as strict compatibility path if needed.

## Confidence Inputs
- Implementation: 90%
  - Evidence basis: non-breaking additive contract and doc changes.
  - Raise to >=90: already met.
- Approach: 88%
  - Evidence basis: dictionary + generation + lint addresses root drift problem.
  - Raise to >=90: finalize command compatibility decision for `--stage-label`.
- Impact: 89%
  - Evidence basis: directly reduces cognitive decoding burden.
  - Raise to >=90: run operator comprehension timing check on real packets.
- Delivery-Readiness: 86%
  - Evidence basis: affected files and contract surfaces are clear.
  - Raise to >=90: finalize schema location and generation ownership.
- Testability: 85%
  - Evidence basis: straightforward schema, snapshot, and lint checks can enforce compliance.
  - Raise to >=90: wire tests to CI with failing gates on drift.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Label drift across docs/skills | Medium | Medium | Single canonical dictionary + generated snippets + lint |
| Partial rollout leaves mixed naming | High | Medium | Migration checklist + “no raw IDs” lint gate |
| Alias collision/ambiguity | Low | High | Unique alias validation in schema tests |
| Composite stage still unclear | Medium | Medium | Require `operator_microsteps` rendering for composite stages |

## Suggested Task Seeds (Non-binding)
1. Create canonical stage dictionary file with schema validation (`id`, machine name, operator labels, outcomes, aliases, microsteps, order).
2. Add generator that emits operator stage table snippets for:
   - startup-loop workflow doc
   - prompt index stage labels
   - startup-loop skill command help examples
3. Extend `loop-spec.yaml` metadata to include operator label references (without changing stage IDs).
4. Extend run packet contract with `*_display` and `*_label` derived fields.
5. Add `--stage-alias` command path with fail-closed alias resolution.
6. Update operator docs to label-first rendering and ID-secondary display rule.
7. Add lint rule: raw `S\d+[A-Z]?` tokens in operator docs require adjacent label (except code blocks).
8. Add contract tests:
   - every stage has required operator fields
   - aliases unique
   - generated snippets match committed outputs
   - run packet includes derived label/display fields
9. Add composite stage UX support using `operator_microsteps` in operator surfaces (starting with S6B).

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`
- Deliverable acceptance package:
  - canonical stage dictionary + generator + updated operator docs + run packet/alias contract updates + lint/tests.
- Post-delivery measurement plan:
  - Operator comprehension test: identify stage and next action in <=10s across 5 sample run packets.
  - Drift check: zero lint violations for raw-ID operator copy.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - Decision on strict compatibility behavior for `--stage-label`.
- Recommended next step:
  - `/lp-do-plan` to sequence a non-breaking naming UX rollout with schema + generator + lint/test guardrails.
