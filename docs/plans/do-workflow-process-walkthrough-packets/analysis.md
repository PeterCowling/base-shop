---
Type: Analysis
Status: Ready-for-planning
Domain: Repo / Agents
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: do-workflow-process-walkthrough-packets
Execution-Track: mixed
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-fact-find, lp-do-analysis, lp-do-plan, lp-do-build
Related-Fact-Find: docs/plans/do-workflow-process-walkthrough-packets/fact-find.md
Related-Plan: docs/plans/do-workflow-process-walkthrough-packets/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# DO Workflow Process Walkthrough Packets Analysis

## Decision Frame

### Summary
The walkthrough gate is now required in fact-find, analysis, and plan, but those sections still live only in markdown. That weakens the existing packet-first progressive-disclosure contract because downstream stages must often reopen full upstream artifacts for the very process rows the new gate was meant to make explicit. The decision is how to restore deterministic packet-first handoff without overbuilding a second artifact system.

### Goals
- Keep the walkthrough gate mandatory for process-changing work
- Lift the new process rows into deterministic packet fields
- Add a real deterministic validator for analysis so `## End-State Operating Model` is enforced by tooling, not only by skill prose

### Non-goals
- Replacing canonical markdown artifacts
- Building a new runtime handoff/session system
- Measuring every markdown reopen cause in this increment

### Constraints & Assumptions
- Constraints:
  - The packet fields must stay compact and source-derived
  - Packet-first must remain packet-first, not packet-only
  - Analysis validation must align with the sections already required by the skill/template
- Assumptions:
  - The table structure in the new process sections is stable enough to extract deterministically
  - `packages/skill-runner` is still the right home for the validator and packet logic
  - A small workflow-doc update is enough to surface the new validator path

## Inherited Outcome Contract

