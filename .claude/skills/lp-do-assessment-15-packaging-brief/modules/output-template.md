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
