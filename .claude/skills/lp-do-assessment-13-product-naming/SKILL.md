---
name: lp-do-assessment-13-product-naming
description: Full product naming pipeline orchestrator (ASSESSMENT-13). Runs four parts in sequence: (1) produce <YYYY-MM-DD>-product-naming-spec.md from ASSESSMENT docs, (2) agent generates 75 scored candidates across naming territories, (3) TM pre-screen direction for all candidates via tm-prescreen-cli.ts, (4) filter and rank to produce a top-20 shortlist. Delivers a final operator-ready shortlist of scored candidates with EUIPO/WIPO/UIBM search direction pre-generated.
---

# lp-do-assessment-13-product-naming — Product Naming Pipeline (ASSESSMENT-13)

Orchestrates the complete four-part product naming pipeline from a standing start to a TM-prescreened, ranked shortlist. The operator receives a shortlist where every name has a DWPEIC quality score and TM search direction URLs pre-generated for immediate review.

This pipeline is distinct from ASSESSMENT-04/05 (business name pipeline):
- **Business name** (ASSESSMENT-04/05): 250 candidates → RDAP .com availability check → top 20 available
- **Product name** (ASSESSMENT-13): 75 candidates → TM pre-screen direction → top 20 by score

The domain check is not applicable to product names (the brand domain is already owned). The TM pre-screen runs automatically to generate EUIPO, WIPO GBD, and UIBM search direction URLs; the operator reviews the URLs for their preferred candidates before confirming a selection.

## Invocation

```
/lp-do-assessment-13-product-naming --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

**ASSESSMENT-12 note:** Before running this skill, the operator should have run `/lp-do-assessment-12-promote` to promote the brand identity dossier from Draft to Active. ASSESSMENT-12 is a skill-only gate — not enforced by GATE-ASSESSMENT-01. If the dossier remains Draft, proceed with a provisional note but flag the gap to the operator.

**ASSESSMENT-03 gate:** If no ASSESSMENT-03 product option selection artifact exists, halt and emit:
> "ASSESSMENT-03 artifact not found at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-option-selection.user.md`. A confirmed product option is required before product naming can begin. Run `/lp-do-assessment-03-solution-selection --business <BIZ>` first."

Rerunnable. If a spec and/or candidates file already exist from a prior round, the pipeline resumes from the correct part — see §Resume logic below.

---

## Pipeline overview

| Part | Name | What happens | Tool |
|------|------|--------------|------|
| 1 | **Spec** | Read ASSESSMENT docs → write `<YYYY-MM-DD>-product-naming-spec.md` | Inline |
| 2 | **Generate** | Read spec → generate 75 DWPEIC-scored candidates → write `product-naming-candidates-<date>.md` | Spawn general-purpose agent |
| 3 | **TM pre-screen** | Generate EUIPO/WIPO/UIBM search direction for all candidates → write `product-naming-tm-<date>.txt` + sidecar events | Bash (tm-prescreen-cli.ts) |
| 4 | **Shortlist** | Sort by score → write `product-naming-shortlist-<date>.user.md` with top 20 and embedded TM URLs | Inline |

All four parts run sequentially. Each part gates on the output of the prior part.

