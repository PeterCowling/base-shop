# audit-phase — Principle Scoring Phase

## Phase Purpose

This module is invoked by `/lp-signal-review` after inputs are validated. It:

1. Enumerates stage artifacts under `run_root` and flags missing ones
2. Degrades Support scores for principles dependent on missing artifacts
3. Scores all ten signal-strengthening principles against observed evidence
4. Produces a scored principles table ready for `emit-phase.md`

Read `.claude/skills/_shared/signal-principles.md` for principle definitions.
Read the Support scale table in that file, calibrated against `.claude/skills/_shared/evidence-ladder.md`.

---

## Inputs Expected Under `run_root`

List these paths at audit start (before scoring any principles). An artifact is **present** if the file exists and is readable; **missing** if it does not exist.

Paths are relative to `run_root` (`docs/business-os/strategy/<BIZ>/`) except where noted.

| Stage | Artifact Role | Path |
|---|---|---|
| S0–S1 | Business plan (scope and constraints) | `{run_root}plan.user.md` |
| S1 | Strategy index (Brand Dossier status tracking) | `{run_root}index.user.md` |
| S1 | Brand dossier | `{run_root}brand-dossier.user.md` |
| S2 | Demand evidence pack | `docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md` |
| S2A | Measurement verification | `{run_root}*measurement-verification*.user.md` (date-prefixed; pick most recent) |
| S2B | Offer artifact | `{run_root}*offer*.user.md` or `{run_root}offer.user.md` (date-prefixed acceptable) |
| S2B | Messaging hierarchy | `{run_root}messaging-hierarchy.user.md` |
| S3 | Forecast artifact | `{run_root}*forecast*.user.md` or `{run_root}forecast.user.md` |
| S5A | Prioritization | `{run_root}*priorit*.user.md` or `{run_root}priorities.user.md` |
| S6B | Channel strategy | `{run_root}*channel*.user.md` |
| S10 | Weekly readout / KPCS memo | `{run_root}*readout*.user.md` or `{run_root}*kpcs*.user.md` (most recent) |

**Missing artifact rule**: For any artifact above that cannot be read:
- Set Support = 1 for all principles that depend on that stage's artifact for their scoring evidence.
- Log the missing path in the **P09 Missing Artifacts collector** (below).
- Do **not** raise speculative violations for other principles due to missing artifacts. Only P09 benefits from the confirmed-missing evidence.

**Draft artifact rule**: If a stage artifact is present but has `Status: Draft` (or lacks a `Status: Active` field at a stage expected to be complete), treat it as present but reduce its Support contribution by 1 point for principles auditing that stage.

---

## P09 Missing Artifacts Collector (Pre-computation)

Build this list before scoring any principles. It feeds directly into P09's finding and flags Support degradation for other principles.

```
P09 Missing Artifacts:
- docs/business-os/strategy/<BIZ>/offer.user.md  ← example
- docs/business-os/startup-baselines/<BIZ>/demand-evidence-pack.md  ← example
(empty if all present)
```

---

## Principle Audit Procedures

Score each principle independently. Correlated co-failures (e.g., P01 and P02 failing together) are a normal outcome — do not suppress a finding because a related principle flagged the same stage.

---

### P01: Gather/Synthesize Separation

**Artifacts to read**: `plan.user.md`, S2B offer artifact, S3 forecast artifact, S6B channel artifact, any fact-find at `docs/plans/<BIZ-slug>/fact-find.md`.

**Positive evidence (principle honoured)**:
- Artifacts contain a distinct "Evidence Audit", "Research", or "Data Landscape" section that precedes any "Conclusions", "Recommendations", or "Scoring" section
- Synthesis claims cite specific source artifacts or files by name or path

**Failure indicators (principle violated)**:
- Conclusion or recommendation sections appear with no preceding evidence section
- Confidence scores asserted without any evidence basis or uplift rationale
- Fact-find artifact mixes evidence gathering and conclusions in the same section or reverses their order

**Support scoring guide**:
- 5: Three or more key artifacts inspected; each has clear evidence-then-synthesis structure; no failure indicators confirmed present
- 4: Two artifacts inspected; structure is clear in both; minor ambiguity in one section
- 3: One artifact inspected; evidence of structure present or failure indicator clearly present
- 2: One artifact partially reviewed; no direct confirmation either way
- 1: No artifact readable for this principle; or no relevant evidence found

