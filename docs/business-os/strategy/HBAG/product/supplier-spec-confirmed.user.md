---
Type: Supplier-Spec
Business: HBAG
Business-Name: Caryina
Status: Awaiting-Supplier-Response
Created: 2026-02-28
Owner: Pete
Relates-to-plan: docs/plans/hbag-pdp-material-specs/plan.md
---

# Caryina Supplier Spec Confirmation

## Purpose

This document captures confirmed material and physical specification data from the supplier for all three Caryina bag charm variants. It is the gating input for populating `products.json` with spec data and rendering the Details section on the product detail page.

**Agent-side work is complete (TASK-02, TASK-03, TASK-06 done). This document blocks CHECKPOINT-04, TASK-05, TASK-07, and TASK-08.**

---

## Supplier Query Template

Send the text below to your supplier contact. The V3 hardware note is the highest-priority item — this conflict was observed in product photos and must be resolved before populating data.

---

**Subject:** Product specifications for [product name] — 3 colour variants

Hi [name],

Could you please confirm the exact product specifications for our three [product name] colourways (the silver metallic, the pink/white croc, and the peach)?

For each variant please confirm:

1. **Exterior shell material** — e.g. "PU leather", "split leather", "microfibre PU", specific grade or name
2. **Hardware material and finish** — e.g. "zinc alloy, gold electroplating 3-micron", "brass, silver plating"
3. **Interior lining** — material type and colour
4. **Dimensions when closed** — Height × Width × Depth in millimetres
5. **Weight without packaging** — in grams
6. **Country of manufacture** — expected: China

**Additional note for the peach colourway (V3):** In our product photos the clasp plate appears to have a different finish to the other hardware (possibly silver-tone plate with gold-tone twist element). Could you confirm the exact finish for V3's clasp and keeper bars?

Many thanks.

---

## Confirmed Data — Fill in after receiving supplier response

Replace each `[TBC]` with the confirmed value. Leave no `[TBC]` values when submitting to CHECKPOINT-04.

### V1 — Silver (metallic reptile-emboss exterior)

| Spec field | Confirmed value |
|---|---|
| Exterior shell material | [TBC] |
| Hardware material and finish | [TBC] |
| Interior lining | [TBC] |
| Dimensions H × W × D (mm) | [TBC] × [TBC] × [TBC] |
| Weight (g) | [TBC] |
| Country of manufacture | [TBC] |

### V2 — Rose Splash (croc-emboss with pink splatter exterior)

| Spec field | Confirmed value |
|---|---|
| Exterior shell material | [TBC] |
| Hardware material and finish | [TBC] |
| Interior lining | [TBC] |
| Dimensions H × W × D (mm) | [TBC] × [TBC] × [TBC] |
| Weight (g) | [TBC] |
| Country of manufacture | [TBC] |

### V3 — Peach (pebbled grain exterior)

| Spec field | Confirmed value |
|---|---|
| Exterior shell material | [TBC] |
| Hardware material and finish | [TBC] (confirm clasp plate finish — silver-tone or gold-tone?) |
| Interior lining | [TBC] |
| Dimensions H × W × D (mm) | [TBC] × [TBC] × [TBC] |
| Weight (g) | [TBC] |
| Country of manufacture | [TBC] |

---

## Compliance Notes (do not change)

- Do NOT use the claim "Made in Italy" regardless of design or brand origin — Italian Law 166/2009 and EU origin marking rules prohibit this unless the product is substantially manufactured in Italy. The correct provenance claim is "Designed in Positano, Italy".
- If any value cannot be confirmed by the supplier (e.g. exact weight), record this explicitly (e.g. "Supplier unable to confirm — estimated [X]g"). Do not leave it blank or use [TBC].

---

## Edge Case: If supplier cannot provide all fields

If the supplier cannot confirm weight or exact dimensions, raise this before proceeding to CHECKPOINT-04. Two options exist:

- (a) Defer the spec section until all data is available (recommended — partial display is worse than no display)
- (b) Omit the specific missing field and adjust the render gate to match what is available

This decision requires operator input — record which option Pete selects here before proceeding.

**Decision made:** [TBC — fill in if supplier cannot confirm all fields]
