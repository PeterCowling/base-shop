---
name: lp-do-assessment-14-logo-brief
description: Logo design brief for new startups (ASSESSMENT-14). Synthesises brand identity dossier, brand profile, and product naming to produce a complete logo design brief ready to hand to a designer. Upstream of lp-do-assessment-15-packaging-brief and /lp-design-spec.
---

# lp-do-assessment-14-logo-brief — Logo Design Brief (ASSESSMENT-14)

Produces a designer-ready logo design brief by synthesising the visual identity decisions already made in ASSESSMENT-10 (brand profile) and ASSESSMENT-11 (brand identity dossier). Does not re-elicit audience or personality — those decisions are already made and carried forward. The brief specifies mark type, colour application, typography, use cases, and constraints: everything a logo designer needs to begin without additional Q&A.

## Invocation

```
/lp-do-assessment-14-logo-brief --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

**ASSESSMENT-13 gate:** If no ASSESSMENT-13 product naming artifact exists, halt and emit:
> "ASSESSMENT-13 artifact not found at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md`. A product naming document is required before the logo brief can be produced. Run `/lp-do-assessment-13-product-naming --business <BIZ>` first."

## Operating Mode

EXECUTE

This skill synthesises existing brand strategy inputs into a logo brief. The operator does not provide field-by-field input during execution — they review the produced brief and confirm or request amendments.

The skill makes reasoned decisions about mark type and use cases based on the brand strategy inputs. These are design recommendations for operator review, not fixed specifications.

Does NOT:
- Re-elicit audience, personality, or voice & tone (ASSESSMENT-10)
- Re-elicit colour palette or typography (ASSESSMENT-11)
- Generate actual SVG files, logo artwork, or AI-generated imagery
- Run automated trademark searches
- Attempt to produce a production-ready logo — the brief is the deliverable

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| Brand identity dossier | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` | Yes — primary input; blocks if absent |
| Brand profile | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md` | Yes — personality adjective pairs, positioning constraints |
| Product naming document | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md` | Yes — confirmed business name, product name, brand-product relationship pattern |
| Distribution plan | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-launch-distribution-plan.user.md` | No — read if present; informs Use Case List (channels → physical/digital use contexts) |

If `<YYYY-MM-DD>-brand-identity-dossier.user.md` is absent, halt and emit:
> "Brand identity dossier not found at `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md`. Run `/lp-do-assessment-11-brand-identity --business <BIZ>` first."

---

## Steps

### Step 1: Read and extract brand strategy inputs

Read `<YYYY-MM-DD>-brand-identity-dossier.user.md`. Extract:
- `--color-primary` and `--color-accent` token values (HSL and rationale)
- Typography heading font family and body font family
- Imagery Direction: Do / Don't directives (these inform Forbidden Territory)
- Signature Patterns (if any — note if TBD)
- App Coverage (notes which apps exist — informs Use Case List)

Read `<YYYY-MM-DD>-brand-profile.user.md`. Extract:
- Confirmed operating name
- Personality adjective pairs (Section C)
- Aesthetic constraints and brand inspirations (Section E)
- Any explicit visual constraints (e.g., "avoid tech-bro neon", "must not look clinical")

Read `<YYYY-MM-DD>-product-naming.user.md`. Extract:
- Brand-product relationship pattern (compound / standalone / coined standalone)
- Confirmed or provisional product name
- Any relevant TM constraints noted

Read `<YYYY-MM-DD>-launch-distribution-plan.user.md` if present. Extract:
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

### Step 3: Derive Colour Specification

Map directly from the brand identity dossier token values:
- Primary logo colour: `--color-primary` (HSL value + hex if derivable)
- Secondary / accent: `--color-accent` (HSL value)
- Reversed / white treatment: when logo appears on dark or primary-coloured backgrounds
- Monochrome treatment: always include — logo must be usable in single colour (print, embossing, etching)

Note which token names map to which colours so the designer can cross-reference the brand dossier.

### Step 4: Derive Typography Specification

Map directly from the brand identity dossier Typography section:
- Heading font: use this font family as the logotype font for wordmarks
- Note weight: recommend a single weight for the logo (typically semibold or bold — not the regular body weight)
- Note if the heading font has licensing constraints: Google Fonts fonts are freely usable in logos; check licence for any other font

If the heading font was not set in the dossier (TBD):
> "Typography: TBD — logo brief colour and mark type sections complete. Return to typography after ASSESSMENT-11 typography is finalised."

