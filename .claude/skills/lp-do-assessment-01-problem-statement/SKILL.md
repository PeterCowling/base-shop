---
name: lp-do-assessment-01-problem-statement
description: Problem framing for new startups (ASSESSMENT-01). Produces a falsifiable problem statement artifact before entering ASSESSMENT intake. Upstream of lp-do-assessment-02-solution-profiling.
---

# lp-do-assessment-01-problem-statement — Problem Framing (ASSESSMENT-01)

Produces a clear, falsifiable problem statement before the operator enters S0 (Intake). Run this when starting from a customer problem rather than a committed product hypothesis.

## Invocation

```
/lp-do-assessment-01-problem-statement --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier (e.g., PET, HEAD, BRIK)

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

READ-THEN-WRITE

This skill:
- Reads existing business docs and operator-provided problem descriptions
- Produces one structured problem statement artifact
- Does NOT recommend solutions, select product types, or score demand
- Does NOT ask whether to proceed — operator decides after reviewing the artifact

## Inputs

Required:
- `--business <BIZ>` — business identifier

Optional (read if present):
- Inline problem description provided by the operator at invocation
- Any file path provided by the operator

Search paths (scan in order, use what exists):
- `docs/business-os/strategy/<BIZ>/` — strategy docs, briefs, notes
- `docs/business-os/startup-baselines/<BIZ>-*` — baseline docs

If no files exist, work from operator-provided description only. Do not block on missing files.

## Steps

### Step 1: Load context

Scan all files in the search paths. Load operator-provided description if present. Extract all mentions of customer pain, complaints, friction, workarounds, and unmet needs. Ignore solution language. Note which evidence items are directly observed/cited vs. inferred from secondary signals.

### Step 2: Draft the core problem

Write a precise description of the structural gap customers face. This should be as long as the problem requires — typically 1–3 short paragraphs. Describe:
- What customers cannot reliably do, achieve, or access
- Why the current market fails them (structural gap, not just feature absence)
- The consequence they experience when the problem isn't solved

Use customer language throughout. No product names, no solution framing, no "they need X."

**HBAG pattern (forced-choice binary):** "They face a forced choice between A (cheap/generic, fails in these ways) and B (expensive/gated, fails in these ways)." Use this pattern when the gap is structural pricing or access, not just product quality.

**HEAD pattern (system absence):** "They lack a reliable system to do X and Y simultaneously." Use this when the gap is the absence of an integrated solution across a routine or workflow.

### Step 3: Identify affected user groups

Name 1–3 specific segments. For each:
- Name the segment with qualifying detail (role, age band, situation, behaviour pattern — not "pet owners" but "first-time dog owners with active breeds")
- State the specific friction or motivation driving their problem
- Add a `*Segmentation note:*` if there's a meaningful sub-segment boundary that affects product or copy (e.g., a price tier cutoff, a device-brand split, a geography-driven behaviour difference). Cite the source of that boundary.
- Tag confidence level: `(research-confirmed)`, `(inferred)`, or `(hypothesis; not yet measured)`

### Step 4: Qualify severity and frequency per segment

For each segment, state separately:
- **Frequency**: daily / weekly / monthly / per-event; be specific
- **Severity**: financial cost, time cost, emotional cost — quantify where possible
- **Evidence tag**: mark whether frequency/severity is `(checked)`, `(claimed-by-sources)`, `(inferred)`, or `(unknown — gap)`

"High frequency and severity" is not acceptable. Every claim must carry a qualifier or an explicit gap flag.

### Step 5: Document current workarounds as a table

Produce a workarounds table. One row per workaround type. Columns: Workaround | What it wins | Where it loses | The failure state it leaves unresolved.

Below the table, add a "Documented failure states" subsection listing specific failure modes observed in community evidence, reviews, or forum research — in customer language, with source. At least two failure states must be named; if none are documented, flag as an evidence gap.

### Step 6: Record evidence pointers with confidence level

List signals that the problem is real. Each item must carry one of:
- `(checked)` — directly verified against a primary source
- `(claimed-by-sources)` — cited by secondary sources but not directly confirmed in this artifact system; treat as directional
- `(inferred)` — logical inference from adjacent evidence, not directly evidenced

If the evidence set is large (>8 items), create a sidecar file `docs/business-os/strategy/<BIZ>/s0a-research-appendix.user.md` for the full set and reference it from the main artifact with: `"Full evidence set in research appendix."` Keep the main document to the 5–6 most important signals.

### Step 7: Write problem boundary

Two subsections:
- **In-scope**: what this problem statement covers (product category, use case, user state)
- **Out-of-scope / non-claims**: what this business explicitly will not claim to do; any regulatory or safety lines to hold

This section prevents scope drift in downstream offer and copy work. It is required, not optional.

### Step 8: Write open questions (validation checklist)

List the 8 highest-priority questions that cannot be answered from existing evidence and require first-party validation (interviews, cohort data, conversion tests). Prioritise questions about problem reality and severity — not product or channel design (those go to ASSESSMENT-02).

If the operator provided a longer question set, preserve only the top 8 here and note that the rest are in the ASSESSMENT-02 prompt.

### Step 9: Assess kill conditions

Evaluate three failure modes. For each, write:
1. **Status**: PASS / FAIL / PASS (provisional)
2. **Evidence basis**: 1–2 sentences citing what makes this pass or fail
3. **Unblocked by**: if provisional, state exactly what evidence or action would convert provisional to confirmed PASS

If any kill condition is FAIL, write an explicit STOP advisory. Do not suppress.

### Step 10: Write downstream artifacts table

At the bottom of the document, include a table of all S0 stage artifacts that have been or will be produced:

| Artifact | Path | Stage | Status |
|---|---|---|---|
| Research appendix (if created) | `s0a-research-appendix.user.md` | ASSESSMENT-01 | — |
| Solution-space prompt | `<YYYY-MM-DD>-solution-profiling-prompt.md` | ASSESSMENT-02 | — |
| Solution-space results | `<YYYY-MM-DD>-solution-profile-results.user.md` | ASSESSMENT-02 | — |
| Option selection decision | `<YYYY-MM-DD>-solution-decision.user.md` | ASSESSMENT-03 | — |
| Naming research prompt | `candidate-names-prompt.md` | ASSESSMENT-04 | — |
| Distribution plan | `<YYYY-MM-DD>-launch-distribution-plan.user.md` | ASSESSMENT-06 | — |
| Measurement plan | `<YYYY-MM-DD>-measurement-profile.user.md` | ASSESSMENT-07 | — |
| Current situation | `<YYYY-MM-DD>-operator-context.user.md` | ASSESSMENT-08 | — |

Mark status as the date created if it exists, or `(pending)` if not yet produced.

### Step 11: Assemble and save artifact

Write the artifact to the output path. Verify the quality gate before saving.

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-problem-statement.user.md`

