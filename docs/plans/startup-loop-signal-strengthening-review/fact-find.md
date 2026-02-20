---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infra
Workstream: Operations
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: startup-loop-signal-strengthening-review
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-fact-find, meta-reflect
Related-Plan: docs/plans/startup-loop-signal-strengthening-review/plan.md
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop Signal Strengthening Review — Fact-Find Brief

## Terminology

Three artifact types are introduced. Use these terms precisely throughout:

| Term | Definition |
|---|---|
| **Signal Review** | The weekly audit artifact emitted by `/lp-signal-review`. One per run. Path: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md` |
| **Finding Brief** | A stub emitted inside the Signal Review for each top-ranked finding (frontmatter + 3-bullet summary). Not a full fact-find. Operator promotes these manually. |
| **Finding Fact-find** | A full `/lp-do-fact-find` artifact produced when an operator promotes a Finding Brief. Path: `docs/plans/<finding-slug>/fact-find.md` |

---

## Scope

### Summary

The startup loop operates almost exclusively via AI agents. In such workflows, output quality is governed not just by individual stage quality, but by structural properties of the workflow itself — how stages pass information, how evidence quality is enforced, how decisions are gated, and how outcomes feed back into future runs.

A set of ten signal-strengthening principles was identified for AI-driven workflows:

1. **Gather/synthesize separation** — evidence gathering and conclusion-drawing must be distinct phases
2. **Explicit confidence calibration** — scores must reflect evidence, not narrative coherence
3. **Adversarial review** — a critic agent should challenge key decisions before lock-in
4. **Ground truth anchoring** — real data (not plausible inference) must be required at each stage gate
5. **Operator/executor separation** — the control plane (what to run) must stay architecturally separate from execution
6. **Scope containment** — each task must have one deliverable and clear acceptance criteria
7. **Context hygiene** — agents receive curated, relevant context — not maximal history
8. **Feedback loop closure** — outcomes are measured and fed back into future run priors
9. **Checkpointed restartability** — each stage emits a persistent artifact; recovery is cheap
10. **Human judgment gates** — ICP commitment, pricing, channel commitment require human sign-off, not AI consensus

This feature adds a **weekly Signal Strengthening Review** as a recurring step within the S10 (weekly readout) stage of the startup loop. The review audits the current run against the ten principles, identifies the weakest signal areas, and emits a Signal Review artifact containing ranked Finding Briefs. Operators promote Finding Briefs to full Finding Fact-finds, which flow into `/lp-do-plan` via the normal pathway.

### Goals

- Add a `lp-signal-review` skill that audits a startup loop run against the ten signal principles
- Integrate the skill into the S10 weekly readout stage (alongside the existing weekly-kpcs prompt handoff)
- Produce per-run Signal Review artifacts with ranked Finding Briefs (cap: 3 per run)
- Operators promote Finding Briefs → Finding Fact-finds manually; no auto-spawning in v1
- Make the review self-referential from run 4 onward: track whether prior Finding Briefs were resolved

### Non-goals

- Auto-spawning `/lp-do-fact-find` calls (v1 emits Finding Briefs only; operator promotes)
- Blocking advance from S10 (advisory only in v1; soft warning gate deferred to v1.1)
- Modifying loop-spec.yaml schema or bumping spec_version (v1 = cmd-advance dispatch only)
- Cross-business aggregation (per-run, per-business review only)
- Replacing `/lp-experiment` (S10 multi-skill dispatch; both coexist)

### Constraints & Assumptions

- Constraints:
  - Must follow the thin-orchestrator pattern: `SKILL.md` + `modules/` directory
  - Signal Review artifact uses a standard markdown structure (defined in Contract & I/O section)
  - Finding Briefs must be promotable to the `docs/plans/_templates/fact-find-planning.md` schema with no extra fields
  - Skill must be invocable standalone (`/lp-signal-review`) and from within S10 dispatch
  - **v1 integration = cmd-advance dispatch only; loop-spec.yaml is not modified**
- Assumptions:
  - S10 is the correct integration point; it already handles weekly readout; `/lp-experiment` does not yet exist as a skill file (confirmed — see Evidence Excerpts)
  - The ten principles are the stable v1 checklist, versioned in `.claude/skills/_shared/signal-principles.md`; updates require a plan task, not ad-hoc edits
  - S10 multi-skill dispatch is feasible by extending `cmd-advance.md` without loop-spec changes — inferred from the GATE-BD-08 precedent for S10 soft behaviour

---

## Skill Contract & I/O Interface

This section is the normative definition. `/lp-do-plan` must not invent anything here.

### Inputs

| Parameter | Required | Type | Notes |
|---|---|---|---|
| `biz_id` | Required | string | Business identifier (e.g., `BRIK`, `PET`). Used to locate run artifacts. |
| `run_root` | Required | path | Root path for this business's strategy docs (e.g., `docs/business-os/strategy/BRIK/`). All stage artifacts resolved relative to this. |
| `as_of_date` | Optional | YYYY-MM-DD | Defaults to today. Used for artifact naming and ISO week. |
| `max_findings` | Optional | integer | Default: 3. Hard cap on Finding Briefs emitted per run. |
| `self_audit_mode` | Optional | enum | `off` (runs 1–3), `track-only` (run 4+, default). `enforce` is deferred to v2. |

### How the skill identifies "the run"

The skill reads all stage artifacts present under `run_root` for stages S1–S9B. Stage artifacts are expected at the paths established by each stage's `required_output_path` field in the run packet. Missing artifacts are themselves a finding candidate (maps to principle 9: Checkpointed Restartability).

### Outputs

| Artifact | Path | Notes |
|---|---|---|
| Signal Review | `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md` | One per run. HHMM timestamp prevents same-day collision on retries. ISO week provides weekly grouping. |
| Finding Briefs | Embedded sections within Signal Review | One per top-ranked finding (≤ max_findings). Stub format: frontmatter + 3 bullets. Not standalone files. |
| Finding Fact-finds | `docs/plans/<finding-slug>/fact-find.md` | **Operator-promoted only.** The skill does not auto-create these. |

### Signal Review artifact: required sections

```
---
Type: Signal-Review
Business: <BIZ>
Run-date: <YYYYMMDD>
ISO-week: W<NN>
Self-audit-mode: <off|track-only>
Principles-version: <version from signal-principles.md>
---

