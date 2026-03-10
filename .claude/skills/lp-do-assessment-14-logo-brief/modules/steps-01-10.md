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