---

### P02: Explicit Confidence Calibration

**Artifacts to read**: fact-find at `docs/plans/<BIZ-slug>/fact-find.md`, `plan.user.md`, S2B offer artifact, S3 forecast artifact.

**Positive evidence**:
- Numeric confidence scores (not just "high/medium/low") present with independent rationale per dimension
- "What would raise this to >=80 or >=90" actions are concrete and achievable, not circular

**Failure indicators**:
- All scores identical across dimensions (e.g., all 80%) with no independent rationale for each
- All scores ≥ 80% despite documented known unknowns or missing evidence
- Scores promoted upward with no documented new evidence
- No "what would raise this" section, or only circular actions (e.g., "run more research")

**Support scoring guide**:
- 5: Fact-find or plan reviewed; scores differ across dimensions; evidence basis stated per score; "what raises this" is specific
- 4: Two artifacts inspected; evidence basis present but thin
- 3: One artifact inspected; failure indicator clearly present or absent
- 2: One artifact partially reviewed; no direct confirmation of calibration practice
- 1: No artifact readable or confidence scoring section absent entirely

---

### P03: Adversarial Review

**Artifacts to read**: `plan.user.md`, S2B offer artifact, S6B channel strategy, S5A prioritization artifact.

**Positive evidence**:
- A `/review-critique` call documented in the plan or stage doc for the stage where a key decision was locked
- An "objections considered", "critique addressed", or "risks" section in a key decision artifact with non-generic entries

**Failure indicators**:
- No `/review-critique` call documented for a stage locking a key decision (offer, channel, prioritization)
- All risks in stage artifacts rated Low likelihood with identical, unspecific mitigations
- Critique was invoked but its findings are not addressed or documented as accepted risks

**Support scoring guide**:
- 5: One or more decision artifacts reviewed; `/review-critique` reference confirmed present or explicitly absent with no critique section found
- 4: Two artifacts checked; partial evidence of review
- 3: One artifact checked; failure indicator clearly present or absent
- 2: One artifact partially checked
- 1: No readable decision artifact for completed stages

---

### P04: Ground Truth Anchoring

**Artifacts to read**: demand evidence pack (S2), S2B offer artifact, S3 forecast artifact, S2A measurement verification, S10 weekly readout.

**Positive evidence**:
- At least one traceable real-world data source cited with a URL, file path, named human informant, or API response as reference
- Bookings data, competitor prices from research, user responses, or measured baselines are cited with traceable sources

**Failure indicators**:
- All external evidence marked "estimated" or "typical" with no traceable source
- Assumptions section contains only hypothetical values with no validation plan or evidence path
- No real user or customer data cited for stages requiring customer validation

**Support scoring guide**:
- 5: Demand evidence pack or forecast reviewed; at least one non-synthesized data point with traceable citation found, or confirmed absent
- 4: Two artifacts reviewed; one real-world source found
- 3: One artifact reviewed; evidence state is clear (present or absent)
- 2: One artifact partially reviewed
- 1: No demand or evidence artifact readable; or all content is pure inference

---

### P05: Operator/Executor Separation

**Artifacts to read**: `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/startup-loop/modules/cmd-advance.md`.

**Note**: These are skill meta-artifacts about the loop structure itself — not under `run_root`. Severity default is 2. This principle accumulates slowly and typically requires deliberate architectural drift to violate.

**Positive evidence**:
- `startup-loop/SKILL.md` contains only gate checks, dispatch, and handoffs — no stage-specific implementation logic embedded
- Each executor skill (`lp-build`, `lp-fact-find`, etc.) appears self-contained (thin SKILL.md + modules)

**Failure indicators**:
- `startup-loop/SKILL.md` contains stage-specific implementation details or planning content (not just dispatch)
- A single skill file performs both planning (what to do) and execution (doing it) for the same stage
- A gate check in `cmd-advance.md` performs meaningful business logic rather than delegating to a skill

**Support scoring guide**:
- 5: `startup-loop/SKILL.md` read; content confirms thin orchestrator with no stage-specific logic
- 4: One or more orchestrator/executor boundary verified
- 3: One file read; state is clear
- 2: One file partially reviewed
- 1: Files not readable

