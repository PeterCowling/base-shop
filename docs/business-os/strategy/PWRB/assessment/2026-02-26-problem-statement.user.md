---
Type: Problem-Statement
Stage: ASSESSMENT-01
Business: PWRB
Status: Active
Created: 2026-02-26
Method: back-propagated from PWRB plan.user.md (offline operator decision sessions, 2026-01-29); enriched with global shared-powerbank market data and Amalfi Coast tourism statistics
Back-propagated-from: PWRB plan.user.md (strategy decisions PWRB-DEC-2026-01-29-01 through -08)
Research-appendix: none
Downstream: docs/business-os/strategy/PWRB/2026-02-26-solution-profiling-prompt.md
Owner: Pete
Review-trigger: After first pilot operational data is collected; after PSP validation resolves.
---

# Problem Statement — PWRB

## Core Problem

Tourists exploring the Amalfi Coast rely entirely on their smartphones for navigation, photography, real-time transport (SITA buses, ferries), and staying in contact with travel companions. Exploration days routinely run 6–10+ hours — hiking trails, ferry hops between towns, long lunch stops, afternoon at a beach club, evening passeggiata — with no predictable, convenient access to phone charging along the route.

They face a forced choice with no comfortable middle option:

- **Carry a personal powerbank** — which is practical if they remembered to pack one, charge it the night before, and are willing to carry weight all day. For air travellers (the majority of Amalfi Coast visitors), a powerbank they buy for the trip is an item to manage on the flight home. For those arriving without one, buying a cheap €15–€20 unit at a local tobacconist or Chinese goods shop solves the immediate charge but adds kit they'll throw away or struggle to take back through security.
- **Find a café or charging point** — which requires stopping, spending, and being tethered to a socket while the phone charges. Not possible while walking a coastal path, waiting for a bus, or on a ferry between Positano and Amalfi. Charging infrastructure is concentrated inside hospitality venues; it disappears the moment a tourist leaves the table.

The result: tourists with dead or near-dead phones lose access to navigation, miss photo moments at peak-attraction arrivals, experience mounting anxiety that begins to shape their behaviour (cutting the day short, staying near the hotel, avoiding longer hikes), and occasionally find themselves without the ability to contact companions or call transport in a coastal area with unreliable cellular coverage in places.

---

## Affected User Groups

### Group 1 — International tourists on a 1–5 day visit (primary)

International visitors staying 1–5 nights in the area (Sorrento, Positano, Ravello, Amalfi), typically touring the coast as one stop in a wider Italy itinerary. High daily spend, high photo/navigation dependency. This group typically flies in, making carry-back of a new powerbank a nuisance rather than a trivial decision.

- Motivation to solve: maximise the trip — don't miss the shot from the Via Positanesi d'America lookout because the phone died at 9%.
- Segment note: international visitors dominate in June–September (peak season). Nationality breakdown skews to US, UK, Germany, France, Scandinavia — all with strong smartphone dependency and SIM/data plans that work in Italy. `(inferred from general Amalfi tourism data; not first-party measured)`

Confidence: `(inferred from tourism statistics + operator direct observation)`

### Group 2 — Italian domestic tourists and weekend visitors (secondary)

Italians and Italian-resident Europeans on 1–3 day breaks in the area, typically arriving by car and staying in Sorrento or Vico Equense. Slightly lower daily spend, but the same navigational and photographic dependency. More likely to own and carry a personal powerbank, but not reliably.

- Motivation to solve: convenience during a full exploration day; avoiding the friction of going back to the car or hotel mid-day to charge.
- Segment note: the domestic segment is more price-sensitive and may require a lower entry rental price point to convert. `(hypothesis; not yet measured)`

Confidence: `(inferred)`

### Group 3 — Day-trippers arriving by ferry or coach (tertiary)

Day visitors arriving by organised coach tour or high-speed ferry from Naples or Salerno — typically 4–8 hours on the coast. Least likely to have planned ahead with charging. Highest battery risk because the trip is a single uninterrupted day with nowhere to leave the phone to charge.

- Evidence: thin. The operator's IPEI customer base provides some proximity to this group through venue operations but no direct survey data exists.

Confidence: `(hypothesis; not yet measured)`

---

## Severity and Frequency

**Group 1 — International tourist:**
- Frequency: once per visit day; affects 30–60% of a multi-day trip on heavy-use days `(inferred; no first-party data)`
- Severity: moderate-to-high — dead phone during peak attraction visit = missed photos, navigation failure, and potential isolation from travel companions. Financial cost of buying a replacement powerbank: €15–€20 for a low-quality unit `(operator observation, claimed-by-sources)`; emotional cost: anxiety from ~50% battery onward that shapes active behaviour `(inferred from global tourist behaviour studies)`

**Group 2 — Domestic tourist:**
- Frequency: lower; ~1 in 3 exploration days without planning ahead `(hypothesis; not yet measured)`
- Severity: moderate — navigation less critical (familiar country), but photography and contact dependency same as Group 1 `(inferred)`

**Group 3 — Day-tripper:**
- Frequency: every tour day; by definition no base to return to `(inferred)`
- Severity: high for their compressed window — a dead phone at 14:00 of an 8-hour visit represents half the photographic opportunity lost `(inferred)`

