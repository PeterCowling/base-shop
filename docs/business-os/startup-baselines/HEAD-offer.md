---
Type: Reference
Status: Active
business: HEAD
artifact: offer-design
created: 2026-02-20
status: hypothesis
confidence: medium-high
owner: Pete
last_updated: 2026-02-20
source_of_truth: true
depends_on:
  - docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md
  - docs/business-os/strategy/HEAD/lp-other-products-results.user.md
  - docs/business-os/contracts/HEAD/outcome-contract.user.md
decisions:
  - DEC-HEAD-CH-01
---

# HEAD Offer Design (S2B Backfill)

**Executive summary:** HEAD is an Italy-first lifestyle accessories brand for external CI processor wearers and caregivers. The core promise is non-medical: secure wear, calmer daily routines, and confident personal style. The 90-day offer stack is built around a low-risk textile-and-organisation MVP set (multi-pack headbands, organiser pouch, patch packs), with tether-class accessories deferred behind explicit safety and copy-governance gates.

---

## Section 1: ICP Segmentation

### ICP-A: Caregiver of a young child with external CI processor (Primary)

**Demographics:**
- Buyer age: typically 28-45
- Geography: Italy first (urban + suburban)
- Purchase context: school/daycare routines, family logistics, frequent repeat stress moments

**Psychographics:**
- Wants dependable routines and fewer "missing part" incidents
- Sensitive to comfort and child acceptance of wearing accessories
- Strong trust requirement: clear compatibility language, easy support, no clinical overclaim

**Jobs-to-be-done:**
- Keep processor secure through movement/play
- Reduce morning and school handover friction
- Avoid losing small accessories and expensive external components

**Buying triggers:**
- Child repeatedly pulls processor off
- School/daycare requests clearer routine setup
- Prior loss/drop incident or pre-travel preparation

---

### ICP-B: Active teen/adult CI processor wearer (Secondary)

**Demographics:**
- Age: roughly 16-45
- Geography: Italy first, EU second phase
- Context: sport, commuting, daily comfort, visible identity preference

**Psychographics:**
- Prioritises secure wear during movement and sweat
- Wants practical accessories that do not feel clinical
- Values style options that feel normalised, not concealment-driven

**Jobs-to-be-done:**
- Stabilise daily wear during active moments
- Reduce loss/drop anxiety
- Build a repeatable pack-and-go routine

**Buying triggers:**
- Sport/activity slippage experiences
- Upcoming holiday/travel/water period
- Desire for backup sets and better organisation

---

## Section 2: Pain/Promise Mapping

### ICP-A (Caregiver) pain/promise map

| Pain (Customer Language) | Promise (Our Solution) | Evidence Source |
|---|---|---|
| "It keeps getting pulled off and then we lose parts." | Comfort-first secure-wear options plus organiser workflow to reduce drop/loss chaos. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| "Mornings and school handover are too messy." | School-ready bundles (multi-pack + pods + pouch) with simple routine logic. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| "I don't want this to feel medical all day." | Lifestyle-first design language with personalisation options made to be worn proudly. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |

### ICP-B (Active wearer) pain/promise map

| Pain (Customer Language) | Promise (Our Solution) | Evidence Source |
|---|---|---|
| "It slips during movement and sport." | Secure-fit textile options including sport-focused form factors. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| "Small accessories disappear in bags." | Compartmented pouch + parts-pod system for predictable organisation. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |
| "I want practical gear that still looks like me." | Patch packs and style accessories that support identity without concealment framing. | `docs/business-os/strategy/HEAD/lp-other-products-results.user.md` |

---

## Section 3: Offer Structure

### Core offer (current + 90-day MVP)

**Current hero lane**
- Retention headbands for external CI processors (non-medical lifestyle positioning)

**90-day MVP extension lane (top 3 from S3B)**
1. School-ready multi-pack headbands
2. Activity organiser pouch (compartmented)
3. Identity patch packs

### Bundle architecture (hypothesis)

- **Starter kit (EUR29-39):** headband + patch pack + parts pod
- **School kit (EUR59-79):** 3-pack headbands + organiser pouch + patch pack
- **Sport kit (EUR45-65):** sport-oriented band + spare band + parts pods

### Included deliverables (by lane)

- Clear sizing and fit guidance
- Routine-oriented product naming and merchandising
- Non-medical copy framing (comfort/secure wear/organisation)

### Exclusions (explicit)

- No hearing outcome claims
- No therapy/treatment framing
- No tether-class child products before safety engineering gate completion

### Guarantees / risk reversals (operational hypothesis)

