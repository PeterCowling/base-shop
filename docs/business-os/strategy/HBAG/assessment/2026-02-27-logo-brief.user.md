---
Type: Logo-Brief
Stage: ASSESSMENT-14
Business-Unit: HBAG
Business-Name: Caryina
Status: Draft
Created: 2026-02-27
Updated: 2026-02-27
Owner: Pete
Inputs:
  - 2026-02-21-brand-identity-dossier.user.md
  - 2026-02-21-brand-profile.user.md
  - product-naming-shortlist-2026-02-27.user.md (ASSESSMENT-13 pipeline — no confirmed product-naming.user.md yet; see Note below)
  - 2026-02-21-launch-distribution-plan.user.md
---

# Logo Design Brief — Caryina / HBAG (ASSESSMENT-14)

> **Note — HBAG business code:** The business code in this repo is HBAG; the trading name is **Caryina**. All strategy artifacts live under `docs/business-os/strategy/HBAG/`.

> **ASSESSMENT-13 gate — provisional note:** No `*-product-naming.user.md` exists. Business name "Caryina" is confirmed via operator-override in brand profile Section A (2026-02-21). Product line naming (ASSESSMENT-13 pipeline) is in progress — 75 candidates scored, TM pre-screen pending. Brand-product pattern is compound (e.g., "Caryina Fibbella") — the product line name does not appear in the primary logo. This brief covers the "Caryina" brand mark only. **Action required:** once a product line name is confirmed post-TM pre-screen, create `*-product-naming.user.md` and confirm brand-product relationship in this brief.

---

## 1. Mark Type

**Recommended mark type:** Symbol + Wordmark

**Rationale:** "Caryina" is a coined name with no pre-existing meaning — the coined name guardrail applies: a wordmark alone will not carry recognition at launch. Digital presence is confirmed across website (DTC), Etsy, Instagram, and TikTok, which requires an icon-only derivative for favicon, social profile, app icon, and Etsy shop icon. The brand has a strong conceptual territory for a symbol: the Signature Pattern in the brand dossier centres on the "y" in "Caryina" dissolving to reveal "carina" (cute in Italian). This narrative is already implemented in the coded BrandMark prototype (`apps/caryina`). A stylised "y" letterform — refined from the heading font's own glyph — encodes the brand's story without resorting to a generic "C" monogram (explicitly prohibited: "no monograms, no designer-parody cues" — brand profile Section E). The "y" is the distinctive, narratively loaded letter; it is the correct and brand-specific symbol.

**Logotype name:** Caryina
**Character count:** 7 — ideal for wordmark legibility at minimum sizes; holds at display and stamp/emboss scale.

**Brand–product relationship:** Compound
**Product name in logo:** No — product lines carry the compound form "Caryina [ProductLineName]" (e.g., Caryina Fibbella) in marketing and product labelling. The primary logo represents the brand only.

**Icon-only derivative:** A stylised letterform mark derived from the "y" in "Caryina" — the transformation letter that hides "carina". Not a monogram or double-ring crest. The designer should work from the "y" in the heading font as the base and refine it into a mark that reads as a distinctive symbol at 32×32px.

> **Existing implementation reference:** The coded BrandMark in `apps/caryina/src/components/BrandMark/BrandMark.tsx` is an animated wordmark prototype — it validates the "Caryina → carina" concept and confirms the letterform handles the reveal. This brief is for a designer producing static, production-quality logo files from that concept. The designer does not need to produce animation.

---

## 2. Colour Specification

| Role | Token | HSL Value | Hex | Usage |
|---|---|---|---|---|
| Primary logo colour | `--color-primary` | 355 55% 75% | #E29CA2 | Main brand mark on white/warm ivory backgrounds |
| Secondary / accent | `--color-accent` | 130 18% 72% | #ABC4AF | Accent elements, secondary mark treatment if needed |
| Reversed / white | Utility neutral | 0 0% 100% | #FFFFFF | On dark, primary-coloured, or espresso backgrounds |
| Monochrome (dark) | Utility neutral | 0 0% 10% | #1A1A1A | Single-colour print, embossing, hang tag, charm hardware stamp |

**Note:** Token names reference `2026-02-21-brand-identity-dossier.user.md`. White and near-black are standard utility neutrals — not sourced from brand tokens. All colour decisions must be validated against the dossier before production.

