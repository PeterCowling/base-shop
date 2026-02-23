---
Type: Problem-Statement
Stage: ASSESSMENT-01
Business: HEAD
Status: Active
Created: 2026-02-20
Updated: 2026-02-20
Method: back-propagated from DISCOVERY intake packet + S2B offer + S2 market intel + brand dossier; enriched with external research (CI demographics, community evidence, comfort failure modes, WTP signals)
Downstream: docs/business-os/strategy/HEAD/2026-02-20-solution-profiling-prompt.md
---

# Problem Statement — HEAD

## Core Problem

Parents/caregivers of children who wear external cochlear implant (CI) sound processors, and active teen/adult wearers, lack a reliable, low-friction system to (a) keep processors secure on the head through normal activity and (b) keep small, mission-critical accessories (spare coil, batteries, pods, retention parts) organised and transferable across daily handovers.

This causes drops, near-loss events, and repeated "where is it / who has it" moments, creating daily stress, time waste, social friction, and financial risk from damage or loss of expensive components.

---

## Affected User Groups

### Primary: Caregivers of children wearing external CI processors

- **Child age range**: ~12 months to ~12 years (`research-confirmed`). In Italy ~55% of children are implanted before 24 months; median age at implantation is ~16 months globally. Equipment management responsibility begins before age 2 and persists for roughly a decade.
- **Problem appears at routine choke points**: morning setup, leaving the house, school drop-off/pick-up, sport changing rooms, bedtime, travel days.
- **Multi-caregiver context**: compounded when multiple adults share responsibility (two parents, school staff, grandparents). "Who has it / where is it" is a coordination failure, not just a retention failure.
- **Cross-brand compatibility**: processors come from three manufacturers (Cochlear, MED-EL, Advanced Bionics) with different physical forms; accessory compatibility varies across brands and is a purchase-decision blocker (`research-inferred`; see market intel for brand share data).

### Secondary: Active teen and adult CI processor wearers (self-purchasers)

- **Age range**: ~16–45, activity-oriented and/or commute-heavy (`hypothesis; not yet first-party measured`).
- **Primary friction**: slippage/dislodgement during movement; accessory loss in bags and transit.
- **Comfort failures with existing retention products**: heat build-up, pressure on the magnet site, skin irritation, inconsistent positioning, and glasses incompatibility are all documented in community forums and manufacturer support pages — causing wearers to remove retention aids, which increases drop risk.

### Tertiary: Gift and recommender purchasers (evidence-thin)

- Family members, friends, audiologists and clinics who suggest accessories.
- Needs: confidence in compatibility + "safe choice" brand trust + clear sizing guidance.
- Classify as awareness opportunity only; not a primary ICP until first-party evidence exists.

---

## Severity and Frequency

### Caregiver segment

- **Frequency**: daily (morning setup) + multiple handovers per week.
- **Severity**: high. The spare coil (external magnetic disc) is the most commonly lost single item; a dropped processor is a high-cost replacement event. The British Cochlear Implant Group (BCIG) has published formal guidance on "lost processors" — a professional body publishing a guidance document on a problem is a reliable proxy for how common and serious it is.
- **Near-miss events** create routine drag even without loss.
- **Emotional load**: high. Child comfort, social normalisation, fear of loss, and guilt/blame during handover failures compound the practical cost.

### Active wearer segment

- **Frequency**: several times per week for sport/commute patterns (`hypothesis; not yet measured`).
- **Severity**: moderate-to-high. Comfort failures with existing products add severity by causing wearers to remove aids entirely.

### Evidence note

Frequency and severity confirmed at community-signal level (forum discussions, BCIG formal guidance, competitor product existence as demand proxy). Quantitative incident data — drops per month, cost per incident — remain an evidence gap requiring first-party measurement.

---

## Current Workarounds and Why They Fail

### 1. Manufacturer accessories
Each of the three main CI manufacturers (Cochlear, MED-EL, Advanced Bionics) offers retention headbands, clips, and carry cases. **Structural gap**: brand-locked compatibility means no product works across all processor types; design language is clinical/functional rather than lifestyle-led; no cross-brand "system" or routine framing exists. Full product catalog with named products, prices, and documented failure modes is in `docs/business-os/strategy/HEAD/2026-02-20-solution-profiling-prompt.md`.

### 2. Third-party retention products
An active third-party market exists (Etsy sellers, independent DTC brands at EUR21–38 for functional headbands). **Structural gap**: no brand coherence across accessory types, no Italian-language support, inconsistent sizing guidance, and no compatibility guarantee across processor models. Third-party product catalog is in `docs/business-os/strategy/HEAD/2026-02-20-solution-profiling-prompt.md`.

### 3. DIY and improvised solutions
Tape, hair ties, repurposed elastic bands — documented in community forums as active workarounds. **Structural gap**: inconsistent, not durable, socially awkward for school-age children, not a repeatable system.

