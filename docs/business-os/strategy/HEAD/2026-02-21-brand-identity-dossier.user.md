---
Type: Brand-Language
Stage: ASSESSMENT-11
Business-Unit: HEAD
Business-Name: Solena
Status: Draft
Created: 2026-02-17
Updated: 2026-02-21
Last-reviewed: 2026-02-21
Owner: Pete
Token-Source: packages/themes/solena/src/tokens.ts (theme package not yet created — see App Coverage)
Review-trigger: After each completed build cycle touching this document.
---

# Solena — Brand Language

> **Draft status.** Visual identity decisions are complete and ready for theme package creation.
> Token values are documented below. When the theme package is created at
> `packages/themes/solena/src/tokens.ts`, that file becomes the single source of truth for token values.
> This document records the *why* behind every token choice.

---

## Audience

**Primary:** Parents and caregivers of children with cochlear implants, primarily in Italy. Children approximately 12 months–12 years — the period of highest processor-slip frequency and daily handover friction. Problem appears daily: morning setup, school handover, sport, bedtime, travel. Mindset at brand encounter: practical and problem-aware, not browsing. Not looking for inspiration — looking for a reliable solution to a daily frustration. Emotionally invested in their child's daily experience.

**Secondary:** Active teen and adult CI wearers (approximately 16–45 years). Primary pain: processor slippage during movement. More style-aware than the caregiver segment; purchase is more self-led.

**Tertiary (awareness only):** Gift purchasers — family members and audiologists recommending accessories. Not a direct-response target at launch.

**Device:** Mobile-first. Italian e-commerce norms and peer-community referral context (CI parenting forums, Facebook groups) favour mobile discovery and purchase.

**Context:** High-intent search and peer referral. Buyer is problem-aware at point of discovery — evaluating fit, compatibility, and trust. Purchase blockers are "Will this fit my child's processor?" and "Can I trust this brand?", not "Do I need this?"

---

## Personality

- **Reassuring**, not clinical — the brand feels safe and grounded, never medicalized or alarm-coded
- **Practical**, not purely aspirational — solves a real daily problem first; warmth and style follow from that
- **Approachable**, not technical — speaks plainly to busy parents; acknowledges the device without jargon
- **Inclusive**, not niche-stigmatizing — normalises wearing a headband alongside a CI processor; never frames the product as a fix for something to be hidden
- **Warm**, not corporate — sounds like a person, not a manufacturer

---

## Visual Identity

### Colour Palette

