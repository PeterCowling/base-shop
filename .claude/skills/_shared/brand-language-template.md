# Brand Language Template

Shared template for per-business brand language documents. These live at:

```
docs/business-os/strategy/<BIZ>/brand-language.user.md
```

Each operating business should have one. The `/design-spec` skill reads these as input and writes back stable new patterns as output.

## Template

```markdown
---
Type: Brand-Language
Business-Unit: {BIZ}
Business-Name: {name}
Status: Draft | Active
Created: {DATE}
Last-reviewed: {DATE}
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

### Color Palette

| Role | Token | HSL | Rationale |
|------|-------|-----|-----------|
| Primary | `--color-primary` | {H S% L%} | {Why this color} |
| Accent | `--color-accent` | {H S% L%} | {Why this color} |
| Background | `--color-bg` | {from base or override} | {Why} |

**Palette mood:** {1 sentence — warm/cool/neutral, high/low contrast, etc.}

### Typography

| Role | Token | Font Family | Rationale |
|------|-------|-------------|-----------|
| Body | `--font-sans` | {family} | {Why this font} |
| Headings | `--font-heading-1` | {family or "inherits body"} | {Why} |

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
- **Humor:** {none | light | frequent}

### Key Phrases

{Brand-specific language to use consistently.}

- {e.g., "Your stay" not "Your booking"}
- {e.g., "Explore" not "Browse"}

### Words to Avoid

- {Word or phrase} — {why}

## Token Overrides

Theme package: `packages/themes/{theme}/src/tokens.ts`

**Tokens that differ from base:**

| Token | Base Value | Override Value | Reason |
|-------|-----------|----------------|--------|
| `--color-primary` | {base} | {override} | {reason} |
| ... | ... | ... | ... |

## Signature Patterns

{Recurring design patterns specific to this business. Added over time as `/design-spec` identifies stable patterns.}

### {Pattern Name}

**When:** {When to use this pattern}
**Implementation:** {Token classes or component reference}
**Example:** {Where it's used in the app}

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| {app} | `packages/themes/{theme}/` | {Active | Planned | TBD} | {notes} |

## References

- Business strategy: `docs/business-os/strategy/{BIZ}/plan.user.md`
- Theme tokens: `packages/themes/{theme}/src/tokens.ts`
- Design system handbook: `docs/design-system-handbook.md`
```

## Usage Notes

- **TBD sections:** Mark unknowns as `TBD — {what's needed}`. The doc is useful even partially complete.
- **Feedback loop:** `/design-spec` updates the Signature Patterns and Token Overrides sections when it discovers stable new patterns during feature work.
- **Review cadence:** Brand language should be reviewed when business strategy changes or after major design work.
- **One per business:** Even if a business has multiple apps (e.g., BRIK has brikette + prime), there's one brand language doc. Per-app differences are captured in the App Coverage table and Token Overrides section.
