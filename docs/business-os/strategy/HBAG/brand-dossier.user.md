---
Type: Brand-Language
Stage: ASSESSMENT-11
Business-Unit: HBAG
Business-Name: Caryina
Status: Active
Created: 2026-02-21
Updated: 2026-02-23
Last-reviewed: 2026-02-23
Owner: Pete
Token-Source: packages/themes/caryina/src/tokens.ts
Review-trigger: After each completed build cycle touching this document.
---

# Caryina — Brand Language

> **Active.** ASSESSMENT-12 promotion completed 2026-02-23 after dossier completeness validation.

## Audience

**Primary:** Women ~27–42, fashion-aware, who own one or more bags at LV/Gucci entry tier (€600–€1,500+). They want personal expression through bag accessories — something that reads as genuinely crafted, not mass-produced. Quality that "reads real" in hand and in photos. They deliberate 3–7 days before purchasing at €80–€150; this is a considered purchase, not an impulse buy.

**Secondary:** Gift buyers purchasing for women who fit the primary profile — birthdays, Christmas, milestone self-treats. Packaging and brand story do significant work in this use case.

**Device:** Mobile-first — social discovery via TikTok/Instagram is the primary inbound path.

**Context:** TikTok/Instagram scroll → trend exposure → Etsy search or direct website visit. Mindset at discovery: actively looking for something distinctive for their bag; aesthetic + craft quality are the purchase triggers. At €80–€150, the buyer wants to feel the price is justified by visible craft — not just brand name.

## Personality

- **Sophisticated**, not showy
- **Curated**, not cluttered
- **Feminine**, not generic
- **Confident**, not apologetic — own the quality story; don't over-justify the price
- **Tasteful**, not trend-chasing — the bag charm trend is an entry point, not the identity

## Visual Identity

### Imagery Strategy

| Field | Value |
|-------|-------|
| Imagery prominence | `high` |
| Typical imagery character | Bright, colourful bag accessories (charms, holders) against editorial neutral backgrounds. Product colour range is wide and varied across the range. |
| Palette implication | `recessive` — site chrome must not compete with product images |

### Colour Palette

| Role | Token | HSL | Rationale |
|------|-------|-----|-----------|
| Primary | `--color-primary` | `355 55% 75%` | Strawberry milk — warm soft pink; feminine and present without competing; light enough to stay pastel, saturated enough to have character |
| Primary fg | `--color-primary-fg` | `355 12% 20%` | Warm near-black with pink undertone — WCAG AA compliant on strawberry milk; softer than stark black |
| Primary soft | `--color-primary-soft` | `355 40% 96%` | Barely-there strawberry tint for hover states and secondary surfaces |
| Primary hover | `--color-primary-hover` | `355 55% 68%` | Deeper strawberry milk for interactive hover |
| Primary active | `--color-primary-active` | `355 55% 61%` | Pressed strawberry state |
| Accent | `--color-accent` | `130 18% 72%` | Light warm sage — pastel sage; lighter than a classic sage at 72% lightness; clearly green, warm enough to harmonise with strawberry milk; recessive behind product imagery |
| Accent fg | `--color-accent-fg` | `130 20% 18%` | Dark on warm sage — legible; warm earthy undertone |
| Accent soft | `--color-accent-soft` | `130 15% 95%` | Barely-there warm sage tint for tags, chips, and focus rings |
| Background | `--color-bg` | `38 18% 98%` | Warm near-white — same 38° hue as accent; consistent warm ivory family |
| Foreground | `--color-fg` | `355 12% 20%` | Warm near-black with pink undertone — consistent with primary-fg; unified warm family |
| Foreground muted | `--color-fg-muted` | `355 8% 52%` | Warm blush grey for secondary text, labels, captions |
| Border | `--color-border` | `355 12% 90%` | Soft blush border with pink undertone — warm, not clinical |
| Border muted | `--color-border-muted` | `355 8% 95%` | Near-invisible warm blush divider |
| Border strong | `--color-border-strong` | `355 15% 78%` | Emphasis borders and focus rings — warm blush |