---

### P06: Scope Containment

**Artifacts to read**: The active plan file for this run (search `docs/plans/*/plan.md` by matching business context, or check `docs/business-os/strategy/<BIZ>/plan.user.md` for a link to it).

**Positive evidence**:
- Each IMPLEMENT task has exactly one `Deliverable` field naming one artifact or change
- Acceptance criteria are all independently verifiable
- Effort ratings match scope (S tasks have ≤ 3 acceptance items; M/L tasks have structured validation)
- All tasks have a resolvable `Execution-Skill` field

**Failure indicators**:
- A task's `Deliverable` names more than one output artifact
- Task description spans multiple independent areas (e.g., "build feature X and also refactor Y")
- Acceptance criteria list items for two distinct systems or concerns
- `Execution-Skill` missing or unresolvable for one or more tasks

**Support scoring guide**:
- 5: Plan reviewed; task structure checked for all IMPLEMENT tasks; containment state clear
- 4: Most tasks checked; minor ambiguity in one
- 3: A representative sample checked; pattern is clear
- 2: Plan read but only one task inspected
- 1: Plan not readable or no IMPLEMENT tasks found

---

### P07: Context Hygiene

**Artifacts to read**: `plan.user.md`, SKILL.md files for skills invoked in this run, any stage documents that reference prior-stage content.

**Positive evidence**:
- Skill invocations reference specific artifact paths (`--artifact`, `--run-root`), not full conversation history
- Stage artifacts reference prior stage content by path, not by inline embedding of full content
- Each invocation is scoped to its relevant stage inputs only

**Failure indicators**:
- Skill invocations reference the entire prior conversation context rather than named artifacts
- A stage artifact embeds the full content of multiple prior-stage artifacts inline
- Agents given `--run-root` pointing to more directories than the stages they audit

**Support scoring guide**:
- 5: Two or more skill invocations reviewed; input scoping confirmed narrow (path-referenced)
- 4: One invocation reviewed; scoping is clearly narrow or clearly broad
- 3: One skill reviewed; pattern clear
- 2: Only one artifact partially reviewed
- 1: No skill invocations readable

---

### P08: Feedback Loop Closure

**Artifacts to read**: S10 weekly readout, `plan.user.md`, S2B offer artifact, S3 forecast artifact, any prior Signal Review artifacts.

**Positive evidence**:
- Weekly readout contains outcome metrics from prior-cycle actions (conversion rate, booking count, email open rate)
- Assumptions updated since last cycle cite measured values, not unchanged estimates
- Signal Review resolved-findings section is populated (for runs after the third)

**Failure indicators**:
- Measurement plan for prior deliverables missing or set to `Measurement-Readiness: N/A`
- Weekly readout contains no outcome data from the previous week's actions
- Assumptions in this cycle's stage artifacts are identical to prior cycle (no updates from measurement)
- Prior Signal Review has zero resolved findings despite plan tasks existing for those findings

**Support scoring guide**:
- 5: Weekly readout reviewed; outcome metrics from prior cycle present or confirmed absent
- 4: Readout plus one other artifact reviewed
- 3: One artifact with clear evidence of feedback presence or absence
- 2: One artifact partially reviewed
- 1: No weekly readout readable; or this is the first run (no prior cycle to measure)

---

### P09: Checkpointed Restartability

**Artifacts to read**: All stage artifacts listed in "Inputs Expected Under `run_root`".

**Positive evidence**:
- All completed stages have a readable artifact at their documented path
- Artifacts for completed stages have `Status: Active` (or equivalent non-Draft)

**Failure indicators**:
- A required stage artifact is missing (file does not exist at documented path)
- A stage artifact has `Status: Draft` for a stage listed as Complete in the run packet
- `required_output_path` is not documented for one or more stages in the run packet

**P09 aggregation rule**: Aggregate ALL missing artifacts into a **single** P09 finding. Do not emit one P09 finding per missing artifact. The single P09 finding has Severity 4 / Support 5 (the missing artifact list itself is direct confirmation). List each missing path in the finding body.

