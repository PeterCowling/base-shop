---
name: lp-do-assessment-11-brand-identity
description: Visual brand identity for new startups (ASSESSMENT-11). Reads brand-strategy artifact and produces brand-dossier with colour palette, typography, imagery direction, and token overrides. Upstream of S1.
---

# lp-do-assessment-11-brand-identity — Brand Identity (ASSESSMENT-11)

Synthesizes brand strategy and product context into concrete visual identity decisions. Reads `brand-strategy.user.md` (ASSESSMENT-10 output) and the ASSESSMENT intake packet, then produces a `brand-dossier.user.md` with colour palette, typography, shape/elevation, imagery direction, and token overrides. Does not re-elicit audience or personality — these are carried forward from ASSESSMENT-10.

## Invocation

```
/lp-do-assessment-11-brand-identity --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

EXECUTE

This skill synthesizes inputs into design decisions rather than eliciting them field-by-field. The operator may not know specific hex codes or token names — this skill makes reasoned visual decisions grounded in the brand strategy and surfaces them for operator review.

Does NOT:
- Re-elicit audience, personality, or voice & tone (these come from ASSESSMENT-10)
- Require an existing app or theme package to proceed
- Skip sections — every template section must appear in the output (TBD is acceptable for Signature Patterns and App Coverage)

## Required Inputs (pre-flight)

| Source | Path | Required |
|--------|------|----------|
| Brand strategy | `docs/business-os/strategy/<BIZ>/brand-strategy.user.md` | Yes — primary input; blocks if absent |
| ASSESSMENT intake packet | `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` | Yes — provides product context, ICP, positioning |
| Brand language template | `.claude/skills/_shared/brand-language-template.md` | Yes — structural reference |
| Theme tokens | `packages/themes/<theme>/src/tokens.ts` | No — read if a theme package exists for this business |
| Existing app UI | `apps/<app>/src/app/layout.tsx`, key pages | No — read if an app already exists |
| BRIK brand dossier (reference) | `docs/business-os/strategy/BRIK/brand-dossier.user.md` | No — reference example of a complete dossier |

If `brand-strategy.user.md` is absent, halt and emit:
> "ASSESSMENT-10 artifact not found at `docs/business-os/strategy/<BIZ>/brand-strategy.user.md`. Run `/lp-do-assessment-10-brand-profiling --business <BIZ>` first."

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
- **Imagery prominence check (do this first):** Read `imagery_prominence` from Section E of `brand-strategy.user.md`.
  - `high` → Choose a **recessive palette** (muted pastels, low-saturation neutrals). Product images must do the visual work — a saturated or dark primary competes with bright photography and reduces conversion on image-heavy pages.
  - `medium` → Balanced palette acceptable; avoid saturated primaries that fight mid-range product photography.
  - `low` → Expressive palette permitted; brand colour can lead.
  - If `imagery_prominence` is not set in the strategy doc, treat as `medium` and note the gap.
- Select a Primary colour: the main brand colour appearing on CTAs, key UI elements, and brand marks. Derive from personality (e.g., bold/not timid → saturated; calm/not frantic → cooler hue) **modulated by the imagery prominence check above**.
- Select an Accent colour: a secondary colour for highlights, badges, or interactive states.
- Confirm Background colour: base or light override depending on mood.
- Express each as HSL values with token names matching the base theme schema.
- Write a one-sentence palette mood summary.

**Dark mode palette (required — not optional):**
Every brand dossier must include a full dark mode token set. Derive dark tokens from the light palette using this approach:
1. **Background**: Shift lightness to ~8–14%. Stay in the brand's hue family — don't switch to cold neutral grey. (e.g., if primary is warm pink 355°, dark bg should be 355° near-black, not 220° cool grey.)
2. **Surface**: Lift background 4–6% lightness for card faces (e.g., bg at L10 → surface at L16).
3. **Foreground (text)**: Near-white in the brand hue family (L88–94). Avoid pure cold white — keep the brand's warmth.
4. **Foreground muted**: Mid-tone in the same hue family (L50–60).
5. **Border**: Dark dividers — same hue, L18–26.
6. **Primary**: Usually unchanged — most brand colours read equally well on dark backgrounds. Adjust lightness only if primary is very dark (L<35) and would disappear on a dark background.
7. **Primary-fg**: Match to dark bg to ensure contrast on primary buttons.
8. **Primary-soft**: Darken the light tint — same hue, L18–26.
9. **Accent**: Slightly richer (reduce lightness by ~8–12%) for better visibility on dark.
10. **Accent-soft**: Dark tint — same accent hue, L14–22.

Write a one-sentence dark mode mood summary.

**Canonical colour token names** (use these exact keys — see `packages/themes/base/src/tokens.ts`):
- `--color-primary` (+ `-fg`, `-soft`, `-hover`, `-active`)
- `--color-accent` (+ `-fg`, `-soft`)
- `--color-bg`, `--color-fg`, `--color-fg-muted`
- `--color-border`, `--color-border-strong`, `--color-border-muted`
- `--color-danger`, `--color-success`, `--color-warning`, `--color-info`

If your chosen palette requires a token not in this list, note it as a "New token required" in the Token Overrides section.

**Typography:**
- Select body font family from **Google Fonts or system stacks only** (no paid/licensed fonts).
  Choose from well-known Google Fonts families (e.g., Inter, DM Sans, Plus Jakarta Sans, Nunito, Lato, Raleway, Work Sans, Source Sans 3, Outfit, Manrope). If selecting a less common family, note `font-availability: unverified` in the dossier for manual confirmation.
  Reason from formality and audience (e.g., humanist sans for approachable brands; geometric for precision).
- Determine heading treatment (same family or distinct). If a distinct heading font, it must also be free (Google Fonts or system).
- Write a one-sentence type personality summary.
- Include the Google Fonts URL for loading (weights needed for body + headings).

**Shape and elevation:**
- Select a corner radius token value. Reason from personality (sharper = more corporate; softer = more friendly).
- Note default shadow usage intent.

**Imagery direction:**
- Write 2–4 "Do" directives for photography and illustration style.
- Write 2–4 "Don't" directives.

### Step 3: Produce token overrides table

Compare chosen palette and typography against base theme token values. For each token that differs from base, record: token name, base value, override value, reason.

If no theme package exists yet:
1. Leave the overrides table with column headers only.
2. Add a "Theme Prerequisites" subsection listing: create theme package at `packages/themes/<theme>/src/tokens.ts`, apply the Visual Identity overrides from this dossier, and run `pnpm build:tokens`.

### Step 4: Fill and save brand dossier

Using the template at `.claude/skills/_shared/brand-language-template.md` as the structural reference:

1. Copy the template structure.
2. Carry Audience, Personality, and Voice & Tone directly from `brand-strategy.user.md` — do not re-derive.
3. Fill Visual Identity and Token Overrides from Steps 2–3.
4. Set Signature Patterns to `TBD — patterns emerge through lp-design-spec work`.
5. Fill App Coverage if an app exists; otherwise set to `TBD — app not yet built`.
6. Set `Status: Draft`.
7. Save to the output path.

### Step 5: Generate HTML brand discovery document

After saving the `.md` dossier, produce a second output: a self-contained HTML brand discovery document at `docs/business-os/strategy/<BIZ>/brand-discovery-document.user.html`.

**Approach:** Use `docs/business-os/strategy/HBAG/brand-discovery-document.user.html` as the rendering template — copy the JS rendering engine verbatim. Only populate the `CONFIG` object at the top with this business's data. Do not modify the rendering functions.

**CONFIG field mapping** (derive each from the artifacts you have already read):

```
CONFIG.meta
  businessCode    ← <BIZ> code
  businessName    ← confirmed operating name from brand-strategy.user.md
  tagline         ← first key phrase from Voice & Tone, or "TBD"
  coreClaim       ← top 3 key phrases joined with ". " or "TBD"
  date            ← current month + year
  stage           ← "ASSESSMENT-11 Complete"
  market          ← primary channel + geography from intake packet or distribution-plan.user.md; "TBD" if not available
  tamNote         ← market size note from intake packet or "TBD"
  priceRange      ← price range from intake packet or offer

