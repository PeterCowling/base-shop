---
Type: Brand-Dossier
Business-Unit: HEAD
Business-Name: Headband (name pending clearance)
Status: Draft
Created: 2026-02-17
Last-reviewed: 2026-02-20
Token-Source: TBD — packages/themes/cochlearfit/src/tokens.ts (theme package does not yet exist; see App Coverage below)
---

# Headband (Name Pending) — Brand Dossier

> **Draft status.** Token values are not duplicated in this document. When the theme package
> is created, the single source of truth will be `packages/themes/cochlearfit/src/tokens.ts`.
> This document records *why* tokens should be chosen, not what values they hold.
> All `TBD` fields require operator input or market research before this dossier can advance to Active.

## Audience

**Primary:** Adults and parents of children with cochlear implants in Italy. Age range TBD — cochlear implant users span from infants to elderly; the head-worn accessory category skews toward parents purchasing for children and adult women purchasing for themselves. Italy TAM estimate: ~17,000 cochlear-implant users (niche).

**Secondary:** TBD — gift purchasers (family members, audiologists recommending accessories).

**Device:** TBD — mobile-first assumed based on Italian e-commerce norms, but must be validated with first-party analytics once live.

**Context:** Likely discovery via search (high-intent, problem-aware) and peer community referral (cochlear implant communities, parenting forums). Purchasing decision is practical + emotional: does it fit my device? will it stay on? does it look good? Trust, compatibility evidence, and return policy clarity are decision-critical.

**Key insight:** The audience is defined by a medical device (cochlear implant), not purely by demographics. Compatibility and fit are purchase-blockers, not just preferences. Tone must be matter-of-fact and reassuring, not medicalized.

## Personality