---

## Current Workarounds

| Workaround | What it wins | Where it loses | Failure state left unresolved |
|---|---|---|---|
| Personal powerbank (carried from home) | Full control; unlimited re-use; no new purchase | Requires pack-ahead discipline; extra carry weight for air travellers; forgot/not charged last night | Not available to the significant share who didn't bring one; charged-but-at-hotel failure remains |
| Buy cheap local powerbank (tobacconist, Chinese goods shop) | Solves immediate charge | €15–€20 single-use spend; carry-back friction for air travellers; low quality; often 5,000–10,000mAh (1 charge) | Wasteful; the tourist still has to carry and dispose of it; doesn't solve the "on the path" problem if bought after battery already critical |
| Café/restaurant charging (socket or ask staff) | Free or low-cost | Requires table occupation; only available inside premises; not available on coastal paths, buses, ferries, or during walking | Tethered charging: tourist can't move while charging; dead phone on the path remains unsolvable |
| Hotel room charging (overnight only) | Reliable; fully charged each morning | Only works if tourist stays in hotel all morning; doesn't help with midday or afternoon drain | No rescue for a phone that dies at 14:00 on a coastal walk |
| Do nothing / "phone ration mode" | — | Tourist restricts photography and navigation; diminished experience | Anxiety persists; trip quality reduced |

### Documented Failure States

1. **"Phone died mid-hike and couldn't navigate back"** — walking routes from Nocelle to Positano (Sentiero degli Dei section) have no charging points and unreliable cellular coverage in sections. A dead phone mid-route creates a genuine safety/anxiety event. `(operator direct knowledge; geography confirmed)`
2. **"Bought a powerbank and binned it at the airport"** — casual observation pattern in tourist retail. Common enough that airport bins near electronics shops are stocked with discarded chargers and cheap powerbanks at end-of-trip. `(claimed-by-sources; operator direct observation)`
3. **"Couldn't pay for the ferry because the Trenitalia app was dead"** — increasing shift to mobile-only payment and ticketing (ferries, SITA buses accepting mobile top-up) makes dead-phone a transactional failure, not just a convenience issue. `(inferred from ticketing system trends; not directly measured)`

---

## Evidence Pointers

- **Amalfi Coast: 2.3M+ overnight stays in 2024 (record year)** `(claimed-by-sources — Statista, Campania Regional Tourism 2024)` — tourist density validates the unit market size at even low penetration rates
- **Luxury tourist daily spend $391–$1,098/person/day on the Amalfi Coast** `(claimed-by-sources — True Luxury Travels 2024)` — confirms WTP headroom; a €3–6 powerbank rental is sub-1% of daily spend for the primary segment
- **Global shared powerbank rental market: ~$1.4B in 2023, forecast ~$2.3B by 2029** `(claimed-by-sources — market research reports; multiple secondary sources)` — validates the category model and pricing (typically €1–5/hour or flat €3–8/day)
- **Shared powerbank networks operational in UK, Germany, Netherlands, Spain, Scandinavia** (Anker PowerHouse, JuiceBar, similar) `(claimed-by-sources)` — category is proven; Amalfi Coast specifically has no coverage as of 2026 `(operator direct knowledge)`
- **IPEI existing customer base gives direct access to 10+ tourist-facing venues** `(operator direct knowledge)` — removes cold-start distribution problem that shared powerbank networks typically face
- **Bus and ferry ticketing shift to mobile-only apps on key Amalfi routes** `(inferred from operator knowledge of SITA/ferry payment systems)` — increases severity of dead-phone event from inconvenience to potential transaction blocker
- **Heavy-use smartphone drain rate**: navigation + photos + cellular = typical 40–60% battery drain per 4-hour outdoor block `(claimed-by-sources — device battery studies; not specific to tourism context)`

**Known evidence gaps:**
- No first-party survey data on % of Amalfi Coast tourists experiencing dead-phone events
- No measured WTP at €3–6/day rental price point specifically for this geography
- No first-party data distinguishing Group 1 vs. Group 2 incidence rates

---

## Problem Boundary

**In-scope:**
- On-demand short-term powerbank rental (not purchase) for tourists in transit in the Amalfi Coast area
- Return-anywhere network model: tourist picks up at one venue, returns at any participating venue
- Coverage focused on tourist movement patterns: high-street commercial locations, restaurants, hotels, beach clubs within the defined core and seasonal ring towns

**Out-of-scope / non-claims:**
- Permanent infrastructure ownership (stations are removable rental units, not fixed installations)
- Long-term or subscription charging (this is a tourist use case, not a resident utility)
- Any data collection beyond what is required for deposit management and return tracking — no passive location tracking of tourist devices
- Coverage promises outside the defined network map; the live return-map is the source of truth, not static signage

---

## Open Questions (First-Priority Validation Checklist)

These 8 questions require first-party validation before advancing to offer or channel design. Full product, channel, and requirements questions will be in the ASSESSMENT-02 prompt.

