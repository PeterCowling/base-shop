# Signal Strengthening Principles

version: 1.0.0

Checklist of ten structural principles for AI-driven startup loop runs. Used by `/lp-signal-review` to score each principle per run and identify findings.

## Schema

Each principle entry has these fields:

- **id**: P01–P10 (stable; used in finding fingerprints as `<principle_id>-<stage_id>-<failure_indicator_code>`)
- **name**: short label
- **audit_question**: the single question to answer when reviewing run artifacts
- **evidence_expectation**: what artifact, section, or field satisfies the principle
- **failure_indicators**: specific, falsifiable signs that the principle is violated
- **severity_default**: 1–5 (1 = minor quality issue; 5 = undermines run validity); actual severity may be overridden per finding based on stage context

## Support Scale (aligned to evidence-ladder.md)

| Support | Meaning |
|---|---|
| 1 | No evidence / pure inference; cannot confirm principle honoured or violated |
| 2 | Weak evidence: one artifact inspected, no direct confirmation |
| 3 | Moderate evidence: multiple artifacts inspected; failure indicator is present or clearly absent |
| 4 | Strong evidence: executable verification or structured comparison confirms state |
| 5 | Direct artifact confirmation: exact field/section/marker is present or verifiably absent |

---

## P01: Gather/Synthesize Separation

- **id:** P01
- **name:** Gather/Synthesize Separation
- **audit_question:** Does this stage's artifact show clear separation between evidence-gathering sections and conclusion/synthesis sections?
- **evidence_expectation:** Stage artifact contains a distinct evidence section (e.g., Evidence Audit, Research, Data Landscape) that precedes any conclusion, recommendation, or scoring section. Evidence sections cite sources; synthesis sections reference them.
- **severity_default:** 3
- **failure_indicators:**
  - Conclusion or recommendation sections appear in the artifact with no preceding evidence section
  - Synthesis claims are made without citation to a specific source, file, or artifact
  - Confidence scores are asserted without any evidence basis or uplift rationale
  - Fact-find artifact has conclusions in the same section as (or before) evidence gathering

---

## P02: Explicit Confidence Calibration

- **id:** P02
- **name:** Explicit Confidence Calibration
- **audit_question:** Do confidence scores in this stage's artifact reflect evidence, and are they distinguishable from optimistic narrative prose?
- **evidence_expectation:** Stage artifact contains numeric confidence scores (not just "high/medium/low") with an evidence basis stated per dimension. "What would raise this to >=80 or >=90" actions are concrete and achievable.
- **severity_default:** 4
- **failure_indicators:**
  - Confidence scores are identical across Implementation, Approach, and Impact (e.g., all 80%) with no independent rationale
  - All scores are ≥80% despite known unknowns or missing evidence
  - No "what would raise this" actions are defined, or they are circular (e.g., "run more research")
  - Scores have been promoted upward without documented new evidence since last run

---

## P03: Adversarial Review

- **id:** P03
- **name:** Adversarial Review
- **audit_question:** Was a critic agent or adversarial review invoked before locking in a key decision for this stage?
- **evidence_expectation:** A `/review-critique` call or equivalent adversarial review artifact exists and was produced before the stage's key decision artifact (offer, channel plan, prioritisation) was marked complete or promoted.
- **severity_default:** 3
- **failure_indicators:**
  - No `/review-critique` call documented for the stage where a key decision was locked
  - Key decision artifact has no "objections considered", "critique addressed", or "risks" section
  - All risks in the stage artifact are rated Low likelihood with identical, unspecific mitigations
  - Review critique was invoked but its findings were not addressed or documented as accepted risks

---

## P04: Ground Truth Anchoring

- **id:** P04
- **name:** Ground Truth Anchoring
- **audit_question:** Does this stage's artifact reference at least one real, non-synthesized data point — not an AI-inferred value — as a foundation for key claims?
- **evidence_expectation:** Stage artifact cites at least one concrete real-world data source: actual bookings, real competitor prices found by research, a user response, an API response, or a measured baseline. Source citations are traceable (URL, file path, or named human informant).
- **severity_default:** 5
- **failure_indicators:**
  - Stage artifact contains only assumed or market-standard values with no source citation
  - All external evidence is marked "estimated" or "typical" without a traceable source
  - No real user or customer data cited anywhere in the run artifacts for stages that require customer validation
  - Assumptions section contains only hypothetical values with no validation plan or evidence path

---

## P05: Operator/Executor Separation

- **id:** P05
- **name:** Operator/Executor Separation
- **audit_question:** Is the control plane (startup-loop orchestrator) architecturally separate from execution (lp-build, lp-fact-find, etc.), and has this boundary been maintained?
- **evidence_expectation:** `startup-loop/SKILL.md` remains a thin orchestrator (gate checks, dispatch, handoffs only). No stage-specific implementation logic is embedded in the orchestrator. Each executor skill (`lp-build`, `lp-fact-find`, etc.) is self-contained.
- **severity_default:** 2
- **failure_indicators:**
  - `startup-loop/SKILL.md` contains stage-specific implementation details or planning content (not just dispatch)
  - A single skill file performs both planning (what to do) and execution (doing it) for the same stage
  - A gate check in `cmd-advance.md` performs meaningful business logic rather than delegating to a skill