**Palette mood:** Strawberry milk and light warm sage — both sit at pastel lightness (75% and 72%); the pink-green pairing is feminine and Mediterranean; warm enough to feel cohesive, distinct enough to give the brand a clear two-colour identity that recedes behind product imagery.

**Dark mode:** Rose-espresso family — warm near-black with pink undertone throughout. Strawberry Milk (primary) is unchanged; it stands equally well on dark backgrounds.

### Dark Mode Token Overrides

| Token | Light Value | Dark Value | Dark Rationale |
|-------|-------------|------------|----------------|
| `--color-bg` | `38 18% 98%` | `355 14% 10%` | Rose Espresso — warm near-black with rose undertone; editorial dark register |
| `--color-fg` | `355 12% 20%` | `355 8% 92%` | Warm Near-White — very light with slight pink warmth; avoids clinical cold-white |
| `--color-fg-muted` | `355 8% 52%` | `355 6% 55%` | Mid Rose-Grey — mid-tone in the rose-grey family |
| `--color-border` | `355 12% 90%` | `355 10% 22%` | Dark Rose Border — subtle, warm-toned dividers |
| `--color-border-muted` | `355 8% 95%` | `355 8% 18%` | Near-invisible warm border on dark |
| `--color-border-strong` | `355 15% 78%` | `355 12% 32%` | Emphasis borders on dark |
| `--color-primary` | `355 55% 75%` | `355 55% 75%` | Unchanged — Strawberry Milk stands equally well on dark |
| `--color-primary-fg` | `355 12% 20%` | `355 14% 10%` | Matches dark bg — Rose Espresso as foreground on Strawberry Milk |
| `--color-primary-soft` | `355 40% 96%` | `355 30% 22%` | Dark Strawberry Tint — chips, badges, table headers on dark |
| `--color-primary-hover` | `355 55% 68%` | `355 55% 82%` | Slightly lighter strawberry on hover in dark mode |
| `--color-primary-active` | `355 55% 61%` | `355 55% 85%` | Pressed state on dark |
| `--color-accent` | `130 18% 72%` | `130 18% 62%` | Sage — slightly richer on dark; still recessive behind product imagery |
| `--color-accent-fg` | `130 20% 18%` | `130 15% 88%` | Light sage text for legibility on dark sage backgrounds |
| `--color-accent-soft` | `130 15% 95%` | `130 14% 18%` | Dark Sage Tint — tags and focus rings in dark mode |

> **Surface token (not in base):** `--color-surface` light = `0 0% 100%` / dark = `355 12% 16%` (Warm Dark Surface — card faces lifted slightly from bg).

### Typography

> All fonts are freely available via Google Fonts.

| Role | Token | Font Family | Source | Rationale |
|------|-------|-------------|--------|-----------|
| Headings | `--font-heading` | Cormorant Garamond | [Google Fonts](https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap) | Elegant editorial serif; used across premium fashion and jewellery brands; the slight fragility of the letterform matches the "tasteful, not showy" personality; excellent at large display sizes on mobile |
| Body | `--font-sans` | DM Sans | [Google Fonts](https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300;1,9..40,400&display=swap) | Clean humanist sans; highly legible at small sizes on mobile; optical-size axis available; pairs naturally with Cormorant without competing |

