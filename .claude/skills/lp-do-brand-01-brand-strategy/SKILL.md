---
name: lp-do-brand-01-brand-strategy
description: Brand strategy elicitation for new startups (BRAND-01). Confirms business name, defines audience, personality, and voice & tone. Produces brand-strategy artifact ready for visual identity work. Upstream of lp-do-brand-02-brand-identity.
---

# lp-do-brand-01-brand-strategy — Brand Strategy (BRAND-01)

Elicits and records the foundational brand strategy for a new startup entering the BRAND stage. Confirms the business name from the naming shortlist, defines the target audience from a brand perspective, establishes personality adjective pairs, and captures voice & tone guidelines. All four sections must be present before the artifact is saved.

## Invocation

```
/lp-do-brand-01-brand-strategy --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

ELICIT + WRITE

This skill:
- Reads existing DISCOVERY artifacts to extract already-documented context
- Pre-populates a draft artifact from whatever is already on record
- Surfaces gaps and asks the operator to confirm or fill each section
- Writes the final BRAND-01 artifact once all required sections are complete

Does NOT:
- Research external sources (that is DISCOVERY-01–DISCOVERY-07 territory)
- Make naming decisions for the operator without confirmation
- Set field values the operator has not confirmed

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| DISCOVERY intake packet | `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` | Yes — primary source for name shortlist, ICP, and product context |
| Naming shortlist | `docs/business-os/strategy/<BIZ>/latest-naming-shortlist.user.md` | Yes if present — extract `recommended_business_name` and `shortlist` array from YAML front matter |
| Problem statement | `docs/business-os/strategy/<BIZ>/problem-statement.user.md` | No — read if present for ICP and pain-point context |
| Option selection | `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md` | No — read if present for product and positioning context |
| Operator evidence | `docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md` | No — read if present for any pre-confirmed brand notes |

If any upstream DISCOVERY artifacts are absent, note the gap but proceed — BRAND-01 captures operator-confirmed brand decisions and does not depend on all research outputs being complete.

---

## Steps

### Step 1: Gather context from DISCOVERY artifacts

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

### Step 3: Elicit missing or unconfirmed fields

Present the pre-populated draft and ask the operator to confirm or complete each section. The operator may respond `TBD` or `unknown` — these are tagged `provisional` in the artifact and must be resolved before BRAND-02. Fields with real content must have ≥ the minimum counts listed in the quality gate.

**Elicitation questions:**

*A) Name Confirmation:*
1. The naming shortlist recommends `<recommended_business_name>`. Do you confirm this as the operating name, or do you prefer another name from the shortlist: `<list>`? (Or provide a new name if you have changed direction.)
2. Should the name be treated as confirmed/final, or provisional (may still change before launch)?

*B) Audience — brand perspective:*
3. Describe the primary audience in brand terms: who are they beyond demographics? (e.g., mindset, aspiration, relationship with the product category)
4. Is there a secondary audience that buys for or gifts to the primary audience?
5. What is their primary device posture? (mobile-only / mobile-first / responsive / desktop-first)
6. What is the discovery context? (When and where do they encounter the brand, and what is their mindset?)

*C) Personality — adjective pairs:*
7. Provide 3–5 adjective pairs that define the brand personality in the format "We are X, not Y." (e.g., "We are precise, not pedantic.") — If the operator struggles, offer 3 example pairs based on the product context and ask them to adjust.

*D) Voice & Tone:*
8. What is the overall formality level? (casual / conversational / professional / formal)
9. Should sentences be short and punchy, medium length, or longer and explanatory?
10. How much humour, if any? (none / light and dry / warm and playful / frequent)
11. What is the expected technical level? (avoid jargon / some jargon OK / technical audience)
12. Name 2–5 key phrases or vocabulary choices this brand would consistently use (e.g., "your hearing" not "your ears", "find your fit" not "buy now").
13. Name any words or phrases to avoid and why (e.g., avoid "cheap" — sounds low quality).

*E) Positioning Constraints (optional but recommended):*
14. Are there any aesthetic or competitive constraints to note? (e.g., "avoid tech-bro neon," "do not look clinical/hospital-like")
15. Name 2–3 cultural or brand inspirations in the format "like X but not Y." (e.g., "like Aesop's clarity but not their price positioning")

### Step 4: Resolve open gaps

For each field where the operator responds `TBD` or `unknown`, mark it as provisional in the artifact and add a brief note on what is needed to resolve it before BRAND-02.

### Step 5: Write and save artifact

Assemble confirmed values into the output format below. Save to the output path.

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`

**Format:**

```markdown
---
Type: Brand-Strategy
Stage: BRAND-01
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft | Active
Created: <date>
Updated: <date>
Owner: <operator>
---

# Brand Strategy — <BIZ> (BRAND-01)

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

<!-- Optional but recommended. Feeds BRAND-02 visual decisions. -->

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
> "Next step: run `/lp-do-brand-02-brand-identity --business <BIZ>` to produce the visual brand identity and brand dossier."

---

## Integration

**Upstream (DISCOVERY-07):** Runs after `/lp-do-discovery-07-our-stance` and the DISCOVERY GATE are complete.

**Downstream (BRAND-02):** `brand-strategy.user.md` is the primary required input for `/lp-do-brand-02-brand-identity`. The Audience, Personality, and Voice & Tone sections are read directly into the brand dossier — they are not re-elicited at BRAND-02.

**No gate:** BRAND has no gate. After BRAND-02 completes, the operator proceeds directly to S1 (`/lp-readiness`).