- Easy exchange path for fit dissatisfaction
- Clear pre-purchase compatibility guidance and support route
- Bundle-first merchandising to reduce single-SKU fragility

---

## Section 4: Positioning One-Pager

### Positioning statement (Moore template)

```
For caregivers and active wearers of external cochlear implant processors,
who need secure everyday wear and calmer daily routines,
HEAD is a lifestyle accessories brand,
that delivers comfort-first retention, organisation, and personal style without clinical framing.
Unlike generic low-trust marketplace listings or clinical-coded accessory catalogs,
because HEAD combines routine-led bundle design, clear fit guidance, and non-medical copy discipline.
```

### Category frame

- **Primary category:** lifestyle accessories for CI processor wearing routines
- **Not positioned as:** medical treatment, hearing-performance enhancer, or therapeutic device

### Competitive frame

- Compared with manufacturer retention ecosystems (function/compatibility-led)
- Compared with independent low-cost textile sellers
- Differentiation = coherent range architecture + routine design + warmer language discipline

### Key message

**"Secure wear for busy days. Calmer routines. Made to be worn proudly."**

---

## Section 5: Pricing / Packaging Hypothesis

**This is a hypothesis to validate with observed conversion, returns, and contribution.**

### Proposed pricing lanes (EUR)

| Offer lane | Hypothesis range |
|---|---:|
| Core single headband | 18-32 |
| Premium fabric headband | 24-36 |
| Multi-pack headbands | 32-48 |
| Organiser pouch | 18-34 |
| Patch packs | 6-14 |
| School kit bundle | 59-79 |

### Competitor anchor table

| Brand/surface | Observable anchor | Implication |
|---|---:|---|
| SmartEar universal headband | EUR12.90 | value tier anchor |
| Cochlear headband | EUR32.95 | premium functional anchor |
| MED-EL sport headband | EUR32.50 | sport lane anchor |
| Manufacturer activity case | EUR50.95 | organisation-value anchor |

### Price position

- Target posture: accessible-premium lifestyle tier
- Avoid race-to-bottom commodity pricing
- Use bundles to support AOV and retention economics

### Confidence level

- **Medium-high** for top-3 MVP lane (textile + storage + personalisation)
- **Medium-low** for tether-class lane until safety + legal review gate is complete

### Validation plan (first 90 days)

1. Test single-SKU vs bundle conversion by ICP segment
2. Track return reasons tied to fit and expectation mismatch
3. Test AOV lift from patch/pod attachments on pouch/headband PDPs
4. Keep spend discipline tied to outcome-contract CAC and CVR guardrails

---

## Section 6: Objection Map + Risk Reversal

| Objection | Response | Proof / Risk Reversal |
|---|---|---|
| "Will this actually stay on during busy days?" | We design for secure wear and routine stability, not hearing outcomes. | Use-case-led guidance and fit support path |
| "I'm worried I'll buy the wrong thing." | Clear product-family naming and compatibility-first guidance reduce wrong-buy risk. | Guided bundle structure + support contact path |
| "Why not buy a cheaper generic band?" | HEAD combines comfort, organisation, and lifestyle cohesion in one range system. | Bundle economics + repeat-use routine framing |
| "Is this medical equipment?" | No. HEAD products are lifestyle accessories and are not sold as treatment or therapy tools. | Copy guardrails embedded in product messaging |
| "What about safety accessories for children?" | Tether-class products are gated behind explicit safety engineering before launch. | Deferred launch policy + safety validation requirement |

---

## Brand Name Status

> Naming decision is **not final**.
>
> Current shortlist artifact: `docs/business-os/strategy/HEAD/2026-02-20-candidate-names.user.md`
> Recommended working candidate (not legally cleared): `Nidilo`

---

## Evidence Register

- `docs/business-os/strategy/HEAD/lp-other-products-results.user.md`
- `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md`
- `docs/business-os/contracts/HEAD/outcome-contract.user.md`
- `docs/business-os/strategy/HEAD/decisions/DEC-HEAD-CH-01.user.md`
- `docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md`

---

## Quality Check Self-Audit

- QC-01: All 6 sections present and complete
- QC-02: ICP is specific (caregiver primary, active wearer secondary)
- QC-03: Pricing includes competitor anchor table
- QC-04: Objection map includes 5 objections
- QC-05: Risk reversal mechanisms included
- QC-06: Confidence level explicit
- QC-07: Evidence register includes >=3 sources
- QC-08: Pain/promise map uses observed routine-language pattern
- QC-09: Positioning statement fully populated
- QC-10: Pricing rationale and validation steps defined