## Run Summary
## Principle Scores (all ten, with evidence basis)
## Top Findings (ranked, ≤ max_findings)
### Finding N: <principle name>
  - Fingerprint: <fingerprint>
  - Severity: <1-5>
  - Support: <1-5>
  - Stage(s) affected: <list>
  - Failure indicator: <one sentence>
  - Evidence pointer: <path or "missing artifact">
  - Promotion stub: [frontmatter block ready to paste into docs/plans/<slug>/fact-find.md]
## Unresolved Prior Findings (self_audit_mode: track-only+)
## Skipped Findings (below threshold — logged, not escalated)
```

### Exit conditions

| Condition | Description |
|---|---|
| `success-with-findings` | Signal Review emitted; 1–3 Finding Briefs present; all scored above threshold |
| `success-no-findings` | Signal Review emitted; all ten principles scored above threshold; no findings needed |
| `partial-success` | Signal Review emitted; one or more stage artifacts were missing; audit degraded for those stages; missing artifacts logged as findings against principle 9 |
| `fail-closed` | Could not locate `run_root` or no stage artifacts found; no Signal Review emitted; operator must provide valid inputs |

---

## Scoring Rubric

Every principle is scored on two axes per run. Scoring is performed by the skill's audit-phase module.

### Axes

| Axis | Scale | Definition |
|---|---|---|
| **Severity** | 1–5 | How bad it is if this principle is violated in this run. 1 = minor, 5 = undermines run validity. |
| **Support** | 1–5 | How strong the evidence is that the principle is being honoured (or violated). Aligned to the evidence ladder in `.claude/skills/_shared/evidence-ladder.md`. 1 = no evidence / pure inference, 5 = direct artifact confirmation. |

### Finding eligibility threshold

A principle qualifies as a finding (eligible for Finding Brief) when:
- **Strong finding**: Severity ≥ 4 AND Support ≥ 3 (the violation is significant and the evidence is credible)
- **High-risk gap**: Severity = 5 AND Support ≥ 2 (critical principle with at least weak evidence of violation; tagged `needs-evidence`)

All other scores are logged in the "Skipped Findings" section of the Signal Review — visible to operator but not escalated.

### Missing evidence rule

If a required stage artifact is missing (cannot be read), the audit for that stage degrades to Support = 1 for all principles that depend on it. The missing artifact is itself logged as a Severity 4 / Support 5 finding against principle 9 (Checkpointed Restartability).

### Principle 10 special handling (Human Judgment Gates)

Principle 10 audits cannot be speculative. A violation can only be raised if a concrete marker is absent. Markers that count as evidence of human sign-off:
- Frontmatter field `Human-approved: true` in the relevant stage artifact (S2B offer artifact, S5A prioritise artifact, S6B channel artifact)
- An explicit sign-off line in the weekly readout (`## Human Decisions This Week` section with at least one named decision)
- A DECISION task in the plan with `Status: completed` and a named decision-maker