**Support scoring guide**:
- 5: All stage artifact paths checked; missing artifact list is complete and confirmed (even if list is empty)
- 4: Most paths checked; one or two not verified
- 3: A representative set of paths checked
- 2: Only one or two paths checked
- 1: Cannot determine which stages exist or are present

---

### P10: Human Judgment Gates

**Artifacts to read**: S2B offer artifact, S5A prioritization artifact, S6B channel strategy, S10 weekly readout, `plan.user.md`.

**SPECULATIVE-FINDING PROHIBITION**: Do not raise a P10 finding unless **both** of the following are true:
1. The relevant stage artifact **exists and is readable**
2. None of the three concrete human sign-off markers are present in that artifact

If the stage artifact is missing entirely, defer to P09. Do not raise P10 speculatively for a stage that cannot be inspected.

**Three concrete markers** (any one suffices for the principle to be honoured):
1. Frontmatter fields `Human-approved: true` AND `Approved-By: <name>` in the stage artifact
2. A `## Human Decisions This Week` section in the S10 weekly readout with ≥1 named decision and decision-maker
3. A DECISION task in the plan with `Status: Complete` and a named decision-maker in the task body

**Failure indicators** (only raised when stage artifact exists and is readable):
- Relevant stage artifact (S2B, S5A, or S6B) exists but all three marker types are absent
- Pricing, ICP, or channel decision recorded only in an AI-produced artifact with no human confirmation
- DECISION task marked Complete but has no named decision-maker in the task body

**Default when stage artifact is missing**: skip P10 entirely for that stage; defer to P09.

**Default score when artifact exists and markers are confirmed absent OR ambiguous**: Severity 3 / Support 3. (Aligned to fact-find § Scoring Rubric — Principle 10 special handling: absent markers with an existing artifact is a convention gap, not a run-validity threat.) Tag as `needs-evidence` when ambiguous.

**Override to Severity 5**: Only when there is positive evidence that a high-stakes ICP, pricing, or channel decision was actually made by AI alone with no human traceability — i.e., the decision is recorded only in an AI artifact AND no human is identified as owner or decision-maker anywhere. Document the override rationale inline.

**Support scoring guide**:
- 5: Stage artifact reviewed; marker presence or confirmed absence verified directly
- 4: Two marker types checked; one not verified
- 3: One marker type checked; state is clear
- 2: Artifact read but only one field checked
- 1: Stage artifact not readable — defer to P09; do not score P10

---

## Output: Scored Principles Table

After auditing all ten principles, produce this table:

```markdown
## Principle Scores

| Principle ID | Name | Severity | Support | Evidence Pointer | Finding Eligible |
|---|---|---|---|---|---|
| P01 | Gather/Synthesize Separation | 3 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P02 | Explicit Confidence Calibration | 4 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P03 | Adversarial Review | 3 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P04 | Ground Truth Anchoring | 5 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P05 | Operator/Executor Separation | 2 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P06 | Scope Containment | 3 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P07 | Context Hygiene | 3 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P08 | Feedback Loop Closure | 4 | <1-5> | <path or "no artifact"> | <Yes/No> |
| P09 | Checkpointed Restartability | 4 | <1-5> | <path or "missing: [list]"> | <Yes/No> |
| P10 | Human Judgment Gates | 5 | <1-5> | <path or "no artifact"> | <Yes/No> |
```

**Severity**: use `severity_default` from `signal-principles.md` unless stage context warrants an override (document reason inline if overriding).

**Finding Eligible** = `Yes` when either threshold is met:
- **Strong finding**: Severity ≥ 4 AND Support ≥ 3
- **High-risk gap**: Severity = 5 AND Support ≥ 2 (tag: `needs-evidence`)

**P09 missing artifact list**: If any paths were missing, append the list below the table:

```
P09 missing artifacts:
- <path-1>
- <path-2>
```

### Evidence Notes

After the table, append one line per principle summarising what was inspected and what was found:

```
P01: Reviewed offer.user.md and forecast.user.md. Evidence section precedes conclusions in both. Support = 4.
P02: Reviewed fact-find.md. Scores differ across dimensions; evidence basis stated. Support = 5.
...
```

---

## Handoff to emit-phase

Pass the following to `modules/emit-phase.md`:
- Full scored principles table (all ten rows)
- Evidence notes per principle
- P09 missing artifacts list (may be empty)
