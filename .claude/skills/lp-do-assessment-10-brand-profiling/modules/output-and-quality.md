# Output Contract, Quality Gate, and Red Flags

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md`

**Format:**

```markdown
---
Type: Brand-Strategy
Stage: ASSESSMENT-10
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft | Active
Created: <date>
Updated: <date>
Owner: <operator>
---

# Brand Strategy — <BIZ> (ASSESSMENT-10)

## A) Name Confirmation

| Field | Value | Status |
|-------|-------|--------|
| Operating name | <confirmed name> | confirmed \| provisional |
| Name source | shortlist-recommended \| operator-override \| new | — |
| Shortlist considered | <name 1>, <name 2>, ... | — |
| Notes | <any rationale or caveats> | — |

## B) Audience

**Primary:** <Who is the main audience? Age skew, mindset, aspiration, relationship with the product category.>
**Secondary:** <Any secondary audience — e.g., gift buyers, carers, B2B buyers.>
**Device:** mobile-only | mobile-first | responsive | desktop-first
**Context:** <When and where do they encounter the brand? What is their mindset at that moment?>

## C) Personality

<!-- 3–5 adjective pairs. Format: "We are X, not Y." -->

- **<Adjective>**, not <opposite>
- **<Adjective>**, not <opposite>
- **<Adjective>**, not <opposite>

## D) Voice & Tone

### Writing Style

- **Formality:** casual | conversational | professional | formal
- **Sentence length:** short | medium | long
- **Humour:** none | light and dry | warm and playful | frequent
- **Technical level:** avoid jargon | some jargon OK | technical audience

### Key Phrases

<!-- Brand-specific language to use consistently. -->

- <phrase or term> — <why / what it signals>
- <phrase or term> — <why / what it signals>

### Words to Avoid

- <word or phrase> — <why>

## E) Positioning Constraints

<!-- Optional but recommended. Feeds ASSESSMENT-11 visual decisions. -->

**Imagery prominence:** high | medium | low
**Typical imagery character:** <e.g., "bright product colours on editorial backgrounds", "muted lifestyle photography">

**Origin claim:** Made in {country} | Designed in {country} | Handfinished in {country} | Curated in {country}
> Legal note: "Made in [country]" requires substantial manufacturing in that country (EU consumer law; Italian Law 166/2009 for Italian claims). If manufacturing occurs elsewhere, use Designed / Handfinished / Curated instead. Source manufacturing country from ASSESSMENT-08 Section B.

**Aesthetic constraints:**
- <e.g., "avoid tech-bro neon," "do not look clinical">

**Brand inspirations** ("like X but not Y"):
- <e.g., "like Aesop's clarity but not their price positioning">
```

---

## Quality Gate

Before saving, verify:

- [ ] All five sections A–E present (section heading must exist; E may be empty if operator declines)
- [ ] Section A: name is either confirmed or explicitly marked provisional — never left blank
- [ ] Section C: at least 3 adjective pairs with real content (not TBD placeholders)
- [ ] Section D: formality level set; at least 2 key phrases with real content; humour and technical level set
- [ ] Any TBD/unknown values are marked `provisional` — not counted toward minimum content requirements
- [ ] Frontmatter fields all present: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Owner
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Name section left blank (operator must confirm or mark provisional)
- Fewer than 3 adjective pairs in Section C
- Section D missing formality level
- Artifact not saved (output must be written to file, not only displayed in chat)
- Values set by agent without operator confirmation
