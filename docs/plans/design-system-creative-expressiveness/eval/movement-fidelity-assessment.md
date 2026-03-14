# Movement Fidelity Assessment -- Phase 3 Eval Probe

**Date:** 2026-03-14
**Component:** Newsletter signup section (Caryina brand)
**Movements tested:** Swiss/International, Editorial, Minimalist
**Artifact:** `docs/plans/design-system-creative-expressiveness/eval/movement-fidelity-probe.tsx`

---

## Difference Matrix

| Dimension | Swiss | Editorial | Minimalist | All Different? |
|-----------|-------|-----------|------------|----------------|
| Border radius | `rounded-sm` on form container + inputs + button | `rounded-sm` on input + button | `rounded-sm` on input + button | N -- all use `sm` |
| Shadow / elevation | Flat (none) | Subtle (`shadow-sm` on button, hover `shadow-md`) | Flat (none) | Y -- Editorial has shadow, others flat |
| Type scale contrast | Moderate (3xl-4xl heading / base body) | Dramatic (5xl-7xl heading / base-lg body) | Minimal (2xl-3xl heading / sm body) | Y |
| Letter spacing | Tight tracking on labels + heading (0.12em / 0.04em), uppercase | Loose tracking on button only (0.06em), no uppercase | No tracking anywhere | Y |
| Whitespace | Generous (py-24/32) | Extreme (py-32/48) | Extreme (py-32/40) | Y -- Swiss is tightest, Editorial most extreme |
| Color usage | Restrained -- fg/bg inversion on button, spot rule line | Restrained -- fg/bg inversion on button, single border-b on input | Monochromatic body + spot accent on CTA only | Y -- Minimalist uses accent token; others use fg inversion |
| Grid layout | Asymmetric 2-column (5 + 1 gutter + 6) | Single-column centred | Single-column left-aligned | Y |
| Border treatment | Defined -- explicit `border` on form container + input | Subtle -- `border-b` on input only | None -- only a faint bottom rule via inline style on input | Y |
| Text transform | Uppercase on heading + labels + button | None (sentence case throughout) | None (sentence case throughout) | Y -- Swiss is uppercase; others are not |
| Motion | None | Dramatic staggered fade-up (4 elements, 200ms offsets) | None | Y -- Editorial has motion; others have none |

## Overall Fidelity Score

**Are the three versions visually distinguishable from each other?**
Yes. The three versions would render as noticeably different layouts with distinct typographic character, spatial rhythm, and interaction behaviour.

**Could someone identify which movement each version represents without labels?**
4 out of 5 confidence.

- Swiss is the most identifiable: the uppercase transforms, tight tracking, asymmetric grid, and defined borders are unmistakable Swiss/International markers.
- Editorial is second-most identifiable: the oversized light-weight heading, staggered entry animation, centred single-column prose, and extreme vertical padding are strong editorial signals.
- Minimalist is identifiable by elimination: the absence of borders, motion, and text transforms, combined with a monochromatic palette broken only by a single accent button, reads as deliberate reduction. However, it shares "single-column" with Editorial and "flat elevation" with Swiss, which could cause slight ambiguity.

**Which movement produced the MOST distinctive result?**
Swiss / International. The asymmetric grid, uppercase transforms, and defined-border form container combine to create a layout that is structurally different from the other two. It is the only version with a multi-column layout, the only one with uppercase text, and the only one with a visible container border.

**Which movement produced the LEAST distinctive result?**
Minimalist. Because minimalism is defined by the absence of decoration, it risks looking like an underdesigned version of Editorial. The key differentiators (no motion, left-aligned instead of centred, monochromatic with spot accent on CTA) are real but subtler than the Swiss differentiators.

**What was the same across all three despite different movement settings?**
1. **Border radius** -- all three use `rounded-sm`. This is because the Caryina baseline profile specifies `sm` and none of the movement overrides change it to a different value. Swiss explicitly calls for `sm`; Minimalist explicitly calls for `sm`; Editorial inherits the brand baseline.
2. **Font families** -- all three use Cormorant Garamond for headings and DM Sans for body. The movement table adjusts weight and scale but not font family; font family comes from `assets.ts`.
3. **Copy content** -- identical across all three (as specified in the brief).
4. **Semantic color tokens** -- all use `text-fg`, `text-fg-muted`, `bg-surface-1`, etc. The movements differ in how many of those tokens are engaged, not in which token system is used.

---

## Conclusions for the Creative Expressiveness Initiative

The style movement translation table produces meaningfully different visual outputs. The key differentiators that create the strongest visual separation are:

1. **Grid layout** (asymmetric vs single-column) -- highest-impact structural difference
2. **Text transform** (uppercase vs sentence case) -- immediately visible typographic signal
3. **Motion** (staggered entry vs none) -- binary presence/absence creates strong separation
4. **Type scale contrast** (moderate vs dramatic vs minimal) -- affects the visual weight distribution

The weakest differentiator is **border radius**, which collapsed to the same value across all three movements because the brand baseline and two of the three movements specify the same `sm` value. This is not a flaw -- it reflects the correct behaviour where brand identity constrains movement expression. A brand with `defaultRadius: "xl"` would show more radius variation between Swiss (`sm`) and its baseline.

**Recommendation:** The translation table is fit for purpose. No changes required for Phase 3 gate.
