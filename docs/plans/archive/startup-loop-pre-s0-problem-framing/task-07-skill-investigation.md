---
Type: Investigation
Status: Complete
Created: 2026-02-20
Plan: docs/plans/startup-loop-pre-s0-problem-framing/plan.md
Task: TASK-07
---

# TASK-07: Skill Content Patterns Investigation

Investigation notes covering four reference skills to establish a content quality baseline and draft acceptance criteria for TASK-08 (lp-problem-frame, lp-solution-profiling, lp-option-select).

## Questions to Answer

1. What is the minimum acceptable SKILL.md depth for a stage skill?
2. Does lp-solution-profiling follow the prompt-handoff model or direct execution?
3. What kill-condition language pattern is used in existing gate-bearing skills?
4. What are the correct output artifact paths for each of the three new skills?

---

## Reference Skill Summary

### lp-readiness (S1) — Direct execution, inline verdict, binary gate

**Model:** Direct execution — reads docs, runs 3 gate checks (RG-01 Offer Clarity, RG-02 Distribution Feasibility, RG-03 Measurement Plan), emits GO/NO-GO verdict inline in conversation. No file artifact produced.

**Kill-condition language:** Binary, explicit:
- "NO-GO if any gate fails"
- "Does NOT attempt to fix failures — fail fast with clear reason."
- "If NO-GO → user must address fail reasons, then re-run /lp-readiness."

**Depth:** ~750 words. Sections: Invocation, Operating Mode, Inputs, Readiness Gates (3 named gates with criteria), Workflow (3 stages), Output Contract, Quality Checks (5 items), Red Flags (8 items), Integration (upstream/downstream/parallel).

**Minimum required sections:** All gate blocks, workflow stages, output contract, QC checklist, red flags.

---

### lp-offer (S2B) — Direct execution + parallel subagents, written artifact

**Model:** Direct execution with parallel subagent dispatch (one per competitor). Produces `docs/business-os/startup-baselines/<BIZ>-offer.md`.

**Kill-condition language:** No binary GO/NO-GO. Quality gate is self-audit. Kill at invalid output via Red Flags (10 items, e.g., "missing any of the 6 sections", "ICP too broad"). Subagent failures quarantined, not fatal.

**Depth:** ~1,300+ words. 6 mandatory artifact sections with full schemas. QC: 10 checks. Red flags: 10 conditions.

**Output path:** `docs/business-os/startup-baselines/<BIZ>-offer.md`

---

### lp-channels (S6B) — Direct execution via module delegation, written artifact

**Model:** Direct execution, delegates to 3 module files (channel-research.md, channel-strategy.md, channel-gtm-output.md). Produces `docs/business-os/startup-baselines/<BIZ>-channels.md`.

**Kill-condition language:** Named gate GATE-S6B-ACT-01 (DEP check before spend authorization). Channel-level degradation: DEP fail → channel downgrades to `strategy-only`; skill does not halt. No skill-level NO-GO.

**Depth:** ~550 words in SKILL.md (thin dispatcher); full depth in module files.

**Output path:** `docs/business-os/startup-baselines/<BIZ>-channels.md`

---

### brand-naming-research (S0D) — Prompt-handoff model, strategy tree output

**Model:** Prompt-handoff only. OPERATING MODE: "RESEARCH BRIEF AUTHORING ONLY". Reads startup loop docs, compiles a structured Perplexity-ready research prompt. Never generates names or issues a verdict. Completion: "Drop into Perplexity Deep Research or equivalent."

**Kill-condition language:** None. Quality gate is self-audit checklist (8 items). Proceeds with missing inputs (notes gaps, does not halt).

**Depth:** ~950 words. 8 mandatory prompt sections, each with sub-requirements.

**Output path:** `docs/business-os/strategy/<BIZ>/candidate-names-prompt.md`
- Fixed filename (not `<BIZ>-candidate-names-prompt.md`) — BIZ encoded in directory path only.

---

## Cross-Skill Patterns Established

### Pattern A: Operating model taxonomy

| Model | Skills |
|---|---|
| Direct execution (full) | lp-readiness, lp-offer, lp-channels |
| Prompt-handoff only | brand-naming-research |

The operating mode must be stated explicitly in the first section, as brand-naming-research does: "RESEARCH BRIEF AUTHORING ONLY" + enumerated Not Allowed list.

### Pattern B: Output destinations

| Cluster | Path pattern | Filename convention |
|---|---|---|
| startup-baselines | `docs/business-os/startup-baselines/<BIZ>-{artifact}.md` | `{BIZ}-{artifact-id}.md` |
| strategy tree | `docs/business-os/strategy/<BIZ>/{filename}.md` | Fixed name, BIZ in directory |

The three new skills sit in the strategy tree (same as brand-naming-research and existing S0D output), not startup-baselines.

### Pattern C: Kill-condition language gradient