CONFIG.colours     ← map all light-mode tokens from brand dossier Colour Palette section
  primary, primaryFg, primarySoft, primaryHover, accent, accentSoft,
  background, text (= --color-fg), textMuted, border, surface

CONFIG.paletteDisplay  ← ["primary", "accent", "background", "primarySoft", "accentSoft"]

CONFIG.darkColours ← map all dark-mode tokens from brand dossier Dark Mode section
  background, surface, text, textMuted, border,
  primary, primaryFg, primarySoft, primaryHover, accent, accentSoft

CONFIG.fonts
  heading         ← heading font from Typography section (family, weights, sample sentences from key phrases)
  body            ← body font from Typography section (family, weights)

CONFIG.radius     ← { md: <--radius-md value>, lg: <--radius-lg value or "8px"> }

CONFIG.problem    ← problem statement from intake packet or problem-statement.user.md; "TBD" if not available

CONFIG.solution   ← solution description from intake packet or s0c-option-select.user.md; "TBD" if not available

CONFIG.icps       ← ICP array from intake packet; empty array [] if not available

CONFIG.forecast   ← forecast numbers from S3 artifact if available; empty array [] if not yet run

CONFIG.personality ← map personality adjective pairs from brand dossier (positive/negative format)

CONFIG.keyPhrases  ← key phrases from Voice & Tone section (phrase + note)

