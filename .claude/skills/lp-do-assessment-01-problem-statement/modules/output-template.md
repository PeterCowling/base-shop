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