**Colour usage guidance for this brand:** The primary palette uses Strawberry Milk (#E29CA2) as the brand colour and warm ivory (`38 18% 98%`) as the background. The logo should look at home on both the warm ivory site background and on dark rose-espresso (`355 14% 10%`) — the site's dark mode. Both treatments should be provided. The accent sage (#ABC4AF) is rarely needed in the logo itself; it is included for completeness only.

---

## 3. Typography Specification

**Logotype font:** Cormorant Garamond
**Source:** Google Fonts — https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500&display=swap
**Weight for logo:** Medium (500) — heavier than the site's display weight but lighter than Bold; conveys "sophisticated, not showy" without heaviness
**Letter spacing:** Wide — apply positive tracking (+30 to +50 units, or equivalent). Fashion brand wordmarks in Cormorant-class serifs consistently use open tracking to signal editorial register. Test at both 120px (website header) and 14px (stamp/emboss minimum) before finalising.

**Letterform customisation:** Allowed — kerning, baseline, and minor glyph adjustments are expected and encouraged. The "y" character in particular should receive intentional letterform attention as it doubles as the icon mark.

**License:** Google Fonts — typically open license (OFL); designer should confirm Cormorant Garamond's specific license terms before final logo/trademark usage.

**Note:** The logotype font must match the heading font in the brand identity dossier. If the heading font changes, the logo brief typography section must be updated.

---

## 4. Deliverables and Lockups

**Lockups to produce:**

| Lockup | Description |
|---|---|
| Primary horizontal | "y" symbol left of "Caryina" wordmark — balanced proportion; symbol height ≈ cap height |
| Stacked variant | "y" symbol above "Caryina" wordmark, centred — for square-format applications |
| Icon-only | Stylised "y" mark alone — for favicon, app icon, social profile |
| Wordmark-only | "Caryina" wordmark without symbol — for email headers, Etsy banner text strip, packaging insert |
| Stamp / emboss variant | Simplified "y" mark at minimum detail — must hold at 1–3cm for charm hardware emboss, packaging seal, or hang tag stamp |

**Colourways:**

- Full colour (Strawberry Milk `#E29CA2` on warm ivory `#FAF9F7` — the brand's natural background)
- 1-colour dark (near-black `#1A1A1A` on white — for print and hang tags)
- 1-colour light / reversed (white `#FFFFFF` on rose-espresso `#1A1010` — for dark-mode website header and packaging dark surfaces)

**File formats:**

- SVG — primary (all lockups, all colourways)
- PDF — print master (all lockups)
- PNG (transparent, 2×) — social, marketing, Etsy watermark use
- ICO + PNG (16, 32, 64, 180px) — favicon and Apple touch icon sets

**Minimum viable set:** SVG primary horizontal (full colour) + SVG icon-only (full colour + 1-colour dark) + 1-colour dark SVG wordmark.

**File naming convention (recommended):**
```
caryina_logo_primary_horizontal_fullcolor.svg
caryina_logo_primary_stacked_fullcolor.svg
caryina_logo_icon_fullcolor.svg
caryina_logo_icon_1c_dark.svg
caryina_logo_icon_1c_light.svg
caryina_logo_wordmark_1c_dark.svg
caryina_logo_stamp_emboss.svg
```
*Deliver in a single zip with subfolders: `/svg` `/pdf` `/png` `/favicon`.*

---

## 5. Use Case List

| Use Case | Context | Size Guidance | Format Required |
|---|---|---|---|
| Social media profile icon | Instagram, TikTok profile | 400×400px minimum | Icon-only (y mark) — PNG |
| Social media banner | Instagram / TikTok cover, Etsy shop banner | 1500×500px (social); 3360×840px (Etsy large) | Wordmark-only or horizontal lockup — PNG/SVG |
| Website header | Caryina site navigation bar | ~120px height, responsive width | Primary horizontal — SVG |
| Website favicon | Browser tab, bookmark, PWA manifest | 16×16 to 512×512px (multiple sizes) | Icon-only — ICO + PNG set |
| Email header | Transactional emails (Etsy), marketing newsletter | ~600px wide | Wordmark-only — PNG |
| Etsy shop icon | Etsy seller profile image | 500×500px | Icon-only — PNG |
| Hang tag / product label | Attached to product; buyer first sees the brand physically | Typically 5–8cm, portrait | Wordmark or stacked lockup + any care/origin line |
| Packaging surface | Gift box exterior, tissue, ribbon seal | Varies by format | Full suite needed; emboss/stamp likely |
| Product stamp / emboss | Charm hardware, packaging seal, inner tissue stamp | 1–3cm relief | Stamp/emboss variant (simplified y mark) |

---

## 6. Forbidden Territory

The designer must NOT produce work that:

1. **Uses any script or handwritten typeface** — even as a secondary element. Script fonts immediately read as "generic handmade Etsy" and directly contradict the curated-premium positioning. Cormorant Garamond or an equivalently refined editorial serif only. (Explicitly stated: "no script fonts" — brand profile Section E.)

2. **Uses a monogram or designer-parody format** — no "C" in a double ring, no "C.Y." crest, no medallion or shield frames. These formats create near-miss associations with luxury fashion houses and were explicitly excluded: "no designer-parody cues, no monograms" — brand profile Section E. The "y" mark is the brand's own symbol, not a repurposed initial.

3. **Applies rough, distressed, or craft-fair aesthetics** — no brushstroke textures, hand-drawn irregularity, or "made by hand" visual language in the logo mark. This is a curated precision brand in the €80–150 premium tier. (Category: premium fashion accessories — explicitly established in brand profile.)

4. **Adds ornamental frames, flourishes, or decorative borders** — the brand philosophy is "whitespace is the brand" (brand profile Section E). The logo is clean and minimal. Decorative frames belong to a different brand world.

5. **Uses gradient fills, multi-colour logo treatment, or pattern fills** — the mark must hold in solid single colour to be viable for embossing, stamping, and print. One colour at a time. No gradient Strawberry Milk → Sage transition in the mark.

---

## 7. Reference Inspirations

The following references are direction pointers — NOT to be copied. All derived from brand profile Section E.

- **Polène** — take: editorial serif wordmark, calm and considered, zero decoration, tight palette discipline / avoid: cold or distant — Caryina needs to feel warmer and more feminine; the "y" mark should carry some warmth
- **Mejuri** — take: clean wordmark that reads as "daily fine detail", approachable refinement, logo that doesn't oversell / avoid: influencer-haul energy; the logo should feel composed and quiet, not scrollable
- **Aesop** — take: extreme quiet confidence in the wordmark alone; disciplined spacing; premium-through-detail without saying it / avoid: becoming too austere or sterile — Caryina is feminine and fashion-adjacent, not clinical
- **The Row** — take: ultimate fashion restraint; one clean wordmark does all the work; zero decorative noise / avoid: emotional flatness — Caryina should feel inviting, not severe; warmth must read in the letterform treatment
- **Strathberry** *(category norm / differentiation reference)* — their logotype handles a hardware-adjacent brand with a clean wordmark; shows how the "detail as brand" concept works without a literal symbol — note what to differentiate: Caryina's "y" mark should feel like the brand's own story, not a generic fashion wordmark

---

## 8. Optional Wordmark Note

"Caryina" in Cormorant Garamond Medium (500) with wide tracking is producible as a basic SVG wordmark directly from the brand fonts — no custom logo designer required for the wordmark itself. The existing BrandMark prototype in `apps/caryina` confirms this: the letterform in the chosen font is strong enough to stand alone.

**What a professional designer adds value on:**
1. The "y" symbol — custom letterform refinement of the y mark for use as the standalone icon; this cannot be produced from the font alone without design work
2. Kerning optimisation — particularly the "Ca" opening pair and "ina" close at logo scale
3. Minimum-size testing — confirming the stamp/emboss variant holds at 1–2cm
4. Size-specific spacing — the wordmark may need two versions (display ≥ 40px, small ≤ 20px) as Cormorant Garamond is a fragile letterform at very small sizes on screen

**Recommendation:** Commission a designer specifically for the "y" icon mark and file production. The static wordmark alone is producible in-house from brand fonts as a starting point.

---

## 9. AI Mock-Up Prompt

> **How to use:** Paste the prompt below into ChatGPT (GPT-4o with image generation) or DALL-E 3 to produce concept-quality logo mockups for review. These are exploration concepts — not production artwork. Use them to gut-check mark type, proportion, and colour before briefing a designer.

```
Generate 4 logo design images for "Caryina" — a premium Italian leather bag charm brand, feminine, refined, editorial.

Logo: a stylised lowercase "y" as a standalone symbol mark (elegant, slightly fragile, thin classical serif strokes — the "y" hides the Italian word "carina" when removed) + the wordmark "Caryina" in an editorial serif with thin fragile strokes and wide open letter spacing, medium weight.

Colour: soft rose pink #E29CA2 on a warm ivory background. Show a monochrome version in near-black #1A1A1A on white alongside each image.

Produce these 4 compositions:
1. Symbol left, wordmark right — horizontal lockup
2. Symbol above wordmark, centred — stacked lockup
3. "y" symbol alone at large scale — icon-only
4. Wordmark "Caryina" alone, no symbol — wordmark-only

After each image, write 2–3 sentences explaining the compositional choice and what use case it is best suited to.

No script fonts. No monograms or double-ring crest formats. No decorative borders or flourishes. No gradient fills. No rough or hand-drawn textures.
Flat vector style. White background. No 3D effects, no shadows, no photography.
```
