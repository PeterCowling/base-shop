---
name: lp-do-assessment-14-logo-brief
description: Logo design brief for new startups (ASSESSMENT-14). Synthesises brand identity dossier, brand profile, and product naming to produce a complete logo design brief ready to hand to a designer. Upstream of lp-do-assessment-15-packaging-brief and /lp-design-spec.
---

# lp-do-assessment-14-logo-brief — Logo Design Brief (ASSESSMENT-14)

Produces a designer-ready logo design brief by synthesising the visual identity decisions already made in ASSESSMENT-10 (brand profile) and ASSESSMENT-11 (brand identity dossier). Does not re-elicit audience or personality — those decisions are already made and carried forward. The brief specifies mark type, colour application, typography, deliverables, use cases, and constraints: everything a logo designer needs to begin without additional Q&A.

## Invocation

```
/lp-do-assessment-14-logo-brief --business <BIZ> [--app-dir <path>]
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

Optional:
- `--app-dir <path>` — path to the Next.js app (e.g. `apps/caryina`). If not provided, auto-detected from the business name (lowercase). If the directory cannot be found, logo asset deployment is skipped gracefully.

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

**ASSESSMENT-13 gate:** If no ASSESSMENT-13 product naming artifact is found (see Artifact Discovery Rule below), halt and emit:
> "ASSESSMENT-13 artifact not found matching `docs/business-os/strategy/<BIZ>/*-product-naming.user.md`. A product naming document is required before the logo brief can be produced. Run `/lp-do-assessment-13-product-naming --business <BIZ>` first."

## Operating Mode

EXECUTE

This skill synthesises existing brand strategy inputs into a logo brief. The operator does not provide field-by-field input during execution — they review the produced brief and confirm or request amendments.

The skill makes reasoned decisions about mark type, deliverables, and use cases based on the brand strategy inputs. These are design recommendations for operator review, not fixed specifications.

Does NOT:
- Re-elicit audience, personality, or voice & tone (ASSESSMENT-10)
- Re-elicit colour palette or typography (ASSESSMENT-11)
- Run automated trademark searches
- Produce a designer-quality logo — Steps 12–14 produce a functional text-based SVG from brand fonts; a professional designer refines these into production artwork

## Required Inputs (pre-flight)

| Source | Glob pattern | Required |
|--------|------|----------|
| Brand identity dossier | `*-brand-identity-dossier.user.md` | Yes — primary input; blocks if absent |
| Brand profile | `*-brand-profile.user.md` | Yes — personality adjective pairs, positioning constraints |
| Product naming document | `*-product-naming.user.md` | Yes — confirmed business name, product name, brand-product relationship pattern |
| Distribution plan | `*-launch-distribution-plan.user.md` | No — read if present; informs Use Case List |

All globs are relative to `docs/business-os/strategy/<BIZ>/`.

If no brand identity dossier is found, halt and emit:
> "Brand identity dossier not found matching `docs/business-os/strategy/<BIZ>/*-brand-identity-dossier.user.md`. Run `/lp-do-assessment-11-brand-identity --business <BIZ>` first."

If no brand profile is found, halt and emit:
> "Brand profile not found matching `docs/business-os/strategy/<BIZ>/*-brand-profile.user.md`. Run `/lp-do-assessment-10-brand-profiling --business <BIZ>` first."

---

## Artifact Discovery Rule

**CRITICAL: apply this rule for every required and optional input before reading any file beyond frontmatter (i.e., only frontmatter may be read during discovery).**

Frontmatter is defined as the YAML block at the top of the file, bounded by `---` delimiters. Read only those lines to determine `Updated:` — do not read the rest of the file content until selection is complete.

For each glob pattern, collect all matching files in `docs/business-os/strategy/<BIZ>/`.

**`Updated:` format and parsing:**
- Accepted formats: `YYYY-MM-DD` (preferred), or ISO 8601 with time (`YYYY-MM-DDTHH:MM:SSZ` / `YYYY-MM-DDTHH:MM:SS±HH:MM`).
- If timestamps are present across candidates, compare full timestamps (not just dates).
- If a value is absent or unparseable (e.g., "Feb 2, 2026"), treat it as missing and emit a warning: `Unparseable Updated: <value> in <filename>; ignored for selection.`

Selection order (deterministic):
1. Parse `Updated:` from frontmatter of each candidate. Select the file with the **latest `Updated:` value**.
2. If `Updated:` is absent or unparseable in all candidates, fall back to the **latest `YYYY-MM-DD` prefix in the filename**.
3. If multiple files tie on the same date (or tie after timestamp comparison), choose the **lexicographically last filename** and emit a warning listing all ties.

Record the exact filename selected for each input — these are included in the output contract frontmatter (see `Inputs:`) and in the completion report.

All gate error messages reference the glob pattern, not a single `<YYYY-MM-DD>` path.

---

## Steps

### Step 1: Read and extract brand strategy inputs

Apply the Artifact Discovery Rule to resolve the exact filename for each input.

Read the resolved brand identity dossier. Extract:
- `--color-primary` and `--color-accent` token values (HSL and rationale)
- Typography heading font family and body font family
- Imagery Direction: Do / Don't directives (these inform Forbidden Territory)
- Signature Patterns (if any — note if TBD)
- App Coverage (notes which apps exist — informs Use Case List)

Read the resolved brand profile. Extract:
- Personality adjective pairs (Section C)
- Aesthetic constraints and brand inspirations (Section E)
- Any explicit visual constraints (e.g., "avoid tech-bro neon", "must not look clinical")
- Operating name (fallback only — product naming doc is the source of truth; see below)

Read the resolved product naming document. Extract:
- **Confirmed business/logotype name** — this is the **source of truth**. If the brand profile operating name and the product naming business name differ, use the product naming value and include a "Name reconciliation note" in the Mark Type rationale flagging the discrepancy.
- Brand-product relationship pattern (compound / standalone / coined standalone)
- Confirmed or provisional product name
- Any relevant TM constraints noted

Read the resolved distribution plan if present. Extract:
- Launch channels (e.g., Etsy, Instagram, retail boutiques, D2C website)
- These directly inform the Use Case List

### Step 2: Derive Mark Type recommendation

Choose one of the following mark types, with rationale derived from the brand personality and context:

| Mark Type | When to Recommend |
|---|---|
| **Wordmark** | Business name is distinctive, ≤ 15 characters, works well in the chosen heading font; brand has no strong visual icon concept yet |
| **Lettermark** | Business name is long or hard to render small; initials are memorable and distinctive |
| **Symbol + Wordmark** | Brand has a strong conceptual territory that lends itself to an icon (e.g., nature, craft, a process); small-use contexts (favicon, badge) benefit from a standalone icon |
| **Abstract mark** | Brand is established enough for recognition without a name; rarely appropriate at startup stage |

For most early-stage startups (ASSESSMENT stage): recommend **wordmark** or **symbol + wordmark** unless there is a specific reason to recommend lettermark or abstract mark.

If the brand-product relationship pattern is "compound" (product name extends business name), the logo typically represents the business name only — the product name appears in marketing context, not in the logo.

**Digital presence detection:** Digital presence = true if any of: distribution channels include website / D2C / Shopify / social platforms / email marketing; OR dossier App Coverage lists any app or PWA; OR no explicit "offline-only" statement in strategy docs (default true if ambiguous). Use this determination in the guardrail and use case sections below.

**Icon viability guardrail:** If digital presence = true, the brief must ensure an icon-only derivative is feasible — either via a standalone symbol or a lettermark crop of the wordmark. Even "wordmark only" brands need a favicon and app icon. Add a note to the Mark Type section explicitly stating how the icon-only variant will be produced. If digital presence = false (explicitly documented as offline-only), this guardrail does not apply.

**Coined name guardrail:** If the business name is coined or abstract (no pre-existing meaning), and initial brand recognition is low, prefer **symbol + wordmark** unless the wordmark is exceptionally distinctive in the chosen font. A coined wordmark alone will not carry recognition at launch. Document this reasoning if it influences the recommendation.

### Step 3: Derive Colour Specification

Map directly from the brand identity dossier token values:
- Primary logo colour: `--color-primary` (HSL + hex)
- Secondary / accent: `--color-accent` (HSL + hex)
- Reversed / white treatment: when logo appears on dark or primary-coloured backgrounds
- Monochrome treatment: always include — logo must be usable in single colour (print, embossing, etching)

**Hex derivation:** Convert HSL to hex using the standard CSS sRGB formula. Express HSL as `H S% L%` (no parentheses, space-separated). Express hex as 6-digit uppercase (e.g., `#D879A8`). If conversion is not achievable with confidence, omit hex and note "Hex: designer to derive from HSL."

**Utility neutral exception:** White (`#FFFFFF`) and near-black (`#1A1A1A`) are standard utility neutrals — label them explicitly as such. They are not sourced from brand tokens and do not conflict with the "do not invent colours" constraint.

Note which token names map to which colours so the designer can cross-reference the brand dossier.

### Step 4: Derive Typography Specification

Map directly from the brand identity dossier Typography section:
- Heading font: use this font family as the logotype font for wordmarks
- Note weight: recommend a single weight for the logo (typically semibold or bold — not the regular body weight)
- Letter spacing: tight / normal / wide, based on brand personality

**Letterform modification policy:** Specify whether the designer may customise letterforms. Default: "Letterform customisation: allowed — kerning, baseline, and minor glyph adjustments are expected and encouraged."

**License note:** Google Fonts typically use open licenses (e.g., OFL/Apache); for logos sourced from Google Fonts, include: "Google Fonts — typically open license; designer should confirm the specific font's license before final logo/trademark usage." For any non-Google font, include: "Designer must verify font license suitability for logo/trademark use before finalising the logotype." Do not assert freely usable for any font without caveat.

If the heading font was not set in the dossier (TBD):
> "Typography: TBD — logo brief colour and mark type sections complete. Return to typography after ASSESSMENT-11 typography is finalised."

### Step 5: Build Deliverables and Lockups

Define what the designer must produce. This scopes the engagement and sets expectations for what "done" looks like.

**Lockups required:**
- Primary lockup: standard orientation (horizontal or stacked, based on mark type)
- If symbol + wordmark: stacked variant (icon above wordmark) and horizontal variant
- Icon-only variant (symbol or lettermark crop) — required for all businesses with digital presence
- Wordmark-only variant (if mark type includes a symbol)

**Colourways required:**
- Full colour (primary on white)
- 1-colour dark (on white)
- 1-colour light / reversed (on dark or primary-colour background)

**File formats required:**
- SVG — primary for all web/screen use
- PDF — print master
- PNG (transparent background) — social and marketing use
- ICO / PNG — favicon, if website use case is present

**Minimum viable set:** "At minimum: SVG primary lockup + SVG icon-only variant + 1-colour dark SVG."

If the business has physical product channels (packaging, hang tags, embossing): add "Simplified stamp/emboss variant — minimum detail, works at 1–3cm."

### Step 6: Build Use Case List

Derive from distribution channels (if present) and app coverage (from dossier):

| Context | Size requirement | Format needed |
|---|---|---|
| Social media profile icon | 32×32 to 400×400px | Square crop or icon-only mark |
| Social media banner / header | 1500×500px | Horizontal wordmark or symbol + wordmark |
| Website header | Full width, ~120px height | Horizontal wordmark (SVG) |
| Website favicon | 16×16 to 64×64px | Icon-only mark or lettermark crop |
| Email header | ~600px wide | PNG — horizontal wordmark |
| Hang tag / label | Varies; typically 4–8cm | Wordmark + any regulatory info |
| Packaging surface | Varies by format | All variants needed |
| Retail shelf label | ~4cm × 1.5cm | Monochrome / minimum size version |
| Product stamp / emboss | Relief; typically 1–3cm | Simplified mark, min detail |

Include only use cases relevant to the business's channel mix. **Always include: social icon, website header, email header. Add favicon if digital presence = true (see Step 2 detection rule).**

App icon use cases (app splash, in-app header, home screen icon) are included if App Coverage in the dossier lists a mobile app or PWA.

### Step 7: Build Forbidden Territory

Combine:
- Imagery Direction "Don't" directives from the brand dossier
- Explicit aesthetic constraints from the brand profile (Section E)
- General brand-category anti-patterns — **but only include these if the brand's category and positioning are explicitly stated in the brand profile or dossier**. Do not infer category anti-patterns from vague signals; rely on explicit brand strategy documentation. If category positioning is not explicit, rely solely on dossier and brand profile constraints.

Minimum 2 items required. Write each as a concrete constraint the designer can act on, not a vague instruction.

### Step 8: Select Reference Inspirations

Identify 3–5 reference logos or visual treatments that the brand could learn from. These are direction pointers — not to copy.

Format: "Brand Name — [what to take from this] / [what to avoid or why this isn't a direct match]"

**Competitor references:** May include direct competitors only as **differentiation anchors** (i.e., to describe what to avoid, not what to replicate). Label these explicitly: "Category norm / differentiation reference."

Derive from brand inspirations in Section E of the brand profile. If no brand inspirations are documented, write:
> "No reference inspirations documented in brand strategy. Operator should provide: 2 aspirational references, 2 category / differentiation references, 1 anti-reference (example of what NOT to do) at designer brief handoff."

### Step 9: Wordmark feasibility note (optional)

If mark type includes a wordmark and the heading font is a free Google Fonts font:
- If the business name is ≤ 20 characters and the font renders well at small sizes: flag "Basic SVG wordmark may be producible from the brand fonts without a custom logo designer — see Optional Wordmark Note in the brief"
- If the name is complex or the font does not render well small: note "A professional logo designer is recommended for wordmark production"

### Step 10: Generate AI mock-up prompt

Translate the brief's visual ingredients into a ready-to-paste image generation prompt for ChatGPT (GPT-4o image generation) or DALL-E 3. This allows the operator to produce concept-quality mockups without additional context.

**Critical: the prompt must be an unambiguous generative command — not a document, not a brief, not a paragraph of context.** ChatGPT will interpret any document-style text as something to critique or discuss. The prompt must open with an imperative verb ("Generate") so the model immediately knows its job is to produce images.

**Translation rules:**

1. **Open with an imperative.** The very first word must be "Generate". First sentence: "Generate [N] logo design images for [business name]..." — one sentence, no preamble.

2. **Specify compositions explicitly.** Do not ask for "4 variations" without naming them. List the exact lockups as a numbered list so ChatGPT produces genuinely distinct outputs:
   - 1. Symbol left, wordmark right — horizontal lockup
   - 2. Symbol above wordmark, centred — stacked lockup
   - 3. Symbol/icon alone at large scale — icon-only
   - 4. Wordmark alone, no symbol — wordmark-only
   (Adjust for the actual mark type — if wordmark-only brand, list 4 spacing/weight variations instead.)

3. **Request rationale per image.** After the composition list, add: "After each image, write 2–3 sentences explaining the compositional choice and what use case it is best suited to."

4. **Font → visual description.** Do NOT use the font name. Describe what it looks like: stroke weight, serif style, rhythm, overall register. Example: "Cormorant Garamond Medium with wide tracking" → "editorial serif with slightly fragile thin strokes and wide open letter spacing".

5. **Colours → hex values.** State the primary colour as a hex code and a plain-language description ("soft rose pink, #E29CA2"). Do not use brand token names or marketing names (no "Strawberry Milk"). Mention both the full-colour treatment and a monochrome version alongside each image.

6. **Mark type → literal description.** Describe what the logo physically looks like: "a stylised lowercase 'y' as a symbol mark + the wordmark 'Caryina' in an editorial serif with thin strokes and wide open letter spacing."

7. **Forbidden territory → negative instructions.** Convert each Forbidden Territory item into a "no X" phrase. Group them on a single line to save space.

8. **Format constraint.** Include: "Flat vector style. White background. No 3D effects, no shadows, no photography."

9. **Length constraint.** Keep the prompt under 200 words. The compositions list + rationale instruction + visual description + negatives should fit comfortably. Cut any redundant phrasing.

**Output format in brief:** A single plain-text code block under "## 9. AI Mock-Up Prompt", ready to paste into ChatGPT with no modification.

**Note:** This prompt is for concept exploration only — not for producing production-ready artwork. Frame this clearly in the brief section header.

---

### Step 11: Save artifact and report

Save the logo brief (see Output Contract below). Then continue to Steps 12–15.

---

### Step 12: Resolve icon character and app directory

**Icon character:**
- Read the brief's "Icon-only derivative" line from the Mark Type section.
- Extract the quoted character (e.g., `"y"` → `y`).
- Fallback: first letter of business name, lowercased.

**App directory:**
- If `--app-dir` was provided, use that path verbatim.
- Otherwise: construct `apps/<business-name-lowercase>` (e.g., business name "Caryina" → `apps/caryina`).
- Check whether the resolved directory exists on disk.
- If it does not exist: set `app-dir = null`. Skip Steps 13–14. Proceed to Step 15.

---

### Step 13: Write SVG source files

Write the following files to `<app-dir>/public/`:

**`logo-wordmark.svg`** — the full wordmark SVG.
- Split the business name around the icon character: `prefix` + `icon-char` + `suffix`.
- `prefix` and `suffix` in `--color-primary` hex, `font-weight: 500`.
- `icon-char` in `--color-accent` hex, `font-weight: 300`.
- `font-family`: the dossier heading font, with `Georgia, serif` as fallback.
- `letter-spacing`: wide (7px at 46px font size — matches brief typography guidance).
- `viewBox="0 0 320 88"`, `x="20"`, `y="59"`.
- Background rect: `--color-bg` (warm ivory) or fallback `#FAF9F7`.
- Google Fonts `@import` in CDATA style block.

**`logo-icon.svg`** — the standalone icon mark.
- Single character (icon-char) centred in a 200×200 square.
- `font-size: 140`, `font-weight: 300`, `fill: --color-accent`.
- Same background as wordmark.

Use the shared generation script instead of writing these manually if it is faster:
```
node scripts/generate-logo-assets.mjs \
  --app-dir <app-dir> \
  --name "<business-name>" \
  --icon-char "<icon-char>" \
  --primary "<primary-hex>" \
  --accent "<accent-hex>" \
  --bg "<bg-hex>" \
  --font-family "<heading-font-family>"
```

The script also completes Steps 13 and 14 in one run — see Step 14.

---

### Step 14: Generate raster assets and manifest

Run the shared generation script (if not already run in Step 13):

```
node scripts/generate-logo-assets.mjs \
  --app-dir <app-dir> \
  --name "<business-name>" \
  --icon-char "<icon-char>" \
  --primary "<primary-hex>" \
  --accent "<accent-hex>" \
  --bg "<bg-hex>" \
  --font-family "<heading-font-family>"
```

This produces in `<app-dir>/public/`:
- `favicon.svg` — copy of `logo-icon.svg`
- `apple-touch-icon.png` — 180×180 Playwright render
- `icon-192.png` — 192×192 PNG
- `icon-512.png` — 512×512 PNG
- `og-image.png` — 1200×630 PNG
- `og-image.webp` — 1200×630 WebP
- `site.webmanifest` — PWA manifest with name, icons, theme colour

Requires Playwright and sharp to be available in the monorepo (`playwright` and `sharp` are both dependencies).

---

### Step 15: Update Next.js layout metadata

Read `<app-dir>/src/app/layout.tsx` (root layout — the one that exports `metadata`, not the locale layout).

If `icons`, `openGraph`, `twitter`, and `manifest` keys are all already present in the `metadata` export: skip with a note "layout metadata already set — skipping."

Otherwise, add the missing keys to the `metadata` export:

```typescript
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "<business-name>",
    description: "<description from existing metadata>",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "<business-name>",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
```

If `app-dir = null` (app not found): skip this step. Include the following in the Completion Message instead:

> "App directory not found — logo assets not deployed. When the app is ready, run:
> `node scripts/generate-logo-assets.mjs --app-dir <dir> --name \"<name>\" --icon-char \"<icon-char>\" --primary \"<hex>\" --accent \"<hex>\" --bg \"<hex>\" --font-family \"<family>\"`
> Then add the metadata block to `<app-dir>/src/app/layout.tsx`."

---

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

---

## Quality Gate

Before saving, verify:

- [ ] All 9 sections present with non-placeholder content
- [ ] Mark Type is one of: wordmark, lettermark, symbol + wordmark, abstract mark — rationale provided
- [ ] Icon-only derivative specified in Mark Type section (required for all digital-presence businesses)
- [ ] Colour Specification maps token names from brand identity dossier; white and near-black labelled as "Utility neutral" (not invented from thin air)
- [ ] HSL expressed as `H S% L%`; hex as 6-digit uppercase; hex omitted with note if conversion not confident
- [ ] Typography Specification references the heading font from the dossier; if TBD, noted explicitly; includes modification policy and license note
- [ ] Deliverables and Lockups section (Section 4) present with at least the minimum viable set
- [ ] Use Case List has ≥ 4 use cases; social icon, website header, email header, and favicon always present for web-enabled businesses
- [ ] Forbidden Territory has ≥ 2 concrete, actionable constraints (not vague directives); category anti-patterns only included if category/positioning explicitly stated in strategy docs
- [ ] Reference Inspirations has ≥ 2 entries (or explicit operator-request note)
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status (Draft), Created, Updated, Owner, Inputs all present
- [ ] Inputs list in frontmatter contains exact filenames of all source documents used
- [ ] Business-Name sourced from product naming doc; name reconciliation note present if discrepancy found
- [ ] Section 9 AI Mock-Up Prompt present: single plain-text code block; opens with imperative "Generate"; ≤ 200 words; lists 4 named compositions explicitly (not just "4 variations"); includes "after each image, write 2–3 sentences..."; uses no font names or brand token names; uses hex colour values directly; includes "no X" negative instructions from Forbidden Territory
- [ ] Artifact saved to correct path before completion message
- [ ] Steps 12–15 attempted: icon character resolved, app-dir resolution documented (found or not found)
- [ ] If app-dir found: SVG files written, raster script run, layout.tsx updated (or skipped with reason noted)
- [ ] If app-dir not found: skip message with full run command included in Completion Message

## Red Flags

Invalid outputs — do not emit:

- Mark Type left as "TBD" or undefined
- Colour Specification with invented HSL values not drawn from the brand dossier (white and near-black as utility neutrals are allowed)
- Typography TBD without a specific note about when and how it will be resolved
- No deliverables section — a brief without a deliverables list is incomplete for a designer engagement
- Icon-only derivative not addressed when business has digital presence
- Use Case List with fewer than 4 use cases for a web-enabled business; fewer than 3 for non-digital
- Forbidden Territory with fewer than 2 items, or items so vague they are not actionable ("avoid ugly logos")
- Category anti-patterns in Forbidden Territory without explicit evidence in strategy docs
- Inputs block missing from frontmatter
- Business-Name sourced from brand profile when product naming doc is available
- Artifact not saved (output must be written to file, not only displayed in chat)

## Completion Message

> "Logo design brief recorded: `docs/business-os/strategy/<BIZ>/<date>-logo-brief.user.md`."
>
> "Inputs used: [list exact filenames]. Mark type: [type]. [N] lockup variants. [N] use cases. Forbidden territory: [N] constraints. Wordmark feasibility: [feasible / designer recommended]."
>
> "[Name reconciliation note if names differed — or omit.]"
>
> "AI mock-up prompt ready in Section 9 — paste into ChatGPT (GPT-4o with image generation) to generate concept-quality logo mockups for review before briefing a designer."
>
> **Logo assets deployed to `<app-dir>/public/`:** favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.webp, site.webmanifest. Layout metadata updated in `<app-dir>/src/app/layout.tsx`.
>
> — OR, if app-dir not found —
>
> **Logo assets not deployed** — app directory `apps/<name-lowercase>` not found. When the app is ready, run:
> `` node scripts/generate-logo-assets.mjs --app-dir <dir> --name "<name>" --icon-char "<char>" --primary "<hex>" --accent "<hex>" --bg "<hex>" --font-family "<family>" ``
> Then add the metadata block to `<app-dir>/src/app/layout.tsx` (see Step 15 in SKILL.md).
>
> "Next steps: share this brief with a logo designer, OR run `/lp-do-assessment-15-packaging-brief --business <BIZ>` if this is a physical product business."

---

## Integration

**Upstream (ASSESSMENT-13):**
- Reads `*-product-naming.user.md` as required input. The confirmed **business name** is the source of truth for the logotype name. The product name informs the brand–product relationship note (and whether any descriptor lockup is needed), but typically does not appear in the primary logo for compound patterns.

**Upstream (ASSESSMENT-11/12):**
- Reads `*-brand-identity-dossier.user.md` as the primary source for Colour Specification and Typography Specification. The dossier must exist; if it remains at Draft status (ASSESSMENT-12 not yet run), proceed with a provisional note.

**Downstream (ASSESSMENT-15):**
- `/lp-do-assessment-15-packaging-brief` reads `*-logo-brief.user.md` for the Brand Assets section of the packaging brief.

**Downstream (/lp-design-spec):**
- `/lp-design-spec` reads the brand dossier and (if present) the logo brief for the Logo Brief section populated by TASK-05 in the brand language template.

**Logo asset deployment (Steps 12–15):**
- Shared generation script: `scripts/generate-logo-assets.mjs` — accepts brand token params and app-dir, produces all rasters + `site.webmanifest`.
- Full ASSESSMENT-14 completion = brief doc + SVG source files + rasters deployed to `<app-dir>/public/` + layout.tsx metadata wired.
- If app-dir is not found at brief time, the deployment command is included in the Completion Message for later execution.
- If a designer later supplies production SVG/PNG files, re-run the script with the designer files placed as `logo-wordmark.svg` and `logo-icon.svg` in `<app-dir>/public/`, and re-run raster generation only (or pass them directly to Playwright via the script's render path).

**GATE-ASSESSMENT-01:** This skill's output (`*-logo-brief.user.md`) must exist and pass quality gate before GATE-ASSESSMENT-01 allows ASSESSMENT→MEASURE transition.