If none of these markers are present AND the stage artifact exists, log Severity 3 / Support 3 (moderate finding). If the stage artifact is missing entirely, defer to principle 9 (missing artifact).

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/startup-loop/SKILL.md:L42-L56` — stage table; S10 defined as "Weekly readout + experiments", skill: `/lp-experiment`; weekly prompt: `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md`
- `.claude/skills/startup-loop/modules/cmd-advance.md` — defines GATE-BD-00 through GATE-S6B-ACT-01 and BOS sync contract per stage; S10 has GATE-BD-08 (Brand Dossier freshness, soft warning)
- `docs/business-os/startup-loop/loop-spec.yaml` — canonical stage graph, spec_version 1.5.0; S10 is the terminal weekly stage

### Key Modules / Files

- `.claude/skills/startup-loop/SKILL.md` — needs S10 dispatch addition for `/lp-signal-review` alongside weekly-kpcs prompt
- `.claude/skills/startup-loop/modules/cmd-advance.md` — S10 gate section; v1 adds dispatch only; v1.1 adds GATE-S10-SIGNAL-01 soft warning
- `.claude/skills/lp-do-fact-find/SKILL.md` — Finding Fact-find output format; Finding Brief promotion stubs must be compatible
- `docs/plans/_templates/fact-find-planning.md` — promotion target schema; Finding Brief frontmatter stub must be a valid partial of this
- `.claude/skills/_shared/` — new `signal-principles.md` file lives here; `evidence-ladder.md` is referenced by scoring rubric

### Patterns & Conventions Observed

- Skill files follow a consistent pattern: `SKILL.md` as thin orchestrator + `modules/` for command-specific behaviour — evidence: `.claude/skills/startup-loop/`, `.claude/skills/lp-do-fact-find/`
- Shared cross-skill contracts live in `.claude/skills/_shared/` — evidence: `confidence-scoring-rules.md`, `evidence-ladder.md`, `fail-first-biz.md`
- Stage gates are defined in `cmd-advance.md` with GATE-XX-YY identifiers; some are blocking (GATE-BD-00), some are soft warnings (GATE-BD-08) — evidence: `cmd-advance.md`
- Parallel skill dispatch is done via Task tool in a single message — evidence: S6B dispatch pattern in `cmd-advance.md`
- Fact-find artifacts are the canonical handoff format between discovery and planning — evidence: `docs/plans/_templates/fact-find-planning.md`, loop-spec S7 stage

### Data & Contracts

- Types/schemas/events:
  - Signal Review artifact schema — defined in Contract & I/O section above
  - Finding fingerprint — stable dedup key: `<principle_id>-<stage_id>-<failure_indicator_code>` (e.g., `P09-S7-missing-artifact`). Used to detect repeat findings across runs.
  - Signal principle schema (lives in `signal-principles.md`): `{id, name, description, audit_question, evidence_expectation, failure_indicators[], severity_default}`
  - Finding Brief frontmatter stub — must be a valid subset of `docs/plans/_templates/fact-find-planning.md` frontmatter so operator can paste and extend
- Persistence:
  - Signal Review artifact: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`
  - Finding Briefs: embedded in Signal Review; no standalone files in v1
  - Finding Fact-finds: `docs/plans/<finding-slug>/fact-find.md` — operator-created only