### Step 5: Build Use Case List

Derive from distribution channels (if present) and app coverage (from dossier):

| Context | Size requirement | Format needed |
|---|---|---|
| Social media profile icon | 32×32 to 400×400px | Square crop or icon-only mark |
| Social media banner / header | 1500×500px | Horizontal wordmark or symbol + wordmark |
| Website header | Full width, ~120px height | Horizontal wordmark (SVG) |
| Website favicon | 16×16 to 64×64px | Icon-only mark or lettermark |
| Email header | ~600px wide | Horizontal wordmark |
| Hang tag / label | Varies; typically 4–8cm | Wordmark + any regulatory info |
| Packaging surface | Varies by format | All variants needed |
| Retail shelf label | ~4cm × 1.5cm | Monochrome / minimum size version |
| Product stamp / emboss | Relief; typically 1–3cm | Simplified mark, min detail |

Include only use cases relevant to the business's channel mix. Always include: social icon, website header, email header.

### Step 6: Build Forbidden Territory

Combine:
- Imagery Direction "Don't" directives from the brand dossier
- Explicit aesthetic constraints from the brand profile (Section E)
- General brand-category anti-patterns (e.g., a craft/artisan brand should avoid tech-startup minimalism; a luxury brand should avoid playful illustration)

Minimum 2 items required. Write each as a concrete constraint the designer can act on, not a vague instruction.

### Step 7: Select Reference Inspirations

Identify 3–5 reference logos or visual treatments that the brand could learn from. These are direction pointers — not to copy.

Format: "Brand Name — [what to take from this] / [what to avoid or why this isn't a direct match]"

Derive from brand inspirations in Section E of the brand profile. If no brand inspirations are documented, write: "No reference inspirations documented in brand strategy. Operator should provide 3–5 reference logos at designer brief handoff."

### Step 8: Wordmark feasibility note (optional)

If mark type includes a wordmark and the heading font is a free Google Fonts font:
- Note the business name in the heading font at typical weights
- If the business name is ≤ 20 characters and the font renders well at small sizes: flag "Basic SVG wordmark may be producible from the brand fonts without a custom logo designer — see Optional Wordmark Note in the brief"
- If the name is complex or the font does not render well small: note "A professional logo designer is recommended for wordmark production"

### Step 9: Save artifact and report

Save the logo brief (see Output Contract below).

Report to operator:
- Mark Type recommendation and rationale
- Colour tokens mapped
- Typography specification (or TBD note)
- Number of use cases in the brief
- Whether a basic SVG wordmark appears feasible from brand fonts
- Any design decisions the operator may want to review or override

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`

**Format:**

```markdown
---
Type: Logo-Brief
Stage: ASSESSMENT-14
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft | Active
Created: <date>
Updated: <date>
Owner: <operator>
---

# Logo Design Brief — <BIZ> (ASSESSMENT-14)

## 1. Mark Type

**Recommended mark type:** wordmark | lettermark | symbol + wordmark | abstract mark

**Rationale:** <why this mark type fits the brand context>

**Logotype name:** <Business name as it should appear in the logo>
**Character count:** <N characters — relevant for minimum size and wordmark feasibility>

## 2. Colour Specification

| Role | Token | HSL Value | Hex (approx) | Usage |
|---|---|---|---|---|
| Primary logo colour | `--color-primary` | <HSL> | <hex> | Main brand mark on white/light bg |
| Secondary / accent | `--color-accent` | <HSL> | <hex> | Highlights, icon elements |
| Reversed / white | — | 0 0% 100% | #FFFFFF | On dark or primary-coloured backgrounds |
| Monochrome (dark) | — | 0 0% 10% | ~#1A1A1A | Single-colour print, embossing, etching |

**Note:** Token names reference `<YYYY-MM-DD>-brand-identity-dossier.user.md`. All colour decisions must be validated against that dossier before production.

## 3. Typography Specification

**Logotype font:** <font family name>
**Source:** Google Fonts — <URL> | System font | Other (specify)
**Weight for logo:** <e.g., Semibold (600) | Bold (700)>
**Letter spacing:** <tight | normal | wide — recommendation based on personality>

**Note:** The logotype font must match the heading font in the brand identity dossier. If the heading font changes, the logo brief typography section must be updated.

## 4. Use Case List

