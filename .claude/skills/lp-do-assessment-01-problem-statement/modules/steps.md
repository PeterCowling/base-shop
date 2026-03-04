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
