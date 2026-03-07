## Steps

### Step 1: Conditionality gate

(See Conditionality Gate section in SKILL.md — execute this first.)

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