**Format:**

```markdown
---
Type: Problem-Statement
Stage: ASSESSMENT-01
Business: <BIZ>
Status: Active
Created: <YYYY-MM-DD>
Method: [live operator input | back-propagated from <list stages>]
Back-propagated-from: <stages, if applicable>
Research-appendix: <path, if created>
Downstream: docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profiling-prompt.md
---

# Problem Statement — <BIZ>

## Core Problem

[Precise description of the structural gap. 1–3 short paragraphs. Customer language. Use forced-choice binary pattern or system-absence pattern as appropriate. No solution framing.]

---

## Affected User Groups

### Group 1 — [Descriptive name] (primary)

[Specific named segment with qualifying detail. State friction. Source.]

*Segmentation note: [sub-segment boundary, if meaningful, with source.]*
Confidence: (research-confirmed | inferred | hypothesis; not yet measured)

### Group 2 — [Descriptive name] (secondary)

[Same pattern.]

### Group 3 — [Descriptive name] (tertiary, if applicable; evidence-thin)

[Same pattern. Flag if evidence is thin.]

## Severity and Frequency

**[Group 1]:**
- Frequency: [specific qualifier + evidence tag]
- Severity: [financial / time / emotional cost + evidence tag]

**[Group 2]:**
- Frequency: [specific qualifier + evidence tag]
- Severity: [financial / time / emotional cost + evidence tag]

## Current Workarounds

| Workaround | What it wins | Where it loses | Failure state left unresolved |
|---|---|---|---|
| [Type] | [Pros] | [Cons] | [Specific failure mode] |

### Documented Failure States

Specific failure modes observed in community research, reviews, or forum data (customer language, with source):

1. **[Failure state]** — [customer quote or paraphrase, source]
2. **[Failure state]** — [customer quote or paraphrase, source]

## Evidence Pointers

- [Signal] (checked | claimed-by-sources | inferred) — [source]
- [Signal] (checked | claimed-by-sources | inferred) — [source]
- [Known evidence gap: description of what's missing and what would resolve it]

*Full evidence set in research appendix (if created): `s0a-research-appendix.user.md`*

## Problem Boundary

**In-scope:**
- [What this problem statement covers]

**Out-of-scope / non-claims:**
- [What this business explicitly will not claim to do]
- [Regulatory or safety lines to hold]

## Open Questions (First-Priority Validation Checklist)

These 8 questions require first-party validation before advancing to offer or channel design:

1. [Question most directly testing problem reality]
2. ...

*Full question set (product, channel, requirements) is in the ASSESSMENT-02 prompt.*

## Kill Conditions

### 1. Market too small to support DTC economics
**Status:** PASS / FAIL / PASS (provisional)
[Evidence basis.]
**Unblocked by:** [What evidence or action converts provisional to confirmed.]

### 2. Incumbents fully solve the problem
**Status:** PASS / FAIL / PASS (provisional)
[Evidence basis.]
**Unblocked by:** [What evidence or action converts provisional to confirmed.]

### 3. Pain insufficient to drive willingness-to-pay
**Status:** PASS / FAIL / PASS (provisional)
[Evidence basis.]
**Unblocked by:** [What evidence or action converts provisional to confirmed.]

**Verdict: GO / NO-GO / GO (with explicit validation gap)**
[One sentence stating what happens next and what the most important open condition is.]

---

## Downstream Artifacts

| Artifact | Path | Stage | Status |
|---|---|---|---|
| Research appendix | `s0a-research-appendix.user.md` | ASSESSMENT-01 | (pending / date) |
| Solution-space prompt | `<YYYY-MM-DD>-solution-profiling-prompt.md` | ASSESSMENT-02 | (pending / date) |
| Solution-space results | `<YYYY-MM-DD>-solution-profile-results.user.md` | ASSESSMENT-02 | (pending / date) |
| Option selection decision | `<YYYY-MM-DD>-solution-decision.user.md` | ASSESSMENT-03 | (pending / date) |
| Naming research prompt | `candidate-names-prompt.md` | ASSESSMENT-04 | (pending / date) |
| Distribution plan | `<YYYY-MM-DD>-launch-distribution-plan.user.md` | ASSESSMENT-06 | (pending / date) |
| Measurement plan | `<YYYY-MM-DD>-measurement-profile.user.md` | ASSESSMENT-07 | (pending / date) |
| Current situation | `<YYYY-MM-DD>-operator-context.user.md` | ASSESSMENT-08 | (pending / date) |

## Key Sources

- [5–6 anchor sources only; full list in market intel or research appendix]
```