- API/contracts:
  - No BOS API calls in v1
  - No loop-spec.yaml schema changes in v1; dispatch is added purely in `cmd-advance.md`

### Dependency & Impact Map

- Upstream dependencies:
  - S10 weekly readout stage — signal review runs within or immediately after
  - All prior stage artifacts for the run (S1 through S9B) — read-only inputs to the audit
  - `.claude/skills/_shared/evidence-ladder.md` — referenced by scoring rubric
- Downstream dependents:
  - Operator — reviews Signal Review, decides which Finding Briefs to promote
  - `/lp-do-fact-find` — receives promoted Finding Briefs as inputs (operator-initiated, not auto-triggered)
  - `/lp-do-plan` — Finding Fact-finds become plan tasks via the standard pathway
  - `cmd-advance.md` — v1 addition is dispatch only; v1.1 adds GATE-S10-SIGNAL-01 artifact existence check
- Blast radius (v1):
  - Low: one new skill directory, one extension to `cmd-advance.md` S10 dispatch section, one new `_shared` file
  - **Zero data model changes**: loop-spec.yaml is not modified in v1; no BOS API changes

### Delivery & Channel Landscape

- Audience: operator running the startup loop (human, weekly cadence)
- Channel constraints: output is a markdown artifact; no external delivery
- Existing templates: `docs/plans/_templates/fact-find-planning.md` — reused by operators for promotion
- Approvals/owners: operator reviews Signal Review and decides which findings to promote; no auto-approval
- Measurement hooks: Signal Review tracks finding count per run; operator tracks finding-to-promotion rate in the resolved-findings section

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A structured per-run audit against the ten principles will surface findings the operator would not otherwise identify | First 2–3 runs | Low — run it, assess novelty | 2–3 weeks |
| H2 | S10 weekly cadence is the right frequency — catches drift without becoming noise | Operator feedback after first month | Low | 4 weeks |
| H3 | Finding Briefs promote cleanly into Finding Fact-finds with no schema gaps | First promotion cycle | Low — attempt one end-to-end | 1 week post-build |
| H4 | The ten principles are stable enough for a v1 versioned file; incremental additions only | First 3 review cycles | Low | 6 weeks |
| H5 | Advisory-only posture does not cause findings to be ignored; promotion rate ≥ 50% | 4 weekly cycles | Medium — requires operator discipline | 4 weeks |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence |
|---|---|---|---|
| H1 | No existing audit mechanism in loop; 10 principles identified with rationale | Session context | Medium — reasoned, not empirical |
| H2 | S10 is already weekly cadence; natural fit confirmed in loop-spec.yaml | loop-spec.yaml direct read | High |
| H3 | Fact-find template consumed by lp-do-plan; schema stable across all existing plans | `docs/plans/_templates/fact-find-planning.md` | High |
| H4 | Principles drawn from established AI workflow patterns | Session context | Medium |
| H5 | No precedent in this loop for advisory artifacts; unknown discipline level | None | Low |

#### Recommended Validation Approach

- Quick probes: run the skill manually on one in-flight loop run (BRIK or PET) after build; operator scores each finding as novel/known
- Structured tests: after 3 weekly cycles, review promotion rate; if <50%, Finding Brief format needs revision
- Deferred validation: cross-run fingerprint aggregation (same principles failing repeatedly → signals structural gaps in loop) — defer to post-v1

### Test Landscape