### 4. Behavioural compensation (going without)
Extra checking behaviour, restricting activities, avoiding high-risk contexts. **Structural gap**: high cognitive load; limits child's activity participation; solves nothing structurally.

### 5. Organisation: no systematic workaround
Parents use ad-hoc combinations of manufacturer cases, school bags, and verbal handover instructions. The absence of a purpose-built kit system is itself the gap — it manifests as repeated incidents rather than stable adapted behaviour.

---

## Evidence Pointers

- **BCIG lost-processor formal guidance** (bcig.org.uk): professional body publication on a specific problem = confirmed severity and frequency at population level.
- **Active third-party market at EUR21–38 WTP**: independent DTC sellers with verifiable review volumes confirm willingness to pay beyond manufacturer range (source: Etsy/retail listings; detail in market intel).
- **Italian CI installed base ~17,000–20,000 users; ~1,595 new implantations/year (2023)**: niche but viable; market refreshes continuously (MDPI 2024/2025 Italian incidence study; brand dossier).
- **EU total ~500,000 users; ~25,000 new/year** (EURO-CIU): expansion market is substantial.
- **Community forums actively discuss the problem**: HearPeers, HearingTracker retention thread, CI Facebook groups (18,000+ members across 60 groups) — the problem is a live, recurring topic in self-organised communities.
- **Operator has purchased inventory**: founder-level validation signal.

**Known evidence gaps**: no first-party interviews, no cohort return data, no measured incident frequency, no Italian-language CI community identified. Full evidence inventory is in `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md` Section I.

---

## Problem Boundary

### In-scope
- Retention, comfort, and aesthetic solutions for people who already wear external CI processors.
- Organisation of small accessories ("daily kit") and "kit completeness" during handovers/travel.

### Out-of-scope / non-claims
- No promise to improve hearing, clinical outcomes, or device performance.
- Not a medical device; avoid medical efficacy framing.
- Tether-class products (safety cords, lanyard-style retention) deferred behind child-safety engineering gate — strangulation risk warnings documented by AB and Cochlear.

---

## Open Questions (First-Priority Validation Checklist)

These are the 8 questions most directly relevant to confirming the problem is real and who has it. Answer before advancing to offer or channel design. Full product, channel, and requirements questions are in `docs/business-os/strategy/HEAD/2026-02-20-solution-profiling-prompt.md`.

1. In the last 30 days, how many times did the processor fall off or nearly fall off?
2. How many times were accessories misplaced or "couldn't find at handover"?
3. What does "success" look like in 10 seconds for the morning routine?
4. What have you already bought, and what did you like/hate specifically?
5. What price feels "obvious yes" / "maybe" / "no way" for a retention band?
6. How many would you buy: 1 for home, 1 for school bag, 1 spare?
7. What accessories are actually in your current kit (list the items)?
8. Where do accessories currently live, and which location fails most?

---

## Kill Conditions

### 1. Market too small to support DTC economics
**PASS (provisional)** — Italy ~17k–20k users; EU ~500k; ~25k new European implantations/year. DTC unit economics viable at niche scale given EUR21–38 WTP evidence and repeat-purchase potential. Needs EU/US expansion model and realistic conversion assumptions.

### 2. Incumbents fully solve the problem
**PASS** — Manufacturer accessories are functional but brand-locked and clinically coded. Third-party market validates demand for alternatives but is fragmented and English-language only. No coherent Italian-language lifestyle brand with cross-compatible range architecture exists.

### 3. Pain insufficient to drive willingness-to-pay
**PASS (provisional)** — WTP EUR21–38 confirmed for functional retention; EUR2.50–20 for decorative/personalisation. Daily frequency and financial replacement risk provide strong purchase motivation. Needs first-party WTP confirmation from Italian buyers.

**Verdict: GO (with explicit validation gap)** — proceed to solution-profiling exploration in parallel with first-party validation (customer interviews + early cohort instrumentation).

---

---

## Downstream Artifacts

| Artifact | Path | Stage | Status |
|---|---|---|---|
| Solution-profiling prompt | `2026-02-20-solution-profiling-prompt.md` | ASSESSMENT-02 | 2026-02-20 |
| Solution-profiling results | `2026-02-20-solution-profile-results.user.md` | ASSESSMENT-02 | 2026-02-20 |
| Option selection decision | `solution-select.user.md` | ASSESSMENT-03 | 2026-02-20 |
| Naming research prompt | `candidate-names-prompt.md` | ASSESSMENT-04 | 2026-02-19 |
| Naming shortlist results | `2026-02-20-candidate-names.user.md` | ASSESSMENT-04 | 2026-02-20 |

## Key Sources

- `docs/business-os/market-research/HEAD/2026-02-20-market-intelligence.user.md` (full evidence inventory including Section I addendum)
- `docs/business-os/startup-baselines/HEAD-intake-packet.user.md`
- BCIG lost-processor guidance (bcig.org.uk)
- MDPI 2024/2025 Italian CI incidence study
- EURO-CIU European prevalence estimate