| Use Case | Context | Size Guidance | Format Required |
|---|---|---|---|
| Social media profile icon | Instagram, Facebook, Pinterest profile | 400×400px minimum | Icon-only or square wordmark crop |
| Social media banner | Header / cover image | 1500×500px | Horizontal wordmark |
| Website header | Site navigation bar | ~120px height, responsive width | SVG — horizontal wordmark |
| Website favicon | Browser tab, bookmark | 16×16 to 64×64px | ICO / PNG — simplified mark |
| Email header | Transactional and marketing emails | ~600px wide | PNG — horizontal wordmark |
| <channel-specific> | <derived from distribution channels> | <varies> | <format> |

*Add or remove rows based on the business's channel mix.*

## 5. Forbidden Territory

The designer must NOT produce work that:

- <Item 1 — concrete constraint, e.g., "Uses any typeface that reads as tech-startup minimalist (e.g., thin-weight sans-serif, all-lowercase)">
- <Item 2 — concrete constraint, e.g., "Applies gradients or drop shadows to the primary mark — the brand is clean and artisanal, not digital-product">
- <Additional items as derived from brand strategy>

## 6. Reference Inspirations

The following references are direction pointers — NOT to be copied:

- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>
- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>
- **<Brand Name>** — <what to take from this> / <what to avoid or why this differs>

## 7. Optional Wordmark Note

<If feasible:> The business name set in [font family] at [weight] may be usable as a basic wordmark without custom logo design. A designer can refine spacing, baseline, and optionally add a simple mark. This is a low-cost starting point — a fully custom logotype will produce a more refined result.

<If not recommended:> The business name length / font characteristics mean a professional logo designer is recommended for wordmark production. A basic font-set wordmark is unlikely to be distinctive enough at small sizes.
```

---

## Quality Gate

Before saving, verify:

- [ ] All 7 sections present with non-placeholder content
- [ ] Mark Type is one of: wordmark, lettermark, symbol + wordmark, abstract mark — rationale provided
- [ ] Colour Specification maps token names from brand identity dossier — not invented colours
- [ ] Typography Specification references the heading font from the dossier; if TBD, noted explicitly
- [ ] Use Case List has ≥ 3 use cases; social icon, website header, and email header are always present
- [ ] Forbidden Territory has ≥ 2 concrete, actionable constraints (not vague directives)
- [ ] Reference Inspirations has ≥ 2 entries (or explicit note that brand profile has no inspirations documented)
- [ ] Frontmatter: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Owner all present
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Mark Type left as "TBD" or undefined
- Colour Specification with invented HSL values not drawn from the brand dossier
- Typography TBD without a specific note about when and how it will be resolved
- Use Case List with fewer than 3 use cases
- Forbidden Territory with fewer than 2 items, or items so vague they are not actionable ("avoid ugly logos")
- Artifact not saved (output must be written to file, not only displayed in chat)

## Completion Message

> "Logo design brief recorded: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`. Mark type: [type]. [N] use cases. Forbidden territory: [N] constraints. Wordmark feasibility: [feasible / designer recommended]."
>
> "Next steps: share this brief with a logo designer, OR run `/lp-do-assessment-15-packaging-brief --business <BIZ>` if this is a physical product business."

---

## Integration

**Upstream (ASSESSMENT-13):**
- Reads `<YYYY-MM-DD>-product-naming.user.md` as required input. The confirmed product name informs the logotype name and the brand-product relationship note in the Mark Type section.

**Upstream (ASSESSMENT-11/12):**
- Reads `<YYYY-MM-DD>-brand-identity-dossier.user.md` as the primary source for Colour Specification and Typography Specification. The dossier must exist; if it remains at Draft status (ASSESSMENT-12 not yet run), proceed with a provisional note.

**Downstream (ASSESSMENT-15):**
- `/lp-do-assessment-15-packaging-brief` reads `<YYYY-MM-DD>-logo-brief.user.md` for the Brand Assets section of the packaging brief.

**Downstream (/lp-design-spec):**
- `/lp-design-spec` reads the brand dossier and (if present) the logo brief for the Logo Brief section populated by TASK-05 in the brand language template.

**GATE-ASSESSMENT-01:** This skill's output (`<YYYY-MM-DD>-logo-brief.user.md`) must exist and pass quality gate before GATE-ASSESSMENT-01 allows ASSESSMENT→MEASURE transition.