- **Why:** The walkthrough gate fixed a planning-quality blind spot, but it made the markdown artifacts larger. If the handoff packets keep omitting those new process sections, downstream stages will reopen full upstream markdown and lose much of the deterministic token-efficiency gain.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** DO workflow packets carry compact walkthrough/process rows for fact-find, analysis, and plan, and analysis has a deterministic validator so packet-first progressive disclosure remains real after the walkthrough gate.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/do-workflow-process-walkthrough-packets/fact-find.md`
- Key findings used:
  - The walkthrough sections already use table-shaped templates
  - The packet generator already has the parsing primitives needed to extract those rows
  - Fact-find and plan have deterministic section validators; analysis does not
  - The workflow guide and analysis skill still expose no standalone `validate-analysis.sh`

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Determinism | Process rows must be extracted from source artifacts, not resummarized | Critical |
| Progressive disclosure quality | Downstream stages should rely on packets first for process-changing work | Critical |
| Contract clarity | One packet contract should own the new fields | High |
| Validation symmetry | Analysis should not remain the only DO planning-stage artifact without a standalone validator | High |
| Rollout safety | Existing markdown fallback behavior must remain intact | High |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A | Keep walkthrough sections in markdown only and rely on critique + agent discipline | Lowest implementation cost | Packet-first remains incomplete for process-changing work; analysis validator gap stays open | Workflow claims drift from real behavior | No |
| B | Extend packets with compact process rows and add a deterministic analysis validator in the same increment | Restores packet-first handoff for the new sections and closes the analysis gating gap together | Touches contract, generator, validator, and workflow docs | Small risk of packet-field bloat if extraction is not tightly bounded | Yes |
| C | Measure reopen behavior in telemetry first, then revisit packet/validator changes later | Better measurement before change | Leaves the current workflow inconsistency in place and does not solve the immediate gap | Token-efficiency regression continues meanwhile | No |

## Engineering Coverage Comparison

| Coverage Area | Option A (markdown-only walkthroughs) | Option B (packet rows + analysis validator) | Chosen implication |
|---|---|---|---|
| UI / visual | N/A | N/A | N/A |
| UX / states | Downstream stages still reopen full markdown for process-changing work | Packet-first stays truthful because the new process rows are carried in packets | Option B |
| Security / privacy | N/A | Source-derived packet rows only | Option B keeps data repo-local |
| Logging / observability / audit | No new proof artifacts beyond prose | Generated packets and validator outputs provide deterministic evidence | Option B |
| Testing / validation | Analysis remains the only planning-stage artifact without a standalone validator | New validator plus existing engineering-coverage gate make analysis fail-closed on missing sections | Option B |
| Data / contracts | Packet contract stays outdated relative to the new walkthrough gate | Contract and generator stay aligned with the actual workflow sections | Option B |
| Performance / reliability | Walkthrough gate increases markdown size without matching packet lift | Process rows stay bounded and reduce needless markdown reopening | Option B |
| Rollout / rollback | No new change, but current mismatch persists | Additive packet/validator rollout with markdown fallback preserved | Option B |

## Chosen Approach

- **Recommendation:** Option B
- **Why this wins:** It is the smallest coherent change that keeps the walkthrough gate and the packet-first contract aligned. The new sections are already deterministic tables, so lifting them into packet fields is cheap and robust. Adding `validate-analysis.sh` in the same increment closes the only remaining planning-stage validator gap and keeps the workflow symmetric.
- **What it depends on:** A packet contract update, generator extraction changes, a new analysis validator + wrappers, and small workflow-doc/skill updates.

### Rejected Approaches

- Option A was rejected because it turns packet-first into a soft preference whenever process topology matters.
- Option C was rejected because it would add more measurement while knowingly leaving a real workflow/documentation mismatch in place.

### Open Questions (Operator Input Required)

None.

## End-State Operating Model

| Area | Current state | Trigger | Delivered step-by-step end state | What remains unchanged | Risks / seams to carry into planning |
|---|---|---|---|---|---|
| AREA-01: fact-find -> analysis process handoff | `fact-find.packet.json` omits current-process rows | `lp-do-analysis` starts on a process-changing feature | Analysis loads `fact-find.packet.json`, reads compact trigger/end-condition/process-area rows there first, and reopens `fact-find.md` only if evidence detail is insufficient | Fact-find markdown remains canonical | Row extraction must stay bounded to the table/named fields |
| AREA-02: analysis -> plan operating-model handoff | `analysis.packet.json` omits end-state operating-model rows | `lp-do-plan` starts | Plan loads `analysis.packet.json`, reads compact end-state rows first, and reopens `analysis.md` only when path-specific rationale needs verification | Analysis markdown remains canonical | Some option nuance still lives only in markdown |
| AREA-03: plan -> build delivered-process handoff | `plan.packet.json` omits delivered-process rows | `lp-do-build` starts | Build loads `plan.packet.json`, sees task briefs plus compact delivered-process rows, then escalates to the specific task block in `plan.md` for execution | Build still reads the full task block before editing/executing | Packet-first must not be misread as packet-only |
| AREA-04: analysis validation | Analysis only runs engineering-coverage validation | `lp-do-analysis` is ready to persist | Analysis runs `validate-analysis.sh` first, then `validate-engineering-coverage.sh` when the track is `code or mixed`, then emits `analysis.packet.json` | Engineering-coverage validation remains required for code/mixed work | Historical analyses are not auto-revalidated until touched |

## Planning Handoff

- Planning focus:
  - Extend packet contract + generator with compact walkthrough/process-row fields for all three upstream stages
  - Add deterministic analysis validator with the same pattern as fact-find/plan
  - Update the analysis skill and feature workflow guide to require the new validator
  - Persist packet sidecars and validation evidence for this slug
- Validation implications:
  - `scripts/validate-fact-find.sh` must pass for the new fact-find
  - New `scripts/validate-analysis.sh` must pass for the new analysis
  - `scripts/validate-plan.sh` and `scripts/validate-engineering-coverage.sh` must pass for the new plan
  - `scripts/generate-stage-handoff-packet.sh` must emit all three packet sidecars with the new process-row fields present
- Sequencing constraints:
  - Contract + generator before packet generation proof
  - Analysis validator before updating the analysis skill guidance
  - New slug packets and build record only after validators pass
- Risks to carry into planning:
  - Packet rows must stay table-derived rather than copying whole section prose
  - Workflow docs must stay aligned with the actual validator names and order

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| Process rows become too verbose in packets | Low | Medium | Exact extraction shape is an implementation detail | Keep fields table-based and bounded |
| Analysis validator checks drift from template/skill language | Medium | Medium | Needs concrete implementation choices | Reuse exact section names already required by the skill/template |
| Packet-first claims get overstated | Low | Medium | Messaging/documentation concern, not option selection | Preserve explicit markdown fallback wording |

## Planning Readiness

- Status: Go
- Rationale: One approach clearly dominates. The new process sections are already structured for deterministic extraction, and the missing analysis validator is a cleanly bounded companion fix rather than a separate project.