---

## P06: Scope Containment

- **id:** P06
- **name:** Scope Containment
- **audit_question:** Do plan tasks for this stage each have exactly one deliverable and unambiguous acceptance criteria?
- **evidence_expectation:** Each IMPLEMENT task in the plan has a single `Deliverable` field naming one artifact or change. Acceptance criteria list items are all verifiable independently. Effort ratings match scope (S tasks have ≤3 acceptance items; M/L tasks have structured validation contracts).
- **severity_default:** 3
- **failure_indicators:**
  - A task's `Deliverable` field names more than one output artifact
  - Task description spans multiple independent areas (e.g., "build feature X and also refactor Y")
  - Acceptance criteria list contains items for two distinct systems or concerns
  - `Execution-Skill` field is missing or unresolvable for one or more tasks

---

## P07: Context Hygiene

- **id:** P07
- **name:** Context Hygiene
- **audit_question:** Are skill invocations scoped to the minimum relevant context for the current stage, rather than passing maximal conversation history?
- **evidence_expectation:** Skill invocations reference specific artifact paths (not the full conversation). Each stage skill reads only the artifacts listed in its `Affects` / input parameter list. Evidence from prior stages is referenced by path, not re-embedded.
- **severity_default:** 3
- **failure_indicators:**
  - Skill invocations reference the entire prior conversation context rather than named artifacts
  - A stage artifact embeds the full content of multiple prior-stage artifacts inline (rather than referencing by path)
  - Agents are given `--run-root` pointing to a directory with more than the stages they audit

---

## P08: Feedback Loop Closure

- **id:** P08
- **name:** Feedback Loop Closure
- **audit_question:** Are outcomes from prior actions being measured and fed back into this run's priors or assumptions?
- **evidence_expectation:** Stage artifact or weekly readout contains outcome metrics from prior-cycle actions (conversion rate, booking count, email open rate, etc.). Assumptions updated since the last cycle cite measured values, not unchanged estimates. Signal Review resolved-findings section is populated for runs after the third.
- **severity_default:** 4
- **failure_indicators:**
  - Measurement plan for prior deliverables is missing or has `Measurement-Readiness: N/A`
  - Weekly readout contains no outcome data from the previous week's actions
  - Assumptions in this cycle's stage artifacts are identical to prior cycle (no updates from measurement)
  - Signal Review from a prior run has zero resolved findings despite plan tasks existing for those findings

---

## P09: Checkpointed Restartability

- **id:** P09
- **name:** Checkpointed Restartability
- **audit_question:** Does each completed stage have a persistent artifact at its documented `required_output_path`, and are incomplete stages clearly marked?
- **evidence_expectation:** All completed stages have an artifact at their documented path with `Status: Active` or equivalent non-Draft status. Run packet `required_output_path` fields are populated for each stage. A restart from any stage is possible by reading the prior stage's artifact.
- **severity_default:** 4
- **failure_indicators:**
  - A required stage artifact is missing (file does not exist at documented path)
  - A stage artifact has `Status: Draft` for a stage listed as Complete in the run packet
  - `required_output_path` is not documented for one or more stages in the run packet
  - Recovery from a mid-run failure would require re-running stages that already completed (no checkpoint exists)

---

## P10: Human Judgment Gates

- **id:** P10
- **name:** Human Judgment Gates
- **audit_question:** Are ICP commitment, pricing decisions, and channel selection decisions marked with at least one explicit human sign-off marker in the relevant stage artifact?
- **evidence_expectation:** One or more of the following markers is present in the relevant stage artifact (S2B offer, S5A prioritise, S6B channel):
  1. Frontmatter fields `Human-approved: true` and `Approved-By: <name>` present in the artifact
  2. A `## Human Decisions This Week` section in the weekly readout artifact with ≥1 named decision and decision-maker
  3. A DECISION task in the plan with `Status: Complete` and a named decision-maker in the task body
- **severity_default:** 5
- **failure_indicators:**
  - Relevant stage artifact (S2B, S5A, S6B) exists but lacks all three marker types above
  - Pricing, ICP, or channel decision is recorded only in an AI-produced artifact with no human confirmation field
  - Weekly readout has no `## Human Decisions This Week` section for a week when a key commitment was made
  - A DECISION task in the plan was marked `Complete` but has no named decision-maker

**Note:** If the relevant stage artifact is missing entirely, defer to P09 (Checkpointed Restartability). Do not raise a speculative P10 finding for a stage that cannot be inspected.

---

## Versioning Policy

Updates to this file require a plan task; no ad-hoc edits. When adding a new principle or changing `severity_default`, bump the version header and add a changelog entry below.

## Changelog

- 1.0.0 (2026-02-18): Initial ten principles.