---

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| ASSESSMENT intake packet | `docs/business-os/startup-baselines/<BIZ>-<YYYY-MM-DD>assessment-intake-packet.user.md` | Yes — primary source for product definition and ICP |
| Product option selection | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-option-selection.user.md` | Yes — confirmed product type and product category |
| Brand profile | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md` | Yes — personality adjective pairs, voice & tone, positioning constraints |
| Business name shortlist | `docs/business-os/strategy/<BIZ>/latest-naming-shortlist.user.md` | Yes if present — confirms the approved business name and expansion-headroom rationale |
| Brand identity dossier | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | No — read if present for imagery direction and aesthetic constraints |
| Distribution plan | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-launch-distribution-plan.user.md` | No — read if present for channel-specific naming constraints (e.g., Etsy character limits) |

---

## Execution

### Part 1 — Spec

Read all available ASSESSMENT artifacts and write `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming-spec.md`.

The spec must contain:

**§1. Brand-product name relationship**
- The approved business name and its expansion-headroom rationale (why it is not product-specific)
- The compound pattern chosen: `[Business Name] [Line Name]`
- Naming convention for future SKUs (how additional products in the line will be named)

**§2. Product context**
- Hero product type, category, price point, quality tier
- ICP primary audience summary (not re-elicited — extracted from intake docs)
- Distribution channels and any naming constraints they impose (e.g., Etsy 140-char limit, Instagram handle availability)

**§3. DWPEIC scoring rubric**
Six dimensions (max 30). Dimensions D–E are universal; I and C must be written from the ASSESSMENT docs.

- **D — Distinctiveness (1–5):** TM ownability; not confusable with competitors or common words in the category
- **W — Wordmark quality (1–5):** 7–12 characters, visual rhythm, works as a handle and in compound with business name
- **P — Phonetic quality (1–5):** Flows naturally in launch language(s), soft vowels, 2–4 syllables, memorable aurally
- **E — Expansion headroom (1–5):** Works for adjacent products in the brand's extension range without feeling product-trapped
- **I — ICP resonance (1–5):** Written from ASSESSMENT docs — would the primary buyer stop scrolling at this name? Reference specific buyer, platform, and context
- **C — Category signal (1–5):** How clearly does the name, in compound with the business name, signal the product category to a new buyer on a product listing page?

Composite: sum D+W+P+E+I+C. Maximum 30.

**§4. Naming territories and morpheme pools**
Define 4–6 naming territories specific to this product. For each territory:
- Territory name and rationale (why it is relevant to this product and ICP)
- 10–15 candidate seeds or morpheme fragments drawn from the brand's relevant vocabulary
- Target count: ~15 names per territory

Example territories for a CI accessory brand: Italian product-type (form-factor vocabulary), Italian benefit (functional benefit vocabulary), Italian routine (habitual wear vocabulary), coined diminutive (warmth + energy), international loan words

**§5. Hard blockers and elimination list**

5.1 Regulatory / category hard blockers (specific to this product — e.g., EU MDR proximity for medical-adjacent products)
5.2 Anti-patterns the brand explicitly rejects (extracted from brand profile "NOT" constraints)
5.3 Eliminated names from prior rounds (format: `Round N (date): Name1 (reason), Name2 (reason)`)

**§6. Output format**
Produce a markdown table with exactly these columns. One row per name. 75 rows total.

```
| # | Line Name | Full Compound | Territory | D | W | P | E | I | C | Score | Provenance |
```

Sort by Score descending. After the table, write a one-paragraph summary covering territory distribution, score distribution (≥24 / 18–23 / ≤17), and which territories produced the strongest candidates.

---

If `<YYYY-MM-DD>-product-naming-spec.md` already exists from a prior round, update it in place: add eliminated names to §5.3, update ICP if changed, increment the round note. Do not create a new spec from scratch.

Gate: spec exists and is dated today before proceeding to Part 2.

---

### Part 2 — Generate

Spawn a **general-purpose agent** (model: sonnet) with the following prompt, substituting `<BIZ>` and `<SPEC_PATH>`:

> Read `<SPEC_PATH>` in full before doing anything else. Then generate exactly 75 product line name candidates following the spec exactly — §3 DWPEIC scoring rubric, §4 naming territories and morpheme pools, §5 hard blockers and elimination list, §6 output format. Every name must have a territory label, provenance note, and six dimension scores. The Line Name and Full Compound columns are both required for every row. Sort the output table by Score descending. After the table, write the one-paragraph summary required by §6. Save the complete output (table + summary) to `docs/business-os/strategy/<BIZ>/product-naming-candidates-<YYYY-MM-DD>.md`. Do not stop early. Do not skip the provenance notes. Do not reuse any name from §5.3.

Do not proceed to Part 3 until the candidates file exists and contains a table with ≥ 65 rows.

Gate: `product-naming-candidates-<date>.md` exists with ≥ 65 rows.

---

### Part 3 — TM pre-screen

Extract all Line Names from the candidates file and pipe them through `tm-prescreen-cli.ts` to generate EUIPO, WIPO GBD, and UIBM search direction URLs for every candidate.

```bash
DATE=$(date +%Y-%m-%d)
BIZ="<BIZ>"
CANDIDATES="docs/business-os/strategy/${BIZ}/product-naming-candidates-${DATE}.md"
OUT="docs/business-os/strategy/${BIZ}/product-naming-tm-${DATE}.txt"

