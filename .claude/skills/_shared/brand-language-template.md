# Brand Language Template

Shared template for per-business brand language documents. These live at:

```
docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md
```

Each operating business should have one. The `/lp-design-spec` skill reads these as input and writes back stable new patterns as output.

## Template

```markdown
---
Type: Brand-Language
Stage: ASSESSMENT-11
Business-Unit: {BIZ}
Business-Name: {name}
Status: Draft | Active
Created: {DATE}
Updated: {DATE}
Last-reviewed: {DATE}
Owner: {operator}
---

# {Business Name} — Brand Language

## Audience

**Primary:** {Who is the main user? Age, gender skew, context of use.}
**Secondary:** {Any secondary audience.}
**Device:** {mobile-only | mobile-first | responsive | desktop-first}
**Context:** {When and where do they use this? What's their mindset?}

## Personality

{3-5 adjective pairs that define the brand voice. Format: "We are X, not Y."}

- **{Adjective}**, not {opposite}
- **{Adjective}**, not {opposite}
- **{Adjective}**, not {opposite}

## Visual Identity

### Imagery Strategy

| Field | Value |
|-------|-------|
| Imagery prominence | `high` \| `medium` \| `low` — how dominant is product/lifestyle photography in the site experience? |
| Typical imagery character | {e.g., "bright product colours on editorial backgrounds", "muted lifestyle photography", "flat-lay product shots"} |
| Palette implication | `recessive` (pastels/neutrals) \| `balanced` \| `expressive` (saturated brand colour leads) |

> **Note:** If `imagery_prominence = high`, the palette must recede. Product images should do the visual work — a saturated or dark primary will compete with bright photography and reduce conversion on image-heavy pages.

### Colour Palette — Light Mode

| Role | Token | HSL | Rationale |
|------|-------|-----|-----------|
| Primary | `--color-primary` | {H S% L%} | {Why this color} |
| Primary fg | `--color-primary-fg` | {H S% L%} | {Foreground on primary — must be WCAG AA} |
| Primary soft | `--color-primary-soft` | {H S% L%} | {Tint for hover/secondary surfaces} |
| Accent | `--color-accent` | {H S% L%} | {Why this color} |
| Background | `--color-bg` | {from base or override} | {Why} |

**Palette mood:** {1 sentence — warm/cool/neutral, high/low contrast, etc.}

### Colour Palette — Dark Mode

| Token | Light Value | Dark Value | Dark Rationale |
|-------|-------------|------------|----------------|
| `--color-bg` | {light hsl} | {dark hsl} | {e.g., "Warm near-black — stays in brand hue family"} |
| `--color-fg` | {light hsl} | {dark hsl} | {e.g., "Warm near-white — avoids clinical cold-white"} |
| `--color-fg-muted` | {light hsl} | {dark hsl} | {mid-tone muted text} |
| `--color-border` | {light hsl} | {dark hsl} | {subtle warm-toned dividers} |
| `--color-primary` | {same} | {same or adjusted} | {note if unchanged} |
| `--color-primary-fg` | {light hsl} | {dark hsl} | {matches dark bg} |
| `--color-primary-soft` | {light hsl} | {dark hsl} | {chips, badges on dark} |
| `--color-accent` | {light hsl} | {dark hsl} | {slightly richer on dark or unchanged} |
| `--color-accent-soft` | {light hsl} | {dark hsl} | {tags and focus rings in dark mode} |

> **Surface token:** `--color-surface` light = `{hsl}` / dark = `{hsl}` (card faces lifted slightly from bg).

**Dark mode mood:** {1 sentence — which hue family, temperature, register.}

**Canonical token names** (from `packages/themes/base/src/tokens.ts`):
`--color-primary` (+ `-fg`, `-soft`, `-hover`, `-active`), `--color-accent` (+ `-fg`, `-soft`), `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-border`.

### Typography

> **Constraint:** All fonts must be freely available — Google Fonts or system stacks only. No paid or licensed typefaces.

| Role | Token | Font Family | Source | Rationale |
|------|-------|-------------|--------|-----------|
| Body | `--font-sans` | {family} | [Google Fonts]({url}) | {Why this font} |
| Headings | `--font-heading-1` | {family or "inherits body"} | {same or link} | {Why} |

**Google Fonts URL:** `https://fonts.googleapis.com/css2?family={Family}:wght@{weights}&display=swap`

**Type personality:** {1 sentence — geometric/humanist, formal/casual, etc.}

### Shape & Elevation

| Property | Token | Value | Notes |
|----------|-------|-------|-------|
| Card radius | `--radius-md` | {value} | {Sharper = more corporate, softer = more friendly} |
| Default shadow | `shadow-sm` | {from base} | {When to use elevation} |

