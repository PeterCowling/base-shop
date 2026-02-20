---
name: lp-problem-frame
description: Problem framing for new startups (S0A). Produces a falsifiable problem statement artifact before entering S0 intake. Upstream of lp-solution-space.
---

# lp-problem-frame — Problem Framing (S0A)

Produces a clear, falsifiable problem statement before the operator enters S0 (Intake). Run this when starting from a customer problem rather than a committed product hypothesis.

## Invocation

```
/lp-problem-frame --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier (e.g., PET, HEAD, BRIK)

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

Scan all files in the search paths. Load operator-provided description if present. Extract any mentions of customer pain, complaints, friction, workarounds, or unmet needs. Ignore solution language for now.

### Step 2: Draft the problem statement

Write 1-2 sentences in customer language. The sentence must describe what customers cannot do, experience, or achieve — not what they need or want built. No product names, no solution framing.

### Step 3: Identify affected user groups

Name the specific segment(s) experiencing this problem. Avoid "everyone" or "businesses." Qualify by role, situation, or behaviour pattern (e.g., "first-time dog owners with active breeds," not "pet owners").

### Step 4: Qualify severity and frequency

State how painful the problem is and how often it occurs. Use explicit qualifiers: daily/weekly/monthly, major friction/minor inconvenience, financial impact, time cost, emotional cost. If unknown, say so and note what evidence would resolve it.

### Step 5: Document current workarounds

List what affected users do today instead of solving the problem properly. Workarounds reveal that the problem exists and is tolerated. At least one workaround must be named; if none are known, flag as an evidence gap.

### Step 6: Record evidence pointers

List any signals that this problem is real: search volume data, forum complaints, support ticket themes, competitor reviews, operator's direct experience, industry reports. Cite sources. If evidence is thin, state that explicitly — do not inflate confidence.

### Step 7: Assess kill condition

Evaluate whether the problem is meaningful enough to build a viable business around. Check three failure modes:
- Problem is too narrow (addressable market too small for viability)
- Problem is already solved by well-funded incumbents with defensible positions
- Problem is not painful enough to generate willingness to pay

Write a non-empty assessment. If any failure mode applies, write an explicit STOP advisory in the `## Kill Condition` section — do not suppress this finding.

### Step 8: Write and save artifact

Assemble the six outputs into the structured format below. Save to the output path.

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/problem-statement.user.md`

**Format:**

```markdown
# Problem Statement — <BIZ>

## Problem Statement

[1-2 sentences, customer language, no solution framing]

## Affected User Groups

[Specific named segments with qualifying context]

## Severity and Frequency

[Explicit qualifiers: how painful, how often, impact estimate]

## Current Workarounds

[What affected users do today instead]

## Evidence Pointers

[Signals that the problem is real; cite sources; flag thin evidence]

## Kill Condition

[Assessment against the three failure modes; STOP advisory if any apply]
```

**Downstream consumer:** `/lp-solution-space --business <BIZ>` reads this file as its primary input.

## Quality Gate

Before saving, verify all items:

- [ ] Problem statement is in customer language, not consultant-speak
- [ ] Problem statement contains no solution language ("need", "should build", "platform", "tool", "app")
- [ ] At least one affected user group is named with specific qualifying detail
- [ ] Severity or frequency is qualified or quantified — not left as "significant" or "common"
- [ ] At least one current workaround is documented
- [ ] Evidence pointers section lists at least one signal (or explicitly flags thin evidence as a gap)
- [ ] Kill condition section is present and non-empty
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Problem statement describes a solution: "users need X," "users want a platform for Y," "there is no app that does Z"
- Kill condition section is missing or contains only "N/A" or placeholder text
- Problem is so broad it applies to any business ("people want to save time," "businesses want more customers")
- Affected user group is generic ("small businesses," "consumers," "people who shop online")
- Evidence pointers cite no sources and do not flag the gap
- **If the problem is too narrow, already solved by well-funded incumbents, or not painful enough to generate willingness to pay — include an explicit STOP advisory in the artifact under `## Kill Condition`. Do not suppress this finding.**
- Artifact not saved (output must be written to file, not only displayed in chat)

## Integration

**Upstream (S0):** `/startup-loop start --start-point problem` triggers this skill before S0 intake begins.

**Downstream:** `/lp-solution-space --business <BIZ>` reads `docs/business-os/strategy/<BIZ>/problem-statement.user.md` as its primary input. Do not proceed to solution space if a STOP advisory is present without operator acknowledgement.