1. On their last Amalfi Coast visit day, at what point did tourists' battery fall below 20%? Was it before or after the key attraction visit? (Validates frequency and timing of the critical event.)
2. What did tourists do when their phone battery became critical during active exploration — did they change behaviour, find a charging point, or keep going? (Validates severity and workaround efficacy.)
3. Would tourists pay €3–6 for a day's powerbank rental if they could pick it up at a café/hotel and return it at any partner venue? (Validates WTP at target price point.)
4. Does a €25 deposit-hold (not a charge) feel acceptable or alarming? Specifically, does "we hold €25 on your card, released when you return it" require explanation, or is it a known model from car rental / library contexts? (Validates deposit UX risk — PWRB-RISK-001.)
5. What % of international visitors to the Amalfi Coast fly in vs. drive? (Determines the "carry a powerbank vs. disposable purchase" dynamic by segment.)
6. How often do tourists carry a personal powerbank when they travel to the Amalfi Coast, and is it charged/available during active exploration? (Directly sizes the addressable gap within the tourist population.)
7. What is the actual first-time discovery moment — at hotel check-in, at the venue when they're already low, or before they leave in the morning? (Determines where placement and marketing spend belongs.)
8. For venue operators in the IPEI customer base: how many dead-phone requests do they currently receive, and how do they handle them? (Validates demand signal at the venue level and confirms willingness to host stations.)

---

## Kill Conditions

### 1. Market too small to support pilot economics

**Status:** PASS (provisional)

**Evidence basis:** 2.3M overnight stays/year. At a modest 10 venues × 2 rentals/station/day × ~200 peak-season days × €4 average rental = ~€16,000 gross revenue in year-one pilot. After 20–30% venue revenue share, this represents a thin but operational cash-flow for a 10-station pilot with hardware amortised over 2–3 seasons. The kill condition here is not market size — it's unit economics per station. The €3–6 pricing ladder needs to sustain ≥2 rentals/day/station to break even against connectivity + ops cost.

**Unblocked by:** Pilot station P&L after 4 weeks of operation. If rentals/day/station < 1.0 at peak season, the economics don't work at 10 venues; the model requires either higher pricing or denser network effects.

### 2. Incumbents fully solve the problem

**Status:** PASS

**Evidence basis:** As of 2026, no shared powerbank rental network operates on the Amalfi Coast. The major global operators (Anker's retail programme, Juice, comparable Asian networks) are not present in this geography. The incumbent "solution" is café socket charging, which is tethered and location-limited. No operator has combined rental station + tourist-venue distribution + multi-town return network in this geography.

**Unblocked by:** This is a confirmed pass. Monitor for new entrant registration or pilot launch in Sorrento/Positano. If a competitor enters before PWRB reaches 10 venues, the network-density race changes the economics significantly.

### 3. Pain insufficient to drive willingness-to-pay

**Status:** PASS (provisional)

**Evidence basis:** The €3–6 price point is below 1% of daily tourist spend for the primary segment ($391–$1,098/day). Global category WTP is confirmed at comparable price points in UK/Germany markets. The deposit-hold model (not a charge) removes the "feels like I'm being charged €25" objection if communicated correctly. However, no Amalfi Coast-specific WTP test has been run. The deposit UX risk (PWRB-RISK-001) could suppress conversion if pre-auth hold is explained poorly.

**Unblocked by:** First venue pilot data — specifically the conversion rate (tourists who are offered a rental and accept vs. decline) and the reason-for-decline data from the first 200 rental interactions.

**Verdict: GO (with explicit validation gap)** — proceed to ASSESSMENT-02 (solution-profiling scan). The problem is real, the market is unserved in this geography, and the pricing is within the plausible WTP range. The critical open condition is first-party WTP validation at the deposit-hold model, which can only be resolved by running the pilot.

---

## Downstream Artifacts

| Artifact | Path | Stage | Status |
|---|---|---|---|
| Solution-space prompt | `2026-02-26-solution-profiling-prompt.md` | ASSESSMENT-02 | (pending) |
| Solution-space results | `2026-02-26-solution-profile-results.user.md` | ASSESSMENT-02 | (pending) |
| Option selection decision | `2026-02-26-solution-decision.user.md` | ASSESSMENT-03 | (pending) |
| Naming research prompt | `candidate-names-prompt.md` | ASSESSMENT-04 | (pending) |
| Distribution plan | `2026-02-26-launch-distribution-plan.user.md` | ASSESSMENT-06 | (pending) |
| Measurement plan | `2026-02-26-measurement-profile.user.md` | ASSESSMENT-07 | (pending) |
| Current situation | `2026-02-26-operator-context.user.md` | ASSESSMENT-08 | (pending) |

---

## Key Sources

- Statista / Campania Regional Tourism 2024 — Amalfi Coast overnight stay record (2.3M)
- True Luxury Travels 2024 — Amalfi Coast daily spend benchmark ($391–$1,098)
- Global shared powerbank market reports (multiple secondary — $1.4B 2023, $2.3B 2029 forecast)
- PWRB plan.user.md — operator decision record PWRB-DEC-2026-01-29-01 through -08
- Operator direct knowledge — IPEI customer base, venue relationships, geography
