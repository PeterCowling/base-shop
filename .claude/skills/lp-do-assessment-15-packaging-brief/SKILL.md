---
name: lp-do-assessment-15-packaging-brief
description: Packaging design brief for new startups (ASSESSMENT-15). Conditional on physical-product profile. Reads brand identity, product naming, logo brief, and distribution plan to produce a complete packaging brief covering structural format, regulatory requirements, surface design, and designer handoff checklist.
---

# lp-do-assessment-15-packaging-brief — Packaging Brief (ASSESSMENT-15)

Produces a designer-ready packaging design brief for physical product businesses. This skill is conditional: it only runs when the business has a `physical-product` profile flag. For digital-only businesses it emits a skip message and halts cleanly.

The brief combines deterministic derivation (packaging format from product type + channel, regulatory requirements from the reference data file) with targeted operator elicitation (aesthetic preferences for surface design). It does not attempt to be a regulatory compliance audit — it produces an operator-reviewed requirements checklist sourced from `regulatory-requirements.md`.

## Invocation

```
/lp-do-assessment-15-packaging-brief --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

MIXED

- **Deterministic derivation:** structural packaging format (from product type + distribution channel), regulatory requirements checklist (from reference data file for product category)
- **Operator elicitation:** surface design aesthetic preferences (3 targeted questions only)

Does NOT:
- Perform regulatory compliance audits or provide legal advice
- Generate packaging artwork, structural dielines, or print-ready files
- Cover product categories that are out of scope for the reference data (medical devices, pharmaceuticals, electrical goods, children's toys — see regulatory-requirements.md out-of-scope section)

## Conditionality Gate (Step 1 — execute first)

**Read the business profile** to determine whether `physical-product` flag is set.

The business profile flag may be documented in:
- ASSESSMENT intake packet (Section A — business type or product profile)
- ASSESSMENT-03 option selection artifact (product category)
- Operator context document

If `physical-product` is NOT in the business profile (e.g., SaaS, digital content, service business), emit:
> "This business does not have a physical-product profile. Packaging brief (ASSESSMENT-15) is not applicable — skipping. If this changes (e.g., the business adds a physical product line), re-run `/lp-do-assessment-15-packaging-brief --business <BIZ>`."

Then halt cleanly. Do not create any output artifact.

If `physical-product` IS in the business profile, proceed to Step 2.

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| Product option selection | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-option-selection.user.md` | Yes — product type and product category |
| Distribution plan | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-launch-distribution-plan.user.md` | Yes — channels determine packaging format and barcode requirement |
| Brand identity dossier | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | Yes — brand assets (colour tokens, typography) for Surface Design section |
| Product naming document | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md` | Yes — confirmed product name for label text |
| Logo brief | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md` | Yes — logo variants for Brand Assets section |
| Regulatory reference data | `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` | Yes — source for Regulatory Requirements Checklist |

If `<YYYY-MM-DD>-logo-brief.user.md` is absent, halt and emit:
> "Logo brief not found at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`. Run `/lp-do-assessment-14-logo-brief --business <BIZ>` first."

---

## Steps

### Step 1: Conditionality gate

(See Conditionality Gate section above — execute this first.)

### Step 2: Read inputs and extract product context

Read product option selection. Extract:
- Specific product type (e.g., "structured leather tote bag", "hand-poured soy candle", "ceramic espresso cup", "artisan jam")
- Product category: fashion/leather goods | homeware/ceramics | cosmetics/skincare | food/beverage | other

Read distribution plan. Extract:
- Launch channels (e.g., Etsy, retail boutiques, own website, market stalls)
- Note: retail channels require EAN barcode; D2C and market stalls typically do not