### Imagery Direction

{What kind of photos/illustrations fit this brand? What doesn't fit?}

- **Do:** {e.g., "Warm, candid lifestyle photography with natural lighting"}
- **Don't:** {e.g., "Stock photography with white backgrounds, corporate headshots"}

## Voice & Tone

### Writing Style

- **Sentence length:** {short/medium/long}
- **Formality:** {casual/conversational/professional/formal}
- **Technical level:** {avoid jargon | some jargon OK | technical audience}
- **Humour:** {none | light and dry | warm and playful | frequent}

### Key Phrases

{Brand-specific language to use consistently.}

- {e.g., "Your stay" not "Your booking"}
- {e.g., "Explore" not "Browse"}

### Words to Avoid

- {Word or phrase} — {why}

### Brand Claims

**Origin claim:** Made in {country} | Designed in {country} | Handfinished in {country} | Curated in {country}

> **Legal note:** "Made in [country]" requires substantial manufacturing in that country (EU consumer law; Italian Law 166/2009 for Italian claims). If manufacturing occurs elsewhere, use Designed / Handfinished / Curated instead.

**Manufacturing country:** {where products are physically made}
**Operator's role:** {designer | finisher | curator | sourcer}

## Token Overrides

Theme package: `packages/themes/{theme}/src/tokens.ts`

**Tokens that differ from base:**

| Token | Base Value | Override Value | Reason |
|-------|-----------|----------------|--------|
| `--color-primary` | {base} | {override} | {reason} |
| ... | ... | ... | ... |

**Dark mode overrides** (tokens that differ from base dark — if your dark palette is custom, list them here):

| Token | Base Dark Value | Override Value | Reason |
|-------|-----------------|----------------|--------|
| `--color-bg` | {base dark bg} | {override} | {reason} |
| ... | ... | ... | ... |

> If all dark tokens inherit from base with no overrides, write: "Dark mode inherits base dark tokens — no overrides."

## Signature Patterns

{Recurring design patterns specific to this business. Added over time as `/lp-design-spec` identifies stable patterns.}

### {Pattern Name}

**When:** {When to use this pattern}
**Implementation:** {Token classes or component reference}
**Example:** {Where it's used in the app}

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| {app} | `packages/themes/{theme}/` | {Active | Planned | TBD} | {notes} |

## Logo Brief

*Populated by `/lp-do-assessment-14-logo-brief`. Full artifact: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`*

| Field | Value |
|---|---|
| Mark Type | {wordmark \| lettermark \| symbol + wordmark \| abstract mark} |
| Primary Colour from Palette | `--color-primary` {HSL value} |
| Accent from Palette | `--color-accent` {HSL value} |
| Typography from Dossier | {heading font family, weight for logo} |
| Use Cases | {e.g., social icon, website header, email header, hang tag — list from brief} |
| Forbidden Territory | {key constraints from brief} |
| Reference Inspirations | {brand references from brief, or "See full artifact"} |
| Wordmark Note | {TBD — feasible from brand fonts \| designer recommended} |

## Packaging Brief

*Populated by `/lp-do-assessment-15-packaging-brief` (conditional: physical-product only). Full artifact: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`*

| Field | Value |
|---|---|
| Structural Format | {TBD — e.g., hang tag + poly bag \| folding carton \| label + outer box} |
| Regulatory Category | {TBD — fashion/leather goods \| homeware/ceramics \| cosmetics/skincare \| food/beverage} |
| Key Regulatory Fields | {TBD — e.g., fibre composition, care symbols, INCI list, allergens — from regulatory checklist} |
| Brand Assets Used | {TBD — logo variant(s), colour tokens, typography from brief} |
| Print Specification Notes | {TBD — e.g., CMYK not RGB, minimum print size, finish (matte/gloss/foil)} |

## References

- Business strategy: `docs/business-os/strategy/{BIZ}/plan.user.md`
- Theme tokens: `packages/themes/{theme}/src/tokens.ts`
- Design system handbook: `docs/design-system-handbook.md`
```

## Usage Notes

- **TBD sections:** Mark unknowns as `TBD — {what's needed}`. The doc is useful even partially complete.
- **Feedback loop:** `/lp-design-spec` updates the Signature Patterns and Token Overrides sections when it discovers stable new patterns during feature work.
- **Review cadence:** Brand language should be reviewed when business strategy changes or after major design work.
- **One per business:** Even if a business has multiple apps (e.g., BRIK has brikette + prime), there's one brand language doc. Per-app differences are captured in the App Coverage table and Token Overrides section.
