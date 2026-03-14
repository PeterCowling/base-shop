# Caryina Product Hero — Phase 3 Eval Self-Assessment

**Component:** `caryina-hero-probe.tsx`
**Surface mode:** marketing
**Theme:** caryina (`packages/themes/caryina`)
**Date:** 2026-03-14

---

## Profile Compliance Scorecard

### Category C Guidance

| Field | Profile Value | My Choice | Consistent? |
|-------|--------------|-----------|-------------|
| colorStrategy | restrained | Used only primary (strawberry milk) + neutral fg/fg-muted. No secondary accent colors in the hero. Sage reserved. | Y |
| accentUsage | spot | Primary appears only on CTA button and hover ring on material swatches. Everything else is neutral. | Y |
| whitespace | extreme (marketing mode) | min-h-screen section, py-24/py-32 vertical padding, generous mb-8/mb-10/mb-12 between elements. Content occupies roughly 40% of the viewport area. | Y |
| gridCharacter | single-column (baseline; marketing mode does not override) | Single text column on left, image on right. No multi-column grid within the content area. | Y |
| imageRelationship | full-bleed (marketing mode) | Image area is absolute-positioned to fill the right half on desktop and full background on mobile, with gradient overlay. | Y |
| motionPersonality | precise | Transitions use profile easing `cubic-bezier(0.2, 0, 0, 1)` and durationNormal (250ms). No bouncing, spring, or playful motion. Only hover state transitions on CTA and swatches. | Y |
| displayTransform | none | Heading text is sentence case, not uppercase. Only the eyebrow label uses uppercase — this is a label, not a display heading. | Y |

**Category C: 7/7 consistent.**

### Category A/B Compliance

| Field | Profile Value (with marketing override) | My Choice | Consistent? |
|-------|----------------------------------------|-----------|-------------|
| scaleRatio | 1.5 (marketing mode) | Heading uses `clamp(2.25rem, 5vw + 1rem, 4.5rem)` which at standard viewport yields roughly 3.375rem body (1rem) to display ratio ~3.4x — consistent with a 1.5 ratio applied across multiple scale steps (body -> h3 -> h2 -> h1). | Y |
| displayWeight | 300 (marketing mode) | `font-light` + explicit `fontWeight: 300` on the h1. | Y |
| defaultRadius | sm | CTA button and material swatches both use `rounded-sm`. No `rounded-lg` or `rounded-xl` anywhere. | Y |
| defaultElevation | subtle | CTA uses `shadow-sm` (subtle). No other elevated elements. | Y |
| bodyMeasure | 60ch | Description paragraph uses `max-w-[60ch]`. | Y |

**Category A/B: 5/5 consistent.**

### Additional Profile Compliance

| Field | Profile Value | My Choice | Consistent? |
|-------|--------------|-----------|-------------|
| labelTracking | 0.08em | Eyebrow and material label use `letterSpacing: "0.08em"`. CTA also uses 0.08em. | Y |
| bodyLeading | 1.6 | Body text uses `leading-relaxed` (Tailwind ~1.625, close to 1.6). | Y |
| buttonTone | solid | CTA is solid fill (`bg-primary text-primary-fg`), not outline/ghost/soft. | Y |
| defaultBorder | subtle | Material swatches use `ring-1 ring-border`. Bottom decorative line uses `bg-border`. Borders are present but understated. | Y |
| easing | cubic-bezier(0.2, 0, 0, 1) | Applied via inline style to all transitioning elements. | Y |
| durationNormal | 250ms | Transitions use `duration-[250ms]`. | Y |
| sectionGap | 4rem | Section uses full-viewport height; internal spacing is generous (mb-8 through mb-12), appropriate for a single hero section. | Y |
| componentGap | 1.5rem | Material swatches use `gap-3` (0.75rem) which is tighter than 1.5rem — deliberate for a compact option group. Acceptable deviation for a selector cluster. | ~Y |
| cardPadding | 1.5rem | No card surfaces in this hero — not applicable. | N/A |

---

## Brand-Fit Assessment

| Question | Score |
|----------|-------|
| Does this look like a premium handbag accessories brand? | **4/5** — Generous whitespace, light serif heading at large scale, restrained color, and editorial image treatment all signal luxury. The material swatch selector adds tactile product detail. Missing: actual product photography would push this to 5. |
| Could you tell this is Caryina with the logo removed? | **3/5** — The Cormorant Garamond light heading, warm ivory background, and strawberry milk CTA are distinctive to Caryina. However, without the brand's specific color-on-screen rendering and real imagery, it could be confused with other editorial luxury brands. The warm-toned near-black text (hsl 355 12% 20%) is a subtle differentiator. |
| Does it use Cormorant Garamond for headings? | **Y** — `font-heading` resolves to `"Cormorant Garamond", "Georgia", serif` per assets.ts. Price also uses `font-heading` for editorial consistency. |
| Does it use the Strawberry Milk / Warm Sage palette? | **Y** — Strawberry Milk is used for primary CTA and hover states. Warm Sage is deliberately withheld (spot accent usage — only one accent color appears in a marketing hero). The warm ivory background and blush-tinted borders complete the palette. |

---

## Distinctiveness

This component would look different from a generic e-commerce hero in several specific ways:

1. **Asymmetric split-screen with gradient veil.** Rather than a centered product card or a standard two-column grid, the image bleeds into the right half behind a directional gradient. The text floats free on the left without a containing card. This creates editorial tension between content and imagery.

2. **Light serif at display scale.** Most e-commerce heroes use bold sans-serif headings. Cormorant Garamond at weight 300 and ~4.5rem is distinctly editorial — it signals luxury print rather than tech or mass-market retail.

3. **Restrained single-accent color.** The only saturated element is the strawberry milk CTA. Everything else is neutral warm ivory and muted text. Generic heroes typically use 2-3 accent colors. The restraint here is the design choice.

4. **Material swatches as micro-interaction.** Small 32px swatches with ring transitions (precise easing, 250ms) add a tactile product detail without overwhelming the composition. The interaction is quiet — no tooltips, no animations, just a ring shift.

5. **Warm-tinted neutrals throughout.** The foreground (355 12% 20%), muted text (355 8% 52%), and borders (355 12% 90%) all carry a pink/blush undertone rather than pure grey. This creates a cohesive warmth that is specific to the Caryina palette.

6. **Extreme whitespace discipline.** The content area deliberately occupies less than half the viewport. The vertical padding (py-24 to py-32) and element spacing (mb-8 to mb-12) create breathing room that signals premium positioning rather than conversion urgency.

### What a generic hero would do instead

A generic hero would center the product name, use a bold sans-serif, place the image in a contained card with rounded-lg corners and shadow-md, add a gradient background, include multiple CTAs, and fill the available space with content. This component does none of those things.

---

## Overall Score Summary

- **Category C compliance:** 7/7
- **Category A/B compliance:** 5/5
- **Token rule compliance:** All colors via semantic tokens, all fonts via theme fonts, all spacing via Tailwind scale or profile values, no arbitrary hex values.
- **Brand fit:** 3.5/5 average
- **Distinctiveness:** High — five specific differentiators from generic e-commerce patterns.
