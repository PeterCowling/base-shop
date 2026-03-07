## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`

(Date = today's date at time of execution.)

**Format:**

```markdown
---
Type: Logo-Brief
Stage: ASSESSMENT-14
Business-Unit: <BIZ>
Business-Name: <confirmed operating name — from product naming doc>
Status: Draft
Created: <date>
Updated: <date>
Owner: <operator>
Inputs:
  - <exact filename of brand identity dossier used>
  - <exact filename of brand profile used>
  - <exact filename of product naming doc used>
  - <exact filename of distribution plan if used, or omit>
---

# Logo Design Brief — <BIZ> (ASSESSMENT-14)

## 1. Mark Type

**Recommended mark type:** wordmark | lettermark | symbol + wordmark | abstract mark

**Rationale:** <why this mark type fits the brand context>

**Logotype name:** <Business name as it should appear in the logo — from product naming doc>
**Character count:** <N characters — relevant for minimum size and wordmark feasibility>

**Brand–product relationship:** compound | standalone | coined standalone
**Product name in logo:** Yes / No — <rationale; default "No" for compound patterns>

**Icon-only derivative:** <how the icon-only variant will be produced — symbol, lettermark crop, or other>

<Name reconciliation note if brand profile and product naming names differed — or omit if no discrepancy.>

## 2. Colour Specification

| Role | Token | HSL Value | Hex | Usage |
|---|---|---|---|---|
| Primary logo colour | `--color-primary` | <H S% L%> | <#XXXXXX> | Main brand mark on white/light bg |
| Secondary / accent | `--color-accent` | <H S% L%> | <#XXXXXX> | Highlights, icon elements |
| Reversed / white | Utility neutral | 0 0% 100% | #FFFFFF | On dark or primary-coloured backgrounds |
| Monochrome (dark) | Utility neutral | 0 0% 10% | #1A1A1A | Single-colour print, embossing, etching |

**Note:** Token names reference the brand identity dossier listed in Inputs above. White and near-black are standard utility neutrals and not sourced from tokens. All colour decisions must be validated against the dossier before production.

## 3. Typography Specification

**Logotype font:** <font family name>
**Source:** Google Fonts — <URL> | System font | Other (specify)
**Weight for logo:** <e.g., Semibold (600) | Bold (700)>
**Letter spacing:** <tight | normal | wide — recommendation based on personality>

**Letterform customisation:** Allowed — kerning, baseline, and minor glyph adjustments are expected and encouraged.

**License:** <"Google Fonts — typically open license (OFL/Apache); designer should confirm this specific font's license before final logo/trademark usage." | "Designer must verify font license suitability for logo/trademark use before finalising the logotype.">

**Note:** The logotype font must match the heading font in the brand identity dossier. If the heading font changes, the logo brief typography section must be updated.

## 4. Deliverables and Lockups

**Lockups to produce:**

| Lockup | Description |
|---|---|
| Primary horizontal | <wordmark / symbol + wordmark, horizontal> |
| Stacked variant | <symbol above wordmark — if symbol + wordmark mark type> |
| Icon-only | <symbol or lettermark crop> |
| Wordmark-only | <wordmark without symbol — if symbol + wordmark mark type> |
| Stamp / emboss variant | <simplified minimum-detail mark — physical product businesses only> |

**Colourways:**

- Full colour (primary on white)
- 1-colour dark (on white)
- 1-colour light / reversed (on dark background)

**File formats:**

- SVG — primary (all lockups)
- PDF — print master
- PNG (transparent) — social and marketing
- ICO / PNG — favicon (if website present)

**Minimum viable set:** SVG primary lockup + SVG icon-only + 1-colour dark SVG.

**File naming convention (recommended):**
```
<biz>_logo_primary_horizontal_fullcolor.svg
<biz>_logo_primary_stacked_fullcolor.svg
<biz>_logo_icon_fullcolor.svg
<biz>_logo_icon_1c_dark.svg
<biz>_logo_icon_1c_light.svg
<biz>_logo_wordmark_1c_dark.svg
```
*Replace `<biz>` with lowercase business code. Deliver files in a single zip with subfolders: `/svg` `/pdf` `/png` `/favicon`.*

## 5. Use Case List

| Use Case | Context | Size Guidance | Format Required |
|---|---|---|---|
| Social media profile icon | Instagram, Facebook, Pinterest profile | 400×400px minimum | Icon-only or square wordmark crop |
| Social media banner | Header / cover image | 1500×500px | Horizontal wordmark |
| Website header | Site navigation bar | ~120px height, responsive width | SVG — horizontal wordmark |
| Website favicon | Browser tab, bookmark | 16×16 to 64×64px | ICO / PNG — simplified mark |
| Email header | Transactional and marketing emails | ~600px wide | PNG — horizontal wordmark |
| <channel-specific> | <derived from distribution channels> | <varies> | <format> |

*Add or remove rows based on the business's channel mix. Favicon is always present if a website use case exists.*

## 6. Forbidden Territory

The designer must NOT produce work that:

- <Item 1 — concrete constraint, e.g., "Uses any typeface that reads as tech-startup minimalist (e.g., thin-weight sans-serif, all-lowercase)">
- <Item 2 — concrete constraint, e.g., "Applies gradients or drop shadows to the primary mark — the brand is clean and artisanal, not digital-product">
- <Additional items as derived from brand strategy>

## 7. Reference Inspirations

The following references are direction pointers — NOT to be copied:

- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>
- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>
- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>

<Label any competitor references as "Category norm / differentiation reference" with a note on what to avoid, not what to replicate.>

## 8. Optional Wordmark Note

<If feasible:> The business name set in [font family] at [weight] may be usable as a basic wordmark without custom logo design. A designer can refine spacing, baseline, and optionally add a simple mark. This is a low-cost starting point — a fully custom logotype will produce a more refined result.

<If not recommended:> The business name length / font characteristics mean a professional logo designer is recommended for wordmark production. A basic font-set wordmark is unlikely to be distinctive enough at small sizes.

## 9. AI Mock-Up Prompt

> **How to use:** Paste the prompt below into ChatGPT (GPT-4o with image generation) or DALL-E 3 to produce concept-quality logo mockups for review. These are exploration concepts — not production artwork. Use them to gut-check mark type, proportion, and colour before briefing a designer.

```
Generate [N] logo design images for "[Business Name]" — [one-sentence brand descriptor, e.g. "a premium Italian leather bag charm brand, feminine, refined, editorial"].

Logo: [literal description of mark type — e.g. "a stylised lowercase 'y' as a standalone symbol mark + the wordmark '[Name]' in an editorial serif with thin fragile strokes and wide open letter spacing, medium weight"].

Colour: [plain-language colour name, #HEXHEX] on a warm ivory background. Show a monochrome version in near-black #1A1A1A on white alongside each image.

Produce these 4 compositions:
1. [Composition 1 — e.g. Symbol left, wordmark right — horizontal lockup]
2. [Composition 2 — e.g. Symbol above wordmark, centred — stacked lockup]
3. [Composition 3 — e.g. Symbol alone at large scale — icon-only]
4. [Composition 4 — e.g. Wordmark alone, no symbol — wordmark-only]

After each image, write 2–3 sentences explaining the compositional choice and what use case it is best suited to.

No [Forbidden Territory item 1]. No [item 2]. No [item 3]. No [item 4]. No [item 5].
Flat vector style. White background. No 3D effects, no shadows, no photography.
```
```
