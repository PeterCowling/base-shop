# Skylar SRL — English Locale Guide

Use this doc alongside the central `AGENTS.md`. It captures the visual language and behavioural rules specific to `/en`.

## 1. Design language — “Warm red on creamy neutral”

### Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Primary ink / accent | `#E43D12` | Default colour for headings, nav links, CTAs, major icons. |
| Secondary accent | `#D6536D` | Logotypes, sub-headlines, buttons needing contrast from primary red. |
| Soft highlight | `#FFA2B6` | Sparingly for tags/pills or illustration accents. |
| Warm support | `#EFB11D` | Alerts, “limited” badges, key data points. |
| Neutral background | `#EBE9E1` | Base page colour; feel like warm paper. |

Rules:
- Red is the default ink instead of black; pair with generous whitespace.
- Keep the palette disciplined; secondary/highlight colours mostly stay inside imagery or understated UI chips.
- Negative space + large tap targets keep the warm palette readable.

### Typography & hierarchy

- Pair a dramatic display face (serif/high-contrast sans) with a clean sans for body/UI.
- Hero words (e.g. “PRODUCTS”, “REAL ESTATE”, “FUNCTIONALISM”):
  - All caps, generous tracking, oversize type.
  - Let them crop off the grid or run edge-to-edge to become graphic shapes.
- Paragraph guidance: 2–4 lines is the default, but stretch longer when nuance or storytelling demands it; keep line-height comfortable and sentences purposeful (“Stuff should work. Period.” is still the tone anchor).
- Clear hierarchy: hero word → headline → short explanatory paragraph.
- Utilitarian tone with scale providing drama (not quirky fonts).

### Layout & composition

- Build the page as stacked “mini posters”. Each section can stand alone: one hero word, one hero image/object, one tight paragraph/CTA.
- Use a strong but invisible grid; align copy + imagery but permit large type/imagery to bleed slightly for energy.
- Maintain breathing room above/around large red text.
- Default section skeleton: hero word/phrase → supporting copy → product/use-case imagery.

### Imagery

- Put products/experiences first: crisp objects on clean backgrounds or in-use moments.
- Align colour grading with the palette (reds/pinks/warm yellows) so typography + imagery feel cohesive.
- Avoid noisy backgrounds; neutral base and typography should dominate.

### Motion & interaction

- Use motion to explain function (folding, revealing, sliding) rather than purely decorative loops.
- Transitions should be restrained: short durations, gentle easing.
- Micro-interactions emphasise function and red-on-neutral theme (subtle underlines, fades, reveals).

### Tone of voice

- Straightforward, confident, human.
- Declarative one-liners for headlines; keep personality in secondary copy.
- Focus on outcomes: how things work, how they feel to use, why they matter.

## 2. Structure (Home)

1. **Header (`loket-nav`)**
   - Infinity logo, nav links (Products & Platforms, Real Estate, People), language selector.
   - Uses responsive `clamp()` sizing; alternating colours and vertical dividers for readability.
2. **Intro three-column grid**
   - “The Flywheel”, “Products”, “Real Estate”.
   - For each, render heading (accent colour) + body paragraph from translation keys.
3. **Hero block**
   - Massive “PRODUCTS” word spanning up to 90% width; size adapts to viewport.
   - Category cards (Electronics, Home, Apparel & Bags, Pets).
   - Split sections (“Industrial design” and “Built by us”) sit directly after categories and link to `/en/products`.
4. **REAL ESTATE hero word** (same oversized treatment) followed by the “Prime Locations” + “Comfort” splits, each linking to `/en/real-estate`.
5. Footer mirrors the header’s responsive typographic treatment.

## 3. Other pages (`/en/products`, `/en/real-estate`, `/en/people`)

Follow the same visual system: poster-like sections, big typographic hierarchy, minimal imagery.

- **Products**: Hero mirrors the home hero style, followed by the catalog grid (“PRODUCTS” heading), vertical poster stack (Design, Sourcing, Distribution) with long-form copy, then the manifest sections were removed—keep the page concise.
- **Real Estate**: Begins with the “Diversified portfolio” hero, flagship cards, hostel imagery, a showcase gallery, and stack cards. Gallery images are generic property highlights (no extra text). Flagship cards link appropriately (hostel direct, StepFree booking, Tower email/map).
- **People**: New hero (“Peter & Cristiana”) summarises each principal’s remit, followed by business-card style profiles. Cards use Poppins, have clear sections (name block, roles, summary, contacts). Cristiana covers product research/ops/construction/accounting; Peter covers platforms/commercial/marketing/service delivery.
- Real-estate page still links externally when booking Hostel Brikette, but hero CTAs now use the internal `/en/real-estate` copy for blurbs.

## 4. Implementation reminders

- All text widths stay inside `width: 100%` containers with responsive padding; no fixed max-width wrappers.
- Use CSS variables (`--en-body-size`, `--en-body-line`) for base sizing and apply `clamp()` to headings/nav/footers.
- Keep translations split into `heading` + `body` where necessary to support styling (e.g., intro columns).
- When adding new sections, treat them like independent posters: hero word + supporting copy + optional product shot.