Not investigated: skills are prompt-driven; no code-level unit tests exist for any skill in this system. Structural validation (artifact schema checks) is the mechanism ceiling.

#### Coverage Gaps

- No automated check that all ten principles were scored per run (risk of silent skip)
- No schema validation of Finding Brief stubs against fact-find template before Signal Review is emitted
- Artifact naming convention (ISO week inclusion) is not yet enforced

#### Recommended Test Approach

- Self-check gate in `SKILL.md`: confirm all ten principle IDs appear in the Principle Scores section before emitting Signal Review (structural completeness)
- Schema compliance check: validate Finding Brief frontmatter keys against required fields in `fact-find-planning.md` before emitting
- Manual review: first two Signal Reviews are operator-reviewed before any Finding Briefs are promoted

---

## Questions

### Resolved

- Q: Does `/lp-experiment` exist as a concrete skill today?
  - A: No. loop-spec.yaml lists it as the S10 skill but no `lp-experiment` file exists in `.claude/skills/`. S10 is operationalised via the `weekly-kpcs-decision-prompt.md` prompt handoff only. Signal review adds to S10 dispatch without collision.
  - Evidence: `.claude/skills/` directory listing; loop-spec.yaml S10 entry (see Evidence Excerpts)

- Q: Where do Signal Review artifacts live?
  - A: `docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md`. HHMM timestamp prevents same-day collision. Finding Fact-finds follow the normal plan path: `docs/plans/<finding-slug>/fact-find.md`.
  - Evidence: naming pattern from other strategy artifacts in `docs/business-os/strategy/`

- Q: Hard gate or advisory?
  - A: Advisory in v1. No gate on S10 advance. Revisit as artifact-existence soft warning (GATE-S10-SIGNAL-01) in v1.1, after 4 weeks of evidence that the review runs consistently.
  - Evidence: GATE-BD-08 is existing S10 soft-warning precedent

- Q: Should the review self-audit (check whether prior findings were resolved)?
  - A: **Decided: yes, track-only from run 4.** Runs 1–3: `self_audit_mode: off`. Run 4+: `self_audit_mode: track-only` — the Signal Review includes an "Unresolved Prior Findings" section listing fingerprints with age, but does not block or re-raise them as new findings. Enforcement deferred to v2.
  - Rationale: closes the meta-loop without creating noise before the review has history to work from

- Q: Should findings be auto-submitted to BOS as cards, or remain local artifacts only?
  - A: **Decided: local artifacts only in v1.** Finding Briefs embedded in Signal Review; Finding Fact-finds created by operator. BOS sync is an opt-in v1.1+ extension if promotion rate proves consistent.
  - Rationale: keeps v1 additive and low-risk; avoids BOS card noise before the review is calibrated

### Open (User Input Needed)

None. All planning-blocking questions are resolved with documented defaults above.

---

## Anti-Churn Controls

Auto-spawning fact-finds can easily become a noisy task factory. These rules are normative for the `emit-phase` module:

### Dedup by finding fingerprint

Before emitting a Finding Brief, the skill checks all existing open plan tasks and unresolved prior findings for a matching fingerprint (`<principle_id>-<stage_id>-<failure_indicator_code>`).

- **Match found + open plan task**: append new evidence to the existing task's notes; do not create a new Finding Brief
- **Match found + unresolved prior finding (no plan task)**: update the prior finding's age counter; do not create a new Finding Brief
- **No match**: emit a new Finding Brief

### Novelty gate

A finding must identify a structural gap not already tracked. If the principle violation is documented in an existing open plan task, it is not novel. The skill logs it as a "known issue" in the Skipped Findings section.

### Cap enforcement

Even after dedup and novelty filtering, emit at most `max_findings` (default 3) Finding Briefs per run. Remaining eligible findings go to Skipped Findings — visible, not escalated.

### Draft-mode posture (v1)

Finding Briefs are stubs inside the Signal Review document. The operator must explicitly promote a Finding Brief by calling `/lp-do-fact-find` with the stub's args. The skill never auto-calls `/lp-do-fact-find`.

