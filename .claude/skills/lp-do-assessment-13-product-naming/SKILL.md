---
name: lp-do-assessment-13-product-naming
description: Product naming for new startups (ASSESSMENT-13). Reads brand strategy and product definition, produces a product naming document with 3–5 candidate names, brand-product relationship guidance, TM pre-screen direction, and a naming convention for future SKUs. Upstream of lp-do-assessment-14-logo-brief.
---

# lp-do-assessment-13-product-naming — Product Naming (ASSESSMENT-13)

Produces a product naming document for the confirmed hero product or product line. This is distinct from the business name (produced by ASSESSMENT-04/05): the business name identifies the company and is rewarded for not being product-specific (Expansion Headroom dimension). The product name identifies the product and must be specific, memorable, and manufacturable alongside the business name.

## Invocation

```
/lp-do-assessment-13-product-naming --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

**ASSESSMENT-12 note:** Before running this skill, the operator should have run `/lp-do-assessment-12-promote` to promote the brand identity dossier from Draft to Active. ASSESSMENT-12 is a skill-only gate — it is not enforced by GATE-ASSESSMENT-01. If the dossier remains Draft, proceed with a provisional note in the output, but flag the gap to the operator.

**ASSESSMENT-03 gate:** If no ASSESSMENT-03 product option selection artifact exists, halt and emit:
> "ASSESSMENT-03 artifact not found at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-option-selection.user.md`. A confirmed product option is required before product naming can begin. Run `/lp-do-assessment-03-solution-selection --business <BIZ>` first."

## Operating Mode

WRITE-FIRST ELICIT

This skill uses a write-first pattern:
1. Read all available ASSESSMENT artifacts
2. Write the product naming document immediately with everything that can be inferred — marking each candidate name and field `provisional` or `confirmed`
3. Save the artifact to disk
4. Ask the operator **only** about genuine gaps (typically: naming convention preference, TM pre-screen confirmation, candidate refinement)

Do NOT present a full Q&A before writing. Write first, then surface only the real gaps.

Does NOT:
- Generate a 250-candidate list (that is ASSESSMENT-04 territory for business names)
- Perform automated trademark or domain searches (directs operator to do so)
- Re-elicit brand personality or audience context (that is ASSESSMENT-10 territory)
- Name future SKUs beyond the naming convention (SKU naming is PRODUCT-01/02 territory)

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

## Steps

### Step 1: Read inputs and build product naming context

Read intake packet and product option selection. Extract:
- Hero product type (e.g., "structured leather tote bag", "artisan scented candle", "ceramic espresso cup")
- Product category (fashion/accessories, homeware, cosmetics, food/beverage, digital)
- Target price point and perceived quality tier
- ICP primary audience (brief summary — not re-elicited)
- Distribution channels (for naming constraint awareness)

Read brand profile. Extract:
- Approved business name (from Section A of brand profile or naming shortlist)
- Personality adjective pairs (from Section C)
- Tone descriptors: formality, key phrases, words to avoid (from Section D)
- Aesthetic constraints and brand inspirations (from Section E)
- Positioning constraints: what the brand emphatically is NOT

Identify the brand-product name relationship pattern (see Section A of output format below). Choose the most appropriate pattern from the inputs:
- **Compound:** product name extends business name (e.g., Brand "Vera" + product "Vera Tote")
- **Standalone descriptor:** product name is a common noun (e.g., "The Evening Bag") — business name carries brand equity
- **Coined standalone:** product name is a new word or proper name unrelated to business name (e.g., "Mira" by Vera)

### Step 2: Generate 3–5 product name candidates

Generate 3–5 product name candidates. For each:
- State the candidate name
- Note the pattern it follows (compound / standalone descriptor / coined standalone)
- Write a 1–2 sentence rationale: why it fits the brand personality, product, and ICP
- Note any obvious risks: too similar to competitor names, difficult to pronounce in key markets, unclear product category signal

Quality bar for candidates:
- Each candidate is distinct in approach (do not produce 5 variants of the same idea)
- At least one candidate uses the compound pattern (connects to business name)
- At least one candidate is a standalone or coined name (independence from business name)
- No candidate is a direct descriptor of what the product does without any brand personality (e.g., "Leather Bag" alone is not a product name)
- All candidates must be pronounceable in the operator's primary market language

### Step 3: Write and save artifact

Write the output artifact (see Output Contract below). Mark all candidate names as `provisional` — they become `confirmed` only after operator selects and validates.

Save immediately. Do not wait for operator confirmation to save.

### Step 4: Surface only genuine gaps

After saving, surface:
1. **Naming convention question (almost always a gap):** "I've proposed a naming convention for future SKUs in Section D. Does this match how you intend to name additional products in this line? (e.g., all totes follow Vera [Descriptor], or each product gets a coined name independently)"
2. **TM pre-screen confirmation:** "Before finalising, I recommend checking the candidate names against the [primary jurisdiction] trademark register. Would you like to proceed with a name contingent on TM clearance, or prefer to resolve TM before committing?"
3. **Candidate refinement (if operator has preferences):** Present only if initial candidates seem off-target based on any operator notes already in strategy docs.

