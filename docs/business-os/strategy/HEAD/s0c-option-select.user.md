---
Type: Option-Selection-Decision
Stage: DISCOVERY-03
Business: HEAD
Status: Active
Created: 2026-02-20
Method: back-propagated, confirmed by live DISCOVERY-02 research run (2026-02-20); two corrections applied (see Option 1 Caveats and Option 2 Elimination)
Input: docs/business-os/strategy/HEAD/2026-02-20-solution-space-results.user.md
Input: docs/business-os/strategy/HEAD/problem-statement.user.md
Downstream: docs/business-os/strategy/HEAD/naming-research-prompt.md
---

# Option Selection Decision — HEAD (DISCOVERY-03)

---

## Evaluation Matrix

| Option | Launch Feasibility | Distribution Path | Regulatory Burden | Problem-Solution Fit | Status |
|---|---|---|---|---|---|
| 1. Textile lifestyle accessory brand | Pass | Pass | Pass | Pass | **Shortlisted** |
| 2. Digital companion app | Flag | Fail | Pass | Flag | Eliminated |
| 3. Custom/bespoke made-to-order | Pass (artisan only) | Pass | Pass | Flag | Eliminated (probe only) |
| 4. CE-marked medical device | Fail | Pass | Fail | Pass | Eliminated |
| 5. Generic children's accessories | Pass | Pass | Pass | Fail | Eliminated |
| 6. Subscription replenishment box | Flag | Flag | Pass | Flag | Eliminated |
| 7. Community marketplace/aggregator | Flag | Pass | Flag | Fail | Eliminated |

---

## Elimination Log

- **Option 2 (Digital app):** Fails distribution path — manufacturer companion apps actively provide battery status, device status, low-battery push notifications, and coil-disconnect alerts in-app (Cochlear Nucleus Smart App, MED-EL AudioKey 3, Advanced Bionics AB Remote all confirmed). An independent app with no device-data integration would have to differentiate on workflow/behavioural value alone, against a category users already expect manufacturers to cover. No clear low-CAC path to CI caregivers via an independent app; does not address the physical retention half of the problem.
- **Option 3 (Custom/bespoke):** Not a business — an artisan model with a hard production ceiling. Valid as a probe tactic (Etsy test-and-learn) feeding Option 1; not a standalone product-type choice. Problem-solution fit is flagged because bespoke cannot produce the systematic kit completeness solution the problem requires.
- **Option 4 (CE-marked medical device):** Fails both launch feasibility (12–24+ months for CE marking under EU MDR) and regulatory burden (incompatible with startup-speed execution constraint). Incumbents (Cochlear, MED-EL, AB) already occupy the clinical accessory channel with validated medical positioning.
- **Option 5 (Generic children's accessories):** Fails problem-solution fit — generic positioning forfeits the cross-brand compatibility differentiator and deactivates the CI community referral channel that gives the business its lowest-CAC distribution path. Wider addressable market does not compensate for higher CAC and loss of category focus.
- **Option 6 (Subscription box):** Flagged on both feasibility (subscription logistics overhead disproportionate to stage) and distribution (no validated CI-specific subscription model). Could be a later-stage mechanic for Option 1, not a launch-stage product-type choice.
- **Option 7 (Marketplace/aggregator):** Fails problem-solution fit — aggregation does not address structural gaps (compatibility guidance, range coherence, Italian-language support). Thin margin, no brand equity, no proprietary product.

---

## Shortlist

**1. Cross-compatible textile lifestyle accessory brand for CI processor wearers**

A DTC brand producing soft textile retention headbands, organiser pouches, and personalisation accessories for people who wear external CI processors. Products are lifestyle-coded (not clinical), cross-compatible across Cochlear / MED-EL / AB processor families, and specifically designed for the caregiver and active wearer segments. Launch sequence: own-site DTC Italy → Etsy probes → EU/US expansion.

Rationale for selection:
- Only option that addresses both the retention problem and the organisation/kit-completeness problem as a coherent system.
- Existing third-party market (Geniebands, EarSuspenders, Ear Gear) confirms WTP at EUR21–38; active community channels exist but no Italian-language, cross-compatible brand occupies the space.
- Launch feasibility is high — textile manufacturing accessible MOQs, no specialist tooling, 3–6 month path from design to first sales.
- Problem-solution fit is confirmed by downstream S2B offer work: cross-compatible lifestyle accessories with routine-led bundling directly addresses the stated problem in the language of the affected users.

Caveats:
- **Italian-language gap correction**: Live research confirms that Italian-language retail options exist (e.g. SmartEAR €18 cotton pocket headband via Italian hearing retailer; Italian B2B distributor cataloguing Cochlear/MED-EL anti-loss accessories). The defensible gap is not "no product exists" but "no cohesive, lifestyle-coded, cross-compatible DTC brand with a coherent range and Italian-first UX." Positioning must lead with range architecture and lifestyle language, not simply "Italian-language availability."
- Copy discipline is non-negotiable: EU MDR intended-purpose risk is real and controlled only through language. Eudamed actor registration becomes mandatory from 28 May 2026 — timing is live for HEAD's launch year.
- Tether-class accessories (safety cords, lanyard retention) require child-safety engineering gate before launch; must not be included in MVP. EN 14682 (children's clothing cords/drawstrings) and manufacturer strangulation warnings apply.
- First-party WTP validation from Italian buyers remains an open gap.

---

## Decision

**Status: GO**

**Carry forward:** Option 1 — cross-compatible textile lifestyle accessory brand for CI processor wearers.

**Product scope at selection:** retention headbands (launch hero), organiser pouch, identity patch packs (90-day extension lane). Full range architecture in `docs/business-os/strategy/HEAD/lp-other-products-results.user.md`.

**Next step:** Proceed to `/lp-do-discovery-04-business-name-options --business HEAD` using the selected option above. Naming research should be scoped to: lifestyle-first, Italian-accessible, coined masterbrand that can extend beyond headbands to the full accessory range. See `docs/business-os/strategy/HEAD/naming-research-prompt.md` (DISCOVERY-04).