---

## Phased Rollout Plan

| Phase | Gate change | Scope |
|---|---|---|
| **v1** | None | New skill + `_shared/signal-principles.md` + S10 dispatch addition in `cmd-advance.md`; advisory; Finding Briefs only; no loop-spec changes |
| **v1.1** | GATE-S10-SIGNAL-01 (soft warning) | Artifact existence check: warn if no Signal Review emitted in last 7 days; does not block advance; added to `cmd-advance.md` after 4 weeks of consistent v1 runs |
| **v2** | Deferred | Consider stronger gating (block-on-missing-artifact only); cross-run fingerprint aggregation; BOS card sync opt-in; `self_audit_mode: enforce` |

---

## Confidence Inputs

- Implementation: 82%
  - Evidence: clear integration point (S10), existing skill pattern to follow, output schema defined in this document; v1 no loop-spec changes removes one risk
  - What raises to >=90: confirm S10 multi-skill dispatch works cleanly by reading one in-progress cmd-advance extension (S6B secondary dispatch is the model)
- Approach: 85%
  - Evidence: ten principles are well-grounded; advisory-first gate is validated by GATE-BD-08 precedent; finding fingerprint dedup is a standard anti-churn pattern
  - What raises to >=90: first live run confirms findings are novel and actionable
- Impact: 78%
  - Evidence: feedback loop closure is the most underserved principle in the current loop; this directly addresses it
  - What raises to >=80: operator confirms findings from first run were non-obvious
  - What raises to >=90: promotion rate ≥ 50% after 3 cycles
- Delivery-Readiness: 82%
  - Evidence: all upstream dependencies exist; v1 integration = cmd-advance only (no loop-spec changes reduces risk)
  - What raises to >=90: complete TASK-06 (S10 dispatch investigation) before planning
- Testability: 72%
  - Evidence: skills are prompt-driven; structural artifact validation is the ceiling; self-check gate covers principle completeness
  - What raises to >=80: self-check gate is confirmed in SKILL.md design and covers all ten principle IDs

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Finding quality too low — review surfaces known issues | Medium | Medium | Novelty gate: each Finding Brief must not match an existing open plan task fingerprint |
| Finding volume too high — backlog bloat | Medium | Medium | Hard cap at 3 per run; dedup by fingerprint; draft-mode posture (operator promotes, not auto-spawned) |
| Recursion / self-triggering — signal review findings trigger fact-finds that trigger more signal review audits | Medium | High | v1 draft-mode posture eliminates this entirely: no auto-spawning; operator promotes manually |
| S10 dispatch ambiguity — lp-experiment undefined | Medium | Low | v1 adds dispatch in cmd-advance.md only; lp-experiment slot preserved; no collision |
| Principle list drift — ten principles become stale | Low | High | Principles versioned in `_shared/signal-principles.md`; updates require a plan task |
| Self-audit noise before history exists | Low | Low | `self_audit_mode: off` for first 3 runs; track-only from run 4 |
| Principle 10 speculative findings — human sign-off undetectable | Medium | Medium | Concrete markers defined in scoring rubric; finding raised only when markers are absent AND stage artifact exists; else deferred to principle 9 |
| Artifact collision on same-day retries | Low | Low | HHMM timestamp in filename prevents within-day collision; each retry at a different time produces a unique filename |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill structure: `SKILL.md` (thin orchestrator) + `modules/` (one file per phase: `audit-phase.md`, `emit-phase.md`)
  - Signal principles live in `.claude/skills/_shared/signal-principles.md` — versioned, not baked into the skill
  - Finding Brief frontmatter must be a valid subset of `docs/plans/_templates/fact-find-planning.md` (no custom keys)
  - Gate naming convention: `GATE-S10-SIGNAL-01` — reserved for v1.1; do not add to v1 scope