Do NOT re-ask about brand personality, audience, or business name — those are already confirmed.

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md`

**Format:**

```markdown
---
Type: Product-Naming
Stage: ASSESSMENT-13
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft | Active
Created: <date>
Updated: <date>
Owner: <operator>
---

# Product Naming — <BIZ> (ASSESSMENT-13)

## A) Brand-Product Name Relationship

**Pattern chosen:** compound | standalone descriptor | coined standalone

**Rationale:** <1–2 sentences — why this pattern fits the brand and ICP context>

**Business name:** <confirmed business name>
**Product name will:** <extend the business name / stand alongside it independently / function as a sub-brand>

## B) Product Name Candidates

| # | Candidate Name | Pattern | Rationale | Risks | Status |
|---|---|---|---|---|---|
| 1 | <name> | compound / standalone / coined | <why it works> | <any risks> | provisional |
| 2 | <name> | compound / standalone / coined | <why it works> | <any risks> | provisional |
| 3 | <name> | compound / standalone / coined | <why it works> | <any risks> | provisional |
| 4 | <name> (optional) | ... | ... | ... | provisional |
| 5 | <name> (optional) | ... | ... | ... | provisional |

**Operator selected:** {TBD — to be confirmed by operator}

## C) TM Pre-Screen Direction

The candidate names above have not been checked against trademark registers. Before finalising, the operator should:

1. Search the relevant national/regional trademark register(s) for each candidate name in the product category class (Nice Classification — relevant class for product type):
   - EU: EUIPO eTMview — euipo.europa.eu/eSearch
   - UK: UK IPO — trademarks.ipo.gov.uk
   - US: USPTO TESS — tmsearch.uspto.gov
   - WIPO Global Brand Database (cross-jurisdictional) — branddb.wipo.int

2. Check exact-match and phonetic-near-match results for the candidate name + the product category.

3. A clear result in the target class does not guarantee no conflict — seek IP advice if any near-matches are found.

**Recommended class(es):** {insert Nice Classification class(es) relevant to the product — e.g., Class 18 for leather goods, Class 25 for clothing, Class 21 for homeware, Class 3 for cosmetics}

**TM pre-screen status:** Not yet completed | In progress | Clear (class XX, jurisdiction YY) | Conflict found

## D) Naming Convention for Future SKUs

**Convention:** <describe how future products in this line will be named>

**Examples:**
- Hero product: <name>
- Future variant 1: <how it would be named under this convention>
- Future variant 2: <how it would be named under this convention>

**Multi-product handling:** If the business expands beyond the initial product line, <note whether the convention extends or a separate naming exercise is needed>.

## E) Operator Notes

{Any additional context or constraints the operator has provided — blank until operator input received.}
```

---

## Quality Gate

Before saving, verify:

- [ ] All sections A–E present (section heading must exist; E may be blank at Draft stage)
- [ ] Section A: brand-product name pattern explicitly stated with rationale
- [ ] Section B: at least 3 candidate names with non-placeholder rationale; at least 1 compound and 1 non-compound candidate
- [ ] Section C: TM pre-screen direction present with at least one jurisdiction-specific link; relevant Nice Classification class noted
- [ ] Section D: naming convention present with at least 2 examples
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Owner all present
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Section B with fewer than 3 candidates
- All candidates following the same pattern (no variety)
- TM pre-screen direction absent (minimum is a pointer to search — not performing the search)
- Section D naming convention is "TBD" with no examples
- Artifact not saved (output must be written to file, not only displayed in chat)
- Business name confused with product name (these are separate concepts)

## Completion Message

> "Product naming recorded: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md`. [N] candidates generated. TM pre-screen: [status]. Naming convention: [brief description]."
>
> "Next step: run `/lp-do-assessment-14-logo-brief --business <BIZ>` to produce the logo design brief."

**If the operator wants a more rigorous shortlist** — equivalent to the company naming pipeline with 75 scored candidates, systematic territory generation, and TM pre-screen direction — use the product naming pipeline documented at `docs/plans/facilella-product-naming-pipeline/plan.md`. This skill (ASSESSMENT-13) is the quick 3–5 candidate write-first approach; the pipeline is the deeper-dive alternative when the operator wants a proper shortlist before committing to packaging and logo work.

---

## Integration

**Upstream (ASSESSMENT-11/12):**
- Reads `<YYYY-MM-DD>-brand-identity-dossier.user.md` (ASSESSMENT-11) for personality and aesthetic constraints.
- ASSESSMENT-12 (dossier promotion gate) should be run before this skill but is not enforced by GATE-ASSESSMENT-01. If the dossier is still Draft, proceed with a provisional note.

**Downstream (ASSESSMENT-14):**
- `<YYYY-MM-DD>-product-naming.user.md` is a required input for `/lp-do-assessment-14-logo-brief`. ASSESSMENT-14 uses the confirmed product name (or provisional candidate) to inform the mark type decision and wordmark feasibility check.

**Downstream (ASSESSMENT-15):**
- `/lp-do-assessment-15-packaging-brief` reads the confirmed product name for the Structural Format section.

**GATE-ASSESSMENT-01:** This skill's output (`<YYYY-MM-DD>-product-naming.user.md`) must exist and pass quality gate before GATE-ASSESSMENT-01 allows ASSESSMENT→MEASURE transition.