CONFIG.wordsToAvoid ← words to avoid from Voice & Tone section (term + reason)

CONFIG.products    ← product list from intake packet or PRODUCT-01 artifact if available; empty array [] if not yet available

CONFIG.namingJourney ← naming history from naming shortlist artifacts if available; omit field (set to null) if not available
```

**Font loading:** Update the `<link>` tag in `<head>` to load the correct Google Fonts for this business (from the Typography section of the dossier).

**Title tag:** Update to `Brand Discovery Document — <Business Name>`.

**If CONFIG fields are unavailable:** Use `"TBD"` for string fields and `[]` for array fields. Never invent data.

### Step 6: Report

Report:
- Sections complete vs TBD in the `.md` dossier
- Which CONFIG fields were populated vs TBD in the HTML
- Any design decisions the operator may want to review or override
- Whether the dossier is sufficient for `/lp-design-spec` to proceed at DO

---

## Output Contract

**Primary path:** `docs/business-os/strategy/<BIZ>/brand-dossier.user.md`

**Secondary path (auto-produced):** `docs/business-os/strategy/<BIZ>/brand-discovery-document.user.html`

**Frontmatter:**

```yaml
---
Type: Brand-Language
Stage: ASSESSMENT-11
Business-Unit: <BIZ>
Business-Name: <confirmed operating name>
Status: Draft
Created: <date>
Updated: <date>
Last-reviewed: <date>
Owner: <operator>
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
- [ ] Visual Identity section is complete: Colour Palette has ≥2 rows (light), Typography has ≥1 row
- [ ] Dark mode palette table is present with ≥6 token rows (bg, fg, fg-muted, border, primary, accent minimum)
- [ ] Dark mode mood summary present (1 sentence)
- [ ] Token Overrides section present (may be empty table if no theme overrides needed)
- [ ] Imagery Direction has ≥2 Do items and ≥2 Don't items
- [ ] Signature Patterns and App Coverage may be TBD — both sections must still be present
- [ ] Frontmatter fields all present: Type, Stage, Business-Unit, Business-Name, Status, Created, Updated, Last-reviewed, Owner
- [ ] Status is `Draft` (not Active — operator review required before promoting)
- [ ] `.md` dossier saved to correct path before completion message
- [ ] HTML brand discovery document saved to `docs/business-os/strategy/<BIZ>/brand-discovery-document.user.html`
- [ ] HTML CONFIG populated from dossier + intake packet (TBD for unavailable fields — no invented data)
- [ ] Colour palette: primary+primary-fg pairing documented (foreground on primary surface must meet WCAG AA)
- [ ] Dark mode hue family stays consistent with light palette (no switching to unrelated hue)

## Red Flags

Invalid outputs — do not emit:

- Audience or Personality sections derived differently from what is in `brand-strategy.user.md` (ASSESSMENT-10 output)
- Visual Identity section missing Colour Palette or Typography
- Dark mode palette table missing or has fewer than 6 token rows
- Dark mode palette uses a different hue family from the light palette (e.g., switching to cool grey for a warm-toned brand)
- Token Overrides section omitted entirely
- Status set to Active without operator confirmation
- `.md` dossier not saved (output must be written to file, not only displayed in chat)
- HTML brand discovery document not saved alongside the `.md`
- HTML CONFIG fields invented rather than taken from source artifacts (use TBD for unknowns)

## Completion Message

> "Brand identity recorded: `docs/business-os/strategy/<BIZ>/brand-dossier.user.md`. Colour palette: <N> tokens. Typography: <font family>. Token overrides: <N rows>."
>
> "Brand discovery document produced: `docs/business-os/strategy/<BIZ>/brand-discovery-document.user.html`. Open in a browser to review the visual identity."
>
> "ASSESSMENT stage complete. Next step: run `/lp-readiness --business <BIZ>` to enter S1."

---

## Integration

**Upstream (ASSESSMENT-10):** Reads `brand-strategy.user.md` as required input. Audience, Personality, and Voice & Tone sections are carried forward directly.

**Downstream (S1):** After ASSESSMENT-11 saves the brand dossier, the operator proceeds to S1 (`/lp-readiness`). There is no ASSESSMENT gate.

**Later consumption:** `/lp-design-spec` reads `brand-dossier.user.md` at DO+ and writes back stable new patterns to the Signature Patterns section. `/lp-do-build` references it for UI implementation guidance.

**Replaces:** This skill supersedes `/lp-assessment-bootstrap` as the canonical brand identity skill within the startup loop ASSESSMENT stage. `lp-assessment-bootstrap` remains available for standalone use outside the loop.
