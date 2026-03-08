# Steps 1–3 — Read Context, Derive Visual Identity, Produce Token Overrides

### Step 1: Read brand strategy and intake context

1. Read `<YYYY-MM-DD>-brand-profile.user.md`. Extract:
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
- **Imagery prominence check (do this first):** Read `imagery_prominence` from Section E of `<YYYY-MM-DD>-brand-profile.user.md`.
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