Read brand identity dossier. Extract:
- Colour tokens: `--color-primary`, `--color-accent`, font families
- Imagery direction (Do / Don't) — informs packaging surface design constraints

Read product naming document. Extract:
- Confirmed or provisional product name (for label text)
- Brand name (for label hierarchy)

Read logo brief. Extract:
- Available logo variants (wordmark, symbol, monochrome)
- Minimum size requirements noted in the brief

### Step 3: Derive structural packaging format

Map product type and channel context to a packaging format using this table:

| Product Category | Typical Product Type | Typical Packaging Format |
|---|---|---|
| Fashion / leather goods | Bags, wallets, belts, scarves | Hang tag (care/fibre content) + poly bag or dust bag |
| Fashion / leather goods (retail) | Same as above | Add swing tag with barcode; consider branded box for premium positioning |
| Homeware / ceramics | Mugs, bowls, vases, candles | Folding carton or sleeve + tissue or foam insert |
| Homeware / ceramics (retail) | Same as above | Retail-ready box with barcode and product description |
| Cosmetics / skincare | Creams, serums, lip balm | Primary packaging (tube/jar/pump) + secondary carton |
| Food / beverage | Jams, sauces, confectionery, tea | Label on primary container + retail carton if multi-unit |
| Food / beverage (market stall / D2C) | Same as above | Label only acceptable for direct-sale formats |

Select the most appropriate format from this table. If the product type does not map cleanly to a single row, note the closest match and flag the ambiguity for operator review.

Note: The format above is a starting-point derivation — the operator confirms the final format.

### Step 4: Read regulatory requirements for product category

Open `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md`.

Locate the section for the product's category:
- Category 1: Fashion and Leather Goods
- Category 2: Homeware and Ceramics
- Category 3: Cosmetics and Skincare
- Category 4: Food and Beverage

Extract the Mandatory Label Fields table for that category. These rows form the Regulatory Requirements Checklist in the output.

**Multi-category products:** If the product spans two categories (e.g., a cosmetic product also sold as food supplement), include requirements from both applicable categories and note the dual classification in the checklist.

**Out-of-scope products:** If the product category is not covered in the reference data (medical devices, pharmaceuticals, electrical goods, toys, nutritional supplements, certified organic), emit the following in the checklist:
> "This product category is not covered by the standard regulatory reference data. Seek specialist regulatory advice before proceeding to production."

Then halt the checklist — do not attempt to produce a checklist for out-of-scope categories.

**Jurisdiction:** Default to EU requirements (as stated in the reference data). If the business has confirmed UK-only or US-only distribution, note the jurisdiction divergences from the reference data for the relevant category.

### Step 5: Elicit surface design preferences from operator

Ask three targeted questions (and only these three):

1. **Colour treatment:** "For the packaging surface, should brand colour lead (primary/accent on packaging), or should product photography/imagery lead (packaging as neutral/recessive background for the product)?"
2. **Illustration vs photography:** "Will the packaging surface use illustration, product photography, or text-only design? Or a combination?"
3. **Finish:** "What packaging finish is preferred: matte, gloss, or foil? (Foil increases cost significantly — relevant to note at this stage.)"

Do not ask about regulatory requirements (derived from reference data), structural format (already derived in Step 3), or brand assets (already in logo brief and dossier).

After receiving operator answers, assemble the Surface Design Scope section.

### Step 6: Assemble designer handoff checklist

The designer needs the following to begin packaging work. List each item with its path or status:

| Asset | Source | Path | Status |
|---|---|---|---|
| Brand dossier | ASSESSMENT-11 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | Available |
| Logo brief | ASSESSMENT-14 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md` | Available |
| Confirmed product name | ASSESSMENT-13 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md` | Available / Provisional |
| Colour tokens (HSL + hex) | Brand dossier | `--color-primary`, `--color-accent` — values in dossier | Available |
| Typography spec | Brand dossier | Heading font + body font | Available |
| Regulatory requirements checklist | This document | Section 3 of this brief | See checklist |
| EAN barcode (if retail) | GS1 | gs1.org/get-a-barcode | Pending operator registration |
| Structural packaging spec | Supplier / manufacturer | TBD — to be sourced at production stage | Pending |
| Product dimensions | ASSESSMENT-03 / product spec | TBD — required for dieline | Pending |

### Step 7: Derive EAN/barcode note

Based on distribution channels from Step 2:

- If any launch channel is retail (boutiques, department stores, supermarkets, marketplaces requiring GTIN): EAN-13 barcode is required. Note: "Register at gs1.org/get-a-barcode before production. Allow 2–4 weeks for registration. EAN prefix is business-specific — do not use shared GS1 prefixes."
- If all launch channels are D2C and market stalls only: Barcode is not currently required. Note: "If retail channel is added in future, EAN-13 barcode will be required — register at gs1.org at that point."
- If channel mix is uncertain: default to recommending registration, noting it is low cost (~£130/year UK, varies by country) and prevents future rework.

### Step 8: Save artifact and report

Save the packaging brief (see Output Contract below).

Report to operator:
- Structural format selected (or flagged for confirmation)
- Regulatory category identified and checklist populated
- Number of regulatory checklist items
- EAN barcode requirement status
- Pending items in the Designer Handoff Checklist (typically product dimensions and structural spec)

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`

**Format:**

```markdown
---
Type: Packaging-Brief
Stage: ASSESSMENT-15
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft | Active
Created: <date>
Updated: <date>
Owner: <operator>
---

# Packaging Design Brief — <BIZ> (ASSESSMENT-15)

*Conditional: physical-product profile only.*

## 1. Structural Format

**Product type:** <specific product, e.g., "structured leather tote bag">
**Regulatory category:** fashion/leather goods | homeware/ceramics | cosmetics/skincare | food/beverage

**Packaging format:** <derived format, e.g., "hang tag (care + fibre content, 85×55mm) + cotton dust bag">

**Format rationale:** <why this format fits the product type and channels>

**Distribution channel context:**
- Retail channels: <list if present> — EAN-13 barcode required
- D2C / market: <list if present> — barcode not required for these channels

## 2. Surface Design Scope

**Colour treatment:** brand-led | photography-led | text-only with brand accent
**Design approach:** illustration | product photography | text-only | combination
**Finish:** matte | gloss | foil | TBD

**Brand colours to use:**
- Primary: `--color-primary` {HSL value}
- Accent: `--color-accent` {HSL value}

**Typography on packaging:**
- Logo font: {from logo brief}
- Label text font: {heading or body font from brand dossier}

**Tone on packaging:**
- In keeping with brand personality: {1–2 adjective pairs from brand profile most relevant to packaging}
- Words to avoid on packaging (from brand profile): {list if documented}

## 3. Regulatory Requirements Checklist

*Sourced from `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` — {category name}.*
*EU primary jurisdiction. See reference data for UK and US divergence notes.*
*Operator must verify current requirements with a regulatory specialist before production.*

| # | Requirement | Regulation Reference | Status |
|---|---|---|---|
| 1 | <mandatory field from reference data> | <regulation> | To verify |
| 2 | <mandatory field> | <regulation> | To verify |
| ... | ... | ... | ... |

**Multi-category note (if applicable):** <note if product spans two regulatory categories>

## 4. Brand Assets to Use

| Asset | Variant | Notes |
|---|---|---|
| Logo | {primary wordmark} | On hang tag / outer carton face |
| Logo | {monochrome} | For embossing, etching, or foil stamp |
| Logo | {icon-only (if symbol mark)} | For small surfaces (e.g., dust bag label) |
| Colour tokens | `--color-primary`, `--color-accent` | CMYK conversion required for print production |

**Colour mode note:** Brand tokens are in HSL (screen). For print production, convert to CMYK — HSL values are supplied for designer reference. Request CMYK equivalents from print supplier.

## 5. Print Specification Notes

- **Colour mode:** CMYK (not RGB) for all print production
- **Minimum logo size:** {from logo brief use case requirements — smallest use context}
- **Finish:** {matte | gloss | foil — from operator preference}
- **Bleed and safe zone:** standard 3mm bleed, 5mm safe zone inside cut edge (confirm with printer)
- **Paper weight:** {TBD — to be specified at production stage in consultation with supplier}

## 6. EAN / Barcode Note

{One of:}
**EAN-13 barcode required** — retail channel(s) require point-of-sale barcode. Register at gs1.org/get-a-barcode before production. Allow 2–4 weeks. EAN prefix is business-specific.

**EAN barcode not currently required** — launch channels are D2C and/or market stalls. If retail channel is added in future, EAN-13 registration will be required.

## 7. Designer Handoff Checklist

| Asset | Source | Path | Status |
|---|---|---|---|
| Brand identity dossier | ASSESSMENT-11 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | Available |
| Logo brief | ASSESSMENT-14 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md` | Available |
| Confirmed product name | ASSESSMENT-13 | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md` | Available / Provisional |
| Colour tokens (HSL) | Brand dossier | See Section 4 above | Available |
| Typography spec | Brand dossier | See Section 5 above | Available |
| Regulatory requirements checklist | This document | Section 3 above | See checklist |
| EAN barcode | GS1 | gs1.org | {Pending / Registered: {barcode number}} |
| Structural packaging spec | Supplier / manufacturer | TBD | Pending |
| Product dimensions (L × W × H, weight) | Product spec | TBD — required for dieline | Pending |
```

---

## Quality Gate

Before saving, verify:

- [ ] Conditionality gate was executed first — skill halted for non-physical-product business
- [ ] All 7 sections present with non-placeholder content
- [ ] Structural Format: specific packaging type named (not "TBD"); channel context documented
- [ ] Surface Design Scope: colour treatment, design approach, and finish all present (may be provisional pending operator input)
- [ ] Regulatory Requirements Checklist: ≥ 3 items sourced from reference data for the named category; regulation references present (not just "EU law")
- [ ] EAN/Barcode Note: explicitly states whether required or not, with GS1 reference
- [ ] Designer Handoff Checklist: all rows present with "Pending" or "Available" status
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Owner all present
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Artifact created for a non-physical-product business (conditionality gate must halt first)
- Regulatory Requirements Checklist with generic placeholder items not sourced from the reference data file
- Regulatory requirements invented rather than read from `regulatory-requirements.md`
- Structural Format left as "TBD" without a derived recommendation
- EAN section absent or not addressing whether a barcode is required
- Artifact not saved (output must be written to file, not only displayed in chat)
- Out-of-scope product category covered without directing operator to specialist advice

## Completion Message

> "Packaging brief recorded: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`. Structural format: [format]. Regulatory category: [category]. Regulatory checklist: [N] items. EAN barcode: [required / not required]. Designer handoff: [N] items ready, [M] items pending."
>
> "ASSESSMENT stage complete for physical-product profile. Next step: review the packaging brief with your supplier, then run `/lp-readiness --business <BIZ>` to enter S1."

---

## Integration

**Upstream (ASSESSMENT-14):**
- Reads `<YYYY-MM-DD>-logo-brief.user.md` as a required input for the Brand Assets section and Designer Handoff Checklist.

**Upstream (ASSESSMENT-13):**
- Reads `<YYYY-MM-DD>-product-naming.user.md` for the confirmed product name used in Structural Format.

**Upstream (ASSESSMENT-11):**
- Reads `<YYYY-MM-DD>-brand-identity-dossier.user.md` for colour tokens and typography used in Surface Design Scope and Print Specification Notes.

**Downstream:** This skill produces the final ASSESSMENT deliverable for physical-product profiles. The output is an operator/designer handoff document — there is no further automated ASSESSMENT skill downstream. The operator proceeds to `/lp-readiness --business <BIZ>` (S1).

**Regulatory reference data:** This skill reads `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` at runtime. If that file is absent, halt and emit: "Regulatory reference data not found. The file `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` is required for this skill to produce an authoritative checklist. Contact the system operator to restore this file."

**GATE-ASSESSMENT-01:** This skill's output (`<YYYY-MM-DD>-packaging-brief.user.md`) must exist for businesses with `physical-product` profile before GATE-ASSESSMENT-01 allows ASSESSMENT→MEASURE transition. For non-physical businesses, GATE-ASSESSMENT-01 does not require this artifact.
