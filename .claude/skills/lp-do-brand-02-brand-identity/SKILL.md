---
name: lp-do-brand-02-brand-identity
description: Visual brand identity for new startups (BRAND-02). Reads brand-strategy artifact and produces brand-dossier with colour palette, typography, imagery direction, and token overrides. Upstream of S1.
---

# lp-do-brand-02-brand-identity — Brand Identity (BRAND-02)

Synthesizes brand strategy and product context into concrete visual identity decisions. Reads `brand-strategy.user.md` (BRAND-01 output) and the DISCOVERY intake packet, then produces a `brand-dossier.user.md` with colour palette, typography, shape/elevation, imagery direction, and token overrides. Does not re-elicit audience or personality — these are carried forward from BRAND-01.

## Invocation

```
/lp-do-brand-02-brand-identity --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

EXECUTE

This skill synthesizes inputs into design decisions rather than eliciting them field-by-field. The operator may not know specific hex codes or token names — this skill makes reasoned visual decisions grounded in the brand strategy and surfaces them for operator review.

Does NOT:
- Re-elicit audience, personality, or voice & tone (these come from BRAND-01)
- Require an existing app or theme package to proceed
- Skip sections — every template section must appear in the output (TBD is acceptable for Signature Patterns and App Coverage)

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| Brand strategy | `docs/business-os/strategy/<BIZ>/brand-strategy.user.md` | Yes — primary input; blocks if absent |
| DISCOVERY intake packet | `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` | Yes — provides product context, ICP, positioning |
| Brand language template | `.claude/skills/_shared/brand-language-template.md` | Yes — structural reference |
| Theme tokens | `packages/themes/<theme>/src/tokens.ts` | No — read if a theme package exists for this business |
| Existing app UI | `apps/<app>/src/app/layout.tsx`, key pages | No — read if an app already exists |
| BRIK brand dossier (reference) | `docs/business-os/strategy/BRIK/brand-dossier.user.md` | No — reference example of a complete dossier |

If `brand-strategy.user.md` is absent, halt and emit:
> "BRAND-01 artifact not found at `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`. Run `/lp-do-brand-01-brand-strategy --business <BIZ>` first."

---

## Steps

### Step 1: Read brand strategy and intake context

1. Read `brand-strategy.user.md`. Extract:
   - Confirmed operating name
   - Audience (primary, secondary, device, context)
   - Personality adjective pairs
   - Voice & tone (formality, sentence length, humour, key phrases, words to avoid)

2. Read intake packet. Extract:
   - Product category and value proposition
   - ICP demographic and psychographic profile
   - Market context (price tier, competitor aesthetic landscape if documented)

3. Read theme tokens if a theme package exists. Note base token values for any token you intend to override.

4. Read existing app UI if present. Note any current design patterns or hardcoded values.

### Step 2: Derive visual identity decisions

For each visual identity dimension below, reason from the brand strategy inputs and product context to a concrete design decision. Document the rationale briefly.

**Colour palette:**
- Select a Primary colour: the main brand colour appearing on CTAs, key UI elements, and brand marks. Derive from personality (e.g., bold/not timid → saturated; calm/not frantic → cooler hue).
- Select an Accent colour: a secondary colour for highlights, badges, or interactive states.
- Confirm Background colour: base or light override depending on mood.
- Express each as HSL values with token names matching the base theme schema.
- Write a one-sentence palette mood summary.

**Typography:**
- Select body font family (system stack, Google Font, or self-hosted). Reason from formality and audience (e.g., humanist sans for approachable brands; geometric for precision).
- Determine heading treatment (same family or distinct).
- Write a one-sentence type personality summary.

**Shape and elevation:**
- Select a corner radius token value. Reason from personality (sharper = more corporate; softer = more friendly).
- Note default shadow usage intent.

**Imagery direction:**
- Write 2–4 "Do" directives for photography and illustration style.
- Write 2–4 "Don't" directives.

### Step 3: Produce token overrides table

Compare chosen palette and typography against base theme token values. For each token that differs from base, record: token name, base value, override value, reason.

If no theme package exists yet, note `TBD — theme package not yet created` and leave the table with column headers only.

### Step 4: Fill and save brand dossier

Using the template at `.claude/skills/_shared/brand-language-template.md` as the structural reference:

1. Copy the template structure.
2. Carry Audience, Personality, and Voice & Tone directly from `brand-strategy.user.md` — do not re-derive.
3. Fill Visual Identity and Token Overrides from Steps 2–3.
4. Set Signature Patterns to `TBD — patterns emerge through lp-design-spec work`.
5. Fill App Coverage if an app exists; otherwise set to `TBD — app not yet built`.
6. Set `Status: Draft`.
7. Save to the output path.

### Step 5: Report

Report:
- Sections complete vs TBD
- Any design decisions the operator may want to review or override
- Whether the dossier is sufficient for `/lp-design-spec` to proceed at S7

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/brand-dossier.user.md`

**Frontmatter:**

```yaml
---
Type: Brand-Language
Stage: BRAND-02
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft
Created: <date>
Updated: <date>
Last-reviewed: <date>
---
```

**Sections (all must be present — TBD is acceptable for Signature Patterns and App Coverage):**
- Audience
- Personality
- Visual Identity (Colour Palette, Typography, Shape & Elevation, Imagery Direction)
- Voice & Tone
- Token Overrides
- Signature Patterns
- App Coverage
- References

---

## Quality Gate

Before saving, verify:

- [ ] `brand-strategy.user.md` was read and Audience + Personality sections are populated directly from it (no re-elicitation)
- [ ] Visual Identity section is complete: Colour Palette has ≥2 rows, Typography has ≥1 row
- [ ] Token Overrides section present (may be empty table if no overrides or no theme yet)
- [ ] Imagery Direction has ≥2 Do items and ≥2 Don't items
- [ ] Signature Patterns and App Coverage may be TBD — both sections must still be present
- [ ] Frontmatter fields all present: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Last-reviewed
- [ ] Status is `Draft` (not Active — operator review required before promoting)
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Audience or Personality sections derived differently from what is in `brand-strategy.user.md`
- Visual Identity section missing Colour Palette or Typography
- Token Overrides section omitted entirely
- Status set to Active without operator confirmation
- Artifact not saved (output must be written to file, not only displayed in chat)

## Completion Message

> "Brand identity recorded: `docs/business-os/strategy/<BIZ>/brand-dossier.user.md`. Colour palette: <N> tokens. Typography: <font family>. Token overrides: <N rows>."
>
> "BRAND stage complete. Next step: run `/lp-readiness --business <BIZ>` to enter S1."

---

## Integration

**Upstream (BRAND-01):** Reads `brand-strategy.user.md` as required input. Audience, Personality, and Voice & Tone sections are carried forward directly.

**Downstream (S1):** After BRAND-02 saves the brand dossier, the operator proceeds to S1 (`/lp-readiness`). There is no BRAND gate.

**Later consumption:** `/lp-design-spec` reads `brand-dossier.user.md` at S7+ and writes back stable new patterns to the Signature Patterns section. `/lp-do-build` references it for UI implementation guidance.

**Replaces:** This skill supersedes `/lp-brand-bootstrap` as the canonical brand identity skill within the startup loop BRAND stage. `lp-brand-bootstrap` remains available for standalone use outside the loop.
