---
Type: Message-Variants
Status: Draft
Business: HBAG
Created: 2026-03-09
Updated: 2026-03-09
Owner: Pete
Review-trigger: Weekly while Caryina is testing channel, retail, or product-language frames.
---

# HBAG Message Variants

## Current Status

CAP-02 is now initialized for HBAG. The ledger holds the live boutique signal from Luisa Positano
plus the next message frames Caryina should test across social, website, and retail surfaces.

This artifact is still below the paid-activation pass floor. The current evidence is mostly
qualitative and offline; denominator-bearing tests still need to be logged.

## Active Hypotheses

| Hypothesis ID | Frame | Status | Success signal | Notes |
|---|---|---|---|---|
| HBAG-MSG-H1 | Fashion accessory first | Active | Buyers describe it as a small handbag accessory before they describe utility | Core thesis for Caryina; should lead homepage, social, and boutique framing |
| HBAG-MSG-H2 | Gift and discovery | Active | Buyers describe it as a Positano or Amalfi find worth gifting at full price | Important for resort-boutique and packaging logic |
| HBAG-MSG-H3 | Supportive utility | Active | Utility helps close the sale without replacing the fashion-led frame | Should stay secondary: AirPods, cards, lipstick, keys |
| HBAG-MSG-H4 | Dog variant containment | Deferred | Dog use remains clearly sub-line and does not dominate buyer language | Do not promote as hero message until the core fashion signal is stronger |

## Variant Ledger

| Variant ID | Hypothesis ID | Channel | Surface | Audience slice | Primary frame | Variant text | Source tag | First used | Last observed | Denominator type | Denominator | Outcome type | Outcome count | Evidence grade | Status | Decision | Qualitative signals |
|---|---|---|---|---|---|---|---|---|---|---|---:|---|---:|---|---|---|---|
| HBAG-V001 | HBAG-MSG-H1 | boutique-staff | verbal-pitch | Resort-boutique shopper | fashion-accessory-first | Tiny Amalfi-Coast accessory designed to live on your main handbag. | offline_luisa_positano_2026-03-08 | 2026-03-02 | 2026-03-08 | unknown | 0 | sales | 1 | qualitative-only | observed | keep-testing | First off-season sale at Luisa Positano suggests the fashion-led frame is at least plausible in premium resort context. |
| HBAG-V002 | HBAG-MSG-H1 | instagram-organic | caption-hook | Fashion-led tourist / aspirational buyer | fashion-accessory-first | Made to be shown on the bag, not hidden in it. | planned_ig_onbag_hook_v1 | 2026-03-09 | 2026-03-09 | unknown | 0 | unknown | 0 | planned | planned | keep-testing | Use on-bag styling visuals first; track saves, shares, and DMs once published. |
| HBAG-V003 | HBAG-MSG-H1 | homepage | hero-line | DTC visitor | fashion-accessory-first | An Amalfi-Coast accessory for the bag you already love. | planned_homepage_hero_v1 | 2026-03-09 | 2026-03-09 | unknown | 0 | unknown | 0 | planned | planned | keep-testing | Good candidate for the first site headline because it leads with place plus fashion context. |
| HBAG-V004 | HBAG-MSG-H2 | boutique-staff | product-card | Gift buyer / resort shopper | gift-discovery | A small Positano find that feels like a real gift. | planned_boutique_gift_card_v1 | 2026-03-09 | 2026-03-09 | unknown | 0 | unknown | 0 | planned | planned | keep-testing | Test this on packaging insert or product card rather than as the hero line. |
| HBAG-V005 | HBAG-MSG-H3 | product-card | supportive-use-case | Buyer needing justification | supportive-utility | Clips onto your main bag and carries AirPods, cards, lipstick, keys, or other tiny essentials. | planned_product_card_utility_v1 | 2026-03-09 | 2026-03-09 | unknown | 0 | unknown | 0 | planned | planned | keep-testing | Utility should support the fashion pitch, not replace it. |
| HBAG-V006 | HBAG-MSG-H4 | product-roadmap | sub-line-note | Internal / future retail discussion | dog-subline | Dog-bag-holder framing only as a contained later sub-line. | deferred_dog_subline_2026q1 | 2026-03-09 | 2026-03-09 | unknown | 0 | unknown | 0 | planned | deferred | defer | Keep out of homepage, main boutique pitch, and launch captions until brand signal is clearer. |

## Gate Status

- CAP-02 initialization: Pass
- Paid-activation denominator floor: Not yet passed
- Current blocker: no denominator-bearing rows yet for HBAG-MSG-H1, HBAG-MSG-H2, or HBAG-MSG-H3

## Next Capture Actions

- Log the first 2 social caption variants with impression and DM denominators.
- Log the first homepage / PDP hero test once the site surface exists.
- Capture boutique staff wording, product-card wording, and any customer reaction language during each Luisa Positano check-in.
- Promote or retire frames only after at least 2 denominator-bearing rows exist for the active hypothesis.