Palette rationale: The name Solena carries warmth ("sol" root — sun, light) and an Italian Mediterranean quality. The palette reflects this: warm clay terracotta as the primary (distinctive from medical blue-white, from BRIK's coral-orange, and from sports-brand neons), grounded by a dusty Mediterranean seafoam accent. Background is warm linen, not stark clinical white. The overall effect reads Italian artisan lifestyle brand — trustworthy, warm, and non-clinical.

| Role | Token | HSL (light) | HSL (dark) | Rationale |
|------|-------|-------------|------------|-----------|
| Primary | `--color-primary` | `18 52% 52%` | `18 45% 68%` | Warm terracotta clay — Italian, craft-quality, lifestyle; avoids medical blue and BRIK coral (hue 6) |
| Primary foreground | `--color-primary-fg` | `0 0% 100%` | `18 15% 10%` | White text on clay CTA; warm dark on light clay in dark mode |
| Primary soft | `--color-primary-soft` | `18 52% 95%` | `18 35% 18%` | Lightly tinted wash for card highlights, section backgrounds |
| Primary hover | `--color-primary-hover` | `18 52% 46%` | `18 45% 74%` | Slightly deeper clay on hover |
| Primary active | `--color-primary-active` | `18 52% 40%` | `18 45% 78%` | Pressed state |
| Accent | `--color-accent` | `180 22% 44%` | `180 22% 60%` | Dusty seafoam/teal — Mediterranean water; complements clay; calm, non-clinical; used for badges, secondary interactive states |
| Accent foreground | `--color-accent-fg` | `0 0% 100%` | `0 0% 100%` | White text on dusty teal |
| Accent soft | `--color-accent-soft` | `180 25% 94%` | `180 18% 18%` | Very light teal wash |
| Background | `--color-bg` | `35 20% 97%` | `18 10% 8%` | Warm linen off-white (not clinical stark white); slight warmth reduces medical feel |

**Palette mood:** Warm Italian clay with a grounding Mediterranean seafoam accent — trustworthy, lifestyle-forward, distinctly non-clinical.

**Canonical token names** (from `packages/themes/base/src/tokens.ts`):
`--color-primary` (+ `-fg`, `-soft`, `-hover`, `-active`), `--color-accent` (+ `-fg`, `-soft`), `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-border`.

### Typography

> **Constraint:** All fonts must be freely available — Google Fonts or system stacks only. No paid or licensed typefaces.

Font rationale: DM Sans is a humanist sans-serif with warm, approachable letterforms. It reads professionally without feeling cold or technical (unlike geometric sans-serifs). Excellent legibility at body sizes. Good Italian character rendering. Clearly distinct from Geist Sans (base theme) and Plus Jakarta Sans (BRIK prime theme).

| Role | Token | Font Family | Source | Rationale |
|------|-------|-------------|--------|-----------|
| Body + UI | `--font-sans` | `DM Sans, system-ui, sans-serif` | [Google Fonts](https://fonts.google.com/specimen/DM+Sans) | Humanist warmth; approachable without being playful; strong legibility for parent-audience at mobile sizes |
| Headings | inherits `--font-sans` | same family | same | No display-font contrast needed; consistency signals reliability over flair |

**Google Fonts URL:** `https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap`

**Type personality:** Humanist sans-serif — professional enough for trust, warm enough for a daily-care brand targeting parents.

**Loading:** Import `DM Sans` from Google Fonts (weights 400, 500, 600). Use `font-display: swap` and `preload` for the 400 weight.

### Shape & Elevation

| Property | Token | Value | Notes |
|----------|-------|-------|-------|
| Card radius (medium) | `--radius-md` | `0.75rem` | Softer than base default — friendlier, less corporate; consistent with lifestyle brand register |
| Card radius (large) | `--radius-lg` | `1rem` | Used for modal overlays, hero cards — rounder and more approachable |
| Default shadow | `--shadow-sm` | base value | Light elevation on product cards; warm-biased neutral (no cold grey cast) |

### Imagery Direction

- **Do:** Real product photography showing the headband worn correctly on a child's head with the CI processor in place — the primary conversion proof shot. Natural lighting, warm colour grading consistent with the terracotta/linen palette. Contextual lifestyle scenes: morning routine, school run, playground, sports, travel. Show a genuine range of hair types, skin tones, ages, and CI processor brands (Cochlear Nucleus, MED-EL, Advanced Bionics). Parents and children together where possible — this is a family purchase.
- **Do:** Close-up detail shots of product construction — fabric texture, clasp quality, fit adjustment — to answer "will this stay on?" before the customer asks.
- **Don't:** Stock photography of generic children's hair accessories or generic headbands without a CI processor visible. Over-medicalized imagery: hospital settings, clinical white backgrounds with device components arranged on a table, before/after framing.
- **Don't:** Imagery that emphasises disability over lifestyle — no imagery that frames the CI processor as a problem to be solved or hidden. The aesthetic normalises the device as part of the child's everyday appearance, not as a medical fact to be managed.

---

## Voice & Tone

### Writing Style

- **Formality:** conversational — professional enough for trust, approachable enough for a parent reading a Facebook group recommendation at 7am
- **Sentence length:** short — answer the practical question fast; secondary information follows
- **Humour:** none — context is a child's daily medical device; warmth yes, humour no
- **Technical level:** plain language; name processor brands directly (Cochlear Nucleus, MED-EL Sonnet, Advanced Bionics) when stating compatibility — customers know their own device and want to be met at that level; no clinical or engineering terminology

### Italian copy note

Italian is the primary language of the primary market. Italian copy must feel native, not translated. Italian warmth is more direct and less effusive than English warmth — shorter sentences, direct address (`per tuo figlio`, `il tuo processore`), less hedging. Avoid literal translation of English idioms.

### Key Phrases

- **"Fits your processor"** — compatibility-first framing; the primary purchase-decision signal; use early, specifically, with named processor families where possible
- **"Made for everyday wear"** — normalises the use case; positions Solena as a standard part of the daily routine, not a workaround
- **"Secure wear for busy days"** — core campaign-level message; pairs the functional benefit with the real-life context (school, play, travel)
- **"Worn proudly"** — style and inclusion cue; counteracts concealment framing without overstating it
- **"Your fit, your style"** — used in personalisation and accessory-range contexts

### Words to Avoid

- **"improve hearing" / "therapy" / "treatment" / "rehabilitation"** — EU MDR regulatory boundary; these risk framing Solena as a medical-purpose claim or device-enabling accessory
- **"essential for implant function" / "enables your processor to work"** — EU MDR accessory-enabling language; hard stop
- **"hide" / "invisible" / "discreet" / "conceal"** as a primary promise — conflicts with inclusive positioning; Solena normalises wearing, not concealment
- **"fits all processors"** without a verified compatibility matrix — overpromising; generates returns and erodes trust
- Medical jargon (e.g., "implant-compatible device interface") — alienating; not how parents talk
- Stigmatising framing (e.g., "despite having a hearing loss", "even though your child wears a device") — Solena treats CI wear as ordinary, not as something to overcome

---

## Token Overrides

Theme package: `packages/themes/solena/src/tokens.ts` — **not yet created.**

The overrides below are the canonical spec for the theme package. When created, these values should be applied verbatim.

Reference: `packages/themes/prime/src/tokens.ts` shows the override pattern to follow (structure and type shape). Base values are in `packages/themes/base/src/tokens.ts`.

| Token | Base Value | Solena Override | Reason |
|-------|-----------|-----------------|--------|
| `--color-primary` | base default | `light: '18 52% 52%'`, `dark: '18 45% 68%'` | Warm terracotta clay primary |
| `--color-primary-fg` | base default | `light: '0 0% 100%'`, `dark: '18 15% 10%'` | White on clay in light; warm dark in dark mode |
| `--color-primary-soft` | base default | `light: '18 52% 95%'`, `dark: '18 35% 18%'` | Tinted linen wash |
| `--color-primary-hover` | base default | `light: '18 52% 46%'`, `dark: '18 45% 74%'` | Slightly deeper on hover |
| `--color-primary-active` | base default | `light: '18 52% 40%'`, `dark: '18 45% 78%'` | Pressed state |
| `--color-accent` | base default | `light: '180 22% 44%'`, `dark: '180 22% 60%'` | Dusty seafoam accent |
| `--color-accent-fg` | base default | `light: '0 0% 100%'`, `dark: '0 0% 100%'` | White on dusty teal |
| `--color-accent-soft` | base default | `light: '180 25% 94%'`, `dark: '180 18% 18%'` | Light teal wash |
| `--color-bg` | base default | `light: '35 20% 97%'`, `dark: '18 10% 8%'` | Warm linen background (not clinical white) |
| `--font-sans` | `var(--font-geist-sans)` | `var(--font-dm-sans)` | Humanist warmth; DM Sans loaded in layout |
| `--radius-md` | base default | `light: '0.75rem'` | Softer corners — friendlier, less corporate |
| `--radius-lg` | base default | `light: '1rem'` | Rounded cards and modals |

**Dark mode:** requires bespoke overrides — dark values listed in Colour Palette and Token Overrides tables above.

---

## Signature Patterns

TBD — patterns emerge through `/lp-design-spec` work during DO+.

_First pattern to define:_ **Processor compatibility display component** — shows which CI processor brands/models this headband fits (Cochlear, MED-EL, Advanced Bionics). This is the primary conversion trust element; it must be styled in Solena brand tokens and should appear on every product detail page above the fold.

---

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| solena (storefront) | `packages/themes/solena/` | Planned — not yet created | Theme package must be created before `/lp-design-spec` can run at DO. Follow `packages/themes/prime/` as the structural template. |

---

## References

- Brand strategy (ASSESSMENT-10): `docs/business-os/strategy/HEAD/2026-02-21-brand-profile.user.md`
- Naming shortlist r2 (name decision): `docs/business-os/strategy/HEAD/2026-02-21-candidate-names-r2.user.md`
- Business strategy: `docs/business-os/strategy/HEAD/plan.user.md`
- Messaging hierarchy: `docs/business-os/strategy/HEAD/messaging-hierarchy.user.md`
- 90-day forecast (canonical): `docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md`
- Offer design (canonical): `docs/business-os/startup-baselines/HEAD-offer.md`
- Reference theme (structure template): `packages/themes/prime/src/tokens.ts`
- Base theme tokens: `packages/themes/base/src/tokens.ts`
- Design system handbook: `docs/design-system-handbook.md`

---

## Draft → Active Advancement Criteria

- [ ] Theme package `packages/themes/solena/src/tokens.ts` created with overrides above
- [ ] Token-Source updated to real file path
- [ ] DM Sans font loaded in `apps/solena` layout and confirmed rendering at mobile sizes
- [ ] Processor compatibility display component designed (first Signature Pattern)
- [ ] Colour palette reviewed by Pete — clay primary and seafoam accent confirmed
- [ ] Typography reviewed by Pete — DM Sans confirmed
- [ ] Reviewed by Pete before advancing to Active