# Extract Line Name column (col 2) from markdown table, skip header rows
grep "^|" "$CANDIDATES" \
  | tail -n +3 \
  | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' \
  | grep -v "^$\|^Line Name$\|^#" \
  | TM_BUSINESS="${BIZ}" \
    TM_RUN_DATE="${DATE}" \
    TM_ROUND=1 \
    TM_SIDECAR_DIR="docs/business-os/strategy/${BIZ}/product-naming-sidecars" \
    npx ts-node scripts/src/startup-loop/naming/tm-prescreen-cli.ts \
  | tee "$OUT"

echo ""
echo "TM pre-screen direction generated for $(wc -l < "$OUT" | tr -d ' ') candidates."
echo "Sidecar events written to docs/business-os/strategy/${BIZ}/product-naming-sidecars/${DATE}-round-1.jsonl"
```

The TM pre-screen direction file (`product-naming-tm-<date>.txt`) contains EUIPO search URL, WIPO GBD search URL, and UIBM bancadati direction for each candidate. Nice Classification classes default to 25 and 26 — override with `TM_NICE_CLASSES=<classes>` if the product falls in a different class.

Gate: `product-naming-tm-<date>.txt` exists before proceeding to Part 4.

---

### Part 4 — Shortlist

Read the candidates table. Produce the final shortlist:

1. Sort all 75 candidates by Score descending
2. For ties, sort by I (ICP resonance) descending, then by C (Category signal) descending, then alphabetically
3. Take the top 20 as the working shortlist
4. For each shortlist entry, embed the EUIPO and WIPO GBD search URLs from the TM direction file

Save to `docs/business-os/strategy/<BIZ>/product-naming-shortlist-<YYYY-MM-DD>.user.md` with this structure:

```markdown
---
Type: Product-Naming-Shortlist
Stage: ASSESSMENT-13-pipeline
Business-Unit: <BIZ>
Business-Name: <confirmed business name>
Status: Draft
Created: <YYYY-MM-DD>
Updated: <YYYY-MM-DD>
Owner: Pete
Source-Candidates: docs/business-os/strategy/<BIZ>/product-naming-candidates-<YYYY-MM-DD>.md
Source-TM: docs/business-os/strategy/<BIZ>/product-naming-tm-<YYYY-MM-DD>.txt
Source-Spec: docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming-spec.md
---

# <Business Name> Product Naming Shortlist (Round N)

<Brief summary of the run: N candidates generated across M territories. Top 20 presented below. TM pre-screen direction pre-generated for all candidates — review the EUIPO and WIPO links for your preferred choices before confirming a selection.>

**Operator action required:** Review the shortlist below. For each finalist, complete the TM pre-screen by visiting the EUIPO URL and WIPO URL in `product-naming-tm-<YYYY-MM-DD>.txt`. Record results in the TM Pre-Screen Status column. Then confirm a selection in Section C.

---

## A) Shortlist — Top 20 Candidates by DWPEIC Score

| Rank | Line Name | Full Compound | Territory | Score | D | W | P | E | I | C | TM Pre-Screen Status |
|------|-----------|---------------|-----------|------:|---|---|---|---|---|---|----------------------|
| 1 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | Pending operator check |
...

---

## B) Curator's Analysis — Top Candidates by Territory

<For each territory represented in the top 20, write 2–3 sentences: which candidates stood out, why, and which is the lead recommendation for that territory. Reference the DWPEIC dimension scores specifically.>

---

## C) Operator Selection

**Instructions:** Review the TM pre-screen links in `product-naming-tm-<YYYY-MM-DD>.txt` before confirming a selection. Record TM results in Section A's TM Pre-Screen Status column, then confirm below.

**Operator selected:** {TBD — to be confirmed by operator after TM pre-screen review}

**Selection rationale:** {To be filled by operator}

**Next step after selection:** Run `/lp-do-assessment-14-logo-brief --business <BIZ>` to produce the logo design brief.

---

## D) Score Distribution

- ≥ 24: N names
- 18–23: N names
- ≤ 17: N names

## E) Territory Breakdown

- <Territory 1>: N names
- <Territory 2>: N names
...

## F) TM Pre-Screen Direction Reference

Full TM direction output (EUIPO, WIPO GBD, UIBM for all candidates):
`docs/business-os/strategy/<BIZ>/product-naming-tm-<YYYY-MM-DD>.txt`

Sidecar events:
`docs/business-os/strategy/<BIZ>/product-naming-sidecars/<YYYY-MM-DD>-round-N.jsonl`