| Type | Pattern | Example |
|---|---|---|
| Binary gate (strong) | "NO-GO if X" + re-run instruction | lp-readiness RG-01/02/03 |
| Named spend gate (channel-level) | "mark channel strategy-only; do NOT authorize spend" | lp-channels GATE-S6B-ACT-01 |
| Red flags / self-audit | "Invalid outputs that MUST be rejected" + list | lp-offer Red Flags |
| Soft / no kill | Quality checklist only, proceeds with gaps | brand-naming-research |

For lp-option-select (explicit kill gate required by fact-find): use the lp-readiness binary gate pattern: "Explicit decision record required to continue. If operator cannot identify a viable option → STOP. Do not advance to S0D." Output verdict GO/NO-GO inline, plus written decision artifact.

For lp-problem-frame (kill on non-viable problem): softer — Red Flags style: "If problem is not meaningful enough for a viable business (too narrow, already solved, not painful enough): include kill-condition language in output artifact recommending the operator pause before S0B."

### Pattern D: Minimum depth per skill type

| Type | Minimum words (SKILL.md) | Required sections |
|---|---|---|
| Verdict/gate skill | ~700–800w | Invocation, Operating Mode, Inputs, Gates/Steps, Output Contract, QC Checklist, Red Flags, Integration |
| Prompt-handoff skill | ~800–1000w | Invocation, Operating Mode, Required Inputs (preflight), Output, Prompt Structure (sections with sub-requirements), Quality Gate, Completion Message |
| Direct execution + written artifact | ~800–1200w | Invocation, Operating Mode, Inputs, Workflow (stages), Output Contract, QC Checklist, Red Flags, Integration |

