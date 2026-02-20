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
- `pending` — if inferred from research but not confirmed by operator
- blank — if no evidence found

### Step 3: Elicit missing or unconfirmed fields

Present the pre-populated draft and ask the operator to confirm or complete each section. The operator may provide a value, `TBD`, or `unknown` — all are valid initial responses.

**Elicitation questions:**

*A) Name Confirmation:*
1. The naming shortlist recommends `<recommended_business_name>`. Do you confirm this as the operating name, or do you prefer another name from the shortlist: `<list>`? (Or provide a new name if you have changed direction.)
2. Should the name be treated as confirmed/final, or provisional (may still change before launch)?

*B) Audience — brand perspective:*
3. Describe the primary audience in brand terms: who are they beyond demographics? (e.g., mindset, aspiration, relationship with the product category)
4. Is there a secondary audience that buys for or gifts to the primary audience?
5. What device and context do they typically use when discovering this brand? (e.g., mobile while commuting, desktop during research)

*C) Personality — adjective pairs:*
6. Provide 3–5 adjective pairs that define the brand personality in the format "We are X, not Y." (e.g., "We are precise, not pedantic.") — If the operator struggles, offer 3 example pairs based on the product context and ask them to adjust.

*D) Voice & Tone:*
7. What is the overall formality level? (casual / conversational / professional / formal)
8. Should sentences be short and punchy, medium length, or longer and explanatory?
9. How much humour, if any? (none / light and dry / warm and playful / frequent)
10. Name 2–5 key phrases or vocabulary choices this brand would consistently use (e.g., "your hearing" not "your ears", "find your fit" not "buy now").
11. Name any words or phrases to avoid and why (e.g., avoid "cheap" — sounds low quality).

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
Business: <BIZ>
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
- **Humour:** none | light | frequent
- **Technical level:** avoid jargon | some jargon OK | technical audience

### Key Phrases

<!-- Brand-specific language to use consistently. -->

- <phrase or term> — <why / what it signals>
- <phrase or term> — <why / what it signals>

### Words to Avoid

- <word or phrase> — <why>
```

---

## Quality Gate

Before saving, verify:

- [ ] All four sections A–D present (empty values are acceptable if genuinely no data, but section heading must exist)
- [ ] Section A: name is either confirmed or explicitly marked provisional — never left blank
- [ ] Section C: at least 3 adjective pairs present
- [ ] Section D: formality level set; at least 2 key phrases present
- [ ] Frontmatter fields all present: Type, Stage, Business, Status, Created, Updated, Owner
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