- Anti-churn enforcement (normative for emit-phase.md):
  - Dedup by fingerprint before emitting any Finding Brief
  - Novelty gate: skip if matching open plan task exists
  - Hard cap: max 3 Finding Briefs per run
  - Draft-mode: no auto-spawning of `/lp-do-fact-find`
- Rollout:
  - v1: additive only — new skill + `_shared` asset + `cmd-advance.md` S10 dispatch extension
  - Rollback: remove skill directory + revert `cmd-advance.md` S10 dispatch line; no data loss
- Observability:
  - Signal Review artifact existence is the primary signal (one per week per business)
  - Operator tracks promotion rate manually in the resolved-findings section of each Signal Review

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01 (IMPLEMENT)**: Create `.claude/skills/_shared/signal-principles.md` — versioned checklist of all ten principles with: `id`, `name`, `audit_question`, `evidence_expectation`, `failure_indicators[]`, `severity_default`; include version header

2. **TASK-02 (INVESTIGATE)**: Clarify S10 dispatch mechanism — read `cmd-advance.md` S6B secondary dispatch block (the multi-skill dispatch pattern); confirm the same pattern applies to S10; document the exact edit needed for v1

3. **TASK-03 (IMPLEMENT)**: Create `.claude/skills/lp-signal-review/SKILL.md` — thin orchestrator with: invocation syntax, inputs/outputs (from Contract & I/O), module routing (audit-phase → emit-phase), exit conditions, self-check gate (all ten principle IDs must appear in output)

4. **TASK-04 (IMPLEMENT)**: Create `modules/audit-phase.md` — load stage artifacts under `run_root`; score each of the ten principles using the Severity/Support rubric; produce a scored principles table; identify top candidates above finding threshold

5. **TASK-05 (IMPLEMENT)**: Create `modules/emit-phase.md` — dedup by fingerprint; apply novelty gate; cap at `max_findings`; emit Finding Briefs with promotion stubs; emit Skipped Findings log; if `self_audit_mode: track-only`, emit Unresolved Prior Findings section

6. **TASK-06 (IMPLEMENT)**: Extend `.claude/skills/startup-loop/modules/cmd-advance.md` — add `/lp-signal-review` to S10 dispatch (alongside weekly-kpcs prompt); **no GATE-S10-SIGNAL-01 in v1** (deferred to v1.1)

7. **TASK-07 (CHECKPOINT)**: Run first live Signal Review on an in-flight loop run (BRIK or PET); operator assesses finding novelty and promotion stub quality; replan if confidence adjustments required; gate v1.1 work on results

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: `lp-do-fact-find` (operator-initiated promotion of Finding Briefs), `meta-reflect` (post-run learning capture)
- Deliverable acceptance package:
  - `.claude/skills/lp-signal-review/SKILL.md` exists and is invocable standalone
  - `.claude/skills/_shared/signal-principles.md` exists with all ten principles, versioned
  - `cmd-advance.md` S10 section references `/lp-signal-review` dispatch (no gate in v1)
  - First live Signal Review artifact exists at correct path with ISO week component
  - At least one Finding Brief in the Signal Review has a valid promotion stub (frontmatter keys match fact-find template)
  - At least one operator-promoted Finding Fact-find exists at `docs/plans/<slug>/fact-find.md`
- Post-delivery measurement plan:
  - Week 1: run on one in-flight loop; operator scores each finding as novel/known
  - Week 3: calculate promotion rate (Finding Briefs → Finding Fact-finds); target ≥ 50%
  - Week 6: assess fingerprint repeat rate; persistent repeats indicate structural loop gaps → feed to loop-spec or gate design

---

## Evidence Excerpts

Short anchored excerpts confirming key factual claims. Direct quotes from source files.

### S10 stage definition in loop-spec.yaml
```yaml
# docs/business-os/startup-loop/loop-spec.yaml (spec_version: 1.5.0)
# S10 entry (paraphrased from table structure):
- id: S10
  name: Weekly readout + experiments
  skill: /lp-experiment
  notes: weekly-kpcs-decision-prompt.md
```
Confirms: S10 is the terminal weekly stage; `/lp-experiment` is listed as the skill.