**Downstream consumer:** `/lp-do-assessment-02-solution-profiling --business <BIZ>` reads this file as its primary input.

## Quality Gate

Before saving, verify all items:

- [ ] Frontmatter block present with all required fields (Type, Stage, Business, Status, Created, Method, Downstream)
- [ ] Core Problem uses customer language; no solution framing, no "need" / "should build" / product names
- [ ] Core Problem describes the structural gap, not just "a problem exists" — must name why the market fails
- [ ] At least one affected user group is named with specific qualifying detail and confidence tag
- [ ] Segmentation note present if a meaningful sub-segment boundary affects product or copy
- [ ] Severity AND frequency qualified separately per segment — not combined as "significant"
- [ ] Every severity/frequency claim carries a confidence tag: (checked), (claimed-by-sources), (inferred), or (unknown — gap)
- [ ] Workarounds are in table format with all four columns populated
- [ ] Documented failure states subsection present with at least two named failure modes and sources
- [ ] Every evidence item carries a confidence tag: (checked), (claimed-by-sources), or (inferred)
- [ ] Research appendix created and linked if evidence set exceeds 8 items
- [ ] Problem boundary section present with both In-scope and Out-of-scope subsections
- [ ] Open questions section present with exactly the top 8 priority questions
- [ ] Each kill condition has Status + Evidence basis + "Unblocked by:" path
- [ ] No kill condition left as "N/A" or empty
- [ ] STOP advisory present and explicit if any kill condition is FAIL
- [ ] Downstream artifacts table present and complete
- [ ] Key sources section present (5–6 max in main document)
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Core Problem describes a solution: "users need X," "users want a platform for Y"
- Core Problem is so broad it applies to any business: "people want to save time," "businesses want more customers"
- Affected user group is generic: "small businesses," "consumers," "people who shop online"
- Severity or frequency stated as "high" or "significant" without a qualifier or evidence tag
- Workarounds as prose list instead of table — table format is required
- Documented failure states section missing or containing only "users are unhappy"
- Evidence items with no confidence tag — every item must be tagged
- Kill condition section with Pass/Fail but no "Unblocked by:" path — provisional PASS without an unblocking condition is not acceptable
- STOP advisory suppressed when a kill condition is FAIL
- Downstream artifacts table missing
- Frontmatter block missing
- Artifact not saved (output must be written to file, not only displayed in chat)

