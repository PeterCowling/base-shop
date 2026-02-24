---
Type: Startup-Content-Packet
Status: Active
Business: HBAG
Business-Name: Caryina
Created: 2026-02-23
Updated: 2026-02-23
Last-reviewed: 2026-02-23
Owner: Pete
artifact: website-content-packet
source_of_truth: true
depends_on:
  - docs/business-os/startup-baselines/HBAG-offer.md
  - docs/business-os/startup-baselines/HBAG-channels.md
  - docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md
  - docs/business-os/strategy/HBAG/products-line-mapping.user.md
  - docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md
---

# HBAG Website Content Packet (Launch V1)

## Purpose

This is the canonical startup-loop copy packet for Caryina website surfaces.
It converts offer, channel, and product-evidence artifacts into concise launch copy that is:

- SEO-oriented but short-form (low initial content volume)
- claim-safe (no unsupported material/compliance claims)
- reusable across homepage, PLP, PDP, support, and policy/trust pages

## Refresh Trigger

Refresh this packet whenever one of the following changes:

1. S2B offer framing (ICP, promise, pricing, guarantee)
2. S6B channels and CTA language
3. PRODUCT-01 evidence (features, compatibility, naming constraints)
4. Demand evidence that alters objection handling or trust language

## Source Ledger

| Domain | Source path | Last reviewed | Why it matters |
|---|---|---|---|
| Offer and positioning | `docs/business-os/startup-baselines/HBAG-offer.md` | 2026-02-23 | Defines ICP, promise, value framing, risk-reversal |
| Channels and GTM | `docs/business-os/startup-baselines/HBAG-channels.md` | 2026-02-20 | Defines discovery channels and conversion path language |
| Product evidence | `docs/business-os/strategy/HBAG/2026-02-22-product-from-photo.user.md` | 2026-02-22 | Defines what can and cannot be claimed |
| Product line map | `docs/business-os/strategy/HBAG/products-line-mapping.user.md` | 2026-02-23 | Defines launch SKU set and naming logic |
| Market intelligence | `docs/business-os/market-research/HBAG/2026-02-20-market-intelligence.user.md` | 2026-02-20 | Defines market and keyword context for SEO |

## SEO Focus (Launch Phase)

### Primary transactional clusters

- mini bag charm
- handbag charm
- Italian-designed bag accessory
- micro bag charm

### Secondary support clusters

- structured bag charm with turn lock
- gift-ready bag accessory
- bag charm Etsy alternative
- Positano designed accessory

### Constraints

- Do not use "Birkin" in public copy.
- Do not claim "Made in Italy"; use "Designed in Italy/Positano" only.
- Do not state material composition unless verified in product docs.

## Page Intent Map

| Surface | Intent | Required copy blocks | Primary CTA |
|---|---|---|---|
| Home | Understand what Caryina sells and why it is different | headline, one-paragraph value statement, trust bullets, short FAQ | Shop the launch |
| Shop (PLP) | Compare variants quickly and choose a style | collection intro, short family labels, visual quality cues | View product |
| Product (PDP) | Confirm fit-for-style and trust before checkout | concise product summary, evidence-safe feature bullets, guarantee block | Continue to checkout |
| Support | Resolve pre/post-purchase friction fast | response channels, response-time expectation, exchange route | Contact support |

## Launch Message Hierarchy

1. **Core promise:** One considered detail for your bag, designed in Positano.
2. **Proof frame:** Structured silhouette, turn-lock closure, visible finish details.
3. **Risk reversal:** 30-day exchange + 90-day hardware support.
4. **Conversion path:** Discover on visual channels, buy through Etsy or website checkout.

## Product Copy Matrix (Launch SKUs)

| Product ID | Public name | Slug | One-line description | Evidence constraints |
|---|---|---|---|---|
| `01KCS72C6YV3PFWJQNF0A4T1P1` | Mini Facade Bag Charm - Silver | `caryina-mini-facade-bag-charm-silver` | Structured silver mini bag charm with turn-lock front closure and scarf accent styling. | Do not claim specific leather type. |
| `01KCS72C6YV3PFWJQNF0A4T1P2` | Mini Facade Bag Charm - Rose Splash | `caryina-mini-facade-bag-charm-rose-splash` | White-and-rose micro bag charm with textured finish and compact day-to-evening profile. | V2 facade presence is not confirmed in PRODUCT-01. |
| `01KCS72C6YV3PFWJQNF0A4T1P3` | Mini Facade Bag Charm - Peach | `caryina-mini-facade-bag-charm-peach` | Peach-toned mini bag charm with facade applique details and structured side gussets. | Hardware finish should be described generically if uncertain. |

## Reusable Trust Blocks

- Designed in Positano, Italy; manufactured to spec.
- Launch gallery follows a six-view sequence (hero, angle, detail, on-body, scale, alternate).
- 30-day exchange window and 90-day hardware support.

## Operational Integration

This packet is consumed by:

- `apps/caryina` homepage, PLP, PDP, support, and metadata copy modules
- `data/shops/caryina/products.json` title/description and slug updates
- launch copy QA checks (placeholder scan + SEO keyword inclusion)

## Verification Checklist

1. No placeholder copy in `apps/caryina/src/app/[lang]/**` and `data/shops/caryina/products.json`.
2. Product names/slugs match the matrix above.
3. Core keywords appear in home/shop/product metadata and visible copy.
4. Copy remains claim-safe against PRODUCT-01 unknowns.