### Absence of lp-experiment skill file
```
# .claude/skills/ directory listing
lp-brand-bootstrap/
lp-bos-sync/
lp-do-build/
lp-channels/
lp-design-qa/
lp-design-spec/
lp-design-system/
lp-do-fact-find/
lp-forecast/
lp-guide-audit/
lp-guide-improve/
lp-launch-qa/
lp-offer/
lp-onboarding-audit/
lp-do-plan/
lp-prioritize/
lp-readiness/
lp-refactor/
lp-do-replan/
lp-sequence/
lp-site-upgrade/
lp-seo/
startup-loop/
# No lp-experiment/ directory present
```
Confirms: `/lp-experiment` does not exist; S10 dispatch slot is open for `/lp-signal-review`.

### GATE-BD-08 soft-warning precedent (cmd-advance.md)
```markdown
# .claude/skills/startup-loop/modules/cmd-advance.md
**GATE-BD-08** (S10): Soft warning — Brand Dossier `Last-reviewed` > 90 days.
```
Confirms: soft-warning gates at S10 are an established pattern; advisory-first posture for GATE-S10-SIGNAL-01 (v1.1) is consistent.

### Shared skills directory
```
# .claude/skills/_shared/ directory listing
auto-continue-policy.md
bos-api-payloads.md
confidence-protocol.md
confidence-scoring-rules.md
discovery-index-contract.md
discovery-index-refresh.md
evidence-ladder.md
fail-first-biz.md
git-isolation-mode.md
plan-archiving.md
precursor-doctrine.md
replan-update-format.md
testing-extinct-tests.md
validation-contracts.md
```
Confirms: `_shared/` is the established home for cross-skill contracts; `evidence-ladder.md` is the reference for Support scoring.

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed S10 integration point via loop-spec.yaml direct read (evidence excerpts added)
- Confirmed `/lp-experiment` absence via directory listing (evidence excerpts added)
- Confirmed `_shared/` directory and `evidence-ladder.md` availability for scoring rubric reference
- Confirmed GATE-BD-08 as S10 soft-warning precedent (supports advisory posture)
- Resolved internal inconsistency: v1 = no loop-spec.yaml changes; blast radius reflects this
- Resolved gate posture inconsistency: v1/v1.1/v2 phasing is now explicit and separated
- Added Contract & I/O section: inputs, outputs, exit conditions fully defined
- Added Scoring Rubric: Severity/Support axes, finding eligibility thresholds, missing evidence rule, principle 10 special handling
- Added Anti-Churn Controls section: dedup by fingerprint, novelty gate, cap, draft-mode posture
- Resolved all open questions: self-audit (track-only from run 4), BOS sync (local only v1)
- Fixed artifact naming: ISO week component prevents same-day collision
- Fixed Task Seeds: GATE removed from v1 scope; v1.1 phasing documented; auto-spawning removed
- Added terminology section: Signal Review / Finding Brief / Finding Fact-find distinguished throughout

### Confidence Adjustments

- Implementation held at 82%: S10 multi-skill dispatch confirmation (TASK-02) needed before >=90%
- Testability held at 72%: prompt-driven skills cannot be unit-tested; self-check gate is the ceiling mechanism
- Delivery-Readiness raised from 80% to 82%: loop-spec.yaml removal from v1 scope reduces one risk

### Remaining Assumptions

- S10 multi-skill dispatch via `cmd-advance.md` extension (without loop-spec changes) is feasible — modelled on S6B secondary dispatch but not confirmed by reading that block in isolation; TASK-02 resolves this
- Ten principles are treated as stable v1; no empirical validation across multiple runs yet
- Finding cap of 3 per run is the right ceiling — calibration may be needed after first live run

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none — all open questions resolved with documented defaults; remaining assumptions are low-risk and have verification paths in TASK-02 and TASK-07
- Recommended next step: `/lp-do-plan docs/plans/startup-loop-signal-strengthening-review/fact-find.md`