- **Reassuring**, not clinical
- **Practical**, not purely aspirational
- **Approachable**, not technical or jargon-heavy
- **Inclusive**, not niche-stigmatizing (normalizes wearing a headband, doesn't over-emphasize disability)
- **Warm**, not corporate

> TBD — Validate personality direction with 3–5 customer conversations or community feedback before advancing to Active.

## Visual Identity

### Color Palette

> TBD — No design work has been done for CochlearFit. The following are directional notes only.
> A dedicated `/lp-design-spec` session + theme package creation is required before Active status.

| Role | Token (proposed) | Rationale |
|------|-----------------|-----------|
| Primary | TBD | Should feel warm and approachable without clinical/medical coldness. Avoid blue-white (medical). Consider soft earth tones or muted pastels. Validate against accessibility + competitor differentiation. |
| Primary soft | TBD | Tinted background for cards and highlights |
| Accent | TBD | Complementary to primary; avoid red/orange (urgency reads as alarm in medical contexts) |
| Background | TBD | Clean, light — not stark white (cold), not cream (dated) |

**Palette mood:** TBD — candidate direction: warm neutral + 1 distinctive accent. Avoid the cold clinical look of medical equipment. Avoid the aggressive energy of sports accessories. Aim for "everyday lifestyle that happens to accommodate a medical device."

### Typography

| Role | Token (proposed) | Rationale |
|------|-----------------|-----------|
| Body + headings | TBD | Readable, friendly, not too geometric (engineer feel). Consider humanist sans-serif. Italian market: ensure good display at moderate sizes. |
| Monospace | N/A — no dev-facing UI |

### Shape & Elevation

| Property | Token (proposed) | Rationale |
|----------|-----------------|-----------|
| Card radius | TBD | Softer radius (friendlier) preferred over hard corners (clinical) |
| Default shadow | TBD | Light elevation; product cards need to feel trustworthy, not flashy |

### Token Rationale

> Token rationale will be populated when the theme package is created. This section is a placeholder.

| Token | Design rationale |
|-------|-----------------|
| _(all TBD)_ | Theme package `packages/themes/cochlearfit/` does not yet exist. Populate when created via `/lp-design-spec`. |

### Imagery Direction

- **Do:** Real product photography showing fit on head (over cochlear implant worn correctly). Lifestyle photography with natural lighting. Inclusive representation — show range of ages, hair types, and cochlear implant processor types.
- **Don't:** Stock photography of generic hair accessories. Over-medicalized imagery (hospital settings, devices isolated on white). Imagery that emphasizes disability over lifestyle.

> TBD — Validate imagery direction against competitor positioning and community feedback.

## Voice & Tone

### Writing Style

- **Sentence length:** Short and direct. Customers often have practical questions; answer them quickly.
- **Formality:** Conversational but professional. Not casual-slang; not formal-medical.
- **Technical level:** Acknowledge the device (cochlear implant) without jargon. Use plain names for processor brands (Cochlear Nucleus, Advanced Bionics, MED-EL) when compatibility is stated — customers know their own device.
- **Italian localization:** Primary market is Italian. Italian copy should feel native, not translated. Warmth in Italian differs from English warmth — shorter sentences, direct address.

### Key Phrases

> TBD — Validate with customer interviews. Directional suggestions:
- "Fits your processor" (compatibility-first framing)
- "Made for everyday wear" (normalizes the use case)
- "Your fit, your style" (practical + personal)

### Words to Avoid

> TBD — Validate with customer/community feedback. Initial candidates:
- Medical jargon ("implant-compatible device interface")
- Stigmatizing language ("hide your processor", "disguise")
- Overpromising fit language without evidence ("fits all processors" if not verified)

## Signature Patterns

> TBD — No application has been built yet. Patterns will be added as `/lp-design-spec` identifies them during feature work.

_First pattern to define: product compatibility display component (which processor brands/models this headband fits — this is the primary conversion trust element)._

## App Coverage

| App | Theme | Status | Notes |
|-----|-------|--------|-------|
| cochlearfit | `packages/themes/cochlearfit/` | Not created | Main storefront — theme package must be created before `/lp-design-spec` can run |

> **Prerequisite for Active:** theme package must exist and Token-Source must be a real file path.

## References

- Business strategy: `docs/business-os/strategy/HEAD/plan.user.md`
- 90-day forecast (canonical): `docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md`
- Offer design (canonical): `docs/business-os/startup-baselines/HEAD-offer.md`
- Naming shortlist: `docs/business-os/strategy/HEAD/2026-02-20-naming-shortlist.user.md`
- Strategy index (artifact status): `docs/business-os/strategy/HEAD/index.user.md`
- Design system handbook: `docs/design-system-handbook.md`

## Proof Ledger

| Claim | Evidence | Source | Confidence |
|-------|----------|--------|------------|
| Italy TAM directional band ~17k-20k | Consolidated market-intel refresh | `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md` | Medium |
| Category supports low-risk textile + organisation expansion | S3B synthesis top-3 MVP recommendation | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` | Medium |
| Primary market is Italy, high-intent + referral-acquisition mix | Canonical strategy + channels backfill | `docs/business-os/strategy/HEAD/plan.user.md`, `docs/business-os/startup-baselines/HEAD-channels.md` | Medium |
| Fit/compatibility clarity is a primary conversion and returns driver | Offer and forecast assumptions | `docs/business-os/startup-baselines/HEAD-offer.md`, `docs/business-os/startup-baselines/HEAD/S3-forecast/2026-02-20-lp-forecast.user.md` | Medium |

## Draft → Active Advancement Criteria

To advance this dossier from `Draft` to `Active`, the following must be complete:

- [ ] Audience demographic validated with first-party or community evidence (not just forecast estimates)
- [ ] Personality direction validated with ≥3 customer/community inputs
- [ ] Color palette decided and theme package `packages/themes/cochlearfit/` created
- [ ] Token-Source updated from `TBD` to real file path
- [ ] Typography decided and added to theme
- [ ] Key Phrases validated — at least 3 non-TBD phrases with evidence
- [ ] Words to Avoid list validated
- [ ] Proof Ledger: ≥1 entry with Medium or High confidence per claim
- [ ] Reviewed by Pete