Recommended Nice Classification classes: <from spec §5>
```

---

## Resume logic

If the pipeline is interrupted or rerun, check which parts are already complete:

| Condition | Resume from |
|-----------|-------------|
| No spec exists | Part 1 |
| Spec exists, no candidates file | Part 2 |
| Candidates file exists, no TM direction file | Part 3 |
| TM direction file exists, no shortlist | Part 4 |
| Shortlist exists | Pipeline complete — await operator review |

When resuming from Part 2 after a new round, use a new date-stamped candidates filename so prior rounds are preserved.

---

## New round

A new round is triggered in two ways:

**Automatically** — if the quality gate finds fewer than 10 candidates with score ≥ 18 after Part 4.

**User-triggered** — if the operator reviews the shortlist and rejects it (says "none of these work", "try again", "I don't like these", or equivalent). If the operator says why (e.g., "too clinical", "doesn't sound Italian enough"), capture that as a rejection note and encode it as an additional anti-criterion in the next round's spec.

**New round procedure:**
1. Add all names from the current candidates file to §5.3 of the spec (reason: "operator rejected" for names the operator did not want; "TM conflict" for names where the operator confirmed a conflict after TM review).
2. Increment the round counter in the spec.
3. Re-run Parts 2–4 with a fresh date stamp. Do not re-run Part 1 unless the ICP or product has changed.
4. Present the new shortlist.

There is no cap on the number of rounds.

---

## Quality gate (before declaring pipeline complete)

- [ ] `<YYYY-MM-DD>-product-naming-spec.md` written with all 6 sections
- [ ] `product-naming-candidates-<date>.md` contains ≥ 65 rows with DWPEIC scores and Full Compound column
- [ ] `product-naming-tm-<date>.txt` contains a TM direction entry for every candidate
- [ ] `product-naming-shortlist-<date>.user.md` contains top 20 with TM Pre-Screen Status column
- [ ] Sidecar events JSONL written to `product-naming-sidecars/`
- [ ] If fewer than 10 candidates score ≥ 18: trigger new round automatically

---

## Completion message

Present the top 10 from the shortlist inline:

> **Score key:** D = Distinctiveness · W = Wordmark quality · P = Phonetics · E = Expansion headroom · I = ICP resonance · C = Category signal · Score = sum out of 30
>
> **Product naming pipeline complete — <BIZ> Round N**
> 75 candidates generated across N territories. Top 10:
>
> | Rank | Line Name | Full Compound | Score | D | W | P | E | I | C |
> |------|-----------|---------------|-------|---|---|---|---|---|---|
> | 1 | ... | ... | ... | ... | ... | ... | ... | ... | ... |
>
> TM pre-screen direction pre-generated for all 75 candidates.
> Full shortlist (top 20) saved to:
> - `product-naming-shortlist-<date>.user.md` (source of truth)
> - TM direction: `product-naming-tm-<date>.txt`
>
> **Next:** Review the TM direction file for your preferred picks. To select a name, say which one. To reject and try again, say "none of these work" — optionally tell me why and I'll encode it as a constraint for Round 2.

---

## Integration

**Upstream (ASSESSMENT-11/12):**
- Reads `<YYYY-MM-DD>-brand-identity-dossier.user.md` (ASSESSMENT-11) for personality and aesthetic constraints.
- ASSESSMENT-12 (dossier promotion gate) should be run before this skill but is not enforced by GATE-ASSESSMENT-01. If the dossier is still Draft, proceed with a provisional note.

**Upstream (ASSESSMENT-03):**
- Reads the confirmed product option selection as the primary product type input.

**Downstream (ASSESSMENT-14):**
- `product-naming-shortlist-<date>.user.md` is the source for the confirmed product name used by `/lp-do-assessment-14-logo-brief`. ASSESSMENT-14 uses the confirmed Line Name (and Full Compound) to inform the mark type decision and wordmark feasibility check.

**Downstream (ASSESSMENT-15):**
- `/lp-do-assessment-15-packaging-brief` reads the confirmed product name for the Structural Format section.

**GATE-ASSESSMENT-01:** The shortlist artifact (`product-naming-shortlist-<date>.user.md`) must exist and have an operator-confirmed selection before GATE-ASSESSMENT-01 allows ASSESSMENT→MEASURE transition.