For the three new skills: targeting ~600–800w (they are simpler than lp-offer/lp-channels; lp-readiness's ~750w is the better comparator). lp-solution-profiling follows the brand-naming-research prompt-handoff pattern (~950w).

### Pattern E: Section heading conventions

Standard headings across skills (not all required for every skill type):
- `Invocation` — how to invoke the skill
- `Operating Mode` — what is allowed/not allowed
- `Inputs` — required and optional files/flags
- `Workflow` / `Steps` — stage-by-stage instructions
- `Output Contract` — exact artifact structure + paths
- `Quality Checks` / `Quality Gate` — self-audit checklist
- `Red Flags` — invalid output conditions (for direct execution skills)
- `Completion Message` — what to output when done (for prompt-handoff skills)
- `Integration` — upstream/downstream skill linkage

---

## Per-Skill Acceptance Criteria for TASK-08

### lp-problem-frame/SKILL.md

**Model:** Direct execution. Reads business docs + operator brief. Produces problem statement artifact. Gate: soft kill on non-viable problem.

**Required sections:**
1. `Invocation` — `/lp-problem-frame --business <BIZ>`
2. `Operating Mode` — direct execution, READ business context, WRITE artifact
3. `Inputs` — required: business name/brief; optional: any existing market notes
4. `Steps` — must produce: problem statement, affected user groups, severity/frequency, current workarounds, evidence pointers, kill-condition note if problem not viable
5. `Output Contract` — path: `docs/business-os/strategy/<BIZ>/problem-statement.user.md`; format: structured markdown with named sections
6. `Quality Gate` — checklist covering: problem stated in user language (not consultant-speak), severity quantified or at least qualified, workarounds documented, kill-condition section present
7. `Integration` — upstream: S0 intake (receives `--start-point problem`); downstream: S0B lp-solution-profiling

**Kill-condition requirement:** Red Flags section must include: "If problem is too narrow, already solved by well-funded incumbents, or not painful enough to generate willingness to pay — include explicit STOP advisory in output artifact. Do not suppress this finding."

**Target depth:** ~650–750 words.

**TC-TASK08-01:** File exists at `.claude/skills/lp-problem-frame/SKILL.md`
**TC-TASK08-02:** Contains all 7 required sections
**TC-TASK08-03:** Steps include all 6 required outputs (problem statement, user groups, severity/frequency, workarounds, evidence pointers, kill-condition note)
**TC-TASK08-04:** Output artifact path = `docs/business-os/strategy/<BIZ>/problem-statement.user.md`

---

### lp-solution-profiling/SKILL.md

**Model:** Prompt-handoff ONLY (same as brand-naming-research). Reads problem-statement.user.md from S0A. Produces a structured Perplexity-ready research prompt for 5–10 candidate product-type options. Operator runs prompt in external tool; results artifact is input to S0C.

**Key constraint:** **Feasibility flags only — no demand scoring until S2.** This is an anchoring risk: if S0B enables demand scoring, operators anchor on a demand hypothesis before they have market data (S2 is the market intelligence stage). This must be stated explicitly in Operating Mode.

**Required sections:**
1. `Invocation` — `/lp-solution-profiling --business <BIZ>`
2. `Operating Mode` — "SOLUTION SPACE PROMPT AUTHORING ONLY. Feasibility flag only — no demand scoring until S2." + Not Allowed list (generating recommendations, scoring demand, issuing verdicts)
3. `Required Inputs` — `docs/business-os/strategy/<BIZ>/problem-statement.user.md` (required); business brief (optional)
4. `Output` — two-part: (a) research prompt file, (b) results artifact slot (for operator to fill after Perplexity run)
5. `Prompt Structure` — mandatory sections: Role/method, Problem context (from S0A), Solution type landscape (consumer/B2B/hybrid/platform), Per-option feasibility criteria, Regulatory/compliance flags, Manufacturing/supply chain flags, Deliverables format (5–10 options, each with: option name, brief description, feasibility signal, regulatory flag, estimated complexity)
6. `Handoff Note` — explicit: "After running this prompt in Perplexity Deep Research, save the results to `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md`. This file is the primary input to `/lp-option-select`."
7. `Quality Gate` — checklist: prompt contains all mandatory sections, no demand scoring language present, output artifact paths correct, problem context is direct quote/paraphrase from problem-statement.user.md (not reformulated)
8. `Completion Message` — "Drop into Perplexity Deep Research or equivalent. Save results to the path above, then run `/lp-option-select --business <BIZ>`."

**Output paths:**
- Prompt: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profiling-prompt.md`
- Results (filled by operator): `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md`

**Target depth:** ~850–950 words.

**TC-TASK08-05:** File exists at `.claude/skills/lp-solution-profiling/SKILL.md`
**TC-TASK08-06:** Operating Mode explicitly states "feasibility flag only — no demand scoring until S2"
**TC-TASK08-07:** Handoff note present pointing to `/lp-option-select` and specifying results artifact path
**TC-TASK08-08:** Prompt structure section covers 6+ required sub-sections

---

### lp-option-select/SKILL.md

**Model:** Direct execution. Reads solution-profile-results.user.md from operator's Perplexity run. Produces shortlist of 1–2 options with elimination rationale. Explicit binary kill gate: "explicit decision record required to continue."

**Required sections:**
1. `Invocation` — `/lp-option-select --business <BIZ>`
2. `Operating Mode` — direct execution; reads solution-profiling results artifact; produces decision record
3. `Inputs` — required: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md`
4. `Steps` — must produce: (a) evaluation matrix (options × 4+ criteria), (b) shortlist of 1–2 options, (c) elimination rationale for dropped options, (d) kill gate check
5. `Output Contract` — path: `docs/business-os/strategy/<BIZ>/solution-select.user.md`; format: structured markdown with evaluation matrix + verdict section + elimination log
6. `Kill Gate` — **binary, blocking**: "Explicit decision record required to continue to S0D. If operator cannot identify at least one viable option from the solution-profiling results, STOP. Do not advance to S0D (naming handoff). Re-run `/lp-solution-profiling` with a refined problem scope, or return to `/lp-problem-frame`."
7. `Quality Gate` — checklist: ≥2 criteria used for elimination (not gut feel), elimination rationale documented, viable option passes feasibility threshold (not just "interesting")
8. `Integration` — upstream: S0B lp-solution-profiling results artifact; downstream: S0D brand-naming-research

**Kill-condition requirement (direct from plan):** The output document must contain a dedicated `## Decision` section with explicit GO/NO-GO verdict and the option name(s) to carry forward.

**Target depth:** ~600–700 words.

**TC-TASK08-09:** File exists at `.claude/skills/lp-option-select/SKILL.md`
**TC-TASK08-10:** Kill gate language: "Explicit decision record required to continue"
**TC-TASK08-11:** Steps include evaluation matrix, shortlist, and elimination rationale
**TC-TASK08-12:** Output artifact path = `docs/business-os/strategy/<BIZ>/solution-select.user.md`

---

## Summary Answers to TASK-07 Questions

1. **Minimum SKILL.md depth:** ~650–950 words depending on type; 6–8 mandatory sections; prompt-handoff skills need full prompt structure; direct execution skills need gate/step logic + output contract.

2. **lp-solution-profiling model:** Prompt-handoff ONLY (same pattern as brand-naming-research). The skill produces a Perplexity prompt; the operator runs the research externally. The skill must NOT generate solution recommendations or score demand.

3. **Kill-condition language patterns:**
   - Strong binary gate (lp-readiness): "NO-GO if X. Does NOT attempt to fix failures."
   - Spend gate (lp-channels): "mark strategy-only; do NOT authorize spend"
   - Soft kill (Red Flags style): "include STOP advisory in output artifact"
   - lp-option-select: use strong binary gate pattern — "Explicit decision record required to continue."
   - lp-problem-frame: use soft kill (Red Flags) — "include STOP advisory if problem not viable."

4. **Output artifact paths:**
   - lp-problem-frame: `docs/business-os/strategy/<BIZ>/problem-statement.user.md`
   - lp-solution-profiling: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profiling-prompt.md` (prompt) + `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-profile-results.user.md` (results slot)
   - lp-option-select: `docs/business-os/strategy/<BIZ>/solution-select.user.md`
   - All three are in the strategy tree (not startup-baselines), consistent with brand-naming-research (S0D).
