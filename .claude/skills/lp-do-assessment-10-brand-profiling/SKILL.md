---
name: lp-do-assessment-10-brand-profiling
description: Brand profiling for new startups (ASSESSMENT-10). Confirms business name, defines audience, personality, and voice & tone. Produces brand-strategy artifact ready for visual identity work. Upstream of lp-do-assessment-11-brand-identity.
---

# lp-do-assessment-10-brand-profiling — Brand Profiling (ASSESSMENT-10)

Elicits and records the foundational brand strategy for a new startup entering the ASSESSMENT stage. Confirms the business name from the naming shortlist, defines the target audience from a brand perspective, establishes personality adjective pairs, and captures voice & tone guidelines. All four sections must be present before the artifact is saved.

## Invocation

```
/lp-do-assessment-10-brand-profiling --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

WRITE-FIRST ELICIT

This skill uses a write-first pattern:
1. Read all available ASSESSMENT artifacts
2. Write the artifact immediately with everything that can be inferred or confirmed from existing docs — marking each field `confirmed`, `provisional`, or `missing`
3. Save the artifact to disk
4. Ask the operator **only** about genuine gaps (fields marked `missing` or `provisional` that block ASSESSMENT-11)

Do NOT present a full Q&A before writing. Do NOT ask the operator to confirm fields that are already well-evidenced. Write first, then surface only the real gaps.

Does NOT:
- Research external sources (that is ASSESSMENT-01–ASSESSMENT-08 territory)
- Make naming decisions for the operator without confirmation
- Ask questions that can be answered from existing docs

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| ASSESSMENT intake packet | `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` | Yes — primary source for name shortlist, ICP, and product context |
| Naming shortlist | `docs/business-os/strategy/<BIZ>/latest-naming-shortlist.user.md` | Yes if present — extract `recommended_business_name` and `shortlist` array from YAML front matter |
| Problem statement | `docs/business-os/strategy/<BIZ>/problem-statement.user.md` | No — read if present for ICP and pain-point context |
| Option selection | `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md` | No — read if present for product and positioning context |
| Operator evidence | `docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md` | No — read if present for any pre-confirmed brand notes |

If any upstream ASSESSMENT artifacts are absent, note the gap but proceed — ASSESSMENT-10 captures operator-confirmed brand decisions and does not depend on all research outputs being complete.

---

## Steps

### Step 1: Gather context from ASSESSMENT artifacts

Read the intake packet and any optional sources listed above. Extract:
- Candidate and recommended business names (from naming shortlist front matter)
- Ideal Customer Profile description (primary and secondary audience)
- Product category, value proposition, and differentiators
- Any audience, tone, or brand notes already documented in strategy docs

### Step 2: Pre-populate draft

Assemble a pre-populated draft from what was found. For each field, mark:
- `confirmed` — if already documented and explicitly operator-confirmed
- `provisional` — if inferred from research but not confirmed by operator
- `missing` — if no evidence found

### Step 3: Write and save artifact

Assemble all confirmed and provisional values into the output format. Save to the output path immediately — do not wait for operator input on fields that already have evidence.

### Step 4: Surface only genuine gaps

After saving, list only the fields that are `missing` or `provisional` and are required before ASSESSMENT-11 can run. Present these as targeted questions — not a full Q&A. Typical gaps:
- Key phrases (Section D) — rarely documented in upstream artifacts
- Aesthetic constraints / brand inspirations (Section E) — requires operator taste input
- Device posture (Section B) — if not inferable from channel choice
- **Imagery prominence (Section E)** — ask: "Will product photography dominate the site and marketing experience? If yes, what will images typically look like (e.g., bright product colours, editorial neutrals)?" This directly determines whether ASSESSMENT-11 should choose a recessive or expressive palette.
- **Origin claim (Section E)** — read manufacturing country from ASSESSMENT-08 Section B. If absent, ask: "Where are products manufactured, and what is your direct role in production? (design, finishing, curation)" Resolve to the defensible claim: Made in / Designed in / Handfinished in / Curated in. Never leave blank — an unresolved origin claim risks false advertising in brand copy.

Do NOT re-ask about fields already filled with confirmed or well-evidenced provisional content.

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`

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

## Completion Message

> "Brand strategy recorded: `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`. Name: <name> (<confirmed|provisional>). [N] personality pairs. Voice: <formality>."
>
> "Next step: run `/lp-do-assessment-11-brand-identity --business <BIZ>` to produce the visual brand identity and brand dossier."

---

## Integration

**Upstream (ASSESSMENT-08):** Runs after `/lp-do-assessment-08-current-situation` and the ASSESSMENT gate are complete.

**Downstream (ASSESSMENT-11):** `brand-strategy.user.md` is the primary required input for `/lp-do-assessment-11-brand-identity`. The Audience, Personality, and Voice & Tone sections are read directly into the brand dossier — they are not re-elicited at ASSESSMENT-11.

**No gate:** ASSESSMENT has no gate. After ASSESSMENT-11 completes, the operator proceeds directly to S1 (`/lp-readiness`).