## Research Appendix Pattern

When the problem has significant supporting research (>8 evidence items, or when first-party validation questions have been researched and answered), create:

**Path:** `docs/business-os/strategy/<BIZ>/s0a-research-appendix.user.md`

**Frontmatter:**
```
Stage: ASSESSMENT-01
Business: <BIZ>
Created: <YYYY-MM-DD>
Status: Complete / Partial — [sections complete]
Questions-source: Problem Statement <date> operator brief
```

Structure by question category (e.g., A: Segment clarity, B: Frequency/severity, C: JTBD, D: Workarounds, E: WTP, F: Product requirements, G: Organisation, H: Channels/trust, I: Kill-condition proof tests). Each section: question asked → research findings → sources → what remains unknown.

Reference from the main problem statement as: `*Full evidence set in research appendix: \`s0a-research-appendix.user.md\`*`

## Integration

**Upstream (S0):** `/startup-loop start --start-point problem` triggers this skill before S0 intake begins.

**Downstream:** `/lp-do-assessment-02-solution-profiling --business <BIZ>` reads `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-problem-statement.user.md` as its primary input. Do not proceed to solution space if a STOP advisory is present without operator acknowledgement.

## Reference Artifacts

High-quality examples to consult before writing:
- `docs/business-os/strategy/HEAD/<YYYY-MM-DD>-problem-statement.user.md` — CI accessory retention business; strong on: confidence tagging, problem boundary, user group demographic grounding, structured kill conditions
- `docs/business-os/strategy/HBAG/<YYYY-MM-DD>-problem-statement.user.md` — artisan bag accessories; strong on: forced-choice binary Core Problem framing, workarounds table, documented failure states, "Unblocked by:" kill condition format, research appendix separation