**Combined Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300;1,9..40,400&display=swap
```

**Type personality:** Editorial serif headings paired with a humanist sans body — confident and refined at large sizes, clear and functional in product detail copy.

### Shape & Elevation

| Property | Token | Value | Notes |
|----------|-------|-------|-------|
| Card radius | `--radius-md` | `4px` | Restrained — slightly soft; not sharp-corporate, not bubbly-friendly; aligns with "curated, not cluttered" |
| Small radius | `--radius-sm` | `2px` | For chips, badges, inline elements |
| Large radius | `--radius-lg` | `8px` | For modal sheets and bottom drawers on mobile only |
| Default shadow | `shadow-sm` | base value | Elevation used sparingly — border-based separation preferred; shadows only for floating elements (modals, dropdowns) |

### Imagery Direction

Carried forward from ASSESSMENT-10 aesthetic constraints — confirmed by Pete 2026-02-21.

**Do:**
- Soft directional daylight lighting; editorial feel without studio harshness
- Backgrounds: stone, matte plaster, dark wood, neutral textiles
- Include one clean scale reference per listing (hand, bag strap, AirPods) — editorial framing, not measurement photo
- One macro shot per listing showing stitching, edge finishing, or hardware detail
- Hands: manicured, neutral nails, minimal jewellery — taste, not haul

**Don't:**
- High-saturation craft-fair lighting or harsh flash
- Patterned backdrops, glitter vinyl, flat-lay chaos
- Workbench-mess "authenticity theatre"
- Generic product-on-white-background as hero image
- Influencer-haul hand styling

## Voice & Tone

### Writing Style

- **Formality:** Conversational — not corporate, not overly casual
- **Sentence length:** Short to medium — punchy product copy; slightly longer for craft/story context
- **Humour:** None to light and dry — premium positioning; warmth over wit
- **Technical level:** Some detail expected — dimensions, material composition, and compatibility matter to this buyer; state them clearly without making copy feel like a spec sheet

### Header Tagline

**Un solo dettaglio. Quello carino.** *(One detail. The cute one.)*

Appears beneath the animated wordmark after the Caryina → Carina logo transformation. Decided 2026-02-23. Full rationale: `docs/business-os/strategy/HBAG/tagline-options.user.md`.

The tagline completes the logo reveal: the animation shows the brand name contains "carina" (cute in Italian); the tagline turns that into a product promise — one considered accessory, and it's the cute one. Directly encodes the single-piece positioning ("un solo") and echoes "Considered detail" from the core phrases below.

### Key Phrases

Three core lines. Use one per asset; use all three for hero layouts.

| Line | Use when | What it signals |
|------|----------|-----------------|
| **Made to be shown.** | Visibility, display — accessory belongs on the bag | Quality that reads at distance; designed to be seen, not hidden |
| **Considered detail.** | Positioning against charm pile-on | Curated restraint; the single-piece purchase is right |
| **Use every day.** | Daily use, versatility, value | Not a trend buy; justifies €80–€150 as a keeper piece |

**Approved variants — Made to be shown:**
- "Made to be noticed — quietly."
- "A visible detail, finished to be kept."
- "Made to be seen, finished to last."
- Pairing line: "Cut clean. Finished by hand."

**Approved variants — One considered detail:**
- "One piece, chosen well."
- "Edited, not overdone."
- "One clean finishing touch."
- Pairing line: "Styled once. Worn often."

**Approved variants — Use every day:**
- "Finished to last."
- "Works across your classics."
- Pairing line: "Easy on. Stays put."

### Words to Avoid

- "Luxury" / "premium" / "exclusive" — empty fashion filler without substantiation; show craft instead
- "Fits all handbags" — unverified compatibility claim; be specific about attachment hardware
- "Birkin" — IP/trade dress risk; do not use in any public-facing copy (2025 Paris Judicial Court ruling)
- "Statement piece" / "must-have" / "turn heads" — hype language incompatible with curated restraint positioning
- "Made in Italy" — manufacturing is China-based; this claim would be false advertising under Italian Law 166/2009

### Brand Claims

| Claim | Value | Notes |
|-------|-------|-------|
| Origin claim | `Designed in Italy` | Pete designs and curates from Positano, Italy. Manufacturing: China. "Made in Italy" cannot be claimed. |
| Manufacturing country | China | China-based supplier confirmed 2026-02-20 |
| Operator's role | Designer / Curator | Brand designed and curated by Pete from Positano |

## Token Overrides

Theme package: `packages/themes/caryina/src/tokens.ts`

**Tokens that differ from base (light mode):**

| Token | Base Value | Override Value | Reason |
|-------|-----------|----------------|--------|
| `--color-primary` | `220 90% 56%` (blue) | `355 55% 75%` | Strawberry milk — warm soft pink; pastel-light but present; feminine and confident |
| `--color-primary-fg` | `0 0% 100%` | `355 12% 20%` | Warm near-black with pink undertone; WCAG AA on strawberry milk |
| `--color-primary-soft` | `220 90% 96%` | `355 40% 96%` | Barely-there strawberry tint |
| `--color-primary-hover` | `220 90% 50%` | `355 55% 68%` | Deeper strawberry milk on hover |
| `--color-primary-active` | `220 90% 45%` | `355 55% 61%` | Pressed strawberry state |
| `--color-accent` | `260 83% 70%` | `130 18% 72%` | Light warm sage — pastel sage; clearly green; warm hue (130°) harmonises with strawberry milk; recessive at 72% lightness |
| `--color-accent-fg` | `0 0% 10%` | `130 20% 18%` | Dark on warm sage for legibility |
| `--color-accent-soft` | `260 83% 97%` | `130 15% 95%` | Barely-there warm sage tint |
| `--color-bg` | `0 0% 100%` | `38 18% 98%` | Warm ivory — same 38° hue family as accent; unified warmth |
| `--color-fg` | `0 0% 10%` | `355 12% 20%` | Warm near-black with pink undertone; consistent with primary-fg |
| `--color-fg-muted` | `0 0% 40%` | `355 8% 52%` | Warm blush grey |
| `--color-border` | `0 0% 80%` | `355 12% 90%` | Soft blush border |
| `--color-border-muted` | `0 0% 88%` | `355 8% 95%` | Near-invisible warm blush divider |
| `--color-border-strong` | `0 0% 65%` | `355 15% 78%` | Emphasis borders/focus rings in warm blush family |
| `--color-surface` | `N/A (new token required)` | `0 0% 100%` | Explicit card surface token for the discovery doc + card treatments |
| `--font-sans` | `var(--font-geist-sans)` | `var(--font-dm-sans)` | Humanist sans better suited to fashion/lifestyle register |
| `--font-heading` | `N/A (new token required)` | `var(--font-cormorant-garamond)` | Editorial heading family for premium fashion register |
| `--radius-sm` | `4px` | `2px` | Tighter chip/badge corners for curated look |
| `--radius-md` | `8px` | `4px` | Restrained radius aligns with "curated, not cluttered" |
| `--radius-lg` | `12px` | `8px` | Keeps larger surfaces soft without becoming bubbly |

**Dark mode overrides (tokens that differ from base dark):**

| Token | Base Dark Value | Override Value | Reason |
|-------|-----------------|----------------|--------|
| `--color-bg` | `0 0% 4%` | `355 14% 10%` | Warm rose-espresso base instead of neutral black |
| `--color-fg` | `0 0% 93%` | `355 8% 92%` | Keep foreground warm in the same hue family |
| `--color-fg-muted` | `0 0% 75%` | `355 6% 55%` | Mid rose-grey for muted text hierarchy |
| `--color-border` | `0 0% 30%` | `355 10% 22%` | Warm-toned dark dividers |
| `--color-border-muted` | `0 0% 22%` | `355 8% 18%` | Subtle dark border tint |
| `--color-border-strong` | `0 0% 45%` | `355 12% 32%` | Stronger border in the same warm family |
| `--color-primary` | `220 90% 66%` | `355 55% 75%` | Maintain Strawberry Milk as unchanged brand anchor |
| `--color-primary-fg` | `0 0% 10%` | `355 14% 10%` | Foreground on primary aligned with dark background tone |
| `--color-primary-soft` | `220 90% 18%` | `355 30% 22%` | Dark strawberry tint for chips/badges |
| `--color-primary-hover` | `220 90% 72%` | `355 55% 82%` | Lightened hover state with brand hue consistency |
| `--color-primary-active` | `220 90% 78%` | `355 55% 85%` | Pressed state tuned for dark context |
| `--color-accent` | `260 83% 70%` | `130 18% 62%` | Slightly richer sage for dark readability |
| `--color-accent-fg` | `0 0% 10%` | `130 15% 88%` | Legible foreground on dark sage accent surfaces |
| `--color-accent-soft` | `260 83% 20%` | `130 14% 18%` | Dark sage tint for low-emphasis accent surfaces |
| `--color-surface` | `N/A (new token required)` | `355 12% 16%` | Lifted warm card face above dark background |

### Theme Prerequisites

All prerequisites completed 2026-02-23:

1. ~~Create `packages/themes/caryina/src/tokens.ts` extending `@themes/base`~~ — Done
2. ~~Apply all token overrides from the table above~~ — Done (light + dark mode)
3. ~~Add `Cormorant Garamond` + `DM Sans` to font loading in the app layout~~ — Done (`apps/caryina/src/app/layout.tsx`)
4. ~~Run `pnpm build:tokens`~~ — Done (`packages/themes/caryina/tokens.css` generated)
5. ~~Register theme in `packages/themes/index.ts` if applicable~~ — Auto-discovered via workspace glob

## Signature Patterns

### BrandMark Material Transformation

**When:** Brand-defining reveal moments (initial header mount and curated hover replay) where the Caryina wordmark transitions into the tagline.

**Implementation:** Keep `Car` + `ina` merge as DOM text motion; render the dissolving `y` as a Canvas 2D particle overlay using brand tokens `--color-primary` and `--color-accent`, with reduced-motion fallback to immediate final state.

**Example:** `docs/plans/hbag-brandmark-particle-animation/design-spec.md`

### Product-in-context Hero Framing

**When:** PDP hero and listing hero shots that need to validate premium craft at first glance.

**Implementation:** Editorial neutral backgrounds, one scale reference, one macro craft proof shot; no flat-lay clutter or high-saturation craft-fair lighting.

**Example:** `docs/business-os/strategy/HBAG/brand-strategy.user.md` (Positioning Constraints / Product presentation)

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| caryina | `@themes/caryina` | Active | Scaffold created 2026-02-23; BrandMark wordmark + tagline implemented; port 3018 |
| cover-me-pretty | `@themes/caryina` | Legacy | Pre-rebrand app name; to be evaluated for migration or retirement |

## References

- Brand strategy (ASSESSMENT-10): `docs/business-os/strategy/HBAG/brand-strategy.user.md`
- Strategy index: `docs/business-os/strategy/HBAG/index.user.md`
- Distribution plan (ASSESSMENT-06): `docs/business-os/strategy/HBAG/distribution-plan.user.md`
- Measurement plan (ASSESSMENT-07): `docs/business-os/strategy/HBAG/measurement-plan.user.md`
- Design system handbook: `docs/design-system-handbook.md`

## Proof Ledger

| Claim | Evidence | Source | Confidence |
|-------|----------|--------|------------|
| Business name: Caryina | Pete selected 2026-02-21 | `naming-shortlist-2026-02-21.user.md` | High |
| Premium positioning €80–€150 | Pete confirmed 2026-02-17 | `plan.user.md`, intake packet | High |
| Primary ICP: women 27–42, LV/Gucci-tier bags | Market research + buyer failure state analysis | `problem-statement.user.md`, `s0a-research-appendix.user.md` | High |
| Personality and voice confirmed | Pete confirmed 2026-02-21 | `brand-strategy.user.md` | High |
| Colour palette and typography | Synthesized from brand strategy + aesthetic constraints | `brand-strategy.user.md` §E | Medium — Pete review required |
| App name: cover-me-pretty | lp-design-spec mapping | `.claude/skills/lp-design-spec/SKILL.md` | Medium |
